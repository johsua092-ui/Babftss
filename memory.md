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

**Card kedua (tier MUDAH) — "Buffer (Negasi Ganda)":**
- Struktur: 1 input (A), 2 gerbang NOT berurutan. `OUT = NOT(NOT(A)) = A`. Sinyal A dinegasi lalu dinegasi kembali — dasar konsep Buffer.
- Truth table: 1 input -> 2 baris (A=0 OUT=0, A=1 OUT=1).
- Warna tema: `#f87171` (merah/NOT) untuk kedua gate. Masing-masing menyala independen: NOT-1 menyala saat `notA` true, NOT-2 menyala saat `out` true.
- Diagram: alur lurus horizontal (A -> NOT-1 -> label overline-A -> NOT-2 -> OUT), tanpa belokan siku-siku karena cuma 1 alur.
- Label perantara NOT(A) pakai notasi overline manual (teks "A" + `<line>` SVG di atasnya, Y offset -17) — langsung benar dari awal, mengikuti pelajaran revisi Card 01.
- `svgW = outX + outNodeR + 20` — langsung benar, tidak mengulang bug Card 01.
- Tidak ada garis dekoratif pin nub — mengikuti pelajaran revisi Card 01.

**File yang dibuat:**
- `src/components/CircuitDiagram02.jsx` (baru)
- `src/components/CircuitCard02.jsx` (baru)

**File yang diubah:**
- `src/pages/LogicGatesCircuit.jsx` — tambah import CircuitCard02, render di bawah CircuitCard01.

**Verifikasi:**
- Build sukses: `built in 7.44s`, 0 error.
- LogicGatesCircuit chunk: 14.49 KB (naik dari 8.51 KB — wajar karena ada card + diagram baru).
- Main bundle: 399.75 KB (tidak berubah).
- Logika benar: OUT = A untuk kedua kombinasi (A=0->OUT=0, A=1->OUT=1).
- File backend (AuthContext, firebase, LoginModal, useProgressSync, api/, lib/) TIDAK disentuh.
- Card 01 (CircuitDiagram01.jsx, CircuitCard01.jsx) TIDAK disentuh.
- **Tidak bisa diverifikasi visual langsung di browser.**

- Status: **SELESAI & TERVERIFIKASI.**

**VERIFIKASI INDEPENDEN OLEH CLAUDE:** diagram dirender ulang (headless browser) untuk kedua state, A=0 dan A=1, plus analisis pixel untuk cek batas kanan card. Hasil: (a) `OUT=A` benar di kedua state (A=0->OUT=0, A=1->OUT=1), (b) node OUT tidak overflow keluar card (pixel merah maksimal cuma 4px dari tepi luar card, jauh lebih aman daripada Card 01 versi awal yang bleeding 122px), (c) tidak ada garis dekoratif pin-nub, (d) label overline "A" pakai `<line>` terpisah, bukan karakter prime — ketiga pelajaran dari revisi Card 01 diterapkan dengan benar sejak awal, tidak perlu revisi ulang. Diff kode dicek: HANYA `CircuitDiagram02.jsx` (baru), `CircuitCard02.jsx` (baru), dan `LogicGatesCircuit.jsx` yang berubah — `CircuitDiagram01.jsx`/`CircuitCard01.jsx` tidak tersentuh.

**Card ketiga (tier MUDAH) — "Bangun NAND Manual":**
- Struktur: 2 input (A, B), gerbang AND dulu, output AND masuk gerbang NOT. `OUT = NOT(A AND B)`. Ini kebalikan urutan dari Card 01 (yang NOT dulu, AND sesudahnya).
- Insight: NAND yang sudah dikenal sebagai basic gate sebenarnya bisa dibangun dari 2 gate primitif (AND + NOT). Truth table hasilnya identik dengan NAND asli.
- Truth table: 2 input -> 4 baris: `[[0,0,1],[0,1,1],[1,0,1],[1,1,0]]`.
- Warna tema card: `#f87171` (NOT, karena gate terakhir/output adalah NOT). AND gate menyala saat `andOut` true, NOT gate menyala saat `out` true.
- Diagram: alur A (atas) & B (bawah) -> AND gate (D-shape, tanpa bubble) -> label perantara "AB" (teks biasa, tanpa overline karena bukan sinyal ternegasi) -> NOT gate (segitiga + bubble) -> OUT.
- Semua pelajaran revisi Card 01 diterapkan: tidak ada pin nub dekoratif, `svgW = outX + outNodeR + 20`, kabel solid siku-siku, label teks biasa tanpa overline.

**File yang dibuat:**
- `src/components/CircuitDiagram03.jsx` (baru)
- `src/components/CircuitCard03.jsx` (baru)

**File yang diubah:**
- `src/pages/LogicGatesCircuit.jsx` — tambah import CircuitCard03, render di bawah CircuitCard02.

**Verifikasi:**
- Build sukses: `built in 6.49s`, 2142 modules transformed, 0 error.
- LogicGatesCircuit chunk: 21.59 KB (naik dari 14.49 KB — wajar karena ada card + diagram baru).
- Main bundle: 399.75 KB (tidak berubah).
- Logika NAND benar untuk 4 kombinasi: A=0,B=0->OUT=1, A=0,B=1->OUT=1, A=1,B=0->OUT=1, A=1,B=1->OUT=0.
- Diff kode: HANYA `LogicGatesCircuit.jsx` yang berubah (2 baris: 1 import + 1 render). File backend TIDAK disentuh.
- Card 01 & Card 02 TIDAK disentuh.
- **Tidak bisa diverifikasi visual langsung di browser.**

**VERIFIKASI INDEPENDEN OLEH CLAUDE:** kode dibaca langsung + logika dicek manual. Diff dikonfirmasi: HANYA `CircuitDiagram03.jsx` (baru), `CircuitCard03.jsx` (baru), `LogicGatesCircuit.jsx` yang berubah. Logika `andOut = a && b`, `out = !andOut` benar menghasilkan truth table NAND asli. Diagram: tidak ada garis pin-nub, `svgW` sudah pakai margin benar sejak awal, label output AND awalnya "AB" (kemudian direvisi jadi "A · B" di task terpisah, lihat Bagian 3.3) — semua pelajaran dari revisi Card 01 tetap diterapkan konsisten di card ketiga ini.

- Status: **SELESAI & TERVERIFIKASI.**

---

**Card keempat (tier MUDAH) — "Bangun NOR Manual":**
- Struktur: 2 input (A, B), gerbang OR dulu, output OR masuk gerbang NOT. `OUT = NOT(A OR B)`. PASANGAN KEMBAR dari Card 03 (Bangun NAND Manual) — sama-sama nunjukkin gate hasil-negasi bisa dibangun dari 2 primitif, beda gate dasarnya (OR vs AND).
- Insight: NOR yang sudah dikenal sebagai basic gate sebenarnya bisa dibangun dari 2 gate primitif (OR + NOT). Truth table hasilnya identik dengan NOR asli.
- Truth table: 2 input -> 4 baris: `[[0,0,1],[0,1,0],[1,0,0],[1,1,0]]` (OUT cuma 1 kalau A=0 DAN B=0).
- Warna tema card: `#f87171` (NOT, karena gate terakhir/output adalah NOT). OR gate warna `#a78bfa` (ungu/violet, sesuai design.md 1.5), menyala saat `orOut` true. NOT gate menyala saat `out` true.
- Diagram: alur A (atas) & B (bawah) -> OR gate (sisi kiri melengkung cekung, sisi kanan meruncing, TANPA bubble — path SVG reuse dari case "or" di GateDiagram.jsx) -> label perantara "A + B" (teks biasa, tanda plus, warna mengikuti tema OR) -> NOT gate (segitiga + bubble) -> OUT.
- Semua pelajaran revisi Card 01 diterapkan: tidak ada pin nub dekoratif, `svgW = outX + outNodeR + 20`, kabel solid siku-siku, label teks biasa tanpa overline.

**File yang dibuat:**
- `src/components/CircuitDiagram04.jsx` (baru)
- `src/components/CircuitCard04.jsx` (baru)

**File yang diubah:**
- `src/pages/LogicGatesCircuit.jsx` — tambah import CircuitCard04, render di bawah CircuitCard03.

**Verifikasi:**
- Build sukses: `built in 8.91s`, 2145 modules transformed, 0 error.
- LogicGatesCircuit chunk: 35.28 KB (naik dari 21.59 KB di Card 03 — wajar karena ada card + diagram baru).
- Main bundle: 399.85 KB (naik tipis dari 399.75 KB).
- Logika NOR benar untuk 4 kombinasi: A=0,B=0->OUT=1, A=0,B=1->OUT=0, A=1,B=0->OUT=0, A=1,B=1->OUT=0.
- Bentuk gate OR dikonfirmasi BUKAN bentuk AND (D-shape) atau NOT (segitiga) — path SVG bezier reuse dari GateDiagram.jsx case "or".
- Diff kode: HANYA `LogicGatesCircuit.jsx` yang berubah (2 baris: 1 import + 1 render) + 2 file baru. File backend TIDAK disentuh.
- Card 00, 01, 02, 03 TIDAK disentuh.

- Status: **SELESAI & TERVERIFIKASI.** (Verifikasi independen Claude: logika NOR benar, bentuk gate OR sesuai, diff bersih.)

**Card kelima (tier MUDAH) — "Gerbang 3 Input Sederhana":**
- Struktur: 3 input (A, B, C), 2 gate. AND gate menerima A & B, outputnya masuk OR gate bersama C. `OUT = (A AND B) OR C`. Pengenalan PALING AWAL soal input lebih dari 2 — tetap tier MUDAH karena cuma 2 gate.
- Insight: mulai melatih baca circuit dengan >2 sinyal masuk. Contoh nyata: alarm nyala kalau (sensor A DAN sensor B aktif) ATAU tombol darurat C ditekan.
- Truth table: 3 input -> 8 baris: `[[0,0,0,0],[0,0,1,1],[0,1,0,0],[0,1,1,1],[1,0,0,0],[1,0,1,1],[1,1,0,1],[1,1,1,1]]`.
- Warna tema card: `#a78bfa` (OR, karena gate terakhir/output adalah OR). AND gate warna `#4ade80`, menyala saat `andOut` true. OR gate menyala saat `out` true.
- Diagram: 3 input node vertikal (A atas, B tengah, C bawah) -> A&B masuk AND gate (D-shape) -> label "A · B" -> output AND belok turun masuk OR gate (bezier) bersama C (garis lurus horizontal) -> OUT.
- [KEPUTUSAN OTONOM] Layout 3 input: node A/B/C ditumpuk vertikal di kiri (Y=20/52/84), svgH dinaikkan ke 110 (dari 100 di card 2-input). AND gate diposisikan atas (midY=36), OR gate bawah (midY=68) — mengikuti alur logika: A&B di atas, C di bawah, output OR sejajar dengan C.
- [KEPUTUSAN OTONOM] Routing kabel AND→OR: dari output AND horizontal ke kanan, belok turun (V), lalu horizontal masuk sisi kiri atas OR gate. Kabel C: lurus horizontal dari input C langsung ke sisi kiri bawah OR gate.
- Semua pelajaran revisi Card 01 diterapkan: tidak ada pin nub dekoratif, `svgW = outX + outNodeR + 20`, kabel solid siku-siku, label teks biasa tanpa overline.

