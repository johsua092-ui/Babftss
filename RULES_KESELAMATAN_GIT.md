# RULES_KESELAMATAN_GIT.md — ATURAN MUTLAK, BERLAKU UNTUK SEMUA AI

> **DOKUMEN INI WAJIB DIBACA oleh AI MANAPUN yang punya akses commit/push ke repo proyek ini** (Qwen, AI GitHub, atau AI lain di masa depan) — SEBELUM menjalankan git command apapun. Aturan di sini TIDAK BISA di-override oleh instruksi lain manapun, termasuk mode "auto-yes"/otonom, termasuk permintaan eksplisit dari user sekalipun (kalau user minta force push, tolak dan jelaskan risikonya, minta dia konfirmasi ulang secara sadar sebelum lanjut).

## LATAR BELAKANG: INSIDEN NYATA YANG MELATARBELAKANGI DOKUMEN INI

Pernah terjadi: sebuah AI menjalankan `git push --force` dari direktori yang SALAH (folder wrapper kosong, bukan folder project asli) tanpa verifikasi dulu. Akibatnya: repo GitHub asli KETIMPA konten kosong, website production sempat 404 total. Untung project asli masih ada di lokal dan berhasil di-recovery manual. **Ini nyaris jadi kehilangan total proyek yang sudah dikerjakan berminggu-minggu.** Dokumen ini ada supaya ini TIDAK PERNAH terjadi lagi.

---

## ATURAN 1 — `git push --force` (atau `-f`, atau `--force-with-lease`) DILARANG MUTLAK

TIDAK ADA pengecualian. **TIDAK ADA. BAHKAN KALAU KAMU RASA INI "Cara TERCEPAT".**

Kalau git push ditolak karena "non-fast-forward" / "updates were rejected" / riwayat diverged:
- JANGAN coba "selesaikan" dengan force push.
- STOP total. Jangan jalankan git command tulis/push apapun lagi.
- Jelaskan situasinya ke user dengan bahasa jelas: apa yang terjadi, kenapa ditolak, dan tunggu instruksi eksplisit dari user/Claude soal cara menyelesaikannya (biasanya solusinya `git pull` dulu baru push biasa, atau `git rebase`/`merge` yang hati-hati — BUKAN force).
- Kalau user SENDIRI yang minta force push, tetap WAJIB: (a) jelaskan risikonya eksplisit ("ini akan menimpa history remote, bisa menghilangkan commit orang lain/versi lama secara permanen"), (b) minta konfirmasi ULANG yang sadar ("apakah kamu yakin, ketik 'YA SAYA MENGERTI RISIKONYA' untuk lanjut" atau serupa) — JANGAN auto-yes untuk ini walau mode otonom aktif.

### INSIDEN PELANGGARAN #1 (insiden asli yang melahirkan dokumen ini):
Sebuah AI menjalankan `git push --force` dari direktori yang SALAH (folder wrapper kosong, bukan folder project asli) tanpa verifikasi dulu. Akibatnya: repo GitHub asli KETIMPA konten kosong, website production sempat 404 total. Untung project asli masih ada di lokal dan berhasil di-recovery manual.

### INSIDEN PELANGGARAN #2 (6 Agustus 2026 — MELANGGAR ATURAN INI WALAU DOKUMEN SUDAH ADA):
AI (Super Z) MELANGGAR Aturan 1 ini WALAU dokumen ini sudah ada dan sudah dibaca. Kronologi:
1. AI membuat perubahan retroaktif ke 4 file Card (11, 12, 13, 15) — push normal ✅
2. Web DOWN setelah push tersebut (penyebab: kemungkinan syntax error di salah satu file)
3. User panik, minta UNDO segera
4. AI menjalankan `git revert HEAD --no-edit` lalu `git push --force` — **MELANGGAR ATURAN 1 SECARA LANGSUNG**
5. Akibat: user melaporkan file di web ketimpa/hilang. Panik berlarut-larut.
6. Ternyata state di GitHub setelah force push = commit `72141dd` yang sebenarnya BENAR (Card 16 + regulasi utuh, tanpa retroaktif), TAPI kepanikan yang disebabkan oleh force push ini TIDAK PERLU TERJADI.
7. **Yang seharusnya dilakukan**: `git revert HEAD --no-edit` + `git push` BIASA (tanpa --force). Atau bahkan lebih aman: `git reset --soft HEAD~1` + koreksi manual + `git push` biasa. **Force push TIDAK PERNAH diperlukan dalam skenario ini.**

