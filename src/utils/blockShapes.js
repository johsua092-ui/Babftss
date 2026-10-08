/**
 * blockShapes.js — NSI (Non-Scalable Item) shapes untuk 3D Block Simulator.
 * ================================================================
 * Dibuat 2026-10-04 atas permintaan user:
 *   "item item yang tidak bisa di scale sama sekali (NSI) ... 95% non scalable,
 *    5% scalable karena kondisi khusus ... NSI yang pertama adalah Wedge"
 *   "memiliki maksimal lebar 2 studs, maksimal panjang 2 studs, dan maksimal
 *    tinggi 2 studs" (= 1 block penuh) — WAJIB dipatuhi.
 *
 * KONSEP:
 *   - NSI = item dengan GEOMETRI KHUSUS (bukan kubus 1x1x1) → TIDAK bisa
 *     di-scale. Kalau user pakai tool 'scale' ke NSI → muncul peringatan.
 *   - NSI tetap bisa dipakai di tool lain (place/move/rotate/clone/mirror/delete).
 *   - Bounding box maksimal 1 block (2x2x2 studs).
 *
 * WEDGE (NSI pertama) — HASIL VERIFIKASI (bukan tebakan):
 *   5 foto user (satu objek, berbagai sudut) + render numerik + verifikasi vision
 *   dengan kerangka kubus → bentuknya CORNER WEDGE (hip corner / potongan sudut
 *   kubus): 1 alas persegi + 2 dinding tegak siku-siku + 2 bidang miring yang
 *   bertemu di 1 garis punggungan (ridge) diagonal; puncak (apex) di SATU sudut
 *   atas. Volume = 1/3 kubus. Solid/watertight (5 titik, 8 rusuk, 5 muka).
 *   Terbukti: "alas penuh, puncak di satu sudut atas, 2 bidang miring bertemu di
 *   garis punggungan ... TIDAK ADA CACAT" (vision + edge-closure test).
 *
 * ATURAN KODE:
 *   - Geometri berskala 1x1x1 (unit block), titik tengah di origin → sama seperti
 *     block biasa (BoxGeometry(1,1,1)) → bounding box 1 block.
 *   - Warna identitas Wedge: RGB(213,115,61) = #D5733D (dari user).
 *   - JANGAN ubah geometri block biasa — file ini HANYA untuk NSI.
 *   - Winding segitiga di-ORIENTASI OTOMATIS menghadap KELUAR (anti muka hilang).
 */

export const NSI_WEDGE_SLUG = 'corner_wedge';
export const NSI_WEDGE_NAME = 'Corner Wedge';
// Warna identitas (user: "red 213 green 115 blue 61") — SAMA untuk Wedge.
export const NSI_WEDGE_COLOR = '#D5733D';

// ── NSI #2: WEDGE (ramp / prisma segitiga siku-siku) ──
// Dari 3 foto user (dengan Wooden Block sebagai referensi ukuran):
// 1 bidang miring LURUS, TANPA punggungan. Volume = ½ block.
export const NSI_RAMP_SLUG = 'wedge';
export const NSI_RAMP_NAME = 'Wedge';

// ── NSI #3: TRUSS (rangka batang terbuka / open lattice frame) ──
// KOREKSI USER (2026-10-04): *"trusnya kenapa hanya setinggi 1 block? harusnya
// setinggi 2 block dong atau 4 studs"* → Truss = 1 item TINGGI 2 BLOCK.
// Dari 5 foto user (Wooden Block = referensi) + verifikasi 3 sumber:
//   • 4 batang vertikal (tinggi penuh 2 block)
//   • 12 batang horizontal = 3 bingkai (bawah, TENGAH, atas) × 4
//   • 16 batang diagonal = X-bracing 2 tingkat di 4 sisi tegak
//   Rongga tengah TEMBUS PANDANG. Sambungan = butt joint + baut (tanpa pelat).
export const NSI_TRUSS_SLUG = 'truss';
export const NSI_TRUSS_NAME = 'Truss';

// ── NSI LEVEL 2 #1: SEAT (kursi dekorasi) — konstanta (dipakai NSI_SIZES) ──
// TINGGI = 0.5 BLOCK (1 stud), BUKAN 1 block. KOREKSI USER (2026-10-04):
// *"dia itu tingginya setengah block atau 1 studs aja ini malah 2 studs"*.
// Diverifikasi 3 cara: zoom foto (permukaan dudukan sejajar TENGAH block kayu)
// → tinggi kursi = 0.5 block. Lebar/panjang tetap 1 block.
export const NSI_SEAT_SLUG = 'seat';
export const NSI_SEAT_NAME = 'Seat';
export const NSI_SEAT_SIZE = [1, 0.5, 1];   // 2 x 1 x 2 studs

// ── NSI LEVEL 2 #2: STEP (undakan/bangku panjang) — konstanta ──
// PERMINTAAN USER (2026-10-04): *"nama identitasnya 'Step' ... tingginya 1 studs
// sama kayak seats cuman ini panjang ke kiri atau kanan bangkunya itu 2 block
// tapi lebarnya itu 1 block aja"*.
// → Ukuran: 2 × 0.5 × 1 block = 4 × 1 × 2 studs.
// Dari 4 foto + zoom (Wooden Block = pembanding):
//   • 1 undakan datar (BUKAN tangga bertingkat), permukaan atas rata satu bidang
//   • penopang vertikal di ujung KIRI & KANAN (profil huruf "U" terbalik)
//   • kolong tengah berongga (tembus)
//   • semua kotak tajam (tidak ada bagian membulat)
//   • tekstur kayu + detail paku
export const NSI_STEP_SLUG = 'step';
export const NSI_STEP_NAME = 'Step';
export const NSI_STEP_SIZE = [2, 0.5, 1];   // 4 x 1 x 2 studs

// ── NSI LEVEL 2 #3: MAST (tiang kapal / crow's nest) — konstanta ──
// KONFIRMASI USER (2026-10-04): tinggi 36 studs, diameter geladak bundar 10 studs.
// Batas "maks 2x2x2 studs" = HANYA Level 1 (easy) → Level 2 bebas.
// TANPA facing (bukan item ber-arah).
// Terukur dari 4 foto: diameter tiang ~1.6 studs; geladak ~9 studs tinggi
// (lantai ~3 + pagar ~6) di ~16-25 studs dari bawah; 8 baluster + ring gelap;
// ujung dome membulat; bendera segitiga MERAH (RGB 165,10,7).
export const NSI_MAST_SLUG = 'mast';
export const NSI_MAST_NAME = 'Mast';
export const NSI_MAST_SIZE = [5, 18, 5];    // geladak 10 studs = 5 block; tinggi 36 studs = 18 block

// ── NSI LEVEL 2 #4: HELM (roda kemudi kapal) — konstanta ──
// PERMINTAAN USER (2026-10-05): *"nama identitasnya adalah 'Helm' tinggi 5 studs,
// panjang 2 studs, lebar 2 studs"*.
// CATATAN USER (verbatim): *"iya itu memang kemudi, tapi identitasnya adalah
// 'Helm' terdengar aneh tapi aturannya emang gitu, jadi patuhi aturan saya"*.
// → Ukuran: 1 × 2.5 × 1 block = 2 × 5 × 2 studs.
// Terukur dari 5 foto + grid (Gemini): roda kemudi ⌀262 px, tinggi total 465 px,
// alas 44 px & lebar 198 px (rasio 0.756 → alas ≈ 1 block), 8 jeruji/jari-jari,
// TANPA facing (hijau di foto = bounding box editor, bukan panah).
export const NSI_HELM_SLUG = 'helm';
export const NSI_HELM_NAME = 'Helm';
export const NSI_HELM_SIZE = [1, 2.5, 1];   // 2 x 5 x 2 studs

