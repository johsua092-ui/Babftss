import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFavoritesContext } from '../context/FavoritesContext';

const API_BASE = '/api/favorites';

export default function HeartButton({ itemId: propItemId, itemType: propItemType, size = 20, onToggle }) {
    const { user, getIdToken } = useAuth();
    const ctx = useFavoritesContext();
    const [liked, setLiked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ── Auto-detect itemId & itemType ──────────────────
    // Priority: context > props > null
    const itemId = ctx?.itemId || propItemId || null;
    const itemType = ctx?.itemType || propItemType || 'gate';

    // ── Fetch initial state ─────────────────────────────
    useEffect(() => {
        if (!user || !itemId) return;
        let cancelled = false;

        async function checkLiked() {
            try {
                const token = await getIdToken();
                const res = await fetch(`${API_BASE}?type=${itemType}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled && data.favorites) {
                    const isFav = data.favorites.some(f => f.item_id === itemId);
                    setLiked(isFav);
                }
            } catch {
                // silent — offline or network error
            }
        }
        checkLiked();
        return () => { cancelled = true; };
    }, [user, itemId, itemType, getIdToken]);

    // ── Toggle handler ──────────────────────────────────
    const handleToggle = useCallback(async () => {
        // Guest check — user must be logged in
        if (!user) {
            setError('Login dulu ya buat simpen favorit!');
            setTimeout(() => setError(null), 3000);
            return;
        }
        if (!itemId) return;

        setLoading(true);
        setError(null);

        try {
            const token = await getIdToken();
            const newLiked = !liked;
            const method = newLiked ? 'POST' : 'DELETE';

            const res = await fetch(API_BASE, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ itemId, itemType }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${res.status}`);
            }

            setLiked(newLiked);
            if (onToggle) onToggle(newLiked, itemId, itemType);
        } catch (err) {
            setError(err.message || 'Gagal nyimpen favorit');
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    }, [user, liked, itemId, itemType, getIdToken, onToggle]);

    const c = liked ? '#ff6eb4' : '#ff6eb4';
    const glow = liked
        ? 'drop-shadow(0 0 6px rgba(255,110,180,0.8)) drop-shadow(0 0 12px rgba(255,110,180,0.4))'
        : 'none';
    const disabled = loading || !itemId;

    return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
                onClick={handleToggle}
                disabled={disabled}
                title={
                    !user
                        ? 'Login dulu buat simpen favorit!'
                        : liked
                        ? 'Hapus dari favorit'
                        : 'Simpan ke favorit'
                }
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                    flexShrink: 0,
                    transition: 'transform 0.2s',
                    opacity: disabled ? 0.5 : 1,
                }}
                onMouseEnter={e => {
                    if (!disabled) e.currentTarget.style.transform = 'scale(1.15)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    style={{
                        display: 'block',
                        filter: glow,
                        transition: 'filter 0.3s',
                    }}
                >
                    {liked ? (
                        <path
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            fill={c}
                        />
                    ) : (
                        <path
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            fill="none"
                            stroke={c}
                            strokeWidth="2"
                            strokeLinejoin="round"
                        />
                    )}
                </svg>
            </button>
            {error && (
                <span
                    style={{
                        position: 'absolute',
                        bottom: -24,
                        fontSize: 10,
                        color: '#f87171',
                        whiteSpace: 'nowrap',
                        fontWeight: 500,
                    }}
                >
                    {error}
                </span>
            )}
        </div>
    );
}
