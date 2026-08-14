import { ArrowLeft, Triangle, Box, Circle } from 'lucide-react';

const SHAPES = [
    {
        name: 'Triangle',
        indo: 'Segitiga',
        desc: 'Bentuk 2D dengan 3 sisi. Jenis: sama sisi, sama kaki, siku-siku, dan sembarang.',
        icon: Triangle,
        color: '#2dd4bf',
        bg: 'rgba(45,212,191,0.18)',
        glow: 'rgba(45,212,191,0.25)',
    },
    {
        name: 'Cube',
        indo: 'Kubus',
        desc: 'Bentuk 3D dengan 6 sisi persegi yang sama. Memiliki 8 titik sudut dan 12 rusuk.',
        icon: Box,
        color: '#f472b6',
        bg: 'rgba(244,114,182,0.18)',
        glow: 'rgba(244,114,182,0.22)',
    },
    {
        name: 'Ball',
        indo: 'Bola (Sphere)',
        desc: 'Bentuk 3D berupa bola. Setiap titik di permukaan memiliki jarak sama ke pusat.',
        icon: Circle,
        color: '#fbbf24',
        bg: 'rgba(251,191,36,0.18)',
        glow: 'rgba(251,191,36,0.22)',
    },
];

export default function ShapesPage({ setPage }) {
    const panel = '#0e1420';

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

                <p style={{
                    fontFamily: 'Inter,sans-serif',
                    fontSize: 14,
                    color: '#94a3b8',
                    lineHeight: 1.6,
                    margin: 0,
                    maxWidth: 420,
                }}>
                    Pelajari bentuk geometris dasar: segitiga, kubus, dan bola. Sentuh kartu untuk eksplorasi lebih lanjut.
                </p>

                <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {SHAPES.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <button
                                key={i}
                                onClick={() => { /* placeholder for future detail view */ }}
                                style={{
                                    width: '100%',
                                    padding: '18px 20px',
                                    borderRadius: 14,
                                    cursor: 'pointer',
                                    backgroundColor: panel,
                                    border: `1px solid ${s.bg}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    color: '#fff',
                                    boxShadow: `0 0 18px ${s.glow}`,
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={c => (c.currentTarget.style.transform = 'translateY(-2px)')}
                                onMouseLeave={c => (c.currentTarget.style.transform = 'translateY(0)')}
                            >
                                <div style={{
                                    backgroundColor: s.bg,
                                    padding: 12,
                                    borderRadius: 12,
                                    color: s.color,
                                    flexShrink: 0,
                                }}>
                                    <Icon size={28} />
                                </div>
                                <div style={{ textAlign: 'left', flex: 1 }}>
                                    <div style={{
                                        fontFamily: 'Orbitron,sans-serif',
                                        fontWeight: 700,
                                        fontSize: 14,
                                        color: s.color,
                                        marginBottom: 4,
                                    }}>
                                        {s.name}
                                        <span style={{ fontFamily: 'Inter,sans-serif', fontWeight: 500, fontSize: 11, color: '#64748b', marginLeft: 8 }}>
                                            {s.indo}
                                        </span>
                                    </div>
                                    <div style={{
                                        fontFamily: 'Inter,sans-serif',
                                        fontSize: 12,
                                        color: '#94a3b8',
                                        lineHeight: 1.5,
                                    }}>
                                        {s.desc}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
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
