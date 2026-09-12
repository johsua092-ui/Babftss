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

/** Penanda bola buatan modul ini (dipakai wrapper + tes). */
export const BALL_MARK_NAME = '__scaleBallsP51';

/**
 * Flag mode "world align" (Phase 52 — checkbox "arrow match rotation").
 * false → bola TEGAK LURUS dunia (uncheck), true → ikut sisi block (check).
 * Disimpan per-instance TransformControls; default = true (tercentang).
 */
const worldAlignByTc = new WeakMap();

/**
 * Mengatur mode align bola scale + ruang gizmo untuk 5 tool transform.
 *
 * Mode scale DIPAKSA space='local' oleh TransformControls (baris 1585) —
 * jadi untuk membuat bola scale TEGAK LURUS dunia (uncheck), visualnya
 * harus di-OVERRIDE di wrapper modul ini (identitas), dan deteksi sisi
 * solo drag TIDAK boleh un-rotate pointStart.
 * Untuk move/rotate, pemanggil cukup set tc.space ('local'/'world') —
 * perilaku bawaan Three.js + wrapper rotate sudah dinamis (terukur).
 *
 * @param {THREE.Controls} transformControls
 * @param {boolean} match true = ikut sisi block (checkbox tercentang),
 *                        false = tegak lurus dunia (checkbox kosong)
 * @returns {{ ok: boolean, match: boolean, reason?: string }}
 */
export function setScaleWorldAlign(transformControls, match) {
  if (!transformControls) return { ok: false, match: undefined, reason: 'TransformControls tidak ada' };
  try {
    worldAlignByTc.set(transformControls, !!match);
    return { ok: true, match: !!match };
  } catch (e) {
    return { ok: false, match: undefined, reason: e.message };
  }
}

/**
 * Membaca mode align saat ini (default true = tercentang).
 * @param {THREE.Controls} transformControls
 * @returns {boolean}
 */
export function getScaleWorldAlign(transformControls) {
  const v = worldAlignByTc.get(transformControls);
  return v === undefined ? true : v;
}

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
  // PENGECUALIAN Phase 52: saat mode world-align (checkbox kosong), bola
  // TEGAK LURUS dunia → pointStart world TIDAK boleh un-rotate.
  if (tc.worldQuaternion && getScaleWorldAlign(tc) !== false) {
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

    // PHASE 52 — mode world-align (checkbox "arrow match rotation" kosong):
    // Three.js memaksa scale selalu local (baris 1585) sehingga bola ikut
    // worldQuaternion block. Override visual SETELAH fungsi asli (pola
    // Phase 50 wrapper rotate): kunci quaternion bola ke IDENTITAS agar
    // TEGAK LURUS dunia meski block miring. matrixWorld anak tidak otomatis
    // ter-update (super sudah jalan di akhir fungsi asli baris 1902) →
    // panggil scaleObj.updateMatrixWorld(true) untuk memaksa hitung ulang.
    if (this.mode === 'scale' && getScaleWorldAlign(transformControls) === false) {
      for (const ball of addedBalls) {
        ball.quaternion.identity();
      }
      scaleObj.updateMatrixWorld(true);
    }

    // PHASE 68 (user 2026-09-11, "gizmo bola bergerak seiring scale
    // memanjang — jangan diam 1 tempat"): fungsi asli men-set
    // handle.position = worldPosition (pusat block) + scale flat tiap
    // frame (baris 1613/1624) → bola bake ±0.5 TAMPK DIAM saat block
    // memanjang. Fix: SETELAH fungsi asli (pola Phase 52 quaternion
    // identity — terbukti jalan), geser tiap bola ke TEPI block via
    // offset = arah sumbu × sign × worldScale sumbu itu. worldScale
    // live di controls._worldScale (baris 1143, ter-update tiap frame).
    // Bola TETAP BULAT: scale seragam, hanya position yang digeser —
    // tidak melar. Radius visual tetap konsisten dengan kamera.
    if (this.mode === 'scale' && transformControls.object) {
      const ws = transformControls._worldScale;
      if (ws) {
        for (const ball of addedBalls) {
          const axis = ball.name;                      // 'X'|'Y'|'Z'
          const sign = sideOfBall.get(ball);            // +1|-1
          const wsv = AXIS_KEY[axis] ? Math.abs(ws[AXIS_KEY[axis]]) || 1 : 1;
          // Fungsi asli sudah men-set ball.position = worldPosition (pusat)
          // dan ball.scale = factor-kamera × size/4 (baris 1624). Bake geometry
          // ±distance IKUT di-scale handle → world offset bake =
          // distance × factor. Tepi block = distance × wsv (half-block × scale).
          // Offset position (local, TIDAK ikut factor) yang benar:
          //   tepi − bakeWorld = distance×wsv − distance×factor
          //                    = distance × (wsv − factor)
          // dengan factor = ball.scale.x (baru diset fungsi asli, seragam).
          // Tanpa ini bola OVERSHOOT melewati tepi (terukur: scale-4 → bola
          // di 2.53 padahal tepi 2.0, factor 2.057).
          const factor = ball.scale.x || 1;
          const off = distance * (wsv - factor);
          ball.position.x += UNIT[axis].x * sign * off;
          ball.position.y += UNIT[axis].y * sign * off;
          ball.position.z += UNIT[axis].z * sign * off;
        }
        // Matrix anak tidak ter-update otomatis (super sudah jalan di
        // akhir fungsi asli) — paksa hitung ulang (pola Phase 52).
        scaleObj.updateMatrixWorld(true);
      }
    }

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
