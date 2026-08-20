// Verifikasi Scale Step snap logic — copy paste persis dari onMouseMove tool='scale'
//
// Run: node /home/z/my-project/scripts/verify_scale_step.mjs

let pass = 0, fail = 0;
const assert = (cond, label, extra = '') => {
  if (cond) { pass++; console.log(`✓ PASS  ${label}`); }
  else { fail++; console.log(`✗ FAIL  ${label}${extra ? ' | ' + extra : ''}`); }
};

// Reimplementasi formula snap
function snapSize(rawSize, step) {
  return Math.max(step, Math.round(rawSize / step) * step);
}

// Test 1: scaleStep = 1, blok awal size.x = 2
// Drag dikit → rawSize = 2.347 → snap ke 2 (kelipatan 1 terdekat)
// Drag banyak → rawSize = 2.6 → snap ke 3
// Drag banyak → rawSize = 3.5 → snap ke 4 (round 0.5 ke atas)
{
  const step = 1;
  assert(snapSize(2.347, step) === 2, 'TEST 1a: step=1, raw=2.347 → snap=2 (kelipatan 1)', `actual=${snapSize(2.347, step)}`);
  assert(snapSize(2.6, step) === 3, 'TEST 1b: step=1, raw=2.6 → snap=3', `actual=${snapSize(2.6, step)}`);
  assert(snapSize(3.5, step) === 4, 'TEST 1c: step=1, raw=3.5 → snap=4 (round 0.5 ke atas)', `actual=${snapSize(3.5, step)}`);
  assert(snapSize(2.0, step) === 2, 'TEST 1d: step=1, raw=2.0 → snap=2 (already snapped)', `actual=${snapSize(2.0, step)}`);
}

// Test 2: scaleStep = 0.5, blok size.x = 2
// rawSize = 2.347 → snap ke 2.5 (kelipatan 0.5 terdekat)
// rawSize = 2.7 → snap ke 2.5 (2.7 lebih dekat ke 2.5 dibanding 3.0)
// rawSize = 2.8 → snap ke 3.0 (2.8 lebih dekat ke 3.0)
{
  const step = 0.5;
  assert(Math.abs(snapSize(2.347, step) - 2.5) < 0.0001, 'TEST 2a: step=0.5, raw=2.347 → snap=2.5', `actual=${snapSize(2.347, step)}`);
  assert(Math.abs(snapSize(2.7, step) - 2.5) < 0.0001, 'TEST 2b: step=0.5, raw=2.7 → snap=2.5 (closer to 2.5 than 3.0)', `actual=${snapSize(2.7, step)}`);
  assert(Math.abs(snapSize(2.8, step) - 3.0) < 0.0001, 'TEST 2c: step=0.5, raw=2.8 → snap=3.0', `actual=${snapSize(2.8, step)}`);
  assert(Math.abs(snapSize(2.0, step) - 2.0) < 0.0001, 'TEST 2d: step=0.5, raw=2.0 → snap=2.0', `actual=${snapSize(2.0, step)}`);
}

// Test 3: scaleStep = 0.05, blok bisa jadi sangat tipis (mendekati batang)
// rawSize = 2.034 → snap ke 2.05 (kelipatan 0.05)
// rawSize = 0.07 → snap ke 0.05 (di bawah 1, tipis)
// rawSize = 0.001 → min = step = 0.05 (bisa tipis tapi tidak negatif)
{
  const step = 0.05;
  assert(Math.abs(snapSize(2.034, step) - 2.05) < 0.0001, 'TEST 3a: step=0.05, raw=2.034 → snap=2.05', `actual=${snapSize(2.034, step)}`);
  assert(Math.abs(snapSize(0.07, step) - 0.05) < 0.0001, 'TEST 3b: step=0.05, raw=0.07 → snap=0.05 (tipis)', `actual=${snapSize(0.07, step)}`);
  assert(Math.abs(snapSize(0.001, step) - 0.05) < 0.0001, 'TEST 3c: step=0.05, raw=0.001 → snap=0.05 (min = step)', `actual=${snapSize(0.001, step)}`);
  assert(Math.abs(snapSize(-1, step) - 0.05) < 0.0001, 'TEST 3d: step=0.05, raw=-1 → snap=0.05 (min enforcement, gak negatif)', `actual=${snapSize(-1, step)}`);
}

// Test 4: scaleStep = 2 — minimum jadi 2, bukan 0.2 (sesuai prompt kerja)
// rawSize = 0.5 → snap = 2 (max(2, round(0.5/2)*2) = max(2, 0*2) = max(2, 0) = 2)
// rawSize = 1 → snap = 2 (round(1/2)*2 = round(0.5)*2 = 1*2 = 2, max(2,2)=2)
// rawSize = 3 → snap = 4 (round(3/2)*2 = round(1.5)*2 = 2*2 = 4)
// rawSize = 5.9 → snap = 6 (round(5.9/2)*2 = round(2.95)*2 = 3*2 = 6)
{
  const step = 2;
  assert(snapSize(0.5, step) === 2, 'TEST 4a: step=2, raw=0.5 → snap=2 (min = step)', `actual=${snapSize(0.5, step)}`);
  assert(snapSize(1, step) === 2, 'TEST 4b: step=2, raw=1 → snap=2', `actual=${snapSize(1, step)}`);
  assert(snapSize(3, step) === 4, 'TEST 4c: step=2, raw=3 → snap=4 (kelipatan 2)', `actual=${snapSize(3, step)}`);
  assert(snapSize(5.9, step) === 6, 'TEST 4d: step=2, raw=5.9 → snap=6 (round 2.95 ke 3)', `actual=${snapSize(5.9, step)}`);
}

// Test 5: kompensasi posisi (sisi berlawanan tetap diam) — verifikasi sbb:
//   blok awal: pos=(0,0,0), size=(2,2,2). Sisi -X = -1, sisi +X = +1.
//   Snap newSize = 4 (step=2, rawSize=3). actualDelta = 4-2 = 2.
//   pos.x = 0 + 1 * 2 / 2 = 1.
//   Sisi -X baru = 1 - 4/2 = -1 (TETAP DIAM) ✓
//   Sisi +X baru = 1 + 4/2 = 3 (majU dari 1 jadi 3, naik 2 unit) ✓
{
  const step = 2;
  const startPos = 0, startSize = 2;
  const rawSize = 3; // misal drag ke +1 dari 2 → 3
  const sign = 1; // handle +X
  const newSize = snapSize(rawSize, step); // = 4
  const actualDelta = newSize - startSize; // = 2
  const newPos = startPos + sign * actualDelta / 2; // = 1
  const oldMinusX = startPos - startSize / 2; // = -1
  const newMinusX = newPos - newSize / 2; // = -1
  const oldPlusX = startPos + startSize / 2; // = 1
  const newPlusX = newPos + newSize / 2; // = 3
  assert(newSize === 4, 'TEST 5a: snap result = 4 (kelipatan 2)', `actual=${newSize}`);
  assert(Math.abs(newMinusX - oldMinusX) < 0.0001, 'TEST 5b: sisi -X TETAP DIAM (-1) setelah snap', `old=${oldMinusX}, new=${newMinusX}`);
  assert(Math.abs((newPlusX - oldPlusX) - 2) < 0.0001, 'TEST 5c: sisi +X maju 2 unit (1 → 3)', `delta=${newPlusX - oldPlusX}`);
}

console.log('\n=== Summary ===');
console.log(`Pass: ${pass}/${pass + fail}`);
console.log(`Fail: ${fail}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
