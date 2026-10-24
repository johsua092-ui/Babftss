# Generator & Verifikator Ikon Item — `public/blocks/icon/`

> **WAJIB baca `instruction.md` §30 dulu.** Folder ini ada karena skrip lama
> pernah HILANG, sehingga AI berikutnya mengarang setelan render dari nol dan
> menghasilkan ikon "putih pudar" yang ditolak user. JANGAN buat generator baru
> dari nol — pakai skrip di sini.

## Isi

| File | Fungsi |
|---|---|
| `gen-icon-nsi2.cjs` | Generator ikon NSI Level 2 (13 item). Render 3D → PNG RGBA transparan → cocokkan warna per item ke `reference/`. |
| `verify-icons.cjs` | Verifikator: lembar kontak LAMA vs BARU di atas papan catur + cek alpha. |

## Prasyarat

- Vite dev server jalan: `npm run dev` → `http://localhost:5173/`
- Chrome dengan remote debugging di port `9333`
- Ada **1 tab** `localhost:5173` yang terbuka (skrip memakai tab itu, tidak membuka tab baru — lihat `instruction.md` §31)
- `reference/` berisi 13 ikon LAMA sebagai acuan warna (WAJIB ada, jangan dihapus)

## Cara pakai

```bash
# 1. generate ulang semua 13 ikon
node scripts/icons/gen-icon-nsi2.cjs

# 2. verifikasi (lembar kontak + alpha)
node scripts/icons/verify-icons.cjs
# → hasil: _banding.png (buka & periksa: tidak boleh ada yang lebih pucat)

# 3. build supaya masuk dist/
node node_modules/vite/bin/vite.js build
```

## Setelan inti (JANGAN diubah tanpa mengukur ulang)

```js
renderer.toneMapping = THREE.NoToneMapping;  // ACES mencuci warna
scene.environment = null;                    // RoomEnvironment mencuci saturasi
// lampu K=2.7: Ambient K*0.55, Directional K, Hemisphere K*0.25
renderer.setClearColor(0x000000, 0);          // latar TRANSPARAN
```

## Kenapa per-item grading

Satu setelan global tidak cukup — material berbeda bereaksi beda (gold
metalness 0.7 vs kayu vs dedaunan). Tanpa grading terukur:
`pine_tree dL=+0.187 dS=-0.150`, `trophy_1st dL=+0.284` → terlalu terang/pucat.

Urutan grade WAJIB: luminance → saturasi → koreksi luminance sisa.
Kalau digabung satu loop, luminance tidak konvergen (chest target 0.384 → 0.223).

## Menambah item baru

1. Tambahkan `['slug_baru', 256]` ke array `ITEMS` di `gen-icon-nsi2.cjs`.
2. Pastikan geometri ada di `src/utils/blockShapes.js` (`makeNsiGeometry`) dan
   material di `src/utils/blockMaterials.js` (`makeBlockMaterial`).
3. **Taruh ikon lama item itu di `reference/<slug>.png`** — ini acuan warna.
   Tanpa acuan, skrip akan menandai `TANPA_TARGET` dan tidak melakukan grading.
4. Jalankan generator, cek toleransi `|dL| ≤ 0.006`, `|dS| ≤ 0.008`.
5. Verifikasi pakai `verify-icons.cjs`, lalu cek juga di panel simulator.
