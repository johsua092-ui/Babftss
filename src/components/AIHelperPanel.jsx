import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, MessageCircle, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';

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
    modelSelector: {
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 12px', backgroundColor: '#0e1420',
        borderBottom: '1px solid #1e293b', flexShrink: 0,
    },
    modelSelect: {
        flex: 1, padding: '6px 10px', borderRadius: 8,
        backgroundColor: '#1a2234', border: '1px solid #253047',
        color: '#e2e8f0', fontFamily: 'Inter,sans-serif', fontSize: 12,
        outline: 'none', cursor: 'pointer',
        appearance: 'none', WebkitAppearance: 'none',
    },
    modelChevron: {
        position: 'absolute', right: 22, top: '50%', transform: 'translateY(-50%)',
        pointerEvents: 'none', color: '#64748b',
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

export default function AIHelperPanel({ onClose, messages, setMessages, chatId, setChatId }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedModel, setSelectedModel] = useState('');
    const [models, setModels] = useState([]);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const { user, getIdToken } = useAuth();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 150);
    }, []);

    useEffect(() => {
        async function loadModels() {
            try {
                const res = await fetch(`${API_URL}/models`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.models?.length) setModels(data.models);
                }
            } catch {}
        }
        loadModels();
    }, []);

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
            if (selectedModel) body.model = selectedModel;

            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

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

    return (
        <div style={styles.panelOuter}>
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

            {models.length > 0 && (
                <div style={styles.modelSelector}>
                    <select
                        style={styles.modelSelect}
                        value={selectedModel}
                        onChange={e => setSelectedModel(e.target.value)}
                    >
                        <option value="">Auto (Default)</option>
                        {models.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.name} {m.premium ? '⭐' : ''} — {m.provider}
                            </option>
                        ))}
                    </select>
                </div>
            )}

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
        </div>
    );
}
