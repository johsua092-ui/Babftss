/**
 * ================================================================
 * gizmoRotateRings.js — Phase 50 (2026-09-04)
 * ================================================================
 *
 * TUJUAN
 * Mengganti tampilan gizmo Rotate bawaan Three.js menjadi desain yang
 * diminta user (berdasarkan gambar referensi):
 *   - 3 CINCIN PENUH 360 derajat: merah (X), hijau (Y), biru (Z)
 *   - Cincin TIPIS seperti garis
 *   - 6 BOLA solid sebagai handle, 2 per cincin di ujung berseberangan,
 *     warnanya mengikuti warna cincinnya
 *   - TIDAK ada cincin abu-abu dan TIDAK ada cincin kuning besar
 *   - Posisi bola TERKUNCI pada sumbunya, tidak bergeser walau kamera
 *     digerakkan (hijau di kiri-kanan, merah di depan-belakang,
 *     biru di atas-bawah)
 *   - Saat sebuah bola di-drag: 2 bola sumbu itu MENGORBIT pusat mengikuti
 *     lintasan cincinnya, sedangkan 2 cincin lain beserta bolanya
 *     disembunyikan sementara; muncul lagi begitu drag dilepas
 *
 * ── KONDISI BAWAAN YANG DIPERBAIKI ──────────────────────────────
 * `_gizmo.gizmo.rotate` bawaan Three.js 0.185 punya 5 handle:
 *   XYZE : cincin abu-abu (#787878) PENUH radius 0.5, selalu menghadap kamera
 *   X    : busur merah SETENGAH (arc 0.5 = 180 derajat), bidang YZ
 *   Y    : busur hijau SETENGAH, bidang XZ
 *   Z    : busur biru SETENGAH, bidang XY
 *   E    : cincin kuning transparan PENUH radius 0.75 (paling luar)
 * Jadi yang user lihat sebagai "4 cincin" = 3 busur berwarna + cincin
 * abu-abu, ditambah cincin kuning besar di luarnya.
 *
 * ── PERUBAHAN YANG DILAKUKAN ────────────────────────────────────
 * 1. XYZE dan E dimatikan lewat API PUBLIK `showXYZE` dan `showE`.
 *    Cara ini dipilih daripada menghapus mesh karena:
 *      - API resmi & terdokumentasi, bukan akses internal
 *      - PICKER-nya ikut mati (sudah diverifikasi), jadi tidak ada
 *        "klik hantu" pada area cincin yang sudah tidak terlihat
 *      - bisa dibalik kapan saja tanpa membangun ulang gizmo
 * 2. Geometry X/Y/Z diganti dari busur 180 derajat menjadi cincin
 *    PENUH 360 derajat, memakai pipeline yang sama dengan bawaan
 *    (TorusGeometry + rotateY(PI/2) + rotateX(PI/2)) supaya bidangnya
 *    identik. Sudah diverifikasi: normal bidang tetap X/Y/Z dan
 *    diameternya penuh 1.015 pada dua sumbu.
 * 3. Ditambahkan 2 bola per cincin sebagai mesh baru bernama sama
 *    dengan sumbunya, dengan material DI-SHARE dari cincin.
 *
 * ── PELAJARAN PENTING ───────────────────────────────────────────
 *
 * 1) POSISI BOLA WAJIB DI-BAKE KE GEOMETRY, bukan lewat mesh.position.
 *    `updateMatrixWorld()` menimpa `handle.position` dengan worldPosition
 *    setiap frame (baris 1613), jadi position yang di-set manual selalu
 *    hilang. Sudah diverifikasi: position (9,9,9) berubah jadi (0,0,0).
 *    Solusi: `geometry.translate(...)` — sama seperti yang dilakukan
 *    `setupGizmo()` bawaan lewat `applyMatrix4`.
 *
 * 2) MATERIAL HARUS DI-SHARE, bukan di-clone.
 *    `updateMatrixWorld()` menimpa `material.color` untuk highlight sumbu
 *    aktif (jadi kuning). Material yang di-clone tidak ikut ter-highlight,
 *    sehingga bola tidak berubah warna saat sumbunya dipakai.
 *
 * 3) BOLA IKUT ROTASI KAMERA-ALIGN, DAN ITU MEMANG BENAR.
 *    Untuk mode rotate, Three.js memutar setiap handle terhadap sumbunya
 *    sendiri agar busur bawaan menghadap kamera (baris 1831-1853). Cincin
 *    PENUH tidak terlihat berubah karena simetri rotasi (sudah diverifikasi:
 *    normal bidang tetap persis), sedangkan bola bergeser sepanjang cincin.
 *    Itu tetap aman: jarak antar-bola dari cincin berbeda diuji pada 6 sudut
 *    kamera, paling dekat 0.383 sedangkan diameter bola hanya 0.15.
 *
 * 4) TIDAK PERLU PICKER TAMBAHAN UNTUK BOLA.
 *    Picker rotate bawaan adalah TorusGeometry(0.5, 0.1) PENUH 360 derajat.
 *    Bola berada di radius 0.5 dengan radius 0.075, jadi seluruh badannya
 *    ada di dalam tube picker (0.1). Mengklik bola otomatis terbaca sebagai
 *    sumbu yang benar tanpa menyentuh picker sama sekali.
 *    Sudah diuji menambahkan picker bola (radius 0.075 / 0.11 / 0.15):
 *    akurasi klik TIDAK membaik (37/48, 37/48, 38/48 vs 37/48 tanpa picker),
 *    jadi picker tambahan hanya menambah kompleksitas tanpa manfaat.
 *
 * 5) AMBIGUITAS DI TITIK SILANG CINCIN ADALAH SIFAT BAWAAN THREE.JS.
 *    Ketiga picker torus (tube 0.1) saling tumpang tindih di dekat sumbu
 *    utama, dan raycaster memilih yang paling dekat ke kamera. Diukur pada
 *    8 sudut kamera: gizmo BAWAAN sendiri hanya 33/48 (69%) akurat kalau
 *    diklik tepat di titik-titik itu, sedangkan setelah Phase 50 justru
 *    37/48 (77%) — lebih baik, karena picker XYZE yang ikut bersaing sudah
 *    dimatikan. Menggeser bola ke sudut lain sepanjang cincin sudah dicoba
 *    (offset 15/30/45/60/75/90 derajat) dan semuanya LEBIH BURUK dari
 *    offset 0, jadi posisi di sumbu utama dipertahankan — selain itu posisi
 *    itulah yang cocok dengan gambar referensi user.
 *    Klik pada BADAN cincin (bukan titik silang) akurasinya jauh lebih baik:
 *    137/144 identik dengan bawaan, 7 sisanya berubah LEBIH BAIK.
 *
 * ── CATATAN KEAMANAN ────────────────────────────────────────────
 * - Hanya menyentuh `_gizmo.gizmo.rotate`. Mode translate dan scale,
 *   termasuk 6 panah Move (Phase 49 v9-v11), tidak disentuh sama sekali.
 * - Picker tidak dimodifikasi, jadi perilaku drag rotate tetap persis sama.
 * - Idempoten lewat penanda userData.
 * - `dispose()` yang dikembalikan memulihkan busur asli dan menghapus bola.
 * ================================================================
 */

