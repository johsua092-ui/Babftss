import { useState, useEffect, useCallback } from 'react';
import CircuitDiagram16 from './CircuitDiagram16';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';
import { useClockMode } from '../hooks/useClockMode';
import ClockToast from './ClockToast';

// Card 16 — Gated D Latch
// SR Latch yang "dijinakkan" lewat gating S=D AND CLK, R=D̄ AND CLK.
// Mode (4-mode vocabulary — ATURAN MUTLAK Bagian 35 design.md, SAMA untuk semua
// rangkaian sekuensial clocked: SET / RESET / HOLD / INVALID):
//   D=1, CLK=1 -> SET    (S_gated=1, R_gated=0 -> Q=1)
//   D=0, CLK=1 -> RESET  (S_gated=0, R_gated=1 -> Q=0)
//   CLK=0       -> HOLD  (S_gated=R_gated=0 -> Q tetap)
//   INVALID     -> TIDAK MUNGKIN di D Latch (S & R di-generate dari D tunggal,
//                  mustahil aktif bersamaan — poin edukasi penting).
// Level-sensitive, BUKAN edge-triggered (D Flip-Flop edge-triggered = task terpisah).
//
// Clock mode (Bagian 29 memory.md / design.md): CLK punya 2 mode — MANUAL &
// AUTO. Dikelola oleh hook useClockMode. Switch UI dirender di dalam SVG
// CircuitDiagram16, di bawah tombol CLK. Toast notifikasi dirender di sini.
export default function CircuitCard16() {
    const [inputD, setInputD] = useState(false);
    const [q, setQ] = useState(false);

    // onReset: reset semua state lokal card ke 0 (dipanggil saat card lain
    // clock-nya aktif, atau saat card scroll-out dari viewport saat auto running).
    // Spec Bagian 31 memory.md / design.md: "kembali steril dan clear seolah
    // user belum menyentuh card tersebut sama sekali".
    const handleReset = useCallback(() => {
        setInputD(false);
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

    // Turunan sinyal internal (S_gated, R_gated hasil gating D AND CLK)
    const sGated = inputD && inputClk;   // S = D AND CLK
    const rGated = !inputD && inputClk;  // R = D̄ AND CLK
    // qBar komplement Q (s_gated && r_gated mustahil terjadi di D Latch, tapi
    // ikuti pola SR Latch utk konsistensi vocabulary)
    const qBar = (sGated && rGated) ? false : !q;

    // Mode diturunkan dari S_gated, R_gated (BUKAN dari D/CLK mentah, BUKAN dari Q).
    // Konsisten dengan filosofi Bagian 21 memory.md (mode = derived dari INPUT combination).
    // Vocabulary SET/RESET/HOLD/INVALID — ATURAN MUTLAK Bagian 35 design.md.
    const mode = (sGated && rGated) ? 'INVALID'  // mustahil di D Latch, tapi handle defensive
               : (sGated && !rGated) ? 'SET'      // D=1, CLK=1
               : (!sGated && rGated) ? 'RESET'    // D=0, CLK=1
               : 'HOLD';                           // CLK=0 (atau impossible case)

    // Level-sensitive: CLK=1 → Q ikuti D real-time (SET jika D=1, RESET jika D=0);
// CLK=0 → HOLD (jangan ubah Q). Reuse pola SR Latch effect untuk konsistensi.
    useEffect(() => {
        if (sGated && rGated) { setQ(false); return; } // INVALID (mustahil di D Latch)
        if (sGated && !rGated) { setQ(true);  return; } // SET
        if (!sGated && rGated) { setQ(false); return; } // RESET
        // HOLD: do nothing
    }, [sGated, rGated]);

    const themeColor = '#facc15'; // amber — samakan dengan tema CLK sebagai "kontrol"
    const themeRgb = hexToRgbStr(themeColor);
    const isActive = inputClk; // aktif kalau CLK=1 (SET atau RESET — bukan HOLD)

    // 4-mode table (Format normal — BUKAN Format 2 ringkas; bukan mux/demux).
    // Vocabulary WAJIB SET/RESET/HOLD/INVALID (ATURAN MUTLAK Bagian 35 design.md).
    // Kondisi ditulis dalam D/CLK mentah supaya jelas untuk user.
    // INVALID di D Latch TIDAK MUNGKIN terjadi (poin edukasi: D Latch "dijinakkan"
    // dari SR Latch sehingga mustahil S=R=1) — tetap ditampilkan di tabel untuk
    // tujuan edukasi, tapi cond ditandai "(tidak mungkin)".
    const modes = [
        { name: 'SET',     cond: 'D=1, CLK=1', qVal: 1,    qBarVal: 0,    desc: 'Output "diset" ke 1' },
        { name: 'RESET',   cond: 'D=0, CLK=1', qVal: 0,    qBarVal: 1,    desc: 'Output "direset" ke 0' },
        { name: 'HOLD',    cond: 'CLK=0',      qVal: null, qBarVal: null, desc: 'Q, Q\u0304 = TETAP (nilai sebelumnya)' },
        { name: 'INVALID', cond: '(tidak mungkin)', qVal: null, qBarVal: null, desc: 'TIDAK MUNGKIN di D Latch — S & R di-generate dari D tunggal, mustahil aktif bersamaan' },
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
                <span style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 800, fontSize: 13, color: isActive ? themeColor : '#e2e8f0' }}>Gated D Latch</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}><HeartButton /><span style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: '5px 12px', borderRadius: 6, backgroundColor: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.35)', color: '#facc15' }}>NORMAL</span></div>
        </div>

        {/* Diagram */}
        <CircuitDiagram16
            d={inputD} clk={inputClk} q={q} qBar={qBar} mode={mode}
            onToggleD={() => setInputD(v => !v)}
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
            <span style={{ color: inputD ? '#4ade80' : '#475569' }}>D={inputD ? 1 : 0}</span>
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
            <b>Gated D Latch</b> adalah <b>SR Latch yang "dijinakkan"</b> — dua gerbang AND sebagai pintu gating memastikan S dan R tidak pernah aktif bersamaan, sehingga kondisi <b style={{ color: '#ef4444' }}>INVALID mustahil terjadi</b> (poin edukasi penting: D Latch secara desain mencegah INVALID yang ada di SR Latch murni). Sinyal <b style={{ color: '#facc15' }}>CLK</b> berperan sebagai "saklar": saat CLK=1 dan D=1 rangkaian <b style={{ color: '#4ade80' }}>SET</b> (Q=1), saat CLK=1 dan D=0 rangkaian <b style={{ color: '#22d3ee' }}>RESET</b> (Q=0), saat CLK=0 rangkaian <b style={{ color: '#facc15' }}>HOLD</b> (Q mengunci ingatan terakhir, walau D diubah-ubah). Ini adalah fondasi menuju <b>D Flip-Flop edge-triggered</b> (yang akan datang, task terpisah) — bedanya, Gated D Latch ini bersifat <i>level-sensitive</i>, bukan <i>edge-triggered</i>.
        </p>

        {/* 4-Mode Table */}
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
                    var modeCol = row.name === 'SET' ? '#4ade80' : row.name === 'RESET' ? '#22d3ee' : row.name === 'HOLD' ? '#facc15' : '#ef4444';
                    var qDisp = row.qVal === null ? (q ? 1 : 0) : row.qVal;
                    var qbDisp = row.qBarVal === null ? (qBar ? 1 : 0) : row.qBarVal;
                    return <tr key={row.name} style={{ background: isHl ? `rgba(${themeRgb},0.18)` : 'transparent', transition: 'background 0.2s' }}>
                        <td style={{ padding: '4px 6px', color: isHl ? modeCol : '#94a3b8', fontWeight: isHl ? 700 : 600, fontSize: 9 }}>{row.name}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', color: isHl ? '#e2e8f0' : '#64748b', fontSize: 9 }}>{row.cond}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', color: isHl ? (qDisp ? '#4ade80' : '#94a3b8') : '#64748b', fontWeight: 700, fontSize: 10 }}>{row.qVal === null ? (q ? 1 : 0) + '*' : qDisp}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', color: isHl ? (qbDisp ? '#f472b6' : '#94a3b8') : '#64748b', fontWeight: 700, fontSize: 10 }}>{row.qBarVal === null ? (qBar ? 1 : 0) + '*' : qbDisp}</td>
                        <td style={{ padding: '4px 6px', color: isHl ? '#cbd5e1' : '#475569', fontFamily: 'Inter,sans-serif', fontSize: 9, fontWeight: isHl ? 600 : 400 }}>{row.desc}</td>
                    </tr>;
                })}</tbody>
            </table>
            <div style={{ marginTop: 4, fontSize: 8, color: '#475569', fontFamily: 'Inter,sans-serif' }}>* Nilai tergantung state sebelumnya (ingatan). INVALID tidak mungkin terjadi di D Latch (ditampilkan untuk tujuan edukasi vocabulary).</div>
        </div>
    </div>;
}
