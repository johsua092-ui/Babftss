import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  IconSliders, IconClose, IconShield, IconCamera, IconAvatar, IconTeam,
  IconGauge, IconReset, IconLock, IconCheck, IconChevron, IconOpen, IconFlag,
} from './BlockIcons.jsx';

/* ═══════════════════════════════════════════════════════════════════════════
   PENGATURAN SIMULATOR — desain ulang (2026-10-22)

   MASALAH DESAIN LAMA (diukur, bukan opini):
   1. TIPOGRAFI TABRAKAN — judul pakai Orbitron (font display gaming) sementara
      isi pakai Inter. Terlihat seperti dua template digabung paksa.
   2. HIERARKI GAGAL — chip "3.0×" dan "BUKA" lebih menarik mata daripada
      judul setelannya sendiri.
   3. KONTRAS GAGAL WCAG — label "0.5×"/"5.0×" 10px #64748b di atas
      rgba(30,41,59,.5) = rasio 3.07:1 (minimum AA = 4.5:1).
   4. PALET ACAK — ungu neon (header) + cyan (slider) + hijau (avatar) +
      gradien ungu (footer) dalam satu panel. Tidak ada identitas warna.
   5. SEMUA JADI KOTAK — tiga kartu terpisah (104px & 143px) dengan padding
      sama, sehingga tidak ada yang menonjol; dekorasi menggantikan hierarki.
   6. SLIDER NATIF `<input type=range>` — beda sendiri dengan slider kustom
      di Admin Panel. Inkonsisten.

   SISTEM DESAIN BARU (satu bahasa untuk seluruh panel):
   - Satu aksen saja: sky #38bdf8. Warna tim hanya dipakai sebagai DATA
     (swatch tim), bukan hiasan.
   - Tipografi tunggal: Inter. Eyebrow 10px/800 renggang, judul 15px/700,
     isi 11.5px/400. Tanpa Orbitron di panel setelan.
   - Pemisah garis rambut (hairline) menggantikan tumpukan kartu → jauh
     lebih tenang, dan mata dipandu oleh ukuran/berat huruf, bukan kotak.
   - Semua teks sekunder minimal #94a3b8 (rasio ≥ 5.7:1) & ukuran ≥ 10.5px.
   - Slider KUSTOM (pointer capture) — sama persis dengan Admin Panel.
   - Tanpa glow neon, tanpa gradien dekoratif, tanpa emoji/karakter panah.
   ═══════════════════════════════════════════════════════════════════════════ */

const C = {
  surface: '#0b1220',
  surfaceRaise: 'rgba(148,163,184,0.045)',
  surfaceSunken: 'rgba(2,6,23,0.55)',
  border: 'rgba(148,163,184,0.13)',
  borderStrong: 'rgba(148,163,184,0.22)',
  hairline: 'rgba(148,163,184,0.10)',
  ink: '#f1f5f9',
  inkSoft: '#cbd5e1',
  muted: '#a3b1c2',
  faint: '#93a1b5',
  accent: '#38bdf8',
  accentDim: 'rgba(56,189,248,0.14)',
  accentLine: 'rgba(56,189,248,0.45)',
  // Ungu khusus Admin Panel — pembeda dari baris setelan lain (permintaan user).
  violet: '#a78bfa',
  violetDim: 'rgba(139,92,246,0.16)',
  violetLine: 'rgba(167,139,250,0.55)',
  danger: '#f87171',
};

const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

