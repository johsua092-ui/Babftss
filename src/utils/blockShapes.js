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

// ══ bab 195: mesh Pine Tree dari pinetree.obj (export Roblox Studio user) ══
import { PT_MESH_VERTS, PT_MESH_GROUPS } from './pineTreeMesh.js';

// objek gabungan supaya blok desain di bawah tetap ringkas dibaca
const PT_MESH = { verts: PT_MESH_VERTS, groups: PT_MESH_GROUPS };

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

// ══════════════════════════════════════════════════════════════════════════
// ── NSI LEVEL 2 #10: MEDIUM TREASURE (bab 169) ──
// PERMINTAAN USER (2026-10-11, verbatim): *"ada 2 item yang sama kayak small
// chest kerangkanya itu sama, hanya saja ada yang pakai mahkota di chestnya
// dan ada yang pakai sayap di chestnya ... 2 sisanya adalah Medium treasure
// dan Big treasure ... yang membedakan hanya aksesorisnya aja"*.
//   Medium Treasure : panjang 4 studs, lebar 3 studs, TINGGI 4 studs.
// → 4 x 4 x 3 studs = [2, 2, 1.5] block.
// RANGKA 100% IDENTIK Small Treasure; yang beda HANYA:
//   (a) MAHKOTA emas pucat di puncak tutup,
//   (b) bintang ungu diganti PERMATA CYAN + 2 TARING tulang di muka depan tutup.
// Karena total tinggi naik 2.5 → 4 studs, badan+tutup DIGESER TURUN
// (MT_YOFF) supaya bbox tetap TERPUSAT di origin (posY = setengah tinggi).
// ⚠️ Dimensi WAJIB diukur, bukan dikira (aturan kontrak).
export const NSI_MT_SLUG = 'medium_treasure';
export const NSI_MT_NAME = 'Medium Treasure';
export const NSI_MT_SIZE = [2, 2, 1.5];           // 4 x 4 x 3 studs
// ── NSI LEVEL 2 #11: BIG TREASURE (peti BERSAYAP) — bab 178 ──
//    Rangka 100% IDENTIK Small Treasure. Pembeda HANYA: 2 SAYAP PUTIH
//    (menempel di TUTUP → ikut terangkat) + emblem X MERAH di pita depan
//    (menggantikan bintang ungu).
//    Dimensi: panjang 10.5 studs (= 5.25 block, termasuk bentang sayap)
//             lebar 3 studs (= 1.5 block) · tinggi 3.7 studs (= 1.85 block)
export const NSI_BT_SLUG = 'big_treasure';
export const NSI_BT_NAME = 'Big Treasure';
export const NSI_BT_SIZE = [5.25, 1.85, 1.5];     // 10.5 x 3.7 x 3 studs
// ══ NSI LEVEL 2 #11: PINE TREE (bab 180) ══
// Referensi: Roblox "Pine Tree - Build a boat" (asset 6574704298).
// Ukuran MAKS user: 15 x 15 x 15 studs. Proporsi referensi H:W = 1.464
//   (terukur dari thumbnail: bbox 166x243 px) → tinggi 7.5 block (15 studs),
//   lebar 5.125 block (10.25 studs). Masih DI BAWAH batas maks.
export const NSI_PT_SLUG = 'pine_tree';
// bab 196 (permintaan user, FINAL): maksimal panjang/lebar/tinggi = 15 studs SEMUA.
// Terukur dari mesh pinetree.obj yang sudah diskalakan uniform:
//   13.5079 x 15.0000 x 13.0018 studs -> tidak ada yang lewat 15. 
export const NSI_PT_SIZE = [6.7539, 7.5, 6.5009];  // 13.51 x 15.00 x 13.00 studs
// ══ NSI LEVEL 2 #12: TROPHY 1st/2nd/3rd (bab 197, rombak bab 198) ══
// Ukuran WAJIB user: panjang 3 studs (X) · lebar 2 studs (Z) · tinggi 4 (Y).
export const NSI_TR_SLUGS = ['trophy_1st', 'trophy_2nd', 'trophy_3rd'];
export const NSI_TR_SIZE = [1.5, 2.0, 1.0];       // 3 x 4 x 2 studs
export const MT_YOFF = -0.375;                    // geser badan+tutup → bbox terpusat
export const MT_HINGE_Y = ST_HINGE_Y + MT_YOFF;   // engsel (lokal Medium)
export const MT_HINGE_Z = ST_HINGE_Z;             // tepi BELAKANG
export const MT_OPEN_ANGLE = ST_OPEN_ANGLE;       // ≈118°
// ⚠️ bab 178 (Big Treasure): geser supaya bbox (bawah peti .. puncak sayap)
//    TERPUSAT di origin. Tinggi total 3.7 studs: peti 2.5 + sayap naik 1.2.
export const BT_YOFF = -0.3001;   // bab 178f: puncak sayap dinaikkan 0.052 -> geser pusat
export const BT_HINGE_Y = ST_HINGE_Y + BT_YOFF;   // engsel (lokal Big)
export const BT_HINGE_Z = ST_HINGE_Z;
export const BT_OPEN_ANGLE = ST_OPEN_ANGLE;       // ≈118°

// ══ NSI LEVEL 2 #13: TORCH (bab 205) ══
// Syarat MUTLAK user: gagang 0.8 x 0.8 studs · penampang 1.5 x 1.5 studs ·
// tinggi 6 studs TERMASUK bara · menghasilkan CAHAYA · bara BERANIMASI.
// 1.5 studs = 0.75 block · 6 studs = 3 block. TERVERIFIKASI lewat
// _cek_torch_geo.cjs: bbox 0.7500 x 3.0000 x 0.7500 block, simetris origin.
export const NSI_TC_SLUG = 'torch';
export const NSI_TC_NAME = 'Torch';
export const NSI_TC_SIZE = [0.75, 3.0, 0.75];

// ══ NSI LEVEL 2 #14: LAMP (bab 206) ══
// Syarat MUTLAK user: panjang 2 studs · lebar 2 studs · tinggi 3.5 studs
// + memancarkan CAHAYA seperti Torch.
// 2 studs = 1.0 block · 3.5 studs = 1.75 block.
export const NSI_LP_SLUG = 'lamp';
export const NSI_LP_NAME = 'Lamp';
export const NSI_LP_SIZE = [1.0, 1.75, 1.0];

// ── bab 208: CANDLE — NSI L2 yang MENGHASILKAN CAHAYA ──
export const NSI_CD_SLUG = 'candle';
export const NSI_CD_NAME = 'Candle';
export const NSI_CD_SIZE = [1.0, 1.75, 1.0];   // block = 2 x 3.5 x 2 studs

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
  [NSI_LP_SLUG]: [1.0, 1.75, 1.0],
  [NSI_CD_SLUG]: [1.0, 1.75, 1.0],
};
// 5 chest (ungu/cyan/merah/kuning/hijau) — ukuran IDENTIK (bentuk sama).
NSI_CHEST_SLUGS.forEach((s) => { NSI_SIZES[s] = [2.25, 1.75, 2.25]; });
// Small Treasure: 4 x 2.5 x 3 studs (bab 149).
NSI_SIZES[NSI_ST_SLUG] = NSI_ST_SIZE.slice();
// Medium Treasure: 4 x 4 x 3 studs (bab 169).
NSI_SIZES[NSI_MT_SLUG] = NSI_MT_SIZE.slice();
NSI_SIZES[NSI_BT_SLUG] = NSI_BT_SIZE.slice();
NSI_SIZES[NSI_PT_SLUG] = NSI_PT_SIZE.slice();
NSI_TR_SLUGS.forEach((s) => { NSI_SIZES[s] = NSI_TR_SIZE.slice(); });
// bab 205: Torch — 1.5 x 6 x 1.5 studs (0.75 x 3.0 x 0.75 block)
NSI_SIZES[NSI_TC_SLUG] = NSI_TC_SIZE.slice();
// bab 206: Lamp — 2 x 3.5 x 2 studs (1.0 x 1.75 x 1.0 block)
NSI_SIZES[NSI_LP_SLUG] = NSI_LP_SIZE.slice();
// Rod: semua varian ukurannya sama (1 x 3 x 1 studs).
NSI_ROD_SLUGS.forEach((s) => { NSI_SIZES[s] = NSI_ROD_SIZE.slice(); });

