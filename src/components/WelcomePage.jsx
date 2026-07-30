import React from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
  },
  logo: {
    width: "80px",
    height: "80px",
    borderRadius: "20px",
    backgroundColor: "#3b82f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "48px",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "12px",
  },
  subtitle: {
    fontSize: "18px",
    color: "#94a3b8",
    marginBottom: "40px",
    textAlign: "center",
  },
  button: {
    padding: "14px 40px",
    fontSize: "16px",
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  description: {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "20px",
    textAlign: "center",
    maxWidth: "400px",
  },
}

function WelcomePage({ onNavigate }) {
  return (
    <div style={styles.container}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center" }}
      >
        <div style={styles.logo}>
          <Zap size={40} color="#ffffff" />
        </div>
        <h1 style={styles.title}>BABFT Learning</h1>
        <p style={styles.subtitle}>Belajar Anatomi, Biomekanika, Fisioterapi & Teknologi</p>
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "#2563eb" }}
          whileTap={{ scale: 0.95 }}
          style={styles.button}
          onClick={() => onNavigate("menu")}
        >
          Mulai Belajar
        </motion.button>
        <p style={styles.description}>
          Platform interaktif untuk mempelajari konsep-konsep dasar sains dan teknologi
        </p>
      </motion.div>
    </div>
  )
}

export default WelcomePage