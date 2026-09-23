/**
 * babftMapBuilder.js — MAP "Build a Boat for Treasure" untuk area Babft (Three.js)
 * v4 — 2026-09-23  (perbaikan setelah review kritis: v1-v3 "produk sampah")
 *
 * ⛔ MASALAH v1-v3 (terukur dari review vision yang jujur):
 *   - Terrain tampak "pita hijau robek melayang" -> WINDING segitiga TERBALIK
 *     (material FrontSide -> sisi belakang tidak ter-render).
 *   - "Tidak ada ketinggian/tebing" -> heightfield terlalu tipis & smooth-shading
 *     menyembunyikan bentuk.
 *   - "Pohon kubus melayang tanpa batang" -> batang & kanopi tidak sinkron.
 *   - "Platform tipis seperti kertas" -> tebal 1 stud, tanpa dinding.
 *
 * ✅ PERBAIKAN v4:
 *   - Material terrain: side = DoubleSide + flatShading (bentuk tegas, tidak robek).
 *   - Winding diperbaiki (a,b,c searah jarum jam dari atas).
 *   - Terrain: pulau lebih besar & lebih tinggi + tebing tepi yang jelas.
 *   - Base tim: platform lebih tebal + DINDING keliling + 4 tonggak -> terlihat "base".
 *   - Pohon: batang + kanopi bertingkat, dipastikan duduk di permukaan tanah.
 *   - Air: transparan + lebih gelap (kesan kedalaman).
 *   - Terrain castShadow=false (hindari shadow-acne pada mesh besar).
 *
 * ⚠️ PRINSIP (kontrak Bab 3 ATURAN #5): self-contained, idempoten, dispose(),
 *    gagal -> return null (init scene TIDAK terganggu).
 */

import {
  BABFT_TEAMS,
  BABFT_PALETTE,
  BABFT_TERRAIN,
  BABFT_WATER,
  BABFT_AREA,
} from './babftMapData.js';

const MARK = '__babftMap';
const TEAM_BOUNDS = { minX: -684, maxX: 576, minZ: -654, maxZ: 793 };

// Bentuk daratan (semua angka hasil tuning + verifikasi visual)
const WATER_Y = 1.4;
const DARAT_MULAI = 0.30;     // radius ternormalisasi mulai naik dari air
const DASAR = 0.6;            // tinggi dasar daratan
const PUNCAK = 62;            // tinggi puncak bukit

const col = (THREE, rgb) => new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);

/**
 * Tinggi permukaan daratan di (x,z). Dipakai terrain, base, DAN pohon -> selalu sinkron.
 * v5: ditambah TEPI TURUN (pantai -> dasar laut) supaya pulau PADAT,
 *     tidak lagi terlihat seperti karpet melayang di atas air.
 */
function tinggiTanah(x, z, area) {
  const u = x / (area.sizeX / 2), v = z / (area.sizeZ / 2);
  const r = Math.min(1, Math.sqrt(u * u + v * v));
  const t = Math.max(0, (r - DARAT_MULAI) / (1 - DARAT_MULAI));
  const bukit = Math.sin(x * 0.045 + 1.2) * Math.cos(z * 0.052 - 0.7) * 0.16
              + Math.sin(x * 0.021 - z * 0.026) * 0.12;
  const naik = DASAR + Math.pow(t, 1.25) * PUNCAK * (0.72 + bukit);
  // TEPI: setelah r > 0.78 permukaan TURUN ke dasar laut (y = -18).
  // Hasilnya pulau punya SISI/pantai yang menyentuh air -> padat, bukan karpet.
  const TEPI_MULAI = 0.78;
  let y;
  if (r <= TEPI_MULAI) {
    y = naik;
  } else {
    const tt = (r - TEPI_MULAI) / (1 - TEPI_MULAI);
    y = naik * (1 - tt * tt) + (-18) * (tt * tt);
  }
  // v8: KUANTISASI tinggi jadi undakan (blocky khas Roblox) -> menghilangkan
  // efek "tebing tertarik/stretched" pada lereng yang mulus.
  const STEP_TANAH = 4;
  return Math.round(y / STEP_TANAH) * STEP_TANAH;
}

