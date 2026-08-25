import { motion } from 'framer-motion';
import { Home, ArrowLeft, Compass } from 'lucide-react';

/**
 * NotFoundPage — halaman 404.
 *
 * Dirender oleh App.jsx ketika `page` state tidak cocok dengan
 * halaman mana pun yang dikenal (mis. data progress korup,
 * deep-link ke page lama yang sudah dihapus, atau user nyasar).
 *
 * Styling mengikuti tema BABFT: dark + accent hijau + tipografi Orbitron.
 */
export default function NotFoundPage({ setPage }) {
  const goHome = () => setPage?.('welcome');
  const goMenu = () => setPage?.('menu');

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 460,
          textAlign: 'center',
          padding: '40px 28px',
          backgroundColor: '#0e1420',
          border: '1px solid #1e293b',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        {/* ── big 404 ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
          style={{
            fontFamily: '"Orbitron", sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(5rem, 22vw, 8.5rem)',
            lineHeight: 1,
            margin: 0,
            background: 'linear-gradient(180deg, #4ade80 0%, #16a34a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.04em',
            textShadow: '0 0 80px rgba(74,222,128,0.15)',
          }}
        >
          404
        </motion.div>

        {/* ── decorative compass ── */}
        <motion.div
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            color: '#4ade80',
            margin: '8px 0 18px',
          }}
        >
          <Compass size={22} />
        </motion.div>

        {/* ── headline ── */}
        <h1
          style={{
            fontFamily: '"Orbitron", sans-serif',
            fontWeight: 800,
            fontSize: 18,
            color: '#f1f5f9',
            margin: '0 0 8px',
            letterSpacing: '0.02em',
          }}
        >
          HALAMAN TIDAK DITEMUKAN
        </h1>
        <p
          style={{
            color: '#64748b',
            fontSize: 13,
            lineHeight: 1.6,
            margin: '0 0 26px',
          }}
        >
          Sepertinya kamu nyasar ke halaman yang tidak ada atau sudah dihapus.
          Coba kembali ke beranda atau pilih menu utama.
        </p>

        {/* ── actions ── */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={goHome}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 18px',
              borderRadius: 10,
              backgroundColor: '#22c55e',
              border: 'none',
              cursor: 'pointer',
              fontFamily: '"Orbitron", sans-serif',
              fontWeight: 700,
              fontSize: 12,
              color: '#052e16',
              letterSpacing: 1,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Home size={15} /> BERANDA
          </button>
          <button
            onClick={goMenu}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 18px',
              borderRadius: 10,
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              cursor: 'pointer',
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: 12,
              color: '#cbd5e1',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#475569';
              e.currentTarget.style.color = '#e2e8f0';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#1e293b';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            <ArrowLeft size={15} /> MENU UTAMA
          </button>
        </div>

        {/* ── footnote ── */}
        <p
          style={{
            marginTop: 22,
            color: '#475569',
            fontSize: 11,
            margin: '22px 0 0',
            lineHeight: 1.5,
          }}
        >
          Error code: PAGE_NOT_FOUND
        </p>
      </motion.div>
    </div>
  );
}
