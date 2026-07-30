import React from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

function WelcomePage({ onNavigate }) {
  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: "center", maxWidth: 500, width: "100%" }}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            width: 80, height: 80, borderRadius: 20,
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 0 20px",
          }}
        >
          <Zap size={36} color="#ffffff" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{
            fontSize: 32, fontWeight: 900, letterSpacing: "-0.02em", margin: 0,
            fontFamily: "Orbitron, sans-serif",
            background: "linear-gradient(135deg, #4ade80, #60a5fa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          WELCOME
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{
            fontSize: 16, color: "#94a3b8", marginBottom: 24, marginTop: 4,
            fontFamily: "Orbitron, sans-serif",
          }}
        >
          Logic Gates
        </motion.p>

        {/* Image placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          style={{
            width: "100%", maxWidth: 420, borderRadius: 16,
            display: "block", margin: "0 auto 24px",
            height: 180,
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <Zap size={60} color="#334155" />
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          style={{
            fontSize: 14, color: "#64748b", marginBottom: 24, lineHeight: 1.6, maxWidth: 400, margin: "0 auto 24px",
          }}
        >
          Platform interaktif untuk mempelajari konsep-konsep dasar sains dan teknologi
        </motion.p>

        {/* Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onNavigate("menu")}
          className="animate-pulse-glow"
          style={{
            width: "100%", maxWidth: 400, padding: "14px 40px",
            fontSize: 14, fontWeight: 700, color: "#ffffff",
            backgroundColor: "#4ade80", border: "none", borderRadius: 12,
            cursor: "pointer", fontFamily: "Orbitron, sans-serif",
            letterSpacing: "2px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          START LEARNING
        </motion.button>
      </motion.div>
    </div>
  )
}

export default WelcomePage