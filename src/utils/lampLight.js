/**
 * lampLight.js — bab 206: CAHAYA untuk NSI Level 2 "Lamp".
 *
 * ══ PERBEDAAN PENTING DENGAN TORCH (torchFlame.js) ══
 *  Torch = API TERBUKA  → shader bara beranimasi + flicker 2 frekuensi.
 *  Lamp  = LENTERA      → TIDAK ada api, TIDAK ada flicker.
 *          Cahayanya STABIL (sedikit "bernapas" ≤2%, bukan kedip).
 *  Alasan: lentera kaca dengan inti pijar tidak berkedip. Kalau diberi
 *  flicker torch, hasilnya terlihat seperti obor yang salah bentuk.
 *
 * ══ ARSITEKTUR (SAMA dengan torch, TERBUKTI) ══
 *  Pool PointLight TETAP. Dibuat SEKALI, jumlah tidak pernah berubah.
 *  Tiap 200 ms pool ditugaskan ke N lampu TERDEKAT dari kamera.
 *  Lampu di luar jangkauan → intensity = 0 (BUKAN visible = false).
 *
 * ⚠️ JEBAKAN YANG DIWARISI DARI TORCH (jangan diulang):
 *  1. `visible = false` untuk mematikan lampu = BENCANA. Jumlah lampu aktif
 *     berubah → Three.js mengompilasi ulang shader SEMUA material berlampu
 *     → hitch tiap kali jumlah lampu berubah. Selalu `visible = true`,
 *     matikan dengan `intensity = 0`.
 *  2. `castShadow = true` = 6 render pass per lampu. DILARANG.
 *  3. Uniform waktu HARUS satu objek global, bukan per-lampu (tidak dipakai
 *     di sini karena tidak ada shader, tapi prinsipnya tetap: jangan bikin
 *     state per-instance yang di-update tiap frame).
 */

/** Seberapa sering lampu dipindah ke lamp terdekat. */
const LIGHT_RETARGET_MS = 200;

/** Jumlah lampu dalam pool. 4 = cukup untuk beberapa lampu terdekat. */
export const MAX_LAMP_LIGHTS = 4;

/**
 * Buat pool lampu Lamp.
 * @param {object} THREE
 * @param {THREE.Scene} scene
 * @param {{count?:number,color?:number,intensity?:number,distance?:number,decay?:number}} opts
 * @returns {{lights: THREE.PointLight[], update: Function, dispose: Function}}
 */
export function makeLampLightPool(THREE, scene, opts) {
  const o = opts || {};
  const count = Math.min(o.count || MAX_LAMP_LIGHTS, MAX_LAMP_LIGHTS);
  // Kuning hangat pucat. Lebih PUCAT dari torch (0xff7a1a = oranye) karena
  // inti Lamp terukur (255,255,70) = kuning murni, bukan oranye.
  const color = o.color === undefined ? 0xffe9a0 : o.color;
  // ⚠️ Default di sini JARANG terpakai: BlockSimulator3D mengirim LP_LIGHT_*
  //    secara eksplisit. Disamakan dengan blockShapes.js supaya tidak
  //    menyesatkan (bug torch 2026-10-24: sempat beda nilai → perubahan
  //    tidak berefek karena yang dipakai nilai dari pemanggil).
  //    I=22, D=18 = hasil KALIBRASI TERUKUR terhadap Torch (lihat catatan
  //    panjang di blockShapes.js). JANGAN ubah tanpa mengukur ulang.
  const intensity = o.intensity === undefined ? 22 : o.intensity;
  const distance = o.distance === undefined ? 18 : o.distance;
  const decay = o.decay === undefined ? 2 : o.decay;

  const lights = [];
  for (let i = 0; i < count; i++) {
    const L = new THREE.PointLight(color, 0, distance, decay);
    L.castShadow = false;   // WAJIB — shadow = 6 pass/lampu
    L.visible = true;       // WAJIB — lihat jebakan 1
    L.intensity = 0;
    L.userData.baseIntensity = intensity;
    L.userData.phase = i * 1.7;
    scene.add(L);
    lights.push(L);
  }

  const _wp = new THREE.Vector3();
  const _cam = new THREE.Vector3();
  let lastRetarget = 0;
  let assigned = [];

  /**
   * Dipanggil tiap frame dari ticker simulator.
   * @param {number} nowMs      performance.now()
   * @param {THREE.Camera} camera
   * @param {Array} lampBlocks  daftar mesh block Lamp
   * @param {number} lightY     tinggi lampu lokal (block, relatif origin blok)
   */
  function update(nowMs, camera, lampBlocks, lightY) {
    if (nowMs - lastRetarget > LIGHT_RETARGET_MS) {
      lastRetarget = nowMs;
      if (camera) camera.getWorldPosition(_cam);
      const arr = [];
      for (let i = 0; i < lampBlocks.length; i++) {
        const b = lampBlocks[i];
        if (!b || !b.parent) continue;
        b.getWorldPosition(_wp);
        arr.push({ b, d: _wp.distanceToSquared(_cam), x: _wp.x, y: _wp.y, z: _wp.z });
      }
      arr.sort((p, q) => p.d - q.d);
      assigned = arr.slice(0, count);
    }

    // "Napas" sangat halus: ±2% pada 0.7 Hz. BUKAN kedip.
    const t = nowMs / 1000;
    for (let i = 0; i < lights.length; i++) {
      const L = lights[i];
      const a = assigned[i];
      if (!a || !a.b.parent) { L.intensity = 0; continue; }
      L.position.set(a.x, a.y + (lightY || 0), a.z);
      const breathe = 1 + 0.02 * Math.sin(t * 4.4 + L.userData.phase);
      L.intensity = L.userData.baseIntensity * breathe;
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
