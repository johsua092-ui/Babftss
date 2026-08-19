import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ShoppingCart, Search, Star, Plus, Filter, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import CartPanel from '../components/CartPanel';

const CATEGORIES = ['Semua', 'Logic Gates', 'Canvas', 'Gears', 'Linkages', 'Tools'];

export default function MarketplacePage({ setPage }) {
    const { user, getIdToken } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const [cartOpen, setCartOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [search, setSearch] = useState('');
    const [adding, setAdding] = useState(null);

    const apiCall = useCallback(async (action, method = 'GET', body = null) => {
        const token = await getIdToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (body) headers['Content-Type'] = 'application/json';
        let url = `/api/ai-chat?action=mp_${action}`;
        const res = await fetch(url, {
            method, headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
    }, [getIdToken]);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        const { ok, data } = await apiCall('products');
        if (ok && Array.isArray(data.products)) {
            setProducts(data.products);
        } else {
            toast.error('Gagal memuat produk');
        }
        setLoading(false);
    }, [apiCall]);

    const loadCartCount = useCallback(async () => {
        const { ok, data } = await apiCall('count');
        if (ok && typeof data.count === 'number') {
            setCartCount(data.count);
        }
    }, [apiCall]);

    useEffect(() => {
        loadProducts();
        loadCartCount();
    }, [loadProducts, loadCartCount]);

    const filtered = products.filter(p => {
        if (activeCategory !== 'Semua' && p.category !== activeCategory) return false;
        if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    async function addToCart(product) {
        setAdding(product.id);
        try {
            const { ok, data } = await apiCall('add', 'POST', {
                productId: product.id,
                quantity: 1,
            });
            if (ok) {
                toast.success(`"${product.name}" ditambahkan ke keranjang`, {
                    icon: <ShoppingCart size={16} color="#fb7185" />,
                });
                await loadCartCount();
            } else {
                toast.error(data.error || 'Gagal menambah ke keranjang');
            }
        } catch (e) {
            toast.error('Gagal menghubungi server');
        }
        setAdding(null);
    }

    return (
        <div style={{ width: '100%', maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* ===== Header ===== */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => setPage('menu')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                            backgroundColor: '#0e1420', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer',
                            fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
                        }}
                        onMouseEnter={c => { c.currentTarget.style.color = '#e2e8f0'; c.currentTarget.style.borderColor = '#475569'; }}
                        onMouseLeave={c => { c.currentTarget.style.color = '#94a3b8'; c.currentTarget.style.borderColor = '#334155'; }}
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div>
                        <h1 style={{
                            fontFamily: 'Orbitron,sans-serif', fontWeight: 900,
                            fontSize: 'clamp(1.6rem,5vw,2.2rem)', margin: 0,
                            background: 'linear-gradient(180deg,#fb7185 0%,#e11d48 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.01em', lineHeight: 1.1,
                        }}>MARKETPLACE</h1>
                        <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
                            Belanja modul, komponen, dan blueprint untuk pembelajaran BABFT kamu.
                        </p>
                    </div>
                </div>

                {/* ===== Cart Button ===== */}
                <button
                    onClick={() => setCartOpen(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12,
                        backgroundColor: '#0e1420', border: '1px solid rgba(251,113,133,0.4)',
                        color: '#fb7185', cursor: 'pointer',
                        fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: 1,
                        boxShadow: '0 0 18px rgba(251,113,133,0.18)', transition: 'all 0.2s',
                        position: 'relative',
                    }}
                    onMouseEnter={c => { c.currentTarget.style.transform = 'scale(1.03)'; }}
                    onMouseLeave={c => { c.currentTarget.style.transform = 'scale(1)'; }}
                >
                    <ShoppingCart size={16} />
                    <span>Keranjang</span>
                    {cartCount > 0 && (
                        <span style={{
                            position: 'absolute', top: -6, right: -6,
                            minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9,
                            backgroundColor: '#fb7185', color: '#1c0608',
                            fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 800,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid #181b24',
                        }}>{cartCount}</span>
                    )}
                </button>
            </div>

            {/* ===== Search + Category Tabs ===== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                    display: 'flex', gap: 10, alignItems: 'center',
                    backgroundColor: '#0e1420', border: '1px solid #1e293b',
                    borderRadius: 12, padding: '10px 14px',
                }}>
                    <Search size={16} color="#64748b" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cari barang..."
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            color: '#e2e8f0', fontFamily: 'Inter,sans-serif', fontSize: 13,
                        }}
                    />
                    <Filter size={16} color="#64748b" />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {CATEGORIES.map(cat => {
                        const active = activeCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
                                    fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600,
                                    backgroundColor: active ? 'rgba(251,113,133,0.15)' : '#0e1420',
                                    border: active ? '1px solid rgba(251,113,133,0.5)' : '1px solid #1e293b',
                                    color: active ? '#fb7185' : '#94a3b8',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={c => { if (!active) { c.currentTarget.style.color = '#e2e8f0'; c.currentTarget.style.borderColor = '#475569'; } }}
                                onMouseLeave={c => { if (!active) { c.currentTarget.style.color = '#94a3b8'; c.currentTarget.style.borderColor = '#1e293b'; } }}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ===== Product Grid ===== */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#fb7185' }} />
                    <div style={{ fontSize: 13, marginTop: 12 }}>Memuat produk...</div>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 16,
                }}>
                    {filtered.map(product => (
                        <div
                            key={product.id}
                            style={{
                                backgroundColor: '#0e1420', border: '1px solid #1e293b',
                                borderRadius: 14, overflow: 'hidden',
                                transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(251,113,133,0.35)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#1e293b'; }}
                        >
                            <div style={{
                                height: 120, background: product.gradient,
                                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <ShoppingCart size={32} color="rgba(255,255,255,0.35)" />
                                <span style={{
                                    position: 'absolute', top: 8, right: 8,
                                    padding: '2px 8px', borderRadius: 6,
                                    backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
                                    fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 600,
                                }}>{product.category}</span>
                            </div>
                            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                                <h3 style={{
                                    fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600,
                                    color: '#e2e8f0', margin: 0, lineHeight: 1.3,
                                }}>{product.name}</h3>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    fontSize: 11, color: '#64748b', fontFamily: 'Inter,sans-serif',
                                }}>
                                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>{product.rating}</span>
                                    <span>· {product.sales} terjual</span>
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginTop: 'auto', gap: 8,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{
                                            fontFamily: 'Orbitron,sans-serif', fontSize: 15, fontWeight: 800,
                                            color: '#fbbf24',
                                        }}>{product.price}</span>
                                        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#94a3b8' }}>coins</span>
                                    </div>
                                    <button
                                        onClick={() => addToCart(product)}
                                        disabled={adding === product.id}
                                        style={{
                                            backgroundColor: adding === product.id ? 'rgba(251,113,133,0.05)' : 'rgba(251,113,133,0.15)',
                                            border: '1px solid rgba(251,113,133,0.4)',
                                            borderRadius: 8, padding: '6px 10px', cursor: adding === product.id ? 'wait' : 'pointer',
                                            color: '#fb7185', display: 'flex', alignItems: 'center', gap: 4,
                                            fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600,
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => { if (adding !== product.id) { e.currentTarget.style.backgroundColor = 'rgba(251,113,133,0.28)'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(251,113,133,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                    >
                                        {adding === product.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={12} />}
                                        {adding === product.id ? '...' : 'Add'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
                <div style={{
                    textAlign: 'center', padding: '60px 20px', color: '#64748b',
                    fontFamily: 'Inter,sans-serif', fontSize: 13,
                }}>
                    Tidak ada barang yang cocok dengan pencarian kamu.
                </div>
            )}

            {/* ===== Cart Panel Modal ===== */}
            {cartOpen && (
                <CartPanel
                    onClose={() => {
                        setCartOpen(false);
                        loadCartCount();
                    }}
                    onCheckoutSuccess={() => loadCartCount()}
                />
            )}
        </div>
    );
}
