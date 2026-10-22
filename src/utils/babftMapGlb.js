/**
 * babftMapGlb.js — MAP "Build A boat" (GLB) untuk Build Area 'Babft'.
 *
 * bab 181 (2026-10-12, perintah user): ganti TOTAL map Babft lama
 * (babftMapBuilder.js — "kacau balau, gak jelas") dengan model asli
 * "Build A boat.glb" (Roblox, diekspor ENI rbxl2obj).
 *
 * ⚠️ ATURAN SKALA (perintah user):
 *   "1 block = 2 studs, jadi PAKSAKAN map tersebut mengikuti yang ada disini,
 *    jadi buka sini ngikutin dia, tapi dia yang dipaksa ngikutin sini."
 *   → Sumber GLB memakai satuan STUDS Roblox (1 unit = 1 stud).
 *   → Di simulator: 1 block = STUDS_PER_BLOCK = 2 studs = 1 unit Three.js.
 *   → Jadi skala = 1 / STUDS_PER_BLOCK  (10361,6 studs → 5180,8 block).
 *
 * ⚠️ GEOMETRI BESAR: 572.176 vertex · 778.928 segitiga · 77 primitive.
 *   - Jangan clone/duplikat mesh ini (mahal).
 *   - Jangan pakai raycast untuk seluruh map (lambat) → pakai bounding box kasar.
 *
 * ⚠️ VERTEX COLOR: GLB TIDAK punya UV maupun NORMAL. Warna = material
 *   (baseColorFactor). Kalau mesh dimasukkan ke daftar `blocks` simulator,
 *   app akan menimpa materialnya dengan material block (vertex color) →
 *   warna map HILANG jadi gelap. Karena itu mesh map WAJIB:
 *     · isBabftProp = true  (prop, BUKAN block)
 *     · tidak didaftarkan ke threeRef.current.blocks
 */

import { Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STUDS_PER_BLOCK } from './blockStuds.js';

export const BABFT_MAP_URL = '/maps/build_a_boat.glb';

/** Dimensi asli (satuan studs) — hasil ukur accessor POSITION. */
export const BABFT_MAP_SRC = {
  bboxMin: [-763.3234, -426.9, -781.7356],
  bboxMax: [655.8012, 193.5, 9579.8914],
  size: [1419.1246, 620.4, 10361.627],
  studs: 10361.627,
  vertices: 572176,
  triangles: 778928,
  primitives: 77,
};

/** Ukuran map setelah dipaksa ikut skala simulator (block). */
/**
 * 7 TIM + PUSAT PETAK BUILD (hasil ukur klaster lantai hijau di GLB, satuan studs).
 * Susunan: tapal kuda — 3 petak kiri, 3 petak kanan, 1 petak tengah-atas.
 * ⚠️ Setiap petak punya titik tengah SENDIRI (jangan pakai pusat map!).
 */
export const BABFT_TEAMS = [
  { key: 'white',   name: 'White Team',   color: 0xf2f2f2 },
  { key: 'red',     name: 'Red Team',     color: 0xd22b2b },
  { key: 'blue',    name: 'Blue Team',    color: 0x2b6fd2 },
  { key: 'magenta', name: 'Magenta Team', color: 0xd22bd2 },
  { key: 'black',   name: 'Black Team',   color: 0x232323 },
  { key: 'green',   name: 'Green Team',   color: 0x2bb54a },
  { key: 'yellow',  name: 'Yellow Team',  color: 0xf2c72b },
];

/** Pusat 7 petak build (studs, koordinat GLB). Diukur dari klaster lantai hijau. */
export const BABFT_PLOT_CENTERS_STUDS = [
  { team: 'white',   cx:  -49.8, cz: -597.0, w: 256, l: 438 },   // petak 1: White Team (tengah)
  { team: 'red',     cx:  473.4, cz:  -64.8, w: 438, l: 256 },   // petak 2: Red Team
  { team: 'blue',    cx:  473.4, cz:  300.2, w: 438, l: 256 },   // petak 3: Blue Team
  { team: 'magenta', cx:  473.4, cz:  647.2, w: 438, l: 256 },   // petak 4: Magenta Team
  { team: 'black',   cx: -580.5, cz:  -69.5, w: 438, l: 256 },   // petak 5: Black Team
  { team: 'green',   cx: -580.5, cz:  293.5, w: 438, l: 256 },   // petak 6: Green Team
  { team: 'yellow',  cx: -580.5, cz:  640.5, w: 438, l: 256 },   // petak 7: Yellow Team
];

