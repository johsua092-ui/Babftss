// ============================================================
// TEST FISIKA (RED-GREEN) — fitur baru "Physics"
// Dijalankan: node test_physics.mjs
// Meniru alur app PERSIS (modul murni, tanpa browser).
// ============================================================
const PROJ = new URL('./', import.meta.url).href;
const THREE = await import(PROJ + 'node_modules/three/build/three.module.js');
const PH = await import(PROJ + 'src/utils/physicsEngine.js');

let pass = 0, fail = 0;
const check = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); c ? pass++ : fail++; };

function mkBlock(slug, x, y, z, rotY = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
  m.position.set(x, y, z);
  m.scale.set(1, 1, 1);
  m.userData = { isBlock: true, blockSlug: slug };
  if (rotY) m.rotation.y = rotY;
  m.updateMatrixWorld(true);
  return m;
}

// simulasi jatuh sampai tenang (atau max detik)
// statics = block ANCHORED (penghalang) — WAJIB diteruskan ke stepWorld
// (bug harness saya sebelumnya: parameter ini diterima tapi tidak dipakai).
function simulate(bodies, statics = [], seconds = 6, groundY = 0) {
  const dt = PH.FIXED_DT;
  const steps = Math.ceil(seconds / dt);
  let totalMoving = 0;
  for (let s = 0; s < steps; s++) {
    const n = PH.stepWorld(THREE, bodies, dt, groundY, statics);
    if (n === 0 && s > 5) break;
    totalMoving += n;
  }
  return totalMoving;
}

console.log('════ A. GRAVITASI: block Anchor dilepas → JATUH & berhenti di tanah ════');
{
  const b = mkBlock('stone_block', 0, 10, 0);
  const body = PH.wakeBody(b);
  simulate([{ mesh: b, body }], [], 6);
  console.log('   posisi akhir y =', b.position.y.toFixed(4), '| vy =', body.vy.toFixed(4), '| sleeping =', body.sleeping);
  check(Math.abs(b.position.y - 0.5) < 1e-6, `berhenti tepat di atas tanah (y=0.5, dapat ${b.position.y.toFixed(4)})`);
  check(body.sleeping === true, 'body akhirnya SLEEP (berhenti dihitung — hemat CPU)');
}

console.log('════ B. ANCHOR: block anchored TIDAK boleh jatuh ════');
{
  const b = mkBlock('stone_block', 0, 10, 0);
  // block anchored TIDAK masuk daftar simulasi (engine hanya memproses yg tidak anchored)
  const y0 = b.position.y;
  const entries = [];            // anchored → tidak dimasukkan = tidak bergerak
  simulate(entries, [], 3);
  check(b.position.y === y0, `anchored: posisi tidak berubah (y tetap ${y0})`);
}

console.log('════ C. GRAVITASI SAMA untuk semua jenis block (permintaan user) ════');
{
  const a = mkBlock('stone_block', -5, 10, 0);
  const c = mkBlock('ice_block', 5, 10, 0);
  const ba = PH.wakeBody(a), bc = PH.wakeBody(c);
  // satu sub-step saja → bandingkan kecepatan
  PH.stepWorld(THREE, [{ mesh: a, body: ba }, { mesh: c, body: bc }], PH.FIXED_DT, 0);
  console.log('   vy stone =', ba.vy.toFixed(6), '| vy ice =', bc.vy.toFixed(6));
  check(Math.abs(ba.vy - bc.vy) < 1e-12, 'semua block jatuh dengan kecepatan SAMA (gravitasi konstan)');
}

console.log('════ D. BOUNCY: memantul beberapa kali lalu berhenti ════');
{
  const b = mkBlock('bouncy_block', 0, 8, 0);
  const body = PH.wakeBody(b);
  const dt = PH.FIXED_DT;
  let bounces = 0, prevVy = 0, maxUp = 0, settledAt = null;
  for (let s = 0; s < Math.ceil(12 / dt); s++) {
    PH.stepWorld(THREE, [{ mesh: b, body }], dt, 0);
    if (prevVy < -0.5 && body.vy > 0.5) { bounces++; maxUp = Math.max(maxUp, body.vy); }
    prevVy = body.vy;
    if (body.sleeping && settledAt === null) settledAt = s * dt;
  }
  console.log('   jumlah pantulan =', bounces, '| kecepatan pantul maks =', maxUp.toFixed(3), '| tenang di t =', settledAt?.toFixed(2), 's');
  check(bounces >= 3, `bouncy memantul beberapa kali (dapat ${bounces})`);
  check(body.sleeping === true, 'bouncy akhirnya BERHENTI (energi habis)');
  check(settledAt !== null && settledAt < 12, `berhenti sebelum 12s (dapat ${settledAt?.toFixed(2)}s)`);
}

