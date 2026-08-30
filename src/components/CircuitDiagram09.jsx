import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram08({ a, b, cin, s1, c1, sum, c2, cout, onToggleA, onToggleB, onToggleCin }) {
    // ── Unique colors per input, output & internal signal (regulasi warna) ──
    const aCol = '#facc15', aRgb = hexToRgbStr(aCol);           // A - kuning
    const bCol = '#38bdf8', bRgb = hexToRgbStr(bCol);           // B - biru langit
    const cinCol = '#a78bfa', cinRgb = hexToRgbStr(cinCol);     // Cin - ungu
    const s1Col = '#fb923c', s1Rgb = hexToRgbStr(s1Col);       // s1 - oranye (internal)
    const c1Col = '#22d3ee', c1Rgb = hexToRgbStr(c1Col);       // c1 - cyan (internal)
    const c2Col = '#fb7185', c2Rgb = hexToRgbStr(c2Col);       // c2 - rose (internal)
    const sumCol = '#4ade80', sumRgb = hexToRgbStr(sumCol);     // SUM - hijau
    const coutCol = '#e879f9', coutRgb = hexToRgbStr(coutCol); // COUT - fuchsia

    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;

    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;

    // --- Inputs (left side) ---
    const inputAX = 1, inputAY = 40;
    const inputBX = 1, inputBY = 120;
    const inputCinX = 1, inputCinY = 210;

    // --- Junction points for fan-out ---
    const jA = 68, jB = 78;
    const s1JX = 185, cinJX = 160;
    const cRouteX = 330;

    // --- Stage 1: XOR1 (s1 = A XOR B) ---
    const xor1SX = 110, xor1MY = 75;
    const xor1TY = xor1MY - 14, xor1BY = xor1MY + 14;
    const xor1EX = xor1SX + 55;

    // --- Stage 1: AND1 (c1 = A AND B) ---
    const and1SX = 110, and1MY = 120;
    const and1TY = and1MY - 14, and1BY = and1MY + 14;
    const and1W = 26, and1AR = 14;
    const and1EX = and1SX + and1W + and1AR;

    // --- Stage 2: XOR2 (SUM = s1 XOR Cin) ---
    const xor2SX = 250, xor2MY = 130;
    const xor2TY = xor2MY - 14, xor2BY = xor2MY + 14;
    const xor2EX = xor2SX + 55;

    // --- Stage 2: AND2 (c2 = s1 AND Cin) ---
    const and2SX = 250, and2MY = 210;
    const and2TY = and2MY - 14, and2BY = and2MY + 14;
    const and2EX = and2SX + and1W + and1AR;

    // --- Stage 3: OR (COUT = c1 OR c2) ---
    const orSX = 365, orMY = 196;
    const orTY = orMY - 14, orBY = orMY + 14;
    const orEX = orSX + 45;

    // --- Output nodes ---
    const coutOutX = orEX + 34 + outNodeR;
    const coutOutY = orMY;
    const sumOutX = coutOutX;
    const sumOutY = xor2MY;
    const svgW = Math.max(sumOutX, coutOutX) + outNodeR + 20;
    const svgH = 255;

    // --- Gate glow/fill/stroke (each gate uses its output signal color) ---
    const mkGlow = (val, rgb) => val
        ? `drop-shadow(0 0 4px rgba(${rgb},0.9)) drop-shadow(0 0 10px rgba(${rgb},0.5))` : "none";
    const mkFill = (val, rgb) => val ? `rgba(${rgb},0.13)` : "#0f172a";
    const mkStroke = (val, col) => val ? col : "#475569";

    const xor1Glow = mkGlow(s1, s1Rgb), xor1Fill = mkFill(s1, s1Rgb), xor1Stroke = mkStroke(s1, s1Col);
    const and1Glow = mkGlow(c1, c1Rgb), and1Fill = mkFill(c1, c1Rgb), and1Stroke = mkStroke(c1, c1Col);
    const xor2Glow = mkGlow(sum, sumRgb), xor2Fill = mkFill(sum, sumRgb), xor2Stroke = mkStroke(sum, sumCol);
    const and2Glow = mkGlow(c2, c2Rgb), and2Fill = mkFill(c2, c2Rgb), and2Stroke = mkStroke(c2, c2Col);
    const orGlow = mkGlow(cout, coutRgb), orFill = mkFill(cout, coutRgb), orStroke = mkStroke(cout, coutCol);

    // Helper: render XOR gate shape (with back curve)
    const XorGate = ({ sx, ty, by, my, ex, glow, fill, stroke }) => <Fragment>
        <path d={`M ${sx - 9},${ty} C ${sx + 4},${my - 9} ${sx + 4},${my + 9} ${sx - 9},${by}`} fill="none" stroke={stroke} strokeWidth="2" style={{ transition: "stroke 0.3s" }} />
        <path d={`M ${sx},${ty} C ${sx + 14},${ty} ${ex - 12},${my - 6} ${ex},${my} C ${ex - 12},${my + 6} ${sx + 14},${by} ${sx},${by} C ${sx + 10},${my + 5} ${sx + 10},${my - 5} ${sx},${ty} Z`} fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: "all 0.3s" }} />
    </Fragment>;

    // Helper: render AND gate shape (D-shape)
    const AndGate = ({ sx, ty, by, my, w, ar, glow, fill, stroke }) => <path
        d={`M ${sx},${ty} L ${sx + w},${ty} A ${ar},${ar} 0 0,1 ${sx + w},${by} L ${sx},${by} Z`}
        fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: "all 0.3s" }}
    />;

    // Helper: render OR gate shape (curved, no back curve)
    const OrGate = ({ sx, ty, by, my, ex, glow, fill, stroke }) => <path
        d={`M ${sx},${ty} C ${sx + 14},${ty} ${ex - 12},${my - 6} ${ex},${my} C ${ex - 12},${my + 6} ${sx + 14},${by} ${sx},${by} C ${sx + 10},${my + 5} ${sx + 10},${my - 5} ${sx},${ty} Z`}
        fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: "all 0.3s" }}
    />;

    // Helper: input node
    const InputNode = ({ ix, iy, val, label, onToggle, color, rgb }) => <g onClick={onToggle} style={{ cursor: "pointer" }}>
        <rect x={ix} y={iy - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={val ? `rgba(${rgb},0.2)` : `rgba(${rgb},0.1)`} stroke={val ? color : `rgba(${rgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
        <text x={ix + 24} y={iy - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">{label}</text>
        <circle cx={ix + 24} cy={iy} r={nodeR} fill={val ? color : `rgba(${rgb},0.15)`} stroke={val ? color : `rgba(${rgb},0.4)`} strokeWidth="1.5" style={{ filter: val ? `drop-shadow(0 0 5px rgba(${rgb},0.8))` : "none", transition: "all 0.25s" }} />
        <text x={ix + 24} y={iy + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={val ? color : `rgba(${rgb},0.5)`}>{val ? "1" : "0"}</text>
    </g>;

    // Helper: output node
    const OutputNode = ({ ox, oy, val, label, color, rgb }) => <Fragment>
        <text x={ox} y={oy - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">{label}</text>
        <circle cx={ox} cy={oy} r={outNodeR} fill={val ? color : "#1e293b"} stroke={val ? color : "#334155"} strokeWidth="2" style={{ filter: val ? `drop-shadow(0 0 8px rgba(${rgb},0.9)) drop-shadow(0 0 18px rgba(${rgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={ox} y={oy + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={val ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{val ? "1" : "0"}</text>
    </Fragment>;

    // Helper: right-angle wire
    const W = ({ d, val, col, rgb }) => <path d={d} fill="none" stroke={wc(val, col, rgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />;

    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        {/* ===== INPUT NODES (warna unik tiap input) ===== */}
        <InputNode ix={inputAX} iy={inputAY} val={a} label="A" onToggle={onToggleA} color={aCol} rgb={aRgb} />
        <InputNode ix={inputBX} iy={inputBY} val={b} label="B" onToggle={onToggleB} color={bCol} rgb={bRgb} />
        <InputNode ix={inputCinX} iy={inputCinY} val={cin} label="Cin" onToggle={onToggleCin} color={cinCol} rgb={cinRgb} />

        {/* ===== WIRE A: fan-out to XOR1 & AND1 (kuning) ===== */}
        <W d={`M ${inputAX + inputNodeW},${inputAY} H ${jA}`} val={a} col={aCol} rgb={aRgb} />
        <W d={`M ${jA},${inputAY} V ${xor1TY} H ${xor1SX}`} val={a} col={aCol} rgb={aRgb} />
        <W d={`M ${jA},${inputAY} V ${and1TY} H ${and1SX}`} val={a} col={aCol} rgb={aRgb} />

        {/* ===== WIRE B: fan-out to XOR1 & AND1 (biru langit) ===== */}
        <W d={`M ${inputBX + inputNodeW},${inputBY} H ${jB}`} val={b} col={bCol} rgb={bRgb} />
        <W d={`M ${jB},${inputBY} V ${xor1BY} H ${xor1SX}`} val={b} col={bCol} rgb={bRgb} />
        <W d={`M ${jB},${inputBY} V ${and1BY} H ${and1SX}`} val={b} col={bCol} rgb={bRgb} />

        {/* ===== STAGE 1 GATES (glow = warna output sinyal) ===== */}
        <XorGate sx={xor1SX} ty={xor1TY} by={xor1BY} my={xor1MY} ex={xor1EX} glow={xor1Glow} fill={xor1Fill} stroke={xor1Stroke} />
        <AndGate sx={and1SX} ty={and1TY} by={and1BY} my={and1MY} w={and1W} ar={and1AR} glow={and1Glow} fill={and1Fill} stroke={and1Stroke} />

        {/* ===== WIRE s1: XOR1 output → junction → XOR2 & AND2 (oranye) ===== */}
        <W d={`M ${xor1EX},${xor1MY} H ${s1JX}`} val={s1} col={s1Col} rgb={s1Rgb} />
        <W d={`M ${s1JX},${xor1MY} V ${xor2TY} H ${xor2SX}`} val={s1} col={s1Col} rgb={s1Rgb} />
        <W d={`M ${s1JX},${xor1MY} V ${and2TY} H ${and2SX}`} val={s1} col={s1Col} rgb={s1Rgb} />
        <text x={(xor1EX + s1JX) / 2} y={xor1MY - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="bold" fill={s1 ? s1Col : "#475569"} style={{ transition: "fill 0.3s" }}>s1</text>

        {/* ===== WIRE c1: AND1 output → route ABOVE XOR2 → OR top (cyan) ===== */}
        <W d={`M ${and1EX},${and1MY} H ${xor1EX + 8} V ${xor2TY - 16} H ${cRouteX} V ${orTY} H ${orSX}`} val={c1} col={c1Col} rgb={c1Rgb} />
        <text x={(xor1EX + 8 + cRouteX) / 2} y={xor2TY - 20} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="bold" fill={c1 ? c1Col : "#475569"} style={{ transition: "fill 0.3s" }}>c1</text>

        {/* ===== WIRE Cin: fan-out to XOR2 & AND2 (ungu) ===== */}
        <W d={`M ${inputCinX + inputNodeW},${inputCinY} H ${cinJX}`} val={cin} col={cinCol} rgb={cinRgb} />
        <W d={`M ${cinJX},${inputCinY} V ${xor2BY} H ${xor2SX}`} val={cin} col={cinCol} rgb={cinRgb} />
        <W d={`M ${cinJX},${inputCinY} V ${and2BY} H ${and2SX}`} val={cin} col={cinCol} rgb={cinRgb} />

        {/* ===== STAGE 2 GATES ===== */}
        <XorGate sx={xor2SX} ty={xor2TY} by={xor2BY} my={xor2MY} ex={xor2EX} glow={xor2Glow} fill={xor2Fill} stroke={xor2Stroke} />
        <AndGate sx={and2SX} ty={and2TY} by={and2BY} my={and2MY} w={and1W} ar={and1AR} glow={and2Glow} fill={and2Fill} stroke={and2Stroke} />

        {/* ===== WIRE c2: AND2 output → routing channel → OR bottom (rose) ===== */}
        <W d={`M ${and2EX},${and2MY} H ${cRouteX} V ${orBY} H ${orSX}`} val={c2} col={c2Col} rgb={c2Rgb} />
        <text x={(and2EX + cRouteX) / 2} y={and2MY - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="bold" fill={c2 ? c2Col : "#475569"} style={{ transition: "fill 0.3s" }}>c2</text>

        {/* ===== STAGE 3 GATE (OR) ===== */}
        <OrGate sx={orSX} ty={orTY} by={orBY} my={orMY} ex={orEX} glow={orGlow} fill={orFill} stroke={orStroke} />

        {/* ===== OUTPUT WIRES & NODES (warna unik tiap output) ===== */}
        <line x1={xor2EX} y1={xor2MY} x2={sumOutX - outNodeR} y2={sumOutY} stroke={wc(sum, sumCol, sumRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <OutputNode ox={sumOutX} oy={sumOutY} val={sum} label="SUM" color={sumCol} rgb={sumRgb} />

        <line x1={orEX} y1={orMY} x2={coutOutX - outNodeR} y2={coutOutY} stroke={wc(cout, coutCol, coutRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <OutputNode ox={coutOutX} oy={coutOutY} val={cout} label="COUT" color={coutCol} rgb={coutRgb} />
    </svg>;
}
