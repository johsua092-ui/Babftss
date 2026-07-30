import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { gateData } from '../data/gateData'

function computeOutput(type, inputA, inputB) {
  switch (type) {
    case "wire": return inputA
    case "not": return !inputA
    case "and": return inputA && inputB
    case "nand": return !(inputA && inputB)
    case "or": return inputA || inputB
    case "nor": return !(inputA || inputB)
    case "xor": return inputA !== inputB
    case "xnor": return inputA === inputB
    default: return false
  }
}

function GateCard({ gate, index }) {
  const [inputA, setInputA] = useState(false)
  const [inputB, setInputB] = useState(false)

  const out = computeOutput(gate.type, inputA, inputB)

  const rgb = `${parseInt(gate.color.slice(1, 3), 16)},${parseInt(gate.color.slice(3, 5), 16)},${parseInt(gate.color.slice(5, 7), 16)}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      style={{
        backgroundColor: "#1e293b",
        border: "1px solid rgba(100,116,139,0.28)",
        borderRadius: 16,
        padding: 14,
        marginBottom: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: 1.5,
            padding: "4px 10px",
            borderRadius: 6,
            backgroundColor: "rgba(100,116,139,0.15)",
            border: "1px solid rgba(100,116,139,0.3)",
            color: "#94a3b8",
          }}>
            {String(gate.id).padStart(2, "0")}
          </span>
          {gate.dualInput ? (
            <span style={{ fontSize: 10, fontWeight: 600, color: gate.color, fontFamily: "Orbitron, sans-serif" }}>{gate.name}</span>
          ) : (
            <span style={{ fontSize: 10, fontWeight: 600, color: gate.color, fontFamily: "Orbitron, sans-serif" }}>{gate.name}</span>
          )}
        </div>
      </div>

      {/* Interactive SVG Visualization */}
      <div style={{
        display: "flex",
        alignItems: "stretch",
        gap: 6,
        minHeight: 120,
        borderRadius: 12,
        backgroundColor: "#0f172a",
        padding: 10,
      }}>
        {/* Input A */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, color: inputA ? gate.color : "#475569", fontWeight: 600, fontFamily: "Orbitron, sans-serif", transition: "color 0.2s" }}>A</span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setInputA(v => !v)}
            style={{
              width: 36, height: 36, borderRadius: 8,
              backgroundColor: inputA ? gate.color : "#1e293b",
              border: `1px solid ${inputA ? gate.color : "#334155"}`,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
              boxShadow: inputA ? `0 0 12px rgba(${rgb},0.4)` : "none",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: inputA ? "#0f172a" : "#475569" }}>
              {inputA ? "1" : "0"}
            </span>
          </motion.button>
        </div>

        {/* Wire / Gate symbol */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="100%" height="60" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">
            {/* Input A wire */}
            <line x1="0" y1="20" x2="30" y2="20" stroke={inputA ? gate.color : "#334155"} strokeWidth="2" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
            
            {/* Input B wire */}
            {gate.dualInput && (
              <line x1="0" y1="40" x2="30" y2="40" stroke={inputB ? gate.color : "#334155"} strokeWidth="2" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
            )}
            
            {/* Gate body */}
            <rect x="30" y={gate.dualInput ? "10" : "12"} width="40" height={gate.dualInput ? "40" : "36"} rx="6" fill="none" stroke={gate.color} strokeWidth="2" opacity="0.5" />
            <text x="50" y={gate.dualInput ? "35" : "34"} textAnchor="middle" fill={gate.color} fontSize="12" fontWeight="700" fontFamily="Orbitron, sans-serif" opacity="0.8">
              {gate.label}
            </text>
            
            {/* Output wire */}
            <line x1="70" y1="30" x2="100" y2="30" stroke={out ? gate.color : "#334155"} strokeWidth="2" strokeLinecap="round" style={{ transition: "stroke 0.3s" }} />
          </svg>
        </div>

        {/* Input B (if dual) */}
        {gate.dualInput ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: inputB ? gate.color : "#475569", fontWeight: 600, fontFamily: "Orbitron, sans-serif", transition: "color 0.2s" }}>B</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setInputB(v => !v)}
              style={{
                width: 36, height: 36, borderRadius: 8,
                backgroundColor: inputB ? gate.color : "#1e293b",
                border: `1px solid ${inputB ? gate.color : "#334155"}`,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
                boxShadow: inputB ? `0 0 12px rgba(${rgb},0.4)` : "none",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: inputB ? "#0f172a" : "#475569" }}>
                {inputB ? "1" : "0"}
              </span>
            </motion.button>
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        {/* Output */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, color: out ? gate.color : "#475569", fontWeight: 600, fontFamily: "Orbitron, sans-serif", transition: "color 0.2s" }}>OUT</span>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            backgroundColor: out ? gate.color : "#0f172a",
            border: `2px solid ${out ? gate.color : "#334155"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.3s",
            boxShadow: out ? `0 0 16px rgba(${rgb},0.5)` : "none",
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: out ? "#0f172a" : "#475569" }}>
              {out ? "1" : "0"}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
        {gate.description}
      </p>

      {/* CARA KERJA section */}
      <div style={{ marginTop: 6 }}>
        <p style={{
          margin: 0, fontSize: 9, fontWeight: 700, color: "#475569",
          letterSpacing: "0.5px", marginBottom: 6, textAlign: "center",
          fontFamily: "Orbitron, sans-serif",
        }}>
          CARA KERJA
        </p>
        <p style={{
          margin: 0, fontSize: 10, color: "#64748b", lineHeight: 1.6,
          fontFamily: "Orbitron, sans-serif", textAlign: "center",
        }}>
          Gate mengolah sinyal sesuai aturannya dan memutuskan output-nya.
        </p>
        <p style={{
          margin: "4px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.5,
        }}>
          <span style={{ color: "#64748b" }}>Tekan tombol </span>
          <span style={{ color: inputA ? gate.color : "#64748b" }}>A</span>
          {gate.dualInput && (
            <>
              <span style={{ color: "#64748b" }}> atau </span>
              <span style={{ color: inputB ? gate.color : "#64748b" }}>B</span>
            </>
          )}
          <span style={{ color: "#64748b" }}> pada setiap gerbang untuk melihat bagaimana sinyal mengalir secara langsung. Gerbang berpendar saat outputnya aktif.</span>
        </p>
      </div>

      {/* TABEL KEBENARAN */}
      <div>
        <p style={{
          margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "#475569",
          letterSpacing: "0.5px", fontFamily: "Orbitron, sans-serif",
        }}>
          TABEL KEBENARAN
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Orbitron, sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #334155" }}>
              <th style={{ padding: "4px 6px", color: "#64748b", fontWeight: 600, fontSize: 10 }}>A</th>
              {gate.dualInput && <th style={{ padding: "4px 6px", color: "#64748b", fontWeight: 600, fontSize: 10 }}>B</th>}
              <th style={{ padding: "4px 6px", color: "#64748b", fontWeight: 600, fontSize: 10 }}>OUT</th>
            </tr>
          </thead>
          <tbody>
            {gate.type === "wire" ? (
              <>
                {[[0, 0], [1, 1]].map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1e293b", backgroundColor: (i === 0 && !inputA) || (i === 1 && inputA) ? "rgba(96,165,250,0.08)" : "transparent" }}>
                    <td style={{ padding: "3px 6px", textAlign: "center", color: row[0] ? "#60a5fa" : "#475569" }}>{row[0]}</td>
                    <td style={{ padding: "3px 6px", textAlign: "center", color: row[1] ? "#60a5fa" : "#475569" }}>{row[1]}</td>
                  </tr>
                ))}
              </>
            ) : gate.type === "not" ? (
              <>
                {[[0, 1], [1, 0]].map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1e293b", backgroundColor: (i === 0 && !inputA) || (i === 1 && inputA) ? `rgba(${rgb},0.08)` : "transparent" }}>
                    <td style={{ padding: "3px 6px", textAlign: "center", color: row[0] ? "#f87171" : "#475569" }}>{row[0]}</td>
                    <td style={{ padding: "3px 6px", textAlign: "center", color: row[1] ? "#f87171" : "#475569" }}>{row[1]}</td>
                  </tr>
                ))}
              </>
            ) : (
              [[0,0], [0,1], [1,0], [1,1]].map((row, i) => {
                const result = computeOutput(gate.type, row[0], row[1])
                const isActive = gate.dualInput
                  ? row[0] === (inputA ? 1 : 0) && row[1] === (inputB ? 1 : 0)
                  : row[0] === (inputA ? 1 : 0)
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #1e293b", backgroundColor: isActive ? `rgba(${rgb},0.08)` : "transparent" }}>
                    <td style={{ padding: "3px 6px", textAlign: "center", color: row[0] ? gate.color : "#475569" }}>{row[0]}</td>
                    {gate.dualInput && <td style={{ padding: "3px 6px", textAlign: "center", color: row[1] ? gate.color : "#475569" }}>{row[1]}</td>}
                    <td style={{ padding: "3px 6px", textAlign: "center", color: result ? gate.color : "#475569", fontWeight: isActive ? 700 : 400 }}>{result ? 1 : 0}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

function LogicGatesPage({ onNavigate }) {
  return (
    <div style={{ minHeight: "100dvh", padding: "14px 14px 20px", maxWidth: 900, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate("menu")}
          style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.28)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <ArrowLeft size={18} />
        </motion.button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "Orbitron, sans-serif", letterSpacing: "-0.02em", color: "#f8fafc" }}>LOGIC GATES</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Gerbang Logika Dasar</p>
        </div>
      </div>

      {/* CARA KERJA LOGIC GATES section */}
      <div style={{ marginBottom: 14, padding: "10px 14px", backgroundColor: "#1e293b", borderRadius: 14, border: "1px solid rgba(100,116,139,0.28)" }}>
        <p style={{ margin: "0 0 12px", fontSize: 9, color: "#475569", letterSpacing: 2, textAlign: "center", fontFamily: "Orbitron, sans-serif" }}>CARA KERJA LOGIC GATES</p>
        <div style={{ display: "flex", alignItems: "stretch", gap: 6 }}>
          {gateData.slice(1, 6).map(gate => (
            <div key={gate.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: gate.color, fontFamily: "Orbitron, sans-serif" }}>{gate.label}</span>
              <svg width="100%" height="40" viewBox="0 0 60 40" preserveAspectRatio="xMidYMid meet">
                <line x1="5" y1="20" x2="20" y2="20" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="20" y="8" width="20" height="24" rx="4" fill="none" stroke={gate.color} strokeWidth="1.5" opacity="0.5" />
                <line x1="40" y1="20" x2="55" y2="20" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Gate Cards */}
      {gateData.map((gate, index) => (
        <GateCard key={gate.id} gate={gate} index={index} />
      ))}

      {/* Navigation to Circuit */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onNavigate("logic-gates-circuit")}
        className="animate-pulse-glow"
        style={{
          width: "100%", padding: "12px", borderRadius: 12,
          backgroundColor: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)",
          color: "#4ade80", fontSize: 13, fontWeight: 600, cursor: "pointer",
          fontFamily: "Orbitron, sans-serif", letterSpacing: "1px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        Logic Gates Circuit →
      </motion.button>
    </div>
  )
}

export default LogicGatesPage