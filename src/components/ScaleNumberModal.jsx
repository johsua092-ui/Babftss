import { useEffect, useState } from 'react';
import { Maximize } from 'lucide-react';
import { STUDS_PER_BLOCK } from '../utils/blockStuds.js';

/* ================================================================
   ScaleNumberModal — Phase 74 (2026-09-19, sesi server z.ai)
   ================================================================
   Modal "SCALE NUMBER" — input nilai scale dalam satuan STUDS,
   apply ke block yang sedang di-attach ke gizmo (tc.object).

   USER (verbatim, inti):
   "jika ditekan [tombol '+'] akan memuncukan design jendela yang
   sama persis seperti saya menekan ikon settings [gear] — jendela
   peringatan bewarna oranye yang buat memilih 4 mode itu! namun
   yang ini bukan buat memilih 4 mode ya melainkan jendela oranye
   ini dipakai untuk input scale number = ...!"
   "1 block penuh dinyatakan sebagai 2 studs! dan jika 1 berarti
   setengahnya! lalu jika 0.5 berarti setengahnya satu dan
   seterusnya! itulah menjadi dasar fondasi perhitungan scale."

   ── FONDASI MATEMATIKA STUDA (MUTLAK, dari kontrak permanen md
      bab "STANDAR PENGUKURAN STUDS (USER 2026-09-15 — MUTLAK,
      SELAMANYA)" + helper src/utils/blockStuds.js + unit test
      test_blockStuds.mjs yang sudah 11/11 PASS):
     1. STUDS_PER_BLOCK = 2 (MUTLAK, jangan diubah).
     2. Block default (scale 1.0) = 2 studs per sumbu (P, L, T).
     3. Konversi: studs = STUDS_PER_BLOCK * |scale| = 2 * |scale|.
        Inverse: scale = studs / STUDS_PER_BLOCK = studs / 2.
     4. Verifikasi numerik:
          input 2 studs   → scale 1.0 = 1 block (default, tidak berubah)
          input 4 studs   → scale 2.0 = 2 block (2x lebih besar)
          input 6 studs   → scale 3.0 = 3 block
          input 1 studs   → scale 0.5 = setengah block
          input 0.5 studs → scale 0.25 = seperempat block
          input 0.25 studs→ scale 0.125 = 1/8 block
     5. MIN_STUDS = 0.25 (scale 0.125) — hard floor supaya tidak
        terlalu kecil sampai susah dilihat/di-klik. Bukan batas
        kontrak; kontrak hanya menyebut STUDS_PER_BLOCK = 2 sebagai
        default. Kalau user mau lebih kecil dari 0.25, naikkan
        MAX risiko ke render aliasing/salah-klik.

   ── DESIGN (SAMA PERSIS dengan ScaleModeModal — komentar header
      ScaleModeModal.jsx baris 42-55):
     - overlay  : rgba(0,0,0,0.75) + backdropFilter blur(8px)
     - panel    : rgba(14,20,32,0.98), radius 16, Inter
     - aksen    : ORANYE KEEMASAN — amber app #f59e0b
     - judul    : Orbitron uppercase "Scale Number"
     - footer   : Batal (outline abu) + Konfirmasi (solid amber),
                  flex:1 di kedua tombol = simetris 50:50
                  (warisan butir 80 kontrak: pola flex:1)
   ANIMASI: identik ScaleModeModal — panel membesar/mengecil dari
   transform-origin KANAN-ATAS (dekat tombol + di panel kanan-atas);
   backdrop fade.
   ================================================================ */

const ACCENT = '#f59e0b';
const PANEL_BG = 'rgba(14, 20, 32, 0.98)';
const ANIM_MS = 200;
const MIN_STUDS = 0;     // Phase 76: 0 supaya user bisa input 0 (no snap) + nilai kecil 0.01, 0.02, ...
const MAX_STUDS = 100;
const DEFAULT_STUDS = 2;
const STEP = 0.001;   // Phase 77: 0.001 supaya user bisa input 0.001, 0.002, ... halus (maks 3 desimal)