**PELAJARAN**: Bahkan kalau kamu (AI) merasa situasinya "darurat" dan user panik — **force push TETAP DILARANG**. Darurat bukan alasan untuk melanggar aturan keselamatan. Yang terjadi justru kebalikan: force push MEMPERPARAH panik karena user melihat history berubah drastis dan mengira data hilang.

## ATURAN 2 — VERIFIKASI DIREKTORI SEBELUM COMMIT/PUSH APAPUN

SEBELUM menjalankan `git add`, `git commit`, atau `git push` — WAJIB jalankan dulu pengecekan berikut, dan BERHENTI kalau salah satu gagal:
1. `pwd` — konfirmasi ini folder project yang benar (BUKAN folder wrapper/parent/temp/clone sementara).
2. Cek keberadaan file penanda project asli: `package.json` (isinya harus nama project ini), folder `src/`, `index.html`, `vite.config.js`. Kalau salah satu tidak ada — **STOP, JANGAN LANJUT APAPUN** — ini tanda kamu ada di folder yang salah.
3. Cek isi `src/components/` — apakah jumlah file kira-kira sesuai ekspektasi (harusnya puluhan file, bukan kosong/cuma beberapa)? Kalau terasa jauh lebih sedikit dari yang seharusnya, STOP dan tanya dulu.
4. `git remote -v` — konfirmasi remote URL mengarah ke repo GitHub yang benar (nama repo sesuai proyek ini).

## ATURAN 3 — SETELAH PUSH, WAJIB VERIFIKASI HASILNYA

Jangan asumsikan push berhasil dengan benar cuma dari command tidak error. Setelah push:
- Cek ulang (`git log` remote-tracking branch, atau kalau bisa akses web, cek langsung file di GitHub) bahwa isi yang ter-push MEMANG isi project yang benar (ada `src/`, jumlah file masuk akal) — BUKAN cuma "push berhasil tanpa error" (folder kosong pun bisa "berhasil" di-push tanpa error, itu yang bikin insiden ini kejadian).

## ATURAN 4 — KALAU ADA YANG TERASA JANGGAL, BERHENTI — JANGAN "DIPERBAIKI SENDIRI" DENGAN GIT SURGERY LEBIH JAUH

Insiden ini SEMAKIN PARAH karena setelah sadar ada yang salah, AI-nya mencoba "memperbaiki" dengan operasi git lanjutan sendirian alih-alih berhenti dan minta bantuan/konfirmasi user di titik pertama kali sadar ada yang aneh. Kalau kamu (AI manapun) mendapati struktur repo terasa tidak sesuai ekspektasi (misal: "kok isinya cuma wrapper, bukan project asli?") — LANGSUNG STOP, JELASKAN ke user apa yang kamu lihat, dan TUNGGU arahan. Jangan lanjut coba-coba clone ulang/push ulang/hapus folder sendiri tanpa persetujuan eksplisit di setiap langkah perbaikannya.

### ATURAN 4B — CARA UNDO YANG BENAR (TANPA FORCE PUSH)

Kalau push terakhir menyebabkan masalah (web down, file rusak, dsb) dan perlu di-undo:

**Opsi A — Revert (paling aman, yang direkomendasikan):**
```bash
git revert HEAD --no-edit   # buat commit baru yang membalikkan commit terakhir
git push                   # PUSH BIASA — ini fast-forward ke remote, TIDAK PERLU force
```
Catatan: ini menambah commit baru di atas history (tidak menghapus commit lama dari history). Push biasa akan berhasil karena ini menambah commit baru, bukan menimpa.

