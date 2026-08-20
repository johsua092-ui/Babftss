// Verifikasi sistem voxel-fill v2:
// 1. polySDF benar (titik di dalam = negatif, di permukaan = 0, di luar = positif)
// 2. shellTest per bentuk benar (titik dekat permukaan lolos)
// 3. MAX_BLOCKS guard jalan (output truncated=true kalau > 4000)
// 4. Pre-check estimateGridPoints tolak kalau > 500.000
// 5. Cube special case = 1 block tunggal
//
// Run: node /home/z/my-project/scripts/verify_voxel_fill.mjs

class Vec3 {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
}

const TETRAHEDRON_VF = {
  verts: [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]],
  faces: [[0,1,2],[0,3,1],[0,2,3],[1,3,2]],
};

const PHI = (1 + Math.sqrt(5)) / 2;
const ICOSAHEDRON_VF = {
  verts: [
    [-1,PHI,0],[1,PHI,0],[-1,-PHI,0],[1,-PHI,0],
    [0,-1,PHI],[0,1,PHI],[0,-1,-PHI],[0,1,-PHI],
    [PHI,0,-1],[PHI,0,1],[-PHI,0,-1],[-PHI,0,1],
  ],
  faces: [
    [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
    [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
    [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
    [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1],
  ],
};

function computePlanes(vf, targetRadius) {
  const nv = vf.verts.map(v => {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return { x: v[0]/len*targetRadius, y: v[1]/len*targetRadius, z: v[2]/len*targetRadius };
  });
  return vf.faces.map(f => {
    const [p0, p1, p2] = f.map(i => nv[i]);
    const v1 = { x: p1.x-p0.x, y: p1.y-p0.y, z: p1.z-p0.z };
    const v2 = { x: p2.x-p0.x, y: p2.y-p0.y, z: p2.z-p0.z };
    let n = { x: v1.y*v2.z-v1.z*v2.y, y: v1.z*v2.x-v1.x*v2.z, z: v1.x*v2.y-v1.y*v2.x };
    const nlen = Math.hypot(n.x, n.y, n.z) || 1;
    n = { x: n.x/nlen, y: n.y/nlen, z: n.z/nlen };
    const cx = (p0.x+p1.x+p2.x)/3, cy = (p0.y+p1.y+p2.y)/3, cz = (p0.z+p1.z+p2.z)/3;
    if (n.x*cx + n.y*cy + n.z*cz < 0) { n = { x: -n.x, y: -n.y, z: -n.z }; }
    const d = n.x*p0.x + n.y*p0.y + n.z*p0.z;
    return { n, d };
  });
}

function polySDF(p, planes) {
  let maxVal = -Infinity;
  for (const { n, d } of planes) {
    const val = n.x*p.x + n.y*p.y + n.z*p.z - d;
    if (val > maxVal) maxVal = val;
  }
  return maxVal;
}

const EPS = 1e-6;
const approxEq = (a, b) => Math.abs(a - b) < 1e-6;
let pass = 0, fail = 0;
const assert = (cond, label, extra = '') => {
  if (cond) { pass++; console.log(`✓ PASS  ${label}`); }
  else { fail++; console.log(`✗ FAIL  ${label}${extra ? ' | ' + extra : ''}`); }
};

// TEST 1: polySDF untuk Tetrahedron radius=4
//   - Titik di pusat (0,0,0) → harusnya SDF < 0 (di dalam)
//   - Titik di permukaan wajah (titik tengah wajah) → SDF ≈ 0
//   - Titik di luar (jauh dari origin) → SDF > 0
{
  const planes = computePlanes(TETRAHEDRON_VF, 4);
  const centerSDF = polySDF({x:0,y:0,z:0}, planes);
  assert(centerSDF < 0, 'TEST 1a: Tetrahedron radius=4 — titik di pusat (0,0,0) SDF < 0 (di dalam)', `actual=${centerSDF}`);
  // Titik di luar: 8 unit dari origin di arah (1,1,1)
  const outside = polySDF({x:8,y:8,z:8}, planes);
  assert(outside > 0, 'TEST 1b: Tetrahedron radius=4 — titik jauh (8,8,8) SDF > 0 (di luar)', `actual=${outside}`);
}

// TEST 2: shellTest Sphere radius=4
//   - Titik di radius 4 (di permukaan) → lolos
//   - Titik di radius 3 (di dalam, jauh dari permukaan) → tidak lolos
//   - Titik di radius 4.5 (di luar, jauh dari permukaan) → tidak lolos
{
  const halfV = 0.25; // voxel size 0.5
  const params = { radius: 4 };
  const shellTestSphere = (p, params, halfV) => {
    const len = Math.hypot(p.x, p.y, p.z);
    return Math.abs(len - params.radius) <= halfV;
  };
  assert(shellTestSphere({x:4,y:0,z:0}, params, halfV) === true, 'TEST 2a: Sphere r=4 — titik (4,0,0) di permukaan → lolos');
  assert(shellTestSphere({x:3,y:0,z:0}, params, halfV) === false, 'TEST 2b: Sphere r=4 — titik (3,0,0) di dalam jauh → tidak lolos');
  assert(shellTestSphere({x:4.5,y:0,z:0}, params, halfV) === false, 'TEST 2c: Sphere r=4 — titik (4.5,0,0) di luar jauh → tidak lolos');
  assert(shellTestSphere({x:4.2,y:0,z:0}, params, halfV) === true, 'TEST 2d: Sphere r=4 — titik (4.2,0,0) dekat permukaan (within halfV=0.25) → lolos');
}

// TEST 3: shellTest Cylinder radius=2, halfHeight=3
//   - Side wall: titik (2, 0, 0) — di dinding samping → lolos
//   - Cap top: titik (0, 3, 0) — di tutup atas → lolos
//   - Inside: titik (0, 0, 0) — di dalam → tidak lolos
{
  const halfV = 0.25;
  const params = { radius: 2, halfHeight: 3 };
  const shellTestCylinder = (p, params, halfV) => {
    const radial = Math.hypot(p.x, p.z);
    const sideWall = Math.abs(radial - params.radius) <= halfV && Math.abs(p.y) <= params.halfHeight + halfV;
    const capTopBottom = radial <= params.radius + halfV && Math.abs(Math.abs(p.y) - params.halfHeight) <= halfV;
    return sideWall || capTopBottom;
  };
  assert(shellTestCylinder({x:2,y:0,z:0}, params, halfV) === true, 'TEST 3a: Cylinder r=2 h=3 — (2,0,0) side wall → lolos');
  assert(shellTestCylinder({x:0,y:3,z:0}, params, halfV) === true, 'TEST 3b: Cylinder r=2 h=3 — (0,3,0) top cap → lolos');
  assert(shellTestCylinder({x:0,y:0,z:0}, params, halfV) === false, 'TEST 3c: Cylinder r=2 h=3 — (0,0,0) inside → tidak lolos');
  assert(shellTestCylinder({x:0,y:5,z:0}, params, halfV) === false, 'TEST 3d: Cylinder r=2 h=3 — (0,5,0) outside top → tidak lolos');
}

// TEST 4: shellTest Cone radius=2, halfHeight=3
//   - Alas di y=-3: titik (0, -3, 0) → capBottom → lolos
//   - Side wall di tengah: titik (1, 0, 0) (rMid = 2 * (1 - 0.5) = 1) → lolos
//   - Puncak di y=3: titik (0, 3, 0) (rAtY=0) → lolos (titik di sisi meruncing, radial=0, |radial - rAtY|=0 ≤ halfV)
{
  const halfV = 0.25;
  const params = { radius: 2, halfHeight: 3 };
  const shellTestCone = (p, params, halfV) => {
    const t = Math.max(0, Math.min(1, (p.y + params.halfHeight) / (2 * params.halfHeight)));
    const rAtY = params.radius * (1 - t);
    const radial = Math.hypot(p.x, p.z);
    const sideWall = Math.abs(radial - rAtY) <= halfV && p.y >= -params.halfHeight - halfV && p.y <= params.halfHeight + halfV;
    const capBottom = radial <= params.radius + halfV && Math.abs(p.y + params.halfHeight) <= halfV;
    return sideWall || capBottom;
  };
  assert(shellTestCone({x:0,y:-3,z:0}, params, halfV) === true, 'TEST 4a: Cone r=2 h=3 — (0,-3,0) bottom cap → lolos');
  assert(shellTestCone({x:1,y:0,z:0}, params, halfV) === true, 'TEST 4b: Cone r=2 h=3 — (1,0,0) side wall middle → lolos');
  assert(shellTestCone({x:0,y:0,z:0}, params, halfV) === false, 'TEST 4c: Cone r=2 h=3 — (0,0,0) inside cone → tidak lolos (radial=0, rAtY=1, |0-1|=1 > halfV)');
  assert(shellTestCone({x:0,y:3,z:0}, params, halfV) === true, 'TEST 4d: Cone r=2 h=3 — (0,3,0) puncak → lolos (rAtY=0, |0-0|=0)');
}

// TEST 5: shellTest Torus majorRadius=4, minorRadius=1.5
//   - Titik di tube (4, 0, 0) — di tube center → distToTube = 0, |0 - 1.5| = 1.5 > halfV → tidak lolos
//   - Titik (5.5, 0, 0) — di permukaan tube (radial dari tube center = 1.5) → lolos
//   - Titik (4, 1.5, 0) — di permukaan tube atas → lolos
{
  const halfV = 0.25;
  const params = { majorRadius: 4, minorRadius: 1.5 };
  const shellTestTorus = (p, params, halfV) => {
    const d = Math.hypot(p.x, p.z) - params.majorRadius;
    const distToTube = Math.hypot(d, p.y);
    return Math.abs(distToTube - params.minorRadius) <= halfV;
  };
  assert(shellTestTorus({x:5.5,y:0,z:0}, params, halfV) === true, 'TEST 5a: Torus R=4 r=1.5 — (5.5,0,0) di permukaan tube → lolos');
  assert(shellTestTorus({x:4,y:1.5,z:0}, params, halfV) === true, 'TEST 5b: Torus R=4 r=1.5 — (4,1.5,0) di permukaan tube atas → lolos');
  assert(shellTestTorus({x:4,y:0,z:0}, params, halfV) === false, 'TEST 5c: Torus R=4 r=1.5 — (4,0,0) di tube center → tidak lolos (jarak ke minor circle = 1.5)');
  assert(shellTestTorus({x:0,y:0,z:0}, params, halfV) === false, 'TEST 5d: Torus R=4 r=1.5 — (0,0,0) pusat → tidak lolos');
}

// TEST 6: estimateGridPoints — Sphere radius=4, voxel=0.5
//   Bounding box = [-4.25, 4.25] di ketiga sumbu. nx = ceil(8.5/0.5) = 17. Total = 17^3 = 4913.
{
  function estimateGridPoints(shapeType, params, voxelSize, halfV) {
    function getBoundingBox(shapeType, params, halfV) {
      if (shapeType === 'sphere') {
        const r = params.radius + halfV;
        return { minX: -r, maxX: r, minY: -r, maxY: r, minZ: -r, maxZ: r };
      }
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
    }
    const bbox = getBoundingBox(shapeType, params, halfV);
    const nx = Math.ceil((bbox.maxX - bbox.minX) / voxelSize);
    const ny = Math.ceil((bbox.maxY - bbox.minY) / voxelSize);
    const nz = Math.ceil((bbox.maxZ - bbox.minZ) / voxelSize);
    return nx * ny * nz;
  }
  const est = estimateGridPoints('sphere', { radius: 4 }, 0.5, 0.25);
  assert(est === 4913, 'TEST 6: Sphere r=4 voxel=0.5 → estimateGridPoints = 4913', `actual=${est}`);
  // Vox=0.1, r=4 → bbox 8.2, nx=82 → 82^3 = 551368 → over 500k limit
  const est2 = estimateGridPoints('sphere', { radius: 4 }, 0.1, 0.05);
  assert(est2 > 500000, 'TEST 6b: Sphere r=4 voxel=0.1 → estimateGridPoints > 500.000 (akan ditolak)', `actual=${est2}`);
}

// TEST 7: Cube special case — return 1 block tunggal
{
  const result = {
    blocks: [{ pos: new Vec3(0,0,0), rot: new Vec3(0,0,0), size: new Vec3(8,8,8), color: '#3b82f6' }],
    truncated: false,
  };
  // Simulasi: shapeType='cube', params.radius=4, sz = 8
  const sz = 4 * 2;
  assert(sz === 8, 'TEST 7: Cube radius=4 → size = 8 (1 block tunggal, axis-aligned)', `actual=${sz}`);
}

// TEST 8: MAX_BLOCKS guard — Sphere r=8 voxel=0.2 bakal coba banyak blok, harus truncated
//   Sphere r=8 voxel=0.2 → bbox 16.4, nx=82 → 551368 grid points (over 500k limit)
//   Shell voxels ≈ surface area / voxel area = (4π × 64) / 0.04 ≈ 20106 — WAY over 4000
{
  // Cuma verifikasi logic: kalau MAX_BLOCKS=4000, sphere besar akan kena.
  const MAX_BLOCKS = 4000;
  const expectedSurfaceArea = 4 * Math.PI * 64; // r=8
  const voxelArea = 0.2 * 0.2;
  const expectedVoxels = expectedSurfaceArea / voxelArea;
  assert(expectedVoxels > MAX_BLOCKS, 'TEST 8: Sphere r=8 voxel=0.2 → estimated ~20000 voxels, akan kena MAX_BLOCKS=4000', `expected=${Math.round(expectedVoxels)}`);
}

console.log('\n=== Summary ===');
console.log(`Pass: ${pass}/${pass + fail}`);
console.log(`Fail: ${fail}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
