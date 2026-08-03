import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

export default function CircuitDiagram09({ a, b, cin, sums, carries, onToggleA, onToggleB, onToggleCin }) {
    const xorColor = "#facc15";
    const andColor = "#4ade80";
    const orColor = "#a78bfa";
    const xorRgb = hexToRgbStr(xorColor);
    const andRgb = hexToRgbStr(andColor);
    const orRgb = hexToRgbStr(orColor);

    const wc = (val, col) => val ? col : "#1e293b";
    const inputNodeW = 42, inputNodeH = 38, inputNodeRx = 7;
    const nodeR = 7, outNodeR = 12;
    const faWidth = 80, faHeight = 100;
    const spacing = 20;

    const startX = 60;
    const startY = 40;

    return (
        <svg width="100%" viewBox="0 0 500 200" style={{ backgroundColor: "#0a0f1a", borderRadius: 10, border: "1px solid #1e293b" }}>
            {/* Input A nodes (4 bits) */}
            {[0, 1, 2, 3].map(i => {
                const x = 1;
                const y = 20 + i * 40;
                return (
                    <Fragment key={`a${i}`}>
                        <rect x={x} y={y} width={inputNodeW} height={inputNodeH} rx={inputNodeRx}
                            fill={a[i] ? `rgba(${xorRgb},0.15)` : "#0a0f1a"}
                            stroke={a[i] ? xorColor : "#334155"} strokeWidth="1.5"
                            style={{ cursor: "pointer", transition: "all 0.3s" }}
                            onClick={() => onToggleA && onToggleA(i)} />
                        <text x={x + inputNodeW / 2} y={y + inputNodeH / 2 + 4} textAnchor="middle"
                            fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="700"
                            fill={a[i] ? xorColor : "#475569"} style={{ transition: "fill 0.3s" }}>
                            A[{i}]={a[i] ? "1" : "0"}
                        </text>
                    </Fragment>
                );
            })}

            {/* Input B nodes (4 bits) */}
            {[0, 1, 2, 3].map(i => {
                const x = 1;
                const y = 20 + i * 40 + 160;
                return (
                    <Fragment key={`b${i}`}>
                        <rect x={x} y={y} width={inputNodeW} height={inputNodeH} rx={inputNodeRx}
                            fill={b[i] ? `rgba(${andRgb},0.15)` : "#0a0f1a"}
                            stroke={b[i] ? andColor : "#334155"} strokeWidth="1.5"
                            style={{ cursor: "pointer", transition: "all 0.3s" }}
                            onClick={() => onToggleB && onToggleB(i)} />
                        <text x={x + inputNodeW / 2} y={y + inputNodeH / 2 + 4} textAnchor="middle"
                            fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="700"
                            fill={b[i] ? andColor : "#475569"} style={{ transition: "fill 0.3s" }}>
                            B[{i}]={b[i] ? "1" : "0"}
                        </text>
                    </Fragment>
                );
            })}

            {/* CIN input */}
            <rect x={1} y={90} width={inputNodeW} height={inputNodeH} rx={inputNodeRx}
                fill={cin ? `rgba(${orRgb},0.15)` : "#0a0f1a"}
                stroke={cin ? orColor : "#334155"} strokeWidth="1.5"
                style={{ cursor: "pointer", transition: "all 0.3s" }}
                onClick={onToggleCin} />
            <text x={1 + inputNodeW / 2} y={90 + inputNodeH / 2 + 4} textAnchor="middle"
                fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="700"
                fill={cin ? orColor : "#475569"} style={{ transition: "fill 0.3s" }}>
                CIN={cin ? "1" : "0"}
            </text>

            {/* 4 Full Adders in cascade */}
            {[0, 1, 2, 3].map(i => {
                const faX = startX + i * (faWidth + spacing);
                const faY = startY;
                const carryIn = i === 0 ? cin : carries[i - 1];
                const carryColor = i === 0 ? orColor : andColor;
                const carryRgb = i === 0 ? orRgb : andRgb;

                return (
                    <Fragment key={`fa${i}`}>
                        {/* FA box */}
                        <rect x={faX} y={faY} width={faWidth} height={faHeight} rx={8}
                            fill="#0e1420" stroke="#334155" strokeWidth="1.5" />
                        <text x={faX + faWidth / 2} y={faY + 15} textAnchor="middle"
                            fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="800"
                            fill="#64748b">FA{i}</text>

                        {/* Inputs to FA */}
                        <line x1={inputNodeW + 5} y1={20 + i * 40 + inputNodeH / 2}
                            x2={faX} y2={faY + 30}
                            stroke={wc(a[i], xorColor)} strokeWidth="2" strokeLinecap="round"
                            style={{ transition: "stroke 0.3s" }} />
                        <line x1={inputNodeW + 5} y1={20 + i * 40 + 160 + inputNodeH / 2}
                            x2={faX} y2={faY + 70}
                            stroke={wc(b[i], andColor)} strokeWidth="2" strokeLinecap="round"
                            style={{ transition: "stroke 0.3s" }} />

                        {/* Carry in to FA */}
                        {i > 0 && (
                            <line x1={faX - spacing} y1={faY + 50}
                                x2={faX} y2={faY + 50}
                                stroke={wc(carryIn, carryColor)} strokeWidth="2" strokeLinecap="round"
                                style={{ transition: "stroke 0.3s" }} />
                        )}
                        {i === 0 && (
                            <line x1={inputNodeW + 5} y1={90 + inputNodeH / 2}
                                x2={faX} y2={faY + 50}
                                stroke={wc(cin, orColor)} strokeWidth="2" strokeLinecap="round"
                                style={{ transition: "stroke 0.3s" }} />
                        )}

                        {/* SUM output */}
                        <line x1={faX + faWidth} y1={faY + 30}
                            x2={faX + faWidth + 15} y2={faY + 30}
                            stroke={wc(sums[i], xorColor)} strokeWidth="2.5" strokeLinecap="round"
                            style={{ transition: "stroke 0.3s" }} />
                        <circle cx={faX + faWidth + 15} cy={faY + 30} r={outNodeR}
                            fill={sums[i] ? xorColor : "#1e293b"}
                            stroke={sums[i] ? xorColor : "#334155"} strokeWidth="2"
                            style={{ filter: sums[i] ? `drop-shadow(0 0 8px rgba(${xorRgb},0.9))` : "none", transition: "all 0.3s" }} />
                        <text x={faX + faWidth + 15} y={faY + 30 + 4} textAnchor="middle"
                            fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="bold"
                            fill={sums[i] ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>
                            {sums[i] ? "1" : "0"}
                        </text>
                        <text x={faX + faWidth + 15} y={faY + 30 - outNodeR - 3} textAnchor="middle"
                            fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="0.5">
                            S{i}
                        </text>

                        {/* Carry out from FA */}
                        {i < 3 && (
                            <line x1={faX + faWidth} y1={faY + 50}
                                x2={faX + faWidth + spacing} y2={faY + 50}
                                stroke={wc(carries[i], andColor)} strokeWidth="2" strokeLinecap="round"
                                style={{ transition: "stroke 0.3s" }} />
                        )}
                        {i === 3 && (
                            <>
                                <line x1={faX + faWidth} y1={faY + 50}
                                    x2={faX + faWidth + 20} y2={faY + 50}
                                    stroke={wc(carries[3], orColor)} strokeWidth="2.5" strokeLinecap="round"
                                    style={{ transition: "stroke 0.3s" }} />
                                <circle cx={faX + faWidth + 20} cy={faY + 50} r={outNodeR}
                                    fill={carries[3] ? orColor : "#1e293b"}
                                    stroke={carries[3] ? orColor : "#334155"} strokeWidth="2"
                                    style={{ filter: carries[3] ? `drop-shadow(0 0 8px rgba(${orRgb},0.9))` : "none", transition: "all 0.3s" }} />
                                <text x={faX + faWidth + 20} y={faY + 50 + 4} textAnchor="middle"
                                    fontFamily="Orbitron,sans-serif" fontSize="9" fontWeight="bold"
                                    fill={carries[3] ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>
                                    {carries[3] ? "1" : "0"}
                                </text>
                                <text x={faX + faWidth + 20} y={faY + 50 - outNodeR - 3} textAnchor="middle"
                                    fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="0.5">
                                    COUT
                                </text>
                            </>
                        )}
                    </Fragment>
                );
            })}
        </svg>
    );
}