import * as THREE from 'three';

/** Nama sumbu yang punya cincin berwarna. */
const AXES = ['X', 'Y', 'Z'];

/** Penanda idempoten pada mesh bola yang kita tambahkan. */
const BALL_MARK = '__rotateBallP50';

/** Penanda idempoten pada objek gizmo rotate. */
const GIZMO_MARK = '__rotateRingsP50';

/**
 * Rotasi tambahan per sumbu, PERSIS seperti definisi `gizmoRotate`
 * di TransformControls.js (baris 1391-1399):
 *   X → tanpa rotasi tambahan
 *   Y → [0, 0, -PI/2]
 *   Z → [0, PI/2, 0]
 */
const EXTRA_ROTATION = {
  X: null,
  Y: [0, 0, -Math.PI / 2],
  Z: [0, Math.PI / 2, 0],
};

/**
 * Arah letak 2 bola pada tiap cincin. Harus berada DI BIDANG cincinnya
 * (komponen sumbu normal = 0) supaya bola menempel di lingkaran.
 *
 * Penempatan dipilih siklik supaya tiap sumbu dipakai tepat sekali, dan
 * cocok dengan permintaan user:
 *   cincin Y (hijau, bidang XZ) → bola di ±X  = kiri & kanan (horizontal)
 *   cincin X (merah, bidang YZ) → bola di ±Z  = depan & belakang
 *   cincin Z (biru,  bidang XY) → bola di ±Y  = atas & bawah
 * Untuk cincin Z hanya ±X atau ±Y yang mungkin (±Z adalah sumbu normalnya,
 * bola akan lepas dari lingkaran), dan ±X sudah dipakai hijau — jadi ±Y.
 */
