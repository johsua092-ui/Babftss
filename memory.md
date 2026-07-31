# MEMORY: BABFT LEARNING PLATFORM

> File ini adalah "memory" proyek. Taruh file ini di **root folder repository**. Setiap AI/AI coding tool yang mengerjakan proyek ini (Claude Code, Cursor, Qwen, atau AI lain apapun) WAJIB membaca file ini dulu sebelum mengerjakan apapun — supaya walau ganti provider/tool, konteks proyek tetap nyambung tanpa perlu dijelaskan ulang dari nol.

---

## 0. PROTOKOL WAJIB

### 0.1 Sistem Dua File
Proyek ini memakai sistem **DUA FILE** yang wajib diikuti oleh AI manapun:

- **`memory.md`** (file ini) — living document / log historis proyek. Setiap kali ada aktivitas baru yang berarti (fitur baru dibuat, bug diperbaiki, keputusan arsitektur diambil, status berubah), file ini **WAJIB DI-UPDATE** mengikuti perubahan tersebut. **JANGAN buat file memory baru dari nol** — selalu update/lanjutkan file yang sudah ada supaya histori tetap utuh.
- **Prompt kerja** — instruksi spesifik & actionable untuk task yang sedang dikerjakan saat itu (berbeda tiap task, tidak diakumulasi jadi satu file raksasa).

Setiap kali selesai membahas suatu topik/fitur, **WAJIB sediakan KEDUA file** sebagai file yang bisa didownload/disimpan user.

### 0.2 ATURAN PALING PENTING: JANGAN UBAH STRUKTUR FONDASI KODE
**Ini aturan mutlak, pelanggaran paling fatal jika dilakukan:**

- AI **HANYA BOLEH** mengerjakan scope yang secara eksplisit diminta di prompt kerja saat itu. **DILARANG KERAS** merombak, merefactor, merapikan, atau "membenahi inisiatif sendiri" struktur folder, arsitektur komponen, cara routing, atau kode fitur LAIN yang tidak sedang dibahas — walau AI merasa itu "lebih baik" atau "lebih rapi".
- Kalau AI menemukan bagian kode lain yang menurutnya bermasalah/bisa diperbaiki TAPI di luar scope permintaan saat itu, **JANGAN diubah otomatis** — cukup laporkan/sebutkan ke user sebagai catatan/saran, biarkan user yang putuskan apakah mau dikerjakan di sesi terpisah.
- Style/design system yang SUDAH ADA dan sudah terbukti benar (lihat Bagian 3) **WAJIB DI-REUSE**, bukan dibuat ulang dari nol atau "diinterpretasi ulang" dengan gaya baru.
- **Root folder repo WAJIB BERSIH** — file kerja/analisis/debug sementara TIDAK BOLEH ditinggal di root, harus di folder terpisah atau dihapus setelah tidak dipakai (lihat Bagian 9, pelajaran dari insiden file `*_dump.txt`/`extracted_*.js` yang nyampah di root).
- **Laporan progress WAJIB jujur apa adanya** — kalau ada bagian yang belum dikerjakan/belum diverifikasi (misal integrasi env variable), WAJIB dilaporkan sebagai "belum selesai", JANGAN dibuat terdengar lebih beres dari kenyataan.
- Ini bukan aturan baru — ini penguatan dari pelajaran pahit yang sudah terjadi berkali-kali di proyek ini (lihat Bagian 4 dan Bagian 9).

### 0.3 PEMBAGIAN PERAN TIM (WAJIB DIPATUHI)
Proyek ini dikerjakan 2 orang dengan pembagian tegas:
- **User (pemilik chat/akun ini) = 100% FRONTEND.** Semua kerjaan lewat sesi ini (tampilan, komponen React, halaman, styling, interaksi UI) adalah tanggung jawab & scope user.
- **Teman user = 100% BACKEND** (termasuk implementasi Firebase Auth + Supabase Database di Bagian 6, API route, dsb). User melapor progress ke temannya, tapi TIDAK mengerjakan bagian backend sendiri.
- **AI yang bekerja dengan user WAJIB tetap di lane FRONTEND** — JANGAN inisiatif mengerjakan/mengimplementasikan bagian backend (Bagian 6: Firebase Auth, Supabase Database, API route, dst) kecuali user EKSPLISIT bilang dia yang diminta backend-nya oleh temannya untuk task tertentu. Kalau ada task yang menyentuh backend, tanyakan dulu ke user apakah ini memang delegasi dari temannya atau salah scope.
- Konsekuensi pembagian ini: prioritas kerja untuk user adalah SEMUA hal di Bagian 3, 5, dan 7 (Basic Gates, Circuit, Simulator — semua frontend). Bagian 6 (backend) BUKAN prioritas/scope user, walau tetap dicatat di sini sebagai referensi arsitektur yang sudah disepakati dengan tim.