/* ── Baris setelan: label + kontrol sejajar, deskripsi di bawah ───────────── */
function SettingRow({ icon, label, hint, children, last }) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: 7,
        padding: '13px 0',
        borderBottom: last ? 'none' : `1px solid ${C.hairline}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(148,163,184,0.08)',
            border: `1px solid ${C.border}`,
            color: C.muted,
          }}>{icon}</span>
          <span style={{ fontSize: 12.5, fontWeight: 650, color: C.ink, letterSpacing: -0.05, lineHeight: 1.3 }}>
            {label}
          </span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>{children}</span>
      </div>
      {hint ? (
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, paddingLeft: 30 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

/* ── Nilai angka: tabular, tenang, tidak berteriak ────────────────────────── */
function ValueChip({ children }) {
  return (
    <span
      style={{
        fontFamily: FONT,
        fontSize: 12, fontWeight: 700,
        color: C.accent,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: -0.2,
        minWidth: 34, textAlign: 'right',
      }}
    >
      {children}
    </span>
  );
}

/* ── Slider kustom (pointer capture) — sama dengan Admin Panel ────────────── */
function Slider({ value, min, max, step, onChange, label }) {
  const trackRef = useRef(null);
  const dragRef = useRef(false);
  const [active, setActive] = useState(false);

  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const valueFromX = useCallback((clientX) => {
    const el = trackRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width <= 0) return null;
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const raw = min + ratio * (max - min);
    const snapped = Math.round(raw / step) * step;
    return Math.min(max, Math.max(min, Number(snapped.toFixed(4))));
  }, [min, max, step]);

  const onDown = (e) => {
    e.stopPropagation();
    dragRef.current = true;
    setActive(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    const v = valueFromX(e.clientX);
    if (v !== null) onChange(v);
  };

  const onMove = (e) => {
    if (!dragRef.current) return;
    e.stopPropagation();
    const v = valueFromX(e.clientX);
    if (v !== null) onChange(v);
  };

  const onUp = (e) => {
    if (!dragRef.current) return;
    e.stopPropagation();
    dragRef.current = false;
    setActive(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  const onKey = (e) => {
    let v = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = value + step;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = value - step;
    else if (e.key === 'Home') v = min;
    else if (e.key === 'End') v = max;
    if (v === null) return;
    e.preventDefault();
    onChange(Math.min(max, Math.max(min, Number(v.toFixed(4)))));
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onKeyDown={onKey}
      style={{
        position: 'relative',
        height: 18,
        display: 'flex', alignItems: 'center',
        cursor: 'pointer', touchAction: 'none', outline: 'none',
      }}
    >
      <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 99, background: C.surfaceSunken, border: `1px solid ${C.border}` }} />
      <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 4, borderRadius: 99, background: C.accent, opacity: active ? 1 : 0.85 }} />
      <div
        style={{
          position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)',
          width: active ? 15 : 13, height: active ? 15 : 13, borderRadius: '50%',
          background: '#e0f2fe',
          border: `2px solid ${C.accent}`,
          boxShadow: active ? `0 0 0 4px ${C.accentDim}` : 'none',
          transition: 'width .12s ease, height .12s ease, box-shadow .12s ease',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

/* ── Kontrol tersegmen (Camera vs Avatar) ─────────────────────────────────── */
function Segmented({ value, options, onChange, disabled, disabledNote }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        role="tablist"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${options.length}, 1fr)`,
          gap: 3, padding: 3, borderRadius: 9,
          background: C.surfaceSunken,
          border: `1px solid ${C.border}`,
          opacity: disabled ? 0.55 : 1,
        }}
      >
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="tab"
              aria-selected={on}
              disabled={disabled}
              onClick={() => { if (!disabled) onChange(o.value); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '7px 8px', borderRadius: 7,
                border: `1px solid ${on ? C.accentLine : 'transparent'}`,
                background: on ? C.accentDim : 'transparent',
                color: on ? C.accent : C.muted,
                fontSize: 11, fontWeight: on ? 700 : 500,
                fontFamily: FONT,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background .15s ease, color .15s ease, border-color .15s ease',
              }}
            >
              <span style={{ display: 'flex', opacity: on ? 1 : 0.7 }}>{o.icon}</span>
              {o.label}
            </button>
          );
        })}
      </div>
      {disabled && disabledNote ? (
        <div style={{ fontSize: 10.5, color: C.faint, lineHeight: 1.45 }}>{disabledNote}</div>
      ) : null}
    </div>
  );
}