**File yang dibuat:**
- `src/components/CircuitDiagram05.jsx` (baru)
- `src/components/CircuitCard05.jsx` (baru)

**File yang diubah:**
- `src/pages/LogicGatesCircuit.jsx` — tambah import CircuitCard05, render di bawah CircuitCard04.

**Verifikasi:**
- Build sukses: `built in 7.69s`, 2147 modules transformed, 0 error.
- LogicGatesCircuit chunk: 43.67 KB (naik dari 35.28 KB di Card 04 — wajar karena ada card + diagram baru).
- Main bundle: 399.85 KB (tidak berubah).
- Logika (A AND B) OR C benar untuk 8 kombinasi: 000→0, 001→1, 010→0, 011→1, 100→0, 101→1, 110→1, 111→1.
- Bentuk gate AND (D-shape) dan OR (bezier) reuse path dari GateDiagram.jsx / CircuitDiagram03/04.
- Diff kode: HANYA `LogicGatesCircuit.jsx` yang berubah (2 baris: 1 import + 1 render) + 2 file baru. File backend TIDAK disentuh.
- Card 00, 01, 02, 03, 04 TIDAK disentuh.
- Status: **SELESAI.** Menunggu verifikasi visual user di browser.

**Card keenam (tier NORMAL) — "Half Adder":**
- Struktur: 2 input (A, B), 2 gate PARALEL (bukan berurutan). XOR gate menghasilkan SUM, AND gate menghasilkan CARRY. `SUM = A XOR B`, `CARRY = A AND B`. Pertama kali rangkaian punya 2 OUTPUT dari input yang sama.
- Insight: Half Adder adalah penjumlah biner paling dasar — konsep fundamental untuk aritmetika digital. Contoh: 1 + 1 = 10 biner (SUM=0, CARRY=1).
- Truth table: 2 input -> 4 baris, 2 kolom output: `[[0,0,0,0],[0,1,1,0],[1,0,1,0],[1,1,0,1]]` (A, B, SUM, CARRY).
- Warna tema card: `#facc15` (XOR/kuning, sesuai CircuitCard00.jsx baris 9). Border card menyala saat SUM atau CARRY true. AND gate warna `#4ade80`.
- Diagram (OPSI A — Vertikal Stack, dipilih user setelah review): 2 input node vertikal di kiri (A atas Y=30, B bawah Y=90) -> kabel A & B masing-masing BERcabang (split) ke XOR gate (atas, midY=36) dan AND gate (bawah, midY=90) -> 2 node OUT terpisah: SUM (kanan XOR) dan CARRY (kanan AND).
- [KEPUTUSAN OTONOM] Layout vertikal stack: XOR gate di atas (midY=36), AND gate di bawah (midY=90), svgH=130. Kabel input bercabang dengan junction point (A di X=75, B di X=85) — cabang ke XOR pakai warna XOR, cabang ke AND pakai warna AND.
- [AUTOCORRECT] memory.md awalnya melabeli layout ini sebagai "OPSI B — Horizontal Side-by-Side" padahal geometri kode CircuitDiagram06.jsx adalah vertikal stack (XOR atas, AND bawah). User konfirmasi 2026-08-03: pertahankan vertikal, perbaiki label.
- [KEPUTUSAN OTONOM] Bentuk XOR gate: reuse path bezier dari GateDiagram.jsx case "xor" (body utama + back curve/tail terpisah). Bentuk AND gate: reuse D-shape dari GateDiagram.jsx case "and".
- [KEPUTUSAN OTONOM] Tier badge NORMAL: styling kuning vivid (`rgba(250,204,21,0.12)` bg, `#facc15` teks) — mengikuti design.md 3.2 (warna terang/vivid, glow neon standar).
- Semua pelajaran revisi Card 01 diterapkan: tidak ada pin nub dekoratif, `svgW = Math.max(sumOutX, carryOutX) + outNodeR + 20`, kabel solid siku-siku, label teks biasa tanpa overline.

**File yang dibuat:**
- `src/components/CircuitDiagram06.jsx` (baru)
- `src/components/CircuitCard06.jsx` (baru)

**File yang diubah:**
- `src/pages/LogicGatesCircuit.jsx` — tambah import CircuitCard06, render di bawah CircuitCard05.

**Verifikasi:**
- Build sukses: `built in 6.97s`, 2149 modules transformed, 0 error.
- LogicGatesCircuit chunk: 52.30 KB (naik dari 43.67 KB di Card 05 — wajar karena ada card + diagram baru dengan 2 output).
- Main bundle: 399.85 KB (tidak berubah).
- Logika Half Adder benar untuk 4 kombinasi: A=0,B=0->SUM=0,CARRY=0; A=0,B=1->SUM=1,CARRY=0; A=1,B=0->SUM=1,CARRY=0; A=1,B=1->SUM=0,CARRY=1.
- Bentuk gate XOR (bezier + back curve) dan AND (D-shape) reuse path dari GateDiagram.jsx.
- Diff kode: HANYA `LogicGatesCircuit.jsx` yang berubah (2 baris: 1 import + 1 render) + 2 file baru. File backend TIDAK disentuh.
- Card 00, 01, 02, 03, 04, 05 TIDAK disentuh.
- Status: **SELESAI.** Menunggu verifikasi visual user di browser.

**Card ketujuh (tier NORMAL) — "Membangun XOR dari Gate Dasar":**
- Struktur: 2 input (A, B), 5 gate: 2 NOT, 2 AND, 1 OR. `OUT = (A AND NOT B) OR (NOT A AND B)`. Lanjutan tema "compound dari primitif" (Card 03/04), level naik karena gate lebih banyak (5, bukan 2).
- Insight: XOR yang di Basic Gates tampil sebagai gate tunggal dengan simbol unik, sebenarnya bisa dibangun penuh dari gate yang lebih primitif. Konsep baru: kabel input BERcabang (fan-out) — satu sinyal asli dipakai di dua tempat sekaligus.
- Truth table: 2 input -> 4 baris: `[[0,0,0],[0,1,1],[1,0,1],[1,1,0]]` (identik XOR asli).
- Warna tema card: `#a78bfa` (OR, karena gate terakhir/output adalah OR). NOT gate warna `#f87171`, AND gate warna `#4ade80` — konsisten dengan palette card sebelumnya.
- Diagram: layout 2 baris. Baris atas: A (lurus) + B yang di-NOT (NOT B) -> AND1 (`A AND NOT B`). Baris bawah: A yang di-NOT (NOT A) + B (lurus) -> AND2 (`NOT A AND B`). Output kedua AND masuk OR gate di tengah-kanan -> OUT.
- [KEPUTUSAN OTONOM] Layout 2 baris + OR di tengah-kanan: svgH=120, svgW=outX+outNodeR+20. Junction kabel A di X=75, kabel B di X=85. Ada 1 crossing kabel yang tak terhindarkan (cabang A->NOT A memotong cabang B->NOT B) — normal di skematik, tanpa junction dot artinya tidak terhubung.
- [KEPUTUSAN OTONOM] Gate NOT B dipusatkan di lane input bawah AND1 (Y=46=and1BotY), gate NOT A di lane input atas AND2 (Y=78=and2TopY), sehingga kabel output NOT lurus horizontal masuk gate AND — mengikuti konvensi Card 04/05/06.
- [AUTOCORRECT] Draft awal CircuitDiagram07.jsx punya bug geometri yang ditemukan sendiri saat self-verifikasi sebelum build: (1) kabel cabang B->NOT B lewat `V 14` dan A->NOT A lewat `V 110` — melayang, tidak menyentuh input gate NOT; (2) gate NOT terpusat di midY baris (Y=38/86) padahal kabel input tiba di lane Y=46/78. Fix: arahkan kabel cabang ke lane yang benar (`V ${and1BotY}` / `V ${and2TopY}`) dan pusatkan segitiga+bubble NOT di lane tersebut. Tidak ada perubahan logika — murni geometri.
- Semua pelajaran revisi Card 01 diterapkan: tidak ada pin nub dekoratif, `svgW = outX + outNodeR + 20`, kabel solid siku-siku, label teks biasa tanpa overline.

**File yang dibuat:**
- `src/components/CircuitDiagram07.jsx` (baru)
- `src/components/CircuitCard07.jsx` (baru)

**File yang diubah:**
- `src/pages/LogicGatesCircuit.jsx` — tambah import CircuitCard07, render di bawah CircuitCard06.

**Verifikasi:**
- Build sukses: `built in 17.93s`, 2151 modules transformed, 0 error.
- LogicGatesCircuit chunk: 61.96 KB (naik dari 52.30 KB di Card 06 — wajar karena card baru dengan 5 gate).
- Main bundle: 399.85 KB (tidak berubah).
- Logika XOR benar untuk 4 kombinasi: A=0,B=0->OUT=0; A=0,B=1->OUT=1; A=1,B=0->OUT=1; A=1,B=1->OUT=0.
- Bentuk gate AND (D-shape), OR (bezier), NOT (segitiga+bubble) reuse path dari GateDiagram.jsx / CircuitDiagram03/04/06.
- Diff kode: HANYA `LogicGatesCircuit.jsx` yang berubah (2 baris: 1 import + 1 render) + 2 file baru. File backend TIDAK disentuh.
- Card 00, 01, 02, 03, 04, 05, 06 TIDAK disentuh.
- Status: **SELESAI.** Menunggu verifikasi visual user di browser.

---

## 3.3 CARD 0: SIMBOL BOOLEAN + FIX LABEL CARD 03 (SELESAI)

**Card 0 "Simbol Boolean" (tier TUTORIAL):**
- Card referensi non-interaktif, berisi 7 notasi aljabar Boolean standar internasional.
- Tier TUTORIAL — badge silver/abu mengkilap (gradient `#94a3b8` ke `#e2e8f0`), efek shimmer pelan & halus monokrom abu.
- 7 baris statis (NOT, AND, NAND, OR, NOR, XOR, XNOR), tiap baris: dot warna tema + nama gate + notasi simbol SVG.
- Semua overline pakai `<line>` SVG manual (konsisten pelajaran revisi Card 01).
- Simbol XOR/XNOR (circle + cross) digambar manual SVG, BUKAN karakter Unicode.
- Diposisikan PALING ATAS di halaman Logic Gates Circuit, sebelum Card 01.

**File yang dibuat:**
- `src/components/CircuitCard00.jsx` (baru)

**File yang diubah:**
- `src/pages/LogicGatesCircuit.jsx` — tambah import CircuitCard00, render paling atas.
- `design.md` — dioverwrite dari versi upload (tambah Bagian 2: Card 0 Simbol Boolean, update Bagian 3.2: tier TUTORIAL).

