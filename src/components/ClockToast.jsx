import { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// ClockToast — notifikasi fixed di top-center viewport.
// Dipakai bersama hook useClockMode untuk menampilkan pesan:
//   - 'block'      → "matikan clock dahulu sebelum beralih mode clock" (amber)
//   - 'rate-limit' → "warning! pencegahan rate limit mohon tunggu 5 detik" (red)
//
// Posisi: fixed, top: 20px, center horizontal. Z-index tinggi supaya di atas
// semua elemen lain. Auto-dismiss diatur oleh hook (TOAST_DURATION_MS=3000).
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_BY_TYPE = {
    'block': {
        bg: 'rgba(250,204,21,0.95)',
        border: 'rgba(250,204,21,1)',
        text: '#1a1a1a',
        shadow: '0 8px 24px rgba(250,204,21,0.4), 0 0 60px rgba(250,204,21,0.15)',
        icon: '⚠',
    },
    'rate-limit': {
        bg: 'rgba(239,68,68,0.95)',
        border: 'rgba(239,68,68,1)',
        text: '#ffffff',
        shadow: '0 8px 24px rgba(239,68,68,0.4), 0 0 60px rgba(239,68,68,0.15)',
        icon: '⛔',
    },
};

export default function ClockToast({ toast }) {
    // Animasi entry/exit: render null jika tidak ada toast
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (toast) {
            // Mount + trigger entry animation on next frame
            setVisible(false);
            const raf = requestAnimationFrame(() => setVisible(true));
            return () => cancelAnimationFrame(raf);
        } else {
            setVisible(false);
        }
    }, [toast]);

    if (!toast) return null;

    const s = STYLE_BY_TYPE[toast.type] || STYLE_BY_TYPE['block'];

    return (
        <div
            style={{
                position: 'fixed',
                top: 20,
                left: '50%',
                transform: `translateX(-50%) translateY(${visible ? 0 : -20}px)`,
                zIndex: 9999,
                backgroundColor: s.bg,
                border: `2px solid ${s.border}`,
                borderRadius: 12,
                padding: '12px 20px',
                boxShadow: s.shadow,
                color: s.text,
                fontFamily: 'Inter,sans-serif',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                maxWidth: '90vw',
                textAlign: 'center',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                pointerEvents: 'none',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
            }}
        >
            <span style={{ fontSize: 16, fontWeight: 900 }}>{s.icon}</span>
            <span>{toast.text}</span>
        </div>
    );
}
