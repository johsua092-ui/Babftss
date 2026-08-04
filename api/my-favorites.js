// api/my-favorites.js — "My Favorites" page API
// Returns enriched favorites dengan metadata item (nama, tier, warna, deskripsi)
// Auth: Firebase token (Bearer) REQUIRED
import {
  applyCors,
  applySecurityHeaders,
  checkRateLimit,
  authenticateRequest,
  safeError,
  getSupabaseAdmin,
} from '../lib/api-helpers.js';
import { enrichFavorites } from '../lib/favorites-catalog.js';

export default async function handler(req, res) {
  applyCors(req, res, 'GET, OPTIONS');
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // ── Rate limit ───────────────────────────────────────
    const ip =
      req.headers['x-forwarded-for'] ||
      req.socket?.remoteAddress ||
      'unknown';
    if (!checkRateLimit('my-favorites:' + ip, 30, 60000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    // ── Auth ─────────────────────────────────────────────
    const user = await authenticateRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Login dulu buat liat favorit kamu.' });
    }

    const supabase = await getSupabaseAdmin();
    const { type } = req.query || {};

    // ── Fetch favorites ──────────────────────────────────
    let query = supabase
      .from('favorites')
      .select('id, item_id, item_type, created_at')
      .eq('firebase_uid', user.sub)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('item_type', type);
    }

    const { data: favorites, error } = await query;

    if (error) {
      return safeError(res, 500, 'my-favorites', error);
    }

    // ── Enrich dengan metadata ───────────────────────────
    const enriched = enrichFavorites(favorites || []);

    // ── Group by type buat frontend ──────────────────────
    const grouped = {};
    for (const fav of enriched) {
      const t = fav.item_type;
      if (!grouped[t]) grouped[t] = [];
      grouped[t].push(fav);
    }

    return res.status(200).json({
      favorites: enriched,
      total: enriched.length,
      grouped,
      // Stats: count per type
      counts: {
        gate: (grouped.gate || []).length,
        circuit: (grouped.circuit || []).length,
        gear: (grouped.gear || []).length,
        linkage: (grouped.linkage || []).length,
      },
    });
  } catch (e) {
    return safeError(res, 500, 'my-favorites', e);
  }
}
