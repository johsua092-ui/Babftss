/**
 * babftMapObj.js — MAP "Build A boat" dari EXPORT ASLI ROBLOX STUDIO (bab 189)
 *
 * Sumber : babft.obj (191 MB) + babft.mtl — hasil Export Selection Studio
 *          → 32.707 OBJEK LENGKAP (Part, Grasspart, Leaves, Wedge, Water, ...)
 *          → vertex sudah dalam koordinat dunia (tanpa transform dobel)
 *          → bbox 1419 × 620 × 10362 studs = SELURUH MAP
 * Konversi: babft_obj.bin (32 MB) via conv_obj.py
 *
 * ⚠️ KEPUTUSAN USER (2026-10-13):
 *   - Warna: SOLID dari MTL (Kd), bukan tekstur
 *   - Objek: 32.707 TERPISAH (bisa diedit per objek) — lag DITERIMA
 *   - Lancip tetap lancip (Leaves/Wedge asli), skala 1 block = 2 studs
 *   - PUSAT TIAP PART DIPUSATKAN KE GEOMETRINYA:
 *     Tiap mesh punya local (0,0,0) di tengah part, dan position di titik dunia.
 *     → Gizmo TransformControls menancap TEPAT di atas part yang diklik.
 */
import * as T from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

if (T && T.BufferGeometry && T.Mesh) {
  T.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  T.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  T.Mesh.prototype.raycast = acceleratedRaycast;
}

import { fetchMapResumable } from './babftMapCache.js';

export const BABFT_OBJ_STUDS_PER_BLOCK = 2.0;

