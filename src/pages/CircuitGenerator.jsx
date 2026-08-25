import { ArrowLeft } from 'lucide-react';
import CircuitCard00 from '../components/CircuitCard00';

const backBtnStyle = { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, backgroundColor: "#0e1420", border: "1px solid #1e293b", color: "#64748b", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, transition: "color 0.2s" };

export default function CircuitGenerator({ setPage }) {
    return (
        <div style={{ width: "100%", maxWidth: 500 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <button onClick={() => setPage("logic-gates")}
                    style={backBtnStyle}
                    onMouseEnter={c => c.currentTarget.style.color = "#e2e8f0"}
                    onMouseLeave={c => c.currentTarget.style.color = "#64748b"}
                ><ArrowLeft size={15} /> Back</button>
            </div>
            <h1 style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 900, fontSize: "clamp(1.4rem,6vw,2rem)", background: "linear-gradient(180deg,#06b6d4 0%,#0891b2 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "12px 0 6px" }}>CIRCUIT GENERATOR</h1>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#475569", marginBottom: 20, lineHeight: 1.6 }}>Simbol dan notasi Boolean — fondasi dari semua gerbang logika. Pelajari cara membaca dan memahami simbol logika dasar yang digunakan dalam rangkaian digital.</p>
            <CircuitCard00 />
        </div>
    );
}
