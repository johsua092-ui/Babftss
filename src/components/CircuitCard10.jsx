import { useState } from 'react';
import CircuitDiagram10 from './CircuitDiagram10';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';

export default function CircuitCard09() {
    const [inputS, setInputS] = useState(false);
    const [inputD0, setInputD0] = useState(false);
    const [inputD1, setInputD1] = useState(false);

    const sNot = !inputS;
    const g1 = sNot && inputD0;
    const g2 = inputS && inputD1;
    const y = g1 || g2;

    const themeColor = "#facc15";
    const themeRgb = hexToRgbStr(themeColor);
    const orColor = "#a78bfa";

    const truthTable = [
        [0,0,0,0],[0,0,1,0],[0,1,0,1],[0,1,1,1],
        [1,0,0,0],[1,0,1,1],[1,1,0,0],[1,1,1,1]
    ];

    const isActive = y;

    return <div style={{
        backgroundColor: "#0e1420",
        border: isActive ? `rgba(${themeRgb},0.4)` : "#1e293b",
        borderRadius: 16, padding: "18px 14px",
        boxShadow: isActive ? `0 0 24px rgba(${themeRgb},0.18)` : "none",
        transition: "all 0.4s ease"
    }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 14, fontWeight: 700, color: "#ffffff", textShadow: "0 0 4px rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.15)" }}>10</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: isActive ? themeColor : "#334155", boxShadow: isActive ? `0 0 8px ${themeColor}` : "none", transition: "all 0.3s" }} />
                <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, color: isActive ? themeColor : "#e2e8f0" }}>2:1 Multiplexer (Mux)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}><HeartButton itemId="circuit-10" itemType="circuit" /><span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "5px 12px", borderRadius: 6, backgroundColor: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.35)", color: "#facc15" }}>NORMAL</span></div>
        </div>

        <CircuitDiagram10 s={inputS} d0={inputD0} d1={inputD1} sNot={sNot} g1={g1} g2={g2} y={y} onToggleS={() => setInputS(v => !v)} onToggleD0={() => setInputD0(v => !v)} onToggleD1={() => setInputD1(v => !v)} />

        <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "10px 0 8px", fontFamily: "Orbitron,sans-serif", fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
            <span style={{ color: inputS ? themeColor : "#475569" }}>S={inputS ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputD0 ? themeColor : "#475569" }}>D0={inputD0 ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputD1 ? themeColor : "#475569" }}>D1={inputD1 ? 1 : 0}</span>
            <span style={{ color: "#334155" }}>{"\u2192"}</span>
            <span style={{ color: y ? themeColor : "#334155", fontWeight: 700 }}>Y={y ? 1 : 0}</span>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>Multiplexer (Mux) adalah saklar digital yang memilih salah satu dari beberapa sinyal data berdasarkan sinyal kontrol. Dalam rangkaian 2:1 ini, sinyal SELECT (S) menentukan sinyal mana yang diteruskan ke output Y: jika S=0, output mengikuti D0; jika S=1, output mengikuti D1. Konsep ini seperti tombol pada remote TV yang memilih channel atau input mana yang aktif — dasar cara komputer memilih data dari berbagai sumber.</p>

        <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
            <div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 6, letterSpacing: "0.5px" }}>TABEL KEBENARAN</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Orbitron,sans-serif" }}>
                <thead><tr style={{ borderBottom: "2px solid #1e293b" }}>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>S</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>D0</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>D1</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>Y</th>
                </tr></thead>
                <tbody>{truthTable.map(function(row) {
                    var rs = row[0], rd0 = row[1], rd1 = row[2], ry = row[3];
                    var isHl = (rs === (inputS ? 1 : 0)) && (rd0 === (inputD0 ? 1 : 0)) && (rd1 === (inputD1 ? 1 : 0));
                    return <tr key={rs+','+rd0+','+rd1} style={{ background: isHl ? `rgba(${themeRgb},0.18)` : "transparent", transition: "background 0.2s" }}>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rs}</td>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rd0}</td>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rd1}</td>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 800 }}>{ry}</td>
                    </tr>
                })}</tbody>
            </table>
        </div>
    </div>;
}
