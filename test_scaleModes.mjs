/* Unit test Phase 73 — aturan scaling 4 mode (scaleModes.js).
   Menguji SISI NYATA (pusat wajah di dunia), bukan sekadar angka scale —
   karena yang user lihat adalah sisi mana yang bergerak.
   Jalankan: node test_scaleModes.mjs   (dari root project) */
import * as THREE from 'three';
import {
  SCALE_MODES, DEFAULT_SCALE_MODE, SCALE_MODE_LABEL, normalizeScaleMode,
  getScaledAxes, needsAnchorOffset, getGeometryHalfSize, applyScaleByMode,
  computeScaleModeFrame,
} from './src/utils/scaleModes.js';

let pass = 0, fail = 0;
const check = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); c ? pass++ : fail++; };

const GEO = new THREE.BoxGeometry(1, 1, 1);
const FKEYS = ['X+', 'X-', 'Y+', 'Y-', 'Z+', 'Z-'];

function faces(mesh) {
  mesh.updateMatrixWorld(true);
  const g = mesh.geometry; if (!g.boundingBox) g.computeBoundingBox();
  const bb = g.boundingBox;
  const pts = {
    'X+': [bb.max.x, 0, 0], 'X-': [bb.min.x, 0, 0],
    'Y+': [0, bb.max.y, 0], 'Y-': [0, bb.min.y, 0],
    'Z+': [0, 0, bb.max.z], 'Z-': [0, 0, bb.min.z],
  };
  const out = {};
  for (const k in pts) out[k] = new THREE.Vector3(...pts[k]).applyMatrix4(mesh.matrixWorld);
  return out;
}

/** Rentang (span) AABB dunia pada tiap sumbu — untuk membedakan
 *  "sisi memanjang" (span berubah) dari "block sekadar bergeser"
 *  (span tetap). ATURAN #4 kontrak: pusat-wajah bergeser BUKAN berarti
 *  sisi itu memanjang — ukur span-nya. */
function worldCorners(mesh) {
  mesh.updateMatrixWorld(true);
  const g = mesh.geometry; if (!g.boundingBox) g.computeBoundingBox();
  const bb = g.boundingBox;
  const out = [];
  for (const x of [bb.min.x, bb.max.x])
    for (const y of [bb.min.y, bb.max.y])
      for (const z of [bb.min.z, bb.max.z])
        out.push(new THREE.Vector3(x, y, z).applyMatrix4(mesh.matrixWorld));
  return out;
}
function spanOf(mesh) {
  const c = worldCorners(mesh);
  const mn = { x: Infinity, y: Infinity, z: Infinity };
  const mx = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const v of c) for (const a of ['x', 'y', 'z']) {
    if (v[a] < mn[a]) mn[a] = v[a];
    if (v[a] > mx[a]) mx[a] = v[a];
  }
  return { x: +(mx.x - mn.x).toFixed(6), y: +(mx.y - mn.y).toFixed(6), z: +(mx.z - mn.z).toFixed(6) };
}

/** Jalankan satu skenario drag & laporkan pergeseran tiap sisi + span. */
function drag({ mode, axisKey, sign, ratio, rotY = 0, scale0 = [1, 1, 1] }) {
  const m = new THREE.Mesh(GEO);
  m.scale.set(...scale0);
  m.rotation.y = rotY;
  m.updateMatrixWorld(true);
  const before = faces(m);
  const spanBefore = spanOf(m);
  const startScale = { x: m.scale.x, y: m.scale.y, z: m.scale.z };
  const startPos = { x: m.position.x, y: m.position.y, z: m.position.z };
  applyScaleByMode(THREE, m, mode, axisKey, sign, startScale, startPos, ratio);
  const after = faces(m);
  const spanAfter = spanOf(m);
  const moved = {};
  for (const k of FKEYS) moved[k] = +before[k].distanceTo(after[k]).toFixed(6);
  const grew = {};
  for (const a of ['x', 'y', 'z']) grew[a] = +(spanAfter[a] - spanBefore[a]).toFixed(6);
  return { moved, before, after, mesh: m, spanBefore, spanAfter, grew };
}

