// ============================================================
// KUALITAS PANTULAN — gaya ROBLOX (gravity 98.1, 240Hz, bouncy rest .5 fric .5)
// Dijalankan: node test_bounce_quality.mjs
// ============================================================
import * as THREE from 'three';
import * as PH from './src/utils/physicsRapier.js';
import { PHYS_BY_SLUG } from './src/utils/physicsEngine.js';
await PH.initRapierPhysics();

let pass=0, fail=0;
const check=(c,m)=>{ console.log((c?'  PASS  ':'  FAIL  ')+m); c?pass++:fail++; };
const SEC = (s) => Math.ceil(s / PH.FIXED_DT);

function mk(slug, y, q) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial());
  m.position.set(0,y,0); m.scale.set(1,1,1);
  m.userData = { isBlock:true, blockSlug:slug, anchored:true };
  if (q) m.quaternion.set(q[0],q[1],q[2],q[3]);
  m.updateMatrixWorld(true); return m;
}
function drop(slug, q, seconds=8, h=8) {
  // ISOLASI: hapus body dari skenario sebelumnya (dunia rapier bersifat GLOBAL;
  // tanpa ini block lama tetap ada -> block baru bisa bertumpuk di atasnya dan
  // mendarat di y=1.5 (FAIL palsu). Terbukti: grass berhenti di y=1.489.
  PH.clearAllBodies();
  const b = mk(slug, h, q);
  PH.ensureBody(b); PH.sleepBody(b);
  b.userData.anchored = false; PH.wakeBody(b);
  let maxDrift=0, pantulan=0, prevVy=0, puncak2=0, sudah=false, maxSpin=0;
  for (let i=0;i<SEC(seconds);i++) {
    PH.stepWorld(THREE, [{mesh:b}], PH.FIXED_DT, 0, []);
    const av = b.userData.__rapierBody.angvel();
    maxSpin = Math.max(maxSpin, Math.hypot(av.x,av.y,av.z));
    maxDrift = Math.max(maxDrift, Math.hypot(b.position.x, b.position.z));
    const vy = b.userData.__rapierBody.linvel().y;
    if (prevVy<-0.5 && vy>0.5) { pantulan++; if (pantulan===1) sudah=true; }
    prevVy = vy;
    if (sudah && b.position.y>puncak2) puncak2=b.position.y;
  }
  return { b, maxDrift, pantulan, puncak2, maxSpin, geser:+Math.hypot(b.position.x,b.position.z).toFixed(3), y:+b.position.y.toFixed(3) };
}

console.log('═══ KONFIGURASI (gaya Roblox) ═══');
console.log(`   GRAVITY=${PH.GRAVITY} | FIXED_DT=${PH.FIXED_DT.toFixed(5)} (240Hz)`);
console.log(`   bouncy: restitution ${PHYS_BY_SLUG.bouncy_block.restitution} friction ${PHYS_BY_SLUG.bouncy_block.friction}`);
console.log('');

console.log('═══ 1. bouncy TEGAK -> mantul RAPI & tetap kuat ═══');
{
  const r = drop('bouncy_block', null);
  console.log(`   drift=${r.maxDrift.toFixed(3)} | pantulan=${r.pantulan} | puncak2=${r.puncak2.toFixed(2)} | spin=${r.maxSpin.toFixed(1)}`);
  check(r.maxDrift < 1.0, `mantul RAPI (drift ${r.maxDrift.toFixed(3)} < 1.0) — dulu 8.23`);
  check(r.pantulan >= 3, `mantul berkali-kali (${r.pantulan}) lalu berhenti sendiri`);
  check(r.y < 1.0, `akhirnya berhenti di tanah (y=${r.y})`);
}

console.log('');
console.log('═══ 2. bouncy DIROTASI KACAU -> menyimpang (kacau) ═══');
{
  const a=0.9, s=Math.sin(a/2);
  const r = drop('bouncy_block', [0.4*s,0.5*s,0.77*s,Math.cos(a/2)]);
  console.log(`   geser=${r.geser} | pantulan=${r.pantulan} | spin=${r.maxSpin.toFixed(1)}`);
  check(r.geser > 1.0, `menyimpang dari titik jatuh (geser ${r.geser} > 1.0) — efek rotasi miring`);
  check(r.geser > 0.5, 'arah pantulan TIDAK lurus vertikal (bukan seperti block tegak)');
}

