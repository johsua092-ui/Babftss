/**
 * babftMapParts.js — MAP "Build A boat" dari SUMBER ASLI .rbxlx (bab 186)
 *
 * ⚠️ Bukan lagi dari GLB (yang BOLONG 13,2%). Data ini dari file .rbxlx
 *    (Roblox XML) yang user simpan dari .rbxl → 77.453 PART ASLI:
 *    tiap part = balok SOLID dengan posisi/ukuran/rotasi/warna TEPAT.
 *
 * FORMAT DATA (public/maps/babft_parts.json):
 *   parts[i] = [ tipe, x, y, z, sx, sy, sz, [r00..r22], rgbInt, transparansi ]
 *   tipe: 0=balok(box) 1=baji(wedge) 2=baji-sudut(corner) 3=mesh(perkiraan box)
 *   satuan: STUDS (1 block = 2 studs)
 *
 * ATURAN (permintaan user):
 *   • 1 block = 2 studs (app yang jadi acuan)
 *   • KETEBALAN PENUH: tiap part solid → tidak ada yang bolong
 *   • 100% mirip: angka dibaca apa adanya, tidak ditaksir
 */
import * as THREE from 'three';

export const BABFT_STUDS_PER_BLOCK = 2;
export const BABFT_PARTS_URL = '/maps/babft_parts.json';

// ── AIR ASLI (dari properti Terrain di .rbxlx) ──
// ⚠️ CATATAN (bab 187): AIR di map ini = PART ASLI (rgb 8,115,207, transparan 1.0,
//    10 part besar 255x10x300 studs) — BUKAN bidang buatan. Jadi TIDAK perlu
//    menambah bidang air; sudah termasuk dalam 77.453 part.
export const BABFT_WATER = {
  color: 0x0c545c,        // WaterColor rgb(12,84,92) — dari file, bukan tebakan
  transparency: 0.30,     // WaterTransparency
  reflectance: 1,         // WaterReflectance
  waveSize: 0.15,
  waveSpeed: 10,
  regionStuds: [2044, 252, 2044],   // ukuran region Terrain (dari file)
};