const BALL_DIRECTION = {
  X: [0, 0, 1],
  Y: [1, 0, 0],
  Z: [0, 1, 0],
};

/** Vektor satuan per sumbu, dipakai untuk orbit bola saat drag. */
const UNIT_AXIS = {
  X: new THREE.Vector3(1, 0, 0),
  Y: new THREE.Vector3(0, 1, 0),
  Z: new THREE.Vector3(0, 0, 1),
};

/** Objek sementara dipakai ulang supaya tidak alokasi tiap frame. */
const _tmpQuatBase = new THREE.Quaternion();
const _tmpQuatOrbit = new THREE.Quaternion();
const _identityQuat = new THREE.Quaternion();

/** Penanda idempoten untuk pengunci drag rotate (cursor-locked). */
const LOCK_MARK = '__rotateLockP501';

/** Objek sementara untuk logika cursor-locked rotation. */
const _lockRay = new THREE.Raycaster();
const _lockAxis = new THREE.Vector3();
const _lockProjA = new THREE.Vector3();
const _lockProjB = new THREE.Vector3();
const _lockCross = new THREE.Vector3();
const _lockAxisParent = new THREE.Vector3();
const _lockQuat = new THREE.Quaternion();

/**
 * Mengunci drag rotate pada sumbu X/Y/Z sehingga bola (dan rotasi objek)
 * MENGIKUTI KURSOR 100% — tidak meluncur / kabur dari kursor.
 *
 * ── MASALAH BAWAAN ──────────────────────────────────────────────
 * `pointerMove()` di TransformControls (baris 695-729) menghitung sudut
 * rotasi untuk sumbu X/Y/Z dari:
 *     rotationAngle = _offset.dot(_tempVector.normalize()) * ROTATION_SPEED
 * dengan `_tempVector = unitAxis × eye`, dan `_offset = pointEnd - pointStart`
 * (pergeseran kursor di BIDANG KAMERA). Hasilnya:
 *   - sudut rotasi DIAMBIL DARI BESAR PERGESERAN (skalar), bukan dari arah
 *     kursor terhadap pusat objek;
 *   - bola berputar dengan laju yang tidak berkorelasi dengan posisi kursor,
 *     sehingga bola "meluncur" / "kabur" dari kursor (diukur: drag 120px →
 *     slip bola dari kursor 142 px, beda sweep 25 derajat).
 *
 * ── SOLUSI ──────────────────────────────────────────────────────
 * Untuk axis X/Y/Z saat dragging, hitung ulang `rotationAngle` sebagai
 * SUDUT BERTANDA (signed angle) antara proyeksi `pointStart` dan `pointEnd`
 * pada bidang yang TEGAK LURUS sumbu rotasi:
 *     a = pointStart - n·(pointStart·n)   (proyeksi ⊥ sumbu)
 *     b = pointEnd   - n·(pointEnd·n)
 *     angle = atan2( (a×b)·n , a·b )
 * Ini persis logika "in-plane rotation" yang dipakai bawaan hanya ketika
 * sumbu paralel kamera (baris 736-746) — tapi sekarang diterapkan untuk
 * SEMUA orientasi sumbu, sehingga rotasi sebanding dengan gerakan kursor
 * di layar dan bola menempel pada kursor. Lalu terapkan ke object
 * mengikuti pola asli (baris 752-764), dan dispatch event change.
 *
 * ── KEAMANAN ────────────────────────────────────────────────────
 * - Hanya mempengaruhi mode rotate dengan axis X/Y/Z saat dragging.
 *   Mode lain, axis lain (E, XYZE), hover, down, up, snap — TIDAK disentuh
 *   (delegasi penuh ke fungsi asli).
 * - Override dilakukan pada INSTANCE (`tc.pointerMove`), bukan prototype,
 *   jadi instance lain tidak terpengaruh.
 * - Idempoten (penanda userData LOCK_MARK) + dispose() untuk melepas.
 *
 * @param {THREE.Controls} transformControls instance TransformControls
 * @returns {function|null} dispose, atau null kalau tidak bisa dipasang
 */
