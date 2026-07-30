import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { gearData } from '../data/gearData'

function GearsPage({ onNavigate }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 14px 20px", maxWidth: 900, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, width: "100%" }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate("menu")}
          style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.28)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <ArrowLeft size={18} />
        </motion.button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "Orbitron, sans-serif", letterSpacing: "-0.02em", color: "#f8fafc" }}>GEARS</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Roda Gigi</p>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 22, lineHeight: 1.6, textAlign: "center", maxWidth: 500 }}>
        Pilih jenis roda gigi untuk dipelajari. Setiap gear memiliki bentuk dan kegunaan yang unik dalam dunia mesin dan teknik mekanik.
      </p>

      {/* Gear Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
        {gearData.map((gear, index) => (
          <motion.div
            key={gear.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            whileHover={{ transform: "translateY(-3px) scale(1.03)" }}
            onClick={() => {}}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 14,
              borderRadius: 16,
              backgroundColor: "#1e293b",
              border: `1px solid rgba(100,116,139,0.28)`,
              cursor: "pointer",
              transition: "all 0.22s",
            }}
          >
            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: 12, flexShrink: 0,
              backgroundColor: `rgba(${parseInt(gear.color.slice(1,3),16)},${parseInt(gear.color.slice(3,5),16)},${parseInt(gear.color.slice(5,7),16)},0.12)`,
              border: `1px solid rgba(${parseInt(gear.color.slice(1,3),16)},${parseInt(gear.color.slice(3,5),16)},${parseInt(gear.color.slice(5,7),16)},0.22)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* Gear icon SVG placeholder */}
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={gear.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: gear.color, opacity: 0.7, letterSpacing: 1.5, padding: "4px 10px", borderRadius: 6, backgroundColor: "rgba(100,116,139,0.15)", border: "1px solid rgba(100,116,139,0.3)", fontFamily: "Orbitron, sans-serif" }}>
                  {String(gear.id).padStart(2, "0")}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: gear.color, fontFamily: "Orbitron, sans-serif" }}>{gear.name}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{gear.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default GearsPage