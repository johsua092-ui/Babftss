# PROMPT KERJA — 3D BLOCK SIMULATOR: SHAPE GENERATOR (TAHAP 2/3)

> **WAJIB DIBACA DULU:** `instruction.md`, `design.md`, `memory.md` (entri terbaru `BlockSimulator3D` — fix fondasi, gizmo 6-axis, paint, scale step, gizmo panah Tahap 1), `RULES_AUTONOMI_QWEN.md`, `RULES_KESELAMATAN_GIT.md`.

## KONTEKS SCOPE
Fokus 100% ke `src/pages/BlockSimulator3D.jsx`. File lain jangan disentuh.

## KONSEP PENTING — BACA DULU, INI BUKAN "PRIMITIF BARU"

**SEMUA bentuk yang dihasilkan fitur ini TETAP berupa objek kubus biasa** (elemen array `s.blocks`, struktur `{pos, rot, size, color}` — SAMA PERSIS seperti kubus yang sudah ada). **TIDAK ADA geometri baru, TIDAK ADA field `shape` di data block, TIDAK ADA perubahan ke `getBlockCorners`/`render`/`hitTest`.**

Yang dibuat adalah **"Shape Generator"**: sebuah tool yang, sekali diklik "Generate", **otomatis menghasilkan BANYAK kubus** (masing-masing di-scale super tipis di 1 sumbu jadi "panel", lalu diputar/diposisikan mengikuti permukaan bentuk target) dan **memasukkan semuanya ke `s.blocks`** — persis seolah-olah user menaruh & mengatur ratusan kubus satu-satu secara manual, tapi otomatis. Setelah di-generate, tiap kubus itu adalah blok biasa yang bisa di-Move/Rotate/Scale/Paint/Delete satu-satu seperti biasa.

---

## RUMUS INTI — ORIENTASI PANEL MENGHADAP NORMAL PERMUKAAN

Ini dipakai HAMPIR di semua bentuk lengkung (Sphere, Cylinder, Cone, Torus). Buat 1 kubus "panel" yang sumbu tipisnya (lokal Z) menghadap arah normal `N` (vektor satuan) di titik permukaan target:

```js
// N = {x,y,z} vektor satuan arah normal permukaan di titik itu.
// Hasil: { rx, ry } untuk dipakai sebagai b.rot.x dan b.rot.y (rot.z biarkan 0).
const alignPlateToNormal = (N) => {
  const ry = Math.asin(Math.max(-1, Math.min(1, -N.x)));
  const rx = Math.atan2(-N.y, N.z);
  return { rx, ry };
};
```
**Sudah terverifikasi numerik benar** (dites terhadap fungsi `rotY`/`rotX` yang SUDAH ADA di file ini — hasil transformasi `(0,0,1)` pakai `{rx,ry}` ini SELALU sama persis dengan `N` target). Pakai apa adanya, JANGAN diubah.

---

## UI — PANEL "SHAPE GENERATOR"

Tambahkan tool baru di toolbar: **`generate`** (ikon: gunakan salah satu ikon dari `lucide-react` yang sudah di-import di file ini, pilih yang paling representasi "shapes", misal `Shapes` atau `Box` — cek dulu import yang sudah ada, tambah import baru kalau perlu).

Saat tool `generate` aktif, tampilkan panel (styling ikuti pola panel lain yang sudah ada — dark card, border, dsb):
- **Dropdown pilih bentuk**: Tetrahedron, Octahedron, Icosahedron, Cube (opsional, trivial), Sphere, Cylinder, Cone, Torus.
- **Input "Size"** (radius/setengah-tinggi target, angka bebas, default 4).
- **Input "Segments"** (resolusi tiling, cuma relevan utk Sphere/Cylinder/Cone/Torus, default 10, range wajar 4-24 — makin besar makin halus tapi makin banyak blok/makin berat).
- **Input "Panel Thickness"** (ketebalan tiap panel kubus, default 0.15).
- **Tombol "Generate"** — saat diklik, jalankan fungsi generator sesuai bentuk terpilih, `push` semua hasilnya ke `s.blocks`, lalu `render()`.

