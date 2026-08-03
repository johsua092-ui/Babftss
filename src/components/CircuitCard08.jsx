import { useState } from 'react';
import CircuitDiagram08 from './CircuitDiagram08';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitCard08() {
    const [inputA, setInputA] = useState(false);
    const [inputB, setInputB] = useState(false);
    const [inputCin, setInputCin] = useState(false);

    // Full Adder: SUM = A XOR B XOR CIN, COUT = (A AND B) OR (CIN AND (A XOR B))
    const s1 = inputA ^ inputB;
    const c1 = inputA && inputB;
    const sum = s1 ^ inputCin;
    const c2 = s1 && inputCin;
    const cout = c1 || c2;

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
        padding: "6px 14px",
        borderRadius: 8,
        border: `1px solid ${active ? color : "#1e293b"}`,
        backgroundColor: active ? `rgba(${rgb},0.15)` : "#0a0f1a",
        color: active ? color : "#475569",
        fontFamily: "Orbitron,sans-serif",
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.2s",
        minWidth: 52
    });

    const truthRows = [
        [false, false, false],
        [false, false, true],
        [false, true, false],
        [false, true, true],
        [true, false, false],
        [true, false, true],
        [true, true, false],
        [true, true, true]
    ];

    return (
        <div style={cardStyle}>
            <div style={titleStyle}>CARD 08 — FULL ADDER</div>
            <div style={subtitleStyle}>
                Penjumlah biner 3 bit (A + B + C<sub>IN</sub>) menghasilkan SUM dan C<sub>OUT</sub>.<br />
                Rumus: SUM = A ⊕ B ⊕ C<sub>IN</sub> &nbsp;|&nbsp; C<sub>OUT</sub> = (A·B) + (C<sub>IN</sub>·(A⊕B))
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <button style={toggleBtn(inputA, xorColor, xorRgb)} onClick={() => setInputA(v => !v)}>A = {inputA ? "1" : "0"}</button>
                <button style={toggleBtn(inputB, xorColor, xorRgb)} onClick={() => setInputB(v => !v)}>B = {inputB ? "1" : "0"}</button>
                <button style={toggleBtn(inputCin, orColor, orRgb)} onClick={() => setInputCin(v => !v)}>C<sub>IN</sub> = {inputCin ? "1" : "0"}</button>
            </div>

            <CircuitDiagram08
                a={inputA} b={inputB} cin={inputCin}
                s1={s1} c1={c1} sum={sum} c2={c2} cout={cout}
                onToggleA={() => setInputA(v => !v)}
                onToggleB={() => setInputB(v => !v)}
                onToggleCin={() => setInputCin(v => !v)}
            />

            <div style={{ marginTop: 10, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Orbitron,sans-serif" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #1e293b" }}>
                            {["A", "B", "CIN", "SUM", "COUT"].map(h => (
                                <th key={h} style={{ padding: "4px 6px", color: "#475569", fontWeight: 600, fontSize: 9, letterSpacing: 1 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {truthRows.map(([ra, rb, rc], i) => {
                            const rs1 = ra ^ rb;
                            const rc1 = ra && rb;
                            const rsum = rs1 ^ rc;
                            const rc2 = rs1 && rc;
                            const rcout = rc1 || rc2;
                            const isHl = ra === inputA && rb === inputB && rc === inputCin;
                            return (
                                <tr key={i} style={{ borderBottom: "1px solid #0f172a", backgroundColor: isHl ? "rgba(250,204,21,0.06)" : "transparent" }}>
                                    <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? xorColor : "#94a3b8", fontWeight: 600 }}>{ra ? "1" : "0"}</td>
                                    <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? xorColor : "#94a3b8", fontWeight: 600 }}>{rb ? "1" : "0"}</td>
                                    <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? orColor : "#94a3b8", fontWeight: 600 }}>{rc ? "1" : "0"}</td>
                                    <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? "#facc15" : "#94a3b8", fontWeight: 800 }}>{rsum ? "1" : "0"}</td>
                                    <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? orColor : "#94a3b8", fontWeight: 800 }}>{rcout ? "1" : "0"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