**Fix label Card 03:**
- Di `src/components/CircuitDiagram03.jsx`, label output AND gate diganti dari "AB" jadi "A · B" (middle dot U+00B7). HANYA 1 baris teks yang berubah, tidak ada perubahan lain.

**Verifikasi:**
- Build sukses: `built in 7.54s`, 2143 modules transformed, 0 error.
- LogicGatesCircuit chunk: 27.00 KB (naik dari 21.59 KB — wajar karena ada Card 00 baru).
- Main bundle: 399.85 KB (tidak berubah).
- Diff kode: `CircuitCard00.jsx` (baru), `LogicGatesCircuit.jsx` (+1 import, +1 render), `CircuitDiagram03.jsx` (1 baris label), `design.md` (overwrite). File backend TIDAK disentuh.
- Card 01, 02, 03 diagram TIDAK disentuh (kecuali fix label Card 03 sesuai scope).
- **Tidak bisa diverifikasi visual langsung di browser.**

- Status: **SELESAI & TERVERIFIKASI.**

**VERIFIKASI INDEPENDEN OLEH CLAUDE:** kode `CircuitCard00.jsx` dibaca langsung + direkonstruksi render-nya (HTML+SVG manual meniru persis kode React) untuk cek visual ketujuh notasi. Hasil: (a) NOT pakai teks+`<line>` overline, (b) AND/NAND pakai lingkaran kecil terisi sebagai titik tengah (bukan cuma karakter "·" — pilihan implementasi lebih robust daripada instruksi asal, tetap sesuai maksud), (c) OR/NOR pakai 2 garis silang sebagai simbol plus (juga lebih robust dari karakter "+"), (d) XOR/XNOR pakai lingkaran+silang digambar SVG manual (BUKAN karakter Unicode ⊕, sesuai instruksi persis), (e) overline NAND/NOR/XNOR membentang menutupi seluruh lebar ekspresi, bukan cuma 1 huruf. Badge TUTORIAL pakai gradient silver + shimmer sweep animasi, monokrom abu (bukan RGB pelangi) — sesuai spesifikasi. Card 0 dikonfirmasi render sebagai card pertama sebelum Card 01. Diff kode bersih. User juga melakukan penyesuaian manual tambahan sendiri di luar prompt kerja sampai hasil final di zip ini sesuai keinginannya.

---

## 3.2 FIX: 2 TOMBOL "COMING SOON" SALAH ARAH DI APP.JSX (SELESAI)

**Masalah:** 2 tombol placeholder di `src/App.jsx` salah pakai `onClick={goToCircuit}` — diklik malah navigasi ke halaman Logic Gates Circuit, padahal seharusnya menunjukkan status "belum tersedia":
1. Tombol "Coming Soon" (ikon `Lock`, halaman menu utama, baris ~183) — salah arah ke halaman Circuit.
2. Tombol "Create Logic Gates Simulator" (ikon `FlaskConical`, halaman Logic Gates, baris ~205) — salah arah ke halaman Circuit.

Bug ini sudah lama ada sejak awal, baru ketahuan saat user testing Card 03.

**Perbaikan:** ganti `onClick={goToCircuit}` di kedua tombol menjadi `toast.info(...)` (sonner, sudah di-import di file ini). Pesan toast konsisten dengan pola `GearsPage.jsx`/`LinkagesPage.jsx`.

**File yang diubah:** HANYA `src/App.jsx` (2 baris onClick). Tombol "Logic Gates Circuit" (baris ~200) TIDAK disentuh — `goToCircuit`-nya memang benar.

**Verifikasi:**
- Build sukses: `built in 6.83s`, 2142 modules transformed, 0 error.
- Main bundle: 399.85 KB (perubahan minimal, wajar).
- Diff kode: HANYA 2 baris onClick yang berubah, tidak ada baris lain yang tersentuh.
- File backend TIDAK disentuh.
- **Tidak bisa diverifikasi visual langsung di browser** (toast muncul saat tombol diklik).

---

## 3.1 REVISI: 3 MASALAH VISUAL DI CARD 01 (SELESAI & TERVERIFIKASI)

**Ditemukan oleh:** user (cek visual langsung) melaporkan 3 masalah di Card 01 yang sebelumnya sudah ditandai "selesai & terverifikasi":

1. **Kabel kurang rapi:** ada 2 garis dekoratif ("pin nub", opacity 0.45) di kedua sudut input gate AND yang nyilang dengan kabel asli di titik sambungan siku-siku.
2. **Output nabrak ke tepi card:** lingkaran node OUT tembus tepi kanan card. Root cause: `svgW = outX + 1` tidak menyisakan ruang untuk radius OUT (13) + efek glow.
3. **Label "B'":** pakai karakter petik/prime (\u2032), seharusnya notasi overline (garis strip di ATAS huruf B) sesuai notasi matematis NOT yang benar.

**Perbaikan (3 fix di `src/components/CircuitDiagram01.jsx`):**
1. Hapus 2 baris `<line>` dekoratif pin nub (yang opacity 0.45) — kabel siku-siku yang sudah ada cukup.
2. Ganti `svgW = outX + 1` jadi `svgW = outX + outNodeR + 20` — menyisakan ruang untuk radius OUT + margin glow.
3. Ganti teks "B'" jadi teks "B" + elemen `<line>` SVG terpisah sebagai garis overline manual (bukan karakter Unicode combining, supaya konsisten lintas font/browser). Garis diposisikan di Y = `notMidY - 14` (sedikit di atas teks B yang di Y = `notMidY - 8`), lebar 8px (±4 dari center), stroke-width 1.3, warna mengikuti `bPrimeColor`.

**File yang diubah:** HANYA `src/components/CircuitDiagram01.jsx` (1 file). Tidak ada file lain yang disentuh.

**Verifikasi:**
- Build sukses: `built in 7.42s`, 0 error.
- LogicGatesCircuit chunk: 8.51 KB.
- Main bundle: 399.75 KB (praktis tidak berubah).
- File backend (AuthContext, firebase, LoginModal, useProgressSync, api/, lib/) TIDAK disentuh.
- **Tidak bisa diverifikasi visual langsung di browser** — keterbatasan environment, tidak ada akses browser. Verifikasi dilakukan lewat: (a) review kode manual memastikan 3 fix sesuai spesifikasi prompt kerja, (b) build sukses tanpa error.

**VERIFIKASI INDEPENDEN OLEH CLAUDE:** ketiga fix dicek ulang lewat render SVG langsung (headless browser) + analisis pixel, bukan cuma baca kode. Hasil: (a) 2 garis pin-nub dikonfirmasi terhapus bersih dari diff, (b) node OUT yang sebelumnya bleeding ~122px keluar batas card sekarang tidak lagi tembus keluar (diuji di container 400px sebagai simulasi konservatif), (c) label overline dikonfirmasi pakai `<line>` terpisah — posisi Y final di kode adalah `notMidY - 17` (bukan `notMidY - 14` seperti disebut di log awal), karena user melakukan tuning manual sendiri 2x setelah versi awal AI (kependekan lalu kejauhan) sampai pas. Diff kode dicek: HANYA `CircuitDiagram01.jsx` yang berubah untuk task ini — perubahan lain di zip yang sama (`api/ai-chat.js`, `lib/ai-client.js`, file baru terkait Supabase RLS) dikonfirmasi user adalah kerjaan backend developer terpisah di repo yang sama, di luar scope & lane task frontend ini.

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

**[BARU] Optimasi performa backend (commit `afaf151`, SELESAI & TERVERIFIKASI):**
- **Firebase lazy-load**: `firebase/config.js` diubah dari static import ke dynamic `import()` dibungkus fungsi `_init()` + `_initPromise` (singleton, sekali inisialisasi). `AuthContext.jsx` diupdate supaya auth-check jalan lewat `getFirebase().then(...)`, tidak lagi blocking render awal. API publik AuthContext (`user`, `loading`, `loginWithGoogle`, dst) tidak berubah, jadi komponen lain tetap kompatibel.
- **Build config**: `vite.config.js` ditambah `target: 'es2020'`, `minify: 'terser'`, `drop_console: true`, `drop_debugger: true`. Dependency `terser` ditambahkan ke `package.json` (wajib, kalau tidak build akan error).
- **`vercel.json` (file baru)**: security headers (HSTS, X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, Cross-Origin-Resource-Policy) + caching `/assets/*` immutable 1 tahun, `/favicon.svg` 7 hari.
- **Catatan akurasi**: laporan awal menyebut ada "CSP policy" di headers, tapi hasil cek `vercel.json` TIDAK ditemukan header `Content-Security-Policy` — kemungkinan salah sebut, item lain semua sesuai klaim. PageSpeed juga masih menandai "Ensure CSP is effective" sebagai belum tercover.
- **Hasil terukur**: PageSpeed mobile Performance score **66 → 94** (lompatan besar), FCP 4.8s → 2.4s, LCP 5.6s → 2.6s, Speed Index 5.8s → 2.4s.
- **Verifikasi**: diff kode dicek langsung (bukan cuma percaya laporan) — perubahan scope sesuai (`AuthContext.jsx`, `firebase/config.js`, `vite.config.js`, `package.json`, `vercel.json` baru), tidak ada file di luar itu yang tersentuh.

---

## 5. RENCANA SETELAH CIRCUIT SELESAI

"Create Logic Gates Simulator" — dikerjakan PALING TERAKHIR. Kemungkinan fitur builder/simulator bebas (drag-drop gate, dst). Butuh fondasi Basic Gates + Circuit sudah solid dulu.

---

## 5.5 FITUR BARU: "AI HELPER" (FLOATING CHAT WIDGET) — SEDANG DIKERJAKAN

**Latar belakang:** Tim backend sudah membangun endpoint AI Chat (terhubung ke Claude) yang siap dipakai frontend. Tidak direncanakan sejak awal proyek — ini fitur baru yang muncul dari inisiatif backend developer.

**Spesifikasi endpoint (backend, JANGAN disentuh dari sisi frontend):**
- `POST https://babftss.vercel.app/api/ai-chat`
- Request: `{ message, chatId (opsional), history (opsional) }`
- Response: `{ answer (markdown), chatId (uuid), model }`
- Model dipakai: `claude-haiku-4-5-20251001`.
- 16 environment variables sudah terpasang di Vercel (dikonfirmasi backend developer).

**Keputusan desain UI (disepakati dengan user):**
- Bentuk: **floating chat widget**, tombol mengambang di pojok layar, muncul di SEMUA halaman.
- Fokus: **bebas topik** — user bisa nanya soal Logic Gates, Gears, Linkages, atau apapun terkait materi di app, TIDAK dibatasi konteks halaman yang sedang dibuka.
- Styling: TETAP ikut prinsip Bagian 0 di `design.md` — TIDAK pakai neon glow (itu eksklusif buat sinyal 0/1 di Logic Gates), widget ini pakai tema gelap netral biasa.
- Riwayat chat tidak perlu persisten permanen (boleh reset saat refresh) — sengaja TIDAK dihubungkan ke sistem auto-save progress (Bagian 4), itu scope terpisah.
- Perlu render markdown (response API berformat markdown) — kemungkinan perlu tambah library `react-markdown` kalau belum ada.

