/**
 * torchFlame.js — bab 205: BARA API BERANIMASI + CAHAYA untuk NSI Torch.
 *
 * Permintaan user: *"bara apinya adalah animasi yang terus bergerak jadi gak
 * diem kaku gitu doang"* dan *"NSI yang menghasilkan cahaya disekitarnya"*.
 *
 * ── KEPUTUSAN DESAIN (semua beralasan, bukan asal) ──
 *
 * 1. uTime GLOBAL, SATU objek untuk semua torch (Claude putaran 1, WAJIB).
 *    Kalau tiap torch punya uniform sendiri lalu di-update per frame, 100 torch
 *    = 100 update JS/frame. Dengan satu objek yang dipakai bersama, cukup
 *    `SHARED_TIME.value = t` sekali per frame → semua shader ikut.
 *    ⚠️ JEBAKAN: `ShaderMaterial.clone()` MENYALIN uniforms (bukan share), jadi
 *    uTime di material hasil clone MEMBEKU. Karena itu fungsi
 *    `reattachUniform()` dipakai setelah clone.
 *
 * 2. FASE PER-TORCH dari hash posisi (Claude: supaya 100 torch tidak
 *    berkedip serempak). Dikirim sebagai uniform uPhase.
 *
 * 3. POOL LAMPU TETAP 4 (Claude: menambah/mengurangi PointLight mengubah
 *    kunci shader → SEMUA material di-recompile → hitch saat place/undo).
 *    Jadi jumlah lampu di scene TIDAK PERNAH berubah setelah dibuat. Tiap
 *    ~200 ms, 4 lampu itu ditugaskan ke 4 torch TERDEKAT dari kamera. Torch
 *    lain tetap punya bara menyala (mesh additive) tapi tanpa PointLight.
 *    → terlihat seperti semua torch bersinar, tanpa biaya shader recompile.
 *
 * 4. castShadow = false (Claude, WAJIB): shadow point light = 6 render pass.
 *
 * 5. Mesh api: raycast dimatikan (`raycast = () => {}`) supaya klik/seleksi
 *    tidak mengenai volume api (Claude, WAJIB).
 *
 * 6. Amplitudo flicker DIBATASI supaya bbox tidak melebihi 6 studs
 *    (Claude, WAJIB): puncak nominal 1.45 block, flicker maks +0.05 → 1.50.
 */

/** Waktu global bersama — SATU objek untuk semua torch. */
export const SHARED_TIME = { value: 0 };

const MAX_LIGHTS = 4;          // pool tetap (mobile-friendly)
const LIGHT_RETARGET_MS = 200; // seberapa sering lampu dipindah ke torch terdekat

/** Hash sederhana → fase 0..2π yang stabil untuk posisi tertentu. */
function phaseFromPos(x, y, z) {
  const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return (h - Math.floor(h)) * Math.PI * 2;
}

/** Vertex + fragment shader bara. Gradasi warna dari tinggi (bukan vertex color). */
const VERT = /* glsl */`
  uniform float uTime;
  uniform float uPhase;
  uniform float uAmp;
  varying float vT;      // 0 = dasar, 1 = puncak
  varying float vSeed;
  void main() {
    vT = uv.y;
    vSeed = uPhase;
    vec3 p = position;
    // gelombang menjalar dari dasar ke puncak (api "menjilat")
    float t = uTime * 3.2 + uPhase;
    float wave = sin(t + p.y * 6.0) * 0.55 + sin(t * 1.7 + p.y * 11.0) * 0.45;
    // amplitudo naik ke puncak (dasar nyaris diam, ujung paling goyang)
    float k = smoothstep(0.0, 1.0, vT);
    p.x += wave * uAmp * k;
    p.z += cos(t * 0.9 + p.y * 4.5) * uAmp * k * 0.85;
    // tinggi "bernafas" sedikit — TAPI dibatasi agar bbox tidak lewat
    p.y += sin(t * 1.3 + uPhase) * uAmp * 0.35 * k;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */`
  uniform float uTime;
  uniform float uPhase;
  uniform float uIntensity;
  varying float vT;
  varying float vSeed;
  void main() {
    // ── gradasi terukur dari referensi: putih-kuning → oranye → merah → pink ──
    vec3 cWhite = vec3(1.00, 0.95, 0.72);
    vec3 cYellow = vec3(1.00, 0.78, 0.22);
    vec3 cOrange = vec3(1.00, 0.42, 0.06);
    vec3 cRed   = vec3(0.92, 0.16, 0.05);
    vec3 cPink  = vec3(0.95, 0.45, 0.62);   // ujung = pink transparan (foto)
    vec3 col;
    if (vT < 0.18)      col = mix(cWhite, cYellow, vT / 0.18);
    else if (vT < 0.42) col = mix(cYellow, cOrange, (vT - 0.18) / 0.24);
    else if (vT < 0.70) col = mix(cOrange, cRed, (vT - 0.42) / 0.28);
    else                col = mix(cRed, cPink, (vT - 0.70) / 0.30);

    // ── flicker: dua frekuensi + fase per-torch (tidak serempak) ──
    float fl = 0.88
             + 0.08 * sin(uTime * 9.0 + vSeed)
             + 0.05 * sin(uTime * 23.0 + vSeed * 2.0);
    col *= fl * uIntensity;

    // ── alpha: memudar ke puncak, dan sedikit bergerak ──
    float a = 1.0 - smoothstep(0.35, 1.0, vT);
    a *= 0.92 + 0.08 * sin(uTime * 13.0 + vSeed + vT * 6.0);
    gl_FragColor = vec4(col, a);
  }
