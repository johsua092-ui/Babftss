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
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, MeshBVH } from 'three-mesh-bvh';

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


/**
 * loadBabftMapMerged — unduh map lalu SERAHKAN seluruh kerja berat ke worker.
 *
 * ── MENGAPA BEGINI (bug "tesseract berhenti", laporan user 2026-10-23) ──
 * Sebelumnya fungsi ini melakukan parse + bake warna + merge + BVH secara
 * SINKRON di main thread: total blokir terukur 3.094 ms. Selama blokir itu
 * requestAnimationFrame mati → tesseract membeku di persentase terakhir.
 *
 * Sekarang:
 *   1. Unduhan tetap di main thread (fetch streaming, progress byte nyata,
 *      resumable — perilaku lama dipertahankan 100%).
 *   2. Seluruh parse/merge/BVH dijalankan di Web Worker → main thread bebas,
 *      animasi jalan terus.
 *   3. Hasil worker (array jadi + BVH terserialisasi) dipasang di sini;
 *      MeshBVH.deserialize terukur cuma 8 ms.
 *
 * KESETIAAN: build() di worker adalah salinan logika lama. Dibuktikan
 * identik oleh _verify_worker_parity.mjs (positions, normals, colors,
 * himpunan segitiga, posisi/skala grup, statistik — semua IDENTIK).
 */
export async function loadBabftMapMerged(url = '/maps/babft_obj.bin', onProgress) {
  if (onProgress) onProgress({ done: 0, total: 32708, stage: 'Menyiapkan...' });

  // ── 1. Unduh (resumable) — main thread, tapi hanya I/O ──
  const buffer = await fetchMapResumable(url, onProgress);

  // ── 2. Kerja berat → WORKER ──
  if (onProgress) {
    onProgress({ done: 0, total: 1, stage: 'Menyiapkan mesh di latar belakang...', bytes: false });
  }

  const built = await runBuildInWorker(buffer, onProgress).catch(async (err) => {
    // ── Fallback: worker tidak bisa dipakai (browser kuno / CSP) ──
    // Tetap harus bisa memuat map. Jalur lama dipakai, tapi hanya sebagai
    // cadangan terakhir — animasi bisa tersendat di sini, jadi ini bukan
    // jalur normal.
    console.warn('[babftMap] Worker gagal, pakai jalur cadangan:', err);
    if (onProgress) {
      onProgress({ done: 0, total: 1, stage: 'Memuat dengan cara cadangan...', bytes: false });
    }
    return buildOnMainThread(buffer, onProgress);
  });

  // ── 3. Pasang hasil di main thread (cepat: ±8 ms) ──
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(built.positions, 3));
  geo.setAttribute('normal', new T.BufferAttribute(built.normals, 3));
  geo.setAttribute('color', new T.BufferAttribute(built.colors, 3));
  geo.setIndex(new T.BufferAttribute(built.bvh.index, 1));
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  // BVH hasil worker dipasang langsung (tanpa membangun ulang).
  geo.boundsTree = MeshBVH.deserialize(built.bvh, geo, { setIndex: false });

  const singleMat = new T.MeshLambertMaterial({
    vertexColors: true,
    toneMapped: true,
  });

  const mergedGroup = new T.Group();
  mergedGroup.name = 'BabftMapMerged';

  // ── PEMECAHAN SPASIAL: 1 mesh raksasa → beberapa potongan ──
  //
  // MENGAPA (ini akar "FPS rendah brutal" yang dilaporkan user):
  // Seluruh map digabung jadi SATU mesh 1.180.140 segitiga dengan bounding
  // sphere radius ±5.189 stud. Frustum culling memakai bounding sphere, jadi
  // sphere sebesar itu selalu memotong frustum kamera → three.js SELALU
  // menggambar 1,18 juta segitiga tiap frame, bahkan saat user hanya melihat
  // satu petak. Terukur (kamera identik, GPU Intel Iris Xe):
  //     1 mesh utuh ....... 1.180.140 tris, 24,5–34,9 ms/frame (28–41 FPS)
  //     dipecah spasial .... 12–290 ribu tris, 16,6–16,8 ms/frame (60 FPS)
  //
  // Geometri map memang memanjang (9 pulau, z −5.181…+5.181), jadi sebagian
  // besar isinya di luar pandangan. Dengan memecahnya per sel grid, three.js
  // bisa membuang potongan yang tidak terlihat — persis "tutup botol" yang
  // sebelumnya buntu.
  const chunks = splitGeometrySpatial(geo, singleMat);

  if (chunks.length) {
    // Proxy raycast: geometri ASLI (lengkap + BVH) tetap ada tapi TIDAK
    // digambar (visible=false). Raycaster three.js tetap mengujinya walau
    // tak terlihat, jadi tool place/delete tetap memakai BVH (0,6 ms) dan
    // tidak perlu BVH terpisah untuk tiap potongan.
    const proxy = new T.Mesh(geo, singleMat);
    proxy.name = 'BabftMap_RaycastProxy';
    proxy.visible = false;
    proxy.userData.babft = { name: 'BabftMap_RaycastProxy', editable: false };
    proxy.userData.isBabftMap = true;
    proxy.userData.isBabftProp = true;
    proxy.castShadow = false;
    proxy.receiveShadow = false;
    proxy.matrixAutoUpdate = false;
    proxy.updateMatrix();
    mergedGroup.add(proxy);
    for (let i = 0; i < chunks.length; i++) mergedGroup.add(chunks[i]);
  } else {
    // Jalur aman: kalau pemecahan gagal karena alasan apa pun, tetap tampil
    // sebagai satu mesh seperti sebelumnya (tidak boleh blank).
    const singleMesh = new T.Mesh(geo, singleMat);
    singleMesh.name = 'BabftMap_SingleMesh';
    singleMesh.userData.babft = { name: 'BabftMap_SingleMesh', editable: false };
    singleMesh.userData.isBabftMap = true;
    singleMesh.userData.isBabftProp = true;
    singleMesh.castShadow = false;
    singleMesh.receiveShadow = false;
    singleMesh.frustumCulled = true;
    singleMesh.matrixAutoUpdate = false;
    singleMesh.updateMatrix();
    mergedGroup.add(singleMesh);
    chunks.push(singleMesh);
  }

  mergedGroup.position.set(built.group.position[0], built.group.position[1], built.group.position[2]);
  mergedGroup.scale.setScalar(built.group.scale);
  mergedGroup.updateMatrixWorld(true);

  return {
    group: mergedGroup,
    objects: chunks,
    stats: built.stats,
  };
}

