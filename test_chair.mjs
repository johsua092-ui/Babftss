/* Unit test Chair — NSI L2 baru (bab 210).
   Menguji: registrasi NSI, geometri (bbox/uv/winding per komponen/volume),
   dimensi studs hasil pengukuran referensi (2×2 alas, tinggi 4 studs).
   Jalankan: node test_chair.mjs   (dari root project) */
import * as THREE from 'three';
import {
  NSI_CH_SLUG, NSI_CH_NAME, NSI_CH_SIZE, NSI_SIZES, NSI_SLUGS, isNsi,
  makeNsiGeometry, getChairFaces, getFacingArrowTopY,
} from './src/utils/blockShapes.js';
import { BLOCK_LIBRARY, getBlockDef, getBlockTexPath } from './src/utils/blockMaterials.js';

let pass = 0, fail = 0;
const check = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); c ? pass++ : fail++; };

// ── A. REGISTRASI ──
check(NSI_CH_SLUG === 'chair', `slug = 'chair' (${NSI_CH_SLUG})`);
check(NSI_CH_NAME === 'Chair', `nama identitas = 'Chair' (${NSI_CH_NAME})`);
check(Array.isArray(NSI_SIZES[NSI_CH_SLUG]), 'NSI_SIZES[chair] terdaftar');
check(isNsi('chair'), 'isNsi("chair") = true (guard scale aktif)');
const def = getBlockDef('chair');
check(def && def.slug === 'chair' && def.nsi === true && def.nsiLevel === 2,
  'BLOCK_LIBRARY: nsi=true + nsiLevel=2');
check(getBlockTexPath('chair') === '/blocks/tex/chair.png',
  `path tekstur = /blocks/tex/chair.png (${getBlockTexPath('chair')})`);

// ── B. DIMENSI (block; 1 block = 2 studs) ──
const sz = NSI_SIZES[NSI_CH_SLUG];
check(sz[0] === 1 && sz[1] === 2 && sz[2] === 1,
  `ukuran NSI = 1×2×1 block = 2×2×4 studs (${sz.join('×')})`);

