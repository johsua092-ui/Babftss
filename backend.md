# Backend.md — BABFT Learning (DRAFT AWAL, WAJIB DILENGKAPI BACKEND DEVELOPER)

> ⚠️ **Dokumen ini dibuat oleh Claude (AI frontend)** berdasarkan pengamatan DARI LUAR selama verifikasi kerja frontend — BUKAN dari akses langsung ke kode backend. Banyak detail di sini kemungkinan **tidak lengkap atau perlu dikoreksi**. Backend developer proyek ini WAJIB me-review & melengkapi bagian yang ditandai `[LENGKAPI]`.

## 1. Ringkasan

Backend BABFT Learning pakai **Firebase Auth** (login) + **Supabase Postgres** (database) + **Vercel Serverless Functions** (folder `api/`) sebagai arsitektur utama. Ada juga **server Express terpisah** (folder `server/`, di-deploy via Docker ke Pterodactyl panel) untuk kebutuhan di luar model serverless Vercel — `[LENGKAPI: server terpisah ini fungsinya spesifik buat apa?]`.

## 2. Autentikasi

- Provider: **Firebase Auth**.
- File terkait (frontend-side, jangan diubah dari sisi frontend): `src/contexts/AuthContext.jsx`, `src/firebase/config.js`.
- `[LENGKAPI: metode login apa saja yang didukung — email/password, Google, dll? Ada role/permission level (admin vs user biasa)?]`

## 3. Database (Supabase Postgres)

Tabel yang teramati dari nama file migrasi/kode (`[LENGKAPI skema kolom lengkap tiap tabel]`):
- `favorites` — fitur "simpan card favorit" (terkait `firebase_uid`, `item_id`, `item_type`).
- Tabel progress belajar user (terkait `api/save-progress.js`, `get-progress.js`, `reset-progress.js`) — `[LENGKAPI nama tabel & skema]`.
- Tabel quiz (terkait `api/quiz/history.js`, `quiz/submit.js`) — `[LENGKAPI nama tabel & skema]`.
- Tabel leaderboard (terkait `api/leaderboard.js`) — `[LENGKAPI nama tabel & skema]`.
- File migrasi teramati: `lib/favorites-migration.sql`, `lib/supabase-rls-migration.sql` — `[LENGKAPI: RLS policy apa saja yang aktif?]`.

## 4. API Endpoints (Vercel Serverless, folder `api/`)

| File | Perkiraan Fungsi | Auth Required? |
| --- | --- | --- |
| `api/ai-chat.js` | AI Helper chat widget | `[LENGKAPI]` |
| `api/favorites.js`, `api/my-favorites.js` | Fitur Favorites | `[LENGKAPI]` |
| `api/migrate.js` | Migrasi database (one-time) | ⚠️ **Ditemukan TANPA auth check saat verifikasi frontend (Agustus 2026)** — pakai Supabase Service Role Key tapi tidak ada validasi password/token di kode. Belum berbahaya (isinya `CREATE TABLE IF NOT EXISTS`), tapi **WAJIB ditambah auth check atau dihapus** kalau migrasi sudah selesai dipakai. |
| `api/save-progress.js`, `get-progress.js`, `reset-progress.js` | Progress belajar user | `[LENGKAPI]` |
| `api/leaderboard.js` | Papan peringkat | `[LENGKAPI]` |
| `api/profile.js` | Profil user | `[LENGKAPI]` |
| `api/quiz/history.js`, `api/quiz/submit.js` | Fitur Quiz | `[LENGKAPI]` |

## 5. Helper/Lib (`lib/`)

- `api-helpers.js` — `[LENGKAPI: isinya apa, dipakai di mana]`
- `ai-client.js` — `[LENGKAPI]`
- `favorites-catalog.js` — `[LENGKAPI]`

## 6. Infrastruktur Tambahan (di luar Vercel)

- `Dockerfile`, `docker-compose.yml`, `bootstrap.sh`, `start.sh`, `start.cjs`, folder `server/` — setup server Express terpisah, deploy ke **Pterodactyl panel**.
- Dependency terkait: `express`, `dotenv`, `localtunnel` (dari `package.json`).
- `[LENGKAPI: kenapa butuh server terpisah dari Vercel? Proses apa yang jalan di situ — long-running job, bot, webhook listener, dll?]`

## 7. Environment Variables

- `.env.example` ada di root sebagai referensi (isi aslinya WAJIB tidak pernah di-commit).
- `[LENGKAPI: daftar env var yang dipakai beserta fungsinya singkat — SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dst, TANPA menuliskan nilai aslinya di sini]`

## 8. Zona File Bersama (frontend BOLEH sentuh, tapi wajib koordinasi dulu)

- `vite.config.js`, `vercel.json` — kedua tim bisa sentuh, WAJIB saling kabar dulu sebelum ubah (aturan dari `instruction.md`).

## 9. Catatan Keamanan

- JANGAN taruh Supabase service role key atau Firebase Admin SDK credentials di kode frontend/client-side.
- Kalau ada credential yang pernah ter-expose (bahkan sudah "dihapus" dari commit terbaru), anggap bocor — WAJIB revoke & generate ulang (history git lama tetap bisa diakses).
- Lihat temuan `api/migrate.js` di Bagian 4 — prioritas P1 untuk ditindaklanjuti.

---

**Catatan buat backend developer:** tolong isi semua bagian `[LENGKAPI]` di atas dengan detail asli dari sisi kamu. Dokumen ini titik awal, bukan final — begitu dilengkapi, ini bakal jadi referensi resmi yang sama pentingnya kayak `instruction.md`/`design.md`/`memory.md` di sisi frontend.
