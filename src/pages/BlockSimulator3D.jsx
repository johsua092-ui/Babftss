import { useRef, useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, Box, Plus, Move, RotateCw, Maximize, Paintbrush,
  Copy, Trash2, MousePointer2, Hand, Info, Cuboid, Check, X
} from 'lucide-react';
import ColorWheelPicker from '../components/ColorWheelPicker';

/* ================================================================
   3D BLOCK SIMULATOR — BABFTSS Style
   Engine 3D from scratch using Canvas 2D (no external 3D libs)
   ================================================================ */

const GRID = 1;
const GRID_SIZE = 14;
const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#64748b', '#1e293b', '#ffffff', '#84cc16'
];

class Vec3 {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
  add(v) { return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
  sub(v) { return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z); }
  mul(s) { return new Vec3(this.x * s, this.y * s, this.z * s); }
  clone() { return new Vec3(this.x, this.y, this.z); }
}

const TOOLS = [
  { id: 'place',  label: 'Place',  icon: Plus,         key: 'p' },
  { id: 'move',   label: 'Move',   icon: Move,         key: 'm' },
  { id: 'rotate', label: 'Rotate', icon: RotateCw,     key: 'r' },
  { id: 'scale',  label: 'Scale',  icon: Maximize,     key: 's' },
  { id: 'color',  label: 'Paint',  icon: Paintbrush,   key: 'c' },
  { id: 'clone',  label: 'Clone',  icon: Copy,         key: 'k' },
  { id: 'delete', label: 'Delete', icon: Trash2,       key: 'x' },
];

