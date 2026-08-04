# DESIGN.md — DESIGN SYSTEM PROYEK BABFT LEARNING

> Dokumen ini berisi SPESIFIKASI TAMPILAN yang sudah final & terbukti benar. Isinya jadi acuan baku untuk konsistensi visual di seluruh fitur (Basic Gates, Circuit, dan nanti Simulator). Baca `instruction.md` dulu sebelum ini untuk tau aturan umum proyek.

---

## 0. PRINSIP DESAIN: NEON GLOW DI LOGIC GATES ITU FUNGSIONAL, BUKAN DEKORATIF (WAJIB DIPAHAMI SEBELUM LANJUT)

**Keputusan final, sudah disepakati user & tim — JANGAN diubah/disederhanakan tanpa persetujuan eksplisit:**

Warna neon menyala di semua elemen Logic Gates (Basic Gates, Circuit, dan nanti Simulator) BUKAN sekadar gaya visual — itu **sinyal status fungsional**: neon menyala terang = gate/wire sedang bernilai **1**, redup/gelap = bernilai **0**. Untuk pemula yang baru belajar konsep gerbang logika, ini krusial: mereka bisa langsung "membaca" kondisi rangkaian sekilas mata dari terang-redupnya, tanpa harus baca angka satu per satu di tiap node.

**Konsekuensi aturan ini:**
- **DILARANG** "menyederhanakan"/meredam efek neon glow di halaman Logic Gates manapun atas nama "biar lebih minimalis" atau "biar nggak norak" — walau ada masukan bahwa gaya warna-warni menyala di tempat lain kelihatan berlebihan/`AI slop`.
- Bagian **LAIN** di luar Logic Gates (misal halaman Gears, Linkages, atau UI umum non-gate) BOLEH punya gaya lebih kalem/minimalis — itu keputusan terpisah, tidak berlaku ke area Logic Gates.
- Kalau ada saran styling baru yang menyentuh Logic Gates, WAJIB dicek dulu: apakah itu tetap mempertahankan fungsi sinyal terang=1/redup=0 ini? Kalau mengorbankan kejelasan sinyal ini demi estetika, TOLAK saran itu.

---

## 1. SPESIFIKASI "7 BASIC LOGIC GATES" (REFERENSI BAKU, JANGAN DIUBAH)

### 1.1 Struktur halaman
- Judul: **"7 Basic Logic Gates"** (angka 7 sengaja — "Basic Wire" adalah pengantar konsep, BUKAN dihitung "gate". Total tetap 8 card, tapi yang dihitung "gate" cuma 7).
- Total 8 card: 01 Basic Wire, 02 NOT, 03 AND, 04 NAND, 05 OR, 06 NOR, 07 XOR, 08 XNOR.
- Layout: grid 2 kolom desktop, 1 kolom (stack) mobile.
- Background halaman & card: gelap polos — background utama `#181b24`, panel/card `#0e1420`. TANPA pola grid/dot/texture, TANPA ornamen sudut tambahan.

### 1.2 Isi tiap card (urutan atas ke bawah)
1. Header: `<nomor> ● <Nama Gate>` (nomor kecil abu-abu, bulatan warna tema, nama gate).
2. Diagram sirkuit: node input (kotak label A/B, lingkaran isi 0/1 atau "Ø") -> **wire solid tunggal** (bukan dashed) -> simbol gate (lihat 1.3) -> wire solid tunggal -> node output (lingkaran label "OUT").
3. Baris status: `A=<nilai> -> OUT=<nilai>` (atau dengan B).
4. Satu kalimat deskripsi singkat.
5. Truth table dengan highlight baris dinamis (lihat 1.4).

**Catatan:** shape gate TIDAK BOLEH ada teks label di dalamnya (misal "AND"/"NOT" tertulis di dalam bentuknya) — identitas gate cukup dari bentuk + warna tema + header card.

### 1.3 Bentuk gate per jenis
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