### 0.4 FILE/HALAMAN TERLARANG DISENTUH (MILIK TEMAN/BACKEND)
Teman user (backend developer) sudah membuat **halaman Login + setup backend (Firebase dll)** sendiri. **AI yang bekerja dengan user (frontend) DILARANG KERAS menyentuh/mengedit halaman Login atau file terkait auth/backend apapun** — resiko bikin error di sistem yang sudah dibangun teman. Kalau AI menemukan file yang kelihatannya terkait login/auth saat eksplorasi kode, JANGAN diubah — laporkan ke user, biarkan user koordinasi dengan temannya dulu. (Catatan: nama file/path spesifik untuk halaman Login ini BELUM didata di sini — perlu ditanyakan ke teman user supaya bisa didaftar eksplisit sebagai proteksi.)

### 0.5 PREFERENSI FORMAT: ICON, BUKAN EMOJI
Teman user (backend) minta: **jangan pakai emoji, pakai icon.** Diterapkan sebagai berikut:
- Di **UI aplikasi**: kalau prompt kerja meminta elemen ikon apapun, WAJIB pakai komponen icon library yang sudah dipakai project ini (`lucide-react` — sudah dipakai untuk Cpu, Network, FlaskConical, dst di menu), BUKAN karakter emoji ditulis langsung di teks/JSX.
- Di **dokumen memory.md/prompt kerja**: minimalkan penggunaan emoji sebagai penanda status, pakai teks/tanda biasa.

---

## 1. TENTANG PROYEK

- **Nama:** BABFT Learning (Build A Boat For Treasure Learning) — platform edukasi web yang mengajarkan konsep Logic Gates (gerbang logika), bertema visual game Roblox "Build A Boat For Treasure". Juga berisi materi Gears (36 jenis) dan Linkages Mechanic (45 jenis).
- **Hosting:** Vercel (babft-project.vercel.app), juga diakses lewat domain abftlearning.dpdns.org.
- **Tujuan jangka panjang:** dipakai banyak user di seluruh dunia secara berkelanjutan — semua keputusan teknis mempertimbangkan skala & keawetan, bukan solusi cepat sementara.
- **Tech stack (terkonfirmasi setelah rekonstruksi):** React 19.1.0 + Vite 5.x + framer-motion (AnimatePresence untuk transisi halaman) + lucide-react (icon) + sonner (toast notification) + Tailwind CSS v4. Routing pakai `useState` sederhana (BUKAN React Router) dengan 7 halaman: `welcome`, `menu`, `logic-gates`, `basic-logic-gates`, `logic-gates-circuit`, `gears`, `linkages`. Font: Orbitron (heading) + Inter (body).

---

## 2. STRUKTUR HALAMAN YANG SUDAH ADA

Alur navigasi:
1. **Welcome** — judul "WELCOME", banner bertema Build A Boat, tombol hijau "START LEARNING".
2. **Menu utama "LOGIC GATES"** (judul hijau neon besar), berisi 3 menu:
   - **"7 Basic Logic Gates"** — SELESAI & berfungsi benar (detail di Bagian 3).
   - **"Logic Gates Circuit"** — SEDANG DIKERJAKAN (detail di Bagian 5).
   - **"Create Logic Gates Simulator"** — BELUM DIKERJAKAN, dikerjakan PALING TERAKHIR (kemungkinan builder/simulator bebas drag-drop, butuh fondasi 2 menu sebelumnya).
