import { useState, Fragment } from 'react';
import CircuitDiagram17 from './CircuitDiagram17';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';

export default function CircuitCard17() {
    const [inputD, setInputD] = useState(false);
    const [inputS0, setInputS0] = useState(false);
    const [inputS1, setInputS1] = useState(false);
    const [inputS2, setInputS2] = useState(false);
    const [inputS3, setInputS3] = useState(false);

    const s0Not = !inputS0;
    const s1Not = !inputS1;
    const s2Not = !inputS2;
    const s3Not = !inputS3;

    const y0  = inputD && s3Not && s2Not && s1Not && s0Not;
    const y1  = inputD && s3Not && s2Not && s1Not && inputS0;
    const y2  = inputD && s3Not && s2Not && inputS1 && s0Not;
    const y3  = inputD && s3Not && s2Not && inputS1 && inputS0;
    const y4  = inputD && s3Not && inputS2 && s1Not && s0Not;
    const y5  = inputD && s3Not && inputS2 && s1Not && inputS0;
    const y6  = inputD && s3Not && inputS2 && inputS1 && s0Not;
    const y7  = inputD && s3Not && inputS2 && inputS1 && inputS0;
    const y8  = inputD && inputS3 && s2Not && s1Not && s0Not;
    const y9  = inputD && inputS3 && s2Not && s1Not && inputS0;
    const y10 = inputD && inputS3 && s2Not && inputS1 && s0Not;
    const y11 = inputD && inputS3 && s2Not && inputS1 && inputS0;
    const y12 = inputD && inputS3 && inputS2 && s1Not && s0Not;
    const y13 = inputD && inputS3 && inputS2 && s1Not && inputS0;
    const y14 = inputD && inputS3 && inputS2 && inputS1 && s0Not;
    const y15 = inputD && inputS3 && inputS2 && inputS1 && inputS0;

    const themeColor = "#facc15";
    const themeRgb = hexToRgbStr(themeColor);
    const andColor = "#4ade80";
    const isActive = y0 || y1 || y2 || y3 || y4 || y5 || y6 || y7 || y8 || y9 || y10 || y11 || y12 || y13 || y14 || y15;

    const truthTable = [];
    for (var i = 0; i < 16; i++) {
        truthTable.push({ s3: (i >> 3) & 1, s2: (i >> 2) & 1, s1: (i >> 1) & 1, s0: i & 1 });
    }

    const activeY = [y0,y1,y2,y3,y4,y5,y6,y7,y8,y9,y10,y11,y12,y13,y14,y15];

    return <div style={{
        backgroundColor: "#0e1420",
        border: isActive ? `rgba(${themeRgb},0.4)` : "#1e293b",
        borderRadius: 16, padding: "18px 14px",
        boxShadow: isActive ? `0 0 24px rgba(${themeRgb},0.18)` : "none",
        transition: "all 0.4s ease"
    }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 14, fontWeight: 700, color: "#ffffff", textShadow: "0 0 4px rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.15)" }}>17</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: isActive ? themeColor : "#334155", boxShadow: isActive ? `0 0 8px ${themeColor}` : "none", transition: "all 0.3s" }} />
                <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, color: isActive ? themeColor : "#e2e8f0" }}>16:1 Demultiplexer (Demux)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}><HeartButton /><span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "5px 12px", borderRadius: 6, backgroundColor: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.35)", color: "#facc15" }}>NORMAL</span></div>
        </div>

        <CircuitDiagram17
            d={inputD} s0={inputS0} s1={inputS1} s2={inputS2} s3={inputS3}
            s0Not={s0Not} s1Not={s1Not} s2Not={s2Not} s3Not={s3Not}
            y0={y0} y1={y1} y2={y2} y3={y3} y4={y4} y5={y5} y6={y6} y7={y7}
            y8={y8} y9={y9} y10={y10} y11={y11} y12={y12} y13={y13} y14={y14} y15={y15}
            onToggleD={() => setInputD(v => !v)}
            onToggleS0={() => setInputS0(v => !v)}
            onToggleS1={() => setInputS1(v => !v)}
            onToggleS2={() => setInputS2(v => !v)}
            onToggleS3={() => setInputS3(v => !v)}
        />

        <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "10px 0 8px", fontFamily: "Orbitron,sans-serif", fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
            <span style={{ color: inputD ? themeColor : "#475569" }}>D={inputD ? 1 : 0}</span>
            <span>\u00b7</span>
            <span style={{ color: inputS0 ? "#22d3ee" : "#475569" }}>S0={inputS0 ? 1 : 0}</span>
            <span>\u00b7</span>
            <span style={{ color: inputS1 ? "#fb923c" : "#475569" }}>S1={inputS1 ? 1 : 0}</span>
            <span>\u00b7</span>
            <span style={{ color: inputS2 ? "#a78bfa" : "#475569" }}>S2={inputS2 ? 1 : 0}</span>
            <span>\u00b7</span>
            <span style={{ color: inputS3 ? "#a3e635" : "#475569" }}>S3={inputS3 ? 1 : 0}</span>
            <span style={{ color: "#334155" }}>{"\u2192"}</span>
            {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(function (i) {
                return <Fragment key={i}>
                    {i > 0 && <span style={{ color: "#334155" }}>\u00b7</span>}
                    <span style={{ color: activeY[i] ? andColor : "#334155", fontWeight: 700 }}>Y{i}={activeY[i] ? 1 : 0}</span>
                </Fragment>;
            })}
        </div>

        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>Puncak keluarga Demux sekaligus penutup Bab B (Mux & Demux): 4 bit select (S3-S0) mengarahkan 1 sumber data D ke salah satu dari 16 tujuan output. Pasangan kembar dari Card 13 (16:1 Mux) — arsitekturnya kebalikan: bukan memilih 1 dari 16 sumber, melainkan menyebarkan 1 sumber ke 1 dari 16 tujuan. Teknik decode: AND4 decode 4-bit kombinasi select, AND2 menggabungkan enable dengan data. Bab B (Mux & Demux) TUNTAS.</p>

        <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
            <div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 6, letterSpacing: "0.5px" }}>TABEL KEBENARAN</div>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9, fontFamily: "Orbitron,sans-serif" }}>
                    <thead><tr style={{ borderBottom: "2px solid #1e293b" }}>
                        <th style={{ padding: "4px 4px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 8 }}>S3</th>
                        <th style={{ padding: "4px 4px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 8 }}>S2</th>
                        <th style={{ padding: "4px 4px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 8 }}>S1</th>
                        <th style={{ padding: "4px 4px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 8 }}>S0</th>
                        {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(function (i) {
                            return <th key={i} style={{ padding: "4px 3px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 8 }}>{i}</th>;
                        })}
                    </tr></thead>
                    <tbody>{truthTable.map(function (row, ri) {
                        var isHl = (row.s3 === (inputS3 ? 1 : 0)) && (row.s2 === (inputS2 ? 1 : 0)) && (row.s1 === (inputS1 ? 1 : 0)) && (row.s0 === (inputS0 ? 1 : 0));
                        return <tr key={ri} style={{ background: isHl ? `rgba(${themeRgb},0.18)` : "transparent", transition: "background 0.2s" }}>
                            <td style={{ padding: "3px 4px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{row.s3}</td>
                            <td style={{ padding: "3px 4px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{row.s2}</td>
                            <td style={{ padding: "3px 4px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{row.s1}</td>
                            <td style={{ padding: "3px 4px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{row.s0}</td>
                            {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(function (oi) {
                                var isAct = ri === oi;
                                var val = isAct ? (inputD ? 1 : 0) : 0;
                                var isGreen = val === 1;
                                var text = isAct ? `D=${val}` : '0';
                                return <td key={oi} style={{ padding: "3px 3px", textAlign: "center", fontWeight: 800, transition: "all 0.2s" }}>
                                    <span style={{
                                        background: isGreen ? "rgba(74,222,128,0.25)" : "transparent",
                                        color: isGreen ? "#4ade80" : (isHl ? themeColor : "#94a3b8"),
                                        padding: isGreen ? "1px 3px" : "0",
                                        display: "block",
                                        transition: "all 0.2s"
                                    }}>{text}</span>
                                </td>;
                            })}
                        </tr>;
                    })}</tbody>
                </table>
            </div>
        </div>
    </div>;
}
