# PROMPT KERJA — 3D BLOCK SIMULATOR, BAGIAN 1: PERBAIKAN FONDASI

> **WAJIB DIBACA DULU:** `instruction.md`, `design.md`, `memory.md` (baca bagian-bagian tentang `BlockSimulator3D` sebelumnya), `RULES_AUTONOMI_QWEN.md`, `RULES_KESELAMATAN_GIT.md` — versi TERBARU dari repo, JANGAN pakai salinan lama.

## KONTEKS SCOPE — BACA DULU SEBELUM APAPUN

Kamu (atau anggota tim yang pegang sesi ini) **DIALIHKAN FOKUS 100% ke `src/pages/BlockSimulator3D.jsx`** dan file terkaitnya SAJA. **DILARANG KERAS menyentuh, mengedit, atau "membenerkan" file/fitur lain** di luar file yang disebutkan di Bagian "FILE YANG DIUBAH" di bawah — walau kelihatan ada bug atau kelihatan butuh perbaikan. Kalau kamu lihat ada file lain yang berubah/beda dari terakhir kamu tahu, **itu WAJAR — ada anggota tim lain yang sedang kerja di modul berbeda secara paralel.** Jangan diotak-atik, jangan di-revert, jangan dikomentari sebagai "bug", cukup diamkan.

Ini **Bagian 1 dari 2**. Task ini HANYA memperbaiki 3 bug fondasi. Gizmo Move/Rotate/Scale 3-axis ala Roblox Studio dan porting Paint dari 2D itu **Bagian 2, task terpisah nanti** — JANGAN dikerjakan di sini walau kamu tahu itu juga perlu.

---

## BUG #1 — Orbit Kamera Terbalik Total (kanan↔kiri, atas↔bawah)

**Lokasi:** `onMouseMove`, blok `if (s.isOrbiting)`, sekitar baris 469-472.

**Kode SEKARANG (salah):**
```js
s.cam.yaw = s.camStart.yaw - dx * 0.007;
s.cam.pitch = Math.max(-1.45, Math.min(1.45, s.camStart.pitch - dy * 0.007));
```

**Ganti jadi:**
```js
s.cam.yaw = s.camStart.yaw + dx * 0.007;
s.cam.pitch = Math.max(-1.45, Math.min(1.45, s.camStart.pitch + dy * 0.007));
```

**WAJIB verifikasi manual setelah ganti** (karena aku tidak bisa jalankan browser dari sisiku): drag kamera ke kanan → pandangan harus berputar mengikuti arah yang natural (drag kanan = seperti Roblox Studio/kebanyakan software 3D, world berputar berlawanan arah drag, sehingga terasa seperti kamu "menggeser pandangan" ke kanan). Kalau setelah fix ini **CUMA SATU sumbu** yang masih kebalik (misal yaw sudah benar tapi pitch masih kebalik, atau sebaliknya), balik tanda MINUS itu HANYA untuk sumbu yang masih salah, bukan keduanya — laporkan sumbu mana yang butuh penyesuaian tambahan di `memory.md`.

---

## BUG #2 — `hitTest()` Salah Pilih Blok (akar masalah delete & clone "ngawur")

