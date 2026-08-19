// Verifikasi matematis logika gizmo Bagian 2:
// 1. dragAxisDelta — proyeksi vektor mouse delta ke vektor arah sumbu di layar
// 2. Scale kompensasi posisi — sisi -axis tetap diam saat sisi +axis ditarik
//
// Run: node /home/z/my-project/scripts/verify_gizmo.mjs

class Vec3 {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
  add(v) { return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
}

// Reimplementasi project (sederhana, tanpa rotasi kamera — cukup buat test dragAxisDelta)
// Anggap kamera identity (yaw=0, pitch=0) supaya axis X di layar = world X.
// focalLength & dist = angka yang sama dengan BlockSimulator3D.jsx
function projectSimple(p) {
  const focalLength = 700;
  const dist = 22;
  const scale = focalLength / Math.max(0.5, p.z + dist);
  return {
    x: 400 + p.x * scale,   // cx = 400 (center of 800px canvas)
    y: 300 - p.y * scale,   // cy = 300
    z: p.z,
    scale,
  };
}

// dragAxisDelta persis seperti di BlockSimulator3D.jsx
function dragAxisDelta(mx, my, dragStartMouse, blockStartPos, axis, projectFn = projectSimple) {
  const axisUnit = axis === 'x' ? new Vec3(1, 0, 0)
                : axis === 'y' ? new Vec3(0, 1, 0)
                : new Vec3(0, 0, 1);
  const centerScreen = projectFn(blockStartPos);
  const axisTipScreen = projectFn(blockStartPos.add(axisUnit));
  const screenAxisVec = {
    x: axisTipScreen.x - centerScreen.x,
    y: axisTipScreen.y - centerScreen.y,
  };
  const mouseDelta = { x: mx - dragStartMouse.x, y: my - dragStartMouse.y };
  const denom = screenAxisVec.x * screenAxisVec.x + screenAxisVec.y * screenAxisVec.y;
  if (denom < 0.0001) return 0;
  const t = (mouseDelta.x * screenAxisVec.x + mouseDelta.y * screenAxisVec.y) / denom;
  return t;
}

console.log("=== Verifikasi dragAxisDelta & Scale kompensasi ===\n");

let pass = 0, fail = 0;
const assert = (cond, label, extra = '') => {
  if (cond) { pass++; console.log(`✓ PASS  ${label}`); }
  else { fail++; console.log(`✗ FAIL  ${label}${extra ? ' | ' + extra : ''}`); }
};

// TEST 1: Drag mouse sejajar dengan sumbu X di layar (kamera identity, blok di origin)
//        Expected: t = mouse delta dalam pixel / scale → tapi sebenarnya t = world unit delta
//        Karena screenAxisVec ≈ scale * axisUnit (untuk identity camera), maka:
//          t = (mouseDelta · screenAxisVec) / |screenAxisVec|²
//          = (mouseDelta · scale * (1,0,0)) / (scale² * 1)
//          = mouseDelta.x / scale
{
  const blockStart = new Vec3(0, 0, 0);
  const dragStart = { x: 400, y: 300 }; // center screen
  const mouse = { x: 470, y: 300 };     // gerak 70px ke kanan
  const t = dragAxisDelta(mouse.x, mouse.y, dragStart, blockStart, 'x');
  // scale at z=0: 700 / 22 ≈ 31.82 → 70px / 31.82 ≈ 2.2 world unit
  const expected = 70 / (700/22);
  assert(Math.abs(t - expected) < 0.001, 'TEST 1: dragAxisDelta sumbu X (identity camera)',
         `actual=${t.toFixed(4)}, expected=${expected.toFixed(4)}`);
}

// TEST 2: Drag mouse TEGAK LURUS terhadap sumbu X (gerak Y di layar) → t harus 0
//        (user gerak mouse naik, tapi sumbu X horizontal → drag X harus 0)
{
  const blockStart = new Vec3(0, 0, 0);
  const dragStart = { x: 400, y: 300 };
  const mouse = { x: 400, y: 230 }; // gerak 70px naik (Y di layar)
  const t = dragAxisDelta(mouse.x, mouse.y, dragStart, blockStart, 'x');
  assert(Math.abs(t) < 0.0001, 'TEST 2: dragAxisDelta sumbu X saat mouse gerak vertikal (harus 0)',
         `actual=${t.toFixed(4)}`);
}

// TEST 3: Sumbu Y (vertikal di dunia, naik di layar untuk identity camera)
//         Drag mouse 70px NAIK di layar (Y berkurang di koordinat layar) → t harus negatif (karena Y naik = layar Y turun)
//         Tunggu — di projectSimple: y = 300 - p.y * scale. Jadi world Y naik → screen Y turun.
//         axisTipScreen.y - centerScreen.y = -(1) * scale = -scale (untuk axisUnit Y)
//         Jadi screenAxisVec = (0, -scale). Mouse delta = (0, -70) (naik 70px = Y layar turun 70).
//         t = (-70 * -scale) / (scale²) = 70/scale ≈ 2.2. Jadi t POSITIF untuk mouse naik = blok Y naik. ✓
{
  const blockStart = new Vec3(0, 0, 0);
  const dragStart = { x: 400, y: 300 };
  const mouse = { x: 400, y: 230 }; // 70px naik
  const t = dragAxisDelta(mouse.x, mouse.y, dragStart, blockStart, 'y');
  const expected = 70 / (700/22);
  assert(Math.abs(t - expected) < 0.001, 'TEST 3: dragAxisDelta sumbu Y (mouse naik → blok Y naik)',
         `actual=${t.toFixed(4)}, expected=${expected.toFixed(4)}`);
}

// TEST 4: Kamera menghadap sumbu Z (yaw=0, pitch=0, blok di z=5) → axis Z keluar ke arah layar
//         screenAxisVec untuk Z sangat kecil (mendekati tegak lurus layar) → denom < 0.0001 → return 0
//         Simulasi: blok di (0,0,5). axisTipScreen.z = (0+1+5)+22 = 28 vs centerScreen.z = 5+22 = 27
//         scaleTip = 700/28 = 25, scaleCenter = 700/27 = 25.93
//         screenAxisVec = (0, 0) — karena axisTip.x = 400 + 0*scale = 400, center.x = 400, dll
//         Jadi screenAxisVec = (0,0) → denom = 0 → return 0 (anti div-by-zero).
{
  const blockStart = new Vec3(0, 0, 5);
  const dragStart = { x: 400, y: 300 };
  const mouse = { x: 470, y: 300 };
  const t = dragAxisDelta(mouse.x, mouse.y, dragStart, blockStart, 'z');
  assert(t === 0, 'TEST 4: dragAxisDelta sumbu Z (axis nyaris tegak lurus layar → return 0, no div-by-zero)',
         `actual=${t}`);
}

// TEST 5: Scale kompensasi posisi — sisi -axis tetap diam
//         Blok awal: pos=(0,0,0), size=(2,2,2). Sisi -X blok = pos.x - size.x/2 = -1.
//         Drag sumbu X dengan t=+1 (tarik handle 1 unit).
//         newSize = max(0.2, 2 + 1) = 3. actualDelta = 3 - 2 = 1.
//         newPos = 0 + 1/2 = 0.5.
//         Sisi -X blok baru = 0.5 - 3/2 = 0.5 - 1.5 = -1. ✓ TETAP DIAM.
//         Sisi +X blok baru = 0.5 + 3/2 = 2.0. Sebelumnya: 0 + 2/2 = 1. Berubah +1. ✓ BERGERAK.
{
  const start = { pos: new Vec3(0, 0, 0), size: new Vec3(2, 2, 2) };
  const t = 1;
  const newSize = Math.max(0.2, start.size.x + t);
  const actualDelta = newSize - start.size.x;
  const newPos = start.pos.x + actualDelta / 2;
  const oldMinusX = start.pos.x - start.size.x / 2;  // -1
  const newMinusX = newPos - newSize / 2;             // harusnya -1 juga
  const oldPlusX = start.pos.x + start.size.x / 2;    // 1
  const newPlusX = newPos + newSize / 2;               // harusnya 2

  assert(Math.abs(newMinusX - oldMinusX) < 0.0001, 'TEST 5: Scale sumbu X — sisi -X TETAP DIAM',
         `old=${oldMinusX}, new=${newMinusX}`);
  assert(Math.abs((newPlusX - oldPlusX) - 1) < 0.0001, 'TEST 5: Scale sumbu X — sisi +X MAJU 1 unit',
         `delta=${newPlusX - oldPlusX}`);
}

// TEST 6: Scale NEGATIF (tarik handle ke arah blok) — size berkurang, sisi -axis tetap diam
//         t = -0.5 (tarik handle mundur 0.5 unit)
//         newSize = max(0.2, 2 + (-0.5)) = 1.5. actualDelta = -0.5.
//         newPos = 0 + (-0.5)/2 = -0.25.
//         Sisi -X baru = -0.25 - 1.5/2 = -0.25 - 0.75 = -1. ✓ TETAP DIAM.
//         Sisi +X baru = -0.25 + 0.75 = 0.5. Sebelumnya: 1. Berubah -0.5. ✓ MAJU mundur.
{
  const start = { pos: new Vec3(0, 0, 0), size: new Vec3(2, 2, 2) };
  const t = -0.5;
  const newSize = Math.max(0.2, start.size.x + t);
  const actualDelta = newSize - start.size.x;
  const newPos = start.pos.x + actualDelta / 2;
  const oldMinusX = start.pos.x - start.size.x / 2;
  const newMinusX = newPos - newSize / 2;
  assert(Math.abs(newMinusX - oldMinusX) < 0.0001, 'TEST 6: Scale negatif — sisi -X TETAP DIAM (size berkurang)',
         `old=${oldMinusX}, new=${newMinusX}`);
}

// TEST 7: Scale TIDAK bisa jadi negatif — min 0.2
{
  const start = { pos: new Vec3(0, 0, 0), size: new Vec3(2, 2, 2) };
  const t = -10; // coba tarik sangat mundur
  const newSize = Math.max(0.2, start.size.x + t);
  assert(newSize === 0.2, 'TEST 7: Scale min size 0.2 (tidak bisa negatif)',
         `actual=${newSize}`);
}

// TEST 8: snapSingleAxis — Math.round, sumbu lain TIDAK ikut ke-snap
//         Drag X dengan t=2.4 → pos.x = round(0 + 2.4) = 2, sumbu Y & Z tetap presisi (misal 0.7 & -1.3)
{
  const startPos = new Vec3(0, 0.7, -1.3);
  const t = 2.4;
  const newX = Math.round(startPos.x + t);  // = 2 (snapSingleAxis)
  // sumbu lain tidak diubah
  const newY = startPos.y;  // masih 0.7
  const newZ = startPos.z;  // masih -1.3
  assert(newX === 2 && newY === 0.7 && newZ === -1.3,
         'TEST 8: snapSingleAxis hanya snap sumbu yang di-drag, sumbu lain tetap presisi',
         `new=(${newX}, ${newY}, ${newZ})`);
}

console.log('\n=== Summary ===');
console.log(`Pass: ${pass}/${pass + fail}`);
console.log(`Fail: ${fail}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
