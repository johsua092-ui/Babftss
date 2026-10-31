import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Crown, Boxes, Crosshair, Grid3x3, Rocket, Footprints, ChevronsUp,
  Infinity as InfinityIcon, Gauge, ChevronDown, ChevronRight, Minus, X,
  GripHorizontal, Lock, UserRound, RotateCcw, Wind, Scan, Sparkles, Plane,
  MapPin, Sun, Moon,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN PANEL — jendela melayang (floating window) Build & Player.

   PERBAIKAN PENTING (2026-10-22, laporan user):
   1. Panel di-render lewat createPortal ke document.body. Sebelumnya panel
      berada DI DALAM modal Pengaturan yang punya `backdrop-filter` +
      `overflow: hidden` + `transform`. Ketiga properti itu membuat
      `position: fixed` mengacu ke modal (bukan viewport) dan memotong isi →
      slider terasa "berat/susah diseret" & panel tidak bisa digeser bebas.
      Dengan portal, panel jadi anak langsung <body> → koordinat fixed benar.
   2. Slider diganti slider KUSTOM (pointer events + setPointerCapture),
      bukan <input type=range>. Klik di titik mana pun langsung melompat ke
      nilai itu, tahan-geser mulus, dan tidak "berebut" dengan handler modal.
   3. Fly Speed ditambahkan (kecepatan terbang bisa diatur sendiri).
   4. Desain dirombak mengikuti bahasa visual simulator: dark navy gradient,
      aksen ungu #a855f7 / cyan #22d3ee, angka Orbitron, switch & slider
      buatan sendiri (bukan kontrol bawaan browser yang terlihat murah).
   ═══════════════════════════════════════════════════════════════════════════ */

// Gaya tombol Siang/Malam — mengikuti pola tombol terkunci panel lain.
const timeBtnStyle = (active, accent, locked) => ({
  flex: 1,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  padding: '7px 8px', borderRadius: 8,
  cursor: locked ? 'not-allowed' : 'pointer',
  border: `1px solid ${locked
    ? 'rgba(71,85,105,0.3)'
    : (active ? accent : 'rgba(148,163,184,0.22)')}`,
  background: locked
    ? 'rgba(15,23,42,0.5)'
    : (active ? `${accent}33` : 'rgba(30,41,59,0.6)'),
  color: locked ? '#475569' : (active ? accent : '#94a3b8'),
  fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif',
  transition: 'all 0.15s ease',
});

const ACCENT = {
  scene: '#f59e0b',
  build: '#22d3ee',
  player: '#a855f7',
};

/* ── Switch kustom (bukan checkbox bawaan) ── */
function Switch({ checked, disabled, accent, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'relative',
        width: 40,
        height: 21,
        flexShrink: 0,
        borderRadius: 999,
        border: `1px solid ${disabled
          ? 'rgba(100,116,139,0.28)'
          : (checked ? accent : 'rgba(148,163,184,0.42)')}`,
        background: disabled
          ? 'rgba(30,41,59,0.5)'
          : (checked
            ? `linear-gradient(135deg, ${accent} 0%, ${accent}bb 100%)`
            : 'rgba(30,41,59,0.85)'),
        boxShadow: disabled
          ? 'none'
          : (checked ? `0 0 10px ${accent}88, inset 0 1px 0 rgba(255,255,255,0.28)` : 'inset 0 1px 3px rgba(0,0,0,0.5)'),
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0,
        transition: 'background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 21 : 2,
          width: 15,
          height: 15,
          borderRadius: '50%',
          background: checked && !disabled ? '#fff' : (disabled ? '#475569' : '#94a3b8'),
          boxShadow: checked && !disabled ? '0 1px 3px rgba(0,0,0,0.45)' : 'none',
          transition: 'left 0.18s cubic-bezier(.34,1.56,.64,1), background 0.18s ease',
        }}
      />
    </button>
  );
}

