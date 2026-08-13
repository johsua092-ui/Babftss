import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';
import ClockModeSwitch from './ClockModeSwitch';

// ════════════════════════════════════════════════════════════════════════════
// Card 17 — T Flip-Flop (2 AND + 2 NOR TOPOLOGY) — SVG DIAGRAM
// ════════════════════════════════════════════════════════════════════════════
// T Flip-Flop dengan topologi 2 AND (steering) + 2 NOR (cross-coupled latch).
//
// Topologi (koreksi dari gambar referensi user 13 Aug 2026 — feedback AND
// DITUKAR dari gambar asli supaya beneran toggle):
//   Stage 1 (steering ANDs — kiri, 3-input AND):
//     Top AND (top-left):  inputs (T, CLK, Q_feedback)   → output = T·CLK·Q
//     Bot AND (bot-left):  inputs (T, CLK, Q̄_feedback)  → output = T·CLK·Q̄
//   Stage 2 (cross-coupled NOR latch — kanan, 2-input NOR):
//     Top NOR (top-right, output Q):  inputs (Top AND out, Q̄_fb)
//     Bot NOR (bot-right, output Q̄): inputs (Bot AND out, Q_fb)
//   Cross-coupling (pola CircuitDiagram_SRLatch — wrap-around outside NOR):
//     Q̄ feedback (dari Bot NOR output) → Top NOR bot input (cross-coupling)
//     Q  feedback (dari Top NOR output) → Bot NOR bot input (cross-coupling)
//   External steering feedback (Q/Q̄ balik ke AND, supaya toggle):
//     Q̄ feedback (dari Bot NOR output) → Top AND bot input (steering)
//     Q  feedback (dari Top NOR output) → Bot AND bot input (steering)
//
// Input order (top-to-bottom): T, CLK — sesuai gambar referensi user.
//
// Mode (2-mode, diturunkan dari tGated = T·CLK):
//   tGated=0 (T=0 ATAU CLK=0) → HOLD    (Q tetap nilai sebelumnya)
//   tGated=1 (T=1 DAN CLK=1)  → TOGGLE  (Q berbalik dari nilai sebelumnya)
//   SET/RESET → tidak applicable (T FF tidak punya input terlarang; tampilkan
//               sebagai sub-kasus TOGGLE untuk konsistensi visual 4-row table)
//
// Vocabulary exception §35: T FF secara fundamental hanya punya TOGGLE/HOLD.
// INVALID tidak mungkin (tidak ada input terlarang). Lihat CircuitCard17.jsx
// header comment untuk justifikasi lengkap.
export default function CircuitDiagram17({ t, clk, q, qBar, mode, onToggleT, onToggleClk, clockMode, autoActive, onClockModeChange }) {
    // ── Color palette ──
    // T = hijau (Prinsip 1) — sinyal data utama (input), sepanjang jalur.
    const tCol = '#4ade80', tRgb = hexToRgbStr(tCol);
    // CLK = amber/kuning — sinyal kontrol (Prinsip 4: warna unik, bukan hijau).
    const clkCol = '#facc15', clkRgb = hexToRgbStr(clkCol);
    // AND gate body = oranye (konsisten dengan NAND di Card 16 — design.md 1.5).
    const andCol = '#fb923c', andRgb = hexToRgbStr(andCol);
    // NOR gate body = pink (konsisten dengan NOR di CircuitDiagram_SRLatch).
    const norCol = '#f472b6', norRgb = hexToRgbStr(norCol);
    // Feedback wire colors (distinct dari output wires, pola SRLatch):
    //   Q feedback  = oranye (SAMA dengan AND color — tapi spatial terpisah:
    //                 AND body di x=210-255, Q fb wire di x=295-380 berbeda segmen Y).
    //   Q̄ feedback = ungu   (#a78bfa) — distinct dari semua wire lain.
    const qFbCol = '#fb923c', qFbRgb = hexToRgbStr(qFbCol);
    const qBarFbCol = '#a78bfa', qBarFbRgb = hexToRgbStr(qBarFbCol);
    // Output Q = hijau (sesuai Card 15/16). Q̄ = pink (sesuai Card 15/16).
    const qOutCol = '#4ade80', qOutRgb = hexToRgbStr(qOutCol);
    const qBarOutCol = '#f472b6', qBarOutRgb = hexToRgbStr(qBarOutCol);

    // ── Helper functions (pola CircuitDiagram_SRLatch / Card 16 TEMPLATE) ──
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
    const tInX = 1,   tInY = 130;    // T — atas (hijau)
    const clkInX = 1, clkInY = 230;  // CLK — bawah (amber)

    // Fan-out junctions — T dan CLK keduanya fan-out ke 2 AND gates.
    const tJunctionX = 75;     // T fan-out: ke Top AND top input + Bot AND top input
    const clkJunctionX = 135;  // CLK fan-out: ke Top AND mid input + Bot AND mid input

    // ── Stage 1: Top AND (top-left) & Bot AND (bottom-left) — steering ──
    // Top AND: inputs (T, CLK, Q_fb)   → output = T·CLK·Q
    // Bot AND: inputs (T, CLK, Q̄_fb)  → output = T·CLK·Q̄
    // AND gate (3-input) — D-shape: flat back, semicircle front, NO bubble.
    // Dimensi: width 30 rect + 15 arc = 45 dari sx ke arc ujung. Wire exit di ex.
    // (Bedanya dengan NAND: NAND ada bubble 8px di output; AND tidak.)
    const andSx = 210, andW = 45;
    const topAndMy = 130, topAndTy = topAndMy - 18, topAndBy = topAndMy + 18;
    const topAndEX = andSx + andW; // 255 — ujung arc (no bubble, wire exit langsung di sini)
    // 3 inputs vertically distributed: top (y-12), mid (y), bot (y+12)
    const topAndTopY = topAndMy - 12, topAndMidY = topAndMy, topAndBotY = topAndMy + 12; // 118, 130, 142

    const botAndMy = 230, botAndTy = botAndMy - 18, botAndBy = botAndMy + 18;
    const botAndEX = andSx + andW;
    const botAndTopY = botAndMy - 12, botAndMidY = botAndMy, botAndBotY = botAndMy + 12; // 218, 230, 242

    // ── Stage 2: Top NOR (top-right) & Bot NOR (bottom-right) — cross-coupled latch ──
    // Top NOR (out Q):  inputs (Top AND out, Q̄_fb)
    // Bot NOR (out Q̄): inputs (Bot AND out, Q_fb)
    // NOR gate — curved OR-shape + bubble di output.
    // Dimensi: width 30 rect + 15 arc + 8 bubble = 53 dari sx ke wire exit.
    //   ex = sx + 45 (ujung arc). Bubble center di ex+4 (radius 4). Wire exit di ex+8.
    const norSx = 350, norW = 45;
    const topNorMy = 130, topNorTy = topNorMy - 18, topNorBy = topNorMy + 18;
    const topNorEX = norSx + norW; // 395 — ujung arc (sebelum bubble)
    const topNorTopY = topNorMy - 10, topNorBotY = topNorMy + 10; // 120, 140

    const botNorMy = 230, botNorTy = botNorMy - 18, botNorBy = botNorMy + 18;
    const botNorEX = norSx + norW;
    const botNorTopY = botNorMy - 10, botNorBotY = botNorMy + 10; // 220, 240

    // Feedback wire lanes (pola CircuitDiagram_SRLatch — wrap-around outside NOR).
    // Cross-coupling NOR feedback + steering AND feedback pakai lanes terpisah:
    //   fbLeftX_NOR = 325 (cross-coupling NOR, di kiri NOR yang mulai di x=350)
    //   fbLeftX_AND = 295 (steering AND, di kanan AND yang berakhir di x=255)
    const fbLeftX_NOR = 325;
    const fbLeftX_AND = 295;
    const fbTopY = 90;   // di atas Top NOR (yang mulai dari y=112)
    const fbBotY = 275;  // di bawah Bot NOR (yang berakhir di y=248)
    const fbRightQ = 425;    // Q fb junction di Q-output wire
    const fbRightQbar = 440; // Q̄ fb junction di Q̄-output wire

    // Q/Q̄ output nodes
    const qOutX = 550, qOutY = 130;
    const qBarOutX = 550, qBarOutY = 230;

    // Derived sinyal internal
    const tGated = t && clk;
    const topAndOut = t && clk && q;        // T·CLK·Q — R signal untuk Top NOR
    const botAndOut = t && clk && qBar;     // T·CLK·Q̄ — S signal untuk Bot NOR

    // Gate glow/fill/stroke — mengikuti output masing-masing gate
    const topAndGlow = mkGlow(topAndOut, andRgb), topAndFill = mkFill(topAndOut, andRgb), topAndStroke = mkStroke(topAndOut, andCol);
    const botAndGlow = mkGlow(botAndOut, andRgb), botAndFill = mkFill(botAndOut, andRgb), botAndStroke = mkStroke(botAndOut, andCol);
    const topNorGlow = mkGlow(q, norRgb),    topNorFill = mkFill(q, norRgb),    topNorStroke = mkStroke(q, norCol);
    const botNorGlow = mkGlow(qBar, norRgb), botNorFill = mkFill(qBar, norRgb), botNorStroke = mkStroke(qBar, norCol);

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

    // AND gate (3-input D-shape: flat back, semicircle front, NO bubble)
    //   ex = sx + 45 (ujung arc). Wire exit langsung di ex (no bubble).
    const AndGate = ({ sx, ty, by, my, ex, glow, fill, stroke }) => <path
        d={'M ' + sx + ',' + ty + ' L ' + (sx + 30) + ',' + ty +
           ' A 15,15 0 0 1 ' + (sx + 30) + ',' + by +
           ' L ' + sx + ',' + by + ' Z'}
        fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />;

    // NOR gate (2-input curved OR-shape + bubble di output)
    //   ex = sx + 45 (ujung arc). Bubble center di ex+4 (radius 4). Wire exit di ex+8.
    //   Path: kurva OR khas (back curved, front pointed) + bubble circle.
    const NorGate = ({ sx, ty, by, my, ex, glow, fill, stroke }) => <Fragment>
        {/* OR-shape body: back curved (concave), front converges to point */}
        <path d={
            'M ' + sx + ',' + ty +
            ' Q ' + (sx + 8) + ',' + my + ' ' + sx + ',' + by +   // back concave curve
            ' L ' + (sx + 20) + ',' + by +                          // bottom flat
            ' A 18,18 0 0 1 ' + (sx + 20) + ',' + ty +             // front arc (curved to point)
            ' Z'
        }
            fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
        {/* Bubble inverter di output */}
        <circle cx={ex + 4} cy={my} r="4" fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
    </Fragment>;

    // ── Mode badge (2-mode TOGGLE/HOLD + SET/RESET dimmed) ──
    const modeColors = {
        TOGGLE: { bg: 'rgba(168,85,247,0.18)',  border: 'rgba(168,85,247,0.5)',  text: '#a855f7' },
        HOLD:   { bg: 'rgba(250,204,21,0.18)',  border: 'rgba(250,204,21,0.5)',  text: '#facc15' },
        SET:    { bg: 'rgba(74,222,128,0.18)',  border: 'rgba(74,222,128,0.5)',  text: '#4ade80' },
        RESET:  { bg: 'rgba(34,211,238,0.18)',  border: 'rgba(34,211,238,0.5)',  text: '#22d3ee' },
    };
    const mc = modeColors[mode] || modeColors.HOLD;

    // ── Wire paths ──
    // T main trunk: input → junction
    const wireTtrunk = 'M ' + (tInX + inputNodeW) + ',' + tInY + ' H ' + tJunctionX;
    // T branch up: junction → Top AND top input (210, 118). Rendered inline di JSX.
    // T branch down: junction → Bot AND top input (210, 218). Rendered inline di JSX
    //   (memutar ke kanan ke x=145 dulu untuk hindari CLK trunk di x=135).

    // CLK main trunk: input → junction
    const wireClkTrunk = 'M ' + (clkInX + inputNodeW) + ',' + clkInY + ' H ' + clkJunctionX;
    // CLK branch up: junction → Top AND mid input (210, 130). CLK junction y=230 naik ke y=130.
    const wireClk_up = 'M ' + clkJunctionX + ',' + clkInY + ' V ' + topAndMidY + ' H ' + andSx;
    // CLK branch down: junction → Bot AND mid input (210, 230). CLK junction y=230 langsung H.
    const wireClk_dn = 'M ' + clkJunctionX + ',' + clkInY + ' V ' + botAndMidY + ' H ' + andSx;

    // Top AND output wire → Top NOR top input (350, 120).
    // Wire exit di (topAndEX, 130) = (255, 130). Lalu H ke 340, V ke 120, H ke 350.
    const wireTopAndOut = 'M ' + topAndEX + ',' + topAndMy + ' H 340 V ' + topNorTopY + ' H ' + norSx;

    // Bot AND output wire → Bot NOR top input (350, 220).
    // Wire exit di (botAndEX, 230) = (255, 230). Lalu H ke 340, V ke 220, H ke 350.
    const wireBotAndOut = 'M ' + botAndEX + ',' + botAndMy + ' H 340 V ' + botNorTopY + ' H ' + norSx;

    // Q wire: Top NOR output → Q output node (straight horizontal, same Y).
    // Wire exit di (topNorEX+8, 130) = (403, 130).
    const wireQ = 'M ' + (topNorEX + 8) + ',' + topNorMy + ' H ' + (qOutX - outNodeR);

    // Q̄ wire: Bot NOR output → Q̄ output node (straight horizontal, same Y).
    const wireQbar = 'M ' + (botNorEX + 8) + ',' + botNorMy + ' H ' + (qBarOutX - outNodeR);

    // ── 4 feedback wires (2 cross-coupling NOR + 2 steering AND) ──
    // Cross-coupling NOR feedback (pola SRLatch — wrap-around outside NOR):
    //   Q̄_fb → Top NOR bot input (350, 140) — cross-coupling
    //   Q_fb  → Bot NOR bot input (350, 240) — cross-coupling
    // Path Q̄_fb (cross-coupling): junction di Q̄ wire (fbRightQbar, 230) → V naik ke fbTopY → H kiri ke fbLeftX_NOR → V turun ke 140 → H kanan ke 350.
    const wireQbarFb_nor = 'M ' + fbRightQbar + ',' + botNorMy + ' V ' + fbTopY + ' H ' + fbLeftX_NOR + ' V ' + topNorBotY + ' H ' + norSx;
    // Path Q_fb (cross-coupling): junction di Q wire (fbRightQ, 130) → V turun ke fbBotY → H kiri ke fbLeftX_NOR → V naik ke 240 → H kanan ke 350.
    const wireQFb_nor = 'M ' + fbRightQ + ',' + topNorMy + ' V ' + fbBotY + ' H ' + fbLeftX_NOR + ' V ' + botNorBotY + ' H ' + norSx;

    // Steering AND feedback (Q/Q̄ balik ke AND untuk toggle):
    //   Q̄_fb → Top AND bot input (210, 142) — steering ( pakai Top AND karena
    //     Top AND output = T·CLK·Q harus jadi R = "reset saat Q=1", jadi Q feedback
    //     ke Top AND. Bukan Q̄. WAIT — saya perlu recheck.
    //
    // Recheck topology:
    //   Top AND = T·CLK·Q (Q feedback) — karena Q=1 triggers R=1 → forces Q→0 (toggle 1→0)
    //   Bot AND = T·CLK·Q̄ (Q̄ feedback) — karena Q̄=1 (Q=0) triggers S=1 → forces Q→1 (toggle 0→1)
    //
    // So:
    //   Q feedback  → Top AND bot input (steering) — Q_fb ke Top AND
    //   Q̄ feedback → Bot AND bot input (steering) — Q̄_fb ke Bot AND
    //
    // Path Q_fb (steering): junction di Q wire (fbRightQ, 130) → V turun ke fbBotY →
    //   H kiri ke fbLeftX_AND (295) → V naik ke topAndBotY (142) → H kanan ke 210.
    //   Tapi fbLeftX_AND=295 berada di KANAN AND gate (yang berakhir di x=255).
    //   Jadi feedback wire harus terus H kiri sampai ke AND top input.
    //   Recheck: AND berakhir di x=255 (kanan). Untuk balik ke AND, wire harus
    //   mencapai x < 210. Jadi fbLeftX_AND harus di KIRI AND (mis. 195), bukan di kanan.
    //   Tapi kalau fbLeftX_AND di 195, wire akan lewat DI BELAKANG/BAWAH AND gates — bisa crossing.
    //   Lebih baik routing: feedback wire dari Q wire → keluar kanan → turun/naik →
    //   masuk ke AND dari KIRI (mengitari AND gate di sisi kiri).
    //
    // Actually solusi cleaner: feedback AND masuk dari TOP/BOT AND gate (bukan dari kiri).
    // Tapi AND hanya punya input dari kiri. Jadi harus masuk dari kiri.
    //
    // Routing: Q_fb ke Top AND bot input (210, 142) —
    //   Dari junction Q wire (425, 130), wire tidak bisa H ke 210 langsung karena
    //   akan menabrak Top NOR (di x=350-400). Wire harus MEMUTAR:
    //     - Naik ke fbTopY=90 dari 425,130 → 425,90
    //     - H kiri ke 195 (kiri AND) → 195,90
    //     - Turun ke 142 → 195,142
    //     - H kanan ke 210 → 210,142 (masuk Top AND bot input)
    //   Tapi fbTopY=90 sudah dipakai oleh Q̄_fb NOR (yang juga lewat x=325 ke kiri).
    //   Kita perlu Y lane terpisah. Pakai fbTopY2 = 70 (lebih tinggi).
    //
    // Hmm ini jadi rumit. Alternatif simpler: gabungkan Q feedback ke satu wire saja
    // (Q_fb untuk NOR cross-coupling + Q_fb untuk AND steering pakai wire yang sama).
    // Karena Q source-nya sama (junction di Q output wire), kita bisa tap 2x dari wire yang sama.
    //
    // OK final routing: 2 jalur feedback terpisah, masing-masing dengan Y lane sendiri:
    //   Q lane:
    //     junction Q wire (425, 130) → V ke fbBotY=275 → H ke fbLeftX_AND=295 → V ke topAndBotY=142 → H ke 210
    //     Tapi 295 masih di kanan AND (yang berakhir di 255). Wire harus H ke 195 lalu H ke 210.
    //     Lebih clean: langsung H ke 195.
    //   Q̄ lane:
    //     junction Q̄ wire (440, 230) → V ke fbTopY=90 → H ke fbLeftX_AND=195 → V ke botAndBotY=242 → H ke 210
    //
    // Tapi Q̄_fb NOR juga lewat fbTopY=90 (ke kiri sampai 325). Q̄_fb AND lewat fbTopY=90 (ke kiri sampai 195).
    //   Mereka akan OVERLAP di y=90 dari x=325 sampai x=440 (jalur yang sama)! Itu visual confusing.
    //   Solusi: pakai Y lane berbeda. Q̄_fb NOR pakai fbTopY=90, Q̄_fb AND pakai fbTopY=75.
    //
    // Atau solusi lain: KARENA Q̄_fb NOR dan Q̄_fb AND berasal dari sumber yang sama (Q̄ output),
    //   kita bisa pakai SATU wire saja dari Q̄ output ke titik branching, lalu branching ke 2 tujuan.
    //   Ini lebih clean secara visual.
    //
    // OK saya pakai approach branch: 1 trunk feedback keluar dari Q/Q̄ wire, lalu branch 2 arah.
    // Tapi ini agak rumit di SVG. Mari saya pakai approach simple: 2 wire terpisah dengan Y lane berbeda.
    //
    // Final routing:
    //   Q feedback:
    //     junction Q wire (425, 130) → V turun ke fbBotY=275 → H kiri ke 195 → V naik ke 142 → H kanan ke 210
    //   Q̄ feedback:
    //     junction Q̄ wire (440, 230) → V naik ke fbTopY=90 → H kiri ke 195 → V turun ke 242 → H kanan ke 210
    //
    // Tapi Q feedback lewat fbBotY=275, dan Q_fb NOR juga lewat fbBotY=275 (ke kiri ke 325).
    // Mereka akan overlap di y=275 dari x=325 sampai x=425. Sama problem.
    //
    // OK final solution: gabungkan! Pakai single feedback trunk untuk masing-masing Q dan Q̄,
    // dengan 2 branches di ujung. Visual lebih clean.
    //
    // Q feedback trunk:
    //   junction Q wire (425, 130) → V turun ke fbBotY=275
    //   Branch 1 (ke NOR cross-coupling, Bot NOR bot input 350, 240):
    //     Dari (425, 275) → H kiri ke fbLeftX_NOR=325 → V naik ke 240 → H kanan ke 350
    //   Branch 2 (ke AND steering, Top AND bot input 210, 142):
    //     Dari (425, 275) → H kiri ke fbLeftX_AND=195 → V naik ke 142 → H kanan ke 210
    //   Wire H dari 425 ke 195 overlap dengan H dari 425 ke 325 — itu OK karena itu 1 trunk.
    //
    // Q̄ feedback trunk:
    //   junction Q̄ wire (440, 230) → V naik ke fbTopY=90
    //   Branch 1 (ke NOR cross-coupling, Top NOR bot input 350, 140):
    //     Dari (440, 90) → H kiri ke fbLeftX_NOR=325 → V turun ke 140 → H kanan ke 350
    //   Branch 2 (ke AND steering, Bot AND bot input 210, 242):
    //     Dari (440, 90) → H kiri ke fbLeftX_AND=195 → V turun ke 242 → H kanan ke 210
    //
    // Q fb (combined): M 425,130 V 275 H 195 V 142 H 210 (main trunk + AND branch)
    //                  M 325,275 V 240 H 350 (NOR branch — tap dari main trunk di 325,275)
    // Q̄ fb (combined): M 440,230 V 90 H 195 V 242 H 210 (main trunk + AND branch)
    //                  M 325,90 V 140 H 350 (NOR branch — tap dari main trunk di 325,90)
    //
    // OK ini clean. Saya pakai ini.

    // Q feedback: main trunk ke AND + branch ke NOR
    const wireQfb_main = 'M ' + fbRightQ + ',' + topNorMy + ' V ' + fbBotY + ' H ' + fbLeftX_AND + ' V ' + topAndBotY + ' H ' + andSx;
    const wireQfb_nor_branch = 'M ' + fbLeftX_NOR + ',' + fbBotY + ' V ' + botNorBotY + ' H ' + norSx;

    // Q̄ feedback: main trunk ke AND + branch ke NOR
    const wireQbarFb_main = 'M ' + fbRightQbar + ',' + botNorMy + ' V ' + fbTopY + ' H ' + fbLeftX_AND + ' V ' + botAndBotY + ' H ' + andSx;
    const wireQbarFb_nor_branch = 'M ' + fbLeftX_NOR + ',' + fbTopY + ' V ' + topNorBotY + ' H ' + norSx;

    return <svg viewBox={'0 0 ' + svgW + ' ' + svgH} width="100%" style={{ overflow: 'visible', display: 'block' }}>
        {/* Mode badge */}
        <rect x={svgW / 2 - 55} y={4} width={110} height={22} rx={6} fill={mc.bg} stroke={mc.border} strokeWidth="1.5" />
        <text x={svgW / 2} y={19} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="700" fill={mc.text}>{'MODE: ' + mode}</text>

        {/* Input nodes — urutan T, CLK (sesuai gambar referensi) */}
        <InputNode ix={tInX}   iy={tInY}   val={t}   label="T (TOGGLE)" onToggle={onToggleT}   color={tCol}   rgb={tRgb} />
        <InputNode ix={clkInX} iy={clkInY} val={clk} label="CLK"        onToggle={onToggleClk} color={clkCol} rgb={clkRgb} />

        {/* Clock Mode Switch (MANUAL/AUTO) — dirender DI BAWAH tombol CLK.
            Lihat design.md Bagian 29 untuk spec lengkap (WAJIB untuk semua clock). */}
        <ClockModeSwitch
            x={1}
            y={285}
            mode={clockMode || 'manual'}
            autoActive={!!autoActive}
            onChange={onClockModeChange || (() => {})}
        />

        {/* T fan-out wires (green) — trunk + 2 branches ke Top AND top input & Bot AND top input */}
        <W d={wireTtrunk} val={t} col={tCol} rgb={tRgb} />
        {/* T branch up: ke Top AND top input (210, 118) */}
        <path d={'M ' + tJunctionX + ',' + tInY + ' V ' + topAndTopY + ' H ' + andSx}
            fill="none" stroke={wc(t, tCol, tRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.3s' }} />
        {/* T branch down: ke Bot AND top input (210, 218) — memutar ke kanan untuk hindari CLK trunk */}
        <path d={'M ' + tJunctionX + ',' + tInY + ' H 145 V ' + botAndTopY + ' H ' + andSx}
            fill="none" stroke={wc(t, tCol, tRgb)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.3s' }} />
        {/* T junction dot */}
        <circle cx={tJunctionX} cy={tInY} r={3.5} fill={wc(t, tCol, tRgb)} style={{ transition: 'fill 0.3s' }} />

        {/* CLK fan-out wires (amber) — trunk + 2 branches ke Top AND mid input & Bot AND mid input */}
        <W d={wireClkTrunk} val={clk} col={clkCol} rgb={clkRgb} />
        <W d={wireClk_up}   val={clk} col={clkCol} rgb={clkRgb} />
        <W d={wireClk_dn}   val={clk} col={clkCol} rgb={clkRgb} />
        {/* CLK junction dot */}
        <circle cx={clkJunctionX} cy={clkInY} r={3.5} fill={wc(clk, clkCol, clkRgb)} style={{ transition: 'fill 0.3s' }} />

        {/* Top AND gate (top-left, steering) — output = T·CLK·Q (Q feedback) */}
        <AndGate sx={andSx} ty={topAndTy} by={topAndBy} my={topAndMy} ex={topAndEX}
            glow={topAndGlow} fill={topAndFill} stroke={topAndStroke} />
        <text x={andSx + 15} y={topAndTy - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={topAndOut ? andCol : '#475569'} style={{ transition: 'fill 0.3s' }}>AND1</text>

        {/* Bot AND gate (bottom-left, steering) — output = T·CLK·Q̄ (Q̄ feedback) */}
        <AndGate sx={andSx} ty={botAndTy} by={botAndBy} my={botAndMy} ex={botAndEX}
            glow={botAndGlow} fill={botAndFill} stroke={botAndStroke} />
        <text x={andSx + 15} y={botAndTy - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={botAndOut ? andCol : '#475569'} style={{ transition: 'fill 0.3s' }}>AND2</text>

        {/* AND output wires (oranye — output gerbang steering) */}
        <W d={wireTopAndOut} val={topAndOut} col={andCol} rgb={andRgb} />
        <W d={wireBotAndOut} val={botAndOut} col={andCol} rgb={andRgb} />

        {/* Top NOR gate (top-right, latch) — output = Q.
            Inputs: Top AND out (top), Q̄ feedback (bottom, cross-coupling). */}
        <NorGate sx={norSx} ty={topNorTy} by={topNorBy} my={topNorMy} ex={topNorEX}
            glow={topNorGlow} fill={topNorFill} stroke={topNorStroke} />
        <text x={norSx + 15} y={topNorTy - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={q ? norCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NOR1</text>

        {/* Bot NOR gate (bottom-right, latch) — output = Q̄.
            Inputs: Bot AND out (top), Q feedback (bottom, cross-coupling). */}
        <NorGate sx={norSx} ty={botNorTy} by={botNorBy} my={botNorMy} ex={botNorEX}
            glow={botNorGlow} fill={botNorFill} stroke={botNorStroke} />
        <text x={norSx + 15} y={botNorTy - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={qBar ? norCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NOR2</text>

        {/* Q, Q̄ output wires (dari NOR output pins ke output nodes) */}
        <W d={wireQ}    val={q}    col={qOutCol}    rgb={qOutRgb} />
        <W d={wireQbar} val={qBar} col={qBarOutCol} rgb={qBarOutRgb} />

        {/* Q feedback wires (oranye) — main trunk ke AND1 + branch ke NOR2 cross-coupling */}
        <W d={wireQfb_main}        val={q}    col={qFbCol}    rgb={qFbRgb} />
        <W d={wireQfb_nor_branch}  val={q}    col={qFbCol}    rgb={qFbRgb} />
        {/* Q fb junction dot di Q output wire */}
        <circle cx={fbRightQ} cy={topNorMy} r={3.5} fill={wc(q, qOutCol, qOutRgb)} style={{ transition: 'fill 0.3s' }} />
        {/* Q fb branch tap dot di (fbLeftX_NOR, fbBotY) — branching point */}
        <circle cx={fbLeftX_NOR} cy={fbBotY} r={3.5} fill={wc(q, qFbCol, qFbRgb)} style={{ transition: 'fill 0.3s' }} />
        {/* Q feedback label */}
        <text x={(fbRightQ + fbLeftX_AND) / 2} y={fbBotY + 16} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="11" fontWeight="700"
            fill={q ? qFbCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>Q</text>

        {/* Q̄ feedback wires (ungu) — main trunk ke AND2 + branch ke NOR1 cross-coupling */}
        <W d={wireQbarFb_main}       val={qBar} col={qBarFbCol} rgb={qBarFbRgb} />
        <W d={wireQbarFb_nor_branch} val={qBar} col={qBarFbCol} rgb={qBarFbRgb} />
        {/* Q̄ fb junction dot di Q̄ output wire */}
        <circle cx={fbRightQbar} cy={botNorMy} r={3.5} fill={wc(qBar, qBarOutCol, qBarOutRgb)} style={{ transition: 'fill 0.3s' }} />
        {/* Q̄ fb branch tap dot di (fbLeftX_NOR, fbTopY) — branching point */}
        <circle cx={fbLeftX_NOR} cy={fbTopY} r={3.5} fill={wc(qBar, qBarFbCol, qBarFbRgb)} style={{ transition: 'fill 0.3s' }} />
        {/* Q̄ feedback label (overline manual) */}
        <g>
            <text x={(fbRightQbar + fbLeftX_AND) / 2} y={fbTopY - 8} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="11" fontWeight="700"
                fill={qBar ? qBarFbCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>Q</text>
            <line x1={(fbRightQbar + fbLeftX_AND) / 2 - 7} y1={fbTopY - 19} x2={(fbRightQbar + fbLeftX_AND) / 2 + 7} y2={fbTopY - 19}
                stroke={qBar ? qBarFbCol : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" style={{ transition: 'stroke 0.3s' }} />
        </g>

        {/* Output nodes */}
        <OutputNode ox={qOutX} oy={qOutY} val={q} label="Q" color={qOutCol} rgb={qOutRgb} />
        <OutputNode ox={qBarOutX} oy={qBarOutY} val={qBar} label="Q" color={qBarOutCol} rgb={qBarOutRgb} overline />
    </svg>;
}
