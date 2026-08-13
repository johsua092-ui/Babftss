

// Card 00 — Simbol Boolean. 100% match referensi neon tube:
// HANYA 7 logo gerbang vertikal di dark navy bg, strong neon glow, tanpa
// header/deskripsi/dot/nama/notasi.
const gates = [
    { name: "NOT",  type: "not",  color: "#ff0055" },  // hot pink-red
    { name: "AND",  type: "and",  color: "#00ff88" },  // mint green
    { name: "NAND", type: "nand", color: "#ff8c00" },  // orange
    { name: "OR",   type: "or",   color: "#bf00ff" },  // electric purple
    { name: "NOR",  type: "nor",  color: "#ff1493" },  // magenta
    { name: "XOR",  type: "xor",  color: "#ffd700" },  // golden yellow
    { name: "XNOR", type: "xnor", color: "#00e5ff" },  // cyan
];

// MiniGateIcon — match referensi neon tube:
//   - body TALLER than WIDE (sz=13, bw=5, H/W=2.6+)
//   - NOT triangle TALL THIN (triW=5, H/W=5.2)
//   - stroke 3px tebal
//   - triple glow (3+7+13px) strong bloom neon
//   - input wires: AND/NAND di corner-inset (cy ± sz-2), OR family di 25%/75% (cy ± sz/2)
//   - wire pendek (10px stubs)
function MiniGateIcon({ type, color }) {
    const s = color, sw = 3;
    const h = 36, cy = 18, sz = 13;
    const triW = 5;
    const bw = 5;
    const bubbleR = 3.5;
    const bubbleGap = 3;
    const wireLen = 10;
    const tipX = sz * 1.7;
    const xorExtra = 6;
    const andWireOff = sz - 2;     // 11 (inset 2px dari corner)
    const orWireOff = sz / 2;      // 6.5 (25%/75%)
    const glow = `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 7px ${color}) drop-shadow(0 0 13px ${color})`;
    const svgStyle = { display: "block", flexShrink: 0, filter: glow };

    switch (type) {
        case "not": {
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

export default function CircuitCard00() {
    // 100% match referensi: dark navy bg, hanya 7 logo gerbang vertikal dengan
    // padding antar logo. Tidak ada header/deskripsi/dot/nama/notasi.
    return <div style={{
        backgroundColor: "#0a0e17",
        borderRadius: 16,
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
    }}>
        {gates.map(g => (
            <MiniGateIcon key={g.name} type={g.type} color={g.color} />
        ))}
    </div>;
}