/* ── Baris toggle ── */
function Row({ icon, label, desc, checked, disabled, onChange, accent, lockNote }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '8px 9px',
        borderRadius: 9,
        background: disabled
          ? 'rgba(15,23,42,0.42)'
          : (checked ? `linear-gradient(90deg, ${accent}22 0%, rgba(15,23,42,0.55) 100%)` : 'rgba(15,23,42,0.55)'),
        border: `1px solid ${disabled ? 'rgba(71,85,105,0.3)' : (checked ? `${accent}66` : 'rgba(148,163,184,0.14)')}`,
        opacity: disabled ? 0.6 : 1,
        transition: 'background 0.18s ease, border-color 0.18s ease',
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          flexShrink: 0,
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: disabled ? '#475569' : accent,
          background: disabled ? 'rgba(30,41,59,0.6)' : `${accent}1f`,
          border: `1px solid ${disabled ? 'rgba(71,85,105,0.35)' : `${accent}44`}`,
        }}
      >
        {disabled ? <Lock size={13} /> : icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: disabled ? '#64748b' : '#f1f5f9', lineHeight: 1.25 }}>
          {label}
        </div>
        {desc ? (
          <div style={{ fontSize: 9.5, color: disabled ? '#475569' : '#8798b0', lineHeight: 1.35, marginTop: 1 }}>
            {disabled && lockNote ? lockNote : desc}
          </div>
        ) : null}
      </div>
      <Switch checked={checked} disabled={disabled} accent={accent} onChange={onChange} label={label} />
    </div>
  );
}

/* ── Slider kustom: klik-langsung + tahan-geser mulus ── */
function Slider({ icon, label, value, min, max, step, unit, disabled, onChange, accent, hint }) {
  const trackRef = useRef(null);
  const dragRef = useRef(false);
  const [active, setActive] = useState(false);

  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const valueFromX = useCallback((clientX) => {
    const el = trackRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width <= 0) return null;
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    let v = min + t * (max - min);
    v = Math.round(v / step) * step;
    return Math.min(max, Math.max(min, Number(v.toFixed(4))));
  }, [min, max, step]);

  const apply = (clientX) => {
    const v = valueFromX(clientX);
    if (v !== null && v !== value) onChange(v);
  };

  const onPointerDown = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = true;
    setActive(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    apply(e.clientX);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current || disabled) return;
    e.stopPropagation();
    apply(e.clientX);
  };
  const endDrag = (e) => {
    if (!dragRef.current) return;
    dragRef.current = false;
    setActive(false);
    e.stopPropagation();
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  const nudge = (dir) => {
    if (disabled) return;
    const v = Math.min(max, Math.max(min, Number((value + dir * step).toFixed(4))));
    onChange(v);
  };

  return (
    <div
      style={{
        padding: '8px 9px',
        borderRadius: 9,
        background: 'rgba(15,23,42,0.55)',
        border: `1px solid ${disabled ? 'rgba(71,85,105,0.3)' : (active ? `${accent}77` : 'rgba(148,163,184,0.14)')}`,
        opacity: disabled ? 0.6 : 1,
        transition: 'border-color 0.18s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
        <span
          style={{
            width: 26, height: 26, flexShrink: 0, borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: disabled ? '#475569' : accent,
            background: disabled ? 'rgba(30,41,59,0.6)' : `${accent}1f`,
            border: `1px solid ${disabled ? 'rgba(71,85,105,0.35)' : `${accent}44`}`,
          }}
        >
          {disabled ? <Lock size={13} /> : icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: disabled ? '#64748b' : '#f1f5f9', lineHeight: 1.25 }}>
            {label}
          </div>
          {hint ? (
            <div style={{ fontSize: 9, color: disabled ? '#475569' : '#8798b0', marginTop: 1 }}>{hint}</div>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          <button
            type="button"
            disabled={disabled}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); nudge(-1); }}
            style={nudgeStyle(disabled, accent)}
            title="Kurangi"
          >
            −
          </button>
          <span
            style={{
              minWidth: 46, textAlign: 'center',
              fontFamily: 'Orbitron, monospace', fontSize: 10.5, fontWeight: 700,
              color: disabled ? '#64748b' : accent,
              background: disabled ? 'rgba(30,41,59,0.7)' : `${accent}1a`,
              border: `1px solid ${disabled ? 'rgba(71,85,105,0.3)' : `${accent}4d`}`,
              borderRadius: 5, padding: '2px 5px',
            }}
          >
            {value}{unit}
          </span>
          <button
            type="button"
            disabled={disabled}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); nudge(1); }}
            style={nudgeStyle(disabled, accent)}
            title="Tambah"
          >
            +
          </button>
        </div>
      </div>

      {/* TRACK — area klik/geser yang lebar & mulus */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          position: 'relative',
          height: 22,
          display: 'flex',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : (active ? 'grabbing' : 'pointer'),
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {/* rel */}
        <div
          style={{
            position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 999,
            background: 'rgba(2,6,23,0.85)',
            border: '1px solid rgba(148,163,184,0.18)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7)',
          }}
        />
        {/* isi */}
        <div
          style={{
            position: 'absolute', left: 0, width: `${pct}%`, height: 6, borderRadius: 999,
            background: disabled
              ? 'rgba(71,85,105,0.7)'
              : `linear-gradient(90deg, ${accent}88 0%, ${accent} 100%)`,
            boxShadow: disabled ? 'none' : `0 0 8px ${accent}99`,
            transition: active ? 'none' : 'width 0.1s linear',
          }}
        />
        {/* knop */}
        <div
          style={{
            position: 'absolute',
            left: `calc(${pct}% - 8px)`,
            width: 16, height: 16, borderRadius: '50%',
            background: disabled ? '#475569' : '#fff',
            border: `2px solid ${disabled ? '#64748b' : accent}`,
            boxShadow: disabled ? 'none' : `0 0 ${active ? 12 : 7}px ${accent}cc`,
            transform: active ? 'scale(1.15)' : 'scale(1)',
            transition: active ? 'transform 0.08s ease' : 'left 0.1s linear, transform 0.12s ease',
          }}
        />
      </div>
    </div>
  );
}

