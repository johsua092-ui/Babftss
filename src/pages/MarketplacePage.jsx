import { useState } from 'react';
import { ArrowLeft, ShoppingCart, Search, Star, Plus, Filter } from 'lucide-react';
import { toast } from 'sonner';

/**
 * MarketplacePage (DUMMY)
 * ----------------------
 * Halaman ini masih berupa placeholder — semua produk, harga, kategori, dan
 * interaksi "Add to Cart" bersifat dummy dan akan diganti dengan integrasi
 * backend sungguhan di tahap selanjutnya.
 *
 * Aturan mutlak yang SUDAH ditegakkan di App.jsx (di menu tombol):
 *   - Hanya user yang sudah login yang bisa masuk ke halaman ini.
 *   - Guest yang mengklik tombol "Marketplace" di menu akan ditolak dengan
 *     banner: "Harap sign in dahulu sebelum menggunakan fitur ini".
 *
 * Style mengikuti design system proyek (bg #181b24, panel #0e1420, border
 * #1e293b, font Orbitron heading + Inter body, accent rose #fb7185).
 */

const DUMMY_PRODUCTS = [
    { id: 1, name: 'Logic Gate Pack: Basic 7', category: 'Logic Gates', price: 250, rating: 4.8, sales: 1240, gradient: 'linear-gradient(135deg,#3b82f6,#1e3a8a)' },
    { id: 2, name: 'Gear Set: Spur 32-pack', category: 'Gears', price: 180, rating: 4.6, sales: 890, gradient: 'linear-gradient(135deg,#fb923c,#7c2d12)' },
    { id: 3, name: 'Linkage Blueprint: 4-Bar', category: 'Linkages', price: 120, rating: 4.7, sales: 640, gradient: 'linear-gradient(135deg,#818cf8,#312e81)' },
    { id: 4, name: 'Canvas Template: Circuit Board', category: 'Canvas', price: 320, rating: 4.9, sales: 2150, gradient: 'linear-gradient(135deg,#a78bfa,#4c1d95)' },
    { id: 5, name: 'Half Adder Module', category: 'Logic Gates', price: 200, rating: 4.5, sales: 480, gradient: 'linear-gradient(135deg,#06b6d4,#0e7490)' },
    { id: 6, name: 'Full Adder IC Block', category: 'Logic Gates', price: 450, rating: 4.9, sales: 1820, gradient: 'linear-gradient(135deg,#10b981,#064e3b)' },
    { id: 7, name: 'Multiplexer 4:1 Schematic', category: 'Logic Gates', price: 280, rating: 4.7, sales: 720, gradient: 'linear-gradient(135deg,#f59e0b,#78350f)' },
    { id: 8, name: 'SR Latch Starter Kit', category: 'Logic Gates', price: 350, rating: 4.8, sales: 990, gradient: 'linear-gradient(135deg,#ef4444,#7f1d1d)' },
    { id: 9, name: 'Gated D Latch Module', category: 'Logic Gates', price: 380, rating: 4.6, sales: 540, gradient: 'linear-gradient(135deg,#ec4899,#831843)' },
    { id: 10, name: 'Clock Pulse Generator', category: 'Tools', price: 220, rating: 4.7, sales: 1100, gradient: 'linear-gradient(135deg,#84cc16,#365314)' },
    { id: 11, name: 'Logic Probe Tool', category: 'Tools', price: 90, rating: 4.4, sales: 320, gradient: 'linear-gradient(135deg,#06b6d4,#155e75)' },
    { id: 12, name: 'Wire Bundle (100m)', category: 'Tools', price: 60, rating: 4.3, sales: 410, gradient: 'linear-gradient(135deg,#a3a3a3,#262626)' },
];

const CATEGORIES = ['Semua', 'Logic Gates', 'Canvas', 'Gears', 'Linkages', 'Tools'];

export default function MarketplacePage({ setPage }) {
    const [cartCount, setCartCount] = useState(0);
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [search, setSearch] = useState('');

    const filtered = DUMMY_PRODUCTS.filter(p => {
        if (activeCategory !== 'Semua' && p.category !== activeCategory) return false;
        if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const addToCart = (productName) => {
        setCartCount(c => c + 1);
        toast.success(`"${productName}" ditambahkan ke keranjang`, {
            icon: <ShoppingCart size={16} color="#fb7185" />,
        });
    };

    const openCart = () => {
        toast('Keranjang masih dalam pengembangan', {
            icon: <ShoppingCart size={16} color="#fbbf24" />,
            description: 'Checkout & payment menyusul setelah integrasi backend selesai.',
        });
    };

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

                {/* ===== Cart Button (dummy) ===== */}
                <button
                    onClick={openCart}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12,
                        backgroundColor: '#0e1420', border: '1px solid rgba(251,113,133,0.4)',
                        color: '#fb7185', cursor: 'pointer',
                        fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: 1,
                        boxShadow: '0 0 18px rgba(251,113,133,0.18)', transition: 'all 0.2s',
                        position: 'relative',
                    }}
                    onMouseEnter={c => c.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={c => c.currentTarget.style.transform = 'scale(1)'}
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
                        placeholder="Cari barang... (dummy)"
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
                        {/* Dummy product image (gradient placeholder) */}
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

                        {/* Product info */}
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
                                    onClick={() => addToCart(product.name)}
                                    style={{
                                        backgroundColor: 'rgba(251,113,133,0.15)',
                                        border: '1px solid rgba(251,113,133,0.4)',
                                        borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                                        color: '#fb7185', display: 'flex', alignItems: 'center', gap: 4,
                                        fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600,
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(251,113,133,0.28)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(251,113,133,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                >
                                    <Plus size={12} /> Add
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div style={{
                    textAlign: 'center', padding: '60px 20px', color: '#64748b',
                    fontFamily: 'Inter,sans-serif', fontSize: 13,
                }}>
                    Tidak ada barang yang cocok dengan pencarian kamu.
                </div>
            )}

            {/* Dummy disclaimer */}
            <div style={{
                padding: '14px 16px',
                backgroundColor: 'rgba(251,113,133,0.05)',
                border: '1px dashed rgba(251,113,133,0.3)',
                borderRadius: 12, color: '#94a3b8',
                fontFamily: 'Inter,sans-serif', fontSize: 12, textAlign: 'center',
            }}>
                Catatan: Tampilan ini masih berupa dummy. Produk, harga, dan sistem cart
                bersifat placeholder dan akan diganti dengan integrasi backend
                sungguhan di tahap selanjutnya.
            </div>
        </div>
    );
}