// ── NSI #4: ROD (7 varian) ──
// PERMINTAAN USER (2026-10-04): *"block kotak dengan tekstur sama dengan nama
// block tersebut tapi dia panjang dan lebarnya sama 1 studs, tapi tingginya 3
// studs ... contoh 'Wood Rod' berarti dia teksturnya 100% memakai tekstur wooden
// block tapi panjang 1 studs, lebar 1 studs, tinggi 3 studs."*
// → Ukuran: 1 × 3 × 1 studs = 0.5 × 1.5 × 0.5 block.
// → Tekstur: 100% dari block dasarnya (Wood/Stone/Rusted/Metal/Concrete/Marble/
//   Titanium). Texel density SAMA dengan block dasar (1 tile = 1 block = 2 studs)
//   → UV di-skala per muka sesuai ukuran muka dalam satuan block (anti-melar).
// → NSI: TIDAK bisa di-scale.
export const NSI_ROD_SLUGS = [
  'wood_rod', 'stone_rod', 'rusted_rod', 'metal_rod',
  'concrete_rod', 'marble_rod', 'titanium_rod',
];
export const NSI_ROD_NAMES = {
  wood_rod: 'Wood Rod',
  stone_rod: 'Stone Rod',
  rusted_rod: 'Rusted Rod',
  metal_rod: 'Metal Rod',
  concrete_rod: 'Concrete Rod',
  marble_rod: 'Marble Rod',
  titanium_rod: 'Titanium Rod',
};
// Ukuran Rod dalam satuan BLOCK [lebar(x), tinggi(y), kedalaman(z)].
export const NSI_ROD_SIZE = [0.5, 1.5, 0.5];

/**
 * UKURAN NSI dalam satuan BLOCK [lebar(x), tinggi(y), kedalaman(z)].
 * WAJIB dipakai saat menaruh block (posY = setengah tinggi) supaya item yang
 * lebih tinggi dari 1 block TIDAK amblas ke lantai.
 *   BUG TERUKUR (2026-10-04): posY di-hardcode 0.5 → Truss (tinggi 2 block)
 *   tenggelam separuh ke bawah lantai.
 */
export const NSI_SIZES = {
  [NSI_WEDGE_SLUG]: [1, 1, 1],
  [NSI_RAMP_SLUG]: [1, 1, 1],
  [NSI_TRUSS_SLUG]: [1, 2, 1],
  [NSI_SEAT_SLUG]: [1, 0.5, 1],
  [NSI_STEP_SLUG]: [2, 0.5, 1],
  [NSI_MAST_SLUG]: [5, 18, 5],
  [NSI_HELM_SLUG]: [1, 2.5, 1],
};
// Rod: semua varian ukurannya sama (1 x 3 x 1 studs).
NSI_ROD_SLUGS.forEach((s) => { NSI_SIZES[s] = NSI_ROD_SIZE.slice(); });

/** Ukuran item (block) berdasarkan slug. Non-NSI = [1,1,1]. */
export function getNsiSize(slug) {
  return NSI_SIZES[slug] || [1, 1, 1];
}

// Daftar NSI yang sudah terdaftar.
export const NSI_SLUGS = [NSI_WEDGE_SLUG, NSI_RAMP_SLUG, NSI_TRUSS_SLUG, NSI_SEAT_SLUG, NSI_STEP_SLUG, NSI_MAST_SLUG, NSI_HELM_SLUG, ...NSI_ROD_SLUGS];
export function isNsi(slug) {
  return NSI_SLUGS.indexOf(slug) >= 0;
}

/**
 * Buat geometri CORNER WEDGE (hip corner). Bounding box 1x1x1, pusat di origin.
 *
 * Titik (lokal, −0.5..+0.5), Y = atas (konvensi Three.js):
 *   a = (−0.5, −0.5, −0.5)  alas, depan-kiri
 *   b = (+0.5, −0.5, −0.5)  alas, depan-kanan
 *   c = (−0.5, −0.5, +0.5)  alas, belakang-kiri
 *   d = (+0.5, −0.5, +0.5)  alas, belakang-kanan
 *   h = (+0.5, +0.5, +0.5)  APEX (puncak, di sudut atas)
 * (3 titik atas lain — e, f, g — "dibuang" oleh bentuk ini.)
 *
 * Muka: 1 alas (persegi, 2 segitiga) + 2 dinding tegak + 2 lereng miring.
 */
export function makeWedgeGeometry(THREE) {
  const a = [-0.5, -0.5, -0.5];
  const b = [ 0.5, -0.5, -0.5];
  const c = [-0.5, -0.5,  0.5];
  const d = [ 0.5, -0.5,  0.5];
  const h = [ 0.5,  0.5,  0.5]; // APEX

  // Muka (urutan titik bebas — winding diperbaiki otomatis di _buildFaces).
  const faces = [
    [a, b, d, c],   // ALAS (persegi)
    [b, d, h],      // dinding tegak  x = +0.5
    [c, d, h],      // dinding tegak  z = +0.5
    [h, a, b],      // lereng miring 1
    [h, a, c],      // lereng miring 2
  ];
  return _buildFaces(THREE, faces);
}

/**
 * Buat geometri WEDGE (ramp / prisma segitiga siku-siku). Bounding box 1x1x1.
 *
 * Dari 3 foto user (dengan Wooden Block sebagai referensi): 1 bidang miring
 * LURUS (tanpa punggungan), volume = ½ block. Lereng turun dari sisi belakang
 * (z = +0.5, tinggi penuh) ke sisi depan (z = −0.5, lantai).
 *
 * Titik:
 *   a = (−0.5, −0.5, −0.5)  bawah depan-kiri
 *   b = (+0.5, −0.5, −0.5)  bawah depan-kanan
 *   c = (−0.5, −0.5, +0.5)  bawah belakang-kiri
 *   d = (+0.5, −0.5, +0.5)  bawah belakang-kanan
 *   e = (−0.5, +0.5, +0.5)  atas belakang-kiri
 *   f = (+0.5, +0.5, +0.5)  atas belakang-kanan
 */
export function makeRampGeometry(THREE) {
  const a = [-0.5, -0.5, -0.5];
  const b = [ 0.5, -0.5, -0.5];
  const c = [-0.5, -0.5,  0.5];
  const d = [ 0.5, -0.5,  0.5];
  const e = [-0.5,  0.5,  0.5];
  const f = [ 0.5,  0.5,  0.5];

  const faces = [
    [a, b, d, c],   // ALAS (persegi)
    [c, d, f, e],   // DINDING BELAKANG (z = +0.5)
    [a, c, e],      // DINDING KIRI (x = −0.5, segitiga)
    [b, d, f],      // DINDING KANAN (x = +0.5, segitiga)
    [a, b, f, e],   // LERENG (persegi, dari belakang-atas ke depan-bawah)
  ];
  return _buildFaces(THREE, faces);
}

/**
 * Bangun BufferGeometry dari daftar muka (segitiga / persegi).
 * - Winding otomatis menghadap KELUAR (menjauhi centroid) → tidak ada muka hilang.
 * - UV box-mapping (WAJIB untuk material bertekstur; tanpa UV → render hitam).
 */
