/**
 * ballCenterDesign.js — Phase 69 (user 2026-09-11): desain visual TENGAH bola
 * gizmo (scale + rotate), meniru STRUKTUR referensi "design_visual_tengah_.png"
 * (bukan warnanya — warna earthy/terracotta DILARANG ditiru).
 *
 * STRUKTUR REFERENSI (verifikasi 2 vision: Gemini + Claude, konsisten):
 *   - Belah ketupat/diamond MIRING di pusat bola, sudut ke 4 arah diagonal.
 *   - Gradasi glow: inti diamond paling TERANG → menyatu halus ke warna bola
 *     (tanpa garis tegas — murni gradasi, kesan bloom/permata 4 faset).
 *   - Titik kecil GELAP tepat di pusat (anchor point).
 *   - Proporsi: diamond ~1/4–1/3 diameter bola.
 *
 * TEKNIK: SATU canvas texture SHARED (polos — tanpa warna bola) dipakai
 * sebagai `map` material bola. Texture digambar di space PUTIH + alpha:
 *   - area luar = putih solid (opaque) → setelah dikali material.color,
 *     bola tampak WARNA ASLI material (kuning scale #EFBF04, merah/hijau/
 *     biru rotate) — identitas warna TIDAK berubah.
 *   - diamond glow = putih DENGAN boost terang (glow) — karena map max 1.0
 *     dikali color, untuk efek glow dipakai emissiveMap trick tidak perlu:
 *     diamond digambar PUTIH MURNI (255) + lingkungan bola digambar ABU
 *     GELAP SEDANG (menggelapkan warna dasar sedikit) → diamond tampak
 *     LEBIH TERANG dari sekeliling = efek glow tanpa mengubah warna.
 *   - titik pusat = gelap solid (dikali color → tetap gelap).
 * UV mapping: SphereGeometry UV — pusat bola menghadap kamera adalah titik
 * UV bergantung rotasi; texture dipetakan KE SELURUH bola sehingga diamond
 * muncul di SEMUA sisi? TIDAK — referensi hanya di SATU sisi (depan).
 * Solusi: diamond digambar di seluruh equator texture? SphereGeometry UV:
 * u = longitude (0..1 keliling), v = latitude. Diamond di pusat tekstur
 * (u=0.5, v=0.5) akan muncul di satu titik bola. Karena bola kecil &
 * permukaan membulat, satu diamond UV terlihat sebagai kumpulan aneh.
 *
 * DESAIN PRAKTIS yang memenuhi referensi: diamond digambar BERULANG di
 * grid halus (setiap ~1/3 keliling horizontal & vertikal) — dari jauh,
 * tiap sisi bola yang menghadap user SELALU menampilkan 1 diamond glow
 * paling dominan (efek "core di tengah bola" dari semua sudut —
 * konsisten referensi low-poly yang facet-nya memantulkan cahaya).
 *
 * Diterapkan pada:
 *   - gizmoScaleBalls.js  → material bola scale (material sendiri, aman).
 *   - gizmoRotateRings.js → bola rotate: material BARU per sumbu yang
 *     meniru warna materialLib[axis] + map texture ini (JANGAN mengubah
 *     materialLib — highlight & setColors bergantung padanya; material
 *     baru meniru warna via .copy setiap attach — pola yang sudah
 *     terbukti di Phase 51 utk kebal setColors).
 */

import * as THREE from 'three';

let _centerTexCache = null;

/**
 * Buat/ambil SHARED canvas texture desain tengah bola (polos — putih
 * dasar + diamond glow grid + titik gelap). Ukuran 256 cukup halus.
 */
