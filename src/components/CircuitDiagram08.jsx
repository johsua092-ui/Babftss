import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram08({ a, b, cin, s1, c1, sum, c2, cout, onToggleA, onToggleB, onToggleCin }) {
    const xorColor = "#facc15";
    const andColor = "#4ade80";
    const orColor = "#a78bfa";
    const xorRgb = hexToRgbStr(xorColor);
    const andRgb = hexToRgbStr(andColor);
    const orRgb = hexToRgbStr(orColor);
    const wc = (val, col) => val ? col : "#1e293b";

    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;

    // Input nodes
    const inputAX = 1, inputAY = 30;
    const inputBX = 1, inputBY = 70;
    const inputCinX = 1, inputCinY = 145;

    // Half Adder 1 group (top): XOR1 + AND1
    const ha1BoxX = 68, ha1BoxY = 12, ha1BoxW = 120, ha1BoxH = 76;
    const xor1StartX = 80, xor1MidY = 32;
    const xor1TopY = xor1MidY - 12, xor1BotY = xor1MidY + 12;
    const xor1EndX = xor1StartX + 40;
    const and1StartX = 80, and1MidY = 68;
    const and1TopY = and1MidY - 10, and1BotY = and1MidY + 10;
    const and1W = 20, and1ArcR = (and1BotY - and1TopY) / 2;
    const and1EndX = and1StartX + and1W + and1ArcR;

    // Half Adder 2 group (bottom): XOR2 + AND2
    const ha2BoxX = 220, ha2BoxY = 85, ha2BoxW = 120, ha2BoxH = 76;
    const xor2StartX = 232, xor2MidY = 105;
    const xor2TopY = xor2MidY - 12, xor2BotY = xor2MidY + 12;
    const xor2EndX = xor2StartX + 40;
    const and2StartX = 232, and2MidY = 141;
    const and2TopY = and2MidY - 10, and2BotY = and2MidY + 10;
    const and2W = 20, and2ArcR = (and2BotY - and2TopY) / 2;
    const and2EndX = and2StartX + and2W + and2ArcR;

    // OR gate (right): combines C1 + C2
    const orStartX = 380, orMidY = 105;
    const orTopY = orMidY - 12, orBotY = orMidY + 12;
    const orEndX = orStartX + 40;

    // Outputs
    const sumOutX = xor2EndX + 34 + outNodeR, sumOutY = xor2MidY;
    const coutOutX = orEndX + 34 + outNodeR, coutOutY = orMidY;

    const svgW = Math.max(sumOutX, coutOutX) + outNodeR + 20;
    const svgH = 185;

    // Glow helpers
    const xor1Glow = s1 ? `drop-shadow(0 0 4px rgba(${xorRgb},0.9)) drop-shadow(0 0 10px rgba(${xorRgb},0.5))` : "none";
    const xor1Fill = s1 ? `rgba(${xorRgb},0.13)` : "#0f172a";
    const xor1Stroke = s1 ? xorColor : "#475569";
    const and1Glow = c1 ? `drop-shadow(0 0 4px rgba(${andRgb},0.9)) drop-shadow(0 0 10px rgba(${andRgb},0.5))` : "none";
    const and1Fill = c1 ? `rgba(${andRgb},0.13)` : "#0f172a";
    const and1Stroke = c1 ? andColor : "#475569";
    const xor2Glow = sum ? `drop-shadow(0 0 4px rgba(${xorRgb},0.9)) drop-shadow(0 0 10px rgba(${xorRgb},0.5))` : "none";
    const xor2Fill = sum ? `rgba(${xorRgb},0.13)` : "#0f172a";
    const xor2Stroke = sum ? xorColor : "#475569";
    const and2Glow = c2 ? `drop-shadow(0 0 4px rgba(${andRgb},0.9)) drop-shadow(0 0 10px rgba(${andRgb},0.5))` : "none";
    const and2Fill = c2 ? `rgba(${andRgb},0.13)` : "#0f172a";
    const and2Stroke = c2 ? andColor : "#475569";
    const orGlow = cout ? `drop-shadow(0 0 4px rgba(${orRgb},0.9)) drop-shadow(0 0 10px rgba(${orRgb},0.5))` : "none";
    const orFill = cout ? `rgba(${orRgb},0.13)` : "#0f172a";
    const orStroke = cout ? orColor : "#475569";

    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        {/* Input A */}
        <g onClick={onToggleA} style={{ cursor: "pointer" }}>
            <rect x={inputAX} y={inputAY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={a ? `rgba(${xorRgb},0.2)` : "#0f172a"} stroke={a ? xorColor : "#334155"} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputAX + 24} y={inputAY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">A</text>
            <circle cx={inputAX + 24} cy={inputAY} r={nodeR} fill={a ? xorColor : "#1e293b"} stroke={a ? xorColor : "#334155"} strokeWidth="1.5" style={{ filter: a ? `drop-shadow(0 0 5px rgba(${xorRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputAX + 24} y={inputAY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={a ? xorColor : "#475569"}>{a ? "1" : "0"}</text>
        </g>

        {/* Input B */}
        <g onClick={onToggleB} style={{ cursor: "pointer" }}>
            <rect x={inputBX} y={inputBY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={b ? `rgba(${xorRgb},0.2)` : "#0f172a"} stroke={b ? xorColor : "#334155"} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputBX + 24} y={inputBY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">B</text>
            <circle cx={inputBX + 24} cy={inputBY} r={nodeR} fill={b ? xorColor : "#1e293b"} stroke={b ? xorColor : "#334155"} strokeWidth="1.5" style={{ filter: b ? `drop-shadow(0 0 5px rgba(${xorRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputBX + 24} y={inputBY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={b ? xorColor : "#475569"}>{b ? "1" : "0"}</text>
        </g>

        {/* Input Cin */}
        <g onClick={onToggleCin} style={{ cursor: "pointer" }}>
            <rect x={inputCinX} y={inputCinY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={cin ? `rgba(${orRgb},0.2)` : "#0f172a"} stroke={cin ? orColor : "#334155"} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputCinX + 24} y={inputCinY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#64748b">Cin</text>
            <circle cx={inputCinX + 24} cy={inputCinY} r={nodeR} fill={cin ? orColor : "#1e293b"} stroke={cin ? orColor : "#334155"} strokeWidth="1.5" style={{ filter: cin ? `drop-shadow(0 0 5px rgba(${orRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputCinX + 24} y={inputCinY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={cin ? orColor : "#475569"}>{cin ? "1" : "0"}</text>
        </g>

        {/* === WIRES: A & B → HA1 === */}
        {/* A → XOR1 top input */}
        <path d={`M ${inputAX + inputNodeW},${inputAY} H ${xor1StartX - 8} V ${xor1TopY} H ${xor1StartX}`} fill="none" stroke={wc(a, xorColor)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* B → XOR1 bottom input */}
        <path d={`M ${inputBX + inputNodeW},${inputBY} H ${xor1StartX - 8} V ${xor1BotY} H ${xor1StartX}`} fill="none" stroke={wc(b, xorColor)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* A → AND1 top input (branch) */}
        <path d={`M ${inputAX + inputNodeW},${inputAY} H 60 V ${and1TopY} H ${and1StartX}`} fill="none" stroke={wc(a, andColor)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* B → AND1 bottom input (branch) */}
        <path d={`M ${inputBX + inputNodeW},${inputBY} H 56 V ${and1BotY} H ${and1StartX}`} fill="none" stroke={wc(b, andColor)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* === HA1 GROUP BOX === */}
        <rect x={ha1BoxX} y={ha1BoxY} width={ha1BoxW} height={ha1BoxH} rx="8" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
        <text x={ha1BoxX + 4} y={ha1BoxY + 10} fontFamily="Inter,sans-serif" fontSize="7" fill="#64748b" opacity="0.8">Half Adder 1</text>

        {/* XOR1 gate */}
        <Fragment>
            <path d={`M ${xor1StartX - 6},${xor1TopY} C ${xor1StartX + 2},${xor1MidY - 6} ${xor1StartX + 2},${xor1MidY + 6} ${xor1StartX - 6},${xor1BotY}`} fill="none" stroke={xor1Stroke} strokeWidth="1.5" style={{ transition: "stroke 0.3s" }} />
            <path d={`M ${xor1StartX},${xor1TopY} C ${xor1StartX + 10},${xor1TopY} ${xor1EndX - 8},${xor1MidY - 4} ${xor1EndX},${xor1MidY} C ${xor1EndX - 8},${xor1MidY + 4} ${xor1StartX + 10},${xor1BotY} ${xor1StartX},${xor1BotY} C ${xor1StartX + 7},${xor1MidY + 3} ${xor1StartX + 7},${xor1MidY - 3} ${xor1StartX},${xor1TopY} Z`} fill={xor1Fill} stroke={xor1Stroke} strokeWidth="2" style={{ filter: xor1Glow, transition: "all 0.3s" }} />
        </Fragment>

        {/* AND1 gate */}
        <Fragment>
            <path d={`M ${and1StartX},${and1TopY} L ${and1StartX + and1W},${and1TopY} A ${and1ArcR},${and1ArcR} 0 0,1 ${and1StartX + and1W},${and1BotY} L ${and1StartX},${and1BotY} Z`} fill={and1Fill} stroke={and1Stroke} strokeWidth="2" style={{ filter: and1Glow, transition: "all 0.3s" }} />
        </Fragment>

        {/* === WIRES: S1 → HA2, Cin → HA2 === */}
        {/* S1 (XOR1 output) → XOR2 top input */}
        <path d={`M ${xor1EndX},${xor1MidY} H ${ha2BoxX - 10} V ${xor2TopY} H ${xor2StartX}`} fill="none" stroke={wc(s1, xorColor)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* S1 label */}
        <text x={(xor1EndX + ha2BoxX) / 2} y={xor1MidY - 6} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fontWeight="bold" fill={s1 ? xorColor : "#475569"} style={{ transition: "fill 0.3s" }}>S1</text>
        {/* Cin → XOR2 bottom input */}
        <path d={`M ${inputCinX + inputNodeW},${inputCinY} H ${xor2StartX - 12} V ${xor2BotY} H ${xor2StartX}`} fill="none" stroke={wc(cin, orColor)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* S1 → AND2 top input (branch) */}
        <path d={`M ${xor1EndX},${xor1MidY} H ${ha2BoxX - 16} V ${and2TopY} H ${and2StartX}`} fill="none" stroke={wc(s1, andColor)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* Cin → AND2 bottom input (branch) */}
        <path d={`M ${inputCinX + inputNodeW},${inputCinY} H ${and2StartX - 8} V ${and2BotY} H ${and2StartX}`} fill="none" stroke={wc(cin, andColor)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* === HA2 GROUP BOX === */}
        <rect x={ha2BoxX} y={ha2BoxY} width={ha2BoxW} height={ha2BoxH} rx="8" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
        <text x={ha2BoxX + 4} y={ha2BoxY + 10} fontFamily="Inter,sans-serif" fontSize="7" fill="#64748b" opacity="0.8">Half Adder 2</text>

        {/* XOR2 gate */}
        <Fragment>
            <path d={`M ${xor2StartX - 6},${xor2TopY} C ${xor2StartX + 2},${xor2MidY - 6} ${xor2StartX + 2},${xor2MidY + 6} ${xor2StartX - 6},${xor2BotY}`} fill="none" stroke={xor2Stroke} strokeWidth="1.5" style={{ transition: "stroke 0.3s" }} />
            <path d={`M ${xor2StartX},${xor2TopY} C ${xor2StartX + 10},${xor2TopY} ${xor2EndX - 8},${xor2MidY - 4} ${xor2EndX},${xor2MidY} C ${xor2EndX - 8},${xor2MidY + 4} ${xor2StartX + 10},${xor2BotY} ${xor2StartX},${xor2BotY} C ${xor2StartX + 7},${xor2MidY + 3} ${xor2StartX + 7},${xor2MidY - 3} ${xor2StartX},${xor2TopY} Z`} fill={xor2Fill} stroke={xor2Stroke} strokeWidth="2" style={{ filter: xor2Glow, transition: "all 0.3s" }} />
        </Fragment>

        {/* AND2 gate */}
        <Fragment>
            <path d={`M ${and2StartX},${and2TopY} L ${and2StartX + and2W},${and2TopY} A ${and2ArcR},${and2ArcR} 0 0,1 ${and2StartX + and2W},${and2BotY} L ${and2StartX},${and2BotY} Z`} fill={and2Fill} stroke={and2Stroke} strokeWidth="2" style={{ filter: and2Glow, transition: "all 0.3s" }} />
        </Fragment>

        {/* === WIRES: C1 & C2 → OR === */}
        {/* C1 (AND1 output) → OR top input */}
        <path d={`M ${and1EndX},${and1MidY} H ${orStartX - 20} V ${orTopY} H ${orStartX}`} fill="none" stroke={wc(c1, andColor)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* C1 label */}
        <text x={(and1EndX + orStartX) / 2 - 10} y={and1MidY - 6} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fontWeight="bold" fill={c1 ? andColor : "#475569"} style={{ transition: "fill 0.3s" }}>C1</text>
        {/* C2 (AND2 output) → OR bottom input */}
        <path d={`M ${and2EndX},${and2MidY} H ${orStartX - 14} V ${orBotY} H ${orStartX}`} fill="none" stroke={wc(c2, andColor)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* C2 label */}
        <text x={(and2EndX + orStartX) / 2 - 5} y={and2MidY - 6} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fontWeight="bold" fill={c2 ? andColor : "#475569"} style={{ transition: "fill 0.3s" }}>C2</text>

        {/* OR gate */}
        <Fragment>
            <path d={`M ${orStartX},${orTopY} C ${orStartX + 10},${orTopY} ${orEndX - 8},${orMidY - 4} ${orEndX},${orMidY} C ${orEndX - 8},${orMidY + 4} ${orStartX + 10},${orBotY} ${orStartX},${orBotY} C ${orStartX + 7},${orMidY + 3} ${orStartX + 7},${orMidY - 3} ${orStartX},${orTopY} Z`} fill={orFill} stroke={orStroke} strokeWidth="2" style={{ filter: orGlow, transition: "all 0.3s" }} />
        </Fragment>

        {/* === OUTPUTS === */}
        {/* SUM output (from XOR2) */}
        <line x1={xor2EndX} y1={xor2MidY} x2={sumOutX - outNodeR} y2={sumOutY} stroke={wc(sum, xorColor)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <text x={sumOutX} y={sumOutY - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">SUM</text>
        <circle cx={sumOutX} cy={sumOutY} r={outNodeR} fill={sum ? xorColor : "#1e293b"} stroke={sum ? xorColor : "#334155"} strokeWidth="2" style={{ filter: sum ? `drop-shadow(0 0 8px rgba(${xorRgb},0.9)) drop-shadow(0 0 18px rgba(${xorRgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={sumOutX} y={sumOutY + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={sum ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{sum ? "1" : "0"}</text>

        {/* COUT output (from OR) */}
        <line x1={orEndX} y1={orMidY} x2={coutOutX - outNodeR} y2={coutOutY} stroke={wc(cout, orColor)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <text x={coutOutX} y={coutOutY - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="6" fill="#475569" letterSpacing="1">COUT</text>
        <circle cx={coutOutX} cy={coutOutY} r={outNodeR} fill={cout ? orColor : "#1e293b"} stroke={cout ? orColor : "#334155"} strokeWidth="2" style={{ filter: cout ? `drop-shadow(0 0 8px rgba(${orRgb},0.9)) drop-shadow(0 0 18px rgba(${orRgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={coutOutX} y={coutOutY + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={cout ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{cout ? "1" : "0"}</text>
    </svg>;
}
