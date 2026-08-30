import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Chrome, Github } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * LoginModal — OAuth-only (Google + GitHub).
 *
 * Catatan: form email/password dihapus sesuai permintaan user.
 * Karena Firebase email/password auth wajib butuh email, kita hapus
 * form seluruhnya, bukan hanya input email-nya saja.
 */
export default function LoginModal({ isOpen, onClose }) {
  const { loginWithGoogle, loginWithGitHub } = useAuth();
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
        // user batal, jangan tampilkan error
      } else {
        setError(e.message || `Gagal login dengan ${name}`);
      }
    } finally {
      setBusy(false);
    }
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
              aria-label="Tutup"
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
              SIGN IN
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
            </div>

            <p style={{
              textAlign: 'center', marginTop: 16,
              fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#475569',
              lineHeight: 1.5,
            }}>
              Dengan masuk, kamu menyetujui penyimpanan progress belajar di akun kamu.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
