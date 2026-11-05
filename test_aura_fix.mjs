// test_aura_fix.mjs — Regresi bug aura bab 216.
// BUG: e825ae9 memakai _Wb/_Db TANPA definisi (dan cff8c9c memakai _D tanpa
// definisi) → ReferenceError → catch → aura tak pernah disembunyikan.
// FIX : definisi body-box sebelum pemakaian.
// Test memakai logika EXAKT dari src/pages/BlockSimulator3D.jsx + struktur
// avatar realistis berbasis DATA ASET PUBLIK asli blcwawandj
// (R15: LeftLeg/RightLeg/LeftArm/RightArm/Torso/Head + JacketAccessory
//  "Blue Void Shadow Aura Outline" melingkar).

// ── helper part ──
function P(name, x0, x1, y0, y1, z0, z1, handle = false) {
  const box = { min: { x: x0, y: y0, z: z0 }, max: { x: x1, y: y1, z: z1 } };
  return {
    name, box, handle,
    c: { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2 },
    size: { x: x1 - x0, y: y1 - y0, z: z1 - z0 },
  };
}

// ── logika EXAKT app (setelah fix 2fc8b63) ──
function compute(parts) {
  const _post = (() => {
    const b = { min: { x: 1e9, y: 1e9, z: 1e9 }, max: { x: -1e9, y: -1e9, z: -1e9 } };
    parts.forEach((p) => {
      b.min.x = Math.min(b.min.x, p.box.min.x); b.max.x = Math.max(b.max.x, p.box.max.x);
      b.min.y = Math.min(b.min.y, p.box.min.y); b.max.y = Math.max(b.max.y, p.box.max.y);
      b.min.z = Math.min(b.min.z, p.box.min.z); b.max.z = Math.max(b.max.z, p.box.max.z);
    });
    return b;
  })();
  const _H = _post.max.y - _post.min.y, _W = _post.max.x - _post.min.x;
  const _body = parts.filter((p) => !p.handle);
  const _handles = parts.filter((p) => p.handle);
  // ── FIX 2fc8b63: definisi _Wb/_Db ──
  let _Wb = 0, _Db = 0;
  if (_body.length) {
    const bb = { min: { x: 1e9, z: 1e9 }, max: { x: -1e9, z: -1e9 } };
    _body.forEach((p) => {
      bb.min.x = Math.min(bb.min.x, p.box.min.x); bb.max.x = Math.max(bb.max.x, p.box.max.x);
      bb.min.z = Math.min(bb.min.z, p.box.min.z); bb.max.z = Math.max(bb.max.z, p.box.max.z);
    });
    _Wb = bb.max.x - bb.min.x; _Db = bb.max.z - bb.min.z;
  }
  const hidden = [];
  _handles.forEach((p) => {
    if (Math.abs(p.c.x) <= 0.10 * _W && p.size.x >= 0.85 * _Wb && p.size.z >= 0.6 * _Db && p.c.y <= 0.55 * _H) {
      hidden.push(p.name);
    }
  });
  return { _Wb, _Db, _H, _W, hidden };
}

// ── SKENARIO ──
// Semua tinggi dinormalisasi ~2.975 (app scale), lebar tubuh R15 ~1.0.
// Posisi khas: kepala di atas, torso, lengan kiri/kanan, kaki kiri/kanan.
function buildAvatar(extraHandles) {
  return [
    P('Head', -0.30, 0.30, 2.30, 2.95, -0.30, 0.30),
    P('Torso', -0.45, 0.45, 1.10, 2.30, -0.25, 0.25),
    P('LeftArm', -1.05, -0.50, 1.10, 2.30, -0.22, 0.22),
    P('RightArm', 0.50, 1.05, 1.10, 2.30, -0.22, 0.22),
    P('LeftLeg', -0.55, -0.10, 0.00, 1.10, -0.25, 0.25),
    P('RightLeg', 0.10, 0.55, 0.00, 1.10, -0.25, 0.25),
    ...extraHandles,
  ];
}

