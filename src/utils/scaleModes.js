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

/** Mode default saat user pertama masuk / menekan Cancel (permintaan user).
 *  Phase 73: '1side'. Phase 79 (2026-09-19): ubah ke '2side'.
 *  Phase 80 (2026-09-19, sesi server z.ai): kembalikan ke '1side'
 *  (user jelaskan bahwa 'default 2' yang dimaksud di Phase 79 adalah
 *  SCALE NUMBER studs, BUKAN scale mode. User mau mode default = 1side). */
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
  // Phase 86 (2026-09-19, sesi server z.ai): SELALU return false.
  // User mau block DIAM — "jangan maju! diam! 0! tidak akan pernah maju!".
  // computeAnchorOffset tidak pernah jalan. Pusat TIDAK PERNAH bergeser.
  // Sebelum Phase 86: return true untuk mode 1side (sisi seberang diam,
  // pusat bergeser). User komplain berulang (Phase 77/82/83/84/85).
  // Phase 86: user sangat jelas — "jangan maju plis tolong benerin".
  // SKIP computeAnchorOffset SELALU. Block DIAM. Titik.
  // Trade-off: sisi seberang bergerak simetris (BUKAN diam) di mode 1side.
  // User Phase 78 komplain "1 side jadi 2 side". Tapi user Phase 86
  // prioritaskan "diam" > "sisi seberang diam". Phase terbaru menang.
  return false;
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
  // Phase 85 (2026-09-19, sesi server z.ai): REVERT Math.abs dari Phase 84.
  // Math.abs menyebabkan offset selalu POSITIF (MAJU). Saat scale kembali ke
  // ukuran asli (scaleNew = scaleStart), offset BUKAN 0 — pusat TIDAK kembali
  // ke posisi awal. Setiap cycle membesar→mengecil, pusat bergeser lagi.
  // AKUMULASI. User komplain: "scale panjang lalu pendek sampai mentok ke
  // ukuran asli, block maju 1 studs ke arah scale. Pola sama, berulang."
  //
  // (scaleNew - scaleStart) = REVERSIBEL:
  // - Scale membesar: delta positif → pusat MAJU → sisi seberang DIAM.
  // - Scale mengecil: delta negatif → pusat MUNDUR → sisi seberang DIAM.
  // - Scale kembali ke ukuran asli: delta = 0 → pusat KEMBALI ke posisi awal. ✓
  //
  // Math.abs = TIDAK REVERSIBEL:
  // - Scale membesar: delta positif → pusat MAJU.
  // - Scale mengecil: delta positif (BUKAN negatif) → pusat MAJU lagi → AKUMULASI.
  // - Scale kembali ke ukuran asli: delta positif (BUKAN 0) → pusat TIDAK kembali. ✗
  //
  // Pelajaran: offset posisi WAJIB reversibel (proportional ke delta scale).
  // Math.abs = symmetric tapi TIDAK reversibel. (scaleNew - scaleStart) =
  // asymmetric tapi reversibel. Untuk computeAnchorOffset, reversibel > symmetric.
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

  // ── PHASE 79 (2026-09-19, sesi server z.ai): SNAP SAAT DRAG + HYSTERESIS ──
  // Phase 78 pindah snap ke mouseUp — TAPI user komplain "block tidak
  // berubah saat drag, seperti scale 0". User mau snap REAL-TIME saat
  // drag (block berubah sesuai step studs saat user drag).
  //
  // Phase 75 (snap saat drag, Math.round) = goyang di boundary karena
  // Math.round(-0.5) = 0 di JS (round half up), TAPI Math.round(-0.6) =
  // -1. Saat delta oscillate di boundary -0.5×stepScale, snap lompat
  // bolak-balik antara step 0 dan step -1 → posisi lompat bolak-balik
  // = GOYANG. computeAnchorOffset pakai snapped scale → offset lompat
  // bersama snap.
  //
  // Phase 79 fix BOTH (snap real-time + tidak goyang + sisi seberang
  // diam) pakai HYSTERESIS BAND 0.6 (lebih besar dari Math.round 0.5):
  // - Kalau stepIdx > lastStep: pindah ke stepIdx kalau delta >=
  //   (lastStep + 0.6) × stepScale (band 0.6, BUKAN 0.5).
  // - Kalau stepIdx < lastStep: pindah ke stepIdx kalau delta <=
  //   (lastStep - 0.6) × stepScale.
  // - Kalau delta di antara (lastStep - 0.6) dan (lastStep + 0.6) ×
  //   stepScale, tetap di lastStep (TIDAK lompat).
  // Behavior: snap real-time saat drag (block berubah sesuai step),
  // TIDAK goyang di boundary (hysteresis prevent lompat bolak-balik),
  // sisi seberang diam (computeAnchorOffset pakai snapped scale).
  // lastStep disimpan di obj.userData.__snapLastStep (persistent di
  // object, reset di onDraggingChanged true).
  //
  // Trade-off: block lambat (perlu drag 0.6×stepScale untuk pindah
  // step, BUKAN 0.5×stepScale). Acceptable untuk snap (user expect
  // step function).
  const snapActive = snapStudStep && snapStudStep > 0 && isFinite(snapStudStep);
  if (snapActive) {
    const stepScale = snapStudStep / STUDS_PER_BLOCK;
    const HYSTERESIS_BAND = 0.6;  // band 0.6 (lebih besar dari Math.round 0.5)
    // Hysteresis state: track lastSnappedStep per-sumbu
    if (!object.userData) object.userData = {};
    if (!object.userData.__snapLastStep) object.userData.__snapLastStep = {};
    const lastStepMap = object.userData.__snapLastStep;
    for (const a of axes) {
      const s0 = startScale[a];
      const sgn = s0 >= 0 ? 1 : -1;
      const raw = object.scale[a];
      const delta = raw - s0;
      const lastStep = (lastStepMap[a] !== undefined) ? lastStepMap[a] : 0;
      const stepIdx = Math.round(delta / stepScale);
      // Hysteresis: pindah ke stepIdx kalau delta cukup jauh dari lastStep
      let finalStep = lastStep;
      if (stepIdx > lastStep && delta >= (lastStep + HYSTERESIS_BAND) * stepScale) {
        finalStep = stepIdx;
      } else if (stepIdx < lastStep && delta <= (lastStep - HYSTERESIS_BAND) * stepScale) {
        finalStep = stepIdx;
      }
      // Phase 82 (2026-09-19, sesi server z.ai): cek minimum — kalau
      // candidateScale < minAbs, JANGAN snap ke step itu. Tetap di
      // lastStep. User: "kalau step 2 studs dan block 2 studs (default),
      // tidak bisa mengecil karena 2 - 2 = 0, tidak valid". Tanpa cek
      // ini, snap ke step -1 = 0 → di-clamp ke minAbs (0.05) → block
      // mengecil ke 0.1 studs (tidak sesuai harapan user). Dengan cek
      // ini, block tetap di lastStep (default 2 studs) = "tidak bisa
      // di-scale lagi" sesuai matematika user.
      const candidateScale = s0 + finalStep * stepScale;
      if (Math.abs(candidateScale) < minAbs) {
        finalStep = lastStep;  // tetap di lastStep, jangan snap ke step yang invalid
      }
      lastStepMap[a] = finalStep;
      const finalScale = sgn * Math.max(Math.abs(s0 + finalStep * stepScale), minAbs);
      object.scale[a] = finalScale;
    }
  }

  // 1side: geser pusat supaya sisi seberang DIAM.
  // PHASE 83 (2026-09-19, sesi server z.ai): KEMBALI ke computeAnchorOffset
  // SELALU (hapus `&& !snapActive` dari Phase 82). User ide jenius:
  // "pusat ikut bergeser maju jika block di scale panjang atau bergeser
  // mundur jika block di pendekkan. Pusat mengikuti titik tengah block
  // yang di-scale. Terapkan kepada SEMUA mode (1, 2, 4, 6 side)."
  //
  // Untuk mode 1 side: computeAnchorOffset geser pusat ke titik tengah
  // (antara sisi seberang DIAM dan sisi yang bergerak). Sisi seberang
  // diam, sisi yang digenggam bergerak, pusat bergeser ke titik tengah. ✓
  //
  // Untuk mode 2/4/6 side: needsAnchorOffset return false → skip
  // computeAnchorOffset → pusat tetap di tempat (scale dari pusat =
  // pusat = titik tengah). Sisi + dan sisi − bergerak simetris, pusat
  // tetap di titik tengah. ✓ (pusat = titik tengah, tidak bergeser).
  //
  // Phase 82 skip computeAnchorOffset saat snap aktif → user komplain
  // "1 side jadi 2 side" (sisi seberang bergerak simetris). Phase 83
  // kembalikan computeAnchorOffset SELALU → sisi seberang DIAM (mode 1
  // side true semantics) + pusat bergeser ke titik tengah (ide user).
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
 * applyGeometryOffset — Phase 87 (2026-09-19, sesi server z.ai)
 *
 * GEOMETRY TRANSLATE PER-BLOCK: achieve "sisi seberang DIAM + pusat DIAM"
 * tanpa modify object.position. Modify geometry vertices (BUKAN position).
 *
 * User mau BOTH: sisi seberang diam + pusat diam. Tidak mungkin dengan
 * object.scale + object.position (scale dari pusat → sisi bergerak simetris).
 * TAPI mungkin dengan geometry.translate (modify geometry vertices):
 *
 * Final position = (geometry vertices + translate) × scale + position.
 *
 * Untuk sisi seberang diam di posisi awal:
 * (geometrySisiSeberang + translate) × finalScale + startPos = sisiSeberangAwal
 * sisiSeberangAwal = startPos + geometrySisiSeberang × startScale
 * → translate = halfSize × (finalScale - startScale) / finalScale × sign
 *
 * Hasil:
 * - Sisi seberang DIAM (geometry.translate compensate). ✓
 * - Pusat object DIAM (object.position = startPos). ✓
 * - Sisi yang digenggam bergerak (object.scale). ✓
 * - Reversibel (offset proportional ke delta scale, BUKAN absolute). ✓
 *
 * WAJIB: object.geometry = CLONE (BUKAN shared). Kalau shared, modify
 * geometry akan affect semua mesh yang share geometry. Clone saat
 * drag mulai (lihat BlockSimulator3D.jsx onDraggingChanged true).
 *
 * @param {object} THREE
 * @param {object} object      mesh block (geometry = CLONE, BUKAN shared)
 * @param {string} mode        '1side' | '2side' | '4side' | '6side'
 * @param {string} axisKey     sumbu bola yang digenggam
 * @param {number} sign        +1 / −1 sisi bola
 * @param {object} startScale  snapshot {x,y,z} saat drag mulai
 * @param {object} originalGeometry  clone asli (untuk reset position attribute)
 */
