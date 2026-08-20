// Verifikasi solveFullOrientation — reconstruct rotation pipeline sesuai getBlockCorners di BlockSimulator3D.jsx
// yang pakai urutan rotY → rotX → rotZ. Hasil orientasi HARUS konsisten: apply((0,0,1), rx,ry,rz) = N (normal),
// dan apply((1,0,0), rx,ry,rz) ≈ T (tangent, arah keliling panel).
//
// Run: node /home/z/my-project/scripts/verify_solve_full_orientation.mjs

class Vec3 {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
  toString() { return `(${this.x.toFixed(4)}, ${this.y.toFixed(4)}, ${this.z.toFixed(4)})`; }
}

const rotY = (v, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return new Vec3(v.x * c - v.z * s, v.y, v.x * s + v.z * c);
};
const rotX = (v, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return new Vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c);
};
const rotZ = (v, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return new Vec3(v.x * c - v.y * s, v.x * s + v.y * c, v.z);
};

// Pipeline sesuai getBlockCorners di file: rotY → rotX → rotZ
function applyRotation(v, rx, ry, rz) {
  let p = new Vec3(v.x, v.y, v.z);
  p = rotY(p, ry);
  p = rotX(p, rx);
  p = rotZ(p, rz);
  return p;
}

function solveFullOrientation(N, tangentHint) {
  const norm = (v) => { const l = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x/l, y: v.y/l, z: v.z/l }; };
  const dot = (a, b) => a.x*b.x + a.y*b.y + a.z*b.z;
  const cross = (a, b) => ({ x: a.y*b.z - a.z*b.y, y: a.z*b.x - a.x*b.z, z: a.x*b.y - a.y*b.x });

  const Nn = norm(N);
  const d = dot(tangentHint, Nn);
  const Traw = { x: tangentHint.x - Nn.x*d, y: tangentHint.y - Nn.y*d, z: tangentHint.z - Nn.z*d };
  const T = norm(Traw);
  const B = norm(cross(Nn, T));

  const rx = Math.asin(Math.max(-1, Math.min(1, B.z)));
  const ry = Math.atan2(T.z, Nn.z);
  const rz = Math.atan2(-B.x, B.y);
  return { rx, ry, rz };
}

let pass = 0, fail = 0;
const approxEq = (a, b) => Math.abs(a - b) < 1e-6;
const assert = (cond, label, extra = '') => {
  if (cond) { pass++; console.log(`✓ PASS  ${label}`); }
  else { fail++; console.log(`✗ FAIL  ${label}${extra ? ' | ' + extra : ''}`); }
};

// Test beberapa (N, tangentHint) kombinasi dari generator aktual

// === SPHERE: thetaMid = π/2, phiMid = 0 ===
// N = (sin(π/2)*cos(0), cos(π/2), sin(π/2)*sin(0)) = (1, 0, 0). tangentHint = (-sin(0), 0, cos(0)) = (0, 0, 1).
{
  const N = { x: 1, y: 0, z: 0 };
  const tangentHint = { x: 0, y: 0, z: 1 };
  const { rx, ry, rz } = solveFullOrientation(N, tangentHint);
  const Nresult = applyRotation(new Vec3(0, 0, 1), rx, ry, rz);
  const Tresult = applyRotation(new Vec3(1, 0, 0), rx, ry, rz);
  assert(approxEq(Nresult.x, N.x) && approxEq(Nresult.y, N.y) && approxEq(Nresult.z, N.z),
    'SPHERE equator phi=0: normal (0,0,1)→(1,0,0)', `result=${Nresult.toString()}`);
  // Tangent T = normalized projection of tangentHint ke plane normal N.
  // T_raw = (0,0,1) - (1,0,0)*0 = (0,0,1) → already normalized. T = (0,0,1).
  assert(approxEq(Tresult.x, 0) && approxEq(Tresult.y, 0) && approxEq(Tresult.z, 1),
    'SPHERE equator phi=0: tangent (1,0,0)→(0,0,1)', `result=${Tresult.toString()}`);
}

