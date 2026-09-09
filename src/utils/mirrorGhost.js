/**
 * ================================================================
 * mirrorGhost.js — Phase 56 (2026-09-09)
 * ================================================================
 *
 * TUJUAN (klarifikasi user, 2026-09-09):
 * Tool MIRROR = menggandakan seperti CLONE (klik-tahan-geser = block baru
 * mengikuti geseran), TAPI hasilnya adalah BAYANGAN KACA: sisi-sisi block
 * hasil 100% BERLAWANAN arah dari block asal. CLONE = 100% identik tanpa
 * perbedaan. Block yang belum di-rotate memang hasilnya kelihatan sama
 * seperti clone — itu BENAR, karena kubus simetris; "kekuatan asli mirror"
 * baru kelihatan saat block sudah di-rotate (sisi tidak beraturan).
 *
 * MATEMATIKA (terukur probe Node, bukan tebak):
 * Kaca sejati = refleksi = determinant NEGATIF. Rotasi murni apapun
 * bernilai det +1, jadi MENGRUBAH-BALIK ANGKA ROTASI SAJA TIDAK PERNAH
 * menghasilkan kaca (skema lama rot.y=−y, rot.z=−z terbukti det +1 —
 * cuma rotasi biasa). Cara benar (dipakai di sini):
 *   1. rotasi source R di-KONJUGASI terhadap bidang kaca: R' = S·R·S,
 *      S = diag(−1,1,1) (kaca normal sumbu X). Rumus cepatnya pada
 *      matriks rotasi: negasi elemen baris-0 & kolom-0 (kecuali e00).
 *      Terbukti ekuivalen EXACT dengan S·R·S (probe R5) dan menghasilkan
 *      rotasi valid det +1 (probe R1).
 *   2. scale.x ghost = −scale.x source → det total = det(R')·det(S) = −1
 *      = KACA SEJATI (probe R2). Winding triangle terbalik → Three.js
 *      merender sisi dalam; kubus simetris tidak terlihat bedanya, model
 *      GLB asimetris akan tampak terbalik seperti bayangan cermin.
 *   3. Posisi ghost = PERSIS posisi source (seperti clone). User menggeser
 *      lewat gizmo; hasil mirror final ada di tempat digeser. Jalur lama
 *      yang menegasi position.x membuat ghost muncul "di seberang area
 *      build" — salah sasaran (terukur: src.x=3 → ghost muncul di −3).
 *
 * HASIL PENGUKURAN (probe Node + harness Chrome GPU):
 *   yaw 90° → depan source (1,0,0), depan ghost (−1,0,0) = 100% lawan.
 *   yaw 45° → depan ghost = (−x, z) dari source — refleksi murni.
 *   identity → identity (block polos = kelihatan seperti clone, BENAR).
 *
 * Fungsi ini MURNI (tidak menyentuh scene/gizmo) — gampang dites
 * tanpa browser. Pemanggil (BlockSimulator3Dv2.jsx) bertanggung jawab
 * menambahkan ghost ke scene.
 * ================================================================
 */

import * as THREE from 'three';

const _m = new THREE.Matrix4();

/**
 * KONJUGASI REFLEKSI: R' = S·R·S, S = diag(−1,1,1).
 * Negasi baris-0 & kolom-0 matriks rotasi (e00 tetap — negasi 2x).
 * Hasil tetap rotasi valid det +1; digabung scale.x=−1 → kaca det −1.
 * @param {THREE.Quaternion} qOut quaternion hasil (ditulis di sini)
 * @param {THREE.Quaternion} qIn  quaternion rotasi source
 * @returns {THREE.Quaternion} qOut (untuk chaining)
 */
export function mirrorQuaternionX(qOut, qIn) {
  _m.makeRotationFromQuaternion(qIn);
  const e = _m.elements;
  e[1] = -e[1]; e[2] = -e[2]; // kolom 0 (e10, e20)
  e[4] = -e[4]; e[8] = -e[8]; // baris 0 (e01, e02)
  return qOut.setFromRotationMatrix(_m);
}

/**
 * Terapkan BAYANGAN KACA lengkap ke mesh ghost.
 * - rotation  = konjugasi refleksi dari source (kaca normal sumbu X)
 * - scale.x   = −scale.x source (dipertahankan beserta scale y/z)
 * - position  = PERSIS source (ghost mulai menumpuk source, seperti clone;
 *               user menggeser via gizmo → hasil mirror di posisi digeser)
 * Idempoten aman: dipanggil pada ghost baru hasil clone geometry.
 * @param {THREE.Mesh} ghost mesh ghost yang akan jadi bayangan kaca
 * @param {THREE.Mesh|THREE.Object3D} source block asal
 * @returns {THREE.Mesh} ghost (untuk chaining)
 */
export function applyMirrorGlass(ghost, source) {
  if (!ghost || !source) return ghost;
  try {
    ghost.position.copy(source.position);
    mirrorQuaternionX(ghost.quaternion, source.quaternion);
    ghost.scale.copy(source.scale);
    ghost.scale.x = -ghost.scale.x; // refleksi sejati det −1
  } catch (e) {
    // Jangan pernah crash jalur klik — ghost tetap berdiri meski gagal flip
  }
  return ghost;
}
