# PROMPT KERJA — SHAPE GENERATOR v2: VOXEL-FILL (GANTI TOTAL PENDEKATAN PANEL-ROTASI)

> **WAJIB DIBACA DULU:** `instruction.md`, `design.md`, `memory.md` (entri Shape Generator Tahap 2 + hotfix orientasi sebelumnya — task ini MENGGANTIKAN keduanya, bukan nambah di atasnya).

## KONTEKS SCOPE
Fokus 100% ke `src/pages/BlockSimulator3D.jsx`.

## PERUBAHAN PARADIGMA — BACA DULU

Pendekatan sebelumnya (panel besar diputar-putar mengikuti permukaan) **DIBUANG TOTAL**. Diganti pendekatan **voxel-fill**: isi permukaan bentuk target dengan **BANYAK kubus kecil axis-aligned (TANPA ROTASI SAMA SEKALI, `rot: new Vec3(0,0,0)` selalu)**, ukurannya seragam sebesar **"Voxel Size"** yang user tentukan bebas (bisa 0.05, 0.1, 0.2, 0.5, 1, 2, terserah — INPUT ANGKA BEBAS, bukan dropdown preset). Ini jauh lebih sederhana: **HAPUS semua fungsi lama** (`solveFullOrientation`/`alignPlateToNormal`, `generateSphere`, `generateCylinder`, `generateCone`, `generateTorus`, `generateFlatPolyhedron`, konstanta `TETRAHEDRON`/`OCTAHEDRON`/`ICOSAHEDRON` lama) — **GANTI SEMUA dengan sistem baru di bawah ini.**

---

## ALGORITMA UMUM

Untuk tiap bentuk, buat 1 fungsi `shellTest(p, params)` yang menerima titik `p={x,y,z}` (relatif ke titik pusat bentuk) dan mengembalikan `true` kalau titik itu "dekat permukaan" (voxel harus ditaruh di situ), `false` kalau tidak. Lalu loop grid 3D dengan step = Voxel Size, dalam bounding box yang cukup buat bentuk itu, test tiap titik grid, kalau lolos → taruh 1 kubus kecil di situ.

```js
function generateVoxelShape(shapeType, center, params, voxelSize, color) {
  const halfV = voxelSize / 2;
  const bbox = getBoundingBox(shapeType, params); // { minX,maxX,minY,maxY,minZ,maxZ } — lihat per-bentuk di bawah
  const newBlocks = [];
  const MAX_BLOCKS = 4000; // guard performa, WAJIB — lihat bagian PERFORMA di bawah

  for (let x = bbox.minX; x <= bbox.maxX; x += voxelSize) {
    for (let y = bbox.minY; y <= bbox.maxY; y += voxelSize) {
      for (let z = bbox.minZ; z <= bbox.maxZ; z += voxelSize) {
        if (shellTest(shapeType, { x, y, z }, params, halfV)) {
          newBlocks.push({
            pos: new Vec3(center.x + x, center.y + y, center.z + z),
            rot: new Vec3(0, 0, 0), // SELALU 0 — voxel tidak pernah diputar
            size: new Vec3(voxelSize, voxelSize, voxelSize),
            color,
          });
          if (newBlocks.length > MAX_BLOCKS) {
            return { blocks: newBlocks, truncated: true }; // stop, terlalu banyak
          }
        }
      }
    }
  }
  return { blocks: newBlocks, truncated: false };
}
```

---

## `shellTest` PER BENTUK

Semua koordinat di bawah RELATIF ke pusat bentuk (`p.x, p.y, p.z` sudah dikurangi `center`, JANGAN dikurangi lagi).

**Sphere** (params: `radius`):
```js
const len = Math.hypot(p.x, p.y, p.z);
return Math.abs(len - params.radius) <= halfV;
```
Bounding box: `[-radius-halfV, radius+halfV]` di ketiga sumbu.

**Cylinder** (params: `radius`, `halfHeight`) — dinding samping DAN tutup atas-bawah (voxel-fill jauh lebih gampang nambah tutup dibanding versi panel-rotasi kemarin, JADI TERMASUK sekarang):
```js
const radial = Math.hypot(p.x, p.z);
const sideWall = Math.abs(radial - params.radius) <= halfV && Math.abs(p.y) <= params.halfHeight + halfV;
const capTopBottom = radial <= params.radius + halfV && Math.abs(Math.abs(p.y) - params.halfHeight) <= halfV;
return sideWall || capTopBottom;
```
Bounding box: X,Z: `[-radius-halfV, radius+halfV]`, Y: `[-halfHeight-halfV, halfHeight+halfV]`.

