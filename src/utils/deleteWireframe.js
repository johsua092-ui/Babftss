/**
 * deleteWireframe.js — Outline painted-frame KETEBALAN KONSTAN DUNIA (v4).
 *
 * KOREKSI USER (2026-09-12): "outline oranye MELAR ikutan panjang saat
 * block di-scale" — v3 pakai fraksi UV tetap (13%): band = 13% dari sisi
 * yang memanjang = makin tebal saat block panjang. SALAH. Yang diminta:
 * tebal outline KONSTAN di sisi, berapa pun block di-scale.
 *
 * FIX v4: band dihitung di RUANG DUNIA, bukan fraksi UV. Vertex shader
 * meng-extract scale dunia block dari modelMatrix (decompose kolom),
 * fragment membandingkan JARAK LOKAL pixel ke tepi unit box dengan
 * uFrameWorld / scaleAxis → band dunia konstan (0.045 unit) di semua
 * sisi, semua ukuran, semua scale.
 *
 * Struktur v3 dipertahankan: shell box child block (scale menyesuaikan
 * bounding box LOCAL geometry), shader band tepi + discard tengah,
 * polygonOffset anti z-fight, material cache per warna, idempoten
 * userData.__deleteOutline, dispose menyapu cache.
 */

import * as THREE from 'three';

// Ketebalan band outline dalam UNIT DUNIA (konstan — tidak melar).
// 0.13 = 13% wajah block standar 1×1×1 — persis tampilan v3 yang sudah
// disetujui user (verifikasi ganda vision 5/5); sebagai band DUNIA ia
// tetap 0.13 unit di block 4x panjang (tidak ikut melar).
export const FRAME_WORLD_WIDTH = 0.13;

let sharedGeo = null;
const matCache = new Map();

function getSharedGeometry() {
  if (!sharedGeo) {
    sharedGeo = new THREE.BoxGeometry(1, 1, 1);
  }
  return sharedGeo;
}

