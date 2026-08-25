import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram02({ a, notA, out, onToggleA }) {
    const notColor = "#f87171";
    const notRgb = hexToRgbStr(notColor);
    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;
    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;
    const midY = 50;
    const inputAX = 1, inputAY = midY;
    // NOT gate 1
    const not1StartX = 90, not1EndX = not1StartX + 54;
    const not1TopY = midY - 22, not1BotY = midY + 22, not1MidY = midY;
    const bubbleR = 5, not1OutX = not1EndX + bubbleR * 2 + 1;
    // NOT gate 2
    const not2StartX = 210, not2EndX = not2StartX + 54;
    const not2TopY = midY - 22, not2BotY = midY + 22, not2MidY = midY;
    const not2OutX = not2EndX + bubbleR * 2 + 1;
    // Output node
    const outX = not2OutX + 30 + outNodeR, outY = midY;
    const svgW = outX + outNodeR + 20, svgH = 100;
    // NOT 1 glow (active when notA = true, i.e. a = false)
    const not1Glow = notA
        ? `drop-shadow(0 0 4px rgba(${notRgb},0.9)) drop-shadow(0 0 10px rgba(${notRgb},0.5))`
        : "none";
    const not1Fill = notA ? `rgba(${notRgb},0.13)` : "#0f172a";
    const not1Stroke = notA ? notColor : "#475569";
    // NOT 2 glow (active when out = true, i.e. a = true)
    const not2Glow = out
        ? `drop-shadow(0 0 4px rgba(${notRgb},0.9)) drop-shadow(0 0 10px rgba(${notRgb},0.5))`
        : "none";
    const not2Fill = out ? `rgba(${notRgb},0.13)` : "#0f172a";
    const not2Stroke = out ? notColor : "#475569";
    // Label color for overline A
    const aPrimeColor = notA ? notColor : "#475569";
    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        {/* Input A node */}
        <g onClick={onToggleA} style={{ cursor: "pointer" }}>
            <rect x={inputAX} y={inputAY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={a ? `rgba(${notRgb},0.2)` : `rgba(${notRgb},0.1)`} stroke={a ? notColor : `rgba(${notRgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputAX + 24} y={inputAY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">A</text>
            <circle cx={inputAX + 24} cy={inputAY} r={nodeR} fill={a ? notColor : `rgba(${notRgb},0.15)`} stroke={a ? notColor : `rgba(${notRgb},0.4)`} strokeWidth="1.5" style={{ filter: a ? `drop-shadow(0 0 5px rgba(${notRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputAX + 24} y={inputAY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={a ? notColor : `rgba(${notRgb},0.5)`}>{a ? "1" : "0"}</text>
        </g>
        {/* Wire: Input A -> NOT gate 1 */}
        <line x1={inputAX + inputNodeW} y1={midY} x2={not1StartX} y2={midY} stroke={wc(a, notColor, notRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        {/* NOT gate 1 */}
        <Fragment>
            <polygon points={`${not1StartX},${not1TopY} ${not1StartX},${not1BotY} ${not1EndX},${not1MidY}`} fill={not1Fill} stroke={not1Stroke} strokeWidth="2" style={{ filter: not1Glow, transition: "all 0.3s" }} />
            <circle cx={not1EndX + bubbleR} cy={not1MidY} r={bubbleR} fill={not1Fill} stroke={not1Stroke} strokeWidth="2" style={{ filter: not1Glow, transition: "all 0.3s" }} />
        </Fragment>
        {/* Wire: NOT 1 -> NOT 2 */}
        <line x1={not1OutX} y1={midY} x2={not2StartX} y2={midY} stroke={wc(notA, notColor, notRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        {/* Label NOT(A) with overline */}
        <text x={(not1OutX + not2StartX) / 2} y={midY - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="bold" fill={aPrimeColor} style={{ transition: "fill 0.3s" }}>A</text>
        <line x1={(not1OutX + not2StartX) / 2 - 4} y1={midY - 17} x2={(not1OutX + not2StartX) / 2 + 4} y2={midY - 17} stroke={aPrimeColor} strokeWidth="1.3" style={{ transition: "stroke 0.3s" }} />
        {/* NOT gate 2 */}
        <Fragment>
            <polygon points={`${not2StartX},${not2TopY} ${not2StartX},${not2BotY} ${not2EndX},${not2MidY}`} fill={not2Fill} stroke={not2Stroke} strokeWidth="2" style={{ filter: not2Glow, transition: "all 0.3s" }} />
            <circle cx={not2EndX + bubbleR} cy={not2MidY} r={bubbleR} fill={not2Fill} stroke={not2Stroke} strokeWidth="2" style={{ filter: not2Glow, transition: "all 0.3s" }} />
        </Fragment>
        {/* Wire: NOT 2 -> OUT */}
        <line x1={not2OutX} y1={midY} x2={outX - outNodeR} y2={outY} stroke={wc(out, notColor, notRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        {/* Output node */}
        <text x={outX} y={outY - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">OUT</text>
        <circle cx={outX} cy={outY} r={outNodeR} fill={out ? notColor : "#1e293b"} stroke={out ? notColor : "#334155"} strokeWidth="2" style={{ filter: out ? `drop-shadow(0 0 8px rgba(${notRgb},0.9)) drop-shadow(0 0 18px rgba(${notRgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={outX} y={outY + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={out ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{out ? "1" : "0"}</text>
    </svg>;
}
