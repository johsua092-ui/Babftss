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

export default makeSixArrows;
