import { useState } from 'react';
import CircuitDiagram07 from './CircuitDiagram07';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';

export default function CircuitCard06() {
    const [inputA, setInputA] = useState(false);
    const [inputB, setInputB] = useState(false);
    const sum = inputA !== inputB; // XOR
    const carry = inputA && inputB; // AND

    const xorColor = "#facc15";
    const xorRgb = hexToRgbStr(xorColor);
    const andColor = "#4ade80";

    const truthTable = [[0,0,0,0],[0,1,1,0],[1,0,1,0],[1,1,0,1]];

    return <div style={{
        backgroundColor: "#0e1420",
        border: (sum || carry) ? `rgba(${xorRgb},0.4)` : "#1e293b",
        borderRadius: 16, padding: "18px 14px",
        boxShadow: (sum || carry) ? `0 0 24px rgba(${xorRgb},0.18)` : "none",
        transition: "all 0.4s ease"
    }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 14, fontWeight: 700, color: "#ffffff", textShadow: "0 0 4px rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.15)" }}>07</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: (sum || carry) ? xorColor : "#334155", boxShadow: (sum || carry) ? `0 0 8px ${xorColor}` : "none", transition: "all 0.3s" }} />
                <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, color: (sum || carry) ? xorColor : "#e2e8f0" }}>Half Adder</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}><HeartButton /><span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "5px 12px", borderRadius: 6, backgroundColor: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.35)", color: "#facc15" }}>NORMAL</span></div>
        </div>

        <CircuitDiagram07 a={inputA} b={inputB} sum={sum} carry={carry} onToggleA={() => setInputA(v => !v)} onToggleB={() => setInputB(v => !v)} />

        <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "10px 0 8px", fontFamily: "Orbitron,sans-serif", fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
            <span style={{ color: inputA ? xorColor : "#475569" }}>A={inputA ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputB ? xorColor : "#475569" }}>B={inputB ? 1 : 0}</span>
            <span style={{ color: "#334155" }}>→</span>
            <span style={{ color: sum ? xorColor : "#334155", fontWeight: 700 }}>SUM={sum ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: carry ? andColor : "#334155", fontWeight: 700 }}>CARRY={carry ? 1 : 0}</span>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>Half Adder adalah rangkaian penjumlah biner paling dasar — menjumlahkan dua bit A dan B. Menghasilkan dua output sekaligus: SUM (hasil penjumlahan, dari XOR Gate) dan CARRY (sisa/bawaan, dari AND Gate). Ini pertama kalinya kamu melihat rangkaian dengan dua output paralel dari input yang sama — konsep fundamental untuk aritmetika digital. Contoh nyata: 1 + 1 = 10 biner (SUM=0, CARRY=1).</p>

        <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
            <div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 6, letterSpacing: "0.5px" }}>TABEL KEBENARAN</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Orbitron,sans-serif" }}>
                <thead><tr style={{ borderBottom: "2px solid #1e293b" }}>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>A</th>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>B</th>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>SUM</th>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>CARRY</th>
                </tr></thead>
                <tbody>{truthTable.map(function(row) {
                    var ra = row[0], rb = row[1], rs = row[2], rc = row[3];
                    var isHl = (ra === (inputA ? 1 : 0)) && (rb === (inputB ? 1 : 0));
                    return <tr key={ra+','+rb} style={{ background: isHl ? `rgba(${xorRgb},0.18)` : "transparent", transition: "background 0.2s" }}>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? xorColor : "#94a3b8", fontWeight: 600 }}>{ra}</td>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? xorColor : "#94a3b8", fontWeight: 600 }}>{rb}</td>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? xorColor : "#94a3b8", fontWeight: 800 }}>{rs}</td>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? andColor : "#94a3b8", fontWeight: 800 }}>{rc}</td>
                    </tr>
                })}</tbody>
            </table>
        </div>
    </div>;
}
