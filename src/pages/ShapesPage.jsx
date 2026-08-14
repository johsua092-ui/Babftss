import { ArrowLeft, ArrowRight } from 'lucide-react';

const INK = '#0A0A0A';
const BG = '#F5F2EB';
const MUTED = '#6B7280';
const RED = '#E63946';
const BLUE = '#1D3557';

const MONO = "'JetBrains Mono','IBM Plex Mono','SF Mono',Consolas,monospace";
const SANS = "Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";

const TOOLS = [
    {
        id: 'shapes-calculator',
        index: '01',
        name: 'Shapes Calculator',
        desc: 'Compute area, perimeter, and volume for triangles, squares, cubes, spheres, and more.',
        accent: RED,
        shape: 'triangle',
    },
    {
        id: 'block-simulator-3d',
        index: '02',
        name: '3D Block Simulator',
        desc: 'Stack and rotate blocks in three dimensions to understand spatial structure.',
        accent: BLUE,
        shape: 'cube',
    },
];

function GeometricShape({ shape, color, size = 72 }) {
    if (shape === 'triangle') {
        return (
            <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
                <polygon points="50,12 88,86 12,86" fill={color} />
            </svg>
        );
    }
    if (shape === 'cube') {
        return (
            <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
                <polygon points="50,6 90,28 50,50 10,28" fill={color} />
                <polygon points="10,28 50,50 50,94 10,72" fill={color} opacity="0.72" />
                <polygon points="90,28 50,50 50,94 90,72" fill={color} opacity="0.5" />
            </svg>
        );
    }
    return null;
}

export default function ShapesPage({ setPage }) {
    return (
        <div style={{ minHeight: '100dvh', backgroundColor: BG, color: INK, padding: '40px 24px 64px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 720 }}>

                {/* Header */}
                <div style={{ borderBottom: `2px solid ${INK}`, paddingBottom: 20, marginBottom: 8 }}>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.18em', marginBottom: 16 }}>
                        TOOLS / SHAPES
                    </div>
                    <h1 style={{
                        fontFamily: SANS,
                        fontWeight: 900,
                        fontSize: 'clamp(3rem, 11vw, 5.5rem)',
                        margin: 0,
                        lineHeight: 0.9,
                        letterSpacing: '-0.045em',
                    }}>
                        Shapes.
                    </h1>
                    <p style={{
                        fontFamily: SANS,
                        fontSize: 14,
                        color: MUTED,
                        margin: '14px 0 0',
                        maxWidth: 460,
                        lineHeight: 1.5,
                    }}>
                        Geometric tools for spatial reasoning. Pick one to start.
                    </p>
                </div>

                {/* Tool list */}
                <div>
                    {TOOLS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setPage(t.id)}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '48px 1fr auto 20px',
                                alignItems: 'center',
                                gap: 24,
                                width: '100%',
                                padding: '32px 0',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderBottom: `1px solid ${INK}`,
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontFamily: 'inherit',
                                color: INK,
                                transition: 'background-color 0.15s ease',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(10,10,10,0.035)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            <div style={{ fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: '0.12em' }}>
                                {t.index}
                            </div>

                            <div>
                                <div style={{
                                    fontFamily: SANS,
                                    fontWeight: 800,
                                    fontSize: 'clamp(1.4rem, 4.5vw, 2.1rem)',
                                    letterSpacing: '-0.025em',
                                    color: INK,
                                    marginBottom: 8,
                                    lineHeight: 1.05,
                                }}>
                                    {t.name}
                                </div>
                                <div style={{
                                    fontFamily: SANS,
                                    fontSize: 13,
                                    color: MUTED,
                                    lineHeight: 1.55,
                                    maxWidth: 380,
                                }}>
                                    {t.desc}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <GeometricShape shape={t.shape} color={t.accent} size={64} />
                            </div>

                            <ArrowRight size={18} color={INK} strokeWidth={1.5} />
                        </button>
                    ))}
                </div>

                {/* Back */}
                <div style={{ marginTop: 48 }}>
                    <button
                        onClick={() => setPage('menu')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '0 0 4px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderBottom: `1px solid ${INK}`,
                            cursor: 'pointer',
                            fontFamily: SANS,
                            fontWeight: 500,
                            fontSize: 13,
                            color: INK,
                            transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.55'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                        <ArrowLeft size={14} /> Back to menu
                    </button>
                </div>
            </div>
        </div>
    );
}
