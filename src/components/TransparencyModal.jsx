/**
 * TransparencyModal.jsx — Jendela input Transparency (fitur baru 2026-09-20)
 * ============================================================================
 * PERMINTAAN USER:
 *   Di bawah tombol "Shadow" (panel Property Options) ada tombol "Transparency".
 *   Bukan checkbox — kalau DIKLIK, membuka JENDELA BARU (sama seperti tombol "+"
 *   membuka jendela Scale), TAPI warnanya HIJAU TUA (bukan oranye).
 *   Isi jendela:
 *     - Input manual: hanya BILANGAN BULAT 0..100 (satuan persen, hanya visual).
 *       Tidak bisa koma, tidak bisa diedit satuan-nya.
 *     - 5 tombol template: 0% · 25% · 50% · 75% · 100% (klik → nilai terisi).
 *       0%   = tidak ada efek transparan (block solid).
 *       100% = invisible total.
 *     - Nilai baru DIPAKAI setelah user menekan "Konfirmasi".
 *     - Ada 2 tombol: Konfirmasi + Batal.
 *
 * DESAIN: meniru struktur ScaleNumberModal PERSIS (pola kontrak #90) —
 * overlay blur, panel radius 16, header ikon+judul, footer flex:1 simetris,
 * keyframes ber-prefix SENDIRI ('transp-') supaya tidak tabrakan.
 * HANYA aksen warna yang berbeda: HIJAU TUA (#15803D) + aksen terang (#22C55E)
 * sesuai permintaan user ("hijau tua").
 * ============================================================================
 */
import { useEffect, useState } from 'react';
import { Droplet } from 'lucide-react';

const ACCENT = '#22C55E';          // hijau terang (ikon/border/angka)
const ACCENT_DEEP = '#15803D';     // hijau TUA (tombol Konfirmasi, glow)
const PANEL_BG = 'rgba(14, 20, 32, 0.98)';
const ANIM_MS = 200;
const MIN_PCT = 0;
const MAX_PCT = 100;
const TEMPLATES = [0, 25, 50, 75, 100];

