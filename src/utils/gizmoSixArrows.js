/**
 * ================================================================
 * gizmoSixArrows.js — Phase 49 v9 (2026-09-03)
 * ================================================================
 *
 * TUJUAN
 * Membuat gizmo Move (translate) dari Three.js TransformControls punya
 * 6 PANAH UTUH: setiap arah (+X, -X, +Y, -Y, +Z, -Z) punya
 * garis (shaft) + kerucut (cone) yang persis identik antar sisi.
 *
 * KENAPA PERLU MODUL INI
 * Three.js menggambar gizmo translate dengan:
 *   - 6 kerucut (2 per sumbu: sisi + dan sisi -)
 *   - hanya 3 garis  (cuma sisi +)
 * Hasilnya: 3 panah utuh di sisi positif, dan 3 kerucut "ngambang"
 * tanpa garis di sisi negatif. Yang HILANG sebenarnya cuma GARIS-nya.
 *
 * CARA KERJA (aman & minimal)
 * Modul ini TIDAK menghapus apa pun dari gizmo bawaan Three.js.
 * Ia hanya MENAMBAH mesh yang kurang, dibuat dengan cara me-mirror
 * mesh sisi positif yang sudah ada. Karena hasil mirror dipakai apa
 * adanya dari geometry asli, warna/ukuran/bentuknya dijamin identik.
 *
 * ── PELAJARAN PENTING (kenapa percobaan sebelumnya gagal) ────────
 *
 * 1) JANGAN klasifikasi shaft vs cone pakai tinggi bounding box Y.
 *    setupGizmo() di TransformControls.js mem-bake rotasi ke dalam
 *    geometry (applyMatrix4), jadi setelah itu:
 *      shaft X → membentang di sumbu x (extent 0.5), sizeY cuma 0.0130
 *      shaft Z → membentang di sumbu z (extent 0.5), sizeY cuma 0.0112
 *      shaft Y → membentang di sumbu y (extent 0.5), sizeY 0.5
 *    Heuristik "sizeY > 0.3 = shaft" hanya benar untuk sumbu Y dan
 *    salah mengira shaft X/Z sebagai kerucut.
 *    YANG BENAR: ukur extent pada SUMBU HANDLE-nya sendiri
 *    (handle 'X' → ukur di x, 'Y' → y, 'Z' → z).
 *
 * 2) Mirror ke sisi negatif WAJIB rotasi 180 derajat terhadap sumbu
 *    PERPENDICULAR, bukan terhadap sumbu panah itu sendiri.
 *    Memflip 2 koordinat perpendicular (mis. untuk X: flip Y dan Z)
 *    secara matematis = rotasi 180 derajat terhadap sumbu X — dan
 *    rotasi terhadap X TIDAK mengubah koordinat x sama sekali,
 *    sehingga cone X yang ada di x=+0.55 tetap di +0.55 (menumpuk
 *    persis di atas cone positif → kelihatan seperti "hilang").
 *    YANG BENAR: X di-mirror dengan rotasi 180 derajat thd sumbu Y,
 *    sedangkan Y dan Z di-mirror dengan rotasi 180 derajat thd sumbu X.
 *
 * 3) Rotasi murni punya determinan +1, jadi winding order triangle
 *    TETAP benar → TIDAK perlu material DoubleSide. Kalau pakai
 *    flip koordinat manual dengan determinan -1, winding terbalik
 *    dan mesh ter-cull (invisible) tanpa DoubleSide.
 *
 * ── GARIS PUTIH PANJANG (helper) ────────────────────────────────
 * Selain gizmo, TransformControls juga punya `_gizmo.helper[mode]`
 * berisi garis bantu PUTIH yang terpisah dari 6 panah:
 *   X / Y / Z  → Line putih opacity 0.5, panjang 1.000.000 unit,
 *                muncul saat sumbu aktif (hover atau drag)
 *   DELTA      → garis jejak dari titik awal ke titik sekarang
 *   START/END  → titik kecil penanda posisi awal & akhir drag
 * Kalau tidak diinginkan, pakai hideTranslateHelperLines() di bawah.
 * Aman dihapus: helper TIDAK dipakai untuk raycast/drag sama sekali
 * (pointerHover memakai `picker[mode]`, pointerMove memakai `_plane`).
 *
 * ── CATATAN KEAMANAN ────────────────────────────────────────────
 * - Picking/drag TIDAK tersentuh. TransformControls melakukan raycast
 *   ke `_gizmo.picker[mode]`, bukan ke `_gizmo.gizmo[mode]`. Picker
 *   bawaan sudah simetris (cone invisible di kedua sisi), jadi drag
 *   ke arah negatif memang sudah bisa sejak awal.
 * - Material di-SHARE dengan handle sisi positif (tidak di-clone),
 *   sama seperti Three.js sendiri yang share matRed/matGreen/matBlue.
 *   Efeknya highlight kuning saat axis aktif otomatis ikut sinkron.
 * - name mesh diset 'X'/'Y'/'Z' supaya semua logika bawaan
 *   updateMatrixWorld() (auto-scale, hide-facing-camera, showX/Y/Z,
 *   highlight axis aktif) berlaku sama seperti handle asli.
 * - Idempoten: mesh hasil tambahan ditandai lewat userData, jadi
 *   memanggil fungsi ini dua kali tidak menghasilkan mesh ganda.
 * ================================================================
 */

