import { useEffect, useState } from 'react';
import { getBlockDef, getBlockIconPath } from '../utils/blockMaterials.js';
import { scaleToStudsLabel, STUDS_PER_BLOCK } from '../utils/blockStuds.js';

/* ================================================================
   GizmoBlockInfoPanel — Phase 72 v2 (2026-09-15, revisi user:
   "scale info & gizmo options = satu wilayah yang sama, jangan 2 kotak")
   ================================================================
   PERUBAHAN v2: komponen ini kini SEKSI EMBEDDED di DALAM panel
   Gizmo Options (render berupa ISI — tanpa wrapper panel/border/
   header sendiri) → satu area bersama: satu background, satu border.
   Integrasi ada di BlockSimulator3D: {tool === 'scale' && <.../>}
   ditaruh SETELAH header "Gizmo Options", sebelum baris checkbox,
   dipisah DIVIDER halus.

   ISI (permintaan user Phase 72):
   1) KOTAK VIEW: gambar 3D-view block yang SEDANG di-scale — 100%
      sesuai jenis (kayu → tampak3D kayu, neon → tampak3D neon, dst;
      ikon dataset public/blocks/icon — aset sama dgn panel Place).
   2) DI BAWAHNYA: baris dimensi P, L, T STUDS — standar MUTLAK:
      block biasa belum di-scale = 2, 2, 2 studs (blockStuds.js).

   Implementasi tetap TANPA MENYENTUH ENGINE: poll 10Hz baca
   tc.object via threeRef sendiri, setState hanya saat label berubah.
   Anggota keluarga-5 lain (move/rotate/clone/mirror) menyusul —
   render komponen ini di seksi panel yang sama per tool.
   ================================================================ */

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

export default function GizmoBlockInfoPanel({ threeRef, toolName = 'Scale' }) {
  const [info, setInfo] = useState(null); // {slug,label,scaleLabel,isMulti}

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

  // Kosong: tidak ada block yang digenggam gizmo — seksi tetap tampil
  // (slot stabil, tidak lompat) dgn state placeholder.
  const empty = !info;
  const isMulti = !empty && info.isMulti;
  const slug = empty ? null : info.slug;
  const def = slug ? getBlockDef(slug) : null;
  const scaleLabel = empty ? `${STUDS_PER_BLOCK}, ${STUDS_PER_BLOCK}, ${STUDS_PER_BLOCK}` : info.scaleLabel;

  // ── SEKSI EMBEDDED: tanpa wrapper panel/border sendiri — mengalir
  //    di dalam panel induk (satu wilayah, satu background). ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── Kotak view 3D block (100% sesuai jenis) ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 6, borderRadius: 10,
        backgroundColor: 'rgba(30, 41, 59, 0.45)',
        border: `1px solid ${empty ? 'rgba(148,163,184,0.14)' : 'rgba(245,158,11,0.35)'}`,
        minHeight: 96,
      }}>
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
          /* Slot kosong stabil — placeholder bukan dekorasi */
          <div style={{
            width: 84, height: 84, borderRadius: 10,
            border: '2px dashed rgba(148,163,184,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(148,163,184,0.45)', fontSize: 9.5,
            fontFamily: 'Inter, sans-serif', textAlign: 'center', lineHeight: 1.35,
          }}>
            Pilih block<br />untuk {toolName.toLowerCase()}
          </div>
        )}
      </div>

      {/* Nama jenis — kecil di bawah view */}
      <div style={{
        marginTop: 6, textAlign: 'center',
        fontSize: 10, fontWeight: 600,
        color: empty ? 'rgba(148,163,184,0.55)' : '#f59e0b',
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

      {/* Petunjuk urutan — caption kecil */}
      <div style={{
        marginTop: 4, textAlign: 'center',
        fontSize: 8.5, color: 'rgba(148,163,184,0.5)',
        fontFamily: 'Inter, sans-serif',
      }}>Panjang, Lebar, Tinggi (studs)</div>
    </div>
  );
}
