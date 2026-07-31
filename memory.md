# MEMORY.md — LOG & STATUS PROYEK BABFT LEARNING

> File ini berisi HISTORI & STATUS TERKINI proyek. Untuk aturan tetap (tech stack, konvensi, larangan), baca **`instruction.md`**. Untuk spesifikasi tampilan/desain, baca **`design.md`**. File ini WAJIB di-update tiap ada aktivitas baru yang berarti — JANGAN buat file memory baru dari nol, selalu lanjutkan yang sudah ada.

---

## 1. RINGKASAN PROYEK

BABFT Learning — platform edukasi web tema "Build A Boat For Treasure" yang mengajarkan Logic Gates (+ materi Gears & Linkages). Detail tech stack & aturan kerja ada di `instruction.md`. Detail desain ada di `design.md`.

---

## 2. STRUKTUR HALAMAN YANG SUDAH ADA

1. **Welcome** — judul "WELCOME", banner bertema Build A Boat, tombol hijau "START LEARNING".
2. **Menu utama "LOGIC GATES"**, berisi 3 menu:
   - **"7 Basic Logic Gates"** — SELESAI & berfungsi benar.
   - **"Logic Gates Circuit"** — SEDANG DIKERJAKAN (lihat Bagian 3).
   - **"Create Logic Gates Simulator"** — BELUM DIKERJAKAN, paling terakhir.
3. Menu **Gears** (36 jenis) dan **Linkages Mechanic** (45 jenis) — sudah ada di aplikasi, belum banyak dibahas detail, perlu diklarifikasi ke user kalau ada pengerjaan lanjutan.

---

## 3. PROGRESS "LOGIC GATES CIRCUIT"

**Card pertama (tier MUDAH) — "NOT -> AND":**
- Struktur: input A & B. B -> NOT Gate -> hasil NOT(B) jadi input AND bareng A. `OUT = A AND (NOT B)`.
- Truth table: 2 input -> 4 baris.
- **Status: SELESAI & TERVERIFIKASI.** Sempat ada 3 minor issue (wire diagonal, teks "AND"/"NOT" di dalam shape) — sudah diperbaiki di `src/components/CircuitDiagram01.jsx`, diverifikasi lewat: (a) diff kode cuma 2 file berubah (`memory.md` + file target, tidak nyerempet file lain), (b) review kode manual (path SVG siku-siku benar, teks terhapus, label "B′" tetap ada), (c) build log asli (`✓ 1969 modules transformed`, `✓ built in 2.92s`) — kredibel dan terverifikasi nyata, bukan klaim kosong.
- Next: lanjut card ke-2 (tier NORMAL) — belum direncanakan konsepnya, perlu didiskusikan dulu.

---

## 4. STATUS BACKEND (Firebase Auth + Supabase) — DIKERJAKAN TEMAN, BUKAN SCOPE USER

Update terbaru hasil investigasi kode langsung (bukan cuma laporan tertulis):
- Login (`LoginModal.jsx`), `AuthContext.jsx`, `firebase/config.js` — SUDAH aktif dipakai di `App.jsx`.
- Auto-save progress (`useProgressSync.js`) — SUDAH terpasang, terhubung ke `/api/save-progress`, `/api/get-progress`, `/api/reset-progress`.
- Backend API (`api/`, `lib/api-helpers.js`) — kualitas kode bagus (CORS, rate limiting, validasi input, security headers).
- Supabase terhubung server-side lewat `getSupabaseAdmin()`, pakai `SUPABASE_SERVICE_ROLE_KEY` dari env var (tidak ke-expose ke browser).
- **Sudah diklarifikasi dengan teman:** ada beberapa file orphan/duplikat sisa percobaan (`src/context/AuthContext.jsx`, `src/lib/firebase.js`, `src/lib/supabase.js`, `LoginPage.jsx`, `UserPill.jsx`) — dibiarkan, akan dibersihkan backend developer sendiri, BUKAN tugas AI frontend.
- **Sudah diklarifikasi:** API Quiz (`api/quiz/*`) dan Leaderboard (`api/leaderboard.js`) itu **persiapan/jaga-jaga**, bukan fitur wajib dikerjakan sekarang. Lihat `instruction.md` Bagian 6.
- Metode verifikasi token Firebase pakai `google-auth-library` (bukan `firebase-admin`) — belum tentu salah, tapi tidak umum, masih perlu dikonfirmasi validitasnya oleh teman kalau sempat.

---

## 5. RENCANA SETELAH CIRCUIT SELESAI

"Create Logic Gates Simulator" — dikerjakan PALING TERAKHIR. Kemungkinan fitur builder/simulator bebas (drag-drop gate, dst). Butuh fondasi Basic Gates + Circuit sudah solid dulu.

---

## 6. HISTORI: REKONSTRUKSI SOURCE CODE (SELESAI)

**Masalah awal:** repo GitHub sempat tidak punya source code asli, hanya bundle production ter-minify — AI terpaksa edit langsung bundle minified untuk fitur Circuit Card 01, berisiko tinggi untuk maintenance jangka panjang.

**Hasil:** source code proper berhasil disusun ulang (React 19 + Vite, struktur `src/` lengkap), diverifikasi 81 functional checks (76 pass, 5 fail karena alasan minor/wajar), build baru mendekati production asli (gap kecil, sudah dijelaskan & masuk akal). File production lama di-backup, root repo dibersihkan dari ~44 file kerja/analisis sementara (dipindah ke `scripts/analysis/`). Verifikasi keamanan: tidak ada credential ter-hardcode, `.env` aman ke-gitignore, `.env.example` sudah ada.

**Kesimpulan:** source code sekarang adalah fondasi resmi proyek — TIDAK BOLEH edit bundle `assets/*.js` manual lagi, semua kerjaan lewat `src/` + `npm run build`.

---

## 7. RINGKASAN STATUS SAAT INI

- SELESAI: halaman "7 Basic Logic Gates".
- SELESAI: rekonstruksi source code + cleanup + verifikasi keamanan (Bagian 6).
- SELESAI & TERVERIFIKASI: "Logic Gates Circuit" Card 01 — termasuk 3 minor issue yang sempat ada, sudah diperbaiki (Bagian 3).
- BANYAK PROGRESS DARI TEMAN (BACKEND): Login + auto-save + API routes sudah jalan (Bagian 4). Beberapa hal sudah diklarifikasi (file orphan, quiz/leaderboard opsional).
- BELUM DIKERJAKAN: card Circuit berikutnya (tier NORMAL) — perlu didiskusikan konsepnya. "Create Logic Gates Simulator" (Bagian 5) — masih jauh.
- Dokumentasi proyek sekarang terbagi 3 file permanen: `instruction.md` (aturan), `design.md` (desain), `memory.md` (log/status, file ini) — lihat `instruction.md` Bagian 1 untuk detail sistem ini.