import * as THREE from 'three';

/** Peta nama handle → nama properti sumbu pada Vector3/Box3. */
const AXIS_KEY = { X: 'x', Y: 'y', Z: 'z' };

/**
 * Sumbu rotasi untuk me-mirror handle sebuah sumbu ke sisi seberangnya.
 * Harus PERPENDICULAR terhadap sumbu handle-nya (lihat pelajaran #2).
 *   x → rotasi 180 derajat thd Y : (x,y,z) → (-x,  y, -z)
 *   y → rotasi 180 derajat thd X : (x,y,z) → ( x, -y, -z)
 *   z → rotasi 180 derajat thd X : (x,y,z) → ( x, -y, -z)
 */
const MIRROR_ROT_AXIS = {
  x: new THREE.Vector3(0, 1, 0),
  y: new THREE.Vector3(1, 0, 0),
  z: new THREE.Vector3(1, 0, 0),
};

/** Batas extent (pada sumbu handle) untuk memisahkan shaft dari cone. */
const SHAFT_MIN_EXTENT = 0.3; // shaft ~0.5, cone ~0.1

/** Toleransi angka mengambang saat menentukan sisi + / - / tengah. */
const SIDE_EPS = 1e-6;

/** Penanda di userData supaya fungsi ini idempoten. */
const MARK = '__sixArrowsV9';

/**
 * Mencari Object3D gizmo translate dari sebuah TransformControls.
 * Dicoba beberapa jalur karena letak internal berbeda antar versi Three.js.
 *
 * @param {THREE.Controls} transformControls instance TransformControls
 * @param {THREE.Object3D|null} helperRoot hasil transformControls.getHelper()
 * @returns {THREE.Object3D|null} Object3D berisi handle translate, atau null
 */
