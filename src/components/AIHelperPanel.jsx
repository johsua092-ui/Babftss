import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, MessageCircle, Coins, Clock, Zap, AlertTriangle, ShoppingCart, Play, ChevronDown, ChevronUp, ArrowRightLeft, Inbox, Infinity as InfinityIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import CoinTransferPanel from './CoinTransferPanel';
import InboxPanel from './InboxPanel';

const API_URL = '/api/ai-chat';

const styles = {
    panelOuter: {
        position: 'fixed', bottom: 88, right: 24, zIndex: 200,
        width: 380, maxWidth: 'calc(100vw - 32px)',
        height: 520, maxHeight: 'calc(100dvh - 120px)',
        display: 'flex', flexDirection: 'column',
        backgroundColor: '#0f1520', border: '1px solid #1e293b',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', backgroundColor: '#0e1420',
        borderBottom: '1px solid #1e293b', flexShrink: 0,
    },
    headerTitle: {
        fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 14,
        color: '#e2e8f0', margin: 0, letterSpacing: 0.5,
    },
    closeBtn: {
        background: 'transparent', border: 'none', color: '#64748b',
        cursor: 'pointer', padding: 4, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        borderRadius: 6, transition: 'color 0.2s',
    },
    messages: {
        flex: 1, overflowY: 'auto', padding: 16,
        display: 'flex', flexDirection: 'column', gap: 12,
        backgroundColor: '#111827',
    },
    bubbleRow: (isUser) => ({
        display: 'flex', flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4,
    }),
    bubbleLabel: (isUser) => ({
        fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600,
        color: isUser ? '#94a3b8' : '#64748b', padding: '0 4px',
    }),
    bubble: (isUser) => ({
        maxWidth: '85%', padding: '10px 14px', borderRadius: 12,
        fontFamily: 'Inter,sans-serif', fontSize: 13.5, lineHeight: 1.55,
        color: '#e2e8f0',
        backgroundColor: isUser ? '#1e3a5f' : '#1a2234',
        border: isUser ? '1px solid #1e4976' : '1px solid #253047',
        wordBreak: 'break-word',
    }),
    loadingBubble: {
        maxWidth: '85%', padding: '10px 14px', borderRadius: 12,
        fontFamily: 'Inter,sans-serif', fontSize: 13.5,
        color: '#64748b', backgroundColor: '#1a2234',
        border: '1px solid #253047',
    },
    inputArea: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 14px', backgroundColor: '#0e1420',
        borderTop: '1px solid #1e293b', flexShrink: 0,
    },
    input: {
        flex: 1, padding: '10px 14px', borderRadius: 10,
        backgroundColor: '#1a2234', border: '1px solid #253047',
        color: '#e2e8f0', fontFamily: 'Inter,sans-serif', fontSize: 13.5,
        outline: 'none', transition: 'border-color 0.2s',
    },
    sendBtn: (disabled) => ({
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: disabled ? '#1e293b' : '#334155',
        border: '1px solid ' + (disabled ? '#253047' : '#475569'),
        color: disabled ? '#334155' : '#e2e8f0',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background-color 0.2s', flexShrink: 0,
    }),
    emptyState: {
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: 24, color: '#475569', textAlign: 'center',
    },
    emptyIcon: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#1a2234', border: '1px solid #253047',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#475569', marginBottom: 4,
    },
};