console.log('== konstanta & normalisasi ==');
check(SCALE_MODES.length === 4, '4 mode terdaftar');
check(DEFAULT_SCALE_MODE === '1side', 'DEFAULT = 1side (permintaan user: default & cancel = 1 side)');
check(normalizeScaleMode('ngawur') === '1side', 'nilai tak dikenal → fallback 1side');
check(SCALE_MODE_LABEL['4side'] === '4 Side', 'label UI benar');
check(getGeometryHalfSize(new THREE.Mesh(GEO), 'x') === 0.5, 'halfSize BoxGeometry(1,1,1) = 0.5');

console.log('\n== pemetaan sumbu per mode ==');
check(getScaledAxes('1side', 'y').join() === 'y', '1side: hanya sumbu digenggam');
check(getScaledAxes('2side', 'y').join() === 'y', '2side: hanya sumbu digenggam (BAWAAN)');
check(getScaledAxes('4side', 'y').join() === 'x,z', '4side: dua sumbu LAIN (digenggam Y → X,Z)');
check(getScaledAxes('6side', 'y').join() === 'x,y,z', '6side: ketiga sumbu');
check(needsAnchorOffset('1side') && !needsAnchorOffset('2side') &&
      !needsAnchorOffset('4side') && !needsAnchorOffset('6side'),
  'offset penahan HANYA untuk 1side');

console.log('\n== MODE 1 SIDE: sisi seberang WAJIB DIAM ==');
{
  const r = drag({ mode: '1side', axisKey: 'x', sign: +1, ratio: 2 });
  console.log('   pergeseran:', JSON.stringify(r.moved), ' span+:', JSON.stringify(r.grew));
  check(r.moved['X-'] === 0, 'X- (seberang) DIAM = 0');
  check(r.moved['X+'] > 0.9, `X+ (digenggam) memanjang ${r.moved['X+']}`);
  // ATURAN #4: yang benar diukur = span. HANYA sumbu-x membesar; y & z tidak.
  check(r.grew.x > 0.9 && r.grew.y === 0 && r.grew.z === 0,
    `1 SIDE: HANYA sumbu digenggam membesar (span x=${r.grew.x}, y=${r.grew.y}, z=${r.grew.z})`);
}
{
  const r = drag({ mode: '1side', axisKey: 'y', sign: -1, ratio: 2 });
  console.log('   genggam Y− :', JSON.stringify(r.moved));
  check(r.moved['Y+'] === 0, 'genggam Y−: sisi ATAS (Y+) DIAM');
  check(r.moved['Y-'] > 0.9, 'genggam Y−: sisi BAWAH memanjang');
}
{
  const r = drag({ mode: '1side', axisKey: 'x', sign: +1, ratio: 0.5, scale0: [2, 1, 1] });
  console.log('   mengecil   :', JSON.stringify(r.moved));
  check(r.moved['X-'] === 0, 'MENGECIL: seberang tetap DIAM (rumus sama, arah balik)');
}

console.log('\n== MODE 1 SIDE saat block DIROTASI (warisan #54) ==');
{
  const r = drag({ mode: '1side', axisKey: 'x', sign: +1, ratio: 2, rotY: Math.PI / 4 });
  console.log('   rot 45°    :', JSON.stringify(r.moved));
  check(r.moved['X-'] === 0, 'rot 45°: seberang DIAM (axisLocal × quaternion)');
  check(r.moved['X+'] > 0.9, 'rot 45°: sisi digenggam tetap memanjang');
}
{
  const r = drag({ mode: '1side', axisKey: 'z', sign: -1, ratio: 3, rotY: 1.1 });
  check(r.moved['Z+'] === 0, 'rot 63° sumbu Z−: seberang DIAM');
}

console.log('\n== MODE 2 SIDE: perilaku BAWAAN tidak berubah ==');
{
  const r = drag({ mode: '2side', axisKey: 'x', sign: +1, ratio: 2 });
  console.log('   pergeseran:', JSON.stringify(r.moved));
  check(Math.abs(r.moved['X+'] - 0.5) < 1e-6 && Math.abs(r.moved['X-'] - 0.5) < 1e-6,
    '2side: X+ dan X- SAMA-SAMA bergeser 0.5 (simetris dari pusat)');
  check(r.mesh.position.x === 0 && r.mesh.position.y === 0 && r.mesh.position.z === 0,
    '2side: posisi TIDAK disentuh sama sekali (nol kompensasi)');
  check(r.moved['Y+'] === 0 && r.moved['Z+'] === 0, '2side: sumbu lain diam');
  // identik dengan perilaku lama: scale.x saja yang berubah
  check(r.mesh.scale.x === 2 && r.mesh.scale.y === 1 && r.mesh.scale.z === 1,
    '2side: hanya scale.x berubah — identik kode lama');
}

