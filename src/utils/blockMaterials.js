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
];

export const DEFAULT_BLOCK_SLUG = 'wood_block';

export function getBlockDef(slug) {
  return BLOCK_LIBRARY.find(b => b.slug === slug) || BLOCK_LIBRARY[0];
}

export function getBlockTexPath(slug) {
  return `/blocks/tex/${slug}.png`;
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
// Map slug → { hueShift (deg), sat (mult), contrast (mult) }
const TEX_FIX = {
  gold_block: { hueShift: -18, sat: 1.45, contrast: 1.25 },
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
    // fix
    let hh = (h + fix.hueShift + 360) % 360;
    const ss = Math.min(1, s * fix.sat);
    const vv = Math.min(1, 0.5 + (v - 0.5) * fix.contrast);
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
    ...(def.emissive ? { emissive: def.emissive, emissiveIntensity: def.emissiveIntensity } : {}),
  });
  if (!tex.userData.isReady && tex.userData.onReady) {
    tex.userData.onReady.push(() => { mat.color.set(0xffffff); mat.needsUpdate = true; });
  }
  return mat;
}

// ─── SPRITE AURA GLOW (v4 hybrid — dipakai utk aura luar block glow) ───
// (Kembali dari v2: sprite radial TERBUKTI 5/5 vision + profil pixel mulus
// identik dataset. Bloom diuji 7 ronde → overexposed utk block besar.)
let _auraSpriteMatCache = null;
let _auraSpriteTexCache = null;

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
  sprite.scale.setScalar(2.6);
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
