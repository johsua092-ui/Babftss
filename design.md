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

### 3.0 ATURAN ROUTING KABEL — DILARANG OVERLAY (LAHIR DARI INSIDEN CARD 11)

> Aturan ini berlaku untuk **SEMUA** card Circuit tanpa kecuali — Card 00 sampai card terakhir di masa depan.

**DILARANG KERAS:** 2+ kabel/wire yang **overlap total** (menimpa di segmen yang sama arah — horizontal di Y yang sama dengan range X yang tumpang tindih, atau vertikal di X yang sama dengan range Y yang tumpang tindih). Overlap membuat kabel tidak terlihat & membingungkan pemula.

**Yang BOLEH:** silangan perpendicular (kabel horizontal menyeberang kabel vertikal, atau sebaliknya) — ini normal di diagram rangkaian dan bisa dibedakan secara visual.

**Cara mencegah overlap:**
1. **Route kabel di lane/channel X yang berbeda** — setiap grup kabel yang sejajar harus punya koordinat X unik untuk segmen horizontalnya, atau koordinat Y unik untuk segmen vertikalnya. Contoh: kabel data (D0-D3) di lane X=160, bus seleksi (S0', S1', S0, S1) di lane X=185/205/225/245 — tidak ada yang berbagi range X di Y yang sama.
2. **Kalau ruang horizontal kurang, BESARKAN RANGKAIAN KE BAWAH.** Arah samping (X) punya batas lebar layar, tapi arah bawah (Y) itu **UNLIMITED** — SVG viewBox bisa diperbesar sesuka hati. JANGAN pernah berkata "tidak cukup ruang" — kalau mentok ke samping, kasih spacing lebih ke bawah. Contoh: Card 11 (4:1 Mux) awalnya D inputs cuma 45px terpisah, diperbesar jadi 85px+ dan svgH naik dari 295 ke 530, sehingga setiap AND gate punya ruang sendiri.
3. **Warna berbeda BUKAN jaminan kabel terlihat** — walau 2 kabel overlap punya warna beda, kabel yang di bawah tetap tidak terlihat jelas. Warna berbeda itu bonus, BUKAN solusi overlap.

### 3.1 Struktur card Circuit
- Pojok kiri: nomor urut card.
- Pojok kanan: `<HeartButton />` (fitur "My Favorite Circuit", akan datang) SEJAJAR bersebelahan dengan badge TIER (lihat 3.2) — WAJIB ada di SETIAP card, tanpa kecuali, termasuk semua card baru ke depannya. Reuse `HeartButton.jsx` yang sudah ada (dipanggil tanpa props tambahan, `<HeartButton />` saja — komponennya sendiri yang urus konteks/identitas item via `FavoritesContext`).
- Judul: nama rangkaian deskriptif.
- Deskripsi: 2-4 kalimat (lebih panjang dari card gate tunggal, karena lebih kompleks).
- Diagram sirkuit: gate saling terhubung, bentuk & wire sesuai standar Bagian 1.3, neon glow ikut tema tiap gate, wire siku-siku kalau perlu belok.
- Truth table: jumlah kolom input menyesuaikan jumlah input asli rangkaian (2^n baris untuk n input), highlight tetap dinamis real-time.

### 3.1.1 DUA FORMAT TABEL KEBENARAN (WAJIB DIPATUHI)

Ada 2 format truth table, pemilihannya **berdasarkan jenis rangkaian**:

**Format 1 — Normal (2^n baris penuh):** Dipakai untuk rangkaian **biasa** (NOT→AND, Half Adder, Full Adder, XOR dari gate dasar, dsb). Semua kolom input ditampilkan lengkap, setiap baris adalah kombinasi unik semua input. Highlight: SATU baris kuning yang cocok dengan kombinasi input saat ini.

**Format 2 — Ringkas (satu baris per kombinasi select):** **HANYA** untuk rangkaian yang punya sinyal SELECT/KONTROL yang memilih jalur data (Multiplexer, Demultiplexer, dan rangkaian data-routing serupa). Kolom D tidak ditampilkan sebagai kolom terpisah — malah ditampilkan sebagai nilai dinamis di kolom Y (misal `D0=1`). Jumlah baris = 2^s (s = jumlah bit select), BUKAN 2^n (n = total input).
  - **Highlight kuning:** baris yang cocok dengan kombinasi SELECT saat ini (bergerak kalau user toggle S)
  - **Highlight hijau (di kolom Y):** muncul di baris MANAPUN yang D-nya bernilai 1, menggunakan `<span>` di dalam `<td>` dengan padding lebih kecil dari sel agar terlihat seperti kotak kecil di dalam baris. Jika semua D=0, hijau tidak muncul sama sekali.
  - **Contoh:** Card 10 (2:1 Mux, 2 baris: S=0→Y=D0, S=1→Y=D1) dan Card 11 (4:1 Mux, 4 baris: S1S0=00→D0, 01→D1, 10→D2, 11→D3).

