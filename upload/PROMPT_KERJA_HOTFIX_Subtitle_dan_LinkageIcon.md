# PROMPT KERJA — HOTFIX GABUNGAN: SUBTITLE OVERFLOW + 4 ICON LINKAGE INVISIBLE

> **WAJIB DIBACA DULU:** `instruction.md`, `design.md`, `memory.md` versi TERBARU.

## KONTEKS SCOPE
2 bug independen, di 2 file berbeda — kerjakan berurutan, verifikasi masing-masing terpisah.

---

## BUG #1 — Subtitle panjang bikin tinggi tombol gak rata

**File:** `src/components/MenuButton3D.jsx`

29 dari 36 deskripsi di `gearData.js` panjangnya >70 karakter (sampai 110). Div `subtitle` tidak punya pembatas overflow, jadi teks panjang wrap ke 2-3 baris, bikin tombol itu lebih tinggi dari tetangganya di list yang sama.

**Cari:**
```jsx
{subtitle && (
    <div style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
        color: locked ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.85)',
        textShadow: locked ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
        marginTop: 2,
        letterSpacing: 0.2,
    }}>
        {subtitle}
    </div>
)}
```

**Tambahkan `whiteSpace`, `overflow`, `textOverflow`:**
```jsx
{subtitle && (
    <div style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
        color: locked ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.85)',
        textShadow: locked ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
        marginTop: 2,
        letterSpacing: 0.2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    }}>
        {subtitle}
    </div>
)}
```

**Cek parent container:** div pembungkus label+subtitle butuh `minWidth: 0` supaya ellipsis aktif di dalam flex row (default flex item `min-width:auto` bisa bikin ellipsis gagal). Tambahkan `minWidth: 0` ke situ kalau belum ada.

---

## BUG #2 — 4 icon di `LinkageIcon.jsx` nyaris invisible (bricard, goldberg, deployable, kempe)

**File:** `src/components/LinkageIcon.jsx`

**Akar masalah (SUDAH DIVERIFIKASI, bukan tebakan):** pola kode `ce("g", {children: [...]}, X)` — `React.createElement` dipanggil dengan `children` DI DALAM objek props, TAPI juga dikasih argumen posisi tambahan (`X`) SETELAH objek props ditutup. Di React, argumen posisi tambahan pada `createElement` **MENIMPA TOTAL** `children` yang sudah di-set di props. Akibatnya bentuk hexagon/pentagon (garis+lingkaran) icon itu hilang total — yang ke-render cuma angka polos (0,1,2,3...) yang tidak terlihat di konteks SVG.

**Sudah di-scan MENYELURUH** (bukan cuma 2 yang kelihatan di screenshot) — ketemu **4 titik** kena bug ini, semuanya di `LinkageIcon.jsx` (`GearIcon.jsx` sudah dicek juga, BERSIH, tidak perlu disentuh):

### Fix 1 — case `"bricard"` (sekitar baris 403-405)
**Dari:**
```js
return ce("g", {
    children: [d(N, q, I, P), r(N, q, .07)]
}, k)
```
**Jadi:**
```js
return ce("g", {
    key: k,
    children: [d(N, q, I, P), r(N, q, .07)]
})
```

### Fix 2 — case `"goldberg"` (sekitar baris 430-432)
**Dari:**
```js
return ce("g", {
    children: [d(N, q, I, P), r(N, q, .07)]
}, k)
```
**Jadi:**
```js
return ce("g", {
    key: k,
    children: [d(N, q, I, P), r(N, q, .07)]
})
```
(Kode antara Fix 1 dan Fix 2 SECARA VISUAL MIRIP PERSIS — pastikan edit yang BENAR di case `"goldberg"`, bukan tidak sengaja edit ulang case `"bricard"` lagi. Cek nomor baris/konteks `case` di atasnya sebelum edit.)

### Fix 3 — case `"deployable"` (sekitar baris 458-460)
**Dari:**
```js
return ce("g", {
    children: [d(.18, k, .82, L), d(.82, k, .18, L), r(.5, (k + L) / 2, .065)]
}, R)
```
**Jadi:**
```js
return ce("g", {
    key: R,
    children: [d(.18, k, .82, L), d(.82, k, .18, L), r(.5, (k + L) / 2, .065)]
})
```
(Perhatikan: di case ini variabel yang jadi argumen posisi adalah `R`, BUKAN `k` — beda dari 3 case lainnya. Jangan disamaratakan jadi `key: k`.)

### Fix 4 — case `"kempe"` (sekitar baris 562-564)
**Dari:**
```js
return ce("g", {
    children: [d(.5, .5, C, N, .7), r(C, N, .065), R < 3 && d(C, N, I, P, .32)]
}, k)
```
**Jadi:**
```js
return ce("g", {
    key: k,
    children: [d(.5, .5, C, N, .7), r(C, N, .065), R < 3 && d(C, N, I, P, .32)]
})
```

**Setelah 4 fix ini, WAJIB scan ulang seluruh file** (jangan cuma percaya 4 titik ini adalah satu-satunya) dengan cara: cari SEMUA `.map(` yang callback-nya `return ce("g", {`, pastikan TIDAK ADA LAGI yang polanya `{children: [...]}, <argumen>)` — semua harus `{key: <argumen>, children: [...]})`. Laporkan di `memory.md` kalau ternyata nemu titik ke-5/6/dst yang kelewat dari daftar di atas.

**JANGAN ubah case lain yang TIDAK punya pola ini** (`fourbar`, `crankrocker`, `evans`, dll sudah benar, pakai children array literal langsung tanpa `.map()`+trailing-arg, TIDAK PERLU disentuh).

---

## CHECKLIST VERIFIKASI WAJIB
1. Build check — `npm run build`, 0 error.
2. Scope check — diff HANYA `MenuButton3D.jsx` + `LinkageIcon.jsx` (+ `memory.md`).
3. **Verifikasi Bug #1**: cari Gear dengan deskripsi terpanjang (>100 karakter), subtitle harus terpotong `...` 1 baris, tinggi tombol sama dengan tombol lain di list.
4. **Verifikasi Bug #2**: ke halaman Linkages, cari "Bricard Linkage", "Goldberg Linkage", "Deployable Linkage" (kalau ada di UI, cek namanya persis di `linkageData.js` kalau beda), dan yang pakai icon `kempe` — pastikan icon-nya SEKARANG MUNCUL BENTUK HEXAGON/PENTAGON JELAS (bukan cuma bintik samar). Icon linkage type LAIN yang sebelumnya normal (fourbar, crankrocker, dst) HARUS TETAP normal, tidak berubah.
5. Update `memory.md` — catat root cause (React `createElement` positional children override) + 4 lokasi yang di-fix + hasil scan ulang (ada tambahan atau tidak).
6. `git push --force` DILARANG MUTLAK.
