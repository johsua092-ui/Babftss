# INSTRUCTION.md — ATURAN & STANDAR PROYEK BABFT LEARNING

> Dokumen ini berisi ATURAN TETAP proyek (tech stack, konvensi, larangan mutlak). Isinya jarang berubah — beda dari `memory.md` yang isinya log/histori yang terus di-update, dan `design.md` yang isinya spesifikasi tampilan.
>
> **AI manapun yang bekerja di proyek ini WAJIB baca `instruction.md` INI dulu, baru `design.md` (kalau kerjaannya nyentuh tampilan), baru `memory.md` (buat tau histori & status terkini).**
>
> **KALAU KAMU (AI) PUNYA AKSES COMMIT/PUSH KE GIT REPO INI — WAJIB baca `RULES_KESELAMATAN_GIT.md` JUGA, SEBELUM menjalankan git command apapun.** Ini bukan opsional. Dokumen itu lahir dari insiden nyata (force push dari folder salah yang nyaris menghilangkan seluruh proyek) — aturan di situ MUTLAK, tidak bisa di-override instruksi lain manapun.

---

## 1. SISTEM TIGA FILE (WAJIB DIIKUTI)

Proyek ini punya 3 dokumen permanen + 1 dokumen sementara per task + 1 dokumen keselamatan git (khusus AI dengan akses commit/push):

- **`instruction.md`** (file ini) — aturan tetap: tech stack, konvensi, larangan mutlak. Jarang berubah.
- **`design.md`** — spesifikasi desain/tampilan (warna, bentuk, layout, sistem tier). Berubah kalau ada keputusan desain baru.
- **`memory.md`** — log historis & status proyek (apa yang sudah terjadi, keputusan apa yang diambil, progress tiap fitur). WAJIB di-update tiap ada aktivitas baru.
- **`RULES_KESELAMATAN_GIT.md`** — aturan mutlak seputar git (force push dilarang, verifikasi direktori sebelum push, dst). WAJIB dibaca oleh AI manapun yang bisa commit/push.
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
8. **DILARANG KERAS: kabel/wire di diagram sirkuit saling menimpa (overlap) di jalur yang sama arah.** Setiap kabel WAJIB punya jalur sendiri yang bisa dibedakan secara visual — tidak boleh ada 2+ kabel yang berbagi segmen horizontal/vertikal yang identik (overlap total), karena ini membuat kabel tidak terlihat & membingungkan pemula. Cross/perpendicular silangan antar kabel itu boleh (normal di diagram rangkaian), tapi overlap di jalur yang sama arah DILARANG. **Solusi kalau ruang kurang:** besarkan rangkaian ke arah VERTIKAL (ke bawah). Arah samping (horizontal) ada batasnya karena lebar layar, tapi arah bawah itu UNLIMITED — SVG viewBox bisa diperbesar sesuka hati. Contoh referensi: Card 11 (4:1 Mux) — kabel D0-D3 awalnya overlap dengan kabel S-branch di jalur horizontal yang sama, diperbaiki dengan meroute kabel D di lane X terpisah (x=160) yang berada di KIRI semua bus seleksi (x=185+), sehingga setiap kabel punya jalur horizontal sendiri-sendiri tanpa menimpa kabel lain.
9. **Sistem Glow Navigasi Card (Aurora Green) — ATURAN MUTLAK ABSOLUT.** Setiap fitur navigasi card ("click me" / scroll ke card tujuan) di SELURUH proyek WAJIB menggunakan spesifikasi glow yang tercatat di `design.md` Bagian 4. Tidak boleh ada glow navigasi card dengan warna, kecepatan, transisi, atau style yang berbeda. Lihat `design.md` Bagian 4 untuk spesifikasi CSS lengkap yang harus di-copy-paste persis.
10. **Sistem Navigasi "Click Me": Clear Filter Sebelum Navigasi — ATURAN MUTLAK ABSOLUT.** Setiap kali user mengklik "click me" atau mekanisme navigasi card serupa, sistem WAJIB: (1) clear SEMUA filter aktif (search, card number, difficulty, dll) di halaman tersebut, (2) tunggu render selesai, (3) scroll ke card tujuan, (4) terapkan glow aurora green. Navigasi TANPA clear filter DILARANG — card tujuan mungkin tidak muncul karena difilter. Implementasi WAJIB mengikuti pola `registerClearFilters` yang tercatat di `design.md` Bagian 5. Berlaku ke SELURUH fitur navigasi card di seluruh proyek, bukan cuma halaman Logic Gates Circuit.
11. **Render ikon item (`public/blocks/icon/`) — ATURAN MUTLAK.** Latar WAJIB transparan, dan warna WAJIB diukur/dicocokkan ke ikon existing (luminance + saturasi), BUKAN dikarang. Pernah ditolak user 2× (latar putih, lalu "putih pudar"). Spesifikasi lengkap + angka acuan + checklist: **§30**.
12. **Tab browser saat verifikasi — ATURAN MUTLAK.** Buka `localhost:5173` di tab baru → TUTUP DULU tab lama. Tab bantu wajib ditutup sendiri. Tab harian user (Roblox) tidak boleh disentuh. Pernah menumpuk 6 tab. SOP lengkap: **§31**.

