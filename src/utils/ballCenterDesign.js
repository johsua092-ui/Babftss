/**
 * ballCenterDesign.js — Phase 69 v3 (koreksi user 2026-09-13, bandingkan/
 * contoh_benar.png): bola gizmo = PERMATA RADIAL-GLOW + KRISTAL KECIL.
 *
 * REFERENSI TERUKUR (contoh_benar.png — pixel-analysis presisi):
 *   - Bola 322px; profil radial luminance: pusat 220 → r25% 132 →
 *     r50% 60 → tepi 32 (GRADASI KONTINU — permata bercahaya dari
 *     DALAM, bukan flat 1 warna).
 *   - KRISTAL belah ketupat miring di pusat = HANYA 17% lebar & 16%
 *     tinggi bola (54px/322px) — v2 85% = 5x TERLALU BESAR.
 *   - TIDAK ada titik gelap pusat (0 pixel gelap <60 dalam r15%).
 *   - Warna referensi earthy/amber DILARANG ditiru (kontrak Phase 69) —
 *     STRUKTUR saja: identitas warna tetap dari tool (scale kuning
 *     #EFBF04, rotate merah/hijau/biru).
 *
 * TEKNIK v3 FINAL (pelajaran map-sphere-UV gagal — sama seperti Phase
 * 69 v1 "titik hitam 6 sisi": radial canvas di-map ke UV sphere =
 * lingkaran konsentris di EQUATOR, BUKAN radial dari pusat pandangan;
 * vision iterasi: "flat directional shading, belum mirip"):
 *   1. Bola MESH tetap (picker/raycast/highlight jalan) sebagai
 *      BACKDROP gelap: color identitas × 0.18 (referensi tepi bola =
 *      15% luminance pusat).
 *   2. GEM = SPRITE billboard radial-gradient (putih→transparan,
 *      AdditiveBlending) child bola, scale pas disk bola, renderOrder
 *      1001 — permata bercahaya dari SEMUA arah pandang (pola aura
 *      neon Phase 65 yang terbukti 5/5 vision). Color sprite = color
 *      identitas tool.
 *   3. KRISTAL = sprite diamond glow kecil 17% diameter, renderOrder
 *      1002 (di atas gem), TANPA titik gelap pusat.
 *   Urutan lengkap mode gizmo (warisan #40): cincin 999 < bola 1000
 *   < gem 1001 < kristal 1002.
 */

import * as THREE from 'three';

let _gemTexCache = null;          // radial putih→transparan (utk sprite additive)
let _gemMatCache = new Map();     // SpriteMaterial per warna identitas
let _crystalTexCache = null;
let _crystalMatCache = null;

/** Faktor backdrop gelap bola mesh (referensi: tepi = 15% lum pusat). */
const GEM_BACKDROP = 0.18;

/**
 * Texture radial POLOS putih→transparan untuk sprite gem (alpha channel,
 * AdditiveBlending). CLIP LINGKARAN + fade ke 0 di tepi (fix user
 * 2026-09-13 "ada bayangan berbentuk KOTAK samar di bola"): stop alpha
 * terakhir sebelumnya 0.13 di r=SIZE/2 → canvas radial gradient CLAMP
 * area luar-lingkaran (4 sudut quad sprite) ke 0.13 juga = quad persegi
 * samar menambah cahaya di sekitar bola. Dengan ctx.clip() lingkaran,
 * luar disk = alpha 0 tegas — nol kotak.
 */
function getGemTexture() {
  if (_gemTexCache) return _gemTexCache;
  const SIZE = 128;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE; canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
  ctx.clip();                                   // luar lingkaran = transparan TOTAL
  const g = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, SIZE / 2);
  g.addColorStop(0.00, 'rgba(255,255,255,1.00)');
  g.addColorStop(0.30, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.60, 'rgba(255,255,255,0.42)');
  g.addColorStop(0.90, 'rgba(255,255,255,0.13)'); // tepi permata (ref lum 15%)
  g.addColorStop(1.00, 'rgba(255,255,255,0)');   // fade halus ke 0 di siluet
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.restore();
  _gemTexCache = new THREE.CanvasTexture(canvas);
  _gemTexCache.colorSpace = THREE.SRGBColorSpace;
  return _gemTexCache;
}

function getGemSpriteMaterial(colorHex) {
  const key = String(colorHex);
  if (!_gemMatCache.has(key)) {
    _gemMatCache.set(key, new THREE.SpriteMaterial({
      map: getGemTexture(),
      color: colorHex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    }));
  }
  return _gemMatCache.get(key);
}

