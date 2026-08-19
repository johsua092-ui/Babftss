import { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart, Trash2, Minus, Plus, Loader2, CheckCircle2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const API_URL = '/api/ai-chat';

export default function CartPanel({ onClose, onCheckoutSuccess }) {
    const { user, getIdToken } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [orderResult, setOrderResult] = useState(null);

    const apiCall = useCallback(async (action, method = 'GET', body = null) => {
        const token = await getIdToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (body) headers['Content-Type'] = 'application/json';
        let url = `${API_URL}?action=mp_${action}`;
        const res = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
    }, [getIdToken]);

    const loadCart = useCallback(async () => {
        setLoading(true);
        const { ok, data } = await apiCall('cart');
        if (ok && data.items) {
            setItems(data.items);
        }
        setLoading(false);
    }, [apiCall]);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    const totalGold = items.reduce((s, it) => s + it.subtotal, 0);
    const totalItems = items.reduce((s, it) => s + it.quantity, 0);

    async function handleUpdateQty(itemId, currentQty, delta) {
        const newQty = Math.max(0, Math.min(99, currentQty + delta));
        if (newQty === currentQty) return;
        setUpdating(true);
        if (newQty === 0) {
            const { ok } = await apiCall('remove', 'POST', { cartItemId: itemId });
            if (ok) {
                setItems(prev => prev.filter(it => it.cartItemId !== itemId));
            } else {
                toast.error('Gagal hapus item');
            }
        } else {
            const { ok } = await apiCall('update', 'POST', { cartItemId: itemId, quantity: newQty });
            if (ok) {
                setItems(prev => prev.map(it => it.cartItemId === itemId ? { ...it, quantity: newQty, subtotal: it.price * newQty } : it));
            } else {
                toast.error('Gagal update jumlah');
            }
        }
        setUpdating(false);
    }

    async function handleRemove(itemId) {
        setUpdating(true);
        const { ok } = await apiCall('remove', 'POST', { cartItemId: itemId });
        if (ok) {
            setItems(prev => prev.filter(it => it.cartItemId !== itemId));
            toast.success('Item dihapus');
        } else {
            toast.error('Gagal hapus item');
        }
        setUpdating(false);
    }

    async function handleCheckout() {
        if (items.length === 0) return;
        setCheckingOut(true);
        try {
            const { ok, data, status } = await apiCall('checkout', 'POST', {});
            if (ok) {
                setOrderResult(data);
                setItems([]);
                toast.success(data.message || `Checkout berhasil! ${data.totalGold} gold terpakai.`);
                if (onCheckoutSuccess) onCheckoutSuccess(data);
            } else if (status === 402) {
                toast.error(data.error || 'Gold tidak cukup');
            } else {
                toast.error(data.error || 'Checkout gagal');
            }
        } catch (e) {
            toast.error('Gagal menghubungi server');
        }
        setCheckingOut(false);
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            fontFamily: 'Inter,sans-serif', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        }} onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: 560, maxHeight: '85vh',
                    backgroundColor: '#0e1420', border: '1px solid rgba(251,113,133,0.3)',
                    borderRadius: '18px 18px 0 0', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 -8px 40px rgba(251,113,133,0.18)', overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid #1e293b', flexShrink: 0,
                }}>
                    <h2 style={{
                        fontFamily: 'Orbitron,sans-serif', fontWeight: 800, fontSize: 16,
                        color: '#fb7185', margin: 0, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <ShoppingCart size={18} /> KERANJANG
                    </h2>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', color: '#64748b',
                        cursor: 'pointer', padding: 4, borderRadius: 6,
                    }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#fb7185' }} />
                        </div>
                    ) : orderResult ? (
                        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                            <CheckCircle2 size={48} color="#10b981" style={{ marginBottom: 12 }} />
                            <div style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 18, color: '#10b981', marginBottom: 8 }}>
                                Checkout Berhasil!
                            </div>
                            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                                Order ID: <strong style={{ color: '#e2e8f0' }}>#{orderResult.orderId}</strong><br />
                                {orderResult.itemCount} item dibeli<br />
                                <span style={{ color: '#fbbf24', fontFamily: 'Orbitron,sans-serif', fontWeight: 700 }}>
                                    {orderResult.totalGold} coins
                                </span> terpakai
                            </div>
                            <button onClick={onClose} style={{
                                marginTop: 20, padding: '10px 28px', borderRadius: 10,
                                backgroundColor: '#fb7185', border: 'none', color: '#fff',
                                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                            }}>Tutup</button>
                        </div>
                    ) : items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
                            <Package size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                            <div style={{ fontSize: 14, marginBottom: 4 }}>Keranjang kosong</div>
                            <div style={{ fontSize: 11 }}>Tambah barang dari marketplace untuk mulai checkout.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {items.map(it => (
                                <div key={it.cartItemId} style={{
                                    padding: '10px 12px', backgroundColor: '#111827',
                                    borderRadius: 10, border: '1px solid #1e293b',
                                    display: 'flex', gap: 10, alignItems: 'center',
                                }}>
                                    {/* Thumb */}
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 8,
                                        background: it.gradient || 'linear-gradient(135deg,#3b82f6,#1e3a8a)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Package size={18} color="rgba(255,255,255,0.6)" />
                                    </div>
                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 12, fontWeight: 600, color: '#e2e8f0',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>{it.name}</div>
                                        <div style={{ fontSize: 11, color: '#fbbf24', fontFamily: 'Orbitron,sans-serif', fontWeight: 700, marginTop: 2 }}>
                                            {it.price} <span style={{ color: '#94a3b8', fontFamily: 'Inter,sans-serif', fontWeight: 400 }}>coins</span>
                                        </div>
                                    </div>
                                    {/* Qty */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <button onClick={() => handleUpdateQty(it.cartItemId, it.quantity, -1)} disabled={updating} style={{
                                            width: 24, height: 24, borderRadius: 6, cursor: 'pointer',
                                            backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}><Minus size={12} /></button>
                                        <span style={{ minWidth: 22, textAlign: 'center', fontSize: 13, color: '#e2e8f0', fontFamily: 'Orbitron,sans-serif', fontWeight: 700 }}>{it.quantity}</span>
                                        <button onClick={() => handleUpdateQty(it.cartItemId, it.quantity, 1)} disabled={updating} style={{
                                            width: 24, height: 24, borderRadius: 6, cursor: 'pointer',
                                            backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}><Plus size={12} /></button>
                                    </div>
                                    {/* Subtotal + remove */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 64 }}>
                                        <span style={{ color: '#fbbf24', fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 12 }}>
                                            {it.subtotal}
                                        </span>
                                        <button onClick={() => handleRemove(it.cartItemId)} disabled={updating} style={{
                                            background: 'transparent', border: 'none', color: '#f87171',
                                            cursor: 'pointer', padding: 2,
                                        }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer (total + checkout) */}
                {!loading && !orderResult && items.length > 0 && (
                    <div style={{
                        padding: '14px 20px', borderTop: '1px solid #1e293b', flexShrink: 0,
                        backgroundColor: '#0b1018',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                Total <strong style={{ color: '#e2e8f0' }}>{totalItems}</strong> item
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 22, fontWeight: 800, color: '#fbbf24' }}>
                                    {totalGold}
                                </span>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>coins</span>
                            </div>
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={checkingOut}
                            style={{
                                width: '100%', padding: '12px', borderRadius: 10, cursor: 'pointer',
                                backgroundColor: checkingOut ? '#1e293b' : 'linear-gradient(180deg,#fb7185 0%,#e11d48 100%)',
                                background: checkingOut ? '#1e293b' : 'linear-gradient(180deg,#fb7185 0%,#e11d48 100%)',
                                border: 'none', color: checkingOut ? '#64748b' : '#fff',
                                fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                        >
                            {checkingOut ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <ShoppingCart size={14} />}
                            {checkingOut ? 'Memproses...' : 'Checkout Sekarang'}
                        </button>
                        <div style={{ fontSize: 10, color: '#475569', textAlign: 'center', marginTop: 8 }}>
                            Gold akan dipotong otomatis dari saldo Turso.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
