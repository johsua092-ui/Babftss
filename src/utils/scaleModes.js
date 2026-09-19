/* ================================================================
   scaleModes.js — Phase 73 (2026-09-15)
   ATURAN SCALING 4 MODE (permintaan user)
   ================================================================
   User: "itu adalah aturan scaling! ... yang sekarang terjadi jika
   user scale klik tahan bola gizmo lalu geser maka 2 sisi akan
   memanjang — dan sebenarnya detik ini kita sedang menggunakan
   '2 side' secara tidak sadar! sistem yang itu DIPERTAHANKAN."

   EMPAT MODE:
   ┌────────┬──────────────────────────────────────────────────────┐
   │ 1 side │ HANYA sisi yang digenggam memanjang; sisi seberang    │
   │        │ WAJIB DIAM. Sumbu lain tidak tersentuh.              │
   │ 2 side │ BAWAAN (JANGAN DISENTUH) — scale sumbu itu saja;     │
   │        │ Three.js men-scale dari pusat → 2 sisi simetris.     │
   │ 4 side │ DUA SUMBU LAIN di-scale; sumbu yang DIGENGGAM DIAM.  │
   │        │ Genggam bola atas (Y) → kanan/kiri/depan/belakang    │
   │        │ memanjang, atas-bawah diam. Ikut rotasi block.       │
   │ 6 side │ Ketiga sumbu di-scale → block membesar seluruhnya.   │
   └────────┴──────────────────────────────────────────────────────┘

   ANGKA HASIL PROBE (node, BoxGeometry(1,1,1) bbox -0.5..0.5):
   - 2 side, scale.x 1→2 : X+ bergeser +0.500, X- bergeser -0.500
   - 1 side, offset = sign × (sNew − sStart) × (size/2) = +0.500
       → X- (seberang) 0.000 pergeseran; X+ memanjang penuh 1.000
   - 1 side saat block dirotasi 45°:
       sumbu DUNIA mentah  → seberang MELESET 0.3827  (SALAH)
       axisLocal × quaternion → seberang MELESET 0.0000  (BENAR)
     ⚠ WARISAN #54 KONTRAK: offset handle WAJIB satu frame referensi
       dengan bake — sumbu LOKAL diputar worldQuaternion, BUKAN sumbu
       dunia mentah. Bug ini persis pengulangan Phase 70 v6.

   DESAIN MODUL (kontrak ATURAN #5 — ubah sekecil mungkin):
   - Modul MURNI: tidak meng-import three; THREE dilewatkan sebagai
     PARAMETER (pola blockMaterials.js — warisan #38: `new THREE.X`
     di modul non-import = ReferenceError runtime).
   - Mode '2side' mengembalikan instruksi "scale sumbu itu saja",
     yaitu perilaku BAWAAN — pemanggil tinggal jalan seperti biasa,
     nol cabang tambahan di jalur 2 side (jaminan tak tersentuh).
   ================================================================ */

import { STUDS_PER_BLOCK } from './blockStuds.js';

// ── Phase 75 (2026-09-19, sesi server z.ai): snap scale ke kelipatan studs ──
// User minta: input studs di ScaleNumberModal = STEP untuk drag bola gizmo,
// bukan SET langsung. Saat user drag, perubahan scale disesuaikan ke
// kelipatan step. Implementasi: tambah parameter `snapStudStep` ke
// applyScaleByMode. Snap relatif ke startScale[axis] supaya block tidak
// melompat kalau user belum drag (raw = startScale → delta = 0 →
// snappedDelta = 0 → finalScale = startScale).
// Formula: stepScale = snapStudStep / STUDS_PER_BLOCK (studs → scale factor).
// Snap HANYA sumbu yang di-scale oleh mode (axes), bukan semua sumbu.
// Untuk mode 2 side: scaleDragRef.current = null → applyScaleByMode TIDAK
// dipanggil → snap TIDAK aktif di mode 2 side (jalur lama Three.js
// men-scale sumbu yang digenggam langsung tanpa hook). User kalau mau
// snap, pilih mode 1/4/6 side.
// ──

export const SCALE_MODES = ['1side', '2side', '4side', '6side'];

/** Mode default saat user pertama masuk / menekan Cancel (permintaan user). */
export const DEFAULT_SCALE_MODE = '1side';

/** Label UI per mode (dipakai tombol modal + toast + panel info). */
export const SCALE_MODE_LABEL = {
  '1side': '1 Side',
  '2side': '2 Side',
  '4side': '4 Side',
  '6side': '6 Side',
};