console.log('\n== MODE 4 SIDE: 4 sisi memanjang, sumbu digenggam DIAM ==');
{
  const r = drag({ mode: '4side', axisKey: 'y', sign: +1, ratio: 2 });
  console.log('   genggam Y  :', JSON.stringify(r.moved));
  check(r.moved['Y+'] === 0 && r.moved['Y-'] === 0, 'atas & bawah DIAM (sumbu digenggam)');
  check(r.moved['X+'] > 0.4 && r.moved['X-'] > 0.4 && r.moved['Z+'] > 0.4 && r.moved['Z-'] > 0.4,
    'kanan/kiri/depan/belakang SEMUA memanjang (4 sisi)');
  const n = FKEYS.filter((k) => r.moved[k] > 0).length;
  check(n === 4, `tepat 4 sisi bergerak (terukur ${n})`);
}
{
  const r = drag({ mode: '4side', axisKey: 'x', sign: +1, ratio: 2, rotY: Math.PI / 4 });
  const n = FKEYS.filter((k) => r.moved[k] > 0).length;
  console.log('   rot 45°    :', JSON.stringify(r.moved));
  check(r.moved['X+'] === 0 && r.moved['X-'] === 0,
    'rot 45°: sumbu digenggam tetap DIAM (ikut rotasi block — permintaan user)');
  check(n === 4, `rot 45°: tetap tepat 4 sisi (terukur ${n})`);
}

console.log('\n== MODE 6 SIDE: semua sisi memanjang ==');
{
  const r = drag({ mode: '6side', axisKey: 'y', sign: +1, ratio: 2 });
  console.log('   pergeseran:', JSON.stringify(r.moved));
  const n = FKEYS.filter((k) => r.moved[k] > 0.4).length;
  check(n === 6, `SEMUA 6 sisi bergerak (terukur ${n})`);
  check(r.mesh.scale.x === 2 && r.mesh.scale.y === 2 && r.mesh.scale.z === 2, 'scale uniform 2,2,2');
}

console.log('\n== KACA / MIRROR: tanda negatif dipertahankan (Phase 67) ==');
{
  const r = drag({ mode: '6side', axisKey: 'x', sign: +1, ratio: 2, scale0: [-1, 1, 1] });
  check(r.mesh.scale.x < 0, 'scale.x TETAP negatif (identitas kaca tidak dibalik)');
  check(Math.abs(r.mesh.scale.x) === 2, 'besarnya tetap ikut rasio (|−2|)');
}

console.log('\n== CLAMP minimum 0.05 (Phase 67) ==');
{
  const r = drag({ mode: '2side', axisKey: 'x', sign: +1, ratio: 0.0001 });
  check(Math.abs(r.mesh.scale.x) >= 0.05, `mentok di 0.05 (terukur ${r.mesh.scale.x})`);
}
{
  const r = drag({ mode: '1side', axisKey: 'x', sign: +1, ratio: 0, scale0: [1, 1, 1] });
  check(Math.abs(r.mesh.scale.x) >= 0.05, '1side ratio 0 → tetap mentok 0.05 (tidak nol/negatif)');
}

