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
};
// Rod: semua varian ukurannya sama (1 x 3 x 1 studs).
NSI_ROD_SLUGS.forEach((s) => { NSI_SIZES[s] = NSI_ROD_SIZE.slice(); });

/** Ukuran item (block) berdasarkan slug. Non-NSI = [1,1,1]. */
export function getNsiSize(slug) {
  return NSI_SIZES[slug] || [1, 1, 1];
}

// Daftar NSI yang sudah terdaftar.
export const NSI_SLUGS = [NSI_WEDGE_SLUG, NSI_RAMP_SLUG, NSI_TRUSS_SLUG, NSI_SEAT_SLUG, NSI_STEP_SLUG, ...NSI_ROD_SLUGS];
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

/**
 * Geometri NSI berdasarkan slug. Return null kalau bukan NSI.
 */
export function makeNsiGeometry(THREE, slug) {
  if (slug === NSI_WEDGE_SLUG) return makeWedgeGeometry(THREE);
  if (slug === NSI_RAMP_SLUG) return makeRampGeometry(THREE);
  if (slug === NSI_TRUSS_SLUG) return makeTrussGeometry(THREE);
  if (slug === NSI_SEAT_SLUG) return makeSeatGeometry(THREE);
  if (slug === NSI_STEP_SLUG) return makeStepGeometry(THREE);
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