**Cone** (params: `radius` di alas, `halfHeight`, alas di `y=-halfHeight`, puncak di `y=+halfHeight`):
```js
const t = Math.max(0, Math.min(1, (p.y + params.halfHeight) / (2 * params.halfHeight)));
const rAtY = params.radius * (1 - t);
const radial = Math.hypot(p.x, p.z);
const sideWall = Math.abs(radial - rAtY) <= halfV && p.y >= -params.halfHeight - halfV && p.y <= params.halfHeight + halfV;
const capBottom = radial <= params.radius + halfV && Math.abs(p.y + params.halfHeight) <= halfV;
return sideWall || capBottom;
```
Bounding box: X,Z: `[-radius-halfV, radius+halfV]`, Y: `[-halfHeight-halfV, halfHeight+halfV]`.

**Torus** (params: `majorRadius`, `minorRadius`):
```js
const d = Math.hypot(p.x, p.z) - params.majorRadius;
const distToTube = Math.hypot(d, p.y);
return Math.abs(distToTube - params.minorRadius) <= halfV;
```
Bounding box: X,Z: `[-(majorRadius+minorRadius+halfV), majorRadius+minorRadius+halfV]`, Y: `[-minorRadius-halfV, minorRadius+halfV]`.

**Tetrahedron / Octahedron / Icosahedron** (params: `radius`, `planes` — daftar `{n:{x,y,z}, d}` bidang wajah):

Hitung `planes` SEKALI per klik Generate (bukan per-voxel, biar cepat) dari data vertex+face baku:
```js
const TETRAHEDRON_VF = { verts: [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]], faces: [[0,1,2],[0,3,1],[0,2,3],[1,3,2]] };
const OCTAHEDRON_VF = { verts: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]], faces: [[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]] };
const PHI = (1 + Math.sqrt(5)) / 2;
const ICOSAHEDRON_VF = {
  verts: [[-1,PHI,0],[1,PHI,0],[-1,-PHI,0],[1,-PHI,0],[0,-1,PHI],[0,1,PHI],[0,-1,-PHI],[0,1,-PHI],[PHI,0,-1],[PHI,0,1],[-PHI,0,-1],[-PHI,0,1]],
  faces: [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]],
};

// Normalisasi semua vertex ke jarak 1 dari origin dulu (biar "radius" konsisten antar bentuk), lalu skala ke targetRadius.
function computePlanes(vf, targetRadius) {
  const nv = vf.verts.map(v => {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return { x: v[0]/len*targetRadius, y: v[1]/len*targetRadius, z: v[2]/len*targetRadius };
  });
  return vf.faces.map(f => {
    const [p0, p1, p2] = f.map(i => nv[i]);
    const v1 = { x: p1.x-p0.x, y: p1.y-p0.y, z: p1.z-p0.z };
    const v2 = { x: p2.x-p0.x, y: p2.y-p0.y, z: p2.z-p0.z };
    let n = { x: v1.y*v2.z-v1.z*v2.y, y: v1.z*v2.x-v1.x*v2.z, z: v1.x*v2.y-v1.y*v2.x };
    const nlen = Math.hypot(n.x, n.y, n.z) || 1;
    n = { x: n.x/nlen, y: n.y/nlen, z: n.z/nlen };
    // Pastikan normal mengarah KELUAR (menjauhi origin) — cek dot product dgn titik tengah wajah.
    const cx = (p0.x+p1.x+p2.x)/3, cy = (p0.y+p1.y+p2.y)/3, cz = (p0.z+p1.z+p2.z)/3;
    if (n.x*cx + n.y*cy + n.z*cz < 0) { n = { x: -n.x, y: -n.y, z: -n.z }; }
    const d = n.x*p0.x + n.y*p0.y + n.z*p0.z;
    return { n, d };
  });
}
```

`shellTest` buat polyhedron (SDF = jarak max ke semua bidang wajah — **sudah diverifikasi numerik**: negatif = di dalam, nol = di permukaan, positif = di luar):
```js
function polySDF(p, planes) {
  return Math.max(...planes.map(({ n, d }) => n.x*p.x + n.y*p.y + n.z*p.z - d));
}
// shellTest:
const sdf = polySDF(p, params.planes);
return sdf >= -halfV && sdf <= halfV * 0.5; // shell tipis dekat permukaan (bukan solid penuh)
```
Bounding box: `[-radius-halfV, radius+halfV]` di ketiga sumbu (aman, sedikit longgar).

