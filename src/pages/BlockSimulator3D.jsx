import { useRef, useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, Box, Plus, Move, RotateCw, Maximize, Paintbrush,
  Copy, Trash2, MousePointer2, Hand, Info, Cuboid
} from 'lucide-react';

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
    dragStart: null,
    camStart: null,
    transformStart: null,
    blockStart: null,
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
      p = rotY(p, r.y); p = rotX(p, r.x); p = rotY(p, r.z);
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

    // Grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.10)';
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
        { idx: [3, 2, 6, 7], shade: 1.0 },
        { idx: [0, 3, 7, 4], shade: 0.72 },
        { idx: [1, 2, 6, 5], shade: 0.88 }
      ];
      faces.forEach(f => { f.avgZ = f.idx.reduce((sum, i2) => sum + pc[i2].z, 0) / 4; });
      faces.sort((a, b2) => b2.avgZ - a.avgZ);

      faces.forEach(f => {
        const pts = f.idx.map(i2 => pc[i2]);
        const ax = pts[1].x - pts[0].x, ay = pts[1].y - pts[0].y;
        const bx = pts[2].x - pts[1].x, by = pts[2].y - pts[1].y;
        if (ax * by - ay * bx > 0) return; // backface cull
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
  }, [project]);

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

  const hitTest = (mx, my) => {
    const s = stateRef.current;
    for (let i = s.blocks.length - 1; i >= 0; i--) {
      const b = s.blocks[i];
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

    const onMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const s = stateRef.current;

      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        s.isOrbiting = true;
        s.dragStart = { x: mx, y: my };
        s.camStart = { yaw: s.cam.yaw, pitch: s.cam.pitch };
        canvas.style.cursor = 'grabbing';
        return;
      }

      if (tool === 'place') {
        const gp = getGridPos(mx, my);
        if (gp) {
          let y = 0;
          const stack = s.blocks.filter(b =>
            Math.abs(b.pos.x - gp.x) < 0.1 && Math.abs(b.pos.z - gp.z) < 0.1
          );
          if (stack.length > 0) {
            stack.sort((a, b) => b.pos.y - a.pos.y);
            y = stack[0].pos.y + (stack[0].size ? stack[0].size.y : 1);
          }
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
        }
        return;
      }

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
          hit.color = currentColor;
        } else if (tool === 'move' || tool === 'rotate' || tool === 'scale') {
          s.isTransforming = true;
          s.transformStart = { x: mx, y: my };
          s.blockStart = {
            pos: hit.pos.clone(),
            rot: hit.rot.clone(),
            size: hit.size.clone()
          };
        }
        render();
      } else {
        s.selected = null;
        updateUISelection(null);
        render();
      }
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const s = stateRef.current;

      if (s.isOrbiting) {
        const dx = mx - s.dragStart.x, dy = my - s.dragStart.y;
        s.cam.yaw = s.camStart.yaw - dx * 0.007;
        s.cam.pitch = Math.max(-1.45, Math.min(1.45, s.camStart.pitch - dy * 0.007));
        render();
        return;
      }

      if (s.isTransforming && s.selected && s.blockStart) {
        const dx = mx - s.transformStart.x, dy = my - s.transformStart.y;
        if (tool === 'move') {
          s.selected.pos.x = s.blockStart.pos.x + dx * 0.018;
          s.selected.pos.z = s.blockStart.pos.z - dy * 0.018;
          s.selected.pos = snap(s.selected.pos);
        } else if (tool === 'rotate') {
          s.selected.rot.y = s.blockStart.rot.y + dx * 0.008;
        } else if (tool === 'scale') {
          const sc = Math.max(0.2, 1 + dy * 0.004);
          s.selected.size.x = Math.max(0.2, s.blockStart.size.x * sc);
          s.selected.size.y = Math.max(0.2, s.blockStart.size.y * sc);
          s.selected.size.z = Math.max(0.2, s.blockStart.size.z * sc);
        }
        updateUISelection(s.selected);
        render();
      }
    };

    const onMouseUp = () => {
      const s = stateRef.current;
      s.isOrbiting = false;
      s.isTransforming = false;
      canvas.style.cursor = 'grab';
    };

    const onWheel = (e) => {
      e.preventDefault();
      const s = stateRef.current;
      s.cam.dist = Math.max(5, Math.min(60, s.cam.dist + e.deltaY * 0.012));
      render();
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
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

        {/* Color Palette */}
        {(tool === 'place' || tool === 'color') && (
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
                    setCurrentColor(c);
                    const s = stateRef.current;
                    if (s.selected && tool === 'color') {
                      s.selected.color = c;
                      render();
                    }
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
              <Hand size={12} /> <strong>Drag</strong> = Orbit camera
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
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10 }}>⌨</span>
              <strong>P / M / R / S / C / K / X</strong> = Switch tools
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
