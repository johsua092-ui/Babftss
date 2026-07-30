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
- Ini bukan aturan baru — ini penguatan dari pelajaran pahit yang sudah terjadi berkali-kali di proyek ini (lihat Bagian 4, riwayat AI yang suka berimprovisasi/redesign sepihak).

---

## 1. TENTANG PROYEK

- **Nama:** BABFT Learning (Build A Boat For Treasure Learning) — platform edukasi web yang mengajarkan konsep Logic Gates (gerbang logika), bertema visual game Roblox "Build A Boat For Treasure".
- **Hosting:** Vercel (babft-project.vercel.app), juga diakses lewat domain abftlearning.dpdns.org.
- **Tujuan jangka panjang:** dipakai banyak user di seluruh dunia secara berkelanjutan — semua keputusan teknis mempertimbangkan skala & keawetan, bukan solusi cepat sementara.
- **Tech stack:** JavaScript modern, hasil build memakai bundler seperti Vite (terlihat dari `assets/index-[hash].js` dan `assets/index-[hash].css` di build production).

---

## 2. STRUKTUR HALAMAN YANG SUDAH ADA

Alur navigasi:
1. **Welcome** — judul "WELCOME", banner bertema Build A Boat, tombol hijau "START LEARNING".
2. **Menu utama "LOGIC GATES"** (judul hijau neon besar), berisi 3 menu:
   - **"7 Basic Logic Gates"** — ✅ SELESAI & berfungsi benar (detail di Bagian 3).
   - **"Logic Gates Circuit"** — 🔧 SEDANG DIKERJAKAN (detail di Bagian 5).
   - **"Create Logic Gates Simulator"** — ⏳ BELUM DIKERJAKAN, dikerjakan PALING TERAKHIR (kemungkinan builder/simulator bebas drag-drop, butuh fondasi 2 menu sebelumnya).
3. File `bagian-7.html` — versi standalone/mandiri halaman truth table logic gates (kemungkinan versi awal sebelum diintegrasikan ke app utama).

---

## 3. SPESIFIKASI "7 BASIC LOGIC GATES" (REFERENSI BAKU, JANGAN DIUBAH)

Spesifikasi FINAL yang sudah benar & terbukti berhasil. **WAJIB dijadikan acuan** untuk konsistensi visual & perilaku di fitur-fitur lain (termasuk Circuit).

### 3.1 Struktur halaman
- Judul: **"7 Basic Logic Gates"** (angka 7 sengaja — "Basic Wire" adalah pengantar konsep, BUKAN dihitung "gate". Total tetap 8 card, tapi yang dihitung "gate" cuma 7).
- Total 8 card: 01 Basic Wire, 02 NOT, 03 AND, 04 NAND, 05 OR, 06 NOR, 07 XOR, 08 XNOR.
- Layout: grid 2 kolom desktop, 1 kolom (stack) mobile — sudah responsive benar.
- Background halaman & card: gelap polos (dark navy/slate), TANPA pola grid/dot/texture, TANPA ornamen sudut tambahan.

### 3.2 Isi tiap card (urutan atas ke bawah)
1. Header: `<nomor> ● <Nama Gate>` (nomor kecil abu-abu, bulatan warna tema, nama gate).
2. Diagram sirkuit: node input (kotak label A/B, lingkaran isi 0/1 atau "Ø") → **wire solid tunggal** (bukan dashed) → simbol gate (lihat 3.3) → wire solid tunggal → node output (lingkaran label "OUT").
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

### 3.5 Warna tema per gate
| Gate | Warna |
|---|---|
| Basic Wire | Biru muda/abu kebiruan |
| NOT | Merah |
| AND | Hijau |
| NAND | Oranye |
| OR | Biru |
| NOR | Ungu |
| XOR | Kuning/emas |
| XNOR | Pink/magenta |

---

## 4. RIWAYAT MASALAH & PELAJARAN (JANGAN DIULANGI)

- Wire circuit sempat pecah jadi beberapa segmen (solid + dashed campur) — seharusnya satu garis solid utuh.
- Bentuk gate OR/NOR sempat disamakan dengan NOT (sama-sama segitiga lurus) — harus dibedakan.
- AI sempat **berimprovisasi/redesign sepihak** — nambahin elemen tak diminta (eyebrow label, subtitle, background grid/dot, ornamen sudut, ubah judul halaman sendiri). **Pelajaran: AI harus reproduksi persis sesuai spek, tidak boleh redesign tanpa diminta eksplisit.**
- Highlight truth table gagal 2 versi berbeda: pertama muncul elemen garis/progress-bar aneh; setelah diperbaiki, malah jadi pewarnaan statis permanen (bukan dinamis). **Pelajaran: highlight harus dihitung dari perbandingan real-time, bukan aturan warna tetap.**
- **Kesimpulan umum:** AI cenderung "kreatif berlebihan" atau salah paham konsep statis-vs-dinamis kalau instruksi tidak sangat eksplisit + ada contoh konkret. Selalu sertakan: (a) larangan eksplisit nambah elemen di luar spek, (b) contoh skenario step-by-step, (c) checklist verifikasi manual sebelum dianggap selesai.
- **[BARU]** Ditekankan ulang oleh tim proyek: AI juga harus dijaga supaya **tidak mengubah struktur fondasi kode** di luar scope yang diminta — lihat Bagian 0.2.

