import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram04({ a, b, orOut, out, onToggleA, onToggleB }) {
    const orColor = "#a78bfa";
    const notColor = "#f87171";
    const orRgb = hexToRgbStr(orColor);
    const notRgb = hexToRgbStr(notColor);
    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;
    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;
    const inputAX = 1, inputAY = 28;
    const inputBX = 1, inputBY = 76;
    const orStartX = 100;
    const orTopY = 38, orBotY = 66, orMidY = 52;
    const orEndX = 145;
    const notStartX = 210, notEndX = notStartX + 54;
    const notTopY = orMidY - 22, notBotY = orMidY + 22, notMidY = orMidY;
    const bubbleR = 5, notOutX = notEndX + bubbleR * 2 + 1;
    const outX = notOutX + 34 + outNodeR, outY = orMidY;
    const svgW = outX + outNodeR + 20, svgH = 100;
    const orGlow = orOut
        ? `drop-shadow(0 0 4px rgba(${orRgb},0.9)) drop-shadow(0 0 10px rgba(${orRgb},0.5))`
        : "none";
    const orFill = orOut ? `rgba(${orRgb},0.13)` : "#0f172a";
    const orStroke = orOut ? orColor : "#475569";
    const notGlow = out
        ? `drop-shadow(0 0 4px rgba(${notRgb},0.9)) drop-shadow(0 0 10px rgba(${notRgb},0.5))`
        : "none";
    const notFill = out ? `rgba(${notRgb},0.13)` : "#0f172a";
    const notStroke = out ? notColor : "#475569";
    const abLabelColor = orOut ? orColor : "#475569";
    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        <g onClick={onToggleA} style={{ cursor: "pointer" }}>
            <rect x={inputAX} y={inputAY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={a ? `rgba(${orRgb},0.2)` : `rgba(${orRgb},0.1)`} stroke={a ? orColor : `rgba(${orRgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputAX + 24} y={inputAY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">A</text>
            <circle cx={inputAX + 24} cy={inputAY} r={nodeR} fill={a ? orColor : `rgba(${orRgb},0.15)`} stroke={a ? orColor : `rgba(${orRgb},0.4)`} strokeWidth="1.5" style={{ filter: a ? `drop-shadow(0 0 5px rgba(${orRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputAX + 24} y={inputAY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={a ? orColor : `rgba(${orRgb},0.5)`}>{a ? "1" : "0"}</text>
        </g>
        <g onClick={onToggleB} style={{ cursor: "pointer" }}>
            <rect x={inputBX} y={inputBY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={b ? `rgba(${orRgb},0.2)` : `rgba(${orRgb},0.1)`} stroke={b ? orColor : `rgba(${orRgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputBX + 24} y={inputBY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">B</text>
            <circle cx={inputBX + 24} cy={inputBY} r={nodeR} fill={b ? orColor : `rgba(${orRgb},0.15)`} stroke={b ? orColor : `rgba(${orRgb},0.4)`} strokeWidth="1.5" style={{ filter: b ? `drop-shadow(0 0 5px rgba(${orRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputBX + 24} y={inputBY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={b ? orColor : `rgba(${orRgb},0.5)`}>{b ? "1" : "0"}</text>
        </g>
        <path d={`M ${inputAX + inputNodeW},${inputAY} H ${orStartX - 14} V ${orTopY} H ${orStartX}`} fill="none" stroke={wc(a, orColor, orRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        <path d={`M ${inputBX + inputNodeW},${inputBY} H ${orStartX - 14} V ${orBotY} H ${orStartX}`} fill="none" stroke={wc(b, orColor, orRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        <Fragment>
            <path d={`M ${orStartX},${orTopY} C ${orStartX + 14},${orTopY} ${orEndX - 12},${orMidY - 6} ${orEndX},${orMidY} C ${orEndX - 12},${orMidY + 6} ${orStartX + 14},${orBotY} ${orStartX},${orBotY} C ${orStartX + 10},${orMidY + 5} ${orStartX + 10},${orMidY - 5} ${orStartX},${orTopY} Z`} fill={orFill} stroke={orStroke} strokeWidth="2" style={{ filter: orGlow, transition: "all 0.3s" }} />
        </Fragment>
        <line x1={orEndX} y1={orMidY} x2={notStartX} y2={notMidY} stroke={wc(orOut, orColor, orRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <text x={(orEndX + notStartX) / 2} y={orMidY - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="bold" fill={abLabelColor} style={{ transition: "fill 0.3s" }}>A + B</text>
        <Fragment>
            <polygon points={`${notStartX},${notTopY} ${notStartX},${notBotY} ${notEndX},${notMidY}`} fill={notFill} stroke={notStroke} strokeWidth="2" style={{ filter: notGlow, transition: "all 0.3s" }} />
            <circle cx={notEndX + bubbleR} cy={notMidY} r={bubbleR} fill={notFill} stroke={notStroke} strokeWidth="2" style={{ filter: notGlow, transition: "all 0.3s" }} />
        </Fragment>
        <line x1={notOutX} y1={notMidY} x2={outX - outNodeR} y2={outY} stroke={wc(out, notColor, notRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <text x={outX} y={outY - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">OUT</text>
        <circle cx={outX} cy={outY} r={outNodeR} fill={out ? notColor : "#1e293b"} stroke={out ? notColor : "#334155"} strokeWidth="2" style={{ filter: out ? `drop-shadow(0 0 8px rgba(${notRgb},0.9)) drop-shadow(0 0 18px rgba(${notRgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={outX} y={outY + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={out ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{out ? "1" : "0"}</text>
    </svg>;
}
