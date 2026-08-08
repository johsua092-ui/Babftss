import { useState } from 'react';
import CircuitDiagram_FullAdder4bit from './CircuitDiagram_FullAdder4bit';
import { hexToRgbStr } from '../utils/colorHelper';
import HeartButton from './HeartButton';

export default function CircuitCard_FullAdder4bit() {
    const [inputA0, setInputA0] = useState(false);
    const [inputA1, setInputA1] = useState(false);
    const [inputA2, setInputA2] = useState(false);
    const [inputA3, setInputA3] = useState(false);
    const [inputB0, setInputB0] = useState(false);
    const [inputB1, setInputB1] = useState(false);
    const [inputB2, setInputB2] = useState(false);
    const [inputB3, setInputB3] = useState(false);
    const [inputCin, setInputCin] = useState(false);

    // Compute binary values
    const a0 = inputA0 ? 1 : 0;
    const a1 = inputA1 ? 1 : 0;
    const a2 = inputA2 ? 1 : 0;
    const a3 = inputA3 ? 1 : 0;
    const b0 = inputB0 ? 1 : 0;
    const b1 = inputB1 ? 1 : 0;
    const b2 = inputB2 ? 1 : 0;
    const b3 = inputB3 ? 1 : 0;
    const cinVal = inputCin ? 1 : 0;

    // Decimal values
    const aDec = a3 * 8 + a2 * 4 + a1 * 2 + a0;
    const bDec = b3 * 8 + b2 * 4 + b1 * 2 + b0;

    // 4-bit ripple carry addition
    const total = aDec + bDec + cinVal;
    const sumDec = total & 0xF;  // lower 4 bits
    const coutVal = total > 15 ? true : false;  // 5th bit

    // Individual sum bits (LSB first)
    const sum0 = !!(sumDec & 1);
    const sum1 = !!(sumDec & 2);
    const sum2 = !!(sumDec & 4);
    const sum3 = !!(sumDec & 8);

    // Individual carry bits between stages
    const stage0total = a0 + b0 + cinVal;
    const c1 = stage0total > 1 ? true : false;
    const stage1total = a1 + b1 + (c1 ? 1 : 0);
    const c2 = stage1total > 1 ? true : false;
    const stage2total = a2 + b2 + (c2 ? 1 : 0);
    const c3 = stage2total > 1 ? true : false;
    // c3 is actually the carry INTO stage 3; cout is the carry OUT of stage 3

    // Theme
    const themeColor = "#E30B5D";
    const themeRgb = hexToRgbStr(themeColor);
    const isActive = aDec > 0 || bDec > 0 || cinVal > 0;

    // Binary digit renderer: 1 = red neon, 0 = white
    const bd = (bit) => bit
        ? <span style={{ color: themeColor, textShadow: "0 0 6px rgba(227,11,93,0.9), 0 0 14px rgba(227,11,93,0.5)" }}>1</span>
        : <span style={{ color: "#e2e8f0" }}>0</span>;

    return <div style={{
        backgroundColor: "#0e1420",
        border: isActive ? "rgba(" + themeRgb + ",0.4)" : "#1e293b",
        borderRadius: 16, padding: "18px 14px",
        boxShadow: isActive ? "0 0 24px rgba(" + themeRgb + ",0.18)" : "none",
        transition: "all 0.4s ease"
    }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 14, fontWeight: 700, color: "#ffffff", textShadow: "0 0 4px rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.15)" }}>10</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: isActive ? themeColor : "#334155", boxShadow: isActive ? "0 0 8px " + themeColor : "none", transition: "all 0.3s" }} />
                <span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 13, color: isActive ? themeColor : "#e2e8f0" }}>Full Adder 4-bit</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}><HeartButton /><span style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "5px 12px", borderRadius: 6, backgroundColor: "rgba(227,11,93,0.18)", border: "1px solid rgba(227,11,93,0.4)", color: "#fda4af" }}>HARD</span></div>
        </div>

        {/* Diagram */}
        <CircuitDiagram_FullAdder4bit
            a0={inputA0} a1={inputA1} a2={inputA2} a3={inputA3}
            b0={inputB0} b1={inputB1} b2={inputB2} b3={inputB3}
            cin={inputCin}
            sum0={sum0} sum1={sum1} sum2={sum2} sum3={sum3}
            cout={coutVal} c1={c1} c2={c2} c3={c3}
            onToggleA0={() => setInputA0(v => !v)}
            onToggleA1={() => setInputA1(v => !v)}
            onToggleA2={() => setInputA2(v => !v)}
            onToggleA3={() => setInputA3(v => !v)}
            onToggleB0={() => setInputB0(v => !v)}
            onToggleB1={() => setInputB1(v => !v)}
            onToggleB2={() => setInputB2(v => !v)}
            onToggleB3={() => setInputB3(v => !v)}
            onToggleCin={() => setInputCin(v => !v)}
        />

        {/* Status bar */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "10px 0 8px", fontFamily: "Orbitron,sans-serif", fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
            <span style={{ color: isActive ? themeColor : "#475569" }}>A={aDec}</span>
            <span>+</span>
            <span style={{ color: isActive ? themeColor : "#475569" }}>B={bDec}</span>
            <span>+</span>
            <span style={{ color: inputCin ? themeColor : "#475569" }}>Cin={cinVal}</span>
            <span style={{ color: "#334155" }}>{"\u2192"}</span>
            <span style={{ color: isActive ? themeColor : "#334155", fontWeight: 700 }}>SUM={sumDec}</span>
            <span>.</span>
            <span style={{ color: coutVal ? themeColor : "#334155", fontWeight: 700 }}>Cout={coutVal ? 1 : 0}</span>
        </div>

        {/* Description */}
        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>Full Adder 4-bit adalah penjumlah biner 4-bit yang dibangun dari empat buah Full Adder 1-bit (Card 09) yang dirangkai berantai dalam konsep ripple-carry. Carry-out dari setiap blok menjadi carry-in untuk blok berikutnya, sehingga bit carry "mengalir" dari LSB (bit paling rendah) ke MSB (bit paling tinggi). Klik kotak "Full Adder 1 Bit" manapun untuk melihat rangkaian gerbang aslinya.</p>

        {/* Compact status (no 512-row truth table — precedent for complex cards) */}
        <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
            <div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 6, letterSpacing: "0.5px" }}>STATUS PENJUMLAHAN</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, fontFamily: "Orbitron,sans-serif", fontSize: 9 }}>
                <div style={{ textAlign: "center", padding: "6px 4px", borderRadius: 8, backgroundColor: "rgba(227,11,93,0.08)", border: "1px solid rgba(227,11,93,0.2)" }}>
                    <div style={{ color: "#64748b", fontSize: 8, marginBottom: 3 }}>A (input 1)</div>
                    <div style={{ fontWeight: 700, fontSize: 11 }}>{bd(a3)}{bd(a2)}{bd(a1)}{bd(a0)}</div>
                </div>
                <div style={{ textAlign: "center", padding: "6px 4px", borderRadius: 8, backgroundColor: "rgba(227,11,93,0.08)", border: "1px solid rgba(227,11,93,0.2)" }}>
                    <div style={{ color: "#64748b", fontSize: 8, marginBottom: 3 }}>B (input 2)</div>
                    <div style={{ fontWeight: 700, fontSize: 11 }}>{bd(b3)}{bd(b2)}{bd(b1)}{bd(b0)}</div>
                </div>
                <div style={{ textAlign: "center", padding: "6px 4px", borderRadius: 8, backgroundColor: "rgba(227,11,93,0.08)", border: "1px solid rgba(227,11,93,0.2)" }}>
                    <div style={{ color: "#64748b", fontSize: 8, marginBottom: 3 }}>SUM (Binary Number)</div>
                    <div style={{ fontWeight: 700, fontSize: 11 }}>{bd(sum3)}{bd(sum2)}{bd(sum1)}{bd(sum0)}</div>
                </div>
                <div style={{ textAlign: "center", padding: "6px 4px", borderRadius: 8, backgroundColor: "rgba(227,11,93,0.08)", border: "1px solid rgba(227,11,93,0.2)" }}>
                    <div style={{ color: "#64748b", fontSize: 8, marginBottom: 3 }}>SUM (Decimal Number)</div>
                    <div style={{ color: isActive ? themeColor : "#e2e8f0", fontWeight: 700, fontSize: 11, textShadow: isActive ? "0 0 6px rgba(227,11,93,0.9), 0 0 14px rgba(227,11,93,0.5)" : "none" }}>{sumDec}{coutVal ? "+" : ""}</div>
                </div>
            </div>
        </div>
    </div>;
}