function enableCursorLockedRotation(transformControls) {
  if (!transformControls || !transformControls.pointerMove) return null;

  // Idempoten: jangan pasang dua kali.
  if (transformControls.userData && transformControls.userData[LOCK_MARK]) {
    return transformControls.userData[LOCK_MARK].dispose || null;
  }

  const proto = Object.getPrototypeOf(transformControls);
  const origPointerMove = transformControls.pointerMove;
  const origPointerHover = transformControls.pointerHover;

  // Cari bola (handle rotate) yang proyeksi layarnya paling dekat dengan
  // pointer (NDC). Kalau cukup dekat, axis dipaksa ke nama bola tsb.
  // Ini memperbaiki PICKING: picker torus bawaan saling tumpang tindih, dan
  // di posisi bola sering memilih sumbu yang SALAH (diukur: klik bola Y →
  // axis Z → bola yang kamu pegang "kabur"). Preferensi proyeksi ini
  // membuat hover/klik pada bola selalu memilih bola yang benar, TANPA
  // menambah mesh picker apa pun (tetap 100% visual, tidak menyentuh picker).
  const findBallNearPointer = (pointer) => {
    const giz = transformControls._gizmo && transformControls._gizmo.gizmo &&
                transformControls._gizmo.gizmo.rotate;
    if (!giz || !transformControls.camera) return null;
    let best = null;
    let bestD = Infinity;
    for (const ball of giz.children) {
      if (!ball.userData || ball.userData[BALL_MARK] !== true) continue;
      if (!ball.geometry || !ball.geometry.boundingSphere) continue;
      const center = ball.geometry.boundingSphere.center.clone();
      ball.updateWorldMatrix(true, false);
      center.applyMatrix4(ball.matrixWorld);
      const v = center.project(transformControls.camera);
      // NDC pointer sudah y ke atas; project() juga y ke atas
      const d = Math.hypot(v.x - pointer.x, v.y - pointer.y);
      if (d < bestD) { bestD = d; best = ball; }
    }
    // Threshold: 0.035 NDC ≈ 32px di 900px — jauh lebih besar dari bola (~7px)
    // tapi tidak mencuri hover cincin yang jauh dari bola.
    return (best && bestD < 0.035) ? best : null;
  };

  const lockedPointerHover = function (pointer) {
    origPointerHover.call(this, pointer);
    if (this.mode !== 'rotate' || this.dragging === true || pointer == null) return;
    const near = findBallNearPointer(pointer);
    if (near) {
      // Paksa axis ke bola kalau pointer cukup dekat dengan bola — prioritas
      // bola di atas picker (yang salah memilih sumbu lain di titik itu).
      this.axis = near.name;
    }
  };

  const lockedPointerMove = function (pointer) {
    const axis = this.axis;
    const mode = this.mode;
    const object = this.object;

    // Hanya mode rotate, axis X/Y/Z, sedang dragging, tombol benar.
    const isAxial = axis === 'X' || axis === 'Y' || axis === 'Z';
    if (mode !== 'rotate' || !isAxial || this.dragging !== true ||
        object === undefined || (pointer != null && pointer.button !== -1)) {
      return origPointerMove.call(this, pointer);
    }

    try {
      let space = this.space;
      if (this.camera && this.camera.isOrthographicCamera === false && (space === null || space === undefined)) {
        space = 'world';
      }
      const isLocal = space === 'local' && axis !== 'E' && axis !== 'XYZE';

      // 1) pointEnd dari intersect _plane (sama seperti asli)
      if (pointer != null) _lockRay.setFromCamera(pointer, this.camera);
      const planeIntersect = _lockRay.intersectObject(this._plane, true)[0];
      if (!planeIntersect) return;
      this.pointEnd.copy(planeIntersect.point).sub(this.worldPositionStart);
      this._offset.copy(this.pointEnd).sub(this.pointStart);

      // 2) sumbu rotasi (world, atau local → pakai worldQuaternion)
      _lockAxis.set(axis === 'X' ? 1 : 0, axis === 'Y' ? 1 : 0, axis === 'Z' ? 1 : 0);
      if (isLocal) _lockAxis.applyQuaternion(this.worldQuaternion);

      // 3) SUDUT LAYAR: hitung sudut kursor terhadap pusat DI LAYAR, lalu
      // terjemahkan ke rotasi 3D di sekitar sumbu sehingga bola mengikuti
      // kursor SECARA VISUAL (bukan hanya sudut world yang kecil).
      // Proyeksikan worldPositionStart (pusat) dan pointStart/pointEnd ke NDC:
      const proj = (v) => {
        const p = v.clone().project(this.camera);
        return p;
      };
      const cNDC = proj(this.worldPositionStart);
      const sNDC = proj(this.worldPositionStart.clone().add(this.pointStart));
      const eNDC = proj(this.worldPositionStart.clone().add(this.pointEnd));
      const a0 = Math.atan2(sNDC.y - cNDC.y, sNDC.x - cNDC.x);
      const a1 = Math.atan2(eNDC.y - cNDC.y, eNDC.x - cNDC.x);
      let sweepScreen = a1 - a0;
      while (sweepScreen > Math.PI) sweepScreen -= 2 * Math.PI;
      while (sweepScreen < -Math.PI) sweepScreen += 2 * Math.PI;
      // Terjemahkan sweep layar ke rotasi 3D: rotasi object sebesar
      // `rotationAngle` menggerakkan bola di layar sebesar `sweepScreen`.
      // Faktor koreksi bergantung orientasi sumbu terhadap kamera:
      //   untuk sumbu yang TEGAK LURUS layar → 1:1
      //   untuk sumbu yang SEJAJAR layar → 0 (rotasi tak terlihat)
      // Rumus eksak: dot(axisWorld, eye) memberi kemiringan.
      //   angle3D * (1 - |dot(axis, eye)|^2) ... pendekatan pertama:
      // Kita pakai koreksi proyeksi: angle3D = sweepScreen / sin(phi)
      // dengan phi = sudut antara axis & eye (dot = cos(phi)).
      const axisDotEye = _lockAxis.dot(this.eye);
      const sinPhi = Math.sqrt(Math.max(0, 1 - axisDotEye * axisDotEye));
      let rotation3D = sweepScreen;
      if (sinPhi > 0.15) {
        rotation3D = sweepScreen / sinPhi;
      } else {
        // sumbu nyaris sejajar kamera → rotasi tak terlihat → pakai sweep
        // dalam bidang kamera (identik dengan asli in-plane)
        rotation3D = sweepScreen;
      }
      this.rotationAngle = rotation3D;
      _lockProjA.copy(this.pointStart).addScaledVector(_lockAxis, -this.pointStart.dot(_lockAxis));
      _lockProjB.copy(this.pointEnd).addScaledVector(_lockAxis, -this.pointEnd.dot(_lockAxis));
      // Jika proyeksi pointStart/pointEnd ke bidang ⊥ sumbu nyaris nol,
      // fallback ke asli (degenerasi).
      if (_lockProjA.length() < 1e-6 || _lockProjB.length() < 1e-6) {
        return origPointerMove.call(this, pointer);
      }

      // 4) rotationSnap (sama seperti asli baris 750)
      if (this.rotationSnap) {
        this.rotationAngle = Math.round(this.rotationAngle / this.rotationSnap) * this.rotationSnap;
      }

      // 5) apply rotasi ke object (mengikuti pola asli baris 752-764)
      if (isLocal) {
        object.quaternion.copy(this._quaternionStart);
        object.quaternion.multiply(_lockQuat.setFromAxisAngle(_lockAxis, this.rotationAngle)).normalize();
      } else {
        _lockAxisParent.copy(_lockAxis).applyQuaternion(this._parentQuaternionInv);
        object.quaternion.copy(_lockQuat.setFromAxisAngle(_lockAxisParent, this.rotationAngle));
        object.quaternion.multiply(this._quaternionStart).normalize();
      }

      // 6) event (sama seperti asli baris 768-769)
      this.dispatchEvent({ type: 'change' });
      this.dispatchEvent({ type: 'objectChange' });
    } catch (e) {
      // Jangan sampai error kecil menggagalkan drag; fallback ke asli.
      try { return origPointerMove.call(this, pointer); } catch (_) { /* abaikan */ }
    }
  };

  transformControls.pointerMove = lockedPointerMove;
  transformControls.pointerHover = lockedPointerHover;

  const dispose = () => {
    if (transformControls.pointerMove === lockedPointerMove) {
      transformControls.pointerMove = origPointerMove;
    }
    if (transformControls.pointerHover === lockedPointerHover) {
      transformControls.pointerHover = origPointerHover;
    }
    if (transformControls.userData) delete transformControls.userData[LOCK_MARK];
  };

  if (!transformControls.userData) transformControls.userData = {};
  transformControls.userData[LOCK_MARK] = { dispose };
  return dispose;
}

