import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram_SRLatch({ s, r, q, qBar, mode, onToggleS, onToggleR }) {
    // Colors
    const sCol = '#4ade80', sRgb = hexToRgbStr(sCol);       // S input - hijau (input pertama)
    const rCol = '#22d3ee', rRgb = hexToRgbStr(rCol);       // R input - cyan
    const qFbCol = '#fb923c', qFbRgb = hexToRgbStr(qFbCol);   // Q feedback - oranye
    const qBarFbCol = '#a78bfa', qBarFbRgb = hexToRgbStr(qBarFbCol); // Q' feedback - ungu
    const qOutCol = '#4ade80', qOutRgb = hexToRgbStr(qOutCol);   // Q output - hijau
    const qBarOutCol = '#f472b6', qBarOutRgb = hexToRgbStr(qBarOutCol); // Q' output - pink
    const norCol = '#f472b6', norRgb = hexToRgbStr(norCol);   // NOR gate tema pink

    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;
    const mkGlow = (val, rgb) => val
        ? `drop-shadow(0 0 4px rgba(${rgb},0.9)) drop-shadow(0 0 10px rgba(${rgb},0.5))` : 'none';
    const mkFill = (val, rgb) => val ? `rgba(${rgb},0.13)` : '#0f172a';
    const mkStroke = (val, col) => val ? col : '#475569';

    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 13;

    // Layout
    const svgW = 520, svgH = 340;

    // Input nodes
    const sInX = 1, sInY = 70;
    const rInX = 1, rInY = 270;

    // NOR1 (atas) — inputs: R, Q' → output Q
    const nor1SX = 200, nor1MY = 100;
    const nor1TY = nor1MY - 18, nor1BY = nor1MY + 18;
    const nor1EX = nor1SX + 55;

    // NOR2 (bawah) — inputs: S, Q → output Q'
    const nor2SX = 200, nor2MY = 240;
    const nor2TY = nor2MY - 18, nor2BY = nor2MY + 18;
    const nor2EX = nor2SX + 55;

    // Feedback junction points (kanan gate)
    const qJX = nor1EX + 30;    // Q feedback junction
    const qBarJX = nor2EX + 30; // Q' feedback junction

    // Feedback route X (di kanan junction, balik ke kiri)
    const fbRouteX = 440;

    // Output nodes
    const qOutX = fbRouteX + 40;
    const qOutY = nor1MY;
    const qBarOutX = fbRouteX + 40;
    const qBarOutY = nor2MY;

    // NOR glow/fill/stroke
    const nor1Active = !(r || qBar);  // NOR1 output = Q
    const nor2Active = !(s || q);     // NOR2 output = Q'
    const nor1Glow = mkGlow(q, norRgb), nor1Fill = mkFill(q, norRgb), nor1Stroke = mkStroke(q, norCol);
    const nor2Glow = mkGlow(qBar, norRgb), nor2Fill = mkFill(qBar, norRgb), nor2Stroke = mkStroke(qBar, norCol);

    // NOR gate shape: OR body + bubble
    const NorGate = ({ sx, ty, by, my, ex, glow, fill, stroke }) => <Fragment>
        <path d={`M ${sx},${ty} C ${sx + 14},${ty} ${ex - 18},${my - 6} ${ex - 6},${my} C ${ex - 18},${my + 6} ${sx + 14},${by} ${sx},${by} C ${sx + 10},${my + 5} ${sx + 10},${my - 5} ${sx},${ty} Z`}
            fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
        <circle cx={ex} cy={my} r="6" fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
    </Fragment>;

    // Input node
    const InputNode = ({ ix, iy, val, label, onToggle, color, rgb }) => <g onClick={onToggle} style={{ cursor: 'pointer' }}>
        <rect x={ix} y={iy - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx}
            fill={val ? `rgba(${rgb},0.2)` : `rgba(${rgb},0.1)`}
            stroke={val ? color : `rgba(${rgb},0.3)`} strokeWidth="1.5" style={{ transition: 'all 0.25s' }} />
        <text x={ix + 24} y={iy - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">{label}</text>
        <circle cx={ix + 24} cy={iy} r={nodeR}
            fill={val ? color : `rgba(${rgb},0.15)`}
            stroke={val ? color : `rgba(${rgb},0.4)`} strokeWidth="1.5"
            style={{ filter: val ? `drop-shadow(0 0 5px rgba(${rgb},0.8))` : 'none', transition: 'all 0.25s' }} />
        <text x={ix + 24} y={iy + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold"
            fill={val ? color : `rgba(${rgb},0.5)`}>{val ? '1' : '0'}</text>
    </g>;

    // Output node
    const OutputNode = ({ ox, oy, val, label, color, rgb }) => <Fragment>
        <text x={ox} y={oy - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">{label}</text>
        <circle cx={ox} cy={oy} r={outNodeR}
            fill={val ? color : '#1e293b'}
            stroke={val ? color : '#334155'} strokeWidth="2"
            style={{ filter: val ? `drop-shadow(0 0 8px rgba(${rgb},0.9)) drop-shadow(0 0 18px rgba(${rgb},0.5))` : 'none', transition: 'all 0.3s' }} />
        <text x={ox} y={oy + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold"
            fill={val ? '#000' : '#475569'} style={{ transition: 'fill 0.3s' }}>{val ? '1' : '0'}</text>
    </Fragment>;

    // Wire helper
    const W = ({ d, val, col, rgb }) => <path d={d} fill="none" stroke={wc(val, col, rgb)} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.3s' }} />;

    // Mode badge colors
    const modeColors = {
        SET: { bg: 'rgba(74,222,128,0.18)', border: 'rgba(74,222,128,0.5)', text: '#4ade80' },
        RESET: { bg: 'rgba(34,211,238,0.18)', border: 'rgba(34,211,238,0.5)', text: '#22d3ee' },
        HOLD: { bg: 'rgba(250,204,21,0.18)', border: 'rgba(250,204,21,0.5)', text: '#facc15' },
        INVALID: { bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.5)', text: '#ef4444' },
    };
    const mc = modeColors[mode] || modeColors.HOLD;

    return <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ overflow: 'visible', display: 'block' }}>
        {/* Mode badge */}
        <rect x={svgW / 2 - 55} y={4} width={110} height={22} rx={6}
            fill={mc.bg} stroke={mc.border} strokeWidth="1.5" />
        <text x={svgW / 2} y={19} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="700"
            fill={mc.text}>MODE: {mode}</text>

        {/* Input nodes */}
        <InputNode ix={sInX} iy={sInY} val={s} label="S (SET)" onToggle={onToggleS} color={sCol} rgb={sRgb} />
        <InputNode ix={rInX} iy={rInY} val={r} label="R (RESET)" onToggle={onToggleR} color={rCol} rgb={rRgb} />

        {/* Wire S → NOR2 top input (hijau) */}
        <W d={`M ${sInX + inputNodeW},${sInY} H 80 V ${nor2TY} H ${nor2SX}`} val={s} col={sCol} rgb={sRgb} />

        {/* Wire R → NOR1 bottom input (cyan) */}
        <W d={`M ${rInX + inputNodeW},${rInY} H 120 V ${nor1BY} H ${nor1SX}`} val={r} col={rCol} rgb={rRgb} />

        {/* NOR gates */}
        <NorGate sx={nor1SX} ty={nor1TY} by={nor1BY} my={nor1MY} ex={nor1EX}
            glow={nor1Glow} fill={nor1Fill} stroke={nor1Stroke} />
        <text x={nor1SX - 12} y={nor1MY + 3} textAnchor="end" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={q ? norCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NOR1</text>

        <NorGate sx={nor2SX} ty={nor2TY} by={nor2BY} my={nor2MY} ex={nor2EX}
            glow={nor2Glow} fill={nor2Fill} stroke={nor2Stroke} />
        <text x={nor2SX - 12} y={nor2MY + 3} textAnchor="end" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={qBar ? norCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NOR2</text>

        {/* NOR1 output → Q junction (hijau) */}
        <W d={`M ${nor1EX + 6},${nor1MY} H ${qJX}`} val={q} col={qOutCol} rgb={qOutRgb} />

        {/* NOR2 output → Q' junction (pink) */}
        <W d={`M ${nor2EX + 6},${nor2MY} H ${qBarJX}`} val={qBar} col={qBarOutCol} rgb={qBarOutRgb} />

        {/* FEEDBACK Q → NOR2 bottom input (oranye) */}
        {/* Q junction → route right → down → left → into NOR2 bottom */}
        <W d={`M ${qJX},${nor1MY} H ${fbRouteX} V ${nor2BY} H ${nor2SX}`} val={q} col={qFbCol} rgb={qFbRgb} />
        <text x={fbRouteX + 8} y={(nor1MY + nor2BY) / 2 + 3} fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={q ? qFbCol : '#475569'} style={{ transition: 'fill 0.3s' }}>Q</text>

        {/* FEEDBACK Q' → NOR1 top input (ungu) */}
        <W d={`M ${qBarJX},${nor2MY} V ${nor2MY + 30} H ${fbRouteX - 40} V ${nor1TY - 10} H ${nor1SX}`} val={qBar} col={qBarFbCol} rgb={qBarFbRgb} />
        <text x={fbRouteX - 32} y={(nor2MY + 30 + nor1TY - 10) / 2 + 3} fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700"
            fill={qBar ? qBarFbCol : '#475569'} style={{ transition: 'fill 0.3s' }}>Q'</text>

        {/* Output Q node */}
        <W d={`M ${qJX},${nor1MY} H ${qOutX - outNodeR}`} val={q} col={qOutCol} rgb={qOutRgb} />
        <OutputNode ox={qOutX} oy={qOutY} val={q} label="Q" color={qOutCol} rgb={qOutRgb} />

        {/* Output Q' node */}
        <W d={`M ${qBarJX},${nor2MY} V ${qBarOutY} H ${qBarOutX - outNodeR}`} val={qBar} col={qBarOutCol} rgb={qBarOutRgb} />
        <OutputNode ox={qBarOutX} oy={qBarOutY} val={qBar} label="Q'" color={qBarOutCol} rgb={qBarOutRgb} />
    </svg>;
}
