/**
 * blockMaterials.js — Registry 21 block dari dataset user (2026-09-11).
 *
 * SUMBER: "C:\Users\user\Babft Project\folder image" — 42 PNG (21 block ×
 * tampak2D + tampak3D), diimpor SESUAI URUTAN dataset (01..42). Aset sudah
 * diproses ke public/blocks/: tex/ (texture tampak2D → material block 3D)
 * dan icon/ (tampak3D background transparan → ikon panel Block Library).
 *
 * PBR properties per material diset agar tiap block TERASA berbeda:
 * Glass/Ice = transparan + licin; Metal/Titanium/Gold = metalik mengkilap;
 * Fabric/Grass/Sand = kasar; Neon = emissive menyala; dll.
 * texturePath/iconPath = URL relatif public (Vite serve otomatis).
 *
 * Pola pemakaian: getBlockMaterial(slug) → THREE.MeshStandardMaterial dengan
 * map texture + PBR sesuai registry (dipakai place-click & ghost preview).
 * getBlockIcon(slug) → URL ikon untuk panel.
 */

// bab 218: SUMBER TUNGGAL outline bintang (badan + cangkang glow)
import { getStarShape, getStarPoints } from './blockShapes.js';

// Phase 70: RoomEnvironment untuk envMap gold berkilau (prosedural — nol
// file asset). THREE tetap lewat parameter fungsi (pola modul ini), hanya
// RoomEnvironment yang diimport langsung. Pakai path examples/jsm (bukan
// three/addons/*) — resolve di Vite DAN di harness importmap browser
// (addons/* hanya eksis via package-exports, harness importmap tak baca).
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const BLOCK_LIBRARY = [
  { slug: 'wood_block',         name: 'Wood',         roughness: 0.85, metalness: 0.0, transparent: false, opacity: 1.0 },
  { slug: 'smooth_wood_block',  name: 'Smooth Wood',  roughness: 0.45, metalness: 0.0, transparent: false, opacity: 1.0 },
  { slug: 'glass_block',        name: 'Glass',        roughness: 0.05, metalness: 0.1, transparent: true,  opacity: 0.62 },
  { slug: 'stone_block',        name: 'Stone',        roughness: 0.95, metalness: 0.0, transparent: false, opacity: 1.0 },
  // NOTE PBR (terukur 2026-09-11): simulator TANPA envMap per-block —
  // metalness tinggi mematikan diffuse & membutuhkan refleksi lingkungan;
  // tanpa envMap hasil = GELAP 3x (gold: texture 245,251,142 → render 87,
  // 90,47). Maka metalness dibatasi <= 0.35: kilau tetap terasa lewat
  // specular highlight + roughness rendah, warna texture tetap hidup.
  { slug: 'rusted_block',       name: 'Rusted',        roughness: 0.9,  metalness: 0.1, transparent: false, opacity: 1.0 },
  { slug: 'metal_block',        name: 'Metal',        roughness: 0.24, metalness: 0.35, transparent: false, opacity: 1.0 },
  { slug: 'concrete_block',     name: 'Concrete',     roughness: 0.95, metalness: 0.0, transparent: false, opacity: 1.0 },
  { slug: 'marble_block',       name: 'Marble',       roughness: 0.14, metalness: 0.05, transparent: false, opacity: 1.0 },
  { slug: 'titanium_block',     name: 'Titanium',     roughness: 0.28, metalness: 0.35, transparent: false, opacity: 1.0 },
  { slug: 'obsidian_block',     name: 'Obsidian',     roughness: 0.07, metalness: 0.1, transparent: false, opacity: 1.0 },
  { slug: 'gold_block',         name: 'Gold',         roughness: 0.15, metalness: 0.2, transparent: false, opacity: 1.0, emissive: 0xd4a017, emissiveIntensity: 0.28 },
  { slug: 'fabric_block',      name: 'Fabric',       roughness: 1.0,  metalness: 0.0, transparent: false, opacity: 1.0 },
  { slug: 'brick_block',       name: 'Brick',        roughness: 0.9,  metalness: 0.0, transparent: false, opacity: 1.0 },
  { slug: 'plastic_block',     name: 'Plastic',      roughness: 0.3,  metalness: 0.05, transparent: false, opacity: 1.0 },
  { slug: 'toy_block',          name: 'Toy',          roughness: 0.4,  metalness: 0.0, transparent: false, opacity: 1.0 },
  { slug: 'ice_block',         name: 'Ice',          roughness: 0.28, metalness: 0.0, transparent: false, opacity: 1.0 }, // FIX tester 2026-09-11: ice dataset = SOLID putih-biru keramik (verifikasi vision) — TIDAK transparan; hanya Glass yang transparan
  { slug: 'neon_block',        name: 'Neon',         roughness: 0.35, metalness: 0.0, transparent: false, opacity: 1.0, emissive: 0xff0000, emissiveIntensity: 1.0, glow: true }, // WAJIB user 2026-09-11: emissive #FF0000 MURNI (bukan ff2a1a) + wajib AURA GLOW ke luar (verifikasi vision dataset: outer glow merah memancar keluar tepi kubus; tubuh merah murni rata)
  { slug: 'coal_block',        name: 'Coal',         roughness: 0.99, metalness: 0.05, transparent: false, opacity: 1.0 },
  { slug: 'bouncy_block',      name: 'Bouncy',       roughness: 0.6,  metalness: 0.0, transparent: false, opacity: 1.0 },
  { slug: 'grass_block',       name: 'Grass',        roughness: 1.0,  metalness: 0.0, transparent: false, opacity: 1.0 },
  { slug: 'sand_block',        name: 'Sand',         roughness: 1.0,  metalness: 0.0, transparent: false, opacity: 1.0 },
  // ── NSI (Non-Scalable Item) — 2026-10-04, permintaan user ──
  // Geometri KHUSUS (bukan kubus) → TIDAK bisa di-scale. Lihat utils/blockShapes.js.
  // Warna identitas: RGB(213,115,61) (#D5733D).
  // NAMA (koreksi user): "Corner Wedge" — BUKAN "Wedge" (Wedge = bentuk ramp
  // biasa, akan dibuat terpisah dari dataset user).
  { slug: 'corner_wedge',      name: 'Corner Wedge', label: 'Corner Wedge', roughness: 0.85, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 1 },
  // NSI #2: WEDGE (ramp / prisma segitiga siku-siku) — 1 bidang miring lurus.
  { slug: 'wedge',             name: 'Wedge',        label: 'Wedge',        roughness: 0.85, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 1 },
  // NSI #3: TRUSS (rangka batang terbuka / open lattice frame) — 20 batang.
  { slug: 'truss',             name: 'Truss',        label: 'Truss',        roughness: 0.85, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 1 },
  // ── NSI #4: ROD (7 varian) — 2026-10-04, permintaan user ──
  // Kotak ramping 1 x 3 x 1 studs (0.5 x 1.5 x 0.5 block). Tekstur = 100%
  // block dasarnya (PBR properties disamakan agar terasa identik).
  { slug: 'wood_rod',          name: 'Wood Rod',     label: 'Wood Rod',     roughness: 0.85, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 1 },
  { slug: 'stone_rod',         name: 'Stone Rod',    label: 'Stone Rod',    roughness: 0.95, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 1 },
  { slug: 'rusted_rod',        name: 'Rusted Rod',   label: 'Rusted Rod',   roughness: 0.9,  metalness: 0.1, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 1 },
  { slug: 'metal_rod',         name: 'Metal Rod',    label: 'Metal Rod',    roughness: 0.24, metalness: 0.35, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 1 },
  { slug: 'concrete_rod',      name: 'Concrete Rod', label: 'Concrete Rod', roughness: 0.95, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 1 },
  { slug: 'marble_rod',        name: 'Marble Rod',   label: 'Marble Rod',   roughness: 0.14, metalness: 0.05, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 1 },
  { slug: 'titanium_rod',      name: 'Titanium Rod', label: 'Titanium Rod', roughness: 0.28, metalness: 0.35, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 1 },
  // ── NSI LEVEL 2 (dekorasi) — 2026-10-04, permintaan user ──
  // SEAT: bangku 4 kaki (1x1x1 block = 2x2x2 studs). Bingkai/kaki = tekstur kayu;
  // dudukan tengah = gelap (vertex color). Punya ARAH HADAP (panah hijau di ghost).
  { slug: 'seat',              name: 'Seat',        label: 'Seat',        roughness: 0.85, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2, hasFacing: true },
  // STEP: undakan/bangku panjang (2x0.5x1 block = 4x1x2 studs). Permukaan atas
  // rata satu bidang, penopang di ujung kiri/kanan, kolong tengah berongga.
  { slug: 'step',              name: 'Step',        label: 'Step',        roughness: 0.85, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // MAST: tiang kapal / crow's nest. Tinggi 36 studs (=18 block), geladak
  // bundar ⌀10 studs (=5 block). TANPA facing. Batas 2x2x2 = Level 1 saja.
  { slug: 'mast',              name: 'Mast',        label: 'Mast',        roughness: 0.85, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // HELM: roda kemudi kapal (identitas "Helm" — sesuai aturan user). 2x5x2 studs.
  { slug: 'helm',              name: 'Helm',        label: 'Helm',        roughness: 0.85, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // WINDOW: jendela kayu + 1 pane kaca. 4x4x1 studs (2x2x0.5 block). Kaca
  // transparan lewat ALPHA PER-VERTEX (vertex color itemSize 4) — BUKAN material
  // array (kontrak: multi-material array DILARANG). Material induk WAJIB
  // transparent:true + depthWrite:false supaya alpha per-vertex dihormati.
  { slug: 'window',            name: 'Window',      label: 'Window',      roughness: 0.85, metalness: 0.0, transparent: true, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // DOOR: pintu kayu INTERAKTIF — NSI PERTAMA yang bisa di-KLIK (buka/tutup).
  // 5.5x7x0.5 studs (2.75x3.5x0.25 block). Kaca panel = alpha per-vertex,
  // sama seperti Window (bukan material array).
  { slug: 'door',              name: 'Door',        label: 'Door',        roughness: 0.85, metalness: 0.0, transparent: true, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // HATCH: palka kayu INTERAKTIF (buka dgn MENGANGKAT) — 4x1x4 studs
  { slug: 'hatch',             name: 'Hatch',       label: 'Hatch',       roughness: 0.85, metalness: 0.0, transparent: true, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // LEGENDARY CHEST: peti harta (DEKORASI, tidak interaktif). 4.5x3.5x4.5 studs.
  { slug: 'legendary_chest',   name: 'Legendary Chest', label: 'Legendary Chest', roughness: 0.72, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // ── 5 CHEST (bab 147, permintaan user 2026-10-11) ──
  // BENTUK 100% SAMA dengan Legendary Chest — pembeda HANYA WARNA RANGKA.
  // Urutan user: ungu → cyan → merah → kuning → hijau.
  // Tekstur: SHARE legendary_chest.png (lihat CHEST_BASE_TEX) supaya 100% identik
  // dan tidak ada file duplikat.
  { slug: 'epic_chest',        name: 'Epic Chest',     label: 'Epic Chest',     roughness: 0.72, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  { slug: 'rare_chest',        name: 'Rare Chest',     label: 'Rare Chest',     roughness: 0.72, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  { slug: 'uncommon_chest',    name: 'Uncommon Chest', label: 'Uncommon Chest', roughness: 0.72, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  { slug: 'common_chest',      name: 'Common chest',   label: 'Common chest',   roughness: 0.72, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // ── NSI LEVEL 2 #9: SMALL TREASURE (bab 149, permintaan user 2026-10-11) ──
  // INTERAKTIF (klik → tutup terangkat) seperti Door/Hatch. 4 x 2.5 x 3 studs.
  // Semua warna dari VERTEX COLOR (rangka emas, badan hitam, pita tulang,
  // bintang ungu, isi emas + 3 permata) — tekstur hanya pengisi halus.
  { slug: 'small_treasure',    name: 'Small Treasure', label: 'Small Treasure', roughness: 0.68, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // ── NSI LEVEL 2 #10: MEDIUM TREASURE (bab 169, permintaan user 2026-10-11) ──
  // RANGKA 100% IDENTIK Small Treasure; pembeda HANYA aksesori: MAHKOTA emas
  // pucat + PERMATA cyan menggantikan bintang ungu. 4 x 4 x 3 studs.
  { slug: 'medium_treasure',   name: 'Medium Treasure', label: 'Medium Treasure', roughness: 0.68, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  { slug: 'big_treasure',      name: 'Big Treasure', label: 'Big Treasure', roughness: 0.68, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // ── NSI LEVEL 2 #11: PINE TREE (bab 180, permintaan user 2026-10-12) ──
  // Referensi: Roblox "Pine Tree - Build a boat" (asset 6574704298).
  // 5 tingkat BINTANG BERGERIGI (6 lidah + 6 takik) + batang; maks 15x15x15 studs
  // (dipakai 10.90 x 15.00 x 9.85 = rasio H:W 1.377 vs referensi 1.368).
  { slug: 'pine_tree',         name: 'Pine Tree', label: 'Pine Tree', roughness: 0.92, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // ── NSI LEVEL 2 #12: TROPHY 1st / 2nd / 3rd (bab 197, permintaan user 2026-10-24) ──
  // BENTUK 100% IDENTIK ketiganya; pembeda HANYA WARNA (emas / perak / perunggu)
  // + warna alas + angka pada plat nama. Ukuran SERAGAM 3 x 4 x 2 studs.
  // ⚠️ bab 200 (laporan user "warnanya aneh di localhost"): metalness DULU
  //    0.85/0.88/0.82 — itu MELANGGAR aturan proyek di atas ("metalness
  //    dibatasi <= 0.35 karena tanpa envmap metalness tinggi MEMATIKAN
  //    diffuse → warna jadi gelap/aneh"). Trophy = vertex color murni, jadi
  //    metalness WAJIB rendah. Kilau logam tetap dapat dari roughness rendah
  //    + emissive tipis (lihat makeBlockMaterial).
  { slug: 'trophy_1st',        name: 'Trophy 1st', label: 'Trophy 1st', roughness: 0.26, metalness: 0.30, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  { slug: 'trophy_2nd',        name: 'Trophy 2nd', label: 'Trophy 2nd', roughness: 0.22, metalness: 0.32, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  { slug: 'trophy_3rd',        name: 'Trophy 3rd', label: 'Trophy 3rd', roughness: 0.30, metalness: 0.28, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // ══ bab 205: TORCH — NSI L2 yang MENGHASILKAN CAHAYA ══
  // roughness 0.82 = logam kasar/kayu terbakar (bukan mengkilap).
  // metalness 0.0 supaya PointLight dari bara tetap terbaca di permukaan
  // (metalness tinggi membuat diffuse nol → lampu tidak terlihat).
  { slug: 'torch',             name: 'Torch',      label: 'Torch',      roughness: 0.82, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // ══ bab 206: LAMP — NSI L2 yang MENGHASILKAN CAHAYA ══
  // roughness 0.55 = logam dipoles sedang (bukan kaca, bukan kayu terbakar).
  // metalness 0.0 supaya PointLight dari inti tetap terbaca di permukaan
  // (metalness tinggi → diffuse nol → lampu tidak terlihat).
  { slug: 'lamp',              name: 'Lamp',       label: 'Lamp',       roughness: 0.55, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // ══ bab 208: CANDLE — NSI L2 yang MENGHASILKAN CAHAYA ══
  // roughness 0.62 = lilin + kuningan (kusam, bukan kaca). metalness 0.0
  // WAJIB supaya PointLight api tetap terbaca di permukaan (metalness tinggi
  // membuat komponen diffuse nol → cahaya tidak terlihat sama sekali).
  { slug: 'candle',            name: 'Candle',     label: 'Candle',     roughness: 0.62, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // ══ bab 209: I-BEAM — NSI L2 balok baja profil I dua arah ══
  // TEKSTUR = metal_block.png DINETRALKAN → i_beam.png abu-abu logam murni
  // (terukur mean RGB 98,98,98, delta R-G/B-G = 0). Riwayat: user minta tekstur
  // metal (2026-10-29), lalu koreksi warna: *"itu warna default I-beam abu abu
  // ya bukan warna kaya gini"* — tint hangat metal_block dibuang, pola
  // gold_block__neutral (bab 202b): struktur/kilau tetap, hue dihapus.
  // roughness/metalness = SALINAN PERSIS metal_block (0.24/0.35 — review Claude:
  // jangan beda dari material metal yang sudah terbukti tampil benar di app).
  { slug: 'i_beam',            name: 'I-Beam',     label: 'I-Beam',     roughness: 0.24, metalness: 0.35, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // ══ bab 210: CHAIR — NSI L2 kursi pedestal cangkang ══
  // TEKSTUR = plastic_block.png DINETRALKAN → chair.png (PERINTAH USER
  // 2026-10-31: *"teksturnya wajib plastic bukan tekstur dari marble block"*).
  // Badan putih; permukaan duduk+sandaran-depan = HITAM via vertex color
  // (pola Seat, 0.10). roughness 0.55 = plastik halus; metalness 0.
  { slug: 'chair',             name: 'Chair',      label: 'Chair',      roughness: 0.55, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2, hasFacing: true },
  // ══ bab 211: THRONE — NSI L2 singgasana emas voxel ══
  // Tekstur = plastic_block DINETRALKAN putih (sama pola Chair) — warna EMAS
  // & MARUN datang dari VERTEX COLOR per kotak (preseden Trophy: warna
  // penuh sah). roughness 0.5 = emas sadung halus.
  { slug: 'throne',            name: 'Throne',     label: 'Throne',     roughness: 0.5, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2, hasFacing: true },
  // ══ bab 214: FLAG — NSI L2 bendera gantung (banner portrait) ══
  // Warna lewat 2 TEXTURE khusus (flag_fabric dari fabric block + flag_pole
  // dari brick block, sudah di-tint terkalibrasi) — BUKAN vertex color
  // (pola Lamp: material group, lihat makeFlagMaterials di bawah).
  { slug: 'flag',              name: 'Flag',       label: 'Flag',       roughness: 0.8, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // bab 218: Star — SATU-SATUNYA NSI bertekstur NEON (emissive kuning + glow).
  // Material TIDAK lewat cabang `if (def.glow)` (hardcode merah 0xff0000) —
  // punya cabang sendiri `makeStarMaterials` yang diambil SEBELUM cabang glow.
  // `glow:true` tetap diset agar app memasang AURA SPRITE (sistem glow
  // terverifikasi bab 92) — memancar keluar tepi bintang.
  { slug: 'star',              name: 'Star',       label: 'Star',       roughness: 1.0, metalness: 0.0, transparent: false, opacity: 1.0, emissive: 0xffff00, emissiveIntensity: 1.4, glow: true, nsi: true, nsiLevel: 2 },
  // bab 222: Sign — papan tanda INTERAKTIF (klik saat dekat → modal teks →
  // teks/simbol/emote tampil di papan). Material generik + vertex color tint
  // + tekstur GRAYSCALE smooth_wood_block (pola Door bab 136). Plane teks
  // dipasang jalur place app (canvas texture, bukan di sini).
  { slug: 'sign',              name: 'Sign',       label: 'Sign',       roughness: 0.85, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // bab 225: BREAD — loaf roti tawar (muka irisan + crust, atas 2 gulungan)
  // roughness 0.95 = permukaan roti matte; metalness 0.
  { slug: 'bread',             name: 'Bread',      label: 'Bread',      roughness: 0.95, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2, hasFacing: true },
  // bab 227: CAKE — kue kotak voxel (badan cokelat + krim putih + sprinkles)
  // Vertex color murni (tanpa tekstur) — lihat makeCakeMaterials().
  { slug: 'cake',              name: 'Cake',       label: 'Cake',       roughness: 0.88, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
  // bab 230: Pumpkin — vertex color murni (unlit), TOGGLE muka via klik.
  { slug: 'pumpkin',           name: 'Pumpkin',    label: 'Pumpkin',    roughness: 0.90, metalness: 0.0, transparent: false, opacity: 1.0, nsi: true, nsiLevel: 2 },
];

// ══════════════════════════════════════════════════════════════════════════
// bab 206: LAMP — 3 MATERIAL (logam / kaca / inti) untuk satu geometry
// ══════════════════════════════════════════════════════════════════════════
// URUTAN INDEKS WAJIB SAMA dengan addGroup() di makeLampGeometry():
//   0 = lampMetal (opaque) · 1 = lampGlass (transparan) · 2 = lampCore (unlit)
//
// ⚠️ PELAJARAN YANG DIPATUHI:
//  - Vertex color = PENGALI. Semua nilai ST_WARNA lamp* ≤ 1.0 (bab 200).
//  - Kaca: depthWrite:false WAJIB (bug 2026-10-01: transparansi berubah
//    tergantung sudut pandang kalau depth buffer ditulis).
//  - Inti: MeshBasicMaterial (bukan Standard) → tidak butuh cahaya, selalu
//    terang. Ini yang membuat "lampu menyala" terbaca walau scene gelap.
//  - DoubleSide untuk logam (pola Torch: _stBuild selalu _stFaceOutward).
//  - Kaca juga DoubleSide: tanpa itu, sisi belakang kaca hilang saat kamera
//    masuk ke dalam volume kaca.
export function makeLampMaterials(THREE, tex, def) {
  const baseColor = tex && tex.userData.isReady
    ? 0xffffff
    : (BLOCK_PLACEHOLDER.lamp || 0xffffff);

  // [0] LOGAM — opaque
  const matMetal = new THREE.MeshStandardMaterial({
    map: tex,
    color: baseColor,
    roughness: def.roughness,
    metalness: def.metalness,
    side: THREE.DoubleSide,
    vertexColors: true,
  });
  matMetal.userData.isLampMetal = true;

  // [1] KACA — transparan, TANPA depthWrite
  const matGlass = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.12,
    metalness: 0.0,
    side: THREE.DoubleSide,
    vertexColors: true,
    transparent: true,
    opacity: 0.34,        // cukup bening untuk melihat inti, cukup pekat
                          // untuk membaca "ada kaca" (terukur dari referensi)
    depthWrite: false,    // WAJIB (bug 2026-10-01)
    // renderOrder di mesh, bukan material. Lihat makeLampMesh() di simulator.
  });
  matGlass.userData.isLampGlass = true;

  // [2] INTI — UNLIT (MeshBasic): selalu menyala, tidak tergantung lampu scene
  const matCore = new THREE.MeshBasicMaterial({
    color: 0xffffff,      // warna asli dari vertex color (lampCore kuning)
    vertexColors: true,
    side: THREE.DoubleSide,
    toneMapped: false,    // jangan dibasuh ACES → kuning tetap pekat
    fog: false,
  });
  matCore.userData.isLampCore = true;

  return [matMetal, matGlass, matCore];
}


// ══════════════════════════════════════════════════════════════════════════
// bab 208: CANDLE — 2 MATERIAL (badan lit / api unlit) untuk satu geometry
// ══════════════════════════════════════════════════════════════════════════
// URUTAN INDEKS WAJIB SAMA dengan addGroup() di makeCandleGeometry():
//   0 = candleLit (opaque, lit)  ·  1 = candleApi (unlit, selalu menyala)
//
// ⚠️ PELAJARAN YANG DIPATUHI:
//  - Vertex color = PENGALI. Semua nilai ST_WARNA candle* ≤ 1.0.
//  - Api WAJIB MeshBasicMaterial (bukan Standard): api harus terbaca terang
//    walau scene gelap / blok di tempat teduh. toneMapped:false supaya kuning
//    tidak dibasuh ACES jadi putih pucat.
//  - DoubleSide untuk keduanya (pola Torch/Lamp: _stBuild selalu
//    _stFaceOutward, dan api dianimasikan dengan skala Y).
export function makeCandleMaterials(THREE, tex, def) {
  const baseColor = tex && tex.userData.isReady
    ? 0xffffff
    : (BLOCK_PLACEHOLDER.candle || 0xffffff);

  // ⚠️ 3 MATERIAL (fix 2026-10-25) — cawan/lilin/sumbu TIDAK boleh satu
  //    material. Terbukti lewat render uji: dengan metalness 0 seragam,
  //    kuningan terbaca sebagai TANAH LIAT/kardus (vision: "dull mustard").
  //    Logam butuh metalness tinggi + roughness rendah; lilin justru
  //    sebaliknya (matte, non-logam). Urutan = URUT di makeCandleGeometry.

  // [0] LOGAM (cawan + bibir + handle) — metallic, mengkilap
  const matMetal = new THREE.MeshStandardMaterial({
    map: tex,
    color: baseColor,
    roughness: 0.34,       // cukup rendah → ada highlight logam
    metalness: 0.85,       // hampir logam penuh
    side: THREE.DoubleSide,
    vertexColors: true,
  });
  matMetal.userData.isCandleMetal = true;

  // [1] LILIN + SUMBU — matte, non-logam
  const matLit = new THREE.MeshStandardMaterial({
    map: tex,
    color: baseColor,
    roughness: 0.86,       // wax matte
    metalness: 0.0,
    side: THREE.DoubleSide,
    vertexColors: true,
  });
  matLit.userData.isCandleLit = true;

  // [2] API — UNLIT (MeshBasic): selalu menyala
  const matApi = new THREE.MeshBasicMaterial({
    color: 0xffffff,        // warna asli dari vertex color (kuning api)
    vertexColors: true,
    side: THREE.DoubleSide,
    toneMapped: false,
    fog: false,
  });
  matApi.userData.isCandleApi = true;

  return [matMetal, matLit, matApi];
}

// ══════════════════════════════════════════════════════════════════════════
// bab 214: FLAG — 2 MATERIAL (kain / keras) untuk satu geometry
// ══════════════════════════════════════════════════════════════════════════
// ── bab 218: STAR — material NEON (array 2 grup, pola Lamp/Flag) ──────────
// KOREKSI bab 219 ronde 1 (kritik Claude atas render 4 sudut — skor neon
// 4.5/10): (1) RIM PANAS — ExtrudeGeometry punya 2 grup material (0 = tutup
// depan+belakang, 1 = dinding samping+bevel) → dinding+bevel pakai emissive
// PUCAT (0xffffa0) supaya TEPI menjadi sumber cahaya (referensi punya rim
// putih-kuning di sepanjang outline); bevel 0.02→0.03 (di makeStarGeometry)
// supaya cincin rim ~2% lebar bintang. (2) emissiveIntensity 1.4→1.0: dgn
// toneMapped:false kuning sudah jenuh di 1.0 — 1.4 hanya clipping. (3) bercak
// spekuler dibuang: MeshPhysicalMaterial specularIntensity 0.
// Konvensi neon app (bab 90): color HITAM, emissive yang menyala → flat.
// Texture TIDAK dipakai (neon polos; star.png tidak ada → jalur generik 404).
/**
 * makeSignMaterials(THREE) — NSI "Sign" (bab 222). SATU material: tekstur
 * GRAYSCALE smooth_wood_block × vertex color tint per part (pola Door bab
 * 136 — tekstur gelap × vertex color = HITAM). depthWrite true (opaque,
 * anti tembus — pola Door bab 136 #1).
 */
export function makeSignMaterials(THREE) {
  const tex = getBlockTexture(THREE, 'sign');
  // bab 222 ronde 3 (kalibrasi pipet): MeshStandardMaterial + cahaya app +
  // ACES menggelapkan papan 2x (terukur (121,112,89) vs target (201,165,96))
  // walau tekstur sudah putih — MIRIP pola LAMP: MeshBasicMaterial = UNLIT
  // (selalu menyala), warna akhir = vertex tint x tekstur EKSAK.
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    vertexColors: true,          // tint per part dari geometri (papan/kubus)
    toneMapped: false,           // warna referensi eksak (ACES merusak)
  });
  // bab 222 ronde 2 (Claude): anti seam persegi — mirror wrap menghilangkan
  // garis keras di batas tile
  if (tex) { tex.wrapS = THREE.MirroredRepeatWrapping; tex.wrapT = THREE.MirroredRepeatWrapping; }
  if (!tex.userData.isReady && tex.userData.onReady) {
    tex.userData.onReady.push(() => { mat.color.set(0xffffff); mat.needsUpdate = true; });
  }
  return mat;
}

/**
 * makeBreadMaterials(THREE) — NSI "Bread" (bab 225). ARRAY 2 material,
 * URUTAN = grup ExtrudeGeometry makeBreadGeometry():
 *   0 = muka IRISAN (map bread_face.png — ring crust + krem + grain,
 *       digambar dari path profil yang sama dgn geometri)
 *   1 = dinding CRUST (map bread.png — oranye noise + streak memanjang)
 * MeshStandardMaterial (shading 3D penting utk loaf — bukan UNLIT);
 * roughness 0.95 matte. vertexColors FALSE default (pipeline place hanya
 * menyalakan kalau geometri punya atribut color — bread punya color putih
 * seragam, jadi tidak menyala → warna murni dari tekstur).
 * Tekstur via getBlockTexture (cache + onReady; bread.png & bread_face.png
 * keduanya resolve otomatis dari slug — tanpa special-case).
 */
export function makeBreadMaterials(THREE) {
  const face = getBlockTexture(THREE, 'bread_face');
  const side = getBlockTexture(THREE, 'bread');
  // bab 225 ronde 2 (brainstorm Claude ronde 1 — kritik "warna terlalu gelap,
  // krem jadi zaitun"): roughness 0.95→0.65 (kilau lembut kubah) + emissiveMap
  // SAMA dengan map @ intensity 0.30 → warna tetap terbaca di cahaya redup
  // TANPA kehilangan shading 3D (Bread bisa diputar — dilarang bake vertex).
  const mFace = new THREE.MeshStandardMaterial({
    map: face || null,
    emissiveMap: face || null,
    emissive: 0xffffff, emissiveIntensity: 0.30,
    roughness: 0.65, metalness: 0.0,
    vertexColors: false,
  });
  const mSide = new THREE.MeshStandardMaterial({
    map: side || null,
    emissiveMap: side || null,
    emissive: 0xffffff, emissiveIntensity: 0.30,
    roughness: 0.65, metalness: 0.0,
    vertexColors: false,
  });
  return [mFace, mSide];
}

/**
 * makeCakeMaterials(THREE) — NSI "Cake" (bab 227).
 * v3 (brainstorm Claude ronde 1): UNLIT — MeshBasicMaterial + shading
 * per-muka yang sudah di-bake ke vertex color geometri (atas 1.0, sisi 0.85,
 * bawah 0.55). Alasan terukur: MeshStandardMaterial di scene ini hanya
 * menghasilkan putih ±56-69% (#B0 atas / #8F depan) → krim terbaca abu-abu.
 * Tanpa tekstur: seluruh warna dari atribut color.
 */
export function makeCakeMaterials(THREE) {
  return new THREE.MeshBasicMaterial({
    vertexColors: true,   // warna + shading sudah di-bake di geometri
    toneMapped: false,    // warna primer tetap jenuh (ACES mendesaturasi)
    fog: false,
  });
}

export function makeStarMaterials(THREE) {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0x000000,           // bab 90: color HITAM, emissive yang menyala
    emissive: 0xffff00,        // kuning murni — BADAN SERAGAM (dinding+samping+
                               // bevel sama; referensi seragam, tanpa garis
                               // batas tutup-dinding di dalam siluet)
    emissiveIntensity: 1.0,    // koreksi Claude bab 219 ronde 1 (1.4 = clipping)
    roughness: 1, metalness: 0,
    specularIntensity: 0,      // buang bercak spekuler (referensi rata)
    fog: false,
    toneMapped: false,         // kuning murni (ACES merusak saturasi)
    vertexColors: false,
    // STENCIL MASK (bab 219 ronde 3): badan MENULIS stencil 1 → aura glow
    // (NotEqual 1) TIDAK menimpa badan sendiri di sudut miring.
    stencilWrite: true, stencilRef: 1,
    stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp,
  });
  m.userData.isGlowBlock = true;   // highlight gizmo DILARANG menimpa
  return m;
}

/**
 * makeStarGlowMesh(THREE) — AURA CANGKANG GLOW (bab 219 ronde 3, resep Claude).
 * 14 lapis outline yang MENGEMBANG digabung jadi SATU mesh (1 draw call):
 *  - offsetOutline: pucuk cembung → BUSUR membulat (anti pucuk runcing miter
 *    2.3x), lembah → miter.
 *  - profil alpha EKSPONENSIAL (D=0.12, tau=0.032, A=0.9) → gradasi halus,
 *    bukan anak tangga.
 *  - warna: 0xffffa0 (dalam, pucat) → 0xffd000 (luar, kuning jenuh) — tepi
 *    putih-kuning memudar halus seperti referensi.
 *  - atribut color itemSize 4 (RGBA) → vertex ALPHA (pola bab 134).
 *  - BackSide + additive + depthWrite:false → hanya tampak DI LUAR siluet.
 *  - STENCIL NotEqual 1 → tidak menimpa badan sendiri.
 */
function starOutlineOffset(pts, d, arcSteps = 5) {
  const n = pts.length, out = [];
  const nrm = (a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    return [dy / L, -dx / L];
  };
  for (let i = 0; i < n; i++) {
    const p = pts[(i + n - 1) % n], c = pts[i], q = pts[(i + 1) % n];
    const n1 = nrm(p, c), n2 = nrm(c, q);
    const cross = (c[0] - p[0]) * (q[1] - c[1]) - (c[1] - p[1]) * (q[0] - c[0]);
    if (cross > 0) {                          // pucuk (cembung): busur
      const a1 = Math.atan2(n1[1], n1[0]);
      let da = Math.atan2(n2[1], n2[0]) - a1;
      while (da < 0) da += 2 * Math.PI;
      while (da > Math.PI) da -= 2 * Math.PI;
      for (let k = 0; k <= arcSteps; k++) {
        const a = a1 + (da * k) / arcSteps;
        out.push([c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d]);
      }
    } else {                                  // lembah: miter
      const s = d / (1 + n1[0] * n2[0] + n1[1] * n2[1]);
      out.push([c[0] + (n1[0] + n2[0]) * s, c[1] + (n1[1] + n2[1]) * s]);
    }
  }
  return out;
}

function makeStarGlowMesh(THREE, pts, T = 0.5) {
  // bab 219 ronde 4 (tweak Claude): N=18, offset RAPAT di dekat tepi
  // (pow 1.6) supaya sisa banding hilang; warna lebih KEEMASAN
  // (0xffff80 → 0xffc800) supaya halo tidak krem-putih; A 0.9→0.8, tau 0.03.
  // bab 219 ronde 5 — KALIBRASI DARI PENGUKURAN PIKSEL NYATA (bukan perkiraan
  // mata): profil referensi (bg 70,72,88) = kontribusi aditif +100 di 6px,
  // +35 di 15px, +4 di 30px (bintang 460px), lalu HABIS. B kontribusi = 0
  // (glow KUNING murni, tanpa biru). Dari situ: A=0.87, tau=0.025, D=0.13,
  // warna 0xffff20 → 0xffe000.
  const N = 18, D = 0.11, tau = 0.019, A = 0.44;
  const P = (d) => A * Math.exp(-d / tau);
  const pos = [], col = [];
  const cIn = new THREE.Color(0xffd000), cOut = new THREE.Color(0xffc000);
  const cTmp = new THREE.Color();
  for (let i = 1; i <= N; i++) {
    const d = D * Math.pow(i / N, 1.6);
    const d0 = D * Math.pow((i - 1) / N, 1.6);
    const a = P(d0) - P(d);
    cTmp.copy(cIn).lerp(cOut, Math.pow(i / N, 0.7));
    const out = starOutlineOffset(pts, d);
    const shape = new THREE.Shape(out.map(([x, y]) => new THREE.Vector2(x, y)));
    const g2 = new THREE.ExtrudeGeometry(shape, {
      depth: T + 2 * d, bevelEnabled: false, curveSegments: 1,
    });
    // bab 221: cangkang ikut TIDURAN — rotasi sama dengan badan (rotateX -90°)
    g2.translate(0, 0, -(T / 2 + d));
    g2.rotateX(-Math.PI / 2);
    const pp = g2.attributes.position;
    for (let k = 0; k < pp.count; k++) {
      pos.push(pp.getX(k), pp.getY(k), pp.getZ(k));
      col.push(cTmp.r, cTmp.g, cTmp.b, a);
    }
    g2.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); // RGBA
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, side: THREE.BackSide,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    fog: false,
    stencilWrite: true, stencilRef: 1,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.KeepStencilOp,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 1; mesh.raycast = () => {};
  return mesh;
}

export function makeFlagMaterials(THREE) {
  const mk = (texSlug, placeholder, rough) => {
    const tex = getBlockTexture(THREE, texSlug);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      color: tex.userData.isReady ? 0xffffff : placeholder,
      roughness: rough,
      metalness: 0.0,
      side: THREE.DoubleSide,
      vertexColors: true,   // bab 214: tint pengali per kotak (garis 0.6, rantai selang) — ≤1.0
    });
    if (!tex.userData.isReady) {
      tex.userData.onReady.push(() => { try { mat.color.set(0xffffff); } catch (e) {} });
    }
    return mat;
  };
  return [
    mk('flag_fabric', 0xb8384e, 0.85),   // [0] kain — placeholder marun
    mk('flag_pole', 0x9aa0a6, 0.6),      // [1] keras — placeholder abu metal
  ];
}


export const DEFAULT_BLOCK_SLUG = 'wood_block';

// ── NSI #4: ROD — tekstur 100% dari block dasarnya (permintaan user) ──
// Tidak ada file tex/wood_rod.png; path di-MAP ke tex/wood_block.png supaya
// tekstur dijamin identik (single source) dan tidak ada duplikasi file.
// ── 5 CHEST: tekstur DI-SHARE dari legendary_chest.png (bab 147) ──
// Pembeda 5 chest murni WARNA VERTEX (rangka), bukan tekstur. Menunjuk ke satu
// file menjamin tidak ada duplikat + tekstur kayu/baut dijamin identik.
const CHEST_BASE_TEX = {
  epic_chest: 'legendary_chest',
  rare_chest: 'legendary_chest',
  uncommon_chest: 'legendary_chest',
  common_chest: 'legendary_chest',
  small_treasure: 'legendary_chest',   // bab 149: share (nol duplikat)
  medium_treasure: 'legendary_chest',  // bab 169: share (rangka sama)
  big_treasure: 'legendary_chest',     // bab 178: share (rangka sama)
  pine_tree: 'pine_tree',              // bab 180g: tekstur KHUSUS (grass di-desaturasi) —
                                       // terukur: pine_tree.png mean RGB(32.1,64.2,39.9)
                                       // vs referensi RGB(32.1,58.6,34.6) — cocok
  // bab 197: TROPHY — tekstur SERAGAM netral abu (marble_block mean 201.7,199.8,200.1,
  // sat 0.01 = praktis tak berwarna) supaya WARNA MURNI dari vertex color
  // (emas/perak/perunggu) tanpa tercemar hue tekstur.
  // ══════════════════════════════════════════════════════════════════════
  // bab 202 (PERMINTAAN USER): 1st & 2nd WAJIB pakai tekstur GOLD, bukan
  // marble. User: "khusus trophy 1st dan 2nd pakai material gold yang dicat
  // jatah warna masing-masing piala".
  // ⚠️ TAPI tekstur gold_block ASLI itu KUNING LEMON (terukur mean
  //    RGB 245.8, 252, 143). Kalau dipakai mentah lalu dikali warna biru,
  //    hasilnya HIJAU KEKUNINGAN — bukan biru. Jadi yang dipakai adalah
  //    varian NEUTRAL-nya (gold_block__neutral.png, terukur grayscale
  //    mean 251.1 / range 238..255): STRUKTUR & kilau gold tetap ada,
  //    hue dibuang, lalu dicat warna jatah masing-masing piala.
  // ⚠️ 3rd TIDAK DISENTUH (user: "yang 3rd jangan diubah, itu udah
  //    sempurna") → tetap marble_block.
  // ══════════════════════════════════════════════════════════════════════
  trophy_1st: 'gold_block',
  trophy_2nd: 'gold_block',
  trophy_3rd: 'marble_block',
};

const ROD_BASE_TEX = {
  wood_rod: 'wood_block',
  stone_rod: 'stone_block',
  rusted_rod: 'rusted_block',
  metal_rod: 'metal_block',
  concrete_rod: 'concrete_block',
  marble_rod: 'marble_block',
  titanium_rod: 'titanium_block',
};

export function getBlockDef(slug) {
  return BLOCK_LIBRARY.find(b => b.slug === slug) || BLOCK_LIBRARY[0];
}

// ══════════════════════════════════════════════════════════════════════════
// bab 202b — TEKSTUR TROPHY 1st/2nd: GOLD **NETRAL** (bukan gold kuning mentah)
// ⚠️ TERUKUR (bukan dugaan):
//    gold_block.png          → meanSat 0.433 (kuning kuat), std 2.9
//    gold_block__neutral.png → meanSat 0.000 (netral),      std 2.32
//    Kalau gold kuning dipakai mentah × vertex color biru (trDiamond
//    0.15,0.56,1.00) → hasilnya HIJAU (terbukti di layar: 2nd jadi mint).
//    Jadi yang dipakai varian NEUTRAL: struktur/kilau gold tetap, hue
//    dibuang, warna datang dari cat vertex color masing-masing piala.
// ⚠️ trophy_3rd TIDAK ada di sini → tetap marble_block (user: jangan diubah).
// ══════════════════════════════════════════════════════════════════════════
const TROPHY_TEX_PATH = {
  trophy_1st: '/blocks/tint/gold_block__neutral.png',
  trophy_2nd: '/blocks/tint/gold_block__neutral.png',
};

export function getBlockTexPath(slug) {
  if (TROPHY_TEX_PATH[slug]) return TROPHY_TEX_PATH[slug];
  if (slug === 'sign') return '/blocks/tex/sign_wood.png';   // bab 222: grayscale TERNORMALISASI (mean 0.85, kontras 60%) — smooth_wood_block asli = cokelat-merah gelap (R118 G42 B10, lum 0.22) → papan jadi MERAH MARUN
  const src = ROD_BASE_TEX[slug] || CHEST_BASE_TEX[slug] || slug;
  return `/blocks/tex/${src}.png`;
}

export function getBlockIconPath(slug) {
  return `/blocks/icon/${slug}.png`;
}

// Cache THREE.TextureLoader per-slug supaya block berulang share texture
// (jangan load ulang tiap place — memory leak).
let _loader = null;
const _texCache = new Map();

// Post-process tekstur yang butuh koreksi warna (keputusan 2026-09-11):
// texture gold dataset = kuning LEMON pucat tanpa kilau (verifikasi vision
// atas texture mentah: "hampir mustahil dikira Gold"). Koreksi dilakukan di
// MEMORI (canvas) saat load — file dataset asli TIDAK diubah:
//   - geser hue dingin → hangat (lemon → emas oranye)
//   - saturasi naik, kontras naik (kesan "rich")
// Map slug → { hueShift (deg), sat (mult), contrast (mult), gamma (lift v) }
const TEX_FIX = {
  gold_block: { hueShift: -18, sat: 1.45, contrast: 1.25 },
  // Phase 70 v3 (PERINTAH USER 2026-09-13): "jadikan dataset langsung
  // jadi tekstur blocknya — tempel (19)/(23)/(35) langsung ke 6 sisi".
  // SEMUA koreksi obsidian/fabric/coal DIHAPUS TOTAL (gamma v1 & v2
  // dua-duanya ditolak user: v1 "terlalu terang", v2 pun masih "melawan
  // dataset"). Texture = file dataset ASLI mentah, nol modifikasi.
  // (PBR roughness/metalness tetap dari registry — itu sifat material,
  // bukan warna.)
  // Phase 70 v4 (user 2026-09-13): "khusus coal TERANGIN DIKIT, dikit
  // doang" — gamma MINIM 1.35 saja (obsidian & fabric TETAP mentah);
  // hue/sat/contrast 0/1/1 = identitas warna dataset 100% utuh.
  coal_block:    { hueShift: 0, sat: 1.0, contrast: 1.0, gamma: 1.35 },
  // Phase 70 v5 (user 2026-09-13: "yang kamu lakukan dikit ke coal
  // bagus loh, bisa diterapin sama persis ke fabric block?"):
  // gamma 1.35 PERSIS sama coal. Obsidian TETAP mentah.
  fabric_block:  { hueShift: 0, sat: 1.0, contrast: 1.0, gamma: 1.35 },
};

function applyTexFix(img, fix) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width; canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
    // RGB→HSV
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const v = max, s = max === 0 ? 0 : (max - min) / max;
    let h = 0;
    if (max !== min) {
      const dd = max - min;
      if (max === r) h = ((g - b) / dd + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / dd + 2) * 60;
      else h = ((r - g) / dd + 4) * 60;
    }
    // fix (semua field opsional — default = identitas)
    let hh = (h + (fix.hueShift ?? 0) + 360) % 360;
    const ss = Math.min(1, s * (fix.sat ?? 1));
    let vv = Math.min(1, 0.5 + (v - 0.5) * (fix.contrast ?? 1));
    // gamma lift (Phase 70): angkat brightness nilai gelap — v^(1/gamma);
    // gamma 1 = no-op. Dipakai obsidian/fabric/coal (anti gelap total).
    if (fix.gamma && fix.gamma > 0) vv = Math.min(1, Math.pow(vv, 1 / fix.gamma));
    // HSV→RGB
    const c = vv * ss, x = c * (1 - Math.abs(((hh / 60) % 2) - 1)), m = vv - c;
    let rr = 0, gg = 0, bb = 0;
    if (hh < 60) { rr = c; gg = x; }
    else if (hh < 120) { rr = x; gg = c; }
    else if (hh < 180) { gg = c; bb = x; }
    else if (hh < 240) { gg = x; bb = c; }
    else if (hh < 300) { rr = x; bb = c; }
    else { rr = c; bb = x; }
    d[i] = Math.round((rr + m) * 255);
    d[i + 1] = Math.round((gg + m) * 255);
    d[i + 2] = Math.round((bb + m) * 255);
  }
  ctx.putImageData(id, 0, 0);
  return canvas;
}

// Placeholder warna per-block (dipakai material sebelum texture ready —
// anti "hitam dulu": block tampil warna dominan texture-nya, bukan hitam).
export const BLOCK_PLACEHOLDER = {
  wood_block: 0xc8a24a, smooth_wood_block: 0xd8b06a, glass_block: 0x9fd4f2,
  stone_block: 0x8a8a8a, rusted_block: 0x9c5f3f, metal_block: 0xb9c1cc,
  concrete_block: 0xa8a49c, marble_block: 0xe8e4dc, titanium_block: 0xcdd6de,
  obsidian_block: 0x2a2340, gold_block: 0xf5db42, fabric_block: 0xd97fa8,
  brick_block: 0xb0603c, plastic_block: 0x74c7ec, toy_block: 0x64d487,
  ice_block: 0x9de0f0, neon_block: 0xff2a1a, coal_block: 0x232323,
  bouncy_block: 0xe86aa0, grass_block: 0x69c34c, sand_block: 0xe3d28f,
  // NSI #4: Rod — placeholder = warna dominan block dasarnya (anti "hitam dulu").
  wood_rod: 0xc8a24a, stone_rod: 0x8a8a8a, rusted_rod: 0x9c5f3f,
  metal_rod: 0xb9c1cc, concrete_rod: 0xa8a49c, marble_rod: 0xe8e4dc,
  titanium_rod: 0xcdd6de,
  // NSI Level 2: Seat & Step — placeholder warna kayu.
  seat: 0xc8a24a, step: 0xc8a24a, mast: 0xc8a24a, helm: 0xc4622a,
  window: 0xc8a24a,   // bingkai kayu (kaca = alpha per-vertex, bukan tint)
  small_treasure: 0x8a6a12,   // bab 149: emas gelap (warna asli = vertex color)
  medium_treasure: 0x8a6a12,  // bab 169: sama (warna asli = vertex color)
  big_treasure: 0x8a6a12,     // bab 178: sama
  pine_tree: 0x2b4a2b,        // bab 180: hijau pinus (warna asli = vertex color)
  // bab 197: TROPHY — placeholder logam (warna asli = vertex color).
  trophy_1st: 0xffd24a, trophy_2nd: 0x6fd3ff, trophy_3rd: 0xc8703a,
  door: 0xc4622a,     // pintu kayu — cokelat jingga hangat (referensi)
  hatch: 0xc4622a,    // palka kayu — sama keluarga kayu Door
  legendary_chest: 0xb0752f,   // peti kayu cokelat (logam magenta = vertex color)
  // 5 chest: placeholder SAMA (kayu) — pembeda warna rangka = vertex color.
  epic_chest: 0xb0752f, rare_chest: 0xb0752f,
  torch: 0x6b5540,        // bab 205: cokelat-logam (warna asli = vertex color)
  lamp: 0x1a2028,         // bab 206: navy gelap (warna asli = vertex color)
  i_beam: 0x626262,       // bab 209: abu-abu logam (= mean tekstur metal netral)
  chair: 0xd8d8d8,        // bab 210: badan putih (tekstur marble netral terang)
  flag: 0xb8384e,         // bab 214: marun kain (placeholder material group [0])
  star: 0xffff00,         // bab 218: kuning neon (placeholder sebelum siap)
  sign: 0xc9a560,         // bab 222: kayu terang papan
  uncommon_chest: 0xb0752f, common_chest: 0xb0752f,
};

// PRELOAD semua texture Block Library (optimasi tester 2026-09-11):
// dulu texture di-load on-demand saat place pertama → block tampil HITAM
// dulu baru texture muncul ("sangat lambat"). Sekarang SEMUA 21 texture
// di-fetch SEKALI di init scene; place tinggal pakai texture yang sudah
// di cache — tampil instan, tanpa jeda.
// caller (init scene) menyediakan THREE.
export function preloadBlockTextures(THREE) {
  let loaded = 0;
  BLOCK_LIBRARY.forEach(b => {
    // getBlockTexture memulai fetch + caching; onLoad menghitung selesai.
    const tex = getBlockTexture(THREE, b.slug);
    if (tex.userData.__preloaded) return;
    tex.userData.__preloaded = true;
    const done = () => { loaded++; };
    if (tex.image && tex.image.width > 0) done();
    else {
      tex.userData.__preloadDone = done; // dipanggil oleh applyTexFix path / loader
      const check = setInterval(() => {
        if (tex.image && tex.image.width > 0) { clearInterval(check); done(); }
      }, 150);
      setTimeout(() => clearInterval(check), 15000); // guard stop
    }
  });
  return { get loadedCount() { return loaded; }, total: BLOCK_LIBRARY.length };
}

export function getBlockTexture(THREE, slug) {
  if (!_loader) _loader = new THREE.TextureLoader();
  if (!_texCache.has(slug)) {
    const tex = _loader.load(getBlockTexPath(slug));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    // Sinyal texture-ready (anti-hitam tester 2026-09-11): material pemakai
    // texture memasang callback di sini; saat texture termuat, material
    // reset color placeholder → putih (texture tampil murni). Terukur:
    // tint placeholder × texture = block oranye pekat gelap (129,81,16 →
    // 76,29,3) — placeholder HANYA boleh hidup sebelum texture siap.
    tex.userData.onReady = [];
    tex.userData.isReady = !!(tex.image && tex.image.width > 0);
    if (!tex.userData.isReady) {
      const check = setInterval(() => {
        if (tex.image && tex.image.width > 0) {
          clearInterval(check);
          tex.userData.isReady = true;
          tex.userData.onReady.forEach(fn => { try { fn(); } catch (e) {} });
          tex.userData.onReady = [];
        }
      }, 60);
      setTimeout(() => clearInterval(check), 20000); // guard
    }
    // Koreksi warna di memori (TEX_FIX) — file asli tak tersentuh.
    const fix = TEX_FIX[slug];
    if (fix) {
      tex.userData.pendingFix = fix;
      const applyWhenReady = () => {
        if (tex.image && tex.image.width > 0) {
          const fixed = applyTexFix(tex.image, tex.userData.pendingFix);
          tex.image = fixed;
          tex.needsUpdate = true;
          delete tex.userData.pendingFix;
        } else {
          setTimeout(applyWhenReady, 100);
        }
      };
      if (tex.image && tex.image.width > 0) applyWhenReady(); else setTimeout(applyWhenReady, 100);
    }
    _texCache.set(slug, tex);
  }
  return _texCache.get(slug);
}

// AURA GLOW v3 (koreksi user via Claude Vision 2026-09-11): glow dataset
// neon = POST-PROCESSING BLOOM (warna terang "bocor keluar" dari bentuk),
// BUKAN sprite blur / point light / shell. App SUDAH punya UnrealBloomPass
// (composer) — neon cukup emissive HDR agar lolos threshold bloom.
// makeBlockMaterial utk glow block memakai MeshBasicMaterial FLAT
// (anti-shading: semua sisi merah #FF0000 rata — persis spek referensi;
// MeshBasicMaterial kebal ambient/directional light, tidak kena gradasi)
// + emissiveFlags utk protection highlight gizmo (bug #1: highlightSelected
// menimpa emissive jadi biru → unhighlight set HITAM = neon "merah kusam").

/**
 * Material helper anti-hitam (tester 2026-09-11): buat MeshStandardMaterial
 * untuk block. Warna = PLACEHOLDER (warna dominan texture) SEBELUM texture
 * siap — supaya block TIDAK pernah tampil hitam — dan OTOMATIS reset ke
 * putih saat texture termuat (tint permanen terbukti merusak warna).
 */
export function makeBlockMaterial(THREE, slug) {
  // ══ bab 214: FLAG — material ARRAY 2 group (kain/keras) ══
  // WAJIB sebelum load tex generik: slug 'flag' TIDAK punya tex tunggal —
  // keduanya (fabric+pole) diload di dalam makeFlagMaterials.
  if (slug === 'flag') {
    return makeFlagMaterials(THREE);
  }
  const def = getBlockDef(slug);
  const tex = getBlockTexture(THREE, slug);
  // GLOW block (neon) — v4 FINAL (hybrid, 2026-09-11, keputusan berbasis
  // 8 ronde bukti empiris): MeshStandardMaterial color HITAM + emissive
  // 0xFF0000 intensity 1.4 — emissive = self-illumination → FLAT rata di
  // semua sisi (nol shading, spek Claude Vision terpenuhi). Aura luar
  // disediakan SPRITE RADIAL-GRADIENT (attachBlockGlow — v2 yang sudah
  // lolos verifikasi vision 5/5 + profil pixel mulus identik dataset).
  // Bloom post-processing DIUJI 7 ronde: sumber block besar (130px) membuat
  // bloom overexposed menutupi block sendiri — bloom TIDAK cocok utk
  // aura block besar; sprite = terukur sempurna. (Catatan jebakan yang
  // diwariskan: threshold bloom pakai LUMINANCE (r255 = 0.21 saja);
  // MeshBasic tidak punya emissive — set = exception render mati.)
  // ══ bab 205: TORCH — DoubleSide WAJIB ══
  // `_stBuild` selalu memanggil `_stFaceOutward` (flag noFix TIDAK dibaca —
  // lihat catatan di blockShapes). Untuk geometri berongga (cangkir) itu bisa
  // membalik sisi-dalam. DoubleSide = jaring pengaman supaya TIDAK ADA wajah
  // yang hilang dari sudut pandang mana pun.
  if (slug === 'torch') {
    const matT = new THREE.MeshStandardMaterial({
      map: tex,
      color: tex.userData.isReady ? 0xffffff : (BLOCK_PLACEHOLDER[slug] || 0xffffff),
      roughness: def.roughness,
      metalness: def.metalness,
      side: THREE.DoubleSide,
    });
    return matT;
  }
  // ══ bab 206: LAMP — material ARRAY (3 group) ══
  // Lamp = satu-satunya NSI yang butuh 3 perilaku material sekaligus:
  //   [0] logam  → OPAQUE, DoubleSide (pola Torch)
  //   [1] kaca   → TRANSPARAN, depthWrite:false (pelajaran bug 2026-10-01)
  //   [2] inti   → MeshBasicMaterial = UNLIT, selalu menyala (sumber cahaya)
  // Geometri sudah di-addGroup() dengan urutan yang sama (makeLampGeometry).
  // ⚠️ JANGAN gabung jadi 1 material: transparent:true membuat logam tembus
  //    pandang, transparent:false membuat kaca menutupi inti → lampu mati.
  if (slug === 'lamp') {
    return makeLampMaterials(THREE, tex, def);
  }
  // bab 208: Candle — 2 material (badan lit + api unlit). JANGAN digabung:
  // api unlit akan ikut kena lighting dan tampak mati.
  if (slug === 'candle') {
    return makeCandleMaterials(THREE, tex, def);
  }
  // ══ bab 218: STAR — SATU-SATUNYA NSI bertekstur NEON (kuning) ══
  // WAJIB cabang sendiri SEBELUM `if (def.glow)`: cabang glow generic meng-
  // hardcode `emissive: 0xff0000` (MERAH — spesifik Neon block, wajib user
  // 2026-09-11). Kalau Star lewat jalur itu, bintangnya JADI MERAH.
  //
  // KOREKSI bab 219 ronde 1 (kritik Claude atas render 4 sudut):
  //   - RIM PANAS: ExtrudeGeometry punya 2 grup material (0 = tutup depan+
  //     belakang, 1 = dinding samping+bevel) → dinding+bevel pakai emissive
  //     PUCAT (0xffffa0) supaya TEPI menjadi sumber cahaya (referensi punya
  //     rim putih-kuning di sepanjang outline). Bevel dinaikkan 0.02→0.03
  //     (di makeStarGeometry) supaya cincin rim ~2% lebar bintang.
  //   - emissiveIntensity 1.4→1.0: dengan toneMapped:false, kuning sudah
  //     jenuh di 1.0 — 1.4 hanya clipping tanpa efek (nilai jujur).
  //   - Bercak spekuler dibuang: MeshPhysicalMaterial specularIntensity 0.
  // Texture TIDAK diperlukan (neon polos) — `star.png` tidak ada, jadi
  // jalur generik akan 404.
  if (slug === 'star') {
    return makeStarMaterials(THREE);
  }
  // bab 225: BREAD — material ARRAY 2 (muka irisan / dinding crust).
  // WAJIB cabang sendiri sebelum jalur generik: bread punya DUA tekstur
  // berbeda (bread_face.png + bread.png) — jalur generik hanya muat satu.
  if (slug === 'bread') {
    return makeBreadMaterials(THREE);
  }
  // bab 227: CAKE — vertex color murni (tanpa tekstur).
  // Cabang sendiri supaya TIDAK memuat /blocks/tex/cake.png (tidak ada).
  if (slug === 'cake') {
    return makeCakeMaterials(THREE);
  }
  // bab 230: PUMPKIN — vertex color murni (unlit, sama pola Cake).
  if (slug === 'pumpkin') {
    return makeCakeMaterials(THREE);   // material identik: unlit + vertexColors
  }
  if (def.glow) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x000000,          // hitam: hanya emissive yang menyala → flat
      emissive: 0xff0000,       // merah murni #FF0000 (wajib user)
      emissiveIntensity: 1.4,   // flat terang; di bawah threshold bloom default —
                                // tidak memicu bloom liar
      roughness: 1, metalness: 0,
      fog: false,
      // FIX BUG 3 (laporan-bug-neon-block, 2026-09-11): ACES mendesaturasi
      // merah saturasi tinggi — badan kubus pudar padahal aura sprite sudah
      // toneMapped:false. Samakan: badan JUGA toneMapped:false → #FF0000 solid.
      toneMapped: false,
    });
    mat.userData.isGlowBlock = true; // flag: highlight gizmo DILARANG timpa
    return mat;
  }
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    color: tex.userData.isReady ? 0xffffff : (BLOCK_PLACEHOLDER[slug] || 0xffffff),
    roughness: def.roughness,
    metalness: def.metalness,
    ...(def.transparent ? { transparent: true, opacity: def.opacity } : {}),
    // FIX BUG 4 (2026-10-01, laporan user: "transparansi glass berubah
    // tergantung sudut pandang"): material transparan TANPA depthWrite:false
    // menulis ke depth buffer → wajah yang sudah dirender menutupi wajah lain
    // secara tidak konsisten antar sudut. depthWrite:false → semua wajah
    // ter-blend merata dari sudut mana pun (kaca konsisten).
    ...(def.transparent ? { depthWrite: false } : {}),
    ...(def.emissive ? { emissive: def.emissive, emissiveIntensity: def.emissiveIntensity } : {}),
  });
  // ── WINDOW (2026-10-09, laporan user "kayunya transparan") ──
  // NSI Window memakai ALPHA PER-VERTEX (itemSize 4): bingkai kayu alpha 1,
  // kaca alpha 0.42. Material WAJIB transparent:true supaya alpha dihormati,
  // TAPI `depthWrite:false` (bawaan block transparan) membuat BINGKAI KAYU
  // tidak menulis kedalaman → sisi belakang kayu menembus sisi depan →
  // "kayu terlihat transparan". FIX: depthWrite WAJIB true untuk Window.
  // (Kaca tetap tembus karena alpha per-vertex + blending tetap aktif.)
  // DOOR: alasan sama persis (kayu wajib solid, kaca tetap tembus).
  // ⚠️ CHEST & SMALL TREASURE DIKELUARKAN dari daftar ini (bab 149, 2026-10-11).
  // AKAR BUG "bolong-bolong" (keluhan user): chest TIDAK punya alpha sama sekali
  // (alpha per-vertex semuanya 1.0, terverifikasi). Dengan transparent:true +
  // depthWrite:true, urutan render antar-wajah TIDAK terjamin → z-fighting →
  // dinding tampak berlubang/bercelah. FIX: chest = OPAQUE (transparent:false).
  // Window/Door/Hatch TETAP perlu depthWrite:true karena mereka PUNYA alpha
  // nyata (kaca alpha 0.42) dan butuh kayu solid.
  if (def.slug === 'window' || def.slug === 'door' || def.slug === 'hatch') mat.depthWrite = true;
  // ── SMALL TREASURE: WAJIB DoubleSide (bab 157, 2026-10-11) ──
  // AKAR "bug tekstur hilang masih ada buanyak" (keluhan user):
  // geometri Small Treasure dirakit dari BANYAK part (drum cangkang, ring,
  // pita, pipi, gundukan) — sebagian wajahnya menghadap KE DALAM.
  // Jalur app memakai FrontSide (side:0) → wajah menghadap dalam TIDAK
  // dirender → terlihat BOLONG/"tekstur hilang". UJI LANGSUNG DI APP:
  // FrontSide = rongga bolong; DoubleSide = TERTUTUP rapat (terbukti).
  // Halaman uji/sandbox yang sudah disetujui user memakai DoubleSide —
  // jadi ini MENYAMAKAN app dengan sandbox (aturan: wajib sama).
  if (def.slug === 'small_treasure') { mat.side = THREE.DoubleSide; }
  // bab 169: Medium Treasure dirakit dari banyak part (sama seperti Small) → DoubleSide.
  if (def.slug === 'medium_treasure') { mat.side = THREE.DoubleSide; }
  // bab 178: Big Treasure juga dirakit dari banyak part → DoubleSide.
  if (def.slug === 'big_treasure') { mat.side = THREE.DoubleSide; }
  // bab 180: Pine Tree juga dirakit dari banyak part (per-tier) → DoubleSide.
  if (def.slug === 'pine_tree') { mat.side = THREE.DoubleSide; }
  // bab 197: Trophy dirakit dari banyak part (cangkir berongga, gagang, alas)
  // → DoubleSide, supaya sisi dalam cangkir PASTI terlihat dari sudut mana pun.
  if (def.slug === 'trophy_1st' || def.slug === 'trophy_2nd' || def.slug === 'trophy_3rd') {
    mat.side = THREE.DoubleSide;
  }
  // ── DOOR — kaca buram halus (kritik Claude #13: "kaca belum bertekstur") ──
  // Referensi kaca: std luminance 12–15% (BUKAN rata). Geometri Door sudah
  // memberi UV posisi pada komponen kaca; di sini kita haluskan kilau kaca
  // (roughness lebih tinggi + metalness nol) supaya tekstur buram terlihat.
  if (def.slug === 'door') { mat.roughness = 0.62; mat.metalness = 0.05; }
  if (!tex.userData.isReady && tex.userData.onReady) {
    tex.userData.onReady.push(() => { mat.color.set(0xffffff); mat.needsUpdate = true; });
  }
  if (def.slug === 'gold_block') {
    // Phase 70 (user 2026-09-13): gold HARUS kuning BERKILAU (logam nyata),
    // bukan block kusam. envMap RoomEnvironment = refleksi nyata → metalness
    // 0.85 menghasilkan kilau logam TANPA gelap (kontrak Phase 63: tanpa
    // envMap metal tinggi = gelap 3x — envMap menyelesaikan).
    applyGoldSparkle(mat);
    const env = getGoldEnvMap(THREE);
    if (env) { mat.envMap = env; mat.needsUpdate = true; }
  }
  // ══ bab 202 — KILAU PIALA (permintaan user: "ada kilauan piala mengkilap
  //    khas seperti piala yang ada di dunia nyata").
  //    Trophy 1st & 2nd sekarang bertekstur gold → WAJIB dapat perlakuan
  //    kilau yang SAMA dengan gold_block (envMap kontras + metalness 0.7 +
  //    roughness 0.18). Tanpa ini tekstur gold hanya jadi "plastik doff".
  //    ⚠️ 3rd SENGAJA TIDAK IKUT (user: "3rd jangan diubah") → tetap
  //    memakai roughness/metalness dari BLOCK_LIBRARY apa adanya.
  //    ⚠️ side DoubleSide TETAP (di-set di bawah) supaya rongga cangkir
  //    tidak bolong — jangan dihapus.
  if (def.slug === 'trophy_1st' || def.slug === 'trophy_2nd') {
    applyGoldSparkle(mat);
    const env = getGoldEnvMap(THREE);
    if (env) { mat.envMap = env; mat.needsUpdate = true; }
  }
  return mat;
}

// ─── SPRITE AURA GLOW (v4 hybrid — dipakai utk aura luar block glow) ───
// (Kembali dari v2: sprite radial TERBUKTI 5/5 vision + profil pixel mulus
// identik dataset. Bloom diuji 7 ronde → overexposed utk block besar.)
let _auraSpriteMatCache = null;
let _auraSpriteTexCache = null;

// ─── GOLD ENVMAP (Phase 70, user 2026-09-13: "gold harus kuning BERKILAU,
// bukan block biasa") — kilau logam NYATA butuh refleksi lingkungan;
// tanpa envMap metalness tinggi = gelap 3x (kontrak Phase 63).
// envMap CUSTOM KONTRAS (bukan RoomEnvironment — langit-langitnya putih
// seragam → refleksi flat "washed out", vision 2/10; terukur iterasi-3):
// ruang gelap + 3 PANEL TERANG hangat pada sudut berbeda = HOTSPOT
// refleksi tajam terlihat DI DALAM wajah (kilau khas logam game).
// Di-PMREM sekali & cache; dipasang HANYA pada material gold.
let _goldEnvMapCache = null;
function getGoldEnvMap(THREE) {
  if (_goldEnvMapCache) return _goldEnvMapCache;
  try {
    const envScene = new RoomEnvironment(); // basis kosong
    // kosongkan isi default RoomEnvironment, ganti panel custom
    while (envScene.children.length) envScene.remove(envScene.children[0]);
    envScene.background = new THREE.Color(0x0a0a12); // ruang gelap
    const mkPanel = (color, intensity, w, h, pos, lookAt) => {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(intensity),
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.position.copy(pos);
      m.lookAt(lookAt || new THREE.Vector3(0, 0, 0));
      envScene.add(m);
      return m;
    };
    // 3 sumber terang hangat (softbox studio) — dasar kilau emas.
    // Kalibrasi terukur iterasi-4: panel kecil (4x3) di ruang gelap
    // dominan → gold GELAP (avg render 128 vs 232 RoomEnv). Solid angle
    // panel harus dominan: panel BESAR + intensity tinggi.
    mkPanel(0xfff2cc, 24.0, 12, 8, new THREE.Vector3(-9, 10, 7));   // softbox utama
    mkPanel(0xffe6b3, 16.0, 8, 10, new THREE.Vector3(10, 5, -9));   // rim kanan
    mkPanel(0xffffff, 10.0, 16, 4, new THREE.Vector3(0, 14, 0));    // strip atas
    const pmrem = new THREE.PMREMGenerator(THREE_LAST_RENDERER());
    pmrem.compileEquirectangularShader();
    _goldEnvMapCache = pmrem.fromScene(envScene, 0.05).texture;
    pmrem.dispose();
    envScene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  } catch (e) {
    return null; // fallback aman: gold tanpa envMap (perilaku lama)
  }
  return _goldEnvMapCache;
}

// Renderer aktif dipasang via setGoldEnvRenderer() dari init scene app
// (blockMaterials tidak punya akses renderer saat module-load).
let _rendererRef = null;
function THREE_LAST_RENDERER() { return _rendererRef; }
export function setGoldEnvRenderer(renderer) { _rendererRef = renderer; }

function applyGoldSparkle(mat) {
  if (!mat) return;
  // Kalibrasi iterasi-3 (vision): metalness 0.95 = refleksi murni →
  // TEXTURE GOLD MATI ("plastik kuning solid" — vision) padahal user bilang
  // "teksturnya sudah benar" = WAJIB tetap terlihat. 0.7 = diffuse map
  // masih berkontribusi (~30%) + refleksi envMap dominan = kilau logam.
  mat.metalness = 0.7;
  mat.roughness = 0.18;   // licin → highlight tajam
  mat.envMapIntensity = 1.5;
  // EMISSIVE = 0 (terukur): baseline emissive menaikkan area gelap →
  // kontras kilau rendah (1.18→1.35). Tanpa emissive = kontras penuh.
  mat.emissiveIntensity = 0;
}

function getAuraSpriteTexture(THREE) {
  if (!_auraSpriteTexCache) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0.0, 'rgba(255,0,0,0.85)');
    grad.addColorStop(0.35, 'rgba(255,0,0,0.45)');
    grad.addColorStop(0.65, 'rgba(255,0,0,0.15)');
    grad.addColorStop(1.0, 'rgba(255,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    _auraSpriteTexCache = new THREE.CanvasTexture(canvas);
    _auraSpriteTexCache.colorSpace = THREE.SRGBColorSpace;
  }
  return _auraSpriteTexCache;
}

function getAuraSpriteMaterial(THREE) {
  if (!_auraSpriteMatCache) {
    _auraSpriteMatCache = new THREE.SpriteMaterial({
      map: getAuraSpriteTexture(THREE),
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    });
  }
  return _auraSpriteMatCache;
}

/**
 * Pasang AURA SPRITE pada block glow (neon). Radial gradient merah murni,
 * billboard selalu menghadap kamera, scale 2.6 menyelimuti block.
 * Idempoten via userData.__glow.
 */
export function attachBlockGlow(THREE, block) {
  if (!block || !block.isMesh) return null;
  if (block.userData.__glow) return block.userData.__glow;
  // ══ bab 218: STAR — AURA CANGKANG GEOMETRIS (inverted hull) ══
  // KOREKSI bab 219 ronde 2 (Claude, skor miring 5/10): aura sprite (billboard)
  // menghasilkan "bintang hantu berongga" di sudut miring — sprite selalu
  // menghadap kamera sementara bintang 3D menyempit (foreshortening) → cincin
  // tak lagi berimpit dengan siluet. SOLUSI: 5 lapis EXTRUDE outline bintang
  // yang MENGEMBANG (bevelOffset 0 → outline membesar ke luar + Z menambah di
  // kedua sisi), dirender BackSide + additive + depthWrite:false → halo
  // mengikuti siluet 3D dari sudut MANA PUN. Kabut radial DIBUANG (tidak ada
  // di referensi).
  if (block.geometry && block.geometry.userData && block.geometry.userData.nsiStar) {
    // bab 219 ronde 4: CANGKANG GLOW 14 LAPIS tergabung 1 mesh (bukan sprite,
    // bukan 5 lapis terpisah) + STENCIL MASK.
    const glowMesh = makeStarGlowMesh(THREE, getStarPoints());
    block.add(glowMesh);
    block.userData.__glow = glowMesh;
    return glowMesh;
  }
  const sprite = new THREE.Sprite(getAuraSpriteMaterial(THREE));
  // CATATAN (2026-10-01): percobaan depthTest=false MALAH bikin aura menimpa
  // badan block (vision: "dua block bertumpuk"). DIBATALKAN — aura tetap
  // depthTest true (default) → aura ter-occlude block, hanya memancar di luar
  // siluet. depthWrite false sudah cukup (dari getAuraSpriteMaterial).
  // FIX (2026-10-01, laporan user: "neon saat pertama ditempatkan ukuran glow-nya
  // BEDA dgn yang sudah diubah"): default aura disamakan dgn nilai yang dipakai
  // saat DICAT (2.04) supaya neon baru & neon dicat tampil KONSISTEN.
  // (Riwayat: 2.6 → 3.4 → 1.7 → 2.04.)
  sprite.scale.setScalar(2.04);
  sprite.raycast = () => {};
  sprite.renderOrder = 3;
  block.add(sprite);
  block.userData.__glow = sprite;
  return sprite;
}

/** Lepas aura (dispose aman, idempoten). */
export function detachBlockGlow(block) {
  if (!block || !block.userData || !block.userData.__glow) return;
  const g = block.userData.__glow;
  // bab 218: Star memakai ARRAY sprite (cincin siluet + radial samar)
  const items = Array.isArray(g) ? g : (g.shells ? g.shells : [g]);
  items.forEach(it => { try { if (it.parent) it.parent.remove(it); } catch (e) {} });
  delete block.userData.__glow;
  delete block.userData.__glowArr;
}

// ── catatan bab 218: tekstur AURA SILUET BINTANG (starAuraTexture) DIHAPUS —
//    bab 219 ronde 2 membuktikan sprite billboard menghasilkan "bintang hantu"
//    berongga di sudut miring. Penggantinya = CANGKANG GLOW GEOMETRIS
//    (inverted hull) di attachBlockGlow, memakai getStarShape() dari
//    blockShapes.js sebagai SUMBER TUNGGAL outline (kontrak bab 118).
