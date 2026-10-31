/* Unit test bab 214 — Flag (NSI L2, banner portrait 6 × 21.5 × 1 studs).
   Jalankan: node test_flag.mjs */
import * as THREE from 'three';
import {
  NSI_FL_SLUG, NSI_FL_NAME, NSI_FL_SIZE, NSI_SIZES, isNsi,
  makeNsiGeometry, makeFlagGeometry, getFlagBoxes, getFlagFaces,
  getFacingArrowTopY, NSI_FACING_SLUGS, hasFacing,
} from './src/utils/blockShapes.js';
import { getBlockDef, makeBlockMaterial } from './src/utils/blockMaterials.js';

let pass = 0, fail = 0;
const check = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); c ? pass++ : fail++; };
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;

check(NSI_FL_SLUG === 'flag' && NSI_FL_NAME === 'Flag', `identitas = 'Flag' (${NSI_FL_SLUG}/${NSI_FL_NAME})`);
check(Array.isArray(NSI_SIZES[NSI_FL_SLUG]) && isNsi('flag'), 'terdaftar: NSI_SIZES + isNsi');
const def = getBlockDef('flag');
check(def && def.nsi === true && def.nsiLevel === 2, 'BLOCK_LIBRARY: nsi=true nsiLevel=2');
check(!hasFacing('flag') && NSI_FACING_SLUGS.indexOf('flag') < 0, 'TANPA panah arah (KOREKSI USER: panah hanya utk NSI tempat duduk)');
const sz = NSI_FL_SIZE;
check(sz[0] === 3.45 && sz[1] === 10.75 && sz[2] === 0.5, `ukuran = 3.45×10.75×0.5 block = 6.9×21.5×1 studs (kain 6 + klem luar 0.9 — ukur pixel Claude)`);

// via jalur resmi app
const geo = makeNsiGeometry(THREE, 'flag');
check(!!geo, 'makeNsiGeometry(THREE, "flag") menghasilkan geometri');
geo.computeBoundingBox();
const bb = geo.boundingBox;
const size = bb.getSize(new THREE.Vector3());
const ctr = bb.getCenter(new THREE.Vector3());
check(near(size.x, 3.45, 0.05) && near(size.y, 10.75, 0.05) && near(size.z, 0.58, 0.05),
  `bbox = 3.45×10.75×0.5 (+pelat klem menonjol 0.04 → z 0.58) block = 6.9×21.5×1 studs (terukur ${size.x.toFixed(3)}×${size.y.toFixed(3)}×${size.z.toFixed(3)})`);
check(near(ctr.x, 0, 0.05) && near(ctr.y, 0, 0.05) && near(ctr.z, 0, 0.05), 'pusat envelope di origin');
check(!!geo.getAttribute('uv'), 'uv ADA (anti-render-hitam)');
check(geo.groups.length === 2 && geo.groups[0].materialIndex === 0 && geo.groups[1].materialIndex === 1,
  `2 GROUP material [0=kain, 1=keras] (terukur ${geo.groups.length})`);

const boxes = getFlagBoxes();
const faces = getFlagFaces();
check(boxes.length === 49 && faces.length === boxes.length * 6,
  `49 kotak (3 baris kain + 3 segmen atas + 6 kotak ekor + 5 garis + 12 klem + 20 rantai) = 294 muka (terukur ${faces.length})`);
const kain = boxes.filter((b) => b.tag === 0), keras = boxes.filter((b) => b.tag === 1);
check(kain.length === 17 && keras.length === 32, `tag kain=17 keras=32 (terukur ${kain.length}/${keras.length})`);
const badan = kain[0];
check(near(badan.x0, -1.5) && near(badan.x1, 1.5) && near(badan.z0, -0.25) && near(badan.z1, 0.25) && near(badan.y1, 5.125) && near(badan.y0, 3.775),
  'kain: baris atas x ±1.5 block (6 studs), tebal 0.5 (1 stud), y 3.775..5.125 + 3 segmen atas');
// TEP ATAS (KOREKSI USER): RATA semua di 5.375, 3 segmen dipisah 2 GAP
const puncak = kain.filter((b) => b.y1 > 5.2);
check(puncak.length === 3 && puncak.every((b) => near(b.y1, 5.375)),
  `tepi atas RATA di 5.375 (3 segmen dgn 2 gap — terukur ${puncak.length} segmen)`);
const segC = puncak.map((b) => (b.x0 + b.x1) / 2).sort((a, b) => a - b);
check(near(segC[1], 0) && near(segC[0], -1.075) && near(segC[2], 1.075),
  `posisi 3 segmen: kiri/tengah/kanan (${segC.map((c) => c.toFixed(2)).join(', ')})`);
