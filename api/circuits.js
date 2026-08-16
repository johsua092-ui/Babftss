// api/circuits.js — Simpan/Muat/Hapus rangkaian (circuit) milik member
//
// Auth : Firebase token (Bearer) REQUIRED — guest TIDAK bisa simpan.
//        Guest yang memaksa akan mendapat 401 dengan pesan agar masuk jadi member.
// Storage : Firestore project "punya-si-jawa" (via FIREBASE_ADMIN_* named app).
//
// Endpoint:
//   GET    /api/circuits          -> daftar rangkaian milik user
//   GET    /api/circuits?id=xxx   -> muat satu rangkaian (wajib milik user)
//   POST   /api/circuits          -> simpan/upsert rangkaian
//   DELETE /api/circuits?id=xxx   -> hapus rangkaian
import {
  applyCors,
  applySecurityHeaders,
  checkRateLimit,
  authenticateRequest,
  validateStr,
  safeError,
  getPunyaSiJawaFirestore,
} from '../lib/api-helpers.js';

const COLLECTION = 'circuits';

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
    return safeError(res, 500, 'circuits', e);
  }
}

// ── GET /api/circuits ──────────────────────────────────────────
//    ?id=xxx -> muat satu dokumen (harus milik user)
//    tanpa id -> daftar semua rangkaian milik user
async function handleGet(req, res, user, db) {
  const { id } = req.query || {};

  if (id) {
    if (!validateStr(id, 200)) {
      return res.status(400).json({ error: 'id tidak valid' });
    }
    const snap = await db
      .collection(COLLECTION)
      .where('firebase_uid', '==', user.sub)
      .where('item_id', '==', id)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: 'Rangkaian tidak ditemukan' });
    }
    const doc = snap.docs[0];
    return res.status(200).json({ circuit: { id: doc.id, ...doc.data() } });
  }

  // NOTE: tidak pakai .orderBy() karena butuh composite index di Firestore.
  //       Urutkan di memori saja (jumlah rangkaian per user kecil).
  const snap = await db
    .collection(COLLECTION)
    .where('firebase_uid', '==', user.sub)
    .get();

  const circuits = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
  return res.status(200).json({ circuits, total: circuits.length });
}

// ── POST /api/circuits ──────────────────────────────────────────
//    Body: { itemId: string, name?: string, data: object }
//    Upsert — kalau item_id sudah ada untuk user ini, update; else insert.
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

  // Cari dokumen existing untuk upsert (Firestore tidak punya upsert native
  // dengan key custom, jadi cari dulu lalu update/insert).
  const existing = await db
    .collection(COLLECTION)
    .where('firebase_uid', '==', user.sub)
    .where('item_id', '==', itemId)
    .limit(1)
    .get();

  if (!existing.empty) {
    const docRef = existing.docs[0].ref;
    await docRef.update({
      name: payload.name,
      data,
      updated_at: now,
    });
    return res.status(200).json({ circuit: { id: docRef.id, ...payload }, updated: true });
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

  const snap = await db
    .collection(COLLECTION)
    .where('firebase_uid', '==', user.sub)
    .where('item_id', '==', id)
    .limit(1)
    .get();

  if (snap.empty) {
    return res.status(404).json({ error: 'Rangkaian tidak ditemukan' });
  }

  await snap.docs[0].ref.delete();
  return res.status(200).json({ ok: true, deleted: 1 });
}
