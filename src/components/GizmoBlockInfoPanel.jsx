import { useEffect, useState } from 'react';
import { getBlockDef, getBlockIconPath } from '../utils/blockMaterials.js';
import { scaleToStudsLabel, STUDS_PER_BLOCK } from '../utils/blockStuds.js';
import {
  SCALE_MODE_LABEL, DEFAULT_SCALE_MODE, normalizeScaleMode,
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

   ─ PHASE 73 (2026-09-15) → v2 (2026-09-17, permintaan user) — TOMBOL "+" ──
   v1: tombol "+" membuka POPUP KECIL di sudut kotak view.
   USER 2026-09-17: "seharusnya tombol '+' jika diklik maka munculnya
   adalah peringatan oranye yang megah designnya itu!! bukan malah kayak
   sepele kecil gini! tolong yang design pilih 4 mode yang sepele kecil
   dan jelek ini hapus aja, langsung arahin ke yang peringatan oranye
   dengan design bagus dan megah itu!"
   → v2: POPUP KECIL DIHAPUS TOTAL dari komponen ini (state, keyframes,
     dan JSX-nya). Tombol "+" sekarang HANYA memanggil onOpenScaleMode(),
     dan MODAL "Scale Mode" (ScaleModeModal variant='picker') yang muncul —
     desain megah yang SAMA dengan peringatan saat equip scale.

   Ditambahkan/tetap (visual lama v4 & v2 TIDAK diubah):
   - Tombol "+" 26px di pojok kiri-atas KOTAK VIEW (absolute, top:6 left:6)
     — accent amber #f59e0b, sinkron design system app.

   ─ PHASE 73 v3 (2026-09-19, sesi server z.ai, permintaan user) ──
   User: "tombol '+' yang memunculkan menu pilih 4 mode itu iconnya
   jadi gear oranye. Bikin tombol baru lagi yang iconnya sama persis
   '+'. Urutannya: tombol '+' dulu, klik = tulisan coming soon; di
   bawahnya tombol gear oranye, klik = buka modal pilih 4 mode scale."
   → Tombol "+" lama: behavior BERUBAH jadi "coming soon" (panggil
     prop baru onComingSoon → caller handle lewat sonner toast).
   → Tombol baru di BAWAH "+" (top:38 left:6, 26px, gear icon Settings
     lucide, accent amber, style identik dgn tombol "+") → onClick
     onOpenScaleMode (buka modal Scale Mode varian picker).
   Komentar Phase 73 v2 di header ScaleModeModal.jsx yang menyebut
   "tombol + di panel" sekarang outdated tapi TIDAK di-update untuk
   minimal change (lihat kontrak butir 83).
   ================================================================ */

const ACCENT = '#f59e0b';

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
  scaleMode = DEFAULT_SCALE_MODE, onOpenScaleMode = null, onComingSoon = null,
  // ── FIX AH (bab 74): dipakai BERSAMA Scale + Move + Clone + Mirror ──
  //   showStuds: tampilkan baris "Studs 2, 2, 2" (hanya Scale).
  //   showMode : tampilkan "Mode: X Side" (hanya Scale).
  //   accent   : warna aksen (Scale amber; Move biru tua; Clone biru langit;
  //              Mirror ungu).
  showStuds = true,
  showMode = true,
  accent = ACCENT,   // FIX AL: bug latens `accent = accent` (self-ref) diperbaiki
  // ── FIX AL (bab 77): baris "Degree 15°" untuk tool ROTATE ──
  // Menampilkan STEP degree yang dipakai user (BUKAN sudut block).
  // Fresh/baru diletakkan = 15 (default). null = tool non-rotate (tidak tampil).
  degreeStep = null,
}) {
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
  const activeMode = normalizeScaleMode(scaleMode);

    // ── SEKSI EMBEDDED: tanpa wrapper panel/border sendiri — mengalir
      //    di dalam panel induk (satu wilayah, satu background). ──
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* FIX AA (bab 68): wrapper flex-row DIHAPUS — tombol sudah keluar
              dari komponen ini. Komponen ini hanya kotak view (flow normal). */}
          <div>
            {/* FIX AA (bab 68): tombol "+" & gear DIPINDAH KELUAR dari kotak
                ini → sekarang dirender oleh BlockSimulator3D.jsx di sebelah
                KIRI kotak panel (persis permintaan user: keluar dari kotak
                "Scale Options"). Komponen ini kini HANYA kotak view. */}

            {/* ── Kotak view 3D block (100% sesuai jenis) ── */}
            <div style={{
              position: 'relative', flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 6, borderRadius: 10,
              backgroundColor: 'rgba(30, 41, 59, 0.45)',
              border: `1px solid ${empty ? 'rgba(148,163,184,0.14)' : 'rgba(245,158,11,0.35)'}`,
              minHeight: 96,
            }}>

        {isMulti ? (
          /* Multi-select: 4 ikon berjejer (ketumpuk) — menandakan banyak block.
             URUTAN (permintaan user 2026-09-20, revisi): paling DEPAN = wood,
             lalu brick, lalu plastic, lalu titanium (paling BELAKANG).
             Urutan array = urutan render; elemen TERAKHIR = paling DEPAN
             secara visual, jadi kita render dari BELAKANG ke DEPAN. */
          <div style={{ position: 'relative', width: 96, height: 96 }}>
            {/* titanium — paling BELAKANG */}
            <img src={getBlockIconPath('titanium_block')} alt="multi"
              style={{ position: 'absolute', left: 0, top: 0, width: 60, height: 60, objectFit: 'contain', opacity: 0.4, filter: 'saturate(0.4)' }} />
            {/* plastic */}
            <img src={getBlockIconPath('plastic_block')} alt="multi"
              style={{ position: 'absolute', left: 12, top: 8, width: 60, height: 60, objectFit: 'contain', opacity: 0.62, filter: 'saturate(0.7)' }} />
            {/* brick */}
            <img src={getBlockIconPath('brick_block')} alt="multi"
              style={{ position: 'absolute', left: 24, top: 16, width: 60, height: 60, objectFit: 'contain', opacity: 0.82 }} />
            {/* wood — paling DEPAN (paling jelas) */}
            <img src={getBlockIconPath('wood_block')} alt="multi"
              style={{ position: 'absolute', left: 36, top: 24, width: 60, height: 60, objectFit: 'contain' }} />
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

      {/* ── FIX AL (bab 77): BARIS "Degree 15°" — khusus ROTATE ──
             Menampilkan STEP degree yang dipakai (bukan sudut block).
             Fresh/baru = 15 (default). Format: `Degree  15°`. ── */}
      {degreeStep !== null && degreeStep !== undefined && (
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
          }}>Degree</span>
          <span style={{
            flex: 1, textAlign: 'center',
            fontSize: 12.5, fontWeight: 700, color: accent,
            fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap', overflow: 'hidden',
          }}>{degreeStep}°</span>
        </div>
      )}

      {/* ── Baris dimensi studs (P, L, T) — di bawah gambar view.
             FIX AH: hanya untuk Scale (showStuds). ── */}
      {showStuds && (
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
      )}

      {/* ── Mode scaling aktif (Phase 73) — caption kecil, sinkron dgn
             tombol "+". FIX AH: hanya Scale (showMode). ── */}
      {showMode && (
      <div style={{
        marginTop: 4, textAlign: 'center',
        fontSize: 9.5, color: accent,
        fontFamily: 'Inter, sans-serif', fontWeight: 600,
      }}>
        Mode: {SCALE_MODE_LABEL[activeMode]}
      </div>
      )}

      {/* Petunjuk urutan — caption kecil. FIX AH: hanya Scale. */}
      {showStuds && (
      <div style={{
        marginTop: 2, textAlign: 'center',
        fontSize: 8.5, color: '#FFFFFF',
        fontFamily: 'Inter, sans-serif',
      }}>Panjang, Lebar, Tinggi (studs)</div>
      )}
    </div>
  );
}