/**
 * SKALA KOMPAK (koreksi user: "kegedean tolong lah yang ngotak").
 * Map asli 10361,6 studs = 5180,8 block → TERLALU BESAR.
 * Dipadatkan supaya muat di layar: panjang jadi ~600 block (1/8,6 dari aslinya).
 * ⚠️ Ini BUKAN 1 block = 2 studs lagi untuk map (koreksi user), tapi
 *    proporsi antar bagian map TETAP (uniform scale).
 */
export const BABFT_MAP_TARGET_Z_BLOCK = 600;
export const BABFT_MAP_SCALE = BABFT_MAP_TARGET_Z_BLOCK / (10361.627 / 2);   // 0.1158

/** Tinggi PERMUKAAN LANTAI petak build (studs) — terukur p50 = -12. */
export const BABFT_PLOT_FLOOR_Y = -12;

/** Petak ke-7 (yellow team) ada di UJUNG JALUR (terukur Y = -358). */
export const BABFT_PLOT_FAR_Y = -358;

/** Permukaan air (opsi user: "tambah air/efek biar mirip Babft"). */
export const BABFT_WATER = {
  levelStuds: -60,        // tinggi air (STUDS) — di BAWAH lantai petak (-12)
                          // supaya petak build TERLIHAT (tidak tenggelam)
  color: 0x1f6fb2,
  opacity: 0.72,
};

export const BABFT_MAP_BLOCKS = BABFT_MAP_SRC.studs / STUDS_PER_BLOCK;   // ~5180.8
export const BABFT_MAP_STUDS = BABFT_MAP_SRC.studs;                      // 10361.627


let _loader = null;
function loader() {
  if (!_loader) _loader = new GLTFLoader();
  return _loader;
}

/**
 * Muat + pasang map Build A boat.
 *
 * @param {object} THREE  modul three
 * @param {object} opsi   { url, dracaLoader }
 * @returns {Promise<{group: THREE.Group, dispose: Function, bbox: object}>}
 */

/** Batas-batas Z tiap stage (studs) untuk memecah mesh raksasa jadi part per-stage. */
const STAGE_Z = [
  { name: 'Spawn Area', minZ: -1000, maxZ: 850 },
  { name: 'Stage 1', minZ: 850, maxZ: 1800 },
  { name: 'Stage 2', minZ: 1800, maxZ: 2750 },
  { name: 'Stage 3', minZ: 2750, maxZ: 3700 },
  { name: 'Stage 4', minZ: 3700, maxZ: 4650 },
  { name: 'Stage 5', minZ: 4650, maxZ: 5600 },
  { name: 'Stage 6', minZ: 5600, maxZ: 6550 },
  { name: 'Stage 7', minZ: 6550, maxZ: 7500 },
  { name: 'Stage 8', minZ: 7500, maxZ: 8450 },
  { name: 'Stage 9', minZ: 8450, maxZ: 9200 },
  { name: 'Treasure Island', minZ: 9200, maxZ: 11000 },
];

/**
 * Pisahkan mesh raksasa yang membentang lintas-stage dan pusatkan poros (pivot)
 * masing-masing part ke titik tengah geometrinya.
 * → Gizmo TransformControls muncul tepat di atas part yang diklik, bukan lari ke tengah (0,0,0).
 */
