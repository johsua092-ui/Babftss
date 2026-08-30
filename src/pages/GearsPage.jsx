import { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import gearData from '../data/gearData';
import GearIcon from '../components/GearIcon';
import MenuButton3D from '../components/MenuButton3D';
import { hexToMenuButtonColors } from '../utils/colorHelper';

/**
 * GearsPage — submenu dari "Gears" (menu utama). DIRESTRUKTURISASI (2026-08-28,
 * request user — lihat memory.md Bagian 67 & design.md Bagian 42):
 *
 * Masuk menu Gears sekarang muncul HALAMAN PEMISAH (view 'menu') berisi 2 tombol:
 *   1. "Gears Calculator" — Coming Soon (klik -> toast.info, pola standar web ini
 *      untuk fitur yang belum tersedia; tombol gear di list juga pakai toast).
 *   2. "Gears Type" — masuk ke daftar jenis gear (view 'types' = konten LAMA:
 *      search + list + toast "masih dalam pengerjaan" TIDAK diubah).
 *
 * Navigasi Back: di view 'types' -> kembali ke halaman pemisah (BUKAN menu utama).
 * Di halaman pemisah -> menu utama (perilaku lama).
 *
 * Design tombol pemisah: standar MenuButton3D (design.md Bagian 39) — warna 3
 * turunan HSL dari 1 hue, icon SVG custom ber-shading memakai gradient global
 * url(#menuIconGrad) / url(#menuSphereGrad) (defs ada SEKALI di App.jsx), ukuran
 * icon 56/48 (rasio 86%). Transisi antar view pakai framer-motion AnimatePresence
 * dengan variants SAMA PERSIS dengan transisi halaman App.jsx.
 */

const backBtnStyle = { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, backgroundColor: "#0e1420", border: "1px solid #1e293b", color: "#64748b", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, transition: "color 0.2s" };

const searchStyle = { flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, backgroundColor: "#0e1420", border: "1px solid #1e293b", fontFamily: "Inter,sans-serif", fontSize: 13, color: "#e2e8f0", outline: "none", transition: "border-color 0.2s" };

// Variants transisi antar view — disalin PERSIS dari variants halaman App.jsx
// supaya perpindahan pemisah -> list terasa seperti perpindahan halaman biasa.
const viewVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.28, ease: "easeIn" } },
};

// Sudut gigi gear untuk icon SVG (8 posisi @45 derajat; offset 22.5 utk gear kecil
// supaya gigi kedua gear terlihat saling mengunci, bukan bertabrakan).
const TEETH_8 = [0, 45, 90, 135, 180, 225, 270, 315];
const TEETH_8_OFFSET = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

// Icon "Gears Calculator" — badan kalkulator + badge gear kecil di pojok kanan-atas
// (gigi gear = 8 rect diputar; shading: menuIconGrad permukaan, menuSphereGrad badge bulat).
function GearsCalculatorIcon() {
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
            {/* Badge gear (pojok kanan-atas) */}
            <g>
                {TEETH_8.map(a => (
                    <rect key={a} x="18.95" y="1.5" width="1.3" height="1.5" rx="0.35" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.3" transform={`rotate(${a} 19.6 4.6)`} />
                ))}
                <circle cx="19.6" cy="4.6" r="2.5" fill="url(#menuSphereGrad)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.45" />
                <circle cx="19.6" cy="4.6" r="0.9" fill="rgba(0,0,0,0.3)" />
            </g>
        </svg>
    );
}

// Icon "Gears Type" — dua gear saling mengunci (besar kiri-bawah + kecil kanan-atas),
// shading menuIconGrad (gear besar) + menuSphereGrad (gear kecil) + highlight bulan sabit.
function GearsTypeIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
            {/* Gear besar */}
            <g>
                {TEETH_8.map(a => (
                    <rect key={a} x="9.75" y="7.0" width="2.1" height="2.0" rx="0.45" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.35" transform={`rotate(${a} 10.8 13.2)`} />
                ))}
                <circle cx="10.8" cy="13.2" r="4.8" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
                <path d="M7.3 9.9 A4.8 4.8 0 0 1 10.8 8.4 L10.8 10.5 A2.7 2.7 0 0 0 8.89 11.29 Z" fill="rgba(255,255,255,0.5)" />
                <circle cx="10.8" cy="13.2" r="1.8" fill="rgba(0,0,0,0.3)" />
            </g>
            {/* Gear kecil (mengunci dengan gear besar) */}
            <g>
                {TEETH_8_OFFSET.map(a => (
                    <rect key={a} x="16.95" y="4.0" width="1.3" height="1.4" rx="0.35" fill="url(#menuSphereGrad)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.3" transform={`rotate(${a} 17.6 7.0)`} />
                ))}
                <circle cx="17.6" cy="7.0" r="2.5" fill="url(#menuSphereGrad)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.45" />
                <circle cx="17.6" cy="7.0" r="0.9" fill="rgba(0,0,0,0.3)" />
            </g>
        </svg>
    );
}