/** Ukuran item (block) berdasarkan slug. Non-NSI = [1,1,1]. */
export function getNsiSize(slug) {
  return NSI_SIZES[slug] || [1, 1, 1];
}
// Daftar NSI yang sudah terdaftar.
export const NSI_SLUGS = [NSI_WEDGE_SLUG, NSI_RAMP_SLUG, NSI_TRUSS_SLUG, NSI_SEAT_SLUG, NSI_STEP_SLUG, NSI_MAST_SLUG, NSI_HELM_SLUG, NSI_WINDOW_SLUG, NSI_DOOR_SLUG, NSI_HATCH_SLUG, ...NSI_CHEST_SLUGS, NSI_ST_SLUG, NSI_MT_SLUG, NSI_BT_SLUG, NSI_PT_SLUG, ...NSI_TR_SLUGS, ...NSI_ROD_SLUGS];
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
  // ⚠️ bab 169 (Medium Treasure): mahkota = emas PUCAT (lebih terang dari rangka).
  crown: [1.16, 1.02, 0.40, 1.0],
  cyan:  [0.05, 2.45, 3.30, 1.0],
  red:   [2.45, 0.10, 0.10, 1.0],
  green: [0.06, 2.20, 0.10, 1.0],
  // ⚠️ bab 178 (Big Treasure): SAYAP PUTIH (terukur sRGB 255,255,255 → linear 1.0)
  //    + X MERAH (terukur sRGB 171,3,3 → linear 0.407).
  wing:  [1.62, 1.62, 1.62, 1.0],
  // Claude p10: kecerahan per-lapisan supaya tepi helai terbaca
  wingFront: [1.62, 1.62, 1.62, 1.0],   // paling terang
  wingMid:   [1.44, 1.44, 1.44, 1.0],
  wingBack:  [1.28, 1.28, 1.28, 1.0],
  // bab 180 (Pine Tree): hijau pinus gelap + batang cokelat tua kemerahan.
  // (kalibrasi: referensi sRGB hijau ~(29,42,31) & cokelat ~(43,33,28) —
  //  itu warna SUDAH TERBAYANG; base color dipilih lebih terang, diukur ulang)
  // ⚠️ bab 180g — AKAR "pohon hitam" (TERUKUR): warna vertex DIKALIKAN tekstur.
  //    Tekstur grass_block linear mean = (0.0064, 0.0738, 0.0151) SUDAH hijau gelap.
  //    Kalau vertex color juga hijau (0.030,0.150,0.048) -> hasil 0.0002 = HITAM.
  //    FIX: vertex color = PUTIH (1,1,1) supaya WARNA MURNI dari tekstur grass.
  //    (bandingkan: legendary_chest linear 0.512 -> chest pakai vertex color kuat)
  //    Terukur sesudah fix putih: render (3.4,26.7,9.0) vs referensi (32,59,35)
  //    -> masih ~2.2x gelap; KALIBRASI kompensasi (texture linear x2.2 + R sedikit lebih).
  //    Terukur objektif (PERCENTILE, bukan mean — mean terpengaruh bayangan):
  //    p75 ref (33,65,36) vs render (11,39,20) -> butuh linear x(4.54,2.61,2.52).
  //    R dibatasi 3.5 (materi >4 sering clamp). Hue R memang kurang di tekstur grass.
  pineFoliage: [3.50, 2.61, 2.52, 1.0],
  pineTrunk:   [1.0, 1.0, 1.0, 1.0],         // batang: cokelat dari ATLAS (bab 180i)
  xred:  [2.60, 0.070, 0.085, 1.0],   // bab 178c: merah lebih TERANG (Claude: masih maroon)
  // ══ bab 205 (TORCH) — nilai TERUKUR dari 5 screenshot referensi ══
  // ⚠️ Claude putaran 1: vertex color = PENGALI. Nilai >1 tanpa tone mapping
  //    memicu clamp per-kanal → HUE BERGESER. Di repo ini toneMapping =
  //    ACESFilmic (baris ~13007) sehingga nilai >1 ditangani halus, TAPI
  //    tetap dijaga ≤1.6 supaya tidak pecah. Referensi sRGB terukur:
  //      bara (232,150,140) · cup (71,66,57) · grip (141,115,74)
  //      gagang (87,69,43) · pommel (83,77,67)
  // ⚠️ FIX 2026-10-24 (terukur): nilai lama 1.35/1.30/1.20 & 1.55/1.18/0.68
  //    MELANGGAR aturan repo di atas (vertex color harus 0..1). Akibat
  //    terukur di ikon: gagang tampil #7a705f (abu-cokelat pudar) dan cup
  //    #929084 (abu terang) — bukan kayu gelap + logam gelap. Nilai di bawah
  //    = konversi sRGB TERUKUR dari referensi ke linear (semua ≤ 1.0):
  //      kayu #57452b · logam #474239 · pommel #534d43
  //      grip #8d734a · kuningan #967846 · bara #e8968c
  tcMetalDark: [0.0630, 0.0545, 0.0409, 1.0], // logam gelap cangkir & pommel
  tcMetalIn:   [0.0200, 0.0170, 0.0140, 1.0], // dinding DALAM cangkir (jelaga)
  tcMetalBand: [0.3050, 0.1878, 0.0612, 1.0], // cincin pengikat = kuningan
  tcWood:      [0.0953, 0.0595, 0.0242, 1.0], // gagang kayu cokelat tua
  tcGrip:      [0.2664, 0.1714, 0.0685, 1.0], // grip krem/cokelat muda
  tcEmberBed:  [0.8070, 0.3050, 0.2623, 1.0], // alas bara (merah menyala)
  // ══ bab 206 (LAMP) — warna TERUKUR dari 7 screenshot referensi ══
  // ⚠️ ATURAN: nilai HARUS ≤ 1.0 (vertex color = PENGALI, >1 = hue bergeser).
  // Konversi sRGB terukur → linear:
  //   logam atap/alas (14..42, 24..54, 34..65)  → navy sangat gelap
  //   logam kena cahaya (138..163,140..159,129) → abu kehijauan
  //   kaca (78..93, 81..91, 54..55)             → hijau zaitun gelap
  //   inti (255,255,70)                          → kuning menyala (unlit)
  lampMetal:     [0.0092, 0.0148, 0.0243, 1.0], // rangka atap & alas (navy gelap)
  lampMetalLit:  [0.2462, 0.2582, 0.2201, 1.0], // logam kena cahaya (bidang atas)
  lampGlass:     [0.0742, 0.0880, 0.0356, 1.0], // kaca hijau zaitun
  lampCore:      [1.0000, 1.0000, 0.0648, 1.0], // inti kuning (MeshBasic, unlit)
  // ══ bab 200 (TROPHY 1st/2nd/3rd) — WARNA DIPERBAIKI TOTAL ══
  // ⚠️ BUG YANG DILAPORKAN USER: "di localhost warnanya jadi aneh dan jauh
  //    dari referensi".
  //    AKAR MASALAH (terukur): nilai vertex color di sini > 1.0
  //    (trGold 1.06 · trSilver 1.48/1.58/1.72 · trNumGold 2.30 · trNumCyan
  //    2.70). Vertex color adalah PENGALI, bukan emisi — nilai >1 membuat
  //    hasil ter-clip per kanal sehingga HUE BERGESER (emas jadi kekuning-
  //    hijauan, perak jadi putih pucat, biru jadi pucat). Itu sebabnya warna
  //    "aneh". Sekarang SEMUA nilai di dalam 0..1 (warna MURNI).
  //    Catatan: tekstur marble_block (abu netral mean 0.79) tetap mengalikan
  //    → sengaja dinaikkan sedikit tapi TIDAK melewati 1.0.
  //
  // ATURAN USER (2026-10-24): 1st = EMAS MURNI · 2nd = BIRU DIAMOND ·
  //                           3rd = TEMBAGA/COPPER MURNI
  // Angka = linear (bukan sRGB), sudah dikonversi dari hex acuan:
  //   emas #FFD24A · diamond #6FD3FF · copper #C8703A
  trGold:      [1.00, 0.6600, 0.0700, 1.0],   // emas murni (R jenuh, wajar)
  trDiamond:   [0.1500, 0.5600, 1.00, 1.0],   // biru diamond (B jenuh)
  trCopper:    [0.7600, 0.2600, 0.0700, 1.0], // tembaga murni
  trBaseCream: [0.8600, 0.8400, 0.7900, 1.0], // marmer krem (1st)
  trBaseDark:  [0.1000, 0.1200, 0.1500, 1.0], // batu arang (2nd)
  trBaseTerra: [0.3800, 0.1900, 0.1000, 1.0], // terakota (3rd)
  trPlaque:    [0.2200, 0.1800, 0.1200, 1.0], // plat nama (dasar)
  trNumGold:   [1.00, 0.8200, 0.1800, 1.0],   // angka "1st" emas
  trNumCyan:   [0.5500, 0.9000, 1.00, 1.0],   // angka "2nd" cyan diamond
  trNumOrange: [1.00, 0.5600, 0.1400, 1.0],   // angka "3rd" tembaga
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
    // bab 180i: pt.uv = wilayah UV di ATLAS (mis. batang cokelat di Pine Tree).
    // Guard: kalau tidak ada -> perilaku LAMA (0..1) persis, jadi varian lain aman.
    const uvr = pt.uv || [0, 0, 1, 1];
    const u0 = uvr[0], v0 = uvr[1], du = uvr[2], dv = uvr[3];
    // ══ bab 180k (2026-10-12): UV dari _buildFaces = POSISI+0.5 (bukan 0..1!)
    //    → tekstur berulang tiap 1 block. Untuk item bertekstur ATLAS (Pine Tree)
    //    itu membuat pita COKELAT atlas ikut muncul di setiap ubin = "belang oranye".
    //    pt.uvTile=true → pakai PECAHAN UV supaya hanya wilayah atlas yg dipilih
    //    yang tampil (daun hijau saja). Guard: default false = perilaku LAMA persis.
    const tile = !!pt.uvTile;
    const fr = (v) => { const f = v - Math.floor(v); return f; };
    // ══ bab 180t: pt.uvBox = BOX MAPPING per-segitiga (saran Claude putaran 11):
    //    planar UV meregang di bidang miring -> "serat berarah". Box mapping
    //    memilih sumbu proyeksi dari komponen NORMAL TERBESAR tiap segitiga
    //    -> texel density seragam, bintik isotropik. Guard: default false = LAMA.
    const box = !!pt.uvBox;
    const SCL = 1 / 0.98;   // A(opsional): 0.98 block (Claude: 0.95-1.0) -> bintik lebih terbaca
    for (let i = 0; i < P.count; i += 3) {
      // posisi
      const ax = P.getX(i), ay = P.getY(i), az = P.getZ(i);
      const bx = P.getX(i + 1), by = P.getY(i + 1), bz = P.getZ(i + 1);
      const cx = P.getX(i + 2), cy = P.getY(i + 2), cz = P.getZ(i + 2);
      pos.push(ax, ay, az, bx, by, bz, cx, cy, cz);
      if (box) {
        // normal segitiga -> pilih sumbu proyeksi
        const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
        const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
        const nx = Math.abs(e1y * e2z - e1z * e2y);
        const ny = Math.abs(e1z * e2x - e1x * e2z);
        const nz = Math.abs(e1x * e2y - e1y * e2x);
        // B: SATU SUMBU PROYEKSI per part (bukan per segitiga) -> pola tidak
        //    putus/meregang di sambungan segitiga (saran Claude putaran 13)
        const tri = [[ax, ay, az], [bx, by, bz], [cx, cy, cz]];
        const axis = (nx >= ny && nx >= nz) ? 'x' : (ny >= nz ? 'y' : 'z');
        tri.forEach((v) => {
          let pu, pv;
          if (axis === 'x') { pu = v[2]; pv = v[1]; }
          else if (axis === 'y') { pu = v[0]; pv = v[2]; }
          else { pu = v[0]; pv = v[1]; }
          // B: [0.06,0.94] -> jangan menyentuh pita batang (sliver krem hilang)
          const fu = 0.08 + fr(pu * SCL) * 0.84;
          const fv = 0.08 + fr(pv * SCL) * 0.84;
          uv.push(u0 + fu * du, v0 + fv * dv);
        });
      } else {
        for (let k = 0; k < 3; k++) {
          const ux = tile ? fr(U.getX(i + k)) : U.getX(i + k);
          const vy = tile ? fr(U.getY(i + k)) : U.getY(i + k);
          uv.push(u0 + ux * du, v0 + vy * dv);
        }
      }
      for (let k = 0; k < 3; k++) {
        // bab 198: pt.colorFn (opsional) → warna PER-VERTEX (gradasi logam).
        // Guard: kalau tidak ada → perilaku LAMA persis (satu warna per part).
        if (pt.colorFn) {
          const vx = k === 0 ? ax : (k === 1 ? bx : cx);
          const vy = k === 0 ? ay : (k === 1 ? by : cy);
          const vz = k === 0 ? az : (k === 1 ? bz : cz);
          const cc = pt.colorFn(vx, vy, vz);
          col.push(cc[0], cc[1], cc[2], cc[3] === undefined ? 1.0 : cc[3]);
        } else {
          col.push(c[0], c[1], c[2], c[3]);
        }
      }
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

// ══════════════════════════════════════════════════════════════════════════
// ── NSI LEVEL 2 #10: MEDIUM TREASURE — GEOMETRI (bab 169) ──
// Rangka 100% IDENTIK Small Treasure. Pembeda HANYA aksesori:
//   (a) MAHKOTA emas pucat di puncak tutup (tengah),
//   (b) PERMATA CYAN + 2 TARING tulang menggantikan BINTANG UNGU.
// Badan+tutup digeser MT_YOFF ke bawah supaya bbox (badan..puncak mahkota)
// TERPUSAT di origin → posY = setengah tinggi bekerja benar.
// ⚠️ Semua part WAJIB digabung per-bentuk (bukan per-face) supaya
//    _stFaceOutward bisa membetulkan winding (pelajaran bab 150/157).
// ⚠️ JANGAN pakai _fixWindingByVolume (butuh volume tertutup).
// ══════════════════════════════════════════════════════════════════════════

/** Geser SEMUA titik part sejauh dy (untuk menurunkan badan+tutup Medium). */
function _mtShiftY(parts, dy) {
  return parts.map((pt) => ({
    tag: pt.tag,
    faces: pt.faces.map((f) => f.map((v) => [v[0], v[1] + dy, v[2]])),
  }));
}

/** Prisma bersegi yang MENYEMPIT di atas (untuk taji mahkota).
 *  xc = pusat x, y0..y1 = tinggi, w0/w1 = lebar bawah/atas, z0..z1 = kedalaman. */
function _mtSpike(xc, y0, y1, w0, w1, z0, z1) {
  const b0 = [xc - w0 / 2, y0, z0], b1 = [xc + w0 / 2, y0, z0];
  const b2 = [xc + w0 / 2, y0, z1], b3 = [xc - w0 / 2, y0, z1];
  const t0 = [xc - w1 / 2, y1, z0], t1 = [xc + w1 / 2, y1, z0];
  const t2 = [xc + w1 / 2, y1, z1], t3 = [xc - w1 / 2, y1, z1];
  return [
    [b0, b1, b2, b3],           // alas
    [t0, t1, t2, t3],           // puncak
    [b3, b2, t2, t3],           // depan
    [b0, b1, t1, t0],           // belakang
    [b0, b3, t3, t0],           // kiri
    [b1, b2, t2, t1],           // kanan
  ];
}

/** FIX bab 170d: PAKSA winding part BENAR lewat VOLUME BERTANDA (bukan centroid).
 *  AKAR "facet hitam" (terukur: 20 wajah menghadap DALAM di area permata):
 *  metode centroid hanya andal untuk bentuk CEMBUNG; permata+meja+bahu itu
 *  CAMPURAN cembung/cekung → orientasi sebagian wajah terbalik.
 *  Volume bertanda = metode yang sama dengan _stBuild (terbukti andal). */
function _mtOutward(faces) {
  let V = 0;
  for (const f of faces) {
    for (let i = 1; i < f.length - 1; i++) {
      const a = f[0], b = f[i], c = f[i + 1];
      V += (a[0] * (b[1] * c[2] - b[2] * c[1])
          - a[1] * (b[0] * c[2] - b[2] * c[0])
          + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
    }
  }
  if (V >= 0) return faces;
  return faces.map((f) => f.slice().reverse());
}

/** FIX bab 170b: taji RUNCIING (piramida apex) — bukan balok ujung datar. */
function _mtSpikeRuncing(xc, y0, y1, w0, d0) {
  // ══ bab 170c (review Claude): badan PRISMA 60% + ujung PIRAMIDA 40%.
  //    Dulu langsung meruncing dari alas → terlihat seperti "duri/mohawk". ══
  const yB = y0 + (y1 - y0) * 0.60;          // puncak badan prisma
  const w1 = w0 * 0.72, d1 = d0 * 0.72;      // badan sedikit menyempit
  const b0 = [xc - w0 / 2, y0, -d0 / 2], b1 = [xc + w0 / 2, y0, -d0 / 2];
  const b2 = [xc + w0 / 2, y0,  d0 / 2], b3 = [xc - w0 / 2, y0,  d0 / 2];
  const m0 = [xc - w1 / 2, yB, -d1 / 2], m1 = [xc + w1 / 2, yB, -d1 / 2];
  const m2 = [xc + w1 / 2, yB,  d1 / 2], m3 = [xc - w1 / 2, yB,  d1 / 2];
  const A = [xc, y1, 0];                      // apex
  return [
    [b0, b1, b2, b3],                         // alas
    [b3, b2, m2, m3], [b0, b1, m1, m0],       // badan: depan, belakang
    [b0, b3, m3, m0], [b1, b2, m2, m1],       // badan: kiri, kanan
    [m3, m2, A], [m1, m0, A],                 // piramida: depan, belakang
    [m0, m3, A], [m2, m1, A],                 // piramida: kiri, kanan
  ];
}

/** FIX bab 171: putar taji mengelilingi sumbu Y + geser ke posisi cincin. */
function _mtXform(faces, a, tx, tz) {
  const c = Math.cos(a), sn = Math.sin(a);
  return faces.map((f) => f.map((v) => {
    const x = v[0] * c + v[2] * sn;
    const z = -v[0] * sn + v[2] * c;
    return [x + tx, v[1], z + tz];
  }));
}

/** Part MAHKOTA (koordinat AKHIR Medium, sudah termasuk MT_YOFF). */
function _mtCrownParts() {
  const p = [];
  const YB = 0.625 + MT_YOFF;      // = 0.250
  const YT = 0.625 - MT_YOFF;      // = 1.000 → puncak taji (bbox atas)
  // ══ FIX bab 171 (koreksi user: "aslinya MELINGKAR woi, bukan 1 baris") ══
  //   Mahkota = CINCIN mengelilingi tutup (bukan barisan lurus), 6 taji.
  const R_OUT = 0.46, R_IN = 0.34;   // diameter luar 0.92 = 46% lebar peti
  const SEG = 16;
  const y0 = YB - 0.08, y1 = YB + 0.08;
  // ── BAND CINCIN (satu part, mengelilingi penuh) ──
  const bandFaces = [];
  for (let k = 0; k < SEG; k++) {
    const a0 = (k / SEG) * Math.PI * 2, a1 = ((k + 1) / SEG) * Math.PI * 2;
    const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    const O0b = [R_OUT * c0, y0, R_OUT * s0], O1b = [R_OUT * c1, y0, R_OUT * s1];
    const O0t = [R_OUT * c0, y1, R_OUT * s0], O1t = [R_OUT * c1, y1, R_OUT * s1];
    const I0b = [R_IN * c0, y0, R_IN * s0],  I1b = [R_IN * c1, y0, R_IN * s1];
    const I0t = [R_IN * c0, y1, R_IN * s0],  I1t = [R_IN * c1, y1, R_IN * s1];
    bandFaces.push([O0b, O1b, O1t, O0t]);   // luar
    bandFaces.push([I1b, I0b, I0t, I1t]);   // dalam
    bandFaces.push([I0t, I1t, O1t, O0t]);   // atas
    bandFaces.push([O0b, O1b, I1b, I0b]);   // bawah
  }
  p.push({ faces: _mtOutward(bandFaces), tag: 'crown' });
  // ── 6 TAJI MENGELILINGI (2 depan TINGGI mengapit celah V + 4 lainnya) ──
  //   phi diukur dari depan (+z) menuju +x
  const R_MID = (R_OUT + R_IN) / 2;
  const spikes = [
    { phi:  -33, dh: 0.00, w: 0.20, d: 0.22 },   // depan-kiri (TINGGI)
    { phi:   33, dh: 0.00, w: 0.20, d: 0.22 },   // depan-kanan (TINGGI)
    { phi:  -95, dh: 0.38, w: 0.15, d: 0.16 },   // samping-kiri
    { phi:   95, dh: 0.38, w: 0.15, d: 0.16 },   // samping-kanan
    { phi: -152, dh: 0.44, w: 0.13, d: 0.14 },   // belakang-kiri
    { phi:  152, dh: 0.44, w: 0.13, d: 0.14 },   // belakang-kanan
  ];
  const yB = YB + 0.06;
  for (const sp of spikes) {
    const rad = (sp.phi * Math.PI) / 180;
    const px = R_MID * Math.sin(rad), pz = R_MID * Math.cos(rad);
    const geo = _mtSpikeRuncing(0, yB, YT - sp.dh, sp.w, sp.d);
    p.push({ faces: _mtOutward(_mtXform(geo, rad, px, pz)), tag: 'crown' });
  }
  return p;
}

function _mtGemParts() {
  const p = [];
  // ══ FIX bab 170d (bukti: meja terlepas & melayang → lubang hitam besar) ══
  //   AKAR: meja segi-8 dibuat TANPA facet penghubung ke bahu → mesh TERBUKA.
  //   Sekarang: meja(8) → bahu(8) → apex(1) = mesh TERTUTUP RAPAT (watertight).
  const yG = -0.310;               // = pusat pita depan Medium (part 4/5/6)
  const zA = 0.49, zB = 0.72;      // zA 0.49 = menempel muka tutup (z=0.50)
  const yT = yG + 0.34;            // meja
  const yM = yG + 0.06;            // bahu (girdle)
  const yA = yG - 0.30;            // apex (culet)
  const rT = 0.21;                 // setengah-lebar meja (≈50% girdle 0.42)
  const rM = 0.42;                 // setengah-lebar girdle
  const zc = (zA + zB) / 2, rz = (zB - zA) / 2;
  const cx = 0;
  // 8 titik per cincin (oktagon, sumbu y) — indeks 0..7
  const ring = (yy, rr) => {
    const out = [];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      out.push([cx + Math.cos(a) * rr, yy, zc + Math.sin(a) * Math.min(rz, rr)]);
    }
    return out;
  };
  const T = ring(yT, rT);   // meja (kecil)
  const M = ring(yM, rM);   // girdle (lebar)
  const APEX = [cx, yA, zc];
  const faces = [];
  // muka MEJA (oktagon) — fan dari titik tengah
  const TC = [cx, yT, zc];
  for (let k = 0; k < 8; k++) faces.push([TC, T[k], T[(k + 1) % 8]]);
  // FACET PENGHUBUNG meja → girdle (inilah yang HILANG sebelumnya)
  for (let k = 0; k < 8; k++) {
    const k2 = (k + 1) % 8;
    faces.push([T[k], T[k2], M[k2], M[k]]);
  }
  // PAVILIUN girdle → apex
  for (let k = 0; k < 8; k++) {
    const k2 = (k + 1) % 8;
    faces.push([M[k], M[k2], APEX]);
  }
  p.push({ faces: _mtOutward(faces), tag: 'cyan' });
  // ── 2 TARING (mulai x=0.44 → di luar setengah-lebar permata 0.42) ──
  for (const sx of [-1, 1]) {
    const xIn = sx * 0.44, xOut = sx * 0.72;
    const yIn = yG + 0.04, yOut = yG + 0.20;
    const z0 = zA, z1 = zA + 0.10;
    const wIn = 0.11;
    p.push({ faces: _mtOutward([
      [[xIn, yIn - wIn / 2, z0], [xOut, yOut - wIn / 2, z0], [xOut, yOut + wIn / 2, z0], [xIn, yIn + wIn / 2, z0]],
      [[xIn, yIn - wIn / 2, z1], [xIn, yIn + wIn / 2, z1], [xOut, yOut + wIn / 2, z1], [xOut, yOut - wIn / 2, z1]],
      [[xIn, yIn - wIn / 2, z0], [xIn, yIn - wIn / 2, z1], [xIn, yIn + wIn / 2, z1], [xIn, yIn + wIn / 2, z0]],
      [[xOut, yOut - wIn / 2, z0], [xOut, yOut + wIn / 2, z0], [xOut, yOut + wIn / 2, z1], [xOut, yOut - wIn / 2, z1]],
      [[xIn, yIn - wIn / 2, z0], [xOut, yOut - wIn / 2, z0], [xOut, yOut - wIn / 2, z1], [xIn, yIn - wIn / 2, z1]],
      [[xIn, yIn + wIn / 2, z0], [xIn, yIn + wIn / 2, z1], [xOut, yOut + wIn / 2, z1], [xOut, yOut + wIn / 2, z0]],
    ]), tag: 'bone' });
  }
  return p;
}

/** BADAN Medium Treasure (rangka Small Treasure, digeser turun). */
export function getMediumTreasureBodyParts() {
  return _mtShiftY(getSmallTreasureBodyParts(), MT_YOFF);
}

/** TUTUP Medium Treasure: drum+rok+ring+pita (IDENTIK Small) TANPA bintang,
 *  lalu + PERMATA CYAN + TARING + MAHKOTA (ikut bergerak saat dibuka). */
export function getMediumTreasureLidParts() {
  const small = getSmallTreasureLidParts();
  // 16 part terakhir = bintang ungu (_stStarX: 8 titik × 2 push) → DIBUANG
  const tanpaBintang = small.slice(0, small.length - 16);
  return [..._mtShiftY(tanpaBintang, MT_YOFF), ..._mtGemParts(), ..._mtCrownParts()];
}

/** Alias untuk NSI WORKBENCH (bab 169) — konversi otomatis 'get' + slug + 'Parts'
 *  gagal untuk nama ber-underscore ('medium_treasure' → getMedium_treasureParts).
 *  Sediakan DI SINI supaya file workbench (teritori user) TIDAK disentuh. */
export function getMedium_treasureParts() {
  return [...getMediumTreasureBodyParts(), ...getMediumTreasureLidParts()];
}

/** Geometri BADAN Medium Treasure (statis). */
export function makeMediumTreasureBodyGeometry(THREE) {
  return _stBuild(THREE, getMediumTreasureBodyParts());
}

/** Geometri TUTUP Medium Treasure (bergerak: drum+ring+pita+permata+mahkota). */
export function makeMediumTreasureLidGeometry(THREE) {
  return _stBuild(THREE, getMediumTreasureLidParts());
}

/** Geometri PENUH Medium Treasure (badan+tutup) — preview/workbench. */
export function makeMediumTreasureFullGeometry(THREE) {
  return _stBuild(THREE, [...getMediumTreasureBodyParts(), ...getMediumTreasureLidParts()]);
}

/**
 * ⚠️ ALIAS untuk NSI WORKBENCH (bab 160, 2026-10-11).
 * AKAR: workbench mencari getter dengan konversi otomatis
 *   'get' + ITEM[0].toUpperCase() + ITEM.slice(1) + 'Parts'
 *   → untuk 'small_treasure' jadi `getSmall_treasureParts` (SALAH, ada underscore).
 * Karena itu daftar part kosong → workbench hanya menampilkan preview 3D.
 * SOLUSI: sediakan alias ini DI SINI (blockShapes.js) supaya file workbench
 * TIDAK PERLU disentuh sama sekali (workbench = teritori user).
 */
// ══════════════════════════════════════════════════════════════════════════
// ── NSI LEVEL 2 #11: BIG TREASURE (peti BERSAYAP) — bab 178 ──
// Rangka 100% IDENTIK Small Treasure. Pembeda HANYA:
//   (a) 2 SAYAP PUTIH menempel di TUTUP (ikut terangkat saat dibuka),
//   (b) emblem X MERAH di muka pita depan (menggantikan bintang ungu).
// ⚠️ KONFIRMASI USER (2026-10-12): "sayapnya ikut nempel di tutup petinya,
//    jadi ketika dibuka ya ikut terangkat ikut gerak dia si sayapnya itu".
// ⚠️ Semua part digabung per-bentuk supaya _btOutward (volume bertanda) bisa
//    membetulkan winding — JANGAN pakai metode centroid (pelajaran bab 170d).
// ══════════════════════════════════════════════════════════════════════════

/** Paksa winding part BENAR lewat VOLUME BERTANDA (sama dgn _mtOutward). */
function _btOutward(faces) {
  let V = 0;
  for (const f of faces) {
    for (let i = 1; i < f.length - 1; i++) {
      const a = f[0], b = f[i], c = f[i + 1];
      V += (a[0] * (b[1] * c[2] - b[2] * c[1])
          - a[1] * (b[0] * c[2] - b[2] * c[0])
          + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
    }
  }
  if (V >= 0) return faces;
  return faces.map((f) => f.slice().reverse());
}

/** Geser part sejauh dy (sama seperti _mtShiftY, dipisah agar jelas). */
function _btShiftY(parts, dy) {
  return parts.map((pt) => ({
    tag: pt.tag,
    faces: pt.faces.map((f) => f.map((v) => [v[0], v[1] + dy, v[2]])),
  }));
}

/** Triangulasi FAN dari CENTROID — dijamin watertight untuk poligon star-shaped
 *  (setiap titik "terlihat" dari centroid). Ear-clipping GAGAL untuk outline
 *  bergerigi (menghasilkan 49 tepi terbuka = BOLONG), jadi pakai fan ini. */
function _btTriFan(poly) {
  let cx = 0, cy = 0;
  for (const p of poly) { cx += p[0]; cy += p[1]; }
  cx /= poly.length; cy /= poly.length;
  const C = [cx, cy];
  const tri = [];
  for (let i = 0; i < poly.length; i++) {
    tri.push([C, poly[i], poly[(i + 1) % poly.length]]);
  }
  return tri;
}

/**
 * BULU 3D MELENGKUNG — tabung memipih sepanjang kurva Bezier kuadratik.
 * Menyempit ke ujung (wBase→wTip) & menipis (thick) → kesan bulu sayap asli.
 */
function _btFeather3D(p0, p1, ctrl, wBase, wTip, thick, zc, nSeg, tipFrac) {
  const TF = (typeof tipFrac === 'number') ? tipFrac : 0.28;
  const ts = 1 - TF;
  const wMid = wBase + (wTip - wBase) * 0.55;
  const rings = [];
  for (let s = 0; s <= nSeg; s++) {
    const t = s / nSeg;
    const x = (1-t)*(1-t)*p0[0] + 2*(1-t)*t*ctrl[0] + t*t*p1[0];
    const y = (1-t)*(1-t)*p0[1] + 2*(1-t)*t*ctrl[1] + t*t*p1[1];
    let w;
    if (t <= ts) w = wBase + (wMid - wBase) * (t / ts);
    else { const u = (t - ts) / TF; w = wMid * (1 - u) + 0.030 * u; }
    const th = thick * (1 - 0.72*t);
    const dx = 2*(1-t)*(ctrl[0]-p0[0]) + 2*t*(p1[0]-ctrl[0]);
    const dy = 2*(1-t)*(ctrl[1]-p0[1]) + 2*t*(p1[1]-ctrl[1]);
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    rings.push([
      [x + nx*w, y + ny*w, zc + th],
      [x - nx*w, y - ny*w, zc + th],
      [x - nx*w, y - ny*w, zc - th],
      [x + nx*w, y + ny*w, zc - th],
    ]);
  }
  const f = [];
  for (let s = 0; s < nSeg; s++) {
    for (let k = 0; k < 4; k++) {
      f.push([rings[s][k], rings[s][(k+1)%4], rings[s+1][(k+1)%4], rings[s+1][k]]);
    }
  }
  f.push([rings[0][0], rings[0][3], rings[0][2], rings[0][1]]);
  const tip = rings[nSeg];
  const ddx = p1[0]-p0[0], ddy = p1[1]-p0[1], dl = Math.hypot(ddx,ddy) || 1;
  const tcx = (tip[0][0]+tip[1][0]+tip[2][0]+tip[3][0])/4;
  const tcy = (tip[0][1]+tip[1][1]+tip[2][1]+tip[3][1])/4;
  const tcz = (tip[0][2]+tip[1][2]+tip[2][2]+tip[3][2])/4;
  const EXT = 0.045;
  const TX = [tcx + (ddx/dl)*EXT, tcy + (ddy/dl)*EXT, tcz];
  for (let k = 0; k < 4; k++) f.push([tip[k], tip[(k+1)%4], TX]);
  return f;
}

/** Prisma dari poligon 2D (extrude z: zc−T .. zc+T) — untuk massa sayap. */
function _btPrism(poly, zc, T, seg) {
  const tri = _btTriFan(poly);
  const f = [];
  // penampang membulat: tepi DEPAN (depan peti, z+) lebih tebal daripada tepi belakang
  const Tf = (seg === undefined) ? T : T * 1.00;
  const Tb = (seg === undefined) ? T : T * 0.55;
  for (const [a, b, c] of tri) {
    f.push([[a[0],a[1],zc+Tf],[b[0],b[1],zc+Tf],[c[0],c[1],zc+Tf]]);
    f.push([[a[0],a[1],zc-Tb],[c[0],c[1],zc-Tb],[b[0],b[1],zc-Tb]]);
  }
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i+1)%poly.length];
    if (Math.hypot(a[0]-b[0], a[1]-b[1]) < 1e-9) continue;
    f.push([[a[0],a[1],zc+Tf],[b[0],b[1],zc+Tf],[b[0],b[1],zc-Tb],[a[0],a[1],zc-Tb]]);
  }
  return f;
}

/** Massa sayap (bagian atas padat) — dari leading edge ke pangkal bulu. */
function _btWingMass() {
  // bab 178h (saran Claude, TERVERIFIKASI): profil massa 0.50 pangkal -> 0.40 tengah
  //   -> 0.28 di 80% -> 0 ujung (bukan monoton habis sebelum ujung).
  //   Massa berhenti sedikit SEBELUM X1 supaya BULU TERLUAR membentuk ujung sayap.
  const X0 = 1.00, XM = 2.540;                  // massa berhenti di 2.540 (bulu sampai 2.625)
  const top = (t) => 0.653 + 0.544 * Math.pow(t, 1.35);
  const dep = (t) => t <= 0.5 ? (0.50 - 0.20 * (t / 0.5))
                  : t <= 0.8 ? (0.40 - 0.12 * ((t - 0.5) / 0.3))
                  : (0.02 + 0.26 * (1 - (t - 0.8) / 0.2));
  const poly = [];
  const N = 14;
  for (let k = 0; k <= N; k++) { const t = k/N; poly.push([X0 + (XM-X0)*t, top(t)]); }
  for (let k = N; k >= 0; k--) { const t = k/N; poly.push([X0 + (XM-X0)*t, top(t) - dep(t)]); }
  return poly;
}

/** Part SAYAP (satu sisi): MASSA berprofil + 12 BULU PANJANG bertumpuk.
 *  bab 178h: massa 3 potong dgn KETEBALAN z menurun (0.25 -> 0.06);
 *  bulu panjang 0.25-0.45, bulu TERLUAR melewati ujung massa (membentuk tip). */
