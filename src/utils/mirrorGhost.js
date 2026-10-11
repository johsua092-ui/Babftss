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
 * tanpa browser. Pemanggil (BlockSimulator3D.jsx) bertanggung jawab
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
 * KONJUGASI REFLEKSI UNTUK SUMBU APA PUN (2026-10-03, permintaan user):
 * "saya klik tahan gizmo di x+ maka disitulah garis mirror muncul" →
 * BIDANG CERMIN = tegak lurus SUMBU YANG DIGENGGAM (bukan selalu X).
 *
 * R' = S·R·S dengan S = diag(−1,1,1) utk X, diag(1,−1,1) utk Y,
 * diag(1,1,−1) utk Z. Rumus cepat pada matriks rotasi (kolom-mayor):
 * negasi elemen BARIS ke-a & KOLOM ke-a (kecuali diagonal e[a][a]).
 * Hasil tetap rotasi valid (det +1); digabung scale[axis]=−1 → kaca det −1.
 * @param {THREE.Quaternion} qOut hasil
 * @param {THREE.Quaternion} qIn  rotasi source
 * @param {'x'|'y'|'z'} axis sumbu normal bidang cermin
 */
export function mirrorQuaternionAxis(qOut, qIn, axis) {
  const a = (axis === 'y' || axis === 'z') ? axis : 'x';
  _m.makeRotationFromQuaternion(qIn);
  const e = _m.elements; // COLUMN-MAJOR: (row r, col c) = e[c*4 + r]
  // R' = S·R·S  →  negasi elemen (baris ke-a) DAN (kolom ke-a); diagonal tetap.
  if (a === 'x') {
    e[4] = -e[4]; e[8] = -e[8];   // baris 0: (0,1),(0,2)
    e[1] = -e[1]; e[2] = -e[2];   // kolom 0: (1,0),(2,0)
  } else if (a === 'y') {
    e[1] = -e[1]; e[9] = -e[9];   // baris 1: (1,0),(1,2)
    e[4] = -e[4]; e[6] = -e[6];   // kolom 1: (0,1),(2,1)
  } else {
    e[2] = -e[2]; e[6] = -e[6];   // baris 2: (2,0),(2,1)
    e[8] = -e[8]; e[9] = -e[9];   // kolom 2: (0,2),(1,2)
  }
  return qOut.setFromRotationMatrix(_m);
}

/**
 * Terapkan BAYANGAN KACA untuk SUMBU apa pun (posisi dicerminkan terhadap
 * bidang tegak lurus `axis` yang berada di `planeCoord`).
 * @param {THREE.Mesh} ghost
 * @param {THREE.Mesh|THREE.Object3D} source
 * @param {'x'|'y'|'z'} axis
 * @param {number} planeCoord koordinat bidang cermin pada sumbu itu
 */
/**
 * ── FIX bab 167 (2026-10-11, laporan user): "geser gizmo ke kiri dia kanan" ──
 * AKAR TERUKUR: representasi cermin via scale NEGATIF membuat TransformControls
 * salah arah — orientasi gizmo diambil dari matrixWorld.decompose(), dan
 * decompose MEMBUANG tanda negatif. Hasil ukur: sisi objek +X → [−1,0,0] dunia,
 * tapi panah gizmo +X → [+1,0,0] dunia (dot = −1) → geser kiri jadi kanan.
 *
 * FIX: BAKE cermin ke GEOMETRI (flip koordinat sumbu cermin + balik urutan
 * winding supaya wajah tidak menghadap dalam / J24), lalu skala dikembalikan
 * POSITIF. Hasil render IDENTIK cermin sejati, tapi objek jadi objek biasa →
 * gizmo, snap, rotate, scale semua berperilaku normal.
 *
 * ⚠️ Geometri WAJIB di-CLONE dulu (bisa dipakai bersama blok lain / cache).
 * ⚠️ ANAK MESH (tutup/pintu) TIDAK diubah: menurut aljabar refleksi, anak sudah
 *    ikut tercermin lewat konjugasi quaternion induk — mengubahnya = dobel cermin.
 */
