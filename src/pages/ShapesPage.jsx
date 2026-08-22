import { ArrowLeft } from 'lucide-react';
import MenuButton3D from '../components/MenuButton3D';

/**
 * ShapesPage — submenu dari "Shapes" (menu utama).
 *
 * 2 tombol submenu:
 *   1. Shapes Calculator — public, langsung ke page 'shapes-calculator'.
 *   2. 3D Block Simulator — login-required (locked=!user). Guest klik → onGuestClick
 *      (banner merah "harap sign in"). Login klik → page 'block-simulator-3d'.
 *
 * Task Bagian 59: diseragamkan ke standar `MenuButton3D` (lihat design.md Bagian 39).
 * onClick & locked DIPERTAHANKAN PERSIS seperti kode lama (pola array TOOLS + .map()
 * lama), cuma tampilannya yang diganti.
 *
 * Icon wrapper 50px (calculator) & 124px (3D kubus+gizmo) SENGAJA lebih besar dari
 * slot standar 56x56 — supaya icon boleh tampil lebih besar tanpa menggeser posisi
 * label. Slot di MenuButton3D sudah fixed-width + overflow:visible (lihat task
 * Bagian 59 fix MenuButton3D.jsx), jadi label antar tombol tetap sejajar lurus.
 */
export default function ShapesPage({ setPage, user, onGuestClick }) {
    return (
        <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, textAlign: 'center' }}>
                <h1 style={{
                    fontFamily: 'Orbitron,sans-serif',
                    fontWeight: 900,
                    fontSize: 'clamp(1.8rem,7vw,2.6rem)',
                    background: 'linear-gradient(180deg,#5eead4 0%,#14b8a6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.01em',
                    margin: 0,
                }}>SHAPES</h1>

                <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* 2 tombol submenu Shapes — diseragamkan ke standar MenuButton3D
                        (lihat design.md Bagian 39). onClick & locked DIPERTAHANKAN PERSIS
                        seperti kode lama (pola TOOLS[].requiresAuth && !user). Standar
                        ukuran icon: container 56x56, SVG 48x48 (rasio 86%) — lihat
                        design.md Bagian 39.4 "STANDAR UKURAN ICON RESMI".
                        Kecuali 2 tombol ini: icon wrapper-nya sengaja dibungkus <div>
                        custom-size (50px & 124px) yang lebih besar dari slot standar,
                        supaya icon boleh tampil lebih besar tanpa menggeser label
                        (slot di MenuButton3D sudah fixed-width + overflow:visible). */}
                    <MenuButton3D
                        label="Shapes Calculator"
                        subtitle="area, volume & more"
                        top="hsl(170,80%,52%)" bottom="hsl(170,80%,32%)" lip="hsl(170,80%,22%)"
                        onClick={() => setPage('shapes-calculator')}
                        icon={
                            <div style={{ width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
                                    <rect x="5" y="3" width="14" height="18" rx="2.5" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.6"/>
                                    <rect x="7.3" y="5.3" width="9.4" height="4" rx="0.8" fill="rgba(0,0,0,0.28)"/>
                                    <circle cx="8.6" cy="12.4" r="1" fill="rgba(0,0,0,0.3)"/>
                                    <circle cx="12" cy="12.4" r="1" fill="rgba(0,0,0,0.3)"/>
                                    <circle cx="15.4" cy="12.4" r="1" fill="rgba(0,0,0,0.3)"/>
                                    <circle cx="8.6" cy="15.8" r="1" fill="rgba(0,0,0,0.3)"/>
                                    <circle cx="12" cy="15.8" r="1" fill="rgba(0,0,0,0.3)"/>
                                    <circle cx="15.4" cy="15.8" r="1" fill="rgba(0,0,0,0.3)"/>
                                    <circle cx="8.6" cy="19" r="1" fill="rgba(0,0,0,0.3)"/>
                                    <circle cx="12" cy="19" r="1" fill="rgba(0,0,0,0.3)"/>
                                    <circle cx="15.4" cy="19" r="1" fill="rgba(0,0,0,0.3)"/>
                                </svg>
                            </div>
                        }
                    />
                    <MenuButton3D
                        label="3D Block Simulator"
                        subtitle="build in 3D space"
                        top="hsl(330,85%,68%)" bottom="hsl(330,80%,46%)" lip="hsl(330,80%,32%)"
                        onClick={() => user ? setPage('block-simulator-3d') : (onGuestClick && onGuestClick())}
                        locked={!user}
                        icon={
                            <div style={{ width: 124, height: 124, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg viewBox="-10 -13 50 50" fill="none" width="100%" height="100%">
                                    <path d="M12.00 1.50 L20.66 6.50 L12.00 11.50 L3.34 6.50 Z" fill="rgba(255,255,255,0.95)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.4" strokeLinejoin="round"/>
                                    <path d="M3.34 6.50 L12.00 11.50 L12.00 21.50 L3.34 16.50 Z" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.4" strokeLinejoin="round"/>
                                    <path d="M20.66 6.50 L12.00 11.50 L12.00 21.50 L20.66 16.50 Z" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.4" strokeLinejoin="round"/>
                                    <path d="M12.00 1.50 L12.00 -7.50" stroke="#4ade80" strokeWidth="1.1" strokeLinecap="butt"/>
                                    <path d="M12.00 -7.50 L14.10 -3.30 L9.90 -3.30 Z" fill="#4ade80"/>
                                    <path d="M20.66 16.50 L28.45 21.00" stroke="#f87171" strokeWidth="1.1" strokeLinecap="butt"/>
                                    <path d="M28.45 21.00 L23.77 20.72 L25.87 17.08 Z" fill="#f87171"/>
                                    <path d="M3.34 16.50 L-4.45 21.00" stroke="#60a5fa" strokeWidth="1.1" strokeLinecap="butt"/>
                                    <path d="M-4.45 21.00 L-1.87 17.08 L0.23 20.72 Z" fill="#60a5fa"/>
                                </svg>
                            </div>
                        }
                    />
                </div>

                <button
                    onClick={() => setPage('menu')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 20px',
                        borderRadius: 10,
                        backgroundColor: '#0e1420',
                        border: '1px solid #334155',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontFamily: 'Inter,sans-serif',
                        fontWeight: 600,
                        fontSize: 14,
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={c => {
                        c.currentTarget.style.color = '#e2e8f0';
                        c.currentTarget.style.borderColor = '#475569';
                    }}
                    onMouseLeave={c => {
                        c.currentTarget.style.color = '#94a3b8';
                        c.currentTarget.style.borderColor = '#334155';
                    }}
                >
                    <ArrowLeft size={18} /> Back
                </button>
            </div>
        </div>
    );
}