function _btWingFaces(sign) {
  const X0 = 1.00, XM = 2.540, X1 = 2.577;
  const top = (t) => 0.653 + 0.544 * Math.pow(t, 1.35);
  const dep = (t) => t <= 0.5 ? (0.50 - 0.20 * (t / 0.5))
                  : t <= 0.8 ? (0.40 - 0.12 * ((t - 0.5) / 0.3))
                  : (0.02 + 0.26 * (1 - (t - 0.8) / 0.2));
  const faces = [];
  const layers = [[], [], []];   // Claude p10: 3 lapisan (kecerahan beda)
  // ── massa 3 potong: KETEBALAN z menurun 0.125 -> 0.030 (Claude: 0.25 -> 0.06 penuh)
  for (let k = 0; k < 3; k++) {
    const t0 = k/3, t1 = (k+1)/3, M = 5, sub = [];
    for (let q = 0; q <= M; q++) { const t = t0+(t1-t0)*q/M; sub.push([X0+(XM-X0)*t, top(t)]); }
    for (let q = M; q >= 0; q--) { const t = t0+(t1-t0)*q/M; sub.push([X0+(XM-X0)*t, top(t)-dep(t)]); }
    const T = 0.200 - 0.025*k;            // bab 178i: 0.200/0.175/0.150 (Claude: pangkal ~0.40 total)
    for (const f of _btPrism(sub, 0, T, k)) faces.push(f);   // k -> penampang membulat
  }
  // ── 12 bulu utama: panjang 0.25-0.45, keluar dari BAWAH tepi massa,
  //    tumpang tindih ~50% (lebar besar), bulu TERLUAR melewati ujung massa
  // ── BARISAN PRIMER TERATUR (Claude putaran 8): 9 helai lanset, jarak teratur,
  //    SEMUA SEJAJAR (lean sama ~20°), panjang naik-turun HALUS (bukan gigi acak)
  // Claude p9: helai WAJIB saling MENIMPA ~40% + offset kedalaman BERGANTIAN
  const NB = 9;
  const LEAN = 0.34;                                     // sejajar semua (~19°)
  for (let i = 0; i < NB; i++) {
    const frac = i / (NB - 1);
    const t0 = 0.05 + 0.90 * frac;
    const x0 = X0 + (XM - X0) * Math.min(1, t0);
    const y0 = top(t0) - dep(t0) + 0.02;
    const len = 0.35 + 0.07 * Math.sin(Math.PI * (0.25 + 1.35 * frac));
    let x1 = x0 + 0.22;
    // Claude p9: 2-3 helai TERLUAR memanjang MELEWATI ujung massa (ujung sayap)
    if (frac >= 0.66) x1 = X1 - 0.004;
    if (x1 - x0 < 0.05) x1 = x0 + 0.05;
    const y1 = y0 - len * LEAN;
    const cx = (x0+x1)/2, cy = y0 - len*0.55*LEAN;
    // Claude p9: offset kedalaman BERGANTIAN 0.05-0.06 (bukan 3 lapis beraturan)
    const zc = -0.115 + (i % 2 ? 0.058 : -0.048) + 0.012 * (i % 3);
    const wBase = 0.180, wTip = 0.096;   // Claude p10: pola lapisan berulang tiap 3                    // Claude p9: 0.135 -> 0.18 (tumpang 40%)
    const th = 0.120 - 0.030*frac;
    const LAY = (i % 3 === 1) ? 2 : (i % 3 === 2 ? 1 : 0);   // Claude p10: pola berulang
    for (const f of _btFeather3D([x0,y0],[x1,y1],[cx,cy], wBase, wTip, th, zc, 6, 0.30)) layers[LAY].push(f);
  }
  // ── 5 bulu penutup menimpa pangkal bulu utama (lapisan KEDUA nyata)
  for (let i = 0; i < 5; i++) {
    const t0 = 0.04 + 0.30 * (i/4);
    const x0 = X0 + (XM-X0)*t0, y0 = top(t0) - dep(t0)*0.22;
    const len = 0.18 + 0.07*i;
    const zc = -0.150 + 0.070*(i%2);   // Claude p9: offset LEBIH DALAM -> lapisan terpisah
    for (const f of _btFeather3D([x0,y0],[x0+0.075, y0-len],[x0+0.028,y0-len*0.55], 0.105, 0.046, 0.085, zc, 4, 0.30)) faces.push(f);
  }
  // ── Claude p9: tepi ATAS deretan 4-5 bulu penutup kecil MELENGKUNG
  for (let i = 0; i < 6; i++) {
    const frac = 0.08 + 0.66 * (i/5);
    const x0 = X0 + (XM - X0) * frac;
    const y0 = top(frac) - 0.004;
    const len = (0.045 + 0.011*i) * 0.62;         // Claude p10: ~setengah tinggi
    const zc = -0.058 + 0.048*(i%2);
    // membulat: lebar besar, chevron pendek (0.42) -> tepi atas mulus, bukan gigi
    for (const f of _btFeather3D([x0,y0],[x0+0.052, y0-len*0.5],[x0+0.022, y0-len*0.78], 0.062, 0.052, 0.048, zc, 4, 0.45)) faces.push(f);
  }
  if (sign < 0) {
    const F = (f) => f.map((v) => [-v[0], v[1], v[2]]);
    return { faces: faces.map(F), layers: layers.map((L) => L.map(F)) };
  }
  return { faces, layers };
}

function _btWingParts() {
  const out = [];
  const TAGS = ['wingFront', 'wingMid', 'wingBack'];
  for (const sgn of [1, -1]) {
    const r = _btWingFaces(sgn);
    out.push({ faces: _btOutward(r.faces), tag: 'wingMid' });
    for (let L = 0; L < 3; L++) {
      if (r.layers[L].length) out.push({ faces: _btOutward(r.layers[L]), tag: TAGS[L] });
    }
  }
  return out;
}

/** Part X MERAH — 2 batang bersilang 45° di muka pita depan tutup.
 *  Terukur: lebar ≈0.86 block (44% lebar peti), tebal z nyata (menonjol). */
function _btXParts() {
  const p = [];
  const yG = _ST_YSEAM - 0.105;     // Claude p9: turunkan lagi (masih mengintip di atas drum)
  const z0 = 0.500, z1 = 0.615;     // menonjol dari muka pita (pita z 0.505..0.575)
  const L = 0.517, W = 0.105;       // bab 178f: lebar total 1.414*(L+W)=0.88 block = 44% lebar peti
                                    // (terukur: dulu 1.464 block = 73% — Claude benar)
                                    // W/L = 0.203 -> lengan lebih gemuk (Claude: ~30% panjang)
  for (const a of [Math.PI / 4, -Math.PI / 4]) {
    const c = Math.cos(a), sn = Math.sin(a);
    const rot = (x, y) => [x * c - y * sn, x * sn + y * c];
    const cor = [[-L, -W], [L, -W], [L, W], [-L, W]].map((q) => rot(q[0], q[1]));
    const P4 = (i, z) => [cor[i][0], yG + cor[i][1], z];
    const F = [];
    F.push([P4(0, z1), P4(1, z1), P4(2, z1), P4(3, z1)]);   // muka depan
    F.push([P4(0, z0), P4(3, z0), P4(2, z0), P4(1, z0)]);   // muka belakang
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      F.push([P4(i, z0), P4(i, z1), P4(j, z1), P4(j, z0)]);
    }
    p.push({ faces: _btOutward(F), tag: 'xred' });
  }
  return p;
}

/** BADAN Big Treasure (rangka Small Treasure, digeser BT_YOFF). */
export function getBigTreasureBodyParts() {
  return _btShiftY(getSmallTreasureBodyParts(), BT_YOFF);
}

/** TUTUP Big Treasure: drum+ring+pita (IDENTIK Small) TANPA bintang,
 *  lalu + SAYAP (ikut terangkat) + X MERAH. */
export function getBigTreasureLidParts() {
  const small = getSmallTreasureLidParts();
  const tanpaBintang = small.slice(0, small.length - 16);
  return [..._btShiftY(tanpaBintang, BT_YOFF), ..._btShiftY(_btWingParts(), BT_YOFF), ..._btShiftY(_btXParts(), BT_YOFF)];
}

/** Alias untuk NSI WORKBENCH (nama ber-underscore) — JANGAN sentuh workbench. */
export function getBig_treasureParts() {
  return [...getBigTreasureBodyParts(), ...getBigTreasureLidParts()];
}

export function makeBigTreasureBodyGeometry(THREE) {
  return _stBuild(THREE, getBigTreasureBodyParts());
}
export function makeBigTreasureLidGeometry(THREE) {
  return _stBuild(THREE, getBigTreasureLidParts());
}
export function makeBigTreasureFullGeometry(THREE) {
  return _stBuild(THREE, [...getBigTreasureBodyParts(), ...getBigTreasureLidParts()]);
}

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


// ══════════════════════════════════════════════════════════════════════════
// ── NSI LEVEL 2 #11: PINE TREE — DESAIN DARI MODEL ROBLOX STUDIO (bab 195) ──
// Sumber: "pinetree.obj" + "pinetree.mtl" (export Roblox Studio milik user).
// Geometri ASLI dipakai apa adanya; hanya diskalakan. BUKAN desain karangan.
//
// Grup yang diambil (10 grup di OBJ, sisanya dibuang):
//   Part1    = batang      6.14 x 23.75 x  6.14 studs
//   Leaves1  = kanopi bawah 33.44 x 15.31 x 32.19
//   Leaves2  = cakram daun  14.54 x  0.41 x 14.54
//   Leaves21 = kanopi 2     27.18 x 12.45 x 26.17
//   Leaves31 = kanopi 3     24.05 x 11.01 x 23.15
//   Leaves41 = puncak       20.03 x 14.29 x 19.28
// Dibuang: Spawnlocation1/2, Baseplate1/2 (2048x2048 studs — bukan pohon).
//
// ── BAB 196: DUA BUG DIPERBAIKI (keduanya TERUKUR, bukan dugaan) ──
//
// BUG 1 — "pohon miring, tidak pas tengah grid" (laporan user):
//   Penyebab: mesh dipusatkan pakai PUSAT BBOX. Tapi bbox mesh ASIMETRIS karena
//   kanopi = pentagon yang diputar 36° (vertex di 36/108/180/252/324 derajat),
//   sedangkan batangnya di 0°. Terukur: pusat bbox (X=-44.3413, Z=-7.6484) vs
//   sumbu batang (X=-45.3644, Z=-7.0342) → SELISIH 1.0231 studs di X dan
//   0.6143 studs di Z = 0.512 block = TEPAT SETENGAH SEL GRID.
//   Itu sebabnya blok biasa pas grid tapi Pine Tree meleset separuh sel.
//   FIX: origin X/Z = SUMBU BATANG (pusat Part1), bukan pusat bbox.
//        Sudah di-bake ke pineTreeMesh.js → runtime tidak transform lagi.
//
// BUG 2 — ukuran maksimal (permintaan user, FINAL): 15 studs untuk
//   panjang, lebar, DAN tinggi. Sebelumnya [5.45, 7.50, 4.93] block
//   = [10.90, 15.00, 9.86] studs → LEBAR cuma 10.9 (tidak sampai 15).
//   FIX: skala UNIFORM (bukan per-sumbu) supaya proporsi pohon asli utuh
//   (H/W asli 1.110 terjaga). Dimensi TERBESAR dipatok tepat 15 studs,
//   sisanya ikut proporsi dan otomatis < 15.
//   Hasil terukur: 13.5079 x 15.0000 x 13.0018 studs → semua <= 15. ✔
//
// Mesh final: 896 vertex, 452 segitiga. Data: src/utils/pineTreeMesh.js
// ══════════════════════════════════════════════════════════════════════════
// bbox final dalam BLOCK (1 block = 2 studs) — mesh sudah di-bake ke satuan ini.
// ⚠️ JANGAN dibagi 2 lagi: dulu mesh di-bake dalam studs lalu dibagi 2 di sini,
//    hasilnya pohon jadi 2x terlalu besar (30 studs, lewat batas).
const PT_W = 6.7539;   // = 13.5079 studs
const PT_H = 7.5000;   // = 15.0000 studs  <- dimensi terbesar, tepat batas
const PT_D = 6.5009;   // = 13.0018 studs

/** Part-part Pine Tree dari mesh OBJ Roblox Studio.
 *  Vertex SUDAH final: origin = sumbu batang, dimensi <= 15 studs.
 *  Tidak ada transform di sini — supaya tidak bisa meleset lagi. */
export function getPineTreeParts() {
  return PT_MESH.groups.map((g) => {
    const isTrunk = g.name === 'Part1';
    return {
      tag: isTrunk ? 'pineTrunk' : 'pineFoliage',
      // vertex dipakai LANGSUNG (sudah di-bake), tidak disalin ulang per part
      faces: g.tris.map((t) => [PT_MESH.verts[t[0]], PT_MESH.verts[t[1]], PT_MESH.verts[t[2]]]),
      // uv wilayah atlas: batang = pita cokelat bawah, daun = pita hijau atas
      uv: isTrunk ? [0, 0, 1, 0.28] : [0, 0.28, 1, 0.72],
      uvTile: true,
      uvBox: true,
    };
  });
}


export function makePineTreeGeometry(THREE) {
  return _stBuild(THREE, getPineTreeParts());
}

// ══════════════════════════════════════════════════════════════════════════
// ── NSI LEVEL 2 #12: TROPHY 1st/2nd/3rd — GEOMETRI (bab 197, ROMBAK bab 198) ──
// Bbox WAJIB tepat [1.5, 2.0, 1.0] block = 3 x 4 x 2 studs, TERPUSAT di origin
// (Y dari −1.0 ke +1.0) supaya posY = setengah tinggi bekerja benar.
//
// ⚠️ ROMBAK TOTAL bab 198 (koreksi user: "designnya sangat jelek dan tidak bisa
//    di acc"). Versi bab 197 dibuang, diganti resep berangka dari Claude:
//    • Cangkir dulu berbentuk V meruncing lurus → sekarang U/ogee berperut
//    • Gagang dulu pita tipis 0.045 & ujung melayang → sekarang tabung
//      ber-taper 0.27→0.15 studs dengan volute (kail masuk lagi ke cangkir)
//    • Alas dulu 37% tinggi → sekarang 28% (0→1.12 studs) dengan 4 tier loft
//    • Proporsi batang dinaikkan (rasio 0.14 → 0.22 dari lebar cangkir)
//
// SATUAN: semua angka desain di bawah ditulis dalam STUD (seperti resep Claude,
// Y 0..4). Konversi ke BLOCK dilakukan sekali lewat trX/trY/trZ.
//
// ⚠️ Part BERONGGA (cangkir) dibangun dengan winding BENAR sendiri dan
//    ditandai noFix:true → TIDAK dibetulkan _stFaceOutward, karena centroid
//    benda berongga jatuh di RUANG KOSONG (normal sisi-dalam jadi terbalik).
// ══════════════════════════════════════════════════════════════════════════
const TR_Y0 = -1.0;          // dasar alas (bawah bbox)
const TR_Y1 = 1.0;           // puncak bibir cangkir (atas bbox)
const TR_HX = 0.75;          // setengah panjang  → 1.50 block = 3 studs
const TR_HZ = 0.50;          // setengah lebar    → 1.00 block = 2 studs
const TR_S = 0.5;            // 1 stud = 0.5 block
// ⚠️ bab 199f (Claude putaran 2): cangkir 12 -> 16 segmen (+190 segitiga).
//    Ditutup dengan menurunkan penampang gagang 8 -> 6 (-192 segitiga).
const TR_SEG = 14;

/** stud → block (X/Z): pusat di origin. */
const trX = (s) => s * TR_S;
/** stud → block (Y): stud 0 = TR_Y0, stud 4 = TR_Y1. */
const trY = (s) => TR_Y0 + s * TR_S;
/** [r,y] stud → [r,y] block. */
const trProf = (list) => list.map(([r, y]) => [trX(r), trY(y)]);

/** Ring titik pada bidang XZ untuk jari-jari r di ketinggian y.
 *  ⚠️ `+ 0` di akhir: Math.cos(π/2) menghasilkan −0 (negatif nol) yang
 *  NILAI-nya sama dengan +0 tapi STRING-nya beda ("-0" vs "0"), sehingga
 *  uji tepi-terbuka salah melaporkan celah di sambungan. */
function _trRing(r, y, seg) {
  const out = [];
  for (let k = 0; k < seg; k++) {
    const a = (k / seg) * Math.PI * 2;
    out.push([Math.cos(a) * r + 0, y, Math.sin(a) * r + 0]);
  }
  return out;
}

/**
 * Putar PROFIL (daftar [r, y], bawah→atas) menjadi permukaan.
 * inward=false → normal KELUAR (dinding luar) · inward=true → normal KE DALAM
 * (dinding dalam cangkir, menghadap rongga).
 * ⚠️ Urutan quad [i,k]→[i+1,k]→[i+1,k+1]→[i,k+1] menghasilkan normal KELUAR
 *    untuk profil yang naik (diverifikasi lewat volume bertanda).
 */
function _trRevolve(profil, seg, inward) {
  const rings = profil.map(([r, y]) => _trRing(r, y, seg));
  const f = [];
  for (let i = 0; i < rings.length - 1; i++) {
    const A = rings[i], B = rings[i + 1];
    for (let k = 0; k < seg; k++) {
      const j = (k + 1) % seg;
      const q = [A[k], B[k], B[j], A[j]];
      f.push(inward ? q.slice().reverse() : q);
    }
  }
  return f;
}

/**
 * Tutup FAN dari titik sumbu ke ring jari-jari r pada ketinggian y.
 * ⚠️ Ring dihitung dengan _trRing yang SAMA seperti _trRevolve → vertex
 *    identik → sambungan rapat (tanpa celah akibat sin(2π) ≠ 0).
 * up=true → normal +Y (dasar rongga) · up=false → normal −Y (dasar alas).
 */
function _trCapFan(r, y, seg, up) {
  const R = _trRing(r, y, seg), f = [];
  const C = [0, y + 0, 0];
  for (let k = 0; k < seg; k++) {
    const j = (k + 1) % seg;
    f.push(up ? [C, R[k], R[j]] : [C, R[j], R[k]]);
  }
  return f;
}

/** Cincin datar (bibir cangkir) — normal +Y. */
function _trRim(rOut, rIn, y, seg) {
  const O = _trRing(rOut, y, seg), I = _trRing(rIn, y, seg), f = [];
  for (let k = 0; k < seg; k++) {
    const j = (k + 1) % seg;
    f.push([O[k], I[k], I[j], O[j]]);   // urutan ini → normal +Y
  }
  return f;
}

/**
 * Tabung BER-TAPER sepanjang jalur 2D (bidang XY, z=0), penampang elips.
 * Dipakai untuk gagang: lebar (in-plane) & kedalaman (Z) menyusut ujung ke ujung.
 * @param {Array<[number,number]>} pts  titik jalur [x,y] (block)
 * @param {number} w0,w1  setengah lebar in-plane di ujung awal/akhir (block)
 * @param {number} d0,d1  setengah kedalaman Z di ujung awal/akhir (block)
 * @param {number} seg    segmen penampang
 */
function _trTaperTube(pts, w0, w1, d0, d1, seg) {
  const n = pts.length;
  // tangen per titik (selisih tengah) → normal in-plane
  const rings = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const L = Math.hypot(tx, ty) || 1;
    tx /= L; ty /= L;
    const nx = -ty, ny = tx;               // normal in-plane
    const t = n === 1 ? 0 : i / (n - 1);
    const w = w0 + (w1 - w0) * t;
    const d = d0 + (d1 - d0) * t;
    const ring = [];
    for (let k = 0; k < seg; k++) {
      const ang = (k / seg) * Math.PI * 2;
      const ca = Math.cos(ang) * w, sa = Math.sin(ang) * d;
      ring.push([pts[i][0] + nx * ca + 0, pts[i][1] + ny * ca + 0, sa + 0]);
    }
    rings.push(ring);
  }
  const f = [];
  for (let i = 0; i < rings.length - 1; i++) {
    const A = rings[i], B = rings[i + 1];
    for (let k = 0; k < seg; k++) {
      const j = (k + 1) % seg;
      f.push([A[k], B[k], B[j], A[j]]);
    }
  }
  // tutup KEDUA ujung (fan) supaya watertight walau ujungnya terbenam di dinding
  const capA = rings[0], capB = rings[rings.length - 1];
  const cA = [pts[0][0], pts[0][1], 0], cB = [pts[n - 1][0], pts[n - 1][1], 0];
  for (let k = 0; k < seg; k++) {
    const j = (k + 1) % seg;
    f.push([cA, capA[j], capA[k]]);
    f.push([cB, capB[k], capB[j]]);
  }
  return f;
}

/** Bola/elipsoid (untuk kenop di ujung bawah gagang). */
function _trBlob(cx, cy, cz, rx, ry, rz, seg, lat) {
  const f = [];
  const rows = [];
  for (let i = 0; i <= lat; i++) {
    const phi = (i / lat) * Math.PI;          // 0..π (kutub atas → bawah)
    const sy = Math.cos(phi), sr = Math.sin(phi);
    const row = [];
    for (let k = 0; k < seg; k++) {
      const a = (k / seg) * Math.PI * 2;
      row.push([cx + Math.cos(a) * sr * rx + 0, cy + sy * ry + 0, cz + Math.sin(a) * sr * rz + 0]);
    }
    rows.push(row);
  }
  for (let i = 0; i < lat; i++) {
    const A = rows[i], B = rows[i + 1];
    for (let k = 0; k < seg; k++) {
      const j = (k + 1) % seg;
      f.push([A[k], B[k], B[j], A[j]]);
    }
  }
  return f;
}

/**
 * LOFT persegi: sambung ring [hx, hz, y] berurutan (block), + tutup bawah & atas.
 * Dipakai alas bertingkat: plinth → badan (ledge masuk) → bibir → chamfer.
 */
function _trLoftRect(rings) {
  const R = rings.map(([hx, hz, y]) => [
    [-hx, y, -hz], [hx, y, -hz], [hx, y, hz], [-hx, y, hz],
  ]);
  const f = [];
  for (let i = 0; i < R.length - 1; i++) {
    const A = R[i], B = R[i + 1];
    for (let k = 0; k < 4; k++) {
      const j = (k + 1) % 4;
      f.push([A[k], B[k], B[j], A[j]]);
    }
  }
  const first = R[0], last = R[R.length - 1];
  f.push([first[0], first[3], first[2], first[1]]);   // tutup bawah (normal −Y)
  f.push([last[0], last[1], last[2], last[3]]);       // tutup atas  (normal +Y)
  return f;
}

function _trSeg(x0, x1, y0, y1, z, t) {
  return _stBox(x0, x1, y0, y1, z, z + t);
}

