// VERIFIKASI: apakah pantulan sekarang KACAU & KUAT (keluhan user)?
import * as THREE from 'three';
import * as PH from './src/utils/physicsRapier.js';

let pass = 0, fail = 0;
const check = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); c ? pass++ : fail++; };
await PH.initRapierPhysics();

function mk(slug, x, y, z, q) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial());
  m.position.set(x,y,z); m.scale.set(1,1,1);
  m.userData = { isBlock:true, blockSlug:slug, anchored:false };
  if (q) m.quaternion.set(q[0],q[1],q[2],q[3]);
  m.updateMatrixWorld(true);
  return m;
}
const ang = 0.9, s = Math.sin(ang/2);
const Q = [0.4*s, 0.5*s, 0.77*s, Math.cos(ang/2)];

console.log('=== 1. BOUNCY DIROTASI KACAU: kuat & kacau? ===');
{
  const b = mk('bouncy_block', 0, 8, 0, Q);
  PH.ensureBody(b); PH.wakeBody(b);
  let pantulan = 0, prevVy = 0, maxTinggi = 0;
  for (let i=0;i<120*12;i++) {
    PH.stepWorld(THREE, [{mesh:b}], PH.FIXED_DT, 0, []);
    const vy = b.userData.__rapierBody.linvel().y;
    if (prevVy < -0.5 && vy > 0.5) pantulan++;
    prevVy = vy;
    if (b.position.y > maxTinggi) maxTinggi = b.position.y;
  }
  const geser = Math.hypot(b.position.x, b.position.z);
  const q = b.quaternion;
  const putar = Math.abs(q.x-Q[0])+Math.abs(q.y-Q[1])+Math.abs(q.z-Q[2])+Math.abs(q.w-Q[3]);
  console.log(`   pantulan=${pantulan} | geser=${geser.toFixed(2)} | putar=${putar.toFixed(2)} | tinggiMax=${maxTinggi.toFixed(2)}`);
  console.log(`   SEBELUM perbaikan: pantulan=3 geser=5.47 putar=1.25`);
  check(pantulan >= 8, `pantulan BANYAK (${pantulan} >= 8) — dulu 3`);
  check(geser > 8, `BERGESER JAUH menyamping (${geser.toFixed(2)} > 8) — dulu 5.47`);
  check(putar > 2, `BERPUTAR kuat (${putar.toFixed(2)} > 2) — dulu 1.25`);
}

console.log('');
console.log('=== 2. bouncy TEGAK: harus mantul tinggi (daya pantul utuh) ===');
{
  const b = mk('bouncy_block', 0, 8, 0, [0,0,0,1]);
  PH.ensureBody(b); PH.wakeBody(b);
  let pantulan=0, prevVy=0, puncakKedua=0, sudahPantul=false;
  for (let i=0;i<120*10;i++) {
    PH.stepWorld(THREE, [{mesh:b}], PH.FIXED_DT, 0, []);
    const vy = b.userData.__rapierBody.linvel().y;
    if (prevVy < -0.5 && vy > 0.5) { pantulan++; if (pantulan===1) sudahPantul=true; }
    prevVy = vy;
    if (sudahPantul && b.position.y > puncakKedua) puncakKedua = b.position.y;
  }
  console.log(`   pantulan=${pantulan} | tinggi pantulan ke-2 = ${puncakKedua.toFixed(2)} (dijatuhkan dari 8)`);
  check(pantulan >= 4, `mantul berkali-kali (${pantulan})`);
  check(puncakKedua > 3, `daya pantul KUAT — naik lagi ke ${puncakKedua.toFixed(2)} (dulu ~2.2)`);
}

console.log('');
console.log('=== 3. arah pantulan IKUT rotasi (kacau karena tidak seimbang) ===');
{
  // 3 rotasi berbeda -> 3 arah pantulan berbeda
  const hasil = [];
  for (const ax of [[0.4,0.5,0.77],[0.9,0.1,0.3],[0.2,0.95,0.1]]) {
    const a=0.9, sn=Math.sin(a/2);
    const q=[ax[0]*sn, ax[1]*sn, ax[2]*sn, Math.cos(a/2)];
    const b = mk('bouncy_block', 0, 8, 0, q);
    PH.ensureBody(b); PH.wakeBody(b);
    for (let i=0;i<120*6;i++) PH.stepWorld(THREE, [{mesh:b}], PH.FIXED_DT, 0, []);
    hasil.push({ x:+b.position.x.toFixed(2), z:+b.position.z.toFixed(2) });
  }
  console.log('   arah akhir 3 rotasi berbeda:', JSON.stringify(hasil));
  const beda = Math.abs(hasil[0].x-hasil[1].x)+Math.abs(hasil[0].z-hasil[2].z);
  check(beda > 0.5, `arah pantulan BERGANTUNG rotasi (beda=${beda.toFixed(2)}) — sesuai penjelasan user`);
}

console.log('');
console.log('=== 4. ice/grass tetap tidak mantul (bukan jadi bouncy semua) ===');
{
  for (const slug of ['ice_block','grass_block']) {
    const b = mk(slug, 0, 5, 0, [0,0,0,1]);
    PH.ensureBody(b); PH.wakeBody(b);
    let pantulan=0, prevVy=0;
    for (let i=0;i<120*6;i++) {
      PH.stepWorld(THREE, [{mesh:b}], PH.FIXED_DT, 0, []);
      const vy = b.userData.__rapierBody.linvel().y;
      if (prevVy < -0.5 && vy > 0.5) pantulan++;
      prevVy = vy;
    }
    console.log(`   ${slug}: pantulan=${pantulan}, akhir y=${b.position.y.toFixed(2)}`);
    check(pantulan <= 1, `${slug} TIDAK mantul (pantulan=${pantulan})`);
  }
}

console.log('');
console.log(`RESULT ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
