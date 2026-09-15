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
import { attachCrystalCore, attachGemOverlay, applyOrbHover } from './ballCenterDesign.js';

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

// ── FIX v13 (user 2026-09-14: "klik bola bawah malah yang atas aktif;
//    drag ke atas malah scale ke bawah — super licin / berat / melawan") ──
/** State drag screen-space per-instance (WeakMap — tidak bocor memori).
 *  Dipakai saat bidang drag library DEGENERATE (sumbu hampir sejajar kamera). */
const dragScreenByTc = new WeakMap();
/** Bola yang DIGENGGAM saat pointerDown — sumber sisi solo paling andal
 *  (titik potong bidang bisa flip tanda di elevasi tinggi / pointStart
 *  BASI saat plane-raycast gagal — library hanya set pointStart di dalam
 *  `if (planeIntersect)`, baris 489-502). */
const grabbedBallByTc = new WeakMap();
/** Sumbu DEGENERATE saat |axisWorld·eye| > ini. Terukur probe elevasi:
 *  45° (dot 0.71) sehat; 60° (0.87) Y− rasio 5.5; 75° → 23; 80° → −102
 *  (plane hampir sejajar ray → 1px pointer = titik potong meluncur
 *  puluhan unit → rasio meledak/flip). 0.80 ≈ elevasi 53°. */
const AXIS_EYE_DEGENERATE = 0.80;
/** Batas ratio screen-space (anti ledakan d0 ekstrem kecil). */
const SCREEN_RATIO_MAX = 60;
/** Sama dgn clamp app Phase 67. */
const SCALE_MIN_ABS = 0.05;

