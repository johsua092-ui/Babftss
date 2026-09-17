import { useEffect, useState } from 'react';
import { Check, Maximize } from 'lucide-react';
import {
  SCALE_MODES, SCALE_MODE_LABEL, SCALE_MODE_DESC, DEFAULT_SCALE_MODE, normalizeScaleMode,
} from '../utils/scaleModes.js';

/* ================================================================
   ScaleModeModal — Phase 73 (2026-09-15, permintaan user)
   ================================================================
   Modal "SCALE MODE" — pilih aturan scaling dari 4 mode (1/2/4/6 side).

   USER (verbatim, inti):
   "kalau user buka 3dblocksimulator lalu klik scale maka muncul kotak
    peringatan berwarna ORANYE KEEMASAN... design seperti Clear All, hanya
    saja lebih besar karena menampung 6 tombol... namanya 'Scale Mode' dan
    TIDAK BISA DITUTUP kecuali user klik confirm/cancel. 6 tombol = kiri
    bawah Confirm, kanan bawah Cancel, + 4 tombol tengah: '1 side' '2 side'
    '4 side' '6 side'... default ter-set '1 side' dan walau cancel pun
    dianggap memilih 1 sisi... jika pilih 4 side lalu confirm baru
    dinyatakan memilih mode itu... jendela ini hanya muncul 1x saja jika
    confirm; kalau cancel, muncul lagi tiap equip scale."

   DESIGN (source-code fidelity — nilai PERSIS dari design system repo,
   acuan = modal Clear All BlockSimulator3D baris 23144):
     - overlay  : rgba(0,0,0,0.75) + backdropFilter blur(8px)
     - panel    : rgba(14,20,32,0.98), radius 16, Inter
     - aksen    : ORANYE KEEMASAN — amber app #f59e0b (border/glow/tombol
                  aktif). Beda dari Clear All (merah #ef4444) sesuai minta.
     - judul    : Orbitron uppercase (pola header panel app)
     - aksi     : Batal (outline abu) + Konfirmasi (solid amber) — persis
                  layout footer Clear All, hanya warna aksen berbeda.
   ANIMASI (permintaan user: "menutup = mengecil masuk ke tombol +",
   "membuka = kotak kecil membesar"): panel membesar/mengecil dari
   transform-origin KANAN-ATAS (dekat tombol + di panel kanan-atas);
   backdrop fade. Animasi keluar dituntaskan dulu (200ms) baru unmount
   (onConfirm/onCancel dipanggil SETELAH animasi agar terasa hidup).
   ================================================================ */

const ACCENT = '#f59e0b';            // amber app (oranye keemasan)
const PANEL_BG = 'rgba(14, 20, 32, 0.98)';
const ANIM_MS = 200;

export default function ScaleModeModal({ value = DEFAULT_SCALE_MODE, onConfirm, onCancel }) {
  // selected = pilihan SEMENTARA (baru berlaku saat Konfirmasi). Default =
  // mode aktif sekarang (biasanya '1side').
  const [selected, setSelected] = useState(() => normalizeScaleMode(value));
  const [closing, setClosing] = useState(false);

  // Selalu sinkron kalau prop value berubah saat modal terbuka.
  useEffect(() => { setSelected(normalizeScaleMode(value)); }, [value]);

  const finishClose = (commit) => {
    if (closing) return;
    setClosing(true);
    // Tuntaskan animasi mengecil dulu, baru commit ke parent.
    setTimeout(() => { commit(); }, ANIM_MS);
  };

  return (
    <>
      {/* keyframes lokal — nama ber-prefix 'scalemode' supaya tidak tabrakan */}
      <style>{`
        @keyframes scalemode-backdrop { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scalemode-in {
          from { opacity: 0; transform: scale(0.35) translate(48px, -48px); }
          to   { opacity: 1; transform: scale(1) translate(0, 0); }
        }
        @keyframes scalemode-out {
          from { opacity: 1; transform: scale(1) translate(0, 0); }
          to   { opacity: 0; transform: scale(0.35) translate(48px, -48px); }
        }
      `}</style>

      {/* Overlay — TIDAK menutup saat diklik (user: "tidak bisa ditutup
          kecuali klik confirm/cancel"). */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100,
        animation: 'scalemode-backdrop 0.2s ease-out',
      }}>
        {/* Panel — membesar dari kanan-atas (dekat tombol +) */}
        <div style={{
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
            ? `scalemode-out ${ANIM_MS}ms cubic-bezier(0.4,0,1,1) forwards`
            : 'scalemode-in 0.34s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* Header */}
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
            <div>
              <h3 style={{
                margin: 0, fontSize: 18, fontWeight: 700,
                color: '#f5f7fa', fontFamily: 'Orbitron, sans-serif',
                letterSpacing: '0.5px',
              }}>
                Scale Mode
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#94a3b8' }}>
                Pilih aturan scaling sebelum men-scale block
              </p>
            </div>
          </div>

          {/* Penjelasan singkat */}
          <p style={{
            margin: '0 0 18px 0', fontSize: 13, color: '#cbd5e1', lineHeight: 1.6,
          }}>
            Mode menentukan sisi mana yang memanjang saat kamu menarik bola gizmo.
            Mode aktif dipakai sampai kamu ganti lewat tombol di panel.
          </p>

          {/* Grid 4 mode — tombol UTAMA tugas ini */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24,
          }}>
            {SCALE_MODES.map((m) => {
              const active = selected === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelected(m)}
                  aria-pressed={active}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 5,
                    alignItems: 'flex-start', textAlign: 'left',
                    padding: '12px 14px', borderRadius: 10,
                    cursor: 'pointer',
                    backgroundColor: active ? 'rgba(245,158,11,0.14)' : 'rgba(30,41,59,0.5)',
                    border: `1.5px solid ${active ? ACCENT : 'rgba(148,163,184,0.22)'}`,
                    boxShadow: active ? '0 0 16px rgba(245,158,11,0.35)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                    <span style={{
                      fontFamily: 'Orbitron, sans-serif', fontWeight: 700,
                      fontSize: 16, color: active ? ACCENT : '#e2e8f0',
                    }}>
                      {SCALE_MODE_LABEL[m]}
                    </span>
                    {m === '2side' && (
                      <span style={{
                        marginLeft: 'auto', fontSize: 8.5, fontWeight: 700,
                        color: '#94a3b8', fontFamily: 'Orbitron, sans-serif',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>bawaan</span>
                    )}
                    {active && (
                      <span style={{
                        marginLeft: m === '2side' ? 6 : 'auto', width: 16, height: 16,
                        borderRadius: 4, backgroundColor: ACCENT, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={12} color="#0e1420" strokeWidth={3.5} />
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: active ? '#cbd5e1' : '#94a3b8', lineHeight: 1.45 }}>
                    {SCALE_MODE_DESC[m]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer: Batal (outline) + Konfirmasi (solid amber) */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={() => finishClose(() => onCancel && onCancel())}
              style={{
                padding: '10px 20px', borderRadius: 8,
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
              onClick={() => finishClose(() => onConfirm && onConfirm(selected))}
              style={{
                padding: '10px 24px', borderRadius: 8,
                backgroundColor: ACCENT, border: `1px solid ${ACCENT}`,
                color: '#0e1420', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
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
