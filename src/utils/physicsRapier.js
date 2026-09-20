/* ================================================================
   physicsRapier.js — MESIN FISIKA RAPIER (rapier3d-compat)
   ================================================================
   MENGGANTIKAN physicsEngine.js (mesin AABB sederhana) — API SAMA PERSIS,
   sehingga integrasi app nyaris tidak berubah (hanya ganti import).

   KENAPA DIGANTI (keluhan user, terbukti lewat probe):
   Mesin AABB lama TIDAK BISA menghasilkan pantulan kacau:
     - rotasi tidak berpengaruh (AABB simetris)
     - tidak ada angular velocity -> block tak pernah berputar
     - pantulan selalu lurus vertikal (tanpa komponen horizontal)
   Terukur: block bouncy dirotasi kacau -> geser 0.0000, putar 0.0000.
   Dengan rapier: geser 7.77, putar 3.03 (terbukti, test_physics_rapier.mjs).

   DESAIN (tetap hemat, sesuai syarat user "jangan berat"):
   - Block ANCHORED (default semua) = body FIXED di rapier (statis, 0 biaya
     simulasi) -> bisa ditabrak block yang jatuh.
   - Block UNANCHORED = body DYNAMIC -> disimulasikan penuh (torsi, inersia,
     gesekan, putaran).
   - rapier SLEEP bawaan (setCanSleep) -> block diam berhenti dihitung.
   - Hanya block yang bergerak yang di-sync balik ke mesh tiap frame.

   Modul ini adalah SATU-SATUNYA pemilik dunia rapier. App memanggil API-nya.

   ── LAZY-LOAD (optimasi ukuran, 2026-09-20) ──
   WASM rapier besar (±3.9 MB chunk). Supaya halaman awal tidak berat, modul
   rapier TIDAK di-import statis di sini. Sebaliknya:
     - konstanta (GRAVITY/FIXED_DT/MAX_FRAME_DT) hidup di physicsEngine.js (ringan)
     - `loadRapier()` = dynamic import, dipanggil saat dibutuhkan (init scene fisika)
   Semua fungsi lain menunggu `RAPIER` siap (guard `if (!RAPIER) return ...`).
   ================================================================ */
import { PHYS_BY_SLUG, MAX_SUBSTEPS, GRAVITY, FIXED_DT, MAX_FRAME_DT } from './physicsEngine.js';

export { GRAVITY, FIXED_DT, MAX_FRAME_DT };

/** Modul rapier (diisi oleh loadRapier — dynamic import, lazy). */
let RAPIER = null;
let world = null;
let ready = false;
let groundBody = null;
const bodyByMesh = new Map();   // mesh -> RAPIER.RigidBody
const metaByMesh = new Map();   // mesh -> { halfExtents, lastScale }

/** Apakah mesin sudah siap (rapier init selesai). */
export function isReady() { return ready; }

/**
 * Muat modul rapier (dynamic import — kode rapier+WASM di chunk TERPISAH).
 * Idempoten: aman dipanggil berkali-kali.
 */
export async function loadRapier() {
  if (RAPIER) return RAPIER;
  const mod = await import('@dimforge/rapier3d-compat');
  RAPIER = mod.default || mod;
  return RAPIER;
}

/**
 * Inisialisasi rapier (async — dipanggil sekali dari init scene app).
 * Aman dipanggil berkali-kali (idempoten).
 */
export async function initRapierPhysics() {
  if (ready) return true;
  try {
    await loadRapier();
    await RAPIER.init();
    world = new RAPIER.World({ x: 0, y: -GRAVITY, z: 0 });
    world.timestep = FIXED_DT;
    // Lantai: permukaan atas tepat di y = 0 (block duduk di y=0.5).
    // Restitution = GROUND_RESTITUTION (1.0) + aturan gabung Multiply → lantai
    // NETRAL (faktor 1.0): sifat pantul ditentukan SEPENUHNYA oleh block.
    groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(500, 0.5, 500)
        .setFriction(0.5)
        .setRestitution(GROUND_RESTITUTION)
        .setRestitutionCombineRule(restCombine())
        .setFrictionCombineRule(fricCombine()),
      groundBody,
    );
    ready = true;
    return true;
  } catch (e) {
    console.warn('[physicsRapier] init gagal:', e && e.message);
    return false;
  }
}

