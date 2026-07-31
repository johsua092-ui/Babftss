# INSTRUCTION.md — ATURAN & STANDAR PROYEK BABFT LEARNING

> Dokumen ini berisi ATURAN TETAP proyek (tech stack, konvensi, larangan mutlak). Isinya jarang berubah — beda dari `memory.md` yang isinya log/histori yang terus di-update, dan `design.md` yang isinya spesifikasi tampilan.
>
> **AI manapun yang bekerja di proyek ini WAJIB baca `instruction.md` INI dulu, baru `design.md` (kalau kerjaannya nyentuh tampilan), baru `memory.md` (buat tau histori & status terkini).**

---

## 1. SISTEM TIGA FILE (WAJIB DIIKUTI)

Proyek ini punya 3 dokumen permanen + 1 dokumen sementara per task:

- **`instruction.md`** (file ini) — aturan tetap: tech stack, konvensi, larangan mutlak. Jarang berubah.
- **`design.md`** — spesifikasi desain/tampilan (warna, bentuk, layout, sistem tier). Berubah kalau ada keputusan desain baru.
- **`memory.md`** — log historis & status proyek (apa yang sudah terjadi, keputusan apa yang diambil, progress tiap fitur). WAJIB di-update tiap ada aktivitas baru.
- **Prompt kerja** — instruksi spesifik untuk task yang sedang dikerjakan SAAT ITU. Beda tiap task, tidak diakumulasi.

Setiap kali selesai membahas suatu topik/fitur yang menghasilkan perubahan permanen, WAJIB sediakan file yang relevan (minimal `memory.md`, plus `design.md`/`instruction.md` kalau ada perubahan di situ, plus prompt kerja) sebagai file yang bisa didownload/disimpan user.

---

## 2. TENTANG PROYEK & TECH STACK

- **Nama:** BABFT Learning (Build A Boat For Treasure Learning) — platform edukasi web yang mengajarkan konsep Logic Gates (gerbang logika), bertema visual game Roblox "Build A Boat For Treasure". Juga berisi materi Gears (36 jenis) dan Linkages Mechanic (45 jenis).
- **Hosting:** Vercel (babft-project.vercel.app), juga diakses lewat domain abftlearning.dpdns.org.
- **Tujuan jangka panjang:** dipakai banyak user di seluruh dunia secara berkelanjutan — semua keputusan teknis mempertimbangkan skala & keawetan, bukan solusi cepat sementara.
- **Tech stack:** React 19.1.0 + Vite 5.x + framer-motion (AnimatePresence untuk transisi halaman) + lucide-react (icon) + sonner (toast notification) + Tailwind CSS v4. Routing pakai `useState` sederhana (BUKAN React Router) dengan 7 halaman: `welcome`, `menu`, `logic-gates`, `basic-logic-gates`, `logic-gates-circuit`, `gears`, `linkages`. Font: Orbitron (heading) + Inter (body).
- **Backend:** Firebase Auth (login) + Supabase Postgres (database) + Vercel serverless API routes (folder `api/`). Dikerjakan oleh backend developer terpisah — lihat Bagian 4.

---

## 3. ATURAN MUTLAK: JANGAN UBAH STRUKTUR FONDASI KODE

**Pelanggaran paling fatal jika dilakukan:**

- AI **HANYA BOLEH** mengerjakan scope yang secara eksplisit diminta di prompt kerja saat itu. **DILARANG KERAS** merombak, merefactor, merapikan, atau "membenahi inisiatif sendiri" struktur folder, arsitektur komponen, cara routing, atau kode fitur LAIN yang tidak sedang dibahas — walau AI merasa itu "lebih baik" atau "lebih rapi".
- Kalau AI menemukan bagian kode lain yang menurutnya bermasalah/bisa diperbaiki TAPI di luar scope permintaan saat itu, **JANGAN diubah otomatis** — cukup laporkan/sebutkan ke user sebagai catatan/saran, biarkan user yang putuskan.
- Style/design system yang SUDAH ADA dan sudah terbukti benar (lihat `design.md`) **WAJIB DI-REUSE**, bukan dibuat ulang dari nol atau "diinterpretasi ulang" dengan gaya baru.
- **Root folder repo WAJIB BERSIH** — file kerja/analisis/debug sementara TIDAK BOLEH ditinggal di root, harus di folder terpisah atau dihapus setelah tidak dipakai.
- **Laporan progress WAJIB jujur apa adanya** — kalau ada bagian yang belum dikerjakan/belum diverifikasi, WAJIB dilaporkan sebagai "belum selesai", JANGAN dibuat terdengar lebih beres dari kenyataan.

---

## 4. PEMBAGIAN PERAN TIM (WAJIB DIPATUHI)

Proyek ini dikerjakan 2 orang dengan pembagian tegas:
- **User (pemilik chat/akun ini) = 100% FRONTEND.** Semua kerjaan lewat sesi ini (tampilan, komponen React, halaman, styling, interaksi UI) adalah tanggung jawab & scope user.
- **Teman user = 100% BACKEND** (Firebase Auth, Supabase Database, API route di folder `api/`, dst). User melapor progress ke temannya, tapi TIDAK mengerjakan bagian backend sendiri.
- **AI yang bekerja dengan user WAJIB tetap di lane FRONTEND** — JANGAN inisiatif mengerjakan/mengimplementasikan bagian backend kecuali user EKSPLISIT bilang dia diminta backend-nya oleh temannya untuk task tertentu. Kalau ada task yang menyentuh backend, tanyakan dulu ke user apakah ini memang delegasi dari temannya atau salah scope.

