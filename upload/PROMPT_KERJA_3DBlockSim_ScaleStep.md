# PROMPT KERJA — 3D BLOCK SIMULATOR: FITUR "SCALE STEP"

> **WAJIB DIBACA DULU:** `instruction.md`, `design.md`, `memory.md` (terutama entri-entri terbaru soal `BlockSimulator3D` — 3 fix fondasi, gizmo 6-axis, port sistem paint), `RULES_AUTONOMI_QWEN.md`, `RULES_KESELAMATAN_GIT.md`. Versi TERBARU dari repo.

## KONTEKS SCOPE
Sama seperti task-task `BlockSimulator3D` sebelumnya: **fokus 100% ke `src/pages/BlockSimulator3D.jsx`**. File lain yang berubah karena tim paralel — JANGAN disentuh.

## LATAR BELAKANG

Terinspirasi dari game building 3D populer (referensi: sistem "Scale" mereka, dianalisis dari screenshot user, BUKAN kode/aset apapun yang disalin) — user ingin tool Scale punya kontrol presisi: user tentukan sendiri "kelipatan berapa" tiap tarikan handle mengubah ukuran, alih-alih hasil desimal bebas dari drag mouse mentah.

**Referensi visual dari user:**
- Field angka **"Scale: <angka>"** — user bisa ketik BEBAS angka berapapun (2, 0.5, 0.1, 0.05, dst), bukan dropdown preset.
- Efek: tiap resize pakai handle, ukuran hasil di-snap ke **kelipatan terdekat dari angka itu**. Contoh: Scale=2 → hasil selalu kelipatan 2 (2, 4, 6, 8...). Scale=0.1 → hasil kelipatan 0.1 (2.0, 2.1, 2.2...).
- Ada indikator ukuran real-time (panjang, tinggi, lebar) — **ini SUDAH ADA** di `selectedInfo` panel (`Size: {selectedInfo.size}`), tidak perlu dibuat baru.

---

## IMPLEMENTASI

### 1. State baru
Tambahkan di dekat state `currentColor`/`showColorWheel` (ikuti gaya penamaan yang sudah ada):
```js
const [scaleStep, setScaleStep] = useState(1); // default 1 stud/unit per snap
```

### 2. UI input "Scale Step" — HANYA muncul saat `tool === 'scale'`
Cari bagian toolbar tempat tombol tool (move/rotate/scale/dll) dirender. Tambahkan kondisional (pola mirip color palette yang cuma render saat `tool === 'place'`):
```jsx
{tool === 'scale' && (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(15,23,42,0.85)', padding: '6px 10px', borderRadius: 8,
    border: '1px solid #334155',
  }}>
    <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>Scale Step:</span>
    <input
      type="number"
      step="0.01"
      min="0.01"
      value={scaleStep}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        setScaleStep(Number.isFinite(v) && v > 0 ? v : 0.01); // JANGAN biarkan 0/negatif (bisa bikin size stuck/negatif)
      }}
      style={{
        width: 56, background: '#1e293b', border: '1px solid #475569',
        borderRadius: 4, color: '#e2e8f0', fontSize: 12, padding: '3px 6px',
        fontFamily: 'Inter, sans-serif',
      }}
    />
  </div>
)}
```
Posisikan berdekatan dengan tombol tool Scale di toolbar yang sudah ada (baca dulu struktur toolbar existing, ikuti pola styling yang konsisten dengan tombol lain di situ — JANGAN bikin gaya baru yang beda sendiri).

### 3. Terapkan snap di logic drag Scale (`onMouseMove`, blok `tool === 'scale'`)

**Kode SEKARANG** (hasil size kontinu, tidak di-snap):
```js
const t = dragAxisDelta(mx, my, s.dragStart, s.blockStart.pos, axClean);
const effectiveT = t * sign;
const newSize = Math.max(0.2, s.blockStart.size[axClean] + effectiveT);
const actualDelta = newSize - s.blockStart.size[axClean];
s.selected.size[axClean] = newSize;
s.selected.pos[axClean] = s.blockStart.pos[axClean] + sign * actualDelta / 2;
```

