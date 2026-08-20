# PROMPT KERJA — 3D BLOCK SIMULATOR: 6 PERBAIKAN BUNDEL

> **WAJIB DIBACA DULU:** `instruction.md`, `design.md`, `memory.md` (entri terbaru: Shape Generator v2 voxel-fill).

## KONTEKS SCOPE
Fokus 100% ke `src/pages/BlockSimulator3D.jsx`. 6 poin di bawah **independen satu sama lain** — kerjakan berurutan, **verifikasi tiap poin selesai sebelum lanjut ke poin berikutnya**, JANGAN gabung semua verifikasi jadi 1 di akhir.

---

## POIN A — Tombol "Clear All" (merah, konfirmasi)

Saat tool `clear` aktif, tampilkan tombol merah **"Clear All"**. Diklik → **muncul konfirmasi dulu** (jangan langsung hapus tanpa konfirmasi — data user bisa hilang permanen, ini WAJIB demi UX yang aman):
```jsx
{tool === 'clear' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
    {!confirmClearAll ? (
      <button onClick={() => setConfirmClearAll(true)} style={{
        background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#fff', border: '1px solid #f87171',
        borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
      }}>🗑️ Clear All</button>
    ) : (
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => {
          stateRef.current.blocks = [];
          stateRef.current.selected = null;
          setConfirmClearAll(false);
          updateUISelection(null);
          render();
        }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 700 }}>
          Yakin? Hapus SEMUA
        </button>
        <button onClick={() => setConfirmClearAll(false)} style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px' }}>
          Batal
        </button>
      </div>
    )}
  </div>
)}
```
State baru: `const [confirmClearAll, setConfirmClearAll] = useState(false);`. Reset `confirmClearAll` ke `false` setiap kali user pindah tool dari `clear` ke tool lain (supaya tombol konfirmasi tidak "nyangkut").

---

## POIN B — Face Culling (sembunyikan sisi kubus yang ketutup kubus lain, gaya Minecraft)

**Ini optimisasi performa PALING BERDAMPAK dari semua poin di sini** — mengurangi jumlah wajah yang digambar drastis kalau banyak blok saling menempel.

**Prinsip:** untuk blok yang **TIDAK dirotasi** (`rot.x≈0 && rot.y≈0 && rot.z≈0`, pakai toleransi `Math.abs(v) < 0.001`), tiap 1 dari 6 wajahnya **TIDAK digambar** kalau ada blok lain (juga tidak dirotasi, ukuran sama di sumbu yang bersangkutan) yang menempel PERSIS di sisi itu (nutup total). Blok yang DIROTASI (hasil tool Rotate manual) selalu digambar penuh 6 wajah, TIDAK di-cull (biar tidak ribet & aman, sesuai instruksi — rotasi bikin deteksi "nutup total" jauh lebih rumit, di luar scope task ini).

**Langkah 1 — bangun lookup map posisi SEKALI per frame render** (sebelum loop `sorted.forEach`, taruh tepat sebelum baris `sorted.forEach(item => {`):
```js
// Lookup cepat: kunci posisi (dibulatkan) -> blok, dipakai buat face culling.
// Cuma isi blok yang AXIS-ALIGNED (tidak dirotasi) — blok yang dirotasi TIDAK ikut serta
// sebagai kandidat "penutup wajah" (supaya deteksi tetap sederhana & akurat).
const posKey = (v) => `${Math.round(v.x*1000)},${Math.round(v.y*1000)},${Math.round(v.z*1000)}`;
const blockLookup = new Map();
s.blocks.forEach(b => {
  const r = b.rot || new Vec3(0,0,0);
  if (Math.abs(r.x) < 0.001 && Math.abs(r.y) < 0.001 && Math.abs(r.z) < 0.001) {
    blockLookup.set(posKey(b.pos), b);
  }
});

// Cek apakah wajah blok b di arah `dir` (Vec3 satuan, misal (1,0,0) utk +X) ketutup TOTAL
// oleh blok tetangga yang menempel persis di situ.
const isFaceCovered = (b, dir, sizeAlongAxis) => {
  const r = b.rot || new Vec3(0,0,0);
  if (Math.abs(r.x) >= 0.001 || Math.abs(r.y) >= 0.001 || Math.abs(r.z) >= 0.001) return false; // b sendiri dirotasi, jangan cull
  const neighborPos = new Vec3(
    b.pos.x + dir.x * sizeAlongAxis,
    b.pos.y + dir.y * sizeAlongAxis,
    b.pos.z + dir.z * sizeAlongAxis,
  );
  const neighbor = blockLookup.get(posKey(neighborPos));
  if (!neighbor) return false;
  // Wajah ketutup TOTAL cuma kalau ukuran tetangga di 2 sumbu YANG SEJAJAR WAJAH itu sama
  // atau lebih besar (biar gak ada celah kelihatan). Cek sederhana: ukuran sama di ketiga
  // sumbu (kasus paling umum — voxel-fill & Place tool selalu pakai ukuran seragam per-batch).
  return neighbor.size.x === b.size.x && neighbor.size.y === b.size.y && neighbor.size.z === b.size.z;
};
```

