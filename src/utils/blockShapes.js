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
/**
 * PERBAIKI ARAH MUKA secara OTOMATIS & TERUKUR — per KOMPONEN (benda padat).
 *
 * ⚠️ AKAR BUG "melihat ke dalam / tekstur hilang saat kamera diputar":
 *   autoFix lama memakai centroid GLOBAL. Untuk objek yang terdiri dari BANYAK
 *   benda terpisah (roda 24 kotak + jeruji + gagang + tiang), centroid global
 *   ada di TENGAH objek → muka yang menghadap keluar justru dianggap "dalam",
 *   dan muka yang menghadap ke dalam dianggap benar. Hasilnya: sebagian benda
 *   tampak tembus/bolong dari luar ("melihat ke dalam").
 *
 * CARA UKUR (bukan tebak): untuk benda padat tertutup, VOLUME BERARAH
 *   V = Σ dot(a, cross(b, c)) / 6   (a,b,c = titik triangle)
 *   V > 0 → muka menghadap KELUAR (benar)
 *   V < 0 → muka menghadap KE DALAM  → BALIK urutan titiknya
 * Setiap komponen terhubung (benda terpisah) diukur sendiri-sendiri.
 */
function _fixWindingByVolume(geo) {
  const pos = geo.getAttribute('position');
  const n = pos.count;
  const T = [];                       // daftar triangle: [i0,i1,i2]
  for (let i = 0; i < n; i += 3) T.push([i, i + 1, i + 2]);
  const P = (i) => [pos.getX(i), pos.getY(i), pos.getZ(i)];

  // ── kelompokkan triangle jadi komponen (berbagi titik = terhubung) ──
  const key = (i) => `${pos.getX(i).toFixed(5)},${pos.getY(i).toFixed(5)},${pos.getZ(i).toFixed(5)}`;
  const vkey = new Map();             // titik → daftar index triangle
  T.forEach((t, ti) => t.forEach((vi) => {
    const k = key(vi);
    if (!vkey.has(k)) vkey.set(k, []);
    vkey.get(k).push(ti);
  }));
  const seen = new Array(T.length).fill(false);
  const komponen = [];
  for (let i = 0; i < T.length; i++) {
    if (seen[i]) continue;
    const stack = [i], comp = [];
    seen[i] = true;
    while (stack.length) {
      const ti = stack.pop();
      comp.push(ti);
      T[ti].forEach((vi) => {
        (vkey.get(key(vi)) || []).forEach((tj) => {
          if (!seen[tj]) { seen[tj] = true; stack.push(tj); }
        });
      });
    }
    komponen.push(comp);
  }

  // ── ukur arah tiap komponen; balik kalau menghadap KE DALAM ──
  //
  // ⚠️ BUG KEBALIK-BALIK (terukur 2026-10-09): uji VOLUME tidak valid untuk
  // PERMUKAAN TERBUKA (selubung silinder/pita tanpa tutup). Terbukti ada
  // komponen dgn V_relatif-origin = +0.00024 tapi V_relatif-centroid = -0.00007
  // → tandanya berubah-ubah → muka bisa terbalik → "melihat ke dalam".
  //
  // UJI YANG VALID untuk SEMUA bentuk: VOTING arah normal.
  //   Untuk tiap triangle, hitung dot(normal, titik_tengah − centroid_komponen).
  //   Bentuk tertutup MAUPUN terbuka: mayoritas normal harus menghadap KELUAR.
  //   vote > 0 → benar; vote < 0 → BALIK. Kalau vote == 0 (seri, mis. bidang
  //   datar), baru pakai volume relatif centroid sebagai penentu.
  let dibalik = 0, jmlKomponen = komponen.length;
  const arr = pos.array;
  komponen.forEach((comp) => {
    // centroid komponen (rata-rata titik)
    let cx = 0, cy = 0, cz = 0, cnt = 0;
    comp.forEach((ti) => T[ti].forEach((vi) => {
      cx += pos.getX(vi); cy += pos.getY(vi); cz += pos.getZ(vi); cnt++;
    }));
    cx /= cnt; cy /= cnt; cz /= cnt;

    let vote = 0;
    comp.forEach((ti) => {
      const a = P(T[ti][0]), b = P(T[ti][1]), c = P(T[ti][2]);
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const mx = (a[0] + b[0] + c[0]) / 3 - cx;
      const my = (a[1] + b[1] + c[1]) / 3 - cy;
      const mz = (a[2] + b[2] + c[2]) / 3 - cz;
      const d = nx * mx + ny * my + nz * mz;
      if (d > 0) vote++; else if (d < 0) vote--;
    });

    let perluBalik = vote < 0;
    if (vote === 0) {
      // seri (mis. komponen bidang datar) → pakai volume relatif centroid
      let V = 0;
      comp.forEach((ti) => {
        const a = P(T[ti][0]), b = P(T[ti][1]), c = P(T[ti][2]);
        const ax = a[0] - cx, ay = a[1] - cy, az = a[2] - cz;
        const bx = b[0] - cx, by = b[1] - cy, bz = b[2] - cz;
        const dx = c[0] - cx, dy = c[1] - cy, dz = c[2] - cz;
        V += (ax * (by * dz - bz * dy) - ay * (bx * dz - bz * dx) + az * (bx * dy - by * dx)) / 6;
      });
      perluBalik = V < 0;
    }

    if (perluBalik) {
      // balik urutan titik pada SETIAP triangle komponen ini (posisi + UV)
      const uv = geo.getAttribute('uv');
      const ua = uv ? uv.array : null;
      comp.forEach((ti) => {
        const [, i1, i2] = T[ti];
        const swapA = (arr2, stride, i, j) => {
          for (let k = 0; k < stride; k++) {
            const t = arr2[i * stride + k]; arr2[i * stride + k] = arr2[j * stride + k]; arr2[j * stride + k] = t;
          }
        };
        swapA(arr, 3, i1, i2);
        if (ua) swapA(ua, 2, i1, i2);
      });
      dibalik++;
    }
  });
  // UV juga harus ikut (kalau ada) — karena urutan vertex berubah
  return { jmlKomponen, dibalik };
}

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