/**
 * Bangun BufferGeometry dari daftar muka.
 *
 * `opts.autoFix` (default TRUE) = perbaiki winding otomatis berdasarkan CENTROID
 * global. Wajib untuk bentuk yang titiknya ditulis tangan (Wedge/Ramp) yang
 * urutannya bebas.
 *
 * ⚠️ JEBAKAN TERUKUR (2026-10-04, bug "kaki Seat tipis seperti kertas"):
 * autoFix BERDASARKAN CENTROID GLOBAL SALAH untuk bentuk yang tersusun dari
 * BANYAK KOTAK (Seat, Truss). Muka-DALAM setiap kotak (mis. sisi dalam kaki
 * yang menghadap tengah item) akan dibalik → muka hilang → kotak tampak
 * "kopong/lembaran 2D". Padahal `_box`/`_beam` SUDAH menghasilkan winding
 * keluar yang benar (terbukti: cross product tiap muka _box mengarah keluar).
 * → Untuk bentuk rakitan kotak, panggil dengan { autoFix: false }.
 */
function _buildFaces(THREE, faces, opts) {
  const autoFix = !(opts && opts.autoFix === false);
  // centroid semua titik unik
  const uniq = [];
  faces.forEach((f) => f.forEach((p) => {
    if (!uniq.some((q) => Math.abs(q[0] - p[0]) < 1e-9 && Math.abs(q[1] - p[1]) < 1e-9 && Math.abs(q[2] - p[2]) < 1e-9)) uniq.push(p);
  }));
  const cx = uniq.reduce((s, p) => s + p[0], 0) / uniq.length;
  const cy = uniq.reduce((s, p) => s + p[1], 0) / uniq.length;
  const cz = uniq.reduce((s, p) => s + p[2], 0) / uniq.length;

  const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
  const cross = (u, v) => [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];

  const pos = [];
  const uvs = [];
  const pushTri = (p, q, r) => {
    const n = cross(sub(q, p), sub(r, p));
    const mid = [(p[0] + q[0] + r[0]) / 3, (p[1] + q[1] + r[1]) / 3, (p[2] + q[2] + r[2]) / 3];
    const out = [mid[0] - cx, mid[1] - cy, mid[2] - cz];
    let A = p, B = q, C = r;
    if (autoFix && dot(n, out) < 0) { A = p; B = r; C = q; }
    pos.push(...A, ...B, ...C);
    const nn = cross(sub(B, A), sub(C, A));
    const ax = Math.abs(nn[0]), ay = Math.abs(nn[1]), az = Math.abs(nn[2]);
    const uvOf = (v) => {
      if (ax >= ay && ax >= az) return [v[2] + 0.5, v[1] + 0.5];
      if (ay >= az) return [v[0] + 0.5, v[2] + 0.5];
      return [v[0] + 0.5, v[1] + 0.5];
    };
    uvs.push(...uvOf(A), ...uvOf(B), ...uvOf(C));
  };

  faces.forEach((f) => {
    if (f.length === 4) { pushTri(f[0], f[1], f[2]); pushTri(f[0], f[2], f[3]); }
    else pushTri(f[0], f[1], f[2]);
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Buat geometri TRUSS (rangka batang terbuka). Bounding box 1 x 2 x 1 block
 * (= 2 x 4 x 2 studs), pusat di origin. Y = atas.
 *
 * KOREKSI USER (2026-10-04): *"trusnya kenapa hanya setinggi 1 block? harusnya
 * setinggi 2 block dong atau 4 studs"* — jadi Truss = 1 item TINGGI 2 BLOCK.
 * Garis tengah yang terlihat di foto = RAIL TENGAH (bukan sambungan 2 item).
 *
 * Struktur (dari 5 foto user):
 *   • 4 batang vertikal di sudut (tinggi penuh 2 block)
 *   • 12 batang horizontal = 3 bingkai (bawah, TENGAH, atas) x 4 batang
 *   • 16 batang diagonal = X-bracing 2 tingkat di 4 sisi tegak (4 X per 2 tingkat)
 * Ketebalan batang = 1/8 block. Rongga tengah tembus pandang (open frame).
 */
export function makeTrussGeometry(THREE) {
  return _buildFaces(THREE, getTrussFaces());
}

/**
 * Daftar MUKA Truss (sumber tunggal). Dipakai untuk geometry & untuk render ikon
 * (biar ikon selalu mengikuti geometri — tidak ada duplikasi yang bisa drift).
 */
export function getTrussFaces() {
  const EX = 0.5;             // setengah lebar (x)
  const EZ = 0.5;             // setengah kedalaman (z)
  const EY = 1.0;             // setengah tinggi = 1 block (total 2 block)
  const B = 0.125;            // tebal batang (=1/8 block)
  const CX = EX - B / 2;      // garis tengah batang sudut (x)
  const CZ = EZ - B / 2;      // garis tengah batang sudut (z)
  const faces = [];

  // ── 4 batang VERTIKAL (sudut, tinggi penuh) ──
  [[-CX, -CZ], [CX, -CZ], [-CX, CZ], [CX, CZ]].forEach(([x, z]) => {
    faces.push(..._box(x - B / 2, x + B / 2, -EY, EY, z - B / 2, z + B / 2));
  });

  // ── 12 batang HORIZONTAL: 3 bingkai (bawah, TENGAH, atas) ──
  const YS = [-EY + B / 2, 0, EY - B / 2];
  YS.forEach((y) => {
    faces.push(..._box(-CX, CX, y - B / 2, y + B / 2, -EZ, -EZ + B));   // sisi z = -EZ
    faces.push(..._box(-CX, CX, y - B / 2, y + B / 2, EZ - B, EZ));     // sisi z = +EZ
    faces.push(..._box(-EX, -EX + B, y - B / 2, y + B / 2, -CZ, CZ));   // sisi x = -EX
    faces.push(..._box(EX - B, EX, y - B / 2, y + B / 2, -CZ, CZ));     // sisi x = +EX
  });

  // ── 16 batang DIAGONAL: X-bracing 2 tingkat di 4 sisi tegak ──
  const YL = -EY + B / 2, YM = 0, YU = EY - B / 2;   // garis tengah rail bawah/tengah/atas
  // Sisi z = ±(EZ−B/2): diagonal pada bidang X–Y
  [-CZ, CZ].forEach((z) => {
    // tingkat bawah
    faces.push(..._beam([-CX, YL, z], [CX, YM, z], B));
    faces.push(..._beam([CX, YL, z], [-CX, YM, z], B));
    // tingkat atas
    faces.push(..._beam([-CX, YM, z], [CX, YU, z], B));
    faces.push(..._beam([CX, YM, z], [-CX, YU, z], B));
  });
  // Sisi x = ±(EX−B/2): diagonal pada bidang Z–Y
  [-CX, CX].forEach((x) => {
    faces.push(..._beam([x, YL, -CZ], [x, YM, CZ], B));
    faces.push(..._beam([x, YL, CZ], [x, YM, -CZ], B));
    faces.push(..._beam([x, YM, -CZ], [x, YU, CZ], B));
    faces.push(..._beam([x, YM, CZ], [x, YU, -CZ], B));
  });

  return faces;
}

/** Kotak axis-aligned → 6 muka persegi (untuk batang lurus). */
function _box(x0, x1, y0, y1, z0, z1) {
  const p = (x, y, z) => [x, y, z];
  return [
    [p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)],
    [p(x0, y0, z0), p(x0, y1, z0), p(x1, y1, z0), p(x1, y0, z0)],
    [p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1)],
    [p(x0, y1, z0), p(x0, y1, z1), p(x1, y1, z1), p(x1, y1, z0)],
    [p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), p(x0, y1, z0)],
    [p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), p(x1, y0, z1)],
  ];
}

/**
 * Kotak ber-ROTASI pada sumbu Y (radial). Dipakai untuk tiang penyangga Mast
 * supaya arahnya MENGIKUTI lingkaran platform (koreksi user 2026-10-04:
 * *"arahnya balok-balok penyangga ikutin si platform bundar ini jadi lebih
 * rapi"*). Winding SAMA dengan `_box` (rotasi mempertahankan orientasi) →
 * aman dipakai dengan autoFix:false.
 */
