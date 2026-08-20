// Verifikasi Scale ganda (handle +axis & -axis) — sisi berlawanan tetap diam.
//
// Run: node /home/z/my-project/scripts/verify_scale_dual.mjs

let pass = 0, fail = 0;
const assert = (cond, label, extra = '') => {
  if (cond) { pass++; console.log(`✓ PASS  ${label}`); }
  else { fail++; console.log(`✗ FAIL  ${label}${extra ? ' | ' + extra : ''}`); }
};

// Test 1: Handle +X, drag ke kanan (t positive)
//   Sebelum: pos=(0,0,0), size=(2,2,2). Sisi -X = -1, sisi +X = +1.
//   Drag handle +X ke kanan dengan t = +1.
//   effectiveT = t * sign = 1 * 1 = 1.
//   newSize = max(0.2, 2 + 1) = 3.
//   actualDelta = 3 - 2 = 1.
//   pos.x = 0 + 1 * 1 / 2 = 0.5.
//   Sisi -X baru = 0.5 - 3/2 = -1 (TETAP DIAM) ✓
//   Sisi +X baru = 0.5 + 3/2 = 2 (BERGERAK +1) ✓
{
  const start = { pos: { x: 0 }, size: { x: 2 } };
  const t = 1; const sign = 1;
  const effectiveT = t * sign;
  const newSize = Math.max(0.2, start.size.x + effectiveT);
  const actualDelta = newSize - start.size.x;
  const newPos = start.pos.x + sign * actualDelta / 2;
  const oldMinusX = start.pos.x - start.size.x / 2;
  const newMinusX = newPos - newSize / 2;
  const oldPlusX = start.pos.x + start.size.x / 2;
  const newPlusX = newPos + newSize / 2;
  assert(Math.abs(newMinusX - oldMinusX) < 0.0001, 'TEST 1: Handle +X, drag kanan — sisi -X TETAP DIAM',
         `old=${oldMinusX}, new=${newMinusX}`);
  assert(Math.abs((newPlusX - oldPlusX) - 1) < 0.0001, 'TEST 1: Handle +X, drag kanan — sisi +X MAJU 1 unit',
         `delta=${newPlusX - oldPlusX}`);
}

// Test 2: Handle -X, drag ke kiri (t negative karena axisUnit positif, drag kiri = t negatif)
//   Sebelum: pos=(0,0,0), size=(2,2,2). Sisi -X = -1, sisi +X = +1.
//   Drag handle -X ke kiri dengan t = -1 (mouseDelta ke kiri, axisUnit positif).
//   sign = -1 (handle -axis).
//   effectiveT = t * sign = -1 * -1 = +1.
//   newSize = max(0.2, 2 + 1) = 3.
//   actualDelta = 1.
//   pos.x = 0 + (-1) * 1 / 2 = -0.5.
//   Sisi +X baru = -0.5 + 3/2 = 1 (TETAP DIAM) ✓
//   Sisi -X baru = -0.5 - 3/2 = -2 (BERGERAK -1, maju ke kiri) ✓
{
  const start = { pos: { x: 0 }, size: { x: 2 } };
  const t = -1; const sign = -1; // drag kiri → t negative (axisUnit positif), handle -X → sign -1
  const effectiveT = t * sign;
  const newSize = Math.max(0.2, start.size.x + effectiveT);
  const actualDelta = newSize - start.size.x;
  const newPos = start.pos.x + sign * actualDelta / 2;
  const oldMinusX = start.pos.x - start.size.x / 2;
  const newMinusX = newPos - newSize / 2;
  const oldPlusX = start.pos.x + start.size.x / 2;
  const newPlusX = newPos + newSize / 2;
  assert(Math.abs(newPlusX - oldPlusX) < 0.0001, 'TEST 2: Handle -X, drag kiri — sisi +X TETAP DIAM',
         `old=${oldPlusX}, new=${newPlusX}`);
  assert(Math.abs((newMinusX - oldMinusX) - (-1)) < 0.0001, 'TEST 2: Handle -X, drag kiri — sisi -X MAJU -1 (ke kiri)',
         `delta=${newMinusX - oldMinusX}`);
}

