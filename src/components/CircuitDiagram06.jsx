import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram06({ a, b, sum, carry, onToggleA, onToggleB }) {
    const xorColor = "#facc15";
    const andColor = "#4ade80";
    const xorRgb = hexToRgbStr(xorColor);
    const andRgb = hexToRgbStr(andColor);
    const wc = (val, col) => val ? col : "#1e293b";

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
    const junctionAX = 75; // where A wire branches
    const junctionBX = 85; // where B wire branches

    const xorGlow = sum
        ? `drop-shadow(0 0 4px rgba(${xorRgb},0.9)) drop-shadow(0 0 10px rgba(${xorRgb},0.5))`
        : "none";
    const xorFill = sum ? `rgba(${xorRgb},0.13)` : "#0f172a";
    const xorStroke = sum ? xorColor : "#475569";

    const andGlow = carry
        ? `drop-shadow(0 0 4px rgba(${andRgb},0.9)) drop-shadow(0 0 10px rgba(${andRgb},0.5))`
        : "none";
    const andFill = carry ? `rgba(${andRgb},0.13)` : "#0f172a";
    const andStroke = carry ? andColor : "#475569";

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

        {/* Wire A: from input A → junction → branch to XOR top input & AND top input */}
        <path d={`M ${inputAX + inputNodeW},${inputAY} H ${junctionAX}`} fill="none" stroke={wc(a, xorColor)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* Branch A → XOR (top) */}
        <path d={`M ${junctionAX},${inputAY} V ${xorTopY} H ${xorStartX}`} fill="none" stroke={wc(a, xorColor)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* Branch A → AND (bottom) */}
        <path d={`M ${junctionAX},${inputAY} V ${andTopY} H ${andStartX}`} fill="none" stroke={wc(a, andColor)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* Wire B: from input B → junction → branch to XOR bottom input & AND bottom input */}
        <path d={`M ${inputBX + inputNodeW},${inputBY} H ${junctionBX}`} fill="none" stroke={wc(b, xorColor)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* Branch B → XOR (top) */}
        <path d={`M ${junctionBX},${inputBY} V ${xorBotY} H ${xorStartX}`} fill="none" stroke={wc(b, xorColor)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* Branch B → AND (bottom) */}
        <path d={`M ${junctionBX},${inputBY} V ${andBotY} H ${andStartX}`} fill="none" stroke={wc(b, andColor)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* XOR gate — bezier shape with back curve (reuse from GateDiagram.jsx case "xor") */}
        <Fragment>
            {/* Back curve (the extra XOR tail) */}
            <path d={`M ${xorStartX - 9},${xorTopY} C ${xorStartX + 4},${xorMidY - 9} ${xorStartX + 4},${xorMidY + 9} ${xorStartX - 9},${xorBotY}`} fill="none" stroke={xorStroke} strokeWidth="2" style={{ transition: "stroke 0.3s" }} />
            {/* Main XOR body */}
            <path d={`M ${xorStartX},${xorTopY} C ${xorStartX + 14},${xorTopY} ${xorEndX - 12},${xorMidY - 6} ${xorEndX},${xorMidY} C ${xorEndX - 12},${xorMidY + 6} ${xorStartX + 14},${xorBotY} ${xorStartX},${xorBotY} C ${xorStartX + 10},${xorMidY + 5} ${xorStartX + 10},${xorMidY - 5} ${xorStartX},${xorTopY} Z`} fill={xorFill} stroke={xorStroke} strokeWidth="2" style={{ filter: xorGlow, transition: "all 0.3s" }} />
        </Fragment>

        {/* AND gate — D-shape (reuse from GateDiagram.jsx case "and") */}
        <Fragment>
            <path d={`M ${andStartX},${andTopY} L ${andStartX + andW},${andTopY} A ${andArcR},${andArcR} 0 0,1 ${andStartX + andW},${andBotY} L ${andStartX},${andBotY} Z`} fill={andFill} stroke={andStroke} strokeWidth="2" style={{ filter: andGlow, transition: "all 0.3s" }} />
        </Fragment>

        {/* SUM output wire + node */}
        <line x1={xorEndX} y1={xorMidY} x2={sumOutX - outNodeR} y2={sumOutY} stroke={wc(sum, xorColor)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <text x={sumOutX} y={sumOutY - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">SUM</text>
        <circle cx={sumOutX} cy={sumOutY} r={outNodeR} fill={sum ? xorColor : "#1e293b"} stroke={sum ? xorColor : "#334155"} strokeWidth="2" style={{ filter: sum ? `drop-shadow(0 0 8px rgba(${xorRgb},0.9)) drop-shadow(0 0 18px rgba(${xorRgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={sumOutX} y={sumOutY + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={sum ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{sum ? "1" : "0"}</text>

        {/* CARRY output wire + node */}
        <line x1={andEndX} y1={andMidY} x2={carryOutX - outNodeR} y2={carryOutY} stroke={wc(carry, andColor)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <text x={carryOutX} y={carryOutY - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">CARRY</text>
        <circle cx={carryOutX} cy={carryOutY} r={outNodeR} fill={carry ? andColor : "#1e293b"} stroke={carry ? andColor : "#334155"} strokeWidth="2" style={{ filter: carry ? `drop-shadow(0 0 8px rgba(${andRgb},0.9)) drop-shadow(0 0 18px rgba(${andRgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={carryOutX} y={carryOutY + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={carry ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{carry ? "1" : "0"}</text>
    </svg>;
}
