/**
 * blockScale.js — Fix 2 bug tool Scale (user 2026-09-11, WAJIB ABSOLUT semua block).
 *
 * BUG 1 — "scale kecil → tembus ke belakang → jebol → membesar lagi":
 *   TransformControls menghitung scale = _scaleStart × tempVector2 saat
 *   drag (baris 671 TransformControls.js) — tempVector2 BEBAS melewati 0
 *   (negatif) → block TERBALIK ("jebol ke arah lain") lalu makin negatif
 *   makin membesar di sisi terbalik. v1 clamp mempertahankan tanda HASIL
 *   → crossing nol tetap menghasilkan -0.05 (masih terbalik!) — BUG v1
 *   yang ditemukan user "jebol ke arah lain lalu malah lanjut scale".
 *   v2 BENAR: TANDA per-sumbu DIKUNCI ke tanda saat drag MULAI (snapshot
 *   _scaleStart di dragging-start); crossing nol hanya mentok di ±0.05
 *   (pipih), block TIDAK PERNAH terbalik selama drag. Block kaca/mirror
 *   (-x dari modul mirror) tetap -x selama di-scale (tanda awalnya -).
 *
 * BUG 2 — "tekstur melar ketarik molor": tiling UV per-wajah
 *   (wajah ±X repeat |sz|,|sy|; ±Y |sx|,|sz|; ±Z |sx|,|sy|), basis UV
 *   disimpan sekali (idempoten tiap frame), RepeatWrapping: >1 LOOP
 *   (tile berderet), <1 CROP (makin kecil makin hilang). Terverifikasi
 *   vision + unit (Phase 67) — tidak berubah di v2.
 */

export const MIN_ABS_SCALE = 0.05; // 5% — "kecil pipih banget" sah, TIDAK jebol

/**
 * Clamp scale per-sumbu — versi DRAG-AWARE v2.1 "DINDING NOL".
 * signRef = scale saat drag MULAI (snapshotScaleDragStart di dragging-start).
 * Perilaku (permintaan user: "pipih banget TIDAK perlu jebol jadi membesar
 * lagi? buat apa kocak!"):
 *   - Tanda hasil DIKUNCI ke tanda signRef (block tidak pernah TERBALIK;
 *     kaca tetap kaca).
 *   - CROSSING NOL = DINDING: saat user drag melewati nol, nilai MENTOK di
 *     signRef × MIN_ABS dan TIDAK membesar lagi selama drag masih di sisi
 *     seberang — sampai user membalik arah drag (nilai balik mengikuti
 *     |start×temp| secara normal).
 *   - signRef null/0 (place/restore path, bukan drag) → fallback: clamp
 *     abs-min mempertahankan tanda nilai saat itu.
 */
export function clampBlockScale(scale, signRef) {
  if (!scale) return false;
  let clamped = false;
  ['x', 'y', 'z'].forEach(axis => {
    const v = scale[axis];
    if (typeof v !== 'number' || Number.isNaN(v)) return;
    if (signRef) {
      const refSign = signRef[axis] < 0 ? -1 : 1;
      const crossed = (v < 0) !== (refSign < 0); // tanda beda = user lewati nol
      if (crossed) {
        // DINDING: mentok pipih di sisi ASAL — tidak terbalik, tidak
        // membesar lagi selama masih di sisi seberang.
        scale[axis] = refSign * MIN_ABS_SCALE;
        clamped = true;
      } else if (Math.abs(v) < MIN_ABS_SCALE) {
        scale[axis] = refSign * MIN_ABS_SCALE;
        clamped = true;
      }
    } else {
      // Non-drag (place/restore): abs-min, tanda nilai dipertahankan.
      if (Math.abs(v) < MIN_ABS_SCALE) {
        scale[axis] = v < 0 ? -MIN_ABS_SCALE : MIN_ABS_SCALE;
        clamped = true;
      }
    }
  });
  return clamped;
}

/**
 * Snapshot tanda+nilai scale saat drag MULAI — dipanggil dari
 * 'dragging-changed' (e.value === true) sebelum drag berjalan.
 * Disimpan di userData.__scaleDragStart.
 */
export function snapshotScaleDragStart(mesh) {
  if (!mesh || !mesh.scale) return null;
  mesh.userData.__scaleDragStart = { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z };
  return mesh.userData.__scaleDragStart;
}

/**
 * Bersihkan snapshot drag (dipanggil di drag end) — supaya place/restore
 * path tidak memakai tanda drag lama.
 */
export function clearScaleDragStart(mesh) {
  if (mesh && mesh.userData) delete mesh.userData.__scaleDragStart;
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
 * dipanggil tiap frame drag. Return true kalau UV di-update (kubus Box).
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