**DILARANG:** menggunakan Format 2 (ringkas) untuk rangkaian biasa yang TIDAK punya mekanisme select/data-routing.

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

---

### 3.5 REGULASI WARNA KABEL (MUTLAK — DILARANG DILANGGAR)

> **Status: KEPUTUSAN FINAL, sudah disepakati user & diverifikasi lewat Card 15 (4:1 Demux).** Aturan ini berlaku untuk **SEMUA** card Circuit (Card 01 sampai card terakhir di masa depan) tanpa kecuali. Setiap kali membuat atau memodifikasi card Circuit, AI WAJIB mematuhi regulasi ini — **pelanggaran dianggap bug kritis.**

#### 3.5.1 Latar Belakang & Mengapa Aturan Ini Ada

Di Card 15 (4:1 Demux), setiap gerbang AND3 punya 3 input: D (data), S1/S1' (select bit 1), dan S0/S0' (select bit 0). Awalnya, **semua** kabel yang masuk ke gerbang AND berwarna hijau — sama dengan kabel D. Akibatnya, pemula tidak bisa membedakan mana kabel D, mana kabel S0, mana kabel S1 saat memasuki gerbang. Mereka hanya melihat tiga kabel hijau identik yang masuk ke tiap AND, tanpa bisa mengikuti "jalur" sinyal mana yang berasal dari mana.

Melalui iterasi perbaikan bertahap (melibatkan feedback visual langsung dari user), ditetapkanlah sistem warna kabel berikut yang **WAJIB** dipatuhi di semua card Circuit.

#### 3.5.2 Enam Prinsip Warna Kabel

**PRINSIP 1 — Hak Hijau untuk Input Pertama**

Input pertama di suatu card (biasanya D / data) mendapat **hak eksklusif** atas warna **hijau (`#4ade80`)**. Warna hijau ini melekat pada sinyal data dari tombol input, sepanjang trunk/fan-out-nya, cabang-cabangnya yang masuk ke gerbang, output gerbang terakhir, hingga output node. Seluruh jalur data "dari awal sampai akhir" berwarna hijau.

> **Kenapa:** Input pertama adalah sinyal utama yang "ditransmisikan" atau "diproses" oleh rangkaian. Warnanya paling dominan karena dialah subjek rangkaian — sinyal seleksi hanya mengatur ke mana sinyal ini pergi.

**PRINSIP 2 — Warna Mutlak NOT: Merah (`#f87171`), DENGAN PENGECEUALIAN Multi-NOT (lihat 3.5.8)**

Output gerbang NOT **SELALU** berwarna **merah (`#f87171`)** — ini adalah warna mutlak yang merepresentasikan negasi (inversi). Tidak ada kompromi, tidak ada pengecualian. Kabel dari titik output NOT (setelah bubble) sampai ke bus/trunk distribusinya harus merah.

> **Kenapa:** Merah adalah warna peringatan universal. Ketika pemula melihat kabel merah, mereka langsung tahu: "ini sinyal yang sudah di-NEGASI/DIBALIK." Ini konsisten dengan warna tema gate NOT di bagian 1.5.
>
> **Pengecualian:** Jika rangkaian memiliki **lebih dari 1 gerbang NOT**, lihat **Bagian 3.5.8 (Aturan Multi-NOT)** — NOT pertama tetap merah, NOT tambahan mendapat warna unik sendiri.

**PRINSIP 3 — Transisi Warna: NOT ke Gerbang = Hijau**

Ketika kabel dari output NOT (warna NOT — lihat Prinsip 2 & 3.5.8) bercabang dan **memasuki input gerbang lain** (misalnya AND), kabel branch tersebut **berubah menjadi hijau (`#4ade80`)**. Jadi alur warnanya: warna_NOT di bus/trunk NOT, lalu **beralih ke hijau** di percabangan yang masuk ke gerbang.