const FRAME_VERT = /* glsl */ `
  varying vec3 vLocalPos;
  varying vec3 vWorldScale;
  void main() {
    vLocalPos = position;
    // Extract world scale dari modelMatrix (panjang kolom = scale per sumbu)
    vWorldScale = vec3(
      length(modelMatrix[0].xyz),
      length(modelMatrix[1].xyz),
      length(modelMatrix[2].xyz)
    );
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FRAME_FRAG = /* glsl */ `
  uniform float uFrameWorld;
  uniform vec3 uColor;
  varying vec3 vLocalPos;
  varying vec3 vWorldScale;
  void main() {
    // Posisi lokal unit box: -0.5..+0.5. Jarak ke tepi per sumbu:
    // distToEdge.x = 0.5 - |vLocalPos.x| (di wajah manapun).
    // Band dunia konstan: pixel di-dalam band jika jarak lokal ke tepi
    // < uFrameWorld / scaleAxis (band dunia dibagi scale = band lokal).
    // Pixel wajah hanya 2 sumbu relevan; sumbu wajah (normal) punya
    // |pos| ~ 0.5 → jaraknya 0 → selalu band = BENAR (seluruh wajah
    // tepi wajah adalah band jika wajah itu sendiri tepi? TIDAK —
    // wajah unit box: sumbu normal kontribusi 0.5, dua sumbu lain bervariasi.
    // Band wajah = TEPI wajah (2 sumbu non-normal dekat 0.5).
    // Cara benar: band jika ADA satu sumbu non-normal dengan
    // 0.5 - |pos_axis| < halfBand_axis. Sumbu normal otomatis tak kena
    // karena |pos_normal| = 0.5 → 0.5 - 0.5 = 0 < halfBand → IKUT band?!
    // Itu akan mengecat SELURUH wajah. Fix: pakai jarak ke tepi wajah
    // berbasis koordinat 2D wajah — tapi lebih sederhana: hitung untuk
    // TIAP sumbu jarak Dunia = (0.5 - |pos|) * scale, band jika
    // min over non-normal axes < uFrameWorld. Normal axis dideteksi via
    // pos terbesar absolut == 0.5 (wajah unit box).
    vec3 distLocal = vec3(0.5) - abs(vLocalPos);          // jarak lokal ke tepi per sumbu
    vec3 distWorld = distLocal * vWorldScale;               // jarak dunia
    // Sumbu wajah (normal): |pos| == 0.5 → distLocal ~ 0 → distWorld ~ 0.
    // Wajah X: pixel di tengah wajah punya pos.y/z bervariasi, distWorld.y/z
    // menentukan band. distWorld.x ~ 0 selalu — MAKSUDNYA wajah ini sendiri
    // adalah "tepi" di sumbu X → seluruh wajah X adalah kandidat band hanya
    // jika distWorld.y ATAU distWorld.z juga kecil (dekat rusuk).
    // Band = pixel dekat RUSUK (2 sumbu sekaligus ~0) ATAU dekat tepi
    // wajah (1 sumbu non-normal ~0). Sederhana & benar: band jika
    // KEDUA-duanya: minimal 1 sumbu distWorld < uFrameWorld (rusuk/wajah)
    // DAN pixel di wajah terluar... — pendekatan UV-style yang terbukti:
    // tiap wajah unit box UV-nya 0..1 di 2 sumbu non-normal.
    // Konversi posisi lokal → "uv wajah": pilih 2 sumbu non-normal
    // (dua distWorld TERBESAR = non-normal; terkecil = normal).
    float d1 = distWorld.x, d2 = distWorld.y, d3 = distWorld.z;
    // urutkan ascending: terkecil = sumbu normal
    float m12 = min(d1, d2), mx12 = max(d1, d2);
    float m3 = min(d3, mx12), mx3 = max(d3, mx12);
    float smallest = min(m12, m3);          // sumbu normal (wajah)
    float middle = (m12 < m3) ? min(mx12, m3) : min(m12, mx12); // non-normal terdepat tepi
    float largest = max(mx12, mx3);         // non-normal jauh dari tepi
    // Band dunia konstan: band jika middle < uFrameWorld (dekat rusuk
    // wajah) — sumbu normal (smallest) diabaikan, sumbu jauh diabaikan.
    // middle mencakup KEDUA tepi wajah (dekat 0.5+ dan 0.5-): benar.
    if (middle < uFrameWorld) {
      gl_FragColor = vec4(uColor, 1.0);
    } else {
      discard;
    }
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
        uFrameWorld: { value: FRAME_WORLD_WIDTH },
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
 * Pasang bingkai painted-frame (tebal konstan dunia) pada block.
 * Dipakai: delete (merah #FF0A0A HDR), paint (putih/warna user),
 * scale hover (oranye #f59e0b). Idempoten via userData.__deleteOutline.
 */
export function attachPaintedFrame(block, hexColor) {
  if (!block) return null;
  if (block.userData.__deleteOutline) return block.userData.__deleteOutline;
  const shell = new THREE.Mesh(getSharedGeometry(), getMaterial(hexColor));
  // Ukuran shell = bounding box LOCAL geometry block (unit box standar
  // untuk kubus library; mesh import GLB menyesuaikan bbox lokalnya).
  try {
    block.geometry.computeBoundingBox();
    const bb = block.geometry.boundingBox;
    const sx = (bb.max.x - bb.min.x) || 1;
    const sy = (bb.max.y - bb.min.y) || 1;
    const sz = (bb.max.z - bb.min.z) || 1;
    shell.scale.set(sx, sy, sz);
    shell.position.set(
      (bb.max.x + bb.min.x) / 2,
      (bb.max.y + bb.min.y) / 2,
      (bb.max.z + bb.min.z) / 2,
    );
  } catch (e) { /* geometry aneh → fallback scale 1 */ }
  block.add(shell);
  shell.raycast = () => {};
  shell.renderOrder = 2;
  const handle = { line: shell };
  block.userData.__deleteOutline = handle;
  return handle;
}

/** Wrapper delete — merah darah HDR (perilaku lama tidak berubah). */
export function attachDeleteWireframe(block) {
  return attachPaintedFrame(block, new THREE.Color(0xff0a0a).multiplyScalar(4));
}

/**
 * Lepas bingkai dari block (idempoten + aman untuk block sudah dispose).
 */
export function detachDeleteWireframe(block) {
  if (!block) return;
  const handle = block.userData && block.userData.__deleteOutline;
  if (!handle) return;
  try {
    if (handle.line.parent) handle.line.parent.remove(handle.line);
    // geometry & material SHARED — jangan dispose per-block.
  } catch (e) { /* block mungkin sudah di-dispose */ }
  delete block.userData.__deleteOutline;
}

/**
 * Kompatibilitas API lama (simulator memanggil ini di handleResize).
 * Shader scale-aware tidak butuh resolution — no-op.
 */
export function setDeleteWireframeResolution(_width, _height) { /* no-op */ }

/**
 * Dispose resource shared — dipanggil di cleanup unmount scene.
 */
export function disposeDeleteWireframeMaterial() {
  for (const mat of matCache.values()) {
    try { mat.dispose(); } catch (e) { /* sudah disposed */ }
  }
  matCache.clear();
  if (sharedGeo) { try { sharedGeo.dispose(); } catch (e) {} sharedGeo = null; }
}
