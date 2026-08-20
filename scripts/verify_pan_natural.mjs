// Verifikasi pan camera — natural scrolling:
// - drag kanan (dx>0) → camera geser KANAN (target bergerak ke kanan di world, sepanjang right_world)
// - drag bawah (dy>0) → camera geser BAWAH (target bergerak ke bawah, sepanjang -up_world)
//
// Run: node /home/z/my-project/scripts/verify_pan_natural.mjs

class Vec3 {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
  add(v) { return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
  sub(v) { return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z); }
  mul(s) { return new Vec3(this.x * s, this.y * s, this.z * s); }
  toString() { return `(${this.x.toFixed(3)}, ${this.y.toFixed(3)}, ${this.z.toFixed(3)})`; }
}

let pass = 0, fail = 0;
const assert = (cond, label, extra = '') => {
  if (cond) { pass++; console.log(`✓ PASS  ${label}`); }
  else { fail++; console.log(`✗ FAIL  ${label}${extra ? ' | ' + extra : ''}`); }
};

// Reproduce kode yang di-fix
function panTarget(target0, dx, dy, yaw, pitch, dist) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const rightX = cy, rightY = 0, rightZ = -sy;
  const upX = -sp * sy, upY = cp, upZ = -sp * cy;
  const panScale = dist * 0.0015;
  return new Vec3(
    target0.x + dx * panScale * rightX - dy * panScale * upX,
    target0.y + dx * panScale * rightY - dy * panScale * upY,
    target0.z + dx * panScale * rightZ - dy * panScale * upZ
  );
}

// TEST 1: Identity camera (yaw=0, pitch=0, camera look dari +Z ke -Z)
//   right_world = (1, 0, 0) → drag kanan = camera ke kanan (X+)
//   up_world = (0, 1, 0) → drag bawah = camera turun (Y-)
{
  const t0 = new Vec3(0, 0, 0);
  const t1 = panTarget(t0, 100, 0, 0, 0, 22); // drag kanan 100px
  assert(t1.x > 0 && Math.abs(t1.z) < 0.0001, 'TEST 1: drag kanan (yaw=0) → target.x +, target.z 0',
         `actual=${t1.toString()}`);
  assert(t1.y === 0, 'TEST 1: drag kanan → target.y unchanged', `actual y=${t1.y}`);

  const t2 = panTarget(t0, 0, 100, 0, 0, 22); // drag bawah 100px
  assert(t2.y < 0 && Math.abs(t2.x) < 0.0001 && Math.abs(t2.z) < 0.0001, 'TEST 2: drag bawah (yaw=0) → target.y -, x & z 0',
         `actual=${t2.toString()}`);
}

// TEST 3: Default camera (yaw=-0.75, pitch=-0.55) — drag kanan 100px
//   Verifikasi: target.x harusnya BERTAMBAH (ke arah kanan world dari POV user)
{
  const t0 = new Vec3(0, 0, 0);
  const t1 = panTarget(t0, 100, 0, -0.75, -0.55, 22);
  // right_world = (cos(-0.75), 0, -sin(-0.75)) = (0.7317, 0, 0.6816)
  // t1.x = 0 + 100 * 0.0015 * 22 * 0.7317 = 2.414 (positive — camera ke kanan)
  // t1.z = 0 + 100 * 0.0015 * 22 * 0.6816 = 2.249 (positive)
  assert(t1.x > 0, 'TEST 3: drag kanan (yaw=-0.75) → target.x bertambah (camera ke kanan)',
         `actual x=${t1.x}`);
  // Untuk yaw=-0.75, drag kanan harusnya gerak camera ke arah kanan world
  // yang dari POV user = kanan-depan. X positif + Z positif = konsisten.
}

// TEST 4: Default camera — drag bawah 100px → target.y harus BERKURANG (camera turun)
{
  const t0 = new Vec3(0, 0, 0);
  const t1 = panTarget(t0, 0, 100, -0.75, -0.55, 22);
  // up_world.y = cos(-0.55) = 0.8525 (positive)
  // t1.y = 0 - 100 * 0.0015 * 22 * 0.8525 = -2.813 (NEGATIVE — camera turun)
  assert(t1.y < 0, 'TEST 4: drag bawah (default cam) → target.y berkurang (camera TURUN)',
         `actual y=${t1.y}`);
}

// TEST 5: Drag kiri (dx=-100) → camera ke kiri (target.x berkurang)
{
  const t0 = new Vec3(0, 0, 0);
  const t1 = panTarget(t0, -100, 0, -0.75, -0.55, 22);
  assert(t1.x < 0, 'TEST 5: drag kiri → target.x berkurang (camera ke kiri)',
         `actual x=${t1.x}`);
}

// TEST 6: Drag atas (dy=-100) → camera naik (target.y bertambah)
{
  const t0 = new Vec3(0, 0, 0);
  const t1 = panTarget(t0, 0, -100, -0.75, -0.55, 22);
  assert(t1.y > 0, 'TEST 6: drag atas → target.y bertambah (camera NAIK)',
         `actual y=${t1.y}`);
}

// TEST 7: Pure pan di yaw=π/2 (90°) — right_world = (0, 0, -1)
//   Camera look dari +X ke -X. Drag kanan harusnya gerak camera ke arah -Z.
{
  const t0 = new Vec3(0, 0, 0);
  const t1 = panTarget(t0, 100, 0, Math.PI/2, 0, 22);
  // right_world = (cos(π/2), 0, -sin(π/2)) = (0, 0, -1)
  // t1.z = 0 + 100 * 0.0015 * 22 * (-1) = -3.3
  assert(Math.abs(t1.x) < 0.0001 && t1.z < 0, 'TEST 7: yaw=π/2, drag kanan → target.z -, x 0',
         `actual=${t1.toString()}`);
}

console.log('\n=== Summary ===');
console.log(`Pass: ${pass}/${pass + fail}`);
console.log(`Fail: ${fail}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
