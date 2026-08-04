import { useState } from 'react';
import CircuitDiagram06 from './CircuitDiagram06';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';

export default function CircuitCard06() {
    const [inputA, setInputA] = useState(false);
    const [inputB, setInputB] = useState(false);
    const [inputC, setInputC] = useState(false);
    const [inputD, setInputD] = useState(false);
    const andOut1 = inputA && inputB;
    const andOut2 = andOut1 && inputC;
    const out = andOut2 && inputD;
    const andColor = "#4ade80";
    const andRgb = hexToRgbStr(andColor);
    const truthTable = [
        [0,0,0,0,0],[0,0,0,1,0],[0,0,1,0,0],[0,0,1,1,0],
        [0,1,0,0,0],[0,1,0,1,0],[0,1,1,0,0],[0,1,1,1,0],
        [1,0,0,0,0],[1,0,0,1,0],[1,0,1,0,0],[1,0,1,1,0],
        [1,1,0,0,0],[1,1,0,1,0],[1,1,1,0,0],[1,1,1,1,1],
    ];
    return <div style={{
        backgroundColor: "#0e1420",
        border: out ? `rgba(${andRgb},0.4)` : "#1e293b",
        borderRadius: 16, padding: "18px 14px",
        boxShadow: out ? `0 0 24px rgba(${andRgb},0.18)` : "none",
        transition: "all 0.4s ease"
    }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 14, fontWeight: 700, color: "#ffffff", textShadow: "0 0 4px rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.15)" }}>06</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: out ? andColor : "#334155", boxShadow: out ? `0 0 8px ${andColor}` : "none", transition: "all 0.3s" }} />
                <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, color: out ? andColor : "#e2e8f0" }}>Gerbang 4 Input Lanjutan</span>
            </div>
            <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: "4px 10px", borderRadius: 6, backgroundColor: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.35)", color: "#facc15" }}><HeartButton /><HeartButton />NORMAL</span>
        </div>
        <CircuitDiagram06 a={inputA} b={inputB} c={inputC} d={inputD} andOut1={andOut1} andOut2={andOut2} out={out} onToggleA={() => setInputA(v => !v)} onToggleB={() => setInputB(v => !v)} onToggleC={() => setInputC(v => !v)} onToggleD={() => setInputD(v => !v)} />
        <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "10px 0 8px", fontFamily: "Orbitron,sans-serif", fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
            <span style={{ color: inputA ? andColor : "#475569" }}>A={inputA ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputB ? andColor : "#475569" }}>B={inputB ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputC ? andColor : "#475569" }}>C={inputC ? 1 : 0}</span>
            <span>·</span>
            <span style={{ color: inputD ? andColor : "#475569" }}>D={inputD ? 1 : 0}</span>
            <span style={{ color: "#334155" }}>→</span>
            <span style={{ color: out ? andColor : "#334155", fontWeight: 700 }}>OUT={out ? 1 : 0}</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>Kelanjutan dari gerbang 3 input — sekarang dengan 4 input dan 3 gerbang AND yang disusun berantai. Sinyal A dan B digabungkan oleh AND pertama, hasilnya digabungkan C oleh AND kedua, lalu hasilnya digabungkan D oleh AND ketiga. Rumusnya: OUT = ((A AND B) AND C) AND D. Output hanya bernilai 1 jika SEMUA input bernilai 1. Contoh nyata: sistem peluncuran roket yang memerlukan 4 persetujuan sekaligus sebelum aktif.</p>
        <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
            <div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 6, letterSpacing: "0.5px" }}>TABEL KEBENARAN</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Orbitron,sans-serif" }}>
                <thead><tr style={{ borderBottom: "2px solid #1e293b" }}>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>A</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>B</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>C</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>D</th>
                    <th style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>OUT</th>
                </tr></thead>
                <tbody>{truthTable.map(function(row) {
                    var ra = row[0], rb = row[1], rc = row[2], rd = row[3], ro = row[4];
                    var isHl = (ra === (inputA ? 1 : 0)) && (rb === (inputB ? 1 : 0)) && (rc === (inputC ? 1 : 0)) && (rd === (inputD ? 1 : 0));
                    return <tr key={ra+','+rb+','+rc+','+rd} style={{ background: isHl ? `rgba(${andRgb},0.18)` : "transparent", transition: "background 0.2s" }}>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? andColor : "#94a3b8", fontWeight: 600 }}>{ra}</td>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? andColor : "#94a3b8", fontWeight: 600 }}>{rb}</td>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? andColor : "#94a3b8", fontWeight: 600 }}>{rc}</td>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? andColor : "#94a3b8", fontWeight: 600 }}>{rd}</td>
                        <td style={{ padding: "3px 6px", textAlign: "center", color: isHl ? andColor : "#94a3b8", fontWeight: 800 }}>{ro}</td>
                    </tr>
                })}</tbody>
            </table>
        </div>
    </div>;
}