function sliceAndCenterMeshes(src, THREE) {
  const origMeshes = [];
  src.traverse((o) => { if (o.isMesh) origMeshes.push(o); });

  const finalMeshes = [];
  origMeshes.forEach((m) => {
    if (m.parent) m.parent.remove(m);
    const oldGeo = m.geometry;
    if (!oldGeo || !oldGeo.index || !oldGeo.attributes.position) {
      src.add(m);
      finalMeshes.push(m);
      return;
    }

    const oldIdx = oldGeo.index.array;
    const oldPos = oldGeo.attributes.position;
    const oldNorm = oldGeo.attributes.normal;

    let mnz = Infinity, mxz = -Infinity;
    for (let i = 0; i < oldIdx.length; i += 1) {
      const z = oldPos.getZ(oldIdx[i]);
      if (z < mnz) mnz = z; if (z > mxz) mxz = z;
    }

    // Part kecil (span Z <= 700): tidak perlu dipotong stage, cukup pusatkan poros
    if (mxz - mnz <= 700) {
      const a = oldIdx;
      const vMap = new Map();
      const newIndices = [];
      const newPos = [];
      const newNorm = [];
      let mnx = Infinity, mny = Infinity, mnz2 = Infinity;
      let mxx = -Infinity, mxy = -Infinity, mxz2 = -Infinity;

      for (let i = 0; i < a.length; i += 1) {
        const oldV = a[i];
        let newV = vMap.get(oldV);
        if (newV === undefined) {
          newV = vMap.size;
          vMap.set(oldV, newV);
          const x = oldPos.getX(oldV), y = oldPos.getY(oldV), z = oldPos.getZ(oldV);
          newPos.push(x, y, z);
          if (oldNorm) newNorm.push(oldNorm.getX(oldV), oldNorm.getY(oldV), oldNorm.getZ(oldV));
          if (x < mnx) mnx = x; if (x > mxx) mxx = x;
          if (y < mny) mny = y; if (y > mxy) mxy = y;
          if (z < mnz2) mnz2 = z; if (z > mxz2) mxz2 = z;
        }
        newIndices.push(newV);
      }

      const cx = (mnx + mxx) / 2, cy = (mny + mxy) / 2, cz = (mnz2 + mxz2) / 2;
      for (let i = 0; i < newPos.length; i += 3) {
        newPos[i] -= cx; newPos[i + 1] -= cy; newPos[i + 2] -= cz;
      }

      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(newPos, 3));
      if (newNorm.length) g.setAttribute('normal', new THREE.Float32BufferAttribute(newNorm, 3));
      g.setIndex(newIndices.length > 65535 ? new THREE.Uint32BufferAttribute(newIndices, 1) : new THREE.Uint16BufferAttribute(newIndices, 1));
      g.computeBoundingBox();
      g.computeBoundingSphere();

      const newM = new THREE.Mesh(g, m.material);
      newM.name = m.name;
      newM.position.set(cx, cy, cz);
      src.add(newM);
      finalMeshes.push(newM);
      return;
    }

    // Part raksasa (membentang lintas-stage): potong per-stage
    STAGE_Z.forEach((st) => {
      const stageTriangles = [];
      for (let i = 0; i < oldIdx.length; i += 3) {
        const cz = (oldPos.getZ(oldIdx[i]) + oldPos.getZ(oldIdx[i + 1]) + oldPos.getZ(oldIdx[i + 2])) / 3;
        if (cz >= st.minZ && cz < st.maxZ) {
          stageTriangles.push(oldIdx[i], oldIdx[i + 1], oldIdx[i + 2]);
        }
      }
      if (stageTriangles.length === 0) return;

      const vMap = new Map();
      const newIndices = [];
      const newPos = [];
      const newNorm = [];
      let mnx = Infinity, mny = Infinity, mnz2 = Infinity;
      let mxx = -Infinity, mxy = -Infinity, mxz2 = -Infinity;

      for (let i = 0; i < stageTriangles.length; i += 1) {
        const oldV = stageTriangles[i];
        let newV = vMap.get(oldV);
        if (newV === undefined) {
          newV = vMap.size;
          vMap.set(oldV, newV);
          const x = oldPos.getX(oldV), y = oldPos.getY(oldV), z = oldPos.getZ(oldV);
          newPos.push(x, y, z);
          if (oldNorm) newNorm.push(oldNorm.getX(oldV), oldNorm.getY(oldV), oldNorm.getZ(oldV));
          if (x < mnx) mnx = x; if (x > mxx) mxx = x;
          if (y < mny) mny = y; if (y > mxy) mxy = y;
          if (z < mnz2) mnz2 = z; if (z > mxz2) mxz2 = z;
        }
        newIndices.push(newV);
      }

      const cx = (mnx + mxx) / 2, cy = (mny + mxy) / 2, cz = (mnz2 + mxz2) / 2;
      for (let i = 0; i < newPos.length; i += 3) {
        newPos[i] -= cx; newPos[i + 1] -= cy; newPos[i + 2] -= cz;
      }

      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(newPos, 3));
      if (newNorm.length) g.setAttribute('normal', new THREE.Float32BufferAttribute(newNorm, 3));
      g.setIndex(newIndices.length > 65535 ? new THREE.Uint32BufferAttribute(newIndices, 1) : new THREE.Uint16BufferAttribute(newIndices, 1));
      g.computeBoundingBox();
      g.computeBoundingSphere();

      const newM = new THREE.Mesh(g, m.material);
      newM.name = st.name + ' · ' + m.name;
      newM.position.set(cx, cy, cz);
      src.add(newM);
      finalMeshes.push(newM);
    });
  });

  return finalMeshes;
}