const _AXI = { x: 0, y: 1, z: 2 };

export function flipGeometryAlongAxis(geo, axis) {
  const ai = _AXI[axis] !== undefined ? _AXI[axis] : 0;
  try {
    const pos = geo.attributes && geo.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) pos.setComponent(i, ai, -pos.getComponent(i, ai));
      pos.needsUpdate = true;
    }
    const nor = geo.attributes && geo.attributes.normal;
    if (nor) {
      for (let i = 0; i < nor.count; i++) nor.setComponent(i, ai, -nor.getComponent(i, ai));
      nor.needsUpdate = true;
    }
    const idx = geo.index;
    if (idx) {
      for (let t = 0; t + 2 < idx.count; t += 3) {
        const b = idx.getX(t + 1);
        idx.setX(t + 1, idx.getX(t + 2));
        idx.setX(t + 2, b);
      }
      idx.needsUpdate = true;
    } else {
      // ── FIX bab 167b (TERUKUR): geometri NSI = NON-INDEXED (chest 3108 vtx,
      //    small_treasure 792/2232 vtx). Tanpa cabang ini, winding TIDAK dibalik
      //    → wajah menghadap DALAM → objek terlihat TRANSPARAN/tembus pandang.
      //    Cara: tukar vertex ke-2 & ke-3 tiap segitiga (i+1 <-> i+2).
      const _swap = (attr) => {
        if (!attr) return;
        for (let i = 0; i + 2 < attr.count; i += 3) {
          for (let c = 0; c < attr.itemSize; c++) {
            const a = attr.getComponent(i + 1, c);
            attr.setComponent(i + 1, c, attr.getComponent(i + 2, c));
            attr.setComponent(i + 2, c, a);
          }
        }
        attr.needsUpdate = true;
      };
      _swap(pos);
      _swap(nor);
      _swap(geo.attributes && geo.attributes.uv);
    }
    if (geo.computeBoundingBox) geo.computeBoundingBox();
    if (geo.computeBoundingSphere) geo.computeBoundingSphere();
  } catch (e) { /* jangan gagalkan jalur mirror */ }
  return geo;
}

