# KONTRAK PERMANEN — 3D Block Simulator (Babftss)

> **DOKUMEN INI WAJIB DIBACA PENUH, DARI AWAL SAMPAI HABIS, OLEH SETIAP AI PENERUS
> SEBELUM MENYENTUH KODE ATAU MENGERJAKAN TUGAS APA PUN DI PROJECT INI.**
>
> Aturan ini berlaku di SETIAP sesi, untuk model/AI apa pun yang dipakai.
> Tidak boleh dilewati, di-skip, atau hanya dibaca sebagian.
> Dokumen ini adalah satu-satunya sumber kebenaran kontrak. Kalau bertentangan
> dengan sumber lain, KONTRAK INI YANG MENANG.

---

## 0. IDENTITAS PROJECT

```
Project   : Babftss (React + Vite + Three.js 0.185.1)
Folder    : C:\Users\user\Babft Project\Babftss-main
File utama: src/pages/BlockSimulator3D.jsx   (~22.600 baris)
            (sebelumnya BlockSimulator3Dv2.jsx — di-rename commit 40bb7fe,
             2026-09-09; SEMUA referensi lama di dokumen ini = file itu)
Repo      : https://github.com/johsua092-ui/Babftss   branch: main
Dev server: node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5173
Build     : node node_modules/vite/bin/vite.js build
Node      : v24  |  Shell: bash (git-bash/MSYS) di Windows
```

Cara membuka fitur: buka web → menu **Shapes** → **3D Block Simulator v2** →
taruh block → pilih tool **Move** / **Rotate** → klik block.

---

## 1. ATURAN MUTLAK (JANGAN DILANGGAR)

1. **DILARANG force push.** `git push --force` / `-f` / `--force-with-lease`
   dilarang total, tanpa pengecualian, walau user meminta. Baca
   `RULES_KESELAMATAN_GIT.md` di root project.
2. **WAJIB push otomatis** setelah pekerjaan selesai & terverifikasi. Jangan
   menyuruh user push manual.
3. **JANGAN sentuh kode lain yang sudah jalan.** Fokus 100% pada masalah yang
   sedang dikerjakan. Pernah ada AI menimpa pekerjaan user sampai hilang.
   Jangan sentuh, senggol, merusak, atau mengubah kodingan lain yang sudah
   sempurna.
4. **FILE TERLARANG DISENTUH** (milik teman user, backend/auth):
   ```
   src/contexts/AuthContext.jsx
   src/context/AuthContext.jsx
   src/lib/firebase.js
   src/lib/supabase.js
   src/components/LoginPage.jsx
   src/components/UserPill.jsx
   ```
5. **DILARANG pakai dialog browser** (`window.confirm/alert/prompt`). Selalu
   custom modal: dark theme `rgba(14,20,32,0.98)`, `backdropFilter: blur(8px)`,
   font Orbitron (judul) + Inter (body), animasi slide-up. User sangat tidak
   suka UI 'jelek dan kuno'.
6. **Laporan wajib jujur.** Kalau belum diverifikasi, bilang belum. Jangan
   pernah mengarang output/hasil tes.
7. **WAJIB lapor ke Telegram + screenshot bukti** setiap selesai satu tugas
   (cara lengkap di Bagian 7).

### Quirk git repo ini
`core.autocrlf=true` membuat 9 file selalu tampil " M" di `git status` walau
isinya identik (api/ai-chat.js, index.html, lib/ai-client.js, lib/ai-dataset.json,
server/package.json, AIHelperPanel/LoginModal/LoginPage.jsx, ShapesCalculator.jsx).
**Itu BUKAN perubahan nyata.** Cara cek yang benar:
```bash
git add -A && git diff --cached --stat HEAD   # ini yang jujur
```
Lalu `git reset` kalau cuma mau lihat. **Selalu `git add <file spesifik>`**,
jangan `git add -A` saat commit.

---

## 2. APA YANG SUDAH SELESAI (5 commit, sudah di GitHub main)

| Commit | Fase | Isi |
|--------|------|-----|
| `6548fc8` | Phase 49 v9 | Move gizmo jadi **6 panah utuh** (garis + kerucut di ±X ±Y ±Z) |
| `f43f9f2` | Phase 49 v10 | Hapus **garis bantu putih panjang** yang muncul saat hover/drag |
| `0977c3d` | Phase 49 v11 | **Solo drag**: tahan 1 panah → 5 lainnya sembunyi, lepas → muncul lagi |
| `545201f` | Phase 50 | Rotate gizmo jadi **3 cincin penuh + 6 bola**, buang cincin abu-abu & kuning |
| `c9574fb` | Phase 50 v2 | Bola rotate **terkunci** (tidak ikut kamera) + **solo-orbit** saat drag |

### File yang dibuat (JANGAN dihapus/ditimpa)
```
src/utils/gizmoSixArrows.js    — semua logika Move (Phase 49 v9/v10/v11)
src/utils/gizmoRotateRings.js  — semua logika Rotate (Phase 50)
src/utils/gizmoScaleBalls.js   — semua logika Scale 6 bola #EFBF04 (Phase 51,
                                 commit e6045e8) — solo drag + material kebal
                                 setColors; jebakan: scale dipaksa local (5b)
```
Ketiga file punya **komentar header sangat panjang** yang menjelaskan setiap
keputusan teknis + kenapa pendekatan lain gagal. **BACA DULU sebelum mengubah.**
Jangan hapus komentarnya.

### Cara dipakai di BlockSimulator3Dv2.jsx
Import di baris ~28-29:
```javascript
import { makeSixArrows, hideTranslateHelperLines, enableSoloDragArrow } from '../utils/gizmoSixArrows.js';
import { restyleRotateGizmo } from '../utils/gizmoRotateRings.js';
```
Dipanggil sekali saat setup TransformControls (cari komentar `Phase 49 v9`),
dan `dispose()`-nya dipanggil di cleanup unmount **sebelum**
`transformControls.dispose()`.

---

## 3. METODE KERJA — INI RAHASIANYA (WAJIB DITIRU)

Bug di project ini sebelumnya gagal diselesaikan >1 minggu oleh beberapa AI.
Bukan karena tools kurang — yang beda cuma **URUTAN BERPIKIR**. Jangan menulis
satu baris kode pun sebelum tahu angka sebenarnya. **UKUR DULU. JANGAN MENEBAK.**

### ATURAN #1 — JANGAN MENEBAK. UKUR DULU.
Three.js bisa dijalankan di Node **tanpa browser** untuk membaca struktur:
```bash
cd "C:/Users/user/Babft Project/Babftss-main"
node --input-type=module -e "
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
const tc = new TransformControls(new THREE.PerspectiveCamera(), null);
const t = tc._gizmo.gizmo.translate;
for (const c of t.children) {
  c.geometry.computeBoundingBox();
  console.log(c.name, JSON.stringify(c.geometry.boundingBox));
}
"
```
Contoh nyata: user bilang "ada 4 cincin". Diukur ternyata **5**. Kalau percaya
asumsi, perbaikannya salah sasaran.

### ATURAN #2 — BUKTIKAN KENAPA PERCOBAAN LAMA GAGAL
Sebelum mencoba cara baru, buktikan secara numerik kesalahan cara lama.
(v7 salah karena heuristik "sizeY>0.3=shaft" padahal shaft X punya sizeY 0.0130;
v8 salah karena flip 2 sumbu = rotasi 180° thd sumbu itu sendiri → center.x tetap.)
Begitu sebab pastinya ketemu, solusinya jadi jelas dalam sekali coba.

### ATURAN #3 — TES HARUS BISA MERAH DULU (RED-GREEN)
Selalu tulis 2 bagian:
- **RED** — buktikan bug-nya ADA sebelum diperbaiki
- **GREEN** — buktikan sudah benar sesudahnya

**Kalau angka SEBELUM dan SESUDAH sama-sama nol, tesmu rusak — bukan lulus.**

### ATURAN #4 — CURIGAI ALAT UKURMU SENDIRI
Pernah 3x mengalami LULUS PALSU / GAGAL PALSU:
- **Kasus 1 — SwiftShader TIDAK bisa menggambar garis panjang.** Line -1000..999000
  → 0 px di SwiftShader, tapi 417 px di GPU nyata. Uji garis WAJIB di GPU nyata
  (`--use-angle=default`, buang `--disable-gpu`), atau pakai `renderer.info.render.lines`.
- **Kasus 2 — bola tertukar identitas** setelah orbit → sudut terbaca 120° padahal 60°.
  Solusi: lacak objek lewat `uuid`/referensi mesh, JANGAN hasil sort.
- **Kasus 3 — warna objek uji bocor** (kubus biru ikut dihitung). Solusi: objek uji
  pakai abu-abu netral.

**Cara membedakan bug kode vs bug alat ukur:**
Jalankan skenario yang SAMA pada versi BAWAAN (tanpa modifikasi). Kalau bawaan
juga "gagal", berarti alat ukurmu yang salah.

### ATURAN #5 — UBAH SEKECIL MUNGKIN
Bukan "hapus lalu bangun ulang", tapi **cari apa yang kurang, tambahkan hanya itu**.
- Pakai **API publik** dulu (`showXYZE = false`) sebelum menyentuh internal.
- **Share material**, jangan clone — supaya highlight kuning tetap sinkron.
- Semua fungsi **idempoten** (tandai `userData`) + punya **`dispose()`**.
- Bungkus `try/catch` supaya kegagalan tidak menggagalkan init scene.

### ATURAN #6 — JANGAN NAMBAL 2 KALI, CARI AKAR MASALAH
Kalau pendekatan yang sama gagal 2x, **STOP menambal**. Cari akar penyebab dan
ganti pendekatan secara fundamental.

### ATURAN #7 — TAHU KAPAN HARUS BERHENTI & JUJUR
Keterbatasan library (mis. akurasi klik 69%→77%) lebih baik dilaporkan apa
adanya daripada dikejar tanpa henti. Jujur > mengarang hasil.

### ATURAN #8 — VISION WAJIB DIPAKAI (protokol permanen, 2026-09-10)

Tool `vision_analyze` sekarang pakai **Gemini 3 Flash** (config:
`auxiliary.vision.provider=gemini`, `auxiliary.vision.model=gemini-3-flash-preview`,
key `GOOGLE_API_KEY`/`GEMINI_API_KEY` di .env — aktif permanen semua sesi).

**WAJIB — jangan pernah dilupakan/dilewati:**
1. **Sebelum menulis kode** yang bentuknya ditentukan gambar referensi
   (desain UI, mock, screenshot bug, layout): WAJIB baca gambar dengan
   `vision_analyze` DULU — tanya struktur: "ini garis mengambang atau
   menempel kulit? inset? berapa persen ketebalan?" Konfirmasi 2-3x dengan
   pertanyaan berbeda untuk kunci keputusan besar.
2. **Sesudah fix**: screenshot bukti WAJIB dilihat sendiri via
   `vision_analyze` SEBELUM dikirim ke user/Telegram. Tanpa melihat =
   dilarang klaim sukses. (Kasus nyata: vision menangkap screenshot
   halaman error localhost yang tanpa vision akan diklaim sukses palsu.)
3. **Pelajaran Phase 60 v2**: analisis pixel PROGRAMATIK sendirian
   BOLEH SALAH MEMBACA STRUKTUR gambar (pixel membaca warna benar,
   tetapi salah mengartikan "menempel vs mengambang" — hasil 50% benar,
   direvisi 3x sampai user bilang tepat 100%). Pixel-check tetap SAH
   tapi HANYA untuk angka presisi (ketebalan px, rasio bbox, jumlah
   pixel warna) — untuk STRUKTUR/MAKNA selalu pakai vision dulu.

**Protokol limit (urutan, disetujui user 2026-09-10):**
Kuota tier gratis: ~1.500 request/hari per key, ~10 request/menit, dan
token-per-menit/hari (gambar = "berat", ~ratusan-2500 token tergantung
resolusi). Reset harian ~14:00-15:00 WIB (tengah malam Pacific).
Kalau kena 429, urutan solusi:
1. Pindah model flash lain dalam key yang sama (gemini-flash-latest,
   gemini-2.5-flash — kolam kuota TERPISAH per model; terbukti 3.1-pro
   429 → 3-flash langsung jalan). GRATIS & instan.
2. Tunggu reset harian (~14:00-15:00 WIB).
3. User kirim API key akun kedua → pasang di .env (catatan: Google
   ToS melarang multi-akun untuk hindari limit — risiko flag akun,
   keputusan user).
4. Opsi berbayar (limit ribuan kali lebih longgar).
JANGAN pernah kembali ke "menebak gambar tanpa mata".

### ATURAN #9 — WARISAN PENGALAMAN WAJIB (komitmen lintas-generasi AI)

**Setiap AI — masa lalu, masa kini, masa depan — yang bekerja di project
ini WAJIB mewariskan pengalaman.** Ini bukan opsional, bukan "kalau
ingat", bukan inisiatif pribadi — ini KEWAJIBAN yang sama kuatnya
dengan larangan force-push. Alasan: AI tidak punya ingatan antar sesi;
satu-satunya cara ilmu bertahan adalah DITULIS. AI yang bekerja lalu
pergi tanpa menulis warisan = membuang pengalaman mahal yang sudah
dibayar dengan waktu & kegagalan nyata.

**Kewajiban pada AKHIR setiap tugas (setelah verifikasi, sebelum/sambil
lapor Telegram & push):**
1. TANYAKAN DIRI: apa yang aku pelajari dari tugas ini?
   - Jebakan/pitfall baru yang menipu? (FAIL palsu, alat ukur bohong,
     asumsi salah yang terbukti salah lewat angka)
   - Pola bug yang belum tercatat? Teknik yang menang di mana pendekatan
     lain gagal? Perilaku library yang mengejutkan?
   - Kalau TIDAK ADA apapun yang baru → tulis minimal 1 kalimat di laporan
     bahwa "tidak ada temuan baru" (bukti bahwa pertanyaannya diajukan,
     bukan dilupakan).
2. TULIS warisan ke tempat yang benar:
   - Temuan teknis/project → KONTRAK_PERMANEN.md (bab PITFALL/WARISAN
     PENGALAMAN yang relevan, atau bab baru kalau temuan berdiri sendiri)
   - Temuan yang berlaku umum lintas-project → skill Synapse terkait
     (skill_manage patch — jangan menunggu diminta)
   - Warisan WAJIB menyertakan ANGKA/bukti nyata (bukan "kelihatannya"),
     plus konteks kapan itu terjadi (phase/commit/tanggal).
3. SINKRONKAN ringkasan singkat ke skill babftss-kontrak (AI penerus
   membaca skill sebelum kontrak penuh).
4. PUSH perubahan kontrak/skill sebelum menutup sesi (kalau berada di
   repo yang tertrack git; KONTRAK_PERMANEN.md di luar repo → cukup
   tersimpan di disk + sebutkan di laporan Telegram).

**Standar kualitas warisan** (contoh nyata yang BENAR — lihat bab
"WARISAN PENGALAMAN — sesi 2026-09-10"): tiap butir = jebakan apa,
kenapa menipu, bukti/angka, dan cara benar. Warisan yang baik membuat
AI penerus TIDAK MENGULANG kegagalan yang sama — seperti machine
learning: tiap sesi = 1 epoch, kontrak = bobot yang terus ter-update,
AI penerus = inferens yang mulai dari bobot terbaik, bukan nol.

**Larangan:** DILARANG menutup sesi/laporan dengan kalimat "nanti
saja aku catat" atau menyimpan temuan hanya di kepala — sesi baru
= kepala kosong, warisan yang tidak ditulis TIDAK ADA.

---

## 4. PENGETAHUAN TEKNIS MAHAL (jangan ulangi risetnya)

Hasil pengukuran langsung ke `node_modules/three/examples/jsm/controls/TransformControls.js`.

### Struktur TransformControls 0.185
```
transformControls
  ._root                          ← hasil getHelper(), di-add ke scene
      ._gizmo                     ← TransformControlsGizmo
          .gizmo.translate        ← VISUAL panah      (yang dimodifikasi)
          .gizmo.rotate           ← VISUAL cincin
          .gizmo.scale            ← VISUAL scale
          .picker.translate        ← AREA KLIK (invisible) — JANGAN disentuh
          .picker.rotate
          .helper.translate        ← garis bantu putih
      ._plane                     ← bidang bantu untuk hitung drag
```

### 5 JEBAKAN PALING MEMATIKAN
**1. `handle.position` DITIMPA SETIAP FRAME** (baris 1613):
`handle.position.copy(this.worldPosition)` → set manual selalu hilang.
Diverifikasi: set (9,9,9) → jadi (0,0,0). → Offset posisi WAJIB lewat `geometry.translate()`.

**2. `handle.visible = true` DIPAKSA SETIAP FRAME** (baris 1611):
Menyembunyikan sekali langsung dibatalkan frame berikutnya.
→ Bungkus `_gizmo.updateMatrixWorld`, terapkan SESUDAH fungsi asli:
```javascript
const originalUpdate = gizmoRoot.updateMatrixWorld;
gizmoRoot.updateMatrixWorld = function (force) {
  originalUpdate.call(this, force);   // biarkan yang asli jalan dulu
  /* ...baru terapkan penyembunyian/pengaturan di sini... */
};
```

**3. `setupGizmo()` MEM-BAKE ROTASI KE GEOMETRY** (baris 1538-1540):
Setelah itu bounding box sudah world-space: shaft X → sizeY cuma 0.0130, dsb.
→ Jangan pakai tinggi-Y untuk klasifikasi. **Ukur extent pada sumbu handle-nya
sendiri** (handle 'X' → ukur `x`). Shaft ≈0.5, cone ≈0.1.
→ `handle.isMesh` TIDAK bisa membedakan garis dari kerucut (lineGeometry2 juga Mesh).

**4. Mode rotate: setiap handle diputar CAMERA-ALIGN** (baris 1831-1853):
Cincin penuh tidak kelihatan berubah, tapi bola yang menempel JELAS bergeser.
→ Kunci quaternion bola ke basis gizmo, lalu **WAJIB**
`rotateObj.updateMatrixWorld(true)` karena `super.updateMatrixWorld()` sudah
dipanggil di akhir fungsi asli (baris 1902).

**5. `material.color` gizmo DITIMPA TIAP FRAME dari cache `_color`** (baris 1874-1878,
ditemukan 2026-09-07, commit `f2b6ca1`):
`updateMatrixWorld()` menyimpan warna asli ke `material._color` lalu menimpa
`material.color.copy(material._color)` SETIAP FRAME. Mengubah `handle.material.color`
langsung → 1 frame kemudian BALIK ke warna lama. Ini sumber kegagalan panjang
fitur "warna gizmo Clone/Mirror" (banyak AI menyerah / malah merusak fitur lain):
setGizmoColor() lama melaporkan `changed:12` (lulus palsu) tapi layar tak berubah.
→ CARA BENAR: API publik `tc.setColors(x, y, z, active)` (baris 947) —
satu-satunya jalur yang JUGA memperbarui cache `_color` (baris 962-969).
Semua handle panah/bola SHARE material dari `materialLib`, jadi satu panggilan
menjangkau semuanya. Slot `active` (warna highlight hover/drag) ikut diisi
supaya panah tidak "balik kuning" saat di-hover. Reset default:
`tc.setColors(0xff0000, 0x00ff00, 0x0000ff, 0xffff00)`.
PENGECUALIAN (Phase 51, commit `e6045e8`): bola scale #EFBF04 memakai material
BARU per sumbu — BUKAN share materialLib — supaya warnanya kebal terhadap
setColors() clone/mirror. Highlight hover tetap bekerja karena baris 1884
meng-copy `materialLib.active.color` langsung ke handle aktif.

**5b. Mode scale DIPAKSA space='local'** (baris 1585: `const space = (this.mode
=== 'scale') ? 'local' : this.space;`) WALAU tc.space='world'. Konsekuensi:
gizmo scale mengikuti worldQuaternion object, sementara pointStart tetap
world space → deteksi SISI (untuk solo drag) WAJIB un-rotate pointStart
dengan inverse worldQuaternion SELALU di mode scale (Move hanya perlu saat
space==='local'). Tanpa ini, block yang dirotasi 90° membuat deteksi sisi
salah/kabur (terukur: komponen 0.000).

### Angka penting Move gizmo (translate)
```
cone (arrowGeometry)  : CylinderGeometry(0, 0.04, 0.1, 12)   center ±0.55
shaft (lineGeometry2) : CylinderGeometry(0.0075,0.0075,0.5,3) center ±0.25
Bawaan: 6 cone + hanya 3 shaft (sisi + saja)  ← INI SUMBER BUG
Mirror ke sisi negatif: rotasi 180° thd sumbu PERPENDICULAR
  x → putar thd Y  |  y → putar thd X  |  z → putar thd X
Determinan +1 → winding aman, TIDAK perlu DoubleSide
```

### Angka penting Rotate gizmo
```
Bawaan punya 5 handle:
  XYZE : cincin abu-abu #787878 PENUH r=0.5
  X    : busur merah SETENGAH (arc 0.5), bidang YZ
  Y    : busur hijau SETENGAH, bidang XZ
  Z    : busur biru SETENGAH, bidang XY
  E    : cincin kuning #ffff00 PENUH r=0.75
Cincin penuh: TorusGeometry(0.5, 0.0075, 3, 64, 2π) + rotateY(π/2) + rotateX(π/2)
  rotasi tambahan: X=none, Y=[0,0,-π/2], Z=[0,π/2,0]
  cek berhasil: bbox 1.015 x 1.015 pada 2 sumbu (bukan 1.015 x 0.507)
Bola: SphereGeometry(0.075, 16, 12), di radius 0.5
  cincin Y → bola di ±X (kiri-kanan)
  cincin X → bola di ±Z (depan-belakang)
  cincin Z → bola di ±Y (atas-bawah)
Picker rotate = TorusGeometry(0.5, 0.1) PENUH → bola (r 0.075) sudah tercakup,
  TIDAK perlu picker tambahan (sudah diuji 3 ukuran, tidak membaik)
```

### BUG SEJARAH — TransformControls Clone/Mirror (Phase 50 v9, 2026-09-06)

**Akar Masalah:**
TransformControls intercept drag SEBELUM click handler fire. Saat user switch
dari Move ke Clone/Mirror:
- Gizmo masih attach ke block lama dari operasi Move
- User klik-tahan-geser → TransformControls drag block lama (bukan ghost clone)
- `onWindowMouseUp` exit early karena `transformControls.dragging = true`
- Branch clone di click handler tidak pernah tercapai → ghost tidak ter-create
- Hasil: Clone tidak bekerja, terasa seperti Move biasa

**Solusi yang BENAR** (commit `d7e0938`):
```javascript
// Di useEffect yang watch tool state, saat switch ke Clone/Mirror:
if ((tool === 'clone' || tool === 'mirror') && tc.object) {
  const sourceBlock = tc.object;
  tc.detach();   // 1. Detach dari block asli

  // 2. Auto-create ghost di posisi block yang sama
  if (sourceBlock && sourceBlock.userData.isBlock && !sourceBlock.userData.cloneGhost) {
    const scene = threeRef.current.scene;
    if (scene) {
      const ghost = new THREE.Mesh(
        sourceBlock.geometry.clone(),
        Array.isArray(sourceBlock.material)
          ? sourceBlock.material.map(m => m.clone())
          : sourceBlock.material.clone()
      );
      ghost.position.copy(sourceBlock.position);
      ghost.rotation.copy(sourceBlock.rotation);
      ghost.scale.copy(sourceBlock.scale);
      ghost.userData.isBlock = true;
      ghost.userData.cloneGhost = true;
      scene.add(ghost);
      threeRef.current.blocks.push(ghost);
      threeRef.current.cloneGhost = ghost;

      // 3. Attach gizmo ke ghost → 6 panah muncul di ghost
      tc.attach(ghost);
    }
  }
}
```

**Flow yang BENAR:**
1. Move → 6 panah muncul di block A
2. Switch Clone → detach dari A → auto-create ghost di posisi A → attach ke
   ghost → 6 panah muncul di ghost
3. Drag ghost → clone bekerja (block baru ter-create)
4. Klik block lain → gizmo pindah ke ghost baru

**Pola Kesalahan yang HARUS DIHINDARI:**
1. Terlalu cepat apply fix tanpa trace flow lengkap — jangan asumsikan masalahnya
   di mana. Trace: mousedown → drag → mouseup → handler → branch mana yang fire?
2. Detach gizmo saja — 6 panah hilang → UX buruk. User harus klik block dulu
   baru 6 panah muncul. Tidak natural.
3. Re-attach ke block yang sama — TransformControls intercept drag lagi → clone
   tidak bekerja (kembali ke masalah awal).
4. Tidak pikirkan UX impact — gizmo visible vs hidden, flow natural vs awkward,
   user expectation.

**Pelajaran Penting:**
- TransformControls punya prioritas drag LEBIH TINGGI dari click handler.
  Kalau gizmo attach ke object, user drag → TransformControls menang, click
  handler kalah.
- Solusi: detach gizmo DULU, baru click handler bisa fire. Tapi detach saja =
  UX buruk → harus auto-create ghost + attach ke ghost.
- **Selalu trace full flow sebelum fix** — jangan asumsikan masalahnya di mana.

**Testing Checklist untuk Gizmo/Clone/Mirror:**
- Switch tool → gizmo mode berubah (translate/rotate/scale)
- Switch ke Clone/Mirror → 6 panah tetap visible (di ghost)
- Klik block → ghost muncul
- Drag ghost → clone bekerja (bukan drag block lama)
- Klik block lain → gizmo pindah ke ghost baru
- Clone ke-2, ke-3, dst → semua bekerja
- Mirror → behavior sama dengan Clone

**Waktu yang Terbuang:** 5 JAM untuk fix bug ini karena tidak trace flow
lengkap di awal, apply fix tanpa tes memadai, revert → fix lagi → revert
lagi. JANGAN ULANGI KESALAHAN INI!

### BUG SEJARAH — Warna Gizmo Clone/Mirror (Phase 50 v11, 2026-09-07, commit `f2b6ca1`)

**Masalah dari user:** tool Clone → 6 panah harus BIRU #0096FF SEMUA; tool
Mirror → 6 panah harus UNGU #9D00FF SEMUA. Banyak AI sebelumnya gagal dan
malah menambah masalah baru.

**Akar Masalah (terbukti ukur, bukan tebak):**
`TransformControlsGizmo.updateMatrixWorld()` baris 1874-1878:
```javascript
handle.material._color = handle.material._color || handle.material.color.clone();
handle.material.color.copy( handle.material._color );   // ← TIAP FRAME
```
Versi lama `setGizmoColor()` mengubah `handle.material.color` langsung →
tepat setelah dipanggil warna biru (kelihatan berhasil!), tapi frame
BERIKUTNYA ditimpa balik dari cache `_color` yang masih merah/hijau/biru.
`changed: 12` di return = LULUS PALSU. Ini jebakan yang sama dengan
`handle.position` (ditimpa `worldPosition` tiap frame) — hanya versi warna.

