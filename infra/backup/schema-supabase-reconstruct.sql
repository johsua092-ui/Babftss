-- ============================================================================
-- BABFT Learning — Supabase (PostgreSQL) Schema Reconstruction
-- ============================================================================
-- Generated: 2026-08-26
-- Source   : Reverse-engineered dari api/favorites.js, api/leaderboard.js,
--            api/get-progress.js, api/save-progress.js, api/profile.js,
--            api/circuits.js, api/quiz/submit.js, api/quiz/history.js
--            + lib/favorites-migration.sql + lib/supabase-rls-migration.sql
--
-- CARA PAKAI:
--   1. Login ke https://supabase.com/dashboard
--   2. Pilih project Anda → SQL Editor → New query
--   3. Copy-paste seluruh isi file ini → Run
--
-- SKRIP INI AMAN UNTUK DATABASE YANG SUDAH ADA DATA:
--   - CREATE TABLE IF NOT EXISTS (tidak akan drop tabel yang sudah ada)
--   - DROP POLICY IF EXISTS sebelum CREATE POLICY (idempotent)
--   - Tidak ada DROP TABLE / TRUNCATE / DELETE
--
-- WARNING: Skrip ini HANYA membuat struktur tabel kosong + RLS. Data user
-- (progress belajar, quiz scores, leaderboard, dst) TIDAK bisa direkonstruksi
-- dari kode — harus dari backup Supabase. Lihat README-cloud-backup-recovery.md.
-- ============================================================================

-- ============================================================================
-- 1. user_progress — bookmark halaman terakhir user
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_progress (
  firebase_uid  TEXT PRIMARY KEY,                 -- Firebase Auth UID
  current_page  TEXT,                              -- halaman terakhir (max 50 char)
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own progress" ON user_progress;
CREATE POLICY "Users can read own progress" ON user_progress
  FOR SELECT USING (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid()::text = firebase_uid)
  WITH CHECK (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Users can delete own progress" ON user_progress;
CREATE POLICY "Users can delete own progress" ON user_progress
  FOR DELETE USING (auth.uid()::text = firebase_uid);

-- ============================================================================
-- 2. profiles — display name + avatar
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  firebase_uid  TEXT PRIMARY KEY,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = firebase_uid)
  WITH CHECK (auth.uid()::text = firebase_uid);

-- ============================================================================
-- 3. quiz_results — skor quiz per topik
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_results (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid  TEXT NOT NULL,
  topic         TEXT NOT NULL,
  score         INTEGER NOT NULL,
  answers       JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (firebase_uid, topic)                    -- upsert by (firebase_uid, topic)
);

CREATE INDEX IF NOT EXISTS idx_quiz_uid           ON quiz_results (firebase_uid);
CREATE INDEX IF NOT EXISTS idx_quiz_completed_at   ON quiz_results (completed_at DESC);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own quiz results" ON quiz_results;
CREATE POLICY "Users can read own quiz results" ON quiz_results
  FOR SELECT USING (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Users can insert own quiz results" ON quiz_results;
CREATE POLICY "Users can insert own quiz results" ON quiz_results
  FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Users can update own quiz results" ON quiz_results;
CREATE POLICY "Users can update own quiz results" ON quiz_results
  FOR UPDATE USING (auth.uid()::text = firebase_uid)
  WITH CHECK (auth.uid()::text = firebase_uid);

-- ============================================================================
-- 4. leaderboard — top 50 scores (public read)
-- ============================================================================
-- NOTE: Tabel ini TIDAK punya insert/update policy di RLS karena diisi oleh
-- backend (service_role bypass RLS). Struktur kolom TIDAK BISA direkayasa
-- dari kode karena api/leaderboard.js pakai `select('*')`. Estimasi kolom
-- berdasarkan konvensi Supabase — kalau sudah ada backup, restore dari backup
-- lebih akurat daripada skema ini.
CREATE TABLE IF NOT EXISTS leaderboard (
  firebase_uid  TEXT PRIMARY KEY,
  display_name  TEXT,
  total_score   INTEGER NOT NULL DEFAULT 0,
  quiz_count    INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leaderboard is publicly readable" ON leaderboard;
CREATE POLICY "Leaderboard is publicly readable" ON leaderboard
  FOR SELECT USING (true);

-- ============================================================================
-- 5. favorites — love/favorit user per item
-- ============================================================================
CREATE TABLE IF NOT EXISTS favorites (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid  TEXT NOT NULL,
  item_id       TEXT NOT NULL,
  item_type     TEXT NOT NULL DEFAULT 'gate'
    CHECK (item_type IN ('gate', 'circuit', 'gear', 'linkage')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_favorite UNIQUE (firebase_uid, item_id, item_type)
);

CREATE INDEX IF NOT EXISTS idx_favorites_uid       ON favorites (firebase_uid);
CREATE INDEX IF NOT EXISTS idx_favorites_uid_type ON favorites (firebase_uid, item_type);
CREATE INDEX IF NOT EXISTS idx_favorites_item     ON favorites (item_id, item_type);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own favorites" ON favorites;
CREATE POLICY "Users can read own favorites" ON favorites
  FOR SELECT USING (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
CREATE POLICY "Users can insert own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE USING (auth.uid()::text = firebase_uid);

-- ============================================================================
-- 6. circuits — rangkaian yang disimpan user
-- ============================================================================
CREATE TABLE IF NOT EXISTS circuits (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid  TEXT NOT NULL,
  item_id       TEXT NOT NULL,
  name          TEXT,
  data          JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (firebase_uid, item_id)
);

CREATE INDEX IF NOT EXISTS idx_circuits_uid        ON circuits (firebase_uid);
CREATE INDEX IF NOT EXISTS idx_circuits_updated   ON circuits (updated_at DESC);

ALTER TABLE circuits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own circuits" ON circuits;
CREATE POLICY "Users can read own circuits" ON circuits
  FOR SELECT USING (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Users can insert own circuits" ON circuits;
CREATE POLICY "Users can insert own circuits" ON circuits
  FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Users can update own circuits" ON circuits;
CREATE POLICY "Users can update own circuits" ON circuits
  FOR UPDATE USING (auth.uid()::text = firebase_uid)
  WITH CHECK (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Users can delete own circuits" ON circuits;
CREATE POLICY "Users can delete own circuits" ON circuits
  FOR DELETE USING (auth.uid()::text = firebase_uid);

-- ============================================================================
-- 7. circuits_history — 10 last-save history per slot (rollback support)
-- ============================================================================
CREATE TABLE IF NOT EXISTS circuits_history (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid  TEXT NOT NULL,
  item_id       TEXT NOT NULL,
  name          TEXT,
  data          JSONB,
  pushed_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_circuits_history_uid_item  ON circuits_history (firebase_uid, item_id);
CREATE INDEX IF NOT EXISTS idx_circuits_history_pushed     ON circuits_history (pushed_at DESC);

ALTER TABLE circuits_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own circuit history" ON circuits_history;
CREATE POLICY "Users can read own circuit history" ON circuits_history
  FOR SELECT USING (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Users can insert own circuit history" ON circuits_history;
CREATE POLICY "Users can insert own circuit history" ON circuits_history
  FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Users can delete own circuit history" ON circuits_history;
CREATE POLICY "Users can delete own circuit history" ON circuits_history
  FOR DELETE USING (auth.uid()::text = firebase_uid);

-- ============================================================================
-- VERIFIKASI: jalankan query berikut untuk cek semua tabel sudah ada
-- ============================================================================
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- Expected: circuits, circuits_history, favorites, leaderboard, profiles,
--           quiz_results, user_progress