---

## 5. SPESIFIKASI "LOGIC GATES CIRCUIT" (SEDANG DIKERJAKAN)

Gabungan beberapa gate dari "7 Basic Logic Gates" disambung jadi satu rangkaian (output gate 1 → input gate 2, dst). **Semua sistem visual & interaktif dari Bagian 3 dipertahankan 100% persis** — bedanya sekarang gate-nya lebih dari satu dan saling terhubung dalam satu card.

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
**Card pertama (tier MUDAH) — sedang dikerjakan:**
- Nama: rangkaian "NOT → AND" (2 gate).
- Struktur: input A & B. B → NOT Gate → hasil NOT(B) jadi input AND bareng A. `OUT = A AND (NOT B)`.
- Truth table: 2 input → 4 baris (0,0 / 0,1 / 1,0 / 1,1).
- Tier badge: MUDAH.
- Status: prompt kerja untuk card ini sudah dibuat, menunggu hasil implementasi & verifikasi.

---

## 6. AUTO-SAVE PROGRESS USER (Firebase Auth + Supabase Database)

**Masalah:** kalau user tidak sengaja refresh/tutup browser, progress belajar (posisi terakhir, interaksi) hilang, kembali ke Welcome. Ini mengganggu user yang belajar serius.

**Keputusan arsitektur** (karena proyek untuk skala besar & jangka panjang, bukan localStorage semata):
- **Authentication:** Firebase Auth — mendukung login Google, GitHub, Email/Password.
- **Database:** Supabase (Postgres) — HANYA untuk menyimpan data (Auth tetap di Firebase).
- **Struktur data:** 1 tabel `user_progress` dengan kolom `firebase_uid` (primary key, dari Firebase Auth), `current_page` (text), `progress_data` (jsonb, fleksibel), `updated_at` (timestamp).
- **Pola keamanan wajib:** karena Auth & Database beda platform, RLS otomatis Supabase tidak berlaku otomatis. Semua akses database WAJIB lewat API route server: frontend kirim Firebase ID Token → server verifikasi pakai Firebase Admin SDK → server (pakai Supabase service role key, HANYA di server, tidak pernah ke browser) query Supabase difilter berdasarkan uid terverifikasi.
- Progress tersimpan otomatis di background tiap ada perubahan (tanpa tombol Save manual), dan saat load ulang otomatis kembali ke posisi terakhir.
- Sediakan tombol "Reset Progress" opsional.

**Status:** user sudah setup Firebase + Supabase project secara mandiri di luar sesi AI. **AI berikutnya: tanyakan dulu ke user apakah environment variable-nya sudah terpasang lengkap di project sebelum lanjut membangun fitur di atasnya.**

---

## 7. RENCANA SETELAH CIRCUIT SELESAI

**"Create Logic Gates Simulator"** — dikerjakan PALING TERAKHIR. Kemungkinan fitur builder/simulator bebas (drag-drop gate, dst). Butuh fondasi Basic Gates + Circuit sudah solid dulu.

---

## 8. CATATAN KEAMANAN

- JANGAN PERNAH taruh Supabase service role key atau Firebase Admin SDK credentials di kode frontend/client-side — hanya di environment variable server-side.
- JANGAN PERNAH share/tempel API key, token, atau credential apapun secara terbuka di chat/dokumen manapun. Kalau pernah ter-expose tidak sengaja, WAJIB langsung di-revoke & generate ulang.

---

## 9. RINGKASAN STATUS SAAT INI

- ✅ **SELESAI:** halaman "7 Basic Logic Gates" — desain & fungsi interaktif (termasuk highlight dinamis) benar & terverifikasi.
- ✅ **SELESAI DISETUP USER:** sistem auto-save progress Firebase Auth + Supabase Database (Bagian 6) — perlu verifikasi env variable sebelum lanjut fitur di atasnya.
- 🔧 **SEDANG DIKERJAKAN:** halaman "Logic Gates Circuit" (Bagian 5) — sistem tier & struktur card sudah disepakati, sedang mengerjakan card pertama tier MUDAH ("NOT → AND").
- ⏳ **BELUM DIKERJAKAN:** "Create Logic Gates Simulator" (Bagian 7).
- **File project:** `index.html`, `bagian-7.html` (standalone truth table), `index-single.html`, folder `assets/` (build production, sudah di-minify), `favicon.svg`, `robots.txt`.
