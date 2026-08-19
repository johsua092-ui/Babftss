import { useState } from 'react';

/**
 * MenuButton3D — Tombol menu utama dengan efek 3D "slab".
 *
 * Style referensi: gambar yang user kirim (tombol 3D tebal dengan bottom
 * "lip" warna gelap, bright face warna accent, thick dark border, inner
 * bevel highlight putih di atas, glossy/plastic feel).
 *
 * Setiap tombol punya 3 warna turunan dari accent:
 *   - accent   : warna bright utama (face)
 *   - dark     : warna medium-dark (slab/lip bawah + inner bottom shadow)
 *   - deepest  : warna paling gelap (border)
 *
 * Interaksi:
 *   - Hover (unlocked): tombol sedikit naik (translateY -2px), slab shadow makin tinggi
 *   - Pressed: tombol turun (translateY +4px), slab shadow makin tipis → simulasi physical press
 *   - Locked (guest): tombol redup (opacity 0.55), bg abu-abu gelap, border merah,
 *     icon & label merah, badge "LOGIN REQUIRED" muncul di kanan
 *
 * Props:
 *   - icon: React node (lucide-react icon / custom icon component)
 *   - label: string (judul tombol)
 *   - onClick: function
 *   - accent: hex string (warna bright face)
 *   - dark: hex string (warna medium-dark untuk slab)
 *   - deepest: hex string (warna paling gelap untuk border)
 *   - locked: boolean (default false) — guest-lock state
 */
export default function MenuButton3D({
    icon,
    label,
    onClick,
    accent,
    dark,
    deepest,
    locked = false,
}) {
    const [pressed, setPressed] = useState(false);
    const [hovered, setHovered] = useState(false);

    const interactive = !locked;

    // Slab shadow height: pressed = tipis, hover = tinggi, default = sedang
    const slabH = pressed ? 2 : (hovered && interactive ? 8 : 6);
    const ambientOffset = pressed ? 2 : (hovered && interactive ? 10 : 8);
    const ambientBlur = pressed ? 4 : (hovered && interactive ? 18 : 14);

    const shadow = interactive
        ? [
              `0 ${slabH}px 0 ${dark}`,                              // bottom "lip" — efek 3D extrusion
              `0 ${ambientOffset}px ${ambientBlur}px rgba(0,0,0,0.45)`, // ambient drop shadow
              `inset 0 2px 0 rgba(255,255,255,0.4)`,                 // top inner highlight (glossy)
              `inset 0 -2px 0 ${dark}`,                              // bottom inner shadow (depth)
          ].join(', ')
        : 'none';

    const transform = pressed
        ? 'translateY(4px)'
        : (hovered && interactive ? 'translateY(-2px)' : 'translateY(0)');

    return (
        <button
            onClick={onClick}
            onMouseDown={() => interactive && setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); setPressed(false); }}
            style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: 18,
                cursor: 'pointer',
                // Locked: bg abu-abu gelap + border merah. Unlocked: bg accent + border deepest
                backgroundColor: locked ? '#1a1f2e' : accent,
                border: `3px solid ${locked ? '#3f1d1d' : deepest}`,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                color: '#fff',
                boxShadow: shadow,
                transform,
                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                opacity: locked ? 0.55 : 1,
                // Pastikan button tidak punya default browser styling
                outline: 'none',
                fontFamily: 'inherit',
            }}
        >
            {/* Icon container */}
            <div style={{
                backgroundColor: locked ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.22)',
                padding: 10,
                borderRadius: 10,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                {icon}
            </div>
            {/* Label */}
            <span style={{
                fontFamily: 'Orbitron,sans-serif',
                fontWeight: 700,
                fontSize: 14,
                textAlign: 'left',
                color: locked ? '#ef4444' : '#fff',
                textShadow: locked ? 'none' : '0 1px 2px rgba(0,0,0,0.45)',
                flex: 1,
                letterSpacing: 0.3,
            }}>
                {label}
            </span>
            {/* LOGIN REQUIRED badge (auto-render saat locked) */}
            {locked && (
                <span style={{
                    fontFamily: 'Inter,sans-serif',
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#ef4444',
                    letterSpacing: 0.5,
                    opacity: 0.85,
                    flexShrink: 0,
                }}>
                    LOGIN REQUIRED
                </span>
            )}
        </button>
    );
}
