import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram05({ a, b, c, andOut, out, onToggleA, onToggleB, onToggleC }) {
    const andColor = "#4ade80";
    const andRgb = hexToRgbStr(andColor);
    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;
    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;
    const inputAX = 1, inputAY = 22;
    const inputBX = 1, inputBY = 70;
    const inputCX = 1, inputCY = 118;
    const and1StartX = 100, and1W = 26;
    const and1TopY = 34, and1BotY = 58, and1MidY = 46;
    const and1ArcR = (and1BotY - and1TopY) / 2;
    const and1EndX = and1StartX + and1W + and1ArcR;
    const and2StartX = 190, and2W = 26;
    const and2TopY = 72, and2BotY = 92, and2MidY = 82;
    const and2ArcR = (and2BotY - and2TopY) / 2;
    const and2EndX = and2StartX + and2W + and2ArcR;
    const outX = and2EndX + 34 + outNodeR, outY = and2MidY;
    const svgW = outX + outNodeR + 20, svgH = 148;
    const mkGlow = (val, rgb) => val
        ? `drop-shadow(0 0 4px rgba(${rgb},0.9)) drop-shadow(0 0 10px rgba(${rgb},0.5))` : "none";
    const mkFill = (val, rgb) => val ? `rgba(${rgb},0.13)` : "#0f172a";
    const mkStroke = (val, col) => val ? col : "#475569";
    const and1Glow = mkGlow(andOut, andRgb), and1Fill = mkFill(andOut, andRgb), and1Stroke = mkStroke(andOut, andColor);
    const and2Glow = mkGlow(out, andRgb), and2Fill = mkFill(out, andRgb), and2Stroke = mkStroke(out, andColor);
    const and1LabelColor = andOut ? andColor : "#475569";
    const and2LabelColor = out ? andColor : "#475569";
    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        {/* ===== INPUT NODES ===== */}
        <g onClick={onToggleA} style={{ cursor: "pointer" }}>
            <rect x={inputAX} y={inputAY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={a ? `rgba(${andRgb},0.2)` : `rgba(${andRgb},0.1)`} stroke={a ? andColor : `rgba(${andRgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputAX + 24} y={inputAY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">A</text>
            <circle cx={inputAX + 24} cy={inputAY} r={nodeR} fill={a ? andColor : `rgba(${andRgb},0.15)`} stroke={a ? andColor : `rgba(${andRgb},0.4)`} strokeWidth="1.5" style={{ filter: a ? `drop-shadow(0 0 5px rgba(${andRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputAX + 24} y={inputAY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={a ? andColor : `rgba(${andRgb},0.5)`}>{a ? "1" : "0"}</text>
        </g>
        <g onClick={onToggleB} style={{ cursor: "pointer" }}>
            <rect x={inputBX} y={inputBY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={b ? `rgba(${andRgb},0.2)` : `rgba(${andRgb},0.1)`} stroke={b ? andColor : `rgba(${andRgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputBX + 24} y={inputBY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">B</text>
            <circle cx={inputBX + 24} cy={inputBY} r={nodeR} fill={b ? andColor : `rgba(${andRgb},0.15)`} stroke={b ? andColor : `rgba(${andRgb},0.4)`} strokeWidth="1.5" style={{ filter: b ? `drop-shadow(0 0 5px rgba(${andRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputBX + 24} y={inputBY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={b ? andColor : `rgba(${andRgb},0.5)`}>{b ? "1" : "0"}</text>
        </g>
        <g onClick={onToggleC} style={{ cursor: "pointer" }}>
            <rect x={inputCX} y={inputCY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={c ? `rgba(${andRgb},0.2)` : `rgba(${andRgb},0.1)`} stroke={c ? andColor : `rgba(${andRgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputCX + 24} y={inputCY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">C</text>
            <circle cx={inputCX + 24} cy={inputCY} r={nodeR} fill={c ? andColor : `rgba(${andRgb},0.15)`} stroke={c ? andColor : `rgba(${andRgb},0.4)`} strokeWidth="1.5" style={{ filter: c ? `drop-shadow(0 0 5px rgba(${andRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputCX + 24} y={inputCY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={c ? andColor : `rgba(${andRgb},0.5)`}>{c ? "1" : "0"}</text>
        </g>

        {/* ===== WIRES A & B → AND1 ===== */}
        <path d={`M ${inputAX + inputNodeW},${inputAY} H ${and1StartX - 14} V ${and1TopY} H ${and1StartX}`} fill="none" stroke={wc(a, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        <path d={`M ${inputBX + inputNodeW},${inputBY} H ${and1StartX - 14} V ${and1BotY} H ${and1StartX}`} fill="none" stroke={wc(b, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* ===== AND1 GATE ===== */}
        <path d={`M ${and1StartX},${and1TopY} L ${and1StartX + and1W},${and1TopY} A ${and1ArcR},${and1ArcR} 0 0,1 ${and1StartX + and1W},${and1BotY} L ${and1StartX},${and1BotY} Z`} fill={and1Fill} stroke={and1Stroke} strokeWidth="2" style={{ filter: and1Glow, transition: "all 0.3s" }} />

        {/* ===== WIRE: AND1 out → AND2 top ===== */}
        <path d={`M ${and1EndX},${and1MidY} H ${and2StartX - 20} V ${and2TopY} H ${and2StartX}`} fill="none" stroke={wc(andOut, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        <text x={(and1EndX + and2StartX - 20) / 2 + 8} y={and1MidY - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="bold" fill={and1LabelColor} style={{ transition: "fill 0.3s" }}>A · B</text>

        {/* ===== WIRE C → AND2 bottom ===== */}
        <path d={`M ${inputCX + inputNodeW},${inputCY} H ${and2StartX - 20} V ${and2BotY} H ${and2StartX}`} fill="none" stroke={wc(c, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* ===== AND2 GATE ===== */}
        <path d={`M ${and2StartX},${and2TopY} L ${and2StartX + and2W},${and2TopY} A ${and2ArcR},${and2ArcR} 0 0,1 ${and2StartX + and2W},${and2BotY} L ${and2StartX},${and2BotY} Z`} fill={and2Fill} stroke={and2Stroke} strokeWidth="2" style={{ filter: and2Glow, transition: "all 0.3s" }} />

        {/* ===== OUTPUT WIRE & NODE ===== */}
        <line x1={and2EndX} y1={and2MidY} x2={outX - outNodeR} y2={outY} stroke={wc(out, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <text x={outX} y={outY - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">OUT</text>
        <circle cx={outX} cy={outY} r={outNodeR} fill={out ? andColor : "#1e293b"} stroke={out ? andColor : "#334155"} strokeWidth="2" style={{ filter: out ? `drop-shadow(0 0 8px rgba(${andRgb},0.9)) drop-shadow(0 0 18px rgba(${andRgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={outX} y={outY + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={out ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{out ? "1" : "0"}</text>
    </svg>;
}
