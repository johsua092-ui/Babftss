/**
 * MapDevStudio.jsx — HALAMAN TERPISAH "MAP DEV STUDIO" (bab 183 & bab 189)
 *
 * ⚠️ SISTEM TOOLS MENIRU 100% 3D BLOCK SIMULATOR:
 *   - Build Tools Bar di Kiri (Info, Undo, Redo, Delete, Paint, Scale, Move, Rotate, Clone)
 *   - Floating Snap Settings Bar di Atas (Snap Move studs, Snap Rotate derajat, Paint Palette)
 *   - Hover Highlight Box (glow kawat warna-warni sesuai tool yang aktif sebelum klik)
 *   - Mode 32.707 Part Asli (Ultra Detail) & Mode 139 Part Modular (Ringan)
 *   - Universal Undo/Redo & Reset ke Map Asli in-place
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Wrench, Undo2, Redo2, Trash2, Paintbrush, Maximize, Move, RotateCw, Copy, Search,
} from 'lucide-react';
import {
  loadBabftMapGlb, BABFT_TEAMS, BABFT_PLOT_CENTERS_STUDS, BABFT_MAP_SCALE,
} from '../utils/babftMapGlb.js';
import { loadBabftMapObj, loadBabftMapMerged } from '../utils/babftMapObj.js';
import { createBabftMapDevMode } from '../utils/babftMapDevMode.js';
// ── KOORDINAT NYATA 7 LAHAN TIM DI BABFT (World Space, Scale 0.5) ──
// Menancap tepat di atas lahan hijau Bases1..Bases7
export const BABFT_STUDIO_TEAM_PLOTS = [
  // ── AREA BUILD 7 TIM BABFT: PANJANG 298 STUDS & LEBAR 250 STUDS (1 unit dunia = 2 studs) ──
  // Ukuran dalam satuan unit dunia (scale block): 298 studs = 149 unit, 250 studs = 125 unit.
  // White Team (Tengah / Hulu Sungai): Panjang (Z) = 298 studs (l: 149), Lebar (X) = 250 studs (w: 125)
  { team: 'white',   name: 'White Team',   cx: 0.3,    cy: 205, cz: -2372.3, w: 125, h: 8000, l: 149 },
  // Sisi Kiri (kamera menghadap hilir sungai): Panjang ke arah sungai (X) = 298 studs (w: 149), Lebar (Z) = 250 studs (l: 125)
  { team: 'black',   name: 'Black Team',   cx: -137.8, cy: 205, cz: -2233.8, w: 149, h: 8000, l: 125 },
  { team: 'green',   name: 'Green Team',   cx: -137.6, cy: 205, cz: -2057.7, w: 149, h: 8000, l: 125 },
  { team: 'yellow',  name: 'Yellow Team',  cx: -137.6, cy: 205, cz: -1877.8, w: 149, h: 8000, l: 125 },
  // Sisi Kanan: Panjang ke arah sungai (X) = 298 studs (w: 149), Lebar (Z) = 250 studs (l: 125)
  { team: 'red',     name: 'Red Team',     cx: 137.8,  cy: 205, cz: -2233.8, w: 149, h: 8000, l: 125 },
  { team: 'blue',    name: 'Blue Team',    cx: 137.8,  cy: 205, cz: -2053.8, w: 149, h: 8000, l: 125 },
  { team: 'magenta', name: 'Magenta Team', cx: 137.8,  cy: 205, cz: -1880.2, w: 149, h: 8000, l: 125 },
];


const SAVE_KEY = 'babft_map_dev_save_v1';
const MAX_UNDO_STACK = 50;

const PRESET_COLORS = [
  { name: 'Rumput', hex: '#73a95f' },
  { name: 'Tanah', hex: '#78581c' },
  { name: 'Batu', hex: '#5c717e' },
  { name: 'Air', hex: '#1f6fb2' },
  { name: 'Kayu', hex: '#9d8b7f' },
  { name: 'Pasir', hex: '#ebdda3' },
  { name: 'Emas', hex: '#ffd800' },
  { name: 'Merah', hex: '#ef4444' },
];

function registerMeshes(mapGroup, registry) {
  if (!mapGroup || !registry) return;
  mapGroup.traverse((o) => {
    if (!o.isMesh || !o.userData) return;
    if (o.userData.isBabftPlot || o.userData.isBabftFlag) return;
    if (!registry.has(o.uuid)) {
      registry.set(o.uuid, {
        obj: o,
        parent: o.parent,
        name: o.name || o.type,
        isWater: !!o.userData.isBabftWater,
        isCopy: !!o.userData.isBabftDevCopy,
      });
    } else {
      const reg = registry.get(o.uuid);
      if (o.parent && reg.parent !== o.parent) reg.parent = o.parent;
    }
  });
}

function collectSnapshot(mapGroup, dev, registry) {
  registerMeshes(mapGroup, registry);
  const parts = [];
  if (registry) {
    registry.forEach((reg, uuid) => {
      const o = reg.obj;
      parts.push({
        uuid,
        name: reg.name,
        isCopy: !!reg.isCopy,
        isWater: !!reg.isWater,
        inScene: !!(o && o.parent),
        pos: o ? o.position.toArray() : [0, 0, 0],
        rot: o ? [o.rotation.x, o.rotation.y, o.rotation.z] : [0, 0, 0],
        scale: o ? o.scale.toArray() : [1, 1, 1],
        visible: o ? o.visible : true,
        color: o && o.material && o.material.color ? o.material.color.getHex() : null,
      });
    });
  }

  const grids = {};
  if (dev && dev.grids) {
    dev.grids.forEach((line, k) => {
      grids[k] = {
        pos: line.position.toArray(),
        scale: line.scale.toArray(),
      };
    });
  }

  const selectedUuid = dev && dev.selected ? dev.selected.uuid : null;

  return {
    v: 2,
    at: Date.now(),
    selectedUuid,
    parts,
    grids,
  };
}

function applySnapshot(snapshot, mapGroup, dev, registry) {
  if (!snapshot || !snapshot.parts || !registry) return false;

  snapshot.parts.forEach((p) => {
    const reg = registry.get(p.uuid);
    if (!reg || !reg.obj) return;
    const o = reg.obj;

    if (p.inScene) {
      if (!o.parent && reg.parent) {
        reg.parent.add(o);
      }
    } else {
      if (o.parent) {
        o.parent.remove(o);
      }
    }

    if (p.pos) o.position.fromArray(p.pos);
    if (p.rot) o.rotation.set(p.rot[0], p.rot[1], p.rot[2]);
    if (p.scale) o.scale.fromArray(p.scale);
    if (p.visible !== undefined) o.visible = p.visible;
    if (p.color !== null && o.material && o.material.color) {
      if (!o.userData._hasClonedMat) {
        o.material = o.material.clone();
        o.userData._hasClonedMat = true;
      }
      o.material.color.setHex(p.color);
    }
    o.updateMatrixWorld(true);
  });

  if (snapshot.grids && dev && dev.grids) {
    Object.keys(snapshot.grids).forEach((k) => {
      const line = dev.grids.get(k);
      if (!line) return;
      line.position.fromArray(snapshot.grids[k].pos);
      line.scale.fromArray(snapshot.grids[k].scale);
      line.updateMatrixWorld(true);
    });
  }

  if (dev) {
    if (snapshot.selectedUuid) {
      const reg = registry.get(snapshot.selectedUuid);
      if (reg && reg.obj && reg.obj.parent) {
        dev.select(reg.obj);
      } else {
        dev.deselect();
      }
    } else {
      dev.deselect();
    }
  }

  return true;
}

export default function MapDevStudio({ setPage }) {
  const mountRef = useRef(null);
  const ref = useRef({});
  const registryRef = useRef(new Map());
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const saveTimerRef = useRef(0);

  const [status, setStatus] = useState('Memuat map...');
  const [ready, setReady] = useState(false);
  const [fps, setFps] = useState(60);
  const [sel, setSel] = useState(null);
  const [tool, setTool] = useState('move'); // info, move, rotate, scale, delete, clone, paint
  const [moveSnap, setMoveSnap] = useState(2); // studs
  const [rotSnap, setRotSnap] = useState(45); // deg
  const [scaleSnap, setScaleSnap] = useState(1); // studs
  const [paintColor, setPaintColor] = useState('#73a95f');
  const [mapMode, setMapMode] = useState('merged'); // 'detail' (32.707 parts) | 'stages' (139 parts)
  const [team, setTeam] = useState('white');
  const [stats, setStats] = useState({ mesh: 0, grid: 0 });
  const [parts, setParts] = useState([]);
  const [savedAt, setSavedAt] = useState(null);
  const [speed, setSpeed] = useState(2.2);
  const [partQuery, setPartQuery] = useState('');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updatePartsList = useCallback((mapGroup) => {
    if (!mapGroup) return;
    const list = [];
    mapGroup.traverse((o) => {
      if (!o.isMesh || !o.userData) return;
      if (o.userData.isBabftWater || o.userData.isBabftPlot || o.userData.isBabftFlag) return;
      const g = o.geometry;
      if (g && !g.boundingBox) g.computeBoundingBox();
      let rad = 0;
      if (g && g.boundingBox) {
        const sz = g.boundingBox.getSize(new THREE.Vector3());
        rad = sz.length() / 2;
      }
      list.push({ uuid: o.uuid, name: o.name || o.type, radius: +rad.toFixed(1) });
    });
    // Jika terlalu banyak (32k), batasi preview daftar agar browser tidak nge-freeze saat render tabel
    list.sort((a, b) => b.radius - a.radius);
    setParts(list);

    let n = 0;
    mapGroup.traverse((o) => { if (o.isMesh) n += 1; });
    const dev = ref.current.dev;
    setStats({ mesh: n, grid: dev ? dev.grids.size : 7 });
  }, []);

  const pushSnapshot = useCallback((label = '') => {
    const S = ref.current;
    if (!S.mapGroup || !S.dev) return;

    const snap = collectSnapshot(S.mapGroup, S.dev, registryRef.current);
    const last = undoStack.current[undoStack.current.length - 1];
    if (last) {
      const isSame = JSON.stringify(last.parts) === JSON.stringify(snap.parts) &&
                     JSON.stringify(last.grids) === JSON.stringify(snap.grids);
      if (isSame) return;
    }

    undoStack.current.push(snap);
    if (undoStack.current.length > MAX_UNDO_STACK) {
      undoStack.current.shift();
    }
    redoStack.current = [];
    setCanUndo(undoStack.current.length > 1);
    setCanRedo(false);

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(snap));
        setSavedAt(new Date().toLocaleTimeString());
      } catch (e) {
        console.warn('auto-save snapshot gagal:', e);
      }
    }, 700);
  }, []);

  const doUndo = useCallback(() => {
    const S = ref.current;
    if (!S.mapGroup || !S.dev) return;
    if (undoStack.current.length <= 1) return;

    const current = undoStack.current.pop();
    redoStack.current.push(current);

    const target = undoStack.current[undoStack.current.length - 1];
    applySnapshot(target, S.mapGroup, S.dev, registryRef.current);

    setCanUndo(undoStack.current.length > 1);
    setCanRedo(true);
    updatePartsList(S.mapGroup);
    setStatus(`Undo berhasil (sisa ${undoStack.current.length - 1} langkah)`);

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(target));
        setSavedAt(new Date().toLocaleTimeString());
      } catch (_) {}
    }, 500);
  }, [updatePartsList]);

  const doRedo = useCallback(() => {
    const S = ref.current;
    if (!S.mapGroup || !S.dev) return;
    if (redoStack.current.length === 0) return;

    const target = redoStack.current.pop();
    undoStack.current.push(target);
    applySnapshot(target, S.mapGroup, S.dev, registryRef.current);

    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
    updatePartsList(S.mapGroup);
    setStatus(`Redo berhasil (langkah ${undoStack.current.length - 1})`);

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(target));
        setSavedAt(new Date().toLocaleTimeString());
      } catch (_) {}
    }, 500);
  }, [updatePartsList]);

  const loadMapData = useCallback(async (modeToLoad = 'merged') => {
    try {
      setStatus(modeToLoad === 'merged' ? 'Menggabungkan 32.708 part jadi 1 bagian utuh (0 Lag / 60 FPS)...' : (modeToLoad === 'detail' ? 'Memuat 32.707 part asli Roblox Studio...' : 'Memuat 139 part modular...'));
      const S = ref.current;
      if (!S || !S.scene) return;
      if (S.dev) S.dev.deselect();
      setSel(null);

      if (S.mapGroup && S.scene) {
        S.scene.remove(S.mapGroup);
      }
      registryRef.current.clear();

      let resGroup = null;
      let resBbox = null;

      if (modeToLoad === 'merged') {
        const res = await loadBabftMapMerged('/maps/babft_obj.bin', (p) => {
          if (p) setStatus(p.stage || `Memuat: ${p.done} / ${p.total}`);
        });
        resGroup = res.group;
        resBbox = res.stats.sizeBlock;
      } else if (modeToLoad === 'detail') {
        const res = await loadBabftMapObj('/maps/babft_obj.bin', (p) => {
          if (p) setStatus(`Memuat objek asli: ${p.done} / ${p.total}`);
        });
        resGroup = res.group;
        resBbox = res.stats.sizeBlock;
      } else {
        const res = await loadBabftMapGlb(THREE);
        resGroup = res.group;
        resBbox = res.bbox ? res.bbox.size : [200, 100, 600];
      }

      S.scene.add(resGroup);
      S.mapGroup = resGroup;

      if (S.dev) {
        S.dev.resetGrids();
        S.dev.setTranslationSnap(moveSnap);
        S.dev.setRotationSnap(rotSnap);
        S.dev.setScaleSnap(scaleSnap);
        S.dev.setPaintColor(paintColor);
      }

      registerMeshes(resGroup, registryRef.current);

      const initSnap = collectSnapshot(resGroup, S.dev, registryRef.current);
      undoStack.current = [initSnap];
      redoStack.current = [];
      setCanUndo(false);
      setCanRedo(false);

      updatePartsList(resGroup);
      if ((modeToLoad === 'merged' || modeToLoad === 'detail') && S.camera && S.controls) {
        S.camera.position.set(0, 360, -1650);
        S.controls.target.set(0, 205, -2150);
        S.controls.update();
      }
      const statusMsg = modeToLoad === 'merged'
        ? 'Siap — Mode 1 Bagian Utuh (0 Lag / 60 FPS!)'
        : (modeToLoad === 'detail' ? 'Siap — Mode 32.707 Part Asli (Klik part mana pun untuk edit!)' : 'Siap — Mode 139 Part Modular');
      setStatus(statusMsg);
      setReady(true);
    } catch (err) {
      console.error('loadMapData failure:', err);
      setStatus('Gagal memuat map: ' + (err && err.message));
    }
  }, [moveSnap, rotSnap, scaleSnap, paintColor, updatePartsList]);

  const doResetMapToOriginal = useCallback(async () => {
    try {
      clearTimeout(saveTimerRef.current);
      localStorage.removeItem(SAVE_KEY);
      await loadMapData(mapMode);
      setSavedAt(null);
      setStatus('Map BERHASIL di-reset ke bentuk asli bawaan! (100% utuh & rapi)');
      setTimeout(() => setStatus('Siap — klik objek map untuk mengedit'), 4000);
    } catch (e) {
      console.error('Reset map gagal:', e);
      setStatus('Gagal reset map: ' + (e && e.message));
    }
  }, [loadMapData, mapMode]);

  const doUndoRef = useRef(doUndo);
  doUndoRef.current = doUndo;
  const doRedoRef = useRef(doRedo);
  doRedoRef.current = doRedo;
  const pushSnapshotRef = useRef(pushSnapshot);
  pushSnapshotRef.current = pushSnapshot;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let raf = 0;
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1424);

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.5, 25000);
    camera.position.set(120, 160, 200);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 15000;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    controls.screenSpacePanning = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 0.95);
    dir.position.set(300, 500, 200);
    scene.add(dir);
    scene.add(new THREE.HemisphereLight(0x7da5d8, 0x1a2638, 0.45));

    ref.current = { renderer, scene, camera, controls, mapGroup: null, dev: null, selected: null };

    const keys = {};
    const onKey = (e, down) => {
      const tag = (e.target && e.target.tagName) || '';
      const isInput = (tag === 'INPUT' || tag === 'TEXTAREA');

      if (down && (e.ctrlKey || e.metaKey)) {
        const k = (e.key || '').toLowerCase();
        if (k === 'z' && !e.shiftKey) {
          if (!isInput || e.target.type === 'number') {
            e.preventDefault();
            if (doUndoRef.current) doUndoRef.current();
            return;
          }
        } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
          if (!isInput || e.target.type === 'number') {
            e.preventDefault();
            if (doRedoRef.current) doRedoRef.current();
            return;
          }
        } else if (k === 'd') {
          e.preventDefault();
          const d = ref.current.dev;
          if (d && d.selected) {
            const copy = d.duplicateSelected();
            if (copy) {
              registerMeshes(ref.current.mapGroup, registryRef.current);
              updatePartsList(ref.current.mapGroup);
              if (pushSnapshotRef.current) pushSnapshotRef.current('Duplicate');
            }
          }
          return;
        }
      }

      if (isInput) return;

      const k = (e.key || '').toLowerCase();
      if (k === 'shift') { keys.shift = down; return; }
      if ('wasdqe'.includes(k) && k.length === 1) {
        keys[k] = down;
        if (down) e.preventDefault();
        return;
      }

      // Shortcut Tool (mirip 3D Block Simulator)
      if (down) {
        if (e.key === '1') selectTool('delete');
        else if (e.key === '2' || k === 'm' || k === 'g') selectTool('move');
        else if (e.key === '3' || k === 'r') selectTool('rotate');
        else if (e.key === '4' || k === 's') selectTool('scale');
        else if (e.key === '5' || k === 'c') selectTool('paint');
        else if (e.key === '6') selectTool('clone');
        else if (e.key === '7') selectTool('info');
      }

      if (down && e.key && e.key.indexOf('Arrow') === 0) {
        const d = ref.current.dev;
        const o = d && d.selected;
        if (!o) return;
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        if (e.key === 'ArrowLeft') o.position.x -= step;
        else if (e.key === 'ArrowRight') o.position.x += step;
        else if (e.key === 'ArrowUp') o.position.z -= step;
        else if (e.key === 'ArrowDown') o.position.z += step;
        else if (e.key === 'PageUp') o.position.y += step;
        else if (e.key === 'PageDown') o.position.y -= step;
        o.updateMatrixWorld(true);
        if (pushSnapshotRef.current) pushSnapshotRef.current('Nudge');
      }
    };

    const kd = (e) => onKey(e, true), ku = (e) => onKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    ref.current.keys = keys;
    ref.current.disposeKeys = () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };

    const dev = createBabftMapDevMode({
      THREE, scene, camera, renderer,
      getMapGroup: () => ref.current.mapGroup,
      teams: BABFT_TEAMS,
      plotCenters: BABFT_STUDIO_TEAM_PLOTS,
      mapScale: BABFT_MAP_SCALE,
      onSelect: (o) => {
        if (!o) { setSel(null); ref.current.selected = null; return; }
        const isGrid = !!(o.userData && o.userData.isBabftDevGrid);
        setSel({
          name: o.name || (o.type + (isGrid ? ' · grid ' + o.userData.team : '')),
          isGrid, type: o.type,
          pos: o.position.toArray().map((v) => +v.toFixed(2)),
          rot: [o.rotation.x, o.rotation.y, o.rotation.z].map((v) => +(v * 57.2958).toFixed(0)),
          scale: o.scale.toArray().map((v) => +v.toFixed(2)),
        });
        ref.current.selected = o;
      },
      onMode: (m) => {},
      onChange: () => {
        if (pushSnapshotRef.current) pushSnapshotRef.current('DevChange');
      },
    });
    dev.setEnabled(true);
    ref.current.dev = dev;

    try {
      const gz = dev.gizmo;
      gz.addEventListener('dragging-changed', (e) => {
        controls.enabled = !e.value;
        if (e.value) {
          ref.current._gizmoDragging = true;
        } else {
          setTimeout(() => { ref.current._gizmoDragging = false; }, 60);
          if (pushSnapshotRef.current) pushSnapshotRef.current('Gizmo Drag');
        }
      });
    } catch (e) { console.warn('hook gizmo gagal:', e); }

    ref.current.speed = 2.2;
    window.__studio = ref.current;
    window.__THREE__ = THREE;

    // Load initial map
    loadMapData('merged');

    const _fwd = new THREE.Vector3(), _right = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
    let frameCount = 0;
    let lastFpsTime = performance.now();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 500) {
        if (frameCount > 0) {
          const curFps = Math.round((frameCount * 1000) / (now - lastFpsTime));
          setFps(curFps);
        }
        frameCount = 0;
        lastFpsTime = now;
      }
      const K = ref.current.keys || {};
      const base = (ref.current.speed !== undefined ? ref.current.speed : 2.2);
      const spd = (K.shift ? base * 2.7 : base) * Math.max(1, camera.position.length() / 120);
      if (K.w || K.s || K.a || K.d || K.q || K.e) {
        camera.getWorldDirection(_fwd);
        _right.crossVectors(_fwd, _up).normalize();
        const move = new THREE.Vector3();
        if (K.w) move.add(_fwd);
        if (K.s) move.sub(_fwd);
        if (K.d) move.add(_right);
        if (K.a) move.sub(_right);
        if (K.e) move.add(_up);
        if (K.q) move.sub(_up);
        if (move.lengthSq() > 0) {
          move.normalize().multiplyScalar(spd);
          camera.position.add(move);
          controls.target.add(move);
        }
      }
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      try { dev.dispose(); } catch (_) {}
      try { ref.current.disposeKeys && ref.current.disposeKeys(); } catch (_) {}
      try { controls.dispose(); renderer.dispose(); } catch (_) {}
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [loadMapData]);

  // Handler Pilih Tool
  const selectTool = (toolName) => {
    setTool(toolName);
    const d = ref.current.dev;
    if (d) {
      d.setActiveTool(toolName);
    }
  };

  const handleSnapMove = (step) => {
    setMoveSnap(step);
    if (ref.current.dev) ref.current.dev.setTranslationSnap(step);
  };

  const handleSnapRot = (deg) => {
    setRotSnap(deg);
    if (ref.current.dev) ref.current.dev.setRotationSnap(deg);
  };

  const handleSnapScale = (step) => {
    setScaleSnap(step);
    if (ref.current.dev) ref.current.dev.setScaleSnap(step);
  };

  const handleColorChange = (hex) => {
    setPaintColor(hex);
    if (ref.current.dev) {
      ref.current.dev.setPaintColor(hex);
      if (ref.current.dev.selected && tool === 'paint') {
        ref.current.dev.paintSelected(hex);
      }
    }
  };

  const pickPart = (uuid) => {
    const S = ref.current;
    const d = S.dev;
    if (!d || !S.mapGroup) return;
    let tgt = null;
    S.mapGroup.traverse((o) => { if (!tgt && o.uuid === uuid) tgt = o; });
    if (!tgt) return;
    d.select(tgt);
    const box = new THREE.Box3().setFromObject(tgt);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    const cam = S.camera, ct = S.controls;
    const dist = Math.max(15, Math.min(450, size * 2.5));
    cam.position.set(c.x + dist, c.y + dist * 0.8, c.z + dist);
    ct.target.copy(c); ct.update();
  };

  const focusTeam = (k) => {
    const d = ref.current.dev;
    if (!d) return;
    setTeam(k);
    const g = d.grids.get(k);
    if (!g) return;
    d.select(g);
    const c = ref.current.camera, ct = ref.current.controls;
    const sideOffset = g.position.x >= 0 ? 100 : -100;
    c.position.set(g.position.x + sideOffset, 205 + 75, g.position.z + 100);
    ct.target.set(g.position.x, 205, g.position.z);
    ct.update();
  };

  return (
    <div style={{ height: '100dvh', maxHeight: '100dvh', overflow: 'hidden', backgroundColor: '#0b1120', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        borderBottom: '1px solid rgba(148,163,184,0.2)', backgroundColor: '#0e1420', flexWrap: 'wrap', flexShrink: 0,
      }}>
        <button onClick={() => setPage('shapes')} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
          border: '1px solid #334155', backgroundColor: '#0e1420', color: '#94a3b8',
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: 'clamp(1rem,2.4vw,1.3rem)',
            background: 'linear-gradient(180deg,#a855f7 0%,#7c3aed 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>MAP DEV STUDIO</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#c084fc',
            background: 'rgba(168,85,247,0.15)', padding: '2px 8px', borderRadius: 4, letterSpacing: 1,
            fontFamily: 'Orbitron, sans-serif',
          }}>BUILD A BOAT</span>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 16 }}>
          <button
            onClick={() => { setMapMode('merged'); loadMapData('merged'); }}
            style={{
              padding: '5px 11px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer',
              border: `1px solid ${mapMode === 'merged' ? '#10b981' : 'rgba(148,163,184,0.3)'}`,
              backgroundColor: mapMode === 'merged' ? 'rgba(16,185,129,0.25)' : 'rgba(30,41,59,0.5)',
              color: mapMode === 'merged' ? '#34d399' : '#94a3b8',
              boxShadow: mapMode === 'merged' ? '0 0 10px rgba(16,185,129,0.35)' : 'none',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
            title="32.708 part asli di-render jadi 1 bagian utuh (0 Lag, 60 FPS)"
          >
            ⚡ Mode: 1 Bagian Utuh (0 Lag / 60 FPS)
          </button>
          <button
            onClick={() => { setMapMode('detail'); loadMapData('detail'); }}
            style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${mapMode === 'detail' ? '#22c55e' : 'rgba(148,163,184,0.3)'}`,
              backgroundColor: mapMode === 'detail' ? 'rgba(34,197,94,0.2)' : 'rgba(30,41,59,0.5)',
              color: mapMode === 'detail' ? '#4ade80' : '#94a3b8',
            }}
            title="32.707 part terpisah (tiap balok tanah, pohon, batu bisa diedit sendiri)"
          >
            Mode: 32.707 Part Edit
          </button>
          <button
            onClick={() => { setMapMode('stages'); loadMapData('stages'); }}
            style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${mapMode === 'stages' ? '#3b82f6' : 'rgba(148,163,184,0.3)'}`,
              backgroundColor: mapMode === 'stages' ? 'rgba(59,130,246,0.2)' : 'rgba(30,41,59,0.5)',
              color: mapMode === 'stages' ? '#60a5fa' : '#94a3b8',
            }}
            title="139 part modular (ringan per-stage)"
          >
            Mode: 139 Part Modular
          </button>
        </div>

        {/* FPS Indicator Realtime */}
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 6,
          border: `1px solid ${fps >= 45 ? 'rgba(34,197,94,0.35)' : (fps >= 25 ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)')}`,
          backgroundColor: fps >= 45 ? 'rgba(34,197,94,0.12)' : (fps >= 25 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'),
        }} title="Indikator FPS Realtime">
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor: fps >= 45 ? '#22c55e' : (fps >= 25 ? '#f59e0b' : '#ef4444'),
            boxShadow: `0 0 6px ${fps >= 45 ? '#22c55e' : (fps >= 25 ? '#f59e0b' : '#ef4444')}`,
          }} />
          <span style={{
            fontFamily: 'Orbitron, sans-serif', fontSize: 11, fontWeight: 800,
            color: fps >= 45 ? '#4ade80' : (fps >= 25 ? '#fbbf24' : '#f87171'),
          }}>
            {fps} FPS
          </span>
        </div>

        <button
          onClick={doResetMapToOriginal}
          style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
            border: '1px solid #ef4444', backgroundColor: 'rgba(239,68,68,0.2)', color: '#fca5a5',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
          }}
          title="Kembalikan map ke bentuk asli awal bawaan (100% utuh & bersih)"
        >
          ↺ Reset ke Map Asli
        </button>

        <div style={{ fontSize: 11, color: ready ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>
          {status}
        </div>
      </div>

      {/* Floating Sub-bar Pengaturan Tool Aktif (Pill Bar ala 3D Block Simulator) */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '7px 20px',
        backgroundColor: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(148,163,184,0.15)', flexShrink: 0, zIndex: 5,
        backdropFilter: 'blur(8px)', flexWrap: 'wrap',
      }}>
        {tool === 'move' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: 0.5 }}>SNAP MOVE:</span>
            {[2, 1, 0.5, 0.2, 0.1, 0].map((st) => (
              <button key={st} onClick={() => handleSnapMove(st)} style={{
                padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${moveSnap === st ? '#22c55e' : 'rgba(148,163,184,0.25)'}`,
                backgroundColor: moveSnap === st ? 'rgba(34,197,94,0.25)' : 'rgba(30,41,59,0.6)',
                color: moveSnap === st ? '#4ade80' : '#cbd5e1',
              }}>{st === 0 ? 'Off' : `${st} studs`}</button>
            ))}
          </div>
        )}

        {tool === 'rotate' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', letterSpacing: 0.5 }}>SNAP ROTATE:</span>
            {[90, 45, 15, 0].map((deg) => (
              <button key={deg} onClick={() => handleSnapRot(deg)} style={{
                padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${rotSnap === deg ? '#3b82f6' : 'rgba(148,163,184,0.25)'}`,
                backgroundColor: rotSnap === deg ? 'rgba(59,130,246,0.25)' : 'rgba(30,41,59,0.6)',
                color: rotSnap === deg ? '#60a5fa' : '#cbd5e1',
              }}>{deg === 0 ? 'Free' : `${deg}°`}</button>
            ))}
          </div>
        )}

        {tool === 'scale' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', letterSpacing: 0.5 }}>SNAP SCALE:</span>
            {[2, 1, 0.5, 0].map((st) => (
              <button key={st} onClick={() => handleSnapScale(st)} style={{
                padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${scaleSnap === st ? '#8b5cf6' : 'rgba(148,163,184,0.25)'}`,
                backgroundColor: scaleSnap === st ? 'rgba(139,92,246,0.25)' : 'rgba(30,41,59,0.6)',
                color: scaleSnap === st ? '#c084fc' : '#cbd5e1',
              }}>{st === 0 ? 'Off' : `${st} studs`}</button>
            ))}
          </div>
        )}

        {tool === 'paint' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#d946ef', letterSpacing: 0.5 }}>PALET WARNA:</span>
            {PRESET_COLORS.map((pc) => (
              <button key={pc.hex} onClick={() => handleColorChange(pc.hex)} style={{
                padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${paintColor === pc.hex ? '#fff' : 'rgba(148,163,184,0.25)'}`,
                backgroundColor: pc.hex, color: '#0e1420', textShadow: '0 0 2px #fff',
              }}>{pc.name}</button>
            ))}
            <input type="color" value={paintColor} onChange={(e) => handleColorChange(e.target.value)} style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer' }} />
          </div>
        )}

        {tool === 'delete' && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#fca5a5' }}>
            Mode Hapus: Klik part mana pun di layar untuk langsung menghapusnya.
          </span>
        )}

        {tool === 'clone' && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#67e8f9' }}>
            Mode Clone: Klik part mana pun di layar untuk langsung menduplikatnya.
          </span>
        )}

        {tool === 'info' && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#7dd3fc' }}>
            Mode Info: Hover &amp; klik part untuk memeriksa detail nama &amp; koordinat tanpa mengubah posisi.
          </span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>KAMERA:</span>
          <button onClick={() => setSpeed((v) => { const n = Math.max(0.4, +(v - 0.6).toFixed(1)); if (ref.current) ref.current.speed = n; return n; })} style={{ padding: '2px 6px', borderRadius: 4, background: '#1e293b', border: '1px solid #475569', color: '#e2e8f0', fontSize: 10, cursor: 'pointer' }}>−</button>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', minWidth: 40, textAlign: 'center', fontFamily: 'Orbitron, sans-serif' }}>{speed.toFixed(1)}×</span>
          <button onClick={() => setSpeed((v) => { const n = Math.min(20, +(v + 0.6).toFixed(1)); if (ref.current) ref.current.speed = n; return n; })} style={{ padding: '2px 6px', borderRadius: 4, background: '#1e293b', border: '1px solid #475569', color: '#e2e8f0', fontSize: 10, cursor: 'pointer' }}>+</button>
        </div>
      </div>

      {/* Body Area */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        {/* BUILD TOOLS VERTICAL BAR (Kiri — 100% Mengikuti Gaya 3D Block Simulator) */}
        <div style={{
          position: 'absolute', top: 16, left: 16, zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: 6,
          backgroundColor: 'rgba(14,20,32,0.92)', padding: '10px 8px', borderRadius: 14,
          border: '1px solid rgba(148,163,184,0.22)', backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)', width: 136,
        }}>
          {/* Header Build Tools */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', marginBottom: 4,
            borderBottom: '1px solid rgba(148,163,184,0.15)',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
            }}>
              <Wrench size={13} color="#fff" />
            </div>
            <span style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: 10, fontWeight: 900, color: '#e2e8f0', letterSpacing: 1,
            }}>BUILD TOOLS</span>
          </div>

          {/* Tombol Info */}
          <button onClick={() => selectTool('info')} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8,
            border: `1px solid ${tool === 'info' ? '#38bdf8' : 'transparent'}`,
            backgroundColor: tool === 'info' ? '#38bdf8' : 'transparent',
            color: tool === 'info' ? '#0e1420' : '#e2e8f0',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }} title="Info — mode inspeksi (klik objek untuk lihat info)">
            <Search size={14} /> <span>Info</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>[7]</span>
          </button>

          {/* Tombol Undo & Redo */}
          <button onClick={doUndo} disabled={!canUndo} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8,
            border: `1px solid ${canUndo ? '#22c55e' : 'rgba(148,163,184,0.1)'}`,
            backgroundColor: canUndo ? 'rgba(34,197,94,0.15)' : 'transparent',
            color: canUndo ? '#22c55e' : '#475569',
            fontSize: 12, fontWeight: 600, cursor: canUndo ? 'pointer' : 'not-allowed',
            opacity: canUndo ? 1 : 0.5,
          }} title="Undo (Ctrl+Z)">
            <Undo2 size={14} /> <span>Undo</span>
          </button>

          <button onClick={doRedo} disabled={!canRedo} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8,
            border: `1px solid ${canRedo ? '#3b82f6' : 'rgba(148,163,184,0.1)'}`,
            backgroundColor: canRedo ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: canRedo ? '#3b82f6' : '#475569',
            fontSize: 12, fontWeight: 600, cursor: canRedo ? 'pointer' : 'not-allowed',
            opacity: canRedo ? 1 : 0.5,
          }} title="Redo (Ctrl+Y)">
            <Redo2 size={14} /> <span>Redo</span>
          </button>

          <div style={{ height: 1, backgroundColor: 'rgba(148,163,184,0.15)', margin: '2px 0' }} />

          {/* Tombol Delete */}
          <button onClick={() => selectTool('delete')} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8,
            border: `1px solid ${tool === 'delete' ? '#ef4444' : 'transparent'}`,
            backgroundColor: tool === 'delete' ? '#ef4444' : 'transparent',
            color: tool === 'delete' ? '#fff' : '#e2e8f0',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }} title="Delete (X) — klik part untuk menghapus">
            <Trash2 size={14} /> <span>Delete</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>[1]</span>
          </button>

          {/* Tombol Paint */}
          <button onClick={() => selectTool('paint')} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8,
            border: `1px solid ${tool === 'paint' ? paintColor : 'transparent'}`,
            backgroundColor: tool === 'paint' ? paintColor : 'transparent',
            color: tool === 'paint' ? '#0e1420' : '#e2e8f0',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }} title="Paint (C) — klik part untuk mewarnai">
            <Paintbrush size={14} /> <span>Paint</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>[5]</span>
          </button>

          {/* Tombol Scale */}
          <button onClick={() => selectTool('scale')} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8,
            border: `1px solid ${tool === 'scale' ? '#8b5cf6' : 'transparent'}`,
            backgroundColor: tool === 'scale' ? '#8b5cf6' : 'transparent',
            color: tool === 'scale' ? '#fff' : '#e2e8f0',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }} title="Scale (S) — ubah ukuran part">
            <Maximize size={14} /> <span>Scale</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>[4]</span>
          </button>

          {/* Tombol Move */}
          <button onClick={() => selectTool('move')} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8,
            border: `1px solid ${tool === 'move' ? '#22c55e' : 'transparent'}`,
            backgroundColor: tool === 'move' ? '#22c55e' : 'transparent',
            color: tool === 'move' ? '#0e1420' : '#e2e8f0',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }} title="Move (M) — geser part">
            <Move size={14} /> <span>Move</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>[2]</span>
          </button>

          {/* Tombol Rotate */}
          <button onClick={() => selectTool('rotate')} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8,
            border: `1px solid ${tool === 'rotate' ? '#3b82f6' : 'transparent'}`,
            backgroundColor: tool === 'rotate' ? '#3b82f6' : 'transparent',
            color: tool === 'rotate' ? '#fff' : '#e2e8f0',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }} title="Rotate (R) — putar part">
            <RotateCw size={14} /> <span>Rotate</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>[3]</span>
          </button>

          {/* Tombol Clone */}
          <button onClick={() => selectTool('clone')} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8,
            border: `1px solid ${tool === 'clone' ? '#06b6d4' : 'transparent'}`,
            backgroundColor: tool === 'clone' ? '#06b6d4' : 'transparent',
            color: tool === 'clone' ? '#0e1420' : '#e2e8f0',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }} title="Clone (Ctrl+D) — duplikat part">
            <Copy size={14} /> <span>Clone</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>[6]</span>
          </button>
        </div>

        {/* 3D Canvas */}
        <div ref={mountRef} style={{ flex: 1, minWidth: 0, position: 'relative' }} />

        {/* Panel Kanan */}
        <div style={{
          width: 275, flexShrink: 0, padding: 14, overflowY: 'auto',
          borderLeft: '1px solid rgba(148,163,184,0.2)', backgroundColor: '#0e1420',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#c084fc', letterSpacing: 1, marginBottom: 8 }}>
            GRID AREA BUILD — 7 TEAM
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.5, marginBottom: 8 }}>
            Geser &amp; scale grid di langit = atur luas area build team.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
            {BABFT_TEAMS.map((t) => {
              const hex = '#' + t.color.toString(16).padStart(6, '0');
              const on = team === t.key;
              return (
                <button key={t.key} onClick={() => focusTeam(t.key)} style={{
                  padding: '5px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${on ? hex : 'rgba(148,163,184,0.3)'}`,
                  backgroundColor: on ? hex + '33' : 'rgba(30,41,59,0.5)', color: '#e2e8f0',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: hex, display: 'inline-block', marginRight: 4 }} />
                  {t.name}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: '#c084fc', letterSpacing: 1, marginBottom: 6 }}>
            OBJEK TERPILIH
          </div>
          {sel ? (
            <div style={{ fontSize: 11, color: '#e2e8f0', lineHeight: 1.6 }}>
              <div><b>{sel.name}</b></div>
              <div style={{ color: '#94a3b8', marginBottom: 6 }}>tipe: {sel.type}{sel.isGrid ? ' (grid)' : ''}</div>

              {['pos', 'rot', 'scale'].map((grup) => (
                <div key={grup} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ width: 34, color: '#94a3b8', fontSize: 10, textTransform: 'uppercase' }}>{grup}</span>
                  {['X', 'Y', 'Z'].map((ax, ai) => (
                    <input key={ax}
                      type="number" step={grup === 'scale' ? 0.1 : 1}
                      value={grup === 'rot' ? (sel.rot[ai] || 0) : (grup === 'pos' ? sel.pos[ai] : sel.scale[ai])}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (isNaN(v)) return;
                        const S = ref.current; const d = S.dev; const o = d && d.selected;
                        if (!o) return;
                        if (grup === 'pos') o.position[['x', 'y', 'z'][ai]] = v;
                        else if (grup === 'rot') o.rotation[['x', 'y', 'z'][ai]] = v * Math.PI / 180;
                        else o.scale[['x', 'y', 'z'][ai]] = v;
                        o.updateMatrixWorld(true);
                        setSel((p) => p ? { ...p,
                          pos: o.position.toArray().map((x) => +x.toFixed(2)),
                          rot: [o.rotation.x, o.rotation.y, o.rotation.z].map((x) => +(x * 57.2958).toFixed(0)),
                          scale: o.scale.toArray().map((x) => +x.toFixed(2)) } : p);
                        if (pushSnapshotRef.current) pushSnapshotRef.current('NumberInput');
                      }}
                      style={{
                        width: '100%', minWidth: 0, padding: '3px 4px', borderRadius: 4,
                        border: '1px solid rgba(148,163,184,0.3)', backgroundColor: 'rgba(30,41,59,0.8)',
                        color: '#e2e8f0', fontSize: 10, fontFamily: 'monospace',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: '#64748b' }}>Belum ada objek terpilih. Klik objek map / grid.</div>
          )}

          <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, color: '#c084fc', letterSpacing: 1, marginBottom: 6 }}>
            DAFTAR PART ({parts.length})
          </div>
          <input
            value={partQuery} onChange={(e) => setPartQuery(e.target.value)}
            placeholder="cari nama part..."
            style={{
              width: '100%', boxSizing: 'border-box', padding: '5px 8px', marginBottom: 6,
              borderRadius: 6, border: '1px solid rgba(148,163,184,0.3)',
              backgroundColor: 'rgba(30,41,59,0.7)', color: '#e2e8f0', fontSize: 11,
            }}
          />
          <div style={{
            maxHeight: 210, overflowY: 'auto', border: '1px solid rgba(148,163,184,0.2)',
            borderRadius: 8, backgroundColor: 'rgba(15,23,42,0.6)',
          }}>
            {parts
              .filter((p) => !partQuery || p.name.toLowerCase().includes(partQuery.toLowerCase()))
              .slice(0, 100)
              .map((p) => {
                const on = sel && sel.name === p.name;
                return (
                  <div key={p.uuid} onClick={() => pickPart(p.uuid)}
                    style={{
                      padding: '4px 8px', cursor: 'pointer', fontSize: 10,
                      borderBottom: '1px solid rgba(148,163,184,0.12)',
                      backgroundColor: on ? 'rgba(168,85,247,0.25)' : 'transparent',
                      color: on ? '#e9d5ff' : '#cbd5e1',
                    }}
                  >{p.name} <span style={{ color: '#64748b' }}>· r{p.radius}</span></div>
                );
              })}
          </div>

          <div style={{ marginTop: 14, fontSize: 10, color: '#64748b', lineHeight: 1.6 }}>
            <div style={{ color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>STATUS DUNIA</div>
            Total Mesh: <b style={{ color: '#e2e8f0' }}>{stats.mesh.toLocaleString()}</b><br />
            Total Grid: <b style={{ color: '#e2e8f0' }}>{stats.grid}</b><br />
            <br />
            <b>SHORTCUT BUILD TOOLS:</b><br />
            <span style={{ color: '#ef4444' }}>[1] X / Del</span> : Delete<br />
            <span style={{ color: '#22c55e' }}>[2] M / G</span> : Move<br />
            <span style={{ color: '#3b82f6' }}>[3] R</span> : Rotate<br />
            <span style={{ color: '#8b5cf6' }}>[4] S</span> : Scale<br />
            <span style={{ color: '#d946ef' }}>[5] C</span> : Paint<br />
            <span style={{ color: '#06b6d4' }}>[6] Ctrl+D</span> : Clone<br />
            <span style={{ color: '#38bdf8' }}>[7]</span> : Info<br />
            <span style={{ color: '#22c55e' }}>Ctrl+Z</span> / <span style={{ color: '#3b82f6' }}>Ctrl+Y</span> : Undo / Redo
          </div>
        </div>
      </div>
    </div>
  );
}
