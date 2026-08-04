import { useState } from 'react';
import CircuitDiagram08 from './CircuitDiagram08';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitCard08() {
    const [inputA, setInputA] = useState(false);
    const [inputB, setInputB] = useState(false);
    const [inputCin, setInputCin] = useState(false);

    const s1 = inputA !== inputB;       // A XOR B
    const c1 = inputA && inputB;         // A AND B
    const sum = s1 !== inputCin;         // s1 XOR Cin
    const c2 = s1 && inputCin;           // s1 AND Cin
    const cout = c1 || c2;              // c1 OR c2

    const themeColor = "#facc15";
    const themeRgb = hexToRgbStr(themeColor);
    const orColor = "#a78bfa";

    const truthTable = [
        [0,0,0,0,0],[0,0,1,1,0],[0,1,0,1,0],[0,1,1,0,1],
        [1,0,0,1,0],[1,0,1,0,1],[1,1,0,0,1],[1,1,1,1,1]
    ];

    const isActive = sum || cout;

    return <div style={{
        backgroundColor: "#0e1420",
        border: isActive ? `rgba(${themeRgb},0.4)` : "#1e293b",
        borderRadius: 16, padding: "18px 14px",
        boxShadow: isActive ? `0 0 24px rgba(${themeRgb},0.18)` : "none",
        transition: "all 0.4s ease"
    }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 14, fontWeight: 700, color: "#ffffff", textShadow: "0 0 6px rgba(255,255,255,0.7), 0 0 12px rgba(255,255,255,0.4)" }}>08</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: isActive ? themeColor : "#334155", boxShadow: isActive ? `0 0 8px ${themeColor}` : "none", transition: "all 0.3s" }} />
                <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, color: isActive ? themeColor : "#e2e8f0" }}>Full Adder</span>
            </div>
            <span className="badge-hard-shimmer" style={{ fontFamily: "Orbitron,sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: "4px 10px", borderRadius: 6, background: "rgba(227,11,93,0.18)", border: "1px solid rgba(227,11,93,0.4)", color: "#fda4af", position: "relative", overflow: "hidden", display: "inline-block" }}>HARD
                <style>{`
                    .badge-hard-shimmer::after {
                        content: "";
                        position: absolute;
                        width: 50%;
                        height: 300%;
                        background: linear-gradient(90deg, transparent, rgba(227,11,93,0.35), transparent);
                        animation: badge-hard-shimmer-sweep 3s ease-in-out infinite;
                    }
                    @keyframes badge-hard-shimmer-sweep {
                        0% { left: -50%; top: 0%; }
                        100% { left: 100%; top: 0%; }
                    }
                `}</style></span>
            </div>

        <CircuitDiagram08 a={inputA} b={inputB} cin={inputCin} s1={s1} c1={c1} sum={sum} c2={c2} cout={cout} onToggleA={() => setInputA(v => !v)} onToggleB={() => setInputB(v => !v)} onToggleCin={() => setInputCin(v => !v)} />

        <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "10px 0 8px", fontFamily: "Orbitron,sans-serif", fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
            <span style={{ color: inputA ? themeColor : "#475569" }}>A={inputA ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputB ? themeColor : "#475569" }}>B={inputB ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputCin ? orColor : "#475569" }}>Cin={inputCin ? 1 : 0}</span>
            <span style={{ color: "#334155" }}>{"\u2192"}</span>
            <span style={{ color: sum ? themeColor : "#334155", fontWeight: 700 }}>SUM={sum ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: cout ? orColor : "#334155", fontWeight: 700 }}>COUT={cout ? 1 : 0}</span>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>Full Adder adalah penjumlah biner lengkap yang bisa menangani carry masuk (Cin) selain dua bit utama A dan B. Dibangun dari dua Half Adder (seperti Card 06) yang digabung dengan satu OR gate: Half Adder pertama menghasilkan s1 dan c1 dari A dan B, lalu Half Adder kedua menjumlahkan s1 dengan Cin menghasilkan SUM dan c2, akhirnya c1 OR c2 menghasilkan COUT. Rangkaian ini adalah blok penyusun utama untuk penjumlahan multi-bit (ripple carry adder).</p>

        <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
            <div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 6, letterSpacing: "0.5px" }}>TABEL KEBENARAN</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Orbitron,sans-serif" }}>
                <thead><tr style={{ borderBottom: "2px solid #1e293b" }}>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>A</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>B</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>Cin</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>SUM</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>COUT</th>
                </tr></thead>
                <tbody>{truthTable.map(function(row) {
                    var ra = row[0], rb = row[1], rc = row[2], rs = row[3], rco = row[4];
                    var isHl = (ra === (inputA ? 1 : 0)) && (rb === (inputB ? 1 : 0)) && (rc === (inputCin ? 1 : 0));
                    return <tr key={ra+','+rb+','+rc} style={{ background: isHl ? `rgba(${themeRgb},0.18)` : "transparent", transition: "background 0.2s" }}>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{ra}</td>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rb}</td>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? orColor : "#94a3b8", fontWeight: 600 }}>{rc}</td>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 800 }}>{rs}</td>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? orColor : "#94a3b8", fontWeight: 800 }}>{rco}</td>
                    </tr>
                })}</tbody>
            </table>
        </div>
    </div>;
}


