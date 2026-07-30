import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Cpu, Cog, Link2 } from 'lucide-react'

const menuItems = [
  {
    id: "logic-gates",
    title: "Logic Gates",
    description: "Pelajari dasar-dasar gerbang logika digital",
    icon: Cpu,
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
  },
  {
    id: "gears",
    title: "Gears",
    description: "Pahami mekanisme roda gigi dan transmisi",
    icon: Cog,
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  },
  {
    id: "linkages",
    title: "Linkages",
    description: "Eksplorasi mekanisme penghubung dan katrol",
    icon: Link2,
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
  },
]

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
    justifyContent: "space-between",
    marginBottom: "40px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "#3b82f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#f8fafc",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    backgroundColor: "#1e293b",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: "16px",
    padding: "24px",
    cursor: "pointer",
    border: "1px solid #334155",
    transition: "all 0.2s ease",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  cardIconWrap: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#f8fafc",
  },
  cardDesc: {
    fontSize: "14px",
    color: "#94a3b8",
    lineHeight: "1.5",
  },
}

function MenuPage({ onNavigate }) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <BookOpen size={20} color="#ffffff" />
          </div>
          <h1 style={styles.headerTitle}>Menu Utama</h1>
        </div>
      </div>
      <div style={styles.grid}>
        {menuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, borderColor: item.color }}
              style={styles.card}
              onClick={() => onNavigate(item.id)}
            >
              <div style={{ ...styles.cardIconWrap, background: item.gradient }}>
                <Icon size={24} color="#ffffff" />
              </div>
              <div>
                <h3 style={styles.cardTitle}>{item.title}</h3>
                <p style={styles.cardDesc}>{item.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default MenuPage