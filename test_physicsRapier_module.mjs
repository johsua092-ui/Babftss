// TES physicsRapier.js (drop-in replacement) — API sama, mesin rapier
import * as THREE from 'three';
import * as PH from './src/utils/physicsRapier.js';

let pass = 0, fail = 0;
const check = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); c ? pass++ : fail++; };

const ok = await PH.initRapierPhysics();
console.log('init rapier:', ok);
check(ok, 'init berhasil');

function mkBlock(slug, x, y, z, rot) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial());
  m.position.set(x,y,z); m.scale.set(1,1,1);
  m.userData = { isBlock: true, blockSlug: slug };
  if (rot) m.quaternion.set(rot[0],rot[1],rot[2],rot[3]);
  m.updateMatrixWorld(true);
  return m;
}

console.log('');
console.log('=== 1. ANCHORED: block terkunci tidak jatuh ===');
{
  const b = mkBlock('stone_block', 0, 6, 0);
  b.userData.anchored = true;
  PH.ensureBody(b); PH.sleepBody(b);
  const y0 = b.position.y;
  for (let i=0;i<240;i++) PH.stepWorld(THREE, [], PH.FIXED_DT, 0, [{mesh:b}]);
  console.log('   y:', b.position.y.toFixed(4), '(awal', y0, ')');
  check(Math.abs(b.position.y - y0) < 1e-6, 'anchored: posisi tidak berubah');
}

console.log('');
console.log('=== 2. LEPAS ANCHOR: block JATUH ke tanah ===');
{
  const b = mkBlock('stone_block', 0, 6, 0);
  b.userData.anchored = true;
  PH.ensureBody(b);
  b.userData.anchored = false;
  PH.wakeBody(b);
  for (let i=0;i<240;i++) PH.stepWorld(THREE, [{mesh:b}], PH.FIXED_DT, 0, []);
  console.log('   y akhir:', b.position.y.toFixed(4));
  check(b.position.y < 1.0 && b.position.y > 0.3, `jatuh & berhenti di tanah (y=${b.position.y.toFixed(3)})`);
}

console.log('');
console.log('=== 3. BOUNCY DIROTASI KACAU -> MEMANTUL KACAU (target user!) ===');
{
  const ang = 0.9, s = Math.sin(ang/2);
  const b = mkBlock('bouncy_block', 0, 6, 0, [0.4*s, 0.5*s, 0.77*s, Math.cos(ang/2)]);
  b.userData.anchored = false;
  PH.ensureBody(b); PH.wakeBody(b);
  for (let i=0;i<720;i++) PH.stepWorld(THREE, [{mesh:b}], PH.FIXED_DT, 0, []);
  const geser = Math.hypot(b.position.x, b.position.z);
  const q = b.quaternion;
  const beda = Math.abs(q.x-0.4*s)+Math.abs(q.y-0.5*s)+Math.abs(q.z-0.77*s)+Math.abs(q.w-Math.cos(ang/2));
  console.log('   geser horizontal:', geser.toFixed(4), '| perubahan orientasi:', beda.toFixed(4));
  check(geser > 0.05, `block BERGESER MENYAMPING (geser=${geser.toFixed(3)}) — mesin lama: 0.0000`);
  check(beda > 0.01, `block BERPUTAR (delta=${beda.toFixed(3)}) — mesin lama: 0.0000`);
}

console.log('');
console.log('=== 4. ICE vs GRASS ===');
{
  function slide(slug, friction) {
    // ISOLASI: dunia rapier global -> bersihkan dulu (kalau tidak, block lama
    // masih ada & bisa menghalangi/menumpuk).
    PH.clearAllBodies();
    const b = mkBlock(slug, 0, 0.5, 0);
    b.userData.anchored = false;
    PH.ensureBody(b); PH.wakeBody(b);
    const body = b.userData.__rapierBody;
    if (body) body.setLinvel({x:6,y:0,z:0}, true);
    for (let i=0;i<480;i++) PH.stepWorld(THREE, [{mesh:b}], PH.FIXED_DT, 0, []);
    return Math.abs(b.position.x);
  }
  const ice = slide('ice_block'), grass = slide('grass_block');
  console.log('   ice:', ice.toFixed(3), '| grass:', grass.toFixed(3));
  check(ice > grass, `ice meluncur lebih jauh (${ice.toFixed(2)} > ${grass.toFixed(2)})`);
}

console.log('');
console.log('=== 5. BLOCK DUDUK DI ATAS BLOCK ===');
{
  const bawah = mkBlock('stone_block', 0, 0.5, 0);
  bawah.userData.anchored = true; PH.ensureBody(bawah);
  const atas = mkBlock('stone_block', 0, 5, 0);
  atas.userData.anchored = false; PH.ensureBody(atas); PH.wakeBody(atas);
  for (let i=0;i<360;i++) PH.stepWorld(THREE, [{mesh:atas}], PH.FIXED_DT, 0, [{mesh:bawah}]);
  console.log('   y block atas:', atas.position.y.toFixed(4), '(harus ~1.5)');
  check(atas.position.y > 1.3 && atas.position.y < 1.8, `mendarat di atas block bawah (y=${atas.position.y.toFixed(3)})`);
}

console.log('');
console.log('=== 6. PERFORMA: 200 block jatuh ===');
{
  const bs = [];
  for (let i=0;i<200;i++) {
    const b = mkBlock('stone_block', (i%20)*3-30, 10+Math.floor(i/20)*3, 0);
    b.userData.anchored = false;
    PH.ensureBody(b); PH.wakeBody(b);
    bs.push({mesh:b});
  }
  const t0 = performance.now();
  for (let i=0;i<300;i++) PH.stepWorld(THREE, bs, PH.FIXED_DT, 0, []);
  const ms = performance.now()-t0;
  console.log(`   200 block x 300 step = ${ms.toFixed(0)} ms (${(ms/300).toFixed(2)} ms/step)`);
  check(ms/300 < 16, `cukup ringan (< 16ms/step): ${(ms/300).toFixed(2)} ms`);
}

console.log('');
console.log(`RESULT ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