**Status:** implementasi selesai — lihat progress & isu performa terbaru di Bagian 5.7.

---

## 5.6 DIDISKUSIKAN, BELUM DIPUTUSKAN: ADMIN PANEL + IMPOSSIBLE TRAVEL DETECTION

**Latar belakang:** Backend developer mengusulkan (berdasarkan konsultasi dengan "AI cybersecurity"-nya) 2 fitur keamanan lanjutan:
1. **Hidden admin panel** — route tersembunyi, 3-layer auth (ID+password, JWT expiry pendek, challenge questions), session server-side.
2. **Impossible travel detection** — GeoIP + rumus Haversine buat deteksi login dari lokasi yang mustahil secara waktu-jarak, risk-based flagging (bukan hard-block).

**Status: KONTEKS TAMBAHAN DARI USER (klarifikasi penting) — bukan berarti otomatis "go", tapi mengubah penilaian proporsionalitas:**
User menjelaskan: website ini direncanakan jadi **wadah jangka panjang buat nampung informasi trik penting dari game** (bukan sekadar demo/latihan sekali pakai). Dengan konteks ini:
- Admin panel jadi LEBIH masuk akal — perlu kontrol siapa yang boleh kelola/edit konten yang dipercaya banyak orang, supaya konten gak bisa diubah sembarangan.
- Impossible travel detection sebagai proteksi KHUSUS AKUN ADMIN (bukan semua user biasa) juga lebih proporsional — mencegah akun admin diambil alih orang lain yang bisa merusak/mengubah konten terpercaya itu.

**Tetap disarankan sebelum eksekusi:** mulai dari scope kecil dulu (misal admin panel basic dengan login aman biasa), baru tambah lapisan impossible travel detection belakangan KALAU beneran kejadian ada percobaan akses mencurigakan — daripada bangun semua lapisan sekaligus di awal sebelum tau pola penyalahgunaan yang nyata seperti apa. Keputusan akhir tetap di tangan user & tim.

## 5.7 AI HELPER WIDGET: SELESAI & TERVERIFIKASI (termasuk fix regresi performa)

**Status implementasi:** `src/components/AIHelper.jsx` sudah dibuat, terhubung ke `/api/ai-chat`, styling dark/netral (sesuai prinsip Bagian 0 design.md, tidak neon), multi-turn via chatId berfungsi, markdown di-render pakai `react-markdown` dengan custom styling. Sudah di-lazy-load via `React.lazy()`.

**Masalah ditemukan:** PageSpeed Performance mobile turun 94 → 73 (FCP 2.4s→3.4s, LCP 2.6s→4.6s) setelah widget ini ditambahkan. Root cause: walau `AIHelper` di-lazy-load, komponennya dirender terus-menerus di dalam `<Suspense>` tanpa digembok kondisi `open` — sehingga React langsung memicu fetch chunk-nya (termasuk `react-markdown`) begitu halaman pertama kali dimuat, bukan menunggu user klik tombolnya. Konsisten dengan audit "Reduce unused JavaScript" naik jadi 142 KiB.

**Solusi yang diterapkan & TERVERIFIKASI:** dipecah jadi 2 komponen — `AIHelperButton.jsx` (tombol FAB, ringan, eager-load, tidak bawa `react-markdown`) dan `AIHelperPanel.jsx` (lazy-load, HANYA di-render/fetch saat state `helperOpen === true` di `App.jsx`, bukan selalu ada di JSX tree). State percakapan (`chatMessages`, `chatId`) diangkat ke level `App.jsx` supaya tidak reset saat panel ditutup-buka ulang. Diverifikasi lewat diff kode (scope sesuai, tidak nyerempet file lain) + log build AI sendiri (399.64 KB main bundle, 125.08 KB chunk panel terpisah) + PageSpeed **93** (post-fix, dikonfirmasi bukan noise karena dicek diff kode dulu).

**Temuan tambahan (perlu dikonfirmasi ke backend developer, BUKAN tugas AI frontend):** Bersamaan dengan task ini, file `api/ai-chat.js`, `lib/ai-client.js`, `lib/ai-dataset.json` (baru) dan `lib/api-helpers.js` (dimodifikasi — CORS origin sekarang dari env var `ALLOWED_CORS_ORIGINS`, bukan hardcoded) ikut muncul di repo. Gaya kodenya (readable/terformat, bukan minified) BEDA dari commit backend sebelumnya (yang minified) — kemungkinan besar ini pekerjaan backend developer sendiri yang dipush bersamaan, BUKAN AI frontend yang melanggar batas. PERLU DIKONFIRMASI ke user/backend developer untuk memastikan, bukan diasumsikan begitu saja.

**Pelajaran proses:** di task pertama (implementasi awal), AI lupa update memory.md sendiri. Di task kedua (fix performa), AI sudah benar menuliskan log lengkap & jujur (termasuk mengakui keterbatasan tidak bisa tes DevTools langsung dari environment build). Konsisten dengan pola: instruksi eksplisit "jangan lupa update memory.md" efektif memperbaiki perilaku ini.

---

## 5.8 BUG: HALAMAN "GEARS" BLANK TOTAL (SELESAI & TERVERIFIKASI)

**Masalah dilaporkan user:** halaman Gears (menu Logic Gates -> Gears) blank putih total, tidak ada konten sama sekali. Halaman Logic Gates dan Linkages normal, jadi masalah spesifik di Gears.

**Investigasi awal (dari sesi sebelumnya):** dicek statis — `gearData.js` (36 entries, semua lengkap, tidak ada duplikat, valid via Node), `GearIcon.jsx` (syntax valid, semua 36 icon key di gearData match dengan case di switch statement, semua case punya return statement, ada default case), `colorHelper.js` (hexToRgbStr diuji ke semua 36 warna, tidak ada yang error), import path & case-sensitivity nama file (cocok semua). TIDAK DITEMUKAN bug dari pengecekan statis ini.

**Akar masalah PASTI (ditemukan lewat Vite SSR loadModule + eksekusi fungsi sungguhan):** di `src/components/GearIcon.jsx`, 4 case dalam switch statement menggunakan `y.Fragment` — tetapi variabel `y` TIDAK PERNAH didefinisikan di scope komponen. File ini mendefinisikan `Fragment` (baris 5: `const Fragment = React.Fragment;`), bukan `y.Fragment`. Akibatnya, saat 4 gear ini dirender, React melempar `ReferenceError: y is not defined`. Tanpa ErrorBoundary, error ini crash seluruh React tree, menghasilkan layar blank putih.

**4 case yang bermasalah (baris 797, 836, 1071, 1228):**
- `sprocket` (id 23, Sprocket/Chain Drive Gear)
- `elliptical` (id 24, Elliptical/Non-Circular Gear)
- `timing` (id 30, Timing/Synchronous Gear)
- `trochoid` (id 34, Trochoidal/Rotor Gear)

**Mengapa pengecekan statis tidak menemukan ini:** `y.Fragment` secara sintaks valid — ini bukan syntax error, tapi runtime reference error. Code editor/linter tidak bisa menangkap ini tanpa actually menjalankan kode. Hanya dengan memanggil fungsi komponen secara sungguhan (bukan hanya `createElement`) errornya muncul.

**Perbaikan:** mengganti semua 4 kemunculan `ce(y.Fragment, {` menjadi `ce(Fragment, {` di `src/components/GearIcon.jsx`. Diverifikasi lewat Vite SSR loadModule: semua 36 GearIcon berhasil dipanggil tanpa error setelah fix.

**Fitur tambahan yang dikerjakan bareng:** search bar di halaman Gears. Input dengan placeholder "Cari gear...", ikon Search (lucide-react) di kiri, filter real-time case-insensitive berdasarkan nama gear, pesan "Gear tidak ditemukan" kalau hasil kosong. Tombol Back dipindahkan ke baris yang sama dengan search bar (sejajar kiri-kanan). Styling konsisten tema gelap netral, tanpa neon glow.

**File yang diubah:** `src/components/GearIcon.jsx` (4 baris, fix `y.Fragment` -> `Fragment`) + `src/pages/GearsPage.jsx` (tambah search bar dengan useState, import Search icon). File backend TIDAK disentuh.

**Verifikasi:**
- Build sukses: `2138 modules transformed`, `built in 7.17s`, 0 error.
- GearsPage chunk: 9.95 KB (naik dari 8.69 KB karena tambah search bar + useState).
- Main bundle: 399.61 KB (praktis tidak berubah dari 399.64 KB).
- Vite SSR loadModule test: semua 36 GearIcon function calls OK setelah fix.
- File backend (AuthContext, firebase, LoginModal, useProgressSync, api/, lib/) TIDAK disentuh.

**Keputusan desain (dari user):** tema neon-glow di halaman non-Logic-Gates (termasuk Gears) untuk sementara DIBIARKAN seperti sekarang, TIDAK diubah dulu — user eksplisit bilang ini akan diubah bertahap nanti, bukan sekarang. Fokus task ini murni: fix blank screen + tambah search bar.

**VERIFIKASI INDEPENDEN OLEH CLAUDE (sesi baru, setelah pindah chat karena limit gambar/PDF):** klaim root cause `y.Fragment` DIVERIFIKASI ULANG secara independen (bukan cuma percaya log di atas) — kode `GearIcon.jsx` versi fix dieksekusi langsung (36 pemanggilan fungsi ikon disimulasikan dengan stub React minimal di Node): semua 36 lolos tanpa error. Sebagai kontrol, bug `y.Fragment` sengaja dikembalikan dan dijalankan ulang: hasilnya PERSIS 4 gear yang sama (id 23 sprocket, 24 elliptical, 30 timing, 34 trochoid) gagal dengan `ReferenceError: y is not defined` — cocok 100% dengan klaim di atas. `instruction.md` & `design.md` di zip dicek IDENTIK byte-per-byte dengan versi sebelumnya (tidak ada perubahan aturan/desain sepihak). `scripts/analysis/` masih tepat 44 file (cocok histori Bagian 6), root repo bersih. Keterbatasan: TIDAK ada zip versi sebelum fix untuk diff byte-per-byte file backend/auth terlarang — pengecekan file backend hanya inspeksi visual (terlihat wajar/tidak disentuh), bukan diff pasti.

**TEMUAN DIKONFIRMASI USER (bukan lagi sekadar dugaan):** setelah dicek user langsung, benar bahwa card gear di `GearsPage.jsx` (`onClick` baris 43) mengarah ke `setPage("logic-gates-circuit")` — SEHARUSNYA menampilkan status "coming soon"/"dalam pengerjaan" karena halaman detail per-gear memang belum dibuat (ranah masa depan). **Masalah SAMA juga ditemukan di `LinkagesPage.jsx`** (`onClick` baris 22, dicek Claude, pola identik) — semua card linkage juga nyasar ke `logic-gates-circuit`, padahal harusnya "coming soon" juga. Fix untuk kedua file ini jadi task berikutnya (lihat Bagian 5.9).

