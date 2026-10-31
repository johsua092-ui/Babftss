/* Unit test Throne — NSI L2 baru (bab 211).
   Menguji: registrasi NSI, geometri (bbox/uv/winding per-kotak/volume eksak),
   dimensi studs (P×L 4×4, tinggi 8), konvensi facing (sandaran +Z), panah.
   Jalankan: node test_throne.mjs   (dari root project) */
import * as THREE from 'three';
import {
  NSI_TH_SLUG, NSI_TH_NAME, NSI_TH_SIZE, NSI_SIZES, isNsi,
  makeNsiGeometry, getThroneBoxes, getThroneFaces, getFacingArrowTopY,
} from './src/utils/blockShapes.js';
import { BLOCK_LIBRARY, getBlockDef, getBlockTexPath } from './src/utils/blockMaterials.js';

let pass = 0, fail = 0;
const check = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); c ? pass++ : fail++; };

// ── A. REGISTRASI ──
check(NSI_TH_SLUG === 'throne', `slug = 'throne' (${NSI_TH_SLUG})`);
check(NSI_TH_NAME === 'Throne', `nama identitas = 'Throne' (${NSI_TH_NAME})`);
check(Array.isArray(NSI_SIZES[NSI_TH_SLUG]), 'NSI_SIZES[throne] terdaftar');
check(isNsi('throne'), 'isNsi("throne") = true (guard scale aktif)');
const def = getBlockDef('throne');
check(def && def.slug === 'throne' && def.nsi === true && def.nsiLevel === 2,
  'BLOCK_LIBRARY: nsi=true + nsiLevel=2');
check(getBlockTexPath('throne') === '/blocks/tex/throne.png',
  `path tekstur = /blocks/tex/throne.png (${getBlockTexPath('throne')})`);

// ── B. DIMENSI (block; 1 block = 2 studs) ──
const sz = NSI_SIZES[NSI_TH_SLUG];
check(sz[0] === 2 && sz[1] === 4 && sz[2] === 2,
  `ukuran NSI = 2×4×2 block = 4×8×4 studs (${sz.join('×')})`);

// ── C. GEOMETRI ──
const geo = makeNsiGeometry(THREE, 'throne');
check(!!geo, 'makeNsiGeometry(THREE, "throne") menghasilkan geometri');
if (geo) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const size = new THREE.Vector3(); bb.getSize(size);
  const center = new THREE.Vector3(); bb.getCenter(center);
  const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
  check(near(size.x, 2) && near(size.y, 4) && near(size.z, 2),
    `bbox = 2×4×2 block = 4×8×4 studs (terukur ${size.x.toFixed(4)}×${size.y.toFixed(4)}×${size.z.toFixed(4)})`);
  check(near(center.y, 0) && near(center.x, 0) && near(center.z, 0),
    `pusat envelope di origin (terukur ${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)})`);
  check(near(bb.min.y, -2) && near(bb.max.y, 2),
    'envelope Y −2..+2 (lantai sampai puncak 8 studs)');

  check(!!geo.getAttribute('uv'), 'atribut uv ADA (anti-render-hitam)');
  check(!!geo.getAttribute('color'), 'atribut color ADA (dua toni: emas + bantalan marun)');

  // komponen = kotak-kotak _box berurutan (6 kuad per kotak) — tiap kotak tertutup
  const boxes = getThroneBoxes();
  const faces = getThroneFaces();
  check(Array.isArray(boxes) && boxes.length >= 20,
    `getThroneBoxes() = ${boxes.length} kotak penyusun (minimal 20)`);
  check(faces.length === boxes.length * 6,
    `getThroneFaces() = ${faces.length} muka = 6 × ${boxes.length} kotak`);
  const nQuad = faces.length;
  check(nQuad % 6 === 0, `jumlah muka kelipatan 6 (${nQuad})`);
  const pos = geo.getAttribute('position');
  check(pos.count / 3 === nQuad * 2, `segitiga = ${nQuad * 2} (terukur ${pos.count / 3})`);

  // winding: tiap kotak tertutup + konsisten (rusuk 2× arah berlawanan)
  const edgeKey = (a, b) => {
    const f = (v) => [pos.getX(v), pos.getY(v), pos.getZ(v)].map((x) => x.toFixed(6)).join(',');
    const k1 = f(a), k2 = f(b);
    return k1 < k2 ? k1 + '|' + k2 + '+AB' : k2 + '|' + k1 + '+BA';
  };
  let masalah = 0;
  for (let bIdx = 0; bIdx < boxes.length; bIdx++) {
    const dirs = new Map();
    for (let q = bIdx * 6; q < bIdx * 6 + 6; q++) {
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
    if (dirs.size !== 18) { masalah++; console.log(`    kotak ${bIdx}: rusuk unik = ${dirs.size} (harus 18)`); }
    for (const [k, rec] of dirs) {
      if (rec.AB !== 1 || rec.BA !== 1) { masalah++; console.log(`    kotak ${bIdx}: rusuk ${k} AB=${rec.AB} BA=${rec.BA}`); }
    }
  }
  check(masalah === 0, `winding konsisten + tertutup per kotak (masalah = ${masalah})`);

  // volume eksak = Σ volume kotak (divergensi per komponen)
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
  const V = vol(pos);
  const VEX = boxes.reduce((s, b) => s + b.vol, 0);
  check(Math.abs(V - VEX) < 1e-6 && V > 0,
    `volume bertanda = ${V.toFixed(6)} (Σ kotak = ${VEX.toFixed(6)})`);

  // ── D. KONVENSI FACING: sandaran di +Z, dudukan menghadap −Z ──
  // bantalan duduk (kotak bertanda cushion, di atas frame) z-tengahnya NEGATIF?
  // Sandaran = kotak tertinggi (y > 1.5) wajib di +Z (z-min kotak > 0.3).
  const tall = boxes.filter(b => (b.y1) >= 1.4);
  check(tall.length >= 4 && tall.every(b => b.z0 > 0.3),
    `sandaran+puncak di +Z (${tall.length} kotak tinggi, z ≥ ${Math.min(...tall.map(b => b.z0)).toFixed(2)})`);
  check(getFacingArrowTopY('throne') === -1.0,
    `getFacingArrowTopY('throne') = -1.0 (permukaan bantal duduk 2.0 studs)`);
}

console.log(`\nTHRONE TEST: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
