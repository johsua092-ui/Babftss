import ICBlockRef from './ICBlockRef';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram_FullAdder4bit({
    a0, a1, a2, a3, b0, b1, b2, b3, cin,
    sum0, sum1, sum2, sum3, cout, c1, c2, c3,
    onToggleA0, onToggleA1, onToggleA2, onToggleA3,
    onToggleB0, onToggleB1, onToggleB2, onToggleB3,
    onToggleCin,
}) {
    // ── Layout: vertical stack of 4 IC Blocks ──
    const blockW = 140, blockH = 60, pinLen = 12;
    const blockX = 130;
    const blockStartY = 45;
    const blockVGap = 42;
    const nodeR = 12;
    const inputBoxW = 38, inputBoxH = 22;

    // ── Color palette ──
    // Cin, Carry chain, Cout = ungu #a78bfa (jalur OR / carry path)
    const carryPathColor = '#a78bfa', carryPathRgb = hexToRgbStr(carryPathColor);
    // Sum outputs = kuning #facc15 (jalur XOR / sum path)
    const sumPathColor = '#facc15', sumPathRgb = hexToRgbStr(sumPathColor);
    // 8 unique input colors (A0 B0 A1 B1 A2 B2 A3 B3)
    const inputColors = [
        { hex: '#facc15', rgb: hexToRgbStr('#facc15') }, // A0 - kuning
        { hex: '#4ade80', rgb: hexToRgbStr('#4ade80') }, // B0 - hijau
        { hex: '#38bdf8', rgb: hexToRgbStr('#38bdf8') }, // A1 - biru langit
        { hex: '#f472b6', rgb: hexToRgbStr('#f472b6') }, // B1 - pink
        { hex: '#fb923c', rgb: hexToRgbStr('#fb923c') }, // A2 - oranye
        { hex: '#2dd4bf', rgb: hexToRgbStr('#2dd4bf') }, // B2 - teal
        { hex: '#22d3ee', rgb: hexToRgbStr('#22d3ee') }, // A3 - cyan
        { hex: '#f87171', rgb: hexToRgbStr('#f87171') }, // B3 - merah
    ];

    // Color helpers (per design.md regulation)
    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;
    const mkGlow = (val, rgb) => val
        ? `drop-shadow(0 0 4px rgba(${rgb},0.9)) drop-shadow(0 0 10px rgba(${rgb},0.5))`
        : "none";

    // Pin spacing must match ICBlockRef internal calculation
    const pinSpacing = Math.min(18, (blockH - 20) / Math.max(3, 2, 1));
    const inPinY = (blockY, i) => blockY + (blockH - 3 * pinSpacing) / 2 + pinSpacing / 2 + i * pinSpacing;
    const outPinY = (blockY, i) => blockY + (blockH - 2 * pinSpacing) / 2 + pinSpacing / 2 + i * pinSpacing;

    // Block definitions
    const blocks = [
        { y: blockStartY, a: a0, b: b0, cin, sum: sum0, carry: c1 },
        { y: blockStartY + blockH + blockVGap, a: a1, b: b1, cin: c1, sum: sum1, carry: c2 },
        { y: blockStartY + 2 * (blockH + blockVGap), a: a2, b: b2, cin: c2, sum: sum2, carry: c3 },
        { y: blockStartY + 3 * (blockH + blockVGap), a: a3, b: b3, cin: c3, sum: sum3, carry: cout },
    ];

    // Carry lane X (right side, unique per wire to avoid overlap)
    const carryLaneX = [blockX + blockW + pinLen + 10, blockX + blockW + pinLen + 20, blockX + blockW + pinLen + 30];

    // Input node positions (single column: A above, B below)
    const inputNodeX = 28;
    const sumNodeX = blockX + blockW + pinLen + 80;
    const coutNodeX = blockX + blockW + pinLen + 80;

    // SVG dimensions
    const svgW = coutNodeX + nodeR + 20;
    const lastBlock = blocks[3];
    const svgH = lastBlock.y + blockH + 40;

    // Cin input node Y (above block 0)
    const cinNodeY = blockStartY - 28;

    return (
        <svg viewBox={"0 0 " + svgW + " " + svgH} width="100%" style={{ display: 'block' }}>
            {/* ── IC Blocks ── */}
            {blocks.map(function(blk, i) {
                return (
                    <ICBlockRef
                        key={i}
                        targetNum="09"
                        label="Full Adder 1 Bit"
                        inputs={["A", "B", "Cin"]}
                        outputs={["Sum", "Cout"]}
                        x={blockX} y={blk.y} width={blockW} height={blockH}
                    />
                );
            })}

            {/* ── Global Cin → Block 0 Cin pin (ungu / carry path) ── */}
            <g>
                <rect x={inputNodeX - inputBoxW / 2} y={cinNodeY - inputBoxH / 2}
                    width={inputBoxW} height={inputBoxH} rx={5}
                    fill={cin ? `rgba(${carryPathRgb},0.2)` : `rgba(${carryPathRgb},0.1)`}
                    stroke={cin ? carryPathColor : `rgba(${carryPathRgb},0.3)`} strokeWidth={1.5}
                    onClick={onToggleCin} style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                />
                <text x={inputNodeX} y={cinNodeY + 4} textAnchor="middle"
                    fontFamily="Orbitron,sans-serif" fontSize={9} fontWeight={700}
                    fill={cin ? carryPathColor : `rgba(${carryPathRgb},0.5)`}
                    onClick={onToggleCin} style={{ cursor: 'pointer' }}
                >Cin={cin ? 1 : 0}</text>
                <path d={"M " + (inputNodeX + inputBoxW / 2) + " " + cinNodeY +
                    " H " + (blockX - pinLen - 15) +
                    " V " + inPinY(blocks[0].y, 2) +
                    " H " + (blockX - pinLen)}
                    fill="none" stroke={wc(cin, carryPathColor, carryPathRgb)}
                    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: "stroke 0.3s" }}
                />
            </g>

            {/* ── A inputs → Block A pins (warna unik tiap input) ── */}
            {[[a0, 'A0', onToggleA0, 0], [a1, 'A1', onToggleA1, 1], [a2, 'A2', onToggleA2, 2], [a3, 'A3', onToggleA3, 3]].map(function(arr) {
                var val = arr[0], label = arr[1], toggle = arr[2], idx = arr[3];
                var blk = blocks[idx];
                var py = inPinY(blk.y, 0);
                var ic = inputColors[idx * 2]; // A0=0, A1=2, A2=4, A3=6
                return (
                    <g key={label}>
                        <rect x={inputNodeX - inputBoxW / 2} y={py - inputBoxH / 2}
                            width={inputBoxW} height={inputBoxH} rx={5}
                            fill={val ? `rgba(${ic.rgb},0.2)` : `rgba(${ic.rgb},0.1)`}
                            stroke={val ? ic.hex : `rgba(${ic.rgb},0.3)`} strokeWidth={1.5}
                            onClick={toggle} style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                        />
                        <text x={inputNodeX} y={py + 4} textAnchor="middle"
                            fontFamily="Orbitron,sans-serif" fontSize={9} fontWeight={700}
                            fill={val ? ic.hex : `rgba(${ic.rgb},0.5)`}
                            onClick={toggle} style={{ cursor: 'pointer' }}
                        >{label}={val ? 1 : 0}</text>
                        <line x1={inputNodeX + inputBoxW / 2} y1={py} x2={blockX - pinLen} y2={py}
                            stroke={wc(val, ic.hex, ic.rgb)} strokeWidth={2} strokeLinecap="round"
                            style={{ transition: "stroke 0.3s" }}
                        />
                    </g>
                );
            })}

            {/* ── B inputs → Block B pins (warna unik tiap input, wire jogs to pin B) ── */}
            {[[b0, 'B0', onToggleB0, 0], [b1, 'B1', onToggleB1, 1], [b2, 'B2', onToggleB2, 2], [b3, 'B3', onToggleB3, 3]].map(function(arr) {
                var val = arr[0], label = arr[1], toggle = arr[2], idx = arr[3];
                var blk = blocks[idx];
                var aPinY = inPinY(blk.y, 0);
                var py = aPinY + inputBoxH + 5;
                var bPinY = inPinY(blk.y, 1);
                var jogX = inputNodeX + inputBoxW / 2 + (blockX - pinLen - inputNodeX - inputBoxW / 2) * 0.4;
                var ic = inputColors[idx * 2 + 1]; // B0=1, B1=3, B2=5, B3=7
                return (
                    <g key={label}>
                        <rect x={inputNodeX - inputBoxW / 2} y={py - inputBoxH / 2}
                            width={inputBoxW} height={inputBoxH} rx={5}
                            fill={val ? `rgba(${ic.rgb},0.2)` : `rgba(${ic.rgb},0.1)`}
                            stroke={val ? ic.hex : `rgba(${ic.rgb},0.3)`} strokeWidth={1.5}
                            onClick={toggle} style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                        />
                        <text x={inputNodeX} y={py + 4} textAnchor="middle"
                            fontFamily="Orbitron,sans-serif" fontSize={9} fontWeight={700}
                            fill={val ? ic.hex : `rgba(${ic.rgb},0.5)`}
                            onClick={toggle} style={{ cursor: 'pointer' }}
                        >{label}={val ? 1 : 0}</text>
                        <path d={"M " + (inputNodeX + inputBoxW / 2) + " " + py +
                            " H " + jogX + " V " + bPinY + " H " + (blockX - pinLen)}
                            fill="none" stroke={wc(val, ic.hex, ic.rgb)}
                            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                            style={{ transition: "stroke 0.3s" }}
                        />
                    </g>
                );
            })}

            {/* ── Carry chain wires (ungu / carry path) ── */}
            {[[c1, 0, 1], [c2, 1, 2], [c3, 2, 3]].map(function(arr) {
                var carryVal = arr[0], fromIdx = arr[1], toIdx = arr[2];
                var fromBlk = blocks[fromIdx];
                var toBlk = blocks[toIdx];
                var fromX = blockX + blockW + pinLen;
                var fromPY = outPinY(fromBlk.y, 1);
                var toX = blockX - pinLen;
                var toPY = inPinY(toBlk.y, 2);
                var laneX = carryLaneX[fromIdx];
                var belowBlockY = toBlk.y + blockH + 18;

                return (
                    <path key={"carry-" + fromIdx}
                        d={"M " + fromX + " " + fromPY +
                           " H " + laneX +
                           " V " + belowBlockY +
                           " H " + toX +
                           " V " + toPY}
                        fill="none" stroke={wc(carryVal, carryPathColor, carryPathRgb)}
                        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                        style={{ transition: "stroke 0.3s" }}
                    />
                );
            })}

            {/* ── Sum outputs (kuning / sum path) ── */}
            {[[sum0, 'S0', 0], [sum1, 'S1', 1], [sum2, 'S2', 2], [sum3, 'S3', 3]].map(function(arr) {
                var val = arr[0], label = arr[1], idx = arr[2];
                var blk = blocks[idx];
                var pinX = blockX + blockW + pinLen;
                var pinY = outPinY(blk.y, 0);
                return (
                    <g key={label}>
                        <line x1={pinX} y1={pinY} x2={sumNodeX - nodeR} y2={pinY}
                            stroke={wc(val, sumPathColor, sumPathRgb)} strokeWidth={2} strokeLinecap="round"
                            style={{ transition: "stroke 0.3s" }}
                        />
                        <circle cx={sumNodeX} cy={pinY} r={nodeR}
                            fill={val ? sumPathColor : '#1e293b'}
                            stroke={val ? sumPathColor : '#334155'} strokeWidth={1.5}
                            filter={mkGlow(val, sumPathRgb)}
                            style={{ transition: 'all 0.3s' }}
                        />
                        <text x={sumNodeX} y={pinY + 3.5} textAnchor="middle"
                            fontFamily="Orbitron,sans-serif" fontSize={8} fontWeight={700}
                            fill={val ? '#000' : '#475569'}
                            style={{ pointerEvents: 'none' }}
                        >{label}</text>
                    </g>
                );
            })}

            {/* ── Final Cout output (fuchsia, warna unik) ── */}
            {function() {
                var coutPinX = blockX + blockW + pinLen;
                var coutPinY = outPinY(blocks[3].y, 1);
                var s3CircleY = outPinY(blocks[3].y, 0);
                var coutCircleY = s3CircleY + nodeR + 10 + nodeR;
                var jogX = coutPinX + (coutNodeX - nodeR - coutPinX) * 0.65;
                var coutColor = '#e879f9', coutRgb = hexToRgbStr(coutColor);
                return (
                    <g>
                        <path d={"M " + coutPinX + " " + coutPinY +
                            " H " + jogX + " V " + coutCircleY + " H " + (coutNodeX - nodeR)}
                            fill="none" stroke={wc(cout, coutColor, coutRgb)}
                            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                            style={{ transition: "stroke 0.3s" }}
                        />
                        <circle cx={coutNodeX} cy={coutCircleY} r={nodeR}
                            fill={cout ? coutColor : '#1e293b'}
                            stroke={cout ? coutColor : '#334155'} strokeWidth={1.5}
                            filter={mkGlow(cout, coutRgb)}
                            style={{ transition: 'all 0.3s' }}
                        />
                        <text x={coutNodeX} y={coutCircleY + 3.5} textAnchor="middle"
                            fontFamily="Orbitron,sans-serif" fontSize={8} fontWeight={700}
                            fill={cout ? '#000' : '#475569'}
                            style={{ pointerEvents: 'none' }}
                        >Cout</text>
                    </g>
                );
            }()}
        </svg>
    );
}