Titik pusat bentuk = posisi grid yang lagi di-hover mouse (reuse `getGridPos(mx,my)` yang SUDAH ADA, sama seperti tool Place) — supaya user bisa arahkan dulu sebelum klik Generate.

---

## ALGORITMA PER BENTUK

### A. Tetrahedron, Octahedron, Icosahedron (poligon datar — PALING GAMPANG, 1 blok per wajah)

Ini polyhedron dengan wajah RATA (segitiga), jadi TIDAK perlu tiling — cukup 1 panel kubus per wajah segitiga, diposisikan di titik tengah wajah, orientasi ikut normal wajah itu, ukuran menyesuaikan luas segitiga.

**Data vertex & face TETAP** (hardcode, rumus baku, jangan diubah):
```js
const TETRAHEDRON = {
  verts: [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]],
  faces: [[0,1,2],[0,3,1],[0,2,3],[1,3,2]],
};
const OCTAHEDRON = {
  verts: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
  faces: [[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]],
};
const PHI = (1 + Math.sqrt(5)) / 2;
const ICOSAHEDRON = {
  verts: [
    [-1,PHI,0],[1,PHI,0],[-1,-PHI,0],[1,-PHI,0],
    [0,-1,PHI],[0,1,PHI],[0,-1,-PHI],[0,1,-PHI],
    [PHI,0,-1],[PHI,0,1],[-PHI,0,-1],[-PHI,0,1],
  ],
  faces: [
    [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
    [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
    [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
    [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1],
  ],
};
```

**Generator untuk polyhedron datar:**
```js
function generateFlatPolyhedron(poly, center, targetRadius, thickness, color) {
  // Normalisasi semua vertex ke jarak 1 dari origin (biar bentuknya bulat rata / "inscribed"),
  // baru dikali targetRadius.
  const normVerts = poly.verts.map(v => {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return { x: v[0]/len*targetRadius, y: v[1]/len*targetRadius, z: v[2]/len*targetRadius };
  });
  const newBlocks = [];
  poly.faces.forEach(face => {
    const pts = face.map(i => normVerts[i]);
    // Titik tengah wajah:
    const cx = pts.reduce((s,p)=>s+p.x,0)/pts.length;
    const cy = pts.reduce((s,p)=>s+p.y,0)/pts.length;
    const cz = pts.reduce((s,p)=>s+p.z,0)/pts.length;
    // Normal wajah = arah dari origin ke titik tengah wajah (karena polyhedron ini convex & centered di origin).
    const nlen = Math.hypot(cx,cy,cz) || 1;
    const N = { x: cx/nlen, y: cy/nlen, z: cz/nlen };
    // Estimasi lebar wajah (dari 2 sisi segitiga, dipakai sbg size panel):
    const edge1 = Math.hypot(pts[1].x-pts[0].x, pts[1].y-pts[0].y, pts[1].z-pts[0].z);
    const { rx, ry } = alignPlateToNormal(N);
    newBlocks.push({
      pos: new Vec3(center.x + cx, center.y + cy, center.z + cz),
      rot: new Vec3(rx, ry, 0),
      size: new Vec3(edge1 * 0.95, edge1 * 0.95, thickness), // sedikit dikecilkan (0.95) biar gak overlap antar panel
      color,
    });
  });
  return newBlocks;
}
```

### B. Sphere (UV-sphere tiling)