console.log('\n== FRAME per-mode align (WARISAN #59 — uji KEDUA mode) ==');
{
  // Block dirotasi 90° thd Y: sumbu lokal X → dunia -Z (menghadap kamera).
  const rotY90 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  // Titik genggam di sisi lokal +X (dunia -Z) sejauh 0.5 (bola X+ lokal).
  const grabLocalPlus = new THREE.Vector3(0.5, 0, 0);
  const grabWorld = grabLocalPlus.clone().applyQuaternion(rotY90); // = (0,0,-0.5)

  // (a) TERCENTANG (worldAlign=true): frame = worldQuaternion block → sisi lokal.
  const fLocal = computeScaleModeFrame(THREE, 'X', grabWorld, rotY90, true);
  console.log('   TERCENTANG: axisKey=', fLocal.axisKey, 'sign=', fLocal.sign);
  check(fLocal.axisKey === 'x', 'tercentang: axisKey dari nama handle = x');
  check(fLocal.sign === 1, 'tercentang: sisi lokal +X dikenali (bola X+)');

  // (b) DICABUT (worldAlign=false): frame = identity (sumbu DUNIA).
  const fWorld = computeScaleModeFrame(THREE, 'X', grabWorld, rotY90, false);
  console.log('   DICABUT   : axisKey=', fWorld.axisKey, 'sign=', fWorld.sign);
  check(fWorld.axisKey === 'x', 'dicabut: axisKey = x (handle world X)');
  // titik genggam dunia (0,0,-0.5): komponen world-x = 0 → sign diambil dari >=0 → +1
  // (defensif; di dunia bola X di ±x murni untuk block tak dirotasi)
  const grabWorldPure = new THREE.Vector3(0.5, 0, 0).applyQuaternion(new THREE.Quaternion());
  const fWorld2 = computeScaleModeFrame(THREE, 'X', grabWorldPure, rotY90, false);
  check(fWorld2.sign === 1, 'dicabut: sumbu DUNIA — bola X+ dunia → sign +1 (tak ikut rotasi block)');
  // bukti beda frame: dengan pointStart dunia (0.5,0,0), TERCENTANG membaca sisi
  // lokal (di-rotate) → komponen lokal = rotY(90)^-1 · (0.5,0,0) = (0,0,0.5)→ x comp 0
  const fLocal2 = computeScaleModeFrame(THREE, 'X', grabWorldPure, rotY90, true);
  check(fLocal2.sign === 1, 'tercentang: pointStart dunia diputar-balik ke frame lokal dulu');
}

console.log('\n== MODE 1 SIDE world-align (dicabut): offset pakai sumbu DUNIA ==');
{
  // Block dirotasi 45°; 1side dengan frameQuat = identity (world-align).
  const m = new THREE.Mesh(GEO);
  m.rotation.y = Math.PI / 4;
  m.updateMatrixWorld(true);
  const startScale = { x: 1, y: 1, z: 1 };
  const startPos = { x: 0, y: 0, z: 0 };
  const identity = new THREE.Quaternion();
  applyScaleByMode(THREE, m, '1side', 'x', +1, startScale, startPos, 2, 0.05, identity);
  // offset dunia = world-axis X × 0.5 = (0.5,0,0)
  console.log('   pos sesudah:', m.position.x.toFixed(3), m.position.y.toFixed(3), m.position.z.toFixed(3));
  check(Math.abs(m.position.x - 0.5) < 1e-6 && Math.abs(m.position.z) < 1e-6,
    'world-align 1side: offset pada sumbu DUNIA X (0.5,0,0) — bukan sumbu block');
}

