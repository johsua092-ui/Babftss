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

---

## 5. SISTEM NAVIGASI "CLICK ME": CLEAR FILTER SEBELUM NAVIGASI (ATURAN MUTLAK, BERLAKU KE SEMUA FITUR)

> **Status: MUTLAK ABSOLUT.** Aturan ini berlaku ke SETIAP fitur navigasi card di seluruh proyek — tidak terbatas pada halaman Logic Gates Circuit saja. Setiap kali ada komponen kotak/card yang memiliki tombol "click me" atau mekanisme navigasi serupa (klik komponen A lalu di-scroll ke card asal B), **WAJIB** mengikuti perilaku ini.

### 5.1 Deskripsi Perilaku

Ketika user mengklik elemen navigasi ("click me" pada ICBlockRef, atau mekanisme navigasi card serupa di masa depan), sistem **WAJIB** melakukan hal ini secara berurutan:

1. **CLEAR semua filter aktif** — search text, card number input, difficulty tier filter, dan SEMUA filter lainnya yang mungkin ada di halaman tersebut harus di-reset ke keadaan kosong/tidak aktif.
2. **Set highlight** pada card tujuan (state `highlightedCard = targetNum`).
3. **Tunggu render selesai** (setelah filter clear, card tujuan pasti sudah muncul di DOM).
4. **Scroll otomatis** ke card tujuan (`scrollIntoView({ behavior: 'smooth', block: 'center' })`).
5. Terapkan efek **glow aurora green** (Bagian 4) pada card tujuan.

**MENGAPA ini mutlak?** Kalau filter tidak di-clear dulu, card tujuan mungkin tidak muncul (karena difilter), sehingga navigasi gagal secara diam-diam — user bingung karena tidak terjadi apa-apa atau di-scroll ke tempat kosong.

### 5.2 Implementasi Teknis (Reuse Pattern)

**Arsitektur:**
- **`CardNavigationContext.jsx`** menyediakan:
  - `navigateToCard(targetNum)` — fungsi utama navigasi
  - `registerClearFilters(fn)` — dipanggil oleh halaman yang punya filter, mendaftarkan fungsi clear-nya
  - `clearFiltersRef` (internal ref) — menyimpan referensi fungsi clear dari halaman aktif
- **Halaman yang punya filter** (misal `LogicGatesCircuit.jsx`):
  - Menggunakan `useEffect(() => { registerClearFilters(handleClear); }, [...])` untuk mendaftarkan fungsi clear-nya
  - `handleClear` harus mereset SEMUA state filter (query, cardNum, activeTier, dan filter lainnya)
- **`ICBlockRef.jsx`** (atau komponen navigasi serupa):
  - Tetap hanya memanggil `navigateToCard(targetNum)` — tidak perlu tahu soal filter

**Alur eksekusi di `navigateToCard`:**
```
1. isNavigatingRef.current = true  (flag supaya doc click listener gak clear highlight)
2. clearFiltersRef.current()         (clear semua filter di halaman)
3. setHighlightedCard(targetNum)    (set highlight)
4. requestAnimationFrame x2:        (tunggu React render selesai)
   - scrollIntoView ke card target
   - isNavigatingRef.current = false
```

### 5.3 Larangan Mutlak

- **DILARANG** memanggil `navigateToCard` tanpa mekanisme clear filter — navigasi KEWAJIBAN dimulai dengan clear filter dulu.
- **DILARANG** membuat mekanisme navigasi card baru (di halaman manapun) yang tidak mendaftarkan `registerClearFilters`.
- **DILARANG** skip step "tunggu render selesai" — scroll HARUS dilakukan setelah filter clear + React selesai render, bukan sebelumnya. Gunakan `requestAnimationFrame` double-nested.
- **DILARANG** mengubah urutan eksekusi (clear filter harus PERTAMA, sebelum highlight/scroll).
- **DILARANG** memasukkan logika filter-specific ke dalam `CardNavigationContext` atau `ICBlockRef` — context hanya menyimpan ref, halaman yang menentukan apa yang di-clear.

---

## 6. KONVENSI VISUAL UNTUK RANGKAIAN SEKUENSIAL

### 6.1 Notasi Sinyal Inversed: Overline, BUKAN Apostrophe (ATURAN MUTLAK)

Sinyal inversed (negated) di diagram dan card WAJIB ditulis dengan **garis di atas (overline)**, BUKAN apostrophe.

- ❌ `Q'`, `D'`, `PRE'`, `CLR'`
- ✅ `Q̄`, `D̄`, `PRĒ`, `CLR̄` (Q + combining overline U+0304, atau render garis atas)

**Implementasi per medium:**
- **SVG diagram:** render Q text + `<line>` SVG sebagai garis atas. Komponen `OutputNode` punya prop `overline` — set `true` untuk sinyal inversed.
- **HTML (JSX):** `<span style={{ textDecoration: 'overline' }}>Q</span>`
- **String biasa (desc, tooltip):** `Q\u0304` (Unicode combining overline)

Berlaku ke SEMUA sinyal inversed di semua card ke depannya (Q̄, D̄, PRĒ, CLR̄, J̄, K̄, dll).

### 6.2 Label & Font di Diagram SVG

| Elemen | Font | Size | Weight | Catatan |
|--------|------|------|--------|--------|
| Label gate (NOR1, NOR2, dll) | Orbitron | 8px | 700 | Tetap Orbitron untuk identitas komponen |
| Label feedback wire (Q, Q̄) | Inter | 10px | 600 | Inter lebih mudah dibaca untuk karakter tunggal |
| Label output node (di atas lingkaran) | Inter | 9px | 600 | Juga pakai Inter untuk konsistensi |
| Label input node (S, R, A, B) | Orbitron | 8px | normal | Orbitron OK untuk label di dalam kotak |
| Nilai 1/0 di output node | Inter | 12px | 700 | Lihat §6.3 |
| Nilai 1/0 di input node | Orbitron | 11px | bold | Tetap Orbitron, sudah terbukti readable |

### 6.3 Kontras Output Node (ATURAN MUTLAK)

Angka di dalam lingkaran output node HARUS memenuhi kontras tinggi:

- **Saat aktif (val=true, angka 1):** `fill="#fff"` (putih) di atas lingkaran berwarna terang — BUKAN hitam.
- **Saat non-aktif (val=false, angka 0):** `fill="#94a3b8"` (abu terang) di atas lingkaran gelap — BUKAN abu gelap.
- **Font:** Inter 12px weight 700 — BUKAN Orbitron (terlalu tipis untuk digit tunggal).
- **DILARANG** menggunakan `#000` atau warna gelap sebagai fill teks di atas lingkaran glow — kontrasnya terlalu rendah.
---

## 29. SISTEM CLOCK MODE (MANUAL / AUTO) — ATURAN MUTLAK, BERLAKU KE SEMUA CLOCK (SEKARANG & MASA DEPAN)

**Ini adalah fondasi penting. Aturan ini WAJIB diterapkan ke SEMUA tombol clock, baik yang ada sekarang (Card 16 Gated D Latch, Card 17 SR Flip-Flop) MAUPUN yang akan dibuat di masa depan (D Flip-Flop edge-triggered, JK Flip-Flop, T Flip-Flop, Counter, Register, Shift Register, dll). TIDAK ADA pengecualian.**

### 29.1 Latar belakang & tujuan

Tombol CLK pada rangkaian sekuensial punya 2 cara pengoperasian yang sama-sama valid:
- **Manual** — user klik tombol CLK sendiri untuk toggle 1/0 (cocok untuk eksplorasi step-by-step, belajar transisi state).
- **Auto** — user tekan 1x, clock otomatis memancarkan pulsasi 1→0→1→0… secara continue (cocok untuk simulasi clock real-time, melihat behavior rangkaian terhadap clock berjalan).

Kedua mode ini WAJIB tersedia di setiap card yang punya tombol CLK. Tidak boleh ada card clock yang hanya manual atau hanya auto.

### 29.2 Posisi UI switch (ATURAN MUTLAK)

Switch ClockMode WAJIB dirender **tepat di bawah tombol CLK** di dalam SVG diagram. Bukan di samping, bukan di luar SVG, bukan di bawah card — **tepat di bawah tombol CLK**.

**Konsekuensi layout:**
- Jika di bawah tombol CLK ada ruang kosong (mis. Card 16) → switch langsung ditempatkan di situ.
- Jika di bawah tombol CLK ada tombol input lain (mis. Card 17 awalnya S/CLK/R dengan R di bawah CLK) → **input lain HARUS digeser** supaya CLK berada di posisi paling bawah, lalu switch ditempatkan di bawahnya.
- Urutan input yang disarankan: input data di atas, input kontrol di bawah, CLK paling bawah, switch di bawah CLK.

**Posisi switch di SVG:**
- X: aligned dengan tombol CLK (biasanya `x=1`, sama dengan `clkInX`).
- Y: **`clkInY + 55`** — memberi **GAP WAJAR ~25px** dari rect bottom CLK (yang berakhir di `clkInY + 21`) ke label "CLOCK MODE" switch. Contoh: jika `clkInY=230`, rect bottom CLK di y=251, switch di y=285.
  - **ATURAN MUTLAK (revisi 2026-08-13):** JANGAN tempelkan switch ke tombol CLK. Versi awal pakai y=263 (gap hanya ~3px ke label) → terlalu berdempetan & sesak. User secara eksplisit minta "kasih gap wajar". Rumus wajib: **`switch_y = clkInY + 55`** untuk semua card clock sekarang & masa depan.
  - Tinggi switch: ~22px (pill) + 4px (label "CLOCK MODE" di atas pill) + ~5px (ascender label) = total ~31px dari `switch_y - 9` ke `switch_y + 22`.
- SVG height WAJIB diperbesar bila perlu supaya switch tidak terpotong (minimum svgH = `switch_y + 35`). Contoh: switch_y=285 → minimum svgH=320.

### 29.3 Style switch (referensi visual)

Switch adalah **SATU buah toggle pill segmented-control** (gaya iOS-style toggle), BUKAN dua slider terpisah. Pill dibagi menjadi dua segmen yang selalu tampil berdampingan: segmen kiri berlabel "MANUAL", segmen kanan berlabel "AUTO".

| Segmen | State active | State inactive |
|--------|--------------|----------------|
| **MANUAL** (kiri) | Half-fill hijau `#4ade80`, label "MANUAL" hitam bold | Half transparent (gelap), label "MANUAL" abu |
| **AUTO** (kanan) | Half-fill amber `#facc15`, label "AUTO" hitam bold | Half transparent (gelap), label "AUTO" abu |

**Hanya satu segmen yang aktif pada satu waktu** (mutually exclusive). Hanya segmen aktif yang di-fill dengan warna modenya; segmen lain tetap gelap/transparan. Klik di area switch manapun (kiri, kanan, atau tengah) → toggle ke mode lainnya.

