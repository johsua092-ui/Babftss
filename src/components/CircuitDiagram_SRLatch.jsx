import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram_SRLatch({ s, r, q, qBar, mode, onToggleS, onToggleR }) {
    const sCol = '#4ade80', sRgb = hexToRgbStr(sCol);
    const rCol = '#22d3ee', rRgb = hexToRgbStr(rCol);
    const qFbCol = '#fb923c', qFbRgb = hexToRgbStr(qFbCol);
    const qBarFbCol = '#a78bfa', qBarFbRgb = hexToRgbStr(qBarFbCol);
    const qOutCol = '#4ade80', qOutRgb = hexToRgbStr(qOutCol);
    const qBarOutCol = '#f472b6', qBarOutRgb = hexToRgbStr(qBarOutCol);
    const norCol = '#f472b6', norRgb = hexToRgbStr(norCol);

    const wc = (val, col, rgb) => val ? col : 'rgba(' + rgb + ',0.25)';
    const mkGlow = (val, rgb) => val
        ? 'drop-shadow(0 0 4px rgba(' + rgb + ',0.9)) drop-shadow(0 0 10px rgba(' + rgb + ',0.5))' : 'none';
    const mkFill = (val, rgb) => val ? 'rgba(' + rgb + ',0.13)' : '#0f172a';
    const mkStroke = (val, col) => val ? col : '#475569';

    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
    const nodeR = 8, outNodeR = 15;

    const svgW = 500, svgH = 360;

    const sInX = 1, sInY = 270;
    const rInX = 1, rInY = 90;

    const norSX = 190;
    const nor1MY = 90, nor1TY = nor1MY - 18, nor1BY = nor1MY + 18, nor1EX = norSX + 55;
    const nor2MY = 270, nor2TY = nor2MY - 18, nor2BY = nor2MY + 18, nor2EX = norSX + 55;

    const inRouteX = 60;
    const qJX = nor1EX + 30;
    const qBarJX = nor2EX + 30;
    const fbLeftX = 105;
    const fbTopY = 42, fbBotY = 318;
    const fbRightQ = 385, fbRightQbar = 400;
    const qOutX = 450, qOutY = nor1MY;
    const qBarOutX = 450, qBarOutY = nor2MY;

    const nor1Glow = mkGlow(q, norRgb), nor1Fill = mkFill(q, norRgb), nor1Stroke = mkStroke(q, norCol);
    const nor2Glow = mkGlow(qBar, norRgb), nor2Fill = mkFill(qBar, norRgb), nor2Stroke = mkStroke(qBar, norCol);

    const NorGate = ({ sx, ty, by, my, ex, glow, fill, stroke }) => <Fragment>
        <path d={'M ' + sx + ',' + ty + ' C ' + (sx+14) + ',' + ty + ' ' + (ex-18) + ',' + (my-6) + ' ' + (ex-6) + ',' + my + ' C ' + (ex-18) + ',' + (my+6) + ' ' + (sx+14) + ',' + by + ' ' + sx + ',' + by + ' C ' + (sx+10) + ',' + (my+5) + ' ' + (sx+10) + ',' + (my-5) + ' ' + sx + ',' + ty + ' Z'}
            fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
        <circle cx={ex} cy={my} r="6" fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: 'all 0.3s' }} />
    </Fragment>;

    const InputNode = ({ ix, iy, val, label, onToggle, color, rgb }) => <g onClick={onToggle} style={{ cursor: 'pointer' }}>
        <rect x={ix} y={iy - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx}
            fill={val ? 'rgba(' + rgb + ',0.2)' : 'rgba(' + rgb + ',0.1)'}
            stroke={val ? color : 'rgba(' + rgb + ',0.3)'} strokeWidth="1.5" style={{ transition: 'all 0.25s' }} />
        <text x={ix + 24} y={iy - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">{label}</text>
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

    const modeColors = {
        SET: { bg: 'rgba(74,222,128,0.18)', border: 'rgba(74,222,128,0.5)', text: '#4ade80' },
        RESET: { bg: 'rgba(34,211,238,0.18)', border: 'rgba(34,211,238,0.5)', text: '#22d3ee' },
        HOLD: { bg: 'rgba(250,204,21,0.18)', border: 'rgba(250,204,21,0.5)', text: '#facc15' },
        INVALID: { bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.5)', text: '#ef4444' },
    };
    const mc = modeColors[mode] || modeColors.HOLD;

    // Wire paths
    const wireR = 'M ' + (rInX + inputNodeW) + ',' + rInY + ' H ' + inRouteX + ' V ' + nor1TY + ' H ' + norSX;
    const wireS = 'M ' + (sInX + inputNodeW) + ',' + sInY + ' H 75 V ' + nor2BY + ' H ' + norSX;
    const wireQout = 'M ' + (nor1EX + 6) + ',' + nor1MY + ' H ' + qJX;
    const wireQBarout = 'M ' + (nor2EX + 6) + ',' + nor2MY + ' H ' + qBarJX;
    const wireQfb = 'M ' + fbRightQ + ',' + nor1MY + ' V ' + fbBotY + ' H ' + fbLeftX + ' V ' + nor2TY + ' H ' + norSX;
    const wireQbarfb = 'M ' + fbRightQbar + ',' + nor2MY + ' V ' + fbTopY + ' H ' + fbLeftX + ' V ' + nor1BY + ' H ' + norSX;
    const wireQoutFinal = 'M ' + qJX + ',' + nor1MY + ' H ' + (qOutX - outNodeR);
    const wireQBaroutFinal = 'M ' + qBarJX + ',' + nor2MY + ' H ' + (qBarOutX - outNodeR);

    return <svg viewBox={'0 0 ' + svgW + ' ' + svgH} width="100%" style={{ overflow: 'visible', display: 'block' }}>
        <rect x={svgW / 2 - 55} y={4} width={110} height={22} rx={6} fill={mc.bg} stroke={mc.border} strokeWidth="1.5" />
        <text x={svgW / 2} y={19} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="700" fill={mc.text}>{'MODE: ' + mode}</text>

        <InputNode ix={sInX} iy={sInY} val={s} label="S (SET)" onToggle={onToggleS} color={sCol} rgb={sRgb} />
        <InputNode ix={rInX} iy={rInY} val={r} label="R (RESET)" onToggle={onToggleR} color={rCol} rgb={rRgb} />

        <W d={wireR} val={r} col={rCol} rgb={rRgb} />
        <W d={wireS} val={s} col={sCol} rgb={sRgb} />

        <NorGate sx={norSX} ty={nor1TY} by={nor1BY} my={nor1MY} ex={nor1EX} glow={nor1Glow} fill={nor1Fill} stroke={nor1Stroke} />
        <text x={norSX - 10} y={nor1MY + 3} textAnchor="end" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700" fill={q ? norCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NOR1</text>

        <NorGate sx={norSX} ty={nor2TY} by={nor2BY} my={nor2MY} ex={nor2EX} glow={nor2Glow} fill={nor2Fill} stroke={nor2Stroke} />
        <text x={norSX - 10} y={nor2MY + 3} textAnchor="end" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="700" fill={qBar ? norCol : '#475569'} style={{ transition: 'fill 0.3s' }}>NOR2</text>

        <W d={wireQout} val={q} col={qOutCol} rgb={qOutRgb} />
        <W d={wireQBarout} val={qBar} col={qBarOutCol} rgb={qBarOutRgb} />

        <circle cx={fbRightQ} cy={nor1MY} r={3.5} fill={wc(q, qFbCol, qFbRgb)} style={{ transition: 'fill 0.3s' }} />
        <W d={wireQfb} val={q} col={qFbCol} rgb={qFbRgb} />
        <text x={fbLeftX - 8} y={(nor2TY + fbBotY) / 2 + 3} textAnchor="end" fontFamily="Inter,sans-serif" fontSize="11" fontWeight="700" fill={q ? qFbCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>Q</text>

        <circle cx={fbRightQbar} cy={nor2MY} r={3.5} fill={wc(qBar, qBarFbCol, qBarFbRgb)} style={{ transition: 'fill 0.3s' }} />
        <W d={wireQbarfb} val={qBar} col={qBarFbCol} rgb={qBarFbRgb} />
        <text x={fbLeftX - 8} y={(fbTopY + nor1BY) / 2 + 3} textAnchor="end" fontFamily="Inter,sans-serif" fontSize="11" fontWeight="700" fill={qBar ? qBarFbCol : '#94a3b8'} style={{ transition: 'fill 0.3s' }}>Q</text>
        <line x1={fbLeftX - 18} y1={(fbTopY + nor1BY) / 2 - 9} x2={fbLeftX - 6} y2={(fbTopY + nor1BY) / 2 - 9} stroke={qBar ? qBarFbCol : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" style={{ transition: 'stroke 0.3s' }} />

        <W d={wireQoutFinal} val={q} col={qOutCol} rgb={qOutRgb} />
        <OutputNode ox={qOutX} oy={qOutY} val={q} label="Q" color={qOutCol} rgb={qOutRgb} />

        <W d={wireQBaroutFinal} val={qBar} col={qBarOutCol} rgb={qBarOutRgb} />
        <OutputNode ox={qBarOutX} oy={qBarOutY} val={qBar} label="Q" color={qBarOutCol} rgb={qBarOutRgb} overline />
    </svg>;
}