```js
function generateSphere(center, radius, segments, thickness, color) {
  const newBlocks = [];
  const rings = Math.max(3, Math.floor(segments / 2)); // lat
  const slices = Math.max(3, segments);                 // long
  for (let i = 0; i < rings; i++) {
    const theta0 = (i / rings) * Math.PI;
    const theta1 = ((i + 1) / rings) * Math.PI;
    const thetaMid = (theta0 + theta1) / 2;
    for (let j = 0; j < slices; j++) {
      const phiMid = ((j + 0.5) / slices) * Math.PI * 2;
      const nx = Math.sin(thetaMid) * Math.cos(phiMid);
      const ny = Math.cos(thetaMid);
      const nz = Math.sin(thetaMid) * Math.sin(phiMid);
      const N = { x: nx, y: ny, z: nz };
      const px = center.x + nx * radius, py = center.y + ny * radius, pz = center.z + nz * radius;
      // Lebar panel: kira-kira arc-length per segmen di ring ini.
      const w = (2 * Math.PI * radius * Math.sin(thetaMid)) / slices;
      const h = (Math.PI * radius) / rings;
      const { rx, ry } = alignPlateToNormal(N);
      newBlocks.push({
        pos: new Vec3(px, py, pz),
        rot: new Vec3(rx, ry, 0),
        size: new Vec3(Math.max(0.1, w * 0.95), Math.max(0.1, h * 0.95), thickness),
        color,
      });
    }
  }
  return newBlocks;
}
```

### C. Cylinder (dinding samping saja — TIDAK termasuk tutup atas/bawah, catat ini sebagai batasan di `memory.md`)

```js
function generateCylinder(center, radius, height, segments, thickness, color) {
  const newBlocks = [];
  const rows = Math.max(2, Math.floor(segments / 2));
  for (let row = 0; row < rows; row++) {
    const yMid = -height/2 + height * (row + 0.5) / rows;
    for (let j = 0; j < segments; j++) {
      const phiMid = ((j + 0.5) / segments) * Math.PI * 2;
      const nx = Math.cos(phiMid), nz = Math.sin(phiMid);
      const N = { x: nx, y: 0, z: nz };
      const px = center.x + nx * radius, py = center.y + yMid, pz = center.z + nz * radius;
      const w = (2 * Math.PI * radius) / segments;
      const h = height / rows;
      const { rx, ry } = alignPlateToNormal(N);
      newBlocks.push({
        pos: new Vec3(px, py, pz),
        rot: new Vec3(rx, ry, 0),
        size: new Vec3(Math.max(0.1, w * 0.95), Math.max(0.1, h * 0.95), thickness),
        color,
      });
    }
  }
  return newBlocks;
}
```

### D. Cone (dinding samping meruncing ke atas, radius linear turun ke 0 — TANPA tutup bawah, catat sbg batasan)

```js
function generateCone(center, radius, height, segments, thickness, color) {
  const newBlocks = [];
  const rows = Math.max(2, Math.floor(segments / 2));
  const halfAngle = Math.atan2(radius, height); // sudut kemiringan sisi kerucut
  for (let row = 0; row < rows; row++) {
    const t = (row + 0.5) / rows; // 0..1 dari alas ke puncak
    const yMid = -height/2 + height * t;
    const rMid = radius * (1 - t); // radius menyusut linear ke 0 di puncak
    for (let j = 0; j < segments; j++) {
      const phiMid = ((j + 0.5) / segments) * Math.PI * 2;
      const nx = Math.cos(phiMid) * Math.cos(halfAngle);
      const ny = Math.sin(halfAngle);
      const nz = Math.sin(phiMid) * Math.cos(halfAngle);
      const N = { x: nx, y: ny, z: nz };
      const px = center.x + Math.cos(phiMid) * rMid, py = center.y + yMid, pz = center.z + Math.sin(phiMid) * rMid;
      const w = (2 * Math.PI * rMid) / segments;
      const h = (height / rows) / Math.cos(halfAngle);
      const { rx, ry } = alignPlateToNormal(N);
      newBlocks.push({
        pos: new Vec3(px, py, pz),
        rot: new Vec3(rx, ry, 0),
        size: new Vec3(Math.max(0.1, w * 0.95), Math.max(0.1, h * 0.95), thickness),
        color,
      });
    }
  }
  return newBlocks;
}
```

### E. Torus