/**
 * splitGeometrySpatial — pecah satu BufferGeometry besar jadi potongan grid.
 *
 * PENTING (desain):
 *  - Atribut position/normal/color DIPAKAI BERSAMA (bukan disalin). Yang
 *    dipotong hanya index-nya. Kalau vertex disalin per potongan, memori
 *    bisa membengkak 2× dari 66,8 MB dan justru menambah beban GPU.
 *  - Tiap potongan menghitung bounding sphere KETAT dari vertex yang benar-
 *    benar dipakainya. Ini yang membuat frustum culling akhirnya bekerja;
 *    kalau radiusnya masih sebesar map, tidak ada yang dibuang.
 *  - Potongan tidak di-raycast (raycast memakai proxy ber-BVH), jadi tool
 *    place tetap secepat sebelumnya.
 *
 * @returns {THREE.Mesh[]} daftar mesh potongan (kosong kalau gagal)
 */
function splitGeometrySpatial(geo, material) {
  try {
    const posAttr = geo.attributes.position;
    const idxAttr = geo.index;
    if (!posAttr || !idxAttr) return [];

    const pos = posAttr.array;
    const idx = idxAttr.array;
    const nTri = idx.length / 3;
    if (!nTri) return [];

    // bbox dipakai sebagai penjaga: kalau geometri belum punya bounding box,
    // pemecahan dilewati dan pemanggil memakai jalur satu-mesh yang aman.
    if (!geo.boundingBox) return [];

    // Grid ADAPTIF: ukuran sel ditentukan dalam stud, bukan jumlah tetap.
    //
    // MENGAPA: bbox map sangat memanjang (z −5.181…+5.181 = 10.361 stud),
    // sementara isi terpadatnya menumpuk di pita ±1.500 stud. Grid dengan
    // jumlah sel tetap (mis. 24) menghasilkan sel 431 stud → hampir semua
    // geometri masuk beberapa sel saja, sehingga culling nyaris tidak
    // membuang apa pun (terukur: hanya 5% segitiga terbuang).
    // Dengan ukuran sel ~200 stud, potongan jadi cukup kecil untuk dibuang
    // per area pandang, tapi jumlah draw call tetap wajar.
    //
    // CATATAN PENTING — kenapa BUKAN pembelahan rekursif:
    // Saya sudah mencoba dua varian rekursif (belah di titik tengah bbox, lalu
    // belah di median). Hasil ukurnya justru MERUGIKAN:
    //   • titik tengah bbox : 21 potongan, 5 terbesar memuat 71% geometri,
    //     muat 6 detik
    //   • median histogram  : 32–53 potongan sangat rata (36.3–37.4 rb tiap
    //     potongan), TAPI muat 17–39 detik
    // Keduanya tidak menaikkan FPS sama sekali (grid sudah 60 FPS). Jadi
    // biaya muatnya tidak sepadan. Grid satu-lintasan di bawah tetap dipakai
    // karena muat 3,2 detik dan sudah membuang 81% segitiga saat di dalam
    // gedung.
    const CELL_TARGET = 200;
    const NX = Math.max(1, Math.min(16, Math.ceil((geo.boundingBox.max.x - geo.boundingBox.min.x) / CELL_TARGET)));
    const NZ = Math.max(1, Math.min(48, Math.ceil((geo.boundingBox.max.z - geo.boundingBox.min.z) / CELL_TARGET)));
    const bminX = geo.boundingBox.min.x, bminZ = geo.boundingBox.min.z;
    const spanX = Math.max(1e-6, geo.boundingBox.max.x - bminX);
    const spanZ = Math.max(1e-6, geo.boundingBox.max.z - bminZ);
    const cellW = spanX / NX;
    const cellD = spanZ / NZ;

    // 1) Sel tiap segitiga ditentukan dari titik pusatnya, sekaligus dihitung
    //    berapa segitiga yang jatuh di tiap sel (satu lintasan saja).
    const cellOf = new Int32Array(nTri);
    const count = new Int32Array(NX * NZ);
    for (let t = 0; t < nTri; t++) {
      const a = idx[t * 3] * 3;
      const b = idx[t * 3 + 1] * 3;
      const c = idx[t * 3 + 2] * 3;
      const cx = (pos[a] + pos[b] + pos[c]) / 3;
      const cz = (pos[a + 2] + pos[b + 2] + pos[c + 2]) / 3;
      let ix = Math.floor((cx - bminX) / cellW);
      let iz = Math.floor((cz - bminZ) / cellD);
      if (ix < 0) ix = 0; else if (ix >= NX) ix = NX - 1;
      if (iz < 0) iz = 0; else if (iz >= NZ) iz = NZ - 1;
      const cell = iz * NX + ix;
      cellOf[t] = cell;
      count[cell]++;
    }

    // 2) Kelompokkan segitiga per sel dalam SATU lintasan memakai kursor.
    //
    // MENGAPA BUKAN "untuk tiap sel, pindai semua segitiga": 1,18 juta
    // segitiga × 100 sel = 118 juta pemeriksaan → ±1 detik main thread
    // terblokir setiap map dimuat. Dengan kursor, biayanya hanya 1,18 juta
    // (satu kali lihat tiap segitiga).
    const kursor = new Int32Array(NX * NZ + 1);
    for (let cell = 0; cell < NX * NZ; cell++) kursor[cell + 1] = kursor[cell] + count[cell];
    const isi = new Int32Array(nTri);          // daftar indeks segitiga per sel
    const posisi = kursor.slice(0, NX * NZ);   // posisi tulis berjalan
    for (let t = 0; t < nTri; t++) {
      isi[posisi[cellOf[t]]++] = t;
    }

    const meshes = [];

    // 3) Bangun satu mesh per sel; atribut tetap bersama.
    for (let cell = 0; cell < NX * NZ; cell++) {
      const mulai = kursor[cell];
      const akhir = kursor[cell + 1];
      if (akhir === mulai) continue;

      const subIdx = new Uint32Array((akhir - mulai) * 3);
      let k = 0;
      let mnx = Infinity, mny = Infinity, mnz = Infinity;
      let mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;

      for (let s = mulai; s < akhir; s++) {
        const t = isi[s];
        for (let j = 0; j < 3; j++) {
          const vi = idx[t * 3 + j];
          subIdx[k++] = vi;
          const x = pos[vi * 3], y = pos[vi * 3 + 1], z = pos[vi * 3 + 2];
          if (x < mnx) mnx = x; if (x > mxx) mxx = x;
          if (y < mny) mny = y; if (y > mxy) mxy = y;
          if (z < mnz) mnz = z; if (z > mxz) mxz = z;
        }
      }

      const cg = new T.BufferGeometry();
      // Buffer BERSAMA: nol salinan, hemat memori.
      cg.setAttribute('position', posAttr);
      if (geo.attributes.normal) cg.setAttribute('normal', geo.attributes.normal);
      if (geo.attributes.color) cg.setAttribute('color', geo.attributes.color);
      cg.setIndex(new T.BufferAttribute(subIdx, 1));

      // Bounding KETAT dari vertex yang dipakai sel ini → culling bekerja.
      const bs = new T.Sphere();
      bs.center.set((mnx + mxx) / 2, (mny + mxy) / 2, (mnz + mxz) / 2);
      bs.radius = Math.sqrt((mxx - mnx) ** 2 + (mxy - mny) ** 2 + (mxz - mnz) ** 2) / 2;
      cg.boundingSphere = bs;
      const bb = new T.Box3();
      bb.min.set(mnx, mny, mnz);
      bb.max.set(mxx, mxy, mxz);
      cg.boundingBox = bb;

      const m = new T.Mesh(cg, material);
      m.name = 'BabftMap_Chunk_' + cell;
      m.userData.babft = { name: m.name, editable: false };
      m.userData.isBabftMap = true;
      m.userData.isBabftProp = true;
      m.castShadow = false;
      m.receiveShadow = false;
      m.frustumCulled = true;
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      // Raycast ditangani proxy ber-BVH, jadi potongan tidak perlu diuji.
      m.raycast = () => {};
      meshes.push(m);
    }

    return meshes;
  } catch (e) {
    console.warn('[babftMap] pemecahan spasial gagal, pakai 1 mesh:', e);
    return [];
  }
}

