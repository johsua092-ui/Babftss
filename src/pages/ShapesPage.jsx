import { ArrowLeft } from 'lucide-react';
import MenuButton3D from '../components/MenuButton3D';

/**
 * ShapesPage — submenu dari "Shapes" (menu utama).
 *
 * Tombol submenu:
 *   1. Shapes Calculator — public, langsung ke page 'shapes-calculator'.
 *   2. 3D Block Simulator v2 — login-required (locked=!user). Guest klik → onGuestClick
 *      (banner merah "harap sign in"). Login klik → page 'block-simulator-3d-v2'.
 *   3. 3D Block Simulator v2 TEST — open access, page 'block-sim-test' (ChunkManager engine).
 *
 * Task Bagian 59: diseragamkan ke standar `MenuButton3D` (lihat design.md Bagian 39).
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
                    {/* 3D Block Simulator v2 — login-required (locked=!user).
                        Guest klik → onGuestClick (banner merah "harap sign in").
                        Login klik → page 'block-simulator-3d-v2'. Pakai warna amber/oranye
                        biar kontras dengan teal Calculator. Icon: kubus isometric
                        dengan badge "V2" di pojok. */}
                    <MenuButton3D
                        label="3D Block Simulator v2"
                        subtitle="three.js engine"
                        top="hsl(38,90%,60%)" bottom="hsl(38,85%,40%)" lip="hsl(38,85%,26%)"
                        onClick={() => user ? setPage('block-simulator-3d-v2') : (onGuestClick && onGuestClick())}
                        locked={!user}
                        icon={
                            <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg viewBox="0 0 30 24" fill="none" width="48" height="48">
                                    {/* Kubus isometric */}
                                    <path d="M12 2 L21 7 L12 12 L3 7 Z" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" strokeLinejoin="round"/>
                                    <path d="M3 7 L12 12 L12 22 L3 17 Z" fill="rgba(255,255,255,0.45)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" strokeLinejoin="round"/>
                                    <path d="M21 7 L12 12 L12 22 L21 17 Z" fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" strokeLinejoin="round"/>
                                    {/* Badge 3D — diperbesar utk readability (fontSize 3.6→5) */}
                                    <rect x="19" y="0" width="11" height="7" rx="1.5" fill="rgba(0,0,0,0.65)"/>
                                    <text x="24.5" y="5.2" textAnchor="middle" fill="#fbbf24" fontSize="5" fontWeight="700" fontFamily="Inter,sans-serif">3D</text>
                                </svg>
                            </div>
                        }
                    />
                    {/* 3D Block Simulator v2 TEST — ChunkManager engine test page.
                        Open access (no auth lock) for easy performance testing.
                        Placed TEPAT di bawah v2 button per request user.
                        Warna PINK (hsl 330) per request user 2026-09-02 — sebelumnya
                        cyan/teal. Icon: kubus isometric sama dengan v2 tapi badge
                        "T" (Test) pink, bukan "V2" amber. */}
                    <MenuButton3D
                        label="3D Block Simulator v2 TEST"
                        subtitle="ChunkManager engine"
                        top="hsl(330,85%,68%)" bottom="hsl(330,80%,46%)" lip="hsl(330,80%,32%)"
                        onClick={() => setPage('block-sim-test')}
                        icon={
                            <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg viewBox="0 0 30 24" fill="none" width="48" height="48">
                                    {/* Kubus isometric — sama dengan v2 */}
                                    <path d="M12 2 L21 7 L12 12 L3 7 Z" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" strokeLinejoin="round"/>
                                    <path d="M3 7 L12 12 L12 22 L3 17 Z" fill="rgba(255,255,255,0.45)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" strokeLinejoin="round"/>
                                    <path d="M21 7 L12 12 L12 22 L21 17 Z" fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" strokeLinejoin="round"/>
                                    {/* Badge TEST — pink, diperbesar utk readability (fontSize 3.2→4.5).
                                        viewBox extend ke 30 supaya rect width 15 (x:15-30) muat
                                        tanpa terpotong. Sebelumnya rect x=9 w=18 extend ke x=27,
                                        melewati viewBox 24 → terpotong. */}
                                    <rect x="15" y="0" width="15" height="7" rx="1.5" fill="rgba(0,0,0,0.65)"/>
                                    <text x="22.5" y="5.2" textAnchor="middle" fill="#ec4899" fontSize="4.5" fontWeight="700" fontFamily="Inter,sans-serif">TEST</text>
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