const nudgeStyle = (disabled, accent) => ({
  width: 18, height: 18, borderRadius: 5, padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 12, fontWeight: 800, lineHeight: 1,
  cursor: disabled ? 'not-allowed' : 'pointer',
  color: disabled ? '#475569' : accent,
  background: disabled ? 'rgba(30,41,59,0.6)' : `${accent}14`,
  border: `1px solid ${disabled ? 'rgba(71,85,105,0.3)' : `${accent}3d`}`,
});

/* ── Header bagian ── */
function SectionHeader({ label, icon, isOpen, onClick, accent, right }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 2px', marginBottom: 4,
        background: 'transparent', border: 'none', cursor: 'pointer',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 3, height: 12, borderRadius: 2, background: accent, boxShadow: `0 0 6px ${accent}` }} />
        <span style={{ color: accent }}>{icon}</span>
        <span style={{
          fontSize: 9.5, fontWeight: 800, letterSpacing: 1.4,
          textTransform: 'uppercase', color: accent, fontFamily: 'Orbitron, sans-serif',
        }}>
          {label}
        </span>
        {right}
      </span>
      <span style={{ color: accent, opacity: 0.8, display: 'flex' }}>
        {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </span>
    </button>
  );
}

export default function AdminPanel({
  open, onClose, minimized, onToggleMinimize,
  babftActive,
  showBuildAreaBounds, onShowBuildAreaBounds,
  showTeamCenterAxes, onShowTeamCenterAxes,
  showTeamGridArea, onShowTeamGridArea,
  isFreeBuild, onFreeBuild,
  isAvatarMode, onRequestAvatarMode,
  flyEnabled, onFly,
  flySpeed, onFlySpeed,
  walkSpeed, onWalkSpeed,
  jumpPower, onJumpPower,
  infiniteJump, onInfiniteJump,
  onTeleportToTeam, teamName,
  onChangeAvatar,
  timeOfDay, onTimeOfDay,
  onResetPlayer,
}) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ x: null, y: null });
  const dragRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  // Drag untuk versi MINIMIZE (pill). Dipisah dari dragRef header supaya
  // keduanya tidak saling menimpa saat panel di-minimize / dibuka lagi.
  const pillRef = useRef(null);
  const pillDragRef = useRef(null);
  const pillMovedRef = useRef(false);
  const [openScene, setOpenScene] = useState(true);
  const [openBuild, setOpenBuild] = useState(true);
  const [openPlayer, setOpenPlayer] = useState(true);

  // Posisi awal: kanan atas
  useEffect(() => {
    if (!open || pos.x !== null) return;
    if (typeof window === 'undefined') return;
    setPos({ x: Math.max(12, window.innerWidth - 336), y: 76 });
  }, [open, pos.x]);

  // ── Drag header: pakai pointer capture → mulus, tidak "lepas" ──
  const onHeaderPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const el = panelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: r.left, py: r.top };
    setDragging(true);
    e.preventDefault();
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  };

  const onHeaderPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    e.stopPropagation();
    // Tanpa clamp: panel boleh keluar batas layar seperti menggeser jendela
    // browser ke luar dinding. Tarik balik → muncul lagi di posisi semula.
    setPos({
      x: d.px + (e.clientX - d.sx),
      y: d.py + (e.clientY - d.sy),
    });
  };

  const onHeaderPointerUp = (e) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    e.stopPropagation();
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  // Scrollbar kustom: <style> di-inject sekali ke <head>. Inline style TIDAK
  // bisa menyentuh ::-webkit-scrollbar, jadi scroll bawaan tampil putih polos.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const ID = 'admin-panel-scroll-css';
    if (document.getElementById(ID)) return;
    const el = document.createElement('style');
    el.id = ID;
    el.textContent = `
      .ap-scroll { scrollbar-width: thin; scrollbar-color: rgba(168,85,247,0.55) transparent; }
      .ap-scroll::-webkit-scrollbar { width: 9px; height: 9px; }
      .ap-scroll::-webkit-scrollbar-track {
        background: rgba(148,163,184,0.07);
        border-radius: 999px;
        margin: 7px 2px;
      }
      .ap-scroll::-webkit-scrollbar-thumb {
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(168,85,247,0.9), rgba(34,211,238,0.8));
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      .ap-scroll::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #a855f7, #22d3ee);
        background-clip: padding-box;
      }
      .ap-scroll::-webkit-scrollbar-corner { background: transparent; }
    `;
    document.head.appendChild(el);
  }, []);

  // ── Drag pill minimize: bisa digeser bebas seperti jendela lain ──
  // Beda dengan header panel: pill ini juga sebuah tombol (klik = buka panel).
  // Karena itu gerakan harus dibedakan dari klik → pakai ambang 4px.
  // Tanpa ambang, klik biasa akan dianggap geser dan panel tak pernah terbuka.
  const onPillPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const el = pillRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    pillDragRef.current = { sx: e.clientX, sy: e.clientY, px: r.left, py: r.top, id: e.pointerId };
    pillMovedRef.current = false;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  };

  const onPillPointerMove = (e) => {
    const d = pillDragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    // Ambang 4px: di bawah ini masih dianggap klik, bukan geser.
    if (!pillMovedRef.current && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    pillMovedRef.current = true;
    setPos({ x: d.px + dx, y: d.py + dy });
  };

  const onPillPointerUp = (e) => {
    const d = pillDragRef.current;
    if (!d || d.id !== e.pointerId) return;
    pillDragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
    // Klik asli (tidak geser) → buka panel. Geser → jangan buka.
    if (!pillMovedRef.current) onToggleMinimize();
  };

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const playerLocked = !isAvatarMode;
  // Scene (suasana langit) hanya berlaku di map BABFT — di luar itu pudar & mati.
  const sceneLocked = !babftActive;
  const isNight = timeOfDay === 'night';
  // Teleport To Team HANYA masuk akal di map BABFT (pangkalan 7 tim ada di sana).
  // Di map default tombol harus PUDAR + tidak bisa diinteraksi, sama seperti
  // tombol lain yang terkunci (ikut gaya `Row` disabled: opacity 0.6 + ikon Lock).
  const teleportLocked = playerLocked || !babftActive;
  const teleportLockNote = !babftActive ? 'Hanya di map BABFT.' : 'Butuh Avatar Mode.';

  /* ── Versi MINIMIZE: pill kecil ── */
  if (minimized) {
    return createPortal(
      <button
        ref={pillRef}
        type="button"
        onPointerDown={onPillPointerDown}
        onPointerMove={onPillPointerMove}
        onPointerUp={onPillPointerUp}
        onPointerCancel={onPillPointerUp}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleMinimize(); } }}
        style={{
          position: 'fixed',
          left: pos.x === null ? undefined : pos.x,
          top: pos.y === null ? undefined : pos.y,
          right: pos.x === null ? 16 : undefined,
          zIndex: 10050,
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '8px 13px', borderRadius: 999,
          cursor: pillDragRef.current ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          border: '1px solid rgba(168,85,247,0.7)',
          color: '#fff', fontSize: 11, fontWeight: 800,
          fontFamily: 'Orbitron, sans-serif', letterSpacing: 0.5,
          boxShadow: '0 8px 24px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
        }}
        title="Klik untuk buka · geser untuk pindah"
      >
        <Crown size={13} />
        ADMIN PANEL
        <ChevronRight size={12} style={{ opacity: 0.8 }} />
      </button>,
      document.body
    );
  }

  const panel = (
    <div
      ref={panelRef}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: pos.x === null ? undefined : pos.x,
        top: pos.y === null ? undefined : pos.y,
        right: pos.x === null ? 16 : undefined,
        width: 322,
        maxWidth: 'calc(100vw - 12px)',
        maxHeight: 'calc(100vh - 16px)',
        display: 'flex', flexDirection: 'column',
        zIndex: 10050,
        borderRadius: 13,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #0e172a 0%, #0a0f1d 100%)',
        border: '1px solid rgba(168,85,247,0.34)',
        boxShadow: '0 22px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(34,211,238,0.10), 0 0 34px rgba(168,85,247,0.16)',
        fontFamily: 'Inter, sans-serif',
        userSelect: 'none',
        willChange: 'left, top',
      }}
    >
      {/* ══ HEADER (area drag) ══ */}
      <div
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onPointerCancel={onHeaderPointerUp}
        style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, padding: '9px 10px',
          background: 'linear-gradient(100deg, rgba(168,85,247,0.34) 0%, rgba(79,70,229,0.24) 55%, rgba(34,211,238,0.16) 100%)',
          borderBottom: '1px solid rgba(168,85,247,0.28)',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <span
            style={{
              width: 25, height: 25, borderRadius: 7, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              border: '1px solid rgba(216,180,254,0.6)',
              boxShadow: '0 0 12px rgba(168,85,247,0.6)',
              color: '#fff',
            }}
          >
            <Crown size={13} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: '#f5f3ff',
              fontFamily: 'Orbitron, sans-serif', letterSpacing: 1.1, lineHeight: 1.1,
              whiteSpace: 'nowrap',
            }}>
              ADMIN PANEL
            </div>
            <div style={{ fontSize: 8.5, color: '#c4b5fd', letterSpacing: 0.4, marginTop: 1, whiteSpace: 'nowrap' }}>
              Build &amp; Player · geser header untuk pindah
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <GripHorizontal size={13} color="#a78bfa" style={{ opacity: 0.7, marginRight: 1 }} />
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }}
            title="Minimize"
            style={winBtnStyle('#cbd5e1', 'rgba(148,163,184,0.3)')}
          >
            <Minus size={12} />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            title="Tutup"
            style={winBtnStyle('#fca5a5', 'rgba(248,113,113,0.4)')}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div
        className="ap-scroll"
        style={{
          padding: '9px 6px 9px 9px',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex', flexDirection: 'column', gap: 3,
          // ruang untuk scrollbar supaya isi tidak tertutup
          scrollbarGutter: 'stable',
        }}
      >

        {/* Status chips */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 4 }}>
          <span style={chipStyle(babftActive ? '#10b981' : '#64748b')}>
            {babftActive ? 'MAP BABFT' : 'MAP DEFAULT'}
          </span>
          <span style={chipStyle(isAvatarMode ? '#22d3ee' : '#f59e0b')}>
            {isAvatarMode ? 'AVATAR MODE' : 'CAMERA MODE'}
          </span>
        </div>

        {/* ══════ SCENE ══════ */}
        <SectionHeader
          label="Scene"
          icon={<Sun size={12} />}
          isOpen={openScene}
          onClick={() => setOpenScene((v) => !v)}
          accent={ACCENT.scene}
          right={!babftActive ? (
            <span style={{ fontSize: 8, color: '#f59e0b', letterSpacing: 0.3 }}>terkunci</span>
          ) : null}
        />

        {openScene && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {!babftActive && (
              <div style={{
                padding: '6px 8px', borderRadius: 7,
                background: 'rgba(245,158,11,0.09)',
                border: '1px dashed rgba(245,158,11,0.4)',
                fontSize: 9, color: '#fbbf24', lineHeight: 1.45,
              }}>
                <b>Scene terkunci</b> — suasana langit hanya tersedia di <b>map BABFT</b>.
                Pindah ke map BABFT untuk mengaktifkan.
              </div>
            )}

            {/* Suasana Langit: Siang & Malam (dipindah dari Pengaturan Simulator) */}
            <div style={{
              padding: '8px 9px', borderRadius: 9,
              background: sceneLocked ? 'rgba(15,23,42,0.42)' : 'rgba(15,23,42,0.55)',
              border: `1px solid ${sceneLocked ? 'rgba(71,85,105,0.3)' : 'rgba(148,163,184,0.14)'}`,
              opacity: sceneLocked ? 0.6 : 1,
              pointerEvents: sceneLocked ? 'none' : 'auto',
              transition: 'background 0.18s ease, border-color 0.18s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <div style={{
                  fontSize: 11.5, fontWeight: 700, lineHeight: 1.25,
                  color: sceneLocked ? '#64748b' : '#f1f5f9',
                  display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
                }}>
                  {sceneLocked
                    ? <Lock size={13} style={{ color: '#475569', flexShrink: 0 }} />
                    : (isNight ? <Moon size={13} color="#38bdf8" /> : <Sun size={13} color="#f59e0b" />)}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Suasana Langit: Siang &amp; Malam
                  </span>
                </div>
                <div style={{
                  padding: '2px 7px', borderRadius: 5, flexShrink: 0,
                  backgroundColor: sceneLocked
                    ? 'rgba(30,41,59,0.6)'
                    : (isNight ? 'rgba(56,189,248,0.15)' : 'rgba(245,158,11,0.15)'),
                  border: `1px solid ${sceneLocked
                    ? 'rgba(71,85,105,0.35)'
                    : (isNight ? 'rgba(56,189,248,0.35)' : 'rgba(245,158,11,0.35)')}`,
                  color: sceneLocked ? '#475569' : (isNight ? '#38bdf8' : '#fbbf24'),
                  fontFamily: 'Orbitron, sans-serif', fontSize: 9, fontWeight: 700,
                }}>
                  {isNight ? 'MALAM' : 'SIANG'}
                </div>
              </div>

              <div style={{ fontSize: 9.5, color: sceneLocked ? '#475569' : '#8798b0', lineHeight: 1.35, marginBottom: 7 }}>
                {isNight
                  ? 'Langit malam bertabur ribuan bintang bercahaya & bulan purnama lembut.'
                  : 'Langit biru cerah berawan, matahari terik & bayangan balok super tajam.'}
              </div>

              <div style={{ display: 'flex', gap: 5 }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onTimeOfDay && onTimeOfDay('day'); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  disabled={sceneLocked}
                  style={timeBtnStyle(!isNight, '#f59e0b', sceneLocked)}
                >
                  <Sun size={12} />
                  Siang
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onTimeOfDay && onTimeOfDay('night'); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  disabled={sceneLocked}
                  style={timeBtnStyle(isNight, '#38bdf8', sceneLocked)}
                >
                  <Moon size={12} />
                  Malam
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════ BUILD ══════ */}
        <SectionHeader
          label="Build"
          icon={<Boxes size={12} />}
          isOpen={openBuild}
          onClick={() => setOpenBuild((v) => !v)}
          accent={ACCENT.build}
          right={!babftActive ? (
            <span style={{ fontSize: 8, color: '#f59e0b', letterSpacing: 0.3 }}>terkunci</span>
          ) : null}
        />
        {openBuild && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {!babftActive && (
              <div style={{
                padding: '6px 8px', borderRadius: 7,
                background: 'rgba(245,158,11,0.09)',
                border: '1px dashed rgba(245,158,11,0.4)',
                fontSize: 9, color: '#fbbf24', lineHeight: 1.45,
              }}>
                Fitur Build hanya aktif di <b>map BABFT</b>. Pindah ke Build Area BABFT untuk membukanya.
              </div>
            )}
            <Row
              icon={<Scan size={13} />}
              label="Tampilkan Area Build"
              desc="Garis pembatas area build tim."
              checked={showBuildAreaBounds}
              disabled={!babftActive}
              accent="#10b981"
              onChange={onShowBuildAreaBounds}
              lockNote="Butuh map BABFT."
            />
            <Row
              icon={<Crosshair size={13} />}
              label="Tampilkan Titik Tengah Tim"
              desc="3 sumbu RGB di pusat pangkalan tim."
              checked={showTeamCenterAxes}
              disabled={!babftActive}
              accent="#38bdf8"
              onChange={onShowTeamCenterAxes}
              lockNote="Butuh map BABFT."
            />
            <Row
              icon={<Grid3x3 size={13} />}
              label="Tampilkan Grid Area"
              desc="Kisi kotak pangkalan tim — jadi acuan geser block."
              checked={showTeamGridArea}
              disabled={!babftActive}
              accent="#06b6d4"
              onChange={onShowTeamGridArea}
              lockNote="Butuh map BABFT."
            />
            <Row
              icon={<Rocket size={13} />}
              label="Free Build"
              desc="Bangun di mana saja, tanpa batas area tim."
              checked={isFreeBuild}
              disabled={!babftActive}
              accent="#f59e0b"
              onChange={onFreeBuild}
              lockNote="Butuh map BABFT."
            />
          </div>
        )}

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(148,163,184,0.2), transparent)', margin: '6px 0 3px' }} />

        {/* ══════ PLAYER ══════ */}
        <SectionHeader
          label="Player"
          icon={<UserRound size={12} />}
          isOpen={openPlayer}
          onClick={() => setOpenPlayer((v) => !v)}
          accent={ACCENT.player}
          right={playerLocked ? (
            <span style={{ fontSize: 8, color: '#f59e0b', letterSpacing: 0.3 }}>terkunci</span>
          ) : null}
        />

        {openPlayer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {playerLocked && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRequestAvatarMode(); }}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  textAlign: 'left',
                  padding: '8px 9px', borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px dashed rgba(245,158,11,0.45)',
                  fontSize: 9.5, color: '#e2e8f0', lineHeight: 1.5,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <b style={{ color: '#fbbf24' }}>Player terkunci</b> — Anda di <b>Camera Mode</b>.
                <br />
                <span style={{ color: '#c084fc', textDecoration: 'underline', fontWeight: 700 }}>
                  Klik di sini untuk pindah ke Avatar Mode
                </span>
              </button>
            )}

            {/* ── bab 213 + KOREKSI USER: tombol Change Avatar di atas Teleport To Team —
                ikut terkunci di Camera Mode sama seperti teman-temannya (hanya Avatar Mode) ── */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (playerLocked) return;
                if (onChangeAvatar) onChangeAvatar();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={playerLocked}
              aria-disabled={playerLocked}
              title={playerLocked ? 'Player terkunci — pindah ke Avatar Mode dulu' : 'Ganti skin avatar / pakai skin dari username Roblox'}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 9px', borderRadius: 9, textAlign: 'left',
                cursor: playerLocked ? 'not-allowed' : 'pointer',
                pointerEvents: playerLocked ? 'none' : 'auto',
                opacity: playerLocked ? 0.6 : 1,
                background: playerLocked
                  ? 'rgba(15,23,42,0.42)'
                  : 'linear-gradient(90deg, rgba(245,158,11,0.16) 0%, rgba(15,23,42,0.55) 100%)',
                border: `1px solid ${playerLocked ? 'rgba(71,85,105,0.3)' : 'rgba(245,158,11,0.45)'}`,
                color: playerLocked ? '#475569' : '#e2e8f0',
                fontFamily: 'Inter, sans-serif',
                transition: 'background 0.18s ease, border-color 0.18s ease',
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: playerLocked ? '#475569' : '#fbbf24',
                background: playerLocked ? 'rgba(30,41,59,0.6)' : 'rgba(245,158,11,0.12)',
                border: `1px solid ${playerLocked ? 'rgba(71,85,105,0.35)' : 'rgba(245,158,11,0.44)'}`,
              }}>
                {playerLocked ? <Lock size={13} /> : <UserRound size={13} />}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.25, color: playerLocked ? '#64748b' : '#f1f5f9' }}>
                  Change Avatar
                </span>
                <span style={{ fontSize: 9.5, color: playerLocked ? '#475569' : '#8798b0', lineHeight: 1.35, marginTop: 1 }}>
                  {playerLocked
                    ? 'Hanya bisa diakses di Avatar Mode.'
                    : 'Ganti skin avatar atau pakai username Roblox.'}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (teleportLocked) return;
                if (onTeleportToTeam) onTeleportToTeam();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={teleportLocked}
              aria-disabled={teleportLocked}
              title={teleportLocked ? teleportLockNote : 'Kembali ke area tim Anda sendiri'}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 9px', borderRadius: 9, textAlign: 'left',
                cursor: teleportLocked ? 'not-allowed' : 'pointer',
                pointerEvents: teleportLocked ? 'none' : 'auto',
                opacity: teleportLocked ? 0.6 : 1,
                background: teleportLocked
                  ? 'rgba(15,23,42,0.42)'
                  : 'linear-gradient(90deg, rgba(34,211,238,0.16) 0%, rgba(15,23,42,0.55) 100%)',
                border: `1px solid ${teleportLocked ? 'rgba(71,85,105,0.3)' : 'rgba(34,211,238,0.45)'}`,
                color: teleportLocked ? '#475569' : '#e2e8f0',
                fontFamily: 'Inter, sans-serif',
                transition: 'background 0.18s ease, border-color 0.18s ease',
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: teleportLocked ? '#475569' : '#67e8f9',
                background: teleportLocked ? 'rgba(30,41,59,0.6)' : 'rgba(34,211,238,0.12)',
                border: `1px solid ${teleportLocked ? 'rgba(71,85,105,0.35)' : 'rgba(34,211,238,0.44)'}`,
              }}>
                {teleportLocked ? <Lock size={13} /> : <MapPin size={13} />}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.25, color: teleportLocked ? '#64748b' : '#f1f5f9' }}>
                  Teleport To Team
                </span>
                <span style={{ fontSize: 9.5, color: teleportLocked ? '#475569' : '#8798b0', lineHeight: 1.35, marginTop: 1 }}>
                  {teleportLocked
                    ? teleportLockNote
                    : `Kembali ke pangkalan ${teamName || 'tim Anda'}.`}
                </span>
              </span>
            </button>

            <Row
              icon={<Plane size={13} />}
              label="Fly"
              desc="Terbang bebas gaya superman (W/A/S/D · E naik · Q turun)."
              checked={flyEnabled}
              disabled={playerLocked}
              accent="#38bdf8"
              onChange={onFly}
              lockNote="Butuh Avatar Mode."
            />
            <Slider
              icon={<Wind size={13} />}
              label="Fly Speed"
              hint="Kecepatan terbang"
              value={flySpeed}
              min={2}
              max={200}
              step={1}
              unit=""
              disabled={playerLocked || !flyEnabled}
              accent="#22d3ee"
              onChange={onFlySpeed}
            />
            <Slider
              icon={<Footprints size={13} />}
              label="Walkspeed"
              hint="Kecepatan jalan"
              value={walkSpeed}
              min={2}
              max={200}
              step={1}
              unit=""
              disabled={playerLocked}
              accent="#4ade80"
              onChange={onWalkSpeed}
            />
            <Slider
              icon={<ChevronsUp size={13} />}
              label="Jump Power"
              hint="Tinggi lompatan"
              value={jumpPower}
              min={2}
              max={100}
              step={1}
              unit=""
              disabled={playerLocked}
              accent="#fbbf24"
              onChange={onJumpPower}
            />
            <Row
              icon={<InfinityIcon size={13} />}
              label="Infinite Jump"
              desc="Lompat terus tanpa menyentuh tanah."
              checked={infiniteJump}
              disabled={playerLocked}
              accent="#f472b6"
              onChange={onInfiniteJump}
              lockNote="Butuh Avatar Mode."
            />

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onResetPlayer(); }}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={playerLocked}
              style={{
                marginTop: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '7px 9px', borderRadius: 8,
                cursor: playerLocked ? 'not-allowed' : 'pointer',
                background: playerLocked ? 'rgba(15,23,42,0.5)' : 'rgba(30,41,59,0.75)',
                border: `1px solid ${playerLocked ? 'rgba(71,85,105,0.3)' : 'rgba(148,163,184,0.28)'}`,
                color: playerLocked ? '#475569' : '#cbd5e1',
                fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif',
              }}
            >
              <RotateCcw size={12} />
              Reset ke Default
            </button>

            {flyEnabled && isAvatarMode && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 8px', borderRadius: 7,
                background: 'rgba(56,189,248,0.09)',
                border: '1px solid rgba(56,189,248,0.3)',
                fontSize: 8.5, color: '#7dd3fc', lineHeight: 1.4,
              }}>
                <Sparkles size={10} />
                <span><b>W/A/S/D</b> terbang · <b>E</b> naik · <b>Q</b> turun</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}

const winBtnStyle = (color, border) => ({
  width: 21, height: 21, borderRadius: 5, cursor: 'pointer', padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(15,23,42,0.65)', border: `1px solid ${border}`, color,
});

const chipStyle = (color) => ({
  fontSize: 8, fontWeight: 800, letterSpacing: 0.7,
  fontFamily: 'Orbitron, sans-serif',
  color,
  background: `${color}1f`,
  border: `1px solid ${color}55`,
  borderRadius: 4, padding: '2px 6px',
});