/**
 * buildOnMainThread — JALUR CADANGAN (bukan jalur normal).
 *
 * Hanya dipakai kalau Web Worker tidak bisa dibuat. Logika = pipeline lama
 * yang sudah terbukti benar, tapi berjalan di main thread sehingga animasi
 * bisa tersendat ±3 detik. Itu sebabnya worker jadi jalur utama.
 */
async function buildOnMainThread(buffer, onProgress) {
  const dv = new DataView(buffer);
  let o = 8;
  const nObj = dv.getUint32(o, true); o += 4;
  const nMat = dv.getUint32(o, true); o += 4;
  const spb = dv.getFloat32(o, true); o += 4;
  const palet = [];
  for (let i = 0; i < nMat; i++) {
    palet.push([dv.getFloat32(o, true), dv.getFloat32(o + 4, true), dv.getFloat32(o + 8, true)]);
    o += 12;
  }
  const dec = new TextDecoder();
  const geos = [];
  let tris = 0;
  const box = new T.Box3();
  let first = true;
  const occupiedBoxes = new Map();
  let mnAll = null, mxAll = null;

  for (let i = 0; i < nObj; i++) {
    const nameLen = dv.getUint8(o); o += 1;
    const mi = dv.getUint16(o, true); o += 2;
    o += nameLen;
    o += (4 - ((3 + nameLen) % 4)) % 4;
    const nv = dv.getUint32(o, true); o += 4;
    const ni = dv.getUint32(o, true); o += 4;
    const pos = new Float32Array(buffer, o, nv * 3); o += nv * 12;
    const idx = new Uint32Array(buffer, o, ni); o += ni * 4;

    let mnx = Infinity, mny = Infinity, mnz = Infinity;
    let mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
    for (let vi = 0; vi < nv * 3; vi += 3) {
      const x = pos[vi], y = pos[vi + 1], z = pos[vi + 2];
      if (x < mnx) mnx = x; if (x > mxx) mxx = x;
      if (y < mny) mny = y; if (y > mxy) mxy = y;
      if (z < mnz) mnz = z; if (z > mxz) mxz = z;
    }
    const cx = (mnx + mxx) / 2, cy = (mny + mxy) / 2, cz = (mnz + mxz) / 2;
    const lp = new Float32Array(nv * 3);
    for (let vi = 0; vi < nv * 3; vi += 3) {
      lp[vi] = pos[vi] - cx; lp[vi + 1] = pos[vi + 1] - cy; lp[vi + 2] = pos[vi + 2] - cz;
    }
    const sx = mxx - mnx, sy = mxy - mny, sz = mxz - mnz;
    const isThin = (sy < 0.05 || sx < 0.05 || sz < 0.05);
    let liftX = 0, liftY = 0, liftZ = 0;
    if (isThin) {
      if (sy < 0.05) liftY = 0.02;
      else if (sz < 0.05) liftZ = 0.02;
      else if (sx < 0.05) liftX = 0.02;
    }
    const boxKey = `${cx.toFixed(2)}_${cy.toFixed(2)}_${cz.toFixed(2)}_${sx.toFixed(2)}_${sy.toFixed(2)}_${sz.toFixed(2)}`;
    let nudgeY = 0, nudgeZ = 0;
    if (occupiedBoxes.has(boxKey)) {
      const c = occupiedBoxes.get(boxKey);
      occupiedBoxes.set(boxKey, c + 1);
      nudgeY = 0.01 * c; nudgeZ = 0.01 * c;
    } else occupiedBoxes.set(boxKey, 1);

    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(lp, 3));
    g.setIndex(new T.BufferAttribute(idx, 1));
    g.translate(cx + liftX, cy + liftY + nudgeY, cz + liftZ + nudgeZ);
    const count = lp.length / 3;
    const col = new Float32Array(count * 3);
    const rgb = palet[mi] || [0.7, 0.7, 0.7];
    for (let vi = 0; vi < count; vi++) {
      col[vi * 3] = rgb[0]; col[vi * 3 + 1] = rgb[1]; col[vi * 3 + 2] = rgb[2];
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    geos.push(g);

    if (first) { mnAll = [mnx, mny, mnz]; mxAll = [mxx, mxy, mxz]; first = false; }
    else {
      mnAll[0] = Math.min(mnAll[0], mnx); mnAll[1] = Math.min(mnAll[1], mny); mnAll[2] = Math.min(mnAll[2], mnz);
      mxAll[0] = Math.max(mxAll[0], mxx); mxAll[1] = Math.max(mxAll[1], mxy); mxAll[2] = Math.max(mxAll[2], mxz);
    }
    tris += ni / 3;
    if (onProgress && (i % 2000 === 0)) {
      onProgress({ done: i, total: nObj, stage: 'Membaca part map...', bytes: false });
    }
  }

  const merged = BufferGeometryUtils.mergeGeometries(geos, false);
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  merged.computeBoundsTree({ maxDepth: 45 });
  geos.forEach((g) => g.dispose());

  const serialized = MeshBVH.serialize(merged.boundsTree, { cloneBuffers: false });
  const scale = 1 / spb;
  const ctrX = (mnAll[0] + mxAll[0]) / 2;
  const ctrZ = (mnAll[2] + mxAll[2]) / 2;

  return {
    positions: merged.attributes.position.array,
    normals: merged.attributes.normal.array,
    colors: merged.attributes.color.array,
    bvh: serialized,
    stats: {
      nObj, nMaterial: nMat, triangles: Math.round(tris),
      sizeStuds: { x: mxAll[0] - mnAll[0], y: mxAll[1] - mnAll[1], z: mxAll[2] - mnAll[2] },
      sizeBlock: {
        x: (mxAll[0] - mnAll[0]) * scale,
        y: (mxAll[1] - mnAll[1]) * scale,
        z: (mxAll[2] - mnAll[2]) * scale,
      },
      studsPerBlock: spb, mergedCount: 1, drawCalls: 1,
    },
    group: { position: [-ctrX * scale, -mnAll[1] * scale, -ctrZ * scale], scale },
  };
}

