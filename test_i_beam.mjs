/* Unit test I-Beam — NSI L2 baru (bab 209).
   Menguji: registrasi NSI, geometri (bbox/uv/winding/jumlah segitiga),
   dimensi studs hasil pengukuran referensi (2×2×2; flensa 0.4; web 1.1×1.2×1.1).
   Jalankan: node test_i_beam.mjs   (dari root project) */
import * as THREE from 'three';
import {
  NSI_IB_SLUG, NSI_IB_NAME, NSI_IB_SIZE, NSI_SIZES, NSI_SLUGS, isNsi,
  makeNsiGeometry, getIbeamFaces,
} from './src/utils/blockShapes.js';
import { BLOCK_LIBRARY, getBlockDef, getBlockTexPath } from './src/utils/blockMaterials.js';

let pass = 0, fail = 0;
const check = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); c ? pass++ : fail++; };

// ── A. REGISTRASI ──
check(NSI_IB_SLUG === 'i_beam', `slug = 'i_beam' (${NSI_IB_SLUG})`);
check(NSI_IB_NAME === 'I-Beam', `nama identitas = 'I-Beam' (${NSI_IB_NAME})`);
check(Array.isArray(NSI_SIZES[NSI_IB_SLUG]), 'NSI_SIZES[i_beam] terdaftar');
check(isNsi('i_beam'), 'isNsi("i_beam") = true (guard scale aktif)');
const def = getBlockDef('i_beam');
check(def && def.slug === 'i_beam' && def.nsi === true && def.nsiLevel === 2,
  'BLOCK_LIBRARY: nsi=true + nsiLevel=2');
check(getBlockTexPath('i_beam') === '/blocks/tex/i_beam.png',
  `path tekstur = /blocks/tex/i_beam.png (${getBlockTexPath('i_beam')})`);

// ── B. DIMENSI (block; 1 block = 2 studs) ──
const sz = NSI_SIZES[NSI_IB_SLUG];
check(sz[0] === 1 && sz[1] === 1 && sz[2] === 1,
  `ukuran NSI = 1×1×1 block = 2×2×2 studs (${sz.join('×')})`);

// ── C. GEOMETRI ──
const geo = makeNsiGeometry(THREE, 'i_beam');
check(!!geo, 'makeNsiGeometry(THREE, "i_beam") menghasilkan geometri');
if (geo) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const size = new THREE.Vector3(); bb.getSize(size);
  const center = new THREE.Vector3(); bb.getCenter(center);
  const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
  check(near(size.x, 1) && near(size.y, 1) && near(size.z, 1),
    `bbox = 1×1×1 block (terukur ${size.x.toFixed(4)}×${size.y.toFixed(4)}×${size.z.toFixed(4)})`);
  check(near(center.x, 0) && near(center.y, 0) && near(center.z, 0),
    'pusat geometri di origin (0,0,0)');

  check(!!geo.getAttribute('uv'), 'atribut uv ADA (anti-render-hitam)');
  const nTri = geo.getAttribute('position').count / 3;
  // 3 kotak (2 flensa + 1 web) × 12 segitiga = 36
  check(nTri === 36, `jumlah segitiga = 36 (terukur ${nTri})`);

  // winding KONSISTEN per-kotak (heuristik centroid-global TIDAK SAH untuk
  // spool — muka dalam lekukan menghadap ke arah pusat; lihat komentar bab 209):
  // setiap rusuk tiap kotak wajib terpakai tepat 2× dengan arah BERLAWANAN
  // (kotak tertutup + orientasi konsisten), 12 segitiga per kotak.
  const pos = geo.getAttribute('position');
  const edgeKey = (a, b) => {
    const f = (v) => [pos.getX(v), pos.getY(v), pos.getZ(v)].map((x) => x.toFixed(6)).join(',');
    const k1 = f(a), k2 = f(b);
    return k1 < k2 ? k1 + '|' + k2 + '+AB' : k2 + '|' + k1 + '+BA';
  };
  let masalah = 0;
  for (let box = 0; box < 3; box++) {
    const dirs = new Map();   // rusuk tak-berarah → jumlah tiap arah
    for (let t = box * 12; t < box * 12 + 12; t++) {
      const e1 = edgeKey(3*t, 3*t+1), e2 = edgeKey(3*t+1, 3*t+2), e3 = edgeKey(3*t+2, 3*t);
      [e1, e2, e3].forEach((e) => {
        const base = e.slice(0, -3), dir = e.slice(-2);
        const rec = dirs.get(base) || { AB: 0, BA: 0 };
        rec[dir]++; dirs.set(base, rec);
      });
    }
    if (dirs.size !== 18) { masalah++; console.log(`    kotak ${box}: rusuk unik = ${dirs.size} (harus 18)`); }
    for (const [k, rec] of dirs) {
      if (rec.AB !== 1 || rec.BA !== 1) { masalah++; console.log(`    kotak ${box}: rusuk ${k} AB=${rec.AB} BA=${rec.BA} (harus 1/1)`); }
    }
  }
  check(masalah === 0, `winding konsisten + tertutup per kotak (masalah = ${masalah})`);

  // volume bertanda (divergensi): 2 flensa 1×0.2×1 + web 0.55×0.6×0.55
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
  const VEX = 0.2 + (0.55 * 0.6 * 1.0) + 0.2;   // web Z penuh: 0.55×0.6×1.0
  check(Math.abs(V - VEX) < 1e-6 && V > 0,
    `volume bertanda = ${V.toFixed(6)} (harus +${VEX})`);

  // normal vertex konsisten dengan winding (computeVertexNormals)
  const nor = geo.getAttribute('normal');
  check(!!nor, 'atribut normal ADA (computeVertexNormals)');

  // muka sumber tunggal (geometry + ikon)
  const faces = getIbeamFaces();
  check(Array.isArray(faces) && faces.length === 18,
    `getIbeamFaces() = 18 muka kuadran (3 kotak × 6; terukur ${faces.length})`);

  // proporsi terukur referensi + KOREKSI USER 2026-10-29: web inset HANYA X,
  // sumbu Z penuh 2 studs (I-beam klasik satu arah)
  const wb = 0.275;                     // web HALF-extent X (1.1 studs penuh)
  const xs = new Set(), ys = new Set(), zs = new Set();
  faces.forEach(f => f.forEach(p => { xs.add(p[0].toFixed(4)); ys.add(p[1].toFixed(4)); zs.add(p[2].toFixed(4)); }));
  const has = (set, v) => set.has(v.toFixed(4));
  check(has(ys, 0.5) && has(ys, 0.3) && has(ys, -0.3) && has(ys, -0.5),
    'tinggi Y: flensa atas 0.3..0.5, web −0.3..0.3, flensa bawah −0.5..−0.3');
  check(has(xs, -wb) && has(xs, wb),
    `web menjorok di X (±${wb} block = 1.1 studs penuh)`);
  // web = kotak ke-2 (muka indeks 6..11): Z-nya WAJIB ±0.5 (penuh, rata flensa)
  const webZ = new Set(), webX = new Set();
  faces.slice(6, 12).forEach(f => f.forEach(p => { webZ.add(p[2].toFixed(4)); webX.add(p[0].toFixed(4)); }));
  check(webZ.has('0.5000') && webZ.has('-0.5000') && webZ.size === 2,
    `web sumbu Z FULL ±0.5 block rata dengan flensa (terukur ${[...webZ].join(', ')})`);
  check(has(xs, -0.5) && has(xs, 0.5) && has(zs, -0.5) && has(zs, 0.5),
    'flensa penuh 2×2 studs pada X dan Z');
}

console.log(`\nI-BEAM TEST: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