> **Kenapa:** Di titik masuk gerbang, warna kabel berfungsi sebagai penanda "ini input gerbang" — bukan "ini output NOT." Dengan berubah hijau, kabel tersebut menyatu secara visual dengan kabel input lainnya (yang juga hijau), menandakan bahwa di dalam gerbang, semua input diperlakukan setara. Kabel warna_NOT HANYA untuk perjalanan di luar gerbang (distribusi sinyal ternegasi), BUKAN untuk jalur masuk gerbang.

**PRINSIP 4 — Setiap Input Seleksi/Kontrol Punya Warna Unik**

Setiap input seleksi/kontrol (S0, S1, S2, dst.) **WAJIB** punya warna yang **UNIK** — berbeda dari hijau (sudah diambil input pertama), berbeda dari merah (sudah diambil NOT), dan **berbeda satu sama lain** (S0 tidak boleh sama dengan S1, S1 tidak boleh sama dengan S2, dst.).

> **Kenapa:** Pemula perlu bisa mengikuti "jalur" tiap sinyal seleksi secara visual. Kalau S0 dan S1 warnanya sama, mereka tidak bisa membedakan kabel mana yang mengontrol apa.

**PRINSIP 5 — Konsistensi Warna Sepanjang Jalur Sinyal**

Warna sinyal seleksi harus **KONSISTEN dari awal sampai akhir jalurnya** — mulai dari warna tombol input, kabel dari input ke junction, kabel dari junction ke bus langsung, trunk bus, sampai cabang yang masuk ke gerbang. Tidak boleh berubah di tengah jalan. Satu sinyal = satu warna sepanjang perjalanannya.

> **Kenapa:** Kalau warna berubah di tengah jalan, pemula akan kehilangan jejak sinyal tersebut dan bingung "ini kabel yang sama atau beda?"

**PRINSIP 6 — Output Gerbang Terakhir = Hijau**

Kabel output dari gerbang terakhir (biasanya AND, bisa juga OR atau gate lain tergantung rangkaian) dan node output selalu berwarna **hijau (`#4ade80`)**, konsisten dengan warna input pertama.

> **Kenapa:** Output rangkaian adalah "hasil akhir" dari pemrosesan sinyal data. Warnanya mengikuti warna data (input pertama) karena output pada dasarnya adalah versi data yang sudah difilter/diproses.

#### 3.5.3 Palet Warna Resmi

**Warna tetap (TIDAK BOLEH diambil oleh sinyal lain):**

| Warna | Hex | Pemilik | Keterangan |
|-------|-----|---------|------------|
| Hijau | `#4ade80` | Input pertama (D) + output gerbang + branch NOT-ke-gerbang | Hak eksklusif data path |
| Merah | `#f87171` | Output NOT pertama / NOT tunggal (bus/trunk distribusi negasi) | Hak mutlak negasi NOT #1 (lihat 3.5.8 untuk multi-NOT) |

**Palet warna NOT tambahan (hanya dipakai jika rangkaian punya >1 NOT, lihat 3.5.8):**

| NOT ke- | Warna | Hex | Dipakai di |
|---------|-------|-----|----------|
| NOT #2 | Pink | `#f472b6` | Card 16 (NOT S1), Card 11 (NOT S1), Card 15 (NOT S1) |
| NOT #3 | Teal | `#2dd4bf` | Card 16 (NOT S2), Card 12 (NOT S2) |
| NOT #4+ | (pilih dari daftar cadangan bawah) | — | Cadangan; Rose `#fb7185` dipakai Card 12/13 (NOT S1), Fuchsia `#d946ef` dipakai Card 13 (NOT S2), Purple `#c084fc` dipakai Card 13 (NOT S3) |

**Palet warna untuk sinyal seleksi/kontrol (S0, S1, S2, ...):**

| Sinyal | Warna | Hex | Status |
|--------|-------|-----|--------|
| S0 | Cyan | `#22d3ee` | Aktif, sudah dipakai Card 15 |
| S1 | Orange | `#fb923c` | Aktif, sudah dipakai Card 15 |
| S2 | Ungu | `#a78bfa` | Cadangan |
| S3 | (pilih dari cadangan) | (lihat bawah) | Cadangan |
| S4+ | (pilih dari daftar cadangan) | (lihat bawah) | Cadangan |