**Solusi (API publik, ubah sekecil mungkin):**
```javascript
// setGizmoColor: 4 slot (x, y, z, active) diisi warna sama
transformControls.setColors(color, color, color, color);
// resetGizmoColors: default persis konstruktor
transformControls.setColors(0xff0000, 0x00ff00, 0x0000ff, 0xffff00);
```
`setColors()` (baris 947) adalah SATU-SATUNYA jalur yang juga memperbarui
cache `_color` (baris 962-969). Ke-12 handle panah (6 bawaan + 6 mirror
makeSixArrows) + 6 bola rotate semuanya share `materialLib` → satu
panggilan menjangkau semua. Slot `active` ikut diisi supaya hover/drag
tidak "balik kuning". Pemanggil di BlockSimulator3Dv2.jsx TIDAK diubah.

**Pelajaran Penting:**
- Gejala "kelihatan berhasil lalu balik sendiri" = hampir pasti ada
  penimpaan tiap frame → cari cache internal (`_color`, `_opacity`).
- "Berhasil tepat setelah dipanggil" BELUM berarti berhasil — WAJIB
  render beberapa frame dulu baru mengukur (tes headless: `frame(5)`).
- Material gizmo di-SHARE antar handle & antar mode (translate↔rotate
  bola) → mengubah 1 material menjalar ke mana-mana; selalu pikirkan
  reset saat pindah tool.
- Bola rotate memang ikut berwarna saat Clone/Mirror (share materialLib)
  tapi TIDAK tampak di mode translate (`gizmo.rotate.visible=false`),
  dan useEffect tool memanggil resetGizmoColors() saat pindah tool → aman.

**Verifikasi nyata:** tes headless 14 PASS / 0 FAIL (RED dulu: 4 FAIL);
uji pixel GPU nyata: SESUDAH clone = 236 px #0096FF, 0 px RGB lama;
SESUDAH mirror = 240 px #9D00FF, 0 px lain; vite build exit 0.

**Pitfall alat ukur:** pixel "merah" 98 px di screenshot ternyata fringe
subpixel anti-aliasing TEKS judul panel (y=19-38), bukan panah — hitung
ulang per-kuadran area canvas saja → nol. Jangan lalu mengira fix gagal.

### PENGETAHUAN — Checkbox "arrow match rotation" (Phase 52, 2026-09-07, commit `574b9bf`)

**Fitur:** panel checkbox 1-keluarga untuk 5 tool (move/rotate/scale/
clone/mirror) di koordinat PERSIS panel Colors (top:80, right:16).
Tercentang (default WAJIB tiap fresh entry — jangan persist!) = gizmo
ikut sisi block (space local); kosong = panah/bola TEGAK LURUS dunia
walau block miring (space world).

**Kunci implementasi:**
- Move/Clone/Mirror + Rotate: cukup `tc.space = 'local' | 'world'`
  (API publik ber-definesetter; otomatis sinkron ke gizmo+plane+event).
  Wrapper bola rotate (gizmoRotateRings) sudah membaca space dinamis.
