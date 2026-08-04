import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram11({ s0, s1, d0, d1, d2, d3, s0Not, s1Not, g0, g1, g2, g3, y, onToggleS0, onToggleS1, onToggleD0, onToggleD1, onToggleD2, onToggleD3 }) {
    const notColor = "#f87171", notRgb = hexToRgbStr(notColor);
    const andColor = "#4ade80", andRgb = hexToRgbStr(andColor);
    const orColor = "#a78bfa", orRgb = hexToRgbStr(orColor);
    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;

    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;

    // --- Input positions ---
    const s0Y = 22, s1Y = 75;
    const d0Y = 125, d1Y = 170, d2Y = 215, d3Y = 260;
    const svgH = 295;

    // --- NOT gates ---
    const notSX = 100;
    const notS0MY = s0Y, notS0TY = s0Y - 14, notS0BY = s0Y + 14;
    const notS0TriEX = notSX + 28, notS0BubR = 5, notS0EX = notS0TriEX + notS0BubR * 2;
    const notS1MY = s1Y, notS1TY = s1Y - 14, notS1BY = s1Y + 14;
    const notS1TriEX = notSX + 28, notS1BubR = 5, notS1EX = notS1TriEX + notS1BubR * 2;

    // --- Junction points for fan-out ---
    const s0JX = 78, s1JX = 78;

    // --- Select bus channels (vertical) ---
    const s0pX = 168, s0dX = 178, s1pX = 188, s1dX = 198;

    // --- AND gates (3-input, half-height=18, arc=18) ---
    const andSX = 240, andW = 26, andAR = 18;
    const andEX = andSX + andW + andAR; // 284
    const andHH = 18; // half-height for 3-input
    // Input y-positions: top=my-13, mid=my, bot=my+13 (5px inset from edges)
    const andGates = [
        { my: d0Y, ty: d0Y - andHH, by: d0Y + andHH, topIn: d0Y - 13, midIn: d0Y, botIn: d0Y + 13, val: g0 },
        { my: d1Y, ty: d1Y - andHH, by: d1Y + andHH, topIn: d1Y - 13, midIn: d1Y, botIn: d1Y + 13, val: g1 },
        { my: d2Y, ty: d2Y - andHH, by: d2Y + andHH, topIn: d2Y - 13, midIn: d2Y, botIn: d2Y + 13, val: g2 },
        { my: d3Y, ty: d3Y - andHH, by: d3Y + andHH, topIn: d3Y - 13, midIn: d3Y, botIn: d3Y + 13, val: g3 },
    ];

    // --- OR gates (standard 2-input) ---
    const or1SX = 385;
    const or01MY = (d0Y + d1Y) / 2;   // 127.5
    const or23MY = (d2Y + d3Y) / 2;   // 217.5
    const or01TY = or01MY - 14, or01BY = or01MY + 14, or01EX = or1SX + 45; // 430
    const or23TY = or23MY - 14, or23BY = or23MY + 14, or23EX = or1SX + 45; // 430

    const or2SX = 475;
    const orFMY = (or01MY + or23MY) / 2; // 172.5
    const orFTY = orFMY - 14, orFBY = orFMY + 14, orFEX = or2SX + 45; // 520

    // --- Output node ---
    const outX = orFEX + 34 + outNodeR;
    const outY = orFMY;
    const svgW = outX + outNodeR + 15;

    // --- Gate style helpers ---
    const mkGlow = (val, rgb) => val
        ? `drop-shadow(0 0 4px rgba(${rgb},0.9)) drop-shadow(0 0 10px rgba(${rgb},0.5))` : "none";
    const mkFill = (val, rgb) => val ? `rgba(${rgb},0.13)` : "#0f172a";
    const mkStroke = (val, col) => val ? col : "#475569";

    const notS0Glow = mkGlow(s0Not, notRgb), notS0Fill = mkFill(s0Not, notRgb), notS0Stk = mkStroke(s0Not, notColor);
    const notS1Glow = mkGlow(s1Not, notRgb), notS1Fill = mkFill(s1Not, notRgb), notS1Stk = mkStroke(s1Not, notColor);

    const or01Val = g0 || g1;
    const or23Val = g2 || g3;
    const or01Glow = mkGlow(or01Val, orRgb), or01Fill = mkFill(or01Val, orRgb), or01Stk = mkStroke(or01Val, orColor);
    const or23Glow = mkGlow(or23Val, orRgb), or23Fill = mkFill(or23Val, orRgb), or23Stk = mkStroke(or23Val, orColor);
    const orFGlow = mkGlow(y, orRgb), orFFill = mkFill(y, orRgb), orFStk = mkStroke(y, orColor);

    // --- Components ---
    const NotGate = ({ sx, ty, by, my, triEx, bubR, glow, fill, stroke }) => <Fragment>
        <path d={`M ${sx},${ty} L ${triEx},${my} L ${sx},${by} Z`} fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: "all 0.3s" }} />
        <circle cx={triEx + bubR} cy={my} r={bubR} fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: "all 0.3s" }} />
    </Fragment>;

    const AndGate3 = ({ sx, ty, by, my, w, ar, glow, fill, stroke }) => <path
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

    const s0pLblCol = s0Not ? notColor : "#475569";
    const s1pLblCol = s1Not ? notColor : "#475569";

    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        {/* ===== INPUT NODES ===== */}
        <InputNode ix={1} iy={s0Y} val={s0} label="S0" onToggle={onToggleS0} color={notColor} rgb={notRgb} />
        <InputNode ix={1} iy={s1Y} val={s1} label="S1" onToggle={onToggleS1} color={notColor} rgb={notRgb} />
        <InputNode ix={1} iy={d0Y} val={d0} label="D0" onToggle={onToggleD0} color={andColor} rgb={andRgb} />
        <InputNode ix={1} iy={d1Y} val={d1} label="D1" onToggle={onToggleD1} color={andColor} rgb={andRgb} />
        <InputNode ix={1} iy={d2Y} val={d2} label="D2" onToggle={onToggleD2} color={andColor} rgb={andRgb} />
        <InputNode ix={1} iy={d3Y} val={d3} label="D3" onToggle={onToggleD3} color={andColor} rgb={andRgb} />

        {/* ===== S0 INPUT → JUNCTION → NOT ===== */}
        <W d={`M 47,${s0Y} H ${s0JX}`} val={s0} col={notColor} rgb={notRgb} />
        <W d={`M ${s0JX},${s0Y} H ${notSX}`} val={s0} col={notColor} rgb={notRgb} />
        {/* S0 junction dot */}
        <circle cx={s0JX} cy={s0Y} r={3} fill={s0 ? notColor : `rgba(${notRgb},0.25)`} style={{ transition: "fill 0.3s" }} />

        {/* ===== S1 INPUT → JUNCTION → NOT ===== */}
        <W d={`M 47,${s1Y} H ${s1JX}`} val={s1} col={notColor} rgb={notRgb} />
        <W d={`M ${s1JX},${s1Y} H ${notSX}`} val={s1} col={notColor} rgb={notRgb} />
        {/* S1 junction dot */}
        <circle cx={s1JX} cy={s1Y} r={3} fill={s1 ? notColor : `rgba(${notRgb},0.25)`} style={{ transition: "fill 0.3s" }} />

        {/* ===== NOT GATES ===== */}
        <NotGate sx={notSX} ty={notS0TY} by={notS0BY} my={notS0MY} triEx={notS0TriEX} bubR={notS0BubR} glow={notS0Glow} fill={notS0Fill} stroke={notS0Stk} />
        <NotGate sx={notSX} ty={notS1TY} by={notS1BY} my={notS1MY} triEx={notS1TriEX} bubR={notS1BubR} glow={notS1Glow} fill={notS1Fill} stroke={notS1Stk} />

        {/* ===== S0' BUS (inverted S0 → AND0 top, AND2 top) ===== */}
        <W d={`M ${notS0EX},${s0Y} H ${s0pX}`} val={s0Not} col={andColor} rgb={andRgb} />
        <W d={`M ${s0pX},${s0Y} V ${andGates[2].topIn}`} val={s0Not} col={andColor} rgb={andRgb} />
        {/* S0' → AND0 top input */}
        <W d={`M ${s0pX},${andGates[0].topIn} H ${andSX}`} val={s0Not} col={andColor} rgb={andRgb} />
        {/* S0' → AND2 top input */}
        <W d={`M ${s0pX},${andGates[2].topIn} H ${andSX}`} val={s0Not} col={andColor} rgb={andRgb} />
        {/* S0' label — tepat di output NOT S0 */}
        <text x={notS0EX + 6} y={s0Y - 8} textAnchor="start" fontFamily="Orbitron,sans-serif" fontSize="7" fontWeight="bold" fill={s0pLblCol} style={{ transition: "fill 0.3s" }}>S0</text>
        <line x1={notS0EX + 6} y1={s0Y - 15} x2={notS0EX + 18} y2={s0Y - 15} stroke={s0pLblCol} strokeWidth="1.2" style={{ transition: "stroke 0.3s" }} />

        {/* ===== S0 DIRECT BUS (S0 → AND1 top, AND3 top) ===== */}
        <W d={`M ${s0JX},${s0Y} V 38 H ${s0dX} V ${andGates[3].topIn}`} val={s0} col={andColor} rgb={andRgb} />
        {/* S0 → AND1 top input */}
        <W d={`M ${s0dX},${andGates[1].topIn} H ${andSX}`} val={s0} col={andColor} rgb={andRgb} />
        {/* S0 → AND3 top input */}
        <W d={`M ${s0dX},${andGates[3].topIn} H ${andSX}`} val={s0} col={andColor} rgb={andRgb} />

        {/* ===== S1' BUS (inverted S1 → AND0 mid, AND1 mid) ===== */}
        <W d={`M ${notS1EX},${s1Y} H ${s1pX}`} val={s1Not} col={andColor} rgb={andRgb} />
        <W d={`M ${s1pX},${s1Y} V ${andGates[1].midIn}`} val={s1Not} col={andColor} rgb={andRgb} />
        {/* S1' → AND0 mid input */}
        <W d={`M ${s1pX},${andGates[0].midIn} H ${andSX}`} val={s1Not} col={andColor} rgb={andRgb} />
        {/* S1' → AND1 mid input */}
        <W d={`M ${s1pX},${andGates[1].midIn} H ${andSX}`} val={s1Not} col={andColor} rgb={andRgb} />
        {/* S1' label — tepat di output NOT S1 */}
        <text x={notS1EX + 6} y={s1Y - 8} textAnchor="start" fontFamily="Orbitron,sans-serif" fontSize="7" fontWeight="bold" fill={s1pLblCol} style={{ transition: "fill 0.3s" }}>S1</text>
        <line x1={notS1EX + 6} y1={s1Y - 15} x2={notS1EX + 18} y2={s1Y - 15} stroke={s1pLblCol} strokeWidth="1.2" style={{ transition: "stroke 0.3s" }} />

        {/* ===== S1 DIRECT BUS (S1 → AND2 mid, AND3 mid) ===== */}
        <W d={`M ${s1JX},${s1Y} V 95 H ${s1dX} V ${andGates[3].midIn}`} val={s1} col={andColor} rgb={andRgb} />
        {/* S1 → AND2 mid input */}
        <W d={`M ${s1dX},${andGates[2].midIn} H ${andSX}`} val={s1} col={andColor} rgb={andRgb} />
        {/* S1 → AND3 mid input */}
        <W d={`M ${s1dX},${andGates[3].midIn} H ${andSX}`} val={s1} col={andColor} rgb={andRgb} />

        {/* ===== D0 WIRE → AND0 bottom input ===== */}
        <W d={`M 47,${d0Y} H 218 V ${andGates[0].botIn} H ${andSX}`} val={d0} col={andColor} rgb={andRgb} />
        {/* ===== D1 WIRE → AND1 bottom input ===== */}
        <W d={`M 47,${d1Y} H 218 V ${andGates[1].botIn} H ${andSX}`} val={d1} col={andColor} rgb={andRgb} />
        {/* ===== D2 WIRE → AND2 bottom input ===== */}
        <W d={`M 47,${d2Y} H 218 V ${andGates[2].botIn} H ${andSX}`} val={d2} col={andColor} rgb={andRgb} />
        {/* ===== D3 WIRE → AND3 bottom input ===== */}
        <W d={`M 47,${d3Y} H 218 V ${andGates[3].botIn} H ${andSX}`} val={d3} col={andColor} rgb={andRgb} />

        {/* ===== AND GATES ===== */}
        {andGates.map((g, i) => (
            <AndGate3 key={i} sx={andSX} ty={g.ty} by={g.by} my={g.my} w={andW} ar={andAR}
                glow={mkGlow(g.val, andRgb)} fill={mkFill(g.val, andRgb)} stroke={mkStroke(g.val, andColor)} />
        ))}

        {/* ===== AND OUTPUTS → OR TREE ===== */}
        {/* g0 → OR01 top */}
        <W d={`M ${andEX},${andGates[0].my} H 360 V ${or01TY} H ${or1SX}`} val={g0} col={orColor} rgb={orRgb} />
        {/* g1 → OR01 bottom */}
        <W d={`M ${andEX},${andGates[1].my} H 365 V ${or01BY} H ${or1SX}`} val={g1} col={orColor} rgb={orRgb} />
        {/* g2 → OR23 top */}
        <W d={`M ${andEX},${andGates[2].my} H 360 V ${or23TY} H ${or1SX}`} val={g2} col={orColor} rgb={orRgb} />
        {/* g3 → OR23 bottom */}
        <W d={`M ${andEX},${andGates[3].my} H 365 V ${or23BY} H ${or1SX}`} val={g3} col={orColor} rgb={orRgb} />

        {/* ===== OR GATES ===== */}
        <OrGate sx={or1SX} ty={or01TY} by={or01BY} my={or01MY} ex={or01EX} glow={or01Glow} fill={or01Fill} stroke={or01Stk} />
        <OrGate sx={or1SX} ty={or23TY} by={or23BY} my={or23MY} ex={or23EX} glow={or23Glow} fill={or23Fill} stroke={or23Stk} />
        <OrGate sx={or2SX} ty={orFTY} by={orFBY} my={orFMY} ex={orFEX} glow={orFGlow} fill={orFFill} stroke={orFStk} />

        {/* ===== OR TREE WIRES ===== */}
        {/* OR01 → OR_final top */}
        <W d={`M ${or01EX},${or01MY} H 455 V ${orFTY} H ${or2SX}`} val={or01Val} col={orColor} rgb={orRgb} />
        {/* OR23 → OR_final bottom */}
        <W d={`M ${or23EX},${or23MY} H 455 V ${orFBY} H ${or2SX}`} val={or23Val} col={orColor} rgb={orRgb} />

        {/* ===== OUTPUT WIRE & NODE ===== */}
        <line x1={orFEX} y1={orFMY} x2={outX - outNodeR} y2={outY}
            stroke={wc(y, orColor, orRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
        <OutputNode ox={outX} oy={outY} val={y} label="Y" color={orColor} rgb={orRgb} />

        {/* ===== GATE LABELS ===== */}
        <text x={(andEX + 360) / 2} y={andGates[0].my - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fontWeight="bold" fill={g0 ? andColor : "#475569"} style={{ transition: "fill 0.3s" }}>g0</text>
        <text x={(andEX + 365) / 2} y={andGates[1].my - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fontWeight="bold" fill={g1 ? andColor : "#475569"} style={{ transition: "fill 0.3s" }}>g1</text>
        <text x={(andEX + 360) / 2} y={andGates[2].my - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fontWeight="bold" fill={g2 ? andColor : "#475569"} style={{ transition: "fill 0.3s" }}>g2</text>
        <text x={(andEX + 365) / 2} y={andGates[3].my - 8} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fontWeight="bold" fill={g3 ? andColor : "#475569"} style={{ transition: "fill 0.3s" }}>g3</text>
    </svg>;
}
