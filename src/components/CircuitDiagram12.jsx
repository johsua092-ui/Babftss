import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
const nodeR = 8, outNodeR = 13;

export default function CircuitDiagram12({
    s0, s1, s2, d0, d1, d2, d3, d4, d5, d6, d7,
    s0Not, s1Not, s2Not,
    en0, en1, en2, en3, en4, en5, en6, en7,
    g0, g1, g2, g3, g4, g5, g6, g7, y,
    onToggleS0, onToggleS1, onToggleS2,
    onToggleD0, onToggleD1, onToggleD2, onToggleD3, onToggleD4, onToggleD5, onToggleD6, onToggleD7,
}) {
    // Multi-NOT colors (3.5.8): NOT #1=S0=merah, NOT #2=S1=rose, NOT #3=S2=teal
    // Rose (bukan pink) untuk NOT S1 karena pink #f472b6 sudah dipakai D4
    const not1Color = "#f87171", not1Rgb = hexToRgbStr(not1Color); // NOT S0 — merah (NOT #1)
    const not2Color = "#fb7185", not2Rgb = hexToRgbStr(not2Color); // NOT S1 — rose  (NOT #2)
    const not3Color = "#2dd4bf", not3Rgb = hexToRgbStr(not3Color); // NOT S2 — teal  (NOT #3)
    const selColor = "#4ade80", selRgb = hexToRgbStr(selColor);
    const orColor = "#a78bfa", orRgb = hexToRgbStr(orColor);
    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;

    const dCols = ["#22d3ee", "#facc15", "#fb923c", "#60a5fa", "#f472b6", "#34d399", "#e879f9", "#a3e635"];
    const dRgbs = ["34,211,238", "250,204,21", "251,146,60", "96,165,250", "244,114,182", "52,211,153", "232,121,249", "163,230,53"];
    const dVals = [d0, d1, d2, d3, d4, d5, d6, d7];
    const enVals = [en0, en1, en2, en3, en4, en5, en6, en7];
    const gVals = [g0, g1, g2, g3, g4, g5, g6, g7];
    const dToggles = [onToggleD0, onToggleD1, onToggleD2, onToggleD3, onToggleD4, onToggleD5, onToggleD6, onToggleD7];

    const s0Y = 30, s1Y = 85, s2Y = 140;
    const dYs = [210, 295, 380, 465, 550, 635, 720, 805];
    const svgH = 890;

    const notSX = 100;
    const jX = 78;
    const s2pX = 185, s2dX = 205, s1pX = 225, s1dX = 245, s0pX = 265, s0dX = 285;

    const and3SX = 320, and3EX = 370, and3HH = 22;
    const decG = dYs.map(function(dy) {
        return { my: dy, ty: dy - and3HH, by: dy + and3HH, topIn: dy - 17, midIn: dy, botIn: dy + 17 };
    });

    const and2SX = 420, and2HH = 14, and2W = 24, and2Ar = 18;
    const _and2h = Math.sqrt(and2Ar * and2Ar - and2HH * and2HH);
    const and2EX = Math.round(and2SX + and2W - _and2h + and2Ar);
    const datG = dYs.map(function(dy) {
        return { my: dy + 38, ty: dy + 24, by: dy + 52, topIn: dy + 30, botIn: dy + 46 };
    });

    const gMap = [
        { top: 's2p', mid: 's1p', bot: 's0p' }, { top: 's2p', mid: 's1p', bot: 's0d' },
        { top: 's2p', mid: 's1d', bot: 's0p' }, { top: 's2p', mid: 's1d', bot: 's0d' },
        { top: 's2d', mid: 's1p', bot: 's0p' }, { top: 's2d', mid: 's1p', bot: 's0d' },
        { top: 's2d', mid: 's1d', bot: 's0p' }, { top: 's2d', mid: 's1d', bot: 's0d' },
    ];
    const busXMap = { s2p: s2pX, s2d: s2dX, s1p: s1pX, s1d: s1dX, s0p: s0pX, s0d: s0dX };
    const busValMap = { s2p: s2Not, s2d: s2, s1p: s1Not, s1d: s1, s0p: s0Not, s0d: s0 };
    const busColMap = { s2p: not3Color, s2d: selColor, s1p: not2Color, s1d: selColor, s0p: not1Color, s0d: selColor };
    const busRgbMap = { s2p: not3Rgb, s2d: selRgb, s1p: not2Rgb, s1d: selRgb, s0p: not1Rgb, s0d: selRgb };

    // Precompute bus branches
    var busBranches = [];
    for (var i = 0; i < 8; i++) {
        var m = gMap[i];
        var g = decG[i];
        ['top', 'mid', 'bot'].forEach(function(level) {
            var busKey = m[level];
            busBranches.push({
                key: i + '-' + level, bx: busXMap[busKey], inputY: g[level + 'In'],
                bVal: busValMap[busKey], bCol: busColMap[busKey], bRgb: busRgbMap[busKey],
                dCol: dCols[i], dRgb: dRgbs[i],
            });
        });
    }

    var or1SX = 540, or1EX = 590, or2SX = 640, or2EX = 690, or3SX = 740, or3EX = 790, orHH = 16;
    var or01MY = (datG[0].my + datG[1].my) / 2;
    var or23MY = (datG[2].my + datG[3].my) / 2;
    var or45MY = (datG[4].my + datG[5].my) / 2;
    var or67MY = (datG[6].my + datG[7].my) / 2;
    var or0123MY = (or01MY + or23MY) / 2;
    var or4567MY = (or45MY + or67MY) / 2;
    var orFMY = (or0123MY + or4567MY) / 2;

    var outX = or3EX + 38 + outNodeR;
    var outY = orFMY;
    var svgW = outX + outNodeR + 15;

    var mkGlow = function(val, rgb) { return val ? 'drop-shadow(0 0 4px rgba(' + rgb + ',0.9)) drop-shadow(0 0 10px rgba(' + rgb + ',0.5))' : 'none'; };
    var mkFill = function(val, rgb) { return val ? 'rgba(' + rgb + ',0.13)' : '#0f172a'; };
    var mkStroke = function(val, col) { return val ? col : '#475569'; };

    var notSt = [
        { glow: mkGlow(s0Not, not1Rgb), fill: mkFill(s0Not, not1Rgb), stroke: mkStroke(s0Not, not1Color) },
        { glow: mkGlow(s1Not, not2Rgb), fill: mkFill(s1Not, not2Rgb), stroke: mkStroke(s1Not, not2Color) },
        { glow: mkGlow(s2Not, not3Rgb), fill: mkFill(s2Not, not3Rgb), stroke: mkStroke(s2Not, not3Color) },
    ];
    var or01Val = gVals[0] || gVals[1];
    var or23Val = gVals[2] || gVals[3];
    var or45Val = gVals[4] || gVals[5];
    var or67Val = gVals[6] || gVals[7];
    var or0123Val = or01Val || or23Val;
    var or4567Val = or45Val || or67Val;
    var s0pLC = s0Not ? not1Color : '#475569';
    var s1pLC = s1Not ? not2Color : '#475569';
    var s2pLC = s2Not ? not3Color : '#475569';

    return <svg viewBox={'0 0 ' + svgW + ' ' + svgH} width="100%" style={{ overflow: 'visible', display: 'block' }}>
        {/* INPUT NODES */}
        <InputNode ix={1} iy={s0Y} val={s0} label="S0" onToggle={onToggleS0} color={selColor} rgb={selRgb} />
        <InputNode ix={1} iy={s1Y} val={s1} label="S1" onToggle={onToggleS1} color={selColor} rgb={selRgb} />
        <InputNode ix={1} iy={s2Y} val={s2} label="S2" onToggle={onToggleS2} color={selColor} rgb={selRgb} />
        {dYs.map(function(dy, i) {
            return <InputNode key={i} ix={1} iy={dy} val={dVals[i]} label={'D' + i} onToggle={dToggles[i]} color={dCols[i]} rgb={dRgbs[i]} />;
        })}

        {/* S INPUT -> JUNCTION -> NOT */}
        <W d={'M 47,' + s0Y + ' H ' + jX} val={s0} col={selColor} rgb={selRgb} />
        <W d={'M ' + jX + ',' + s0Y + ' H ' + notSX} val={s0} col={selColor} rgb={selRgb} />
        <circle cx={jX} cy={s0Y} r={3} fill={s0 ? selColor : 'rgba(' + selRgb + ',0.25)'} style={{ transition: 'fill 0.3s' }} />
        <W d={'M 47,' + s1Y + ' H ' + jX} val={s1} col={selColor} rgb={selRgb} />
        <W d={'M ' + jX + ',' + s1Y + ' H ' + notSX} val={s1} col={selColor} rgb={selRgb} />
        <circle cx={jX} cy={s1Y} r={3} fill={s1 ? selColor : 'rgba(' + selRgb + ',0.25)'} style={{ transition: 'fill 0.3s' }} />
        <W d={'M 47,' + s2Y + ' H ' + jX} val={s2} col={selColor} rgb={selRgb} />
        <W d={'M ' + jX + ',' + s2Y + ' H ' + notSX} val={s2} col={selColor} rgb={selRgb} />
        <circle cx={jX} cy={s2Y} r={3} fill={s2 ? selColor : 'rgba(' + selRgb + ',0.25)'} style={{ transition: 'fill 0.3s' }} />

        {/* NOT GATES */}
        <NotGate sx={notSX} ty={s0Y - 16} by={s0Y + 16} my={s0Y} glow={notSt[0].glow} fill={notSt[0].fill} stroke={notSt[0].stroke} />
        <NotGate sx={notSX} ty={s1Y - 16} by={s1Y + 16} my={s1Y} glow={notSt[1].glow} fill={notSt[1].fill} stroke={notSt[1].stroke} />
        <NotGate sx={notSX} ty={s2Y - 16} by={s2Y + 16} my={s2Y} glow={notSt[2].glow} fill={notSt[2].fill} stroke={notSt[2].stroke} />

        {/* OVERLINE LABELS */}
        <OverlineLabel x={146} y={s0Y - 8} text="S0" color={s0pLC} />
        <OverlineLabel x={146} y={s1Y - 8} text="S1" color={s1pLC} />
        <OverlineLabel x={146} y={s2Y - 8} text="S2" color={s2pLC} />

        {/* SELECT BUS TRUNKS */}
        <W d={'M 140,' + s2Y + ' H ' + s2pX + ' V ' + decG[3].topIn} val={s2Not} col={not3Color} rgb={not3Rgb} />
        <W d={'M ' + jX + ',' + s2Y + ' V 170 H ' + s2dX + ' V ' + decG[7].topIn} val={s2} col={selColor} rgb={selRgb} />
        <W d={'M 140,' + s1Y + ' H ' + s1pX + ' V ' + decG[5].midIn} val={s1Not} col={not2Color} rgb={not2Rgb} />
        <W d={'M ' + jX + ',' + s1Y + ' V 110 H ' + s1dX + ' V ' + decG[7].midIn} val={s1} col={selColor} rgb={selRgb} />
        <W d={'M 140,' + s0Y + ' H ' + s0pX + ' V ' + decG[6].botIn} val={s0Not} col={not1Color} rgb={not1Rgb} />
        <W d={'M ' + jX + ',' + s0Y + ' V 55 H ' + s0dX + ' V ' + decG[7].botIn} val={s0} col={selColor} rgb={selRgb} />

        {/* SELECT BUS BRANCHES */}
        {busBranches.map(function(b) {
            return <Fragment key={b.key}>
                <circle cx={b.bx} cy={b.inputY} r={2.5} fill={b.bVal ? b.bCol : 'rgba(' + b.bRgb + ',0.25)'} style={{ transition: 'fill 0.3s' }} />
                <W d={'M ' + b.bx + ',' + b.inputY + ' H ' + and3SX} val={b.bVal} col={b.dCol} rgb={b.dRgb} />
            </Fragment>;
        })}

        {/* D WIRES -> DATA AND-2 BOT INPUTS */}
        {dYs.map(function(dy, i) {
            return <W key={'dw' + i} d={'M 47,' + dy + ' H 160 V ' + (dy + 46) + ' H ' + and2SX} val={dVals[i]} col={dCols[i]} rgb={dRgbs[i]} />;
        })}

        {/* DECODE AND-3 GATES */}
        {decG.map(function(g, i) {
            return <AndGate3 key={'dec' + i} sx={and3SX} ty={g.ty} by={g.by} w={28} ar={22} glow={mkGlow(enVals[i], dRgbs[i])} fill={mkFill(enVals[i], dRgbs[i])} stroke={mkStroke(enVals[i], dCols[i])} />;
        })}

        {/* DECODE AND -> DATA AND WIRES */}
        {decG.map(function(g, i) {
            return <W key={'d2d' + i} d={'M ' + and3EX + ',' + g.my + ' H 395 V ' + datG[i].topIn + ' H ' + and2SX} val={enVals[i]} col={dCols[i]} rgb={dRgbs[i]} />;
        })}

        {/* DATA AND-2 GATES */}
        {datG.map(function(g, i) {
            return <AndGate2 key={'dat' + i} sx={and2SX} ty={g.ty} by={g.by} w={24} ar={18} glow={mkGlow(gVals[i], dRgbs[i])} fill={mkFill(gVals[i], dRgbs[i])} stroke={mkStroke(gVals[i], dCols[i])} />;
        })}

        {/* DATA AND OUTPUTS -> OR TREE */}
        <W d={'M ' + and2EX + ',' + datG[0].my + ' H 492 V ' + (or01MY - orHH) + ' H ' + or1SX} val={gVals[0]} col={dCols[0]} rgb={dRgbs[0]} />
        <W d={'M ' + and2EX + ',' + datG[1].my + ' H 492 V ' + (or01MY + orHH) + ' H ' + or1SX} val={gVals[1]} col={dCols[1]} rgb={dRgbs[1]} />
        <W d={'M ' + and2EX + ',' + datG[2].my + ' H 492 V ' + (or23MY - orHH) + ' H ' + or1SX} val={gVals[2]} col={dCols[2]} rgb={dRgbs[2]} />
        <W d={'M ' + and2EX + ',' + datG[3].my + ' H 492 V ' + (or23MY + orHH) + ' H ' + or1SX} val={gVals[3]} col={dCols[3]} rgb={dRgbs[3]} />
        <W d={'M ' + and2EX + ',' + datG[4].my + ' H 492 V ' + (or45MY - orHH) + ' H ' + or1SX} val={gVals[4]} col={dCols[4]} rgb={dRgbs[4]} />
        <W d={'M ' + and2EX + ',' + datG[5].my + ' H 492 V ' + (or45MY + orHH) + ' H ' + or1SX} val={gVals[5]} col={dCols[5]} rgb={dRgbs[5]} />
        <W d={'M ' + and2EX + ',' + datG[6].my + ' H 492 V ' + (or67MY - orHH) + ' H ' + or1SX} val={gVals[6]} col={dCols[6]} rgb={dRgbs[6]} />
        <W d={'M ' + and2EX + ',' + datG[7].my + ' H 492 V ' + (or67MY + orHH) + ' H ' + or1SX} val={gVals[7]} col={dCols[7]} rgb={dRgbs[7]} />

        {/* OR GATES LAYER 1 */}
        <OrGate sx={or1SX} ty={or01MY - orHH} by={or01MY + orHH} my={or01MY} ex={or1EX} glow={mkGlow(or01Val, orRgb)} fill={mkFill(or01Val, orRgb)} stroke={mkStroke(or01Val, orColor)} />
        <OrGate sx={or1SX} ty={or23MY - orHH} by={or23MY + orHH} my={or23MY} ex={or1EX} glow={mkGlow(or23Val, orRgb)} fill={mkFill(or23Val, orRgb)} stroke={mkStroke(or23Val, orColor)} />
        <OrGate sx={or1SX} ty={or45MY - orHH} by={or45MY + orHH} my={or45MY} ex={or1EX} glow={mkGlow(or45Val, orRgb)} fill={mkFill(or45Val, orRgb)} stroke={mkStroke(or45Val, orColor)} />
        <OrGate sx={or1SX} ty={or67MY - orHH} by={or67MY + orHH} my={or67MY} ex={or1EX} glow={mkGlow(or67Val, orRgb)} fill={mkFill(or67Val, orRgb)} stroke={mkStroke(or67Val, orColor)} />

        {/* OR TREE L1 -> L2 */}
        <W d={'M ' + or1EX + ',' + or01MY + ' H 610 V ' + (or0123MY - orHH) + ' H ' + or2SX} val={or01Val} col={orColor} rgb={orRgb} />
        <W d={'M ' + or1EX + ',' + or23MY + ' H 610 V ' + (or0123MY + orHH) + ' H ' + or2SX} val={or23Val} col={orColor} rgb={orRgb} />
        <W d={'M ' + or1EX + ',' + or45MY + ' H 610 V ' + (or4567MY - orHH) + ' H ' + or2SX} val={or45Val} col={orColor} rgb={orRgb} />
        <W d={'M ' + or1EX + ',' + or67MY + ' H 610 V ' + (or4567MY + orHH) + ' H ' + or2SX} val={or67Val} col={orColor} rgb={orRgb} />

        {/* OR GATES LAYER 2 */}
        <OrGate sx={or2SX} ty={or0123MY - orHH} by={or0123MY + orHH} my={or0123MY} ex={or2EX} glow={mkGlow(or0123Val, orRgb)} fill={mkFill(or0123Val, orRgb)} stroke={mkStroke(or0123Val, orColor)} />
        <OrGate sx={or2SX} ty={or4567MY - orHH} by={or4567MY + orHH} my={or4567MY} ex={or2EX} glow={mkGlow(or4567Val, orRgb)} fill={mkFill(or4567Val, orRgb)} stroke={mkStroke(or4567Val, orColor)} />

        {/* OR TREE L2 -> L3 */}
        <W d={'M ' + or2EX + ',' + or0123MY + ' H 712 V ' + (orFMY - orHH) + ' H ' + or3SX} val={or0123Val} col={orColor} rgb={orRgb} />
        <W d={'M ' + or2EX + ',' + or4567MY + ' H 712 V ' + (orFMY + orHH) + ' H ' + or3SX} val={or4567Val} col={orColor} rgb={orRgb} />

        {/* OR GATE FINAL */}
        <OrGate sx={or3SX} ty={orFMY - orHH} by={orFMY + orHH} my={orFMY} ex={or3EX} glow={mkGlow(y, orRgb)} fill={mkFill(y, orRgb)} stroke={mkStroke(y, orColor)} />

        {/* OUTPUT */}
        <line x1={or3EX} y1={orFMY} x2={outX - outNodeR} y2={outY} stroke={wc(y, orColor, orRgb)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'stroke 0.3s' }} />
        <OutputNode ox={outX} oy={outY} val={y} label="Y" color={orColor} rgb={orRgb} />

        {/* GATE LABELS */}
        {dYs.map(function(dy, i) {
            return <text key={'lbl' + i} x={(and2EX + 492) / 2} y={datG[i].my - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="bold" fill={gVals[i] ? dCols[i] : '#475569'} style={{ transition: 'fill 0.3s' }}>
                {'D' + i}
            </text>;
        })}
    </svg>;
}

