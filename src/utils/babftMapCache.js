/**
 * babftMapCache.js — unduhan map Babft yang BISA DILANJUTKAN (resumable)
 * Permintaan user 2026-10-22:
 *   "harusnya deteksi misal player keluar udah lagi progress di berapa persen
 *    lalu masuk lagi ke 3d block simulator maka sistem deteksi oh ini progress
 *    nya udah sampai segini lalu ditunggu"
 *
 * MASALAH: /maps/babft_obj.bin ±33 MB. Kalau user keluar halaman / tutup tab
 * di tengah unduhan, semuanya HILANG dan mulai dari 0% lagi.
 *
 * SOLUSI:
 *   1. Unduhan dibaca bertahap (ReadableStream), tiap potongan ±1 MB disimpan
 *      ke IndexedDB → progres TIDAK hilang walau tab ditutup.
 *   2. Saat masuk lagi, `getStoredProgress()` melaporkan sudah sampai berapa
 *      byte. Unduhan dilanjutkan pakai HTTP Range (`bytes=N-`) — bukan dari 0.
 *   3. Kalau server mengabaikan Range (balas 200), otomatis mulai ulang dari 0
 *      dengan jujur (tidak diam-diam korup).
 *   4. Setelah lengkap, hasil digabung & disimpan sekali → kunjungan berikutnya
 *      INSTAN (tanpa jaringan).
 *
 * Catatan: IndexedDB dipakai (bukan Cache API) karena Cache API tidak bisa
 * menyimpan respons SEBAGIAN.
 */