// ── C. GEOMETRI ──
const geo = makeNsiGeometry(THREE, 'chair');
check(!!geo, 'makeNsiGeometry(THREE, "chair") menghasilkan geometri');
if (geo) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const size = new THREE.Vector3(); bb.getSize(size);
  const center = new THREE.Vector3(); bb.getCenter(center);
  const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
  check(near(size.x, 1) && near(size.y, 2) && near(size.z, 1),
    `bbox = 1×2×1 block = 2×2×4 studs (terukur ${size.x.toFixed(4)}×${size.y.toFixed(4)}×${size.z.toFixed(4)})`);
  check(near(center.y, 0) && near(center.x, 0) && near(center.z, 0),
    `pusat envelope di origin (terukur ${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)})`);
  check(near(bb.min.y, -1) && near(bb.max.y, 1),
    'envelope Y −1..+1 (dudukan permukaan atasnya di y=0 = 2 studs dari lantai)');

  check(!!geo.getAttribute('uv'), 'atribut uv ADA (anti-render-hitam)');
  check(!!geo.getAttribute('color'), 'atribut color ADA (dua toni: cangkang gelap + badan putih)');

  // komponen: base(6) + kolom(6) + cangkang sweep(30) + bantalan penuh(30)
  const faces = getChairFaces();
  check(Array.isArray(faces) && faces.length === 6 + 6 + 30 + 30,
    `getChairFaces() = 72 muka (6+6+30+30 bantalan penuh; terukur ${faces.length})`);

  // winding konsisten per komponen (rusuk tiap komponen terpakai 2× arah berlawanan)
  const pos = geo.getAttribute('position');
  const edgeKey = (a, b) => {
    const f = (v) => [pos.getX(v), pos.getY(v), pos.getZ(v)].map((x) => x.toFixed(6)).join(',');
    const k1 = f(a), k2 = f(b);
    return k1 < k2 ? k1 + '|' + k2 + '+AB' : k2 + '|' + k1 + '+BA';
  };
  const KOMP = [[0, 6], [6, 12], [12, 42], [42, 72]];   // rentang kuad per komponen
  let masalah = 0;
  for (const [q0, q1] of KOMP) {
    const dirs = new Map();
    for (let q = q0; q < q1; q++) {
      for (let k = 0; k < 2; k++) {
        const v0 = (q * 2 + k) * 3;
        const e1 = edgeKey(v0, v0 + 1), e2 = edgeKey(v0 + 1, v0 + 2), e3 = edgeKey(v0 + 2, v0);
        [e1, e2, e3].forEach((e) => {
          const base = e.slice(0, -3), dir = e.slice(-2);
          const rec = dirs.get(base) || { AB: 0, BA: 0 };
          rec[dir]++; dirs.set(base, rec);
        });
      }
    }
    for (const [k, rec] of dirs) {
      if (rec.AB !== 1 || rec.BA !== 1) { masalah++; console.log(`    komp[${q0},${q1}): rusuk ${k} AB=${rec.AB} BA=${rec.BA}`); }
    }
  }
  check(masalah === 0, `winding konsisten + tertutup per komponen (masalah = ${masalah})`);

  // volume bertanda total (divergensi): base + kolom + dudukan + sandaran loft
  const vol = (arr) => {
    let v = 0;
    for (let t = 0; t < arr.count / 3; t++) {
      const A = [arr.getX(3*t), arr.getY(3*t), arr.getZ(3*t)];
      const B = [arr.getX(3*t+1), arr.getY(3*t+1), arr.getZ(3*t+1)];
      const C = [arr.getX(3*t+2), arr.getY(3*t+2), arr.getZ(3*t+2)];
      v += (A[0]*(B[1]*C[2]-B[2]*C[1]) + A[1]*(B[2]*C[0]-B[0]*C[2]) + A[2]*(B[0]*C[1]-B[1]*C[0])) / 6;
    }
    return v;
  };
  // analitik: base 0.175 + kolom 0.3×0.725×0.3 + cangkang 0.1398
  //           + bantalan PENUH s0..s7 Σ=0.0933 (tebal 0.07, lebar penuh −0.005)
  // Toleransi 8e-3: lempeng MENELEUK — estimasi Σ-segmen tidak eksak (efek
  // kelengkungan orde-2, terukur delta 0.006); penutupan EKSAK dijamin tes
  // rusuk per-komponen di atas.
  const V_BASE = 0.175, V_KOLOM = 0.06525, V_SHELL = 0.1398, V_PAD = 0.0933;
  const V = vol(pos);
  const VEX = V_BASE + V_KOLOM + V_SHELL + V_PAD;
  check(Math.abs(V - VEX) < 8e-3 && V > 0,
    `volume bertanda = ${V.toFixed(6)} (estimasi +${VEX.toFixed(5)}, toleransi 8e-3)`);

  // ── D. KONVENSI FACING (KOREKSI USER 2026-10-31: panah terbalik & mengambang) ──
  // Depan kursi = −Z (panah hijau menunjuk −Z) → SANDARAN wajib di +Z.
  let zBackrestMax = -9, zFrontMin = 9;
  const posC = geo.getAttribute('position');
  for (let i = 0; i < posC.count; i++) {
    const y = posC.getY(i), z = posC.getZ(i);
    if (y > 0.8) zBackrestMax = Math.max(zBackrestMax, z);   // wilayah sandaran atas
    if (Math.abs(y) < 0.02 && z < 0) zFrontMin = Math.min(zFrontMin, z); // dudukan sisi depan
  }
  check(zBackrestMax > 0.3,
    `sandaran di +Z (terukur max z sandaran = ${zBackrestMax.toFixed(3)})`);
  check(zFrontMin < -0.4,
    `dudukan membentang ke depan −Z (terukur min z = ${zFrontMin.toFixed(3)})`);
  check(getFacingArrowTopY('chair') === 0 && getFacingArrowTopY('seat') === 0.25,
    `getFacingArrowTopY: chair=0 (dudukan), seat=0.25 (puncak)`);
}

console.log(`\nCHAIR TEST: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