---

## 5. FILE/HALAMAN TERLARANG DISENTUH (MILIK TEMAN/BACKEND)

Backend developer (teman user) sudah membuat halaman Login + integrasi backend sendiri. **AI frontend DILARANG KERAS menyentuh/mengedit file-file berikut** (dan file terkait auth/backend lain yang belum terdaftar di sini — kalau ragu, JANGAN diubah, tanyakan dulu):
- `src/contexts/AuthContext.jsx` — Auth context aktif.
- `src/firebase/config.js` — Firebase config.
- `src/components/LoginModal.jsx` — modal login aktif.
- `src/hooks/useProgressSync.js` — hook auto-save.
- Folder `api/` seluruhnya (`save-progress.js`, `get-progress.js`, `reset-progress.js`, `leaderboard.js`, `profile.js`, `quiz/history.js`, `quiz/submit.js`, dst).
- Folder `lib/` (`api-helpers.js`).
- File orphan/duplikat yang ditemukan (`src/context/AuthContext.jsx` — beda dari `contexts/`, `src/lib/firebase.js`, `src/lib/supabase.js`, `src/components/LoginPage.jsx`, `src/components/UserPill.jsx`) — INI JUGA TERLARANG walau kelihatan tidak terpakai/bisa "dibersihkan". Biarkan backend developer yang membersihkan sendiri.

Kalau AI menemukan file yang kelihatannya terkait login/auth/backend saat eksplorasi kode, JANGAN diubah — laporkan ke user.

**Zona file BERSAMA (bukan murni frontend atau backend, WAJIB koordinasi sebelum diubah dari sisi manapun):** `vite.config.js` (build config) dan `vercel.json` (deployment/CDN config) — kedua file ini bisa disentuh dari sisi frontend (misal buat code-splitting) MAUPUN backend (misal buat security headers, minifikasi). Sebelum mengubah salah satu file ini, AI WAJIB mengingatkan user untuk cross-check dulu dengan tim satunya, supaya perubahan tidak saling menimpa tanpa sepengetahuan.

---

## 6. FITUR BACKEND OPSIONAL YANG SUDAH TERSEDIA (TIDAK WAJIB DIPAKAI)

Backend developer sudah menyiapkan API untuk **Quiz** (`api/quiz/history.js`, `api/quiz/submit.js`) dan **Leaderboard** (`api/leaderboard.js`) sebagai persiapan/jaga-jaga — BUKAN kewajiban untuk langsung dibuatkan UI-nya. Kalau user (lewat sesi frontend) suatu saat mau menambahkan tampilan Quiz atau Leaderboard, API-nya sudah siap dipanggil. Kalau tidak, tidak masalah, tidak mempengaruhi fitur lain.

---

## 7. PREFERENSI FORMAT: ICON, BUKAN EMOJI

- Di **UI aplikasi**: elemen ikon apapun WAJIB pakai komponen icon library yang sudah dipakai project ini (`lucide-react`), BUKAN karakter emoji ditulis langsung di teks/JSX.
- Di **dokumen `memory.md`/`design.md`/prompt kerja**: minimalkan penggunaan emoji sebagai penanda status, pakai teks/tanda biasa.

---

## 8. KONVENSI & PELAJARAN WAJIB DIIKUTI (dari histori masalah proyek)

Aturan berikut lahir dari masalah nyata yang pernah terjadi di proyek ini — WAJIB dipatuhi supaya tidak terulang:

1. **Wire/garis penghubung** di diagram sirkuit apapun WAJIB satu garis solid utuh (atau path siku-siku/right-angle kalau perlu belok) — TIDAK BOLEH dashed/putus-putus atau pecah jadi banyak segmen dengan style beda-beda.
2. **Bentuk gate** yang secara desain harus beda (misal OR-family vs NOT) HARUS benar-benar dibedakan bentuknya, tidak boleh disamakan.
3. **Highlight/status interaktif** (seperti baris truth table aktif) WAJIB dihitung DINAMIS/real-time berdasarkan perbandingan state saat ini — BUKAN pewarnaan statis permanen berdasarkan nilai semata.
4. **JANGAN improvisasi/redesign sepihak** — dilarang menambah elemen dekoratif (label tambahan, background pattern, ornamen, dsb) yang tidak diminta eksplisit di prompt kerja.
5. **File kerja/analisis/debug sementara** WAJIB dibersihkan atau dipindah ke folder terpisah (misal `scripts/analysis/`), TIDAK BOLEH ditinggal di root repo.
6. **Laporan progress WAJIB jujur** — sebutkan eksplisit bagian yang belum selesai/belum diverifikasi, jangan bikin terdengar lebih beres dari kenyataan.
7. Sebelum menyatakan task selesai, WAJIB ada checklist verifikasi manual (bukan cuma asumsi "harusnya udah bener").

---

## 9. CATATAN KEAMANAN

- JANGAN PERNAH taruh Supabase service role key atau Firebase Admin SDK credentials di kode frontend/client-side — hanya di environment variable server-side.
- JANGAN PERNAH share/tempel API key, token, atau credential apapun secara terbuka di chat/dokumen manapun. Kalau pernah ter-expose tidak sengaja, WAJIB langsung di-revoke & generate ulang.
- Setiap kali ada laporan pekerjaan yang melibatkan backend/auth/database, WAJIB verifikasi eksplisit: apakah ada file `.env.example`, apakah ada secret yang ter-hardcode di source code. Jangan asumsikan aman tanpa dicek.
