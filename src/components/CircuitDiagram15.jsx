import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram15({ d, s0, s1, s0Not, s1Not, y0, y1, y2, y3, onToggleD, onToggleS0, onToggleS1 }) {
    // Multi-NOT colors (3.5.8): NOT #1=S0=merah, NOT #2=S1=pink
    const not1Color = "#f87171", not1Rgb = hexToRgbStr(not1Color); // NOT S0 — merah (NOT #1)
    const not2Color = "#f472b6", not2Rgb = hexToRgbStr(not2Color); // NOT S1 — pink  (NOT #2)
    const s0Color = "#22d3ee", s0Rgb = hexToRgbStr(s0Color);  // cyan for S0
    const s1Color = "#fb923c", s1Rgb = hexToRgbStr(s1Color);  // orange for S1
    const andColor = "#4ade80", andRgb = hexToRgbStr(andColor);
    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;

    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;

    // --- AND3 gates ---
    const andSX = 225, andW = 28, andAR = 22, andHH = 22;
    const andEX = andSX + andW + andAR; // 275
    const gateSpacing = 85;
    const startMY = 90;
    const andGates = [];
    for (var i = 0; i < 4; i++) {
        var my = startMY + i * gateSpacing;
        andGates.push({
            my: my, ty: my - andHH, by: my + andHH,
            topIn: my - 17, midIn: my, botIn: my + 17,
            val: [y0, y1, y2, y3][i]
        });
    }
    // AND0: my=90, AND1: my=175, AND2: my=260, AND3: my=345

    // --- Input nodes (aligned with AND gate levels for compact layout) ---
    const dY = andGates[0].my;     // 90
    const s0Y = andGates[1].my;    // 175
    const s1Y = andGates[2].my;    // 260

    // --- Junction points for fan-out ---
    const sJX = 65;  // shared junction X for S0 and S1 (18px gap from input node)

    // --- NOT gates (x=82) ---
    const notSX = 82, notHH = 16;
    const notS0MY = s0Y, notS0TY = s0Y - notHH, notS0BY = s0Y + notHH;
    const notS0TriEX = notSX + 30, notS0BubR = 5, notS0EX = notS0TriEX + notS0BubR * 2; // 122
    const notS1MY = s1Y, notS1TY = s1Y - notHH, notS1BY = s1Y + notHH;
    const notS1TriEX = notSX + 30, notS1BubR = 5, notS1EX = notS1TriEX + notS1BubR * 2; // 122

    // --- Bus lanes (unique X per signal, no overlap) ---
    const dTrunkX = 148;   // D trunk
    const s0pX = 163;      // S0' bus
    const s0dX = 178;      // S0 direct bus
    const s1pX = 193;      // S1' bus
    const s1dX = 208;      // S1 direct bus

    // --- Output nodes ---
    const outBaseX = andEX + 34 + outNodeR; // 322
    const svgW = outBaseX + outNodeR + 20;  // 355
    const svgH = andGates[3].by + 25;       // 392

    // --- Gate style helpers ---
    const mkGlow = (val, rgb) => val
        ? `drop-shadow(0 0 4px rgba(${rgb},0.9)) drop-shadow(0 0 10px rgba(${rgb},0.5))` : "none";
    const mkFill = (val, rgb) => val ? `rgba(${rgb},0.13)` : "#0f172a";
    const mkStroke = (val, col) => val ? col : "#475569";

    const notS0Glow = mkGlow(s0Not, not1Rgb), notS0Fill = mkFill(s0Not, not1Rgb), notS0Stk = mkStroke(s0Not, not1Color);
    const notS1Glow = mkGlow(s1Not, not2Rgb), notS1Fill = mkFill(s1Not, not2Rgb), notS1Stk = mkStroke(s1Not, not2Color);

    // --- Components ---
    const NotGate = ({ sx, ty, by, my, triEx, bubR, glow, fill, stroke }) => <Fragment>
        <path d={`M ${sx},${ty} L ${triEx},${my} L ${sx},${by} Z`} fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: "all 0.3s" }} />
        <circle cx={triEx + bubR} cy={my} r={bubR} fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: "all 0.3s" }} />
    </Fragment>;

    const AndGate3 = ({ sx, ty, by, w, ar, glow, fill, stroke }) => <path
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

    // Label colors for S0' and S1'
    const s0pLblCol = s0Not ? not1Color : "#475569";
    const s1pLblCol = s1Not ? not2Color : "#475569";

    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        {/* ===== INPUT NODES (aligned with AND gate levels) ===== */}
        <InputNode ix={1} iy={dY} val={d} label="D" onToggle={onToggleD} color={andColor} rgb={andRgb} />
        <InputNode ix={1} iy={s0Y} val={s0} label="S0" onToggle={onToggleS0} color={s0Color} rgb={s0Rgb} />
        <InputNode ix={1} iy={s1Y} val={s1} label="S1" onToggle={onToggleS1} color={s1Color} rgb={s1Rgb} />

        {/* ===== D: input -> trunk (no junction needed, fan-out at trunk) ===== */}
        <W d={`M 47,${dY} H ${dTrunkX}`} val={d} col={andColor} rgb={andRgb} />
        {/* D trunk vertical */}
        <W d={`M ${dTrunkX},${dY} V ${andGates[3].botIn}`} val={d} col={andColor} rgb={andRgb} />
        {/* D branches to each AND3 bottom input */}
        {andGates.map(function(g) {
            return <Fragment key={"db_" + g.my}>
                <circle cx={dTrunkX} cy={g.botIn} r={2.5} fill={d ? andColor : `rgba(${andRgb},0.25)`} style={{ transition: "fill 0.3s" }} />
                <W d={`M ${dTrunkX},${g.botIn} H ${andSX}`} val={d} col={andColor} rgb={andRgb} />
            </Fragment>;
        })}

        {/* ===== S0: input -> junction -> NOT + direct bus ===== */}
        <W d={`M 47,${s0Y} H ${sJX}`} val={s0} col={s0Color} rgb={s0Rgb} />
        <circle cx={sJX} cy={s0Y} r={3} fill={s0 ? s0Color : `rgba(${s0Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        {/* S0 -> NOT gate (at x=82) */}
        <W d={`M ${sJX},${s0Y} H ${notSX}`} val={s0} col={s0Color} rgb={s0Rgb} />
        {/* S0 -> direct bus: up past NOT gate then right to bus lane, then down to AND1 topIn level */}
        <W d={`M ${sJX},${s0Y} V 148 H ${s0dX} V ${andGates[1].topIn}`} val={s0} col={s0Color} rgb={s0Rgb} />

        {/* ===== S1: input -> junction -> NOT + direct bus ===== */}
        <W d={`M 47,${s1Y} H ${sJX}`} val={s1} col={s1Color} rgb={s1Rgb} />
        <circle cx={sJX} cy={s1Y} r={3} fill={s1 ? s1Color : `rgba(${s1Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        {/* S1 -> NOT gate (at x=82) */}
        <W d={`M ${sJX},${s1Y} H ${notSX}`} val={s1} col={s1Color} rgb={s1Rgb} />
        {/* S1 -> direct bus: down then right to bus lane at AND3 midIn level */}
        <W d={`M ${sJX},${s1Y} V ${andGates[3].midIn} H ${s1dX}`} val={s1} col={s1Color} rgb={s1Rgb} />

        {/* ===== NOT GATES (at x=82) ===== */}
        <NotGate sx={notSX} ty={notS0TY} by={notS0BY} my={notS0MY} triEx={notS0TriEX} bubR={notS0BubR} glow={notS0Glow} fill={notS0Fill} stroke={notS0Stk} />
        <NotGate sx={notSX} ty={notS1TY} by={notS1BY} my={notS1MY} triEx={notS1TriEX} bubR={notS1BubR} glow={notS1Glow} fill={notS1Fill} stroke={notS1Stk} />

        {/* ===== S0' BUS (NOT S0 output -> AND0 top, AND2 top) ===== */}
        <W d={`M ${notS0EX},${s0Y} H ${s0pX}`} val={s0Not} col={not1Color} rgb={not1Rgb} />
        <circle cx={s0pX} cy={s0Y} r={2.5} fill={s0Not ? not1Color : `rgba(${not1Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        {/* S0' trunk: up to AND0 topIn */}
        <W d={`M ${s0pX},${s0Y} V ${andGates[0].topIn}`} val={s0Not} col={not1Color} rgb={not1Rgb} />
        {/* S0' trunk: down to AND2 topIn */}
        <W d={`M ${s0pX},${s0Y} V ${andGates[2].topIn}`} val={s0Not} col={not1Color} rgb={not1Rgb} />
        {/* Branch to AND0 top */}
        <circle cx={s0pX} cy={andGates[0].topIn} r={2.5} fill={s0Not ? not1Color : `rgba(${not1Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        <W d={`M ${s0pX},${andGates[0].topIn} H ${andSX}`} val={s0Not} col={andColor} rgb={andRgb} />
        {/* Branch to AND2 top */}
        <circle cx={s0pX} cy={andGates[2].topIn} r={2.5} fill={s0Not ? not1Color : `rgba(${not1Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        <W d={`M ${s0pX},${andGates[2].topIn} H ${andSX}`} val={s0Not} col={andColor} rgb={andRgb} />
        {/* S0' label (near NOT output red wire) */}
        <text x={notS0EX + 8} y={s0Y - 5} textAnchor="start" fontFamily="Orbitron,sans-serif" fontSize="7" fontWeight="bold" fill={s0pLblCol} style={{ transition: "fill 0.3s" }}>S0</text>
        <line x1={notS0EX + 8} y1={s0Y - 13} x2={notS0EX + 22} y2={s0Y - 13} stroke={s0pLblCol} strokeWidth="1.2" style={{ transition: "stroke 0.3s" }} />

        {/* ===== S0 DIRECT BUS (S0 -> AND1 top, AND3 top) ===== */}
        {/* Trunk: from AND1 topIn level down to AND3 topIn level */}
        <W d={`M ${s0dX},${andGates[1].topIn} V ${andGates[3].topIn}`} val={s0} col={s0Color} rgb={s0Rgb} />
        {/* Branch to AND1 top */}
        <circle cx={s0dX} cy={andGates[1].topIn} r={2.5} fill={s0 ? s0Color : `rgba(${s0Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        <W d={`M ${s0dX},${andGates[1].topIn} H ${andSX}`} val={s0} col={s0Color} rgb={s0Rgb} />
        {/* Branch to AND3 top */}
        <circle cx={s0dX} cy={andGates[3].topIn} r={2.5} fill={s0 ? s0Color : `rgba(${s0Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        <W d={`M ${s0dX},${andGates[3].topIn} H ${andSX}`} val={s0} col={s0Color} rgb={s0Rgb} />

        {/* ===== S1' BUS (NOT S1 output -> AND0 mid, AND1 mid) ===== */}
        <W d={`M ${notS1EX},${s1Y} H ${s1pX}`} val={s1Not} col={not2Color} rgb={not2Rgb} />
        <circle cx={s1pX} cy={s1Y} r={2.5} fill={s1Not ? not2Color : `rgba(${not2Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        {/* S1' trunk: up to AND0 midIn (covers AND1 midIn at y=175 too) */}
        <W d={`M ${s1pX},${s1Y} V ${andGates[0].midIn}`} val={s1Not} col={not2Color} rgb={not2Rgb} />
        {/* Branch to AND0 mid */}
        <circle cx={s1pX} cy={andGates[0].midIn} r={2.5} fill={s1Not ? not2Color : `rgba(${not2Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        <W d={`M ${s1pX},${andGates[0].midIn} H ${andSX}`} val={s1Not} col={andColor} rgb={andRgb} />
        {/* Branch to AND1 mid */}
        <circle cx={s1pX} cy={andGates[1].midIn} r={2.5} fill={s1Not ? not2Color : `rgba(${not2Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        <W d={`M ${s1pX},${andGates[1].midIn} H ${andSX}`} val={s1Not} col={andColor} rgb={andRgb} />
        {/* S1' label (near NOT output red wire) */}
        <text x={notS1EX + 8} y={s1Y - 5} textAnchor="start" fontFamily="Orbitron,sans-serif" fontSize="7" fontWeight="bold" fill={s1pLblCol} style={{ transition: "fill 0.3s" }}>S1</text>
        <line x1={notS1EX + 8} y1={s1Y - 13} x2={notS1EX + 22} y2={s1Y - 13} stroke={s1pLblCol} strokeWidth="1.2" style={{ transition: "stroke 0.3s" }} />

        {/* ===== S1 DIRECT BUS (S1 -> AND2 mid, AND3 mid) ===== */}
        {/* Trunk: from AND3 midIn level up to AND2 midIn level */}
        <W d={`M ${s1dX},${andGates[3].midIn} V ${andGates[2].midIn}`} val={s1} col={s1Color} rgb={s1Rgb} />
        {/* Branch to AND3 mid */}
        <circle cx={s1dX} cy={andGates[3].midIn} r={2.5} fill={s1 ? s1Color : `rgba(${s1Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        <W d={`M ${s1dX},${andGates[3].midIn} H ${andSX}`} val={s1} col={s1Color} rgb={s1Rgb} />
        {/* Branch to AND2 mid */}
        <circle cx={s1dX} cy={andGates[2].midIn} r={2.5} fill={s1 ? s1Color : `rgba(${s1Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        <W d={`M ${s1dX},${andGates[2].midIn} H ${andSX}`} val={s1} col={s1Color} rgb={s1Rgb} />

        {/* ===== AND3 GATES ===== */}
        {andGates.map(function(g, idx) {
            return <AndGate3 key={idx} sx={andSX} ty={g.ty} by={g.by} w={andW} ar={andAR}
                glow={mkGlow(g.val, andRgb)} fill={mkFill(g.val, andRgb)} stroke={mkStroke(g.val, andColor)} />;
        })}

        {/* ===== OUTPUT WIRES + NODES (Y0-Y3, no OR tree) ===== */}
        {andGates.map(function(g, idx) {
            var outX = outBaseX, outY = g.my;
            var val = g.val;
            return <Fragment key={"out_" + idx}>
                <line x1={andEX} y1={g.my} x2={outX - outNodeR} y2={outY}
                    stroke={wc(val, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
                <OutputNode ox={outX} oy={outY} val={val} label={`Y${idx}`} color={andColor} rgb={andRgb} />
            </Fragment>;
        })}
    </svg>;
}