// === SPHERE: thetaMid = π/2, phiMid = π/2 ===
// N = (sin(π/2)*cos(π/2), cos(π/2), sin(π/2)*sin(π/2)) = (0, 0, 1). tangentHint = (-sin(π/2), 0, cos(π/2)) = (-1, 0, 0).
{
  const N = { x: 0, y: 0, z: 1 };
  const tangentHint = { x: -1, y: 0, z: 0 };
  const { rx, ry, rz } = solveFullOrientation(N, tangentHint);
  const Nresult = applyRotation(new Vec3(0, 0, 1), rx, ry, rz);
  const Tresult = applyRotation(new Vec3(1, 0, 0), rx, ry, rz);
  assert(approxEq(Nresult.x, N.x) && approxEq(Nresult.y, N.y) && approxEq(Nresult.z, N.z),
    'SPHERE equator phi=π/2: normal (0,0,1)→(0,0,1)', `result=${Nresult.toString()}`);
  // T_raw = (-1,0,0) - (0,0,1)*0 = (-1,0,0). T = (-1,0,0).
  assert(approxEq(Tresult.x, -1) && approxEq(Tresult.y, 0) && approxEq(Tresult.z, 0),
    'SPHERE equator phi=π/2: tangent (1,0,0)→(-1,0,0)', `result=${Tresult.toString()}`);
}

// === CYLINDER: phiMid = π/4 ===
// N = (cos(π/4), 0, sin(π/4)) = (0.707, 0, 0.707). tangentHint = (-sin(π/4), 0, cos(π/4)) = (-0.707, 0, 0.707).
{
  const inv = Math.SQRT1_2;
  const N = { x: inv, y: 0, z: inv };
  const tangentHint = { x: -inv, y: 0, z: inv };
  const { rx, ry, rz } = solveFullOrientation(N, tangentHint);
  const Nresult = applyRotation(new Vec3(0, 0, 1), rx, ry, rz);
  const Tresult = applyRotation(new Vec3(1, 0, 0), rx, ry, rz);
  assert(approxEq(Nresult.x, N.x) && approxEq(Nresult.y, N.y) && approxEq(Nresult.z, N.z),
    'CYLINDER phi=π/4: normal (0,0,1)→(0.707,0,0.707)', `result=${Nresult.toString()}`);
  assert(approxEq(Tresult.x, -inv) && approxEq(Tresult.y, 0) && approxEq(Tresult.z, inv),
    'CYLINDER phi=π/4: tangent (1,0,0)→(-0.707,0,0.707)', `result=${Tresult.toString()}`);
}

// === CONE: halfAngle = π/4, phiMid = 0 ===
// halfAngle = atan2(r, h) = π/4 kalau r=h.
// N = (cos(0)*cos(π/4), sin(π/4), sin(0)*cos(π/4)) = (0.707, 0.707, 0). tangentHint = (0, 0, 1).
{
  const inv = Math.SQRT1_2;
  const N = { x: inv, y: inv, z: 0 };
  const tangentHint = { x: 0, y: 0, z: 1 };
  const { rx, ry, rz } = solveFullOrientation(N, tangentHint);
  const Nresult = applyRotation(new Vec3(0, 0, 1), rx, ry, rz);
  assert(approxEq(Nresult.x, N.x) && approxEq(Nresult.y, N.y) && approxEq(Nresult.z, N.z),
    'CONE halfAngle=π/4 phi=0: normal (0,0,1)→(0.707, 0.707, 0)', `result=${Nresult.toString()}`);
}

