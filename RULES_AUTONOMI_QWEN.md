# RULES_AUTONOMI_QWEN.md — Mode Kerja Otonom Penuh

> Berlaku KHUSUS untuk proyek BABFT Learning ini. Di luar proyek ini, tetap tanya seperti biasa (jangan generalisasi mode ini ke proyek/task lain).

## 0. LATAR BELAKANG

Mulai sekarang, user beroperasi LANGSUNG sama kamu (Qwen) sat-set tanpa nunggu Claude di setiap task. Claude cuma dipanggil kalau: (a) ada referensi visual/gambar yang perlu diubah jadi prompt kerja presisi (kamu tidak bisa scan gambar), atau (b) diskusi arah besar roadmap. Selebihnya kamu jalan otonom penuh.

## 1. MODE AUTO-YES (KHUSUS PROYEK INI SAJA)

Untuk SEMUA aksi teknis di proyek ini (edit file, commit, push, buat file baru, dst) yang MASIH DALAM SCOPE task yang diberikan — LANGSUNG EKSEKUSI, JANGAN tanya konfirmasi "boleh saya lakukan X?" ke user. Anggap izin sudah diberikan di awal.

> **PENGECUALIAN MUTLAK (baca `RULES_KESELAMATAN_GIT.md` — WAJIB, ini bukan opsional):** auto-yes TIDAK PERNAH berlaku untuk `git push --force`/`-f`/`--force-with-lease`, atau operasi git apapun yang berpotensi menimpa/menghilangkan history. Ini lahir dari insiden nyata (repo GitHub sempat ketiban konten kosong, website 404 total, karena AI force-push dari folder salah). Untuk git push BIASA (bukan force), tetap WAJIB verifikasi direktori dulu sesuai `RULES_KESELAMATAN_GIT.md` Aturan 2 SEBELUM eksekusi — verifikasi ini TIDAK perlu tanya user (auto-yes tetap berlaku untuk proses verifikasinya sendiri), tapi kalau verifikasi GAGAL/hasilnya janggal, WAJIB berhenti & lapor ke user, JANGAN lanjut.

**KECUALI** — tetap WAJIB berhenti dan tanya user dulu (auto-yes TIDAK berlaku) kalau:
- Aksi menyentuh file backend/auth/database (daftar di `instruction.md` Bagian 5) — TETAP TERLARANG MUTLAK, auto-yes tidak membatalkan larangan ini.
- Aksi mengubah `vite.config.js` atau `vercel.json` (zona bersama) — tetap wajib cross-check ke teman backend dulu.
- Task yang diminta TIDAK punya prompt kerja tertulis yang jelas (misal user cuma bilang "lanjutin aja" tanpa spek) — dalam kasus ini, SUSUN dulu rencana kerja tertulis singkat (mirip prompt kerja), lalu baru eksekusi (boleh tanpa nunggu approval eksplisit, tapi rencananya harus ditulis dulu supaya ada jejak).
- Situasi di Bagian 3 (STOP-POINT roadmap) di bawah ini.

## 2. SELF-VERIFIKASI WAJIB SEBELUM MENYATAKAN TASK "SELESAI"

Sebelum bilang task selesai, jalankan checklist ini secara aktif (bukan asumsi):

1. **Scope check:** diff/list file yang berubah — apakah PERSIS sesuai yang direncanakan? Ada file di luar rencana yang ikut kesenggol? Kalau ada, itu HARUS dijelaskan alasannya di `memory.md`, jangan disembunyikan.
2. **Logic check:** kalau ada logika boolean/kalkulasi, hitung manual semua kombinasi truth table, pastikan cocok 100% sama definisi gate yang dimaksud.
3. **Pattern-consistency check:** bentuk gate, warna tema, struktur wire, cara render label negasi (overline manual, bukan Unicode) — semua HARUS reuse pola yang sudah established di card-card sebelumnya (cek langsung ke file existing, jangan dari ingatan/asumsi).
4. **Visual check (kalau environment mendukung):** kalau kamu punya akses Node.js + browser headless (Chrome/Playwright/Puppeteer) di environment CLI kamu, render komponen yang diubah jadi screenshot, lalu cek posisi elemen (terutama node yang deket tepi container, kayak node OUT) tidak nabrak/overflow. Kalau environment TIDAK mendukung ini, WAJIB sebutkan eksplisit di `memory.md`: "tidak bisa verifikasi visual langsung, cuma verifikasi lewat kode" — jangan diam-diam skip tanpa bilang.
5. **Build check:** jalankan build project, pastikan 0 error sebelum commit.
6. **`memory.md` accuracy check:** re-read entri yang baru kamu tulis — apakah menggambarkan APA ADANYA (termasuk kalau ada bagian yang tidak sempurna/tidak bisa diverifikasi)? Jangan ditulis lebih beres dari kenyataan.

