import { useState } from 'react';
import CircuitDiagram15 from './CircuitDiagram15';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';

export default function CircuitCard15() {
    const [inputD, setInputD] = useState(false);
    const [inputS0, setInputS0] = useState(false);
    const [inputS1, setInputS1] = useState(false);

    const s0Not = !inputS0;
    const s1Not = !inputS1;
    const y0 = inputD && s1Not && s0Not;
    const y1 = inputD && s1Not && inputS0;
    const y2 = inputD && inputS1 && s0Not;
    const y3 = inputD && inputS1 && inputS0;

    const themeColor = "#facc15";
    const themeRgb = hexToRgbStr(themeColor);
    const andColor = "#4ade80";

    const isActive = y0 || y1 || y2 || y3;

    // Condensed truth table (Format 2: one row per S1S0 combination)
    const truthTable = [
        { s1: 0, s0: 0 },
        { s1: 0, s0: 1 },
        { s1: 1, s0: 0 },
        { s1: 1, s0: 1 }
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
                <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 14, fontWeight: 700, color: "#ffffff", textShadow: "0 0 4px rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.15)" }}>14</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: isActive ? themeColor : "#334155", boxShadow: isActive ? `0 0 8px ${themeColor}` : "none", transition: "all 0.3s" }} />
                <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, color: isActive ? themeColor : "#e2e8f0" }}>4:1 Demultiplexer (Demux)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}><HeartButton /><span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "5px 12px", borderRadius: 6, backgroundColor: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.35)", color: "#facc15" }}>NORMAL</span></div>
        </div>

        <CircuitDiagram15 d={inputD} s0={inputS0} s1={inputS1} s0Not={s0Not} s1Not={s1Not} y0={y0} y1={y1} y2={y2} y3={y3} onToggleD={() => setInputD(v => !v)} onToggleS0={() => setInputS0(v => !v)} onToggleS1={() => setInputS1(v => !v)} />

        <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "10px 0 8px", fontFamily: "Orbitron,sans-serif", fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
            <span style={{ color: inputD ? themeColor : "#475569" }}>D={inputD ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputS0 ? themeColor : "#475569" }}>S0={inputS0 ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputS1 ? themeColor : "#475569" }}>S1={inputS1 ? 1 : 0}</span>
            <span style={{ color: "#334155" }}>{"\u2192"}</span>
            <span style={{ color: y0 ? andColor : "#334155", fontWeight: 700 }}>Y0={y0 ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: y1 ? andColor : "#334155", fontWeight: 700 }}>Y1={y1 ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: y2 ? andColor : "#334155", fontWeight: 700 }}>Y2={y2 ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: y3 ? andColor : "#334155", fontWeight: 700 }}>Y3={y3 ? 1 : 0}</span>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>Lanjutan dari Card 14: sekarang 2 bit select (S1, S0) mengarahkan 1 sumber data D ke salah satu dari 4 tujuan output. Ini pasangan kembar dari Card 11 (4:1 Mux) -- arsitekturnya kebalikan: bukan memilih 1 dari 4 sumber, melainkan menyebarkan 1 sumber ke 1 dari 4 tujuan. Contoh nyata: mail sorting room yang mengarahkan satu paket ke salah satu dari 4 lorong berdasarkan kode alamat 2-bit.</p>

        <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
            <div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 6, letterSpacing: "0.5px" }}>TABEL KEBENARAN</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Orbitron,sans-serif" }}>
                <thead><tr style={{ borderBottom: "2px solid #1e293b" }}>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>S1</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>S0</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>Y0</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>Y1</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>Y2</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>Y3</th>
                </tr></thead>
                <tbody>{truthTable.map(function(row) {
                    var rs1 = row.s1, rs0 = row.s0;
                    var isHl = (rs1 === (inputS1 ? 1 : 0)) && (rs0 === (inputS0 ? 1 : 0));
                    var outputs = [
                        { active: rs1 === 0 && rs0 === 0 },
                        { active: rs1 === 0 && rs0 === 1 },
                        { active: rs1 === 1 && rs0 === 0 },
                        { active: rs1 === 1 && rs0 === 1 }
                    ];
                    return <tr key={rs1 + '' + rs0} style={{ background: isHl ? `rgba(${themeRgb},0.18)` : "transparent", transition: "background 0.2s" }}>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rs1}</td>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rs0}</td>
                        {outputs.map(function(o, oi) {
                            var val = o.active ? (inputD ? 1 : 0) : 0;
                            var isGreen = val === 1;
                            var text = o.active ? `D=${val}` : '0';
                            return <td key={oi} style={{ padding: "3px 6px", textAlign: "center", fontWeight: 800, transition: "all 0.2s" }}>
                                <span style={{
                                    background: isGreen ? "rgba(74,222,128,0.25)" : "transparent",
                                    color: isGreen ? "#4ade80" : (isHl ? themeColor : "#94a3b8"),
                                    padding: isGreen ? "1px 6px" : "0",
                                    display: "block",
                                    transition: "all 0.2s"
                                }}>{text}</span>
                            </td>;
                        })}
                    </tr>;
                })}</tbody>
            </table>
        </div>
    </div>;
}
