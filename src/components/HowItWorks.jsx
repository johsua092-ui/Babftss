import { Fragment } from 'react';
import { ToggleLeft, Cpu, Lightbulb } from 'lucide-react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function HowItWorks() {
    const i = [{
        icon: <ToggleLeft size={18} />,
        title: "INPUT",
        color: "#60a5fa",
        desc: "Kamu memberi perintah — tekan tombol untuk mengirim sinyal. Nilai: 1 (ON) atau 0 (OFF)."
    }, {
        icon: <Cpu size={18} />,
        title: "PROCESS",
        color: "#4ade80",
        desc: "Gate mengolah sinyal sesuai aturannya dan memutuskan output-nya."
    }, {
        icon: <Lightbulb size={18} />,
        title: "OUTPUT",
        color: "#f472b6",
        desc: "Hasil keputusan gate. Lampu menyala = 1, Lampu padam = 0."
    }];
    return <div style={{
        backgroundColor: "#0a0f1a",
        border: "1px solid #1e293b",
        borderRadius: 16,
        padding: 14,
        marginBottom: 20
    }}>
        <p style={{
            fontFamily: "Orbitron,sans-serif",
            fontSize: 9,
            color: "#475569",
            letterSpacing: 2,
            textAlign: "center",
            margin: "0 0 12px"
        }}>CARA KERJA LOGIC GATES</p>
        <div style={{ display: "flex", alignItems: "stretch", gap: 6 }}>
            {i.map((a, o) => <Fragment key={a.title}>
                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: `rgba(${hexToRgbStr(a.color)},0.06)`,
                    border: `1px solid rgba(${hexToRgbStr(a.color)},0.2)`,
                    borderRadius: 12,
                    padding: "10px 6px",
                    textAlign: "center"
                }}>
                    <div style={{ color: a.color }}>{a.icon}</div>
                    <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 9, color: a.color }}>{a.title}</span>
                    <span style={{ fontFamily: "Inter,sans-serif", fontSize: 9, color: "#64748b", lineHeight: 1.5 }}>{a.desc}</span>
                </div>
                {o < i.length - 1 && <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    <span style={{ color: "#334155", fontSize: 14 }}>→</span>
                </div>}
            </Fragment>)}
        </div>
    </div>;
}