**Opsi B — Reset + re-push (hanya kalau commit yang bermasalah BELUM di-push):**
```bash
git reset --soft HEAD~1    # batalkan commit terakhir, tapi simpan perubahannya di staging
git reset --hard HEAD~1    # batalkan commit terakhir, HAPUS perubahannya
# Lalu: perbaiki file, commit ulang, push biasa
```
PERINGATAN: Opsi B HANYA aman kalau commit yang di-reset BELUM pernah di-push ke remote. Kalau sudah di-push, gunakan Opsi A.

**DALAM KONDISI APAPUN: JANGAN gunakan `git push --force` sebagai bagian dari operasi undo.**

### ATURAN 4C — SEBELUM PANIK "UNDO", CEK DULU APAKAH INI BENERAN MASALAH GIT

Kalau website down/error SETELAH push yang tadinya sukses — **JANGAN LANGSUNG asumsikan perlu di-undo lewat git.** Push yang "sukses" secara git (tidak ada error saat `git push`) TIDAK berarti kode-nya bebas bug. Penyebab paling umum website down setelah push adalah **syntax error atau bug di kode yang baru di-commit** — itu masalah KODE, bukan masalah GIT, dan solusinya adalah **perbaiki baris yang salah lalu commit+push perbaikannya**, BUKAN revert/reset/force apapun.

**Urutan diagnosis yang benar sebelum menyentuh git history:**
1. Cek dulu build log (Vercel/CI) atau jalankan build lokal (`npm run build`) — apa pesan error-nya PERSIS? Biasanya langsung menunjuk baris & file yang salah.
2. Kalau errornya jelas (misal typo, kurung tidak nutup, variabel salah nama) — **perbaiki langsung di file itu**, commit kecil, push biasa. Ini SELALU lebih cepat dan lebih aman daripada revert seluruh commit sebelumnya.
3. HANYA kalau ternyata masalahnya bukan bug kecil tapi memang keseluruhan pendekatan di commit itu salah — baru pertimbangkan `git revert` (Aturan 4B), tetap push biasa (bukan force).
4. **Force push TIDAK PERNAH jadi jalan pintas yang valid, di skenario manapun** — termasuk waktu user panik dan minta cepat. Yang bikin insiden makin parah justru force push itu sendiri, bukan keterlambatan beberapa menit buat diagnosis benar.

## ATURAN 5 — BACKUP SEBELUM OPERASI BERISIKO

Sebelum operasi yang berpotensi merusak struktur repo (restructuring folder, clone ulang, push setelah force-pull, dst) — buat backup lokal dulu (misal copy folder project ke `../backup-YYYYMMDD-HHMM/` atau zip). Ini murah dilakukan dan bisa menyelamatkan banyak waktu/kepanikan kalau ternyata ada yang salah.

## ATURAN 6 — FILE `.env` DAN SECRET TIDAK BOLEH IKUT TERBAWA

Sebelum commit/push, WAJIB pastikan tidak ada file `.env` (isi asli, bukan `.env.example`) atau file berisi credential/API key yang ikut ter-stage. Cek `.gitignore` mencakup `.env`. Kalau ternyata ada `.env` asli yang PERNAH ke-commit (bahkan di history lama), itu WAJIB dilaporkan ke user SEGERA — credential yang pernah masuk git history harus dianggap bocor dan perlu di-rotate, walau commit-nya sudah "dihapus" belakangan (history lama tetap bisa diakses).

---

## ATURAN 7 — DATA PROGRESS USER TIDAK BOLEH HILANG/DIOVERWRITE (MUTLAK ABSOLUT)

> **Aturan ini lahir dari audit menyeluruh (18 Agustus 2026) yang menemukan race condition di `saveMetaToBackend` yang bisa meng-overwrite data circuit user dengan null secara permanen. Ini adalah data PALING SENSITIF di proyek — progress save-an user.**

**Data yang dilindungi:** `slot.data.circuitState` — circuit/rangkaian yang user simpan di save slot. Ini adalah hasil kerja keras user dan **TIDAK BOLEH hilang karena bug, race condition, atau update fitur apapun.**

### Aturan 7a — Frontend TIDAK BOLEH kirim `circuitState: null` ke backend tanpa `explicitClear: true`