Geometri default:
- Lebar pill: 92px, tinggi 22px, corner radius 11px (pill shape).
- Setiap segmen = 46px lebar.
- Label "CLOCK MODE" 7px Orbitron di atas pill.
  - **ATURAN MUTLAK (revisi 2026-08-13):** fill WAJIB **putih bersih `#ffffff`** supaya jelas terlihat di background gelap. TIDAK boleh abu (`#64748b` versi awal — terlalu redup). TIDAK boleh ada glow neon / drop-shadow (cukup putih solid, tanpa efek). Berlaku ke semua card clock sekarang & masa depan.
  - **ATURAN MUTLAK (revisi 2026-08-13 #2):** gap antara label "CLOCK MODE" dan pill switch WAJIB **~10px** (dari baseline text ke top edge pill). Implementasi: label baseline di `y - 12` (pill top di `y`). Sebelumnya `y - 4` (gap ~3px, terlalu kedekatan). Berlaku semua card clock.
- Half-fill menggunakan clipPath mengikuti rounded corner pill supaya tidak overflow.
- Garis pemisah tipis `rgba(15,23,42,0.35)` di tengah supaya batas dua segmen jelas.

Warna:
- MANUAL = hijau `#4ade80` (rgb `74,222,128`) — konsisten dengan warna sinyal data utama.
- AUTO = amber `#facc15` (rgb `250,204,21`) — konsisten dengan warna CLK (sinyal kontrol).

Saat AUTO sedang aktif memancarkan pulsasi (autoActive=true), tampilkan indikator **"RUN"** merah `#ef4444` dengan dot pulse di kanan pill switch supaya user tahu clock sedang berjalan.

**PENTING ( revisi ):** Versi awal pernah salah membuat DUA slider terpisah (satu MANUAL, satu AUTO). Ini SALAH. User secara eksplisit meminta: cukup **SATU switch** yang toggle antara dua mode. Aturan ini berlaku ke semua card clock sekarang & masa depan — jangan pernah kembali ke desain 2-slider.

### 29.4 Behavior mode (ATURAN MUTLAK)

**Mode MANUAL:**
- User klik tombol CLK → toggle 1/0 (sama seperti toggle biasa).
- Tidak ada perubahan perilaku dari versi sebelum sistem ini ditambahkan.

**Mode AUTO:**
- User klik tombol CLK **1x** → clock MULAI memancarkan 1→0→1→0… secara continue.
  - Pulsa dimulai dari **1** (bukan 0).
  - Interval default: 600ms per state (~0.83Hz). Bisa di-tune bila perlu.
- User klik tombol CLK **lagi** → clock **STOP dan RESET ke 0**.
  - **PENTING:** STOP tidak melanjutkan pulsasi — clock kembali ke 0 (mati), bukan lanjut 1→0→1→0.
- Indikator visual "RUN" merah pulse muncul di kanan pill switch saat pulsasi aktif.

### 29.5 Aturan ketat: lock mode saat AUTO aktif (ATURAN MUTLAK)

**Saat clock di mode AUTO sedang aktif memancarkan 1→0→1→0…, user TIDAK BOLEH beralih mode clock (ke MANUAL atau sebaliknya).**

Jika user memaksa menekan switch untuk beralih mode:
1. Sistem **MEMBLOK** upaya switch mode — mode tidak berubah.
2. Sistem menampilkan **toast notifikasi** di posisi **top-center viewport** (paling atas, tengah horizontal) dengan pesan eksak:
   > **"matikan clock dahulu sebelum beralih mode clock"**
3. Toast berwarna **amber** `#facc15` (warning), dengan icon ⚠.
4. Toast auto-dismiss setelah 3 detik.
5. Setelah block ini, sistem **mulai rate-limit 5 detik** (lihat §29.6).

### 29.6 Rate-limit anti-spam (ATURAN MUTLAK)

Setelah upaya switch mode yang diblok (§29.5), sistem **memulai cooldown 5 detik**. Selama cooldown ini aktif:

- Setiap upaya switch mode (ke mode apapun, termasuk ke mode yang sama dengan mode aktif sebelum block) akan **DIGAGALKAN OLEH SISTEM SECARA PAKSA**.
- Sistem menampilkan toast notifikasi di top-center viewport dengan pesan eksak:
  > **"warning! pencegahan rate limit mohon tunggu 5 detik"**
- Toast berwarna **merah** `#ef4444` (error), dengan icon ⛔.
- Toast auto-dismiss setelah 3 detik.
- Setelah 5 detik berlalu, rate-limit berakhir dan user boleh mencoba switch mode lagi (tapi tetap harus mematikan clock auto dulu kalau masih autoActive).

**Tujuan rate-limit:** mencegah user yang frustasi melakukan spam klik switch setelah diblok, yang bisa menyebabkan race condition atau visual glitch.

### 29.6.1 Detail implementasi rate-limit

- Rate-limit menggunakan timestamp `rateLimitedUntilRef = Date.now() + 5000`.
- Cek rate-limit **SEBELUM** cek autoActive lock — supaya semua upaya switch (bahkan ke mode yang sama) selama cooldown langsung ditolak.
- Rate-limit TIDAK reset saat user melakukan aksi lain (toggle CLK, toggle input data) — hanya elapsed time yang mengakhiri rate-limit.

### 29.7 Komponen & hook reusable (WAJIB dipakai semua card clock)

Implementasi sistem ini terpusat di 3 file reusable — **TIDAK BOLEH** di-copy-paste ke setiap card. Semua card clock WAJIB pakai ketiganya:

1. **`src/hooks/useClockMode.js`** — Hook React yang mengelola state `clk`, `clockMode`, `autoActive`, plus fungsi `toggleClk`, `setClockMode`, dan state `toast`. Logika lock + rate-limit + toast semua di sini.
2. **`src/components/ClockModeSwitch.jsx`** — Komponen SVG group yang merender **SATU toggle pill segmented MANUAL/AUTO** (BUKAN dua slider terpisah). Props: `x`, `y`, `mode`, `autoActive`, `onChange`. Dirender di dalam SVG CircuitDiagram, bukan di luar. Klik di area switch manapun → `onChange` dipanggil dengan mode lawannya (`manual`↔`auto`).
3. **`src/components/ClockToast.jsx`** — Komponen toast fixed top-center. Props: `toast` (dari useClockMode). Dirender di CircuitCard (di luar SVG), supaya muncul di atas semua elemen.

**Pola pemakaian di CircuitCard:**
```jsx
const { clk, clockMode, autoActive, toggleClk, setClockMode, toast } = useClockMode();
// ... gunakan clk sebagai inputClk ...
<CircuitDiagramXX ... clk={clk} onToggleClk={toggleClk}
    clockMode={clockMode} autoActive={autoActive} onClockModeChange={setClockMode} />
<ClockToast toast={toast} />
```

**Pola pemakaian di CircuitDiagram:**
```jsx
export default function CircuitDiagramXX({ ..., clk, onToggleClk, clockMode, autoActive, onClockModeChange }) {
    // ... layout constants, pastikan CLK di posisi paling bawah, svgH cukup untuk switch ...
    return <svg viewBox={...}>
        {/* input nodes, CLK paling bawah */}
        <InputNode ix={clkInX} iy={clkInY} val={clk} label="CLK" onToggle={onToggleClk} ... />
        {/* Switch di bawah CLK */}
        <ClockModeSwitch x={1} y={clkInY + 33} mode={clockMode || 'manual'}
            autoActive={!!autoActive} onChange={onClockModeChange || (() => {})} />
        {/* ... wires, gates, outputs ... */}
    </svg>;
}
```

### 29.8 Card yang sudah menerapkan (status implementasi)

| Card | CLK posisi | Switch posisi | Status |
|------|-----------|---------------|--------|
| 16 Gated D Latch | bawah (y=230) | y=263 (ruang kosong, langsung ditempatkan) | ✅ Implemented |
| 17 SR Flip-Flop | bawah (y=230, setelah reorder dari S/CLK/R ke S/R/CLK) | y=263 (svgH diperbesar 320→340) | ✅ Implemented |

**Card masa depan yang WAJIB menerapkan:** D Flip-Flop (edge-triggered), JK Flip-Flop, T Flip-Flop, Counter (async/sync), Register, Shift Register, Memory Unit, dan rangkaian apapun yang punya tombol CLK.

### 29.9 Checklist implementasi untuk card clock baru

Saat membuat card baru dengan tombol CLK, jalankan checklist ini:

- [ ] CLK ditempatkan di posisi input paling bawah (bukan tengah/atas).
- [ ] svgH cukup untuk switch di bawah CLK (minimum `clkInY + 60`).
- [ ] `useClockMode()` dipanggil di CircuitCard, destructured `{ clk, clockMode, autoActive, toggleClk, setClockMode, toast }`.
- [ ] `clk` dipassing ke CircuitDiagram sebagai `clk` prop (BUKAN `inputClk` state lokal).
- [ ] `toggleClk` dipassing ke CircuitDiagram sebagai `onToggleClk`.
- [ ] `clockMode`, `autoActive`, `onClockModeChange` dipassing ke CircuitDiagram.
- [ ] `<ClockModeSwitch>` dirender di dalam SVG, di bawah node input CLK.
- [ ] `<ClockToast toast={toast} />` dirender di CircuitCard (di luar SVG).
- [ ] Verifikasi: hanya ada SATU switch pill di bawah CLK (BUKAN dua slider terpisah) — kiri "MANUAL", kanan "AUTO".
- [ ] Verifikasi: klik switch (di segmen manapun) → toggle antara MANUAL dan AUTO. Segmen aktif ter-fill warna modenya.
- [ ] Verifikasi: di mode MANUAL, klik CLK → toggle 1/0 manual.
- [ ] Verifikasi: di mode AUTO, klik CLK 1x → pulsasi 1→0→1→0 muncul, indikator "RUN" merah pulse di kanan switch.
- [ ] Verifikasi: saat autoActive, klik switch → toast amber "matikan clock dahulu sebelum beralih mode clock".
- [ ] Verifikasi: setelah diblok, klik switch lagi dalam 5 detik → toast merah "warning! pencegahan rate limit mohon tunggu 5 detik".
- [ ] Verifikasi: klik CLK lagi saat autoActive → clock STOP dan kembali ke 0 (bukan lanjut pulsasi).
- [ ] `npm run build` sukses tanpa error.

---

## 30. BUG 1 FIX — LOCK MODE SWITCH KAPANPUN clk=1 (TIDAK HANYA autoActive)

**Bug kritis (ditemukan & diperbaiki 2026-08-13):** Sebelumnya, lock switch mode hanya cek `autoActiveRef.current`. Akibatnya, **manual mode + clk=1 masih bisa switch ke auto** — user tinggal toggle clock ON di manual mode, lalu klik switch AUTO → mode berubah tanpa perlu matikan clock dulu. Ini melanggar aturan ketat §29.5.

**Spec fix (ATURAN MUTLAK):**

Lock switch mode WAJIB cek **`clk || autoActive`** — bukan hanya `autoActive`. Artinya:

| State | clk | autoActive | Switch mode diizinkan? |
|-------|-----|------------|------------------------|
| Manual mode, clock OFF | 0 | false | ✅ Ya |
| Manual mode, clock ON | 1 | false | ❌ TIDAK — block + toast + rate-limit |
| Auto mode, belum running | 0 | false | ✅ Ya |
| Auto mode, sedang running | 0/1 (pulse) | true | ❌ TIDAK — block + toast + rate-limit |

Pesan toast & rate-limit tetap sama (spec §29.5 & §29.6):
- Toast: **"matikan clock dahulu sebelum beralih mode clock"** (amber, ⚠).
- Rate-limit 5 detik: **"warning! pencegahan rate limit mohon tunggu 5 detik"** (merah, ⛔).

**Implementasi:** `src/hooks/useClockMode.js` — function `setClockMode`:
```js
// LOCK: block switch jika clock AKTIF (clk=1).
// Sebelumnya hanya cek `autoActive`, sehingga manual mode + clk=1
// masih bisa switch — itu BUG KRITIS (Bagian 30).
if (clkRef.current || autoActiveRef.current) {
    showToast('matikan clock dahulu sebelum beralih mode clock', 'block');
    rateLimitedUntilRef.current = now + RATE_LIMIT_MS;
    return;
}
```

`clkRef` adalah mirror ref dari `clk` state (di-sync via `useEffect`), supaya lock check stabil dan tidak trigger re-render.

---

## 31. SISTEM FORCE-RESET CARD CLOCK — HANYA SATU CARD CLOCK AKTIF PADA SATU WAKTU

**Bug kritis (ditemukan & diperbaiki 2026-08-13):** Sebelumnya, auto clock di satu card tetap berjalan di background saat user pindah ke card lain. Karena `setInterval` terus memanggil `setClk` tiap 600ms, card yang sudah di-scroll-past tetap re-render → **potensi lag di seluruh sistem** kalau user mengaktifkan auto di banyak card.

Selain itu, spec user eksplisit:
> "ketika user sedang mengaktifkan clock mode auto misalnya di card 16 clocknya memancarkan 1 0 1 0 1 0, kemudian user scroll ke card selanjutnya lalu ketika user menekan 'mode/ atau mengaktifkan di clock lain' maka harusnya card 16 ini harus dipaksa mode clear dimana clocknya susunannya semuanya di rangkaian card tersebut kembali steril dan clear sama seolah olah user belum menyentuh card tersebut sama sekali, dan sistem ini wajib diterapkan di seluruh kartu yang memiliki clock baik sekarang ataupun dimasa depan"

### 31.1 Aturan mutlak (BERLAKU KE SEMUA CARD CLOCK)

1. **Hanya SATU card clock boleh aktif pada satu waktu.** "Aktif" = `clk=1` atau `autoActive=true`.
2. Saat card B clock-nya menjadi aktif DAN card A (berbeda cardId) sebelumnya aktif → **card A di-force-reset ke pristine state** (seolah user belum menyentuh card tersebut sama sekali).
3. Saat card dengan auto running scroll-out dari viewport → **card tersebut di-force-reset** (mencegah background pulsasi → lag).
4. Pristine state = `clk=0`, `clockMode='manual'`, `autoActive=false`, semua input lokal (D, S, R, Q) = 0/false, toast & rate-limit di-clear.
5. Sistem ini WAJIB diterapkan ke semua card clock, sekarang (Card 16, 17) maupun masa depan (D Flip-Flop, JK, T, Counter, Register, dst).

### 31.2 Komponen & file (3 file)

1. **`src/context/ClockCardRegistry.jsx`** — React Context global. Menyimpan `activeCardRef = { cardId, resetFn } | null`. Ekspos `registerActive(cardId, resetFn)` & `unregister(cardId)`. `registerActive` otomatis panggil `resetFn` card sebelumnya (berbeda cardId) sebelum overwrite.
2. **`src/hooks/useClockMode.js`** — Hook menerima opsi `{ cardId, onReset }`. Saat clock aktif → `registerActive(cardId, reset)`. Saat clock inactive → `unregister(cardId)`. Hook juga set up `IntersectionObserver` pada `cardRef` (DOM node container card) untuk trigger `reset()` saat card scroll-out & auto running. Fungsi `reset()` = stop auto + clear semua state clock + call `onReset` (untuk reset state lokal card seperti input, Q).
3. **`src/pages/LogicGatesCircuit.jsx`** — Wrap `<CircuitList>` dengan `<ClockCardProvider>` di dalam `<CardNavigationProvider>`.

### 31.3 Pola pemakaian di CircuitCard (WAJIB)

```jsx
import { useState, useCallback } from 'react';
import { useClockMode } from '../hooks/useClockMode';

export default function CircuitCardXX() {
    const [inputD, setInputD] = useState(false);
    const [q, setQ] = useState(false);

    // onReset: reset semua state lokal card ke 0
    const handleReset = useCallback(() => {
        setInputD(false);
        setQ(false);
    }, []);

    // cardId WAJIB unik per card. onReset opsional tapi sangat disarankan.
    const {
        clk: inputClk, clockMode, autoActive,
        toggleClk, setClockMode, toast,
        cardRef,   // attach ke container div card
    } = useClockMode({ cardId: 'card-XX', onReset: handleReset });

    // ...
    return <div ref={cardRef} style={{...}}>
        {/* ... */}
    </div>;
}
```

### 31.4 Detail mekanisme

**Registry (card-to-card reset):**
- Card A clk=1 → `registerActive('card-A', resetA)` → `activeCardRef = {cardId:'card-A', resetFn:resetA}`.
- Card A clk=0 → `unregister('card-A')` → `activeCardRef = null`.
- Card B clk=1 → `registerActive('card-B', resetB)` → registry lihat prev='card-A' (tapi sudah di-unregister, jadi `activeCardRef` saat ini null) → tidak ada reset call → `activeCardRef = {cardId:'card-B', resetFn:resetB}`.
- Card B clk=1 saat Card A masih aktif (clk=1) → `registerActive('card-B', resetB)` → registry lihat prev='card-A' (beda cardId) → **panggil `resetA()`** → Card A pristine.

**IntersectionObserver (scroll-out reset):**
- Observer attach ke `cardRef.current` (container div card).
- Threshold = 0 (callback fires saat card enter/exit viewport).
- Saat `isIntersecting=false` (card fully out of view) DAN `autoActiveRef.current=true` → panggil `reset()`.
- Manual clk=1 + scroll-out → **TIDAK trigger reset** (tidak ada lag, preserve state user).
- Auto running + scroll-out → **trigger reset** (stop lag, pristine state).

**`reset()` function:**
- Clear `setInterval` auto.
- Set `autoActive=false`, `clk=false`, `clockMode='manual'`.
- Clear `rateLimitedUntilRef` (= 0) supaya user bisa langsung interact lagi.
- Clear toast timeout & `setToast(null)`.
- Call `onReset()` untuk reset state lokal card (input, Q).

### 31.5 Checklist implementasi card clock baru (WAJIB)

- [ ] `useClockMode({ cardId: 'card-XX', onReset: handleReset })` dipanggil di CircuitCard.
- [ ] `handleReset` dibungkus `useCallback` dengan empty deps (stable identity).
- [ ] `handleReset` reset SEMUA state lokal card ke nilai awal (input, Q, dll).
- [ ] `cardRef` di-attach ke container div utama card (`<div ref={cardRef} ...>`).
- [ ] Card berada di dalam `<ClockCardProvider>` (di level page `LogicGatesCircuit`).
- [ ] Verifikasi: Card A auto running → klik clock Card B → Card A pristine (clk=0, mode=manual, input=0, Q=0).
- [ ] Verifikasi: Card A auto running → scroll ke card lain (card A fully out of view) → Card A pristine.
- [ ] Verifikasi: Card A manual clk=1 → scroll ke card lain → Card A state dipreserve (TIDAK reset — tidak ada lag issue).
- [ ] Verifikasi: Card A auto running → klik clock Card A sendiri (toggleClk) → STOP & clk=0, TAPI clockMode tetap 'auto' (stopAuto TIDAK reset clockMode). User bisa re-start.
- [ ] `npm run build` sukses tanpa error.

### 31.6 Larangan

- **DILARANG** membuat card clock tanpa `cardId` di `useClockMode` → registry & IntersectionObserver tidak akan berfungsi.
- **DILARANG** lupa attach `cardRef` ke container div → IntersectionObserver tidak punya node untuk observe.
- **DILARANG** lupa bungkus page dengan `<ClockCardProvider>` → registry return no-op, fitur card-to-card reset tidak berfungsi.
- **DILARANG** menduplikasi logic registry di card manapun — semua harus lewat `useClockMode`.
- **DILARANG** memodifikasi `reset()` untuk skip `onReset` — pristine state WAJIB reset state lokal juga.

---

## 35. VOCABULARY MODE RANGKAIAN SEKUENSIAL — WAJIB SET / RESET / HOLD / INVALID

**Aturan mutlak (ditetapkan 2026-08-13):** Semua rangkaian sekuensial clocked (D Latch, SR Flip-Flop, D Flip-Flop, JK, T, Counter, Register, dst) WAJIB menggunakan vocabulary mode yang SAMA:

| Mode | Arti | Warna badge |
|------|------|-------------|
| **SET** | Output Q "diset" ke 1 | hijau `#4ade80` |
| **RESET** | Output Q "direset" ke 0 | cyan `#22d3ee` |
| **HOLD** | Q, Q̄ = TETAP (nilai sebelumnya) | amber `#facc15` |
| **INVALID** | Kondisi terlarang / tidak mungkin | merah `#ef4444` |

### 35.1 Larangan vocabulary

- **DILARANG** menggunakan mode-name lain seperti "TRANSPARENT" (yang sebelumnya dipakai di Card 16 Gated D Latch). User secara eksplisit menolak: "pada tabel kebenaran seharusnya tidak ada yang namanya mode 'transparent' harusnya hanya ada mode set, reset, hold, invalid (sesuai konteks rangkaian apakah itu)".
- **DILARANG** membuat mode-name custom per rangkaian (mis. "TOGGLE" untuk T Flip-Flop, "COUNT" untuk Counter) — semua WAJIB dipetakan ke SET/RESET/HOLD/INVALID sesuai konteks. Jika ada behavior unik, jelaskan di kolom keterangan tabel, bukan dengan mode-name baru.

### 35.2 "Sesuai konteks rangkaian" — penyesuaian per card

Setiap card menampilkan 4 baris di tabel mode (SET/RESET/HOLD/INVALID), TAPI:
- Hanya mode yang **secara fisik mungkin terjadi** di rangkaian tersebut yang bisa jadi mode aktif (highlight di tabel).
- Mode yang **tidak mungkin** tetap ditampilkan di tabel (untuk konsistensi vocabulary & edukasi), dengan kondisi ditandai "(tidak mungkin)" dan keterangan menjelaskan alasannya.

**Contoh Card 16 (Gated D Latch):**
- SET (D=1, CLK=1) — mungkin, Q=1
- RESET (D=0, CLK=1) — mungkin, Q=0
- HOLD (CLK=0) — mungkin, Q tetap
- INVALID — **TIDAK MUNGKIN** di D Latch (S & R di-generate dari D tunggal, mustahil aktif bersamaan). Tabel menampilkan baris INVALID dengan cond "(tidak mungkin)" & keterangan "TIDAK MUNGKIN di D Latch — S & R di-generate dari D tunggal, mustahil aktif bersamaan". Poin edukasi penting: D Latch "dijinakkan" dari SR Latch sehingga mustahil S=R=1.

**Contoh Card 17 (SR Flip-Flop):**
- SET (S=1, R=0, CLK=1) — mungkin, Q=1
- RESET (S=0, R=1, CLK=1) — mungkin, Q=0
- HOLD (S=0, R=0 atau CLK=0) — mungkin, Q tetap
- INVALID (S=1, R=1, CLK=1) — **MUNGKIN** terjadi (SR Flip-Flop tidak punya proteksi anti-INVALID seperti D Latch). Q=0, Q̄=0.

### 35.3 Implementasi mode calculation

Mode WAJIB diturunkan dari S_gated/R_gated (atau pasangan input gated yang relevan), BUKAN dari output Q. Pola universal:

```js
const mode = (sGated && rGated) ? 'INVALID'  // kondisi terlarang (jika mungkin)
           : (sGated && !rGated) ? 'SET'      // s aktif, r tidak
           : (!sGated && rGated) ? 'RESET'    // r aktif, s tidak
           : 'HOLD';                           // keduanya tidak aktif (termasuk CLK=0)
```

### 35.4 Verifikasi checklist (WAJIB untuk card clock baru)

- [ ] Vocabulary mode: SET / RESET / HOLD / INVALID (BUKAN TRANSPARENT atau custom).
- [ ] Warna badge konsisten: SET=hijau, RESET=cyan, HOLD=amber, INVALID=merah.
- [ ] Tabel mode menampilkan 4 baris (meskipun ada yang tidak mungkin terjadi).
- [ ] Mode yang tidak mungkin ditandai "(tidak mungkin)" di kolom kondisi + keterangan jelas.
- [ ] Mode calculation diturunkan dari input gated (S_gated/R_gated atau ekuivalen), BUKAN dari output Q.
- [ ] Description text menggunakan vocabulary SET/RESET/HOLD/INVALID, BUKAN TRANSPARENT atau istilah lain.

### 35.5 Larangan tambahan

- **DILARANG** menampilkan tabel 2-mode (seperti versi awal Card 16 dengan hanya TRANSPARENT/HOLD). Tabel WAJIB 4-mode untuk konsistensi vocabulary & edukasi.
- **DILARANG** menghilangkan baris INVALID dari tabel meskipun tidak mungkin terjadi — keberadaannya adalah poin edukasi penting (perbandingan dengan rangkaian yang bisa INVALID).

---

## 36. TEMPLATE — Card 16 (SR Flip-Flop, 4-NAND Topology) sebagai Referensi Rangkaian Sekuensial Clocked

> **ATURAN MUTLAK:** Card 16 (SR Flip-Flop, 4 NAND gates) adalah **TEMPLATE referensi** untuk SEMUA rangkaian sekuensial clocked di masa depan yang butuh sistem yang sama. Saat membuat card baru (JK Flip-Flop, D Flip-Flop, T Flip-Flop, register, counter, dll), **WAJIB** mencontoh pola Card 16.

### 36.1 Mengapa Card 16 jadi TEMPLATE

Card 16 sudah mencakup **SEMUA sistem** yang dibutuhkan rangkaian sekuensial clocked, dalam bentuk yang sudah teruji sempurna:

1. **Topologi 4-NAND** (steering + cross-coupled latch) — sesuai gambar referensi user (13 Aug 2026).
2. **Clock mode system** (MANUAL/AUTO) via `useClockMode` hook — Bagian 29–31.
3. **ClockCardRegistry** (hanya 1 card clock aktif pada satu waktu) — Bagian 31.
4. **IntersectionObserver** (reset saat scroll-out) — Bagian 31.
5. **Vocabulary 4-mode** SET/RESET/HOLD/INVALID — Bagian 35.
6. **ClockModeSwitch** (pill segmented-control, putih bersih, gap wajar dari tombol CLK) — Bagian 29.
7. **Color palette konsisten** (NAND=oranye, S=hijau, R=cyan, CLK=amber, Q=hijau, Q̄=pink, feedback=oranye/ungu).

### 36.2 File referensi TEMPLATE

| File | Peran |
|------|-------|
| `src/components/CircuitCard16.jsx` | Wrapper card: state React, `useClockMode` hook, mode table, description, status bar. |
| `src/components/CircuitDiagram16.jsx` | SVG diagram: 4 NAND gates, input nodes, output nodes, feedback wires, ClockModeSwitch. |
| `src/hooks/useClockMode.js` | Hook generic untuk CLK manual/auto + registry + IntersectionObserver. |
| `src/context/ClockCardRegistry.jsx` | Global registry context (1 card clock aktif pada satu waktu). |
| `src/components/ClockModeSwitch.jsx` | UI pill segmented-control MANUAL/AUTO. |
| `src/components/ClockToast.jsx` | Toast notifikasi (rate-limit, mode lock, dll). |

### 36.3 Checklist copy-paste untuk card baru

Saat membuat rangkaian sekuensial clocked baru, ikuti langkah-langkah berikut (copy dari Card 16):

**A. State & Hook (di CircuitCardXX.jsx):**
- [ ] `useState` untuk input utama (S/R atau D atau J/K, dll) + `useState` untuk `q`.
- [ ] `handleReset` callback: reset semua state lokal ke 0 (dipanggil saat card lain clock-nya aktif / scroll-out).
- [ ] `useClockMode({ cardId: 'card-XX', onReset: handleReset })` — destructur `clk, clockMode, autoActive, toggleClk, setClockMode, toast, cardRef`.
- [ ] Derived sinyal gated (e.g. `sGated = inputS && inputClk`, `rGated = inputR && inputClk`).
- [ ] `qBar` dengan handling INVALID khusus per topologi (NAND latch active-low → Q=1, Q̄=1; NOR latch → Q=0, Q̄=0).
- [ ] `mode` derived dari sGated/rGated (BUKAN dari Q) — vocabulary SET/RESET/HOLD/INVALID.
- [ ] `useEffect` update Q berdasarkan sGated/rGated.
- [ ] 4-mode table dengan kondisi ditulis dalam input mentah (S/R/CLK, BUKAN sGated/rGated).
- [ ] `cardRef` dipasang di root `<div ref={cardRef}>`.
- [ ] `<ClockToast toast={toast} />` dirender di dalam card.

**B. SVG Diagram (di CircuitDiagramXX.jsx):**
- [ ] Input nodes: urutan top-to-bottom sesuai gambar referensi. CLK WAJIB punya label "CLK" warna amber.
- [ ] `<ClockModeSwitch x={1} y={clkInY + 105} mode={clockMode} autoActive={autoActive} onChange={onClockModeChange} />` — dirender DI BAWAH tombol CLK, gap wajar (~25-55px).
- [ ] `svgH` cukup untuk muat switch (min 340).
- [ ] Gate components: gunakan `NandGate` / `NorGate` / `AndGate` / `NotGate` reusable (copy dari Card 16).
- [ ] Glow/fill/stroke gate body mengikuti output gate (bukan input).
- [ ] Feedback wires: pola wrap-around (turun/naik → kiri → naik/turun → masuk gate input), warna distinct (oranye #fb923c untuk Q fb, ungu #a78bfa untuk Q̄ fb).
- [ ] Junction dots di setiap percabangan wire.
- [ ] Output nodes Q (hijau) + Q̄ (pink, overline manual).
- [ ] Mode badge di top-center SVG.

**C. Registrasi (di LogicGatesCircuit.jsx):**
- [ ] Import `CircuitCardXX from '../components/CircuitCardXX'`.
- [ ] Tambah entri ke `ALL_CARDS`: `{ num: 'XX', name: 'Nama Rangkaian', tier: 'NORMAL', el: CircuitCardXX }`.
- [ ] Pastikan `<ClockCardProvider>` sudah wrap halaman (sudah ada, Bagian 31).

### 36.4 Vocabulary & behavior WAJIB (ATURAN MUTLAK Bagian 35)

- [ ] Vocabulary mode: SET / RESET / HOLD / INVALID (BUKAN TRANSPARENT atau custom).
- [ ] Warna badge: SET=hijau `#4ade80`, RESET=cyan `#22d3ee`, HOLD=amber `#facc15`, INVALID=merah `#ef4444`.
- [ ] Tabel mode menampilkan 4 baris (meskipun ada yang tidak mungkin terjadi).
- [ ] Mode yang tidak mungkin ditandai "(tidak mungkin)" di kolom kondisi.
- [ ] Mode calculation diturunkan dari input gated (sGated/rGated atau ekuivalen), BUKAN dari output Q.
- [ ] INVALID behavior disesuaikan topologi latch:
  - **NAND latch active-low** (Card 16): Q=1, Q̄=1 (keduanya HIGH).
  - **NOR latch** (Card 15): Q=0, Q̄=0 (keduanya LOW).

### 36.5 Catatan penting

- Card 17 (Gated D Latch) **DIHAPUS SEPENUHNYA** pada 13 Aug 2026 karena salah total — bukan referensi. Jangan gunakan Card 17 sebagai contoh. Gunakan **Card 16** sebagai satu-satunya TEMPLATE.
- Jika di masa depan D Latch akan dibuat ulang, **WAJIB** mengikuti pola Card 16 (4-NAND atau topologi yang sesuai dengan gambar referensi valid), bukan mengikuti versi lama Card 17 yang sudah dihapus.

---


## Bagian 37 — [DELETED] Card 17 T Flip-Flop (Di hapus sepenuhnya 13 Aug 2026)

**Status:** DIHAPUS SEPENUHNYA TANPA JEJAK pada 13 Aug 2026 (sesi lanjutan).

Card 17 T Flip-Flop pernah dibuat ulang sebanyak 2x (4-NAND lalu 2 AND + 2 NOR),
namun user menyimpulkan "saya salah total disitu" dan minta delete sepenuhnya.
Semua file `CircuitCard17.jsx` dan `CircuitDiagram17.jsx` telah dihapus, import
di `LogicGatesCircuit.jsx` dihapus, dan slot Card 17 dikosongkan.

Jika di masa depan user ingin membuat T Flip-Flop lagi, **WAJIB** mengikuti
TEMPLATE Card 16 (lihat Bagian 36) dengan topologi yang sesuai. Jangan gunakan
apapun dari Card 17 yang sudah dihapus sebagai referensi.

---

## 37. SISTEM WARNA CARTRIDGE SLOT — LOGIC GATES SIMULATOR (WAJIB DIPERTAHANKAN)

### 37.1 Prinsip

Warna body cartridge save slot **TIDAK** di-hardcode — diturunkan secara dinamis dari `slot.color` via formula HSL "hue-only". Ini memastikan saat user ganti warna via color picker, seluruh cartridge card (gradient, shadow, groove) ikut berubah, bukan hanya kotak kecil 24×24px.

### 37.2 Formula (FINAL)

```js
const { h: slotH } = hexToHsl(slot.color || '#3b82f6');
const cc = {
  body:  hslToHex(slotH, 50, 35),   // muted medium-dark
  dark:  hslToHex(slotH, 35, 14),   // sangat gelap, desaturated
  light: hslToHex(slotH, 55, 48),   // lebih terang, tetap muted
};
```

**Hanya hue (rona) yang diambil dari `slot.color`.** Saturasi & lightness tetap sesuai estetika cartridge — muted, gelap, profesional. Ini menjaga tampilan cartridge konsisten walau user pilih warna apapun.

### 37.3 Default Warna Slot

| Slot | Default `slot.color` | Hue | Cartridge body |
|------|---------------------|-----|----------------|
| 1 | `#3b82f6` (biru) | 217° | `#2d4f86` |
| 2 | `#8b5cf6` (ungu) | 258° | `#472d86` |
| 3 | `#ec4899` (pink) | 330° | `#862d59` |

### 37.4 Aturan untuk Slot Baru

- **WAJIB** set `slot.color` ke hex warna valid saat membuat slot baru.
- Default: rotasi dari `['#3b82f6', '#8b5cf6', '#ec4899']` atau warna pilihan user.
- Jika `slot.color` undefined/null → fallback `'#3b82f6'`.
- **DILARANG** hardcode warna cartridge — formula di atas yang menentukan.

### 37.5 Elemen Visual Slot Card

| Elemen | Posisi | Status |
|--------|--------|--------|
| Bulatan warna (indicator dot) | `position: absolute, top: 8, left: 8` (14×14) | `visibility: hidden` — tetap di DOM tapi invisible |
| Ikon gembok (Lock) | `position: absolute, top: 4, left: 4` (20×20) | Muncul hanya saat `slotLocks[idx] === true` — menimpa posisi bulatan warna |
| Color swatch (picker trigger) | Di dalam info area (24×24) | Klik → buka `SlotColorPickerModal` |

### 37.6 Fungsi Pendukung

`hexToHsl(hex)` dan `hslToHex(h, s, l)` sudah ada di `LogicGatesSimulator.jsx` (baris ~91-118). Kedua fungsi ini WAJIB dipertahankan dan tidak boleh diubah tanpa pengujian visual menyeluruh.

---

## 38. DATA PROTECTION SYSTEM — INVARIANT YANG WAJIB DIPATUHI

> **Bagian ini adalah KONSTITUSI perlindungan data user.** Setiap fitur baru, update, atau refactoring yang menyentuh save slot WAJIB mematuhi semua aturan di bawah. Pelanggaran = bug kritis yang harus di-fix sebelum merge.

### 38.1 Prinsip ABSOLUT

1. **Data circuit user (`slot.data.circuitState`) TIDAK PERNAH boleh ditimpa dengan null/undefined** kecuali user eksplisit minta (dengan `explicitClear: true` flag di request body). Ini adalah hukum tertinggi — tidak ada pengecualian.
2. **`metaOnly: true` request TIDAK PERNAH mengubah `circuitState`** — hanya boleh update metadata (name, color, description). Backend meng-merge: keep existing circuitState, update metadata saja.
3. **Backend HARUS punya guard** yang menolak (HTTP 409) overwrite circuitState yang sudah ada dengan null tanpa `explicitClear` flag.
4. **Frontend HARUS kirim `hasCircuitData` flag** pada setiap POST `/api/circuits` agar backend tahu apakah circuitState valid atau harus di-preserve.
5. **Slot DELETE TIDAK BOLEH ada di frontend** — slot yang sudah dibeli bersifat PERMANEN. Backend sudah punya proteksi 403 untuk `save-slot-*`.
6. **Deep-clone data dari backend saat load** — `JSON.parse(JSON.stringify(data))` mencegah accidental mutation.
7. **First render HARUS skip localStorage/backend write** — mencegah overwrite data yang benar dengan state parsial (3 default slots).
8. **beforeunload guard** — mencegah data loss saat user close page saat save in-flight.

### 38.2 5-Layer Protection Architecture

| Layer | Nama | Mekanisme | Dilindungi dari |
|-------|------|-----------|-----------------|
| 1 | **Order Integrity Validation** | `validateOrder()` cek format `save-slot-N`, tolak duplikat, tolak format invalid | Corrupted order data, injection |
| 2 | **Order Backup** | `circuit_slot_order_backup` — sebelum overwrite, backup order saat ini | Single-point failure, overwrite bug |
| 3 | **beforeunload Guard** | `backendSaveInFlightRef` + browser prompt | Data loss on page close |
| 4 | **Auto-Recovery** | `loadSlots` bersihkan stale entries, restore dari backup | Orphaned/stale order entries |
| 5 | **Deep-Clone** | `JSON.parse(JSON.stringify())` on load | Accidental reference mutation |

### 38.3 Backend Protection Architecture

| Guard | Endpoint | Mekanisme | Dilindungi dari |
|-------|----------|-----------|-----------------|
| **metaOnly merge** | POST | `metaOnly=true` + `hasCircuitData=false` → merge, tidak overwrite circuitState | Race condition, partial state save |
| **circuitState null block** | POST | Non-metaOnly + null circuitState + existing data → HTTP 409 | Client bug, accidental wipe |
| **Slot delete 403** | DELETE | `save-slot-*` items → 403 for non-admin | Accidental/malicious deletion |
| **Auth required** | ALL | Firebase Bearer token required | Unauthorized access |
| **Rate limit** | ALL | 60 req/60s per IP | Abuse/DoS |

### 38.4 Checklist untuk Setiap Fitur Baru yang Menyentuh Slot

Sebelum menambah/update fitur yang menyentuh `saveSlots`, `slot.data`, atau `/api/circuits`, WAJIB verifikasi:

- [ ] Fitur TIDAK mengirim `circuitState: null` ke backend tanpa `explicitClear: true`
- [ ] Fitur TIDAK mengubah `slot.data` secara langsung (harus via `setSaveSlots` dengan spread)
- [ ] Fitur TIDAK menambah tombol/button delete slot (slot = permanen)
- [ ] Kalau fitur mengubah metadata (name/color/description), gunakan `metaOnly: true` + `hasCircuitData` flag
- [ ] Kalau fitur menambah state baru yang di-persist, tambahkan ke localStorage DAN backend
- [ ] Kalau fitur mengubah initial state, pastikan first-render guard masih bekerja
- [ ] Build sukses (`npx vite build`) sebelum push
- [ ] Test manual: save → swap → refresh → verify data intact

---

## 39. STANDAR DESAIN MENU BUTTON (DEFAULT GLOBAL)

> **Bagian ini adalah STANDAR PERMANEN untuk semua tombol besar/menu di web ini ke depan.**
> Setiap tombol baru yang sekelas menu utama WAJIB ikut pola di bawah. Tidak boleh bikin
> sistem tombol custom baru kecuali didiskusikan dulu. Komponen referensi: `src/components/MenuButton3D.jsx`.

### 39.1 Bentuk & Anatomi

- **Rounded rectangle**, radius 18px, padding `16px 20px 20px 20px` (extra padding bawah supaya tombol terasa "berdiri di atas lip").
- **Background**: gradient vertikal 2-stop — `top` (lightness tinggi) → `bottom` (lightness sedang). Tidak ada border stroke.
- **Lip bawah**: solid 6px warna `lip` (lightness rendah, lebih gelap dari `bottom`) — berfungsi sebagai penanda "ketebalan/ketinggian fisik" tombol, seolah tombol itu slab 3D yang berdiri di atas lip.
- **Tanpa border** (kecuali state `locked` yang pakai border merah tipis `2px solid #3f1d1d`).
- **Layout**: icon (40×40) kiri → teks (label + subtitle) tengah → badge "LOGIN REQUIRED" kanan (hanya saat `locked`).

### 39.2 Interaksi (3-state physical press simulation)

| State | translateY | lip height | brightness | Ambient shadow |
|-------|-----------|------------|------------|----------------|
| **default** | 0px | 6px | 1.0 | blur 20, opacity 0.40 |
| **hover** (unlocked) | +1px (turun dikit) | 5px (menipis) | 1.06 (terang) | blur 24, opacity 0.42 |
| **pressed** | +5px (tenggelam) | 1px (hampir habis) | 0.97 (sedikit redup) | blur 6, opacity 0.35 |

Transisi: `transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease`.
**Efek**: ketika ditekan, tombol seolah "tenggelam" ke lip — lip menipis dari 6px → 1px, ambient blur mengecil, tombol turun. Simulasi tombol fisik yang benar-benar dipencet.

### 39.3 Warna — WAJIB 3 turunan HSL dari 1 hue

Setiap tombol punya 3 properti warna, SEMUA dari hue yang sama, hanya lightness yang beda:

| Prop | Peran | Lightness | Saturation |
|------|-------|-----------|------------|
| `top` | bagian atas gradient | TINGGI (60–75%) | TINGGI (70–100%) |
| `bottom` | bagian bawah gradient | SEDANG (35–55%) | TINGGI (70–100%) |
| `lip` | bibir bawah solid | RENDAH (24–38%) | TINGGI (70–100%) |

**ATURAN MUTLAK:** Saturation TINGGI di ketiganya (70–100%). JANGAN diturunkan/dicampur abu-abu (saturation < 50%) — itu bikin warna terlihat kusam/faded. Lightness turun drastis dari `top` → `bottom` → `lip` supaya sense depth 3D kelihatan.

Contoh (`hsl(H, S%, L%)`):
- Marketplace: `hsl(350,85%,68%)` / `hsl(350,80%,45%)` / `hsl(350,80%,32%)`
- Canvas: `hsl(270,70%,68%)` / `hsl(270,75%,42%)` / `hsl(270,75%,30%)`
- Shapes: `hsl(142,55%,55%)` / `hsl(142,55%,35%)` / `hsl(142,55%,24%)`

### 39.4 Icon — SVG Custom + 2 Gradient Global + STANDAR UKURAN RESMI

- **Icon** SVG custom per-tombol (BUKAN icon flat lucide/emoji polos). Tiap icon punya struktur multi-path yang membuatnya terlihat "dengan shading".
- **Shading** memakai 2 gradient yang dideklarasi **SEKALI di root level `App.jsx`** (lihat Bagian 39.5):
  - `url(#menuIconGrad)` — linear gradient putih (1.0 → 0.75 → 0.4 opacity) untuk permukaan datar.
  - `url(#menuSphereGrad)` — radial gradient putih (1.0 → 0.7 → 0.28 opacity) untuk objek bulat (sphere).
- Detail kecil (stroke gelap `rgba(0,0,0,0.2–0.3)`, highlight putih `rgba(255,255,255,0.55–0.95)`) wajib dipakai untuk depth sense.

#### STANDAR UKURAN ICON (RESMI — WAJIB DIPAKAI SEMUA MENU BUTTON)

> **Ini adalah standar final yang sudah divalidasi user secara visual.**
> JANGAN diubah kecuali didiskusikan dulu. Nomor di bawah bukan sekadar default
> yang bisa di-tune — ini **standar resmi**.

| Komponen | Ukuran | Catatan |
|----------|-------|--------|
| **Container icon** di `MenuButton3D.jsx` | **56 × 56 px** | Div flex yang membungkus SVG. `flexShrink: 0` supaya tidak kecil saat space sempit. |
| **SVG render** (`width`/`height` attribute di `<svg>`) | **48 × 48 px** | Pakai nilai literal di tiap `<svg width="48" height="48">` di App.jsx. JANGAN pakai `100%` — harus literal px. |
| **viewBox** | `0 0 24 24` (kecuali Shapes yang `viewBox="-4 -6 32 34"` untuk padding geometri) | Coordinate system internal SVG. Tidak diubah — yang diubah hanya `width`/`height` render. |
| **Rasio SVG/container** | **86%** (48/56) | Rasio optimal — icon cukup besar tapi masih ada sedikit padding untuk `drop-shadow(0 1px 2px rgba(0,0,0,0.3))` supaya tidak nabrak tepi. |

**Kenapa 48/56 (bukan 56/56 = 100%)?**
- Kalau SVG = container (100%), icon akan nabrak tepi container, drop-shadow terpotong, terlihat berantakan.
- Kalau SVG < 60% container (mis. 24/40 seperti versi awal), icon terlihat kekecilan — banyak white space kosong, sekitar hanya 20-25% lebar tombol (verified via VLM analysis).
- **48/56 = 86%** adalah sweet spot — icon menempati ~40-50% lebar tombol (sebelumnya hanya 20-25%), proporsional dengan label teks, dan drop-shadow masih punya ruang.

**Aturan implementasi:**
1. Container di `MenuButton3D.jsx` — hardcoded `width: 56, height: 56` (inline style, bukan prop).
2. SVG di App.jsx — pakai literal `width="48" height="48"` di tiap elemen `<svg>` (6 icon menu). JANGAN pakai prop `size` di lucide atau `width="100%"`.
3. Kalau nanti bikin tombol variant `size="sm"` (sub-menu), rasio **TETAP 86%** — mis. container 40×40 → SVG 34×34. Bukan 24×24.

### 39.5 SVG Gradient Defs — SEKALI di Root, BUKAN per-Komponen

```jsx
// Ditaruh di root JSX App.jsx, SEKALI SAJA:
<svg width="0" height="0" style={{ position: 'absolute' }}>
  <defs>
    <linearGradient id="menuIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="1"/>
      <stop offset="55%" stopColor="#ffffff" stopOpacity="0.75"/>
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4"/>
    </linearGradient>
    <radialGradient id="menuSphereGrad" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="1"/>
      <stop offset="55%" stopColor="#ffffff" stopOpacity="0.7"/>
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.28"/>
    </radialGradient>
  </defs>
</svg>
```

**Kenapa sekali di root?** SVG `id` harus unik di seluruh dokumen. Kalau taruh di dalam `MenuButton3D.jsx` (di-render 6x), ada 6 elemen dengan `id="menuIconGrad"` → collision, referensi `url(#menuIconGrad)` jadi tidak konsisten (browser ambil yang pertama, ikon tombol lain bisa salah ambil).

Prefix `menu` (`menuIconGrad` / `menuSphereGrad`) supaya tidak collision dengan SVG lain di app ini yang kebetulan pakai id `iconGrad`/`sphereGrad` polos.

### 39.6 State `locked` (Guest-Guard) — WAJIB DIPERTAHANKAN

Saat `locked=true`:
- Background: solid `#1a1f2e` (abu gelap, BUKAN gradient).
- Border: `2px solid #3f1d1d` (merah gelap).
- Opacity: `0.55` (redup).
- Label & badge: warna `#ef4444` (merah).
- Badge "LOGIN REQUIRED" muncul di kanan (font 10px, weight 600, opacity 0.85).
- **Tidak ada interaksi** — `cursor: pointer` tetap tapi `boxShadow: 'none'`, `transform: translateY(0)`, `filter: 'none'`. Hover/press TIDAK mengubah apa pun.
- **`onClick` tetap dipanggil** — di komponen pemanggil, `onClick` biasanya cek user state lalu `showGuestAnnouncement()` kalau guest.

Behavior ini WAJIB tidak regresi setiap kali komponen di-rewrite.

### 39.7 Props API — STANDAR WAJIB

```jsx
<MenuButton3D
  label="Marketplace"          // wajib
  subtitle="trade parts & designs"  // opsional, tapi sangat disarankan
  top="hsl(...)"               // wajib
  bottom="hsl(...)"            // wajib
  lip="hsl(...)"               // wajib
  onClick={handler}            // wajib
  icon={<svg>...</svg>}        // wajib — pakai url(#menuIconGrad) atau url(#menuSphereGrad)
  locked={boolean}             // opsional, default false
/>
```

### 39.8 Aturan ke Depan

- **SEMUA tombol besar/menu baru** di web ini WAJIB pakai `MenuButton3D` dengan props di atas.
- **JANGAN** bikin sistem tombol custom baru (alternatif styling, variant, atau komponen sejenis) kecuali didiskusikan dulu dan didokumentasikan di file ini.
- **JANGAN** gunakan `accent`/`dark`/`deepest` (props lama, sudah deprecated). Pakai `top`/`bottom`/`lip`.
- **JANGAN** gunakan icon flat lucide polos untuk tombol menu utama — pakai SVG custom dengan shading.
- Kalau butuh variant (mis. tombol kecil untuk sub-menu), diskusikan dulu — mungkin perlu bikin `MenuButton3D` versi `size="sm"`, bukan komponen baru.

---

## 40. STANDAR DESAIN PAGE "SHAPES CALCULATOR" (PORT KALKULATOR STANDALONE v1.2.1)

> **Status: STANDAR PERMANEN untuk page `src/pages/ShapesCalculator.jsx`.** Page ini adalah
> port kalkulator standalone by @dabl2829 (YouTube) — ATURAN MUTLAK: blok script original
> (fungsi hitung, rumus, output, ASCII art, pesan error) TIDAK BOLEH diubah; yang boleh
> diedit HANYA lapisan presentasi (lihat header comment file + memory.md Bagian 63).

### 40.1 Anatomi Layout (atas → bawah, container maxWidth 540)

1. **Tombol Back** kiri-atas — pola persis GearsPage (`#0e1420`, border `#1e293b`,
   radius 10, teks "Back" + icon `ArrowLeft` 15px).
2. **Header** — icon badge `Calculator` 32px dalam kotak `rgba(45,212,191,0.18)` radius 12 +
   judul "SHAPES CALCULATOR" Orbitron 900, gradient text teal
   `linear-gradient(180deg,#5eead4 0%,#14b8a6 100%)`, `clamp(1.6rem,6vw,2.2rem)`.
3. **Deskripsi** — Inter 13 `#94a3b8`, center.
4. **Mode selector** — segmented control 4 kolom (grid `repeat(4,1fr)`, gap 6, padding 5,
   card `#0e1420` border `#1e293b` radius 14): tab ber-icon lucide
   (Circle / Globe / Cone / Donut) 18px + label Inter 11 weight 600.
   - Inactive: transparent, teks `#94a3b8`, hover teks `#e2e8f0`.
   - Active: bg `rgba(45,212,191,0.14)`, border `rgba(45,212,191,0.4)`, teks `#5eead4`.
5. **Panel input** — card standar (`#0e1420`, border `#1e293b`, radius 14, padding 18,
   flex column gap 14). Placeholder "Pilih bentuk di atas untuk mulai menghitung."
   (`#475569`, center) saat belum pilih mode.
   - **Row link tutorial** (id `circle0`/`sphere0`/`cone0`/`torus0`): chip
     `rgba(45,212,191,0.08)` + border `rgba(45,212,191,0.22)` radius 10, icon `Youtube`
     14px `#ef4444`, teks "Explained in:" `#94a3b8` + link `#5eead4` underline dotted.
   - **Row input angka**: label Inter 12 weight 600 `#94a3b8` di atas input; input
     full-width `#181b24`, border `#1e293b` radius 10, padding `10px 12px`, Inter 14
     `#e2e8f0`, focus border `#2dd4bf`.
   - **Select cone type** (`id="type"`): style sama dengan input + `appearance:none` +
     icon `ChevronDown` 15px absolute kanan.
   - **Tombol Calculate** (id `calc_circle`/`calc_sphere`/`calc_cone`/`calc_torus`):
     full-width, gradient `linear-gradient(180deg,#2dd4bf 0%,#14b8a6 100%)`, teks
     `#052e24` Orbitron 700 size 13 letterSpacing 2 uppercase, radius 12, shadow
     `0 4px 16px rgba(45,212,191,0.22)`; press = `translateY(2px)` + shadow mengecil.
6. **Panel output** — card standar padding 16, header kecil "OUTPUT" (icon `Terminal`
   13px `#2dd4bf` + label Orbitron 10 letterSpacing 2 `#475569`) + `<pre id="output">`
   monospace (`'Cascadia Code','JetBrains Mono','Fira Code',Consolas,'Courier New'`),
   `whiteSpace: 'pre'`, `overflowX: 'auto'` (ASCII art bisa scroll horizontal),
   `fontSize` initial 14 / `fontWeight` normal / color `#e2e8f0` — fontSize & fontWeight
   kemudian DI-SET OLEH FUNGSI ORIGINAL (11px/6px/5px bold untuk ASCII, 16px normal
   untuk hasil) — JANGAN ditimpa CSS.
7. **Footer versi** — icon `Youtube` 12px + "v1.2.1 (YouTube: @dabl2829)" Inter 11
   `#475569`, center. Teks PERSIS original (atribusi), jangan diubah.

### 40.2 Aturan Teknis Porting (MUTLAK — berlaku untuk edit masa depan)

- **Blok script original** (dari komentar `//shapes calculator (by @dabl2928 on youtube)`
  sampai akhir fungsi `torus()`) di-copy verbatim + indentasi 4 spasi asli — JANGAN
  reformat, JANGAN ubah rumus/output. Verifikasi: diff vs file original harus identical.
- **Strict-mode shim** (blok `var …` 54 nama) WAJIB dipertahankan — implicit global
  original akan ReferenceError di ES module. Kalau menambah fungsi original baru yang
  pakai variabel implicit baru, tambahkan deklarasinya di shim.
- **ID DOM original WAJIB dipertahankan** (`circle0..torus9`, `d_circle`, `deg_circle`,
  `type`, `h_cone`, `d_bot_cone`, `d_top_cone`, `deg_cone`, `out_d_torus`, `in_d_torus`,
  `deg_torus`, `ddeg_torus`, `calc_*`, `output`) — dipakai fungsi original via
  `document.getElementById`.
- **Show/hide row = via `display()` original** (manipulasi DOM langsung), BUKAN React
  state. State React (`mode`) HANYA untuk highlight tab. Semua row wajib pakai referensi
  style SHARED (`hiddenRow`) — bukan object literal inline — supaya re-render React
  tidak me-reset hasil `display()`.
- Semua row input + 4 tombol Calculate harus SELALU ter-render (statis, slot children
  stabil) — JANGAN conditional-render berdasarkan `mode`, karena fungsi original
  mengasumsikan elemen selalu ada di DOM.
- FIX VISIBILITY CONE (disetujui user eksplisit, 2026-08-27 — lihat memory.md Bagian 64):
  "Bottom diameter" (cone7) masuk `lcone` -> SELALU tampil di mode Cone (dibutuhkan semua
  perhitungan cone); "Top diameter" (cone9) hanya tampil saat "Cone type" = Broken
  (toggle di onChange select + sinkronisasi manual saat ganti mode tab, karena cone9
  di luar `lcone`). Mengikuti intent komentar HTML original ("top diameter option only
  shows up if broken is true"). Fungsi hitung `cone()` TIDAK berubah.

---

## 41. STANDAR DESAIN BACKGROUND IMAGE GLOBAL (PULAU MELAYANG)

> **Status: STANDAR PERMANEN untuk root layout `src/App.jsx`.** User upload gambar
> artwork pulau melayang (Gemini generated, 2732x1536 JPEG) untuk menggantikan
> background polos gelap `#181b24` — dipasang 2026-08-28 (lihat memory.md Bagian 65).

### 41.1 Aset

- File: `public/bg-island.webp` — WebP 1920x1079, ~221 KB (di-optimasi dari JPEG
  2.9 MB asli; resize LANCZOS + quality 78). JANGAN pakai file JPEG asli (terlalu berat).
- Penamaan mengikuti konvensi asset existing (`gate-diagram.webp` dll).

### 41.2 Implementasi (root div App.jsx)

- Root div ditambah `isolation: 'isolate'` (membuat stacking context tanpa mengubah
  layout) supaya layer background (`zIndex: -1`) berada DI ATAS `backgroundColor`
  root (fallback saat gambar belum termuat) tapi DI BAWAH seluruh konten.
- Layer background = div pertama anak root:
  - `position: 'fixed'`, `inset: 0`, `zIndex: -1`, `aria-hidden="true"`.
  - `backgroundImage`: scrim gradient DI ATAS gambar:
    `linear-gradient(180deg, rgba(24,27,36,0.58) 0%, rgba(16,19,26,0.78) 100%), url('/bg-island.webp')`
  - `backgroundSize: 'cover'`, `backgroundPosition: 'center'`, `backgroundRepeat: 'no-repeat'`.
- Kenapa `position: fixed` (bukan background di root div): ukuran layer selalu
  sebesar viewport — tidak ikut memanjang di halaman panjang & stabil saat
  transisi halaman framer-motion. Hindari `backgroundAttachment: 'fixed'`
  (broken di iOS Safari).
- Scrim gelap WAJIB supaya tema dark, panel `#0e1420`,
  dan teks abu `#94a3b8` tetap terbaca di atas artwork yang cerah.
  Opasitas final (request user 2026-08-28: "transparannya kurangin dikit"):
  atas 0.58 / bawah 0.78 — opasitas bergerak rentang ~0.5-0.9; terlalu
  tipis (<0.45) bikin teks abu susah dibaca di area artwork yang cerah.

### 41.3 Aturan Pemakaian

- Halaman tool full-screen yang punya background solid sendiri (BlockSimulator3D /
  v2, CanvasPage, CircuitGenerator, LogicGatesSimulator, dll.) TIDAK diubah —
  mereka menutupi layer ini by design.
- Kalau mau ganti gambar background: replace `public/bg-island.webp` saja
  (nama file sama), jangan ubah struktur layer-nya.

---

## 42. STRUKTUR HALAMAN GEARS — SUBMENU PEMISAH (GEARS CALCULATOR / GEARS TYPE)

> **Status: STANDAR PERMANEN untuk page `src/pages/GearsPage.jsx`.** Direstrukturisasi
> 2026-08-28 atas request user: masuk menu Gears TIDAK langsung ke daftar gear, tapi
> ke halaman pemisah 2 tombol (lihat memory.md Bagian 67).

### 42.1 State Machine View (internal, TANPA routing baru)

- `view = 'menu'` (DEFAULT) — halaman pemisah: heading GEARS + deskripsi + 2 tombol.
- `view = 'types'` — daftar jenis gear (konten lama: search + 36 tombol gear +
  toast "masih dalam pengerjaan" — TIDAK diubah).
- Transisi antar view: `framer-motion` `AnimatePresence mode="wait"` dengan
  `viewVariants` yang SAMA PERSIS dengan variants transisi halaman App.jsx
  (hidden: opacity 0, y 12, scale 0.98 / visible: 0.4s easeOut / exit: 0.28s easeIn,
  y -10) — supaya terasa seperti pindah halaman biasa.
- Back: di view 'types' -> kembali ke pemisah (`setView('menu')`, BUKAN `setPage`).
  Di pemisah -> menu utama (`setPage('menu')`, perilaku lama).
- State `query` search DIPERTAHANKAN saat bolak-balik view (tidak di-reset).

### 42.2 Dua Tombol Pemisah (wajib MenuButton3D — Bagian 39)

| Tombol | Warna (3 turunan HSL 1 hue) | Icon SVG custom | Perilaku |
|---|---|---|---|
| **Gears Calculator** subtitle "coming soon" | amber `hsl(38,90%,60%)` / `hsl(38,85%,40%)` / `hsl(38,85%,26%)` | kalkulator (badan menuIconGrad + layar gelap + grid tombol + bar enter) + badge gear kecil pojok kanan-atas (gigi 8 rect @45°, body menuSphereGrad) | `toast.info("Gears Calculator — Coming Soon!")` |
| **Gears Type** subtitle "36 jenis roda gigi" | green `hsl(142,55%,55%)` / `hsl(142,55%,35%)` / `hsl(142,55%,24%)` (identitas family Gears, sama dengan tombol Gears di menu utama) | dua gear saling mengunci: gear besar (gigi 8 rect @45° + body menuIconGrad + highlight bulan sabit + lubang) + gear kecil (gigi 8 rect @22.5° offset + body menuSphereGrad) | `setView('types')` |

- Icon standar Bagian 39.4: SVG literal `width="48" height="48"`, viewBox `0 0 24 24`,
  langsung di slot 56x56 MenuButton3D (rasio 86%, drop-shadow dari slot).
- Sudut gigi gear kecil pakai offset 22.5° dari gear besar supaya terlihat saling
  mengunci (meshing), bukan bertabrakan.

### 42.3 Yang TIDAK Boleh Regresi

- View 'types' = konten lama: search (filter nama), list 36 gear via `gearData`,
  warna per-gear `hexToMenuButtonColors`, icon `GearIcon`, toast per gear — semua
  TIDAK diubah. SATU-SATUNYA perubahan: tombol Back kini ke pemisah.
- Heading GEARS (Orbitron 900, gradient `#4ade80 -> #16a34a`) & deskripsi teks
  dipertahankan di kedua view.
- Jangan tambah routing/halaman baru untuk struktur ini (internal view state cukup).

---

## 43. STRUKTUR HALAMAN LINKAGES — SUBMENU PEMISAH (LINKAGES CALCULATOR / LINKAGES TYPE)

> **Status: STANDAR PERMANEN untuk page `src/pages/LinkagesPage.jsx`.** Direstrukturisasi
> 2026-08-29 atas request user, pola SAMA PERSIS dengan Gears (Bagian 42, lihat
> memory.md Bagian 68): masuk menu Linkages TIDAK langsung ke daftar linkage, tapi
> ke halaman pemisah 2 tombol.

### 43.1 State Machine View (internal, TANPA routing baru)

- `view = 'menu'` (DEFAULT) — halaman pemisah: heading LINKAGES + deskripsi + 2 tombol.
- `view = 'types'` — daftar jenis linkage (konten lama: search + 45 tombol linkage +
  toast "masih dalam pengerjaan" — TIDAK diubah).
- Transisi antar view: `framer-motion` `AnimatePresence mode="wait"` dengan
  `viewVariants` identik App.jsx / GearsPage (hidden: opacity 0, y 12, scale 0.98 /
  visible: 0.4s easeOut / exit: 0.28s easeIn, y -10).
- Back: di view 'types' -> kembali ke pemisah (`setView('menu')`, BUKAN `setPage`).
  Di pemisah -> menu utama (`setPage('menu')`, perilaku lama).
- State `query` search DIPERTAHANKAN saat bolak-balik view (tidak di-reset).

### 43.2 Dua Tombol Pemisah (wajib MenuButton3D — Bagian 39)

| Tombol | Warna (3 turunan HSL 1 hue) | Icon SVG custom | Perilaku |
|---|---|---|---|
| **Linkages Calculator** subtitle "coming soon" | biru `hsl(235,70%,72%)` / `hsl(235,65%,52%)` / `hsl(235,65%,38%)` (identik tombol Linkages di menu utama — kontinuitas hue dari pintu masuk) | kalkulator (badan menuIconGrad + layar gelap + grid tombol + bar enter) + badge crank-rocker pojok kanan-atas (wheel bulat menuSphereGrad + lengan crank menuIconGrad diputar 45° + pin putih + connecting rod + joint ujung) | `toast.info("Linkages Calculator — Coming Soon!")` |
| **Linkages Type** subtitle "45 jenis mekanisme" | green `hsl(142,55%,55%)` / `hsl(142,55%,35%)` / `hsl(142,55%,24%)` (sama dengan Gears Type + heading halaman) | four-bar linkage klasik: ground link bawah (bar menuIconGrad + hatching fix 6 tick putih + 2 pivot tetap menuSphereGrad), crank kiri + coupler atas + rocker kanan (3 bar rect diputar: -65°, 22.6°, -122.6°), 2 joint bergerak bulat menuSphereGrad, + coupler curve dashed putih dengan titik tracer (ciri khas studi linkage) | `setView('types')` |

- Icon standar Bagian 39.4: SVG literal `width="48" height="48"`, viewBox `0 0 24 24`,
  langsung di slot 56x56 MenuButton3D (rasio 86%, drop-shadow dari slot).
- Bar linkage digambar sebagai rect rounded (rx = setengah tinggi) dengan
  `transform=rotate(sudut px py)` dari titik pivot — teknik sama dengan gigi gear
  GearsPage; sudut = `atan2(dy,dx)` antar dua joint.

### 43.3 Yang TIDAK Boleh Regresi

- View 'types' = konten lama: search (filter nama), list 45 linkage via `linkageData`,
  warna per-linkage `hexToMenuButtonColors`, icon `LinkageIcon`, toast per linkage —
  semua TIDAK diubah. SATU-SATUNYA perubahan: tombol Back kini ke pemisah.
- Heading LINKAGES (Orbitron 900, gradient `#4ade80 -> #16a34a`) & deskripsi teks
  dipertahankan di kedua view.
- Jangan tambah routing/halaman baru untuk struktur ini (internal view state cukup).
- Catatan pre-existing (BUKAN regresi, di luar scope page ini): `LinkageIcon` memicu
  warning React "unique key prop" untuk `.map()` internal-nya (line ~394/406/424) —
  sudah ada sebelum restrukturisasi, file tidak disentuh.

---

## 44. BLOCK SIMULATOR V2 — TOOLBAR SECTION BUILD: PATTERN UNIFIED (FIX TOGGLE)

> **Status: STANDAR PERMANEN untuk toolbar `src/pages/BlockSimulator3Dv2.jsx`.** Fix bug
> 2026-08-29 (request user — lihat memory.md Bagian 69): toggle section Build tidak bisa
> menutup menu. Root cause: Build adalah SATU-SATUNYA section dengan pattern berbeda
> (wrapper `maxHeight:'2000px'` + overflow hidden + transition + chevron rotate-transform,
> diperkenalkan commit 4cd5564 utk "smooth animation") sedangkan 8 section lain pakai
> conditional render langsung. Transisi maxHeight pixel arbitrary yang digabung unmount
> konten bersamaan = tidak deterministik di sebagian browser (khususnya Safari/iOS).

### 44.1 Aturan Pattern Section Toolbar (SEMUA 9 section — TANPA kecuali)

- **Header**: div `onClick={() => toggleSection('<key>')}` + conditional icon:
  `{open ? <ChevronDown/> : <ChevronRight/>}` — JANGAN pakai wrapper div dengan
  `transform: rotate()` + transition.
- **Konten**: conditional render langsung `{open && (<>...</>)}` — JANGAN pakai wrapper
  div `maxHeight: <px> / '0'` + overflow hidden + transition (anti-pattern: konten
  tetap unmount instan saat collapse sehingga animasi tak bermakna, dan transisi
  maxHeight dari pixel arbitrary tidak konsisten lintas browser).
- Section Build menyerap panel tool-specific ke DALAM kondisinya: Decal config panel
  (`tool === 'decal'`) + Mirror Axis selector (`tool === 'mirror'`) kini di dalam
  `{openSections.build && (<>...</>)}` — perilaku visible identik dengan versi lama
  (dulu ter-clip oleh wrapper maxHeight saat collapse): hanya tampil saat Build open.

### 44.2 localStorage `blockSimulator_toolbarSections` — Parsing DEFENSIF (WAJIB)

- Nilai disimpan: JSON object `{build,transform,paint,display,bloom,io,groups,material,history}`.
- Parsing WAJIB di-guard: hanya plain object valid yang dipakai; string/number/array/
  null/undefined → fallback ke `DEFAULT_SECTIONS` (mis. data korup / schema lama).
- WAJIB merge `{ ...DEFAULT_SECTIONS, ...parsed }` supaya key yang hilang (schema
  evolusi, mis. versi lama tanpa `groups`) dapat nilai default, bukan `undefined`.
- useEffect sync ke localStorage tetap jalan setiap state berubah (self-healing:
  data korup otomatis tertimpa nilai bersih saat pertama kali render).

## Bagian 45 — Toolbar Block Simulator V2: Tombol MASTER "Build Tools" (Collapse-All)

> 2026-08-30 (request user — lihat memory.md Bagian 70): tombol Build tidak cukup
> hanya menutup konten section Build; user ingin menutup Build = menutup SELURUH
> toolbar (semua section + semua tombol) — "langsung bersih". Tombolnya juga harus
> DIDESAIN BERBEDA dari section header lain untuk menandakan fungsi collapse-all.

### 45.1 Semantik Master Toggle (key `build` di `openSections`)

- `openSections.build` kini berarti MASTER STATE seluruh toolbar:
  - `false` → toolbar bersih total; HANYA tombol master "Build Tools" yang dirender.
  - `true` → seluruh isi toolbar dirender: konten Build + 8 section lain
    (transform/paint/history/groups/display/bloom/io/material).
- Implementasi: SATU master wrapper `{openSections.build && (<> ... </>)}` membungkus
  SELURUH isi toolbar (dibuka tepat setelah tombol master, ditutup tepat sebelum
  `</div>` penutup container `.toolbar-scroll`). Kondisi internal tiap section
  (`openSections.transform && ...` dst.) TIDAK diubah — section tetap bisa di-toggle
  individual saat master terbuka, dan state individualnya persist di localStorage.
- Section MATERIAL (`selectedCount > 0 && ...`) berada DI DALAM master wrapper → saat
  master tertutup, Material ikut hilang (sesuai "seluruhnya"), tapi selection blok di
  scene TIDAK di-reset — saat master dibuka lagi, Material langsung muncul lagi.
- Default `build: false` dipertahankan = first-load bersih (hemat ruang canvas);
  tombol master yang mencolok membuatnya tetap jelas discoverable.
- Pattern tetap conditional render langsung (Bagian 44.1) — TANPA transisi maxHeight.

### 45.2 Design Tombol Master (HARUS beda dari section header biasa)

Section header biasa: text uppercase Orbitron 10px muted + chevron tunggal, tanpa
background. Tombol master HARUS terlihat sebagai "kontrol utama":

- Container: div onClick `toggleSection('build')`, full-width, padding `10px 12px`,
  radius 12, gradient biru→ungu (`rgba(59,130,246,*)` → `rgba(168,85,247,*)`),
  border indigo `rgba(99,102,241,*)`, glow boxShadow + inset highlight atas.
  Saat collapsed gradient LEBIH TERANG + glow lebih kuat (mengundang klik); saat
  expanded lebih tenang.
- Icon chip 30x30 radius 9 gradient `#3b82f6 → #a855f7` + icon `<Wrench>` putih —
  identitas "tools".
- Label "BUILD TOOLS" Orbitron 11px weight 800 letterSpacing 1.5px + subtitle
  dinamis Inter 9px: "Buka semua tools" (collapsed, warna #a5b4fc) /
  "Tutup semua tools" (expanded, warna #94a3b8) — subtitle menegaskan aksi master.
- State indicator: chip 22x22 berisi chevron GANDA `<ChevronsDownUp>` /
  `<ChevronsUpDown>` — beda dari chevron tunggal section biasa (konvensi DCC:
  chevron ganda = collapse-all / expand-all).
- Hover: border terang + glow via onMouseEnter/onMouseLeave (pattern inline style
  file ini).

### 45.3 Pemetaan Struktur (file 21k+ lines — hati-hati saat edit)

- Tombol master + pembuka wrapper: tepat setelah `<style>` scrollbar toolbar
  (cari komentar "MASTER TOGGLE: BUILD TOOLS").
- Penutup wrapper: tepat sebelum `</div>` penutup `.toolbar-scroll` (cari komentar
  "Penutup MASTER WRAPPER build") — SETELAH section Material terakhir, SEBELUM
  panel Shape config (pojok kanan).
- Fragment TIDAK ditutup setelah konten Build — ada komentar penanda "fragment
  master wrapper TIDAK ditutup di sini" sebelum section TRANSFORM.

## Bagian 46 — Master "Build Tools": Subtitle Dihapus + Master State Tidak Dipersist

> 2026-08-30 (request user — lihat memory.md Bagian 71): (1) teks subtitle
> "Buka semua tools"/"Tutup semua tools" DIHILANGKAN — hanya label "BUILD TOOLS"
> yang tampil; (2) master state WAJIB tertutup setiap user masuk halaman
> 3D Block Simulator v2 (mutlak — back / refresh / navigasi ulang apapun),
> harus dibuka manual sendiri.

### 46.1 Subtitle Dihapus

- Div subtitle dinamis di dalam tombol master DIHAPUS total; hanya tersisa
  label "Build Tools" (Orbitron uppercase). fontSize label 11 → 12 supaya
  seimbang saat berdiri sendiri tanpa subtitle.
- Semua elemen design lain (gradient, icon chip Wrench, chevron ganda, hover
  glow, state color collapsed/expanded) TETAP sama — tombol tetap terlihat
  premium & berbeda dari section header biasa.

### 46.2 Aturan Master State Session-Only (WAJIB, dua lapis)

- **Lapis 1 — initializer**: `useState` lazy init mem-parse localStorage
  DEFENSIF (Bagian 44.2) lalu return `{ ...DEFAULT_SECTIONS, ...parsed,
  build: false }` — key `build` DIOBRAK PAKSA false (urutan spread terakhir)
  sehingga nilai legacy `build: true` di storage DIABAIKAN.
- **Lapis 2 — sync effect**: `useEffect` penyimpan localStorage kini menulis
  `{ ...openSections, build: false }` — storage TIDAK PERNAH menyimpan
  `build: true`, sehingga state terbuka tidak pernah bocor ke sesi berikutnya.
- Efek: setiap mount baru halaman (tekan Back lalu balik, refresh browser,
  navigasi ulang dari menu apapun) master SELALU tertutup; toolbar bersih
  total (hanya tombol master). User membuka manual dengan klik tombol.
- State section INDIVIDUAL (transform/paint/display/bloom/io/groups/material/
  history) TETAP persist normal — hanya `build` yang session-only.
- Self-healing tetap jalan: data korup/schema lama di-merge default, dan
  `build:true` legacy otomatis tertimpa `false` saat render pertama.

## Bagian 47 — Tool State Fresh-Entry: null (Tidak Memegang Tool Apapun)

> 2026-08-30 (request user — lihat memory.md Bagian 72): saat baru masuk
> halaman 3D Block Simulator v2, tool state TIDAK BOLEH otomatis 'place' —
> user harus dalam kondisi "state 0" (tidak memegang apapun). Tool baru aktif
> setelah user klik tombolnya secara eksplisit. Berlaku mutlak setiap fresh
> entry (back / refresh / navigasi ulang).

### 47.1 Aturan Default Tool (WAJIB)

- Inisialisasi: `useState(null)` + `useRef(null)` untuk tool/toolRef
  (sebelumnya `'place'`). Komentar union type diupdate: `null | 'place' | ...`.
- Tool TIDAK di-persist ke localStorage (memang tidak pernah) DAN komponen
  di-conditional-render App.jsx (`{page === 'block-simulator-3d-v2' && ...}`)
  → pindah halaman = unmount → remount otomatis mulai dari null. Dua jaminan
  ini membuat fresh entry SELALU state 0 tanpa perlu pengaman tambahan.

### 47.2 Kenapa null Aman (audit semua konsumen `tool` / `toolRef.current`)

- **Click handler** (onWindowMouseUp): dispatch via rantai `if/else if
  (currentTool === '...')` — null tidak match branch manapun → klik canvas =
  no-op persis seperti yang diminta (tidak place/delete/apa-apa).
- **Mouse move handler**: `null` masuk branch `else` terakhir → ghost preview
  hide + highlight null (sudah safe sejak awal).
- **Highlight tombol toolbar**: semua `tool === 'xxx' ? <warna> : <default>`
  → null = semua tombol tampil non-aktif (border default abu transparan).
- **Effect LEFT mouse config** (`[tool]`): null bukan move/rotate/scale →
  LEFT = PAN (pan camera tetap bisa di empty space, konsisten tool non-gizmo).
- **Panel kondisional** (`tool === 'shape'/'mirror'/'decal'/'object'`): null =
  semua panel tertutup.
- **Keyboard**: hanya WASD/QE/Shift fly-camera — tidak ada shortcut tool yang
  perlu di-guard. Auto-switch eyedropper→paint hanya jalan di branch paint
  (tidak tercapai saat null).
- Material Inspector hover: independent dari tool — tetap jalan normal.

### 47.3 UX yang Dihasilkan

- Fresh entry: toolbar bersih (master tertutup, Bagian 46) + tak ada tool
  aktif. User klik "Build Tools" → pilih tool yang diinginkan → baru bekerja.
- Klik canvas saat state 0 tidak melakukan apa-apa (no block muncul) —
  sesuai permintaan "benar-benar state 0 tidak memakai apapun".

## Bagian 48 — HUD "Build Mode" Badge: Hanya Muncul Saat Tool Aktif

> 2026-08-30 (request user — lihat memory.md Bagian 73, dilengkapi screenshot
> referensi): badge HUD "Build Mode" (panel gelap border magenta di bottom-center
> berisi "Build Mode" + "L-Click <tool> • R-Click orbit • Mid-Click pan • WASD
> move") harus muncul HANYA saat user memakai/memegang tool aktif. Jika tidak
> memakai tool apapun (state 0, fresh entry, tidak memencet apapun) → badge
> disembunyikan total "seolah tidak ada di situ".

### 48.1 Perubahan (minimal, 1 file: BlockSimulator3Dv2.jsx, +4/-1)

- Badge sebelumnya "permanent info panel" (render tanpa syarat, komentar lama
  di JSX) → kini dibungkus `{tool && ( ... )}`.
- Kondisi selaras dengan aturan tool state Bagian 47: `tool === null` (state
  0) = badge TIDAK dirender sama sekali (bukan sekadar `display:none` — node
  tidak ada di DOM, "seolah tidak ada").
- Teks instruksi `L-Click ...` di dalam badge TIDAK diubah (tetap rantai
  ternary per tool); karena badge kini hanya tampil saat `tool` ber-value,
  fallback 'pick color' tidak pernah terlihat saat state 0.

### 48.2 Aturan Perilaku (WAJIB)

- Badge muncul ⟺ user memegang tool aktif (klik eksplisit tombol Place/
  Delete/Move/Rotate/Scale/Paint/Eyedropper/Shape/Clone/Mirror/Object/Decal).
- Badge independen dari state master "Build Tools" (Bagian 46): toolbar boleh
  ditutup saat tool masih dipegang → badge TETAP tampil (tool = sumber
  kebenaran, bukan toolbar).
- Fresh entry (back/refresh/navigasi ulang) = tool null (Bagian 47) → badge
  otomatis hilang; dua aturan ini saling mengunci tanpa kode tambahan.
- Deskripsi tool pada badge mengikuti tool aktif (mis. Place → "L-Click place",
  Delete → "L-Click delete", Move → "L-Click select & move").

### 48.3 Verifikasi

- Desktop 1440x900: fresh entry = 0 elemen badge + innerText bersih dari
  "Build Mode"/"L-Click place"; klik Place → badge muncul (style identik
  screenshot user, VLM konfirmasi); klik canvas = 1 Blocks (tool utuh);
  Back → re-enter = badge hilang lagi; tool Delete → "L-Click delete";
  tutup master toolbar saat tool aktif → badge tetap tampil.
- Mobile 390x780: fresh entry = badge hidden (VLM konfirmasi area bottom
  bersih); Place aktif = badge muncul, visible & dalam viewport.
- 0 error console (warning pre-existing: analytics dev + THREE deprecation).

## Bagian 49 — Tool Toggle/Unequip: Klik Tombol Tool Aktif = Lepas Tool

> 2026-08-30 (request user — lihat memory.md Bagian 74): jika klik "Place"
> maka sedang MEMAKAI tool itu; jika klik LAGI tombol "Place" yang sama maka
> sedang TIDAK memakai "Place" (unequip, kembali state 0). Berlaku untuk
> SEMUA tombol tool di 3D Block Simulator v2.

### 49.1 Mekanisme (1 file: BlockSimulator3Dv2.jsx, +16/-12)

- Helper baru diletakkan tepat setelah sync effect toolRef:
  `const toggleTool = (nextTool) => setTool(t => (t === nextTool ? null : nextTool));`
- **12 tombol tool** pakai `toggleTool(...)` via onClick (functional update —
  aman dengan sync `useEffect(() => { toolRef.current = tool; }, [tool])`):
  Place, Delete, Shape, Clone, Mirror, Object (+ default selectedObj tetap
  di-set jika kosong), Decal, Move, Rotate, Scale, Paint, Eyedropper (label
  tombolnya "Pick Color").
- **TIDAK diubah**: auto-switch eyedropper→paint setelah pick warna
  (`setTool('paint')` programatik di click handler) — itu bukan klik tombol
  tool; jika di-togle akan merusak alur UX pick-lalu-paint.

### 49.2 Aturan Perilaku (WAJIB)

- Klik tombol tool saat state 0 / tool lain aktif → equip/pindah ke tool itu.
- Klik tombol tool yang SAMA saat tool itu aktif → unequip (tool = null).
- Unequip = kembali persis ke state 0 (Bagian 47): highlight tombol mati,
  HUD badge "Build Mode" hilang (Bagian 48), panel tool (Shape/Mirror/Decal/
  Object) tertutup, klik canvas = no-op.
- Tool yang aktif karena AUTO-SWITCH (pick color → Paint) juga bisa
  di-unequip via klik tombolnya — konsisten.
- Tool TIDAK di-persist; fresh entry tetap state 0 (Bagian 47 tidak berubah).

### 49.3 Verifikasi

- Desktop 1440x900 — 11 skenario PASS: klik-1 Place equip (border amber
  rgb(245,158,11) + badge "L-Click place"); klik-2 Place unequip (border
  default rgba(148,163,184,0.12), badge+HUD hilang); pindah Place→Move =
  switch (border hijau, "L-Click select & move", bukan toggle); klik-2 Move
  unequip; canvas klik setelah unequip = 0 Blocks (no-op); re-equip Place +
  klik canvas = 1 Blocks; Delete equip→unequip (block tetap, tidak terhapus);
  Shape equip→panel muncul→unequip→semua hilang; Pick Color equip→klik block
  →auto-switch Paint UTUH; Paint (via auto-switch) klik Paint = unequip;
  Back→re-enter = state 0.
- Mobile 390x780: klik-1 Place equip (badge muncul) → klik-2 unequip (badge
  hilang). 0 error console.

## Bagian 50 — UI Click Guard: Klik di Elemen UI Tidak Boleh Nembus ke Scene 3D

> 2026-08-30 (request user — lihat memory.md Bagian 75): klik tombol tool
> (mis. "Place") "nembus ke belakang" dan menaruh block di area lain —
> harusnya klik tools apapun TERTAHAN di jendela UI itu, tidak berinteraksi
> di belakang. Berlaku untuk SEMUA elemen UI & SEMUA tool.

### 50.1 Root Cause

Deteksi click memakai `mousedown`/`mouseup` di **window** (supaya tidak bisa
di-suppress OrbitControls — komentar Phase lama). Validasi lama hanya:
button 0, delta < 5px (click vs drag), bukan dragging gizmo, dan koordinat
**di dalam bounding rect canvas**. Karena canvas full-screen, klik pada
overlay UI apapun (toolbar, tombol tool, header section) KOORDINATNYA selalu
di dalam rect canvas → lolos validasi → raycast jalan → aksi tool (place/
delete/select/dll) tereksekusi "di belakang" UI. Skenario khas: Place aktif →
klik tombol Place ke-2 (unequip) → mouseup fire duluan dgn toolRef masih
'place' → block nyasar ditempatkan → baru click event unequip.

### 50.2 Fix (1 file: BlockSimulator3Dv2.jsx, +11)

Guard `e.target` di kedua handler window:

- `onWindowMouseDown`: hanya mencatat `clickDownPos` jika
  `e.target === renderer.domElement` (klik bermula di canvas). Klik di UI →
  `clickDownPos = null` (tidak pernah jadi kandidat click scene).
- `onWindowMouseUp`: setelah cek delta/gizmo, `if (e.target !==
  renderer.domElement) return;` — klik harus berakhir di canvas.

Guard ini berlaku GLOBAL: SEMUA elemen UI (tombol tool, header section,
master Build Tools, panel, modal, top bar) otomatis tertahan — klik harus
start DAN end di canvas untuk memicu aksi tool.

### 50.3 Aturan Perilaku (WAJIB)

- Klik di elemen UI apapun = interaksi UI murni — tidak pernah memicu aksi
  tool di scene (place/delete/move-select/rotate/scale/paint/eyedropper/
  shape/clone/mirror/object/decal).
- Elemen overlay non-interaktif (pointer-events: none — HUD badge "Build
  Mode", Material Inspector) tetap transparan klik: e.target mereka = canvas
  → klik di area itu tetap berfungsi seperti klik canvas (by design, tidak
  berubah).
- Klik canvas asli: mousedown+mouseup target canvas, delta < 5px → aksi tool
  seperti biasa (fungsi place/delete/select utuh).
- Drag orbit/pan (delta > 5px) tetap tidak memicu aksi tool (perilaku lama).

### 50.4 Verifikasi

- Reproduksi bug SEBELUM fix (bukti mekanisme): dispatch mousedown+mouseup
  bertarget TOMBOL Place + koordinat area scene saat Place aktif → 1 block
  nembus ditempatkan. SETELAH fix → 0 block (klik tertahan di UI).
- Desktop 1440x900: klik fisik tombol Place (unequip) = 0 block; klik canvas
  normal = 1 block (place utuh); Delete via klik TOMBOL dgn koordinat block =
  block selamat; Delete via klik CANVAS = block hilang (utuh); mousedown/up
  di 4 tombol lain (Shape/Clone/Mirror/Object) + koordinat scene saat Place
  aktif = 0 block & Place tetap aktif; drag orbit = 0 block; Move select via
  canvas = "1 Blocks • 1 Selected" (gizmo utuh).
- Mobile 390x780: klik fisik tombol Place (unequip) = 0 block + border
  default. 0 error console. VLM 4/4 (scene kosong, tombol non-aktif, tanpa
  badge, no glitch).

## Bagian 51 — Delete Hover: Outline Tebal Merah Menyala (Ganti Emissive Transparan)

> 2026-08-30 (request user — lihat memory.md Bagian 76): saat memakai tombol
> Delete dan mengarahkan kursor ke block yang ingin dihapus, sistem lama
> (emissive merah transparan menyeluruh) dinilai jelek — diganti menjadi
> OUTLINE TEBAL di tepi object, warna merah tua menyala terang. Berlaku untuk
> APAPUN target delete (block biasa + nested mesh import GLB).

### 51.1 Implementasi (1 file: BlockSimulator3Dv2.jsx)

Teknik "inverted hull / shell outline": mesh duplikat dengan material
BackSide ditambahkan sebagai CHILD dari mesh target, di-inflate via scale.
Back faces shell terletak di belakang front faces object → depth test
menyembunyikan bagian tertutup → hanya ring tepi (silhouette) terlihat.
Sebagai child, outline otomatis mengikuti position/rotation/scale target.

- `highlightBlock(block)` di-rewrite: lepas outline lama → pasang outline
  baru sebagai child mesh target (geometry di-share, tanpa clone).
- `deleteOutlineMesh.raycast = () => {}` — outline TIDAK ikut raycast
  (delete hover / place ghost / material inspector tidak terganggu).
- Material: `MeshBasicMaterial` unlit, warna `0xff0a3c` HDR ×4
  (`multiplyScalar(4)`), `side: BackSide`, **`depthWrite: true`**,
  `toneMapped: false`, `fog: false`.
- `DELETE_OUTLINE_SCALE = 1.3` (inflate 30% → 15% per sisi = tepi tebal).
- Lifecycle: `clearAllBlocks` reset referensi outline; unmount dispose
  `deleteOutlineMat`.
- `setEmissive`/`getEmissiveMaterials` TETAP ADA (dipakai selection highlight
  biru — highlightSelected/unhighlightSelected TIDAK tersentuh).

### 51.2 Catatan Teknis Penting (hasil investigasi mendalam)

- **depthWrite WAJIB true**: grid lantai semi-transparan dirender di pass
  transparent SETELAH pass opaque. Jika shell tidak menulis depth, grid
  lolos depth-test dan blend ~50% di atas ring → outline teredam jadi gelap
  (terukur: putih HDR → (130,131,133) = 50% campuran warna grid). Dengan
  depthWrite:true, grid gagal depth test di area ring → warna full.
- **Warna HDR ×4** menjamin terang di KEDUA jalur render: bloom OFF (direct
  render + toneMapped:false → clamp (255,10,60) terang penuh; terukur
  (255,29,118)) dan bloom ON (composer OutputPass ACES — ACES(4.0)≈0.97 →
  tetap terang; nilai LDR biasa akan dipadatkan ACES jadi ~50%).
- Warna final terukur di jalur default: **(255,29,118)** — crimson menyala.
- Verifikasi pixel: 284+ piksel merah terang dominan (255,29,118), ring 4px
  pada block proyeksi 33px (proporsional 15% per sisi di semua zoom).

### 51.3 Aturan Perilaku (WAJIB)

- Hover cursor di atas block/object apapun saat Delete aktif → outline tebal
  merah menyala muncul mengikuti tepi object; warna asli object TIDAK berubah.
- Kursor meninggalkan object / pindah tool → outline hilang total.
- Outline mengikuti persis mesh yang akan dihapus oleh click handler delete
  (hits[0].object) — block biasa maupun nested mesh hasil import GLB.
- Fungsi delete klik, ghost preview place, selection highlight biru, material
  inspector — semuanya tidak berubah perilakunya.

### 51.4 Verifikasi

- Desktop 1440x900: outline tebal terang muncul saat hover (pixel + VLM 2/2:
  "thick bright glowing red outline" + "faces still blue"); hover ke area
  kosong → hilang; klik canvas → block terhapus (fungsi utuh); place +
  ghost normal; Move select "1 Blocks • 1 Selected" + gizmo normal; selection
  highlight biru utuh; ganti tool → outline hilang; 0 error console.
- Mobile 390x780: tidak crash; place via canvas jalan; UI click guard tetap
  memblokir klik toolbar (tidak nembus).

## Bagian 52 — Fix Warna Delete Hover Outline: Pink → Merah Darah Terang

> Task ID 15. Feedback user: warna outline Task 14 masih PINK terang
> (terukur (255,29,118)), padahal request = MERAH DARAH terang. Akar masalah:
> hex `0xff0a3c` memiliki channel biru 60 — setelah HDR ×4 + konversi
> linear→sRGB di output, biru ter-amplifikasi menjadi 118 di layar = tampak
> pink/magenta. Fix: channel biru diturunkan ke 10 (`0xff0a0a`) → render
> final (255,29,29) = merah darah murni tanpa bias biru.

### 52.1 Perubahan (1 file: BlockSimulator3Dv2.jsx, +4/-2)

SATU-SATUNYA perubahan kode: baris warna material outline.

```js
// SEBELUM:
color: new THREE.Color(0xff0a3c).multiplyScalar(4),  // → (255,29,118) PINK
// SESUDAH:
color: new THREE.Color(0xff0a0a).multiplyScalar(4),  // → (255,29,29) MERAH DARAH
```

Ditambah komentar dokumentasi di atas baris tersebut (penjelasan mengapa
channel biru tidak boleh dinaikkan: blue 60 di versi lama ter-HDR×4 jadi
(255,29,118) = PINK). SEMUA properti lain TIDAK disentuh: BackSide,
depthWrite:true, toneMapped:false, fog:false, scale 1.3, HDR ×4, lifecycle,
raycast disabled — arsitektur Task 14 utuh 100%.

### 52.2 Matematika Warna (kenapa 0xff0a0a = merah darah)

Pipeline: hex sRGB → THREE.Color (konversi ke linear) → ×4 (HDR) → render
dengan toneMapped:false → konversi linear→sRGB output → clamp 255.

- R: 255 → linear 1.0 → ×4 = 4.0 → clamp = 255 (saturasi penuh).
- G=B: 10/255 → linear 0.0030 → ×4 = 0.0121 → sRGB ≈ 29.
- Final: **(255,29,29)** — verah darah terang menyala, G=B (netral hangat),
  TANPA bias biru. Bandingkan lama: (255,29,118) — B=118 >> G=29 = pink.
- Aturan praktis ke depan: untuk warna "merah" apapun di material HDR ini,
  jaga channel biru ≤ ~10; biru di-linearisasi lalu di-×4 lalu di-gamma
  naik ~12× di layar.

### 52.3 Verifikasi (semua PASS — 3 viewport)

- Desktop 1440x900 (viewport kanonik sesi sebelumnya): outline ON saat
  hover = 415 px dominan **(255,29,29)**; VLM 3/3: "pure/blood red (not
  pink/magenta)" + "thick and clearly visible" + "cube face inside is
  blue". Hover away = 0 px merah; delete klik = block terhapus; re-place
  jalan; Move select "1 Blocks • 1 Selected" + highlight biru utuh; unequip
  = badge hilang; 0 error console.
- Desktop 1280x577 (viewport default headless): 189 px dominan (255,29,29)
  + VLM "pure red / blood red, thick, blue face".
- Mobile 390x780: ghost mengikuti mouse; place = block terlihat; hover =
  outline **(255,29,29)** 362 px; hover away = 0 px; delete klik = 0
  Blocks; 0 error console.
- Ekuivalensi old-vs-new: flow identik dijalankan dengan kode lama
  (git stash) — perilaku fungsional 100% sama, satu-satunya beda = warna
  (pink lama vs merah darah baru). Perubahan terbukti zero-side-effect.

### 52.4 Pelajaran Testing (penting untuk sesi berikutnya)

- **Popup Material Inspector mengecoh scan pixel**: popup muncul mengikuti
  mouse saat hover block dan berisi swatch biru #3b82f6 + elemen biru lain
  → blob biru di screenshot = block + popup menyatu. Jangan ukur posisi/
  ukuran block dari scan warna biru saja; pakai popup DOM sebagai detektor
  hit (raycast) dan diff-screenshot untuk gerakan.
- **Mobile: toolbar menutupi ~60% kiri canvas** (390px lebar). Klik test di
  x<230 = menempatkan block DI BELAKANG toolbar (tidak terlihat, raycast
  tetap kena). Selalu klik area grid terlihat (x>250) saat test mobile.
- Probe raycast satu-per-satu dengan sleep (loop sinkron tidak memberi
  React waktu render → hasil palsu semua-miss).

## Bagian 53 — Header: Button Hijau "Build Area" (Coming Soon) + Geser Reset Camera & Clear All

### 53.1 Ringkasan

User minta button baru **"Build Area"** warna **hijau** tepat disamping
badge "Three.js" di header 3D Block Simulator v2. Saat dipencet → modal
peringatan **"COMING SOON — MASIH DALAM PENGERJAAN"** (bukan browser
alert). Button "Reset Camera" & "Clear All" otomatis bergeser ke kanan
memberi ruang.

### 53.2 Spesifikasi Implementasi (murni aditif, 125 baris, 0 deletions)

- **State**: `showBuildAreaSoon` + setter, dideklarasikan tepat setelah
  `showResetCameraConfirm` (baris ~148), komentar `// Build Area "Coming Soon" modal state`.
- **Button** (`<button>` setelah `</span>` badge Three.js, sebelum Reset
  Camera): ikon `Hammer size={14}` (sudah diimpor lucide-react, TIDAK
  menambah import), label "Build Area", `title="Build Area — Coming Soon"`,
  `marginLeft: 8` (transisi badge→button konsisten dengan Reset Camera).
- **Palet hijau emerald** (selaras pola Reset Camera cyan / Clear All merah):
  - Border: `1px solid #10b981` · BG: `rgba(16,185,129,0.12)` · Teks: `#34d399`
  - Hover: BG `rgba(16,185,129,0.25)` + `scale(1.05)` + glow
    `boxShadow 0 0 12px rgba(16,185,129,0.4)`; leave = kembali semula.
- **Modal** (setelah modal Reset Camera, sebelum penutup root): pola IDENTIK
  modal Clear All/Reset Camera — overlay fixed `rgba(0,0,0,0.75)` blur 8px
  zIndex 1000, kartu `rgba(14,20,32,0.98)` border `2px solid #10b981`
  radius 16 glow ganda, ikon Hammer 24 dalam kotak 48×48 hijau, judul
  Orbitron "Build Area", subtitle hijau bold "COMING SOON — MASIH DALAM
  PENGERJAAN", body Inter 14px #cbd5e1 (bahasa Indonesia, sapaan "kamu"),
  satu tombol solid `#10b981` "Oke, Mengerti" (hover `#059669` translateY
  -2px). Referensi `animation: fadeIn/slideUp` SENGAJA sama dengan modal
  existing (keyframe memang tak terdefinisi di file — perilaku no-op,
  konsisten, dilarang menambah keyframe karena akan mengubah perilaku
  modal lain yang sudah stabil).

### 53.3 Verifikasi (browser 1600×900, dev server 5173)

- Geometri via getBoundingClientRect: badge Three.js right=600 → Build
  Area left=618 (gap 18px) → Reset Camera left=741 → Clear All left=878.
  computed style Build Area: color `rgb(52,211,153)`, border
  `rgb(16,185,129)`, bg `rgba(16,185,129,0.12)` — hijau emerald sesuai permintaan.
- Klik Build Area → modal muncul (visible, title "Build Area", subtitle
  "COMING SOON — MASIH DALAM PENGERJAAN", tombol "Oke, Mengerti"); klik
  tombol → modal tertutup bersih.
- VLM header: Build Area hijau ✓ tepat kanan badge Three.js ✓ Reset
  Camera & Clear All di kanannya ✓ layout bersih tanpa overlap ✓.
- VLM modal: judul/subtitle benar ✓ aksen hijau emerald ✓ tombol hijau
  "Oke, Mengerti" kanan-bawah ✓ polished & center dengan overlay gelap ✓.
- Regresi tetangga: modal Reset Camera buka+tutup (Batal) OK; modal Clear
  All buka+tutup (Batal) OK; `agent-browser errors` = 0 error.
- Catatan: `find text "Reset Camera"` gagal setelah modal ditutup (refs
  kadaluarsa) — gunakan snapshot ulang + `click @ref` atau `find role
  button click --name "Batal"`.

## Bagian 54 — Icon "Build Area": Palu → Miniatur Area Build (Grid Floor Perspektif + Block)

### 54.1 Ringkasan

User: icon palu SALAH — icon harus menggambarkan **area build itu
sendiri** (grid floor tempat membangun) yang dijadikan icon. Dibuat
komponen `BuildAreaIcon` — SVG custom (bukan lucide): grid floor
perspektif (diamond + garis grid 3x3, meniru GridHelper 60x60) + block
isometrik hijau 3-shade di atasnya.

### 54.2 Spesifikasi Implementasi (aditif +47/−2 baris)

- **Komponen `BuildAreaIcon({ size })`** di file scope (setelah
  `const GRID_SIZE = 30`, sebelum `export default function`), murni
  presentational — viewBox 24, `aria-hidden`, `flexShrink: 0`.
- **Geometri SVG**:
  - Grid floor: rhombus T(12,5.5) R(21.5,10.25) B(12,15) L(2.5,10.25),
    stroke `currentColor` width 2 (outline) + 4 garis grid interior 3x3
    (stroke 1.4, opacity 0.6) — dihitung dari titik 1/3 & 2/3 tiap edge
    sehingga presisi simetris.
  - Block isometrik di tengah grid: footprint half-width 2.5 / half-height
    1.25 / tinggi 2.6; 3 face fill solid — top `#34d399` (terang), kanan
    `#10b981`, kiri `#059669` — plus outline silhouette `#34d399`
    stroke 1.4 (termasuk edge vertikal depan & V top). Fill solid =
    mem-mask garis grid di belakang block (block tampak "duduk" DI ATAS
    grid, garis grid muncul di sisi kiri/kanan/depan).
- **Pemakaian**: `<BuildAreaIcon size={14} />` di button header (ganti
  `<Hammer size={14} />`), `<BuildAreaIcon size={24} />` di modal Coming
  Soon (ganti `<Hammer size={24} />`). `currentColor` mengikuti warna
  button/modal (#34d399) sehingga grid ikut hijau.
- **DILARANG menyentuh**: `<Hammer size={15} />` di tombol tool Place
  toolbar (line ~14030, hasil task "replace Place icon Plus→Hammer") —
  import lucide `Hammer` TETAP dipakai, tidak dihapus.

### 54.3 Verifikasi (browser 1600×900)

- Runtime eval: button Build Area berisi custom SVG (bukan class lucide),
  viewBox 24, 6 path, 3 face fill #059669/#10b981/#34d399; modal icon 24px
  sama.
- VLM zoom 4× button: BUKAN palu ✓ grid floor perspektif + cube hijau
  dengan shading 3D (top terang, side gelap) ✓ crisp & aligned ✓.
- VLM zoom 3× modal: grid floor + cube ✓ crisp di ukuran besar ✓ match
  tema hijau modal ✓.
- Regresi: icon Hammer tool Place tetap utuh (verifikasi runtime: buka
  section Build Tools → 1 icon `.lucide-hammer` di button "Place");
  `agent-browser errors` = 0.
- Catatan: section Build Tools default TERTUTUP (MASTER build:false) →
  tombol Place tidak ada di DOM sampai section dibuka; cek regresi icon
  toolbar harus buka section dulu.

## Bagian 55 — Icon "Build Area" Diperbesar (Geometri Full-ViewBox + Render 20px/32px)

### 55.1 Root Cause Icon Tampak Kecil

User: "kok kecil gitu? gak kelihatan dong. gedein lah" (dengan screenshot
zoom button). Analisis VLM screenshot konfirmasi: icon tampak ~setengah
dari icon lucide tetangga. Penyebab GANDA:
1. Geometri SVG lama hanya mengisi ~40% tinggi viewBox (rhombus y 5.5-15
   dari 24) — icon lucide tetangga mengisi hampir penuh viewBox, jadi
   pada px yang sama icon custom tampak jauh lebih kecil.
2. Ukuran render hanya 14px (sama seperti RotateCcw/Trash2 tetangga).

### 55.2 Perbaikan (diff +17/−14, hanya komponen icon & 2 call site)

- **Geometri baru mengisi viewBox penuh**: grid rhombus T(12,10)
  R(22.5,16) B(12,22) L(1.5,16) — tinggi 12 unit (vs 9.5 lama), lebar 21;
  grid interior 3x3 digambar presisi di titik 1/3 & 2/3 edge
  ("M5 14 L15.5 20 M8.5 12 L19 18 M15.5 12 L5 18 M19 14 L8.5 20").
- **Block isometrik lebih besar**: footprint half-width 4 / half-height 2
  (vs 2.5/1.25), tinggi block 6.5 (vs 2.6); base diamond di center grid
  (12,13.5), top face y=5 → total gambar span y 5-22 = 17 unit (71%
  viewBox) dan x 1.5-22.5 (87.5%).
- **Stroke lebih tegas** untuk keterbacaan kecil: grid interior 1.4→1.5
  + opacity 0.6→0.75; outline block 1.4→1.5.
- **Ukuran render**: header button 14→**20px** (bounding SVG 20×20 vs
  tetangga 14×14; button jadi 111×34 vs tetangga ~32px tinggi — tetap
  center-aligned rapi); modal Coming Soon 24→**32px** (mengisi box ikon
  48×48 dengan padding 8px). Default prop size 14→20.
- Komentar anti-regresi di komponen: "Geometri HARUS mengisi hampir
  penuh viewBox... Jangan kecilkan lagi."
- **TIDAK disentuh**: style button (padding/radius/warna), button
  Reset Camera & Clear All, icon Hammer tool Place, layout header.

### 55.3 Verifikasi (browser 1600×900)

- Runtime eval: icon header 20×20 (tetangga 14×14), button Build Area
  111×34; icon modal 32×32 dalam box 48×48.
- VLM zoom 4× header: icon LARGE & clearly visible ✓ grid floor + cube
  jelas ✓ 3 shade hijau mudah dibedakan ✓ proporsional, tidak cramped ✓.
- VLM zoom 3× modal: icon large & prominent mengisi box ✓ crisp ✓.
- Regresi: tool Place masih ber-icon Hammer ✓; Build Area right=729 <
  Reset Camera left=747 (no overlap, gap 18px) ✓; 0 console error ✓;
  modal buka/tutup normal ✓.
- Efektif icon tampak ~2.6× lebih besar (0.71×20px ≈ 14px visible vs
  0.40×14px ≈ 5.5px visible sebelumnya).

## Bagian 56 — Icon "Build Area": Garis Ditipiskan (Wujud Grid + Block Jadi Terbaca)

### 56.1 Masalah

User: "iconnya garisnya ketebalan, jadi gak kelihatan sebenarnya itu
wujudnya wujud apa? tolong tipisin". Pada render 20px, stroke tebal
(outline grid 2 + interior/block 1.5, discale 0.83 = 1.67px/1.25px)
membuat garis-garis saling menumpuk — wujud grid floor + block tidak
terbaca, terlihat seperti gumpalan.

### 56.2 Perbaikan (diff +7/−5, hanya nilai stroke + komentar)

- Grid floor outline: strokeWidth **2 → 1.5** (render ~1.25px di 20px).
- Grid interior 3x3: strokeWidth **1.5 → 1** (~0.83px), opacity
  0.75 → 0.7 (tetap terlihat, tidak dominan).
- Block outline: strokeWidth **1.5 → 1** (~0.83px) — face fill solid
  tetap dominan, outline hanya memberi ketegasan edge.
- Komentar anti-regresi ditambah: "Stroke sengaja TIPIS (outline grid
  1.5, interior & block 1.0) — versi tebal (2/1.5) bikin wujud tidak
  terbaca; jangan tebalkan lagi."
- Geometri, ukuran render (20px/32px), warna, dan pemakaian TIDAK
  diubah — murni ketebalan garis.

### 56.3 Verifikasi (browser 1600×900)

- Runtime eval: stroke-width SVG = [1.5, 1, 1], opacity interior 0.7,
  size 20 — sesuai desain.
- VLM zoom 5× header: garis THIN & crisp ✓ wujud grid floor perspektif
  + cube hijau jelas terbaca ✓ garis grid interior mudah dipisah,
  tidak blur ✓ keseluruhan shape readable ✓.
- VLM zoom 4× modal (32px): tipis & crisp ✓ subjek jelas ✓ elegan &
  profesional, tidak clunky ✓.
- Regresi: tool Place ber-icon Hammer utuh ✓; Build Area right <
  Reset Camera left (gap 18px, no overlap) ✓; 0 console error ✓.

## Bagian 57 — Icon "Build Area": Kontras 3 Sisi Kubus Diperlebar (Gelap/Sedang/Terang)

### 57.1 Masalah

User: "sisi sisi kubusnya ada yang terlalu terang, sisi sisinya gak
kelihatan. harus ada sisi yang gelap, sisi yang agak terang, dan sisi
terang". Shade lama (#059669 kiri / #10b981 kanan / #34d399 top) adalah
emerald 600/500/400 — terlalu berdekatan, di render 20px sisi-sisi
menyatu jadi flat.

### 57.2 Perbaikan (diff +11/−7, hanya fill 3 face + komentar)

- Kiri (GELAP): #059669 → **#065f46** (emerald-800)
- Kanan (SEDANG): #10b981 → tetap (emerald-500)
- Top (TERANG): #34d399 → **#6ee7b7** (emerald-300)
- Jarak shade: 600/500/400 (berdekatan) → **800/500/300** (3 tingkat
  jelas). Outline kubus tetap #34d399 stroke 1 — di antara top & sisi,
  berfungsi sebagai definisi edge di semua face.
- Komentar anti-regresi: "3 shade kontras jelas: kiri GELAP, kanan
  SEDANG, top TERANG (jangan dirapatkan lagi)". Geometri/ukuran/stroke
  tidak diubah.

### 57.3 Verifikasi (browser 1600×900)

- Runtime eval: fills = [#065f46, #10b981, #6ee7b7] sesuai desain.
- VLM zoom 5× header: 3 shade berbeda jelas (dark left / medium right /
  bright top) ✓ mudah dibedakan sekilas ✓ kubus terbaca jelas sebagai
  blok 3D ✓.
- VLM zoom 4× modal: 3 shade distinct ✓ bentuk 3D isometrik jelas
  terbaca di 32px ✓.
- Regresi: tool Place ber-icon Hammer utuh ✓; gap 18px no overlap ✓;
  0 console error ✓.

## Bagian 58 — Icon "Build Area": 3 Sisi Kubus Semua Gelap (Revisi Final User)

### 58.1 Perubahan Permintaan

User membatalkan skema gelap/sedang/terang (Bagian 57): "ah gak jadi,
sisanya 2 sisi kubus jadi gelap juga, jadi 3 sisi gelap". Semua face
kubus kini GELAP.

### 58.2 Implementasi (diff +14/−12, hanya fill 3 face + komentar)

- Kiri: #065f46 → **#022c22** (emerald-950, paling gelap)
- Kanan: #10b981 → **#064e3b** (emerald-900)
- Top: #6ee7b7 → **#065f46** (emerald-800)
- Strategi: 3 shade gelap bergradasi halus (950/900/800) BUKAN satu
  warna sama persis — face tetap bisa dibedakan samar; bentuk kubus
  tetap tegas lewat outline terang #34d399 (tetap, tidak diubah).
  Kalau 3 face satu warna persis, kubus jadi silhouette flat tanpa
  kedalaman — outline saja tidak cukup menunjukkan 3 face.
- Outline kubus #34d399 stroke 1 TIDAK diubah — sekarang berperan
  sebagai kontras utama yang menegaskan edge kubus gelap.
- Komentar anti-regresi: "3 sisi SEMUA GELAP (user final)... Jangan
  dibuat terang lagi — user sudah eksplisit minta gelap."
- Geometri/ukuran/stroke/grid tidak diubah.

### 58.3 Verifikasi (browser 1600×900)

- Runtime eval: fills = [#022c22, #064e3b, #065f46].
- VLM zoom 5× header: ketiga face dark green ✓ ada gradasi subtle ✓
  bentuk 3D tetap jelas lewat outline terang ✓ terbaca sebagai solid
  dark block ✓.
- VLM zoom 4× modal: semua face dark green ✓ bentuk 3D tetap jelas ✓.
- Regresi: tool Place ber-icon Hammer utuh ✓; gap 18px no overlap ✓;
  0 console error ✓.

## Bagian 59 — Header Block Sim v2: Gap Antar 3 Tombol Diseragamkan 18px (Task ID 22)

### 59.1 Latar

User: gap antara "Build Area" → "Reset Camera" → "Clear All" beda-beda,
tidak rapi. Pengukuran aktual (1600×900) sebelum fix:
Build Area → Reset Camera = 18px, Reset Camera → Clear All = 10px.

Akar masalah: ketiga tombol hidup di container title-group
(gap: 10). Build Area & Reset Camera masing-masing punya marginLeft: 8
(total 10+8 = 18px), tapi Clear All TIDAK punya marginLeft → gap-nya
cuma 10px.

### 59.2 Implementasi (diff +5/−1, satu properti + komentar)

- Clear All button: tambah `marginLeft: 8` (posisi persis setelah
  fontFamily, meniru pola 2 tombol lainnya).
- Semua gap antar tombol kini seragam: gap parent 10 + marginLeft 8
  = **18px**.
- Komentar anti-regresi di atas tombol: "marginLeft: 8 WAJIB ada...
  Jangan dihapus lagi (dulu gap Reset Camera→Clear All cuma 10px)".
- Tidak ada properti lain yang disentuh (warna, padding, border, hover,
  ukuran icon, posisi tombol lain semua utuh).

### 59.3 Verifikasi (browser 1600×900)

- Runtime eval: gap Build Area→Reset Camera = 18px, gap Reset Camera→
  Clear All = 18px → SERAGAM.
- Free space kanan Clear All 137px → setelah +8px masih 129px; parent
  nowrap, tidak ada overlap/wrap.
- Vertical: semua tombol center-aligned (center Y = 33px semua); height
  Build Area 34px vs lainnya 32px = kondisi lama yang disengaja
  (icon Build Area 20px per Bagian 56) — TIDAK disentuh.
- VLM zoom 3×: gap equal ✓ rapi ✓ no overlap ✓.
- Regresi: 3 modal (Build Area/Clear All/Reset Camera) open+close
  normal ✓; tool Place ber-icon lucide-hammer size 15 utuh ✓;
  0 console error ✓.

## Bagian 60 — Toolbar Block Sim v2: Undo/Redo Pindah ke Atas Place, Section "History" Dihapus (Task ID 23)

### 60.1 Latar

User: "undo dan redo berada di atas 'place' jadi urutannya undo,
kemudian redo, baru build lalu delete... jadi 'history sudah tidak
ada' itu sudah masuk bagian lain". Maksudnya: tombol Undo & Redo
dipindah dari section "History" (collapsible terpisah, di tengah
toolbar) ke ATAS tombol Place di section Build; section "History"
dihapus karena isinya sudah merged ke Build.

### 60.2 Implementasi (diff +50/−61)

- INSERT 2 tombol (Undo hijau #22c55e, Redo biru #3b82f6) sebagai anak
  PERTAMA master wrapper `{openSections.build && (<>`, sebelum tombol
  Place. Urutan final: Undo, Redo, Place, Delete, Shape, Clone, Mirror,
  Object, Decal, lalu section Transform dst.
- DELETE section "History" lengkap (header div + `{openSections.history
  && (...)}` conditional) — diganti komentar anti-regresi "Jangan bikin
  section History terpisah lagi".
- Style tombol mengikuti pola tombol Build section (full-width row,
  padding 8px 14px, gap 8, fontSize 13, fontWeight 500, icon 15) supaya
  konsisten dengan sibling; identitas warna + disabled state (abu,
  opacity 0.5, cursor not-allowed) dipertahankan persis dari versi lama.
- Komentar basi di-update: urutan toolbar (line ~13925), daftar section
  master toggle (history dihapus dari list), key state `history: false`
  (dipertahankan untuk compat localStorage lama — tidak dibaca JSX lagi).
- TIDAK disentuh: logic doUndo/doRedo/recordHistory (line ~12775-12888),
  shortcut Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z (window keydown), state
  canUndo/canRedo, MAX_HISTORY 50, undoStack/redoStack.

### 60.3 Verifikasi (browser 1600×900)

- Runtime eval: toolbarButtons = [Undo, Redo, Place, Delete, Shape,
  Clone, Mirror, Object, Decal, Move, Rotate, Scale] — urutan benar.
- Section History: benar-benar hilang dari DOM; section lain (Groups,
  Display, Transform, Import, Bloom) tetap ada & toggle normal.
- Fungsional: klik Place → klik canvas → Undo enabled → klik Undo →
  Redo enabled → klik Redo → Undo enabled lagi (siklus penuh).
- Keyboard: Ctrl+Z terpicu (state flip undoEnabled false / redoEnabled
  true) — listener window tidak terpengaruh.
- VLM zoom 3×: urutan Undo, Redo, Place (hammer), Delete (trash) ✓;
  tidak ada header "History" ✓; tombol disabled tampak grayed-out ✓;
  semua tombol konsisten size/alignment/padding ✓.
- Regresi: Hammer lucide-hammer size 15 di Place utuh ✓; gap header
  18px & 18px (Bagian 59) utuh ✓; modal Build Area open/close normal ✓;
  0 console error ✓.

## Bagian 61 — Fix Fundamental Undo/Redo: Stack Mechanics + Baseline (Task ID 24)

### 61.1 Latar (bug report user)

User: "saya letakkan 1 block lalu saya undo, harusnya hilang kan block
nya? nah ini dia malah gak hilang... kadang redo tidak bisa memunculkan
block yang hilang... harusnya undo dan redo ini sifatnya UNIVERSAL —
rotate, move, scale, apapun. bisa memundurkan atau memajukan kondisi
apapun. ini harus mahakuasa."

### 61.2 Akar Masalah (DIAGNOSIS KODE)

Mekanika stack undo/redo LAMA terbalik secara fundamental:
1. `recordHistory()` dipanggil SETELAH tiap aksi (post-action) di
   SEMUA call site (place/delete/shape/paint/clone/mirror/object/
   gizmo/clearAll/import) → snapshot yang di-push ke undoStack SUDAH
   berisi hasil aksi (block yang baru di-place IKUT masuk snapshot).
2. `doUndo()` lama: pop top stack (= kondisi live sekarang) lalu
   me-restore state yang sama persis → VISUAL NO-OP. Block tidak
   hilang saat undo — persis bug yang user lapor.
3. Tidak ada BASELINE (kondisi awal scene) di stack — tidak ada
   state tujuan untuk "kembali ke awal".
4. `doRedo()` lama juga me-restore state == live → redo gagal
   memunculkan block yang hilang.

### 61.3 Implementasi (diff +80/−10, semua di blok 12775-12936 + 3 baris generateTerrain)

INVARIANT BARU: undoStack = urutan state TERMASUK state live saat ini
(top == kondisi scene). Entry[0] = baseline. recordHistory() TETAP
post-action (semua call site tidak diubah!).

- `doUndo`: guard `length < 2` (di baseline tidak bisa mundur lagi);
  push LIVE snapshot ke redoStack (robust terhadap mutasi tak-tercatat);
  pop top (duplikat kondisi live); restore entry DI BAWAHNYA (kondisi
  sebelum aksi terakhir).
- `doRedo`: pop dari redoStack → push ke undoStack → restore.
- `recordHistory`: canUndo kini `length >= 2` (bukan `> 0`).
- BASELINE: `undoStack.push(snapshotState())` sekali di init (scene
  mulai kosong, blocks: [] line 11897 — dikonfirmasi via kode).
- `snapshotState` FIX KRITIS PENDAMPING: mesh ber-flag importedGlb
  (import GLB/FBX/OBJ/USD + Object Library + terrain + clone/mirror
  dari import) TIDAK lagi diserialisasi jadi kubus — disimpan sebagai
  REFERENSI MESH HIDUP + transform. Tanpa ini, begitu undo benar-benar
  bekerja, semua model import akan terdegrade jadi BoxGeometry 1×1×1
  (regresi baru yang sebelumnya tersembunyi karena undo = no-op).
  Aman karena semua mesh imported di-flatten ke scene
  (processImportedObject pakai scene.attach → parent = scene identity
  → world == local).
- `restoreState`: mesh imported TIDAK di-dispose saat removal (snapshot
  memegang referensi hidupnya); rebuild punya path live-reference
  (re-apply transform tersimpan + scene.add); reset refs hover
  (highlightedBlock/deleteOutlineMesh) supaya tidak dangling.
- `generateTerrain`: + recordHistory call (terrain kini undo-able).
- Trim redoStack juga di-cap MAX_HISTORY (safety).

### 61.4 Verifikasi (browser 1600×900, SEMUA PASS)

- PLACE→UNDO (bug utama): place 1 block → counter "1 Blocks" → klik
  Undo → **"0 Blocks" — BLOCK HILANG** ✓ (bug user fixed).
- UNDO→REDO: 0 → klik Redo → "1 Blocks" — block MUNCUL LAGI ✓.
- Multi-step: place×3 → undo×4 → 0 (undo ke-4 = no-op guard, tombol
  disabled di baseline) → redo×3 → 3 Blocks ✓ navigasi penuh.
- DELETE→UNDO: delete → 2 Blocks → undo → 3 Blocks (block kembali) ✓.
- MOVE→UNDO (universal!): Move tool → klik block → drag gizmo X-axis
  (real mouse) → screenshot beda 36864 px → Undo → beda vs before
  tinggal 15209 px (sisa = panel UI inspector, bukan scene) → VLM
  side-by-side: "cube positions in A and C are IDENTICAL — the move
  was successfully reverted" ✓.
- Keyboard: Ctrl+Z mundur 3→2 Blocks, Ctrl+Y maju 2→3 ✓ (konsisten
  dengan stack baru).
- State awal: "0 Blocks", Undo disabled (baseline 1 entry) ✓.
- Regresi: toolbar order [Undo, Redo, Place, Delete, Shape] utuh;
  Hammer Place size 15 utuh; gap header 18px & 18px utuh; modal Build
  Area open/close normal; 0 console error ✓.

### 61.5 Batasan yang tetap (pre-existing, tidak diperintahkan)

- Snapshot tidak merekam: decal texture, group assignment (groupId),
  material PBR custom (metalness/roughness/emissive per-block),
  rotasi kamera. Undo me-restore posisi/rotasi/scale/color/warna —
  data lain kembali ke default. (Di luar scope perintah user.)

## Bagian 62 — Fix Undo/Redo: Redo Shape Jangan Jadi Kotak (Task ID 25)

### 62.1 Latar (bug report user)

User: "ketika saya misal menaruh shape disitu, entah torus, silinder, bola
atau lainnya, nah saya undo berhasil, namun ketika saya redo dia malah jadi
'kotak' loh apa apaan ini? ini sungguh tidak wajar!!"

Place shape (torus/cylinder/sphere/cone) → undo BERHASIL (shape hilang) →
redo → shape muncul lagi TAPI sebagai KOTAK polos 1×1×1.

### 62.2 Akar Masalah (DIAGNOSIS KODE)

- `snapshotState()` untuk block non-import menyimpan hanya
  transform (px..sz) + color string — GEOMETRI TIDAK DISIMPAN.
- `restoreState()` rebuild SEMUA block non-import dengan
  `new THREE.BoxGeometry(1, 1, 1)` permanen (line lama 12874).
- Konsekuensi: place block biasa = box → undo/redo "kelihatan benar"
  (karena box memang direbuild jadi box identik); place SHAPE =
  torus/sphere/cylinder/cone → undo OK (snapshot sebelum aksi tidak
  berisi shape) → redo me-rebuild snapshot → KOTAK. Task 24 hanya
  menangani mesh importedGlb (live reference); mesh primitive Shape
  tool + clone/mirror-nya tidak tercakup.
- Terdampak: Shape tool (5 tipe), Clone dari shape, Mirror dari shape,
  symmetry auto-mirror dari shape (createMirrorMesh → geometry.clone()).

### 62.3 Implementasi (diff +25/−2, hanya blok Phase 8 undo/redo)

Filosofi sama dengan liveMesh Task 24, diperluas ke geometri:

1. `snapshotState()`: entry block non-import kini menyimpan
   `geo: b.geometry` (REFERENSI geometri asli, immutable — tidak pernah
   dimutasi tool manapun). Material tetap disimpan sebagai NILAI warna
   (supaya undo paint tetap akurat — referensi material akan berubah
   oleh paint tool).
2. `restoreState()` rebuild: `const geo = s.geo || new
   THREE.BoxGeometry(1, 1, 1)` — memakai geometri ASLI dari snapshot;
   fallback box hanya untuk snapshot lama tanpa field geo
   (kompatibilitas mundur).
3. `restoreState()` removal loop: `b.geometry.dispose()` DIHAPUS untuk
   block non-import (konsisten dengan skip dispose importedGlb Task 24)
   — snapshot memegang referensi hidup geometri. Material tetap
   di-dispose (warna tersimpan sebagai nilai).
   - Geometri yang di-dispose tool lain (Delete tool / Clear All yang
     masih dispose): otomatis REVIVED oleh renderer —
     WebGLAttributes.createBuffer() meng-upload ulang dari
     attribute.array yang masih utuh saat mesh dirender lagi (pola
     revival yang sama yang sudah menjadi beban production pada path
     liveMesh Task 24 sejak commit c3b1067).
   - GC: objek geometry di-gC otomatis begitu keluar jendela history
     (MAX_HISTORY=50) dan tidak direferensikan mesh manapun.
4. TIDAK ADA call site yang diubah (11 lokasi recordHistory tetap
   post-action); TIDAK menyentuh Place/Delete/Clone/Mirror/Shape tool,
   grup, decal, paint, material clipboard (pekerjaan lain utuh).

### 62.4 Verifikasi (browser 1280×577, SEMUA PASS — pixel-diff 0)

Metode: screenshot sebelum vs sesudah undo→redo; scene diff dihitung
mengecualikan panel UI (toolbar/pengaturan) supaya hanya objek 3D
yang dibandingkan; VLM untuk konfirmasi bentuk.

- TORUS (bug user persis, scene bersih): place → 1 Blocks → Undo →
  0 Blocks → Redo → 1 Blocks → **scene diff = 0** + VLM: "The object
  in the RIGHT image is the SAME torus (donut/ring) as the LEFT
  image" ✓ (sebelum fix: merender kotak).
- CYLINDER: place → undo → redo → scene diff = 0 ✓.
- SPHERE (bola): place → undo → redo → scene diff = 0 ✓.
- CLONE dari sphere: clone (4→5) → undo (→4) → redo (→5) → scene
  diff = 0 — hasil clone direstore sebagai sphere, bukan kotak ✓.
- DELETE→UNDO (jalur revival): delete 1 dari 3 → undo → 3 Blocks,
  scene diff = 0 — geometri yang sempat di-dispose Delete tool
  ter-render sempurna kembali ✓.
- Place BLOCK biasa (box) + keyboard: place → Ctrl+Z → Ctrl+Y →
  scene diff = 0 (box tetap box) ✓. Keyboard event disintesis via
  KeyboardEvent asli (agent-browser "key press Control+z" mengirim
  e.key kosong — artefak tool, bukan bug app).
- Clear All: modal konfirmasi open → "Ya, Hapus Semua" bekerja (6→0
  Blocks) → undo tetap tersedia ✓; "Batal" bekerja ✓.
- Modal Reset Camera & Build Area: open/close normal ✓.
- Console error: 0 ✓ (hanya warning ingest backend pre-existing).
- Regresi UI: toolbar order [Undo, Redo, Place, Delete, Shape, Clone,
  Mirror, Object, Decal] utuh; Hammer Place size 15 = 1; Undo2/Redo2
  size 15 = 1/1; fill gelap BuildAreaIcon 3× = 1; marginLeft: 8 kode
  = 3; state tombol Undo/Redo enable/disable benar sepanjang sesi.

### 62.5 Catatan

- Snapshot tetap tidak merekam decal texture/groupId/material PBR
  custom/kamera (pre-existing, di luar perintah — lihat 61.5).
- Teknik verifikasi "scene diff = 0 dengan panel dikecualikan"
  dipakai karena panel kiri/kanan berubah sesuai tool aktif
  (false positive jika di-diff mentah).

## Bagian 63 — Grid Build Area 60×60 → 100×100 (Task ID 26)

### 63.1 Latar (permintaan user)

User: "grid kotak kotak tempat saya menaruh block itu panjang 60 kotak dan
lebar 60 kotak, mau bikin jadi 100 x 100 bukan 60 x 60, bisa??"
Dengan peringatan tetap: hati-hati, jangan menyenggol pekerjaan lain,
push NORMAL (dilarang force push).

### 63.2 Desain perubahan (semua turunan langsung ukuran grid)

Grid v2 dibangun dari konstanta `GRID_SIZE` (half-extent; grid =
GRID_SIZE×2 unit, 1 unit = 1 cell). GRID_SIZE 30 → **50** mengubah:
GridHelper (100 unit/100 divisi), ground plane raycast 100×100, dan
SEMUA boundary check placement (|posX| > GRID_SIZE) — otomatis skala,
tidak ada call site yang diubah.

Audit semua dependensi hardcode terhadap ukuran grid (3 ditemukan,
semua wajib ikut agar fitur grid baru benar-benar berfungsi):

1. **Symmetry mirror plane** `PlaneGeometry(60, 60)` hardcoded →
   `PlaneGeometry(GRID_SIZE * 2, GRID_SIZE * 2)` — visual indicator
   symmetry mode kini menutupi seluruh grid (dulu cuma 60×60 di tengah).
2. **OrbitControls maxDistance 80 → 150** — batas zoom-out diturunkan
   dari ukuran grid: kamera FOV 60°, diagonal grid 100×100 ≈ 141 unit;
   pada jarak 80 grid baru tidak mungkin terlihat penuh (grid lama
   diagonal 42 — 80 pas). 150 ≈ 80 × (100/60) dengan pembulatan.
3. **DirectionalLight shadow frustum ±50 → ±75** — dihitung: pojok grid
   (±49.5) diproyeksikan ke light-space (light dari (20,35,15), arah
   miring) mencapai ±70; dengan ±50 bayangan block pojok grid baru
   terpotong. near/far (0.5/120) tetap valid (depth terjauh ≈ 84).

TIDAK diubah (fitur lain yang sudah sempurna): posisi kamera awal
(18,14,18) & Reset Camera (fitur terpisah), minimap (view lokal
mengikuti kamera, tetap fungsional), WASD fly (unbounded), mapSize
shadow 2048, BlockSimulator v1 (halaman berbeda, n=30), semua tool.

### 63.3 Verifikasi (browser 1280×577, SEMUA PASS)

Metode diskriminatif matematis — kamera awal (18,14,18) target (0,0,0),
proyeksi klik dihitung manual (fov 60, aspect 2.51):

- **Kontrol negatif** klik (640,152) → ground hit (−54.6, 0, −54.6):
  |54.6| > 50 → DITOLAK (0 Blocks) ✓ (juga di luar ground plane 100×100).
- **Klik diskriminatif** klik (640,163) → ground hit (−44.4, 0, −44.4)
  → cell (−44.5, ·, −44.5): |44.5| < 50 → BLOCK TERPASANG ✓.
  Pada grid lama 60×60 klik ini DITOLAK (44.5 > 30) — bukti fungsional
  grid kini 100×100.
- **Sanity** klik (640,198) → cell (−24.5,·,−24.5) → block kedua ✓
  (diterima di grid lama maupun baru).
- **Bayangan pojok**: block di (−44.5,·,−44.5) light-space y' = 51
  (luar frustum lama ±50, dalam baru ±75) — VLM zoom: "subtle shadow
  cast on the grid surface directly beneath it" ✓.
- **Zoom-out 150** (45 event wheel): VLM "the large grid fills most of
  the frame with its full square shape and far edges clearly visible,
  two small cubes visible" ✓.
- **Undo/Redo regresi** (grid baru): undo×2 → 0 Blocks; redo×2 →
  2 Blocks; scene pixel-diff sebelum-undo vs sesudah-redo = **0**
  (block pojok ter-restore identik — konsisten dengan Task 24/25).
- Modal Build Area open/close normal; 0 console error.
- Marker regresi utuh: Hammer 1; Undo2/Redo2 1/1; fill gelap BuildAreaIcon
  3×1; marginLeft:8 kode 3; toolbar order [Undo,Redo,Place,Delete,Shape,
  Clone,Mirror,Object,Decal]; v1 BlockSimulator3D.jsx 0 diff.

### 63.4 Catatan

- Shadow sedikit lebih soft (2048px/150-unit frustum ≈ 13.6 px/unit vs
  20.5 sebelumnya) — konsekuensi wajib menaikkan coverage 2.78× area;
  kualitas masih lebih dari cukup untuk block 1-unit.
- Jarak pandang kamera jauh (150) + fog default off → grid terlihat
  sampai pojok.

## Bagian 64 — Swap Urutan Tombol Place ↔ Delete (Task ID 27)

### 64.1 Latar (permintaan user)

User: "tolong yang swap urutan place dan delete, harusnya yang urutan
ketiga itu adalah delete, dan urutan keempat itu adalah place!"
Dengan peringatan tetap: hati-hati, jangan menyenggol pekerjaan lain
yang sudah sempurna, fokus tugas yang diperintahkan, push NORMAL.

### 64.2 Desain perubahan (murni urutan render JSX, nol logika)

Toolbar Build sebelumnya: Undo, Redo, **Place**, **Delete**, Shape,
Clone, Mirror, Object, Decal. Kedua tombol adalah blok JSX yang
sepenuhnya self-contained — masing-masing membawa onClick
(toggleTool), title, style, icon, dan label sendiri; tidak ada state,
ref, atau handler yang dibagi dengan tombol lain. Karena container
toolbar adalah flexbox yang render berurutan sumber, menukar POSISI
DUA BLOK JSX di sumber = menukar posisi visualnya, tanpa efek lain
apa pun.

Urutan baru: Undo, Redo, **Delete (ketiga)**, **Place (keempat)**,
Shape, Clone, Mirror, Object, Decal.

Properti yang tetap persis sama (tidak disentuh):
- Place: toggleTool('place'), title "Place (P)", Hammer icon,
  highlight amber #f59e0b.
- Delete: toggleTool('delete'), title "Delete (X)", Trash2 icon,
  highlight merah #ef4444, teks putih saat aktif.
- Shortcut keyboard P / X, identitas warna, gap 18px antar tombol
  header, section Build lainnya (Shape s/d Material).

### 64.3 Edit (1 file, +23/−20 baris, 3 hunk)

1. Hunk 1 (baris ~14128): komentar blok Undo/Redo diupdate —
   urutan dideskripsikan ulang jadi "Undo, Redo, DELETE, PLACE, dst"
   + catatan Task ID 27.
2. Hunk 2 (baris ~14171-14204): blok tombol Delete DIPINDAH ke atas
   blok tombol Place. Isi kedua blok byte-for-byte identik dengan
   sebelumnya — hanya posisinya yang bertukar.
3. Hunk 3 (baris ~14493): komentar memorial section History diupdate
   (deskripsi urutan) agar dokumentasi tetap akurat.

### 64.4 Verifikasi

- DOM order via eval: ["Undo","Redo","Delete","Place","Shape","Clone",
  "Mirror","Object","Decal"] ✓
- VLM crop toolbar: urutan top→bottom sama persis ✓
- Delete tool aktif di posisi ketiga: background rgb(239,68,68) ✓;
  Place tool aktif di posisi keempat: rgb(245,158,11) ✓ (toggle
  berganti normal).
- Fungsi Place: klik kanvas → block terpasang (1 Blocks) ✓.
- Fungsi Delete: klik block (lokasi ditemukan via diff screenshot
  sebelum/sesudah undo — block di layar hanya ~10×10 px pada
  (639,193)) → block terhapus (0 Blocks) ✓.
- Regresi undo/redo (Task 24/25): place → undo → redo, pixel-diff
  area scene = 0 ✓; delete → undo → block di-revive, pixel inti block
  identik ✓.
- Tiga modal header (Build Area / Clear All / Reset Camera) buka-tutup
  normal ✓; 0 console error ✓; marker regresi grep semua PASS
  (Hammer15=1, Trash2_15=1, Undo15=1, Redo15=1, fill gelap 3,
  marginLeft:8 kode 3, History 0, marker geo Task 25 utuh) ✓.

## Bagian 65 — Hapus Pick Color + Pindah Paint ke Bawah Place + Hapus Section Paint (Task ID 28)

### 65.1 Latar (permintaan user)

User: "pick color di hapus permanen dari situ, kemudian paint pindah
tepat dibawah place. nah maka 'print' itu menjadi tidak ada karena
penghuninya sudah pindah jadi menghilang tidak ada atau terhapus."
("print" = section "Paint".) Dengan peringatan tetap: hati-hati,
jangan menyenggol pekerjaan lain, push NORMAL.

### 65.2 Desain perubahan (3 aksi, 1 file)

Struktur sebelum: toolbar Build = Undo, Redo, Delete, Place, Shape,
Clone, Mirror, Object, Decal; lalu section terpisah "PAINT"
(header collapsible) berisi tombol Paint + Pick Color (eyedropper).

1. **Pick Color dihapus permanen**: tombol eyedropper (toggleTool
   ('eyedropper'), icon Pipette) di-delete dari JSX. Audit: tombol
   itu adalah SATU-SATUNYA cara mengaktifkan tool eyedropper (tidak
   ada keyboard shortcut I — handler keyboard hanya WASD/QE/Shift +
   Ctrl+Z/Y; setTool('eyedropper') tidak ada call site lain) → tool
   jadi unreachable, path canvas-nya (baris ~12326) dibiarkan sebagai
   dead code yang tidak mungkin terpicu (nol risiko, sesuai prinsip
   jangan senggol). Icon Pipette ikut dibuang dari import lucide.
2. **Paint pindah tepat di bawah Place**: blok JSX tombol Paint
   (toggleTool('paint'), title "Paint (C)", icon Paintbrush, highlight
   amber #f59e0b) dipindah dari section PAINT ke Build section,
   disisipkan persis setelah tombol Place. Properti tombol identik
   byte-for-byte.
3. **Section PAINT dihapus total**: header collapsible (toggleSection
   ('paint')) + wrapper {openSections.paint && (<>)} di-delete karena
   penghuninya sudah pindah/terhapus. Key `paint` di state
   openSections sengaja TETAP ADA (compat localStorage lama — schema
   merge spread, key tak terbaca JSX; precedent sama dengan key
   `history` Task sebelumnya).

Urutan toolbar final: Undo, Redo, Delete, Place, Paint, Shape, Clone,
Mirror, Object, Decal — lalu section Transform (Paint section hilang,
Transform langsung disusul Groups).

### 65.3 Verifikasi

- DOM eval urutan: ["Undo","Redo","Delete","Place","Paint","Shape",
  "Clone","Mirror","Object","Decal"] ✓; posisi vertikal: Place y=285,
  Paint y=328 (tepat di bawah, gap 6px konsisten) ✓
- Tombol Pick Color/Eyedropper: 0 di snapshot & DOM ✓; grep Pick
  Color hanya 3 hit di komentar dokumentasi ✓; Pipette import = 0 ✓
- Section header PAINT hilang; Transform (y=595) → langsung Groups
  (y=768) ✓; section lain utuh: Groups/Display/Bloom/Import-Export;
  Material kondisional selectedCount>0 (perilaku pre-existing) ✓
- Fungsi Paint di posisi baru: place block biru → pilih swatch merah
  di panel Colors (kanan atas, muncul saat tool place/paint) → klik
  block → pixel block berubah biru (29,70,127) → merah (91,19,35) ✓
- Panel Pattern (Phase 27, muncul saat tool=paint) masih render
  (selector visible, value solid) ✓; panel Colors tetap muncul untuk
  tool place+paint ✓
- Regresi undo/redo: paint → undo → block kembali biru; redo →
  merah lagi; block count stabil 1 ✓
- 3 modal header (Build Area/Clear All/Reset Camera) buka-tutup
  normal ✓; 0 console error ✓; semua marker regresi grep PASS ✓

## Bagian 66 — Tombol "Info" (Mode Inspeksi Read-Only) + Material Inspector Ter-Gate + Smart Clamp (Task ID 29)

### 66.1 Latar (permintaan user)

User: (1) ciptakan tombol baru "info" tepat DI ATAS "undo" dengan icon
kaca pembesar miring ke kanan; (2) tool info = TIDAK ada fungsi apa-apa,
tidak bisa mengotak-atik block; (3) kursor didekatkan ke block → muncul
jendela "Material Inspector"; (4) sebagai gantinya, Material Inspector
TIDAK muncul di manapun KECUALI mode info aktif; (5) jendela inspector
DILARANG hilang menembus layar — harus punya hitbox besar, saat menabrak
layar otomatis geser sendiri KE ATAS ("seolah punya kesadaran") supaya
informasi terbaca jelas, terperinci, nyaman. Peringatan tetap: hati-hati,
jangan menyenggol pekerjaan lain, push NORMAL.

### 66.2 Desain (5 komponen, 1 file, +117/−25)

1. **Tombol Info** (Build section, urutan PERTAMA — di atas Undo):
   toggleTool('info'), icon lucide `Search` (lingkaran + handle ke
   kanan-bawah = kaca pembesar miring kanan, sesuai permintaan), warna
   aktif sky #38bdf8 (tidak dipakai tool manapun — Undo hijau, Redo biru,
   Delete merah, Place/Paint amber, Shape/Clone/Mirror/Decal cyan,
   Object kuning, Scale violet). Urutan final toolbar: Info, Undo, Redo,
   Delete, Place, Paint, Shape, Clone, Mirror, Object, Decal.

2. **Mode read-only**: click handler onWindowMouseUp adalah if/else-if
   chain ketat per tool — 'info' tidak match branch MANAPUN → klik
   canvas = no-op (tidak place/delete/paint/select/gizmo). Ghost preview
   & delete-highlight juga tidak aktif (branch else). OrbitControls LEFT
   tetap PAN (kamera boleh digerakkan — itu bukan manipulasi block).

3. **Gate Material Inspector**: tracking hover (onCanvasMouseMove) yang
   sebelumnya "always cek hover untuk semua tool" kini HANYA jalan saat
   currentTool === 'info'. Tool lain → setHoveredMaterial(null) (React
   bailout, no re-render kalau sudah null). Render gate ganda:
   {hoveredMaterial && tool === 'info' && (...)}. Ditambah: (a) useEffect
   [tool] — keluar mode info → setHoveredMaterial(null) segera (mouse
   sudah di toolbar, mousemove canvas tak terpicu); (b) listener BARU
   mouseleave di canvas → tutup inspector saat kursor keluar canvas
   (popup hanya sah saat kursor benar-benar di atas canvas dekat block).

4. **Smart clamp anti-tembus-layar** (inti request "kesadaran"):
   useLayoutEffect [hoveredMaterial, tool] mengukur ukuran ASLI panel
   (getBoundingClientRect), lalu hitung posisi dengan:
   - HITBOX_PAD 24px: panel diperlakukan 24px lebih besar di SEMUA sisi
     → tabrakan dideteksi LEBIH AWAL (hitbox besar, "sadar" sebelum
     menyentuh tepi);
   - SCREEN_MARGIN 12px: jarak minimal ke tepi layar setelah digeser;
   - ideal = (mouseX+16, mouseY+16); overflow kanan → geser kiri;
     overflow BAWAH → GESER KE ATAS (request eksplisit); sudut ekstrem
     → kunci di margin.
   Posisi final ditulis via el.style.left/top di useLayoutEffect =
     dieksekusi sinkron SEBELUM paint → user tidak pernah melihat frame
     terpotong. Rumus terverifikasi: bottom-edge → top = vh−12−(h+24);
     corner → left = vw−12−(w+24).

5. **Integrasi kecil**: import Search (lucide) + useLayoutEffect (react);
   komentar union type tool + komentar toolbar + 2 status text help
   ("inspect block (read-only)") — satu baris per rantai ternary.

### 66.3 Verifikasi

- Urutan DOM: Info, Undo, Redo, Delete, Place, Paint, ... ✓; icon =
  circle r8 + path m21,21-4.3-4.3 (Search, handle kanan-bawah) ✓;
  aktif = rgb(56,189,248) ✓
- Gating: hover block dengan tool Place/Delete → inspector 0 di DOM ✓
  (perilaku lama "muncul di semua tool" TERBUKTI hilang)
- Muncul: Info aktif → hover block → panel muncul dengan data lengkap
  (Color/Type/Metalness/Roughness/Opacity/Emissive/Maps/Pos/UUID) ✓
- Read-only: klik block saat info → 1 Blocks tetap, tanpa seleksi ✓
- Smart clamp terukur: block bawah (mouse y=540) → ideal top 556+240=
  796 > 577 → aktual top 302, bottom 542, fullyInside true ✓; pojok
  kanan-bawah (mouse 1137,522) → ideal (1153,538) menembus kanan+bawah
  → aktual (1044,302), right 1244, bottom 542, fullyInside true ✓;
  VLM konfirmasi panel "fully visible, no parts cut off" ✓
- Penutupan: hover area kosong → tertutup ✓; kursor keluar canvas ke
  toolbar (mouseleave) → tertutup ✓; ganti tool → tertutup seketika ✓
- Regresi: place/delete/undo/redo (2→1→2 blocks) ✓; 3 modal header ✓;
  0 console error ✓; semua marker grep PASS ✓

### 66.4 Catatan desain

- Panel berukuran VARIABEL (200×~240 terukur) — clamp memakai ukuran
  ASLI via ref, bukan hardcode 240/200 seperti formula lama (yang bisa
  salah kalau konten lebih tinggi).
- Inspector hanya menggangu baca-saja: pointerEvents none, zIndex 100.
- Tidak menyentuh: sistem seleksi/gizmo (perilaku pre-existing gizmo
  persist antar tool berlaku sama untuk semua tool — info konsisten),
  undo/redo, panel Colors/Pattern, semua section lain.

## Bagian 67 — Icon Info Custom: Kaca Pembesar Miring ke Kanan (Task ID 30)

### 67.1 Latar (permintaan user)

User feedback pasca-Task 29: icon kaca pembesar tombol Info dinilai
"jelek banget" DAN arahnya SALAH — "miring ke kiri bukan ke kanan".
Analisis geometri lucide Search: circle cx11 cy11 r8 (lens KIRI-ATAS)
+ handle path m21,21-4.3-4.3 (menuju KANAN-BAWAH) → siluet "\" =
miring KIRI (konvensi baca user = posisi lens/kepala, sama seperti
emoji 🔍 resmi disebut "tilted left"). Handle juga cuma 4.3 unit dari
viewBox 24 (0.54× radius) — proporsi "stubby" → dinilai jelek.

### 67.2 Perubahan (1 file, 3 hunk, +20/−3)

1. Import: `Search` dihapus dari lucide-react (satu-satunya usage =
   tombol Info; pola sama dengan hapus Pipette Task 28).
2. Comment block tombol Info di-update (dokumentasi Task 30).
3. `<Search size={15} />` → SVG inline custom:
   `<circle cx="14.5" cy="9.5" r="7"/>` + `<line x1=9.9 y1=14.1
   x2=4.2 y2=19.8/>` = lens KANAN-ATAS + handle 45° ke KIRI-BAWAH →
   siluet "/" = MIRING KE KANAN (mirror horizontal persis dari lucide
   Search lama — semua fitur visual yang user baca terbalik arah).
   Handle 8.06 unit ≈ 1.15× radius (proporsi klasik kaca pembesar).
   Start handle (9.9,14.1) = jarak 6.5 dari center → handle tumbuh
   mulus dari dalam stroke band rim [6,8]. strokeWidth 2 + linecap/
   linejoin round + stroke="currentColor" → gaya identik icon lucide
   lain di toolbar; warna otomatis ikut state tombol (aktif #0e1420 /
   non-aktif #e2e8f0).

### 67.3 Verifikasi (SEMUA PASS)

- DOM: svg width 15 + circle(14.5,9.5,r7) + line persis desain;
  computedColor non-aktif rgb(226,232,240), aktif rgb(14,20,32)
  (currentColor bekerja) ✓
- Pixel ASCII zoom 8× KEDUA state (aktif biru + non-aktif): circle
  di kanan + ekor handle ke kiri-bawah ✓ (ground truth)
- VLM zoom 8×: "lens top-RIGHT, handle bottom-left, classic
  well-proportioned, clean line quality" ✓; VLM crop toolbar final:
  "lens right side, handle points bottom-left" ✓
- Catatan VLM: pembacaan full-screenshot (icon 15px kecil) BISA salah
  arah (pattern-completion ke mayoritas icon search di training data
  yang lens-kiri) → verifikasi arah icon WAJIB zoom ≥8× + pixel ASCII.
- Fungsi Task 29 utuh semua: Info aktif → hover block (639,493) →
  panel 200×240 muncul di (655,302), bottom 542, fullyInside=true
  (hasil IDENTIK dengan tes Task 29) ✓; mouse geser → panel tutup ✓;
  ganti Place + hover block → 0 panel (gating 3 lapis) ✓
- Regresi marker grep SEMUA PASS: Hammer/Undo/Redo/Trash/Paintbrush
  size15 = 1; Pipette = 0; toggleTool('info') = 1; <Search size={15}>
  1→0; stroke currentColor 2→3 (+1 tepat) ✓
- 0 console error ✓; npx vite build 23.54s sukses ✓

### 67.4 Catatan desain

- User mempersepsi arah "miring" dari posisi LENS/kepala icon, BUKAN
  arah handle (bukti: icon lama dengan handle ke kanan-bawah tetap
  disebut "miring ke kiri"). Kunci perbaikan = pindahkan lens ke
  kanan-atas (mirror horizontal), bukan sekadar rotasi CSS.
- SVG custom inline 9 baris = zero dependency baru — pattern berguna
  saat lucide tidak menyediakan varian arah yang dibutuhkan.
- Tidak menyentuh: semua tombol lain, icon lain, gating logic, smart
  clamp logic, semua section panel. Hanya 3 lokasi: import, comment,
  JSX icon.

## Bagian 68 — Tombol Binding & Property (Placeholder Dev-Stage) + Toast Peringatan (Task ID 31)

### 68.1 Latar (permintaan user)

User: (1) tepat di bawah "Paint" tombol baru "Binding" dengan icon kunci
inggris (wrench) yang miring ke arah kanan; (2) jika dipencet muncul
peringatan tool masih dalam tahap pengembangan; (3) tepat di bawah
Binding tombol "Property" dengan icon screwdriver yang miring ke kanan
juga; (4) Property juga menampilkan peringatan yang sama saat dipencet.

### 68.2 Perubahan (1 file, 1 hunk kontinu, +66 baris, 0 baris diubah)

1. **Tombol Binding** — `<Wrench size={15} />` (lucide, SUDAH terimport):
   orientasi asli lucide = jaw/kepala di KANAN-ATAS + handle ke
   KIRI-BAWAH = miring ke kanan (konsensus konvensi icon Info Task 30;
   TIDAK dirotasi). Catatan: <Wrench> lain hanya dipakai icon chip
   header BUILD TOOLS — bukan tombol toolbar, jadi tidak duplikat visual
   di kolom tombol.
2. **Tombol Property** — custom SVG inline (lucide tidak punya ikon
   screwdriver): handle rounded-rect 45° path M8.2 10.8 L12.2 14.8
   L6.2 20.8 L2.2 16.8 Z (kiri-bawah) + shaft line (10.2,12.8)→(20.5,2.5)
   + mata flat crossbar (19.1,1.1)→(21.9,3.9) di kanan-atas = miring
   ke kanan; proporsi handle 8.49 : shaft 14.56 (~37% total) + gaya
   stroke lucide (strokeWidth 2, round caps, currentColor).
3. **Handler klik** — `toast.warning('Tool "Binding" masih dalam tahap
   pengembangan — coming soon')` (dan Property): REUSE sonner yang
   sudah terimport (line atas file) + <Toaster position="top-center"
   richColors theme="dark"> di App.jsx → warning amber, auto-hide
   default 4 detik. NOL infrastruktur baru (tidak ada state/timer/
   render-block/import baru).
4. Klik TIDAK memanggil toggleTool → tool aktif TIDAK berubah (Binding/
   Property bukan tool — placeholder dev-stage; union type `tool` state
   TIDAK disentuh).

### 68.3 Verifikasi (SEMUA PASS)

- Urutan DOM: Info, Undo, Redo, Delete, Place, Paint, Binding,
  Property, Shape, Clone, Mirror, Object, Decal ✓; posisi vertikal
  terukur: Paint y=372 → Binding y=415 → Property y=459 (pitch 43-44px
  = 1 tombol/baris, TEPAT di bawah) ✓
- Icon Binding: DOM = path lucide wrench asli ✓; pixel ASCII: kepala
  jaw blob di kanan-atas + handle stroke ke kiri-bawah ("/") ✓; VLM
  zoom: "head top-right, handle bottom-left" ✓
- Icon Property: DOM = path M8.2 10.8... + 2 line ✓; pixel ASCII: mata
  tip kanan-atas + shaft diagonal + handle rect kiri-bawah ✓; VLM zoom:
  "tip top-right, handle bottom-left, recognizable screwdriver, thin
  shaft + flat tip + thicker handle" ✓
- Toast Binding: count=1, data-type=warning, teks 'Tool "Binding"
  masih dalam tahap pengembangan — coming soon', x=462 y=32 (top-center
  1280: centered persis), w=356 ✓; auto-hide: 0 toast setelah 4.5s ✓
- Toast Property: data-type=warning, teks dengan "Property" ✓; klik
  berurutan → 2 toast bertumpuk (stack sonner normal) ✓
- Tool state PRESERVED: Place diaktifkan (amber rgb(245,158,11)) →
  klik Binding + Property → Place MASIH amber ✓; canvas klik → 1 Blocks
  ter-place (Place tetap fungsional) ✓
- Regresi: delete (1→0) + undo (0→1) + redo (1→0) ✓; mode Info →
  hover block → Material Inspector panel (655,302) 200×240
  fullyInside=true bottom=542 — IDENTIK hasil Task 30 ✓; panel tutup
  saat move away ✓; modal Build Area "COMING SOON" + tombol "Oke,
  Mengerti" normal ✓; 0 console error ✓
- Marker grep: Hammer/Undo/Redo/Trash/Paintbrush15=1; Wrench15 1→2
  (chip header + Binding); toast.warning 0→2 panggilan (+1 sebutan di
  komentar); stroke currentColor 3→4; Pipette=0; Search import=0 ✓

### 68.4 Catatan desain

- Peringatan via sonner toast.warning = keputusan REUSE sistem
  notifikasi eksisting (dipakai 10+ kali utk preset material) →
  konsistensi visual app + nol kode infrastruktur + auto-hide gratis.
- Sandbox session baru ternyata me-reap background process antar Bash
  call → dev server wajib di-spawn via node child_process detached +
  unref (double-fork orphan ke init); nohup/setsid langsung TIDAK
  survive.
- Mode-noise 236 file (flip 644→755) terjadi antar sesi (infra),
  di-restore semua via git diff --summary → chmod old-mode; commit
  tetap 100% konten murni.
- Tidak menyentuh: semua tombol tool lain, union type tool state,
  toggleTool, semua section panel, inspector, modal, preset system.
