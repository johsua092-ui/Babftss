import { useState, useEffect, useCallback } from 'react';
import CircuitDiagram17 from './CircuitDiagram17';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';
import { useClockMode } from '../hooks/useClockMode';
import ClockToast from './ClockToast';

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATE — RANGKAIAN SEKUENSIAL CLOCKED (4-NAND TOPOLOGY)
// ════════════════════════════════════════════════════════════════════════════
// Card 17 (T Flip-Flop) dibangun mengikuti TEMPLATE Card 16 (SR Flip-Flop).
// Lihat design.md Bagian 36 untuk spec lengkap (TEMPLATE — Card 16).
// ════════════════════════════════════════════════════════════════════════════
//
// Card 17 — T Flip-Flop (NAND-based, 4 NAND gates)
// Topologi (sesuai gambar referensi user, 13 Aug 2026):
//   Stage 1 (steering): NAND3 = NOT(T·CLK), NAND4 = NOT(CLK·T) = NOT(T·CLK)
//     (Karena T dan CLK masuk ke kedua steering NAND, outputnya identik.)
//   Stage 2 (cross-coupled NAND latch, active-low inputs):
//     NAND1 (output Q):  inputs (Q̄_fb, NAND3 out)
//     NAND2 (output Q̄): inputs (Q_fb, NAND4 out)
//
// Mode (4-mode, diturunkan dari tGated = T·CLK):
//   tGated=0 (T=0 ATAU CLK=0) → HOLD    (Q tetap nilai sebelumnya)
//   tGated=1 (T=1 DAN CLK=1)  → INVALID (Q=1, Q̄=1 — NAND latch active-low;
//                                        kedua steering NAND output 0)
//   SET, RESET → tidak mungkin di topologi 4-NAND dasar (toggle penuh
//                memerlukan feedback Q/Q̄ ke tahap steering)
//
// Vocabulary WAJIB SET/RESET/HOLD/INVALID (ATURAN MUTLAK Bagian 35 design.md).
//
// Clock mode (Bagian 29 memory.md / design.md): CLK punya 2 mode — MANUAL &
// AUTO. Dikelola oleh hook useClockMode. Switch UI dirender di dalam SVG
// CircuitDiagram17, di bawah tombol CLK. Toast notifikasi dirender di sini.
export default function CircuitCard17() {
    const [inputT, setInputT] = useState(false);
    const [q, setQ] = useState(false);

    // onReset: reset semua state lokal card ke 0 (dipanggil saat card lain
    // clock-nya aktif, atau saat card scroll-out dari viewport saat auto running).
    const handleReset = useCallback(() => {
        setInputT(false);
        setQ(false);
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
    // qBar komplement Q. Saat INVALID (T=1, CLK=1) pada NAND latch active-low,
    // Q=1 dan Q̄=1 (keduanya HIGH — karena NAND3/NAND4 output = 0 saat tGated=1,
    // sehingga NAND1=NAND2=NOT(0·x)=1).
    const qBar = tGated ? true : !q;

    // Mode diturunkan dari tGated (BUKAN dari T/CLK mentah, BUKAN dari Q).
    // Vocabulary SET/RESET/HOLD/INVALID — ATURAN MUTLAK Bagian 35 design.md.
    // T Flip-Flop 4-NAND dasar hanya menghasilkan HOLD (tGated=0) atau
    // INVALID (tGated=1). SET/RESET tidak mungkin tanpa feedback Q/Q̄ ke steering.
    const mode = tGated ? 'INVALID' : 'HOLD';

    // useEffect: update Q berdasarkan tGated.
    // INVALID (NAND latch): setQ(true) — karena NAND1 dengan NAND3 out=0 → Q=NOT(0·Q̄)=1.
    // HOLD: tGated=0 — do nothing, keep previous Q.
    useEffect(() => {
        if (tGated) { setQ(true); return; } // INVALID (Q=1, Q̄=1 pada NAND latch)
        // HOLD: do nothing
    }, [tGated]);

    // Tema warna: amber (kontrol CLK) — rangkaian "gated" yang dikendalikan CLK.
    const themeColor = '#facc15';
    const themeRgb = hexToRgbStr(themeColor);
    const isActive = inputClk;

    // 4-mode table (Format normal — BUKAN Format 2 ringkas; bukan mux/demux).
    // Kondisi ditulis dalam T/CLK mentah supaya jelas untuk user.
    // SET/RESET ditandai "(tidak mungkin)" — poin edukasi vocabulary.
    // INVALID pada NAND latch active-low menghasilkan Q=1, Q̄=1 (keduanya HIGH).
    const modes = [
        { name: 'SET',     cond: '(tidak mungkin)',          qVal: null, qBarVal: null, desc: 'Tidak mungkin di topologi 4-NAND dasar — butuh feedback Q/Q̄ ke steering' },
        { name: 'RESET',   cond: '(tidak mungkin)',          qVal: null, qBarVal: null, desc: 'Tidak mungkin di topologi 4-NAND dasar — butuh feedback Q/Q̄ ke steering' },
        { name: 'HOLD',    cond: 'T=0 (atau CLK=0)',         qVal: null, qBarVal: null, desc: 'Q, Q\u0304 = TETAP (nilai sebelumnya)' },
        { name: 'INVALID', cond: 'T=1, CLK=1',               qVal: 1,    qBarVal: 1,    desc: 'Kondisi terlarang, keduanya 1 (NAND latch active-low)' },
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
            <span style={{ marginLeft: 4, padding: '2px 8px', borderRadius: 4, backgroundColor: mode === 'SET' ? 'rgba(74,222,128,0.18)' : mode === 'RESET' ? 'rgba(34,211,238,0.18)' : mode === 'HOLD' ? 'rgba(250,204,21,0.18)' : 'rgba(239,68,68,0.18)', color: mode === 'SET' ? '#4ade80' : mode === 'RESET' ? '#22d3ee' : mode === 'HOLD' ? '#facc15' : '#ef4444', fontWeight: 700, fontSize: 9 }}>{mode}</span>
            <span style={{ marginLeft: 4, padding: '2px 8px', borderRadius: 4, backgroundColor: autoActive ? 'rgba(239,68,68,0.18)' : 'rgba(148,163,184,0.12)', color: autoActive ? '#ef4444' : '#94a3b8', fontWeight: 700, fontSize: 9, letterSpacing: 0.5 }}>
                {clockMode === 'auto' ? (autoActive ? 'CLK: AUTO ⚡' : 'CLK: AUTO') : 'CLK: MANUAL'}
            </span>
        </div>

        {/* Description */}
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontFamily: 'Inter,sans-serif', lineHeight: 1.6 }}>
            <b>T Flip-Flop</b> adalah rangkaian toggle yang dibangun dari <b>4 gerbang NAND</b> — dua NAND (NAND3, NAND4) sebagai pintu <i>steering</i> yang menerima <b style={{ color: '#4ade80' }}>T</b> dan <b style={{ color: '#facc15' }}>CLK</b>, dan dua NAND (NAND1, NAND2) sebagai latch <i>cross-coupled</i> yang menyimpan state. Saat <b>T=0</b> (atau CLK=0), output steering NAND mengeluarkan 1 (active-low inactive), membuat latch <b style={{ color: '#facc15' }}>HOLD</b> (Q tetap nilainya). Saat <b>T=1 dan CLK=1</b>, kedua steering NAND mengeluarkan 0 secara bersamaan, memaksa latch masuk kondisi <b style={{ color: '#ef4444' }}>INVALID</b> (Q=1, Q̄=1 — keduanya HIGH pada NAND latch active-low). <b style={{ color: '#facc15' }}>Karakteristik:</b> desain 4-NAND ini adalah struktur dasar T Flip-Flop; toggle penuh (Q berbalik setiap CLK=1) memerlukan feedback Q/Q̄ ke tahap steering.
        </p>

        {/* 4-Mode Table (reuse struktur CircuitCard_SRLatch.jsx) */}
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
                    var modeCol = row.name === 'SET' ? '#4ade80' : row.name === 'RESET' ? '#22d3ee' : row.name === 'HOLD' ? '#facc15' : '#ef4444';
                    return <tr key={row.name} style={{ background: isHl ? `rgba(${themeRgb},0.18)` : 'transparent', transition: 'background 0.2s' }}>
                        <td style={{ padding: '4px 6px', color: isHl ? modeCol : '#94a3b8', fontWeight: isHl ? 700 : 600, fontSize: 9 }}>{row.name}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', color: isHl ? '#e2e8f0' : '#64748b', fontSize: 9 }}>{row.cond}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', color: isHl ? (qDisp ? '#4ade80' : '#94a3b8') : '#64748b', fontWeight: 700, fontSize: 10 }}>{row.qVal === null ? (q ? 1 : 0) + '*' : qDisp}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', color: isHl ? (qbDisp ? '#f472b6' : '#94a3b8') : '#64748b', fontWeight: 700, fontSize: 10 }}>{row.qBarVal === null ? (qBar ? 1 : 0) + '*' : qbDisp}</td>
                        <td style={{ padding: '4px 6px', color: isHl ? '#cbd5e1' : '#475569', fontFamily: 'Inter,sans-serif', fontSize: 9, fontWeight: isHl ? 600 : 400 }}>{row.desc}</td>
                    </tr>;
                })}</tbody>
            </table>
            <div style={{ marginTop: 4, fontSize: 8, color: '#475569', fontFamily: 'Inter,sans-serif' }}>* Nilai tergantung state sebelumnya (ingatan). SET/RESET tidak mungkin di topologi 4-NAND dasar (ditampilkan untuk tujuan edukasi vocabulary).</div>
        </div>
    </div>;
}
