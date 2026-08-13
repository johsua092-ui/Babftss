# Project Map — BABFT Learning

> Dokumen ini dibuat berdasarkan riwayat kerja & verifikasi langsung terhadap kode proyek (bukan template generik) — mencerminkan struktur ASLI proyek: **Vite + React**, BUKAN Next.js.

## 1. Ringkasan Arsitektur

**BABFT Learning** (Build A Boat For Treasure Learning) — platform edukasi web tentang Logic Gates, Gears, dan Linkages, bertema game Roblox "Build A Boat For Treasure". Dibangun dengan **React 19.1.0 + Vite 5.x**, styling **Tailwind CSS v4**, animasi **framer-motion**, ikon **lucide-react**, notifikasi **sonner**. Routing pakai `useState` sederhana (BUKAN React Router). Deploy ke **Vercel**. Backend: **Firebase Auth** (login) + **Supabase Postgres** (database) via Vercel serverless functions, dikerjakan terpisah oleh backend developer.

## 2. Struktur Direktori (aktual, terverifikasi)

```
Babftss-main/
├── index.html
├── package.json / package-lock.json
├── vite.config.js              # zona bersama (frontend+backend)
├── vercel.json                 # zona bersama (frontend+backend)
├── instruction.md / design.md / memory.md   # dokumentasi permanen proyek
├── RULES_KESELAMATAN_GIT.md    # aturan mutlak git
├── ROADMAP_RANGKAIAN.txt       # rencana card ke depan
├── .env.example
├── src/
│   ├── App.jsx                 # routing utama (state-based)
│   ├── main.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx     # TERLARANG disentuh frontend AI (auth aktif)
│   │   └── FavoritesContext.jsx
│   ├── context/
│   │   └── CardNavigationContext.jsx   # fitur "click me" / IC Block
│   ├── firebase/config.js      # TERLARANG disentuh
│   ├── hooks/useProgressSync.js        # TERLARANG disentuh
│   ├── pages/
│   │   ├── LogicGatesCircuit.jsx       # halaman utama Circuit + ALL_CARDS registry
│   │   ├── GearsPage.jsx
│   │   ├── LinkagesPage.jsx
│   │   └── (welcome/menu/basic-logic-gates dst di App.jsx atau folder ini)
│   ├── components/
│   │   ├── GateCard.jsx / GateDiagram.jsx      # 7 Basic Logic Gates (baseline, jangan diubah)
│   │   ├── CircuitCard00.jsx s/d CircuitCard16.jsx (dan varian nama lain seperti
│   │   │   CircuitCard_FullAdder4bit.jsx, CircuitCard_SRLatch.jsx) — tiap card Circuit
│   │   ├── CircuitDiagram00.jsx s/d CircuitDiagram16.jsx (+ varian) — diagram SVG tiap card
│   │   ├── ICBlockRef.jsx      # komponen reusable "IC Block" (klik → navigasi+glow ke card lain)
│   │   ├── HeartButton.jsx     # fitur favorit, wajib ada di semua Circuit Card
│   │   ├── LoginModal.jsx / LoginPage.jsx / UserPill.jsx   # TERLARANG disentuh
│   │   ├── AIHelperButton.jsx / AIHelperPanel.jsx
│   │   ├── GearIcon.jsx / LinkageIcon.jsx
│   │   └── HowItWorks.jsx
│   └── utils/colorHelper.js
├── api/                         # Vercel serverless functions, TERLARANG disentuh frontend
│   ├── ai-chat.js
│   ├── favorites.js / my-favorites.js / migrate.js
│   ├── save-progress.js / get-progress.js / reset-progress.js
│   ├── leaderboard.js / profile.js
│   └── quiz/history.js, quiz/submit.js
├── lib/                         # TERLARANG disentuh frontend
│   ├── api-helpers.js / ai-client.js
│   ├── favorites-catalog.js / favorites-migration.sql / supabase-rls-migration.sql
├── scripts/                     # tools verifikasi internal (non-produksi)
│   ├── check_wire_overlap.py (generik, hasil rename dari check_card15_overlap.py)
│   └── analysis/ (arsip file kerja lama)
├── server/, Dockerfile, docker-compose.yml, bootstrap.sh, start.sh/.cjs
│                                 # infrastruktur backend terpisah (hosting API di luar Vercel,
│                                 # via Pterodactyl/Docker) — ranah backend developer
├── public/ , assets/            # aset statis
└── .gitignore
```

## 3. Peta Halaman (routing via `useState`, bukan React Router)

| "Route" (state value) | Deskripsi |
| --- | --- |
| `welcome` | Halaman pembuka |
| `menu` | Menu utama, pilih modul (Logic Gates / Gears / Linkages) |
| `logic-gates` | Sub-menu Logic Gates |
| `basic-logic-gates` | Halaman "7 Basic Logic Gates" (baseline, referensi baku) |
| `logic-gates-circuit` | Halaman utama Circuit Card (Card 0 s/d Card 15+, terus bertambah) |
| `gears` | Halaman Gears (36 jenis) |
| `linkages` | Halaman Linkages Mechanic (45 jenis) |

## 4. Sistem Circuit Card (inti proyek, di `LogicGatesCircuit.jsx`)

