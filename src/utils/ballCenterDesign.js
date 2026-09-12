/**
 * ballCenterDesign.js — Phase 69 v2 (koreksi user 2026-09-12):
 * "bukan texture map di permukaan bola — itu jadi titik hitam 6 sisi.
 * Yang benar: SATU bentuk KRISTAL 2D di DALAM perut bola, tepat di
 * pusat, terlihat sama dari arah manapun."
 *
 * STRUKTUR REFERENSI (design_visual_tengah_.png, 2 vision konsisten):
 *   - Belah ketupat/diamond miring di pusat, gradasi glow lembut
 *     (inti paling terang, tanpa garis tegas — kesan bloom).
 *   - Titik kecil gelap di pusat (anchor point).
 *   - 1 per bola — bukan grid, bukan di permukaan.
 *
 * TEKNIK v2: THREE.Sprite (billboard — SELALU menghadap kamera) sebagai
 * CHILD bola, diposisikan tepat di pusat bola (offset 0). Sprite dirender
 * di dalam bola: material sprite depthTest=true → bagian sprite di dalam
 * bola terhalang kulit bola? Sprite di pusat + bola semi kecil — sprite
 * lebih besar dari bola akan TERLIHAT menembus (bagian luar kulit tampak).
 * Supaya tampak "DI DALAM perut bola", sprite dirender SETELAH bola dengan
 * depthTest=false + ukuran ≤ diameter bola → tampak melayang di pusat
 * bola seperti hologram kristal. Warna sprite = PUTIH polos (texture)
 * → dikali SpriteMaterial.color? TIDAK — desain kristal digambar dengan
 * GRADASI PUTIH→TRANSPARAN (glow), color material putih → tampak sebagai
 * cahaya kristal di semua warna bola. TITIK PUSAT gelap digambar di
 * texture (gelap solid — kontras dgn glow).
 *
 * Posisi bola gizmo di-bake ke geometry (position mesh = 0) → sprite
 * child di position (0,0,0) LOKAL bola = tepat pusat bola. Sprite ikut
 * transform bola otomatis (child).
 */

import * as THREE from 'three';

let _crystalTexCache = null;
let _crystalMatCache = null;

/**
 * Texture kristal: belah ketupat miring glow putih → transparan +
 * titik gelap di pusat. Polos (tanpa warna identitas) — tampak sebagai
 * "cahaya kristal" di bola warna apa pun.
 */
function getCrystalTexture() {
  if (_crystalTexCache) return _crystalTexCache;

  const SIZE = 128;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  // ── Belah ketupat miring (referensi: sudut diagonal, condong) ──
  const cx = SIZE / 2, cy = SIZE / 2;
  const rx = SIZE * 0.26;      // setengah-lebar diamond
  const ry = SIZE * 0.20;      // setengah-tinggi (lonjong)
  const tilt = -Math.PI / 8;   // miring ~22.5°

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

  // Gradasi glow: inti putih murni → tepi transparan (soft, no hard edge)
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry) * 1.2);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.restore();

  // ── Titik gelap kecil di pusat (anchor point referensi) ──
  const dotR = SIZE * 0.030;
  const dg = ctx.createRadialGradient(cx, cy, 0, cx, cy, dotR * 2);
  dg.addColorStop(0, 'rgba(20,20,20,0.95)');
  dg.addColorStop(0.6, 'rgba(20,20,20,0.5)');
  dg.addColorStop(1, 'rgba(20,20,20,0)');
  ctx.fillStyle = dg;
  ctx.beginPath();
  ctx.arc(cx, cy, dotR * 2, 0, Math.PI * 2);
  ctx.fill();

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
 * Pasang KRISTAL di tengah bola gizmo — SATU sprite billboard di pusat.
 * Idempoten via userData.__crystalCore. Ukuran default relatif radius bola
 * (0.8× diameter → memenuhi perut bola, ujung diamond di dalam kulat bola).
 *
 * @param {THREE.Mesh} ball  bola gizmo (geometry bake di posisi, mesh
 *                            position = pusat bola local gizmo).
 * @param {number} ballRadius radius bola (default gizmo 0.075).
 */
export function attachCrystalCore(ball, ballRadius = 0.075) {
  if (!ball || !ball.isMesh && !ball.isSprite) return null;
  if (ball.userData.__crystalCore) return ball.userData.__crystalCore;

  const sprite = new THREE.Sprite(getCrystalMaterial());
  // PUSAT BOLA = pusat bounding box GEOMETRY bola. Bola gizmo (scale &
  // rotate) diposisikan lewat geo.translate() BAKE KE GEOMETRY —
  // mesh.position = (0,0,0) = origin GIZMO, BUKAN pusat bola. Sprite di
  // (0,0,0) menghasilkan 6 kristal NUMPUK di pusat block (RED terukur:
  // offset 0.55 = distance bake). Sprite child bola → local space bola =
  // space geometry → pusat bbox = pusat bola, dan ikut transform bola
  // (wrapper Phase 68 menggeser ball.position per frame; child ikut).
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
  sprite.scale.set(dia * 0.85, dia * 0.85, 1); // hampir memenuhi perut bola
  sprite.renderOrder = 1001; // > bola (1000): kristal dirender SETELAH bola — tampak di perut bola
  sprite.raycast = () => {};  // kristal tidak boleh mengganggu klik picker
  ball.add(sprite);
  ball.userData.__crystalCore = sprite;
  return sprite;
}

/**
 * Lepas kristal dari bola (idempoten).
 */
export function detachCrystalCore(ball) {
  if (!ball || !ball.userData || !ball.userData.__crystalCore) return;
  const s = ball.userData.__crystalCore;
  try { if (s.parent) s.parent.remove(s); } catch (e) {}
  delete ball.userData.__crystalCore;
}

/**
 * Kompabilitas: applyCenterDesignToMaterial = NO-OP sekarang (texture map
 * permukaan sudah dicabut — metode diganti sprite kristal). Dipertahankan
 * supaya import lama tidak crash.
 */
export function applyCenterDesignToMaterial(_material) { /* no-op v2 */ }

/**
 * Dispose shared crystal resources (cleanup unmount).
 */
export function disposeCrystalResources() {
  if (_crystalMatCache) { try { _crystalMatCache.dispose(); } catch (e) {} _crystalMatCache = null; }
  if (_crystalTexCache) { try { _crystalTexCache.dispose(); } catch (e) {} _crystalTexCache = null; }
}