export function bakeMirrorIntoGeometry(mesh, axis) {
  if (!mesh || !mesh.geometry) return mesh;
  try {
    const ai = _AXI[axis] !== undefined ? _AXI[axis] : 0;
    // 1) ROOT: bake cermin ke GEOMETRI → skala tetap POSITIF → gizmo tidak
    //    lagi terbalik arah (FIX bab 167 "geser kiri dia kanan").
    mesh.geometry = mesh.geometry.clone();
    flipGeometryAlongAxis(mesh.geometry, axis);
    mesh.scale[axis] = Math.abs(mesh.scale[axis]);
    // 2) ANAK MESH (tutup/pintu/aura): sebelumnya ikut tercermin karena skala
    //    negatif INDUK. Karena induk kini positif, anak harus dicerminkan
    //    SENDIRI: T_anak' = S · T_anak  →  posisi & GEOMETRI di-flip pada sumbu
    //    cermin, rotasi DIKONJUGASI (S·R·S), skala tetap POSITIF.
    //    ⚠️ Terukur (uji K5, 2026-10-11): tanpa langkah ini anak bergeser
    //       simpangan 1.1 (tutup "hilang"/meleset).
    mesh.children.forEach((ch) => {
      if (!ch || !ch.position) return;
      try {
        ch.position.setComponent(ai, -ch.position.getComponent(ai));
        mirrorQuaternionAxis(ch.quaternion, ch.quaternion, axis);
        if (ch.geometry) {
          ch.geometry = ch.geometry.clone();
          flipGeometryAlongAxis(ch.geometry, axis);
        }
      } catch (e) { /* jangan gagalkan jalur mirror */ }
    });

    // ── FIX bab 176 (2026-10-11): TUTUP TREASURE "KEBALIK" saat dibuka lalu
    //    di-mirror/clone. AKAR TERUKUR (uji176d): konjugasi quaternion anak di
    //    atas mengubah Rx(θ) → Rx(−θ), TAPI `userData.st.angle` (yang ditulis
    //    ulang oleh loop animasi tiap frame) masih bernilai +θ → tutup berputar
    //    ke arah TERBALIK (terukur beda 123.9°). Treasure TERTUTUP (θ=0) aman —
    //    itulah sebabnya bug hanya muncul saat treasure sudah DIBUKA.
    //    SOLUSI: selaraskan st.angle/st.target ke sudut EFEKTIF tutup (turunan
    //    dari quaternion hasil bake). Otomatis benar utk semua sumbu & tanda.
    //    Ditempatkan DI SINI supaya SEMUA jalur (klik/auto/switch/multi) ikut.
    try {
      const _ud = mesh.userData;
      if (_ud && _ud.st) {
        let _lid = null;
        for (let _k = 0; _k < mesh.children.length; _k++) {
          const _c = mesh.children[_k];
          if (_c && _c.userData && _c.userData.isStLid) { _lid = _c; break; }
        }
        if (_lid) {
          const _e = new THREE.Euler().setFromQuaternion(_lid.quaternion, 'XYZ');
          _ud.st.angle = _e.x;
          _ud.st.target = _e.x;
          _ud.st.applied = undefined;   // paksa loop menulis ulang
          _lid.rotation.x = _e.x;       // konsisten dgn geometri hasil bake
          // ── FIX bab 177 (2026-10-11, laporan user): "buka lagi → tutup TEMBUS
          //    ke dalam badan". AKAR TERUKUR (uji177b): sudut BUKA peti hasil
          //    mirror BERLAWANAN TANDA (+2.06). Handler klik memakai `st.openAngle`;
          //    di sini kita cerminkan openAngle dgn KONJUGASI YANG SAMA (eksak,
          //    benar utk sumbu apa pun & tanda apa pun) supaya klik-buka berikutnya
          //    memakai sudut yang benar.
          if (typeof _ud.st.openAngle !== 'number') _ud.st.openAngle = _ud.st.angle || 0;
          const _qOpen = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(1, 0, 0), _ud.st.openAngle);
          mirrorQuaternionAxis(_qOpen, _qOpen, axis);
          _ud.st.openAngle = new THREE.Euler().setFromQuaternion(_qOpen, 'XYZ').x;
        }
      }
    } catch (e) { /* jangan gagalkan jalur mirror */ }
  } catch (e) { /* jangan gagalkan jalur mirror */ }
  return mesh;
}

export function applyMirrorGlassAxis(ghost, source, axis, planeCoord) {
  if (!ghost || !source) return ghost;
  try {
    const a = (axis === 'y' || axis === 'z') ? axis : 'x';
    ghost.position.copy(source.position);
    // cerminkan KOORDINAT pada sumbu cermin
    if (typeof planeCoord === 'number' && isFinite(planeCoord)) {
      ghost.position[a] = 2 * planeCoord - source.position[a];
    }
    mirrorQuaternionAxis(ghost.quaternion, source.quaternion, a);
    ghost.scale.copy(source.scale);
    ghost.scale[a] = -ghost.scale[a]; // refleksi sejati det −1
    // ⚠️ FIX bab 167c: JANGAN bake di sini — anak mesh (tutup/aura) ditambahkan
    //    OLEH PEMANGGIL setelah fungsi ini. Bake WAJIB dipanggil PALING AKHIR
    //    (setelah semua anak terpasang) supaya anak ikut tercermin. Lihat
    //    bakeMirrorIntoGeometry() + pemanggilannya di BlockSimulator3D.jsx.
  } catch (e) {
    // Jangan pernah crash jalur klik — ghost tetap berdiri meski gagal flip
  }
  return ghost;
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
    // ⚠️ bake dipanggil PEMANGGIL paling akhir (lihat catatan applyMirrorGlassAxis).
  } catch (e) {
    // Jangan pernah crash jalur klik — ghost tetap berdiri meski gagal flip
  }
  return ghost;
}
