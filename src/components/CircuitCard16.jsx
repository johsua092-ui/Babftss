import { useState, useEffect } from 'react';
import CircuitDiagram16 from './CircuitDiagram16';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';

// Card 16 — Gated D Latch
// SR Latch yang "dijinakkan" lewat gating S=D AND CLK, R=D̄ AND CLK.
// Mode: TRANSPARENT (CLK=1, Q ikut D) atau HOLD (CLK=0, Q tetap).
// Level-sensitive, BUKAN edge-triggered (D Flip-Flop edge-triggered = task terpisah).
export default function CircuitCard16() {
    const [inputD, setInputD] = useState(false);
    const [inputClk, setInputClk] = useState(false);
    // Q = "ingatan" — BUKAN dihitung ulang tiap render
    const [q, setQ] = useState(false);

    // Turunan sinyal internal (S, R hasil gating)
    const s = inputD && inputClk;
    const r = !inputD && inputClk;
    // qBar komplement Q (s&&r mustahil terjadi di sini, tapi ikuti pola SR Latch utk konsistensi)
    const qBar = (s && r) ? false : !q;

    // Mode diturunkan dari INPUT (CLK), BUKAN dari output Q.
    // Konsisten dengan filosofi Bagian 21 memory.md (mode = derived dari INPUT combination).
    const mode = inputClk ? 'TRANSPARENT' : 'HOLD';

    // Level-sensitive: CLK=1 → Q ikuti D real-time; CLK=0 → HOLD (jangan ubah Q)
    useEffect(() => {
        if (!inputClk) return; // HOLD: jangan ubah Q
        setQ(inputD);          // TRANSPARENT: Q ikut D
    }, [inputD, inputClk]);

    const themeColor = '#facc15'; // amber — samakan dengan tema CLK sebagai "kontrol"
    const themeRgb = hexToRgbStr(themeColor);
    const isActive = inputClk; // aktif kalau CLK=1 (TRANSPARENT)

    // 2-mode table (Format normal — BUKAN Format 2 ringkas; bukan mux/demux)
    const modes = [
        { name: 'TRANSPARENT', cond: 'CLK=1', qVal: null, qBarVal: null, desc: 'Q mengikuti D secara langsung (real-time)' },
        { name: 'HOLD',        cond: 'CLK=0', qVal: null, qBarVal: null, desc: 'Q, Q\u0304 = TETAP (nilai terakhir sebelum CLK turun)' },
    ];

    return <div style={{
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
            onToggleClk={() => setInputClk(v => !v)}
        />

        {/* Status bar */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '10px 0 8px', fontFamily: 'Orbitron,sans-serif', fontSize: 10, color: '#475569', flexWrap: 'wrap' }}>
            <span style={{ color: inputD ? '#4ade80' : '#475569' }}>D={inputD ? 1 : 0}</span>
            <span>,</span>
            <span style={{ color: inputClk ? '#facc15' : '#475569' }}>CLK={inputClk ? 1 : 0}</span>
            <span style={{ color: '#334155' }}>{'\u2192'}</span>
            <span style={{ color: q ? '#4ade80' : '#334155', fontWeight: 700 }}>Q={q ? 1 : 0}</span>
            <span>,</span>
            <span style={{ color: qBar ? '#f472b6' : '#334155', fontWeight: 700 }}><span style={{ textDecoration: 'overline' }}>Q</span>={qBar ? 1 : 0}</span>
            <span style={{ marginLeft: 4, padding: '2px 8px', borderRadius: 4, backgroundColor: mode === 'TRANSPARENT' ? 'rgba(74,222,128,0.18)' : 'rgba(250,204,21,0.18)', color: mode === 'TRANSPARENT' ? '#4ade80' : '#facc15', fontWeight: 700, fontSize: 9 }}>{mode}</span>
        </div>

        {/* Description */}
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontFamily: 'Inter,sans-serif', lineHeight: 1.6 }}>
            <b>Gated D Latch</b> adalah <b>SR Latch yang "dijinakkan"</b> — dua gerbang AND sebagai pintu gating memastikan S dan R tidak pernah aktif bersamaan, sehingga kondisi INVALID (yang ada di SR Latch) mustahil terjadi. Sinyal <b style={{ color: '#facc15' }}>CLK</b> berperan sebagai "saklar": saat CLK=1 rangkaian <b>TRANSPARENT</b> (Q langsung mengikuti D secara real-time), saat CLK=0 rangkaian <b>HOLD</b> (Q mengunci ingatan terakhir, walau D diubah-ubah). Ini adalah fondasi menuju <b>D Flip-Flop edge-triggered</b> (yang akan datang, task terpisah) — bedanya, Gated D Latch ini bersifat <i>level-sensitive</i>, bukan <i>edge-triggered</i>.
        </p>

        {/* 2-Mode Table */}
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
                    var modeCol = row.name === 'TRANSPARENT' ? '#4ade80' : '#facc15';
                    return <tr key={row.name} style={{ background: isHl ? `rgba(${themeRgb},0.18)` : 'transparent', transition: 'background 0.2s' }}>
                        <td style={{ padding: '4px 6px', color: isHl ? modeCol : '#94a3b8', fontWeight: isHl ? 700 : 600, fontSize: 9 }}>{row.name}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', color: isHl ? '#e2e8f0' : '#64748b', fontSize: 9 }}>{row.cond}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', color: isHl ? (q ? '#4ade80' : '#94a3b8') : '#64748b', fontWeight: 700, fontSize: 10 }}>{q ? 1 : 0}{row.qVal === null ? '*' : ''}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', color: isHl ? (qBar ? '#f472b6' : '#94a3b8') : '#64748b', fontWeight: 700, fontSize: 10 }}>{qBar ? 1 : 0}{row.qBarVal === null ? '*' : ''}</td>
                        <td style={{ padding: '4px 6px', color: isHl ? '#cbd5e1' : '#475569', fontFamily: 'Inter,sans-serif', fontSize: 9, fontWeight: isHl ? 600 : 400 }}>{row.desc}</td>
                    </tr>;
                })}</tbody>
            </table>
            <div style={{ marginTop: 4, fontSize: 8, color: '#475569', fontFamily: 'Inter,sans-serif' }}>* Nilai tergantung state sebelumnya (ingatan)</div>
        </div>
    </div>;
}
