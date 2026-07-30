import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Link2 } from 'lucide-react'

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
  placeholderCard: {
    backgroundColor: "#1e293b",
    borderRadius: "16px",
    padding: "60px 24px",
    border: "1px solid #334155",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  iconWrap: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#10b98120",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#f8fafc",
  },
  placeholderText: {
    fontSize: "16px",
    color: "#94a3b8",
  },
}

function LinkagesPage({ onNavigate }) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={styles.backBtn}
          onClick={() => onNavigate("menu")}
        >
          <ArrowLeft size={18} />
        </motion.button>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>Linkages</h1>
          <p style={styles.subtitle}>Mekanisme Penghubung</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={styles.placeholderCard}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={styles.iconWrap}
        >
          <Link2 size={36} color="#10b981" />
        </motion.div>
        <h2 style={styles.placeholderTitle}>Segera Hadir!</h2>
        <p style={styles.placeholderText}>Halaman mekanisme penghubung sedang dalam pengembangan.</p>
      </motion.div>
    </div>
  )
}

export default LinkagesPage