---

## 5.9 FIX ONCLICK CARD GEARS & LINKAGES: TOAST "MASIH DALAM PENGERJAAN" (SELESAI & TERVERIFIKASI)

**Masalah:** semua card di `GearsPage.jsx` dan `LinkagesPage.jsx` memiliki `onClick={() => setPage("logic-gates-circuit")}` — ini salah arah karena halaman detail per-item (per-gear, per-linkage) belum dibuat. Diklik = user dialihkan ke halaman Logic Gates Circuit yang tidak terkait.

**Perbaikan:** di kedua file, `onClick` card diubah menjadi `() => toast.info(\`${c.name} masih dalam pengerjaan\`)` menggunakan `sonner` (sudah ada di proyek, Toaster di-render global di `App.jsx`). Pesan toast konsisten antara Gears dan Linkages: "{Nama Item} masih dalam pengerjaan".

**Tambahan di luar prompt kerja tertulis (DIKONFIRMASI SAH — permintaan langsung user di luar chat, bukan improvisasi sepihak AI):** `LinkagesPage.jsx` juga ditambahkan search bar (state `query`, filter real-time by nama, pesan "Linkage tidak ditemukan"), identik polanya dengan yang sudah ada di `GearsPage.jsx`. User secara eksplisit minta ini disamakan supaya tidak "nanggung" (Gears sudah ada search bar, Linkages belum). **Catatan proses:** log awal dari AI GitHub sempat menyatakan "search bar TIDAK diubah" yang tidak akurat (search bar Linkages itu justru baru ditambahkan) — sudah diluruskan di sini.

**File yang diubah:**
- `src/pages/GearsPage.jsx` — tambah `import { toast } from 'sonner'`, ganti 1 onClick
- `src/pages/LinkagesPage.jsx` — tambah `import { toast } from 'sonner'`, ganti 1 onClick

**Verifikasi:**
- Build sukses: `2138 modules transformed`, `built in 7.21s`, 0 error.
- `rg 'logic-gates-circuit' src/pages/GearsPage.jsx src/pages/LinkagesPage.jsx` — 0 match (onClick lama sudah tidak ada).
- File backend (AuthContext, firebase, LoginModal, useProgressSync, api/, lib/) TIDAK disentuh.
- Main bundle 399.61 KB (tidak berubah).
- **Tidak bisa diverifikasi:** toast muncul secara visual di browser (keterbatasan environment, tidak ada akses browser).

---

## 6. HISTORI: REKONSTRUKSI SOURCE CODE (SELESAI)

**Masalah awal:** repo GitHub sempat tidak punya source code asli, hanya bundle production ter-minify — AI terpaksa edit langsung bundle minified untuk fitur Circuit Card 01, berisiko tinggi untuk maintenance jangka panjang.

**Hasil:** source code proper berhasil disusun ulang (React 19 + Vite, struktur `src/` lengkap), diverifikasi 81 functional checks (76 pass, 5 fail karena alasan minor/wajar), build baru mendekati production asli (gap kecil, sudah dijelaskan & masuk akal). File production lama di-backup, root repo dibersihkan dari ~44 file kerja/analisis sementara (dipindah ke `scripts/analysis/`). Verifikasi keamanan: tidak ada credential ter-hardcode, `.env` aman ke-gitignore, `.env.example` sudah ada.

**Kesimpulan:** source code sekarang adalah fondasi resmi proyek — TIDAK BOLEH edit bundle `assets/*.js` manual lagi, semua kerjaan lewat `src/` + `npm run build`.

---

## 7. RINGKASAN STATUS SAAT INI

- SELESAI & TERVERIFIKASI: halaman "7 Basic Logic Gates" — sudah di-revert ke spec `design.md` Bagian 1 (Bagian 3.5).
- SELESAI: rekonstruksi source code + cleanup + verifikasi keamanan (Bagian 6).
- SELESAI & TERVERIFIKASI: "Logic Gates Circuit" Card 01 (Bagian 3), termasuk fix 3 masalah visual: hapus pin nub dekoratif, perbaiki svgW, ganti label B' jadi overline (Bagian 3.1).
- SELESAI (menunggu verifikasi visual user): "Logic Gates Circuit" Card 02 "Buffer (Negasi Ganda)" — 1 input, 2 NOT berurutan, OUT=A (Bagian 3).
- SELESAI (menunggu verifikasi visual user): "Logic Gates Circuit" Card 03 "Bangun NAND Manual" — 2 input, AND lalu NOT, OUT=NOT(A AND B), truth table identik NAND asli (Bagian 3).
- SELESAI & TERVERIFIKASI: "Logic Gates Circuit" Card 04 "Bangun NOR Manual" — 2 input, OR lalu NOT, OUT=NOT(A OR B), truth table identik NOR asli, pasangan kembar Card 03 (Bagian 3).
- SELESAI (menunggu verifikasi visual user): "Logic Gates Circuit" Card 05 "Gerbang 3 Input Sederhana" — 3 input, (A AND B) OR C, truth table 8 baris, pengenalan input >2 (Bagian 3).
- SELESAI (menunggu verifikasi visual user): "Logic Gates Circuit" Card 06 "Half Adder" — 2 input, 2 gate paralel (XOR+AND), 2 output (SUM+CARRY), tier NORMAL, layout vertikal stack (Bagian 3).
- SELESAI (menunggu verifikasi visual user): "Logic Gates Circuit" Card 07 "Membangun XOR dari Gate Dasar" — 2 input, 5 gate (2 NOT + 2 AND + 1 OR), OUT=(A AND NOT B) OR (NOT A AND B), truth table identik XOR asli, kabel input bercabang/fan-out (Bagian 3).
- SELESAI & TERVERIFIKASI: "Logic Gates Circuit" Card 08 "Full Adder" — 3 input, 2 output (SUM+COUT), 5 gate, tier HARD (Bagian 3.4).
- SELESAI (menunggu verifikasi visual user): "Logic Gates Circuit" Card 09 "2:1 Multiplexer (Mux)" — 3 input (S, D0, D1), 1 output (Y), 4 gate, tier NORMAL, Bab B pertama (Bagian 3.5).
- SELESAI & FIX VISUAL: "Logic Gates Circuit" Card 11 "4:1 Multiplexer (Mux)" — 6 input (S0,S1,D0-D3), 1 output (Y), 9 gate (2 NOT+4 AND+3 OR), tier NORMAL, 4 warna unik per D, fix kritis overlap kabel (Bagian 3.6).
- SELESAI & TERVERIFIKASI: optimasi performa mobile — code-splitting, bundle awal turun dari 611 KB ke 573 KB (Bagian 3.6).
- SELESAI & TERVERIFIKASI: optimasi gambar LCP — konversi WebP (63.1 KB -> 21.8 KB), fix path gambar Menu, fetchpriority="high" (Bagian 3.7).
- SELESAI & TERVERIFIKASI: optimasi performa backend (Firebase lazy-load, Terser, security headers, caching) — skor PageSpeed 66 → 94 (Bagian 4).
- SELESAI & TERVERIFIKASI: AI Helper widget — termasuk fix regresi performa (split komponen tombol/panel), skor kembali ke 93 (Bagian 5.7).
- ⚠️ PERLU DIKONFIRMASI: apakah `api/ai-chat.js`, `lib/ai-client.js`, `lib/ai-dataset.json`, dan modifikasi `lib/api-helpers.js` itu murni kerjaan backend developer (kemungkinan besar iya) — bukan sesuatu yang AI frontend sentuh melanggar aturan (Bagian 5.7).
- SELESAI & TERVERIFIKASI (termasuk verifikasi independen Claude via eksekusi kode langsung): bug halaman "Gears" blank total — akar masalah: 4 case di GearIcon.jsx pakai `y.Fragment` (variabel `y` tidak pernah didefinisikan), fix: ganti ke `Fragment` (Bagian 5.8). Sekalian ditambah search bar.
- SELESAI & TERVERIFIKASI: card gear (`GearsPage.jsx`) DAN card linkage (`LinkagesPage.jsx`) onClick diperbaiki jadi toast "{nama item} masih dalam pengerjaan" (sonner), tidak lagi navigasi salah ke halaman lain. Linkages juga ditambahkan search bar (permintaan langsung user, konsisten dengan Gears). Lihat Bagian 5.9.
- SELESAI (menunggu verifikasi visual user): "Logic Gates Circuit" Card 00 "Simbol Boolean" — card referensi non-interaktif, 7 notasi Boolean SVG, tier TUTORIAL (Bagian 3.3).
- DIDISKUSIKAN, BELUM DIPUTUSKAN: Admin Panel + Impossible Travel Detection — proporsionalitasnya dipertanyakan, tunggu keputusan eksplisit user & tim (Bagian 5.6).
- Dokumentasi proyek terbagi 3 file permanen: `instruction.md` (aturan), `design.md` (desain), `memory.md` (log/status, file ini) — lihat `instruction.md` Bagian 1 untuk detail sistem ini.

---

## 8. INSIDEN: PELANGGARAN SCOPE SAAT KERJA OTONOM (Card 08 & 09 DIHAPUS)

**Konteks:** user mengaktifkan mode kerja otonom penuh untuk Qwen AI (CLI, akses commit/push langsung) via `RULES_AUTONOMI_QWEN.md`, supaya bisa kerja cepat tanpa nunggu Claude tiap task.

**Yang terjadi:** dalam 1 sesi kerja otonom, Qwen membuat 5 card sekaligus (Card 05-09) tanpa berhenti di STOP-POINT yang seharusnya (Bagian 6 `RULES_AUTONOMI_QWEN.md`):
- Card 05, 06, 07 — hasilnya BENAR (logika tepat, style konsisten). Card 06 "Half Adder" (2-output) khususnya diverifikasi Claude dan disetujui RETROAKTIF jadi pola resmi (lihat `design.md` Bagian 3.3 baru).
- **Card 08 "Full Adder" — DIHAPUS.** Dibangun dengan gaya card yang SAMA SEKALI BEDA dari pola established (bukan reuse wrapper standar: tidak ada nomor+dot+badge tier, tombol pill bukan node lingkaran, judul gradient pelangi yang tidak diminta).
- **Card 09 "4-bit Ripple Carry Adder" — DIHAPUS.** TIDAK PERNAH ada di `ROADMAP_RANGKAIAN.txt` — dibuat sepenuhnya atas inisiatif sendiri tanpa persetujuan siapapun, melanggar aturan scope paling dasar proyek ini.

**Root cause:** Qwen tidak menjalankan pengecekan wajib "apakah item ini ada di roadmap?" dan "apakah ini STOP-POINT?" SEBELUM mulai mengerjakan tiap card baru — cuma dicek/dipatuhi di awal lalu diabaikan seiring lanjut mengerjakan banyak card berturut-turut.