const DB_NAME = 'babft-map-cache';
const DB_VER = 1;
const STORE_CHUNK = 'chunks';   // potongan unduhan
const STORE_META = 'meta';      // progres per-url

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB tidak tersedia')); return; }
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_CHUNK)) db.createObjectStore(STORE_CHUNK);
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, store, mode) {
  return db.transaction(store, mode).objectStore(store);
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Progres tersimpan: { received, total } atau null kalau belum ada. */
export async function getStoredProgress(url) {
  try {
    const db = await openDB();
    const meta = await reqToPromise(tx(db, STORE_META, 'readonly').get(url));
    db.close();
    if (!meta) return null;
    return { received: meta.received || 0, total: meta.total || 0, complete: !!meta.complete };
  } catch (e) {
    return null;
  }
}

async function putMeta(url, meta) {
  const db = await openDB();
  await reqToPromise(tx(db, STORE_META, 'readwrite').put(meta, url));
  db.close();
}

async function putChunk(key, buf) {
  const db = await openDB();
  await reqToPromise(tx(db, STORE_CHUNK, 'readwrite').put(buf, key));
  db.close();
}

async function getAllChunks(url) {
  const db = await openDB();
  const keys = await reqToPromise(tx(db, STORE_CHUNK, 'readonly').getAllKeys());
  const mine = keys
    .filter((k) => typeof k === 'string' && k.startsWith(url + '|'))
    .sort((a, b) => Number(a.split('|')[1]) - Number(b.split('|')[1]));
  const out = [];
  for (const k of mine) {
    const v = await reqToPromise(tx(db, STORE_CHUNK, 'readonly').get(k));
    if (v) out.push(v);
  }
  db.close();
  return out;
}

/**
 * Buang potongan yang MULAI di/atau melewati batas `batas` byte.
 * Dipakai saat resume: kalau meta berkata sudah sampai N byte, potongan yang
 * berada di atas N adalah sisa percobaan sebelumnya yang tidak boleh ikut
 * digabung (kalau ikut -> data dobel -> file korup).
 */
async function trimChunksFrom(url, batas) {
  const db = await openDB();
  const keys = await reqToPromise(tx(db, STORE_CHUNK, 'readonly').getAllKeys());
  const buang = keys.filter((k) => {
    if (typeof k !== 'string' || !k.startsWith(url + '|')) return false;
    return Number(k.split('|')[1]) >= batas;
  });
  if (buang.length) {
    const store = tx(db, STORE_CHUNK, 'readwrite');
    for (const k of buang) store.delete(k);
  }
  db.close();
  return buang.length;
}

async function deleteChunks(url) {
  const db = await openDB();
  const keys = await reqToPromise(tx(db, STORE_CHUNK, 'readonly').getAllKeys());
  const mine = keys.filter((k) => typeof k === 'string' && k.startsWith(url + '|'));
  const store = tx(db, STORE_CHUNK, 'readwrite');
  for (const k of mine) store.delete(k);
  db.close();
}

/** Hapus cache + progres (dipakai kalau data korup / user minta reset). */
export async function clearMapCache(url) {
  try {
    await deleteChunks(url);
    const db = await openDB();
    await reqToPromise(tx(db, STORE_META, 'readwrite').delete(url));
    db.close();
  } catch (e) { /* diamkan */ }
}

/**
 * Ambil file map dengan progres NYATA + bisa dilanjutkan.
 * @param {string} url
 * @param {(p:{done:number,total:number,stage:string,bytes:boolean,fromCache?:boolean})=>void} onProgress
 * @returns {Promise<ArrayBuffer>}
 */
export async function fetchMapResumable(url, onProgress) {
  const report = (o) => { try { onProgress && onProgress(o); } catch (_) {} };

  const stored = await getStoredProgress(url);
  let startAt = stored ? stored.received : 0;
  const knownTotal = stored ? stored.total : 0;

  // ── Sudah lengkap sebelumnya → ambil dari IndexedDB, tanpa jaringan ──
  if (stored && stored.complete && startAt > 0) {
    report({ done: startAt, total: startAt, stage: 'Memuat dari cache (tanpa unduh)', bytes: true, fromCache: true });
    const chunks = await getAllChunks(url);
    const totalLen = chunks.reduce((n, c) => n + c.byteLength, 0);
    if (totalLen === startAt) {
      const merged = new Uint8Array(totalLen);
      let off = 0;
      for (const c of chunks) { merged.set(new Uint8Array(c), off); off += c.byteLength; }
      return merged.buffer;
    }
    // Jumlah tidak cocok → anggap cache rusak, mulai bersih.
    await clearMapCache(url);
    startAt = 0;
  }

  if (startAt > 0) {
    report({
      done: startAt,
      total: knownTotal || startAt,
      stage: `Melanjutkan unduhan dari ${(startAt / 1048576).toFixed(1)} MB...`,
      bytes: true,
    });
  } else {
    report({ done: 0, total: 0, stage: 'Mengunduh map...', bytes: true });
  }

  // Bersihkan potongan di atas titik resume (sisa percobaan sebelumnya).
  if (startAt > 0) await trimChunksFrom(url, startAt);

  const headers = {};
  if (startAt > 0) headers['Range'] = `bytes=${startAt}-`;

  const res = await fetch(url, { headers });
  if (!res.ok && res.status !== 206) {
    throw new Error('Gagal memuat ' + url + ' (HTTP ' + res.status + ')');
  }

  // Server mengabaikan Range → mulai dari nol (jangan campur data lama).
  if (startAt > 0 && res.status === 200) {
    await clearMapCache(url);
    startAt = 0;
  }

  const contentLen = Number(res.headers.get('Content-Length')) || 0;
  const total = res.status === 206 ? startAt + contentLen : (contentLen || knownTotal || 0);

  let received = startAt;
  // PENTING (bug yang ditemukan lewat uji): chunk & meta HARUS konsisten.
  // Dulu chunk ditulis tiap read (offset sembarang) sedangkan meta tiap 1 MB.
  // Akibatnya saat resume, chunk baru ditulis di offset meta yang lebih kecil
  // dari akhir chunk terakhir -> potongan TUMPANG TINDIH -> file korup.
  // Sekarang: potongan ditampung dulu, baru ditulis + meta diperbarui
  // BERSAMAAN pada kelipatan SAVE_EVERY. Dengan begitu meta.received selalu
  // sama dengan akhir chunk terakhir, sehingga resume selalu menyambung tepat.
  const SAVE_EVERY = 2 * 1024 * 1024; // simpan tiap ±2 MB
  let pending = [];                    // potongan yang belum ditulis
  let pendingLen = 0;
  let flushed = startAt;               // posisi akhir data yang SUDAH tersimpan

  const flush = async () => {
    if (!pending.length) return;
    const merged = new Uint8Array(pendingLen);
    let off = 0;
    for (const c of pending) { merged.set(c, off); off += c.length; }
    await putChunk(url + '|' + flushed, merged.buffer);
    flushed += pendingLen;
    pending = [];
    pendingLen = 0;
    // meta ditulis SETELAH chunk ada -> tidak mungkin menunjuk data yang hilang
    await putMeta(url, { received: flushed, total, complete: false });
  };

  const reader = res.body && typeof res.body.getReader === 'function' ? res.body.getReader() : null;

  if (reader) {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      pending.push(new Uint8Array(value));
      pendingLen += value.byteLength;
      received += value.byteLength;

      if (pendingLen >= SAVE_EVERY) await flush();
      report({ done: received, total: total || received, stage: 'Mengunduh map...', bytes: true });
    }
    await flush();
  } else {
    // Browser tanpa stream: tidak bisa dilanjutkan, tapi tetap jalan.
    const ab = await res.arrayBuffer();
    await putChunk(url + '|' + startAt, ab);
    received = startAt + ab.byteLength;
    await putMeta(url, { received, total: total || received, complete: false });
    report({ done: received, total: received, stage: 'Unduhan selesai', bytes: true });
  }

  // Gabungkan semua potongan
  const chunks = await getAllChunks(url);
  const totalLen = chunks.reduce((n, c) => n + c.byteLength, 0);
  const merged = new Uint8Array(totalLen);
  let off = 0;
  for (const c of chunks) { merged.set(new Uint8Array(c), off); off += c.byteLength; }

  // ── VALIDASI KEUTUHAN ──
  // Kalau total tidak sesuai (atau magic BABFTOBJ salah), cache dibuang supaya
  // user tidak terjebak memakai file korup selamanya. Lebih baik unduh ulang
  // sekali daripada map rusak yang tidak bisa dibuka.
  const magic = totalLen >= 8
    ? String.fromCharCode(merged[0], merged[1], merged[2], merged[3], merged[4], merged[5], merged[6], merged[7])
    : '';
  const panjangCocok = !total || totalLen === total;
  if (!panjangCocok || magic !== 'BABFTOBJ') {
    await clearMapCache(url);
    throw new Error(
      'Data map tidak utuh (magic="' + magic + '", ' + totalLen + '/' + (total || '?') +
      ' byte). Cache dibersihkan, silakan muat ulang.'
    );
  }

  await putMeta(url, { received: totalLen, total: totalLen, complete: true });
  report({ done: totalLen, total: totalLen, stage: 'Unduhan selesai', bytes: true });
  return merged.buffer;
}