/**
 * Angka 1 / 2 / 3 dari SEGMEN BATANG (tanpa file tekstur).
 * Digit dibangun di muka depan alas, menghadap +Z.
 */
function _trDigitFaces(n, cx, cy, z, t) {
  const W = 0.11, H = 0.18, TH = 0.026;
  const L = cx - W / 2, R = cx + W / 2;
  const T = cy + H / 2, B = cy - H / 2, M = cy;
  const hz = TH / 2;
  // segmen horizontal (atas / tengah / bawah)
  const hTop = () => _trSeg(L, R, T - hz, T + hz, z, t);
  const hMid = () => _trSeg(L, R, M - hz, M + hz, z, t);
  const hBot = () => _trSeg(L, R, B - hz, B + hz, z, t);
  // segmen vertikal (kiri/kanan, atas/bawah)
  const vUL = () => _trSeg(L - hz, L + hz, M, T, z, t);
  const vLL = () => _trSeg(L - hz, L + hz, B, M, z, t);
  const vUR = () => _trSeg(R - hz, R + hz, M, T, z, t);
  const vLR = () => _trSeg(R - hz, R + hz, B, M, z, t);
  let f = [];
  if (n === 1) {
    // ⚠️ FIX bab 197d (terukur dari render 3x):
    //    v1 batang kanan + kaki bawah        → terbaca "J"
    //    v2 kait terpisah di kiri atas       → terbaca titik melayang
    //    v3 palang atas penuh + batang kanan → terbaca "7"
    //    v4 (INI) = BATANG TENGAH + kait kiri-atas + kaki simetris.
    //    Palang atas TIDAK penuh (hanya separuh kiri) supaya tidak jadi "7",
    //    dan kaki bawah SIMETRIS (bukan hanya ke kiri) supaya tidak jadi "J".
    const midV = () => _trSeg(cx - hz, cx + hz, B, T, z, t);
    const flag = () => _trSeg(L, cx, T - 2 * hz, T, z, t);
    const foot = () => _trSeg(L, R, B, B + 2 * hz, z, t);
    f = [...flag(), ...midV(), ...foot()];
  } else if (n === 2) {
    f = [...hTop(), ...vUR(), ...hMid(), ...vLL(), ...hBot()];
  } else {
    f = [...hTop(), ...vUR(), ...hMid(), ...vLR(), ...hBot()];
  }
  return f;
}

/**
 * Tulisan peringkat "1st" / "2nd" / "3rd" dari SEGMEN BATANG (tanpa tekstur).
 * ⚠️ bab 199b (Claude putaran 2): "angka terlalu tipis; pakai tinggi 0.22 dan
 *    tebal goresan 0.045, dan tulis 1st/2nd/3rd seperti referensi, bukan
 *    angka saja."
 *    Digit besar (H 0.22) + 2 huruf kecil (H 0.13) di sebelah kanannya.
 *    Semua digambar menghadap +Z di atas plakat.
 */
function _trRankText(n, cx, cy, z, t) {
  // ⚠️ bab 199g (bug terukur: 216 NaN): versi pertama mencampur SATUAN —
  //    cy/z/t sudah BLOCK tapi lebar/tinggi glyph masih STUDS, lalu trY()
  //    dipakai lagi di dalam → koordinat jauh di luar rentang & NaN.
  //    Sekarang SEMUA perhitungan di dalam fungsi ini BLOCK.
  // ⚠️ bab 199i (Claude putaran 3, prioritas 1): "huruf st/nd/rd tidak terbaca;
  //    huruf kecil terlalu rapat untuk goresan 0.045. Pakai grid 3x5 per huruf,
  //    angka tinggi 0.24 goresan 0.04, sufiks tinggi 0.14 lebar 0.09 goresan
  //    0.03, jarak antarhuruf 0.04, jarak angka→sufiks 0.05, baseline sama."
  const S = (v) => trX(v);              // studs -> block
  const DH = S(0.24), DW = S(0.13);     // digit
  const LHH = S(0.14), LHW = S(0.09);   // sufiks
  const GAPD = S(0.05);                 // angka → sufiks
  const GAPL = S(0.04);                 // antar huruf
  const totalW = DW + GAPD + LHW + GAPL + LHW;
  const x0 = cx - totalW / 2;
  const tD = S(0.04), tL = S(0.03);     // tebal goresan

  const seg = (a, b, c, d, th) => _trSeg(a, b, c, d, z, th);

  // ── DIGIT: batang, bukan grid (bentuk angka sudah benar sejak bab 197d) ──
  const dl = x0, dr = x0 + DW;
  const dcy = cy + S(0.012);
  const dT = dcy + DH / 2, dB = dcy - DH / 2, dM = dcy;
  const dig = [];
  const bar = S(0.045), thin = S(0.0225);
  if (n === 1) {
    // batang tengah + kait kiri atas + kaki simetris (pola bab 197d)
    dig.push(...seg((dl + dr) / 2 - thin, (dl + dr) / 2 + thin, dB, dT, tD));
    dig.push(...seg(dl, (dl + dr) / 2, dT - bar, dT, tD));
    dig.push(...seg(dl, dr, dB, dB + bar, tD));
  } else if (n === 2) {
    dig.push(...seg(dl, dr, dT - bar, dT, tD));
    dig.push(...seg(dr - bar, dr, dM, dT, tD));
    dig.push(...seg(dl, dr, dM - thin, dM + thin, tD));
    dig.push(...seg(dl, dl + bar, dB, dM, tD));
    dig.push(...seg(dl, dr, dB, dB + bar, tD));
  } else {
    dig.push(...seg(dl, dr, dT - bar, dT, tD));
    dig.push(...seg(dr - bar, dr, dM, dT, tD));
    dig.push(...seg(dl + S(0.01), dr, dM - thin, dM + thin, tD));
    dig.push(...seg(dr - bar, dr, dB, dM, tD));
    dig.push(...seg(dl, dr, dB, dB + bar, tD));
  }

  // ── SUFIKS: grid 3x5 per huruf (jauh lebih terbaca di ukuran kecil) ──
  // Pola 3 kolom x 5 baris. "#" = blok terisi. Baseline SAMA dengan angka.
  const GLYPH = {
    s: ['.##', '#..', '.#.', '..#', '##.'],
    t: ['.#.', '.#.', '###', '.#.', '.##'],
    // ⚠️ bab 199k (Claude putaran 4): "n" & "r" masih salah. Pola lama "n"
    //    punya baris penuh di tengah (#.#/###/#.#) sehingga run-length vertikal
    //    menutup lubang di bawah lengkung → terbaca blok "Nd".
    //    "n" baru: baris atas HANYA sel tengah, baris 2-5 dua kaki → lubang
    //    di antara kaki tetap kosong. "r" baru: batang kiri penuh + lengan
    //    hanya di baris 2 (kolom tengah+kanan). "d" sudah benar, tidak diubah.
    n: ['.#.', '#.#', '#.#', '#.#', '#.#'],
    d: ['..#', '..#', '.##', '#.#', '.##'],
    r: ['#..', '###', '#..', '#..', '#..'],
  };
  const suf = n === 1 ? ['s', 't'] : (n === 2 ? ['n', 'd'] : ['r', 'd']);
  const lB = dB;                          // baseline sama
  const lT = lB + LHH;
  const cellW = LHW / 3, cellH = LHH / 5;
  // ⚠️ bab 199j (terukur): 1 kotak per sel = 3x5x6 = 90 quad per huruf →
  //    total melampaui 1500 segitiga. FIX: gabungkan sel yang bersebelahan
  //    HORIZONTAL menjadi satu kotak (run-length). Pola 3x5 tetap sama,
  //    jumlah kotak turun ±45% sehingga kembali di bawah anggaran.
  const letter = (ch, left) => {
    const g = GLYPH[ch] || [];
    const out = [];
    // run-length 2 ARAH: gabung horizontal lalu vertikal (kolom yang sama
    // dan baris berurutan terisi penuh) supaya kotak makin sedikit.
    const used = Array.from({ length: 5 }, () => [false, false, false]);
    for (let r = 0; r < 5; r++) {
      let c = 0;
      while (c < 3) {
        if (g[r][c] !== '#' || used[r][c]) { c++; continue; }
        let e = c;
        while (e + 1 < 3 && g[r][e + 1] === '#') e++;
        // coba lanjut ke bawah kalau seluruh rentang kolom juga terisi
        let rb = r;
        while (rb + 1 < 5) {
          let all = true;
          for (let k = c; k <= e; k++) if (g[rb + 1][k] !== '#') { all = false; break; }
          if (!all) break;
          rb++;
        }
        for (let rr = r; rr <= rb; rr++) for (let k = c; k <= e; k++) used[rr][k] = true;
        const a = left + c * cellW, b = left + (e + 1) * cellW;
        const y0 = lT - (rb + 1) * cellH, y1 = lT - r * cellH;
        out.push(...seg(a, b, y0, y1, tL));
        c = e + 1;
      }
    }
    return out;
  };
  const lx = x0 + DW + GAPD;
  return [...dig, ...letter(suf[0], lx), ...letter(suf[1], lx + LHW + GAPL)];
}

/** Gradasi logam: gelap di bawah, terang di atas (kesan cahaya dari atas).
 *  Dipakai lewat pt.colorFn di _stBuild (bab 198). */
function _trMetalGrad(tag) {
  const c = ST_WARNA[tag] || ST_WARNA.black;
  return (x, y) => {
    const t = (y - TR_Y0) / (TR_Y1 - TR_Y0);      // 0 bawah .. 1 atas
    const f = 0.84 + 0.30 * t;                     // 0.84 → 1.14
    return [c[0] * f, c[1] * f, c[2] * f, c[3]];
  };
}

