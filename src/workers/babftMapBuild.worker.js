/**
 * babftMapBuild.worker.js — SEMUA kerja berat map Babft DI LUAR main thread.
 *
 * ── MASALAH YANG DIPERBAIKI (laporan user 2026-10-23) ──
 * "tesseract itu berhenti kalau progressnya berapa persen, harusnya animasi
 *  mutlak, tidak boleh berhenti dalam kondisi apapun."
 *
 * AKAR MASALAH (sudah DIUKUR, bukan dugaan):
 *   Seluruh rantai parse → bake warna → merge → BVH dulu dijalankan
 *   SINKRON di main thread. Total blokir terukur = 3.094 ms:
 *       parse + computeVertexNormals per part ... 685 ms
 *       bake warna vertex ...................... 771 ms
 *       mergeGeometries ........................ 348 ms
 *       computeVertexNormals (gabungan) ........ 271 ms
 *       computeBoundsTree (BVH) ................ 1290 ms
 *   Selama ±3 detik itu requestAnimationFrame TIDAK PERNAH dipanggil →
 *   tesseract (dan seluruh UI) membeku tepat di persentase terakhir yang
 *   sempat dilaporkan. Itulah "berhenti di sekian persen".
 *
 *   Ditambah 2 bug kecil di TesseractCore: komponen di-unmount saat
 *   `active` jadi false (mis. muncul error) dan saat
 *   prefers-reduced-motion aktif.
 *
 * SOLUSI: pindahkan SEMUA ke worker. Main thread hanya menerima array
 * jadi + BVH terserialisasi (deserialize terukur 8 ms, bukan 3094 ms).
 *
 * ── KESETIAAN HASIL (dijaga, bukan diperkirakan) ──
 * Logika di bawah adalah SALINAN PERSIS dari babftMapObj.js:
 *   loadBabftMapObj()  → parse, pusatkan part, lift part tipis (anti
 *                        z-fighting), nudge part kembar, Bases7 sintetis,
 *                        bbox, posisi & skala grup.
 *   loadBabftMapMerged() → bake warna vertex, gabung 1 mesh, normals,
 *                        bounding box/sphere, BVH maxDepth 45.
 * Bukti kesetiaan: _verify_worker_parity.mjs membandingkan hash hasil
 * worker dengan pipeline lama (harus 100% identik).
 *
 * Catatan: computeVertexNormals per part DILEWATI dengan sengaja.
 * Pipeline lama tetap memanggil computeVertexNormals() SEKALI LAGI pada
 * geometri gabungan, dan panggilan itulah yang menentukan normal akhir —
 * jadi normal per part memang dibuang. Hasil akhirnya identik.
 */
import * as T from 'three';
import { MeshBVH } from 'three-mesh-bvh';

const STUDS_PER_BLOCK_FALLBACK = 2.0;

function postProgress(phase, done, total, stage) {
  // Guard: file ini juga diimpor oleh skrip uji Node (tanpa `self`).
  if (typeof self !== 'undefined' && self.postMessage) {
    self.postMessage({ type: 'progress', phase, done, total, stage });
  }
}

if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  self.onmessage = (ev) => {
  const msg = ev.data || {};
  if (msg.type !== 'build') return;
  try {
    const result = build(msg.buffer);
    // Pindahkan buffer (tanpa salin) ke main thread.
    const transfer = [
      result.positions.buffer,
      result.normals.buffer,
      result.colors.buffer,
      result.bvh.index.buffer,
      ...result.bvh.roots.map((r) => r.buffer || r),
    ];
    if (result.bvh.indirectBuffer && result.bvh.indirectBuffer.buffer) {
      transfer.push(result.bvh.indirectBuffer.buffer);
    }
    self.postMessage({ type: 'done', ...result }, transfer);
  } catch (err) {
    self.postMessage({
      type: 'error',
      message: (err && err.message) ? err.message : String(err),
      stack: err && err.stack ? String(err.stack) : '',
    });
  }
  };
}

// Diekspor untuk skrip uji paritas di Node (_verify_worker_parity.mjs).
export { build };

