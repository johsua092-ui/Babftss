import { useState } from 'react';
import GateDiagram from './GateDiagram';
import { computeGateOutput } from '../data/gateLogic';
import { hexToRgbStr } from '../utils/colorHelper';

export default function GateCard({ config }) {
    const [a, setA] = useState(false);
    const [b, setB] = useState(false);
    const output = computeGateOutput(config.type, a, b);
    const rgb = hexToRgbStr(config.color);

    // Truth table rows
    const rows = config.dualInput
        ? [
            { a: false, b: false },
            { a: false, b: true },
            { a: true, b: false },
            { a: true, b: true },
          ]
        : [
            { a: false },
            { a: true },
          ];

    // Status line text
    const statusText = config.dualInput
        ? `A=${a ? 1 : 0}  B=${b ? 1 : 0}  ->  OUT=${output ? 1 : 0}`
        : `A=${a ? 1 : 0}  ->  OUT=${output ? 1 : 0}`;

    return (
        <div style={{
            backgroundColor: '#0e1420',
            border: '1px solid #1e293b',
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            fontFamily: 'Inter, sans-serif',
        }}>
            {/* 1. Header: <nomor> ● <Nama Gate> */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, fontFamily: 'Orbitron, sans-serif', letterSpacing: 1, textShadow: '0 0 6px rgba(255,255,255,0.7), 0 0 12px rgba(255,255,255,0.4)' }}>
                    {String(config.id).padStart(2, '0')}
                </span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: config.color, boxShadow: `0 0 6px ${config.color}`, flexShrink: 0 }} />
                <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16, fontFamily: 'Orbitron, sans-serif', letterSpacing: 0.3 }}>
                    {config.name}
                </span>
            </div>

            {/* 2. Diagram sirkuit */}
            <GateDiagram
                type={config.type}
                dualInput={config.dualInput}
                a={a}
                b={b}
                output={output}
                onToggleA={() => setA(!a)}
                onToggleB={() => setB(!b)}
                color={config.color}
            />

            {/* 3. Baris status */}
            <div style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: 11,
                color: output ? config.color : '#64748b',
                fontWeight: 600,
                letterSpacing: 0.5,
                textAlign: 'center',
                transition: 'color 0.3s',
            }}>
                {statusText}
            </div>

            {/* 4. Deskripsi satu kalimat */}
            <p style={{
                margin: 0,
                fontSize: 12,
                color: '#94a3b8',
                lineHeight: 1.6,
            }}>
                {config.description}
            </p>

            {/* 5. Truth table dengan highlight baris dinamis */}
            <div style={{
                borderRadius: 10,
                border: '1px solid #1e293b',
                overflow: 'hidden',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Orbitron, sans-serif' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#0f172a' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: 700, fontSize: 10, letterSpacing: 1, borderBottom: '1px solid #1e293b' }}>A</th>
                            {config.dualInput && <th style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: 700, fontSize: 10, letterSpacing: 1, borderBottom: '1px solid #1e293b' }}>B</th>}
                            <th style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: 700, fontSize: 10, letterSpacing: 1, borderBottom: '1px solid #1e293b' }}>OUT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => {
                            const rowOutput = computeGateOutput(config.type, row.a, row.b);
                            const isActive = row.a === a && (!config.dualInput || row.b === b);
                            return (
                                <tr key={i} style={{
                                    backgroundColor: isActive ? `rgba(${rgb}, 0.18)` : 'transparent',
                                    transition: 'background-color 0.3s',
                                }}>
                                    <td style={{
                                        padding: '7px 12px',
                                        textAlign: 'center',
                                        color: isActive ? config.color : '#94a3b8',
                                        fontWeight: isActive ? 700 : 400,
                                        transition: 'color 0.3s',
                                        borderBottom: i < rows.length - 1 ? '1px solid #1e293b' : 'none',
                                    }}>
                                        {row.a ? 1 : 0}
                                    </td>
                                    {config.dualInput && <td style={{
                                        padding: '7px 12px',
                                        textAlign: 'center',
                                        color: isActive ? config.color : '#94a3b8',
                                        fontWeight: isActive ? 700 : 400,
                                        transition: 'color 0.3s',
                                        borderBottom: i < rows.length - 1 ? '1px solid #1e293b' : 'none',
                                    }}>
                                        {row.b ? 1 : 0}
                                    </td>}
                                    <td style={{
                                        padding: '7px 12px',
                                        textAlign: 'center',
                                        color: isActive ? config.color : '#94a3b8',
                                        fontWeight: isActive ? 700 : 400,
                                        transition: 'color 0.3s',
                                        borderBottom: i < rows.length - 1 ? '1px solid #1e293b' : 'none',
                                    }}>
                                        {rowOutput ? 1 : 0}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