export default function TransparencyModal({ value = 0, onConfirm, onCancel }) {
  const [input, setInput] = useState(String(value ?? 0));
  const [closing, setClosing] = useState(false);
  const isPicker = true; // selalu jendela bebas (bisa ditutup klik luar/Escape)

  useEffect(() => {
    setInput(String(value ?? 0));
  }, [value]);

  const finishClose = (commit) => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => { commit(); }, ANIM_MS);
  };

  // Validasi: HANYA bilangan bulat 0..100 (tanpa koma/titik/tanda).
  const isIntegerStr = /^\d+$/.test(input.trim());
  const parsed = isIntegerStr ? parseInt(input, 10) : NaN;
  const valid = isIntegerStr && !Number.isNaN(parsed) && parsed >= MIN_PCT && parsed <= MAX_PCT;

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && valid) {
      e.preventDefault();
      finishClose(() => onConfirm && onConfirm(parsed));
    }
  };

  // Escape menutup (pola ScaleNumberModal/ScaleModeModal varian picker).
  useEffect(() => {
    if (!isPicker) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') finishClose(() => onCancel && onCancel());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPicker, closing]);

  return (
    <>
      {/* keyframes lokal — prefix 'transp' supaya tidak tabrakan */}
      <style>{`
        @keyframes transp-backdrop { from { opacity: 0 } to { opacity: 1 } }
        @keyframes transp-in {
          from { opacity: 0; transform: scale(0.35) translate(48px, -48px); }
          to   { opacity: 1; transform: scale(1) translate(0, 0); }
        }
        @keyframes transp-out {
          from { opacity: 1; transform: scale(1) translate(0, 0); }
          to   { opacity: 0; transform: scale(0.35) translate(48px, -48px); }
        }
      `}</style>

      <div
        onClick={() => finishClose(() => onCancel && onCancel())}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100,
          animation: 'transp-backdrop 0.2s ease-out',
        }}>
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: PANEL_BG,
            border: `2px solid ${ACCENT_DEEP}`,
            borderRadius: 16,
            padding: '24px 32px',
            width: 'min(560px, calc(100vw - 32px))',
            boxSizing: 'border-box',
            boxShadow: `0 20px 60px rgba(21,128,61,0.40), 0 0 100px rgba(34,197,94,0.18)`,
            fontFamily: 'Inter, sans-serif',
            transformOrigin: 'top right',
            animation: closing
              ? `transp-out ${ANIM_MS}ms cubic-bezier(0.4,0,1,1) forwards`
              : 'transp-in 0.34s cubic-bezier(0.16,1,0.3,1)',
          }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              backgroundColor: 'rgba(34,197,94,0.15)',
              border: `1px solid ${ACCENT}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: ACCENT, flexShrink: 0,
            }}>
              <Droplet size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                margin: 0, fontSize: 18, fontWeight: 700,
                color: '#f5f7fa', fontFamily: 'Orbitron, sans-serif',
                letterSpacing: '0.5px',
              }}>
                Transparency
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#94a3b8' }}>
                Atur tingkat transparansi block (persen)
              </p>
            </div>
          </div>

          <p style={{ margin: '0 0 18px 0', fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
            Masukkan <b>bilangan bulat</b> 0–100. <b>0%</b> = block solid (tanpa efek
            transparan), <b>100%</b> = invisible total. Hanya angka bulat (tanpa koma).
            Satuan <b>%</b> hanya penanda visual.
          </p>

          {/* INPUT MANUAL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <label htmlFor="transparency-input" style={{
              fontSize: 11, fontWeight: 700, color: '#94a3b8',
              fontFamily: 'Orbitron, sans-serif', textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Transparency (%)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                id="transparency-input"
                type="text"
                inputMode="numeric"
                placeholder="0 - 100"
                value={input}
                onChange={(e) => {
                  // Hanya digit yang diterima (koma/tanda/huruf dibuang paksa).
                  const v = e.target.value.replace(/[^\d]/g, '');
                  setInput(v);
                }}
                onKeyDown={onKeyDown}
                autoFocus
                style={{
                  flex: 1, boxSizing: 'border-box',
                  padding: '12px 14px', borderRadius: 10,
                  backgroundColor: 'rgba(30,41,59,0.6)',
                  border: `1.5px solid ${valid ? ACCENT_DEEP : 'rgba(239,68,68,0.6)'}`,
                  color: '#f5f7fa', fontSize: 16, fontWeight: 700,
                  fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums',
                  outline: 'none',
                }}
              />
              {/* Satuan % — hanya VISUAL, tidak bisa diedit */}
              <span style={{
                fontSize: 20, fontWeight: 800, color: ACCENT,
                fontFamily: 'Orbitron, sans-serif', userSelect: 'none',
              }}>%</span>
            </div>
            {!valid && (
              <div style={{ fontSize: 11, color: '#f87171', fontFamily: 'Inter, sans-serif' }}>
                Masukkan bilangan bulat 0 sampai 100 (tanpa koma).
              </div>
            )}
          </div>

          {/* TEMPLATE 5 TOMBOL */}
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#94a3b8',
              fontFamily: 'Orbitron, sans-serif', textTransform: 'uppercase',
              letterSpacing: '0.5px', marginBottom: 8,
            }}>
              Template
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {TEMPLATES.map((pct) => {
                const active = String(pct) === input.trim();
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setInput(String(pct))}
                    style={{
                      flex: 1, padding: '10px 6px', borderRadius: 9,
                      cursor: 'pointer',
                      backgroundColor: active ? 'rgba(34,197,94,0.18)' : 'rgba(30,41,59,0.5)',
                      border: `1.5px solid ${active ? ACCENT : 'rgba(148,163,184,0.22)'}`,
                      color: active ? ACCENT : '#e2e8f0',
                      fontSize: 13, fontWeight: 700,
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {pct}%
                  </button>
                );
              })}
            </div>
          </div>

          {/* FOOTER: Batal + Konfirmasi (flex:1 = simetris 50:50) */}
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
                backgroundColor: valid ? ACCENT_DEEP : 'rgba(21,128,61,0.3)',
                border: `1px solid ${valid ? ACCENT_DEEP : 'rgba(21,128,61,0.5)'}`,
                color: '#ffffff', fontSize: 13, fontWeight: 700,
                cursor: valid ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
                boxShadow: valid ? '0 4px 12px rgba(21,128,61,0.5)' : 'none',
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
