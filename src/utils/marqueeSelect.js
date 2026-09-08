/**
 * ================================================================
 * marqueeSelect.js — Phase 53 (2026-09-07)
 * ================================================================
 *
 * TUJUAN (permintaan user — keluarga 5 tool move/rotate/scale/clone/mirror)
 * "Select Box": seleksi kotak (marquee) ala desktop — klik kiri TAHAN lalu
 * geser → muncul kotak transparan; SEMUA block yang proyeksinya di layar
 * kena kotak itu langsung terpilih banyak, SEKALIPUN jaraknya sangat jauh
 * di dunia 3D. Aktif hanya jika opsi "Select Box" di panel Gizmo Options
 * tercentang; kotak wajib TRANSPARAN supaya block di belakangnya kelihatan.
 * Warna kotak per-tool: move #0047AB, rotate #32CD32, scale #EFBF04,
 * clone #0096FF, mirror #9D00FF.
 *
 * KENAPA SELEKSI DI RUANG LAYAR, BUKAN RUANG DUNIA
 * User: "meskipun jaraknya sangat jauh, selama di layar blocknya kena
 * kotak select box maka terpilih". Itu definisi seleksi ruang-layar
 * (screen-space): yang dihitung adalah PROYEKSI 2D block pada layar,
 * bukan kedalaman/jarak. Block di belakang kamera otomatis ter-exclude
 * karena proyeksi w-proyektornya negatif.
 *
 * CARA KERJA (aman, tanpa menyentuh apa pun yang sudah jalan)
 * 1. Ambil bounding box DUNIA tiap block (Box3.setFromObject — akurat
 *    untuk block berotasi/skala dan mesh import glb yang nested).
 * 2. Proyeksikan 8 sudut bbox ke koordinat layar (project → NDC → pixel).
 *    Sudut dengan w negatif (di belakang kamera) dibuang — mencegah
 *    'wrap-around' proyeksi yang membuat box raksasa palsu.
 * 3. Hitung bbox layar (min/max x,y) dari sudut-sudut yang valid.
 * 4. Block terpilih jika bbox layarnya OVERLAP dengan rect marquee
 *    (rect dinormalisasi dulu — drag boleh ke arah mana pun).
 * 5. Kembalikan array block terpilih — pemanggil yang menentukan
 *    selectBlock/highlight/gizmo (integrasi memakai fungsi selection
 *    yang sudah ada; modul ini TIDAK menyentuh scene/gizmo sama sekali).
 *
 * Fungsi ini MURNI (pure): tidak membuat/menghapus mesh, tidak memanggil
 * renderer, tidak menyimpan state — gampang dites tanpa browser,
 * tidak ada efek samping ke fitur lain.
 * ================================================================
 */

import * as THREE from 'three';

// Objek scrap — dialokasi sekali, dipakai ulang (tanpa GC pressure).
const _box = new THREE.Box3();
const _v = new THREE.Vector3();
const _proj = new THREE.Vector3();
const _viewVec = new THREE.Vector3();

/**
 * Normalisasi rect marquee (drag bisa ke arah negatif).
 * @param {{x:number,y:number,w:number,h:number}} rect
 * @returns {{x0:number,y0:number,x1:number,y1:number}} rect ternormalisasi
 */
export function normalizeRect(rect) {
  const x0 = Math.min(rect.x, rect.x + rect.w);
  const y0 = Math.min(rect.y, rect.y + rect.h);
  const x1 = Math.max(rect.x, rect.x + rect.w);
  const y1 = Math.max(rect.y, rect.y + rect.h);
  return { x0, y0, x1, y1 };
}

/**
 * Menghitung bounding box layar (pixel) dari sebuah block.
 * Sudut bbox yang berada di belakang kamera (w < 0) dibuang supaya
 * proyeksinya tidak 'terbalik' menjadi box raksasa palsu.
 *
 * @param {THREE.Object3D} block
 * @param {THREE.Camera} camera
 * @param {number} viewW lebar viewport (pixel)
 * @param {number} viewH tinggi viewport (pixel)
 * @returns {{x0:number,y0:number,x1:number,y1:number}|null} null kalau
 *   seluruh block di belakang kamera / bbox tak terhitung
 */
export function getScreenBox(block, camera, viewW, viewH) {
  if (!block) return null;
  try {
    _box.setFromObject(block);
    if (_box.isEmpty()) return null;

    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    let anyValid = false;

    // 8 sudut bbox dunia
    for (let i = 0; i < 8; i++) {
      _v.set(
        (i & 1) ? _box.max.x : _box.min.x,
        (i & 2) ? _box.max.y : _box.min.y,
        (i & 4) ? _box.max.z : _box.min.z,
      );
      // ── GUARD VIEW-SPACE (terukur): titik di belakang kamera menghasilkan
      // view-space z > 0 (kamera Three.js menghadap -z). Proyeksinya NDC
      // bisa "sah-looking" (z NDC > 1) tapi palsu — WAJIB dibuang di sini,
      // sebelum project(), supaya bbox layar tidak meledak raksasa.
      // Terukur: depan → viewZ negatif (z NDC < 1); belakang → viewZ positif.
      _viewVec.copy(_v);
      _viewVec.applyMatrix4(camera.matrixWorldInverse);
      if (_viewVec.z > 0) continue; // di belakang kamera → buang sudut ini

      _proj.copy(_v);
      _proj.project(camera);
      if (!Number.isFinite(_proj.x) || !Number.isFinite(_proj.y)) continue;

      const px = (_proj.x * 0.5 + 0.5) * viewW;
      const py = (1 - (_proj.y * 0.5 + 0.5)) * viewH;
      if (px < x0) x0 = px;
      if (px > x1) x1 = px;
      if (py < y0) y0 = py;
      if (py > y1) y1 = py;
      anyValid = true;
    }
    return anyValid ? { x0, y0, x1, y1 } : null;
  } catch (e) {
    return null; // block rusak → anggap tak terpilih (jangan crash drag)
  }
}

