import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram14({ d, s, sNot, y0, y1, onToggleD, onToggleS }) {
    const notColor = "#f87171", notRgb = hexToRgbStr(notColor);
    const andColor = "#4ade80", andRgb = hexToRgbStr(andColor);
    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;

    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;

    // --- Input positions (left side, 2 nodes vertically) ---
    const inputDX = 1, inputDY = 35;
    const inputSX = 1, inputSY = 120;

    // --- Junction points for fan-out ---
    const dJX = 80;  // D fan-out: branches to AND1 top & AND2 top
    const sJX = 68;  // S fan-out: branches to NOT & AND2 bottom

    // --- NOT gate (S -> S') ---
    const notSX = 100, notMY = inputSY;
    const notTY = notMY - 14, notBY = notMY + 14;
    const notTriEX = notSX + 28;
    const notBubR = 5, notEX = notTriEX + notBubR * 2;

    // --- AND1 gate (D AND S' -> Y0) - top ---
    const and1SX = 220, and1MY = 35;
    const and1TY = and1MY - 14, and1BY = and1MY + 14;
    const and1W = 26, and1AR = 14;
    const and1EX = and1SX + and1W + and1AR;

    // --- AND2 gate (D AND S -> Y1) - bottom ---
    const and2SX = 220, and2MY = 120;
    const and2TY = and2MY - 14, and2BY = and2MY + 14;
    const and2W = 26, and2AR = 14;
    const and2EX = and2SX + and2W + and2AR;

    // --- Output nodes ---
    const y0OutX = and1EX + 34 + outNodeR, y0OutY = and1MY;
    const y1OutX = and2EX + 34 + outNodeR, y1OutY = and2MY;

    const svgW = Math.max(y0OutX, y1OutX) + outNodeR + 20;
    const svgH = 160;

    // --- Gate glow/fill/stroke helpers ---
    const mkGlow = (val, rgb) => val
        ? `drop-shadow(0 0 4px rgba(${rgb},0.9)) drop-shadow(0 0 10px rgba(${rgb},0.5))` : "none";
    const mkFill = (val, rgb) => val ? `rgba(${rgb},0.13)` : "#0f172a";
    const mkStroke = (val, col) => val ? col : "#475569";

    const notGlow = mkGlow(sNot, notRgb), notFill = mkFill(sNot, notRgb), notStroke = mkStroke(sNot, notColor);
    const and1Glow = mkGlow(y0, andRgb), and1Fill = mkFill(y0, andRgb), and1Stroke = mkStroke(y0, andColor);
    const and2Glow = mkGlow(y1, andRgb), and2Fill = mkFill(y1, andRgb), and2Stroke = mkStroke(y1, andColor);

    // --- Component helpers ---
    const NotGate = ({ sx, ty, by, my, triEx, bubR, glow, fill, stroke }) => <Fragment>
        <path d={`M ${sx},${ty} L ${triEx},${my} L ${sx},${by} Z`} fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: "all 0.3s" }} />
        <circle cx={triEx + bubR} cy={my} r={bubR} fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: "all 0.3s" }} />
    </Fragment>;

    const AndGate = ({ sx, ty, by, w, ar, glow, fill, stroke }) => <path
        d={`M ${sx},${ty} L ${sx + w},${ty} A ${ar},${ar} 0 0,1 ${sx + w},${by} L ${sx},${by} Z`}
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

    // S' label color
    const sPrimeLabelColor = sNot ? notColor : "#475569";

    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        {/* ===== INPUT NODES ===== */}
        <InputNode ix={inputDX} iy={inputDY} val={d} label="D" onToggle={onToggleD} color={andColor} rgb={andRgb} />
        <InputNode ix={inputSX} iy={inputSY} val={s} label="S" onToggle={onToggleS} color={notColor} rgb={notRgb} />

        {/* ===== WIRE D: input -> junction -> fan-out ===== */}
        <W d={`M ${inputDX + inputNodeW},${inputDY} H ${dJX}`} val={d} col={andColor} rgb={andRgb} />
        {/* D branch up -> AND1 top input */}
        <W d={`M ${dJX},${inputDY} V ${and1TY} H ${and1SX}`} val={d} col={andColor} rgb={andRgb} />
        {/* D branch down -> AND2 top input */}
        <W d={`M ${dJX},${inputDY} V ${and2TY} H ${and2SX}`} val={d} col={andColor} rgb={andRgb} />
        {/* Junction dot at D fan-out */}
        <circle cx={dJX} cy={inputDY} r={3} fill={d ? andColor : `rgba(${andRgb},0.25)`} style={{ transition: "fill 0.3s" }} />

        {/* ===== WIRE S: input -> junction -> fan-out ===== */}
        <W d={`M ${inputSX + inputNodeW},${inputSY} H ${sJX}`} val={s} col={notColor} rgb={notRgb} />
        {/* S branch -> NOT gate input */}
        <W d={`M ${sJX},${inputSY} H ${notSX}`} val={s} col={notColor} rgb={notRgb} />
        {/* S branch down -> AND2 bottom input */}
        <W d={`M ${sJX},${inputSY} V ${and2BY} H ${and2SX}`} val={s} col={andColor} rgb={andRgb} />
        {/* Junction dot at S fan-out */}
        <circle cx={sJX} cy={inputSY} r={3} fill={s ? notColor : `rgba(${notRgb},0.25)`} style={{ transition: "fill 0.3s" }} />

        {/* ===== NOT GATE ===== */}
        <NotGate sx={notSX} ty={notTY} by={notBY} my={notMY} triEx={notTriEX} bubR={notBubR} glow={notGlow} fill={notFill} stroke={notStroke} />

        {/* ===== WIRE S' (NOT output) -> AND1 bottom input ===== */}
        <W d={`M ${notEX},${notMY} H 160 V ${and1BY} H ${and1SX}`} val={sNot} col={andColor} rgb={andRgb} />
        {/* Label S' with overline */}
        <text x={190} y={and1BY - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="bold" fill={sPrimeLabelColor} style={{ transition: "fill 0.3s" }}>S</text>
        <line x1={186} y1={and1BY - 16} x2={194} y2={and1BY - 16} stroke={sPrimeLabelColor} strokeWidth="1.3" style={{ transition: "stroke 0.3s" }} />

        {/* ===== AND1 GATE (D AND S' -> Y0) ===== */}
        <AndGate sx={and1SX} ty={and1TY} by={and1BY} w={and1W} ar={and1AR} glow={and1Glow} fill={and1Fill} stroke={and1Stroke} />

        {/* ===== AND2 GATE (D AND S -> Y1) ===== */}
        <AndGate sx={and2SX} ty={and2TY} by={and2BY} w={and2W} ar={and2AR} glow={and2Glow} fill={and2Fill} stroke={and2Stroke} />

        {/* ===== OUTPUT Y0 wire & node ===== */}
        <line x1={and1EX} y1={and1MY} x2={y0OutX - outNodeR} y2={y0OutY} stroke={wc(y0, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <OutputNode ox={y0OutX} oy={y0OutY} val={y0} label="Y0" color={andColor} rgb={andRgb} />

        {/* ===== OUTPUT Y1 wire & node ===== */}
        <line x1={and2EX} y1={and2MY} x2={y1OutX - outNodeR} y2={y1OutY} stroke={wc(y1, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <OutputNode ox={y1OutX} oy={y1OutY} val={y1} label="Y1" color={andColor} rgb={andRgb} />
    </svg>;
}