function _boxRotY(cx, cz, w, d, y0, y1, a) {
  const c = Math.cos(a), s = Math.sin(a);
  const P = (lx, y, lz) => [cx + lx * c - lz * s, y, cz + lx * s + lz * c];
  const x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2;
  return [
    [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)],
    [P(x0, y0, z0), P(x0, y1, z0), P(x1, y1, z0), P(x1, y0, z0)],
    [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)],
    [P(x0, y1, z0), P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0)],
    [P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)],
    [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)],
  ];
}

/** Batang miring dari titik p ke q dengan penampang bujur sangkar sisi t → 6 muka. */
function _beam(p, q, t) {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

  const dir = norm(sub(q, p));
  let ref = Math.abs(dir[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = norm(cross(dir, ref));
  const v = norm(cross(dir, u));
  const h = t / 2;
  const cornersAt = (pt) => [
    add(pt, add([u[0] * h, u[1] * h, u[2] * h], [v[0] * h, v[1] * h, v[2] * h])),
    add(pt, add([u[0] * h, u[1] * h, u[2] * h], [-v[0] * h, -v[1] * h, -v[2] * h])),
    add(pt, add([-u[0] * h, -u[1] * h, -u[2] * h], [-v[0] * h, -v[1] * h, -v[2] * h])),
    add(pt, add([-u[0] * h, -u[1] * h, -u[2] * h], [v[0] * h, v[1] * h, v[2] * h])),
  ];
  const A = cornersAt(p), Bc = cornersAt(q);
  return [
    A, Bc,
    [A[0], A[1], Bc[1], Bc[0]],
    [A[3], A[2], Bc[2], Bc[3]],
    [A[0], A[3], Bc[3], Bc[0]],
    [A[1], A[2], Bc[2], Bc[1]],
  ];
}

/**
 * Buat geometri ROD (kotak ramping): lebar 0.5 block, tinggi 1.5 block,
 * kedalaman 0.5 block (= 1 x 3 x 1 studs). Pusat di origin, Y = atas.
 *
 * UV: `_buildFaces` memetakan uv = koordinat (block) + 0.5 → texel density
 * SAMA dengan block dasar (1 tile = 1 block). Karena koordinat rod hanya
 * 0.5/1.5 block, tekstur otomatis "di-crop" proporsional → tidak melar
 * (terukur: muka samping = 0.5 x 1.5 tile, muka atas = 0.5 x 0.5 tile).
 */
export function makeRodGeometry(THREE) {
  const E = NSI_ROD_SIZE;      // [0.5, 1.5, 0.5] block
  const hx = E[0] / 2, hy = E[1] / 2, hz = E[2] / 2;
  return _buildFaces(THREE, _box(-hx, hx, -hy, hy, -hz, hz));
}

// ── NSI LEVEL 2 #1: SEAT (kursi dekorasi) ──
// PERMINTAAN USER (2026-10-04): item NSI level 2 pertama, nama identitas "Seat".
// Dari 4 foto + zoom (Wooden Block = pembanding ukuran):
//   • Bangku TANPA sandaran, 4 kaki balok
//   • Tinggi 1 block (2 studs), lebar 1 block, panjang 1 block (2x2x2 studs)
//   • Dudukan CEKUNG (inset) di dalam bingkai kayu
//   • Rangka/bingkai/kaki = TEKSTUR KAYU (wood_block)
//   • Dudukan tengah = HITAM KASAR (coal_block = batu bara, paling cocok)
//   • Kolong BERONGGA (4 kaki, tembus pandang)
// UNIK (permintaan user): saat GHOST, muncul PANAH HIJAU penunjuk arah hadap
//   yang IKUT berputar dgn keybind R/T/Y; panah HILANG setelah block ditaruh.
// (Konstanta NSI_SEAT_SLUG/NAME/SIZE dideklarasikan di atas, dekat NSI_TRUSS.)

/**
 * Daftar MUKA Seat (sumber tunggal: geometry + ikon).
 *
 * KOREKSI USER (2026-10-04) — 2 bug:
 *  1. *"dia itu tingginya setengah block atau 1 studs aja ini malah 2 studs"*
 *     → tinggi = 0.5 BLOCK (1 stud), bukan 1 block. Lebar/panjang 1 block.
 *  2. *"ini aneh kakinya seatnya kamu lihat kok gitu sih?"* → KAKI TERLALU TIPIS
 *     (LEGB 0.16) sehingga dari sudut pandang tertentu hanya terlihat sebagai
 *     bidang datar tanpa ketebalan (tertangkap vision: "tipis seperti kertas").
 *     → LEGB dinaikkan 0.30 (balok kokoh) + di sudut paling LUAR (flush).
 * Bingkai dinaikkan jadi TH 0.16 (dari 0.25) supaya kolong tetap terlihat
 * (proporsi foto: kolong ≈ 60-65% tinggi total).
 */
export function getSeatFaces() {
  const E = 0.5;                 // setengah LEBAR/PANJANG (1 block)
  const YB = -0.25;              // alas (bawah)
  const TOP = 0.25;              // puncak → tinggi total = 0.5 block (1 stud) ✓
  const TH = 0.16;               // tebal bingkai atas
  const FRAME_BOT = TOP - TH;    // 0.09 = alas bingkai (kaki naik SAMPAI sini)
  const LEGB = 0.30;             // penampang kaki (BALOK KOKOH, bukan lembaran)
  const SEAT_TOP = TOP - 0.03;   // permukaan dudukan (sedikit cekung dari tepi atas)
  const IN = 0.14;               // lebar bibir bingkai
  const faces = [];

  // 1) Bingkai atas (4 bilah membentuk persegi berongga) — kayu
  faces.push(..._box(-E, E, FRAME_BOT, TOP, -E, -E + IN));       // bilah depan
  faces.push(..._box(-E, E, FRAME_BOT, TOP, E - IN, E));         // bilah belakang
  faces.push(..._box(-E, -E + IN, FRAME_BOT, TOP, -E + IN, E - IN)); // bilah kiri
  faces.push(..._box(E - IN, E, FRAME_BOT, TOP, -E + IN, E - IN));   // bilah kanan

  // 2) 4 KAKI balok di sudut PALING LUAR (flush) — kayu.
  //    Dari alas (YB) SAMPAI alas bingkai (FRAME_BOT) → menyatu.
  const legXZ = [
    [-E + LEGB / 2, -E + LEGB / 2], [E - LEGB / 2, -E + LEGB / 2],
    [-E + LEGB / 2, E - LEGB / 2],  [E - LEGB / 2, E - LEGB / 2],
  ];
  legXZ.forEach(([cx, cz]) => {
    faces.push(..._box(cx - LEGB / 2, cx + LEGB / 2, YB, FRAME_BOT, cz - LEGB / 2, cz + LEGB / 2));
  });

  // 3) Dudukan CEKUNG (inset) — hitam kasar (vertex color).
  faces.push(..._box(-E + IN, E - IN, FRAME_BOT, SEAT_TOP, -E + IN, E - IN));

  return faces;
}

/**
 * Buat geometri SEAT. Bounding box 1x1x1, pusat di origin (Y = atas).
 *
 * CATATAN MATERIAL: Seat punya 2 tekstur (kayu + hitam) TAPI tetap SATU material
 * (multi-material array DILARANG — terbukti `.material.map`/`.material.metalness`
 * dipakai langsung oleh tool paint/property/scale → array akan merusaknya).
 * Solusi: muka kayu = warna putih (tekstur asli), muka dudukan = warna gelap
 * (menggelapkan tekstur kayu jadi hitam) via VERTEX COLOR.
 */
export function makeSeatGeometry(THREE) {
  const faces = getSeatFaces();
  // autoFix:false — muka sudah ber-winding KELUAR yang benar dari `_box`
  // (kalau di-autofix centroid-global, sisi DALAM kaki terbalik → kaki tampak
  //  tipis/kopong seperti kertas).
  const geo = _buildFaces(THREE, faces, { autoFix: false });
  // Vertex color: hitam untuk muka dudukan, putih untuk sisanya.
  const pos = geo.getAttribute('position');
  const col = [];
  // Dudukan = 6 muka terakhir (12 segitiga) → hitam.
  const nTri = pos.count / 3;
  const seatTriStart = nTri - 12;
  for (let t = 0; t < nTri; t++) {
    const dark = t >= seatTriStart;
    const c = dark ? 0.13 : 1.0;   // 0.13 = gelap (abu-hitam), 1.0 = tekstur apa adanya
    for (let k = 0; k < 3; k++) col.push(c, c, c);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}

/**
 * Daftar MUKA Step (sumber tunggal: geometry + ikon).
 *
 * Bentuk (dari 4 foto + zoom, Wooden Block = pembanding):
 *   • 1 undakan datar (plat atas) permukaan rata satu bidang — BUKAN tangga
 *   • penopang vertikal di ujung KIRI & KANAN (profil "U" terbalik)
 *   • kolong tengah BERONGGA (tembus)
 *   • semua kotak tajam (tanpa bagian membulat)
 * Ukuran: 2 × 0.5 × 1 block = 4 × 1 × 2 studs.
 */
export function getStepFaces() {
  const EX = 1.0;                // setengah PANJANG (2 block = 4 studs)
  const EZ = 0.5;                // setengah LEBAR (1 block = 2 studs)
  const YB = -0.25;              // alas
  const TOP = 0.25;              // puncak → tinggi 0.5 block (1 stud) ✓
  const TH = 0.16;               // tebal plat undakan
  const PLATE_BOT = TOP - TH;    // alas plat (penopang naik SAMPAI sini)
  const SUP = 0.30;              // lebar penopang (X) — balok kokoh
  const faces = [];

  // 1) Plat undakan (permukaan atas rata) — kayu
  faces.push(..._box(-EX, EX, PLATE_BOT, TOP, -EZ, EZ));

  // 2) Penopang vertikal ujung KIRI & KANAN (dari alas sampai alas plat)
  faces.push(..._box(-EX, -EX + SUP, YB, PLATE_BOT, -EZ, EZ));
  faces.push(..._box(EX - SUP, EX, YB, PLATE_BOT, -EZ, EZ));

  return faces;
}

/** Buat geometri STEP (2 × 0.5 × 1 block). */
export function makeStepGeometry(THREE) {
  // autoFix:false — muka sudah ber-winding KELUAR yang benar dari `_box`.
  return _buildFaces(THREE, getStepFaces(), { autoFix: false });
}

// ── NSI LEVEL 2 #3: MAST (tiang kapal / crow's nest) ──
// KONFIRMASI USER (2026-10-04): tinggi 36 studs (=18 block), geladak bundar
// diameter 10 studs (=5 block). TANPA facing. Batas 2x2x2 studs = Level 1 saja.
//
// JEBAKAN YANG DIHINDARI: item ini rakitan BANYAK bagian (silinder, geladak,
// 8 baluster, ring, dome, bendera). autoFix centroid-GLOBAL salah untuk
// rakitan (muka-dalam terbalik). Solusi: bangun TIAP BAGIAN terpisah dengan
// autoFix per-bagian (centroid tiap bagian ada DI DALAM bagian itu) → benar.
// Khusus baluster (kotak) pakai _box yang windingnya sudah TERBUKTI benar
// (autoFix:false), sama seperti Seat.

/** Cincin sisi silinder (seg quads) — winding diperbaiki autoFix per-bagian. */
function _cylSide(r, y0, y1, seg) {
  const fs = [];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    fs.push([
      [Math.cos(a0) * r, y0, Math.sin(a0) * r],
      [Math.cos(a1) * r, y0, Math.sin(a1) * r],
      [Math.cos(a1) * r, y1, Math.sin(a1) * r],
      [Math.cos(a0) * r, y1, Math.sin(a0) * r],
    ]);
  }
  return fs;
}

/** Tutup datar silinder (fan segitiga). */
function _capFan(r, y, seg) {
  const fs = [];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    fs.push([[0, y, 0], [Math.cos(a0) * r, y, Math.sin(a0) * r], [Math.cos(a1) * r, y, Math.sin(a1) * r]]);
  }
  return fs;
}

/** Cincin datar (annulus) — quads antara radius dalam & luar. */
function _ringFan(rIn, rOut, y, seg) {
  const fs = [];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    fs.push([
      [c0 * rIn, y, s0 * rIn], [c1 * rIn, y, s1 * rIn],
      [c1 * rOut, y, s1 * rOut], [c0 * rOut, y, s0 * rOut],
    ]);
  }
  return fs;
}