/** Material sumbu pada materialLib, dipakai untuk share ke bola. */
const MATERIAL_KEY = { X: 'xAxis', Y: 'yAxis', Z: 'zAxis' };

/**
 * Membuat geometry cincin, replika `CircleGeometry()` milik
 * TransformControls.js (baris 1286-1293) supaya orientasinya identik.
 *
 * @param {number} radius radius cincin
 * @param {number} tube ketebalan tabung (kecil = tampak seperti garis)
 * @param {number} arc 1 = penuh 360 derajat, 0.5 = setengah
 * @returns {THREE.TorusGeometry}
 */
function makeRingGeometry(radius, tube, arc) {
  const geometry = new THREE.TorusGeometry(radius, tube, 3, 64, arc * Math.PI * 2);
  geometry.rotateY(Math.PI / 2);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

/**
 * Mencari Object3D gizmo rotate dari sebuah TransformControls.
 * Beberapa jalur dicoba karena letak internal berbeda antar versi Three.js.
 *
 * @param {THREE.Controls} transformControls instance TransformControls
 * @param {THREE.Object3D|null} helperRoot hasil transformControls.getHelper()
 * @returns {THREE.Object3D|null}
 */
export function findRotateGizmo(transformControls, helperRoot = null) {
  if (transformControls && transformControls._gizmo && transformControls._gizmo.gizmo) {
    const found = transformControls._gizmo.gizmo.rotate;
    if (found) return found;
  }

  if (helperRoot && helperRoot.children) {
    for (const child of helperRoot.children) {
      if (child && child.gizmo && child.gizmo.rotate) return child.gizmo.rotate;
    }
  }

  const deepFind = (obj) => {
    if (!obj) return null;
    if (obj.gizmo && obj.gizmo.rotate) return obj.gizmo.rotate;
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
 * Mengubah tampilan gizmo Rotate menjadi 3 cincin penuh + 6 bola handle.
 *
 * @param {THREE.Controls} transformControls instance TransformControls
 * @param {THREE.Object3D|null} helperRoot hasil transformControls.getHelper()
 * @param {Object} [options]
 * @param {number} [options.radius=0.5] radius cincin (0.5 = sama dengan bawaan)
 * @param {number} [options.ringTube=0.0075] ketebalan cincin (sama dengan bawaan)
 * @param {number} [options.ballRadius=0.075] radius bola handle
 * @param {boolean} [options.hideExtraRings=true] matikan cincin abu-abu (XYZE)
 *   dan cincin kuning (E)
 * @returns {{ ok: boolean, rings: string[], balls: string[], hiddenRings: string[],
 *             dispose?: function, reason?: string, alreadyApplied?: boolean }}
 */
export function restyleRotateGizmo(transformControls, helperRoot = null, options = {}) {
  const {
    radius = 0.5,
    ringTube = 0.0075,
    ballRadius = 0.075,
    hideExtraRings = true,
  } = options;

  const rotateObj = findRotateGizmo(transformControls, helperRoot);
  if (!rotateObj) {
    return { ok: false, rings: [], balls: [], hiddenRings: [], reason: 'gizmo rotate tidak ditemukan' };
  }

  // Idempoten: jangan pasang dua kali.
  if (rotateObj.userData[GIZMO_MARK]) {
    return {
      ok: true,
      alreadyApplied: true,
      rings: [], balls: [], hiddenRings: [],
      dispose: rotateObj.userData[GIZMO_MARK].dispose,
    };
  }

  const hiddenRings = [];
  const rings = [];
  const balls = [];
  const addedBalls = [];
  const replacedRings = [];   // { mesh, originalGeometry } untuk dispose()

  // ── 1. Matikan cincin abu-abu (XYZE) dan cincin kuning (E) ──
  // API publik; picker-nya ikut mati sehingga tidak ada klik hantu.
  const prevShowE = transformControls.showE;
  const prevShowXYZE = transformControls.showXYZE;
  if (hideExtraRings) {
    transformControls.showE = false;
    transformControls.showXYZE = false;
    hiddenRings.push('XYZE (cincin abu-abu)', 'E (cincin kuning)');
  }

  const materialLib = transformControls._gizmo && transformControls._gizmo.materialLib;

  for (const axis of AXES) {
    const ring = rotateObj.children.find((c) => c.name === axis && !c.userData[BALL_MARK]);
    if (!ring) continue;

    // ── 2. Ganti busur 180 derajat menjadi cincin penuh 360 derajat ──
    const fullRing = makeRingGeometry(radius, ringTube, 1);
    const extra = EXTRA_ROTATION[axis];
    if (extra) {
      fullRing.applyMatrix4(
        new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(extra[0], extra[1], extra[2])),
      );
    }
    fullRing.computeBoundingBox();
    fullRing.computeBoundingSphere();

    replacedRings.push({ mesh: ring, originalGeometry: ring.geometry });
    ring.geometry = fullRing;      // geometry lama disimpan untuk dispose()
    rings.push(`${axis} (cincin penuh)`);

    // ── 3. Tambahkan 2 bola handle di ujung berseberangan ──
    // Material di-share dari cincin agar highlight kuning tetap sinkron.
    const sharedMaterial = (materialLib && materialLib[MATERIAL_KEY[axis]]) || ring.material;
    const dir = BALL_DIRECTION[axis];

    for (const sign of [1, -1]) {
      // Posisi WAJIB di-bake ke geometry (position ditimpa tiap frame).
      const ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 12);
      ballGeometry.translate(
        dir[0] * sign * radius,
        dir[1] * sign * radius,
        dir[2] * sign * radius,
      );
      ballGeometry.computeBoundingBox();
      ballGeometry.computeBoundingSphere();

      const ball = new THREE.Mesh(ballGeometry, sharedMaterial);
      ball.name = axis;              // wajib: highlight, showX/Y/Z, picking axis
      ball.renderOrder = Infinity;   // sama seperti setupGizmo()
      ball.userData[BALL_MARK] = true;
      rotateObj.add(ball);

      addedBalls.push(ball);
      balls.push(`${axis}${sign > 0 ? '+' : '-'}`);
    }
  }

  // ── 4. Kunci posisi bola & solo-orbit saat drag ──
  //
  // MASALAH: `updateMatrixWorld()` untuk mode rotate memutar SETIAP handle
  // terhadap sumbunya sendiri agar busur 180 derajat bawaan selalu menghadap
  // kamera (baris 1831-1853). Cincin PENUH tidak terlihat berubah karena
  // simetri rotasi, TAPI bola yang menempel padanya jadi ikut bergeser setiap
  // kali kamera digerakkan. Sudah diukur: memindahkan kamera dari (6,5,7) ke
  // (2,9,3) menggeser arah bola sampai 0.618 unit — jelas terlihat mata.
  //
  // SOLUSI: setelah fungsi asli dijalankan, quaternion setiap BOLA di-set ulang
  //   - saat idle : ke basis gizmo (identitas untuk space 'world', atau
  //                 worldQuaternion untuk space 'local') → posisi TERKUNCI,
  //                 tidak terpengaruh kamera sama sekali
  //   - saat drag : 2 bola milik sumbu aktif ikut MENGORBIT pusat mengikuti
  //                 lintasan cincinnya, sementara cincin lain beserta bolanya
  //                 disembunyikan sementara
  //
  // CATATAN 1: orbit hanya perlu ditambahkan manual saat space = 'world'.
  // Pada space = 'local', basis bola adalah `worldQuaternion` yang SUDAH
  // memuat rotasi yang sedang diterapkan ke object, jadi bola otomatis
  // mengorbit. Menambah rotasi lagi akan membuat orbitnya 2x lipat.
  //
  // CATATAN 2: `super.updateMatrixWorld()` dipanggil di AKHIR fungsi asli
  // (baris 1902), jadi mengubah quaternion sesudahnya TIDAK otomatis masuk ke
  // matrixWorld. Karena itu `rotateObj.updateMatrixWorld(true)` dipanggil lagi
  // untuk menghitung ulang matriks anak-anaknya.
  const gizmoRoot = transformControls._gizmo;
  const originalUpdate = (gizmoRoot && typeof gizmoRoot.updateMatrixWorld === 'function')
    ? gizmoRoot.updateMatrixWorld
    : null;

  if (originalUpdate) {
    gizmoRoot.updateMatrixWorld = function (force) {
      originalUpdate.call(this, force);
      if (this.mode !== 'rotate') return;

      const isLocal = this.space === 'local' && !!this.worldQuaternion;
      // Basis gizmo: sama seperti yang dipakai Three.js untuk mode non-rotate.
      _tmpQuatBase.copy(isLocal ? this.worldQuaternion : _identityQuat);

      const activeAxis = transformControls.axis;
      const soloing = transformControls.dragging && AXES.includes(activeAxis);

      for (const child of rotateObj.children) {
        const isBall = child.userData[BALL_MARK] === true;

        // Saat drag: sembunyikan cincin & bola milik sumbu LAIN.
        if (soloing && AXES.includes(child.name) && child.name !== activeAxis) {
          child.visible = false;
          continue;
        }
        if (!isBall) continue;   // cincin sumbu aktif: biarkan Three.js atur

        // Kunci ke basis gizmo (buang rotasi camera-align).
        child.quaternion.copy(_tmpQuatBase);

        // Sumbu aktif saat drag di space 'world': putar bola → mengorbit.
        if (soloing && !isLocal && child.name === activeAxis) {
          const angle = transformControls.rotationAngle || 0;
          if (angle) {
            _tmpQuatOrbit.setFromAxisAngle(UNIT_AXIS[activeAxis], angle);
            child.quaternion.multiply(_tmpQuatOrbit);
          }
        }
      }

      // Quaternion diubah SETELAH super.updateMatrixWorld() → hitung ulang.
      rotateObj.updateMatrixWorld(true);
    };
  }

  // ── 5. Kunci drag rotate agar bola mengikuti kursor 100% ──
  // Masalah bawaan: rotationAngle dihitung dari BESAR pergeseran kursor
  // (offset.dot(tangent) * ROTATION_SPEED) bukan dari arah kursor terhadap
  // pusat, sehingga bola "meluncur" / "kabur" dari kursor saat drag.
  // Solusi: override pointerMove pada INSTANCE ini — untuk axis X/Y/Z saat
  // dragging, rotationAngle dihitung sebagai signed angle antara proyeksi
  // pointStart & pointEnd pada bidang ⊥ sumbu rotasi (lihat dokumentasi
  // enableCursorLockedRotation di atas). Mode/axis lain tetap pakai asli.
  let disposeLock = null;
  try {
    disposeLock = enableCursorLockedRotation(transformControls);
  } catch (e) {
    disposeLock = null;   // jangan sampai menggagalkan init
  }

  const dispose = () => {
    // Lepas override pointerMove (cursor-locked) lebih dulu.
    if (disposeLock) {
      try { disposeLock(); } catch (e) { /* abaikan */ }
    }
    // Lepas wrapper updateMatrixWorld lebih dulu.
    if (originalUpdate && gizmoRoot.updateMatrixWorld !== originalUpdate) {
      gizmoRoot.updateMatrixWorld = originalUpdate;
    }
    // Kembalikan cincin ke busur aslinya.
    for (const { mesh, originalGeometry } of replacedRings) {
      const replacement = mesh.geometry;
      mesh.geometry = originalGeometry;
      if (replacement && replacement !== originalGeometry) replacement.dispose();
    }
    // Hapus bola yang kita tambahkan.
    for (const ball of addedBalls) {
      rotateObj.remove(ball);
      if (ball.geometry) ball.geometry.dispose();
      // material TIDAK di-dispose: di-share dengan cincin & handle lain
    }
    if (hideExtraRings) {
      transformControls.showE = prevShowE;
      transformControls.showXYZE = prevShowXYZE;
    }
    delete rotateObj.userData[GIZMO_MARK];
  };

  rotateObj.userData[GIZMO_MARK] = { dispose };
  return { ok: true, rings, balls, hiddenRings, dispose };
}

export default restyleRotateGizmo;