export function findTranslateGizmo(transformControls, helperRoot = null) {
  // Cara 1: properti internal _gizmo (Three.js 0.150+ s/d 0.185+)
  if (transformControls && transformControls._gizmo && transformControls._gizmo.gizmo) {
    const found = transformControls._gizmo.gizmo.translate;
    if (found) return found;
  }

  // Cara 2: telusuri anak langsung dari helper root
  if (helperRoot && helperRoot.children) {
    for (const child of helperRoot.children) {
      if (child && child.gizmo && child.gizmo.translate) return child.gizmo.translate;
    }
  }

  // Cara 3: deep traversal (fallback terakhir)
  const deepFind = (obj) => {
    if (!obj) return null;
    if (obj.gizmo && obj.gizmo.translate) return obj.gizmo.translate;
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
 * Mengelompokkan handle X/Y/Z pada gizmo translate menjadi
 * { shaftPos, shaftNeg, conePos, coneNeg } per sumbu.
 *
 * Klasifikasi memakai extent bounding box pada SUMBU HANDLE-nya sendiri
 * (lihat pelajaran #1 di header file). Handle non-axis (XYZ/XY/YZ/XZ)
 * diabaikan sepenuhnya.
 *
 * @param {THREE.Object3D} translateObj gizmo translate
 * @returns {Object} peta { X: {...}, Y: {...}, Z: {...} }
 */
export function classifyTranslateHandles(translateObj) {
  const result = {
    X: { shaftPos: null, shaftNeg: null, conePos: null, coneNeg: null },
    Y: { shaftPos: null, shaftNeg: null, conePos: null, coneNeg: null },
    Z: { shaftPos: null, shaftNeg: null, conePos: null, coneNeg: null },
  };
  if (!translateObj || !translateObj.children) return result;

  for (const handle of translateObj.children) {
    const axisKey = AXIS_KEY[handle.name];
    if (!axisKey) continue;            // lewati XYZ / XY / YZ / XZ
    if (!handle.geometry) continue;

    handle.geometry.computeBoundingBox();
    const bb = handle.geometry.boundingBox;
    if (!bb) continue;

    const extent = bb.max[axisKey] - bb.min[axisKey];
    const center = (bb.min[axisKey] + bb.max[axisKey]) / 2;
    const isShaft = extent > SHAFT_MIN_EXTENT;

    // Handle tepat di tengah (center ~ 0) tidak diklaim sebagai sisi mana pun.
    if (center > SIDE_EPS) {
      if (isShaft) result[handle.name].shaftPos = handle;
      else result[handle.name].conePos = handle;
    } else if (center < -SIDE_EPS) {
      if (isShaft) result[handle.name].shaftNeg = handle;
      else result[handle.name].coneNeg = handle;
    }
  }
  return result;
}

/**
 * Membuat mesh mirror dari sebuah handle ke sisi seberang sumbunya.
 *
 * Geometry di-clone lalu dirotasi 180 derajat terhadap sumbu perpendicular.
 * Material di-share (tidak di-clone) supaya highlight axis aktif tetap sinkron.
 *
 * @param {THREE.Mesh} sourceHandle handle sisi positif yang mau dicerminkan
 * @param {string} axisKey 'x' | 'y' | 'z'
 * @returns {THREE.Mesh} mesh baru di sisi negatif
 */
function mirrorHandle(sourceHandle, axisKey) {
  const rotAxis = MIRROR_ROT_AXIS[axisKey];
  const matrix = new THREE.Matrix4().makeRotationAxis(rotAxis, Math.PI);

  const geometry = sourceHandle.geometry.clone();
  geometry.applyMatrix4(matrix);       // determinan +1 → winding tetap benar
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const mesh = new THREE.Mesh(geometry, sourceHandle.material);
  mesh.name = sourceHandle.name;       // 'X' | 'Y' | 'Z' — wajib untuk logika bawaan
  mesh.renderOrder = Infinity;         // sama seperti setupGizmo()
  mesh.userData[MARK] = true;          // penanda idempoten
  return mesh;
}

/**
 * Melengkapi gizmo translate menjadi 6 panah utuh (shaft + cone di ke-6 arah).
 *
 * Fungsi ini hanya MENAMBAH mesh yang kurang; tidak pernah menghapus atau
 * mengubah mesh bawaan Three.js. Aman dipanggil berulang kali.
 *
 * @param {THREE.Controls} transformControls instance TransformControls
 * @param {THREE.Object3D|null} helperRoot hasil transformControls.getHelper()
 * @returns {{ ok: boolean, added: string[], reason?: string, arrows?: Object }}
 */
export function makeSixArrows(transformControls, helperRoot = null) {
  const translateObj = findTranslateGizmo(transformControls, helperRoot);
  if (!translateObj) {
    return { ok: false, added: [], reason: 'gizmo translate tidak ditemukan' };
  }

  const added = [];

  for (const name of ['X', 'Y', 'Z']) {
    const axisKey = AXIS_KEY[name];
    // Klasifikasi ulang setiap iterasi supaya mesh yang baru ditambahkan ikut terbaca.
    const groups = classifyTranslateHandles(translateObj);
    const g = groups[name];

    // Garis (shaft) sisi negatif — inilah yang memang tidak digambar Three.js.
    if (!g.shaftNeg && g.shaftPos) {
      translateObj.add(mirrorHandle(g.shaftPos, axisKey));
      added.push(`${name}- shaft`);
    }

    // Kerucut sisi negatif — normalnya sudah ada dari Three.js. Ditambahkan
    // hanya kalau benar-benar tidak ada (mis. pernah dihapus kode lain).
    const groupsAfter = classifyTranslateHandles(translateObj);
    if (!groupsAfter[name].coneNeg && groupsAfter[name].conePos) {
      translateObj.add(mirrorHandle(groupsAfter[name].conePos, axisKey));
      added.push(`${name}- cone`);
    }
  }

  const final = classifyTranslateHandles(translateObj);
  const arrows = {};
  for (const name of ['X', 'Y', 'Z']) {
    arrows[name] = {
      shaftPos: !!final[name].shaftPos,
      shaftNeg: !!final[name].shaftNeg,
      conePos: !!final[name].conePos,
      coneNeg: !!final[name].coneNeg,
    };
  }

  return { ok: true, added, arrows };
}

/**
 * Menyembunyikan garis bantu PUTIH pada gizmo Move.
 *
 * Three.js menaruh garis bantu di `_gizmo.helper.translate`, TERPISAH dari
 * 6 panah berwarna di `_gizmo.gizmo.translate`. Isinya:
 *   - X / Y / Z : Line putih (opacity 0.5) sepanjang 1.000.000 unit yang
 *                 muncul begitu sebuah sumbu aktif (saat hover maupun drag).
 *                 Klik kotak tengah (axis 'XYZ') membuat KETIGA garis muncul
 *                 sekaligus, karena pengecekannya `this.axis.search(handle.name)`.
 *   - DELTA     : garis jejak dari posisi awal ke posisi sekarang saat drag.
 *   - START/END : dua titik kecil penanda posisi awal & akhir drag.
 *
 * Hasil akhir: yang tampil hanya 6 panah merah/hijau/biru dengan kerucutnya.
 *
 * AMAN: helper murni dekorasi visual. TransformControls me-raycast
 * `_gizmo.picker[mode]` untuk hover dan `_plane` untuk drag — helper tidak
 * pernah ikut. `updateMatrixWorld()` juga meng-iterasi `children` secara
 * dinamis (`handles.concat(...)`), jadi mengosongkan children tidak memicu
 * error index out of range.
 *
 * Geometry di-dispose karena setiap handle helper punya geometry sendiri
 * (sudah diverifikasi: 10 handle = 10 geometry unik). Material JANGAN
 * di-dispose karena satu `matHelper` dipakai bersama oleh helper translate,
 * rotate, dan scale.
 *
 * @param {THREE.Controls} transformControls instance TransformControls
 * @param {Object} [options]
 * @param {boolean} [options.keepDragTrail=false] biarkan DELTA/START/END tetap ada
 *   (garis jejak saat drag), hanya sembunyikan 3 garis panjang X/Y/Z.
 * @returns {{ ok: boolean, hidden: string[], reason?: string }}
 */
export function hideTranslateHelperLines(transformControls, options = {}) {
  const { keepDragTrail = false } = options;

  const gizmoRoot = transformControls && transformControls._gizmo;
  const helperTranslate = gizmoRoot && gizmoRoot.helper && gizmoRoot.helper.translate;
  if (!helperTranslate) {
    return { ok: false, hidden: [], reason: 'helper translate tidak ditemukan' };
  }

  // Hanya garis panjang yang bikin "garis tipis putih keluar jauh".
  const LONG_LINES = ['X', 'Y', 'Z'];
  const hidden = [];

  for (const child of [...helperTranslate.children]) {
    if (keepDragTrail && !LONG_LINES.includes(child.name)) continue;
    helperTranslate.remove(child);
    if (child.geometry) child.geometry.dispose(); // geometry unik per handle
    hidden.push(child.name);
  }

  return { ok: true, hidden };
}

/* ================================================================
 * SOLO DRAG (Phase 49 v11)
 * ================================================================
 *
 * TUJUAN
 * Saat user klik-tahan SATU panah lalu menggesernya, 5 panah lain
 * disembunyikan sementara sehingga hanya panah yang sedang dipakai yang
 * tampil. Begitu jari/mouse dilepas, keenam panah muncul kembali.
 *
 * ── MASALAH 1: Three.js tidak menyimpan SISI panah ───────────────
 * `transformControls.axis` hanya berisi 'X' / 'Y' / 'Z' tanpa tanda, karena
 * `axis` diambil dari `intersect.object.name` dan kedua sisi bernama sama.
 * Jadi menyembunyikan "yang lain" berdasarkan axis saja masih menyisakan
 * panah sisi seberang (mis. klik X+ tapi X- tetap tampil).
 *
 * SOLUSI: pakai `pointStart`. Vektor itu diisi di `pointerDown()`
 * (`planeIntersect.point - worldPositionStart`), yaitu posisi klik relatif
 * terhadap pusat gizmo. TANDA komponennya pada sumbu aktif = sisi yang diklik.
 * Sudah diverifikasi untuk 6 arah: klik X+ → pointStart.x = +3.164,
 * klik X- → -3.164, dan seterusnya.
 *
 * ── MASALAH 2: space='local' + object berotasi ───────────────────
 * `pointStart` berada di WORLD space, sedangkan saat `space='local'` panah
 * visual ikut berputar mengikuti `worldQuaternion`. Tanpa koreksi, block yang
 * diputar 90° membuat komponen sumbu jadi 0.000 → sisi tidak terdeteksi.
 * SOLUSI: kalau space='local', putar balik `pointStart` dengan inverse
 * `worldQuaternion` sebelum membaca tanda. Sudah diuji pada rotasi 0°, 45°,
 * dan 90°: tanpa koreksi ada 4 kasus salah, dengan koreksi selalu benar.
 *
 * ── MASALAH 3: updateMatrixWorld() menimpa visible tiap frame ────
 * `TransformControlsGizmo.updateMatrixWorld()` baris 1611 mengeksekusi
 * `handle.visible = true` untuk SEMUA handle setiap frame. Jadi menyetel
 * `visible = false` sekali saja akan langsung dibatalkan pada frame berikut.
 * SOLUSI: bungkus (monkey-patch) `_gizmo.updateMatrixWorld` — jalankan yang
 * asli lebih dulu, lalu terapkan penyembunyian SESUDAHNYA. Sudah diverifikasi
 * wrapper terpanggil setiap frame dan penyembunyiannya bertahan.
 *
 * ── CATATAN KEAMANAN ────────────────────────────────────────────
 * - Hanya `visible` yang disentuh; tidak ada mesh dihapus atau dibuat.
 * - Picker (jalur raycast) tidak disentuh, jadi drag tetap normal. Saat
 *   dragging Three.js juga tidak me-raycast picker lagi (`pointerHover`
 *   langsung return kalau `dragging === true`).
 * - Hanya aktif untuk mode 'translate'; mode rotate & scale tidak tersentuh.
 * - Handle non-panah (XYZ/XY/YZ/XZ) dibiarkan diatur Three.js sendiri —
 *   di project ini semuanya sudah tersembunyi lewat showXY/YZ/XZ = false.
 * - Idempoten: patch hanya dipasang sekali (ditandai lewat properti internal).
 * - Bisa dibatalkan penuh lewat `dispose()` yang dikembalikan.
 * ================================================================ */

/** Penanda supaya enableSoloDragArrow() tidak memasang patch dua kali. */
const SOLO_MARK = '__soloDragV11';

// Objek sementara dipakai ulang supaya tidak alokasi tiap frame.
const _soloTempVector = new THREE.Vector3();
const _soloTempQuat = new THREE.Quaternion();

/**
 * Menentukan sisi (+1 / -1) panah yang sedang di-drag, dari `pointStart`.
 *
 * @param {THREE.Controls} tc instance TransformControls
 * @param {string} axis 'X' | 'Y' | 'Z'
 * @returns {number} +1 sisi positif, -1 sisi negatif, 0 tidak dapat ditentukan
 */
function detectDragSide(tc, axis) {
  const axisKey = AXIS_KEY[axis];
  if (!axisKey || !tc.pointStart) return 0;

  const point = _soloTempVector.copy(tc.pointStart);

  // space 'local': panah ikut rotasi object, pointStart tidak → putar balik.
  if (tc.space === 'local' && tc.worldQuaternion) {
    _soloTempQuat.copy(tc.worldQuaternion).invert();
    point.applyQuaternion(_soloTempQuat);
  }

  const component = point[axisKey];
  if (component > SIDE_EPS) return 1;
  if (component < -SIDE_EPS) return -1;
  return 0;
}

/**
 * Mengaktifkan mode "solo" saat drag: hanya panah yang sedang di-drag yang
 * tampil, 5 panah lain disembunyikan sementara, lalu muncul lagi saat dilepas.
 *
 * Harus dipanggil SETELAH makeSixArrows() supaya semua mesh panah sudah ada.
 *
 * @param {THREE.Controls} transformControls instance TransformControls
 * @param {THREE.Object3D|null} helperRoot hasil transformControls.getHelper()
 * @returns {{ ok: boolean, dispose?: function, reason?: string }}
 *   `dispose()` memulihkan `updateMatrixWorld` asli dan menampilkan semua panah.
 */
export function enableSoloDragArrow(transformControls, helperRoot = null) {
  const gizmoRoot = transformControls && transformControls._gizmo;
  if (!gizmoRoot || typeof gizmoRoot.updateMatrixWorld !== 'function') {
    return { ok: false, reason: 'TransformControlsGizmo tidak ditemukan' };
  }

  const translateObj = findTranslateGizmo(transformControls, helperRoot);
  if (!translateObj) {
    return { ok: false, reason: 'gizmo translate tidak ditemukan' };
  }

  // Idempoten: kalau sudah dipasang, kembalikan dispose yang sudah ada.
  if (gizmoRoot[SOLO_MARK]) {
    return { ok: true, dispose: gizmoRoot[SOLO_MARK].dispose, alreadyEnabled: true };
  }

  // Peta mesh → sisi (+1/-1), dihitung SEKALI dari bounding box geometry.
  // Aman karena setupGizmo() sudah mem-bake posisi ke geometry, jadi nilainya
  // tidak berubah walau gizmo bergerak/berskala mengikuti kamera.
  const sideOfMesh = new Map();
  const groups = classifyTranslateHandles(translateObj);
  for (const axis of ['X', 'Y', 'Z']) {
    const g = groups[axis];
    if (g.shaftPos) sideOfMesh.set(g.shaftPos, 1);
    if (g.conePos) sideOfMesh.set(g.conePos, 1);
    if (g.shaftNeg) sideOfMesh.set(g.shaftNeg, -1);
    if (g.coneNeg) sideOfMesh.set(g.coneNeg, -1);
  }

  const originalUpdate = gizmoRoot.updateMatrixWorld;

  gizmoRoot.updateMatrixWorld = function (force) {
    // Jalankan logika asli dulu (auto-scale, highlight, visible = true, dll).
    originalUpdate.call(this, force);

    // Solo hanya berlaku saat benar-benar men-drag sebuah sumbu di mode translate.
    if (this.mode !== 'translate') return;
    if (!transformControls.dragging) return;

    const axis = transformControls.axis;
    if (!AXIS_KEY[axis]) return;   // XYZ / XY / YZ / XZ → tidak di-solo

    const side = detectDragSide(transformControls, axis);
    if (side === 0) return;        // sisi tidak jelas → jangan sembunyikan apa pun

    for (const mesh of translateObj.children) {
      if (!AXIS_KEY[mesh.name]) continue;              // lewati handle non-panah
      const meshSide = sideOfMesh.get(mesh);
      if (meshSide === undefined) continue;            // mesh tak terklasifikasi
      // Tampilkan HANYA mesh pada sumbu aktif DAN sisi yang diklik.
      if (mesh.name !== axis || meshSide !== side) mesh.visible = false;
    }
  };

  const dispose = () => {
    gizmoRoot.updateMatrixWorld = originalUpdate;
    delete gizmoRoot[SOLO_MARK];
    for (const mesh of translateObj.children) {
      if (AXIS_KEY[mesh.name]) mesh.visible = true;
    }
  };

  gizmoRoot[SOLO_MARK] = { dispose };
  return { ok: true, dispose };
}

/**
 * Mengubah warna SEMUA handle gizmo translate menjadi 1 warna solid.
 * Digunakan untuk mode Clone (biru muda) dan Mirror (ungu) supaya user
 * bisa membedakan mode dengan cepat dari warna panah.
 * 
 * Original colors di-simpan di userData supaya bisa di-restore.
 * Material TIDAK di-clone — warna diubah langsung di material existing.
 *
 * @param {THREE.Controls} transformControls instance TransformControls
 * @param {THREE.Object3D|null} helperRoot hasil transformControls.getHelper()
 * @param {string|number} color warna hex (misal '#0096FF' atau 0x0096FF)
 * @returns {{ ok: boolean, changed: number, error?: string }}
 */
export function setGizmoColor(transformControls, helperRoot, color) {
  try {
    const translateObj = findTranslateGizmo(transformControls, helperRoot);
    if (!translateObj || !translateObj.children) {
      return { ok: false, changed: 0, error: 'translate gizmo not found' };
    }

    const threeColor = new THREE.Color(color);
    let changed = 0;

    for (const handle of translateObj.children) {
      if (!AXIS_KEY[handle.name]) continue; // lewati XYZ/XY/YZ/XZ
      if (!handle.material) continue;

      const mat = handle.material;
      
      // Simpan original color SEKALI SAJA (saat pertama kali dipanggil)
      if (!handle.userData.__originalColor && mat.color) {
        handle.userData.__originalColor = mat.color.clone();
      }

      // Ubah warna LANGSUNG di material existing (tidak clone material)
      if (mat.color) {
        mat.color.copy(threeColor);
        changed++;
      }
    }

    return { ok: true, changed };
  } catch (e) {
    return { ok: false, changed: 0, error: e.message };
  }
}

/**
 * Mengembalikan warna gizmo ke default (merah/hijau/biru).
 *
 * @param {THREE.Controls} transformControls instance TransformControls
 * @param {THREE.Object3D|null} helperRoot hasil transformControls.getHelper()
 * @returns {{ ok: boolean, restored: number, error?: string }}
 */
export function resetGizmoColors(transformControls, helperRoot) {
  try {
    const translateObj = findTranslateGizmo(transformControls, helperRoot);
    if (!translateObj || !translateObj.children) {
      return { ok: false, restored: 0, error: 'translate gizmo not found' };
    }

    let restored = 0;

    for (const handle of translateObj.children) {
      if (!AXIS_KEY[handle.name]) continue;
      if (!handle.userData.__originalColor) continue;
      if (!handle.material || !handle.material.color) continue;

      // Restore original color
      handle.material.color.copy(handle.userData.__originalColor);
      restored++;
    }

    return { ok: true, restored };
  } catch (e) {
    return { ok: false, restored: 0, error: e.message };
  }
}

export default makeSixArrows;