export async function loadBabftMapObj(url = '/maps/babft_obj.bin', onProgress) {
  // ── UNDUHAN BISA DILANJUTKAN (permintaan user 2026-10-22) ──
  // File ±33 MB. Kalau user keluar / tutup tab di tengah unduhan, progres
  // TIDAK hilang: potongan disimpan di IndexedDB dan unduhan dilanjutkan
  // pakai HTTP Range saat user masuk lagi. Berlaku untuk SEMUA user
  // (guest maupun login) karena murni di sisi browser, tanpa auth.
  const buf = await fetchMapResumable(url, onProgress);
  const dv = new DataView(buf);
  const magic = String.fromCharCode(...new Uint8Array(buf, 0, 8));
  if (magic !== 'BABFTOBJ') throw new Error('Bukan format BABFTOBJ');
  let o = 8;
  const nObj = dv.getUint32(o, true); o += 4;
  const nMat = dv.getUint32(o, true); o += 4;
  const spb = dv.getFloat32(o, true); o += 4;

  // palet material
  const palet = [];
  for (let i = 0; i < nMat; i++) {
    palet.push([dv.getFloat32(o, true), dv.getFloat32(o + 4, true), dv.getFloat32(o + 8, true)]);
    o += 12;
  }

  // material bersama (warna per objek lewat .color)
  const matCache = new Map();
  const getMat = (rgb) => {
    const k = rgb[0].toFixed(3) + '_' + rgb[1].toFixed(3) + '_' + rgb[2].toFixed(3);
    let m = matCache.get(k);
    if (!m) {
      m = new T.MeshLambertMaterial({ color: new T.Color(rgb[0], rgb[1], rgb[2]) });
      matCache.set(k, m);
    }
    return m;
  };

  const group = new T.Group();
  group.name = 'BabftMapOBJ';
  const objs = [];             // { mesh, name, mi }
  const dec = new TextDecoder();
  let tris = 0;
  const box = new T.Box3();
  let first = true;
  const occupiedBoxes = new Map();

  for (let i = 0; i < nObj; i++) {
    const nameLen = dv.getUint8(o); o += 1;
    const mi = dv.getUint16(o, true); o += 2;
    const name = nameLen ? dec.decode(new Uint8Array(buf, o, nameLen)) : ('obj' + i);
    o += nameLen;
    o += (4 - ((3 + nameLen) % 4)) % 4;   // padding (float32 harus sejajar)
    const nv = dv.getUint32(o, true); o += 4;
    const ni = dv.getUint32(o, true); o += 4;
    const pos = new Float32Array(buf, o, nv * 3); o += nv * 12;
    const idx = new Uint32Array(buf, o, ni); o += ni * 4;

    // Hitung pusat part
    let mnx = Infinity, mny = Infinity, mnz = Infinity;
    let mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
    for (let vi = 0; vi < nv * 3; vi += 3) {
      const x = pos[vi], y = pos[vi + 1], z = pos[vi + 2];
      if (x < mnx) mnx = x; if (x > mxx) mxx = x;
      if (y < mny) mny = y; if (y > mxy) mxy = y;
      if (z < mnz) mnz = z; if (z > mxz) mxz = z;
    }
    const cx = (mnx + mxx) / 2;
    const cy = (mny + mxy) / 2;
    const cz = (mnz + mxz) / 2;

    // Geser vertex agar lokal (0, 0, 0) berada di tengah part
    const localPos = new Float32Array(nv * 3);
    for (let vi = 0; vi < nv * 3; vi += 3) {
      localPos[vi] = pos[vi] - cx;
      localPos[vi + 1] = pos[vi + 1] - cy;
      localPos[vi + 2] = pos[vi + 2] - cz;
    }

    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(localPos, 3));
    g.setIndex(new T.BufferAttribute(idx, 1));
    g.computeVertexNormals();
    g.computeBoundingBox();
    g.computeBoundingSphere();

    const sx = mxx - mnx;
    const sy = mxy - mny;
    const sz = mxz - mnz;

    // ── ANTI Z-FIGHTING / DECAL LIFT & NUDGE ──
    // 1) Part stiker / pelat tipis (tebal < 0.05 studs) diangkat 0.02 studs agar berada di atas permukaan
    const isThin = (sy < 0.05 || sx < 0.05 || sz < 0.05);
    let liftX = 0, liftY = 0, liftZ = 0;
    if (isThin) {
      if (sy < 0.05) liftY = 0.02;
      else if (sz < 0.05) liftZ = 0.02;
      else if (sx < 0.05) liftX = 0.02;
    }

    // 2) Deteksi part kembar tumpang tindih 100%: part kedua mengalah (nudge 0.01 studs)
    const boxKey = `${cx.toFixed(2)}_${cy.toFixed(2)}_${cz.toFixed(2)}_${sx.toFixed(2)}_${sy.toFixed(2)}_${sz.toFixed(2)}`;
    let nudgeY = 0, nudgeZ = 0;
    if (occupiedBoxes.has(boxKey)) {
      const c = occupiedBoxes.get(boxKey);
      occupiedBoxes.set(boxKey, c + 1);
      nudgeY = 0.01 * c;
      nudgeZ = 0.01 * c;
    } else {
      occupiedBoxes.set(boxKey, 1);
    }

    let mat = getMat(palet[mi] || [0.7, 0.7, 0.7]);
    if (isThin) {
      mat = mat.clone();
      mat.polygonOffset = true;
      mat.polygonOffsetFactor = -1.0;
      mat.polygonOffsetUnits = -4.0;
    }

    const m = new T.Mesh(g, mat);
    m.name = name;
    m.position.set(cx + liftX, cy + liftY + nudgeY, cz + liftZ + nudgeZ);
    m.userData.babft = { name, materialIndex: mi, editable: true };
    m.userData.isBabftMap = true;
    m.userData.isBabftProp = true;
    m.matrixAutoUpdate = false;
    m.updateMatrix();
    m.castShadow = false; m.receiveShadow = false;
    group.add(m);
    objs.push(m);

    if (first) {
      box.set(new T.Vector3(mnx, mny, mnz), new T.Vector3(mxx, mxy, mxz));
      first = false;
    } else {
      box.expandByPoint(new T.Vector3(mnx, mny, mnz));
      box.expandByPoint(new T.Vector3(mxx, mxy, mxz));
    }
    tris += ni / 3;
    if (onProgress && (i % 5000 === 0)) onProgress({ done: i, total: nObj });
  }
  if (onProgress) onProgress({ done: nObj, total: nObj });

  // ── LAHAN HIJAU TIM HITAM (Bases7) ──
  // Sumber asli export Roblox Studio tidak sengaja melewatkan Bases7 pada koordinat (-275.6, 409, -4467.6)
  // padahal 6 tim lainnya memiliki Bases1..Bases6.
  // Tambahkan Bases7 dengan geometri & material identik dari sisi seberang (Bases3) agar lahan hijau Tim Hitam utuh!
  const b3 = objs.find((o) => o.name === 'Bases3');
  if (b3 && b3.geometry && !objs.some((o) => o.name === 'Bases7')) {
    const oldPos = b3.geometry.attributes.position.array;
    const oldIdx = b3.geometry.index.array;
    const newPos = new Float32Array(oldPos.length);
    for (let vi = 0; vi < oldPos.length; vi += 3) {
      newPos[vi] = -oldPos[vi];
      newPos[vi + 1] = oldPos[vi + 1];
      newPos[vi + 2] = oldPos[vi + 2];
    }
    const newIdx = new Uint32Array(oldIdx.length);
    for (let vi = 0; vi < oldIdx.length; vi += 3) {
      newIdx[vi] = oldIdx[vi];
      newIdx[vi + 1] = oldIdx[vi + 2];
      newIdx[vi + 2] = oldIdx[vi + 1];
    }
    const g7 = new T.BufferGeometry();
    g7.setAttribute('position', new T.BufferAttribute(newPos, 3));
    g7.setIndex(new T.BufferAttribute(newIdx, 1));
    g7.computeVertexNormals();
    g7.computeBoundingBox();
    g7.computeBoundingSphere();

    const m7 = new T.Mesh(g7, b3.material);
    m7.name = 'Bases7';
    m7.position.set(-b3.position.x, b3.position.y, b3.position.z);
    m7.userData.babft = { name: 'Bases7', editable: true };
    m7.userData.isBabftMap = true;
    m7.userData.isBabftProp = true;
    m7.matrixAutoUpdate = false;
    m7.updateMatrix();
    m7.castShadow = false;
    m7.receiveShadow = false;
    group.add(m7);
    objs.push(m7);
  }

  // pusatkan + skala (1 block = 2 studs)
  const ctr = new T.Vector3();
  box.getCenter(ctr);
  const scale = 1 / spb;
  group.position.set(-ctr.x * scale, -box.min.y * scale, -ctr.z * scale);
  group.scale.setScalar(scale);
  group.updateMatrixWorld(true);

  const size = new T.Vector3().subVectors(box.max, box.min).multiplyScalar(scale);

  return {
    group, objects: objs,
    stats: {
      nObj, nMaterial: nMat, triangles: Math.round(tris),
      sizeStuds: { x: box.max.x - box.min.x, y: box.max.y - box.min.y, z: box.max.z - box.min.z },
      sizeBlock: { x: size.x, y: size.y, z: size.z },
      studsPerBlock: spb,
    },
  };
}

