/**
 * babftMapDevMode.js — DEV MODE KHUSUS MAP (bab 182, 2026-10-12)
 *
 * ⚠️ INI BUKAN "dev mode NSI". Ini mode terpisah, hanya untuk MENGEDIT MAP
 *    (terrain) sesuka user. Sistem NSI & block builder TIDAK disentuh.
 *
 * Perintah user (verbatim):
 *   "saya minta 1 mode dev mode tapi bukannya dev mode yang khusus NSI tapi
 *    khusus untuk mengedit map ini sesuka hati saya, terrainnya mau saya delete,
 *    geser, duplikat, itu terserah saya dan keputusan ada di tangan saya, dan
 *    juga saya butuh grid kotak kotak itu, saya butuh 7 siapkan nanti secara
 *    melayang diatas langit masing masing team, saya yang geser, bahkan saya
 *    bisa scale berapa grid kotak kotak tersebut yang artinya saya bisa atur
 *    berapa luas area build tersebut"
 *
 * FITUR:
 *   1. Klik mesh map → pilih → gizmo Translate/Rotate/Scale (bebas).
 *   2. Delete (Del/Backspace) — hapus objek map.
 *   3. Duplicate (Ctrl+D) — gandakan objek map.
 *   4. 7 GRID KOTAK MELAYANG di atas tiap team (langit) — bisa digeser & di-scale.
 *      Ukuran grid = LUAS AREA BUILD tim tersebut (batas build mengikuti grid).
 *   5. Export hasil edit → JSON (untuk di-bake permanen).
 *
 * ⚠️ ATURAN AMAN (kontrak):
 *   - Hanya menyentuh objek di dalam `mapGroup` (map Babft).
 *   - TIDAK menyentuh blok user, NSI, viewer, workbench.
 *   - TransformControls TERPISAH dari yang dipakai sistem blok.
 */

import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
// ── GAYA GIZMO SIMULATOR (bab 185): pakai modul yang SAMA dengan
//    3D Block Simulator supaya tampilan & kenyamanan identik.
import {
  makeSixArrows, hideTranslateHelperLines, hideHelperLinesInvisible,
  enableSoloDragArrow,
} from './gizmoSixArrows.js';

/** Warna grid 7 tim (samakan dengan BABFT_TEAMS). */
const GRID_COLORS = {
  white: 0xf2f2f2, red: 0xd22b2b, blue: 0x2b6fd2, magenta: 0xd22bd2,
  black: 0x232323, green: 0x2bb54a, yellow: 0xf2c72b,
};

