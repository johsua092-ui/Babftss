

const gates = [
    { name: "NOT",  type: "not",  color: "#f87171" },
    { name: "AND",  type: "and",  color: "#4ade80" },
    { name: "NAND", type: "nand", color: "#fb923c" },
    { name: "OR",   type: "or",   color: "#a78bfa" },
    { name: "NOR",  type: "nor",  color: "#f472b6" },
    { name: "XOR",  type: "xor",  color: "#facc15" },
    { name: "XNOR", type: "xnor", color: "#2dd4bf" },
];

// MiniGateIcon — di-rewrite 100% match referensi neon tube (gambar terbaru).
// Key insights dari VLM analysis:
//   - NOT triangle TALLER than WIDE (sempit tinggi, bukan lebar pendek)
//   - AND/NAND: wires sedikit inset dari sudut (cy ± 9, sudut body di cy ± 11)
//   - OR/NOR/XOR/XNOR: wires di 25%/75% body height (cy ± sz/2)
//   - Semua body TALLER than WIDE (H/W > 1.1)
//   - Stroke 3px tebal, flat solid color (NO glow / NO drop-shadow)
function MiniGateIcon({ type, color }) {
    const s = color, sw = 3;
    const h = 36, cy = 18, sz = 13;          // body half-height = 13 → body 26 tall (taller)
    const triW = 14;                           // NOT triangle width (14W × 26H, H/W=1.85 — proper triangle proportions, was 5 too narrow)
    const bw = 5;                              // AND/NAND flat part width (narrow → taller proportion)
    const bubbleR = 3.5;                       // inversion bubble radius
    const bubbleGap = 3;                       // gap body→bubble center
    const wireLen = 10;                        // wire length each side (short stubs)
    const tipX = sz * 1.7;                     // OR/NOR/XOR/XNOR tip distance from cx
    const xorExtra = 6;                        // XOR/XNOR extra back curve offset
    const andWireOff = sz - 2;                 // AND/NAND wire offset (inset 2px dari corner)
    const orWireOff = sz / 2;                  // OR/NOR/XOR/XNOR wire offset (25%/75%)
    const svgStyle = { display: "block", flexShrink: 0 };

    switch (type) {
        case "not": {
            // NOT triangle: 14W × 26H (H/W=1.85) + bubble
            const cx = wireLen;
            const triTip = cx + triW;
            const bubbleCx = triTip + bubbleGap;
            const w = wireLen + triW + bubbleGap + bubbleR * 2 + wireLen;
            return <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={svgStyle}>
                <line x1={0} y1={cy} x2={cx} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
                <polygon points={`${cx},${cy - sz} ${cx},${cy + sz} ${triTip},${cy}`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
                <circle cx={bubbleCx} cy={cy} r={bubbleR} fill="none" stroke={s} strokeWidth={sw} />
                <line x1={bubbleCx + bubbleR} y1={cy} x2={w} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
            </svg>;
        }
        case "and": {
            // AND: D-shape (9+11=20W × 22H, H/W=1.1), wires inset 2px dari corner
            const cx = wireLen;
            const bodyRight = cx + bw + sz;
            const w = bodyRight + wireLen;
            return <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={svgStyle}>
                <line x1={0} y1={cy - andWireOff} x2={cx} y2={cy - andWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
                <line x1={0} y1={cy + andWireOff} x2={cx} y2={cy + andWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
                <path d={`M ${cx},${cy - sz} L ${cx + bw},${cy - sz} A ${sz},${sz} 0 0,1 ${cx + bw},${cy + sz} L ${cx},${cy + sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
                <line x1={bodyRight} y1={cy} x2={w} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
            </svg>;
        }
        case "nand": {
            // NAND: D-shape + bubble, wires inset 2px dari corner
            const cx = wireLen;
            const arcRight = cx + bw + sz;
            const bubbleCx = arcRight + bubbleGap;
            const w = bubbleCx + bubbleR + wireLen;
            return <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={svgStyle}>
                <line x1={0} y1={cy - andWireOff} x2={cx} y2={cy - andWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
                <line x1={0} y1={cy + andWireOff} x2={cx} y2={cy + andWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
                <path d={`M ${cx},${cy - sz} L ${cx + bw},${cy - sz} A ${sz},${sz} 0 0,1 ${cx + bw},${cy + sz} L ${cx},${cy + sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
                <circle cx={bubbleCx} cy={cy} r={bubbleR} fill="none" stroke={s} strokeWidth={sw} />
                <line x1={bubbleCx + bubbleR} y1={cy} x2={w} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
            </svg>;
        }
        case "or": {
            // OR: shield, wires di 25%/75% body height (cy ± sz/2)
            const cx = wireLen;
            const tip = cx + tipX;
            const w = tip + wireLen;
            return <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={svgStyle}>
                <line x1={0} y1={cy - orWireOff} x2={cx} y2={cy - orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
                <line x1={0} y1={cy + orWireOff} x2={cx} y2={cy + orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
                <path d={`M ${cx},${cy - sz} Q ${cx + sz * 1.2},${cy - sz} ${tip},${cy} Q ${cx + sz * 1.2},${cy + sz} ${cx},${cy + sz} Q ${cx + sz * 0.4},${cy} ${cx},${cy - sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
                <line x1={tip} y1={cy} x2={w} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
            </svg>;
        }
        case "nor": {
            // NOR: shield + bubble, wires di 25%/75%
            const cx = wireLen;
            const tip = cx + tipX;
            const bubbleCx = tip + bubbleGap;
            const w = bubbleCx + bubbleR + wireLen;
            return <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={svgStyle}>
                <line x1={0} y1={cy - orWireOff} x2={cx} y2={cy - orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
                <line x1={0} y1={cy + orWireOff} x2={cx} y2={cy + orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
                <path d={`M ${cx},${cy - sz} Q ${cx + sz * 1.2},${cy - sz} ${tip},${cy} Q ${cx + sz * 1.2},${cy + sz} ${cx},${cy + sz} Q ${cx + sz * 0.4},${cy} ${cx},${cy - sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
                <circle cx={bubbleCx} cy={cy} r={bubbleR} fill="none" stroke={s} strokeWidth={sw} />
                <line x1={bubbleCx + bubbleR} y1={cy} x2={w} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
            </svg>;
        }
        case "xor": {
            // XOR: shield + extra back curve, wires di 25%/75%
            const cx = wireLen + xorExtra;
            const tip = cx + tipX;
            const curveStart = cx - xorExtra;
            const w = tip + wireLen;
            return <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={svgStyle}>
                <line x1={0} y1={cy - orWireOff} x2={curveStart} y2={cy - orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
                <line x1={0} y1={cy + orWireOff} x2={curveStart} y2={cy + orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
                <path d={`M ${curveStart},${cy - sz - 1} Q ${cx + sz * 0.4},${cy} ${curveStart},${cy + sz + 1}`} fill="none" stroke={s} strokeWidth={sw} />
                <path d={`M ${cx},${cy - sz} Q ${cx + sz * 1.2},${cy - sz} ${tip},${cy} Q ${cx + sz * 1.2},${cy + sz} ${cx},${cy + sz} Q ${cx + sz * 0.4},${cy} ${cx},${cy - sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
                <line x1={tip} y1={cy} x2={w} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
            </svg>;
        }
        case "xnor": {
            // XNOR: shield + extra back curve + bubble, wires di 25%/75%
            const cx = wireLen + xorExtra;
            const tip = cx + tipX;
            const curveStart = cx - xorExtra;
            const bubbleCx = tip + bubbleGap;
            const w = bubbleCx + bubbleR + wireLen;
            return <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={svgStyle}>
                <line x1={0} y1={cy - orWireOff} x2={curveStart} y2={cy - orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
                <line x1={0} y1={cy + orWireOff} x2={curveStart} y2={cy + orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
                <path d={`M ${curveStart},${cy - sz - 1} Q ${cx + sz * 0.4},${cy} ${curveStart},${cy + sz + 1}`} fill="none" stroke={s} strokeWidth={sw} />
                <path d={`M ${cx},${cy - sz} Q ${cx + sz * 1.2},${cy - sz} ${tip},${cy} Q ${cx + sz * 1.2},${cy + sz} ${cx},${cy + sz} Q ${cx + sz * 0.4},${cy} ${cx},${cy - sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
                <circle cx={bubbleCx} cy={cy} r={bubbleR} fill="none" stroke={s} strokeWidth={sw} />
                <line x1={bubbleCx + bubbleR} y1={cy} x2={w} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
            </svg>;
        }
        default:
            return null;
    }
}

function NotationSVG({ gate, color }) {
    const fontSize = 14;
    const font = "Orbitron,sans-serif";
    const textY = 22;
    const overlineY = 8;
    const textAnchor = "middle";
    const svgH = 30;

    switch (gate) {
        case "NOT": {
            const cx = 22;
            return <svg viewBox={`0 0 44 ${svgH}`} width={44} height={svgH} style={{ display: "block", flexShrink: 0 }}>
                <text x={cx} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>A</text>
                <line x1={cx - 6} y1={overlineY} x2={cx + 6} y2={overlineY} stroke={color} strokeWidth="1.5" />
            </svg>;
        }
        case "AND": {
            const dotCx = 60, dotCy = 17;
            return <svg viewBox={`0 0 120 ${svgH}`} width={120} height={svgH} style={{ display: "block", flexShrink: 0 }}>
                <text x={42} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>A</text>
                <circle cx={dotCx} cy={dotCy} r={3} fill={color} />
                <text x={78} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>B</text>
            </svg>;
        }
        case "NAND": {
            const dotCx = 60, dotCy = 17;
            return <svg viewBox={`0 0 120 ${svgH}`} width={120} height={svgH} style={{ display: "block", flexShrink: 0 }}>
                <text x={42} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>A</text>
                <circle cx={dotCx} cy={dotCy} r={3} fill={color} />
                <text x={78} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>B</text>
                <line x1={32} y1={overlineY} x2={88} y2={overlineY} stroke={color} strokeWidth="1.5" />
            </svg>;
        }
        case "OR": {
            const plusCx = 60, plusCy = 17;
            return <svg viewBox={`0 0 120 ${svgH}`} width={120} height={svgH} style={{ display: "block", flexShrink: 0 }}>
                <text x={42} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>A</text>
                <line x1={plusCx - 5} y1={plusCy} x2={plusCx + 5} y2={plusCy} stroke={color} strokeWidth="1.6" />
                <line x1={plusCx} y1={plusCy - 5} x2={plusCx} y2={plusCy + 5} stroke={color} strokeWidth="1.6" />
                <text x={78} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>B</text>
            </svg>;
        }
        case "NOR": {
            const plusCx = 60, plusCy = 17;
            return <svg viewBox={`0 0 120 ${svgH}`} width={120} height={svgH} style={{ display: "block", flexShrink: 0 }}>
                <text x={42} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>A</text>
                <line x1={plusCx - 5} y1={plusCy} x2={plusCx + 5} y2={plusCy} stroke={color} strokeWidth="1.6" />
                <line x1={plusCx} y1={plusCy - 5} x2={plusCx} y2={plusCy + 5} stroke={color} strokeWidth="1.6" />
                <text x={78} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>B</text>
                <line x1={32} y1={overlineY} x2={88} y2={overlineY} stroke={color} strokeWidth="1.5" />
            </svg>;
        }
        case "XOR": {
            const circR = 8, circCx = 60, circCy = 17;
            return <svg viewBox={`0 0 120 ${svgH}`} width={120} height={svgH} style={{ display: "block", flexShrink: 0 }}>
                <text x={38} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>A</text>
                <text x={82} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>B</text>
                <circle cx={circCx} cy={circCy} r={circR} fill="none" stroke={color} strokeWidth="1.5" />
                <line x1={circCx - 6} y1={circCy} x2={circCx + 6} y2={circCy} stroke={color} strokeWidth="1.5" />
                <line x1={circCx} y1={circCy - 6} x2={circCx} y2={circCy + 6} stroke={color} strokeWidth="1.5" />
            </svg>;
        }
        case "XNOR": {
            const circR = 8, circCx = 60, circCy = 17;
            return <svg viewBox={`0 0 120 ${svgH}`} width={120} height={svgH} style={{ display: "block", flexShrink: 0 }}>
                <text x={38} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>A</text>
                <text x={82} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>B</text>
                <circle cx={circCx} cy={circCy} r={circR} fill="none" stroke={color} strokeWidth="1.5" />
                <line x1={circCx - 6} y1={circCy} x2={circCx + 6} y2={circCy} stroke={color} strokeWidth="1.5" />
                <line x1={circCx} y1={circCy - 6} x2={circCx} y2={circCy + 6} stroke={color} strokeWidth="1.5" />
                <line x1={28} y1={overlineY} x2={92} y2={overlineY} stroke={color} strokeWidth="1.5" />
            </svg>;
        }
        default:
            return null;
    }
}

export default function CircuitCard00() {
    return <div style={{
        backgroundColor: "#0e1420",
        borderRadius: 16, padding: "18px 14px",
        border: "1px solid rgba(148,163,184,0.25)",
    }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 14, fontWeight: 700, color: "#ffffff" }}>01</span>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #94a3b8, #e2e8f0, #94a3b8)" }} />
                    <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, background: "linear-gradient(135deg, #94a3b8, #e2e8f0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Simbol Boolean</span>
                </div>
                <span className="badge-tutorial-shimmer" style={{ fontFamily: "Orbitron,sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: "4px 10px", borderRadius: 6, background: "linear-gradient(135deg, rgba(148,163,184,0.2), rgba(226,232,240,0.15))", border: "1px solid rgba(148,163,184,0.35)", color: "#94a3b8", position: "relative", overflow: "hidden", display: "inline-block" }}>TUTORIAL</span>
                <style>{`
                    .badge-tutorial-shimmer::after {
                        content: "";
                        position: absolute;
                        top: 0; left: -60%; width: 60%; height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(226,232,240,0.25), transparent);
                        animation: badge-tutorial-shimmer-sweep 2.5s ease-in-out infinite;
                    }
                    @keyframes badge-tutorial-shimmer-sweep {
                        0% { left: -60%; }
                        52% { left: 100%; }
                        100% { left: 100%; }
                    }
                `}</style>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>Notasi aljabar Boolean standar internasional untuk 7 gerbang logika dasar. Garis di atas simbol menunjukkan operasi negasi (NOT).</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {gates.map(g => (
                    <div key={g.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 10px", borderRadius: 10, backgroundColor: "rgba(15,23,42,0.5)" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: g.color }} />
                        <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 11, fontWeight: 700, color: g.color, width: 44, flexShrink: 0, letterSpacing: "0.5px" }}>{g.name}</span>
                        <MiniGateIcon type={g.type} color={g.color} />
                        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                            <NotationSVG gate={g.name} color={g.color} />
                        </div>
                    </div>
                ))}
            </div>
    </div>;
}
