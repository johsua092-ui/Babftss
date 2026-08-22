// Verifikasi getGridPos baru (POIN E) — ray-plane intersection dengan plane Y=0.
// Test round-trip: project titik grid (x, 0, z) → pixel (mx, my), lalu getGridPos(mx, my) → (x', 0, z').
// Hasil HARUS sama: x' = x, z' = z (round-trip error ~10⁻¹³).
//
// Run: node /home/z/my-project/scripts/verify_getGridPos.mjs

class Vec3 {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
  add(v) { return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
  sub(v) { return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z); }
}

const rotY = (v, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return new Vec3(v.x * c - v.z * s, v.y, v.x * s + v.z * c);
};
const rotX = (v, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return new Vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c);
};

// Reproduce project() dari BlockSimulator3D.jsx
function project(p, cam, dpr, cx, cy) {
  let v = p.sub(cam.target);
  v = rotY(v, cam.yaw);
  v = rotX(v, cam.pitch);
  const focalLength = 700;
  const scale = focalLength / Math.max(0.5, v.z + cam.dist);
  return {
    x: cx / dpr + v.x * scale,
    y: cy / dpr - v.y * scale,
    z: v.z,
    scale
  };
}

// Reproduce getGridPos() baru (ray-plane intersection dengan plane Y=0)
function getGridPos(mx, my, cam, dpr, cx, cy) {
  const f = 700;
  const ccx = cx / dpr, ccy = cy / dpr;
  const Dx = (mx - ccx) / f, Dy = -(my - ccy) / f, Dz = 1;
  const camToWorld = (v) => {
    let p = rotX(v, -cam.pitch);
    p = rotY(p, -cam.yaw);
    return cam.target.add(p);
  };
  const p0 = camToWorld(new Vec3(0, 0, -cam.dist));
  const p1 = camToWorld(new Vec3(Dx, Dy, -cam.dist + Dz));
  const A = p0.y, B = p1.y - p0.y;
  if (Math.abs(B) < 1e-9) return null;
  const t = -A / B;
  const wx = p0.x + t * (p1.x - p0.x);
  const wz = p0.z + t * (p1.z - p0.z);
  return new Vec3(Math.round(wx), 0, Math.round(wz));
}

let pass = 0, fail = 0;
const assert = (cond, label, extra = '') => {
  if (cond) { pass++; console.log(`✓ PASS  ${label}`); }
  else { fail++; console.log(`✗ FAIL  ${label}${extra ? ' | ' + extra : ''}`); }
};

// Test dengan beberapa konfigurasi kamera
// Catatan: yaw=0, pitch=0 itu degenerate case (kamera sejajar ground, ray origin ada di Y=0).
// Untuk itu, getGridPos akan return null (Math.abs(B) < 1e-9). Itu CORRECT behavior —
// kamera horizontal tidak bisa lihat grid dari atas. Test di bawah pakai pitch < 0 (look down).
const testCases = [
  { name: 'default camera (yaw=-0.75, pitch=-0.55)', cam: { yaw: -0.75, pitch: -0.55, dist: 22, target: new Vec3(0,0,0) } },
  { name: 'orbit far (yaw=1.5, pitch=-1.0)', cam: { yaw: 1.5, pitch: -1.0, dist: 30, target: new Vec3(0,0,0) } },
  { name: 'orbit close (yaw=-0.3, pitch=-0.2)', cam: { yaw: -0.3, pitch: -0.2, dist: 10, target: new Vec3(0,0,0) } },
  { name: 'pan target (yaw=-0.5, pitch=-0.4, target=(5,0,5))', cam: { yaw: -0.5, pitch: -0.4, dist: 22, target: new Vec3(5,0,5) } },
  { name: 'top-down view (yaw=0, pitch=-1.4)', cam: { yaw: 0, pitch: -1.4, dist: 25, target: new Vec3(0,0,0) } },
  { name: 'steep angle (yaw=2.5, pitch=-0.9)', cam: { yaw: 2.5, pitch: -0.9, dist: 18, target: new Vec3(-3,0,4) } },
];

const dpr = 1, cx = 400, cy = 300; // canvas 800x600, center (400,300)
let maxError = 0;

for (const tc of testCases) {
  let caseErrors = 0;
  // Test beberapa titik grid: (-5,0), (0,0), (5,5), (10,10), (-10,-10)
  const gridPoints = [
    new Vec3(0, 0, 0),
    new Vec3(5, 0, 5),
    new Vec3(-5, 0, 5),
    new Vec3(10, 0, 10),
    new Vec3(-10, 0, -10),
    new Vec3(7, 0, -3),
  ];
  for (const gp of gridPoints) {
    // Project grid point ke pixel
    const projected = project(gp, tc.cam, dpr, cx, cy);
    // Inverse: getGridPos dari pixel → harusnya balik ke gp (round-trip)
    const result = getGridPos(projected.x, projected.y, tc.cam, dpr, cx, cy);
    if (!result) { caseErrors++; continue; }
    const err = Math.hypot(result.x - gp.x, result.z - gp.z);
    if (err > maxError) maxError = err;
    if (err > 1e-6) caseErrors++;
  }
  assert(caseErrors === 0, `Round-trip: ${tc.name}`, `${caseErrors} errors`);
}

console.log(`\nMax error across all tests: ${maxError.toExponential(3)}`);
assert(maxError < 1e-6, 'Round-trip error < 1e-6 (praktis nol) untuk semua titik & kamera');

console.log('\n=== Summary ===');
console.log(`Pass: ${pass}/${pass + fail}`);
console.log(`Fail: ${fail}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
