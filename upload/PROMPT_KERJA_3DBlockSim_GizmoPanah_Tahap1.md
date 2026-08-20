# PROMPT KERJA — 3D BLOCK SIMULATOR: GIZMO MOVE BENTUK PANAH (TAHAP 1/3)

> **WAJIB DIBACA DULU:** `instruction.md`, `design.md`, `memory.md` (entri terbaru soal `BlockSimulator3D` — fix fondasi, gizmo 6-axis, paint port, scale step), `RULES_AUTONOMI_QWEN.md`, `RULES_KESELAMATAN_GIT.md`.

## KONTEKS SCOPE
Fokus 100% ke `src/pages/BlockSimulator3D.jsx`. File lain (tim paralel) jangan disentuh.

Ini **Tahap 1 dari 3** rencana besar (referensi: screenshot software 3D profesional, dianalisis user — BUKAN aset/kode apapun disalin, murni referensi visual gizmo standar yang umum dipakai banyak software 3D). Tahap 2 (banyak jenis primitif) dan Tahap 3 (split-screen dual camera) itu **prompt kerja terpisah nanti, JANGAN dikerjakan di sini.**

## PERUBAHAN

**Cuma visual, TIDAK ubah logika drag/matematika sama sekali** (hit-test, `dragAxisDelta`, posisi handle — semua tetap, cuma cara GAMBAR ujung handle-nya yang berubah).

**Lokasi:** blok rendering handle, `if (tool === 'move' || tool === 'scale')` (sekitar baris 352-360 di file kamu saat ini — cek ulang nomor barisnya karena mungkin sudah geser).

**Sekarang (lingkaran solid untuk Move DAN Scale sama-sama):**
```js
if (tool === 'move' || tool === 'scale') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(tipScreen.x, tipScreen.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(tipScreen.x, tipScreen.y, 7, 0, Math.PI * 2);
  ctx.stroke();
}
```

**Pisahkan jadi 2 kondisi — Move pakai kepala panah (segitiga mengarah ke ujung), Scale TETAP pakai lingkaran (biar tetap gampang dibedakan dari Rotate & Move secara visual):**

```js
if (tool === 'move') {
  // Kepala panah: segitiga sama kaki, mengarah dari centerScreen ke tipScreen.
  const dx = tipScreen.x - centerScreen.x;
  const dy = tipScreen.y - centerScreen.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;       // unit vector arah panah
  const px = -uy, py = ux;                   // unit vector tegak lurus (buat lebar alas segitiga)
  const headLen = 14;   // panjang kepala panah dari ujung ke alas
  const headWidth = 7;  // setengah lebar alas segitiga

  const tip = { x: tipScreen.x, y: tipScreen.y };
  const baseCenter = { x: tipScreen.x - ux * headLen, y: tipScreen.y - uy * headLen };
  const baseL = { x: baseCenter.x + px * headWidth, y: baseCenter.y + py * headWidth };
  const baseR = { x: baseCenter.x - px * headWidth, y: baseCenter.y - py * headWidth };

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(baseL.x, baseL.y);
  ctx.lineTo(baseR.x, baseR.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.shadowBlur = 0;
  ctx.stroke();
} else if (tool === 'scale') {
  // Scale TETAP lingkaran solid — behavior visual lama dipertahankan, JANGAN diubah.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(tipScreen.x, tipScreen.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(tipScreen.x, tipScreen.y, 7, 0, Math.PI * 2);
  ctx.stroke();
}
```

**Catatan penting:**
- `centerScreen` sudah ada sebagai variabel di scope yang sama (dipakai buat gambar garis `moveTo(centerScreen.x, centerScreen.y)` tepat di atas kode ini) — pakai variabel itu, JANGAN hitung ulang/deklarasi baru.
- **Hit-test (`hitHandle`) TIDAK PERLU diubah sama sekali** — radius klik tetap berdasarkan `tipScreen` (ujung), yang posisinya tidak berubah, cuma bentuk visualnya. Kepala panah walau bentuknya segitiga, titik "tip" logicalnya tetap sama, jadi target klik tetap presisi.
- Untuk handle `-axis` (yang opacity-nya lebih rendah, `neg: true`), kepala panah otomatis mengarah ke arah yang benar juga (karena dihitung dari `centerScreen` ke `tipScreen` masing-masing, bukan hardcode arah) — TIDAK butuh logika tambahan khusus.

## FILE YANG DIUBAH
- `src/pages/BlockSimulator3D.jsx` — HANYA bagian ini.

## CHECKLIST VERIFIKASI
1. Build check — `npm run build`, 0 error.
2. Scope check — diff HANYA `BlockSimulator3D.jsx` (+ `memory.md`).
3. Verifikasi manual: tool Move sekarang tampil sebagai panah (garis + kepala segitiga mengarah keluar), tool Scale TETAP lingkaran seperti sebelumnya, tool Rotate TETAP seperti sebelumnya (tidak disentuh).
4. Drag tetap berfungsi normal persis seperti sebelumnya (karena logika drag TIDAK diubah) — cek klik & drag masih akurat kena handle yang benar.
5. Update `memory.md` — append entri baru.
6. `git push --force` DILARANG MUTLAK.
7. **STOP setelah ini** — Tahap 2 (primitif) & Tahap 3 (dual camera) itu prompt terpisah nanti.
