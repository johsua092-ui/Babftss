import { useState } from 'react';

/**
 * MenuButton3D — Tombol menu utama dengan efek 3D "slab".
 *
 * Struktur visual (3 layer, sesuai gambar referensi user):
 *
 *   ┌──────────────────────────────────────────────┐ ← outer button = dark slab
 *   │ ┌──────────────────────────────────────────┐ │
 *   │ │           BRIGHT FACE (accent)           │ │ ← face inner div
 *   │ │                                          │ │
 *   │ │  ─── bottom gloss line (white 2-3px) ─── │ │ ← pantulan cahaya
 *   │ └──────────────────────────────────────────┘ │
 *   │                                              │ ← dark slab bottom lip (visible di bawah)
 *   └──────────────────────────────────────────────┘
 *
 * Layering:
 *   - Outer <button> = bg dark slab color + border dark
 *   - Inner div (face) = bg accent color SOLID (flat, no gradient putih/hitam)
 *   - Bottom gloss: ::after pseudo-element di face, gradient putih 0.6→transparent
 *   - Inner bevel: box-shadow inset 1px putih 0.6 di face
 *
 * Warna:
 *   - accent   = warna bright face (SOLID, flat — sesuai gambar referensi)
 *   - dark     = warna slab bawah + border (sama warna, sesuai gambar referensi)
 *
 * Interaksi:
 *   - Hover (unlocked): tombol sedikit naik (translateY -2px), slab makin tinggi
 *   - Pressed: tombol turun (translateY +4px), slab makin tipis → simulasi physical press
 *   - Locked (guest): tombol redup, bg abu-abu gelap, border merah,
 *     icon & label merah, badge "LOGIN REQUIRED" muncul di kanan
 *
 * Props:
 *   - icon: React node (lucide-react icon / custom icon component)
 *   - label: string (judul tombol)
 *   - onClick: function
 *   - accent: hex string (warna bright face)
 *   - dark: hex string (warna slab bawah + border)
 *   - locked: boolean (default false) — guest-lock state
 */
export default function MenuButton3D({
    icon,
    label,
    onClick,
    accent,
    dark,
    locked = false,
}) {
    const [pressed, setPressed] = useState(false);
    const [hovered, setHovered] = useState(false);

    const interactive = !locked;

    // Slab height = tebal "lip" bawah yang visible.
    // Default 6px, hover 8px (makin terangkat), pressed 2px (makin tipis = ketekan).
    // Catatan: ini BUKAN box-shadow offset lagi — ini padding-bottom di outer button
    // supaya slab bawah benar-benar render sebagai area solid (bukan shadow).
    const slabH = pressed ? 2 : (hovered && interactive ? 8 : 6);
    const ambientOffset = pressed ? 2 : (hovered && interactive ? 10 : 8);
    const ambientBlur = pressed ? 4 : (hovered && interactive ? 18 : 14);

    const outerShadow = interactive
        ? `0 ${ambientOffset}px ${ambientBlur}px rgba(0,0,0,0.5)`
        : 'none';

    const transform = pressed
        ? 'translateY(4px)'
        : (hovered && interactive ? 'translateY(-2px)' : 'translateY(0)');

    // ===== Locked state styling =====
    const lockedOuterBg = '#1a1f2e';
    const lockedBorder = '#3f1d1d';

    // ===== Outer button styling (slab + border) =====
    const outerBg = locked ? lockedOuterBg : dark;
    const outerBorder = locked ? lockedBorder : dark;

    // ===== Face (inner div) styling =====
    // Flat solid color, NO gradient putih/hitam — sesuai referensi gambar user.
    // Inner bevel highlight: inset 1px putih 0.6 di perimeter (top + sides).
    // Bottom gloss: ::after pseudo via inline style tidak bisa — pakai nested div gloss-line.
    const faceBg = locked ? '#1a1f2e' : accent;
    const faceShadow = locked
        ? 'none'
        : [
              'inset 0 1px 0 rgba(255,255,255,0.6)',  // top inner highlight (bevel)
              'inset 1px 0 0 rgba(255,255,255,0.35)',   // left inner highlight
              'inset -1px 0 0 rgba(255,255,255,0.35)', // right inner highlight
          ].join(', ');

    return (
        <button
            onClick={onClick}
            onMouseDown={() => interactive && setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); setPressed(false); }}
            style={{
                width: '100%',
                // padding: top 16, bottom = slabH (slab bottom lip area) + face padding
                padding: `16px 20px ${slabH + 16}px 20px`,
                borderRadius: 18,
                cursor: 'pointer',
                backgroundColor: outerBg,
                border: `3px solid ${outerBorder}`,
                display: 'block',
                color: '#fff',
                boxShadow: outerShadow,
                transform,
                transition: 'transform 0.1s ease, box-shadow 0.1s ease, padding 0.1s ease',
                opacity: locked ? 0.55 : 1,
                outline: 'none',
                fontFamily: 'inherit',
                position: 'relative',
                // overflow hidden supaya border-radius konsisten antara outer + face
                overflow: 'hidden',
            }}
        >
            {/* === Face layer (bright accent, flat solid color) === */}
            <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '4px 4px 4px 4px',
                backgroundColor: faceBg,
                borderRadius: 12,
                boxShadow: faceShadow,
            }}>
                {/* Bottom gloss line — putih 2-3px gradient di bottom edge face */}
                {!locked && (
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 3,
                        borderRadius: '0 0 12px 12px',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 100%)',
                        pointerEvents: 'none',
                    }} />
                )}

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
            </div>

            {/* Slab bottom reflection (optional subtle streak) — pantulan cahaya di dark slab */}
            {!locked && (
                <div style={{
                    position: 'absolute',
                    left: '30%',
                    right: '30%',
                    bottom: Math.max(1, slabH - 4),
                    height: 1,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: 1,
                    pointerEvents: 'none',
                }} />
            )}
        </button>
    );
}
