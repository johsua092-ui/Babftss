import { useState } from "react";
import { motion } from "framer-motion";
import { Cpu, LogIn, Loader2 } from "lucide-react";
import { loginWithGoogle } from "../lib/firebase";

const styles = {
  page: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#181b24",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#0e1420",
    border: "1px solid #1e293b",
    borderRadius: 16,
    padding: "40px 32px 36px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 28,
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#22c55e",
  },
  title: {
    fontFamily: "Orbitron, sans-serif",
    fontWeight: 900,
    fontSize: 28,
    color: "#f1f5f9",
    letterSpacing: "-0.01em",
    margin: 0,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter, sans-serif",
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 1.6,
    margin: 0,
  },
  button: {
    width: "100%",
    padding: "14px 0",
    borderRadius: 12,
    border: "1px solid #1e293b",
    backgroundColor: "#0f172a",
    color: "#f1f5f9",
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    transition: "all 0.2s",
  },
  divider: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "#334155",
    fontFamily: "Inter, sans-serif",
    fontSize: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#1e293b",
  },
  error: {
    fontFamily: "Inter, sans-serif",
    fontSize: 13,
    color: "#ef4444",
    backgroundColor: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 10,
    padding: "10px 14px",
    width: "100%",
    textAlign: "center",
  },
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in window was closed.");
      } else if (err.code === "auth/cancelled-popup-request") {
        // ignore — user clicked another popup
      } else {
        setError("Could not sign in. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={styles.card}
      >
        <div style={styles.iconRing}>
          <Cpu size={28} />
        </div>

        <div>
          <h1 style={styles.title}>BABFTSS</h1>
          <p style={{ ...styles.subtitle, marginTop: 6 }}>
            Logic Gates, Gears &amp; Linkages Learning
          </p>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.borderColor = "#334155";
              e.currentTarget.style.backgroundColor = "#131b2b";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#1e293b";
            e.currentTarget.style.backgroundColor = "#0f172a";
          }}
        >
          {loading ? (
            <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <LogIn size={20} />
          )}
          Sign in with Google
        </button>

        {error && <div style={styles.error}>{error}</div>}

        <p style={{ ...styles.subtitle, fontSize: 11, color: "#334155" }}>
          Your progress is saved automatically.
        </p>
      </motion.div>
    </div>
  );
}
