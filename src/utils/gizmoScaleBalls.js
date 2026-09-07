/**
 * ================================================================
 * gizmoScaleBalls.js — Phase 51 (2026-09-07)
 * ================================================================
 *
 * TUJUAN (permintaan user "tier very hard" dari notepad lama)
 * Rombak total tampilan gizmo Scale:
 *   SEBELUM (bawaan Three.js, jadul):
 *     - 6 KOTAK kecil (scaleHandleGeometry BoxGeometry 0.08) di ujung
 *       sumbu ±0.54
 *     - 3 GARIS shaft (CylinderGeometry tipis) yang CUMA ada di sisi
 *       positif (+0.25) — sisi negatif tidak digambar
 *     - 3 kotak plane XY/YZ/XZ + 1 kotak kecil XYZ di tengah
 *   SESUDAH:
 *     - HANYA 6 BOLA (SphereGeometry 0.075) di ±0.5 tiap sumbu —
 *       PERSIS seperti bola gizmo rotate (Phase 50), TETAPI TANPA
 *       cincin/garis penghubung apa pun.
 *     - Semua bola WAJIB warna #EFBF04 (kuning special user).
 *     - SOLO DRAG: klik-tahan 1 bola → 5 bola lain sembunyi sementara,
 *       hanya bola yang digenggam yang tampil; dilepas → 6 bola
 *       muncul lagi segera. (Pola sama dengan Phase 49 v11 Move.)
 *
 * KENAPA BANYAK AI GAGAL DI SINI (jebakan yang SUDAH diuji sebelumnya)
 * 1) handle.position DITIMPA worldPosition TIAP FRAME (baris 1613) →
 *    posisi bola WAJIB di-BAKE ke geometry lewat geometry.translate(),
 *    bukan mesh.position. (Sama seperti Phase 49 v9 / kontrak jebakan #1.)
 * 2) handle.visible = true DIPAKSA TIAP FRAME (baris 1611) → menyembunyikan
 *    bola saat solo drag WAJIB dilakukan SETELAH fungsi asli jalan,
 *    lewat pembungkusan _gizmo.updateMatrixWorld (chain, bukan timpa).
 * 3) Mode scale DIPAKSA space='local' oleh updateMatrixWorld (baris 1585:
 *    `const space = (this.mode === 'scale') ? 'local' : this.space;`)
 *    walau tc.space = 'world'. Konsekuensi: quaternion gizmo = worldQuaternion
 *    object → deteksi SISI bola dari pointStart (world space) WAJIB
 *    di-un-rotate dengan inverse worldQuaternion DULU. (Phase 49 v11
 *    hanya un-rotate saat space==='local'; untuk scale un-rotate SELALU.)
 * 4) setupGizmo() mem-bake rotasi ke geometry → klasifikasi sisi bola
 *    WAJIB dari bounding box geometry (tanda center pada SUMBU HANDLE
 *    bola itu), bukan dari mesh.position (yang selalu 0,0,0) ataupun
 *    tinggi-Y.
 * 5) material._color dicache saat frame pertama (baris 1874) dan warna
 *    material.color ditimpa balik dari cache tiap frame. Material bola
 *    scale dibuat BARU (bukan share materialLib) supaya:
 *      - warna #EFBF04 TID ikut berubah oleh setColors() clone/mirror
 *        (setGizmoColor merubah materialLib — bola scale kebal),
 *      - highlight hover tetap bekerja (baris 1884 men-copy
 *        materialLib.active ke bola yang di-hover → kuning saat idle).
 * 6) Picker scale TIDAK disentuh sama sekali. Picker cone ±0.3
 *    (panjang 0.6) sudah menjangkau bola di ±0.5 → klik bola tetap
 *    menghasilkan axis yang benar tanpa picker tambahan (pelajaran
 *    Phase 50: "sudah diuji 3 ukuran, tidak membaik").
 * 7) Wrapper updateMatrixWorld harus CHAIN: saat modul ini dipasang,
 *    _gizmo.updateMatrixWorld sudah dibungkus enableSoloDragArrow
 *    (translate) dan restyleRotateGizmo (rotate). Modul ini membungkus
 *    yang TERAKHIR dan selalu memanggil fungsi sebelumnya dulu →
 *    ketiganya hidup berdampingan.
 *
 * CATATAN KEAMANAN
 * - Hanya menyentuh _gizmo.gizmo.scale (visual) + _gizmo.helper.scale
 *   (garis putih). Picker, mode translate, mode rotate tidak tersentuh.
 * - Idempoten lewat penanda userData; dispose() memulihkan handle asli.
 * - Semua dibungkus try/catch oleh pemanggil (init scene tak boleh gagal).
 * ================================================================
 */

import * as THREE from 'three';

/** Penanda idempoten pada gizmo scale. */
const SCALE_MARK = '__scaleBallsP51';

/** Wajib: semua bola satu warna ini (permintaan user). */
const BALL_COLOR = '#EFBF04';