/** Sifat fisik per slug (restitution/friction) — dipakai untuk collider. */
function physOf(slug) {
  const p = PHYS_BY_SLUG[slug] || PHYS_BY_SLUG._default;
  return { restitution: p.restitution, friction: p.friction };
}

/**
 * Aturan gabung restitution — WAJIB `Multiply`.
 *
 * JEBAKAN #1 (keluhan user "daya pantul bouncy malah BERKURANG"): RAPIER default
 * memakai `Average`. Saat bouncy (0.92) menabrak lantai (0.20):
 *   (0.20 + 0.92) / 2 = 0.56  → daya pantul bouncy DILARUTKAN jadi 0.56.
 * JEBAKAN #2: memperbaikinya dengan `Max` memang membuat bouncy kuat TAPI membuat
 * SEMUA block ikut mantul (ice & grass) karena `max(lantai, block)`.
 *
 * SOLUSI FINAL: `Multiply` + lantai restitution 1.0
 *   bouncy : 0.92 × 1.0 = 0.92  → mantul KUAT
 *   ice    : 0.04 × 1.0 = 0.04  → TIDAK mantul
 *   grass  : 0.04 × 1.0 = 0.04  → TIDAK mantul
 *
 * CATATAN LAZY-LOAD: nilai ini diambil lewat FUNGSI (bukan konstanta modul),
 * karena modul rapier dimuat belakangan (dynamic import) — konstanta tingkat
 * modul akan dievaluasi saat RAPIER masih null → TypeError.
 */
function restCombine() { return RAPIER.CoefficientCombineRule.Multiply; }
function fricCombine() { return RAPIER.CoefficientCombineRule.Max; }
/** Lantai netral untuk restitution (faktor 1.0 pada aturan Multiply). */
const GROUND_RESTITUTION = 1.0;

/**
 * FLAT-LOCK — block yang orientasinya masih TEGAK tidak diizinkan berputar.
 *
 * MASALAH yang dipecahkan (keluhan user "bouncy tegak malah memantul liar"):
 * saat kubus mendarat, 4 sudutnya menyentuh hampir bersamaan → solver memberi
 * impuls berbeda tiap sudut ("edge catching") → muncul TORSI PALSU → block yang
 * TIDAK dirotasi pun mulai berputar → menyimpang liar.
 *
 * SOLUSI: kalau orientasi block masih mendekati tegak (|rot| < FLAT_TILT),
 * nolkan angvel. Block yang MEMANG dirotasi (miring > ambang) tetap bebas
 * berputar → pantulan tetap kacau (sesuai permintaan user).
 *
 * Terukur: bouncy tegak drift 3.55 → 1.21; bouncy kacau tetap liar (drift 24.6).
 * Ambang 0.05 rad (~2.9°) cukup untuk menangkap noise, jauh di bawah rotasi user
 * (mis. 0.9 rad = 51°) sehingga tidak pernah "mengunci" block yang sengaja dirotasi.
 */
const FLAT_TILT = 0.05;
/** Ambang angvel yang dianggap noise (di bawah ini dimatikan saat tegak). */
const FLAT_SPIN_MAX = 12.0;

/** Nolkan putaran kalau block masih tegak (bukan hasil rotasi user). */
function applyFlatLock(body) {
  const r = body.rotation();
  // sudut rotasi ≈ 2·acos(|w|)  (kuaternion ternormalisasi)
  const w0 = Math.min(1, Math.abs(r.w));
  const tilt = 2 * Math.acos(w0);
  if (tilt < FLAT_TILT) {
    const av = body.angvel();
    const mag = Math.hypot(av.x, av.y, av.z);
    if (mag > 0 && mag < FLAT_SPIN_MAX) body.setAngvel({ x: 0, y: 0, z: 0 }, false);
  }
}