**Langkah 2 — pakai `isFaceCovered` di dalam `sorted.forEach`, SEBELUM `faces.forEach(f => { ... })` yang menggambar:**

Cocokkan tiap entri di array `faces` (yang sudah ada, 6 objek `{idx, shade}`) dengan arah normalnya (LOCAL, sebelum rotasi — karena kita cuma cull kalau blok TIDAK dirotasi, jadi arah lokal = arah dunia, aman dipakai langsung):
```js
const faceDirs = [
  { dir: new Vec3(0,0,-1), axis: 'z' }, // idx [3,2,1,0] → -Z
  { dir: new Vec3(0,0, 1), axis: 'z' }, // idx [4,5,6,7] → +Z
  { dir: new Vec3(0,-1,0), axis: 'y' }, // idx [0,1,5,4] → -Y
  { dir: new Vec3(0, 1,0), axis: 'y' }, // idx [7,6,2,3] → +Y
  { dir: new Vec3(-1,0,0), axis: 'x' }, // idx [4,7,3,0] → -X
  { dir: new Vec3( 1,0,0), axis: 'x' }, // idx [1,2,6,5] → +X
];
// faces array urutannya SAMA PERSIS dengan faceDirs di atas (index-matched) — JANGAN diacak.
faces.forEach((f, fi) => {
  const { dir, axis } = faceDirs[fi];
  const sizeAlongAxis = axis === 'x' ? b.size.x : axis === 'y' ? b.size.y : b.size.z;
  f.culled = isFaceCovered(b, dir, sizeAlongAxis);
});
```
Lalu di bagian `faces.forEach(f => { ... gambar wajah ... })` yang SUDAH ADA, tambahkan guard di baris paling awal isinya: `if (f.culled) return;` (skip gambar wajah itu).

**PENTING:** urutan `faceDirs` HARUS index-matched persis sama urutan array `faces` yang SUDAH ADA di kode (`idx:[3,2,1,0]` dst) — sudah aku petakan manual di atas berdasarkan `getBlockCorners`, JANGAN diubah urutannya sendiri.

---

## POIN C — Background lebih terang

Cari `bgGrad.addColorStop(0, '#0e1420'); bgGrad.addColorStop(1, '#05080f');` — ganti jadi warna lebih terang tapi TETAP ada gradasi kedalaman (jangan putih polos flat, tetap kasih nuansa "ruang 3D"):
```js
bgGrad.addColorStop(0, '#3a4a63');
bgGrad.addColorStop(1, '#1b2536');
```
Sesuaikan juga warna garis grid (`ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)'`) — naikkan opacity dikit jadi `0.28` biar tetap kelihatan jelas di atas background yang lebih terang.

---

## POIN D — Perluas area grid