/* ── Baris navigasi (membuka Admin Panel) ─────────────────────────────────── */
function ActionRow({ icon, label, hint, trailing, onClick, accent, tone }) {
  // tone='violet' → baris ditandai ungu (dipakai Admin Panel) supaya berbeda
  // dari baris setelan biasa. `accent` tetap berarti "sedang aktif".
  const isViolet = tone === 'violet';
  const mark = isViolet ? C.violet : C.accent;
  const markDim = isViolet ? C.violetDim : C.accentDim;
  const markLine = isViolet ? C.violetLine : C.accentLine;
  const lit = accent || isViolet;

  const restBg = isViolet ? C.violetDim : C.surfaceRaise;
  const restBorder = isViolet ? C.violetLine : C.border;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 12px', borderRadius: 10, textAlign: 'left',
        background: restBg,
        border: `1px solid ${restBorder}`,
        cursor: 'pointer', fontFamily: FONT,
        transition: 'background .16s ease, border-color .16s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isViolet ? 'rgba(139,92,246,0.24)' : 'rgba(148,163,184,0.08)';
        e.currentTarget.style.borderColor = isViolet ? mark : C.borderStrong;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = restBg;
        e.currentTarget.style.borderColor = restBorder;
      }}
    >
      <span
        style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: lit ? markDim : 'rgba(148,163,184,0.10)',
          border: `1px solid ${lit ? markLine : C.border}`,
          color: lit ? mark : C.muted,
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 650, color: C.ink, letterSpacing: -0.05 }}>{label}</span>
        <span style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.45 }}>{hint}</span>
      </span>
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{trailing}</span>
    </button>
  );
}