/** Half-extent collider dari mesh (memperhitungkan scale non-uniform). */
function halfExtentsOf(mesh) {
  const g = mesh.geometry;
  if (!g) return { x: 0.5, y: 0.5, z: 0.5 };
  if (!g.boundingBox) g.computeBoundingBox();
  const bb = g.boundingBox;
  return {
    x: Math.max(0.01, Math.abs((bb.max.x - bb.min.x) / 2) * Math.abs(mesh.scale.x || 1)),
    y: Math.max(0.01, Math.abs((bb.max.y - bb.min.y) / 2) * Math.abs(mesh.scale.y || 1)),
    z: Math.max(0.01, Math.abs((bb.max.z - bb.min.z) / 2) * Math.abs(mesh.scale.z || 1)),
  };
}

/**
 * Ambil / buat body rapier untuk sebuah mesh.
 * anchored !== false -> FIXED (statis); anchored === false -> DYNAMIC.
 */
export function ensureBody(mesh, slug) {
  if (!ready || !RAPIER || !mesh) return null;
  const resolvedSlug = slug || (mesh.userData && mesh.userData.blockSlug) || null;
  let body = bodyByMesh.get(mesh);
  const he = halfExtentsOf(mesh);

  if (!body) {
    const anchored = !(mesh.userData && mesh.userData.anchored === false);
    const desc = (anchored ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic())
      .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)
      .setRotation({ x: mesh.quaternion.x, y: mesh.quaternion.y, z: mesh.quaternion.z, w: mesh.quaternion.w });
    if (!anchored) desc.setCanSleep(true).setLinearDamping(0).setAngularDamping(0.02);
    body = world.createRigidBody(desc);
    const ph = physOf(resolvedSlug);
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(he.x, he.y, he.z)
        .setRestitution(ph.restitution)
        .setFriction(ph.friction)
        .setRestitutionCombineRule(restCombine())
        .setFrictionCombineRule(fricCombine())
        // Collision OFF (jika user sudah mematikannya sebelum body dibuat):
        // membership 0x0001, filter 0x0000 → tembus tapi tetap disimulasikan.
        .setCollisionGroups((mesh.userData && mesh.userData.noCollision) ? 0x00010000 : 0x0001FFFF),
      body,
    );
    bodyByMesh.set(mesh, body);
    metaByMesh.set(mesh, { he, slug: resolvedSlug });
    if (mesh.userData) mesh.userData.__rapierBody = body;
  }
  return body;
}

/**
 * Sinkronkan transform MESH -> BODY rapier.
 *
 * WAJIB untuk block yang SEDANG ANCHORED (statis): user memindahkan/memutar block
 * lewat gizmo TransformControls yang hanya mengubah MESH Three.js. Body rapier
 * TIDAK ikut berubah. Akibatnya saat Anchor dilepas, rapier "menarik" block balik
 * ke posisi LAMA -> block TER-TELEPORT ke tanah (bug kritis yang dilaporkan user).
 *
 * Terukur (sebelum fix): mesh diangkat ke y=5, anchor dilepas -> 1 step kemudian
 * y=0.500 (teleport); rotasi [0.601,0.018,0.769,0.218] -> [0.001,0,0,1] (hilang).
 *
 * Mesh = SUMBER KEBENARAN selama block anchored. Begitu anchor dilepas
 * (dynamic), body menjadi sumber kebenaran (lihat stepWorld).
 */
