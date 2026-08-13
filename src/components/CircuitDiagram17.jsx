import { Fragment } from 'react';
import ICBlockRef from './ICBlockRef';
import { hexToRgbStr } from '../utils/colorHelper';

// Card 17 — SR Flip-Flop
// SR Latch (Card 15) yang digerbang CLK — mirip Gated D Latch (Card 16), TAPI
// gating-nya langsung dari 2 input asli S, R (BUKAN diturunkan dari D seperti
// Card 16). Tidak ada NOT gate sama sekali di sini.
//
// Logika:
//   S_gated = S AND CLK (AND1)
//   R_gated = R AND CLK (AND2)
//   S_gated, R_gated masuk IC Block SR Latch (Card 15) -> Q, Q̄ keluar.
//
// Mode (4-mode, BUKAN 2-mode Gated D Latch) — diturunkan dari S_gated, R_gated:
//   S_gated=1, R_gated=0 -> SET
//   S_gated=0, R_gated=1 -> RESET
//   S_gated=0, R_gated=0 -> HOLD  (mencakup CLK=0 kondisi apapun, DAN CLK=1 dgn S=0,R=0)
//   S_gated=1, R_gated=1 -> INVALID (hanya mungkin saat CLK=1 DAN S=1 DAN R=1 bersamaan)
export default function CircuitDiagram17({ s, r, clk, q, qBar, mode, onToggleS, onToggleR, onToggleClk }) {
    // ── Color palette (per design.md 3.5.2 + konvensi sekuensial Card 15/16) ──
    // S = hijau (Prinsip 1) — sinyal data utama (input pertama), sepanjang jalur.
    // Konsisten dengan S di CircuitDiagram_SRLatch.jsx.
    const sCol = '#4ade80', sRgb = hexToRgbStr(sCol);
    // R = cyan — sinyal kontrol (Prinsip 4: warna unik, bukan hijau).
    // Konsisten dengan R di CircuitDiagram_SRLatch.jsx.
    const rCol = '#22d3ee', rRgb = hexToRgbStr(rCol);
    // CLK = amber/kuning — sinyal kontrol tambahan (Prinsip 4: warna unik,
    // bukan hijau/cyan). Konsisten dengan CLK di Card 16.
    const clkCol = '#facc15', clkRgb = hexToRgbStr(clkCol);
    // Output S_gated, R_gated dari AND1/AND2 = hijau (Prinsip 6: output gerbang = hijau).
    // Walau sumber R cyan, output AND2 tetap hijau — sama seperti Card 16 AND2
    // yang outputnya hijau walau sumbernya D̄ merah.
    // Output Q = hijau (sesuai Card 15). Q̄ = pink (sesuai Card 15).
    const qOutCol = '#4ade80', qOutRgb = hexToRgbStr(qOutCol);
    const qBarOutCol = '#f472b6', qBarOutRgb = hexToRgbStr(qBarOutCol);

    // ── Helper functions (pola CircuitDiagram_SRLatch / Card 16) ──
    const wc = (val, col, rgb) => val ? col : 'rgba(' + rgb + ',0.25)';
    const mkGlow = (val, rgb) => val
        ? 'drop-shadow(0 0 4px rgba(' + rgb + ',0.9)) drop-shadow(0 0 10px rgba(' + rgb + ',0.5))'
        : 'none';
    const mkFill = (val, rgb) => val ? 'rgba(' + rgb + ',0.13)' : '#0f172a';
    const mkStroke = (val, col) => val ? col : '#475569';

    // ── Layout constants ──
    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 15;

    // Tanpa NOT gate, layout sedikit lebih ringkas dari Card 16 (svgH=320 vs 360).
    const svgW = 580, svgH = 320;

    // Input nodes — S atas, CLK tengah, R bawah (jarak 50px vertikal antar input)
    const sInX = 1,   sInY = 130;    // S — atas (hijau)
    const clkInX = 1, clkInY = 180;  // CLK — tengah (amber)
    const rInX = 1,   rInY = 230;    // R — bawah (cyan)

    // Fan-out junctions — X lanes unik supaya tidak ada overlap searah:
    // S di x=80, R di x=100, CLK di x=110 (di luar range S/R trunk →
    // CLK branch up/down tidak menyilang S/R trunk secara perpendicular pun).
    const sJunctionX = 80;
    const rJunctionX = 100;
    const clkJunctionX = 110;

    // AND gates (mirror Card 16: AND1 atas, AND2 bawah)
    const andSx = 210, andW = 45; // 30 rect + 15 radius
    const and1My = 105, and1Ty = and1My - 15, and1By = and1My + 15;
    const and1ExitX = andSx + andW; // 255
    const and1TopY = and1My - 10, and1BotY = and1My + 10; // 95, 115

    const and2My = 255, and2Ty = and2My - 15, and2By = and2My + 15;
    const and2ExitX = andSx + andW;
    const and2TopY = and2My - 10, and2BotY = and2My + 10; // 245, 265

    // S/R wire lanes (vertical lane x=360 — S atas 105→161, R bawah 255→179 — no overlap Y)
    const srLaneX = 360;

    // ICBlockRef (SR Latch Card 15 reference) — SAMA PERSIS panggilannya seperti Card 16
    const icX = 380, icY = 130, icW = 110, icH = 80;
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
    const sGated = s && clk;   // S_gated = S AND CLK
    const rGated = r && clk;   // R_gated = R AND CLK

    // AND gate glow/fill/stroke (mengikuti nilai output S_gated/R_gated)
    const and1Glow = mkGlow(sGated, sRgb), and1Fill = mkFill(sGated, sRgb), and1Stroke = mkStroke(sGated, sCol);
    const and2Glow = mkGlow(rGated, sRgb), and2Fill = mkFill(rGated, sRgb), and2Stroke = mkStroke(rGated, sCol);

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

    // ── Mode badge (4-mode, reuse pola CircuitCard_SRLatch) ──
    const modeColors = {
        SET:     { bg: 'rgba(74,222,128,0.18)',  border: 'rgba(74,222,128,0.5)',  text: '#4ade80' },
        RESET:   { bg: 'rgba(34,211,238,0.18)',  border: 'rgba(34,211,238,0.5)',  text: '#22d3ee' },
        HOLD:    { bg: 'rgba(250,204,21,0.18)',  border: 'rgba(250,204,21,0.5)',  text: '#facc15' },
        INVALID: { bg: 'rgba(239,68,68,0.18)',   border: 'rgba(239,68,68,0.5)',   text: '#ef4444' },
    };
    const mc = modeColors[mode] || modeColors.HOLD;

    // ── Wire paths ──
    // S main trunk: input → junction
    const wireStrunk = 'M ' + (sInX + inputNodeW) + ',' + sInY + ' H ' + sJunctionX;
    // S branch: junction → AND1 top input (210, 95). S junction y=130 naik ke y=95 lalu H ke 210.
    const wireS_branch = 'M ' + sJunctionX + ',' + sInY + ' V ' + and1TopY + ' H ' + andSx;

    // R main trunk: input → junction
    const wireRtrunk = 'M ' + (rInX + inputNodeW) + ',' + rInY + ' H ' + rJunctionX;
    // R branch: junction → AND2 top input (210, 245). R junction y=230 turun ke y=245 lalu H ke 210.
    const wireR_branch = 'M ' + rJunctionX + ',' + rInY + ' V ' + and2TopY + ' H ' + andSx;

    // CLK main trunk: input → junction
    const wireClkTrunk = 'M ' + (clkInX + inputNodeW) + ',' + clkInY + ' H ' + clkJunctionX;
    // CLK branch up: junction → AND1 bot input (210, 115)
    const wireClk_up = 'M ' + clkJunctionX + ',' + clkInY + ' V ' + and1BotY + ' H ' + andSx;
    // CLK branch down: junction → AND2 bot input (210, 265)
    const wireClk_dn = 'M ' + clkJunctionX + ',' + clkInY + ' V ' + and2BotY + ' H ' + andSx;

    // S_gated wire: AND1 exit → IC S pin
    const wireSg = 'M ' + (and1ExitX + 6) + ',' + and1My + ' H ' + srLaneX + ' V ' + icPinS_Y + ' H ' + icX;

    // R_gated wire: AND2 exit → IC R pin
    const wireRg = 'M ' + (and2ExitX + 6) + ',' + and2My + ' H ' + srLaneX + ' V ' + icPinR_Y + ' H ' + icX;

    // Q wire: IC Q pin → Q output node
    const wireQ = 'M ' + icOutExitX + ',' + icOutQ_Y + ' H ' + qqBarLaneX + ' V ' + qOutY + ' H ' + (qOutX - outNodeR);

    // Q̄ wire: IC Q̄ pin → Q̄ output node
    const wireQbar = 'M ' + icOutExitX + ',' + icOutQbar_Y + ' H ' + qqBarLaneX + ' V ' + qBarOutY + ' H ' + (qBarOutX - outNodeR);

    return <svg viewBox={'0 0 ' + svgW + ' ' + svgH} width="100%" style={{ overflow: 'visible', display: 'block' }}>
        {/* Mode badge */}
        <rect x={svgW / 2 - 55} y={4} width={110} height={22} rx={6} fill={mc.bg} stroke={mc.border} strokeWidth="1.5" />
        <text x={svgW / 2} y={19} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="700" fill={mc.text}>{'MODE: ' + mode}</text>

        {/* Input nodes */}
        <InputNode ix={sInX}   iy={sInY}   val={s}   label="S (SET)"    onToggle={onToggleS}   color={sCol}   rgb={sRgb} />
        <InputNode ix={clkInX} iy={clkInY} val={clk} label="CLK"        onToggle={onToggleClk} color={clkCol} rgb={clkRgb} />
        <InputNode ix={rInX}   iy={rInY}   val={r}   label="R (RESET)"  onToggle={onToggleR}   color={rCol}   rgb={rRgb} />

        {/* S fan-out wires (green) — hanya 1 branch ke AND1 top (no fan-out, tapi junction dot tetap untuk konsistensi visual) */}
        <W d={wireStrunk}    val={s} col={sCol} rgb={sRgb} />
        <W d={wireS_branch}  val={s} col={sCol} rgb={sRgb} />

        {/* R fan-out wires (cyan) */}
        <W d={wireRtrunk}    val={r} col={rCol} rgb={rRgb} />
        <W d={wireR_branch}  val={r} col={rCol} rgb={rRgb} />

        {/* CLK fan-out wires (amber) — 2 branch ke AND1 bot & AND2 bot */}
        <W d={wireClkTrunk} val={clk} col={clkCol} rgb={clkRgb} />
        <W d={wireClk_up}   val={clk} col={clkCol} rgb={clkRgb} />
        <W d={wireClk_dn}   val={clk} col={clkCol} rgb={clkRgb} />
        {/* CLK junction dot (karena CLK bercabang 2) */}
        <circle cx={clkJunctionX} cy={clkInY} r={3.5} fill={wc(clk, clkCol, clkRgb)} style={{ transition: 'fill 0.3s' }} />

        {/* AND1 gate (S_gated = S AND CLK) */}
        <AndGate sx={andSx} ty={and1Ty} by={and1By} my={and1My} ex={and1ExitX}
            glow={and1Glow} fill={and1Fill} stroke={and1Stroke} />
        <text x={andSx - 6} y={and1My + 3} textAnchor="end" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={sGated ? sCol : '#475569'} style={{ transition: 'fill 0.3s' }}>AND1</text>
        {/* S_gated label di output AND1 — pakai label singkat "S" (pola Card 16) */}
        <text x={and1ExitX + 12} y={and1My - 8} textAnchor="start" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="600"
            fill={sGated ? sCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>S</text>

        {/* AND2 gate (R_gated = R AND CLK) */}
        <AndGate sx={andSx} ty={and2Ty} by={and2By} my={and2My} ex={and2ExitX}
            glow={and2Glow} fill={and2Fill} stroke={and2Stroke} />
        <text x={andSx - 6} y={and2My + 3} textAnchor="end" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={rGated ? sCol : '#475569'} style={{ transition: 'fill 0.3s' }}>AND2</text>
        {/* R_gated label di output AND2 — pakai label singkat "R" (pola Card 16) */}
        <text x={and2ExitX + 12} y={and2My - 8} textAnchor="start" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="600"
            fill={rGated ? sCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>R</text>

        {/* S_gated, R_gated wires (green, masuk IC) */}
        <W d={wireSg} val={sGated} col={sCol} rgb={sRgb} />
        <W d={wireRg} val={rGated} col={sCol} rgb={sRgb} />

        {/* IC Block Reference (SR Latch Card 15) — SAMA PERSIS panggilannya seperti Card 16 */}
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
