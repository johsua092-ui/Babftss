// api/circuits.js — Simpan/Muat/Hapus rangkaian (circuit) milik member
//
// Auth   : Firebase token (Bearer) REQUIRED — guest TIDAK bisa simpan.
// Storage: Supabase Postgres (tabel `circuits` & `circuits_history`) via
//          service role (getSupabaseAdmin). Tidak ada composite index /
//          Firestore lagi — menghilangkan error 500 kompleks.
//
// Endpoint:
//   GET    /api/circuits                           -> daftar rangkaian milik user
//   GET    /api/circuits?id=xxx                    -> muat satu rangkaian
//   POST   /api/circuits                           -> simpan/upsert rangkaian
//   DELETE /api/circuits?id=xxx                    -> hapus rangkaian
//   GET    /api/circuits?action=history&id=xxx      -> daftar 10 history slot
//   POST   /api/circuits?action=history_load         -> load history { itemId, historyIndex }
import {
  applyCors,
  applySecurityHeaders,
  checkRateLimit,
  authenticateRequest,
  validateStr,
  getSupabaseAdmin,
  isAdmin,
} from '../lib/api-helpers.js';

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

    const user = await authenticateRequest(req);
    if (!user) {
      return res.status(401).json({
        error: 'Tolong masuk menjadi member untuk menyimpan rangkaian',
        code: 'AUTH_REQUIRED',
      });
    }

    const supabase = await getSupabaseAdmin();

    const { action } = req.query || {};

    if (action === 'history') return handleHistory(req, res, user, supabase);
    if (action === 'history_load') return handleHistoryLoad(req, res, user, supabase);

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, user, supabase);
      case 'POST':
        return handlePost(req, res, user, supabase);
      case 'DELETE':
        return handleDelete(req, res, user, supabase);
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

// ── GET /api/circuits ──────────────────────────────────────────
async function handleGet(req, res, user, supabase) {
  const { id } = req.query || {};

  if (id) {
    if (!validateStr(id, 200)) {
      return res.status(400).json({ error: 'id tidak valid' });
    }
    const { data, error } = await supabase
      .from('circuits')
      .select('*')
      .eq('firebase_uid', user.sub)
      .eq('item_id', id)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Rangkaian tidak ditemukan' });
    }
    return res.status(200).json({ circuit: data });
  }

  const { data, error } = await supabase
    .from('circuits')
    .select('*')
    .eq('firebase_uid', user.sub)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  const circuits = data || [];
  return res.status(200).json({ circuits, total: circuits.length });
}