/** Penjelasan singkat per mode — dipakai di modal (bahasa user: Indonesia). */
export const SCALE_MODE_DESC = {
  '1side': 'Hanya sisi yang kamu tarik yang memanjang. Sisi seberang diam.',
  '2side': 'Sisi yang ditarik dan sisi seberangnya memanjang bersamaan.',
  '4side': 'Empat sisi di sekelilingnya memanjang. Sisi yang ditarik diam.',
  '6side': 'Semua sisi memanjang — block membesar ke segala arah.',
};

/** Normalisasi nilai mode apa pun ke salah satu SCALE_MODES. */
export function normalizeScaleMode(mode) {
  return SCALE_MODES.includes(mode) ? mode : DEFAULT_SCALE_MODE;
}

/**
 * Sumbu mana saja yang di-scale untuk sebuah mode, saat user menggenggam
 * bola sumbu `axisKey` ('x' | 'y' | 'z').
 *
 * 1side/2side → sumbu yang digenggam saja.
 * 4side       → DUA sumbu LAIN (yang digenggam DIAM).
 * 6side       → ketiganya.
 */
export function getScaledAxes(mode, axisKey) {
  const m = normalizeScaleMode(mode);
  const all = ['x', 'y', 'z'];
  if (m === '6side') return all;
  if (m === '4side') return all.filter((a) => a !== axisKey);
  return [axisKey];
}

/**
 * Apakah mode ini butuh kompensasi posisi supaya sisi seberang DIAM?
 * Hanya 1side. (2side simetris; 4side & 6side memang tumbuh dari pusat.)
 */
export function needsAnchorOffset(mode) {
  return normalizeScaleMode(mode) === '1side';
}

/**
 * Hitung offset posisi DUNIA untuk mode 1side.
 *
 * Kenapa perlu: Three.js men-scale dari PUSAT object. Supaya sisi seberang
 * tetap di tempat, pusat harus digeser setengah dari pertambahan panjang,
 * ke arah sisi yang digenggam.
 *
 *   offset = axisWorld × sign × (scaleBaru − scaleAwal) × (halfSize)
 *
 * `axisWorld` WAJIB sumbu LOKAL block yang sudah diputar worldQuaternion
 * (warisan #54) — memakai sumbu dunia mentah membuat sisi seberang meleset
 * 0.3827 pada block yang dirotasi 45° (terukur probe).
 *
 * @param {object} THREE      namespace three (pola parameter — warisan #38)
 * @param {object} object     mesh block
 * @param {string} axisKey    'x' | 'y' | 'z'
 * @param {number} sign       +1 kalau bola sisi positif, −1 kalau negatif
 * @param {number} scaleStart nilai scale saat drag dimulai
 * @param {number} scaleNew   nilai scale sekarang
 * @param {number} halfSize   setengah ukuran GEOMETRY pada sumbu itu (biasanya 0.5)
 * @returns {object|null}     THREE.Vector3 offset, atau null kalau tidak perlu
 */
export function computeAnchorOffset(THREE, object, axisKey, sign, scaleStart, scaleNew, halfSize, frameQuat = null) {
  if (!THREE || !object) return null;
  const delta = (scaleNew - scaleStart) * (sign >= 0 ? 1 : -1) * halfSize;
  if (!isFinite(delta) || delta === 0) return null;
  const local = new THREE.Vector3(
    axisKey === 'x' ? 1 : 0,
    axisKey === 'y' ? 1 : 0,
    axisKey === 'z' ? 1 : 0,
  );
  // WARISAN #54: sumbu lokal → dunia lewat quaternion object.
  // WARISAN #59: frameQuat DIKUNCI pemanggil (mode ikut-rotasi block =
  // worldQuaternion; world-align dicabut = identity → sumbu DUNIA).
  const q = frameQuat
    ? frameQuat
    : (object.getWorldQuaternion ? object.getWorldQuaternion(new THREE.Quaternion()) : object.quaternion);
  return local.applyQuaternion(q).multiplyScalar(delta);
}

/**
 * Tentukan FRAME referensi (sumbu) + SIGN sisi bola yang digenggam saat drag
 * scale. Ini pengulangan PERSIS logika detectDragSide (gizmoScaleBalls.js)
 * dalam bentuk murni yang bisa diuji tanpa browser.
 *
 *  - worldAlign !== false (checkbox "arrow match rotation" TERCENTANG, DEFAULT):
 *    bola mengikuti rotasi block → frame = worldQuaternion object (LOKAL).
 *  - worldAlign === false (DICABUT): bola TEGAK LURUS dunia → frame IDENTITY
 *    (sumbu DUNIA). WARISAN #59 — offset & sisi WAJIB bercabang per-mode.
 *
 * @returns {{axisKey:string, sign:number, frameQuat:object}|null}
 */
