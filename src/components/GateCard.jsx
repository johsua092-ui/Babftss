import { useState } from 'react';
import GateDiagram from './GateDiagram';
import { computeGateOutput } from '../data/gateLogic';
import { hexToRgbStr } from '../utils/colorHelper';
import { Fragment } from 'react';

export default function GateCard({ config }) {
    const [a, setA] = useState(false), [f, setF] = useState(false), l = computeGateOutput(config.type, a, f), c = hexToRgbStr(config.color);
    return <div style={{
        backgroundColor: "#0e1420",
        border: "1px solid #1e293b",
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        width: 360,
        fontFamily: "Inter, sans-serif"
    }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 18 }}>{config.name}</span>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                {config.icon === 'cpu' ? (
                    <>
                        <rect x="4" y="4" width="16" height="16" rx="2"/>
                        <rect x="9" y="9" width="6" height="6"/>
                        <line x1="9" y1="1" x2="9" y2="4"/>
                        <line x1="15" y1="1" x2="15" y2="4"/>
                        <line x1="9" y1="20" x2="9" y2="23"/>
                        <line x1="15" y1="20" x2="15" y2="23"/>
                        <line x1="20" y1="9" x2="23" y2="9"/>
                        <line x1="20" y1="14" x2="23" y2="14"/>
                        <line x1="1" y1="9" x2="4" y2="9"/>
                        <line x1="1" y1="14" x2="4" y2="14"/>
                    </>
                ) : (
                    <>
                        <path d="M4 4h16v16H4z"/>
                        <path d="M12 8v8M8 12h8"/>
                    </>
                )}
            </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {['Input A', 'Input B'].map((lbl, i) => (
                <div key={i}>
                    <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 3 }}>{lbl}</div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div
                            onClick={() => i === 0 ? setA(!a) : setF(!f)}
                            style={{
                                width: 56,
                                height: 30,
                                borderRadius: 15,
                                backgroundColor: (i === 0 ? a : f) ? config.color : "#1a2332",
                                border: `1px solid ${(i === 0 ? a : f) ? config.color : "#334155"}`,
                                display: "flex",
                                alignItems: "center",
                                padding: "0 4px",
                                cursor: "pointer",
                                transition: "all 0.15s"
                            }}
                        >
                            <div style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                backgroundColor: "#fff",
                                marginLeft: (i === 0 ? a : f) ? 26 : 0,
                                transition: "margin-left 0.15s"
                            }}/>
                        </div>
                        <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>
                            {(i === 0 ? a : f) ? 'TRUE (1)' : 'FALSE (0)'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
        <svg width="100%" height={80} viewBox="0 0 360 80" style={{ margin: "-4px 0" }}>
            <defs>
                <filter id={`glow-${config.type}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="blur"/>
                    <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <line x1="40" y1="30" x2="120" y2="30" stroke={a ? c : "#334155"} strokeWidth={3} strokeLinecap="round"/>
            <line x1="40" y1="50" x2="120" y2="50" stroke={f ? c : "#334155"} strokeWidth={3} strokeLinecap="round"/>
            <GateDiagram type={config.type} x={180} y={40} fill={config.color}/>
            <line x1="120" y1="30" x2="135" y2="30" stroke={a ? c : "#334155"} strokeWidth={3} strokeLinecap="round"/>
            <line x1="120" y1="50" x2="135" y2="50" stroke={f ? c : "#334155"} strokeWidth={3} strokeLinecap="round"/>
            <line x1="225" y1="40" x2="320" y2="40" stroke={l ? c : "#334155"} strokeWidth={3} strokeLinecap="round" filter={l ? `url(#glow-${config.type})` : undefined}/>
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
                <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 3 }}>Output</div>
                <div style={{ color: l ? config.color : "#64748b", fontSize: 14, fontWeight: 700 }}>
                    {l ? 'TRUE (1)' : 'FALSE (0)'}
                </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "#64748b", fontSize: 10 }}>Logic:</span>
                <svg width={60} height={24} viewBox="0 0 60 24" style={{ backgroundColor: "#1a2332", borderRadius: 6, padding: 2 }}>
                    <text x="30" y="16" textAnchor="middle" fill={config.color} fontSize={10} fontWeight={600} fontFamily="monospace">{config.logicLine}</text>
                </svg>
            </div>
        </div>
    </div>;
}