Ganti `const GRID_SIZE = 14;` jadi `const GRID_SIZE = 30;`. **Catatan jujur soal performa** (jangan overclaim ke user): grid lebih luas + face culling (Poin B) sama-sama bantu, TAPI **tidak ada jaminan "0 lag mutlak"** kalau user taruh puluhan ribu blok — itu batasan wajar Canvas 2D dengan proyeksi manual (bukan WebGL). Tulis catatan ini apa adanya di `memory.md`, JANGAN janji ke user bahwa ini akan selalu lancar di jumlah blok berapapun.

---

## POIN E — Fix bug snap grid tidak presisi (Place tool)

**Akar masalah:** `getGridPos()` sekarang brute-force scan grid dengan step `0.5` lalu di akhir `snap()` MEMBULATKAN ke integer — dua langkah ini gak konsisten (scan di step 0.5, tapi hasil akhir dipaksa ke integer), which menghasilkan pemilihan titik yang kadang meleset dari yang sebenarnya paling dekat ke posisi mouse. **Ganti total dengan unprojection analitik** (matematika ray-plane intersection, BUKAN brute-force sampling) — **sudah diverifikasi numerik** (round-trip error `~10⁻¹³`, praktis nol):

```js
const getGridPos = (mx, my) => {
  const s = stateRef.current;
  const f = 700; // WAJIB sama persis dengan focalLength di project() — JANGAN pakai angka beda
  const cx = s.cx / s.dpr, cy = s.cy / s.dpr;
  const Dx = (mx - cx) / f, Dy = -(my - cy) / f, Dz = 1;

  const camToWorld = (v) => {
    let p = rotX(v, -s.cam.pitch);
    p = rotY(p, -s.cam.yaw);
    return s.cam.target.add(p);
  };

  const p0 = camToWorld(new Vec3(0, 0, -s.cam.dist));
  const p1 = camToWorld(new Vec3(Dx, Dy, -s.cam.dist + Dz));
  const A = p0.y, B = p1.y - p0.y;
  if (Math.abs(B) < 1e-9) return null; // ray sejajar ground, gak ada titik potong
  const t = -A / B;
  const wx = p0.x + t * (p1.x - p0.x);
  const wz = p0.z + t * (p1.z - p0.z);
  return snap(new Vec3(wx, 0, wz));
};
```
**Hapus** loop brute-force lama (`for x... for z... project... hypot...`) sepenuhnya, ganti dengan kode di atas.

**WAJIB verifikasi:** taruh blok di beberapa titik & sudut kamera berbeda (termasuk setelah orbit kamera jauh), pastikan blok yang ditaruh PERSIS di perpotongan garis grid yang terlihat di layar, tidak geser sedikitpun.

---

## POIN F — Shape Generator: aktifkan rotasi lagi (voxel ikut mengikuti kontur, bukan kaku axis-aligned)

**Konteks:** voxel-fill sekarang SEMUA axis-aligned (`rot: 0,0,0`) — user minta supaya voxel di permukaan lengkung (Sphere/Cylinder/Cone/Torus) **DIPUTAR** mengikuti arah normal permukaan setempat, biar hasilnya lebih halus mengikuti bentuk (bukan cuma tangga-tangga kotak).

**PENTING — trade-off yang WAJIB dicatat di `memory.md`:** voxel yang DIROTASI **TIDAK IKUT DAPAT keuntungan Face Culling di Poin B** (karena Poin B sengaja cuma cull blok axis-aligned, demi kesederhanaan & akurat). Jadi Shape Generator versi rotasi ini SECARA SADAR mengorbankan sebagian performa demi visual lebih halus — ini trade-off yang disengaja, bukan bug.

