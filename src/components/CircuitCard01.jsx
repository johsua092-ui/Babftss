import { useState } from 'react';
import CircuitDiagram01 from './CircuitDiagram01';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitCard01() {
    const [inputA, setInputA] = useState(false);
    const [inputB, setInputB] = useState(false);
    const bPrime = !inputB;
    const out = inputA && bPrime;
    const andColor = "#4ade80";
    const andRgb = hexToRgbStr(andColor);
    const truthTable = [[0,0,0],[0,1,0],[1,0,1],[1,1,0]];
    return <div style={{
        backgroundColor: "#0e1420",
        border: out ? `rgba(${andRgb},0.4)` : "#1e293b",
        borderRadius: 16, padding: "18px 14px",
        boxShadow: out ? `0 0 24px rgba(${andRgb},0.18)` : "none",
        transition: "all 0.4s ease"
    }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 11, fontWeight: 700, color: "#475569" }}>01</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: out ? andColor : "#334155", boxShadow: out ? `0 0 8px ${andColor}` : "none", transition: "all 0.3s" }} />
                <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, color: out ? andColor : "#e2e8f0" }}>NOT → AND Combo</span>
            </div>
            <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: "4px 10px", borderRadius: 6, backgroundColor: "rgba(100,116,139,0.15)", border: "1px solid rgba(100,116,139,0.3)", color: "#94a3b8" }}>MUDAH</span>
        </div>
        <CircuitDiagram01 a={inputA} b={inputB} bPrime={bPrime} out={out} onToggleA={() => setInputA(v => !v)} onToggleB={() => setInputB(v => !v)} />
        <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "10px 0 8px", fontFamily: "Orbitron,sans-serif", fontSize: 10, color: "#475569" }}>
            <span style={{ color: inputA ? andColor : "#475569" }}>A={inputA ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputB ? "#f87171" : "#475569" }}>B={inputB ? 1 : 0}</span>
            <span style={{ color: "#334155" }}>→</span>
            <span style={{ color: out ? andColor : "#334155", fontWeight: 700 }}>OUT={out ? 1 : 0}</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>Rangkaian ini menggabungkan gerbang NOT dan AND. Sinyal B dibalik terlebih dahulu oleh NOT Gate, lalu hasilnya digabungkan dengan A di AND Gate. Output hanya bernilai 1 ketika A=1 DAN B=0 — ini berguna untuk mendeteksi kondisi "A aktif, B tidak aktif" dalam rangkaian digital.</p>
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
                    return <tr key={ra+','+rb} style={{ background: isHl ? `rgba(${andRgb},0.18)` : "transparent", transition: "background 0.2s" }}>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? andColor : "#94a3b8", fontWeight: 600 }}>{ra}</td>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? andColor : "#94a3b8", fontWeight: 600 }}>{rb}</td>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? andColor : "#94a3b8", fontWeight: 800 }}>{ro}</td>
                    </tr>
                })}</tbody>
            </table>
        </div>
    </div>;
}
