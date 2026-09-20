/* ================================================================
   physicsEngine.js — FISIKA BLOCK (fitur baru, tier INSANE)
   ================================================================
   DESAIN (kenapa RINGAN & tidak berat):
   - BUKAN solver fisika kontinu (cannon/rapier) — itu berat (+500KB,
     solver per frame, rawan tidak stabil).
   - Memakai AABB (kotak pembatas berputar) + SUB-STEP TETAP + SLEEP.
     Biaya per block ~20 operasi aritmetika. 1 block jatuh = nol beban.
   - Deterministik: hasil sama tiap kali → bisa diuji ANGKA di Node
     (tanpa browser), sesuai metode kontrak (UKUR, jangan menebak).

   KONSEP FISIKA (permintaan user 2026-09-20):
   - GRAVITASI KONSTAN untuk semua block (semua jatuh sama cepat).
   - Block yang masih menempel tanah / block lain TIDAK jatuh.
   - BOUNCY: memantul (restitution tinggi) → memantul terus sampai tenang.
   - FRICTION: gesekan saat mendarat. grass = paling seret, ice = 0 (meluncur),
     bouncy = sedikit (licin tapi ada geseknya).
   - Block dirotasi → AABB membesar → pantulan jadi kacau (chaotic) secara alami.

   POLA MODUL (warisan #38): TIDAK meng-import three. THREE dilewatkan
   sebagai PARAMETER. Modul murni → bisa diuji Node tanpa browser.
   ================================================================ */

/** Gravitasi (unit/detik²). 1 block = 1 unit = 2 studs.
 *  Diubah ke skala ROBLOX (2026-09-20): Roblox default 196.2 studs/s².
 *  Konvensi Roblox: 20 studs = 1 m. Skala proyek: 1 block = 2 studs = 1 unit.
 *  Maka 196.2 studs/s² ÷ 2 = 98.1 unit/s².
 *  Sebelumnya 26 unit/s² (≈52 studs/s²) = 3.8x TERLALU LEMAH → jatuh slow-motion. */
export const GRAVITY = 98.1;

/** Langkah fisika TETAP (detik). Loop memecah dt nyata jadi sub-step ini.
 *  Gaya Roblox: Roblox mensimulasikan pada 240 Hz (1/240) untuk akurasi tinggi.
 *  Dengan gravity 98.1, step 1/120 terlalu kasar → spin palsu lebih besar.
 *  Terukur: dt 1/240 → drift bouncy tegak 0.94 (vs 1/120 lebih besar). */
export const FIXED_DT = 1 / 240;

/** Batas dt maksimum per frame (anti "tabrakan" saat tab tidak aktif). */
export const MAX_FRAME_DT = 0.1;

/** Batas jumlah sub-step per frame (anti spiral-of-death saat frame lambat).
 *  FIXED_DT 1/240 → 8 step = 33ms; cukup untuk 30fps, tidak membebani. */
export const MAX_SUBSTEPS = 8;

/** Di bawah kecepatan ini → dianggap diam (anti-goyang). */
export const REST_SPEED = 0.35;

/** Harus diam selama ini (detik) sebelum benar-benar "sleep" (berhenti dihitung). */
export const REST_TIME = 0.12;

/**
 * Sifat fisik per jenis block (slug).
 *   restitution = kelenturan (0 = tidak memantul, 1 = memantul sempurna)
 *   friction    = gesekan saat mendarat (0 = licin/meluncur, 1 = paling seret)
 *
 * Permintaan user: grass paling seret · ice 0 (meluncur) · bouncy sedikit.
 */
