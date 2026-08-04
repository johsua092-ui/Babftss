// api/migrate.js — One-time database migration endpoint
// Dipanggil sekali buat bikin semua tabel yang belum ada.
// Auth: Basic auth atau dipanggil manual oleh developer.
import { applyCors, applySecurityHeaders, safeError } from '../lib/api-helpers.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = 'gnmoiqclmdgsvrcaqhfj';

const FAVORITES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'gate'
    CHECK (item_type IN ('gate', 'circuit', 'gear', 'linkage')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_favorite UNIQUE (firebase_uid, item_id, item_type)
);

CREATE INDEX IF NOT EXISTS idx_favorites_uid       ON favorites (firebase_uid);
CREATE INDEX IF NOT EXISTS idx_favorites_uid_type  ON favorites (firebase_uid, item_type);
CREATE INDEX IF NOT EXISTS idx_favorites_item      ON favorites (item_id, item_type);
`;

export default async function handler(req, res) {
  applyCors(req, res, 'POST, OPTIONS');
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const results = [];

  try {
    // ── Method 1: Try supabase-js to check if table exists ──
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from('favorites')
      .select('id', { count: 'exact', head: true });

    if (!error) {
      return res.status(200).json({
        ok: true,
        message: 'Table already exists',
        tables: { favorites: 'exists' },
      });
    }

    // Table doesn't exist, try to create via Pooler
    const isMissing = error.code === '42P01' || error.message?.includes('does not exist');

    if (!isMissing) {
      return res.status(500).json({
        error: 'Unexpected error checking table',
        details: error.message,
        code: error.code,
      });
    }

    // ── Method 2: Try PostgreSQL direct connection via Pooler ──
    try {
      const { Pool } = await import('pg');
      const pool = new Pool({
        host: `aws-0-ap-southeast-1.pooler.supabase.com`,
        port: 6543,
        user: `postgres.${PROJECT_REF}`,
        password: SERVICE_ROLE_KEY,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });

      await pool.query(FAVORITES_TABLE_SQL);
      await pool.end();

      results.push('favorites: created via pooler');
      return res.status(201).json({
        ok: true,
        message: 'Migration completed',
        results,
      });
    } catch (poolerErr) {
      results.push(`favorites: pooler failed — ${poolerErr.message}`);

      // ── Method 3: Try direct DB connection ──
      try {
        const { Pool } = await import('pg');
        const pool = new Pool({
          host: `db.${PROJECT_REF}.supabase.co`,
          port: 5432,
          user: 'postgres',
          password: SERVICE_ROLE_KEY,
          database: 'postgres',
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
        });

        await pool.query(FAVORITES_TABLE_SQL);
        await pool.end();

        results.push('favorites: created via direct connection');
        return res.status(201).json({
          ok: true,
          message: 'Migration completed',
          results,
        });
      } catch (directErr) {
        results.push(`favorites: direct failed — ${directErr.message}`);

        return res.status(500).json({
          ok: false,
          error: 'Cannot create table automatically',
          message: 'Tabel favorites belum ada dan tidak bisa dibuat otomatis.',
          solution: {
            step: 'Buka Supabase SQL Editor dan jalankan SQL berikut:',
            url: `https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`,
            sql: FAVORITES_TABLE_SQL,
          },
          attempts: results,
        });
      }
    }
  } catch (e) {
    return safeError(res, 500, 'migrate', e);
  }
}
