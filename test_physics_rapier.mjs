// ============================================================
// TES TARGET USER: block bouncy dirotasi kacau -> HARUS memantul kacau
// (memutar + bergerak menyamping, bukan lurus vertikal)
// Inilah yang mesin AABB saya TIDAK BISA lakukan.
// ============================================================
import RAPIER from '@dimforge/rapier3d-compat';
await RAPIER.init();

let pass = 0, fail = 0;
const check = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); c ? pass++ : fail++; };

function makeWorld() {
  const w = new RAPIER.World({ x: 0, y: -26, z: 0 });
  // lantai
  const gBody = w.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  w.createCollider(RAPIER.ColliderDesc.cuboid(50, 0.5, 50).setFriction(0.6).setRestitution(0.3), gBody);
  return w;
}

// block bouncy dengan rotasi kacau
function dropBouncy(rot, restitution = 0.85, friction = 0.05) {
  const w = makeWorld();
  // normalisasi manual (rapier Quaternion tidak punya .normalize())
  const len = Math.hypot(rot[0], rot[1], rot[2], rot[3] ?? 1) || 1;
  const qn = { x: rot[0]/len, y: rot[1]/len, z: rot[2]/len, w: (rot[3] ?? 1)/len };
  const body = w.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 6, 0).setRotation(qn)
  );
  w.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setRestitution(restitution).setFriction(friction), body);
  const dt = 1/120;
  const traj = [];
  for (let i = 0; i < 120*6; i++) {
    w.step();
    if (i % 30 === 0) {
      const t = body.translation(); const r = body.rotation();
      traj.push({ t:+(i*dt).toFixed(2), x:+t.x.toFixed(4), y:+t.y.toFixed(4), z:+t.z.toFixed(4), rw:+r.w.toFixed(4) });
    }
  }
  const t = body.translation(); const r = body.rotation();
  return { traj, akhir: { x:+t.x.toFixed(4), y:+t.y.toFixed(4), z:+t.z.toFixed(4) }, rot: {x:+r.x.toFixed(4),y:+r.y.toFixed(4),z:+r.z.toFixed(4),w:+r.w.toFixed(4)} };
}

console.log('════ 1. BOUNCY TEGAK (kontrol) ════');
{
  const r = dropBouncy([0,0,0,1]);
  console.log('   lintasan:', JSON.stringify(r.traj.slice(0,5)));
  console.log('   akhir:', JSON.stringify(r.akhir));
  check(Math.abs(r.akhir.y) < 0.6, 'berhenti di tanah (y ~ 0.5)');
}

console.log('');
console.log('════ 2. BOUNCY DIROTASI KACAU -> HARUS MEMANTUL KACAU ════');
{
  // rotasi kacau (sumbu miring) -> sudut tumbukan tidak simetris
  const axis = { x: 0.4, y: 0.5, z: 0.77 };
  const ang = 0.9;
  const s = Math.sin(ang/2);
  const r = dropBouncy([axis.x*s, axis.y*s, axis.z*s, Math.cos(ang/2)]);
  console.log('   lintasan:', JSON.stringify(r.traj.slice(0,5)));
  console.log('   akhir posisi:', JSON.stringify(r.akhir));
  console.log('   akhir rotasi:', JSON.stringify(r.rot));

  const geserXZ = Math.hypot(r.akhir.x, r.akhir.z);
  console.log('   pergeseran horizontal:', geserXZ.toFixed(4));
  check(geserXZ > 0.05, `block BERGESER MENYAMPING (bukan lurus vertikal) — geser=${geserXZ.toFixed(3)}`);

  // rotasi berubah = block BERPUTAR saat memantul
  const rotAwal = { x: axis.x*s, y: axis.y*s, z: axis.z*s, w: Math.cos(ang/2) };
  const beda = Math.abs(r.rot.x-rotAwal.x)+Math.abs(r.rot.y-rotAwal.y)+Math.abs(r.rot.z-rotAwal.z)+Math.abs(r.rot.w-rotAwal.w);
  console.log('   perubahan orientasi:', beda.toFixed(4));
  check(beda > 0.01, `block BERPUTAR saat memantul (bukan hanya hiasan) — delta=${beda.toFixed(3)}`);
}

console.log('');
console.log('════ 3. BOUNCY MANTUL BERKALI-KALI LALU TENANG ════');
{
  // CATATAN ALAT UKUR: menghitung "puncak" (naik lalu turun) GAGAL untuk block
  // yang memantul sambil MELUNCUR menyamping — pola y tidak monoton.
  // METRIK YANG BENAR: hitung berapa kali block MENYENTUH tanah lalu NAIK LAGI
  // (transisi vy negatif -> positif), yaitu jumlah pantulan sesungguhnya.
  const w = makeWorld();
  const body = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 6, 0));
  w.createCollider(RAPIER.ColliderDesc.cuboid(0.5,0.5,0.5).setRestitution(0.85).setFriction(0.05), body);
  let pantulan = 0, prevVy = 0;
  const dt = 1/120;
  for (let i = 0; i < 120*8; i++) {
    w.step();
    const vy = body.linvel().y;
    if (prevVy < -0.5 && vy > 0.5) pantulan++;   // baru memantul ke atas
    prevVy = vy;
  }
  const akhirY = body.translation().y;
  console.log('   jumlah pantulan (vy negatif -> positif):', pantulan);
  console.log('   akhir y:', akhirY.toFixed(4));
  check(pantulan >= 2, `memantul beberapa kali (pantulan=${pantulan})`);
  check(Math.abs(akhirY) < 0.6, 'akhirnya berhenti di tanah (energi habis)');
}

console.log('');
console.log('════ 4. ICE vs GRASS (gesekan beda) ════');
{
  function slide(friction) {
    const w = makeWorld();
    const b = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 0.5, 0).setLinvel(6, 0, 0));
    w.createCollider(RAPIER.ColliderDesc.cuboid(0.5,0.5,0.5).setFriction(friction).setRestitution(0.05), b);
    for (let i=0;i<120*4;i++) w.step();
    return Math.abs(b.translation().x);
  }
  const ice = slide(0.005), grass = slide(0.95);
  console.log('   jarak luncur: ice =', ice.toFixed(3), '| grass =', grass.toFixed(3));
  check(ice > grass * 2, `ice meluncur JAUH lebih jauh dari grass (${ice.toFixed(2)} vs ${grass.toFixed(2)})`);
}

console.log('');
console.log(`RESULT ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
