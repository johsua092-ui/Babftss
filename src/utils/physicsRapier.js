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
   ================================================================ */
import RAPIER from '@dimforge/rapier3d-compat';
import { PHYS_BY_SLUG } from './physicsEngine.js';

/** Gravitasi (unit/detik^2) — 1 block = 1 unit. */
export const GRAVITY = 26;
/** Langkah tetap (detik). */
export const FIXED_DT = 1 / 120;
/** Batas dt per frame (anti-lompat saat tab tidak aktif). */
export const MAX_FRAME_DT = 0.1;

let world = null;
let ready = false;
let groundBody = null;
const bodyByMesh = new Map();   // mesh -> RAPIER.RigidBody
const metaByMesh = new Map();   // mesh -> { halfExtents, lastScale }

/** Apakah mesin sudah siap (rapier init selesai). */
export function isReady() { return ready; }

/**
 * Inisialisasi rapier (async — dipanggil sekali dari init scene app).
 * Aman dipanggil berkali-kali (idempoten).
 */
export async function initRapierPhysics() {
  if (ready) return true;
  try {
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
        .setRestitutionCombineRule(RESTITUTION_COMBINE)
        .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Average),
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
 * memakai `Average`. Saat bouncy (0.80) menabrak lantai (0.20):
 *   (0.20 + 0.80) / 2 = 0.50  → daya pantul bouncy DILARUTKAN jadi 0.50.
 * JEBAKAN #2: memperbaikinya dengan `Max` memang membuat bouncy kuat (16 pantulan)
 * TAPI membuat SEMUA block ikut mantul (ice & grass juga 5-7 pantulan) karena
 * `max(lantai, block)` mengambil nilai lantai.
 *
 * SOLUSI FINAL: `Multiply` + lantai restitution 1.0
 *   bouncy : 0.92 × 1.0 = 0.92  → mantul KUAT (16 pantulan, geser 13.04, naik 6.47)
 *   ice    : 0.04 × 1.0 = 0.04  → TIDAK mantul (1)
 *   grass  : 0.04 × 1.0 = 0.04  → TIDAK mantul (1)
 * Jadi sifat block menentukan segalanya; lantai netral (faktor 1.0).
 */
const RESTITUTION_COMBINE = RAPIER.CoefficientCombineRule.Multiply;
/** Lantai netral untuk restitution (faktor 1.0 pada aturan Multiply). */
const GROUND_RESTITUTION = 1.0;

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
  if (!ready || !mesh) return null;
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
        .setRestitutionCombineRule(RESTITUTION_COMBINE)
        .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Average),
      body,
    );
    bodyByMesh.set(mesh, body);
    metaByMesh.set(mesh, { he, slug: resolvedSlug });
    if (mesh.userData) mesh.userData.__rapierBody = body;
  }
  return body;
}

/** Bangunkan (saat Anchor dilepas): ubah body jadi DYNAMIC + reset kecepatan. */
export function wakeBody(mesh) {
  if (!ready || !mesh) return null;
  const body = ensureBody(mesh);
  if (!body) return null;
  body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  body.wakeUp();
  return body;
}

/** Tidurkan (saat Anchor dicentang): ubah body jadi FIXED (terkunci di tempat). */
export function sleepBody(mesh) {
  if (!ready || !mesh) return null;
  const body = ensureBody(mesh);
  if (!body) return null;
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
  return body;
}

/** Hapus body (dipakai saat block dihapus / cleanup). */
export function removeBody(mesh) {
  if (!ready || !mesh) return;
  const body = bodyByMesh.get(mesh);
  if (body) {
    world.removeRigidBody(body);
    bodyByMesh.delete(mesh);
    metaByMesh.delete(mesh);
    if (mesh.userData) delete mesh.userData.__rapierBody;
  }
}

/**
 * Langkah dunia fisika + sinkronkan transform balik ke mesh.
 * Signature SAMA dengan physicsEngine.stepWorld (drop-in replacement).
 *
 * @returns {number} jumlah block yang masih bergerak (0 = semua tenang)
 */
export function stepWorld(THREE, entries, dt, groundY = 0, statics = []) {
  if (!ready || !world) return 0;

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
          .setRestitutionCombineRule(RESTITUTION_COMBINE)
          .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Average),
        body,
      );
      meta.he = he;
    }
  }

  // Majukan dunia dengan langkah TETAP.
  let step = Math.min(dt, MAX_FRAME_DT);
  let iter = 0;
  while (step > 1e-6 && iter < 8) {
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
    const t = body.translation();
    const r = body.rotation();
    mesh.position.set(t.x, t.y, t.z);
    mesh.quaternion.set(r.x, r.y, r.z, r.w);
    if (!body.isSleeping()) moving++;
  }
  return moving;
}

/** Bersihkan semua body (cleanup unmount). */
export function disposePhysics() {
  if (!ready || !world) return;
  for (const [, body] of bodyByMesh) { try { world.removeRigidBody(body); } catch (e) { /* noop */ } }
  bodyByMesh.clear();
  metaByMesh.clear();
}