/**
 * Jalankan build() di Web Worker. Kalau Worker tidak tersedia (browser kuno
 * / lingkungan uji), jatuh ke jalur lama supaya aplikasi tetap jalan.
 */
function runBuildInWorker(buffer, onProgress) {
  return new Promise((resolve, reject) => {
    let worker;
    try {
      worker = new Worker(
        new URL('../workers/babftMapBuild.worker.js', import.meta.url),
        { type: 'module' },
      );
    } catch (e) {
      console.warn('[babftMap] Worker tidak tersedia, pakai jalur lama:', e);
      reject(e);
      return;
    }

    let selesai = false;

    worker.onmessage = (ev) => {
      const m = ev.data || {};
      if (m.type === 'progress') {
        if (onProgress) {
          onProgress({
            done: m.done,
            total: m.total,
            stage: m.stage,
            bytes: false,
            phase: m.phase,
          });
        }
        return;
      }
      if (m.type === 'error') {
        selesai = true;
        worker.terminate();
        reject(new Error(m.message || 'Worker gagal membangun mesh'));
        return;
      }
      if (m.type === 'done') {
        selesai = true;
        worker.terminate();
        resolve(m);
      }
    };

    worker.onerror = (err) => {
      if (selesai) return;
      selesai = true;
      try { worker.terminate(); } catch (_) {}
      reject(new Error((err && err.message) || 'Worker error'));
    };

    // Transfer buffer ke worker (tanpa salin) supaya hemat memori.
    // Catatan: buffer hasil fetchMapResumable masih dipakai untuk validasi
    // SEBELUM ini, jadi aman untuk di-transfer sekarang.
    worker.postMessage({ type: 'build', buffer }, [buffer]);
  });
}