### 1.4 Highlight baris truth table (PALING KRUSIAL)
Hanya SATU baris di-highlight, yaitu baris yang nilai kolomnya PERSIS SAMA dengan kombinasi input aktif saat ini. Highlight = background transparan (~15-25% opacity) warna tema gate + teks warna tema. Baris lain polos. **WAJIB dihitung ulang dinamis/real-time** setiap toggle input — BUKAN pewarnaan statis (jangan "0 selalu merah, 1 selalu hijau" permanen).

### 1.5 Warna tema per gate (hex TERVERIFIKASI langsung dari source code)
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

## 2. SPESIFIKASI "CARD 0: SIMBOL BOOLEAN" (REFERENSI TUTORIAL, WAJIB DI POSISI PALING ATAS)

Card khusus non-interaktif (bukan circuit yang bisa di-toggle), berisi referensi 7 notasi aljabar Boolean standar internasional, untuk pemula sebelum masuk ke card circuit manapun. WAJIB tampil sebagai card PERTAMA (paling atas) di halaman Logic Gates Circuit, sebelum Card 01 dst.

- Nomor: `0`. Tier: **TUTORIAL** (lihat 3.2).
- Judul: "Simbol Boolean" (atau serupa).
- Isi: daftar/grid 7 baris, satu per gate (NOT, AND, NAND, OR, NOR, XOR, XNOR — urutan sama seperti tabel warna di 1.5), tiap baris berisi: nama gate + notasi simbolnya + warna tema gate itu (dari tabel 1.5).

### 2.1 Notasi 7 Simbol Boolean (baku, jangan diubah tanpa persetujuan)
| Gate | Notasi | Cara render |
|---|---|---|
| NOT | Ā | teks "A" + `<line>` overline manual (pola sama seperti label sinyal ternegasi di Circuit Card 01/02) |
| AND | A · B | teks biasa, titik tengah (middle dot, U+00B7) — aman lintas font |
| NAND | garis di atas "A·B" | teks "A·B" + `<line>` overline manual selebar seluruh teks |
| OR | A + B | teks biasa, tanda plus — aman lintas font |
| NOR | garis di atas "A+B" | teks "A+B" + `<line>` overline manual selebar seluruh teks |
| XOR | A ⊕ B | simbol ⊕ **WAJIB digambar manual pakai SVG** (lingkaran kecil + garis silang di dalamnya) — JANGAN pakai karakter Unicode ⊕, karena font Orbitron kemungkinan tidak punya glyph ini (risiko "tofu box"/kotak kosong) |
| XNOR | garis di atas "A⊕B" | sama seperti XOR (⊕ digambar manual) + `<line>` overline manual selebar seluruh notasi |

**Prinsip:** SEMUA notasi negasi (garis di atas) WAJIB pakai teknik `<line>` SVG manual, TIDAK PERNAH pakai karakter Unicode combining overline — pelajaran dari revisi Circuit Card 01, supaya konsisten lintas font/browser.

---

## 3. SPESIFIKASI "LOGIC GATES CIRCUIT"

Gabungan beberapa gate dari "7 Basic Logic Gates" disambung jadi satu rangkaian (output gate 1 -> input gate 2, dst). Semua sistem visual & interaktif di Bagian 1 di atas dipertahankan 100% persis — bedanya sekarang gate-nya lebih dari satu dan saling terhubung dalam satu card. Wire antar gate yang tidak sejajar (beda posisi Y) WAJIB dirutekan siku-siku (right-angle/Manhattan path), BUKAN garis diagonal.

### 3.1 Struktur card Circuit
- Pojok kiri: nomor urut card.
- Pojok kanan: badge TIER (lihat 3.2).
- Judul: nama rangkaian deskriptif.
- Deskripsi: 2-4 kalimat (lebih panjang dari card gate tunggal, karena lebih kompleks).
- Diagram sirkuit: gate saling terhubung, bentuk & wire sesuai standar Bagian 1.3, neon glow ikut tema tiap gate, wire siku-siku kalau perlu belok.
- Truth table: jumlah kolom input menyesuaikan jumlah input asli rangkaian (2^n baris untuk n input), highlight tetap dinamis real-time.