/** Part Trophy — bentuk IDENTIK untuk ketiga varian; warna via tag. */
export function getTrophyParts(slug) {
  const is2 = slug === 'trophy_2nd';
  const is3 = slug === 'trophy_3rd';
  const tagMetal = is2 ? 'trDiamond' : (is3 ? 'trCopper' : 'trGold');
  const tagBase = is2 ? 'trBaseDark' : (is3 ? 'trBaseTerra' : 'trBaseCream');
  const tagNum = is2 ? 'trNumCyan' : (is3 ? 'trNumOrange' : 'trNumGold');
  const parts = [];

  // ══════════════════════════════════════════════════════════════════════
  // 1. ALAS — loft persegi 4 tier (resep Claude)
  //    tier 1 plinth · tier 2 badan (ledge masuk 0.20) · tier 3 bibir
  //    menjorok 0.06 · tier 4 chamfer atas. hz terluar 1.00 studs → bbox Z
  //    TEPAT 2 studs.
  // ══════════════════════════════════════════════════════════════════════
  // ⚠️ bab 199 (Claude putaran 2, terukur dari foto referensi):
  //    "alas sekitar 0.9x lebar bibir dan 61% lebar total" → lebar alas
  //    1.20 → 0.90 studs (x0.78). TAPI hz TIDAK boleh ikut dikali 0.78:
  //    bbox Z user WAJIB 2 studs, dan itu ditentukan hz tier-1. Jadi hz
  //    tier-1 tetap 1.00 studs; yang menyusut hanya hx + tier dalam.
  //    Tinggi 28% (1.12 studs) TIDAK berubah — sudah benar.
  const BASE_RINGS = [
    [0.90, 1.00, 0.00], [0.90, 1.00, 0.22],   // tier 1: plinth
    [0.76, 0.86, 0.22], [0.76, 0.86, 0.85],   // tier 2: badan
    [0.82, 0.90, 0.85], [0.82, 0.90, 1.00],   // tier 3: bibir menjorok
    [0.64, 0.72, 1.12],                       // tier 4: chamfer atas
  ].map(([hx, hz, y]) => [trX(hx), trX(hz), trY(y)]);
  parts.push({ tag: tagBase, faces: _trLoftRect(BASE_RINGS) });

  // ── PLAT NAMA + ANGKA ──
  // Plakat menonjol 0.05 studs dari dinding badan (z 0.86 → 0.91).
  const PZ0 = trX(0.86), PZ1 = trX(0.91);
  const PY0 = trY(0.34), PY1 = trY(0.72);
  parts.push({ tag: 'trPlaque', faces: _stBox(trX(-0.34), trX(0.34), PY0, PY1, PZ0, PZ1) });
  // ⚠️ bab 199b: Claude — "angka terlalu tipis, pakai tinggi 0.22 tebal 0.045,
  //    tulis 1st/2nd/3rd". Angka diperbesar + huruf kecil di belakangnya.
  parts.push({
    tag: tagNum,
    faces: _trRankText(is2 ? 2 : (is3 ? 3 : 1), 0, (PY0 + PY1) / 2, PZ1, trX(0.045)),
  });

  // ══════════════════════════════════════════════════════════════════════
  // 2. CANGKIR + BATANG + KAKI — SATU profil menerus (revolve)
  // ⚠️ bab 199c (Claude putaran 2): "bawah cangkir masih V, harus U bulat".
  //    Pakai tabel r/R kuarter-elips sqrt(1-(1-t/0.7)^2) yang dia beri:
  //      t    0    .05   .1    .2    .3    .4    .5    .6    .7   1.0
  //      r/R  rbt  .37   .52   .68   .82   .90   .96   .99  1.00 1.02
  //    ⚠️ KOREKSI WAJIB: tabel itu puncaknya 1.02·R. Kalau R dipakai apa
  //       adanya, jari-jari bibir jadi 0.52 block > 0.50 block → bbox Z
  //       membengkak jadi 2.08 studs dan MELANGGAR ukuran user (2 studs).
  //       Jadi seluruh tabel diskalakan 1.00/1.02 supaya bibir TEPAT
  //       1.00 studs = 0.50 block. Rasio bibir/tinggi jadi 2.00/1.88 =
  //       1.064 (target Claude 1.09) — meleset 2.4%, masih dalam
  //       toleransi ukurnya sendiri (±10%).
  //    Anggaran tinggi (block, total 2.00): alas 0.56 · batang+kaki 0.50
  //    · cangkir 0.94. Alas 0.56/2.00 = 28% ✓ (sudah benar sejak bab 198).
  // ══════════════════════════════════════════════════════════════════════
  // Radius luar cangkir per t (studs) — tabel Claude × (1.00/1.02)
  const CUPR = [
    [0.00, 0.2000], [0.05, 0.3696], [0.10, 0.5196], [0.20, 0.6804],
    [0.30, 0.8196], [0.40, 0.9000], [0.50, 0.9600], [0.60, 0.9902],
    [0.70, 1.0000], [1.00, 1.0000],
  ];
  const CUP_Y0 = 2.12, CUP_H = 1.88;   // studs: dasar mangkuk → bibir 4.00
  const cupY = (t) => CUP_Y0 + t * CUP_H;

  const prof = [];
  prof.push([0.004, 1.12]);                        // pusat dasar kaki
  prof.push([0.50, 1.12], [0.50, 1.24]);           // piringan kaki (r 0.50, tebal 0.12)
  prof.push([0.40, 1.30], [0.30, 1.36]);           // dua cincin pembulat
  prof.push([0.20, 1.44], [0.20, 1.94]);           // batang (r 0.20 = 0.10 block)
  prof.push([0.28, 1.98], [0.28, 2.06]);           // cincin kerah (r 0.28)
  prof.push([0.20, 2.12]);                         // leher masuk mangkuk
  for (const [t, r] of CUPR) {                     // dinding LUAR (U, bukan V)
    if (t === 0) continue;                         // t=0 sudah diwakili leher
    prof.push([r, cupY(t)]);
  }
  prof.push([0.85, 4.00]);                         // bibir (tebal 0.15)
  for (let i = CUPR.length - 1; i >= 0; i--) {     // dinding DALAM (cermin −0.15)
    const [t, r] = CUPR[i];
    prof.push([Math.max(0.004, r - 0.15), cupY(t)]);
  }
  prof.push([0.004, 2.14]);                        // pusat dasar rongga
  const CUP_PROFILE = trProf(prof);

  parts.push({
    tag: tagMetal, noFix: true, colorFn: _trMetalGrad(tagMetal),
    faces: [
      ..._trRevolve(CUP_PROFILE, TR_SEG, false),
      // ⚠️ bab 198b/198d (terukur): profil mulai & berakhir di r=0.004 (BUKAN 0)
      //    → 24 tepi terbuka. Ditutup FAN dari titik sumbu ke ring yang SAMA
      //    (trX(0.004), bukan 0.004 mentah) supaya vertex identik & rapat.
      ..._trCapFan(trX(0.004), CUP_PROFILE[0][1], TR_SEG, false),                 // dasar kaki (−Y)
      ..._trCapFan(trX(0.004), CUP_PROFILE[CUP_PROFILE.length - 1][1], TR_SEG, true), // dasar rongga (+Y)
    ],
  });

  // ══════════════════════════════════════════════════════════════════════
  // 3. GAGANG — Catmull-Rom di bidang XY, penampang ber-taper, dicerminkan
  //    A→D lengkung keluar · E→H hook masuk lagi ke cangkir (volute).
  //    Lebar 0.27→0.15 studs, kedalaman Z 0.26→0.16 studs.
  //    ⚠️ Ujung A & H DITANAM di dinding cangkir (bukan melayang seperti
  //       versi bab 197 yang ujungnya menggantung 0.215 studs di udara).
  // ══════════════════════════════════════════════════════════════════════
  // ⚠️ bab 199d (Claude putaran 2, terukur dari sheet):
  //    "titik tempel atas terlalu rendah (±0.15 di bawah bibir); di referensi
  //     gagang keluar TEPAT di tinggi bibir lalu melebar horizontal dulu
  //     (bahu) sebelum turun."
  //    → titik A dinaikkan ke y = bibir − 0.04 = 3.96, dan ditambah titik B
  //      di x +0.12 dengan y hampir sama (bahu horizontal).
  //    Titik terluar harus x ≈ ±1.35 studs (sisi luar 1.35 + 0.15 = 1.50).
  // ══════════════════════════════════════════════════════════════════════
  // ⚠️ bab 200 — GAGANG DIDESAIN ULANG TOTAL (laporan user: "lengkungannya
  //    kamu salah total"). Diagnosis terukur dari render saya sendiri:
  //      · ujung bawah gagang MENGGANTUNG TERBUKA di udara (open hook),
  //        tidak menyatu ke dinding cangkir → terbaca seperti kawat bengkok.
  //      · tidak ada BAHU horizontal di atas → langsung melengkung turun
  //        ("limp, droopy") bukan bentuk kuping/ear yang tegas.
  //      · tebal seragam & tipis seperti gantungan baju.
  //    Referensi (6 foto, diukur via zoom): gagang keluar dari dinding
  //    TEPAT di bawah bibir, naik sedikit (puncak DI BAWAH garis bibir),
  //    bahu keluar horizontal, siku tajam di jam 2-3, turun menyusur,
  //    lalu MENYATU KEMBALI ke dinding cangkir di jam 7-8 (loop TERTUTUP),
  //    dan ada TETESAN/teardrop menggantung KE BAWAH dari sambungan bawah.
  //    Semua koordinat di bawah dalam STUDS (x = jarak dari sumbu cangkir).
  // ══════════════════════════════════════════════════════════════════════
  // Puncak gagang 3.85 + setengah tebal 0.14 = 3.99 < 4.00 → bbox Y AMAN.
  // Titik terakhir (0.60, 2.42) berada TEPAT di/dalam dinding cangkir
  // (radius cangkir di y=2.42 ≈ 0.64) → loop benar-benar MENYATU, bukan
  // menggantung. Titik terluar 1.36 + tebal 0.14 = 1.50 → bbox X = 3.00.
  // ══════════════════════════════════════════════════════════════════════
  // bab 201 — FIX "GAGANG TEMBUS KE DALAM CANGKIR" (laporan user, terukur)
  // ⚠️ AKAR (diukur, bukan ditebak): titik tanam ATAS dulu di r=0.62 studs,
  //    padahal di y=3.72 dinding cangkir membentang r 0.850 (dalam) ..
  //    1.000 (luar). Jadi ujung atas gagang MENGGANTUNG DI DALAM RONGGA,
  //    bukan menempel di dinding — dan tabungnya (setengah-lebar 0.085)
  //    menembus dinding ke arah dalam sejauh 0.2769 studs pada y=3.88.
  //    Itu yang terlihat sebagai "gagang tembus dikit ke dalam cangkir".
  //    FIX: titik tanam atas DIPINDAH ke DALAM MATERIAL DINDING (r 0.98,
  //    yaitu di antara 0.850 dan 1.000). Dengan begitu tepi-dalam tabung
  //    = 0.98 − 0.085 = 0.895 > 0.850 → TIDAK menyentuh rongga sama sekali,
  //    sementara sisi luarnya tetap menyembul 0.065 studs sebagai las.
  //    Titik 2..9 TIDAK DIUBAH → siluet yang sudah disetujui user aman.
  // ══════════════════════════════════════════════════════════════════════
  const CTRL = [
    [0.98, 3.66],   // 0: TANAM di MATERIAL DINDING (bukan di rongga)
    [1.12, 3.76],   // 1: naik + keluar (puncak, di bawah bibir)
    [1.16, 3.75],   // 2: bahu mulai horizontal
    [1.34, 3.58],   // 3: SIKU tajam (jam 2-3)
    [1.38, 3.30],   // 4: turun menyusur (terluar)
    [1.32, 2.98],   // 5:
    [1.18, 2.72],   // 6: menyusur masuk (jam 7-8)
    [0.96, 2.52],   // 7:
    [0.74, 2.44],   // 8: mendekati dinding
    [0.58, 2.42],   // 9: MASUK ke dinding cangkir → loop TERTUTUP
  ];
  // Catmull-Rom (centripetal) → sampel halus
  const catmull = (P, samples) => {
    const out = [];
    const g = (i) => P[Math.max(0, Math.min(P.length - 1, i))];
    for (let s = 0; s < samples; s++) {
      const u = (s / (samples - 1)) * (P.length - 1);
      const i = Math.min(P.length - 2, Math.floor(u));
      const t = u - i;
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      const t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t
        + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
    return out;
  };
  const HANDLE_SAMPLES = 9;
  const hp = catmull(CTRL, HANDLE_SAMPLES);
  // bab 200: gagang dipertebal (dulu 0.27/0.15 = seperti kawat).
  const W0 = trX(0.34 / 2), W1 = trX(0.20 / 2);
  const D0 = trX(0.30 / 2), D1 = trX(0.20 / 2);
  const gradH = _trMetalGrad(tagMetal);

  // ⚠️ bab 198c (terukur): cara LAMA menghitung skala X memakai tebakan
  //    `max(path)+halfW` → hasil bbox X cuma 2.9549 studs (kurang 0.045).
  //    Sebab: setengah-lebar NYATA di titik terlebar bukan 0.135 studs
  //    (taper sudah menyusut ke ≈0.109 di situ), jadi tebakan itu kelewat
  //    besar → faktor skala kelewat kecil. FIX: bangun tabungnya dulu, UKUR
  //    max|X| sebenarnya, lalu skala & ulangi sampai konvergen (3 putaran).
  const buildHandle = (sgn, kx) => {
    const path = hp.map(([x, y]) => [sgn * trX(x * kx), trY(y)]);
    return { path, faces: _trTaperTube(path, W0, W1, D0, D1, 6) };
  };
  const maxAbsX = (faces) => {
    let m = 0;
    for (const f of faces) for (const v of f) m = Math.max(m, Math.abs(v[0]));
    return m;
  };
  const TARGET = trX(1.50);              // setengah panjang 3 studs
  let kx = 1.0;
  for (let it = 0; it < 3; it++) {
    const { faces } = buildHandle(1, kx);
    const m = maxAbsX(faces);
    kx *= TARGET / m;
  }
  const { path: HP, faces: handleFaces } = buildHandle(1, kx);

  for (const sgn of [1, -1]) {
    const path = HP.map(([x, y]) => [sgn * x, y]);
    parts.push({
      tag: tagMetal, noFix: true, colorFn: gradH,
      faces: sgn === 1 ? handleFaces : _trTaperTube(path, W0, W1, D0, D1, 6),
    });
    // ══ bab 200 — TETESAN (teardrop) DI SAMBUNGAN BAWAH ══
    // ⚠️ Dulu: bola kecil di UJUNG path. Salah dua kali:
    //    (1) path-nya menggantung terbuka, jadi bola itu terbaca sebagai
    //        "kait" di udara, bukan ornamen;
    //    (2) di referensi tetesan justru MENGGANTUNG KE BAWAH dari
    //        sambungan bawah (jam 6), bukan menempel di ujung gagang.
    //    Sekarang path SUDAH menyatu ke dinding (loop tertutup), dan
    //    tetesan digantung di bawah titik sambungan (x ≈ 0.66, y turun).
    //    Bentuk: tetesan memanjang ke bawah (ry > rx), ujung bawah lancip.
    const J = [0.66, 2.40];                    // titik sambungan bawah (studs)
    const dropH = 0.24;                        // panjang tetesan (studs)
    const dropR = 0.105;                       // radius tetesan (studs)
    // 3 ruas mengecil ke bawah = siluet tetesan, bukan bola.
    const segs = [
      [1.00, 0.00, 1.00],    // [skalaR, yOffset, skalaH]
      [0.62, -0.105, 0.80],
    ];
    for (const [sr, yo, sh] of segs) {
      parts.push({
        tag: tagMetal, noFix: true, colorFn: gradH,
        faces: _trBlob(sgn * trX(J[0]), trY(J[1] + yo), 0,
          trX(dropR * sr), trX(dropH * 0.5 * sh), trX(dropR * sr * 0.78), 8, 3),
      });
    }
  }

  return parts;
}

// ══════════════════════════════════════════════════════════════════════════
// bab 200 — CACHE GEOMETRI TROPHY (perbaikan "NGELEG")
// ⚠️ AKAR (terukur): makeTrophyGeometry memakan 13.31 ms dan dipanggil ULANG
//    setiap kali block ditaruh / ghost diganti / preview dibuka. Untuk block
//    biasa (kubus 8 segitiga) itu tak terasa; untuk trophy 1472 segitiga
//    dengan ~10 part + weld + colorFn per-vertex, 13 ms SINKRON di main
//    thread = frame drop yang terasa sebagai "ngeleg".
//    FIX: simpan GEOMETRI MASTER per-slug, lalu kembalikan CLONE darinya.
//    ⚠️ WAJIB clone (bukan kembalikan master): simulator memanggil
//    geometry.dispose() di banyak jalur (hapus block, delete all, undo).
//    Kalau master ikut di-dispose, cache jadi rusak dan trophy berikutnya
//    TIDAK TERLIHAT. Clone() jauh lebih murah daripada membangun ulang
//    (±0.15 ms vs 13.31 ms) dan tiap pemakai bebas memiliki/dispose-nya.
const _TR_GEO_MASTER = new Map();
/** Geometri Trophy (dipakai preview/ghost/ikon/place).
 *  Mengembalikan CLONE yang dimiliki pemanggil — aman di-dispose. */
export function makeTrophyGeometry(THREE, slug) {
  let master = _TR_GEO_MASTER.get(slug);
  if (!master) {
    master = _stBuild(THREE, getTrophyParts(slug));
    _TR_GEO_MASTER.set(slug, master);
  }
  return master.clone();
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
  // ⚠️ bab 169: Medium Treasure — WAJIB PENUH (badan+tutup+mahkota).
  if (slug === NSI_MT_SLUG) return makeMediumTreasureFullGeometry(THREE);
  // ⚠️ bab 178: Big Treasure — WAJIB PENUH (badan+tutup+sayap+X merah).
  if (slug === NSI_BT_SLUG) return makeBigTreasureFullGeometry(THREE);
  // bab 180: Pine Tree
  if (slug === NSI_PT_SLUG) return makePineTreeGeometry(THREE);
  // bab 197/198: Trophy 1st/2nd/3rd (bentuk sama, warna beda)
  if (NSI_TR_SLUGS.indexOf(slug) >= 0) return makeTrophyGeometry(THREE, slug);
  // bab 205: Torch (badan saja — api & cahaya dipasang di BlockSimulator3D)
  if (slug === NSI_TC_SLUG) return makeTorchGeometry(THREE);
  // bab 206: Lamp (badan saja — cahaya dipasang di BlockSimulator3D)
  if (slug === NSI_LP_SLUG) return makeLampGeometry(THREE);
  // bab 208: Candle (badan saja — api & cahaya dipasang di BlockSimulator3D)
  if (slug === NSI_CD_SLUG) return makeCandleGeometry(THREE);
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

// ── NSI LEVEL 2 #14: LAMP (lentera) — bab 206 ──
// Permintaan user (verbatim, 2026-10-24):
//   *"anggota NSI level 2 terbaru sudah saya kirim ... nama identitasnya adalah
//    'Lamp' dan info tambahan : Lamp : panjang 2 studs, lebar 2 studs, tinggi
//    3.5 studs"* + *"dia juga bisa memancarkan cahaya sama seperti sebelumnya"*
//
// SYARAT MUTLAK:
//   panjang 2.00 studs · lebar 2.00 studs · tinggi 3.50 studs (TOTAL)
//   + CAHAYA (PointLight, dipasang di BlockSimulator3D seperti Torch)
//
// ══ ANGKA DARI PENGUKURAN PIKSEl, BUKAN TEBAKAN ══
// Sumber: 7 screenshot referensi (folder image/folder kerja). Objek diisolasi
// lewat segmentasi warna, diukur baris-per-baris, lalu dikonversi:
//   skala 0.01149 stud/px (lebar maks 174 px = 2.00 studs, frame F1 face-on)
//   koreksi perspektif kamera 10-20° di atas: w/(1-0.035*(y-0.98))
//
// ══ 3 KOREKSI BESAR DARI REVIEW CLAUDE (putaran 1-3, semua TERVERIFIKASI) ══
//  1. Frame diagonal (H/W 1.163) TIDAK BOLEH dipakai untuk lebar — yaw 45°
//     melebarkan ×1.41. Yang benar frame face-on F1 (H/W 1.644) & F6 (1.565).
//  2. "Tiang sudut" yang saya kira ada ternyata TARING. Bukti terukur: tebal
//     logam per sisi menurun monoton 0.586 → 0.063 stud dari y=0.63 ke y=1.79.
//     Tiang berpenampang konstan akan DATAR. Ini segitiga.
//  3. Kaca TIDAK menyempit (prisma konstan 1.78). Penurunan −7% yang terukur
//     itu perspektif (bawah lebih jauh dari kamera), bukan geometri.
//
// ══ JEBAKAN GEOMETRI (dari Claude, WAJIB DIPATUHI) ══
//  A. `_stBuild` SELALU memanggil `_stFaceOutward` yang membalik segitiga
//     berdasarkan CENTROID PART. Untuk part GABUNGAN yang tidak cembung
//     (puncak+pelat+hip), centroid jatuh di luar bahan → flip ACAK.
//     SOLUSI: puncak, pelat+hip (2 segmen, cembung menurun), alas = PART
//     TERPISAH. Tiap taring = part sendiri (tetrahedron cembung).
//  B. TIDAK BOLEH ada tutup internal (puncak-bawah, pelat-atas, hip-atas):
//     menghasilkan wajah berlawanan yang saling berhimpit → z-fighting.
//  C. Tutup bawah atap (y=1.00) & tutup atas alas (y=3.00) WAJIB ADA karena
//     terlihat dari balik kaca. Kaca TIDAK boleh punya tutup atas/bawah
//     (akan z-fight dengan kedua tutup itu).
//  D. Kaca: y 0.98..3.02 (masuk 0.02 ke atap & alas) → tidak ada celah rambut.
//     Taring: mulai 0.01 di dalam atap/alas → zona koplanar tak terlihat.
//  E. Inti cahaya: SATU KOTAK 0.72 persegi (bukan 2 bilah silang). Bentuk
//     "V/M" di frame diagonal = inti kotak yang tertutup taring depan.
//
// ══ SATUAN: angka di bawah dalam STUD (mudah dicocokkan ke syarat user) ══
// Konversi ke BLOCK lewat toX/toY (1 stud = 0.5 block).
// ══════════════════════════════════════════════════════════════════════════

const LP_STUD = 0.5;               // 1 stud = 0.5 block
const LP_HALF_Y = 0.875;           // setengah tinggi bbox (block) → −0.875..+0.875
const toLX = (stud) => stud * LP_STUD;                 // X/Z: pusat origin
// ⚠️ BUG YANG DITEMUKAN SAAT VERIFIKASI OFFLINE: versi pertama memakai
//    toLY = -HALF + stud*0.5 → stud 0 (PUNCAK) jatuh di DASAR bbox = bentuk
//    TERBALIK VERTIKAL. Sekarang stud 0 = ATAS bbox (+HALF), stud 3.5 = BAWAH.
const toLY = (stud) => LP_HALF_Y - stud * LP_STUD;      // Y: stud 0 = ATAS bbox

// ── Pembagian tinggi (STUD, dari ATAS) — tabel final Claude, jumlah TEPAT 3.50 ──
const LP_Y_TOP0    = 0.00, LP_Y_TOP1    = 0.15;   // puncak (piramida terpancung)
const LP_Y_PLATE0  = 0.15, LP_Y_PLATE1  = 0.30;   // pelat puncak
const LP_Y_HIP_A0  = 0.30, LP_Y_HIP_A1  = 0.65;   // hip segmen 1 (landai)
const LP_Y_HIP_B0  = 0.65, LP_Y_HIP_B1  = 1.00;   // hip segmen 2 (landai)
const LP_Y_GLASS0  = 1.00, LP_Y_GLASS1  = 3.00;   // kaca prisma
const LP_Y_BASE0   = 3.00, LP_Y_BASE1   = 3.20;   // alas dinding
const LP_Y_CHAM0   = 3.20, LP_Y_CHAM1   = 3.50;   // alas chamfer
// Taring (TUMPANG-TINDIH dengan pita kaca, tidak menambah total)
const LP_Y_FANGT0  = 1.00, LP_Y_FANGT1  = 1.96;   // taring atas: 1.00 → ujung 1.96
const LP_Y_FANGB0  = 3.00, LP_Y_FANGB1  = 2.42;   // taring bawah: 3.00 → ujung 2.42
const LP_Y_CORE0   = 0.95, LP_Y_CORE1   = 3.05;   // inti cahaya (masuk 0.05 ke atap & alas)

// ── Lebar (STUD) — hasil ukur + koreksi Claude ──
const LP_W_TOP0    = 0.31;   // puncak atas
const LP_W_TOP1    = 0.60;   // puncak bawah  (lompatan +19px terukur di y=0.135)
const LP_W_PLATE1  = 1.17;   // pelat bawah
const LP_W_HIP_A1  = 1.69;   // hip segmen 1 bawah
const LP_W_MAX     = 2.00;   // hip segmen 2 bawah = LEBAR MAKS (tepi atap)
const LP_W_GLASS   = 1.78;   // kaca prisma konstan (terukur 1.72-1.74 raw)
const LP_W_BASE    = 1.94;   // alas dinding
const LP_W_BASE_B  = 0.98;   // alas bawah (chamfer) — 1.09 di y=3.43, extrapolasi 0.98
const LP_W_CORE    = 0.72;   // inti cahaya (kotak)
// ⚠️ BUG TERVERIFIKASI (ikon 2026-10-24): kaki 0.30/0.31 membuat taring jadi
//    SILVER TIPIS di sudut bbox → terbaca sebagai "pecahan segitiga melayang"
//    (diukur: 6 klaster terpisah 120-280 px di tepi kiri/kanan ikon).
//    Angka benar = hasil ukur ketebalan logam per sisi pada referensi:
//    0.586 studs di puncak kaca, menyempit ke 0.063 di ujung taring.
//    Kaki selebar ini membuat taring MENYATU dengan pita atap/alas.
// ⚠️ GEOMETRI ASLI (referensi) = TARING BESAR yang membentuk SUDUT LENTERA.
//    Versi pertama memakai kaki 0.30 (silver tipis) → terukur 6-7 "pecahan
//    melayang" di ikon. Kaki 0.58 belum cukup: rangka tetap terputus karena
//    kaca (1.78) lebih lebar dari taring, sehingga atap & alas terpisah.
//    Untuk membuat 4 sudut MENYATU, kaki harus ≥ (LP_W_MAX - LP_W_GLASS)/2
//    + margin, supaya taring menutupi tepi kaca dan menyambung ke part lain.
const LP_FANG_KAKI_T = 0.72; // kaki taring atas per sisi
const LP_FANG_KAKI_B = 0.72; // kaki taring bawah per sisi
// ⚠️ AKAR MASALAH "PECAHAN MELAYANG" (terukur 3 iterasi, ikon 2026-10-24):
//    Pangkal taring diletakkan di TEPI TERLUAR atap (stud 0.99, h=1.00) —
//    padahal atap hanya mencapai lebar 2.00 studs TEPAT di stud 1.00.
//    Akibatnya pangkal taring hanya MENYENTUH SATU TITIK di rusuk atap →
//    tidak ada volume yang bertumpuk → taring terlihat mengambang.
//    FIX: pangkal DIPINDAH KE DALAM atap/alas (stud 0.93 / 3.07) dengan
//    setengah-lebar SESUAI PROFIL di ketinggian itu (0.95 studs), sehingga
//    sebagian pangkal benar-benar berada DI DALAM bahan = tersambung solid.
const LP_FANG_BASE_H   = 0.95;  // setengah-lebar pangkal taring (stud)
const LP_FANG_TOP_Y    = 0.93;  // pangkal taring atas (stud, di DALAM atap)
const LP_FANG_BOT_Y    = 3.07;  // pangkal taring bawah (stud, di DALAM alas)
// Ujung taring ditarik KE DALAM supaya menimpa siluet kaca (setengah-lebar
// 0.89 studs) → tidak ada latar putih di celah taring–kaca.
// 0.95 - 0.15 = 0.80 studs = di dalam kaca.
const LP_FANG_TIP_IN = 0.15;

/** Bidang datar horizontal (quad) pada ketinggian y, setengah lebar h. */
function _lpSlab(h, y) {
  const a = [-h, y, -h], b = [h, y, -h], c = [h, y, h], d = [-h, y, h];
  return [[a, b, c, d]];
}

/** Frustum persegi tertutup: dari (h0, y0) ke (h1, y1). Sisi + tutup atas/bawah. */
function _lpFrustum(h0, y0, h1, y1, capTop, capBot) {
  const f = [];
  const A = [[-h0, y0, -h0], [h0, y0, -h0], [h0, y0, h0], [-h0, y0, h0]];  // y0 = ATAS
  const B = [[-h1, y1, -h1], [h1, y1, -h1], [h1, y1, h1], [-h1, y1, h1]];  // y1 = BAWAH
  // ⚠️ URUTAN VERTEX DIPILIH SUPAYA NORMAL SUDAH KELUAR SEJAK AWAL.
  //    Versi pertama memakai [A[k],A[j],B[j],B[k]] → SEMUA 10/10 segitiga
  //    menghadap DALAM (terverifikasi offline). Urutan [B[k],A[k],A[j],B[j]]
  //    menghasilkan normal keluar untuk keempat sisi (diuji lewat cross-product).
  for (let k = 0; k < 4; k++) {
    const j = (k + 1) % 4;
    f.push([B[k], A[k], A[j], B[j]]);
  }
  // tutup atas (+Y): urutan A0→A3→A2→A1 · tutup bawah (−Y): A0→A1→A2→A3
  if (capTop) f.push([A[0], A[3], A[2], A[1]]);
  if (capBot) f.push([B[0], B[1], B[2], B[3]]);
  return f;
}

/**
 * Taring = TETRAHEDRON di satu sudut denah.
 * Titik: A = sudut (sx*h, y0, sz*h) · B,C = sepanjang 2 dinding · T = ujung.
 * Bidang luar A-B-T dan A-C-T rata dengan dinding (sesuai Claude Q6).
 * @param {number} sx,sz  tanda sudut (-1 / +1)
 * @param {number} h      setengah lebar dinding tempat taring menempel
 * @param {number} y0     y pangkal (menempel dinding)
 * @param {number} yTip   y ujung lancip
 * @param {number} kaki   panjang kaki sepanjang dinding (stud→block)
 */
function _lpFang(sx, sz, h, y0, yTip, kaki, kakiTip) {
  const A = [sx * h, y0, sz * h];
  const B = [sx * (h - kaki), y0, sz * h];
  const C = [sx * h, y0, sz * (h - kaki)];
  // ⚠️ BUG TERVERIFIKASI (ikon 2026-10-24): versi pertama menaruh ujung T tepat
  //    di sudut bbox (h). Kaca hanya selebar 0.89, jadi T (1.00) menonjol KELUAR
  //    siluet kaca → latar putih terlihat di celah antara taring & kaca →
  //    taring terbaca sebagai "pecahan melayang" (terukur 4 klaster sisa).
  //    Di referensi taring MELENGKUNG KE DALAM: ujung lebih dekat poros
  //    daripada pangkal. kakiTip menarik T masuk sehingga ujungnya MENIMPA
  //    siluet kaca → rangka tersambung secara visual.
  const kt = (kakiTip === undefined ? 0 : kakiTip);
  const T = [sx * (h - kt), yTip, sz * (h - kt)];
  // ⚠️ BUG TERVERIFIKASI OFFLINE (2 iterasi): winding TIDAK bisa dipatok dengan
  //    satu aturan tanda. ADA DUA sumber pencerminan yang membalik handedness:
  //      (1) sudut denah  → tanda sx*sz
  //      (2) arah taring  → yTip di ATAS atau DI BAWAH y0 (taring atas vs bawah)
  //    Kombinasi keduanya = 4 kasus, dan aturan "sx*sz>0" hanya menutup separuh
  //    (terukur: tetap 4 dari 8 taring menghadap DALAM).
  //    SOLUSI PASTI: orientasikan tiap segitiga terhadap CENTROID TETRAHEDRON.
  //    Untuk tetrahedron, centroid 4 titik SELALU di dalam volume → uji
  //    "normal menjauhi centroid" berlaku untuk keempat sudut & kedua arah.
  // ⚠️ BUG TERVERIFIKASI (render ikon 2026-10-24): versi pertama hanya membuat
  //    3 sisi ([A,B,T], [A,T,C], [A,C,B]) dan MENGHILANGKAN sisi miring B-C-T.
  //    Akibatnya taring = CANGKANG TERBUKA: dari kamera ikon terlihat sebagai
  //    6-7 "pecahan segitiga hitam melayang" di sekitar lentera (diukur: 7
  //    klaster terpisah, 120-280 px masing-masing). Tetrahedron WAJIB 4 sisi.
  const tri = [[A, B, T], [A, T, C], [A, C, B], [B, C, T]];
  const cx = (A[0] + B[0] + C[0] + T[0]) / 4;
  const cy = (A[1] + B[1] + C[1] + T[1]) / 4;
  const cz = (A[2] + B[2] + C[2] + T[2]) / 4;
  return tri.map(([p, q, r]) => {
    const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    const v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
    const nx = u[1] * v[2] - u[2] * v[1];
    const ny = u[2] * v[0] - u[0] * v[2];
    const nz = u[0] * v[1] - u[1] * v[0];
    const mx = (p[0] + q[0] + r[0]) / 3 - cx;
    const my = (p[1] + q[1] + r[1]) / 3 - cy;
    const mz = (p[2] + q[2] + r[2]) / 3 - cz;
    return (nx * mx + ny * my + nz * mz < 0) ? [p, r, q] : [p, q, r];
  });
}


/**
 * Part Lamp: GEOMETRI SAJA (tanpa cahaya).
 * Cahaya = PointLight (dipasang di BlockSimulator3D, pola sama seperti Torch).
 */
export function getLampParts() {
  const parts = [];

  // ══ 1. PUNCAK — piramida terpancung (PART SENDIRI, cembung) ══
  // Jebakan A: JANGAN gabung dengan pelat/hip → centroid di luar bahan.
  parts.push({
    tag: 'lampMetal',
    faces: _lpFrustum(toLX(LP_W_TOP0 / 2), toLY(LP_Y_TOP0),
                      toLX(LP_W_TOP1 / 2), toLY(LP_Y_TOP1),
                      true, false),   // tutup atas ADA, tutup bawah TIDAK (jebakan B)
  });

  // ══ 2. PELAT + HIP (2 segmen) — SATU PART CEMBUNG MENURUN ══
  // Kemiringan 2.0 → 0.7 → 0.44 (menurun monoton) = cembung → flip aman.
  // Tanpa tutup internal antar segmen (jebakan B), hanya tutup BAWAH di y=1.00
  // yang WAJIB ada karena terlihat dari balik kaca (jebakan C).
  parts.push({
    tag: 'lampMetal',
    faces: [
      ..._lpFrustum(toLX(LP_W_TOP1 / 2), toLY(LP_Y_PLATE0),
                    toLX(LP_W_PLATE1 / 2), toLY(LP_Y_PLATE1), false, false),
      ..._lpFrustum(toLX(LP_W_PLATE1 / 2), toLY(LP_Y_HIP_A0),
                    toLX(LP_W_HIP_A1 / 2), toLY(LP_Y_HIP_A1), false, false),
      ..._lpFrustum(toLX(LP_W_HIP_A1 / 2), toLY(LP_Y_HIP_B0),
                    toLX(LP_W_MAX / 2), toLY(LP_Y_HIP_B1), false, true),
    ],
  });

  // ══ 3. KACA — prisma persegi, TANPA tutup atas/bawah (jebakan C) ══
  // y 0.98..3.02 → masuk 0.02 ke atap & alas supaya tidak ada celah rambut (D).
  parts.push({
    tag: 'lampGlass',
    faces: _lpFrustum(toLX(LP_W_GLASS / 2), toLY(LP_Y_GLASS0 - 0.02),
                      toLX(LP_W_GLASS / 2), toLY(LP_Y_GLASS1 + 0.02), false, false),
  });

  // ══ 4. ALAS — dinding + chamfer (SATU PART, cembung) ══
  parts.push({
    tag: 'lampMetal',
    faces: [
      // tutup ATAS alas di y=3.00 WAJIB (terlihat dari balik kaca, jebakan C)
      // ⚠️ capBot = false: chamfer di bawahnya menyambung RAPAT (lebar sama
      //    1.94 di y=3.20) → tutup di sini = tutup INTERNAL (z-fight, jebakan B).
      ..._lpFrustum(toLX(LP_W_BASE / 2), toLY(LP_Y_BASE0),
                    toLX(LP_W_BASE / 2), toLY(LP_Y_BASE1), false, false),
      ..._lpFrustum(toLX(LP_W_BASE / 2), toLY(LP_Y_CHAM0),
                    toLX(LP_W_BASE_B / 2), toLY(LP_Y_CHAM1), false, true),
    ],
  });

  // ══ 5. TARING — 8 tetrahedron (4 sudut atap + 4 sudut alas) ══
  // Claude Q6: BUKAN tiang, BUKAN pelat. Tiap taring PART SENDIRI (cembung).
  // Mulai 0.01 di DALAM atap/alas → zona koplanar tak terlihat (D).
  const hAtap = LP_W_MAX / 2;
  const hAlas = LP_W_BASE / 2;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      // taring atas: pangkal di atap, ujung menjuntai ke bawah
      parts.push({
        tag: 'lampMetal',
        faces: _lpFang(sx, sz, toLX(LP_FANG_BASE_H),
                       toLY(LP_FANG_TOP_Y), toLY(LP_Y_FANGT1),
                       toLX(LP_FANG_KAKI_T), toLX(LP_FANG_TIP_IN)),
      });
      // taring bawah: pangkal di alas, ujung menjuntai ke atas
      parts.push({
        tag: 'lampMetal',
        faces: _lpFang(sx, sz, toLX(LP_FANG_BASE_H),
                       toLY(LP_FANG_BOT_Y), toLY(LP_Y_FANGB1),
                       toLX(LP_FANG_KAKI_B), toLX(LP_FANG_TIP_IN)),
      });
    }
  }

  // ══ 6. INTI CAHAYA — satu kotak 0.72 (jebakan E) ══
  parts.push({
    tag: 'lampCore',
    faces: _lpFrustum(toLX(LP_W_CORE / 2), toLY(LP_Y_CORE0),
                      toLX(LP_W_CORE / 2), toLY(LP_Y_CORE1), true, true),
  });

  return parts;
}