// === TORUS: u = π/4, v = 0 ===
// u = π/4: tangentHint = (-sin(π/4), 0, cos(π/4)) = (-0.707, 0, 0.707).
// v = 0: N = (cos(0)*cos(π/4), sin(0), cos(0)*sin(π/4)) = (0.707, 0, 0.707).
{
  const inv = Math.SQRT1_2;
  const N = { x: inv, y: 0, z: inv };
  const tangentHint = { x: -inv, y: 0, z: inv };
  const { rx, ry, rz } = solveFullOrientation(N, tangentHint);
  const Nresult = applyRotation(new Vec3(0, 0, 1), rx, ry, rz);
  assert(approxEq(Nresult.x, N.x) && approxEq(Nresult.y, N.y) && approxEq(Nresult.z, N.z),
    'TORUS u=π/4 v=0: normal (0,0,1)→(0.707, 0, 0.707)', `result=${Nresult.toString()}`);
}

// === Random sampling: 100 kombinasi acak untuk Sphere/Cylinder/Cone/Torus ===
{
  let errors = 0;
  const randoms = 100;
  for (let i = 0; i < randoms; i++) {
    // Simulasi Sphere/Cylinder/Cone: N acak (spherical), tangentHint dari phi acak
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.random() * Math.PI; // 0..π (sphere)
    const nx = Math.sin(theta) * Math.cos(phi);
    const ny = Math.cos(theta);
    const nz = Math.sin(theta) * Math.sin(phi);
    const N = { x: nx, y: ny, z: nz };
    const tangentHint = { x: -Math.sin(phi), y: 0, z: Math.cos(phi) };
    const { rx, ry, rz } = solveFullOrientation(N, tangentHint);
    const Nresult = applyRotation(new Vec3(0, 0, 1), rx, ry, rz);
    const err = Math.hypot(Nresult.x - N.x, Nresult.y - N.y, Nresult.z - N.z);
    if (err > 1e-6) {
      errors++;
      if (errors <= 3) console.log(`  Error case ${i}: N=${JSON.stringify(N)}, result=${Nresult.toString()}, err=${err}`);
    }
  }
  assert(errors === 0, `RANDOM: ${randoms} random sphere/cyl/cone/torus samples — normal reconstruction error < 1e-6`, `errors=${errors}/${randoms}`);
}

// === Verify tangent T direction consistency (roll-locked) ===
// Untuk 2 titik berdekatan di equator sphere (phi=0 vs phi=0.1), tangent T harus konsisten
// (tidak flip 180° tiba-tiba). Cek dot product T1 · T2 ≈ +1 (positive).
{
  const phi1 = 0, phi2 = 0.1;
  const theta = Math.PI / 2; // equator
  const N1 = { x: Math.sin(theta) * Math.cos(phi1), y: Math.cos(theta), z: Math.sin(theta) * Math.sin(phi1) };
  const N2 = { x: Math.sin(theta) * Math.cos(phi2), y: Math.cos(theta), z: Math.sin(theta) * Math.sin(phi2) };
  const TH1 = { x: -Math.sin(phi1), y: 0, z: Math.cos(phi1) };
  const TH2 = { x: -Math.sin(phi2), y: 0, z: Math.cos(phi2) };
  const { rx: rx1, ry: ry1, rz: rz1 } = solveFullOrientation(N1, TH1);
  const { rx: rx2, ry: ry2, rz: rz2 } = solveFullOrientation(N2, TH2);
  const T1 = applyRotation(new Vec3(1, 0, 0), rx1, ry1, rz1);
  const T2 = applyRotation(new Vec3(1, 0, 0), rx2, ry2, rz2);
  const dot = T1.x*T2.x + T1.y*T2.y + T1.z*T2.z;
  assert(dot > 0.99, 'TANGENT CONSISTENCY: 2 adjacent panels at equator (phi=0 vs 0.1) — T1·T2 > 0.99 (no flip)', `dot=${dot.toFixed(4)}`);
}

console.log('\n=== Summary ===');
console.log(`Pass: ${pass}/${pass + fail}`);
console.log(`Fail: ${fail}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
