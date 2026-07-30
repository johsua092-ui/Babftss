import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import GateCard from './GateCard'
import { gateData } from '../data/gateData'

const styles = {
  container: {
    minHeight: "100vh",
    padding: "40px 20px",
    maxWidth: "800px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "32px",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    backgroundColor: "#1e293b",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: "10px",
    cursor: "pointer",
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#f8fafc",
    margin: 0,
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
}

function BasicLogicGatesPage({ onNavigate }) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={styles.backBtn}
          onClick={() => onNavigate("logic-gates")}
        >
          <ArrowLeft size={18} />
        </motion.button>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>Gerbang Logika Dasar</h1>
          <p style={styles.subtitle}>Basic Logic Gates</p>
        </div>
      </div>
      <div style={styles.grid}>
        {gateData.map((gate, index) => (
          <GateCard key={gate.id} gate={gate} index={index} />
        ))}
      </div>
    </div>
  )
}

export default BasicLogicGatesPage