export default function ScaleNumberModal({
  value = DEFAULT_STUDS, onConfirm, onCancel,
}) {
  const [input, setInput] = useState(() => String(value));
  const [closing, setClosing] = useState(false);

  // Selalu sinkron kalau prop value berubah saat modal terbuka.
  useEffect(() => { setInput(String(value)); }, [value]);

  const finishClose = (commit) => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => { commit(); }, ANIM_MS);
  };

  // Parse + validasi input. Tampilkan pesan error inline kalau invalid.
  // Phase 76: MIN_STUDS = 0 supaya user bisa input 0 (= no snap, drag bebas)
  // dan nilai kecil seperti 0.01, 0.02, ... sesuai permintaan user.
  // Phase 77: validasi maksimal 3 angka di belakang koma (0.001 valid, 0.0001 invalid).
  // Penunjuk (hasil konversi) boleh banyak angka — cuma INPUT yang dibatasi 3 desimal.
  const parsed = parseFloat(input);
  const isNumber = !isNaN(parsed) && isFinite(parsed);
  // Hitung jumlah angka di belakang koma. Mis. "1.263" → 3, "1.2634" → 4 (invalid).
  // "1" → 0 (integer, valid). "0.001" → 3 (valid).
  const decimalPart = (typeof input === 'string' && input.includes('.'))
    ? input.split('.')[1] || ''
    : '';
  const hasMoreThan3Decimals = decimalPart.length > 3;
  const valid = isNumber && parsed >= MIN_STUDS && parsed <= MAX_STUDS && !hasMoreThan3Decimals;
  const isZero = valid && parsed === 0;  // 0 = snap dimatikan
  const scaleResult = (valid && !isZero) ? (parsed / STUDS_PER_BLOCK) : null;
  const blockResult = (valid && !isZero) ? scaleResult : null;

  // Enter key = Konfirmasi (kalau valid).
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && valid) {
      e.preventDefault();
      finishClose(() => onConfirm && onConfirm(parsed));
    }
  };

  return (
    <>
      {/* keyframes lokal — nama ber-prefix 'scalenum' supaya tidak tabrakan
          dengan keyframes ScaleModeModal yang ber-prefix 'scalemode'. */}
      <style>{`
        @keyframes scalenum-backdrop { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scalenum-in {
          from { opacity: 0; transform: scale(0.35) translate(48px, -48px); }
          to   { opacity: 1; transform: scale(1) translate(0, 0); }
        }
        @keyframes scalenum-out {
          from { opacity: 1; transform: scale(1) translate(0, 0); }
          to   { opacity: 0; transform: scale(0.35) translate(48px, -48px); }
        }
      `}</style>

      {/* Overlay — bisa ditutup lewat klik luar (sama seperti varian
          picker ScaleModeModal — ini jendela input bebas, bukan
          onboarding wajib). */}
      <div
        onClick={() => finishClose(() => onCancel && onCancel())}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100,
          animation: 'scalenum-backdrop 0.2s ease-out',
        }}>
        {/* Panel — membesar dari kanan-atas (dekat tombol +) */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: PANEL_BG,
            border: `2px solid ${ACCENT}`,
            borderRadius: 16,
            padding: '24px 32px',
            width: 'min(560px, calc(100vw - 32px))',
            boxSizing: 'border-box',
            boxShadow: `0 20px 60px rgba(245,158,11,0.35), 0 0 100px rgba(245,158,11,0.18)`,
            fontFamily: 'Inter, sans-serif',
            transformOrigin: 'top right',
            animation: closing
              ? `scalenum-out ${ANIM_MS}ms cubic-bezier(0.4,0,1,1) forwards`
              : 'scalenum-in 0.34s cubic-bezier(0.16,1,0.3,1)',
          }}>
          {/* Header — identik ScaleModeModal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${ACCENT}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: ACCENT, flexShrink: 0,
            }}>
              <Maximize size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                margin: 0, fontSize: 18, fontWeight: 700,
                color: '#f5f7fa', fontFamily: 'Orbitron, sans-serif',
                letterSpacing: '0.5px',
              }}>
                Scale Number
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#94a3b8' }}>
                Masukkan step scale dalam studs (0 = bebas, maks 3 desimal, koma → titik)
              </p>
            </div>
          </div>

          {/* Penjelasan singkat — fondasi matematika studs + behavior step */}
          <p style={{
            margin: '0 0 18px 0', fontSize: 13, color: '#cbd5e1', lineHeight: 1.6,
          }}>
            Nilai studs = <b>step</b> untuk snap drag bola gizmo. <b>0 = snap
            dimatikan</b> (drag bebas tanpa batasan matematika). Maks <b>3 angka
            di belakang koma</b> (0.001, 0.002, ..., 1.263, dst). Koma <code>,</code>
            diubah paksa jadi titik <code>.</code> — mis. ketik "1,5" → "1.5".
            Penunjuk (hasil konversi di bawah) boleh banyak angka, cuma input
            yang dibatasi 3 desimal. 1 block penuh = 2 studs; 1 studs = setengah
            block; 0.5 studs = seperempat block. Snap aktif di mode 1/4/6 side.
            Mode 2 side (bawaan) tidak snap.
          </p>

          {/* ── INPUT FIELD — body utama modal ini ── */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            marginBottom: 16,
          }}>
            <label htmlFor="scale-number-input" style={{
              fontSize: 11, fontWeight: 700, color: '#94a3b8',
              fontFamily: 'Orbitron, sans-serif', textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Scale (studs)
            </label>
            <input
              id="scale-number-input"
              type="text"
              inputMode="decimal"
              placeholder="0.001 - 100"
              value={input}
              onChange={(e) => {
                // Phase 77: koma ',' → titik '.' paksa. type=text supaya kita
                // kontrol penuh (type=number di browser berbeda locale, koma
                // kadang tidak diterima).
                const v = e.target.value.replace(/,/g, '.');
                setInput(v);
              }}
              onKeyDown={onKeyDown}
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 14px', borderRadius: 10,
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                border: `1.5px solid ${valid ? ACCENT : 'rgba(148,163,184,0.22)'}`,
                color: '#e2e8f0', fontSize: 18, fontWeight: 700,
                fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums',
                outline: 'none', transition: 'border-color 0.15s ease',
              }}
            />
            {/* Hasil konversi real-time — supaya user lihat efek input */}
            {valid && isZero ? (
              <div style={{
                fontSize: 12, color: '#86efac',
                fontFamily: 'Inter, sans-serif', fontWeight: 600,
              }}>
                Snap dimatikan — drag bola gizmo bebas tanpa batasan step
              </div>
            ) : valid ? (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 12, color: '#94a3b8',
                fontFamily: 'Inter, sans-serif',
              }}>
                <span>= scale factor <span style={{ color: ACCENT, fontWeight: 700 }}>
                  {scaleResult.toFixed(3)}
                </span></span>
                <span>= <span style={{ color: ACCENT, fontWeight: 700 }}>
                  {blockResult.toFixed(3)}
                </span> block per step</span>
              </div>
            ) : (
              <div style={{
                fontSize: 12, color: '#fca5a5',
                fontFamily: 'Inter, sans-serif',
              }}>
                Masukkan angka {MIN_STUDS}–{MAX_STUDS} studs, maks 3 angka di
                belakang koma (mis. 0.001). Pakai titik, bukan koma.
              </div>
            )}
          </div>

          {/* Tabel konversi cepat — supaya user paham matematika studs */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 6, marginBottom: 18,
            padding: '10px 12px', borderRadius: 8,
            backgroundColor: 'rgba(30, 41, 59, 0.35)',
            border: '1px solid rgba(148,163,184,0.14)',
          }}>
            {[
              { studs: 0,     desc: 'no snap (bebas)' },
              { studs: 0.001, desc: '1/2000 block' },
              { studs: 0.01,  desc: '1/200 block' },
              { studs: 0.1,   desc: '1/20 block' },
              { studs: 1,     desc: 'setengah block' },
              { studs: 2,     desc: '1 block (default)' },
            ].map((row) => (
              <div key={row.studs} style={{
                display: 'flex', flexDirection: 'column', gap: 2,
                padding: '4px 6px', borderRadius: 6,
                backgroundColor: 'rgba(245,158,11,0.06)',
              }}>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: ACCENT,
                  fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums',
                }}>{row.studs} studs</span>
                <span style={{
                  fontSize: 10, color: '#94a3b8',
                  fontFamily: 'Inter, sans-serif',
                }}>{row.desc}</span>
              </div>
            ))}
          </div>

          {/* Footer: Batal (outline) + Konfirmasi (solid amber).
              Sama persis dengan ScaleModeModal footer:
              flex:1 di kedua tombol = simetris 50:50
              (warisan butir 80 kontrak). */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => finishClose(() => onCancel && onCancel())}
              style={{
                flex: 1, padding: '10px 20px', borderRadius: 8,
                backgroundColor: 'transparent',
                border: '1px solid #334155', color: '#94a3b8',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s ease', fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(148,163,184,0.1)';
                e.currentTarget.style.borderColor = '#64748b';
                e.currentTarget.style.color = '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              Batal
            </button>
            <button
              onClick={() => valid && finishClose(() => onConfirm && onConfirm(parsed))}
              disabled={!valid}
              style={{
                flex: 1, padding: '10px 24px', borderRadius: 8,
                backgroundColor: valid ? ACCENT : 'rgba(245,158,11,0.3)',
                border: `1px solid ${valid ? ACCENT : 'rgba(245,158,11,0.5)'}`,
                color: '#0e1420', fontSize: 13, fontWeight: 700,
                cursor: valid ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
                boxShadow: valid ? '0 4px 12px rgba(245,158,11,0.4)' : 'none',
              }}
            >
              Konfirmasi
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
