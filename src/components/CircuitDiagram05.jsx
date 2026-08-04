import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram05({ a, b, c, andOut, out, onToggleA, onToggleB, onToggleC }) {
    const andColor = "#4ade80";
    const orColor = "#a78bfa";
    const andRgb = hexToRgbStr(andColor);
    const orRgb = hexToRgbStr(orColor);
    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;
    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;
    const inputAX = 1, inputAY = 20;
    const inputBX = 1, inputBY = 52;
    const inputCX = 1, inputCY = 84;
    const andStartX = 100, andW = 26;
    const andTopY = 28, andBotY = 44, andMidY = 36;
    const andArcR = (andBotY - andTopY) / 2;
    const andEndX = andStartX + andW + andArcR;
    const orStartX = 190;
    const orTopY = 60, orBotY = 76, orMidY = 68;
    const orEndX = 235;
    const outX = orEndX + 34 + outNodeR, outY = orMidY;
    const svgW = outX + outNodeR + 20, svgH = 110;
    const andGlow = andOut
        ? `drop-shadow(0 0 4px rgba(${andRgb},0.9)) drop-shadow(0 0 10px rgba(${andRgb},0.5))`
        : "none";
    const andFill = andOut ? `rgba(${andRgb},0.13)` : "#0f172a";
    const andStroke = andOut ? andColor : "#475569";
    const orGlow = out
        ? `drop-shadow(0 0 4px rgba(${orRgb},0.9)) drop-shadow(0 0 10px rgba(${orRgb},0.5))`
        : "none";
    const orFill = out ? `rgba(${orRgb},0.13)` : "#0f172a";
    const orStroke = out ? orColor : "#475569";
    const andLabelColor = andOut ? andColor : "#475569";
    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
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
            <rect x={inputCX} y={inputCY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={c ? `rgba(${orRgb},0.2)` : `rgba(${orRgb},0.1)`} stroke={c ? orColor : `rgba(${orRgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputCX + 24} y={inputCY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">C</text>
            <circle cx={inputCX + 24} cy={inputCY} r={nodeR} fill={c ? orColor : `rgba(${orRgb},0.15)`} stroke={c ? orColor : `rgba(${orRgb},0.4)`} strokeWidth="1.5" style={{ filter: c ? `drop-shadow(0 0 5px rgba(${orRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputCX + 24} y={inputCY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={c ? orColor : `rgba(${orRgb},0.5)`}>{c ? "1" : "0"}</text>
        </g>
        <path d={`M ${inputAX + inputNodeW},${inputAY} H ${andStartX - 14} V ${andTopY} H ${andStartX}`} fill="none" stroke={wc(a, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        <path d={`M ${inputBX + inputNodeW},${inputBY} H ${andStartX - 14} V ${andBotY} H ${andStartX}`} fill="none" stroke={wc(b, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        <path d={`M ${inputCX + inputNodeW},${inputCY} H ${orStartX}`} fill="none" stroke={wc(c, orColor, orRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        <Fragment>
            <path d={`M ${andStartX},${andTopY} L ${andStartX + andW},${andTopY} A ${andArcR},${andArcR} 0 0,1 ${andStartX + andW},${andBotY} L ${andStartX},${andBotY} Z`} fill={andFill} stroke={andStroke} strokeWidth="2" style={{ filter: andGlow, transition: "all 0.3s" }} />
        </Fragment>
        <path d={`M ${andEndX},${andMidY} H ${orStartX - 20} V ${orTopY} H ${orStartX}`} fill="none" stroke={wc(andOut, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        <text x={(andEndX + orStartX - 20) / 2 + 8} y={andMidY - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="bold" fill={andLabelColor} style={{ transition: "fill 0.3s" }}>A · B</text>
        <Fragment>
            <path d={`M ${orStartX},${orTopY} C ${orStartX + 14},${orTopY} ${orEndX - 12},${orMidY - 6} ${orEndX},${orMidY} C ${orEndX - 12},${orMidY + 6} ${orStartX + 14},${orBotY} ${orStartX},${orBotY} C ${orStartX + 10},${orMidY + 5} ${orStartX + 10},${orMidY - 5} ${orStartX},${orTopY} Z`} fill={orFill} stroke={orStroke} strokeWidth="2" style={{ filter: orGlow, transition: "all 0.3s" }} />
        </Fragment>
        <line x1={orEndX} y1={orMidY} x2={outX - outNodeR} y2={outY} stroke={wc(out, orColor, orRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <text x={outX} y={outY - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">OUT</text>
        <circle cx={outX} cy={outY} r={outNodeR} fill={out ? orColor : "#1e293b"} stroke={out ? orColor : "#334155"} strokeWidth="2" style={{ filter: out ? `drop-shadow(0 0 8px rgba(${orRgb},0.9)) drop-shadow(0 0 18px rgba(${orRgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={outX} y={outY + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={out ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{out ? "1" : "0"}</text>
    </svg>;
}
