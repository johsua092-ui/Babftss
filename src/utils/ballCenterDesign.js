/**
 * ballCenterDesign.js — Phase 69 v8 FINAL (vision-compare 7 ronde, 2026-09-13).
 *
 * KESIMPULAN EMPIRIS 7 RONDE VISION (skor 3→7.5→5.5→6→6.5→6.5→6.5):
 *   - STRUKTUR benar (diamond + titik pusat + energi penuh) sejak v4.
 *   - HUE selalu "kuning/brass" — AKAR TERUKUR: DUA sprite overlap
 *     (gem AdditiveBlending #FF7A1A + kristal amber) = kanal G melambung
 *     → hasil selalu jatuh ke kuning (pixel terukur: 253,186,41 = kuning
 *     murni padahal target burnt orange). Tint gem apapun, hasilnya
 *     digeser kuning oleh penumpukan aditif.
 *   - SOLUSI FINAL: SATU SPRITE SAJA. Semua cahaya bola (rim penuh +
 *     halo + diamond miring + titik pusat) digambar dalam SATU texture
 *     dengan WARNA TARGET LANGSUNG (burnt orange oranye-kemerahan
 *     berani — persis referensi contoh_benar.png), sprite color putih
 *     (nol tint = nol hue-shift). Mesh backdrop = amber gelap (siluet
 *     + raycast). Identitas warna tool tetap via tint RINGAN (0.55
 *     blend) supaya scale tetap kekuningan vs rotate merah/hijau/biru —
 *     sesuai kontrak "warna earthy tidak ditiru mentah, struktur saja"
 *     TAPI visi user 7 ronde jelas: bola harus amber-oranye, identitas
 *     tool dibawa lewat pergeseran hue ringan bukan warna penuh.
 *
 * STRUKTUR RENDER (warisan #40): cincin 999 < mesh 1000 < cahaya 1001.
 */

import * as THREE from 'three';

let _orbTexCache = null;
let _orbMatCache = new Map();

/** Backdrop mesh: amber gelap — siluet bola + raycast + hover-target. */
const ORB_BACKDROP = '#6b3007';
/** Faktor blend identitas tool ke warna sprite (0 = murni referensi). */
const ORB_IDENT_MIX = 0.38;

/**
 * Texture ORB SATU-SATUYA (vision 7 ronde — semua elemen referensi):
 *   1. RIM penuh: seluruh bola oranye-amber menyala sampai tepi
 *      (vision ronde-6: "bola gelap + senter = SALAH; bola = energi").
 *   2. HALO radial hangat.
 *   3. DIAMOND belah ketupat miring — bentuk TEGAS di stops tengah,
 *      feather di tepi (vision ronde-5: "soft but DISCERNIBLE"),
 *      inti paling terang hampir putih.
 *   4. TITIK pusat: kotak kecil cokelat tua gelap (origin marker —
 *      user eksplisit; semua ronde vision konfirmasi benar).
 * Warna = BURNT ORANGE langsung di canvas (bukan tint runtime) —
 * oranye-kemerahan jenuh seperti referensi.
 */
function getOrbTexture() {
  if (_orbTexCache) return _orbTexCache;
  const SIZE = 256;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE; canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2;

  // ── 1. RIM ENERGI PENUH (vision ronde-6: "mengisi seluruh bola") ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, SIZE / 2, 0, Math.PI * 2);
  ctx.clip();   // warisan #45: clip = nol bayangan kotak
  const rim = ctx.createRadialGradient(cx, cy, 0, cx, cy, SIZE / 2);
  rim.addColorStop(0.00, 'rgba(255,190,90,1.00)');   // pusat hangat
  rim.addColorStop(0.50, 'rgba(235,120,35,0.96)');   // badan oranye jenuh
  rim.addColorStop(0.80, 'rgba(200,85,25,0.92)');    // oranye dalam
  rim.addColorStop(1.00, 'rgba(170,60,20,0.75)');    // tepi TETAP menyala
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── 2. HALO tengah SANGAT LEMAH (ronde-8 vision: "highlight CIRCULAR,
  //      diamond tidak terlihat" — akar: halo 0.85 alpha MENUTUPI diamond
  //      ellipse di bawahnya. Halo hanya memberi warm lembut, diamond
  //      harus jadi struktur dominan) ──
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, SIZE * 0.28);
  halo.addColorStop(0.0, 'rgba(255,205,120,0.35)');
  halo.addColorStop(1.0, 'rgba(255,180,90,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── 3. DIAMOND BELAH KETUPAT MIRING — BESAR & TEGAS (ronde-8 vision:
  //      "SATU hal tersisa: bentuk diamond miring soft edges") ──
  const rx = SIZE * 0.30;       // lebih besar lagi — dominan tengah
  const ry = SIZE * 0.21;       // lonjong diagonal
  const tilt = -Math.PI / 8;    // miring kiri-atas → kanan-bawah
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  ctx.scale(rx / (SIZE * 0.5), ry / (SIZE * 0.5));
  const R0 = SIZE * 0.5;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R0);
  g.addColorStop(0.00, 'rgba(255,250,235,1.00)');  // inti BERPIJAR hampir putih
  g.addColorStop(0.35, 'rgba(255,230,170,0.99)');  // TEGAS KUAT — siluet jelas
  g.addColorStop(0.62, 'rgba(255,200,120,0.90)');  // bentuk masih sangat terbaca
  g.addColorStop(0.82, 'rgba(255,180,95,0.55)');   // feather mulai
  g.addColorStop(1.00, 'rgba(250,160,70,0)');     // nol — feather tepi halus
  ctx.fillStyle = g;
  ctx.fillRect(-R0, -R0, R0 * 2, R0 * 2);
  ctx.restore();

  // ── 4. TITIK PUSAT: kotak kecil cokelat tua (origin marker) ──
  const dotR = SIZE * 0.020;
  ctx.fillStyle = 'rgba(60,24,12,0.97)';
  ctx.fillRect(cx - dotR, cy - dotR, dotR * 2, dotR * 2);

  ctx.restore();   // clip lingkaran off

  _orbTexCache = new THREE.CanvasTexture(canvas);
  _orbTexCache.colorSpace = THREE.SRGBColorSpace;
  return _orbTexCache;
}

