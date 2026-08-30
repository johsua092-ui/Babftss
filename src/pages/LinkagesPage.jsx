import { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import linkageData from '../data/linkageData';
import LinkageIcon from '../components/LinkageIcon';
import MenuButton3D from '../components/MenuButton3D';
import { hexToMenuButtonColors } from '../utils/colorHelper';

/**
 * LinkagesPage — submenu dari "Linkages" (menu utama). DIRESTRUKTURISASI (2026-08-29,
 * request user — pola SAMA dengan GearsPage, lihat memory.md Bagian 68 & design.md Bagian 43):
 *
 * Masuk menu Linkages sekarang muncul HALAMAN PEMISAH (view 'menu') berisi 2 tombol:
 *   1. "Linkages Calculator" — Coming Soon (klik -> toast.info, pola standar web ini
 *      untuk fitur yang belum tersedia; tombol linkage di list juga pakai toast).
 *   2. "Linkages Type" — masuk ke daftar jenis linkage (view 'types' = konten LAMA:
 *      search + list + toast "masih dalam pengerjaan" TIDAK diubah).
 *
 * Navigasi Back: di view 'types' -> kembali ke halaman pemisah (BUKAN menu utama).
 * Di halaman pemisah -> menu utama (perilaku lama).
 *
 * Design tombol pemisah: standar MenuButton3D (design.md Bagian 39) — warna 3
 * turunan HSL dari 1 hue (Calculator = biru hsl(235) identik tombol Linkages di menu
 * utama; Type = green hsl(142) identik family Gears Type + heading halaman), icon SVG
 * custom ber-shading memakai gradient global url(#menuIconGrad) / url(#menuSphereGrad)
 * (defs ada SEKALI di App.jsx), ukuran icon 48 (rasio 86% dari slot 56). Transisi
 * antar view pakai framer-motion AnimatePresence dengan variants SAMA PERSIS dengan
 * transisi halaman App.jsx.
 */

const backBtnStyle = { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, backgroundColor: "#0e1420", border: "1px solid #1e293b", color: "#64748b", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, transition: "color 0.2s" };

const searchStyle = { flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, backgroundColor: "#0e1420", border: "1px solid #1e293b", fontFamily: "Inter,sans-serif", fontSize: 13, color: "#e2e8f0", outline: "none", transition: "border-color 0.2s" };

// Variants transisi antar view — disalin PERSIS dari variants halaman App.jsx
// (identik GearsPage) supaya perpindahan pemisah -> list terasa seperti perpindahan
// halaman biasa.
const viewVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.28, ease: "easeIn" } },
};

// Icon "Linkages Calculator" — badan kalkulator + badge crank-rocker kecil di pojok
// kanan-atas (wheel bulat menuSphereGrad + lengan crank menuIconGrad + pin putih +
// connecting rod + joint ujung) — motif linkage paling klasik: crank & connecting rod.
function LinkagesCalculatorIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
            {/* Badan kalkulator */}
            <rect x="3.8" y="2.8" width="13.2" height="18.4" rx="2.5" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.6" />
            {/* Layar */}
            <rect x="6.2" y="5" width="8.4" height="3.8" rx="0.8" fill="rgba(0,0,0,0.28)" />
            <rect x="6.9" y="5.7" width="4.2" height="1" rx="0.5" fill="rgba(255,255,255,0.55)" />
            {/* Tombol angka (3x2) */}
            <circle cx="8.2" cy="11.8" r="1" fill="rgba(0,0,0,0.3)" />
            <circle cx="10.6" cy="11.8" r="1" fill="rgba(0,0,0,0.3)" />
            <circle cx="13" cy="11.8" r="1" fill="rgba(0,0,0,0.3)" />
            <circle cx="8.2" cy="14.8" r="1" fill="rgba(0,0,0,0.3)" />
            <circle cx="10.6" cy="14.8" r="1" fill="rgba(0,0,0,0.3)" />
            <circle cx="13" cy="14.8" r="1" fill="rgba(0,0,0,0.3)" />
            {/* Bar enter */}
            <rect x="7.2" y="17.4" width="6.8" height="1.7" rx="0.85" fill="rgba(0,0,0,0.3)" />
            {/* Badge crank-rocker (pojok kanan-atas) */}
            <g>
                {/* Wheel crank */}
                <circle cx="19.3" cy="4.4" r="2.6" fill="url(#menuSphereGrad)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.45" />
                <circle cx="19.3" cy="4.4" r="0.85" fill="rgba(0,0,0,0.3)" />
                {/* Lengan crank (dari pusat wheel ke pin) */}
                <rect x="19.05" y="3.95" width="3.0" height="0.95" rx="0.47" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.3" transform="rotate(45 19.3 4.4)" />
                {/* Pin crank */}
                <circle cx="21.4" cy="6.5" r="0.75" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.3" />
                {/* Connecting rod */}
                <path d="M21.4 6.5 L17.5 10.3" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" />
                {/* Joint ujung rod */}
                <circle cx="17.5" cy="10.3" r="1.0" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.35" />
            </g>
        </svg>
    );
}