/** Cincin sisi silinder (seg quads) — normal mengarah KELUAR.
 * ⚠️ BUG TERUKUR (2026-10-09): urutan titik lama (bawah-a0 → bawah-a1 →
 * atas-a1 → atas-a0) menghasilkan normal RADIAL KE DALAM → seluruh silinder
 * (tiang, kaki, kerah) TEMBUS PANDANG dari luar & "hilang" saat kamera
 * diputar (bukti: DoubleSide menambah 3.914 px di azimut 135°).
 * Urutan BENAR: bawah-a0 → atas-a0 → atas-a1 → bawah-a1 (normal KELUAR). */
function _cylSide(r, y0, y1, seg) {
  const fs = [];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    fs.push([
      [Math.cos(a0) * r, y0, Math.sin(a0) * r],
      [Math.cos(a0) * r, y1, Math.sin(a0) * r],
      [Math.cos(a1) * r, y1, Math.sin(a1) * r],
      [Math.cos(a1) * r, y0, Math.sin(a1) * r],
    ]);
  }
  return fs;
}

/** Batang SILINDER antara 2 titik bebas (untuk jeruji/gagang bulat).
 * Sumbu batang = arah p→q; penampang bulat seg-segi. */
function _cylBetween(p, q, r, seg, dome = false, capP = true, capQ = true) {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

  const dir = norm(sub(q, p));
  const ref = Math.abs(dir[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = norm(cross(dir, ref));
  const v = norm(cross(dir, u));
  const fs = [];
  const ring = (pt) => {
    const out = [];
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      out.push(add(pt, add(mul(u, Math.cos(a) * r), mul(v, Math.sin(a) * r))));
    }
    return out;
  };
  const A = ring(p), B = ring(q);
  for (let i = 0; i < seg; i++) {
    const j = (i + 1) % seg;
    fs.push([A[i], B[i], B[j], A[j]]);   // sisi (normal keluar)
  }
  // ⚠️ TUTUP KEDUA UJUNG (fan) — WAJIB, kalau tidak ujung batang TERBUKA →
  //    user "melihat ke DALAM pipa" (bug terukur 2026-10-09: area hilang di
  //    ujung jeruji & pangkal gagang). Winding dibalik supaya normal KELUAR.
  //
  // ⚠️ CELAH TERUKUR (2026-10-09, uji tepi-terbuka = 191): dulu ujung bulat
  //    dibuat dengan _domeFaces lalu DIPUTAR ke arah radial. Masalahnya basis
  //    sudut _domeFaces ((x+cos a, z+sin a)) BERBEDA dari basis ring di sini
  //    ((x−sin a, z−cos a)) → titik tidak berbagi vertex → CELAH nyata.
  //    FIX: kalau `dome`, ujung q ditutup KUBAH yang dibangun dari RING B yang
  //    SAMA (vertex dijamin berbagi) → menyatu sempurna (watertight).
  const RINGS = [[0.86, 0.51], [0.60, 0.80], [0.32, 0.95]];
  // ⚠️ JEBAKAN FAN (terukur 2026-10-09): fan tutup WAJIB (a) berpusat di titik
  //    POROS (p/q) — bukan di A[0] (itu titik ring, bukan pusat!) — dan (b)
  //    punya segitiga PENUTUP terakhir. Loop `i < seg-1` tanpa penutup → tepi
  //    terakhir tak berpasangan = CELAH tipis di tepi tutup.
  //    Winding: normal = u × v = dir, jadi tutup p (butuh −dir) = [p, A[j], A[i]].
  //
  // ⚠️ TUTUP DALAM TERUKUR (2026-10-09): kalau ujung p berada DI DALAM benda lain
  //    (jeruji masuk hub, kaki masuk alas), tutup ujung p menghadap KE DALAM dan
  //    tampak sebagai "lubang" pada uji front-vs-double-side. Opsi `capP=false`
  //    → ujung p TIDAK ditutup (tertutup oleh benda yang menelannya).
  if (dome) {
    if (capP) for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg;
      fs.push([p, A[j], A[i]]);            // tutup ujung p (datar, normal −dir)
    }
    let prev = B;
    RINGS.forEach(([rf, hf]) => {
      const pt = add(q, mul(dir, r * hf));
      const curScaled = ring(pt).map((P) => add(pt, mul(sub(P, pt), rf)));
      for (let i = 0; i < seg; i++) {
        const j = (i + 1) % seg;
        fs.push([prev[i], curScaled[i], curScaled[j], prev[j]]);
      }
      prev = curScaled;
    });
    const apex = add(q, mul(dir, r));      // puncak kubah (jarak r dari q)
    for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg;
      fs.push([prev[i], apex, prev[j]]);   // winding mengikuti pola quad sisi
    }
  } else {
    for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg;
      if (capP) fs.push([p, A[j], A[i]]);   // tutup ujung p (−dir)
      if (capQ) fs.push([q, B[i], B[j]]);   // tutup ujung q (+dir)
    }
  }
  return fs;
}