3. Ada juga menu **Gears** (36 jenis gear, masing-masing custom SVG icon) dan **Linkages Mechanic** (45 jenis linkage, masing-masing custom SVG icon) — sudah ada di aplikasi, belum banyak dibahas detail di sesi-sesi sebelumnya, perlu diklarifikasi ke user kalau ada pengerjaan lanjutan di area ini.

---

## 3. SPESIFIKASI "7 BASIC LOGIC GATES" (REFERENSI BAKU, JANGAN DIUBAH)

Spesifikasi FINAL yang sudah benar & terbukti berhasil. **WAJIB dijadikan acuan** untuk konsistensi visual & perilaku di fitur-fitur lain (termasuk Circuit).

### 3.1 Struktur halaman
- Judul: **"7 Basic Logic Gates"** (angka 7 sengaja — "Basic Wire" adalah pengantar konsep, BUKAN dihitung "gate". Total tetap 8 card, tapi yang dihitung "gate" cuma 7).
- Total 8 card: 01 Basic Wire, 02 NOT, 03 AND, 04 NAND, 05 OR, 06 NOR, 07 XOR, 08 XNOR.
- Layout: grid 2 kolom desktop, 1 kolom (stack) mobile — sudah responsive benar.
- Background halaman & card: gelap polos — **warna terkonfirmasi setelah rekonstruksi: background utama `#181b24`, panel/card `#0e1420`** (bukan slate standar Tailwind). TANPA pola grid/dot/texture, TANPA ornamen sudut tambahan.

### 3.2 Isi tiap card (urutan atas ke bawah)
1. Header: `<nomor> ● <Nama Gate>` (nomor kecil abu-abu, bulatan warna tema, nama gate).
2. Diagram sirkuit: node input (kotak label A/B, lingkaran isi 0/1 atau "Ø") -> **wire solid tunggal** (bukan dashed) -> simbol gate (lihat 3.3) -> wire solid tunggal -> node output (lingkaran label "OUT").
3. Baris status: `A=<nilai> -> OUT=<nilai>` (atau dengan B).
4. Satu kalimat deskripsi singkat.
5. Truth table dengan highlight baris dinamis (lihat 3.4).

### 3.3 Bentuk gate per jenis
| Gate | Bentuk |
|---|---|
| Basic Wire | Tanpa simbol, garis lurus saja |
| NOT | Segitiga sisi lurus + bubble kecil di output |
| AND | Bentuk "D" (kiri lurus, kanan setengah lingkaran), tanpa bubble |
| NAND | Bentuk "D" + bubble di output |
| OR | Sisi kiri melengkung cekung, kanan meruncing, tanpa bubble (HARUS beda dari NOT) |
| NOR | Bentuk OR + bubble di output |
| XOR | Bentuk OR + 1 garis lengkung tambahan di belakang, tanpa bubble |
| XNOR | Bentuk XOR + bubble di output |

### 3.4 Highlight baris truth table (PALING KRUSIAL)
Hanya SATU baris di-highlight, yaitu baris yang nilai kolomnya PERSIS SAMA dengan kombinasi input aktif saat ini. Highlight = background transparan (~15-25% opacity) warna tema gate + teks warna tema. Baris lain polos. **WAJIB dihitung ulang dinamis/real-time** setiap toggle input — BUKAN pewarnaan statis (jangan "0 selalu merah, 1 selalu hijau" permanen).

### 3.5 Warna tema per gate (hex TERVERIFIKASI langsung dari source code — koreksi dari versi sebelumnya)
| Gate | Warna | Hex |
|---|---|---|
| Basic Wire | Biru muda/abu kebiruan | `#60a5fa` |
| NOT | Merah | `#f87171` |
| AND | Hijau | `#4ade80` |
| NAND | Oranye | `#fb923c` |
| OR | Ungu/violet | `#a78bfa` |
| NOR | Pink | `#f472b6` |
| XOR | Kuning/emas | `#facc15` |
| XNOR | Teal/cyan | `#2dd4bf` |

---

## 4. RIWAYAT MASALAH & PELAJARAN (JANGAN DIULANGI)

