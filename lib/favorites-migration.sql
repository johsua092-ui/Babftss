-- ============================================================================
-- BABFT Learning — Favorites Table Migration
-- Tabel untuk menyimpan love/favorites user
-- Generated: 2026-08-04
-- Cara pakai: Copy-paste ke Supabase SQL Editor → Run
-- ============================================================================

-- ── Create table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'gate'
    CHECK (item_type IN ('gate', 'circuit', 'gear', 'linkage')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Satu user gabisa favorit item yang sama 2x
  CONSTRAINT uq_user_favorite UNIQUE (firebase_uid, item_id, item_type)
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_favorites_uid       ON favorites (firebase_uid);
CREATE INDEX IF NOT EXISTS idx_favorites_uid_type  ON favorites (firebase_uid, item_type);
CREATE INDEX IF NOT EXISTS idx_favorites_item      ON favorites (item_id, item_type);

-- ── Comments ─────────────────────────────────────────────────
COMMENT ON TABLE favorites IS 'User favorites/likes untuk gate, circuit, gear, dan linkage';
COMMENT ON COLUMN favorites.firebase_uid IS 'Firebase Auth UID — foreign key ke users.firebase_uid';
COMMENT ON COLUMN favorites.item_id IS 'ID item yang difavoritkan (misal: gate id "01", circuit slug "not-and")';
COMMENT ON COLUMN favorites.item_type IS 'Tipe item: gate | circuit | gear | linkage';
