// api/circuits.js — Simpan/Muat/Hapus rangkaian (circuit) milik member
//
// Auth : Firebase token (Bearer) REQUIRED — guest TIDAK bisa simpan.
//        Guest yang memaksa akan mendapat 401 dengan pesan agar masuk jadi member.
// Storage : Firestore project "punya-si-jawa" (via FIREBASE_ADMIN_* named app).
//
// CATATAN INDEX: semua query sengaja memakai SATU equality filter saja
// (`firebase_uid`) lalu memfilter `item_id` di memori + sort di memori,
// supaya TIDAK butuh composite index Firestore (yang sering jadi penyebab 500).
//
// Endpoint:
//   GET    /api/circuits                           -> daftar rangkaian milik user
//   GET    /api/circuits?id=xxx                    -> muat satu rangkaian (wajib milik user)
//   POST   /api/circuits                           -> simpan/upsert rangkaian
//   DELETE /api/circuits?id=xxx                    -> hapus rangkaian
//   GET    /api/circuits?action=history&id=xxx      -> daftar 10 history slot
//   POST   /api/circuits?action=history_load         -> load dari history { itemId, historyIndex }
import {
  applyCors,
  applySecurityHeaders,
  checkRateLimit,
  authenticateRequest,
  validateStr,
  getPunyaSiJawaFirestore,
} from '../lib/api-helpers.js';

const COLLECTION = 'circuits';
const HISTORY_COLLECTION = 'circuits_history';
const MAX_HISTORY = 10;

export default async function handler(req, res) {
  applyCors(req, res, 'GET, POST, DELETE, OPTIONS');
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const ip =
      req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit('circuits:' + ip, 60, 60000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    // ── Auth: WAJIB member — guest ditolak ─────────────────────────
    const user = await authenticateRequest(req);
    if (!user) {
      return res.status(401).json({
        error: 'Tolong masuk menjadi member untuk menyimpan rangkaian',
        code: 'AUTH_REQUIRED',
      });
    }

    const db = await getPunyaSiJawaFirestore();

    const { action } = req.query || {};

    // ── History endpoints ──
    if (action === 'history') return handleHistory(req, res, user, db);
    if (action === 'history_load') return handleHistoryLoad(req, res, user, db);

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
    console.error('[circuits] error:', e);
    return res.status(500).json({
      error: e?.message || String(e),
      detail: e?.code || null,
      stack: (e?.stack || '').split('\n').slice(0, 5).join(' | '),
    });
  }
}

function byUserId(db, uid) {
  return db.collection(COLLECTION).where('firebase_uid', '==', uid);
}

// ── GET /api/circuits ──────────────────────────────────────────
async function handleGet(req, res, user, db) {
  const { id } = req.query || {};

  if (id) {
    if (!validateStr(id, 200)) {
      return res.status(400).json({ error: 'id tidak valid' });
    }
    const snap = await byUserId(db, user.sub).get();
    const doc = snap.docs.find((d) => d.data().item_id === id);
    if (!doc) {
      return res.status(404).json({ error: 'Rangkaian tidak ditemukan' });
    }
    return res.status(200).json({ circuit: { id: doc.id, ...doc.data() } });
  }

  const snap = await byUserId(db, user.sub).get();
  const circuits = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
  return res.status(200).json({ circuits, total: circuits.length });
}