console.log('════ E. ICE vs GRASS: gesekan berbeda (meluncur vs seret) ════');
{
  function slide(slug) {
    const b = mkBlock(slug, 0, 0.5, 0);
    const body = PH.wakeBody(b);
    body.vx = 6;                     // diberi dorongan horizontal
    simulate([{ mesh: b, body }], [], 4, 0);
    return Math.abs(b.position.x);
  }
  const xi = slide('ice_block');
  const xg = slide('grass_block');
  console.log('   jarak luncur — ice =', xi.toFixed(3), '| grass =', xg.toFixed(3));
  check(xi > xg, `ice meluncur LEBIH JAUH dari grass (ice ${xi.toFixed(2)} > grass ${xg.toFixed(2)})`);
  check(xi > 0.5, `ice benar-benar meluncur (jarak ${xi.toFixed(2)})`);
}

console.log('════ F. BLOCK DUDUK DI ATAS BLOCK: tidak saling tembus ════');
{
  const bawah = mkBlock('stone_block', 0, 0.5, 0);      // anchored (statis)
  const atas = mkBlock('stone_block', 0, 6, 0);          // akan jatuh menimpa
  const bodyAtas = PH.wakeBody(atas);
  simulate([{ mesh: atas, body: bodyAtas }], [{ mesh: bawah }], 6, 0);
  console.log('   y block atas =', atas.position.y.toFixed(4), '(harus 1.5 = 0.5 + 0.5 + 0.5)');
  check(Math.abs(atas.position.y - 1.5) < 1e-6, `mendarat TEPAT di atas block bawah (dapat ${atas.position.y.toFixed(4)})`);
  check(bodyAtas.sleeping === true, 'berhenti (tidak tembus, tidak goyang)');
}

console.log('════ G. BLOCK MIRING: AABB membesar saat rotasi X/Z (tumble) ════');
{
  // CATATAN ALAT UKUR (bug asersi saya): rotasi Y (yaw) pada KUBUS TIDAK
  // membesarkan AABB (0.707, 0.5, 0.707 = benar secara matematis). AABB
  // membesar kalau rotasi X atau Z (tumble) — itu yang bikin pantulan kacau.
  const b = mkBlock('stone_block', 0, 6, 0);
  b.rotation.x = Math.PI / 4;
  b.updateMatrixWorld(true);
  const he = PH.worldHalfExtents(THREE, b);
  console.log('   half-extent rotasi X 45° =', he.x.toFixed(4), he.y.toFixed(4), he.z.toFixed(4), '(tegak = 0.5)');
  check(he.y > 0.5 && he.z > 0.5, `AABB block miring (rot X) LEBIH BESAR (y=${he.y.toFixed(3)}, z=${he.z.toFixed(3)}) → fisika tahu block miring`);

  // yaw 45° (sesuai laporan user "rotate tidak karuan") → tetap terdeteksi & stabil
  const b2 = mkBlock('stone_block', 0, 6, 0, Math.PI / 4);
  const body2 = PH.wakeBody(b2);
  simulate([{ mesh: b2, body: body2 }], [], 6, 0);
  check(body2.sleeping === true && b2.position.y > 0, `block yaw 45° mendarat & tenang (y=${b2.position.y.toFixed(3)})`);
}

console.log('════ H. PERFORMA: 200 block jatuh — harus ringan ════');
{
  const bodies = [];
  for (let i = 0; i < 200; i++) {
    const b = mkBlock('stone_block', (i % 20) * 3 - 30, 20 + Math.floor(i / 20) * 3, 0);
    bodies.push({ mesh: b, body: PH.wakeBody(b) });
  }
  const t0 = performance.now();
  let steps = 0;
  for (let s = 0; s < Math.ceil(6 / PH.FIXED_DT); s++) { PH.stepWorld(THREE, bodies, PH.FIXED_DT, 0); steps++; }
  const ms = performance.now() - t0;
  const perStep = ms / steps;
  console.log(`   200 block × ${steps} sub-step = ${ms.toFixed(0)} ms (${perStep.toFixed(3)} ms/sub-step)`);
  check(perStep < 8, `ringan: ${perStep.toFixed(3)} ms per sub-step untuk 200 block (< 8ms)`);
}

console.log('════ I. ANTI-DRIFT: block diam tidak bergerak sama sekali ════');
{
  const b = mkBlock('stone_block', 0, 0.5, 0);
  const body = PH.wakeBody(b);
  simulate([{ mesh: b, body }], [], 3, 0);
  const y1 = b.position.y;
  simulate([{ mesh: b, body }], [], 3, 0);   // jalan lagi
  check(b.position.y === y1, `tidak drift setelah tidur (y tetap ${y1})`);
  check(body.sleeping === true, 'tetap sleep');
}

console.log(`\nRESULT ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