/**
 * Geometri Lamp DENGAN 3 GROUP MATERIAL (0=logam, 1=kaca, 2=inti).
 * ⚠️ KENAPA HARUS GROUP, BUKAN SATU MATERIAL:
 *    Lamp butuh 3 perilaku material yang TIDAK bisa disatukan —
 *    logam OPAQUE, kaca TRANSPARAN, inti UNLIT (MeshBasic).
 *    Kalau dipaksa satu material:
 *      - transparent:true  → logam ikut tembus pandang (salah)
 *      - transparent:false → kaca opaque MENUTUPI inti (cahaya tak terlihat)
 *    Solusi: satu geometry + addGroup() → Mesh menerima ARRAY material.
 *    Urutan group HARUS sama dengan urutan material di makeLampMaterials().
 *
 * Bbox WAJIB [1.0, 1.75, 1.0] block (2 x 3.5 x 2 studs).
 */
export function makeLampGeometry(THREE) {
  const parts = getLampParts();
  const URUT = ['lampMetal', 'lampGlass', 'lampCore'];
  const geos = URUT.map((tag) => _stBuild(THREE, parts.filter((p) => p.tag === tag)));

  const pos = [], uv = [], col = [];
  const out = new THREE.BufferGeometry();
  let offset = 0;
  geos.forEach((g) => {
    const P = g.getAttribute('position'), U = g.getAttribute('uv'), C = g.getAttribute('color');
    for (let i = 0; i < P.count; i++) {
      pos.push(P.getX(i), P.getY(i), P.getZ(i));
      uv.push(U ? U.getX(i) : 0, U ? U.getY(i) : 0);
      col.push(C ? C.getX(i) : 1, C ? C.getY(i) : 1, C ? C.getZ(i) : 1);
    }
    out.addGroup(offset, P.count, geos.indexOf(g));
    offset += P.count;
  });
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  out.computeVertexNormals();
  return out;
}

// ── PARAMETER CAHAYA (dipakai BlockSimulator3D) — satuan BLOCK ──
// Claude putaran 1: Lamp tanpa flicker (lentera, bukan api terbuka).
// Rasio I/D² = 40/16² = 0.156 ≈ Torch 60/20² = 0.150 → falloff seragam.
export const LP_LIGHT_Y = toLY(2.00);      // pusat inti (2.00 dari atas) → −0.125 block
export const LP_LIGHT_COLOR = 0xffe9a0;    // kuning hangat pucat
// ══ KALIBRASI TERUKUR (bukan tebakan) ══
// Metode: render kotak putih di scene hitam, ukur luminance piksel tengah pada
// jarak 5/6/8/10/12/14, bandingkan dengan Torch (I=60, D=20) di setup identik.
//
// Sapuan I pada D=18 (rata-rata |rasio-1|):
//   I=20 → 0.067 (rasio 0.85-1.07)   I=26 → 0.105
//   I=22 → 0.073 (rasio 0.88-1.13) ← DIPAKAI
//   I=24 → 0.075                     I=28 → 0.136
//
// Kenapa I=22 dan bukan 40 (nilai awal saya):
//   Warna Lamp #ffe9a0 jauh lebih PUCAT dari torch #ff7a1a. Pada luminance
//   setara, kanal BIRU Lamp terukur 5.3x lebih terang (rasio B 5.318 di d6)
//   sementara MERAH 0.84x lebih redup. Artinya I=40 membuat Lamp terang
//   berlebihan secara persepsi walau "terasa" seimbang di luminance.
//   I=22 menyamakan luminance tanpa saturasi putih (saturasi terukur: 0).
export const LP_LIGHT_INTENSITY = 22;
// D=18 (bukan 16): pada D=16 kurva Lamp TERPOTONG mendadak —
// terukur d16=8.1 vs torch 24.5 (rasio 0.33), lalu d20=0 vs torch 2.2.
// D=18 memberi ekor yang lebih halus (d16 rasio 0.79, d18 0.26).
export const LP_LIGHT_DISTANCE = 18;
export const LP_LIGHT_DECAY = 2;

// ══════════════════════════════════════════════════════════════════════════
// ── NSI LEVEL 2 #13: TORCH (obor) — bab 205 ──
// Permintaan user (verbatim, 2026-10-24):
//   *"kita akan memasuki NSI yang menghasilkan cahaya disekitarnya ... identitasnya
//    adalah 'Torch' ... panjang dan lebar gagangnya tu 0.8 studs sama, serta
//    panjang dan lebar penampangnya itu 1.5 studs sama, kemudian tinggi 6 studs
//    (beserta bara apinya), bara apinya adalah animasi yang terus bergerak jadi
//    gak diem kaku gitu doang"*
//
// SYARAT MUTLAK:
//   gagang    : 0.80 x 0.80 studs (panjang = lebar)
//   penampang : 1.50 x 1.50 studs (cup di bibir)
//   tinggi    : 6.00 studs TOTAL, TERMASUK bara api
//   + CAHAYA di sekitarnya (PointLight, dipasang di BlockSimulator3D)
//   + bara api BERANIMASI terus (shader uTime, bukan mesh diam)
//
// PROPORSI: hasil ukur piksel 5 screenshot referensi (PIL+numpy, objek 178x755 px)
//   bara 283 px (37.5%) · cup 190 px (25.2%) · gagang 282 px (37.3%) → 6.00 studs
//
// ── REVISI SETELAH REVIEW CLAUDE (putaran 1) — 6 KOREKSI WAJIB DIPAKAI ──
//  1. bbox dulu BOCOR: bibir r=0.75 + prongs di TEPI → lebar > 1.5.
//     FIX: bibir r=0.69, prongs di r=0.62..0.75 → muka luar TEPAT 0.75.
//  2. bagian gagang dulu LEBIH LEBAR dari 0.80 (grip 0.88, cincin/pommel 0.90)
//     → MELANGGAR syarat user. FIX: poros 0.70, grip 0.80, cincin 0.70,
//     pommel 0.80. Semua ≤ 0.80, dan grip TEPAT 0.80 = angka user.
//  3. prongs dulu 0.23 (kependekan, foto ≈0.55) → FIX 0.60 (3.15..3.75).
//  4. profil cup dulu corong (0.33→0.75) → FIX mangkuk membulat, dinding atas
//     hampir tegak: (0.26,2.15)→(0.40,2.30)→(0.56,2.55)→(0.65,2.85)→(0.69,3.20).
//  5. bara dulu terlalu kurus di dasar (r=0.30) → FIX r=0.42 di bibir.
//  6. segmen revolve WAJIB kelipatan 4 dengan titik di sudut 0° — kalau tidak,
//     lebar sumbu X/Z hanya 0.924 × target → bbox TIDAK tepat 1.5/0.8.
//     Dipakai TC_SEG = 16 (sudut 0° ada di daftar).
//
// ⚠️ JEBAKAN WARISAN YANG DITEMUKAN (jangan diulang):
//   `_stBuild` TIDAK PERNAH membaca flag `noFix` — komentar di blok Trophy
//   (baris ~3426) mengklaim `noFix:true` melewati `_stFaceOutward`, padahal
//   `_stBuild` SELALU memanggilnya. `_stFaceOutward` membalik segitiga
//   berdasarkan CENTROID PART, jadi untuk part BERONGGA (dinding dalam cup)
//   keputusannya bisa salah. SOLUSI: dinding dalam cup dibangun sebagai
//   KERUCUT TERBUKA (bukan silinder berongga) sehingga centroid-nya jatuh di
//   TENGAH BAHAN → arah normal benar. Material Torch juga memakai
//   DoubleSide (lihat blockMaterials) sebagai jaring pengaman terakhir.
//
// SATUAN: angka desain di bawah dalam STUD (mudah dicocokkan ke syarat user).
// Konversi ke BLOCK lewat toX/toY (1 stud = 0.5 block).
// ══════════════════════════════════════════════════════════════════════════

const TC_STUD = 0.5;              // 1 stud = 0.5 block
const TC_HALF_Y = 1.5;            // setengah tinggi bbox (block) → −1.5 .. +1.5
// ⚠️ WAJIB kelipatan 4 (Claude #6). 16 punya titik di sudut 0° → bbox tepat.
const TC_SEG = 16;
const toX = (stud) => stud * TC_STUD;               // X/Z: pusat origin
const toY = (stud) => -TC_HALF_Y + stud * TC_STUD;  // Y: stud 0 = dasar bbox

// ── Pembagian tinggi (STUD, dari dasar) — tabel Claude, jumlah TEPAT 6.00 ──
const TC_Y_POMMEL0 = 0.00, TC_Y_POMMEL1 = 0.38;   // pommel  0.38
const TC_Y_RING0   = 0.38, TC_Y_RING1   = 0.46;   // cincin  0.08
const TC_Y_BANDL0  = 0.46, TC_Y_BANDL1  = 0.78;   // pita bawah 0.32
const TC_Y_GRIP0   = 0.78, TC_Y_GRIP1   = 1.68;   // grip    0.90
const TC_Y_BANDU0  = 1.68, TC_Y_BANDU1  = 2.00;   // pita atas  0.32
const TC_Y_NECK0   = 2.00, TC_Y_NECK1   = 2.15;   // leher   0.15
const TC_Y_CUP0    = 2.15, TC_Y_CUP1    = 3.20;   // dinding cup 1.05
const TC_Y_PRONG0  = 3.15, TC_Y_PRONG1  = 3.75;   // prongs  0.60
const TC_Y_FLAME0  = 3.10, TC_Y_FLAME1  = 6.00;   // bara    2.90 (0.90 terbenam)

// ── Diameter (STUD) — syarat user + koreksi Claude ──
const TC_D_HANDLE  = 0.80;   // WAJIB user: gagang 0.80 x 0.80
// ⚠️ KOREKSI thd saran Claude: Claude menyarankan poros 0.70 + grip 0.80.
//    Tapi syarat user berbunyi "panjang dan lebar GAGANGNYA 0.8 studs sama" —
//    kalau poros 0.70, maka GAGANG bukan 0.80 dan syarat user DILANGGAR.
//    FIX: SELURUH gagang (poros + grip + ferrule) = 0.80 tepat. Grip dibedakan
//    lewat WARNA + ferrule logam, bukan lewat diameter. Bonus: tidak ada
//    permukaan bertumpuk (z-fighting) karena tiap potongan bertemu TEPAT di
//    batas Y yang sama (bukan saling menimpa).
const TC_D_CUP     = 1.50;   // WAJIB user: penampang 1.50 x 1.50
const TC_D_POMMEL  = 0.80;   // ≤ 0.80 supaya syarat gagang tidak dilanggar
const TC_D_GRIP    = 0.80;   // TEPAT 0.80 = angka user
const TC_D_RING    = 0.70;
const TC_R_CUP_RIM = 0.69;   // bibir 0.69 (bukan 0.75) → ruang untuk prongs
const TC_WALL      = 0.07;   // tebal dinding cup

/** Ring titik XZ (stud → block). */
function _tcRing(rStud, yStud, seg = TC_SEG) {
  return _trRing(toX(rStud), toY(yStud), seg);
}

/** Putar profil [[rStud,yStud],...] jadi permukaan (stud → block). */
function _tcRevolve(profil, seg = TC_SEG, inward = false) {
  return _trRevolve(profil.map(([r, y]) => [toX(r), toY(y)]), seg, inward);
}

/**
 * Part Torch: GEOMETRI SAJA (tanpa api/cahaya).
 * Api = mesh terpisah beranimasi, cahaya = PointLight (keduanya di BlockSimulator3D).
 */
export function getTorchParts() {
  const parts = [];

  // ══ 1. POMMEL + CINCIN (ujung bawah) — logam, ≤ 0.80 ══
  parts.push({
    tag: 'tcMetalDark',
    faces: _tcRevolve([
      [0.00, TC_Y_POMMEL0],
      [TC_D_POMMEL / 2, TC_Y_POMMEL0],            // 0.40 → diameter 0.80
      [TC_D_POMMEL / 2, TC_Y_POMMEL1],
      [TC_D_RING / 2, TC_Y_POMMEL1],              // menyempit ke cincin 0.70
      [TC_D_RING / 2, TC_Y_RING1],
      [0.00, TC_Y_RING1],
    ]),
  });

  // ══ 2..4. GAGANG — SELURUHNYA 0.80 studs (syarat user) ══
  // Dibagi 5 potongan yang BERTEMU TEPAT di batas Y (tidak saling menimpa →
  // tidak ada z-fighting), semuanya radius 0.40 studs:
  //   0.46..0.78 poros cokelat · 0.78..0.86 ferrule logam
  //   0.86..1.60 GRIP krem · 1.60..1.68 ferrule logam · 1.68..2.00 poros cokelat
  const rH = TC_D_HANDLE / 2;   // 0.40 studs → diameter 0.80 TEPAT
  const Y_F1 = TC_Y_BANDL1;          // 0.78
  const Y_F2 = Y_F1 + 0.08;          // 0.86
  const Y_F3 = TC_Y_GRIP1 - 0.08;    // 1.60
  const Y_F4 = TC_Y_GRIP1;           // 1.68
  parts.push({   // poros bawah + poros atas (warna kayu gelap)
    tag: 'tcWood',
    faces: [
      ..._tcRevolve([[rH, TC_Y_RING1 - 0.01], [rH, Y_F1]]),
      ..._tcRevolve([[rH, Y_F4], [rH, TC_Y_BANDU1]]),
    ],
  });
  parts.push({   // GRIP (krem/cokelat muda, terukur 141,115,74)
    tag: 'tcGrip',
    faces: _tcRevolve([[rH, Y_F2], [rH, Y_F3]]),
  });
  parts.push({   // 2 ferrule logam pengikat grip (juga 0.80, tidak lebih)
    tag: 'tcMetalBand',
    faces: [
      ..._tcRevolve([[rH, Y_F1], [rH, Y_F2]]),
      ..._tcRevolve([[rH, Y_F3], [rH, Y_F4]]),
    ],
  });

  // ══ 5. LEHER (transisi ke cup) ══
  parts.push({
    tag: 'tcMetalDark',
    faces: _tcRevolve([
      [rH, TC_Y_NECK0 - 0.01],
      [0.26, TC_Y_NECK1],
    ]),
  });

  // ══ 6. DINDING CUP (mangkuk membulat) — profil Claude #4 ══
  // (0.26,2.15)→(0.40,2.30)→(0.56,2.55)→(0.65,2.85)→(0.69,3.20)
  const CUP_OUT = [
    [0.26, TC_Y_CUP0],
    [0.40, TC_Y_CUP0 + 0.15],
    [0.56, TC_Y_CUP0 + 0.40],
    [0.65, TC_Y_CUP0 + 0.70],
    [TC_R_CUP_RIM, TC_Y_CUP1],
  ];
  parts.push({ tag: 'tcMetalDark', faces: _tcRevolve(CUP_OUT) });

  // ══ 7. DINDING DALAM CUP — KERUCUT TERBUKA (bukan silinder berongga!) ══
  // ⚠️ Sengaja TIDAK memakai inward:true. Dengan kerucut terbuka, centroid
  //    part jatuh di TENGAH BAHAN → `_stFaceOutward` menghasilkan arah benar.
  const CUP_IN = [
    [TC_R_CUP_RIM - TC_WALL, TC_Y_CUP1],
    [0.65 - TC_WALL, TC_Y_CUP0 + 0.70],
    [0.56 - TC_WALL, TC_Y_CUP0 + 0.40],
    [0.40 - TC_WALL, TC_Y_CUP0 + 0.15],
    [0.26 - TC_WALL + 0.02, TC_Y_CUP0 + 0.02],
  ];
  parts.push({ tag: 'tcMetalIn', faces: _tcRevolve(CUP_IN) });
  // Dasar rongga cup (bantalan bara) — FAN menghadap +Y.
  parts.push({
    tag: 'tcEmberBed',
    faces: _trCapFan(toX(0.21), toY(TC_Y_CUP0 + 0.02), TC_SEG, true),
  });

  // ══ 8. CINCIN PENUTUP BIBIR (annulus) — WAJIB (Claude #4) ══
  // Tanpa ini ada CELAH TEMBUS di ujung dinding luar ↔ dalam.
  parts.push({
    tag: 'tcMetalDark',
    faces: _trRim(toX(TC_R_CUP_RIM), toX(TC_R_CUP_RIM - TC_WALL), toY(TC_Y_CUP1), TC_SEG),
  });

  // ══ 9. PRONGS (gerigi bibir) — tinggi 0.60, muka luar TEPAT r=0.75 ══
  // Claude #1+#3: prongs menempati r=0.62..0.75, jadi lebar total = 1.50 tepat.
  const N_PRONG = 10;
  const PRONG_R_IN = 0.62, PRONG_R_OUT = 0.75;   // muka luar = 0.75 → bbox 1.5
  // ⚠️ TERUKUR: lebar 0.14 membuat sudut prong keluar bbox (0.7500 vs 0.7349
  //    = asimetris). Dengan 0.12, prong 2*0.75*cos(4.57°) = 1.4952 studs
  //    (< 1.5) → bbox X/Z ditentukan CINCIN di 0.7500 tepat, simetris.
  const PRONG_W = 0.12;                          // lebar tangensial
  const facesProng = [];
  for (let i = 0; i < N_PRONG; i++) {
    const a = (i / N_PRONG) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const pts = [
      [PRONG_R_IN, -PRONG_W / 2], [PRONG_R_OUT, -PRONG_W / 2],
      [PRONG_R_OUT, PRONG_W / 2], [PRONG_R_IN, PRONG_W / 2],
    ].map(([rr, tt]) => [toX(rr * ca - tt * sa), toX(rr * sa + tt * ca)]);
    const y0 = toY(TC_Y_PRONG0), y1 = toY(TC_Y_PRONG1);
    const quad = (a1, a2) => [
      [pts[a1][0], y0, pts[a1][1]], [pts[a2][0], y0, pts[a2][1]],
      [pts[a2][0], y1, pts[a2][1]], [pts[a1][0], y1, pts[a1][1]],
    ];
    facesProng.push(quad(0, 1), quad(1, 2), quad(2, 3), quad(3, 0));
    // tutup atas & bawah
    facesProng.push([
      [pts[0][0], y1, pts[0][1]], [pts[1][0], y1, pts[1][1]],
      [pts[2][0], y1, pts[2][1]], [pts[3][0], y1, pts[3][1]],
    ]);
    facesProng.push([
      [pts[3][0], y0, pts[3][1]], [pts[2][0], y0, pts[2][1]],
      [pts[1][0], y0, pts[1][1]], [pts[0][0], y0, pts[0][1]],
    ]);
  }
  parts.push({ tag: 'tcMetalDark', faces: facesProng });

  // ══ 10. CINCIN PENGIKAT prongs (horizontal) — tinggi 0.08 (Claude #3) ══
  const BAND_Y = TC_Y_PRONG0 + 0.20;
  parts.push({
    tag: 'tcMetalBand',
    faces: _tcRevolve([
      // ⚠️ TERUKUR: dulu +0.004 → 0.7540 block = 1.508 studs (LEWAT 1.5).
      //    Sekarang TEPAT di PRONG_R_OUT supaya bbox = 0.7500 persis.
      [PRONG_R_OUT, BAND_Y - 0.04],
      [PRONG_R_OUT, BAND_Y + 0.04],
    ]),
  });

  return parts;
}