`;

/**
 * Buat material bara. `intensity` menyesuaikan skala torch (1.0 = normal).
 * @returns {THREE.ShaderMaterial}
 */
export function makeFlameMaterial(THREE, phase = 0, intensity = 1.0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: SHARED_TIME,            // ⚠️ OBJEK YANG SAMA (bukan {value:0})
      uPhase: { value: phase },
      uAmp: { value: 0.045 },        // amplitudo geser (block) — kecil, bbox aman
      uIntensity: { value: intensity },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,      // WAJIB: api transparan tidak menulis depth
    depthTest: true,        // supaya cangkir tetap MENUTUPI api di belakangnya
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide, // api terlihat dari segala sudut
    toneMapped: false,      // biar gradasi tidak didesaturasi ACES
  });
}

/**
 * ⚠️ WAJIB setelah `material.clone()`: `clone()` MENYALIN uniforms, sehingga
 * `uTime` di hasil clone menjadi objek BARU yang membeku. Panggil fungsi ini
 * untuk menyambungkannya kembali ke SHARED_TIME.
 */
export function reattachUniform(mat) {
  if (!mat || !mat.uniforms) return mat;
  if (mat.uniforms.uTime) mat.uniforms.uTime = SHARED_TIME;
  return mat;
}

/**
 * Geometri bara: kerucut bertingkat (profil sesuai review Claude #5).
 * r=0.42 di bibir → mengerucut ke atas, ujung menyempit.
 * Tinggi = TC_FLAME_H (1.45 block), dasar di TC_FLAME_BASE_Y.
 */
export function makeFlameGeometry(THREE, baseY, height, baseR) {
  // Profil [r, y] relatif: dasar lebar, lalu menyempit dengan 2 "perut"
  // supaya terbaca seperti tumpukan bara (bukan kerucut polos).
  const H = height;
  const prof = [
    [baseR, 0.00],
    [baseR * 0.92, H * 0.16],
    [baseR * 0.72, H * 0.34],
    [baseR * 0.80, H * 0.46],   // perut kecil (bara mengepul)
    [baseR * 0.52, H * 0.64],
    [baseR * 0.58, H * 0.74],
    [baseR * 0.30, H * 0.88],
    [baseR * 0.06, H],          // ujung
  ];
  const geo = new THREE.LatheGeometry(
    prof.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)),
    16,
  );
  geo.translate(0, baseY, 0);
  // uv.y dari Lathe sudah 0..1 sepanjang profil → dipakai shader sebagai vT
  return geo;
}

/**
 * Pasang bara (mesh) ke sebuah block torch. Idempoten: kalau sudah ada,
 * tidak dipasang dua kali.
 * @returns {THREE.Mesh|null} mesh api
 */
export function attachFlame(THREE, block, params) {
  if (!block) return null;
  if (block.userData.torchFlame) return block.userData.torchFlame;
  const { baseY, height, baseR, intensity } = params;
  const wp = new THREE.Vector3();
  block.getWorldPosition(wp);
  const phase = phaseFromPos(wp.x, wp.y, wp.z);
  const geo = makeFlameGeometry(THREE, baseY, height, baseR);
  const mat = makeFlameMaterial(THREE, phase, intensity === undefined ? 1.0 : intensity);
  const flame = new THREE.Mesh(geo, mat);
  flame.userData.isTorchFlame = true;
  flame.castShadow = false;
  flame.receiveShadow = false;
  flame.frustumCulled = false;   // api kecil, jangan sampai terpotong saat kamera dekat
  // Claude WAJIB: klik/seleksi tidak boleh mengenai volume api
  flame.raycast = () => {};
  block.add(flame);
  block.userData.torchFlame = flame;
  return flame;
}

/** Lepas bara dari block (untuk undo/dispose). Aman dipanggil berulang. */
export function detachFlame(block) {
  if (!block || !block.userData) return;
  const f = block.userData.torchFlame;
  if (f) {
    if (f.parent) f.parent.remove(f);
    if (f.geometry) f.geometry.dispose();
    if (f.material) f.material.dispose();
    block.userData.torchFlame = null;
  }
}

/**
 * Pool lampu tetap. Dibuat SEKALI, jumlahnya tidak pernah berubah.
 * @returns {{lights: THREE.PointLight[], update: Function, dispose: Function}}
 */
export function makeTorchLightPool(THREE, scene, opts) {
  const o = opts || {};
  const count = Math.min(o.count || MAX_LIGHTS, MAX_LIGHTS);
  const color = o.color === undefined ? 0xff7a1a : o.color;
  // ⚠️ Default ini JARANG terpakai: BlockSimulator3D mengirim TC_LIGHT_*
  //    secara eksplisit. Disamakan dengan blockShapes.js agar tidak
  //    menyesatkan (bug 2026-10-24: sempat beda nilai → perubahan tidak
  //    berefek karena yang dipakai nilai eksplisit dari pemanggil).
  //    Fisika decay=2 → E = I/d².
  const intensity = o.intensity === undefined ? 60 : o.intensity;
  const distance = o.distance === undefined ? 20 : o.distance;
  const decay = o.decay === undefined ? 2 : o.decay;

  const lights = [];
  for (let i = 0; i < count; i++) {
    const L = new THREE.PointLight(color, 0, distance, decay);
    L.castShadow = false;            // WAJIB (Claude): shadow = 6 pass/lampu
    // ⚠️ WAJIB (Claude putaran 2, valid): JANGAN pakai visible=false untuk
    //    mematikan lampu. Jumlah lampu AKTIF berubah → Three mengompilasi ulang
    //    shader SEMUA material berlampu → hitch tiap jumlah torch berubah
    //    (1→2→3→4, undo). Semua lampu pool SELALU visible=true; mati = intensity 0.
    L.visible = true;
    L.intensity = 0;
    L.userData.baseIntensity = intensity;
    L.userData.phase = i * 1.7;      // fase beda supaya flicker tidak serempak
    scene.add(L);
    lights.push(L);
  }

  const _wp = new THREE.Vector3();
  const _cam = new THREE.Vector3();
  let lastRetarget = 0;
  let assigned = [];   // torch yang sedang dilayani lampu (diurutkan jarak)

  /**
   * Dipanggil tiap frame.
   * @param {number} nowMs  performance.now()
   * @param {THREE.Camera} camera
   * @param {Array} torchBlocks daftar mesh block torch
   * @param {number} lightY  tinggi lampu lokal (block)
   */
  function update(nowMs, camera, torchBlocks, lightY) {
    // ── pilih ulang torch terdekat secara berkala (bukan tiap frame) ──
    if (nowMs - lastRetarget > LIGHT_RETARGET_MS) {
      lastRetarget = nowMs;
      if (camera) camera.getWorldPosition(_cam);
      const arr = [];
      for (let i = 0; i < torchBlocks.length; i++) {
        const b = torchBlocks[i];
        if (!b || !b.parent) continue;
        b.getWorldPosition(_wp);
        const d = _wp.distanceToSquared(_cam);
        arr.push({ b, d, x: _wp.x, y: _wp.y, z: _wp.z });
      }
      arr.sort((p, q) => p.d - q.d);
      assigned = arr.slice(0, count);
    }

    // ── posisikan & nyalakan lampu ──
    for (let i = 0; i < lights.length; i++) {
      const L = lights[i];
      const a = assigned[i];
      // Lampu kosong: intensity 0 (BUKAN visible=false — lihat catatan di atas).
      if (!a || !a.b.parent) { L.intensity = 0; continue; }
      L.position.set(a.x, a.y + (lightY || 0), a.z);
      // flicker: dua frekuensi, sama seperti shader bara
      const t = nowMs / 1000;
      const ph = L.userData.phase;
      const fl = 1 + 0.12 * Math.sin(t * 9 + ph) + 0.08 * Math.sin(t * 23 + ph * 2);
      L.intensity = L.userData.baseIntensity * fl;
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