console.log('\n== FIX TIER-HARD 2026-09-20: snap + scale balik ke asal → block TIDAK maju 1 studs ==');
{
  // BUG LAMA (laporan user, diburu berhari-hari): mode 1side + scale number 2
  // (snap), drag memanjangkan lalu memendekkan sampai mentok ke ukuran asal →
  // block MAJU 0.5 unit = 1 studs ke arah sisi yang digenggam.
  // AKAR: saat delta scale = 0, computeAnchorOffset mengembalikan null; kode
  // lama hanya men-set position DI DALAM `if (off)` → position tidak direset,
  // tertinggal offset terakhir (0.5). Terjadi HANYA saat snap (snap
  // mengkuantisasi scale → delta bisa tepat 0). Akumulatif tiap drag.
  // FIX: reset position ke startPos SELALU (di luar `if (off)`).
  const ratios = [];
  for (let r = 1.0; r <= 3.0 + 1e-9; r += 0.02) ratios.push(r);
  for (let r = 3.0; r >= 1.0 - 1e-9; r -= 0.02) ratios.push(r);

  // (1) DENGAN snap (skenario user) — harus TIDAK maju
  const m1 = new THREE.Mesh(GEO);
  const s0 = { x: 1, y: 1, z: 1 }, p0 = { x: 0, y: 0, z: 0 };
  for (const r of ratios) applyScaleByMode(THREE, m1, '1side', 'x', +1, s0, p0, r, 0.05, null, 2);
  console.log('   snap=2, sesudah drag penuh:', 'scaleX=' + m1.scale.x.toFixed(4), 'posX=' + m1.position.x.toFixed(4));
  check(Math.abs(m1.scale.x - 1.0) < 1e-9, 'snap: scale kembali ke 1.0');
  check(Math.abs(m1.position.x) < 1e-9, 'snap: posisi kembali 0 → TIDAK maju 1 studs (lama: 0.5)');

  // (2) TANPA snap (kontrol) — tetap benar
  const m2 = new THREE.Mesh(GEO);
  for (const r of ratios) applyScaleByMode(THREE, m2, '1side', 'x', +1, s0, p0, r, 0.05, null, null);
  check(Math.abs(m2.position.x) < 1e-9, 'tanpa snap: posisi kembali 0');

  // (3) ANTI-AKUMULASI — 3x cycle tidak menumpuk
  const m3 = new THREE.Mesh(GEO);
  for (let i = 0; i < 3; i++)
    for (const r of ratios) applyScaleByMode(THREE, m3, '1side', 'x', +1, s0, p0, r, 0.05, null, 2);
  check(Math.abs(m3.position.x) < 1e-9, '3x cycle snap: TIDAK akumulasi (lama: +0.5 tiap cycle)');

  // (4) SEMANTICS 1side TETAP: sisi seberang diam selama drag (sign=+ → sisi −)
  const m4 = new THREE.Mesh(GEO);
  let far0 = null, maxDrift = 0;
  for (const r of ratios) {
    applyScaleByMode(THREE, m4, '1side', 'x', +1, s0, p0, r, 0.05, null, 2);
    const farX = m4.position.x - 0.5 * m4.scale.x;   // pusat wajah sisi −
    if (far0 === null) far0 = farX;
    maxDrift = Math.max(maxDrift, Math.abs(farX - far0));
  }
  check(maxDrift < 1e-9, '1side semantics TETAP: sisi seberang DIAM (drift=' + maxDrift.toFixed(6) + ')');

  // (5) MODE LAIN TIDAK TERSENTUH — 2side posisi tetap
  const m5 = new THREE.Mesh(GEO);
  for (const r of ratios) applyScaleByMode(THREE, m5, '2side', 'x', +1, s0, p0, r, 0.05, null, 2);
  check(Math.abs(m5.position.x) < 1e-9, '2side: posisi tetap 0 (mode lain utuh)');
}

console.log('\n== FIX TIER-HARD 2026-09-20 #2: 2side + SNAP + mode 4/6 side (dulu di-skip) ==');
{
  // BUG A (laporan user): mode 2side + scale number → "seolah memakai scale 0"
  //   (= snap MATI). Akar: jalur 2side di-skip dari applyScaleByMode.
  // BUG B (laporan user): mode 6side kadang mulai sebagai 2side dulu (~90%).
  //   Akar: snapshot tidak dibuat untuk 2side → seluruh logika mode dilewati.
  // FIX: SEMUA mode lewat applyScaleByMode (2side kini ikut di-snap).
  const s0 = { x: 1, y: 1, z: 1 }, p0 = { x: 0, y: 0, z: 0 };

  // (1) 2side + snap 3 studs → nilai harus snap RELATIF (start + n×1.5)
  const m1 = new THREE.Mesh(GEO);
  const vals = [];
  for (const r of [1.2, 1.7, 2.0, 2.7, 3.0]) {
    applyScaleByMode(THREE, m1, '2side', 'x', +1, s0, p0, r, 0.05, null, 3);
    vals.push(+m1.scale.x.toFixed(4));
  }
  const snapped = vals.every(v => Math.abs(((v - 1) % 1.5 + 1.5) % 1.5) < 1e-9);
  console.log('   2side+snap3 nilai:', vals.join(', '));
  check(snapped, '2side + snap 3: nilai snap ke start + n×1.5 (snap AKTIF, bukan bebas)');
  check(vals.some(v => Math.abs(v - 1) > 1e-9), '2side + snap 3: nilai benar-benar berubah per step');

  // (2) 6side → SEMUA 3 sumbu ter-scale (bukan hanya sumbu digenggam)
  const m2 = new THREE.Mesh(GEO);
  applyScaleByMode(THREE, m2, '6side', 'x', +1, s0, p0, 3, 0.05, null, null);
  check(Math.abs(m2.scale.x - 3) < 1e-6 && Math.abs(m2.scale.y - 3) < 1e-6 && Math.abs(m2.scale.z - 3) < 1e-6,
    `6side: ketiga sumbu = 3 (dapat ${m2.scale.x},${m2.scale.y},${m2.scale.z})`);

  // (3) 4side → 2 sumbu lain; sumbu digenggam DIAM
  const m3 = new THREE.Mesh(GEO);
  applyScaleByMode(THREE, m3, '4side', 'x', +1, s0, p0, 3, 0.05, null, null);
  check(Math.abs(m3.scale.x - 1) < 1e-6 && Math.abs(m3.scale.y - 3) < 1e-6 && Math.abs(m3.scale.z - 3) < 1e-6,
    `4side: sumbu digenggam DIAM, 2 sumbu lain scale (dapat ${m3.scale.x},${m3.scale.y},${m3.scale.z})`);

  // (4) 2side TANPA snap → bebas (perilaku lama tetap ada)
  const m4 = new THREE.Mesh(GEO);
  applyScaleByMode(THREE, m4, '2side', 'x', +1, s0, p0, 1.7, 0.05, null, null);
  check(Math.abs(m4.scale.x - 1.7) < 1e-6, `2side tanpa snap: nilai bebas 1.7 (dapat ${m4.scale.x.toFixed(3)})`);
}