---

## 9. CATATAN KEAMANAN

- JANGAN PERNAH taruh Supabase service role key atau Firebase Admin SDK credentials di kode frontend/client-side — hanya di environment variable server-side.
- JANGAN PERNAH share/tempel API key, token, atau credential apapun secara terbuka di chat/dokumen manapun. Kalau pernah ter-expose tidak sengaja, WAJIB langsung di-revoke & generate ulang.
- Setiap kali ada laporan pekerjaan yang melibatkan backend/auth/database, WAJIB verifikasi eksplisit: apakah ada file `.env.example`, apakah ada secret yang ter-hardcode di source code. Jangan asumsikan aman tanpa dicek.

---

## 29. ATURAN MUTLAK: SISTEM CLOCK MODE (MANUAL / AUTO) — BERLAKU KE SEMUA CLOCK

**Ini adalah fondasi penting. Setiap card yang punya tombol CLK WAJIB menerapkan sistem Clock Mode MANUAL/AUTO. Tidak ada pengecualian, untuk card sekarang (16, 17) maupun masa depan (D Flip-Flop, JK, T, Counter, Register, Shift Register, Memory Unit, dll).**

### Spec lengkap
Lihat **`design.md` Bagian 29** untuk spec design & visual lengkap, dan **`memory.md` Bagian 29** untuk catatan implementasi.

### Ringkasan aturan (WAJIB dipatuhi)

1. **Switch UI MANUAL/AUTO WAJIB dirender tepat di bawah tombol CLK** di dalam SVG diagram. Bukan di samping, bukan di luar SVG.
2. Jika di bawah tombol CLK ada input lain (mis. R), input lain itu **HARUS digeser** supaya CLK di posisi paling bawah, lalu switch di bawahnya.
3. **Mode MANUAL:** klik CLK → toggle 1/0 manual.
4. **Mode AUTO:** klik CLK 1x → pulsasi 1→0→1→0… secara continue (interval 600ms). Klik CLK lagi → STOP & reset ke 0 (bukan lanjut pulsasi).
5. **Aturan ketat:** saat AUTO aktif (autoActive=true), user TIDAK boleh switch mode. Jika memaksa → toast amber top-center "matikan clock dahulu sebelum beralih mode clock" + mulai rate-limit 5 detik.
6. **Rate-limit:** selama 5 detik setelah block, semua upaya switch mode ditolak paksa → toast merah top-center "warning! pencegahan rate limit mohon tunggu 5 detik".

### Implementasi WAJIB pakai 3 file reusable (JANGAN duplikasi logic)

- `src/hooks/useClockMode.js` — hook untuk state & logic.
- `src/components/ClockModeSwitch.jsx` — SVG group switch.
- `src/components/ClockToast.jsx` — toast notifikasi.