- SCALE TIDAK BISA pakai tc.space — dipaksa 'local' (baris 1585, jebakan
  #5b) → pakai `setScaleWorldAlign(tc, match)` dari gizmoScaleBalls.js
  (flag WeakMap per-instance): wrapper mengunci quaternion bola ke
  identity SETELAH fungsi asli + `scaleObj.updateMatrixWorld(true)`;
  dan deteksi sisi solo drag TIDAK un-rotate pointStart saat world-align.
- useEffect penerapan: dep `[arrowMatchRotation, tool]` — restyleRotateGizmo
  men-set `tc.space='local'` saat init, jadi re-apply per ganti tool
  mencegah uncheck user tertimpa balik oleh init (race init scene).

**PITFALL PENGUKURAN BARU (2x gagal palsu sebelum ketemu):**
1. JANGAN pernah menimpa properti internal yang sedang diukur —
   `tc._gizmo.worldQuaternion` adalah referensi SHARED dengan controls
   (TransformControlsRoot menulis ke sana tiap frame). Probe yang
   menimpanya dengan Quaternion baru merusak state → 5 FAIL palsu.
2. `updateMatrixWorld()` gizmo hanya memproses handle milik MODE AKTIF
   (`this.gizmo[this.mode].children`). Membaca quaternion bola scale
   saat mode masih 'translate' = identity palsu (bola tak di-update).
   Selalu `setMode(...)` + frame dulu sebelum mengukur.
3. Rumus tanda un-rotate: rotasi -45° thd Y pada (0,0,z) menghasilkan
   x = z·sin(-45°) → world -Z = sisi lokal +X. Jangan asal tanda.

### PITFALL DESAIN DARI GAMBAR REFERENSI (Phase 52 v2, commit `4892631`)

Analisis pixel KASAR (warna dominan global saja) TIDAK CUKUP untuk
menjiplak desain — panel v1 terbukti "jelek" karena struktur aslinya
tak ketangkap. IDENTIFIKASI MENYELURUH wajib (analyze-ref.py):
- Segmentasi horizontal per-segmen pada baris tengah (ymid) → panjang
  EXAKT tiap elemen (checkbox 46px, pemisah HITAM 12px, gap 24px).
- Border-run per sisi → border bisa ASIMETRIS (ukur nyata: 8/6/6/2).
- Cek pixel sudut (0,0)-(5,5) → PERSEGI vs rounded (radius 0, bukan tebak).
- Tinggi glyph teks (bbox pixel terang) → font-size asli (17px glyph
  = font 23px), bukan "kelihatan ~17px".
- Mask centang: bbox pixel gelap + render ASCII → bentuk & stroke (4.5px).
- Validasi silang 2 gambar beda skala (01.png 2.9x vs 02.png): SEMUA
  rasio harus cocok — kalau cocok, identifikasi benar.
- Verifikasi akhir: bandingkan PROFIL WARNA replika vs referensi
  (5 kategori, toleransi ≤6%) → PROFIL MATCH = jiplakan sah.
Teks label dari USER (bukan OCR): user menyebut "(arrow match rotation)" —
verifikasi struktural: 3 kelompok kata cocok lebar frasa.

### PELAJARAN DESAIN TERBESAR (Phase 52 v3, commit `223f89b`)

JIPLAK GAMBAR REFERENSI KALAH PENTING dari KONSISTENSI DESIGN SYSTEM
REPO. Panel v2 sudah presisi-pixel mengikuti gambar, tapi user tetap
bilang JELEK — karena gambar referensi (abu-abu #303030, border hitam
kasar) ASING terhadap app yang gelap-biru (#0e1420, #1e293b, amber
#f59e0b, Orbitron/Inter, radius 14, blur 10px).
ATURAN FINAL UTK UI PROJECT INI:
1. WAJIB load skill design dulu (claude-design + ui-ux-design-system)
   SEBELUM bikin/mengubah UI — kontrak A.1-A.5.
2. Source-code fidelity (skill claude-design): angkat nilai PERSIS dari
   tema repo — panelBg, panelBorder, textSecondary, accent, font, radius,
   blur, padding — jangan bangun dari ingatan apalagi dari gambar asing.
3. Surface-first: panel opsi = surface CONFIGURE — buat EXTENSIBLE
   (baris opsi reusable), karena user akan menambah opsi-opsi lain.
4. Checkbox custom konsisten app: checked = accent #f59e0b + glow;
   unchecked = abu transparan; label semibold/muted per state.
5. Kalau user minta "jiplak gambar" TAPI hasilnya janggal di app —
   desain ulang mengikuti design system app, lalu jelaskan alasannya.
   (User menilai dengan mata, bukan dengan toleransi pixel.)

### PENGETAHUAN — Select Box / Marquee 3D (Phase 53, commit `3e5262e`)

Fitur: opsi "Select Box" (panel Gizmo Options, bawah Arrow Match
Rotation; 1 keluarga 5 tool) — drag kiri = kotak transparan; semua
block yang PROYEKSI LAYARNYA kena kotak terpilih (jarak dunia tidak
relevan — seleksi ruang-layar). Warna per tool: move #0047AB, rotate
#32CD32, scale #EFBF04, clone #0096FF, mirror #9D00FF. Modul murni:
src/utils/marqueeSelect.js (getBlocksInScreenRect + MARQUEE_COLOR_BY_TOOL).

**JEBAKAN PROYEKSI (bug nyata, terukur):**
Titik di BELAKANG kamera menghasilkan proyeksi NDC yang "sah-looking"
(NDC z > 1, tapi x/y bisa kecil wajar) → guard |NDC|>50 TIDAK menangkap
→ block di belakang kamera IKUT terpilih.
CARA BENAR: transformasi tiap sudut bbox ke VIEW-SPACE dulu via
`camera.matrixWorldInverse`; buang sudut dengan viewZ > 0 (kamera
Three.js menghadap -z) SEBELUM project(). Terukur: depan → viewZ < 0
(NDC z < 1); belakang → viewZ > 0.
GUARD tambahan drag: klik <5px bukan seleksi; hover gizmo
(transformControls.axis != null) → jangan curi drag; controls.enabled =
false selama marquee, pulihkan di mouseup (kalau tidak, orbit ikut
muter saat menyeleksi).

**Pitfall test:** koordinat asersi marquee WAJIB dari getScreenBox()
(proyeksi terukur), bukan asumsi visual — 3 FAIL palsu karena posisi
block di layar dikira beda dari nyata (kamera lookAt bawah menggeser
semua proyeksi).

**Update v2 (commit `ef6761e`, permintaan user):**
- Warna marquee move: #0047AB → **#00308F** (lebih TUA — jelas beda dari
  clone #0096FF yang terang; lum 44 vs 117).
- SYARAT GANDA: engine marquee menolak jika tool aktif BUKAN keluarga-5
  (guard `toolRef.current` sebelum aktivasi) — unequip/tool lain = fitur
  otomatis off, konsisten dengan visibilitas panel.
- ATURAN MUTLAK: default selectBoxEnabled = TRUE + tidak dipersist →
  tiap user masuk/buka 3D Block Simulator, Select Box langsung tercentang.
- Jangkauan (konfirmasi user): seleksi memang TIDAK terbatas jarak —
  block sejauh apa pun terpilih selama proyeksinya kena kotak.

**Update v3 (commit `5f0a6b0`, bug report user):**
GEJALA: scale/move/rotate + Select Box OFF → drag kiri KAMERA MATI (tool
lain normal). AKAR: useEffect `mouseButtons.LEFT = null` SELALU untuk
keluarga-3 historis (warisan pra-Select-Box) — tidak membaca checkbox;
saat off: bukan marquee (guard tolak) + bukan pan (null) = no-op.
PELAJARAN: saat menambah interaksi drag BARU, AUDIT semua kode lama yang
mengatur mouse button / kontrol kamera untuk tool yang sama — kode warisan
yang dulu benar bisa jadi jebakan setelah fitur baru mengubah asumsinya.
FIX: useEffect baca [tool, selectBoxEnabled]; kondisi diperluas ke
KELUARGA-5 (bukan cuma 3 historis) supaya drag kiri deterministik:
ON = null (marquee murni, tanpa race pointerdown-vs-mousedown), OFF = PAN.
Tool lain selalu PAN (28 kombinasi teruji, tidak tersentuh).

**Update v4 / Phase 54 (commit `04dcb66`, permintaan user):**
1. Warna marquee move FINAL: **#0044E0** — user: "tetap biru tua tapi
   ngejrenk". #00308F kusam karena channel B cuma 143; #0044E0 = HSL
   (222°,100%,44%) → B=224 jenuh. Terukur rgb(0,68,224) ≠ clone rgb(0,150,255).
   Pelajaran: "tua" ≠ "gelap kusam" — minta user konfirmasi vivid vs muted,
   naikkan CHANNEL warna utama, jangan semua channel.
2. GIZMO AUTO-HIDE: useEffect [tool] → tool BUKAN keluarga-5 →
   `ghostSource = null` DULU (batalkan restore v13!) + `clearSelection()`
   (dipakai apa adanya: unhighlight + buang group + ghost + detach).
   Antar keluarga → TETAP attach. PELAJARAN URUTAN: cabang auto-hide
   harus jalan SEBELUM restore v13 — tanpa ghostSource=null, keluar
   clone→paint akan re-attach gizmo ke block asal (bug dicegah, teruji).
   clearSelection diekspos ke threeRef saat init (pola recordHistory).
3. Phase 54 v2 (`162752a`): klik kiri AREA KOSONG di move/rotate/scale
   → gizmo TIDAK hilang (no-op; dulu clearSelection tanpa syarat →
   gizmo & highlight mati). Standar perilaku = clone/mirror: klik-kosong
   tidak menyentuh selection. Gizmo hanya hilang lewat jalur sengaja:
   unequip / tool non-keluarga. PELAJARAN UI: saat standarisasi perilaku
   antar tool sekeluarga, cari tool yang perilakunya sudah dianggap
   BENAR oleh user (di sini clone/mirror) dan samakan yang lain ke
   situ — jangan invented perilaku baru.

### PENGETAHUAN — Update Terpisah Mobile vs PC (Phase 55, commit `36a8cee`)

USER BISA MEMBATASI update per-platform dalam satu prompt ("khusus
prompt ini saja: yang mobile untuk mobile saja, yang PC untuk PC saja
— jangan tercampur!"). Pemisahan ketat di kode:
- Breakpoint konsisten app: innerWidth >= 768 = PC, < 768 = mobile
  (pola yang SUDAH dipakai keybinds [1]-[0] & tombol).
- MOBILE-ONLY: handler touch pinch dipasang HANYA jika
  `window.innerWidth < 768 && ('ontouchstart' in window)`;
  gear Paint dirender hanya < 768.
- PC-ONLY: tombol "Color Settings" hanya >= 768; handler pinch TIDAK
  dipasang di PC.
- Pinch Select Box (mobile): evaluatePinchSelectBox() di marqueeSelect.js
  — state machine murni. Zoom-OUT 2 jari → kotak muncul SEKETIKA (syarat
  keluarga-5 + checkbox ON); setelah aktif out=besar in=kecil; cubit
  duluan = kamera saja (kotak tak boleh muncul); OFF/tool lain = kamera.
  Saat kotak aktif: controls.enabled=false, pulih di touchend. PELAJARAN:
  logika gesture = state machine murni terpisah dari DOM supaya bisa
  dites tanpa device touch (7/7 PASS headless).
- Gear Paint → tombol "Color Settings" (PC): fungsi IDENTIK (buka modal
  ColorWheelPicker via setColorPicker mode 'picker') — hanya UI yang
  pindah; JANGAN sampai salah toggle tool / set warna langsung.
- PELAJARAN asersi: teks yang dicari (mis. 'Color Settings') bisa muncul
  dulu di KOMENTAR jauh dari blok kode — pakai lastIndexOf + cek konteks
  blok, bukan indexOf pertama.

### PELAJARAN v2 (Phase 55, commit `a9d37ab` — 3 bug report user)

1. JEBAKAN SVG+CSS: attribute `fill` SVG TIDAK menerima nilai CSS modern
   seperti `conic-gradient()` — browser tolak → render HITAM senyap
   (tanpa error). Gradient CSS (conic/radial/linear) WAJIB lewat
   `background` di elemen HTML (span/div), bukan fill/stroke SVG.
   Verifikasi visual wajib: hitung kategori warna pixel area ikon.
2. Pinch/gesture "BERAT" = gejala pertumbuhan per-event (scale
   dikomposisi 1+delta/prev tiap move) — responsnya melambat logaritmik
   & jari harus berulang. CARA BENAR: DIRECT TRACKING — ukuran =
   f(jari sekarang)/f(jari awal gesture) (anchor-based), proporsional
   1:1, lompatan sebesar apa pun instan. Sama rasa pinch zoom kamera.
3. Gesture 2 jari: kotak SELALU di MIDPOINT jari (centered) — otomatis
   dapat fitur "geser bersama = kotak pindah, kamera diam" gratis,
   tanpa state tambahan.

### PENGETAHUAN — Phase 56: Panel Opsi, Pivot Multi-Select, Mirror Kaca, Ledakan Kamera Mobile (commit `816b699`)

**Bug 1 — Panel Gizmo Options melebar saat centang Select Box (PC+mobile):**
Panel absolute nempel kanan (`right:16`) pakai lebar shrink-to-fit; teks hint
gabungan "• Select Box aktif: drag kiri = kotak pilih" dalam SATU baris
mendorong lebar panel +79.7px ke KIRI (terukur harness: 234.0→313.7px).
FIX: `maxWidth: 208` (= minWidth → lebar KONSTAN; hint panjang wrap ke bawah)
+ hint dipecah per-keadaan (`<div>` terpisah, pola extensible).
ATURAN: konten panel opsi jangan pernah dirangkai 1 baris panjang.

**Bug 2 — Gizmo multi-select muncul di pusat build area (keluarga-5):**
`selectionGroup = new THREE.Group()` POLOS → origin (0,0,0) → gizmo
nempel pusat dunia walau block terpilih di ujung kiri-kanan (terukur:
block di ±8, pivot gizmo (0,0,0)).
FIX (rumus user "pake rumus aja buat nyari titik area tengah"):
`getSelectionPivot()` di marqueeSelect.js — union bounding box WORLD semua
block terpilih → center = (min+max)/2 → `selectionGroup.position.copy(pivot)`
SEBELUM `attach()` (attach tetap preserve world position block).
Otomatis benar 2 block s/d 50+ block tersebar/terotasi/ter-scale.

**Bug 3 — Mirror harus KACA (klarifikasi user 2026-09-09):**
Mirror = menggandakan seperti clone (posisi ghost = posisi source, ikut
geser), TAPI sisi-sisi hasil 100% BERLAWANAN arah (bayangan kaca).
Clone = 100% identik. Block belum dirotasi memang tampak sama seperti
clone — itu BENAR (kubus simetris).
TERUKUR: mengubah angka rotasi Euler (skema lama rot.y=−y, rot.z=−z)
= det +1 = ROTASI BIASA, BUKAN kaca — TIDAK PERNAH bisa jadi kaca.
KACA SEJATI = determinant NEGATIF: rotasi dikonjugasi refleksi
R' = S·R·S (S = diag(−1,1,1) → negasi baris-0 & kolom-0 matriks
rotasi, e00 tetap; ekuivalen EXACT dgn S·R·S referensi) + `scale.x
= −scale.x` → det −1. Modul: `src/utils/mirrorGhost.js`
(`applyMirrorGlass` + `mirrorQuaternionX`). Hasil terukur: yaw 90° →
depan source (1,0,0) vs depan ghost (−1,0,0).
3 titik aplikasi: klik-path mirror, useEffect auto-create (ke mirror
saja), pindah clone↔mirror dgn ghost hidup (orientasi re-flip per
tool tujuan dari `userData.ghostSource`; POSISI ghost dipertahankan —
jangan teleport). Jalur klik lama yang menegasi position.x (ghost
muncul di seberang area build) DIHAPUS.

**Bug 4 — Mobile: lepas 2 jari selepas marquee → kamera MELEDAK:**
Akar (dibaca langsung dari OrbitControls.js 0.185): `onPointerUp`
TIDAK punya guard `enabled` (beda dgn `onPointerMove` yang punya!).
Selama kotak pinch aktif, `controls.enabled=false` → `onPointerMove`
ke-gate → `_pointerPositions` TIDAK ter-update = BEKU. Saat jari 1
lepas, `onPointerUp` tetap jalan → state-correction case-1 men-set
`TOUCH_ROTATE` dgn `_rotateStart` = posisi jari 2 yang BEKU. Kalau
app lalu `controls.enabled = true` (padahal jari 2 masih menekan),
jari 2 bergeser dikit → delta = sekarang − BEKU (ratusan px, user
tadi menggoyang kotak) → kamera tersentak (terukur: azimuth 48.9° +
polar 100.3° dalam SATU move).
FIX: `controls.enabled = true` HANYA saat `e.touches.length === 0`;
kalau masih ada jari → pending flag, dituntaskan di touchend TERAKHIR
(listener `onPinchTouchEndPending`). ATURAN: jangan pernah pulihkan
`controls.enabled` di touchend selagi masih ada jari lain di layar.

**Pitfall alat ukur Phase 56:**
1. det mesh ber-scale non-uniform (2,0.5,1.5) = −sx·sy·sz = −1.5,
   BUKAN −1. Penanda kaca = TANDA negatif, bukan nilai persis −1.
   Asersi v1 salah nebak −1 → FAIL palsu.
2. ~~`vision_analyze` bisa gagal total~~ **SUPERSEDED 2026-09-10**: era model
   text-only sudah berakhir — vision kini Gemini 3 Flash aktif permanen
   (lihat ATURAN #8). Kalau vision benar-benar gagal (429 limit → ikuti
   protokol limit di ATURAN #8; error lain → retry 2x), BARU fallback ke
   verifikasi pixel PROGRAMATIK (PIL + colorsys, klasifikasi HUE tahan
   shading Lambert — JANGAN RGB exact; v>0.35 & s<0.25 utk abu) — dan
   LAPORKAN ke user bahwa verifikasi visual belum 100% (pixel tidak bisa
   membaca STRUKTUR/makna gambar — pelajaran Phase 60 v2). Koordinat
   panel dari `getBoundingClientRect()` via `--dump-dom` tetap berlaku.

### WARISAN PENGALAMAN — sesi 2026-09-10 (Phase 60-62, wajib dibaca AI penerus)

Pengalaman nyata dari sesi vision-Gemini pertama (6 pelajaran mahal):

1. **Vision adalah mata, pixel adalah mistar** — keduanya beda pekerjaan.
   Vision membaca STRUKTUR/MAKNA ("menempel vs mengambang"), pixel
   mengukur ANGKA (ketebalan px, rasio bbox). Salah tukar peran =
   keputusan salah (Phase 60 v2: pixel salah baca struktur → 50% benar).
2. **Shell child box 1×1×1 TIDAK otomatis pas di block non-1.0** —
   scale block (mis. thin plank) membuat bingkai 25% lebih besar →
   tampak "mengambang menembus block". WAJIB sesuaikan shell ke bounding
   box GEOMETRY block (local space) + offset center (max+min)/2. Jangan
   pakai Box3.setFromObject/world-scale (dobel-count parent scale).
3. **Jebakan anchor regex**: `indexOf('onCanvasMouseMove')` match KOMENTAR
   di baris 3899, bukan definisi di 13952 → zona tes kosong → FAIL
   palsu. Selalu anchor ke token unik definisi: `'const onCanvasMouseMove'`.
   (Serupa: 'currentTool' pertama ada di klik handler, bukan mousemove.)
4. **Harness jangan "pinter-pinteran"**: test yang manipulasi internal
   langsung (setTimeout detach manual meniru ganti warna) menghasilkan
   ARTEFAK PALSU yang dianggap bug produk. Tiru alur produk PERSIS via
   API resmi (attach → detach → attach), satu skenario per objek.
5. **Halaman test kosong ≠ berhasil**: screenshot 2KB = halaman error/
   JS gagal — CEK DULU dengan vision/CDP console sebelum menghitung
   pixel. Console CDP (Runtime.enable + exceptionThrown) menangkap
   SyntaxError import yang tak terlihat di screenshot. Vision juga
   menangkap halaman error localhost — tanpa vision, klaim sukses palsu.
6. **rgbToHsv internal skala 0-1, slider UI ×100** — asersi v=100 pada
   fungsi internal = FAIL palsu; cek dulu skala return sebelum menulis
   ekspektasi. (Bug serupa sebelumnya: colorsys hue 0-1 vs derajat.)
7. **Vision bisa salah menilai PNG transparan** (Phase 63, 2026-09-11):
   vision bilang ikon "background masih putih solid" padahal 76% area
   alpha=0 — viewer menampilkan layer putih DI BELAKANG transparansi.
   Verifikasi alpha WAJIB via histogram angka (PIL getchannel('A')),
   bukan mata vision.
8. **Harness dempet = penilaian vision palsu** (Phase 63): 5 kubus di
   spacing sempit menumpuk di 30% tengah layar → vision menilai glass
   "solid gelap" (tertutup kubus lain). Sebelum menyalahkan material,
   UKUR POSISI CLUSTER pixel dulu — kalau bbox menumpuk, itu layout
   harness yang salah, bukan PBR.
9. **Menyetel PBR di harness = kalibrasi salah** (Phase 63): pencahayaan
   harness HARUS PERSIS app (ambient/dir intensitas + posisi + tone
   mapping ACES). Harness lighting khayalan (ambient 0.75+dir 0.9) membuat
   gold terlihat "olive kusam" padahal di lighting app beda lagi.
10. **Kuota vision input-token PER-HARI bisa habis oleh iterasi** (Phase
    63): ~15 panggilan analisis berat = 429 persisten bahkan untuk payload
    kecil (beda dgn 429 per-menit yang pulih 60 detik). Protokol: switch
    ke pixel-check programatik sebagai verifikasi berjalan + laporkan
    jujur "vision menunggu reset ~14-15 WIB"; JANGAN spam retry.
11. **Placeholder tint × texture = MERUSAK warna** (Phase 64, 2026-09-11):
    color material DIKALIKAN texture — placeholder warna dominan yang
    dibiarkan permanen membuat block gelap/pekat (wood terukur 129,81,16
    → 76,29,3). Placeholder HANYA boleh sementara: beri warna dominan
    SEBELUM texture siap (anti block hitam), lalu WAJIB auto-reset ke
    putih via texture onReady callback. Kombinasi + preload semua texture
    di init = loading instan tanpa hitam.
12. **Emissive WAJIB konsisten warna dasar texture dataset** (Phase 64):
    emissive aditif dengan texture — neon texture MERAH + emissive HIJAU
    = tampak KUNING-ORANYE → tester menyangka "gold"! Selain merusak
    identitas block, ini bug paling menipu: file aset terverifikasi benar
    (hash+pixel), "tertukar" hanya ilusi campuran warna. Cek dataset dulu
    (vision/pixel) sebelum memilih warna emissive.
13. **Regex-vs-komentar jebakan KE-3x** (Phase 64): `!/0x39ff14/` FAIL
    palsu karena hex lama disebut di KOMENTAR sejarah fix. Qualifier kode
    aktif (`emissive: 0x...`) wajib — pola ini kini 3x terjadi (BackSide,
    Chat Umum, hex emissive); tulis tes dengan prefix properti, bukan
    nilai polos.
14. **Vision bisa SALAH menafsirkan BATAS objek untuk efek cahaya**
    (Phase 65, 2026-09-11, neon glow): vision 4x menilai "glow tidak ada"
    padahal pixel membuktikan pendaran nyata (aura r=117 membentang
    ±90px di luar tubuh, bg r=10). Akar: vision menganggap SELURUH area
    merah (tubuh+aura) sebagai "kubus" — jawabannya menyebut "3 tingkatan
    merah = bingkai kubus" (itu justru tubuh+aura). Untuk verifikasi
    glow/bloom/pendaran: PROFIL PIXEL sepanjang garis (nilai r dari bg →
    tepi → tubuh) adalah bukti utama; vision hanya konfirmasi makna.
    Jangan loop menyetel opacity karena vision bilang "tidak ada" kalau
    pixel sudah menunjukkan gradasi.
15. **toneMapping ACES menggeser #FF0000 → campuran oranye** (Phase 65):
    user komplain warna hasil "#FF4225" padahal emissive ff2a1a; dua
    faktor menumpuk: hex tak murni + ACES. Material yang wajib warna
    murni (neon/glow) WAJIB `toneMapped:false` — ganti hex saja TIDAK
    cukup, ACES tetap merusak saat render final.
16. **SHELL BOX BERLAPIS TIDAK AKAN PERNAH JADI GLOW HALUS** (Phase 65 v2,
    2026-09-11, koreksi user "double, kotak kaku!"): mesh box scale
    besar (apapun opacity/side-nya) selalu punya EDGE KOTAK — hasil
    "kotak kaku berlapis", bukan aura. GLOW/AURA WAJIB pakai SPRITE
    RADIAL-GRADIENT (canvas merah→transparan, AdditiveBlending,
    billboard menghadap kamera) — gradasi blur alami nol-edge.
    Ini satu-satunya teknik yang lolos verifikasi vision 5/5.
17. **Profil pixel HARUS dibaca POLA-nya, bukan sekadar keberadaan**
    (Phase 65 v2 — kegagalan paling mahal sesi ini): kotak kaku JUGA
    menghasilkan "ada merah di luar tubuh" (r=117) → saya salah
    menyimpulkan glow bekerja & 4x menepis penilaian vision yang benar.
    Beda kotak vs glow ada di KONTINUITAS: step rigit antar lapisan =
    shell kaku; naik/turun bertahap tiap pixel = glow. Selalu cetak
    profil nilai penuh (bukan 1 titik) & bandingkan pola dengan dataset.
    Dan kalau VISION BERULANG kali bilang "salah" sementara kamu pakai
    bukti tak langsung — BERHENTI, teliti ulang: vision mungkin benar.
    (Key pool vision dari user: GOOGLE_API_KEY_2/3/4 di .env — risiko
    multi-akun ditanggung user, dipakai hanya saat kuota utama habis.)
18. **BLOOM POST-PROCESSING = OVEREXPOSED untuk aura block BESAR**
    (Phase 65 v4, 2026-09-11, 7 ronde terukur): UnrealBloomPass dirancang
    untuk sumber KECIL (lampu/partikel/matahari). Block besar ±130px dgn
    emissive HDR 4-6 → bloom menutupi block sendiri (pusat overexposure
    putih), wood tetangga tersengat, hingga pojok layar; strength 1.6→0.2
    tak pernah stabil. SPRITE RADIAL tetap satu-satunya teknik aura block
    besar yang lolos verifikasi ganda (vision 5/5 + profil pixel mulus
    identik dataset). Bloom = opsional via toggle user saja.
    Sub-pelajaran terukur: threshold bloom pakai LUMINANCE (rumus
    0.2126R+0.7152G+0.0722B — r255 flat = 0.2126 SAJA, tidak otomatis
    lolos!); MeshBasic + color.multiplyScalar TIDAK lolos ke bloom
    (output colorSpace conversion menahan nilai).
19. **EMISSIVE FLAT = cara anti-shading yang benar** (Phase 65 v4):
    spek "flat tanpa shading" (MeshBasic-like) TAPI butuh light-aware
    features → pakai MeshStandardMaterial color HITAM + emissive warna
    intensity >1: emissive = self-illumination = FLAT rata semua sisi,
    kebal light. TRAP: MeshBasic TIDAK punya .emissive — set property
    itu = exception refreshUniformsCommon di three.module.js TIAP FRAME
    → render loop mati total, halaman kosong (screenshot murni bg).
    Bug gizmo terkait: highlight/unhighlight gizmo TIMPA emissive
    (biru saat dipilih → HITAM saat dilepas = warna glow hilang
    permanen) — guard isGlowBlock WAJIB di kedua jalur.
20. **COPY-PASTE LOGIC MATERIAL = BUG BERANTAI (Phase 66, 2026-09-11,
    laporan-bug-neon-block-3dblocksimulator.md)**: logic emissive
    highlight yang di-copy-paste inline ke 4+ tempat menyebabkan 3 bug
    sekaligus (undo/redo hitam, clone biru permanen, source hitam).
    ATURAN: logic yang menyentuh material block WAJIB SATU fungsi
    terpusat (setBlockHighlight) + guard flag (isGlowBlock) — menambah
    titik sentuh baru = wajib lewat fungsi itu, DILARANG inline lagi.
    Untuk undo/redo: snapshot HARUS menyimpan IDENTITAS block
    (userData.blockSlug + isGlow), bukan cuma warna — warna neon ada
    di emissive (color=#000000!), material generik restore = block
    hitam. Restore = makeBlockMaterial + attachBlockGlow (aura ikut).
    Trap test Node: module yang pakai TextureLoader/CanvasTexture butuh
    stub document.createElementNS + canvas 2d-context fake (gradient,
    fillRect, getImageData) SEBELUM import — tanpa itu ReferenceError.
21. **CHILD (sprite/aura/gizmo-helper) TIDAK IKUT material.clone()**
    (Phase 66 v2, 2026-09-11, bug user "clone/mirror neon → glow
    hilang!"): ghost/duplikat yang dibangun dari geometry.clone() +
    material.clone() kehilangan SEMUA children (sprite aura = child
    block). ATURAN: setiap titik duplikasi block (tool-switch ghost,
    klik clone, klik mirror, dan titik baru mana pun di masa depan)
    WAJIB: (a) copy userData identitas (blockSlug dsb.) secara
    eksplisit, (b) re-attach efek visual children via fungsi pembuatnya
    (attachBlockGlow dgn syarat def.glow dari registry — JANGAN
    hardcode slug), (c) greppable: cari semua 'material.clone()' dan
    audit satu-satu. Audit celah ikut nemu: panel emissive editor &
    applyPaint JUGA menimpa material — SEMUA penulis material block
    (setEmissive/paint/editor/ghost) wajib guard isGlowBlock; neon
    tidak boleh bisa dicat (identitas glow > paint manual).
22. **Tes zona-slice = FAIL palsu berulang (KE-4x)** (Phase 66): pola
    `sim.indexOf(anchor)` + slice ±N char salah menangkap komentar/
    definisi lain → tes merah padahal kode benar. ATURAN PRAKTIS:
    untuk fitur yang muncul N kali, pakai matchAll regex + verifikasi
    KONTEKS per-match (bukan 1 zona indexOf); kalau tes FAIL tapi grep
    manual membuktikan kode ada — perbaiki ANCHOR tes, jangan kode.
23. **SCALE BLOCK: clamp ABS + tiling UV, bukan texture.repeat**
    (Phase 67, 2026-09-11, 2 bug user "absolut semua block"):
    (a) TransformControls scale BEBAS melewati 0 → negatif = block
    "tembus ke belakang, jebol, membesar lagi" — WAJIB clamp per-sumbu
    absolut min (0.05), TANDA dipertahankan (kaca/mirror -x sah).
    (b) Tekstur melar saat scale = UV statis 0..1; texture di-SHARE
    lintas block (cache) → repeat per-block HARAM di texture — SOLUSI
    BENAR: mutasi UV geometry per-block (BoxGeometry unik per place;
    basis disimpan sekali di userData.__uvBase = idempoten tiap frame):
    wajah ±X repeat (|sz|,|sy|), ±Y (|sx|,|sz|), ±Z (|sx|,|sy|) —
    RepeatWrapping: >1 LOOP, <1 CROP. Integrasi 3 titik: drag
    (objectChange), place, restoreState (undo/redo scale tersimpan).
    (c) GUARD EARLY-RETURN di baris pertama handler = event mati total
    untuk semua mode lain — guard wajib DI DALAM cabang mode yang
    relevan (bug: snapMoveRef return-awal membuat objectChange tidak
    jalan saat snapMove off, termasuk scale).
24. **KESALAHAN v1 SCALE — TANDA MANA YANG DIPERTAHANKAN?** (Phase 67
    v2.1, 2026-09-11, ditangkap user "jebol ke arah lain lalu malah
    lanjut scale!"): clamp yang mempertahankan tanda HASIL drag SALAH —
    TransformControls baris 671: scale = _scaleStart × _tempVector2,
    _tempVector2 BEBAS negatif saat crossing → tanda hasil ≠ tanda
    identitas block. ATURAN: tanda yang sah = tanda _scaleStart (snapshot
    saat dragging-changed START); crossing nol = DINDING (mentok
    signRef × MIN_ABS, tidak terbalik, tidak membesar lagi seberang).
    Dan PELAJARAN VERIFIKASI TERPENTING: unit test clamp STATIS (kuset
    scale langsung) LULUS padahal drag nyata GAGAL — verifikasi fitur
    interaksi WAJIB mensimulasikan jalur aslinya (rumus library yang
    dibaca dari source +jalur app per frame), bukan fungsi terisolasi.
    Sintesis pointer event utk TransformControls TIDAK menyalakan drag
    internal — pakai replika rumus yang dibaca dari source library.
    KALAU USER bilang "masih bug" padahal unit testmu lulus: unit
    testmu yang salah jalur uji — jangan defensif, simulasi ulang.
25. **GIZMO BOLA SCALE BERGERAK — posisi vs bake vs factor kamera**
    (Phase 68, 2026-09-11): handle gizmo dipaksa position=worldPosition
    + scale=factor-kamera TIAP FRAME (baris 1613/1624) — menggeser bola
    hanya bisa SETELAH fungsi asli (pola wrapper Phase 52). Offset yang
    benar = UNIT×sign×distance×(|worldScale| − factor) dengan factor =
    ball.scale.x yang BARU diset fungsi asli — bake geometry IKUT
    di-scale handle, jadi tanpa −factor bola OVERSHOOT melewati tepi
    (terukur: scale-4 factor 2.057 → bola 2.53 vs tepi 2.0; vision
    menangkap "bola jauh di luar block"). worldScale live di
    controls._worldScale (baris 1143). Bola tetap bulat: geser position
    saja, jangan scale non-uniform. Harness mini TransformControls
    WAJIB set gizmoRoot.mode (properti gizmo, bukan tc) — tanpa itu
    wrapper blok-nya silent-skip.
26. **GAP GIZMO DEPAN SISI — perspektif mempersempit sisi dekat**
    (Phase 68 v2, 2026-09-11, user "bola kedeketan seperti menyatu"):
    offset v1 menaruh bola TEPAT DI PERMUKAAN sisi (gap 3D = 0) → nempel.
    WAJIB gap eksplisit (BALL_GAP) di luar tepi. Jebakan ukur: gap 3D
    simetris TAPI proyeksi kamera mempersempit sisi-dekat (0.35 unit →
    cuma 5px visual di sisi menghadap kamera, 30-40px di sisi jauh) —
    jangan menyetel gap dari 1 baris pixel saja; uji MINIMAL sisi
    dekat, dan pilih nilai yang sisi-dekatnya masih jelas (0.55 final).
    Verifikasi gap: scan pixel MULTI-BARIS (bola beda sumbu di baris
    beda) + vision rating keterpisahan.
27. **MENGGESER ELEMEN GIZMO = WAJIB GESER VISUAL + PICKER SENAMA**
    (Phase 68 v3, 2026-09-11, bug user "klik bola tak bisa tapi kursor
    ke pusat block mendadak bisa"): picker/hitbox bake DI GEOMETRY
    TERPISAH dari visual — menggeser mesh visual TIDAK menggeser
    hitbox. ATURAN: tiap elemen gizmo yang digeser, cari picker
    senama (nama sumbu + sisi via boundingBox center) dan geser
    dengan kompensasi selisih bake (center world picker = center
    world visual). 2 trap menyertai: (a) AXIS_HIDE_THRESHOLD 0.99
    menyembunyikan handle menghadap kamera + scale 1e-10 — untuk
    elemen BOLA pulihkan visible+scale SETELAH fungsi asli (dan
    jangan baca factor kamera dari elemen yang sedang di-hide);
    (b) harness mini TransformControls WAJIB mensimulasikan reset
    position picker per frame (loop handles baris 1601/1613) —
    tanpa itu offset menumpuk dan tes FAIL palsu.
28. **TEKSTUR POLOS × WARNA MATERIAL utk desain visual berulang**
    (Phase 69, 2026-09-11, desain tengah bola gizmo): tiru STRUKTUR
    referensi TANPA meniru warna → gambar texture PUTIH+alpha (canvas:
    pattern/diamond glow + titik gelap) sebagai `map`; warna identitas
    tetap dari material.color (map dikali color). Texture SHARED 1x
    cache — hemat memori; grid pattern 3x3 supaya tiap sisi menghadap
    user selalu menampilkan 1 pattern dominan. Untuk elemen yang
    material-nya di-SHARE (rotate bola share materialLib): buat material
    BARU per elemen, copy warna SEBELUM frame pertama (cache _color
    kontrak #5 menyimpan warna asli → highlight hover tetap bekerja
    karena library men-copy active.color LANGSUNG ke material), dan
    WAJIB dispose() di cleanup (tidak lagi share).
    Outline hover per-tool (scale=oranye #f59e0b, paint=putih/warna
    user, delete=merah): pola highlightBlock(block, mode) — cabang
    mousemove per tool, mousemove TIDAK diblokir saat gizmo attach
 (tidak ada guard) → outline muncul walau block sudah terpilih.
 29. **SPRITE CHILD MESH BAKE-GEOMETRY — posisi child = space GEOMETRY,
 bukan dunia** (Phase 69 v2, 2026-09-13, commit 51a066e): bola gizmo
 diposisikan via geo.translate() (jejak kontrak: position ditimpa tiap
 frame → bake ke geometry) → mesh.position=(0,0,0) adalah ORIGIN GIZMO,
 BUKAN pusat bola. Sprite child di (0,0,0) = kristal nangkring di pusat
 block (6 kristal numpuk, offset terukur 0.55 = distance bake). CARA
 BENAR: pusat objek bake = pusat BBOX GEOMETRY ((max+min)/2) — hitung
 di attach, jangan percaya mesh.position. Butir 28 di atas (texture
 PUTIH+alpha sebagai map bola) SUPERSEDE untuk kasus bola: user 2026-09-12
 koreksi "bukan texture map permukaan — jadi titik hitam 6 sisi; yang
 benar SATU kristal 2D DI DALAM perut bola" → THREE.Sprite billboard
 (selalu menghadap kamera) child bola, material depthTest/Write false +
 toneMapped false, renderOrder 1001 > bola 1000.
 30. **renderOrder Infinity vs Infinity = TIEBREAK material.id — TIDAK
 deterministik** (Phase 69 v2): gizmo library set renderOrder=Infinity
 (TransformControls baris 1541) — sprite child bola juga butuh
 dirender SETELAH bola; dua Infinity di-sort via material.id (mesh vs
 sprite bisa bolak-balik). CARA BENAR: pasang pasangan eksplisit
 deterministik (bola 1000 < kristal 1001) — urutan ascending renderOrder
 DIJAMIN painterSortStable (opaque) & reversePainterSortStable (transparan,
 tiga.module.js 8112/8142: groupOrder → renderOrder → z → material.id).
 Cek dulu renderOrder scene lain (sprite aura block = 3) supaya tidak
 tabrak.
 31. **KODE WARISAN SESI MATI = WAJIB AUDIT RED SEBELUM DIPERCAYA**
 (Phase 69 v2, pelajaran lintas-sesi): sesi sebelumnya mati kena 429
 di tengah tugas (context 795K token) — kode sudah ditulis tapi
 TIDAK PERNAH diverifikasi (server test bahkan belum dijalankan).
 Ditemukan 3 bug nyata di kode warisannya: sprite offset 0.55,
 konstanta outline 0.045 (3x lebih tipis dari tampilan disetujui),
 renderOrder Infinity dobel. ATURAN: menerima tugas "lanjutkan sesi
 mati" = tulis RED test untuk SEMUA asumsi kode warisan DULU;
 "sudah ditulis ≠ sudah benar". File .git status modified tanpa commit
 terakhir = tanda kerja setengah jalan.
 32. **KONSTANTA DESAIN YANG SUDAH DISETUJUI USER = DIKUNCI SAAT REFACTOR**
 (deleteWireframe v4, 2026-09-13): user setujui outline 13% (v3,
 verifikasi vision 5/5). Saat refactor UV→world-space, sesi mati
 memilih 0.045 unit "kira-kira" = 3x LEBIH TIPIS dari tampilan
 disetujui. KONVERSI yang benar: 13% × wajah block standar 1x = 0.13
 unit dunia — jaga NILAI VISUAL, bukan angka acak. Tes asersi harus
 mengunci nilai (FRAME_WORLD_WIDTH === 0.13).
 33. **Pitfall tes attachPaintedFrame (idempoten 1-frame-per-block)**
 (Phase 69 v2): attach warna B ke block yang SUDAH ber-frame warna A
 = mengembalikan frame A (guard by design, cache key per warna) —
 asersi "warna B terpasang" = FAIL PALSU. Gunakan block BARU atau
 detach dulu. Catatan warna delete: normalisasi cache key
 (getHexString clamp) membuat multiplyScalar(4) efektif netral —
 warna efektif #ff0a0a murni, IDENTIK v3 committed; dibiarkan.
 34. **Token GitHub di .env bisa EXPIRED berurutan** (2026-09-13): ghp_
 pertama (24-char) → 401 Bad credentials; kedua (40-char) aktif.
 Verifikasi push wajib GitHub API — kalau 401, cek token berikutnya
 kedua di .env (ada 2), jangan langsung anggap push gagal.
 35. **PMREM/envMap DALAM MODULE UTILS BUTUH RENDERER** (Phase 70,
 2026-09-13, f48a53b): module material tidak punya renderer saat
 load — pola benar: setXxxRenderer(renderer) di-wire dari init
 scene app (BlockSimulator3D setelah new WebGLRenderer). RoomEnvironment
 stock = langit-langit putih SERAGAM → refleksi flat "washed out"
 (vision 2/10) — envMap KONTRAS custom (ruang gelap + PANEL TERANG
 besar hangat, PlaneGeometry MeshBasic HDR toneMapped:false, PMREM
 fromScene) = hotspot kilau terlihat DALAM wajah. Kalibrasi terukur:
 panel kecil (4x3, intensity 6) → gold GELAP avg 128; panel besar
 (12x8, intensity 24) → 223. Solid angle panel harus dominan.
 36. **METALNESS TINGGI MEMATIKAN TEXTURE** (Phase 70): metalness 0.95
 = refleksi murni, diffuse map nyaris nol → gold jadi "plastik
 kuning solid TANPA texture" (vision) padahal user bilang "teksturnya
 sudah benar" = wajib terlihat. 0.7 = kilau refleksi + texture masih
 hidup. Dan emissive baseline MENURUNKAN kontras kilau (terukur rasio
 max/min 1.18→1.35→emissive 0) — logam berkilau = kontras, bukan
 terang rata.
 37. **IMPORT PATH 'three/addons/*' HANYA UNTUK BUNDLER** (Phase 70):
 eksis via package.json exports — harness importmap browser TIDAK
 membacanya (404, halaman kosong 3.9KB). Selalu import via
 'three/examples/jsm/*' — resolve di Vite DAN harness. Deteksi cepat:
 screenshot 3-4KB = import gagal; error-trap window.addEventListener
 'error' → dump ERR: ke DOM = diagnosis tercepat headless.
 38. **MODUL POLA-PARAMETER-THREE (TANPA import THREE)**: fungsi internal
 JANGAN pakai `new THREE.Color(...)` — ReferenceError saat runtime
 (tertangkap error-trap). Pakai metode objek milik material:
 mat.emissive.set(hex). blockMaterials.js memang pola THREE-lewat-
 parameter — cek pola modul SEBELUM menulis kode internal barunya.
 39. **PIXEL-CHECK BOLA GIZMO — 4 JEBAKAN SEKALIGUS** (Phase 70): (a)
 radius proyeksi ≠ radius pixel — gizmo di-scale factor kamera,
 ukur radius disk dari DUMP RGB nyata (bola murni 24px terukur);
 (b) KRISTAL putih pusat bola = elemen SAH — jangan dihitung
 "garis asing" (klasifikasi saturasi: putih/abu sat<0.25 = sah);
 (c) cincin SENAMA menempel bola → pengukuran radius sinar melebar
 sampai cincin (R=39 padahal 12) — pakai nilai dump; (d) koordinat
 bola dari bbox GEOMETRY (posisi bake) × matrixWorld — getWorldPosition
 mesh position=0 = origin GIZMO, bukan pusat bola (warisan #29).
 40. **REGRESI renderOrder ANTO-GIZMO** (Phase 70, pelajaran penting):
 mengubah renderOrder SATU elemen gizmo (bola 1000 utk kristal)
 MENGUBAH urutan relatif SEMUA elemen lain yang tetap Infinity
 (cincin library baris 1541) — cincin yang dulu "kalah tiebreak
 material.id" kini MENANG dan nembus bola. ATURAN: setelah ubah
 renderOrder elemen gizmo mana pun, AUDIT semua elemen visual
 tetangga di mode itu (bola/cincin/kristal/panah) — pasang urutan
 eksplisit penuh (999 cincin < 1000 bola < 1001 kristal).
 41. **KALIBRASI BRIGHTNESS: TARGET = WAJAH DEPAN REFERENSI, BUKAN AVG
 GAMBAR PENUH** (Phase 70 v2, b98baee, 2026-09-13): user bilang hasil
 v1 "terlalu terang = MELAWAN DATASET". Akar: target v1 kupakai avg
 luminance SELURUH gambar tampak3D (termasuk wajah atas paling terang
 yang terkena cahaya langsung) → membiaskan +60%. Target benar =
 luminance WAJAH DEPAN referensi (obsidian 69.1, fabric 51.5, coal
 58.0). Kalibrasi gamma via model empiris display≈a·v^(1/γ) 2 titik
 per block: obsidian γ3.0, fabric γ3.5, coal γ5.0 — hasil +2..3%.
 DAN: saturasi dataset = IDENTITAS (coal kebiruan dataset SAH —
 desat 0.2 v1 = melawan dataset, dicabut).
 42. **RADIAL CANVAS → UV SPHERE = LINGKARAN DI EQUATOR, BUKAN RADIAL
 DARI PUSAT PANDANGAN** (Phase 70 v2, kegagalan JENIS ke-2 setelah
 Phase 69 v1 "titik hitam 6 sisi"): memetakan tekstur radial ke UV
 SphereGeometry menghasilkan lingkaran konsentris di sekitar garis
 equator — dari sudut pandang kamera tampak "directional shading
 flat" (vision 3/10), bukan permata menyala dari pusat. Glow yang
 harus menghadap kamera dari SEMUA arah WAJIB SPRITE BILLBOARD
 (pola aura neon Phase 65) — mesh hanya backdrop gelap (identitas ×
 0.18). Struktur bola permata final: mesh 1000 < gem sprite
 AdditiveBlending 1001 < kristal 1002 (cincin 999).
 43. **attachXxx YANG MENGUBAH material.color DILARANG MEMBACA IDENTITAS
 DARI MATERIAL YANG SAMA** (Phase 70 v2, bug terukur): bola scale
 SHARE material antar pasangan ±X/±Y/±Z — attachGemOverlay v1 baca
 identitas dari ball.material.color lalu menggelapkannya → bola
 KEDUA dari tiap pasangan membaca warna yang SUDAH ×0.18 → gem pudar
 (pixel: hanya 3/6 bola menyala). ATURAN: fungsi pemasang efek yang
 memodifikasi material WAJIB terima identitas sebagai PARAMETER
 EKSLISIT (identColor), jangan pernah baca-tulis material yang sama.
 Node test khusus shared-material mencegah regresi.
 44. **ASERSI WARNA THREE.JS = LINEAR, BUKAN sRGB** (Phase 70 v2):
 THREE.Color('#EFBF04').r = 0.8632 (sRGB→linear transfer), bukan
 239/255=0.937 — asersi angka manual sRGB = FAIL palsu. Selalu
 bandingkan terhadap konversi THREE.Color sendiri (new
 THREE.Color('#hex') sebagai referensi), bukan aritmetika manual.
 45. **CANVAS RADIAL GRADIENT CLAMP STOP TERAKHIR KE AREA LUAR RADIUS**
 (Phase 70 v3, a32b312, 2026-09-13): stop alpha terakhir (0.13 di
 r=SIZE/2) di-CLAMP ke SELURUH area canvas di luar radius — sprite
 quad = 4 SUDUT bercahaya samar = "bayangan kotak" di sekitar bola
 (laporan user, terukur 2/8 diagonal luar disk lum 79-84 vs bg 17;
 awalnya user ragu "halusinasi saya?" — GEJALA NYATA). ATURAN: sprite
 radial WAJIB (a) ctx.beginPath+arc+ctx.clip() LINGKARAN sebelum
 fill, (b) stop 1.00 = alpha 0 (fade ke nol di siluet), bukan nilai
 sisa.
 46. **TANGENT/VEKTOR DRAG DARI STATE-OBJECT-YANG-SEDANG-DIUBAH = ARAH
 FLIP MID-DRAG** (Phase 70 v3, laporan user "asik rotate tiba-tiba
 ke kiri malah ke kanan"): tangent rotate dihitung dari
 worldQuaternion TIAP FRAME — object dirotasi terus selama drag →
 quaternion berubah → pada rotasi ~90° tangent FLIP TANDA →
 dot product berbalik → objek berputar MELAWAN kursor (probabilistik:
 muncul hanya di drag panjang — "kadang"). ATURAN: vektor referensi
 gesture WAJIB DI-FREEZE di langkah pertama gesture (init block),
 reset di pointerUp; jangan pernah dibaca live dari objek yang
 dimodifikasi gesture itu sendiri. Patch pendamping: definisikan
 variabel lokal SEBELUM blok yang memakainya (TDZ — patch pertama
 latent ReferenceError).
 47. **ELEMEN DESAIN "KECIL" = KALIBRASI KE PIXEL LAYAR, BUKAN HANYA
 RASIO REFERENSI** (Phase 70 v3): dot pusat kristal 0.022×texture =
 0.78px pada bola layar 57px = SUB-PIXEL tak terbaca meski rasio
 benar vs referensi (bola referensi 322px di-zoom penuh). Iterasi
 terukur: 0.022 → 0.040 masih 0.78px — sub-pixel; 0.045 + sprite
 17%→22% = ~1.5px TERBACA (vision konfirmasi). ATURAN: elemen kecil
 WAJIB diuji pada ukuran layar NYATA app, hitung px-akhir-nya,
 minimum ~1.5px agar tidak lenyap.
 48. **VERIFIKASI VISION WAJIB SIDE-BY-SIDE DENGAN REFERENSI**
   (Phase 70 v4, d3a60f7, 2026-09-13 — LARANGAN USER "dilarang menebak
   pakai pixel, WAJIB vision Google"): klaim "lulus vision" dari zoom/
   close-up TERISOLASI = LULUS PALSU — v3-ku divonis benar oleh vision
   zoom tunggal, lalu divonis SALAH TOTAL oleh compare berdampingan
   dengan referensi (diamond bahkan tak terlihat). ATURAN: verifikasi
   desain visual = COMPOSITE KIRI(referensi)+KANAN(hasil) dalam satu
   gambar, tanya vision BEDA apa saja secara eksplisit; iterasi sampai
   vision bilang konfirmasi; skor per ronde dicatat (9 ronde v4:
   3→7.5→5.5→6→6.5→6.5→6.5→8.5→9.5).
 49. **DUA SPRITE OVERLAP = HUE SHIFT TAK TERKENDALI** (Phase 70 v4,
   terukur): komposisi gem AdditiveBlending + kristal NormalBlending di
   posisi sama = kanal G melambung (pixel 253,186,41 = kuning murni
   padahal tint #FF7A1A oranye) — tint apapun kalah oleh penumpukan,
   hue hasil SELALU geser kuning/brass (7 ronde vision gagal karena
   ini). SOLUSI: desain glow = SATU sprite, SEMUA elemen (rim + halo
   + diamond + titik) digambar LANGSUNG warna final di canvas, nol
   tint runtime = nol hue-shift; NormalBlending; identitas tool via
   blend ringan Color.lerp (0.38) bukan tint penuh.
 50. **TRANSFORMCONTROLS TIDAK MERESAH rotationAngle ANTAR SESI DRAG**
   (Phase 70 v4, bug "menggila 360°"): library hanya menulis
   rotationAngle di pointerMove (baris 706+) — TIDAK ada reset di
   pointerDown (init 0 hanya di konstruktor baris 375). Override
   kumulatif (prevRawAngle+delta) yang baseline-nya dari this
   .rotationAngle = mewarisi sudut BASI sesi sebelumnya → drag baru
   melompat/menggila, "kadang kembali kadang tidak". FIX: baseline = 0
   di blok init drag + reset _dragAngleInit di pointerUp (pose start
   aman di _quaternionStart yang memang diset library per pointerDown).
   51. **MESH GIZMO "BACKDROP" TETAP DIRENDER = BOLA DOBEL**
   (Phase 70 v5, 7dc61a5, 2026-09-13, laporan user "ada bola lain kuning
   di belakang, lebih besar, muncul sejak awal; saat hover DIA yang
   kuning"): mesh sphere backdrop bola gizmo (#6b3007) ikut dirender —
   sphere di-scale FACTOR KAMERA per frame tampak lebih besar dari disk
   sprite orb = bola kedua; hover library menimpa materialnya kuning
   (baris 1884) = "bola belakang" yang menyala. CARA BENAR sembunyikan
   mesh interaktif: material.visible = false — TIDAK dirender TAPI
   TETAP KE-REYCAST (terbukti Raycaster test; opacity 0 juga kena) —
   picker & hover axis detection tetap hidup.
   52. **HOVER TINT PER-OBJEK MENUNTUT MATERIAL UNIK PER-OBJEK**
   (Phase 70 v5): material orb yang di-cache SHARED (per warna) →
   hover men-tint satu = SEMUA bola sewarna ikut kuning. Texture tetap
   boleh shared 1x (hemat), material WAJIB clone per-objek. Pola
   hover-orb: applyOrbHover(balls, tc.axis, tc.dragging) dipanggil
   dari wrapper updateMatrixWorld SETELAH fungsi asli; tint rest
   disimpan sprite.userData.__restTint; pulih tiap frame.
   53. **PATCH HAPUS-DUPLIKAT WAJIB DIFF-CHECK BLOK TETANGGA**
   (Phase 70 v5, nyaris fatal): saat menghapus call applyOrbHover
   duplikat, old_string-ku terlalu panjang sampai menelan blok
   world-align Phase 52 (fitur lain yang jalan!) — terhapus.
   KETANGKAP karena node --check + verifikasi diff sebelum commit,
   langsung dipulihkan. ATURAN: sebelum commit apa pun setelah patch
   penghapusan, `git diff | grep "^-"` — pastikan baris yang hilang
   HANYALAH yang memang dituju; JANGAN patch berbasis snippet parsial
   tanpa membaca konteks penuh file.
   54. **OFFSET HANDLE GIZMO WAJIB SATU FRAME REFERENSI DENGAN BAKE**
   (Phase 70 v6, ae69399, 2026-09-13, laporan user "posisi bola scale
   sangat aneh saat block miring"): bake geometry bola dirotasi
   worldQuaternion block (mode scale dipaksa local, baris 1585) —
   TAPI offset position menambah arah SUMBU DUNIA = campur 2 frame
   → bola nyasar + drift lateral (RED: err 0.21-0.39, lateral 0.73).
   FIX: offset = axisLocal × worldQuaternion (sumbu block di dunia,
   live per frame); picker cone senama ikut (warisan #27). Gap di-
   kompensasi factor kamera (GAP/factor). GREEN 6/6 err 0.000.
   55. **VERIFIKASI POSISI GIZMO = 3 LAPIS + WASPADA FALSE VISION**
   (Phase 70 v6): vision 2x salah klaim ("bola nyasar" — ternyata
   blob TEKSTUR batu oranye; "1 bola melayang di atas balok kayu" —
   ternyata bola X+ block batu yang memang tinggi di layar karena
   block miring, posisi world ideal). Bukti penentu = PROYEKSI EKSAK
   runtime (posisi screen tiap bola dari data 3D) dicocokkan ke blob
   pixel: 6 bola = 6 blob, NOL bola ke-7. ATURAN: posisi gizmo
   diverifikasi vektor (probe Node) + proyeksi eksak → pixel cocok;
   vision hanya konfirmasi arah/orientasi (sejajar rusuk block),
   klaim "nyasar" vision WAJIB dibuktikan dengan proyeksi eksak
   sebelum dijawab dengan kode. DAN: server test file bisa tertimpa
   proses lain — selalu `curl -s url | grep title` SEBELUM percaya
   screenshot (2x kejadian sesi ini: file lama ter-serve → verifikasi
   total menyesatkan).
   56. **TEXTURE TURUNAN (DERIVED) = UBAH KARAKTER TANPA SENTUH LOCK**
   (Phase 70 v7, 81ec000, 2026-09-13, laporan user "bola rotate
   warnanya KEBALIK — dalam harus GELAP, kulit MENTOK warna; design
   bentuk DILARANG DIUBAH"): texture orb dipakai 2 gizmo dgn profil
   luminance berlawan kebutuhan (scale: tepi gelap→inti terang;
   rotate minta KEBALIKANNYA). Solusi: getOrbInvTexture() TURUNAN
   canvas — salin canvas LOCK → getImageData → balik luminance per
   pixel dgn FLOOR (inv = 80+(255−lum)×0.72: inti 245→87 gelap
   BUKAN hitam-total agar tetap "merah gelap" saat di-tint; tepi
   51→227 hampir penuh) → ALPHA/SILUET TIDAK DISENTUH (bentuk
   design 100% identik) → CanvasTexture baru. Seleksi via identMix:
   >= 1.0 (rotate) = invers, 0.38 (scale LOCK) = texture asli —
   test Node memastikan getImageData TIDAK dipanggil utk scale.
   ATURAN: kebutuhan visual berbeda antar tool dari texture sama =
   buat TURUNAN canvas, JANGAN ubah asli; modifikasi pixel di rumus
   (bukan gambar ulang) = reproducible & Node-testable.
   57. **INVERSI/TURUNAN TEXTURE UNTUK TINT MULTI-WARNA WAJIB
   GRAYSCALE MURNI** (Phase 70 v8, fa43a94, 2026-09-13, 3 komplain
   user: "dalam HITAM harusnya merah TUA; hijau KURANG MAKSIMAL;
   biru GELAP BANGET"): inversi v7 mempertahankan rasio channel
   texture amber (R tinggi/G sedang/B rendah) → tint per warna
   mengambil 1 channel: merah untung mentok, hijau ~138/255
   (pudar), biru ~46/255 (gelap) — KEKUATAN WARNA TIDAK ADIL antar
   tint. FIX: hasil invers R=G=B=inv (grayscale murni) — semua tint
   identik kuat (terukur 204/209/212); floor "gelap" yang diminati
   user = 120-140/255 (TUA kaya), BUKAN <90 (tampak hitam): inti
   245→127. ATURAN: turunan texture yang akan di-tint berbagai
   warna WAJIB dinetralkan grayscale; nilai "gelap" estetik diuji
   angka (bukan kira-kira) — <90 = hitam bagi mata, 120-140 = TUA.
   58. **"GELAP ESTETIK" ITU RELATIF KONTRAST SEKITAR** (Phase 70 v9,
   af63cc4, 2026-09-13, laporan user "dalam masih HITAM padahal
   v8 sudah 127"): 127 sendirian memang "TUA", tapi ditempel kulit
   terang 252 → persepsi mata jadi HITAM (kontras lokal). Kalibrasi
   final terukur: area gelap yang harus TERLIHAT SEBAGAI WARNA di
   sebelah area terang ≥ 155-160/255. Pola fix presisi: Math.max(
   160, rumus-lama) — otomatis HANYA mengangkat pixel gelap; pixel
   terang (kulit) nilainya sudah >160 → NOL PERUBAHAN pada area
   yang sudah diverifikasi user (jaga LOCK pasca-verifikasi).
   Catatan: titik marker pusat bola sengaja dibiarkan gelap — itu
   bagian design LOCK, jangan dianggap bug saat pixel-scan.

 ════════════════════════════════════════════════════════════════════
 ATURAN MUTLAK #10 — ROTASI API KEY VISION (PERINTAH USER 2026-09-13,
 "INI KESALAHAN FATAL! TIDAK ADA Pengecualian!! MENGikat SEMUA AI")
 ════════════════════════════════════════════════════════════════════
 USER: "Saya sudah capek capek sediakan 3 key tambahan kok gak
 dipakai?! Jika key 1 abis total, sistem WAJIB MENGARAHKAN DENGAN
 PAKSA AI untuk SEGERA memakai key berikutnya DENGAN PAKSA dan
 TIDAK PUNYA IZIN UNTUK MENOLAK! Bahkan jika AI menolak, ada
 peringatan berlapis-lapis yang memaksa AI tetap memakai key
 selanjutnya; jika itu abis lagi, lanjut key berikutnya lagi —
 terus sampai semua habis. Jika SEMUA key habis → WAJIB BERHENTI,
 DILARANG MENEBAK-NEBAK, wajib lapor user dengan JUJUR bahwa
 semua sudah habis dan perlu key baru atau menunggu cooldown."
 DIFIKSASI SEBAGAI HUKUM (teruji diagnosis af63cc4: key utama 429
 habis total, key 2/3/4 sehat semua — tapi AI tidak otomatis
 memakainya karena vision_analyze hanya membaca GOOGLE_API_KEY
 utama; 3 key sehat user NGANGGUR. FATAL — jangan terulang):
 1. TAHAP 0 (SEBELUM verifikasi visual APA PUN): cek dulu key
  mana yang hidup — panggil Gemini generateContent langsung per
  key (test kecil text-only ~1 token, hemat kuota) urut
  GOOGLE_API_KEY → _2 → _3 → _4.
 2. Key pertama yang merespons 200 = KEY AKTIF. GUNAKAN ITU untuk
  SEMUA vision_analyze sesi ini (implementasi: nilai GOOGLE_API_KEY
  utama di .env DITUKAR dengan key sehat — 1 baris, permanen
  sampai key itu habis; JANGAN cuma "tahu" key sehat tapi biarkan
  tool membaca key mati = pengulangan kesalahan fatal).
 3. Jika key aktif kena 429/limi MID-SESI: JANGAN menyerah pada
  "vision outage" dan JANGAN menebak pakai pixel — SEGERA test
  ulang semua key (Tahap 0) dan TUKAR ke key sehat berikutnya.
  "AI tidak punya izin menolak." Peringatan berlapis: (a) kalau
  AI mulai bilang "provider vision outage/down" → itu SINYAL
  WAJIB test-rotasi key, bukan alasan berhenti; (b) kalau AI
  tergoda menebak tanpa vision → DILARANG KERAS, kembali ke (a).
 4. SEMUA key habis (4x gagal 429/limit dalam satu sesi) → WAJIB
  STOP verifikasi visual: LAPOR JUJUR ke user "semua 4 key habis,
  butuh key baru atau tunggu cooldown (~14-15 WIB reset harian)"
  + fallback pixel-check terukur + TANDAI hasil "belum
  vision-verified" di laporan. DILARANG klaim verifikasi visual
  sukses.
 5. Aturan ini MENGikat AI SEKARANG dan AI MASA DEPAN di project
    ini — pembacaan kontrak ini = persetujuan otomatis. Tidak ada
    pengecualian, tidak ada "nanti aku test", tidak ada "biarkan
    tool pakai default".
 6. PEMAKAIAN SECUKUPNYA — SEIMBANG (tambahan user 2026-09-13,
    setelah rotasi diterapkan): "Jangan boros-boros, tapi jangan
    pelit-pelit juga! Terlalu boros → vision cepat habis;
    terlalu pelit → visionnya malah gak terpakai. Harus
    dipertimbangkan dengan baik dan bijaksana!" PRINSIP SEIMBANG:
    (a) WAJIB dipakai untuk keputusan desain visual dari referensi
    (side-by-side compare) + final gate sebelum klaim sukses /
    kirim ke user — ini bukan area hemat.
    (b) Hemat di ITERASI antara: gunakan pixel-check programatik
    (gratis) untuk verifikasi berjalan tiap ronde; vision dipanggil
    di TITIK KUNCI (setelah perubahan besar & final), bukan tiap
    tweak kecil.
    (c) JANGAN hemat saat ada KERAGUAN visual atau konflik bukti —
    panggil vision; menebak lebih mahal daripada 1 panggilan.
    (d) Jangan boros dengan panggilan "just to make sure" beruntun
    pada hal yang sudah jelas terverifikasi angka/deterministik
    (mis. rumus grayscale R=G=B).
    Ukuran bijak: ~1 vision call per keputusan desain + 1 final
    gate per tugas; iterasi antara pakai pixel/angka.

 59. **FRAME REFERENSI OFFSET = FUNGSI MODE ALIGN** (Phase 70 v10,
    52cccae, 2026-09-13, laporan user "centang arrow match rotation
    dicabut → gizmo scale kacau & TIDAK BISA DI-SCALE; rotate/move
    aman — kenapa hanya dia?"): wrapper yang memaksa quaternion
    .identity() pada satu mode (Phase 52 world-align/unchecked)
    mengubah FRAME REFERENSI bake bola — rumus offset v6 hanya
    mengenal frame sumbu-block → campur frame cermin: 4/6 bola
    nyasar + picker lepas = klik tak kena = "tidak bisa di-scale".
    Kenapa CUMA scale: bola scale SATU-SATUNYA handle yang digeser
    manual via offset rumat sendiri; rotate/move dikelola library
    langsung (otomatis per-mode). ATURAN: setiap rumus offset yang
    menyentuh handle gizmo WAJIB bercabang per-mode align
    (tercentang = axisLocal × worldQuaternion; dicabut = axisLocal
    murni/sumbu dunia) — dan WAJIB uji KEDUA mode setiap kali
    offset disentuh (bug v6 & v10 = pasangan cermin; satu GREEN
    mode tidak cukup).
 60. **TELEGRAM sendPhoto PNG BESAR BISA GAGAL 3x SILENT**
    (Phase 70 v10): PNG 63KB ditolak 3x (HTTPError tanpa body di
    attempt-loop) — kompres ke JPG thumbnail 640px ~13KB = lolos
    instan. ATURAN: kalau sendPhoto gagal 2x, jangan ulang PNG
    sama — konversi JPG quality 85 + thumbnail dulu.

 61. **PEMBAGIAN OLEH FACTOR KAMERA ∝ SIZE = LEDAKAN SAAT MENGECIL**
    (Phase 70 v11, 7332b00, 2026-09-13, laporan user "hitbox KADANG
    lenyap padahal visual aman"): BALL_GAP/factor meledak saat block
    di-scale mengecil — factor ∝ size: size 0.01 → offset 110 unit
    → bola & picker cone terlempar → hitbox lepas dari klik.
    "Kadang" = non-linear: statis normal (probe 2 kamera 0 issue),
    mid-drag ekstrem meledak. ATURAN: (a) semua offset berbasis
    factor kamera WAJIB clamp minimum sebelum pembagian
    (Math.max(factor, 0.35)); (b) uji ekstrem KECIL bukan hanya
    besar — bug hidup di arah yang jarang diuji; (c) gejala
    "kadang hilang pasca-scale" = periksa dulu fungsi 1/f dalam
    rumus offset sebelum menuduh AXIS_HIDE.
 62. **KOMPENSASI SELISIH BAKE ANTAR-HANDLE WAJIB ×FACTOR KAMERA**
    (Phase 70 v12, 611c803, 2026-09-14, laporan user "masih bandel —
    cuma 2 bola bisa dipencet, hitbox kabur"): offC lama = off + 0.2
    MENTAH — padahal bake cone (0.3) & bola (0.5) DI-SCALE FACTOR di
    ruang dunia (library baris 1627: handle.scale = f×size/4) → selisih
    dunia = 0.2×f, konstanta lokal hanya benar di f=1 (tidak pernah:
    f terukur 1.6-17.4). Akibat: cone menumpuk di PUSAT block (terukur
    cone 0.07 vs bola 0.64 @f=3.88; along 1.54 @f=8.69) — klik bola X−
    kena picker Z. Kenapa v10-v11 "lulus" tes: probe kameranya DEKAT
    (f kecil, geometri hampir f=1) = FALSE-PASS. ATURAN: (a) setiap
    koreksi selisih bake/posisi antar-handle gizmo WAJIB dihitung di
    ruang dunia (×factor) atau relatif terhadap handle lain yang sudah
    di-scale; (b) probe wajib mencakup kamera JAUH (f besar) — bug
    geometri gizmo hidup di sana; (c) verifikasi cone = along/lateral
    presisi vs bola, bukan sekadar "raycast kena".
 63. **OVERRIDE QUATERNION VISUAL WAJIB DIKUTI PICKER SENAMA + SCALE
    PICKER MENGALIHKAN CENTER** (Phase 70 v12): saat unchecked, bola
    dipaksa quaternion.identity() (sumbu dunia) tapi cone TIDAK —
    fungsi asli baris 1743 men-set cone.quaternion = worldQuaternion
    block TIAP FRAME → dua frame campur → lateral terukur 0.82-2.26
    saat block dirotasi 45-60°; rotasi sekitar Y menyisakan Y+ Y−
    satu-satunya selaras = persis gejala user "cuma 2 bola bisa
    dipencet". Dan scale picker (×0.3 anti-ray-menelan) MENGUBAH bake
    efektif 0.3→0.09 → offC wajib pakai bake EFektif, bukan bake asli
    (tanpa ini cone berselisih 0.21×f ke sisi BERLAWANAN — terukur
    along −1.63 @f=7.76, tertutupi proximity picking = setengah fix).
    ATURAN: setiap override frame/visual handle WAJIB direplikasi ke
    picker senama; setiap perubahan scale picker WAJIB diikuti hitung
    ulang bake-efektif di rumus offset.
 64. **CONE BAWAAN GEMUK MENELAN RAY ANTAR-BOLA — PICKING PROXIMITY
    LAYAR = SOLUSI TERBUKTI** (Phase 70 v12): cone bawaan r0.2/bentang
    0.6 ×factor = r1.55/bentang 4.66 world @f=7.76 (2.7× radius bola)
    — apex di sisi jauh block + badan gemuk menelan ray ke bola sisi
    lain (ray ke X− menembus cone Z+ duluan). SOLUSI 2 lapis: (a)
    kecilkan cone ×0.3 (bentang 1.4 ≈ inti bola), (b) PICKING
    PROXIMITY LAYAR pola gizmoRotateRings.findBallNearPointer (3
    tahun jalan di bola rotate, SKILL threejs-control-monkeypatch):
    override pointerHover + pointerDown INSTANCE — proyeksikan 6 bola
    ke NDC; pointer ≤0.08 dari bola yang USER LIHAT = paksa axis bola
    itu; raycast cone jadi fallback. pointerDown paksa SEBELUM orig
    (axis final saat drag mulai). dispose() lepas override (cek
    identitas). VERIFIKASI penuh: Node 9/9 (along/lateral 0.00) +
    GPU nyata PointerEvent DOM asli 72/72 (hover→down→drag→up, drag
    mengubah scale HANYA di sumbu bola itu) + vision bersih.
 65. **TEST MODEL GEMINI UNTUK ATURAN #10 WAJIB PAKAI NAMA MODEL
    AKTIF** (Phase 70 v12): skrip test key v1 memanggil model
    "gemini-2.5-flash" → HTTP 404 SEMUA key (model tak ada, mirip
    "mati") — bukan 429. Model vision aktif sesi ini:
    gemini-3-flash-preview → 200 semua 4 key. ATURAN: sebelum menyalakan
    protokol rotasi #10, pastikan test memakai NAMA MODEL yang benar
    (cek auxiliary.vision di config.yaml) — 404 = salah nama model,
    429 = kuota; jangan tertukar kesimpulan.
 66. **BIDANG DRAG SUMBU VERTIKAL DEGENERATE DI ELEVASI TINGGI —
    DRAG RUANG LAYAR DGN ANCHOR TER-LEBAR** (Phase 70 v13, 5062d9d,
    2026-09-15, laporan user "drag ke atas malah scale ke bawah /
    melawan arah / super licin / berat; klik bola bawah malah yang
    atas aktif; garis datar aman"): bidang drag sumbu Y library =
    BIDANG VERTIKAL (normal = komponen horizontal eye, baris
    1948-1957) — di |axisWorld·eye| > 0.80 (elevasi ≥ ~53°) ray
    kamera hampir sejajar bidang → titik potong meledak (terukur
    pointEnd.y = −24.3 @80°; rasio −102 s.d. −319) = licin/berat/
    melawan-arah; tanda titik potong FLIP = solo salah bola; sumbu
    datar bidangnya sehat dari atas (persis "garis datar aman").
    SOLUSI: cabang drag RUANG LAYAR aktif hanya saat degenerate —
    freeze axisProj (pusat→bola NDC) + along0 saat pointerDown
    (warisan #46), rasio = 1 + (along−along0)/anchor, ANCHOR =
    offset layar sumbu TER-LEBAR antar 6 bola. ATURAN: (a)
    normalisasi rasio layar WAJIB ke sumbu layar yang TIDAK
    ter-foreshorten (Y dari atas = 0.005 NDC → drag 56px meledak
    ×33 bila pakai al0); (b) sisi solo WAJIB dari BOLA YANG
    DIGENGGAM (pointerDown), bukan titik potong bidang (flip);
    (c) _scaleStart library basi saat plane-raycast gagal (hanya
    diisi dalam `if (planeIntersect)` L489-496) → snapshot scale
    sendiri saat down; (d) feel target: rasio konsisten lintas
    elevasi (terukur 2.22-2.24 @60-88°, sama dgn jalur sehat).
 67. **HARNESS PIXEL-VS-NDC: ARAH DRAG CAMPUR RUANG = TANDA
    TERBALIK (ALAT UKUR MENIPU KE-8)** (Phase 70 v13): fase harness
    GPU baru gagal total "keluar=0.05, balik=2.91" (terbalik)
    padahal modul benar & Node probe GREEN — akar: arah dihitung di
    NDC lalu DITAMBAHKAN ke koordinat PIXEL (y terbalik antara
    NDC↑+1 vs pixel↓+). DBG dump angka (console.log dikaitkan ke
    <pre> via hook console) membongkarnya: ptr.y=−0.14 saat
    axisProj.y=+0.018. ATURAN: (a) harness satu ruang konsisten —
    hitung arah dari 2 TITIK PIXEL (toPx kedua-duanya), atau
    murni NDC; JANGAN campur; (b) kalau GPU gagal tapi Node GREEN
    dgn rumus sama → curigai HARNESS dulu, pasang DBG dump angka
    (console.log tak ikut --dump-dom → hook ke elemen DOM);
    (c) probe DOM wajib spec asli: move=button −1 (L529 tolak
    !==−1), down=button 0 — syarat button redundan di guard
    sendiri karena dragging sudah dicek.
 68. **SISI SOLO & GRAB BOLA = STATE DARI HOVER CHAIN, BUKAN
    RAYCAST** (Phase 70 v13): proxHoverV13 menyimpan
    __v13GrabbedBall = findBallNearPointer(pointer) tiap hover
    (mode scale, tidak sedang drag); proxDownV13 membacanya SETELAH
    proxDown v12 (axis final) lalu membekukan state layar.
    Library memanggil pointerHover TEPAT SEBELUM pointerDown
    (L1047-1048) → grab selalu segar. dispose() melepas BERLAPIS
    LIFO: v13→v12→asli + WeakMap delete. ATURAN: override pointer
    bertingkat wajib diagram pemasangan + pelepasan cermin
    (hover/down/move masing-masing), dan state gesture WeakMap
    di-delete saat dispose supaya drag mati bersih.
 69. **GRADIENT VISUAL SLIDER & RUMUS KLIK WAJIB SATU ARAH
    REFERENSI** (Phase 71, 967cccd, 2026-09-15, laporan user
    "geser Color ke kuning malah pink, hijau malah biru, biru
    malah hijau; pentok atas malah teleport bawah"): hueGrad
    ColorWheelPicker menggambar kuning di fraksi 0.17-dari-atas
    padahal handlePos (rumus klik) menghasilkan value=(1−f)×360 →
    klik kuning-visual = hue 299° = MAGENTA; hijau↔biru tertukar;
    CYAN satu-satunya selamat karena titik tengah simetri cermin
    (gejala "cuma tengah yang benar" = tanda klasik inversi).
    FIX: urutan stop dibalik (atas=360 merah→magenta .17→biru
    .33→cyan .5→hijau .67→kuning .83). ATURAN: (a) tiap slider
    custom: verifikasi fraksi f visual = warna hasil handlePos(f),
    jangan percaya "gradient kelihatan bagus"; (b) simetri cermin
    membuat TITIK TENGAH lulus palsu — asersi wajib titik asimetrik
    (0.17, 0.33, 0.67, 0.83).
 70. **HUE 360 ≡ 0 LEWAT ROUND-TRIP HEX = TELEPORT THUMB UJUNG**
    (Phase 71): pentok slider hue ke PALING ATAS → value 360 →
    hsvToHex(360)=#ff0000 → rgbToHsv round-trip h=0 → thumb fraksi
    1.00 = TELEPORT ke ujung bawah (terukur). FIX: clamp
    Math.min(v, 359) di onHueChange — 359° → #ff0004 → round-trip
    h≈359 → thumb diam. ATURAN: nilai siklik (hue, sudut) yang
    melewati representasi diskrit (hex/derajat) WAJIB diuji di
    KEDUA ujung batas (0 & max) — bug wrap hidup di boundary,
    bukan tengah.
 71. **HARNESS REACT CANVAS = onMouseDown MouseEvent, BUKAN
    POINTEREVENT** (Phase 71): canvas slider ColorWheelPicker
    memasang handler React onMouseDown/onTouchStart — dispatch
    PointerEvent sintetis = TIDAK terjadi apa-apa (sink diam,
    currentHex tak berubah, semua tes "klik tak kerja" FAIL
    palsu seragam). Deteksi cepat: semua hasil tes identik dgn
    warna awal = event tak sampai, bukan bug mapping. ATURAN:
    baca dulu atribut handler elemen (onMouseDown vs
    onPointerDown) sebelum menulis dispatch harness; mousedown
    saja cukup untuk React (setDrag+handlePos jalan di handler
    itu), mouseup dispatch ke window.

 ════════════════════════════════════════════════════════════════════
 STANDAR PENGUKURAN "STUDS" (USER 2026-09-15 — MUTLAK, SELAMANYA)
 ═══════════════════════════════════════════════════════════════════
 USER: "disini pengukuran kita wajib pakai studs... 1 block biasa
 dianggap lebar panjang dan tinggi 2×2×2 studs, dan itu MUTLAK;
 grid yang kotak-kotak panjang-lebarnya juga sama 2×2 studs."
 ATURAN UNTUK SEMUA AI SELANJUTNYA:
 (a) SATUAN SEMUA PENGUKURAN DIMENSI DI BABFTSS = "studs" — bukan
     meter/unit abstrak.
 (b) BLOCK BIASA BELUM DI-SCALE = 2×2×2 studs (P×L×T) — konstanta
     STUDS_PER_BLOCK = 2. Block ter-scale s = 2×s studs per sumbu.
 (c) SATU SEL GRID = 2×2 studs.
 (d) UI apapun yang menampilkan dimensi block WAJIB format studs:
     default "2, 2, 2" (P, L, T).
 (e) HELPER RESMI: src/utils/blockStuds.js — STUDS_PER_BLOCK=2,
     scaleToStuds (P=x, L=z, T=y, ABSOLUT utk kaca/mirror −x),
     scaleToStudsLabel (1 desimal tanpa ".0"). Unit test:
     test_blockStuds.mjs (11 asersi). Jangan tulis konversi studs
     manual di UI — selalu import helper ini.

 72. **HEADLESS virtual-time-budget MEMBEKUKAN requestAnimationFrame**
    (Phase 72, c64bd44): komponen dgn rAF-poll tampak "tidak pernah
    update" di harness headless (--virtual-time-budget mem-pump
    timer/setTimeout, TIDAK rAF) — FAIL total padahal komponen benar
    = artefak alat ukur (ke-10). Jawaban desain sekaligus benar:
    HUD teks/angka CUKUP poll 10Hz (setInterval 100ms + tick awal
    langsung) — rAF 60fps untuk teks boros; setState hanya saat
    string berubah = nol re-render spam.
 73. **HARNESS PANEL ABSOLUTE: WRAPPER WAJIB MENIRU KONTAINER APP**
    (Phase 72): harness menaruh panel (position:absolute top:80)
    di dalam #host yang sendirinya fixed top:80 → koordinat MENUMPUK
    (80+80=160, right 16×2) = FAIL posisi palsu. Kontainer harness
    wajib inset:0 (persis kontainer app), panel yang bawa koordinatnya
    sendiri. ATURAN: sebelum menguji koordinat panel absolute, cek
    dulu apakah wrapper harness sendiri menambah offset.
 74. **PANEL SEKSI — konten pendamping tool jadi SEKSI di panel yang ADA**
    (Phase 72 v2, a5bfb16, 2026-09-15, revisi user: "scale info & gizmo
    options kok kayak punya wilayah masing-masing? lebih rapi kalau jadi
    satu"): 2 panel berdampingan (masing-masing punya background+border)
    dibaca user sebagai 2 WILAYAH terpisah. POLA BENAR: komponen
    pendamping di-refactor jadi EMBEDDED SECTION — root-nya div kolom
    polos (position:static, TANPA background/border/header sendiri) di
    dalam panel induk, dipisah divider halus; panel induk kembali ke
    koordinat tunggal (offset geser v1 top:308 dihapus, semua keluarga-5
    kembali top:80). VERIFIKASI STRUKTUR: hitung elemen ber-background
    panel di wilayah — asersi HARUS = 1 (bukan sekadar "kelihatan satu").
 75. **ELEMEN PEMISAH WAJIB MEWARISI SYARAT RENDER ELEMEN YANG
    DIPISAHNYA** (Phase 72 v3, 6026911, 2026-09-15 — cacat yang LOLOS
    dari verifikasi v2, ketemu saat audit sesi terputus): divider 1px
    dirender TANPA syarat sementara seksi info di atasnya hanya saat
    tool==='scale' → di move/rotate/clone/mirror garis MENGGANTUNG
    (terukur: divider y=122 hanya 18px di bawah header y=93 h=11,
    seksi info NIHIL), memisahkan "tidak ada apa-apa" dari baris opsi.
    FIX: bungkus divider dgn guard yang SAMA ({tool === 'scale' && ...});
    nilai visual tidak diubah sama sekali (tampilan saat scale identik
    v2 yang sudah disetujui). Vision compare 3 panel berdampingan:
    tanpa seksi info → "lebih rapi tanpa garis; garis = visual noise,
    header terputus dari kontennya"; dengan seksi info → "garis sangat
    masuk akal, memisahkan 2 kategori fungsi".
    ATURAN TURUNAN — KENAPA v2 LOLOS: harness v2 hanya menguji skenario
    tool='scale', satu-satunya kondisi yang PUNYA seksi info, sehingga
    cabang "tool lain" tidak pernah dirender saat diuji. UI BERSYARAT
    WAJIB DIUJI DI SEMUA CABANG KONDISI, bukan hanya jalur yang
    diharapkan sukses. Cek cepat: untuk tiap elemen dekoratif (divider/
    spacer/separator), tanya "kondisi mana yang membuat tetangganya
    hilang?" — lalu render kondisi itu.
 76. **AUDIT SESI TERPUTUS + `git log -1 -- <file>` BUKAN BUKTI FILE
    BERUBAH DI COMMIT ITU** (2026-09-15, FAIL PALSU alat ukur ke-11):
    memeriksa 6 file terlarang dengan `git log --oneline <sha> -1 --
    <file>` melaporkan 5 dari 6 "TERSENTUH" — padahal NOL tersentuh.
    Sebabnya perintah itu mencari commit terakhir yang menyentuh file
    ke BELAKANG dari sha, bukan isi diff sha tersebut. CARA BENAR:
    `git show --name-only --format="" <sha> | grep -qxF "<file>"`.
    Konfirmasi silang: `git log -1 --format='%h %ad' -- <file>` →
    file terlarang terakhir diubah 2026-08-30, jauh sebelum sesi.
    URUTAN AUDIT SESI MATI (API 503/429 sebelum audit akhir):
    (1) HEAD == origin/main? (2) `git add -A && git diff --cached
    --stat HEAD` lalu `git reset` (jujur thd autocrlf); (3) file uji
    nyasar ke-commit? (`git show --name-only`); (4) file terlarang via
    git show --name-only; (5) build exit 0; (6) unit test lama masih
    PASS; (7) BARU audit isi fitur — karena "sudah ter-push ≠ sudah
    benar" (warisan #31 versi lintas-sesi).


 77. **KELUHAN KETERBACAAN USER = KUANTIFIKASI WCAG, BUKAN DEBAT SELERA**
    (Phase 72 v4, 4a4cef3, 2026-09-15, user: "teksnya gak kelihatan woi
    dan sulit bacanya kaya nyatu gitu"): keluhan subjektif WAJIB diubah
    jadi ANGKA — hitung rasio kontras WCAG terhadap BACKGROUND NYATA,
    yaitu hasil KOMPOSIT ALPHA berlapis (canvas → panel rgba(14,20,32,
    0.92) = rgb(15,21,33) → kotak view rgba(30,41,59,0.45) = rgb(22,30,
    45)), BUKAN warna mentah yang tertulis di kode. Terukur: "Pilih
    block untuk scale" 2.39:1, border dashed 1.58:1 (terparah),
    "Belum ada block" 3.00:1, caption "Panjang, Lebar, Tinggi" 2.70:1,
    hint panel 3.00:1 — SEMUA di bawah ambang AA 4.5:1 → keluhan user
    TERBUKTI, bukan perasaan. Setelah #FFFFFF: 16.70-18.27:1.
    ATURAN PENDAMPING — JANGAN OVER-FIX: elemen yang SUDAH lulus AA
    jangan ikut diputihkan walau vision menyebutnya "masih redup"
    (header "GIZMO OPTIONS" 7.12:1, label "STUDS" 6.45:1, angka studs
    13.42:1, divider = dekorasi bukan teks). Hierarki visual label <
    konten wajib dijaga; user hanya mengeluhkan yang benar-benar gagal.
    Cara ukur cepat (Node/py): srgb→linear, luminance 0.2126R+0.7152G
    +0.0722B, ratio (L_hi+0.05)/(L_lo+0.05); dan di harness GPU baca
    getComputedStyle elemen TER-RENDER supaya angkanya dari piksel
    nyata, bukan dari asumsi nilai di source.
 78. **ASERSI REGEX YANG IKUT PASS DI KODE LAMA = ALAT UKUR TUMPUL**
    (Phase 72 v4): saat menjalankan RED terhadap commit sebelumnya, 2
    asersi ikut PASS padahal seharusnya FAIL — regex-nya terlalu
    longgar (mencocokkan potongan yang kebetulan ada di kedua versi).
    Tes yang tidak mendiskriminasi = tidak membuktikan apa pun.
    ATURAN: setiap asersi WAJIB diuji terhadap versi LAMA; yang ikut
    lolos harus diperketat (hitung KEMUNCULAN dengan match().length,
    atau anchor ke konteks properti lengkap), BUKAN dilonggarkan atau
    dibuang. Target: jumlah FAIL di RED ≈ jumlah perubahan nyata.

   ════════════════════════════════════════════════════════════════════
   DESIGN LOCK — ORB BOLA GIZMO SCALE (d3a60f7, DINYATAKAN USER 2026-09-13)
   ════════════════════════════════════════════════════════════════════
   USER: "ini saya nyatakan sukses dan awas DILARANG mengubah design
   sama sekali!!... warna oranye dari gizmo milik scale DILARANG
   disentuh ya itu udah perfect... nanti saya akan mengalami kerugian
   yang sangat besar jika kamu tidak hati-hati!"
   LARANGAN TOTAL untuk AI apa pun: JANGAN ubah texture orb (ballCenter
   Design.js getOrbTexture — rim/halo/diamond/titik/semua nilai rgba),
   JANGAN ubah tint scale (#EFBF04 blend 0.38 → #f9b74b), JANGAN ubah
   struktur sprite/mesh/renderOrder bola scale. Perbaikan yang DIIZINKAN
   hanya: (a) behavior hover (bola jadi kuning saat kursor dekat —
   bukan menambah bola kuning lain), (b) identitas RGB rotate (bola
   rotate WAJIB jelas merah/hijau/biru bawaan Three.js — user 2026-13:
   "bukan kuning semua"), (c) bug fix yang TIDAK mengubah tampilan
   design istirahat (rest state) bola scale. Bola rotate boleh beda
   tint-kuat (identMix 0.85) karena itu permintaan user eksplisit.

   ### WARISAN PENGALAMAN — sesi 2026-09-17 (PHASE 73: aturan scaling 4 mode)

   Konteks: tugas diwariskan dari DUA sesi yang mati kena HTTP 429 "token
   quota exceeded" (bukan kode salah) — sesi-1 mati TEPAT sebelum pernah
   menjalankan unit test-nya (context ~184.078 token), sesi-2 mati lagi
   (~170.463 token) TEPAT saat mulai uji interaksi browser. Hasil: 0 commit,
   0 push, fitur belum pernah diverifikasi end-to-end. Sesi-3 (ini)
   peran = AUDITOR + SHIPPER: kode warisan TIDAK diubah satu byte pun,
   hanya diaudit + diverifikasi + di-commit. (Pengulangan WARISAN #31.)

   FITUR (permintaan user): 4 aturan scaling (1/2/4/6 side) + modal
   "Scale Mode" oranye keemasan (design ikut modal Clear All, 6 tombol,
   tidak bisa ditutup kecuali Konfirmasi/Batal) + tombol "+" di pojok
   kiri-atas kotak studs dengan popup 4 mode beranimasi.
   Modul: src/utils/scaleModes.js (murni, THREE = parameter), 
   src/components/ScaleModeModal.jsx, integrasi BlockSimulator3D.jsx
   (state scaleMode/scaleModeRef/scaleModeLockedRef/scaleDragRef +
   snapshot di 'dragging-changed' + penerapan di 'objectChange'),
   GizmoBlockInfoPanel.jsx (+tombol "+"/popup), test_scaleModes.mjs.
   Commit bc82b8c. CONTEXT API: default tool = null (kontrak fresh-entry),
   jadi modal muncul saat user MENEKAN tool scale — bukan saat halaman dibuka.

   79. **HARNESS BACA STATE REACT PADA TICK YANG SAMA = FAIL PALSU**
       (Phase 73, 2026-09-17): klik tombol lalu LANGSUNG baca
       `el.style.animation` pada tick yang sama → React belum commit state
       baru, yang terbaca masih animasi LAMA (terukur: popup tutup terbaca
       "scalemode-pop-in" padahal code benar). Ini cacat yang SAMA dengan
       cacat v1 harness warisan (sudah dicatat di header, tapi terulang).
       CARA BENAR: beri 1 tick (await sleep(80)) SEBELUM membaca style/
       atribut hasil render React. Terbukti setelah fix: terbaca
       "180ms ... scalemode-pop-out forwards".

   80. **HARNESS YANG ME-MOUNT HANYA PAGE TIDAK BISA MEMVERIFIKASI TOAST**
       (Phase 73): `<Toaster>` di-render di App.jsx (baris 266) = DI LUAR
       halaman BlockSimulator3D. Harness integrasi yang hanya mount page →
       `toast.warning(...)` tidak punya Toaster → "toast tidak muncul" =
       ARTEFAK ALAT UKUR, bukan bug. Harness WAJIB menyertakan Toaster
       identik App.jsx (position top-center, richColors, theme dark).
       Terverifikasi setelah itu: toast type=warning, teks "Mode scaling
       dipilih: 4 Side", border rgb(61,61,0), judul rgb(243,207,88) =
       #F3CF58 (KUNING KEEMASAN sesuai permintaan user — angka faktual,
       bukan perkiraan). Cara baca warna toast = getComputedStyle pada
       [data-title] (bukan warna latar, yang tetap dominan gelap).

   81. **TOOLBAR TOOL TIDAK ADA DI DOM SAAT FRESH ENTRY — JALUR VERIFIKASI
       RESMI = KEYBIND** (Phase 73): kontrak "master state 'build' WAJIB
       TERTUTUP saat fresh entry" membuat tombol tool (termasuk Scale)
       TIDAK ter-render sampai user membuka section → harness yang mencari
       tombol via textContent gagal total ("Scale button not found") dan
       SEMUA langkah turunannya FAIL palsu. Jalur resmi & lebih bersih:
       keybind Phase 47 → '5'=scale, '7'=move (sekaligus AUTO-OPEN Build
       Tools). Harness integrasi halaman wajib memakai keybind resmi,
       jangan menebak struktur DOM panel.

   82. **AABB SUMBU-DUNIA BLOCK TEROTASI ≠ PANJANG BLOCK** (Phase 73,
       asersi salah-ukur yang kutulis sendiri): block 1×1×1 dirotasi 45°
       punya span AABB dunia x = 2·cos45 + 1·sin45 = 2.121 — memakai span
       dunia sebagai "panjang block" → FAIL palsu ("memanjang span 2.121",
       padahal panjang sebenarnya tepat 2). METRIK BENAR: jarak antara
       PUSAT kedua wajah sepanjang sumbu BLOCK (terukur 2.000000). Pola
       umum: saat objek terotasi, metrik sumbu-dunia mengukur KOMBINASI
       beberapa sumbu lokal — selalu proyeksikan ke frame objek dulu.

   83. **SYNTHETIC PointerEvent TIDAK MENYALAKAN DRAG INTERNAL
       TransformControls** (Phase 73, reconfirmasi warisan #24 + skill
       measured-verification): dispatch pointerdown/move/up ke handler
       tidak membuat library masuk mode dragging (butuh setPointerCapture
       + raycast nyata). Verifikasi drag scale = REPLIKA RUMUS library
       yang dibaca verbatim dari source (baris 496 `_scaleStart.copy`,
       baris 500 `pointStart.copy(...).sub(worldPositionStart)`, baris 671
       `scale.copy(_scaleStart).multiply(_tempVector2)`) + urutan listener
       app yang sebenarnya (library memanggil 'dragging-changed' SETELAH
       dragging=true & pointStart terisi, baris 504-506 → snapshot di
       listener DIJAMIN valid). Hasil terukur 18/18 PASS.

   Catatan teknis Phase 73 (pakai as-is, jangan riset ulang):
   - `tc.worldQuaternion` = properti RESMI TransformControls (baris 382,
     di-decompose baris 1143), aman dari listener; `getScaleWorldAlign(tc)`
     (gizmoScaleBalls.js) pakai WeakMap → `get(null)` tidak throw.
   - 1 side: rumus benar = reset skala ke nilai awal (kecuali clamping),
     terapkan rasio ke sumbu mode, lalu offset pusat = axisLocal ×
     frameQuat × sign × Δscale × halfSize. 2 side = jalur BAWAAN apa
     adanya (scaleDragRef null → nol cabang tambahan).
   - `applyScaleByMode` WAJIB ada karena library sudah men-set
     `object.scale[sumbu digenggam]` SEBELUM objectChange — pada 4 side
     sumbu itu harus DIAM, jadi nilai library HARUS direset.
   - Aturan modal (final): default & Batal = 1 side; Batal TIDAK mengunci
     (modal muncul lagi tiap equip scale); Konfirmasi mengunci (tidak
     muncul lagi sampai refresh — lock di useRef, hilang otomatis saat
     remount); klik overlay TIDAK menutup modal.
   - Verifikasi halaman asli bisa lewat browser headless dengan harness
     yang mount page + Toaster (page hanya butuh prop `setPage`, NOL
     import firebase/auth) — 6 skenario B1-B6 PASS, nol error JS.

### WARISAN PENGALAMAN — sesi 2026-09-17 (PHASE 73 v2: tombol "+" → modal megah)

   Permintaan user (verbatim): "seharusnya tombol '+' jika diklik maka
   munculnya adalah peringatan oranye yang MEGAH designnya itu!! bukan
   malah kayak sepele kecil gini! tolong yang design pilih 4 mode yang
   sepele kecil dan jelek ini hapus aja, langsung arahin ke yang
   peringatan oranye dengan design bagus dan megah itu!"
   → POPUP KECIL (210px di sudut kotak view) DIHAPUS TOTAL. Tombol "+"
   sekarang membuka MODAL "Scale Mode" yang megah. Solusi: SATU komponen
   ScaleModeModal + prop `variant` ('onboarding' = perilaku v1 persis;
   'picker' = dari tombol "+": klik kartu = langsung pakai + modal tutup,
   bisa ditutup klik luar/X/Escape). Desain 100% identik antar varian
   (nol duplikasi visual). Commit 81d0f34. State baru:
   scaleModeModalVariant; Konfirmasi hanya MENGUNCI saat varian
   onboarding (picker bebas buka-tutup).

   84. **CSS ANIMATION TIDAK MAJU DI HEADLESS (--virtual-time-budget) —
       ELEMEN TAMPAK "MENYUSUT" PADAHAL CSS BENAR** (Phase 73 v2, 2026-09-17
       — alat ukur menipu KE-12): panel modal terukur getBoundingClientRect
       196px padahal CSS `width: min(560px, ...)`. Angka 196 = 560 × 0.35
       PERSIS — yaitu scale(0.35) keyframe AWAL animasi `scalemode-in`.
       Bukti pemisah: `offsetWidth` tetap 560px (layout benar) sementara
       `transform: matrix(0.35,0,0,0.35,16.8,-16.8)` + `opacity: 0` +
       `animationPlayState: running` MEMBEKU selamanya; dengan
       `el.style.animation='none'` → rect jadi 560px. `animation-fill-mode:
       none` = tidak ada state akhir yang menahan → elemen tinggal di
       keyframe pertama. ATURAN: di headless, elem yang pakai ANIMASI CSS
       (fade/scale-in) TIDAK PERNAH selesai — untuk screenshot atau ukur
       REST STATE, matikan dulu animasinya (`style.animation='none'`;
       set opacity/transform ke nilai akhir). Jangan menyimpulkan "CSS
       width gagal" sebelum memeriksa offsetWidth vs rect dan transform.
       Di browser nyata animasi SELESAI normal (0.34s) → tidak ada bug user.
   85. **DUA ENTRY POINT KE SATU TAMPILAN = SATU KOMPONEN + PROP VARIANT**
       (Phase 73 v2): modal yang sama dipakai dari 2 jalur (otomatis saat
       equip scale & tombol "+"). Menyalin desain ke komponen kedua =
       risiko drift (pelajaran Phase 72 v2: konten pendamping jadi "wilayah
       kedua"). Solusi: satu komponen, prop `variant` mengubah PERILAKU
       saja (footer/tombol X/cara tutup), desain nol perubahan. Verifikasi
       wajib: ukur elemen pembeda tiap varian di halaman asli (footer ADA/TIDAK,
       X ADA/TIDAK) + screenshot side-by-side keduanya vs referensi.
   86. **"HAPUS" YANG DIMINTA USER = HAPUS SAMPAI BERSIH, BUKAN DISEMBUNYIKAN**
       (Phase 73 v2): user bilang "popup sepele kecil dan jelek ini hapus
       aja". Yang benar: hapus state + konstanta + keyframes + JSX + import
       yang jadi tak terpakai, lalu BUKTIKAN di DOM bahwa popup lama sudah
       tidak ada (matcher ciri khasnya: div `width: 210px` berisi 4 tombol
       'Side') — bukan sekadar tidak dirender pada satu jalur. Residual
       import/state yang tertinggal = utang yang membingungkan AI penerus.

   ### PENGETAHUAN — AI Helper 1 Panel 2 Mode + v2 Lenyap Total Sampai Backend (Phase 58, commit 92c6748, 2026-09-09)

PERMINTAAN USER: (1) AI Helper Block Simulator jadi SATU tubuh dengan toggle mode —
"Chat Umum" (ngobrol normal) atau "3D Simulator" (khusus command) — user pilih
sesuka hati; (2) "wajib BlockSimulator3Dv2 dengan embel embel v2 tidak ada!
bahkan backend juga" — proteksi Phase 57 dicabut, di masa depan hanya
"BlockSimulator3D" supaya tidak salah paham.
- AI HELPER: state aiHelperMode 'simulator'|'chat' (default 'simulator');
  riwayat TERPISAH aiHelperSimMessages/aiHelperChatMessages dengan system
  prompt per-mode; [[COMMAND:...]] HANYA dieksekusi mode simulator; fallback
  offline per-mode; segmented toggle gaya model-picker (amber #f59e0b) +
  ikon Sparkles/MessageCircle; chips saran per-mode; lucide +MessageCircle.
- RENAME BACKEND: api/ai-helper-v2.js → api/ai-helper.js; env
  AI_HELPER_V2_URL/KEY → AI_HELPER_URL/KEY; route /api/ai-helper-v2 →
  /api/ai-helper; log [ai-helper]. AMAN KARENA TERUKUR: production
  /api/ai-helper-v2 = 503 "not configured" sejak awal (env tak pernah
  terpasang) → rename nol risiko.
- PAGE-ID: 'block-simulator-3d-v2' → 'block-simulator-3d' (KNOWN_PAGES,
  conditional render, key, onClick, komentar). MIGRASI TANPA LITERAL v2 di
  kode: restore DB — startsWith('block-simulator-3d') && !KNOWN_PAGES.has(id)
  → dipetakan 'block-simulator-3d'. User lama tetap pulih, bukan 404.
  save-progress otomatis menulis id baru.
- PITFALL ALAT UKUR BARU: (1) harness subprocess rebuild arg-list lupa URL →
  Chrome dump about:blank = FAIL PALSU (DOM via terminal terbukti sehat);
  selalu pastikan URL ada di command list. (2) Threshold pixel wajib dari
  ukur nyata: panel 380px → border amber di kolom x=900 (900 sampel) +
  interior 714 amber/9146 dark = SAH; tebakan awal 2000 amber = FAIL palsu.
- CATATAN KOORDINASI: backend developer — nanti pasang env AI Helper di
  hosting pakai nama BARU AI_HELPER_URL/AI_HELPER_KEY.
- KLARIFIKASI USER (2026-09-09, setelah Phase 58): larangan v2 itu KHUSUS
  NAMA SIMULATOR saja — BlockSimulator3Dv2 / block-simulator-3d-v2 /
  ai-helper-v2 / AI_HELPER_V2_*. "v2" dalam KONTEKS LAIN itu SAH-SAH
  SAJA BOLEH: mis. "Phase 59 v2" (revisi kedua sebuah phase), segmen
  kabel V2 di LogicGates (pola V-H-V), hash npm package-lock, versi
  library/tool eksternal, dokumentasi sejarah. JANGAN generalisasi
  larangan ke semua "v2" — dan JANGAN sentuh V2 LogicGates/konteks
  lain hanya karena mengandung "v2".

### PENGETAHUAN — Rename BlockSimulator3Dv2 → BlockSimulator3D + pembersihan "v2" (Phase 57, commit 40bb7fe, 2026-09-09)

User: "teks v2 tidak pernah ada — frontend, kodingan, semua". Dilakukan full.
(UPDATE Phase 58/92c6748: proteksi id halaman & route API di bawah sudah DICABUT
oleh user — "di masa depan hanya perlu blocksimulator3D", termasuk backend.)
- git mv src/pages/BlockSimulator3Dv2.jsx → src/pages/BlockSimulator3D.jsx.
- Nama fungsi komponen → BlockSimulator3D; import App.jsx ikut (baris 36).
- Variabel aiHelperV2*/AiHelperV2 → aiHelper*/AiHelper (26+34 kemunculan).
- Teks UI: label menu Shapes "3D Block Simulator", login-gate, panel
  "AI Helper", "Templates", greeting AI, default save "block-sim-scene".
- TERLINDUNGI (jangan pernah rename tanpa koordinasi backend): page-id
  'block-simulator-3d-v2' (App.jsx restore current_page dari DB Supabase
  baris 69-70) dan route '/api/ai-helper-v2' + env AI_HELPER_V2_URL/KEY
  (16 env var terpasang di Vercel oleh backend developer).
- JEBAKAN PENGUKURAN (2 baru, catat!): (1) grep -c menghitung BARIS bukan
  kemunculan — satu baris JSX bisa 4 pemakaian; wajib grep -o | wc -l.
  (2) regex v2(?![.\d]) wajib — koordinat SVG "M9 3v2.2" & "2v2.77" lolos
  sebagai substring palsu; LogicGates "V2" = segmen kabel V-H-V, konteks
  lain; package-lock "v2" = hash npm; draco_encoder "v2" = binary WASM.
- Skrip edit dua-fase verify-all-then-apply (pair = old/new/count; abort
  kalau satu pair mismatch; idempoten re-run) — mencegah edit parsial.

### BUG SEJARAH — Pindah Clone↔Mirror Panah Hilang (Phase 50 v12, 2026-09-07, commit `740cc70`)

**Masalah dari user:** Move → klik block → Clone (6 panah biru muncul) →
pindah ke Mirror: 6 panah LANGSUNG HILANG dan block tidak ter-highlight.
Berlaku dua arah (clone↔mirror). Dari Move langsung ke Clone/Mirror normal.

**Akar Masalah (terbukti ukur — simulasi Node urutan event app):**
Saat ganti tool, DUA fungsi berjalan berurutan: `toggleTool` (state
updater, Phase 50 v4) lalu `useEffect[tool]` (Phase 50 v9).
1. `toggleTool` membersihkan ghost: `scene.remove` + `geometry/material
   .dispose` + `cloneGhost=null` → ghost MATI.
2. `useEffect[tool]` masih memegang `tc.object` = ghost mati itu →
   `tc.detach()` jalan, tapi kondisi buat ghost baru `!sourceBlock
   .userData.cloneGhost` = FALSE (ghost ber-flag) → ghost baru tidak
   dibuat → gizmo TANPA target → 6 panah hilang; `selectedBlocks` sudah
   di-clear → tidak ada highlight.
Angka RED: clone→mirror & mirror→clone = `attached:false`; kontrol
move→clone = `attached:true` (12 handle). Bug-nya "dispose lalu pakai":
satu fungsi membuang objek, fungsi berikutnya masih pakai referensinya.

**Solusi (ubah sekecil mungkin, 2 titik di jalur yang sama):**
1. `toggleTool`: ghost dibuang HANYA kalau tool AKHIR bukan clone/mirror
   (pindah clone↔mirror = ghost DIPERTAHANKAN; keluar tool = perilaku lama).
2. `useEffect[tool]`: deteksi ghost hidup:
   `tc.object.userData.cloneGhost && threeRef.current.cloneGhost === tc.object`
   → JANGAN detach; gizmo tetap attach, re-highlight emissive 0x1a8cff.

**Pelajaran Penting:**
- Sebelum dispose objek, audit SEMUA pemegang referensi yang jalan
  SETELAHNYA — terutama useEffect yang watch state yang berubah bersamaan.
- Bug "hilang setelah interaksi kedua" (tapi normal di interaksi pertama)
  = hampir pasti ada state/rificek yang belum direset di jalur pertama —
  trace ulang dengan state yang sama, jangan hanya jalur pertama.
- "Pertahankan objek lintas operasi sejenis" > "buang lalu buat ulang":
  selain menghindari bug dispose-lalu-pakai, UX-nya lebih mulus (drag
  langsung bisa tanpa klik ulang).

**Verifikasi nyata:** tes headless 19 PASS / 0 FAIL (RED dulu:
attached:false 2 arah); pixel GPU nyata: SESUDAH = 355 px panah ungu
#9D00FF + 9727 px highlight TETAP ADA; SEBELUM = 0 px semua; build exit 0.

**Pitfall alat ukur (2x lagi):** (1) assertion test sendiri bandingkan
'#1a8cff' vs '1a8cff' (prefix #) → 3 FAIL palsu; (2) 412 px "biru" di
screenshot SEBELUM ternyata TEKS hasil PASS di `<pre>` (y=386-408), bukan
canvas — selalu pisahkan area canvas dari area teks saat hitung pixel.

**Known issue (PRE-EXISTING, di luar scope):** warning "attached object
must be part of scene graph" saat keluar clone→move — ghost dibuang tanpa
detach (sejak Phase 50 v4). Tidak mengganggu fungsi; dicatat, tidak diubah.

### BUG SEJARAH — Keluar Clone/Mirror ke Rotate: Bola Hilang (Phase 50 v13, 2026-09-07, commit `f388aaa`)

**Masalah dari user:** Rotate (bola RGB muncul di block) → Clone (6 panah
biru) → Rotate lagi: bola-bola LANGSUNG HILANG + block tidak ter-highlight.
Berlaku juga rotate→mirror→rotate. Spam move↔rotate aman; spam
rotate→clone/mirror = hilang ~50% (tergantung apakah ghost sudah dibuat /
pernah dibuang). Gejala "50%" = DUA jalur bug bertumpuk, tidak satu.

**Akar Masalah (terbukti ukur):**
toggleTool (Phase 50 v4) membuang ghost TANPA melepas gizmo:
1. **Jalur 1 — bola ngambang:** gizmo tetap attach ke ghost yang sudah
   `scene.remove`+dispose → `attached:true, inScene:false` (parent=NULL)
   → warning "must be part of scene graph" tiap frame; bola dirender di
   posisi STALE ghost; highlight mati (selectedBlocks berisi ghost mati).
2. **Jalur 2 — spam, semua hilang:** setelah jalur 1, masuk clone LAGI →
   `tc.object` = ghost mati ber-flag cloneGhost → guard v12 `!cloneGhost`
   menolak buat ghost baru → `detach()` tanpa `attach()` → panah+bola+
   highlight SEMUANYA hilang. Pixel RED (spam 5 langkah): r=0 g=0 b=0,
   highlight=0 — benar-benar kosong.
useEffect[tool] untuk rotate/move/scale hanya `setMode` — tidak pernah
restore attachment, jadi kondisi mati tidak pernah sembuh sendiri.

**Solusi (4 titik kecil, semua di jalur yang sama):**
1. Ghost DIBUAT → simpan `ghost.userData.ghostSource = <block asal>`
   (3 titik pembuatan: useEffect auto-create, click clone, click mirror).
2. `toggleTool` membuang ghost → salin ghostSource ke threeRef +
   **`tc.detach()` SEBELUM dispose** (warning scene-graph ikut hilang).
3. `useEffect[tool]`: keluar clone/mirror (tool≠clone/mirror, gizmo
   kosong, ada ghostSource) → attach gizmo + highlight ke block ASAL.
   Berlaku untuk SEMUA tool tujuan. Guard: block asal masih `parent`
   (belum dihapus) + `isBlock`. ghostSource dikonsumsi sekali.
4. Perilaku clone↔mirror (v12) tidak tersentuh.

**Pelajaran Penting:**
- "Dispose objek" BUKAN cuma soal referensi JS — gizmo/attachment juga
  pemegang referensi. Detach dulu, baru dispose.
- Gejala probabilistik (~50%, kadang muncul kadang tidak) = hampir pasti
  DUA+ jalur bug bertumpuk dengan state berbeda — jangan berhenti di
  jalur pertama yang ketemu; simulasikan SPAM (pengulangan) juga.
- Simpan "objek asal" (source) di userData saat membuat objek turunan
  sementara → restore jadi murah saat objek turungan dibatalkan.
- `useEffect` yang hanya `setMode` (tanpa kelola attachment) adalah titik
  buta: mode berubah tapi attachment bisa sudah tidak valid.

**Verifikasi nyata:** headless 7 skenario 15 PASS / 0 FAIL (termasuk
spam 7-langkah, unequip, drag-finalize, guard block terhapus); pixel GPU
spam 5-langkah: SEBELUM 0/0/0+0 vs SESUDAH bola r269 g271 b597 px +
highlight 6039 px; build exit 0. Screenshot diverifikasi per-kuadran
(sisa pixel biru di panel SEBELUM hanya di area TEKS y=383-399, canvas nol).

---

## 5. CARA UJI (COPY-PASTE, SUDAH TERBUKTI)

### A. Uji struktur di Node (cepat, tanpa browser)
Simpan di `$LOCALAPPDATA/Temp/`, **JANGAN di dalam repo**.
Karena file di luar project, `import 'three'` gagal — pakai absolute file URL:
```javascript
const PROJ = 'file:///C:/Users/user/Babft%20Project/Babftss-main/';
const THREE = await import(PROJ + 'node_modules/three/build/three.module.js');
const { TransformControls } = await import(PROJ + 'node_modules/three/examples/jsm/controls/TransformControls.js');
const { makeSixArrows } = await import(PROJ + 'src/utils/gizmoSixArrows.js');

let fail = 0;
const check = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fail++; };
/* ...tulis RED lalu GREEN... */
process.exit(fail === 0 ? 0 : 1);
```
Jalankan: `cd "C:/Users/user/Babft Project/Babftss-main" && node "$LOCALAPPDATA/Temp/verify.mjs"`

### B. Uji visual/pixel di browser nyata
Butuh static server kecil di Temp (karena `file://` kena CORS):
```javascript
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const PROJECT = 'C:/Users/user/Babft Project/Babftss-main';
const TEMP = 'C:/Users/user/AppData/Local/Temp';
const MIME = {'.html':'text/html','.js':'text/javascript','.json':'application/json'};
http.createServer((req,res)=>{
  const u = decodeURIComponent(req.url.split('?')[0]);
  let f = u==='/' ? path.join(TEMP,'test.html')
        : u.startsWith('/three/') ? path.join(PROJECT,'node_modules/three',u.slice(7))
        : u.startsWith('/src/')   ? path.join(PROJECT,u.slice(1))
        : path.join(TEMP,u.slice(1));
  fs.readFile(f,(e,b)=>{ if(e){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});res.end(b); });
}).listen(5399);
```
HTML uji **WAJIB** punya importmap, kalau tidak addon Three.js gagal resolve:
```html
<script type="importmap">
{ "imports": { "three": "/three/build/three.module.js", "three/": "/three/" } }
</script>
```
Jalankan Chrome headless (**pakai GPU nyata** untuk uji garis):
```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new \
  --no-sandbox --disable-extensions --use-angle=default \
  --user-data-dir="C:/Users/user/AppData/Local/Temp/prof" \
  --virtual-time-budget=60000 --window-size=900,900 \
  --dump-dom "http://127.0.0.1:5399/" > out.html 2>&1
grep -o "<title>[^<]*</title>" out.html
sed -n '/<pre>/,/<\/pre>/p' out.html | sed 's/<[^>]*>//g'
```
Ambil screenshot: ganti `--dump-dom` dengan `--screenshot="C:/.../hasil.png"`.
Lihat hasilnya sendiri dengan tool `vision_analyze` SEBELUM dikirim.

### 3 PITFALL WAJIB saat uji PointerEvent
```javascript
// 1) canvas HARUS sudah masuk DOM — getPointer() pakai getBoundingClientRect(),
//    canvas detached → rect nol → raycast selalu luput → axis tidak pernah ter-set
document.body.appendChild(renderer.domElement);

// 2) stub capture API — pointerId sintetis tidak terdaftar
renderer.domElement.setPointerCapture = () => {};
renderer.domElement.releasePointerCapture = () => {};

// 3) 'pointermove' WAJIB button = -1 !!! pointerMove() punya guard
//    `if (pointer.button !== -1) return`. Pakai 0 → dragging true tapi
//    objek TIDAK BERGERAK. Gejala: rotationAngle 0.00°
button: type === 'pointermove' ? -1 : 0
```
Urutan event yang benar: `pointermove` (set axis) → `pointerdown` →
`pointermove` (drag) → `pointerup`. Tanpa hover dulu, `axis` masih null.

Untuk uji rotate, **cari sudut grab valid otomatis** (scan 0-360° sampai
`tc.axis` cocok), jangan pakai sudut tetap — picker torus saling tumpang tindih.

---

## 6. ALUR KERJA WAJIB (9 LANGKAH)

Ikuti urutan ini untuk SETIAP tugas. Jangan lompat.

```
1. BACA        Baca file yang relevan + komentar header modul terkait.
               Cari juga di TransformControls.js kalau menyentuh gizmo.

2. UKUR        Jalankan probe di Node, cetak angka sebenarnya.
               JANGAN menulis kode sebelum langkah ini selesai.

3. BUKTIKAN    Kalau ada percobaan sebelumnya yang gagal, buktikan secara
               numerik KENAPA gagal. Tanpa ini, kamu akan mengulangi kesalahan.

4. TULIS TES   Buat tes RED (bug terbukti ada) DULU, sebelum menulis fix.
               Pastikan angka SEBELUM benar-benar bukan-nol.

5. FIX         Ubah sekecil mungkin. Modul terpisah di src/utils/ kalau
               logikanya berdiri sendiri. Idempoten + dispose() + try/catch.
               Komentari SETIAP keputusan non-obvious beserta alasannya.

6. VERIFIKASI  a) tes headless           → semua PASS
               b) uji pixel di GPU nyata → lihat sendiri via vision_analyze
               c) node node_modules/vite/bin/vite.js build → exit 0
               d) regresi fitur lama     → pastikan tidak rusak

7. PRE-COMMIT  pwd + cek package.json/index.html/vite.config.js/src ada
               cek 6 file terlarang tidak tersentuh
               cek file fitur lain tidak berubah
               git add <file spesifik>   (JANGAN git add -A)

8. PUSH        git commit -F <file pesan>  (pesan panjang & jujur)
               git push origin main
               Verifikasi: git rev-parse HEAD == git rev-parse origin/main
               Konfirmasi lagi via GitHub API (jangan percaya "no error")

9. LAPOR       Telegram: teks + SCREENSHOT bukti (Bagian 7)
               Bersihkan file uji sementara di Temp, sisakan screenshot
```

### Aturan penulisan pesan commit
```
<tipe>(<scope>): <ringkas 1 baris>

MASALAH        — apa yang salah dari sudut pandang user
PENYEBAB       — akar masalah + ANGKA hasil pengukuran
SOLUSI         — apa yang diubah dan kenapa cara itu dipilih
AMAN           — apa yang TIDAK tersentuh (picker, mode lain, file terlarang)
VERIFIKASI     — angka nyata: jumlah assertion, hasil pixel, status build
CATATAN        — pitfall yang ditemukan, termasuk kesalahan alat ukur sendiri
```

---

## 7. WAJIB: LAPOR KE TELEGRAM + SCREENSHOT

User ingin melihat perkembangan tanpa harus bertanya. **Setiap tugas selesai,
WAJIB kirim teks + screenshot bukti.** Bot & chat ID sudah aktif.

### Ambil token bot
```python
import os, re
cfg = os.path.expandvars(r"%LOCALAPPDATA%\synapse\config.yaml")
TOKEN = re.search(r"(\d{8,12}:[A-Za-z0-9_-]{30,})",
                  open(cfg, encoding="utf-8", errors="ignore").read()).group(1)
CHAT = "6643593526"   # @Destroyer
```

### Kirim teks — pakai parse_mode HTML, JANGAN MarkdownV2
MarkdownV2 mewajibkan escape `( ) . - ! _ *` dan pasti error 400.
```python
import json, urllib.request, urllib.parse
msg = """✅ <b>Judul Tugas</b>

<b>Commit:</b> <code>abc1234</code> — sudah di GitHub main

<b>Masalah</b>
...jelaskan singkat...

<b>Solusi</b>
...apa yang diubah...

<b>Verifikasi</b>
• N assertion headless — LULUS
• Uji pixel GPU nyata — angka nyatanya
• vite build exit 0

File X dan mode Y tidak tersentuh."""
data = urllib.parse.urlencode({
    "chat_id": CHAT, "text": msg,
    "parse_mode": "HTML", "disable_web_page_preview": "true",
}).encode()
req = urllib.request.Request(f"https://api.telegram.org/bot{TOKEN}/sendMessage", data=data)
with urllib.request.urlopen(req, timeout=30) as r:
    print("terkirim:", json.load(r).get("ok"))
```
Escape HTML: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`.

### Kirim screenshot (multipart manual, tanpa dependency)
```python
IMG = r"C:\Users\user\AppData\Local\Temp\bukti.png"
boundary = "----Batas123"
parts = []
def field(n, v):
    parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{n}\"\r\n\r\n{v}\r\n".encode())
field("chat_id", CHAT)
field("caption", "Penjelasan singkat isi gambar")
with open(IMG, "rb") as f: img = f.read()
parts.append(
    f"--{boundary}\r\nContent-Disposition: form-data; name=\"photo\"; filename=\"b.png\"\r\n"
    f"Content-Type: image/png\r\n\r\n".encode() + img + b"\r\n")
parts.append(f"--{boundary}--\r\n".encode())

import time
for attempt in range(1, 4):                       # kadang ConnectionReset
    try:
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{TOKEN}/sendPhoto", data=b"".join(parts),
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
        with urllib.request.urlopen(req, timeout=90) as r:
            print("foto terkirim:", json.load(r).get("ok")); break
    except Exception as e:
        print(f"attempt {attempt} gagal: {type(e).__name__}")
        if attempt < 3: time.sleep(3)
```

### Screenshot pembanding "SEBELUM vs SESUDAH"
Yang paling disukai user: buat HTML dengan beberapa panel berdampingan —
panel kiri kondisi lama (tanpa fix), panel kanan dengan fix. Ambil SATU
screenshot lewat Chrome headless, lalu **periksa sendiri dengan
`vision_analyze`** sebelum dikirim — jangan kirim gambar yang belum kamu lihat.

Screenshot bukti yang sudah ada di `C:\Users\user\AppData\Local\Temp\`:
```
gizmo-compare.png     — 3 panah → 6 panah utuh
gizmo-v10-gpu.png     — garis putih panjang → hilang
solo-compare.png      — 6 panah → 1 panah saat drag → 6 lagi
rotate-compare.png    — 5 cincin berantakan → 3 cincin + 6 bola
p50v2-compare.png     — bola terkunci di 3 sudut kamera + solo-orbit
```

---

## 8. PROFIL USER & CARA BERINTERAKSI

- **Nama:** M. Rizal Kurniawan. **Telegram:** @Destroyer (user ID 6643593526).
- **Prefer bahasa:** Indonesia.
- **Skill level:** pemula (self-described). Butuh panduan sangat detail,
  step-by-step, dengan penjelasan dasar. Jangan asumsikan pengetahuan teknis.
- **Work style:** fully autonomous — AI kerja sendiri, dapat notif Telegram saat
  selesai atau stuck. Self-healing loop: retry 5-10x sebelum minta tolong.
  HITL (clarify) wajib untuk keputusan kritis (hapus data, deploy).
- **Bot notif:** @SOS_Kel5_Monitor_Bot (chat 6643593526).

### KONTRAK PERMANEN (memori user — WAJIB diingat setiap session)
**A. SKILL:**
1. JANGAN langsung pakai skill — analisis konteks masalah dulu secara penuh
2. Pahami 100% apa yang user butuhkan (fitur baru dari 0? butuh design?
   frontend? backend? dll)
3. Setelah paham konteks → identifikasi skill yang dibutuhkan
4. Scan SEMUA skill list → kumpulkan skill yang relevan
5. Load semua skill yang dibutuhkan sekaligus (skill_view)
6. Gunakan skill sesuai kebutuhan — tidak berlebihan, pas, sesuai urusan
7. Selesaikan masalah dengan sempurna — semua skill harus terpakai
8. Jika menemukan cara lebih baik → update skill tersebut segera (skill_manage patch)
9. jangan pernah menyentuh, menyenggol, merusak, merubah kodingan lain yang
   sudah sempurna — fokus 100% pada masalah yang terjadi saat ini. Pernah ada
   AI menimpa pekerjaan user sampai hilang dan user rugi banyak fitur.
   Prinsip: semua skill harus terpakai sesuai kebutuhan, tidak boleh ada skill
   yang terlewat kalau relevan. Urusan harus cepat selesai dengan kualitas sempurna.

**B. TOOLS:**
1. DILARANG menyuruh user refresh/tunggu/lakukan sesuatu
2. Tools tidak available → self-recovery, tunggu/coba sendiri
3. Langsung pakai tools begitu bisa
4. User tidak boleh diganggu masalah teknis

---

## 9. RINGKASAN — 10 KALIMAT PALING PENTING

1. **Ukur dulu, jangan menebak** — Three.js bisa di-probe di Node tanpa browser.
2. **Buktikan kenapa percobaan lama gagal** sebelum mencoba cara baru.
3. **Tes harus bisa MERAH dulu**; kalau sebelum & sesudah sama-sama nol, tesmu rusak.
4. **Curigai alat ukurmu** — bandingkan dengan versi bawaan untuk memastikan.
5. **`handle.position`, `handle.visible`, DAN `material.color` ditimpa setiap frame**
   oleh Three.js (color ditimpa dari cache `_color` → pakai `tc.setColors()`).
6. **`pointermove` wajib `button: -1`**, canvas wajib sudah masuk DOM.
7. **Ubah sekecil mungkin**; pakai API publik sebelum menyentuh internal.
8. **Uji garis wajib di GPU nyata**, SwiftShader tidak bisa menggambarnya.
9. **Jangan sentuh fitur lain**; cek eksplisit sebelum commit, `git add` spesifik.
10. **Lapor Telegram + screenshot** setiap selesai, dan jujur soal yang belum beres.
11. **WAJIB pakai vision_analyze (Gemini) — ATURAN #8**: baca gambar
    referensi DULU sebelum koding, lihat screenshot bukti SENDIRI sebelum
    klaim sukses. Pixel-check hanya untuk angka presisi, bukan struktur.
12. **WAJIB mewariskan pengalaman — ATURAN #9**: setiap tugas, tanya
    "apa yang aku pelajari?" → tulis jebakan/temuan ke kontrak + skill
    (dengan angka/bukti) sebelum tutup sesi. Warisan yang tidak ditulis
    = tidak ada. Kalau tak ada temuan baru → katakan eksplisit.

---

*Dokumen ini adalah KONTRAK PERMANEN project Babftss. Wajib dibaca penuh setiap
sesi oleh AI/model apa pun sebelum mengerjakan tugas. Semua angka hasil
pengukuran nyata, bukan estimasi. Kalau ragu — ukur ulang, jangan menebak.*

---

## 10. WARISAN PENGALAMAN — sesi 2026-09-19 (server z.ai; job: hapus badge "bawaan" di ScaleModeModal)

> Konteks: tugas dikerjakan di server z.ai (bukan local-dev Windows user
> biasa). Source code project sudah ada di repo GitHub `johsua092-ui/Babftss`
> dan di-pull ke working directory `/home/z/my-project/`. AI bisa membaca
> source code penuh termasuk `src/pages/BlockSimulator3D.jsx` (~22.600 baris)
> dan modul gizmo di `src/utils/`. Verifikasi vite build bisa dijalankan
> langsung lewat `npm install` + `node node_modules/vite/bin/vite.js build`
> (di local dev user, jalankan persis seperti kontrak Bagian 0).

74. **PITFALL: HAPUS ELEMEN UI = WAJIB CEK DEPENDENSI VISUAL DI SEKITARNYA**
    (sesi 2026-09-19, commit `5298a26`): hapus badge "bawaan" di kartu mode
    2 Side pada modal ScaleModeModal (`src/components/ScaleModeModal.jsx`).
    Block yang dihapus = baris 238–244: `{m === '2side' && (<span>bawaan</span>)}`.
    **Jebakan**: baris 247 punya `marginLeft: m === '2side' ? 6 : 'auto'` yang
    sebenarnya "menempel" ke badge bawaan — angka `6` ada SUPAYA checkmark
    aktif menempel ke badge bawaan (karena badge bawaan punya `marginLeft: 'auto'`
    yang push-nya ke kanan). Setelah badge dihapus, angka `6` jadi "dead
    context" tapi TIDAK rusak secara fungsional. **Akibat visual yang
    ditinggalkan**: checkmark mode 2side saat aktif menempel ke label
    "2 Side" (`marginLeft 6px`), berbeda dari mode lain (1side/4side/6side)
    di mana checkmark di-push ke kanan (`marginLeft auto`). User eksplisit
    melarang "menyenggol yang lain", jadi fix dependensi visual di SKIP;
    efek samping dicatat di commit message + laporan agar AI penerus tahu
    kalau user komplain "checkmark menempel", fix-nya ganti `'6'` → `'auto'`
    di baris 247. **Pelajaran**: saat menghapus elemen UI, JANGAN hanya
    grep teks yang dihapus; GREP juga semua kelas/kondisi yang berkaitan
    (di kasus ini: `'2side'`) untuk lihat dependensi visual tersembunyi.
    Baca sekitar `±10 baris` dari block yang dihapus sebelum commit.

75. **VERIFIKASI FIX UI TEXT-ONLY: vite build EXIT 0 CUKUP**
    (sesi 2026-09-19, commit `5298a26`): kontrak Bagian 6 langkah 6 mensyaratkan
    4 verifikasi (headless/pixel/build/regresi). Untuk fix yang HANYA
    menghapus/mengubah string teks di JSX (bukan rendering visual, bukan
    logika, bukan style material), verifikasi bisa di-PRESISE:
    (a) skip tes headless kalau tidak ada test file untuk komponen itu
        (di kasus ini: `find -name "*ScaleModeModal*"` hanya menemukan
        file komponennya sendiri, tidak ada `.test.jsx`/`.spec.mjs`);
    (b) skip uji pixel karena tidak ada delta visual selain teks yang
        hilang — vision_analyze (aturan #8) TIDAK wajib karena fix tidak
        ditentukan dari gambar referensi, berasal dari teks permintaan user;
    (c) **vite build WAJIB exit 0** = bukti syntax valid & tidak ada
        import yang rusak — di kasus ini: `built in 18.66s, 0 error`;
    (d) regresi = otomatis aman karena tidak ada fungsi/komponen lain
        yang dipanggil berubah (hanya satu JSX block dihapus).
    Penting: jangan di-PRESISE kalau fix MENYENTUH rendering visual,
    logika, atau style material — di kasus itu kembali ke 4 verifikasi penuh.

76. **TEKNIK SEARCH untuk target hapus string spesifik di codebase besar**
    (sesi 2026-09-19): saat user minta hapus "teks X" di komponen, JANGAN
    asumsi cuma 1 match. Pakai `rg "X" src/ -n -C 3` untuk melihat konteks.
    Bedakan (a) teks yang muncul di UI (yang benar) vs (b) teks di komentar
    kode (yang banyak dan TIDAK boleh disentuh). Di kasus hapus "bawaan":
    grep menemukan 30+ match di `src/`, hanya 1 yang benar-benar teks UI
    (`ScaleModeModal.jsx:243`); sisanya komentar penjelasan "bawaan Three.js"
    di `gizmoRotateRings.js`/`gizmoSixArrows.js`/`gizmoScaleBalls.js`/
    `BlockSimulator3D.jsx`. **SELALU verifikasi pakai Read dengan offset+
    limit sebelum Edit** untuk pastikan match adalah benar-benar elemen
    yang dimaksud user, bukan komentar.

77. **EDIT TOOL: HAPUS BLOCK JSX MULTI-BARIS TANPA WHITESPACE DRIFT**
    (sesi 2026-09-19): untuk hapus block JSX multi-baris (mis.
    `{m === 'X' && (<span>...</span>)}`), pola yang aman:
    - `old_str` = block target + baris SETELAHNYA (yaitu `{active && (`
      di kasus ini);
    - `new_str` = baris SETELAHNYA saja (`{active && (`).
    Hasilnya: tidak ada baris kosong tersisa di tempat block lama.
    Keuntungan pakai konteks setelah (bukan sebelum): unik untuk block
    spesifik, tidak salah tangkap block serupa. Jangan pakai `old_str` =
    block saja tanpa konteks → Edit tool akan menolak kalau ada
    whitespace/newline tersangkut. Verifikasi post-edit: `git diff --stat`
    harus = `1 file changed, N deletions(-), 0 insertions(+)` (jadi
    bukti murni penghapusan, tidak ada karakter lain tersangkut).

78. **PROTOKOL PUSH SERVER-KE-REPO PRIVATE: GIT CREDENTIAL HELPER ENV-VAR**
    (sesi 2026-09-19, server z.ai): untuk push ke repo private GitHub dari
    server tanpa menyimpan token di `.git/config` (risiko bocor ke commit
    lain), pakai pola:
    ```
    git config credential.helper \
      '!f() { echo "username=x-access-token"; echo "password=$GH_TOKEN"; }; f'
    export GH_TOKEN='ghp_xxx'   # atau fine-grained PAT
    git push origin main
    ```
    Helper function tidak menyimpan token (hanya baca env var saat kredensial
    dibutuhkan). Verifikasi pasca-push WAJIB: `git rev-parse HEAD` harus =
    `git rev-parse origin/main`. Jangan percaya "no error" saja — kadang
    push tertunda atau kena rate-limit. Untuk pull --rebase (kalau remote
    punya commit yang lokal belum punya), pakai helper yang sama; resolve
    konflik file-demi-file, `git add <file spesifik>`, `GIT_EDITOR=true
    git rebase --continue` (skip editor interaktif).

79. **RED HERRING: KOMENTAR PANjang HEADER = WARISAN, BUKAN DEAD CODE**
    (sesi 2026-09-19, baca `gizmoRotateRings.js`/`gizmoSixArrows.js`/
    `gizmoScaleBalls.js`): modul gizmo punya komentar header 50–100+ baris
    yang menjelaskan setiap keputusan teknis (kenapa mirror pakai rotasi
    180° thd sumbu PERPENDICULER, kenapa material HARUS di-share bukan
    di-clone, kenapa bola rotate ikut kamera-align, dsb). **BACA DULU
    sebelum mengubah** — kontrak Bagian 2 sudah menegaskan ini, tapi
    AI pemula sering treat komentar panjang sebagai "noise" dan hapus.
    Itu BUKAN dead code, itu WARISAN pengalaman mahal dari AI sebelumnya.
    Saat hapus elemen UI di file yang punya komentar panjang, JANGAN
    sentuh komentar — fokus murni ke elemen target. Di kasus hapus badge
    "bawaan", komentar di `gizmoRotateRings.js:7` ("bawaan Three.js")
    TIDAK tersentuh meski match grep-nya, karena kita pakai Edit tool
    dengan `old_str` spesifik ke `ScaleModeModal.jsx` saja.

---

## 11. WARISAN PENGALAMAN — sesi 2026-09-19 (server z.ai; job: tombol Batal & Konfirmasi simetris di ScaleModeModal)

80. **POLA SIMETRIS 2-TOMBOL DI FLEXBOX: `flex: 1` di kedua anak + hapus `justifyContent`**
    (sesi 2026-09-19, commit `3e9b65c`): kasus = tombol "Batal" (kiri) dan
    "Konfirmasi" (kanan) di footer modal ScaleModeModal. Sebelum: keduanya
    content-driven (lebar = content + padding), container punya
    `justifyContent: 'flex-end'` yang meng-grup keduanya di kanan → Batal
    pendek, Konfirmasi panjang, tidak rata. Solusi minimal (Aturan #5):
    (1) tambah `flex: 1` di awal style kedua tombol, (2) hapus
    `justifyContent: 'flex-end'` di container (sebab jadi no-op ketika
    kedua anak flex:1, biarkan jadi dead context misleading). Hasil:
    tiap tombol = `(containerWidth - gap) / 2` = simetris 50:50, Batal
    otomatis kiri (anak flex pertama), Konfirmasi kanan. **Pitfall
    penting**: padding berbeda antar tombol (mis. `10px 20px` vs
    `10px 24px`) TIDAK memengaruhi lebar akhir saat `flex:1` aktif —
    flex stretch men-supersede content/padding dalam perhitungan
    lebar. Padding beda hanya menggeser text dalam tombol. Jadi kalau
    user komplain "text Batal mepet pinggir" tapi lebar tombol sudah
    sama, fix-nya samakan padding (bukan flex). **Alternatif yang
    juga valid tapi LEBIH besar perubahan**: grid 2-kolom
    (`gridTemplateColumns: '1fr 1fr'`) atau width `calc(50% - 6px)`
    eksplisit — tapi Aturan #5 "ubah sekecil mungkin" → pilih flex:1.

    Verifikasi: perubahan layout flexbox murni (tidak sentuh material
    Three.js, tidak sentuh rendering visual geometri) → vite build
    exit 0 CUKUP. Tidak perlu vision_analyze (bukan fix dari gambar
    referensi) atau uji pixel (delta layout terprediksi via logika
    CSS flexbox, bukan rendering subpixel yang butuh bukti pixel).
    Sudah ditampung di butir 75 ("VERIFIKASI FIX UI TEXT-ONLY") —
    aturan serupa berlaku: untuk fix UI murni yang dampak visualnya
    terprediksi lewat logika CSS, vite build exit 0 = cukup bukti.

---

## 12. WARISAN PENGALAMAN — sesi 2026-09-19 (server z.ai; job: varian picker ScaleModeModal + Batal/Konfirmasi, hapus X)

81. **WAJIB CEK FLOW CALLER SEBELAUM UBAH FLOW KOMPONEN MODAL**
    (sesi 2026-09-19, commit `742e3a6`): saat user minta tambah
    Batal/Konfirmasi ke varian picker ScaleModeModal, terlihat simple
    (cuma tambah footer). Tapi flow lama varian picker = "klik kartu
    langsung apply + tutup modal" — kalau footer ditambah tanpa ubah
    flow kartu, footer jadi useless (modal sudah tutup saat klik kartu,
    Batal/Konfirmasi tidak pernah diklik). Maka wajib samakan flow
    picker = onboarding (klik kartu = setSelected highlight, Konfirmasi
    = apply, Batal = tutup tanpa apply). **SEBELAUM ubah**: baca caller
    (BlockSimulator3D.jsx baris 589-610) — `handleScaleModeConfirm`
    sudah support apply-mode-tanpa-kunci untuk varian picker, dan
    `handleScaleModeCancel` sudah support tutup-tanpa-apply untuk
    varian picker. Hasil: caller TIDAK tersentuh sama sekali, hanya
    komponen ScaleModeModal yang berubah. **Pelajaran**: untuk tugas
    "tambah tombol ke varian X", cek dulu: (a) apakah flow kartu-moda
    langsung apply = Ya? → ubah ke setSelected; (b) apakah handler
    caller sudah support flow pilih-konfirmasi? → kalau Ya, tidak perlu
    sentuh caller; kalau Tidak, wajib sentuh caller.

82. **JEBAKAN HAPUS ELEMEN UI + UBAH FLOW = KONSEKUENSI BERJALAN**
    (sesi 2026-09-19, commit `742e3a6`): hapus tombol X + tambah
    footer ke varian picker TIDAK cuma sentuh 2 elemen target. Ada
    5 konsekuensi otomatis yang ikut harus diupdate:
    (a) import `X` dari lucide-react jadi unused → hapus dari import
        (kalau tidak, lint warning);
    (b) text subtitle "Klik salah satu mode untuk langsung memakainya"
        (varian picker) jadi MISLEADING setelah flow diubah → harus
        samakan untuk kedua varian;
    (c) `marginBottom: isPicker ? 0 : 24` di grid 4-mode jadi salah —
        picker dulu 0 karena footer tidak ada, sekarang footer selalu
        ada → harus samakan ke 24 supaya grid tidak menempel ke footer;
    (d) komentar footer "HANYA varian onboarding — varian picker
        memakai mode langsung" jadi OUTDATED → harus update;
    (e) `{!isPicker && (` wrap + `)}` penutup harus hapus.
    **Pola**: setiap kali hapus elemen UI + ubah flow = cek SEMUA
    tempat yang punya kondisi `isPicker` (atau nama varian) di file
    yang sama, lalu untuk masing-masing tanya: apakah kondisi ini
    masih true setelah flow baru? Kalau tidak → update/hapus.
    Di kasus ini: 7 perubahan total, 2 inti (hapus X + hapus wrap
    footer) + 5 konsekuensi (import, text, marginBottom, komentar,
    onClick kartu).

83. **KOMENTAR HEADER PHASE LAMA = OUTDATED SETELAH FLOW UBAH, BISA DI-SKIP**
    (sesi 2026-09-19, commit `742e3a6`): komentar header Phase 73 v2
    (ScaleModeModal.jsx baris 23-40) menjelaskan "varian picker =
    klik mode langsung memakai + bisa ditutup lewat X/overlay/Escape".
    Setelah commit ini, flow tersebut TIDAK LAGI AKURAT (X dihapus,
    klik kartu jadi setSelected, footer ditambah). Namun komentar
    header TIDAK di-update di commit yang sama, dengan alasan:
    (a) Aturan #5 "ubah sekecil mungkin" — komentar header bukan
        kode fungsional, update-nya bisa di-skip tanpa efek runtime;
    (b) update komentar = sentuh baris 23-40 (20 baris komentar
        panjang) = perubahan lebih besar dari perubahan inti;
    (c) AI penerus yang baca komentar header tahu lihat kode
        sebenarnya, bukan asal percaya komentar.
    **Pola untuk AI penerus**: kalau baca komentar header Phase X yang
    menjelaskan flow/behavior yang TIDAK cocok dengan kode sebenarnya
    → kode yang menang. Komentar header = snapshot keputusan saat
    Phase itu; bisa outdated. Verifikasi: `git log --oneline -L:start,end:filename`
    untuk lihat kapan terakhir kali kode (bukan komentar) berubah.
    Tetap praktek baik: kalau flow berubah signifikan, catat di commit
    message bahwa komentar header outdated, agar AI penerus tahu.

84. **INDENTATION YANG TIDAK RAPI SETELAH HAPUS WRAP JSX = TIDAK FATAL**
    (sesi 2026-09-19, commit `742e3a6`): hapus `{!isPicker && (...
    <div>...</div>)}` wrap menyisakan `<button>` di dalam dengan
    indentation 14 spasi (seharusnya 10 spasi setelah wrap hilang).
    JSX tidak peduli indentation, vite build OK, tidak ada runtime
    error. Untuk Aturan #5 "ubah sekecil mungkin", re-indentasi 8+
    baris footer tidak dilakukan di commit yang sama — bisa terpisah
    di commit prettier/format kalau user/CI minta. **Pola**: jika
    indentasi rusak setelah edit, cek apakah (a) berdampak ke runtime
    → tidak, JSX whitespace-agnostic; (b) berdampak ke lint/CI →
    mungkin, tapi bisa fix di commit terpisah; (c) berdampak ke
    keterbacaan → ya, tapi reader yang paham JSX akan lihat struktur
    dari `</div>` penutup, bukan dari indentasi.

---

## 13. WARISAN PENGALAMAN — sesi 2026-09-19 (server z.ai; job: Phase 73 v3 — pecah tombol "+" jadi coming soon + gear buka modal)

85. **POLA PECAH TOMBOL JADI 2 PERAN: CEK CALLER + IKUT PATTERN TOAST YANG SUDAH ADA**
    (sesi 2026-09-19, commit `e4bd4ce`): user minta pecah tombol "+"
    lama (di GizmoBlockInfoPanel pojok kiri-atas kotak view) jadi 2:
    "+" di atas (coming soon), gear di bawah (buka modal ScaleMode
    — peran lama tombol +). Langkah yang BENAR:
    (1) Cari di mana tombol itu dirender + caller handler-nya
        (rg `handleOpenScaleModeFromPanel` → BlockSimulator3D.jsx
        baris 615-618, lalu rg `onOpenScaleMode` → komponen
        penerima = GizmoBlockInfoPanel.jsx baris 135).
    (2) Cek apakah handler caller sudah support peran baru tanpa
        modifikasi. Di kasus ini: `handleOpenScaleMode` sudah ada
        untuk peran "buka modal" → tinggal pakai ulang di tombol
        gear baru. Hanya perlu TAMBAH handler baru `handleComingSoon-
        Click` untuk peran coming soon (3 baris: `toast.info(...)`
        sonner). Caller tidak perlu ubah flow/modal — hanya tambah
        handler baru + pass prop baru.
    (3) Ikuti pattern toast yang sudah ada di project untuk coming
        soon: Binding/Property/BuildArea semua pakai
        `toast.warning(...)` / `toast.info(...)` sonner (baris 12519,
        12521, 15663, 15709, 23908). Jangan cari lib toast baru,
        jangan buat modal Coming Soon custom kecuali user minta
        eksplisit (di kasus ini user minta "tulisan coming soon" =
        toast cukup).
    (4) Untuk komponen panel: tambah prop baru `onComingSoon = null`
        (default null supaya aman kalau caller belum passing),
        JANGAN ubah signature prop lama.
    (5) Tambah komentar header Phase X v(N+1) yang jelaskan
        sejarah perubahan tombol — AI penerus baca komentar header
        untuk paham kenapa tombol + sekarang = coming soon padahal
        komentar Phase X vN bilang "+" = buka modal.

86. **PITFALL: KOMENTAR HEADER PHASE LAMA SEMAKIN OUTDATED TIAP KALI ADA Phase VERSI BARU**
    (sesi 2026-09-19, commit `e4bd4ce`, kelanjutan butir 83):
    ScaleModeModal.jsx baris 23-40 (komentar Phase 73 v2) menyebut
    "tombol + di panel" yang membuka modal. Setelah Phase 73 v3,
    tombol + di panel TIDAK LAGI membuka modal (sekarang coming
    soon), yang membuka modal = tombol gear. Komentar Phase 73 v2
    jadi LEBIH outdated. Tapi tetap TIDAK di-update untuk minimal
    change — prinsip butir 83 berlaku: komentar header = snapshot,
    bisa outdated, AI penerus yang baca kode sebenarnya yang
    menang. **Pelajaran lintas-Phase**: setiap kali ada Phase X v
    (N+1) yang mengubah flow yang dijelaskan di komentar header
    Phase X vN, komentar itu BERTAMBAH outdated — tidak masalah
    selama kode jalan + ada komentar Phase X v(N+1) di file/loasi
    yang sama yang jelaskan flow baru. AI penerus WAJIB baca
    komentar Phase TERBARU yang relevan, bukan komentar Phase
    versi awal. Untuk project Babftss: kalau baca komentar header
    ScaleModeModal.jsx, SELALU cross-check dengan komentar header
    GizmoBlockInfoPanel.jsx (karena komponen tombol + / gear ada
    di sana, bukan di ScaleModeModal).

87. **HITUNG POSISI TOMBOL BARU SECARA MANUAL: TOP = TOP_LAMA + HEIGHT_LAMA + GAP**
    (sesi 2026-09-19, commit `e4bd4ce`): untuk tambah tombol baru
    DI BAWAH tombol lama yang position absolute, rumus manual:
    `top_baru = top_lama + height_lama + gap_yang_diinginkan`.
    Di kasus ini: tombol + lama di `top:6 left:6`, height 26px →
    berakhir di y = 6 + 26 = 32. Jarak 6px (sama dengan padding
    parent) → top gear = 32 + 6 = 38. Verifikasi container parent:
    `minHeight: 96` di kotak view (baris 128) → total vertical
    space = 96. Tombol + (6-32) + gear (38-64) = 64px terpakai,
    sisa 32px untuk content image. Aman, tidak overflow.
    **Pola**: SELALU cek `minHeight`/`height` container parent
    sebelum tambah tombol absolute baru. Kalau container terlalu
    pendek, tombol bisa overflow ke content di bawahnya (image
    block, label, dll). Kalau overflow, opsinya: (a) tambah
    `minHeight` container, atau (b) pakai posisi lain (kanan/bawah
    container), atau (c) pakai layout flex/grid bukan absolute.

88. **KOMENTAR HEADER Phase X vN INLINE DI KODE = WARISAN INLINE, BUKAN HANYA DI KONTRAK**
    (sesi 2026-09-19, commit `e4bd4ce`): komentar header Phase 73
    v3 di GizmoBlockInfoPanel.jsx (14 baris) ditulis lengkap:
    sejarah perubahan tombol (v1 popup kecil → v2 buka modal megah
    → v3 pecah jadi + coming soon + gear buka modal) + alasan
    kenapa komentar Phase 73 v2 di ScaleModeModal.jsx tidak
    di-update. Ini implementasi Aturan #9 (Warisan Pengalaman)
    SECARA INLINE di kode, selain di KONTRAK_PERMANEN.md. Komentar
    header inline = yang pertama dibaca AI penerus saat buka file
    tsb (sebelum baca kontrak penuh). **Pola**: untuk perubahan
    yang punya sejarah versi (Phase X v1 → v2 → v3), WAJIB tulis
    komentar header inline yang jelaskan: (a) apa yang berubah di
    versi ini, (b) kenapa, (c) apa yang TIDAK berubah (supaya AI
    penerus tidak salah sentuh), (d) cross-reference ke file/kontrak
    lain yang terkait. Komentar inline bukan pengganti kontrak —
    kontrak tetap sumber kebenaran tertinggi (Aturan #1), komentar
    inline = shortcut kontekstual per-file.

---

## 14. WARISAN PENGALAMAN — sesi 2026-09-19 (server z.ai; job: Phase 74 — modal ScaleNumberModal input scale dalam studs)

89. **AUDIT FONDASI MATEMATIKA SEBELUM PAKAI: JALANKAN TEST FILE**
    (sesi 2026-09-19, commit `c455b03`): user minta fitur input scale
    dalam studs + minta cek "sistem matematika perhitungan studs udah
    bener belum dan apakah udah layak dijadikan acuan fondasi". Langkah
    yang BENAR sebelum implement fitur yang pakai fondasi tsb:
    (1) Baca helper resmi (`src/utils/blockStuds.js`) — pastikan
        konstanta `STUDS_PER_BLOCK = 2` MUTLAK (sesuai kontrak bab
        STANDAR PENGUKURAN STUDS) + formula `studs = 2 × |scale|` +
        inverse `scale = studs / 2`.
    (2) Baca test file (`test_blockStuds.mjs`) — 11 asersi,
        termasuk edge case (scale null, kaca mirror −x, urutan
        P/L/T, clamp 0.05).
    (3) JALANKAN test: `node test_blockStuds.mjs` → exit 0 + output
        "RESULT 11/11". Itu BUKTI fondasi terverifikasi sebagai
        sumber kebenaran.
    (4) Kalau test FAIL → FIX fondasi dulu, JANGN implement fitur
        baru di atas fondasi rusak. Kalau test PASS → pakai helper
        + konstanta, JANGAN duplikasi formula manual di kode baru.
    **Pelajaran**: untuk fitur yang konsumsi fondasi matematika
    (studs/scale/dimensi block), WAJIB audit fondasi dulu + re-run
    test sebelum & sesudah implement fitur. Bukan opsional — ini
    jaminan fitur tidak menimbulkan bug karena salah konversi. Di
    kasus Phase 74: test_blockStuds.mjs 11/11 PASS sebelum & sesudah
    commit `c455b03` = fondasi tidak rusak, fitur aman di atasnya.

90. **POLA MODAL "SAMA PERSIS DESIGNNYA" = COPY STRUKTUR, GANTI BODY**
    (sesi 2026-09-19, commit `c455b03`): user minta modal baru
    (ScaleNumberModal) yang "sama persis seperti" ScaleModeModal
    (Phase 73) — overlay blur, panel amber, header, footer Batal+
    Konfirmasi. Cara BENAR:
    (a) Baca ScaleModeModal.jsx penuh (~302 baris) untuk paham
        struktur: style block, keyframes, animasi, ACCENT konstanta,
        PANEL_BG, ANIM_MS.
    (b) Tulis modal baru dengan struktur yang SAMA — copy overlay
        style, panel style, header style, footer style. JANGAN
        duplikasi konstanta (ACCENT, PANEL_BG, ANIM_MS) — pakai
        nilai yang sama persis supaya design system konsisten.
    (c) Ganti hanya BODY modal: ScaleModeModal punya grid 4 mode,
        ScaleNumberModal punya input field + tabel konversi.
    (d) **WAJIB**: keyframes CSS ber-prefix BERBEDA (`scalenum-*`
        vs `scalemode-*`) supaya tidak tabrakan @keyframes. Test:
        vite build OK + visual kedua modal tidak saling override
        animasi.
    (e) Default value: ambil dari current state target (di kasus
        ini, current scale block yang di-attach ke gizmo) — lebih
        UX-friendly daripada hardcoded default. Pattern: saat
        handler open modal dipanggil, baca `tc.object.scale` →
        konversi ke studs → set sebagai initial value input.

91. **APPLY SCALE VIA `obj.scale.setScalar(value)` — PATTERN YANG SUDAH ADA**
    (sesi 2026-09-19, commit `c455b03`): untuk apply scale ke block
    yang sedang di-attach ke gizmo (tc.object), pakai
    `obj.scale.setScalar(studs / STUDS_PER_BLOCK)` + `obj.updateMatrixWorld()`.
    - `setScalar(v)` set x, y, z sekaligus ke `v` — konsisten untuk
      kubus block 1×1×1 (tidak perlu set x, y, z terpisah).
    - `updateMatrixWorld()` sinkron ke TransformControls supaya
      gizmo bola langsung pindah ke posisi baru (tanpa frame delay).
    - Pattern ini SUDAH DIPAKAI di file (baris 309, 338-339 pakai
      `tc.object` sebagai sourceBlock). Bukan API baru — ikuti
      pattern yang ada, jangan cari API lain.
    - **Penting**: jangan pakai `tc.setSize()` atau `tc.setSpace()`
      — itu API TransformControls untuk gizmo, BUKAN untuk block
      yang di-attach. Mengubah block = ubah `obj.scale` langsung.
    - Kalau tc.object null (tidak ada block yang di-attach) →
      toast.warning "Pilih block dulu" + return early, JANGN
      paksa apply (akan crash `Cannot read property 'scale' of null`).

92. **INPUT NUMBER FIELD: VALIDASI REAL-TIME + KONFIRMASI DISABLED saat invalid**
    (sesi 2026-09-19, commit `c455b03`): untuk modal dengan input
    number (ScaleNumberModal), pattern UX yang aman:
    (a) `useState(String(value))` untuk simpan input sebagai string
        (supaya user bisa ketik "0.5" tanpa auto-convert ke number
        yang truncate). Parse `parseFloat(input)` saat Konfirmasi.
    (b) Validasi real-time: `const valid = !isNaN(parsed) &&
        parsed >= MIN && parsed <= MAX`. Tampilkan pesan error
        inline (merah) kalau invalid + disable tombol Konfirmasi
        (`disabled={!valid}` + cursor 'not-allowed').
    (c) Hasil konversi real-time: tampilkan "= scale factor X" +
        "= Y block" supaya user lihat efek input sebelum Konfirmasi.
        Pakai `STUDS_PER_BLOCK` untuk konversi (JANGAN hardcode
        `2` — konstanta dari helper).
    (d) `autoFocus` di input supaya user bisa langsung ketik tanpa
        klik tambahan.
    (e) Enter key = Konfirmasi: `onKeyDown` cek `e.key === 'Enter'`
        + valid → finishClose + onConfirm.
    (f) `inputMode="decimal"` + `step={0.25}` + `min/max` supaya
        mobile keyboard muncul numeric + arrow ↑↓ tambah/kurang
        0.25 studs per step.
    **Pelajaran**: untuk modal yang minta input numerik user,
    JANGAN trust input apa adanya. Selalu validasi + disable
    Konfirmasi saat invalid + tampilkan pesan error. Tanpa ini,
    user bisa input "abc" atau "-5" → parseFloat NaN → apply
    `NaN / 2 = NaN` ke obj.scale → block lenyap (Three.js tidak
    crash, tapi block jadi invisible karena scale NaN).

93. **KOMENTAR HEADER PHASE LAMA OUTDATED SEMAKIN PARAH TIAP Phase VERSI BARU (CYCLE)**
    (sesi 2026-09-19, commit `c455b03`, kelanjutan butir 83 & 86):
    komentar header Phase 73 v3 di GizmoBlockInfoPanel.jsx baris
    55-67 yang bilang tombol + = "coming soon" sekarang OUTDATED
    lagi (Phase 74 ganti tombol + = buka modal ScaleNumberModal).
    Siklus: Phase 73 v1 → v2 → v3 → Phase 74 → ... tiap versi
    baru membuat komentar versi sebelumnya bertambah outdated.
    Tetap TIDAK di-update untuk minimal change (prinsip butir 83).
    AI penerus: baca komentar Phase TERBARU yang relevan + cross-
    check kode sebenarnya. Untuk tombol + di GizmoBlockInfoPanel:
    flow terkini (sejak Phase 74) = buka modal ScaleNumberModal
    (input studs). Komentar Phase 73 v3 yang bilang "coming soon"
    = outdated; komentar Phase 74 di BlockSimulator3D.jsx baris
    631-640 = yang akurat. **Pola lintas-Phase**: kalau komentar
    header di file A (GizmoBlockInfoPanel) menyebut flow yang
    implementasi-nya di file B (BlockSimulator3D), cross-check
    komentar di file B untuk versi TERBARU.

---

## 15. WARISAN PENGALAMAN — sesi 2026-09-19 (server z.ai; job: FIX bug layar buram ScaleNumberModal Phase 74)

94. **BUG KLASIK: LUPA PANGGIL `setShowXxxModal(false)` DI HANDLER CONFIRM → OVERLAY BLUR TETAP DI LAYAR → USER STUCK**
    (sesi 2026-09-19, fix commit `e7c1d92` untuk bug Phase 74 commit
    `c455b03`): ScaleNumberModal (modal baru Phase 74) punya bug:
    setelah user klik Konfirmasi, layar jadi buram (overlay
    `rgba(0,0,0,0.75) + backdropFilter blur(8px)` tetap dirender) +
    user tidak bisa interaksi apa pun lagi. Akar masalah: handler
    caller `handleScaleNumberConfirm(studs)` di BlockSimulator3D.jsx
    TIDAK memanggil `setShowScaleNumberModal(false)` di akhir.
    Akibatnya state `showScaleNumberModal` tetap true → React tidak
    unmount modal → overlay div tetap di DOM dengan opacity 0 (animasi
    keluar sudah selesai) TAPI backdrop blur tetap menutupi layar.
    zIndex overlay = 1100, di atas semua UI → user tidak bisa klik
    apa pun. User harus refresh halaman untuk keluar.
    **Cara detect bug ini** (sebelum user komplain): saat implement
    modal baru + handler confirm baru, CROSS-CHECK pattern handler
    confirm yang sudah working di modal lain. Di kasus Phase 74,
    handler `handleScaleModeConfirm` (Phase 73, working) sudah punya
    `setShowScaleModeModal(false)` di baris 596 — pattern INI WAJIB
    diaplikasikan ke handler confirm modal baru.
    **Pola WAJIB untuk semua modal dengan overlay + state show**:
    ```jsx
    const handleXxxConfirm = (value) => {
      // 1. validasi + apply (mis. ke tc.object)
      // 2. tutup modal di SEMUA branch (sukses + error):
      setShowXxxModal(false);  // ← JANGAN LUPA
      // 3. feedback toast (sukses/warning)
    };
    ```
    Kalau ada branch `return early` (mis. `if (!obj) return;`) →
    panggil setter di SANA juga, bukan hanya di akhir handler.
    Handler onCancel (Batal) sudah biasa panggil setter (pola:
    `onCancel={() => setShowXxxModal(false)}` di JSX render). TAPI
    handler onConfirm (Konfirmasi) sering lupa — karena fokus ke
    logic apply. **Hati-hati khusus untuk modal yang punya overlay
    blur: bug ini tidak fatal di modal tanpa overlay (modal bisa
    di-klik lagi tanpa stuck), TAPI sangat fatal di modal dengan
    overlay blur karena user terkunci**.

95. **VITE BUILD EXIT 0 TIDAK = FITUR BEKERJA — WAJIB MENTAL SIMULATION FLOW USER**
    (sesi 2026-09-19, fix commit `e7c1d92`): Phase 74 commit
    `c455b03` di-verify via `vite build` exit 0 + test_blockStuds
    11/11 PASS → dianggap "selesai & terverifikasi". Tapi ternyata
    ada bug fatal (overlay tidak hilang setelah Konfirmasi) yang
    HANYA terlihat saat user benar-benar klik tombol + → input
    studs → klik Konfirmasi. `vite build` hanya cek syntax valid +
    bundle ter-generate; TIDAK simulasi flow user + state changes.
    **Pelajaran**: untuk fitur yang melibatkan state modal +
    overlay + handler yang apply ke objek Three.js, WAJIB lakukan
    MENTAL SIMULATION flow user sebelum klaim selesai:
    (1) User klik tombol trigger → state setter dipanggil?
    (2) Modal render → visible?
    (3) User isi input → state input update?
    (4) User klik Konfirmasi → finishClose(callback) → callback
        dipanggil setelah ANIM_MS (200ms) → handler confirm
        dijalankan → logic apply + STATE SETTER MODAL TUTUP
        DIPANGGIL?
    (5) Modal unmount → overlay hilang → user bisa interaksi lagi?
    Kalau salah satu step ini LUPA (terutama step 4 — setter modal
    tutup), bug fatal yang tidak ketangkap vite build. Karena itu
    **wajib jalankan mental simulation flow user + cek apakah
    SETiap branch handler confirm (sukses + error) memanggil setter
    state modal tutup**. Kalau server AI tidak punya akses Chrome
    headless + GPU untuk visual test, MINIMUM WAJIB mental
    simulation flow + catat eksplisit di laporan bahwa visual test
    belum dilakukan (kejujuran Aturan #6). Jangan klaim "selesai
    & terverifikasi" kalau cuma vite build exit 0 — itu cuma
    bukti syntax, bukan bukti fitur jalan.
    **Untuk project Babftss server z.ai**: server tidak punya akses
    ke Telegram bot user (untuk kirim screenshot bukti ke user)
    + tidak punya Chrome headless + GPU untuk visual test. Maka
    MINIMUM verifikasi yang bisa dilakukan: vite build exit 0 +
    test fondasi (test_blockStuds.mjs) + mental simulation flow.
    Visual test HARUS dilakukan user di local dev. AI server
    WAJIB catat eksplisit bahwa visual test belum dilakukan +
    saran user coba di local dev. Ini bukan kegagalan AI — ini
    keterbatasan environment. TAPI mental simulation flow WAJIB
    dilakukan AI server sebelum push.

96. **DUPLIKASI MODAL = WAJIB DUPLIKASI PATTERN HANDLER CALLER, BUKAN HANYA KOMPONEN**
    (sesi 2026-09-19, fix commit `e7c1d92`, kelanjutan butir 90):
    saat buat modal baru (ScaleNumberModal) dengan "sama persis
    designnya" dengan modal yang sudah ada (ScaleModeModal),
    AI biasanya fokus copy STRUKTUR KOMPONEN (overlay, panel,
    header, footer, keyframes). TAPI yang SERING LUPA: copy PATTERN
    HANDLER CALLER. Di Phase 74, ScaleNumberModal komponen dibuat
    sama persis (animasi, ACCENT, PANEL_BG, footer flex:1) — bagus.
    TAPI handler caller `handleScaleNumberConfirm` tidak ikuti
    pattern `handleScaleModeConfirm` (yang panggil setter state
    tutup di akhir). Hasilnya: bug layar buram.
    **Pola WAJIB untuk duplikasi modal**: saat copy modal A →
    modal B, copy JUGA pattern caller:
    - handler confirm A: `setShowModalA(false)` + toast + logic
      apply → handler confirm B WAJIB: `setShowModalB(false)` +
      toast + logic apply.
    - handler cancel A: `setShowModalA(false)` → handler cancel
      B WAJIB: `setShowModalB(false)`.
    - state show A: `const [showModalA, setShowModalA] = useState
      (false)` → state show B WAJIB sama.
    - render JSX A: `{showModalA && (<ModalA ... onConfirm=
      {handlerConfirmA} onCancel={() => setShowModalA(false)} />)}
      ` → render JSX B WAJIB sama pattern.
    **Checklist saat duplikasi modal** (tambahkan ke mental
    simulation butir 95):
    - [ ] Komponen modal baru copy struktur (overlay/panel/header/
      footer/keyframes ber-prefix beda) — ini biasanya tidak lupa.
    - [ ] State show baru + setter baru di-deklarasi di caller.
    - [ ] Handler confirm baru: panggil setter state tutup di
      SEMUA branch (sukses + error) — INI YANG SERING LUPA.
    - [ ] Handler cancel baru (atau inline arrow function di
      onCancel prop): panggil setter state tutup.
    - [ ] Render JSX modal baru: conditional render pakai state
      show + pass onConfirm/onCancel.
    Kalau salah satu checklist LUPA → bug. Untuk modal dengan
    overlay blur, lupa checklist #3 = bug fatal (user stuck).

---

## 16. WARISAN PENGALAMAN — sesi 2026-09-19 (server z.ai; job: Phase 75 — fix snap scale studs, ubah ScaleNumberModal dari SET langsung ke STEP)

97. **SALAH INTERPRETASI PERMINTAAN USER = AKAR BUG FATAL**
    (sesi 2026-09-19, fix commit `6daaa3d` untuk bug Phase 74 commit
    `c455b03`): user Phase 74 tulis: "jika user menginput scale
    number = 2 studs maka jika user MENCoba scale dia akan BERTAMBAH
    2 block dan BERKURANG 2 block". Saya salah baca sebagai:
    "input 2 studs = SET langsung scale ke 2 studs (= 1 block)".
    Implementasi Phase 74: obj.scale.setScalar(studs / STUDS_PER_BLOCK)
    saat Konfirmasi. Ternyata user maksud: input 2 studs = STEP
    untuk drag bola gizmo, saat drag block snap ke kelipatan 2 studs.
    Akar masalah: asumsi saya tanpa konfirmasi ulang ke user. Kata
    "mencoba scale" = drag, bukan SET. Kata "bertambah/berkurang per
    step" = snap. **Pelajaran**: kalau permintaan user ambigu (bisa
    diinterpretasi 2+ cara), JANGAN asumsi. Baca ulang dengan teliti
    + cek kata kunci ("mencoba" = interaksi, "step" = snap, "set" =
    langsung). Kalau masih ragu, TANYA user atau pilih interpretasi
    yang paling sesuai dengan behavior yang sudah ada di project (di
    kasus ini, project punya `applyScaleByMode` yang menerima `ratio`
    drag → pakai pola yang sama: step + snap, bukan SET langsung).
    Implementasi Phase 74 (SET langsung) melanggar pola project —
    seharusnya pakai pattern `applyScaleByMode` dengan parameter
    snap tambahan, bukan bypass ke `obj.scale.setScalar`.

98. **MENTAL SIMULATION FLOW WAJIB SAMPAI STEP DRAG UNTUK FITUR HOOK EVENT THREE.JS**
    (sesi 2026-09-19, fix commit `6daaa3d`, kelanjutan butir 95):
    Phase 74 commit `c455b03` lolos verifikasi via `vite build` exit 0
    + `test_blockStuds.mjs` 11/11 PASS + mental simulation flow
    KLIK TOMBOL + → MODAL → KONFIRMASI (yang fix bug layar buram
    commit `e7c1d92`). TAPI TIDAK mental simulation flow DRAG BOLA
    GIZMO SETELAH Konfirmasi. Hasilnya: bug snap tidak ketangkap
    sampai user coba sendiri + komplain "drag tidak ada efek step".
    **Pelajaran**: untuk fitur yang melibatkan hook ke event Three.js
    (`objectChange`, `dragging-changed`, `mouseUp`), mental simulation
    flow WAJIB sampai step DRAG, bukan cuma sampai modal tutup.
    Checklist mental simulation extended (tambah butir 95):
    (1) User klik tombol trigger → state setter dipanggil?
    (2) Modal render → visible?
    (3) User isi input → state input update?
    (4) User klik Konfirmasi → finishClose(callback) → callback
        dipanggil setelah ANIM_MS → handler confirm dijalankan →
        logic apply + STATE SETTER MODAL TUTUP DIPANGGIL?
    (5) Modal unmount → overlay hilang → user bisa interaksi lagi?
    (6) **BARU Phase 75**: User DRAG bola gizmo → event Three.js
        fire (objectChange/dragging-changed) → handler baca
        `scaleNumberStepRef.current` (BUKAN state, karena event
        handler closure dibuat sekali di useEffect awal) →
        applyScaleByMode dipanggil dengan snapStudStep → snap
        aktif? Block scale berubah per step?
    (7) **BARU Phase 75**: Drag selesai → cleanup snapshot +
        scaleDragRef = null → snap tidak aktif lagi (sampai user
        drag lagi dengan snapshot baru).
    Kalau salah satu step ini LUPA → bug. Untuk Phase 74, step 6-7
    TIDAK di-mental-simulation → bug snap tidak ketangkap.

99. **PATTERN SNAP RELATIF KE startScale (BUKAN ABSOLUTE) — SUPAYA BLOCK TIDAK MELOMPAT**
    (sesi 2026-09-19, fix commit `6daaa3d`): implementasi snap di
    `applyScaleByMode` (scaleModes.js). Snap RELATIF ke
    `startScale[axis]` (bukan absolute ke kelipatan step):
    ```javascript
    const delta = raw - startScale[a];        // perubahan dari awal
    const snappedDelta = Math.round(delta / stepScale) * stepScale;
    const finalScale = sgn * Math.max(Math.abs(s0 + snappedDelta), minAbs);
    ```
    Kenapa RELATIF (bukan absolute `Math.round(raw / stepScale) *
    stepScale`):
    - Kalau startScale BUKAN kelipatan stepScale (mis. user sudah
      di-scale ke 0.5, lalu set step 2 studs = stepScale 1.0), snap
      absolute akan MELOMPAT dari 0.5 ke 1.0 mendadak saat user
      drag sedikit. Snap relatif: 0.5 → delta=0 → snappedDelta=0
      → finalScale=0.5 (tidak berubah sampai user drag cukup).
    - Behavior natural: user tidak drag → block tetap di posisi
      awal. User drag sedikit (< 0.5*stepScale) → block tetap.
      User drag >= 0.5*stepScale → block naik/turun 1 step dari
      posisi awal.
    - Formula: `stepScale = snapStudStep / STUDS_PER_BLOCK`
      (studs → scale factor). Mis. step 2 studs → stepScale 1.0;
      step 0.5 studs → stepScale 0.25.
    - Minimum: `Math.max(|finalScale|, minAbs)` (minAbs = 0.05
      default, kontrak MIN_ABS_SCALE app). Block tidak bisa
      mengecil lebih kecil dari 0.05 (clamp Phase 67 v2).
    **Pola untuk fitur snap apapun**: snap relatif ke start state,
    bukan absolute ke grid. Kecuali kalau user eksplisit mau snap
    ke grid absolute (mis. snap block position ke cell center —
    itu absolute, pakai `Math.floor(x) + 0.5` di onTransformObject-
    Change baris 12506-12509). Tapi untuk scale, relatif lebih alami.

100. **STATE REACT VS REF UNTUK EVENT HANDLER YANG DIBUAT SEKALI DI useEffect**
    (sesi 2026-09-19, fix commit `6daaa3d`): event handler Three.js
    (`onTransformObjectChange`, `onTransformDraggingChanged`) di-bind
    ke `transformControls` saat scene setup di `useEffect` awal.
    Handler ini = CLOSURE dengan nilai state React saat useEffect
    dijalankan. Saat state berubah (mis. user set step baru lewat
    modal), handler TIDAK otomatis baca nilai terbaru — closure
    masih pegang nilai lama. **Pola WAJIB**: state + ref + useEffect
    sync, persis seperti `scaleModeRef` yang sudah ada di project
    (baris 566, 592):
    ```javascript
    const [scaleNumberStep, setScaleNumberStep] = useState(null);
    const scaleNumberStepRef = useRef(null);
    useEffect(() => { scaleNumberStepRef.current = scaleNumberStep; },
      [scaleNumberStep]);
    // Di event handler: baca scaleNumberStepRef.current, BUKAN
    // scaleNumberStep langsung.
    ```
    Kenapa tidak pakai state langsung: closure handler pegang nilai
    saat useEffect awal (null), TIDAK update saat user set step baru.
    Snap tidak akan aktif walau user sudah Konfirmasi modal. Pakai
    ref: ref.current selalu baca nilai terbaru dari mana saja.
    **Pola lintas-project**: untuk state yang dipakai di event
    handler Three.js (bukan React event), WAJIB pakai ref + useEffect
    sync. State React hanya untuk trigger re-render UI (mis. modal
    show/hide). Untuk nilai yang dibaca di event handler non-React,
    pakai ref. Pattern ini sudah dipakai di project untuk:
    `scaleModeRef`, `scaleModeLockedRef`, `toolRef`, `threeRef`,
    `scaleDragRef`, `scaleNumberStepRef` (Phase 75 baru).

---

## 17. WARISAN PENGALAMAN — sesi 2026-09-19 (server z.ai; job: Phase 76 — fix default value modal + izinkan input 0/0.01/0.02)

101. **DEFAULT VALUE MODAL = STATE YANG USER SET SEBELUMNYA, BUKAN CURRENT STATE TARGET**
    (sesi 2026-09-19, fix commit `249de67` untuk bug Phase 74 commit
    `c455b03` + Phase 75 commit `6daaa3d`): ScaleNumberModal punya
    bug: saat user buka modal lagi setelah scale block ke 8 studs,
    default value input = 8 (current scale block), BUKAN step
    saat ini. User expect: default value = step yang user sudah
    set lewat Konfirmasi sebelumnya (mis. 2), bukan current scale
    block yang berubah saat user drag. Akar masalah: di
    handleComingSoonClick, saya baca `tc.object.scale` → konversi
    ke studs → set sebagai default value. Ini salah karena default
    value harusnya = state `scaleNumberStep` (yang persist di
    React state, tidak berubah saat user drag block).
    **Pola WAJIB untuk modal input yang punya state persist**:
    default value modal = `stateYangSudahDiset ?? defaultValueFallback`.
    Bukan `currentValueTarget` (yang berubah saat user interaksi
    dengan target). Alasan: user buka modal untuk SET nilai baru;
    kalau default value ikut current value target, user bingung
    "kok angkanya berubah padahal cuma mau ganti step?". Default
    value = state persist supaya user lihat step yang sedang aktif,
    lalu user bisa ganti atau biarkan.
    **Implementasi**:
    ```javascript
    // BENAR (Phase 76):
    setScaleNumberValue(scaleNumberStep ?? 2);  // state persist
    // SALAH (Phase 74, commit c455b03):
    setScaleNumberValue(Math.max(0.25, maxScale * STUDS_PER_BLOCK));
    // ↑ current scale block, berubah saat user drag
    ```

102. **JANGAN ASUMSI BATASAN MINIMUM INPUT KALAU USER TIDAK EKSPLISIT MINTA**
    (sesi 2026-09-19, fix commit `249de67`, kelanjutan butir 97):
    user Phase 74 tulis: "yang terkecil disini adalah 0! dimana
    jika user ingin scale nya menggunakan 0 studs maka tidak ada
    batasan sama sekali! jadi langsung lancar sembarangan tanpa
    terikat batasan matematika! dan dari 0 itu ada 0.01 0.02 0.03
    0.04 0.05 0.06 0.07 0.08 0.09 lalu jadi 0.1 0.2 0.3 0.4 dan
    seterusnya". Saya Phase 74 set MIN_STUDS = 0.25 karena takut
    block terlalu kecil sampai susah dilihat. Tapi user eksplisit
    mau 0 (no snap) + nilai kecil 0.01, 0.02, ... Saya asumsi
    "block terlalu kecil = buruk UX" tanpa konfirmasi user.
    Hasilnya: user komplain "kenapa 0.1 dilarang?".
    **Pelajaran**: untuk input numerik user, JANGAN asumsi
    batasan minimum. Pakai 0 (atau -Infinity kalau konteks
    butuhkan negatif) sebagai minimum default, KECUALI:
    (a) user eksplisit minta batasan (mis. "minimum 0.5 studs"),
    (b) ada kontrak/app constraint hard yang TIDAK bisa diubah
        (mis. MIN_ABS_SCALE app = 0.05 di blockScale.js yang
        mencegah block jebol/terbalik — itu safety net di
        applyScaleByMode, BUKAN di input modal).
    Input modal = UX layer (fleksibel, user control). Apply layer
    (applyScaleByMode) = safety layer (hard clamp, mencegah
    crash/visual bug). Jangan campur aduk: input modal boleh
    terima 0, apply layer tetap clamp ke minimum hard (0.05).
    User yang input 0.01 → snap aktif dengan stepScale 0.005 →
    saat drag mengecil, block di-clamp ke 0.05 (MIN_ABS_SCALE app).
    User lihat block tidak bisa mengecil lebih kecil dari 0.1 studs
    walau step 0.01 — itu behavior safety, BUKAN bug.

103. **POLA TOGGLE: INPUT 0 = MATIKAN FITUR, INPUT > 0 = AKTIFKAN**
    (sesi 2026-09-19, fix commit `249de67`): untuk fitur yang
    punya parameter numerik (step, threshold, dll), pola toggle
    lewat input 0 = pattern UX yang natural. User tidak perlu
    tombol "Aktifkan/Nonaktifkan" terpisah — cukup input 0 untuk
    matikan, input > 0 untuk aktifkan dengan nilai itu.
    Implementasi di applyScaleByMode (scaleModes.js): check
    `if (snapStudStep && snapStudStep > 0 && isFinite(snapStudStep))`
    → kalau snapStudStep = 0 atau null → check = false → snap
    tidak aktif. Tidak perlu khusus set null kalau user input 0;
    angka 0 otomatis = off lewat check `> 0`.
    Di caller (BlockSimulator3D.jsx): `setScaleNumberStep(studs)`
    langsung — kalau 0, state = 0 (BUKAN null). useEffect sync ref.
    applyScaleByMode call menerima `sd.snapStudStep = 0` → snap
    off. Behavior konsisten: 0 = off, > 0 = on.
    **Pola untuk fitur lain yang punya parameter numerik** (snap,
    threshold, multiplier, dll): pakai check `value > 0` (atau
    `value !== 0` kalau negatif valid) sebagai toggle otomatis.
    Tambah toast beda untuk 0 vs > 0 supaya user tahu behavior
    yang aktif:
    ```javascript
    if (studs === 0) {
      toast.success('Snap dimatikan — drag bebas');
    } else {
      toast.success(`Step diset ke ${studs} studs — drag untuk snap`);
    }
    ```
    **Pelajaran**: kalau fitur punya parameter numerik, pertimbangkan
    0 = toggle off. Lebih UX-friendly daripada tombol checkbox
    "Aktifkan" terpisah + input field. User input 0 = matikan,
    input angka lain = aktifkan dengan nilai itu. SATU kontrol
    untuk dua fungsi (toggle + value).

---

## 18. WARISAN PENGALAMAN — sesi 2026-09-19 (server z.ai; job: Phase 77 — fix goyang saat snap + 3 desimal + koma→titik)

104. **BUG GOYANG: SNAP + computeAnchorOffset = CONFLICT, SKIP computeAnchorOffset saat snap aktif**
    (sesi 2026-09-19, fix commit `9c953ab` untuk bug Phase 75
    commit `6daaa3d`): user komplain "scale menjadi kecil tiba
    tiba blocknya goyang goyang bergetar sampai yang paling parah
    bergeser dari posisi awal". Akar masalah: `computeAnchorOffset`
    (mode 1 side) dijalankan SETIAP FRAME dengan offset =
    `(scaleNew - startScale) × halfSize`. Saat snap lompat antar
    step (karena user drag), `scaleNew` berubah cepat → offset
    berubah cepat → posisi block berubah cepat = GOYANG. Saat scale
    membesar, offset positif (ke arah sisi +); saat mengecil,
    offset negatif (ke arah sisi −). Lompatan offset lebih terlihat
    saat mengecil karena delta negatif lebih besar magnitude-nya
    untuk step yang sama (user drag mengecil sampai 0.05 = delta
    -1.95 dari startScale 2, lompatan offset -0.975; user drag
    membesar sampai 4 = delta +2, lompatan offset +1.0 — tapi
    membesar terlihat natural karena block membesar searah).
    **Fix**: skip `computeAnchorOffset` saat snap aktif. Tambah
    `const snapActive = snapStudStep && snapStudStep > 0 &&
    isFinite(snapStudStep)` di atas. Ubah check dari
    `if (needsAnchorOffset(m) && startPos)` →
    `if (needsAnchorOffset(m) && startPos && !snapActive)`.
    Behavior: snap aktif = block scale dari PUSAT (mode 2 side
    behavior), posisi TIDAK bergeser setiap frame → tidak goyang.
    **Trade-off**: mode 1 side + snap aktif = sisi seberang TIDAK
    diam (behavior 2 side). User pilih mode 1 side TANPA snap
    (step=0) kalau mau sisi seberang diam. Prioritas: snap >
    sisi seberang diam. Document di komentar Phase 77 di
    scaleModes.js.
    **Pola untuk fitur snap + offset posisi**: kalau snap
    menyebabkan scale lompat antar step, JANGAN pakai scale untuk
    hitung offset posisi setiap frame (akan goyang). Cuma hitung
    offset saat drag SELESAI (mouseUp), atau skip offset saat snap
    aktif. Untuk project Babftss: skip dipilih karena simpler +
    tidak ubah flow event Three.js.

105. **INPUT NUMERIK: type="text" + inputMode="decimal" + manual onChange = KONTROL PENUH**
    (sesi 2026-09-19, fix commit `9c953ab`): ScaleNumberModal input
    field awalnya `type="number"`. User mau koma "," diganti titik
    "." paksa. Tapi `type="number"` di browser beda-beda locale:
    beberapa browser (locale EU) terima koma sebagai decimal
    separator, beberapa (locale US/ID) tidak. Untuk konsisten
    lintas-browser + handle koma→titik manual: ganti ke
    `type="text" inputMode="decimal"` + manual onChange:
    ```jsx
    <input
      type="text"
      inputMode="decimal"
      placeholder="0.001 - 100"
      value={input}
      onChange={(e) => {
        const v = e.target.value.replace(/,/g, '.');
        setInput(v);
      }}
      // ...
    />
    ```
    - `type="text"`: kontrol penuh, simpan apa adanya string.
    - `inputMode="decimal"`: mobile keyboard muncul numeric
      dengan tombol titik (bukan huruf).
    - `placeholder="0.001 - 100"`: hint format yang user harap.
    - `onChange` replace `,` → `.`: koma diubah paksa jadi titik.
    **Trade-off**: hilang fitur arrow ↑↓ bawaan type=number
    (browser arrow tambah/kurang step). User bisa pakai keyboard
    arrow normal di text field (kurang lebih sama UX). Acceptable
    supaya koma→titik jalan konsisten lintas-browser.
    **Pola untuk input numerik user dengan transformasi (koma→
    titik, auto-trim, dll)**: pakai type="text" + manual onChange
    + validasi parseFloat. JANGAN pakai type="number" kalau butuh
    transformasi value (locale issue + cursor jump + value
    coercion). Untuk validasi: cek `!isNaN(parseFloat(input)) &&
    isFinite(parseFloat(input))`.

106. **VALIDASI MAKSIMAL N ANGKA DI BELAKANG KOMA: input.split('.')[1].length > N**
    (sesi 2026-09-19, fix commit `9c953ab`): user mau input maks
    3 desimal (0.001 valid, 0.0001 invalid). Implementasi:
    ```javascript
    const decimalPart = (typeof input === 'string' && input.includes('.'))
      ? input.split('.')[1] || ''
      : '';
    const hasMoreThan3Decimals = decimalPart.length > 3;
    const valid = isNumber && parsed >= MIN_STUDS && parsed <= MAX_STUDS
      && !hasMoreThan3Decimals;
    ```
    **PENTING**: validasi pakai INPUT STRING, BUKAN `parsed`
    (parseFloat). Karena parseFloat buang trailing zero:
    `parseFloat("1.500") = 1.5` → kalau pakai `parsed.toString().
    split('.')[1]`, length=1, padahal user input 3 angka. Pakai
    input string asli → length=3 untuk "1.500".
    **Edge case**: "1." (titik tanpa angka setelahnya) →
    `split('.')[1] = ''` → length=0 → valid (sebenarnya tidak
    parseable jadi parseFloat=NaN → isNumber=false → invalid lewat
    check lain). "1.5" → length=1 → valid. "1.500" → length=3 →
    valid. "1.5001" → length=4 → invalid. "1" (integer) →
    `input.includes('.') = false` → decimalPart='' → length=0 →
    valid. OK behavior benar.
    **Pola untuk limit desimal di input**: pakai input string +
    split('.')[1].length. JANGAN pakai parsed number (trailing
    zero hilang). JANGAN pakai regex complex (lebih sulit debug).
    Penunjuk/hasil konversi (toFixed, dll) boleh banyak angka —
    cuma INPUT yang dibatasi N desimal. User Phase 77 eksplisit:
    "di penunjuk scale bahkan mungkin bisa banyak angka dibelakang
    koma itu diperbolehkan karena itu hanya sekedar penunjuk saja".









