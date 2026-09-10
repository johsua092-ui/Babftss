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

let sharedMat = null;
let sharedGeo = null;

function getSharedGeometry() {
  if (!sharedGeo) {
    // BoxGeometry UV: tiap wajah 0..1 — shader band tepi bekerja untuk
    // block kubus standar. Untuk mesh import GLB (UV acak), band tetap
    // bekerja relatif terhadap UV island masing-masing — cukup masuk akal.
    sharedGeo = new THREE.BoxGeometry(1, 1, 1);
  }
  return sharedGeo;
}

function getSharedMaterial() {
  if (!sharedMat) {
    sharedMat = new THREE.ShaderMaterial({
      uniforms: {
        uFrame: { value: DELETE_FRAME_WIDTH },        // 0.13 lebar wajah
        uColor: { value: new THREE.Color(0xff0a0a).multiplyScalar(4) }, // HDR merah darah
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uFrame;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          // Band tepi: merah kalau u ATAU v jatuh dalam strip 0..uFrame atau
          // (1-uFrame)..1 → membentuk bingkai persegi di tiap wajah.
          float edgeU = step(vUv.x, uFrame) + step(1.0 - uFrame, vUv.x);
          float edgeV = step(vUv.y, uFrame) + step(1.0 - uFrame, vUv.y);
          float frame = clamp(edgeU + edgeV, 0.0, 1.0);
          if (frame < 0.5) discard;               // tengah wajah = tembus
          gl_FragColor = vec4(uColor, 1.0);        // bingkai merah solid
        }
      `,
      transparent: false,
      depthTest: true,
      depthWrite: true,
      toneMapped: false,
      // polygonOffset: tarik frame SEDIKIT ke arah kamera supaya tidak
      // z-fight dengan kulit block (dua permukaan coplanar).
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  }
  return sharedMat;
}

/**
 * Pasang bingkai merah "painted frame" pada block — mesh shell child dengan
 * geometry box UV-standar (bukan geometry block; kita tidak butuh bentuk
 * asli — kita hanya melukis bingkai di bounding box-nya).
 * Catatan: untuk block kubus standar hasil = persis referensi. Untuk mesh
 * import GLB, shell box 1:1 scale block mengikuti bounding box — frame
 * mengelilingi seluruh objek (masuk akal untuk target delete).
 *
 * Idempoten: userData.__deleteOutline guard.
 */
export function attachDeleteWireframe(block) {
  if (!block) return null;
  if (block.userData.__deleteOutline) return block.userData.__deleteOutline;

  const shell = new THREE.Mesh(getSharedGeometry(), getSharedMaterial());
  // Scale 1.0 PERSIS — bingkai menempel di kulit block (flush), bukan
  // mengambang di luar. Ikut position/rotation/scale block sebagai child.
  block.add(shell);
  shell.raycast = () => {};  // outline tidak ikut raycast
  shell.renderOrder = 2;
  const handle = { line: shell, edges: null, sourceGeometry: null };
  block.userData.__deleteOutline = handle;
  return handle;
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
  if (sharedMat) { try { sharedMat.dispose(); } catch (e) {} sharedMat = null; }
  if (sharedGeo) { try { sharedGeo.dispose(); } catch (e) {} sharedGeo = null; }
}
