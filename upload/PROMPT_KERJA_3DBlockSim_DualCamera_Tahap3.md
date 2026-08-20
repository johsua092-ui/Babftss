# PROMPT KERJA — 3D BLOCK SIMULATOR: DUAL CAMERA VIEW (TAHAP 3/3)

> **WAJIB DIBACA DULU:** `instruction.md`, `design.md`, `memory.md` (semua entri `BlockSimulator3D` sebelumnya).

## KONTEKS SCOPE
Fokus 100% ke `src/pages/BlockSimulator3D.jsx`. File lain jangan disentuh.

Ini **Tahap 3 dari 3** rencana besar (setelah gizmo panah & Shape Generator). **Ini task TERAKHIR** dari rencana ini.

## KONSEP — SUDAH DIPUTUSKAN, JANGAN DIUBAH

**Camera A** = viewport utama yang SUDAH ADA sekarang (semua tools — Place/Move/Rotate/Scale/Paint/Delete/Clone/Generate/Clear — TETAP di sini, TIDAK berubah sama sekali).

**Camera B** = viewport KEDUA, BARU, muncul di sebelah kanan saat mode "Dual View" diaktifkan. Camera B **CUMA VIEWER PASIF**:
- Cuma bisa di-orbit (klik-drag) & zoom (scroll wheel) — kamera sendiri, independen dari Camera A.
- **TIDAK ADA tools apapun di situ** — tidak bisa Place/Move/Rotate/Scale/dll dari Camera B. Klik di situ cuma buat orbit, titik.
- **TIDAK ADA gizmo, ghost preview, atau handle** di-render di Camera B — cukup background + grid + blok saja (versi ringan).
- Blok yang ditampilkan **SAMA PERSIS** dengan `s.blocks` (data yang sama, cuma sudut pandang beda) — real-time sinkron otomatis (karena baca array yang sama tiap render).

## KENAPA HARUS TERPISAH TOTAL DARI SISTEM CAMERA A YANG SUDAH ADA

**JANGAN refactor `project()`, `render()`, `hitTest()`, `getGridPos()`, atau fungsi Camera A manapun yang sudah ada supaya "generic multi-camera".** Itu berisiko tinggi merusak Camera A yang sudah stabil dan matang (banyak fitur numpuk di situ). **Sebagai gantinya, buat SISTEM TERPISAH SEPENUHNYA buat Camera B** — boleh ada duplikasi kode kecil (fungsi proyeksi & render versi ringan sendiri), itu LEBIH AMAN daripada coba "generalize" sistem yang sudah ada.

---

## IMPLEMENTASI

### 1. State baru
```js
const [dualView, setDualView] = useState(false);
```
Ref state Camera B (taruh di `stateRef.current` yang sudah ada, tambahkan field baru — JANGAN bikin `useState` terpisah buat cam, ikuti pola `s.cam` yang sudah ada):
```js
// Di dalam stateRef.current (cari deklarasi awalnya, tambahkan field ini):
camB: { yaw: 0.75, pitch: -0.55, dist: 22, target: new Vec3(0, 0, 0) },
isOrbitingB: false,
dragStartB: null,
camStartB: null,
```

### 2. Canvas & container kedua

Tambahkan `canvasBRef = useRef(null)` dan `containerBRef = useRef(null)`. Ubah JSX "Main Canvas Area" (cari `{/* Main Canvas Area */}`) — bungkus container Camera A yang SUDAH ADA + container Camera B baru dalam 1 flex row:

```jsx
{/* Main Canvas Area */}
<div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
  <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
    {/* ... SEMUA isi div containerRef yang SUDAH ADA (canvas Camera A + toolbar + panel dll)
         TETAP PERSIS SAMA, JANGAN diubah isinya sama sekali, cuma dibungkus 1 level lebih dalam. */}
  </div>

  {dualView && (
    <div ref={containerBRef} style={{
      flex: 1, position: 'relative', overflow: 'hidden', borderLeft: '2px solid #334155',
    }}>
      <canvas ref={canvasBRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }} />
      <div style={{
        position: 'absolute', top: 8, left: 8, fontSize: 11, color: '#94a3b8',
        fontFamily: 'Inter, sans-serif', background: 'rgba(15,23,42,0.7)', padding: '3px 8px', borderRadius: 6,
      }}>Camera B (view only)</div>
    </div>
  )}
</div>
```

Tombol toggle **"Dual View"** di toolbar (dekat tombol tool lain yang sudah ada, ikuti styling konsisten):
```jsx
<button onClick={() => setDualView(v => !v)} style={{
  background: dualView ? 'linear-gradient(135deg,#0ea5e9,#38bdf8)' : '#1e293b',
  color: '#fff', border: '1px solid #334155', borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
}}>🖥️ Dual View</button>
```