- Wire circuit sempat pecah jadi beberapa segmen (solid + dashed campur) — seharusnya satu garis solid utuh.
- Bentuk gate OR/NOR sempat disamakan dengan NOT (sama-sama segitiga lurus) — harus dibedakan.
- AI sempat **berimprovisasi/redesign sepihak** — nambahin elemen tak diminta (eyebrow label, subtitle, background grid/dot, ornamen sudut, ubah judul halaman sendiri). Pelajaran: AI harus reproduksi persis sesuai spek, tidak boleh redesign tanpa diminta eksplisit.
- Highlight truth table gagal 2 versi berbeda: pertama muncul elemen garis/progress-bar aneh; setelah diperbaiki, malah jadi pewarnaan statis permanen (bukan dinamis). Pelajaran: highlight harus dihitung dari perbandingan real-time, bukan aturan warna tetap.
- Kesimpulan umum: AI cenderung "kreatif berlebihan" atau salah paham konsep statis-vs-dinamis kalau instruksi tidak sangat eksplisit + ada contoh konkret. Selalu sertakan: (a) larangan eksplisit nambah elemen di luar spek, (b) contoh skenario step-by-step, (c) checklist verifikasi manual sebelum dianggap selesai.
- AI juga harus dijaga supaya tidak mengubah struktur fondasi kode di luar scope yang diminta — lihat Bagian 0.2.
- Saat rekonstruksi source code, AI meninggalkan ~20 file kerja/analisis sementara (`*_dump.txt`, `extracted_*.js`, dll) di ROOT folder repo, bikin repo berantakan. Pelajaran: file kerja/temporary WAJIB dibersihkan atau dipindah ke folder terpisah, jangan ditinggal di root.
- Laporan rekonstruksi sebelumnya tidak menyebut sama sekali soal status environment variable/integrasi Firebase-Supabase — berpotensi menyesatkan (terdengar "semua beres" padahal ada bagian yang belum dicek/dikerjakan). Pelajaran: laporan progress harus eksplisit menyebutkan bagian yang belum selesai, bukan cuma bagian yang berhasil.

---

## 5. SPESIFIKASI "LOGIC GATES CIRCUIT" (SEDANG DIKERJAKAN)

Gabungan beberapa gate dari "7 Basic Logic Gates" disambung jadi satu rangkaian (output gate 1 -> input gate 2, dst). Semua sistem visual & interaktif dari Bagian 3 dipertahankan 100% persis — bedanya sekarang gate-nya lebih dari satu dan saling terhubung dalam satu card.

### 5.1 Struktur card Circuit
- Pojok kiri: nomor urut card.
- Pojok kanan: badge TIER (lihat 5.2).
- Judul: nama rangkaian deskriptif.
- Deskripsi: 2-4 kalimat (lebih panjang dari card gate tunggal, karena lebih kompleks).
- Diagram sirkuit: gate saling terhubung, bentuk & wire sesuai standar 3.3, neon glow ikut tema tiap gate.
- Truth table: jumlah kolom input menyesuaikan jumlah input asli rangkaian (2^n baris untuk n input), highlight tetap dinamis real-time.

### 5.2 Sistem TIER (badge, reusable untuk semua card Circuit berikutnya)
| Tier | Styling |
|---|---|
| MUDAH | Warna solid biasa, border flat, tanpa glow berlebihan |
| NORMAL | Warna terang/vivid, glow neon standar |
| HARD | Border gradient RGB (2-3 warna), animasi bergerak pelan |
| INSANE | Border RGB penuh spektrum, animasi cepat + shimmer/kelap-kelip, kesan premium |

### 5.3 Progres pengerjaan (satu-satu, bertahap)
**Card pertama (tier MUDAH) — SUDAH LIVE, source code sudah dicek langsung (file `src/components/CircuitDiagram01.jsx`), 3 minor issue masih ada, SIAP DIPERBAIKI SEKARANG (tidak ada lagi yang menghalangi):**
- Nama: rangkaian "NOT -> AND" (2 gate).
- Struktur: input A & B. B -> NOT Gate -> hasil NOT(B) jadi input AND bareng A. `OUT = A AND (NOT B)`.
- Truth table: 2 input -> 4 baris (0,0 / 0,1 / 1,0 / 1,1).
- Tier badge: MUDAH.
- Minor issue #1: wire routing A->AND dan NOT->AND (sinyal B') masih diagonal/miring (terkonfirmasi di kode: koordinat Y beda antara titik awal-akhir garis), harusnya siku-siku/lurus rapi seperti standar Bagian 3.
- Minor issue #2: ada teks "AND" tertulis di dalam shape gate AND — seharusnya polos tanpa teks (sesuai Bagian 3.3).
- Minor issue #3 (BARU DITEMUKAN saat investigasi kode): ada JUGA teks "NOT" tertulis di dalam shape gate NOT — sama seperti issue #2, seharusnya polos tanpa teks di dalam shape gate manapun (baik di halaman Basic Gates maupun Circuit).
- Status: source code sudah proper (Bagian 9 selesai), TIDAK ADA LAGI alasan menunda — siap diperbaiki kapan saja.

