import { useState } from 'react';

/**
 * MenuButton3D — STANDAR DESAIN DEFAULT untuk seluruh web ini.
 *
 * Spec final (lihat `design.md` → "Standar Desain Menu Button (Default Global)"):
 *   - Rounded rect, radius 18px, gradient vertikal 2-stop (`top` → `bottom`), lip bawah
 *     solid sebagai penanda "ketebalan/ketinggian" fisik, TANPA border stroke.
 *   - 3 state interaksi: default (berdiri, lip 6px) → hover (turun 1px, lip 5px, brightness 1.06)
 *     → pressed (turun 5px, lip 1px, brightness 0.97) — simulasi tombol fisik ditekan.
 *   - Icon SVG custom per-tomboL, shading via 2 gradient global (`url(#menuIconGrad)` linear
 *     utk permukaan datar, `url(#menuSphereGrad)` radial utk objek bulat). Defs dideklarasi
 *     SEKALI di App.jsx (bukan di sini) supaya tidak ada SVG id collision.
 *
 * Props:
 *   - icon: React node (SVG JSX icon, biasanya pakai url(#menuIconGrad)/url(#menuSphereGrad))
 *   - label: string (judul tombol)
 *   - subtitle: string (BARU — teks kecil di bawah label, opsional)
 *   - onClick: function (WAJIB dipertahankan, jangan diubah saat rewrite)
 *   - top: string (warna CSS/HSL — bagian atas gradient)
 *   - bottom: string (warna CSS/HSL — bagian bawah gradient)
 *   - lip: string (warna CSS/HSL — bibir bawah, lebih gelap dari `bottom`)
 *   - locked: boolean (default false) — guest-lock state, behavior TIDAK BOLEH regresi
 */
export default function MenuButton3D({ icon, label, subtitle, onClick, top, bottom, lip, locked = false }) {
    const [pressed, setPressed] = useState(false);
    const [hovered, setHovered] = useState(false);
    const interactive = !locked;

    // 3 state: default (berdiri) → hover (turun dikit) → pressed (tenggelam ke lip)
    const lipH = pressed ? 1 : (hovered && interactive ? 5 : 6);
    const translateY = pressed ? 5 : (hovered && interactive ? 1 : 0);
    const ambientBlur = pressed ? 6 : (hovered && interactive ? 24 : 20);
    const ambientOpacity = pressed ? 0.35 : (hovered && interactive ? 0.42 : 0.4);

    const shadow = interactive
        ? [
              `0 ${lipH}px 0 ${lip}`,
              `0 ${pressed ? 3 : 12}px ${ambientBlur}px rgba(0,0,0,${ambientOpacity})`,
              `0 3px 6px rgba(0,0,0,0.25)`,
          ].join(', ')
        : 'none';

    const bgUnlocked = `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`;
    const bgLocked = '#1a1f2e';

    return (
        <button
            onClick={onClick}
            onMouseDown={() => interactive && setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); setPressed(false); }}
            style={{
                width: '100%',
                padding: '16px 20px 20px 20px',
                borderRadius: 18,
                cursor: 'pointer',
                background: locked ? bgLocked : bgUnlocked,
                border: locked ? '2px solid #3f1d1d' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                boxShadow: locked ? 'none' : shadow,
                transform: `translateY(${locked ? 0 : translateY}px)`,
                transition: 'transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease',
                filter: interactive ? `brightness(${pressed ? 0.97 : (hovered ? 1.06 : 1)})` : 'none',
                opacity: locked ? 0.55 : 1,
                outline: 'none',
                fontFamily: 'inherit',
                overflow: 'hidden',
            }}
        >
            <div style={{
                width: 56, height: 56,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                filter: locked ? 'none' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                flexShrink: 0,
            }}>
                {icon}
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: 16,
                    letterSpacing: 0.2,
                    color: locked ? '#ef4444' : '#fff',
                    textShadow: locked ? 'none' : '0 1px 2px rgba(0,0,0,0.35)',
                }}>
                    {label}
                </div>
                {subtitle && (
                    <div style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 11,
                        color: locked ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.85)',
                        textShadow: locked ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
                        marginTop: 2,
                        letterSpacing: 0.2,
                    }}>
                        {subtitle}
                    </div>
                )}
            </div>
            {locked && (
                <span style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600,
                    color: '#ef4444', letterSpacing: 0.5, opacity: 0.85, flexShrink: 0,
                }}>
                    LOGIN REQUIRED
                </span>
            )}
        </button>
    );
}