```js
function generateTorus(center, majorRadius, minorRadius, segments, thickness, color) {
  const newBlocks = [];
  const majorSeg = segments;
  const minorSeg = Math.max(4, Math.floor(segments / 2));
  for (let i = 0; i < majorSeg; i++) {
    const u = ((i + 0.5) / majorSeg) * Math.PI * 2; // sudut keliling besar
    for (let j = 0; j < minorSeg; j++) {
      const v = ((j + 0.5) / minorSeg) * Math.PI * 2; // sudut keliling tabung kecil
      const nx = Math.cos(v) * Math.cos(u);
      const ny = Math.sin(v);
      const nz = Math.cos(v) * Math.sin(u);
      const N = { x: nx, y: ny, z: nz };
      const cx = Math.cos(u) * majorRadius, cz = Math.sin(u) * majorRadius;
      const px = center.x + cx + nx * minorRadius;
      const py = center.y + ny * minorRadius;
      const pz = center.z + cz + nz * minorRadius;
      const w = (2 * Math.PI * minorRadius) / minorSeg;
      const h = (2 * Math.PI * majorRadius) / majorSeg;
      const { rx, ry } = alignPlateToNormal(N);
      newBlocks.push({
        pos: new Vec3(px, py, pz),
        rot: new Vec3(rx, ry, 0),
        size: new Vec3(Math.max(0.1, w * 0.95), Math.max(0.1, h * 0.95), thickness),
        color,
      });
    }
  }
  return newBlocks;
}
```
Untuk Torus, `majorRadius` = input "Size", `minorRadius` = input "Size" × 0.35 (tetap, tidak perlu input terpisah — kalau mau presisi lebih, boleh tambah 1 input lagi tapi opsional).

---

## WARNA & ID BLOK HASIL GENERATE

Pakai `currentColor` yang sedang aktif (state yang SUDAH ADA) sebagai `color` semua panel. Tiap blok baru HARUS dapat `id`/increment index yang konsisten dengan cara block baru dibuat di tool Place yang sudah ada (cek `nb.id = ...` atau counter yang dipakai di situ, ikuti pola PERSIS, jangan bikin sistem ID baru).

## PERFORMA — WAJIB DIPERHATIKAN

`segments=10` untuk Sphere bisa menghasilkan ~50 blok, Torus/Cylinder serupa. **Jangan izinkan user set segments di atas 24** (clamp di input) — di atas itu jumlah blok bisa ribuan dan browser bisa nge-lag parah. Kasih peringatan kecil di UI ("makin tinggi makin berat") kalau segments > 16.

---

## FILE YANG DIUBAH
- `src/pages/BlockSimulator3D.jsx` — HANYA ini (tambah tool baru + fungsi generator + panel UI).

## CHECKLIST VERIFIKASI WAJIB
1. Build check — `npm run build`, 0 error.
2. Scope check — diff HANYA `BlockSimulator3D.jsx` (+ `memory.md`).
3. **Verifikasi visual tiap bentuk** (kalau bisa screenshot, atau minimal jelaskan cara kamu yakin bentuknya benar): generate tiap 1 dari 8 pilihan, cek bentuknya secara kasar mendekati target (bola bulat, silinder tabung, kerucut meruncing, torus donat, tetrahedron/octahedron/icosahedron bentuk sisi datar khasnya).
4. **Verifikasi blok hasil generate BISA di-edit normal** — pilih salah satu panel hasil generate, coba Move/Rotate/Scale/Paint/Delete satu-satu, harus berfungsi normal seperti kubus manapun (karena memang cuma kubus biasa).
5. **Verifikasi performa** — coba segments tinggi (16-24), pastikan tidak freeze total (boleh agak berat, tapi harus tetap responsif).
6. Update `memory.md` — append entri baru, sebutkan eksplisit batasan Cylinder/Cone (tanpa tutup atas-bawah).
7. `git push --force` DILARANG MUTLAK.
8. **STOP setelah ini** — Tahap 3 (split-screen dual camera) prompt terpisah nanti.