export function loadBabftMapGlb(THREE, opsi = {}) {
  const url = opsi.url || BABFT_MAP_URL;
  const gl = loader();
  if (opsi.dracoLoader) gl.setDRACOLoader(opsi.dracoLoader);

  return gl.loadAsync(url).then((gltf) => {
    const src = gltf.scene || gltf.scenes[0];

    // ── 1) SKALA: paksa ikut simulator (1 block = 2 studs) ──
    // Skala KOMPAK (koreksi user: map asli kegedean) — proporsi tetap, uniform.
    const s = BABFT_MAP_SCALE;
    src.scale.setScalar(s);
    src.updateMatrixWorld(true);

    // ── 2) PUSATKAN POROS & POTONG PART PER-STAGE (bab 183b) ──
    //    Pusatkan pivot tiap mesh ke titik tengah objeknya sendiri agar gizmo
    //    TransformControls muncul tepat di tempat yang diklik, bukan lari ke tengah (0,0,0).
    const meshes = sliceAndCenterMeshes(src, THREE);

    // ── 3) PUSATKAN: hitung bbox SETELAH skala, geser lewat wrapper ──
    const box = new THREE.Box3().setFromObject(src);
    const c = box.getCenter(new THREE.Vector3());

    // ── 4) GROUP WRAPPER: transform (skala sudah di src) + geser terpusat.
    //    Map duduk: X & Z terpusat di 0, dasar Y = 0. ──
    const group = new THREE.Group();
    group.name = 'BabftMapGLB';
    group.add(src);                              // src bawa skala + posisinya
    group.position.set(-c.x, -box.min.y, -c.z);
    group.updateMatrixWorld(true);

    // ── 3b) BBOX AKURAT PER PART ──
    //    ⚠️ GLB ini: SEMUA primitive berbagi SATU accessor POSITION (seluruh map).
    //    Jadi geometry.boundingSphere bawaan = SELURUH MAP (radius ~5238) untuk
    //    tiap part → fokus kamera & ukuran part salah.
    //    FIX: hitung bbox dari INDEX milik part itu sendiri.
    meshes.forEach((m) => {
      try {
        const g = m.geometry;
        const pos = g.attributes.position;
        const idx = g.index;
        if (!pos) return;
        if (idx) {
          const a = idx.array;
          let mnx = Infinity, mny = Infinity, mnz = Infinity;
          let mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
          for (let i = 0; i < a.length; i += 1) {
            const v = a[i] * 3;
            const x = pos.array[v], y = pos.array[v + 1], z = pos.array[v + 2];
            if (x < mnx) mnx = x; if (x > mxx) mxx = x;
            if (y < mny) mny = y; if (y > mxy) mxy = y;
            if (z < mnz) mnz = z; if (z > mxz) mxz = z;
          }
          const bb = new THREE.Box3(
            new THREE.Vector3(mnx, mny, mnz), new THREE.Vector3(mxx, mxy, mxz));
          g.boundingBox = bb;
          g.boundingSphere = bb.getBoundingSphere(new THREE.Sphere());
        } else {
          g.computeBoundingBox(); g.computeBoundingSphere();
        }
      } catch (_) { /* biarkan bawaan */ }
    });

    // ── 4b) material: pakai warna asli GLB; matikan emissive (jebakan J12) ──
    meshes.forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
      m.userData.isBabftProp = true;
      m.userData.isBabftMap = true;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => {
        if (!mat) return;
        if (mat.emissive) mat.emissive.setRGB(0, 0, 0);
        mat.side = THREE.FrontSide;
      });
    });

    // ── 4c) PERMUKAAN AIR + GRID PETAK + BENDERA ──
    // ⚠️ SEMUA ditambahkan sebagai anak `src` dan memakai koordinat STUDS —
    //    src.scale akan mengalikannya otomatis (pelajaran bab 181c: jangan
    //    taruh di `group` karena group punya offset -c → posisi jadi melenceng).
    const srcInfo = BABFT_MAP_SRC;
    const waterStuds = BABFT_WATER.levelStuds;                 // tinggi air (studs)
    const waterGeo = new THREE.PlaneGeometry(srcInfo.size[0] * 1.30, srcInfo.size[2] * 1.06);
    const waterMat = new THREE.MeshStandardMaterial({
      color: BABFT_WATER.color, transparent: true, opacity: BABFT_WATER.opacity,
      roughness: 0.22, metalness: 0.05, side: THREE.DoubleSide,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(srcInfo.bboxMin[0] + srcInfo.size[0] / 2, waterStuds,
                       srcInfo.bboxMin[2] + srcInfo.size[2] / 2);
    water.receiveShadow = true;
    water.userData.isBabftProp = true;
    water.userData.isBabftWater = true;
    water.name = 'BabftWater';
    src.add(water);

    // ── GRID PETAK (pengganti grid lama yang dihapus) + 7 BENDERA TIM ──
    const plotGroup = new THREE.Group();
    plotGroup.name = 'BabftPlots';
    BABFT_PLOT_CENTERS_STUDS.forEach((p) => {
      const tm = BABFT_TEAMS.find((t) => t.key === p.team) || BABFT_TEAMS[0];
      // lantai petak (penanda tim)
      const g = new THREE.PlaneGeometry(p.w, p.l);
      const m = new THREE.MeshBasicMaterial({
        color: tm.color, transparent: true, opacity: 0.42,
        side: THREE.DoubleSide, depthWrite: false,
      });
      const floorY = BABFT_PLOT_FLOOR_Y;
      const plate = new THREE.Mesh(g, m);
      plate.rotation.x = -Math.PI / 2;
      plate.position.set(p.cx, floorY + 1, p.cz);
      plate.userData.isBabftProp = true;
      plate.userData.isBabftPlot = true;
      plate.userData.teamKey = p.team;
      plate.name = 'Plot_' + p.team;
      plotGroup.add(plate);
      // kerangka batas petak (garis tebal) — supaya batas build jelas
      const edges = new THREE.EdgesGeometry(g);
      const frame = new THREE.LineSegments(edges,
        new THREE.LineBasicMaterial({ color: tm.color, transparent: true, opacity: 0.95 }));
      frame.rotation.x = -Math.PI / 2;
      frame.position.set(p.cx, floorY + 1.4, p.cz);
      frame.userData.isBabftProp = true;
      frame.userData.isBabftPlot = true;
      frame.userData.teamKey = p.team;
      frame.name = 'PlotFrame_' + p.team;
      plotGroup.add(frame);

      // tiang + bendera
      const poleH = Math.max(95, p.l * 0.34);
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, poleH, 6),
        new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.7, metalness: 0.1 }));
      pole.position.set(p.cx - p.w / 2 + 10, floorY + poleH / 2, p.cz - p.l / 2 + 10);
      pole.castShadow = true;
      pole.userData.isBabftProp = true;
      pole.userData.isBabftFlag = true;
      pole.userData.teamKey = p.team;
      plotGroup.add(pole);

      const fw = poleH * 0.55, fh = poleH * 0.34;
      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(fw, fh),
        new THREE.MeshStandardMaterial({ color: tm.color, roughness: 0.85, side: THREE.DoubleSide }));
      flag.position.set(pole.position.x + fw / 2, floorY + poleH - fh * 0.6, pole.position.z);
      flag.userData.isBabftProp = true;
      flag.userData.isBabftFlag = true;
      flag.userData.teamKey = p.team;
      flag.name = 'Flag_' + p.team;
      plotGroup.add(flag);
    });
    src.add(plotGroup);

    // ── 5) BBOX final: dari MAP saja (bukan termasuk air/plot) ──
    group.updateMatrixWorld(true);
    const fb = new THREE.Box3().setFromObject(src);
    const fsz = new THREE.Vector3(
      BABFT_MAP_SRC.size[0] * BABFT_MAP_SCALE,
      BABFT_MAP_SRC.size[1] * BABFT_MAP_SCALE,
      BABFT_MAP_SRC.size[2] * BABFT_MAP_SCALE);

    const dispose = () => {
      group.traverse((o) => {
        if (!o.isMesh) return;
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((mt) => mt && mt.dispose && mt.dispose());
      });
    };

    return {
      group,
      dispose,
      bbox: { min: fb.min.toArray(), max: fb.max.toArray(), size: fsz.toArray() },
    };
  });
}

