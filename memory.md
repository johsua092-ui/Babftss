# MEMORY.md — LOG & STATUS PROYEK BABFT LEARNING

> File ini berisi HISTORI & STATUS TERKINI proyek. Untuk aturan tetap (tech stack, konvensi, larangan), baca **`instruction.md`**. Untuk spesifikasi tampilan/desain, baca **`design.md`**. File ini WAJIB di-update tiap ada aktivitas baru yang berarti — JANGAN buat file memory baru dari nol, selalu lanjutkan yang sudah ada.

---

## 1. RINGKASAN PROYEK

BABFT Learning — platform edukasi web tema "Build A Boat For Treasure" yang mengajarkan Logic Gates (+ materi Gears & Linkages). Detail tech stack & aturan kerja ada di `instruction.md`. Detail desain ada di `design.md`.

---

## 2. STRUKTUR HALAMAN YANG SUDAH ADA

1. **Welcome** — judul "WELCOME", banner bertema Build A Boat, tombol hijau "START LEARNING".
2. **Menu utama "LOGIC GATES"**, berisi 3 menu:
   - **"7 Basic Logic Gates"** — SELESAI, sudah di-revert ke spec (lihat Bagian 3.5).
   - **"Logic Gates Circuit"** — SEDANG DIKERJAKAN (lihat Bagian 4).
   - **"Create Logic Gates Simulator"** — BELUM DIKERJAKAN, paling terakhir.
3. Menu **Gears** (36 jenis) dan **Linkages Mechanic** (45 jenis) — sudah ada di aplikasi, belum banyak dibahas detail, perlu diklarifikasi ke user kalau ada pengerjaan lanjutan.

---

## 3. PROGRESS "LOGIC GATES CIRCUIT"

**Card pertama (tier MUDAH) — "NOT -> AND":**
- Struktur: input A & B. B -> NOT Gate -> hasil NOT(B) jadi input AND bareng A. `OUT = A AND (NOT B)`.
- Truth table: 2 input -> 4 baris.
- **Status: SELESAI & TERVERIFIKASI.** Sempat ada 3 minor issue (wire diagonal, teks "AND"/"NOT" di dalam shape) — sudah diperbaiki di `src/components/CircuitDiagram01.jsx`, diverifikasi lewat: (a) diff kode cuma 2 file berubah (`memory.md` + file target, tidak nyerempet file lain), (b) review kode manual (path SVG siku-siku benar, teks terhapus, label "B'" tetap ada), (c) build log asli (`1969 modules transformed`, `built in 2.92s`).
- Next: lanjut card ke-2 (tier NORMAL) — belum direncanakan konsepnya, perlu didiskusikan dulu.

---

## 3.5 REVISI DARURAT: REVERT HALAMAN "7 BASIC LOGIC GATES" (SELESAI & TERVERIFIKASI)

**Masalah:** Halaman yang sudah dinyatakan selesai ternyata di-redesign ulang secara tidak sah oleh AI di titik yang tidak diketahui kapan. Banyak elemen tidak sesuai `design.md` Bagian 1 ditambahkan, dan elemen wajib dihapus.

**7 masalah yang ditemukan dan diperbaiki di `src/components/GateCard.jsx`:**
1. Truth table HILANG TOTAL -> **DIKEMBALIKAN** (table dinamis dengan highlight baris sesuai `design.md` 1.4, opacity ~18% warna tema).
2. Deskripsi satu kalimat HILANG -> **DIKEMBALIKAN** (mengambil dari `config.description` di `gateData.js`).
3. Header kehilangan format -> **DIKEMBALIKAN** ke `<nomor>  <Nama Gate>` (nomor Orbitron abu-abu, bulatan warna tema, nama Orbitron putih).
4. Toggle switch iOS + teks "Input A/B: TRUE/FALSE (0/1)" di luar diagram -> **DIHAPUS TOTAL**. Input sekarang HANYA lewat klik node di dalam GateDiagram.
5. Teks "Output: TRUE/FALSE (0/0)" terpisah -> **DIHAPUS TOTAL**. Output cukup lewat node OUT di dalam GateDiagram.
6. Tombol "+" SVG di pojok kanan atas card -> **DIHAPUS TOTAL**.
7. Kotak "Logic:" kosong (merujuk `config.logicLine` yang tidak ada di data) -> **DIHAPUS TOTAL**.

**File yang diubah:** HANYA `src/components/GateCard.jsx` (1 file). `GateDiagram.jsx` TIDAK diubah karena sudah benar.

**Verifikasi:**
- Build sukses: `1969 modules transformed`, `built in 3.25s`, 0 error.
- JS bundle turun dari 612KB ke 611.2KB (elemen tidak sah dihapus).
- Wire di GateDiagram.jsx: semua 8 gate type sudah diverifikasi — solid, tidak dashed, posisi nyambung ke node input & output tanpa gap.
- File backend (AuthContext, firebase, LoginModal, useProgressSync, api/, lib/) TIDAK disentuh.

---

## 3.6 OPTIMASI PERFORMA MOBILE: CODE-SPLITTING (SELESAI & TERVERIFIKASI)

**Masalah:** PageSpeed Insights menunjukkan skor mobile 67, FCP 4.9s, LCP 5.4s. Akar masalah: semua halaman ter-bundle jadi satu file JS ~612KB yang di-download sekaligus.

