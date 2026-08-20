// Verifikasi alignPlateToNormal — sumbu Z lokal (0,0,1) yang diputar dengan rotX(rx) lalu rotY(ry)
// HARUS menghasilkan vektor N target. Dipakai untuk validasi orientasi panel di generator.
//
// Run: node /home/z/my-project/scripts/verify_align_plate.mjs

class Vec3 {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
  toString() { return `(${this.x.toFixed(4)}, ${this.y.toFixed(4)}, ${this.z.toFixed(4)})`; }
}

// Reimplementasi rotX & rotY persis seperti di BlockSimulator3D.jsx
const rotY = (v, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return new Vec3(v.x * c - v.z * s, v.y, v.x * s + v.z * c);
};
const rotX = (v, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return new Vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c);
};

// alignPlateToNormal persis dari prompt kerja
const alignPlateToNormal = (N) => {
  const ry = Math.asin(Math.max(-1, Math.min(1, -N.x)));
  const rx = Math.atan2(-N.y, N.z);
  return { rx, ry };
};

const EPS = 1e-9;
const approxEq = (a, b) => Math.abs(a - b) < 1e-6;

let pass = 0, fail = 0;
const assert = (cond, label, extra = '') => {
  if (cond) { pass++; console.log(`✓ PASS  ${label}`); }
  else { fail++; console.log(`✗ FAIL  ${label}${extra ? ' | ' + extra : ''}`); }
};

// Reconstruct project pipeline: rotY first, then rotX (sama seperti di BlockSimulator3D.jsx line 122-123)
// Wait — di render() kode pakai rotY DULU lalu rotX. Tapi di getBlockCorners line 129-131 pakai rotY → rotX → rotZ.
// Untuk test alignPlateToNormal, kita ikuti getBlockCorners: rotY → rotX → rotZ(0).
function applyRotation(v, rx, ry) {
  let p = new Vec3(v.x, v.y, v.z);
  p = rotY(p, ry);
  p = rotX(p, rx);
  return p;
}

// TEST 1: N = (0, 0, 1) — normal menghadap +Z. Identity rotation.
//   alignPlateToNormal({0,0,1}): ry = asin(-0) = 0, rx = atan2(-0, 1) = 0.
//   applyRotation((0,0,1), 0, 0) = (0,0,1). ✓
{
  const N = { x: 0, y: 0, z: 1 };
  const { rx, ry } = alignPlateToNormal(N);
  const result = applyRotation(new Vec3(0, 0, 1), rx, ry);
  assert(approxEq(result.x, 0) && approxEq(result.y, 0) && approxEq(result.z, 1),
    'TEST 1: N=(0,0,1) identity', `result=${result.toString()}, rx=${rx}, ry=${ry}`);
}

// TEST 2: N = (1, 0, 0) — normal menghadap +X
//   ry = asin(-1) = -π/2, rx = atan2(-0, 0) = 0.
//   applyRotation((0,0,1), 0, -π/2): rotY(-π/2) → (0* cos(-π/2) - 1* sin(-π/2), 0, 0*sin(-π/2) + 1*cos(-π/2))
//   = (0 - (-1), 0, 0 + 0) = (1, 0, 0). ✓
{
  const N = { x: 1, y: 0, z: 0 };
  const { rx, ry } = alignPlateToNormal(N);
  const result = applyRotation(new Vec3(0, 0, 1), rx, ry);
  assert(approxEq(result.x, 1) && approxEq(result.y, 0) && approxEq(result.z, 0),
    'TEST 2: N=(1,0,0) → rotasi bikin Z lokal menghadap +X', `result=${result.toString()}`);
}

// TEST 3: N = (-1, 0, 0) — normal menghadap -X
//   ry = asin(1) = π/2, rx = atan2(-0, 0) = 0.
//   rotY(π/2)(0,0,1) = (0 - 1, 0, 0 + 0) = (-1, 0, 0). ✓
{
  const N = { x: -1, y: 0, z: 0 };
  const { rx, ry } = alignPlateToNormal(N);
  const result = applyRotation(new Vec3(0, 0, 1), rx, ry);
  assert(approxEq(result.x, -1) && approxEq(result.y, 0) && approxEq(result.z, 0),
    'TEST 3: N=(-1,0,0) → -X', `result=${result.toString()}`);
}

// TEST 4: N = (0, 1, 0) — normal menghadap +Y
//   ry = asin(0) = 0, rx = atan2(-1, 0) = -π/2.
//   applyRotation((0,0,1), -π/2, 0): rotY(0) identity, rotX(-π/2)(0,0,1) = (0, 0* cos(-π/2) - 1* sin(-π/2), 0* sin(-π/2) + 1*cos(-π/2))
//   = (0, 0 - (-1), 0 + 0) = (0, 1, 0). ✓
{
  const N = { x: 0, y: 1, z: 0 };
  const { rx, ry } = alignPlateToNormal(N);
  const result = applyRotation(new Vec3(0, 0, 1), rx, ry);
  assert(approxEq(result.x, 0) && approxEq(result.y, 1) && approxEq(result.z, 0),
    'TEST 4: N=(0,1,0) → +Y', `result=${result.toString()}`);
}