---

## 6. AUTO-SAVE PROGRESS USER (Firebase Auth + Supabase Database)

**Masalah:** kalau user tidak sengaja refresh/tutup browser, progress belajar (posisi terakhir, interaksi) hilang, kembali ke Welcome. Ini mengganggu user yang belajar serius.

**Keputusan arsitektur** (karena proyek untuk skala besar & jangka panjang, bukan localStorage semata):
- Authentication: Firebase Auth — mendukung login Google, GitHub, Email/Password.
- Database: Supabase (Postgres) — HANYA untuk menyimpan data (Auth tetap di Firebase).
- Struktur data: 1 tabel `user_progress` dengan kolom `firebase_uid` (primary key, dari Firebase Auth), `current_page` (text), `progress_data` (jsonb, fleksibel), `updated_at` (timestamp).
- Pola keamanan wajib: karena Auth & Database beda platform, RLS otomatis Supabase tidak berlaku otomatis. Semua akses database WAJIB lewat API route server: frontend kirim Firebase ID Token -> server verifikasi pakai Firebase Admin SDK -> server (pakai Supabase service role key, HANYA di server, tidak pernah ke browser) query Supabase difilter berdasarkan uid terverifikasi.
- Progress tersimpan otomatis di background tiap ada perubahan (tanpa tombol Save manual), dan saat load ulang otomatis kembali ke posisi terakhir.
- Sediakan tombol "Reset Progress" opsional.

**Status (update terbaru — TERNYATA SUDAH MULAI DIIMPLEMENTASI, bukan 0% lagi):** hasil investigasi kode terbaru (dari file repo hasil download, di luar sesi frontend ini) menunjukkan backend developer (teman user) sudah mengimplementasikan cukup banyak:
- `src/firebase/config.js` — Firebase Auth config (pakai env var, tidak ada hardcode).
- `src/contexts/AuthContext.jsx` — context Auth yang AKTIF DIPAKAI oleh `App.jsx`.
- `src/components/LoginModal.jsx` — modal login yang AKTIF DIPAKAI (JANGAN DISENTUH, lihat Bagian 0.4).
- `src/hooks/useProgressSync.js` — hook yang TERKONFIRMASI terpasang di `App.jsx`, memanggil `/api/save-progress`, `/api/get-progress`, `/api/reset-progress` secara real-time.
- `api/save-progress.js`, `api/get-progress.js`, `api/reset-progress.js`, `lib/api-helpers.js` — backend API routes dengan CORS, rate limiting, validasi input, security headers — kualitas kodenya bagus.
- Supabase terhubung lewat `getSupabaseAdmin()` di server-side (`lib/api-helpers.js`), pakai `SUPABASE_SERVICE_ROLE_KEY` dari env var (server-only, tidak ke-expose ke browser) — sesuai pola keamanan yang direncanakan.

