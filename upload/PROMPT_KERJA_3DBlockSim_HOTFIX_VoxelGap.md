# PROMPT KERJA — HOTFIX: CELAH/BOLONG DI VOXEL LENGKUNG (Sphere/Cylinder/Cone/Torus)

> **WAJIB DIBACA DULU:** `instruction.md`, `design.md`, `memory.md` (entri Poin F — rotasi Shape Generator).

## KONTEKS SCOPE
Fokus 100% ke `src/pages/BlockSimulator3D.jsx`.

## APA YANG SALAH

`size: new Vec3(voxelSize, voxelSize, voxelSize)` — voxel SELALU persis seukuran jarak antar-titik grid. Begitu voxel individual DIPUTAR (Poin F, biar ikut kontur), sudut-sudutnya jadi renggang dari voxel tetangga (karena masing-masing berputar sedikit beda arah), muncul celah gelap kelihatan background di antaranya — persis di screenshot (bola & kerucut bolong-bolong).

## FIX — perbesar (scale up) voxel yang DIROTASI, supaya saling tumpang-tindih & nutup celah

**Cari blok kode di Bagian F (`if (useRotation) { ... }`) yang push ke `newBlocks`.** Tambahkan konstanta overlap SEBELUM loop utama (taruh dekat `VOXEL_MAX_BLOCKS`):
```js
const VOXEL_OVERLAP_FACTOR = 1.6; // voxel diputar diperbesar 1.6x biar sudut2nya nutup celah tetangga
```

**Ganti bagian push block** — SEKARANG:
```js
newBlocks.push({
  pos: new Vec3(center.x + x, center.y + y, center.z + z),
  rot,
  size: new Vec3(voxelSize, voxelSize, voxelSize),
  color,
});
```
**Jadi:**
```js
const voxSize = useRotation
  ? voxelSize * VOXEL_OVERLAP_FACTOR // voxel lengkung diputar → diperbesar biar tumpang-tindih, nutup celah
  : voxelSize;                        // voxel axis-aligned (Cube/Tetra/Octa/Icosa) TETAP presisi grid, JANGAN diperbesar
newBlocks.push({
  pos: new Vec3(center.x + x, center.y + y, center.z + z),
  rot,
  size: new Vec3(voxSize, voxSize, voxSize),
  color,
});
```

**Kenapa cuma diperbesar saat `useRotation` true:** voxel axis-aligned (Cube, Tetrahedron, Octahedron, Icosahedron — TIDAK dirotasi) sudah pas persis di grid tanpa celah dari awal (masalah ini cuma muncul akibat rotasi individual), jadi JANGAN ikut diperbesar — kalau diperbesar juga, voxel axis-aligned malah jadi saling menembus/overlap gak perlu dan keliatan aneh (kotak-kotak jadi kegedean gak wajar).

**Posisi (`pos`) TETAP di titik grid asli** — cuma `size` yang berubah, `pos` JANGAN ikut disesuaikan (memperbesar size sambil pos tetap di tengah otomatis bikin voxel "keluar" merata ke segala arah dari titik grid-nya, itu yang kita mau).

## CATATAN
`VOXEL_OVERLAP_FACTOR = 1.6` itu **titik awal, boleh disesuaikan** kalau setelah dites visual (Sphere & Cone, dua kasus di screenshot) masih ada celah kelihatan (naikkan sedikit, misal ke `1.8`) atau malah kelihatan terlalu "gempal"/tumpang tindih parah (turunkan, misal ke `1.4`). **WAJIB tes visual dulu sebelum lapor selesai** — sama seperti pelajaran task-task Shape Generator sebelumnya, build sukses TIDAK berarti hasil visual benar.

## FILE YANG DIUBAH
- `src/pages/BlockSimulator3D.jsx` — HANYA bagian ini.

## CHECKLIST VERIFIKASI
1. Build check — `npm run build`, 0 error.
2. Scope check — diff HANYA `BlockSimulator3D.jsx` (+ `memory.md`).
3. **Verifikasi visual WAJIB** — generate ulang Sphere & Cone (2 kasus di screenshot), pastikan celah/bolong HILANG atau MINIMAL jauh berkurang, permukaan terlihat menyatu rapat.
4. Verifikasi Cube/Tetrahedron/Octahedron/Icosahedron TIDAK berubah (tetap axis-aligned presisi grid seperti sebelumnya, TIDAK ikut membesar).
5. Update `memory.md` — jelaskan fix + nilai `VOXEL_OVERLAP_FACTOR` final yang dipakai (kalau disesuaikan dari 1.6).
6. `git push --force` DILARANG MUTLAK.
7. **STOP setelah hotfix ini** — Tahap 3 (dual camera) masih menunggu.
