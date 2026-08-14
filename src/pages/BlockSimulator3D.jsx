import { ArrowLeft } from 'lucide-react';

const INK = '#0A0A0A';
const BG = '#F5F2EB';
const MUTED = '#6B7280';
const BLUE = '#1D3557';

const MONO = "'JetBrains Mono','IBM Plex Mono','SF Mono',Consolas,monospace";
const SANS = "Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";

export default function BlockSimulator3D({ setPage }) {
    return (
        <div style={{ minHeight: '100dvh', backgroundColor: BG, color: INK, padding: '40px 24px 64px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 720 }}>

                {/* Breadcrumb */}
                <button
                    onClick={() => setPage('shapes')}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: 0,
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: MONO,
                        fontSize: 11,
                        color: MUTED,
                        letterSpacing: '0.18em',
                        marginBottom: 20,
                    }}
                >
                    <ArrowLeft size={12} /> TOOLS / SHAPES / 02
                </button>

                {/* Header */}
                <div style={{ borderBottom: `2px solid ${INK}`, paddingBottom: 24, marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                    <h1 style={{
                        fontFamily: SANS,
                        fontWeight: 900,
                        fontSize: 'clamp(2.2rem, 8vw, 3.8rem)',
                        margin: 0,
                        lineHeight: 0.9,
                        letterSpacing: '-0.035em',
                    }}>
                        3D Block<br/>Simulator.
                    </h1>
                    <svg width="56" height="56" viewBox="0 0 100 100" aria-hidden="true" style={{ flexShrink: 0 }}>
                        <polygon points="50,6 90,28 50,50 10,28" fill={BLUE} />
                        <polygon points="10,28 50,50 50,94 10,72" fill={BLUE} opacity="0.72" />
                        <polygon points="90,28 50,50 50,94 90,72" fill={BLUE} opacity="0.5" />
                    </svg>
                </div>

                {/* Description */}
                <p style={{
                    fontFamily: SANS,
                    fontSize: 15,
                    color: MUTED,
                    lineHeight: 1.6,
                    margin: '0 0 40px',
                    maxWidth: 520,
                }}>
                    Stack and rotate blocks in three dimensions to understand spatial structure. Build, transform, and inspect geometry from any angle.
                </p>

                {/* Workspace placeholder */}
                <div style={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    border: `1px solid ${INK}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: MONO,
                    fontSize: 12,
                    color: MUTED,
                    letterSpacing: '0.18em',
                }}>
                    WORKSPACE
                </div>

                {/* Footer index */}
                <div style={{
                    marginTop: 20,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: MONO,
                    fontSize: 11,
                    color: MUTED,
                    letterSpacing: '0.18em',
                }}>
                    <span>02 / 02</span>
                    <span>3D BLOCK SIMULATOR</span>
                </div>
            </div>
        </div>
    );
}
