import { useState, useMemo } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import CircuitCard00 from '../components/CircuitCard00';
import CircuitCard01 from '../components/CircuitCard01';
import CircuitCard02 from '../components/CircuitCard02';
import CircuitCard03 from '../components/CircuitCard03';
import CircuitCard04 from '../components/CircuitCard04';
import CircuitCard05 from '../components/CircuitCard05';
import CircuitCard06 from '../components/CircuitCard06';
import CircuitCard07 from '../components/CircuitCard07';
import CircuitCard08 from '../components/CircuitCard08';

const ALL_CARDS = [
    { num: '00', name: 'Simbol Boolean', el: CircuitCard00 },
    { num: '01', name: 'NOT AND Combo', el: CircuitCard01 },
    { num: '02', name: 'Buffer Negasi Ganda', el: CircuitCard02 },
    { num: '03', name: 'Bangun NAND Manual', el: CircuitCard03 },
    { num: '04', name: 'Bangun NOR Manual', el: CircuitCard04 },
    { num: '05', name: 'Gerbang 3 Input Sederhana', el: CircuitCard05 },
    { num: '06', name: 'Half Adder', el: CircuitCard06 },
    { num: '07', name: 'Membangun XOR dari Gate Dasar', el: CircuitCard07 },
    { num: '08', name: 'Full Adder', el: CircuitCard08 },
];

const backBtnStyle = { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, backgroundColor: "#0e1420", border: "1px solid #1e293b", color: "#64748b", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, transition: "color 0.2s" };

export default function LogicGatesCircuit({ setPage }) {
    const [query, setQuery] = useState("");
    const [cardNum, setCardNum] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const cn = cardNum.trim();
        const padded = cn ? cn.padStart(2, '0') : '';
        return ALL_CARDS.filter(card => {
            const matchSearch = !q || card.name.toLowerCase().includes(q) || card.num === q;
            const matchNum = !cn || card.num === cn || card.num === padded;
            return matchSearch && matchNum;
        });
    }, [query, cardNum]);

    const hasFilter = query.trim() || cardNum.trim();

    return (
        <div style={{ width: "100%", maxWidth: 500 }}>
            {/* Back button */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <button onClick={() => setPage("logic-gates")}
                    style={backBtnStyle}
                    onMouseEnter={c => c.currentTarget.style.color = "#e2e8f0"}
                    onMouseLeave={c => c.currentTarget.style.color = "#64748b"}
                ><ArrowLeft size={15} /> Back</button>
            </div>

            <h1 style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 900, fontSize: "clamp(1.4rem,6vw,2rem)", background: "linear-gradient(180deg,#4ade80 0%,#16a34a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "12px 0 6px" }}>LOGIC GATES CIRCUIT</h1>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#475569", marginBottom: 20, lineHeight: 1.6 }}>Gabungan beberapa gerbang logika yang saling terhubung membentuk rangkaian kompleks. Pelajari bagaimana sinyal mengalir melewati lebih dari satu gerbang.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ position: "relative", marginBottom: 6 }}>
                    <Search size={18} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    <input
                        type="text"
                        placeholder="Cari circuit..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={{
                            width: "100%", height: 46, borderRadius: 14, backgroundColor: "#252836",
                            border: "none", outline: "none", padding: "0 16px 0 42px",
                            fontFamily: "Inter,sans-serif", fontSize: 14, color: "#e2e8f0",
                            boxSizing: "border-box",
                        }}
                    />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: "4px 10px", borderRadius: 6, backgroundColor: "rgba(148,163,184,0.15)", border: "1px solid rgba(148,163,184,0.3)", color: "#cbd5e1", whiteSpace: "nowrap" }}>card number =</span>
                    <input
                        type="text"
                        placeholder="..."
                        value={cardNum}
                        onChange={e => setCardNum(e.target.value.replace(/[^0-9]/g, ""))}
                        style={{
                            width: 60, height: 30, borderRadius: 8, backgroundColor: "#252836",
                            border: "none", outline: "none", padding: "0 10px",
                            fontFamily: "Orbitron,sans-serif", fontSize: 12, color: "#e2e8f0",
                            boxSizing: "border-box",
                        }}
                    />
                    <button
                        onClick={() => { setQuery(""); setCardNum(""); }}
                        style={{
                            fontFamily: "Orbitron,sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 1,
                            padding: "4px 12px", borderRadius: 6, cursor: "pointer",
                            backgroundColor: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.4)",
                            color: "#f9a8d4", whiteSpace: "nowrap",
                        }}
                    >CLEAR</button>
                </div>

                {/* Semua card termasuk Card 00 — difilter oleh search */}
                {filtered.map(card => <card.el key={card.num} />)}
                {hasFilter && filtered.length === 0 && (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#475569", fontFamily: "Inter,sans-serif", fontSize: 13 }}>
                        Tidak ada circuit yang cocok.
                    </div>
                )}
            </div>
        </div>
    );
}