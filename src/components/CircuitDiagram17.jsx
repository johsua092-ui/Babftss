import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';
import ClockModeSwitch from './ClockModeSwitch';

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATE — RANGKAIAN SEKUENSIAL CLOCKED (4-NAND TOPOLOGY) — SVG DIAGRAM
// ════════════════════════════════════════════════════════════════════════════
// Card 17 (T Flip-Flop) diagram dibangun mengikuti TEMPLATE Card 16 (SR Flip-Flop).
// Lihat design.md Bagian 36 untuk spec lengkap (TEMPLATE — Card 16).
// ════════════════════════════════════════════════════════════════════════════
//
// Card 17 — T Flip-Flop (NAND-based, 4 NAND gates)
// Topologi (sesuai gambar referensi user, 13 Aug 2026):
//   Stage 1 (steering NANDs — kiri, menerima T dan CLK):
//     NAND3 (top-left): inputs (T, CLK) → output = NOT(T·CLK) = NOT(tGated) = T̄_gated
//     NAND4 (bot-left):  inputs (CLK, T) → output = NOT(CLK·T) = NOT(tGated) = sama dgn NAND3
//     (Karena T dan CLK masuk ke kedua steering NAND, outputnya identik = NOT(tGated).)
//   Stage 2 (cross-coupled NAND latch — kanan, active-low inputs):
//     NAND1 (top-right, output Q):  inputs (Q̄_feedback, NAND3 out)
//     NAND2 (bot-right, output Q̄): inputs (Q_feedback, NAND4 out)
//   Cross-coupling (pola CircuitDiagram_SRLatch — wrap-around di luar NAND):
//     Q̄ feedback (dari NAND2 output) → NAND1 top input
//     Q  feedback (dari NAND1 output) → NAND2 bottom input
//
// Input order (top-to-bottom): T, CLK — sesuai gambar referensi user.
//
// Mode (4-mode, diturunkan dari tGated = T·CLK):
//   tGated=0 (T=0 ATAU CLK=0) → HOLD    (Q tetap nilai sebelumnya)
//   tGated=1 (T=1 DAN CLK=1)  → INVALID (Q=1, Q̄=1 — NAND latch active-low; kedua
//                                       steering NAND output 0, memaksa latch
//                                       ke kondisi terlarang. Karakteristik
//                                       struktur dasar 4-NAND T Flip-Flop.)
//   SET, RESET                → (tidak mungkin di topologi 4-NAND dasar ini;
//                                toggle penuh memerlukan feedback Q/Q̄ ke steering)
//
// Vocabulary WAJIB SET/RESET/HOLD/INVALID (ATURAN MUTLAK Bagian 35 design.md).
export default function CircuitDiagram17({ t, clk, q, qBar, mode, onToggleT, onToggleClk, clockMode, autoActive, onClockModeChange }) {
    // ── Color palette (per design.md 3.5.2 + konvensi sekuensial Card 15/16) ──
    // T = hijau (Prinsip 1) — sinyal data utama (input), sepanjang jalur.
    // Konsisten dengan S di CircuitDiagram_SRLatch.jsx / Card 16.
    const tCol = '#4ade80', tRgb = hexToRgbStr(tCol);
    // CLK = amber/kuning — sinyal kontrol (Prinsip 4: warna unik, bukan hijau).
    const clkCol = '#facc15', clkRgb = hexToRgbStr(clkCol);
    // NAND gate body = oranye (design.md 1.5 — NAND orange #fb923c).
    // Glow/fill NAND1 mengikuti Q; NAND2 mengikuti Q̄; NAND3/NAND4 mengikuti !tGated.
    const nandCol = '#fb923c', nandRgb = hexToRgbStr(nandCol);
    // Feedback wire colors (pola CircuitDiagram_SRLatch — distinct dari output wires):
    const qFbCol = '#fb923c', qFbRgb = hexToRgbStr(qFbCol);
    const qBarFbCol = '#a78bfa', qBarFbRgb = hexToRgbStr(qBarFbCol);
    // Output Q = hijau (sesuai Card 15/16). Q̄ = pink (sesuai Card 15/16).
    const qOutCol = '#4ade80', qOutRgb = hexToRgbStr(qOutCol);
    const qBarOutCol = '#f472b6', qBarOutRgb = hexToRgbStr(qBarOutCol);

    // ── Helper functions (pola CircuitDiagram_SRLatch — Card 16 TEMPLATE) ──
    const wc = (val, col, rgb) => val ? col : 'rgba(' + rgb + ',0.25)';
    const mkGlow = (val, rgb) => val
        ? 'drop-shadow(0 0 4px rgba(' + rgb + ',0.9)) drop-shadow(0 0 10px rgba(' + rgb + ',0.5))'
        : 'none';
    const mkFill = (val, rgb) => val ? 'rgba(' + rgb + ',0.13)' : '#0f172a';
    const mkStroke = (val, col) => val ? col : '#475569';

    // ── Layout constants ──
    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 15;

    const svgW = 580, svgH = 340;

    // Input nodes — urutan T, CLK (top-to-bottom) SESUAI gambar referensi.
    // (Hanya 2 input, beda dari Card 16 yang punya 3 input S/CLK/R.)
    const tInX = 1,   tInY = 130;    // T — atas (hijau)
    const clkInX = 1, clkInY = 230;  // CLK — bawah (amber)

    // Fan-out junctions — T dan CLK keduanya fan-out ke 2 steering NAND.
    // X lanes berbeda supaya vertical wires T dan CLK tidak menumpuk.
    const tJunctionX = 75;     // T fan-out: ke NAND3 top + NAND4 bottom
    const clkJunctionX = 135;  // CLK fan-out: ke NAND3 bottom + NAND4 top

    // ── Stage 1: NAND3 (top-left) & NAND4 (bottom-left) — steering ──
    // NAND3: top input = T, bottom input = CLK. Output = NOT(T·CLK) = !tGated.
    // NAND4: top input = CLK, bottom input = T. Output = NOT(T·CLK) = !tGated.
    // Dimensi: width 30 rect + 15 arc + 8 bubble = total 53 dari sx ke wire exit.
    const nandSx = 210, nandW = 45;
    const nand3My = 130, nand3Ty = nand3My - 18, nand3By = nand3My + 18;
    const nand3EX = nandSx + nandW; // 255
    const nand3TopY = nand3My - 10, nand3BotY = nand3My + 10; // 120, 140

    const nand4My = 230, nand4Ty = nand4My - 18, nand4By = nand4My + 18;
    const nand4EX = nandSx + nandW;
    const nand4TopY = nand4My - 10, nand4BotY = nand4My + 10; // 220, 240

    // ── Stage 2: NAND1 (top-right) & NAND2 (bottom-right) — cross-coupled latch ──
    // NAND1: top input = Q̄ feedback, bottom input = NAND3 out. Output = Q.
    // NAND2: top input = Q feedback, bottom input = NAND4 out. Output = Q̄.
    // (Susunan input sama persis dengan Card 16 untuk konsistensi TEMPLATE.)
    const nandRSx = 350;
    const nand1My = 130, nand1Ty = nand1My - 18, nand1By = nand1My + 18;
    const nand1EX = nandRSx + nandW; // 395
    const nand1TopY = nand1My - 10, nand1BotY = nand1My + 10; // 120, 140

    const nand2My = 230, nand2Ty = nand2My - 18, nand2By = nand2My + 18;
    const nand2EX = nandRSx + nandW;
    const nand2TopY = nand2My - 10, nand2BotY = nand2My + 10; // 220, 240

    // Feedback wire lanes (pola CircuitDiagram_SRLatch — wrap-around outside NANDs):
    const fbLeftX = 325;
    const fbTopY = 90;   // di atas NAND1 (yang mulai dari y=112)
    const fbBotY = 275;  // di bawah NAND2 (yang berakhir di y=248)
    const fbRightQ = 425;    // Q fb junction
    const fbRightQbar = 440; // Q̄ fb junction

    // Q/Q̄ output nodes
    const qOutX = 550, qOutY = 130;
    const qBarOutX = 550, qBarOutY = 230;

    // Derived sinyal internal
    const tGated = t && clk;   // T·CLK (untuk mode determination)
    const nand3Out = !tGated;  // NOT(T·CLK) — output NAND3
    const nand4Out = !tGated;  // NOT(T·CLK) — output NAND4 (identik dengan NAND3)

    // NAND gate glow/fill/stroke
    const nand1Glow = mkGlow(q, nandRgb),       nand1Fill = mkFill(q, nandRgb),       nand1Stroke = mkStroke(q, nandCol);
    const nand2Glow = mkGlow(qBar, nandRgb),    nand2Fill = mkFill(qBar, nandRgb),    nand2Stroke = mkStroke(qBar, nandCol);
    const nand3Glow = mkGlow(nand3Out, nandRgb), nand3Fill = mkFill(nand3Out, nandRgb), nand3Stroke = mkStroke(nand3Out, nandCol);
    const nand4Glow = mkGlow(nand4Out, nandRgb), nand4Fill = mkFill(nand4Out, nandRgb), nand4Stroke = mkStroke(nand4Out, nandCol);

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

    // NAND gate (D-shape: flat back, semicircle front, + bubble di output)
    //   ex = sx + 45 (ujung arc). Bubble center di ex+4 (radius 4). Wire exit di ex+8.
    const NandGate = ({ sx, ty, by, my, ex, glow, fill, stroke }) => <Fragment>
        <path d={'M ' + sx + ',' + ty + ' L ' + (sx + 30) + ',' + ty +
           ' A 15,15 0 0 1 ' + (sx + 30) + ',' + by +
           ' L ' + sx + ',' + by + ' Z'}
            fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
        <circle cx={ex + 4} cy={my} r="4" fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
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
    // T main trunk: input → junction
    const wireTtrunk = 'M ' + (tInX + inputNodeW) + ',' + tInY + ' H ' + tJunctionX;
    // T branch up: junction → NAND3 top input (210, 120). T junction y=130 naik ke y=120.
    const wireT_up = 'M ' + tJunctionX + ',' + tInY + ' V ' + nand3TopY + ' H ' + nandSx;
    // T branch down: junction → NAND4 bottom input (210, 240). T junction y=130 turun ke y=240.
    // Wire ini memutar ke kanan dulu (H ke 145, melewati CLK junction di x=135) lalu V turun,
    // supaya tidak crossing CLK trunk di (75, 230).
    const wireT_dn = 'M ' + tJunctionX + ',' + tInY + ' H 145 V ' + nand4BotY + ' H ' + nandSx;

    // CLK main trunk: input → junction
    const wireClkTrunk = 'M ' + (clkInX + inputNodeW) + ',' + clkInY + ' H ' + clkJunctionX;
    // CLK branch up: junction → NAND3 bot input (210, 140). CLK junction y=230 naik ke y=140.
    const wireClk_up = 'M ' + clkJunctionX + ',' + clkInY + ' V ' + nand3BotY + ' H ' + nandSx;
    // CLK branch down: junction → NAND4 top input (210, 220). CLK junction y=230 naik sedikit ke y=220.
    const wireClk_dn = 'M ' + clkJunctionX + ',' + clkInY + ' V ' + nand4TopY + ' H ' + nandSx;

    // NAND3 output wire → NAND1 bottom input (350, 140).
    // Wire exit di (nand3EX+8, 130) = (263, 130). Lalu H ke 340, V ke 140, H ke 350.
    const wireNand3out = 'M ' + (nand3EX + 8) + ',' + nand3My + ' H 340 V ' + nand1BotY + ' H ' + nandRSx;

    // NAND4 output wire → NAND2 top input (350, 220).
    // Wire exit di (nand4EX+8, 230) = (263, 230). Lalu H ke 340, V ke 220, H ke 350.
    const wireNand4out = 'M ' + (nand4EX + 8) + ',' + nand4My + ' H 340 V ' + nand2TopY + ' H ' + nandRSx;

    // Q wire: NAND1 output → Q output node (straight horizontal, same Y).
    const wireQ = 'M ' + (nand1EX + 8) + ',' + nand1My + ' H ' + (qOutX - outNodeR);

    // Q̄ wire: NAND2 output → Q̄ output node (straight horizontal, same Y).
    const wireQbar = 'M ' + (nand2EX + 8) + ',' + nand2My + ' H ' + (qBarOutX - outNodeR);

    // Q feedback wire: junction di Q-output wire (fbRightQ, nand1My=130) → wrap-around → NAND2 bottom input (350, 240).
    // Path: V turun ke fbBotY, H kiri ke fbLeftX, V naik ke nand2BotY, H kanan ke nandRSx.
    const wireQfb = 'M ' + fbRightQ + ',' + nand1My + ' V ' + fbBotY + ' H ' + fbLeftX + ' V ' + nand2BotY + ' H ' + nandRSx;

    // Q̄ feedback wire: junction di Q̄-output wire (fbRightQbar, nand2My=230) → wrap-around → NAND1 top input (350, 120).
    // Path: V naik ke fbTopY, H kiri ke fbLeftX, V turun ke nand1TopY, H kanan ke nandRSx.
    const wireQbarFb = 'M ' + fbRightQbar + ',' + nand2My + ' V ' + fbTopY + ' H ' + fbLeftX + ' V ' + nand1TopY + ' H ' + nandRSx;

    return <svg viewBox={'0 0 ' + svgW + ' ' + svgH} width="100%" style={{ overflow: 'visible', display: 'block' }}>
        {/* Mode badge */}
        <rect x={svgW / 2 - 55} y={4} width={110} height={22} rx={6} fill={mc.bg} stroke={mc.border} strokeWidth="1.5" />
        <text x={svgW / 2} y={19} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="700" fill={mc.text}>{'MODE: ' + mode}</text>

        {/* Input nodes — urutan T, CLK (sesuai gambar referensi) */}
        <InputNode ix={tInX}   iy={tInY}   val={t}   label="T (TOGGLE)" onToggle={onToggleT}   color={tCol}   rgb={tRgb} />
        <InputNode ix={clkInX} iy={clkInY} val={clk} label="CLK"        onToggle={onToggleClk} color={clkCol} rgb={clkRgb} />

        {/* Clock Mode Switch (MANUAL/AUTO) — dirender DI BAWAH tombol CLK.
            Pos: x=1 (align dgn CLK), y=285 (clkInY + 55 — gap wajar dari rect
            bottom CLK di y=251 ke label switch, sesuai aturan design.md Bagian 29.2).
            Lihat design.md Bagian 29 untuk spec lengkap (WAJIB untuk semua clock). */}
        <ClockModeSwitch
            x={1}
            y={285}
            mode={clockMode || 'manual'}
            autoActive={!!autoActive}
            onChange={onClockModeChange || (() => {})}
        />

        {/* T fan-out wires (green) — trunk + 2 branches */}
        <W d={wireTtrunk} val={t} col={tCol} rgb={tRgb} />
        <W d={wireT_up}   val={t} col={tCol} rgb={tRgb} />
        <W d={wireT_dn}   val={t} col={tCol} rgb={tRgb} />
        {/* T junction dot (T bercabang 2) */}
        <circle cx={tJunctionX} cy={tInY} r={3.5} fill={wc(t, tCol, tRgb)} style={{ transition: 'fill 0.3s' }} />

        {/* CLK fan-out wires (amber) — trunk + 2 branches */}
        <W d={wireClkTrunk} val={clk} col={clkCol} rgb={clkRgb} />
        <W d={wireClk_up}   val={clk} col={clkCol} rgb={clkRgb} />
        <W d={wireClk_dn}   val={clk} col={clkCol} rgb={clkRgb} />
        {/* CLK junction dot (CLK bercabang 2) */}
        <circle cx={clkJunctionX} cy={clkInY} r={3.5} fill={wc(clk, clkCol, clkRgb)} style={{ transition: 'fill 0.3s' }} />

        {/* NAND3 gate (top-left, steering) — output = NOT(T·CLK) */}
        <NandGate sx={nandSx} ty={nand3Ty} by={nand3By} my={nand3My} ex={nand3EX}
            glow={nand3Glow} fill={nand3Fill} stroke={nand3Stroke} />
        <text x={nandSx + 15} y={nand3Ty - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={nand3Out ? nandCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NAND3</text>

        {/* NAND4 gate (bottom-left, steering) — output = NOT(T·CLK) (identik dgn NAND3) */}
        <NandGate sx={nandSx} ty={nand4Ty} by={nand4By} my={nand4My} ex={nand4EX}
            glow={nand4Glow} fill={nand4Fill} stroke={nand4Stroke} />
        <text x={nandSx + 15} y={nand4Ty - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={nand4Out ? nandCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NAND4</text>

        {/* NAND3, NAND4 output wires (green — Prinsip 6: output gerbang = hijau) */}
        <W d={wireNand3out} val={nand3Out} col={tCol} rgb={tRgb} />
        <W d={wireNand4out} val={nand4Out} col={tCol} rgb={tRgb} />

        {/* NAND1 gate (top-right, latch) — output = Q.
            Inputs: Q̄ feedback (top), NAND3 out (bottom). */}
        <NandGate sx={nandRSx} ty={nand1Ty} by={nand1By} my={nand1My} ex={nand1EX}
            glow={nand1Glow} fill={nand1Fill} stroke={nand1Stroke} />
        <text x={nandRSx + 15} y={nand1Ty - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={q ? nandCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NAND1</text>

        {/* NAND2 gate (bottom-right, latch) — output = Q̄.
            Inputs: Q feedback (top), NAND4 out (bottom). */}
        <NandGate sx={nandRSx} ty={nand2Ty} by={nand2By} my={nand2My} ex={nand2EX}
            glow={nand2Glow} fill={nand2Fill} stroke={nand2Stroke} />
        <text x={nandRSx + 15} y={nand2Ty - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={qBar ? nandCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NAND2</text>

        {/* Q, Q̄ output wires (dari NAND output pins ke output nodes) */}
        <W d={wireQ}    val={q}    col={qOutCol}    rgb={qOutRgb} />
        <W d={wireQbar} val={qBar} col={qBarOutCol} rgb={qBarOutRgb} />

        {/* Q feedback wire (oranye) + junction dot di Q output wire */}
        <W d={wireQfb} val={q} col={qFbCol} rgb={qFbRgb} />
        <circle cx={fbRightQ} cy={nand1My} r={3.5} fill={wc(q, qOutCol, qOutRgb)} style={{ transition: 'fill 0.3s' }} />
        {/* Q feedback label — di atas feedback horizontal bottom wire */}
        <text x={(fbRightQ + fbLeftX) / 2} y={fbBotY - 14} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="11" fontWeight="700"
            fill={q ? qFbCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>Q</text>

        {/* Q̄ feedback wire (ungu) + junction dot di Q̄ output wire */}
        <W d={wireQbarFb} val={qBar} col={qBarFbCol} rgb={qBarFbRgb} />
        <circle cx={fbRightQbar} cy={nand2My} r={3.5} fill={wc(qBar, qBarOutCol, qBarOutRgb)} style={{ transition: 'fill 0.3s' }} />
        {/* Q̄ feedback label (overline manual) */}
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
