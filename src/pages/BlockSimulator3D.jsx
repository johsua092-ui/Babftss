import { ArrowLeft, Box } from 'lucide-react';

export default function BlockSimulator3D({ setPage }) {
    return (
        <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        backgroundColor: 'rgba(244,114,182,0.18)',
                        padding: 12,
                        borderRadius: 12,
                        color: '#f472b6',
                    }}>
                        <Box size={32} />
                    </div>
                    <h1 style={{
                        fontFamily: 'Orbitron,sans-serif',
                        fontWeight: 900,
                        fontSize: 'clamp(1.6rem,6vw,2.2rem)',
                        background: 'linear-gradient(180deg,#fbcfe8 0%,#ec4899 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.01em',
                        margin: 0,
                    }}>3D BLOCK SIMULATOR</h1>
                </div>

                <p style={{
                    fontFamily: 'Inter,sans-serif',
                    fontSize: 14,
                    color: '#94a3b8',
                    lineHeight: 1.6,
                    margin: 0,
                    maxWidth: 420,
                }}>
                    Workspace simulasi blok 3D interaktif. Susun, rotasi, dan eksplorasi struktur tiga dimensi.
                </p>

                <div style={{
                    width: '100%',
                    maxWidth: 400,
                    minHeight: 240,
                    padding: '24px 20px',
                    borderRadius: 14,
                    backgroundColor: '#0e1420',
                    border: '1px solid #1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#475569',
                    fontFamily: 'Inter,sans-serif',
                    fontSize: 13,
                }}>
                    Workspace simulator 3D
                </div>

                <button
                    onClick={() => setPage('shapes')}
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
