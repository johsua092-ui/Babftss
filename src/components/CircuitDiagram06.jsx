import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram06({ a, b, c, d, andOut1, andOut2, out, onToggleA, onToggleB, onToggleC, onToggleD }) {
    // ── Unique colors per signal (regulasi warna) ──
    const aCol = '#facc15', aRgb = hexToRgbStr(aCol);           // A - kuning
    const bCol = '#38bdf8', bRgb = hexToRgbStr(bCol);           // B - biru langit
    const cCol = '#f87171', cRgb = hexToRgbStr(cCol);           // C - merah
    const dCol = '#22d3ee', dRgb = hexToRgbStr(dCol);           // D - cyan
    const andOut1Col = '#a78bfa', andOut1Rgb = hexToRgbStr(andOut1Col); // A·B - ungu
    const andOut2Col = '#fb923c', andOut2Rgb = hexToRgbStr(andOut2Col); // (A·B)·C - oranye
    const outCol = '#4ade80', outRgb = hexToRgbStr(outCol);     // OUT (A·B·C·D) - hijau

    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;
    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;

    // --- Inputs ---
    const inputAX = 1, inputAY = 22;
    const inputBX = 1, inputBY = 68;
    const inputCX = 1, inputCY = 114;
    const inputDX = 1, inputDY = 160;

    // --- AND1: A AND B ---
    const and1SX = 100, and1W = 26;
    const and1TY = 36, and1BY = 54, and1MY = 45;
    const and1AR = (and1BY - and1TY) / 2;
    const and1EX = and1SX + and1W + and1AR;

    // --- AND2: (A·B) AND C ---
    const and2SX = 185, and2W = 26;
    const and2TY = 70, and2BY = 88, and2MY = 79;
    const and2AR = (and2BY - and2TY) / 2;
    const and2EX = and2SX + and2W + and2AR;

    // --- AND3: ((A·B)·C) AND D ---
    const and3SX = 270, and3W = 26;
    const and3TY = 118, and3BY = 136, and3MY = 127;
    const and3AR = (and3BY - and3TY) / 2;
    const and3EX = and3SX + and3W + and3AR;

    // --- Output ---
    const outX = and3EX + 34 + outNodeR, outY = and3MY;
    const svgW = outX + outNodeR + 20, svgH = 190;

    const mkGlow = (val, rgb) => val
        ? `drop-shadow(0 0 4px rgba(${rgb},0.9)) drop-shadow(0 0 10px rgba(${rgb},0.5))` : "none";
    const mkFill = (val, rgb) => val ? `rgba(${rgb},0.13)` : "#0f172a";
    const mkStroke = (val, col) => val ? col : "#475569";

    const and1Glow = mkGlow(andOut1, andOut1Rgb), and1Fill = mkFill(andOut1, andOut1Rgb), and1Stroke = mkStroke(andOut1, andOut1Col);
    const and2Glow = mkGlow(andOut2, andOut2Rgb), and2Fill = mkFill(andOut2, andOut2Rgb), and2Stroke = mkStroke(andOut2, andOut2Col);
    const and3Glow = mkGlow(out, outRgb), and3Fill = mkFill(out, outRgb), and3Stroke = mkStroke(out, outCol);

    const InputNode = ({ ix, iy, val, label, onToggle, color, rgb }) => <g onClick={onToggle} style={{ cursor: "pointer" }}>
        <rect x={ix} y={iy - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={val ? `rgba(${rgb},0.2)` : `rgba(${rgb},0.1)`} stroke={val ? color : `rgba(${rgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
        <text x={ix + 24} y={iy - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">{label}</text>
        <circle cx={ix + 24} cy={iy} r={nodeR} fill={val ? color : `rgba(${rgb},0.15)`} stroke={val ? color : `rgba(${rgb},0.4)`} strokeWidth="1.5" style={{ filter: val ? `drop-shadow(0 0 5px rgba(${rgb},0.8))` : "none", transition: "all 0.25s" }} />
        <text x={ix + 24} y={iy + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={val ? color : `rgba(${rgb},0.5)`}>{val ? "1" : "0"}</text>
    </g>;

    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        {/* ===== INPUT NODES ===== */}
        <InputNode ix={inputAX} iy={inputAY} val={a} label="A" onToggle={onToggleA} color={aCol} rgb={aRgb} />
        <InputNode ix={inputBX} iy={inputBY} val={b} label="B" onToggle={onToggleB} color={bCol} rgb={bRgb} />
        <InputNode ix={inputCX} iy={inputCY} val={c} label="C" onToggle={onToggleC} color={cCol} rgb={cRgb} />
        <InputNode ix={inputDX} iy={inputDY} val={d} label="D" onToggle={onToggleD} color={dCol} rgb={dRgb} />

        {/* ===== WIRES A & B → AND1 ===== */}
        <path d={`M ${inputAX + inputNodeW},${inputAY} H ${and1SX - 14} V ${and1TY} H ${and1SX}`} fill="none" stroke={wc(a, aCol, aRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        <path d={`M ${inputBX + inputNodeW},${inputBY} H ${and1SX - 14} V ${and1BY} H ${and1SX}`} fill="none" stroke={wc(b, bCol, bRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* ===== AND1 GATE ===== */}
        <path d={`M ${and1SX},${and1TY} L ${and1SX + and1W},${and1TY} A ${and1AR},${and1AR} 0 0,1 ${and1SX + and1W},${and1BY} L ${and1SX},${and1BY} Z`} fill={and1Fill} stroke={and1Stroke} strokeWidth="2" style={{ filter: and1Glow, transition: "all 0.3s" }} />

        {/* ===== WIRE: AND1 out → AND2 top ===== */}
        <path d={`M ${and1EX},${and1MY} H ${and2SX - 20} V ${and2TY} H ${and2SX}`} fill="none" stroke={wc(andOut1, andOut1Col, andOut1Rgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        <text x={(and1EX + and2SX - 20) / 2 + 8} y={and1MY - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="bold" fill={andOut1 ? andOut1Col : "#475569"} style={{ transition: "fill 0.3s" }}>A · B</text>

        {/* ===== WIRE C → AND2 bottom ===== */}
        <path d={`M ${inputCX + inputNodeW},${inputCY} H ${and2SX - 20} V ${and2BY} H ${and2SX}`} fill="none" stroke={wc(c, cCol, cRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* ===== AND2 GATE ===== */}
        <path d={`M ${and2SX},${and2TY} L ${and2SX + and2W},${and2TY} A ${and2AR},${and2AR} 0 0,1 ${and2SX + and2W},${and2BY} L ${and2SX},${and2BY} Z`} fill={and2Fill} stroke={and2Stroke} strokeWidth="2" style={{ filter: and2Glow, transition: "all 0.3s" }} />

        {/* ===== WIRE: AND2 out → AND3 top ===== */}
        <path d={`M ${and2EX},${and2MY} H ${and3SX - 20} V ${and3TY} H ${and3SX}`} fill="none" stroke={wc(andOut2, andOut2Col, andOut2Rgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* ===== WIRE D → AND3 bottom ===== */}
        <path d={`M ${inputDX + inputNodeW},${inputDY} H ${and3SX - 20} V ${and3BY} H ${and3SX}`} fill="none" stroke={wc(d, dCol, dRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* ===== AND3 GATE ===== */}
        <path d={`M ${and3SX},${and3TY} L ${and3SX + and3W},${and3TY} A ${and3AR},${and3AR} 0 0,1 ${and3SX + and3W},${and3BY} L ${and3SX},${and3BY} Z`} fill={and3Fill} stroke={and3Stroke} strokeWidth="2" style={{ filter: and3Glow, transition: "all 0.3s" }} />

        {/* ===== OUTPUT WIRE & NODE ===== */}
        <line x1={and3EX} y1={and3MY} x2={outX - outNodeR} y2={outY} stroke={wc(out, outCol, outRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <text x={outX} y={outY - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">OUT</text>
        <circle cx={outX} cy={outY} r={outNodeR} fill={out ? outCol : "#1e293b"} stroke={out ? outCol : "#334155"} strokeWidth="2" style={{ filter: out ? `drop-shadow(0 0 8px rgba(${outRgb},0.9)) drop-shadow(0 0 18px rgba(${outRgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={outX} y={outY + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={out ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{out ? "1" : "0"}</text>
    </svg>;
}