// ── POST /api/circuits ──────────────────────────────────────────
async function handlePost(req, res, user, db) {
  const { itemId, name, data } = req.body || {};

  if (!validateStr(itemId, 200)) {
    return res
      .status(400)
      .json({ error: 'itemId diperlukan (string, max 200 karakter)' });
  }
  if (data == null || typeof data !== 'object') {
    return res.status(400).json({ error: 'data (rangkaian) diperlukan sebagai object JSON' });
  }

  const now = Date.now();
  const payload = {
    firebase_uid: user.sub,
    item_id: itemId,
    name: validateStr(name, 200) ? name : 'Rangkaian tanpa nama',
    data,
    created_at: now,
    updated_at: now,
  };

  // Cari dokumen existing untuk upsert (filter item_id di memori — tanpa composite index).
  const existingSnap = await byUserId(db, user.sub).get();
  const oldDoc = existingSnap.docs.find((d) => d.data().item_id === itemId);

  if (oldDoc) {
    const oldData = oldDoc.data();

    // ── Push old save to history before overwriting ──
    if (oldData.data) {
      const historySnap = await db
        .collection(HISTORY_COLLECTION)
        .where('firebase_uid', '==', user.sub)
        .get();

      const historyDocs = historySnap.docs
        .filter((d) => d.data().item_id === itemId)
        .sort((a, b) => (b.data().pushed_at || 0) - (a.data().pushed_at || 0));

      // Jika sudah MAX_HISTORY, hapus yang tertua
      if (historyDocs.length >= MAX_HISTORY) {
        const toDelete = historyDocs.slice(MAX_HISTORY - 1);
        for (const d of toDelete) await d.ref.delete();
      }

      await db.collection(HISTORY_COLLECTION).add({
        firebase_uid: user.sub,
        item_id: itemId,
        name: oldData.name || '',
        data: oldData.data,
        pushed_at: now,
      });
    }

    await oldDoc.ref.update({
      name: payload.name,
      data,
      updated_at: now,
    });
    return res.status(200).json({ circuit: { id: oldDoc.id, ...payload }, updated: true });
  }

  const docRef = await db.collection(COLLECTION).add(payload);
  return res.status(201).json({ circuit: { id: docRef.id, ...payload }, updated: false });
}

// ── DELETE /api/circuits?id=xxx ──────────────────────────────────
async function handleDelete(req, res, user, db) {
  const { id } = req.query || {};

  if (!validateStr(id, 200)) {
    return res.status(400).json({ error: 'id diperlukan' });
  }

  const snap = await byUserId(db, user.sub).get();
  const doc = snap.docs.find((d) => d.data().item_id === id);

  if (!doc) {
    return res.status(404).json({ error: 'Rangkaian tidak ditemukan' });
  }

  await doc.ref.delete();
  return res.status(200).json({ ok: true, deleted: 1 });
}

// ── GET /api/circuits?action=history&id=xxx ──────────────────
async function handleHistory(req, res, user, db) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query || {};
  if (!validateStr(id, 200)) return res.status(400).json({ error: 'id diperlukan' });

  const snap = await db
    .collection(HISTORY_COLLECTION)
    .where('firebase_uid', '==', user.sub)
    .get();

  const sorted = snap.docs
    .filter((d) => d.data().item_id === id)
    .sort((a, b) => (b.data().pushed_at || 0) - (a.data().pushed_at || 0))
    .slice(0, MAX_HISTORY);

  const history = sorted.map((d, idx) => {
    const x = d.data();
    return { index: idx, id: d.id, name: x.name || null, data: x.data || null, pushed_at: x.pushed_at || null };
  });
  return res.status(200).json({ itemId: id, history, maxHistory: MAX_HISTORY });
}

// ── POST /api/circuits?action=history_load ──────────────────
async function handleHistoryLoad(req, res, user, db) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { itemId, historyIndex } = req.body || {};
  if (!validateStr(itemId, 200)) return res.status(400).json({ error: 'itemId diperlukan' });
  const hIdx = Number(historyIndex);
  if (!Number.isInteger(hIdx) || hIdx < 0 || hIdx >= MAX_HISTORY) return res.status(400).json({ error: 'historyIndex harus 0..' + (MAX_HISTORY - 1) });

  const snap = await db
    .collection(HISTORY_COLLECTION)
    .where('firebase_uid', '==', user.sub)
    .get();

  const sorted = snap.docs
    .filter((d) => d.data().item_id === itemId)
    .sort((a, b) => (b.data().pushed_at || 0) - (a.data().pushed_at || 0))
    .slice(0, MAX_HISTORY);

  if (hIdx >= sorted.length) return res.status(404).json({ error: 'History entry tidak ditemukan' });
  const doc = sorted[hIdx];
  const data = doc.data();
  return res.status(200).json({ itemId, historyIndex: hIdx, name: data.name || null, data: data.data || null, pushed_at: data.pushed_at || null });
}
