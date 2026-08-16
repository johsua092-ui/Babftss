// api/canvas/prompts.js — Simpan/Muat 3 slot "prompt/memory" di Canvas
//
// Auth : Firebase token (Bearer) REQUIRED — guest TIDAK bisa simpan.
// Storage : Firestore "punya-si-jawa", koleksi `canvas_prompts`.
//
// Slot 0..2 (3 slot, MAX_SLOTS = 3). Tiap slot menyimpan satu teks
// panjang (misal: ingatan AI atas konsep design yang sudah dibahas).
//
// Endpoint:
//   GET  /api/canvas/prompts           -> daftar semua slot (0..2)
//   GET  /api/canvas/prompts?slot=N    -> muat satu slot
//   POST /api/canvas/prompts           -> simpan/upsert slot { slot, title?, content }
//   DELETE /api/canvas/prompts?slot=N  -> kosongkan slot
import {
  applyCors,
  applySecurityHeaders,
  checkRateLimit,
  authenticateRequest,
  safeError,
  getPunyaSiJawaFirestore,
} from '../../lib/api-helpers.js';

const COLLECTION = 'canvas_prompts';
const MAX_SLOTS = 3;
const MAX_CONTENT = 20000; // maks 20.000 karakter per slot (ingatan panjang)
const MAX_TITLE = 200;

export default async function handler(req, res) {
  applyCors(req, res, 'GET, POST, DELETE, OPTIONS');
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit('canvas-prompts:' + ip, 60, 60000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const user = await authenticateRequest(req);
    if (!user) {
      return res.status(401).json({
        error: 'Tolong masuk menjadi member untuk menggunakan Canvas',
        code: 'AUTH_REQUIRED',
      });
    }

    const db = await getPunyaSiJawaFirestore();

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, user, db);
      case 'POST':
        return handlePost(req, res, user, db);
      case 'DELETE':
        return handleDelete(req, res, user, db);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e) {
    return safeError(res, 500, 'canvas-prompts', e);
  }
}

function parseSlot(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n >= MAX_SLOTS) return null;
  return n;
}

// ── GET ──────────────────────────────────────────────
async function handleGet(req, res, user, db) {
  const { slot } = req.query || {};

  const snap = await db.collection(COLLECTION).where('firebase_uid', '==', user.sub).get();
  const slots = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (slot !== undefined) {
    const n = parseSlot(slot);
    if (n === null) {
      return res.status(400).json({ error: 'slot harus 0..' + (MAX_SLOTS - 1) });
    }
    const found = slots.find((s) => s.slot === n);
    if (!found) {
      return res.status(200).json({ slot: n, content: null, title: null });
    }
    return res.status(200).json({
      slot: n,
      title: found.title || null,
      content: found.content,
      updated_at: found.updated_at || null,
      updatedAt: found.updated_at || null,
    });
  }

  const out = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    const f = slots.find((s) => s.slot === i);
    out.push({
      slot: i,
      filled: !!f,
      title: f ? f.title || null : null,
      content: f ? f.content : null,
      updated_at: f ? f.updated_at || null : null,
    });
  }
  return res.status(200).json({ slots: out, maxSlots: MAX_SLOTS });
}

// ── POST (upsert satu slot) ──────────────────────────
async function handlePost(req, res, user, db) {
  const { slot, title, content } = req.body || {};

  const n = parseSlot(slot);
  if (n === null) {
    return res.status(400).json({ error: 'slot harus 0..' + (MAX_SLOTS - 1) });
  }

  if (typeof content !== 'string' || content.length === 0) {
    return res.status(400).json({ error: 'content (teks prompt/memory) wajib diisi' });
  }
  if (content.length > MAX_CONTENT) {
    return res.status(400).json({ error: 'content terlalu panjang (max ' + MAX_CONTENT + ' karakter)' });
  }

  const cleanTitle =
    typeof title === 'string' && title.length > 0 && title.length <= MAX_TITLE
      ? title
      : 'Slot ' + (n + 1);

  const now = Date.now();

  const existing = await db
    .collection(COLLECTION)
    .where('firebase_uid', '==', user.sub)
    .where('slot', '==', n)
    .limit(1)
    .get();

  if (!existing.empty) {
    const ref = existing.docs[0].ref;
    await ref.update({ title: cleanTitle, content, updated_at: now });
    return res.status(200).json({ slot: n, title: cleanTitle, content, updated_at: now, updated: true });
  }

  const payload = {
    firebase_uid: user.sub,
    slot: n,
    title: cleanTitle,
    content,
    created_at: now,
    updated_at: now,
  };
  const ref = await db.collection(COLLECTION).add(payload);
  return res.status(201).json({ slot: n, title: cleanTitle, content, updated_at: now, updated: false, id: ref.id });
}

// ── DELETE (kosongkan slot) ─────────────────────────
async function handleDelete(req, res, user, db) {
  const { slot } = req.query || {};
  const n = parseSlot(slot);
  if (n === null) {
    return res.status(400).json({ error: 'slot harus 0..' + (MAX_SLOTS - 1) });
  }

  const snap = await db
    .collection(COLLECTION)
    .where('firebase_uid', '==', user.sub)
    .where('slot', '==', n)
    .limit(1)
    .get();

  if (snap.empty) {
    return res.status(200).json({ ok: true, deleted: 0 });
  }

  await snap.docs[0].ref.delete();
  return res.status(200).json({ ok: true, deleted: 1 });
}
