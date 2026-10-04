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
};

/** Ukuran item (block) berdasarkan slug. Non-NSI = [1,1,1]. */
export function getNsiSize(slug) {
  return NSI_SIZES[slug] || [1, 1, 1];
}

// Daftar NSI yang sudah terdaftar.
export const NSI_SLUGS = [NSI_WEDGE_SLUG, NSI_RAMP_SLUG, NSI_TRUSS_SLUG];
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
function _buildFaces(THREE, faces) {
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
    if (dot(n, out) < 0) { A = p; B = r; C = q; }
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
 * Geometri NSI berdasarkan slug. Return null kalau bukan NSI.
 */
export function makeNsiGeometry(THREE, slug) {
  if (slug === NSI_WEDGE_SLUG) return makeWedgeGeometry(THREE);
  if (slug === NSI_RAMP_SLUG) return makeRampGeometry(THREE);
  if (slug === NSI_TRUSS_SLUG) return makeTrussGeometry(THREE);
  return null;
}