/* ── Gold & Timer bar styles ── */
const goldStyles = {
    bar: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', backgroundColor: '#0a0f18',
        borderBottom: '1px solid #1e293b', flexShrink: 0, gap: 8,
    },
    goldBadge: {
        display: 'flex', alignItems: 'center', gap: 6,
        backgroundColor: '#1a1f2e', border: '1px solid #2d3548',
        borderRadius: 8, padding: '4px 10px',
    },
    goldIcon: { color: '#fbbf24' },
    goldText: {
        fontFamily: 'Orbitron,sans-serif', fontSize: 13, fontWeight: 700,
        color: '#fbbf24', letterSpacing: 0.5,
    },
    timerBadge: (active) => ({
        display: 'flex', alignItems: 'center', gap: 6,
        backgroundColor: active ? '#0f2a1a' : '#1a1f2e',
        border: '1px solid ' + (active ? '#16a34a' : '#2d3548'),
        borderRadius: 8, padding: '4px 10px',
    }),
    timerIcon: (active) => ({ color: active ? '#4ade80' : '#64748b' }),
    timerText: (active) => ({
        fontFamily: 'Orbitron,sans-serif', fontSize: 12, fontWeight: 700,
        color: active ? '#4ade80' : '#64748b', letterSpacing: 0.5,
    }),
    buyBtn: {
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
        backgroundColor: '#1e293b', border: '1px solid #334155',
        color: '#94a3b8', fontFamily: 'Inter,sans-serif', fontSize: 11,
        fontWeight: 600, transition: 'all 0.2s', flexShrink: 0,
    },
    activateBtn: {
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
        backgroundColor: '#0f2a1a', border: '1px solid #16a34a',
        color: '#4ade80', fontFamily: 'Inter,sans-serif', fontSize: 11,
        fontWeight: 600, transition: 'all 0.2s', flexShrink: 0,
    },
    expandBtn: {
        background: 'transparent', border: 'none', color: '#64748b',
        cursor: 'pointer', padding: 2, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
    },
    dropdown: {
        backgroundColor: '#0a0f18', borderBottom: '1px solid #1e293b',
        padding: '10px 14px', flexShrink: 0,
    },
    pkgGrid: {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
    },
    pkgCard: (affordable) => ({
        display: 'flex', flexDirection: 'column', gap: 4,
        padding: '8px 10px', borderRadius: 8,
        backgroundColor: affordable ? '#111a27' : '#0e1219',
        border: '1px solid ' + (affordable ? '#1e4976' : '#1e293b'),
        cursor: affordable ? 'pointer' : 'default',
        transition: 'all 0.2s', opacity: affordable ? 1 : 0.5,
    }),
    pkgLabel: {
        fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600,
        color: '#e2e8f0',
    },
    pkgCost: {
        fontFamily: 'Inter,sans-serif', fontSize: 11,
        color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4,
    },
    warningBox: {
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '10px 12px', borderRadius: 8,
        backgroundColor: '#1a1000', border: '1px solid #92400e',
        marginBottom: 8,
    },
    warningIcon: { color: '#f59e0b', flexShrink: 0, marginTop: 1 },
    warningText: {
        fontFamily: 'Inter,sans-serif', fontSize: 12,
        color: '#fbbf24', lineHeight: 1.5,
    },
    warningBtns: {
        display: 'flex', gap: 8, marginTop: 8,
    },
    warningConfirm: {
        padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
        backgroundColor: '#92400e', border: '1px solid #b45309',
        color: '#fef3c7', fontFamily: 'Inter,sans-serif', fontSize: 11,
        fontWeight: 600, transition: 'all 0.2s',
    },
    warningCancel: {
        padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
        backgroundColor: '#1e293b', border: '1px solid #334155',
        color: '#94a3b8', fontFamily: 'Inter,sans-serif', fontSize: 11,
        fontWeight: 600, transition: 'all 0.2s',
    },
    errorToast: {
        padding: '8px 12px', borderRadius: 8,
        backgroundColor: '#2a0a0a', border: '1px solid #7f1d1d',
        fontFamily: 'Inter,sans-serif', fontSize: 12,
        color: '#f87171', lineHeight: 1.4,
        display: 'flex', alignItems: 'center', gap: 6,
    },
};

