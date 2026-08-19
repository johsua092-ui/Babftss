# PROMPT KERJA — 3D BLOCK SIMULATOR, BAGIAN 2: GIZMO 3-AXIS + PAINT PORT

> **WAJIB DIBACA DULU:** `instruction.md`, `design.md`, `memory.md` (terutama Bagian 44 — laporan Bagian 1 sebelumnya: fix orbit sign, hitTest, rotZ — task ini DIBANGUN DI ATAS fix itu), `RULES_AUTONOMI_QWEN.md`, `RULES_KESELAMATAN_GIT.md`. Versi TERBARU dari repo (Bagian 1 SUDAH ter-push & terverifikasi, jadi `hitTest` dan `rotZ` di kode kamu sekarang HARUS sudah dalam kondisi benar — kalau ternyata belum, STOP dan lapor, jangan lanjut).

## KONTEKS SCOPE

Sama seperti Bagian 1: **fokus 100% ke `src/pages/BlockSimulator3D.jsx`** (+ 1 import dari komponen shared yang sudah ada). **DILARANG KERAS menyentuh file lain** — kalau ada file lain yang beda dari terakhir kamu tahu (tim lain kerja modul lain: marketplace, AI chat, mobile picker, dll), itu WAJAR, JANGAN disentuh/direvert.

Ini task TUNGGAL berisi 4 fitur (Move gizmo, Rotate gizmo, Scale gizmo, Paint port) — boleh dikerjakan berurutan dalam 1 task ini KARENA semuanya saling terkait (satu sistem gizmo), TAPI **verifikasi masing-masing secara terpisah** sebelum lanjut ke yang berikutnya, dan laporkan progress per-bagian di `memory.md`.

---

## KONSEP UMUM GIZMO (berlaku utk Move & Scale, baca dulu sebelum coding)

Style targetnya **Roblox Studio**: 3 handle terpisah berwarna **merah=X, hijau=Y, biru=Z**, tiap handle diklik & di-drag SATU PER SATU (bukan gizmo gabungan otomatis).

**Posisi handle** (dari titik tengah blok terpilih `b.pos`):
```js
const handleOffset = Math.max(b.size.x, b.size.y, b.size.z) * 0.5 + 0.8;
const handleX = b.pos.add(new Vec3(handleOffset, 0, 0)); // merah
const handleY = b.pos.add(new Vec3(0, handleOffset, 0)); // hijau
const handleZ = b.pos.add(new Vec3(0, 0, handleOffset)); // biru
```
Gambar tiap handle sebagai garis dari `project(b.pos)` ke `project(handleX/Y/Z)` (warna sesuai sumbu) + lingkaran kecil/segitiga kecil di ujungnya (radius ~6-8px) sebagai target klik yang jelas.

**Hit-test handle** (PRIORITAS LEBIH TINGGI dari hit-test blok biasa — cek ini DULU sebelum `hitTest()` normal, hanya aktif kalau `s.selected` sedang tidak null dan tool sedang 'move'/'rotate'/'scale'):
```js
const hitHandle = (mx, my, block) => {
  const handleOffset = Math.max(block.size.x, block.size.y, block.size.z) * 0.5 + 0.8;
  const axes = [
    { axis: 'x', vec: new Vec3(handleOffset, 0, 0) },
    { axis: 'y', vec: new Vec3(0, handleOffset, 0) },
    { axis: 'z', vec: new Vec3(0, 0, handleOffset) },
  ];
  for (const { axis, vec } of axes) {
    const p = project(block.pos.add(vec));
    if (Math.hypot(p.x - mx, p.y - my) < 14) return axis; // 14px radius klik, cukup toleran buat jari/mouse
  }
  return null;
};
```

**Rumus drag per-axis (PENTING, pakai proyeksi vektor, JANGAN pakai dx/dy mentah seperti kode lama)** — ini supaya drag akurat & tetap benar dari sudut kamera manapun:
```js
// Dipanggil saat drag berlangsung, axis = 'x'|'y'|'z' dari handle yang di-grab saat mousedown
const dragAxisDelta = (mx, my, dragStartMouse, blockStartPos, axis) => {
  const axisUnit = axis === 'x' ? new Vec3(1,0,0) : axis === 'y' ? new Vec3(0,1,0) : new Vec3(0,0,1);
  const centerScreen = project(blockStartPos);
  const axisTipScreen = project(blockStartPos.add(axisUnit));
  const screenAxisVec = { x: axisTipScreen.x - centerScreen.x, y: axisTipScreen.y - centerScreen.y };
  const mouseDelta = { x: mx - dragStartMouse.x, y: my - dragStartMouse.y };
  const denom = screenAxisVec.x * screenAxisVec.x + screenAxisVec.y * screenAxisVec.y;
  if (denom < 0.0001) return 0; // axis nyaris tegak lurus layar (invisible), hindari div-by-zero
  const t = (mouseDelta.x * screenAxisVec.x + mouseDelta.y * screenAxisVec.y) / denom;
  return t; // ini LANGSUNG dalam satuan world unit sepanjang axis tsb
};
```
Fungsi ini reusable untuk Move (ubah `pos[axis]`) dan Scale (ubah `size[axis]` + kompensasi `pos[axis]`, lihat bagian Scale).

