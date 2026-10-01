/**
 * blockTint.js — TEKSTUR BLOCK BERWARNA (fitur Paint) — Phase 88, 2026-10-01.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * MASALAH YANG DIPECAHKAN
 * ════════════════════════════════════════════════════════════════════════════
 * Dulu (BlockSimulator3D.jsx baris ~14121) paint menghapus tekstur:
 *     if (m.map) { m.map = null; m.needsUpdate = true; }   // ← tekstur LENYAP
 * → block kayu yang dicat merah jadi "permukaan mulus warna merah" (serat
 *   kayu hilang). Sama untuk SEMUA 21 block bertekstur.
 *
 * AKAR: tidak ada data "tekstur block versi berwarna", jadi sistem membuang
 * tekstur dan hanya menyisakan material.color.
 *
 * SOLUSI (dataset user): user menyediakan 5 varian warna per block
 * (red/green/blue/black/white) di "folder image/area kerja". Dipakai sebagai:
 *   1. 5 varian PRE-BAKED  → {slug}__{red|green|blue|black|white}.png
 *   2. 1 tekstur NEUTRAL   → {slug}__neutral.png  (grayscale, direkonstruksi
 *      dari R(red)+G(green)+B(blue) → rata-rata = grayscale murni)
 *
 * Tekstur NEUTRAL di-TINT (grayscale × warna user) di memori → warna APA PUN
 * dari ColorWheelPicker (HSV), tekstur tetap utuh. Terbukti (uji PIL + vision
 * 6.5/10): "kontur susunan bata, alur serat kayu, goresan logam, kepadatan
 * rumput terpetakan dengan baik" — dan LEBIH BAIK daripada varian pre-baked
 * (yang kehilangan detail di metal/gold).
 *
 * ⚠️ JEBAKAN YANG DIHINDARI (jangan diulang):
 * - 105 file dataset 750px = 38,7 MB → TIDAK boleh langsung masuk repo
 *   (bloat + RAM laptop user 7,68 GB). Disiapkan ulang ke 384px PNG-8 = 3,0 MB.
 * - "Campur 3 warna RGB" TIDAK berlaku untuk tekstur (blend 2 tekstur =
 *   ghosting/dobel). Yang benar = TINT (grayscale × warna).
 * - Alat ukur "latar abu" (beda sudut-vs-tengah) SALAH pada dataset ini —
 *   gradasi pencahayaan baked terbaca sebagai "latar". Vision membuktikan
 *   tidak ada latar. (Auto-tegur #4: curigai alat ukur.)
 *
 * ⚠️ PBR per-block DIPERTAHANKAN: tint hanya mengubah `map` + `color`.
 *   roughness/metalness/envMap/emissive block asli TIDAK disentuh → glass
 *   tetap transparan, gold tetap kilau, neon tetap ber-aura (neon di-skip
 *   oleh pemanggil, identitas glow > paint manual — warisan Phase 66).
 *
 * ⚠️ TEXTURE DI-SHARE (cache per slug+warna) — hemat memori. Tiling tetap
 *   per-block lewat MUTASI UV GEOMETRY (warisan #23), bukan texture.repeat,
 *   jadi sharing aman.
 */

// 5 varian warna pre-baked (dataset user) — SATU SUMBER KEBENARAN.
export const TINT_VARIANTS = ['red', 'green', 'blue', 'black', 'white'];

// Warna "sumber" 5 varian (catatan user):
//   red #FF0000 · green #00FF00 · blue #0000FF · black #000000 · white #FFFFFF
export const VARIANT_SOURCE_HEX = {
  red: '#ff0000', green: '#00ff00', blue: '#0000ff',
  black: '#000000', white: '#ffffff',
};

let _loader = null;
const _cache = new Map(); // key → THREE.Texture

/** URL aset tint di public/ (Vite serve otomatis). */
export function tintVariantPath(slug, variant) {
  return `/blocks/tint/${slug}__${variant}.png`;
}
export function neutralTintPath(slug) {
  return `/blocks/tint/${slug}__neutral.png`;
}

/** '#rrggbb' → { r, g, b } ternormalisasi 0..1 (aman utk input invalid). */
export function hexToRgb01(hex) {
  const h = String(hex || '').replace('#', '').trim();
  const s = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(s, 16);
  if (!/^[0-9a-fA-F]{6}$/.test(s) || Number.isNaN(n)) return { r: 1, g: 1, b: 1 };
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

/**
 * FUNGSI MURNI (Node-testable, TANPA canvas): kalikan tiap pixel RGBA dengan
 * warna target. Tekstur sumber WAJIB grayscale (r=g=b) supaya hasil = warna
 * target dengan struktur/tekstur utuh. Alpha DIBIARKAN (siluet aman).
 * @param {Uint8ClampedArray} d  data RGBA (dimutasi in-place)
 * @param {{r:number,g:number,b:number}} rgb 0..1
 */
export function recolorGrayPixels(d, rgb) {
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.round(d[i] * rgb.r);
    d[i + 1] = Math.round(d[i + 1] * rgb.g);
    d[i + 2] = Math.round(d[i + 2] * rgb.b);
    // d[i+3] (alpha) sengaja tidak disentuh
  }
  return d;
}