**Diagnosis:** `render()` (baris ~160) menggambar blok terurut berdasarkan **depth/jarak dari kamera** (painter's algorithm — far-to-near, supaya blok yang lebih dekat kamera "menutupi" yang jauh secara visual). Tapi `hitTest()` (baris 303) mengecek blok berdasarkan **urutan mentah `s.blocks` dibalik** (urutan insert, BUKAN depth). Akibatnya: kalau 2 blok tumpang-tindih di layar dari sudut pandang kamera manapun, klik user bisa "kena" blok yang secara visual TIDAK di depan — inilah kenapa delete kadang hapus blok yang salah, dan clone kadang "kelihatan tidak ngapa-ngapain" (karena yang di-clone blok lain, muncul nyempil di belakang).

**Fix:** `hitTest()` HARUS menguji blok dengan urutan **PERSIS SAMA seperti urutan visual render (dari yang PALING DEKAT kamera dulu)**, supaya hit pertama yang ketemu = blok yang benar-benar terlihat paling depan di layar.

**Cara paling aman (jangan menebak arah sign depth):** reuse PERSIS logika sorting yang sudah dipakai `render()`, lalu iterasi hasilnya dari arah BERLAWANAN dengan urutan gambar (karena render menggambar far→near, near berarti digambar TERAKHIR alias di atas semua — jadi untuk hit test, near harus dicek PERTAMA, yaitu iterasi array hasil sort tadi dari BELAKANG ke DEPAN).

```js
const hitTest = (mx, my) => {
  const s = stateRef.current;
  // WAJIB pakai rumus sort yang SAMA PERSIS dengan render() supaya konsisten:
  const sorted = s.blocks.map((b, i) => ({ b, i, depth: project(b.pos).z }))
    .sort((a, b) => b.depth - a.depth);
  // render() gambar sorted[0] dulu (paling belakang) sampai sorted[terakhir] (paling depan, jadi "di atas").
  // Untuk hit test, cek dari yang PALING DEPAN dulu → iterasi dari BELAKANG array sorted:
  for (let i = sorted.length - 1; i >= 0; i--) {
    const b = sorted[i].b;
    const pc = getBlockCorners(b).map(project);
    const faces = [[0,1,2,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[0,3,7,4],[1,2,6,5]];
    for (const f of faces) {
      const pts = f.map(idx => pc[idx]);
      if (pointInPoly(mx, my, pts)) return b;
    }
  }
  return null;
};
```

**WAJIB verifikasi:** taruh 2-3 blok saling tumpang tindih dari beberapa sudut kamera (rotate dulu), lalu pastikan klik selalu kena blok yang SECARA VISUAL paling depan/atas, bukan yang di belakangnya. Tes delete & clone di kondisi tumpang-tindih ini secara spesifik — itu skenario yang tadinya paling sering gagal.

---

## BUG #3 — Rotasi Sumbu Z Salah Total (pakai rumus sumbu Y)

**Diagnosis:** `getBlockCorners()` (baris ~96-108) punya baris:
```js
p = rotY(p, r.y); p = rotX(p, r.x); p = rotY(p, r.z);
```
Baris terakhir **salah** — untuk rotasi sumbu Z, harus pakai rumus rotasi sumbu Z, bukan `rotY` lagi. Fungsi `rotZ` **belum pernah dibuat** di file ini sama sekali (cuma ada `rotY` dan `rotX`, baris 70-77).

**Fix — tambahkan fungsi baru** (taruh persis di bawah `rotX`, ikuti gaya kode yang sudah ada):
```js
const rotZ = (v, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return new Vec3(v.x * c - v.y * s, v.x * s + v.y * c, v.z);
};
```

**Lalu ganti baris di `getBlockCorners`:**
```js
p = rotY(p, r.y); p = rotX(p, r.x); p = rotZ(p, r.z);
```

**Catatan:** urutan rotasi (`rotY` → `rotX` → `rotZ`) dipertahankan APA ADANYA seperti yang sudah ada, JANGAN diubah urutannya — hanya fungsi di panggilan terakhir yang dibetulkan dari `rotY` jadi `rotZ`. Mengubah urutan bisa mengubah perilaku rotasi gabungan yang mungkin sudah dites orang lain sebelumnya untuk kasus rot.x atau rot.y saja.

**WAJIB verifikasi:** karena saat ini TIDAK ADA cara dari UI untuk mengatur `rot.z` (drag rotate cuma ubah `rot.y`, ini baru dibuka di Bagian 2/gizmo nanti), verifikasi bug #3 ini dengan cara: sisipkan sementara nilai test manual (misal lewat console browser `stateRef` kalau bisa diakses, atau override sementara nilai default `rot.z` salah satu blok saat place) untuk pastikan `rotZ` menghasilkan rotasi visual yang benar (blok berputar mengelilingi sumbu Z, bukan sumbu Y lagi) — lalu HAPUS lagi kode test sementara itu sebelum commit final. Laporkan di `memory.md` bagaimana cara kamu memverifikasi ini karena tidak ada UI resmi untuk trigger rot.z di task ini.

---

## FILE YANG DIUBAH
- `src/pages/BlockSimulator3D.jsx` — HANYA 3 perubahan di atas (fix sign orbit, fix `hitTest`, tambah `rotZ` + fix pemanggilannya). TIDAK ADA perubahan lain di file ini.

## FILE YANG DILARANG DISENTUH
- SEMUA file lain di repo ini, TANPA KECUALIAN — termasuk `LogicGatesSimulator.jsx`, `MenuButton3D.jsx`, `ColorWheelPicker.jsx`, semua file Card 01-17, auth/firebase/backend, config files. Task ini SATU FILE SAJA.
- Kalau nemu file lain yang statusnya beda dari yang kamu ingat (kemungkinan besar karena tim lain kerja paralel) — **JANGAN disentuh, jangan dikomentari, jangan direvert.**

## CHECKLIST VERIFIKASI WAJIB
1. Build check — `npm run build`, 0 error.
2. Scope check — diff HANYA `BlockSimulator3D.jsx`.
3. Verifikasi manual per bug seperti dijelaskan di masing-masing bagian di atas (kamera, hit-test tumpang-tindih, rotZ).
4. Update `memory.md` — tambah entri baru (append, JANGAN overwrite) menjelaskan 3 fix ini + hasil verifikasi manual + cara verifikasi rotZ yang tidak ada UI-nya.
5. **STOP setelah 3 fix ini selesai.** JANGAN mulai kerjakan gizmo Move/Rotate/Scale atau porting Paint — itu prompt kerja terpisah (Bagian 2), menunggu konfirmasi dari Bagian 1 ini beres dulu.
6. `git push --force` DILARANG MUTLAK. Kalau push biasa ditolak karena ada perubahan baru di remote (kemungkinan besar dari tim lain yang kerja paralel di modul lain) — STOP, JANGAN pull/merge/rebase sendiri, laporkan ke user dulu.
