// api/canvas.js — Fitur Canvas (satu serverless function, routing internal)
//
// Digabung jadi SATU function karena Vercel Hobby plan membatasi maks 12
// serverless functions per deployment. Routing pakai query param `action`:
//
//   GET    /api/canvas?action=access           -> cek login (gating menu redup)
//   GET    /api/canvas?action=prompts          -> daftar 3 slot (0..2)
//   GET    /api/canvas?action=prompts&slot=N   -> muat satu slot
//   POST   /api/canvas?action=prompts          -> simpan/upsert slot { slot, title?, content }
//   DELETE /api/canvas?action=prompts&slot=N   -> kosongkan slot
//   GET    /api/canvas?action=strokes          -> muat coret-coret
//   POST   /api/canvas?action=strokes          -> simpan coret-coret { data }
//   DELETE /api/canvas?action=strokes          -> hapus coret-coret
//
// Auth : Firebase token (Bearer). `access` boleh guest (balikin allowed:false).
//        Semua action lain WAJIB member (guest -> 401 AUTH_REQUIRED).
// Storage : Firestore "punya-si-jawa" (canvas_prompts, canvas_strokes).
import {
  applyCors,
  applySecurityHeaders,
  checkRateLimit,
  authenticateRequest,
  safeError,
  getPunyaSiJawaFirestore,
} from '../lib/api-helpers.js';

const PROMPTS_COLLECTION = 'canvas_prompts';
const STROKES_COLLECTION = 'canvas_strokes';
const MAX_SLOTS = 3;
const MAX_CONTENT = 20000;
const MAX_TITLE = 200;
const MAX_JSON_BYTES = 500000;

export default async function handler(req, res) {
  applyCors(req, res, 'GET, POST, DELETE, OPTIONS');
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit('canvas:' + ip, 60, 60000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const { action } = req.query || {};

    // ── access: boleh guest (untuk meredupkan menu) ──────────────
    if (req.method === 'GET' && action === 'access') {
      const user = await authenticateRequest(req);
      if (!user) {
        return res.status(200).json({
          allowed: false,
          reason: 'Tolong masuk menjadi member untuk menggunakan Canvas',
          code: 'AUTH_REQUIRED',
        });
      }
      return handleAccess(res, user);
    }

    // ── selain access: WAJIB member ──────────────────────────────
    const user = await authenticateRequest(req);
    if (!user) {
      return res.status(401).json({
        error: 'Tolong masuk menjadi member untuk menggunakan Canvas',
        code: 'AUTH_REQUIRED',
      });
    }

    const db = await getPunyaSiJawaFirestore();

    switch (action) {
      case 'prompts':
        return handlePrompts(req, res, user, db);
      case 'strokes':
        return handleStrokes(req, res, user, db);
      default:
        return res.status(404).json({ error: 'Action tidak dikenal' });
    }
  } catch (e) {
    return safeError(res, 500, 'canvas', e);
  }
}

// ── access ──────────────────────────────────────────
async function handleAccess(res, user) {
  const db = await getPunyaSiJawaFirestore();
  const snap = await db.collection(PROMPTS_COLLECTION).where('firebase_uid', '==', user.sub).get();

  const filled = new Set();
  snap.docs.forEach((d) => {
    const s = d.data().slot;
    if (typeof s === 'number' && s >= 0 && s < MAX_SLOTS) filled.add(s);
  });

  const slots = [];
  for (let i = 0; i < MAX_SLOTS; i++) slots.push({ slot: i, filled: filled.has(i) });

  return res.status(200).json({ allowed: true, uid: user.sub, maxSlots: MAX_SLOTS, slots });
}

// ── prompts ─────────────────────────────────────────
function parseSlot(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n >= MAX_SLOTS) return null;
  return n;
}