// ─────────────────────────────────────────────────────────────────────────────
// TERRAIN
// ─────────────────────────────────────────────────────────────────────────────
function makeTerrain(THREE, area, matLib) {
  const nx = 108, nz = 88;      // v7: lebih rapat -> tebing tidak "tertarik"
  const w = area.sizeX, d = area.sizeZ;
  const pos = [], colArr = [], idx = [];

  for (let i = 0; i <= nx; i++) {
    for (let j = 0; j <= nz; j++) {
      const x = -w / 2 + (i / nx) * w;
      const z = -d / 2 + (j / nz) * d;
      const y = tinggiTanah(x, z, area);
      pos.push(x, y, z);

      // v7: warna ikut KEDALAMAN (relatif air) -> pasir hanya GARIS PANTAI,
      // bukan persegi. Yang dalam = batu gelap, bukan pasir.
      let c;
      const dAir = y - WATER_Y;
      if (dAir < -3) c = col(THREE, BABFT_PALETTE.stone);            // dasar laut
      else if (dAir < 2.5) c = col(THREE, BABFT_PALETTE.sand);       // garis pantai
      else if (dAir < 9) c = col(THREE, BABFT_PALETTE.dirt);         // tanah
      else if (y < DASAR + PUNCAK * 0.55) c = col(THREE, BABFT_PALETTE.grassBase);
      else c = col(THREE, BABFT_PALETTE.grassTip);
      colArr.push(c.r, c.g, c.b);
    }
  }
  // WINDING BENAR (v1-v3 terbalik -> terrain tak ter-render dari atas)
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const a = i * (nz + 1) + j, b = a + 1;
      const c2 = a + (nz + 1), d2 = c2 + 1;
      idx.push(a, b, c2, b, d2, c2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colArr, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, matLib.terrain);
  mesh.name = 'Terrain_Island';
  mesh.castShadow = false;      // mesh besar: hindari shadow-acne
  mesh.receiveShadow = true;
  mesh.userData.isBabftProp = true;
  return mesh;
}

