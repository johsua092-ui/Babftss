/**
 * babftMapBuilder.js — PEMBUAT GEOMETRI MAP "Build a Boat for Treasure" (Three.js)
 * v3 — 2026-09-23
 *
 * Mengubah data terukur di `babftMapData.js` menjadi mesh Three.js untuk
 * dipakai di dalam BlockSimulator3D pada area "babft".
 *
 * LAYOUT (mengikuti pola peta asli hasil ukur: 7 base MENGELILINGI laut tengah):
 *   - LAUT   : bidang air di tengah (pusat peta)
 *   - DARATAN: heightfield naik dari pusat ke tepi (bukit/gunung mengelilingi)
 *   - 7 BASE : duduk DI ATAS daratan pada posisi proporsional hasil ukur
 *   - POHON  : tersebar di daratan (di atas permukaan air)
 *
 * ⚠️ PRINSIP (kontrak Bab 3 ATURAN #5 — UBAH SEKECIL MUNGKIN):
 *   1. SELF-CONTAINED: hanya menerima `THREE`. Tidak menyentuh kode lain.
 *   2. Gagal → return null, pemanggil abaikan (tidak merusak init scene).
 *   3. Idempoten + punya dispose().
 *
 * KINERJA: ~40 mesh + 2 InstancedMesh (v1 1981 mesh → v3 41 draw call).
 */

import {
  BABFT_TEAMS,
  BABFT_PALETTE,
  BABFT_TERRAIN,
  BABFT_WATER,
  BABFT_AREA,
} from './babftMapData.js';

const MARK = '__babftMap';

// Batas wilayah 7 base tim di peta asli (hasil ukur) — untuk menormalkan posisi.
const TEAM_BOUNDS = { minX: -684, maxX: 576, minZ: -654, maxZ: 793 };

// Level & bentuk daratan
const MULAI_DARATAN = 0.35;   // radius ternormalisasi tempat daratan mulai naik
const TINGGI_DASAR = 0.5;     // dasar terrain (di atas ground plane simulator)
const WATER_Y = 1.6;          // permukaan laut

const col = (THREE, rgb) => new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);

/** Tinggi permukaan daratan di titik (x,z) — dipakai terrain, base, & pohon. */
function tinggiTanah(x, z, area) {
  const u = x / (area.sizeX / 2), v = z / (area.sizeZ / 2);
  const r = Math.min(1, Math.sqrt(u * u + v * v));
  const t = Math.max(0, (r - MULAI_DARATAN) / (1 - MULAI_DARATAN));
  const ombak = Math.sin(x * 0.11) * Math.cos(z * 0.13) * 0.18
              + Math.sin(x * 0.27 + z * 0.19) * 0.10;
  const puncak = BABFT_TERRAIN.peakHeight * 0.6;
  return TINGGI_DASAR + Math.pow(t, 1.35) * puncak * (0.78 + ombak);
}