const mdStyles = {
    p: { margin: '0 0 8px 0' },
    h1: { fontFamily: 'Orbitron,sans-serif', fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '12px 0 6px 0' },
    h2: { fontFamily: 'Orbitron,sans-serif', fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '10px 0 4px 0' },
    h3: { fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 700, color: '#cbd5e1', margin: '8px 0 4px 0' },
    ul: { margin: '4px 0 8px 0', paddingLeft: 20 },
    ol: { margin: '4px 0 8px 0', paddingLeft: 20 },
    li: { margin: '2px 0' },
    code: { backgroundColor: '#0e1420', padding: '1px 5px', borderRadius: 4, fontSize: 12.5, fontFamily: 'monospace' },
    pre: { backgroundColor: '#0e1420', padding: 12, borderRadius: 8, overflowX: 'auto', margin: '8px 0' },
    preCode: { margin: 0, backgroundColor: 'transparent', padding: 0 },
    blockquote: { borderLeft: '3px solid #334155', margin: '8px 0', paddingLeft: 12, color: '#94a3b8' },
    a: { color: '#60a5fa', textDecoration: 'none' },
    strong: { color: '#f1f5f9', fontWeight: 600 },
    hr: { border: 'none', borderTop: '1px solid #1e293b', margin: '12px 0' },
    table: { borderCollapse: 'collapse', margin: '8px 0', fontSize: 13 },
    th: { border: '1px solid #1e293b', padding: '6px 10px', backgroundColor: '#1a2234', fontWeight: 600, textAlign: 'left' },
    td: { border: '1px solid #1e293b', padding: '6px 10px' },
};

