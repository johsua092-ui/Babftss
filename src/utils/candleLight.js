/**
 * candleLight.js — bab 208: CAHAYA untuk NSI Level 2 "Candle".
 *
 * ══ PERBEDAAN PENTING DENGAN LAMP & TORCH ══
 *  Torch  = api terbuka besar → flicker 2 frekuensi, intensitas tinggi (60).
 *  Lamp   = lentera kaca    → TIDAK ada flicker (cahaya stabil, "napas" 2%).
 *  Candle = api kecil terbuka → flicker HALUS tapi NYATA.
 *           Alasan: nyala lilin di dunia nyata bergoyang karena aliran udara,
 *           dan justru goyangan itulah yang membuatnya terbaca "hidup".
 *           Tapi amplitudonya HARUS lebih kecil dari torch (±6% vs ±12%),
 *           karena sumbu lilin jauh lebih kecil dari bara obor.
 *
 * ══ ARSITEKTUR (SAMA dengan torch/lamp, TERBUKTI) ══
 *  Pool PointLight TETAP. Dibuat SEKALI, jumlah tidak pernah berubah.
 *  Tiap 200 ms pool ditugaskan ke N candle TERDEKAT dari kamera.
 *  Candle di luar jangkauan → intensity = 0 (BUKAN visible = false).
 *
 * ⚠️ JEBAKAN YANG DIWARISI (jangan diulang):
 *  1. `visible = false` untuk mematikan lampu = BENCANA. Jumlah lampu aktif
 *     berubah → Three.js mengompilasi ulang shader SEMUA material berlampu
 *     → hitch tiap kali jumlah lampu berubah. Selalu `visible = true`,
 *     matikan dengan `intensity = 0`.
 *  2. `castShadow = true` = 6 render pass per lampu. DILARANG.
 *  3. Nilai default di sini JARANG terpakai: BlockSimulator3D mengirim
 *     CD_LIGHT_* secara eksplisit. Disamakan dengan blockShapes.js supaya
 *     tidak menyesatkan (bug torch 2026-10-24: sempat beda nilai → perubahan
 *     tidak berefek karena yang dipakai nilai dari pemanggil).
 */

/** Seberapa sering lampu dipindah ke candle terdekat. */
const LIGHT_RETARGET_MS = 200;

/** Jumlah lampu dalam pool. 4 = cukup untuk beberapa candle terdekat. */
export const MAX_CANDLE_LIGHTS = 4;

/**
 * Buat pool lampu Candle.
 * @param {object} THREE
 * @param {THREE.Scene} scene
 * @param {{count?:number,color?:number,intensity?:number,distance?:number,decay?:number}} opts
 * @returns {{lights: THREE.PointLight[], update: Function, dispose: Function}}
 */
export function makeCandleLightPool(THREE, scene, opts) {
  const o = opts || {};
  const count = Math.min(o.count || MAX_CANDLE_LIGHTS, MAX_CANDLE_LIGHTS);
  // Oranye-kuning hangat. Lebih JENUH dari lamp (0xffe9a0 = kuning pucat)
  // karena api lilin sungguhan lebih oranye di dekat sumbu.
  const color = o.color === undefined ? 0xffb04a : o.color;
  // ⚠️ I=32, D=11 = KALIBRASI TERUKUR DENGAN DIFF PIKEL (bukan rasio R-B).
  //    Efektif = I × Y(luminance linear warna):
  //      Torch  0xff7a1a Y=0.352 × 60 = 21.1
  //      Lamp   0xffe9a0 Y=0.821 × 22 = 18.1
  //      Candle 0xffb04a Y=0.528 × 32 = 16.9
  //    Riwayat: I=16 (efektif 8.4) TERLALU REDUP — lantai simulator
  //    (#0e1420 + ambient 0.45) tidak menerima genangan hangat sama sekali.
  //    Diukur ulang: I=16 delta 24.2 · I=28 → 30.9 · I=32 → 32.8 · I=40 → 37.5.
  //    JANGAN naikkan di atas ~40: delta jenuh karena tone mapping ACES.
  const intensity = o.intensity === undefined ? 32 : o.intensity;
  const distance = o.distance === undefined ? 11 : o.distance;
  const decay = o.decay === undefined ? 2 : o.decay;

  const lights = [];
  for (let i = 0; i < count; i++) {
    const L = new THREE.PointLight(color, 0, distance, decay);
    L.castShadow = false;   // WAJIB — shadow = 6 pass/lampu
    L.visible = true;       // WAJIB — lihat jebakan 1
    L.intensity = 0;
    L.userData.baseIntensity = intensity;
    L.userData.phase = i * 2.3;      // fase berbeda → tidak berkedip serempak
    scene.add(L);
    lights.push(L);
  }

  const _wp = new THREE.Vector3();
  const _cam = new THREE.Vector3();
  let lastRetarget = 0;
  let assigned = [];

  /**
   * Dipanggil tiap frame dari ticker simulator.
   * @param {number} nowMs       performance.now()
   * @param {THREE.Camera} camera
   * @param {Array} candleBlocks daftar mesh block Candle
   * @param {number} lightY      tinggi lampu lokal (block, relatif origin blok)
   */
  function update(nowMs, camera, candleBlocks, lightY) {
    if (nowMs - lastRetarget > LIGHT_RETARGET_MS) {
      lastRetarget = nowMs;
      if (camera) camera.getWorldPosition(_cam);
      const arr = [];
      for (let i = 0; i < candleBlocks.length; i++) {
        const b = candleBlocks[i];
        if (!b || !b.parent) continue;
        b.getWorldPosition(_wp);
        arr.push({ b, d: _wp.distanceToSquared(_cam), x: _wp.x, y: _wp.y, z: _wp.z });
      }
      arr.sort((p, q) => p.d - q.d);
      assigned = arr.slice(0, count);
    }

    // Flicker api kecil: 2 frekuensi tak berharmoni, amplitudo ±6%.
    // Frekuensi dipilih tidak kelipatan satu sama lain supaya polanya tidak
    // pernah persis berulang (kelihatan organik, bukan mesin).
    const t = nowMs / 1000;
    for (let i = 0; i < lights.length; i++) {
      const L = lights[i];
      const a = assigned[i];
      if (!a || !a.b.parent) { L.intensity = 0; continue; }
      const ph = L.userData.phase;
      const f1 = Math.sin(t * 7.3 + ph);
      const f2 = Math.sin(t * 11.7 + ph * 1.7);
      const flick = 1 + 0.06 * (0.65 * f1 + 0.35 * f2);
      L.position.set(a.x, a.y + (lightY || 0), a.z);
      L.intensity = L.userData.baseIntensity * flick;
    }
  }

  function dispose() {
    for (const L of lights) {
      if (L.parent) L.parent.remove(L);
      L.dispose();
    }
    lights.length = 0;
  }

  return { lights, update, dispose };
}