// Icon "Linkages Type" — four-bar linkage klasik (mekanisme paling dasar):
// ground link bawah (bar + hatching tanda fix + 2 pivot tetap), crank kiri,
// coupler atas, rocker kanan (3 bar = 4 lengan total dgn ground), 2 joint bergerak
// (bulat menuSphereGrad), + garis putus-putus coupler curve (jalur yang ditelusuri
// titik pada coupler — ciri khas studi linkage).
function LinkagesTypeIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
            {/* Coupler curve (dashed) — jejak titik tracer di atas coupler */}
            <path d="M10.0 10.2 C 8.6 7.4, 12.4 5.8, 14.8 8.2" stroke="rgba(255,255,255,0.75)" strokeWidth="0.85" strokeDasharray="1.5 1.1" strokeLinecap="round" />
            <circle cx="14.8" cy="8.2" r="0.55" fill="rgba(255,255,255,0.85)" />
            {/* Bar crank: pivot tetap kiri (6.4,19.3) -> joint B (10.0,11.6) */}
            <rect x="6.4" y="18.45" width="8.5" height="1.7" rx="0.85" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.35" transform="rotate(-65 6.4 19.3)" />
            {/* Bar rocker: pivot tetap kanan (17.6,19.3) -> joint C (13.6,13.1) */}
            <rect x="17.6" y="18.45" width="7.4" height="1.7" rx="0.85" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.35" transform="rotate(-122.6 17.6 19.3)" />
            {/* Bar coupler: joint B (10.0,11.6) -> joint C (13.6,13.1) */}
            <rect x="10.0" y="10.8" width="3.9" height="1.6" rx="0.8" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.35" transform="rotate(22.6 10 11.6)" />
            {/* Ground link (bar bawah) + hatching fix */}
            <rect x="4.4" y="18.45" width="15.2" height="1.7" rx="0.85" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
            <path d="M5.6 20.6 L4.7 22.2 M8.0 20.6 L7.1 22.2 M10.4 20.6 L9.5 22.2 M12.8 20.6 L11.9 22.2 M15.2 20.6 L14.3 22.2 M17.6 20.6 L16.7 22.2" stroke="rgba(255,255,255,0.55)" strokeWidth="0.6" strokeLinecap="round" />
            {/* Pivot tetap di ground */}
            <circle cx="6.4" cy="19.3" r="1.15" fill="url(#menuSphereGrad)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.4" />
            <circle cx="6.4" cy="19.3" r="0.4" fill="rgba(0,0,0,0.35)" />
            <circle cx="17.6" cy="19.3" r="1.15" fill="url(#menuSphereGrad)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.4" />
            <circle cx="17.6" cy="19.3" r="0.4" fill="rgba(0,0,0,0.35)" />
            {/* Joint bergerak (B & C) */}
            <circle cx="10.0" cy="11.6" r="1.15" fill="url(#menuSphereGrad)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.4" />
            <circle cx="10.0" cy="11.6" r="0.4" fill="rgba(0,0,0,0.35)" />
            <circle cx="13.6" cy="13.1" r="1.15" fill="url(#menuSphereGrad)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.4" />
            <circle cx="13.6" cy="13.1" r="0.4" fill="rgba(0,0,0,0.35)" />
        </svg>
    );
}

export default function LinkagesPage({ setPage }) {
    const [query, setQuery] = useState("");
    // view 'menu' = halaman pemisah 2 tombol (DEFAULT saat masuk menu Linkages).
    // view 'types' = daftar jenis linkage (konten lama).
    const [view, setView] = useState("menu");
    const filtered = query.trim()
        ? linkageData.filter(g => g.name.toLowerCase().includes(query.trim().toLowerCase()))
        : linkageData;

    return (
        <div style={{ width: "100%", maxWidth: 500 }}>
            <AnimatePresence mode="wait">
                {view === "menu" ? (
                    /* ── HALAMAN PEMISAH: Linkages Calculator / Linkages Type ── */
                    <motion.div key="linkages-menu" variants={viewVariants} initial="hidden" animate="visible" exit="exit">
                        <div style={{ display: "flex", marginBottom: 8 }}>
                            <button onClick={() => setPage("menu")}
                                style={backBtnStyle}
                                onMouseEnter={c => c.currentTarget.style.color = "#e2e8f0"}
                                onMouseLeave={c => c.currentTarget.style.color = "#64748b"}
                            ><ArrowLeft size={15} /></button>
                        </div>
                        <h1 style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 900, fontSize: "clamp(1.6rem,7vw,2.4rem)", background: "linear-gradient(180deg,#4ade80 0%,#16a34a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "12px 0 6px" }}>LINKAGES</h1>
                        <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#475569", marginBottom: 22, lineHeight: 1.6 }}>Pilih alat untuk mekanisme engsel: kalkulasi dimensi linkage dengan Linkages Calculator, atau pelajari jenis-jenis mekanisme satu per satu di Linkages Type.</p>
                        <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 12 }}>
                            {/* Linkages Calculator — Coming Soon (toast, pola standar web ini) */}
                            <MenuButton3D
                                label="Linkages Calculator"
                                subtitle="coming soon"
                                top="hsl(235,70%,72%)" bottom="hsl(235,65%,52%)" lip="hsl(235,65%,38%)"
                                onClick={() => toast.info("Linkages Calculator — Coming Soon!")}
                                icon={<LinkagesCalculatorIcon />}
                            />
                            {/* Linkages Type — masuk ke daftar jenis linkage (konten lama) */}
                            <MenuButton3D
                                label="Linkages Type"
                                subtitle="45 jenis mekanisme"
                                top="hsl(142,55%,55%)" bottom="hsl(142,55%,35%)" lip="hsl(142,55%,24%)"
                                onClick={() => setView("types")}
                                icon={<LinkagesTypeIcon />}
                            />
                        </div>
                    </motion.div>
                ) : (
                    /* ── DAFTAR JENIS LINKAGE (konten lama — TIDAK diubah, hanya
                         tombol Back kembali ke halaman pemisah) ── */
                    <motion.div key="linkages-types" variants={viewVariants} initial="hidden" animate="visible" exit="exit">
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <button onClick={() => setView("menu")}
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
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