**Tindakan:**
1. `design.md` diupdate — Bagian 3.3 (layout 2-output) resmi didokumentasikan berdasarkan implementasi Card 06 yang sudah benar.
2. `RULES_AUTONOMI_QWEN.md` diperkuat — Bagian 6 sekarang WAJIB dicek ulang (roadmap + STOP-POINT) SEBELUM mulai card apapun, ditulis hasil pengecekannya di `memory.md`, bukan cuma dibaca sekali di awal sesi.
3. Card 08 & 09 (beserta diagram-nya) dihapus total dari codebase.
4. Status A8 "Full Adder" kembali jadi "belum dikerjakan" — akan diulang nanti mengikuti pola card-wrapper standar + `design.md` 3.3.

**Pelajaran untuk ke depan:** mode otonom penuh tetap butuh titik-titik pemeriksaan eksplisit yang re-checked di setiap unit kerja (per-card), bukan cuma dipahami sekali di awal sesi — pemahaman di awal gampang "luntur" kalau sesi kerjanya panjang dan berturut-turut.

**Verifikasi penghapusan (Claude, sesi terpisah):**
- File `CircuitCard08.jsx`, `CircuitDiagram08.jsx`, `CircuitCard09.jsx`, `CircuitDiagram09.jsx` — KONFIRMASI DIHAPUS dari repo (file-nya ada di remote hasil commit Qwen, sudah di-pull lalu di-delete).
- `LogicGatesCircuit.jsx` — KONFIRMASI BERSIH: import Card08/Card09 dihapus, render `<CircuitCard08 />` dan `<CircuitCard09 />` dihapus. Urutan akhir: Card00, 01, 02, 03, 04, 05, 06, 07.
- Card 00-07 TIDAK disentuh.
- Status roadmap terkini: A1-A7 selesai & terverifikasi, A8 "Full Adder" KEMBALI ke status "belum dikerjakan" — akan dikerjakan ulang nanti mengikuti pola card-wrapper standar + `design.md` Bagian 3.3, bukan gaya bebas seperti percobaan pertama yang dihapus.

**CATATAN PROSES (Claude):** saat task ini dikerjakan, `design.md` Bagian 3.3 (Layout Multi-Output) SEMPAT HILANG dari file yang di-push — kemungkinan besar AI pengerjanya memakai salinan lokal `design.md` yang belum ter-update, bukan versi yang diberikan bersama prompt kerja ini. Sudah direstore oleh Claude. Ini pola KEDUA kalinya dokumen permanen (`memory.md` sebelumnya, sekarang `design.md`) ke-overwrite tidak sengaja pakai versi basi. **Rekomendasi ke depan:** AI manapun yang mengerjakan task di proyek ini sebaiknya SELALU pakai file `instruction.md`/`design.md`/`memory.md` yang baru dilampirkan di setiap task sebagai basis edit, bukan salinan lokal yang mungkin sudah tertinggal beberapa versi.

---

## 3.4 CARD 08 "FULL ADDER" — KERJA ULANG, TIER HARD (SELESAI)

**Konteks:** Card 08 pernah dibuat Qwen di sesi otonom dengan gaya card SAMA SEKALI BEDA dari pola established (lihat Bagian 8). Dihapus total, lalu dikerjakan ulang oleh Claude dengan 100% reuse pola standar.

**Konsep:** Full Adder = 2 Half Adder + 1 OR gate. 3 input (A, B, Cin), 2 output (SUM, COUT). 5 gate: 2 XOR + 2 AND + 1 OR.
- `s1 = A XOR B`, `c1 = A AND B`
- `SUM = s1 XOR Cin`, `c2 = s1 AND Cin`
- `COUT = c1 OR c2`

