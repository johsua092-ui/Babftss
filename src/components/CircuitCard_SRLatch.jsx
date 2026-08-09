import { useState, useEffect, useCallback, useMemo } from 'react';
import CircuitDiagram_SRLatch from './CircuitDiagram_SRLatch';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';

export default function CircuitCard_SRLatch() {
    const [inputS, setInputS] = useState(false);
    const [inputR, setInputR] = useState(false);
    // Q is "remembered" state — NOT recomputed from inputs each render
    const [q, setQ] = useState(false);

    // Derive mode and Q' from inputs + remembered Q
    const { mode, qBar } = useMemo(() => {
        if (inputS && inputR) return { mode: 'INVALID', qBar: false };
        if (inputS && !inputR) return { mode: 'SET', qBar: false };
        if (!inputS && inputR) return { mode: 'RESET', qBar: true };
        // HOLD: S=0, R=0 — keep current Q, Q' = NOT Q
        return { mode: 'HOLD', qBar: !q };
    }, [inputS, inputR, q]);

    // useEffect: only update Q on SET or RESET, NOT on HOLD
    useEffect(() => {
        if (mode === 'SET') setQ(true);
        else if (mode === 'RESET') setQ(false);
        // HOLD: do nothing, keep previous Q
        // INVALID: force both to 0
        else if (mode === 'INVALID') setQ(false);
    }, [mode]);

    const themeColor = '#8B5CF6';
    const themeRgb = hexToRgbStr(themeColor);
    const isActive = inputS || inputR;

    // 4-mode table
    const modes = [
        { name: 'SET',    cond: 'S=1, R=0', qVal: 1, qBarVal: 0, desc: 'Output "diset" ke 1' },
        { name: 'RESET',  cond: 'S=0, R=1', qVal: 0, qBarVal: 1, desc: 'Output "direset" ke 0' },
        { name: 'HOLD',   cond: 'S=0, R=0', qVal: null, qBarVal: null, desc: 'Q, Q\' = TETAP (nilai sebelumnya)' },
        { name: 'INVALID', cond: 'S=1, R=1', qVal: 0, qBarVal: 0, desc: 'Kondisi terlarang, keduanya 0' },
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
                <span style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 14, fontWeight: 700, color: '#ffffff', textShadow: '0 0 4px rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.15)' }}>15</span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: isActive ? themeColor : '#334155', boxShadow: isActive ? `0 0 8px ${themeColor}` : 'none', transition: 'all 0.3s' }} />
                <span style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 800, fontSize: 13, color: isActive ? themeColor : '#e2e8f0' }}>SR Latch</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}><HeartButton /><span style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: '5px 12px', borderRadius: 6, backgroundColor: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.5)', color: '#D946EF' }}>INSANE</span></div>
        </div>

        {/* Diagram */}
        <CircuitDiagram_SRLatch
            s={inputS} r={inputR} q={q} qBar={qBar} mode={mode}
            onToggleS={() => setInputS(v => !v)}
            onToggleR={() => setInputR(v => !v)}
        />

        {/* Status bar */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '10px 0 8px', fontFamily: 'Orbitron,sans-serif', fontSize: 10, color: '#475569', flexWrap: 'wrap' }}>
            <span style={{ color: inputS ? '#4ade80' : '#475569' }}>S={inputS ? 1 : 0}</span>
            <span>,</span>
            <span style={{ color: inputR ? '#22d3ee' : '#475569' }}>R={inputR ? 1 : 0}</span>
            <span style={{ color: '#334155' }}>{'\u2192'}</span>
            <span style={{ color: q ? '#4ade80' : '#334155', fontWeight: 700 }}>Q={q ? 1 : 0}</span>
            <span>,</span>
            <span style={{ color: qBar ? '#f472b6' : '#334155', fontWeight: 700 }}>Q'={qBar ? 1 : 0}</span>
            <span style={{ marginLeft: 4, padding: '2px 8px', borderRadius: 4, backgroundColor: mode === 'SET' ? 'rgba(74,222,128,0.18)' : mode === 'RESET' ? 'rgba(34,211,238,0.18)' : mode === 'HOLD' ? 'rgba(250,204,21,0.18)' : 'rgba(239,68,68,0.18)', color: mode === 'SET' ? '#4ade80' : mode === 'RESET' ? '#22d3ee' : mode === 'HOLD' ? '#facc15' : '#ef4444', fontWeight: 700, fontSize: 9 }}>{mode}</span>
        </div>

        {/* Description */}
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontFamily: 'Inter,sans-serif', lineHeight: 1.6 }}>SR Latch adalah rangkaian <b>sekuensial pertama</b> — berbeda dari semua card sebelumnya yang kombinasional, SR Latch punya "ingatan". Dua gerbang NOR saling silang (cross-coupled) membentuk feedback loop: output Q tetap menyala bahkan setelah input S kembali ke 0 (mode HOLD). Ini adalah dasar dari semua Flip-Flop dan Register di komputer modern. Struktur ini juga identik dengan "debouncer" di dunia nyata — rangkaian pembersih sinyal saklar yang mantul-mantul.</p>

        {/* 4-Mode Table */}
        <div style={{ marginTop: 10, borderTop: '1px solid #1e293b', paddingTop: 10 }}>
            <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 6, letterSpacing: '0.5px' }}>TABEL MODE</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, fontFamily: 'Orbitron,sans-serif' }}>
                <thead><tr style={{ borderBottom: '2px solid #1e293b' }}>
                    <th style={{ padding: '4px 6px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 9 }}>Mode</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: 9 }}>Kondisi</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: 9 }}>Q</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: 9 }}>Q'</th>
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