export function createBabftMapDevMode(opts) {
  const {
    THREE, scene, camera, renderer,
    getMapGroup, teams, plotCenters, mapScale,
  } = opts;

  let enabled = false;
  let selected = null;
  let mode = 'translate';            // translate | rotate | scale
  let activeTool = 'move';           // move | rotate | scale | delete | clone | paint | info
  let paintColor = 0x73a95f;         // default grass green

  const TOOL_COLORS = {
    move: 0x22c55e,
    rotate: 0x3b82f6,
    scale: 0x8b5cf6,
    delete: 0xef4444,
    clone: 0x06b6d4,
    paint: 0xd946ef,
    info: 0x38bdf8,
  };

  const hoverBox = new THREE.BoxHelper();
  hoverBox.visible = false;
  hoverBox.material.depthTest = false;
  hoverBox.material.transparent = true;
  hoverBox.material.opacity = 0.9;
  scene.add(hoverBox);

  // ── TransformControls TERPISAH (jangan pakai milik sistem blok) ──
  const tc = new TransformControls(camera, renderer.domElement);
  tc.size = 2.6;   // diperbesar supaya mudah digenggam (skala dunia besar)
  const tcHelper = tc.getHelper();
  tcHelper.visible = false;
  scene.add(tcHelper);

  // ══ GAYA GIZMO SAMA DENGAN 3D BLOCK SIMULATOR (bab 185) ══
  //  1) 6 panah utuh (sisi + dan −)
  //  2) buang garis bantu putih tak-hingga
  //  3) sembunyikan garis bantu rotate (tetap akurat, tak terlihat)
  //  4) SOLO DRAG: saat drag, hanya panah yang dipakai yang tampil
  let soloDispose = null;
  try {
    const sa = makeSixArrows(tc, tcHelper);
    if (!sa.ok) console.warn('[gizmo] makeSixArrows:', sa.reason);
    const hl = hideTranslateHelperLines(tc);
    if (!hl.ok) console.warn('[gizmo] hideTranslateHelperLines:', hl.reason);
    try { hideHelperLinesInvisible(tc); } catch (_) {}
    const sd = enableSoloDragArrow(tc, tcHelper);
    if (sd.ok) soloDispose = sd.dispose;
    else console.warn('[gizmo] soloDrag:', sd.reason);
  } catch (e) { console.warn('[gizmo] gaya simulator gagal:', e); }

  // ── 7 GRID KOTAK MELAYANG (di atas langit tiap tim) ──
  const grids = new Map();
  const gridGroup = new THREE.Group();
  gridGroup.name = 'BabftDevGrids';
  gridGroup.visible = false;
  scene.add(gridGroup);

  (plotCenters || []).forEach((p) => {
    // Area build 7 tim dengan tinggi ke atas & bawah tak terhingga (infinite vertical build bounds)
    const w = p.w !== undefined ? p.w : 140;
    const l = p.l !== undefined ? p.l : 140;
    const h = p.h !== undefined ? p.h : 8000;  // Rentang vertikal masif (tak terhingga)
    const cy = p.cy !== undefined ? p.cy : 205; // Titik tumpu lantai rumput tim

    const points = [];
    const hw = w / 2, hl = l / 2, hh = h / 2;

    // 4 Tiang sudut vertikal (menjulang tak terhingga dari jurang -hh ke langit +hh)
    points.push(new THREE.Vector3(-hw, -hh, -hl), new THREE.Vector3(-hw, hh, -hl));
    points.push(new THREE.Vector3(hw, -hh, -hl), new THREE.Vector3(hw, hh, -hl));
    points.push(new THREE.Vector3(hw, -hh, hl), new THREE.Vector3(hw, hh, hl));
    points.push(new THREE.Vector3(-hw, -hh, hl), new THREE.Vector3(-hw, hh, hl));

    // Cincin penanda di puncak langit (+hh)
    points.push(new THREE.Vector3(-hw, hh, -hl), new THREE.Vector3(hw, hh, -hl));
    points.push(new THREE.Vector3(hw, hh, -hl), new THREE.Vector3(hw, hh, hl));
    points.push(new THREE.Vector3(hw, hh, hl), new THREE.Vector3(-hw, hh, hl));
    points.push(new THREE.Vector3(-hw, hh, hl), new THREE.Vector3(-hw, hh, -hl));

    // Cincin penanda di dasar jurang (-hh)
    points.push(new THREE.Vector3(-hw, -hh, -hl), new THREE.Vector3(hw, -hh, -hl));
    points.push(new THREE.Vector3(hw, -hh, -hl), new THREE.Vector3(hw, -hh, hl));
    points.push(new THREE.Vector3(hw, -hh, hl), new THREE.Vector3(-hw, -hh, hl));
    points.push(new THREE.Vector3(-hw, -hh, hl), new THREE.Vector3(-hw, -hh, -hl));

    // Cincin batas keliling di lantai rumput (y = 1 lokal)
    points.push(new THREE.Vector3(-hw, 1, -hl), new THREE.Vector3(hw, 1, -hl));
    points.push(new THREE.Vector3(hw, 1, -hl), new THREE.Vector3(hw, 1, hl));
    points.push(new THREE.Vector3(hw, 1, hl), new THREE.Vector3(-hw, 1, hl));
    points.push(new THREE.Vector3(-hw, 1, hl), new THREE.Vector3(-hw, 1, -hl));

    // Garis tengah lantai pembagi simetri
    points.push(new THREE.Vector3(0, 1, -hl), new THREE.Vector3(0, 1, hl));
    points.push(new THREE.Vector3(-hw, 1, 0), new THREE.Vector3(hw, 1, 0));

    // Cincin penanda ketinggian build normal (y = 50 lokal)
    points.push(new THREE.Vector3(-hw, 50, -hl), new THREE.Vector3(hw, 50, -hl));
    points.push(new THREE.Vector3(hw, 50, -hl), new THREE.Vector3(hw, 50, hl));
    points.push(new THREE.Vector3(hw, 50, hl), new THREE.Vector3(-hw, 50, hl));
    points.push(new THREE.Vector3(-hw, 50, hl), new THREE.Vector3(-hw, 50, -hl));

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const color = GRID_COLORS[p.team] !== undefined ? GRID_COLORS[p.team] : 0xffffff;
    const line = new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({ color, linewidth: 2, depthTest: false, transparent: true, opacity: 0.95 }),
    );
    line.position.set(p.cx, cy, p.cz);
    line.userData.isBabftDevGrid = true;
    line.userData.team = p.team;
    line.userData.baseW = w;
    line.userData.baseL = l;
    line.userData.baseH = h;
    line.renderOrder = 999;
    gridGroup.add(line);
    grids.set(p.team, line);

    // Label nama tim melayang nyaman tepat di atas lantai rumput (y = cy + 60)
    try {
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 64;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, 256, 64);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.team.toUpperCase(), 128, 32);
      const tex = new THREE.CanvasTexture(cv);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
      sp.scale.set(30, 7.5, 1);
      sp.position.set(p.cx, cy + 60, p.cz);
      sp.userData.isBabftDevGrid = true;
      sp.userData.team = p.team;
      sp.userData.isLabel = true;
      sp.renderOrder = 1000;
      gridGroup.add(sp);
    } catch (_) { /* label opsional */ }
  });

  // ── RAYCAST: pilih mesh MAP (abaikan grid/air/penanda) ──
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function pickMesh(clientX, clientY) {
    const map = getMapGroup && getMapGroup();
    if (!map) return null;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.x = ((clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);

    // grid dev punya prioritas (bisa digeser/di-scale)
    const gridHits = ray.intersectObjects(gridGroup.children, false);
    if (gridHits.length) {
      let o = gridHits[0].object;
      // naik ke LineSegments kalau kena sprite label
      return o;
    }
    const hits = ray.intersectObject(map, true);
    for (const h of hits) {
      let o = h.object;
      if (!o.isMesh) continue;
      if (o.userData && (o.userData.isBabftWater || o.userData.isBabftPlot ||
          o.userData.isBabftFlag || o.userData.isBabftDevGrid)) continue;
      return o;
    }
    return null;
  }

  function select(obj) {
    if (selected === obj) return;
    deselect();
    if (!obj) return;
    selected = obj;
    selected.matrixAutoUpdate = true;
    tc.attach(obj);
    tc.setMode(mode);
    tcHelper.visible = true;
    if (opts.onSelect) opts.onSelect(obj);
  }
  function deselect() {
    if (selected) {
      try { tc.detach(); } catch (_) {}
      selected.updateMatrix();
      selected.matrixAutoUpdate = false;
    }
    selected = null;
    tcHelper.visible = false;
    if (opts.onSelect) opts.onSelect(null);
  }

  let _downAt = null;
  function onPointerDown(e) {
    if (!enabled) return;
    if (e.button === 2) return;
    if (e.button !== 0) return;
    if (tc.dragging) return;
    _downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
  }

  function onPointerUp(e) {
    if (!enabled || !_downAt) return;
    if (e.button !== 0) { _downAt = null; return; }
    if (tc.dragging) { _downAt = null; return; }
    const dx = e.clientX - _downAt.x, dy = e.clientY - _downAt.y;
    const moved = Math.hypot(dx, dy);
    const dt = performance.now() - _downAt.t;
    _downAt = null;
    if (moved > 6 || dt > 500) return;

    const r = renderer.domElement.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
    const obj = pickMesh(e.clientX, e.clientY);
    if (!obj) {
      if (activeTool !== 'info') deselect();
      return;
    }

    if (activeTool === 'delete') {
      select(obj);
      deleteSelected();
    } else if (activeTool === 'clone') {
      select(obj);
      duplicateSelected();
    } else if (activeTool === 'paint') {
      select(obj);
      paintSelected();
    } else {
      select(obj);
      if (activeTool === 'move') setMode('translate');
      else if (activeTool === 'rotate') setMode('rotate');
      else if (activeTool === 'scale') setMode('scale');
    }
  }

  let _lastHoverTime = 0;
  function onPointerMove(e) {
    if (!enabled || tc.dragging) {
      hoverBox.visible = false;
      return;
    }
    const now = performance.now();
    if (now - _lastHoverTime < 35) return;
    _lastHoverTime = now;

    const r = renderer.domElement.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
      hoverBox.visible = false;
      return;
    }
    const obj = pickMesh(e.clientX, e.clientY);
    if (obj && obj !== selected) {
      hoverBox.setFromObject(obj);
      const col = TOOL_COLORS[activeTool] || 0x22c55e;
      hoverBox.material.color.set(col);
      hoverBox.visible = true;
    } else {
      hoverBox.visible = false;
    }
  }



  function onKeyDown(e) {
    if (!enabled || !selected) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteSelected();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      duplicateSelected();
    } else if (e.key === 'Escape') {
      deselect();
    } else if (e.key === 'g' || e.key === 'G') {
      setMode('translate');
    } else if (e.key === 'r' || e.key === 'R') {
      setMode('rotate');
    } else if (e.key === 's' || e.key === 'S') {
      setMode('scale');
    }
  }

  function deleteSelected() {
    if (!selected) return false;
    const o = selected;
    deselect();
    if (o.parent) o.parent.remove(o);
    edits.deleted.push({ uuid: o.uuid, name: o.name || '' });
    if (opts.onChange) opts.onChange();
    return true;
  }

  function duplicateSelected() {
    if (!selected) return null;
    const src = selected;
    const copy = src.clone(true);
    copy.uuid = THREE.MathUtils.generateUUID();
    copy.position.x += 8;                 // geser sedikit supaya terlihat
    copy.userData = Object.assign({}, src.userData);
    if (copy.userData) copy.userData.isBabftDevCopy = true;
    (src.parent || scene).add(copy);
    edits.duplicated.push({ from: src.uuid, name: copy.name || '' });
    select(copy);
    if (opts.onChange) opts.onChange();
    return copy;
  }

  function paintSelected(colorHex) {
    if (!selected) return false;
    const col = colorHex !== undefined ? colorHex : paintColor;
    const mats = Array.isArray(selected.material) ? selected.material : [selected.material];
    mats.forEach((m) => {
      if (!selected.userData._hasClonedMat) {
        selected.material = selected.material.clone();
        selected.userData._hasClonedMat = true;
      }
      if (selected.material.color) {
        selected.material.color.set(col);
      }
    });
    if (opts.onChange) opts.onChange();
    return true;
  }

  function setActiveTool(t) {
    activeTool = t;
    if (t === 'move') { setMode('translate'); }
    else if (t === 'rotate') { setMode('rotate'); }
    else if (t === 'scale') { setMode('scale'); }
    else if (t === 'delete' || t === 'clone' || t === 'paint' || t === 'info') {
      tcHelper.visible = false;
    }
  }

  function setPaintColor(hex) {
    paintColor = typeof hex === 'string' ? parseInt(hex.replace('#', ''), 16) : hex;
  }

  function setTranslationSnap(val) {
    if (tc) tc.setTranslationSnap(val);
  }
  function setRotationSnap(deg) {
    if (tc) tc.setRotationSnap(deg ? deg * Math.PI / 180 : null);
  }
  function setScaleSnap(val) {
    if (tc) tc.setScaleSnap(val);
  }

  function setMode(m) {
    mode = m;
    if (selected) tc.setMode(m);
    if (opts.onMode) opts.onMode(m);
  }

  /** Kembalikan grid 7 tim ke posisi & ukuran awal. */
  function resetGrids() {
    (plotCenters || []).forEach((p) => {
      const line = grids.get(p.team);
      if (!line) return;
      const cy = p.cy !== undefined ? p.cy : 225;
      line.position.set(p.cx, cy, p.cz);
      line.scale.set(1, 1, 1);
      line.updateMatrixWorld(true);
    });
    if (opts.onChange) opts.onChange();
  }

  /**
   * Batas build per tim DARI GRID yang digeser/diskalakan user.
   * → "saya bisa atur berapa luas area build tersebut"
   */
  function getGridBounds() {
    const out = {};
    grids.forEach((line, team) => {
      const w = line.userData.baseW * line.scale.x;
      const l = line.userData.baseL * line.scale.z;
      out[team] = { x: line.position.x, z: line.position.z, halfX: w / 2, halfZ: l / 2, team };
    });
    return out;
  }

  /** Ringkasan hasil edit (untuk di-bake / disimpan). */
  const edits = { deleted: [], duplicated: [], moved: [], grids: {} };
  function exportEdits() {
    const moved = [];
    const map = getMapGroup && getMapGroup();
    if (map) {
      map.traverse((o) => {
        if (!o.isMesh || !o.userData) return;
        if (o.userData.isBabftWater || o.userData.isBabftPlot ||
            o.userData.isBabftFlag || o.userData.isBabftDevGrid) return;
        moved.push({
          name: o.name || '', uuid: o.uuid,
          position: o.position.toArray(), rotation: o.rotation.toArray(),
          scale: o.scale.toArray(),
        });
      });
    }
    edits.moved = moved;
    edits.grids = getGridBounds();
    return JSON.parse(JSON.stringify(edits));
  }

  function setEnabled(b) {
    enabled = !!b;
    gridGroup.visible = enabled;
    tcHelper.visible = enabled && !!selected;
    if (!enabled) deselect();
    if (opts.onToggle) opts.onToggle(enabled);
  }

  // ── AUTO-SAVE hook: setiap perubahan (drag gizmo / hapus / duplikat) → notify ──
  tc.addEventListener('objectChange', () => {
    if (opts.onChange) opts.onChange();
  });
  tc.addEventListener('dragging-changed', (e) => {
    if (!e.value && opts.onChange) opts.onChange();   // selesai drag
  });

  renderer.domElement.addEventListener('pointerdown', onPointerDown, true);
  renderer.domElement.addEventListener('pointerup', onPointerUp, true);
  renderer.domElement.addEventListener('pointermove', onPointerMove, true);
  window.addEventListener('keydown', onKeyDown);

  return {
    get enabled() { return enabled; },
    setEnabled,
    toggle() { setEnabled(!enabled); return enabled; },
    select, deselect,
    get selected() { return selected; },
    deleteSelected, duplicateSelected, setMode,
    get mode() { return mode; },
    get activeTool() { return activeTool; },
    setActiveTool, setPaintColor, paintSelected,
    setTranslationSnap, setRotationSnap, setScaleSnap, hoverHelper: hoverBox,
    grids, gridGroup, gizmo: tc,
    resetGrids, getGridBounds, exportEdits,
    dispose() {
      renderer.domElement.removeEventListener('pointerdown', onPointerDown, true);
      renderer.domElement.removeEventListener('pointerup', onPointerUp, true);
      renderer.domElement.removeEventListener('pointermove', onPointerMove, true);
      window.removeEventListener('keydown', onKeyDown);
      try { if (soloDispose) soloDispose(); } catch (_) {}
      try { tc.detach(); tc.dispose(); } catch (_) {}
      scene.remove(tcHelper); scene.remove(gridGroup); scene.remove(hoverBox);
    },
  };
}

export default createBabftMapDevMode;