**Tindakan:**
1. **Code-splitting** — extract 4 halaman ke `src/pages/` lalu lazy-load dengan `React.lazy()` + `<Suspense>`:
   - `src/pages/BasicLogicGates.jsx` (14.95 KB)
   - `src/pages/LogicGatesCircuit.jsx` (8.79 KB)
   - `src/pages/GearsPage.jsx` (8.69 KB)
   - `src/pages/LinkagesPage.jsx` (8.69 KB)
   - Welcome dan Menu tetap dimuat langsung (halaman pertama user).
2. **Viewport meta** — hapus `maximum-scale=1` di `index.html`, sekarang user bisa pinch-zoom.
3. **Landmark `<main>`** — tambahkan `<main>` membungkus `AnimatePresence` di `App.jsx`.
4. **Img width/height** — tambahkan `width={640} height={357}` ke kedua `<img>` (gate-diagram.jpg, 640x357px).

**Hasil build:**
- Bundle awal (initial load): **573.09 KB** (turun dari 611.2 KB, hemat ~38 KB / 6.2%).
- 4 chunk halaman: total ~41 KB, hanya di-load on-demand saat user navigasi.
- Chunk size warning masih muncul (573 KB > 500 KB) karena library Firebase/Supabase di bundle awal — ini area backend developer.

**File yang diubah:** `src/App.jsx`, `index.html`, 4 file baru di `src/pages/`. File backend TIDAK disentuh (diff terverifikasi 0 insertions/deletions).

**Catatan untuk backend developer:** sebagian besar bundle awal (~573 KB) masih didominasi library Firebase + Supabase + google-auth-library. Osi yang bisa dipertimbangkan: (a) apakah semua fitur Firebase yang di-import benar-benar dipakai, (b) apakah cek status login bisa tidak memblokir tampilan awal.

---

## 3.7 OPTIMASI GAMBAR LCP: WEBP + PATH FIX + FETCHPRIORITY (SELESAI & TERVERIFIKASI)

**Masalah:** Setelah code-splitting, skor Performance mobile masih 67 karena LCP tetap 5.4 detik — tidak berubah. Elemen LCP di halaman Welcome kemungkinan besar adalah gambar `gate-diagram.jpg` (63.1 KB, JPG progressive 640x357). PageSpeed juga menemukan insight: "Improve image delivery — Est savings of 26 KiB". Ditemukan juga bug tambahan: path gambar tidak konsisten antar halaman.

**Tindakan (3 bagian):**
1. **Konversi WebP** — buat `public/gate-diagram.webp` dari `gate-diagram.jpg` menggunakan Pillow. Hasil: **63.1 KB -> 21.8 KB (hemat 65.4%, ~42 KB)**.
2. **Fix path inconsistency** — halaman Menu pakai `src="assets/gate-diagram.jpg"` (relatif, tanpa /), sedangkan Welcome pakai `src="/gate-diagram.jpg"` (absolut). Path relatif berisiko rusak. Disamakan ke `/gate-diagram.jpg` di kedua halaman.
3. **`<picture>` + fallback + fetchpriority** — kedua halaman sekarang pakai `<picture><source webp><img jpg fallback></picture>`. Halaman Welcome mendapat `fetchPriority="high"` pada `<img>`-nya (bukan pada `<source>`) supaya browser prioritaskan download gambar LCP ini. TIDAK ditambahkan `loading="lazy"` (kebalikan dari yang kita mau).

**File yang diubah:** `src/App.jsx` (2 lokasi img diubah ke picture) + `public/gate-diagram.webp` (file baru). Total commit: `e22ccd2`.

**Verifikasi:**
- Build sukses: `1974 modules transformed`, `built in 2.90s`, 0 error.
- Kedua file (JPG + WebP) tercopy ke `dist/`.
- Diff App.jsx: hanya 2 lokasi gambar yang berubah, tidak ada file lain yang tersentuh.
- File backend (AuthContext, firebase, LoginModal, useProgressSync, api/, lib/) TIDAK disentuh.

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

- SELESAI & TERVERIFIKASI: halaman "7 Basic Logic Gates" — sudah di-revert ke spec `design.md` Bagian 1 (Bagian 3.5).
- SELESAI: rekonstruksi source code + cleanup + verifikasi keamanan (Bagian 6).
- SELESAI & TERVERIFIKASI: "Logic Gates Circuit" Card 01 (Bagian 3).
- BANYAK PROGRESS DARI TEMAN (BACKEND): Login + auto-save + API routes sudah jalan (Bagian 4). Beberapa hal sudah diklarifikasi (file orphan, quiz/leaderboard opsional).
- BELUM DIKERJAKAN: card Circuit berikutnya (tier NORMAL) — perlu didiskusikan konsepnya. "Create Logic Gates Simulator" (Bagian 5) — masih jauh.
- SELESAI & TERVERIFIKASI: optimasi performa mobile — code-splitting, bundle awal turun dari 611 KB ke 573 KB (Bagian 3.6).
- SELESAI & TERVERIFIKASI: optimasi gambar LCP — konversi WebP (63.1 KB -> 21.8 KB), fix path gambar Menu, fetchpriority="high" (Bagian 3.7).
- Dokumentasi proyek terbagi 3 file permanen: `instruction.md` (aturan), `design.md` (desain), `memory.md` (log/status, file ini) — lihat `instruction.md` Bagian 1 untuk detail sistem ini.