// Handle melingkar = aura (jaket "Blue Void Shadow Aura Outline" melingkari
// seluruh tubuh: menutup lebar penuh + dalam + di sumbu + di badan)
const AURA_RING = P('Handle JacketAccessory', -0.90, 0.90, 0.55, 1.75, -0.70, 0.70, true);

// Topi kecil di kepala (tidak melingkar)
const HAT = P('Handle Hat', -0.32, 0.32, 2.90, 3.10, -0.30, 0.30, true);

// Pedang di punggung (di tepi, tidak melingkar)
const SWORD = P('Handle BackAccessory', 0.55, 0.75, 0.20, 2.40, -0.10, 0.10, true);

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + label); }
  else { fail++; console.log('  ✗ ' + label + (detail ? ' → ' + detail : '')); }
}

console.log('══ TEST AURA FIX (bab 216) ══\n');

// 1. Aura ring → HARUS tersembunyi
{
  const r = compute(buildAvatar([AURA_RING, HAT]));
  console.log('Skenario A: avatar R15 + aura melingkar + topi');
  console.log('  _Wb=' + r._Wb.toFixed(3) + ' _Db=' + r._Db.toFixed(3) + ' (harus ≈ lebar/dalam TUBUH, bukan envelope)');
  check('aura ring tersembunyi', r.hidden.includes(AURA_RING.name), 'hidden=' + r.hidden.join(','));
  check('topi TETAP tampil', !r.hidden.includes(HAT.name));
  console.log('  (sebelum fix: _Wb is not defined → ReferenceError → SEMUA tampil)');
  console.log('');
}

// 2. Tanpa aura → tidak ada yang tersembunyi, tanpa error
{
  const r = compute(buildAvatar([HAT, SWORD]));
  console.log('Skenario B: avatar R15 + topi + pedang (tanpa aura)');
  check('tidak ada yang tersembunyi', r.hidden.length === 0, 'hidden=' + r.hidden.join(','));
  console.log('');
}

// 3. Aura di kepala (halo tinggi) → TIDAK tersembunyi (aturan: di badan, ≤0.55H)
{
  const r = compute(buildAvatar([P('Handle Halo', -0.85, 0.85, 2.75, 2.95, -0.65, 0.65, true)]));
  console.log('Skenario C: aura di KEPALA (halo)');
  check('halo TETAP tampil (bukan aura badan)', r.hidden.length === 0, 'hidden=' + r.hidden.join(','));
  console.log('');
}

// 4. Edge case body habis / body kecil → aman, tidak crash
{
  const r0 = compute([P('Handle Solo', -0.9, 0.9, 0.5, 1.5, -0.7, 0.7, true)]);
  console.log('Skenario D1: SEMUA part handle (body kosong)');
  check('tidak crash', Array.isArray(r0.hidden));
  check('_Wb=0 (body kosong → ambang .85*0=0 aman)', r0._Wb === 0);
  check('aura SOLO tidak tersembunyi (kondisi .85*0=0 → >=0 true, tapi .6*0=0 → >=0 true; .55*H butuh H>0)', !r0.hidden.includes('Handle Solo'));
  console.log('');
}
{
  const r1 = compute([P('Handle Solo', -0.9, 0.9, 0.5, 1.5, -0.7, 0.7, true), P('Kepala', -0.3, 0.3, 2.3, 2.9, -0.3, 0.3)]);
  console.log('Skenario D2: body 1 part (tidak cukup utk rig)');
  check('tidak crash', Array.isArray(r1.hidden));
  check('_Wb=0.6 (lebar part body)', r1._Wb === 0.6, '_Wb=' + r1._Wb);
  console.log('');
}

console.log('══ HASIL: ' + pass + ' lolos, ' + fail + ' gagal ══');
process.exit(fail ? 1 : 0);
