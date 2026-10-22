/**
 * MapLoadingOverlay.jsx — layar loading map Babft (permintaan user 2026-10-22)
 *
 * MASALAH YANG DIPERBAIKI:
 *   Saat pilih Build Area "Babft", file /maps/babft_obj.bin (±33 MB) diunduh.
 *   Dulu: tidak ada indikator apa pun → layar terlihat KOSONG/blank selama
 *   unduhan + parsing 32.708 part. Di koneksi lambat / kunjungan pertama
 *   user bisa mengira aplikasi hang.
 *
 *   Sekarang: overlay dengan spinner 3D (kode user, dipakai PERSIS) +
 *   progress bar nyata + persentase + ukuran MB + tahap yang sedang jalan.
 *
 * Spinner: HTML/CSS dari user (Uiverse.io by adamgiebl) — 6 div, animasi
 * 2.2s linear. Nilai --clr diambil dari tema simulator (#f472b6/pink) tapi
 * bisa di-override lewat prop `warna`.
 */

import { useEffect, useState } from 'react';

const CSS = `
.spinner {
  width: 80px;
  height: 80px;
  --clr: rgb(255, 64, 0);
  --clr-alpha: rgb(255, 64, 0, .1);
  animation: spinner 2.2s infinite linear;
  transform-style: preserve-3d;
}

.spinner > div {
  background-color: var(--clr-alpha);
  height: 100%;
  position: absolute;
  width: 100%;
  border: 5px solid var(--clr);
}

.spinner div:nth-of-type(1) {
  transform: translateZ(-40px) rotateY(180deg);
}

.spinner div:nth-of-type(2) {
  transform: rotateY(-270deg) translateX(50%);
  transform-origin: top right;
}

.spinner div:nth-of-type(3) {
  transform: rotateY(270deg) translateX(-50%);
  transform-origin: center left;
}

.spinner div:nth-of-type(4) {
  transform: rotateX(90deg) translateY(-50%);
  transform-origin: top center;
}

.spinner div:nth-of-type(5) {
  transform: rotateX(-90deg) translateY(50%);
  transform-origin: bottom center;
}

.spinner div:nth-of-type(6) {
  transform: translateZ(40px);
}

@keyframes spinner {
  0% {
    transform: rotate(0deg) rotateX(0deg) rotateY(0deg);
  }

  50% {
    transform: rotate(180deg) rotateX(180deg) rotateY(180deg);
  }

  100% {
    transform: rotate(360deg) rotateX(360deg) rotateY(360deg);
  }
}

/* Shimmer halus di progress bar supaya terlihat "hidup" walau byte belum
   bertambah (mis. server belum kirim chunk pertama). */
@keyframes mapBarShimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
`;

function fmtMB(bytes) {
  if (!bytes || bytes < 0) return '0 MB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function MapLoadingOverlay({
  visible,
  progress = 0,          // 0..1
  stage = 'Mengunduh map...',
  loadedBytes = 0,
  totalBytes = 0,
  error = null,
  onRetry = null,
}) {
  // Tampilkan spinner minimal sebentar supaya tidak "kedip" saat cache hit.
  const [mounted, setMounted] = useState(visible);
  useEffect(() => {
    if (visible) { setMounted(true); return; }
    const t = setTimeout(() => setMounted(false), 220);
    return () => clearTimeout(t);
  }, [visible]);

  if (!mounted) return null;

  const pct = Math.max(0, Math.min(100, Math.round((progress || 0) * 100)));
  const indeterminate = !totalBytes && !error;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 22,
        backgroundColor: 'rgba(5, 8, 15, 0.92)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.22s ease',
        pointerEvents: visible ? 'auto' : 'none',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <style>{CSS}</style>

      {/* Spinner 3D — kode user, dipakai persis (6 div) */}
      <div className="spinner" style={{ position: 'relative' }}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>

      <div style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}>
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 15, fontWeight: 700, letterSpacing: 1.5,
          color: '#f472b6', marginBottom: 6,
        }}>
          {error ? 'GAGAL MEMUAT MAP' : 'MEMUAT MAP BABFT'}
        </div>

        <div style={{
          fontSize: 12, color: '#94a3b8', lineHeight: 1.6,
          minHeight: 20, marginBottom: 14,
        }}>
          {error || stage}
        </div>

        {/* Progress bar */}
        <div style={{
          width: 300, maxWidth: '78vw', height: 8,
          borderRadius: 99, overflow: 'hidden',
          backgroundColor: 'rgba(148, 163, 184, 0.18)',
          border: '1px solid rgba(148, 163, 184, 0.22)',
          margin: '0 auto',
          position: 'relative',
        }}>
          <div style={{
            height: '100%',
            width: indeterminate ? '35%' : `${pct}%`,
            borderRadius: 99,
            background: error
              ? 'linear-gradient(90deg, #ef4444, #f87171)'
              : 'linear-gradient(90deg, #f472b6, #a855f7)',
            transition: 'width 0.25s ease',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {indeterminate && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                animation: 'mapBarShimmer 1.2s infinite linear',
              }} />
            )}
          </div>
        </div>

        {/* Angka: persen + MB + SISA yang belum terunduh (permintaan user:
            "dia nampilin progressnya kurang berapa" — jadi user tahu sisa
            unduhan, bukan cuma persentase.) */}
        <div style={{
          marginTop: 10, fontSize: 11, color: '#64748b',
          fontFamily: 'monospace', letterSpacing: 0.4, lineHeight: 1.7,
        }}>
          {error
            ? 'Periksa koneksi lalu coba lagi'
            : totalBytes > 0
              ? `${pct}%  •  ${fmtMB(loadedBytes)} / ${fmtMB(totalBytes)}`
              : `${pct}%`}
          {!error && totalBytes > 0 && loadedBytes < totalBytes && (
            <div style={{ color: '#f59e0b', marginTop: 2 }}>
              Kurang {fmtMB(totalBytes - loadedBytes)} lagi
            </div>
          )}
          {!error && totalBytes > 0 && loadedBytes >= totalBytes && loadedBytes > 0 && (
            <div style={{ color: '#22c55e', marginTop: 2 }}>
              Lengkap — siap dimuat
            </div>
          )}
        </div>

        {error && onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginTop: 16, padding: '9px 20px', borderRadius: 9,
              border: '1px solid #ef4444', backgroundColor: 'rgba(239,68,68,0.15)',
              color: '#fca5a5', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Coba Lagi
          </button>
        )}

        {!error && (
          <div style={{ marginTop: 12, fontSize: 10, color: '#475569', lineHeight: 1.6 }}>
            Unduhan sekali saja — berikutnya diambil dari cache browser.
          </div>
        )}
      </div>
    </div>
  );
}