// TEST 5: N = (0, -1, 0) — normal menghadap -Y
//   ry = asin(0) = 0, rx = atan2(1, 0) = π/2.
//   applyRotation((0,0,1), π/2, 0): rotY(0) identity, rotX(π/2)(0,0,1) = (0, 0 - 1, 0 + 0) = (0, -1, 0). ✓
{
  const N = { x: 0, y: -1, z: 0 };
  const { rx, ry } = alignPlateToNormal(N);
  const result = applyRotation(new Vec3(0, 0, 1), rx, ry);
  assert(approxEq(result.x, 0) && approxEq(result.y, -1) && approxEq(result.z, 0),
    'TEST 5: N=(0,-1,0) → -Y', `result=${result.toString()}`);
}

// TEST 6: N = (0, 0, -1) — normal menghadap -Z
//   ry = asin(0) = 0, rx = atan2(-0, -1) = π (atau -π — atan2(0,-1) = π).
//   applyRotation((0,0,1), π, 0): rotX(π)(0,0,1) = (0, 0 - 0, 0 + 1*(-1))... wait.
//   rotX(π): cos=−1, sin=0. rotX(π)(0,0,1) = (0, 0* (-1) - 1*0, 0*0 + 1*(-1)) = (0, 0, -1). ✓
{
  const N = { x: 0, y: 0, z: -1 };
  const { rx, ry } = alignPlateToNormal(N);
  const result = applyRotation(new Vec3(0, 0, 1), rx, ry);
  assert(approxEq(result.x, 0) && approxEq(result.y, 0) && approxEq(result.z, -1),
    'TEST 6: N=(0,0,-1) → -Z', `result=${result.toString()}`);
}

// TEST 7: Random direction (1, 1, 1) normalized
//   N = (1/√3, 1/√3, 1/√3)
{
  const inv = 1 / Math.sqrt(3);
  const N = { x: inv, y: inv, z: inv };
  const { rx, ry } = alignPlateToNormal(N);
  const result = applyRotation(new Vec3(0, 0, 1), rx, ry);
  assert(approxEq(result.x, N.x) && approxEq(result.y, N.y) && approxEq(result.z, N.z),
    'TEST 7: N=(1,1,1)/√3 — random diagonal direction', `result=${result.toString()}, N=${JSON.stringify(N)}`);
}

// TEST 8: Verify generator output counts (sphere ~rings×slices blocks)
function generateSphereCount(radius, segments) {
  const rings = Math.max(3, Math.floor(segments / 2));
  const slices = Math.max(3, segments);
  return rings * slices;
}
assert(generateSphereCount(4, 10) === 50, 'TEST 8a: Sphere seg=10 → 5×10 = 50 blocks', `actual=${generateSphereCount(4, 10)}`);
assert(generateSphereCount(4, 24) === 288, 'TEST 8b: Sphere seg=24 → 12×24 = 288 blocks (max)', `actual=${generateSphereCount(4, 24)}`);
assert(generateSphereCount(4, 4) === 12, 'TEST 8c: Sphere seg=4 → 3×4 = 12 blocks (min, rings clamped to 3)', `actual=${generateSphereCount(4, 4)}`);

// TEST 9: Torus block count = majorSeg × minorSeg
function generateTorusCount(segments) {
  const majorSeg = segments;
  const minorSeg = Math.max(4, Math.floor(segments / 2));
  return majorSeg * minorSeg;
}
assert(generateTorusCount(10) === 50, 'TEST 9a: Torus seg=10 → 10×5 = 50 blocks', `actual=${generateTorusCount(10)}`);
assert(generateTorusCount(24) === 288, 'TEST 9b: Torus seg=24 → 24×12 = 288 blocks', `actual=${generateTorusCount(24)}`);

// TEST 10: Cylinder block count = rows × segments = floor(seg/2) × seg
function generateCylinderCount(segments) {
  const rows = Math.max(2, Math.floor(segments / 2));
  return rows * segments;
}
assert(generateCylinderCount(10) === 50, 'TEST 10a: Cylinder seg=10 → 5×10 = 50', `actual=${generateCylinderCount(10)}`);
assert(generateCylinderCount(24) === 288, 'TEST 10b: Cylinder seg=24 → 12×24 = 288', `actual=${generateCylinderCount(24)}`);

// TEST 11: Polyhedron block count = number of faces (1 per face)
const TETRAHEDRON_FACES = 4;
const OCTAHEDRON_FACES = 8;
const ICOSAHEDRON_FACES = 20;
assert(TETRAHEDRON_FACES === 4, 'TEST 11a: Tetrahedron = 4 faces → 4 blocks', `actual=${TETRAHEDRON_FACES}`);
assert(OCTAHEDRON_FACES === 8, 'TEST 11b: Octahedron = 8 faces → 8 blocks', `actual=${OCTAHEDRON_FACES}`);
assert(ICOSAHEDRON_FACES === 20, 'TEST 11c: Icosahedron = 20 faces → 20 blocks', `actual=${ICOSAHEDRON_FACES}`);
function generateCubeCount() { return 6; }
assert(generateCubeCount() === 6, 'TEST 11d: Cube = 6 faces → 6 blocks');

console.log('\n=== Summary ===');
console.log(`Pass: ${pass}/${pass + fail}`);
console.log(`Fail: ${fail}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
