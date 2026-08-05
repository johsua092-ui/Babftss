import { useState } from 'react';
import CircuitDiagram13 from './CircuitDiagram13';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';

export default function CircuitCard13() {
    const [inputS0, setInputS0] = useState(false);
    const [inputS1, setInputS1] = useState(false);
    const [inputS2, setInputS2] = useState(false);
    const [inputS3, setInputS3] = useState(false);
    const [inputD0, setInputD0] = useState(false);
    const [inputD1, setInputD1] = useState(false);
    const [inputD2, setInputD2] = useState(false);
    const [inputD3, setInputD3] = useState(false);
    const [inputD4, setInputD4] = useState(false);
    const [inputD5, setInputD5] = useState(false);
    const [inputD6, setInputD6] = useState(false);
    const [inputD7, setInputD7] = useState(false);
    const [inputD8, setInputD8] = useState(false);
    const [inputD9, setInputD9] = useState(false);
    const [inputD10, setInputD10] = useState(false);
    const [inputD11, setInputD11] = useState(false);
    const [inputD12, setInputD12] = useState(false);
    const [inputD13, setInputD13] = useState(false);
    const [inputD14, setInputD14] = useState(false);
    const [inputD15, setInputD15] = useState(false);

    const s0Not = !inputS0;
    const s1Not = !inputS1;
    const s2Not = !inputS2;
    const s3Not = !inputS3;

    // Enable signals (decoded select — 16 combinations)
    const en0  = s3Not && s2Not && s1Not && s0Not;       // 0000
    const en1  = s3Not && s2Not && s1Not && inputS0;      // 0001
    const en2  = s3Not && s2Not && inputS1 && s0Not;      // 0010
    const en3  = s3Not && s2Not && inputS1 && inputS0;    // 0011
    const en4  = s3Not && inputS2 && s1Not && s0Not;      // 0100
    const en5  = s3Not && inputS2 && s1Not && inputS0;    // 0101
    const en6  = s3Not && inputS2 && inputS1 && s0Not;    // 0110
    const en7  = s3Not && inputS2 && inputS1 && inputS0;  // 0111
    const en8  = inputS3 && s2Not && s1Not && s0Not;      // 1000
    const en9  = inputS3 && s2Not && s1Not && inputS0;    // 1001
    const en10 = inputS3 && s2Not && inputS1 && s0Not;    // 1010
    const en11 = inputS3 && s2Not && inputS1 && inputS0;  // 1011
    const en12 = inputS3 && inputS2 && s1Not && s0Not;    // 1100
    const en13 = inputS3 && inputS2 && s1Not && inputS0;  // 1101
    const en14 = inputS3 && inputS2 && inputS1 && s0Not;  // 1110
    const en15 = inputS3 && inputS2 && inputS1 && inputS0;// 1111

    // AND outputs (enable AND data)
    const g0  = en0  && inputD0;
    const g1  = en1  && inputD1;
    const g2  = en2  && inputD2;
    const g3  = en3  && inputD3;
    const g4  = en4  && inputD4;
    const g5  = en5  && inputD5;
    const g6  = en6  && inputD6;
    const g7  = en7  && inputD7;
    const g8  = en8  && inputD8;
    const g9  = en9  && inputD9;
    const g10 = en10 && inputD10;
    const g11 = en11 && inputD11;
    const g12 = en12 && inputD12;
    const g13 = en13 && inputD13;
    const g14 = en14 && inputD14;
    const g15 = en15 && inputD15;

    // Final output (OR tree)
    const y = g0 || g1 || g2 || g3 || g4 || g5 || g6 || g7 || g8 || g9 || g10 || g11 || g12 || g13 || g14 || g15;

    const themeColor = "#facc15";
    const themeRgb = hexToRgbStr(themeColor);
    const isActive = y;

    // Condensed truth table (16 rows, one per S3S2S1S0 combination)
    const truthTable = [
        [0, 0, 0, 0, 'D0'],  [0, 0, 0, 1, 'D1'],
        [0, 0, 1, 0, 'D2'],  [0, 0, 1, 1, 'D3'],
        [0, 1, 0, 0, 'D4'],  [0, 1, 0, 1, 'D5'],
        [0, 1, 1, 0, 'D6'],  [0, 1, 1, 1, 'D7'],
        [1, 0, 0, 0, 'D8'],  [1, 0, 0, 1, 'D9'],
        [1, 0, 1, 0, 'D10'], [1, 0, 1, 1, 'D11'],
        [1, 1, 0, 0, 'D12'], [1, 1, 0, 1, 'D13'],
        [1, 1, 1, 0, 'D14'], [1, 1, 1, 1, 'D15'],
    ];
    var dMap = {
        D0: inputD0, D1: inputD1, D2: inputD2, D3: inputD3,
        D4: inputD4, D5: inputD5, D6: inputD6, D7: inputD7,
        D8: inputD8, D9: inputD9, D10: inputD10, D11: inputD11,
        D12: inputD12, D13: inputD13, D14: inputD14, D15: inputD15,
    };

    var s3v = inputS3 ? 1 : 0, s2v = inputS2 ? 1 : 0, s1v = inputS1 ? 1 : 0, s0v = inputS0 ? 1 : 0;

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
                <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, color: isActive ? themeColor : "#e2e8f0" }}>16:1 Multiplexer (Mux)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}><HeartButton /><span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "5px 12px", borderRadius: 6, backgroundColor: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.35)", color: "#facc15" }}>NORMAL</span></div>
        </div>

        <CircuitDiagram13
            s0={inputS0} s1={inputS1} s2={inputS2} s3={inputS3}
            d0={inputD0} d1={inputD1} d2={inputD2} d3={inputD3}
            d4={inputD4} d5={inputD5} d6={inputD6} d7={inputD7}
            d8={inputD8} d9={inputD9} d10={inputD10} d11={inputD11}
            d12={inputD12} d13={inputD13} d14={inputD14} d15={inputD15}
            s0Not={s0Not} s1Not={s1Not} s2Not={s2Not} s3Not={s3Not}
            en0={en0} en1={en1} en2={en2} en3={en3}
            en4={en4} en5={en5} en6={en6} en7={en7}
            en8={en8} en9={en9} en10={en10} en11={en11}
            en12={en12} en13={en13} en14={en14} en15={en15}
            g0={g0} g1={g1} g2={g2} g3={g3}
            g4={g4} g5={g5} g6={g6} g7={g7}
            g8={g8} g9={g9} g10={g10} g11={g11}
            g12={g12} g13={g13} g14={g14} g15={g15}
            y={y}
            onToggleS0={() => setInputS0(v => !v)}
            onToggleS1={() => setInputS1(v => !v)}
            onToggleS2={() => setInputS2(v => !v)}
            onToggleS3={() => setInputS3(v => !v)}
            onToggleD0={() => setInputD0(v => !v)}
            onToggleD1={() => setInputD1(v => !v)}
            onToggleD2={() => setInputD2(v => !v)}
            onToggleD3={() => setInputD3(v => !v)}
            onToggleD4={() => setInputD4(v => !v)}
            onToggleD5={() => setInputD5(v => !v)}
            onToggleD6={() => setInputD6(v => !v)}
            onToggleD7={() => setInputD7(v => !v)}
            onToggleD8={() => setInputD8(v => !v)}
            onToggleD9={() => setInputD9(v => !v)}
            onToggleD10={() => setInputD10(v => !v)}
            onToggleD11={() => setInputD11(v => !v)}
            onToggleD12={() => setInputD12(v => !v)}
            onToggleD13={() => setInputD13(v => !v)}
            onToggleD14={() => setInputD14(v => !v)}
            onToggleD15={() => setInputD15(v => !v)}
        />

        <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "10px 0 8px", fontFamily: "Orbitron,sans-serif", fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
            <span style={{ color: inputS3 ? themeColor : "#475569" }}>S3={s3v}</span>
            <span>·</span>
            <span style={{ color: inputS2 ? themeColor : "#475569" }}>S2={s2v}</span>
            <span>·</span>
            <span style={{ color: inputS1 ? themeColor : "#475569" }}>S1={s1v}</span>
            <span>·</span>
            <span style={{ color: inputS0 ? themeColor : "#475569" }}>S0={s0v}</span>
            <span style={{ color: "#334155" }}>|</span>
            {[0,1,2,3,4,5,6,7].map(function(i) {
                return [<span key={'ds'+i} style={{ color: dMap['D'+i] ? themeColor : "#475569" }}>{'D'+i+'='+(dMap['D'+i]?1:0)}</span>, <span key={'dd'+i}>·</span>];
            })}
            {[8,9,10,11,12,13,14,15].map(function(i) {
                return [<span key={'ds'+i} style={{ color: dMap['D'+i] ? themeColor : "#475569" }}>{'D'+i+'='+(dMap['D'+i]?1:0)}</span>, i < 15 ? <span key={'dd'+i}>·</span> : null];
            })}
            <span style={{ color: "#334155" }}>{"\u2192"}</span>
            <span style={{ color: y ? themeColor : "#334155", fontWeight: 700 }}>Y={y ? 1 : 0}</span>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>Multiplexer 16:1 adalah puncak dari keluarga Mux dalam bab ini — saklar digital terbesar yang memilih salah satu dari enam belas sinyal input data berdasarkan empat bit selektor (S3, S2, S1, dan S0). Ketika S3S2S1S0=0000 output mengikuti D0, 0001 mengikuti D1, dan seterusnya hingga 1111 yang mengikuti D15. Dibangun dari 4 NOT gate, 16 AND gate empat input (decoder yang mengaktifkan jalur terpilih), 16 AND gate dua input (menggabungkan sinyal enable dengan data), dan 15 OR gate (tree binary yang menggabungkan 16 sinyal menjadi satu output Y). Ini adalah perluasan langsung dari Mux 8:1 dengan penambahan satu bit selektor — menunjukkan bagaimana prinsip yang sama diskalakan secara sistematis, membentuk fondasi cara prosesor sungguhan memilih data dari banyak sumber.</p>

        <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
            <div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 6, letterSpacing: "0.5px" }}>TABEL KEBENARAN</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Orbitron,sans-serif" }}>
                <thead><tr style={{ borderBottom: "2px solid #1e293b" }}>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>S3</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>S2</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>S1</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>S0</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>Y</th>
                </tr></thead>
                <tbody>{truthTable.map(function(row) {
                    var rs3 = row[0], rs2 = row[1], rs1 = row[2], rs0 = row[3], dLabel = row[4];
                    var isHl = (rs3 === s3v) && (rs2 === s2v) && (rs1 === s1v) && (rs0 === s0v);
                    var yVal = dMap[dLabel] ? 1 : 0;
                    var isGreenHl = yVal === 1;
                    var greenCol = isGreenHl ? "#4ade80" : undefined;
                    return <tr key={rs3+','+rs2+','+rs1+','+rs0} style={{ background: isHl ? `rgba(${themeRgb},0.18)` : "transparent", transition: "background 0.2s" }}>
                        <td style={{ padding: "2px 6px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rs3}</td>
                        <td style={{ padding: "2px 6px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rs2}</td>
                        <td style={{ padding: "2px 6px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rs1}</td>
                        <td style={{ padding: "2px 6px", textAlign: "center", color: isHl ? themeColor : "#94a3b8", fontWeight: 600 }}>{rs0}</td>
                        <td style={{ padding: "2px 6px", textAlign: "center", fontWeight: 800, transition: "all 0.2s" }}>
                            <span style={{
                                background: isGreenHl ? "rgba(74,222,128,0.25)" : "transparent",
                                color: greenCol || (isHl ? themeColor : "#94a3b8"),
                                padding: isGreenHl ? "1px 5px" : "0",
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