export const PHYS_BY_SLUG = {
  // ── bouncy (FIX 2026-09-20 v3, gaya ROBLOX + daya pantul penuh) ──
  // restitution 0.5 → 0.92: nilai 0.5 membuat bouncy KEHILANGAN ~72% daya pantul
  // (puncak ke-2 hanya 2.24 dari jatuh 8) — keluhan user "kehilangan daya pantul
  // 90%". Dengan 0.92, puncak ke-2 = 6.51 (hanya kehilangan ~19%).
  // Spin palsu (edge catching) yang dulu muncul karena 0.92 kini ditangani oleh
  // FLAT-LOCK di physicsRapier (block tegak tidak diizinkan berputar) + friction
  // 0.5. Terukur: tegak drift 3.55 → 1.21, kacau tetap liar (drift 24.6).
  bouncy_block:      { restitution: 0.92, friction: 0.5 }, // gaya Roblox + pantulan kuat
  ice_block:         { restitution: 0.04, friction: 0.005 }, // hampir nol gesekan → meluncur
  grass_block:       { restitution: 0.04, friction: 0.95 }, // paling seret
  sand_block:        { restitution: 0.04, friction: 0.85 },
  fabric_block:      { restitution: 0.04, friction: 0.90 },
  coal_block:        { restitution: 0.06, friction: 0.70 },
  stone_block:       { restitution: 0.10, friction: 0.60 },
  concrete_block:    { restitution: 0.10, friction: 0.60 },
  brick_block:       { restitution: 0.10, friction: 0.60 },
  rusted_block:      { restitution: 0.12, friction: 0.55 },
  wood_block:        { restitution: 0.15, friction: 0.50 },
  smooth_wood_block: { restitution: 0.15, friction: 0.35 },
  neon_block:        { restitution: 0.12, friction: 0.40 },
  gold_block:        { restitution: 0.15, friction: 0.28 },
  plastic_block:     { restitution: 0.30, friction: 0.30 },
  toy_block:         { restitution: 0.45, friction: 0.35 },
  metal_block:       { restitution: 0.18, friction: 0.25 },
  titanium_block:    { restitution: 0.18, friction: 0.25 },
  glass_block:       { restitution: 0.20, friction: 0.15 },
  marble_block:      { restitution: 0.20, friction: 0.12 },
  obsidian_block:    { restitution: 0.22, friction: 0.10 },
  _default:          { restitution: 0.12, friction: 0.45 },
};

/** Ambil sifat fisik sebuah slug (fallback aman). */
export function getPhys(slug) {
  return PHYS_BY_SLUG[slug] || PHYS_BY_SLUG._default;
}

/**
 * Half-extent AABB DUNIA dari sebuah mesh (memperhitungkan rotasi).
 * Rumus standar AABB-dari-OBB: h'_i = Σ_j |R[i][j]| · h_j
 * Murah: 9 perkalian + 6 penjumlahan. Jauh lebih murah dari Box3.setFromObject.
 */
export function worldHalfExtents(THREE, mesh) {
  const g = mesh.geometry;
  if (!g) return { x: 0.5, y: 0.5, z: 0.5 };
  if (!g.boundingBox) g.computeBoundingBox();
  const bb = g.boundingBox;
  const hx = Math.abs((bb.max.x - bb.min.x) / 2) * Math.abs(mesh.scale.x || 1);
  const hy = Math.abs((bb.max.y - bb.min.y) / 2) * Math.abs(mesh.scale.y || 1);
  const hz = Math.abs((bb.max.z - bb.min.z) / 2) * Math.abs(mesh.scale.z || 1);

  mesh.updateMatrixWorld();
  const e = mesh.matrixWorld.elements;
  // kolom rotasi (tanpa translasi) dari matrixWorld
  const m00 = e[0], m01 = e[4], m02 = e[8];
  const m10 = e[1], m11 = e[5], m12 = e[9];
  const m20 = e[2], m21 = e[6], m22 = e[10];
  // skala kolom (matrixWorld bisa memuat scale parent) → normalisasi
  const sx = Math.hypot(m00, m10, m20) || 1;
  const sy = Math.hypot(m01, m11, m21) || 1;
  const sz = Math.hypot(m02, m12, m22) || 1;
  const r00 = m00 / sx, r01 = m01 / sy, r02 = m02 / sz;
  const r10 = m10 / sx, r11 = m11 / sy, r12 = m12 / sz;
  const r20 = m20 / sx, r21 = m21 / sy, r22 = m22 / sz;

  return {
    x: Math.abs(r00) * hx + Math.abs(r01) * hy + Math.abs(r02) * hz,
    y: Math.abs(r10) * hx + Math.abs(r11) * hy + Math.abs(r12) * hz,
    z: Math.abs(r20) * hx + Math.abs(r21) * hy + Math.abs(r22) * hz,
  };
}