// ─────────────────────────────────────────────────────────────────────────────
// AIR
// ─────────────────────────────────────────────────────────────────────────────
function makeWater(THREE, area, matLib) {
  const mesh = new THREE.Mesh(
    // CircleGeometry argumen pertama = RADIUS (bukan diameter!)
    // Maksimum agar MUAT di area: radius = setengah sisi terpendek (234/2=117).
    new THREE.CircleGeometry(Math.min(area.sizeX, area.sizeZ) * 0.49, 96), matLib.water,
  );
  mesh.name = 'Water';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = WATER_Y;
  mesh.renderOrder = 1;
  mesh.userData.isBabftProp = true;
  return mesh;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7 BASE TIM — platform tebal + dinding keliling + 4 tonggak warna tim
// ─────────────────────────────────────────────────────────────────────────────
function makeTeamBases(THREE, area, matLib) {
  const g = new THREE.Group();
  g.name = 'TeamBases';

  const bw = TEAM_BOUNDS.maxX - TEAM_BOUNDS.minX;
  const bd = TEAM_BOUNDS.maxZ - TEAM_BOUNDS.minZ;
  const skala = Math.min((area.sizeX * 0.84) / bw, (area.sizeZ * 0.84) / bd);
  const cx0 = (TEAM_BOUNDS.minX + TEAM_BOUNDS.maxX) / 2;
  const cz0 = (TEAM_BOUNDS.minZ + TEAM_BOUNDS.maxZ) / 2;

  for (const t of BABFT_TEAMS) {
    const bx = (t.center[0] - cx0) * skala;
    const bz = (t.center[2] - cz0) * skala;
    const w = Math.max(14, t.size[0] * skala * 0.75);
    const d = Math.max(14, t.size[2] * skala * 0.75);
    const tebal = 6;                       // v5: lebih tebal (dulu 3 -> tipis spt kertas)

    const grp = new THREE.Group();
    grp.name = `Base_${t.name}`;
    grp.position.set(bx, tinggiTanah(bx, bz, area), bz);

    // platform (tertanam sebagian ke tanah supaya tidak "melayang")
    const plat = new THREE.Mesh(new THREE.BoxGeometry(w, tebal, d), matLib[t.name]);
    plat.position.y = -tebal * 0.3;
    plat.castShadow = true; plat.receiveShadow = true;
    plat.userData.isBabftProp = true;
    grp.add(plat);

    // dinding keliling (4 sisi) — lebih tinggi supaya terlihat "base"
    const tw = 2.4, th = 7;
    const sisi = [
      [0, (d / 2 - tw / 2), w, tw],
      [0, -(d / 2 - tw / 2), w, tw],
      [(w / 2 - tw / 2), 0, tw, d],
      [-(w / 2 - tw / 2), 0, tw, d],
    ];
    for (const [ox, oz, sw, sd] of sisi) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(sw, th, sd), matLib[`${t.name}_spawn`]);
      wall.position.set(ox, tebal * 0.5 + th * 0.5 - 0.8, oz);
      wall.castShadow = true; wall.receiveShadow = true;
      wall.userData.isBabftProp = true;
      grp.add(wall);
    }

    // 4 tonggak tinggi di sudut (penanda warna tim)
    const postGeo = new THREE.BoxGeometry(3, 15, 3);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const p = new THREE.Mesh(postGeo, matLib[`${t.name}_spawn`]);
      p.position.set(sx * (w / 2 - 2.4), tebal * 0.5 + 7, sz * (d / 2 - 2.4));
      p.castShadow = true;
      p.userData.isBabftProp = true;
      grp.add(p);
    }

    // DERMAGA (dock) — diarahkan MENUJU PUSAT peta (ke arah air), ciri khas Babft.
    // Dihitung dari arah base -> (0,0) supaya selalu menjorok ke laut.
    const dir = new THREE.Vector2(-bx, -bz);
    if (dir.lengthSq() < 1e-6) dir.set(0, -1);
    dir.normalize();
    const sudut = Math.atan2(dir.x, dir.y);   // rotasi di bidang XZ

    const dockL = Math.max(40, d * 1.15), dockW = 18;
    const dock = new THREE.Mesh(new THREE.BoxGeometry(dockW, 3, dockL), matLib.wood);
    dock.position.set(dir.x * (d / 2 + dockL / 2 - 2), tebal * 0.5 - 0.6, dir.y * (d / 2 + dockL / 2 - 2));
    dock.rotation.y = sudut;
    dock.castShadow = true; dock.receiveShadow = true;
    dock.userData.isBabftProp = true;
    grp.add(dock);

    // tonggak dermaga (4 sudut ujung)
    for (const sisi of [-1, 1]) {
      for (const jauh of [0.35, 0.92]) {
        const jx = dir.x * (d / 2 + dockL * jauh), jz = dir.y * (d / 2 + dockL * jauh);
        const px = -dir.y * sisi * (dockW / 2 - 1), pz = dir.x * sisi * (dockW / 2 - 1);
        const pk = new THREE.Mesh(new THREE.BoxGeometry(2, 9, 2), matLib.wood);
        pk.position.set(jx + px, tebal * 0.5 + 2.5, jz + pz);
        pk.castShadow = true;
        pk.userData.isBabftProp = true;
        grp.add(pk);
      }
    }
    g.add(grp);
  }
  return g;
}