function MarkdownContent({ content }) {
    return (
        <ReactMarkdown
            components={{
                p: ({ children, node, ...props }) => <p style={mdStyles.p} {...props}>{children}</p>,
                h1: ({ children, ...props }) => <h1 style={mdStyles.h1} {...props}>{children}</h1>,
                h2: ({ children, ...props }) => <h2 style={mdStyles.h2} {...props}>{children}</h2>,
                h3: ({ children, ...props }) => <h3 style={mdStyles.h3} {...props}>{children}</h3>,
                ul: ({ children, ...props }) => <ul style={mdStyles.ul} {...props}>{children}</ul>,
                ol: ({ children, ...props }) => <ol style={mdStyles.ol} {...props}>{children}</ol>,
                li: ({ children, ...props }) => <li style={mdStyles.li} {...props}>{children}</li>,
                code: ({ inline, children, ...props }) => {
                    if (inline) return <code style={mdStyles.code} {...props}>{children}</code>;
                    return <code style={mdStyles.preCode} {...props}>{children}</code>;
                },
                pre: ({ children, ...props }) => <pre style={mdStyles.pre} {...props}>{children}</pre>,
                blockquote: ({ children, ...props }) => <blockquote style={mdStyles.blockquote} {...props}>{children}</blockquote>,
                a: ({ children, ...props }) => <a style={mdStyles.a} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
                strong: ({ children, ...props }) => <strong style={mdStyles.strong} {...props}>{children}</strong>,
                hr: (props) => <hr style={mdStyles.hr} {...props} />,
                table: ({ children, ...props }) => <table style={mdStyles.table} {...props}>{children}</table>,
                th: ({ children, ...props }) => <th style={mdStyles.th} {...props}>{children}</th>,
                td: ({ children, ...props }) => <td style={mdStyles.td} {...props}>{children}</td>,
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

/* ── Countdown hook ── */
function useCountdown(expiresAt) {
    const [remaining, setRemaining] = useState(null);

    useEffect(() => {
        if (!expiresAt) { setRemaining(null); return; }
        const tick = () => {
            const diff = expiresAt - Date.now();
            if (diff <= 0) { setRemaining(0); return; }
            setRemaining(diff);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    if (remaining === null) return null;
    if (remaining <= 0) return '00:00';
    const totalSec = Math.ceil(remaining / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ── Format minutes to human-readable ── */
function formatMinutes(min) {
    if (min === null || min === undefined) return '-';
    if (min === Infinity) return '\u221E';
    if (min <= 0) return '0 min';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function AIHelperPanel({ onClose, messages, setMessages, chatId, setChatId }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [goldError, setGoldError] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const { user, getIdToken } = useAuth();

    /* ── Gold & Timer state ── */
    const [goldInfo, setGoldInfo] = useState(null);     // { gold, remainingMinutes, timerActive, timerExpiresAt, packages, isAdmin }
    const [showPackages, setShowPackages] = useState(false);
    const [showTimerWarning, setShowTimerWarning] = useState(false);
    const [buyingPkg, setBuyingPkg] = useState(null);
    const [activating, setActivating] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [showInbox, setShowInbox] = useState(false);

    const countdown = useCountdown(goldInfo?.timerExpiresAt || null);
    const timerActive = goldInfo?.timerActive && countdown !== '00:00' && countdown !== null;

    /* ── Fetch gold info ── */
    const fetchGoldInfo = useCallback(async () => {
        if (!user) return;
        try {
            const token = await getIdToken();
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${API_URL}?action=gold-info`, { headers });
            if (res.ok) {
                const data = await res.json();
                setGoldInfo(data);
            }
        } catch {
            // silent fail — don't block chat
        }
    }, [user, getIdToken]);

    useEffect(() => {
        fetchGoldInfo();
        const id = setInterval(fetchGoldInfo, 30000);
        return () => clearInterval(id);
    }, [fetchGoldInfo]);

    /* ── Re-fetch when timer might have changed ── */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 150);
    }, []);

    /* ── Buy package ── */
    async function buyPackage(pkg) {
        if (!user || buyingPkg) return;
        setBuyingPkg(pkg.id);
        setGoldError(null);
        try {
            const token = await getIdToken();
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${API_URL}?action=buy-time`, {
                method: 'POST', headers,
                body: JSON.stringify({ packageId: pkg.id }),
            });
            const data = await res.json();
            if (res.status === 402) {
                setGoldError('Gold tidak cukup! Kamu butuh ' + pkg.gold + ' gold tapi cuma punya ' + (data.gold ?? '?') + '.');
                return;
            }
            if (res.status === 400) {
                setGoldError(data.error || 'Paket tidak valid.');
                return;
            }
            if (res.status === 429) {
                setGoldError('Tunggu 3 detik sebelum beli lagi.');
                return;
            }
            if (!res.ok) {
                setGoldError(data.error || 'Gagal membeli paket.');
                return;
            }
            // success — refresh gold info
            await fetchGoldInfo();
            setGoldError(null);
            setShowPackages(false);
        } catch {
            setGoldError('Gagal menghubungi server. Coba lagi.');
        } finally {
            setBuyingPkg(null);
        }
    }

    /* ── Activate timer ── */
    async function confirmActivateTimer() {
        if (!user || activating) return;
        setActivating(true);
        setGoldError(null);
        setShowTimerWarning(false);
        try {
            const token = await getIdToken();
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${API_URL}?action=activate-timer`, {
                method: 'POST', headers,
                body: JSON.stringify({}),
            });
            const data = await res.json();
            if (res.status === 400) {
                setGoldError(data.error || 'Belum punya waktu AI. Beli dulu paketnya.');
                return;
            }
            if (res.status === 409) {
                setGoldError('Timer sudah aktif.');
                return;
            }
            if (!res.ok) {
                setGoldError(data.error || 'Gagal mengaktifkan timer.');
                return;
            }
            await fetchGoldInfo();
        } catch {
            setGoldError('Gagal menghubungi server. Coba lagi.');
        } finally {
            setActivating(false);
        }
    }

    async function sendMessage() {
        const text = input.trim();
        if (!text || loading) return;

        if (!user) {
            setError('Kamu harus login dulu buat pakai AI chat.');
            return;
        }

        const userMsg = { role: 'user', content: text };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);
        setError(null);

        try {
            const token = await getIdToken();
            const body = { message: text };
            if (chatId) body.chatId = chatId;
            if (newMessages.length > 0) body.history = newMessages;

            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            /* ── Handle 402: Gold kurang ── */
            if (res.status === 402) {
                const data = await res.json().catch(() => ({}));
                setError('Gold tidak cukup! Beli paket AI waktu dulu.');
                await fetchGoldInfo();
                return;
            }

            /* ── Handle 403: Timer not active / expired ── */
            if (res.status === 403) {
                const data = await res.json().catch(() => ({}));
                if (data.code === 'TIMER_NOT_ACTIVE') {
                    setError('Aktifkan timer AI dulu sebelum chat. Klik tombol "Aktifkan Timer" di atas.');
                } else if (data.code === 'TIMER_EXPIRED') {
                    setError('Waktu AI sudah habis! Beli paket baru untuk lanjut chat.');
                } else {
                    setError(data.error || 'Akses AI ditolak.');
                }
                await fetchGoldInfo();
                return;
            }

            if (res.status === 401) {
                setError('Sesi expired. Coba login ulang.');
                return;
            }

            if (!res.ok) throw new Error(`Server error (${res.status})`);

            const data = await res.json();
            if (data.chatId && !chatId) setChatId(data.chatId);
            setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
        } catch (err) {
            setError('Gagal menghubungi AI. Coba lagi.');
        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    const gold = goldInfo?.isAdmin ? Infinity : (goldInfo?.gold ?? 0);
    const remainingMin = goldInfo?.isAdmin ? Infinity : (goldInfo?.remainingMinutes ?? 0);
    const packages = goldInfo?.packages || [];
    const isAdmin = goldInfo?.isAdmin || false;

    return (
        <div style={styles.panelOuter}>
            {/* ── Header ── */}
            <div style={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bot size={18} color="#64748b" />
                    <h2 style={styles.headerTitle}>AI Helper</h2>
                </div>
                <button
                    style={styles.closeBtn}
                    onClick={onClose}
                    onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
                    onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >
                    <X size={18} />
                </button>
            </div>

            {/* ── Gold & Timer Bar ── */}
            {user && goldInfo && (
                <div style={goldStyles.bar}>
                    {/* Gold balance */}
                    <div style={goldStyles.goldBadge}>
                        <Coins size={14} style={goldStyles.goldIcon} />
                        <span style={goldStyles.goldText}>
                            {gold === Infinity
                              ? <InfinityIcon size={18} style={{ display: 'inline-block', verticalAlign: 'middle' }} color="#fbbf24" strokeWidth={2.5} />
                              : gold
                            }
                        </span>
                    </div>

                    {/* Timer / Countdown */}
                    <div style={goldStyles.timerBadge(timerActive)}>
                        <Clock size={14} style={goldStyles.timerIcon(timerActive)} />
                        <span style={goldStyles.timerText(timerActive)}>
                            {timerActive ? countdown : (remainingMin === Infinity
                              ? <InfinityIcon size={18} style={{ display: 'inline-block', verticalAlign: 'middle' }} color={timerActive ? '#4ade80' : '#94a3b8'} strokeWidth={2.5} />
                              : (remainingMin > 0 ? formatMinutes(remainingMin) : 'No Time')
                            )}
                        </span>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {/* Inbox button */}
                        <button
                            style={{ ...goldStyles.buyBtn, color: showInbox ? '#60a5fa' : '#94a3b8' }}
                            onClick={() => { setShowInbox(p => !p); setShowTransfer(false); }}
                            title="Inbox"
                        >
                            <Inbox size={12} />
                        </button>
                        {/* Transfer coin button */}
                        <button
                            style={{ ...goldStyles.buyBtn, color: showTransfer ? '#fbbf24' : '#94a3b8' }}
                            onClick={() => { setShowTransfer(p => !p); setShowInbox(false); }}
                            title="Transfer Coin"
                        >
                            <ArrowRightLeft size={12} />
                        </button>
                        {!isAdmin && !timerActive && remainingMin > 0 && (
                            <button
                                style={goldStyles.activateBtn}
                                onClick={() => setShowTimerWarning(true)}
                                disabled={activating}
                            >
                                <Play size={12} /> Aktifkan
                            </button>
                        )}
                        {!isAdmin && (
                            <button
                                style={goldStyles.buyBtn}
                                onClick={() => setShowPackages(p => !p)}
                            >
                                <ShoppingCart size={12} />
                                {showPackages ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Timer Irreversible Warning ── */}
            {showTimerWarning && (
                <div style={goldStyles.dropdown}>
                    <div style={goldStyles.warningBox}>
                        <AlertTriangle size={16} style={goldStyles.warningIcon} />
                        <div>
                            <div style={goldStyles.warningText}>
                                Timer <strong>tidak bisa dihentikan</strong> setelah diaktifkan! Waktu akan terus berjalan sampai habis. Kamu punya <strong>{formatMinutes(remainingMin)}</strong> waktu AI.
                            </div>
                            <div style={goldStyles.warningBtns}>
                                <button
                                    style={goldStyles.warningConfirm}
                                    onClick={confirmActivateTimer}
                                    disabled={activating}
                                >
                                    {activating ? 'Mengaktifkan...' : 'Ya, Aktifkan Timer'}
                                </button>
                                <button
                                    style={goldStyles.warningCancel}
                                    onClick={() => setShowTimerWarning(false)}
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Package Purchase Dropdown ── */}
            {showPackages && (
                <div style={goldStyles.dropdown}>
                    <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Zap size={13} color="#fbbf24" /> Beli Waktu AI
                    </div>
                    <div style={goldStyles.pkgGrid}>
                        {packages.map(pkg => {
                            const affordable = gold >= pkg.gold;
                            const isBuying = buyingPkg === pkg.id;
                            return (
                                <button
                                    key={pkg.id}
                                    style={goldStyles.pkgCard(affordable)}
                                    onClick={() => affordable && buyPackage(pkg)}
                                    disabled={!affordable || isBuying}
                                >
                                    <span style={goldStyles.pkgLabel}>
                                        {isBuying ? '...' : pkg.label}
                                    </span>
                                    <span style={goldStyles.pkgCost}>
                                        <Coins size={11} style={{ color: '#fbbf24' }} />
                                        {pkg.gold} gold
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Gold/Timer Error ── */}
            {goldError && (
                <div style={{ padding: '8px 14px', backgroundColor: '#0a0f18', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
                    <div style={goldStyles.errorToast}>
                        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                        <span>{goldError}</span>
                        <button
                            onClick={() => setGoldError(null)}
                            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 2, flexShrink: 0 }}
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Messages ── */}
            <div style={styles.messages}>
                {messages.length === 0 && !loading && (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>
                            <MessageCircle size={20} />
                        </div>
                        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }}>
                            Tanya apa saja tentang Logic Gates, Gears, atau materi lain di BABFT Learning.
                        </span>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} style={styles.bubbleRow(msg.role === 'user')}>
                        <span style={styles.bubbleLabel(msg.role === 'user')}>
                            {msg.role === 'user' ? 'Kamu' : 'AI'}
                        </span>
                        <div style={styles.bubble(msg.role === 'user')}>
                            {msg.role === 'user' ? msg.content : <MarkdownContent content={msg.content} />}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div style={styles.bubbleRow(false)}>
                        <span style={styles.bubbleLabel(false)}>AI</span>
                        <div style={styles.loadingBubble}>AI sedang mengetik...</div>
                    </div>
                )}

                {error && (
                    <div style={{ ...styles.bubbleRow(false), alignItems: 'center' }}>
                        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12.5, color: '#f87171', padding: '0 4px' }}>
                            {error}
                        </span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            <div style={styles.inputArea}>
                <input
                    ref={inputRef}
                    style={styles.input}
                    type="text"
                    placeholder={user ? "Ketik pertanyaan..." : "Login dulu ya..."}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading || !user}
                    onFocus={e => e.currentTarget.style.borderColor = '#475569'}
                    onBlur={e => e.currentTarget.style.borderColor = '#253047'}
                />
                <button
                    style={styles.sendBtn(!input.trim() || loading || !user)}
                    onClick={sendMessage}
                    disabled={!input.trim() || loading || !user}
                    onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#475569'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = e.currentTarget.disabled ? '#1e293b' : '#334155'; }}
                >
                    <Send size={16} />
                </button>
            </div>
            {/* ── Inbox Panel (overlay) ── */}
            {showInbox && (
                <InboxPanel onClose={() => setShowInbox(false)} />
            )}
            {/* ── Coin Transfer Panel (overlay) ── */}
            {showTransfer && (
                <CoinTransferPanel
                    onClose={() => setShowTransfer(false)}
                    currentGold={gold}
                    isAdmin={isAdmin}
                />
            )}
        </div>
    );
}