export default function GearsPage({ setPage }) {
    const [query, setQuery] = useState("");
    // view 'menu' = halaman pemisah 2 tombol (DEFAULT saat masuk menu Gears).
    // view 'types' = daftar jenis gear (konten lama).
    const [view, setView] = useState("menu");
    const filtered = query.trim()
        ? gearData.filter(g => g.name.toLowerCase().includes(query.trim().toLowerCase()))
        : gearData;

    return (
        <div style={{ width: "100%", maxWidth: 500 }}>
            <AnimatePresence mode="wait">
                {view === "menu" ? (
                    /* ── HALAMAN PEMISAH: Gears Calculator / Gears Type ── */
                    <motion.div key="gears-menu" variants={viewVariants} initial="hidden" animate="visible" exit="exit">
                        <div style={{ display: "flex", marginBottom: 8 }}>
                            <button onClick={() => setPage("menu")}
                                style={backBtnStyle}
                                onMouseEnter={c => c.currentTarget.style.color = "#e2e8f0"}
                                onMouseLeave={c => c.currentTarget.style.color = "#64748b"}
                            ><ArrowLeft size={15} /></button>
                        </div>
                        <h1 style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 900, fontSize: "clamp(1.6rem,7vw,2.4rem)", background: "linear-gradient(180deg,#4ade80 0%,#16a34a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "12px 0 6px" }}>GEARS</h1>
                        <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#475569", marginBottom: 22, lineHeight: 1.6 }}>Pilih alat untuk roda gigi: kalkulasi dimensi gigi dengan Gears Calculator, atau pelajari jenis-jenis gear satu per satu di Gears Type.</p>
                        <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 12 }}>
                            {/* Gears Calculator — Coming Soon (toast, pola standar web ini) */}
                            <MenuButton3D
                                label="Gears Calculator"
                                subtitle="coming soon"
                                top="hsl(38,90%,60%)" bottom="hsl(38,85%,40%)" lip="hsl(38,85%,26%)"
                                onClick={() => toast.info("Gears Calculator — Coming Soon!")}
                                icon={<GearsCalculatorIcon />}
                            />
                            {/* Gears Type — masuk ke daftar jenis gear (konten lama) */}
                            <MenuButton3D
                                label="Gears Type"
                                subtitle="36 jenis roda gigi"
                                top="hsl(142,55%,55%)" bottom="hsl(142,55%,35%)" lip="hsl(142,55%,24%)"
                                onClick={() => setView("types")}
                                icon={<GearsTypeIcon />}
                            />
                        </div>
                    </motion.div>
                ) : (
                    /* ── DAFTAR JENIS GEAR (konten lama — TIDAK diubah, hanya
                         tombol Back kembali ke halaman pemisah) ── */
                    <motion.div key="gears-types" variants={viewVariants} initial="hidden" animate="visible" exit="exit">
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
                                    placeholder="Cari gear..."
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    style={{ ...searchStyle, paddingLeft: 34 }}
                                    onFocus={e => e.currentTarget.style.borderColor = "#334155"}
                                    onBlur={e => e.currentTarget.style.borderColor = "#1e293b"}
                                />
                            </div>
                        </div>
                        <h1 style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 900, fontSize: "clamp(1.6rem,7vw,2.4rem)", background: "linear-gradient(180deg,#4ade80 0%,#16a34a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "12px 0 6px" }}>GEARS</h1>
                        <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#475569", marginBottom: 22, lineHeight: 1.6 }}>Pilih jenis roda gigi untuk dipelajari. Setiap gear memiliki bentuk dan kegunaan yang unik dalam dunia mesin dan teknik mekanik.</p>
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
                                            <GearIcon icon={c.icon} color="#ffffff" size={30} />
                                        </div>
                                    }
                                />
                            );
                        })}</div>
                        ) : (
                            <p style={{ textAlign: "center", color: "#475569", fontFamily: "Inter,sans-serif", fontSize: 13, padding: "40px 0" }}>Gear tidak ditemukan</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