### Checklist untuk card clock baru

Lihat **`design.md` §29.9** untuk checklist lengkap (12 item, termasuk verifikasi visual).

### DILARANG
- Membuat card clock tanpa switch MANUAL/AUTO.
- Menempatkan switch di posisi selain bawah tombol CLK.
- Mengubah pesan toast (harus persis: "matikan clock dahulu sebelum beralih mode clock" dan "warning! pencegahan rate limit mohon tunggu 5 detik").
- Mengubah interval auto (600ms) atau rate-limit (5 detik) tanpa persetujuan user eksplisit.
- Menduplikasi logic clock mode di card manapun — semua harus lewat `useClockMode` hook.

---

## 30. ATURAN MUTLAK: RENDER IKON ITEM (`public/blocks/icon/`) — JEBAKAN WARISAN

**Lahir dari insiden nyata (2026-09).** 13 ikon NSI Level 2 (helm, 5 chest, 3 treasure, pine_tree, 3 trophy) dibuat ulang dengan geometri baru. Dua kali ditolak user:
1. **Latar PUTIH opaque** → user: "backgroundnya putih saya tidak bisa terima, lihat temen-temen yang lainnya itu backgroundnya apa?" — semua ikon lain transparan.
2. **"Putih pudar"** → warna jauh lebih terang & pucat dari ikon lain, walau sudah transparan.

Keduanya terjadi karena AI **mengarang setelan render sendiri tanpa mengukur ikon yang sudah ada**. Aturan di bawah WAJIB dipatuhi untuk SETIAP ikon baru yang dibuat/diganti.

### 30.1 WAJIB: UKUR DULU, JANGAN ASAL TEBAK
Sebelum membuat ikon apapun, WAJIB ukur ikon yang SUDAH ADA di `public/blocks/icon/` sebagai acuan:
- **Alpha sudut** (piksel `[0,0]`) — bukti latar transparan.
- **Luminance rata-rata** (`0.2126R + 0.7152G + 0.0722B`, hanya piksel alpha ≥200).
- **Saturasi rata-rata** (HSV `(max-min)/max`, hanya piksel alpha ≥200).

Angka acuan yang terukur dari ikon lama (jangan dilupakan):
| Ikon | Lum | Sat |
|---|---|---|
| wood_block | 0.590 | 0.820 |
| helm | 0.512 | 0.787 |
| pine_tree | 0.220 | 0.498 |
| trophy_1st | 0.541 | 0.456 |
| trophy_3rd | 0.357 | 0.587 |

### 30.2 LATAR WAJIB TRANSPARAN
- `renderer.setClearColor(0x000000, 0)` + `alpha:true`. Piksel sudut WAJIB `[0,0,0,0]`.
- **DILARANG** latar putih/opaque, `scene.background = new THREE.Color(0xffffff)`, atau fill putih di canvas 2D.
- Verifikasi: baca `getImageData(0,0,1,1)` → harus `alpha === 0`.

### 30.3 SETELAN RENDER YANG BENAR (terkalibrasi — jangan diubah tanpa mengukur ulang)
```js
renderer.toneMapping = THREE.NoToneMapping;   // ACES MENUCI warna → pudar
scene.environment = null;                     // RoomEnvironment MENUCI saturasi
// lampu (K = 2.7):
AmbientLight(0xffffff, K*0.55)
DirectionalLight(0xffffff, K).position.set(5,10,7.5)
HemisphereLight(0x4a6fa5, 0x1a1a2e, K*0.25)
```
**Bukti terukur kenapa begini (jangan diulang):**
| Setelan | Lum | Sat |
|---|---|---|
| ACES + RoomEnvironment + lampu 3× app (v3 SALAH) | 0.705 | 0.344 |
| ACES + env, lampu app | 0.794 | 0.496 |
| NoToneMapping + env | 0.792 | 0.668 |
| NoToneMapping, tanpa env, K=2.7 | **0.600** | **0.764** |

