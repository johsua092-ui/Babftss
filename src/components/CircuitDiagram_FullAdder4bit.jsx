import ICBlockRef from './ICBlockRef';

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

    // Colors (per design.md 3.5: data path = green)
    const wireColor = '#4ade80';
    const dimColor = '#334155';
    const labelColor = '#94a3b8';

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

            {/* ── Global Cin → Block 0 Cin pin ── */}
            <g>
                <rect x={inputNodeX - inputBoxW / 2} y={cinNodeY - inputBoxH / 2}
                    width={inputBoxW} height={inputBoxH} rx={5}
                    fill={cin ? wireColor : '#0e1420'}
                    stroke={cin ? wireColor : dimColor} strokeWidth={1.5}
                    onClick={onToggleCin} style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                />
                <text x={inputNodeX} y={cinNodeY + 4} textAnchor="middle"
                    fontFamily="Orbitron,sans-serif" fontSize={9} fontWeight={700}
                    fill={cin ? '#0e1420' : labelColor}
                    onClick={onToggleCin} style={{ cursor: 'pointer' }}
                >Cin={cin ? 1 : 0}</text>
                {/* Cin wire: right from node, down to Cin pin Y, right to Cin pin */}
                <path d={"M " + (inputNodeX + inputBoxW / 2) + " " + cinNodeY +
                    " H " + (blockX - pinLen - 15) +
                    " V " + inPinY(blocks[0].y, 2) +
                    " H " + (blockX - pinLen)}
                    fill="none" stroke={cin ? wireColor : dimColor}
                    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: "stroke 0.3s" }}
                />
            </g>

            {/* ── A inputs → Block A pins (straight horizontal wire) ── */}
            {[[a0, 'A0', onToggleA0, 0], [a1, 'A1', onToggleA1, 1], [a2, 'A2', onToggleA2, 2], [a3, 'A3', onToggleA3, 3]].map(function(arr) {
                var val = arr[0], label = arr[1], toggle = arr[2], idx = arr[3];
                var blk = blocks[idx];
                var py = inPinY(blk.y, 0); // aligned to pin A
                return (
                    <g key={label}>
                        <rect x={inputNodeX - inputBoxW / 2} y={py - inputBoxH / 2}
                            width={inputBoxW} height={inputBoxH} rx={5}
                            fill={val ? wireColor : '#0e1420'}
                            stroke={val ? wireColor : dimColor} strokeWidth={1.5}
                            onClick={toggle} style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                        />
                        <text x={inputNodeX} y={py + 4} textAnchor="middle"
                            fontFamily="Orbitron,sans-serif" fontSize={9} fontWeight={700}
                            fill={val ? '#0e1420' : labelColor}
                            onClick={toggle} style={{ cursor: 'pointer' }}
                        >{label}={val ? 1 : 0}</text>
                        <line x1={inputNodeX + inputBoxW / 2} y1={py} x2={blockX - pinLen} y2={py}
                            stroke={val ? wireColor : dimColor} strokeWidth={2} strokeLinecap="round"
                            style={{ transition: "stroke 0.3s" }}
                        />
                    </g>
                );
            })}

            {/* ── B inputs → Block B pins (below A, wire jogs up to pin B) ── */}
            {[[b0, 'B0', onToggleB0, 0], [b1, 'B1', onToggleB1, 1], [b2, 'B2', onToggleB2, 2], [b3, 'B3', onToggleB3, 3]].map(function(arr) {
                var val = arr[0], label = arr[1], toggle = arr[2], idx = arr[3];
                var blk = blocks[idx];
                var aPinY = inPinY(blk.y, 0);
                var py = aPinY + inputBoxH + 5; // A bottom + 5px gap
                var bPinY = inPinY(blk.y, 1); // actual pin B on IC block
                var jogX = inputNodeX + inputBoxW / 2 + (blockX - pinLen - inputNodeX - inputBoxW / 2) * 0.4;
                return (
                    <g key={label}>
                        <rect x={inputNodeX - inputBoxW / 2} y={py - inputBoxH / 2}
                            width={inputBoxW} height={inputBoxH} rx={5}
                            fill={val ? wireColor : '#0e1420'}
                            stroke={val ? wireColor : dimColor} strokeWidth={1.5}
                            onClick={toggle} style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                        />
                        <text x={inputNodeX} y={py + 4} textAnchor="middle"
                            fontFamily="Orbitron,sans-serif" fontSize={9} fontWeight={700}
                            fill={val ? '#0e1420' : labelColor}
                            onClick={toggle} style={{ cursor: 'pointer' }}
                        >{label}={val ? 1 : 0}</text>
                        {/* Wire: right from button, jog up to pin B, right to IC block */}
                        <path d={"M " + (inputNodeX + inputBoxW / 2) + " " + py +
                            " H " + jogX + " V " + bPinY + " H " + (blockX - pinLen)}
                            fill="none" stroke={val ? wireColor : dimColor}
                            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                            style={{ transition: "stroke 0.3s" }}
                        />
                    </g>
                );
            })}

            {/* ── Carry chain wires (Cout block N → Cin block N+1) ── */}
            {[[c1, 0, 1], [c2, 1, 2], [c3, 2, 3]].map(function(arr) {
                var carryVal = arr[0], fromIdx = arr[1], toIdx = arr[2];
                var fromBlk = blocks[fromIdx];
                var toBlk = blocks[toIdx];
                var fromX = blockX + blockW + pinLen; // Cout pin end
                var fromPY = outPinY(fromBlk.y, 1); // Cout = output pin 1
                var toX = blockX - pinLen; // Cin pin start
                var toPY = inPinY(toBlk.y, 2); // Cin = input pin 2
                var laneX = carryLaneX[fromIdx];
                var belowBlockY = toBlk.y + blockH + 18; // route well below the target block

                return (
                    <path key={"carry-" + fromIdx}
                        d={"M " + fromX + " " + fromPY +
                           " H " + laneX +
                           " V " + belowBlockY +
                           " H " + toX +
                           " V " + toPY}
                        fill="none" stroke={carryVal ? wireColor : dimColor}
                        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                        style={{ transition: "stroke 0.3s" }}
                    />
                );
            })}

            {/* ── Sum outputs → output nodes ── */}
            {[[sum0, 'S0', 0], [sum1, 'S1', 1], [sum2, 'S2', 2], [sum3, 'S3', 3]].map(function(arr) {
                var val = arr[0], label = arr[1], idx = arr[2];
                var blk = blocks[idx];
                var pinX = blockX + blockW + pinLen;
                var pinY = outPinY(blk.y, 0); // Sum = output pin 0
                return (
                    <g key={label}>
                        <line x1={pinX} y1={pinY} x2={sumNodeX - nodeR} y2={pinY}
                            stroke={val ? wireColor : dimColor} strokeWidth={2} strokeLinecap="round"
                            style={{ transition: "stroke 0.3s" }}
                        />
                        <circle cx={sumNodeX} cy={pinY} r={nodeR}
                            fill={val ? wireColor : '#0e1420'}
                            stroke={wireColor} strokeWidth={1.5}
                            style={{ transition: 'all 0.3s' }}
                        />
                        <text x={sumNodeX} y={pinY + 3.5} textAnchor="middle"
                            fontFamily="Orbitron,sans-serif" fontSize={8} fontWeight={700}
                            fill={val ? '#0e1420' : labelColor}
                            style={{ pointerEvents: 'none' }}
                        >{label}</text>
                    </g>
                );
            })}

            {/* ── Final Cout output (below S3) ── */}
            {function() {
                var coutPinX = blockX + blockW + pinLen;
                var coutPinY = outPinY(blocks[3].y, 1);
                var s3CircleY = outPinY(blocks[3].y, 0);
                var coutCircleY = s3CircleY + nodeR + 10 + nodeR; // below S3 circle with gap
                var jogX = coutPinX + (coutNodeX - nodeR - coutPinX) * 0.45;
                return (
                    <g>
                        <path d={"M " + coutPinX + " " + coutPinY +
                            " H " + jogX + " V " + coutCircleY + " H " + (coutNodeX - nodeR)}
                            fill="none" stroke={cout ? wireColor : dimColor}
                            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                            style={{ transition: "stroke 0.3s" }}
                        />
                        <circle cx={coutNodeX} cy={coutCircleY} r={nodeR}
                            fill={cout ? wireColor : '#0e1420'}
                            stroke={wireColor} strokeWidth={1.5}
                            style={{ transition: 'all 0.3s' }}
                        />
                        <text x={coutNodeX} y={coutCircleY + 3.5} textAnchor="middle"
                            fontFamily="Orbitron,sans-serif" fontSize={8} fontWeight={700}
                            fill={cout ? '#0e1420' : labelColor}
                            style={{ pointerEvents: 'none' }}
                        >Cout</text>
                    </g>
                );
            }()}
        </svg>
    );
}
