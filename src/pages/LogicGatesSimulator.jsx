import { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// ── Gate Data Model (Basic Wire dihapus total — gak dibutuhkan di simulator) ──
const GATE_DATA = [
  { id: 2, type: 'not',   name: 'NOT Gate',   dualInput: false, label: 'NOT',  color: '#f87171',
    description: 'Pembalik sinyal (Inverter).' },
  { id: 3, type: 'and',   name: 'AND Gate',   dualInput: true,  label: 'AND',  color: '#4ade80',
    description: 'Output = 1 HANYA jika A dan B keduanya = 1.' },
  { id: 4, type: 'nand',  name: 'NAND Gate',  dualInput: true,  label: 'NAND', color: '#fb923c',
    description: 'Kebalikan AND. NAND adalah gerbang universal.' },
  { id: 5, type: 'or',    name: 'OR Gate',    dualInput: true,  label: 'OR',   color: '#a78bfa',
    description: 'Output = 1 jika SALAH SATU atau keduanya bernilai 1.' },
  { id: 6, type: 'nor',   name: 'NOR Gate',   dualInput: true,  label: 'NOR',  color: '#f472b6',
    description: 'Kebalikan OR. Output = 1 HANYA jika A dan B keduanya = 0.' },
  { id: 7, type: 'xor',   name: 'XOR Gate',   dualInput: true,  label: 'XOR',  color: '#facc15',
    description: 'Exclusive OR. Output = 1 HANYA jika A dan B BERBEDA.' },
  { id: 8, type: 'xnor',  name: 'XNOR Gate',  dualInput: true,  label: 'XNOR', color: '#2dd4bf',
    description: 'Kebalikan XOR. Output = 1 HANYA jika A dan B SAMA.' },
];

// Pseudo-defs untuk INPUT (Switch) & OUTPUT (LED) — gak masuk GATE_DATA (gak ditampilin sebagai gate),
// tapi dipakai oleh createComponent, draw loop, dan paletteDrag supaya gak crash.
const IO_DEFS = {
  // INPUT (Switch) height ditambah dari 50 → 60 supaya muat drag handle bar di atas (12px).
  // User minta: switch punya tombol drag sendiri biar bisa dipindah tanpa toggle.
  INPUT:  { color: '#f59e0b', label: 'IN',  name: 'Switch', width: 60, height: 60, inputCount: 0, outputCount: 1 },
  OUTPUT: { color: '#ef4444', label: 'OUT', name: 'LED',    width: 60, height: 50, inputCount: 1, outputCount: 0 },
};

const GATE_MAP = Object.fromEntries(GATE_DATA.map(g => [g.type, g]));

// ── Logic Engine ──
function computeGate(type, inputs) {
  const [a, b] = inputs;
  switch (type) {
    case 'not':   return !a;
    case 'and':   return a && b;
    case 'nand':  return !(a && b);
    case 'or':    return a || b;
    case 'nor':   return !(a || b);
    case 'xor':   return a !== b;
    case 'xnor':  return a === b;
    default:      return false;
  }
}

// ── SVG Gate Renderer (paths from GateDiagram.jsx) ──
function GateSVG({ type, color, width = 90, height = 56 }) {
  const dual = GATE_MAP[type]?.dualInput ?? true;
  const C = 10;
  const N = dual ? 6 : 3;
  const q = dual ? 50 : 53;
  const L = dual ? 28 : 28;
  const I = q - N;
  const P = 5;
  const r = color;
  const dim = '#475569';
  const bodyStroke = color;

  const paths = {
    wire: null,
    not: (
      <>
        <polygon points={`${C},${N} ${C+54},${L} ${C},${q}`} fill="none" stroke={bodyStroke} strokeWidth="2.5" strokeLinejoin="round"/>
        <circle cx={C+54+P} cy={L} r={P} fill="none" stroke={bodyStroke} strokeWidth="2"/>
      </>
    ),
    and: (
      <>
        <path d={`M ${C},${N} L ${C+26},${N} A ${I/2} ${I/2} 0 0 1 ${C+26},${q} L ${C},${q} Z`} fill="none" stroke={bodyStroke} strokeWidth="2.5"/>
      </>
    ),
    nand: (
      <>
        <path d={`M ${C},${N} L ${C+22},${N} A ${I/2} ${I/2} 0 0 1 ${C+22},${q} L ${C},${q} Z`} fill="none" stroke={bodyStroke} strokeWidth="2.5"/>
        <circle cx={C+22+I/2+P} cy={L} r={P} fill="none" stroke={bodyStroke} strokeWidth="2"/>
      </>
    ),
    or: (
      <>
        <path d={`M ${C},${N} C ${C+22},${N} ${C+70-18},${L-16} ${C+70},${L} C ${C+70-18},${L+16} ${C+22},${q} ${C},${q} C ${C+15},${L+9} ${C+15},${L-9} ${C},${N} Z`} fill="none" stroke={bodyStroke} strokeWidth="2.5"/>
      </>
    ),
    nor: (
      <>
        <path d={`M ${C},${N} C ${C+22},${N} ${C+65-18},${L-16} ${C+65},${L} C ${C+65-18},${L+16} ${C+22},${q} ${C},${q} C ${C+15},${L+9} ${C+15},${L-9} ${C},${N} Z`} fill="none" stroke={bodyStroke} strokeWidth="2.5"/>
        <circle cx={C+65+P} cy={L} r={P} fill="none" stroke={bodyStroke} strokeWidth="2"/>
      </>
    ),
    xor: (
      <>
        <path d={`M ${C},${N} C ${C+22},${N} ${C+70-18},${L-16} ${C+70},${L} C ${C+70-18},${L+16} ${C+22},${q} ${C},${q} C ${C+15},${L+9} ${C+15},${L-9} ${C},${N} Z`} fill="none" stroke={bodyStroke} strokeWidth="2.5"/>
        <path d={`M ${C-9},${N} C ${C-9+13},${L-9} ${C-9+13},${L+9} ${C-9},${q}`} fill="none" stroke={bodyStroke} strokeWidth="2"/>
      </>
    ),
    xnor: (
      <>
        <path d={`M ${C},${N} C ${C+22},${N} ${C+65-18},${L-16} ${C+65},${L} C ${C+65-18},${L+16} ${C+22},${q} ${C},${q} C ${C+15},${L+9} ${C+15},${L-9} ${C},${N} Z`} fill="none" stroke={bodyStroke} strokeWidth="2.5"/>
        <circle cx={C+65+P} cy={L} r={P} fill="none" stroke={bodyStroke} strokeWidth="2"/>
        <path d={`M ${C-9},${N} C ${C-9+13},${L-9} ${C-9+13},${L+9} ${C-9},${q}`} fill="none" stroke={bodyStroke} strokeWidth="2"/>
      </>
    ),
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {paths[type]}
    </svg>
  );
}

// ── MiniGateIcon (palette icon, model centered dari CircuitCard00.jsx commit d9e010d) ──
// Semua gate body di-center di canvas maxW supaya input & output wire seimbang.
// scale prop untuk adjust ukuran tampilan (viewBox tetap, width/height discale).
function MiniGateIcon({ type, color, scale = 1 }) {
  const s = color, sw = 3;
  const h = 36, cy = 18, sz = 13;
  const triW = 14;
  const bw = 5;
  const bubbleR = 3.5;
  const bubbleGap = 3;
  const wireLen = 10;
  const tipX = sz * 1.7;
  const xorExtra = 15;
  const andWireOff = 6;
  const orWireOff = sz / 2;
  const svgStyle = { 
    display: 'block', 
    flexShrink: 0,
    // Glow effect — match Basic Logic Gates reference (drop-shadow filter)
    filter: `drop-shadow(0 0 2px ${color}) drop-shadow(0 0 4px ${color}80)`,
  };

  const maxW = wireLen + xorExtra + tipX + bubbleGap + bubbleR + wireLen;

  switch (type) {
    case 'not': {
      const naturalW = wireLen + triW + bubbleGap + bubbleR + wireLen;
      const leftPad = (maxW - naturalW) / 2;
      const cx = wireLen;
      const triTip = cx + triW;
      const bubbleCx = triTip + bubbleGap;
      return <svg viewBox={`0 0 ${maxW} ${h}`} width={maxW * scale} height={h * scale} style={svgStyle}>
        <g transform={`translate(${leftPad},0)`}>
          <line x1={0} y1={cy} x2={cx} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <polygon points={`${cx},${cy - sz} ${cx},${cy + sz} ${triTip},${cy}`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
          <circle cx={bubbleCx} cy={cy} r={bubbleR} fill="none" stroke={s} strokeWidth={sw} />
          <line x1={bubbleCx + bubbleR} y1={cy} x2={naturalW} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
        </g>
      </svg>;
    }
    case 'and': {
      const naturalW = (wireLen + bw + sz) + wireLen;
      const leftPad = (maxW - naturalW) / 2;
      const cx = wireLen;
      const bodyRight = cx + bw + sz;
      return <svg viewBox={`0 0 ${maxW} ${h}`} width={maxW * scale} height={h * scale} style={svgStyle}>
        <g transform={`translate(${leftPad},0)`}>
          <line x1={0} y1={cy - andWireOff} x2={cx} y2={cy - andWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <line x1={0} y1={cy + andWireOff} x2={cx} y2={cy + andWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M ${cx},${cy - sz} L ${cx + bw},${cy - sz} A ${sz},${sz} 0 0,1 ${cx + bw},${cy + sz} L ${cx},${cy + sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
          <line x1={bodyRight} y1={cy} x2={naturalW} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
        </g>
      </svg>;
    }
    case 'nand': {
      const naturalW = (wireLen + bw + sz + bubbleGap) + bubbleR + wireLen;
      const leftPad = (maxW - naturalW) / 2;
      const cx = wireLen;
      const arcRight = cx + bw + sz;
      const bubbleCx = arcRight + bubbleGap;
      return <svg viewBox={`0 0 ${maxW} ${h}`} width={maxW * scale} height={h * scale} style={svgStyle}>
        <g transform={`translate(${leftPad},0)`}>
          <line x1={0} y1={cy - andWireOff} x2={cx} y2={cy - andWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <line x1={0} y1={cy + andWireOff} x2={cx} y2={cy + andWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M ${cx},${cy - sz} L ${cx + bw},${cy - sz} A ${sz},${sz} 0 0,1 ${cx + bw},${cy + sz} L ${cx},${cy + sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
          <circle cx={bubbleCx} cy={cy} r={bubbleR} fill="none" stroke={s} strokeWidth={sw} />
          <line x1={bubbleCx + bubbleR} y1={cy} x2={naturalW} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
        </g>
      </svg>;
    }
    case 'or': {
      const naturalW = (wireLen + tipX) + wireLen;
      const leftPad = (maxW - naturalW) / 2;
      const cx = wireLen;
      const tip = cx + tipX;
      return <svg viewBox={`0 0 ${maxW} ${h}`} width={maxW * scale} height={h * scale} style={svgStyle}>
        <g transform={`translate(${leftPad},0)`}>
          <line x1={0} y1={cy - orWireOff} x2={cx} y2={cy - orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <line x1={0} y1={cy + orWireOff} x2={cx} y2={cy + orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M ${cx},${cy - sz} Q ${cx + sz * 1.2},${cy - sz} ${tip},${cy} Q ${cx + sz * 1.2},${cy + sz} ${cx},${cy + sz} Q ${cx + sz * 0.4},${cy} ${cx},${cy - sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
          <line x1={tip} y1={cy} x2={naturalW} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
        </g>
      </svg>;
    }
    case 'nor': {
      const naturalW = (wireLen + tipX + bubbleGap) + bubbleR + wireLen;
      const leftPad = (maxW - naturalW) / 2;
      const cx = wireLen;
      const tip = cx + tipX;
      const bubbleCx = tip + bubbleGap;
      return <svg viewBox={`0 0 ${maxW} ${h}`} width={maxW * scale} height={h * scale} style={svgStyle}>
        <g transform={`translate(${leftPad},0)`}>
          <line x1={0} y1={cy - orWireOff} x2={cx} y2={cy - orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <line x1={0} y1={cy + orWireOff} x2={cx} y2={cy + orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M ${cx},${cy - sz} Q ${cx + sz * 1.2},${cy - sz} ${tip},${cy} Q ${cx + sz * 1.2},${cy + sz} ${cx},${cy + sz} Q ${cx + sz * 0.4},${cy} ${cx},${cy - sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
          <circle cx={bubbleCx} cy={cy} r={bubbleR} fill="none" stroke={s} strokeWidth={sw} />
          <line x1={bubbleCx + bubbleR} y1={cy} x2={naturalW} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
        </g>
      </svg>;
    }
    case 'xor': {
      const naturalW = (wireLen + xorExtra + tipX) + wireLen;
      const leftPad = (maxW - naturalW) / 2;
      const cx = wireLen + xorExtra;
      const tip = cx + tipX;
      const curveStart = cx - xorExtra;
      const ctrlX = cx + sz * 0.4;
      const tWire = (sz + 2) / (4 * (sz + 1));
      const xorWireEnd = curveStart + 2 * tWire * (1 - tWire) * (ctrlX - curveStart);
      return <svg viewBox={`0 0 ${maxW} ${h}`} width={maxW * scale} height={h * scale} style={svgStyle}>
        <g transform={`translate(${leftPad},0)`}>
          <line x1={0} y1={cy - orWireOff} x2={xorWireEnd} y2={cy - orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <line x1={0} y1={cy + orWireOff} x2={xorWireEnd} y2={cy + orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M ${curveStart},${cy - sz - 1} Q ${ctrlX},${cy} ${curveStart},${cy + sz + 1}`} fill="none" stroke={s} strokeWidth={sw} />
          <path d={`M ${cx},${cy - sz} Q ${cx + sz * 1.2},${cy - sz} ${tip},${cy} Q ${cx + sz * 1.2},${cy + sz} ${cx},${cy + sz} Q ${cx + sz * 0.4},${cy} ${cx},${cy - sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
          <line x1={tip} y1={cy} x2={naturalW} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
        </g>
      </svg>;
    }
    case 'xnor': {
      const naturalW = (wireLen + xorExtra + tipX + bubbleGap) + bubbleR + wireLen;
      const leftPad = (maxW - naturalW) / 2;
      const cx = wireLen + xorExtra;
      const tip = cx + tipX;
      const curveStart = cx - xorExtra;
      const ctrlX = cx + sz * 0.4;
      const tWire = (sz + 2) / (4 * (sz + 1));
      const xorWireEnd = curveStart + 2 * tWire * (1 - tWire) * (ctrlX - curveStart);
      const bubbleCx = tip + bubbleGap;
      return <svg viewBox={`0 0 ${maxW} ${h}`} width={maxW * scale} height={h * scale} style={svgStyle}>
        <g transform={`translate(${leftPad},0)`}>
          <line x1={0} y1={cy - orWireOff} x2={xorWireEnd} y2={cy - orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <line x1={0} y1={cy + orWireOff} x2={xorWireEnd} y2={cy + orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M ${curveStart},${cy - sz - 1} Q ${ctrlX},${cy} ${curveStart},${cy + sz + 1}`} fill="none" stroke={s} strokeWidth={sw} />
          <path d={`M ${cx},${cy - sz} Q ${cx + sz * 1.2},${cy - sz} ${tip},${cy} Q ${cx + sz * 1.2},${cy + sz} ${cx},${cy + sz} Q ${cx + sz * 0.4},${cy} ${cx},${cy - sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
          <circle cx={bubbleCx} cy={cy} r={bubbleR} fill="none" stroke={s} strokeWidth={sw} />
          <line x1={bubbleCx + bubbleR} y1={cy} x2={naturalW} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
        </g>
      </svg>;
    }
    default:
      return null;
  }
}

// ── DragGhost — visual feedback saat drag component dari palette ke canvas ──
// User bilang "gak ada visual dimana user sedang mendrag suatu komponen, harusnya ada visualnya".
// Ghost ini render fixed-position di cursor, jadi user tahu lagi ngedrag apa.
function DragGhost({ type, x, y }) {
  const def = GATE_MAP[type] || IO_DEFS[type];
  if (!def) return null;
  const isIO = type === 'INPUT' || type === 'OUTPUT';
  const w = isIO ? 60 : (type === 'not' ? 80 : 90);
  const h = isIO ? IO_DEFS[type].height : 56;  // INPUT=60 (ada drag handle), OUTPUT=50
  return (
    <div style={{
      position: 'fixed',
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      pointerEvents: 'none',
      zIndex: 9999,
      opacity: 0.92,
      backgroundColor: '#1e293b',
      border: `2px solid ${def.color}`,
      borderRadius: 8,
      boxShadow: `0 4px 16px rgba(0,0,0,0.6), 0 0 14px ${def.color}80`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: '"Orbitron", sans-serif',
      overflow: 'hidden',
    }}>
      <div style={{
        width: '100%', height: 14,
        backgroundColor: def.color + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: def.color, fontSize: 8, fontWeight: 700, letterSpacing: 0.5,
        flexShrink: 0,
      }}>
        {def.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '2px 0' }}>
        {isIO ? (
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            backgroundColor: type === 'INPUT' ? '#f59e0b' : '#ef4444',
            boxShadow: `0 0 10px ${def.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 700,
          }}>
            {type === 'INPUT' ? '⚡' : '●'}
          </div>
        ) : (
          <MiniGateIcon type={type} color={def.color} scale={0.7} />
        )}
      </div>
    </div>
  );
}

// ── Canvas Simulator ──
export default function LogicGatesSimulator({ setPage }) {
  const canvasRef = useRef(null);
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [status, setStatus] = useState('Ready — drag from palette, click nodes to wire');
  const [selectedId, setSelectedId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  // Viewport: pan & zoom state. view = { x, y, scale } di stateRef (mutable, dipakai draw loop &
  // hitTest via screenToWorld). zoomPct di React state cuma buat UI label.
  const [zoomPct, setZoomPct] = useState(100);
  // Cursor world coords — null saat mouse di luar canvas. Dipakai buat coordinate display.
  const [cursorWorld, setCursorWorld] = useState(null);
  const spaceDownRef = useRef(false);

  const stateRef = useRef({
    components, wires, nextId, selectedId,
    wiring: null, dragging: null, dragOffset: { x: 0, y: 0 }, hoverNode: null,
    view: { x: 0, y: 0, scale: 1 },       // ← viewport pan/zoom (mutable, dibaca tiap frame)
    panning: null,                         // ← { startMouseX, startMouseY, startViewX, startViewY } saat pan aktif
  });
  useEffect(() => { stateRef.current = { ...stateRef.current, components, wires, nextId, selectedId }; }, [components, wires, nextId, selectedId]);

  // Screen (canvas pixel) → World (component coords). Dipakai SEMUA mouse handler.
  const screenToWorld = useCallback((sx, sy) => {
    const v = stateRef.current.view;
    return { x: (sx - v.x) / v.scale, y: (sy - v.y) / v.scale };
  }, []);

  // Clamp zoom supaya gak terlalu extreme (0.2x – 3x).
  const clampScale = (s) => Math.max(0.2, Math.min(3, s));

  // Zoom terhadap titik layar tertentu (biasanya cursor). World point di bawah cursor
  // tetap di bawah cursor sesudah zoom.
  const zoomAt = useCallback((sx, sy, factor) => {
    const v = stateRef.current.view;
    const newScale = clampScale(v.scale * factor);
    if (newScale === v.scale) return;
    const worldX = (sx - v.x) / v.scale;
    const worldY = (sy - v.y) / v.scale;
    v.x = sx - worldX * newScale;
    v.y = sy - worldY * newScale;
    v.scale = newScale;
    setZoomPct(Math.round(newScale * 100));
  }, []);

  // Reset viewport ke origin + scale 1 (fit default).
  const resetView = useCallback(() => {
    const v = stateRef.current.view;
    v.x = 0; v.y = 0; v.scale = 1;
    setZoomPct(100);
  }, []);

  const createComponent = useCallback((type, x, y) => {
    // Tentukan ukuran box & jumlah input/output berdasarkan type
    let w = 90, h = 56, inputCount = 2, outputCount = 1;
    if (type === 'not') {
      w = 80; inputCount = 1;
    } else if (type === 'INPUT' || type === 'OUTPUT') {
      const io = IO_DEFS[type];
      w = io.width; h = io.height; inputCount = io.inputCount; outputCount = io.outputCount;
    }
    return {
      id: stateRef.current.nextId,
      type,
      x, y,
      width: w,
      height: h,
      inputs: Array(inputCount).fill(false),
      outputs: Array(outputCount).fill(false),
      inputWires: Array(inputCount).fill(null),
      outputWires: Array(outputCount).fill([]),
    };
  }, []);

  const simulate = useCallback((comps, wrs) => {
    let changed = true;
    let iters = 0;
    const compsCopy = comps.map(c => ({...c, inputs: [...c.inputs], outputs: [...c.outputs]}));
    while (changed && iters < 50) {
      changed = false;
      iters++;
      for (const comp of compsCopy) {
        if (comp.type === 'INPUT') continue;
        if (comp.type === 'OUTPUT') {
          // OUTPUT adalah sink (LED) — baca nilai dari wire input, tidak ada output untuk di-compute
          for (let i = 0; i < comp.inputs.length; i++) {
            const wireId = comp.inputWires[i];
            if (wireId !== null && wireId !== undefined) {
              const wire = wrs.find(w => w.id === wireId);
              if (wire) {
                const src = compsCopy.find(c => c.id === wire.from);
                if (src) comp.inputs[i] = src.outputs[wire.fromIdx];
              }
            }
          }
          continue;
        }
        for (let i = 0; i < comp.inputs.length; i++) {
          const wireId = comp.inputWires[i];
          if (wireId !== null) {
            const wire = wrs.find(w => w.id === wireId);
            if (wire) {
              const src = compsCopy.find(c => c.id === wire.from);
              if (src) comp.inputs[i] = src.outputs[wire.fromIdx];
            }
          }
        }
        const newVal = computeGate(comp.type, comp.inputs);
        if (comp.outputs[0] !== newVal) {
          comp.outputs[0] = newVal;
          changed = true;
        }
      }
    }
    const newWires = wrs.map(w => {
      const src = compsCopy.find(c => c.id === w.from);
      return { ...w, value: src ? src.outputs[w.fromIdx] : false };
    });
    return { comps: compsCopy, wrs: newWires };
  }, []);

  const getNodePos = useCallback((comp, isInput, idx) => {
    // Port y untuk INPUT/OUTPUT (Switch/LED): default spacing berdasarkan jumlah port.
    // Port y untuk logic gate (NOT/AND/.../XNOR): DISESUAIKAN supaya LURUS dengan
    // gate internal wire y. Konstanta match drawGateShape + render call site:
    //   drawGateShape: L=15, N=5, q=25 (lokal)
    //   render call: translate y = comp.y+20, GATE_SCALE = 1.2
    //   → NOT input & gate output wire y global = comp.y + 20 + 15*1.2 = comp.y + 38
    //   → dual input atas y global = comp.y + 20 + (N+3)*1.2 = comp.y + 29.6
    //   → dual input bawah y global = comp.y + 20 + (q-3)*1.2 = comp.y + 46.4
    // Sebelumnya port pakai spacing comp.height/(n+1) → y gak lurus dengan gate wire
    // → kabel gak nyambung. User minta port digeser biar lurus.
    if (comp.type === 'INPUT' || comp.type === 'OUTPUT') {
      if (isInput) {
        const spacing = comp.height / (comp.inputs.length + 1);
        return { x: comp.x, y: comp.y + spacing * (idx + 1) };
      } else {
        const spacing = comp.height / (comp.outputs.length + 1);
        return { x: comp.x + comp.width, y: comp.y + spacing * (idx + 1) };
      }
    }
    // Logic gate (not/and/nand/or/nor/xor/xnor)
    if (isInput) {
      if (comp.type === 'not') {
        return { x: comp.x, y: comp.y + 38 };  // match L=15 scaled
      }
      // Dual input
      return { x: comp.x, y: comp.y + (idx === 0 ? 29.6 : 46.4) };
    } else {
      // Output (selalu 1, di tengah-tengah body, y = L=15 scaled)
      return { x: comp.x + comp.width, y: comp.y + 38 };
    }
  }, []);

  const hitTest = useCallback((mx, my, comps) => {
    for (let i = comps.length - 1; i >= 0; i--) {
      const c = comps[i];
      // Drag handle bar di atas INPUT (Switch) — cek SEBELUM body supaya handle menang
      // atas body hit. Handle area: top 12px dari comp body.
      if (c.type === 'INPUT' && mx >= c.x && mx <= c.x + c.width && my >= c.y && my <= c.y + 12) {
        return { kind: 'drag-handle', comp: c };
      }
      if (mx >= c.x && mx <= c.x + c.width && my >= c.y && my <= c.y + c.height) {
        return { kind: 'body', comp: c };
      }
      for (let j = 0; j < c.inputs.length; j++) {
        const p = getNodePos(c, true, j);
        if (Math.hypot(mx - p.x, my - p.y) < 8) return { kind: 'input', comp: c, idx: j, x: p.x, y: p.y };
      }
      for (let j = 0; j < c.outputs.length; j++) {
        const p = getNodePos(c, false, j);
        if (Math.hypot(mx - p.x, my - p.y) < 8) return { kind: 'output', comp: c, idx: j, x: p.x, y: p.y };
      }
    }
    return null;
  }, [getNodePos]);

  const wouldCreateCycle = useCallback((fromId, toId, comps, wrs) => {
    const visited = new Set();
    const queue = [toId];
    while (queue.length) {
      const curr = queue.shift();
      if (curr === fromId) return true;
      if (visited.has(curr)) continue;
      visited.add(curr);
      const comp = comps.find(c => c.id === curr);
      if (comp) {
        for (const wireId of comp.outputWires.flat()) {
          const wire = wrs.find(w => w.id === wireId);
          if (wire) queue.push(wire.to);
        }
      }
    }
    return false;
  }, []);

  // ── Drawing ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const draw = () => {
      const { components: comps, wires: wrs, wiring, hoverNode, selectedId: selId, view } = stateRef.current;
      // Blueprint background: deep blue paper + white grid lines (ala gambar teknik).
      // Bikin canvas gak kosong & kasih sense of scale pas pan/zoom.
      const bgGrad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
      );
      bgGrad.addColorStop(0, '#0f2847');
      bgGrad.addColorStop(1, '#091628');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines (blueprint style: minor 20u + major 100u).
      // Minor: subtle white lines setiap 20 world units.
      // Major: brighter white lines setiap 100 world units — reference scale.
      // Adaptive: skip minor kalau zoom terlalu kecil (terlalu padat di screen).
      const MINOR = 20;
      const MAJOR = 100;
      const screenMinor = MINOR * view.scale;
      const screenMajor = MAJOR * view.scale;

      if (screenMinor >= 6) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const offMinX = ((view.x % screenMinor) + screenMinor) % screenMinor;
        const offMinY = ((view.y % screenMinor) + screenMinor) % screenMinor;
        for (let x = offMinX; x < canvas.width; x += screenMinor) {
          ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
        }
        for (let y = offMinY; y < canvas.height; y += screenMinor) {
          ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
      }

      if (screenMajor >= 20) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const offMajX = ((view.x % screenMajor) + screenMajor) % screenMajor;
        const offMajY = ((view.y % screenMajor) + screenMajor) % screenMajor;
        for (let x = offMajX; x < canvas.width; x += screenMajor) {
          ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
        }
        for (let y = offMajY; y < canvas.height; y += screenMajor) {
          ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
      }

      // Apply viewport transform: SEMUA world-space drawing (wires, components, hover)
      // di-translate & di-scale sesuai view.
      ctx.save();
      ctx.translate(view.x, view.y);
      ctx.scale(view.scale, view.scale);

      // Wires
      for (const wire of wrs) {
        const src = comps.find(c => c.id === wire.from);
        const dst = comps.find(c => c.id === wire.to);
        if (!src || !dst) continue;
        const p1 = getNodePos(src, false, wire.fromIdx);
        const p2 = getNodePos(dst, true, wire.toIdx);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        const midX = (p1.x + p2.x) / 2;
        ctx.bezierCurveTo(midX, p1.y, midX, p2.y, p2.x, p2.y);
        ctx.strokeStyle = wire.value ? '#4ade80' : '#475569';
        ctx.lineWidth = wire.value ? 3 : 1.5;
        ctx.globalAlpha = wire.value ? 1 : 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (wire.value) {
          const t = (Date.now() % 1200) / 1200;
          const px = (1-t)*(1-t)*(1-t)*p1.x + 3*(1-t)*(1-t)*t*midX + 3*(1-t)*t*t*midX + t*t*t*p2.x;
          const py = (1-t)*(1-t)*(1-t)*p1.y + 3*(1-t)*(1-t)*t*p1.y + 3*(1-t)*t*t*p2.y + t*t*t*p2.y;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }
      }

      // Wiring in progress
      if (wiring) {
        const p1 = getNodePos(wiring.fromComp, false, wiring.fromIdx);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        const midX = (p1.x + wiring.mx) / 2;
        ctx.bezierCurveTo(midX, p1.y, midX, wiring.my, wiring.mx, wiring.my);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Components
      for (const comp of comps) {
        const def = GATE_MAP[comp.type] || IO_DEFS[comp.type];
        const isSel = selId === comp.id;
        // OUTPUT gak punya outputs[] (array kosong) — pakai inputs[0] sebagai indikator nyala
        const isOn = comp.type === 'OUTPUT' ? !!comp.inputs[0] : comp.outputs[0];

        // Glow
        if (isSel) {
          ctx.shadowColor = def.color;
          ctx.shadowBlur = 14;
        }

        // Body background
        ctx.fillStyle = '#1e293b';
        roundRect(ctx, comp.x, comp.y, comp.width, comp.height, 8);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = isSel ? def.color : (isOn ? def.color : '#334155');
        ctx.lineWidth = isSel ? 2 : (isOn ? 1.5 : 1);
        roundRect(ctx, comp.x, comp.y, comp.width, comp.height, 8);
        ctx.stroke();

        // ── Gate body (NOT/AND/NAND/OR/NOR/XOR/XNOR) ──
        if (comp.type !== 'INPUT' && comp.type !== 'OUTPUT') {
          // Header bar
          ctx.fillStyle = def.color + '18';
          roundRect(ctx, comp.x + 1, comp.y + 1, comp.width - 2, 14, [7, 7, 0, 0]);
          ctx.fill();

          // Label
          ctx.fillStyle = def.color;
          ctx.font = 'bold 9px "Orbitron", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(def.label, comp.x + comp.width / 2, comp.y + 8);

          // Gate body — model dari "7 Basic Logic Gates" menu (GateDiagram.jsx)
          // CENTER sejati + SCALE UP supaya gate body gak kelihatan kecil di box.
          // Iterasi: 1.5x kegedean → overflow border (XNOR 48*1.5=72, plus back curve
          // extend ke kiri). 1.2x muat dengan margin aman (XNOR 48*1.2=57.6 < 90).
          ctx.save();
          const GATE_SCALE = 1.2;
          const gateDrawW = getGateDrawWidth(comp.type) * GATE_SCALE;
          const gateTranslateX = (comp.width - gateDrawW) / 2;
          // Vertical centering: body area = comp.y+14 to comp.y+56 (42px tall).
          // Gate local y spans 0..25, scaled = 0..30, center at 15.
          // Target center = comp.y + 35 (mid of 14..56). Translate y = 35 - 15 = 20.
          ctx.translate(comp.x + gateTranslateX, comp.y + 20);
          ctx.scale(GATE_SCALE, GATE_SCALE);
          drawGateShape(ctx, comp.type, def.color, isOn, comp.inputs);
          ctx.restore();

          // ── Global input/output wires: PORT → gate internal wire start/end ──
          // User complaint: kabel input/output kependekan, gak nyentuh port.
          // Root cause: gate internal wires (di drawGateShape lokal) cuma dari
          // x=0 ke x=C=5, jadi global x = comp.x+gateTranslateX ke comp.x+gateTranslateX+6.
          // Port ada di comp.x & comp.x+comp.width → gap gede antara port & wire.
          // Fix: tambah global wires dari port ke gate internal wire start (kiri)
          // dan dari gate internal wire end (kanan) ke port output. Karena port y
          // udah di-align sama gate internal wire y (lihat getNodePos), wires ini
          // garis horizontal lurus.
          const wireColor = (v) => v ? def.color : '#475569';
          ctx.lineWidth = 2.2 * GATE_SCALE;
          ctx.lineCap = 'round';
          // Input wires: port (comp.x, port_y) → gate internal wire start (comp.x+gateTranslateX, port_y)
          for (let i = 0; i < comp.inputs.length; i++) {
            const portPos = getNodePos(comp, true, i);
            ctx.beginPath();
            ctx.strokeStyle = wireColor(comp.inputs[i]);
            ctx.moveTo(portPos.x, portPos.y);
            ctx.lineTo(comp.x + gateTranslateX, portPos.y);
            ctx.stroke();
          }
          // Output wire: gate internal wire end (comp.x+gateTranslateX+gateDrawW, out_y) → port (comp.x+comp.width, out_y)
          const outPortPos = getNodePos(comp, false, 0);
          ctx.beginPath();
          ctx.strokeStyle = wireColor(comp.outputs[0]);
          ctx.moveTo(comp.x + gateTranslateX + gateDrawW, outPortPos.y);
          ctx.lineTo(outPortPos.x, outPortPos.y);
          ctx.stroke();
        }

        // ── Switch (INPUT) ──
        // Komponen Switch punya DRAG HANDLE di atas (12px) supaya bisa dipindah
        // tanpa toggle. Klik handle = drag; klik body bawah = toggle ON/OFF.
        if (comp.type === 'INPUT') {
          const handleH = 12;
          // Drag handle bar (top, with grip dots)
          ctx.fillStyle = '#334155';
          roundRect(ctx, comp.x + 1, comp.y + 1, comp.width - 2, handleH, [7, 7, 0, 0]);
          ctx.fill();
          // Grip dots (⠿ pattern) — 6 dots in 2 rows
          ctx.fillStyle = '#94a3b8';
          const dotsX = comp.x + comp.width / 2;
          const dotsY = comp.y + handleH / 2 + 1;
          for (let dy = -2; dy <= 2; dy += 4) {
            for (let dx = -5; dx <= 5; dx += 5) {
              ctx.beginPath();
              ctx.arc(dotsX + dx, dotsY + dy, 0.9, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          // Toggle body (shifted down to make room for handle bar)
          const swX = comp.x + comp.width / 2;
          const swY = comp.y + handleH + (comp.height - handleH) / 2 - 2;
          ctx.fillStyle = comp.outputs[0] ? '#4ade80' : '#475569';
          roundRect(ctx, swX - 18, swY - 8, 36, 16, 8);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(comp.outputs[0] ? swX + 10 : swX - 10, swY, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.fillStyle = comp.outputs[0] ? '#4ade80' : '#64748b';
          ctx.font = 'bold 8px "Orbitron", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(comp.outputs[0] ? 'ON' : 'OFF', swX, swY + 22);
        }

        // ── LED (OUTPUT) ──
        if (comp.type === 'OUTPUT') {
          const ledX = comp.x + comp.width / 2;
          const ledY = comp.y + comp.height / 2 - 4;
          const lit = !!comp.inputs[0];
          if (lit) {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 18;
          }
          ctx.beginPath();
          ctx.arc(ledX, ledY, 11, 0, Math.PI * 2);
          ctx.fillStyle = lit ? '#ef4444' : '#1e293b';
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = lit ? '#fca5a5' : '#475569';
          ctx.lineWidth = 2;
          ctx.stroke();
          if (lit) {
            ctx.beginPath();
            ctx.arc(ledX - 3, ledY - 3, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fill();
          }
          ctx.fillStyle = lit ? '#fca5a5' : '#64748b';
          ctx.font = 'bold 8px "Orbitron", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(lit ? 'ON' : 'OFF', ledX, ledY + 22);
        }

        // Input nodes
        for (let i = 0; i < comp.inputs.length; i++) {
          const p = getNodePos(comp, true, i);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          const hasWire = comp.inputWires[i] !== null;
          ctx.fillStyle = comp.inputs[i] ? '#4ade80' : (hasWire ? '#94a3b8' : '#475569');
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Output nodes
        for (let i = 0; i < comp.outputs.length; i++) {
          const p = getNodePos(comp, false, i);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = comp.outputs[i] ? '#4ade80' : '#94a3b8';
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Hover node
      if (hoverNode) {
        ctx.beginPath();
        ctx.arc(hoverNode.x, hoverNode.y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Selesai world-space drawing — restore ke screen space.
      ctx.restore();

      animId = requestAnimationFrame(draw);
    };

    // getGateDrawWidth — actual draw width per gate type (leftmost = 0 input wire, rightmost = end of output wire)
    // Dipakai supaya gate body CENTER sejati di comp box, bukan left-aligned di area 64 fixed.
    // Konstanta HARUS match drawGateShape: C=5, P=3, wireLen=6, q=25, N=5 → I=q-N=20.
    function getGateDrawWidth(type) {
      const C = 5, P = 3, wireLen = 6;
      const I = 20;        // q - N
      const arcR = I / 2;  // 10
      switch (type) {
        case 'not':   return C + 24 + P * 2 + wireLen;             // 41
        case 'and':   return (C + 12) + arcR + wireLen;            // 33
        case 'nand':  return (C + 10) + arcR + P * 2 + wireLen;    // 37
        case 'or':    return C + 34 + wireLen;                     // 45
        case 'nor':   return C + 31 + P * 2 + wireLen;             // 48
        case 'xor':   return C + 34 + wireLen;                     // 45
        case 'xnor':  return C + 31 + P * 2 + wireLen;             // 48
        default:      return 48;
      }
    }

    // drawGateShape — model di-match dengan GateDiagram.jsx (menu "7 Basic Logic Gates")
    // Coordinate system lokal: origin di kiri-atas area gate, gate di-center vertikal di L.
    // Input wires berwarna sesuai nilai input (color jika true, #475569 jika false).
    // Gate body berwarna sesuai output (color jika true/active, #475569 jika false).
    // Output wire berwarna sesuai output (color jika active, #475569 jika false).
    function drawGateShape(ctx, type, color, active, inputs) {
      const C = 5, N = 5, q = 25, L = 15, I = q - N, P = 3;
      const wireLen = 6;
      const wireColor = (v) => v ? color : '#475569';
      const bodyStroke = active ? color : '#475569';
      const a = inputs?.[0] ?? false;
      const b = inputs?.[1] ?? false;

      ctx.lineWidth = 2.2;  // tebal stroke — match Basic Logic Gates reference (sebelumnya 1.6 terlalu tipis)
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // Input wires (diwarnai sesuai nilai input)
      if (type === 'not') {
        ctx.beginPath();
        ctx.strokeStyle = wireColor(a);
        ctx.moveTo(0, L); ctx.lineTo(C, L);
        ctx.stroke();
      } else {
        // AND/NAND/OR/NOR/XOR/XNOR: 2 input wires
        // XOR/XNOR SPECIAL: input wires STOP AT back curve ')' (x = C-3 = 2), bukan
        // lanjut sampai main body (x = C = 5). Sebelumnya wires nembus back curve
        // → user complaint. Back curve (cubic, control x=C-1=4) at y=N+3 dan y=q-3
        // ada di x ≈ 2.2, jadi wire end di x=2 = tepat menyentuh back curve.
        const isXorType = type === 'xor' || type === 'xnor';
        const inputWireEnd = isXorType ? (C - 3) : C;
        ctx.beginPath();
        ctx.strokeStyle = wireColor(a);
        ctx.moveTo(0, N + 3); ctx.lineTo(inputWireEnd, N + 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = wireColor(b);
        ctx.moveTo(0, q - 3); ctx.lineTo(inputWireEnd, q - 3);
        ctx.stroke();
      }

      ctx.strokeStyle = bodyStroke;
      // Glow effect saat gate aktif — match Basic Logic Gates reference (drop-shadow filter)
      if (active) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
      }
      let outX = C;  // posisi x awal output wire
      switch (type) {
        case 'not': {
          outX = C + 24;
          ctx.beginPath();
          ctx.moveTo(C, N); ctx.lineTo(outX, L); ctx.lineTo(C, q); ctx.closePath();
          ctx.stroke();
          ctx.beginPath(); ctx.arc(outX + P, L, P, 0, Math.PI*2); ctx.stroke();
          outX = outX + P * 2;
          break;
        }
        case 'and': {
          const arcR = I / 2;
          const arcCx = C + 12;
          outX = arcCx + arcR;
          ctx.beginPath();
          ctx.moveTo(C, N); ctx.lineTo(arcCx, N);
          ctx.arc(arcCx, L, arcR, -Math.PI/2, Math.PI/2);
          ctx.lineTo(C, q); ctx.closePath();
          ctx.stroke();
          break;
        }
        case 'nand': {
          const arcR = I / 2;
          const arcCx = C + 10;
          outX = arcCx + arcR;
          ctx.beginPath();
          ctx.moveTo(C, N); ctx.lineTo(arcCx, N);
          ctx.arc(arcCx, L, arcR, -Math.PI/2, Math.PI/2);
          ctx.lineTo(C, q); ctx.closePath();
          ctx.stroke();
          ctx.beginPath(); ctx.arc(outX + P, L, P, 0, Math.PI*2); ctx.stroke();
          outX = outX + P * 2;
          break;
        }
        case 'or': {
          outX = C + 34;
          ctx.beginPath();
          ctx.moveTo(C, N);
          ctx.bezierCurveTo(C+10, N, outX-9, L-8, outX, L);
          ctx.bezierCurveTo(outX-9, L+8, C+10, q, C, q);
          ctx.bezierCurveTo(C+7, L+4, C+7, L-4, C, N);
          ctx.closePath();
          ctx.stroke();
          break;
        }
        case 'nor': {
          outX = C + 31;
          ctx.beginPath();
          ctx.moveTo(C, N);
          ctx.bezierCurveTo(C+10, N, outX-9, L-8, outX, L);
          ctx.bezierCurveTo(outX-9, L+8, C+10, q, C, q);
          ctx.bezierCurveTo(C+7, L+4, C+7, L-4, C, N);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath(); ctx.arc(outX + P, L, P, 0, Math.PI*2); ctx.stroke();
          outX = outX + P * 2;
          break;
        }
        case 'xor': {
          outX = C + 34;
          // Back curve — control points di-shift LEFT (C+1 → C-1) supaya ada GAP
          // kecil antara ')' dan main body. Sebelumnya peak di x≈4.75 (touching
          // main body left edge x=5, gap 0.25px). Sekarang peak di x≈3.25, gap
          // 1.75px = visible. User minta "gap kecil antara ')' dengan yang di
          // depannya".
          ctx.beginPath();
          ctx.moveTo(C - 4, N);
          ctx.bezierCurveTo(C - 1, L - 4, C - 1, L + 4, C - 4, q);
          ctx.stroke();
          // Main body
          ctx.beginPath();
          ctx.moveTo(C, N);
          ctx.bezierCurveTo(C+10, N, outX-9, L-8, outX, L);
          ctx.bezierCurveTo(outX-9, L+8, C+10, q, C, q);
          ctx.bezierCurveTo(C+7, L+4, C+7, L-4, C, N);
          ctx.closePath();
          ctx.stroke();
          break;
        }
        case 'xnor': {
          outX = C + 31;
          // Back curve — same as XOR: control points di-shift LEFT for gap
          ctx.beginPath();
          ctx.moveTo(C - 4, N);
          ctx.bezierCurveTo(C - 1, L - 4, C - 1, L + 4, C - 4, q);
          ctx.stroke();
          // Main body
          ctx.beginPath();
          ctx.moveTo(C, N);
          ctx.bezierCurveTo(C+10, N, outX-9, L-8, outX, L);
          ctx.bezierCurveTo(outX-9, L+8, C+10, q, C, q);
          ctx.bezierCurveTo(C+7, L+4, C+7, L-4, C, N);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath(); ctx.arc(outX + P, L, P, 0, Math.PI*2); ctx.stroke();
          outX = outX + P * 2;
          break;
        }
      }

      // Reset glow sebelum output wire (wire gak pake glow, match GateDiagram.jsx)
      ctx.shadowBlur = 0;

      // Output wire (diwarnai sesuai output)
      ctx.beginPath();
      ctx.strokeStyle = wireColor(active);
      ctx.moveTo(outX, L);
      ctx.lineTo(outX + wireLen, L);
      ctx.stroke();
    }

    function roundRect(ctx, x, y, w, h, r) {
      const rad = typeof r === 'number' ? [r,r,r,r] : r;
      ctx.beginPath();
      ctx.moveTo(x + rad[0], y);
      ctx.lineTo(x + w - rad[1], y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + rad[1]);
      ctx.lineTo(x + w, y + h - rad[2]);
      ctx.quadraticCurveTo(x + w, y + h, x + w - rad[2], y + h);
      ctx.lineTo(x + rad[3], y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - rad[3]);
      ctx.lineTo(x, y + rad[0]);
      ctx.quadraticCurveTo(x, y, x + rad[0], y);
      ctx.closePath();
    }

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [getNodePos]);

  // ── Mouse Events ──
  // Setelah pan/zoom diperkenalkan, SEMUA mx,my dari mouse event WAJIB di-convert
  // ke world coords lewat screenToWorld() sebelum dipakai hitTest/drag/wiring,
  // karena comp.x/comp.y dan getNodePos semuanya di world space.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isPanningTrigger = (e) => {
      // Pan aktif jika: middle mouse button (button=1) ATAU left mouse + space held.
      if (e.button === 1) return true;
      if (e.button === 0 && spaceDownRef.current) return true;
      return false;
    };

    const onMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      // ── Pan mode ──
      if (isPanningTrigger(e)) {
        e.preventDefault();
        const v = stateRef.current.view;
        stateRef.current.panning = {
          startSX: sx, startSY: sy,
          startVX: v.x, startVY: v.y,
        };
        canvas.style.cursor = 'grabbing';
        return;
      }

      // ── Normal mode: convert screen → world, lalu hitTest ──
      const { x: mx, y: my } = screenToWorld(sx, sy);
      const hit = hitTest(mx, my, stateRef.current.components);

      if (hit) {
        if (hit.kind === 'drag-handle') {
          // Switch (INPUT) drag handle — drag comp, JANGAN toggle.
          // User minta: switch punya tombol drag sendiri di atas biar bisa ditarik
          // khusus dia doang (tanpa mengganggu toggle behavior di body bawah).
          setSelectedId(hit.comp.id);
          stateRef.current.dragging = hit.comp;
          stateRef.current.dragOffset = { x: mx - hit.comp.x, y: my - hit.comp.y };
          setStatus('Dragging ' + (IO_DEFS[hit.comp.type]?.name || hit.comp.type));
        } else if (hit.kind === 'output') {
          stateRef.current.wiring = { fromComp: hit.comp, fromIdx: hit.idx, mx, my };
          setStatus('Wiring... click an input node to connect');
        } else if (hit.kind === 'input') {
          if (stateRef.current.wiring) {
            const { fromComp, fromIdx } = stateRef.current.wiring;
            const comps = [...stateRef.current.components];
            const wrs = [...stateRef.current.wires];
            const dst = comps.find(c => c.id === hit.comp.id);

            // Remove existing wire on this input
            const existing = wrs.find(w => w.to === dst.id && w.toIdx === hit.idx);
            if (existing) {
              const idx = wrs.findIndex(w => w.id === existing.id);
              if (idx !== -1) {
                const src2 = comps.find(c => c.id === existing.from);
                if (src2) src2.outputWires[existing.fromIdx] = src2.outputWires[existing.fromIdx].filter(id => id !== existing.id);
                dst.inputWires[existing.toIdx] = null;
                wrs.splice(idx, 1);
              }
            }

            if (!wouldCreateCycle(fromComp.id, dst.id, comps, wrs)) {
              const newWire = {
                id: stateRef.current.nextId,
                from: fromComp.id,
                fromIdx,
                to: dst.id,
                toIdx: hit.idx,
                value: false,
              };
              wrs.push(newWire);
              dst.inputWires[hit.idx] = newWire.id;
              const src = comps.find(c => c.id === fromComp.id);
              if (src) src.outputWires[fromIdx].push(newWire.id);
              setNextId(prev => prev + 1);

              const { comps: newComps, wrs: newWrs } = simulate(comps, wrs);
              setComponents(newComps);
              setWires(newWrs);
              setStatus('Wire connected');
            } else {
              setStatus('Cycle detected — connection rejected');
            }
            stateRef.current.wiring = null;
          }
        } else if (hit.kind === 'body') {
          if (hit.comp.type === 'INPUT') {
            const comps = stateRef.current.components.map(c =>
              c.id === hit.comp.id ? { ...c, outputs: [!c.outputs[0]] } : c
            );
            const { comps: newComps, wrs: newWrs } = simulate(comps, stateRef.current.wires);
            setComponents(newComps);
            setWires(newWrs);
            setStatus(newComps.find(c => c.id === hit.comp.id).outputs[0] ? 'Switch ON' : 'Switch OFF');
          } else {
            setSelectedId(hit.comp.id);
            stateRef.current.dragging = hit.comp;
            stateRef.current.dragOffset = { x: mx - hit.comp.x, y: my - hit.comp.y };
            setStatus('Dragging ' + GATE_MAP[hit.comp.type].name);
          }
        }
      } else {
        setSelectedId(null);
        stateRef.current.wiring = null;
        setStatus('Ready');
      }
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      // ── Pan aktif: update view langsung (draw loop baca stateRef tiap frame) ──
      if (stateRef.current.panning) {
        const p = stateRef.current.panning;
        const v = stateRef.current.view;
        v.x = p.startVX + (sx - p.startSX);
        v.y = p.startVY + (sy - p.startSY);
        return;
      }

      // ── Normal mode: convert ke world coords ──
      const { x: mx, y: my } = screenToWorld(sx, sy);

      // Update coordinate display (world coords di bawah cursor).
      // Throttle: hanya setState kalau coords berubah signifikan (>1px) supaya
      // gak trigger re-render berlebihan tiap pixel mouse bergerak.
      setCursorWorld(prev => {
        if (prev && Math.abs(prev.x - mx) < 1 && Math.abs(prev.y - my) < 1) return prev;
        return { x: Math.round(mx), y: Math.round(my) };
      });

      if (stateRef.current.wiring) {
        stateRef.current.wiring.mx = mx;
        stateRef.current.wiring.my = my;
      }
      if (stateRef.current.dragging) {
        const comp = stateRef.current.dragging;
        comp.x = mx - stateRef.current.dragOffset.x;
        comp.y = my - stateRef.current.dragOffset.y;
        setComponents([...stateRef.current.components]);
      }

      const hit = hitTest(mx, my, stateRef.current.components);
      if (hit && (hit.kind === 'input' || hit.kind === 'output')) {
        stateRef.current.hoverNode = { x: hit.x, y: hit.y };
        canvas.style.cursor = 'pointer';
      } else if (hit && hit.kind === 'drag-handle') {
        stateRef.current.hoverNode = null;
        canvas.style.cursor = 'move';
      } else if (hit && hit.kind === 'body') {
        stateRef.current.hoverNode = null;
        canvas.style.cursor = hit.comp.type === 'INPUT' ? 'pointer' : 'move';
      } else {
        stateRef.current.hoverNode = null;
        canvas.style.cursor = spaceDownRef.current ? 'grab' : (stateRef.current.wiring ? 'crosshair' : 'default');
      }
    };

    const onMouseUp = (e) => {
      // Stop panning (button 1 release atau button 0 release saat panning aktif).
      if (stateRef.current.panning) {
        stateRef.current.panning = null;
        canvas.style.cursor = spaceDownRef.current ? 'grab' : 'default';
        return;
      }
      stateRef.current.dragging = null;
    };

    // Wheel = zoom terhadap cursor. passive:false supaya bisa preventDefault
    // (browser default scroll page kalau gak di-prevent).
    const onWheel = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      // deltaY positif = scroll down = zoom out. Faktor di-tune supaya 1 notch wheel
      // = ~10% zoom (factor 0.9 / 1.1), tidak terlalu jumpy.
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      zoomAt(sx, sy, factor);
    };

    const onContextMenu = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const { x: mx, y: my } = screenToWorld(sx, sy);
      const hit = hitTest(mx, my, stateRef.current.components);

      if (hit && hit.kind === 'body') {
        const comp = hit.comp;
        let wrs = [...stateRef.current.wires];
        let comps = [...stateRef.current.components];

        wrs = wrs.filter(w => {
          if (w.from === comp.id || w.to === comp.id) {
            if (w.to === comp.id) {
              const src = comps.find(c => c.id === w.from);
              if (src) src.outputWires[w.fromIdx] = src.outputWires[w.fromIdx].filter(id => id !== w.id);
            }
            if (w.from === comp.id) {
              const dst = comps.find(c => c.id === w.to);
              if (dst) dst.inputWires[w.toIdx] = null;
            }
            return false;
          }
          return true;
        });
        comps = comps.filter(c => c.id !== comp.id);
        if (selectedId === comp.id) setSelectedId(null);
        setComponents(comps);
        setWires(wrs);
        setStatus('Component removed');
      } else if (hit && (hit.kind === 'input' || hit.kind === 'output')) {
        const comp = hit.comp;
        const isInput = hit.kind === 'input';
        const idx = hit.idx;
        let wrs = [...stateRef.current.wires];
        let comps = [...stateRef.current.components];

        wrs = wrs.filter(w => {
          if ((isInput && w.to === comp.id && w.toIdx === idx) ||
              (!isInput && w.from === comp.id && w.fromIdx === idx)) {
            if (isInput) {
              const src = comps.find(c => c.id === w.from);
              if (src) src.outputWires[w.fromIdx] = src.outputWires[w.fromIdx].filter(id => id !== w.id);
            } else {
              const dst = comps.find(c => c.id === w.to);
              if (dst) dst.inputWires[w.toIdx] = null;
            }
            return false;
          }
          return true;
        });
        if (isInput) {
          const c = comps.find(x => x.id === comp.id);
          if (c) c.inputWires[idx] = null;
        }
        setWires(wrs);
        setComponents(comps);
        setStatus('Wire removed');
      }
    };

    const onKeyDown = (e) => {
      // Space held = pan mode siap (cursor jadi grab). Ignore kalau lagi ngetik
      // di input field (simulator gak punya input field, tapi jaga-jaga).
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        spaceDownRef.current = true;
        if (!stateRef.current.panning) canvas.style.cursor = 'grab';
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null) {
        const comp = stateRef.current.components.find(c => c.id === selectedId);
        if (!comp) return;
        let wrs = [...stateRef.current.wires];
        let comps = [...stateRef.current.components];
        wrs = wrs.filter(w => {
          if (w.from === comp.id || w.to === comp.id) {
            if (w.to === comp.id) {
              const src = comps.find(c => c.id === w.from);
              if (src) src.outputWires[w.fromIdx] = src.outputWires[w.fromIdx].filter(id => id !== w.id);
            }
            if (w.from === comp.id) {
              const dst = comps.find(c => c.id === w.to);
              if (dst) dst.inputWires[w.toIdx] = null;
            }
            return false;
          }
          return true;
        });
        comps = comps.filter(c => c.id !== comp.id);
        setSelectedId(null);
        setComponents(comps);
        setWires(wrs);
        setStatus('Component deleted');
      }
    };

    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        spaceDownRef.current = false;
        if (!stateRef.current.panning) canvas.style.cursor = 'default';
      }
    };

    // Mouseleave canvas = cancel pan biar gak stuck grabbing + clear coord display.
    const onMouseLeave = () => {
      if (stateRef.current.panning) {
        stateRef.current.panning = null;
        canvas.style.cursor = spaceDownRef.current ? 'grab' : 'default';
      }
      setCursorWorld(null);
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [hitTest, simulate, wouldCreateCycle, selectedId, getNodePos, screenToWorld, zoomAt]);

  // ── Resize canvas ──
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = canvas?.parentElement;
    if (!canvas || !wrap) return;
    const resize = () => {
      canvas.width = wrap.clientWidth;
      canvas.height = wrap.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // ── Palette drag ──
  // Bug lama: comp dibuat saat drag > 10px dari start — padahal start ada di palette (sebelah kiri canvas),
  // jadi posisi mouse masih di palette → mx negatif → comp dibuat di luar canvas (gak kelihatan).
  // Fix: comp dibuat saat MOUSEUP, HANYA kalau mouse berada di area canvas.
  // Selama drag, cursor jadi grabbing + ghost component follow cursor supaya user tahu lagi ngedrag apa.
  const [paletteDrag, setPaletteDrag] = useState(null);
  const [dragGhost, setDragGhost] = useState(null);  // { type, x, y } — visual feedback selama drag
  const onPaletteMouseDown = (type) => (e) => {
    e.preventDefault();
    setPaletteDrag({ type, startX: e.clientX, startY: e.clientY, dragging: false });
  };
  useEffect(() => {
    if (!paletteDrag) return;
    const onMove = (e) => {
      const dx = e.clientX - paletteDrag.startX;
      const dy = e.clientY - paletteDrag.startY;
      if (!paletteDrag.dragging && Math.hypot(dx, dy) > 4) {
        setPaletteDrag({ ...paletteDrag, dragging: true });
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }
      // Update ghost position supaya follow cursor — user bisa lihat lagi ngedrag apa
      if (paletteDrag.dragging) {
        setDragGhost({ type: paletteDrag.type, x: e.clientX, y: e.clientY });
      }
    };
    const onUp = (e) => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setDragGhost(null);  // clear ghost
      if (paletteDrag.dragging) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const sx = e.clientX - rect.left;
          const sy = e.clientY - rect.top;
          // Cek apakah mouse di-drop di dalam area canvas (screen space check tetap pakai sx,sy)
          if (sx >= 0 && sx <= rect.width && sy >= 0 && sy <= rect.height) {
            // Convert ke world coords sebelum createComponent — supaya posisi comp
            // benar walau viewport sudah di-pan/zoom.
            const { x: mx, y: my } = screenToWorld(sx, sy);
            // Center comp di posisi drop
            const io = IO_DEFS[paletteDrag.type];
            const compW = io ? io.width : (paletteDrag.type === 'not' ? 80 : 90);
            const compH = io ? io.height : 56;
            const comp = createComponent(paletteDrag.type, mx - compW / 2, my - compH / 2);
            // FIX: jalankan simulate() supaya gates yang output-nya = NOT(0) = 1
            // (yaitu NOT, NAND, NOR, XNOR) LANGSUNG NYALA saat di-drop, sesuai
            // sifat mutlak "not" yang membalik 0 → 1. Sebelumnya simulate() gak
            // dipanggil → outputs tetap [false] → gate body kelihatan grey padahal
            // logically sudah aktif.
            const newComps = [...stateRef.current.components, comp];
            const { comps: simComps, wrs: simWrs } = simulate(newComps, stateRef.current.wires);
            setComponents(simComps);
            setWires(simWrs);
            setNextId(prev => prev + 1);
            setSelectedId(comp.id);
            const label = (GATE_MAP[paletteDrag.type] || IO_DEFS[paletteDrag.type])?.name || paletteDrag.type;
            setStatus(label + ' added');
          } else {
            setStatus('Drop inside canvas to place component');
          }
        }
      }
      setPaletteDrag(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [paletteDrag, createComponent, screenToWorld]);

  // ── Actions ──
  // Buka dialog konfirmasi sebelum benar-benar clear — mencegah hapus tidak sengaja.
  const clearAll = () => {
    setShowClearConfirm(true);
  };

  // Eksekusi penghapusan setelah user konfirmasi "Ya".
  const performClear = () => {
    setComponents([]);
    setWires([]);
    setSelectedId(null);
    setStatus('Canvas cleared');
    setShowClearConfirm(false);
  };

  const cancelClear = () => {
    setShowClearConfirm(false);
    setStatus('Clear dibatalkan');
  };

  const loadDemo = () => {
    setComponents([]);
    setWires([]);
    let id = 1;
    const mk = (type, x, y) => {
      let w = 90, h = 56, inputCount = 2, outputCount = 1;
      if (type === 'not') { w = 80; inputCount = 1; }
      else if (type === 'INPUT' || type === 'OUTPUT') {
        const io = IO_DEFS[type];
        w = io.width; h = io.height; inputCount = io.inputCount; outputCount = io.outputCount;
      }
      const comp = {
        id: id++, type, x, y, width: w, height: h,
        inputs: Array(inputCount).fill(false),
        outputs: Array(outputCount).fill(false),
        inputWires: Array(inputCount).fill(null),
        outputWires: Array(outputCount).fill([]),
      };
      return comp;
    };
    const inA = mk('INPUT', 50, 80);
    const inB = mk('INPUT', 50, 200);
    const xorGate = mk('xor', 220, 90);
    const andGate = mk('and', 220, 210);
    const sumOut = mk('OUTPUT', 400, 90);
    const carryOut = mk('OUTPUT', 400, 210);

    inA.outputs[0] = false;
    inB.outputs[0] = false;

    const w1 = { id: id++, from: inA.id, fromIdx: 0, to: xorGate.id, toIdx: 0, value: false };
    const w2 = { id: id++, from: inB.id, fromIdx: 0, to: xorGate.id, toIdx: 1, value: false };
    const w3 = { id: id++, from: inA.id, fromIdx: 0, to: andGate.id, toIdx: 0, value: false };
    const w4 = { id: id++, from: inB.id, fromIdx: 0, to: andGate.id, toIdx: 1, value: false };
    const w5 = { id: id++, from: xorGate.id, fromIdx: 0, to: sumOut.id, toIdx: 0, value: false };
    const w6 = { id: id++, from: andGate.id, fromIdx: 0, to: carryOut.id, toIdx: 0, value: false };

    xorGate.inputWires[0] = w1.id;
    xorGate.inputWires[1] = w2.id;
    andGate.inputWires[0] = w3.id;
    andGate.inputWires[1] = w4.id;
    sumOut.inputWires[0] = w5.id;
    carryOut.inputWires[0] = w6.id;

    inA.outputWires[0] = [w1.id, w3.id];
    inB.outputWires[0] = [w2.id, w4.id];
    xorGate.outputWires[0] = [w5.id];
    andGate.outputWires[0] = [w6.id];

    const comps = [inA, inB, xorGate, andGate, sumOut, carryOut];
    const wrs = [w1, w2, w3, w4, w5, w6];

    setNextId(id);
    setComponents(comps);
    setWires(wrs);
    setStatus('Half-Adder demo loaded — toggle switches!');
  };

  // ── Styles ──
  const pageStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100vh',
    backgroundColor: '#0f172a',
    fontFamily: '"Inter", sans-serif',
    color: '#e2e8f0',
    overflow: 'hidden',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    // Padding kanan ekstra supaya tombol Clear All & Load Demo gak ketutup
    // userBar fixed (Sign In button ~120px / profile pill+reset+logout ~210px) di pojok kanan atas.
    paddingRight: 240,
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    flexShrink: 0,
  };

  const titleStyle = {
    fontSize: 16,
    fontWeight: 700,
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontFamily: '"Orbitron", sans-serif',
  };

  const bodyStyle = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  };

  const paletteStyle = {
    width: 210,
    backgroundColor: '#1e293b',
    borderRight: '1px solid #334155',
    padding: '14px 10px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flexShrink: 0,
  };

  const paletteTitleStyle = {
    fontSize: 10,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: 6,
    fontFamily: '"Orbitron", sans-serif',
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    cursor: 'grab',
    userSelect: 'none',
    transition: 'all 0.15s',
  };

  const iconBoxStyle = (color) => ({
    width: 44, height: 28,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: color + '15',
    color: color,
    flexShrink: 0,
  });

  const canvasWrapStyle = {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  };

  const btnStyle = {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: '"Inter", sans-serif',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  // Tombol Clear All: merah supaya kelihatan destructive — user minta eksplisit.
  const clearBtnStyle = {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid #dc2626',
    backgroundColor: '#dc2626',
    color: '#fff',
    fontSize: 12,
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  const helpStyle = {
    position: 'absolute',
    top: 10, left: 10,
    fontSize: 11,
    color: '#64748b',
    backgroundColor: 'rgba(15,23,42,0.85)',
    padding: '6px 12px',
    borderRadius: 6,
    pointerEvents: 'none',
    backdropFilter: 'blur(4px)',
    lineHeight: 1.5,
    maxWidth: 380,
    zIndex: 5,
  };

  const statusStyle = {
    position: 'absolute',
    top: 10, right: 10,
    fontSize: 11,
    color: '#64748b',
    backgroundColor: 'rgba(15,23,42,0.85)',
    padding: '4px 12px',
    borderRadius: 6,
    pointerEvents: 'none',
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>
          <button
            onClick={() => setPage && setPage('logic-gates')}
            title="Back to Logic Gates menu"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              border: '1px solid #334155', backgroundColor: '#0f172a',
              color: '#94a3b8', fontSize: 12,
              fontFamily: '"Inter", sans-serif', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#475569'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#334155'; }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <span style={{ color: '#4ade80', fontSize: 18 }}>◉</span>
          Logic Gates Simulator 2D
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={clearBtnStyle}
            onClick={clearAll}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#b91c1c'; e.currentTarget.style.borderColor = '#b91c1c'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.borderColor = '#dc2626'; }}
          >
            Clear All
          </button>
          <button
            style={btnStyle}
            onClick={loadDemo}
            onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#475569'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#334155'; }}
          >
            Load Demo
          </button>
        </div>
      </div>
      <div style={bodyStyle}>
        <div style={paletteStyle}>
          <div style={paletteTitleStyle}>Components</div>
          {GATE_DATA.map(g => (
            <div
              key={g.type}
              style={itemStyle}
              onMouseDown={onPaletteMouseDown(g.type)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = g.color; e.currentTarget.style.backgroundColor = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.backgroundColor = '#0f172a'; }}
            >
              <div style={iconBoxStyle(g.color)}>
                <MiniGateIcon type={g.type} color={g.color} scale={0.55} />
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{g.name}</span>
            </div>
          ))}
          <div style={{ ...paletteTitleStyle, marginTop: 10 }}>I/O</div>
          <div
            style={itemStyle}
            onMouseDown={onPaletteMouseDown('INPUT')}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.backgroundColor = '#0f172a'; }}
          >
            <div style={iconBoxStyle('#f59e0b')}>⚡</div>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Switch</span>
          </div>
          <div
            style={itemStyle}
            onMouseDown={onPaletteMouseDown('OUTPUT')}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.backgroundColor = '#0f172a'; }}
          >
            <div style={iconBoxStyle('#ef4444')}>●</div>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>LED</span>
          </div>
        </div>
        <div style={canvasWrapStyle}>
          <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }} />
          <div style={helpStyle}>
            Drag from palette • Click output → input to wire • Click switch to toggle • Right-click to remove • Del to delete
            <br />
            <span style={{ color: '#94a3b8' }}>Wheel = zoom • Middle-drag or Space+drag = pan</span>
          </div>
          <div style={statusStyle}>{status}</div>
          {/* Zoom + coordinate controls — floating di pojok kiri bawah canvas (Figma/Miro style).
              Bottom-right dilarang karena AIHelperButton (global, fixed bottom:24 right:24) akan nutupin. */}
          <div style={{
            position: 'absolute',
            bottom: 10, left: 10,
            display: 'flex', alignItems: 'center', gap: 0,
            backgroundColor: 'rgba(15,23,42,0.9)',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: 4,
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            fontFamily: '"Inter", sans-serif',
          }}>
            <button
              onClick={() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                const cx = rect.width / 2, cy = rect.height / 2;
                zoomAt(cx, cy, 0.8);
              }}
              title="Zoom Out"
              style={{
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', backgroundColor: 'transparent', color: '#94a3b8',
                cursor: 'pointer', borderRadius: 5, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <ZoomOut size={14} />
            </button>
            <span style={{
              minWidth: 44, textAlign: 'center',
              fontSize: 11, color: '#cbd5e1', fontWeight: 600,
              userSelect: 'none', cursor: 'default',
            }}>
              {zoomPct}%
            </span>
            <button
              onClick={() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                const cx = rect.width / 2, cy = rect.height / 2;
                zoomAt(cx, cy, 1.25);
              }}
              title="Zoom In"
              style={{
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', backgroundColor: 'transparent', color: '#94a3b8',
                cursor: 'pointer', borderRadius: 5, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={resetView}
              title="Reset View (100%)"
              style={{
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', backgroundColor: 'transparent', color: '#94a3b8',
                cursor: 'pointer', borderRadius: 5, transition: 'all 0.15s',
                borderLeft: '1px solid #334155',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Maximize2 size={12} />
            </button>
            {/* Coordinate readout — world X,Y di bawah cursor. Empty saat mouse di luar canvas. */}
            <div style={{
              borderLeft: '1px solid #334155',
              paddingLeft: 10, paddingRight: 8,
              marginLeft: 4,
              minWidth: 96,
              fontSize: 11, color: '#64748b', fontWeight: 500,
              fontVariantNumeric: 'tabular-nums',
              display: 'flex', alignItems: 'center', gap: 6,
              userSelect: 'none',
            }}>
              {cursorWorld ? (
                <>
                  <span style={{ color: '#94a3b8' }}>X</span>
                  <span style={{ color: '#cbd5e1', minWidth: 28, textAlign: 'right' }}>{cursorWorld.x}</span>
                  <span style={{ color: '#94a3b8' }}>Y</span>
                  <span style={{ color: '#cbd5e1', minWidth: 28, textAlign: 'right' }}>{cursorWorld.y}</span>
                </>
              ) : (
                <span style={{ color: '#475569' }}>X — Y —</span>
              )}
            </div>
          </div>
        </div>
      </div>
      {dragGhost && <DragGhost type={dragGhost.type} x={dragGhost.x} y={dragGhost.y} />}

      {showClearConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            fontFamily: '"Inter", sans-serif',
          }}
          onClick={cancelClear}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 14,
              padding: '24px 28px',
              maxWidth: 380,
              width: 'calc(100% - 40px)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              color: '#e2e8f0',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                backgroundColor: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ef4444', fontSize: 20, fontWeight: 700, flexShrink: 0,
              }}>!</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', fontFamily: '"Orbitron", sans-serif' }}>
                Hapus Semua Komponen?
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.55, margin: '0 0 22px 0' }}>
              Kamu yakin mau hapus semua gerbang, switch, LED, dan kabel dari canvas? Aksi ini gak bisa di-undo.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={cancelClear}
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  border: '1px solid #334155', backgroundColor: '#0f172a',
                  color: '#94a3b8', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: '"Inter", sans-serif',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#475569'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#334155'; }}
              >
                Tidak
              </button>
              <button
                onClick={performClear}
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  border: '1px solid #dc2626', backgroundColor: '#dc2626',
                  color: '#fff', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: '"Inter", sans-serif',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#b91c1c'; e.currentTarget.style.borderColor = '#b91c1c'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.borderColor = '#dc2626'; }}
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