// ─────────────────────────────────────────────────────────────────────────────
// TERRAIN — satu mesh heightfield (flat shading + vertex color)
// ─────────────────────────────────────────────────────────────────────────────
function makeTerrain(THREE, area, matLib) {
  const nx = 76, nz = 60;
  const w = area.sizeX, d = area.sizeZ;
  const pos = [], colArr = [], idx = [];

  for (let i = 0; i <= nx; i++) {
    for (let j = 0; j <= nz; j++) {
      const x = -w / 2 + (i / nx) * w;
      const z = -d / 2 + (j / nz) * d;
      const y = tinggiTanah(x, z, area);
      pos.push(x, y, z);

      // warna: pasir di tepi air → tanah → rumput → rumput terang di puncak
      let c;
      if (y < WATER_Y + 1.0) c = col(THREE, BABFT_PALETTE.sand);
      else if (y < WATER_Y + 6) c = col(THREE, BABFT_PALETTE.dirt);
      else if (y < TINGGI_DASAR + 45) c = col(THREE, BABFT_PALETTE.grassBase);
      else c = col(THREE, BABFT_PALETTE.grassTip);
      colArr.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const a = i * (nz + 1) + j, b = a + 1;
      const c2 = a + (nz + 1), d2 = c2 + 1;
      idx.push(a, c2, b, b, c2, d2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colArr, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, matLib.terrain);
  mesh.name = 'Terrain_Island';
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  mesh.userData.isBabftProp = true;
  return mesh;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAUT — bidang air di tengah (di atas dasar terrain)
// ─────────────────────────────────────────────────────────────────────────────
function makeWater(THREE, area, matLib) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(area.sizeX * 0.97, area.sizeZ * 0.97),
    matLib.water,
  );
  mesh.name = 'Water';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = WATER_Y;
  mesh.userData.isBabftProp = true;
  return mesh;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7 BASE TIM — duduk DI ATAS daratan (tinggi dihitung dari terrain)
// ─────────────────────────────────────────────────────────────────────────────
function makeTeamBases(THREE, area, matLib) {
  const g = new THREE.Group();
  g.name = 'TeamBases';

  const bw = TEAM_BOUNDS.maxX - TEAM_BOUNDS.minX;
  const bd = TEAM_BOUNDS.maxZ - TEAM_BOUNDS.minZ;
  const skala = Math.min((area.sizeX * 0.86) / bw, (area.sizeZ * 0.86) / bd);
  const cx0 = (TEAM_BOUNDS.minX + TEAM_BOUNDS.maxX) / 2;
  const cz0 = (TEAM_BOUNDS.minZ + TEAM_BOUNDS.maxZ) / 2;

  for (const t of BABFT_TEAMS) {
    const bx = (t.center[0] - cx0) * skala;
    const bz = (t.center[2] - cz0) * skala;
    const w = Math.max(8, t.size[0] * skala * 0.7);
    const d = Math.max(8, t.size[2] * skala * 0.7);
    const yTanah = tinggiTanah(bx, bz, area);

    const grp = new THREE.Group();
    grp.name = `Base_${t.name}`;
    grp.position.set(bx, yTanah, bz);

    // platform
    const plat = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, d), matLib[t.name]);
    plat.receiveShadow = true; plat.castShadow = true;
    plat.userData.isBabftProp = true;
    grp.add(plat);

    // 4 tonggak warna spawn tim
    const postGeo = new THREE.BoxGeometry(w * 0.07, 6, d * 0.07);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const p = new THREE.Mesh(postGeo, matLib[`${t.name}_spawn`]);
      p.position.set(sx * (w / 2 - w * 0.04), 3, sz * (d / 2 - d * 0.04));
      p.castShadow = true;
      p.userData.isBabftProp = true;
      grp.add(p);
    }
    g.add(grp);
  }
  return g;
}

