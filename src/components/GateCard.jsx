import { useState } from 'react';
import GateDiagram from './GateDiagram';
import { computeGateOutput } from '../utils/gateLogic';
import { hexToRgbStr } from '../utils/colorHelper';
import { Fragment } from 'react';

export default function GateCard({ config }) {
    const [a, setA] = useState(false), [f, setF] = useState(false), l = computeGateOutput(config.type, a, f), c = hexToRgbStr(config.color);
    return <div style={{
        backgroundColor: "#0e1420",
        border: `1px solid ${l?`rgba(${c},0.4)`:"#1e293b"}`,
        borderRadius: 16,
        padding: "18px 14px",
        boxShadow: l ? `0 0 24px rgba(${c},0.18)` : "none",
        transition: "all 0.4s ease"
    }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 11, fontWeight: 700, color: "#475569" }}>{String(config.id).padStart(2, "0")}</span>
            <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: l ? config.color : "#334155", boxShadow: l ? `0 0 8px ${config.color}` : "none", transition: "all 0.3s" }} />
            <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, color: l ? config.color : "#e2e8f0" }}>{config.name}</span>
        </div>
        <GateDiagram type={config.type} dualInput={config.dualInput} a={a} b={f} output={l} onToggleA={() => setA(d => !d)} onToggleB={() => setF(d => !d)} color={config.color} />
        <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "10px 0 8px", fontFamily: "Orbitron,sans-serif", fontSize: 10, color: "#475569" }}>
            <span style={{ color: a ? config.color : "#475569" }}>A={a ? 1 : 0}</span>
            {config.dualInput && <Fragment><span>·</span><span style={{ color: f ? config.color : "#475569" }}>B={f ? 1 : 0}</span></Fragment>}
            <span style={{ color: "#334155" }}>→</span>
            <span style={{ color: l ? config.color : "#334155", fontWeight: 700 }}>OUT={l ? 1 : 0}</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>{config.description}</p>
        <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
            <div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 6, letterSpacing: "0.5px" }}>TABEL KEBENARAN</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Orbitron,sans-serif" }}>
                <thead><tr style={{ borderBottom: "2px solid #1e293b" }}>
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>A</th>
                    {config.dualInput ? <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>B</th> : null}
                    <th style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 10 }}>OUT</th>
                </tr></thead>
                <tbody>{(config.dualInput ? [[0,0],[0,1],[1,0],[1,1]] : [[0],[1]]).map(function(r) {
                    var ra = r[0], rb = r[1] || 0, ro = computeGateOutput(config.type, ra, rb), ac = ra == a && rb == f;
                    return <tr key={r.join(',')} style={{ background: ac ? `rgba(${c},0.18)` : "transparent", transition: "background 0.2s" }}>
                        <td style={{ padding: "3px 8px", textAlign: "center", color: ac ? config.color : "#94a3b8", fontWeight: 600 }}>{ra}</td>
                        {config.dualInput ? <td style={{ padding: "3px 8px", textAlign: "center", color: ac ? config.color : "#94a3b8", fontWeight: 600 }}>{rb}</td> : null}
                        <td style={{ padding: "3px 8px", textAlign: "center", color: ac ? config.color : "#94a3b8", fontWeight: 800 }}>{ro ? 1 : 0}</td>
                    </tr>
                })}</tbody>
            </table>
        </div>
    </div>;
}
