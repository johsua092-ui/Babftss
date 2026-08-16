// api/dataset.js — Dataset Image untuk "belajar" AI Helper
//
// User bisa mengupload sampai MAX_IMAGES (100) gambar sebagai dataset.
// Tiap gambar akan "dibaca" AI (vision) lalu hasilnya disimpan sebagai
// deskripsi — proses "ingatan" AI.
//
// Routing pakai `action` (satu serverless function, hemat kuota Hobby):
//
//   GET    /api/dataset?action=status          -> kuota & jumlah terbaca
//   GET    /api/dataset?action=list            -> daftar image user
//   POST   /api/dataset?action=upload          -> upload 1 image (base64/url)
//   POST   /api/dataset?action=process&id=xxx  -> paksa proses (vision) 1 image
//   DELETE /api/dataset?action=delete&id=xxx   -> hapus satu image
//   DELETE /api/dataset?action=clear           -> hapus SEMUA image user
//
// Auth : Bearer Firebase token (member only).
// Storage metadata : Firestore "punya-si-jawa" koleksi `dataset_images`.
// Vision : di-stub di processImage(); tinggal colok provider (self-host VPS
//          atau Gemini/OpenAI) nanti. Sampai terisi, status = "pending".
import {
  applyCors,
  applySecurityHeaders,
  checkRateLimit,
  authenticateRequest,
  safeError,
  getPunyaSiJawaFirestore,
} from '../lib/api-helpers.js';

const COLLECTION = 'dataset_images';
const MAX_IMAGES = 100;                 // batas dataset per user
const MAX_BASE64_BYTES = 8 * 1024 * 1024; // max 8 MB per image (base64)
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export default async function handler(req, res) {
  applyCors(req, res, 'GET, POST, DELETE, OPTIONS');
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit('dataset:' + ip, 120, 60000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const user = await authenticateRequest(req);
    if (!user) {
      return res.status(401).json({
        error: 'Tolong masuk menjadi member untuk menggunakan dataset AI',
        code: 'AUTH_REQUIRED',
      });
    }

    const db = await getPunyaSiJawaFirestore();
    const { action } = req.query || {};

    switch (action) {
      case 'status':
        return handleStatus(req, res, user, db);
      case 'list':
        return handleList(req, res, user, db);
      case 'upload':
        return handleUpload(req, res, user, db);
      case 'process':
        return handleProcess(req, res, user, db);
      case 'delete':
        return handleDelete(req, res, user, db);
      case 'clear':
        return handleClear(req, res, user, db);
      default:
        return res.status(404).json({ error: 'Action tidak dikenal' });
    }
  } catch (e) {
    return safeError(res, 500, 'dataset', e);
  }
}

// ── status ─────────────────────────────────────────
async function handleStatus(req, res, user, db) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const snap = await db.collection(COLLECTION).where('firebase_uid', '==', user.sub).get();
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

// ── list ───────────────────────────────────────────
async function handleList(req, res, user, db) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const snap = await db.collection(COLLECTION).where('firebase_uid', '==', user.sub).get();
  // Data base64 tidak dikirim penuh ke list (hemat payload) — hanya metadata.
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

// ── upload ─────────────────────────────────────────
async function handleUpload(req, res, user, db) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Cek kuota dulu
  const existing = await db.collection(COLLECTION).where('firebase_uid', '==', user.sub).get();
  if (existing.docs.length >= MAX_IMAGES) {
    return res.status(400).json({
      error: 'Kuota dataset penuh (' + MAX_IMAGES + ' image). Hapus dulu sebelum upload lagi.',
      code: 'QUOTA_FULL',
    });
  }

  const { filename, mime_type, data_base64, url } = req.body || {};

  // dua mode: base64 langsung, atau URL (di-download sisi server)
  let base64 = null;
  let finalMime = mime_type || null;

  if (data_base64 && typeof data_base64 === 'string') {
    // strip prefix data:image/...;base64, kalau ada
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
  if (!base64 || base64.length === 0) {
    return res.status(400).json({ error: 'Data gambar kosong' });
  }
  const sizeBytes = Math.ceil(base64.length * 0.75);
  if (sizeBytes > MAX_BASE64_BYTES) {
    return res.status(400).json({ error: 'Gambar terlalu besar (max 8 MB)' });
  }

  const now = Date.now();
  const payload = {
    firebase_uid: user.sub,
    filename: typeof filename === 'string' && filename ? filename.slice(0, 200) : 'image-' + now,
    mime_type: finalMime,
    size_bytes: sizeBytes,
    // Supla storage: simpan base64 di Firestore utk kesederhanaan (bisa dipindah
    // ke Supabase Storage / bucket nanti — kontrak API ke frontend tetap sama).
    data_base64: base64,
    status: 'pending',
    description: null,
    created_at: now,
    updated_at: now,
  };

  const ref = await db.collection(COLLECTION).add(payload);
  return res.status(201).json({
    id: ref.id,
    filename: payload.filename,
    mime_type: finalMime,
    size_bytes: sizeBytes,
    status: 'pending',
    remaining: Math.max(0, MAX_IMAGES - existing.docs.length - 1),
  });
}

// ── process (vision, di-stub) ──────────────────────
async function handleProcess(req, res, user, db) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query || {};
  if (!id || typeof id !== 'string' || id.length > 200) {
    return res.status(400).json({ error: 'id diperlukan' });
  }

  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists || doc.data().firebase_uid !== user.sub) {
    return res.status(404).json({ error: 'Image tidak ditemukan' });
  }

  // TODO(vision): panggil model vision (self-host VPS / Gemini / OpenAI) di sini,
  // dapatkan deskripsi, set status "done". Sampai terisi → status tetap "pending".
  const result = await processImage(doc.data());
  if (result.status === 'done') {
    await doc.ref.update({ status: 'done', description: result.description, updated_at: Date.now() });
    return res.status(200).json({ id, status: 'done', description: result.description });
  }
  return res.status(202).json({ id, status: 'pending', description: null, note: result.note });
}

// Stub vision — ganti isi ini saat provider dipilih.
async function processImage(image) {
  // Saat ini belum ada model vision. Kembalikan pending + catatan.
  return { status: 'pending', description: null, note: 'Vision belum dikonfigurasi' + (image.mime_type ? ' (' + image.mime_type + ')' : '') };
}

// ── delete ─────────────────────────────────────────
async function handleDelete(req, res, user, db) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query || {};
  if (!id || typeof id !== 'string' || id.length > 200) {
    return res.status(400).json({ error: 'id diperlukan' });
  }
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists || doc.data().firebase_uid !== user.sub) {
    return res.status(404).json({ error: 'Image tidak ditemukan' });
  }
  await doc.ref.delete();
  return res.status(200).json({ ok: true, deleted: 1 });
}

// ── clear (hapus semua) ────────────────────────────
async function handleClear(req, res, user, db) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  const snap = await db.collection(COLLECTION).where('firebase_uid', '==', user.sub).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return res.status(200).json({ ok: true, deleted: snap.docs.length });
}