// ─────────────────────────────────────────────────────────────────────────────
// POHON — 2 InstancedMesh (batang + kanopi), hanya di daratan
// ─────────────────────────────────────────────────────────────────────────────
function makeTrees(THREE, area, matLib, jumlah = 60) {
  const g = new THREE.Group();
  g.name = 'Trees';

  const batangGeo = new THREE.BoxGeometry(0.8, 3.4, 0.8);
  const kanopiGeo = new THREE.BoxGeometry(3.0, 1.1, 3.0);
  const batang = new THREE.InstancedMesh(batangGeo, matLib.wood, jumlah);
  const kanopi = new THREE.InstancedMesh(kanopiGeo, matLib.leaf, jumlah * 5);
  batang.castShadow = true; kanopi.castShadow = true;
  batang.name = 'TreeTrunks'; kanopi.name = 'TreeLeaves';

  const m = new THREE.Matrix4();
  let ki = 0, pohonKe = 0;
  for (let i = 0; i < jumlah * 3 && pohonKe < jumlah; i++) {
    const a = (i * 2.399963) % (Math.PI * 2);              // sudut emas
    const rad = 0.42 + 0.52 * (((i * 37) % 19) / 19);      // di zona daratan
    const x = Math.cos(a) * (area.sizeX / 2) * rad;
    const z = Math.sin(a) * (area.sizeZ / 2) * rad;
    const y0 = tinggiTanah(x, z, area);
    if (y0 < WATER_Y + 2) continue;                        // jangan di air

    m.makeTranslation(x, y0 + 1.7, z);
    batang.setMatrixAt(pohonKe, m);
    for (let k = 0; k < 5; k++) {
      m.makeTranslation(x, y0 + 3.4 + k * 0.85, z);
      kanopi.setMatrixAt(ki++, m);
    }
    pohonKe++;
  }
  batang.count = pohonKe;
  kanopi.count = ki;
  batang.instanceMatrix.needsUpdate = true;
  kanopi.instanceMatrix.needsUpdate = true;
  g.add(batang, kanopi);
  return g;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATERIAL — sekali buat, di-share
// ─────────────────────────────────────────────────────────────────────────────
function makeMaterials(THREE) {
  const P = BABFT_PALETTE;
  const std = (rgb, opts = {}) => new THREE.MeshStandardMaterial({
    color: col(THREE, rgb), metalness: 0, roughness: 0.9, ...opts,
  });
  const M = {};
  M.terrain = new THREE.MeshStandardMaterial({
    vertexColors: true, metalness: 0, roughness: 0.95, flatShading: true,
  });
  M.water = new THREE.MeshStandardMaterial({
    color: col(THREE, P.water), transparent: true, opacity: 0.75,
    metalness: 0.2, roughness: 0.12,
  });
  M.wood = std(P.wood);
  M.leaf = std(P.leaf);
  M.netral = std([148, 163, 184]);
  for (const t of BABFT_TEAMS) {
    M[t.name] = std(t.accent);
    M[`${t.name}_spawn`] = std(t.spawn);
  }
  return M;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNGSI UTAMA
// ─────────────────────────────────────────────────────────────────────────────
export function buildBabftMap(THREE, opsi = {}) {
  if (!THREE || !THREE.Group || !THREE.BoxGeometry) return null;
  try {
    const area = opsi.area || BABFT_AREA;
    const matLib = makeMaterials(THREE);

    const root = new THREE.Group();
    root.name = 'BabftMap';
    root.userData[MARK] = true;

    root.add(makeTerrain(THREE, area, matLib));
    root.add(makeWater(THREE, area, matLib));
    root.add(makeTeamBases(THREE, area, matLib));
    root.add(makeTrees(THREE, area, matLib, opsi.trees ?? 60));

    let meshes = 0, tris = 0, instanced = 0;
    root.traverse((n) => {
      if (n.isInstancedMesh) instanced++;
      if (n.isMesh) {
        meshes++;
        const gg = n.geometry;
        if (gg && gg.index) tris += gg.index.count / 3;
        else if (gg && gg.attributes && gg.attributes.position) tris += gg.attributes.position.count / 3;
      }
    });
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3(); box.getSize(size);
    root.userData.stats = {
      meshes, instanced, triangles: Math.round(tris),
      sizeX: +size.x.toFixed(2), sizeY: +size.y.toFixed(2), sizeZ: +size.z.toFixed(2),
      waterY: WATER_Y,
    };

    root.userData.dispose = () => {
      const geo = new Set(), mat = new Set();
      root.traverse((n) => {
        if (n.isMesh || n.isInstancedMesh) {
          if (n.geometry) geo.add(n.geometry);
          if (n.material) mat.add(n.material);
        }
      });
      geo.forEach((x) => x.dispose && x.dispose());
      mat.forEach((x) => x.dispose && x.dispose());
      if (root.parent) root.parent.remove(root);
      root.clear();
    };

    return root;
  } catch (e) {
    console.warn('[babftMapBuilder] gagal membangun map:', e);
    return null;
  }
}

export default buildBabftMap;