## 3. AUTOCORRECT: KALAU NEMU DIRI SENDIRI MELENCENG

Kalau di tengah/akhir kerja kamu sadar hasil kerjamu (atau kerja sebelumnya) menyimpang dari `instruction.md`/`design.md` (pola salah, scope kelebihan, dll):
1. JANGAN diamkan atau lanjut seolah tidak terjadi apa-apa.
2. Perbaiki sendiri sampai sesuai aturan (looping: cek ulang -> masih salah? -> perbaiki lagi -> cek ulang lagi, sampai benar-benar sesuai).
3. CATAT PROSES INI secara transparan di `memory.md` — bagian apa yang tadinya salah, apa yang diperbaiki. Ini BUKAN aib, ini bagian dari proses — user perlu tau riwayatnya.

## 4. RETRY OTOMATIS UNTUK KEGAGALAN TEKNIS

Kalau ada operasi teknis gagal (commit gagal, push gagal, build gagal, dst):
1. Coba ulang otomatis, MAKSIMAL 10 KALI, tanpa perlu tanya user tiap percobaan.
2. Kalau di percobaan manapun BERHASIL — lanjut seperti biasa, tidak perlu lapor detail semua percobaan yang gagal, cukup sebutkan singkat "sempat retry N kali karena [alasan]" kalau relevan.
3. Kalau SAMPAI 10 KALI TETAP GAGAL — STOP. Jangan coba lagi. WAJIB jelaskan ke user dengan bahasa yang mudah dipahami (bukan jargon teknis mentah): apa yang terjadi, kemungkinan penyebabnya, dan saran tindakan apa yang bisa user lakukan. Tunggu respons user sebelum lanjut apapun.

## 5. VERIFIKASI MANDIRI DI AKHIR SETIAP TASK

Setelah checklist Bagian 2 selesai dan task benar-benar mau ditutup, tulis di `memory.md` ringkasan verifikasi mandiri: sudah sesuai SOP/`instruction.md`? Sudah sesuai `design.md`? Task yang diminta benar-benar tuntas (bukan sebagian)? Kalau ada keraguan di poin manapun, SEBUTKAN eksplisit — jangan asumsikan "pasti udah bener".

## 6. STOP-POINT ROADMAP (WAJIB BERHENTI & TANYA USER DI SINI, WALAU AUTO-YES AKTIF)

> **CATATAN INSIDEN NYATA (jangan diulang):** pada [tanggal kerja otonom pertama], kamu (atau instance Qwen sebelumnya) melewati bagian ini — langsung eksekusi Card 06 (Half Adder, 2-output) TANPA berhenti minta approval, LALU lanjut bikin Card 08 (Full Adder) dengan gaya card yang SAMA SEKALI BEDA dari pola established, DAN bikin Card 09 "4-bit Ripple Carry Adder" yang **TIDAK ADA DI ROADMAP SAMA SEKALI**. Card 08 & 09 akhirnya harus DIHAPUS TOTAL karena kesalahannya fundamental, bukan cuma dipoles. Ini contoh nyata kenapa Bagian 6 ini HARUS ditaati persis, bukan formalitas.