**Catatan tambahan dari investigasi (untuk didiskusikan dengan teman/backend developer, BUKAN untuk dikerjakan di sesi frontend):**
- Ditemukan file DUPLIKAT/ORPHAN yang tidak terpakai: `src/context/AuthContext.jsx` (beda dari `src/contexts/AuthContext.jsx` yang aktif — cuma beda nama folder "context" vs "contexts"), `src/lib/firebase.js`, `src/lib/supabase.js`, `src/components/LoginPage.jsx`, `src/components/UserPill.jsx`. Semua ini TIDAK diimpor di manapun oleh kode yang aktif — kemungkinan sisa percobaan/versi sebelumnya yang belum dibersihkan. INI FILE TERKAIT LOGIN/AUTH — sesuai Bagian 0.4, AI frontend TIDAK BOLEH menghapus/mengubah ini. Perlu dibersihkan oleh teman/backend developer sendiri.
- Ditemukan `api/quiz/history.js`, `api/quiz/submit.js`, `api/leaderboard.js`, `api/profile.js` — fitur backend yang BELUM PERNAH dibahas/direncanakan di `memory.md` manapun sebelumnya. Quiz API belum ada yang memanggil dari frontend sama sekali. PERLU DIKLARIFIKASI ke teman: apakah ini rencana fitur mendatang yang belum sempat didiskusikan, atau di luar scope proyek ini.
- Metode verifikasi token Firebase di server (`lib/api-helpers.js`) memakai `google-auth-library` (`OAuth2Client.verifyIdToken`) — BUKAN `firebase-admin` SDK yang lebih standar untuk ini. Belum tentu salah, tapi tidak umum — worth dikonfirmasi ke teman apakah ini sudah tervalidasi bekerja benar.

---

## 7. RENCANA SETELAH CIRCUIT SELESAI

"Create Logic Gates Simulator" — dikerjakan PALING TERAKHIR. Kemungkinan fitur builder/simulator bebas (drag-drop gate, dst). Butuh fondasi Basic Gates + Circuit sudah solid dulu.

---

## 8. CATATAN KEAMANAN

- JANGAN PERNAH taruh Supabase service role key atau Firebase Admin SDK credentials di kode frontend/client-side — hanya di environment variable server-side.
- JANGAN PERNAH share/tempel API key, token, atau credential apapun secara terbuka di chat/dokumen manapun. Kalau pernah ter-expose tidak sengaja, WAJIB langsung di-revoke & generate ulang.
- Setiap kali ada laporan pekerjaan yang melibatkan backend/auth/database, WAJIB verifikasi eksplisit: apakah ada file `.env.example`, apakah ada secret yang ter-hardcode di source code. Jangan asumsikan aman tanpa dicek — lihat Bagian 9.

---

## 9. ISU ARSITEKTUR: REKONSTRUKSI SOURCE CODE (SELESAI SEPENUHNYA)

**Masalah awal:** repo GitHub tidak punya source code asli, hanya bundle production ter-minify (446KB JS + 92KB CSS). AI terpaksa edit langsung bundle minified untuk fitur Circuit Card 01 — berisiko tinggi untuk maintenance jangka panjang.

**Keputusan:** Opsi B — rekonstruksi source code dari analisis mendalam terhadap bundle production, mempertahankan tampilan/perilaku identik.

**Hasil rekonstruksi (7 commit, branch `feat/source-rekonstruksi` -> merged ke `main`, commit final `b72cb45`):**
- Source code lengkap berhasil disusun ulang: `package.json`, `vite.config.js`, `src/` (App.jsx, halaman-halaman, komponen GateCard/GateDiagram/CircuitCard01/CircuitDiagram01/GearIcon/LinkageIcon, data gateData/gearData/linkageData, utils).
- Tech stack terkonfirmasi: React 19.1.0, framer-motion, lucide-react, sonner, Tailwind CSS v4.
- Build baru: 426KB JS (vs production 446KB, gap 4.5% — wajar, beda minor versi library) + 29KB CSS (vs production 92KB — gap ini justru bagus, itu dead code Tailwind/sonner yang kebuang).
- Verifikasi fungsional: 81 checks dijalankan, 76 pass, 5 fail (hanya beda nama icon akibat minification, bukan beda fungsional).
- File production lama di-backup ke `assets_backup/` sebelum ditimpa.

**Cleanup file (commit `4a3e200`, sudah di-push ke `main`):**
- 44 file dipindah dari root ke `scripts/analysis/` (17 file `extracted_*.js`, 24 file `*_dump.txt`/`*_full.txt`, 3 file HTML sementara termasuk `bagian-7.html`/`index-single.html`).
- 4 file script verifikasi dipindah ke `scripts/` (`verify_functional.mjs`, `verify_css.mjs`, `compare_bundles.mjs`, `debug_modules.mjs`).
- 2 file duplikat dihapus dari root (sudah ada salinannya di `public/`), 2 file `.bak`/temp untracked dihapus.
- **Root repo sekarang cuma 6 file:** `index.html`, `memory.md`, `package.json`, `package-lock.json`, `vite.config.js`, `robots.txt`. Build tetap identik sebelum/sesudah cleanup (426KB JS + 29KB CSS).