### 3.2 Sistem TIER (badge, reusable untuk semua card Circuit)

> **UPDATE (keputusan langsung user):** label tier "MUDAH" diganti jadi **"EASY"** (Inggris, konsisten sama NORMAL/HARD/INSANE yang sudah Inggris), warna badge-nya jadi hijau (`rgba(34,197,94,...)`, teks `#86efac`). Tier baru **COMPLEX** ditambahkan (warna abu terang/putih, efek kilat/lightning berputar) — disiapkan di sistem filter, belum dipakai card manapun, kemungkinan untuk tier di atas Insane nanti.

| Tier | Styling |
|---|---|
| TUTORIAL | Silver/abu mengkilap (gradient halus abu muda-putih-abu muda, `#94a3b8` ke `#e2e8f0`), efek shimmer PELAN & HALUS (bukan warna-warni seperti Hard/Insane — tetap monokrom abu). Khusus untuk card referensi/edukasi non-interaktif (bukan bagian progresi kesulitan gate biasa). |
| EASY (dulu "MUDAH") | Warna hijau (`rgba(34,197,94,0.18)` bg, `#86efac` teks), border flat, tanpa glow berlebihan |
| NORMAL | Warna terang/vivid (kuning `#facc15`), glow neon standar |
| HARD | Warna pink/merah (`#E30B5D`/`#fda4af`), badge shimmer sweep 3s |
| INSANE | Ungu (`#8B5CF6`/`#D946EF`), efek "crack"/retak animasi + flash shimmer, kesan premium |
| COMPLEX | Abu terang/putih (`#94a3b8`/`#e2e8f0`), efek lightning berputar (conic-gradient animasi rotasi) — DISIAPKAN, belum ada card yang pakai |

### 3.3 Sistem Pencarian & Registrasi Card (WAJIB diikuti untuk SETIAP card baru)

Halaman Logic Gates Circuit punya search bar (cari nama/nomor) + filter tombol tier, didukung array registry `ALL_CARDS` di `src/pages/LogicGatesCircuit.jsx`. **Setiap kali membuat card Circuit baru, WAJIB tambahkan entrinya ke `ALL_CARDS`** dengan format: `{ num: '<nomor 2 digit>', name: '<judul card>', tier: '<EASY|NORMAL|HARD|INSANE|COMPLEX|TUTORIAL>', el: <ComponentCard> }`. Tanpa ini, card baru TIDAK akan muncul di hasil pencarian/filter walau komponennya sudah dirender di halaman.

### 3.4 Layout MULTI-OUTPUT (2 output) — DISETUJUI RETROAKTIF dari implementasi Card 06 "Half Adder"

Untuk rangkaian dengan lebih dari 1 output (misal Half Adder: SUM & CARRY), pola berikut jadi acuan baku:

- Input di-fan-out (bercabang) dari satu titik junction ke masing-masing gate secara paralel — BUKAN dirutekan berurutan/seri. Tiap cabang tetap wire solid siku-siku (right-angle), tidak boleh dashed.
- Kedua gate ditata bertumpuk vertikal (gate 1 di atas, gate 2 di bawah), masing-masing dengan output node & label sendiri (misal "SUM" di atas, "CARRY" di bawah) — BUKAN digabung jadi 1 output node.
- `svgW` dihitung dari POSISI OUTPUT PALING JAUH di antara semua output node: `svgW = Math.max(...semua outX) + outNodeR + 20` — bukan cuma dari 1 output seperti card single-output.
- `svgH` diperbesar secukupnya supaya 2 baris gate + wire-nya muat tanpa berhimpitan.
- Truth table: jumlah kolom OUTPUT menyesuaikan (2 kolom untuk 2 output), tetap 2^n baris untuk n input, highlight tetap dinamis berdasarkan kombinasi input (bukan output).
- Card wrapper (nomor+dot+judul+badge tier, deskripsi, style card) TETAP SAMA PERSIS seperti card single-output — yang beda HANYA jumlah output di diagram & truth table, BUKAN keseluruhan gaya card.
