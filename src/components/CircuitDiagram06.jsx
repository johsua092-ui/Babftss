import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram06({ a, b, c, d, andOut1, andOut2, out, onToggleA, onToggleB, onToggleC, onToggleD }) {
    const andColor = "#4ade80";
    const andRgb = hexToRgbStr(andColor);
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

    const and1Glow = mkGlow(andOut1, andRgb), and1Fill = mkFill(andOut1, andRgb), and1Stroke = mkStroke(andOut1, andColor);
    const and2Glow = mkGlow(andOut2, andRgb), and2Fill = mkFill(andOut2, andRgb), and2Stroke = mkStroke(andOut2, andColor);
    const and3Glow = mkGlow(out, andRgb), and3Fill = mkFill(out, andRgb), and3Stroke = mkStroke(out, andColor);

    const InputNode = ({ ix, iy, val, label, onToggle }) => <g onClick={onToggle} style={{ cursor: "pointer" }}>
        <rect x={ix} y={iy - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={val ? `rgba(${andRgb},0.2)` : `rgba(${andRgb},0.1)`} stroke={val ? andColor : `rgba(${andRgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
        <text x={ix + 24} y={iy - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">{label}</text>
        <circle cx={ix + 24} cy={iy} r={nodeR} fill={val ? andColor : `rgba(${andRgb},0.15)`} stroke={val ? andColor : `rgba(${andRgb},0.4)`} strokeWidth="1.5" style={{ filter: val ? `drop-shadow(0 0 5px rgba(${andRgb},0.8))` : "none", transition: "all 0.25s" }} />
        <text x={ix + 24} y={iy + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={val ? andColor : `rgba(${andRgb},0.5)`}>{val ? "1" : "0"}</text>
    </g>;

    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        {/* ===== INPUT NODES ===== */}
        <InputNode ix={inputAX} iy={inputAY} val={a} label="A" onToggle={onToggleA} />
        <InputNode ix={inputBX} iy={inputBY} val={b} label="B" onToggle={onToggleB} />
        <InputNode ix={inputCX} iy={inputCY} val={c} label="C" onToggle={onToggleC} />
        <InputNode ix={inputDX} iy={inputDY} val={d} label="D" onToggle={onToggleD} />

        {/* ===== WIRES A & B → AND1 ===== */}
        <path d={`M ${inputAX + inputNodeW},${inputAY} H ${and1SX - 14} V ${and1TY} H ${and1SX}`} fill="none" stroke={wc(a, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        <path d={`M ${inputBX + inputNodeW},${inputBY} H ${and1SX - 14} V ${and1BY} H ${and1SX}`} fill="none" stroke={wc(b, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* ===== AND1 GATE ===== */}
        <path d={`M ${and1SX},${and1TY} L ${and1SX + and1W},${and1TY} A ${and1AR},${and1AR} 0 0,1 ${and1SX + and1W},${and1BY} L ${and1SX},${and1BY} Z`} fill={and1Fill} stroke={and1Stroke} strokeWidth="2" style={{ filter: and1Glow, transition: "all 0.3s" }} />

        {/* ===== WIRE: AND1 out → AND2 top ===== */}
        <path d={`M ${and1EX},${and1MY} H ${and2SX - 20} V ${and2TY} H ${and2SX}`} fill="none" stroke={wc(andOut1, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        <text x={(and1EX + and2SX - 20) / 2 + 8} y={and1MY - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="bold" fill={andOut1 ? andColor : "#475569"} style={{ transition: "fill 0.3s" }}>A · B</text>

        {/* ===== WIRE C → AND2 bottom ===== */}
        <path d={`M ${inputCX + inputNodeW},${inputCY} H ${and2SX - 20} V ${and2BY} H ${and2SX}`} fill="none" stroke={wc(c, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* ===== AND2 GATE ===== */}
        <path d={`M ${and2SX},${and2TY} L ${and2SX + and2W},${and2TY} A ${and2AR},${and2AR} 0 0,1 ${and2SX + and2W},${and2BY} L ${and2SX},${and2BY} Z`} fill={and2Fill} stroke={and2Stroke} strokeWidth="2" style={{ filter: and2Glow, transition: "all 0.3s" }} />

        {/* ===== WIRE: AND2 out → AND3 top ===== */}
        <path d={`M ${and2EX},${and2MY} H ${and3SX - 20} V ${and3TY} H ${and3SX}`} fill="none" stroke={wc(andOut2, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* ===== WIRE D → AND3 bottom ===== */}
        <path d={`M ${inputDX + inputNodeW},${inputDY} H ${and3SX - 20} V ${and3BY} H ${and3SX}`} fill="none" stroke={wc(d, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* ===== AND3 GATE ===== */}
        <path d={`M ${and3SX},${and3TY} L ${and3SX + and3W},${and3TY} A ${and3AR},${and3AR} 0 0,1 ${and3SX + and3W},${and3BY} L ${and3SX},${and3BY} Z`} fill={and3Fill} stroke={and3Stroke} strokeWidth="2" style={{ filter: and3Glow, transition: "all 0.3s" }} />

        {/* ===== OUTPUT WIRE & NODE ===== */}
        <line x1={and3EX} y1={and3MY} x2={outX - outNodeR} y2={outY} stroke={wc(out, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <text x={outX} y={outY - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">OUT</text>
        <circle cx={outX} cy={outY} r={outNodeR} fill={out ? andColor : "#1e293b"} stroke={out ? andColor : "#334155"} strokeWidth="2" style={{ filter: out ? `drop-shadow(0 0 8px rgba(${andRgb},0.9)) drop-shadow(0 0 18px rgba(${andRgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={outX} y={outY + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={out ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{out ? "1" : "0"}</text>
    </svg>;
}