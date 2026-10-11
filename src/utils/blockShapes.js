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

// ── NSI LEVEL 2 #5: WINDOW (jendela kayu + kaca) — konstanta ──
// PERMINTAAN USER (2026-10-09, verbatim): *"identitasnya adalah 'Window'
// Window : panjang 4 studs, tinggi 4 studs, lebar 1 studs, dan panjang serta
// tinggi kaca di dalam window mengikuti bentuk dalemannya bingkai window
// tersebut, tapi ketebalan kacanya itu 0.2 studs"*.
// → Ukuran: 4 × 4 × 1 studs = 2 × 2 × 0.5 block.
// Dibaca dari 2 gambar referensi (folder image/folder kerja) via GEMINI
// (baca_gambar.py) + diukur numerik:
//   • bingkai kayu BALOK PERSEGI BERONGGA (4 batang: atas/bawah/kiri/kanan)
//   • 1 pane tunggal — TIDAK ada silang/pembagi/muntin di tengah
//   • kaca persegi mengikuti bukaan dalam, MENJOROK ke dalam (recessed)
//   • tepi siku 90° TAJAM (tanpa bevel/chamfer)
//   • TIDAK ada bagian yang menonjol keluar (sisi luar rata/flush)
//   • kayu cokelat-jingga hangat (serat papan), kaca bening kebiruan
// TANPA facing (user tidak meminta; konsisten dgn Helm/Mast).
export const NSI_WINDOW_SLUG = 'window';
export const NSI_WINDOW_NAME = 'Window';
export const NSI_WINDOW_SIZE = [2, 2, 0.5];   // 4 x 4 x 1 studs

// ── NSI LEVEL 2 #6: DOOR (pintu INTERAKTIF) — NSI PERTAMA yang bisa di-KLIK ──
// PERMINTAAN USER (2026-10-09, verbatim):
//   "identitasnya adalah 'Door' dan dia adalah NSI pertama yang bisa di click,
//    jika di klik kiri atau di sentuh di hp dia akan kebuka si 'Door' nya"
//   "Door : panjang kanan kiri 5.5 studs, lebar (ketebalan) pintu 0.5 studs,
//    tinggi 7 studs"
// → 5.5 x 7 x 0.5 studs = 2.75 x 3.5 x 0.25 block
// Klik BIASA (tool null = tanpa tool aktif / sentuh di HP) → pintu terbuka.
// Screenshot versi property = hanya untuk menunjukkan AREA/boundary bukaan.
export const NSI_DOOR_SLUG = 'door';
export const NSI_DOOR_NAME = 'Door';
export const NSI_DOOR_SIZE = [2.75, 3.5, 0.25];   // 5.5 x 7 x 0.5 studs

// ── NSI LEVEL 2 #7: HATCH (palka/trapdoor INTERAKTIF) ──────────────────
// PERMINTAAN USER (2026-10-09, verbatim): *"identitas nya adalah 'Hatch', dia
// bisa dibuka tutup hanya saja dia bukan pintu, gini deh tau trapdoor di
// minecraft? dan bukanya gimana itu? ya kayak gitu mirip kok ... Hatch :
// panjang 4 studs, lebar 4 studs, tinggi 1 studs"*
// → pelat HORIZONTAL 4x4 studs, tebal 1 studs, DIBUKA dengan mengangkat
//   (engsel di sisi belakang z−), persis seperti trapdoor Minecraft.
export const NSI_HATCH_SLUG = 'hatch';
export const NSI_HATCH_NAME = 'Hatch';
export const NSI_HATCH_SIZE = [2, 0.5, 2];   // 4 x 1 x 4 studs

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

// ── NSI LEVEL 2 #8: LEGENDARY CHEST (peti harta) — DEKORASI, TIDAK interaktif.
//    PERMINTAAN USER (2026-10-10, verbatim): *"identitasnya adalah \"Legendary
//    Chest\" meskipun begitu dia jika di klik tidak terjadi apa apa yang mana
//    tidak ada fitur apapun jika di klik hanya dekorasi"*.
//    Ukuran: panjang 4.5 studs, lebar 4.5 studs, tinggi 3.5 studs.
//    ⚠️ WAJIB dideklarasikan DI SINI (sebelum NSI_SIZES) — kalau di bawah,
//       `NSI_SIZES` membaca SEBELUM inisialisasi → TDZ ReferenceError (bab 98/126).
export const NSI_CHEST_SLUG = 'legendary_chest';
export const NSI_CHEST_NAME = 'Legendary Chest';
export const NSI_CHEST_SIZE = [2.25, 1.75, 2.25];   // 4.5 x 3.5 x 4.5 studs
export const CHEST_WOOD_COLOR = 0xb0752f;    // kayu cokelat (foto referensi)
export const CHEST_METAL_COLOR = 0xd21f8c;   // logam MAGENTA/fuchsia cerah
export const CHEST_DARK_COLOR = 0x0d0a14;    // lubang kunci & rivet (hitam kebiruan)

// ── NSI LEVEL 2 #8b–#8e: 5 CHEST (bab 147) ──────────────────────────────
// PERMINTAAN USER (2026-10-11, verbatim): *"total ada 5 ya... ungu = Legendary
// Chest, cyan = Epic Chest, merah = Rare Chest, kuning = Uncommon Chest,
// hijau = Common chest... urutan NSI chest warna warni itu adalah yang pertama
// ungu dulu, lalu cyan, merah, kuning, hijau"*.
//
// ⚠️ BENTUK 100% SAMA — pembeda HANYA WARNA RANGKA (terukur dari 4 gambar
//    user: bbox 324x241 px identik, tumpang-tindih 99%+, S & V sama;
//    HANYA HUE yang bergeser). Kayu/alur/baut/kunci = TETAP.
//    Warna rangka diambil dari HUE gambar user + S/V milik patokan ungu
//    (H=301.3° S=97.4% V=2.35) supaya satu keluarga warna yang konsisten.
export const CHEST_VARIANTS = {
  [NSI_CHEST_SLUG]: { name: 'Legendary Chest', frame: [2.350, 0.060, 2.300], hue: 301 },
  epic_chest:       { name: 'Epic Chest',      frame: [0.060, 1.930, 2.350], hue: 191 },
  rare_chest:       { name: 'Rare Chest',      frame: [2.350, 0.098, 0.060], hue: 1 },
  uncommon_chest:   { name: 'Uncommon Chest',  frame: [2.350, 2.274, 0.060], hue: 58 },
  common_chest:     { name: 'Common chest',    frame: [0.174, 2.350, 0.060], hue: 117 },
};
/** Urutan pengerjaan NSI chest (verbatim user): ungu → cyan → merah → kuning → hijau. */
export const NSI_CHEST_SLUGS = [NSI_CHEST_SLUG, 'epic_chest', 'rare_chest', 'uncommon_chest', 'common_chest'];
/** Warna rangka PATOKAN (dipakai untuk mengenali baris rangka di tabel bake). */
export const CHEST_FRAME_BAKE_COLOR = [2.35, 0.06, 2.30];

/**
 * UKURAN NSI dalam satuan BLOCK [lebar(x), tinggi(y), kedalaman(z)].
 * WAJIB dipakai saat menaruh block (posY = setengah tinggi) supaya item yang
 * lebih tinggi dari 1 block TIDAK amblas ke lantai.
 *   BUG TERUKUR (2026-10-04): posY di-hardcode 0.5 → Truss (tinggi 2 block)
 *   tenggelam separuh ke bawah lantai.
 */
// ══════════════════════════════════════════════════════════════════════════
// ── NSI LEVEL 2 #9: SMALL TREASURE (bab 149) ──
// PERMINTAAN USER (2026-10-11, verbatim): *"identitasnya adalah "Small Treasure"
// dimana dia bisa di klik ada animasi buka petinya sama kaya door itu ada
// animasi buka... panjang 4 studs (arah kanan kiri), lebar 3 studs, tinggi 2.5
// studs"*.
// Ukuran: 4 x 2.5 x 3 studs  →  2 x 1.25 x 1.5 block.
// Bentuk: rangka emas ½-lingkaran + badan drum hitam + pita krem bentuk tulang
// + bintang ungu (X) di depan. INTERAKTIF: klik → tutup terangkat (engsel
// belakang, sumbu X) ≈103°, seperti Door/Hatch.
// ⚠️ Dimensi TERUKUR 4.00 x 2.50 x 3.14 studs (kontrak: WAJIB diukur, bukan dikira).
export const NSI_ST_SLUG = 'small_treasure';
export const NSI_ST_NAME = 'Small Treasure';
export const NSI_ST_SIZE = [2, 1.25, 1.5];        // 4 x 2.5 x 3 studs
export const ST_HINGE_Y = 0.09;                   // engsel (lokal, relatif pusat)
export const ST_HINGE_Z = -0.60;                  // tepi BELAKANG
export const ST_OPEN_ANGLE = -2.06;               // ≈118° (bab 155: original 110-130°)

export const NSI_SIZES = {
  [NSI_WEDGE_SLUG]: [1, 1, 1],
  [NSI_RAMP_SLUG]: [1, 1, 1],
  [NSI_TRUSS_SLUG]: [1, 2, 1],
  [NSI_SEAT_SLUG]: [1, 0.5, 1],
  [NSI_STEP_SLUG]: [2, 0.5, 1],
  [NSI_MAST_SLUG]: [5, 18, 5],
  [NSI_HELM_SLUG]: [1, 2.5, 1],
  [NSI_WINDOW_SLUG]: [2, 2, 0.5],
  [NSI_DOOR_SLUG]: [2.75, 3.5, 0.25],
  [NSI_HATCH_SLUG]: [2, 0.5, 2],
  [NSI_CHEST_SLUG]: [2.25, 1.75, 2.25],
};
// 5 chest (ungu/cyan/merah/kuning/hijau) — ukuran IDENTIK (bentuk sama).
NSI_CHEST_SLUGS.forEach((s) => { NSI_SIZES[s] = [2.25, 1.75, 2.25]; });
// Small Treasure: 4 x 2.5 x 3 studs (bab 149).
NSI_SIZES[NSI_ST_SLUG] = NSI_ST_SIZE.slice();
// Rod: semua varian ukurannya sama (1 x 3 x 1 studs).
NSI_ROD_SLUGS.forEach((s) => { NSI_SIZES[s] = NSI_ROD_SIZE.slice(); });

/** Ukuran item (block) berdasarkan slug. Non-NSI = [1,1,1]. */
export function getNsiSize(slug) {
  return NSI_SIZES[slug] || [1, 1, 1];
}

