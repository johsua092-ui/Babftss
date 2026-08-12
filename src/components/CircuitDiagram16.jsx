import { Fragment } from 'react';
import ICBlockRef from './ICBlockRef';
import { hexToRgbStr } from '../utils/colorHelper';

// Card 16 — Gated D Latch
// Level-sensitive (BUKAN edge-triggered). CLK=1 -> TRANSPARENT (Q ikut D), CLK=0 -> HOLD.
// Struktur: D -> fan-out (ke AND1, ke NOT) | CLK -> fan-out (ke AND1, AND2)
//           NOT -> D̄ -> AND2 | AND1=S=D AND CLK | AND2=R=D̄ AND CLK
//           S,R masuk ICBlockRef (SR Latch Card 15) -> Q, Q̄ keluar.
export default function CircuitDiagram16({ d, clk, q, qBar, mode, onToggleD, onToggleClk }) {
    // ── Color palette (per design.md 3.5.2) ──
    // D = hijau (Prinsip 1) — sinyal data utama, sepanjang jalur.
    const dCol = '#4ade80', dRgb = hexToRgbStr(dCol);
    // CLK = amber/kuning — sinyal kontrol (Prinsip 4: warna unik, bukan hijau/merah/pink).
    const clkCol = '#facc15', clkRgb = hexToRgbStr(clkCol);
    // NOT output (D̄) = merah (Prinsip 2) di badan NOT + trunk keluar;
    //   berubah hijau (Prinsip 3) saat masuk AND2 input.
    const notCol = '#f87171', notRgb = hexToRgbStr(notCol);
    // Output S, R dari AND1/AND2 = hijau (Prinsip 6: output gerbang = hijau).
    // Output Q = hijau (sesuai Card 15). Q̄ = pink (sesuai Card 15).
    const qOutCol = '#4ade80', qOutRgb = hexToRgbStr(qOutCol);
    const qBarOutCol = '#f472b6', qBarOutRgb = hexToRgbStr(qBarOutCol);

    // ── Helper functions (pola CircuitDiagram_SRLatch) ──
    const wc = (val, col, rgb) => val ? col : 'rgba(' + rgb + ',0.25)';
    const mkGlow = (val, rgb) => val
        ? 'drop-shadow(0 0 4px rgba(' + rgb + ',0.9)) drop-shadow(0 0 10px rgba(' + rgb + ',0.5))'
        : 'none';
    const mkFill = (val, rgb) => val ? 'rgba(' + rgb + ',0.13)' : '#0f172a';
    const mkStroke = (val, col) => val ? col : '#475569';

    // ── Layout constants ──
    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 15;

    const svgW = 580, svgH = 360;

    // Input nodes
    const dInX = 1, dInY = 130;       // D — atas
    const clkInX = 1, clkInY = 230;   // CLK — bawah

    // Fan-out junctions (X lanes unik: D di x=80, CLK di x=90 — hindari overlap)
    const dJunctionX = 80, clkJunctionX = 90;

    // NOT gate (di tengah, menerima D turun dari junction)
    const notInX = 155, notMy = 175;
    const notTipX = 195, notBubbleX = 199, notExitX = 203;
    const notTy = notMy - 15, notBy = notMy + 15;

    // AND gates (mirip Card 15 NOR layout: AND1 atas, AND2 bawah)
    const andSx = 210, andW = 45; // 30 rect + 15 radius
    const and1My = 105, and1Ty = and1My - 15, and1By = and1My + 15;
    const and1ExitX = andSx + andW; // 255
    const and1TopY = and1My - 10, and1BotY = and1My + 10;

    const and2My = 245, and2Ty = and2My - 15, and2By = and2My + 15;
    const and2ExitX = andSx + andW;
    const and2TopY = and2My - 10, and2BotY = and2My + 10;

    // S/R wire lanes (vertical lane x=360 — S atas 105→161, R bawah 245→179 — no overlap)
    const srLaneX = 360;

    // ICBlockRef (SR Latch Card 15 reference)
    const icX = 380, icY = 130, icW = 110, icH = 80;
    // Pin Y computed per ICBlockRef internal logic (mirror it for wire endpoints)
    // pinSpacing = min(18, (icH-20)/2) = min(18, 30) = 18
    // inputStartY = icY + (icH - 36)/2 + 9 = 130 + 22 + 9 = 161
    // S pin Y = 161, R pin Y = 179. Output Q pin Y = 161, Q̄ pin Y = 179.
    const icPinS_Y = 161, icPinR_Y = 179;
    const icOutQ_Y = 161, icOutQbar_Y = 179;
    const icOutExitX = icX + icW + 12; // 502

    // Q/Q̄ output wires — lane x=520 (Q goes up 161→130, Q̄ goes down 179→230 — no overlap)
    const qqBarLaneX = 520;
    const qOutX = 550, qOutY = 130;
    const qBarOutX = 550, qBarOutY = 230;

    // Derived sinyal internal (untuk glow gate)
    const s = d && clk;        // S = D AND CLK
    const r = !d && clk;       // R = (NOT D) AND CLK = D̄ AND CLK
    const dBar = !d;           // D̄ (output NOT)

    // AND gate glow/fill/stroke (mengikuti nilai output S/R)
    const and1Glow = mkGlow(s, dRgb), and1Fill = mkFill(s, dRgb), and1Stroke = mkStroke(s, dCol);
    const and2Glow = mkGlow(r, dRgb), and2Fill = mkFill(r, dRgb), and2Stroke = mkStroke(r, dCol);
    // NOT gate glow/fill/stroke (mengikuti nilai D̄ output NOT)
    const notGlow = mkGlow(dBar, notRgb), notFill = mkFill(dBar, notRgb), notStroke = mkStroke(dBar, notCol);

    // ── Komponen reusable ──
    const InputNode = ({ ix, iy, val, label, onToggle, color, rgb }) => <g onClick={onToggle} style={{ cursor: 'pointer' }}>
        <rect x={ix} y={iy - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx}
            fill={val ? 'rgba(' + rgb + ',0.2)' : 'rgba(' + rgb + ',0.1)'}
            stroke={val ? color : 'rgba(' + rgb + ',0.3)'} strokeWidth="1.5" style={{ transition: 'all 0.25s' }} />
        <text x={ix + 24} y={iy - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#e2e8f0">{label}</text>
        <circle cx={ix + 24} cy={iy} r={nodeR}
            fill={val ? color : 'rgba(' + rgb + ',0.15)'}
            stroke={val ? color : 'rgba(' + rgb + ',0.4)'} strokeWidth="1.5"
            style={{ filter: val ? 'drop-shadow(0 0 5px rgba(' + rgb + ',0.8))' : 'none', transition: 'all 0.25s' }} />
        <text x={ix + 24} y={iy + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold"
            fill={val ? color : 'rgba(' + rgb + ',0.5)'}>{val ? '1' : '0'}</text>
    </g>;

    const OutputNode = ({ ox, oy, val, label, color, rgb, overline }) => {
        const ly = oy - outNodeR - 8;
        return <Fragment>
            {overline
                ? <g>
                    <text x={ox} y={ly} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="12" fontWeight="700" fill="#cbd5e1">Q</text>
                    <line x1={ox - 7} y1={ly - 11} x2={ox + 7} y2={ly - 11} stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                  </g>
                : <text x={ox} y={ly} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="12" fontWeight="700" fill="#cbd5e1">{label}</text>}
            <circle cx={ox} cy={oy} r={outNodeR}
                fill={val ? color : '#1e293b'}
                stroke={val ? color : '#334155'} strokeWidth="2"
                style={{ filter: val ? 'drop-shadow(0 0 8px rgba(' + rgb + ',0.9)) drop-shadow(0 0 18px rgba(' + rgb + ',0.5))' : 'none', transition: 'all 0.3s' }} />
            <text x={ox} y={oy} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="13" fontWeight="800"
                fill={val ? '#ffffff' : '#64748b'} style={{ transition: 'fill 0.3s', dominantBaseline: 'central' }}>{val ? '1' : '0'}</text>
        </Fragment>;
    };

    const W = ({ d, val, col, rgb }) => <path d={d} fill="none" stroke={wc(val, col, rgb)} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.3s' }} />;

    // AND gate (D-shape: flat back, semicircle front, no bubble)
    const AndGate = ({ sx, ty, by, my, ex, glow, fill, stroke }) => <path
        d={'M ' + sx + ',' + ty + ' L ' + (sx + 30) + ',' + ty +
           ' A 15,15 0 0 1 ' + (sx + 30) + ',' + by +
           ' L ' + sx + ',' + by + ' Z'}
        fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />;

    // NOT gate (segitiga + bubble)
    const NotGate = ({ sx, ty, by, my, tipX, bubbleX, glow, fill, stroke }) => <Fragment>
        <path d={'M ' + sx + ',' + ty + ' L ' + tipX + ',' + my + ' L ' + sx + ',' + by + ' Z'}
            fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
        <circle cx={bubbleX} cy={my} r="4" fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
    </Fragment>;

    // ── Mode badge ──
    const modeColors = {
        TRANSPARENT: { bg: 'rgba(74,222,128,0.18)', border: 'rgba(74,222,128,0.5)', text: '#4ade80' },
        HOLD:        { bg: 'rgba(250,204,21,0.18)', border: 'rgba(250,204,21,0.5)', text: '#facc15' },
    };
    const mc = modeColors[mode] || modeColors.HOLD;

    // ── Wire paths ──
    // D main trunk: input → junction
    const wireDtrunk = 'M ' + (dInX + inputNodeW) + ',' + dInY + ' H ' + dJunctionX;
    // D branch up: ke AND1 top input (210, 95)
    const wireD_up = 'M ' + dJunctionX + ',' + dInY + ' V ' + and1TopY + ' H ' + andSx;
    // D branch down: ke NOT input (155, 175)
    const wireD_dn = 'M ' + dJunctionX + ',' + dInY + ' V ' + notMy + ' H ' + notInX;

    // CLK main trunk
    const wireClkTrunk = 'M ' + (clkInX + inputNodeW) + ',' + clkInY + ' H ' + clkJunctionX;
    // CLK branch up: ke AND1 bottom input (210, 115)
    const wireClk_up = 'M ' + clkJunctionX + ',' + clkInY + ' V ' + and1BotY + ' H ' + andSx;
    // CLK branch down: ke AND2 bottom input (210, 255)
    const wireClk_dn = 'M ' + clkJunctionX + ',' + clkInY + ' V ' + and2BotY + ' H ' + andSx;

    // D̄ wire: red segment (NOT exit → trunk) + green segment (trunk → AND2 top input)
    const wireDbar_red = 'M ' + notExitX + ',' + notMy + ' V 215'; // red trunk pendek
    const wireDbar_grn = 'M ' + notExitX + ',215 V ' + and2TopY + ' H ' + andSx; // green branch masuk AND2

    // S wire: AND1 exit → IC S pin
    const wireS = 'M ' + (and1ExitX + 6) + ',' + and1My + ' H ' + srLaneX + ' V ' + icPinS_Y + ' H ' + icX;

    // R wire: AND2 exit → IC R pin
    const wireR = 'M ' + (and2ExitX + 6) + ',' + and2My + ' H ' + srLaneX + ' V ' + icPinR_Y + ' H ' + icX;

    // Q wire: IC Q pin → Q output node
    const wireQ = 'M ' + icOutExitX + ',' + icOutQ_Y + ' H ' + qqBarLaneX + ' V ' + qOutY + ' H ' + (qOutX - outNodeR);

    // Q̄ wire: IC Q̄ pin → Q̄ output node
    const wireQbar = 'M ' + icOutExitX + ',' + icOutQbar_Y + ' H ' + qqBarLaneX + ' V ' + qBarOutY + ' H ' + (qBarOutX - outNodeR);

    return <svg viewBox={'0 0 ' + svgW + ' ' + svgH} width="100%" style={{ overflow: 'visible', display: 'block' }}>
        {/* Mode badge */}
        <rect x={svgW / 2 - 55} y={4} width={110} height={22} rx={6} fill={mc.bg} stroke={mc.border} strokeWidth="1.5" />
        <text x={svgW / 2} y={19} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="700" fill={mc.text}>{'MODE: ' + mode}</text>

        {/* Input nodes */}
        <InputNode ix={dInX} iy={dInY} val={d} label="D (DATA)" onToggle={onToggleD} color={dCol} rgb={dRgb} />
        <InputNode ix={clkInX} iy={clkInY} val={clk} label="CLK" onToggle={onToggleClk} color={clkCol} rgb={clkRgb} />

        {/* D fan-out wires (green) */}
        <W d={wireDtrunk} val={d} col={dCol} rgb={dRgb} />
        <W d={wireD_up}  val={d} col={dCol} rgb={dRgb} />
        <W d={wireD_dn}  val={d} col={dCol} rgb={dRgb} />
        {/* D junction dot */}
        <circle cx={dJunctionX} cy={dInY} r={3.5} fill={wc(d, dCol, dRgb)} style={{ transition: 'fill 0.3s' }} />

        {/* CLK fan-out wires (amber) */}
        <W d={wireClkTrunk} val={clk} col={clkCol} rgb={clkRgb} />
        <W d={wireClk_up}   val={clk} col={clkCol} rgb={clkRgb} />
        <W d={wireClk_dn}   val={clk} col={clkCol} rgb={clkRgb} />
        {/* CLK junction dot */}
        <circle cx={clkJunctionX} cy={clkInY} r={3.5} fill={wc(clk, clkCol, clkRgb)} style={{ transition: 'fill 0.3s' }} />

        {/* NOT gate */}
        <NotGate sx={notInX} ty={notTy} by={notBy} my={notMy} tipX={notTipX} bubbleX={notBubbleX}
            glow={notGlow} fill={notFill} stroke={notStroke} />
        <text x={notInX - 6} y={notMy + 3} textAnchor="end" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={dBar ? notCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NOT</text>

        {/* D̄ label (overline manual: D + <line> di atas) — di sebelah trunk merah NOT */}
        <g>
            <text x={notExitX + 12} y={200} textAnchor="start" fontFamily="Inter,sans-serif" fontSize="11" fontWeight="700"
                fill={dBar ? notCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>D</text>
            <line x1={notExitX + 12} y1={189} x2={notExitX + 20} y2={189}
                stroke={dBar ? notCol : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" style={{ transition: 'stroke 0.3s' }} />
        </g>

        {/* D̄ wire (red segment dari NOT, hijau segment ke AND2) */}
        <W d={wireDbar_red} val={dBar} col={notCol} rgb={notRgb} />
        <W d={wireDbar_grn} val={dBar} col={dCol}   rgb={dRgb} />

        {/* AND1 gate (S = D AND CLK) */}
        <AndGate sx={andSx} ty={and1Ty} by={and1By} my={and1My} ex={and1ExitX}
            glow={and1Glow} fill={and1Fill} stroke={and1Stroke} />
        <text x={andSx - 6} y={and1My + 3} textAnchor="end" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={s ? dCol : '#475569'} style={{ transition: 'fill 0.3s' }}>AND1</text>
        {/* S label di output AND1 */}
        <text x={and1ExitX + 12} y={and1My - 8} textAnchor="start" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="600"
            fill={s ? dCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>S</text>

        {/* AND2 gate (R = D̄ AND CLK) */}
        <AndGate sx={andSx} ty={and2Ty} by={and2By} my={and2My} ex={and2ExitX}
            glow={and2Glow} fill={and2Fill} stroke={and2Stroke} />
        <text x={andSx - 6} y={and2My + 3} textAnchor="end" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={r ? dCol : '#475569'} style={{ transition: 'fill 0.3s' }}>AND2</text>
        {/* R label di output AND2 */}
        <text x={and2ExitX + 12} y={and2My - 8} textAnchor="start" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="600"
            fill={r ? dCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>R</text>

        {/* S, R wires (green, masuk IC) */}
        <W d={wireS} val={s} col={dCol} rgb={dRgb} />
        <W d={wireR} val={r} col={dCol} rgb={dRgb} />

        {/* IC Block Reference (SR Latch Card 15) */}
        <ICBlockRef
            targetNum="15"
            label="SR Latch"
            inputs={['S', 'R']}
            outputs={['Q', 'Q\u0304']}
            x={icX} y={icY} width={icW} height={icH}
        />

        {/* Q, Q̄ wires dari IC output pins ke output nodes */}
        <W d={wireQ}    val={q}    col={qOutCol}    rgb={qOutRgb} />
        <W d={wireQbar} val={qBar} col={qBarOutCol} rgb={qBarOutRgb} />

        {/* Output nodes */}
        <OutputNode ox={qOutX} oy={qOutY} val={q} label="Q" color={qOutCol} rgb={qOutRgb} />
        <OutputNode ox={qBarOutX} oy={qBarOutY} val={qBar} label="Q" color={qBarOutCol} rgb={qBarOutRgb} overline />
    </svg>;
}
