// TES FITUR BARU: Collision ON/OFF + Shadow
// (Shadow tidak bisa diuji di Node — hanya property Three.js; diuji di browser.)
import * as THREE from 'three';
import * as PH from './src/utils/physicsRapier.js';
await PH.initRapierPhysics();

let pass=0, fail=0;
const check=(c,m)=>{ console.log((c?'  PASS  ':'  FAIL  ')+m); c?pass++:fail++; };
const SEC=(s)=>Math.ceil(s/PH.FIXED_DT);

function mk(slug, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial());
  m.position.set(x,y,z); m.scale.set(1,1,1);
  m.userData = { isBlock:true, blockSlug:slug, anchored:true };
  m.updateMatrixWorld(true); return m;
}
function step(bodies, statics, sec) {
  for (let i=0;i<SEC(sec);i++) PH.stepWorld(THREE, bodies.map(m=>({mesh:m})), PH.FIXED_DT, 0, statics.map(m=>({mesh:m})));
}

console.log('═══ 1. COLLISION OFF → block TEMBUS (tidak bertumpuk) ═══');
{
  PH.clearAllBodies();
  const bawah = mk('stone_block', 0, 0.5, 0);   // anchored, padat
  PH.ensureBody(bawah); PH.sleepBody(bawah);
  const atas = mk('stone_block', 0, 5, 0);
  PH.ensureBody(atas); PH.sleepBody(atas);
  // matikan collision block atas
  PH.setBodyCollision(atas, false);
  atas.userData.anchored = false; PH.wakeBody(atas);
  step([atas], [bawah], 3);
  console.log(`   y block atas = ${atas.position.y.toFixed(2)} (kalau padat: 1.5)`);
  check(atas.position.y < 0, `TEMBUS melewati block bawah (y=${atas.position.y.toFixed(1)} < 0)`);
}

console.log('');
console.log('═══ 2. COLLISION ON (normal) → tetap bertumpuk ═══');
{
  PH.clearAllBodies();
  const bawah = mk('stone_block', 0, 0.5, 0);
  PH.ensureBody(bawah); PH.sleepBody(bawah);
  const atas = mk('stone_block', 0, 5, 0);
  PH.ensureBody(atas); PH.sleepBody(atas);
  PH.setBodyCollision(atas, true);          // pastikan ON
  atas.userData.anchored = false; PH.wakeBody(atas);
  step([atas], [bawah], 3);
  console.log(`   y block atas = ${atas.position.y.toFixed(3)} (harus 1.5)`);
  check(Math.abs(atas.position.y - 1.5) < 0.05, `bertumpuk normal (y=${atas.position.y.toFixed(2)})`);
}

console.log('');
console.log('═══ 3. COLLISION OFF + anchor off → jatuh tembus lantai (menuju void) ═══');
{
  PH.clearAllBodies();
  const b = mk('stone_block', 0, 5, 0);
  PH.ensureBody(b); PH.sleepBody(b);
  PH.setBodyCollision(b, false);
  b.userData.anchored = false; PH.wakeBody(b);
  step([b], [], 3);
  console.log(`   y = ${b.position.y.toFixed(2)} (harus jauh di bawah 0)`);
  check(b.position.y < -5, `jatuh menembus lantai (y=${b.position.y.toFixed(1)})`);
}

console.log('');
console.log('═══ 4. COLLISION OFF lalu ON lagi → kembali padat ═══');
{
  PH.clearAllBodies();
  const bawah = mk('stone_block', 0, 0.5, 0);
  PH.ensureBody(bawah); PH.sleepBody(bawah);
  const atas = mk('stone_block', 0, 5, 0);
  PH.ensureBody(atas); PH.sleepBody(atas);
  PH.setBodyCollision(atas, false);         // off
  PH.setBodyCollision(atas, true);          // on lagi
  atas.userData.anchored = false; PH.wakeBody(atas);
  step([atas], [bawah], 3);
  console.log(`   y = ${atas.position.y.toFixed(3)} (harus 1.5)`);
  check(Math.abs(atas.position.y - 1.5) < 0.05, `collision ON kembali → padat (y=${atas.position.y.toFixed(2)})`);
}

console.log('');
console.log('═══ 5. flag noCollision tersimpan di userData ═══');
{
  PH.clearAllBodies();
  const b = mk('stone_block', 0, 5, 0);
  PH.ensureBody(b);
  PH.setBodyCollision(b, false);
  check(b.userData.noCollision === true, 'userData.noCollision = true saat dimatikan');
  PH.setBodyCollision(b, true);
  check(b.userData.noCollision === false, 'userData.noCollision = false saat dinyalakan');
}

console.log('');
console.log(`RESULT ${pass}/${pass+fail}`);
process.exit(fail===0?0:1);
