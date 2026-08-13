import { useState, useEffect, useCallback } from 'react';
import CircuitDiagram16 from './CircuitDiagram16';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';
import { useClockMode } from '../hooks/useClockMode';
import ClockToast from './ClockToast';

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATE — RANGKAIAN SEKUENSIAL CLOCKED (4-NAND TOPOLOGY)
// ════════════════════════════════════════════════════════════════════════════
// Card 16 (SR Flip-Flop) adalah TEMPLATE referensi untuk SEMUA rangkaian
// sekuensial clocked di masa depan yang butuh sistem yang sama. Copy pola ini
// untuk card baru (JK Flip-Flop, D Flip-Flop, T Flip-Flop, register, dll).
// Lihat design.md Bagian 36 untuk spec lengkap (TEMPLATE — Card 16).
// ════════════════════════════════════════════════════════════════════════════
//
// Card 16 — SR Flip-Flop (NAND-based, 4 NAND gates)
// Topologi (sesuai gambar referensi user, 13 Aug 2026):
//   Stage 1 (steering): NAND3 = NOT(S·CLK) = S̄_gated;  NAND4 = NOT(R·CLK) = R̄_gated
//   Stage 2 (cross-coupled NAND latch, active-low inputs):
//     NAND1 (output Q):  inputs (S̄_gated, Q̄_fb)
//     NAND2 (output Q̄): inputs (Q_fb, R̄_gated)
// Mirip Gated D Latch — TAPI gating-nya langsung dari 2 input asli S, R
// (BUKAN diturunkan dari D). Tidak ada NOT gate → TIDAK ada proteksi
// anti-INVALID: kondisi S=1,R=1,CLK=1 TETAP menghasilkan INVALID.
//
// Mode (4-mode, reuse pola SR Latch):
//   sGated=1, rGated=0 -> SET     (Q=1, Q̄=0)
//   sGated=0, rGated=1 -> RESET   (Q=0, Q̄=1)
//   sGated=0, rGated=0 -> HOLD    (mencakup CLK=0 kondisi apapun, DAN CLK=1 dgn S=0,R=0)
//   sGated=1, rGated=1 -> INVALID (Q=1, Q̄=1 — NAND latch active-low; BEDA dari NOR latch
//                                  yang memberikan Q=0, Q̄=0. Hanya mungkin saat CLK=1 DAN
//                                  S=1 DAN R=1 bersamaan.)
//
// Clock mode (Bagian 29 memory.md / design.md): CLK punya 2 mode — MANUAL &
// AUTO. Dikelola oleh hook useClockMode. Switch UI dirender di dalam SVG
// CircuitDiagram16, di bawah tombol CLK. Toast notifikasi dirender di sini.
export default function CircuitCard16() {
    const [inputS, setInputS] = useState(false);
    const [inputR, setInputR] = useState(false);
    const [q, setQ] = useState(false);

    // onReset: reset semua state lokal card ke 0 (dipanggil saat card lain
    // clock-nya aktif, atau saat card scroll-out dari viewport saat auto running).
    // Spec Bagian 31 memory.md / design.md: "kembali steril dan clear seolah
    // user belum menyentuh card tersebut sama sekali".
    const handleReset = useCallback(() => {
        setInputS(false);
        setInputR(false);
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
    } = useClockMode({ cardId: 'card-16', onReset: handleReset });

    // Turunan sinyal internal (S_gated, R_gated hasil gating)
    const sGated = inputS && inputClk;
    const rGated = inputR && inputClk;
    // qBar komplement Q. Saat INVALID (S=1,R=1,CLK=1) pada NAND latch active-low,
    // Q=1 dan Q̄=1 (BEDA dengan NOR latch yang memberikan Q=0, Q̄=0 — karena
    // NAND3/NAND4 output = 0 saat sGated=rGated=1, sehingga NAND1=NAND2=NOT(0·x)=1).
    const qBar = (sGated && rGated) ? true : !q;

    // Mode diturunkan dari S_gated, R_gated (BUKAN dari S/R/CLK mentah, BUKAN dari Q).
    // Dengan begini CLK=0 otomatis jatuh ke HOLD tanpa logika tambahan,
    // karena S_gated=R_gated=0 kapanpun CLK=0.
    const mode = (sGated && rGated) ? 'INVALID'
               : (sGated && !rGated) ? 'SET'
               : (!sGated && rGated) ? 'RESET'
               : 'HOLD';

    // useEffect: update Q berdasarkan sGated/rGated.
    // INVALID (NAND latch): setQ(true) — karena NAND1 dengan NAND3 out=0 → Q=NOT(0·Q̄)=1.
    // HOLD: sGated=rGated=0 — do nothing, keep previous Q.
    useEffect(() => {
        if (sGated && rGated) { setQ(true);  return; } // INVALID (Q=1, Q̄=1 pada NAND latch)
        if (sGated && !rGated) { setQ(true);  return; } // SET
        if (!sGated && rGated) { setQ(false); return; } // RESET
        // HOLD: do nothing
    }, [sGated, rGated]);

    // Tema warna: amber (kontrol CLK) — rangkaian "gated" yang dikendalikan CLK.
    const themeColor = '#facc15';
    const themeRgb = hexToRgbStr(themeColor);
    const isActive = inputClk; // aktif kalau CLK=1 (rangkaian dalam keadaan TRANSPARENT/gated-open)

    // 4-mode table (Format normal — BUKAN Format 2 ringkas; bukan mux/demux).
    // Kondisi ditulis dalam S/R/CLK mentah supaya jelas untuk user (bukan S_gated/R_gated).
    // INVALID pada NAND latch active-low menghasilkan Q=1, Q̄=1 (keduanya HIGH) —
    // BEDA dari NOR latch yang menghasilkan Q=0, Q̄=0 (keduanya LOW).
    const modes = [
        { name: 'SET',     cond: 'S=1, R=0, CLK=1', qVal: 1,    qBarVal: 0,    desc: 'Output "diset" ke 1' },
        { name: 'RESET',   cond: 'S=0, R=1, CLK=1', qVal: 0,    qBarVal: 1,    desc: 'Output "direset" ke 0' },
        { name: 'HOLD',    cond: 'S=0, R=0  (atau CLK=0)', qVal: null, qBarVal: null, desc: 'Q, Q\u0304 = TETAP (nilai sebelumnya)' },
        { name: 'INVALID', cond: 'S=1, R=1, CLK=1', qVal: 1,    qBarVal: 1,    desc: 'Kondisi terlarang, keduanya 1 (NAND latch active-low)' },
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
                <span style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 14, fontWeight: 700, color: '#ffffff', textShadow: '0 0 4px rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.15)' }}>16</span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: isActive ? themeColor : '#334155', boxShadow: isActive ? `0 0 8px ${themeColor}` : 'none', transition: 'all 0.3s' }} />
                <span style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 800, fontSize: 13, color: isActive ? themeColor : '#e2e8f0' }}>SR Flip-Flop</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}><HeartButton /><span style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: '5px 12px', borderRadius: 6, backgroundColor: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.35)', color: '#facc15' }}>NORMAL</span></div>
        </div>

        {/* Diagram */}
        <CircuitDiagram16
            s={inputS} r={inputR} clk={inputClk} q={q} qBar={qBar} mode={mode}
            onToggleS={() => setInputS(v => !v)}
            onToggleR={() => setInputR(v => !v)}
            onToggleClk={toggleClk}
            clockMode={clockMode}
            autoActive={autoActive}
            onClockModeChange={setClockMode}
        />

        {/* Toast notifikasi clock (top-center, fixed) — dirender di sini
            supaya muncul di atas semua circuit card. */}
        <ClockToast toast={toast} />

        {/* Status bar */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '10px 0 8px', fontFamily: 'Orbitron,sans-serif', fontSize: 10, color: '#475569', flexWrap: 'wrap' }}>
            <span style={{ color: inputS ? '#4ade80' : '#475569' }}>S={inputS ? 1 : 0}</span>
            <span>,</span>
            <span style={{ color: inputR ? '#22d3ee' : '#475569' }}>R={inputR ? 1 : 0}</span>
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
            <b>SR Flip-Flop</b> adalah SR Latch yang "digerbang" CLK menggunakan <b>4 gerbang NAND</b> — dua NAND (NAND3, NAND4) sebagai pintu <i>steering</i> yang menyaring S dan R lewat sinyal <b style={{ color: '#facc15' }}>CLK</b>, dan dua NAND (NAND1, NAND2) sebagai latch <i>cross-coupled</i> yang menyimpan state. Saat CLK=0, output steering NAND mengeluarkan 1 (active-low inactive), membuat latch <b>HOLD</b> (Q tetap walau S/R diubah). Saat CLK=1, latch merespons S dan R seperti SR Latch murni. <b style={{ color: '#ef4444' }}>Bedanya dengan Gated D Latch:</b> di sini <b>TIDAK ada proteksi anti-INVALID</b>, sehingga kondisi <b>INVALID TETAP BISA TERJADI</b> kalau user toggle S=1, R=1, CLK=1 bersamaan — pada NAND latch active-low, INVALID menghasilkan <b>Q=1 dan Q̄=1</b> (keduanya HIGH, berbeda dari NOR latch yang menghasilkan keduanya LOW). Ini poin edukasi penting: gating CLK tidak otomatis "menjinakkan" SR Latch; hanya D Latch (yang merangkum S dan R dari 1 input D) yang benar-benar anti-INVALID.
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
            <div style={{ marginTop: 4, fontSize: 8, color: '#475569', fontFamily: 'Inter,sans-serif' }}>* Nilai tergantung state sebelumnya (ingatan)</div>
        </div>
    </div>;
}