export default function BlockSimulator3D({ setPage }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [tool, setTool] = useState('place');
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [blockCount, setBlockCount] = useState(0);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showColorWheel, setShowColorWheel] = useState(false);
  const [colorWheelDraft, setColorWheelDraft] = useState(currentColor);

  // ── SISTEM PAINT (copy dari LogicGatesSimulator 2D) ──
  // colorPicker: object atau null. Saat non-null, modal overlay full-screen muncul
  //   berisi ColorWheelPicker + tombol Pick Color / Confirm / Cancel.
  //   Shape: { targetType: 'block', targetId, hex, originalHex }
  // pickFromWorkspace: saved colorPicker state saat user masuk mode eyedropper
  //   (klik "Pick Color" di modal). Klik blok lain di kanvas → ambil warnanya → balik ke modal.
  const [colorPicker, setColorPicker] = useState(null);
  const [pickFromWorkspace, setPickFromWorkspace] = useState(null);
  const colorPickerRef = useRef(null);
  const pickFromWorkspaceRef = useRef(null);
  const dashOffsetRef = useRef(0);
  const rafRef = useRef(null);
  useEffect(() => { colorPickerRef.current = colorPicker; }, [colorPicker]);
  useEffect(() => { pickFromWorkspaceRef.current = pickFromWorkspace; }, [pickFromWorkspace]);

  const stateRef = useRef({
    blocks: [],
    selected: null,
    // pitch MUST be negative for a "looking DOWN at grid" view.
    // Positive pitch tilts the world's +Z axis downward on screen,
    // which makes the grid floor project BELOW center and the scene
    // look upside-down / reversed compared to standard 3D editors.
    cam: { yaw: -0.75, pitch: -0.55, dist: 22, target: new Vec3(0, 0, 0) },
    isOrbiting: false,
    isTransforming: false,
    dragAxis: null,        // 'x' | 'y' | 'z' | null — sumbu yang sedang di-grab saat gizmo Move/Rotate/Scale aktif
    dragStart: null,
    camStart: null,
    transformStart: null,
    blockStart: null,      // { pos, rot, size } — snapshot awal blok saat mulai drag (untuk reference drag)
    hoverGrid: null,   // posisi grid (Vec3) tempat ghost block akan digambar, null = tidak ada ghost
    hoverColor: '#3b82f6',
    dpr: 1,
    W: 0, H: 0, cx: 0, cy: 0,
  });

  /* ---------- 3D Engine ---------- */
  const rotY = (v, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return new Vec3(v.x * c - v.z * s, v.y, v.x * s + v.z * c);
  };
  const rotX = (v, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return new Vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c);
  };
  const rotZ = (v, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return new Vec3(v.x * c - v.y * s, v.x * s + v.y * c, v.z);
  };

  const project = useCallback((p) => {
    const s = stateRef.current;
    let v = p.sub(s.cam.target);
    v = rotY(v, s.cam.yaw);
    v = rotX(v, s.cam.pitch);
    // Standard perspective projection: closer points = bigger.
    // focalLength tunes overall scale; clamp denominator to avoid div-by-zero.
    const focalLength = 700;
    const scale = focalLength / Math.max(0.5, v.z + s.cam.dist);
    return {
      x: s.cx / s.dpr + v.x * scale,
      y: s.cy / s.dpr - v.y * scale,
      z: v.z,
      scale
    };
  }, []);

  const getBlockCorners = (b) => {
    const sz = b.size || new Vec3(1, 1, 1);
    const r = b.rot || new Vec3(0, 0, 0);
    const corners = [
      new Vec3(-0.5, -0.5, -0.5), new Vec3(0.5, -0.5, -0.5),
      new Vec3(0.5, 0.5, -0.5),   new Vec3(-0.5, 0.5, -0.5),
      new Vec3(-0.5, -0.5, 0.5),  new Vec3(0.5, -0.5, 0.5),
      new Vec3(0.5, 0.5, 0.5),    new Vec3(-0.5, 0.5, 0.5)
    ];
    return corners.map(v => {
      let p = new Vec3(v.x * sz.x, v.y * sz.y, v.z * sz.z);
      p = rotY(p, r.y); p = rotX(p, r.x); p = rotZ(p, r.z);
      return b.pos.add(p);
    });
  };

  const shadeColor = (hex, factor) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substr(0, 2), 16);
    const g = parseInt(h.substr(2, 2), 16);
    const b = parseInt(h.substr(4, 2), 16);
    return `rgb(${Math.min(255, Math.max(0, Math.round(r * factor)))},${Math.min(255, Math.max(0, Math.round(g * factor)))},${Math.min(255, Math.max(0, Math.round(b * factor)))})`;
  };

  /* ---------- Render ---------- */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;

    ctx.clearRect(0, 0, s.W / s.dpr, s.H / s.dpr);

    // Background gradient (biar ada kedalaman, gak void hitam total) — pakai warna yang
    // sudah dipakai di file ini juga (panelBg & bg halaman), bukan warna baru.
    const w = s.W / s.dpr, h = s.H / s.dpr;
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    bgGrad.addColorStop(0, '#0e1420');
    bgGrad.addColorStop(1, '#05080f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
    ctx.lineWidth = 0.5;
    const N = GRID_SIZE;
    for (let i = -N; i <= N; i++) {
      const a = project(new Vec3(i * GRID, 0, -N * GRID));
      const b = project(new Vec3(i * GRID, 0, N * GRID));
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      const c = project(new Vec3(-N * GRID, 0, i * GRID));
      const d = project(new Vec3(N * GRID, 0, i * GRID));
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
    }
    // Axes
    const o = project(new Vec3(0, 0, 0));
    const xEnd = project(new Vec3(3.5, 0, 0));
    const zEnd = project(new Vec3(0, 0, 3.5));
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(xEnd.x, xEnd.y); ctx.stroke();
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(zEnd.x, zEnd.y); ctx.stroke();

    // Blocks (painter's algorithm)
    const sorted = s.blocks.map((b, i) => ({ b, i, depth: project(b.pos).z }))
      .sort((a, b) => b.depth - a.depth);

    sorted.forEach(item => {
      const b = item.b;
      const corners = getBlockCorners(b);
      const pc = corners.map(project);
      const faces = [
        { idx: [3, 2, 1, 0], shade: 0.58 },
        { idx: [4, 5, 6, 7], shade: 0.82 },
        { idx: [0, 1, 5, 4], shade: 0.42 },
        { idx: [7, 6, 2, 3], shade: 1.0 },
        { idx: [4, 7, 3, 0], shade: 0.72 },
        { idx: [1, 2, 6, 5], shade: 0.88 }
      ];
      faces.forEach(f => { f.avgZ = f.idx.reduce((sum, i2) => sum + pc[i2].z, 0) / 4; });
      faces.sort((a, b2) => b2.avgZ - a.avgZ);

      faces.forEach(f => {
        const pts = f.idx.map(i2 => pc[i2]);
        const ax = pts[1].x - pts[0].x, ay = pts[1].y - pts[0].y;
        const bx = pts[2].x - pts[1].x, by = pts[2].y - pts[1].y;
        if (ax * by - ay * bx < 0) return; // backface cull
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.closePath();
        ctx.fillStyle = shadeColor(b.color, f.shade);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      if (s.selected === b) {
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#f472b6';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(pc[0].x, pc[0].y);
        for (let k = 1; k < 4; k++) ctx.lineTo(pc[k].x, pc[k].y);
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });

    // Ghost/preview block — muncul saat mode Place & kursor di atas grid
    if (s.hoverGrid) {
      const ghost = { pos: s.hoverGrid, size: new Vec3(1, 1, 1), rot: new Vec3(0, 0, 0) };
      const gCorners = getBlockCorners(ghost);
      const gpc = gCorners.map(project);
      const gFaces = [
        { idx: [3, 2, 1, 0] },
        { idx: [4, 5, 6, 7] },
        { idx: [0, 1, 5, 4] },
        { idx: [7, 6, 2, 3] },
        { idx: [4, 7, 3, 0] },
        { idx: [1, 2, 6, 5] }
      ];
      gFaces.forEach(f => { f.avgZ = f.idx.reduce((sum, i2) => sum + gpc[i2].z, 0) / 4; });
      gFaces.sort((a, b2) => b2.avgZ - a.avgZ);

      ctx.save();
      ctx.globalAlpha = 0.35;
      gFaces.forEach(f => {
        const pts = f.idx.map(i2 => gpc[i2]);
        const ax = pts[1].x - pts[0].x, ay = pts[1].y - pts[0].y;
        const bx = pts[2].x - pts[1].x, by = pts[2].y - pts[1].y;
        if (ax * by - ay * bx < 0) return; // backface cull, sama seperti block asli
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.closePath();
        ctx.fillStyle = shadeColor(s.hoverColor, 1);
        ctx.fill();
      });
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = s.hoverColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      gFaces.forEach(f => {
        const pts = f.idx.map(i2 => gpc[i2]);
        const ax = pts[1].x - pts[0].x, ay = pts[1].y - pts[0].y;
        const bx = pts[2].x - pts[1].x, by = pts[2].y - pts[1].y;
        if (ax * by - ay * bx < 0) return;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.closePath();
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.restore();
    }

    // ── Marching ants around block being painted (colorPicker open OR pickFromWorkspace active) ──
    // Copy dari LogicGatesSimulator 2D: dashed rect animasi di sekitar blok target,
    // border pakai warna blok tsb supaya jelas identitasnya. Animasi dashOffset terus maju.
    const cpInfo = colorPickerRef.current || pickFromWorkspaceRef.current;
    if (cpInfo && cpInfo.targetType === 'block') {
      const targetBlock = s.blocks.find(b => b.id === cpInfo.targetId);
      if (targetBlock) {
        // Gambar bounding box blok (axis-aligned di world, sebelum rotasi — pakai corners).
        const corners = getBlockCorners(targetBlock).map(project);
        // Cari min/max x & y di layar
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of corners) {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        }
        const pad = 6;
        ctx.save();
        ctx.setLineDash([8, 5]);
        ctx.lineDashOffset = -dashOffsetRef.current;
        ctx.strokeStyle = targetBlock.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = targetBlock.color;
        ctx.shadowBlur = 6;
        ctx.strokeRect(minX - pad, minY - pad, (maxX - minX) + pad * 2, (maxY - minY) + pad * 2);
        ctx.restore();
      }
    }

    // Gizmo 3-axis handles — digambar HANYA kalau ada blok terpilih & tool = move/rotate/scale.
    // Gaya Roblox Studio: merah=X, hijau=Y, biru=Z. Tiap handle = garis dari pusat blok
    // + lingkaran di ujung (Move/Scale) atau busur kecil (Rotate — dibedakan biar jelas
    // visual bahwa Rotate tool aktif, bukan Move). Posisi & radius klik SAMA untuk semua tool.
    if (s.selected && (tool === 'move' || tool === 'rotate' || tool === 'scale')) {
      const b = s.selected;
      const off = getHandleOffset(b);
      const centerScreen = project(b.pos);
      const axes = [
        { axis: 'x', vec: new Vec3(off, 0, 0), color: '#ef4444' }, // merah = X
        { axis: 'y', vec: new Vec3(0, off, 0), color: '#22c55e' }, // hijau = Y
        { axis: 'z', vec: new Vec3(0, 0, off), color: '#3b82f6' }, // biru = Z
      ];

      ctx.save();
      for (const { axis, vec, color } of axes) {
        const tipScreen = project(b.pos.add(vec));
        // Garis dari pusat blok ke ujung handle
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(centerScreen.x, centerScreen.y);
        ctx.lineTo(tipScreen.x, tipScreen.y);
        ctx.stroke();

        // Handle di ujung — bentuknya beda per tool biar jelas visual:
        //  - Move/Scale: lingkaran padat (target klik jelas, 7px radius)
        //  - Rotate: lingkaran outline + busur kecil di dalam (biar kelihatan "nggulir")
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
        } else if (tool === 'rotate') {
          // Outer ring outline
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(tipScreen.x, tipScreen.y, 9, 0, Math.PI * 2);
          ctx.stroke();
          // Inner arc supaya kelihatan "rotate"
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(tipScreen.x, tipScreen.y, 5, -Math.PI * 0.4, Math.PI * 0.4);
          ctx.stroke();
        }
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }, [project, tool]);

  // rAF loop untuk marching ants animation. Start hanya saat colorPicker atau pickFromWorkspace aktif
  // (supaya tidak boros CPU saat idle). Setiap frame: increment dashOffset + re-render.
  // WAJIB ditaruh SETELAH render di-declare (di atas) supaya tidak kena Temporal Dead Zone
  // (useEffect dependency array baca `render` saat component render pertama kali — kalau
  // useEffect ini di-define sebelum `const render = useCallback(...)`, JS engine bakal throw
  // "Cannot access 'render' before initialization" & crash halaman jadi blank putih).
  useEffect(() => {
    if (!colorPicker && !pickFromWorkspace) {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      return;
    }
    const tick = () => {
      dashOffsetRef.current = (dashOffsetRef.current + 0.5) % 13; // 8+5 = 13 (match dash pattern [8,5])
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [colorPicker, pickFromWorkspace, render]);

  /* ---------- Resize ---------- */
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      stateRef.current.dpr = dpr;
      stateRef.current.W = canvas.width = rect.width * dpr;
      stateRef.current.H = canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      // Scale the 2D context so we can draw in CSS pixels directly.
      // Without this, drawings land in buffer-pixel space and appear
      // shrunk by `dpr` on retina displays.
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stateRef.current.cx = stateRef.current.W / 2;
      stateRef.current.cy = stateRef.current.H / 2;
      render();
    };
    handleResize();
    const container = containerRef.current;
    const ro = container ? new ResizeObserver(handleResize) : null;
    if (container && ro) ro.observe(container);
    window.addEventListener('resize', handleResize);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [render]);

  /* ---------- Hit Test ---------- */
  const pointInPoly = (x, y, poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi))
        inside = !inside;
    }
    return inside;
  };

  /* ---------- Gizmo Helpers (Move/Rotate/Scale 3-axis ala Roblox Studio) ----------
     Konsep: tiap blok terpilih punya 3 handle berwarna (merah=X, hijau=Y, biru=Z)
     yang keluar dari pusat blok. Klik handle → drag sepanjang axis itu saja.
     Sumbu lain TIDAK ikut berubah — presisi, tidak kena "drag dx/dy mentah" yang
     arahnya bisa campur dari sudut kamera tertentu. */

  // Posisi handle 3-axis relatif terhadap pusat blok.
  // handleOffset = setengah ukuran blok terbesar + 0.8 (biar handle selalu di luar blok).
  const getHandleOffset = (block) =>
    Math.max(block.size.x, block.size.y, block.size.z) * 0.5 + 0.8;

  // Hit-test handle: cek mana dari 3 sumbu yang posisi layar-nya dekat klik mouse.
  // PRIORITAS LEBIH TINGGI dari hitTest blok biasa — dipanggil duluan saat tool=move/rotate/scale & s.selected != null.
  // Return: 'x' | 'y' | 'z' | null.
  const hitHandle = (mx, my, block) => {
    if (!block) return null;
    const off = getHandleOffset(block);
    const axes = [
      { axis: 'x', vec: new Vec3(off, 0, 0) },
      { axis: 'y', vec: new Vec3(0, off, 0) },
      { axis: 'z', vec: new Vec3(0, 0, off) },
    ];
    for (const { axis, vec } of axes) {
      const p = project(block.pos.add(vec));
      if (Math.hypot(p.x - mx, p.y - my) < 14) return axis; // 14px radius klik, cukup toleran buat jari/mouse
    }
    return null;
  };

  // Rumus drag per-axis pakai proyeksi vektor (bukan dx/dy mentah).
  // Supaya drag akurat dari sudut kamera manapun: project pusat blok & project titik axis-tip
  // ke layar → dapat vektor arah sumbu di layar → proyeksikan mouse delta ke vektor tsb.
  // Return: world-unit delta sepanjang axis (LANGSUNG dalam satuan world, bukan pixel).
  const dragAxisDelta = (mx, my, dragStartMouse, blockStartPos, axis) => {
    const axisUnit = axis === 'x' ? new Vec3(1, 0, 0)
                  : axis === 'y' ? new Vec3(0, 1, 0)
                  : new Vec3(0, 0, 1);
    const centerScreen = project(blockStartPos);
    const axisTipScreen = project(blockStartPos.add(axisUnit));
    const screenAxisVec = {
      x: axisTipScreen.x - centerScreen.x,
      y: axisTipScreen.y - centerScreen.y,
    };
    const mouseDelta = { x: mx - dragStartMouse.x, y: my - dragStartMouse.y };
    const denom = screenAxisVec.x * screenAxisVec.x + screenAxisVec.y * screenAxisVec.y;
    if (denom < 0.0001) return 0; // axis nyaris tegak lurus layar (invisible), hindari div-by-zero
    const t = (mouseDelta.x * screenAxisVec.x + mouseDelta.y * screenAxisVec.y) / denom;
    return t;
  };

  // Snap per-axis: Math.round tunggal, BUKAN snap 3-sumbu (yang lama).
  // Sumbu lain harus tetap presisi — tidak ikut ke-snap kalau tidak digerakkan.
  const snapSingleAxis = (v) => Math.round(v);

  const hitTest = (mx, my) => {
    const s = stateRef.current;
    // WAJIB pakai rumus sort yang SAMA PERSIS dengan render() supaya konsisten:
    //   render() menggambar far→near, near berarti digambar TERAKHIR alias "di atas" di layar.
    //   Untuk hit test, cek dari yang PALING DEPAN (near) dulu → iterasi dari BELAKANG array sorted.
    //   Sebelumnya hitTest pakai urutan insert mentah (s.blocks dibalik) → bisa kena blok yang
    //   bukan paling depan secara visual → delete/clone salah pilih blok saat tumpang-tindih.
    const sorted = s.blocks.map((b, i) => ({ b, i, depth: project(b.pos).z }))
      .sort((a, b) => b.depth - a.depth);
    for (let i = sorted.length - 1; i >= 0; i--) {
      const b = sorted[i].b;
      const pc = getBlockCorners(b).map(project);
      const faces = [[0,1,2,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[0,3,7,4],[1,2,6,5]];
      for (const f of faces) {
        const pts = f.map(idx => pc[idx]);
        if (pointInPoly(mx, my, pts)) return b;
      }
    }
    return null;
  };

  const snap = (v) => new Vec3(Math.round(v.x), Math.round(v.y), Math.round(v.z));

  const getGridPos = (mx, my) => {
    let best = null, bestErr = 1e9;
    for (let x = -GRID_SIZE; x <= GRID_SIZE; x += 0.5) {
      for (let z = -GRID_SIZE; z <= GRID_SIZE; z += 0.5) {
        const p = new Vec3(x, 0, z);
        const pp = project(p);
        const err = Math.hypot(pp.x - mx, pp.y - my);
        if (err < bestErr) { bestErr = err; best = p; }
      }
    }
    return best ? snap(best) : null;
  };

  /* ---------- Update UI State ---------- */
  const updateUISelection = (b) => {
    if (b) {
      setSelectedInfo({
        pos: `(${b.pos.x.toFixed(1)}, ${b.pos.y.toFixed(1)}, ${b.pos.z.toFixed(1)})`,
        size: `(${b.size.x.toFixed(1)} x ${b.size.y.toFixed(1)} x ${b.size.z.toFixed(1)})`,
        rot: `${(b.rot.y * 57.2958).toFixed(0)}deg`
      });
    } else {
      setSelectedInfo(null);
    }
  };

  /* ---------- Mouse Events ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPlacementY = (gp) => {
      const s = stateRef.current;
      let y = 0.5;
      const stack = s.blocks.filter(b =>
        Math.abs(b.pos.x - gp.x) < 0.1 && Math.abs(b.pos.z - gp.z) < 0.1
      );
      if (stack.length > 0) {
        stack.sort((a, b) => b.pos.y - a.pos.y);
        y = stack[0].pos.y + (stack[0].size ? stack[0].size.y : 1);
      }
      return y;
    };

    const runPlace = (mx, my) => {
      const s = stateRef.current;
      const gp = getGridPos(mx, my);
      if (!gp) return;
      const y = getPlacementY(gp);
      const nb = {
        pos: new Vec3(gp.x, y, gp.z),
        size: new Vec3(1, 1, 1),
        rot: new Vec3(0, 0, 0),
        color: currentColor,
        id: Date.now() + Math.random()
      };
      s.blocks.push(nb);
      s.selected = nb;
      setBlockCount(s.blocks.length);
      updateUISelection(nb);
      render();
    };

    const onContextMenu = (e) => {
      // Cegah menu klik-kanan bawaan browser muncul — klik-kanan dipakai untuk orbit kamera.
      e.preventDefault();
    };

    const onMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const s = stateRef.current;

      // Klik-kanan = orbit kamera, SELALU, di tool apa pun. (gaya Roblox Studio)
      if (e.button === 2) {
        s.isOrbiting = true;
        s.dragStart = { x: mx, y: my };
        s.camStart = { yaw: s.cam.yaw, pitch: s.cam.pitch };
        s.hoverGrid = null; // sembunyikan ghost selama orbit
        canvas.style.cursor = 'grabbing';
        return;
      }

      if (e.button !== 0) return; // hanya klik-kiri yang lanjut ke logic tool di bawah

      // ── PICK FROM WORKSPACE MODE (eyedropper): prioritas tertinggi, dicek SEBELUM tool lain ──
      // Copy dari LogicGatesSimulator 2D: user klik "Pick Color" di modal → modal tutup,
      // cursor jadi crosshair. Klik blok lain di kanvas → ambil warnanya → balik ke modal
      // colorPicker dengan hex baru. Klik empty → batal, balik ke modal dengan hex lama.
      if (pickFromWorkspaceRef.current) {
        const savedPicker = pickFromWorkspaceRef.current;
        const hit = hitTest(mx, my);
        if (hit) {
          setColorPicker({ ...savedPicker, hex: hit.color });
          setPickFromWorkspace(null);
          canvas.style.cursor = 'grab';
        } else {
          // Empty click → batal pick, balik ke modal dengan hex lama.
          setColorPicker(savedPicker);
          setPickFromWorkspace(null);
          canvas.style.cursor = 'grab';
        }
        return;
      }

      if (tool === 'place') {
        runPlace(mx, my);
        return;
      }

      // ---- Tool move/rotate/scale: gizmo 3-axis ala Roblox Studio ----
      // Cek handle DULUAN (prioritas lebih tinggi dari hitTest blok biasa) —
      // HANYA kalau sudah ada blok terpilih. Klik handle = mulai drag axis itu.
      if (tool === 'move' || tool === 'rotate' || tool === 'scale') {
        if (s.selected) {
          const ax = hitHandle(mx, my, s.selected);
          if (ax) {
            // Mulai drag handle axis tsb.
            s.dragAxis = ax;
            s.isTransforming = true;
            s.dragStart = { x: mx, y: my };
            s.blockStart = {
              pos: s.selected.pos.clone(),
              rot: s.selected.rot.clone(),
              size: s.selected.size.clone(),
            };
            canvas.style.cursor = 'grabbing';
            return;
          }
        }
        // Klik TIDAK kena handle → jalankan hitTest blok biasa (pilih blok baru / deselect).
        const hit = hitTest(mx, my);
        if (hit) {
          s.selected = hit;
          s.dragAxis = null;     // belum mulai drag axis (harus klik handle dulu)
          s.isTransforming = false;
          s.blockStart = {
            pos: hit.pos.clone(),
            rot: hit.rot.clone(),
            size: hit.size.clone(),
          };
          updateUISelection(hit);
        } else {
          s.selected = null;
          s.dragAxis = null;
          s.isTransforming = false;
          updateUISelection(null);
        }
        render();
        return;
      }

      // ---- Tool delete/clone/color: tetap pakai hitTest blok biasa ----
      const hit = hitTest(mx, my);
      if (hit) {
        s.selected = hit;
        if (tool === 'delete') {
          s.blocks = s.blocks.filter(b => b !== hit);
          s.selected = null;
          setBlockCount(s.blocks.length);
          updateUISelection(null);
        } else if (tool === 'clone') {
          const nb = {
            pos: hit.pos.add(new Vec3(1.2, 0, 0)),
            size: new Vec3(hit.size.x, hit.size.y, hit.size.z),
            rot: new Vec3(hit.rot.x, hit.rot.y, hit.rot.z),
            color: hit.color,
            id: Date.now() + Math.random()
          };
          s.blocks.push(nb);
          s.selected = nb;
          updateUISelection(nb);
        } else if (tool === 'color') {
          // ── PAINT TOOL (copy dari LogicGatesSimulator 2D) ──
          // Klik blok → buka modal colorPicker overlay full-screen berisi ColorWheelPicker.
          // User pilih warna di wheel → hex disimpan di state colorPicker.hex (BELUM apply ke blok).
          // Tombol "Pick Color" → masuk mode eyedropper (pickFromWorkspace).
          // Tombol Confirm → apply colorPicker.hex ke blok, close modal.
          // Tombol Cancel → revert ke originalHex (tidak ada perubahan), close modal.
          const currentHex = hit.color;
          setColorPicker({
            targetType: 'block',
            targetId: hit.id,
            hex: currentHex,
            originalHex: currentHex,
          });
          return;
        }
      } else {
        s.selected = null;
        updateUISelection(null);
        // Empty click saat Paint mode → tutup colorPicker kalau kebuka (konsisten dengan 2D).
        if (colorPickerRef.current) setColorPicker(null);
      }
      render();
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const s = stateRef.current;

      if (s.isOrbiting) {
        const dx = mx - s.dragStart.x, dy = my - s.dragStart.y;
        s.cam.yaw = s.camStart.yaw + dx * 0.007;
        s.cam.pitch = Math.max(-1.45, Math.min(1.45, s.camStart.pitch + dy * 0.007));
        render();
        return;
      }

      if (s.isTransforming && s.selected && s.blockStart && s.dragAxis) {
        const ax = s.dragAxis;
        if (tool === 'move') {
          // Move per-axis: drag handle = ubah posisi sepanjang axis itu SAJA.
          // Sumbu lain TIDAK diubah. Pakai dragAxisDelta (proyeksi vektor) supaya
          // akurat dari sudut kamera manapun, bukan dx/dy mentah.
          const t = dragAxisDelta(mx, my, s.dragStart, s.blockStart.pos, ax);
          s.selected.pos[ax] = snapSingleAxis(s.blockStart.pos[ax] + t);
        } else if (tool === 'rotate') {
          // Rotate per-axis. Pola: Y & Z pakai horizontal drag (dx), X pakai vertical (dy).
          // Pola umum di software 3D: putar sumbu yang "menghadap ke layar" pakai drag horizontal,
          // sumbu yang "mendatar ke layar" pakai drag vertical.
          if (ax === 'y')      s.selected.rot.y = s.blockStart.rot.y + (mx - s.dragStart.x) * 0.008;
          else if (ax === 'x') s.selected.rot.x = s.blockStart.rot.x + (my - s.dragStart.y) * 0.008;
          else if (ax === 'z') s.selected.rot.z = s.blockStart.rot.z + (mx - s.dragStart.x) * 0.008;
        } else if (tool === 'scale') {
          // Scale per-axis: tarik handle = sisi +axis maju/mundur, sisi -axis tetap diam.
          // Sisi berlawanan (sisi -axis) WAJIB tetap diam — dicapai dengan kompensasi posisi
          // pusat blok setengah dari delta size (supaya sisi -axis tidak ikut geser).
          const t = dragAxisDelta(mx, my, s.dragStart, s.blockStart.pos, ax);
          const newSize = Math.max(0.2, s.blockStart.size[ax] + t);
          const actualDelta = newSize - s.blockStart.size[ax];
          s.selected.size[ax] = newSize;
          s.selected.pos[ax] = s.blockStart.pos[ax] + actualDelta / 2;
        }
        updateUISelection(s.selected);
        render();
        return;
      }

      // Tidak sedang orbit atau transform — update ghost preview kalau tool = Place.
      // PENTING: cuma render ulang kalau posisi grid-nya BENERAN berubah (bukan tiap
      // gerakan pixel), biar gak berat karena getGridPos scan seluruh grid.
      if (tool === 'place') {
        const gp = getGridPos(mx, my);
        if (gp) {
          const y = getPlacementY(gp);
          const prev = s.hoverGrid;
          const changed = !prev || prev.x !== gp.x || prev.y !== y || prev.z !== gp.z;
          if (changed) {
            s.hoverGrid = new Vec3(gp.x, y, gp.z);
            s.hoverColor = currentColor;
            render();
          }
        } else if (s.hoverGrid) {
          s.hoverGrid = null;
          render();
        }
      } else if (s.hoverGrid) {
        s.hoverGrid = null;
        render();
      }
    };

    const onMouseUp = () => {
      const s = stateRef.current;
      s.isOrbiting = false;
      s.isTransforming = false;
      s.dragAxis = null;
      canvas.style.cursor = 'grab';
    };

    const onMouseLeave = () => {
      const s = stateRef.current;
      if (s.hoverGrid) {
        s.hoverGrid = null;
        render();
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      const s = stateRef.current;
      s.cam.dist = Math.max(5, Math.min(60, s.cam.dist + e.deltaY * 0.012));
      render();
    };

    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [tool, currentColor, project, render]);

  /* ---------- Keyboard Shortcuts ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      const t = TOOLS.find(t2 => t2.key === k);
      if (t) setTool(t.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ---------- Styles ---------- */
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const panelBg = '#0e1420';
  const panelBorder = '#1e293b';
  const textSecondary = '#94a3b8';
  const pink = '#f472b6';
  const pinkBg = 'rgba(244,114,182,0.18)';

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#05080f',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: `1px solid ${panelBorder}`,
        backgroundColor: panelBg,
        zIndex: 10,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setPage('shapes')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              backgroundColor: panelBg, border: `1px solid #334155`,
              color: textSecondary, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = pink; e.currentTarget.style.color = pink; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = textSecondary; }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              backgroundColor: pinkBg, padding: 8, borderRadius: 10, color: pink,
            }}>
              <Box size={22} />
            </div>
            <h1 style={{
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
              background: 'linear-gradient(180deg,#fbcfe8 0%,#ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.01em',
              margin: 0,
            }}>
              3D BLOCK SIMULATOR
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            padding: '6px 14px', borderRadius: 10,
            backgroundColor: panelBg, border: `1px solid ${panelBorder}`,
            color: textSecondary, fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Cuboid size={14} />
            {blockCount} Blocks
          </div>
          <button
            onClick={() => setShowHelp(v => !v)}
            style={{
              padding: 8, borderRadius: 10,
              backgroundColor: panelBg, border: `1px solid ${panelBorder}`,
              color: textSecondary, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = pink; e.currentTarget.style.color = pink; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = panelBorder; e.currentTarget.style.color = textSecondary; }}
          >
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%', height: '100%',
            display: 'block', cursor: 'grab',
          }}
        />

        {/* Toolbar */}
        <div style={{
          position: 'absolute', top: 16, left: 16,
          display: 'flex', flexDirection: 'column', gap: 6,
          backgroundColor: 'rgba(14, 20, 32, 0.92)',
          padding: 12, borderRadius: 14,
          border: `1px solid ${panelBorder}`,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          zIndex: 5,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: textSecondary,
            textTransform: 'uppercase', letterSpacing: '1px',
            marginBottom: 4, fontFamily: 'Orbitron, sans-serif',
          }}>
            Tools
          </div>
          {TOOLS.map(t => {
            const Icon = t.icon;
            const active = tool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                title={`${t.label} (${t.key.toUpperCase()})`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 10,
                  border: `1px solid ${active ? pink : 'rgba(148,163,184,0.12)'}`,
                  backgroundColor: active ? pink : 'transparent',
                  color: active ? '#0e1420' : '#e2e8f0',
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Color Palette — tampil HANYA saat tool='place' (konsisten dengan 2D:
            saat Paint mode, user pilih warna lewat modal colorPicker, bukan palet). */}
        {tool === 'place' && (
          <div style={{
            position: 'absolute', top: 16, right: 16,
            display: 'flex', flexDirection: 'column', gap: 6,
            backgroundColor: 'rgba(14, 20, 32, 0.92)',
            padding: 12, borderRadius: 14,
            border: `1px solid ${panelBorder}`,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            zIndex: 5,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: textSecondary,
              textTransform: 'uppercase', letterSpacing: '1px',
              marginBottom: 4, fontFamily: 'Orbitron, sans-serif',
            }}>
              Colors
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 30px)', gap: 6,
            }}>
              {COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => {
                    // Klik swatch hanya set currentColor (untuk Place tool — warna blok baru).
                    // Tidak sentuh blok existing (kalau mau ganti warna blok existing, pakai Paint tool).
                    setCurrentColor(c);
                  }}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    backgroundColor: c,
                    cursor: 'pointer',
                    border: `2px solid ${currentColor === c ? pink : 'transparent'}`,
                    transition: 'transform 0.1s',
                    boxShadow: currentColor === c ? `0 0 8px ${c}66` : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              ))}
            </div>
            {/* Tombol "Pilih Warna Lain" — buka modal ColorWheelPicker (port dari 2D). */}
            <button
              onClick={() => {
                setColorWheelDraft(currentColor); // mulai draft dari warna saat ini
                setShowColorWheel(true);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 10px', marginTop: 4, borderRadius: 8,
                backgroundColor: currentColor, border: `1px solid ${pink}`,
                color: '#fff', cursor: 'pointer',
                fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <Paintbrush size={12} />
              Pilih Warna Lain
            </button>
          </div>
        )}

        {/* Selection Info */}
        {selectedInfo && (
          <div style={{
            position: 'absolute', bottom: 16, left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(14, 20, 32, 0.95)',
            padding: '12px 20px', borderRadius: 12,
            border: `1px solid ${pink}`,
            color: '#e2e8f0', fontSize: 12,
            textAlign: 'center', pointerEvents: 'none',
            boxShadow: `0 0 24px ${pink}33`,
            zIndex: 5, lineHeight: 1.6,
          }}>
            <div style={{
              fontFamily: 'Orbitron, sans-serif', fontWeight: 600,
              fontSize: 13, marginBottom: 4, color: pink,
            }}>
              Block Selected
            </div>
            <div style={{ color: textSecondary }}>
              Pos: {selectedInfo.pos}<br/>
              Size: {selectedInfo.size}<br/>
              Rot: {selectedInfo.rot}
            </div>
          </div>
        )}

        {/* Help Panel */}
        {showHelp && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16,
            backgroundColor: 'rgba(14, 20, 32, 0.92)',
            padding: '14px 18px', borderRadius: 12,
            border: `1px solid ${panelBorder}`,
            color: textSecondary, fontSize: 12,
            backdropFilter: 'blur(10px)',
            maxWidth: 300, lineHeight: 1.7,
            zIndex: 5,
          }}>
            <strong style={{ color: '#e2e8f0' }}>Controls</strong><br/>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Hand size={12} /> <strong>Right-Click Drag</strong> = Orbit camera
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MousePointer2 size={12} /> <strong>Scroll</strong> = Zoom
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={12} /> <strong>Click grid</strong> = Place block
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Box size={12} /> <strong>Click block</strong> = Select
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
              <Move size={12} /> <strong>Drag handle</strong> (Merah=X, Hijau=Y, Biru=Z) = Move/Rotate/Scale per-axis
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontStyle: 'italic', color: '#64748b', fontSize: 11 }}>
              Tool Move/Rotate/Scale: klik blok dulu → muncul 3 handle → drag salah satu
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
              <Paintbrush size={12} /> <strong>Paint</strong>: klik blok → modal color picker (wheel + slider + Pick Color)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontStyle: 'italic', color: '#64748b', fontSize: 11 }}>
              Pick Color = eyedropper (klik blok lain → ambil warnanya)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
              <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10 }}>⌨</span>
              <strong>P / M / R / S / C / K / X</strong> = Switch tools
            </span>
          </div>
        )}

        {/* ── Color Picker (Paint tool) — copy dari LogicGatesSimulator 2D ──
            Classic Windows-style: Color wheel + HSV sliders + RGB sliders + preview.
            Confirm/Pick Color/Cancel buttons directly below.
            State: colorPicker = { targetType: 'block', targetId, hex, originalHex } */}
        {colorPicker && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 1000,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'flex-start' : 'center',
              paddingLeft: isMobile ? 16 : 0,
            }}
            onClick={() => {
              // Click overlay luar → cancel (revert originalHex ke blok, close modal).
              const s = stateRef.current;
              const tgt = s.blocks.find(b => b.id === colorPicker.targetId);
              if (tgt) {
                tgt.color = colorPicker.originalHex;
                render();
              }
              setColorPicker(null);
            }}
          >
            {/* Mobile scroll arrows — FIXED on screen, outside modal (supaya user bisa scroll
                horizontal ColorWheelPicker di mobile yang overflow). */}
            {isMobile && (
              <>
                <div style={{
                  position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
                  zIndex: 1001, pointerEvents: 'none',
                  animation: 'cp-blink 1.2s ease-in-out infinite',
                  color: '#fff', fontSize: 72, fontWeight: 900, lineHeight: 1,
                  textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.5)',
                }}>‹</div>
                <div style={{
                  position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                  zIndex: 1001, pointerEvents: 'none',
                  animation: 'cp-blink 1.2s ease-in-out infinite',
                  color: '#fff', fontSize: 72, fontWeight: 900, lineHeight: 1,
                  textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.5)',
                }}>›</div>
              </>
            )}
            <div
              style={{
                background: isMobile ? 'rgba(100, 116, 139, 0.97)' : 'rgba(15, 23, 42, 0.98)',
                border: '1px solid #475569',
                borderRadius: 8,
                padding: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                fontFamily: '"Inter", sans-serif',
                display: 'flex', flexDirection: 'column', gap: 6,
                maxHeight: 'calc(100dvh - 32px)',
                maxWidth: isMobile ? 'calc(100vw - 20px)' : undefined,
                boxSizing: 'border-box',
              }}
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
            >
              {/* Scrollable area — contains title + color picker */}
              <div style={{
                overflowY: 'auto',
                overflowX: 'auto',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                flex: 1, minHeight: 0,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', textAlign: 'center' }}>
                  Block Color
                </div>

                {/* Classic color wheel picker — fully self-contained (component shared dengan 2D). */}
                <ColorWheelPicker
                  hex={colorPicker.hex}
                  onChange={newHex => setColorPicker(cp => cp ? { ...cp, hex: newHex } : cp)}
                  onPickColor={() => {
                    // Save current picker state, close modal, enter pick-from-workspace mode (eyedropper).
                    const savedPicker = { ...colorPicker };
                    setColorPicker(null);
                    setPickFromWorkspace(savedPicker);
                    // Pakai crosshair cursor di canvas (alternatif simpel dari eyedropper cursor 2D).
                    const canvas = canvasRef.current;
                    if (canvas) canvas.style.cursor = 'crosshair';
                  }}
                />
              </div>

              {/* Action buttons: Confirm | Cancel — OUTSIDE scrollable area, stays fixed */}
              <div style={{ display: 'flex', gap: 6, marginTop: 2, flexShrink: 0 }}>
                <button
                  onClick={() => {
                    // Confirm — apply colorPicker.hex ke blok target, close modal.
                    const hex = colorPicker.hex;
                    const tgtId = colorPicker.targetId;
                    const s = stateRef.current;
                    const tgt = s.blocks.find(b => b.id === tgtId);
                    if (tgt) {
                      tgt.color = hex;
                      render();
                    }
                    // Update selectedInfo juga supaya UI sinkron (kalau blok target = s.selected).
                    if (s.selected && s.selected.id === tgtId) {
                      updateUISelection(s.selected);
                    }
                    setColorPicker(null);
                  }}
                  style={{
                    flex: 1, padding: '5px 8px', fontSize: 11, fontWeight: 700,
                    background: 'linear-gradient(135deg, #059669, #10b981)', border: '1px solid #34d399',
                    borderRadius: 4, color: '#ffffff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Check size={12} strokeWidth={2.5} />
                  Confirm
                </button>
                <button
                  onClick={() => {
                    // Cancel — revert originalHex ke blok (tidak ada perubahan), close modal.
                    const origHex = colorPicker.originalHex;
                    const tgtId = colorPicker.targetId;
                    const s = stateRef.current;
                    const tgt = s.blocks.find(b => b.id === tgtId);
                    if (tgt) {
                      tgt.color = origHex;
                      render();
                    }
                    setColorPicker(null);
                  }}
                  style={{
                    flex: 1, padding: '5px 8px', fontSize: 11, fontWeight: 600,
                    background: '#1e293b', border: '1px solid #475569',
                    borderRadius: 4, color: '#FFFFFF', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                  }}
                >
                  <X size={12} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ColorWheelPicker modal — port dari LogicGatesSimulator SlotColorPickerModal.
            Styling PERSIS sama: gradient gelap, border #334155, tombol Confirm hijau gradient,
            tombol Cancel abu-abu. Dipakai buat pilih warna bebas (bukan cuma 12 preset COLORS). */}
        {showColorWheel && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1003,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)', padding: 16,
            }}
            onClick={() => setShowColorWheel(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: 16, padding: 16,
                border: '2px solid #334155',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center',
                maxHeight: 'calc(100dvh - 32px)', boxSizing: 'border-box',
              }}
            >
              <div style={{
                overflowY: 'auto', overflowX: 'auto',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                flex: 1, minHeight: 0, alignSelf: 'stretch',
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: '#e2e8f0',
                  fontFamily: 'Inter, sans-serif', marginBottom: 6, textAlign: 'center',
                }}>
                  Pilih Warna Bebas
                </div>
                <ColorWheelPicker
                  hex={colorWheelDraft}
                  onChange={setColorWheelDraft}
                />
              </div>
              <div style={{
                display: 'flex', gap: 6, width: '100%',
                justifyContent: 'center', flexShrink: 0, alignSelf: 'stretch',
              }}>
                <button
                  onClick={() => {
                    // Confirm — hanya set currentColor (untuk Place tool — warna blok baru).
                    // Tidak sentuh blok existing. Untuk ganti warna blok existing, pakai Paint tool.
                    setCurrentColor(colorWheelDraft);
                    setShowColorWheel(false);
                  }}
                  style={{
                    flex: 1, padding: '5px 16px', fontSize: 11, fontWeight: 700,
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    border: '1px solid #34d399', borderRadius: 4,
                    color: '#fff', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Check size={12} strokeWidth={2.5} /> Confirm
                </button>
                <button
                  onClick={() => setShowColorWheel(false)}
                  style={{
                    flex: 1, padding: '5px 16px', fontSize: 11, fontWeight: 600,
                    background: '#1e293b', border: '1px solid #475569',
                    borderRadius: 4, color: '#fff', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
