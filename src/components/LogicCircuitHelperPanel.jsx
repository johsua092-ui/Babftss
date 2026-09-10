import { useState, useRef, useEffect } from 'react';
import { Zap, Send, Sparkles } from 'lucide-react';

// LogicCircuitHelperPanel — panel AI biru khusus SIRKUIT LOGIKA.
// (Kesepakatan tim 2026-09-10: AI Helper dipecah 3 — hitam umum / biru logic
//  gates / kuning 3D simulator. Tombol biru ada di App.jsx, hanya dirender
//  di halaman keluarga Logic Gates, koordinat sama persis tombol hitam.)
//
// PERAN: ahli sirkuit logika digital — gate AND/OR/NOT/XOR/NAND/NOR, mux/demux,
// adder, comparator, flip-flop, register, counter, ALU, sampai rangkaian gabungan.
// WAJIB PROAKTIF: sejak dibuka langsung menyodorkan rekomendasi rangkaian yang
// bisa dicoba user (greeting berisi ide build) — tidak diam-diam.
//
// BACKEND: share route /api/ai-helper yang sudah disepakati Phase 58
// (env AI_HELPER_URL/KEY milik backend developer — TIDAK ada env/route baru).
// Beda dengan kuning: system prompt fokus sirkuit, TANPA eksekusi [[COMMAND:...]]
// (halaman logic gates tidak punya executor scene seperti simulator).
//
// DESAIN: source-code fidelity — struktur & token persis AIHelperPanel hitam
// (bottom:88 right:24 di atas tombol, #0f1520, #1e293b, #1a2234, Orbitron/Inter,
// radius 16) dengan identitas biru listrik (#3b82f6 / #06b6d4) menggantikan aksen.

const API_URL = '/api/ai-helper';

const SYSTEM_PROMPT = {
    role: 'system',
    content: 'Anda adalah AI Circuit Helper — ahli sirkuit logika digital di web Belajar Bareng TKT (Babft). Fokus pembahasan HANYALAH seputar sirkuit logika: gerbang AND, OR, NOT, NAND, NOR, XOR, XNOR; multiplexer & demultiplexer; adder (half/full, ripple-carry); comparator; flip-flop & register; counter; encoder/decoder; sampai rangkaian gabungan seperti ALU sederhana. Anda WAJIB proaktif: kalau user belum jelas mau apa, langsung sodorkan rekomendasi rangkaian yang menarik untuk dibuat (contoh: "Mau coba full adder 4-bit? Cukup 3 XOR, 3 AND, 2 OR"), lengkap dengan daftar gerbang yang dibutuhkan dan urutan menyusunnya. Jawab dalam Bahasa Indonesia yang enak dibaca, ringkas, dan pemula-friendly. Kalau user bertanya di luar topik sirkuit logika, arahkan dengan sopan kembali ke topik sirkuit dan tawarkan ide rangkaian.',
};

// Greeting pembuka — rekomendasi proaktif langsung menyapa (gak diem-dieman).
const GREETING = {
    role: 'assistant',
    content: '⚡ Hai! Saya AI Circuit Helper — partner kamu buat semua hal seputar sirkuit logika.\n\nMau mulai dari mana? Beberapa rekomendasi rangkaian yang seru:\n\n• Half Adder — gerbang paling dasar: 1 XOR + 1 AND\n• Full Adder — upgrade-nya: 2 XOR, 2 AND, 1 OR\n• Multiplekser 4:1 — butuh 3 NOT, 4 AND (3-input), 1 OR (4-input)\n• Latch SR pakai 2 NAND — ingat 1 bit tanpa clock\n• Comparator 2-bit — bandingkan dua angka biner\n\nKetik nama rangkaian di atas, atau tanya apa aja soal gate, mux, adder, flip-flop!',
};

// Chips saran cepat (rekomendasi proaktif — sekali klik langsung jalan).
const SUGGESTION_CHIPS = [
    'Buat half adder',
    'Rangkaian apa yang seru untuk pemula?',
    'Jelaskan beda mux dan demux',
    'Flip-flop vs latch',
];