/** Selubung silinder TANPA TUTUP (untuk PITA yang melingkari batang).
 * ⚠️ JEBAKAN TERUKUR (2026-10-09): pita gelap semula memakai _cylBetween
 * (bertutup) → tutup dalamnya menghadap KE DALAM batang & tampak sebagai
 * "lubang" saat diuji front-vs-double-side. Pita TIDAK butuh tutup karena
 * ujungnya tertutup batang yang dilewatinya. */
function _cylShell(p, q, r, seg) {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dir = norm(sub(q, p));
  const ref = Math.abs(dir[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = norm(cross(dir, ref));
  const v = norm(cross(dir, u));
  const ring = (pt) => {
    const out = [];
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      out.push(add(pt, add(mul(u, Math.cos(a) * r), mul(v, Math.sin(a) * r))));
    }
    return out;
  };
  const A = ring(p), B = ring(q), fs = [];
  for (let i = 0; i < seg; i++) {
    const j = (i + 1) % seg;
    fs.push([A[i], B[i], B[j], A[j]]);
  }
  return fs;
}
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

/** Cincin (annulus) di bidang XY sejajar Z — dari rIn ke rOut pada z0..z1. */
function _ringZ(rIn, rOut, cy, z0, z1, seg) {
  const faces = [];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    const A = [Math.cos(a0) * rIn, cy + Math.sin(a0) * rIn, z0];
    const B = [Math.cos(a1) * rIn, cy + Math.sin(a1) * rIn, z0];
    const C = [Math.cos(a1) * rOut, cy + Math.sin(a1) * rOut, z0];
    const D = [Math.cos(a0) * rOut, cy + Math.sin(a0) * rOut, z0];
    const A2 = [A[0], A[1], z1], B2 = [B[0], B[1], z1];
    const C2 = [C[0], C[1], z1], D2 = [D[0], D[1], z1];
    faces.push([A, B, C, D]);        // muka z0
    faces.push([D2, C2, B2, A2]);    // muka z1
    faces.push([A2, B2, B, A]);      // dinding dalam
    faces.push([C, D, D2, C2]);      // dinding luar
  }
  return faces;
}