async function handlePrompts(req, res, user, db) {
  if (req.method === 'GET') {
    const { slot } = req.query || {};
    const snap = await db.collection(PROMPTS_COLLECTION).where('firebase_uid', '==', user.sub).get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (slot !== undefined) {
      const n = parseSlot(slot);
      if (n === null) return res.status(400).json({ error: 'slot harus 0..' + (MAX_SLOTS - 1) });
      const found = items.find((s) => s.slot === n);
      if (!found) return res.status(200).json({ slot: n, content: null, title: null });
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
      const f = items.find((s) => s.slot === i);
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

  if (req.method === 'POST') {
    const { slot, title, content } = req.body || {};
    const n = parseSlot(slot);
    if (n === null) return res.status(400).json({ error: 'slot harus 0..' + (MAX_SLOTS - 1) });
    if (typeof content !== 'string' || content.length === 0) {
      return res.status(400).json({ error: 'content (teks prompt/memory) wajib diisi' });
    }
    if (content.length > MAX_CONTENT) {
      return res.status(400).json({ error: 'content terlalu panjang (max ' + MAX_CONTENT + ' karakter)' });
    }

    const cleanTitle =
      typeof title === 'string' && title.length > 0 && title.length <= MAX_TITLE ? title : 'Slot ' + (n + 1);
    const now = Date.now();

    const existing = await db
      .collection(PROMPTS_COLLECTION)
      .where('firebase_uid', '==', user.sub)
      .where('slot', '==', n)
      .limit(1)
      .get();

    if (!existing.empty) {
      const ref = existing.docs[0].ref;
      await ref.update({ title: cleanTitle, content, updated_at: now });
      return res.status(200).json({ slot: n, title: cleanTitle, content, updated_at: now, updated: true });
    }

    const payload = { firebase_uid: user.sub, slot: n, title: cleanTitle, content, created_at: now, updated_at: now };
    const ref = await db.collection(PROMPTS_COLLECTION).add(payload);
    return res.status(201).json({ slot: n, title: cleanTitle, content, updated_at: now, updated: false, id: ref.id });
  }

  if (req.method === 'DELETE') {
    const { slot } = req.query || {};
    const n = parseSlot(slot);
    if (n === null) return res.status(400).json({ error: 'slot harus 0..' + (MAX_SLOTS - 1) });

    const snap = await db
      .collection(PROMPTS_COLLECTION)
      .where('firebase_uid', '==', user.sub)
      .where('slot', '==', n)
      .limit(1)
      .get();

    if (snap.empty) return res.status(200).json({ ok: true, deleted: 0 });
    await snap.docs[0].ref.delete();
    return res.status(200).json({ ok: true, deleted: 1 });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── strokes ─────────────────────────────────────────
async function findStrokeDoc(db, uid) {
  const snap = await db.collection(STROKES_COLLECTION).where('firebase_uid', '==', uid).limit(1).get();
  return snap.empty ? null : snap.docs[0];
}

async function handleStrokes(req, res, user, db) {
  if (req.method === 'GET') {
    const doc = await findStrokeDoc(db, user.sub);
    if (!doc) return res.status(200).json({ strokes: null, updated_at: null });
    return res.status(200).json({
      strokes: doc.data().data || null,
      updated_at: doc.data().updated_at || null,
      updatedAt: doc.data().updated_at || null,
    });
  }

  if (req.method === 'POST') {
    const { data } = req.body || {};
    if (data == null || typeof data !== 'object') {
      return res.status(400).json({ error: 'data (strokes) diperlukan sebagai object JSON' });
    }
    const jsonStr = JSON.stringify(data);
    if (Buffer.byteLength(jsonStr, 'utf-8') > MAX_JSON_BYTES) {
      return res.status(400).json({ error: 'data terlalu besar (max ' + MAX_JSON_BYTES + ' bytes)' });
    }

    const now = Date.now();
    const doc = await findStrokeDoc(db, user.sub);
    if (doc) {
      await doc.ref.update({ data, updated_at: now });
      return res.status(200).json({ ok: true, updated: true, updated_at: now });
    }
    const payload = { firebase_uid: user.sub, data, created_at: now, updated_at: now };
    const ref = await db.collection(STROKES_COLLECTION).add(payload);
    return res.status(201).json({ ok: true, updated: false, updated_at: now, id: ref.id });
  }

  if (req.method === 'DELETE') {
    const doc = await findStrokeDoc(db, user.sub);
    if (!doc) return res.status(200).json({ ok: true, deleted: 0 });
    await doc.ref.delete();
    return res.status(200).json({ ok: true, deleted: 1 });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