// Test 3: Handle -X, drag ke kanan (mendekati blok) → size BERKURANG
//   t = +1 (drag kanan, axisUnit positif).
//   sign = -1.
//   effectiveT = 1 * -1 = -1.
//   newSize = max(0.2, 2 + (-1)) = 1.
//   actualDelta = -1.
//   pos.x = 0 + (-1) * (-1) / 2 = 0.5.
//   Sisi +X baru = 0.5 + 0.5 = 1 (TETAP DIAM) ✓
//   Sisi -X baru = 0.5 - 0.5 = 0 (BERGERAK +1, mundur ke kanan) ✓
{
  const start = { pos: { x: 0 }, size: { x: 2 } };
  const t = 1; const sign = -1;
  const effectiveT = t * sign;
  const newSize = Math.max(0.2, start.size.x + effectiveT);
  const actualDelta = newSize - start.size.x;
  const newPos = start.pos.x + sign * actualDelta / 2;
  const oldMinusX = start.pos.x - start.size.x / 2;
  const newMinusX = newPos - newSize / 2;
  const oldPlusX = start.pos.x + start.size.x / 2;
  const newPlusX = newPos + newSize / 2;
  assert(Math.abs(newPlusX - oldPlusX) < 0.0001, 'TEST 3: Handle -X, drag kanan (mendekati) — sisi +X TETAP DIAM',
         `old=${oldPlusX}, new=${newPlusX}`);
  assert(Math.abs((newMinusX - oldMinusX) - 1) < 0.0001, 'TEST 3: Handle -X, drag kanan (mendekati) — sisi -X MUNDUR +1',
         `delta=${newMinusX - oldMinusX}`);
  assert(newSize === 1, 'TEST 3: Handle -X, drag kanan — size BERKURANG jadi 1', `actual=${newSize}`);
}

// Test 4: Handle +Y (vertikal), drag ke bawah (t positive — drag bawah = y naik di screen, tapi world Y turun
//   karena screen Y dibalik. Jadi drag bawah = world Y turun = t negative untuk axis Y).
//   Actually, dragAxisDelta menghitung otomatis — tinggal beri t positive = drag sepanjang +axis.
//   Untuk test, asumsikan drag handle +Y ke atas = t positive.
//   sign = +1, behavior sama dengan Test 1.
//   newPos.y = 0 + 1 * 1 / 2 = 0.5. Sisi -Y tetap -1, sisi +Y jadi 2.
{
  const start = { pos: { y: 0 }, size: { y: 2 } };
  const t = 1; const sign = 1;
  const effectiveT = t * sign;
  const newSize = Math.max(0.2, start.size.y + effectiveT);
  const actualDelta = newSize - start.size.y;
  const newPos = start.pos.y + sign * actualDelta / 2;
  const oldMinusY = start.pos.y - start.size.y / 2;
  const newMinusY = newPos - newSize / 2;
  const oldPlusY = start.pos.y + start.size.y / 2;
  const newPlusY = newPos + newSize / 2;
  assert(Math.abs(newMinusY - oldMinusY) < 0.0001, 'TEST 4: Handle +Y, drag atas — sisi -Y TETAP DIAM',
         `old=${oldMinusY}, new=${newMinusY}`);
  assert(Math.abs((newPlusY - oldPlusY) - 1) < 0.0001, 'TEST 4: Handle +Y, drag atas — sisi +Y MAJU 1 unit',
         `delta=${newPlusY - oldPlusY}`);
}

console.log('\n=== Summary ===');
console.log(`Pass: ${pass}/${pass + fail}`);
console.log(`Fail: ${fail}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
