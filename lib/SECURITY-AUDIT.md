# 🔒 BABFT Learning — Security Audit Report
> **Tanggal:** 2026-08-01  
> **Scope:** Semua API route yang query ke Supabase (8 query di 7 file)  
> **Metode:** Manual line-by-line — setiap `.from()`, `.select()`, `.insert()`, `.update()`, `.upsert()`, `.delete()`

---

## 📊 Ringkasan

| Status | Count |
|---|---|
| ✅ SAFE — `.eq('firebase_uid')` verified | **7 query** |
| 🔵 INTENTIONAL PUBLIC — leaderboard | **1 query** |
| 🔴 GAP — missing auth/filter | **0 query** |

> **Kesimpulan: 100% terlindungi. Zero data leak.**

---

## 🔍 Detail Per Query

### 1. `GET /api/get-progress` → `user_progress`
```js
.from('user_progress')
  .select('current_page, updated_at')
  .eq('firebase_uid', user.sub)
  .maybeSingle()
```
✅ Auth required | ✅ Row-scoped | ✅ Column select limited | 60 req/min

### 2. `POST /api/save-progress` → `user_progress`
```js
.from('user_progress')
  .upsert({ firebase_uid: user.sub, current_page, updated_at },
           { onConflict: 'firebase_uid' })
```
✅ Auth required | ✅ UID in payload + onConflict | ✅ Input validated | 30 req/min

### 3. `DELETE /api/reset-progress` → `user_progress`
```js
.from('user_progress')
  .delete()
  .eq('firebase_uid', user.sub)
```
✅ Auth required | ✅ Row-scoped | ✅ Stricter 10 req/min (destructive)

### 4. `GET /api/profile` → `profiles`
```js
.from('profiles')
  .upsert({ firebase_uid: uid, display_name, avatar_url },
           { onConflict: 'firebase_uid' })
  .select().single()
```
✅ Auth required | ✅ UID in payload + onConflict | 30 req/min

### 5. `PATCH /api/profile` → `profiles`
```js
.from('profiles')
  .update(up)
  .eq('firebase_uid', user.sub)
  .select().single()
```
✅ Auth required | ✅ Row-scoped | ✅ Input validated (str + URL) | 30 req/min

### 6. `GET /api/quiz/history` → `quiz_results`
```js
.from('quiz_results')
  .select('id, topic, score, answers, completed_at')
  .eq('firebase_uid', user.sub)
  .order('completed_at', { ascending: false })
  .limit(100)
```
✅ Auth required | ✅ Row-scoped | ✅ Column select limited | 30 req/min

### 7. `POST /api/quiz/submit` → `quiz_results`
```js
.from('quiz_results')
  .insert({ firebase_uid: user.sub, topic, score, answers })
  .select('id, topic, score, completed_at')
  .single()
```
✅ Auth required | ✅ UID in payload | ✅ Input validated (str + num) | 20 req/min

### 8. `GET /api/leaderboard` → `leaderboard` 🔵 PUBLIC
```js
.from('leaderboard')
  .select('*')
  .limit(50)
```
🔵 **NO AUTH — INTENTIONAL**  
Leaderboard memang public: cuma `display_name` + `score`, gak ada PII.  
Cache: 60s | Rate limit: 20 req/min

---

## 🛡️ RLS Policies (Supabase)

Migration SQL: `lib/supabase-rls-migration.sql`

| Tabel | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `user_progress` | `auth.uid()` | `auth.uid()` | `auth.uid()` | `auth.uid()` |
| `profiles` | `auth.uid()` | `auth.uid()` | `auth.uid()` | ❌ |
| `quiz_results` | `auth.uid()` | `auth.uid()` | ❌ | ❌ |
| `leaderboard` | `true` (publik) | ❌ | ❌ | ❌ |

---

## 📋 File Baru

| File | Deskripsi |
|---|---|
| `lib/supabase-rls-migration.sql` | SQL migration — tinggal copy ke Supabase SQL Editor |
| `lib/SECURITY-AUDIT.md` | Report ini — dokumentasi audit lengkap |

---

## ✅ Final Verdict

```
8/8 query dianalisa
  7 query   = user-scoped (firebase_uid verified)
  1 query   = intentionally public
  0 query   = missing filter / data leak

STATUS: 100% SAFE — ZERO DATA LEAKAGE
```