export function computeScaleModeFrame(THREE, axis, pointStart, worldQuaternion, worldAlign) {
  if (!THREE) return null;
  const axisKey = (axis || '').toLowerCase();
  if (axisKey !== 'x' && axisKey !== 'y' && axisKey !== 'z') return null;
  const usesWorld = worldAlign === false;
  const frameQuat = usesWorld
    ? new THREE.Quaternion()                                   // identity = sumbu DUNIA
    : (worldQuaternion ? worldQuaternion.clone() : new THREE.Quaternion());
  let sign = 1;
  if (pointStart) {
    // Poin genggam (world) diputar-balik ke frame → komponen = sisi bola.
    const p = pointStart.clone().applyQuaternion(frameQuat.clone().invert());
    sign = p[axisKey] >= 0 ? 1 : -1;
  }
  return { axisKey, sign, frameQuat };
}

/**
 * Setengah ukuran geometry block pada sumbu tertentu (default 0.5 untuk
 * BoxGeometry(1,1,1)). Dibaca dari bounding box GEOMETRY (local space) —
 * JANGAN Box3.setFromObject (itu world, sudah ikut ter-scale → dobel hitung;
 * warisan Phase 60 v3 butir 2).
 */
export function getGeometryHalfSize(object, axisKey) {
  try {
    const g = object && object.geometry;
    if (!g) return 0.5;
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox;
    if (!bb) return 0.5;
    const span = (bb.max[axisKey] - bb.min[axisKey]) / 2;
    return isFinite(span) && span > 0 ? span : 0.5;
  } catch (e) {
    return 0.5;
  }
}

/**
 * Terapkan rasio scale ke object sesuai mode — SATU pintu masuk untuk
 * semua penulis scale (kontrak warisan #20: logika yang menyentuh
 * material/transform block wajib terpusat, dilarang inline berulang).
 *
 * @param {object} THREE
 * @param {object} object      mesh block
 * @param {string} mode        '1side' | '2side' | '4side' | '6side'
 * @param {string} axisKey     sumbu bola yang digenggam
 * @param {number} sign        +1 / −1 sisi bola
 * @param {object} startScale  snapshot {x,y,z} saat drag mulai
 * @param {object} startPos    snapshot {x,y,z} posisi saat drag mulai
 * @param {number} ratio       rasio drag (1 = tidak berubah)
 * @param {number} minAbs      batas minimum absolut (0.05 — Phase 67)
 */
export function applyScaleByMode(THREE, object, mode, axisKey, sign, startScale, startPos, ratio, minAbs = 0.05, frameQuat = null, snapStudStep = null) {
  const m = normalizeScaleMode(mode);
  const axes = getScaledAxes(m, axisKey);
  const r = isFinite(ratio) ? Math.max(0, ratio) : 1;

  // RESET dulu SEMUA sumbu ke nilai awal (tanda identitas dipertahankan —
  // kaca −x sah, Phase 67). WAJIB ada karena jalur drag NYATA (TransformControls
  // baris 671) men-set object.scale[sumbu digenggam] = _scaleStart × tempVector2
  // SEBELUM handler kita jalan — pada mode 4side sumbu digenggam harus DIAM,
  // jadi nilai library itu HARUS dikembalikan ke awal. (Terbukti: tanpa reset,
  // 4side men-scale sumbu digenggam = bug.)
  for (const a of ['x', 'y', 'z']) {
    const s0 = startScale[a];
    const sgn = s0 >= 0 ? 1 : -1;
    object.scale[a] = sgn * Math.max(Math.abs(s0), minAbs);
  }

  // Terapkan rasio HANYA ke sumbu mode ini.
  for (const a of axes) {
    const s0 = startScale[a];
    const sgn = s0 >= 0 ? 1 : -1;
    object.scale[a] = sgn * Math.max(Math.abs(s0) * r, minAbs);
  }

  // 1side: geser pusat supaya sisi seberang DIAM.
  // PHASE 78 (2026-09-19, sesi server z.ai): snap logic HAPUS dari
  // applyScaleByMode (pindah ke snapScaleFinal yang dipanggil SAAT
  // MOUSEUP / drag selesai). Sebelum Phase 78, snap jalan SETIAP
  // FRAME di applyScaleByMode → saat snap lompat antar step, scale
  // berubah cepat → computeAnchorOffset (yang pakai scale untuk
  // hitung offset posisi) juga lompat → posisi block GOYANG.
  //
  // Phase 77 fix goyang dengan SKIP computeAnchorOffset saat snap
  // aktif — TAPI break mode 1 side semantics (sisi seberang tidak
  // diam, user komplain "kok di mode 1side 2 sisi ke scale?").
  //
  // Phase 78 fix BOTH bugs (goyang + sisi seberang diam):
  //  - Selama drag: applyScaleByMode JALAN tanpa snap (smooth),
  //    computeAnchorOffset pakai raw scale → sisi seberang DIAM.
  //  - Saat mouseUp: snapScaleFinal snap 1x ke step terdekat +
  //    computeAnchorOffset pakai snapped scale → sisi seberang
  //    TETAP di posisi snapped (lompat sedikit ke snapped position,
  //    TAPI tidak goyang karena hanya 1x lompatan).
  //
  // Parameter snapStudStep di signature ini TIDAK dipakai (deprecated
  // — backward compat untuk caller yang masih pass). Snap sekarang
  // lewat snapScaleFinal yang dipanggil di onDraggingChanged false.
  if (needsAnchorOffset(m) && startPos) {
    const half = getGeometryHalfSize(object, axisKey);
    const off = computeAnchorOffset(THREE, object, axisKey, sign, startScale[axisKey], object.scale[axisKey], half, frameQuat);
    if (off) {
      object.position.set(startPos.x, startPos.y, startPos.z);
      object.position.add(off);
    }
  }
  return object.scale;
}

