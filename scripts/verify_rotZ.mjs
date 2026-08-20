// Verifikasi matematis fungsi rotZ sebelum di-commit.
// Reimplementasi rotZ persis seperti di BlockSimulator3D.jsx, lalu test dengan
// nilai-nilai kunci (0, π/2, π, -π/2) supaya yakin rotasinya benar.
//
// Run: node /home/z/my-project/scripts/verify_rotZ.mjs

class Vec3 {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
  toString() { return `(${this.x.toFixed(4)}, ${this.y.toFixed(4)}, ${this.z.toFixed(4)})`; }
}

const rotZ = (v, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return new Vec3(v.x * c - v.y * s, v.x * s + v.y * c, v.z);
};

// Reference: pure 2D rotation matrix around Z (right-hand rule, CCW for positive angle)
//   | cos -sin 0 |   | x |   | x*cos - y*sin |
//   | sin  cos 0 | * | y | = | x*sin + y*cos |
//   |  0    0  1 |   | z |   |      z        |
const refRotZ = (v, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return new Vec3(v.x * c - v.y * s, v.x * s + v.y * c, v.z);
};

const HALF_PI = Math.PI / 2;
const EPS = 1e-9;

const approxEq = (a, b) => Math.abs(a - b) < EPS;

const testCases = [
  // { input vec, angle, expected result (right-hand rule, CCW for +angle) }
  { v: new Vec3(1, 0, 0),  a: 0,        expected: new Vec3(1, 0, 0),       label: "rotZ(1,0,0; 0) = identity" },
  { v: new Vec3(1, 0, 0),  a: HALF_PI, expected: new Vec3(0, 1, 0),       label: "rotZ(1,0,0; +π/2) → (0,1,0) — 90° CCW" },
  { v: new Vec3(1, 0, 0),  a: Math.PI, expected: new Vec3(-1, 0, 0),      label: "rotZ(1,0,0; π) → (-1,0,0) — 180°" },
  { v: new Vec3(1, 0, 0),  a: -HALF_PI, expected: new Vec3(0, -1, 0),    label: "rotZ(1,0,0; -π/2) → (0,-1,0) — 90° CW" },
  { v: new Vec3(0, 1, 0),  a: HALF_PI, expected: new Vec3(-1, 0, 0),      label: "rotZ(0,1,0; +π/2) → (-1,0,0)" },
  { v: new Vec3(1, 1, 0),  a: HALF_PI, expected: new Vec3(-1, 1, 0),      label: "rotZ(1,1,0; +π/2) → (-1,1,0)" },
  // Z harus TIDAK berubah sama sekali (itu inti dari rotasi sumbu Z)
  { v: new Vec3(2, 3, 5),  a: HALF_PI, expected: new Vec3(-3, 2, 5),      label: "rotZ(2,3,5; +π/2) → (-3,2,5) — Z preserve" },
  { v: new Vec3(2, 3, 5),  a: 1.234,   expected: null,                    label: "rotZ(2,3,5; 1.234) — Z harus tetap 5 (random angle)" },
  // Untuk membandingkan dengan reference (manual calc):
  { v: new Vec3(2, 3, 5),  a: 1.234,   expected: refRotZ(new Vec3(2,3,5), 1.234), label: "rotZ(2,3,5; 1.234) matches reference formula" },
];

console.log("=== Verifikasi rotZ ===\n");
let allPass = true;
for (const t of testCases) {
  const result = rotZ(t.v, t.a);
  const okZ = approxEq(result.z, t.v.z); // Z MUST be preserved
  let okExpected = true;
  if (t.expected) {
    okExpected = approxEq(result.x, t.expected.x) && approxEq(result.y, t.expected.y) && approxEq(result.z, t.expected.z);
  }
  const pass = okZ && okExpected;
  if (!pass) allPass = false;
  console.log(`${pass ? '✓ PASS' : '✗ FAIL'}  ${t.label}`);
  console.log(`         input    : ${t.v.toString()}  angle=${t.a.toFixed(4)}`);
  console.log(`         result   : ${result.toString()}`);
  if (t.expected) console.log(`         expected : ${t.expected.toString()}`);
  console.log(`         Z preserve: ${okZ ? 'YES' : 'NO (BUG!)'}`);
  console.log('');
}

// Verifikasi 4× rotasi 90° = identity (no drift)
let p = new Vec3(2.5, -1.3, 4.7);
const orig = new Vec3(p.x, p.y, p.z);
for (let i = 0; i < 4; i++) p = rotZ(p, HALF_PI);
const roundTrip = approxEq(p.x, orig.x) && approxEq(p.y, orig.y) && approxEq(p.z, orig.z);
console.log(`${roundTrip ? '✓ PASS' : '✗ FAIL'}  4× rotZ(π/2) returns to start (no drift)`);
console.log(`         start    : ${orig.toString()}`);
console.log(`         after 4× : ${p.toString()}`);
if (!roundTrip) allPass = false;

console.log('\n=== Summary ===');
console.log(allPass ? 'ALL TESTS PASSED — rotZ implementation is mathematically correct.' : 'SOME TESTS FAILED — review implementation.');
process.exit(allPass ? 0 : 1);