/* ── Pemilih tim ──────────────────────────────────────────────────────────── */
function TeamPicker({ teams, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const current = teams.find((t) => t.key === value) || teams[0];
  const hex = (c) => '#' + c.toString(16).padStart(6, '0');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: disabled ? 0.55 : 1 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 8,
          background: C.surfaceSunken,
          border: `1px solid ${C.border}`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: FONT, width: '100%',
        }}
      >
        <IconFlag size={30} color={hex(current.color)} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 650, color: C.inkSoft }}>
          {current.name}
        </span>
        <IconChevron
          size={12}
          style={{
            color: C.muted,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .16s ease',
          }}
        />
      </button>

      {open && !disabled && (
        <div
          style={{
            display: 'flex', flexDirection: 'column', gap: 3,
            padding: 5, borderRadius: 9,
            background: C.surfaceSunken, border: `1px solid ${C.border}`,
          }}
        >
          {teams.map((t) => {
            const on = t.key === value;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => { onChange(t.key); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '7px 9px', borderRadius: 7,
                  background: on ? C.accentDim : 'transparent',
                  border: `1px solid ${on ? C.accentLine : 'transparent'}`,
                  color: on ? C.accent : C.inkSoft,
                  fontSize: 12, fontWeight: on ? 700 : 550,
                  fontFamily: FONT, cursor: 'pointer', textAlign: 'left',
                  transition: 'background .14s ease',
                }}
              >
                <IconFlag size={30} color={hex(t.color)} />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.name.replace(' Team', '')}
                </span>
                {on ? <IconCheck size={13} /> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SettingsModal({
  open, onClose,
  babftActive,
  teams = [],
  teamKey, onTeamChange,
  cameraSpeed, onCameraSpeed, onCameraSpeedReset,
  isAvatarMode, onModeChange,
  adminPanelOpen, adminPanelMinimized, onToggleAdminPanel,
}) {
  // Esc untuk menutup — standar dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Scrollbar kustom. Inline style TIDAK bisa menyentuh ::-webkit-scrollbar,
  // jadi tanpa ini Chrome menampilkan scrollbar putih bawaan yang menabrak
  // tema gelap panel. Di-inject sekali, dibiarkan hidup (murah & idempoten).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const ID = 'settings-modal-scroll-css';
    if (document.getElementById(ID)) return;
    const el = document.createElement('style');
    el.id = ID;
    el.textContent = `
      .sm-scroll { scrollbar-width: thin; scrollbar-color: rgba(148,163,184,0.42) transparent; }
      .sm-scroll::-webkit-scrollbar { width: 10px; }
      .sm-scroll::-webkit-scrollbar-track {
        background: rgba(148,163,184,0.06);
        border-radius: 999px;
        margin: 8px 2px;
      }
      .sm-scroll::-webkit-scrollbar-thumb {
        border-radius: 999px;
        background: rgba(148,163,184,0.34);
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      .sm-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(34,211,238,0.62);
        background-clip: padding-box;
      }
      .sm-scroll::-webkit-scrollbar-corner { background: transparent; }
      /* Panah atas/bawah bawaan Chrome dimatikan — di panel gelap mereka
         tampil sebagai kotak abu yang tidak perlu dan merusak kesatuan. */
      .sm-scroll::-webkit-scrollbar-button:single-button { display: none; height: 0; }
      .sm-scroll::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
    `;
    document.head.appendChild(el);
  }, []);

  if (!open) return null;

  const adminState = !adminPanelOpen ? 'Buka' : (adminPanelMinimized ? 'Terbuka (minimize)' : 'Terbuka');

  const panel = (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        background: 'rgba(2,6,23,0.72)',
        backdropFilter: 'blur(6px)',
        fontFamily: FONT,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pengaturan Simulator"
        style={{
          width: '100%', maxWidth: 460,
          borderRadius: 14,
          background: C.surface,
          border: `1px solid ${C.border}`,
          boxShadow: '0 24px 64px -12px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03) inset',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          maxHeight: '88vh',
        }}
      >
        {/* ── Kepala ─────────────────────────────────────────────────────── */}
        <div style={{ padding: '15px 16px 13px', borderBottom: `1px solid ${C.hairline}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <IconSliders size={13} style={{ color: C.accent }} />
                <span style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
                  textTransform: 'uppercase', color: C.faint,
                }}>
                  Simulator
                </span>
              </div>
              <div style={{
                fontSize: 15, fontWeight: 700, color: C.ink,
                letterSpacing: -0.25, marginTop: 4, lineHeight: 1.25,
              }}>
                Pengaturan
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: `1px solid ${C.border}`,
                color: C.muted, cursor: 'pointer',
                transition: 'color .14s ease, border-color .14s ease, background .14s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = C.danger;
                e.currentTarget.style.borderColor = 'rgba(248,113,113,0.45)';
                e.currentTarget.style.background = 'rgba(248,113,113,0.10)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = C.muted;
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <IconClose size={13} />
            </button>
          </div>

          {/* Status ringkas — 2 chip netral, bukan hiasan */}
          <div style={{ display: 'flex', gap: 5, marginTop: 11 }}>
            <StatusPill on={!!babftActive} label={babftActive ? 'Map BABFT' : 'Map Default'} />
          </div>
        </div>

        {/* ── Isi ────────────────────────────────────────────────────────── */}
        <div
          className="sm-scroll"
          style={{
            padding: '2px 10px 6px 16px',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarGutter: 'stable',
          }}
        >

          {/* Admin Panel */}
          <div style={{ paddingTop: 12, paddingBottom: 4 }}>
            <ActionRow
              icon={<IconShield size={15} />}
              label="Admin Panel"
              hint="Jendela melayang untuk Build, Scene & Player."
              accent={!!adminPanelOpen}
              tone="violet"
              onClick={onToggleAdminPanel}
              trailing={
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px', borderRadius: 6,
                  background: adminPanelOpen ? C.violetDim : 'rgba(148,163,184,0.10)',
                  border: `1px solid ${adminPanelOpen ? C.violetLine : C.border}`,
                  color: adminPanelOpen ? C.violet : C.inkSoft,
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.2, whiteSpace: 'nowrap',
                }}>
                  {adminState}
                  <IconOpen size={10} />
                </span>
              }
            />
          </div>

          {/* Tim aktif — hanya relevan di map BABFT */}
          <div style={{ borderTop: `1px solid ${C.hairline}`, marginTop: 6 }}>
            <SettingRow
              icon={<IconTeam size={14} />}
              label="Tim Aktif"
              hint={babftActive
                ? 'Menentukan dermaga tempat Anda membangun & titik Teleport To Team.'
                : 'Hanya tersedia di map BABFT.'}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.faint }}>
                {!babftActive ? <IconLock size={11} /> : null}
              </span>
            </SettingRow>
            <div style={{ paddingBottom: 13, paddingLeft: 30 }}>
              <TeamPicker
                teams={teams}
                value={teamKey}
                onChange={onTeamChange}
                disabled={!babftActive}
              />
            </div>
          </div>

          {/* Kecepatan kamera */}
          <div style={{ borderTop: `1px solid ${C.hairline}` }}>
          <SettingRow
            icon={<IconGauge size={14} />}
            label="Kecepatan Kamera"
            hint="Seberapa cepat kamera bergeser saat WASD / pan."
          >
            <ValueChip>{cameraSpeed.toFixed(1)}×</ValueChip>
          </SettingRow>
          <div style={{ paddingBottom: 12, paddingLeft: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ fontSize: 11, color: C.muted, fontVariantNumeric: 'tabular-nums', width: 26 }}>0.5</span>
              <div style={{ flex: 1 }}>
                <Slider
                  label="Kecepatan Kamera"
                  value={cameraSpeed}
                  min={0.5}
                  max={5}
                  step={0.1}
                  onChange={onCameraSpeed}
                />
              </div>
              <span style={{ fontSize: 11, color: C.muted, fontVariantNumeric: 'tabular-nums', width: 26, textAlign: 'right' }}>5.0</span>
              <button
                type="button"
                onClick={onCameraSpeedReset}
                title="Kembalikan ke 2.0×"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  background: 'transparent', border: `1px solid ${C.border}`,
                  color: C.muted, cursor: 'pointer',
                  transition: 'color .14s ease, border-color .14s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = C.accent;
                  e.currentTarget.style.borderColor = C.accentLine;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = C.muted;
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <IconReset size={12} />
              </button>
            </div>
          </div>
          </div>

          {/* Mode kontrol */}
          <div style={{ borderTop: `1px solid ${C.hairline}` }}>
            <SettingRow
              icon={isAvatarMode ? <IconAvatar size={14} /> : <IconCamera size={14} />}
              label="Mode Kontrol"
              hint={isAvatarMode
                ? 'Karakter berjalan dengan W/A/S/D, lompat dengan Spasi.'
                : 'Kamera bebas: geser dengan WASD, zoom dengan roda mouse.'}
              last
            />
            <div style={{ paddingBottom: 14, paddingLeft: 30 }}>
              <Segmented
                value={isAvatarMode ? 'avatar' : 'camera'}
                onChange={(v) => onModeChange(v === 'avatar')}
                options={[
                  { value: 'camera', label: 'Camera', icon: <IconCamera size={13} /> },
                  { value: 'avatar', label: 'Avatar', icon: <IconAvatar size={13} /> },
                ]}
              />
            </div>
          </div>
        </div>

        {/* ── Kaki ───────────────────────────────────────────────────────── */}
        <div style={{
          padding: '11px 16px',
          borderTop: `1px solid ${C.hairline}`,
          display: 'flex', justifyContent: 'flex-end',
          background: 'rgba(2,6,23,0.35)',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px', borderRadius: 8,
              background: C.accent, border: `1px solid ${C.accent}`,
              color: '#04121f', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: FONT, letterSpacing: -0.05,
              transition: 'filter .14s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}

function StatusPill({ on, label, tone }) {
  const accent = tone === 'neutral' ? '#94a3b8' : C.accent;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 7px', borderRadius: 5,
        background: on ? 'rgba(56,189,248,0.09)' : 'rgba(148,163,184,0.06)',
        border: `1px solid ${on ? 'rgba(56,189,248,0.22)' : C.border}`,
        fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: on ? accent : C.faint,
      }}
    >
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: on ? accent : '#475569',
        display: 'block',
      }} />
      {label}
    </span>
  );
}
