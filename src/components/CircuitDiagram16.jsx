import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';
import ClockModeSwitch from './ClockModeSwitch';

// Card 16 — SR Flip-Flop (NAND-based, 4 NAND gates)
// Topologi (sesuai gambar referensi user, 13 Aug 2026):
//   Stage 1 (steering NANDs — kiri, gating CLK):
//     NAND3 (top-left): inputs (S, CLK) → output = NOT(S·CLK) = NOT(sGated) = S̄_gated
//     NAND4 (bot-left):  inputs (CLK, R) → output = NOT(R·CLK) = NOT(rGated) = R̄_gated
//   Stage 2 (cross-coupled NAND SR latch — kanan, active-low inputs):
//     NAND1 (top-right): inputs (NAND3 out, Q̄_fb) → output = Q
//     NAND2 (bot-right):  inputs (Q_fb, NAND4 out) → output = Q̄
//   Cross-coupling (pola CircuitDiagram_SRLatch — wrap-around di luar NAND):
//     Q̄ feedback (dari NAND2 output) → NAND1 bottom input
//     Q  feedback (dari NAND1 output) → NAND2 top input
//
// Input order (top-to-bottom): S, CLK, R — sesuai gambar referensi user.
// (Berbeda dari versi lama AND+NOR yang pakai urutan S, R, CLK.)
//
// Mode (4-mode, diturunkan dari sGated=S·CLK, rGated=R·CLK — tabel kebenaran
// IDENTIK dengan versi AND+NOR, hanya beda interpretasi INVALID):
//   sGated=1, rGated=0 → SET     (Q=1, Q̄=0)
//   sGated=0, rGated=1 → RESET   (Q=0, Q̄=1)
//   sGated=0, rGated=0 → HOLD    (Q tetap nilai sebelumnya)
//   sGated=1, rGated=1 → INVALID (Q=1, Q̄=1 — BEDA dengan versi NOR yang memberikan
//                                  Q=0, Q̄=0; pada NAND latch active-low, INVALID
//                                  menghasilkan output keduanya HIGH)
//
// Vocabulary WAJIB SET/RESET/HOLD/INVALID (ATURAN MUTLAK Bagian 35 design.md).
export default function CircuitDiagram16({ s, r, clk, q, qBar, mode, onToggleS, onToggleR, onToggleClk, clockMode, autoActive, onClockModeChange }) {
    // ── Color palette (per design.md 3.5.2 + konvensi sekuensial Card 15/17) ──
    // S = hijau (Prinsip 1) — sinyal data utama (input pertama), sepanjang jalur.
    const sCol = '#4ade80', sRgb = hexToRgbStr(sCol);
    // R = cyan — sinyal kontrol (Prinsip 4: warna unik, bukan hijau).
    const rCol = '#22d3ee', rRgb = hexToRgbStr(rCol);
    // CLK = amber/kuning — sinyal kontrol tambahan (Prinsip 4: warna unik).
    const clkCol = '#facc15', clkRgb = hexToRgbStr(clkCol);
    // NAND gate body = oranye (design.md 1.5 — NAND orange #fb923c).
    // Glow/fill NAND1 mengikuti Q; NAND2 mengikuti Q̄; NAND3 mengikuti !sGated; NAND4 mengikuti !rGated.
    const nandCol = '#fb923c', nandRgb = hexToRgbStr(nandCol);
    // Feedback wire colors (pola CircuitDiagram_SRLatch — distinct dari output wires):
    //   Q feedback  = oranye (#fb923c) — SAMA dengan NAND color, tapi spatial terpisah
    //                 (NAND body di x=350-413, Q fb wire di x=325-425 berbeda segmen Y).
    //   Q̄ feedback = ungu   (#a78bfa) — distinct dari output wires.
    const qFbCol = '#fb923c', qFbRgb = hexToRgbStr(qFbCol);
    const qBarFbCol = '#a78bfa', qBarFbRgb = hexToRgbStr(qBarFbCol);
    // Output Q = hijau (sesuai Card 15). Q̄ = pink (sesuai Card 15).
    const qOutCol = '#4ade80', qOutRgb = hexToRgbStr(qOutCol);
    const qBarOutCol = '#f472b6', qBarOutRgb = hexToRgbStr(qBarOutCol);

    // ── Helper functions (pola CircuitDiagram_SRLatch / Card 17) ──
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

    // Input nodes — urutan S, CLK, R (top-to-bottom) SESUAI gambar referensi.
    // (Berbeda dari versi lama AND+NOR yang pakai S, R, CLK.)
    const sInX = 1,   sInY = 130;    // S — atas (hijau)
    const clkInX = 1, clkInY = 180;  // CLK — tengah (amber)
    const rInX = 1,   rInY = 230;    // R — bawah (cyan)

    // Fan-out junctions — X lanes diberi jarak 30px supaya vertical wires
    // S/CLK/R tidak terlihat menumpuk. S junction & R junction sebenarnya
    // tidak fan-out (masing-masing hanya 1 branch), tapi junction dot tetap
    // dipertahankan untuk konsistensi visual (pola Card 16 versi lama).
    const sJunctionX = 75;
    const clkJunctionX = 105;  // CLK beneran fan-out: ke NAND3 bot + NAND4 top
    const rJunctionX = 135;

    // ── Stage 1: NAND3 (top-left) & NAND4 (bottom-left) — steering ──
    // NAND3: top input = S, bottom input = CLK. Output = NOT(S·CLK) = !sGated.
    // NAND4: top input = CLK, bottom input = R. Output = NOT(R·CLK) = !rGated.
    // Dimensi: width 30 rect + 15 arc + 8 bubble = total 53 dari sx ke wire exit.
    //   ex = sx + 45 (ujung arc); bubble center di ex+4; wire exit di ex+8.
    const nandSx = 210, nandW = 45; // 30 rect + 15 arc
    const nand3My = 130, nand3Ty = nand3My - 18, nand3By = nand3My + 18;
    const nand3EX = nandSx + nandW; // 255 — ujung arc (sebelum bubble)
    const nand3TopY = nand3My - 10, nand3BotY = nand3My + 10; // 120, 140

    const nand4My = 230, nand4Ty = nand4My - 18, nand4By = nand4My + 18;
    const nand4EX = nandSx + nandW;
    const nand4TopY = nand4My - 10, nand4BotY = nand4My + 10; // 220, 240

    // ── Stage 2: NAND1 (top-right) & NAND2 (bottom-right) — cross-coupled latch ──
    // NAND1: top input = NAND3 out, bottom input = Q̄ feedback. Output = Q.
    // NAND2: top input = Q feedback, bottom input = NAND4 out. Output = Q̄.
    const nandRSx = 350;
    const nand1My = 130, nand1Ty = nand1My - 18, nand1By = nand1My + 18;
    const nand1EX = nandRSx + nandW; // 395
    const nand1TopY = nand1My - 10, nand1BotY = nand1My + 10; // 120, 140

    const nand2My = 230, nand2Ty = nand2My - 18, nand2By = nand2My + 18;
    const nand2EX = nandRSx + nandW;
    const nand2TopY = nand2My - 10, nand2BotY = nand2My + 10; // 220, 240

    // Feedback wire lanes (pola CircuitDiagram_SRLatch — wrap-around outside NANDs):
    //   Q fb:  dari junction di Q-output wire -> turun -> kiri -> naik -> masuk NAND2 top input.
    //   Q̄ fb: dari junction di Q̄-output wire -> naik -> kiri -> turun -> masuk NAND1 bot input.
    // fbLeftX dipilih 325 (di kiri NAND1/NAND2 yang mulai di x=350) supaya feedback
    // wire vertical tidak menumpuk dengan NAND3/NAND4 output wire (di x=340).
    const fbLeftX = 325;
    const fbTopY = 90;   // di atas NAND1 (yang mulai dari y=112)
    const fbBotY = 275;  // di bawah NAND2 (yang berakhir di y=248)
    // fbRightQ / fbRightQbar = posisi junction di Q / Q̄ output wire.
    const fbRightQ = 425;    // Q fb junction
    const fbRightQbar = 440; // Q̄ fb junction

    // Q/Q̄ output nodes
    const qOutX = 550, qOutY = 130;
    const qBarOutX = 550, qBarOutY = 230;

    // Derived sinyal internal
    const sGated = s && clk;   // S·CLK (untuk mode determination)
    const rGated = r && clk;   // R·CLK
    const nand3Out = !sGated;  // NOT(S·CLK) — output NAND3
    const nand4Out = !rGated;  // NOT(R·CLK) — output NAND4

    // NAND gate glow/fill/stroke
    // NAND1 (output Q) glow mengikuti Q; NAND2 (output Q̄) glow mengikuti Q̄.
    // NAND3 glow mengikuti nand3Out; NAND4 glow mengikuti nand4Out.
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
    // S main trunk: input → junction
    const wireStrunk = 'M ' + (sInX + inputNodeW) + ',' + sInY + ' H ' + sJunctionX;
    // S branch: junction → NAND3 top input (210, 120). S junction y=130 naik ke y=120.
    const wireS_branch = 'M ' + sJunctionX + ',' + sInY + ' V ' + nand3TopY + ' H ' + nandSx;

    // CLK main trunk: input → junction
    const wireClkTrunk = 'M ' + (clkInX + inputNodeW) + ',' + clkInY + ' H ' + clkJunctionX;
    // CLK branch up: junction → NAND3 bot input (210, 140)
    const wireClk_up = 'M ' + clkJunctionX + ',' + clkInY + ' V ' + nand3BotY + ' H ' + nandSx;
    // CLK branch down: junction → NAND4 top input (210, 220)
    const wireClk_dn = 'M ' + clkJunctionX + ',' + clkInY + ' V ' + nand4TopY + ' H ' + nandSx;

    // R main trunk: input → junction
    const wireRtrunk = 'M ' + (rInX + inputNodeW) + ',' + rInY + ' H ' + rJunctionX;
    // R branch: junction → NAND4 bot input (210, 240). R junction y=230 turun ke y=240.
    const wireR_branch = 'M ' + rJunctionX + ',' + rInY + ' V ' + nand4BotY + ' H ' + nandSx;

    // NAND3 output wire → NAND1 top input (350, 120).
    // Wire exit di (nand3EX+8, 130) = (263, 130). Lalu H ke 340, V ke 120, H ke 350.
    const wireNand3out = 'M ' + (nand3EX + 8) + ',' + nand3My + ' H 340 V ' + nand1TopY + ' H ' + nandRSx;

    // NAND4 output wire → NAND2 bottom input (350, 240).
    // Wire exit di (nand4EX+8, 230) = (263, 230). Lalu H ke 340, V ke 240, H ke 350.
    const wireNand4out = 'M ' + (nand4EX + 8) + ',' + nand4My + ' H 340 V ' + nand2BotY + ' H ' + nandRSx;

    // Q wire: NAND1 output → Q output node (straight horizontal, same Y).
    // Wire exit di (nand1EX+8, 130) = (403+8=411... wait nandRSx+nandW=350+45=395, +8=403).
    const wireQ = 'M ' + (nand1EX + 8) + ',' + nand1My + ' H ' + (qOutX - outNodeR);

    // Q̄ wire: NAND2 output → Q̄ output node (straight horizontal, same Y).
    const wireQbar = 'M ' + (nand2EX + 8) + ',' + nand2My + ' H ' + (qBarOutX - outNodeR);

    // Q feedback wire: junction di Q-output wire (fbRightQ, nand1My=130) → wrap-around → NAND2 top input (350, 220).
    // Path: V turun ke fbBotY, H kiri ke fbLeftX, V naik ke nand2TopY, H kanan ke nandRSx.
    const wireQfb = 'M ' + fbRightQ + ',' + nand1My + ' V ' + fbBotY + ' H ' + fbLeftX + ' V ' + nand2TopY + ' H ' + nandRSx;

    // Q̄ feedback wire: junction di Q̄-output wire (fbRightQbar, nand2My=230) → wrap-around → NAND1 bottom input (350, 140).
    // Path: V naik ke fbTopY, H kiri ke fbLeftX, V turun ke nand1BotY, H kanan ke nandRSx.
    const wireQbarFb = 'M ' + fbRightQbar + ',' + nand2My + ' V ' + fbTopY + ' H ' + fbLeftX + ' V ' + nand1BotY + ' H ' + nandRSx;

    return <svg viewBox={'0 0 ' + svgW + ' ' + svgH} width="100%" style={{ overflow: 'visible', display: 'block' }}>
        {/* Mode badge */}
        <rect x={svgW / 2 - 55} y={4} width={110} height={22} rx={6} fill={mc.bg} stroke={mc.border} strokeWidth="1.5" />
        <text x={svgW / 2} y={19} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="700" fill={mc.text}>{'MODE: ' + mode}</text>

        {/* Input nodes — urutan S, CLK, R (CLK di tengah, sesuai gambar referensi) */}
        <InputNode ix={sInX}   iy={sInY}   val={s}   label="S (SET)"    onToggle={onToggleS}   color={sCol}   rgb={sRgb} />
        <InputNode ix={clkInX} iy={clkInY} val={clk} label="CLK"        onToggle={onToggleClk} color={clkCol} rgb={clkRgb} />
        <InputNode ix={rInX}   iy={rInY}   val={r}   label="R (RESET)"  onToggle={onToggleR}   color={rCol}   rgb={rRgb} />

        {/* Clock Mode Switch (MANUAL/AUTO) — dirender DI BAWAH tombol CLK.
            Pos: x=1 (align dgn CLK), y=285 (clkInY + 105 — gap wajar dari rect
            bottom CLK di y=201 ke label switch, sesuai aturan design.md Bagian 29.2).
            Lihat design.md Bagian 29 untuk spec lengkap (WAJIB untuk semua clock). */}
        <ClockModeSwitch
            x={1}
            y={285}
            mode={clockMode || 'manual'}
            autoActive={!!autoActive}
            onChange={onClockModeChange || (() => {})}
        />

        {/* S wire (green) — trunk + branch ke NAND3 top input */}
        <W d={wireStrunk}   val={s} col={sCol} rgb={sRgb} />
        <W d={wireS_branch} val={s} col={sCol} rgb={sRgb} />
        {/* S junction dot (visual consistency — walau tidak fan-out) */}
        <circle cx={sJunctionX} cy={sInY} r={3.5} fill={wc(s, sCol, sRgb)} style={{ transition: 'fill 0.3s' }} />

        {/* CLK fan-out wires (amber) — 2 branch ke NAND3 bot & NAND4 top */}
        <W d={wireClkTrunk} val={clk} col={clkCol} rgb={clkRgb} />
        <W d={wireClk_up}   val={clk} col={clkCol} rgb={clkRgb} />
        <W d={wireClk_dn}   val={clk} col={clkCol} rgb={clkRgb} />
        {/* CLK junction dot (karena CLK bercabang 2) */}
        <circle cx={clkJunctionX} cy={clkInY} r={3.5} fill={wc(clk, clkCol, clkRgb)} style={{ transition: 'fill 0.3s' }} />

        {/* R wire (cyan) — trunk + branch ke NAND4 bot input */}
        <W d={wireRtrunk}   val={r} col={rCol} rgb={rRgb} />
        <W d={wireR_branch} val={r} col={rCol} rgb={rRgb} />
        {/* R junction dot (visual consistency) */}
        <circle cx={rJunctionX} cy={rInY} r={3.5} fill={wc(r, rCol, rRgb)} style={{ transition: 'fill 0.3s' }} />

        {/* NAND3 gate (top-left, steering) — output = NOT(S·CLK) */}
        <NandGate sx={nandSx} ty={nand3Ty} by={nand3By} my={nand3My} ex={nand3EX}
            glow={nand3Glow} fill={nand3Fill} stroke={nand3Stroke} />
        <text x={nandSx + 15} y={nand3Ty - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={nand3Out ? nandCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NAND3</text>
        {/* NAND3 output label (S̄_gated) — di bawah gate, with overline */}
        <g>
            <text x={nand3EX + 12} y={nand3By + 13} textAnchor="start" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="600"
                fill={nand3Out ? sCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>S</text>
            <line x1={nand3EX + 12} y1={nand3By + 4} x2={nand3EX + 20} y2={nand3By + 4}
                stroke={nand3Out ? sCol : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" style={{ transition: 'stroke 0.3s' }} />
        </g>

        {/* NAND4 gate (bottom-left, steering) — output = NOT(R·CLK) */}
        <NandGate sx={nandSx} ty={nand4Ty} by={nand4By} my={nand4My} ex={nand4EX}
            glow={nand4Glow} fill={nand4Fill} stroke={nand4Stroke} />
        <text x={nandSx + 15} y={nand4Ty - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={nand4Out ? nandCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NAND4</text>
        {/* NAND4 output label (R̄_gated) — di atas gate, with overline */}
        <g>
            <text x={nand4EX + 12} y={nand4Ty - 5} textAnchor="start" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="600"
                fill={nand4Out ? rCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>R</text>
            <line x1={nand4EX + 12} y1={nand4Ty - 14} x2={nand4EX + 20} y2={nand4Ty - 14}
                stroke={nand4Out ? rCol : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" style={{ transition: 'stroke 0.3s' }} />
        </g>

        {/* NAND3, NAND4 output wires (green — Prinsip 6: output gerbang = hijau) */}
        <W d={wireNand3out} val={nand3Out} col={sCol} rgb={sRgb} />
        <W d={wireNand4out} val={nand4Out} col={sCol} rgb={sRgb} />

        {/* NAND1 gate (top-right, latch) — output = Q.
            Inputs: NAND3 out (top), Q̄ feedback (bottom). */}
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