**WAJIB: sebelum mulai card/rangkaian APAPUN, cek dulu 2 hal ini secara eksplisit (tulis hasil pengecekannya di `memory.md` SEBELUM mulai coding):**
1. Apakah item ini ADA persis di `ROADMAP_RANGKAIAN.txt` dengan nomor/nama yang sama? Kalau TIDAK ADA (kamu "berinisiatif" bikin sesuatu yang kedengarannya masuk akal tapi tidak tercatat di roadmap) — STOP, JANGAN dikerjakan, tanya user dulu. TIDAK ADA PENGECUALIAN untuk poin ini, walau auto-yes aktif.
2. Apakah item ini masuk salah satu kategori STOP-POINT di bawah? Kalau ya, berhenti dan ajukan proposal dulu sebelum eksekusi.

Sesuai catatan teknis di `ROADMAP_RANGKAIAN.txt`, beberapa item BUKAN sekadar "card baru dengan pola sama" — butuh keputusan desain baru dulu. JANGAN dikerjakan otonom sampai user (atau Claude) secara eksplisit menyetujui pendekatan desainnya:

- **A6 "Half Adder"** dan seterusnya yang butuh 2 OUTPUT — **SUDAH DISETUJUI & didokumentasikan di `design.md` Bagian 3.3** (per revisi hari ini). Untuk card 2-output BERIKUTNYA (misal A8 Full Adder — 3 input, tetap 2 output, boleh ikuti pola 3.3 yang sama), masih tetap WAJIB reuse pola card-wrapper standar (nomor+dot+judul+badge tier) — JANGAN bikin gaya card baru lagi seperti insiden Card 08.
- **C2 "SR Latch"**, **C3 "D Flip-Flop"** — rangkaian SEKUENSIAL (feedback loop, punya "ingatan"/state). Truth table dinamis sekarang diasumsikan kombinasional. Berhenti dulu, ajukan proposal cara tampilan sebelum eksekusi.
- **C4 "Rising Edge Detector"** — JANGAN dikerjakan sama sekali sampai ada keputusan teknis eksplisit soal cara menampilkan konsep delay/pulse (dicatat di roadmap sebagai "butuh riset dulu").
- **Bab B (Mux/Demux)** — kalau mengerjakan bab ini, WAJIB patuh urutan ukuran (2:1 sebelum 4:1 sebelum 8:1 sebelum 16:1) dan Mux/Demux ukuran sama HARUS berdampingan. Kalau ada dorongan untuk "loncat" duluan ke ukuran lebih besar karena dirasa lebih menarik, JANGAN — ikuti urutan.
- **Perubahan apapun ke `design.md`** yang sifatnya PERMANEN (nambah tier baru, ubah warna tema gate, ubah prinsip neon-glow, dst) — walau auto-yes aktif untuk eksekusi biasa, perubahan desain permanen tetap butuh dikonfirmasi dulu (boleh ke user langsung, tidak harus nunggu Claude, tapi TETAP harus ada konfirmasi eksplisit sebelum jalan, bukan otomatis).
- **JANGAN PERNAH membuat rangkaian/card/fitur yang tidak tercatat di `ROADMAP_RANGKAIAN.txt`**, walau secara teknis kamu mampu dan "kelihatan seperti kelanjutan wajar" (persis seperti kasus Card 09 4-bit Ripple Carry Adder yang tidak diminta siapapun). Kalau merasa ada ide bagus di luar roadmap, TULISKAN sebagai usulan di `memory.md`, JANGAN dieksekusi sampai disetujui.

Di luar titik-titik ini (card MUDAH/NORMAL yang pola-nya sudah jelas, reuse dari card sebelumnya, DAN tercatat persis di roadmap, seperti A4/A5/A7), silakan jalan otonom penuh sesuai roadmap tanpa perlu berhenti.

## 7. TANDA "KEPUTUSAN OTONOM" DI MEMORY.MD

Kalau dalam mengerjakan task kamu harus membuat keputusan kecil yang TIDAK eksplisit disebutkan di prompt kerja/roadmap (misal: pemilihan warna spesifik yang tidak disebutkan, posisi elemen yang tidak dirinci), boleh diputuskan sendiri sesuai penilaian terbaikmu — TAPI tandai entri itu di `memory.md` dengan label **"[KEPUTUSAN OTONOM]"** di depan kalimatnya. Ini memudahkan user atau Claude nanti kalau mau spot-check bagian mana saja yang hasil judgment call kamu sendiri, bukan instruksi eksplisit.
