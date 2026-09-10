/**
 * deleteWireframe.js — Outline hover tool DELETE: BINGKAI MERAH MENEMPEL
 * DI KULIT BLOCK ("painted frame", bukan wireframe mengambang).
 *
 * ══════════════════════════════════════════════════════════════════════════
 * SEJARAH SINGKAT (biar AI penerus tidak salah urutan):
 *   v1 (era lama)        : shell BackSide scale 1.3 — permukaan merah raksasa
 *                          membungkus block ("salah total" versi user).
 *   v2 (Phase 60, 44700ee): EdgesGeometry + LineSegments2 wireframe garis
 *                          rusuk tebal 1.28x DI LUAR block — "50% benar":
 *                          bentuk rusuk sudah benar, TAPI mengambang/menempel
 *                          di luar kulit block.
 *   v3 (INI, hasil analisis Gemini vision terhadap gambar referensi user
 *       "folder image/Screenshot 2026-09-09 112617.png" — konfirmasi 3x
 *       konsisten): outline yang dimaksud user = BINGKAI MERAH MENEMPEL DI
 *       PERMUKAAN block (seperti kubus biru dicat tepinya merah):
 *         • SATU kubus, frame merah flush di kulit — TANPA celah udara,
 *           TANPA bayangan kedalaman (bukan objek terpisah yang mengelilingi).
 *         • Biru BERHENTI SEBELUM rusuk: tiap wajah = bingkai merah ~12-15%
 *           lebar wajah mengelilingi panel biru inset (terukur visual Gemini).
 *         • Ketebalan konsisten semua rusuk; flat/unlit (tanpa gradasi).
 *
 * TEKNIK v3:
 *   ShaderMaterial per-fragment berbasis UV BoxGeometry: setiap wajah kubus
 *   BoxGeometry punya UV 0..1. Warna = merah jika koordinat UV berada dalam
 *   "band tepi" (u atau v < FRAME atau > 1-FRAME); selain itu ALPHA 0
 *   (tembus pandang) → block asli terlihat di tengah. DepthTest true +
 *   polygonOffset supaya frame tidak z-fight dengan kulit block (frame
 *   dirender persis di permukaan). Wireframe rusuk garis TIDAK dipakai lagi.
 *   → Efek: block asli tampak "dibingkai merah" di tepinya, persis referensi.
 *
 *   Shell mesh child scale 1.0 PERSIS ukuran block (menempel kulit block,
 *   bukan 1.28 di luar). Warna HDR 4x + toneMapped:false (warisan terbukti
 *   baik untuk jalur bloom & direct render).
 * ══════════════════════════════════════════════════════════════════════════
 */

import * as THREE from 'three';

// Ketebalan bingkai sebagai fraksi lebar wajah (12-15% terukur dari
// referensi; 0.13 = tengah rentang). Frame di SEMUA rusuk konsisten.
export const DELETE_FRAME_WIDTH = 0.13;

let sharedGeo = null;
// Cache material PER WARNA (uniform uColor per warna) — hitam outline
// dipakai lintas block & lintas tool tanpa clone per block.
const matCache = new Map();

function getSharedGeometry() {
  if (!sharedGeo) {
    sharedGeo = new THREE.BoxGeometry(1, 1, 1);
  }
  return sharedGeo;
}

const FRAME_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FRAME_FRAG = /* glsl */ `
  uniform float uFrame;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float edgeU = step(vUv.x, uFrame) + step(1.0 - uFrame, vUv.x);
    float edgeV = step(vUv.y, uFrame) + step(1.0 - uFrame, vUv.y);
    float frame = clamp(edgeU + edgeV, 0.0, 1.0);
    if (frame < 0.5) discard;
    gl_FragColor = vec4(uColor, 1.0);
  }
`;