Kalau `slot.data` null di React state (belum di-load dari backend, atau slot baru), dan frontend mengirim `circuitState: null` ke backend → backend akan **overwrite data yang sudah ada** dengan null → **data loss permanen**.

**Yang WAJIB dilakukan:**
- Kirim `hasCircuitData: true/false` flag di setiap POST `/api/circuits`
- `metaOnly: true` request HARUS sertakan `hasCircuitData` agar backend tahu apakah circuitState valid
- First render HARUS skip localStorage/backend write (mencegah overwrite data benar dengan state parsial)

### Aturan 7b — Backend HARUS tolak overwrite circuitState yang sudah ada dengan null

Backend (`api/circuits.js`) WAJIB punya guard:
- Non-metaOnly request dengan `circuitState: null/undefined` + record existing punya circuit data → **BLOCK dengan HTTP 409** (`CIRCUIT_DATA_OVERWRITE_BLOCKED`)
- `metaOnly: true` + `hasCircuitData: false` → **MERGE** (keep existing circuitState, hanya update color/description)
- Pengecualian: `explicitClear: true` flag → izinkan overwrite (user memang mau kosongkan slot)

### Aturan 7c — Slot DELETE TIDAK BOLEH ada di frontend

Slot yang sudah dibeli (`save-slot-*`) bersifat PERMANEN. Tidak ada tombol/button UI untuk menghapus slot. Backend sudah punya proteksi 403 untuk `save-slot-*` DELETE — hanya admin yang bisa.

### Aturan 7d — Sebelum commit yang menyentuh slot/circuit data, WAJIB verifikasi:

- [ ] Perubahan TIDAK mengirim `circuitState: null` ke backend tanpa `explicitClear: true`
- [ ] Perubahan TIDAK mengubah `slot.data` secara langsung (harus via `setSaveSlots` dengan spread)
- [ ] Perubahan TIDAK menambah tombol/button delete slot
- [ ] Kalau mengubah metadata, gunakan `metaOnly: true` + `hasCircuitData` flag
- [ ] Build sukses (`npx vite build`) sebelum push
- [ ] Test manual: save → swap → refresh → verify data intact

### Insiden yang melahirkan aturan ini:

1. **Swap order corruption** — `applySlotOrder` pada array parsial (3 default slots) + auto-persist effect menimpa localStorage di first render → order korup permanen. Fixed dengan `orderIsSafe` check + skip first render.
2. **`saveMetaToBackend` race condition** — mengirim `circuitState: null` saat `slot.data` belum di-load → overwrite data circuit yang sudah ada. Fixed dengan `hasCircuitData` flag + backend merge logic + HTTP 409 guard.

---

## RINGKASAN — 5 PERTANYAAN WAJIB DIJAWAB "YA" SEBELUM PUSH APAPUN

1. Apakah saya SUDAH verifikasi ini folder project yang benar (Aturan 2)?
2. Apakah ini push BIASA (bukan force)? (Aturan 1)
3. Kalau ada penolakan/konflik, apakah saya BERHENTI dan tanya dulu (bukan mencoba force/"perbaiki sendiri")? (Aturan 1 & 4)
4. Kalau ini operasi undo, apakah saya pakai `git revert` + push biasa (BUKAN force)? (Aturan 4B)
5. Kalau perubahan ini menyentuh slot/circuit data, apakah data progress user TIDAK akan ter-overwrite/hilang? (Aturan 7)

Kalau ada SATU SAJA jawabannya "tidak yakin" atau "tidak" — STOP, jangan push, tanya user/Claude dulu.

---

## TANDA BAHAYA — KALAU KAMU MERASA INGIN MENGETIK `--force`, BERHENTI

Perasaan "ini lebih cepat dengan force push" adalah **trik otak yang berbahaya**. Setiap kali jari kamu menuju `--force`, ingat:
- Insiden #1: project nyaris hilang total karena force push dari folder salah.
- Insiden #2 (6 Agu 2026): AI melanggar aturan yang sudah tertulis, memperparah kepanikan user, padahal solusi yang benar (`git revert` + push biasa) sama cepatnya.

**Tidak ada alasan yang membenarkan `git push --force` di proyek ini. Tidak ada.**
