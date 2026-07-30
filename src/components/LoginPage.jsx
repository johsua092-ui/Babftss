import { useState } from "react";
import { motion } from "framer-motion";
import {
  Cpu, LogIn, Mail, Lock, UserPlus,
  Loader2, Eye, EyeOff,
} from "lucide-react";
import { loginWithGoogle, loginWithEmail, registerWithEmail } from "../lib/firebase";

const c = {
  pageBg:    "#181b24",
  cardBg:    "#0e1420",
  cardBorder:"#1e293b",
  text:      "#f1f5f9",
  muted:     "#64748b",
  accent:    "#22c55e",
  danger:    "#ef4444",
  dangerBg:  "rgba(239,68,68,0.06)",
  inputBg:   "#0f172a",
  inputBorder:"#1e293b",
  btnDark:   "#0f172a",
  btnBorder: "#1e293b",
};

const card = {
  width: "100%", maxWidth: 400,
  backgroundColor: c.cardBg,
  border: `1px solid ${c.cardBorder}`,
  borderRadius: 16,
};

export default function LoginPage() {
  const [mode, setMode] = useState("signin");  // signin | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setError(""); setEmail(""); setPassword(""); };
  const switchMode = (m) => { setMode(m); reset(); };

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try { await loginWithGoogle(); }
    catch (err) {
      if (err.code === "auth/cancelled-popup-request") return;
      setError(err.message || "Could not sign in.");
    }
    finally { setLoading(false); }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields."); return;
    }
    setError(""); setLoading(true);
    try {
      if (mode === "register") await registerWithEmail(email, password);
      else await loginWithEmail(email, password);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  const isSignin = mode === "signin";

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center",
      justifyContent: "center", backgroundColor: c.pageBg, padding: 24,
      fontFamily: `"Inter",system-ui,-apple-system,sans-serif`,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{ ...card, padding: "36px 32px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}
      >
        {/* ── brand ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            backgroundColor: c.inputBg, border: `1px solid ${c.cardBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: c.accent,
          }}>
            <Cpu size={26} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 style={{
              fontFamily: `"Orbitron",sans-serif`, fontWeight: 900,
              fontSize: 26, color: c.text, letterSpacing: "-0.01em", margin: 0,
            }}>BABFT</h1>
            <p style={{ color: c.muted, fontSize: 13, margin: "4px 0 0" }}>
              Logic Gates  ·  Gears  ·  Linkages
            </p>
          </div>
        </div>

        {/* ── sign-in / register tabs ── */}
        <div style={{
          display: "flex", width: "100%", gap: 0,
          borderBottom: `1px solid ${c.cardBorder}`,
        }}>
          {[
            ["signin",   "Sign In"],
            ["register", "Create Account"],
          ].map(([key, label]) => (
            <button key={key} onClick={() => switchMode(key)} style={{
              flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700, fontFamily: "inherit",
              color: mode === key ? c.text : c.muted,
              background: "transparent",
              borderBottom: `2px solid ${mode === key ? c.accent : "transparent"}`,
              transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>

        {/* ── form ── */}
        <form onSubmit={handleEmail} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            backgroundColor: c.inputBg, border: `1px solid ${c.inputBorder}`,
            borderRadius: 12, padding: "0 14px",
          }}>
            <Mail size={15} color={c.muted} style={{ flexShrink: 0 }} />
            <input
              type="email" placeholder="Email address" value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                padding: "13px 0", fontSize: 14, color: c.text, fontFamily: "inherit",
              }}
            />
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            backgroundColor: c.inputBg, border: `1px solid ${c.inputBorder}`,
            borderRadius: 12, padding: "0 14px",
          }}>
            <Lock size={15} color={c.muted} style={{ flexShrink: 0 }} />
            <input
              type={showPw ? "text" : "password"} placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                padding: "13px 0", fontSize: 14, color: c.text, fontFamily: "inherit",
              }}
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ background: "none", border: "none", color: c.muted, cursor: "pointer", padding: 0, display: "flex" }}>
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* submit */}
          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
            cursor: loading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700,
            fontFamily: "inherit", color: "#fff", backgroundColor: c.accent,
            opacity: loading ? 0.55 : 1, display: "flex", alignItems: "center",
            justifyContent: "center", gap: 9, transition: "opacity 0.2s",
          }}>
            {loading
              ? <Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} />
              : (isSignin ? <LogIn size={17} /> : <UserPlus size={17} />)}
            {isSignin ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* ── divider ── */}
        <div style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          color: "#334155", fontSize: 11, fontWeight: 600,
        }}>
          <div style={{ flex: 1, height: 1, backgroundColor: c.cardBorder }} />
          OR
          <div style={{ flex: 1, height: 1, backgroundColor: c.cardBorder }} />
        </div>

        {/* ── Google ── */}
        <button onClick={handleGoogle} disabled={loading} style={{
          width: "100%", padding: "13px 0", borderRadius: 12,
          border: `1px solid ${c.btnBorder}`, backgroundColor: c.btnDark,
          cursor: loading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600,
          fontFamily: "inherit", color: c.text, opacity: loading ? 0.55 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "all 0.2s",
        }}>
          {loading
            ? <Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} />
            : <GoogleLogo />}
          Sign in with Google
        </button>

        {/* ── error ── */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              width: "100%", color: c.danger, fontSize: 12,
              backgroundColor: c.dangerBg, border: `1px solid ${c.danger}22`,
              borderRadius: 10, padding: "10px 14px", textAlign: "center",
              lineHeight: 1.5,
            }}
          >{error}</motion.div>
        )}

        {/* ── footer switch ── */}
        <p style={{ color: c.muted, fontSize: 12, margin: 0, textAlign: "center" }}>
          {isSignin ? (
            <>Don't have an account?{' '}
              <button onClick={() => switchMode("register")} style={{
                background: "none", border: "none", color: c.accent,
                cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                fontWeight: 700, padding: 0,
              }}>Create one</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => switchMode("signin")} style={{
                background: "none", border: "none", color: c.accent,
                cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                fontWeight: 700, padding: 0,
              }}>Sign in</button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