- Array `ALL_CARDS`: tiap entri `{ num, name, tier, el }` — `num` (label tampilan) **independen** dari `el` (nama file komponen React sebenarnya, karena histori penomoran ulang beberapa kali).
- Search bar + filter tier (EASY/NORMAL/HARD/INSANE/COMPLEX/TUTORIAL).
- `CardNavigationProvider` membungkus seluruh list — state `highlightedCard` + fungsi `navigateToCard` (scroll + glow ke card lain, dipicu `ICBlockRef`).
- Tiap card individual: state lokal (`useState` per toggle input), diagram SVG custom, tabel kebenaran (format penuh 2^n baris ATAU format ringkas untuk Mux/Demux/sekuensial), `HeartButton`, badge tier.
- Card sekuensial (SR Latch dst): pakai `useState`+`useEffect` untuk "ingatan" (state tidak murni fungsi dari input saat ini) — beda dari card kombinasional biasa.

## 5. Data Flow & State

- **Client state:** `useState` lokal per card (toggle input), `useContext` untuk lintas-komponen (Auth, Favorites, CardNavigation).
- **Server state:** Firebase Auth (login), Supabase Postgres (progress, favorites, quiz, leaderboard) diakses via `api/` (Vercel serverless).
- **Backend terpisah:** ada juga server Express (folder `server/`, Docker/Pterodactyl) — dipakai untuk kebutuhan di luar Vercel (kemungkinan proses long-running/bot), dikelola backend developer.

## 6. API Endpoints (Vercel serverless, `api/`)

| Method | Path (perkiraan) | Deskripsi |
| --- | --- | --- |
| POST | `/api/ai-chat` | AI Helper chat widget |
| POST | `/api/favorites`, `/api/my-favorites` | Fitur Favorites |
| POST | `/api/migrate` | Migrasi database (⚠️ pernah ditemukan tanpa auth check — lihat `memory.md`) |
| POST/GET | `/api/save-progress`, `/api/get-progress`, `/api/reset-progress` | Progress belajar user |
| GET | `/api/leaderboard` | Papan peringkat |
| GET/POST | `/api/profile` | Profil user |
| GET/POST | `/api/quiz/history`, `/api/quiz/submit` | Fitur Quiz |

## 7. Model Data (Supabase, perkiraan dari nama file/tabel yang teramati)

- `favorites` (user_id/firebase_uid, item_id, item_type)
- Tabel progress, quiz history, leaderboard (skema detail dikelola backend developer — di luar lane frontend)

## 8. Integrasi & Deployment

- **Deploy utama:** Vercel, domain `babft-project.vercel.app` + `abftlearning.dpdns.org`.
- **Auth:** Firebase.
- **Database:** Supabase Postgres.
- **Backend tambahan:** server Express terpisah via Docker, di-host di Pterodactyl panel (di luar Vercel) — untuk kebutuhan yang tidak cocok model serverless Vercel.
- **Env:** `.env.example` sebagai referensi, `.env` asli WAJIB tidak pernah ter-commit (`.gitignore` sudah mencakup).

## 9. Checklist Status Implementasi (per histori `memory.md`, ringkas)

1. ✅ 7 Basic Logic Gates — selesai, baseline.
2. ✅ Card 0 Simbol Boolean (tutorial) — selesai.
3. ✅ Bab A: Card 1-9 (NOT-AND s/d Full Adder 1-bit) — selesai.
4. ✅ Card 10 Full Adder 4-bit + sistem IC Block — selesai.
5. ✅ Bab B: 2:1 & 4:1 Mux/Demux — selesai (versi 8:1/16:1 SUDAH DIHAPUS PERMANEN, keputusan pedagogis).
6. 🔄 Card 15 SR Latch — selesai, 1 bug ditemukan & diperbaiki (badge mode).
7. ⏳ Rencana besar berikutnya: keluarga Flip-Flop, Rising Edge Detector, Debouncer, ALU, Register, Encoder, Decoder (masing-masing bertahap 1-bit s/d 16-bit).
8. ✅ Fitur pendukung: AI Helper widget, Favorites, sistem pencarian/filter card, Regulasi Warna Kabel, sistem navigasi "click me".

---

## 29. FONDASI PENTING: SISTEM CLOCK MODE (MANUAL / AUTO)

**Berlaku untuk SEMUA card yang punya tombol CLK — sekarang (Card 16 Gated D Latch, Card 17 SR Flip-Flop) dan masa depan (D Flip-Flop, JK, T, Counter, Register, Shift Register, Memory Unit, dll).**

Setiap tombol CLK WAJIB punya switch UI "MANUAL" / "AUTO" yang dirender **tepat di bawah tombol CLK** di dalam SVG diagram. Spec lengkap:

- **`design.md` Bagian 29** — Spec design & visual (posisi, style slider, behavior, aturan ketat lock mode, rate-limit, checklist).
- **`memory.md` Bagian 29** — Catatan implementasi (file baru, file yang diubah, verifikasi).
- **`instruction.md` Bagian 29** — Aturan mutlak & DILARANG list untuk AI/future developer.

**Status implementasi:**
- ✅ Card 16 Gated D Latch — implemented.
- ✅ Card 17 SR Flip-Flop — implemented (dengan reorder input S/R/CLK supaya CLK di bawah).
- ⏳ Card clock masa depan — WAJIB pakai `useClockMode` hook + `ClockModeSwitch` + `ClockToast`, jalankan checklist `design.md` §29.9.

**Inti aturan (untuk pengingat cepat):**
- MANUAL: klik CLK → toggle 1/0.
- AUTO: klik CLK 1x → pulsasi 1→0→1→0 (600ms/state). Klik lagi → STOP & reset ke 0.
- Saat AUTO aktif, switch mode DIBLOK → toast amber "matikan clock dahulu sebelum beralih mode clock" + rate-limit 5 detik.
- Selama rate-limit, semua upaya switch ditolak → toast merah "warning! pencegahan rate limit mohon tunggu 5 detik".