export function getBallCenterTexture() {
  if (_centerTexCache) return _centerTexCache;

  const SIZE = 256;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  // ── 1. Dasar: putih solid (bola = warna material) ──
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── 2. Slight vignette: tepi bola sedikit lebih gelap dari pusat
  // (memberi kedalaman spherical — pusat bola tempat diamond berada
  // jadi area paling terang secara natural).
  const vg = ctx.createRadialGradient(SIZE/2, SIZE/2, SIZE*0.15, SIZE/2, SIZE/2, SIZE*0.62);
  vg.addColorStop(0, 'rgba(255,255,255,1)');    // pusat: full terang
  vg.addColorStop(1, 'rgba(190,190,190,1)');   // tepi: 75% abu → menggelapkan
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── 3. Diamond glow grid (referensi: belah ketupat miring di pusat) ──
  // Grid 3x3: diamond di tiap sel → tiap sisi bola punya 1 diamond dominan.
  // Diamond = radial gradient putih TERANG (intinya > 1 tidak bisa di canvas;
  // trik: inti putih murni + halo abu-terang) dengan bentuk belah ketupat
  // (gradient di-clip ke path diamond miring ~20° sesuai referensi "sudut
  // ke kiri-atas & kanan-bawah").
  const cells = 3;
  const cw = SIZE / cells;
  for (let gx = 0; gx < cells; gx++) {
    for (let gy = 0; gy < cells; gy++) {
      const cx = cw * gx + cw / 2;
      const cy = cw * gy + cw / 2;
      drawDiamondGlow(ctx, cx, cy, cw);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  _centerTexCache = tex;
  return tex;
}

/**
 * Gambar SATU diamond glow di (cx, cy) — meniru struktur referensi:
 * belah ketupat miring (sudut diagonal), gradasi lembut inti→tepi,
 * tanpa garis tegas, + titik gelap kecil di pusat (anchor point).
 * Skala: diamond ~55% lebar sel (~1/5 diameter bola — dalam rentang
 * referensi 1/4–1/3 dilihat dari jarak).
 */
function drawDiamondGlow(ctx, cx, cy, cellSize) {
  const rx = cellSize * 0.30;      // setengah-lebar diamond
  const ry = cellSize * 0.24;      // setengah-tinggi (miring/lonjong)
  const tilt = -Math.PI / 8;      // miring ~22.5° (referensi: diagonal condong)

  ctx.save();
  // clip ke path diamond miring
  ctx.beginPath();
  const pts = 4;
  for (let i = 0; i < pts; i++) {
    const ang = (Math.PI * 2 * i) / pts + tilt;
    const x = cx + Math.cos(ang) * rx;
    const y = cy + Math.sin(ang) * ry;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.clip();

  // gradient radial inti → tepi (soft, no hard edge)
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry) * 1.15);
  g.addColorStop(0, 'rgba(255,255,255,1)');        // inti putih murni (glow core)
  g.addColorStop(0.45, 'rgba(255,255,255,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');        // menyatu halus ke dasar
  ctx.fillStyle = g;
  ctx.fillRect(cx - rx * 1.4, cy - ry * 1.4, rx * 2.8, ry * 2.8);

  ctx.restore();

  // ── titik gelap kecil tepat di pusat (anchor point referensi) ──
  const dotR = Math.max(1.5, cellSize * 0.035);
  const dg = ctx.createRadialGradient(cx, cy, 0, cx, cy, dotR * 2.2);
  dg.addColorStop(0, 'rgba(30,30,30,0.95)');   // gelap solid
  dg.addColorStop(0.6, 'rgba(30,30,30,0.55)');
  dg.addColorStop(1, 'rgba(30,30,30,0)');
  ctx.fillStyle = dg;
  ctx.beginPath();
  ctx.arc(cx, cy, dotR * 2.2, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Terapkan desain tengah ke material bola scale (gizmoScaleBalls).
 * Material bola scale MILIK modul (bukan share materialLib) — aman
 * langsung diberi map. Warna .color TIDAK diubah (kuning #EFBF04 tetap).
 * @param {THREE.MeshStandardMaterial|THREE.MeshBasicMaterial} material
 */
export function applyCenterDesignToMaterial(material) {
  if (!material) return;
  try {
    material.map = getBallCenterTexture();
    material.needsUpdate = true;
  } catch (e) { /* jangan gagalkan init gizmo */ }
}
