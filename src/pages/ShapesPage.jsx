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
                                <svg viewBox="-5 -8 35 32" fill="none" width="96" height="96" style={{ transform: 'translateY(-5px)' }}>
                                    {/* Kubus isometric */}
                                    <path d="M12 2 L21 7 L12 12 L3 7 Z" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" strokeLinejoin="round"/>
                                    <path d="M3 7 L12 12 L12 22 L3 17 Z" fill="rgba(255,255,255,0.45)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" strokeLinejoin="round"/>
                                    <path d="M21 7 L12 12 L12 22 L21 17 Z" fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" strokeLinejoin="round"/>
                                    {/* Move tool gizmo arrows — 3 axis dengan cone tips (kerucut).
                                        Origin di CENTER FACE (tengah sisi), BUKAN vertex/pojok.
                                        Arah panah MENGIKUTI ARAH SISI KUBUS (isometric 30° projection):
                                        - Hijau = Y-axis dari top face center (12,7) pointing UP (vertical)
                                        - Merah = X-axis dari right face center (16.5,14.5) pointing KANAN-BAWAH (slope ~30°)
                                        - Biru = Z-axis dari left face center (7.5,14.5) pointing KIRI-BAWAH (slope ~30°)
                                        Sebelumnya merah/biru horizontal lurus — tidak wajar untuk isometric. */}
                                    {/* Y-axis (hijau) — dari top face center (12,7), pointing UP (vertical) */}
                                    <line x1="12" y1="7" x2="12" y2="-1" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
                                    <path d="M9 -1 L15 -1 L12 -5 Z" fill="#22c55e"/>
                                    {/* X-axis (merah) — dari right face center (16.5,14.5), pointing KANAN-BAWAH
                                        (mengikuti arah normal right face di isometric projection, slope ~30°).
                                        Cone diperbesar (base 6, height 4) supaya sebanding dengan hijau. */}
                                    <line x1="16.5" y1="14.5" x2="23" y2="18" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
                                    <path d="M22 21 L24 15 L27 20 Z" fill="#ef4444"/>
                                    {/* Z-axis (biru) — dari left face center (7.5,14.5), pointing KIRI-BAWAH
                                        (mirror dari X-axis, mengikuti arah normal left face).
                                        Cone diperbesar (base 6, height 4) supaya sebanding dengan hijau. */}
                                    <line x1="7.5" y1="14.5" x2="1" y2="18" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
                                    <path d="M0 15 L2 21 L-3 20 Z" fill="#3b82f6"/>
                                    {/* Badge 3D — geser KIRI dekat kubus (x:19→13), perbesar (fontSize 5→6, rect w:11→13) */}
                                    <rect x="13" y="0" width="13" height="8" rx="1.5" fill="rgba(0,0,0,0.7)"/>
                                    <text x="19.5" y="6" textAnchor="middle" fill="#fbbf24" fontSize="6" fontWeight="700" fontFamily="Inter,sans-serif">3D</text>
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
                                <svg viewBox="-5 -8 35 32" fill="none" width="96" height="96" style={{ transform: 'translateY(-5px)' }}>
                                    {/* Kubus isometric — sama dengan v2 */}
                                    <path d="M12 2 L21 7 L12 12 L3 7 Z" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" strokeLinejoin="round"/>
                                    <path d="M3 7 L12 12 L12 22 L3 17 Z" fill="rgba(255,255,255,0.45)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" strokeLinejoin="round"/>
                                    <path d="M21 7 L12 12 L12 22 L21 17 Z" fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" strokeLinejoin="round"/>
                                    {/* Move tool gizmo arrows — sama dengan v2 (3 axis cone-tipped,
                                        origin di center face, arah mengikuti sisi kubus isometric). */}
                                    <line x1="12" y1="7" x2="12" y2="-1" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
                                    <path d="M9 -1 L15 -1 L12 -5 Z" fill="#22c55e"/>
                                    <line x1="16.5" y1="14.5" x2="23" y2="18" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
                                    <path d="M22 21 L24 15 L27 20 Z" fill="#ef4444"/>
                                    <line x1="7.5" y1="14.5" x2="1" y2="18" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
                                    <path d="M0 15 L2 21 L-3 20 Z" fill="#3b82f6"/>
                                    {/* Badge TEST — pink, perbesar (fontSize 4.5→5, rect w:15→17). viewBox 30 supaya muat tanpa terpotong. */}
                                    <rect x="13" y="0" width="17" height="8" rx="1.5" fill="rgba(0,0,0,0.7)"/>
                                    <text x="21.5" y="6" textAnchor="middle" fill="#ec4899" fontSize="5" fontWeight="700" fontFamily="Inter,sans-serif">TEST</text>
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
