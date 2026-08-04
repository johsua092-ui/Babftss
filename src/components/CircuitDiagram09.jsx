import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram09({ s, d0, d1, sNot, g1, g2, y, onToggleS, onToggleD0, onToggleD1 }) {
    const notColor = "#f87171", notRgb = hexToRgbStr(notColor);
    const andColor = "#4ade80", andRgb = hexToRgbStr(andColor);
    const orColor = "#a78bfa", orRgb = hexToRgbStr(orColor);
    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;

    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;

    // --- Input positions (left side, 3 nodes vertically) ---
    const inputSX = 1, inputSY = 22;
    const inputD0X = 1, inputD0Y = 72;
    const inputD1X = 1, inputD1Y = 122;

    // --- Junction for S fan-out ---
    const sJX = 72;

    // --- NOT gate (S -> S') ---
    const notSX = 100, notMY = inputSY;
    const notTY = notMY - 14, notBY = notMY + 14;
    const notTriEX = notSX + 28;
    const notBubR = 5, notEX = notTriEX + notBubR * 2;

    // --- AND1 gate (S' AND D0 -> g1) ---
    const and1SX = 210, and1MY = inputD0Y;
    const and1TY = and1MY - 14, and1BY = and1MY + 14;
    const and1W = 26, and1AR = 14;
    const and1EX = and1SX + and1W + and1AR;

    // --- AND2 gate (S AND D1 -> g2) ---
    const and2SX = 210, and2MY = inputD1Y;
    const and2TY = and2MY - 14, and2BY = and2MY + 14;
    const and2W = 26, and2AR = 14;
    const and2EX = and2SX + and2W + and2AR;

    // --- OR gate (g1 OR g2 -> Y) ---
    const orSX = 340, orMY = (and1MY + and2MY) / 2;
    const orTY = orMY - 14, orBY = orMY + 14;
    const orEX = orSX + 45;

    // --- Output node ---
    const outX = orEX + 34 + outNodeR;
    const outY = orMY;
    const svgW = outX + outNodeR + 20;
    const svgH = 150;

    // --- Gate glow/fill/stroke helpers ---
    const mkGlow = (val, rgb) => val
        ? `drop-shadow(0 0 4px rgba(${rgb},0.9)) drop-shadow(0 0 10px rgba(${rgb},0.5))` : "none";
    const mkFill = (val, rgb) => val ? `rgba(${rgb},0.13)` : "#0f172a";
    const mkStroke = (val, col) => val ? col : "#475569";

    const notGlow = mkGlow(sNot, notRgb), notFill = mkFill(sNot, notRgb), notStroke = mkStroke(sNot, notColor);
    const and1Glow = mkGlow(g1, andRgb), and1Fill = mkFill(g1, andRgb), and1Stroke = mkStroke(g1, andColor);
    const and2Glow = mkGlow(g2, andRgb), and2Fill = mkFill(g2, andRgb), and2Stroke = mkStroke(g2, andColor);
    const orGlow = mkGlow(y, orRgb), orFill = mkFill(y, orRgb), orStroke = mkStroke(y, orColor);

    // --- Component helpers ---
    const NotGate = ({ sx, ty, by, my, triEx, bubR, ex, glow, fill, stroke }) => <Fragment>
        <path d={`M ${sx},${ty} L ${triEx},${my} L ${sx},${by} Z`} fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: "all 0.3s" }} />
        <circle cx={triEx + bubR} cy={my} r={bubR} fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: "all 0.3s" }} />
    </Fragment>;

    const AndGate = ({ sx, ty, by, my, w, ar, glow, fill, stroke }) => <path
        d={`M ${sx},${ty} L ${sx + w},${ty} A ${ar},${ar} 0 0,1 ${sx + w},${by} L ${sx},${by} Z`}
        fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: "all 0.3s" }}
    />;

    const OrGate = ({ sx, ty, by, my, ex, glow, fill, stroke }) => <path
        d={`M ${sx},${ty} C ${sx + 14},${ty} ${ex - 12},${my - 6} ${ex},${my} C ${ex - 12},${my + 6} ${sx + 14},${by} ${sx},${by} C ${sx + 10},${my + 5} ${sx + 10},${my - 5} ${sx},${ty} Z`}
        fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: "all 0.3s" }}
    />;

    const InputNode = ({ ix, iy, val, label, onToggle, color, rgb }) => <g onClick={onToggle} style={{ cursor: "pointer" }}>
        <rect x={ix} y={iy - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={val ? `rgba(${rgb},0.2)` : `rgba(${rgb},0.1)`} stroke={val ? color : `rgba(${rgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
        <text x={ix + 24} y={iy - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">{label}</text>
        <circle cx={ix + 24} cy={iy} r={nodeR} fill={val ? color : `rgba(${rgb},0.15)`} stroke={val ? color : `rgba(${rgb},0.4)`} strokeWidth="1.5" style={{ filter: val ? `drop-shadow(0 0 5px rgba(${rgb},0.8))` : "none", transition: "all 0.25s" }} />
        <text x={ix + 24} y={iy + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={val ? color : `rgba(${rgb},0.5)`}>{val ? "1" : "0"}</text>
    </g>;

    const OutputNode = ({ ox, oy, val, label, color, rgb }) => <Fragment>
        <text x={ox} y={oy - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">{label}</text>
        <circle cx={ox} cy={oy} r={outNodeR} fill={val ? color : "#1e293b"} stroke={val ? color : "#334155"} strokeWidth="2" style={{ filter: val ? `drop-shadow(0 0 8px rgba(${rgb},0.9)) drop-shadow(0 0 18px rgba(${rgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={ox} y={oy + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={val ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{val ? "1" : "0"}</text>
    </Fragment>;

    const W = ({ d, val, col, rgb }) => <path d={d} fill="none" stroke={wc(val, col, rgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />;

    // Label color for S': follow NOT color when active, gray when not
    const sPrimeLabelColor = sNot ? notColor : "#475569";

    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        {/* ===== INPUT NODES ===== */}
        <InputNode ix={inputSX} iy={inputSY} val={s} label="S" onToggle={onToggleS} color={notColor} rgb={notRgb} />
        <InputNode ix={inputD0X} iy={inputD0Y} val={d0} label="D0" onToggle={onToggleD0} color={andColor} rgb={andRgb} />
        <InputNode ix={inputD1X} iy={inputD1Y} val={d1} label="D1" onToggle={onToggleD1} color={andColor} rgb={andRgb} />

        {/* ===== WIRE S: horizontal to junction, then fan-out ===== */}
        <W d={`M ${inputSX + inputNodeW},${inputSY} H ${sJX}`} val={s} col={notColor} rgb={notRgb} />
        {/* S branch up -> NOT gate */}
        <W d={`M ${sJX},${inputSY} H ${notSX}`} val={s} col={notColor} rgb={notRgb} />
        {/* S branch down -> AND2 top input (route down then right) */}
        <W d={`M ${sJX},${inputSY} V ${and2TY} H ${and2SX}`} val={s} col={andColor} rgb={andRgb} />
        {/* Junction dot at S fan-out point */}
        <circle cx={sJX} cy={inputSY} r={3} fill={s ? notColor : `rgba(${notRgb},0.25)`} style={{ transition: "fill 0.3s" }} />

        {/* ===== NOT GATE ===== */}
        <NotGate sx={notSX} ty={notTY} by={notBY} my={notMY} triEx={notTriEX} bubR={notBubR} ex={notEX} glow={notGlow} fill={notFill} stroke={notStroke} />

        {/* ===== WIRE S' (NOT output) -> AND1 top input ===== */}
        <W d={`M ${notEX},${notMY} H ${and1SX - 30} V ${and1TY} H ${and1SX}`} val={sNot} col={andColor} rgb={andRgb} />
        {/* Label S' */}
        <text x={(notEX + and1SX - 30) / 2} y={notMY - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="bold" fill={sPrimeLabelColor} style={{ transition: "fill 0.3s" }}>S</text>
        <line x1={(notEX + and1SX - 30) / 2 - 4} y1={notMY - 13} x2={(notEX + and1SX - 30) / 2 + 4} y2={notMY - 13} stroke={sPrimeLabelColor} strokeWidth="1.3" style={{ transition: "stroke 0.3s" }} />

        {/* ===== WIRE D0 -> AND1 bottom input ===== */}
        <W d={`M ${inputD0X + inputNodeW},${inputD0Y} H ${and1SX}`} val={d0} col={andColor} rgb={andRgb} />

        {/* ===== WIRE D1 -> AND2 bottom input ===== */}
        <W d={`M ${inputD1X + inputNodeW},${inputD1Y} H ${and2SX}`} val={d1} col={andColor} rgb={andRgb} />

        {/* ===== AND1 GATE (S' AND D0 -> g1) ===== */}
        <AndGate sx={and1SX} ty={and1TY} by={and1BY} my={and1MY} w={and1W} ar={and1AR} glow={and1Glow} fill={and1Fill} stroke={and1Stroke} />

        {/* ===== AND2 GATE (S AND D1 -> g2) ===== */}
        <AndGate sx={and2SX} ty={and2TY} by={and2BY} my={and2MY} w={and2W} ar={and2AR} glow={and2Glow} fill={and2Fill} stroke={and2Stroke} />

        {/* ===== WIRE g1: AND1 output -> OR top input ===== */}
        <W d={`M ${and1EX},${and1MY} H ${orSX - 20} V ${orTY} H ${orSX}`} val={g1} col={orColor} rgb={orRgb} />
        {/* Label g1 */}
        <text x={(and1EX + orSX - 20) / 2} y={and1MY - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="bold" fill={g1 ? andColor : "#475569"} style={{ transition: "fill 0.3s" }}>g1</text>

        {/* ===== WIRE g2: AND2 output -> OR bottom input ===== */}
        <W d={`M ${and2EX},${and2MY} H ${orSX - 10} V ${orBY} H ${orSX}`} val={g2} col={orColor} rgb={orRgb} />
        {/* Label g2 */}
        <text x={(and2EX + orSX - 10) / 2} y={and2MY - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="bold" fill={g2 ? andColor : "#475569"} style={{ transition: "fill 0.3s" }}>g2</text>

        {/* ===== OR GATE (g1 OR g2 -> Y) ===== */}
        <OrGate sx={orSX} ty={orTY} by={orBY} my={orMY} ex={orEX} glow={orGlow} fill={orFill} stroke={orStroke} />

        {/* ===== OUTPUT WIRE & NODE ===== */}
        <line x1={orEX} y1={orMY} x2={outX - outNodeR} y2={outY} stroke={wc(y, orColor, orRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <OutputNode ox={outX} oy={outY} val={y} label="Y" color={orColor} rgb={orRgb} />
    </svg>;
}
