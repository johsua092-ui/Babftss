/**
 * PhysicsAnchorPanel.jsx — Panel "Property Options" untuk tool PROPERTY
 * ============================================================================
 * PERMINTAAN USER (2026-09-20, lanjutan):
 *   Panel Property berisi 3 tombol (dari atas ke bawah):
 *     1. "Anchor"    — default NYALA (terkunci, tidak bisa jatuh)
 *     2. "Collision" — default NYALA. Kalau dimatikan → block TEMBUS:
 *                      tidak bertumpuk, jatuh menembus lantai/block lain,
 *                      dan kalau masuk ke bawah tanah (void) → DIHAPUS.
 *     3. "Shadow"    — default NYALA. Kalau dimatikan → block tidak punya
 *                      bayangan sama sekali.
 *
 * DESAIN: source-code fidelity — nilai PERSIS dari design system repo.
 * ATURAN KONTRAK #74: panel ini = SEKSI EMBEDDED di dalam panel induk
 * (satu wilayah, satu background) — root-nya div KOLOM POLOS.
 * ATURAN KONTRAK #48: baris opsi dibangun REUSABLE (pola yang sama untuk
 * 3 tombol) supaya konsisten + mudah ditambah opsi baru.
 * ============================================================================
 */
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

const ACCENT = '#f59e0b';
const ACCENT_GREEN = '#22C55E';   // aksen hijau terang (tombol Transparency)
const TEXT_SECONDARY = '#94a3b8';
const TEXT_PRIMARY = '#e2e8f0';

/** Satu baris opsi (checkbox + label + hint) — reusable untuk semua opsi. */
function OptionRow({ label, checked, onToggle, hintOn, hintOff }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-pressed={checked}
        aria-label={label}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 9px', borderRadius: 9,
          cursor: 'pointer', textAlign: 'left', width: '100%',
          backgroundColor: hover ? 'rgba(30,41,59,0.75)' : 'rgba(30,41,59,0.5)',
          border: `1px solid ${hover ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.18)'}`,
          transition: 'all 0.15s ease',
        }}
      >
        <span style={{
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          backgroundColor: checked ? ACCENT : 'rgba(148,163,184,0.22)',
          border: checked ? 'none' : '1px solid rgba(148,163,184,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}>
          {checked && <Check size={12} color="#0e1420" strokeWidth={3.5} />}
        </span>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 12,
          fontWeight: checked ? 600 : 500,
          color: checked ? TEXT_PRIMARY : TEXT_SECONDARY,
        }}>
          {label}
        </span>
      </button>
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 10, lineHeight: 1.4,
        color: TEXT_SECONDARY, paddingLeft: 2,
      }}>
        {checked ? hintOn : hintOff}
      </div>
    </div>
  );
}

export default function PhysicsAnchorPanel({ target, onChange, onOpenTransparency }) {
  // Baca status dari block (default semua NYALA — dibaca lewat `!== false`).
  const [anchored, setAnchored] = useState(true);
  const [collision, setCollision] = useState(true);
  const [shadow, setShadow] = useState(true);

  useEffect(() => {
    if (!target || !target.userData) return;
    setAnchored(target.userData.anchored !== false);
    setCollision(target.userData.noCollision !== true);
    setShadow(target.userData.noShadow !== true);
  }, [target]);

  // TIDAK ada block terpilih → panel TIDAK dirender (permintaan user: opsi ini
  // "untuk siapa?" kalau belum ada yang dipilih; kekuatan hanya berlaku untuk
  // block yang sudah terpilih).
  if (!target) return null;

  const toggleAnchor = () => {
    const next = !anchored;
    setAnchored(next);
    onChange && onChange('anchor', target, next);
  };
  const toggleCollision = () => {
    const next = !collision;
    setCollision(next);
    onChange && onChange('collision', target, next);
  };
  const toggleShadow = () => {
    const next = !shadow;
    setShadow(next);
    onChange && onChange('shadow', target, next);
  };

  const transparencyPct = target.userData && typeof target.userData.transparencyPct === 'number'
    ? target.userData.transparencyPct : 0;

  return (
    // Seksi embedded: kolom polos, TANPA background/border/position sendiri.
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <OptionRow
        label="Anchor"
        checked={anchored}
        onToggle={toggleAnchor}
        hintOn="Block terkunci — tidak bisa jatuh."
        hintOff="Anchor dilepas — block akan jatuh."
      />
      <OptionRow
        label="Collision"
        checked={collision}
        onToggle={toggleCollision}
        hintOn="Block padat — bertumpuk normal."
        hintOff="Block tembus — jatuh menembus & hilang di bawah tanah."
      />
      <OptionRow
        label="Shadow"
        checked={shadow}
        onToggle={toggleShadow}
        hintOn="Block punya bayangan."
        hintOff="Block tidak punya bayangan."
      />

      {/* Transparency — BUKAN checkbox: tombol yang membuka jendela baru
          (pola tombol "+" panel Scale). Warna hijau tua (bukan oranye). */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <button
          type="button"
          onClick={() => onOpenTransparency && onOpenTransparency(target)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 9px', borderRadius: 9,
            cursor: 'pointer', textAlign: 'left', width: '100%',
            backgroundColor: 'rgba(21,128,61,0.18)',
            border: '1px solid #15803D',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(21,128,61,0.32)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(21,128,61,0.18)'; }}
        >
          {/* Ikon tetes (hijau) menggantikan kotak centang — menandakan "buka jendela" */}
          <span style={{
            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: ACCENT_GREEN, fontSize: 13, fontWeight: 900, lineHeight: 1,
          }}>%</span>
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
            color: TEXT_PRIMARY,
          }}>
            Transparency
          </span>
          {/* Nilai saat ini di kanan */}
          <span style={{
            marginLeft: 'auto', fontFamily: 'Orbitron, sans-serif',
            fontSize: 11, fontWeight: 700, color: ACCENT_GREEN,
            fontVariantNumeric: 'tabular-nums',
          }}>{transparencyPct}%</span>
        </button>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 10, lineHeight: 1.4,
          color: TEXT_SECONDARY, paddingLeft: 2,
        }}>
          {transparencyPct === 0
            ? 'Block solid — klik untuk atur transparansi.'
            : `Block transparan ${transparencyPct}% — klik untuk ubah.`}
        </div>
      </div>
    </div>
  );
}