Kesimpulan: **`scene.environment` (RoomEnvironment) adalah biang keladi utama pemudaran** — mematikannya menaikkan saturasi 0.668 → 0.858. `ACESFilmicToneMapping` menyumbang pemudaran berikutnya. `mat.envMapIntensity` TIDAK berpengaruh karena `blockMaterials.js` memasang `mat.envMap` sendiri, bukan lewat `scene.environment`.

### 30.4 SATU SETELAN GLOBAL TIDAK CUKUP — COCOKKAN PER ITEM
Tiap material bereaksi beda (gold metalness 0.7, kayu, dedaunan). Dengan setelan global yang sama, terukur:
| Ikon | dL | dS | Status |
|---|---|---|---|
| helm | +0.017 | −0.048 | ✓ |
| trophy_3rd | +0.022 | +0.013 | ✓ |
| pine_tree | +0.187 | −0.150 | ✗ |
| trophy_1st | +0.284 | +0.024 | ✗ |

Karena itu **WAJIB** grade per item: samakan luminance (gain multiplikatif) dan saturasi (skala HSV, hue dipertahankan) terhadap ikon lama item yang sama di `_ikon_backup/`. Toleransi akhir: `|dL| ≤ 0.006`, `|dS| ≤ 0.008`.

### 30.5 URUTAN GRADE (penting — kalau dibalik tidak konvergen)
1. Samakan **luminance** dulu (18 iterasi, damping 0.75).
2. Baru samakan **saturasi** (18 iterasi).
3. Terakhir koreksi **luminance sisa** (karena langkah 2 mengubah luminance).
Menggabung gain+saturasi dalam satu loop → luminance chest/pine_tree macet di bawah target (terbukti: target 0.384 hasil 0.223).

### 30.6 CHECKLIST VERIFIKASI WAJIB SEBELUM LAPOR SELESAI
1. Alpha sudut semua ikon = `[0,0,0,0]`.
2. Lum & sat tiap ikon dalam toleransi §30.4.
3. **Render lembar kontak di atas papan catur magenta/hijau** (BUKAN putih) — bukti tidak ada kotak/fringe putih.
4. **Banding berdampingan LAMA vs BARU** — pastikan tidak ada yang lebih pucat.
5. Cek di panel inventory simulator yang sebenarnya (bukan cuma file PNG).
6. Build sukses + ikon tersalin ke `dist/blocks/icon/`.
7. Backup ikon lama tersimpan di `_ikon_backup/` sebelum ditimpa.

### 30.7 DILARANG
- Membuat ikon tanpa mengukur ikon existing lebih dulu.
- Latar putih/opaque pada ikon item.
- Mengklaim "sudah sama dengan yang lain" hanya berdasarkan alpha, tanpa mengukur luminance & saturasi.
- Menganggap "transparan" = "sudah benar" — warna bisa masih salah.
- Menyatakan selesai tanpa checklist §30.6.

---

## 31. ATURAN MUTLAK: TAB BROWSER SAAT VERIFIKASI

**Lahir dari insiden nyata.** Saat verifikasi berulang, AI membuka `http://localhost:5173/` di tab baru SETIAP kali dan tidak menutup yang lama → menumpuk 6 tab, membebani mesin user.

### SOP yang BENAR
1. Sebelum buka `http://localhost:5173/` di tab baru → **TUTUP DULU tab `localhost:5173` yang lama**.
2. Tab bantu/verifikasi **WAJIB ditutup sendiri** setelah selesai.
3. Sebelum melapor selesai → cek `http://127.0.0.1:9333/json/list` dan pastikan **hanya 1 tab simulator** yang tersisa.
4. **Tab Roblox / tab harian user TIDAK BOLEH disentuh** — jangan tutup, jangan navigasi.
5. DILARANG `taskkill` berdasarkan nama image (mis. semua `chrome.exe`) — bisa membunuh browser harian user.

### Verifikasi
```js
// sebelum lapor: harus 2 (1 simulator + 1 tab user)
http.get('http://127.0.0.1:9333/json/list', ...)
```