function NotGate(props) {
    var sx = props.sx, ty = props.ty, by = props.by, my = props.my;
    return <Fragment>
        <path d={'M ' + sx + ',' + ty + ' L ' + (sx + 30) + ',' + my + ' L ' + sx + ',' + by + ' Z'} fill={props.fill} stroke={props.stroke} strokeWidth="2" style={{ filter: props.glow, transition: 'all 0.3s' }} />
        <circle cx={sx + 35} cy={my} r={5} fill={props.fill} stroke={props.stroke} strokeWidth="2" style={{ filter: props.glow, transition: 'all 0.3s' }} />
    </Fragment>;
}

function AndGate3(props) {
    var sx = props.sx, ty = props.ty, by = props.by, w = props.w, ar = props.ar;
    return <path d={'M ' + sx + ',' + ty + ' L ' + (sx + w) + ',' + ty + ' A ' + ar + ',' + ar + ' 0 0,1 ' + (sx + w) + ',' + by + ' L ' + sx + ',' + by + ' Z'} fill={props.fill} stroke={props.stroke} strokeWidth="2" style={{ filter: props.glow, transition: 'all 0.3s' }} />;
}

function AndGate2(props) {
    var sx = props.sx, ty = props.ty, by = props.by, w = props.w, ar = props.ar;
    return <path d={'M ' + sx + ',' + ty + ' L ' + (sx + w) + ',' + ty + ' A ' + ar + ',' + ar + ' 0 0,1 ' + (sx + w) + ',' + by + ' L ' + sx + ',' + by + ' Z'} fill={props.fill} stroke={props.stroke} strokeWidth="2" style={{ filter: props.glow, transition: 'all 0.3s' }} />;
}