/**
 * Ambil / buat state fisika pada mesh.userData.__phys.
 * Dibuat lazy supaya SEMUA block lama otomatis punya (tanpa mengubah
 * 21 titik pembuatan block — nol risiko regresi).
 *
 * PENTING (bug yang pernah terjadi): slug WAJIB dibaca dari
 * mesh.userData.blockSlug kalau parameter `slug` tidak diberikan — kalau
 * tidak, getPhys(null) jatuh ke _default dan SEMUA block kehilangan sifat
 * per-jenisnya (bouncy tidak mantul, ice tidak meluncur). Terukur: bouncy
 * memantul 2.37 (= default 0.12) padahal harusnya ~14.7 (0.80).
 */
export function ensureBody(mesh, slug) {
  if (!mesh.userData) mesh.userData = {};
  let b = mesh.userData.__phys;
  if (!b) {
    const resolved = slug || mesh.userData.blockSlug || null;
    b = { vx: 0, vy: 0, vz: 0, restT: 0, sleeping: false, slug: resolved };
    mesh.userData.__phys = b;
  }
  if (slug && !b.slug) b.slug = slug;
  return b;
}

/**
 * Bangunkan body (saat Anchor dilepas) — mulai jatuh dari diam.
 */
export function wakeBody(mesh) {
  const b = ensureBody(mesh);
  b.vx = 0; b.vy = 0; b.vz = 0;
  b.restT = 0;
  b.sleeping = false;
  return b;
}

/** Tidurkan body (saat Anchor dicentang lagi) — kunci di tempat. */
export function sleepBody(mesh) {
  const b = ensureBody(mesh);
  b.vx = 0; b.vy = 0; b.vz = 0;
  b.restT = REST_TIME + 1;
  b.sleeping = true;
  return b;
}

/**
 * SATU langkah fisika untuk satu body (sudah diintegrasikan posisinya).
 *
 * @param {object} THREE
 * @param {object} body      state (dari ensureBody)
 * @param {object} mesh      mesh block yang bergerak
 * @param {object} he        {x,y,z} half-extent DUNIA body ini
 * @param {Array}  obstacles [{mesh, he}] block lain (statis maupun bergerak)
 * @param {number} dt        detik (sudah = FIXED_DT)
 * @param {number} groundY   ketinggian permukaan tanah
 * @returns {boolean} true kalau masih bergerak (perlu dihitung lagi)
 */