function build(buffer) {
  const buf = buffer;
  const dv = new DataView(buf);
  const magic = String.fromCharCode(...new Uint8Array(buf, 0, 8));
  if (magic !== 'BABFTOBJ') throw new Error('Bukan format BABFTOBJ');

  let o = 8;
  const nObj = dv.getUint32(o, true); o += 4;
  const nMat = dv.getUint32(o, true); o += 4;
  const spb = dv.getFloat32(o, true) || STUDS_PER_BLOCK_FALLBACK; o += 4;

  const palet = [];
  for (let i = 0; i < nMat; i++) {
    palet.push([dv.getFloat32(o, true), dv.getFloat32(o + 4, true), dv.getFloat32(o + 8, true)]);
    o += 12;
  }

  const dec = new TextDecoder();

  // ── FASE 1: parse tiap part → array lokal (dipusatkan) + index ──
  // Menyimpan juga data Bases3 untuk membuat Bases7 sintetis (lengkap
  // seperti pipeline lama: export Studio melewatkan lahan tim hitam).
  const parts = [];
  let bases3 = null;
  let tris = 0;

  let mnAllX = Infinity, mnAllY = Infinity, mnAllZ = Infinity;
  let mxAllX = -Infinity, mxAllY = -Infinity, mxAllZ = -Infinity;
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

    // bbox part (di koordinat dunia/stud asli)
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

    // vertex lokal: (0,0,0) di tengah part (agar gizmo menancap tepat)
    const lp = new Float32Array(nv * 3);
    for (let vi = 0; vi < nv * 3; vi += 3) {
      lp[vi] = pos[vi] - cx;
      lp[vi + 1] = pos[vi + 1] - cy;
      lp[vi + 2] = pos[vi + 2] - cz;
    }

    const sx = mxx - mnx;
    const sy = mxy - mny;
    const sz = mxz - mnz;

    // ── ANTI Z-FIGHTING (sama persis dengan pipeline lama) ──
    const isThin = (sy < 0.05 || sx < 0.05 || sz < 0.05);
    let liftX = 0, liftY = 0, liftZ = 0;
    if (isThin) {
      if (sy < 0.05) liftY = 0.02;
      else if (sz < 0.05) liftZ = 0.02;
      else if (sx < 0.05) liftX = 0.02;
    }

    // part kembar tumpang tindih 100% → yang kedua digeser 0.01 stud
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

    const px = cx + liftX;
    const py = cy + liftY + nudgeY;
    const pz = cz + liftZ + nudgeZ;

    parts.push({ lp, idx, px, py, pz, mi });

    if (name === 'Bases3' && !bases3) bases3 = { lp, idx, px, py, pz, mi };

    // bbox keseluruhan (dari vertex ASLI, bukan yang sudah di-lift —
    // pipeline lama juga memakai mnx..mxz asli)
    if (first) {
      mnAllX = mnx; mnAllY = mny; mnAllZ = mnz;
      mxAllX = mxx; mxAllY = mxy; mxAllZ = mxz;
      first = false;
    } else {
      if (mnx < mnAllX) mnAllX = mnx; if (mny < mnAllY) mnAllY = mny; if (mnz < mnAllZ) mnAllZ = mnz;
      if (mxx > mxAllX) mxAllX = mxx; if (mxy > mxAllY) mxAllY = mxy; if (mxz > mxAllZ) mxAllZ = mxz;
    }

    tris += ni / 3;
    if ((i % 2000) === 0) postProgress('parse', i, nObj, 'Membaca part map...');
  }

  // ── Bases7 sintetis (cermin dari Bases3) — lahan Tim Hitam ──
  if (bases3) {
    const src = bases3.lp;
    const newPos = new Float32Array(src.length);
    for (let vi = 0; vi < src.length; vi += 3) {
      newPos[vi] = -src[vi];
      newPos[vi + 1] = src[vi + 1];
      newPos[vi + 2] = src[vi + 2];
    }
    // balik urutan vertex tiap segitiga supaya winding tetap benar
    const oldIdx = bases3.idx;
    const newIdx = new Uint32Array(oldIdx.length);
    for (let vi = 0; vi < oldIdx.length; vi += 3) {
      newIdx[vi] = oldIdx[vi];
      newIdx[vi + 1] = oldIdx[vi + 2];
      newIdx[vi + 2] = oldIdx[vi + 1];
    }
    parts.push({
      lp: newPos, idx: newIdx,
      px: -bases3.px, py: bases3.py, pz: bases3.pz, mi: bases3.mi,
    });
  }

  postProgress('parse', nObj, nObj, 'Part selesai dibaca');

  // ── FASE 2: gabung jadi SATU geometri + bake warna vertex ──
  // Dihitung dulu totalnya supaya alokasi tepat sekali (tanpa push/resize).
  let totalVerts = 0;
  let totalIdx = 0;
  for (let i = 0; i < parts.length; i++) {
    totalVerts += parts[i].lp.length / 3;
    totalIdx += parts[i].idx.length;
  }

  const positions = new Float32Array(totalVerts * 3);
  const colors = new Float32Array(totalVerts * 3);
  const indices = new Uint32Array(totalIdx);

  let vo = 0;   // offset vertex
  let io = 0;   // offset index

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const n = p.lp.length / 3;
    const rgb = palet[p.mi] || [0.7, 0.7, 0.7];
    const cr = rgb[0], cg = rgb[1], cb = rgb[2];

    // posisi akhir = lokal + posisi part (translasi saja, tanpa rotasi/skala)
    const base = vo * 3;
    for (let vi = 0; vi < p.lp.length; vi += 3) {
      positions[base + vi] = p.lp[vi] + p.px;
      positions[base + vi + 1] = p.lp[vi + 1] + p.py;
      positions[base + vi + 2] = p.lp[vi + 2] + p.pz;
    }
    // warna solid part → vertex color (1 draw call untuk seluruh map)
    for (let vi = 0; vi < n; vi++) {
      colors[base + vi * 3] = cr;
      colors[base + vi * 3 + 1] = cg;
      colors[base + vi * 3 + 2] = cb;
    }
    // index digeser sebesar offset vertex
    const src = p.idx;
    for (let k = 0; k < src.length; k++) indices[io + k] = src[k] + vo;

    io += src.length;
    vo += n;

    if ((i % 3000) === 0) postProgress('merge', i, parts.length, 'Menggabungkan part jadi 1 mesh...');
  }

  // bebaskan array per part segera (hemat memori puncak)
  for (let i = 0; i < parts.length; i++) { parts[i].lp = null; parts[i].idx = null; }

  postProgress('merge', parts.length, parts.length, 'Mesh tunggal siap');

  // ── FASE 3: normal permukaan (SATU kali untuk seluruh mesh) ──
  // Sama dengan pipeline lama: normal akhir memang dihitung ulang pada
  // geometri gabungan, jadi hasilnya identik.
  const normals = new Float32Array(totalVerts * 3);
  computeVertexNormals(positions, indices, normals, totalVerts);
  postProgress('normals', 1, 1, 'Menghitung pencahayaan...');

  // ── FASE 4: BVH (ini bagian termahal: ±1.3–2.5 detik) ──
  // Dibangun di sini supaya main thread tidak pernah terkunci.
  const bvhGeo = new T.BufferGeometry();
  bvhGeo.setAttribute('position', new T.BufferAttribute(positions, 3));
  bvhGeo.setIndex(new T.BufferAttribute(indices, 1));
  postProgress('bvh', 0, 1, 'Menyiapkan pencarian titik sentuh...');
  const bvh = new MeshBVH(bvhGeo, { maxDepth: 45 });
  const serialized = MeshBVH.serialize(bvh, { cloneBuffers: false });
  postProgress('bvh', 1, 1, 'Selesai');

  // ── bbox & skala grup (sama persis dengan pipeline lama) ──
  const scale = 1 / spb;
  const sizeStudsX = mxAllX - mnAllX;
  const sizeStudsY = mxAllY - mnAllY;
  const sizeStudsZ = mxAllZ - mnAllZ;
  const ctrX = (mnAllX + mxAllX) / 2;
  const ctrZ = (mnAllZ + mxAllZ) / 2;

  return {
    positions,
    normals,
    colors,
    bvh: {
      version: serialized.version,
      roots: serialized.roots,
      index: serialized.index,
      indirectBuffer: serialized.indirectBuffer || null,
    },
    stats: {
      nObj,
      nMaterial: nMat,
      triangles: Math.round(tris),
      sizeStuds: { x: sizeStudsX, y: sizeStudsY, z: sizeStudsZ },
      sizeBlock: { x: sizeStudsX * scale, y: sizeStudsY * scale, z: sizeStudsZ * scale },
      studsPerBlock: spb,
      mergedCount: 1,
      drawCalls: 1,
      vertexCount: totalVerts,
    },
    group: {
      position: [-ctrX * scale, -mnAllY * scale, -ctrZ * scale],
      scale,
    },
  };
}