function OrGate(props) {
    var sx = props.sx, ty = props.ty, by = props.by, my = props.my, ex = props.ex;
    return <path d={'M ' + sx + ',' + ty + ' C ' + (sx + 14) + ',' + ty + ' ' + (ex - 12) + ',' + (my - 6) + ' ' + ex + ',' + my + ' C ' + (ex - 12) + ',' + (my + 6) + ' ' + (sx + 14) + ',' + by + ' ' + sx + ',' + by + ' C ' + (sx + 10) + ',' + (my + 5) + ' ' + (sx + 10) + ',' + (my - 5) + ' ' + sx + ',' + ty + ' Z'} fill={props.fill} stroke={props.stroke} strokeWidth="2" style={{ filter: props.glow, transition: 'all 0.3s' }} />;
}

function InputNode(props) {
    var ix = props.ix, iy = props.iy, val = props.val, label = props.label, onToggle = props.onToggle, color = props.color, rgb = props.rgb;
    return <g onClick={onToggle} style={{ cursor: 'pointer' }}>
        <rect x={ix} y={iy - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={val ? 'rgba(' + rgb + ',0.2)' : 'rgba(' + rgb + ',0.1)'} stroke={val ? color : 'rgba(' + rgb + ',0.3)'} strokeWidth="1.5" style={{ transition: 'all 0.25s' }} />
        <text x={ix + 24} y={iy - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">{label}</text>
        <circle cx={ix + 24} cy={iy} r={nodeR} fill={val ? color : 'rgba(' + rgb + ',0.15)'} stroke={val ? color : 'rgba(' + rgb + ',0.4)'} strokeWidth="1.5" style={{ filter: val ? 'drop-shadow(0 0 5px rgba(' + rgb + ',0.8))' : 'none', transition: 'all 0.25s' }} />
        <text x={ix + 24} y={iy + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={val ? color : 'rgba(' + rgb + ',0.5)'}>{val ? '1' : '0'}</text>
    </g>;
}

function OutputNode(props) {
    var ox = props.ox, oy = props.oy, val = props.val, label = props.label, color = props.color, rgb = props.rgb;
    return <Fragment>
        <text x={ox} y={oy - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">{label}</text>
        <circle cx={ox} cy={oy} r={outNodeR} fill={val ? color : '#1e293b'} stroke={val ? color : '#334155'} strokeWidth="2" style={{ filter: val ? 'drop-shadow(0 0 8px rgba(' + rgb + ',0.9)) drop-shadow(0 0 18px rgba(' + rgb + ',0.5))' : 'none', transition: 'all 0.3s' }} />
        <text x={ox} y={oy + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={val ? '#000' : '#475569'} style={{ transition: 'fill 0.3s' }}>{val ? '1' : '0'}</text>
    </Fragment>;
}

function W(props) {
    var d = props.d, val = props.val, col = props.col, rgb = props.rgb;
    return <path d={d} fill="none" stroke={val ? col : 'rgba(' + rgb + ',0.25)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.3s' }} />;
}

function OverlineLabel(props) {
    var x = props.x, y = props.y, text = props.text, color = props.color;
    return <Fragment>
        <text x={x} y={y} textAnchor="start" fontFamily="Orbitron,sans-serif" fontSize="7" fontWeight="bold" fill={color} style={{ transition: 'fill 0.3s' }}>{text}</text>
        <line x1={x} y1={y - 7} x2={x + 12} y2={y - 7} stroke={color} strokeWidth="1.2" style={{ transition: 'stroke 0.3s' }} />
    </Fragment>;
}
