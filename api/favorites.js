// api/favorites.js — Favorites/Love API
// Auth: Firebase token (Bearer) REQUIRED — guest TIDAK bisa akses
// Storage: Supabase (via service_role)
import {
  applyCors,
  applySecurityHeaders,
  checkRateLimit,
  authenticateRequest,
  validateStr,
  safeError,
  getSupabaseAdmin,
} from '../lib/api-helpers.js';

// ── Allowed item types ───────────────────────────────────────
const VALID_ITEM_TYPES = new Set([
  'gate',       // 7 Basic Logic Gates
  'circuit',    // Logic Gates Circuit
  'gear',       // Gears
  'linkage',    // Linkages Mechanic
]);

function isValidItemType(type) {
  return VALID_ITEM_TYPES.has(type);
}

// ── Handler ──────────────────────────────────────────────────
export default async function handler(req, res) {
  applyCors(req, res, 'GET, POST, DELETE, OPTIONS');
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── Rate limit ───────────────────────────────────────────
  try {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.socket?.remoteAddress ||
      'unknown';
    if (!checkRateLimit('favorites:' + ip, 60, 60000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    // ── Auth: WAJIB member, guest ditolak ─────────────────
    const user = await authenticateRequest(req);
    if (!user) {
      return res
        .status(401)
        .json({ error: 'Authentication required. Guests cannot save favorites.' });
    }

    const supabase = await getSupabaseAdmin();

    // ── Route ─────────────────────────────────────────────
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
    return safeError(res, 500, 'favorites', e);
  }
}

// ── GET /api/favorites?type=gate ─────────────────────────────
//    Returns all favorites for the authenticated user.
//    Optional ?type= filter (gate | circuit | gear | linkage)
async function handleGet(req, res, user, supabase) {
  const { type } = req.query || {};

  let query = supabase
    .from('favorites')
    .select('id, item_id, item_type, created_at')
    .eq('firebase_uid', user.sub)
    .order('created_at', { ascending: false });

  if (type) {
    if (!isValidItemType(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${[...VALID_ITEM_TYPES].join(', ')}`,
      });
    }
    query = query.eq('item_type', type);
  }

  const { data, error } = await query;

  if (error) {
    return safeError(res, 500, 'favorites-get', error);
  }

  return res.status(200).json({
    favorites: data || [],
    total: data?.length || 0,
  });
}

// ── POST /api/favorites ──────────────────────────────────────
//    Body: { itemId: string, itemType: string }
//    Adds a favorite. Idempotent — kalau udah ada, return existing.
async function handlePost(req, res, user, supabase) {
  const { itemId, itemType } = req.body || {};

  // Validation
  if (!validateStr(itemId, 100)) {
    return res
      .status(400)
      .json({ error: 'itemId is required (string, max 100 chars)' });
  }
  if (!itemType || !isValidItemType(itemType)) {
    return res.status(400).json({
      error: `itemType is required. Must be one of: ${[...VALID_ITEM_TYPES].join(', ')}`,
    });
  }

  // Upsert — idempotent, no duplicate errors
  const { data, error } = await supabase
    .from('favorites')
    .upsert(
      {
        firebase_uid: user.sub,
        item_id: itemId,
        item_type: itemType,
      },
      {
        onConflict: 'firebase_uid, item_id, item_type',
        ignoreDuplicates: true,
      }
    )
    .select('id, item_id, item_type, created_at')
    .single();

  if (error) {
    // Kalau conflict race-condition, fetch existing
    if (error.code === '23505' || error.message?.includes('duplicate')) {
      const { data: existing } = await supabase
        .from('favorites')
        .select('id, item_id, item_type, created_at')
        .eq('firebase_uid', user.sub)
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .single();
      return res.status(200).json({ favorite: existing, alreadyExists: true });
    }
    return safeError(res, 500, 'favorites-post', error);
  }

  return res.status(201).json({ favorite: data });
}

// ── DELETE /api/favorites ────────────────────────────────────
//    Body: { itemId: string, itemType?: string }
//    Removes a specific favorite.
async function handleDelete(req, res, user, supabase) {
  const { itemId, itemType } = req.body || {};

  if (!validateStr(itemId, 100)) {
    return res
      .status(400)
      .json({ error: 'itemId is required (string, max 100 chars)' });
  }

  let query = supabase
    .from('favorites')
    .delete()
    .eq('firebase_uid', user.sub)
    .eq('item_id', itemId);

  if (itemType) {
    if (!isValidItemType(itemType)) {
      return res.status(400).json({
        error: `Invalid itemType. Must be one of: ${[...VALID_ITEM_TYPES].join(', ')}`,
      });
    }
    query = query.eq('item_type', itemType);
  }

  const { error, count } = await query.select('id');

  if (error) {
    return safeError(res, 500, 'favorites-delete', error);
  }

  return res.status(200).json({
    ok: true,
    deleted: count || 0,
  });
}
