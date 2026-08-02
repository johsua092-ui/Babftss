

const gates = [
    { name: "NOT",  color: "#f87171" },
    { name: "AND",  color: "#4ade80" },
    { name: "NAND", color: "#fb923c" },
    { name: "OR",   color: "#a78bfa" },
    { name: "NOR",  color: "#f472b6" },
    { name: "XOR",  color: "#facc15" },
    { name: "XNOR", color: "#2dd4bf" },
];

function NotationSVG({ gate, color }) {
    const fontSize = 14;
    const font = "Orbitron,sans-serif";
    const textY = 14;
    const textAnchor = "middle";
    const svgH = 28;

    switch (gate) {
        case "NOT": {
            const cx = 20;
            return <svg viewBox={`0 0 40 ${svgH}`} width={40} height={svgH} style={{ display: "block", flexShrink: 0 }}>
                <text x={cx} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>A</text>
                <line x1={cx - 6} y1={2} x2={cx + 6} y2={2} stroke={color} strokeWidth="1.5" />
            </svg>;
        }
        case "AND": {
            return <svg viewBox={`0 0 60 ${svgH}`} width={60} height={svgH} style={{ display: "block", flexShrink: 0 }}>
                <text x={30} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>A · B</text>
            </svg>;
        }
        case "NAND": {
            const cx = 30;
            return <svg viewBox={`0 0 60 ${svgH}`} width={60} height={svgH} style={{ display: "block", flexShrink: 0 }}>
                <text x={cx} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>A·B</text>
                <line x1={cx - 16} y1={2} x2={cx + 16} y2={2} stroke={color} strokeWidth="1.5" />
            </svg>;
        }
        case "OR": {
            return <svg viewBox={`0 0 60 ${svgH}`} width={60} height={svgH} style={{ display: "block", flexShrink: 0 }}>
                <text x={30} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>A + B</text>
            </svg>;
        }
        case "NOR": {
            const cx = 30;
            return <svg viewBox={`0 0 60 ${svgH}`} width={60} height={svgH} style={{ display: "block", flexShrink: 0 }}>
                <text x={cx} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>A+B</text>
                <line x1={cx - 18} y1={2} x2={cx + 18} y2={2} stroke={color} strokeWidth="1.5" />
            </svg>;
        }
        case "XOR": {
            // Manual SVG XOR symbol: A [circle+cross] B
            const circR = 7, circCx = 30, circCy = 11;
            return <svg viewBox={`0 0 80 ${svgH}`} width={80} height={svgH} style={{ display: "block", flexShrink: 0 }}>
                <text x={16} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>A</text>
                <text x={64} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>B</text>
                <circle cx={circCx} cy={circCy} r={circR} fill="none" stroke={color} strokeWidth="1.5" />
                <line x1={circCx - 5} y1={circCy} x2={circCx + 5} y2={circCy} stroke={color} strokeWidth="1.5" />
                <line x1={circCx} y1={circCy - 5} x2={circCx} y2={circCy + 5} stroke={color} strokeWidth="1.5" />
            </svg>;
        }
        case "XNOR": {
            // Same as XOR + overline spanning entire notation
            const circR = 7, circCx = 40, circCy = 11;
            return <svg viewBox={`0 0 80 ${svgH}`} width={80} height={svgH} style={{ display: "block", flexShrink: 0 }}>
                <text x={16} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>A</text>
                <text x={64} y={textY} textAnchor={textAnchor} fontFamily={font} fontSize={fontSize} fontWeight="bold" fill={color}>B</text>
                <circle cx={circCx} cy={circCy} r={circR} fill="none" stroke={color} strokeWidth="1.5" />
                <line x1={circCx - 5} y1={circCy} x2={circCx + 5} y2={circCy} stroke={color} strokeWidth="1.5" />
                <line x1={circCx} y1={circCy - 5} x2={circCx} y2={circCy + 5} stroke={color} strokeWidth="1.5" />
                <line x1={10} y1={2} x2={70} y2={2} stroke={color} strokeWidth="1.5" />
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
                    <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 11, fontWeight: 700, color: "#475569" }}>0</span>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #94a3b8, #e2e8f0, #94a3b8)" }} />
                    <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, background: "linear-gradient(135deg, #94a3b8, #e2e8f0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Simbol Boolean</span>
                </div>
                <span className="badge-tutorial-shimmer" style={{ fontFamily: "Orbitron,sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: "4px 10px", borderRadius: 6, background: "linear-gradient(135deg, rgba(148,163,184,0.2), rgba(226,232,240,0.15))", border: "1px solid rgba(148,163,184,0.35)", color: "#cbd5e1", position: "relative", overflow: "hidden", display: "inline-block" }}>TUTORIAL</span>
                <style>{`
                    .badge-tutorial-shimmer::after {
                        content: "";
                        position: absolute;
                        top: 0; left: -100%; width: 60%; height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(226,232,240,0.25), transparent);
                        animation: badge-shimmer-sweep 3s ease-in-out infinite;
                    }
                    @keyframes badge-shimmer-sweep {
                        0% { left: -100%; }
                        50% { left: 150%; }
                        100% { left: 150%; }
                    }
                `}</style>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>Notasi aljabar Boolean standar internasional untuk 7 gerbang logika dasar. Garis di atas simbol menunjukkan operasi negasi (NOT).</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {gates.map(g => (
                    <div key={g.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 10px", borderRadius: 10, backgroundColor: "rgba(15,23,42,0.5)" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: g.color }} />
                        <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 11, fontWeight: 700, color: g.color, width: 44, flexShrink: 0, letterSpacing: "0.5px" }}>{g.name}</span>
                        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                            <NotationSVG gate={g.name} color={g.color} />
                        </div>
                    </div>
                ))}
            </div>
    </div>;
}