export function applyGeometryOffset(THREE, object, mode, axisKey, sign, startScale, originalGeometry) {
  if (!THREE || !object || !object.geometry || !originalGeometry) return;

  // 1. RESET clone position attribute ke original (copy array).
  //    Setiap frame, reset dulu supaya tidak double-translate.
  const origPos = originalGeometry.attributes.position;
  const clonePos = object.geometry.attributes.position;
  if (origPos && clonePos && origPos.array && clonePos.array) {
    const src = origPos.array;
    const dst = clonePos.array;
    for (let i = 0; i < src.length; i++) {
      dst[i] = src[i];
    }
    clonePos.needsUpdate = true;
  }

  // 2. Kalau mode 1 side: translate geometry supaya sisi seberang DIAM.
  //    Mode lain (2/4/6 side): tidak ada translate (pusat diam, sisi
  //    bergerak simetris = mode 2/4/6 side behavior).
  const m = normalizeScaleMode(mode);
  if (m === '1side' && axisKey && sign !== undefined && startScale) {
    const halfSize = getGeometryHalfSize(originalGeometry, axisKey);
    const finalScale = object.scale[axisKey];
    if (finalScale !== 0 && isFinite(finalScale) && halfSize > 0) {
      const s0 = startScale[axisKey] || 1;
      // offset = halfSize × (finalScale - startScale) / finalScale × sign
      const offset = halfSize * (finalScale - s0) / finalScale * (sign >= 0 ? 1 : -1);
      if (isFinite(offset) && offset !== 0) {
        object.geometry.translate(
          axisKey === 'x' ? offset : 0,
          axisKey === 'y' ? offset : 0,
          axisKey === 'z' ? offset : 0,
        );
      }
    }
  }

  // 3. Update bounding box + bounding sphere (karena geometry di-modify).
  object.geometry.computeBoundingBox();
  object.geometry.computeBoundingSphere();
}