export function disposeBabftMapObj(group) {
  if (!group) return;
  group.traverse((ch) => {
    if (ch.isMesh) { ch.geometry?.dispose?.(); }
  });
}


export async function loadBabftMapMerged(url = '/maps/babft_obj.bin', onProgress) {
  if (onProgress) onProgress({ done: 0, total: 32708, stage: 'Menyiapkan...' });
  const base = await loadBabftMapObj(url, (p) => {
    if (onProgress) {
      onProgress({
        done: p.done,
        total: p.total,
        stage: p.stage || 'Mengunduh map',
        bytes: !!p.bytes,
      });
    }
  });
  const objs = base.objects;

  if (onProgress) onProgress({ done: 0, total: objs.length, stage: 'Menggabungkan part jadi 1 mesh (1 draw call, 60 FPS mentok)...' });

  // Bake warna asli tiap part ke attribute 'color' vertex geometry
  const allGeos = [];
  for (let i = 0; i < objs.length; i++) {
    // Progress per-part (permintaan user): tahap gabung butuh waktu &
    // sebelumnya bar DIAM total di 0% → terlihat seperti hang.
    if (onProgress && (i % 500 === 0)) {
      onProgress({
        done: i,
        total: objs.length,
        stage: 'Menggabungkan part jadi 1 mesh (1 draw call, 60 FPS mentok)...',
      });
    }
    const mesh = objs[i];
    const c = mesh.material.color;
    const g = mesh.geometry.clone();
    mesh.updateMatrix();
    g.applyMatrix4(mesh.matrix);

    const count = g.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let vi = 0; vi < count; vi++) {
      colors[vi * 3] = c.r;
      colors[vi * 3 + 1] = c.g;
      colors[vi * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(colors, 3));
    allGeos.push(g);
  }

  // Gabungkan seluruh 32.708 part menjadi TEPAT 1 MESH UTUH
  const singleGeo = BufferGeometryUtils.mergeGeometries(allGeos, false);
  singleGeo.computeVertexNormals();
  singleGeo.computeBoundingBox();
  singleGeo.computeBoundingSphere();
  try {
    singleGeo.computeBoundsTree({ maxDepth: 45 });
  } catch (e) {
    console.warn('[BVH] computeBoundsTree warning:', e);
  }

  // Bersihkan semua geometri sementara dari VRAM
  allGeos.forEach((g) => { if (g && g.dispose) g.dispose(); });
  objs.forEach((o) => { if (o.geometry && o.geometry.dispose) o.geometry.dispose(); });

  const singleMat = new T.MeshLambertMaterial({
    vertexColors: true,
    toneMapped: true,
  });

  const singleMesh = new T.Mesh(singleGeo, singleMat);
  singleMesh.name = 'BabftMap_SingleMesh';
  singleMesh.userData.babft = { name: 'BabftMap_SingleMesh', editable: false };
  singleMesh.userData.isBabftMap = true;
  singleMesh.userData.isBabftProp = true;
  singleMesh.castShadow = false;
  singleMesh.receiveShadow = false;
  singleMesh.frustumCulled = true;
  singleMesh.matrixAutoUpdate = false;
  singleMesh.updateMatrix();

  const mergedGroup = new T.Group();
  mergedGroup.name = 'BabftMapMerged';
  mergedGroup.add(singleMesh);

  mergedGroup.position.copy(base.group.position);
  mergedGroup.scale.copy(base.group.scale);
  mergedGroup.updateMatrixWorld(true);

  return {
    group: mergedGroup,
    objects: [singleMesh],
    stats: {
      ...base.stats,
      mergedCount: 1,
      drawCalls: 1,
    },
  };
}
