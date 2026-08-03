import { useState } from 'react';
import CircuitDiagram09 from './CircuitDiagram09';
import { hexToRgbStr } from '../utils/colorHelper';
export default function CircuitCard09() {
const [inputA, setInputA] = useState([false, false, false, false]);
const [inputB, setInputB] = useState([false, false, false, false]);
const [inputCin, setInputCin] = useState(false);
const toggleA = (i) => setInputA(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
const toggleB = (i) => setInputB(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
// 4-bit Ripple Carry Adder
const carries = [false, false, false, false];
const sums = [false, false, false, false];
const s0 = inputA[0] ^ inputB[0];
carries[0] = inputA[0] && inputB[0];
sums[0] = s0 ^ inputCin;
carries[0] = carries[0] || (s0 && inputCin);
const s1 = inputA[1] ^ inputB[1];
carries[1] = inputA[1] && inputB[1];
sums[1] = s1 ^ carries[0];
carries[1] = carries[1] || (s1 && carries[0]);
const s2 = inputA[2] ^ inputB[2];
carries[2] = inputA[2] && inputB[2];
sums[2] = s2 ^ carries[1];
carries[2] = carries[2] || (s2 && carries[1]);
const s3 = inputA[3] ^ inputB[3];
carries[3] = inputA[3] && inputB[3];
sums[3] = s3 ^ carries[2];
carries[3] = carries[3] || (s3 && carries[2]);
const xorColor = "#facc15";
const xorRgb = hexToRgbStr(xorColor);
const andColor = "#4ade80";
const andRgb = hexToRgbStr(andColor);
const orColor = "#a78bfa";
const orRgb = hexToRgbStr(orColor);
const cardStyle = {
backgroundColor: "#0e1420",
border: "1px solid #1e293b",
borderRadius: 14,
padding: "14px 16px",
fontFamily: "Inter,sans-serif"
};
const titleStyle = {
fontFamily: "Orbitron,sans-serif",
fontWeight: 800,
fontSize: "clamp(0.85rem,3.5vw,1.05rem)",
background: "linear-gradient(90deg,#facc15 0%,#4ade80 50%,#a78bfa 100%)",
WebkitBackgroundClip: "text",
WebkitTextFillColor: "transparent",
marginBottom: 4
};
const subtitleStyle = {
fontFamily: "Inter,sans-serif",
fontSize: 11,
color: "#64748b",
marginBottom: 10,
lineHeight: 1.5
};
const toggleBtn = (active, color, rgb) => ({
padding: "5px 10px",
borderRadius: 7,
border: `1px solid ${active ? color : "#1e293b"}`,
backgroundColor: active ? `rgba(${rgb},0.15)` : "#0a0f1a",
color: active ? color : "#475569",
fontFamily: "Orbitron,sans-serif",
fontSize: 10,
fontWeight: 700,
cursor: "pointer",
transition: "all 0.2s",
minWidth: 44
});
const binA = inputA.reduce((acc, v, i) => acc + (v ? 1 << i : 0), 0);
const binB = inputB.reduce((acc, v, i) => acc + (v ? 1 << i : 0), 0);
const result = binA + binB + (inputCin ? 1 : 0);
return (
<div style={cardStyle}>
<div style={titleStyle}>CARD 09 — 4-BIT RIPPLE CARRY ADDER</div>
<div style={subtitleStyle}>
Cascade 4 Full Adder untuk penjumlahan biner 4 bit (A + B + C<sub>IN</sub>).<br />
CARRY merambat dari FA0 → FA1 → FA2 → FA3 (ripple).
</div>
<div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap", alignItems: "center" }}>
<span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 9, color: xorColor, fontWeight: 700, marginRight: 2 }}>A:</span>
{[0, 1, 2, 3].map(i => (
<button key={`a${i}`} style={toggleBtn(inputA[i], xorColor, xorRgb)} onClick={() => toggleA(i)}>A[{i}]={inputA[i] ? "1" : "0"}</button>
))}
</div>
<div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap", alignItems: "center" }}>
<span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 9, color: andColor, fontWeight: 700, marginRight: 2 }}>B:</span>
{[0, 1, 2, 3].map(i => (
<button key={`b${i}`} style={toggleBtn(inputB[i], andColor, andRgb)} onClick={() => toggleB(i)}>B[{i}]={inputB[i] ? "1" : "0"}</button>
))}
</div>
<div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
<button style={toggleBtn(inputCin, orColor, orRgb)} onClick={() => setInputCin(v => !v)}>C<sub>IN</sub>={inputCin ? "1" : "0"}</button>
</div>
<CircuitDiagram09
a={inputA} b={inputB} cin={inputCin}
sums={sums} carries={carries}
onToggleA={toggleA} onToggleB={toggleB} onToggleCin={() => setInputCin(v => !v)}
/>
<div style={{ marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
<div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 11, color: "#94a3b8" }}>
<span style={{ color: xorColor }}>{binA}</span>
<span style={{ color: "#475569" }}> + </span>
<span style={{ color: andColor }}>{binB}</span>
<span style={{ color: "#475569" }}> + </span>
<span style={{ color: orColor }}>{inputCin ? 1 : 0}</span>
<span style={{ color: "#475569" }}> = </span>
<span style={{ color: "#e2e8f0", fontWeight: 800 }}>{result}</span>
</div>
<div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, color: "#475569" }}>
BIN: {sums[3] ? "1" : "0"}{sums[2] ? "1" : "0"}{sums[1] ? "1" : "0"}{sums[0] ? "1" : "0"} | COUT: {carries[3] ? "1" : "0"}
</div>
</div>
</div>
);
}