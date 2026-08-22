# PROMPT KERJA — TERAPKAN STANDAR DESAIN MENU BUTTON KE GEARS (36 item) & LINKAGES (45 item)

> **WAJIB DIBACA DULU:** `instruction.md`, `design.md` (section **"Standar Desain Menu Button (Default Global)"**), `memory.md` versi TERBARU.

## KONTEKS — INI TASK BESAR TAPI IMPLEMENTASINYA KECIL

Ada 81 item total (`gearData.js` 36 entri, `linkageData.js` 45 entri), TAPI keduanya **data-driven** — dirender lewat 1 loop `.map()` di `GearsPage.jsx`/`LinkagesPage.jsx`. **TIDAK PERLU bikin 81 icon/warna manual** — cukup ubah loop render-nya SEKALI per halaman, warna diturunkan OTOMATIS dari field `c.color` yang SUDAH ADA di data, icon reuse komponen `<GearIcon>`/`<LinkageIcon>` yang SUDAH ADA.

## SCOPE FILE
- `src/utils/colorHelper.js` — tambah 2 fungsi baru (konversi warna).
- `src/pages/GearsPage.jsx` — ganti loop render tombol.
- `src/pages/LinkagesPage.jsx` — ganti loop render tombol (pola SAMA PERSIS seperti GearsPage, cuma beda data/komponen icon).
- `memory.md` — catat perubahan.

**JANGAN ubah `gearData.js`/`linkageData.js`/`GearIcon.jsx`/`LinkageIcon.jsx`** — data & komponen icon yang sudah ada dipakai APA ADANYA, cuma cara render tombolnya yang berubah.

---

## 1. TAMBAH FUNGSI KONVERSI WARNA DI `colorHelper.js`

**Append** (jangan hapus `hexToRgbStr` yang sudah ada, itu masih dipakai file lain — cek dulu):

```js
// Ekstrak HUE dari warna hex (rumus standar RGB->HSL, cuma ambil komponen H).
// Dipakai supaya tiap item data yang sudah punya warna sendiri (gearData/linkageData)
// otomatis dapat palet top/bottom/lip standar MenuButton3D TANPA perlu didaftar manual satu-satu.
export function hexToHue(hex) {
    const a = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!a) return 210; // fallback biru kalau parsing gagal
    const r = parseInt(a[1], 16) / 255, g = parseInt(a[2], 16) / 255, b = parseInt(a[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    const d = max - min;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    return Math.round(h);
}

// Konversi 1 warna hex jadi 3-tone palet standar MenuButton3D (top/bottom/lip).
// Saturation & lightness FIXED ke nilai yang sudah divalidasi di standar desain (design.md
// Bagian "Standar Desain Menu Button") — cuma HUE yang ikut warna asli tiap item data.
export function hexToMenuButtonColors(hex) {
    const h = hexToHue(hex);
    return {
        top: `hsl(${h}, 85%, 64%)`,
        bottom: `hsl(${h}, 85%, 42%)`,
        lip: `hsl(${h}, 85%, 28%)`,
    };
}
```

---

## 2. GANTI LOOP RENDER DI `GearsPage.jsx`

**Import baru:**
```js
import MenuButton3D from '../components/MenuButton3D';
import { hexToMenuButtonColors } from '../utils/colorHelper';
```
(`hexToRgbStr` boleh tetap di-import KALAU masih dipakai bagian lain file ini — cek dulu; kalau ternyata sudah tidak dipakai sama sekali setelah perubahan ini, boleh dihapus importnya, tapi TIDAK WAJIB.)

**Cari blok ini** (di dalam `<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{filtered.map(c => { ... })}</div>`):
```jsx
{filtered.map(c => {
    const d = hexToRgbStr(c.color);
    return <button key={c.id} onClick={() => toast.info(`${c.name} masih dalam pengerjaan`)}
        style={{ ...gaya lama... }}
        ...
    ><div>...</div><div>...</div><div>...</div></button>
})}
```

**GANTI jadi:**
```jsx
{filtered.map(c => {
    const { top, bottom, lip } = hexToMenuButtonColors(c.color);
    return (
        <MenuButton3D
            key={c.id}
            label={c.name}
            subtitle={c.desc}
            top={top} bottom={bottom} lip={lip}
            onClick={() => toast.info(`${c.name} masih dalam pengerjaan`)}
            icon={
                <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GearIcon icon={c.icon} color="#ffffff" size={30} />
                </div>
            }
        />
    );
})}
```

**Catatan:**
- `onClick` **PERSIS SAMA** seperti sebelumnya (`toast.info(...)`) — TIDAK BERUBAH, cuma dipindah ke prop `MenuButton3D`.
- Warna icon diganti jadi **putih solid** (`color="#ffffff"`), BUKAN `c.color` seperti sebelumnya — karena sekarang background tombolnya sendiri sudah berwarna (dari `top`/`bottom`), icon putih lebih konsisten dengan standar desain 12 tombol yang sudah dikerjakan sebelumnya (icon putih dengan shading, bukan icon berwarna di atas card gelap). Kalau `GearIcon` tidak mendukung warna solid putih dengan baik (misal shading internalnya bergantung pada warna asli), sesuaikan seperlunya tapi **prioritaskan icon tetap terbaca jelas** di atas background berwarna.
- Badge nomor ID kecil (`"01"`, dst) dan titik kecil di kanan yang ada di versi lama **boleh dihilangkan** — `MenuButton3D` standar tidak punya slot untuk itu, dan itu bukan elemen penting (subtitle `c.desc` sudah cukup memberi konteks).
- Search bar, judul "GEARS", deskripsi halaman, tombol back — **TIDAK DIUBAH SAMA SEKALI**, cuma bagian loop render tombolnya saja.

---

## 3. GANTI LOOP RENDER DI `LinkagesPage.jsx` — POLA SAMA PERSIS

Ikuti langkah IDENTIK seperti Bagian 2, tinggal ganti:
- Import `LinkageIcon` bukan `GearIcon`.
- Import dari `linkageData` (sudah ada, tidak berubah).
- Di JSX: `<LinkageIcon icon={c.icon} color="#ffffff" size={30} />` bukan `<GearIcon>`.
- Sisanya (judul "LINKAGES", search placeholder "Cari linkage...", dst) **TIDAK DIUBAH**.

---

## CHECKLIST VERIFIKASI WAJIB
1. Build check — `npm run build`, 0 error.
2. Scope check — diff HANYA `colorHelper.js`, `GearsPage.jsx`, `LinkagesPage.jsx` (+ `memory.md`).
3. **Verifikasi SEMUA 36 gear & 45 linkage tampil** dengan warna BERBEDA-BEDA sesuai `c.color` masing-masing (bukan 1 warna rata buat semua — kalau semua item keliatan warna sama, berarti `hexToMenuButtonColors` tidak dipanggil per-item dengan benar).
4. Verifikasi `onClick` tiap tombol MASIH munculin toast `"[nama] masih dalam pengerjaan"` persis seperti sebelumnya.
5. Verifikasi search/filter (`query`) MASIH BERFUNGSI — ketik di search box, list ter-filter, tombol yang muncul tetap pakai desain baru.
6. Verifikasi icon `GearIcon`/`LinkageIcon` tetap kebaca jelas (warna putih, size 30) di dalam slot 44px.
7. Update `memory.md` — catat pendekatan data-driven ini (1 loop diubah = otomatis berlaku ke 81 item, warna diturunkan dari hue asli tiap item).
8. `git push --force` DILARANG MUTLAK.
