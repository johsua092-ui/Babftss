-- ============================================================================
-- BABFT Learning — RLS Migration
-- Row Level Security policies untuk semua tabel Supabase
-- Generated: 2026-08-01
-- Cara pakai: Copy-paste ke Supabase SQL Editor → Run
-- ============================================================================
-- NOTE: Backend API pakai service_role (bypasses RLS).
-- Policies ini untuk defense-in-depth & dokumentasi access pattern
-- ============================================================================

-- ============================================================
-- TABLE: user_progress
-- ============================================================
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

-- ============================================================
-- TABLE: profiles
-- ============================================================
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

-- ============================================================
-- TABLE: quiz_results
-- ============================================================
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own quiz results" ON quiz_results;
CREATE POLICY "Users can read own quiz results" ON quiz_results
  FOR SELECT USING (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Users can insert own quiz results" ON quiz_results;
CREATE POLICY "Users can insert own quiz results" ON quiz_results
  FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

-- ============================================================
-- TABLE: leaderboard (INTENTIONALLY PUBLIC)
-- ============================================================
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read leaderboard" ON leaderboard;
CREATE POLICY "Anyone can read leaderboard" ON leaderboard
  FOR SELECT USING (true);

-- Leaderboard: NO user INSERT/UPDATE/DELETE policies
-- = Admin-only modification via service_role

-- ============================================================
-- TABLE: favorites
-- ============================================================
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

-- NO update policy needed — favorites are created/deleted, never updated