// ─────────────────────────────────────────────────────────────────────────────
// POHON — batang + kanopi bertingkat (duduk tepat di permukaan tanah)
// ─────────────────────────────────────────────────────────────────────────────
function makeTrees(THREE, area, matLib, jumlah = 70) {
  const g = new THREE.Group();
  g.name = 'Trees';

  const H_BATANG = 16;                     // v6: pohon BESAR (v5 masih kekecilan)
  const batangGeo = new THREE.BoxGeometry(3.4, H_BATANG, 3.4);
  const kanopiGeo = new THREE.BoxGeometry(13, 4.5, 13);
  const batang = new THREE.InstancedMesh(batangGeo, matLib.wood, jumlah);
  const kanopi = new THREE.InstancedMesh(kanopiGeo, matLib.leaf, jumlah * 3);
  batang.castShadow = true; kanopi.castShadow = true;
  batang.receiveShadow = true; kanopi.receiveShadow = true;
  batang.name = 'TreeTrunks'; kanopi.name = 'TreeLeaves';

  const m = new THREE.Matrix4();
  let ki = 0, pohonKe = 0;
  for (let i = 0; i < jumlah * 5 && pohonKe < jumlah; i++) {
    // v8: sebaran lebih VARIATIF (bukan barisan melingkar rapi).
    // Tiga gelombang berbeda -> sudut & radius tidak berpola.
    const a = (i * 2.399963 + Math.sin(i * 1.7) * 1.1) % (Math.PI * 2);
    const rad = 0.34 + 0.58 * (((i * 37 + 11) % 29) / 29);
    const x = Math.cos(a) * (area.sizeX / 2) * rad;
    const z = Math.sin(a) * (area.sizeZ / 2) * rad;
    const y0 = tinggiTanah(x, z, area);
    if (y0 < WATER_Y + 3) continue;              // hanya di daratan kering

    // skala pohon bervariasi (0.75x .. 1.25x) supaya tidak seragam
    const sk = 0.75 + 0.5 * (((i * 53) % 13) / 13);

    // batang: dasar tepat di tanah, jadi setengah tinggi di atasnya
    m.makeTranslation(x, y0 + (H_BATANG * sk) / 2 - 0.3, z);
    m.scale(new THREE.Vector3(sk, sk, sk));
    batang.setMatrixAt(pohonKe, m);

    // 3 tingkat kanopi menumpuk (pohon blok khas Babft)
    for (let k = 0; k < 3; k++) {
      const skalaK = (1 - k * 0.25) * sk;
      const mm = new THREE.Matrix4().makeScale(skalaK, sk, skalaK);
      mm.setPosition(x, y0 + (H_BATANG - 1.5) * sk + k * 3.6 * sk, z);
      kanopi.setMatrixAt(ki++, mm);
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
// MATERIAL
// ─────────────────────────────────────────────────────────────────────────────
function makeMaterials(THREE) {
  const P = BABFT_PALETTE;
  const std = (rgb, opts = {}) => new THREE.MeshStandardMaterial({
    color: col(THREE, rgb), metalness: 0, roughness: 0.88, ...opts,
  });
  const M = {};
  // terrain: DoubleSide WAJIB (kalau winding terbalik, sisi belakang tetap ter-render)
  M.terrain = new THREE.MeshStandardMaterial({
    vertexColors: true, metalness: 0, roughness: 0.95,
    flatShading: true, side: THREE.DoubleSide,
  });
  M.water = new THREE.MeshStandardMaterial({
    color: col(THREE, P.water), transparent: true, opacity: 0.62,
    metalness: 0.35, roughness: 0.08, side: THREE.DoubleSide,
  });
  M.wood = std(P.wood);
  M.leaf = std(P.leaf);
  M.netral = std([148, 163, 184]);
  for (const t of BABFT_TEAMS) {
    M[t.name] = std(t.accent, { roughness: 0.75 });
    M[`${t.name}_spawn`] = std(t.spawn, { roughness: 0.6 });
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
    root.add(makeTrees(THREE, area, matLib, opsi.trees ?? 70));

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