/** Prisma bersegi (silinder) sejajar sumbu Z, pusat (0, cy), jari-jari r. */
function _prismZ(r, cy, z0, z1, seg) {
  const faces = [];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    const x0 = Math.cos(a0) * r, y0 = cy + Math.sin(a0) * r;
    const x1 = Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
    // ⚠️ BUG CELAH TERUKUR (2026-10-09, uji tepi-terbuka = 90 di hub):
    //    dulu sisi ditulis sebagai SATU polygon 6 TITIK. Builder hanya
    //    menangani 3/4 titik → triangulasi rusak → celah. Pisah jadi 2 segitiga.
    faces.push([[x0, y0, z0], [x1, y1, z0], [x1, y1, z1]]);   // sisi (normal keluar)
    faces.push([[x0, y0, z0], [x1, y1, z1], [x0, y0, z1]]);
    // tutup depan (z1, +Z) & belakang (z0, −Z)
    faces.push([[0, cy, z1], [x0, y0, z1], [x1, y1, z1]]);
    faces.push([[0, cy, z0], [x1, y1, z0], [x0, y0, z0]]);
  }
  return faces;
}

/**
 * ── NSI LEVEL 2 #4: HELM (roda kemudi kapal / ship's wheel) ──
 * PERMINTAAN USER (2026-10-05): tinggi 5 studs, panjang 2 studs, lebar 2 studs.
 * Ukuran: 1 × 2.5 × 1 block = 2 × 5 × 2 studs (alas di y = −1.25).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * REVISI BESAR 2026-10-09 — berdasarkan kritik Claude (via SESI KONFIRMASI user).
 *
 * KESALAHAN SEBELUMNYA (terukur dari foto referensi, skor 2/10):
 *   Badan saya berbentuk TRAPESIUM/MENARA (lebar di bawah, menyempit ke atas)
 *   karena 4 SIRIP LEBAR + tiang gemuk mengisi ruang di bawah roda.
 *   Referensi: TIANG SILINDER RAMPING + 2-3 KAKI MIRING, banyak RUANG KOSONG.
 *
 * BUKTI PENGUKURAN foto referensi (lebar per tinggi, % lebar objek):
 *     0- 5%  tinggi :  7%   -> puncak batang (ujung jari-jari atas)
 *    10-55%  tinggi : 70-100% -> RODA (mendominasi, bulat, tipis)
 *    60-70%  tinggi : 16-23%  -> TIANG RAMPING (ruang kosong di kiri-kanan!)
 *    75-95%  tinggi : 54-67%  -> ALAS (papan tipis + lapisan hitam)
 *
 * 7 bagian (mengikuti rincian kritik):
 *   1. alas papan tipis + lapisan hitam kebiruan (dua lapis)
 *   2. tiang SILINDER ramping (bukan balok trapesium)
 *   3. kerah/cincin hitam di dasar tiang
 *   4. 2-3 kaki penyangga MIRING (batang bulat) + 1 batang pendek di depan
 *   5. roda: pelek cincin tipis + 8 jeruji + 8 gagang silinder ujung membulat
 *   6. pita hitam kebiruan di tiap jeruji (dekat ujung, kedua sisi pelek, tengah)
 *   7. hub cakram bulat datar + lubang/titik hitam di tengah
 *   + puncak: batang atas (ujung jari-jari jam-12) dengan pita hitam
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function getHelmParts() {
  const YB = -1.25;                 // alas bawah → tinggi total 2.5 block (spek user)
  const BASE_W = 1.0;               // alas 1 block (panjang & lebar 2 studs)
  // ⚠️ KOREKSI (2026-10-09, kritik Claude #6): papan kayu TIPIS di atas lapisan
  // HITAM KEBIRUAN yang LEBIH TEBAL (dulu kayu 0.15 + hitam 0.09 → terbalik).
  const BASE_H = 0.11;              // papan kayu tipis
  const BASE_DARK = 0.20;           // lapisan hitam kebiruan (LEBIH TEBAL)
  const BASE_TOP = YB + BASE_DARK + BASE_H;   // −0.94

  // roda
  const RIM_RO = 0.40;              // jari-jari LUAR pelek (tanpa gagang)
  const GRIP_L = 0.10;              // gagang menonjol
  const R_OUT = RIM_RO + GRIP_L;    // 0.50 = TEPAT 1 block (spek: lebar 2 studs)
  // ⚠️ KOREKSI (2026-10-09, kritik Claude #4): "jari-jari atas terlalu panjang
  // seperti tiang pedang". Roda dinaikkan supaya tonjolan batang atas hanya
  // 0.05 block = 2% tinggi (referensi: puncak 0-5%). Pusat roda 78% dari alas.
  const WHEEL_CY = 0.70;
  const RIM_T = 0.062;              // pelek tipis (kritik: "cincin tipis & halus")
  const RIM_RI = RIM_RO - RIM_T;    // 0.338
  const RIM_D = 0.13;               // kedalaman pelek
  // ⚠️ KOREKSI (2026-10-09, kritik Claude #3): jeruji RAMPING + celah LAPANG
  // (dulu 0.11 → celah jadi segitiga sempit). Pakai seg 12 → tidak bergerigi.
  const SPOKE_T = 0.085;
  const GRIP_T = 0.062;             // gagang bulat
  const HUB_R = 0.215;              // CAKRAM BESAR (kritik: "hub cakram bulat besar")
  const HUB_DOT_R = 0.048;          // lubang bulat hitam di tengah
  const POLE_R = 0.085;             // TIANG SILINDER RAMPING
  const SEG = 32;                   // pelek LEBIH HALUS (kritik: "masih bersegmen")
  const NS = 8;                     // 8 jeruji (terukur dari foto)
  const SEG_POLE = 14;              // segmen tiang silinder
  const SEG_BATANG = 12;            // segmen batang bulat (jeruji/gagang/kaki)

  const parts = [];
  const zA = -RIM_D / 2, zB = RIM_D / 2;

  // ── 1) ALAS: papan KAYU TIPIS di atas lapisan HITAM yang LEBIH TEBAL ────
  //      (kritik Claude #6: "alas atas papan tipis di atas lapisan hitam tebal")
  parts.push({ faces: _box(-BASE_W / 2, BASE_W / 2, YB + BASE_DARK, BASE_TOP, -BASE_W / 2, BASE_W / 2), tag: 'wood' });
  parts.push({ faces: _box(-BASE_W / 2, BASE_W / 2, YB, YB + BASE_DARK, -BASE_W / 2, BASE_W / 2), tag: 'dark' });

  // ── 2) TIANG SILINDER RAMPING (kritik: "silinder tegak ramping, sama dari
  //      atas ke bawah" — BUKAN balok trapesium) ──────────────────────────
  {
    const fs = [];
    // ⚠️ pakai _cylBetween (BERTUTUP) — _cylSide tanpa tutup → ujung tiang
    // berlubang & user "melihat ke dalam" (bug terukur 2026-10-09).
    // ⚠️ Z-FIGHTING TERUKUR (2026-10-09): tutup bawah tiang semula TEPAT di
    //    y = BASE_TOP → SEBIDANG dengan permukaan atas alas → berkedip /
    //    tampak sebagai "cincin lubang" saat diuji front-vs-double-side.
    //    Benamkan 0.02 block ke dalam alas.
    fs.push(..._cylBetween([0, BASE_TOP - 0.02, 0], [0, WHEEL_CY, 0], POLE_R, SEG_POLE));
    parts.push({ faces: fs, tag: 'wood' });
  }

  // ── 3) KERAH/CINCIN HITAM di dasar tiang (kritik: "cincin/kerah hitam di
  //      dasar tiang") ─────────────────────────────────────────────────────
  {
    const fs = [];
    // kerah = silinder BERTUTUP (kalau tidak, cincin atasnya berlubang).
    // ⚠️ Z-FIGHTING TERUKUR (2026-10-09): sama seperti tiang, tutup bawah kerah
    //    semula TEPAT di BASE_TOP → sebidang dgn alas. Benamkan 0.02.
    fs.push(..._cylBetween([0, BASE_TOP - 0.02, 0], [0, BASE_TOP + 0.11, 0], POLE_R * 1.75, SEG_POLE));
    parts.push({ faces: fs, tag: 'dark' });
  }

  // ── 4) 4 KAKI PENYANGGA MIRING (PERMINTAAN USER 2026-10-09) ─────────────
  //      Verbatim: "3 tiang yang kanan kiri panjang dia miring ke tiang utama
  //      di tengah... di depan ada tiang kecil 1, itu salah! tidak ada tiang
  //      kecil kayak gitu malahan dia gak miring lagi, hapus aja. tapi copy
  //      yang miring sisi kiri kanan jadi ada depan belakang dan pas deh 4.
  //      pastikan NEMPEL ke platform kotak dan NEMPEL ke tiang utama di tengah,
  //      jadi ga keliatan aneh tapi benar-benar MENYATU."
  //
  //      ⇒ HAPUS batang pendek tegak di depan.
  //      ⇒ 4 kaki MIRING di 0°/90°/180°/270° (kanan, belakang, kiri, depan).
  //      ⇒ Pangkal kaki DITANAM ke dalam alas (yBot di bawah BASE_TOP) supaya
  //        tidak terlihat melayang / ada celah.
  //      ⇒ Ujung atas kaki DITANAM ke dalam tiang utama: pusat tutupnya
  //        (rTop) dibuat cukup kecil + jari-jari kaki (SUP_R) dipilih supaya
  //        SELURUH tutup atas berada di dalam silinder tiang (jari-jari POLE_R)
  //        → tidak ada bidang tutup yang mencuat = sambungan mulus MENYATU.
  {
    const SUP_R = 0.052;              // jari-jari batang kaki (bulat)
    const rBot = 0.33;                // pangkal: 0.66 studs dari pusat (di alas)
    const yBot = BASE_TOP - 0.06;     // DITANAM ke dalam alas (bukan menempel di atas)
    const rTop = 0.028;               // ujung atas: di DALAM tiang utama
    const yTop = BASE_TOP + 0.70;
    [0, 90, 180, 270].forEach((deg) => {
      const a = deg * Math.PI / 180;
      const p = [Math.cos(a) * rBot, yBot, Math.sin(a) * rBot];
      const q = [Math.cos(a) * rTop, yTop, Math.sin(a) * rTop];
      // KEDUA ujung kaki TERTANAM (pangkal di alas, ujung atas di tiang)
      // → tidak perlu tutup sama sekali (tertutup oleh benda yang menelannya)
      parts.push({ faces: _cylBetween(p, q, SUP_R, SEG_BATANG, false, false, false), tag: 'wood' });
    });
  }

  // ── 5) RODA: pelek cincin TIPIS & mulus ─────────────────────────────────
  {
    const rc = (RIM_RO + RIM_RI) / 2;
    const tanW = 2 * rc * Math.sin(Math.PI / SEG) * 1.14;
    const fs = [];
    for (let i = 0; i < SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      fs.push(..._boxRotZ(Math.cos(a) * rc, WHEEL_CY + Math.sin(a) * rc, RIM_T, tanW, zA, zB, a));
    }
    parts.push({ faces: fs, tag: 'wood' });
  }

  // ── 6+7) JERUJI + GAGANG — SATU BATANG SILINDER BULAT menerus dari hub
  //      sampai ujung luar, dengan UJUNG MEMBULAT (kubah) + PITA HITAM di
  //      beberapa titik. (kritik Claude #1,#2,#3: "semua jari-jari silinder
  //      bulat ujung membulat + beberapa pita hitam kebiruan; jeruji ramping
  //      supaya celah lapang"). ─────────────────────────────────────────────
  {
    const fs = [], fd = [];
    // ⚠️ BUG CELAH TERUKUR (2026-10-09, uji tepi-terbuka = 252): kubah ujung
    // semula diletakkan di rUjung = R_OUT − rd·1.02, padahal BATANG berakhir di
    // rOut = R_OUT − GRIP_T·0.85 → kubah MELAYANG 0.0135 block di depan ujung
    // batang + jumlah segmen beda (10 vs 12) → tepi tidak berbagi vertex =
    // CELAH NYATA. FIX: jari-jari kubah = jari-jari batang, diletakkan TEPAT di
    // ujung batang, segmen SAMA → menyatu sempurna (watertight).
    const rBatang = SPOKE_T * 0.5;             // jari-jari batang (jeruji=gagang)
    for (let i = 0; i < NS; i++) {
      const a = (i / NS) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const rIn = HUB_R * 0.55;
      const rOut = R_OUT - rBatang;            // ujung batang (puncak kubah = R_OUT)
      // UJUNG MEMBULAT dibangun dari ring yang SAMA (dome=true) → watertight
      fs.push(..._cylBetween([ca * rIn, WHEEL_CY + sa * rIn, 0],
                             [ca * rOut, WHEEL_CY + sa * rOut, 0], rBatang, SEG_BATANG, true, false));
      // PITA HITAM di 4 titik: dekat ujung luar, kedua sisi pelek, dekat hub
      // ⚠️ pakai _cylShell (TANPA TUTUP): _cylBetween menutup KEDUA ujung →
      //    tutup DALAM menghadap ke dalam & menimbulkan tembus (terukur:
      //    1 komponen 48 tri dengan 24 normal keluar / 24 ke DALAM).
      [rOut - GRIP_T * 0.35, RIM_RO + 0.008, RIM_RI - 0.008, HUB_R * 0.95].forEach((rp) => {
        const r0 = rp - 0.016, r1 = rp + 0.016;
        fd.push(..._cylShell([ca * r0, WHEEL_CY + sa * r0, 0],
                             [ca * r1, WHEEL_CY + sa * r1, 0], SPOKE_T * 0.58, SEG_BATANG));
      });
    }
    // batang puncak (jam-12, i=2) — PENDEK seperti jari-jari lain + ujung kubah
    // (dasar kubah TEPAT di ujung batang, radius & segmen SAMA → watertight)
    const aA = (2 / NS) * Math.PI * 2, caA = Math.cos(aA), saA = Math.sin(aA);
    const yDome = 1.25 - rBatang;
    const rA = yDome - WHEEL_CY;
    fs.push(..._cylBetween([caA * (HUB_R * 0.55), WHEEL_CY + saA * (HUB_R * 0.55), 0],
                           [caA * rA, WHEEL_CY + saA * rA, 0], rBatang, SEG_BATANG, true, false));
    // 2 pita hitam di batang puncak (tanpa tutup — lihat catatan _cylShell)
    [rA - 0.10, RIM_RO + 0.02].forEach((rp) => {
      const r0 = rp - 0.016, r1 = rp + 0.016;
      fd.push(..._cylShell([caA * r0, WHEEL_CY + saA * r0, 0],
                           [caA * r1, WHEEL_CY + saA * r1, 0], SPOKE_T * 0.58, SEG_BATANG));
    });
    parts.push({ faces: fs, tag: 'wood' });
    parts.push({ faces: fd, tag: 'dark' });
  }

  // ── 9) HUB: cakram bulat DATAR + lubang hitam di tengah ─────────────────
  // ⚠️ Z-FIGHTING TERUKUR (2026-10-09): tutup bawah titik hitam semula di
  // zB+0.02 SAMA PERSIS dengan tutup atas hub → sebidang → piksel berkedip /
  // "hilang" di pusat hub (dilaporkan user & terdeteksi uji FrontSide vs
  // DoubleSide: 76 px di DALAM objek). Pisahkan sedikit.
  parts.push({ faces: _prismZ(HUB_R, WHEEL_CY, zA, zB + 0.02, 18), tag: 'wood' });
  parts.push({ faces: _prismZ(HUB_DOT_R, WHEEL_CY, zB + 0.015, zB + 0.045, 12), tag: 'dark' });

  return parts;
}

/** Buat geometri HELM (1 x 2.5 x 1 block = 2 x 5 x 2 studs). */
export function makeHelmGeometry(THREE) {
  const geos = getHelmParts().map((p) => {
    // ⚠️ autoFix: FALSE (centroid-GLOBAL salah untuk rakitan banyak benda),
    // TAPI winding tiap komponen diperbaiki OTOMATIS lewat VOLUME BERARAH
    // (_fixWindingByVolume) — ini yang menghilangkan bug "melihat ke dalam /
    // muka hilang saat kamera diputar". Terukur: sebelumnya DoubleSide
    // menambah 3.914 px di azimut 135°; sesudah perbaikan < 1%.
    const g = _buildFaces(THREE, p.faces, { autoFix: false });
    const stat = _fixWindingByVolume(g);
    if (typeof window !== 'undefined' && window.__debugWinding) {
      console.log('[helm] komponen:', stat.jmlKomponen, 'dibalik:', stat.dibalik);
    }
    const n = g.getAttribute('position').count;
    // ⚠️ KOREKSI (2026-10-09, kritik Claude #7): aksen = HITAM KEBIRUAN
    // (dulu cokelat tua [0.12,0.14,0.12]). Referensi: hitam kebiruan.
    const c = p.tag === 'dark' ? [0.09, 0.10, 0.15] : [1, 1, 1];
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