// ── geometri (satuan block; nanti di-scale per part) ──
function boxGeo()   { return new THREE.BoxGeometry(1, 1, 1); }
function wedgeGeo() {
  // baji: prisma segitiga siku (seperti WedgePart Roblox)
  const g = new THREE.BufferGeometry();
  const v = new Float32Array([
    // sisi miring (segitiga)
    -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5, 0.5,-0.5,
    -0.5,-0.5, 0.5,  0.5,-0.5, 0.5,  0.5, 0.5, 0.5,
    // alas
    -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5,-0.5, 0.5,
    -0.5,-0.5,-0.5,  0.5,-0.5, 0.5, -0.5,-0.5, 0.5,
    // belakang
    -0.5,-0.5,-0.5,  0.5, 0.5,-0.5, -0.5, 0.5,-0.5,
    // depan
    -0.5,-0.5, 0.5,  0.5, 0.5, 0.5,  0.5,-0.5, 0.5,
    // sisi tegak
     0.5,-0.5,-0.5,  0.5, 0.5,-0.5,  0.5, 0.5, 0.5,
     0.5,-0.5,-0.5,  0.5, 0.5, 0.5,  0.5,-0.5, 0.5,
  ]);
  g.setAttribute('position', new THREE.BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}
function cylinderGeo(seg = 28) {
  // silinder sumbu X (sesuai Roblox Part shape=2)
  const g = new THREE.CylinderGeometry(0.5, 0.5, 1, seg, 1, false);
  g.rotateZ(Math.PI / 2);          // sumbu Y → X
  return g;
}
function ballGeo(seg = 24) {
  return new THREE.SphereGeometry(0.5, seg, Math.max(8, Math.round(seg * 0.6)));
}
function cornerGeo() {
  // baji sudut: kotak yang satu sudut atasnya dipotong
  const g = new THREE.BufferGeometry();
  const v = new Float32Array([
    -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5,-0.5, 0.5,
    -0.5,-0.5,-0.5,  0.5,-0.5, 0.5, -0.5,-0.5, 0.5,   // alas
    -0.5,-0.5,-0.5, -0.5,-0.5, 0.5, -0.5, 0.5, 0.5,   // sisi -X
    -0.5,-0.5,-0.5, -0.5, 0.5, 0.5, -0.5, 0.5,-0.5,
    -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5, 0.5,-0.5,   // sisi -Z
    -0.5,-0.5,-0.5,  0.5, 0.5,-0.5, -0.5, 0.5,-0.5,
     0.5,-0.5,-0.5,  0.5,-0.5, 0.5,  0.5, 0.5, 0.5,   // sisi +X
     0.5,-0.5,-0.5,  0.5, 0.5, 0.5,  0.5, 0.5,-0.5,
    -0.5,-0.5, 0.5,  0.5,-0.5, 0.5,  0.5, 0.5, 0.5,   // sisi +Z
    -0.5,-0.5, 0.5,  0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    -0.5, 0.5,-0.5,  0.5, 0.5,-0.5,  0.5, 0.5, 0.5,   // atap
    -0.5, 0.5,-0.5,  0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
  ]);
  g.setAttribute('position', new THREE.BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

/** Muat data part → THREE.Group berisi InstancedMesh per (tipe|warna|transparansi) */
export async function loadBabftParts(opts = {}) {
  const { THREE: T = THREE, studsPerBlock = BABFT_STUDS_PER_BLOCK, url = BABFT_PARTS_URL,
          meshCache = null } = opts;
  const res = await fetch(url);
  if (!res.ok) throw new Error('gagal memuat ' + url + ' (' + res.status + ')');
  const data = await res.json();
  const parts = data.parts;
  const k = 1 / studsPerBlock;              // studs → block

  const group = new T.Group();
  group.name = 'BabftMapParts';
  group.userData = { isBabftPartsMap: true, count: parts.length, sizeStuds: data.sizeStuds };

  // kelompokkan: tipe|warna|alpha(0/1)
  const buckets = new Map();
  for (const p of parts) {
    const key = p[0] + '|' + p[8] + '|' + (p[9] > 0.01 ? 1 : 0) + '|' + (p[10] || '');
    let b = buckets.get(key);
    if (!b) { b = { tipe: p[0], rgb: p[8], alpha: p[9] > 0.01 ? p[9] : 1, meshKey: p[10] || '', list: [] }; buckets.set(key, b); }
    b.list.push(p);
  }

  const geos = [boxGeo(), wedgeGeo(), cornerGeo(), boxGeo(), cylinderGeo(), ballGeo()];
  const dummy = new T.Object3D();
  const m4 = new T.Matrix4();
  const nm = new T.Matrix3();

  let made = 0;
  buckets.forEach((b) => {
    let geo = geos[b.tipe] || geos[0];
    // tipe 3 = MeshPart/Union → pakai MESH ASLI kalau sudah diekspor (bab 187)
    if (b.tipe === 3 && meshCache && meshCache[b.meshKey]) geo = meshCache[b.meshKey];
    const mat = new T.MeshStandardMaterial({
      color: new T.Color(b.rgb),
      roughness: 0.85,
      metalness: 0.0,
      transparent: b.alpha < 1,
      opacity: b.alpha,
      side: T.FrontSide,
      flatShading: false,
    });
    const inst = new T.InstancedMesh(geo, mat, b.list.length);
    inst.name = 'BabftParts_' + b.tipe + '_' + b.rgb.toString(16);
    inst.castShadow = true; inst.receiveShadow = false;
    inst.userData = { isBabftPart: true, tipe: b.tipe, rgb: b.rgb };
    for (let i = 0; i < b.list.length; i++) {
      const p = b.list[i];
      dummy.position.set(p[1] * k, p[2] * k, p[3] * k);
      dummy.scale.set(p[4] * k, p[5] * k, p[6] * k);
      const r = p[7];
      m4.set(r[0], r[1], r[2], 0, r[3], r[4], r[5], 0, r[6], r[7], r[8], 0, 0, 0, 0, 1);
      dummy.quaternion.setFromRotationMatrix(m4);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
    group.add(inst);
    made += b.list.length;
  });

  return { group, count: made, buckets: buckets.size, sizeStuds: data.sizeStuds };
}