/** Radius bola — persis sama dengan bola rotate (SphereGeometry(0.075,16,12)). */
const BALL_RADIUS = 0.075;

/** Jarak bola dari pusat gizmo — sama dengan radius cincin rotate. */
const BALL_DIST = 0.5;

/** Arah unit per sumbu. */
const UNIT = {
  X: new THREE.Vector3(1, 0, 0),
  Y: new THREE.Vector3(0, 1, 0),
  Z: new THREE.Vector3(0, 0, 1),
};

/** Nama properti sumbu pada Vector3/Box3. */
const AXIS_KEY = { X: 'x', Y: 'y', Z: 'z' };

/** Toleransi tanda sisi (float). */
const SIDE_EPS = 1e-6;

// Objek sementara (tanpa alokasi per frame).
const _tmpVec = new THREE.Vector3();
const _tmpQuat = new THREE.Quaternion();

/**
 * Mencari Object3D gizmo scale dari sebuah TransformControls.
 * (Pola sama dengan findTranslateGizmo / findRotateGizmo.)
 *
 * @param {THREE.Controls} transformControls
 * @param {THREE.Object3D|null} helperRoot hasil transformControls.getHelper()
 * @returns {THREE.Object3D|null}
 */
export function findScaleGizmo(transformControls, helperRoot = null) {
  if (transformControls && transformControls._gizmo && transformControls._gizmo.gizmo) {
    const found = transformControls._gizmo.gizmo.scale;
    if (found) return found;
  }
  if (helperRoot && helperRoot.children) {
    for (const child of helperRoot.children) {
      if (child && child.gizmo && child.gizmo.scale) return child.gizmo.scale;
    }
  }
  const deepFind = (obj) => {
    if (!obj) return null;
    if (obj.gizmo && obj.gizmo.scale) return obj.gizmo.scale;
    if (obj.children) {
      for (const c of obj.children) {
        const hit = deepFind(c);
        if (hit) return hit;
      }
    }
    return null;
  };
  return deepFind(helperRoot) || deepFind(transformControls && transformControls._root);
}

/**
 * Menentukan sisi (+1/-1) bola yang sedang di-drag dari `pointStart`.
 *
 * Mode scale SELALU local (dipaksa baris 1585 TransformControls), jadi
 * panah/bola mengikuti worldQuaternion object, sementara pointStart
 *(world space) tidak → WAJIB un-rotate dulu (lihat jebakan #3 header).
 *
 * @param {THREE.Controls} tc instance TransformControls
 * @param {string} axis 'X'|'Y'|'Z'
 * @returns {number} +1 sisi positif, -1 sisi negatif, 0 tak terdeteksi
 */
function detectDragSide(tc, axis) {
  const axisKey = AXIS_KEY[axis];
  if (!axisKey || !tc.pointStart) return 0;

  _tmpVec.copy(tc.pointStart);
  // Scale selalu local → un-rotate SELALU (beda dengan Move yang bersyarat).
  if (tc.worldQuaternion) {
    _tmpQuat.copy(tc.worldQuaternion).invert();
    _tmpVec.applyQuaternion(_tmpQuat);
  }
  const component = _tmpVec[axisKey];
  if (component > SIDE_EPS) return 1;
  if (component < -SIDE_EPS) return -1;
  return 0;
}

/**
 * Rombak gizmo Scale menjadi 6 bola #EFBF04 tanpa cincin/garis/kotak.
 *
 * @param {THREE.Controls} transformControls instance TransformControls
 * @param {THREE.Object3D|null} helperRoot hasil transformControls.getHelper()
 * @param {Object} [options]
 * @param {string} [options.color='#EFBF04'] warna bola
 * @param {number} [options.ballRadius=0.075] radius bola
 * @param {number} [options.distance=0.5] jarak bola dari pusat
 * @returns {{ ok: boolean, balls: string[], removed: number, hiddenHelpers: string[],
 *             dispose?: function, reason?: string, alreadyApplied?: boolean }}
 */