**Catatan resize:** container Camera A (`containerRef`) SUDAH PAKAI `ResizeObserver` yang otomatis re-trigger saat ukurannya berubah (sudah ada di kode, JANGAN disentuh) — jadi begitu `dualView` jadi `true` dan container Camera A otomatis menyempit (flex row terbagi 2), resize Camera A akan otomatis ke-handle sendiri TANPA perlu kode tambahan. Cukup pastikan `containerBRef`/`canvasBRef` juga dapat `ResizeObserver` sendiri (lihat langkah 3).

### 3. Render & resize Camera B (SISTEM TERPISAH, versi ringan)

```js
useEffect(() => {
  if (!dualView) return;
  const canvas = canvasBRef.current;
  const container = containerBRef.current;
  if (!canvas || !container) return;
  const s = stateRef.current;

  const rotYb = (v, a) => { const c = Math.cos(a), sn = Math.sin(a); return new Vec3(v.x*c - v.z*sn, v.y, v.x*sn + v.z*c); };
  const rotXb = (v, a) => { const c = Math.cos(a), sn = Math.sin(a); return new Vec3(v.x, v.y*c - v.z*sn, v.y*sn + v.z*c); };
  const rotZb = (v, a) => { const c = Math.cos(a), sn = Math.sin(a); return new Vec3(v.x*c - v.y*sn, v.x*sn + v.y*c, v.z); };

  let W = 0, H = 0, dpr = 1;

  const projectB = (p) => {
    let v = p.sub(s.camB.target);
    v = rotYb(v, s.camB.yaw);
    v = rotXb(v, s.camB.pitch);
    const focalLength = 700;
    const scale = focalLength / Math.max(0.5, v.z + s.camB.dist);
    return { x: (W/dpr)/2 + v.x*scale, y: (H/dpr)/2 - v.y*scale, z: v.z, scale };
  };

  // getBlockCornersB: DUPLIKAT RINGAN dari getBlockCorners yang sudah ada — sengaja
  // dipisah (bukan reuse fungsi Camera A) supaya sistem Camera B benar2 independen.
  const getBlockCornersB = (b) => {
    const sz = b.size || new Vec3(1,1,1);
    const r = b.rot || new Vec3(0,0,0);
    const corners = [
      new Vec3(-0.5,-0.5,-0.5), new Vec3(0.5,-0.5,-0.5), new Vec3(0.5,0.5,-0.5), new Vec3(-0.5,0.5,-0.5),
      new Vec3(-0.5,-0.5,0.5), new Vec3(0.5,-0.5,0.5), new Vec3(0.5,0.5,0.5), new Vec3(-0.5,0.5,0.5),
    ];
    return corners.map(v => {
      let p = new Vec3(v.x*sz.x, v.y*sz.y, v.z*sz.z);
      p = rotYb(p, r.y); p = rotXb(p, r.x); p = rotZb(p, r.z);
      return b.pos.add(p);
    });
  };

  const renderB = () => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W/dpr, H/dpr);
    const w = W/dpr, h = H/dpr;
    const bgGrad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w,h)*0.7);
    bgGrad.addColorStop(0, '#3a4a63'); bgGrad.addColorStop(1, '#1b2536');
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(148,163,184,0.28)'; ctx.lineWidth = 0.5;
    const N = GRID_SIZE;
    for (let i = -N; i <= N; i++) {
      const a = projectB(new Vec3(i*GRID, 0, -N*GRID)), b2 = projectB(new Vec3(i*GRID, 0, N*GRID));
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
      const c = projectB(new Vec3(-N*GRID, 0, i*GRID)), d = projectB(new Vec3(N*GRID, 0, i*GRID));
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
    }

    // Blocks — painter's algorithm, SAMA POLA seperti render() Camera A tapi versi ringan
    // (TANPA gizmo/ghost/handle, cukup wajah blok saja).
    const sorted = s.blocks.map((b) => ({ b, depth: projectB(b.pos).z })).sort((a,b2) => b2.depth - a.depth);
    sorted.forEach(item => {
      const b = item.b;
      const pc = getBlockCornersB(b).map(projectB);
      const faces = [
        { idx: [3,2,1,0], shade: 0.58 }, { idx: [4,5,6,7], shade: 0.82 },
        { idx: [0,1,5,4], shade: 0.42 }, { idx: [7,6,2,3], shade: 1.0 },
        { idx: [4,7,3,0], shade: 0.72 }, { idx: [1,2,6,5], shade: 0.88 },
      ];
      faces.forEach(f => { f.avgZ = f.idx.reduce((sum,i2) => sum + pc[i2].z, 0)/4; });
      faces.sort((a,b2) => b2.avgZ - a.avgZ);
      faces.forEach(f => {
        const pts = f.idx.map(i2 => pc[i2]);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k=1;k<pts.length;k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.closePath();
        ctx.fillStyle = shadeColor(b.color, f.shade); // shadeColor SUDAH ADA, reuse
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
      });
    });
  };

  const resizeB = () => {
    const rect = container.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    W = rect.width * dpr; H = rect.height * dpr;
    canvas.width = W; canvas.height = H;
    renderB();
  };
  resizeB();
  const ro = new ResizeObserver(resizeB);
  ro.observe(container);

  // Orbit-only mouse handlers — TIDAK ADA tool logic sama sekali, cuma orbit + zoom.
  const onDown = (e) => {
    s.isOrbitingB = true;
    s.dragStartB = { x: e.clientX, y: e.clientY };
    s.camStartB = { yaw: s.camB.yaw, pitch: s.camB.pitch };
  };
  const onMove = (e) => {
    if (!s.isOrbitingB) return;
    const dx = e.clientX - s.dragStartB.x, dy = e.clientY - s.dragStartB.y;
    s.camB.yaw = s.camStartB.yaw + dx * 0.007;
    s.camB.pitch = Math.max(-1.45, Math.min(1.45, s.camStartB.pitch + dy * 0.007));
    renderB();
  };
  const onUp = () => { s.isOrbitingB = false; };
  const onWheel = (e) => {
    e.preventDefault();
    s.camB.dist = Math.max(4, Math.min(60, s.camB.dist + e.deltaY * 0.02));
    renderB();
  };
  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  // Render loop ringan: re-render tiap kali blocks berubah TIDAK otomatis terdeteksi
  // (s.blocks itu mutable ref, bukan React state) — pakai interval ringan buat sinkron
  // visual, konsisten dengan pola render Camera A yang juga dipanggil manual tiap ada aksi.
  const interval = setInterval(renderB, 200); // 5fps cukup untuk viewer pasif, hemat resource

  return () => {
    ro.disconnect();
    canvas.removeEventListener('mousedown', onDown);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    canvas.removeEventListener('wheel', onWheel);
    clearInterval(interval);
  };
}, [dualView]);
```

