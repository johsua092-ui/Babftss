/**
 * blockMeta.js — SISTEM METADATA INTERNAL (underground) untuk block/objek 3D.
 * 2026-10-01. Permintaan user: saat meng-import 3D design, sistem WAJIB bisa
 * membaca presisi: KOORDINAT (posisi), ROTASI, SCALE, + 6 ARAH SISI
 * (x-/x+/y-/y+/z-/z+). Sistem ini HANYA untuk engine/backend — TIDAK ada UI
 * untuk user (user tidak perlu lihat; sistem butuh agar pembacaan presisi).
 *
 * PRINSIP KOORDINAT (permintaan user): TITIK PALING TENGAH objek = titik
 * koordinat (0,0,0). Jadi `position` = PUSAT objek (bukan sudut/bottom).
 * Ini KONSISTEN dengan konvensi block simulator (position block = titik tengah).
 *
 * Modul MURNI (THREE = parameter) → bisa diuji di Node tanpa browser.
 */

// 6 arah sisi (normal LOKAL). Label sesuai permintaan user: x-, x+, y-, y+, z-, z+.
export const FACE_DIRS = [
  { id: 'x+', label: 'X+', normal: [1, 0, 0] },
  { id: 'x-', label: 'X-', normal: [-1, 0, 0] },
  { id: 'y+', label: 'Y+', normal: [0, 1, 0] },
  { id: 'y-', label: 'Y-', normal: [0, -1, 0] },
  { id: 'z+', label: 'Z+', normal: [0, 0, 1] },
  { id: 'z-', label: 'Z-', normal: [0, 0, -1] },
];

/**
 * Hitung 6 arah sisi objek di RUANG DUNIA = normal lokal di-rotate quaternion.
 * Inilah "deteksi x-/x+/y-/y+/z-/z+" yang presisi (turunan dari rotasi).
 * @returns {Array<{id,label,dir:[x,y,z]}>}
 */
export function computeFaceDirections(THREE, quat) {
  return FACE_DIRS.map((f) => {
    const v = new THREE.Vector3(f.normal[0], f.normal[1], f.normal[2])
      .applyQuaternion(quat).normalize();
    return { id: f.id, label: f.label, dir: [v.x, v.y, v.z] };
  });
}

/**
 * Metadata lengkap sebuah objek (block / model impor):
 *   - position/rotation/scale (dari world matrix)
 *   - quaternion
 *   - size (bounding box) + center (bbox center di dunia)
 *   - faces (6 arah sisi dunia)
 *   - faceCenters (titik pusat tiap sisi dunia = center + dir × halfExtent)
 *   - slug / imported (identitas)
 * @param {object} mesh objek Three.js
 * @returns {object|null}
 */
export function computeBlockMetadata(THREE, mesh) {
  if (!mesh || !mesh.isObject3D) return null;
  mesh.updateMatrixWorld(true);

  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  mesh.matrixWorld.decompose(pos, quat, scl);
  const euler = new THREE.Euler().setFromQuaternion(quat, 'XYZ');

  // Bounding box DUNIA → size + center (size = AABB dunia, termasuk efek rotasi)
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const half = size.clone().multiplyScalar(0.5);

  // LOCAL size (tanpa rotasi) = dimensi ASLI objek (geometry bbox × scale).
  // Berguna utk "ukuran sebenarnya" (rotation-independent) — mis. 2×1.5 = 3.
  let localSize = null;
  if (mesh.isMesh && mesh.geometry) {
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const gb = mesh.geometry.boundingBox;
    if (gb) {
      localSize = new THREE.Vector3(
        (gb.max.x - gb.min.x) * Math.abs(scl.x),
        (gb.max.y - gb.min.y) * Math.abs(scl.y),
        (gb.max.z - gb.min.z) * Math.abs(scl.z),
      );
    }
  }

  const faces = computeFaceDirections(THREE, quat);
  // Titik pusat tiap sisi (untuk penempatan presisi / decal / snap sisi).
  const faceCenters = faces.map((f) => ({
    id: f.id, label: f.label, dir: f.dir,
    point: [
      center.x + f.dir[0] * half.x,
      center.y + f.dir[1] * half.y,
      center.z + f.dir[2] * half.z,
    ],
  }));

  const r3 = (n) => Math.round(n * 1e6) / 1e6; // 6 desimal presisi
  const P = (v) => ({ x: r3(v.x), y: r3(v.y), z: r3(v.z) });

  return {
    position: P(pos),
    rotation: { x: r3(euler.x), y: r3(euler.y), z: r3(euler.z) }, // radian (XYZ)
    rotationDeg: {
      x: r3((euler.x * 180) / Math.PI),
      y: r3((euler.y * 180) / Math.PI),
      z: r3((euler.z * 180) / Math.PI),
    },
    quaternion: { x: r3(quat.x), y: r3(quat.y), z: r3(quat.z), w: r3(quat.w) },
    scale: P(scl),
    size: P(size),                 // AABB dunia (termasuk efek rotasi)
    localSize: localSize ? P(localSize) : null, // dimensi asli (tanpa rotasi)
    center: P(center),
    halfExtent: P(half),
    faces,
    faceCenters,
    slug: mesh.userData?.blockSlug || null,
    imported: !!mesh.userData?.importedGlb,
    uuid: mesh.uuid,
    // versi skema (untuk kompatibilitas ke depan)
    schema: 1,
  };
}

/** Simpan metadata ke userData (cache) — idempoten. */
export function updateBlockMeta(THREE, mesh) {
  if (!mesh || !mesh.userData) return null;
  const meta = computeBlockMetadata(THREE, mesh);
  mesh.userData.__meta = meta;
  return meta;
}

/** Ambil metadata (pakai cache userData kalau ada; hitung ulang kalau diminta). */
export function getBlockMeta(mesh, fresh = false) {
  if (!mesh || !mesh.userData) return null;
  if (!fresh && mesh.userData.__meta) return mesh.userData.__meta;
  return mesh.userData.__meta || null;
}

/** Hapus cache metadata (saat objek diubah/dihapus). */
export function clearBlockMeta(mesh) {
  if (mesh && mesh.userData) delete mesh.userData.__meta;
}

/**
 * REGISTRY internal (Map uuid → meta) — "sistem underground".
 * Dipakai engine untuk membaca semua objek cepat tanpa traverse scene.
 */
const _registry = new Map();

export function registerBlockMeta(THREE, mesh) {
  const meta = updateBlockMeta(THREE, mesh);
  if (meta) _registry.set(mesh.uuid, meta);
  return meta;
}
export function unregisterBlockMeta(mesh) {
  if (mesh) _registry.delete(mesh.uuid);
}
export function refreshAllMeta(THREE, blocks) {
  (blocks || []).forEach((b) => registerBlockMeta(THREE, b));
  return _registry.size;
}
export function getAllMeta() {
  return Array.from(_registry.values());
}
export function getMetaByUuid(uuid) {
  return _registry.get(uuid) || null;
}
export function clearRegistry() {
  _registry.clear();
}