export function restyleScaleGizmoBalls(transformControls, helperRoot = null, options = {}) {
  const {
    color = BALL_COLOR,
    ballRadius = BALL_RADIUS,
    distance = BALL_DIST,
  } = options;

  const scaleObj = findScaleGizmo(transformControls, helperRoot);
  if (!scaleObj) {
    return { ok: false, balls: [], removed: 0, hiddenHelpers: [], reason: 'gizmo scale tidak ditemukan' };
  }

  // Idempoten: jangan pasang dua kali.
  if (scaleObj.userData[SCALE_MARK]) {
    return {
      ok: true, alreadyApplied: true, balls: [], removed: 0, hiddenHelpers: [],
      dispose: scaleObj.userData[SCALE_MARK].dispose,
    };
  }

  const gizmoRoot = transformControls && transformControls._gizmo;
  if (!gizmoRoot || typeof gizmoRoot.updateMatrixWorld !== 'function') {
    return { ok: false, balls: [], removed: 0, hiddenHelpers: [], reason: 'TransformControlsGizmo tidak ditemukan' };
  }

  // ── 1. Simpan & lepas SEMUA handle visual scale lama ──
  // Isinya: 6 kotak ujung + 3 garis shaft + 3 kotak plane + 1 kotak XYZ.
  // Semua dilepas (user: "hanya 6 bola bola saja"), disimpan untuk dispose().
  const removedHandles = [...scaleObj.children];
  for (const handle of removedHandles) scaleObj.remove(handle);

  // ── 2. Hapus garis bantu putih helper.scale ──
  // (Pola hideTranslateHelperLines Phase 49 v10: geometry unik per handle
  //  boleh di-dispose; material matHelper SHARED antar mode — JANGAN dispose.)
  const helperScale = gizmoRoot.helper && gizmoRoot.helper.scale;
  const hiddenHelpers = [];
  if (helperScale) {
    for (const child of [...helperScale.children]) {
      helperScale.remove(child);
      if (child.geometry) child.geometry.dispose();
      hiddenHelpers.push(child.name);
    }
  }

  // ── 3. Buat 6 bola #EFBF04, posisi di-BAKE ke geometry ──
  // Material: SATU material baru per sumbu (bukan share materialLib —
  // supaya kebal terhadap setColors() clone/mirror), di-share antar
  // bola + dan − sumbu yang sama agar highlight hover tetap sinkron.
  const ballMats = {};
  for (const axis of ['X', 'Y', 'Z']) {
    ballMats[axis] = new THREE.MeshBasicMaterial({
      depthTest: false,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      transparent: true,
      opacity: 1,
    });
    ballMats[axis].color.set(color);
  }

  const balls = [];
  const addedBalls = [];
  const sideOfBall = new Map(); // mesh → +1/-1

  for (const axis of ['X', 'Y', 'Z']) {
    for (const sign of [1, -1]) {
      // JEBAKAN #1: position ditimpa tiap frame → bake ke geometry.
      const geo = new THREE.SphereGeometry(ballRadius, 16, 12);
      geo.translate(
        UNIT[axis].x * sign * distance,
        UNIT[axis].y * sign * distance,
        UNIT[axis].z * sign * distance,
      );
      geo.computeBoundingBox();
      geo.computeBoundingSphere();

      const ball = new THREE.Mesh(geo, ballMats[axis]);
      ball.name = axis;              // wajib: highlight, showX/Y/Z, hide-facing-camera
      ball.renderOrder = Infinity;   // sama seperti setupGizmo()
      ball.userData[SCALE_MARK] = true;
      scaleObj.add(ball);
      addedBalls.push(ball);
      sideOfBall.set(ball, sign);
      balls.push(`${axis}${sign > 0 ? '+' : '-'}`);
    }
  }

  // ── 4. SOLO DRAG via wrapper CHAIN pada updateMatrixWorld ──
  // (JEBAKAN #2: visible dipaksa true tiap frame → sembunyikan SETELAH
  //  fungsi asli; chain dengan wrapper rotate/six-arrows yang sudah ada.)
  const originalUpdate = gizmoRoot.updateMatrixWorld;

  gizmoRoot.updateMatrixWorld = function (force) {
    // Jalankan rantai sebelumnya dulu (rotate wrapper → solo arrow → asli).
    originalUpdate.call(this, force);

    // Solo hanya untuk mode scale + sedang drag sumbu tunggal.
    if (this.mode !== 'scale') return;
    if (!transformControls.dragging) return;
    const axis = transformControls.axis;
    if (!AXIS_KEY[axis]) return; // XYZ / XY / YZ / XZ → tidak di-solo

    const side = detectDragSide(transformControls, axis);
    if (side === 0) return; // sisi tak jelas → jangan sembunyikan apa pun

    for (const ball of addedBalls) {
      if (ball.name !== axis || sideOfBall.get(ball) !== side) {
        ball.visible = false;
      }
    }
  };

  const dispose = () => {
    // Lepas wrapper dulu (LIFO terhadap pemasangan).
    if (gizmoRoot.updateMatrixWorld !== originalUpdate) {
      gizmoRoot.updateMatrixWorld = originalUpdate;
    }
    // Hapus bola buatan + material + geometry-nya.
    for (const ball of addedBalls) {
      scaleObj.remove(ball);
      if (ball.geometry) ball.geometry.dispose();
    }
    for (const axis of ['X', 'Y', 'Z']) {
      if (ballMats[axis]) ballMats[axis].dispose();
    }
    // Pulihkan handle visual asli (kotak/garis/plane/XYZ).
    for (const handle of removedHandles) {
      scaleObj.add(handle);
    }
    delete scaleObj.userData[SCALE_MARK];
  };

  scaleObj.userData[SCALE_MARK] = { dispose };
  return { ok: true, balls, removed: removedHandles.length, hiddenHelpers, dispose };
}

export default restyleScaleGizmoBalls;