**Catatan soal `setInterval(renderB, 200)`:** ini WAJAR & disengaja (bukan solusi malas) — karena `s.blocks` itu mutable ref (bukan React state reaktif), Camera B gak akan otomatis tahu kapan ada blok baru/berubah dari Camera A kecuali di-render ulang berkala. 5 FPS cukup buat viewer pasif (gak perlu real-time responsif kayak Camera A yang di-render tiap event mouse), dan jauh lebih hemat resource daripada `requestAnimationFrame` terus-menerus.

---

## FILE YANG DIUBAH
- `src/pages/BlockSimulator3D.jsx` — HANYA ini.

## FILE YANG DILARANG DISENTUH
Sama seperti biasa. **KHUSUSNYA: semua kode Camera A yang sudah ada (`project`, `render`, `hitTest`, `getGridPos`, semua tool logic) — JANGAN diubah SATU BARIS PUN.**

## CHECKLIST VERIFIKASI WAJIB
1. Build check — `npm run build`, 0 error.
2. Scope check — diff HANYA `BlockSimulator3D.jsx` (+ `memory.md`).
3. **Verifikasi Camera A TIDAK BERUBAH SAMA SEKALI** — semua tool (Place/Move/Rotate/Scale/Paint/Delete/Clone/Generate/Clear) masih berfungsi identik seperti sebelum task ini. Ini WAJIB dicek eksplisit, karena regresi di sini fatal.
4. Verifikasi toggle "Dual View" — nyala/mati, Camera B muncul/hilang di kanan, Camera A otomatis menyempit/melebar mengikuti (via ResizeObserver yang sudah ada).
5. Verifikasi Camera B: orbit jalan (drag), zoom jalan (scroll), blok yang sama muncul (sinkron dari `s.blocks`), TIDAK ada gizmo/tool aktif di situ, klik di Camera B TIDAK mempengaruhi seleksi/blok di Camera A.
6. Update `memory.md` — jelaskan arsitektur (sistem terpisah, alasan duplikasi kode disengaja demi keamanan Camera A).
7. `git push --force` DILARANG MUTLAK.
8. **Ini task TERAKHIR dari rencana 3-tahap** — setelah ini selesai & terverifikasi, seluruh rencana besar 3D Block Simulator (gizmo panah → shape generator → dual camera) tuntas.
