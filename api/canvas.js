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
      case 'dataset_status':
        return handleDatasetStatus(req, res, user, db);
      case 'dataset_list':
        return handleDatasetList(req, res, user, db);
      case 'dataset_upload':
        return handleDatasetUpload(req, res, user, db);
      case 'dataset_process':
        return handleDatasetProcess(req, res, user, db);
      case 'dataset_delete':
        return handleDatasetDelete(req, res, user, db);
      case 'dataset_clear':
        return handleDatasetClear(req, res, user, db);
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

// ════════════════════════════════════════════════════════════════
// DATASET IMAGE — Fitur "belajar" AI Helper
// Routing: action=dataset_status | dataset_list | dataset_upload |
//          dataset_process | dataset_delete | dataset_clear
// (digabung ke file ini agar total serverless function <= 12 limit Hobby)
// ════════════════════════════════════════════════════════════════
const DATASET_COLLECTION = 'dataset_images';
const MAX_IMAGES = 100;
const MAX_BASE64_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

async function handleDatasetStatus(req, res, user, db) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const snap = await db.collection(DATASET_COLLECTION).where('firebase_uid', '==', user.sub).get();
  let processed = 0, pending = 0, failed = 0;
  snap.docs.forEach((d) => {
    const s = d.data().status;
    if (s === 'done') processed++;
    else if (s === 'failed') failed++;
    else pending++;
  });
  return res.status(200).json({
    total: snap.docs.length,
    max: MAX_IMAGES,
    remaining: Math.max(0, MAX_IMAGES - snap.docs.length),
    processed,
    pending,
    failed,
  });
}

async function handleDatasetList(req, res, user, db) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const snap = await db.collection(DATASET_COLLECTION).where('firebase_uid', '==', user.sub).get();
  const items = snap.docs
    .map((d) => {
      const x = d.data();
      return {
        id: d.id,
        filename: x.filename,
        mime_type: x.mime_type,
        size_bytes: x.size_bytes,
        status: x.status,
        description: x.description || null,
        created_at: x.created_at,
        updated_at: x.updated_at,
      };
    })
    .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
  return res.status(200).json({ images: items, total: items.length, max: MAX_IMAGES });
}

async function handleDatasetUpload(req, res, user, db) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const existing = await db.collection(DATASET_COLLECTION).where('firebase_uid', '==', user.sub).get();
  if (existing.docs.length >= MAX_IMAGES) {
    return res.status(400).json({
      error: 'Kuota dataset penuh (' + MAX_IMAGES + ' image). Hapus dulu sebelum upload lagi.',
      code: 'QUOTA_FULL',
    });
  }

  const { filename, mime_type, data_base64, url } = req.body || {};
  let base64 = null;
  let finalMime = mime_type || null;

  if (data_base64 && typeof data_base64 === 'string') {
    base64 = data_base64.replace(/^data:[^;]+;base64,/, '');
    if (!finalMime && /^data:([^;]+);base64,/.test(data_base64)) {
      finalMime = data_base64.match(/^data:([^;]+);base64,/)[1];
    }
  } else if (url && typeof url === 'string') {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!resp.ok) return res.status(400).json({ error: 'Gagal mengunduh URL (' + resp.status + ')' });
      const buf = Buffer.from(await resp.arrayBuffer());
      base64 = buf.toString('base64');
      finalMime = finalMime || resp.headers.get('content-type') || null;
    } catch {
      return res.status(400).json({ error: 'URL tidak dapat diakses' });
    }
  } else {
    return res.status(400).json({ error: 'Sediakan data_base64 ATAU url' });
  }

  if (!finalMime || !ALLOWED_MIME.includes(finalMime)) {
    return res.status(400).json({ error: 'Tipe gambar tidak didukung (' + ALLOWED_MIME.join(', ') + ')' });
  }
  if (!base64 || base64.length === 0) return res.status(400).json({ error: 'Data gambar kosong' });
  const sizeBytes = Math.ceil(base64.length * 0.75);
  if (sizeBytes > MAX_BASE64_BYTES) return res.status(400).json({ error: 'Gambar terlalu besar (max 8 MB)' });

  const now = Date.now();
  const payload = {
    firebase_uid: user.sub,
    filename: typeof filename === 'string' && filename ? filename.slice(0, 200) : 'image-' + now,
    mime_type: finalMime,
    size_bytes: sizeBytes,
    data_base64: base64,
    status: 'pending',
    description: null,
    created_at: now,
    updated_at: now,
  };
  const ref = await db.collection(DATASET_COLLECTION).add(payload);
  return res.status(201).json({
    id: ref.id,
    filename: payload.filename,
    mime_type: finalMime,
    size_bytes: sizeBytes,
    status: 'pending',
    remaining: Math.max(0, MAX_IMAGES - existing.docs.length - 1),
  });
}

async function handleDatasetProcess(req, res, user, db) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query || {};
  if (!id || typeof id !== 'string' || id.length > 200) {
    return res.status(400).json({ error: 'id diperlukan' });
  }
  const doc = await db.collection(DATASET_COLLECTION).doc(id).get();
  if (!doc.exists || doc.data().firebase_uid !== user.sub) {
    return res.status(404).json({ error: 'Image tidak ditemukan' });
  }
  const result = await processDatasetImage(doc.data());
  if (result.status === 'done') {
    await doc.ref.update({ status: 'done', description: result.description, updated_at: Date.now() });
    return res.status(200).json({ id, status: 'done', description: result.description });
  }
  return res.status(202).json({ id, status: 'pending', description: null, note: result.note });
}

// Stub vision — ganti isi ini saat provider dipilih.
async function processDatasetImage(image) {
  return { status: 'pending', description: null, note: 'Vision belum dikonfigurasi' + (image.mime_type ? ' (' + image.mime_type + ')' : '') };
}

async function handleDatasetDelete(req, res, user, db) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query || {};
  if (!id || typeof id !== 'string' || id.length > 200) {
    return res.status(400).json({ error: 'id diperlukan' });
  }
  const doc = await db.collection(DATASET_COLLECTION).doc(id).get();
  if (!doc.exists || doc.data().firebase_uid !== user.sub) {
    return res.status(404).json({ error: 'Image tidak ditemukan' });
  }
  await doc.ref.delete();
  return res.status(200).json({ ok: true, deleted: 1 });
}

async function handleDatasetClear(req, res, user, db) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  const snap = await db.collection(DATASET_COLLECTION).where('firebase_uid', '==', user.sub).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return res.status(200).json({ ok: true, deleted: snap.docs.length });
}