**Ganti jadi (tambahkan snap-to-step SEBELUM dipakai):**
```js
const t = dragAxisDelta(mx, my, s.dragStart, s.blockStart.pos, axClean);
const effectiveT = t * sign;
const rawSize = s.blockStart.size[axClean] + effectiveT;
// Snap ke kelipatan terdekat dari scaleStep. scaleStepRef dipakai (bukan langsung state
// `scaleStep`) supaya event handler baca nilai TERBARU tanpa perlu re-attach listener tiap
// kali scaleStep berubah — ikuti pola ref-sync yang SUDAH ADA di file ini untuk colorPicker.
const step = scaleStepRef.current || 1;
const newSize = Math.max(step, Math.round(rawSize / step) * step); // minimum 1 step, tidak boleh 0/negatif
const actualDelta = newSize - s.blockStart.size[axClean];
s.selected.size[axClean] = newSize;
s.selected.pos[axClean] = s.blockStart.pos[axClean] + sign * actualDelta / 2;
```

**Tambahkan ref sync** (taruh dekat `useEffect` sync `colorPickerRef` yang sudah ada, ikuti pola PERSIS):
```js
const scaleStepRef = useRef(1);
useEffect(() => { scaleStepRef.current = scaleStep; }, [scaleStep]);
```

**PENTING — batas minimum:** `Math.max(step, ...)` dipakai (bukan `Math.max(0.2, ...)` seperti kode lama) supaya blok tidak bisa lebih kecil dari 1 step itu sendiri (kalau step=2, ukuran minimum jadi 2, bukan 0.2 — konsisten dengan konsep "kelipatan step"). Kalau user set step sangat kecil (misal 0.01), blok tetap bisa jadi sangat tipis, itu WAJAR (sesuai referensi user: bisa sampai 0.05).

### 4. Reset `scaleStep` saat ganti tool (opsional tapi disarankan)
Kalau user pindah dari tool Scale ke tool lain, biarkan `scaleStep` tetap tersimpan (jangan direset ke 1) — supaya kalau user balik lagi ke Scale, preferensi terakhir mereka tidak hilang. **JANGAN implementasikan reset otomatis.**

---

## FILE YANG DIUBAH
- `src/pages/BlockSimulator3D.jsx` — HANYA ini.

## FILE YANG DILARANG DISENTUH
Sama seperti task-task sebelumnya — semua file lain, tanpa kecuali.

## CHECKLIST VERIFIKASI WAJIB
1. **Build check** — `npm run build`, 0 error.
2. **Scope check** — diff HANYA `BlockSimulator3D.jsx` (+ `memory.md`).
3. **Logic check manual** (hitung sendiri, konfirmasi benar):
   - Scale Step = 1, blok size.x mulai dari 2 → tarik dikit → hasil harus bulat (2, 3, 4, dst — KELIPATAN 1), TIDAK boleh desimal aneh kayak `2.347`.
   - Scale Step = 0.5 → hasil harus kelipatan 0.5 (2, 2.5, 3, 3.5...).
   - Scale Step = 0.05 → hasil harus kelipatan 0.05, dan blok BISA jadi sangat tipis (mendekati batang), TIDAK stuck di ukuran besar.
   - Ganti Scale Step SAAT blok sedang terpilih (belum mulai drag baru) → size blok yang SUDAH ADA tidak berubah tiba-tiba (snap cuma berlaku pas drag baru terjadi, bukan retroaktif ubah blok existing).
4. **Sisi berlawanan tetap diam** (behavior lama dari Bagian 2 harus tetap konsisten, cuma angkanya sekarang ke-snap) — verifikasi ulang seperti sebelumnya.
5. **Input Scale Step** cuma muncul saat `tool === 'scale'`, hilang di tool lain.
6. **Update `memory.md`** — append entri baru menjelaskan fitur ini + hasil verifikasi.
7. `git push --force` DILARANG MUTLAK. Push biasa; kalau ditolak, STOP & lapor (prosedur sama seperti sebelumnya).
8. **STOP setelah fitur ini selesai** — jangan tambah fitur lain (part fungsional, switch-binding, dll) tanpa prompt kerja terpisah.