// Fallback offline — dipakai kalau /api/ai-helper belum terkonfigurasi
// (503) atau jaringan gagal. Tetap proaktif: sodorkan rekomendasi.
const FALLBACK_REPLIES = [
    {
        k: ['half adder', 'halfadder'],
        text: '⚡ Half Adder — rekomendasi pertama yang pas!\n\nRangkaian: 1 gerbang XOR (Sum) + 1 gerbang AND (Carry).\nSum = A XOR B, Carry = A AND B.\n\nCoba susun: taruh INPUT A & B → XOR untuk Sum → AND untuk Carry → OUTPUT masing-masing. Di halaman simulator logic gates tinggal drag & connect!',
    },
    {
        k: ['full adder'],
        text: '⚡ Full Adder dari 5 gerbang:\n\n• 2 XOR: S = A XOR B XOR Cin\n• 2 AND + 1 OR: Cout = (A AND B) OR (Cin AND (A XOR B))\n\nSusun 3 INPUT (A, B, Cin) → 2 OUTPUT (Sum, Cout). Ini fondasi ripple-carry adder!',
    },
    {
        k: ['mux', 'multiplexer', 'multiplekser'],
        text: '⚡ Mux 4:1 — rangkaian selektor data:\n\n• 4 input data D0-D3, 2 input selektor S0-S1\n• 3 NOT (invert S0, S1)\n• 4 AND 3-input (tiap data × kombinasi seleksi)\n• 1 OR 4-input (gabungkan hasil)\n\nMux memilih 1 dari 4 data sesuai nilai S. Kalau dibalik (1 data → banyak output), itu Demux!',
    },
    {
        k: ['pemula', 'seru', 'rekomendasi', 'mulai', 'rangkaian apa'],
        text: '⚡ Rekomendasi urutan belajar dari dasar:\n\n1. Half Adder (2 gate) — rasakan XOR + AND\n2. Full Adder (5 gate) — tambah carry\n3. Latch SR 2 NAND — simpan 1 bit\n4. Mux 4:1 (8 gate) — belajar seleksi\n5. Comparator 2-bit — logika perbandingan\n\nMau saya jelaskan salah satu detail?',
    },
    {
        k: ['demux', 'demultiplexer'],
        text: '⚡ Demux 1:4 — kebalikan mux:\n\n1 input data D, 2 selektor S0-S1, 4 output Y0-Y3.\n• 3 NOT, 4 AND 3-input, tiap AND menggabung D + kombinasi seleksi.\nData dikirim HANYA ke output yang dipilih S.',
    },
    {
        k: ['flip', 'flop', 'latch'],
        text: '⚡ Flip-flop vs Latch:\n\n• Latch = level-triggered (jalan terus selama clock 1)\n• Flip-flop = edge-triggered (jalan hanya saat clock berubah)\n\nLatch SR dari 2 NAND: S=R=0 → hold, S=0 R=1 → reset, S=1 R=0 → set. (S=R=1 dilarang!). Untuk D flip-flop: tambah NAND penerus + inverter D.',
    },
];

function fallbackReply(userMsg) {
    const m = (userMsg || '').toLowerCase();
    for (const f of FALLBACK_REPLIES) {
        if (f.k.some(k => m.includes(k))) return f.text;
    }
    return '⚡ (Offline) Koneksi AI belum tersedia — tapi begini rekomendasi saya:\n\n• Half Adder (2 gate) — paling dasar\n• Full Adder (5 gate)\n• Latch SR 2 NAND\n• Mux 4:1\n\nTanyakan salah satu di atas, nanti saya jelaskan susunannya. Atau coba lagi nanti ketika AI online!';
}