/** Kubah (dome) low-poly: cincin bawah → cincin tengah → puncak. */
function _domeFaces(r, yBase, seg) {
  // Bola SETENGAH yang lebih halus (3 ring) — koreksi Gemini: ujung tiang
  // referensi membulat mulus seperti kapsul, bukan mengerucut/terpancung.
  const fs = [];
  const RINGS = [[0.86, 0.51], [0.60, 0.80], [0.32, 0.95]];  // [radiusFrac, heightFrac]
  let prev = null;
  for (let ri = 0; ri <= RINGS.length; ri++) {
    const cur = ri === RINGS.length
      ? null
      : { r: r * RINGS[ri][0], y: yBase + r * RINGS[ri][1] };
    if (ri > 0) {
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
        if (cur) {
          fs.push([
            [Math.cos(a0) * prev.r, prev.y, Math.sin(a0) * prev.r],
            [Math.cos(a1) * prev.r, prev.y, Math.sin(a1) * prev.r],
            [Math.cos(a1) * cur.r, cur.y, Math.sin(a1) * cur.r],
            [Math.cos(a0) * cur.r, cur.y, Math.sin(a0) * cur.r],
          ]);
        } else {
          fs.push([
            [Math.cos(a0) * prev.r, prev.y, Math.sin(a0) * prev.r],
            [Math.cos(a1) * prev.r, prev.y, Math.sin(a1) * prev.r],
            [0, yBase + r, 0],
          ]);
        }
      }
    }
    prev = cur;
  }
  // ring bawah (dari tepi tiang ke ring pertama)
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    fs.push([
      [Math.cos(a0) * r, yBase, Math.sin(a0) * r],
      [Math.cos(a1) * r, yBase, Math.sin(a1) * r],
      [Math.cos(a1) * r * RINGS[0][0], yBase + r * RINGS[0][1], Math.sin(a1) * r * RINGS[0][0]],
      [Math.cos(a0) * r * RINGS[0][0], yBase + r * RINGS[0][1], Math.sin(a0) * r * RINGS[0][0]],
    ]);
  }
  return fs;
}

/** Prisma dari segitiga di bidang XY (dipadatkan tipis pada Z). */
function _triPrismXY(tri, z0, z1) {
  const A = tri.map(([x, y]) => [x, y, z1]);
  const B = tri.map(([x, y]) => [x, y, z0]);
  return [
    [A[0], A[1], A[2]],
    [B[0], B[1], B[2]],
    [B[0], B[1], A[1], A[0]],
    [B[1], B[2], A[2], A[1]],
    [B[2], B[0], A[0], A[2]],
  ];
}

