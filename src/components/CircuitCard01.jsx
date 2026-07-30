import React, { useState } from 'react'
import { motion } from 'framer-motion'
import CircuitDiagram01 from './CircuitDiagram01'

function CircuitCard01({ index = 0 }) {
  const [inputA, setInputA] = useState(0)
  const [inputB, setInputB] = useState(0)

  // NOT gate on input A
  const notA = inputA === 1 ? 0 : 1
  // AND gate: NOT(A) AND B
  const output = (notA === 1 && inputB === 1) ? 1 : 0

  const cardStyle = {
    backgroundColor: "#1e293b",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #334155",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  }

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "8px",
  }

  const titleStyle = {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#3b82f6",
  }

  const badgeStyle = {
    fontSize: "12px",
    padding: "4px 12px",
    backgroundColor: "#0f172a",
    color: "#64748b",
    borderRadius: "6px",
    border: "1px solid #334155",
  }

  const descStyle = {
    fontSize: "14px",
    color: "#94a3b8",
    lineHeight: "1.6",
  }

  const inputSectionStyle = {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
  }

  const inputGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    alignItems: "center",
  }

  const inputLabelStyle = {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500",
  }

  const inputBtnStyle = (value, activeColor) => ({
    width: "64px",
    height: "64px",
    borderRadius: "12px",
    border: `2px solid ${value === 1 ? activeColor : "#475569"}`,
    backgroundColor: value === 1 ? activeColor : "#0f172a",
    color: value === 1 ? "#ffffff" : "#64748b",
    fontSize: "22px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  })

  const outputSectionStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    backgroundColor: "#0f172a",
    borderRadius: "12px",
    border: `1px solid ${output === 1 ? "#3b82f6" : "#334155"}`,
  }

  const outputValueStyle = {
    fontSize: "28px",
    fontWeight: "bold",
    color: output === 1 ? "#3b82f6" : "#475569",
  }

  const signalFlowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#64748b",
    flexWrap: "wrap",
  }

  const signalBadgeStyle = (val, clr) => ({
    padding: "4px 10px",
    borderRadius: "6px",
    backgroundColor: val === 1 ? clr + "20" : "#0f172a",
    color: val === 1 ? clr : "#475569",
    fontWeight: "600",
    fontSize: "13px",
    border: `1px solid ${val === 1 ? clr : "#334155"}`,
  })

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  }

  const thStyle = {
    padding: "8px 12px",
    textAlign: "center",
    color: "#64748b",
    fontWeight: "600",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "1px solid #334155",
  }

  const tdStyle = (isActive, val) => ({
    padding: "6px 12px",
    textAlign: "center",
    color: isActive && val === 1 ? "#3b82f6" : "#94a3b8",
    fontWeight: isActive ? "600" : "400",
    backgroundColor: isActive ? "#0f172a" : "transparent",
    borderBottom: "1px solid #1e293b",
  })

  // Full truth table for NOT→AND
  const truthTable = [
    { a: 0, b: 0, notA: 1, y: 0 },
    { a: 0, b: 1, notA: 1, y: 1 },
    { a: 1, b: 0, notA: 0, y: 0 },
    { a: 1, b: 1, notA: 0, y: 0 },
  ]

  const isCurrentRow = (row) => row.a === inputA && row.b === inputB

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      style={cardStyle}
    >
      <div style={headerStyle}>
        <h3 style={titleStyle}>NOT → AND</h3>
        <div style={{ display: "flex", gap: "8px" }}>
          <span style={badgeStyle}>Card 01</span>
          <span style={{ ...badgeStyle, color: "#10b981", borderColor: "#10b981" }}>MUDAH</span>
        </div>
      </div>

      <CircuitDiagram01 color="#3b82f6" />

      <p style={descStyle}>
        Kombinasi gerbang NOT dan AND. Input A melewati gerbang NOT terlebih dahulu
        (membalikkan nilainya), kemudian hasilnya digabungkan dengan Input B menggunakan
        gerbang AND. Output Y hanya HIGH ketika A tidak aktif dan B aktif.
      </p>

      <div style={signalFlowStyle}>
        <span style={{ fontWeight: "600" }}>Alur Sinyal:</span>
        <span style={signalBadgeStyle(inputA, "#ef4444")}>A = {inputA}</span>
        <span>→</span>
        <span style={{ ...signalBadgeStyle(notA, "#ef4444"), border: "1px dashed #ef4444" }}>NOT = {notA}</span>
        <span>→</span>
        <span style={signalBadgeStyle(inputB, "#3b82f6")}>B = {inputB}</span>
        <span>→</span>
        <span style={signalBadgeStyle(output, "#3b82f6")}>AND = {output}</span>
      </div>

      <div style={inputSectionStyle}>
        <div style={inputGroupStyle}>
          <span style={inputLabelStyle}>Input A (ke NOT)</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={inputBtnStyle(inputA, "#ef4444")}
            onClick={() => setInputA(inputA === 0 ? 1 : 0)}
          >
            A = {inputA}
          </motion.button>
        </div>
        <div style={inputGroupStyle}>
          <span style={inputLabelStyle}>Input B (ke AND)</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={inputBtnStyle(inputB, "#3b82f6")}
            onClick={() => setInputB(inputB === 0 ? 1 : 0)}
          >
            B = {inputB}
          </motion.button>
        </div>
      </div>

      <div style={outputSectionStyle}>
        <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Output Y</span>
        <span style={outputValueStyle}>{output}</span>
      </div>

      <div>
        <p style={{ ...inputLabelStyle, marginBottom: "8px" }}>Tabel Kebenaran</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>A</th>
              <th style={thStyle}>B</th>
              <th style={{ ...thStyle, color: "#ef4444" }}>NOT A</th>
              <th style={thStyle}>Y (AND)</th>
            </tr>
          </thead>
          <tbody>
            {truthTable.map((row, i) => {
              const active = isCurrentRow(row)
              return (
                <tr key={i}>
                  <td style={tdStyle(active, row.a)}>{row.a}</td>
                  <td style={tdStyle(active, row.b)}>{row.b}</td>
                  <td style={{ ...tdStyle(active, row.notA), color: active && row.notA === 1 ? "#ef4444" : undefined }}>
                    {row.notA}
                  </td>
                  <td style={tdStyle(active, row.y)}>{row.y}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

export default CircuitCard01