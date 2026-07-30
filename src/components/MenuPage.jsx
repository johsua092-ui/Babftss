import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Cog, Link2 } from 'lucide-react'

const menuItems = [
  {
    id: "logic-gates",
    title: "Logic Gates",
    subtitle: "Gerbang Logika Dasar",
    icon: Zap,
    color: "#4ade80",
    description: "Pelajari dan simulasi gerbang logika digital secara interaktif",
    gradient: "linear-gradient(135deg, #4ade80, #22c55e)",
    badge: null,
  },
  {
    id: "gears",
    title: "Gears",
    subtitle: "Roda Gigi",
    icon: Cog,
    color: "#22d3ee",
    description: "Pilih jenis roda gigi untuk dipelajari. Setiap gear memiliki bentuk dan kegunaan yang unik dalam dunia mesin dan teknik mekanik.",
    gradient: "linear-gradient(135deg, #22d3ee, #0891b2)",
    badge: null,
  },
  {
    id: "linkages",
    title: "Linkages",
    subtitle: "Mekanisme Penghubung",
    icon: Link2,
    color: "#a78bfa",
    description: "Setiap linkage menghasilkan gerakan unik dari kombinasi batang dan engsel. Pilih jenis untuk melihat visualisasi dan penjelasan.",
    gradient: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    badge: "Coming Soon",
    badgeColor: "#f59e0b",
  },
]

function MenuPage({ onNavigate }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, maxWidth: 900, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: "100%", maxWidth: 900 }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "Orbitron, sans-serif", textAlign: "center", color: "#f8fafc", marginBottom: 4, letterSpacing: "-0.02em" }}>
          BABFT Learning
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 30, fontFamily: "Orbitron, sans-serif" }}>
          Create Logic Gates Simulator
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ transform: "translateY(-3px) scale(1.03)" }}
                onClick={() => onNavigate(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "18px 20px",
                  borderRadius: 16,
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(100,116,139,0.28)",
                  cursor: "pointer",
                  transition: "all 0.22s",
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                  background: item.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={24} color="#ffffff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f8fafc", fontFamily: "Orbitron, sans-serif" }}>{item.title}</h3>
                    {item.badge && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 10px",
                        borderRadius: 6, fontFamily: "Orbitron, sans-serif",
                        backgroundColor: "rgba(245,158,11,0.15)",
                        border: "1px solid rgba(245,158,11,0.3)",
                        color: item.badgeColor || "#f59e0b",
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{item.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

export default MenuPage