import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

// Card 16 — Gated D Latch
// Level-sensitive (BUKAN edge-triggered). CLK=1 -> TRANSPARENT (Q ikut D), CLK=0 -> HOLD.
// Struktur: D -> fan-out (ke AND1, ke NOT) | CLK -> fan-out (ke AND1, AND2)
//           NOT -> D̄ -> AND2 | AND1=S=D AND CLK | AND2=R=D̄ AND CLK
//           S, R masuk 2 NOR gates cross-coupled (SR Latch inline, BUKAN ICBlockRef):
//             NOR1 (top): input top = Q̄_feedback, input bottom = R -> output = Q
//             NOR2 (bot): input top = S, input bottom = Q_feedback -> output = Q̄
//           (NOR komutatif: A NOR B = B NOR A. Swap input posisi = logika sama,
//            tapi routing wire lebih bersih — S ke NOR2 top, R ke NOR1 bottom
//            menghindari wire overlap horizontal di area y≈245-248.)
//           Q, Q̄ keluar ke output nodes.
//
// Catatan desain (Bagian 25 memory.md): sesuai permintaan user, kotak ICBlockRef
// diganti dengan 2 NOR gates yang digambar langsung — karena "isinya sangat simpel
// hanya 2 gerbang logika saja". Konsisten dengan CircuitDiagram_SRLatch (Card 15).
export default function CircuitDiagram16({ d, clk, q, qBar, mode, onToggleD, onToggleClk }) {
    // ── Color palette (per design.md 3.5.2) ──
    // D = hijau (Prinsip 1) — sinyal data utama, sepanjang jalur.
    const dCol = '#4ade80', dRgb = hexToRgbStr(dCol);
    // CLK = amber/kuning — sinyal kontrol (Prinsip 4: warna unik, bukan hijau/merah/pink).
    const clkCol = '#facc15', clkRgb = hexToRgbStr(clkCol);
    // NOT output (D̄) = merah (Prinsip 2) di badan NOT + trunk keluar;
    //   berubah hijau (Prinsip 3) saat masuk AND2 input.
    const notCol = '#f87171', notRgb = hexToRgbStr(notCol);
    // NOR gate body = pink (design.md 1.5 — NOR pink #f472b6).
    // Glow/fill NOR1 mengikuti Q; NOR2 mengikuti Q̄. (Pola CircuitDiagram_SRLatch.)
    const norCol = '#f472b6', norRgb = hexToRgbStr(norCol);
    // Feedback wire colors (pola CircuitDiagram_SRLatch):
    //   Q feedback  = oranye (#fb923c) — distinct dari output wires.
    //   Q̄ feedback = ungu   (#a78bfa) — distinct dari output wires.
    const qFbCol = '#fb923c', qFbRgb = hexToRgbStr(qFbCol);
    const qBarFbCol = '#a78bfa', qBarFbRgb = hexToRgbStr(qBarFbCol);
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

    // Fan-out junctions — X lanes diberi jarak 25px (dari 10px) supaya D vertical
    // dan CLK vertical terlihat jelas terpisah (sebelumnya hanya 10px → terlihat
    // seperti kabel menumpuk antara y=115 dan y=175).
    const dJunctionX = 75, clkJunctionX = 100;

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

    // ── NOR gates (cross-coupled SR Latch inline — ganti ICBlockRef) ──
    // NOR1 (top): output = Q. Input top = R, input bottom = Q̄_feedback.
    // NOR2 (bot): output = Q̄. Input top = Q_feedback, input bottom = S.
    // Dimensi NOR sama persis dengan CircuitDiagram_SRLatch: width 55, height 36 (my±18).
    const norSX = 350;
    const nor1My = 130, nor1Ty = nor1My - 18, nor1By = nor1My + 18;
    const nor2My = 230, nor2Ty = nor2My - 18, nor2By = nor2My + 18;
    const nor1EX = norSX + 55; // 405
    const nor2EX = norSX + 55; // 405

    // S/R routing lanes — S dari AND1 (top) masuk NOR2 TOP input (y=212).
    //                   R dari AND2 (bot) masuk NOR1 BOTTOM input (y=148).
    // X lanes berbeda supaya dua wire vertikal tidak overlap. Hanya 1 crossing
    //   bersih di koridor antara NOR1 (y=148) dan NOR2 (y=212) — acceptable.
    const sLaneX = 280;  // S wire vertical lane
    const rLaneX = 305;  // R wire vertical lane

    // Feedback wire lanes (pola CircuitDiagram_SRLatch — wrap-around outside NORs):
    //   Q fb:  dari junction di Q-output wire -> turun -> kiri -> naik -> masuk NOR2 top input.
    //   Q̄ fb: dari junction di Q̄-output wire -> naik -> kiri -> turun -> masuk NOR1 bot input.
    // fbLeftX dipilih > rLaneX (310) supaya tidak overlap dengan R wire vertical.
    const fbLeftX = 325;
    const fbTopY = 90;   // di atas NOR1 (yang mulai dari y=112)
    const fbBotY = 275;  // di bawah NOR2 (yang berakhir di y=248)
    // fbRightQ / fbRightQbar = posisi junction di Q / Q̄ output wire (tempat feedback bercabang).
    // X lanes berbeda supaya dua wire vertikal feedback tidak overlap.
    const fbRightQ = 425;    // Q fb junction
    const fbRightQbar = 440; // Q̄ fb junction

    // Q/Q̄ output nodes — posisi sama seperti versi ICBlockRef (konsisten dengan Card 15).
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

    // NOT gate (segitiga + bubble)
    const NotGate = ({ sx, ty, by, my, tipX, bubbleX, glow, fill, stroke }) => <Fragment>
        <path d={'M ' + sx + ',' + ty + ' L ' + tipX + ',' + my + ' L ' + sx + ',' + by + ' Z'}
            fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
        <circle cx={bubbleX} cy={my} r="4" fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
    </Fragment>;

    // NOR gate (OR-shape curved + bubble di output) — pola CircuitDiagram_SRLatch
    const NorGate = ({ sx, ty, by, my, ex, glow, fill, stroke }) => <Fragment>
        <path d={'M ' + sx + ',' + ty + ' C ' + (sx + 14) + ',' + ty + ' ' + (ex - 18) + ',' + (my - 6) + ' ' + (ex - 6) + ',' + my + ' C ' + (ex - 18) + ',' + (my + 6) + ' ' + (sx + 14) + ',' + by + ' ' + sx + ',' + by + ' C ' + (sx + 10) + ',' + (my + 5) + ' ' + (sx + 10) + ',' + (my - 5) + ' ' + sx + ',' + ty + ' Z'}
            fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
        <circle cx={ex} cy={my} r="6" fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
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

    // S wire: AND1 exit (top) → turun ke NOR2 TOP input (swap dari versi lama).
    // S diproduksi di AND1 (my=105), masuk NOR2 (top) di y=212 (nor2Ty).
    // Routing: H ke sLaneX, V turun ke nor2Ty, H ke norSX.
    // (Swap ini menghindari wire overlap horizontal di y≈245-248.)
    const wireS = 'M ' + (and1ExitX + 6) + ',' + and1My + ' H ' + sLaneX + ' V ' + nor2Ty + ' H ' + norSX;

    // R wire: AND2 exit (bottom) → naik ke NOR1 BOTTOM input (swap dari versi lama).
    // R diproduksi di AND2 (my=245), masuk NOR1 (bottom) di y=148 (nor1By).
    // Routing: H ke rLaneX, V naik ke nor1By, H ke norSX.
    // (Swap ini menghindari wire overlap horizontal di y≈245-248.)
    const wireR = 'M ' + (and2ExitX + 6) + ',' + and2My + ' H ' + rLaneX + ' V ' + nor1By + ' H ' + norSX;

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
        <text x={notInX + 20} y={notTy - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
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
        <text x={andSx + 15} y={and1Ty - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={s ? dCol : '#475569'} style={{ transition: 'fill 0.3s' }}>AND1</text>
        {/* S label — dipindah ke BAWAH output AND1 (y = and1By + 13) supaya tidak
            menempel di S horizontal wire di y = and1My (=105). */}
        <text x={and1ExitX + 8} y={and1By + 13} textAnchor="start" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="600"
            fill={s ? dCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>S</text>

        {/* AND2 gate (R = D̄ AND CLK) */}
        <AndGate sx={andSx} ty={and2Ty} by={and2By} my={and2My} ex={and2ExitX}
            glow={and2Glow} fill={and2Fill} stroke={and2Stroke} />
        <text x={andSx + 15} y={and2Ty - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={r ? dCol : '#475569'} style={{ transition: 'fill 0.3s' }}>AND2</text>
        {/* R label — dipindah ke ATAS output AND2 (y = and2Ty - 5) supaya tidak
            menempel di R horizontal wire di y = and2My (=245). */}
        <text x={and2ExitX + 8} y={and2Ty - 5} textAnchor="start" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="600"
            fill={r ? dCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>R</text>

        {/* S, R wires (green, masuk NOR gates) */}
        <W d={wireS} val={s} col={dCol} rgb={dRgb} />
        <W d={wireR} val={r} col={dCol} rgb={dRgb} />

        {/* NOR1 gate (top) — output Q. Input: Q̄_feedback (top), R (bottom). */}
        <NorGate sx={norSX} ty={nor1Ty} by={nor1By} my={nor1My} ex={nor1EX}
            glow={nor1Glow} fill={nor1Fill} stroke={nor1Stroke} />
        <text x={norSX + 27} y={nor1Ty - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={q ? norCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NOR1</text>

        {/* NOR2 gate (bottom) — output Q̄. Input: S (top), Q_feedback (bottom). */}
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