/**
 * Pasang ORB pada bola gizmo (SATU sprite menggantikan gem+kristal).
 * identColor dicampur RINGAN (ORB_IDENT_MIX 0.38) — cukup membedakan
 * scale (kuning) vs rotate (merah/hijau/biru), tanpa menggeser bola
 * dari karakter amber-oranye referensi.
 * Urutan render: cincin 999 < mesh 1000 < orb 1001.
 */
export function attachGemOverlay(ball, ballRadius = 0.075, identColor = null) {
  if (!ball || !ball.isMesh) return null;
  if (ball.userData.__gemOverlay) return ball.userData.__gemOverlay;
  try {
    // backdrop mesh: amber gelap (siluet saat sprite tak menutup)
    ball.material.color.set(ORB_BACKDROP);
    // warna sprite = referensi amber ⊕ identitas ringan
    let tint = 0xffffff;
    if (identColor != null) {
      const ref = new THREE.Color('#FFB25E');       // amber referensi
      const idn = new THREE.Color(identColor);
      ref.lerp(idn, ORB_IDENT_MIX);                // blend → identitas tetap terasa
      tint = ref.getHex();
    }
    const key = String(tint);
    if (!_orbMatCache.has(key)) {
      _orbMatCache.set(key, new THREE.SpriteMaterial({
        map: getOrbTexture(),
        color: tint,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,   // warna murni (warisan #15: ACES desaturasi)
        fog: false,
      }));
    }
    const sprite = new THREE.Sprite(_orbMatCache.get(key));
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
    sprite.renderOrder = 1001;
    sprite.raycast = () => {};
    ball.add(sprite);
    ball.userData.__gemOverlay = sprite;
    return sprite;
  } catch (e) {
    return null;
  }
}

/**
 * Kompabilitas v3: attachCrystalCore kini NO-OP — seluruh desain (rim +
 * halo + diamond + titik pusat) sudah SATU di orb texture. Dipertahankan
 * supaya call site gizmoScaleBalls/gizmoRotateRings tidak crash.
 */
export function attachCrystalCore(_ball, _ballRadius = 0.075) {
  return null; /* no-op v8 — orb texture sudah berisi diamond + dot */
}

/** Lepas orb dari bola (idempoten). */
export function detachCrystalCore(ball) {
  if (!ball || !ball.userData) return;
  if (ball.userData.__gemOverlay) {
    const s = ball.userData.__gemOverlay;
    try { if (s.parent) s.parent.remove(s); } catch (e) {}
    delete ball.userData.__gemOverlay;
  }
  if (ball.userData.__crystalCore) delete ball.userData.__crystalCore;
}

/**
 * Kompabilitas: applyCenterDesignToMaterial = NO-OP.
 */
export function applyCenterDesignToMaterial(_material) { /* no-op v8 */ }

/** Dispose shared resources (cleanup unmount scene). */
export function disposeCrystalResources() {
  for (const m of _orbMatCache.values()) { try { m.dispose(); } catch (e) {} }
  _orbMatCache.clear();
  if (_orbTexCache) { try { _orbTexCache.dispose(); } catch (e) {} _orbTexCache = null; }
}