/**
 * Mengembalikan semua block yang proyeksi layarnya overlap dengan rect
 * marquee. MURNI — tanpa efek samping.
 *
 * @param {THREE.Object3D[]} blocks daftar block kandidat
 * @param {THREE.Camera} camera kamera aktif
 * @param {{x:number,y:number,w:number,h:number}} rect marquee (pixel)
 * @param {number} viewW lebar viewport
 * @param {number} viewH tinggi viewport
 * @returns {THREE.Object3D[]} block terpilih (urutan input dipertahankan)
 */
export function getBlocksInScreenRect(blocks, camera, rect, viewW, viewH) {
  if (!blocks || !camera || !rect) return [];
  const { x0, y0, x1, y1 } = normalizeRect(rect);
  const out = [];
  for (const block of blocks) {
    if (!block || !block.parent) continue; // sudah dihapus/dibuang → skip
    const sb = getScreenBox(block, camera, viewW, viewH);
    if (!sb) continue;
    // overlap test rect-rect standar
    if (sb.x0 <= x1 && sb.x1 >= x0 && sb.y0 <= y1 && sb.y1 >= y0) {
      out.push(block);
    }
  }
  return out;
}

/**
 * Warna marquee per tool — sesuai permintaan user:
 * move #0044E0 (biru TUA tapi VIVID/"ngejrenk" — v3 2026-09-07: #00308F
 *   terasa redup/kusam karena channel birunya cuma 143; user minta tetap
 *   biru tua TAPI menyala. #0044E0 = HSL(222°,100%,44%): channel B 224
 *   (jenuh penuh) + hijau rendah → listrik tapi masih jelas lebih tua
 *   dari clone #0096FF yang sky-bright),
 * rotate #32CD32, scale #EFBF04,
 * clone #0096FF (warna gizmo clone), mirror #9D00FF (warna gizmo mirror).
 */
export const MARQUEE_COLOR_BY_TOOL = {
  move: '#0044E0',
  rotate: '#32CD32',
  scale: '#EFBF04',
  clone: '#0096FF',
  mirror: '#9D00FF',
};

// ══════════════════════════════════════════════════════════════════════
// Phase 55 v2 (2026-09-07): PINCH SELECT BOX — MOBILE ONLY, direct-tracking.
// User tidak punya mouse di mobile → pengganti drag marquee:
//   • Zoom-OUT 2 jari (jari MENJAUH) saat tool keluarga-5 + checkbox
//     Select Box tercentang → kotak MUNCUL SEKETIKA.
//   • Setelah kotak aktif: ukuran = UKURAN AWAL × (jarak jari SEKARANG /
//     jarak jari AWAL) — DIRECT TRACKING, sama rasa pinch zoom kamera.
//     v1 lama pakai perkalian per-event (1+delta/prev) → "berat, harus
//     usaha ekstra di jari" (keluhan user). Direct tracking = instan.
//   • Kalau belum ada kotak lalu user zoom-IN (mencubit) duluan →
//     kotak TIDAK muncul — hanya zoom kamera biasa.
//   • Checkbox OFF atau tool non-keluarga → pinch hanya kamera.
//
// state (persist antar touchmove oleh pemanggil):
//   { active: boolean, anchorDist: number } — anchorDist = jarak 2 jari
//   saat gesture dimulai (atau saat kotak diaktifkan), basis perhitungan.
// ══════════════════════════════════════════════════════════════════════

const PINCH_EPS = 3; // px — delta di bawah ini dianggap diam (anti getar)

/**
 * Evaluasi satu langkah pinch (touchmove) untuk fitur Select Box mobile.
 * scale = dist / anchorDist — UKURAN LANGSUNG (bukan pertumbuhan bertahap),
 * jadi lompatan jari sebesar apa pun langsung tercermin di kotak.
 */
export function evaluatePinchSelectBox(state, p) {
  const { dist, prevDist, tool, checked } = p;
  const inFamily5 = tool === 'move' || tool === 'rotate' || tool === 'scale'
    || tool === 'clone' || tool === 'mirror';

  // Syarat pakai (sama dengan engine mouse): keluarga-5 + tercentang.
  if (!inFamily5 || !checked) {
    return { boxVisible: false, scale: 1, cameraOnly: true, activated: false };
  }

  const delta = dist - prevDist;

  // Kotak BELUM aktif:
  //   - zoom-IN duluan → kamera saja (kotak tak boleh muncul).
  //   - zoom-OUT (delta > EPS) → kotak MUNCUL. anchorDist TIDAK direset
  //     (tetap = jarak AWAL gesture dari touchstart) supaya scale
  //     langsung proporsional: dist/anchorDist — user merasa kotak
  //     mengikuti jari 1:1 sejak kemunculannya (anti-"berat").
  if (!state.active) {
    if (delta > PINCH_EPS) {
      state.active = true;
      // scale saat aktivasi = dist/anchorDist supaya pemanggil langsung
      // bisa render ukuran proporsional di event PERTAMA ini.
      return { boxVisible: true, scale: dist / Math.max(state.anchorDist, 1), cameraOnly: false, activated: true };
    }
    return { boxVisible: false, scale: 1, cameraOnly: true, activated: false };
  }

  // Kotak aktif: scale LANGSUNG = dist / anchorDist (direct tracking).
  // Geser midpoint ditangani pemanggil (kotak SELALU di tengah 2 jari).
  const scale = dist / Math.max(state.anchorDist, 1);
  return { boxVisible: true, scale, cameraOnly: false, activated: false };
}

export default getBlocksInScreenRect;
