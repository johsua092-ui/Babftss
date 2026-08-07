import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram17({
    d, s0, s1, s2, s3,
    s0Not, s1Not, s2Not, s3Not,
    y0, y1, y2, y3, y4, y5, y6, y7, y8, y9, y10, y11, y12, y13, y14, y15,
    onToggleD, onToggleS0, onToggleS1, onToggleS2, onToggleS3
}) {
    // === COLORS — Regulasi Warna Kabel (design.md 3.5 + 3.5.8 Multi-NOT) ===
    const s0Color = "#22d3ee", s0Rgb = hexToRgbStr(s0Color);  // cyan — S0
    const s1Color = "#fb923c", s1Rgb = hexToRgbStr(s1Color);  // orange — S1
    const s2Color = "#a78bfa", s2Rgb = hexToRgbStr(s2Color);  // ungu — S2
    const s3Color = "#a3e635", s3Rgb = hexToRgbStr(s3Color);  // lime — S3 (NEW)
    const andColor = "#4ade80", andRgb = hexToRgbStr(andColor); // hijau — D, output, NOT-ke-gerbang
    // Multi-NOT colors (3.5.8): NOT #1=S0=merah, NOT #2=S1=pink, NOT #3=S2=teal, NOT #4=S3=fuchsia
    const not1Color = "#f87171", not1Rgb = hexToRgbStr(not1Color); // NOT S0 — merah (NOT #1)
    const not2Color = "#f472b6", not2Rgb = hexToRgbStr(not2Color); // NOT S1 — pink  (NOT #2)
    const not3Color = "#2dd4bf", not3Rgb = hexToRgbStr(not3Color); // NOT S2 — teal  (NOT #3)
    const not4Color = "#d946ef", not4Rgb = hexToRgbStr(not4Color); // NOT S3 — fuchsia (NOT #4)
    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;

    // === NODE DIMENSIONS ===
    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;

    // === GATE POSITIONS (16 pairs) ===
    const gateSpacing = 85;
    const startMY = 90;

    // AND4 decode gates
    const and4SX = 290, and4W = 30, and4AR = 26, and4HH = 26;
    const and4EX = and4SX + and4W + and4AR; // 346

    // AND2 data gates
    const and2SX = 410, and2W = 24, and2AR = 18, and2HH = 14;
    const _and2h = Math.sqrt(and2AR * and2AR - and2HH * and2HH); // ~11.31
    const and2EX = Math.round(and2SX + and2W - _and2h + and2AR); // 441
    const and2OffsetY = 38;

    // Y output values
    const yVals = [y0, y1, y2, y3, y4, y5, y6, y7, y8, y9, y10, y11, y12, y13, y14, y15];

    // Build gate array
    const gates = [];
    for (let k = 0; k < 16; k++) {
        const my = startMY + k * gateSpacing;
        const b3 = (k >> 3) & 1, b2 = (k >> 2) & 1, b1 = (k >> 1) & 1, b0 = k & 1;
        const en = (b3 ? s3 : s3Not) && (b2 ? s2 : s2Not) && (b1 ? s1 : s1Not) && (b0 ? s0 : s0Not);
        gates.push({
            my,
            a4: { ty: my - and4HH, by: my + and4HH, tIn: my - 20, m1In: my - 7, m2In: my + 7, bIn: my + 20, val: en },
            a2: { my: my + and2OffsetY, ty: my + and2OffsetY - and2HH, by: my + and2OffsetY + and2HH,
                 tIn: my + and2OffsetY - 7, bIn: my + and2OffsetY + 7, val: yVals[k] }
        });
    }

    // === INPUT NODE POSITIONS ===
    const dY = gates[0].my;    // 90
    const s0Y = gates[2].my;   // 260
    const s1Y = gates[4].my;   // 430
    const s2Y = gates[8].my;   // 770
    const s3Y = gates[12].my;   // 1110

    // === NOT GATES (x=82) ===
    const notSX = 82, notHH = 16, notTriW = 30, notBubR = 5;
    const notEX = notSX + notTriW + notBubR * 2; // 122

    // === JUNCTIONS ===
    const sJX = 65;

    // === BUS LANES (8 lanes, unique X, no overlap) ===
    const busX = { s3p: 148, s3d: 163, s2p: 178, s2d: 193, s1p: 208, s1d: 223, s0p: 238, s0d: 253 };

    // === LANE ASSIGNMENTS ===
    const decodeOutLane = 368; // AND4 output -> AND2 top
    const dTrunkX = 380;       // D fan-out trunk

    // === S DIRECT BUS DETOUR Y (gaps between NOT gates / gate areas) ===
    const sDirectY = { s3: 1350, s2: 1000, s1: 600, s0: 170 };

    // === DECODE MAP (which bus signal connects to each AND4 input) ===
    const gMap = [];
    for (let k = 0; k < 16; k++) {
        const b3 = (k >> 3) & 1, b2 = (k >> 2) & 1, b1 = (k >> 1) & 1, b0 = k & 1;
        gMap.push({ top: b3 ? 's3d' : 's3p', mid1: b2 ? 's2d' : 's2p', mid2: b1 ? 's1d' : 's1p', bot: b0 ? 's0d' : 's0p' });
    }
    const busValMap = { s3p: s3Not, s3d: s3, s2p: s2Not, s2d: s2, s1p: s1Not, s1d: s1, s0p: s0Not, s0d: s0 };
    const busColMap = { s3p: not4Color, s3d: s3Color, s2p: not3Color, s2d: s2Color, s1p: not2Color, s1d: s1Color, s0p: not1Color, s0d: s0Color };
    const busRgbMap = { s3p: not4Rgb, s3d: s3Rgb, s2p: not3Rgb, s2d: s2Rgb, s1p: not2Rgb, s1d: s1Rgb, s0p: not1Rgb, s0d: s0Rgb };
    // Branch color: NOT->gerbang = hijau (Prinsip 3), direct = warna sinyal (Prinsip 5)
    const brColMap = { s3p: andColor, s3d: s3Color, s2p: andColor, s2d: s2Color, s1p: andColor, s1d: s1Color, s0p: andColor, s0d: s0Color };
    const brRgbMap = { s3p: andRgb,  s3d: s3Rgb,  s2p: andRgb,  s2d: s2Rgb,  s1p: andRgb,  s1d: s1Rgb,  s0p: andRgb,  s0d: s0Rgb };

    // Precompute bus branches
    const inputMap = { top: 'tIn', mid1: 'm1In', mid2: 'm2In', bot: 'bIn' };
    const busBranches = [];
    for (let k = 0; k < 16; k++) {
        const m = gMap[k], g = gates[k].a4;
        ['top', 'mid1', 'mid2', 'bot'].forEach(function (level) {
            const bk = m[level];
            busBranches.push({
                key: k + '-' + level, bx: busX[bk], inputY: g[inputMap[level]],
                bVal: busValMap[bk], bCol: busColMap[bk], bRgb: busRgbMap[bk],
                brCol: brColMap[bk], brRgb: brRgbMap[bk],
            });
        });
    }

    // === OUTPUT ===
    const outBaseX = and2EX + 34 + outNodeR; // 488
    const svgW = outBaseX + outNodeR + 20;   // 521
    const svgH = gates[15].a2.by + 25;       // 1442

    // === STYLE HELPERS ===
    const mkGlow = (val, rgb) => val
        ? `drop-shadow(0 0 4px rgba(${rgb},0.9)) drop-shadow(0 0 10px rgba(${rgb},0.5))` : "none";
    const mkFill = (val, rgb) => val ? `rgba(${rgb},0.13)` : "#0f172a";
    const mkStroke = (val, col) => val ? col : "#475569";

    // === COMPONENTS ===
    const NotGate = ({ sy, col, rgb }) => {
        const ty = sy - notHH, by = sy + notHH;
        const val = busValMap[{ [s0Y]: 's0p', [s1Y]: 's1p', [s2Y]: 's2p', [s3Y]: 's3p' }[sy]] || false;
        return <Fragment>
            <path d={`M ${notSX},${ty} L ${notSX + notTriW},${sy} L ${notSX},${by} Z`}
                fill={mkFill(val, rgb)} stroke={mkStroke(val, col)} strokeWidth="2"
                style={{ filter: mkGlow(val, rgb), transition: "all 0.3s" }} />
            <circle cx={notSX + notTriW + notBubR} cy={sy} r={notBubR}
                fill={mkFill(val, rgb)} stroke={mkStroke(val, col)} strokeWidth="2"
                style={{ filter: mkGlow(val, rgb), transition: "all 0.3s" }} />
        </Fragment>;
    };

    const AndGate4 = ({ ty, by, glow, fill, stroke }) => <path
        d={`M ${and4SX},${ty} L ${and4SX + and4W},${ty} A ${and4AR},${and4AR} 0 0,1 ${and4SX + and4W},${by} L ${and4SX},${by} Z`}
        fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: "all 0.3s" }} />;

    const AndGate2 = ({ ty, by, glow, fill, stroke }) => <path
        d={`M ${and2SX},${ty} L ${and2SX + and2W},${ty} A ${and2AR},${and2AR} 0 0,1 ${and2SX + and2W},${by} L ${and2SX},${by} Z`}
        fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: "all 0.3s" }} />;

    const InputNode = ({ ix, iy, val, label, onToggle, color, rgb }) => <g onClick={onToggle} style={{ cursor: "pointer" }}>
        <rect x={ix} y={iy - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx}
            fill={val ? `rgba(${rgb},0.2)` : `rgba(${rgb},0.1)`}
            stroke={val ? color : `rgba(${rgb},0.3)`} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
        <text x={ix + 24} y={iy - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">{label}</text>
        <circle cx={ix + 24} cy={iy} r={nodeR}
            fill={val ? color : `rgba(${rgb},0.15)`}
            stroke={val ? color : `rgba(${rgb},0.4)`} strokeWidth="1.5"
            style={{ filter: val ? `drop-shadow(0 0 5px rgba(${rgb},0.8))` : "none", transition: "all 0.25s" }} />
        <text x={ix + 24} y={iy + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold"
            fill={val ? color : `rgba(${rgb},0.5)`}>{val ? "1" : "0"}</text>
    </g>;

    const OutputNode = ({ ox, oy, val, label }) => <Fragment>
        <text x={ox} y={oy - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">{label}</text>
        <circle cx={ox} cy={oy} r={outNodeR}
            fill={val ? andColor : "#1e293b"} stroke={val ? andColor : "#334155"} strokeWidth="2"
            style={{ filter: val ? `drop-shadow(0 0 8px rgba(${andRgb},0.9)) drop-shadow(0 0 18px rgba(${andRgb},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={ox} y={oy + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold"
            fill={val ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{val ? "1" : "0"}</text>
    </Fragment>;

    const W = ({ d, val, col, rgb }) => <path d={d} fill="none" stroke={wc(val, col, rgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }} />;

    const OverlineLabel = ({ x, y, text, color }) => <Fragment>
        <text x={x} y={y} textAnchor="start" fontFamily="Orbitron,sans-serif" fontSize="7" fontWeight="bold" fill={color} style={{ transition: "fill 0.3s" }}>{text}</text>
        <line x1={x} y1={y - 7} x2={x + 12} y2={y - 7} stroke={color} strokeWidth="1.2" style={{ transition: "stroke 0.3s" }} />
    </Fragment>;

    // Label colors for NOT outputs (multi-NOT: masing-masing warna NOT-nya)
    const s0pLC = s0Not ? not1Color : "#475569";
    const s1pLC = s1Not ? not2Color : "#475569";
    const s2pLC = s2Not ? not3Color : "#475569";
    const s3pLC = s3Not ? not4Color : "#475569";

    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        {/* ===== INPUT NODES ===== */}
        <InputNode ix={1} iy={dY} val={d} label="D" onToggle={onToggleD} color={andColor} rgb={andRgb} />
        <InputNode ix={1} iy={s0Y} val={s0} label="S0" onToggle={onToggleS0} color={s0Color} rgb={s0Rgb} />
        <InputNode ix={1} iy={s1Y} val={s1} label="S1" onToggle={onToggleS1} color={s1Color} rgb={s1Rgb} />
        <InputNode ix={1} iy={s2Y} val={s2} label="S2" onToggle={onToggleS2} color={s2Color} rgb={s2Rgb} />
        <InputNode ix={1} iy={s3Y} val={s3} label="S3" onToggle={onToggleS3} color={s3Color} rgb={s3Rgb} />

        {/* ===== D: input -> detour above bus area -> trunk -> branches to AND2 ===== */}
        {/* D horizontal stops at x=140 (before bus lanes at x=148+), goes up to y=55 (above gate0 tIn=70), then right to trunk */}
        <W d={`M 47,${dY} H 140 V 55 H ${dTrunkX}`} val={d} col={andColor} rgb={andRgb} />
        {/* D trunk: vertical from y=55 down to last AND2 botIn */}
        <W d={`M ${dTrunkX},55 V ${gates[15].a2.bIn}`} val={d} col={andColor} rgb={andRgb} />
        {gates.map(function (g, i) {
            return <Fragment key={"db" + i}>
                <circle cx={dTrunkX} cy={g.a2.bIn} r={2.5} fill={d ? andColor : `rgba(${andRgb},0.25)`} style={{ transition: "fill 0.3s" }} />
                <W d={`M ${dTrunkX},${g.a2.bIn} H ${and2SX}`} val={d} col={andColor} rgb={andRgb} />
            </Fragment>;
        })}

        {/* ===== S INPUTS -> JUNCTION -> NOT ===== */}
        {/* S0 */}
        <W d={`M 47,${s0Y} H ${sJX}`} val={s0} col={s0Color} rgb={s0Rgb} />
        <circle cx={sJX} cy={s0Y} r={3} fill={s0 ? s0Color : `rgba(${s0Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        <W d={`M ${sJX},${s0Y} H ${notSX}`} val={s0} col={s0Color} rgb={s0Rgb} />
        {/* S1 */}
        <W d={`M 47,${s1Y} H ${sJX}`} val={s1} col={s1Color} rgb={s1Rgb} />
        <circle cx={sJX} cy={s1Y} r={3} fill={s1 ? s1Color : `rgba(${s1Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        <W d={`M ${sJX},${s1Y} H ${notSX}`} val={s1} col={s1Color} rgb={s1Rgb} />
        {/* S2 */}
        <W d={`M 47,${s2Y} H ${sJX}`} val={s2} col={s2Color} rgb={s2Rgb} />
        <circle cx={sJX} cy={s2Y} r={3} fill={s2 ? s2Color : `rgba(${s2Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        <W d={`M ${sJX},${s2Y} H ${notSX}`} val={s2} col={s2Color} rgb={s2Rgb} />
        {/* S3 */}
        <W d={`M 47,${s3Y} H ${sJX}`} val={s3} col={s3Color} rgb={s3Rgb} />
        <circle cx={sJX} cy={s3Y} r={3} fill={s3 ? s3Color : `rgba(${s3Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        <W d={`M ${sJX},${s3Y} H ${notSX}`} val={s3} col={s3Color} rgb={s3Rgb} />

        {/* ===== NOT GATES ===== */}
        <NotGate sy={s0Y} col={not1Color} rgb={not1Rgb} />
        <NotGate sy={s1Y} col={not2Color} rgb={not2Rgb} />
        <NotGate sy={s2Y} col={not3Color} rgb={not3Rgb} />
        <NotGate sy={s3Y} col={not4Color} rgb={not4Rgb} />

        {/* ===== OVERLINE LABELS ===== */}
        <OverlineLabel x={notEX + 8} y={s0Y - 15} text="S0" color={s0pLC} />
        <OverlineLabel x={notEX + 8} y={s1Y - 5} text="S1" color={s1pLC} />
        <OverlineLabel x={notEX + 8} y={s2Y - 5} text="S2" color={s2pLC} />
        <OverlineLabel x={notEX + 8} y={s3Y - 5} text="S3" color={s3pLC} />

        {/* ===== SELECT BUS TRUNKS — NOT output (multi-NOT: masing-masing warna NOT-nya) ===== */}
        {/* S3' trunk (NOT #4 fuchsia): NOT output -> bus s3p -> up to gate[0] tIn */}
        <W d={`M ${notEX},${s3Y} H ${busX.s3p} V ${gates[0].a4.tIn}`} val={s3Not} col={not4Color} rgb={not4Rgb} />
        {/* S2' trunk (NOT #3 teal): NOT output -> bus s2p -> up & down */}
        <W d={`M ${notEX},${s2Y} H ${busX.s2p}`} val={s2Not} col={not3Color} rgb={not3Rgb} />
        <W d={`M ${busX.s2p},${s2Y} V ${gates[0].a4.m1In}`} val={s2Not} col={not3Color} rgb={not3Rgb} />
        <W d={`M ${busX.s2p},${s2Y} V ${gates[11].a4.m1In}`} val={s2Not} col={not3Color} rgb={not3Rgb} />
        {/* S1' trunk (NOT #2 pink): NOT output -> bus s1p -> up & down */}
        <W d={`M ${notEX},${s1Y} H ${busX.s1p}`} val={s1Not} col={not2Color} rgb={not2Rgb} />
        <W d={`M ${busX.s1p},${s1Y} V ${gates[0].a4.m2In}`} val={s1Not} col={not2Color} rgb={not2Rgb} />
        <W d={`M ${busX.s1p},${s1Y} V ${gates[13].a4.m2In}`} val={s1Not} col={not2Color} rgb={not2Rgb} />
        {/* S0' trunk (NOT #1 merah): NOT output -> detour y=253 -> bus s0p -> up & down */}
        <W d={`M ${notEX},${s0Y} H 135 V 253 H ${busX.s0p}`} val={s0Not} col={not1Color} rgb={not1Rgb} />
        <W d={`M ${busX.s0p},253 V ${gates[0].a4.bIn}`} val={s0Not} col={not1Color} rgb={not1Rgb} />
        <W d={`M ${busX.s0p},253 V ${gates[14].a4.bIn}`} val={s0Not} col={not1Color} rgb={not1Rgb} />

        {/* ===== SELECT BUS TRUNKS — DIRECT (warna sinyal masing-masing) ===== */}
        {/* S0 direct: junction -> up to detour y=170 -> bus s0d -> down to gate[15] bIn */}
        <W d={`M ${sJX},${s0Y} V ${sDirectY.s0} H ${busX.s0d}`} val={s0} col={s0Color} rgb={s0Rgb} />
        <W d={`M ${busX.s0d},${sDirectY.s0} V ${gates[15].a4.bIn}`} val={s0} col={s0Color} rgb={s0Rgb} />
        {/* S1 direct: junction -> down to detour y=600 -> bus s1d -> up & down */}
        <W d={`M ${sJX},${s1Y} V ${sDirectY.s1} H ${busX.s1d}`} val={s1} col={s1Color} rgb={s1Rgb} />
        <W d={`M ${busX.s1d},${sDirectY.s1} V ${gates[2].a4.m2In}`} val={s1} col={s1Color} rgb={s1Rgb} />
        <W d={`M ${busX.s1d},${sDirectY.s1} V ${gates[15].a4.m2In}`} val={s1} col={s1Color} rgb={s1Rgb} />
        {/* S2 direct: junction -> down to detour y=1000 -> bus s2d -> up & down */}
        <W d={`M ${sJX},${s2Y} V ${sDirectY.s2} H ${busX.s2d}`} val={s2} col={s2Color} rgb={s2Rgb} />
        <W d={`M ${busX.s2d},${sDirectY.s2} V ${gates[4].a4.m1In}`} val={s2} col={s2Color} rgb={s2Rgb} />
        <W d={`M ${busX.s2d},${sDirectY.s2} V ${gates[15].a4.m1In}`} val={s2} col={s2Color} rgb={s2Rgb} />
        {/* S3 direct: junction -> down to detour y=1350 -> bus s3d -> up to gate[8] tIn */}
        <W d={`M ${sJX},${s3Y} V ${sDirectY.s3} H ${busX.s3d}`} val={s3} col={s3Color} rgb={s3Rgb} />
        <W d={`M ${busX.s3d},${sDirectY.s3} V ${gates[8].a4.tIn}`} val={s3} col={s3Color} rgb={s3Rgb} />

        {/* ===== AND4 DECODE GATES (rendered BEFORE branches so branches draw on top) ===== */}
        {gates.map(function (g, i) {
            return <AndGate4 key={"a4" + i} ty={g.a4.ty} by={g.a4.by}
                glow={mkGlow(g.a4.val, andRgb)} fill={mkFill(g.a4.val, andRgb)} stroke={mkStroke(g.a4.val, andColor)} />;
        })}

        {/* ===== BUS BRANCHES (junction dot + horizontal to AND4 input) ===== */}
        {busBranches.map(function (b) {
            return <Fragment key={b.key}>
                <circle cx={b.bx} cy={b.inputY} r={2.5}
                    fill={b.bVal ? b.bCol : `rgba(${b.bRgb},0.25)`} style={{ transition: "fill 0.3s" }} />
                <W d={`M ${b.bx},${b.inputY} H ${and4SX}`} val={b.bVal} col={b.brCol} rgb={b.brRgb} />
            </Fragment>;
        })}

        {/* ===== AND2 DATA GATES (rendered BEFORE wires so wires draw on top) ===== */}
        {gates.map(function (g, i) {
            return <AndGate2 key={"a2" + i} ty={g.a2.ty} by={g.a2.by}
                glow={mkGlow(g.a2.val, andRgb)} fill={mkFill(g.a2.val, andRgb)} stroke={mkStroke(g.a2.val, andColor)} />;
        })}

        {/* ===== DECODE OUTPUT: AND4 -> AND2 top input ===== */}
        {gates.map(function (g, i) {
            return <W key={"dec" + i}
                d={`M ${and4EX},${g.my} H ${decodeOutLane} V ${g.a2.tIn} H ${and2SX}`}
                val={g.a4.val} col={andColor} rgb={andRgb} />;
        })}

        {/* ===== OUTPUT WIRES + NODES (Y0-Y15) ===== */}
        {gates.map(function (g, i) {
            return <Fragment key={"out" + i}>
                <line x1={and2EX} y1={g.a2.my} x2={outBaseX - outNodeR} y2={g.a2.my}
                    stroke={wc(g.a2.val, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
                <OutputNode ox={outBaseX} oy={g.a2.my} val={g.a2.val} label={`Y${i}`} />
            </Fragment>;
        })}
    </svg>;
}
