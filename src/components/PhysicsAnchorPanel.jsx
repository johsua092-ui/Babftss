/**
 * PhysicsAnchorPanel.jsx — Panel "Anchor" untuk tool PROPERTY (fitur baru 2026-09-20)
 * ============================================================================
 * PERMINTAAN USER: saat tool "property" diklik ke block → muncul jendela seperti
 * panel SCALE, lokasinya TEPAT DI KANAN (kanan atas), tapi hanya berisi SATU
 * menu tombol: checkbox "Anchor" — dan WAJIB SUDAH TERCENTANG saat diklik.
 *
 * Semantik (permintaan user):
 *   - SEMUA block yang baru diletakkan otomatis punya Anchor TERKUNCI
 *     (tidak bisa jatuh dengan cara apa pun sebelum centangnya dilepas).
 *   - Anchor DICABUT (uncheck) → block MULAI JATUH (gravitasi aktif).
 *
 * DESAIN: source-code fidelity — nilai PERSIS dari design system repo.
 * ATURAN KONTRAK #74 (jebakan #73): panel ini = SEKSI EMBEDDED di dalam panel
 * induk (Gizmo Options) — root-nya div KOLOM POLOS (position:static, TANPA
 * background/border/header sendiri). Kalau ia memasang position:absolute
 * top:80 sendiri DI DALAM panel yang juga top:80, koordinatnya MENUMPUK
 * (80+80=160) dan panel tampak salah tempat. Satu wilayah, satu background.
 * ============================================================================
 */
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

const ACCENT = '#f59e0b';
const TEXT_SECONDARY = '#94a3b8';
const TEXT_PRIMARY = '#e2e8f0';

export default function PhysicsAnchorPanel({ target, onChange }) {
  const [hover, setHover] = useState(false);

  // Baca status Anchor dari block (default true = terkunci).
  const [anchored, setAnchored] = useState(true);
  useEffect(() => {
    if (!target || !target.userData) return;
    setAnchored(target.userData.anchored !== false);
  }, [target]);

  if (!target) return null;

  const toggle = () => {
    const next = !anchored;
    setAnchored(next);
    onChange && onChange(target, next);
  };

  return (
    // Seksi embedded: kolom polos, TANPA background/border/position sendiri.
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Satu-satunya opsi: checkbox Anchor (default TERCENTANG) */}
      <button
        type="button"
        onClick={toggle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-pressed={anchored}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 9px', borderRadius: 9,
          cursor: 'pointer', textAlign: 'left', width: '100%',
          backgroundColor: hover ? 'rgba(30,41,59,0.75)' : 'rgba(30,41,59,0.5)',
          border: `1px solid ${hover ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.18)'}`,
          transition: 'all 0.15s ease',
        }}
      >
        {/* Kotak centang — checked = amber + centang gelap (pola checkbox app) */}
        <span style={{
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          backgroundColor: anchored ? ACCENT : 'rgba(148,163,184,0.22)',
          border: anchored ? 'none' : '1px solid rgba(148,163,184,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}>
          {anchored && <Check size={12} color="#0e1420" strokeWidth={3.5} />}
        </span>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 12,
          fontWeight: anchored ? 600 : 500,
          color: anchored ? TEXT_PRIMARY : TEXT_SECONDARY,
        }}>
          Anchor
        </span>
      </button>

      {/* Hint — dipecah per-keadaan (aturan: jangan 1 baris panjang) */}
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 10, lineHeight: 1.4,
        color: TEXT_SECONDARY,
      }}>
        {anchored
          ? 'Block terkunci — tidak bisa jatuh.'
          : 'Anchor dilepas — block akan jatuh.'}
      </div>
    </div>
  );
}