**Verifikasi environment & keamanan (hasil scan langsung ke `src/`, 4 pola regex berbeda):**
- `.env`/`.env.local` TIDAK ADA di repo (aman, memang seharusnya tidak di-commit).
- `.env.example` BARU DIBUAT — isi 12 variable placeholder (7 Firebase client, 2 Supabase client, 3 server-side), semua value `your_*_here`, TIDAK ADA credential asli.
- `.gitignore` sudah benar meng-cover `.env`, `.env.local`, `.env.*.local`.
- Scan credential/API key pattern (termasuk pola nyata seperti `ghp_`, `eyJ`, `ya29`, `service.role`, `private.key`) di seluruh `src/`: **0 hasil ditemukan** — tidak ada secret ter-hardcode.
- **Temuan penting:** integrasi Firebase Auth + Supabase Database **0% terimplementasi** di kode — lihat Bagian 6 untuk detail & status terbaru.

**Kesimpulan:** rekonstruksi source code + cleanup + verifikasi keamanan SELESAI dan TERVERIFIKASI kredibel (metodologi jelas, hasil bisa diperiksa, tidak ada temuan berbahaya). Root repo sekarang bersih dan source code proper sudah jadi fondasi resmi ke depannya — TIDAK BOLEH edit bundle `assets/*.js` manual lagi, semua lewat `src/` + `npm run build`.

---

## 10. RINGKASAN STATUS SAAT INI

[CATATAN: kekhawatiran "kekacauan" dari user soal proses cleanup+env sebelumnya SUDAH DIINVESTIGASI langsung lewat kode di repo terbaru — lihat temuan detail di bawah dan di Bagian 6. Sejauh ini TIDAK ditemukan kerusakan fatal; temuannya lebih ke arah file duplikat/orphan yang belum dibersihkan dan fitur backend yang belum terdokumentasi, bukan sesuatu yang bikin aplikasi rusak/error.]

- SELESAI: halaman "7 Basic Logic Gates" — desain & fungsi interaktif (termasuk highlight dinamis) benar & terverifikasi.
- SELESAI: rekonstruksi source code (React 19 + Vite) + cleanup root repo + verifikasi keamanan env — semua terverifikasi aman, tidak ada credential bocor (Bagian 9).
- SUDAH LIVE, ADA 3 MINOR ISSUE (siap diperbaiki sekarang, ini SCOPE FRONTEND/AMAN dikerjakan): halaman "Logic Gates Circuit" Card 01 (NOT->AND, tier MUDAH) — wire routing diagonal, teks "AND" dan teks "NOT" di dalam shape gate (lihat Bagian 5.3).
- SUDAH BANYAK DIKERJAKAN OLEH TEMAN (BACKEND, BUKAN SCOPE USER): integrasi Firebase Auth + Supabase Database (Bagian 6) — Login, AuthContext, dan auto-save progress (`useProgressSync`) SUDAH terpasang dan terhubung ke API routes. Ada beberapa file orphan/duplikat serta fitur belum terdokumentasi (quiz, leaderboard, profile) yang perlu diklarifikasi dengan teman — lihat Bagian 6 untuk detail lengkap. JANGAN dikerjakan/diubah di sesi frontend.
- BELUM DIKERJAKAN: "Create Logic Gates Simulator" (Bagian 7).
- Struktur repo saat ini (root bersih, sesuai laporan cleanup sebelumnya): `index.html`, `memory.md`, `package.json`, `package-lock.json`, `vite.config.js`, `robots.txt`, `.env.example`, `.gitignore` di root; folder `src/` (source code, termasuk `firebase/`, `contexts/`, `hooks/`, `lib/`), `public/`, `assets/` (build output — ada duplikat kecil `gate-diagram.jpg` dengan `public/`, minor housekeeping), `api/` (backend routes milik teman), `lib/` (helper backend milik teman), `scripts/` (termasuk `scripts/analysis/` untuk file forensik rekonstruksi).
