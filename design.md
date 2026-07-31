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

## 2. SPESIFIKASI "LOGIC GATES CIRCUIT"

Gabungan beberapa gate dari "7 Basic Logic Gates" disambung jadi satu rangkaian (output gate 1 -> input gate 2, dst). Semua sistem visual & interaktif di Bagian 1 di atas dipertahankan 100% persis — bedanya sekarang gate-nya lebih dari satu dan saling terhubung dalam satu card. Wire antar gate yang tidak sejajar (beda posisi Y) WAJIB dirutekan siku-siku (right-angle/Manhattan path), BUKAN garis diagonal.

### 2.1 Struktur card Circuit
- Pojok kiri: nomor urut card.
- Pojok kanan: badge TIER (lihat 2.2).
- Judul: nama rangkaian deskriptif.
- Deskripsi: 2-4 kalimat (lebih panjang dari card gate tunggal, karena lebih kompleks).
- Diagram sirkuit: gate saling terhubung, bentuk & wire sesuai standar Bagian 1.3, neon glow ikut tema tiap gate, wire siku-siku kalau perlu belok.
- Truth table: jumlah kolom input menyesuaikan jumlah input asli rangkaian (2^n baris untuk n input), highlight tetap dinamis real-time.

### 2.2 Sistem TIER (badge, reusable untuk semua card Circuit)
| Tier | Styling |
|---|---|
| MUDAH | Warna solid biasa, border flat, tanpa glow berlebihan |
| NORMAL | Warna terang/vivid, glow neon standar |
| HARD | Border gradient RGB (2-3 warna), animasi bergerak pelan |
| INSANE | Border RGB penuh spektrum, animasi cepat + shimmer/kelap-kelip, kesan premium |
