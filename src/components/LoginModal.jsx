import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Chrome, Github, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginModal({ isOpen, onClose }) {
  const { loginWithGoogle, loginWithGitHub, loginWithEmail, registerWithEmail } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleProvider = async (fn, name) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      onClose();
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user') {
      } else {
        setError(e.message || `Gagal login dengan ${name}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Email dan password wajib diisi'); return; }
    setBusy(true);
    setError('');
    try {
      if (mode === 'register') {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
    } catch (e) {
      setError(e.message || 'Gagal login');
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            padding: 20,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            style={{
              width: '100%', maxWidth: 400,
              backgroundColor: '#0e1420',
              border: '1px solid #1e293b',
              borderRadius: 16,
              padding: '28px 24px 24px',
              position: 'relative',
            }}
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <button
              onClick={onClose}
              disabled={busy}
              style={{
                position: 'absolute', top: 14, right: 14,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#475569', padding: 4,
              }}
            >
              <X size={20} />
            </button>

            <div style={{
              fontFamily: 'Orbitron,sans-serif', fontWeight: 900,
              fontSize: 22, color: '#4ade80', margin: '0 0 2px',
              letterSpacing: '-0.02em',
            }}>Babft Learning</div>
            <h2 style={{
              fontFamily: 'Orbitron,sans-serif', fontWeight: 800,
              fontSize: 14, color: '#64748b', margin: '0 0 12px',
            }}>
              {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </h2>
            <p style={{
              fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#64748b',
              margin: '0 0 20px', lineHeight: 1.5,
            }}>
              Simpan progress belajarmu dan lanjutkan kapan saja.
            </p>

            {error && (
              <div style={{
                backgroundColor: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: 8, padding: '8px 12px', marginBottom: 14,
                fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#f87171',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => handleProvider(loginWithGoogle, 'Google')}
                disabled={busy}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 10,
                  backgroundColor: '#fff', border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600,
                  color: '#1e293b', opacity: busy ? 0.6 : 1,
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => { if (!busy) e.currentTarget.style.transform = 'scale(1.01)'; }}
                onMouseLeave={e => { if (!busy) e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <Chrome size={20} /> Sign in with Google
              </button>

              <button
                onClick={() => handleProvider(loginWithGitHub, 'GitHub')}
                disabled={busy}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 10,
                  backgroundColor: '#24292e', border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600,
                  color: '#fff', opacity: busy ? 0.6 : 1,
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => { if (!busy) e.currentTarget.style.transform = 'scale(1.01)'; }}
                onMouseLeave={e => { if (!busy) e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <Github size={20} /> Sign in with GitHub
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
                <div style={{ flex: 1, height: 1, backgroundColor: '#1e293b' }} />
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#475569' }}>OR</span>
                <div style={{ flex: 1, height: 1, backgroundColor: '#1e293b' }} />
              </div>

              <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  disabled={busy}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 8,
                    backgroundColor: '#0b1120', border: '1px solid #1e293b',
                    fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#e2e8f0',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#4ade80'}
                  onBlur={e => e.currentTarget.style.borderColor = '#1e293b'}
                />
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    disabled={busy}
                    style={{
                      width: '100%', padding: '11px 40px 11px 14px', borderRadius: 8,
                      backgroundColor: '#0b1120', border: '1px solid #1e293b',
                      fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#e2e8f0',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#4ade80'}
                    onBlur={e => e.currentTarget.style.borderColor = '#1e293b'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#475569', padding: 2,
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 10,
                    backgroundColor: '#22c55e', border: 'none',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 13,
                    color: '#052e16', letterSpacing: 1,
                    opacity: busy ? 0.6 : 1,
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => { if (!busy) e.currentTarget.style.transform = 'scale(1.01)'; }}
                  onMouseLeave={e => { if (!busy) e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {busy ? 'PLEASE WAIT...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                </button>
              </form>
            </div>

            <p style={{
              textAlign: 'center', marginTop: 14,
              fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#64748b',
            }}>
              {mode === 'login' ? "Belum punya akun?" : 'Sudah punya akun?'}{' '}
              <button
                onClick={switchMode}
                disabled={busy}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#4ade80', fontFamily: 'Inter,sans-serif', fontSize: 12,
                  fontWeight: 600, textDecoration: 'underline',
                }}
              >
                {mode === 'login' ? 'Daftar di sini' : 'Login di sini'}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}