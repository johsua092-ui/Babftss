/**
 * babftMapGltf.js — MAP "Build A boat" dari EXPORT ASLI ROBLOX STUDIO (bab 188)
 *
 * Sumber : babft.gltf (15 MB) hasil File → Export Selection dari Roblox Studio
 *          → 286 MESH UNIK + 31.867 NODE (instanced) + warna per part
 * Konversi: babft_map.bin (1,90 MB) via conv_gltf2.py
 *
 * ⚠️ ATURAN USER (J121/J123/J124):
 *   - LAG BOLEH, DOWNGRADE TIDAK. Semua bentuk ASLI (tabung, bola, baji, mesh).
 *   - Lancip tetap lancip. TIDAK BOLEH jadikan kotak.
 *   - Skala DIPAKSA ikut app: 1 block = 2 studs (STUDS_PER_BLOCK = 2).
 */
import * as T from 'three';

export const BABFT_STUDS_PER_BLOCK = 2.0;

/** muat + parse babft_map.bin → { meshes, nodes, group } */
export async function loadBabftMapGltf(url = '/maps/babft_map.bin', onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal memuat ' + url + ' (HTTP ' + res.status + ')');
  const buf = await res.arrayBuffer();
  const dv = new DataView(buf);
  const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3),
    dv.getUint8(4), dv.getUint8(5), dv.getUint8(6), dv.getUint8(7));
  if (magic !== 'BABFTMAP') throw new Error('File map bukan format BABFTMAP');
  let o = 8;
  const nMesh = dv.getUint32(o, true); o += 4;
  const nNode = dv.getUint32(o, true); o += 4;
  const spb = dv.getFloat32(o, true); o += 4;

  // ---- baca mesh ----
  const geos = [];
  for (let i = 0; i < nMesh; i++) {
    const nv = dv.getUint32(o, true); o += 4;
    const ni = dv.getUint32(o, true); o += 4;
    const cr = dv.getUint8(o), cg = dv.getUint8(o + 1), cb = dv.getUint8(o + 2); o += 4;
    const pos = new Float32Array(buf, o, nv * 3); o += nv * 12;
    const nor = new Float32Array(buf, o, nv * 3); o += nv * 12;
    const idx = new Uint32Array(buf, o, ni); o += ni * 4;
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.BufferAttribute(nor, 3));
    g.setIndex(new T.BufferAttribute(idx, 1));
    g.computeBoundingBox();
    g.userData.color = [cr / 255, cg / 255, cb / 255];
    geos.push(g);
  }

  // ---- baca node ----
  const nodes = [];
  for (let i = 0; i < nNode; i++) {
    const m = dv.getUint16(o, true); o += 2;
    const cr = dv.getUint8(o), cg = dv.getUint8(o + 1), cb = dv.getUint8(o + 2); o += 3;
    const tx = dv.getFloat32(o, true), ty = dv.getFloat32(o + 4, true), tz = dv.getFloat32(o + 8, true); o += 12;
    const qx = dv.getFloat32(o, true), qy = dv.getFloat32(o + 4, true), qz = dv.getFloat32(o + 8, true), qw = dv.getFloat32(o + 12, true); o += 16;
    const sx = dv.getFloat32(o, true), sy = dv.getFloat32(o + 4, true), sz = dv.getFloat32(o + 8, true); o += 12;
    nodes.push({ m, c: [cr / 255, cg / 255, cb / 255], t: [tx, ty, tz], q: [qx, qy, qz, qw], s: [sx, sy, sz] });
  }
  if (onProgress) onProgress({ nMesh, nNode });

  // ---- kelompokkan node per mesh → InstancedMesh ----
  const byMesh = new Map();
  for (let i = 0; i < nodes.length; i++) {
    const k = nodes[i].m;
    if (!byMesh.has(k)) byMesh.set(k, []);
    byMesh.get(k).push(i);
  }
  const group = new T.Group();
  group.name = 'BabftMapGLTF';
  const _m4 = new T.Matrix4(), _q = new T.Quaternion(), _v = new T.Vector3(), _s = new T.Vector3(), _c = new T.Color();
  let tris = 0;
  const box = new T.Box3();
  const tmpBox = new T.Box3();
  const allBox = new T.Box3();

  for (const [mi, list] of byMesh) {
    const geo = geos[mi];
    const im = new T.InstancedMesh(geo, null, list.length);   // material dipasang setelah loop
    im.name = 'babft_mesh_' + mi;
    im.frustumCulled = true;
    for (let j = 0; j < list.length; j++) {
      const nd = nodes[list[j]];
      _q.set(nd.q[0], nd.q[1], nd.q[2], nd.q[3]);
      _v.set(nd.t[0], nd.t[1], nd.t[2]);
      _s.set(nd.s[0], nd.s[1], nd.s[2]);
      _m4.compose(_v, _q, _s);
      im.setMatrixAt(j, _m4);
      _c.setRGB(nd.c[0], nd.c[1], nd.c[2], T.SRGBColorSpace);
      im.setColorAt(j, _c);
      // bbox dunia (untuk pusat & skala)
      tmpBox.copy(geo.boundingBox).applyMatrix4(_m4);
      if (j === 0) box.copy(tmpBox); else box.union(tmpBox);
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.userData.babftMeshIndex = mi;
    im.userData.babftMeshName = geo.name || ('mesh' + mi);
    tris += (geo.index ? geo.index.count : geo.attributes.position.count) / 3 * list.length;
    allBox.union(box);
    group.add(im);
  }

  // material (dipakai bersama, warna per-instance)
  const mat = new T.MeshLambertMaterial({ vertexColors: false, flatShading: false, side: T.DoubleSide });
  group.traverse((ch) => { if (ch.isInstancedMesh) ch.material = mat; });

  // ---- PUSATKAN + SKALA (1 block = 2 studs) ----
  const center = new T.Vector3();
  allBox.getCenter(center);
  const scale = 1 / spb;                       // studs → block
  group.position.set(-center.x * scale, -allBox.min.y * scale, -center.z * scale);
  group.scale.setScalar(scale);
  group.updateMatrixWorld(true);

  const sizeBlock = new T.Vector3().subVectors(allBox.max, allBox.min).multiplyScalar(scale);

  return {
    group, meshes: geos, nodes,
    stats: {
      nMesh, nNode, nInstancedMesh: byMesh.size,
      triangles: Math.round(tris),
      sizeStuds: { x: allBox.max.x - allBox.min.x, y: allBox.max.y - allBox.min.y, z: allBox.max.z - allBox.min.z },
      sizeBlock: { x: sizeBlock.x, y: sizeBlock.y, z: sizeBlock.z },
      studsPerBlock: spb,
      centerStuds: { x: center.x, y: center.y, z: center.z },
    },
  };
}

/** buang dari scene */
export function disposeBabftMapGltf(group) {
  if (!group) return;
  group.traverse((ch) => {
    if (ch.isInstancedMesh) {
      ch.geometry?.dispose?.();
      if (ch.instanceColor) ch.instanceColor = null;
      ch.dispose?.();
    }
  });
}
