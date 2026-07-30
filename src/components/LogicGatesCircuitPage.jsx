import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap } from 'lucide-react'
import CircuitCard01 from './CircuitCard01'

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
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  introCard: {
    backgroundColor: "#1e293b",
    borderRadius: "16px",
    padding: "20px 24px",
    border: "1px solid #334155",
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  introIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    backgroundColor: "#3b82f620",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  introText: {
    fontSize: "14px",
    color: "#cbd5e1",
    lineHeight: "1.6",
  },
}

function LogicGatesCircuitPage({ onNavigate }) {
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
          <h1 style={styles.title}>Rangkaian Logika</h1>
          <p style={styles.subtitle}>Logic Gates Circuit</p>
        </div>
      </div>

      <div style={styles.content}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={styles.introCard}
        >
          <div style={styles.introIcon}>
            <Zap size={20} color="#3b82f6" />
          </div>
          <p style={styles.introText}>
            Pelajari bagaimana gerbang logika digabungkan untuk membentuk rangkaian digital
            yang lebih kompleks. Setiap kartu menunjukkan kombinasi gerbang yang berbeda
            dengan simulasi interaktif.
          </p>
        </motion.div>

        <CircuitCard01 index={0} />
      </div>
    </div>
  )
}

export default LogicGatesCircuitPage