**Cube** (opsional, trivial — kalau user pilih ini, gak butuh voxel-fill sama sekali, cukup 1 kubus tunggal ukuran `radius*2`, TIDAK perlu masuk sistem loop grid di atas):
```js
if (shapeType === 'cube') {
  return { blocks: [{ pos: center, rot: new Vec3(0,0,0), size: new Vec3(params.radius*2, params.radius*2, params.radius*2), color }], truncated: false };
}
```

---

## UI — PERBARUI PANEL "SHAPE GENERATOR" YANG SUDAH ADA

- **Hapus** input "Segments" dan "Panel Thickness" yang lama.
- **Tambah** input **"Voxel Size"** (angka bebas, default `0.5`, style sama seperti input "Scale Step" yang sudah ada di tool Scale — reuse pola styling itu).
- Dropdown pilihan bentuk TETAP SAMA (Cube, Sphere, Cylinder, Cone, Torus, Tetrahedron, Octahedron, Icosahedron).
- Input "Size" tetap ada (dipakai sebagai `radius`/`halfHeight` dasar — untuk Cylinder/Cone, `halfHeight = size`, `radius = size * 0.6` atau rasio wajar lain, boleh disesuaikan; untuk Torus, `majorRadius = size`, `minorRadius = size * 0.35` seperti sebelumnya).
- **Kalau hasil `truncated: true`** (kena limit 4000 blok), tampilkan pesan singkat ke user: "Terlalu banyak voxel (>4000) — perbesar Voxel Size dulu" — JANGAN tetap masukkan hasil yang terpotong ke `s.blocks` (buang, jangan generate setengah-setengah).

---

## PERFORMA — WAJIB

- `MAX_BLOCKS = 4000` (hardcode seperti di kode atas) — HARD LIMIT, jangan diubah tanpa alasan kuat.
- Voxel Size sangat kecil (misal 0.05) pada bentuk besar (radius besar) bisa menghasilkan JUTAAN titik grid untuk di-test — walau test-nya murah, loop-nya sendiri bisa bikin browser freeze SEBELUM sempat kena limit 4000. **Tambahkan estimasi kasar SEBELUM mulai loop penuh**: hitung volume bounding box dibagi `voxelSize³`, kalau hasilnya di atas ~500.000 (titik grid yang akan ditest), tolak generate dari awal dengan pesan "Voxel Size terlalu kecil untuk ukuran ini, hasil diperkirakan >500rb titik uji — perbesar Voxel Size" — JANGAN mulai loop-nya sama sekali kalau sudah ketauan bakal terlalu berat dari estimasi awal.

---

## FILE YANG DIUBAH
- `src/pages/BlockSimulator3D.jsx` — hapus sistem panel-rotasi lama, ganti total dengan sistem voxel-fill ini.

## CHECKLIST VERIFIKASI WAJIB
1. Build check — `npm run build`, 0 error.
2. Scope check — diff HANYA `BlockSimulator3D.jsx` (+ `memory.md`).
3. **Verifikasi visual WAJIB, semua 8 bentuk**, coba minimal 2 Voxel Size berbeda (misal 0.5 dan 0.2) per bentuk, screenshot atau deskripsikan — pastikan bentuknya jelas kelihatan (bola bulat, kerucut meruncing dengan alas tertutup, silinder tabung dengan tutup, torus donat, ketiga polyhedron dengan sisi datar khasnya).
4. Verifikasi voxel hasil generate bisa di-edit normal satu-satu (Move/Rotate/Scale/Paint/Delete) — sama seperti kubus manapun.
5. Verifikasi guard performa jalan (coba Voxel Size sangat kecil di bentuk besar, pastikan ditolak dengan pesan, TIDAK freeze browser).
6. Update `memory.md` — jelaskan pivot dari sistem panel-rotasi ke voxel-fill (alasan: user mau kontrol resolusi bebas & hasil visual lebih rapi/konsisten dengan gaya building game asli), tandai entri Tahap 2 & hotfix sebelumnya sebagai **SUPERSEDED/digantikan** oleh task ini (jangan dihapus riwayatnya, cukup dicatat digantikan).
7. `git push --force` DILARANG MUTLAK.
8. **STOP setelah ini** — Tahap 3 (dual camera) masih menunggu, prompt terpisah nanti.
