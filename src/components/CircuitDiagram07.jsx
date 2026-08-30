import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram06({ a, b, sum, carry, onToggleA, onToggleB }) {
    // ── Unique colors per input & output (regulasi warna) ──
    const aColor = '#facc15', aRgb = hexToRgbStr(aColor);       // A - kuning
    const bColor = '#38bdf8', bRgb = hexToRgbStr(bColor);       // B - biru langit
    const sumColor = '#4ade80', sumRgb = hexToRgbStr(sumColor); // SUM - hijau
    const carryColor = '#a78bfa', carryRgb = hexToRgbStr(carryColor); // CARRY - ungu

    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;

    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;

    // Input nodes — stacked vertically on the left
    const inputAX = 1, inputAY = 30;
    const inputBX = 1, inputBY = 90;

    // XOR gate (top) — SUM output
    const xorStartX = 110;
    const xorTopY = 22, xorBotY = 50, xorMidY = 36;
    const xorEndX = 165;
    const sumOutX = xorEndX + 34 + outNodeR, sumOutY = xorMidY;

    // AND gate (bottom) — CARRY output
    const andStartX = 110, andW = 26;
    const andTopY = 76, andBotY = 104, andMidY = 90;
    const andArcR = (andBotY - andTopY) / 2;
    const andEndX = andStartX + andW + andArcR;
    const carryOutX = andEndX + 34 + outNodeR, carryOutY = andMidY;

    const svgW = Math.max(sumOutX, carryOutX) + outNodeR + 20, svgH = 130;

    // Junction points for branching wires
    const junctionAX = 75;
    const junctionBX = 85;

    const xorGlow = sum
        ? `drop-shadow(0 0 4px rgba(${sumRgb},0.9)) drop-shadow(0 0 10px rgba(${sumRgb},0.5))`
        : "none";
    const xorFill = sum ? `rgba(${sumRgb},0.13)` : "#0f172a";
    const xorStroke = sum ? sumColor : "#475569";

    const andGlow = carry
        ? `drop-shadow(0 0 4px rgba(${carryRgb},0.9)) drop-shadow(0 0 10px rgba(${carryRgb},0.5))`
        : "none";
    const andFill = carry ? `rgba(${carryRgb},0.13)` : "#0f172a";
    const andStroke = carry ? carryColor : "#475569";

    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        {/* Input A (kuning) */}
        <g onClick={onToggleA} style={{ cursor: "pointer" }}>
            <rect x={inputAX} y={inputAY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={a ? `rgba(${aRgb},0.2)` : `rgba(${aRgb},0.1)`} stroke={a ? aColor : `rgba(${aRgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputAX + 24} y={inputAY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">A</text>
            <circle cx={inputAX + 24} cy={inputAY} r={nodeR} fill={a ? aColor : `rgba(${aRgb},0.15)`} stroke={a ? aColor : `rgba(${aRgb},0.4)`} strokeWidth="1.5" style={{ filter: a ? `drop-shadow(0 0 5px rgba(${aRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputAX + 24} y={inputAY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={a ? aColor : `rgba(${aRgb},0.5)`}>{a ? "1" : "0"}</text>
        </g>

        {/* Input B (biru langit) */}
        <g onClick={onToggleB} style={{ cursor: "pointer" }}>
            <rect x={inputBX} y={inputBY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={b ? `rgba(${bRgb},0.2)` : `rgba(${bRgb},0.1)`} stroke={b ? bColor : `rgba(${bRgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputBX + 24} y={inputBY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">B</text>
            <circle cx={inputBX + 24} cy={inputBY} r={nodeR} fill={b ? bColor : `rgba(${bRgb},0.15)`} stroke={b ? bColor : `rgba(${bRgb},0.4)`} strokeWidth="1.5" style={{ filter: b ? `drop-shadow(0 0 5px rgba(${bRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputBX + 24} y={inputBY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={b ? bColor : `rgba(${bRgb},0.5)`}>{b ? "1" : "0"}</text>
        </g>

        {/* Wire A: input → junction */}
        <path d={`M ${inputAX + inputNodeW},${inputAY} H ${junctionAX}`} fill="none" stroke={wc(a, aColor, aRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* Branch A → XOR top input */}
        <path d={`M ${junctionAX},${inputAY} V ${xorTopY} H ${xorStartX}`} fill="none" stroke={wc(a, aColor, aRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* Branch A → AND top input */}
        <path d={`M ${junctionAX},${inputAY} V ${andTopY} H ${andStartX}`} fill="none" stroke={wc(a, aColor, aRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* Wire B: input → junction */}
        <path d={`M ${inputBX + inputNodeW},${inputBY} H ${junctionBX}`} fill="none" stroke={wc(b, bColor, bRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* Branch B → XOR bottom input */}
        <path d={`M ${junctionBX},${inputBY} V ${xorBotY} H ${xorStartX}`} fill="none" stroke={wc(b, bColor, bRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* Branch B → AND bottom input */}
        <path d={`M ${junctionBX},${inputBY} V ${andBotY} H ${andStartX}`} fill="none" stroke={wc(b, bColor, bRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* XOR gate — glows with SUM color (hijau) */}
        <Fragment>
            <path d={`M ${xorStartX - 9},${xorTopY} C ${xorStartX + 4},${xorMidY - 9} ${xorStartX + 4},${xorMidY + 9} ${xorStartX - 9},${xorBotY}`} fill="none" stroke={xorStroke} strokeWidth="2" style={{ transition: "stroke 0.3s" }} />
            <path d={`M ${xorStartX},${xorTopY} C ${xorStartX + 14},${xorTopY} ${xorEndX - 12},${xorMidY - 6} ${xorEndX},${xorMidY} C ${xorEndX - 12},${xorMidY + 6} ${xorStartX + 14},${xorBotY} ${xorStartX},${xorBotY} C ${xorStartX + 10},${xorMidY + 5} ${xorStartX + 10},${xorMidY - 5} ${xorStartX},${xorTopY} Z`} fill={xorFill} stroke={xorStroke} strokeWidth="2" style={{ filter: xorGlow, transition: "all 0.3s" }} />
        </Fragment>

        {/* AND gate — glows with CARRY color (ungu) */}
        <Fragment>
            <path d={`M ${andStartX},${andTopY} L ${andStartX + andW},${andTopY} A ${andArcR},${andArcR} 0 0,1 ${andStartX + andW},${andBotY} L ${andStartX},${andBotY} Z`} fill={andFill} stroke={andStroke} strokeWidth="2" style={{ filter: andGlow, transition: "all 0.3s" }} />
        </Fragment>

        {/* SUM output wire + node (hijau) */}
        <line x1={xorEndX} y1={xorMidY} x2={sumOutX - outNodeR} y2={sumOutY} stroke={wc(sum, sumColor, sumRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <text x={sumOutX} y={sumOutY - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">SUM</text>
        <circle cx={sumOutX} cy={sumOutY} r={outNodeR} fill={sum ? sumColor : "#1e293b"} stroke={sum ? sumColor : "#334155"} strokeWidth="2" style={{ filter: sum ? `drop-shadow(0 0 8px rgba(${sumRgb},0.9)) drop-shadow(0 0 18px rgba(${sumRgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={sumOutX} y={sumOutY + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={sum ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{sum ? "1" : "0"}</text>

        {/* CARRY output wire + node (ungu) */}
        <line x1={andEndX} y1={andMidY} x2={carryOutX - outNodeR} y2={carryOutY} stroke={wc(carry, carryColor, carryRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <text x={carryOutX} y={carryOutY - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">CARRY</text>
        <circle cx={carryOutX} cy={carryOutY} r={outNodeR} fill={carry ? carryColor : "#1e293b"} stroke={carry ? carryColor : "#334155"} strokeWidth="2" style={{ filter: carry ? `drop-shadow(0 0 8px rgba(${carryRgb},0.9)) drop-shadow(0 0 18px rgba(${carryRgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={carryOutX} y={carryOutY + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={carry ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{carry ? "1" : "0"}</text>
    </svg>;
}
