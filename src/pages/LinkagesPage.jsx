import { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import linkageData from '../data/linkageData';
import LinkageIcon from '../components/LinkageIcon';
import MenuButton3D from '../components/MenuButton3D';
import { hexToMenuButtonColors } from '../utils/colorHelper';

const backBtnStyle = { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, backgroundColor: "#0e1420", border: "1px solid #1e293b", color: "#64748b", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, transition: "color 0.2s" };

const searchStyle = { flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, backgroundColor: "#0e1420", border: "1px solid #1e293b", fontFamily: "Inter,sans-serif", fontSize: 13, color: "#e2e8f0", outline: "none", transition: "border-color 0.2s" };

export default function LinkagesPage({ setPage }) {
    const [query, setQuery] = useState("");
    const filtered = query.trim()
        ? linkageData.filter(g => g.name.toLowerCase().includes(query.trim().toLowerCase()))
        : linkageData;

    return (
        <div style={{ width: "100%", maxWidth: 500 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <button onClick={() => setPage("menu")}
                    style={backBtnStyle}
                    onMouseEnter={c => c.currentTarget.style.color = "#e2e8f0"}
                    onMouseLeave={c => c.currentTarget.style.color = "#64748b"}
                ><ArrowLeft size={15} /></button>
                <div style={{ position: "relative", flex: 1 }}>
                    <Search size={14} color="#475569" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    <input
                        type="text"
                        placeholder="Cari linkage..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={{ ...searchStyle, paddingLeft: 34 }}
                        onFocus={e => e.currentTarget.style.borderColor = "#334155"}
                        onBlur={e => e.currentTarget.style.borderColor = "#1e293b"}
                    />
                </div>
            </div>
            <h1 style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 900, fontSize: "clamp(1.6rem,7vw,2.4rem)", background: "linear-gradient(180deg,#4ade80 0%,#16a34a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "12px 0 6px" }}>LINKAGES</h1>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#475569", marginBottom: 22, lineHeight: 1.6 }}>Pilih jenis linkage untuk dipelajari. Mekanisme penghubung ini digunakan untuk mengubah gerakan rotasi menjadi gerakan linear atau osilasi.</p>
            {filtered.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{filtered.map(c => {
                const colors = hexToMenuButtonColors(c.color);
                return (
                    <MenuButton3D
                        key={c.id}
                        label={c.name}
                        subtitle={c.desc}
                        top={colors.top}
                        bottom={colors.bottom}
                        lip={colors.lip}
                        onClick={() => toast.info(`${c.name} masih dalam pengerjaan`)}
                        icon={
                            <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <LinkageIcon icon={c.icon} color="#ffffff" size={30} />
                            </div>
                        }
                    />
                );
            })}</div>
            ) : (
                <p style={{ textAlign: "center", color: "#475569", fontFamily: "Inter,sans-serif", fontSize: 13, padding: "40px 0" }}>Linkage tidak ditemukan</p>
            )}
        </div>
    );
}