---

## FITUR 1 — MOVE: gizmo 3-axis penuh (X/Y/Z, gaya Roblox)

**Ganti total logika `tool === 'move'`** di `onMouseDown` dan `onMouseMove`:
- `onMouseDown`: kalau `s.selected` sudah ada (blok sebelumnya terpilih) DAN klik kena salah satu handle (`hitHandle`) → mulai drag axis itu (`s.dragAxis = 'x'|'y'|'z'`, simpan `dragStartMouse`, `blockStartPos`). Kalau klik TIDAK kena handle → jalankan `hitTest()` normal seperti biasa (pilih blok baru / deselect).
- `onMouseMove` saat `s.dragAxis` aktif: hitung `t = dragAxisDelta(...)`, lalu:
  ```js
  s.selected.pos[s.dragAxis] = snapSingleAxis(s.blockStart.pos[s.dragAxis] + t);
  ```
  (`snapSingleAxis` = `Math.round(v)` per-axis, JANGAN pakai `snap()` lama yang bulatkan 3 sumbu sekaligus — sumbu lain harus tetap presisi, tidak ikut ke-snap kalau tidak digerakkan.)
- `onMouseUp`: reset `s.dragAxis = null`.

**Hapus logika lama** yang gerakin `pos.x`/`pos.z` langsung dari `dx`/`dy` mentah (baris lama ~479-481) — sudah digantikan sepenuhnya oleh sistem handle di atas.

---

## FITUR 2 — ROTATE: gizmo 3-axis (X/Y/Z)

Sama persis pola handle & hit-test seperti Move (reuse `hitHandle`, boleh handle-nya digambar beda — lingkaran/busur kecil bukan garis lurus, biar visual beda dari Move — tapi posisi & radius klik SAMA).

**Drag interaction (pola sederhana, konsisten dengan rotate Y yang SUDAH ADA sebelumnya):**
```js
if (s.dragAxis === 'y') s.selected.rot.y = s.blockStart.rot.y + (mx - dragStartMouse.x) * 0.008;
else if (s.dragAxis === 'x') s.selected.rot.x = s.blockStart.rot.x + (my - dragStartMouse.y) * 0.008;
else if (s.dragAxis === 'z') s.selected.rot.z = s.blockStart.rot.z + (mx - dragStartMouse.x) * 0.008;
```
(Y & Z pakai horizontal drag `dx`, X pakai vertical drag `dy` — pola umum di software 3D: putar sumbu yang "menghadap ke layar" pakai drag horizontal, sumbu yang "mendatar ke layar" pakai drag vertical. Kalau setelah tes ini kerasa gak natural, boleh disesuaikan tapi WAJIB dilaporkan alasannya di `memory.md`.)

Rotasi Y sekarang harus tetap bisa dites via handle (bukan drag-di-mana-saja lagi seperti sebelumnya) — pastikan behavior lama (drag-anywhere buat rotate Y) DIHAPUS, diganti handle-only, konsisten dengan Move.

---

## FITUR 3 — SCALE: memanjangkan/memendekkan PER SUMBU (bukan membesar seragam)

**Ini beda konsep dari kode lama** — bukan resize keseluruhan blok, tapi **stretch dari satu sisi** (persis Roblox: tarik handle, sisi yang berlawanan tetap diam, cuma sisi yang ditarik yang maju/mundur).

Reuse handle position & `hitHandle` yang sama seperti Move. Saat drag:
```js
const t = dragAxisDelta(mx, my, dragStartMouse, s.blockStart.pos, s.dragAxis); // world unit delta di ujung + axis
const newSize = Math.max(0.2, s.blockStart.size[s.dragAxis] + t);
const actualDelta = newSize - s.blockStart.size[s.dragAxis];
s.selected.size[s.dragAxis] = newSize;
// Kompensasi posisi supaya sisi BERLAWANAN (sisi -axis) tetap diam, cuma sisi +axis yang gerak:
s.selected.pos[s.dragAxis] = s.blockStart.pos[s.dragAxis] + actualDelta / 2;
```
**Verifikasi wajib:** scale sumbu X pada blok, pastikan sisi KIRI blok (arah -X) tidak bergerak sama sekali, cuma sisi KANAN (+X, tempat handle) yang maju/mundur. Ulangi utk Y (bawah tetap diam, atas yang gerak) dan Z.

---

## FITUR 4 — PAINT: ganti UI jadi `ColorWheelPicker` (port dari 2D, sesuai izin pemilik komponen)

**Import komponen shared yang SUDAH ADA** (JANGAN duplikat/tulis ulang):
```js
import ColorWheelPicker from '../components/ColorWheelPicker';
```

