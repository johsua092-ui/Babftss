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
/** Faktor blend identitas tool ke warna sprite (0 = murni referensi).
 * SCALE PAKAI 0.38 (DESIGN LOCK — jangan diubah!). Rotate butuh mix kuat
 * supaya RGB jelas (user: "bukan oranye semua") — dilewatkan sebagai
 * parameter opsional agar nilai scale tidak tersentuh. */
const ORB_IDENT_MIX = 0.38;
const ORB_IDENT_MIX_STRONG = 0.85;
// Phase 70 v6 (user 2026-09-13: "hilangin 100% warna ORANYE-nya di bola
// rotate — merah/hijau/biru harus BERSIH langsung keliatan mata; JANGAN
// sentuh design texture yang sudah perfect"): mix 1.0 = NOL amber base —
// tint = warna sumbu MURNI. Texture orb (rim/halo/diamond/titik) tetap
// 100% sama (design LOCK) — struktur terlihat via luminance alpha,
// warnanya murni RGB axis. Scale TETAP 0.38 (design LOCK — tak tersentuh).
const ORB_IDENT_PURE = 1.0;
export { ORB_IDENT_MIX_STRONG, ORB_IDENT_PURE };

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
export function attachGemOverlay(ball, ballRadius = 0.075, identColor = null, identMix = ORB_IDENT_MIX) {
  if (!ball || !ball.isMesh) return null;
  if (ball.userData.__gemOverlay) return ball.userData.__gemOverlay;
  try {
    // FIX DOBEL-BOLA (user 2026-09-13: "ada bola lain kuning di belakang,
    // lebih besar, muncul sejak awal; saat kursor dekat DIA yang jadi
    // kuning — bukan orb diamond"): mesh backdrop #6b3007 TAMPIL sebagai
    // bola kedua di belakang sprite (sphere di-scale factor kamera >
    // disk sprite). Material mesh kini TIDAK DIRENDER (visible=false —
    // raycast TETAP kena, terbukti test: picker/hover axis aman) dan
    // hover-kuning library menimpa material tak-terlihat ini = nol
    // efek visual liar. Design orb sprite DI BAWAH TIDAK DISENTUH.
    ball.material.color.set(ORB_BACKDROP);
    ball.material.visible = false;   // tidak dirender; tetap ke-raycast
    // warna sprite = referensi amber ⊕ identitas ringan
    let tint = 0xffffff;
    if (identColor != null) {
      const ref = new THREE.Color('#FFB25E');       // amber referensi
      const idn = new THREE.Color(identColor);
      ref.lerp(idn, identMix);                 // blend → identitas terasa (scale 0.38 LOCK / rotate 0.85)
      tint = ref.getHex();
    }
    // MATERIAL UNIK PER-BOLA (bukan cache shared — prasyarat hover
    // per-bola: tint kuning hover harus mengenai bola yang di-hover
    // SAJA; shared = semua bola ikut kuning. Texture tetap shared
    // 1x di cache — hanya material clone murah per bola).
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: getOrbTexture(),
      color: tint,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,   // warna murni (warisan #15: ACES desaturasi)
      fog: false,
    }));
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

/**
 * HOVER-KUNING orb (user 2026-09-13: "kalau kursor didekatkan bola
 * oranye itu jadi kuning — bola yang sama, bukan bola lain"): dipanggil
 * dari wrapper updateMatrixWorld gizmo SETELAH fungsi asli (pola
 * kontrak #2). tc.axis = nama sumbu yang sedang di-hover (library
 * meng-setnya via picker raycast — mesh orb tetap ke-raycast walau
 * materialnya tak dirender). dragging = jangan highlight saat drag
 * (solo-drag sudah punya perilakunya sendiri).
 * Idempoten per bola: tint disimpan di sprite.userData.__restTint.
 */
const ORB_HOVER_TINT = new THREE.Color('#FFE066');   // kuning hangat
export function applyOrbHover(balls, activeAxis, dragging) {
  if (!Array.isArray(balls)) return;
  for (const ball of balls) {
    const orb = ball.userData && ball.userData.__gemOverlay;
    if (!orb || !orb.material) continue;
    const rest = orb.userData.__restTint || orb.material.color.getHex();
    orb.userData.__restTint = rest;
    const hovering = !dragging && activeAxis != null && ball.name === activeAxis;
    if (hovering) {
      orb.material.color.copy(ORB_HOVER_TINT);
    } else {
      orb.material.color.setHex(rest);
    }
  }
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