**Fungsi orientasi ini SUDAH PERNAH diverifikasi numerik sebelumnya** (dipakai di task lain, akurat sampai presisi `10⁻¹⁶`) — reuse APA ADANYA, jangan diturunkan ulang:
```js
function solveFullOrientation(N, tangentHint) {
  const norm = (v) => { const l = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x/l, y: v.y/l, z: v.z/l }; };
  const dot = (a, b) => a.x*b.x + a.y*b.y + a.z*b.z;
  const cross = (a, b) => ({ x: a.y*b.z - a.z*b.y, y: a.z*b.x - a.x*b.z, z: a.x*b.y - a.y*b.x });
  const Nn = norm(N);
  const d = dot(tangentHint, Nn);
  const Traw = { x: tangentHint.x - Nn.x*d, y: tangentHint.y - Nn.y*d, z: tangentHint.z - Nn.z*d };
  const T = norm(Traw);
  const B = norm(cross(Nn, T));
  const rx = Math.asin(Math.max(-1, Math.min(1, B.z)));
  const ry = Math.atan2(T.z, Nn.z);
  const rz = Math.atan2(-B.x, B.y);
  return { rx, ry, rz };
}
```

**Terapkan HANYA di 4 bentuk lengkung** (Sphere, Cylinder, Cone, Torus) di `generateVoxelShape`/`shellTest` — saat sebuah titik grid `p` LOLOS `shellTest`, sebelum push ke `newBlocks`, hitung normal permukaan di titik itu (arah dari pusat bentuk relevan ke `p`, TERGANTUNG bentuknya — untuk Sphere: `normalize(p)`; Cylinder/Cone: `normalize({x:p.x, y:0, z:p.z})` radial horizontal; Torus: normal tabung, arah dari sumbu tabung terdekat ke `p`), dan `tangentHint = { x: -p.z, y: 0, z: p.x }` dinormalisasi (arah tangensial kasar mengelilingi sumbu Y, sama untuk ke-4 bentuk — fungsi `solveFullOrientation` otomatis meluruskannya via Gram-Schmidt, TIDAK perlu presisi sempurna):
```js
const { rx, ry, rz } = solveFullOrientation(N, tangentHint);
// dipakai sebagai rot voxel INI SAJA, bukan default (0,0,0) lagi:
rot: new Vec3(rx, ry, rz),
```

**Tetap TIDAK berubah** (biarkan axis-aligned, TIDAK dirotasi): Cube, Tetrahedron, Octahedron, Icosahedron (bentuk-bentuk ini sudah "kaku" secara alami/wajar tanpa perlu ikut kontur lengkung, JANGAN diubah).

---

## FILE YANG DIUBAH
- `src/pages/BlockSimulator3D.jsx` — semua 6 poin di atas, HANYA file ini.

## CHECKLIST VERIFIKASI (per poin, JANGAN digabung)
1. Build check — `npm run build`, 0 error (cek SETELAH SEMUA 6 poin selesai).
2. **A**: tombol Clear All muncul saat tool clear, ada konfirmasi, klik yakin → semua blok hilang, `s.selected` ikut ke-reset.
3. **B**: taruh banyak blok bertumpuk rapat (axis-aligned), pastikan visual TETAP benar (tidak ada wajah luar yang ikut hilang, cuma wajah yang BENERAN ketutup total yang hilang) — coba dari beberapa sudut kamera termasuk kalau ada 1 blok "dicolek" keluar dari susunan, wajah yang tadinya ketutup HARUS otomatis muncul lagi.
4. **C**: background terlihat lebih terang, grid tetap jelas kebaca.
5. **D**: coba taruh blok di ujung terjauh grid baru (radius 30), pastikan masih bisa & kelihatan.
6. **E**: verifikasi presisi snap dari BEBERAPA sudut kamera (termasuk setelah orbit jauh) — blok HARUS pas di garis grid, tanpa kecuali.
7. **F**: generate ulang Sphere/Cylinder/Cone/Torus, voxel-voxel-nya harus terlihat sedikit "miring mengikuti kontur" (bukan kotak-kotak lurus kaku semua), TETAP bisa di-edit manual per-voxel seperti biasa.
8. Update `memory.md` — SEMUA 6 poin, termasuk catatan jujur soal batas performa (Poin D) dan trade-off face-culling vs rotasi (Poin F).
9. `git push --force` DILARANG MUTLAK.
10. **STOP setelah 6 poin ini.** Tahap 3 (dual camera) masih menunggu, prompt terpisah nanti.
