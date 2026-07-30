import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, Cpu } from 'lucide-react'

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
  card: {
    backgroundColor: "#1e293b",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #334155",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  cardText: {
    fontSize: "15px",
    color: "#cbd5e1",
    lineHeight: "1.7",
  },
  navButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
  },
  navBtn: {
    flex: 1,
    padding: "14px",
    fontSize: "15px",
    fontWeight: "600",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
  },
  secondaryBtn: {
    backgroundColor: "#1e293b",
    color: "#94a3b8",
    border: "1px solid #334155",
  },
}

function LogicGatesPage({ onNavigate }) {
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
          <h1 style={styles.title}>Logic Gates</h1>
          <p style={styles.subtitle}>Gerbang Logika Dasar</p>
        </div>
      </div>

      <div style={styles.content}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={styles.card}
        >
          <h2 style={styles.cardTitle}>
            <Cpu size={20} color="#3b82f6" />
            Apa itu Logic Gates?
          </h2>
          <p style={styles.cardText}>
            Gerbang logika (Logic Gates) adalah blok bangunan dasar dari sistem digital.
            Mereka melakukan operasi logika pada satu atau lebih input biner dan menghasilkan
            satu output. Setiap gerbang logika memiliki tabel kebenaran (truth table) yang
            mendefinisikan output untuk setiap kombinasi input yang mungkin.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={styles.card}
        >
          <h2 style={styles.cardTitle}>
            <BookOpen size={20} color="#8b5cf6" />
            Jenis-jenis Gerbang Logika
          </h2>
          <p style={styles.cardText}>
            Terdapat 7 gerbang logika dasar: AND, OR, NOT, NAND, NOR, XOR, dan XNOR.
            Gerbang AND menghasilkan output 1 hanya jika semua input bernilai 1.
            Gerbang OR menghasilkan output 1 jika salah satu input bernilai 1.
            Gerbang NOT membalikkan nilai input. Gerbang NAND dan NOR adalah
            inversi dari AND dan OR. Gerbang XOR menghasilkan 1 jika input berbeda,
            sedangkan XNOR menghasilkan 1 jika input sama.
          </p>
        </motion.div>

        <div style={styles.navButtons}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ ...styles.navBtn, ...styles.primaryBtn }}
            onClick={() => onNavigate("basic-logic-gates")}
          >
            Lihat Gerbang Logika Dasar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ ...styles.navBtn, ...styles.secondaryBtn }}
            onClick={() => onNavigate("logic-gates-circuit")}
          >
            Rangkaian Logika
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default LogicGatesPage