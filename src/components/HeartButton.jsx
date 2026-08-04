import { useState } from 'react';

export default function HeartButton() {
    const [liked, setLiked] = useState(false);
    const c = liked ? '#ff6eb4' : '#ff6eb4';
    const glow = liked ? 'drop-shadow(0 0 6px rgba(255,110,180,0.8)) drop-shadow(0 0 12px rgba(255,110,180,0.4))' : 'none';
    return (
        <button
            onClick={() => setLiked(v => !v)}
            style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 6, flexShrink: 0, transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" style={{ display: 'block', filter: glow, transition: 'filter 0.3s' }}>
                {liked ? (
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={c} />
                ) : (
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" />
                )}
            </svg>
        </button>
    );
}
