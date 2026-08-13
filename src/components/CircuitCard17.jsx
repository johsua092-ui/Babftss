import { useState, useEffect, useCallback, useRef } from 'react';
import CircuitDiagram17 from './CircuitDiagram17';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';
import { useClockMode } from '../hooks/useClockMode';
import ClockToast from './ClockToast';

// ════════════════════════════════════════════════════════════════════════════
// Card 17 — T Flip-Flop (2 AND + 2 NOR TOPOLOGY, TOGGLE/HOLD)
// ════════════════════════════════════════════════════════════════════════════
// T Flip-Flop = Toggle Flip-Flop. Saat CLK=1 dan T=1, output Q BERBALIK
// (toggle) dari nilai sebelumnya. Saat T=0 (atau CLK=0), Q HOLD (tetap).
//
// Topologi (2 AND + 2 NOR — koreksi dari gambar referensi user 13 Aug 2026):
//   Gambar asli user memasang feedback TERBALIK (Top AND pakai Q̄, Bottom AND
//   pakai Q) — itu menghasilkan rangkaian HOLD yang tidak pernah toggle.
//   Feedback yang BENAR untuk toggle adalah kebalikannya:
//     Top AND = T · CLK · Q   → R input untuk Top NOR (memaksa Q→0 saat Q=1)
//     Bot AND = T · CLK · Q̄  → S input untuk Bot NOR (memaksa Q→1 saat Q=0)
//   Cross-coupled NOR latch (pola CircuitDiagram_SRLatch):
//     Top NOR (out Q)  = NOR(Top AND out, Q̄_fb)
//     Bot NOR (out Q̄) = NOR(Bot AND out, Q_fb)
//
// Verifikasi toggle (T=1, CLK=1):
//   Q=0, Q̄=1: Top AND=0, Bot AND=1 → Bot NOR=NOR(1,0)=0 (Q̄→0),
//              Top NOR=NOR(0,0)=1 (Q→1) ✓ TOGGLED 0→1
//   Q=1, Q̄=0: Top AND=1, Bot AND=0 → Top NOR=NOR(1,0)=0 (Q→0),
//              Bot NOR=NOR(0,0)=1 (Q̄→1) ✓ TOGGLED 1→0
// Verifikasi HOLD (T=0 atau CLK=0):
//   Top AND=0, Bot AND=0 → NOR latch HOLD (Q tetap) ✓
//
// Mode (2-mode — T FF tidak punya SET/RESET/INVALID karena tidak ada input
// terlarang; TOGGLE mencakup kedua transisi):
//   tGated=0 (T=0 ATAU CLK=0) → HOLD  (Q tetap nilai sebelumnya)
//   tGated=1 (T=1 DAN CLK=1)  → TOGGLE (Q = NOT Q_prev — berbalik setiap rising edge)
//
// Catatan vocabulary: §35 design.md mensyaratkan SET/RESET/HOLD/INVALID untuk
// semua sequential clocked. T FF adalah EXCEPTION karena secara fundamental
// hanya punya 2 mode (TOGGLE/HOLD) — tidak ada input terlarang. TOGGLE adalah
// penjumlahan logis dari SET (saat Q_prev=0) dan RESET (saat Q_prev=1).
//
// Edge-triggered toggle: useEffect fires saat tGated berubah nilai (false↔true).
// Pada rising edge (0→1), Q di-toggle. Falling edge & steady-state tidak melakukan
// apa-apa. Ini mensimulasikan edge-triggered T FF yang umum di IC 7476/74107.
//
// Clock mode (Bagian 29 memory.md / design.md): CLK punya 2 mode — MANUAL &
// AUTO. Dikelola oleh hook useClockMode. Switch UI dirender di dalam SVG
// CircuitDiagram17, di bawah tombol CLK. Toast notifikasi dirender di sini.
export default function CircuitCard17() {
    const [inputT, setInputT] = useState(false);
    const [q, setQ] = useState(false);

    // Prev tGated ref untuk deteksi rising edge (0→1) — hanya toggle saat
    // transisi naik, bukan saat tGated tetap true. Mensimulasikan edge-triggered
    // behavior T FF yang umum di IC digital.
    const prevTGatedRef = useRef(false);

    // onReset: reset semua state lokal card ke 0 (dipanggil saat card lain
    // clock-nya aktif, atau saat card scroll-out dari viewport saat auto running).
    const handleReset = useCallback(() => {
        setInputT(false);
        setQ(false);
        prevTGatedRef.current = false;
    }, []);

    // CLK dikelola oleh useClockMode. cardId wajib untuk fitur registry &
    // IntersectionObserver (force-reset saat card lain clock-nya aktif / scroll-out).
    const {
        clk: inputClk,
        clockMode,
        autoActive,
        toggleClk,
        setClockMode,
        toast,
        cardRef,
    } = useClockMode({ cardId: 'card-17', onReset: handleReset });

    // Turunan sinyal internal (tGated hasil gating T AND CLK)
    const tGated = inputT && inputClk;
    // Q̄ selalu komplement Q — T FF tidak punya kondisi INVALID.
    const qBar = !q;

    // Mode: 2-mode vocabulary (TOGGLE/HOLD) — exception dari ATURAN MUTLAK §35.
    const mode = tGated ? 'TOGGLE' : 'HOLD';

    // Edge-triggered toggle: hanya fire saat tGated rising edge (false→true).
    // Falling edge (true→false) & steady-state true tidak melakukan apa-apa.
    // Ref prevTGated mencegah double-toggle saat React strict mode re-render.
    useEffect(() => {
        const prev = prevTGatedRef.current;
        if (tGated && !prev) {
            // Rising edge detected → toggle Q
            setQ(v => !v);
        }
        prevTGatedRef.current = tGated;
    }, [tGated]);

    // Tema warna: amber (kontrol CLK) — rangkaian "gated" yang dikendalikan CLK.
    const themeColor = '#facc15';
    const themeRgb = hexToRgbStr(themeColor);
    const isActive = inputClk;

    // 2-mode table (T FF tidak punya SET/RESET/INVALID — exception §35).
    // Untuk konsistensi visual dengan Card 16 (4-row), baris SET/RESET ditandai
    // "(tidak applicable)" — poin edukasi bahwa T FF tidak punya input terlarang.
    const modes = [
        { name: 'TOGGLE', cond: 'T=1, CLK=1',  qVal: null, qBarVal: null, desc: 'Q berbalik dari nilai sebelumnya (Q = NOT Q\u2091)' },
        { name: 'HOLD',   cond: 'T=0 (atau CLK=0)', qVal: null, qBarVal: null, desc: 'Q, Q\u0304 = TETAP (nilai sebelumnya)' },
        { name: 'SET',    cond: '(tidak applicable)',  qVal: null, qBarVal: null, desc: 'T FF tidak punya mode SET terpisah — merupakan sub-kasus TOGGLE saat Q_prev=0' },
        { name: 'RESET',  cond: '(tidak applicable)',  qVal: null, qBarVal: null, desc: 'T FF tidak punya mode RESET terpisah — merupakan sub-kasus TOGGLE saat Q_prev=1' },
    ];

    return <div ref={cardRef} style={{
        backgroundColor: '#0e1420',
        border: isActive ? `rgba(${themeRgb},0.4)` : '#1e293b',
        borderRadius: 16, padding: '18px 14px',
        boxShadow: isActive ? `0 0 24px rgba(${themeRgb},0.18)` : 'none',
        transition: 'all 0.4s ease'
    }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 14, fontWeight: 700, color: '#ffffff', textShadow: '0 0 4px rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.15)' }}>17</span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: isActive ? themeColor : '#334155', boxShadow: isActive ? `0 0 8px ${themeColor}` : 'none', transition: 'all 0.3s' }} />
                <span style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 800, fontSize: 13, color: isActive ? themeColor : '#e2e8f0' }}>T Flip-Flop</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}><HeartButton /><span style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: '5px 12px', borderRadius: 6, backgroundColor: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.35)', color: '#facc15' }}>NORMAL</span></div>
        </div>

        {/* Diagram */}
        <CircuitDiagram17
            t={inputT} clk={inputClk} q={q} qBar={qBar} mode={mode}
            onToggleT={() => setInputT(v => !v)}
            onToggleClk={toggleClk}
            clockMode={clockMode}
            autoActive={autoActive}
            onClockModeChange={setClockMode}
        />

        {/* Toast notifikasi clock (top-center, fixed) */}
        <ClockToast toast={toast} />

        {/* Status bar */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '10px 0 8px', fontFamily: 'Orbitron,sans-serif', fontSize: 10, color: '#475569', flexWrap: 'wrap' }}>
            <span style={{ color: inputT ? '#4ade80' : '#475569' }}>T={inputT ? 1 : 0}</span>
            <span>,</span>
            <span style={{ color: inputClk ? '#facc15' : '#475569' }}>CLK={inputClk ? 1 : 0}</span>
            <span style={{ color: '#334155' }}>{'\u2192'}</span>
            <span style={{ color: q ? '#4ade80' : '#334155', fontWeight: 700 }}>Q={q ? 1 : 0}</span>
            <span>,</span>
            <span style={{ color: qBar ? '#f472b6' : '#334155', fontWeight: 700 }}><span style={{ textDecoration: 'overline' }}>Q</span>={qBar ? 1 : 0}</span>
            <span style={{ marginLeft: 4, padding: '2px 8px', borderRadius: 4, backgroundColor: mode === 'TOGGLE' ? 'rgba(168,85,247,0.18)' : 'rgba(250,204,21,0.18)', color: mode === 'TOGGLE' ? '#a855f7' : '#facc15', fontWeight: 700, fontSize: 9 }}>{mode}</span>
            <span style={{ marginLeft: 4, padding: '2px 8px', borderRadius: 4, backgroundColor: autoActive ? 'rgba(239,68,68,0.18)' : 'rgba(148,163,184,0.12)', color: autoActive ? '#ef4444' : '#94a3b8', fontWeight: 700, fontSize: 9, letterSpacing: 0.5 }}>
                {clockMode === 'auto' ? (autoActive ? 'CLK: AUTO ⚡' : 'CLK: AUTO') : 'CLK: MANUAL'}
            </span>
        </div>

        {/* Description */}
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontFamily: 'Inter,sans-serif', lineHeight: 1.6 }}>
            <b>T Flip-Flop</b> (Toggle Flip-Flop) adalah rangkaian sekuensial yang <b>berbalik (toggle)</b> setiap kali input <b style={{ color: '#4ade80' }}>T</b>=1 dan <b style={{ color: '#facc15' }}>CLK</b>=1. Dibangun dari <b>2 gerbang AND</b> (steering) + <b>2 gerbang NOR</b> cross-coupled latch. <b style={{ color: '#fb923c' }}>Top AND</b> menerima T·CLK·<b style={{ color: '#4ade80' }}>Q</b> (feedback) → memaksa Q ke 0 saat Q=1 (efek RESET). <b style={{ color: '#fb923c' }}>Bottom AND</b> menerima T·CLK·<b style={{ color: '#f472b6' }}>Q̄</b> (feedback) → memaksa Q ke 1 saat Q=0 (efek SET). Saat <b>T=0</b> atau <b>CLK=0</b>, kedua AND mengeluarkan 0, latch <b style={{ color: '#facc15' }}>HOLD</b>. <b style={{ color: '#a855f7' }}>Karakteristik toggle:</b> setiap rising edge T·CLK, Q berbalik; tekan T berulang → Q berganti 0↔1 sesuai harapan. <b>Tidak ada kondisi INVALID</b> — T FF tidak punya input terlarang.
        </p>

        {/* Mode Table (reuse struktur CircuitCard_SRLatch.jsx — 4-row untuk konsistensi visual) */}
        <div style={{ marginTop: 10, borderTop: '1px solid #1e293b', paddingTop: 10 }}>
            <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 6, letterSpacing: '0.5px' }}>TABEL MODE</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, fontFamily: 'Orbitron,sans-serif' }}>
                <thead><tr style={{ borderBottom: '2px solid #1e293b' }}>
                    <th style={{ padding: '4px 6px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 9 }}>Mode</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: 9 }}>Kondisi</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: 9 }}>Q</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: 9 }}><span style={{ textDecoration: 'overline' }}>Q</span></th>
                    <th style={{ padding: '4px 6px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 9 }}>Keterangan</th>
                </tr></thead>
                <tbody>{modes.map(function(row) {
                    var isHl = (row.name === mode);
                    var qDisp = row.qVal === null ? (q ? 1 : 0) : row.qVal;
                    var qbDisp = row.qBarVal === null ? (qBar ? 1 : 0) : row.qBarVal;
                    var modeCol = row.name === 'TOGGLE' ? '#a855f7' : row.name === 'HOLD' ? '#facc15' : row.name === 'SET' ? '#4ade80' : '#22d3ee';
                    return <tr key={row.name} style={{ background: isHl ? `rgba(${themeRgb},0.18)` : 'transparent', transition: 'background 0.2s' }}>
                        <td style={{ padding: '4px 6px', color: isHl ? modeCol : '#94a3b8', fontWeight: isHl ? 700 : 600, fontSize: 9 }}>{row.name}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', color: isHl ? '#e2e8f0' : '#64748b', fontSize: 9 }}>{row.cond}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', color: isHl ? (qDisp ? '#4ade80' : '#94a3b8') : '#64748b', fontWeight: 700, fontSize: 10 }}>{row.qVal === null ? (q ? 1 : 0) + '*' : qDisp}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', color: isHl ? (qbDisp ? '#f472b6' : '#94a3b8') : '#64748b', fontWeight: 700, fontSize: 10 }}>{row.qBarVal === null ? (qBar ? 1 : 0) + '*' : qbDisp}</td>
                        <td style={{ padding: '4px 6px', color: isHl ? '#cbd5e1' : '#475569', fontFamily: 'Inter,sans-serif', fontSize: 9, fontWeight: isHl ? 600 : 400 }}>{row.desc}</td>
                    </tr>;
                })}</tbody>
            </table>
            <div style={{ marginTop: 4, fontSize: 8, color: '#475569', fontFamily: 'Inter,sans-serif' }}>* Nilai tergantung state sebelumnya (ingatan). T FF hanya punya 2 mode fungsional (TOGGLE/HOLD) — SET/RESET ditampilkan sebagai sub-kasus TOGGLE untuk konsistensi visual.</div>
        </div>
    </div>;
}
