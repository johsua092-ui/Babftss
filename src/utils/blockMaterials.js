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
  { slug: 'ice_block',         name: 'Ice',          roughness: 0.1,  metalness: 0.0, transparent: true,  opacity: 0.65 },
  { slug: 'neon_block',        name: 'Neon',         roughness: 0.35, metalness: 0.0, transparent: false, opacity: 1.0, emissive: 0x39ff14, emissiveIntensity: 0.85 },
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

export function getBlockTexture(THREE, slug) {
  if (!_loader) _loader = new THREE.TextureLoader();
  if (!_texCache.has(slug)) {
    const tex = _loader.load(getBlockTexPath(slug));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    // Koreksi warna di memori (TEX_FIX) — file asli tak tersentuh.
    const fix = TEX_FIX[slug];
    if (fix) {
      tex.userData.pendingFix = fix;
      // TextureLoader.load async → apply fix saat image siap
      const imgEl = tex.image;
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
      if (imgEl && imgEl.width > 0) applyWhenReady(); else setTimeout(applyWhenReady, 100);
    }
    _texCache.set(slug, tex);
  }
  return _texCache.get(slug);
}
