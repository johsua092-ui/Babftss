import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import linkageData from '../data/linkageData';
import LinkageIcon from '../components/LinkageIcon';
import { hexToRgbStr } from '../utils/colorHelper';

const backBtnStyle = { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, backgroundColor: "#0e1420", border: "1px solid #1e293b", color: "#64748b", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, transition: "color 0.2s" };

export default function LinkagesPage({ setPage }) {
    return (
        <div style={{ width: "100%", maxWidth: 500 }}>
            <div style={{ marginBottom: 8 }}>
                <button onClick={() => setPage("menu")}
                    style={backBtnStyle}
                    onMouseEnter={c => c.currentTarget.style.color = "#e2e8f0"}
                    onMouseLeave={c => c.currentTarget.style.color = "#64748b"}
                ><ArrowLeft size={15} /> Back</button>
            </div>
            <h1 style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 900, fontSize: "clamp(1.6rem,7vw,2.4rem)", background: "linear-gradient(180deg,#4ade80 0%,#16a34a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "12px 0 6px" }}>LINKAGES</h1>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#475569", marginBottom: 22, lineHeight: 1.6 }}>Pilih jenis linkage untuk dipelajari. Mekanisme penghubung ini digunakan untuk mengubah gerakan rotasi menjadi gerakan linear atau osilasi.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{linkageData.map(c => {
                const d = hexToRgbStr(c.color);
                return <button key={c.id} onClick={() => toast.info(`${c.name} masih dalam pengerjaan`)}
                    style={{ width: "100%", padding: "14px 16px", borderRadius: 14, cursor: "pointer", backgroundColor: "#0e1420", border: `1px solid rgba(${d},0.28)`, display: "flex", alignItems: "center", gap: 14, transition: "all 0.22s", boxShadow: `0 0 12px rgba(${d},0.1)`, textAlign: "left" }}
                    onMouseEnter={r => { r.currentTarget.style.transform = "translateX(4px)"; r.currentTarget.style.boxShadow = `0 0 22px rgba(${d},0.28)`; r.currentTarget.style.borderColor = `rgba(${d},0.55)`; }}
                    onMouseLeave={r => { r.currentTarget.style.transform = "translateX(0)"; r.currentTarget.style.boxShadow = `0 0 12px rgba(${d},0.1)`; r.currentTarget.style.borderColor = `rgba(${d},0.28)`; }}
                ><div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, backgroundColor: `rgba(${d},0.12)`, border: `1px solid rgba(${d},0.22)`, display: "flex", alignItems: "center", justifyContent: "center" }}><LinkageIcon icon={c.icon} color={c.color} size={34} /></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}><span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 8, fontWeight: 700, color: c.color, opacity: .7, letterSpacing: 1 }}>{String(c.id).padStart(2, "0")}</span><span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 700, fontSize: 12, color: "#e2e8f0", letterSpacing: .3 }}>{c.name}</span></div><p style={{ margin: 0, fontFamily: "Inter,sans-serif", fontSize: 11, color: "#64748b", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.desc}</p></div><div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, backgroundColor: c.color, opacity: .6, boxShadow: `0 0 6px ${c.color}` }} /></button>
            })}</div>
        </div>
    );
}
