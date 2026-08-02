import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram03({ a, b, andOut, out, onToggleA, onToggleB }) {
    const andColor = "#4ade80";
    const notColor = "#f87171";
    const andRgb = hexToRgbStr(andColor);
    const notRgb = hexToRgbStr(notColor);
    const wc = (val, col) => val ? col : "#1e293b";
    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;
    const inputAX = 1, inputAY = 28;
    const inputBX = 1, inputBY = 76;
    const andStartX = 100, andW = 26;
    const andTopY = 38, andBotY = 66, andMidY = 52;
    const andArcR = (andBotY - andTopY) / 2;
    const andEndX = andStartX + andW + andArcR;
    const notStartX = 210, notEndX = notStartX + 54;
    const notTopY = andMidY - 22, notBotY = andMidY + 22, notMidY = andMidY;
    const bubbleR = 5, notOutX = notEndX + bubbleR * 2 + 1;
    const outX = notOutX + 34 + outNodeR, outY = andMidY;
    const svgW = outX + outNodeR + 20, svgH = 100;
    const andGlow = andOut
        ? `drop-shadow(0 0 4px rgba(${andRgb},0.9)) drop-shadow(0 0 10px rgba(${andRgb},0.5))`
        : "none";
    const andFill = andOut ? `rgba(${andRgb},0.13)` : "#0f172a";
    const andStroke = andOut ? andColor : "#475569";
    const notGlow = out
        ? `drop-shadow(0 0 4px rgba(${notRgb},0.9)) drop-shadow(0 0 10px rgba(${notRgb},0.5))`
        : "none";
    const notFill = out ? `rgba(${notRgb},0.13)` : "#0f172a";
    const notStroke = out ? notColor : "#475569";
    const abLabelColor = andOut ? andColor : "#475569";
    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        <g onClick={onToggleA} style={{ cursor: "pointer" }}>
            <rect x={inputAX} y={inputAY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={a ? `rgba(${andRgb},0.2)` : "#0f172a"} stroke={a ? andColor : "#334155"} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputAX + 24} y={inputAY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">A</text>
            <circle cx={inputAX + 24} cy={inputAY} r={nodeR} fill={a ? andColor : "#1e293b"} stroke={a ? andColor : "#334155"} strokeWidth="1.5" style={{ filter: a ? `drop-shadow(0 0 5px rgba(${andRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputAX + 24} y={inputAY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={a ? andColor : "#475569"}>{a ? "1" : "0"}</text>
        </g>
        <g onClick={onToggleB} style={{ cursor: "pointer" }}>
            <rect x={inputBX} y={inputBY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={b ? `rgba(${andRgb},0.2)` : "#0f172a"} stroke={b ? andColor : "#334155"} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputBX + 24} y={inputBY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">B</text>
            <circle cx={inputBX + 24} cy={inputBY} r={nodeR} fill={b ? andColor : "#1e293b"} stroke={b ? andColor : "#334155"} strokeWidth="1.5" style={{ filter: b ? `drop-shadow(0 0 5px rgba(${andRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputBX + 24} y={inputBY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={b ? andColor : "#475569"}>{b ? "1" : "0"}</text>
        </g>
        <path d={`M ${inputAX + inputNodeW},${inputAY} H ${andStartX - 14} V ${andTopY} H ${andStartX}`} fill="none" stroke={wc(a, andColor)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        <path d={`M ${inputBX + inputNodeW},${inputBY} H ${andStartX - 14} V ${andBotY} H ${andStartX}`} fill="none" stroke={wc(b, andColor)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        <Fragment>
            <path d={`M ${andStartX},${andTopY} L ${andStartX + andW},${andTopY} A ${andArcR},${andArcR} 0 0,1 ${andStartX + andW},${andBotY} L ${andStartX},${andBotY} Z`} fill={andFill} stroke={andStroke} strokeWidth="2" style={{ filter: andGlow, transition: "all 0.3s" }} />
        </Fragment>
        <line x1={andEndX} y1={andMidY} x2={notStartX} y2={notMidY} stroke={wc(andOut, andColor)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <text x={(andEndX + notStartX) / 2} y={andMidY - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="bold" fill={abLabelColor} style={{ transition: "fill 0.3s" }}>A · B</text>
        <Fragment>
            <polygon points={`${notStartX},${notTopY} ${notStartX},${notBotY} ${notEndX},${notMidY}`} fill={notFill} stroke={notStroke} strokeWidth="2" style={{ filter: notGlow, transition: "all 0.3s" }} />
            <circle cx={notEndX + bubbleR} cy={notMidY} r={bubbleR} fill={notFill} stroke={notStroke} strokeWidth="2" style={{ filter: notGlow, transition: "all 0.3s" }} />
        </Fragment>
        <line x1={notOutX} y1={notMidY} x2={outX - outNodeR} y2={outY} stroke={wc(out, notColor)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <text x={outX} y={outY - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">OUT</text>
        <circle cx={outX} cy={outY} r={outNodeR} fill={out ? notColor : "#1e293b"} stroke={out ? notColor : "#334155"} strokeWidth="2" style={{ filter: out ? `drop-shadow(0 0 8px rgba(${notRgb},0.9)) drop-shadow(0 0 18px rgba(${notRgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={outX} y={outY + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={out ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{out ? "1" : "0"}</text>
    </svg>;
}
