import { useState, useMemo } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { FavoritesProvider } from '../context/FavoritesContext';
import CircuitCard01 from '../components/CircuitCard01';
import CircuitCard02 from '../components/CircuitCard02';
import CircuitCard03 from '../components/CircuitCard03';
import CircuitCard04 from '../components/CircuitCard04';
import CircuitCard05 from '../components/CircuitCard05';
import CircuitCard06 from '../components/CircuitCard06';
import CircuitCard07 from '../components/CircuitCard07';
import CircuitCard08 from '../components/CircuitCard08';
import CircuitCard09 from '../components/CircuitCard09';
import CircuitCard10 from '../components/CircuitCard10';
import CircuitCard11 from '../components/CircuitCard11';
import CircuitCard12 from '../components/CircuitCard12';
import CircuitCard13 from '../components/CircuitCard13';
import CircuitCard14 from '../components/CircuitCard14';

const ALL_CARDS = [
    { num: '01', name: 'NOT AND Combo', tier: 'EASY', el: CircuitCard01 },
    { num: '02', name: 'Buffer Negasi Ganda', tier: 'EASY', el: CircuitCard02 },
    { num: '03', name: 'Bangun NAND Manual', tier: 'EASY', el: CircuitCard03 },
    { num: '04', name: 'Bangun NOR Manual', tier: 'EASY', el: CircuitCard04 },
    { num: '05', name: 'Membangun XOR dari Gate Dasar', tier: 'EASY', el: CircuitCard08 },
    { num: '06', name: 'Gerbang 3 Input Sederhana', tier: 'EASY', el: CircuitCard05 },
    { num: '07', name: 'Gerbang 4 Input Lanjutan', tier: 'EASY', el: CircuitCard06 },
    { num: '08', name: 'Half Adder', tier: 'EASY', el: CircuitCard07 },
    { num: '09', name: 'Full Adder', tier: 'NORMAL', el: CircuitCard09 },
    { num: '10', name: '2:1 Multiplexer (Mux)', tier: 'NORMAL', el: CircuitCard10 },
    { num: '11', name: '4:1 Multiplexer (Mux)', tier: 'NORMAL', el: CircuitCard11 },
    { num: '12', name: '8:1 Multiplexer (Mux)', tier: 'NORMAL', el: CircuitCard12 },
    { num: '13', name: '16:1 Multiplexer (Mux)', tier: 'NORMAL', el: CircuitCard13 },
    { num: '14', name: '2:1 Demultiplexer (Demux)', tier: 'NORMAL', el: CircuitCard14 },
];

const TIERS = [
    { label: 'EASY', bg: 'rgba(34,197,94,0.18)', border: 'rgba(34,197,94,0.4)', color: '#86efac', dimColor: '#4ade80', glow: '0 0 12px rgba(34,197,94,0.5)', shimmer: false },
    { label: 'NORMAL', bg: 'rgba(250,204,21,0.12)', border: 'rgba(250,204,21,0.35)', color: '#facc15', dimColor: '#eab308', glow: '0 0 12px rgba(250,204,21,0.5)', shimmer: false },
    { label: 'HARD', bg: 'rgba(227,11,93,0.18)', border: 'rgba(227,11,93,0.4)', color: '#fda4af', dimColor: '#E30B5D', glow: '0 0 12px rgba(227,11,93,0.5)', shimmer: true, shimmerColor: '227,11,93' },
    { label: 'INSANE', bg: 'rgba(74,45,124,0.2)', border: 'rgba(106,50,144,0.5)', color: '#A855F7', dimColor: '#8B5CF6', glow: '0 0 14px rgba(168,85,247,0.7), 0 0 6px rgba(192,132,252,0.5), 0 0 2px rgba(216,180,254,0.4)', shimmer: false, crack: true },
    { label: 'COMPLEX', bg: 'rgba(100,116,139,0.2)', border: 'rgba(148,163,184,0.5)', color: '#e2e8f0', dimColor: '#94a3b8', glow: '0 0 18px rgba(148,163,184,0.95), 0 0 10px rgba(148,163,184,0.8), 0 0 4px rgba(148,163,184,0.7)', shimmer: false, lightning: true },
];

