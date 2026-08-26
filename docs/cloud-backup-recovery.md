# Panduan Pemulihan Database BABFTSS

> **Tanggal dibuat**: 2026-08-26
> **Status**: Investigasi selesai. Skrip rekonstruksi schema siap. Data user masih perlu di-restore dari backup cloud.

---

## Ringkasan situasi

Project BABFTSS menggunakan **3 database cloud terpisah**. Tidak ada backup lokal di workspace. File `.env` lama yang menyebut `DATABASE_URL=file:...custom.db` itu **TIDAK DIPAKAI** kode — menyesatkan. Yang sebenarnya dipakai:

| Database | Isi | Env Vars |
|---|---|---|
| **Turso** (libSQL) | 11 tabel: users, gold_log, ai_access, inbox, announcements, audit_log, marketplace_products, cart_items, orders, order_items, seller_revenue | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` |
| **Supabase** (PostgreSQL) | 7 tabel: user_progress, profiles, quiz_results, leaderboard, favorites, circuits, circuits_history | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Firebase Firestore** (project "punya-si-jawa") | 4 koleksi: canvas_prompts, canvas_prompts_history, canvas_strokes, dataset_images, ai_chat_log | `FIREBASE_ADMIN_*` |

---

## Urutan pemulihan yang BENAR

> ⚠️ **PENTING**: Jangan jalankan `schema-*-reconstruct.sql` SEBELUM selesai cek backup cloud. Skrip rekonstruksi hanya untuk **STRUKTUR KOSONG** — kalau dijalankan setelah restore backup, tidak akan menghapus data (karena pakai `CREATE TABLE IF NOT EXISTS`). Tapi kalau dijalankan **sebelum** restore, restore backup akan ditolak karena tabel sudah ada (bisa di-bypass dengan `DROP TABLE` dulu, tapi ribet).

### Urutan:

1. **Cek backup cloud** dulu (lihat bagian A, B, C di bawah)
2. **Restore dari backup** kalau ada (prioritas: Turso > Supabase > Firestore)
3. **Jalankan schema rekonstruksi** HANYA untuk tabel yang masih kosong / tidak ada setelah restore
4. **Verifikasi** data user sudah kembali (lihat bagian D)

---

## A. Cek backup Turso (libSQL)

Turso otomatis membuat backup harian. Bergantung plan:

- **Free plan**: backup harian, retention **7 hari**
- **Developer plan ($29/bln)**: backup harian, retention **30 hari**
- **Enterprise**: retention lebih lama + PITR (point-in-time recovery)

### Cara cek via dashboard:

1. Buka https://app.turso.tech → login dengan akun yang dipakai untuk project BABFTSS
2. Klik database yang dipakai (cek dari `.env` kalau Anda simpan — env var `TURSO_DATABASE_URL` berisi URL seperti `libsql://babft-xxx.turso.io`)
3. Klik tab **Backups** di sidebar
4. Akan muncul list backup dengan timestamp. Kalau ada backup < 7 hari terakhir, **bisa di-restore**

### Cara restore backup Turso:

- Via dashboard: klik tombol **Restore** di samping backup yang dipilih
- Via CLI:
  ```bash
  # Install turso CLI kalau belum
  curl -sSfL https://get.tur.so/install.sh | bash

  # Login
  turso auth login

  # List databases
  turso db list

  # List backups
  turso db backups <database-name>

  # Restore backup ke database baru (AMAN — tidak timpa database asli)
  turso db create <database-name>-restored --from-db <database-name> --timestamp <backup-timestamp>

  # Kalau sudah oke, swap URL di env var production ke database yang baru
  ```

### Kalau backup Turso ada → restore dulu, LALU jalankan `schema-turso-reconstruct.sql` hanya kalau ada tabel yang masih kosong.

### Kalau TIDAK ada backup Turso → data gold/marketplace/inbox/announcements/audit_log **TIDAK BISA dipulihkan**. Langsung jalankan `schema-turso-reconstruct.sql` untuk membuat struktur tabel kosong (sistem bisa jalan lagi dari nol, user mulai dengan saldo 0).

---

## B. Cek backup Supabase (PostgreSQL)

Supabase otomatis membuat backup bergantung plan:

- **Free plan**: backup harian, retention **7 hari**. Tidak ada PITR.
- **Pro plan ($25/bln)**: backup harian + PITR (point-in-time recovery) hingga **7 hari ke belakang**
- **Team plan ($599/bln)**: backup 7 hari PITR + 14 hari snapshot

### Cara cek via dashboard:

1. Buka https://supabase.com/dashboard → login
2. Pilih project BABFTSS (cek dari URL supabase.co di env `SUPABASE_URL`)
3. Di sidebar kiri, klik **Database** → **Backups**
4. Akan muncul tab:
   - **Scheduled backups**: list backup harian otomatis (kalau plan free → 7 hari terakhir)
   - **PITR**: hanya muncul kalau plan Pro/Team/Enterprise

### Cara restore backup Supabase:

- **Free plan**: Klik titik tiga `⋮` di samping backup → **Restore** → tunggu 5-15 menit. Project akan restart sebentar.
- **Pro plan (PITR)**: Pilih timestamp spesifik (presisi menit) → **Restore to timestamp**

### Kalau backup Supabase ada → restore dulu, LALU jalankan `schema-supabase-reconstruct.sql` (idempotent — `CREATE TABLE IF NOT EXISTS` tidak akan ganggu data yang sudah ada).