console.log('\n== FIX TIER-HARD 2026-09-20 #3: snap TIDAK boleh "nyangkut" di ukuran besar ==');
{
  // BUG (laporan user): "spam tarik membesar lalu mengecil dengan cepat → kadang
  // STUCK di ukuran besar, bukan langsung ke ukuran asal; berasa nabrak &
  // nyangkut". Berlaku SEMUA mode (1/2/4/6) — satu jalur snap.
  // AKAR (Phase 82 min-check): kalau |candidateScale| < minAbs → finalStep =
  // lastStep (mundur ke step BESAR terakhir) = DEAD-END. Terukur: tv=0.4 (raw
  // 0.4) → hasil tetap 2.0 (deviasi 1.6 = 3x step).
  // FIX: clamp finalStep ke step MINIMUM yang VALID (bukan mundur ke step besar).
  const s0 = { x: 1, y: 1, z: 1 }, p0 = { x: 0, y: 0, z: 0 };
  const BAND = 0.6, STEP_STUDS = 2, stepScale = 1;

  for (const mode of ['1side', '2side', '4side', '6side']) {
    const obj = new THREE.Mesh(GEO);
    // CATATAN: ukur deviasi pada SUMBU YANG MEMANG DI-SCALE mode itu.
    // 4side = sumbu digenggam (x) DIAM by design → mengukur x = salah ukur.
    const axesUkur = mode === '4side' ? ['y', 'z'] : ['x'];
    let maxDev = 0;
    // drag CEPAT: membesar 3x lalu langsung mengecil ke 0.4x
    for (const tv of [1, 2.0, 3.0, 0.4]) {
      for (const a of ['x', 'y', 'z']) obj.scale[a] = 1 * tv;
      const ratio = obj.scale.x / 1;
      applyScaleByMode(THREE, obj, mode, 'x', +1, s0, p0, ratio, 0.05, null, STEP_STUDS);
      const raw = 1 * tv;
      if (raw > 0.05) for (const a of axesUkur) maxDev = Math.max(maxDev, Math.abs(obj.scale[a] - raw));
    }
    check(maxDev <= BAND * stepScale + 1e-9,
      `${mode}: drag cepat besar→kecil tidak nyangkut (dev maks ${maxDev.toFixed(3)} ≤ ${(BAND*stepScale).toFixed(2)})`);
  }

  // blok tetap tidak bisa mengecil di bawah step valid minimum
  const m = new THREE.Mesh(GEO);
  for (const tv of [1, 2.0, -1.6]) {
    m.scale.x = 1 * tv;
    applyScaleByMode(THREE, m, '1side', 'x', +1, s0, p0, m.scale.x / 1, 0.05, null, STEP_STUDS);
  }
  check(Math.abs(m.scale.x - 1) < 1e-6, `tembus nol: berhenti di ukuran awal 1.0 (dapat ${m.scale.x.toFixed(3)})`);

  // kembali ke asal saat drag balik ke asal
  const m2 = new THREE.Mesh(GEO);
  for (const tv of [1, 3.0, 0.4, 2.5, 1.0]) {
    m2.scale.x = 1 * tv;
    applyScaleByMode(THREE, m2, '1side', 'x', +1, s0, p0, m2.scale.x / 1, 0.05, null, STEP_STUDS);
  }
  check(Math.abs(m2.scale.x - 1) < 1e-9, `bolak-balik: kembali ke 1.0 (dapat ${m2.scale.x.toFixed(3)})`);
}

console.log(`\nRESULT ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
