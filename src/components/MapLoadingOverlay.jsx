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
 * 2.2s linear. Nilai --clr = oranye amber (#f59e0b) agar serasi dengan
 * gradasi judul simulator (#fbbf24 -> #f59e0b).
 */

import { useEffect, useState } from 'react';
import TesseractCore from './TesseractCore.jsx';

const CSS = `
/* ── SPINNER 3D NEON (kode dasar dari user, di-upgrade tema neon) ──
   Struktur 6 div & keyframes TETAP sama persis. Yang ditambah:
   - --clr jadi gradasi neon oranye->kuning (border tiap sisi beda warna,
     sehingga saat berputar terlihat gradasi hidup, bukan 1 warna datar)
   - glow neon (drop-shadow) di luar & dalam
   - isi kubus transparan supaya rangkanya terlihat seperti "neon frame"
   - sedikit lebih besar (92px) agar proporsinya seimbang              */
/* PENTING (bug yang user lihat: kerangka gepeng kayak kertas):
   1. perspective WAJIB ada di elemen INDUK. Tanpa itu, rotateX/rotateY
      diproyeksikan ortografis -> 6 sisi menumpuk jadi terlihat rata/gepeng,
      bukan kubus 3D.
   2. filter pada .spinner DILARANG: filter membuat elemen jadi flattening
      context sehingga transform-style preserve-3d diabaikan -> kubus
      kehilangan kedalaman. Glow dipindah ke box-shadow tiap sisi (aman).   */
.tess-svg {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  /* Kubus CSS 6 sisi sudah DIHAPUS — tesseract kini satu tubuh dan menggambar
     kubusnya sendiri. z-index dipertahankan hanya sebagai pengaman urutan
     tumpukan terhadap elemen lain di .spinner-wrap. */
  z-index: 1;
}

.spinner-wrap {
  position: relative;
  perspective: 700px;
  perspective-origin: 50% 42%;
  /* Diperbesar mengikuti TesseractCore (112 -> 168 -> 196).
     Permintaan user: "ukuran kubusnya gedein dikit".
     Wrap HARUS ikut naik supaya jarak vertikal ke judul tetap seimbang;
     kalau wrap dibiarkan, SVG absolute-centered tetap tampil tapi layout
     jadi bertumpuk. */
  width: 196px;
  height: 196px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 26px;
}

/* KUNCI 3D (saran Claude): kemiringan TETAP di wadah.
   Animasi .spinner memutar pada X/Y/Z sekaligus, sehingga pada banyak sudut
   sisi atas & bawah nyaris tidak terlihat -> kubus terbaca "kotak terbuka".
   Dengan wadah yang selalu miring -22deg, sisi ATAS selalu ikut terlihat,
   jadi mata selalu dapat minimal 3 sisi = kubus tertutup yang solid. */
.spinner-tilt {
  width: 84px;
  height: 84px;
  transform-style: preserve-3d;
  transform: rotateX(-22deg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 84px;
  height: 84px;
  --neon-1: #ff7a18;   /* oranye neon */
  --neon-2: #ffb020;   /* amber      */
  --neon-3: #ffd93d;   /* kuning neon*/
  --neon-glow: rgba(255, 138, 24, 0.75);
  animation: spinner 2.2s infinite linear;
  transform-style: preserve-3d;
  position: relative;
}

.spinner > div {
  /* Isi PADAT (kode asli user pakai #111). Ini yang bikin bentuknya terbaca
     sebagai kubus 3D: sisi depan menutup sisi belakang, tidak bertumpuk
     seperti kertas. Warna gelap kebiruan senada tema simulator.           */
  /* KACA, bukan pekat. Dulu #0b1120 solid: sisi depan menutup sisi belakang
     sehingga mata hanya melihat SATU kotak datar 2D. Sekarang tembus pandang
     supaya rusuk belakang tetap terlihat -> otak membacanya sebagai kubus. */
  background-color: rgba(11, 17, 32, 0.10);
  height: 100%;
  position: absolute;
  width: 100%;
  border: 2px solid var(--neon-1);
  border-radius: 3px;
  backface-visibility: visible;
  box-shadow: inset 0 0 12px rgba(255, 180, 70, 0.16);
}

.spinner div:nth-of-type(1) {
  /* DEPAN */
  transform: translateZ(42px);
  background-color: rgba(30, 46, 78, 0.13);
  border-color: #ffd93d;
  box-shadow: inset 0 0 16px rgba(255, 210, 100, 0.20);
}

.spinner div:nth-of-type(2) {
  /* BELAKANG */
  transform: rotateY(180deg) translateZ(42px);
  background-color: rgba(4, 7, 14, 0.46);
  border-color: rgba(255, 122, 24, 0.30);
  box-shadow: none;
}

.spinner div:nth-of-type(3) {
  /* KANAN */
  transform: rotateY(90deg) translateZ(42px);
  background-color: rgba(18, 27, 48, 0.09);
  border-color: #ffb020;
  box-shadow: none;
}

.spinner div:nth-of-type(4) {
  /* KIRI */
  transform: rotateY(-90deg) translateZ(42px);
  background-color: rgba(18, 27, 48, 0.09);
  border-color: #ffb020;
  box-shadow: none;
}

.spinner div:nth-of-type(5) {
  /* ATAS - paling terang, ini yang bikin kubus terasa padat */
  transform: rotateX(90deg) translateZ(42px);
  background-color: rgba(64, 88, 136, 0.26);
  border-color: #ffe27a;
  box-shadow: inset 0 0 18px rgba(255, 220, 130, 0.22);
}

.spinner div:nth-of-type(6) {
  /* BAWAH - paling gelap */
  transform: rotateX(-90deg) translateZ(42px);
  background-color: rgba(3, 5, 10, 0.50);
  border-color: rgba(255, 122, 24, 0.42);
  box-shadow: none;
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

/* Denyut glow halus supaya terasa "neon hidup" */
@keyframes neonPulse {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
}

/* Shimmer halus di progress bar */
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
        gap: 30,
        /* backdrop-filter DIHAPUS: blur(6px) pada lapisan selebar layar
           menghasilkan pita buram horizontal samar di belakang ikon & judul
           (artefak yang dilaporkan user sebagai "pantulan"). Latar sudah
           0.92 opaque, jadi blur tidak diperlukan. */
        backgroundColor: 'rgba(5, 8, 15, 0.96)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.22s ease',
        pointerEvents: visible ? 'auto' : 'none',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <style>{CSS}</style>

      {/* Spinner 3D — 6 div kode user. Dibungkus .spinner-wrap yang punya
          `perspective` supaya benar-benar tampak kubus 3D (bukan gepeng). */}
      <div className="spinner-wrap">
        {/* SATU TUBUH: tesseract adalah kubusnya sendiri.
            Sebelumnya ada dua objek terpisah (kubus CSS 6 sisi + SVG tesseract
            di dalamnya) sehingga terlihat "kubus punya kubus sendiri".
            Sekarang kubus CSS dihapus; TesseractCore menggambar kubus luar,
            kubus dalam, DAN 8 rusuk penghubung sebagai satu kesatuan. */}
        {/* Ukuran 168px (dulu 112px) atas permintaan user: "gedein size nya".
              Skala internal TesseractCore ikut proporsional, jadi tidak ada
              yang rusak — hanya lebih besar. */}
        <TesseractCore size={196} active={visible && !error} opacity={0.95} />
      </div>

      <div style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}>
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 15, fontWeight: 700, letterSpacing: 1.5,
          // Gradasi NEON: kuning -> amber -> oranye (senada judul simulator,
          // dibuat 3 stop + glow supaya terasa neon, bukan warna datar)
          background: error
            ? 'linear-gradient(180deg,#fca5a5 0%,#ef4444 55%,#b91c1c 100%)'
            : 'linear-gradient(180deg,#ffe066 0%,#ffb020 50%,#ff7a18 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: error
            ? 'drop-shadow(0 0 5px rgba(239,68,68,0.35))'
            : 'drop-shadow(0 0 5px rgba(255,138,24,0.35))',
          marginBottom: 8,
        }}>
          {error ? 'GAGAL MEMUAT MAP' : 'MEMUAT MAP BABFT'}
        </div>

        <div style={{
          // Teks tahap: diberi warna (permintaan user). Amber lembut supaya
          // senada dengan tema neon, tapi tetap terbaca sebagai info.
          fontSize: 13, lineHeight: 1.65,
          color: error ? '#fca5a5' : '#ffc66b',
          minHeight: 22, marginBottom: 16,
          fontWeight: 500,
        }}>
          {error || stage}
        </div>

        {/* Progress bar */}
        <div style={{
          width: 300, maxWidth: '78vw', height: 11,
          borderRadius: 99, overflow: 'hidden',
          backgroundColor: 'rgba(148, 163, 184, 0.18)',
          border: '1px solid rgba(245, 158, 11, 0.28)',
          margin: '0 auto',
          position: 'relative',
        }}>
          <div style={{
            height: '100%',
            width: indeterminate ? '35%' : `${pct}%`,
            borderRadius: 99,
            background: error
              ? 'linear-gradient(90deg, #ef4444, #f87171)'
              : 'linear-gradient(90deg, #ff7a18, #ffb020, #ffd93d)',
            transition: 'width 0.25s ease',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: error ? 'none' : '0 0 12px rgba(255,138,24,0.65)',
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

        {/* Angka: persen + MB + SISA (permintaan user: diperbesar & diberi warna).
            Ukuran naik 11px -> 15px, warna amber terang + glow halus. */}
        <div style={{
          marginTop: 12,
          fontSize: 15, fontWeight: 700,
          fontFamily: 'monospace', letterSpacing: 0.6, lineHeight: 1.75,
        }}>
          <div style={{
            color: error ? '#fca5a5' : '#ffd93d',
            textShadow: error ? 'none' : '0 0 12px rgba(255,180,40,0.45)',
          }}>
            {error
              ? 'Periksa koneksi lalu coba lagi'
              : totalBytes > 0
                ? `${pct}%  •  ${fmtMB(loadedBytes)} / ${fmtMB(totalBytes)}`
                : `${pct}%`}
          </div>
          {!error && totalBytes > 0 && loadedBytes < totalBytes && (
            <div style={{
              color: '#ff9d3d', marginTop: 4, fontSize: 14, fontWeight: 700,
              textShadow: '0 0 10px rgba(255,138,24,0.4)',
            }}>
              Kurang {fmtMB(totalBytes - loadedBytes)} lagi
            </div>
          )}
          {!error && totalBytes > 0 && loadedBytes >= totalBytes && loadedBytes > 0 && (
            <div style={{
              color: '#4ade80', marginTop: 4, fontSize: 14, fontWeight: 700,
              textShadow: '0 0 10px rgba(74,222,128,0.45)',
            }}>
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
          <div style={{
            // Keterangan cache: GOLD MURNI TERANG (permintaan user).
            // Tetap satu keluarga warna emas (bukan warna lain), gradasi tipis
            // antar-shade emas supaya terlihat berkilau, bukan datar.
            marginTop: 14, fontSize: 12.5, lineHeight: 1.65, fontWeight: 600,
            textWrap: 'balance',
            background: 'linear-gradient(90deg, #FFE066 0%, #FFD700 45%, #FFC400 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.25))',
          }}>
            Unduhan sekali saja, selanjutnya dari cache
          </div>
        )}
      </div>
    </div>
  );
}
