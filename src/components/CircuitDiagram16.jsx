import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram16({
    d, s0, s1, s2, s0Not, s1Not, s2Not,
    y0, y1, y2, y3, y4, y5, y6, y7,
    onToggleD, onToggleS0, onToggleS1, onToggleS2
}) {
    // === COLORS — Regulasi Warna Kabel (design.md 3.5) ===
    const notColor = "#f87171", notRgb = hexToRgbStr(notColor);
    const s0Color = "#22d3ee", s0Rgb = hexToRgbStr(s0Color);  // cyan — S0
    const s1Color = "#fb923c", s1Rgb = hexToRgbStr(s1Color);  // orange — S1
    const s2Color = "#a78bfa", s2Rgb = hexToRgbStr(s2Color);  // ungu — S2
    const andColor = "#4ade80", andRgb = hexToRgbStr(andColor); // hijau — D, output, NOT-ke-gerbang
    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;

    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;

    // === GATE POSITIONS (8 pairs) ===
    const gateSpacing = 85;
    const startMY = 90;
    const and3SX = 270, and3W = 28, and3AR = 22, and3HH = 22;
    const and3EX = and3SX + and3W + and3AR; // 320
    const and2SX = 385, and2W = 24, and2AR = 18, and2HH = 14;
    const _and2h = Math.sqrt(and2AR * and2AR - and2HH * and2HH); // ~11.31
    const and2RightX = Math.round(and2SX + and2W + _and2h); // ~415
    const and2OffsetY = 32;

    const yVals = [y0, y1, y2, y3, y4, y5, y6, y7];
    const gates = [];
    for (let i = 0; i < 8; i++) {
        const my = startMY + i * gateSpacing;
        const en = [
            s2Not && s1Not && s0Not, s2Not && s1Not && s0,
            s2Not && s1 && s0Not,   s2Not && s1 && s0,
            s2 && s1Not && s0Not,   s2 && s1Not && s0,
            s2 && s1 && s0Not,     s2 && s1 && s0
        ][i];
        gates.push({
            my,
            a3: { ty: my - and3HH, by: my + and3HH, topIn: my - 17, midIn: my, botIn: my + 17, val: en },
            a2: { my: my + and2OffsetY, ty: my + and2OffsetY - and2HH, by: my + and2OffsetY + and2HH,
                 topIn: my + and2OffsetY - 7, botIn: my + and2OffsetY + 7, val: yVals[i] }
        });
    }

    // === INPUT NODE POSITIONS ===
    const dY = gates[0].my;   // 90
    const s0Y = gates[2].my;  // 260
    const s1Y = gates[4].my;  // 430
    const s2Y = gates[6].my;  // 600

    // === NOT GATES (x=82) ===
    const notSX = 82, notHH = 16, notTriW = 30, notBubR = 5;
    const notEX = notSX + notTriW + notBubR * 2; // 122

    // === JUNCTIONS ===
    const sJX = 65;

    // === BUS LANES (unique X, no overlap) ===
    const busX = { s2p: 148, s2d: 163, s1p: 178, s1d: 193, s0p: 208, s0d: 223 };

    // === LANE ASSIGNMENTS ===
    const decodeOutLane = 335; // AND3 output -> AND2 top
    const dTrunkX = 350;       // D fan-out trunk

    // === OUTPUT ===
    const outBaseX = and2RightX + 34 + outNodeR;
    const svgW = outBaseX + outNodeR + 20;
    const svgH = gates[7].a2.by + 25;

    // === DECODE MAP ===
    const gMap = [];
    const inputMap = { top: 'topIn', mid: 'midIn', bot: 'botIn' };
    for (let i = 0; i < 8; i++) {
        const b2 = (i >> 2) & 1, b1 = (i >> 1) & 1, b0 = i & 1;
        gMap.push({ top: b2 ? 's2d' : 's2p', mid: b1 ? 's1d' : 's1p', bot: b0 ? 's0d' : 's0p' });
    }
    const busValMap = { s2p: s2Not, s2d: s2, s1p: s1Not, s1d: s1, s0p: s0Not, s0d: s0 };
    const busColMap = { s2p: notColor, s2d: s2Color, s1p: notColor, s1d: s1Color, s0p: notColor, s0d: s0Color };
    const busRgbMap = { s2p: notRgb, s2d: s2Rgb, s1p: notRgb, s1d: s1Rgb, s0p: notRgb, s0d: s0Rgb };
    // Branch color: NOT->gerbang = hijau (Prinsip 3), direct = warna sinyal (Prinsip 5)
    const brColMap = { s2p: andColor, s2d: s2Color, s1p: andColor, s1d: s1Color, s0p: andColor, s0d: s0Color };
    const brRgbMap = { s2p: andRgb,  s2d: s2Rgb,  s1p: andRgb,  s1d: s1Rgb,  s0p: andRgb,  s0d: s0Rgb };

    // Precompute bus branches
    const busBranches = [];
    for (let i = 0; i < 8; i++) {
        const m = gMap[i], g = gates[i].a3;
        ['top', 'mid', 'bot'].forEach(level => {
            const bk = m[level];
            busBranches.push({
                key: i + '-' + level, bx: busX[bk], inputY: g[inputMap[level]],
                bVal: busValMap[bk], bCol: busColMap[bk], bRgb: busRgbMap[bk],
                brCol: brColMap[bk], brRgb: brRgbMap[bk],
            });
        });
    }

    // === STYLE HELPERS ===
    const mkGlow = (val, rgb) => val
        ? `drop-shadow(0 0 4px rgba(${rgb},0.9)) drop-shadow(0 0 10px rgba(${rgb},0.5))` : "none";
    const mkFill = (val, rgb) => val ? `rgba(${rgb},0.13)` : "#0f172a";
    const mkStroke = (val, col) => val ? col : "#475569";

    // === COMPONENTS ===
    const NotGate = ({ sy }) => {
        const ty = sy - notHH, by = sy + notHH;
        const val = busValMap[{ 260: 's0p', 430: 's1p', 600: 's2p' }[sy]] || false;
        return <Fragment>
            <path d={`M ${notSX},${ty} L ${notSX + notTriW},${sy} L ${notSX},${by} Z`}
                fill={mkFill(val, notRgb)} stroke={mkStroke(val, notColor)} strokeWidth="2"
                style={{ filter: mkGlow(val, notRgb), transition: "all 0.3s" }} />
            <circle cx={notSX + notTriW + notBubR} cy={sy} r={notBubR}
                fill={mkFill(val, notRgb)} stroke={mkStroke(val, notColor)} strokeWidth="2"
                style={{ filter: mkGlow(val, notRgb), transition: "all 0.3s" }} />
        </Fragment>;
    };

    const AndGate3 = ({ ty, by, glow, fill, stroke }) => <path
        d={`M ${and3SX},${ty} L ${and3SX + and3W},${ty} A ${and3AR},${and3AR} 0 0,1 ${and3SX + and3W},${by} L ${and3SX},${by} Z`}
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

    // Label colors for NOT outputs
    const s0pLC = s0Not ? notColor : "#475569";
    const s1pLC = s1Not ? notColor : "#475569";
    const s2pLC = s2Not ? notColor : "#475569";

    // === WHICH GATES EACH BUS REACHES ===
    // S2': AND3[0-3] topIn; S2: AND3[4-7] topIn
    // S1': AND3[0,1,4,5] midIn; S1': AND3[2,3,6,7] midIn
    // S0': AND3[0,2,4,6] botIn; S0: AND3[1,3,5,7] botIn

    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        {/* ===== INPUT NODES ===== */}
        <InputNode ix={1} iy={dY} val={d} label="D" onToggle={onToggleD} color={andColor} rgb={andRgb} />
        <InputNode ix={1} iy={s0Y} val={s0} label="S0" onToggle={onToggleS0} color={s0Color} rgb={s0Rgb} />
        <InputNode ix={1} iy={s1Y} val={s1} label="S1" onToggle={onToggleS1} color={s1Color} rgb={s1Rgb} />
        <InputNode ix={1} iy={s2Y} val={s2} label="S2" onToggle={onToggleS2} color={s2Color} rgb={s2Rgb} />

        {/* ===== D: input -> detour above bus area -> trunk -> branches to AND2 ===== */}
        {/* D horizontal stops at x=140 (before bus lanes at x=148+), goes up to y=55 (above gate0 topIn=73), then right to trunk */}
        <W d={`M 47,${dY} H 140 V 55 H ${dTrunkX}`} val={d} col={andColor} rgb={andRgb} />
        {/* D trunk: vertical from y=55 down to last AND2 botIn */}
        <W d={`M ${dTrunkX},55 V ${gates[7].a2.botIn}`} val={d} col={andColor} rgb={andRgb} />
        {gates.map(function (g, i) {
            return <Fragment key={"db" + i}>
                <circle cx={dTrunkX} cy={g.a2.botIn} r={2.5} fill={d ? andColor : `rgba(${andRgb},0.25)`} style={{ transition: "fill 0.3s" }} />
                <W d={`M ${dTrunkX},${g.a2.botIn} H ${and2SX}`} val={d} col={andColor} rgb={andRgb} />
            </Fragment>;
        })}

        {/* ===== S INPUTS -> JUNCTION -> NOT ===== */}
        <W d={`M 47,${s0Y} H ${sJX}`} val={s0} col={s0Color} rgb={s0Rgb} />
        <circle cx={sJX} cy={s0Y} r={3} fill={s0 ? s0Color : `rgba(${s0Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        <W d={`M ${sJX},${s0Y} H ${notSX}`} val={s0} col={s0Color} rgb={s0Rgb} />

        <W d={`M 47,${s1Y} H ${sJX}`} val={s1} col={s1Color} rgb={s1Rgb} />
        <circle cx={sJX} cy={s1Y} r={3} fill={s1 ? s1Color : `rgba(${s1Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        <W d={`M ${sJX},${s1Y} H ${notSX}`} val={s1} col={s1Color} rgb={s1Rgb} />

        <W d={`M 47,${s2Y} H ${sJX}`} val={s2} col={s2Color} rgb={s2Rgb} />
        <circle cx={sJX} cy={s2Y} r={3} fill={s2 ? s2Color : `rgba(${s2Rgb},0.25)`} style={{ transition: "fill 0.3s" }} />
        <W d={`M ${sJX},${s2Y} H ${notSX}`} val={s2} col={s2Color} rgb={s2Rgb} />

        {/* ===== NOT GATES ===== */}
        <NotGate sy={s0Y} />
        <NotGate sy={s1Y} />
        <NotGate sy={s2Y} />

        {/* ===== OVERLINE LABELS ===== */}
        <OverlineLabel x={notEX + 8} y={s0Y - 15} text="S0" color={s0pLC} />
        <OverlineLabel x={notEX + 8} y={s1Y - 5} text="S1" color={s1pLC} />
        <OverlineLabel x={notEX + 8} y={s2Y - 5} text="S2" color={s2pLC} />

        {/* ===== SELECT BUS TRUNKS — NOT output (merah) ===== */}
        {/* S2' trunk: NOT output -> bus -> up to AND3[0] topIn=73 (all S2' gates 0-3 are above NOT at y=600) */}
        <W d={`M ${notEX},${s2Y} H ${busX.s2p} V ${gates[0].a3.topIn}`} val={s2Not} col={notColor} rgb={notRgb} />
        {/* S1' trunk: NOT output -> bus at x=178, then UP to AND3[0] midIn=90, DOWN to AND3[5] midIn=515 */}
        <W d={`M ${notEX},${s1Y} H ${busX.s1p}`} val={s1Not} col={notColor} rgb={notRgb} />
        <W d={`M ${busX.s1p},${s1Y} V ${gates[0].a3.midIn}`} val={s1Not} col={notColor} rgb={notRgb} />
        <W d={`M ${busX.s1p},${s1Y} V ${gates[5].a3.midIn}`} val={s1Not} col={notColor} rgb={notRgb} />
        {/* S0' trunk: NOT output -> detour up to y=248 to avoid overlap with S1d branch at y=260 -> bus at x=208, then UP to AND3[0] botIn=107, DOWN to AND3[6] botIn=617 */}
        <W d={`M ${notEX},${s0Y} H 135 V 248 H ${busX.s0p}`} val={s0Not} col={notColor} rgb={notRgb} />
        <W d={`M ${busX.s0p},248 V ${gates[0].a3.botIn}`} val={s0Not} col={notColor} rgb={notRgb} />
        <W d={`M ${busX.s0p},248 V ${gates[6].a3.botIn}`} val={s0Not} col={notColor} rgb={notRgb} />

        {/* ===== SELECT BUS TRUNKS — DIRECT (warna sinyal masing-masing) ===== */}
        {/* S0 direct: junction -> up to AND3[1] botIn=192 -> H to bus -> down to AND3[7] botIn=702 */}
        <W d={`M ${sJX},${s0Y} V ${gates[1].a3.botIn} H ${busX.s0d}`} val={s0} col={s0Color} rgb={s0Rgb} />
        <W d={`M ${busX.s0d},${gates[1].a3.botIn} V ${gates[7].a3.botIn}`} val={s0} col={s0Color} rgb={s0Rgb} />
        {/* S1 direct: junction -> down past NOT -> detour -> bus -> cover AND3[2-7] midIn */}
        <W d={`M ${sJX},${s1Y} V ${s1Y + notHH + 15} H 133 V ${gates[7].a3.midIn} H ${busX.s1d} V ${gates[2].a3.midIn}`} val={s1} col={s1Color} rgb={s1Rgb} />
        {/* S2 direct: junction -> down past NOT -> detour -> bus -> cover AND3[4-7] topIn */}
        <W d={`M ${sJX},${s2Y} V ${s2Y + notHH + 15} H 140 V ${gates[7].a3.topIn} H ${busX.s2d} V ${gates[4].a3.topIn}`} val={s2} col={s2Color} rgb={s2Rgb} />

        {/* ===== AND3 DECODE GATES ===== */}
        {gates.map(function (g, i) {
            return <AndGate3 key={"a3" + i} ty={g.a3.ty} by={g.a3.by}
                glow={mkGlow(g.a3.val, andRgb)} fill={mkFill(g.a3.val, andRgb)} stroke={mkStroke(g.a3.val, andColor)} />;
        })}

        {/* ===== BUS BRANCHES (junction dot + horizontal to AND3 input) ===== */}
        {busBranches.map(function (b) {
            return <Fragment key={b.key}>
                <circle cx={b.bx} cy={b.inputY} r={2.5}
                    fill={b.bVal ? b.bCol : `rgba(${b.bRgb},0.25)`} style={{ transition: "fill 0.3s" }} />
                <W d={`M ${b.bx},${b.inputY} H ${and3SX}`} val={b.bVal} col={b.brCol} rgb={b.brRgb} />
            </Fragment>;
        })}

        {/* ===== AND2 DATA GATES ===== */}
        {gates.map(function (g, i) {
            return <AndGate2 key={"a2" + i} ty={g.a2.ty} by={g.a2.by}
                glow={mkGlow(g.a2.val, andRgb)} fill={mkFill(g.a2.val, andRgb)} stroke={mkStroke(g.a2.val, andColor)} />;
        })}

        {/* ===== DECODE OUTPUT: AND3 -> AND2 top input ===== */}
        {gates.map(function (g, i) {
            return <W key={"dec" + i}
                d={`M ${and3EX},${g.my} H ${decodeOutLane} V ${g.a2.topIn} H ${and2SX}`}
                val={g.a3.val} col={andColor} rgb={andRgb} />;
        })}

        {/* ===== OUTPUT WIRES + NODES (Y0-Y7) ===== */}
        {gates.map(function (g, i) {
            return <Fragment key={"out" + i}>
                <line x1={and2RightX} y1={g.a2.my} x2={outBaseX - outNodeR} y2={g.a2.my}
                    stroke={wc(g.a2.val, andColor, andRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
                <OutputNode ox={outBaseX} oy={g.a2.my} val={g.a2.val} label={`Y${i}`} />
            </Fragment>;
        })}
    </svg>;
}