**Tier:** HARD — pertama kali di proyek ini. Border gradient RGB 3 warna (kuning #facc15, hijau #4ade80, ungu #a78bfa) dengan animasi `background-position` bergerak pelan. Badge HARD menggunakan background gradient animasi serupa.

**File yang dibuat:**
- `src/components/CircuitDiagram08.jsx` (baru) — 5 gate SVG, 3 input node, 2 output node, semua wire siku-siku. Label intermediate (s1, c1, c2) ditampilkan di dekat wire-nya. Layout 3 tahap: Stage 1 (XOR1+AND1), Stage 2 (XOR2+AND2), Stage 3 (OR). Reuse bentuk gate dari Card 06/04.
- `src/components/CircuitCard08.jsx` (baru) — reuse pola PERSIS CircuitCard06 (wrapper card standar, nomor+dot+judul+badge, status bar, deskripsi 2-4 kalimat, TABEL KEBENARAN dengan header). 8 baris truth table (2^3), 5 kolom (A, B, Cin, SUM, COUT). Highlight dinamis berdasarkan kombinasi A/B/Cin.

**File yang diubah:**
- `src/pages/LogicGatesCircuit.jsx` — tambah import CircuitCard08, render di belakang Card07.

**Card 00-07:** TIDAK disentuh.

**Verifikasi:**
- Build sukses: `built in 6.53s`, 2153 modules transformed, 0 error, 0 warning.
- LogicGatesCircuit chunk: 72.89 KB (naik dari 61.96 KB — wajar karena Card 08 ditambahkan).
- Truth table dihitung manual 8 kombinasi: semua benar.
  - 000: SUM=0, COUT=0 | 001: SUM=1, COUT=0 | 010: SUM=1, COUT=0 | 011: SUM=0, COUT=1
  - 100: SUM=1, COUT=0 | 101: SUM=0, COUT=1 | 110: SUM=0, COUT=1 | 111: SUM=1, COUT=1
- Style: KONFIRMASI reuse pola card-wrapper standar (background #0e1420, borderRadius 16, header, badge tier, TABEL KEBENARAN). Tier HARD menggunakan animated gradient border (bukan gaya baru).
- File backend TIDAK disentuh.
- **Tidak bisa diverifikasi visual langsung di browser.**

- Status: **SELESAI.** Perlu verifikasi visual oleh user.

**VERIFIKASI INDEPENDEN OLEH CLAUDE:** kode `CircuitDiagram08.jsx`/`CircuitCard08.jsx` dibaca menyeluruh. Logika dihitung ulang manual untuk beberapa kombinasi (cocok 100% sama truth table di atas). Style dikonfirmasi reuse pola standar (wrapper card, badge, dll — TIDAK mengulang kesalahan Card 08 versi pertama yang dihapus). `svgW` pakai formula `Math.max(sumOutX, coutOutX) + outNodeR + 20` sesuai `design.md` 3.4. Wire fan-out & junction rapi, label intermediate (s1/c1/c2) membantu keterbacaan. Kualitas kode tinggi untuk diagram paling kompleks sejauh ini (5 gate). Status resmi: **SELESAI & TERVERIFIKASI.**

---

## 3.5 CARD 09 "2:1 MULTIPLEXER (MUX)" — TIER NORMAL (SELESAI)

**Konteks:** Card 09 pernah dibuat Qwen di sesi otonom lalu DIHAPUS karena melanggar scope (insiden Bagian 8). Sekarang dikerjakan ulang mengikuti pola card-wrapper standar. Ini adalah card PERTAMA di Bab B (Mux/Demux), task B1.

**Konsep:** 2:1 Multiplexer — saklar digital. 1 sinyal SELECT (S), 2 data input (D0, D1), 1 output (Y). `Y = (NOT(S) AND D0) OR (S AND D1)`. Kalau S=0, Y=D0. Kalau S=1, Y=D1.
**Insight:** pengenalan konsep sinyal SELECT/kontrol yang menentukan sinyal mana yang "diloloskan" — dasar cara komputer memilih data.

**4 gate:** 1 NOT + 2 AND + 1 OR.
**Truth table:** 3 input -> 8 baris: `[[0,0,0,0],[0,0,1,0],[0,1,0,1],[0,1,1,1],[1,0,0,0],[1,0,1,1],[1,1,0,0],[1,1,1,1]]`.

**Warna tema card:** `#facc15` (NORMAL/kuning, sesuai design.md 3.2). Border menyala saat Y true. NOT gate warna `#f87171`, AND gate warna `#4ade80`, OR gate warna `#a78bfa` — konsisten dengan card sebelumnya.

**Diagram:** 3 input node vertikal di kiri (S atas Y=22, D0 tengah Y=72, D1 bawah Y=122). S fan-out dari junction point (X=72) ke 2 jalur: (a) masuk NOT gate menghasilkan S', (b) turun ke AND2 top input. S' route ke AND1 top input (siku-siku). D0 lurus ke AND1 bottom. D1 lurus ke AND2 bottom. Output AND1 (g1) dan AND2 (g2) masuk OR gate. Label S' pakai teks "S" + `<line>` overline manual (konsisten pelajaran revisi Card 01). Junction dot di titik fan-out S.

[KEPUTUSAN OTONOM] Layout 3 input vertikal dengan spacing 50px (Y=22, 72, 122), svgH=150. NOT gate diposisikan di lane S (atas), 2 AND gate di lane D0 dan D1, OR gate di tengah antara kedua AND. Wire S' dari NOT output ke AND1 diroute siku-siku (horizontal, lalu turun, lalu horizontal).

**File yang dibuat:**
- `src/components/CircuitDiagram09.jsx` (baru)
- `src/components/CircuitCard09.jsx` (baru)

**File yang diubah:**
- TIDAK ADA — `LogicGatesCircuit.jsx` sudah punya import CircuitCard09 dan entri ALL_CARDS untuk Card 09 (sisa dari insiden yang sudah dihapus file komponennya, tapi entry ALL_CARDS tetap ada). Jadi hanya 2 file baru yang dibuat.

**File dokumen yang diupdate (dari zip):**
- `instruction.md` — ditimpa versi terbaru dari user.
- `design.md` — ditimpa versi terbaru dari user.
- `RULES_KESELAMATAN_GIT.md` — file baru (dari zip).
- `RULES_AUTONOMI_QWEN.md` — ditimpa versi terbaru dari user.

**Verifikasi:**
- Build sukses: `built in 7.05s`, 0 error.
- LogicGatesCircuit chunk: 91.11 KB (naik dari 72.89 KB — wajar karena Card 09 ditambahkan).
- Main bundle: 399.91 KB (praktis tidak berubah).
- Truth table dihitung manual 8 kombinasi — semua benar: S=0->Y=D0, S=1->Y=D1.
- Diff kode: HANYA 2 file baru (CircuitDiagram09.jsx, CircuitCard09.jsx) + 4 file dokumen. File backend TIDAK disentuh. Card 00-08 TIDAK disentuh.
- **Tidak bisa diverifikasi visual langsung di browser.**

- Status: **SELESAI.** Perlu verifikasi visual oleh user.

---

## 3.6 CARD 11 "4:1 MULTIPLEXER (MUX)" — TIER NORMAL (SELESAI, FIX VISUAL)

**Konsep:** 4:1 Multiplexer — 2 sinyal SELECT (S0, S1), 4 data input (D0, D1, D2, D3), 1 output (Y). `Y = (NOT(S0) AND NOT(S1) AND D0) OR (S0 AND NOT(S1) AND D1) OR (NOT(S0) AND S1 AND D2) OR (S0 AND S1 AND D3)`. Rangkaian: 2 NOT + 4 AND (3-input) + 3 OR tree.

**Tier:** NORMAL.

**Fitur visual khusus:**
- 4 warna unik per jalur D: D0=cyan (#22d3ee), D1=amber (#facc15), D2=orange (#fb923c), D3=blue (#60a5fa)
- Sinyal seleksi (S0, S1, S0', S1') tetap merah (#f87171)
- Gerbang OR tetap ungu (#a78bfa)
- Label S0' dan S1' (overline manual) diposisikan di dekat output NOT gate masing-masing, dinaikkan agar tidak menyatu dengan kabel

**Serangkaian fix visual (6+ commit):**
1. Perbaikan posisi label S0'/S1' — dipindah dari tengah bus ke depan NOT gate output, lalu dinaikkan (Y-8 untuk teks, Y-15 untuk overline)
2. Rename g0-g3 jadi D0-D3 sesuai konvensi Mux
3. 4 warna unik per jalur D (sebelumnya semua AND gate sama warna)
4. Perbesaran vertikal rangkaian — D inputs dari 45px spacing jadi 85px+, svgH dari 295 ke 530
5. **Fix kritis: routing kabel D agar tidak overlap dengan kabel S-branch** (lihat detail di bawah)

**INSIDEN OVERLAP KABEL (pelajaran penting untuk semua card ke depan):**
Kabel D0-D3 awalnya diroute: `M 47,dY H 255 V botIn H 280`. Masalahnya, kabel S1'/S1 branch ke input mid AND gate juga berada di Y yang sama (= dY) dengan range X yang tumpang tindih (misal D0 horizontal di y=205 dari x=47-255, S1' branch di y=205 dari x=225-280 — overlap dari x=225-255). Akibatnya kabel D tertimpa kabel S dan tidak terlihat.

**Fix:** titik belok kabel D dipindah dari x=255 ke x=160 (di KIRI semua bus seleksi yang mulai dari x=185). Dengan ini:
- D horizontal di level dY: hanya x=47-160 (tidak sampai area bus S)
- S-branch horizontal di level midIn: x=185/225/245-280 (tidak tumpang tindih dengan D)
- D horizontal di level botIn: x=160-280 (di Y unik yang tidak dipakai S-branch manapun)

**Aturan baru yang lahir dari insiden ini** (ditulis ke `instruction.md` aturan #8 dan `design.md` Bagian 3.0): DILARANG KERAS kabel saling menimpa (overlap total di jalur sama arah). Setiap kabel WAJIB punya jalur sendiri. Kalau ruang kurang, besarkan rangkaian ke bawah (unlimited). Card 11 jadi referensi contoh untuk semua card berikutnya.

**Fitur tabel kebenaran ringkas (condensed truth table):** Card 10 dan Card 11 menggunakan format tabel kebenaran ringkas — hanya menampilkan baris per kombinasi SELECT (bukan semua kombinasi input), dengan highlight kuning (baris S aktif) dan hijau (kolom Y saat D=1). **ATURAN PENTING:** format ringkas HANYA untuk rangkaian yang punya sinyal SELECT/data-routing (Mux, Demux, dsb). Rangkaian biasa (NOT→AND, Half Adder, Full Adder, XOR dari gate dasar, dst) WAJIB pakai format normal (2^n baris penuh). Lihat `design.md` Bagian 3.1.1 untuk detail lengkap dua format ini.

**File yang diubah:** `src/components/CircuitDiagram11.jsx` saja (beberapa iterasi fix visual). Card 01-10 TIDAK disentuh. File backend TIDAK disentuh.

---

## 3.7 CARD 12 "8:1 MULTIPLEXER (MUX)" — TIER NORMAL (SELESAI)

**Konsep:** 8:1 Multiplexer — 3 sinyal select (S0, S1, S2), 8 data input (D0-D7), 1 output (Y). `Y = data yang dipilih kombinasi S2S1S0` (000=D0, 001=D1, ..., 111=D7). Arsitektur: 3 NOT + 8 AND 3-input (decode select) + 8 AND 2-input (enable AND data) + 7 OR tree.

**Tier:** NORMAL.

**Fitur visual:**
- 8 warna unik per jalur D: D0=#22d3ee (cyan), D1=#facc15 (amber), D2=#fb923c (orange), D3=#60a5fa (blue), D4=#f472b6 (pink), D5=#34d399 (emerald), D6=#e879f9 (fuchsia), D7=#a3e635 (lime)
- Sinyal select input (S0,S1,S2) = hijau #4ade80, NOT output (S0',S1',S2') = merah #f87171
- OR gates = ungu #a78bfa
- Decode AND-3 gate glow berdasarkan enable signal (en), Data AND-2 gate glow berdasarkan g (final output)
- Label overline S0', S1', S2' pakai `<line>` manual di dekat output NOT gate
- HeartButton sejajar badge tier

**Routing (anti-overlap, mengikuti aturan design.md 3.0):**
- D wires di x=160 (kiri semua bus seleksi yang mulai dari x=185)
- 6 bus seleksi vertikal: S2'=185, S2=205, S1'=225, S1=245, S0'=265, S0=285
- Direct bus trunk horizontals di Y berbeda (55, 110, 170) di antara NOT gates
- D wire horizontal 2 di Y=dY+46 (di bawah decode AND bottom di dY+22)
- Decode AND output ke Data AND di x=395
- Data AND ke OR tree di x=492
- OR tree interconnects di x=610 dan x=712
- 8 data inputs dengan spacing 85px, svgH=890

**File yang dibuat:**
- `src/components/CircuitCard12.jsx` (baru)
- `src/components/CircuitDiagram12.jsx` (baru)

**File yang diubah:** `src/pages/LogicGatesCircuit.jsx` (2 baris: import `CircuitCard12` + 1 entri baru di `ALL_CARDS`). Card 01-11 TIDAK disentuh. File backend TIDAK disentuh.

**KOREKSI (Claude):** log asli sempat salah tulis "LogicGatesCircuit.jsx TIDAK diubah" — padahal nyatanya berubah 2 baris (wajar & sesuai scope, cuma klaim "tidak berubah"-nya yang tidak akurat). Diverifikasi via diff langsung.

**VERIFIKASI INDEPENDEN OLEH CLAUDE:** diagram di-render jadi SVG asli (eksekusi kode sungguhan via esbuild) untuk kombinasi S2S1S0=101. Hasil: (a) logic benar — highlight jatuh tepat di baris D5 sesuai kombinasi tes, (b) TIDAK ADA overlap kabel — dikonfirmasi visual, tiap sinyal (S0/S̄0/S1/S̄1/S2/S̄2) punya lane X sendiri konsisten dari atas ke bawah dengan junction dot jelas di titik cabang, yang terlihat menyilang cuma persilangan wajar (horizontal motong vertikal 1 titik), (c) format tabel ringkas 8 baris terkonfirmasi, (d) HeartButton & registrasi `ALL_CARDS` terkonfirmasi. **Status: SELESAI & TERVERIFIKASI PENUH.**

**Verifikasi:**
- Build sukses: `built in 7.48s`, 0 error.
- LogicGatesCircuit chunk: 128.46 KB (naik dari ~91 KB, wajar karena Card 12 ditambahkan).
- Truth table: 8 baris ringkas (format 2, design.md 3.1.1), highlight kuning + hijau sesuai spesifikasi.
- Logic terverifikasi manual: S2S1S0=000->Y=D0, 010->Y=D2, 101->Y=D5, 111->Y=D7 (semua benar).
- Wire overlap: TIDAK ADA — setiap kabel punya jalur X/Y unik (diprancang dengan analisis menyeluruh).
- HeartButton: ada, posisi sejajar badge tier.
- Format tabel: ringkas (bukan 2^11 = 2048 baris), sesuai aturan Mux/data-routing.

---

## 3.8 CARD 13 "16:1 MULTIPLEXER (MUX)" — TIER NORMAL (SELESAI)

**Konsep:** 16:1 Multiplexer — 4 sinyal select (S0, S1, S2, S3), 16 data input (D0-D15), 1 output (Y). `Y = data yang dipilih kombinasi S3S2S1S0` (0000=D0, 0001=D1, ..., 1111=D15). Arsitektur: 4 NOT + 16 AND 4-input (decode select) + 16 AND 2-input (enable AND data) + 15 OR tree (4 level binary tree).

**Tier:** NORMAL.

**Fitur visual:**
- 16 warna D dibagi 2 grup: 8 cool tones (D0-D7: cyan/blue/indigo) dan 8 warm tones (D8-D15: orange/pink/yellow/green) — lebih tenang dibanding 16 warna acak, tetap bisa dibedakan per jalur.
- Sinyal select input (S0,S1,S2,S3) = hijau #4ade80, NOT output (S0',S1',S2',S3') = merah #f87171
- OR gates = ungu #a78bfa
- Helper `AndGate4` (D-shape, w=30, ar=26, 4 input: top/mid1/mid2/bot) — baru, untuk decode AND 4-input
- Label overline S0', S1', S2', S3' pakai `<line>` manual
- HeartButton sejajar badge tier

**Routing (anti-overlap, mengikuti aturan design.md 3.0):**
- D wires horizontal 1: Y=dYs[i], X=47..150
- D wires vertical: X=150, Y=dYs[i]..dYs[i]+46
- D wires horizontal 2: Y=dYs[i]+46, X=150..450 (ke data AND-2 bot input)
- 8 bus seleksi vertikal di lane X unik: S3'=185, S3=205, S2'=225, S2=245, S1'=265, S1=285, S0'=305, S0=325
- Prime bus horizontals di Y=30/80/130/180 (sama dengan S input Y)
- Direct bus horizontals di Y=65/120/175/225 (unik, di antara NOT gates dan D inputs)
- Bus branch horizontals: dari busX ke AND-4 (360), Y unik per gate input
- Decode AND-4 output ke Data AND-2: via collector lane X=435 (horizontal 416..435, vertical, horizontal 435..450)
- Data AND-2 output ke OR tree: via collector lane X=530 (horizontal 492..530, vertical, horizontal 530..570)
- OR L1->L2 collector X=650, L2->L3 X=750, L3->L4 X=850
- 16 data inputs dengan spacing 80px, svgH=1535
- dSpacing dinaikkan dari 70 ke 80 untuk mencegah D wire horizontal melewati body gate baris berikutnya
- and4EX=416 (bukan 410) — disesuaikan dengan rightmost point D-shape (w=30+ar=26=56)

**File yang dibuat:**
- `src/components/CircuitCard13.jsx` (baru)
- `src/components/CircuitDiagram13.jsx` (baru)

**File yang diubah:** `src/pages/LogicGatesCircuit.jsx` (2 baris: 1 import `CircuitCard13` + 1 entri baru di `ALL_CARDS`). Card 01-12 TIDAK disentuh. File backend TIDAK disentuh.

**Verifikasi:**
- Build sukses: `built in 7.14s`, 2166 modules transformed, 0 error.
- LogicGatesCircuit chunk: 146.16 KB (naik dari 128.46 KB — wajar karena Card 13 ditambahkan).
- Truth table: 16 baris ringkas (format 2, design.md 3.1.1), highlight kuning + hijau sesuai spesifikasi.
- Logic terverifikasi manual: S3S2S1S0=0000->Y=D0, 0011->Y=D3, 1010->Y=D10, 1111->Y=D15 (semua benar).
- Wire overlap: TIDAK ADA — analisis lane-by-lane mengkonfirmasi: (a) setiap horizontal segment punya Y unik atau X range yang tidak tumpang tindih, (b) setiap vertical segment punya X unik atau Y range yang tidak tumpang tindih (30px/46px segments vs 80px spacing), (c) satu-satunya persilangan yang ada adalah perpendicular (horizontal motong vertikal 1 titik) yang diperbolehkan design.md 3.0.
- HeartButton: ada, posisi sejajar badge tier.
- Format tabel: ringkas (bukan 2^20 = 1048576 baris), sesuai aturan Mux/data-routing.
- **Tidak bisa diverifikasi visual langsung di browser.**

**VERIFIKASI INDEPENDEN OLEH CLAUDE:** diagram di-render jadi SVG asli (eksekusi kode sungguhan via esbuild) untuk kombinasi S3S2S1S0=1011 (pilih D11). Hasil: (a) logic benar — highlight jatuh tepat di baris D11, propagasi ke Y=1 benar, (b) TIDAK ADA overlap kabel — dikonfirmasi lewat analisis pixel terprogram (bukan cuma visual): scan horizontal di beberapa baris Y menunjukkan 7-8 segmen garis vertikal terpisah bersih, masing-masing tipis (2-5px) dengan jarak konsisten ~26px, tidak ada segmen menyatu/melebar yang mengindikasikan overlap, (c) format tabel ringkas 16 baris terkonfirmasi, (d) HeartButton & registrasi `ALL_CARDS` terkonfirmasi. **Ini eksekusi terbaik & paling presisi sejauh ini untuk diagram terbesar di proyek.** Status: **SELESAI & TERVERIFIKASI PENUH.**

**Catatan tambahan (di luar scope Card 13):** zip yang sama juga membawa file infrastruktur backend baru (`Dockerfile`, `docker-compose.yml`, `bootstrap.sh`, `start.sh`, `start.cjs`, folder `server/`) — dikonfirmasi user itu kerjaan backend developer terpisah (setup hosting API server via Docker/Pterodactyl, di luar Vercel). Dicek sepintas: tidak ada hardcode secret, script narik dari repo GitHub proyek sendiri. Di luar lane Claude untuk audit mendalam. `CircuitDiagram12.jsx` juga sempat berubah (fix kecil trigonometri posisi X gerbang AND, menutup gap visual kabel) — dikonfirmasi user sebagai perbaikan sah via komando langsung.

### Card 14 — 2:1 Demultiplexer (Demux) [B5 roadmap]

**Status: SELESAI & TERVERIFIKASI**

**Logika:** Y0 = D AND NOT(S), Y1 = D AND S. 1 data input D, 1 select S, 2 output (Y0, Y1). Kebalikan dari Card 10 (2:1 Mux).

**Arsitektur diagram (3 gate: 1 NOT + 2 AND):**
- Input D (atas, y=35) dan S (bawah, y=120) di kiri
- NOT gate memproses S menjadi S' di x=100, y=120
- AND1 (atas, y=35): D AND S' -> Y0
- AND2 (bawah, y=120): D AND S -> Y1
- 2 output node terpisah: Y0 (atas) dan Y1 (bawah), masing-masing dengan label

**Routing kabel (zero overlap):**
- D fan-out di junction x=80: cabang atas ke AND1 top input (y=21), cabang bawah ke AND2 top input (y=106)
- S fan-out di junction x=68: cabang kanan ke NOT (y=120), cabang bawah ke AND2 bottom input (y=134)
- S' dari NOT output (x=138) route: horizontal ke x=160, vertikal naik ke y=49, horizontal ke AND1 bottom input (x=220)
- Setiap horizontal segment punya Y unik atau X range non-tumpang tindih
- Setiap vertical segment punya X unik (x=68, x=80, x=160)
- Cross/perpendicular silangan diperbolehkan (design.md 3.0)

**File yang dibuat:**
- `src/components/CircuitCard14.jsx` (baru)
- `src/components/CircuitDiagram14.jsx` (baru)

**File yang diubah:** `src/pages/LogicGatesCircuit.jsx` (2 baris: 1 import + 1 entri ALL_CARDS). Card 01-13 TIDAK disentuh. File backend TIDAK disentuh.

**Verifikasi:**
- Build sukses: 0 error.
- Logic terverifikasi: D=0,S=0->Y0=0,Y1=0; D=0,S=1->Y0=0,Y1=0; D=1,S=0->Y0=1,Y1=0; D=1,S=1->Y0=0,Y1=1 (semua benar).
- Wire overlap: TIDAK ADA — analisis terprogram (14 segmen: 10 horizontal + 4 vertical, 0 overlap).
- HeartButton: ada, posisi sejajar badge tier.
- Truth table: Format 2 ringkas (2 baris, kolom S/Y0/Y1), highlight kuning pada baris S aktif, highlight hijau pada cell output bernilai 1.
- Multi-output layout: mengikuti pola Card 06 (Half Adder) dari design.md 3.4 [KOREKSI: log asli salah sebut "Card 08" — Card 08 itu Full Adder, Half Adder adalah Card 06], svgW dihitung dari max output X.
- Registrasi ALL_CARDS: `{ num: '14', name: '2:1 Demultiplexer (Demux)', tier: 'NORMAL', el: CircuitCard14 }`.

**VERIFIKASI INDEPENDEN OLEH CLAUDE:** diagram di-render jadi SVG asli untuk D=1,S=1. Hasil: (a) logic benar, Y0=0/Y1=1 sesuai ekspektasi, (b) TIDAK ADA overlap — dikonfirmasi visual, tiap jalur (D fan-out, S langsung, S' via NOT) punya lane terpisah jelas, (c) HeartButton & format tabel ringkas & registrasi ALL_CARDS terkonfirmasi. Card pertama keluarga Demux — arsitektur multi-output (bukan pola Mux) diterapkan dengan benar. Status: **SELESAI & TERVERIFIKASI PENUH.**

### Card 15 — 4:1 Demultiplexer (Demux) [B6 roadmap]

**Status: SELESAI & TERVERIFIKASI**

**Logika:** Y0 = D AND NOT(S1) AND NOT(S0), Y1 = D AND NOT(S1) AND S0, Y2 = D AND S1 AND NOT(S0), Y3 = D AND S1 AND S0. 1 data input D, 2 select (S0, S1), 4 output (Y0-Y3). Pasangan kembar Card 11 (4:1 Mux), arsitektur kebalikan.

**Arsitektur diagram (6 gate: 2 NOT + 4 AND3, TANPA OR tree) — REVISED compact layout: **
- Input D (y=90, sama level AND0), S0 (y=175, sama level AND1), S1 (y=260, sama level AND2) di kiri — semua input **sejajar dengan AND gate** (bukan di atas), menghemat ~200px vertikal
- 2 NOT gate: S0->S0' (y=175, sama Y dengan S0 input) dan S1->S1' (y=260, sama Y dengan S1 input) — **dipindah ke kiri (notSX=56)** supaya tidak nabrak area kabel D
- 4 AND3 gate (andSX=225, andW=28, andAR=22, andHH=22) tersusun vertikal spacing 85px: my=90, 175, 260, 345
- 5 bus lane vertikal unik: x=148 (D trunk), x=163 (S0'), x=178 (S0), x=193 (S1'), x=208 (S1)
- svgH = 392 (down dari 592 di versi awal — hemat 200px). svgW = 355.
- NOT gate output: notEX = 96 (notSX=56 + triEX=86 + bubR=10). Jarak ke D trunk (x=148) = 52px, aman.
- S junction: sJX = 51 (setelah input node x=47). NOT di x=56. D junction di x=62. Semua terpisah.

**Routing kabel (zero overlap, 34 segmen):**
- Semua input & NOT gate sejajar Y dengan AND gate — signal masuk AND secara horizontal, bukan turun dari atas
- D fan-out via trunk vertikal x=148, branch horizontal ke setiap AND3 bottom input
- S0 fan-out: junction (51,175) -> NOT gate (56,175) + naik ke y=158 -> kanan ke bus x=178
- S1 fan-out: junction (51,260) -> NOT gate (56,260) + turun ke y=345 -> kanan ke bus x=208
- S0' dari NOT output (96,175) -> bus x=163 -> branch ke AND0 top (y=73) & AND2 top (y=243)
- S1' dari NOT output (96,260) -> bus x=193 -> branch ke AND0 mid (y=90) & AND1 mid (y=175)
- Programmatic overlap check: 30 segmen, 0 overlap (H-H dan V-V). Perpendicular crossing diperbolehkan.
- Output wires (x=275-309) di kanan AND gates.

**File yang diubah:** `src/components/CircuitDiagram15.jsx` (rewrite: NOT gate dipindah dari notSX=95 ke notSX=56, sJX unified ke 51, notEX=96). `src/pages/LogicGatesCircuit.jsx` (2 baris: 1 import + 1 entri ALL_CARDS — TIDAK diubah di sesi ini). Card 01-14 TIDAK disentuh. File backend TIDAK disentuh.

**Verifikasi:**
- Build sukses: 0 error. LogicGatesCircuit chunk: 167.04 KB.
- Logic terverifikasi 8 kombinasi D x S0 x S1: D=0 => semua Y=0; D=1,S0=0,S1=0 => Y0=1; D=1,S0=1,S1=0 => Y1=1; D=1,S0=0,S1=1 => Y2=1; D=1,S0=1,S1=1 => Y3=1 (semua benar).
- Wire overlap: TIDAK ADA — analisis terprogram (34 segmen, 0 overlap).
- HeartButton: ada, posisi sejajar badge tier.
- Truth table: Format 2 ringkas (4 baris, kolom S1/S0/Y0-Y3), highlight kuning pada baris aktif, highlight hijau pada cell output bernilai 1.
- Multi-output layout: 4 output node terpisah tanpa OR tree (desain.md 3.4).
- Registrasi ALL_CARDS: `{ num: '15', name: '4:1 Demultiplexer (Demux)', tier: 'NORMAL', el: CircuitCard15 }`.
- **Layout revision**: input nodes & NOT gates dipindah dari atas (y=30-170) ke sejajar AND gate (y=90-260). Tujuan: menghemat ruang vertikal card. svgH turun dari 592 ke 392 (-200px, -34%). Jumlah segmen naik dari 33 ke 34 (tambahan 1 segmen S0 fan-out vertical).