// Objek sementara (tanpa alokasi per frame).
const _tmpVec = new THREE.Vector3();
const _tmpQuat = new THREE.Quaternion();
// Phase 70 v6: scratch utk offset sumbu-block (bug posisi bola saat rotate)
const _tmpAxisVec = new THREE.Vector3();
const _identityQuat = new THREE.Quaternion();

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
      ball.renderOrder = 1000;   // Phase 69 v2: < sprite kristal (1001) supaya kristal tampak DI ATAS bola
      ball.userData[SCALE_MARK] = true;
      scaleObj.add(ball);
      addedBalls.push(ball);
      sideOfBall.set(ball, sign);
      // Phase 69 v3 (bandingkan/contoh_benar.png): PERMATA GLOW — mesh
      // jadi backdrop gelap (×0.18) + sprite radial additive identitas
      // (1001) + kristal kecil 17% (1002). identColor WAJIB eksplisit:
      // material bola SHARE antar pasangan ± — attachGemOverlay tidak
      // boleh membaca color material (bug: bola kedua baca warna gelap).
      attachGemOverlay(ball, ballRadius, color);
      attachCrystalCore(ball, ballRadius);
      balls.push(`${axis}${sign > 0 ? '+' : '-'}`);
    }
  }

  // ── 3b. FIX BUG B: map PICKER cone senama (hitbox klik harus ikut bola) ──
  // Picker scale = 2 cone tak terlihat per sumbu (bake ±0.3 ke geometry,
  // setupGizmo — nama object tetap 'X'/'Y'/'Z'). Tanpa digeser, klik tetap
  // di area LAMA dekat pusat (bug user: "visual doang yang bergerak,
  // kursor ke pusat block mendadak bisa klik").
  const pickerRoot = (transformControls && transformControls._gizmo
    && transformControls._gizmo.picker && transformControls._gizmo.picker.scale) || null;
  const pickersByAxisSign = new Map(); // `${axis}${sign}` → cone mesh
  if (pickerRoot) {
    for (const cone of pickerRoot.children) {
      if (!cone || !cone.geometry || !AXIS_KEY[cone.name]) continue;
      if (!cone.geometry.boundingBox) cone.geometry.computeBoundingBox();
      const bb = cone.geometry.boundingBox;
      const centerOnAxis = (bb.max[AXIS_KEY[cone.name]] + bb.min[AXIS_KEY[cone.name]]) / 2;
      const sign = centerOnAxis >= 0 ? 1 : -1;
      pickersByAxisSign.set(`${cone.name}${sign}`, cone);
    }
  }

  /**
   * Cari picker cone untuk bola (axis, sign) tertentu.
   * @returns {THREE.Mesh|null}
   */
  function findPickerFor(map, axis, sign) {
    return map.get(`${axis}${sign}`) || null;
  }

  // ── 4. SOLO DRAG via wrapper CHAIN pada updateMatrixWorld ──
  // (JEBAKAN #2: visible dipaksa true tiap frame → sembunyikan SETELAH
  //  fungsi asli; chain dengan wrapper rotate/six-arrows yang sudah ada.)
  const originalUpdate = gizmoRoot.updateMatrixWorld;

  gizmoRoot.updateMatrixWorld = function (force) {
    // Jalankan rantai sebelumnya dulu (rotate wrapper → solo arrow → asli).
    originalUpdate.call(this, force);

    // HOVER-KUNING ORB (user 2026-09-13): bola yang di-hover jadi kuning —
    // orb-nya sendiri (material unik per bola), bukan mesh backdrop yang
    // kini tak dirender. Setelah fungsi asli (axis sudah di-update library).
    applyOrbHover(addedBalls, transformControls.axis, transformControls.dragging);

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
          // PHASE 68 v2 (user 2026-09-11: "bola kedeketan, seperti menyatu
          // di dalam sisi — harus TEPAT DI DEPAN sisi!"): tambah GAP margin
          // di luar tepi supaya bola melayang DI DEPAN permukaan sisi,
          // bukan menempel/numpuk. Gap konsisten visual = gap unit lokal
          // × factor kamera (seragam di semua ukuran & zoom).
          // Factor kamera: HATI-HATI — bola yang DI-HIDE oleh AXIS_HIDE
          // punya scale 1e-10 (fungsi asli men-set saat hide). Ambil factor
          // dari bola pertama yang TIDAK di-hide (selalu ada ≥4 bola yang
          // menghadap non-kamera; worst case fallback hitung ulang).
          let factor = ball.scale.x;
          if (!factor || factor < 1e-4) {
            const healthy = addedBalls.find(b => b.scale.x > 1e-4);
            factor = healthy ? healthy.scale.x : 1;
          }
          // FIX v11 (user 2026-09-13: "KADANG scale berhasil, KADANG
          // hitbox LENYAP tak bisa diklik padahal visual aman"):
          // BALL_GAP/factor MELEDAK saat block di-scale MENGECIL —
          // factor kamera ∝ size block: size 0.2 → off 6 unit; 0.05 →
          // 22.5; 0.01 → 110 (terukur simulasi) → bola & PICKER CONE
          // terlempar jauh dari block → hitbox lepas dari tempat klik.
          // "Kadang" = hanya saat hasil scale mengecil cukup jauh.
          // FIX: clamp factor minimum — gap tidak pernah meledak;
          // di bawah clamp, gap dibiarkan membesar alami (visual tetap
          // wajar karena bola ikut mengecil di layar).
          const factorSafe = Math.max(factor, 0.35);
          const BALL_GAP = 0.55; // unit lokal — gap 3D simetris; perspektif kamera mempersempit sisi dekat jadi ~5px pada 0.35 → 0.55 agar gap visual cukup di semua sudut
          // Gap dikompensasi factor kamera (runtime terukur: tanpa /factor
          // err seragam 0.124 — bola sedikit overshoot; dgn /factor presisi)
          const off = distance * (wsv - factor) + (BALL_GAP / factorSafe);
          // FIX BUG POSISI-SAAT-ROTASI (user 2026-09-13: "block sudah
          // dirotasi ke segala arah & miring → posisi bola scale sangat
          // aneh & tidak masuk akal"): offset LAMA memakai UNIT[axis]
          // = SUMBU DUNIA, padahal mode scale dipaksa 'local' (library
          // baris 1585) — bake geometry bola ±distance ikut dirotasi
          // worldQuaternion block → offset dunia + bake miring = dua
          // frame referensi campur → bola nyasar + drift lateral
          // (RED terukur: err 0.21-0.39 unit, lateral sampai 0.73).
          // FIX v6: geser sepanjang SUMBU BLOCK di dunia.
          // FIX v10 (user 2026-09-13: "centang arrow match rotation
          // DICABUT → gizmo scale ikut kacau & TIDAK BISA DI-SCALE!
          // Padahal rotate/move aman di mode ini"): saat unchecked,
          // wrapper Phase 52 memaksa bola quaternion.identity() →
          // bake bola menunjuk SUMBU DUNIA → offset harus ikut frame
          // DUNIA. Offset block-axis (v6) = campur frame cermin.
          // SOLUSI: pilih frame referensi sesuai MODE:
          //   tercentang (align=true)  → axisLocal × worldQuaternion
          //   dicabut   (align=false) → axisLocal murni (sumbu dunia)
          // RED world-align: 4/6 bola err 0.24-0.30, lateral 0.56;
          //   picker cone ikut nyasar = hitbox lepas → "tidak bisa
          //   di-scale" (klik tak kena bola).
          const worldAlign = getScaleWorldAlign(transformControls);
          let axisWorld;
          if (worldAlign) {
            axisWorld = _tmpAxisVec.set(
              UNIT[axis].x, UNIT[axis].y, UNIT[axis].z,
            ).applyQuaternion(transformControls.worldQuaternion || _identityQuat);
          } else {
            axisWorld = _tmpAxisVec.set(
              UNIT[axis].x, UNIT[axis].y, UNIT[axis].z,
            );   // bola identity → sumbu dunia
          }
          ball.position.x += axisWorld.x * sign * off;
          ball.position.y += axisWorld.y * sign * off;
          ball.position.z += axisWorld.z * sign * off;

          // FIX BUG A (user 2026-09-11: "kamera tepat lurus di hadapan bola
          // → bola MENGHILANG"): fungsi asli AXIS_HIDE_THRESHOLD 0.99
          // (baris 1743) menyembunyikan handle yang sumbunya menghadap
          // kamera — warisan perilaku GARIS (panah tipis tak terlihat
          // dari ujung) yang TIDAK relevan untuk BOLA (terlihat dari
          // semua sudut). Setelah fungsi asli jalan: paksa bola kembali
          // TERLIHAT + scale dipulihkan (asli set 1e-10 saat hide).
          if (ball.visible === false) {
            ball.visible = true;
          }
          if (ball.scale.x < 1e-5) {
            // dipulihkan dari hide-scale — set ulang factor seragam
            ball.scale.set(factor, factor, factor);
          }

          // FIX BUG B (user 2026-09-11: "yang bergerak cuma VISUAL — klik
          // bola tak bisa, tapi kursor ke pusat block MENDADAK bisa!"):
          // picker cone (hitbox klik) bake ±0.3 DI GEOMETRY dan TIDAK ikut
          // digeser → klik tetap nempel area lama dekat pusat. Solusi:
          // geser picker cone YANG SENAMA (axis + sign) ke posisi bola.
          // Picker cone punya bake position ±0.3 (baris 1459-1474) —
          // offset picker = posisi bola baru − bake lama picker, tapi
          // posisi cone bake IKUT matrix... cone di-scale factor juga;
          // offset position yang benar = sama dengan offset bola
          // (cone bake 0.3 vs bola 0.5 beda basis → pakai offset final
          // bola sebagai target: posisi cone = posisi bola, karena
          // keduanya local-space gizmo & scale handle seragam).
          const pickerCone = findPickerFor(pickersByAxisSign, axis, sign);
          if (pickerCone) {
            // Cone bake ±0.3 di geometry, bola bake ±0.5 (distance). Agar
            // CENTER cone = CENTER bola (hitbox menutup bola persis):
            // center bola world = 0.5×f + off ; center cone = bakeEff×f + offC
            // → offC = off + (0.5 − bakeEff)×f. Konversi selisih bake WAJIB
            // ×factor karena bake di-scale factor-kamera di ruang dunia
            // (baris 1627 library: handle.scale = f×size/4). Mentah +0.2
            // hanya benar di f=1 — tidak pernah terjadi (f 1.6-8.7 terukur)
            // → cone tertinggal 0.2×(f−1) sepanjang sumbu = MENUMPUK DI
            // PUSAT block (RED probe A: cone 0.07 vs bola 0.64, klik X−
            // kena Z; G kamera jauh along 1.54).
            // v12: bakeEfektif cone = 0.3 × 0.3 (shrink) = 0.09 → offC
            // pakai (0.5−0.09)×f. Tanpa ini cone berselisih 0.21×f ke sisi
            // BERLAWANAN (terukur along −1.63 @f=7.76) — proximity picking
            // menutupi, tapi fallback raycast cone nyasar.
            const offC = off + (distance - 0.3 * 0.3) * factor;
            // FIX BUG FRAME-CONE (user 2026-09-14: "cuma 2 bola bisa
            // dipencet, sisanya visual doang — hitbox kabur"): saat checkbox
            // UNCHECKED, bola dipaksa quaternion.identity() (sumbu DUNIA)
            // oleh blok Phase 52 di atas — tapi cone TIDAK: fungsi asli
            // men-set cone.quaternion = worldQuaternion block tiap frame
            // (baris 1743) → bake cone miring di sumbu block, bola tegak
            // dunia = DUA frame campur → lateral terukur 0.82-2.26 unit
            // saat block dirotasi 45-60° (probe C/F/I: klik bola X+ kena
            // cone Z+ / XYZ sama sekali nyasar). Block dirotasi sekitar Y
            // → sumbu Y satu-satunya tak berubah → Y+ Y− tetap bisa diklik
            // = persis gejala "cuma 2 bola yang bisa dipencet".
            // FIX: kunci cone ke frame SAMA dgn bola — identity saat
            // unchecked (setelah fungsi asli, sebelum pickerRoot.
            // updateMatrixWorld(true) di bawah → matrix raycast ke-update).
            if (worldAlign === false) {
              pickerCone.quaternion.identity();
            }
            // Phase 70 v6: picker cone ikut SUMBU BLOCK (sinkron dgn bola —
            // warisan #27: geser visual wajib geser picker senama; cone bake
            // ±0.3 juga ikut rotasi local space)
            pickerCone.position.x += axisWorld.x * sign * offC;
            pickerCone.position.y += axisWorld.y * sign * offC;
            pickerCone.position.z += axisWorld.z * sign * offC;
            // FIX BUG A lanjutan: cone picker JUGA kena AXIS_HIDE di
            // fungsi asli (ikut loop handles) → klik bola sisi-dekat-
            // kamera TIDAK BISA. Pulihkan visible + scale cone senama.
            if (pickerCone.visible === false) pickerCone.visible = true;
            if (pickerCone.scale.x < 1e-5) pickerCone.scale.set(factor, factor, factor);
            // FIX v12 (user 2026-09-14: "cuma 2 bola bisa dipencet, sisanya
            // visual doang"): cone bawaan r0.2/bentang 0.6 di-scale factor
            // kamera = r1.55 unit / bentang 4.66 world saat f=7.76 (2.7×
            // radius bola!) — APEX-nya kini di sisi JAUH block (offset
            // Phase 68 menggeser cone keluar tepi), bagian tengah gemuk
            // menelan ray ke bola sisi lain: probe 2026-09-14 bidik X−
            // kena cone Z duluan (ray lewat (0,0.4,0.67), radius cone di
            // situ 0.81 > jarak 0.4). Dikecilkan ×0.3 → r0.47/bentang 1.4
            // ≈ inti bola; tepi bola yang lebih luas dilayani picking
            // proximity layar (lihat pointerHover override di bawah).
            pickerCone.scale.multiplyScalar(0.3);
          }
        }
        // Matrix anak tidak ter-update otomatis (super sudah jalan di
        // akhir fungsi asli) — paksa hitung ulang (pola Phase 52).
        scaleObj.updateMatrixWorld(true);
        // Picker juga harus di-update (matrix untuk raycast klik).
        if (pickerRoot) pickerRoot.updateMatrixWorld(true);
      }
    }

    // Solo hanya untuk mode scale + sedang drag sumbu tunggal.
    if (this.mode !== 'scale') return;
    if (!transformControls.dragging) return;
    const axis = transformControls.axis;
    if (!AXIS_KEY[axis]) return; // XYZ / XY / YZ / XZ → tidak di-solo

    // FIX v13: sisi solo dari BOLA YANG DIGENGGAM (pointerDown) — bukan
    // titik potong bidang (bisa flip tanda di elevasi tinggi: "klik bola
    // bawah malah yang atas yang tampil/solo"). Fallback detectDragSide
    // kalau bola tak terekam (drag via cone fallback).
    const grabbed = grabbedBallByTc.get(transformControls);
    const side = (grabbed && grabbed.name === axis)
      ? sideOfBall.get(grabbed)
      : detectDragSide(transformControls, axis);
    if (side === 0) return; // sisi tak jelas → jangan sembunyikan apa pun

    for (const ball of addedBalls) {
      if (ball.name !== axis || sideOfBall.get(ball) !== side) {
        ball.visible = false;
      }
    }
  };

  // ── 5. PICKING PROXIMITY LAYAR (FIX v12, user 2026-09-14: "cuma 2 bola
  //    bisa dipencet, sisanya visual doang — hitbox kabur") ──
  // Akar (probe matriks 9 skenario): cone bawaan di-scale factor kamera
  // MENELAN ray ke bola sisi lain (bidik X− kena Z duluan). Cone sudah
  // dikecilkan ×0.3, tapi itu saja belum cukup di semua sudut kamera:
  // ray ke CENTER bola sisi-jauh menembus 2-3 cone sisi-dekat di depannya.
  // Solusi POLA TERBUKTI gizmoRotateRings.findBallNearPointer (bola rotate
  // klik presisi 3 tahun jalan): setelah picker raycast bawaan,
  // proyeksikan 6 bola ke layar (NDC) — kalau pointer dekat bola yang USER
  // LIHAT (≤0.08 NDC ≈ 72px @900px), paksa axis = bola itu. Bola terlihat
  // = yang dipilih — hitbox cone hanya fallback untuk pointer di antara
  // bola dan pusat.
  const origHover = transformControls.pointerHover;
  const origDown = transformControls.pointerDown;

  /** Proyeksikan center bola ke NDC; bola terdekat pointer menang. */
  const findBallNearPointer = (pointer) => {
    if (!pointer) return null;
    scaleObj.updateMatrixWorld(true);
    let best = null;
    let bestD = Infinity;
    for (const ball of addedBalls) {
      if (!ball.geometry.boundingSphere) ball.geometry.computeBoundingSphere();
      const center = ball.geometry.boundingSphere.center.clone()
        .applyMatrix4(ball.matrixWorld).project(transformControls.camera);
      const d = Math.hypot(center.x - pointer.x, center.y - pointer.y);
      if (d < bestD) { bestD = d; best = ball; }
    }
    return (best && bestD < 0.08) ? best : null;
  };

  const proxHover = function (pointer) {
    origHover.call(this, pointer);
    if (this.mode !== 'scale' || this.dragging === true || pointer == null) return;
    if (this.object === undefined) return;
    const near = findBallNearPointer(pointer);
    if (near) this.axis = near.name;
  };

  const proxDown = function (pointer) {
    // Prioritas bola persis sebelum raycast _plane (axis harus final saat
    // pointerDown mulai drag — kalau cone fallback terpilih duluan, drag
    // sumbu salah).
    if (this.mode === 'scale' && this.dragging !== true && pointer != null &&
        this.object !== undefined) {
      const near = findBallNearPointer(pointer);
      if (near) this.axis = near.name;
    }
    return origDown.call(this, pointer);
  };

  transformControls.pointerHover = proxHover;
  transformControls.pointerDown = proxDown;

  // ── 5b. v13: hover/down mencatat bola yang digenggam + freeze referensi ──
  const proxHoverV13 = function (pointer) {
    proxHover.call(this, pointer);
    if (this.mode === 'scale' && this.dragging !== true && pointer != null) {
      this.__v13GrabbedBall = findBallNearPointer(pointer);
    } else {
      this.__v13GrabbedBall = null;
    }
  };

  const proxDownV13 = function (pointer) {
    proxDown.call(this, pointer);   // v12: paksa axis dari bola terdekat
    const near = this.__v13GrabbedBall || null;
    grabbedBallByTc.set(transformControls, near);
    dragScreenByTc.set(transformControls, null);
    try {
      if (near && transformControls.mode === 'scale' && transformControls.dragging === true &&
          AXIS_KEY[transformControls.axis] && transformControls.camera && transformControls.object) {
        const key = AXIS_KEY[transformControls.axis];
        // Snapshot sendiri (jebakan _scaleStart: library hanya mengisi
        // _scaleStart di dalam `if (planeIntersect)` L489-496 — saat bidang
        // degenerate raycast GAGAL → _scaleStart basi dari gesture lama →
        // scale lompat ke nilai gesture sebelumnya. Kita bekukan sendiri).
        const startScale = transformControls.object.scale[key];
        // arah sumbu bola di DUNIA — kolom matrixWorld bola (bake mengikuti)
        near.geometry.computeBoundingSphere();
        const axisWorld = new THREE.Vector3()
          .setFromMatrixColumn(near.matrixWorld, { X: 0, Y: 1, Z: 2 }[transformControls.axis]).normalize();
        const deg = Math.abs(axisWorld.dot(_tmpVec.copy(transformControls.eye).normalize()));
        if (deg > AXIS_EYE_DEGENERATE) {
          // SUMBU DEGENERATE (hampir sejajar kamera) → freeze referensi
          // RUANG LAYAR (warisan #46 — referensi gesture beku saat mulai):
          // axisProj = vektor pusat→bola di NDC; grabNdc = posisi pointer awal.
          scaleObj.updateMatrixWorld(true);
          const ballNdc = near.geometry.boundingSphere.center.clone()
            .applyMatrix4(near.matrixWorld).project(transformControls.camera);
          const ctrNdc = new THREE.Vector3().copy(transformControls.worldPosition)
            .project(transformControls.camera);
          const axisProj = new THREE.Vector2(ballNdc.x - ctrNdc.x, ballNdc.y - ctrNdc.y);
          const al0 = axisProj.length() || 1e-4;
          // ANCHOR stabil lintas-elevasi: sumbu Y ter-foreshorten parah di
          // elevasi tinggi (terukur 0.005 NDC @88° → drag 56px = ×33 LICIN)
          // — normalisasi ke sumbu LAIN yang melebar di layar (max antar 6
          // bola; di elevasi tinggi X/Z selalu panjang & jalurnya terukur
          // sehat). Di elevasi rendah max = al0 sendiri → rasa persis
          // jalur library sehat (25°: ×3.5 per 56px, terukur).
          let anchor = al0;
          for (const b of addedBalls) {
            if (!b.geometry.boundingSphere) b.geometry.computeBoundingSphere();
            const c = b.geometry.boundingSphere.center.clone()
              .applyMatrix4(b.matrixWorld).project(transformControls.camera);
            const len = Math.hypot(c.x - ctrNdc.x, c.y - ctrNdc.y);
            if (len > anchor) anchor = len;
          }
          dragScreenByTc.set(transformControls, {
            key, axisProj, al0, anchor, startScale,
            // jarak bertanda pointer awal sepanjang sumbu-layar (relatif pusat)
            along0: (pointer.x - ctrNdc.x) * axisProj.x / al0 + (pointer.y - ctrNdc.y) * axisProj.y / al0,
          });
        }
      }
    } catch (e) {
      dragScreenByTc.set(transformControls, null);
    }
  };
  // ── 5c. v13: pointerMove cabang RUANG LAYAR saat sumbu degenerate ──
  const origMove = transformControls.pointerMove;
  const moveHandler = function (pointer) {
    const st = dragScreenByTc.get(this);
    if (!(this.mode === 'scale' && this.dragging === true && st && pointer != null &&
          this.object && AXIS_KEY[this.axis])) {
      return origMove.call(this, pointer);   // jalur asli (sehat) — tak tersentuh
    }
    try {
      // proyeksi pusat block SEKARANG (tetap diam — pusat transform)
      const ctrNdc = new THREE.Vector3().copy(this.worldPosition).project(this.camera);
      const ux = st.axisProj.x / st.al0, uy = st.axisProj.y / st.al0;
      const along = (pointer.x - ctrNdc.x) * ux + (pointer.y - ctrNdc.y) * uy;
      // Rasio dinormalisasi ke ANCHOR (offset layar sumbu ter-lebar antar 6
      // bola, frozen saat down): sumbu Y ter-foreshorten di elevasi tinggi
      // → al0 kecil → drag kecil = scale meledak ("super licin"). Dengan
      // anchor: drag 1× jarak bola-layar = ×2 — rasa konsisten di SEMUA
      // elevasi; di elevasi rendah anchor=al0 → rasa persis jalur library
      // sehat (sudah disetujui user).
      const anchor = Math.max(st.anchor || st.al0, 1e-4);
      let ratio = 1 + (along - st.along0) / anchor;
      ratio = Math.max(0, Math.min(SCREEN_RATIO_MAX, ratio));
      // hanya sumbu yang digenggam yang berubah (pola library 649-663);
      // tanda identitas block (kaca −x sah, Phase 67) dari snapshot down
      // (bukan _scaleStart library — basi saat plane-raycast gagal).
      const start = st.startScale;
      const signStart = start >= 0 ? 1 : -1;
      let target = signStart * Math.max(Math.abs(start) * ratio, SCALE_MIN_ABS);
      this.object.scale[st.key] = target;
      this.object.updateMatrixWorld();
      this.dispatchEvent({ type: 'change' });
      this.dispatchEvent({ type: 'objectChange' });
    } catch (e) {
      return origMove.call(this, pointer);
    }
  };

  transformControls.pointerHover = proxHoverV13;
  transformControls.pointerDown = proxDownV13;
  transformControls.pointerMove = moveHandler;


  const dispose = () => {
    // Lepas wrapper dulu (LIFO terhadap pemasangan).
    if (gizmoRoot.updateMatrixWorld !== originalUpdate) {
      gizmoRoot.updateMatrixWorld = originalUpdate;
    }
    // Lepas override picking proximity + cabang v13 (LIFO terhadap pemasangan;
    // cek identitas dulu — pola rotate).
    if (transformControls.pointerHover === proxHoverV13) {
      transformControls.pointerHover = proxHover;   // lepas lapis v13 → masih v12
    }
    if (transformControls.pointerDown === proxDownV13) {
      transformControls.pointerDown = proxDown;
    }
    if (transformControls.pointerMove === moveHandler) {
      transformControls.pointerMove = origMove;
    }
    // Bersihkan state drag v13 (WeakMap — cukup delete supaya drag mati bersih).
    grabbedBallByTc.delete(transformControls);
    dragScreenByTc.delete(transformControls);
    if (transformControls.pointerHover === proxHover) {
      transformControls.pointerHover = origHover;
    }
    if (transformControls.pointerDown === proxDown) {
      transformControls.pointerDown = origDown;
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