/** Geometri Torch TANPA api. Bbox WAJIB [0.75, 3.0, 0.75] block. */
export function makeTorchGeometry(THREE) {
  return _stBuild(THREE, getTorchParts());
}

// ── PARAMETER API & CAHAYA (dipakai BlockSimulator3D) — satuan BLOCK ──
export const TC_FLAME_BASE_Y = toY(TC_Y_FLAME0);   // dasar mesh bara (lokal)
export const TC_FLAME_H = (TC_Y_FLAME1 - TC_Y_FLAME0) * TC_STUD;  // 1.45 block
export const TC_FLAME_R = toX(0.42);               // radius dasar bara
export const TC_LIGHT_Y = toY(4.30);               // pusat bara (Claude: y≈4.3)
export const TC_LIGHT_COLOR = 0xff7a1a;
// ══ PENCahayaan (revisi 2026-10-24 — keluhan user: "seharusnya menerangi
//    sekitar layaknya obor di dunia nyata") ══
// ⚠️ NILAI INI SATU-SATUNYA SUMBER. BlockSimulator3D mengirim nilai ini
//    EKSPLISIT ke makeTorchLightPool, jadi default di torchFlame.js TIDAK
//    PERNAH terpakai. (Bug 2026-10-24: sempat diubah 12→22 di pool, hasilnya
//    nol perubahan di layar.)
// ══ NILAI DIPILIH DARI PENGUKURAN, BUKAN TEBAKAN (2026-10-24) ══
// Sapuan intensitas di browser, panel abu-abu diukur pada 4 jarak
// (piksel persentil-95 tiap panel, delta R terhadap kondisi lampu MATI):
//   I=26 : 1.5b +40 · 3b +22 · 4.5b +10 · 6b +5      → terlalu redup
//   I=60 : 1.5b +101 · 3b +56 · 4.5b +26 · 6b +12    → DIPILIH (gradasi bagus)
//   I=150: 1.5b +104 · 3b +83 · 4.5b +48 · 6b +24    → jarak dekat JENUH 255
//                                                     (terbakar, detail hilang)
// Jadi 60 = titik seimbang: dekat terang, jauh masih terasa, tanpa clipping.
// Fisika decay=2 (E=I/d²) dipertahankan. DESIGN TIDAK DISENTUH: geometri,
// warna vertex, dan ikon sama sekali tidak berubah — hanya angka lampu.
export const TC_LIGHT_INTENSITY = 60;
export const TC_LIGHT_DISTANCE = 20;
export const TC_LIGHT_DECAY = 2;


// ══════════════════════════════════════════════════════════════════════════
// ── NSI LEVEL 2 #14: CANDLE (lilin dalam cawan) — bab 208 ──
// ══════════════════════════════════════════════════════════════════════════
// ── KONSTANTA DASAR ──
// (hexToRgb lokal: dipakai lewat pt.colorFn per-vertex, format RGBA 0..1)
function _cdHex(hex) {
  return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255, 1.0];
}
// NSI_CD_SLUG / NAME / SIZE sudah dideklarasikan di atas (dekat Lamp).

const CD_STUD = 0.5;          // 1 stud = 0.5 block
const CD_HALF_Y = 1.75 / 2;   // 0.875 → bbox Y −0.875 .. +0.875
const CD_SEG = 8;             // oktagon (BUKAN decagon: bbox X≠Z & rotasi 90° geser)

const toCX = (stud) => stud * CD_STUD;                 // X/Z dari pusat
const toCY = (stud) => -CD_HALF_Y + stud * CD_STUD;    // Y dari dasar bbox

// ── PEMBAGIAN TINGGI (STUD, dari dasar) — jumlah TEPAT 3.50 ──
const CD_Y_CAWAN0 = 0.00, CD_Y_CAWAN1 = 0.35;   // cawan 0.35
const CD_Y_BATANG0 = 0.35, CD_Y_BATANG1 = 2.55; // batang 2.20
const CD_Y_SUMBU0 = 2.55, CD_Y_SUMBU1 = 2.90;   // sumbu 0.35
const CD_Y_API0 = 2.90, CD_Y_API1 = 3.50;       // api 0.60 TINGGI

// ── DIMENSI (STUD) ──
// ⚠️ 2026-10-25: user minta "batang lilinnya kurusin dikit" → 1.00 → 0.86
//    studs. (Spesifikasi awal 1 stud; ini deviasi tipis atas permintaan user.)
// ⚠️ 2026-10-26: 1.00 → 0.86 studs TIDAK terlihat (hanya −14%, dan rasio
//    batang/cawan di 8 gambar referensi = 0.445 ≈ 0.89 studs, jadi 0.86 hampir
//    sama dengan referensi). Pengguna menegur "kok gak dikurusin?".
//    → 0.70 studs = 0.35 block: 30% lebih kurus dari 1.00, dan 21% lebih
//    kurus dari referensi, jadi perubahan jelas terlihat.
const CD_W_BATANG = 0.70;   // 0.35 block (dikuruskan nyata dari 1.00)
const CD_W_CAWAN_BAWAH = 1.40;  // 0.70 block di dasar (bevel ke dalam)
const CD_W_CAWAN_ATAS = 2.00;   // WAJIB user: 2.00 x 2.00 studs di bibir
const CD_W_SUMBU = 0.13;        // 0.065 block — lebih tipis (dulu 0.18 = balok kaku)
// ⚠️ API DIPERBESAR 2026-10-25 (0.20 → 0.62 studs).
//    TERUKUR di runtime: api lama hanya 0.10 block (0.2 studs) lebar & 0.245
//    block tinggi → terbaca sebagai "serpihan bidang melayang", BUKAN nyala
//    (dikonfirmasi baca_gambar/Gemini: "api pecah, bidang datar pucat").
//    Perbandingan wajar: sumbu 0.18 studs, jadi api 3.4× sumbu. Api lilin
//    nyata memang ~2-3× tebal sumbu, bukan 1.1× seperti sebelumnya.
// ⚠️ 2026-10-25 (koreksi user "apinya kok jadi gendut"): 0.80 → 0.34 → 0.24
//    studs. Rasio lebar:tinggi sekarang 1 : 2.5 (api lilin nyata ~1:2.5-3).
const CD_W_API = 0.24;          // 0.12 block — LANGSING seperti lidah api

// ⚠️ OKTAGON: lebar sisi datar = 2·r·cos(π/8). Kalau r diisi 0.5 (= setengah
// lebar target), lebar nyata hanya 0.9239 → bbox MELESET 7.6%.
// Jadi r HARUS = target / (2·cos(π/8)). Terverifikasi offline: r=0.5412 → 1.000.
const CD_KOTAK = 1 / Math.cos(Math.PI / CD_SEG);   // 1.0824
const cdR = (lebar) => toCX(lebar / 2) * CD_KOTAK;  // jari-jari oktagon

// Benam (Claude: sambungan wajib dibenamkan supaya tidak ada celah rambut)
const CD_BENAM_BATANG = 0.05;   // batang masuk 0.05 stud ke dalam cawan
const CD_BENAM_SUMBU = 0.10;    // sumbu masuk 0.10 stud ke dalam lilin

// Puncak meleleh (baji terpisah): 0.40 stud di atas bibir = 1/5 tinggi batang
const CD_PUNCAK_H = 0.26;
const CD_PUNCAK_W = 0.36;   // ikut ramping (dari 0.44)       // setengah lebar baji (0.25 stud)

// Sumbu dua segmen: dasar digeser ke sisi rendah, segmen atas membengkok
// ⚠️ 2026-10-25: dulu 0.10 stud → sumbu bergeser 0.05 block dari PUSAT,
//    terbaca "sumbu miring/tidak di tengah" oleh pembaca gambar. → 0 (TEGAK).
const CD_SUMBU_GESER = 0.00;    // 0.05 block dari pusat
const CD_SUMBU_BENGKOK = 0.000; // TEGAK LURUS (dulu 0.12/0.035 = terlihat miring)

// Handle cincin di SUDUT DIAGONAL (Claude jawaban B)
const CD_HANDLE_PANJANG = 0.18;  // block, sepanjang diagonal
const CD_HANDLE_LEBAR = 0.13;    // block, lebar belah ketupat cincin
const CD_HANDLE_TEBAL = 0.075;   // block, tebal batang cincin
// Handle dirapatkan ke BIBIR cawan (referensi: pangkal dekat tepi atas).
const CD_HANDLE_Y0 = 0.12, CD_HANDLE_Y1 = 0.17;  // dari dasar (block)

// ── WARNA (dari pengukuran piksel, bukan tebakan) ──
// terukur: kuningan (232,208,145) & (195,169,108) · lilin (255,255,255)
// · sumbu (15,31,47). Lilin diturunkan ke 0xEFEBE0 sesuai saran Claude.
const CD_WARNA = {
  // ⚠️ DIPERKUKAN 2026-10-25: nilai lama 0xe8d091 terukur sat 0.32 (pucat,
  //    terbaca "krem/kardus"). Setelah dipisah jadi material LOGAM
  //    (metalness 0.85), saturasi dinaikkan agar hue emas benar-benar terbaca.
  //    Terukur: sat 0.32 → 0.44, hue 45° (emas), val 0.73.
  kuningan: 0xc79a33,      // emas pekat (bukan krem pucat)
  kuninganGelap: 0x9e7822, // bevel bawah / bayangan
  lilin: 0xefebe0,         // BUKAN putih murni (kontras flat shading)
  sumbu: 0x0f1f2f,         // 15,31,47
};

// ── PARAMETER CAHAYA (satuan BLOCK) ──
// Kalibrasi Claude: efektif = I × Y(luminance linear warna)
//   Torch  0xff7a1a Y=0.352 I=60 → 21.1
//   Lamp   0xffe9a0 Y=0.821 I=22 → 18.1
//   Candle 0xffb04a Y=0.528 I=32 → 16.9  (≈80% Torch — lilin kecil tapi nyata)
// ⚠️ KALIBRASI ULANG 2026-10-25 (I 16 → 32): I=16 hanya mengubah 396k piksel
//    delta 24.2 vs Lamp I=22 = 482k/delta 60.1 → TERLALU REDUP, lantai
//    simulator (#0e1420 + ambient 0.45) tidak menerima genangan hangat.
//    Diukur ulang dengan DIFF PIKEL (bukan rasio R-B yang menyesatkan):
//      I=16 → 24.2 · I=28 → 30.9 · I=32 → 32.8 · I=40 → 37.5 (jenuh ACES)
//    I=32 dipilih: cakupan 480k piksel ≈ 100% cakupan Lamp, tetap lebih
//    redup dari Lamp (32.8 vs 60.1) sehingga terbaca sebagai lilin kecil.
// Posisi = pusat api = 3.28 stud dari dasar → toCY(3.28) = +0.765 block
export const CD_LIGHT_Y = toCY(3.28);
export const CD_LIGHT_COLOR = 0xffb04a;
export const CD_LIGHT_INTENSITY = 32;
export const CD_LIGHT_DISTANCE = 11;
export const CD_LIGHT_DECAY = 2;

// ════════════════════════════════════════════════════════════════════════════
// HELPER GEOMETRI — semua menghasilkan part CEMBUNG PADAT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Frustum prisma segi-N (padat, cembung). Sumbu vertikal = Y.
 * Ring A di y0, ring B di y1. capA menutup ring A, capB menutup ring B.
 * ⚠️ PENTING: untuk semua part di sini y0 < y1 (A di BAWAH, B di ATAS),
 *    jadi "tutup atas" = capB, bukan capA. Versi pertama saya tertukar dan
 *    menghasilkan 8 boundary edge di bagian atas setiap part.
 */
function _cdPrisma(r0, y0, r1, y1, capA, capB, seg = CD_SEG) {
  const f = [];
  // oktagon dengan SISI DATAR di sumbu X/Z → sudut mulai 22.5°
  const sudut = (k) => (Math.PI / seg) + (k * 2 * Math.PI) / seg;
  const A = [], B = [];
  for (let k = 0; k < seg; k++) {
    const a = sudut(k);
    A.push([Math.cos(a) * r0, y0, Math.sin(a) * r0]);
    B.push([Math.cos(a) * r1, y1, Math.sin(a) * r1]);
  }
  // dinding samping — winding KELUAR (diverifikasi 16/16 dengan uji radial).
  for (let k = 0; k < seg; k++) {
    const j = (k + 1) % seg;
    f.push([B[k], A[k], A[j], B[j]]);
  }
  // ⚠️⚠️ `_buildFaces` produksi HANYA menangani face 3 atau 4 vertex; face
  //   8-vertex akan dibuang jadi 1 segitiga bocor. Jadi N-gon WAJIB dipecah
  //   sendiri jadi triangle fan di sini (6 segitiga untuk oktagon).
  // tutup ring A (biasanya bawah, −Y)
  if (capA) {
    for (let k = 1; k < seg - 1; k++) f.push([A[0], A[k], A[k + 1]]);
  }
  // tutup ring B (biasanya atas, +Y)
  if (capB) {
    for (let k = 1; k < seg - 1; k++) f.push([B[0], B[k + 1], B[k]]);
  }
  return f;
}

/**
 * Frustum dengan DUA ring yang bisa digeser berbeda — untuk sumbu yang
 * membengkok. Versi `_cdPrisma` memakai satu offset seragam, sehingga
 * segmen atas sumbu tidak menyambung segmen bawah (X tidak overlap →
 * sumbu terlihat PATAH). Helper ini menggeser ring bawah & atas terpisah
 * sehingga prismanya benar-benar miring dan bersambung.
 */
function _cdPrismaBent(r0, y0, ox0, r1, y1, ox1, capA, capB, seg = 4) {
  const f = [];
  const sudut = (k) => (Math.PI / seg) + (k * 2 * Math.PI) / seg;
  const A = [], B = [];
  for (let k = 0; k < seg; k++) {
    const a = sudut(k);
    A.push([Math.cos(a) * r0 + ox0, y0, Math.sin(a) * r0]);
    B.push([Math.cos(a) * r1 + ox1, y1, Math.sin(a) * r1]);
  }
  for (let k = 0; k < seg; k++) {
    const j = (k + 1) % seg;
    f.push([B[k], A[k], A[j], B[j]]);
  }
  if (capA) for (let k = 1; k < seg - 1; k++) f.push([A[0], A[k], A[k + 1]]);
  if (capB) for (let k = 1; k < seg - 1; k++) f.push([B[0], B[k + 1], B[k]]);
  return f;
}

/**
 * Baji (wedge) cembung — puncak meleleh di bibir lilin.
 * Alas persegi di y0, meruncing ke satu titik di y1 (digeser ke +X).
 */
function _cdBaji(hx, hz, y0, y1, geserX) {
  // ⚠️ DIROMBAK 2026-10-25. Versi lama memakai SATU titik puncak `T`
  //    → bentuknya baji/segitiga asimetris yang mencuat ke satu sisi.
  //    Dua pembaca gambar independen menyebutnya "tonjolan segitiga miring
  //    yang aneh" di puncak lilin. FIX: kerucut terpancung SIMETRIS
  //    (cincin atas kecil di tengah), jadi puncak lilin rata & rapi seperti
  //    lilin yang meleleh sedikit — tanpa tonjolan asimetris.
  const A = [[-hx, y0, -hz], [hx, y0, -hz], [hx, y0, hz], [-hx, y0, hz]];
  const t = 0.34;                       // rasio cincin atas (terpancung)
  const ox = hx * t, oz = hz * t;
  const B = [
    [geserX - ox, y1, -oz], [geserX + ox, y1, -oz],
    [geserX + ox, y1,  oz], [geserX - ox, y1,  oz],
  ];
  const f = [];
  for (let k = 0; k < 4; k++) {
    const j = (k + 1) % 4;
    f.push([A[k], A[j], B[j], B[k]]);   // sisi miring
  }
  f.push([B[0], B[1], B[2], B[3]]);     // tutup atas (datar)
  f.push([A[0], A[3], A[2], A[1]]);     // alas
  return f;
}


/**
 * Batang (balok) cembung 3D — dari titik p0 ke p1 dengan tebal.
 *
 * ⚠️ BUG YANG DITEMUKAN (part 7 & 9 degenerate 12/12, luas 0):
 *    Versi pertama menghitung vektor tegak-lurus HANYA dari (dx, dz):
 *        const len = Math.hypot(dx, dz) || 1;
 *        const px = (-dz / len) * t,  pz = (dx / len) * t;
 *    Untuk segmen MURNI VERTIKAL (dx = dz = 0), `|| 1` membuat len = 1
 *    sehingga px = pz = 0 → keempat titik A kolaps jadi GARIS → semua
 *    kuad punya luas 0. Handle loop selalu punya 2 sisi vertikal, jadi
 *    cacat ini PASTI muncul.
 *    FIX: hitung tegak-lurus di RUANG 3D dengan cross product terhadap
 *    sumbu bantu yang tidak sejajar arah batang.
 */
/**
 * RING / PITA PIPA-PIPIH TERTUTUP — untuk pegangan cincin cawan lilin.
 *
 * Kenapa ada: menyusun loop dari 5 balok terpisah (_cdBatang) membuat ujung
 * persegi tiap balok SALING MENABRAK di simpul → tampak "gigi"/clipping dan
 * bentuk terbaca janggal (dikonfirmasi 2 pembaca gambar independen).
 *
 * Solusi: bangun ring sebagai SATU mesh tertutup dari 2 siluet (luar & dalam)
 * pada bidang vertikal (d, y), lalu di-extrude ke kedalaman `tebal`.
 * Sambungan sudut otomatis mitered (bertemu tepat di simpul), tanpa
 * tumpang tindih. Ini wujud nyata "pita pipih yang ditekuk" di referensi.
 *
 * @param luar  [[d,y], ...] siluet luar, urut (searah/berlawanan jarum jam)
 * @param dalam [[d,y], ...] siluet dalam, jumlah & urutan sama
 * @param tebal kedalaman total (⊥ bidang loop)
 */
function _cdRing(luar, dalam, tebal) {
  const n = luar.length;
  const K = Math.SQRT1_2;                       // proyeksi diagonal 45° ke X & Z
  const h = tebal / 2;
  // (d, y, t) → 3D. t = offset kedalaman, dibagi rata ke X dan −Z
  const P3 = (d, y, t) => [d * K + t * K, y, d * K - t * K];

  const OL = luar.map(([d, y]) => P3(d, y, +h));   // luar, sisi +t
  const IL = dalam.map(([d, y]) => P3(d, y, +h));  // dalam, sisi +t
  const OR = luar.map(([d, y]) => P3(d, y, -h));   // luar, sisi −t
  const IR = dalam.map(([d, y]) => P3(d, y, -h));  // dalam, sisi −t

  const f = [];
  for (let k = 0; k < n; k++) {
    const j = (k + 1) % n;
    // ⚠️ WINDING DIVERIFIKASI dgn uji normal eksplisit (_uji_ring2.cjs):
    //    versi pertama membuat SEMUA muka depan/belakang terbalik (dot = −1).
    //    Urutan di bawah ini sudah benar (20/20 kuad lolos).
    // muka depan (+t): cincin datar → kuad antara luar & dalam
    f.push([OL[j], IL[j], IL[k], OL[k]]);
    // muka belakang (−t): winding dibalik
    f.push([OR[k], IR[k], IR[j], OR[j]]);
    // dinding LUAR (menghadap keluar)
    f.push([OL[j], OL[k], OR[k], OR[j]]);
    // dinding DALAM lubang (menghadap ke dalam lubang)
    f.push([IL[k], IL[j], IR[j], IR[k]]);
  }
  return f;
}

function _cdBatang(p0, p1, tebal, tebalLuar) {
  const [x0, y0, z0] = p0, [x1, y1, z1] = p1;
  const t = tebal / 2;
  // tebalLuar (opsional): setengah tebal pada arah v (kedalaman, ⊥ bidang loop).
  // Dipakai untuk penampang PIPIH (mis. 0.040 dalam-bidang × 0.050 kedalaman).
  // Jika tidak diberikan → penampang persegi seperti sebelumnya (kompatibel).
  const tv = (tebalLuar === undefined ? tebal : tebalLuar) / 2;
  // arah batang (3D, dinormalisasi)
  let dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-9) return [];            // segmen nol → tidak ada batang
  dx /= len; dy /= len; dz /= len;
  // sumbu bantu: pilih yang paling TIDAK sejajar arah batang
  const ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz);
  let rx = 0, ry = 1, rz = 0;                       // default: Y
  if (ay >= ax && ay >= az) { rx = 1; ry = 0; rz = 0; }  // batang ~vertikal → pakai X
  // u = normalize(cross(ref, dir))  → tegak lurus arah batang
  let ux = ry * dz - rz * dy, uy = rz * dx - rx * dz, uz = rx * dy - ry * dx;
  const ul = Math.hypot(ux, uy, uz) || 1;
  ux /= ul; uy /= ul; uz /= ul;
  // v = cross(dir, u) → tegak lurus keduanya
  const vx = dy * uz - dz * uy, vy = dz * ux - dx * uz, vz = dx * uy - dy * ux;
  // 4 titik penampang (persegi) di sekitar satu ujung
  const sek = (cx, cy, cz) => [
    [cx + ux * t + vx * tv, cy + uy * t + vy * tv, cz + uz * t + vz * tv],
    [cx + ux * t - vx * tv, cy + uy * t - vy * tv, cz + uz * t - vz * tv],
    [cx - ux * t - vx * tv, cy - uy * t - vy * tv, cz - uz * t - vz * tv],
    [cx - ux * t + vx * tv, cy - uy * t + vy * tv, cz - uz * t + vz * tv],
  ];
  const A = sek(x0, y0, z0);
  const B = sek(x1, y1, z1);
  const f = [];
  for (let k = 0; k < 4; k++) {
    const j = (k + 1) % 4;
    f.push([B[k], A[k], A[j], B[j]]);
  }
  f.push([A[0], A[3], A[2], A[1]]);  // tutup ujung p0
  f.push(B.slice());                  // tutup ujung p1
  return f;
}

