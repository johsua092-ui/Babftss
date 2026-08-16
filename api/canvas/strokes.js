// api/canvas/strokes.js — Simpan/Muat gambar coret-coret (strokes) Canvas
//
// Auth : Firebase token (Bearer) REQUIRED — guest TIDAK bisa simpan.
// Storage : Firestore "punya-si-jawa", koleksi `canvas_strokes`.
//
// Stroke disimpan sebagai JSON string (array objek stroke) di dalam
// dokumen `data`. Frontend bebas menentukan struktur stroke-nya sendiri
// (paths, points, color, width, dst.) — backend hanya menyimpan/memuat.
//
// Endpoint:
//   GET  /api/canvas/strokes          -> muat stroke canvas user
//   POST /api/canvas/strokes          -> simpan stroke { data: object }
//   DELETE /api/canvas/strokes        -> hapus stroke canvas user
import {
  applyCors,
  applySecurityHeaders,
  checkRateLimit,
  authenticateRequest,
  safeError,
  getPunyaSiJawaFirestore,
} from '../../lib/api-helpers.js';

const COLLECTION = 'canvas_strokes';
const MAX_JSON_BYTES = 500000; // maks 500 KB per canvas (cukup untuk banyak stroke)

export default async function handler(req, res) {
  applyCors(req, res, 'GET, POST, DELETE, OPTIONS');
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit('canvas-strokes:' + ip, 60, 60000)) {
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
    return safeError(res, 500, 'canvas-strokes', e);
  }
}

async function findDoc(db, uid) {
  const snap = await db
    .collection(COLLECTION)
    .where('firebase_uid', '==', uid)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0];
}

// ── GET ──────────────────────────────────────────────
async function handleGet(req, res, user, db) {
  const doc = await findDoc(db, user.sub);
  if (!doc) {
    return res.status(200).json({ strokes: null, updated_at: null });
  }
  return res.status(200).json({
    strokes: doc.data().data || null,
    updated_at: doc.data().updated_at || null,
    updatedAt: doc.data().updated_at || null,
  });
}

// ── POST (upsert) ────────────────────────────────────
async function handlePost(req, res, user, db) {
  const { data } = req.body || {};

  if (data == null || typeof data !== 'object') {
    return res.status(400).json({ error: 'data (strokes) diperlukan sebagai object JSON' });
  }

  const jsonStr = JSON.stringify(data);
  if (Buffer.byteLength(jsonStr, 'utf-8') > MAX_JSON_BYTES) {
    return res.status(400).json({ error: 'data terlalu besar (max ' + MAX_JSON_BYTES + ' bytes)' });
  }

  const now = Date.now();
  const doc = await findDoc(db, user.sub);

  if (doc) {
    await doc.ref.update({ data, updated_at: now });
    return res.status(200).json({ ok: true, updated: true, updated_at: now });
  }

  const payload = {
    firebase_uid: user.sub,
    data,
    created_at: now,
    updated_at: now,
  };
  const ref = await db.collection(COLLECTION).add(payload);
  return res.status(201).json({ ok: true, updated: false, updated_at: now, id: ref.id });
}

// ── DELETE ───────────────────────────────────────────
async function handleDelete(req, res, user, db) {
  const doc = await findDoc(db, user.sub);
  if (!doc) {
    return res.status(200).json({ ok: true, deleted: 0 });
  }
  await doc.ref.delete();
  return res.status(200).json({ ok: true, deleted: 1 });
}
