/**
 * deleteWireframe.js — Outline merah tool DELETE: WIREFRAME GARIS RUSUK.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * KONTEKS (keputusan user 2026-09-10, gambar referensi "folder image/Screenshot
 * 2026-09-09 112617.png" — dianalisis pixel 4 tahap, 60.828 px merah + 43.491
 * px biru):
 *   Outline yang BENAR = garis WIREFRAME 12 RUSUK kubus, TEBAL (±30px layar),
 *   kubus outline ~1.28x ukuran block (terukur: bbox merah 383px vs block
 *   298px), block tetap warna ASLI murni (biru tetap biru — tanpa emissive).
 *   Teknik LAMA (shell BackSide scale 1.3, Mesh permukaan penuh) = "salah
 *   total": yang dirender seluruh permukaan belakang kubus merah 130% →
 *   tampak seperti block dibungkus kantong merah menyala, bukan garis rusuk.
 *
 * TEKNIK (diprobe di Node, three r185 — jalan):
 *   - EdgesGeometry(geometry, thresholdAngle) → 12 rusuk kubus (24 vertex).
 *   - LineSegmentsGeometry + LineMaterial (linewidth dalam PIXEL layar,
 *     bukan world-unit) → garis TEBAL konsisten di semua zoom.
 *   - LineSegments2 dirender dengan shader khusus (bukan THREE.Line biasa
 *     yang hanya 1px dan RUSAK di SwiftShader — pelajaran kontrak: uji
 *     garis wajib GPU nyata).
 *
 * DESAIN:
 *   - attach sebagai CHILD block → otomatis ikut position/rotation/scale.
 *   - scale 1.28 di LOCAL space child (setelah rotasi block, rusuk tetap
 *     nempel di geometry block — world-scale tidak perlu dihitung manual).
 *   - depthTest: true, depthWrite: false → rusuk belakang TERTUTUP block
 *     secara natural (persis referensi: interior bersih), rusuk depan
 *     terlihat menembus di tepi.
 *   - HDR color 4x + toneMapped:false → merah darah menyala konsisten di
 *     jalur render langsung & bloom (warisan keputusan shell lama yang
 *     sudah terbukti baik — dipertahankan).
 *   - raycast disabled → outline tidak pernah menghalangi hit delete/hover.
 *   - Idempoten: tanda userData.deleteOutline; re-attach block sama = no-op.
 *   - dispose() lengkap: geometry line + material + EdgesGeometry sumber.
 *
 * BARIS SEJARAH: menggantikan shell BackSide di BlockSimulator3D.jsx
 * (dulu DELETE_OUTLINE_SCALE=1.3, Mesh BackSide, baris ~12814-12876 era
 * pra-2026-09-10). Fungsi setEmissive/highlightSelected TIDAK tersentuh.
 * ══════════════════════════════════════════════════════════════════════════
 */

import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

// Ketebalan garis dalam PIXEL layar (referensi: ~30px pada block ~300px layar
// → rasio ~10%; pada layar 1280 viewport cukup 6px supaya tegas tapi tidak
// menelan block kecil saat zoom out — angka final dari verifikasi pixel).
export const DELETE_WIREFRAME_LINEWIDTH = 6;

// Rasio inflate kubus outline vs block — 383/298 = 1.285 terukur dari gambar
// referensi (outline menggreeting block dari luar, ada gap jelas).
export const DELETE_WIREFRAME_SCALE = 1.28;

let sharedMat = null;

function getSharedMaterial() {
  if (!sharedMat) {
    sharedMat = new LineMaterial({
      // HDR 4x (channel > 1): bloom OFF → clamp merah terang penuh;
      // bloom ON (ACES) → tetap menyala. Sama seperti shell lama — terbukti.
      color: new THREE.Color(0xff0a0a).multiplyScalar(4),
      linewidth: DELETE_WIREFRAME_LINEWIDTH, // pixel — tebal di semua zoom
      // worldUnits:false = default; linewidth diinterpretasikan dalam pixel.
      transparent: false,
      depthTest: true,   // rusuk belakang tertutup block (referensi: interior bersih)
      depthWrite: false,
      toneMapped: false,
      fog: false,
    });
  }
  return sharedMat;
}