/**
 * Pasang PERMATA GLOW pada bola gizmo. identColor = warna identitas tool
 * (WAJIB parameter eksplisit — JANGAN baca dari material.color: bola
 * scale SHARE material antar pasangan ±, pemakaian kedua akan membaca
 * warna yang SUDAH digelapkan ×0.18 → gem pudar; bug terukur: hanya 3/6
 * bola menyala). Lalu:
 *   - backdrop mesh = color material × GEM_BACKDROP (gelap — tepi permata)
 *   - sprite gem additive (identColor) child bola, scale pas disk,
 *     renderOrder 1001.
 * Idempoten via userData.__gemOverlay.
 */
export function attachGemOverlay(ball, ballRadius = 0.075, identColor = null) {
  if (!ball || !ball.isMesh) return null;
  if (ball.userData.__gemOverlay) return ball.userData.__gemOverlay;
  try {
    const ident = identColor != null
      ? new THREE.Color(identColor)          // identitas eksplisit (aman utk shared material)
      : ball.material.color.clone();         // fallback: baca sekali (hanya benar utk material eksklusif)
    ball.material.color.multiplyScalar(GEM_BACKDROP);
    const sprite = new THREE.Sprite(getGemSpriteMaterial(ident.getHex()));
    // posisi = pusat bbox GEOMETRY (warisan #29: bola bake → mesh.position
    // = origin gizmo, BUKAN pusat bola)
    let cx = 0, cy = 0, cz = 0;
    ball.geometry.computeBoundingBox();
    const bb = ball.geometry.boundingBox;
    if (bb) {
      cx = (bb.max.x + bb.min.x) / 2;
      cy = (bb.max.y + bb.min.y) / 2;
      cz = (bb.max.z + bb.min.z) / 2;
    }
    sprite.position.set(cx, cy, cz);
    const dia = ballRadius * 2;
    sprite.scale.set(dia, dia, 1);   // pas disk bola
    sprite.renderOrder = 1001;      // > bola mesh 1000
    sprite.raycast = () => {};      // gem bukan target klik
    ball.add(sprite);
    ball.userData.__gemOverlay = sprite;
    return sprite;
  } catch (e) {
    return null; // aman: tanpa gem, bola tetap tampil warna asli
  }
}

/**
 * Texture KRISTAL TENGAH (deskripsi user 2026-09-13, presisi):
 *   - Belah ketupat/diamond MIRING (sudut panjang ke kiri-atas &
 *     kanan-bawah, orientasi diagonal sedikit condong), ~17% diameter.
 *   - Gradasi: inti kuning-KEPUTIHAN cerah → tepi diamond oranye
 *     kekuningan → menyatu HALUS (blur/gradient, tanpa garis tegas)
 *     dengan glow sekitar — kesan bloom/sumber cahaya.
 *   - TITIK PUSAT: kecil coklat-kemerahan gelap, hampir solid persegi
 *     kecil — kontras di area paling terang (marker/origin point).
 *     (Konfirmasi user eksplisit — vision referensi juga menyebut
 *     "small brown dot at the brightest point". v3 salah menghapusnya.)
 */
function getCrystalTexture() {
  if (_crystalTexCache) return _crystalTexCache;
  const SIZE = 128;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE; canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2;
  const rx = SIZE * 0.26;       // setengah-lebar diamond (miring kiri-atas)
  const ry = SIZE * 0.20;       // setengah-tinggi (lonjong diagonal)
  const tilt = -Math.PI / 8;    // miring ~22.5° (condong)

  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const ang = (Math.PI * 2 * i) / 4 + tilt;
    const x = cx + Math.cos(ang) * rx;
    const y = cy + Math.sin(ang) * ry;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.clip();
  // Inti kuning-keputihan → tepi diamond oranye kekuningan (tanpa garis)
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry) * 1.05);
  g.addColorStop(0.00, 'rgba(255,244,214,0.98)');  // kuning keputihan cerah
  g.addColorStop(0.35, 'rgba(255,225,160,0.92)');  // kuning hangat
  g.addColorStop(0.70, 'rgba(255,190,110,0.70)');  // oranye kekuningan
  g.addColorStop(1.00, 'rgba(255,160,70,0)');      // menyatu glow sekitar
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.restore();

  // Glow luar diamond (halo menyatu halus dengan bola) — clip lingkaran
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, SIZE * 0.5, 0, Math.PI * 2);
  ctx.clip();
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, SIZE * 0.5);
  halo.addColorStop(0.0, 'rgba(255,205,120,0.35)');
  halo.addColorStop(1.0, 'rgba(255,205,120,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.restore();

  // TITIK PUSAT: coklat-kemerahan gelap, kecil hampir persegi —
  // origin marker (kontras di area paling terang).
  // dotR 0.022 → 0.040 (perbaikan proporsional terukur: pada bola micro
  // 400px, titik 0.37px = SUB-PIXEL tak terbaca; referensi user titiknya
  // jelas terlihat. 0.040 ≈ 5px pada texture 128 → ~1.4px pada bola 17px,
  // dan proporsional saat zoom).
  const dotR = SIZE * 0.045;   // terukur: 0.022 & 0.040 = sub-pixel pada
                               // bola gizmo ukuran layar nyata (9.7px sprite
                               // → 0.78px dot = tak terbaca). 0.045 ≈ 1.4px
                               // pada bola kecil & proporsional saat zoom.
  ctx.fillStyle = 'rgba(94,42,26,0.94)';
  ctx.fillRect(cx - dotR, cy - dotR, dotR * 2, dotR * 2);

  _crystalTexCache = new THREE.CanvasTexture(canvas);
  _crystalTexCache.colorSpace = THREE.SRGBColorSpace;
  return _crystalTexCache;
}