**Daftar cadangan warna tambahan (kalau S3+/NOT#4+ dibutuhkan di masa depan):**
- Kuning/emas: `#facc15`
- Biru muda: `#60a5fa`
- Rose/coral: `#fb7185`
- Lime: `#a3e635`
- Fuchsia: `#d946ef`
- Sky: `#38bdf8`

> **Aturan pemilihan warna cadangan:** Pilih warna yang **secara visual mudah dibedakan** dari hijau, merah, DAN dari semua warna seleksi dan NOT yang sudah dipakai di card tersebut. Jangan memilih warna yang terlalu mirip satu sama lain (misalnya cyan `#22d3ee` dan teal `#2dd4bf` terlalu mirip — tidak boleh keduanya aktif di card yang sama). Perhatikan juga bahwa pink (`#f472b6`) dan teal (`#2dd4bf`) sudah dialokasikan untuk NOT tambahan.

#### 3.5.4 Ringkasan Visual — Alur Warna di Contoh Card 15 (4:1 Demux)

```
  INPUT PERTAMA (D):  [Tombol hijau] --hijau--> [trunk hijau] --hijau--> [branch hijau] --> [AND input]

  INPUT SELEKSI (S0):  [Tombol cyan] --cyan--> [junction] --cyan--> [bus cyan] --cyan--> [AND input]
  INPUT SELEKSI (S1):  [Tombol orange] --orange--> [junction] --orange--> [bus orange] --orange--> [AND input]

  OUTPUT NOT (S0'):    [NOT gate] --merah--> [bus merah] --hijau--> [AND input]
  OUTPUT NOT (S1'):    [NOT gate] --merah--> [bus merah] --hijau--> [AND input]

  OUTPUT GERBANG:      [AND gate] --hijau--> [node output hijau]
```

Perhatikan transisi merah→hijau pada kabel NOT yang masuk ke gerbang (Prinsip 3).

#### 3.5.5 Penerapan ke Card Lain

- **Card sederhana (2 input, tanpa seleksi):** Input pertama (A) = hijau, input kedua (B) bisa hijau juga (karena tidak ada sinyal seleksi yang perlu dibedakan). Kalau B melewati NOT, maka: B→NOT = merah, NOT→gerbang = hijau.
- **Card dengan seleksi (Mux/Demux):** Input data = hijau, setiap S = warna unik dari palet 3.5.3, NOT output = merah di bus lalu hijau di branch masuk gerbang.
- **Card kompleks (multi-level):** Prinsip yang sama berlaku di setiap level. Warna sinyal tetap konsisten sepanjang jalurnya, tidak peduli berapa kali melewati gate atau berapa level rangkaiannya.

#### 3.5.6 Larangan Mutlak

1. **DILARANG** menggunakan hijau (`#4ade80`) untuk kabel sinyal seleksi/kontrol (S0, S1, dst.) — hijau adalah hak eksklusif input pertama.
2. **DILARANG** menggunakan merah (`#f87171`) untuk kabel selain output NOT pertama — merah adalah hak mutlak negasi NOT pertama. NOT tambahan menggunakan warna sendiri sesuai 3.5.8.
3. **DILARANG** memberikan warna yang sama (atah terlalu mirip) kepada dua sinyal seleksi yang berbeda di card yang sama.
4. **DILARANG** mengubah warna sinyal seleksi di tengah jalurnya — satu sinyal, satu warna, dari awal sampai akhir.
5. **DILARANG** menggunakan warna merah untuk kabel branch yang masuk ke gerbang lain — di titik itu kabel HARUS hijau (Prinsip 3).
6. **DILARANG** mengabaikan regulasi ini dengan alasan "card ini sederhana jadi tidak perlu" atau "supaya lebih minimalis" — regulasi ini berlaku untuk SEMUA card tanpa kecuali.

#### 3.5.7 Klarifikasi Kasus Khusus (tambahan Claude — mengisi celah yang belum tercakup 3.5.1-3.5.6)

**Kasus A — NOT sebagai gerbang TERAKHIR dalam rangkaian (bukan gerbang tengah):**
Prinsip 2 bilang output NOT SELALU merah tanpa kompromi; Prinsip 6 bilang output gerbang terakhir SELALU hijau. Ini kontradiksi kalau NOT kebetulan jadi gerbang paling akhir (contoh: card yang alurnya `... -> NOT -> OUTPUT`, TIDAK ada gerbang lain sesudah NOT). **Resolusi:** Prinsip 2 berlaku untuk kabel NOT yang menuju gerbang LAIN (trunk distribusi). Kalau output NOT itu LANGSUNG menuju node output rangkaian (tidak masuk gerbang lain lagi), berlaku transisi yang sama seperti Prinsip 3: merah di badan NOT, lalu **hijau** tepat di kabel pendek menuju node output — konsisten dengan semangat "output akhir = hijau" di Prinsip 6. *(Catatan: kasus ini tidak mempengaruhi Card 01-13 yang sudah terkunci — cuma relevan kalau ada card BARU di masa depan yang polanya berakhir di NOT.)*

**Kasus B — Card tanpa "input pertama" yang jelas (misal rangkaian arah Mux: banyak data -> 1 output):**
Prinsip 1 mengasumsikan ada SATU sinyal data utama. Di rangkaian arah Mux (Card 09-13, dibangun SEBELUM regulasi ini ada), semua Dx setara, tidak ada "input pertama" tunggal — jadi Prinsip 1 secara harfiah tidak berlaku bersih di situ. **Resolusi:** Card 09-13 DIKECUALIKAN dari regulasi ini (sudah terkunci final, lihat Bagian 11 `memory.md`, TIDAK PERLU/BOLEH direvisi demi kepatuhan warna). Untuk card BARU di masa depan yang punya pola serupa (banyak sumber -> 1 tujuan, tanpa satu "input utama" jelas), regulasi warna kabel versi 3.5 ini TIDAK otomatis berlaku secara harfiah — kalau situasi itu muncul, desain warnanya didiskusikan dulu sebagai kasus baru, jangan dipaksakan ikut Prinsip 1.

#### 3.5.8 Aturan Multi-NOT — Setiap NOT Punya Warna Berbeda (LAHIR DARI FEEDBACK PEMULA Card 16)

**Latar Belakang:**
Pemula mengeluh bahwa saat rangkaian memiliki lebih dari 1 gerbang NOT, semua output NOT berwarna merah sama — membuat mereka tidak bisa membedakan jalur NOT mana menuju mana. Mereka secara eksplisit meminta: "entah bagaimana caranya, jika kabel NOT lebih dari 1, wajib beda warnanya." Masukan ini diterima karena sangat masuk akal untuk tujuan edukasi.

**Aturan:**

1. **NOT tunggal (card hanya punya 1 NOT):** Tetap merah (`#f87171`) sesuai Prinsip 2. Tidak ada perubahan.

2. **NOT pertama (card punya >1 NOT):** Tetap merah (`#f87171`). Merah selalu ada di rangkaian multi-NOT, milik NOT yang pertama.

3. **NOT tambahan (NOT ke-2, ke-3, dst.):** Masing-masing mendapat warna unik dari **Palet Warna NOT Tambahan** (lihat tabel di 3.5.3). Warna-warna ini:
   - **TIDAK BOLEH** sama dengan warna sinyal lain di card tersebut (hijau, warna seleksi S0/S1/S2/dst., atau warna NOT lain)
   - **TIDAK BOLEH** terlalu mirip secara visual dengan warna kabel lain
   - **TIDAK BOLEH** menggunakan warna yang sudah dialokasikan (merah = NOT #1, hijau = data path, palet seleksi)

4. **Prinsip 3 tetap berlaku:** Branch dari NOT (warna apapun) yang masuk ke gerbang lain **TETAP berubah hijau** di titik masuk gerbang. Jadi alurnya: warna_NOT di bus/trunk, lalu hijau di branch masuk gerbang.

5. **Urutan penomoran NOT:** NOT #1 = NOT pertama berdasarkan urutan sinyal (biasanya S0 NOT = NOT #1, S1 NOT = NOT #2, dst.) atau berdasarkan posisi atas-bawah di diagram.

6. **Warna NOT konsisten:** Setiap NOT mempertahankan warnanya di SELURUH jalur — badan gate NOT, kabel output, bus/trunk distribusi, dan label overline. Sama seperti Prinsip 5 untuk sinyal seleksi.

**Contoh penerapan — Card 16 (8:1 Demux, 3 NOT):**

```
  NOT S0 (NOT #1): [Gate merah] --merah--> [bus merah] --hijau--> [AND input]     (merah = #f87171)
  NOT S1 (NOT #2): [Gate pink] --pink-->  [bus pink]  --hijau--> [AND input]     (pink  = #f472b6)
  NOT S2 (NOT #3): [Gate teal] --teal-->  [bus teal]  --hijau--> [AND input]     (teal  = #2dd4bf)
```

Pemula sekarang bisa langsung melihat: "kabel merah dari NOT S0, kabel pink dari NOT S1, kabel teal dari NOT S2" — masing-masing terlacak dengan jelas.

> **Catatan retroaktif:** Aturan ini awalnya diterapkan mulai Card 16 saja. Setelah menerima feedback pemula bahwa rangkaian Card 11, 12, 13, 15 (yang memiliki >1 NOT) juga sulit dilacak, aturan ini diterapkan secara retroaktif ke card-card tersebut. Pemilihan warna disesuaikan per-card untuk menghindari konflik dengan warna D/sinyal yang sudah ada di card tersebut.

**Tabel penerapan multi-NOT per card:**

| Card | Rangkaian | Jumlah NOT | NOT #1 (S0) | NOT #2 (S1) | NOT #3 (S2) | NOT #4 (S3) | Catatan |
|------|-----------|-----------|-------------|-------------|-------------|-------------|--------|
| 11 | 4:1 Mux | 2 | Merah `#f87171` | Pink `#f472b6` | — | — | |
| 12 | 8:1 Mux | 3 | Merah `#f87171` | Fuchsia `#d946ef` | Teal `#2dd4bf` | — | Pink konflik D4, rose terlalu mirip merah |
| 13 | 16:1 Mux | 4 | Merah `#f87171` | Teal `#2dd4bf` | Fuchsia `#d946ef` | Purple `#c084fc` | Rose terlalu mirip merah, teal beda konteks dari D15 |
| 15 | 4:1 Demux | 2 | Merah `#f87171` | Pink `#f472b6` | — | — | |
| 16 | 8:1 Demux | 3 | Merah `#f87171` | Pink `#f472b6` | Teal `#2dd4bf` | — | Referensi awal |
| 17 | 16:1 Demux | 4 | Merah `#f87171` | Pink `#f472b6` | Teal `#2dd4bf` | Fuchsia `#d946ef` | S3=lime `#a3e635` |

---

## 4. SISTEM GLOW NAVIGASI CARD: AURORA GREEN (ATURAN MUTLAK, BERLAKU KE SEMUA FITUR)

> **Status: MUTLAK ABSOLUT.** Aturan ini berlaku ke SETIAP fitur navigasi card di seluruh proyek — tidak terbatas pada halaman Logic Gates Circuit saja. Setiap kali ada komponen kotak/card yang memiliki tombol "click me" atau mekanisme navigasi serupa (klik komponen A di halaman X lalu di-scroll ke card asal di halaman Y), efek glow pada card tujuan **WAJIB** mengikuti spesifikasi ini **PERSIS**. Tidak boleh ditafsirkan, dimodifikasi, atau diganti tanpa persetujuan eksplisit dari user.

### 4.1 Deskripsi Sistem

Ketika user mengklik elemen navigasi (misalnya tombol "Click Me" pada IC Block Reference di halaman Full Adder 4-bit), sistem akan:
1. Meng-scroll otomatis ke card tujuan (menggunakan `scrollIntoView({ behavior: 'smooth', block: 'center' })`).
2. Menerapkan efek glow aurora green berdenyut pada card tujuan (class `ic-highlighted-card`).
3. Efek hilang saat user mengklik di mana saja di luar card (document click listener).

### 4.2 Spesifikasi Glow — CSS Keyframe Lengkap (COPY-PASTE THIS EXACTLY)

**Nama class:** `ic-highlighted-card`

**CSS exa

---

## 4. SISTEM GLOW NAVIGASI CARD: AURORA GREEN (ATURAN MUTLAK, BERLAKU KE SEMUA FITUR)

> **Status: MUTLAK ABSOLUT.** Aturan ini berlaku ke SETIAP fitur navigasi card di seluruh proyek — tidak terbatas pada halaman Logic Gates Circuit saja. Setiap kali ada komponen kotak/card yang memiliki tombol "click me" atau mekanisme navigasi serupa (klik komponen A di halaman X lalu di-scroll ke card asal di halaman Y), efek glow pada card tujuan **WAJIB** mengikuti spesifikasi ini **PERSIS**. Tidak boleh ditafsirkan, dimodifikasi, atau diganti tanpa persetujuan eksplisit dari user.

### 4.1 Deskripsi Sistem

Ketika user mengklik elemen navigasi (misalnya tombol "Click Me" pada IC Block Reference di halaman Full Adder 4-bit), sistem akan:
1. Meng-scroll otomatis ke card tujuan (menggunakan `scrollIntoView({ behavior: 'smooth', block: 'center' })`).
2. Menerapkan efek glow aurora green berdenyut pada card tujuan (class `ic-highlighted-card`).
3. Efek hilang saat user mengklik di mana saja di luar card (document click listener).

### 4.2 Spesifikasi Glow — CSS Lengkap (WAJIB COPY-PASTE PERSIS)

**Nama class:** `ic-highlighted-card`

**CSS exact (copy-paste ini persis, JANGAN dimodifikasi):**

```css
@keyframes ic-pulse-glow {
    0%    { box-shadow: 0 0 6px  rgba(0,255,136,0.05), 0 0 14px rgba(0,255,136,0.02), 0 0 26px rgba(0,255,136,0.01), inset 0 0 3px rgba(0,255,136,0.01); outline-color: rgba(0,255,136,0.08); }
    8.3%  { box-shadow: 0 0 8px  rgba(3,255,137,0.09), 0 0 18px rgba(3,255,137,0.04), 0 0 32px rgba(3,255,137,0.018), inset 0 0 4px rgba(3,255,137,0.018); outline-color: rgba(3,255,137,0.13); }
    16.6% { box-shadow: 0 0 10px rgba(6,255,138,0.13), 0 0 22px rgba(6,255,138,0.06), 0 0 38px rgba(6,255,138,0.026), inset 0 0 5px rgba(6,255,138,0.026); outline-color: rgba(6,255,138,0.2); }
    25%   { box-shadow: 0 0 12px rgba(10,255,141,0.18), 0 0 27px rgba(10,255,141,0.09), 0 0 44px rgba(10,255,141,0.035), inset 0 0 6px rgba(10,255,141,0.035); outline-color: rgba(10,255,141,0.28); }
    33.3% { box-shadow: 0 0 14px rgba(15,255,145,0.24), 0 0 32px rgba(15,255,145,0.12), 0 0 50px rgba(15,255,145,0.048), inset 0 0 7px rgba(15,255,145,0.048); outline-color: rgba(15,255,145,0.37); }
    41.6% { box-shadow: 0 0 17px rgba(22,255,152,0.32), 0 0 38px rgba(22,255,152,0.16), 0 0 58px rgba(22,255,152,0.065), inset 0 0 9px rgba(22,255,152,0.065); outline-color: rgba(22,255,152,0.48); }
    50%   { box-shadow: 0 0 20px rgba(30,255,160,0.42), 0 0 44px rgba(30,255,160,0.2),  0 0 68px rgba(30,255,160,0.08),  inset 0 0 11px rgba(30,255,160,0.08); outline-color: rgba(30,255,160,0.6); }
    58.3% { box-shadow: 0 0 17px rgba(22,255,152,0.32), 0 0 38px rgba(22,255,152,0.16), 0 0 58px rgba(22,255,152,0.065), inset 0 0 9px rgba(22,255,152,0.065); outline-color: rgba(22,255,152,0.48); }
    66.6% { box-shadow: 0 0 14px rgba(15,255,145,0.24), 0 0 32px rgba(15,255,145,0.12), 0 0 50px rgba(15,255,145,0.048), inset 0 0 7px rgba(15,255,145,0.048); outline-color: rgba(15,255,145,0.37); }
    75%   { box-shadow: 0 0 12px rgba(10,255,141,0.18), 0 0 27px rgba(10,255,141,0.09), 0 0 44px rgba(10,255,141,0.035), inset 0 0 6px rgba(10,255,141,0.035); outline-color: rgba(10,255,141,0.28); }
    83.3% { box-shadow: 0 0 10px rgba(6,255,138,0.13), 0 0 22px rgba(6,255,138,0.06), 0 0 38px rgba(6,255,138,0.026), inset 0 0 5px rgba(6,255,138,0.026); outline-color: rgba(6,255,138,0.2); }
    91.6% { box-shadow: 0 0 8px  rgba(3,255,137,0.09), 0 0 18px rgba(3,255,137,0.04), 0 0 32px rgba(3,255,137,0.018), inset 0 0 4px rgba(3,255,137,0.018); outline-color: rgba(3,255,137,0.13); }
    100%  { box-shadow: 0 0 6px  rgba(0,255,136,0.05), 0 0 14px rgba(0,255,136,0.02), 0 0 26px rgba(0,255,136,0.01), inset 0 0 3px rgba(0,255,136,0.01); outline-color: rgba(0,255,136,0.08); }
}
.ic-highlighted-card {
    outline: 2px solid rgba(0,255,136,0.2);
    outline-offset: 3px;
    border-radius: 18px;
    animation: ic-pulse-glow 1.4s ease-in-out infinite;
    will-change: box-shadow, outline-color;
}
```

### 4.3 Parameter Teknis (JANGAN DIUBAH)

| Parameter | Nilai | Keterangan |
|-----------|-------|------------|
| **Warna dasar** | `rgb(0,255,136)` (aurora green) | Hue aurora hijau kutub. JANGAN ganti ke warna lain (putih, biru, kuning, dll). |
| **Hue shift** | `0 -> 30` pada channel G (255->160) | Perpindahan warna halus antara keyframe, memberi kesan "kelap-kelip aurora" |
| **Jumlah keyframe** | 12 titik (0%, 8.3%, 16.6%, 25%, 33.3%, 41.6%, 50%, 58.3%, 66.6%, 75%, 83.3%, 100%) | Simetris: naik 0-50%, turun 50-100%. JANGAN kurangi atau ubah distribusi |
| **Durasi siklus** | `1.4s` | Kecepatan denyut. JANGAN ubah tanpa persetujuan user |
| **Easing** | `ease-in-out` | Transisi halus di kedua ujung |
| **State gelap (0%/100%)** | Shadow terkecil: blur 6/14/26px, opacity 0.05/0.02/0.01, outline 0.08 | Harus TERLIHAT GELAP — inilah yang bikin transisi kelihatan |
| **State terang (50%)** | Shadow terbesar: blur 20/44/68px, opacity 0.42/0.20/0.08, outline 0.60 | Glow moderat, JANGAN extreme (bikin sakit mata) |
| **Dynamic range opacity** | 0.05 -> 0.42 (selisih ~8.4x) | Range besar ini WAJIB dipertahankan supaya transisi terlihat jelas |
| **Outline** | `2px solid rgba(0,255,136,0.2)`, offset `3px` | Border luar tipis yang ikut berdenyut |
| **Border radius** | `18px` | Sesuaikan dengan border radius card container |
| **Inset shadow** | Ada di semua keyframe, ikut denyut | Memberi efek glow dari dalam, bukan hanya luar |
| **will-change** | `box-shadow, outline-color` | WAJIB ada untuk performa rendering |
| **Jumlah layer box-shadow** | 3 outer + 1 inset = 4 total | Semua layer WAJIB ada di SETIAP keyframe — DILARANG ada layer yang muncul/hilang tiba-tiba |

### 4.4 Prinsip Desain Glow

1. **Transisi warna HALUS (smooth):** Perubahan warna antar keyframe mikroskopis (selisih R max 30, G max 24, B max 24). Tidak boleh ada lompatan warna yang terlihat kasat mata.
2. **Transisi glow BESAR (visible):** Perubahan intensity/opacity antara state gelap dan terang HARUS kontras tinggi (min 8x selisih). Ini yang membuat denyutan terlihat jelas.
3. **Konsistensi layer:** Semua layer shadow (3 outer + 1 inset) ada di SETIAP keyframe. Tidak boleh ada layer yang muncul di satu keyframe tapi hilang di keyframe lain — itu menyebabkan efek "kaget".
4. **Pola simetris:** Keyframe 0-50% naik, 50-100% turun (mirror persis). Tidak boleh asimetris.
5. **Bukan dekorasi semata:** Glow ini adalah penanda navigasi fungsional — memberi tahu user "ini card yang kamu tuju". Harus cukup terlihat tapi tidak mengganggu konten card.

### 4.5 Implementasi Teknis (Reuse Pattern)

Sistem ini diimplementasikan menggunakan:
- **`CardNavigationContext.jsx`** — Context React yang menyediakan `highlightedCard` state, `navigateToCard(num)`, dan `clearHighlight()`.
- **Class `ic-highlighted-card`** — Diterapkan pada wrapper div card ketika `highlightedCard === card.num`.
- **Document click listener** — Menghapus highlight saat user klik di mana saja.

**Saat menambahkan fitur navigasi card BARU di halaman manapun:**
1. Wrap halaman dengan `<CardNavigationProvider>`.
2. Gunakan `useCardNavigation()` untuk akses `navigateToCard`.
3. Terapkan class `ic-highlighted-card` pada card yang di-highlight.
4. Copy-paste CSS keyframe persis dari Bagian 4.2.
5. JANGAN buat versi "modifikasi" dari glow ini — pakai PERSIS sama.

### 4.6 Larangan Mutlak

- **DILARANG** mengganti warna glow ke selain aurora green (`rgb(0,255,136)` basis).
- **DILARANG** mengurangi jumlah keyframe dari 12.
- **DILARANG** mempersempit dynamic range (opacity gelap-terang).
- **DILARANG** membuat layer shadow yang muncul/hilang di tengah animasi.
- **DILARANG** mengubah durasi, easing, atau warna tanpa persetujuan eksplisit user.
- **DILARANG** menggunakan glow style yang berbeda untuk fitur navigasi card di halaman lain — konsistensi adalah KENISCAYAAN.