const badgeBase = { fontFamily: "Orbitron,sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, padding: "5px 14px", borderRadius: 6, cursor: "pointer", transition: "all 0.3s ease", border: "none", whiteSpace: "nowrap" };

const backBtnStyle = { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, backgroundColor: "#0e1420", border: "1px solid #1e293b", color: "#64748b", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, transition: "color 0.2s" };

export default function LogicGatesCircuit({ setPage }) {
    const [query, setQuery] = useState("");
    const [cardNum, setCardNum] = useState("");
    const [activeTier, setActiveTier] = useState(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const cn = cardNum.trim();
        const padded = cn ? cn.padStart(2, '0') : '';
        return ALL_CARDS.filter(card => {
            const matchSearch = !q || card.name.toLowerCase().includes(q) || card.num === q;
            const matchNum = !cn || card.num === cn || card.num === padded;
            const matchTier = !activeTier || card.tier === activeTier;
            return matchSearch && matchNum && matchTier;
        });
    }, [query, cardNum, activeTier]);

    const hasFilter = query.trim() || cardNum.trim() || activeTier;

    const handleClear = () => { setQuery(""); setCardNum(""); setActiveTier(null); };

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
                        onClick={handleClear}
                        style={{
                            fontFamily: "Orbitron,sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 1,
                            padding: "4px 12px", borderRadius: 6, cursor: "pointer",
                            backgroundColor: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.4)",
                            color: "#f9a8d4", whiteSpace: "nowrap",
                        }}
                    >CLEAR</button>
                </div>

                {/* Tier filter labels */}
                <style>{`
                    .tier-btn-hard-active, .tier-btn-insane-active, .tier-btn-complex-active { position: relative; overflow: hidden; }
                    .tier-btn-hard-active::after {
                        content: ""; position: absolute; width: 50%; height: 300%;
                        background: linear-gradient(90deg, transparent, rgba(227,11,93,0.35), transparent);
                        animation: tier-shimmer-hard 3s ease-in-out infinite;
                        pointer-events: none;
                    }
                    @keyframes tier-shimmer-hard { 0% { left: -50%; top: 0%; } 100% { left: 100%; top: 0%; } }
                    .tier-btn-insane-active::before {
                        content: ""; position: absolute; left: 0; width: 100%; height: 100%; top: 0; border-radius: 6px;
                        background: linear-gradient(90deg, transparent, rgba(148,43,211,0.4), rgba(217,70,239,0.3), transparent);
                        animation: insane-flash-shimmer 5s ease-in-out infinite;
                        pointer-events: none;
                    }
                    @keyframes insane-flash-shimmer {
                        0% { left: 0; width: 100%; height: 100%; top: 0; opacity: 0; }
                        3% { left: 0; width: 100%; height: 100%; top: 0; opacity: 0.8; }
                        10% { left: 0; width: 100%; height: 100%; top: 0; opacity: 0; }
                        14% { left: -50%; width: 50%; height: 300%; top: 0; opacity: 0; }
                        38% { left: 100%; width: 50%; height: 300%; top: 0; opacity: 0.8; }
                        42% { left: 100%; width: 50%; height: 300%; top: 0; opacity: 0; }
                        100% { left: 100%; width: 50%; height: 300%; top: 0; opacity: 0; }
                    }
                    .tier-btn-insane-active::after {
                        content: ""; position: absolute; inset: 0; border-radius: 6px;
                        background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%20100%2040%27%3E%0A%3Cpath%20d%3D%27M3%2C22%20L10%2C17%20L15%2C24%20L22%2C14%20L27%2C21%20L34%2C10%20L39%2C18%20L48%2C8%20L54%2C16%20L61%2C22%20L69%2C13%20L77%2C18%20L84%2C24%20L97%2C19%27%20stroke%3D%27rgba%28180%2C130%2C255%2C0.95%29%27%20stroke-width%3D%273.5%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%0A%3Cpath%20d%3D%27M22%2C14%20L26%2C6%20L22%2C1%20L28%2C0%27%20stroke%3D%27rgba%28196%2C140%2C255%2C0.9%29%27%20stroke-width%3D%272.5%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%2F%3E%0A%3Cpath%20d%3D%27M39%2C18%20L43%2C26%20L39%2C32%20L46%2C37%20L44%2C40%27%20stroke%3D%27rgba%28210%2C160%2C255%2C0.85%29%27%20stroke-width%3D%272.5%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%2F%3E%0A%3Cpath%20d%3D%27M54%2C16%20L58%2C6%20L54%2C0%27%20stroke%3D%27rgba%28220%2C170%2C255%2C0.8%29%27%20stroke-width%3D%272%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%2F%3E%0A%3Cpath%20d%3D%27M61%2C22%20L65%2C30%20L61%2C36%20L66%2C40%27%20stroke%3D%27rgba%28180%2C130%2C255%2C0.75%29%27%20stroke-width%3D%271.8%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%2F%3E%0A%3Cpath%20d%3D%27M34%2C10%20L38%2C3%20L34%2C0%27%20stroke%3D%27rgba%28196%2C150%2C255%2C0.8%29%27%20stroke-width%3D%271.8%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%2F%3E%0A%3Cpath%20d%3D%27M69%2C13%20L73%2C5%20L69%2C0%27%20stroke%3D%27rgba%28220%2C170%2C255%2C0.7%29%27%20stroke-width%3D%271.5%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%2F%3E%0A%3Cpath%20d%3D%27M10%2C17%20L13%2C9%20L9%2C3%27%20stroke%3D%27rgba%28210%2C160%2C255%2C0.75%29%27%20stroke-width%3D%271.5%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%2F%3E%0A%3Cpath%20d%3D%27M48%2C8%20L51%2C3%20L48%2C0%27%20stroke%3D%27rgba%28210%2C180%2C255%2C0.65%29%27%20stroke-width%3D%271.2%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%2F%3E%0A%3Cpath%20d%3D%27M77%2C18%20L80%2C11%20L77%2C6%27%20stroke%3D%27rgba%28196%2C150%2C255%2C0.7%29%27%20stroke-width%3D%271.2%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%2F%3E%0A%3C%2Fsvg%3E");
                        background-size: 100% 100%;
                        background-position: center;
                        background-repeat: no-repeat;
                        filter: drop-shadow(0 0 3px rgba(180,130,255,0.4));
                        animation: crack-spread 5s ease-out infinite;
                        pointer-events: none;
                    }
                    @keyframes crack-spread {
                        0%, 42% { clip-path: inset(0 100% 0 0); opacity: 0; }
                        56% { clip-path: inset(0 0% 0 0); opacity: 0.45; }
                        80% { clip-path: inset(0 0% 0 0); opacity: 0.45; }
                        100% { clip-path: inset(0 0% 0 0); opacity: 0; }
                    }
                    .tier-btn-complex-active::before {
                        content: ""; position: absolute; inset: -1px; border-radius: 6px;
                        background: conic-gradient(from var(--lightning-angle, 0deg), transparent 0%, rgba(148,163,184,0.7) 1.5%, transparent 3%, transparent 28%, rgba(200,220,240,0.9) 30%, transparent 32%, transparent 58%, rgba(148,163,184,0.6) 60%, transparent 62%, transparent 100%);
                        animation: lightning-rotate 2.8s linear infinite;
                        pointer-events: none;
                    }
                    @keyframes lightning-rotate { 0% { --lightning-angle: 0deg; } 100% { --lightning-angle: 360deg; } }
                    @property --lightning-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
                `}</style>
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                    {TIERS.map(t => {
                        const isActive = activeTier === t.label;
                        const animClass = isActive && (t.shimmer || t.crack || t.lightning) ? `tier-btn-${t.label.toLowerCase()}-active` : "";
                        return (
                            <button
                                key={t.label}
                                className={animClass}
                                onClick={() => setActiveTier(isActive ? null : t.label)}
                                style={{
                                    ...badgeBase,
                                    backgroundColor: isActive ? t.bg : "transparent",
                                    border: isActive ? `1px solid ${t.border}` : `1px solid ${t.dimColor}40`,
                                    color: isActive ? t.color : t.dimColor,
                                    boxShadow: isActive ? t.glow : "none",
                                    opacity: isActive ? 1 : 0.5,
                                }}
                            >{t.label}</button>
                        );
                    })}
                </div>

                {/* Cards — difilter, auto-wrap dengan FavoritesProvider */}
                {filtered.map(card => (
                    <FavoritesProvider key={card.num} itemId={`circuit-${card.num}`} itemType="circuit">
                        <card.el />
                    </FavoritesProvider>
                ))}
                {hasFilter && filtered.length === 0 && (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#475569", fontFamily: "Inter,sans-serif", fontSize: 13 }}>
                        Tidak ada circuit yang cocok.
                    </div>
                )}
            </div>
        </div>
    );
}