/**
 * blockScale.js — Fix 2 bug tool Scale (user 2026-09-11, WAJIB ABSOLUT semua block).
 *
 * BUG 1 — "scale kecil → tembus ke belakang → jebol → membesar lagi":
 *   TransformControls membiarkan scale lewat 0 → negatif. Fix: clamp
 *   per-sumbu MIN_ABS, TANDA dipertahankan (scale.x negatif dari kaca/mirror sah).
 *
 * BUG 2 — "tekstur melar ketarik molor":
 *   BoxGeometry UV tiap wajah = 0..1 → scale memanjang MELAR texture.
 *   Fix: UV per-wajah dikali ukuran ABSOLUT sumbu block (basis disimpan
 *   sekali di userData — idemponen, tidak menumpuk antar frame):
 *     wajah ±X (plane YZ): repeat (|sz|, |sy|)
 *     wajah ±Y (plane XZ): repeat (|sx|, |sz|)
 *     wajah ±Z (plane XY): repeat (|sx|, |sy|)
 *   + wrapS/T RepeatWrapping (sudah di getBlockTexture).
 *   Efek (persis request user): memanjang = tekstur LOOP DIRINYA
 *   (tile kembar muncul berderet), mengecil = CROP (uv range < 1 =
 *   bagian texture, makin kecil makin banyak yang hilang).
 *   Tekstur TIDAK PERNAH melar lagi — absolut semua block kubus.
 *
 *   Kenapa UV bukan texture.repeat? Texture object SHARED lintas block
 *   (cache getBlockTexture) — repeat per-block di texture = semua block
 *   ikut berubah. BoxGeometry dibuat BARU per place → UV unik per block,
 *   aman dimutasi. Block non-Box (uv.count ≠ 24) di-skip otomatis.
 *
 *   Urutan wajah BoxGeometry r185: 0..5 = +X, -X, +Y, -Y, +Z, -Z,
 *   4 verts per wajah, uv basis quad (0/1, 0/1).
 */

export const MIN_ABS_SCALE = 0.05; // 5% — "kecil pipih banget" sah, TIDAK jebol

/** Clamp scale per-sumbu (absolut min, tanda dipertahankan). Mutasi in-place. */
export function clampBlockScale(scale) {
  if (!scale) return false;
  let clamped = false;
  ['x', 'y', 'z'].forEach(axis => {
    const v = scale[axis];
    if (typeof v !== 'number' || Number.isNaN(v)) return;
    if (Math.abs(v) < MIN_ABS_SCALE) {
      scale[axis] = v < 0 ? -MIN_ABS_SCALE : MIN_ABS_SCALE;
      clamped = true;
    }
  });
  return clamped;
}

/** Simpan UV basis (0..1 quad asli) SEKALI di userData. */
function ensureUvBase(mesh, uv) {
  if (mesh.userData.__uvBase && mesh.userData.__uvBase.length === 48) return;
  const base = new Float32Array(48);
  for (let i = 0; i < 48; i++) base[i] = uv.array[i];
  mesh.userData.__uvBase = base;
}

/**
 * Sinkron UV geometry block ke scale saat ini (tiling anti-melar).
 * BASIS-FIRST: selalu hitung dari basis tersimpan → idempoten, aman
 * dipanggil tiap frame drag. Return true kalau UV di-update (block kubus).
 */
export function syncBlockTextureTiling(mesh) {
  if (!mesh || !mesh.geometry || !mesh.scale) return false;
  const uv = mesh.geometry.attributes.uv;
  if (!uv || !uv.array || uv.count !== 24) return false; // hanya BoxGeometry kubus
  ensureUvBase(mesh, uv);
  const base = mesh.userData.__uvBase;
  const ax = Math.abs(mesh.scale.x) || 1;
  const ay = Math.abs(mesh.scale.y) || 1;
  const az = Math.abs(mesh.scale.z) || 1;
  const faceRepeat = [
    [az, ay], [az, ay],   // +X, -X (plane YZ)
    [ax, az], [ax, az],   // +Y, -Y (plane XZ)
    [ax, ay], [ax, ay],   // +Z, -Z (plane XY)
  ];
  for (let i = 0; i < 24; i++) {
    const face = Math.floor(i / 4);
    const [ru, rv] = faceRepeat[face];
    uv.array[i * 2] = base[i * 2] * ru;
    uv.array[i * 2 + 1] = base[i * 2 + 1] * rv;
  }
  uv.needsUpdate = true;
  return true;
}