/**
 * Bipiramid api (8 segitiga) — bipiramida 4 sisi.
 * Titik bawah → cincin lebar di 35% → titik atas. (Claude jawaban C)
 */
function _cdApi(y0, y1, lebar) {
  // ⚠️ DIROMBAK 2026-10-25. Versi lama = BIPIRAMID 4 sisi (1 cincin di 35%)
  //    → terbaca sebagai BERLIAN/BELAH KETUPAT kaku, bukan nyala api
  //    (dikonfirmasi baca_gambar/Gemini 2×: "bentuk geometris kaku seperti
  //    belah ketupat"). Api lilin nyata = TEARDROP: runcing di bawah (duduk
  //    di sumbu), PALING LEBAR di ~30%, lalu meruncing ke puncak.
  //    FIX: 8 sisi + 6 cincin profil supaya siluetnya melengkung halus.
  const r = lebar / 2;
  const SEG = 8;
  // profil [t (0=bawah..1=atas), faktor radius]
  // ⚠️ Profil LANGSING (koreksi user: "gendut"). Terlebar hanya di 22%,
  //    lalu menyusut cepat → siluet memanjang seperti lidah api, bukan wajik.
  const PROF = [
    [0.00, 0.00],   // titik bawah (menempel ujung sumbu)
    [0.10, 0.55],
    [0.22, 1.00],   // TITIK TERLEBAR (rendah, di 22%)
    [0.42, 0.74],
    [0.64, 0.46],
    [0.84, 0.20],
    [1.00, 0.00],   // puncak runcing
  ];
  const H = y1 - y0;
  const ringOf = (t, f) => {
    const y = y0 + H * t, rr = r * f;
    const out = [];
    for (let k = 0; k < SEG; k++) {
      const a = (k / SEG) * Math.PI * 2;
      out.push([Math.cos(a) * rr, y, Math.sin(a) * rr]);
    }
    return out;
  };
  const rings = PROF.map(([t, f]) => ringOf(t, f));
  const f = [];
  for (let i = 0; i < rings.length - 1; i++) {
    const A = rings[i], B = rings[i + 1];
    for (let k = 0; k < SEG; k++) {
      const j = (k + 1) % SEG;
      f.push([A[k], A[j], B[j], B[k]]);
    }
  }
  // tutup bawah & atas (kipas) — walau radius 0, tetap diberi segitiga agar
  // mesh watertight (titik profil 0 sudah berupa titik tunggal per cincin).
  const bawah = [0, y0, 0], atas = [0, y1, 0];
  for (let k = 0; k < SEG; k++) {
    const j = (k + 1) % SEG;
    f.push([bawah, rings[0][j], rings[0][k]]);
    f.push([atas, rings[rings.length - 1][k], rings[rings.length - 1][j]]);
  }
  return f;
}


// ════════════════════════════════════════════════════════════════════════════
// DAFTAR PART
// ════════════════════════════════════════════════════════════════════════════

/**
 * @returns {Array} parts — tiap part {tag, faces, colorFn?}
 * tag: 'candleLit' (cawan+lilin+sumbu, 1 draw call) | 'candleApi' (unlit)
 */
export function getCandleParts() {
  const parts = [];

  // ══ 1. CAWAN — frustum oktagon padat, cembung, TANPA cekungan ══
  // Bevel ke dalam: 1.40 stud di dasar → 2.00 stud di bibir (syarat user).
  // ⚠️ Claude F: JANGAN bikin mangkuk berongga — centroid jatuh di ruang
  //    kosong dan _stFaceOutward akan membalik normal.
  parts.push({
    tag: 'candleMetal',
    colorFn: () => _cdHex(CD_WARNA.kuningan),
    faces: _cdPrisma(
      cdR(CD_W_CAWAN_BAWAH), toCY(CD_Y_CAWAN0),
      cdR(CD_W_CAWAN_ATAS), toCY(CD_Y_CAWAN1),
      // ⚠️ FIX: tutup KEDUA ring. Sebelumnya hanya bawah → 8 boundary edge di
      //    bibir atas = lubang gelap yang terlihat dari kamera rendah
      //    (dikonfirmasi vision: "celah/lubang gelap mendatar").
      true, true,
    ),
  });

  // Bibir cawan — cincin tipis menonjol supaya bevel terlihat tegas.
  // Dibenamkan 0.01 ke dalam frustum di bawahnya (anti celah rambut).
  parts.push({
    tag: 'candleMetal',
    colorFn: () => _cdHex(CD_WARNA.kuninganGelap),
    faces: _cdPrisma(
      cdR(CD_W_CAWAN_ATAS), toCY(CD_Y_CAWAN1 - 0.02),
      cdR(CD_W_CAWAN_ATAS), toCY(CD_Y_CAWAN1),
      true, true,
    ),
  });

  // ══ 2. BATANG LILIN — prisma oktagon, 1.00 x 1.00 studs ══
  // Masuk 0.05 stud ke dalam cawan (anti celah). Tutup atas DATAR.
  parts.push({
    tag: 'candleLit',
    colorFn: () => _cdHex(CD_WARNA.lilin),
    faces: _cdPrisma(
      cdR(CD_W_BATANG), toCY(CD_Y_BATANG0 - CD_BENAM_BATANG),
      cdR(CD_W_BATANG), toCY(CD_Y_BATANG1),
      true, true,
    ),
  });

  // ══ 3. PUNCAK MELELEH — baji cembung TERPISAH di atas tutup datar ══
  // Claude F: jangan angkat vertex oktagon → sisi non-planar = "pecah".
  parts.push({
    tag: 'candleLit',
    colorFn: () => _cdHex(CD_WARNA.lilin),
    faces: _cdBaji(
      toCX(CD_PUNCAK_W / 2), toCX(CD_PUNCAK_W / 2),
      toCY(CD_Y_BATANG1 - 0.01),                    // benam 0.01 ke tutup
      toCY(CD_Y_BATANG1 + CD_PUNCAK_H),
      0,                                             // SIMETRIS: geser 0 (dulu 0.12/0.05 = puncak miring)
    ),
  });

  // ══ 4. SUMBU — prisma 4 sisi, 2 segmen ══
  // Segmen bawah tegak, segmen atas membengkok (Claude: prisma, bukan bidang)
  const sumbuDasarX = toCX(CD_SUMBU_GESER);
  const sumbuY0 = toCY(CD_Y_BATANG1 - CD_BENAM_SUMBU);
  // ⚠️ FIX: sebelumnya `- 0.06` membuat segmen atas hanya 0.06 block tinggi
  //    sementara bengkoknya 0.06 block → nyaris horizontal, terlihat PATAH.
  //    Sekarang segmen atas dapat porsi ~40% dari total tinggi sumbu.
  const sumbuY1 = toCY(CD_Y_SUMBU0 + (CD_Y_SUMBU1 - CD_Y_SUMBU0) * 0.55);
  parts.push({
    tag: 'candleLit',
    colorFn: () => _cdHex(CD_WARNA.sumbu),
    faces: _cdPrismaBent(
      toCX(CD_W_SUMBU / 2), sumbuY0, sumbuDasarX,
      toCX(CD_W_SUMBU / 2), sumbuY1, sumbuDasarX,
      true, true, 4,
    ),
  });
  // segmen atas: membengkok ke samping
  parts.push({
    tag: 'candleLit',
    colorFn: () => _cdHex(CD_WARNA.sumbu),
    faces: _cdPrismaBent(
      toCX(CD_W_SUMBU / 2), sumbuY1, sumbuDasarX,
      toCX(CD_W_SUMBU / 2 * 0.8), toCY(CD_Y_SUMBU1),
      sumbuDasarX + toCX(CD_SUMBU_BENGKOK),
      true, true, 4,
    ),
  });

  // ══ 5. PEGANGAN CINCIN — 4 batang cembung di SUDUT DIAGONAL ══
  // Ruang tersedia di sudut oktagon: 0.707 − 0.5 = 0.207 block.
  // Dipakai maks 0.18 → bbox TETAP 1.00 x 1.00 (tidak melanggar syarat user).
  //
  // ⚠️ BUG YANG DITEMUKAN UJI OFFLINE: versi pertama menaruh titik A, M, B
  //    semuanya di garis diagonal → cross product = 0 → KOLINEAR → cincin
  //    gepeng/hilang. FIX: M digeser TEGAK LURUS diagonal, jadi membentuk
  //    belah ketupat nyata dengan lubang.
  // ══════════════════════════════════════════════════════════════════════
  // PEGANGAN — loop TINGGI-SEMPIT menempel dinding diagonal cawan.
  //
  // ⚠️ TIGA BUG YANG DITEMUKAN DI SINI (jangan diulang):
  //  1) `dIn` dulu diisi 0.52 STUD padahal maksudnya BLOCK → pangkal hanya
  //     0.092 block dari pusat, tertanam di dalam cawan (dinding di 0.354).
  //  2) Versi berikutnya menonjol keluar bbox → lebar 1.53 block = 3.06 studs,
  //     MELANGGAR syarat user 2 studs.
  //  3) "Belah ketupat" A→M→B→M→A CACAT LOGIKA: segmen B→M identik M→B dan
  //     M→A identik A→M → hanya 2 batang unik digambar 2× = GUMPALAN, bukan
  //     cincin. (Terkonfirmasi vision 2×: "gumpalan padat, tanpa lubang".)
  //
  // ── BATAS FISIKA YANG TERUKUR ──
  //  Dinding oktagon cawan di arah diagonal: r = 0.5412 block
  //  Bbox radial maksimum                  : r = 0.7071 block (X=Z=0.5)
  //  → RUANG TERSEDIA hanya 0.1659 block. Dengan tebal batang 0.075, lubang
  //    maksimum cuma 0.0159 block (1/60 lebar blok) = TIDAK MUNGKIN terlihat.
  //  → FIX: tebal batang 0.05, loop diisi r=0.545..0.680 (lubang radial
  //    0.035) dan DITINGGIKAN ke 0.26 block (lubang y 0.160). Perbandingan
  //    lubang 0.060 × 0.160 = jelas terbaca sebagai loop, bukan gumpalan.
  // ══════════════════════════════════════════════════════════════════════
  // ⚠️ BUG BESAR YANG DITEMUKAN 2026-10-25 (baca_gambar/Gemini):
  //    "fragmen geometri vertikal yang menembus sisi depan alas cawan".
  //    AKAR: `hd(u) = u/√2` membuat radial EFEKTIF jadi u/√2 (0.545/1.414 =
  //    0.385 block), padahal dinding oktagon cawan ada di r = 0.5412 block.
  //    → seluruh loop TERTANAM di dalam cawan; yang menonjol cuma sisa yang
  //    menembus dinding = terlihat sebagai "serpihan mencuat".
  //    FIX: radial diisi LANGSUNG dalam block (tanpa /√2) dan diletakkan
  //    D I L U A R dinding cawan (0.552 .. 0.690), supaya loop benar-benar
  //    terlihat sebagai cincin pegangan yang menonjol ke samping.
  // ══ 5b. PEGANGAN CINCIN CAWAN ══
  // ══════════ VONIS CLAUDE — KONSULTASI KETIGA (2026-10-26) ══════════
  // Menjawab keluhan user: "dari segi bentuk saya merasa janggal".
  // Ukuran & kemiringan SUDAH di-ACC user → TIDAK diubah di sini.
  //
  // Claude mengoreksi 3 hal (dua di antaranya setengah salah):
  //  1. "Tidak ada kaki penyangga" → SETENGAH SALAH. Ada tab/tongkat, tapi
  //     menyatu dengan simpul DALAM loop, bukan penyangga di bawah titik
  //     bawah. Tab naik dari permukaan cawan di sisi dalam → bagian LUAR
  //     cincin MENGGANTUNG bebas.
  //  2. "Jajar genjang miring" → SETENGAH BENAR. Bukan jajar genjang: ini
  //     PENTAGON — atas RUNCIng (apeks di tengah), BAWAH TERPOTONG RATA.
  //     Batang bawah naik ≈13° ke arah luar. Rasio lebar:tinggi ≈1.2:1.
  //  3. "Pita pipih" → SETENGAH BENAR. Tipis dalam-bidang ≈0.04, kedalaman
  //     ≈0.05. Bukan pita setipis kertas.
  //
  // PENYEBAB "JANGGAL" (menurut Claude, berurutan):
  //  a) Belah ketupat 1:1 dgn titik bawah RUNCIng → terbaca seperti
  //     "rambu/permata yang berdiri di sudutnya". Referensi BAWAHNYA RATA.
  //  b) Kaki di bawah titik bawah → cincin tampak "diseimbangkan di bibir
  //     cawan seperti kubus di sudutnya". Referensi: menjorok dari TAB.
  //  c) Batang terlalu gemuk (0.19-0.20 vs 0.14 referensi ≈ 1.4× lebih).
  //  d) Terlalu rendah & menempel persis bibir; referensi MELAYANG.
  //
  // Spesifikasi resmi (siluet LUAR pentagon, bidang vertikal (d, y)):
  //   R  (dalam)       d=0.386  y=−0.486
  //   T  (apeks)       d=0.513  y=−0.405
  //   L  (luar)        d=0.656  y=−0.473
  //   BL (bawah-luar)  d=0.610  y=−0.594
  //   BR (bawah-dalam) d=0.443  y=−0.632
  //   Lubang (offset ke dalam 0.040):
  //        (0.435,−0.502) (0.516,−0.451) (0.606,−0.493)
  //        (0.580,−0.560) (0.468,−0.585)
  //   Tab: (0.411,−0.494) → (0.340,−0.705), panjang 0.223, ≈18° ke dalam
  //   Penampang: 0.040 dalam-bidang × 0.050 kedalaman (pipih)
  //   Kaki penyangga lain: TIDAK ADA. Loop tegak, tanpa rotasi tambahan.
  //
  // BBOX (hitung Claude): L di d=0.656, e=0.050 →
  //   x = z = (0.656 + 0.025)/√2 = 0.4815 ≤ 0.500 (sisa 0.0185) ✓
  //   Vertikal −0.705..−0.405, jauh di dalam ±0.875 ✓
  //
  // ⚠️ KONSTRUKSI: 5 balok terpisah (_cdBatang) membuat ujung persegi tiap
  //    balok saling menabrak di simpul → terlihat "gigi/clipping" (dikonfirmasi
  //    pembaca gambar). Karena itu loop dibuat sebagai SATU RING utuh:
  //    siluet luar + siluet dalam, di-extrude ke kedalaman → sambungan
  //    mitered rapi, tanpa tumpang tindih. Ini wujud nyata "pita pipih
  //    yang ditekuk" seperti di referensi.
  // ── REVISI 4 (2026-10-26): DIGESER KELUAR + DIPERBESAR ──
  // Permintaan user: "gagannya agak dijorokin keluar dikit + ukuran gagang
  // digedein dikit, pelan pelan". Desain lain SUDAH di-ACC → TIDAK diubah.
  //
  // Transformasi: skala 1.06× tentang pusat loop, lalu geser radial keluar
  // +0.014. Keduanya sengaja "dikit" (6% & 0.014 block ≈ 0.03 studs).
  //
  // Batas bbox DIHITUNG (bukan dikira-kira):
  //   d_max = 0.6781, tebal 0.052 → (0.6781 + 0.026)·(1/√2) = 0.4978 ≤ 0.500 ✓
  //   sisa margin 0.0022 block. Vertikal −0.6388..−0.3982, jauh di dalam ±0.875 ✓
  // REVISI 6: diperbesar lagi (+16% tinggi, +28% lebar dari rev5) (tinggi 0.2406 -> 0.2695, lebar 0.2862 -> 0.3205).
  // Skala berpusat di apeks LUAR [0.6781, -0.4703] supaya titik terjauh TETAP
  // 0.4979 <= 0.5000 (batas bbox). Jadi gagang tumbuh ke DALAM dan ke BAWAH.
  // REVISI 8 (2026-10-26) — permintaan user:
  //   "1 batang yang kamu atur tersebut mental jadi aneh, satu batang janggal
  //    tersebut hilangin dah, dia ngerusak design. terus kalau udah kamu
  //    turunin si pegangannya itu kebawah biar kelihatan nyatu sama wadah
  //    lilinnya soalnya itu saya lihat melayang"
  //
  // (a) TAB PENYANGGA DIHAPUS TOTAL. Tab itu memang pengikat satu-satunya,
  //     jadi sebagai gantinya ring diturunkan sampai pita ring sendiri
  //     menyentuh/masuk logam cawan → menyatu secara geometri, bukan diikat.
  // (b) RING DITURUNKAN 0.09 block (0.18 studs) ke bawah.
  //
  // Terukur sebelum revisi: titik terendah ring y=-0.6892, bibir cawan
  // y=-0.7000 → ring menggantung 0.0108 block DI ATAS bibir = MELAYANG.
  // Revisi user "terlalu masuk kebawah, naikin dong": dinaikkan 0.05 block
  // dari posisi -0.09 → net turun 0.04 dari posisi awal.
  // Uji 625 titik sampel pita: 27 titik (4.3%) DI DALAM logam cawan —
  // hanya ujung bawah ring (P4) yang terbenam, sisa pita muncul dari
  // permukaan atas cawan → menempel nyata, TIDAK melayang, TIDAK tenggelam.
  //
  // Batas tetap aman (dihitung, bukan dikira-kira):
  //   y_min -0.7442 > dasar cawan -0.8750  ✓ (tidak menembus)
  //   X maksimum tetap (0.7518+0.026)/√2 = 0.5500 → lebar 1.1000 block
  //   = 2.20 studs (tepat toleransi user, tidak berubah)             ✓
  //   Bentuk & ukuran pentagon TIDAK diubah — hanya translasi vertikal.
  const RING_LUAR = [
    [0.3416, -0.5433],
    [0.5021, -0.4316],
    [0.7518, -0.5253],
    [0.6770, -0.6920],
    [0.4225, -0.7442],
  ];
  const RING_DALAM = [
    [0.4161, -0.5653],
    [0.5067, -0.4949],
    [0.6430, -0.5528],
    [0.5974, -0.6451],
    [0.4605, -0.6787],
  ];
  parts.push({
    tag: 'candleMetal',
    colorFn: () => _cdHex(CD_WARNA.kuninganGelap),
    faces: _cdRing(RING_LUAR, RING_DALAM, 0.052),
  });

  // ══ 6. API — bipiramida 4 sisi, unlit, part SENDIRI (dianimasikan) ══
  // ⚠️ Dua bug ditemukan uji kontak & vision:
  //   1) api ditaruh di x=0 sementara ujung sumbu bergeser → MELAYANG (overlap X negatif)
  //   2) setelah digeser ke sumbuDasarX+bengkok, api masih meleset 0.033 dari
  //      PUSAT ujung sumbu (karena ujung atas prismanya lebih sempit 0.8×).
  //   FIX: hitung pusat X ujung sumbu atas secara eksplisit lalu pakai itu.
  // pusat X ujung atas = dasar + bengkok (ring atas tidak lagi diperkecil
  // sehingga pusatnya tepat di sumbuDasarX + bengkok)
  const ujungSumbuX = sumbuDasarX + toCX(CD_SUMBU_BENGKOK);
  const apiY0 = toCY(CD_Y_SUMBU1) - 0.02;   // benam 0.02 block ke ujung sumbu
  parts.push({
    tag: 'candleApi',
    colorFn: () => _cdHex(0xffc86a),
    faces: _cdApi(
      apiY0,
      toCY(CD_Y_API1),          // puncak = batas atas bbox (1.750 tepat)
      toCX(CD_W_API),
    ).map((fc) => fc.map(([x, y, z]) => [x + ujungSumbuX, y, z])),
  });

  return parts;
}


// ════════════════════════════════════════════════════════════════════════════
// PERAKITAN GEOMETRI — 2 GROUP MATERIAL
// ════════════════════════════════════════════════════════════════════════════

/**
 * Geometri Candle dengan 2 group material:
 *   group 0 = candleLit  (cawan + lilin + sumbu + handle) — lit, vertexColors
 *   group 1 = candleApi  (api)                            — unlit, dianimasikan
 */
export function makeCandleGeometry(THREE) {
  const parts = getCandleParts();
  // ⚠️ 3 GROUP (fix 2026-10-25): logam & lilin WAJIB material terpisah.
  //    Sebelumnya cawan+lilin+sumbu satu material (metalness 0) → kuningan
  //    tampak seperti TANAH LIAT/kardus, bukan logam (terverifikasi vision).
  //    Urutan HARUS sama dengan makeCandleMaterials().
  const URUT = ['candleMetal', 'candleLit', 'candleApi'];
  const geos = URUT.map((tag) => _stBuild(THREE, parts.filter((p) => p.tag === tag)));

  const pos = [], uv = [], col = [];
  const out = new THREE.BufferGeometry();
  let offset = 0;
  geos.forEach((g, gi) => {
    const P = g.getAttribute('position'), U = g.getAttribute('uv'), C = g.getAttribute('color');
    for (let i = 0; i < P.count; i++) {
      pos.push(P.getX(i), P.getY(i), P.getZ(i));
      uv.push(U ? U.getX(i) : 0, U ? U.getY(i) : 0);
      col.push(C ? C.getX(i) : 1, C ? C.getY(i) : 1, C ? C.getZ(i) : 1);
    }
    out.addGroup(offset, P.count, gi);
    offset += P.count;
  });
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  out.computeVertexNormals();
  return out;
}
