import React, { useState } from 'react'
import { motion } from 'framer-motion'
import GateDiagram from './GateDiagram'
import { generateTruthTable } from '../utils/gateLogic'

function GateCard({ gate, index = 0 }) {
  const [inputValues, setInputValues] = useState(
    Array(gate.inputs).fill(0)
  )

  const truthTable = generateTruthTable(gate.inputs, gate.logic)
  const output = gate.logic(inputValues)

  const toggleInput = (idx) => {
    const newInputs = [...inputValues]
    newInputs[idx] = newInputs[idx] === 0 ? 1 : 0
    setInputValues(newInputs)
  }

  const cardStyle = {
    backgroundColor: "#1e293b",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #334155",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  }

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }

  const nameStyle = {
    fontSize: "20px",
    fontWeight: "bold",
    color: gate.color,
  }

  const descStyle = {
    fontSize: "14px",
    color: "#94a3b8",
    lineHeight: "1.5",
  }

  const inputSectionStyle = {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  }

  const inputLabelStyle = {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500",
  }

  const inputBtnStyle = (value) => ({
    width: "56px",
    height: "56px",
    borderRadius: "12px",
    border: `2px solid ${value === 1 ? gate.color : "#475569"}`,
    backgroundColor: value === 1 ? gate.color : "#0f172a",
    color: value === 1 ? "#ffffff" : "#64748b",
    fontSize: "20px",
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
    padding: "12px 16px",
    backgroundColor: "#0f172a",
    borderRadius: "12px",
    border: `1px solid ${output === 1 ? gate.color : "#334155"}`,
  }

  const outputLabelStyle = {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500",
  }

  const outputValueStyle = {
    fontSize: "24px",
    fontWeight: "bold",
    color: output === 1 ? gate.color : "#475569",
  }

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

  const tdStyle = (isActive) => ({
    padding: "6px 12px",
    textAlign: "center",
    color: isActive ? gate.color : "#94a3b8",
    fontWeight: isActive ? "600" : "400",
    borderBottom: "1px solid #1e293b",
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      style={cardStyle}
    >
      <div style={headerStyle}>
        <h3 style={nameStyle}>{gate.name}</h3>
        <span style={{
          fontSize: "11px",
          padding: "4px 10px",
          backgroundColor: "#0f172a",
          color: "#64748b",
          borderRadius: "6px",
          border: "1px solid #334155",
        }}>
          {gate.nameFull}
        </span>
      </div>

      <GateDiagram gateType={gate.id} color={gate.color} />

      <p style={descStyle}>{gate.description}</p>

      <div>
        <p style={{ ...inputLabelStyle, marginBottom: "8px" }}>Input Interaktif</p>
        <div style={inputSectionStyle}>
          {inputValues.map((val, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={inputBtnStyle(val)}
              onClick={() => toggleInput(idx)}
            >
              {gate.inputs === 1 ? "IN" : String.fromCharCode(65 + idx)}
              <span style={{ fontSize: "12px", marginLeft: "4px" }}>= {val}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div style={outputSectionStyle}>
        <span style={outputLabelStyle}>Output</span>
        <span style={outputValueStyle}>{output}</span>
      </div>

      <div>
        <p style={{ ...inputLabelStyle, marginBottom: "8px" }}>Tabel Kebenaran</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              {gate.inputs === 1 ? (
                <th style={thStyle}>Input A</th>
              ) : (
                <>
                  <th style={thStyle}>A</th>
                  <th style={thStyle}>B</th>
                </>
              )}
              <th style={thStyle}>Output</th>
            </tr>
          </thead>
          <tbody>
            {truthTable.map((row, i) => {
              const isActive = row.inputs.every((v, idx) => v === inputValues[idx])
              return (
                <tr key={i} style={isActive ? { backgroundColor: "#0f172a" } : {}}>
                  {row.inputs.map((v, idx) => (
                    <td key={idx} style={tdStyle(isActive && v === 1)}>
                      {v}
                    </td>
                  ))}
                  <td style={tdStyle(isActive && row.output === 1)}>
                    {row.output}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

export default GateCard