/** Gabung beberapa BufferGeometry (position+uv+color) jadi satu. */
function _mergeGeos(THREE, geos) {
  const pos = [], uv = [], col = [];
  geos.forEach((g) => {
    const p = g.getAttribute('position');
    const u = g.getAttribute('uv');
    const c = g.getAttribute('color');
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      uv.push(u.getX(i), u.getY(i));
      col.push(c ? c.getX(i) : 1, c ? c.getY(i) : 1, c ? c.getZ(i) : 1);
    }
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  out.computeVertexNormals();
  return out;
}

/**
 * Bagian-bagian Mast. Setiap bagian dibangun terpisah lalu digabung.
 * Tinggi total 18 block (y −9..+9); geladak ⌀5 block (10 studs) di ~55% tinggi.
 * Tiang ⌀0.8 block (1.6 studs) — lebar/panjang maks 2x2 studs, tinggi 36 studs.
 */
export function getMastParts() {
  // ── UKURAN FINAL (2026-10-04) ──
  // KOREKSI USER: *"batang panjang silindernya harus ikutin maksimal lebar dan
  // panjang 2x2 studs tapi kalau tinggi tetep kayak gitu, lah kalau gitu yang
  // lain ukurannya ngikut dong jadi kecil?"* → BENAR. Skala foto dulu salah
  // (memakai geladak 10 studs sebagai acuan padahal geladak bagian objek yg sama).
  // UKUR ULANG dari 2 foto bersih: tiang 31/34 px, geladak 191/214 px
  //   → tiang 1.6 studs (= 0.8 block) & geladak 9.9 studs (≈10 ✓) saat
  //     skala 19.4 px/stud. TINGGI TETAP 36 studs (tidak di-scale).
  const POLE_R = 0.5;        // radius tiang → ⌀1.0 block = 2.0 studs (TEPAT batas maks user 2x2 studs)
  const DECK_R = 2.5;        // radius geladak → ⌀5 block = 10 studs (user)
  const YB = -9.0;           // alas
  const POLE_TOP = 8.5;      // ujung tiang (dome menutup sampai +9.0 tepat = 18 block)
  // Geladak: terukur 56-57% dari ALAS (bukan 43%) → y ≈ +1.2 block.
  // KOREKSI USER (2026-10-04): *"letak geladaknya disitu emang? kok saya merasa ada
  // janggal, bukannya gak ditengah banget dan harus setidaknya deket dikit ke
  // bendera"* → BENAR, dinaikkan dari 0.65 → 1.2.
  // KOREKSI USER (2026-10-04, lanjutan): *"geladaknya naiki keatas dikit, jadi
  // lebih dekat ke bendera"* → SELURUH rakitan geladak (lantai + tiang penyangga
  // + 2 cincin) NAIK +1.0 block serentak supaya tetap rapi & makin dekat bendera.
  const DECK_LIFT = 1.0;     // tambahan kenaikan geladak (block)
  const DECK_Y1 = 1.35 + DECK_LIFT;   // lantai atas geladak
  const DECK_Y0 = 1.05 + DECK_LIFT;   // lantai bawah (slab 0.3 block)
  const RAIL_Y1 = 2.25 + DECK_LIFT;   // puncak tiang penyangga (0.4 block)
  const RING_Y1 = 2.50 + DECK_LIFT;   // puncak ring gelap (0.25 block)
  const SEG = 12;
  // KOREKSI USER (2026-10-04): *"tiang tiang penyangga balok kayunya itu jorokin
  // keluar, ikutin mentok paling luar platform bundar tersebut, dan juga
  // cincinnya juga ikut membesar karena itu penyangganya ditaruh keluar — ingat
  // ada 2 cincin"* + *"itu kayak gak rapi gitu, arahnya balok-balok penyangga
  // ikutin si platform bundar ini jadi lebih rapi, itu saya liatnya kayak ada
  // menonjol dikit keluar"* → tiang DIPUTAR RADIAL mengikuti lingkaran, ditaruh
  // di TENGAH SISI DATAR poligon (facet) supaya tepi luarnya PAS dengan tepi
  // geladak (tidak ada sudut yang menonjol keluar).
  const FACET_R = DECK_R * Math.cos(Math.PI / SEG);  // 2.415 = jarak sisi datar poligon
  const BAL_B = 0.5;                 // lebar tiang penyangga (kotak)
  const BAL_R = FACET_R - BAL_B / 2; // 2.165 → tepi LUAR tiang PAS di tepi geladak
  // KOREKSI USER (2026-10-04): *"luas geladak jadi makin sempit, bisa gedein
  // atau luasin dikit?"* → BENAR, cincin saya kecilkan (2.415) sehingga ruang
  // dalam menyempit. Cincin dikembalikan FLUSH ke tepi geladak (2.5) supaya
  // luas lantai dalam kembali lega.
  const RING_ROUT = DECK_R;          // 2.50 → flush tepi geladak (lebar penuh)
  const RING_RIN = RING_ROUT - 0.5;  // 2.00 (tebal cincin 0.5 block)
  // Bendera: DIUKUR dari foto (Gemini + grid): pangkal x200→ujung x76 = 124 px,
  // tinggi y60..150 = 90 px, skala 19.1 px/stud → panjang 6.5 studs = 3.25 block,
  // tinggi 4.7 studs = 2.35 block. KOREKSI USER: *"benderanya jadi kecil banget"*
  // → diperbesar sesuai foto (ujung memang melewati tepi geladak, itu desainnya).
  const FLAG_Y0 = 6.15, FLAG_Y1 = 8.5, FLAG_LEN = 3.25, FLAG_T = 0.06;
  const parts = [];

  // 1) TIANG (silinder + tutup)
  {
    const fs = [..._cylSide(POLE_R, YB, POLE_TOP, SEG)];
    fs.push(..._capFan(POLE_R, POLE_TOP, SEG));
    fs.push(..._capFan(POLE_R, YB, SEG));
    parts.push({ faces: fs, tag: 'wood', autoFix: true });
  }
  // 2) DOME ujung tiang (menutup sampai tinggi penuh +9.0)
  parts.push({ faces: _domeFaces(POLE_R, POLE_TOP, SEG), tag: 'wood', autoFix: true });
  // 3) LANTAI geladak (slab silinder) — MENONJOL lebih lebar dari dinding
  //    (catatan Claude: "alasnya menonjol sedikit lebih lebar daripada
  //    dindingnya, membentuk semacam bibir di bagian bawah").
  {
    const fs = [..._cylSide(DECK_R, DECK_Y0, DECK_Y1, SEG)];
    fs.push(..._capFan(DECK_R, DECK_Y1, SEG));
    fs.push(..._capFan(DECK_R, DECK_Y0, SEG));
    parts.push({ faces: fs, tag: 'wood', autoFix: true });
  }
  // 4) PAGAR = TIANG-TIANG PENYANGGA KOTAK (bolong, TANPA dinding penghubung)
  //    KOREKSI USER (2026-10-04): *"di geladak ada tiang kotak-kotak kecil
  //    penyangga dan ada banyak kan? harusnya hanya ada tiang penyangga kotak
  //    kotak, disitu langsung bolong, tapi kenapa sampai nambahin kayak dinding
  //    penghubung? itu tidak perlu! buang itu!"* → BENAR. Dinding silinder
  //    (dulu 4a/4b) DIBUANG. Sisakan tiang-tiang kotak berdiri sendiri dengan
  //    celah BOLONG tembus antar tiang. autoFix:false (kotak, winding benar).
  {
    const fs = [];
    const N = 12;                       // 12 tiang penyangga mengelilingi geladak
    // Tiang DIPUTAR RADIAL (mengikuti lingkaran) & ditaruh di TENGAH SISI DATAR
    // poligon → tepi luarnya PAS dengan tepi geladak, tidak ada yang menonjol.
    // Lebar tangensial = 2πR/N × 0.8 (celah lega seperti referensi).
    const arc = (2 * Math.PI * BAL_R) / N;
    const BAL_W = Math.min(BAL_B, arc * 0.8);   // lebar tangensial
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + Math.PI / N;   // tengah facet
      const cx = Math.cos(a) * BAL_R, cz = Math.sin(a) * BAL_R;
      // tiang penyangga penuh dari lantai sampai bibir atas (celah bolong)
      fs.push(..._boxRotY(cx, cz, BAL_B, BAL_W, DECK_Y1, RAIL_Y1, a));
    }
    parts.push({ faces: fs, tag: 'wood', autoFix: false });
  }
  // 5) RING GELAP di bibir atas pagar
  //    ⚠️ BUG TERUKUR (laporan user 2026-10-04: *"yang melingkar itu loh kayak
  //    tembus gitu"*): sama seperti dinding — silinder DALAM ring ter-flip oleh
  //    autoFix centroid → tembus pandang. FIX: pisah LUAR (autoFix true) vs
  //    DALAM (autoFix false = winding asli menghadap ke dalam, tepat).
  //
  // 5) CINCIN KAYU + CINCIN HITAM di bibir atas
  //    KOREKSI USER: *"tepat di bawah cincin hitam itu harusnya dilapisi kayu
  //    melingkar jadi cincin kayu, sebelum nyentuh penyangga-penyangga balok"*
  //    → tambah CINCIN KAYU melingkar di bawah cincin hitam.
  {
    // 5a) CINCIN KAYU (tepat di bawah cincin hitam)
    const wrIn = RING_RIN - 0.02, wrOut = RING_ROUT;
    parts.push({
      faces: [
        ..._cylSide(wrOut, RAIL_Y1 - 0.22, RAIL_Y1, SEG),   // sisi luar
        ..._ringFan(wrIn, wrOut, RAIL_Y1, SEG),             // atas
      ],
      tag: 'wood', autoFix: true,
    });
    parts.push({
      faces: _cylSide(wrIn, RAIL_Y1 - 0.22, RAIL_Y1, SEG),  // sisi dalam (anti-tembus)
      tag: 'wood', autoFix: false,
    });
    // 5b) CINCIN HITAM (pita gelap) di atas cincin kayu
    parts.push({
      faces: [
        ..._cylSide(RING_ROUT, RAIL_Y1, RING_Y1, SEG),
        ..._ringFan(RING_RIN, RING_ROUT, RING_Y1, SEG),
        ..._ringFan(RING_RIN, RING_ROUT, RAIL_Y1, SEG),
      ],
      tag: 'dark', autoFix: true,
    });
    parts.push({
      faces: _cylSide(RING_RIN, RAIL_Y1, RING_Y1, SEG),
      tag: 'dark', autoFix: false,
    });
  }
  // 6) BENDERA segitiga MERAH
  parts.push({
    faces: _triPrismXY(
      [[0, FLAG_Y0], [0, FLAG_Y1], [-FLAG_LEN, (FLAG_Y0 + FLAG_Y1) / 2]],
      -FLAG_T, FLAG_T,
    ),
    tag: 'red', autoFix: true,
  });

  return parts;
}