export function stepBody(THREE, body, mesh, he, obstacles, dt, groundY = 0) {
  if (body.sleeping) return false;
  const phys = getPhys(body.slug);

  // 1. Gravitasi (konstan untuk semua block — permintaan user).
  body.vy -= GRAVITY * dt;

  // 2. Integrasi posisi.
  const p = mesh.position;
  p.x += body.vx * dt;
  p.y += body.vy * dt;
  p.z += body.vz * dt;

  let grounded = false;

  // 3. Tabrakan dengan TANAH.
  const bottom = p.y - he.y;
  if (bottom < groundY) {
    p.y = groundY + he.y;
    if (body.vy < 0) {
      body.vy = (Math.abs(body.vy) > REST_SPEED) ? -body.vy * phys.restitution : 0;
    }
    grounded = true;
  }

  // 4. Tabrakan dengan BLOCK lain (AABB vs AABB, resolusi sumbu penetrasi terkecil).
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    if (o.mesh === mesh) continue;
    const om = o.mesh.position;

    const dx = p.x - om.x;
    const px = (he.x + o.he.x) - Math.abs(dx);
    if (px <= 0) continue;
    const dy = p.y - om.y;
    const py = (he.y + o.he.y) - Math.abs(dy);
    if (py <= 0) continue;
    const dz = p.z - om.z;
    const pz = (he.z + o.he.z) - Math.abs(dz);
    if (pz <= 0) continue;

    // Sumbu dengan penetrasi TERKECIL = arah pemisahan paling murah.
    if (py <= px && py <= pz) {
      p.y += (dy >= 0 ? py : -py);
      if (dy >= 0) {
        grounded = true;                       // mendarat di ATAS block
        if (body.vy < 0) {
          body.vy = (Math.abs(body.vy) > REST_SPEED) ? -body.vy * phys.restitution : 0;
        }
      } else if (body.vy > 0) {
        body.vy = 0;                            // menabrak dari bawah
      }
    } else if (px <= pz) {
      p.x += (dx >= 0 ? px : -px);
      body.vx = (Math.abs(body.vx) > REST_SPEED) ? -body.vx * phys.restitution * 0.5 : 0;
      grounded = true;
    } else {
      p.z += (dz >= 0 ? pz : -pz);
      body.vz = (Math.abs(body.vz) > REST_SPEED) ? -body.vz * phys.restitution * 0.5 : 0;
      grounded = true;
    }
  }

  // 5. GESEKAN saat menempel (permintaan user: ice meluncur, grass seret).
  if (grounded) {
    const damp = Math.max(0, 1 - phys.friction * dt * 12);
    body.vx *= damp;
    body.vz *= damp;
    if (Math.abs(body.vx) < REST_SPEED) body.vx = 0;
    if (Math.abs(body.vz) < REST_SPEED) body.vz = 0;
  }

  // 6. Deteksi DIAM (anti-goyang, anti-drift = 0 bug).
  const speed = Math.sqrt(body.vx * body.vx + body.vy * body.vy + body.vz * body.vz);
  if (grounded && speed < REST_SPEED) {
    body.restT += dt;
    if (body.restT >= REST_TIME) {
      body.vx = 0; body.vy = 0; body.vz = 0;
      body.sleeping = true;                     // berhenti dihitung selamanya
      return false;
    }
  } else {
    body.restT = 0;
  }
  return true;
}

/**
 * Langkah fisika untuk BANYAK body sekaligus.
 *
 * @param {Array}  entries   [{mesh, body}] — HANYA block yang TIDAK anchored
 *                           (block anchored = statis, tidak diintegrasikan)
 * @param {Array}  statics   [{mesh}] — block ANCHORED (penghalang; wajib ada,
 *                           supaya block jatuh benar-benar "menempel" dan tidak
 *                           menembus block terkunci — permintaan user).
 * @returns {number} jumlah body yang MASIH bergerak (0 = semua tenang)
 */
export function stepWorld(THREE, entries, dt, groundY = 0, statics = []) {
  // Pra-hitung AABB semua (sekali per sub-step).
  const heCache = new Map();
  for (const e of entries) heCache.set(e.mesh, worldHalfExtents(THREE, e.mesh));
  const staticCache = new Map();
  for (const s of statics) {
    if (!s || !s.mesh) continue;
    staticCache.set(s.mesh, worldHalfExtents(THREE, s.mesh));
  }

  // Penghalang = block bergerak lain + block anchored (statis).
  const obstacles = entries.map(e => ({ mesh: e.mesh, he: heCache.get(e.mesh) }));
  for (const s of statics) {
    if (s && s.mesh && staticCache.has(s.mesh)) obstacles.push({ mesh: s.mesh, he: staticCache.get(s.mesh) });
  }

  let moving = 0;
  for (const e of entries) {
    const he = heCache.get(e.mesh);
    if (stepBody(THREE, e.body, e.mesh, he, obstacles, dt, groundY)) moving++;
  }
  return moving;
}
