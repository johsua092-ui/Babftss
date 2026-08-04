import { useState } from 'react';
import CircuitDiagram08 from './CircuitDiagram08';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitCard07() {
    const [inputA, setInputA] = useState(false);
    const [inputB, setInputB] = useState(false);

    // XOR = (A AND NOT B) OR (NOT A AND B)
    const notB = !inputB;
    const notA = !inputA;
    const and1Out = inputA && notB;   // A AND NOT B (top row)
    const and2Out = notA && inputB;   // NOT A AND B (bottom row)
    const out = and1Out || and2Out;   // OR of both rows

    const orColor = "#a78bfa";
    const orRgb = hexToRgbStr(orColor);
    const andColor = "#4ade80";
    const notColor = "#f87171";

    const truthTable = [[0,0,0],[0,1,1],[1,0,1],[1,1,0]];

    return <div style={{
        backgroundColor: "#0e1420",
        border: out ? `rgba(${orRgb},0.4)` : "#1e293b",
        borderRadius: 16, padding: "18px 14px",
        boxShadow: out ? `0 0 24px rgba(${orRgb},0.18)` : "none",
        transition: "all 0.4s ease"
    }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 14, fontWeight: 700, color: "#ffffff", textShadow: "0 0 4px rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.15)" }}>08</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: out ? orColor : "#334155", boxShadow: out ? `0 0 8px ${orColor}` : "none", transition: "all 0.3s" }} />
                <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, color: out ? orColor : "#e2e8f0" }}>Membangun XOR dari Gate Dasar</span>
            </div>
            <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: "4px 10px", borderRadius: 6, backgroundColor: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.35)", color: "#facc15" }}>NORMAL</span>
        </div>

        <CircuitDiagram08 a={inputA} b={inputB} notA={notA} notB={notB} and1Out={and1Out} and2Out={and2Out} out={out} onToggleA={() => setInputA(v => !v)} onToggleB={() => setInputB(v => !v)} />

        <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "10px 0 8px", fontFamily: "Orbitron,sans-serif", fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
            <span style={{ color: inputA ? andColor : "#475569" }}>A={inputA ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputB ? andColor : "#475569" }}>B={inputB ? 1 : 0}</span>
            <span style={{ color: "#334155" }}>→</span>
            <span style={{ color: and1Out ? andColor : "#334155" }}>A·¬B={and1Out ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: and2Out ? andColor : "#334155" }}>¬A·B={and2Out ? 1 : 0}</span>
            <span style={{ color: "#334155" }}>→</span>
            <span style={{ color: out ? orColor : "#334155", fontWeight: 700 }}>OUT={out ? 1 : 0}</span>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>XOR terlihat seperti gate dasar dengan simbol unik, tapi sebenarnya bisa dibangun penuh dari gate yang lebih primitif. Rangkaian ini memakai 5 gate: dua NOT untuk membalik masing-masing input, dua AND untuk menangkap kondisi "beda" (A AND NOT B di baris atas, NOT A AND B di baris bawah), lalu satu OR yang menggabungkan keduanya. Hasilnya identik dengan gate XOR asli: output 1 hanya kalau kedua input berbeda. Perhatikan bagaimana tiap kabel input bercabang — satu sinyal asli dipakai di dua tempat sekaligus, konsep penting yang akan muncul terus di rangkaian yang lebih kompleks.</p>

        <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
            <div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 6, letterSpacing: "0.5px" }}>TABEL KEBENARAN</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Orbitron,sans-serif" }}>
                <thead><tr style={{ borderBottom: "2px solid #1e293b" }}>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>A</th>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>B</th>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>OUT</th>
                </tr></thead>
                <tbody>{truthTable.map(function(row) {
                    var ra = row[0], rb = row[1], ro = row[2];
                    var isHl = (ra === (inputA ? 1 : 0)) && (rb === (inputB ? 1 : 0));
                    return <tr key={ra+','+rb} style={{ background: isHl ? `rgba(${orRgb},0.18)` : "transparent", transition: "background 0.2s" }}>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? andColor : "#94a3b8", fontWeight: 600 }}>{ra}</td>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? andColor : "#94a3b8", fontWeight: 600 }}>{rb}</td>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? orColor : "#94a3b8", fontWeight: 800 }}>{ro}</td>
                    </tr>
                })}</tbody>
            </table>
        </div>
    </div>;
}