export function syncBodyFromMesh(mesh) {
  if (!ready || !RAPIER || !mesh) return;
  const body = bodyByMesh.get(mesh);
  if (!body) return;
  body.setTranslation({ x: mesh.position.x, y: mesh.position.y, z: mesh.position.z }, true);
  body.setRotation({ x: mesh.quaternion.x, y: mesh.quaternion.y, z: mesh.quaternion.z, w: mesh.quaternion.w }, true);
}

/**
 * Bangunkan (saat Anchor dilepas): sinkron posisi/rotasi TERBARU dari mesh dulu,
 * baru jadikan DYNAMIC — supaya block jatuh dari posisi yang user lihat (bukan
 * posisi lama). Ini yang mencegah "teleport ke tanah".
 */
export function wakeBody(mesh) {
  if (!ready || !RAPIER || !mesh) return null;
  const body = ensureBody(mesh);
  if (!body) return null;
  syncBodyFromMesh(mesh);                              // ← KUNCI fix teleport
  body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
  // ── DAMPING WAJIB DI-SET DI SINI (bug kritis yang dilaporkan user) ──
  // Block dibuat sebagai FIXED (anchored) sehingga setLinearDamping/
  // setAngularDamping di ensureBody TIDAK pernah terpasang. Saat body diubah
  // jadi Dynamic, damping = 0 → noise numerik tumbukan MENUMPUK tanpa redaman →
  // block berputar sendiri & menyimpang LIAR walau dijatuhkan TEGAK.
  // Terukur (sebelum fix): bouncy tegak -> drift 8.23 (harusnya < 0.05).
  // Nilai: linear 0 (energi pantul utuh), angular 0.35 (redam noise, tapi
  // putaran asli dari tumbukan sudut TETAP hidup → pantulan tetap kacau).
  body.setLinearDamping(0);
  body.setAngularDamping(0.35);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  body.wakeUp();
  return body;
}

/** Tidurkan (saat Anchor dicentang): sinkron posisi terbaru lalu kunci (FIXED). */
export function sleepBody(mesh) {
  if (!ready || !RAPIER || !mesh) return null;
  const body = ensureBody(mesh);
  if (!body) return null;
  syncBodyFromMesh(mesh);                              // ikuti posisi terkini
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
  return body;
}

/** Apakah mesh ini punya body rapier aktif (dipakai deteksi jatuh ke void). */
export function hasBody(mesh) {
  return !!(ready && mesh && bodyByMesh.has(mesh));
}

/** Hapus body (dipakai saat block dihapus / cleanup). */
export function removeBody(mesh) {
  if (!ready || !RAPIER || !mesh) return;
  const body = bodyByMesh.get(mesh);
  if (body) {
    world.removeRigidBody(body);
    bodyByMesh.delete(mesh);
    metaByMesh.delete(mesh);
    if (mesh.userData) delete mesh.userData.__rapierBody;
  }
}

/**
 * COLLISION ON/OFF (fitur Property → tombol "Collision").
 *
 * JEBAKAN API (terukur, JANGAN ulangi): `collider.setEnabled(false)` BUKAN cara
 * yang benar — block jadi TIDAK JATUH SAMA SEKALI (y tetap 5.000 setelah 1 detik;
 * massa/partisipasi simulasi hilang), padahal kita ingin block tetap jatuh TAPI
 * menembus segalanya.
 *
 * CARA BENAR (terukur): `setCollisionGroups(0x00010000)` — membership = 0x0001,
 * filter = 0x0000 → TIDAK berinteraksi dengan apa pun (tembus lantai & block
 * lain) tapi tetap disimulasikan penuh (gravitasi tetap bekerja).
 * Terukur: block jatuh tembus ke y=-44.1 (menembus lantai) ✅
 *
 * @param {object} mesh
 * @param {boolean} on  true = collision aktif (normal), false = tembus
 */
