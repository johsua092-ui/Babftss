/**
 * ================================================================
 * blockStuds.js — Phase 72 (2026-09-15): STANDAR PENGUKURAN "STUDS"
 * ================================================================
 *
 * ATURAN USER (MUTLAK, KONTRAK PERMANEN — bab "STANDAR PENGUKURAN"):
 *   1. Semua pengukuran dimensi di Babftss WAJIB pakai satuan "studs".
 *   2. Block biasa BELUM di-scale = 2 × 2 × 2 studs (P×L×T) — MUTLAK.
 *   3. Satu sel grid = 2 × 2 studs.
 *   4. UI yang menampilkan dimensi block: default "2, 2, 2".
 *
 * Konversi: geometry block di scene = kubus 1×1×1 unit (scale 1,1,1),
 * 1 sel grid = 1 unit dunia → STUDS_PER_UNIT = 2.
 * Block ter-scale s → 2×|s| studs di sumbu itu.
 *
 * Keluarga-5 gizmo (move/rotate/scale/clone/mirror): panel info block
 * (view + dimensi studs). Phase 72 = SCALE dulu (uji coba user); anggota
 * lain menyusul — helper ini sudah generik lintas sumbu & mode.
 */

/** 1 block normal (1 unit dunia) = 2 studs. MUTLAK, jangan diubah. */
export const STUDS_PER_BLOCK = 2;

/** Format studs 1 desimal, buang ".0" (2.5 → "2.5", 2 → "2"). */
function fmtStuds(n) {
  const v = Math.abs(n);
  const s = v.toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}

/**
 * Dimensi studs P×L×T dari scale THREE (objek block kubus 1×1×1).
 * Urutan HUD user: P (x) , L (z), T (y) — default "2, 2, 2".
 * Kaca (−x mirror) dibaca absolut — dimensi tetap positif.
 */
export function scaleToStuds(scale) {
  const s = scale || { x: 1, y: 1, z: 1 };
  return [
    STUDS_PER_BLOCK * Math.abs(s.x || 0),
    STUDS_PER_BLOCK * Math.abs(s.z || 0),
    STUDS_PER_BLOCK * Math.abs(s.y || 0),
  ];
}

/** Tulisan HUD: "2, 2, 2" (P, L, T) — dipakai panel GizmoBlockInfo. */
export function scaleToStudsLabel(scale) {
  return scaleToStuds(scale).map(fmtStuds).join(', ');
}