function getMaterial(hexColor) {
  // Normalisasi ke key string
  const key = (hexColor instanceof THREE.Color) ? '#' + hexColor.getHexString()
    : typeof hexColor === 'number' ? '#' + new THREE.Color(hexColor).getHexString()
    : String(hexColor);
  if (!matCache.has(key)) {
    let color;
    if (typeof hexColor === 'number') color = new THREE.Color(hexColor);
    else color = new THREE.Color(key);
    matCache.set(key, new THREE.ShaderMaterial({
      uniforms: {
        uFrame: { value: DELETE_FRAME_WIDTH },
        uColor: { value: color },
      },
      vertexShader: FRAME_VERT,
      fragmentShader: FRAME_FRAG,
      transparent: false,
      depthTest: true,
      depthWrite: true,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }));
  }
  return matCache.get(key);
}

/**
 * Pasang bingkai painted-frame dengan WARNA APA PUN pada block.
 * Dipakai: delete (merah) via attachDeleteWireframe + paint (putih/warna
 * user) via attachPaintedFrame — teknik sama, warna beda.
 * Idempoten: userData.__deleteOutline guard (satu frame per block;
 * ganti tool menghapus dulu via detach).
 */
export function attachPaintedFrame(block, hexColor) {
  if (!block) return null;
  if (block.userData.__deleteOutline) return block.userData.__deleteOutline;
  const shell = new THREE.Mesh(getSharedGeometry(), getMaterial(hexColor));
  // Ukuran: shell box 1x1x1 dibuat sama dengan UKURAN EFEKTIF geometry block
  // supaya bingkai MENEMPEL di kulit (bukan 25% lebih besar kalau block
  // punya ukuran beda — terukur di harness vision: block 0.8 + shell 1.0
  // = bingkai tampak mengambang/menembus). Pakai bounding box GEOMETRY block
  // (bukan world scale — shell child mengikuti scale block otomatis).
  try {
    block.geometry.computeBoundingBox();
    const bb = block.geometry.boundingBox;
    const sx = (bb.max.x - bb.min.x) || 1;
    const sy = (bb.max.y - bb.min.y) || 1;
    const sz = (bb.max.z - bb.min.z) || 1;
    shell.scale.set(sx, sy, sz);
    // geometry block mungkin tidak berpusat di origin — offset supaya
    // bounding box shell ALIGN dengan bounding box block.
    shell.position.set(
      (bb.max.x + bb.min.x) / 2,
      (bb.max.y + bb.min.y) / 2,
      (bb.max.z + bb.min.z) / 2,
    );
  } catch (e) { /* geometry aneh → biarkan scale 1 (fallback aman) */ }
  block.add(shell);
  shell.raycast = () => {};
  shell.renderOrder = 2;
  const handle = { line: shell };
  block.userData.__deleteOutline = handle;
  return handle;
}

/** Wrapper delete — merah darah HDR (perilaku v3 tidak berubah). */
export function attachDeleteWireframe(block) {
  return attachPaintedFrame(block, new THREE.Color(0xff0a0a).multiplyScalar(4));
}

/**
 * Lepas bingkai dari block. Idempoten + aman untuk block yang sudah
 * di-dispose.
 */
export function detachDeleteWireframe(block) {
  if (!block) return;
  const handle = block.userData && block.userData.__deleteOutline;
  if (!handle) return;
  try {
    if (handle.line.parent) handle.line.parent.remove(handle.line);
    // geometry & material SHARED — jangan dispose per-block (dipakai lintas
    // block); cukup lepas dari scene graph.
  } catch (e) { /* block mungkin sudah di-dispose */ }
  delete block.userData.__deleteOutline;
}

/**
 * Kompatibilitas API lama (simulator memanggil ini di handleResize).
 * Shader UV tidak butuh resolution — no-op, dipertahankan supaya
 * pemanggil tidak rusak.
 */
export function setDeleteWireframeResolution(_width, _height) { /* no-op v3 */ }

/**
 * Dispose resource shared — dipanggil di cleanup unmount scene.
 */
export function disposeDeleteWireframeMaterial() {
  // v4: material sekarang cache per-warna (Map) — dispose SEMUA + kosongkan.
  for (const mat of matCache.values()) {
    try { mat.dispose(); } catch (e) { /* sudah disposed */ }
  }
  matCache.clear();
  if (sharedGeo) { try { sharedGeo.dispose(); } catch (e) {} sharedGeo = null; }
}
