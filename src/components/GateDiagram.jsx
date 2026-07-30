import { hexToRgbStr } from '../utils/colorHelper';
import { Fragment } from 'react';

export default function GateDiagram({ type, dualInput, a, b, output, onToggleA, onToggleB, color }) {
    const r = hexToRgbStr(color),
        p = _ => _ ? color : "#1e293b",
        x = _ => _ ? `rgba(${r},0.2)` : "#0f172a",
        g = _ => _ ? color : "#334155",
        S = output ? color : "#475569",
        j = output ? `rgba(${r},0.13)` : "#0f172a",
        M = output ? `drop-shadow(0 0 4px rgba(${r},0.9)) drop-shadow(0 0 10px rgba(${r},0.5))` : "none",
        T = dualInput ? 92 : 62,
        k = dualInput ? 22 : 31,
        R = 70,
        L = dualInput ? 46 : 31,
        C = 88,
        N = dualInput ? 10 : 3,
        q = dualInput ? 82 : 59,
        I = q - N,
        P = 5;
    let Q = null,
        at = C + 60;
    const tt = 10,
        ht = _ => dualInput ? <Fragment>
            <line x1={_} y1={k} x2={_ + tt} y2={k} stroke={S} strokeWidth="1.2" opacity="0.45" />
            <line x1={_} y1={R} x2={_ + tt} y2={R} stroke={S} strokeWidth="1.2" opacity="0.45" />
        </Fragment> : null;
    switch (type) {
        case "wire": {
            at = 48;
            break
        }
        case "not": {
            const _ = C + 54;
            at = _ + P * 2 + 1; Q = <Fragment>
                <polygon points={`${C},${N} ${C},${q} ${_},${L}`} fill={j} stroke={S} strokeWidth="2" style={{ filter: M, transition: "all 0.3s" }} />
                <circle cx={_ + P} cy={L} r={P} fill={j} stroke={S} strokeWidth="2" style={{ filter: M, transition: "all 0.3s" }} />
            </Fragment>;
            break
        }
        case "and": {
            const _ = C + 26,
                Z = I / 2;
            at = _ + Z; Q = <Fragment>
                <path d={`M ${C},${N} L ${_},${N} A ${Z},${Z} 0 0,1 ${_},${q} L ${C},${q} Z`} fill={j} stroke={S} strokeWidth="2" style={{ filter: M, transition: "all 0.3s" }} />
                {ht(C)}
            </Fragment>;
            break
        }
        case "nand": {
            const _ = C + 22,
                Z = I / 2,
                it = _ + Z;
            at = it + P * 2 + 1; Q = <Fragment>
                <path d={`M ${C},${N} L ${_},${N} A ${Z},${Z} 0 0,1 ${_},${q} L ${C},${q} Z`} fill={j} stroke={S} strokeWidth="2" style={{ filter: M, transition: "all 0.3s" }} />
                <circle cx={it + P} cy={L} r={P} fill={j} stroke={S} strokeWidth="2" style={{ filter: M, transition: "all 0.3s" }} />
                {ht(C)}
            </Fragment>;
            break
        }
        case "or": {
            const _ = C + 70;
            at = _;
            const Z = [`M ${C},${N}`, `C ${C+22},${N}   ${_-18},${L-16} ${_},${L}`, `C ${_-18},${L+16} ${C+22},${q}  ${C},${q}`, `C ${C+15},${L+9}  ${C+15},${L-9} ${C},${N}`, "Z"].join(" ");
            Q = <Fragment>
                <path d={Z} fill={j} stroke={S} strokeWidth="2" style={{ filter: M, transition: "all 0.3s" }} />
                {ht(C + 8)}
            </Fragment>;
            break
        }
        case "nor": {
            const _ = C + 65,
                Z = _ + P;
            at = Z + P + 1;
            const it = [`M ${C},${N}`, `C ${C+22},${N}   ${_-18},${L-16} ${_},${L}`, `C ${_-18},${L+16} ${C+22},${q}  ${C},${q}`, `C ${C+15},${L+9}  ${C+15},${L-9} ${C},${N}`, "Z"].join(" ");
            Q = <Fragment>
                <path d={it} fill={j} stroke={S} strokeWidth="2" style={{ filter: M, transition: "all 0.3s" }} />
                <circle cx={Z} cy={L} r={P} fill={j} stroke={S} strokeWidth="2" style={{ filter: M, transition: "all 0.3s" }} />
                {ht(C + 8)}
            </Fragment>;
            break
        }
        case "xor": {
            const _ = C + 70;
            at = _;
            const Z = C - 9,
                it = [`M ${C},${N}`, `C ${C+22},${N}   ${_-18},${L-16} ${_},${L}`, `C ${_-18},${L+16} ${C+22},${q}  ${C},${q}`, `C ${C+15},${L+9}  ${C+15},${L-9} ${C},${N}`, "Z"].join(" "),
                E = `M ${Z},${N} C ${Z+13},${L-9} ${Z+13},${L+9} ${Z},${q}`;
            Q = <Fragment>
                <path d={E} fill="none" stroke={S} strokeWidth="2" style={{ transition: "stroke 0.3s" }} />
                <path d={it} fill={j} stroke={S} strokeWidth="2" style={{ filter: M, transition: "all 0.3s" }} />
                {ht(C + 8)}
            </Fragment>;
            break
        }
        case "xnor": {
            const _ = C + 65,
                Z = _ + P;
            at = Z + P + 1;
            const it = C - 9,
                E = [`M ${C},${N}`, `C ${C+22},${N}   ${_-18},${L-16} ${_},${L}`, `C ${_-18},${L+16} ${C+22},${q}  ${C},${q}`, `C ${C+15},${L+9}  ${C+15},${L-9} ${C},${N}`, "Z"].join(" "),
                H = `M ${it},${N} C ${it+13},${L-9} ${it+13},${L+9} ${it},${q}`;
            Q = <Fragment>
                <path d={H} fill="none" stroke={S} strokeWidth="2" style={{ transition: "stroke 0.3s" }} />
                <path d={E} fill={j} stroke={S} strokeWidth="2" style={{ filter: M, transition: "all 0.3s" }} />
                <circle cx={Z} cy={L} r={P} fill={j} stroke={S} strokeWidth="2" style={{ filter: M, transition: "all 0.3s" }} />
                {ht(C + 8)}
            </Fragment>;
            break
        }
    }
    const dt = 13,
        bt = type === "wire" ? 168 : at + 34,
        Bt = bt + dt + 8,
        St = type === "xor" || type === "xnor" ? C - 9 : C,
        O = type === "or" || type === "nor" ? C : St;
    return <svg viewBox={`0 0 ${Bt} ${T}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        <g onClick={onToggleA} style={{ cursor: "pointer" }}>
            <rect x="1" y={k - 21} width="46" height="42" rx="7" fill={x(a)} stroke={g(a)} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x="24" y={k - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">A</text>
            <circle cx="24" cy={k} r="8" fill={a ? color : "#1e293b"} stroke={a ? color : "#334155"} strokeWidth="1.5" style={{ filter: a ? `drop-shadow(0 0 5px rgba(${r},0.8))` : "none", transition: "all 0.25s" }} />
            <text x="24" y={k + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={a ? color : "#475569"}>{a ? "1" : "0"}</text>
        </g>
        {dualInput && <g onClick={onToggleB} style={{ cursor: "pointer" }}>
            <rect x="1" y={R - 21} width="46" height="42" rx="7" fill={x(b)} stroke={g(b)} strokeWidth="1.5" style={{ transition: "all 0.25s" }} />
            <text x="24" y={R - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">B</text>
            <circle cx="24" cy={R} r="8" fill={b ? color : "#1e293b"} stroke={b ? color : "#334155"} strokeWidth="1.5" style={{ filter: b ? `drop-shadow(0 0 5px rgba(${r},0.8))` : "none", transition: "all 0.25s" }} />
            <text x="24" y={R + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={b ? color : "#475569"}>{b ? "1" : "0"}</text>
        </g>}
        {type === "wire" ? <line x1="48" y1={L} x2={bt - dt} y2={L} stroke={p(a)} strokeWidth="3" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} /> : <Fragment>
            <line x1="48" y1={k} x2={O} y2={k} stroke={p(a)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
            {dualInput && <line x1="48" y1={R} x2={O} y2={R} stroke={p(b)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />}
        </Fragment>}
        {Q}
        {type !== "wire" && <line x1={at} y1={L} x2={bt - dt} y2={L} stroke={p(output)} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />}
        <text x={bt} y={L - dt - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">OUT</text>
        <circle cx={bt} cy={L} r={dt} fill={output ? color : "#1e293b"} stroke={output ? color : "#334155"} strokeWidth="2" style={{ filter: output ? `drop-shadow(0 0 8px rgba(${r},0.9)) drop-shadow(0 0 18px rgba(${r},0.5))` : "none", transition: "all 0.3s" }} />
        <text x={bt} y={L + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={output ? "#000" : "#475569"} style={{ transition: "fill 0.3s" }}>{output ? "1" : "0"}</text>
    </svg>;
}