/**
 * TITIK SPAWN per tim (koordinat DUNIA, block).
 * ⚠️ Perintah user: "default statenya adalah pasti terpilih ada di putih dulu,
 *    maka jangan lupa setiap user spawn pasti di tim putih".
 *    → SPAWN_DEFAULT_TEAM = 'white'.
 */
export const SPAWN_DEFAULT_TEAM = 'white';

/**
 * Hitung posisi spawn (dunia) untuk sebuah tim dari group map.
 * @returns {{x:number,y:number,z:number,team:string}}
 */
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

export function babftPlotBounds(group, teamKey, THREE) {
  const p = BABFT_STUDIO_TEAM_PLOTS.find((q) => q.team === teamKey)
         || BABFT_STUDIO_TEAM_PLOTS.find((q) => q.team === SPAWN_DEFAULT_TEAM);
  return {
    x: p.cx,
    y: p.cy,
    z: p.cz,
    halfX: p.w / 2,
    halfY: (p.h || 8000) / 2,
    halfZ: p.l / 2,
    team: p.team
  };
}

export function babftSpawnFor(group, teamKey, threeLib) {
  const p = BABFT_STUDIO_TEAM_PLOTS.find((q) => q.team === teamKey)
         || BABFT_STUDIO_TEAM_PLOTS.find((q) => q.team === SPAWN_DEFAULT_TEAM);
  if (threeLib && typeof threeLib.Vector3 === 'function') return new threeLib.Vector3(p.cx, p.cy + 1, p.cz);
  return new Vector3(p.cx, p.cy + 1, p.cz);
}