export default function LogicCircuitHelperPanel({ onClose }) {
    const [messages, setMessages] = useState([SYSTEM_PROMPT, GREETING]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 150);
    }, []);

    const send = async (text) => {
        const userMsg = (text ?? input).trim();
        if (!userMsg || loading) return;
        const next = [...messages, { role: 'user', content: userMsg }];
        setMessages(next);
        setInput('');
        setLoading(true);
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'qwen-3.7', messages: next, temperature: 0.7, max_tokens: 1000 }),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || ('API error: ' + response.status));
            }
            const data = await response.json();
            const aiContent = data.choices?.[0]?.message?.content || 'No response from AI.';
            setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
        } catch {
            // Offline / belum dikonfigurasi — fallback tetap PROAKTIF
            setMessages(prev => [...prev, { role: 'assistant', content: fallbackReply(userMsg) }]);
        } finally {
            setLoading(false);
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <div style={{
            position: 'fixed', bottom: 88, right: 24, zIndex: 200,
            width: 380, maxWidth: 'calc(100vw - 32px)',
            height: 520, maxHeight: 'calc(100dvh - 120px)',
            display: 'flex', flexDirection: 'column',
            backgroundColor: '#0f1520', border: '1px solid #1e293b',
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            fontFamily: 'Inter, sans-serif',
        }}>
            {/* Header — biru listrik */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px',
                backgroundColor: '#0e1420',
                borderBottom: '1px solid #1e293b',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        backgroundColor: '#2563eb', color: '#eff6ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 12px rgba(59,130,246,0.5)',
                    }}>
                        <Zap size={18} />
                    </div>
                    <div>
                        <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: 13, color: '#60a5fa', letterSpacing: 0.5 }}>
                            AI Circuit Helper
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>
                            Ahli sirkuit logika digital
                        </div>
                    </div>
                </div>
                <button onClick={onClose} aria-label="Tutup" style={{
                    background: 'transparent', border: 'none', color: '#64748b',
                    cursor: 'pointer', padding: 4, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    borderRadius: 6, transition: 'color 0.2s', fontSize: 18, lineHeight: 1,
                }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; }}
                >×</button>
            </div>

            {/* Riwayat chat */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: 16,
                display: 'flex', flexDirection: 'column', gap: 12,
                backgroundColor: '#111827',
            }}>
                {messages.filter(m => m.role !== 'system').map((msg, i) => (
                    <div key={i} style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 4,
                    }}>
                        <div style={{
                            maxWidth: '85%', padding: '10px 14px', borderRadius: 12,
                            fontSize: 13.5, lineHeight: 1.55, color: '#e2e8f0',
                            backgroundColor: msg.role === 'user' ? '#1e3a8a' : '#1a2234',
                            border: msg.role === 'user' ? '1px solid #1e4976' : '1px solid #253047',
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>{msg.content}</div>
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                        <div style={{
                            padding: '10px 14px', borderRadius: 12,
                            backgroundColor: '#1a2234', border: '1px solid rgba(59,130,246,0.3)',
                            color: '#60a5fa', fontSize: 13.5, fontStyle: 'italic',
                        }}>⚡ AI sedang merangkai jawaban...</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Chips rekomendasi — proaktif, sekali klik langsung kirim */}
            <div style={{
                padding: '8px 14px', backgroundColor: '#0e1420',
                borderTop: '1px solid #1e293b',
                display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0,
            }}>
                {SUGGESTION_CHIPS.map(s => (
                    <button key={s} onClick={() => { if (!loading) send(s); }} style={{
                        padding: '4px 10px', borderRadius: 999,
                        background: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.3)',
                        color: '#93c5fd', cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: 10.5, fontFamily: 'Inter, sans-serif',
                        opacity: loading ? 0.5 : 1,
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <Sparkles size={10} /> {s}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 14px', backgroundColor: '#0e1420',
                borderTop: '1px solid #1e293b', flexShrink: 0,
            }}>
                <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Tanya soal sirkuit logika... (Enter untuk kirim)"
                    disabled={loading}
                    style={{
                        flex: 1, padding: '10px 14px', borderRadius: 10,
                        backgroundColor: '#1a2234', border: '1px solid rgba(59,130,246,0.35)',
                        color: '#e2e8f0', fontFamily: 'Inter, sans-serif', fontSize: 13.5,
                        outline: 'none', transition: 'border-color 0.2s',
                    }}
                />
                <button onClick={() => send()} disabled={loading || !input.trim()} aria-label="Kirim" style={{
                    width: 38, height: 38, borderRadius: 10,
                    backgroundColor: !loading && input.trim() ? '#2563eb' : '#1e293b',
                    border: '1px solid ' + (!loading && input.trim() ? '#60a5fa' : '#253047'),
                    color: !loading && input.trim() ? '#eff6ff' : '#334155',
                    cursor: !loading && input.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background-color 0.2s', flexShrink: 0,
                }}>
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
}