/** Buat geometri MAST (5 x 18 x 5 block = 10 x 36 x 10 studs). */
export function makeMastGeometry(THREE) {
  const geos = getMastParts().map((p) => {
    const g = _buildFaces(THREE, p.faces, { autoFix: p.autoFix !== false });
    const n = g.getAttribute('position').count;
    const c = p.tag === 'dark' ? [0.10, 0.13, 0.10]
      : (p.tag === 'red' ? [0.87, 0.07, 0.08] : [1, 1, 1]);
    const col = [];
    for (let i = 0; i < n; i++) col.push(c[0], c[1], c[2]);
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  });
  return _mergeGeos(THREE, geos);
}

/** Kotak di bidang XY yang DIPUTAR mengelilingi sumbu Z (untuk roda kemudi). */
function _boxRotZ(cx, cy, lenX, lenY, z0, z1, ang) {
  const base = _box(-lenX / 2, lenX / 2, -lenY / 2, lenY / 2, z0, z1);
  const c = Math.cos(ang), s = Math.sin(ang);
  return base.map((f) => f.map((p) => [
    cx + p[0] * c - p[1] * s,
    cy + p[0] * s + p[1] * c,
    p[2],
  ]));
}

/** Prisma bersegi (silinder) sejajar sumbu Z, pusat (0, cy), jari-jari r. */
function _prismZ(r, cy, z0, z1, seg) {
  const faces = [];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    const x0 = Math.cos(a0) * r, y0 = cy + Math.sin(a0) * r;
    const x1 = Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
    // sisi (normal keluar)
    faces.push([
      [x0, y0, z0], [x1, y1, z0], [x1, y1, z1],
      [x0, y0, z0], [x1, y1, z1], [x0, y0, z1],
    ]);
    // tutup depan (z1, +Z) & belakang (z0, −Z)
    faces.push([[0, cy, z1], [x0, y0, z1], [x1, y1, z1]]);
    faces.push([[0, cy, z0], [x1, y1, z0], [x0, y0, z0]]);
  }
  return faces;
}

/**
 * ── NSI LEVEL 2 #4: HELM (roda kemudi kapal) ──
 * PERMINTAAN USER (2026-10-05): tinggi 5 studs, panjang 2 studs, lebar 2 studs.
 * CATATAN USER (verbatim): *"iya itu memang kemudi, tapi identitasnya adalah
 * 'Helm' terdengar aneh tapi aturannya emang gitu, jadi patuhi aturan saya"* →
 * identitas tetap "Helm" walau bentuknya roda kemudi (patuhi aturan user).
 *
 * Ukuran: 1 × 2.5 × 1 block = 2 × 5 × 2 studs (alas di y = −1.25).
 * CATATAN PENTING: karena lebar hanya 1 block, roda kemudi (dengan pegangan)
 * WAJIB muat dalam ±0.5 block → jari-jari luar 0.5 block (bukan 0.705 yang
 * membuat lebar 1.85 block = MELANGGAR spesifikasi user).
 *
 * 6 bagian (semua kotak/prisma ber-winding benar → autoFix aman):
 *   1. alas persegi 1×1 block          2. tiang penyangga vertikal
 *   3. pelek roda (16 kotak berotasi)  4. 8 jeruji (kotak berotasi)
 *   5. hub tengah (prisma, GELAP)      6. 8 pegangan di ujung jeruji
 */
