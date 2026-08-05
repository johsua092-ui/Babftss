import { useState } from 'react';
import CircuitDiagram12 from './CircuitDiagram12';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';

export default function CircuitCard12() {
    const [inputS0, setInputS0] = useState(false);
    const [inputS1, setInputS1] = useState(false);
    const [inputS2, setInputS2] = useState(false);
    const [inputD0, setInputD0] = useState(false);
    const [inputD1, setInputD1] = useState(false);
    const [inputD2, setInputD2] = useState(false);
    const [inputD3, setInputD3] = useState(false);
    const [inputD4, setInputD4] = useState(false);
    const [inputD5, setInputD5] = useState(false);
    const [inputD6, setInputD6] = useState(false);
    const [inputD7, setInputD7] = useState(false);

    const s0Not = !inputS0;
    const s1Not = !inputS1;
    const s2Not = !inputS2;

    // Enable signals (decoded select — 8 combinations)
    const en0 = s2Not && s1Not && s0Not;      // S2S1S0 = 000
    const en1 = s2Not && s1Not && inputS0;     // S2S1S0 = 001
    const en2 = s2Not && inputS1 && s0Not;     // S2S1S0 = 010
    const en3 = s2Not && inputS1 && inputS0;   // S2S1S0 = 011
    const en4 = inputS2 && s1Not && s0Not;     // S2S1S0 = 100
    const en5 = inputS2 && s1Not && inputS0;   // S2S1S0 = 101
    const en6 = inputS2 && inputS1 && s0Not;   // S2S1S0 = 110
    const en7 = inputS2 && inputS1 && inputS0; // S2S1S0 = 111

    // AND outputs (enable AND data)
    const g0 = en0 && inputD0;
    const g1 = en1 && inputD1;
    const g2 = en2 && inputD2;
    const g3 = en3 && inputD3;
    const g4 = en4 && inputD4;
    const g5 = en5 && inputD5;
    const g6 = en6 && inputD6;
    const g7 = en7 && inputD7;

    // Final output (OR tree)
    const y = g0 || g1 || g2 || g3 || g4 || g5 || g6 || g7;

    const themeColor = "#facc15";
    const themeRgb = hexToRgbStr(themeColor);
    const isActive = y;

    // Condensed truth table (8 rows, one per S2S1S0 combination)
    const truthTable = [
        [0, 0, 0, 'D0'],
        [0, 0, 1, 'D1'],
        [0, 1, 0, 'D2'],
        [0, 1, 1, 'D3'],
        [1, 0, 0, 'D4'],
        [1, 0, 1, 'D5'],
        [1, 1, 0, 'D6'],
        [1, 1, 1, 'D7'],
    ];
    const dMap = { D0: inputD0, D1: inputD1, D2: inputD2, D3: inputD3, D4: inputD4, D5: inputD5, D6: inputD6, D7: inputD7 };

    return <div style={{
        backgroundColor: "#0e1420",
        border: isActive ? `rgba(${themeRgb},0.4)` : "#1e293b",
        borderRadius: 16, padding: "18px 14px",
        boxShadow: isActive ? `0 0 24px rgba(${themeRgb},0.18)` : "none",
        transition: "all 0.4s ease"
    }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 14, fontWeight: 700, color: "#ffffff", textShadow: "0 0 4px rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.15)" }}>12</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: isActive ? themeColor : "#334155", boxShadow: isActive ? `0 0 8px ${themeColor}` : "none", transition: "all 0.3s" }} />
                <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, color: isActive ? themeColor : "#e2e8f0" }}>8:1 Multiplexer (Mux)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}><HeartButton /><span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "5px 12px", borderRadius: 6, backgroundColor: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.35)", color: "#facc15" }}>NORMAL</span></div>
        </div>

        <CircuitDiagram12
            s0={inputS0} s1={inputS1} s2={inputS2}
            d0={inputD0} d1={inputD1} d2={inputD2} d3={inputD3}
            d4={inputD4} d5={inputD5} d6={inputD6} d7={inputD7}
            s0Not={s0Not} s1Not={s1Not} s2Not={s2Not}
            en0={en0} en1={en1} en2={en2} en3={en3}
            en4={en4} en5={en5} en6={en6} en7={en7}
            g0={g0} g1={g1} g2={g2} g3={g3}
            g4={g4} g5={g5} g6={g6} g7={g7}
            y={y}
            onToggleS0={() => setInputS0(v => !v)}
            onToggleS1={() => setInputS1(v => !v)}
            onToggleS2={() => setInputS2(v => !v)}
            onToggleD0={() => setInputD0(v => !v)}
            onToggleD1={() => setInputD1(v => !v)}
            onToggleD2={() => setInputD2(v => !v)}
            onToggleD3={() => setInputD3(v => !v)}
            onToggleD4={() => setInputD4(v => !v)}
            onToggleD5={() => setInputD5(v => !v)}
            onToggleD6={() => setInputD6(v => !v)}
            onToggleD7={() => setInputD7(v => !v)}
        />

        <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "10px 0 8px", fontFamily: "Orbitron,sans-serif", fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
            <span style={{ color: inputS2 ? themeColor : "#475569" }}>S2={inputS2 ? 1 : 0}</span>
            <span>·</span>
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
            <span>·</span>
            <span style={{ color: inputD4 ? themeColor : "#475569" }}>D4={inputD4 ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputD5 ? themeColor : "#475569" }}>D5={inputD5 ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputD6 ? themeColor : "#475569" }}>D6={inputD6 ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputD7 ? themeColor : "#475569" }}>D7={inputD7 ? 1 : 0}</span>
            <span style={{ color: "#334155" }}>{"\u2192"}</span>
            <span style={{ color: y ? themeColor : "#334155", fontWeight: 700 }}>Y={y ? 1 : 0}</span>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>Multiplexer 8:1 adalah saklar digital yang memilih salah satu dari delapan sinyal input data berdasarkan tiga bit selektor (S2, S1, dan S0). Ketika S2S1S0=000 output mengikuti D0, 001 mengikuti D1, dan seterusnya hingga 111 yang mengikuti D7. Dibangun dari 3 NOT gate (membalik S0, S1, S2), 8 AND gate tiga input (decoder yang mengaktifkan jalur terpilih), 8 AND gate dua input (menggabungkan sinyal enable dengan data), dan 7 OR gate (menggabungkan semua jalur menjadi satu output Y). Ini adalah perluasan langsung dari Mux 4:1 — prinsipnya identik, hanya jumlah jalur data dan bit selektor yang bertambah, menunjukkan bagaimana rangkaian digital diskalakan secara sistematis.</p>

        <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
            <div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 6, letterSpacing: "0.5px" }}>TABEL KEBENARAN</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Orbitron,sans-serif" }}>
                <thead><tr style={{ borderBottom: "2px solid #1e293b" }}>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>S2</th>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>S1</th>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>S0</th>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>Y</th>
                </tr></thead>
                <tbody>{truthTable.map(function(row) {
                    var rs2 = row[0], rs1 = row[1], rs0 = row[2], dLabel = row[3];
                    var isHl = (rs2 === (inputS2 ? 1 : 0)) && (rs1 === (inputS1 ? 1 : 0)) && (rs0 === (inputS0 ? 1 : 0));
                    var yVal = dMap[dLabel] ? 1 : 0;
                    var isGreenHl = yVal === 1;
                    var greenCol = isGreenHl ? "#4ade80" : undefined;
                    return <tr key={rs2+','+rs1+','+rs0} style={{ background: isHl ? `rgba(${themeRgb},0.18)` : "transparent", transition: "background 0.2s" }}>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rs2}</td>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rs1}</td>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rs0}</td>
                        <td style={{ padding: "3px 8px", textAlign: "center", fontWeight: 800, transition: "all 0.2s" }}>
                            <span style={{
                                background: isGreenHl ? "rgba(74,222,128,0.25)" : "transparent",
                                color: greenCol || (isHl ? themeColor : "#94a3b8"),
                                padding: isGreenHl ? "1px 6px" : "0",
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
