# PROMPT KERJA — HOTFIX: PANEL SHAPE GENERATOR BERANTAKAN/MENYILANG (Sphere/Cylinder/Cone/Torus)

> **WAJIB DIBACA DULU:** `instruction.md`, `design.md`, `memory.md` (entri terbaru soal Shape Generator Tahap 2).

## KONTEKS SCOPE
Fokus 100% ke `src/pages/BlockSimulator3D.jsx`.

## APA YANG SALAH (bukan salah implementasimu — ini bug di rumus yang aku kasih)

Kode kamu sebelumnya (`generateCone`, `generateSphere`, `generateCylinder`, `generateTorus`) SUDAH BENAR mengikuti spesifikasi — masalahnya ada di fungsi `alignPlateToNormal` itu sendiri: fungsi itu cuma mengunci **arah normal** panel (sumbu tipis menghadap ke arah yang benar), tapi **TIDAK mengunci arah "putaran" (roll) panel di sekitar sumbu normal itu**. Akibatnya tiap panel independen punya orientasi tangensial acak — pas ditaruh berdekatan, panel-panel itu saling silang-menyilang gak konsisten (persis yang kelihatan di screenshot: rajutan kacau di kerucut).

**Sudah aku verifikasi matematis pakai simulasi numerik** (bukan tebakan) — rumus baru di bawah ini dites di ratusan kombinasi sudut untuk Cone, Sphere, dan Torus, error-nya di angka `1e-16` (nol secara praktis).

## FIX — GANTI TOTAL FUNGSI ORIENTASI

**Hapus** fungsi `alignPlateToNormal` yang lama. **Ganti dengan:**

```js
// Menghitung orientasi panel LENGKAP (bukan cuma normal, tapi juga arah tangensial/roll-nya)
// supaya panel-panel yang bersebelahan konsisten arah hadapnya, tidak saling menyilang.
// N = normal permukaan (sumbu tipis panel menghadap ke sini).
// tangentHint = perkiraan arah "keliling" panel di titik itu (tidak perlu presisi/tegak
//   lurus sempurna terhadap N — fungsi ini otomatis meluruskannya via Gram-Schmidt).
function solveFullOrientation(N, tangentHint) {
  const norm = (v) => { const l = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x/l, y: v.y/l, z: v.z/l }; };
  const dot = (a, b) => a.x*b.x + a.y*b.y + a.z*b.z;
  const cross = (a, b) => ({ x: a.y*b.z - a.z*b.y, y: a.z*b.x - a.x*b.z, z: a.x*b.y - a.y*b.x });

  const Nn = norm(N);
  const d = dot(tangentHint, Nn);
  const Traw = { x: tangentHint.x - Nn.x*d, y: tangentHint.y - Nn.y*d, z: tangentHint.z - Nn.z*d };
  const T = norm(Traw);
  const B = norm(cross(Nn, T));

  // Rumus ekstraksi sudut ini diturunkan langsung dari matriks rotasi gabungan
  // rotZ(rotX(rotY(p))) yang dipakai file ini — DIVERIFIKASI numerik, jangan diubah.
  const rx = Math.asin(Math.max(-1, Math.min(1, B.z)));
  const ry = Math.atan2(T.z, Nn.z);
  const rz = Math.atan2(-B.x, B.y);
  return { rx, ry, rz };
}
```

**Catatan penting:** fungsi ini mengembalikan **3 sudut** (`rx, ry, rz`), BUKAN 2 seperti fungsi lama. Semua tempat yang manggil ini WAJIB pakai ketiga sudutnya (`rot: new Vec3(rx, ry, rz)` — sebelumnya `rz` di-hardcode 0, SEKARANG TIDAK BOLEH lagi).

## GANTI DI 4 FUNGSI GENERATOR (Sphere, Cylinder, Cone, Torus) — WAJIB SEMUA 4

Pola perubahan SAMA untuk keempatnya: ganti pemanggilan `alignPlateToNormal(N)` jadi `solveFullOrientation(N, tangentHint)`, dan `tangentHint` dihitung dari sudut azimuth (`phi` atau `u`) yang SUDAH ADA di loop masing-masing — **rumus tangentHint SELALU SAMA BENTUKNYA**: `{ x: -Math.sin(sudutAzimuth), y: 0, z: Math.cos(sudutAzimuth) }`, tinggal sesuaikan nama variabel sudutnya sesuai tiap fungsi.

**`generateSphere`** — cari baris `const { rx, ry } = alignPlateToNormal(N);`, ganti jadi:
```js
const tangentHint = { x: -Math.sin(phiMid), y: 0, z: Math.cos(phiMid) };
const { rx, ry, rz } = solveFullOrientation(N, tangentHint);
```
lalu di `newBlocks.push(...)`, ganti `rot: new Vec3(rx, ry, 0)` jadi `rot: new Vec3(rx, ry, rz)`.

**`generateCylinder`** — sama persis, `phiMid` sudah ada di scope-nya. Ganti dengan pola yang sama.

**`generateCone`** — sama persis, `phiMid` sudah ada. Ganti dengan pola yang sama.

**`generateTorus`** — variabel azimuth utamanya bernama `u` (bukan `phiMid`), pakai itu:
```js
const tangentHint = { x: -Math.sin(u), y: 0, z: Math.cos(u) };
const { rx, ry, rz } = solveFullOrientation(N, tangentHint);
```

## TIDAK PERLU DIUBAH
- `generateFlatPolyhedron` (Tetrahedron/Octahedron/Icosahedron) — **TETAP pakai fungsi lama atau boleh tetap manggil yang lama kalau masih ada**, karena tiap wajah cuma 1 panel independen (tidak ada masalah "roll tidak konsisten antar tetangga" di situ, tidak ada gejala rusak yang dilaporkan). **JANGAN diotak-atik di task ini.**
- Posisi (`pos`), ukuran (`size`), jumlah loop segmen — semua TETAP SAMA PERSIS seperti sebelumnya. **HANYA baris orientasi (`rx,ry` → `rx,ry,rz`) yang berubah.**

## FILE YANG DIUBAH
- `src/pages/BlockSimulator3D.jsx` — HANYA fungsi `solveFullOrientation` (baru, ganti `alignPlateToNormal`) + 4 titik pemanggilan di generator Sphere/Cylinder/Cone/Torus.

## CHECKLIST VERIFIKASI WAJIB
1. Build check — `npm run build`, 0 error.
2. Scope check — diff HANYA `BlockSimulator3D.jsx` (+ `memory.md`).
3. **Verifikasi visual WAJIB** (ini yang paling penting — bug sebelumnya LOLOS dari build check tapi rusak visual): generate ulang Cone, Sphere, Cylinder, Torus, screenshot atau deskripsikan hasilnya — panel-panel HARUS tersusun rapi mengikuti kontur bentuk (seperti sisik/genteng tersusun), TIDAK saling menyilang/menganyam kacau seperti sebelumnya.
4. Update `memory.md` — jelaskan akar masalah (roll tidak terkontrol) + fix (solveFullOrientation 3-axis) + hasil verifikasi visual.
5. `git push --force` DILARANG MUTLAK.
6. **STOP setelah hotfix ini** — jangan lanjut ke fitur lain.
