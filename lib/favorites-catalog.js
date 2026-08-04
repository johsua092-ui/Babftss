// lib/favorites-catalog.js — Item metadata lookup dari database (Supabase)
// Zero hardcoded data — semua item disimpan di tabel `items`
// Caching: data di-fetch sekali lalu di-cache di memory

let _cache = null;
let _cachePromise = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit
const VALID_TYPES = new Set(['gate', 'circuit', 'gear', 'linkage']);

/**
 * Fetch semua item dari Supabase. Di-cache di memory.
 */
async function loadCatalog(supabaseAdmin) {
  if (_cache) return _cache;

  // Deduplicate concurrent calls
  if (_cachePromise) return _cachePromise;

  _cachePromise = (async () => {
    const { data, error } = await supabaseAdmin
      .from('items')
      .select('item_id, item_type, name, tier, color, description')
      .order('item_type', { ascending: true })
      .order('item_id', { ascending: true });

    if (error) {
      _cachePromise = null;
      throw error;
    }

    // Build lookup map: { "circuit-01": { name, tier, ... }, ... }
    const map = {};
    const byType = {};
    for (const item of data || []) {
      const key = `${item.item_type}:${item.item_id}`;
      map[key] = {
        id: item.item_id,
        type: item.item_type,
        name: item.name,
        tier: item.tier || '',
        color: item.color || '#475569',
        desc: item.description || '',
      };
      if (!byType[item.item_type]) byType[item.item_type] = [];
      byType[item.item_type].push(map[key]);
    }

    _cache = { map, byType, fetchedAt: Date.now() };

    // Auto-refresh setelah TTL
    setTimeout(() => { _cache = null; }, CACHE_TTL_MS);

    _cachePromise = null;
    return _cache;
  })();

  return _cachePromise;
}

/**
 * Lookup satu item berdasarkan type + id.
 * @param {object} supabaseAdmin - Supabase client (service_role)
 * @param {string} type - gate | circuit | gear | linkage
 * @param {string} itemId
 * @returns {Promise<object|null>}
 */
export async function lookupItem(supabaseAdmin, type, itemId) {
  if (!VALID_TYPES.has(type)) return null;
  const catalog = await loadCatalog(supabaseAdmin);
  return catalog.map[`${type}:${itemId}`] || null;
}

/**
 * Enrich array favorit mentah (dari DB) dengan metadata item.
 * @param {object} supabaseAdmin
 * @param {Array} favorites - [{ item_id, item_type, ... }]
 * @returns {Promise<Array>}
 */
export async function enrichFavorites(supabaseAdmin, favorites) {
  const catalog = await loadCatalog(supabaseAdmin);
  return favorites.map(fav => {
    const key = `${fav.item_type}:${fav.item_id}`;
    const item = catalog.map[key];
    return {
      ...fav,
      item: item || { id: fav.item_id, type: fav.item_type, name: fav.item_id, color: '#475569' },
    };
  });
}

/**
 * Valid item types.
 */
export { VALID_TYPES };