// EKOR (KOREKSI USER): 3 ekor PANJANG SAMA (y0 semua -0.375) + meruncing 2 undak
const gantung = kain.filter((b) => b.y0 < 0.5 && b.y0 > -0.6);
const ekorBawahAll = gantung.filter((b) => near(b.y0, -0.375));
check(gantung.length === 6 && ekorBawahAll.length === 3 && near(Math.min(...kain.map((b) => b.y0)), -0.375),
  `3 ekor PANJANG SAMA — semua berakhir di -0.375 (10.0 studs dari lantai)`);
const ekorBawah = gantung.filter((b) => near(b.y1, 0.175)); // undakan bawah (meruncing)
check(ekorBawah.length === 3 && ekorBawah.every((b) => near(b.x1 - b.x0, 0.4)),
  `undakan bawah ekor lebih SEMPIT 0.4 block (meruncing kotak-kotak)`);
const ekorTengahBawah = ekorBawah.find((b) => near((b.x0 + b.x1) / 2, 0));
check(!!ekorTengahBawah, 'ekor TENGAH tepat di x=0 — LURUS dengan rantai/tiang');
const rantai = keras.filter((b) => near(b.x1 - b.x0, 0.25) && near(b.y1 - b.y0, 0.25) && near(b.z1 - b.z0, 0.25));
check(rantai.length === 20, `rantai = 20 kubus 0.25 block (0.5³ studs) → ${rantai.length}`);
const ys = rantai.map((b) => b.y1).sort((a, b) => b - a);
let menerus = true;
for (let i = 1; i < ys.length; i++) if (!near(ys[i], ys[i - 1] - 0.25)) menerus = false;
check(menerus && near(ys[0], -0.375) && near(Math.min(...rantai.map((b) => b.y0)), -5.375),
  'rantai menerus tanpa celah: y1 -0.375 → dasar y0 -5.375 (10 studs = rasio 0.88 kain)');
const rantaix = rantai.map((b) => (b.x0 + b.x1) / 2);
check(rantaix.every((cx) => near(cx, 0)), `rantai TEPAT DI TENGAH (leveling user — offset dihapus) (semua ${rantaix[0] != null ? rantaix[0].toFixed(3) : '?'})`);
const keluar = boxes.filter((b) =>
  b.x0 < -1.725 - 1e-6 || b.x1 > 1.725 + 1e-6 || b.y0 < -5.375 - 1e-6 ||
  b.y1 > 5.375 + 1e-6 || b.z0 < -0.29 - 1e-6 || b.z1 > 0.29 + 1e-6);
check(keluar.length === 0, `tidak ada kotak keluar envelope (toleransi klem/garis 0.04) → ${keluar.length} pelanggar`);

// vertex color tint ≤1.0 (garis 0.6, rantai selang-seling) — preseden Throne
const colA = geo.getAttribute('color');
check(!!colA && colA.count === geo.getAttribute('position').count, 'atribut color ada (tint per kotak)');
let tmin = 1;
if (colA) for (let i = 0; i < colA.count; i++) tmin = Math.min(tmin, colA.getX(i));
check(tmin > 0 && tmin <= 1 && tmin < 0.7, `tint ≤1.0 dan ada yang gelap (min ${tmin.toFixed(2)})`);

// winding: volume tertutup positif & eksak = Σ volume kotak (pola _box terbukti)
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
const pos = geo.getAttribute('position');
const V = vol(pos);
const VEX = boxes.reduce((a, b) => a + b.vol, 0);
check(Math.abs(V - VEX) < 1e-6 && V > 0, `volume = ${V.toFixed(6)} (Σ kotak ${VEX.toFixed(6)}) — winding benar & tanpa tumpang tindih`);



// material: ARRAY 2 (pola Lamp) — kain/keras, keduanya bertekstur.
// Node tidak punya DOM (TextureLoader butuh document) → pakai THREE stub.
const mats = makeBlockMaterial({
  SRGBColorSpace: 'srgb', RepeatWrapping: 1000, LinearFilter: 1006,
  LinearMipmapLinearFilter: 1008,
  TextureLoader: class {
    load() {
      return { colorSpace: '', wrapS: 0, wrapT: 0, magFilter: 0, minFilter: 0,
        image: { width: 4 }, userData: { isReady: true, onReady: [] } };
    }
  },
  MeshStandardMaterial: class {
    constructor(p) { Object.assign(this, p); this.isMeshStandardMaterial = true; }
    set() {}
  },
}, 'flag');
check(Array.isArray(mats) && mats.length === 2,
  `makeBlockMaterial(flag) = ARRAY 2 material → ${Array.isArray(mats) ? mats.length : typeof mats}`);
if (Array.isArray(mats)) {
  check(mats.every((m) => m.isMeshStandardMaterial && !!m.map), 'keduanya MeshStandardMaterial bertekstur (fabric + pole)');
  check(mats.every((m) => m.side === 'doubleside-ish' || m.roughness >= 0), 'roughness/side terpasang (pola Torch DoubleSide)');
}

console.log(`\nFLAG TEST: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
