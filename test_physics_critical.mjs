// VERIFIKASI FINAL gaya Roblox: gravity 98.1, dt 1/240, bouncy rest .5 fric .5
import * as THREE from 'three';
import * as PH from './src/utils/physicsRapier.js';
await PH.initRapierPhysics();

let pass=0, fail=0;
const check=(c,m)=>{ console.log((c?'  PASS  ':'  FAIL  ')+m); c?pass++:fail++; };
const SEC = (s) => Math.ceil(s / PH.FIXED_DT);

function mk(slug, y, q) {
  // ISOLASI antar-skenario (dunia rapier GLOBAL).
  if (typeof PH.clearAllBodies === 'function') PH.clearAllBodies();
  const m = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial());
  m.position.set(0,y,0); m.scale.set(1,1,1);
  m.userData = { isBlock:true, blockSlug:slug, anchored:true };
  if (q) m.quaternion.set(q[0],q[1],q[2],q[3]);
  m.updateMatrixWorld(true); return m;
}

console.log('=== KONFIGURASI SEKARANG (gaya Roblox) ===');
console.log('  GRAVITY =', PH.GRAVITY, '| FIXED_DT =', PH.FIXED_DT, '(240 Hz)');
console.log('');

console.log('═══ 1. bouncy TEGAK -> mantul RAPI (drift kecil) & tetap kuat ═══');
{
  const b = mk('bouncy_block', 8);
  PH.ensureBody(b); PH.sleepBody(b);
  b.userData.anchored = false; PH.wakeBody(b);
  let maxDrift=0, pantulan=0, prevVy=0, puncak2=0, sudah=false;
  for (let i=0;i<SEC(8);i++) {
    PH.stepWorld(THREE, [{mesh:b}], PH.FIXED_DT, 0, []);
    maxDrift = Math.max(maxDrift, Math.hypot(b.position.x, b.position.z));
    const vy = b.userData.__rapierBody.linvel().y;
    if (prevVy<-0.5 && vy>0.5) { pantulan++; if (pantulan===1) sudah=true; }
    prevVy = vy;
    if (sudah && b.position.y>puncak2) puncak2=b.position.y;
  }
  console.log(`   drift=${maxDrift.toFixed(3)} | pantulan=${pantulan} | puncak2=${puncak2.toFixed(2)} | y=${b.position.y.toFixed(2)}`);
  console.log(`   (SEBELUM: drift 8.23, pantulan 11)`);
  check(maxDrift < 1.0, `mantul RAPI (drift ${maxDrift.toFixed(3)} < 1.0) — dulu 8.23`);
  check(pantulan >= 3, `tetap mantul berkali-kali (${pantulan})`);
}

console.log('');
console.log('═══ 2. bouncy DIROTASI KACAU -> tetap LIAR (kacau) ═══');
{
  const a=0.9, s=Math.sin(a/2);
  const b = mk('bouncy_block', 8, [0.4*s,0.5*s,0.77*s,Math.cos(a/2)]);
  PH.ensureBody(b); PH.sleepBody(b);
  b.userData.anchored = false; PH.wakeBody(b);
  for (let i=0;i<SEC(8);i++) PH.stepWorld(THREE, [{mesh:b}], PH.FIXED_DT, 0, []);
  const geser = Math.hypot(b.position.x, b.position.z);
  console.log('   geser horizontal:', geser.toFixed(3));
  check(geser > 2, `masih KACAU/menyimpang (geser ${geser.toFixed(2)} > 2)`);
}

console.log('');
console.log('═══ 3. BUG B: angkat + rotate -> tidak teleport ═══');
{
  const b = mk('bouncy_block', 0.5);
  PH.ensureBody(b); PH.sleepBody(b);
  b.position.set(3, 6, -2);
  const a=0.7, s=Math.sin(a/2);
  b.quaternion.set(0.4*s, 0.5*s, 0.77*s, Math.cos(a/2));
  b.updateMatrixWorld(true);
  b.userData.anchored = false; PH.wakeBody(b);
  PH.stepWorld(THREE, [{mesh:b}], PH.FIXED_DT, 0, []);
  check(b.position.y > 5.5, `TIDAK teleport (y=${b.position.y.toFixed(2)}, tetap di tempat angkat)`);
  check(Math.abs(b.quaternion.w - Math.cos(a/2)) < 0.05, 'rotasi TETAP');
}

console.log('');
console.log('═══ 4. ice/grass tidak mantul ═══');
{
  for (const slug of ['ice_block','grass_block']) {
    const b = mk(slug, 6);
    PH.ensureBody(b); PH.sleepBody(b);
    b.userData.anchored = false; PH.wakeBody(b);
    let pantulan=0, prevVy=0;
    for (let i=0;i<SEC(6);i++) {
      PH.stepWorld(THREE, [{mesh:b}], PH.FIXED_DT, 0, []);
      const vy=b.userData.__rapierBody.linvel().y;
      if (prevVy<-0.5 && vy>0.5) pantulan++;
      prevVy=vy;
    }
    check(pantulan <= 1, `${slug} tidak mantul (pantulan=${pantulan})`);
  }
}

console.log('');
console.log(`RESULT ${pass}/${pass+fail}`);
process.exit(fail===0?0:1);