export function setBodyCollision(mesh, on) {
  if (!ready || !RAPIER || !mesh) return;
  const body = bodyByMesh.get(mesh);
  if (!body) return;
  for (let i = 0; i < body.numColliders(); i++) {
    const c = body.collider(i);
    if (!c) continue;
    // membership 0x0001, filter 0x0000 (tembus) | filter 0xFFFF (normal)
    c.setCollisionGroups(on ? 0x0001FFFF : 0x00010000);
  }
  if (mesh.userData) mesh.userData.noCollision = !on;
}

/**
 * Langkah dunia fisika + sinkronkan transform balik ke mesh.
 * Signature SAMA dengan physicsEngine.stepWorld (drop-in replacement).
 *
 * @returns {number} jumlah block yang masih bergerak (0 = semua tenang)
 */
export function stepWorld(THREE, entries, dt, groundY = 0, statics = []) {
  if (!ready || !RAPIER || !world) return 0;

  // Pastikan block statis (anchored) punya body FIXED sebagai penghalang.
  for (const s of statics) {
    if (s && s.mesh && !bodyByMesh.has(s.mesh)) ensureBody(s.mesh);
  }
  // Pastikan semua block yang bergerak punya body DYNAMIC.
  for (const e of entries) {
    if (!e || !e.mesh) continue;
    if (!bodyByMesh.has(e.mesh)) { ensureBody(e.mesh); wakeBody(e.mesh); }
  }

  // Sinkronkan ukuran collider kalau block di-scale (non-uniform).
  for (const e of entries) {
    const mesh = e.mesh;
    const meta = metaByMesh.get(mesh);
    const body = bodyByMesh.get(mesh);
    if (!meta || !body) continue;
    const he = halfExtentsOf(mesh);
    if (Math.abs(he.x - meta.he.x) > 1e-4 || Math.abs(he.y - meta.he.y) > 1e-4 || Math.abs(he.z - meta.he.z) > 1e-4) {
      // ganti collider (hapus semua lalu buat baru)
      for (let i = body.numColliders() - 1; i >= 0; i--) {
        const c = body.collider(i);
        if (c) world.removeCollider(c, true);
      }
      const ph = physOf(meta.slug);
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(he.x, he.y, he.z)
          .setRestitution(ph.restitution)
          .setFriction(ph.friction)
          .setRestitutionCombineRule(restCombine())
          .setFrictionCombineRule(fricCombine())
          .setCollisionGroups((mesh.userData && mesh.userData.noCollision) ? 0x00010000 : 0x0001FFFF),
        body,
      );
      meta.he = he;
    }
  }

  // Majukan dunia dengan langkah TETAP (gaya Roblox: 240 Hz).
  let step = Math.min(dt, MAX_FRAME_DT);
  let iter = 0;
  while (step > 1e-6 && iter < MAX_SUBSTEPS) {
    world.step();
    step -= FIXED_DT;
    iter++;
  }

  // Sinkronkan transform dari body -> mesh (hanya yang bergerak).
  let moving = 0;
  for (const e of entries) {
    const mesh = e.mesh;
    const body = bodyByMesh.get(mesh);
    if (!body) continue;
    applyFlatLock(body);                    // cegah spin palsu saat block tegak
    const t = body.translation();
    const r = body.rotation();
    mesh.position.set(t.x, t.y, t.z);
    mesh.quaternion.set(r.x, r.y, r.z, r.w);
    if (!body.isSleeping()) moving++;
  }
  return moving;
}

/** Hapus SEMUA body (dipakai tes untuk isolasi antar-skenario). */
export function clearAllBodies() {
  if (!ready || !RAPIER || !world) return;
  for (const [, body] of bodyByMesh) { try { world.removeRigidBody(body); } catch (e) { /* noop */ } }
  bodyByMesh.clear();
  metaByMesh.clear();
}

/** Bersihkan semua body (cleanup unmount). */
export function disposePhysics() {
  if (!ready || !RAPIER || !world) return;
  for (const [, body] of bodyByMesh) { try { world.removeRigidBody(body); } catch (e) { /* noop */ } }
  bodyByMesh.clear();
  metaByMesh.clear();
}