### Kalau TIDAK ada backup Supabase → data user_progress, profiles, quiz_results, leaderboard, favorites, circuits **TIDAK BISA dipulihkan**. Jalankan `schema-supabase-reconstruct.sql` untuk membuat struktur tabel kosong.

---

## C. Cek backup Firebase Firestore (project "punya-si-jawa")

Firestore TIDAK punya backup otomatis bawaan. Harus di-enable manual via **Scheduled Backups** atau Cloud Functions. Kalau belum pernah di-enable → data tidak bisa di-restore.

### Cara cek backup Firestore:

1. Buka https://console.firebase.google.com → login
2. Pilih project **punya-si-jawa** (bukan `backend-fb691` — itu project Auth)
3. Klik **Firestore Database** di sidebar kiri
4. Klik tab **Backups** (atau **Import/Export**)
5. Kalau ada entry di **Export metadata** → backup tersedia, bisa di-restore
6. Kalau tabnya kosong → backup belum pernah di-enable

### Cara export manual (untuk kedepan):

```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Login + pilih project
gcloud auth login
gcloud config set project punya-si-jawa

# Export semua koleksi ke Cloud Storage bucket
gcloud firestore export gs://YOUR-BUCKET-NAME/firestore-backup-$(date +%Y%m%d)
```

### Kalau backup Firestore ada → import via console (klik "Import" di tab Backups → pilih file export).

### Kalau TIDAK ada backup Firestore → data canvas_prompts, canvas_prompts_history, canvas_strokes, dataset_images, ai_chat_log **TIDAK BISA dipulihkan**. Koleksi akan otomatis dibuat ulang saat user pertama kali menyimpan data baru (Firestore schemaless).

---

## D. Verifikasi setelah pemulihan

Setelah restore selesai (atau setelah menjalankan schema rekonstruksi), jalankan query berikut untuk verifikasi:

### Turso (jalankan di Turso dashboard → "Edit data" atau via CLI):

```sql
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
-- Expected 11 tabel + sqlite_sequence:
-- ai_access, announcements, audit_log, cart_items, gold_log, inbox,
-- marketplace_products, order_items, orders, seller_revenue, users

SELECT COUNT(*) AS users_count FROM users;
SELECT COUNT(*) AS products_count FROM marketplace_products;
SELECT COUNT(*) AS audit_log_count FROM audit_log;
```

### Supabase (jalankan di SQL Editor):

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- Expected 7 tabel:
-- circuits, circuits_history, favorites, leaderboard, profiles,
-- quiz_results, user_progress

SELECT COUNT(*) FROM user_progress;
SELECT COUNT(*) FROM quiz_results;
SELECT COUNT(*) FROM circuits;
SELECT COUNT(*) FROM favorites;
```

### Firestore (jalankan via Firebase Console → Firestore → Data):

Browse setiap koleksi secara manual:
- `canvas_prompts` — harusnya ada dokumen per slot per user
- `canvas_prompts_history` — 10 entry terakhir per slot per user
- `canvas_strokes` — satu dokumen per user
- `dataset_images` — list gambar yang user upload
- `ai_chat_log` — log percakapan AI Helper (kalau ada)

---

## E. Setelah pemulihan selesai — konfigurasi env vars

Pastikan file `.env` di production (VPS / Pterodactyl / Vercel) berisi:

```env
# Turso
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Firebase Admin (project punya-si-jawa — untuk Firestore data)
FIREBASE_ADMIN_PROJECT_ID=punya-si-jawa
FIREBASE_ADMIN_CLIENT_EMAIL=xxx@punya-si-jawa.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Auth (project backend-fb691 — untuk verify token)
FIREBASE_PROJECT_ID_SERVER=backend-fb691
FIREBASE_CLIENT_EMAIL=xxx@backend-fb691.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Admin
ADMIN_UIDS=uid1,uid2,uid3
ADMIN_EMAILS=admin1@example.com,admin2@example.com

# CORS
ALLOWED_CORS_ORIGINS=https://babftss.vercel.app,https://your-domain.com
```

---

## F. Saran jangka panjang — backup otomatis

Agar tidak terulang, setelah ini aktifkan:

### 1. Supabase — upgrade ke Pro plan ($25/bln) untuk dapat PITR 7 hari
   - Atau buat Cloud Function scheduled yang export database harian ke Cloud Storage

### 2. Turso — pakai plan Developer ($29/bln) untuk retention 30 hari
   - Atau buat script cron job yang dump database harian via `turso db shell <db> .dump > backup.sql`

### 3. Firestore — enable Scheduled Backups (free, but need Cloud Storage bucket)
   - Lihat: https://firebase.google.com/docs/firestore/backups

### 4. Tambahkan script bash di VPS yang:
   - Dump Turso harian → simpan ke `/backups/turso-YYYYMMDD.sql`
   - Sync ke S3 / Cloud Storage tiap minggu
   - Hapus backup > 30 hari otomatis

---

## Ringkasan file yang dihasilkan

| File | Fungsi |
|---|---|
| `schema-turso-reconstruct.sql` | 11 tabel Turso (CREATE TABLE IF NOT EXISTS + index) — aman dijalankan di DB yang sudah ada data |
| `schema-supabase-reconstruct.sql` | 7 tabel Supabase + RLS policies — aman dijalankan di DB yang sudah ada data |
| `README-cloud-backup-recovery.md` | File ini — panduan langkah-demi-langkah |
