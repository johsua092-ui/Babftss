import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, LogIn, Mail, Lock, UserPlus, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { loginWithGoogle, loginWithEmail, registerWithEmail } from "../lib/firebase";

/* ── theme tokens ── */
const tok = {
  bg: "#0b0f19",
  surface: "#131b2b",
  card: "rgba(18,24,40,0.85)",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.12)",
  text: "#e2e8f0",
  muted: "#64748b",
  accent: "#22c55e",
  accentGlow: "rgba(34,197,94,0.15)",
  danger: "#ef4444",
  dangerBg: "rgba(239,68,68,0.08)",
  input: "rgba(255,255,255,0.04)",
  inputFocus: "rgba(34,197,94,0.2)",
  white: "#ffffff",
  backdrop: "rgba(11,15,25,0.7)",
};

export default function LoginPage() {
  const [tab, setTab] = useState("login"); // login | register
  const [method, setMethod] = useState("email"); // email | google
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setError("");
    setEmail("");
    setPassword("");
  };

  const switchTab = (t) => {
    setTab(t);
    reset();
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      if (err.code === "auth/cancelled-popup-request") return;
      setError(err.message || "Could not sign in. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (tab === "register") {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse 80% 60% at 50% -20%, ${tok.accentGlow}, transparent), ${tok.bg}`,
        padding: 24,
        fontFamily: `"Inter", system-ui, -apple-system, sans-serif`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ambient dots */}
      <AmbientDots />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        style={{
          width: "100%",
          maxWidth: 420,
          background: tok.card,
          backdropFilter: "blur(24px)",
          border: `1px solid ${tok.border}`,
          borderRadius: 24,
          padding: "44px 32px 36px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          position: "relative",
          zIndex: 2,
          boxShadow: `0 0 0 1px ${tok.border}, 0 24px 64px rgba(0,0,0,0.4)`,
        }}
      >
        {/* logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          style={{
            width: 68,
            height: 68,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${tok.accentGlow}, rgba(34,197,94,0.05))`,
            border: `1px solid rgba(34,197,94,0.3)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: tok.accent,
            boxShadow: `0 0 32px ${tok.accentGlow}`,
          }}
        >
          <Cpu size={30} />
        </motion.div>

        {/* heading */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: `"Orbitron", sans-serif`,
              fontWeight: 900,
              fontSize: 30,
              color: tok.text,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            BABFTSS
          </h1>
          <p style={{ color: tok.muted, fontSize: 14, margin: "6px 0 0" }}>
            Logic Gates · Gears · Linkages
          </p>
        </div>

        {/* method selector */}
        <div
          style={{
            display: "flex",
            width: "100%",
            background: tok.input,
            borderRadius: 14,
            padding: 4,
            gap: 4,
          }}
        >
          {["email", "google"].map((m) => (
            <button
              key={m}
              onClick={() => { setMethod(m); reset(); }}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 11,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "inherit",
                color: method === m ? tok.text : tok.muted,
                background: method === m ? tok.surface : "transparent",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              {m === "email" ? <Mail size={15} /> : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {m === "email" ? "Email" : "Google"}
            </button>
          ))}
        </div>

        {/* tab switch (only for email) */}
        {method === "email" && (
          <div style={{ display: "flex", width: "100%", gap: 0 }}>
            {[
              ["login", "Sign In"],
              ["register", "Create Account"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  color: tab === key ? tok.accent : tok.muted,
                  background: "transparent",
                  borderBottom: `2px solid ${tab === key ? tok.accent : "transparent"}`,
                  transition: "all 0.2s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* email form */}
        <AnimatePresence mode="wait">
          {method === "email" ? (
            <motion.form
              key="email-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleEmail}
              style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}
            >
              <Input
                icon={<Mail size={16} />}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                icon={<Lock size={16} />}
                type={showPw ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{ background: "none", border: "none", color: tok.muted, cursor: "pointer", padding: 0, display: "flex" }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  borderRadius: 14,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  color: tok.white,
                  background: tok.accent,
                  opacity: loading ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "all 0.2s",
                  marginTop: 4,
                  boxShadow: `0 4px 20px ${tok.accentGlow}`,
                }}
              >
                {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : (tab === "register" ? <UserPlus size={18} /> : <LogIn size={18} />)}
                {tab === "register" ? "Create Account" : "Sign In"}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="google-btn"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              style={{ width: "100%" }}
            >
              <button
                onClick={handleGoogle}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  borderRadius: 14,
                  border: `1px solid ${tok.border}`,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  color: tok.text,
                  background: tok.surface,
                  opacity: loading ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = tok.muted;
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = tok.border;
                  e.currentTarget.style.background = tok.surface;
                }}
              >
                {loading ? (
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Sign in with Google
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              style={{
                width: "100%",
                color: tok.danger,
                fontSize: 13,
                background: tok.dangerBg,
                border: `1px solid ${tok.danger}20`,
                borderRadius: 12,
                padding: "12px 14px",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* footer */}
        <p style={{ color: "#334155", fontSize: 11, textAlign: "center", margin: 0 }}>
          Your progress is saved automatically.
        </p>
      </motion.div>
    </div>
  );
}

/* ── Input component ── */
function Input({ icon, suffix, ...rest }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: tok.input,
        border: `1px solid ${tok.border}`,
        borderRadius: 13,
        padding: "0 14px",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onFocusCapture={(e) => {
        e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)";
        e.currentTarget.style.boxShadow = `0 0 0 3px ${tok.inputFocus}`;
      }}
      onBlurCapture={(e) => {
        e.currentTarget.style.borderColor = tok.border;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <span style={{ color: tok.muted, display: "flex", flexShrink: 0 }}>{icon}</span>
      <input
        {...rest}
        style={{
          flex: 1,
          background: "none",
          border: "none",
          outline: "none",
          padding: "13px 0",
          fontSize: 14,
          color: tok.text,
          fontFamily: "inherit",
        }}
      />
      {suffix}
    </div>
  );
}

/* ── Ambient floating dots ── */
function AmbientDots() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1, opacity: 0.35 }}>
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            borderRadius: "50%",
            background: i % 3 === 0 ? tok.accent : tok.muted,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30 - Math.random() * 60, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
