import { useState } from 'react';
import CircuitDiagram11 from './CircuitDiagram11';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';

export default function CircuitCard11() {
    const [inputS0, setInputS0] = useState(false);
    const [inputS1, setInputS1] = useState(false);
    const [inputD0, setInputD0] = useState(false);
    const [inputD1, setInputD1] = useState(false);
    const [inputD2, setInputD2] = useState(false);
    const [inputD3, setInputD3] = useState(false);

    const s0Not = !inputS0;
    const s1Not = !inputS1;

    // Enable signals (decoded select)
    const en00 = s0Not && s1Not;   // S1S0 = 00
    const en01 = inputS0 && s1Not;  // S1S0 = 01
    const en10 = s0Not && inputS1;  // S1S0 = 10
    const en11 = inputS0 && inputS1; // S1S0 = 11

    // AND outputs (enable AND data)
    const g0 = en00 && inputD0;
    const g1 = en01 && inputD1;
    const g2 = en10 && inputD2;
    const g3 = en11 && inputD3;

    // Final output (OR tree)
    const y = g0 || g1 || g2 || g3;

    const themeColor = "#facc15";
    const themeRgb = hexToRgbStr(themeColor);

    const isActive = y;

    // Condensed truth table (one row per select combination)
    const truthTable = [
        [0, 0, 'D0'],
        [0, 1, 'D1'],
        [1, 0, 'D2'],
        [1, 1, 'D3']
    ];
    const dMap = { D0: inputD0, D1: inputD1, D2: inputD2, D3: inputD3 };

    return <div style={{
        backgroundColor: "#0e1420",
        border: isActive ? `rgba(${themeRgb},0.4)` : "#1e293b",
        borderRadius: 16, padding: "18px 14px",
        boxShadow: isActive ? `0 0 24px rgba(${themeRgb},0.18)` : "none",
        transition: "all 0.4s ease"
    }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 14, fontWeight: 700, color: "#ffffff", textShadow: "0 0 4px rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.15)" }}>11</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: isActive ? themeColor : "#334155", boxShadow: isActive ? `0 0 8px ${themeColor}` : "none", transition: "all 0.3s" }} />
                <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, color: isActive ? themeColor : "#e2e8f0" }}>4:1 Multiplexer (Mux)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}><HeartButton /><span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "5px 12px", borderRadius: 6, backgroundColor: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.35)", color: "#facc15" }}>NORMAL</span></div>
        </div>

        <CircuitDiagram11
            s0={inputS0} s1={inputS1}
            d0={inputD0} d1={inputD1} d2={inputD2} d3={inputD3}
            s0Not={s0Not} s1Not={s1Not}
            g0={g0} g1={g1} g2={g2} g3={g3}
            y={y}
            onToggleS0={() => setInputS0(v => !v)}
            onToggleS1={() => setInputS1(v => !v)}
            onToggleD0={() => setInputD0(v => !v)}
            onToggleD1={() => setInputD1(v => !v)}
            onToggleD2={() => setInputD2(v => !v)}
            onToggleD3={() => setInputD3(v => !v)}
        />

        <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "10px 0 8px", fontFamily: "Orbitron,sans-serif", fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
            <span style={{ color: inputS1 ? themeColor : "#475569" }}>S1={inputS1 ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputS0 ? themeColor : "#475569" }}>S0={inputS0 ? 1 : 0}</span>
            <span style={{ color: "#334155" }}>|</span>
            <span style={{ color: inputD0 ? themeColor : "#475569" }}>D0={inputD0 ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputD1 ? themeColor : "#475569" }}>D1={inputD1 ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputD2 ? themeColor : "#475569" }}>D2={inputD2 ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputD3 ? themeColor : "#475569" }}>D3={inputD3 ? 1 : 0}</span>
            <span style={{ color: "#334155" }}>{"\u2192"}</span>
            <span style={{ color: y ? themeColor : "#334155", fontWeight: 700 }}>Y={y ? 1 : 0}</span>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>Multiplexer 4:1 adalah saklar digital yang memilih salah satu dari empat sinyal input data berdasarkan dua bit selektor (S1 dan S0). Ketika S1S0=00 output mengikuti D0, S1S0=01 mengikuti D1, S1S0=10 mengikuti D2, dan S1S0=11 mengikuti D3. Dibangun dari 2 NOT gate (membalik S0 dan S1), 4 AND gate tiga input (mengaktifkan jalur data yang terpilih), dan 3 OR gate (menggabungkan semua jalur menjadi satu output). Ini adalah komponen dasar data routing di prosesor — ALU menggunakan Mux untuk memilih operasi mana yang hasilnya diteruskan ke output, dan register file menggunakan Mux untuk memilih register mana yang dibaca.</p>

        <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
            <div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 6, letterSpacing: "0.5px" }}>TABEL KEBENARAN</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Orbitron,sans-serif" }}>
                <thead><tr style={{ borderBottom: "2px solid #1e293b" }}>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>S1</th>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>S0</th>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>Y</th>
                </tr></thead>
                <tbody>{truthTable.map(function(row) {
                    var rs1 = row[0], rs0 = row[1], dLabel = row[2];
                    var isHl = (rs1 === (inputS1 ? 1 : 0)) && (rs0 === (inputS0 ? 1 : 0));
                    var yVal = dMap[dLabel] ? 1 : 0;
                    var isGreenHl = yVal === 1;
                    var greenBg = isGreenHl ? "rgba(74,222,128,0.25)" : "transparent";
                    var greenCol = isGreenHl ? "#4ade80" : undefined;
                    return <tr key={rs1+','+rs0} style={{ background: isHl ? `rgba(${themeRgb},0.18)` : "transparent", transition: "background 0.2s" }}>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rs1}</td>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rs0}</td>
                        <td style={{ padding: "3px 8px", textAlign: "center", fontWeight: 800, transition: "all 0.2s", background: isHl && !isGreenHl ? `rgba(${themeRgb},0.18)` : "transparent" }}>
                            <span style={{
                                background: isGreenHl ? "rgba(74,222,128,0.25)" : (isHl ? `rgba(${themeRgb},0.18)` : "transparent"),
                                color: greenCol || (isHl ? themeColor : "#94a3b8"),
                                padding: isGreenHl ? "1px 6px" : "3px 0",
                                display: "block",
                                transition: "all 0.2s"
                            }}>{dLabel}={yVal}</span>
                        </td>
                    </tr>
                })}</tbody>
            </table>
        </div>
    </div>;
}
