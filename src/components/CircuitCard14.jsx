import { useState } from 'react';
import CircuitDiagram14 from './CircuitDiagram14';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';

export default function CircuitCard14() {
    const [inputD, setInputD] = useState(false);
    const [inputS, setInputS] = useState(false);

    const sNot = !inputS;
    const y0 = inputD && sNot;
    const y1 = inputD && inputS;

    const themeColor = "#facc15";
    const themeRgb = hexToRgbStr(themeColor);
    const andColor = "#4ade80";

    const isActive = y0 || y1;

    // Condensed truth table (Format 2: one row per select combination)
    const truthTable = [
        { s: 0 },
        { s: 1 }
    ];

    return <div style={{
        backgroundColor: "#0e1420",
        border: isActive ? `rgba(${themeRgb},0.4)` : "#1e293b",
        borderRadius: 16, padding: "18px 14px",
        boxShadow: isActive ? `0 0 24px rgba(${themeRgb},0.18)` : "none",
        transition: "all 0.4s ease"
    }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 14, fontWeight: 700, color: "#ffffff", textShadow: "0 0 4px rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.15)" }}>13</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: isActive ? themeColor : "#334155", boxShadow: isActive ? `0 0 8px ${themeColor}` : "none", transition: "all 0.3s" }} />
                <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, color: isActive ? themeColor : "#e2e8f0" }}>2:1 Demultiplexer (Demux)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}><HeartButton /><span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "5px 12px", borderRadius: 6, backgroundColor: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.35)", color: "#facc15" }}>NORMAL</span></div>
        </div>

        <CircuitDiagram14 d={inputD} s={inputS} sNot={sNot} y0={y0} y1={y1} onToggleD={() => setInputD(v => !v)} onToggleS={() => setInputS(v => !v)} />

        <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "10px 0 8px", fontFamily: "Orbitron,sans-serif", fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
            <span style={{ color: inputD ? themeColor : "#475569" }}>D={inputD ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputS ? themeColor : "#475569" }}>S={inputS ? 1 : 0}</span>
            <span style={{ color: "#334155" }}>{"\u2192"}</span>
            <span style={{ color: y0 ? andColor : "#334155", fontWeight: 700 }}>Y0={y0 ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: y1 ? andColor : "#334155", fontWeight: 700 }}>Y1={y1 ? 1 : 0}</span>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>Demultiplexer (Demux) adalah kebalikan dari Multiplexer -- satu sumber data D disalurkan ke salah satu dari beberapa tujuan output berdasarkan sinyal select S. Jika S=0, data D muncul di Y0 (Y1 selalu 0). Jika S=1, data D muncul di Y1 (Y0 selalu 0). Contoh nyata: seperti wesel kereta api yang mengarahkan satu kereta dari rel utama ke salah satu dari dua jalur tujuan.</p>

        <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
            <div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 6, letterSpacing: "0.5px" }}>TABEL KEBENARAN</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Orbitron,sans-serif" }}>
                <thead><tr style={{ borderBottom: "2px solid #1e293b" }}>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>S</th>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>Y0</th>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>Y1</th>
                </tr></thead>
                <tbody>{truthTable.map(function(row) {
                    var rs = row.s;
                    var isHl = (rs === (inputS ? 1 : 0));
                    var y0Active = (rs === 0);
                    var y1Active = (rs === 1);
                    var y0Val = y0Active ? (inputD ? 1 : 0) : 0;
                    var y1Val = y1Active ? (inputD ? 1 : 0) : 0;
                    var y0Text = y0Active ? `D=${y0Val}` : '0';
                    var y1Text = y1Active ? `D=${y1Val}` : '0';
                    var y0Green = y0Val === 1;
                    var y1Green = y1Val === 1;
                    return <tr key={rs} style={{ background: isHl ? `rgba(${themeRgb},0.18)` : "transparent", transition: "background 0.2s" }}>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rs}</td>
                        <td style={{ padding: "3px 8px", textAlign: "center", fontWeight: 800, transition: "all 0.2s" }}>
                            <span style={{
                                background: y0Green ? "rgba(74,222,128,0.25)" : "transparent",
                                color: y0Green ? "#4ade80" : (isHl ? themeColor : "#94a3b8"),
                                padding: y0Green ? "1px 6px" : "0",
                                display: "block",
                                transition: "all 0.2s"
                            }}>{y0Text}</span>
                        </td>
                        <td style={{ padding: "3px 8px", textAlign: "center", fontWeight: 800, transition: "all 0.2s" }}>
                            <span style={{
                                background: y1Green ? "rgba(74,222,128,0.25)" : "transparent",
                                color: y1Green ? "#4ade80" : (isHl ? themeColor : "#94a3b8"),
                                padding: y1Green ? "1px 6px" : "0",
                                display: "block",
                                transition: "all 0.2s"
                            }}>{y1Text}</span>
                        </td>
                    </tr>
                })}</tbody>
            </table>
        </div>
    </div>;
}
