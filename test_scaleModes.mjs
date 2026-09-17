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

console.log(`\nRESULT ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
