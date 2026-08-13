import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';
import ClockModeSwitch from './ClockModeSwitch';

// Card 17 — SR Flip-Flop
// SR Latch (Card 15) yang digerbang CLK — mirip Gated D Latch (Card 16), TAPI
// gating-nya langsung dari 2 input asli S, R (BUKAN diturunkan dari D seperti
// Card 16). Tidak ada NOT gate sama sekali di sini.
//
// Logika:
//   S_gated = S AND CLK (AND1)
//   R_gated = R AND CLK (AND2)
//   S_gated, R_gated masuk 2 NOR gates cross-coupled (SR Latch inline, BUKAN
//   ICBlockRef — sama seperti Card 16 versi baru):
//     NOR1 (top): input top = Q̄_feedback, input bottom = R_gated -> output = Q
//     NOR2 (bot): input top = S_gated, input bottom = Q_feedback -> output = Q̄
//     (NOR komutatif — swap input posisi untuk routing wire lebih bersih,
//      menghindari wire overlap horizontal di area y≈245-255.)
//   Q, Q̄ keluar ke output nodes.
//
// Mode (4-mode, BUKAN 2-mode Gated D Latch) — diturunkan dari S_gated, R_gated:
//   S_gated=1, R_gated=0 -> SET
//   S_gated=0, R_gated=1 -> RESET
//   S_gated=0, R_gated=0 -> HOLD  (mencakup CLK=0 kondisi apapun, DAN CLK=1 dgn S=0,R=0)
//   S_gated=1, R_gated=1 -> INVALID (hanya mungkin saat CLK=1 DAN S=1 DAN R=1 bersamaan)
//
// Catatan desain (Bagian 25 memory.md): kotak ICBlockRef diganti dengan 2 NOR
// gates yang digambar langsung — permintaan user: "isinya sangat simpel hanya 2
// gerbang logika saja". Konsisten dengan CircuitDiagram_SRLatch (Card 15).
export default function CircuitDiagram17({ s, r, clk, q, qBar, mode, onToggleS, onToggleR, onToggleClk, clockMode, autoActive, onClockModeChange }) {
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
    // NOR gate body = pink (design.md 1.5 — NOR pink #f472b6).
    // Glow/fill NOR1 mengikuti Q; NOR2 mengikuti Q̄. (Pola CircuitDiagram_SRLatch.)
    const norCol = '#f472b6', norRgb = hexToRgbStr(norCol);
    // Feedback wire colors (pola CircuitDiagram_SRLatch):
    //   Q feedback  = oranye (#fb923c) — distinct dari output wires.
    //   Q̄ feedback = ungu   (#a78bfa) — distinct dari output wires.
    const qFbCol = '#fb923c', qFbRgb = hexToRgbStr(qFbCol);
    const qBarFbCol = '#a78bfa', qBarFbRgb = hexToRgbStr(qBarFbCol);
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

    // svgH diperbesar dari 320 → 340 untuk memberi ruang bagi ClockModeSwitch
    // di bawah tombol CLK (y=263..285).
    const svgW = 580, svgH = 340;

    // Input nodes — S atas, R tengah, CLK BAWAH (reorder dari versi lama S/CLK/R
    // ke S/R/CLK supaya ClockModeSwitch bisa dirender tepat di bawah tombol CLK,
    // sesuai aturan design.md Bagian 29: "switch WAJIB di bawah tombol clock").
    const sInX = 1,   sInY = 130;    // S — atas (hijau)
    const rInX = 1,   rInY = 180;    // R — tengah (cyan)
    const clkInX = 1, clkInY = 230;  // CLK — bawah (amber)

    // Fan-out junctions — X lanes diberi jarak 30px (dari 20/10px) supaya
    // vertical wires S/R/CLK tidak terlihat menumpuk. Pola yang sama dengan
    // fix v3 Card 16 (D/CLK junction spacing 25px).
    const sJunctionX = 75;
    const rJunctionX = 105;
    const clkJunctionX = 135;

    // AND gates (mirror Card 16: AND1 atas, AND2 bawah)
    const andSx = 210, andW = 45; // 30 rect + 15 radius
    const and1My = 105, and1Ty = and1My - 15, and1By = and1My + 15;
    const and1ExitX = andSx + andW; // 255
    const and1TopY = and1My - 10, and1BotY = and1My + 10; // 95, 115

    const and2My = 255, and2Ty = and2My - 15, and2By = and2My + 15;
    const and2ExitX = andSx + andW;
    const and2TopY = and2My - 10, and2BotY = and2My + 10; // 245, 265

    // ── NOR gates (cross-coupled SR Latch inline — ganti ICBlockRef) ──
    // NOR1 (top): output = Q. Input top = R_gated, input bottom = Q̄_feedback.
    // NOR2 (bot): output = Q̄. Input top = Q_feedback, input bottom = S_gated.
    // Dimensi NOR sama persis dengan CircuitDiagram_SRLatch: width 55, height 36 (my±18).
    const norSX = 350;
    const nor1My = 130, nor1Ty = nor1My - 18, nor1By = nor1My + 18;
    const nor2My = 230, nor2Ty = nor2My - 18, nor2By = nor2My + 18;
    const nor1EX = norSX + 55; // 405
    const nor2EX = norSX + 55; // 405

    // S_gated/R_gated routing lanes — S_gated dari AND1 (top) masuk NOR2 TOP input (y=212).
    //                               R_gated dari AND2 (bot) masuk NOR1 BOTTOM input (y=148).
    // X lanes berbeda supaya dua wire vertikal tidak overlap. Hanya 1 crossing
    //   bersih di koridor antara NOR1 (y=148) dan NOR2 (y=212) — acceptable.
    const sLaneX = 280;  // S_gated wire vertical lane
    const rLaneX = 305;  // R_gated wire vertical lane

    // Feedback wire lanes (pola CircuitDiagram_SRLatch — wrap-around outside NORs):
    //   Q fb:  dari junction di Q-output wire -> turun -> kiri -> naik -> masuk NOR2 BOTTOM input (swap).
    //   Q̄ fb: dari junction di Q̄-output wire -> naik -> kiri -> turun -> masuk NOR1 TOP input (swap).
    // fbLeftX dipilih > rLaneX (310) supaya tidak overlap dengan R_gated wire vertical.
    const fbLeftX = 325;
    const fbTopY = 90;   // di atas NOR1 (yang mulai dari y=112)
    const fbBotY = 275;  // di bawah NOR2 (yang berakhir di y=248)
    // fbRightQ / fbRightQbar = posisi junction di Q / Q̄ output wire (tempat feedback bercabang).
    // X lanes berbeda supaya dua wire vertikal feedback tidak overlap.
    const fbRightQ = 425;    // Q fb junction
    const fbRightQbar = 440; // Q̄ fb junction

    // Q/Q̄ output nodes — posisi sama seperti versi ICBlockRef (konsisten dengan Card 15/16).
    const qOutX = 550, qOutY = 130;
    const qBarOutX = 550, qBarOutY = 230;

    // Derived sinyal internal (untuk glow gate)
    const sGated = s && clk;   // S_gated = S AND CLK
    const rGated = r && clk;   // R_gated = R AND CLK

    // AND gate glow/fill/stroke (mengikuti nilai output S_gated/R_gated)
    const and1Glow = mkGlow(sGated, sRgb), and1Fill = mkFill(sGated, sRgb), and1Stroke = mkStroke(sGated, sCol);
    const and2Glow = mkGlow(rGated, sRgb), and2Fill = mkFill(rGated, sRgb), and2Stroke = mkStroke(rGated, sCol);
    // NOR gate glow/fill/stroke (pola CircuitDiagram_SRLatch — pink, ikuti output masing-masing)
    const nor1Glow = mkGlow(q, norRgb),    nor1Fill = mkFill(q, norRgb),    nor1Stroke = mkStroke(q, norCol);
    const nor2Glow = mkGlow(qBar, norRgb), nor2Fill = mkFill(qBar, norRgb), nor2Stroke = mkStroke(qBar, norCol);

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

    // NOR gate (OR-shape curved + bubble di output) — pola CircuitDiagram_SRLatch
    const NorGate = ({ sx, ty, by, my, ex, glow, fill, stroke }) => <Fragment>
        <path d={'M ' + sx + ',' + ty + ' C ' + (sx + 14) + ',' + ty + ' ' + (ex - 18) + ',' + (my - 6) + ' ' + (ex - 6) + ',' + my + ' C ' + (ex - 18) + ',' + (my + 6) + ' ' + (sx + 14) + ',' + by + ' ' + sx + ',' + by + ' C ' + (sx + 10) + ',' + (my + 5) + ' ' + (sx + 10) + ',' + (my - 5) + ' ' + sx + ',' + ty + ' Z'}
            fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
        <circle cx={ex} cy={my} r="6" fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
    </Fragment>;

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

    // S_gated wire: AND1 exit (top) → turun ke NOR2 TOP input (swap dari versi lama).
    // S_gated diproduksi di AND1 (my=105), masuk NOR2 (top) di y=212 (nor2Ty).
    // Routing: H ke sLaneX, V turun ke nor2Ty, H ke norSX.
    // (Swap ini menghindari wire overlap horizontal di y≈245-255.)
    const wireSg = 'M ' + (and1ExitX + 6) + ',' + and1My + ' H ' + sLaneX + ' V ' + nor2Ty + ' H ' + norSX;

    // R_gated wire: AND2 exit (bottom) → naik ke NOR1 BOTTOM input (swap dari versi lama).
    // R_gated diproduksi di AND2 (my=255), masuk NOR1 (bottom) di y=148 (nor1By).
    // Routing: H ke rLaneX, V naik ke nor1By, H ke norSX.
    // (Swap ini menghindari wire overlap horizontal di y≈245-255.)
    const wireRg = 'M ' + (and2ExitX + 6) + ',' + and2My + ' H ' + rLaneX + ' V ' + nor1By + ' H ' + norSX;

    // Q wire: NOR1 output → Q output node (straight horizontal, same Y).
    const wireQ = 'M ' + (nor1EX + 6) + ',' + nor1My + ' H ' + (qOutX - outNodeR);

    // Q̄ wire: NOR2 output → Q̄ output node (straight horizontal, same Y).
    const wireQbar = 'M ' + (nor2EX + 6) + ',' + nor2My + ' H ' + (qBarOutX - outNodeR);

    // Q feedback wire: junction di Q-output wire (fbRightQ, nor1My) → wrap-around → NOR2 BOTTOM input (swap).
    // Path: V turun ke fbBotY, H kiri ke fbLeftX, V naik ke nor2By, H kanan ke norSX.
    const wireQfb = 'M ' + fbRightQ + ',' + nor1My + ' V ' + fbBotY + ' H ' + fbLeftX + ' V ' + nor2By + ' H ' + norSX;

    // Q̄ feedback wire: junction di Q̄-output wire (fbRightQbar, nor2My) → wrap-around → NOR1 TOP input (swap).
    // Path: V naik ke fbTopY, H kiri ke fbLeftX, V turun ke nor1Ty, H kanan ke norSX.
    const wireQbarFb = 'M ' + fbRightQbar + ',' + nor2My + ' V ' + fbTopY + ' H ' + fbLeftX + ' V ' + nor1Ty + ' H ' + norSX;

    return <svg viewBox={'0 0 ' + svgW + ' ' + svgH} width="100%" style={{ overflow: 'visible', display: 'block' }}>
        {/* Mode badge */}
        <rect x={svgW / 2 - 55} y={4} width={110} height={22} rx={6} fill={mc.bg} stroke={mc.border} strokeWidth="1.5" />
        <text x={svgW / 2} y={19} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="700" fill={mc.text}>{'MODE: ' + mode}</text>

        {/* Input nodes — urutan S, R, CLK (CLK di bawah, sesuai reorder v4) */}
        <InputNode ix={sInX}   iy={sInY}   val={s}   label="S (SET)"    onToggle={onToggleS}   color={sCol}   rgb={sRgb} />
        <InputNode ix={rInX}   iy={rInY}   val={r}   label="R (RESET)"  onToggle={onToggleR}   color={rCol}   rgb={rRgb} />
        <InputNode ix={clkInX} iy={clkInY} val={clk} label="CLK"        onToggle={onToggleClk} color={clkCol} rgb={clkRgb} />

        {/* Clock Mode Switch (MANUAL/AUTO) — dirender DI BAWAH tombol CLK.
            Pos: x=1 (align dgn CLK), y=263 (9px di bawah node CLK yang berakhir di y=251).
            Lihat design.md Bagian 29 untuk spec lengkap (WAJIB untuk semua clock). */}
        <ClockModeSwitch
            x={1}
            y={263}
            mode={clockMode || 'manual'}
            autoActive={!!autoActive}
            onChange={onClockModeChange || (() => {})}
        />

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
        <text x={andSx + 15} y={and1Ty - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={sGated ? sCol : '#475569'} style={{ transition: 'fill 0.3s' }}>AND1</text>
        {/* S_gated label — dipindah ke BAWAH output AND1 (y = and1By + 13) supaya tidak
            menempel di S_gated horizontal wire di y = and1My (=105). */}
        <text x={and1ExitX + 8} y={and1By + 13} textAnchor="start" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="600"
            fill={sGated ? sCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>S</text>

        {/* AND2 gate (R_gated = R AND CLK) */}
        <AndGate sx={andSx} ty={and2Ty} by={and2By} my={and2My} ex={and2ExitX}
            glow={and2Glow} fill={and2Fill} stroke={and2Stroke} />
        <text x={andSx + 15} y={and2Ty - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={rGated ? sCol : '#475569'} style={{ transition: 'fill 0.3s' }}>AND2</text>
        {/* R_gated label — dipindah ke ATAS output AND2 (y = and2Ty - 5) supaya tidak
            menempel di R_gated horizontal wire di y = and2My (=255). */}
        <text x={and2ExitX + 8} y={and2Ty - 5} textAnchor="start" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="600"
            fill={rGated ? sCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>R</text>

        {/* S_gated, R_gated wires (green, masuk NOR gates) */}
        <W d={wireSg} val={sGated} col={sCol} rgb={sRgb} />
        <W d={wireRg} val={rGated} col={sCol} rgb={sRgb} />

        {/* NOR1 gate (top) — output Q. Input: Q̄_feedback (top), R_gated (bottom). */}
        <NorGate sx={norSX} ty={nor1Ty} by={nor1By} my={nor1My} ex={nor1EX}
            glow={nor1Glow} fill={nor1Fill} stroke={nor1Stroke} />
        <text x={norSX + 27} y={nor1Ty - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={q ? norCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NOR1</text>

        {/* NOR2 gate (bottom) — output Q̄. Input: S_gated (top), Q_feedback (bottom). */}
        <NorGate sx={norSX} ty={nor2Ty} by={nor2By} my={nor2My} ex={nor2EX}
            glow={nor2Glow} fill={nor2Fill} stroke={nor2Stroke} />
        <text x={norSX + 27} y={nor2Ty - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={qBar ? norCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NOR2</text>

        {/* Q, Q̄ output wires (dari NOR output pins ke output nodes) */}
        <W d={wireQ}    val={q}    col={qOutCol}    rgb={qOutRgb} />
        <W d={wireQbar} val={qBar} col={qBarOutCol} rgb={qBarOutRgb} />

        {/* Q feedback wire (oranye) + junction dot di Q output wire */}
        <W d={wireQfb} val={q} col={qFbCol} rgb={qFbRgb} />
        <circle cx={fbRightQ} cy={nor1My} r={3.5} fill={wc(q, qOutCol, qOutRgb)} style={{ transition: 'fill 0.3s' }} />
        {/* Q feedback label — dipindah 8px lebih jauh dari wire (y=fbBotY-14, dari -6)
            supaya teks tidak menempel di Q fb horizontal wire di y=fbBotY. */}
        <text x={(fbRightQ + fbLeftX) / 2} y={fbBotY - 14} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="11" fontWeight="700"
            fill={q ? qFbCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>Q</text>

        {/* Q̄ feedback wire (ungu) + junction dot di Q̄ output wire */}
        <W d={wireQbarFb} val={qBar} col={qBarFbCol} rgb={qBarFbRgb} />
        <circle cx={fbRightQbar} cy={nor2My} r={3.5} fill={wc(qBar, qBarOutCol, qBarOutRgb)} style={{ transition: 'fill 0.3s' }} />
        {/* Q̄ feedback label (overline manual) — dipindah 8px lebih jauh dari wire
            (y=fbTopY-14, dari -6) supaya teks & overline tidak menempel di Q̄ fb
            horizontal wire di y=fbTopY. */}
        <g>
            <text x={(fbRightQbar + fbLeftX) / 2} y={fbTopY - 14} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="11" fontWeight="700"
                fill={qBar ? qBarFbCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>Q</text>
            <line x1={(fbRightQbar + fbLeftX) / 2 - 7} y1={fbTopY - 25} x2={(fbRightQbar + fbLeftX) / 2 + 7} y2={fbTopY - 25}
                stroke={qBar ? qBarFbCol : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" style={{ transition: 'stroke 0.3s' }} />
        </g>

        {/* Output nodes */}
        <OutputNode ox={qOutX} oy={qOutY} val={q} label="Q" color={qOutCol} rgb={qOutRgb} />
        <OutputNode ox={qBarOutX} oy={qBarOutY} val={qBar} label="Q" color={qBarOutCol} rgb={qBarOutRgb} overline />
    </svg>;
}
