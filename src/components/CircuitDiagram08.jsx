import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram07({ a, b, notB, notA, and1Out, and2Out, out, onToggleA, onToggleB }) {
    const andColor = "#4ade80";
    const notColor = "#f87171";
    const orColor = "#a78bfa";
    const andRgb = hexToRgbStr(andColor);
    const notRgb = hexToRgbStr(notColor);
    const orRgb = hexToRgbStr(orColor);
    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;
    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;

    // Input nodes
    const inputAX = 1, inputAY = 30;
    const inputBX = 1, inputBY = 90;

    // Junctions — where A & B wires branch to both rows
    const junctionAX = 75, junctionBX = 85;

    // Top row: A (top wire) + NOT B -> AND1
    const and1StartX = 195, andW = 26;
    const and1TopY = 30, and1BotY = 46, and1MidY = 38;
    const and1ArcR = (and1BotY - and1TopY) / 2;
    const and1EndX = and1StartX + andW + and1ArcR;

    // Bottom row: NOT A + B (bottom wire) -> AND2
    const and2StartX = 195;
    const and2TopY = 78, and2BotY = 94, and2MidY = 86;
    const and2ArcR = (and2BotY - and2TopY) / 2;
    const and2EndX = and2StartX + andW + and2ArcR;

    // NOT gates — placed just left of each AND gate
    const notW = 30, notHalf = 11, bubbleR = 5;
    const notBStartX = and1StartX - 46, notBEndX = notBStartX + notW;
    const notBOutX = notBEndX + bubbleR * 2 + 1;
    const notAStartX = and2StartX - 46, notAEndX = notAStartX + notW;
    const notAOutX = notAEndX + bubbleR * 2 + 1;

    // OR gate — middle-right, receives both AND outputs
    const orStartX = 290;
    const orTopY = 52, orBotY = 72, orMidY = 62;
    const orEndX = 335;
    const outX = orEndX + 34 + outNodeR, outY = orMidY;

    const svgW = outX + outNodeR + 20, svgH = 120;

    const and1Glow = and1Out
        ? `drop-shadow(0 0 4px rgba(${andRgb},0.9)) drop-shadow(0 0 10px rgba(${andRgb},0.5))`
        : "none";
    const and1Fill = and1Out ? `rgba(${andRgb},0.13)` : "#0f172a";
    const and1Stroke = and1Out ? andColor : "#475569";

    const and2Glow = and2Out
        ? `drop-shadow(0 0 4px rgba(${andRgb},0.9)) drop-shadow(0 0 10px rgba(${andRgb},0.5))`
        : "none";
    const and2Fill = and2Out ? `rgba(${andRgb},0.13)` : "#0f172a";
    const and2Stroke = and2Out ? andColor : "#475569";

    const notBGlow = notB
        ? `drop-shadow(0 0 4px rgba(${notRgb},0.9)) drop-shadow(0 0 10px rgba(${notRgb},0.5))`
        : "none";
    const notBFill = notB ? `rgba(${notRgb},0.13)` : "#0f172a";
    const notBStroke = notB ? notColor : "#475569";

    const notAGlow = notA
        ? `drop-shadow(0 0 4px rgba(${notRgb},0.9)) drop-shadow(0 0 10px rgba(${notRgb},0.5))`
        : "none";
    const notAFill = notA ? `rgba(${notRgb},0.13)` : "#0f172a";
    const notAStroke = notA ? notColor : "#475569";

    const orGlow = out
        ? `drop-shadow(0 0 4px rgba(${orRgb},0.9)) drop-shadow(0 0 10px rgba(${orRgb},0.5))`
        : "none";
    const orFill = out ? `rgba(${orRgb},0.13)` : "#0f172a";
    const orStroke = out ? orColor : "#475569";

    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        {/* Input A */}
        <g onClick={onToggleA} style={{ cursor: "pointer" }}>
            <rect x={inputAX} y={inputAY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={a ? `rgba(${andRgb},0.2)` : `rgba(${andRgb},0.1)`} stroke={a ? andColor : `rgba(${andRgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputAX + 24} y={inputAY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">A</text>
            <circle cx={inputAX + 24} cy={inputAY} r={nodeR} fill={a ? andColor : `rgba(${andRgb},0.15)`} stroke={a ? andColor : `rgba(${andRgb},0.4)`} strokeWidth="1.5" style={{ filter: a ? `drop-shadow(0 0 5px rgba(${andRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputAX + 24} y={inputAY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={a ? andColor : `rgba(${andRgb},0.5)`}>{a ? "1" : "0"}</text>
        </g>
        {/* Input B */}
        <g onClick={onToggleB} style={{ cursor: "pointer" }}>
            <rect x={inputBX} y={inputBY - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={b ? `rgba(${andRgb},0.2)` : `rgba(${andRgb},0.1)`} stroke={b ? andColor : `rgba(${andRgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x={inputBX + 24} y={inputBY - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">B</text>
            <circle cx={inputBX + 24} cy={inputBY} r={nodeR} fill={b ? andColor : `rgba(${andRgb},0.15)`} stroke={b ? andColor : `rgba(${andRgb},0.4)`} strokeWidth="1.5" style={{ filter: b ? `drop-shadow(0 0 5px rgba(${andRgb},0.8))` : "none", transition: "all 0.25s" }} />
            <text x={inputBX + 24} y={inputBY + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={b ? andColor : `rgba(${andRgb},0.5)`}>{b ? "1" : "0"}</text>
        </g>

        {/* Wire A: input -> junction -> branch up (top row, straight) & down (bottom row, via NOT A) */}
        <path d={`M ${inputAX + inputNodeW},${inputAY} H ${junctionAX}`} fill="none" stroke={wc(a, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* Branch A -> AND1 top input (straight, stays at Y=30) */}
        <path d={`M ${junctionAX},${inputAY} H ${and1StartX}`} fill="none" stroke={wc(a, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* Branch A -> NOT A (drop down to bottom row lane Y=78) */}
        <path d={`M ${junctionAX},${inputAY} V ${and2TopY} H ${notAStartX}`} fill="none" stroke={wc(a, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* Wire B: input -> junction -> branch up (top row, via NOT B) & down (bottom row, straight) */}
        <path d={`M ${inputBX + inputNodeW},${inputBY} H ${junctionBX}`} fill="none" stroke={wc(b, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* Branch B -> NOT B (rise up to top row lane Y=46) */}
        <path d={`M ${junctionBX},${inputBY} V ${and1BotY} H ${notBStartX}`} fill="none" stroke={wc(b, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* Branch B -> AND2 bottom input (dip to Y=94, stays in bottom lane) */}
        <path d={`M ${junctionBX},${inputBY} V ${and2BotY} H ${and2StartX}`} fill="none" stroke={wc(b, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* NOT B gate (top row, centered on AND1 bottom input lane Y=46) */}
        <Fragment>
            <polygon points={`${notBStartX},${and1BotY - notHalf} ${notBStartX},${and1BotY + notHalf} ${notBEndX},${and1BotY}`} fill={notBFill} stroke={notBStroke} strokeWidth="2" style={{ filter: notBGlow, transition: "all 0.3s" }} />
            <circle cx={notBEndX + bubbleR} cy={and1BotY} r={bubbleR} fill={notBFill} stroke={notBStroke} strokeWidth="2" style={{ filter: notBGlow, transition: "all 0.3s" }} />
        </Fragment>
        {/* Wire NOT B -> AND1 bottom input */}
        <line x1={notBOutX} y1={and1BotY} x2={and1StartX} y2={and1BotY} stroke={wc(notB, notColor, notRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />

        {/* NOT A gate (bottom row, centered on AND2 top input lane Y=78) */}
        <Fragment>
            <polygon points={`${notAStartX},${and2TopY - notHalf} ${notAStartX},${and2TopY + notHalf} ${notAEndX},${and2TopY}`} fill={notAFill} stroke={notAStroke} strokeWidth="2" style={{ filter: notAGlow, transition: "all 0.3s" }} />
            <circle cx={notAEndX + bubbleR} cy={and2TopY} r={bubbleR} fill={notAFill} stroke={notAStroke} strokeWidth="2" style={{ filter: notAGlow, transition: "all 0.3s" }} />
        </Fragment>
        {/* Wire NOT A -> AND2 top input */}
        <line x1={notAOutX} y1={and2TopY} x2={and2StartX} y2={and2TopY} stroke={wc(notA, notColor, notRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />

        {/* AND1 gate (top row): A AND NOT B */}
        <Fragment>
            <path d={`M ${and1StartX},${and1TopY} L ${and1StartX + andW},${and1TopY} A ${and1ArcR},${and1ArcR} 0 0,1 ${and1StartX + andW},${and1BotY} L ${and1StartX},${and1BotY} Z`} fill={and1Fill} stroke={and1Stroke} strokeWidth="2" style={{ filter: and1Glow, transition: "all 0.3s" }} />
        </Fragment>

        {/* AND2 gate (bottom row): NOT A AND B */}
        <Fragment>
            <path d={`M ${and2StartX},${and2TopY} L ${and2StartX + andW},${and2TopY} A ${and2ArcR},${and2ArcR} 0 0,1 ${and2StartX + andW},${and2BotY} L ${and2StartX},${and2BotY} Z`} fill={and2Fill} stroke={and2Stroke} strokeWidth="2" style={{ filter: and2Glow, transition: "all 0.3s" }} />
        </Fragment>

        {/* Wire AND1 output -> OR top input */}
        <path d={`M ${and1EndX},${and1MidY} H ${orStartX - 18} V ${orTopY} H ${orStartX}`} fill="none" stroke={wc(and1Out, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />
        {/* Wire AND2 output -> OR bottom input */}
        <path d={`M ${and2EndX},${and2MidY} H ${orStartX - 18} V ${orBotY} H ${orStartX}`} fill="none" stroke={wc(and2Out, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />

        {/* OR gate — bezier shape (reuse from GateDiagram.jsx case "or") */}
        <Fragment>
            <path d={`M ${orStartX},${orTopY} C ${orStartX + 14},${orTopY} ${orEndX - 12},${orMidY - 6} ${orEndX},${orMidY} C ${orEndX - 12},${orMidY + 6} ${orStartX + 14},${orBotY} ${orStartX},${orBotY} C ${orStartX + 10},${orMidY + 5} ${orStartX + 10},${orMidY - 5} ${orStartX},${orTopY} Z`} fill={orFill} stroke={orStroke} strokeWidth="2" style={{ filter: orGlow, transition: "all 0.3s" }} />
        </Fragment>

        {/* Output wire + OUT node */}
        <line x1={orEndX} y1={orMidY} x2={outX - outNodeR} y2={outY} stroke={wc(out, orColor, orRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <text x={outX} y={outY - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">OUT</text>
        <circle cx={outX} cy={outY} r={outNodeR} fill={out ? orColor : "#1e293b"} stroke={out ? orColor : "#334155"} strokeWidth="2" style={{ filter: out ? `drop-shadow(0 0 8px rgba(${orRgb},0.9)) drop-shadow(0 0 18px rgba(${orRgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={outX} y={outY + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={out ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{out ? "1" : "0"}</text>
    </svg>;
}
