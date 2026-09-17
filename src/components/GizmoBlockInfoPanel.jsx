import { useEffect, useRef, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { getBlockDef, getBlockIconPath } from '../utils/blockMaterials.js';
import { scaleToStudsLabel, STUDS_PER_BLOCK } from '../utils/blockStuds.js';
import {
  SCALE_MODES, SCALE_MODE_LABEL, SCALE_MODE_DESC, DEFAULT_SCALE_MODE, normalizeScaleMode,
} from '../utils/scaleModes.js';

/* ================================================================
   GizmoBlockInfoPanel — Phase 72 v4 + Phase 73 (2026-09-15)
   ================================================================
   PERUBAHAN v4 (KONTRAS / KETERBACAAN — warna saja, nol layout):
   User melaporkan 5 titik teks+garis sulit dibaca. Diukur WCAG
   terhadap background nyata (komposit alpha di atas panel
   rgba(14,20,32,0.92) → view_bg rgb(22,30,45)):

     elemen                        SEBELUM            SESUDAH (#FFFFFF)
     1. "Pilih block untuk scale"  rgb(79,90,108)  2.39:1  →  16.70:1
        (border putus-putus)       rgb(54,63,80)   1.58:1  →  16.70:1
     2. "Belum ada block"          rgb(88,99,116)  3.00:1  →  18.27:1
     3. "Panjang, Lebar, Tinggi"   rgb(82,92,108)  2.70:1  →  18.27:1
   Standar WCAG AA teks normal = 4.5:1 → SEMUA di bawah standar
   sebelum perbaikan (paling parah 1.58:1 = nyaris tak terlihat).
   Permintaan user eksplisit: warna PUTIH #FFFFFF.

   YANG TIDAK DIUBAH (sengaja): layout, padding, ukuran font,
   struktur JSX, logika poll/state, label "STUDS" (#94a3b8 — sudah
   lulus 5.3:1, tidak dikeluhkan), nilai angka studs (#e2e8f0 sudah
   terang), warna amber saat block aktif (identitas app).

   PERUBAHAN v2 (2026-09-15, revisi user: "scale info & gizmo
   options = satu wilayah yang sama, jangan 2 kotak"):
   Komponen ini SEKSI EMBEDDED di DALAM panel Gizmo Options (render
   berupa ISI — tanpa wrapper panel/border/header sendiri) → satu
   area bersama: satu background, satu border.
   Integrasi di BlockSimulator3D: {tool === 'scale' && <.../>}
   setelah header "Gizmo Options", sebelum baris checkbox.

   ── PHASE 73 (2026-09-15, permintaan user) — TOMBOL "+" MODE ──
   User: "tombol kotak dengan icon '+' tepat di pojok kiri atas yang
   jendela menampilkan informasi scale studs itu... jika dipencet akan
   muncul fitur yang bisa memilih 4 mode scale... jika jendela tersebut
   tertutup wajib ada animasinya mengecil dan masuk ke tombol '+', dan
   jika tombol '+' maka ada animasi kotak kecil membesar."

   Ditambahkan (ELEMEN BARU, visual lama v4 TIDAK diubah):
   - Tombol "+" 26px di pojok kiri-atas KOTAK VIEW (absolute, top:6 left:6)
     — accent amber #f59e0b, sinkron design system app.
   - Popup pemilih mode (muncul dari sudut tombol, animasi grow/shrink)
     berisi 4 mode + label aktif. Klik mode → onSelectScaleMode(mode).
   ================================================================ */

const ACCENT = '#f59e0b';
const PICKER_ANIM_MS = 180;

/** Baca { slug, scale, isMulti } dari object gizmo saat ini. */
function readGizmoTarget(threeRef) {
  const tc = threeRef && threeRef.current && threeRef.current.transformControls;
  if (!tc) return null;
  const obj = tc.object;
  if (!obj || !obj.isObject3D) return null;
  // Multi-select: gizmo attach ke selectionGroup (THREE.Group). Group =
  // banyak block → tampil state multi (view ketumpuk, dims group).
  const isMulti = !!(obj.userData && obj.userData.__selectionGroup) ||
    (obj.isGroup === true);
  const slug = (obj.userData && obj.userData.blockSlug) || null;
  return { obj, isMulti, slug, scale: obj.scale };
}

export default function GizmoBlockInfoPanel({
  threeRef, toolName = 'Scale',
  scaleMode = DEFAULT_SCALE_MODE, onSelectScaleMode = null,
}) {
  const [info, setInfo] = useState(null); // {slug,label,scaleLabel,isMulti}
  // Popup pemilih mode (Phase 73) — state lokal, animasi buka/tutup.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerClosing, setPickerClosing] = useState(false);
  const pickerCloseTimer = useRef(null);

  useEffect(() => {
    let last = '';
    const tick = () => {
      const t = readGizmoTarget(threeRef);
      let next = null;
      if (t && t.isMulti) {
        next = { isMulti: true, scaleLabel: scaleToStudsLabel(t.scale), slug: null, label: null };
      } else if (t) {
        const def = t.slug ? getBlockDef(t.slug) : null;
        next = {
          isMulti: false,
          slug: t.slug || 'wood_block',
          label: def ? def.name : 'Block',
          scaleLabel: scaleToStudsLabel(t.scale),
        };
      }
      const key = next ? JSON.stringify(next) : 'null';
      if (key !== last) {
        last = key;
        setInfo(next);
      }
    };
    tick(); // tick awal langsung (tanpa tunggu interval)
    // HUD teks: poll 10Hz CUKUP (rAF 60fps utk teks = boros; label angka
    // tidak butuh 60fps). setState hanya saat berubah → nol re-render spam.
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [threeRef]);

  // Bersihkan timer animasi tutup saat unmount.
  useEffect(() => () => { if (pickerCloseTimer.current) clearTimeout(pickerCloseTimer.current); }, []);

  // Kosong: tidak ada block yang digenggam gizmo — seksi tetap tampil
  // (slot stabil, tidak lompat) dgn state placeholder.
  const empty = !info;
  const isMulti = !empty && info.isMulti;
  const slug = empty ? null : info.slug;
  const def = slug ? getBlockDef(slug) : null;
  const scaleLabel = empty ? `${STUDS_PER_BLOCK}, ${STUDS_PER_BLOCK}, ${STUDS_PER_BLOCK}` : info.scaleLabel;
  const activeMode = normalizeScaleMode(scaleMode);

  // Buka popup: dari kecil → membesar (kotak kecil membesar).
  const openPicker = () => {
    if (pickerCloseTimer.current) { clearTimeout(pickerCloseTimer.current); pickerCloseTimer.current = null; }
    setPickerClosing(false);
    setPickerOpen(true);
  };
  // Tutup popup: mengecil dulu (animasi), baru unmount — "mengecil masuk ke +".
  const closePicker = () => {
    if (!pickerOpen || pickerClosing) return;
    setPickerClosing(true);
    pickerCloseTimer.current = setTimeout(() => {
      setPickerOpen(false);
      setPickerClosing(false);
      pickerCloseTimer.current = null;
    }, PICKER_ANIM_MS);
  };
  const chooseMode = (m) => {
    if (onSelectScaleMode) onSelectScaleMode(normalizeScaleMode(m));
    closePicker();
  };

  // ── SEKSI EMBEDDED: tanpa wrapper panel/border sendiri — mengalir
  //    di dalam panel induk (satu wilayah, satu background). ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* keyframes lokal popup (nama ber-prefix, tidak tabrakan) */}
      <style>{`
        @keyframes scalemode-pop-in {
          from { opacity: 0; transform: scale(0.4); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes scalemode-pop-out {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.4); }
        }
      `}</style>

      {/* ── Kotak view 3D block (100% sesuai jenis) — position:relative
             supaya tombol "+" bisa di pojok kiri atas. ── */}
      <div style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 6, borderRadius: 10,
        backgroundColor: 'rgba(30, 41, 59, 0.45)',
        border: `1px solid ${empty ? 'rgba(148,163,184,0.14)' : 'rgba(245,158,11,0.35)'}`,
        minHeight: 96,
      }}>
        {/* ── Phase 73: TOMBOL "+" — pojok KIRI ATAS kotak view.
               Membuka popup pemilih mode scaling (4 mode). ── */}
        <button
          type="button"
          onClick={() => (pickerOpen ? closePicker() : openPicker())}
          title="Pilih mode scaling (1/2/4/6 side)"
          aria-label="Pilih mode scaling"
          aria-expanded={pickerOpen}
          style={{
            position: 'absolute', top: 6, left: 6,
            width: 26, height: 26, borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: pickerOpen ? ACCENT : 'rgba(245,158,11,0.14)',
            border: `1px solid ${ACCENT}`,
            color: pickerOpen ? '#0e1420' : ACCENT,
            cursor: 'pointer', padding: 0, zIndex: 3,
            boxShadow: pickerOpen ? '0 0 10px rgba(245,158,11,0.5)' : 'none',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!pickerOpen) { e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.28)'; }
          }}
          onMouseLeave={(e) => {
            if (!pickerOpen) { e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.14)'; }
          }}
        >
          <Plus size={16} strokeWidth={2.6} style={{
            transform: pickerOpen ? 'rotate(45deg)' : 'none',
            transition: 'transform 0.2s ease',
          }} />
        </button>

        {/* ── POPUP pemilih mode (Phase 73) — membesar dari pojok tombol + ── */}
        {pickerOpen && (
          <div style={{
            position: 'absolute', top: 36, left: 6, zIndex: 20,
            width: 210,
            backgroundColor: 'rgba(14, 20, 32, 0.99)',
            border: `1px solid ${ACCENT}`,
            borderRadius: 10,
            padding: 8,
            boxShadow: '0 12px 34px rgba(0,0,0,0.5), 0 0 24px rgba(245,158,11,0.2)',
            transformOrigin: 'top left',
            animation: pickerClosing
              ? `scalemode-pop-out ${PICKER_ANIM_MS}ms ease-in forwards`
              : 'scalemode-pop-in 0.22s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: '#94a3b8',
              fontFamily: 'Orbitron, sans-serif', textTransform: 'uppercase',
              letterSpacing: '1px', padding: '2px 4px 6px',
            }}>Scale Mode</div>
            {SCALE_MODES.map((m) => {
              const active = activeMode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => chooseMode(m)}
                  aria-pressed={active}
                  title={SCALE_MODE_DESC[m]}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '7px 8px', marginBottom: 2, borderRadius: 7,
                    cursor: 'pointer', textAlign: 'left',
                    backgroundColor: active ? 'rgba(245,158,11,0.14)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(245,158,11,0.5)' : 'transparent'}`,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(148,163,184,0.1)'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: active ? ACCENT : 'rgba(148,163,184,0.12)',
                    border: `1.5px solid ${active ? ACCENT : 'rgba(148,163,184,0.35)'}`,
                  }}>
                    {active && <Check size={11} color="#0e1420" strokeWidth={3.6} />}
                  </span>
                  <span style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 12.5,
                    fontWeight: active ? 700 : 500,
                    color: active ? '#f5f7fa' : '#cbd5e1',
                  }}>{SCALE_MODE_LABEL[m]}</span>
                </button>
              );
            })}
          </div>
        )}

        {isMulti ? (
          /* Multi-select: 3 ikon ketumpuk — menandakan banyak block */
          <div style={{ position: 'relative', width: 84, height: 84 }}>
            <img src={getBlockIconPath('stone_block')} alt="multi"
              style={{ position: 'absolute', left: 4, top: 4, width: 60, height: 60, objectFit: 'contain', opacity: 0.45, filter: 'saturate(0.4)' }} />
            <img src={getBlockIconPath('wood_block')} alt="multi"
              style={{ position: 'absolute', left: 16, top: 12, width: 60, height: 60, objectFit: 'contain', opacity: 0.7 }} />
            <img src={getBlockIconPath('neon_block')} alt="multi"
              style={{ position: 'absolute', left: 28, top: 20, width: 60, height: 60, objectFit: 'contain' }} />
          </div>
        ) : slug ? (
          <img
            key={slug}
            src={getBlockIconPath(slug)}
            alt={def ? def.name : 'block'}
            draggable={false}
            style={{ width: 96, height: 96, objectFit: 'contain', display: 'block', filter: empty ? 'grayscale(0.9) opacity(0.4)' : 'none' }}
          />
        ) : (
          /* Slot kosong stabil — placeholder bukan dekorasi.
             v4: teks + garis putus-putus PUTIH #FFFFFF (1.58:1 → 16.70:1). */
          <div style={{
            width: 84, height: 84, borderRadius: 10,
            border: '2px dashed #FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF', fontSize: 9.5,
            fontFamily: 'Inter, sans-serif', textAlign: 'center', lineHeight: 1.35,
          }}>
            Pilih block<br />untuk {toolName.toLowerCase()}
          </div>
        )}
      </div>

      {/* Nama jenis — kecil di bawah view.
          v4: state kosong ("Belum ada block") PUTIH (3.00:1 → 18.27:1);
          state ada block tetap amber #f59e0b (identitas app, sesuai). */}
      <div style={{
        marginTop: 6, textAlign: 'center',
        fontSize: 10, fontWeight: 600,
        color: empty ? '#FFFFFF' : '#f59e0b',
        fontFamily: 'Inter, sans-serif',
      }}>
        {isMulti ? 'Multi-Block' : (def ? def.name : 'Belum ada block')}
      </div>

      {/* ── Baris dimensi studs (P, L, T) — di bawah gambar view ── */}
      <div style={{
        marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px', borderRadius: 8,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(148,163,184,0.14)',
      }}>
        <span style={{
          fontSize: 9, fontWeight: 700, color: '#94a3b8',
          fontFamily: 'Orbitron, sans-serif', textTransform: 'uppercase',
          letterSpacing: '0.5px', flexShrink: 0,
        }}>Studs</span>
        <span style={{
          flex: 1, textAlign: 'center',
          fontSize: 12.5, fontWeight: 700, color: '#e2e8f0',
          fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap', overflow: 'hidden',
        }}>{scaleLabel}</span>
      </div>

      {/* ── Mode scaling aktif (Phase 73) — caption kecil, sinkron dgn
             tombol "+". Menegaskan aturan yang sedang berlaku. ── */}
      <div style={{
        marginTop: 4, textAlign: 'center',
        fontSize: 9.5, color: ACCENT,
        fontFamily: 'Inter, sans-serif', fontWeight: 600,
      }}>
        Mode: {SCALE_MODE_LABEL[activeMode]}
      </div>

      {/* Petunjuk urutan — caption kecil.
          v4: PUTIH (2.70:1 → 18.27:1). */}
      <div style={{
        marginTop: 2, textAlign: 'center',
        fontSize: 8.5, color: '#FFFFFF',
        fontFamily: 'Inter, sans-serif',
      }}>Panjang, Lebar, Tinggi (studs)</div>
    </div>
  );
}