/**
 * snapScaleFinal — Phase 78 (2026-09-19, sesi server z.ai)
 *
 * SNAP scale ke kelipatan stepScale + computeAnchorOffset FINAL.
 * Dipanggil SAAT MOUSEUP (drag selesai) — BUKAN setiap frame.
 *
 * Kenapa SNAP saat mouseUp, BUKAN setiap frame:
 * Sebelum Phase 78, snap jalan setiap frame di applyScaleByMode.
 * Saat snap lompat antar step (karena user drag), scale berubah
 * cepat → computeAnchorOffset (yang pakai scale untuk hitung
 * offset posisi) juga lompat → posisi block goyang/bergetar.
 *
 * Phase 77 fix goyang dengan SKIP computeAnchorOffset saat snap
 * aktif — TAPI break mode 1 side semantics (sisi seberang tidak
 * diam). User komplain: "kok di mode 1side 2 sisi ke scale?
 * harusnya sisi lain diam".
 *
 * Phase 78 fix BOTH bugs (goyang + sisi seberang diam):
 *  - Selama drag: applyScaleByMode JALAN tanpa snap (smooth),
 *    computeAnchorOffset pakai raw scale → sisi seberang DIAM.
 *  - Saat mouseUp: snapScaleFinal snap 1x ke step terdekat +
 *    computeAnchorOffset pakai snapped scale → sisi seberang
 *    TETAP di posisi snapped (lompat sedikit ke snapped position,
 *    TAPI tidak goyang karena hanya 1x lompatan).
 *
 * @param {object} THREE
 * @param {object} object      mesh block
 * @param {string} mode        '1side' | '2side' | '4side' | '6side'
 * @param {string} axisKey     sumbu bola yang digenggam
 * @param {number} sign        +1 / −1 sisi bola
 * @param {object} startScale  snapshot {x,y,z} saat drag mulai
 * @param {object} startPos    snapshot {x,y,z} posisi saat drag mulai
 * @param {number} snapStudStep step dalam studs (0/null = no snap)
 * @param {number} minAbs      batas minimum absolut (0.05)
 * @param {object} frameQuat   quaternion frame referensi
 */
export function snapScaleFinal(THREE, object, mode, axisKey, sign, startScale, startPos, snapStudStep, minAbs = 0.05, frameQuat = null) {
  if (!THREE || !object) return null;
  const m = normalizeScaleMode(mode);
  const axes = getScaledAxes(m, axisKey);

  // Snap scale ke kelipatan stepScale (relatif ke startScale).
  // stepScale = snapStudStep / STUDS_PER_BLOCK (studs → scale factor).
  if (snapStudStep && snapStudStep > 0 && isFinite(snapStudStep)) {
    const stepScale = snapStudStep / STUDS_PER_BLOCK;
    for (const a of axes) {
      const s0 = startScale[a];
      const sgn = s0 >= 0 ? 1 : -1;
      const raw = object.scale[a];
      const delta = raw - s0;
      const snappedDelta = Math.round(delta / stepScale) * stepScale;
      const finalScale = sgn * Math.max(Math.abs(s0 + snappedDelta), minAbs);
      object.scale[a] = finalScale;
    }
  }

  // computeAnchorOffset final (pakai snapped scale) — supaya sisi
  // seberang DIAM di posisi snapped (BUKAN raw position). Tanpa ini,
  // setelah snap, sisi seberang akan bergeser karena pusat tetap di
  // raw position padahal scale sudah snapped.
  if (needsAnchorOffset(m) && startPos) {
    const half = getGeometryHalfSize(object, axisKey);
    const off = computeAnchorOffset(THREE, object, axisKey, sign, startScale[axisKey], object.scale[axisKey], half, frameQuat);
    if (off) {
      object.position.set(startPos.x, startPos.y, startPos.z);
      object.position.add(off);
    }
  }

  return object.scale;
}