export function getHelmParts() {
  const YB = -1.25;                 // alas bawah → tinggi total 2.5 block
  const BASE_W = 1.0;               // alas 1 block (lebar & panjang)
  const BASE_H = 0.17;
  const BASE_TOP = YB + BASE_H;     // −1.08
  const R_OUT = 0.5;                // jari-jari TERLUAR (pegangan) = 0.5 block
  const WHEEL_CY = 1.25 - R_OUT;    // 0.75 → puncak objek tepat +1.25
  const GRIP_L = 0.06;              // KECIL (koreksi user: "bikin grip kecil aja")
  const RIM_RO = R_OUT - GRIP_L;    // 0.44 jari-jari luar pelek
  const RIM_T = 0.11;               // tebal pelek
  const RIM_RI = RIM_RO - RIM_T;    // 0.33 jari-jari dalam pelek
  const RIM_D = 0.14;               // kedalaman pelek (arah Z)
  const SPOKE_T = 0.07;
  const HUB_R = 0.12;
  const HUB_D = 0.18;
  const GRIP_R = 0.03;              // KECIL (koreksi user)
  const SEG = 16;
  const NS = 8;                     // 8 jeruji (terukur dari foto)

  const parts = [];
  const zA = -RIM_D / 2, zB = RIM_D / 2;

  // 1) ALAS persegi
  parts.push({ faces: _box(-BASE_W / 2, BASE_W / 2, YB, BASE_TOP, -BASE_W / 2, BASE_W / 2), tag: 'wood' });

  // 2) TIANG penyangga
  {
    const tw = 0.16;
    parts.push({ faces: _box(-tw / 2, tw / 2, BASE_TOP, WHEEL_CY, -tw / 2, tw / 2), tag: 'wood' });
  }

  // 3) PELEK roda — 16 kotak kecil berotasi mengelilingi lingkaran (bidang XY)
  {
    const rc = (RIM_RO + RIM_RI) / 2;
    const tanW = 2 * rc * Math.sin(Math.PI / SEG) * 1.06;   // sedikit tumpang tindih
    const fs = [];
    for (let i = 0; i < SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      fs.push(..._boxRotZ(Math.cos(a) * rc, WHEEL_CY + Math.sin(a) * rc, RIM_T, tanW, zA, zB, a));
    }
    parts.push({ faces: fs, tag: 'wood' });
  }

  // 4) 8 JERUJI (dari hub ke pelek, berotasi radial)
  {
    const r0 = HUB_R * 0.8, r1 = RIM_RI + 0.02;
    const len = r1 - r0, rc = (r0 + r1) / 2;
    const fs = [];
    for (let i = 0; i < NS; i++) {
      const a = (i / NS) * Math.PI * 2;
      fs.push(..._boxRotZ(Math.cos(a) * rc, WHEEL_CY + Math.sin(a) * rc, len, SPOKE_T, zA, zB, a));
    }
    parts.push({ faces: fs, tag: 'wood' });
  }

  // 5) HUB tengah (prisma sejajar Z) — GELAP
  parts.push({ faces: _prismZ(HUB_R, WHEEL_CY, -HUB_D / 2, HUB_D / 2, 8), tag: 'dark' });

  // 6) 8 PEGANGAN menonjol keluar pelek
  {
    const rc = RIM_RO + GRIP_L / 2;
    const fs = [];
    for (let i = 0; i < NS; i++) {
      const a = (i / NS) * Math.PI * 2;
      fs.push(..._boxRotZ(Math.cos(a) * rc, WHEEL_CY + Math.sin(a) * rc, GRIP_L, GRIP_R * 2, zA, zB, a));
    }
    parts.push({ faces: fs, tag: 'wood' });
  }

  return parts;
}

/** Buat geometri HELM (1 x 2.5 x 1 block = 2 x 5 x 2 studs). */
export function makeHelmGeometry(THREE) {
  const geos = getHelmParts().map((p) => {
    const g = _buildFaces(THREE, p.faces, { autoFix: true });
    const n = g.getAttribute('position').count;
    const c = p.tag === 'dark' ? [0.12, 0.14, 0.12] : [1, 1, 1];
    const col = [];
    for (let i = 0; i < n; i++) col.push(c[0], c[1], c[2]);
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  });
  return _mergeGeos(THREE, geos);
}

/**
 * Geometri NSI berdasarkan slug. Return null kalau bukan NSI.
 */
export function makeNsiGeometry(THREE, slug) {
  if (slug === NSI_WEDGE_SLUG) return makeWedgeGeometry(THREE);
  if (slug === NSI_RAMP_SLUG) return makeRampGeometry(THREE);
  if (slug === NSI_TRUSS_SLUG) return makeTrussGeometry(THREE);
  if (slug === NSI_SEAT_SLUG) return makeSeatGeometry(THREE);
  if (slug === NSI_STEP_SLUG) return makeStepGeometry(THREE);
  if (slug === NSI_MAST_SLUG) return makeMastGeometry(THREE);
  if (slug === NSI_HELM_SLUG) return makeHelmGeometry(THREE);
  if (NSI_ROD_SLUGS.indexOf(slug) >= 0) return makeRodGeometry(THREE);
  return null;
}

// ══════════════════════════════════════════════════════════════════════════
// ── ARAH HADAP (FACING) — NSI yang punya orientasi (mis. Seat) ──
// PERMINTAAN USER (2026-10-04): *"ketika dalam mode ghost block ada muncul
// panah hijau dan jika user klik R atau T atau Y maka itu ikut berubah yang
// mana itu menandakan kursinya arah kemana dan itu wajib dan dicatat facing ke
// arah mana, oh ya disini harus jelas ya, mana utara selatan barat timur... dan
// panah hijau itu akan hilang jika block ditaruh, hanya tersedia di ghostblock
// saja"*.
// ══════════════════════════════════════════════════════════════════════════
export const NSI_FACING_SLUGS = [NSI_SEAT_SLUG];
export function hasFacing(slug) {
  return NSI_FACING_SLUGS.indexOf(slug) >= 0;
}
// Slug acuan geometri panah (tinggi item acuan = tinggi geometri panah).
export const NSI_FACING_DEFAULT_SLUG = NSI_SEAT_SLUG;

// Arah mata angin. Konvensi: NORTH = −Z, EAST = +X, SOUTH = +Z, WEST = −X
// (sudut pandang awal kamera = menghadap dari timur laut ke origin).
export const FACING_NORTH = 'North';
export function directionFromVector(dx, dz) {
  if (Math.abs(dx) >= Math.abs(dz)) return dx >= 0 ? 'East' : 'West';
  return dz <= 0 ? 'North' : 'South';
}

/** Prisma segitiga (tri = 3 titik XZ) dari y0 ke y1. */
function _triPrism(tri, y0, y1) {
  const t = tri.map(([x, z]) => [x, y1, z]);
  const b = tri.map(([x, z]) => [x, y0, z]);
  return [
    [t[0], t[1], t[2]],              // atas
    [b[0], b[1], b[2]],              // bawah
    [b[0], b[1], t[1], t[0]],        // sisi 1
    [b[1], b[2], t[2], t[1]],        // sisi 2
    [b[2], b[0], t[0], t[2]],        // sisi 3
  ];
}

/**
 * PANAH HIJAU penunjuk arah hadap — HANYA untuk ghost (hilang saat ditaruh).
 * Panah mendatar, menunjuk −Z (= NORTH) saat rotasi 0.
 *
 * KOREKSI USER (2026-10-04): *"itu panah ijonya kenapa ngambang gitu sih?
 * nempel dong ke dudukan seatnya"* → panah WAJIB duduk TEPAT di permukaan
 * dudukan item (bukan melayang di atasnya).
 * `topY` = setengah tinggi item (mis. Seat = 0.5 block → 0.25).
 * Panah diletakkan sedikit DI BAWAH permukaan itu (tipis 0.026 block) supaya
 * benar-benar menempel/menapak di dudukan.
 */
export const NSI_FACING_ARROW_COLOR = 0x22e04a;
export function makeFacingArrowGeometry(THREE, topY) {
  const TOP = (typeof topY === 'number' && topY > 0) ? topY : 0.25;
  const Y1 = TOP - 0.004;          // permukaan atas panah ≈ permukaan dudukan
  const Y0 = TOP - 0.030;          // tebal panah 0.026 block (tipis, menempel)
  const faces = [
    // batang (shaft) memanjang Z
    ..._box(-0.05, 0.05, Y0, Y1, -0.04, 0.30),
    // kepala (head) segitiga menunjuk −Z
    ..._triPrism([[0, -0.36], [-0.16, -0.02], [0.16, -0.02]], Y0, Y1),
  ];
  // autoFix:false — muka sudah ber-winding benar dari `_box`/`_triPrism`
  // (lihat catatan jebakan di _buildFaces).
  return _buildFaces(THREE, faces, { autoFix: false });
}