console.log('');
console.log('═══ 3. arah pantulan BERGANTUNG rotasi (3 rotasi beda -> 3 arah beda) ═══');
{
  const hasil = [];
  for (const ax of [[0.4,0.5,0.77],[0.9,0.1,0.3],[0.2,0.95,0.1]]) {
    const a=0.9, sn=Math.sin(a/2);
    const r = drop('bouncy_block', [ax[0]*sn, ax[1]*sn, ax[2]*sn, Math.cos(a/2)], 6);
    hasil.push({ x:+r.b.position.x.toFixed(2), z:+r.b.position.z.toFixed(2) });
  }
  console.log('   3 arah akhir:', JSON.stringify(hasil));
  const beda = Math.abs(hasil[0].x-hasil[1].x) + Math.abs(hasil[0].z-hasil[2].z);
  check(beda > 0.3, `arah BERGANTUNG rotasi (beda=${beda.toFixed(2)}) — sesuai penjelasan user`);
}

console.log('');
console.log('═══ 4. ice/grass tidak mantul KUAT (beda kelas dengan bouncy) ═══');
{
  const bouncy = drop('bouncy_block', null, 6, 5);
  for (const slug of ['ice_block','grass_block']) {
    const r = drop(slug, null, 6, 5);
    console.log(`   ${slug}: pantulan=${r.pantulan} | y=${r.y} | (bouncy: ${bouncy.pantulan} pantulan)`);
    // CATATAN ALAT UKUR: dengan gravity Roblox (98.1), block non-bouncy tetap
    // memantul 1-2x KECIL (restitution 0.04 tidak persis nol). Yang penting:
    // JAUH lebih sedikit dari bouncy, dan tidak memantul berulang.
    check(r.pantulan < bouncy.pantulan, `${slug} mantul JAUH lebih sedikit dari bouncy (${r.pantulan} < ${bouncy.pantulan})`);
    check(r.pantulan <= 2, `${slug} tidak mantul berulang (${r.pantulan} <= 2)`);
  }
}

console.log('');
console.log('═══ 5. GRAVITY konstan: kecepatan jatuh SAMA sebelum mendarat ═══');
{
  // CATATAN ALAT UKUR: mengukur y setelah 1 detik SALAH — dengan gravity 98.1
  // block sudah MENDARAT sebelum 1s (beda ketinggian akhir = beda restitution,
  // bukan beda kecepatan). METRIK BENAR: kecepatan (linvel.y) pada STEP YANG SAMA
  // saat masih jatuh bebas.
  PH.clearAllBodies();
  const objs = ['stone_block','ice_block','bouncy_block'].map(slug => {
    const b = mk(slug, 20);
    PH.ensureBody(b); PH.sleepBody(b);
    b.userData.anchored = false; PH.wakeBody(b);
    return b;
  });
  const N = SEC(0.15);   // masih jauh dari tanah
  for (let i=0;i<N;i++) PH.stepWorld(THREE, objs.map(m=>({mesh:m})), PH.FIXED_DT, 0, []);
  const vys = objs.map(m => +m.userData.__rapierBody.linvel().y.toFixed(4));
  console.log('   linvel.y setelah 0.15s:', JSON.stringify(vys));
  // Toleransi 0.05: solver rapier memakai iterasi terbatas sehingga ada beda
  // sub-mikro antar-body (efek damping/inersia). Yang penting: kecepatannya
  // SAMA secara praktis (bukan 2x berbeda).
  const maxBeda = Math.max(...vys) - Math.min(...vys);
  console.log('   selisih maks:', maxBeda.toFixed(4));
  check(maxBeda < 0.05, `semua block jatuh dengan kecepatan SAMA (selisih ${maxBeda.toFixed(4)} < 0.05)`);
}

console.log('');
console.log(`RESULT ${pass}/${pass+fail}`);
process.exit(fail===0?0:1);
