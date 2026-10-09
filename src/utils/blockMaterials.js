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
];

export const DEFAULT_BLOCK_SLUG = 'wood_block';

// ── NSI #4: ROD — tekstur 100% dari block dasarnya (permintaan user) ──
// Tidak ada file tex/wood_rod.png; path di-MAP ke tex/wood_block.png supaya
// tekstur dijamin identik (single source) dan tidak ada duplikasi file.
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

export function getBlockTexPath(slug) {
  const src = ROD_BASE_TEX[slug] || slug;
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
  door: 0xc4622a,     // pintu kayu — cokelat jingga hangat (referensi)
  hatch: 0xc4622a,    // palka kayu — sama keluarga kayu Door
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
  if (def.slug === 'window' || def.slug === 'door' || def.slug === 'hatch') mat.depthWrite = true;
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
    // bukan block kusam. envMap RoomEnvironment = refleksi nyata →
    // metalness 0.85 menghasilkan kilau logam TANPA gelap (kontrak
    // Phase 63: tanpa envMap metal tinggi = gelap 3x — envMap menyelesaikan).
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
  const items = g.shells ? g.shells : [g];
  items.forEach(it => { try { if (it.parent) it.parent.remove(it); } catch (e) {} });
  delete block.userData.__glow;
}