/**
 * Set resolution LineMaterial — WAJIB dipanggil (LineMaterial pixel-based
 * butuh tahu ukuran render target, kalau tidak garis HILANG).
 * Dipanggil: (1) tiap attach, (2) tiap resize renderer (via callback yang
 * simulator sediakan di threeRef).
 */
export function setDeleteWireframeResolution(width, height) {
  const mat = getSharedMaterial();
  mat.resolution.set(width, height);
}

/**
 * Pasang outline wireframe merah pada block (menggantikan removeDeleteOutline
 * lama). Return instance handle { line, sourceGeometry } supaya caller bisa
 * detach/dispose. Mesh outline di-attach sebagai CHILD block → ikut
 * transform block otomatis.
 *
 * @param {THREE.Object3D} block  mesh block yang di-hover (bisa nested mesh
 *                                hasil import GLB — EdgesGeometry dipakai dari
 *                                geometry mesh itu sendiri).
 * @param {number} rendererWidth   lebara render target (untuk resolution)
 * @param {number} rendererHeight  tinggi render target
 */
export function attachDeleteWireframe(block, rendererWidth, rendererHeight) {
  if (!block || !block.geometry) return null;

  // Idempoten: sudah ada outline di block ini → jangan dobel
  if (block.userData.__deleteOutline) return block.userData.__deleteOutline;

  setDeleteWireframeResolution(rendererWidth || 1, rendererHeight || 1);

  // 12 rusuk dari geometry block (thresholdAngle 1° — kubus clean 90°).
  // Catatan: untuk mesh import GLB dengan geometry kompleks, EdgesGeometry
  // otomatis hanya ambil rusuk tajam (bukan semua segitiga) — tetap masuk akal
  // secara visual sebagai "garis tepi objek".
  const sourceGeometry = block.geometry.index
    ? block.geometry.toNonIndexed() : block.geometry;
  const edges = new THREE.EdgesGeometry(sourceGeometry, 1);

  const lineGeo = new LineSegmentsGeometry();
  lineGeo.setPositions(Array.from(edges.attributes.position.array));

  const line = new LineSegments2(lineGeo, getSharedMaterial());
  line.computeLineDistances();
  line.scale.setScalar(DELETE_WIREFRAME_SCALE);
  line.raycast = () => {}; // outline TIDAK ikut raycast (delete/gizmo/info)
  line.renderOrder = 2;   // di atas block, di bawah UI/gizmo

  block.add(line);
  const handle = { line, edges, sourceGeometry };
  block.userData.__deleteOutline = handle;
  return handle;
}

/**
 * Lepas outline dari block (dipanggil saat hover keluar / ganti target /
 * cleanup). Idempoten + aman untuk block yang sudah di-dispose.
 */
export function detachDeleteWireframe(block) {
  if (!block) return;
  const handle = block.userData && block.userData.__deleteOutline;
  if (!handle) return;
  try {
    if (handle.line.parent) handle.line.parent.remove(handle.line);
    handle.line.geometry.dispose();
    if (handle.edges !== handle.sourceGeometry) handle.edges.dispose();
    if (handle.sourceGeometry !== block.geometry) handle.sourceGeometry.dispose();
  } catch (e) {
    // block mungkin sudah di-dispose — abaikan dengan aman
  }
  delete block.userData.__deleteOutline;
}

/**
 * Dispose material shared (dipanggil di cleanup unmount scene, SEBELUM
 * renderer.dispose()). Aman dipanggil berulang.
 */
export function disposeDeleteWireframeMaterial() {
  if (sharedMat) {
    try { sharedMat.dispose(); } catch (e) { /* sudah disposed */ }
    sharedMat = null;
  }
}