// ── POST /api/circuits ──────────────────────────────────────────
async function handlePost(req, res, user, supabase) {
  const { itemId, name, data } = req.body || {};

  if (!validateStr(itemId, 200)) {
    return res
      .status(400)
      .json({ error: 'itemId diperlukan (string, max 200 karakter)' });
  }
  if (data == null || typeof data !== 'object') {
    return res.status(400).json({ error: 'data (rangkaian) diperlukan sebagai object JSON' });
  }

  // Cari dokumen existing milik user ini.
  const { data: existing, error: qErr } = await supabase
    .from('circuits')
    .select('*')
    .eq('firebase_uid', user.sub)
    .eq('item_id', itemId)
    .limit(1)
    .maybeSingle();

  if (qErr) throw qErr;

  const cleanName = validateStr(name, 200) ? name : 'Rangkaian tanpa nama';

  if (existing) {
    // Push old save ke history sebelum di-overwrite.
    // Skip history jika metaOnly=true (hanya update metadata, bukan circuit baru)
    const metaOnly = req.body.metaOnly === true;
    if (!metaOnly && existing.data != null) {
      const { data: hist, error: hErr } = await supabase
        .from('circuits_history')
        .select('*')
        .eq('firebase_uid', user.sub)
        .eq('item_id', itemId)
        .order('pushed_at', { ascending: false });

      if (hErr) throw hErr;

      const historyDocs = hist || [];
      // Hapus yang tertua jika sudah MAX_HISTORY
      if (historyDocs.length >= MAX_HISTORY) {
        const toDelete = historyDocs.slice(MAX_HISTORY - 1).map((d) => d.id);
        await supabase.from('circuits_history').delete().in('id', toDelete);
      }

      await supabase.from('circuits_history').insert({
        firebase_uid: user.sub,
        item_id: itemId,
        name: existing.name || '',
        data: existing.data,
        pushed_at: new Date().toISOString(),
      });
    }

    const { error: upErr } = await supabase
      .from('circuits')
      .update({ name: cleanName, data, updated_at: new Date().toISOString() })
      .eq('firebase_uid', user.sub)
      .eq('item_id', itemId);

    if (upErr) throw upErr;

    return res.status(200).json({
      circuit: { id: existing.id, firebase_uid: user.sub, item_id: itemId, name: cleanName, data },
      updated: true,
    });
  }

  const now = new Date().toISOString();
  const { data: inserted, error: insErr } = await supabase
    .from('circuits')
    .insert({
      firebase_uid: user.sub,
      item_id: itemId,
      name: cleanName,
      data,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .maybeSingle();

  if (insErr) throw insErr;

  return res.status(201).json({ circuit: inserted, updated: false });
}

// ── DELETE /api/circuits?id=xxx ──────────────────────────────────
async function handleDelete(req, res, user, supabase) {
  const { id } = req.query || {};

  if (!validateStr(id, 200)) {
    return res.status(400).json({ error: 'id diperlukan' });
  }

  // Slot yang sudah dibeli (save-slot-*) TIDAK bisa dihapus oleh member — hanya admin
  if (id.startsWith('save-slot-') && !isAdmin(user)) {
    return res.status(403).json({ error: 'Slot tidak bisa dihapus. Slot yang sudah dibeli bersifat permanen.' });
  }

  const { data: existing, error: qErr } = await supabase
    .from('circuits')
    .select('id')
    .eq('firebase_uid', user.sub)
    .eq('item_id', id)
    .limit(1)
    .maybeSingle();

  if (qErr) throw qErr;
  if (!existing) {
    return res.status(404).json({ error: 'Rangkaian tidak ditemukan' });
  }

  const { error: delErr } = await supabase
    .from('circuits')
    .delete()
    .eq('id', existing.id);

  if (delErr) throw delErr;

  return res.status(200).json({ ok: true, deleted: 1 });
}

// ── GET /api/circuits?action=history&id=xxx ──────────────────
async function handleHistory(req, res, user, supabase) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query || {};
  if (!validateStr(id, 200)) return res.status(400).json({ error: 'id diperlukan' });

  const { data, error } = await supabase
    .from('circuits_history')
    .select('*')
    .eq('firebase_uid', user.sub)
    .eq('item_id', id)
    .order('pushed_at', { ascending: false })
    .limit(MAX_HISTORY);

  if (error) throw error;

  const history = (data || []).map((x, idx) => ({
    index: idx,
    id: x.id,
    name: x.name || null,
    data: x.data || null,
    pushed_at: x.pushed_at || null,
  }));
  return res.status(200).json({ itemId: id, history, maxHistory: MAX_HISTORY });
}

// ── POST /api/circuits?action=history_load ──────────────────
async function handleHistoryLoad(req, res, user, supabase) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { itemId, historyIndex } = req.body || {};
  if (!validateStr(itemId, 200)) return res.status(400).json({ error: 'itemId diperlukan' });
  const hIdx = Number(historyIndex);
  if (!Number.isInteger(hIdx) || hIdx < 0 || hIdx >= MAX_HISTORY) return res.status(400).json({ error: 'historyIndex harus 0..' + (MAX_HISTORY - 1) });

  const { data, error } = await supabase
    .from('circuits_history')
    .select('*')
    .eq('firebase_uid', user.sub)
    .eq('item_id', itemId)
    .order('pushed_at', { ascending: false })
    .limit(MAX_HISTORY);

  if (error) throw error;

  const sorted = data || [];
  if (hIdx >= sorted.length) return res.status(404).json({ error: 'History entry tidak ditemukan' });
  const x = sorted[hIdx];
  return res.status(200).json({
    itemId,
    historyIndex: hIdx,
    name: x.name || null,
    data: x.data || null,
    pushed_at: x.pushed_at || null,
  });
}