/** Load texture dari path (cache; wrap repeat + sRGB + mipmap — sama pola blockMaterials). */
function loadTex(THREE, path, key) {
  if (_cache.has(key)) return _cache.get(key);
  if (!_loader) _loader = new THREE.TextureLoader();
  const tex = _loader.load(path);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.userData.onReady = [];
  tex.userData.isReady = !!(tex.image && tex.image.width > 0);
  if (!tex.userData.isReady) {
    const check = setInterval(() => {
      if (tex.image && tex.image.width > 0) {
        clearInterval(check);
        tex.userData.isReady = true;
        tex.userData.onReady.forEach((fn) => { try { fn(); } catch (e) {} });
        tex.userData.onReady = [];
      }
    }, 60);
    setTimeout(() => clearInterval(check), 20000); // guard
  }
  _cache.set(key, tex);
  return tex;
}

/** Tekstur NEUTRAL (grayscale) per slug. */
export function getNeutralTexture(THREE, slug) {
  return loadTex(THREE, neutralTintPath(slug), `${slug}__neutral`);
}

/** Tekstur varian PRE-BAKED (red/green/blue/black/white) per slug. */
export function getTintVariantTexture(THREE, slug, variant) {
  if (!TINT_VARIANTS.includes(variant)) return null;
  return loadTex(THREE, tintVariantPath(slug, variant), `${slug}__${variant}`);
}

/** Buat CanvasTexture hasil tint dari texture grayscale + warna. */
function makeTintedTexture(THREE, baseTex, hex) {
  const img = baseTex.image;
  const canvas = document.createElement('canvas');
  canvas.width = img.width; canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
  recolorGrayPixels(id.data, hexToRgb01(hex));
  ctx.putImageData(id, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * TEKSTUR BERWARNA siap pakai untuk sebuah block: grayscale netral × warna.
 * Hasil di-CACHE per (slug, hex) — texture di-share antar block sewarna
 * (hemat memori; tiling per-block via mutasi UV geometry, bukan repeat).
 * @returns {THREE.Texture|null}
 */
export function getPaintedTexture(THREE, slug, hex) {
  if (!slug || !THREE) return null;
  const key = `${slug}__tint__${String(hex || '#ffffff').toLowerCase()}`;
  if (_cache.has(key)) return _cache.get(key);

  const base = getNeutralTexture(THREE, slug);
  // Belum siap → kembalikan null; pemanggil fallback (block tetap terwarnai
  // via material.color, tekstur menyusul). Preload membuat kasus ini jarang.
  if (!base.userData.isReady || !base.image || !base.image.width) {
    // daftarkan agar cache terisi begitu siap (idempoten: sekali per key)
    if (!base.userData.onReady.some((f) => f.__tintKey === key)) {
      const fn = () => {
        if (!_cache.has(key)) {
          try { _cache.set(key, makeTintedTexture(THREE, base, hex)); } catch (e) {}
        }
      };
      fn.__tintKey = key;
      base.userData.onReady.push(fn);
    }
    return null;
  }
  let tex = null;
  try { tex = makeTintedTexture(THREE, base, hex); } catch (e) { tex = null; }
  _cache.set(key, tex);
  return tex;
}

/** Preload tekstur NEUTRAL semua block (anti-jeda saat paint pertama). */
export function preloadTintTextures(THREE, slugs) {
  (slugs || []).forEach((s) => { try { getNeutralTexture(THREE, s); } catch (e) {} });
}

/**
 * Terapkan tekstur BERWARNA ke sebuah material block (TANPA menyentuh PBR):
 *   mat.map   = tekstur grayscale × warna user  (tekstur TETAP ADA)
 *   mat.color = putih  → warna MURNI dari tekstur, hindari tint dobel
 *   mat.userData.paintColor = hex (untuk snapshot/undo-redo)
 * roughness/metalness/envMap/emissive TIDAK disentuh → glass tetap transparan,
 * gold tetap kilau, dll.
 * @returns {boolean} true kalau tekstur berwarna sudah terpasang (siap);
 *                    false = tekstur belum termuat (pemanggil fallback ke
 *                    material.color polos; tekstur menyusul saat onReady).
 */
export function applyTintToMaterial(THREE, mat, slug, hex) {
  if (!mat || !slug) return false;
  const tex = getPaintedTexture(THREE, slug, hex);
  // color = putih: warna berasal dari tekstur (bukan tint material.color).
  if (mat.color) mat.color.set(0xffffff);
  mat.userData = mat.userData || {};
  mat.userData.paintColor = hex;
  if (tex) { mat.map = tex; mat.needsUpdate = true; return true; }
  // Belum siap → pasang begitu texture neutral termuat (idempoten per material).
  const base = getNeutralTexture(THREE, slug);
  if (base.userData.onReady && !mat.userData.__tintPending) {
    mat.userData.__tintPending = true;
    base.userData.onReady.push(() => {
      try {
        const t = getPaintedTexture(THREE, slug, mat.userData.paintColor || hex);
        if (t) { mat.map = t; mat.needsUpdate = true; }
      } catch (e) {}
      mat.userData.__tintPending = false;
    });
  }
  return false;
}

/** Bersihkan cache (dispose) — dipanggil saat unmount scene. */
export function disposeTintTextures() {
  _cache.forEach((t) => { try { if (t && t.dispose) t.dispose(); } catch (e) {} });
  _cache.clear();
  _loader = null;
}
