import { ArrowLeft, Calculator, Box } from 'lucide-react';

const TOOLS = [
    {
        id: 'shapes-calculator',
        name: 'Shapes Calculator',
        icon: Calculator,
        color: '#2dd4bf',
        bg: 'rgba(45,212,191,0.18)',
        glow: 'rgba(45,212,191,0.25)',
        border: 'rgba(45,212,191,0.38)',
    },
    {
        id: 'block-simulator-3d',
        name: '3D Block Simulator',
        icon: Box,
        color: '#f472b6',
        bg: 'rgba(244,114,182,0.18)',
        glow: 'rgba(244,114,182,0.22)',
        border: 'rgba(244,114,182,0.38)',
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

                <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {TOOLS.map((t, i) => {
                        const Icon = t.icon;
                        return (
                            <button
                                key={i}
                                onClick={() => setPage(t.id)}
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    borderRadius: 14,
                                    cursor: 'pointer',
                                    backgroundColor: panel,
                                    border: `1px solid ${t.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                    color: '#fff',
                                    boxShadow: `0 0 18px ${t.glow}`,
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={c => (c.currentTarget.style.transform = 'scale(1.02)')}
                                onMouseLeave={c => (c.currentTarget.style.transform = 'scale(1)')}
                            >
                                <div style={{
                                    backgroundColor: t.bg,
                                    padding: 10,
                                    borderRadius: 10,
                                    color: t.color,
                                    flexShrink: 0,
                                }}>
                                    <Icon size={22} />
                                </div>
                                <span style={{
                                    fontFamily: 'Orbitron,sans-serif',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    textAlign: 'left',
                                    color: t.color,
                                }}>
                                    {t.name}
                                </span>
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