function getCrystalMaterial() {
  if (!_crystalMatCache) {
    _crystalMatCache = new THREE.SpriteMaterial({
      map: getCrystalTexture(),
      color: 0xffffff,
      transparent: true,
      depthTest: false,      // tampak "di dalam" bola — tidak terhalang kulit
      depthWrite: false,
      toneMapped: false,
      fog: false,
    });
  }
  return _crystalMatCache;
}

/**
 * Pasang KRISTAL kecil di pusat bola gizmo — 17% diameter (terukur
 * referensi; v2 85% = 5x terlalu besar). Posisi = pusat bbox GEOMETRY.
 * renderOrder 1002 (DI ATAS gem overlay 1001 — kristal = fokus pusat).
 */
export function attachCrystalCore(ball, ballRadius = 0.075) {
  if (!ball || !ball.isMesh && !ball.isSprite) return null;
  if (ball.userData.__crystalCore) return ball.userData.__crystalCore;

  const sprite = new THREE.Sprite(getCrystalMaterial());
  let cx = 0, cy = 0, cz = 0;
  try {
    ball.geometry.computeBoundingBox();
    const bb = ball.geometry.boundingBox;
    if (bb) {
      cx = (bb.max.x + bb.min.x) / 2;
      cy = (bb.max.y + bb.min.y) / 2;
      cz = (bb.max.z + bb.min.z) / 2;
    }
  } catch (e) { /* geometry tanpa bbox → fallback origin mesh */ }
  sprite.position.set(cx, cy, cz);
  const dia = ballRadius * 2;
  // 17% diameter bola (terukur referensi: kristal 54px / bola 322px)
  sprite.scale.set(dia * 0.22, dia * 0.22, 1);  // 22% (17% referensi — naik
  // sedikit utk keterbacaan dot pusat pada bola ukuran layar kecil;
  // proporsional saat zoom, tetap "kristal kecil" bukan memenuhi bola)
  sprite.renderOrder = 1002; // > gem 1001 — pusat permata paling atas
  sprite.raycast = () => {}; // kristal tidak boleh mengganggu klik picker
  ball.add(sprite);
  ball.userData.__crystalCore = sprite;
  return sprite;
}

/** Lepas kristal dari bola (idempoten). */
export function detachCrystalCore(ball) {
  if (!ball || !ball.userData || !ball.userData.__crystalCore) return;
  const s = ball.userData.__crystalCore;
  try { if (s.parent) s.parent.remove(s); } catch (e) {}
  delete ball.userData.__crystalCore;
}

/**
 * Kompabilitas: applyCenterDesignToMaterial (Phase 69 v1 era texture
 * permukaan) = NO-OP — v3 memakai attachGemOverlay + attachCrystalCore.
 * (applyGemBallMaterial era v3-map-sphere juga dicabut — UV sphere
 * bukan radial-dari-pusat; lihat catatan header.)
 */
export function applyCenterDesignToMaterial(_material) { /* no-op v3 */ }

/** Dispose shared resources (cleanup unmount scene). */
export function disposeCrystalResources() {
  for (const m of _gemMatCache.values()) { try { m.dispose(); } catch (e) {} }
  _gemMatCache.clear();
  if (_crystalMatCache) { try { _crystalMatCache.dispose(); } catch (e) {} _crystalMatCache = null; }
  if (_crystalTexCache) { try { _crystalTexCache.dispose(); } catch (e) {} _crystalTexCache = null; }
  if (_gemTexCache) { try { _gemTexCache.dispose(); } catch (e) {} _gemTexCache = null; }
}