// Daftar NSI yang sudah terdaftar.
export const NSI_SLUGS = [NSI_WEDGE_SLUG, NSI_RAMP_SLUG, NSI_TRUSS_SLUG, NSI_SEAT_SLUG, NSI_STEP_SLUG, NSI_MAST_SLUG, NSI_HELM_SLUG, NSI_WINDOW_SLUG, NSI_DOOR_SLUG, NSI_HATCH_SLUG, ...NSI_CHEST_SLUGS, NSI_ST_SLUG, ...NSI_ROD_SLUGS];
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
export function _fixWindingByVolume(geo) {
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

export function _buildFaces(THREE, faces, opts) {
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

/**
 * BOLA PENUH (sphere) — untuk gagang pintu. Dua kubah (atas & bawah) yang
 * disatukan, sehingga tertutup dari SEGALA sudut pandang (tidak "bolong").
 * Winding diperbaiki otomatis oleh _fixWindingByVolume (voting normal).
 */
function _sphereFaces(r, cx, cy, cz, seg = 12, rings = 5) {
  const fs = [];
  const P = (rr, th, ph) => [
    cx + rr * Math.sin(ph) * Math.cos(th),
    cy + rr * Math.cos(ph),
    cz + rr * Math.sin(ph) * Math.sin(th),
  ];
  for (let i = 0; i < rings; i++) {
    const ph0 = (i / rings) * Math.PI, ph1 = ((i + 1) / rings) * Math.PI;
    for (let j = 0; j < seg; j++) {
      const th0 = (j / seg) * Math.PI * 2, th1 = ((j + 1) / seg) * Math.PI * 2;
      fs.push([P(r, th0, ph0), P(r, th1, ph0), P(r, th1, ph1), P(r, th0, ph1)]);
    }
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
 * Bagian-bagian WINDOW (jendela kayu + kaca). Sumber tunggal (dipakai geometri
 * & render ikon). Pusat di origin; Y = atas.
 *
 * TERUKUR dari 2 gambar referensi (Gemini + pengukuran piksel):
 *   • bingkai = 4 batang kayu (atas/bawah/kiri/kanan) membentuk persegi BERONGGA
 *   • ketebalan bingkai ≈ 0.34 block (0.68 studs) — rasio bukaan terukur
 *     0.56–0.71 dari lebar → ambil tengahnya
 *   • 1 pane kaca tunggal, mengikuti bukaan dalam, MENJOROK ke dalam (recessed)
 *   • kaca tebal 0.2 studs = 0.1 block (PERMINTAAN USER, verbatim)
 *   • tepi siku 90° tajam (tanpa bevel) — semua memakai _box
 *   • TIDAK ada bagian menonjol keluar
 */
/**
 * ── NSI LEVEL 2 #6: DOOR (pintu INTERAKTIF) ─────────────────────────────
 * PERMINTAAN USER (2026-10-09, verbatim): *"identitasnya adalah 'Door' dan dia
 * adalah NSI pertama yang bisa di click, jika di klik kiri atau di sentuh di hp
 * dia akan kebuka si 'Door' nya"* · *"Door : panjang kanan kiri 5.5 studs, lebar
 * (ketebalan) pintu 0.5 studs, tinggi 7 studs"*
 *
 * UKURAN: 5.5 × 7 × 0.5 studs = 2.75 × 3.5 × 0.25 block (bbox TEPAT).
 *
 * TERUKUR dari 4 gambar referensi (Gemini + pengukuran piksel):
 *   • Daun pintu kayu persegi panjang + 4 panel kaca (2×2): 2 atas TINGGI
 *     (memanjang vertikal), 2 bawah PENDEK (hampir bujur sangkar)
 *   • Tepi luar daun LEBIH TEBAL (profil bingkai) membingkai area panel
 *   • Gagang BULAT (knob) + leher silinder, di sisi BEBAS (berlawanan engsel)
 *   • Engsel di sisi KIRI (sumbu putar di tepi kiri), pintu membuka ~90°
 *   • Warna kayu: cokelat jingga hangat
 *
 * SUSUNAN KOORDINAT (penting untuk animasi):
 *   • Origin = PUSAT bbox (agar penempatan app benar tanpa perubahan)
 *   • Sumbu engsel = garis x = -EX (tepi kiri), vertikal (Y)
 *   • Saat terbuka: daun + kaca + gagang diputar mengelilingi sumbu engsel
 *     (rotasi Y negatif → daun mengayun keluar)
 */
export function getDoorParts() {
  const EX = 1.375;           // setengah lebar (x) = 1.375 block → total 2.75 (5.5 studs)
  const EY = 1.75;            // setengah tinggi (y) = 1.75 block → total 3.5 (7 studs)
  // ── KETEBALAN (Z) — total bbox WAJIB TEPAT 0.25 block (0.5 studs) ──
  // ⚠️ JEBAKAN TERUKUR (2026-10-09): gagang BULAT menonjol keluar muka pintu.
  // Kalau daun dibuat 0.25 block PENUH, gagang menonjol → bbox Z jadi 0.31
  // (melebihi spek 0.5 studs) → penempatan/snap jadi salah.
  // SOLUSI: total 0.25 dibagi → daun 0.20 block (0.40 studs), gagang menonjol
  // 0.05 block (0.10 studs). Total = 0.5 studs ✓
  // ⚠️⚠️ KOREKSI (2026-10-09, permintaan user — verbatim: *"sisi belakang kaya
  //    kosong gitu harusnya copy dari depan gitu jadi depan belakang sama cuman
  //    beda arahnya gitu sama dan posisi gagang juga sama disitu aja ga kebalik
  //    tetep sama"*).
  //    AKAR TERUKUR: daun TIDAK simetris (DZ0=−0.125, DZ1=+0.075) dan list emas,
  //    garis panel, serta gagang HANYA ada di z POSITIF (muka depan) → dari
  //    belakang tampak polos/kosong.
  //    FIX: daun DIPUSATKAN di z=0 (tebal 0.15) supaya **muka DEPAN TETAP di
  //    +0.075 (tampilan depan 100% TIDAK berubah)** dan muka BELAKANG jadi
  //    CERMINAN SEMPURNA. Gagang menonjol 0.05 ke DEPAN dan ke BELAKANG →
  //    bbox Z tetap TEPAT 0.25 block (0.5 studs) ✓
  const DZ0 = -0.075;         // muka BELAKANG daun (= −muka depan → simetris)
  const DZ1 = 0.075;          // muka DEPAN daun (NILAI LAMA — tidak diubah)
  const DZC = (DZ0 + DZ1) / 2;// pusat tebal daun = 0 (kaca otomatis terpusat)
  const GT = 0.06;            // tebal kaca
  const GE = 0.060;           // lebar list EMAS. ⚠️ TERUKUR: GE 0.044 masih hanya
                              // 70 px di render (0.03%) = nyaris tak terlihat.
                              // Referensi: list emas JELAS terlihat → perbesar.
  const EZ0 = DZ1 - 0.006;    // list emas menonjol dari muka daun (anti z-fighting)
  const EZ1 = DZ1 + 0.016;
  // ⚠️ CERMIN BELAKANG (permintaan user 2026-10-09: *"sisi belakang kaya kosong
  //    harusnya copy dari depan"*): list emas & garis panel WAJIB ada di KEDUA
  //    muka. Cermin pada z=0 → X & Y TIDAK berubah (posisi tetap sama).
  const EZ0b = DZ0 + 0.006;   // = −EZ0
  const EZ1b = DZ0 - 0.016;   // = −EZ1

  // ══════════════════════════════════════════════════════════════════════
  // PROPORSI — DIUKUR dari 2 foto referensi (kritik Claude + ukur piksel).
  // Fraksi LEBAR (dari 2.75 block) dan TINGGI (dari 3.5 block):
  //   margin kayu  kiri/kanan 22%   ·  atas 14%  ·  bawah 20%
  //   jendela 19%  ·  strip tengah 18%   (lebar)
  //   jendela ATAS 42% tinggi  ·  palang tengah 12%  ·  jendela BAWAH 12%
  // → hasil: 2 jendela TINGGI di atas + 2 jendela KECIL (hampir persegi) di
  //   bawah. TIDAK ADA baris ketiga (bug lama: pita tengah kosong → 6 bukaan).
  // ══════════════════════════════════════════════════════════════════════
  const W = EX * 2, H = EY * 2;
  const mX = W * 0.22;        // margin kiri/kanan (0.605)
  const mT = H * 0.14;        // margin atas (0.49)
  const mB = H * 0.20;        // margin bawah (0.70)
  const winW = W * 0.19;      // lebar jendela (0.5225)
  const midW = W * 0.18;      // strip kayu tengah (0.495)
  const upH = H * 0.42;       // tinggi jendela ATAS (1.47)
  const railH = H * 0.12;     // palang tengah (0.42)
  const loH = H * 0.12;       // tinggi jendela BAWAH (0.42)

  // batas vertikal (dari atas ke bawah)
  const yTop = EY, yTopBarB = EY - mT;              // 1.75 .. 1.26
  const yUpB = yTopBarB - upH;                      // 1.26 .. -0.21
  const yRailB = yUpB - railH;                      // -0.21 .. -0.63
  const yLoB = yRailB - loH;                        // -0.63 .. -1.05
  const yBotB = -EY;                                // -1.05 .. -1.75
  // batas horizontal (dari kiri ke kanan) — URUT, jangan lompat:
  //   margin kiri → jendela kiri → strip tengah → jendela kanan → margin kanan
  const xL = -EX, xLB = -EX + mX;                   // -1.375 .. -0.770
  const xWL1 = xLB + winW;                          // -0.770 .. -0.2475 (kanan jendela KIRI)
  const xMR0 = xWL1 + midW;                         // -0.2475 .. 0.2475 (strip tengah)
  const xWR1 = xMR0 + winW;                         // 0.2475 .. 0.770  (kanan jendela KANAN)
  const xRB = EX - mX;                              // 0.770 .. 1.375   (margin kanan)
  // ⚠️ BUG TERUKUR (2026-10-09, vision: "bukaan kanan atas kurus"): batas
  //    jendela KANAN semula `[xWR1, xRB]` — padahal xWR1 (0.770) == xRB (0.770)
  //    → lebar 0.0 (celah kurus). Yang BENAR: `[xMR0, xWR1]`. Nilai sama-sama
  //    benar, NAMANYA yang tertukar — verifikasi dengan ANGKA, jangan nama.
  // jendela BAWAH — KOREKSI (2026-10-09, kritik Claude #6/#7 "tidak segaris"):
  //   semula di-inset 0.062 → tepi vertikal TIDAK segaris dgn jendela atas.
  //   Referensi: tiap jendela kecil TEPAT di bawah jendela tingginya (segari).
  //   FIX: pakai batas X yang SAMA dgn jendela atas (tanpa inset).
  const loX0 = xLB, loX1 = xWL1;
  const loX2 = xMR0, loX3 = xWR1;

  const parts = [];
  const W_ = (x0, x1, y0, y1) => ({ faces: _box(x0, x1, y0, y1, DZ0, DZ1), tag: 'wood' });

  // ── 1) KAYU SOLID (daun pintu) — semua area SELAIN 4 lubang jendela ──
  // ⚠️ BUG TERUKUR (2026-10-09, vision "celah gelap memanjang di samping jendela"):
  //    strip tengah semula `W_(xMR0−midW/2, xMR0+midW/2)` = [0.0, 0.495] — hanya
  //    menutup separuh! Sisi kiri strip [−0.2475, 0.0] KOSONG → lubang memanjang
  //    (kiri/kanan jendela). Yang BENAR: strip = RUANG ANTARA 2 jendela, yaitu
  //    [xWL1, xMR0] (pusat 0, lebar midW). PELAJARAN: jangan hitung ulang batas
  //    dari pusat — PAKAI variabel batas yang sudah ada.
  parts.push(W_(xL, EX, yTopBarB, yTop));            // palang ATAS (marg. atas)
  parts.push(W_(xL, EX, yBotB, yLoB));               // palang BAWAH (marg. bawah)
  parts.push(W_(xL, xLB, yLoB, yTopBarB));           // batang KIRI (sisi engsel)
  parts.push(W_(xRB, EX, yLoB, yTopBarB));           // batang KANAN (sisi gagang)
  parts.push(W_(xWL1, xMR0, yLoB, yTopBarB));        // strip TENGAH [xWL1, xMR0]
  parts.push(W_(xLB, xWL1, yRailB, yUpB));           // palang tengah KIRI
  parts.push(W_(xMR0, xWR1, yRailB, yUpB));          // palang tengah KANAN
  // pengisi samping jendela BAWAH (karena di-inset) — pakai batas yang BENAR
  parts.push(W_(xLB, loX0, yLoB, yRailB));           // kiri  jendela bawah-kiri
  parts.push(W_(loX1, xWL1, yLoB, yRailB));          // kanan jendela bawah-kiri
  parts.push(W_(xMR0, loX2, yLoB, yRailB));          // kiri  jendela bawah-kanan
  parts.push(W_(loX3, xWR1, yLoB, yRailB));          // kanan jendela bawah-kanan

  // ── 2) GARIS PANEL DALAM (kritik Claude #8, KOREKSI #10) ──
  //      Semula garis HITAM tipis (tampak "gambar garis"). Referensi: lekukan
  //      menjorok HALUS berwarna KAYU (sedikit lebih gelap), jarak lebih rapi.
  //      FIX: pakai tag 'panel' (warna kayu lebih gelap, BUKAN hitam) +
  //      posisi lebih masuk dari tepi (inset 0.13) supaya tampak rapi.
  const PX = 0.13, PY = 0.13, PL = 0.032;     // inset & lebar alur
  const pz0 = DZ1 - 0.004, pz1 = DZ1 + 0.008;
  const pz0b = DZ0 + 0.004, pz1b = DZ0 - 0.008;   // CERMIN belakang
  const pl = (x0, x1, y0, y1) => parts.push({ faces: _box(x0, x1, y0, y1, pz0, pz1), tag: 'panel' });
  const plb = (x0, x1, y0, y1) => parts.push({ faces: _box(x0, x1, y0, y1, pz0b, pz1b), tag: 'panel' });
  pl(xL + PX, EX - PX, yTop - PY - PL, yTop - PY);        // atas
  pl(xL + PX, EX - PX, -EY + PY, -EY + PY + PL);          // bawah
  pl(xL + PX, xL + PX + PL, -EY + PY, yTop - PY);         // kiri
  pl(EX - PX - PL, EX - PX, -EY + PY, yTop - PY);         // kanan
  // cerminan belakang (X & Y sama persis — cermin pada z=0)
  plb(xL + PX, EX - PX, yTop - PY - PL, yTop - PY);
  plb(xL + PX, EX - PX, -EY + PY, -EY + PY + PL);
  plb(xL + PX, xL + PX + PL, -EY + PY, yTop - PY);
  plb(EX - PX - PL, EX - PX, -EY + PY, yTop - PY);

  // ── 3) KACA + 4) LIST EMAS: 4 panel (2 TINGGI atas, 2 KECIL bawah) ──
  const panels = [
    [xLB, xWL1, yUpB, yTopBarB],    // atas-kiri  (TINGGI)
    [xMR0, xWR1, yUpB, yTopBarB],   // atas-kanan (TINGGI)
    [loX0, loX1, yLoB, yRailB],     // bawah-kiri (KECIL)
    [loX2, loX3, yLoB, yRailB],     // bawah-kanan(KECIL)
  ];
  panels.forEach(([x0, x1, y0, y1]) => {
    // kaca mengikuti bukaan dalam, TEPAT DI TENGAH kedalaman
    parts.push({ faces: _box(x0, x1, y0, y1, DZC - GT / 2, DZC + GT / 2), tag: 'glass' });
    // list EMAS tipis di sekeliling tiap jendela (4 batang, menonjol sedikit)
    parts.push({ faces: _box(x0 - GE, x1 + GE, y1, y1 + GE, EZ0, EZ1), tag: 'gold' });  // atas
    parts.push({ faces: _box(x0 - GE, x1 + GE, y0 - GE, y0, EZ0, EZ1), tag: 'gold' });  // bawah
    parts.push({ faces: _box(x0 - GE, x0, y0, y1, EZ0, EZ1), tag: 'gold' });            // kiri
    parts.push({ faces: _box(x1, x1 + GE, y0, y1, EZ0, EZ1), tag: 'gold' });            // kanan
    // ⚠️ CERMIN BELAKANG (permintaan user: *"sisi belakang kaya kosong, harusnya
    //    copy dari depan"*): list emas IDENTIK di muka belakang (X&Y sama persis).
    parts.push({ faces: _box(x0 - GE, x1 + GE, y1, y1 + GE, EZ0b, EZ1b), tag: 'gold' });
    parts.push({ faces: _box(x0 - GE, x1 + GE, y0 - GE, y0, EZ0b, EZ1b), tag: 'gold' });
    parts.push({ faces: _box(x0 - GE, x0, y0, y1, EZ0b, EZ1b), tag: 'gold' });
    parts.push({ faces: _box(x1, x1 + GE, y0, y1, EZ0b, EZ1b), tag: 'gold' });
  });

  // ── 5) GAGANG: bola EMAS + leher, sisi KANAN, ketinggian TENGAH ──
  // Referensi + kritik Claude #9: bola emas LEBIH BESAR, mengilap, sedikit
  // masuk dari tepi. KOREKSI: ketinggian = 41% dari BAWAH (referensi 58–60%
  // dari atas) supaya ergonomis — semula 38% (terlalu rendah, kritik "terlalu rendah").
  const kr = 0.085;                     // jari-jari bola gagang (diperbesar)
  const kx = EX - 0.18;                 // MASUK dari tepi kanan (X SAMA di 2 sisi)
  const ky = -EY + H * 0.41;            // ketinggian 41% dari bawah (= 59% dari atas)
  const kz = 0.125 - kr * 0.974918;     // ⚠️ rasio 0.974918 = radius EFEKTIF terukur
                                        // bola seg-14/ring-6 → puncak TEPAT di +0.125
  // ⚠️ GAGANG 2 SISI (permintaan user: *"posisi gagang juga sama disitu aja ga
  //    kebalik tetep sama"*): cermin pada z=0 → X & Y TIDAK berubah (tetap di
  //    sisi KANAN, ketinggian sama) → dari belakang tampak sama, tidak kebalik.
  const kzb = -0.125 + kr * 0.974918;   // puncak belakang TEPAT di −0.125
  parts.push({ faces: _cylBetween([kx, ky, DZ1 - 0.02], [kx, ky, kz], kr * 0.5, 10), tag: 'gold' });
  parts.push({ faces: _sphereFaces(kr, kx, ky, kz, 14, 6), tag: 'gold' });
  parts.push({ faces: _cylBetween([kx, ky, DZ0 + 0.02], [kx, ky, kzb], kr * 0.5, 10), tag: 'gold' });
  parts.push({ faces: _sphereFaces(kr, kx, ky, kzb, 14, 6), tag: 'gold' });

  return parts;
}

/** Info engsel pintu (dipakai app untuk animasi buka/tutup). */
export const DOOR_HINGE_X = -1.375;   // sumbu putar di tepi KIRI (lokal, relatif pusat)
export const DOOR_OPEN_ANGLE = -Math.PI / 2;   // terbuka 90° (ayun keluar)

// ── NSI L2 #7 HATCH: engsel di tepi KIRI (x−) → dibuka MENGANGKAT ke atas.
//    ⚠️ KOREKSI USER (2026-10-10, verbatim): *"titik kamu taruh engsel itu salah
//    tapi animasi bukanya benar, gini deh itu kamu taruh engsel diatas kan?
//    harusnya samping kiri (titik terjauh gagang, bukan titik terdekat gagang)"*.
//    Gagang ada di sisi KANAN → engsel WAJIB di sisi KIRI = titik TERJAUH gagang.
//    Tetap MENGANGKAT (sisi kanan/gagang naik), hanya SUMBU engselnya pindah
//    dari belakang (z−) ke kiri (x−) → rotasi pada sumbu Z, sudut POSITIF.
export const HATCH_HINGE_X = -1.0;              // sumbu putar di tepi KIRI
export const HATCH_OPEN_ANGLE = Math.PI / 2;    // angkat 90° (positif, sumbu Z)

export function getWindowParts() {
  const EX = 1.0;             // setengah lebar (x) = 1 block → total 2 block (4 studs)
  const EY = 1.0;             // setengah tinggi (y) = 1 block → total 2 block (4 studs)
  const EZ = 0.25;            // setengah tebal (z) = 0.25 block → total 0.5 block (1 stud)
  const FR = 0.23;            // tebal bingkai kayu (KOREKSI 2026-10-09, laporan user
                              // "bingkainya ketebalan": semula 0.34 = 17% per sisi,
                              // referensi terukur 10–12% per sisi → 0.23 = 11.5%)
  const GT = 0.10;            // tebal kaca = 0.2 studs (permintaan user)
  const parts = [];

  // ── bingkai kayu: 4 batang ──
  // atas & bawah (memanjang penuh)
  parts.push({ faces: _box(-EX, EX, EY - FR, EY, -EZ, EZ), tag: 'wood' });
  parts.push({ faces: _box(-EX, EX, -EY, -EY + FR, -EZ, EZ), tag: 'wood' });
  // kiri & kanan (di antara batang atas/bawah → tidak tumpang tindih)
  parts.push({ faces: _box(-EX, -EX + FR, -EY + FR, EY - FR, -EZ, EZ), tag: 'wood' });
  parts.push({ faces: _box(EX - FR, EX, -EY + FR, EY - FR, -EZ, EZ), tag: 'wood' });

  // ── kaca: mengikuti BUKAAN DALAM, ditaruh TEPAT DI TENGAH kedalaman ──
  // ⚠️ KOREKSI (2026-10-09, laporan user "kaca gak pas di tengah, dari satu sisi
  //    kelihatan tebal"): semula kaca di z 0.080..0.180 (menjorok ke DEPAN) →
  //    dari sisi belakang tampak tebal & asimetris. Sekarang kaca dipusatkan:
  //    z = −GT/2 .. +GT/2 → tebal terlihat SAMA dari depan maupun belakang.
  parts.push({
    faces: _box(-EX + FR, EX - FR, -EY + FR, EY - FR, -GT / 2, GT / 2),
    tag: 'glass',
  });

  return parts;
}

/** Buat geometri WINDOW (2 x 2 x 0.5 block = 4 x 4 x 1 studs). */
export function makeWindowGeometry(THREE) {
  const parts = getWindowParts();
  const pos = [], uv = [], col = [];
  parts.forEach((p) => {
    // ⚠️ autoFix: false (rakitan banyak kotak) — winding diperbaiki per komponen
    // lewat voting arah normal (_fixWindingByVolume), sama seperti Helm.
    const g = _buildFaces(THREE, p.faces, { autoFix: false });
    _fixWindingByVolume(g);
    const P = g.getAttribute('position'), U = g.getAttribute('uv');
    const isGlass = p.tag === 'glass';
    // kayu: putih (tekstur asli) alpha 1 · kaca: kebiruan + alpha 0.42
    const c = isGlass ? [0.74, 0.85, 0.94, 0.42] : [1, 1, 1, 1];
    for (let i = 0; i < P.count; i++) {
      pos.push(P.getX(i), P.getY(i), P.getZ(i));
      // ⚠️ kaca: UV KONSTAN (satu titik) supaya TIDAK memakai serat kayu —
      // kalau memakai UV posisi, kaca akan tampak "kayu biru" (salah).
      uv.push(isGlass ? 0.5 : U.getX(i), isGlass ? 0.5 : U.getY(i));
      col.push(c[0], c[1], c[2], c[3]);
    }
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  // itemSize 4 → Three.js aktifkan USE_COLOR_ALPHA (alpha per-vertex)
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  out.computeVertexNormals();
  return out;
}

/** Buat geometri DOOR (2.75 x 3.5 x 0.25 block = 5.5 x 7 x 0.5 studs).
 * ⚠️ INTERAKTIF: pintu bisa DIBUKA dengan klik biasa (NSI pertama).
 *    Daun pintu + engsel dibuat di geometri ini (satu mesh, ringan);
 *    ANIMASI buka/tutup dijalankan app lewat `userData.door`. */
export function makeDoorGeometry(THREE) {
  const parts = getDoorParts();
  const pos = [], uv = [], col = [];
  // ⚠️⚠️ AKAR "EMAS/KACA HITAM" (terukur 2026-10-09, kritik Claude #6 & #9):
  //    Tekstur kayu `wood_block.png` di UV(0.5,0.5) = RGB[30,16,6] ≈ HITAM.
  //    Vertex color = PENGALI: emas [1.55,1.18,0.42] × [0.12,0.06,0.02]
  //    = [0.18,0.07,0.01] → HITAM. Kaca [0.74,0.85,0.94] × hitam → BIRU TUA.
  //    FIX: tekstur pintu = GRAYSCALE (door.png, dari wood_block: |R−G|=0)
  //    sehingga vertex color MENGENDALIKAN warna penuh. Warna di bawah
  //    DIKALIBRASI dari referensi: C = warna_ref / 255 / (grayscale rata2 0.59).
  //    Ref KAYU RGB[183,162,48] · Ref KACA RGB[123,149,89] (hijau sage).
  const UVBRIGHT = 0.020;   // v texel TERANG (untuk UV konstan kaca & emas)
  const UVBRIGHTX = 0.985;
  parts.forEach((p) => {
    // ⚠️ autoFix: false (rakitan banyak kotak) — winding diperbaiki per komponen
    // lewat voting arah normal (_fixWindingByVolume), sama seperti Helm/Window.
    const g = _buildFaces(THREE, p.faces, { autoFix: false });
    _fixWindingByVolume(g);
    const P = g.getAttribute('position'), U = g.getAttribute('uv');
    let c, uvConst = false;
    if (p.tag === 'glass') {
      // kaca: hijau-sage semi-tembus. ⚠️ c dikoreksi dari RENDER NYATA
      // (ukur piksel): viewer punya tone-map ACES yang memampatkan warna,
      // jadi c harus > target/255/grayscale. Terukur: kayu c1.896 → render 162.
      c = [2.30, 3.30, 1.05, 0.62];
      uvConst = false;   // ⚠️ KACA BERTEKSTUR (kritik #13): pakai UV posisi →
                         //    tekstur buram halus terlihat (referensi std 14.9%)
    } else if (p.tag === 'gold') {
      // ⚠️ AKAR "list emas tak terlihat" (TERUKUR: 0 piksel emas di render):
      //    c emas 1.621 lebih KECIL dari kayu 1.896 → emas tampak GELAP.
      //    FIX: emas WAJIB paling terang + jenuh (ref 255,205,60 vs kayu 183,163,48).
      c = [3.60, 2.90, 0.22, 1.0];
      uvConst = true;
    } else if (p.tag === 'panel') {
      // alur panel dalam: KAYU lebih gelap (bukan hitam) — kritik #10
      c = [1.40, 0.78, 0.11, 1.0];
      uvConst = false;
    } else {
      // KAYU: ⚠️ KONTRAS (kritik #8: "emas menyatu dgn kayu"). Kayu dibikin
      // lebih COKELAT/merah (G diturunkan 25%) supaya list emas menonjol jelas.
      // Ref kayu [183,163,48] terlalu kuning-terang → G diturunkan.
      c = [2.05, 1.18, 0.13, 1.0];
    }
    for (let i = 0; i < P.count; i++) {
      pos.push(P.getX(i), P.getY(i), P.getZ(i));
      uv.push(uvConst ? UVBRIGHTX : U.getX(i), uvConst ? UVBRIGHT : U.getY(i));
      col.push(c[0], c[1], c[2], c[3]);
    }
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  // itemSize 4 → Three.js aktifkan USE_COLOR_ALPHA (alpha per-vertex)
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  out.computeVertexNormals();
  return out;
}

/**
 * ── NSI LEVEL 2 #7: HATCH (palka/trapdoor INTERAKTIF) ─────────────────────
 * PERMINTAAN USER (2026-10-09, verbatim): *"identitas nya adalah 'Hatch', dia
 * bisa dibuka tutup hanya saja dia bukan pintu, gini deh tau trapdoor di
 * minecraft? dan bukanya gimana itu? ya kayak gitu mirip kok ... Hatch :
 * panjang 4 studs, lebar 4 studs, tinggi 1 studs"*
 *
 * BENTUK (terukur dari 5 foto referensi):
 *   • PELAT HORIZONTAL 2×0.5×2 block = 4×1×4 studs (persegi; rasio foto 1.04–1.15)
 *   • BINGKAI kayu tebal di ke-4 tepi + DAUN pintu menjorok ke DALAM
 *   • CELAH/lubang memanjang tembus di daun (ventilasi / lubang intip)
 *   • GAGANG kecil menonjol ke atas di sisi KANAN
 *
 * ⚠️ BUKA/TUTUP: engsel di tepi BELAKANG (z−), daun MENGANGKAT ke atas
 *    (persis trapdoor Minecraft) — lihat HATCH_HINGE_X / HATCH_OPEN_ANGLE.
 */
export function getHatchParts() {
  const EX = 1.0;            // setengah panjang (x) = 1 block → total 2 (4 studs)
  const EZ = 1.0;            // setengah lebar  (z) = 1 block → total 2 (4 studs)
  const EY = 0.25;           // setengah tinggi (y) = 0.25 block → total 0.5 (1 stud)
  // ── KOREKSI DESAIN (2026-10-10, kritik Claude — perbandingan ORI vs KARYA) ──
  //  Referensi terukur: kerangka ORANYE KEMERAHAN [221,118,47] vs panel KUNING
  //  EMAS [228,151,50] → KONTRAS TINGGI. Punya saya dulu keduanya kuning mustard
  //  (kontras rendah). Panel juga MENJOROK ke dalam (dinding dalam terlihat).
  const FR = 0.20;           // tebal BINGKAI luar
  const WALL = 0.045;        // tebal DINDING DALAM (gelap, terlihat krn menjorok)
  const LIFT = 0.085;        // kedalaman panel menjorok (dulu 0.055 → kurang terlihat)
  const parts = [];

  const ix0 = -EX + FR, ix1 = EX - FR;      // batas dalam bingkai
  const iz0 = -EZ + FR, iz1 = EZ - FR;

  // ── 1) BINGKAI kayu (4 batang) di ke-4 tepi ──
  parts.push({ faces: _box(-EX, EX, -EY, EY, -EZ, -EZ + FR), tag: 'wood' });        // tepi BELAKANG
  parts.push({ faces: _box(-EX, EX, -EY, EY, EZ - FR, EZ), tag: 'wood' });          // tepi DEPAN
  parts.push({ faces: _box(-EX, -EX + FR, -EY, EY, -EZ + FR, EZ - FR), tag: 'wood' });
  parts.push({ faces: _box(EX - FR, EX, -EY, EY, -EZ + FR, EZ - FR), tag: 'wood' });

  // ── 2) DINDING DALAM (cincin) — merah kecokelatan GELAP ──
  //  Terlihat karena panel menjorok ke dalam (kritik Claude #5).
  const wx0 = ix0 + WALL, wx1 = ix1 - WALL;   // batas daun (panel)
  const wz0 = iz0 + WALL, wz1 = iz1 - WALL;
  parts.push({ faces: _box(ix0, ix1, -EY, EY, iz0, wz0), tag: 'inner' });   // dinding belakang
  parts.push({ faces: _box(ix0, ix1, -EY, EY, wz1, iz1), tag: 'inner' });   // dinding depan
  parts.push({ faces: _box(ix0, wx0, -EY, EY, wz0, wz1), tag: 'inner' });   // dinding kiri
  parts.push({ faces: _box(wx1, ix1, -EY, EY, wz0, wz1), tag: 'inner' });   // dinding kanan

  // ── 3) DAUN panel — dipotong 4 bagian mengelilingi CELAH supaya celah TEMBUS ──
  const yTop = EY - LIFT;                     // permukaan daun (menjorok)
  const PW = wx1 - wx0, PD = wz1 - wz0;       // ukuran panel dalam
  // ⚠️ CELAH dikoreksi (kritik #2): dulu 2.25:1 & terlalu ke tengah/atas.
  //    Referensi ~6:1 (panjang:pipih), x 20%–80% lebar panel, di bagian BAWAH.
  const slX0 = wx0 + PW * 0.20, slX1 = wx0 + PW * 0.80;
  const slZ0 = wz0 + PD * 0.70, slZ1 = wz0 + PD * 0.80;
  parts.push({ faces: _box(wx0, wx1, -EY, yTop, wz0, slZ0), tag: 'leaf' });   // belakang celah
  parts.push({ faces: _box(wx0, wx1, -EY, yTop, slZ1, wz1), tag: 'leaf' });   // depan celah
  parts.push({ faces: _box(wx0, slX0, -EY, yTop, slZ0, slZ1), tag: 'leaf' }); // kiri celah
  parts.push({ faces: _box(slX1, wx1, -EY, yTop, slZ0, slZ1), tag: 'leaf' }); // kanan celah

  // ── 4) GAGANG: BATANG (bukan kubus) — kritik #1 "kesalahan terbesar" ──
  //  Referensi: batang vertikal tinggi & sempit ≈1:5, abu-abu sedang, di sisi
  //  KANAN sedikit di atas tengah, RATA/pipih (bukan kubus menonjol).
  const hw = 0.105;                     // lebar (x) — tipis
  const hl = 0.45;                      // panjang (z) — batang memanjang
  const hx = wx1 - 0.16;                // dekat tepi dalam kanan
  const hz = wz0 + PD * 0.45;           // sedikit di atas tengah panel
  parts.push({
    faces: _box(hx - hw / 2, hx + hw / 2, yTop, EY, hz - hl / 2, hz + hl / 2),
    tag: 'metal',
  });

  return parts;
}

/** Buat geometri HATCH (2 x 0.5 x 2 block = 4 x 1 x 4 studs). */
export function makeHatchGeometry(THREE) {
  const parts = getHatchParts();
  const pos = [], uv = [], col = [];
  // ⚠️ Tekstur Hatch = GRAYSCALE (hatch.png, sama pola dgn Door) supaya
  //    vertex color MENGENDALIKAN warna penuh (akar "warna jadi hitam", bab 135).
  const UVBRIGHT = 0.020, UVBRIGHTX = 0.985;
  parts.forEach((p) => {
    const g = _buildFaces(THREE, p.faces, { autoFix: false });
    _fixWindingByVolume(g);
    const P = g.getAttribute('position'), U = g.getAttribute('uv');
    let c, uvConst = false;
    if (p.tag === 'metal') {
      // GAGANG: abu-abu SEDANG (kritik #1: dulu "pucat kehijauan" → terlalu pucat).
      // Referensi terukur RGB[106,108,121] = abu-abu netral sedang.
      c = [1.02, 1.04, 1.17, 1.0];
      uvConst = true;
    } else if (p.tag === 'leaf') {
      // PANEL: KUNING EMAS — c DIKALIBRASI dari render nyata (iterasi 2):
      //   render [183,130,67] vs target [228,151,50] → faktor [1.246,1.162,0.746]
      c = [3.389, 2.207, 0.299, 1.0];
    } else if (p.tag === 'inner') {
      // DINDING DALAM: merah kecokelatan GELAP (referensi "dinding dalam gelap")
      // → memberi kesan cekungan/kedalaman (kritik #5).
      c = [1.05, 0.50, 0.10, 1.0];
    } else {
      // KERANGKA: ORANYE KEMERAHAN — c DIKALIBRASI dari render nyata (iterasi 2):
      //   render [170,121,62] vs target [221,118,47] → faktor [1.3,0.975,0.758]
      //   → output ~[221,121,47] = ORANYE KEMERAHAN (kontras G 33 dari panel) ✓
      c = [2.99, 1.024, 0.182, 1.0];
    }
    for (let i = 0; i < P.count; i++) {
      pos.push(P.getX(i), P.getY(i), P.getZ(i));
      uv.push(uvConst ? UVBRIGHTX : U.getX(i), uvConst ? UVBRIGHT : U.getY(i));
      col.push(c[0], c[1], c[2], c[3]);
    }
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  out.computeVertexNormals();
  return out;
}

/**
 * ── NSI LEVEL 2 #8: LEGENDARY CHEST (peti harta) — DEKORASI (TIDAK interaktif) ──
 * PERMINTAAN USER (2026-10-10, verbatim): *"identitasnya adalah \"Legendary Chest\"
 * meskipun begitu dia jika di klik tidak terjadi apa apa yang mana tidak ada
 * fitur apapun jika di klik hanya dekorasi"*. Ukuran: 4.5 × 4.5 × 3.5 studs.
 *
 * BENTUK (dari 5 foto: depan/samping kiri/kanan/belakang/atas):
 * ═══════════════════════════════════════════════════════════════════════════
 * REVISI BESAR 2026-10-10 — berdasarkan kritik (ORI vs KARYA) via SESI KONFIRMASI.
 *
 * KESALAHAN SEBELUMNYA (terukur):
 *   • SISI SAMPING POLOS — rangka hanya "pita datar di atas tutup + H di depan";
 *     tidak ada lengkungan yang MEMBUNGKUS peti. (kesalahan terbesar)
 *   • Pita MENEMPEL RATA (tidak menonjol keluar badan).
 *   • Ada UNDAKAN/BIBIR tutup yang memutus pita dari tiang.
 *   • Tiang tipis & lurus (tanpa kaki melebar, ujung rata).
 *   • Pelat kunci rata & bertangga; lubang kunci kotak kecil.
 *   • Rivet kotak kecil; tidak ada di belakang.
 *   • Magenta PUCAT (orchid) & kayu terlalu terang (tan).
 *
 * BENTUK BARU (sesuai ORI):
 *   • RANGKA berbentuk **A dari samping**: tiang bawah → PALANG → tiang atas,
 *     membentang DEPAN→BELAKANG (membungkus peti), MENONJOL keluar badan.
 *   • Dari DEPAN membentuk **H** (2 tiang + palang penghubung).
 *   • Tiang LEBAR (0.40 dari 2.25 = 18%), MENONJOL keluar badan.
 *   • Rangka DI ATAS tutup = rangka "melewati tutup".
 *   • Tutup BERSEGI MIRING (chamfer), badan tanpa sudut runcing.
 *   • Pelat kunci: persegi vertikal + TONJOLAN setengah lingkaran atas-bawah.
 *   • Lubang kunci: KAPSUL BESAR (kapsul = box + 2 silinder ujung).
 *   • Rivet BULAT di kaki rangka (depan 2 + belakang 2).
 *   • Warna: KAYU cokelat gelap [110,68,37] · MAGENTA JENUH [180,4,180].
 * ═══════════════════════════════════════════════════════════════════════════
 */
/**
 * Polygon 2D bersudut dipotong (octagon) — untuk BADAN ber-chamfer.
 * R = setengah ukuran, cc = besar potongan sudut.
 */
function _octagon(R, cc) {
  // ⚠️ URUTAN CCW (searah jarum jam di sumbu Y) — kalau terbalik, muka tutup
  //    menghadap ke DALAM (autoFix centroid-global tidak menolong).
  return [
    [R, R - cc], [R - cc, R], [-(R - cc), R], [-R, R - cc],
    [-R, -(R - cc)], [-(R - cc), -R], [R - cc, -R], [R, -(R - cc)],
  ].reverse();
}

/**
 * Octagon dengan radius X & Z BERBEDA (badan peti: lebar ≠ kedalaman).
 * RX = setengah lebar (x), RZ = setengah kedalaman (z), cc = besar chamfer.
 */
function _octagonXZ(RX, RZ, cc) {
  const cx = Math.min(cc, RX * 0.9), cz = Math.min(cc, RZ * 0.9);
  return [
    [RX, RZ - cz], [RX - cx, RZ], [-(RX - cx), RZ], [-RX, RZ - cz],
    [-RX, -(RZ - cz)], [-(RX - cx), -RZ], [RX - cx, -RZ], [RX, -(RZ - cz)],
  ].reverse();
}

/**
 * Ekstrusi polygon 2D sepanjang satu sumbu (chamfer/kaki melebar/ujung miring).
 * axis: 'x'|'y'|'z' · pts = [[u,v],...] · a0..a1 = rentang sumbu.
 * ⚠️ Winding ditangani `_fixWindingByVolume` (komponen tertutup → aman).
 */
function _extrudePoly(pts, axis, a0, a1) {
  const M = (u, v, a) => (axis === 'x' ? [a, u, v] : axis === 'y' ? [u, a, v] : [u, v, a]);
  const faces = [];
  const n = pts.length;
  for (let i = 1; i < n - 1; i++) {
    faces.push([M(pts[0][0], pts[0][1], a0), M(pts[i + 1][0], pts[i + 1][1], a0), M(pts[i][0], pts[i][1], a0)]);
  }
  for (let i = 1; i < n - 1; i++) {
    faces.push([M(pts[0][0], pts[0][1], a1), M(pts[i][0], pts[i][1], a1), M(pts[i + 1][0], pts[i + 1][1], a1)]);
  }
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    faces.push([M(p[0], p[1], a0), M(q[0], q[1], a0), M(q[0], q[1], a1), M(p[0], p[1], a1)]);
  }
  return faces;
}

export function getChestParts() {
  // ── NSI LEVEL 2 #8: LEGENDARY CHEST (peti harta) — DEKORASI, TIDAK interaktif ──
  // Spek user: panjang 4.5 studs, lebar 4.5 studs, tinggi 3.5 studs
  //   → 2.25 x 1.75 x 2.25 block.
  // Referensi: peti kayu + rangka MAGENTA yang MEMBUNGKUS (bentuk "H" dari depan,
  //   "A" bersegi dari samping) + pelat & lubang kunci + rivet.
  //
  // ═══ REVISI 2026-10-10 (kritik #1-#3 paling terlihat) ═══
  //  ⚠️ AKAR BUG #1 "tiang sisi seperti sirip tipis" (TERUKUR): tiang depan/belakang
  //     dulu memakai profil YZ setebal P=0.085 saja → dari SAMPING tampak garis
  //     tipis. FIX: KEDALAMAN tiang = BW (0.40) = sama dengan lebarnya → batang
  //     rangka SERAGAM di semua sisi.
  //  ⚠️ AKAR BUG #2 "palang menonjol & undakan": lebar batang tak sama. FIX: semua
  //     batang memakai tebal SERAGAM BARW = 0.20.
  //  ⚠️ AKAR BUG #3 "kepingan kayu mengintip di sudut bukaan": kayu dibuat PAS
  //     di muka rangka → dua permukaan sebidang (z-fighting). FIX: kayu dimasukkan
  //     SEDIKIT (OV) ke dalam rangka sehingga mukanya tersembunyi.
  const EX = 1.125;      // setengah panjang (x) = 2.25 block (4.5 studs)
  const EY = 0.875;      // setengah tinggi (y) = 1.75 block (3.5 studs)
  const rivT = 0.022;    // tonjolan paku/pelat dari muka rangka (kecil = nyaris rata)
  const zf = EX - rivT;  // 1.103 = muka LUAR rangka (tiang/bar)
  // ⚠️ REVISI 2026-10-10 (kritik: "rangka terlalu TIPIS seperti sangkar kawat",
  //    skor turun 95%→88%): BW dulu 0.20 = hanya 11% lebar badan (≈1/9), padahal
  //    original ≈ 1/4. Akibatnya peti tampak dikurung rangka kawat.
  //    FIX: BW = BARW = 0.38 → 0.38/1.486 = 25.6% lebar badan ✓ (kokoh).
  //    Kayu tetap MENGISI bukaan (RXk = zin + overlap) supaya tidak kembali ke
  //    bug "balok kecil dijepit sangkar".
  const BW = 0.38;       // tebal rangka (≈25% lebar badan — original)
  const zin = zf - BW;   // 0.723 = muka DALAM rangka (batas bukaan)
  const BARW = 0.38;     // tebal SERAGAM semua batang (palang = tiang)
  const topCut = 0.15;   // potongan miring ujung atas tiang
  const footW = 0.22, footH = 0.36;   // kaki melebar (potongan diagonal)
  const barY0 = -BARW / 2, barY1 = BARW / 2;   // palang tengah SETEBAL tiang
  // Kayu mengisi BUKAAN + overlap kecil ke dalam rangka (tanpa celah, tanpa
  // menonjol keluar seperti over-correct sebelumnya).
  const RXk = zin + 0.02;  // 0.743 = setengah lebar kayu (x)
  const RZk = zin + 0.02;  // 0.743 = setengah kedalaman kayu (z)
  const OV = 0.02;       // kayu masuk ke dalam rangka (hindari z-fighting)
  const parts = [];

  // ── 1) BADAN KAYU: prisma octagon (chamfer) ──
  //    Badan mengisi BUKAAN (bukan sampai muka luar rangka) — sesuai referensi:
  //    kayu terlihat "sedikit masuk ke dalam rangka".
  //    ⚠️ BUG TERUKUR (vision: "strip horizontal gelap di dasar bukaan" = z-fighting):
  //    kayu dulu mulai TEPAT di -EY, sebidang dengan muka bawah BAR BAWAH → dua
  //    permukaan berimpit. FIX: kayu dinaikkan 0.015 (masuk ke dalam bar bawah).
  parts.push({ faces: _extrudePoly(_octagonXZ(RXk, RZk, 0.09), 'y', -EY + 0.015, EY - BARW + OV), tag: 'wood', fix: true });
  // TUTUP: SATU footprint dengan badan (TANPA undakan/bibir — kritik #5) +
  //        tepi atas dipotong miring (bersegi, bukan datar — kritik #6).
  parts.push({ faces: _extrudePoly(_octagonXZ(RXk, RZk, 0.11), 'y', EY - BARW + OV, EY - 0.09), tag: 'wood', fix: true });
  parts.push({ faces: _extrudePoly(_octagonXZ(RXk - 0.05, RZk - 0.05, 0.10), 'y', EY - 0.09, EY - 0.02), tag: 'wood', fix: true });
  // dua ALUR GELAP tegas & MENERUS — di DALAM bukaan bawah (y −0.46 & −0.32)
  // supaya TERLIHAT dari semua sisi (kritik #11: "alur tak terlihat dari samping").
  const rgx = RXk + 0.006, rgz = RZk + 0.006;
  for (const gy of [-EY + 0.42, -EY + 0.56]) {
    parts.push({ faces: _extrudePoly(_octagonXZ(rgx, rgz, 0.10), 'y', gy - 0.020, gy + 0.020), tag: 'groove', fix: true });
  }

  // ── 2) RANGKA: 2 HOOP (kiri & kanan) — batang SERAGAM, MEMBUNGKUS peti ──
  const hoops = [[-zf, -zf + BW], [zf - BW, zf]];
  for (const [a, b] of hoops) {
    const left = a < 0;
    // TIANG DEPAN & BELAKANG: KEDALAMAN = BW (bukan sirip) + ujung atas miring
    const yzDepan = [[-EY, zin], [-EY, zf], [EY - topCut, zf], [EY, zf - topCut], [EY, zin]];
    const yzBelakang = [[-EY, -zin], [-EY, -zf], [EY - topCut, -zf], [EY, -zf + topCut], [EY, -zin]];
    parts.push({ faces: _extrudePoly(yzDepan, 'x', a, b), tag: 'metal', fix: true });
    parts.push({ faces: _extrudePoly(yzBelakang, 'x', a, b), tag: 'metal', fix: true });
    // BAR ATAS: menutup penuh z, sudut depan & belakang dipotong miring
    const yzAtas = [[EY - BARW, -zf], [EY - BARW, zf], [EY, zf - topCut], [EY, -zf + topCut]];
    parts.push({ faces: _extrudePoly(yzAtas, 'x', a, b), tag: 'metal', fix: true });
    // PALANG TENGAH (tebal = BARW, tidak menonjol melewati tepi)
    parts.push({ faces: _box(a, b, barY0, barY1, -zin, zin), tag: 'metal' });
    // BAR BAWAH (tebal = BARW)
    parts.push({ faces: _box(a, b, -EY, -EY + BARW, -zin, zin), tag: 'metal' });
    // KAKI MELEBAR (diagonal ke DALAM, selebar bukaan → tidak tampak "balok kecil")
    const o0 = left ? a : b, i0 = left ? b : a;
    const iW = i0 + (left ? footW : -footW);
    const profKaki = left
      ? [[o0, -EY], [iW, -EY], [i0, -EY + footH], [o0, -EY + footH]]
      : [[iW, -EY], [o0, -EY], [o0, -EY + footH], [i0, -EY + footH]];
    parts.push({ faces: _extrudePoly(profKaki, 'z', -zin, zin), tag: 'metal', fix: true });
  }
  // PALANG HORIZONTAL penghubung 2 hoop (dari DEPAN membentuk "H")
  // ⚠️ KOREKSI kritik #3 "palang depan terlalu tipis": barZ dulu 0.085 (tipis) →
  //    sekarang SETEBAL tiang (BW=0.20) supaya huruf H kokoh.
  const bx0 = hoops[0][0], bx1 = hoops[1][1];
  const barZ = BW;
  parts.push({ faces: _box(bx0, bx1, barY0, barY1, zf - barZ, zf), tag: 'metal' });
  parts.push({ faces: _box(bx0, bx1, barY0, barY1, -zf, -zf + barZ), tag: 'metal' });

  // ── 3) PELAT KUNCI + LUBANG KUNCI (tengah depan) ──
  const lpy = (barY0 + barY1) / 2;
  const lpH = 0.62, lpW = 0.30;
  const lpZ0 = zf - barZ, lpZ1 = EX - 0.020;
  parts.push({ faces: _box(-lpW / 2, lpW / 2, lpy - lpH / 2, lpy + lpH / 2, lpZ0, lpZ1), tag: 'metal' });
  // tonjolan SETENGAH LINGKARAN atas & bawah — lebih sempit dari pelat
  const bumpR = lpW / 2 - 0.030, bumpSeg = 12;
  parts.push({ faces: _prismZ(bumpR, lpy + lpH / 2, lpZ0, lpZ1, bumpSeg), tag: 'metal' });
  parts.push({ faces: _prismZ(bumpR, lpy - lpH / 2, lpZ0, lpZ1, bumpSeg), tag: 'metal' });
  // LUBANG KUNCI: kapsul vertikal SOLID, MENONJOL dari pelat
  const kw = 0.115, kh = 0.30;
  const kz0 = lpZ1 - 0.010, kz1 = EX;
  parts.push({ faces: _box(-kw / 2, kw / 2, lpy - kh / 2, lpy + kh / 2, kz0, kz1), tag: 'dark' });
  parts.push({ faces: _prismZ(kw / 2, lpy + kh / 2, kz0, kz1, 10), tag: 'dark' });
  parts.push({ faces: _prismZ(kw / 2, lpy - kh / 2, kz0, kz1, 10), tag: 'dark' });

  // ── 4) RIVET BULAT (depan 2 · belakang 2 · samping 2) ──
  const rivY = -EY + 0.22, rivR = 0.088, rivRF = rivR * 0.951;
  for (const [a, b] of hoops) {
    const cx = (a + b) / 2;
    for (const s of [1, -1]) {
      const off = (s > 0) ? (EX - rivT) : -EX;
      parts.push({ faces: _prismZ(rivRF, 0, 0, rivT, 10)
        .map((f) => f.map((p) => [cx + p[0], rivY + p[1], off + p[2]])), tag: 'dark' });
      parts.push({ faces: _prismZ(rivRF, 0, 0, rivT, 10)
        .map((f) => f.map((p) => [off + p[2], rivY + p[1], cx - p[0]])), tag: 'dark' });
    }
  }

  return parts;
}
/**
 * ══════════════════════════════════════════════════════════════════════════
 * NSI LEVEL 2 #8 — LEGENDARY CHEST — TABEL BAKE  (bab 144)
 * ══════════════════════════════════════════════════════════════════════════
 * PERMINTAAN USER (2026-10-11, verbatim): *"SEKARANG YANG BENAR STANDARNYA
 * ADALAH WAJIB SAMA DENGAN NSI VIEWER"*
 *
 * NSI Viewer = PATOKAN BEKU (dikunci rapat, bab 144). Tabel di bawah disalin
 * APA ADANYA dari scene NSI Viewer (45 part) supaya APP menghasilkan bentuk
 * yang 100% sama. JANGAN diubah tanpa membandingkan ulang dengan NSI Viewer.
 *
 * Format tiap baris: [idxGeometri, px,py,pz, qx,qy,qz,qw, sx,sy,sz, r,g,b]
 *   idxGeometri → indeks part di `getChestParts()` (geometri ASLI — TIDAK diubah)
 *   px,py,pz    → posisi LOKAL item (offset item [0,3.375,0] sudah dibuang)
 *   qx,qy,qz,qw → rotasi (kuaternion)
 *   sx,sy,sz    → skala (NEGATIF = part dicerminkan)
 *   r,g,b       → warna vertex ASLI. ⚠️ JANGAN mewarnai dari `tag`: 17 part
 *                 bertag 'wood' tetapi warnanya MAGENTA (tag TIDAK = warna).
 *
 * ⚠️ CATATAN BENTUK (terukur, bukan perkiraan):
 *   • Geometri 45 part ini SUDAH ADA di `getChestParts()` → cukup dirujuk.
 *   • 8 part lama (idx 5,7,9,10,11,13,15,16) DIHAPUS oleh user → tidak dipakai.
 *   • 19 part "adopsi" (rangka penguat) ditambahkan user → ada di tabel ini.
 */
export const NSI_CHEST_BAKE = [
  [8, 1.825, 0.6842, 0, 0, 0, 0, 1, 1, 1, 1.0285, 2.35, 0.06, 2.3],
  [0, -0.00669, 0.06847, 0.00854, 0, 0, 0, 1, 1.231, 0.9996, 1.2665, 0.92, 0.46, 0.2],
  [1, 0, 0.08094, -0.3054, -0.34202, 0, 0, 0.93969, 1.2, 1.0045, 0.21744, 0.92, 0.46, 0.2],
  [2, -0.02079, -4.8269, -0.25884, 0, 0, 0, 1, 1.294, 6.5675, 0.6195, 0.92, 0.46, 0.2],
  [3, 0, 0, 0.01761, 0, 0, 0, 1, 1.25, 1, 1.27, 0.42, 0.19, 0.08],
  [4, 0, 0, 0.01535, 0, 0, 0, 1, 1.25, 1, 1.2735, 0.42, 0.19, 0.08],
  [8, 0, -0.0475, 0, 0, 0, 0, 1, 1, 0.75, 1, 2.35, 0.06, 2.3],
  [14, 0, -0.0475, 0, 0, 0, 0, 1, 1, 0.75, 1, 2.35, 0.06, 2.3],
  [17, 0, 0, 0, 0, 0, 0, 1, 0.98, 1, 0.998, 2.35, 0.06, 2.3],
  [18, 0, -0.0475, 0, 0, 0, 0, 1, 1, 0.75, 1, 2.35, 0.06, 2.3],
  [19, 0, 0, 0, 0, 0, 0, 1, 1.25, 1, 1, 2.35, 0.06, 2.3],
  [20, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2.35, 0.06, 2.3],
  [21, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2.35, 0.06, 2.3],
  [22, 0, 0, 0, 0, 0, 0, 1, 1.25, 1.1, 1, 0.09, 0.08, 0.19],
  [23, 0, 0, 0, 0, 0, 0, 1, 1.225, 1.125, 1, 0.09, 0.08, 0.19],
  [24, 0, 0, 0, 0, 0, 0, 1, 1.225, 1.125, 1, 0.09, 0.08, 0.19],
  [25, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0.09, 0.08, 0.19],
  [26, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0.09, 0.08, 0.19],
  [27, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0.09, 0.08, 0.19],
  [28, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0.09, 0.08, 0.19],
  [29, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0.09, 0.08, 0.19],
  [30, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0.09, 0.08, 0.19],
  [31, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0.09, 0.08, 0.19],
  [32, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0.09, 0.08, 0.19],
  [10, -0.0003, 0.0015, -0.91287, 0, 0, 0, 1, 0.999, 1, 0.2615, 2.35, 0.06, 2.3],
  [10, -0.0003, 0.0015, -0.91287, 0, 0, 0, 1, -0.999, 1, 0.2615, 2.35, 0.06, 2.3],
  [10, -0.9133, 0.0015, 0.001, 0, 0.70711, 0, 0.70711, -0.999, 1, 0.2615, 2.35, 0.06, 2.3],
  [10, -0.9133, 0.0015, -0.00087, 0, 0.70711, 0, 0.70711, 0.999, 1, 0.2615, 2.35, 0.06, 2.3],
  [10, 0.9137, 0.0015, -0.00087, 0, 0.70711, 0, 0.70711, 0.999, 1, 0.2615, 2.35, 0.06, 2.3],
  [10, 0.9137, 0.0015, 0.001, 0, 0.70711, 0, 0.70711, -0.999, 1, 0.2615, 2.35, 0.06, 2.3],
  [10, -0.0003, 0.0015, 0.91363, 0, 0, 0, 1, -0.999, 1, 0.2615, 2.35, 0.06, 2.3],
  [10, -0.0003, 0.0015, 0.91363, 0, 0, 0, 1, 0.999, 1, 0.2615, 2.35, 0.06, 2.3],
  [0, -0.00669, 0.06847, 0.77586, 0, -1, 0, 0, -1.231, 0.9996, 0.2485, 0.92, 0.46, 0.2],
  [1, 0, 0.08094, 0.33343, 0, -0.93969, -0.34202, 0, -1.2, 1.0045, 0.21744, 0.92, 0.46, 0.2],
  [2, -0.00069, -4.8269, 0.4376, 0, -1, 0, 0, -1.286, 6.5675, 0.402, 0.92, 0.46, 0.2],
  [8, -0.04764, 0.52077, 0.50812, 0.17365, 0, 0, 0.98481, 0.955, 0.847, 0.6585, 2.35, 0.06, 2.3],
  [8, -0.07421, 0.52077, -0.53492, 0, 0.98481, -0.17365, 0, -0.9305, 0.847, 0.6585, 2.35, 0.06, 2.3],
  [8, 1.76879, 0.52077, -0.53492, 0, 0.98481, -0.17365, 0, -0.9305, 0.847, 0.6585, 2.35, 0.06, 2.3],
  [8, 1.79236, 0.52077, 0.50812, 0.17365, 0, 0, 0.98481, 0.955, 0.847, 0.6585, 2.35, 0.06, 2.3],
  [8, 0, 0.6842, 0, 0, 0, 0, 1, 1, 1, 1.0285, 2.35, 0.06, 2.3],
  [8, 0, 0.6842, 0, 0, 0, 0, 1, 1, 1, 1.0285, 2.35, 0.06, 2.3],
  [12, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2.35, 0.06, 2.3],
  [6, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2.35, 0.06, 2.3],
  [12, 0, 0, 0, 0, 1, 0, 0, -1, 1, 1, 2.35, 0.06, 2.3],
  [6, 0, 0, 0, 0, 1, 0, 0, -1, 1, 1, 2.35, 0.06, 2.3],
];

/**
 * Buat geometri LEGENDARY CHEST dari TABEL BAKE (patokan NSI Viewer).
 * 2.25 x 1.75 x 2.25 block = 4.5 x 3.5 x 4.5 studs.
 */
export function makeChestGeometry(THREE, slug = NSI_CHEST_SLUG) {
  // 5 varian chest: bentuk SAMA, pembeda HANYA warna RANGKA (bab 147).
  // Warna kayu/alur/baut/kunci TIDAK diubah — hanya baris yang berwarna
  // rangka patokan (2.35, 0.06, 2.30) yang diganti ke warna varian.
  const varian = CHEST_VARIANTS[slug] || CHEST_VARIANTS[NSI_CHEST_SLUG];
  const FR = CHEST_FRAME_BAKE_COLOR;
  const pakaiWarna = varian.frame;
  const gantiRangka = (r, g, b) =>
    Math.abs(r - FR[0]) < 1e-6 && Math.abs(g - FR[1]) < 1e-6 && Math.abs(b - FR[2]) < 1e-6;

  const asli = getChestParts();
  const pos = [], uv = [], col = [];
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const P3 = new THREE.Vector3(), S3 = new THREE.Vector3();

  for (const baris of NSI_CHEST_BAKE) {
    const [idx, px, py, pz, qx, qy, qz, qw, sx, sy, sz, cr, cg, cb] = baris;
    const src = asli[idx];
    if (!src) continue;                     // idx di luar definisi → lewati
    const g = _buildFaces(THREE, src.faces, { autoFix: !!src.fix });
    if (!src.fix) _fixWindingByVolume(g);
    const GP = g.getAttribute('position'), GU = g.getAttribute('uv');

    // Transformasi part: posisi + rotasi + skala (termasuk cermin).
    q.set(qx, qy, qz, qw);
    P3.set(px, py, pz); S3.set(sx, sy, sz);
    m.compose(P3, q, S3);

    // ⚠️ CERMIN (skala negatif) MEMBALIK winding → normal jadi menghadap ke
    //    DALAM (part tampak gelap/bolong). FIX: tukar urutan 2 titik terakhir
    //    setiap segitiga supaya winding kembali menghadap KELUAR.
    const cermin = (sx * sy * sz) < 0;
    const n = GP.count;

    for (let i = 0; i + 2 < n; i += 3) {
      const urut = cermin ? [i, i + 2, i + 1] : [i, i + 1, i + 2];
      for (const k of urut) {
        v.set(GP.getX(k), GP.getY(k), GP.getZ(k)).applyMatrix4(m);
        pos.push(v.x, v.y, v.z);
        uv.push(GU ? GU.getX(k) : 0.02, GU ? GU.getY(k) : 0.02);
        if (gantiRangka(cr, cg, cb)) col.push(pakaiWarna[0], pakaiWarna[1], pakaiWarna[2], 1.0);
        else col.push(cr, cg, cb, 1.0);
      }
    }
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  out.computeVertexNormals();
  return out;
}

/**
 * Geometri NSI berdasarkan slug. Return null kalau bukan NSI.
 */
// ══════════════════════════════════════════════════════════════════════════
// ── SMALL TREASURE (bab 149) — GEOMETRI ──
// Dua bagian TERPISAH supaya bisa dianimasikan:
//   BODY (statis) : kotak dalam + alas emas + isi (gundukan emas + 3 permata)
//   LID  (bergerak): drum hitam + 2 lengkungan emas + pita krem + bintang ungu
// Engsel di tepi BELAKANG (z−), tutup TERANGKAT ke belakang saat diklik.
//
// ⚠️ PELAJARAN (bab 149, terukur): face yang di-push SATU PER SATU membuat
//    `_fixWindingByVolume` GAGAL (butuh volume untuk hitung arah normal) →
//    winding salah → part TAK TERLIHAT/bolong. Karena itu setiap bagian
//    digabung jadi SATU part sebelum difix.
// ⚠️ PELAJARAN (bab 149, terukur): `RI` (radius dalam) WAJIB < `RO` (radius
//    luar). Kalau terbalik, profil ring jadi "kawat tipis" & tak terlihat.
// ══════════════════════════════════════════════════════════════════════════
const _ST_YBOT = -0.625;          // dasar (2.5 studs → setengah 0.625)
const _ST_YSEAM = 0.055;          // garis sambung badan↔tutup
const _ST_RO = 0.75;              // radius luar lengkungan (Z) = 3 studs
// ⚠️ FIX bab 155 (analisis user #2.1: "ring terlalu tipis"): _ST_RI 0.57→0.30
//    supaya lengkung emas LEBAR/TEBAL seperti C di original, bukan kawat tipis.
//    (RO 0.75 tetap → tebal ring = 0.45, dulu cuma 0.18.)
const _ST_RI = 0.46;   // bab 156: lebih tebal lagi (lengkung C tebal)             // ⚠️ WAJIB sedikit < _ST_RD (0.50) agar ring
                                  //    MENEMPEL di luar drum (tak ada celah / tembus)
const _ST_RD = 0.50;              // radius drum (Z) → bukaan oval terlihat
const _ST_RDY = 0.545;            // tinggi kubah drum
const _ST_XR0 = 0.76, _ST_XR1 = 1.00;   // tebal lengkungan (X)
const _ST_XD = 0.93;              // ujung drum (menembus ring → satu siluet)
const _ST_SEG = 14;   // ⚠️ FIX bab 149: 8 terlalu kasar (busur bersegmen) → 14

function _stBox(x0, x1, y0, y1, z0, z1) {
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
/** Profil ½-elips (z −r..+r lewat puncak) mulai dari yBase. */
function _stProfil(ry, rz, yBase, seg) {
  const P = [];
  for (let i = 0; i <= seg; i++) {
    const t = Math.PI * i / seg;
    P.push([yBase + ry * Math.sin(t), -rz * Math.cos(t)]);
  }
  return P;
}
/** Ring lengkungan — SATU part (semua face digabung) agar winding bisa difix. */
function _stRing(yBase, ryO, rzO, ryI, rzI, x0, x1, seg, tag) {
  const o = _stProfil(ryO, rzO, yBase, seg);
  const i = _stProfil(ryI, rzI, yBase, seg);
  const f = [];
  for (let k = 0; k < seg; k++) {
    f.push([[x0, o[k][0], o[k][1]], [x1, o[k][0], o[k][1]], [x1, o[k + 1][0], o[k + 1][1]], [x0, o[k + 1][0], o[k + 1][1]]]);
    f.push([[x0, i[k][0], i[k][1]], [x0, i[k + 1][0], i[k + 1][1]], [x1, i[k + 1][0], i[k + 1][1]], [x1, i[k][0], i[k][1]]]);
    f.push([[x0, o[k][0], o[k][1]], [x0, i[k][0], i[k][1]], [x0, i[k + 1][0], i[k + 1][1]], [x0, o[k + 1][0], o[k + 1][1]]]);
    f.push([[x1, o[k][0], o[k][1]], [x1, o[k + 1][0], o[k + 1][1]], [x1, i[k + 1][0], i[k + 1][1]], [x1, i[k][0], i[k][1]]]);
  }
  return { faces: f, tag: tag || 'gold' };
}
/** Bintang: 4 ujung DIAGONAL (X) + lekuk + pusat piramida (4 nada ungu). */
function _stStarX(a, n, z0, z1, nada) {
  const O = [[a, a], [0, n], [-a, a], [-n, 0], [-a, -a], [0, -n], [a, -a], [n, 0]];
  const f = [];
  for (let i = 0; i < O.length; i++) {
    const p0 = O[i], p1 = O[(i + 1) % O.length];
    f.push({ faces: [[[p0[0], p0[1], z0], [p1[0], p1[1], z0], [0, 0, z1]]], tag: nada[i % nada.length] });
    f.push({ faces: [[[0, 0, z0], [p0[0], p0[1], z0], [p1[0], p1[1], z0]]], tag: nada[(i + 2) % nada.length] });
  }
  return f;
}
/** PIPI PENUTUP (cheek) — prism ½-elips SOLID, mengisi penuh bukaan lengkungan.
 *  ⚠️ FIX bab 151: tanpa ini, dari SAMPING terlihat rongga (bolong) karena
 *     drum (rz 0.50) lebih kecil dari bukaan lengkungan (rz 0.57) → celah cincin.
 *  Bentuk: ½-elips (ry, rz) dgn alas di yBase, dipadatkan sepanjang x0..x1. */
function _stCheek(yBase, ry, rz, x0, x1, seg, tag) {
  const o = _stProfil(ry, rz, yBase, seg);
  const f = [];
  for (let k = 0; k < seg; k++) {
    const [ya, za] = o[k], [yb, zb] = o[k + 1];
    f.push([[x0, ya, za], [x1, ya, za], [x1, yb, zb], [x0, yb, zb]]);       // rim lengkung
    f.push([[x1, yBase, 0], [x1, ya, za], [x1, yb, zb]]);                   // tutup muka (+x)
    f.push([[x0, yBase, 0], [x0, yb, zb], [x0, ya, za]]);                   // tutup belakang (-x)
  }
  return { faces: f, tag: tag || 'black' };
}
/** Palet warna Small Treasure (LINEAR — sudah dikalibrasi ke gambar user). */
export const ST_WARNA = {
  gold:  [1.0558, 0.5825, 0.0035, 1.0],
  black: [0.0288, 0.0288, 0.0329, 1.0],
  bone:  [1.50, 1.60, 1.20, 1.0],
  ungu1: [1.70, 0.78, 2.35, 1.0],
  ungu2: [1.18, 0.46, 1.80, 1.0],
  ungu3: [0.66, 0.22, 1.10, 1.0],
  ungu4: [2.25, 1.45, 2.70, 1.0],
  pile:  [1.6699, 0.6664, 0.0242, 1.0],
  cyan:  [0.05, 2.45, 3.30, 1.0],
  red:   [2.45, 0.10, 0.10, 1.0],
  green: [0.06, 2.20, 0.10, 1.0],
};
const _ST_XW = 0.76;   // ujung kotak dalam

/** BADAN (statis): alas emas + dinding dalam + kaki trapesium + papan depan + isi. */
export function getSmallTreasureBodyParts() {
  const p = [];
  // ⚠️ FIX bab 164b (koreksi user: "pendekin lempengan yang mengelilingi,
  //    sedikit lebih tinggi jadi kayak gak kelihatan gundukannya").
  //    Lempengan pengeliling DIPENDEKKAN 0.20 → 0.10 supaya gundukan emas
  //    terlihat jelas dari depan, tapi tetap mengelilingi (4 sisi).
  const YT = 0.10, ZW = 0.44;
  // ⚠️ FIX bab 151: ALAS emas JANGAN menonjol keluar melewati dinding/kaki.
  //    Sebelumnya ±0.80 / z ±0.66 (dinding cuma 0.76 / kaki z 0.62)
  //    → dari BAWAH terlihat 'lis emas menonjol' & bertumpuk dgn batang hitam.
  //    Sekarang pas di dalam kaki (x ±0.755, z ±0.605) → rata (flush).
  p.push({ faces: _stBox(-0.755, 0.755, _ST_YBOT, _ST_YBOT + 0.06, -0.545, 0.545), tag: 'gold' });
  // ⚠️ FIX bab 151: rok mulai _ST_YBOT+0.066 (bukan +0.06) → beri celah 0.006 dari
  //    alas supaya TIDAK tumpang-tindih dgn pelat alas (keluhan: "2 garis hitam").
  // ⚠️ FIX bab 164 (keluhan user: "gundukan dikelilingin 3 lempengan hitam,
  //    harusnya 4, kurang satu di DEPAN"). TERUKUR dulu: rok depan hanya
  //    y -0.559..-0.465 (0.094) padahal 3 dinding lain y -0.565..0.200 (0.765)
  //    → gundukan TERBUKA di sisi depan. Sekarang dinding depan dinaikkan
  //    sampai bibir (YT) → 4 lempengan hitam MENGELILINGI gundukan penuh.
  p.push({ faces: _stBox(-_ST_XW, _ST_XW, _ST_YBOT + 0.066, YT, ZW, ZW + 0.07), tag: 'black' });
  p.push({ faces: _stBox(-_ST_XW, _ST_XW, _ST_YBOT + 0.066, YT, -ZW - 0.07, -ZW), tag: 'black' });
  p.push({ faces: _stBox(_ST_XW - 0.07, _ST_XW, _ST_YBOT + 0.06, YT, -ZW, ZW), tag: 'black' });
  p.push({ faces: _stBox(-_ST_XW, -_ST_XW + 0.07, _ST_YBOT + 0.06, YT, -ZW, ZW), tag: 'black' });
  // KAKI trapesium emas (menyempit ke alas)
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -_ST_XR1 : _ST_XR0, x1 = sx < 0 ? -_ST_XR0 : _ST_XR1;
    const b0 = [x0 + 0.02, _ST_YBOT, -0.34], b1 = [x1 - 0.02, _ST_YBOT, -0.34], b2 = [x1 - 0.02, _ST_YBOT, 0.34], b3 = [x0 + 0.02, _ST_YBOT, 0.34];
    // ⚠️ FIX bab 155c (terukur): z atas 0.62 → 0.545. Dinding hitam z max 0.51,
    //    jadi tonjolan kini hanya 0.035 (dulu 0.11 → vision: "trim emas mencuat").
    // ⚠️ FIX bab 161b (keluhan user "ketimpang arah kiri dan kanan"): dulu z belakang
    //    HARDCODE -0.512 tapi z depan ZW+0.075=0.515 → TIMPANG 0.003 di sumbu Z
    //    (dari samping tampak miring tidak seimbang). Sekarang simetris ±ZW75.
    const ZW75 = ZW + 0.075;
    const t0 = [x0, -0.30, -ZW75], t1 = [x1, -0.30, -ZW75], t2 = [x1, -0.30, ZW75], t3 = [x0, -0.30, ZW75];
    // ⚠️ FIX bab 150: 6 face KAKI WAJIB digabung jadi SATU part.
    //    Kalau per-face, _fixWindingByVolume TIDAK bisa bekerja (butuh
    //    volume) → wajah menghadap ke DALAM → BOLONG (side=FrontSide).
    p.push({ faces: [
      [b0, b1, b2, b3], [t0, t1, t2, t3], [b3, b2, t2, t3],
      [b0, b1, t1, t0], [b0, b3, t3, t0], [b1, b2, t2, t1],
    ], tag: 'gold' });
  }
  // PAPAN DEPAN emas (terlihat saat terbuka)
  // ⚠️ FIX bab 155 (analisis user #6.3: "papan emas depan terlalu tebal") →
  //    papan TUNGGAL tipis. FIX #6.1: tambah BLOK EMAS bertepi miring di
  //    sudut depan kiri & kanan (pengunci dinding depan).
    // ⚠️ FIX bab 155c: papan depan z 0.12 → 0.545 (menempel di kaki, tidak mencuat).
  p.push({ faces: _stBox(-0.72, 0.72, _ST_YBOT + 0.16, _ST_YBOT + 0.30, ZW, ZW + 0.075), tag: 'gold' });
  for (const sx of [-1, 1]) {
    const xa = sx < 0 ? -0.755 : 0.685, xb = sx < 0 ? -0.685 : 0.755;
    p.push({ faces: [
      [[xa, _ST_YBOT + 0.10, ZW], [xb, _ST_YBOT + 0.16, ZW], [xb, _ST_YBOT + 0.36, ZW + 0.07], [xa, _ST_YBOT + 0.30, ZW + 0.07]],
      [[xa, _ST_YBOT + 0.10, ZW + 0.075], [xa, _ST_YBOT + 0.30, ZW + 0.075], [xb, _ST_YBOT + 0.36, ZW + 0.075], [xb, _ST_YBOT + 0.16, ZW + 0.075]],
      [[xa, _ST_YBOT + 0.10, ZW + 0.07], [xa, _ST_YBOT + 0.30, ZW + 0.07], [xa, _ST_YBOT + 0.30, ZW + 0.075], [xa, _ST_YBOT + 0.10, ZW + 0.075]],
      [[xb, _ST_YBOT + 0.16, ZW], [xb, _ST_YBOT + 0.16, ZW + 0.075], [xb, _ST_YBOT + 0.36, ZW + 0.075], [xb, _ST_YBOT + 0.36, ZW + 0.07]],
      [[xa, _ST_YBOT + 0.10, ZW], [xb, _ST_YBOT + 0.16, ZW], [xb, _ST_YBOT + 0.16, ZW + 0.075], [xa, _ST_YBOT + 0.10, ZW + 0.075]],
      [[xa, _ST_YBOT + 0.30, ZW + 0.07], [xa, _ST_YBOT + 0.30, ZW + 0.075], [xb, _ST_YBOT + 0.36, ZW + 0.075], [xb, _ST_YBOT + 0.36, ZW + 0.07]],
    ], tag: 'gold' });
  }
  // ISI: gundukan emas 3 tingkat + 3 permata
  // ⚠️ FIX bab 154 (keluhan user "versi terbuka KURANG"): isi DULU tenggelam
  //    (puncak y=-0.205 vs bibir y=+0.200 → selisih -0.405). Di gambar user
  //    isi MELUAP MENONJOL keluar bibir. Sekarang dinaikkan _ST_YISI=+0.10.
  // ⚠️ FIX bab 155 (analisis user #7.1/#7.2: "gundukan piramida bertangga,
  //    hanya di tengah, lantai kiri-kanan kosong") → sekarang DUA GUNDUKAN
  //    MEMBULAT yang MENGISI SELURUH LANTAI (x ±0.72, z ±0.42), masing-masing
  //    4 tingkat menyempit (≈ kubah), bukan piramida bertangga tajam.
  // ⚠️ FIX bab 155d (terukur): permata DULU TERBENAM di dalam gundukan
  //    (gy 0.16 vs puncak dome 0.28) → hanya merah yang terlihat.
  //    Sekarang: alas tebal + 2 dome TERPISAH + permata DUDUK di puncak.
  // ── FIX bab 163 (permintaan user, verbatim: "gundukan itu skala aja ke bawah
  //    jadi nutup ruang kosong jadi tidak ada ruang kosong di peti itu ...
  //    bukan diturunkan tapi DIPANJANG ke bawah jadi di bawah tidak ada
  //    ruang kosong") ──
  //    TERUKUR dulu: lantai dalam peti y=-0.565, gundukan mulai y=-0.080
  //    → ADA RUANG KOSONG 0.485 di bawah gundukan. Sekarang gundukan
  //    DIPANJANG ke bawah sampai menyentuh lantai (-0.565) sehingga
  //    ruang dalam peti TERISI PENUH (tidak terlihat bolong dari samping).
  const YFLOOR = _ST_YBOT + 0.06;        // = -0.565 (dasar dalam peti)
  const YI = _ST_YBOT + 0.545;           // = -0.08 (puncak alas isi)
  // alas isi: lempeng tebal menutupi SELURUH lantai & DIPANJANG ke bawah
  // ⚠️ FIX bab 165 (keluhan user: "masih kurang kebawain dikit 4 lempengannya"):
  //    TERUKUR: gundukan z ±0.42, dinding depan/belakang mulai z ±0.440
  //    → CELAH 0.020 di DEPAN & BELAKANG (kurang membungkus).
  //    Sekarang gundukan z ±0.455 → MELEWATI lempengan (overlap 0.015)
  //    sehingga 4 lempengan benar-benar MEMBUNGKUS penuh.
  p.push({ faces: _stBox(-0.72, 0.72, YFLOOR, YI + 0.16, -0.455, 0.455), tag: 'pile' });
  // DUA gundukan TERPISAH (celah di tengah) → jelas 2 puncak, bukan 1 loaf
  // ⚠️ FIX bab 155e: puncak KIRI 0.24 & KANAN 0.20 terlalu mirip → terlihat 1 loaf.
  //    Sekarang celah tengah LEBIH lebar + tinggi berbeda jelas (0.28 vs 0.16).
  p.push(_stCheek(YI + 0.16, 0.28, 0.455, -0.72, -0.10, 12, 'pile'));  // KIRI (tinggi)
  p.push(_stCheek(YI + 0.16, 0.16, 0.44,  0.12,  0.72, 12, 'pile'));  // KANAN (rendah)
  // PERMATA duduk SETENGAH TERBENAM di puncak (analisis #8.1: cyan kiri,
  //   hijau kanan, merah tengah-depan) — kecil (0.19) & tidak menembus drum
  //   (puncak tertinggi 0.41 < kulit drum 0.60 di z≈0).
  const G = 0.19;
  p.push({ faces: _stBox(-0.48, -0.48 + G, 0.22, 0.22 + G, -0.10, -0.10 + G), tag: 'cyan' });
  p.push({ faces: _stBox(0.29, 0.29 + G, 0.18, 0.18 + G, -0.10, -0.10 + G), tag: 'green' });
  p.push({ faces: _stBox(-0.095, -0.095 + G, 0.08, 0.08 + G, 0.12, 0.12 + G), tag: 'red' });
  return p;
}

/** TUTUP (bergerak): drum hitam + rok + 2 lengkungan emas + pita krem + bintang. */
export function getSmallTreasureLidParts() {
  const p = [];
  // DRUM hitam ½-silinder yang MENUTUP PENUH
  // ⚠️ FIX bab 150: SEMUA face DRUM digabung jadi SATU part (volume tertutup)
  //    supaya _fixWindingByVolume bisa membetulkan arah normal. Kalau tiap
  //    strip jadi part sendiri → winding salah → drum BOLONG.
  // ⚠️ bab 156 (analisis user #1): dulu DRUM PADAT (setengah cakram penuh) →
  //    saat dibuka tampak gumpalan hitam padat & "papan datar". Sekarang
  //    BAND (cincin separuh) = permukaan LUAR + DALAM + tutup ujung →
  //    BERONGA & cekung di dalam, persis original (dikonfirmasi 2 gambar).
  // ⚠️ FIX bab 161 (keluhan user "dari pinggir tekstur DOUBLE ketimpang kiri-kanan"):
  //    Dulu BAND, PIPI, dan RING semuanya bermuka di bidang x=±1.000 yang SAMA
  //    → 3 lapis berdempet = Z-FIGHTING = tampak tekstur double. Sekarang dibuat
  //    BERTINGKAT: RING emas = paling LUAR (±1.000, penentu lebar 4 studs),
  //    BAND di dalamnya (±0.98), PIPI paling dalam (±0.97). Tidak ada yang sekbidang.
  p.push(_stRing(_ST_YSEAM, _ST_RDY, _ST_RD, _ST_YSEAM + 0.045, _ST_RD - 0.12, -0.98, 0.98, _ST_SEG, 'black')); // ⚠️ FIX bab 157b: y1 HARUS > y0 (dulu y0=0.505 > y1=0.475 = CINCIN TERBALIK → sisi tutup tampak "terowongan bolong" (dilaporkan vision 2026-10-11))
  // ⚠️ FIX bab 157c: PIPI PENUTUP UJUNG (end-cap) — vision 2× lapor "sisi tutup
  //    BOLONG seperti terowongan" (2026-10-11). Cangkang band hanya punya muka
  //    luar+dalam; ujung x=±XR1 masih TERBUKA. Tambah 2 pelat datar penutup ujung
  //    (setengah-lingkaran) supaya sisi peti PADAT & tidak tembus ke rongga.
  //    Pakai _stCheek (prism ½-elips SOLID) yang sudah terbukti mengisi penuh
  //    bukaan lengkungan. Dua pipi: dalam (x 0.72..1.00) & luar tipis.
  p.push(_stCheek(_ST_YSEAM, _ST_RD - 0.02, _ST_RD - 0.05, -0.97, 0.97, _ST_SEG, 'black'));  // bab 161: ±0.97 (di dalam band)
  // RING emas (ikut tutup)
  p.push(_stRing(-0.30, 0.925, _ST_RO, 0.74, _ST_RI, -_ST_XR1, -0.72, _ST_SEG));
  p.push(_stRing(-0.30, 0.925, _ST_RO, 0.74, _ST_RI, 0.72, _ST_XR1, _ST_SEG));
  // ⚠️ bab 156: PIPI dihapus — cangkang band kini membentang penuh x ±1.00
  //    sehingga bukaan lengkungan emas terisi oleh muka ujung cangkang.
  // ⚠️ FIX bab 155b: ROK BELAKANG JUGA DIHAPUS. Saat tutup terangkat, rok yang
  //    turun ke bawah (y −0.625..0.075) ikut terangkat & tampak sebagai "papan
  //    hitam menjorok janggal" (dikonfirmasi vision 2×). Tutup = drum+ring+pita+
  //    bintang SAJA. Drum (mulai y=_ST_YSEAM) sudah cukup menutup dari atas.
  // PITA krem menerus + ujung melebar (bentuk tulang)
  // ⚠️ FIX (bab 149): batang & ujung TIDAK BOLEH menembus keluar melewati
  //    rangka emas (ring luar x = ±1.00). Ujung dibatasi ±0.955.
  // ⚠️ FIX bab 155 (analisis user #3): pita DILEBARKAN (y ±0.055→±0.085) dan
  //    bentuk TULANG (tengah sempit, ujung melebar MIRING — bukan blok).
  //    Blok emas kecil di ujung pita DIHAPUS (tidak ada di original).
  for (const sz of [1, -1]) {
    const z0 = sz > 0 ? 0.505 : -0.575, z1 = sz > 0 ? 0.575 : -0.505;
    // batang tengah (sempit)
    p.push({ faces: _stBox(-0.60, 0.60, _ST_YSEAM - 0.055, _ST_YSEAM + 0.075, z0, z1), tag: 'bone' });
    // ujung melebar (trapesium miring)
    for (const sx of [-1, 1]) {
      const xa = sx < 0 ? -0.93 : 0.60, xb = sx < 0 ? -0.60 : 0.93;
      p.push({ faces: [
        [[xa, _ST_YSEAM - 0.085, z0], [xb, _ST_YSEAM - 0.055, z0], [xb, _ST_YSEAM + 0.075, z0], [xa, _ST_YSEAM + 0.105, z0]],
        [[xa, _ST_YSEAM - 0.085, z1], [xa, _ST_YSEAM + 0.105, z1], [xb, _ST_YSEAM + 0.075, z1], [xb, _ST_YSEAM - 0.055, z1]],
        [[xa, _ST_YSEAM - 0.085, z0], [xa, _ST_YSEAM + 0.105, z0], [xa, _ST_YSEAM + 0.105, z1], [xa, _ST_YSEAM - 0.085, z1]],
        [[xb, _ST_YSEAM - 0.055, z0], [xb, _ST_YSEAM - 0.055, z1], [xb, _ST_YSEAM + 0.075, z1], [xb, _ST_YSEAM + 0.075, z0]],
        [[xa, _ST_YSEAM - 0.085, z0], [xb, _ST_YSEAM - 0.055, z0], [xb, _ST_YSEAM - 0.055, z1], [xa, _ST_YSEAM - 0.085, z1]],
        [[xa, _ST_YSEAM + 0.105, z0], [xa, _ST_YSEAM + 0.105, z1], [xb, _ST_YSEAM + 0.075, z1], [xb, _ST_YSEAM + 0.075, z0]],
      ], tag: 'bone' });
    }
  }
  // BINTANG ungu (X + pusat piramida) di muka DEPAN
  // ⚠️ FIX (bab 149): bintang MENEMPEL di muka pita (z 0.655..0.735), tidak mengambang.
  // ⚠️ FIX bab 155 (analisis user #4.1: "bintang terlalu kecil"): a 0.34→0.46,
  //    n 0.10→0.135; z 0.655..0.735 → 0.655..0.79 (pusat piramida lebih menonjol).
  _stStarX(0.50, 0.15, 0.575, 0.68, ['ungu1', 'ungu2', 'ungu3', 'ungu4']).forEach((q) => p.push(q));
  return p;
}

/** Volume bertanda (signed) sebuah geometri — untuk cek arah winding.
 *  ⚠️ bab 151 (terukur): part TUTUP ber-volume NEGATIF → wajah menghadap ke
 *     DALAM → dgn material FrontSide (jalur app) TAK TERLIHAT = "bolong dari
 *     samping". _fixWindingByVolume TIDAK cukup utk drum/ring/pipi. */
function _stSignedVolume(g) {
  const P = g.getAttribute('position');
  let V = 0;
  for (let i = 0; i < P.count; i += 3) {
    const ax = P.getX(i), ay = P.getY(i), az = P.getZ(i);
    const bx = P.getX(i + 1), by = P.getY(i + 1), bz = P.getZ(i + 1);
    const cx = P.getX(i + 2), cy = P.getY(i + 2), cz = P.getZ(i + 2);
    V += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
  }
  return V;
}
/** Balik arah winding (tukar 2 titik terakhir tiap segitiga) — untuk part
 *  yg sudah dikonfirmasi punya volume negatif. */
function _stFlipWinding(g) {
  const P = g.getAttribute('position');
  for (let i = 0; i < P.count; i += 3) {
    const x = P.getX(i + 1), y = P.getY(i + 1), z = P.getZ(i + 1);
    P.setXYZ(i + 1, P.getX(i + 2), P.getY(i + 2), P.getZ(i + 2));
    P.setXYZ(i + 2, x, y, z);
  }
  P.needsUpdate = true;
  g.computeVertexNormals();
}
/** Paksa SEMUA segitiga menghadap KELUAR dari centroid part.
 *  ⚠️ FIX bab 157 — jangan pakai _fixWindingByVolume utk part terbuka
 *  (drum/ring/pipi/pita/gundukan): metode volume-thd-titik-asal salah arah
 *  kalau part tidak melingkupi (0,0,0). Metode centroid selalu benar.
 *  Return: {tri, dibalik} utk verifikasi terukur. */
function _stFaceOutward(g) {
  const P = g.getAttribute('position');
  const n = P.count;
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < n; i++) { cx += P.getX(i); cy += P.getY(i); cz += P.getZ(i); }
  cx /= n; cy /= n; cz /= n;
  let dibalik = 0;
  for (let i = 0; i < n; i += 3) {
    const ax = P.getX(i), ay = P.getY(i), az = P.getZ(i);
    const bx = P.getX(i + 1), by = P.getY(i + 1), bz = P.getZ(i + 1);
    const dx = P.getX(i + 2), dy = P.getY(i + 2), dz = P.getZ(i + 2);
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = dx - ax, vy = dy - ay, vz = dz - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const mx = (ax + bx + dx) / 3 - cx, my = (ay + by + dy) / 3 - cy, mz = (az + bz + dz) / 3 - cz;
    if (nx * mx + ny * my + nz * mz < 0) {
      // tukar titik 1 & 2 → balik arah
      P.setXYZ(i + 1, dx, dy, dz);
      P.setXYZ(i + 2, bx, by, bz);
      dibalik++;
    }
  }
  P.needsUpdate = true;
  g.computeVertexNormals();
  return { tri: n / 3, dibalik };
}

/** Rakit daftar part → BufferGeometry (posisi + uv + warna vertex). */
function _stBuild(THREE, parts) {
  const pos = [], uv = [], col = [];
  parts.forEach((pt) => {
    const g = _buildFaces(THREE, pt.faces, { autoFix: false });
    // ══ FIX bab 157 (2026-10-11, keluhan user "bug tekstur hilang masih ada
    //    buanyak"): AKAR BOLONG = WINDING.
    //    _fixWindingByVolume mengukur arah normal thd TITIK ASAL (0,0,0).
    //    Untuk part yang TIDAK melingkupi titik asal (drum tutup, ring,
    //    pita, pipi, gundukan) metode itu SALAH → hasilnya terbalik →
    //    dengan FrontSide (jalur app) wajah menghadap DALAM = TIDAK TERLIHAT
    //    = "tekstur hilang / bolong".
    //    TERUKUR di app: BADAN 27% segitiga menghadap dalam, TUTUP 54%!
    //    FIX: pakai arah normal thd CENTROID part sendiri (selalu benar
    //    untuk bentuk cembung maupun terbuka), JANGAN pakai _fixWindingByVolume.
    _stFaceOutward(g);
    const P = g.getAttribute('position'), U = g.getAttribute('uv');
    const c = ST_WARNA[pt.tag] || ST_WARNA.black;
    for (let i = 0; i < P.count; i++) {
      pos.push(P.getX(i), P.getY(i), P.getZ(i));
      uv.push(U.getX(i), U.getY(i));
      col.push(c[0], c[1], c[2], c[3]);
    }
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  out.computeVertexNormals();
  return out;
}

/** Geometri BADAN Small Treasure (statis). */
/**
 * ⚠️ ALIAS untuk NSI WORKBENCH (bab 160, 2026-10-11).
 * AKAR: workbench mencari getter dengan konversi otomatis
 *   'get' + ITEM[0].toUpperCase() + ITEM.slice(1) + 'Parts'
 *   → untuk 'small_treasure' jadi `getSmall_treasureParts` (SALAH, ada underscore).
 * Karena itu daftar part kosong → workbench hanya menampilkan preview 3D.
 * SOLUSI: sediakan alias ini DI SINI (blockShapes.js) supaya file workbench
 * TIDAK PERLU disentuh sama sekali (workbench = teritori user).
 */
export function getSmall_treasureParts() {
  return [...getSmallTreasureBodyParts(), ...getSmallTreasureLidParts()];
}

export function makeSmallTreasureBodyGeometry(THREE) {
  return _stBuild(THREE, getSmallTreasureBodyParts());
}
/** Geometri TUTUP Small Treasure (bergerak saat dibuka). */
export function makeSmallTreasureLidGeometry(THREE) {
  return _stBuild(THREE, getSmallTreasureLidParts());
}
/** Geometri utama (yang dipakai jalur NSI generik = BADAN). */
export function makeSmallTreasureGeometry(THREE) {
  return makeSmallTreasureBodyGeometry(THREE);
}
/**
 * Geometri PENUH = BADAN + TUTUP (satu geometri gabungan).
 * ⚠️ Dipakai HANYA untuk PREVIEW/GHOST + IKON — bukan untuk block yang
 *    ditaruh (block asli butuh tutup sebagai ANAK agar bisa beranimasi).
 *    AKAR BUG (2026-10-11, laporan user "ghost cuma kelihatan bawahnya"):
 *    ghost memakai makeNsiGeometry() yang mengembalikan BADAN saja →
 *    tutup tidak muncul di preview.
 */
export function makeSmallTreasureFullGeometry(THREE) {
  return _stBuild(THREE, [...getSmallTreasureBodyParts(), ...getSmallTreasureLidParts()]);
}

export function makeNsiGeometry(THREE, slug) {
  if (slug === NSI_WEDGE_SLUG) return makeWedgeGeometry(THREE);
  if (slug === NSI_RAMP_SLUG) return makeRampGeometry(THREE);
  if (slug === NSI_TRUSS_SLUG) return makeTrussGeometry(THREE);
  if (slug === NSI_SEAT_SLUG) return makeSeatGeometry(THREE);
  if (slug === NSI_STEP_SLUG) return makeStepGeometry(THREE);
  if (slug === NSI_MAST_SLUG) return makeMastGeometry(THREE);
  if (slug === NSI_HELM_SLUG) return makeHelmGeometry(THREE);
  if (slug === NSI_WINDOW_SLUG) return makeWindowGeometry(THREE);
  if (slug === NSI_DOOR_SLUG) return makeDoorGeometry(THREE);
  if (slug === NSI_HATCH_SLUG) return makeHatchGeometry(THREE);
  // ⚠️ FIX bab 160 (2026-10-11, laporan user "loh itu tutupnya mana woi"):
  // Workbench & preview memakai makeNsiGeometry() → WAJIB geometri PENUH
  // (badan + tutup). Dulu = BADAN saja → tutup tidak pernah muncul.
  // ⚠️ Block yang DITARUH di app TIDAK memakai jalur ini (lihat place path)
  //    karena di sana tutup ditambahkan sebagai ANAK mesh (animasi buka).
  if (slug === NSI_ST_SLUG) return makeSmallTreasureFullGeometry(THREE);
  if (NSI_CHEST_SLUGS.indexOf(slug) >= 0) return makeChestGeometry(THREE, slug);
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