/**
 * Normal per-vertex — implementasi setara THREE.BufferGeometry
 * .computeVertexNormals() (area-weighted, akumulasi per index).
 * Ditulis manual supaya worker tidak perlu membuat BufferGeometry penuh
 * untuk 1,55 juta vertex (hemat memori & waktu).
 */
function computeVertexNormals(positions, indices, out, count) {
  for (let i = 0; i < count; i++) {
    out[i * 3] = 0; out[i * 3 + 1] = 0; out[i * 3 + 2] = 0;
  }

  for (let f = 0; f < indices.length; f += 3) {
    const a = indices[f] * 3;
    const b = indices[f + 1] * 3;
    const c = indices[f + 2] * 3;

    const ax = positions[a], ay = positions[a + 1], az = positions[a + 2];
    const bx = positions[b], by = positions[b + 1], bz = positions[b + 2];
    const cx = positions[c], cy = positions[c + 1], cz = positions[c + 2];

    // cross( c - b, a - b ) — arah & besar sama dengan three.js
    const cbx = cx - bx, cby = cy - by, cbz = cz - bz;
    const abx = ax - bx, aby = ay - by, abz = az - bz;

    const nx = cby * abz - cbz * aby;
    const ny = cbz * abx - cbx * abz;
    const nz = cbx * aby - cby * abx;

    out[a] += nx; out[a + 1] += ny; out[a + 2] += nz;
    out[b] += nx; out[b + 1] += ny; out[b + 2] += nz;
    out[c] += nx; out[c + 1] += ny; out[c + 2] += nz;
  }

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let x = out[i3], y = out[i3 + 1], z = out[i3 + 2];
    const len = Math.sqrt(x * x + y * y + z * z);
    if (len > 0) { x /= len; y /= len; z /= len; }
    out[i3] = x; out[i3 + 1] = y; out[i3 + 2] = z;
  }
}