**Ganti 2 tempat:**

1. **Palet warna untuk tool Place** (baris ~760, `{COLORS.map(...)}`) — TAMBAHKAN 1 tombol baru di ujung baris swatch (ikon kuas/palette, pakai `Paintbrush` yang sudah di-import) yang membuka modal `ColorWheelPicker` untuk pilih warna bebas (bukan cuma 12 preset). State baru: `const [showColorWheel, setShowColorWheel] = useState(false);` dan `const [colorWheelDraft, setColorWheelDraft] = useState(currentColor);`. Modal ini styling-nya **tiru PERSIS** kartu `SlotColorPickerModal` di `src/pages/LogicGatesSimulator.jsx` (baris ~1008-1080: background gradient gelap `linear-gradient(180deg, #1e293b 0%, #0f172a 100%)`, border `#334155`, tombol Confirm hijau gradient, tombol Cancel abu-abu) — **copy struktur JSX & style objeknya**, sesuaikan variable name, HTML lain di file itu (undo/redo history dsb) JANGAN ikut disalin, cuma bagian modal color picker-nya saja.
   - Confirm → `setCurrentColor(colorWheelDraft); setShowColorWheel(false);`
   - Cancel → `setShowColorWheel(false);` (tanpa ubah `currentColor`)

2. **Popup `paintConfirm`** (baris ~857-930) — TETAP ADA (preview before/after + confirm/cancel sudah bagus, JANGAN dihapus), tapi tambahkan 1 tombol kecil "🎨 Pilih warna lain" di dalam popup itu yang juga membuka `ColorWheelPicker` modal yang sama (kalau user mau ganti warna tanpa keluar dari mode Paint & klik ulang blok). Kalau ini terasa rumit untuk 1 task, boleh di-skip dulu (opsional) — laporkan di `memory.md` kalau di-skip, JANGAN dipaksakan sampai bikin bug.

**WAJIB:** komponen `ColorWheelPicker` sudah ada exports & props-nya (`hex`, `onChange`, `onPickColor`) — baca dulu `src/components/ColorWheelPicker.jsx` sebelum pakai, JANGAN menebak propsnya.

---

## FILE YANG DIUBAH
- `src/pages/BlockSimulator3D.jsx` — SEMUA 4 fitur di atas.

## FILE YANG DIBACA (referensi, TIDAK DIUBAH)
- `src/components/ColorWheelPicker.jsx` (baca props & cara pakai)
- `src/pages/LogicGatesSimulator.jsx` (baca `SlotColorPickerModal` baris ~1008-1080 buat contekan styling — JANGAN import apapun dari file ini, cuma contek visual/struktur JSX-nya)

## FILE YANG DILARANG DISENTUH
Sama seperti Bagian 1 — semua file lain, tanpa kecuali.

---

## CHECKLIST VERIFIKASI WAJIB (per fitur, jangan digabung jadi satu cek besar di akhir)

1. **Move**: drag tiap handle (X/Y/Z) dari beberapa sudut kamera berbeda (orbit dulu, baru drag) — blok harus gerak SESUAI arah handle yang diklik, bukan arah lain. Sumbu yang tidak di-drag TIDAK berubah nilainya sama sekali.
2. **Rotate**: tiap handle X/Y/Z bisa diputar independen, hasil visual rotasi masuk akal (tidak "meledak"/terdistorsi — kalau terdistorsi, kemungkinan `rotZ` dari Bagian 1 belum ke-apply dengan benar, CEK ULANG dulu sebelum lanjut).
3. **Scale**: tarik tiap handle, sisi berlawanan blok harus DIAM, cuma sisi yang ditarik yang berubah. Ukuran minimum tetap terjaga (tidak bisa jadi negatif/kebalik).
4. **Paint**: buka `ColorWheelPicker`, pilih warna bebas (bukan cuma 12 preset), Confirm menerapkan warna itu ke `currentColor`/blok yang di-paint, Cancel tidak mengubah apapun. Styling modal terasa konsisten (gelap, gradient, tombol hijau/abu) dengan punya 2D.
5. **Build check** — `npm run build`, 0 error.
6. **Scope check** — diff HANYA `BlockSimulator3D.jsx` (+ mungkin `memory.md`).
7. **Update `memory.md`** — append entri baru, jelaskan 4 fitur + hasil verifikasi tiap fitur + catatan kalau ada yang di-skip/disesuaikan (misal soal FITUR 4 poin 2 yang opsional).
8. **STOP setelah task ini.** Ini kemungkinan besar bug terakhir yang dilaporkan — tapi JANGAN cari-cari perbaikan tambahan sendiri di luar 4 fitur ini tanpa instruksi baru.
9. `git push --force` DILARANG MUTLAK. Push biasa saja; kalau ditolak, STOP & lapor (ikuti prosedur sama seperti Bagian 1 — fetch read-only, laporkan apa yang berubah di remote, jangan asumsikan itu masalah kecuali benar-benar konflik langsung di baris yang sama).