/**
 * Posisi KAMERA + target untuk sebuah tim (dipakai Reset Camera).
 * ⚠️ Perintah user: "kalau timnya lagi di white team maka ketika klik reset
 *    camera kameranya teleport ke white team, kalau red team ya red team".
 */
export function babftCameraFor(group, teamKey, threeLib) {
  const p = BABFT_STUDIO_TEAM_PLOTS.find((q) => q.team === teamKey)
         || BABFT_STUDIO_TEAM_PLOTS.find((q) => q.team === SPAWN_DEFAULT_TEAM);
  const makeV3 = (x, y, z) => {
    if (threeLib && typeof threeLib.Vector3 === 'function') return new threeLib.Vector3(x, y, z);
    return new Vector3(x, y, z);
  };
  const target = makeV3(p.cx, 207.0, p.cz); // Titik tengah tepat di lahan tim
  let pos;
  if (p.team === 'white') {
    pos = makeV3(p.cx, 255.0, p.cz - 90.0);
  } else if (p.cx < 0) {
    // Sisi Kiri (Black, Green, Yellow)
    pos = makeV3(p.cx - 80.0, 255.0, p.cz - 70.0);
  } else {
    // Sisi Kanan (Blue, Magenta, Red)
    pos = makeV3(p.cx + 80.0, 255.0, p.cz - 70.0);
  }
  return { pos, target };
}

export default loadBabftMapGlb;
