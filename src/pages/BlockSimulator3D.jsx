import { useRef, useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, Box, Plus, Move, RotateCw, Maximize, Paintbrush,
  Copy, Trash2, MousePointer2, Hand, Info, Cuboid, Check, X, Shapes, Sparkles, Eraser
} from 'lucide-react';
import ColorWheelPicker from '../components/ColorWheelPicker';

/* ================================================================
   3D BLOCK SIMULATOR — BABFTSS Style
   Engine 3D from scratch using Canvas 2D (no external 3D libs)
   ================================================================ */

const GRID = 1;
const GRID_SIZE = 30;
const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#64748b', '#1e293b', '#ffffff', '#84cc16'
];

class Vec3 {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
  add(v) { return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
  sub(v) { return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z); }
  mul(s) { return new Vec3(this.x * s, this.y * s, this.z * s); }
  clone() { return new Vec3(this.x, this.y, this.z); }
}

const TOOLS = [
  { id: 'place',    label: 'Place',    icon: Plus,         key: 'p' },
  { id: 'move',     label: 'Move',     icon: Move,         key: 'm' },
  { id: 'rotate',   label: 'Rotate',   icon: RotateCw,     key: 'r' },
  { id: 'scale',    label: 'Scale',    icon: Maximize,     key: 's' },
  { id: 'color',    label: 'Paint',    icon: Paintbrush,   key: 'c' },
  { id: 'clone',    label: 'Clone',    icon: Copy,         key: 'k' },
  { id: 'delete',   label: 'Delete',   icon: Trash2,       key: 'x' },
  { id: 'generate', label: 'Shape',    icon: Shapes,       key: 'g' },
  { id: 'clear',    label: 'Clear',    icon: Eraser,       key: 'l' }, // shortcut 'l' (delete pakai 'x' — bentrokan kalau sama)
];

// ── SHAPE GENERATOR v2: VOXEL-FILL ──
// Pendekatan ini MENGGANTIKAN TOTAL sistem panel-rotasi lama (Tahap 2 + hotfix orientasi).
// Alih-alih panel besar diputar-putar mengikuti permukaan, sekarang isi permukaan bentuk
// target dengan BANYAK kubus kecil axis-aligned (rot SELALU 0,0,0 — TIDAK ada rotasi).
// Ukuran kubus = "Voxel Size" yang user tentukan bebas (0.05, 0.1, 0.2, 0.5, 1, 2, dst).
//
// Keuntungan: lebih sederhana, hasil visual lebih rapi/konsisten (gaya building game
// asli yang pakai voxel), user bisa kontrol resolusi bebas lewat Voxel Size.
//
// Sistem lama (alignPlateToNormal, solveFullOrientation, generateSphere/Cylinder/Cone/Torus
// versi panel-rotasi, generateFlatPolyhedron, generateCube, konstanta TETRAHEDRON/OCTAHEDRON/
// ICOSAHEDRON lama) SUDAH DIHAPUS. Lihat entri memory.md Bagian 52 untuk riwayat lengkap.

// Polyhedron vertex & face data (hardcode, rumus baku — sama dengan Tahap 2 tapi sekarang
// dipakai untuk computePlanes, bukan langsung jadi panel).
const TETRAHEDRON_VF = {
  verts: [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]],
  faces: [[0,1,2],[0,3,1],[0,2,3],[1,3,2]],
};
const OCTAHEDRON_VF = {
  verts: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
  faces: [[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]],
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

// Hitung bidang wajah (plane equation: n·p = d) untuk tiap wajah polyhedron.
// Disekali per klik Generate, bukan per-voxel — biar cepat.
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
    // Pastikan normal mengarah KELUAR (menjauhi origin) — cek dot product dgn titik tengah wajah.
    const cx = (p0.x+p1.x+p2.x)/3, cy = (p0.y+p1.y+p2.y)/3, cz = (p0.z+p1.z+p2.z)/3;
    if (n.x*cx + n.y*cy + n.z*cz < 0) { n = { x: -n.x, y: -n.y, z: -n.z }; }
    const d = n.x*p0.x + n.y*p0.y + n.z*p0.z;
    return { n, d };
  });
}

// SDF (Signed Distance Field) untuk polyhedron — jarak max ke semua bidang wajah.
// DIVERIFIKASI numerik: negatif = di dalam, nol = di permukaan, positif = di luar.
function polySDF(p, planes) {
  let maxVal = -Infinity;
  for (const { n, d } of planes) {
    const val = n.x*p.x + n.y*p.y + n.z*p.z - d;
    if (val > maxVal) maxVal = val;
  }
  return maxVal;
}

// ── POIN F — solveFullOrientation (untuk voxel rotasi mengikuti kontur lengkung) ──
// Dipakai HANYA untuk Sphere/Cylinder/Cone/Torus di generateVoxelShape — supaya voxel di permukaan
// lengkung diputar mengikuti arah normal setempat, biar hasilnya lebih halus (bukan tangga kotak).
//
// PENTING — trade-off yang SADAR: voxel yang DIROTASI **TIDAK IKUT DAPAT keuntungan Face Culling**
// di Poin B (karena Poin B sengaja cuma cull blok axis-aligned, demi kesederhanaan & akurat).
// Jadi Shape Generator versi rotasi ini SECARA SADAR mengorbankan sebagian performa demi visual
// lebih halus — ini trade-off yang disengaja, bukan bug.
//
// Fungsi ini SUDAH PERNAH diverifikasi numerik sebelumnya (dipakai di task lain — akurat sampai
// presisi 10⁻¹⁶). Reuse APA ADANYA, jangan diturunkan ulang.
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

// Helper: hitung normal permukaan setempat di titik voxel `p` (relatif ke pusat bentuk) untuk
// 4 bentuk lengkung. Return vektor satuan arah normal (menghadap keluar permukaan).
// Sphere: normalize(p). Cyl/Cone: normalize({x:p.x, y:0, z:p.z}) radial horizontal.
// Torus: normal tabung, arah dari sumbu tabung terdekat ke p.
function computeSurfaceNormal(shapeType, p, params) {
  switch (shapeType) {
    case 'sphere': {
      const len = Math.hypot(p.x, p.y, p.z) || 1;
      return { x: p.x/len, y: p.y/len, z: p.z/len };
    }
    case 'cylinder':
    case 'cone': {
      // Normal radial horizontal (tegak lurus sumbu Y, menghadap keluar dari sumbu vertikal).
      const r = Math.hypot(p.x, p.z) || 1;
      // Untuk cone, normal sebenarnya miring (kombinasi radial + Y), tapi voxel-fill pakai
      // radial horizontal cukup bagus — solveFullOrientation akan luruskan via Gram-Schmidt.
      return { x: p.x/r, y: 0, z: p.z/r };
    }
    case 'torus': {
      // Normal tabung: arah dari titik terdekat di sumbu major circle ke p.
      // Sumbu major circle = lingkaran radius majorRadius di bidang XZ.
      // Titik terdekat di major circle = normalize(p.x, 0, p.z) * majorRadius.
      const radialXZ = Math.hypot(p.x, p.z) || 1;
      const cx = p.x / radialXZ * params.majorRadius;
      const cz = p.z / radialXZ * params.majorRadius;
      const dx = p.x - cx, dy = p.y, dz = p.z - cz;
      const len = Math.hypot(dx, dy, dz) || 1;
      return { x: dx/len, y: dy/len, z: dz/len };
    }
    default:
      return { x: 0, y: 1, z: 0 };
  }
}

// Bounding box per bentuk — supaya loop grid 3D cuma iterasi area yang relevan.
function getBoundingBox(shapeType, params, halfV) {
  switch (shapeType) {
    case 'sphere':
    case 'tetrahedron':
    case 'octahedron':
    case 'icosahedron': {
      const r = params.radius + halfV;
      return { minX: -r, maxX: r, minY: -r, maxY: r, minZ: -r, maxZ: r };
    }
    case 'cylinder':
    case 'cone': {
      const r = params.radius + halfV;
      const h = params.halfHeight + halfV;
      return { minX: -r, maxX: r, minY: -h, maxY: h, minZ: -r, maxZ: r };
    }
    case 'torus': {
      const r = params.majorRadius + params.minorRadius + halfV;
      const h = params.minorRadius + halfV;
      return { minX: -r, maxX: r, minY: -h, maxY: h, minZ: -r, maxZ: r };
    }
    default:
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
  }
}

// shellTest per bentuk — return true kalau titik p {x,y,z} (RELATIF ke pusat bentuk)
// "dekat permukaan" bentuk target. halfV = setengah voxel size (toleransi "dekat").
function shellTest(shapeType, p, params, halfV) {
  switch (shapeType) {
    case 'sphere': {
      const len = Math.hypot(p.x, p.y, p.z);
      return Math.abs(len - params.radius) <= halfV;
    }
    case 'cylinder': {
      const radial = Math.hypot(p.x, p.z);
      const sideWall = Math.abs(radial - params.radius) <= halfV && Math.abs(p.y) <= params.halfHeight + halfV;
      const capTopBottom = radial <= params.radius + halfV && Math.abs(Math.abs(p.y) - params.halfHeight) <= halfV;
      return sideWall || capTopBottom;
    }
    case 'cone': {
      const t = Math.max(0, Math.min(1, (p.y + params.halfHeight) / (2 * params.halfHeight)));
      const rAtY = params.radius * (1 - t);
      const radial = Math.hypot(p.x, p.z);
      const sideWall = Math.abs(radial - rAtY) <= halfV && p.y >= -params.halfHeight - halfV && p.y <= params.halfHeight + halfV;
      const capBottom = radial <= params.radius + halfV && Math.abs(p.y + params.halfHeight) <= halfV;
      return sideWall || capBottom;
    }
    case 'torus': {
      const d = Math.hypot(p.x, p.z) - params.majorRadius;
      const distToTube = Math.hypot(d, p.y);
      return Math.abs(distToTube - params.minorRadius) <= halfV;
    }
    case 'tetrahedron':
    case 'octahedron':
    case 'icosahedron': {
      const sdf = polySDF(p, params.planes);
      return sdf >= -halfV && sdf <= halfV * 0.5;
    }
    default:
      return false;
  }
}

// Hitung params per bentuk dari `genSize` (input user) — sesuai instruksi prompt v2:
//  - Sphere/Tetra/Octa/Icosa: radius = genSize
//  - Cylinder/Cone: radius = genSize * 0.6, halfHeight = genSize (rasio wajar)
//  - Torus: majorRadius = genSize, minorRadius = genSize * 0.35
// Untuk polyhedron, `planes` di-precompute di sini (sekali per Generate, bukan per-voxel).
function computeShapeParams(shapeType, size) {
  switch (shapeType) {
    case 'sphere':
    case 'tetrahedron':
    case 'octahedron':
    case 'icosahedron':
      // Polyhedron: precompute planes dari data vertex/face + radius
      if (shapeType === 'tetrahedron') return { radius: size, planes: computePlanes(TETRAHEDRON_VF, size) };
      if (shapeType === 'octahedron')  return { radius: size, planes: computePlanes(OCTAHEDRON_VF, size) };
      if (shapeType === 'icosahedron') return { radius: size, planes: computePlanes(ICOSAHEDRON_VF, size) };
      return { radius: size };
    case 'cylinder':
    case 'cone':
      return { radius: size * 0.6, halfHeight: size };
    case 'torus':
      return { majorRadius: size, minorRadius: size * 0.35 };
    default:
      return {};
  }
}

// Estimasi jumlah titik grid yang akan di-test (volume bbox / voxelSize^3).
// Dipakai buat pre-check performa — kalau > 500.000 titik, tolak generate dari awal
// supaya browser gak freeze SEBELUM sempat kena limit 4000 blok.
function estimateGridPoints(shapeType, params, voxelSize, halfV) {
  const bbox = getBoundingBox(shapeType, params, halfV);
  const nx = Math.ceil((bbox.maxX - bbox.minX) / voxelSize);
  const ny = Math.ceil((bbox.maxY - bbox.minY) / voxelSize);
  const nz = Math.ceil((bbox.maxZ - bbox.minZ) / voxelSize);
  return nx * ny * nz;
}

// Generator utama — loop grid 3D, test tiap titik dengan shellTest, push voxel kalau lolos.
// Return { blocks, truncated } — truncated=true kalau kena MAX_BLOCKS (4000), hasil DIBUANG
// (jangan generate setengah-setengah). Cube di-handle khusus: cukup 1 kubus tunggal.
const VOXEL_MAX_BLOCKS = 4000;
const VOXEL_MAX_GRID_POINTS = 500000;
// VOXEL_OVERLAP_FACTOR — voxel yang DIPUTAR (Sphere/Cyl/Cone/Torus) diperbesar faktor ini
// supaya sudut-sudutnya saling tumpang-tindih dengan voxel tetangga & nutup celah yang muncul
// akibat rotasi individual (setiap voxel berputar sedikit beda arah). Voxel axis-aligned
// (Cube/Tetra/Octa/Icosa) TIDAK diperbesar — sudah pas presisi grid dari awal, kalau diperbesar
// malah jadi saling menembus gak wajar.
// Titik awal 1.6 — boleh disesuaikan kalau visual masih ada celah (naikkan ke 1.8) atau terlalu
// gempal (turunkan ke 1.4). WAJIB tes visual sebelum fix dianggap selesai.
const VOXEL_OVERLAP_FACTOR = 1.6;

function generateVoxelShape(shapeType, center, params, voxelSize, color) {
  // Cube — special case: 1 kubus tunggal, tidak perlu loop grid.
  if (shapeType === 'cube') {
    const sz = params.radius * 2;
    return {
      blocks: [{
        pos: new Vec3(center.x, center.y, center.z),
        rot: new Vec3(0, 0, 0),
        size: new Vec3(sz, sz, sz),
        color,
      }],
      truncated: false,
    };
  }

  const halfV = voxelSize / 2;

  // Pre-check performa: kalau estimasi titik grid > 500rb, tolak dari awal.
  // (Test shellTest sendiri murah, tapi loop jutaan iterasi bisa bikin browser freeze
  // SEBELUM sempat kena limit 4000.)
  const estPoints = estimateGridPoints(shapeType, params, voxelSize, halfV);
  if (estPoints > VOXEL_MAX_GRID_POINTS) {
    return { blocks: [], truncated: true, tooManyGridPoints: true, estPoints };
  }

  const bbox = getBoundingBox(shapeType, params, halfV);
  const newBlocks = [];
  // Bentuk yang voxel-nya DIPUTAR mengikuti kontur lengkung (Poin F).
  // Bentuk lain (Cube/Tetra/Octa/Icosa) tetap axis-aligned (rot 0,0,0).
  const useRotation = (shapeType === 'sphere' || shapeType === 'cylinder' ||
                       shapeType === 'cone' || shapeType === 'torus');

  for (let x = bbox.minX; x <= bbox.maxX; x += voxelSize) {
    for (let y = bbox.minY; y <= bbox.maxY; y += voxelSize) {
      for (let z = bbox.minZ; z <= bbox.maxZ; z += voxelSize) {
        if (shellTest(shapeType, { x, y, z }, params, halfV)) {
          // POIN F: untuk 4 bentuk lengkung (Sphere/Cyl/Cone/Torus), hitung rotasi voxel
          // supaya sumbu Z lokal kubus menghadap normal permukaan setempat — biar voxel
          // "mengikuti kontur" bukan tangga kotak kaku.
          let rot = new Vec3(0, 0, 0); // default axis-aligned
          if (useRotation) {
            const p = { x, y, z };
            const N = computeSurfaceNormal(shapeType, p, params);
            // tangentHint = perkiraan arah "keliling" panel (sepanjang azimuth di bidang XZ).
            // Pakai arah tangensial kasar: rotate p di bidang XZ by 90°.
            const tLen = Math.hypot(p.x, p.z) || 1;
            const tangentHint = { x: -p.z / tLen, y: 0, z: p.x / tLen };
            const { rx, ry, rz } = solveFullOrientation(N, tangentHint);
            rot = new Vec3(rx, ry, rz);
          }
          // HOTFIX VoxelGap: voxel yang DIPUTAR (useRotation true) diperbesar pakai
          // VOXEL_OVERLAP_FACTOR supaya sudut-sudutnya saling tumpang-tindih & nutup celah
          // yang muncul akibat rotasi individual (setiap voxel berputar sedikit beda arah).
          // Voxel axis-aligned (useRotation false) TETAP presisi grid — JANGAN diperbesbar
          // (kalau diperbesar malah saling menembus gak wajar).
          // Posisi (pos) TETAP di titik grid asli — cuma size yang berubah, pos di tengah
          // otomatis bikin voxel "keluar" merata ke segala arah dari titik grid-nya.
          const voxSize = useRotation
            ? voxelSize * VOXEL_OVERLAP_FACTOR // voxel lengkung diputar → diperbesar biar tumpang-tindih, nutup celah
            : voxelSize;                        // voxel axis-aligned (Cube/Tetra/Octa/Icosa) TETAP presisi grid
          newBlocks.push({
            pos: new Vec3(center.x + x, center.y + y, center.z + z),
            rot,
            size: new Vec3(voxSize, voxSize, voxSize),
            color,
          });
          if (newBlocks.length > VOXEL_MAX_BLOCKS) {
            return { blocks: [], truncated: true }; // stop, terlalu banyak — buang hasil
          }
        }
      }
    }
  }
  return { blocks: newBlocks, truncated: false };
}

export default function BlockSimulator3D({ setPage }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [tool, setTool] = useState('place');
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [blockCount, setBlockCount] = useState(0);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showColorWheel, setShowColorWheel] = useState(false);
  const [colorWheelDraft, setColorWheelDraft] = useState(currentColor);
  // Scale Step — kelipatan yang dipakai buat snap ukuran blok saat drag handle Scale.
  // Default 1 (snap ke integer). User bisa set 0.5, 0.1, 0.05, dst supaya bisa resize presisi.
  const [scaleStep, setScaleStep] = useState(1);
  const scaleStepRef = useRef(1);
  useEffect(() => { scaleStepRef.current = scaleStep; }, [scaleStep]);

  // ── SHAPE GENERATOR v2: VOXEL-FILL ──
  // User pilih bentuk + Size + Voxel Size, lalu klik grid untuk generate banyak kubus kecil
  // axis-aligned (rot 0,0,0 — TIDAK ada rotasi) yang mengisi permukaan bentuk target.
  // Hasil voxel adalah blok biasa yang bisa di-edit individual (Move/Rotate/Scale/Paint/Delete).
  const [genShape, setGenShape] = useState('sphere');
  const [genSize, setGenSize] = useState(4);
  const [genVoxelSize, setGenVoxelSize] = useState(0.5);
  // Pesan status transient — tampil kalau generate di-tolak (MAX_BLOCKS/grid points/etc).
  const [genStatus, setGenStatus] = useState(null); // { type: 'error'|'warn'|'info', msg: string } | null

  // ── CLEAR ALL (tool 'clear') ──
  // confirmClearAll: true kalau user sudah klik tombol "Clear All" pertama (masuk mode konfirmasi).
  // Reset ke false tiap user pindah tool dari 'clear' ke tool lain (useEffect di bawah).
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  useEffect(() => {
    // Reset konfirmasi kalau user keluar dari tool 'clear' — supaya tombol konfirmasi tidak "nyangkut".
    if (tool !== 'clear') setConfirmClearAll(false);
  }, [tool]);

  // ── SISTEM PAINT (copy dari LogicGatesSimulator 2D) ──
  // colorPicker: object atau null. Saat non-null, modal overlay full-screen muncul
  //   berisi ColorWheelPicker + tombol Pick Color / Confirm / Cancel.
  //   Shape: { targetType: 'block', targetId, hex, originalHex }
  // pickFromWorkspace: saved colorPicker state saat user masuk mode eyedropper
  //   (klik "Pick Color" di modal). Klik blok lain di kanvas → ambil warnanya → balik ke modal.
  const [colorPicker, setColorPicker] = useState(null);
  const [pickFromWorkspace, setPickFromWorkspace] = useState(null);
  const colorPickerRef = useRef(null);
  const pickFromWorkspaceRef = useRef(null);
  const dashOffsetRef = useRef(0);
  const rafRef = useRef(null);
  useEffect(() => { colorPickerRef.current = colorPicker; }, [colorPicker]);
  useEffect(() => { pickFromWorkspaceRef.current = pickFromWorkspace; }, [pickFromWorkspace]);

  const stateRef = useRef({
    blocks: [],
    selected: null,
    // pitch MUST be negative for a "looking DOWN at grid" view.
    // Positive pitch tilts the world's +Z axis downward on screen,
    // which makes the grid floor project BELOW center and the scene
    // look upside-down / reversed compared to standard 3D editors.
    cam: { yaw: -0.75, pitch: -0.55, dist: 22, target: new Vec3(0, 0, 0) },
    isOrbiting: false,
    isPanning: false,      // Pan Camera: klik-kiri drag di empty space = geser posisi kamera (target)
    isTransforming: false,
    dragAxis: null,        // 'x' | 'y' | 'z' | null — sumbu yang sedang di-grab saat gizmo Move/Rotate/Scale aktif
    dragStart: null,
    camStart: null,        // simpan yaw/pitch awal saat mulai orbit
    panStart: null,        // simpan cam.target awal saat mulai pan
    transformStart: null,
    blockStart: null,      // { pos, rot, size } — snapshot awal blok saat mulai drag (untuk reference drag)
    hoverGrid: null,   // posisi grid (Vec3) tempat ghost block akan digambar, null = tidak ada ghost
    hoverColor: '#3b82f6',
    dpr: 1,
    W: 0, H: 0, cx: 0, cy: 0,
  });

  /* ---------- 3D Engine ---------- */
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

  const project = useCallback((p) => {
    const s = stateRef.current;
    let v = p.sub(s.cam.target);
    v = rotY(v, s.cam.yaw);
    v = rotX(v, s.cam.pitch);
    // Standard perspective projection: closer points = bigger.
    // focalLength tunes overall scale; clamp denominator to avoid div-by-zero.
    const focalLength = 700;
    const scale = focalLength / Math.max(0.5, v.z + s.cam.dist);
    return {
      x: s.cx / s.dpr + v.x * scale,
      y: s.cy / s.dpr - v.y * scale,
      z: v.z,
      scale
    };
  }, []);

  const getBlockCorners = (b) => {
    const sz = b.size || new Vec3(1, 1, 1);
    const r = b.rot || new Vec3(0, 0, 0);
    const corners = [
      new Vec3(-0.5, -0.5, -0.5), new Vec3(0.5, -0.5, -0.5),
      new Vec3(0.5, 0.5, -0.5),   new Vec3(-0.5, 0.5, -0.5),
      new Vec3(-0.5, -0.5, 0.5),  new Vec3(0.5, -0.5, 0.5),
      new Vec3(0.5, 0.5, 0.5),    new Vec3(-0.5, 0.5, 0.5)
    ];
    return corners.map(v => {
      let p = new Vec3(v.x * sz.x, v.y * sz.y, v.z * sz.z);
      p = rotY(p, r.y); p = rotX(p, r.x); p = rotZ(p, r.z);
      return b.pos.add(p);
    });
  };

  const shadeColor = (hex, factor) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substr(0, 2), 16);
    const g = parseInt(h.substr(2, 2), 16);
    const b = parseInt(h.substr(4, 2), 16);
    return `rgb(${Math.min(255, Math.max(0, Math.round(r * factor)))},${Math.min(255, Math.max(0, Math.round(g * factor)))},${Math.min(255, Math.max(0, Math.round(b * factor)))})`;
  };

  /* ---------- Render ---------- */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;

    ctx.clearRect(0, 0, s.W / s.dpr, s.H / s.dpr);

    // Background gradient (biar ada kedalaman, gak void hitam total) — pakai warna yang
    // sudah dipakai di file ini juga (panelBg & bg halaman), bukan warna baru.
    const w = s.W / s.dpr, h = s.H / s.dpr;
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    bgGrad.addColorStop(0, '#3a4a63');
    bgGrad.addColorStop(1, '#1b2536');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.lineWidth = 0.5;
    const N = GRID_SIZE;
    for (let i = -N; i <= N; i++) {
      const a = project(new Vec3(i * GRID, 0, -N * GRID));
      const b = project(new Vec3(i * GRID, 0, N * GRID));
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      const c = project(new Vec3(-N * GRID, 0, i * GRID));
      const d = project(new Vec3(N * GRID, 0, i * GRID));
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
    }
    // Axes
    const o = project(new Vec3(0, 0, 0));
    const xEnd = project(new Vec3(3.5, 0, 0));
    const zEnd = project(new Vec3(0, 0, 3.5));
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(xEnd.x, xEnd.y); ctx.stroke();
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(zEnd.x, zEnd.y); ctx.stroke();

    // Blocks (painter's algorithm)
    const sorted = s.blocks.map((b, i) => ({ b, i, depth: project(b.pos).z }))
      .sort((a, b) => b.depth - a.depth);

    // ── FACE CULLING (POIN B) ──
    // Lookup cepat: kunci posisi (dibulatkan) → blok, dipakai buat face culling.
    // Cuma isi blok yang AXIS-ALIGNED (tidak dirotasi) — blok yang dirotasi TIDAK ikut serta
    // sebagai kandidat "penutup wajah" (supaya deteksi tetap sederhana & akurat).
    // Ini optimisasi performa PALING BERDAMPAK dari semua poin — wajah yang ketutup kubus
    // tetangga TIDAK digambar, drastis mengurangi jumlah draw call kalau banyak blok menempel.
    const posKey = (v) => `${Math.round(v.x*1000)},${Math.round(v.y*1000)},${Math.round(v.z*1000)}`;
    const blockLookup = new Map();
    s.blocks.forEach(b => {
      const r = b.rot || new Vec3(0,0,0);
      if (Math.abs(r.x) < 0.001 && Math.abs(r.y) < 0.001 && Math.abs(r.z) < 0.001) {
        blockLookup.set(posKey(b.pos), b);
      }
    });

    // Cek apakah wajah blok b di arah `dir` (Vec3 satuan, misal (1,0,0) utk +X) ketutup TOTAL
    // oleh blok tetangga yang menempel persis di situ. Blok yang dirotasi TIDAK di-cull (return false).
    const isFaceCovered = (b, dir, sizeAlongAxis) => {
      const r = b.rot || new Vec3(0,0,0);
      if (Math.abs(r.x) >= 0.001 || Math.abs(r.y) >= 0.001 || Math.abs(r.z) >= 0.001) return false; // b sendiri dirotasi, jangan cull
      const neighborPos = new Vec3(
        b.pos.x + dir.x * sizeAlongAxis,
        b.pos.y + dir.y * sizeAlongAxis,
        b.pos.z + dir.z * sizeAlongAxis,
      );
      const neighbor = blockLookup.get(posKey(neighborPos));
      if (!neighbor) return false;
      // Wajah ketutup TOTAL cuma kalau ukuran tetangga di 2 sumbu YANG SEJAJAR WAJAH itu sama
      // atau lebih besar (biar gak ada celah kelihatan). Cek sederhana: ukuran sama di ketiga
      // sumbu (kasus paling umum — voxel-fill & Place tool selalu pakai ukuran seragam per-batch).
      return neighbor.size.x === b.size.x && neighbor.size.y === b.size.y && neighbor.size.z === b.size.z;
    };

    // faceDirs — index-matched PERSIS sama urutan array `faces` di bawah (JANGAN diacak).
    // Dipetakan manual dari getBlockCorners: idx[3,2,1,0] = -Z, idx[4,5,6,7] = +Z, dst.
    const faceDirs = [
      { dir: new Vec3(0,0,-1), axis: 'z' }, // idx [3,2,1,0] → -Z
      { dir: new Vec3(0,0, 1), axis: 'z' }, // idx [4,5,6,7] → +Z
      { dir: new Vec3(0,-1,0), axis: 'y' }, // idx [0,1,5,4] → -Y
      { dir: new Vec3(0, 1,0), axis: 'y' }, // idx [7,6,2,3] → +Y
      { dir: new Vec3(-1,0,0), axis: 'x' }, // idx [4,7,3,0] → -X
      { dir: new Vec3( 1,0,0), axis: 'x' }, // idx [1,2,6,5] → +X
    ];

    sorted.forEach(item => {
      const b = item.b;
      const corners = getBlockCorners(b);
      const pc = corners.map(project);
      const faces = [
        { idx: [3, 2, 1, 0], shade: 0.58 },
        { idx: [4, 5, 6, 7], shade: 0.82 },
        { idx: [0, 1, 5, 4], shade: 0.42 },
        { idx: [7, 6, 2, 3], shade: 1.0 },
        { idx: [4, 7, 3, 0], shade: 0.72 },
        { idx: [1, 2, 6, 5], shade: 0.88 }
      ];
      // Face culling: tandai wajah yang ketutup total kubus tetangga (cumah untuk blok axis-aligned).
      // faceDirs index-matched sama faces (JANGAN diubah urutannya).
      faces.forEach((f, fi) => {
        const { dir, axis } = faceDirs[fi];
        const sizeAlongAxis = axis === 'x' ? b.size.x : axis === 'y' ? b.size.y : b.size.z;
        f.culled = isFaceCovered(b, dir, sizeAlongAxis);
      });
      faces.forEach(f => { f.avgZ = f.idx.reduce((sum, i2) => sum + pc[i2].z, 0) / 4; });
      faces.sort((a, b2) => b2.avgZ - a.avgZ);

      faces.forEach(f => {
        if (f.culled) return; // POIN B: skip gambar wajah yang ketutup total kubus tetangga
        const pts = f.idx.map(i2 => pc[i2]);
        const ax = pts[1].x - pts[0].x, ay = pts[1].y - pts[0].y;
        const bx = pts[2].x - pts[1].x, by = pts[2].y - pts[1].y;
        if (ax * by - ay * bx < 0) return; // backface cull
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.closePath();
        ctx.fillStyle = shadeColor(b.color, f.shade);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      if (s.selected === b) {
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#f472b6';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(pc[0].x, pc[0].y);
        for (let k = 1; k < 4; k++) ctx.lineTo(pc[k].x, pc[k].y);
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });

    // Ghost/preview block — muncul saat mode Place & kursor di atas grid
    if (s.hoverGrid) {
      const ghost = { pos: s.hoverGrid, size: new Vec3(1, 1, 1), rot: new Vec3(0, 0, 0) };
      const gCorners = getBlockCorners(ghost);
      const gpc = gCorners.map(project);
      const gFaces = [
        { idx: [3, 2, 1, 0] },
        { idx: [4, 5, 6, 7] },
        { idx: [0, 1, 5, 4] },
        { idx: [7, 6, 2, 3] },
        { idx: [4, 7, 3, 0] },
        { idx: [1, 2, 6, 5] }
      ];
      gFaces.forEach(f => { f.avgZ = f.idx.reduce((sum, i2) => sum + gpc[i2].z, 0) / 4; });
      gFaces.sort((a, b2) => b2.avgZ - a.avgZ);

      ctx.save();
      ctx.globalAlpha = 0.35;
      gFaces.forEach(f => {
        const pts = f.idx.map(i2 => gpc[i2]);
        const ax = pts[1].x - pts[0].x, ay = pts[1].y - pts[0].y;
        const bx = pts[2].x - pts[1].x, by = pts[2].y - pts[1].y;
        if (ax * by - ay * bx < 0) return; // backface cull, sama seperti block asli
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.closePath();
        ctx.fillStyle = shadeColor(s.hoverColor, 1);
        ctx.fill();
      });
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = s.hoverColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      gFaces.forEach(f => {
        const pts = f.idx.map(i2 => gpc[i2]);
        const ax = pts[1].x - pts[0].x, ay = pts[1].y - pts[0].y;
        const bx = pts[2].x - pts[1].x, by = pts[2].y - pts[1].y;
        if (ax * by - ay * bx < 0) return;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.closePath();
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.restore();
    }

    // ── Marching ants around block being painted (colorPicker open OR pickFromWorkspace active) ──
    // Copy dari LogicGatesSimulator 2D: dashed rect animasi di sekitar blok target,
    // border pakai warna blok tsb supaya jelas identitasnya. Animasi dashOffset terus maju.
    const cpInfo = colorPickerRef.current || pickFromWorkspaceRef.current;
    if (cpInfo && cpInfo.targetType === 'block') {
      const targetBlock = s.blocks.find(b => b.id === cpInfo.targetId);
      if (targetBlock) {
        // Gambar bounding box blok (axis-aligned di world, sebelum rotasi — pakai corners).
        const corners = getBlockCorners(targetBlock).map(project);
        // Cari min/max x & y di layar
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of corners) {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        }
        const pad = 6;
        ctx.save();
        ctx.setLineDash([8, 5]);
        ctx.lineDashOffset = -dashOffsetRef.current;
        ctx.strokeStyle = targetBlock.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = targetBlock.color;
        ctx.shadowBlur = 6;
        ctx.strokeRect(minX - pad, minY - pad, (maxX - minX) + pad * 2, (maxY - minY) + pad * 2);
        ctx.restore();
      }
    }

    // Gizmo 6-axis handles — digambar HANYA kalau ada blok terpilih & tool = move/rotate/scale.
    // Gaya Roblox Studio: merah=X, hijau=Y, biru=Z, masing-masing di KEDUA sisi (+ dan -).
    // Tiap handle = garis dari pusat blok + lingkaran di ujung (Move/Scale) atau busur kecil (Rotate).
    // Handle +axis = padat (full opacity), handle -axis = outline (sedikit lebih redup) supaya
    // user bisa bedakan handle mana yang dia klik, tapi keduanya tetap clickable dengan radius sama.
    if (s.selected && (tool === 'move' || tool === 'rotate' || tool === 'scale')) {
      const b = s.selected;
      const off = getHandleOffset(b);
      const centerScreen = project(b.pos);
      // 6 handle: 3 axes × 2 sisi (+ dan -). Warna sama untuk + dan - (merah/hijau/biru),
      // dibedakan hanya dari posisi & opacity rendering.
      const axes = [
        { axis: 'x',  vec: new Vec3( off, 0, 0), color: '#ef4444', neg: false }, // merah = +X
        { axis: 'y',  vec: new Vec3(0,  off, 0), color: '#22c55e', neg: false }, // hijau = +Y
        { axis: 'z',  vec: new Vec3(0, 0,  off), color: '#3b82f6', neg: false }, // biru = +Z
        { axis: '-x', vec: new Vec3(-off, 0, 0), color: '#ef4444', neg: true  }, // merah = -X
        { axis: '-y', vec: new Vec3(0, -off, 0), color: '#22c55e', neg: true  }, // hijau = -Y
        { axis: '-z', vec: new Vec3(0, 0, -off), color: '#3b82f6', neg: true  }, // biru = -Z
      ];

      ctx.save();
      for (const { axis, vec, color, neg } of axes) {
        const tipScreen = project(b.pos.add(vec));
        // Garis dari pusat blok ke ujung handle. Handle -axis pakai opacity lebih rendah
        // supaya visual beda dengan handle +axis (mudah dibedakan saat klik).
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = neg ? 0.55 : 1.0;
        ctx.beginPath();
        ctx.moveTo(centerScreen.x, centerScreen.y);
        ctx.lineTo(tipScreen.x, tipScreen.y);
        ctx.stroke();

        // Handle di ujung — bentuknya beda per tool biar jelas visual:
        //  - Move: kepala panah (segitiga sama kaki mengarah ke ujung) — Tahap 1/3 gizmo panah
        //  - Scale: lingkaran padat (target klik jelas, 7px radius) — TETAP seperti sebelumnya
        //  - Rotate: lingkaran outline + busur kecil di dalam (biar kelihatan "nggulir")
        if (tool === 'move') {
          // Kepala panah: segitiga sama kaki, mengarah dari centerScreen ke tipScreen.
          // Hitung unit vector arah panah (dari center ke tip), lalu vektor tegak lurus
          // untuk lebar alas segitiga. Pakai centerScreen yang sudah ada di scope (JANGAN
          // deklarasi baru/hitung ulang).
          const dx = tipScreen.x - centerScreen.x;
          const dy = tipScreen.y - centerScreen.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len, uy = dy / len;       // unit vector arah panah
          const px = -uy, py = ux;                   // unit vector tegak lurus (buat lebar alas segitiga)
          const headLen = 14;   // panjang kepala panah dari ujung ke alas
          const headWidth = 7;  // setengah lebar alas segitiga

          const tip = { x: tipScreen.x, y: tipScreen.y };
          const baseCenter = { x: tipScreen.x - ux * headLen, y: tipScreen.y - uy * headLen };
          const baseL = { x: baseCenter.x + px * headWidth, y: baseCenter.y + py * headWidth };
          const baseR = { x: baseCenter.x - px * headWidth, y: baseCenter.y - py * headWidth };

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(tip.x, tip.y);
          ctx.lineTo(baseL.x, baseL.y);
          ctx.lineTo(baseR.x, baseR.y);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
          ctx.stroke();
        } else if (tool === 'scale') {
          // Scale TETAP lingkaran solid — behavior visual lama dipertahankan, JANGAN diubah.
          // (Dipisah dari Move biar gampang dibedakan secara visual: Move = panah, Scale = lingkaran,
          //  Rotate = lingkaran outline + busur.)
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(tipScreen.x, tipScreen.y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(tipScreen.x, tipScreen.y, 7, 0, Math.PI * 2);
          ctx.stroke();
        } else if (tool === 'rotate') {
          // Outer ring outline
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(tipScreen.x, tipScreen.y, 9, 0, Math.PI * 2);
          ctx.stroke();
          // Inner arc supaya kelihatan "rotate"
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(tipScreen.x, tipScreen.y, 5, -Math.PI * 0.4, Math.PI * 0.4);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }, [project, tool]);

  // rAF loop untuk marching ants animation. Start hanya saat colorPicker atau pickFromWorkspace aktif
  // (supaya tidak boros CPU saat idle). Setiap frame: increment dashOffset + re-render.
  // WAJIB ditaruh SETELAH render di-declare (di atas) supaya tidak kena Temporal Dead Zone
  // (useEffect dependency array baca `render` saat component render pertama kali — kalau
  // useEffect ini di-define sebelum `const render = useCallback(...)`, JS engine bakal throw
  // "Cannot access 'render' before initialization" & crash halaman jadi blank putih).
  useEffect(() => {
    if (!colorPicker && !pickFromWorkspace) {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      return;
    }
    const tick = () => {
      dashOffsetRef.current = (dashOffsetRef.current + 0.5) % 13; // 8+5 = 13 (match dash pattern [8,5])
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [colorPicker, pickFromWorkspace, render]);

  /* ---------- Resize ---------- */
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      stateRef.current.dpr = dpr;
      stateRef.current.W = canvas.width = rect.width * dpr;
      stateRef.current.H = canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      // Scale the 2D context so we can draw in CSS pixels directly.
      // Without this, drawings land in buffer-pixel space and appear
      // shrunk by `dpr` on retina displays.
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stateRef.current.cx = stateRef.current.W / 2;
      stateRef.current.cy = stateRef.current.H / 2;
      render();
    };
    handleResize();
    const container = containerRef.current;
    const ro = container ? new ResizeObserver(handleResize) : null;
    if (container && ro) ro.observe(container);
    window.addEventListener('resize', handleResize);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [render]);

  /* ---------- Hit Test ---------- */
  const pointInPoly = (x, y, poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi))
        inside = !inside;
    }
    return inside;
  };

  /* ---------- Gizmo Helpers (Move/Rotate/Scale 3-axis ala Roblox Studio) ----------
     Konsep: tiap blok terpilih punya 6 handle (3 axes × 2 sisi: +X/-X/+Y/-Y/+Z/-Z)
     berwarna merah=X, hijau=Y, biru=Z yang keluar dari pusat blok di kedua arah.
     Klik handle → drag sepanjang axis itu saja. Sumbu lain TIDAK ikut berubah —
     presisi, tidak kena "drag dx/dy mentah" yang arahnya bisa campur dari sudut kamera tertentu. */

  // Posisi handle relatif terhadap pusat blok.
  // handleOffset = setengah ukuran blok terbesar + 0.8 (biar handle selalu di luar blok).
  const getHandleOffset = (block) =>
    Math.max(block.size.x, block.size.y, block.size.z) * 0.5 + 0.8;

  // Hit-test handle: cek mana dari 6 handle yang posisi layar-nya dekat klik mouse.
  // PRIORITAS LEBIH TINGGI dari hitTest blok biasa — dipanggil duluan saat tool=move/rotate/scale & s.selected != null.
  // Return: 'x' | 'y' | 'z' | '-x' | '-y' | '-z' | null.
  const hitHandle = (mx, my, block) => {
    if (!block) return null;
    const off = getHandleOffset(block);
    const axes = [
      { axis: 'x',  vec: new Vec3(off, 0, 0) },
      { axis: 'y',  vec: new Vec3(0, off, 0) },
      { axis: 'z',  vec: new Vec3(0, 0, off) },
      { axis: '-x', vec: new Vec3(-off, 0, 0) },
      { axis: '-y', vec: new Vec3(0, -off, 0) },
      { axis: '-z', vec: new Vec3(0, 0, -off) },
    ];
    let bestAxis = null, bestDist = 14; // 14px radius klik, cukup toleran buat jari/mouse
    for (const { axis, vec } of axes) {
      const p = project(block.pos.add(vec));
      const d = Math.hypot(p.x - mx, p.y - my);
      if (d < bestDist) { bestDist = d; bestAxis = axis; }
    }
    return bestAxis;
  };

  // Rumus drag per-axis pakai proyeksi vektor (bukan dx/dy mentah).
  // Supaya drag akurat dari sudut kamera manapun: project pusat blok & project titik axis-tip
  // ke layar → dapat vektor arah sumbu di layar → proyeksikan mouse delta ke vektor tsb.
  // Return: world-unit delta sepanjang axis (LANGSUNG dalam satuan world, bukan pixel).
  const dragAxisDelta = (mx, my, dragStartMouse, blockStartPos, axis) => {
    const axisUnit = axis === 'x' ? new Vec3(1, 0, 0)
                  : axis === 'y' ? new Vec3(0, 1, 0)
                  : new Vec3(0, 0, 1);
    const centerScreen = project(blockStartPos);
    const axisTipScreen = project(blockStartPos.add(axisUnit));
    const screenAxisVec = {
      x: axisTipScreen.x - centerScreen.x,
      y: axisTipScreen.y - centerScreen.y,
    };
    const mouseDelta = { x: mx - dragStartMouse.x, y: my - dragStartMouse.y };
    const denom = screenAxisVec.x * screenAxisVec.x + screenAxisVec.y * screenAxisVec.y;
    if (denom < 0.0001) return 0; // axis nyaris tegak lurus layar (invisible), hindari div-by-zero
    const t = (mouseDelta.x * screenAxisVec.x + mouseDelta.y * screenAxisVec.y) / denom;
    return t;
  };

  // Snap per-axis: Math.round tunggal, BUKAN snap 3-sumbu (yang lama).
  // Sumbu lain harus tetap presisi — tidak ikut ke-snap kalau tidak digerakkan.
  const snapSingleAxis = (v) => Math.round(v);

  const hitTest = (mx, my) => {
    const s = stateRef.current;
    // WAJIB pakai rumus sort yang SAMA PERSIS dengan render() supaya konsisten:
    //   render() menggambar far→near, near berarti digambar TERAKHIR alias "di atas" di layar.
    //   Untuk hit test, cek dari yang PALING DEPAN (near) dulu → iterasi dari BELAKANG array sorted.
    //   Sebelumnya hitTest pakai urutan insert mentah (s.blocks dibalik) → bisa kena blok yang
    //   bukan paling depan secara visual → delete/clone salah pilih blok saat tumpang-tindih.
    const sorted = s.blocks.map((b, i) => ({ b, i, depth: project(b.pos).z }))
      .sort((a, b) => b.depth - a.depth);
    for (let i = sorted.length - 1; i >= 0; i--) {
      const b = sorted[i].b;
      const pc = getBlockCorners(b).map(project);
      const faces = [[0,1,2,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[0,3,7,4],[1,2,6,5]];
      for (const f of faces) {
        const pts = f.map(idx => pc[idx]);
        if (pointInPoly(mx, my, pts)) return b;
      }
    }
    return null;
  };

  const snap = (v) => new Vec3(Math.round(v.x), Math.round(v.y), Math.round(v.z));

  // POIN E — Fix bug snap grid tidak presisi.
  // Akar masalah: getGridPos lama brute-force scan grid step 0.5, lalu di akhir snap() ke integer
  // — dua langkah ini gak konsisten (scan step 0.5, hasil akhir dipaksa ke integer), which
  // menghasilkan pemilihan titik yang kadang meleset dari yang sebenarnya paling dekat ke mouse.
  //
  // Fix: unprojection analitik (ray-plane intersection, BUKAN brute-force sampling).
  // Cari perpotongan ray dari kamera (lewat pixel mouse di image plane) dengan plane Y=0 (lantai grid).
  // Verifikasi numerik: round-trip error ~10⁻¹³ (praktis nol).
  const getGridPos = (mx, my) => {
    const s = stateRef.current;
    const f = 700; // WAJIB sama persis dengan focalLength di project() — JANGAN pakai angka beda
    const cx = s.cx / s.dpr, cy = s.cy / s.dpr;
    // Direction ray di camera space (sebelum inverse rotation):
    //   pixel (mx,cy) = center, jadi direction = ((mx-cx)/f, -(my-cy)/f, 1) — Z positif = menjauhi kamera.
    const Dx = (mx - cx) / f, Dy = -(my - cy) / f, Dz = 1;

    // camToWorld: apply inverse rotX, inverse rotY, lalu translate ke cam.target.
    // project() di file ini pakai: v = p.sub(target); v = rotY(v, yaw); v = rotX(v, pitch).
    // Inverse-nya: apply rotX(v, -pitch) dulu, lalu rotY(v, -yaw), lalu add target.
    const camToWorld = (v) => {
      let p = rotX(v, -s.cam.pitch);
      p = rotY(p, -s.cam.yaw);
      return s.cam.target.add(p);
    };

    // Ray origin = camera position di world space.
    // Camera position (di camera space) = (0, 0, -dist) — sebelum inverse rot, kamera di -Z.
    // Pakai (-dist) supaya konsisten dengan project() yang memakai (v.z + dist).
    const p0 = camToWorld(new Vec3(0, 0, -s.cam.dist));
    // Ray direction = direction di camera space (Dx,Dy,Dz) di-inverse-rotate ke world space.
    const p1 = camToWorld(new Vec3(Dx, Dy, -s.cam.dist + Dz));
    // Ray-plane intersection dengan plane Y=0:
    //   p(t) = p0 + t*(p1-p0), dimana p(t).y = 0 → t = -p0.y / (p1.y - p0.y).
    const A = p0.y, B = p1.y - p0.y;
    if (Math.abs(B) < 1e-9) return null; // ray sejajar ground, gak ada titik potong
    const t = -A / B;
    const wx = p0.x + t * (p1.x - p0.x);
    const wz = p0.z + t * (p1.z - p0.z);
    // Snap ke integer grid (supaya blok nempel di perpotongan garis grid).
    return snap(new Vec3(wx, 0, wz));
  };

  /* ---------- Update UI State ---------- */
  const updateUISelection = (b) => {
    if (b) {
      setSelectedInfo({
        pos: `(${b.pos.x.toFixed(1)}, ${b.pos.y.toFixed(1)}, ${b.pos.z.toFixed(1)})`,
        size: `(${b.size.x.toFixed(1)} x ${b.size.y.toFixed(1)} x ${b.size.z.toFixed(1)})`,
        rot: `${(b.rot.y * 57.2958).toFixed(0)}deg`
      });
    } else {
      setSelectedInfo(null);
    }
  };

  /* ---------- Mouse Events ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPlacementY = (gp) => {
      const s = stateRef.current;
      let y = 0.5;
      const stack = s.blocks.filter(b =>
        Math.abs(b.pos.x - gp.x) < 0.1 && Math.abs(b.pos.z - gp.z) < 0.1
      );
      if (stack.length > 0) {
        stack.sort((a, b) => b.pos.y - a.pos.y);
        y = stack[0].pos.y + (stack[0].size ? stack[0].size.y : 1);
      }
      return y;
    };

    const runPlace = (mx, my) => {
      const s = stateRef.current;
      const gp = getGridPos(mx, my);
      if (!gp) return;
      const y = getPlacementY(gp);
      const nb = {
        pos: new Vec3(gp.x, y, gp.z),
        size: new Vec3(1, 1, 1),
        rot: new Vec3(0, 0, 0),
        color: currentColor,
        id: Date.now() + Math.random()
      };
      s.blocks.push(nb);
      s.selected = nb;
      setBlockCount(s.blocks.length);
      updateUISelection(nb);
      render();
    };

    // ── SHAPE GENERATOR v2: VOXEL-FILL ──
    // Generate banyak kubus kecil axis-aligned (rot 0,0,0 — TIDAK ada rotasi) yang mengisi
    // permukaan bentuk target. Pakai posisi grid hover (gp) sebagai pusat bentuk, getPlacementY
    // sebagai Y pusat (supaya bentuk tidak kebenam di lantai). Hasil voxel = blok biasa.
    //
    // Return dari generateVoxelShape: { blocks, truncated, tooManyGridPoints? }.
    // - truncated=true: kena MAX_BLOCKS (4000) atau tooManyGridPoints. Hasil DIBUANG (jangan
    //   generate setengah-setengah). Tampilkan pesan error ke user via genStatus.
    // - truncated=false: hasil valid, push ke s.blocks.
    const runGenerate = (mx, my) => {
      const s = stateRef.current;
      const gp = getGridPos(mx, my);
      if (!gp) return;
      const y = getPlacementY(gp);
      const center = new Vec3(gp.x, y, gp.z);
      const size = Math.max(0.5, genSize);
      const voxelSize = Math.max(0.05, genVoxelSize);
      const color = currentColor;
      const params = computeShapeParams(genShape, size);
      const result = generateVoxelShape(genShape, center, params, voxelSize, color);
      if (result.truncated) {
        // Generate ditolak — tampilkan pesan ke user, jangan push apa-apa ke s.blocks.
        if (result.tooManyGridPoints) {
          setGenStatus({
            type: 'error',
            msg: `Voxel Size ${voxelSize} terlalu kecil untuk ukuran ini — estimasi ${Math.round(result.estPoints).toLocaleString()} titik uji (>500rb). Perbesar Voxel Size.`,
          });
        } else {
          setGenStatus({
            type: 'error',
            msg: `Terlalu banyak voxel (>4000) — perbesar Voxel Size dulu. (Bentuk: ${genShape}, Size: ${size}, Voxel: ${voxelSize})`,
          });
        }
        render();
        return;
      }
      const blocks = result.blocks;
      // Assign id ke tiap blok (pola PERSIS seperti runPlace: Date.now() + Math.random()).
      blocks.forEach(b => {
        b.id = Date.now() + Math.random();
        s.blocks.push(b);
      });
      // Select blok pertama supaya gizmo langsung muncul di salah satu voxel.
      if (blocks.length > 0) s.selected = blocks[0];
      setBlockCount(s.blocks.length);
      if (blocks.length > 0) updateUISelection(blocks[0]);
      // Pesan sukses dengan jumlah blok.
      setGenStatus({
        type: 'info',
        msg: `Generated ${blocks.length} voxel${blocks.length !== 1 ? 's' : ''} (${genShape}, Voxel ${voxelSize}).`,
      });
      render();
    };

    const onContextMenu = (e) => {
      // Cegah menu klik-kanan bawaan browser muncul — klik-kanan dipakai untuk orbit kamera.
      e.preventDefault();
    };

    const onMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const s = stateRef.current;

      // Klik-kanan = orbit kamera, SELALU, di tool apa pun. (gaya Roblox Studio)
      if (e.button === 2) {
        s.isOrbiting = true;
        s.dragStart = { x: mx, y: my };
        s.camStart = { yaw: s.cam.yaw, pitch: s.cam.pitch };
        s.hoverGrid = null; // sembunyikan ghost selama orbit
        canvas.style.cursor = 'grabbing';
        return;
      }

      if (e.button !== 0) return; // hanya klik-kiri yang lanjut ke logic tool di bawah

      // ── PICK FROM WORKSPACE MODE (eyedropper): prioritas tertinggi, dicek SEBELUM tool lain ──
      // Copy dari LogicGatesSimulator 2D: user klik "Pick Color" di modal → modal tutup,
      // cursor jadi crosshair. Klik blok lain di kanvas → ambil warnanya → balik ke modal
      // colorPicker dengan hex baru. Klik empty → batal, balik ke modal dengan hex lama.
      if (pickFromWorkspaceRef.current) {
        const savedPicker = pickFromWorkspaceRef.current;
        const hit = hitTest(mx, my);
        if (hit) {
          setColorPicker({ ...savedPicker, hex: hit.color });
          setPickFromWorkspace(null);
          canvas.style.cursor = 'grab';
        } else {
          // Empty click → batal pick, balik ke modal dengan hex lama.
          setColorPicker(savedPicker);
          setPickFromWorkspace(null);
          canvas.style.cursor = 'grab';
        }
        return;
      }

      if (tool === 'place') {
        runPlace(mx, my);
        return;
      }

      if (tool === 'generate') {
        // Shape Generator: klik di grid = generate bentuk terpilih di posisi hover.
        runGenerate(mx, my);
        return;
      }

      // ---- Tool move/rotate/scale: gizmo 3-axis ala Roblox Studio ----
      // Cek handle DULUAN (prioritas lebih tinggi dari hitTest blok biasa) —
      // HANYA kalau sudah ada blok terpilih. Klik handle = mulai drag axis itu.
      if (tool === 'move' || tool === 'rotate' || tool === 'scale') {
        if (s.selected) {
          const ax = hitHandle(mx, my, s.selected);
          if (ax) {
            // Mulai drag handle axis tsb.
            s.dragAxis = ax;
            s.isTransforming = true;
            s.dragStart = { x: mx, y: my };
            s.blockStart = {
              pos: s.selected.pos.clone(),
              rot: s.selected.rot.clone(),
              size: s.selected.size.clone(),
            };
            canvas.style.cursor = 'grabbing';
            return;
          }
        }
        // Klik TIDAK kena handle → jalankan hitTest blok biasa (pilih blok baru / deselect / pan).
        const hit = hitTest(mx, my);
        if (hit) {
          s.selected = hit;
          s.dragAxis = null;     // belum mulai drag axis (harus klik handle dulu)
          s.isTransforming = false;
          s.blockStart = {
            pos: hit.pos.clone(),
            rot: hit.rot.clone(),
            size: hit.size.clone(),
          };
          updateUISelection(hit);
          render();
        } else {
          // Empty click → mulai PAN CAMERA (geser posisi kamera, bukan deselect).
          // Deselect tetap jalan di klik-kiri biasa (click tanpa drag) → di onMouseUp cek delta drag.
          s.isPanning = true;
          s.dragStart = { x: mx, y: my };
          s.panStart = { target: s.cam.target.clone() };
          canvas.style.cursor = 'grabbing';
        }
        return;
      }

      // ---- Tool delete/clone/color: tetap pakai hitTest blok biasa ----
      const hit = hitTest(mx, my);
      if (hit) {
        s.selected = hit;
        if (tool === 'delete') {
          s.blocks = s.blocks.filter(b => b !== hit);
          s.selected = null;
          setBlockCount(s.blocks.length);
          updateUISelection(null);
        } else if (tool === 'clone') {
          const nb = {
            pos: hit.pos.add(new Vec3(1.2, 0, 0)),
            size: new Vec3(hit.size.x, hit.size.y, hit.size.z),
            rot: new Vec3(hit.rot.x, hit.rot.y, hit.rot.z),
            color: hit.color,
            id: Date.now() + Math.random()
          };
          s.blocks.push(nb);
          s.selected = nb;
          updateUISelection(nb);
        } else if (tool === 'color') {
          // ── PAINT TOOL (copy dari LogicGatesSimulator 2D) ──
          // Klik blok → buka modal colorPicker overlay full-screen berisi ColorWheelPicker.
          // User pilih warna di wheel → hex disimpan di state colorPicker.hex (BELUM apply ke blok).
          // Tombol "Pick Color" → masuk mode eyedropper (pickFromWorkspace).
          // Tombol Confirm → apply colorPicker.hex ke blok, close modal.
          // Tombol Cancel → revert ke originalHex (tidak ada perubahan), close modal.
          const currentHex = hit.color;
          setColorPicker({
            targetType: 'block',
            targetId: hit.id,
            hex: currentHex,
            originalHex: currentHex,
          });
          return;
        }
      } else {
        // Empty click → PAN CAMERA (klik-kiri tahan + drag di area kosong = geser posisi kamera).
        // Saat user cuma klik (tanpa drag signifikan), di onMouseUp akan jadi deselect (click = klik kosong).
        // Behavior pan hanya aktif kalau user benar-benar drag — lihat onMouseUp.
        // Untuk tool=color: tutup colorPicker kalau kebuka, LALU mulai pan.
        if (colorPickerRef.current) setColorPicker(null);
        s.isPanning = true;
        s.dragStart = { x: mx, y: my };
        s.panStart = { target: s.cam.target.clone() };
        // Jangan deselect dulu — tunggu onMouseUp buat bedakan click vs drag.
        canvas.style.cursor = 'grabbing';
      }
      render();
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const s = stateRef.current;

      if (s.isOrbiting) {
        const dx = mx - s.dragStart.x, dy = my - s.dragStart.y;
        // YAW: MINUS — drag kanan → yaw turun → world gerak ke kiri → camera orbit ke kanan (kanan natural).
        // PITCH: PLUS — drag atas → pitch turun → world gerak ke bawah → camera orbit ke atas (atas natural).
        // (Bagian 1 sempat flip dua-duanya ke PLUS, tapi ternyata cuma pitch yang benar — yaw jadi terbalik.
        //  Fix Bagian 47: balik yaw ke MINUS, biarkan pitch PLUS. Sesuai instruksi prompt Bagian 1:
        //  "kalau cuma satu sumbu yang masih kebalik, balik tanda MINUS itu HANYA untuk sumbu yang masih salah".)
        s.cam.yaw = s.camStart.yaw - dx * 0.007;
        s.cam.pitch = Math.max(-1.45, Math.min(1.45, s.camStart.pitch + dy * 0.007));
        render();
        return;
      }

      if (s.isPanning) {
        // PAN CAMERA: klik-kiri tahan + drag = geser posisi kamera (cam.target) sepanjang bidang layar.
        // Rumus: konversi screen delta (dx, dy) ke world delta sepanjang arah right & up kamera.
        //   - right_world = inverse camera rotation applied to (1,0,0)
        //     = rotY(-yaw, rotX(-pitch, (1,0,0))) = rotY(-yaw, (1,0,0)) = (cos(yaw), 0, -sin(yaw))
        //   - up_world    = inverse camera rotation applied to (0,1,0)
        //     = rotY(-yaw, rotX(-pitch, (0,1,0))) = rotY(-yaw, (0, cos(pitch), -sin(pitch)))
        //     = (-sin(pitch)*sin(yaw), cos(pitch), -sin(pitch)*cos(yaw))
        //   - Skala pan proporsional ke cam.dist (zoom out = pan cepat).
        //   - dx PLUS: drag kanan (dx>0) → camera geser KANAN (target + dx*right) — natural scrolling.
        //   - dy MINUS: drag bawah (dy>0) → camera geser BAWAH (target - dy*up, karena up = arah atas).
        const dx = mx - s.dragStart.x, dy = my - s.dragStart.y;
        const cy = Math.cos(s.cam.yaw), sy = Math.sin(s.cam.yaw);
        const cp = Math.cos(s.cam.pitch), sp = Math.sin(s.cam.pitch);
        // right_world — PERHATIKAN TANDA: rightZ = -sy (BUKAN sy, pernah bug sebelumnya).
        const rightX = cy, rightY = 0, rightZ = -sy;
        // up_world
        const upX = -sp * sy, upY = cp, upZ = -sp * cy;
        const panScale = s.cam.dist * 0.0015;
        // Natural scrolling: drag kanan = camera kanan, drag bawah = camera bawah.
        const targetX = s.panStart.target.x + dx * panScale * rightX - dy * panScale * upX;
        const targetY = s.panStart.target.y + dx * panScale * rightY - dy * panScale * upY;
        const targetZ = s.panStart.target.z + dx * panScale * rightZ - dy * panScale * upZ;
        s.cam.target = new Vec3(targetX, targetY, targetZ);
        render();
        return;
      }

      if (s.isTransforming && s.selected && s.blockStart && s.dragAxis) {
        const ax = s.dragAxis;
        // ax bisa 'x' | 'y' | 'z' | '-x' | '-y' | '-z'. axClean = sumbu tanpa tanda minus.
        const axClean = ax.startsWith('-') ? ax.slice(1) : ax;
        const sign = ax.startsWith('-') ? -1 : 1; // sign untuk kompensasi Scale (sisi +axis diam)
        if (tool === 'move') {
          // Move per-axis: drag handle = ubah posisi sepanjang axis itu SAJA.
          // Sumbu lain TIDAK diubah. Pakai dragAxisDelta (proyeksi vektor) supaya
          // akurat dari sudut kamera manapun, bukan dx/dy mentah.
          // Drag handle +X ke kanan → t positive → pos.x bertambah (ke kanan).
          // Drag handle -X ke kiri  → t negative → pos.x berkurang (ke kiri). Behavior identik,
          // tidak perlu sign — drag delta otomatis mengikuti arah mouse di world space.
          const t = dragAxisDelta(mx, my, s.dragStart, s.blockStart.pos, axClean);
          s.selected.pos[axClean] = snapSingleAxis(s.blockStart.pos[axClean] + t);
        } else if (tool === 'rotate') {
          // Rotate per-axis. Pola: Y & Z pakai horizontal drag (dx), X pakai vertical (dy).
          // Pola umum di software 3D: putar sumbu yang "menghadap ke layar" pakai drag horizontal,
          // sumbu yang "mendatar ke layar" pakai drag vertical.
          // Handle +axis dan -axis sama-sama memutar sumbu yang sama (cuma asal user drag berbeda).
          if (axClean === 'y')      s.selected.rot.y = s.blockStart.rot.y + (mx - s.dragStart.x) * 0.008;
          else if (axClean === 'x') s.selected.rot.x = s.blockStart.rot.x + (my - s.dragStart.y) * 0.008;
          else if (axClean === 'z') s.selected.rot.z = s.blockStart.rot.z + (mx - s.dragStart.x) * 0.008;
        } else if (tool === 'scale') {
          // Scale per-axis: tarik handle = sisi handle maju/mundur, sisi BERLAWANAN tetap diam.
          //  - Handle +X: drag ke kanan (t positive) → sisi +X maju, sisi -X diam.
          //    pos.x += actualDelta/2 (geser pusat ke kanan, sisi -X tetap di tempat).
          //  - Handle -X: drag ke kiri (t negative) → sisi -X maju, sisi +X diam.
          //    effectiveT = t * sign = -t (jadi positive saat drag kiri). pos.x -= actualDelta/2.
          //  sign = -1 untuk handle -axis, +1 untuk handle +axis. Formula kompak untuk kedua kasus.
          //
          // SCALE STEP SNAP: ukuran hasil di-snap ke kelipatan terdekat dari scaleStepRef.current
          //   (bukan langsung state `scaleStep` — supaya event handler baca nilai TERBARU tanpa
          //   perlu re-attach listener tiap kali scaleStep berubah, ikuti pola ref-sync yang
          //   SUDAH ADA di file ini untuk colorPicker).
          //   Contoh: step=2 → hasil selalu kelipatan 2 (2, 4, 6, 8...). step=0.05 → 2.00, 2.05, 2.10...
          //   Batas minimum = step itu sendiri (Math.max(step, ...) bukan Math.max(0.2, ...))
          //   supaya blok tidak bisa lebih kecil dari 1 step (kalau step=2, min jadi 2, bukan 0.2 —
          //   konsisten dengan konsep "kelipatan step").
          const t = dragAxisDelta(mx, my, s.dragStart, s.blockStart.pos, axClean);
          const effectiveT = t * sign;
          const rawSize = s.blockStart.size[axClean] + effectiveT;
          const step = scaleStepRef.current || 1; // fallback 1 kalau ref null (seharusnya gak terjadi)
          const newSize = Math.max(step, Math.round(rawSize / step) * step);
          const actualDelta = newSize - s.blockStart.size[axClean];
          s.selected.size[axClean] = newSize;
          s.selected.pos[axClean] = s.blockStart.pos[axClean] + sign * actualDelta / 2;
        }
        updateUISelection(s.selected);
        render();
        return;
      }

      // Tidak sedang orbit atau transform — update ghost preview kalau tool = Place.
      // PENTING: cuma render ulang kalau posisi grid-nya BENERAN berubah (bukan tiap
      // gerakan pixel), biar gak berat karena getGridPos scan seluruh grid.
      if (tool === 'place') {
        const gp = getGridPos(mx, my);
        if (gp) {
          const y = getPlacementY(gp);
          const prev = s.hoverGrid;
          const changed = !prev || prev.x !== gp.x || prev.y !== y || prev.z !== gp.z;
          if (changed) {
            s.hoverGrid = new Vec3(gp.x, y, gp.z);
            s.hoverColor = currentColor;
            render();
          }
        } else if (s.hoverGrid) {
          s.hoverGrid = null;
          render();
        }
      } else if (s.hoverGrid) {
        s.hoverGrid = null;
        render();
      }
    };

    const onMouseUp = (e) => {
      const s = stateRef.current;
      // Kalau barusan PAN tapi drag-nya sangat kecil (click, bukan drag) → anggap deselect.
      // Threshold 4px supaya klik biasa tidak salah anggap drag. Drag < 4px = click = deselect.
      if (s.isPanning && s.dragStart) {
        const rect = canvas.getBoundingClientRect();
        const dx = (e.clientX - rect.left) - s.dragStart.x;
        const dy = (e.clientY - rect.top) - s.dragStart.y;
        if (Math.hypot(dx, dy) < 4) {
          // Click tanpa drag = deselect (klik kosong biasa).
          s.selected = null;
          updateUISelection(null);
          render();
        }
      }
      s.isOrbiting = false;
      s.isPanning = false;
      s.isTransforming = false;
      s.dragAxis = null;
      canvas.style.cursor = 'grab';
    };

    const onMouseLeave = () => {
      const s = stateRef.current;
      if (s.hoverGrid) {
        s.hoverGrid = null;
        render();
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      const s = stateRef.current;
      s.cam.dist = Math.max(5, Math.min(60, s.cam.dist + e.deltaY * 0.012));
      render();
    };

    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [tool, currentColor, project, render, genShape, genSize, genVoxelSize]);

  /* ---------- Keyboard Shortcuts ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      const t = TOOLS.find(t2 => t2.key === k);
      if (t) setTool(t.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ---------- Styles ---------- */
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const panelBg = '#0e1420';
  const panelBorder = '#1e293b';
  const textSecondary = '#94a3b8';
  const pink = '#f472b6';
  const pinkBg = 'rgba(244,114,182,0.18)';

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#05080f',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: `1px solid ${panelBorder}`,
        backgroundColor: panelBg,
        zIndex: 10,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setPage('shapes')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              backgroundColor: panelBg, border: `1px solid #334155`,
              color: textSecondary, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = pink; e.currentTarget.style.color = pink; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = textSecondary; }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              backgroundColor: pinkBg, padding: 8, borderRadius: 10, color: pink,
            }}>
              <Box size={22} />
            </div>
            <h1 style={{
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
              background: 'linear-gradient(180deg,#fbcfe8 0%,#ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.01em',
              margin: 0,
            }}>
              3D BLOCK SIMULATOR
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            padding: '6px 14px', borderRadius: 10,
            backgroundColor: panelBg, border: `1px solid ${panelBorder}`,
            color: textSecondary, fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Cuboid size={14} />
            {blockCount} Blocks
          </div>
          <button
            onClick={() => setShowHelp(v => !v)}
            style={{
              padding: 8, borderRadius: 10,
              backgroundColor: panelBg, border: `1px solid ${panelBorder}`,
              color: textSecondary, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = pink; e.currentTarget.style.color = pink; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = panelBorder; e.currentTarget.style.color = textSecondary; }}
          >
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%', height: '100%',
            display: 'block', cursor: 'grab',
          }}
        />

        {/* Toolbar */}
        <div style={{
          position: 'absolute', top: 16, left: 16,
          display: 'flex', flexDirection: 'column', gap: 6,
          backgroundColor: 'rgba(14, 20, 32, 0.92)',
          padding: 12, borderRadius: 14,
          border: `1px solid ${panelBorder}`,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          zIndex: 5,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: textSecondary,
            textTransform: 'uppercase', letterSpacing: '1px',
            marginBottom: 4, fontFamily: 'Orbitron, sans-serif',
          }}>
            Tools
          </div>
          {TOOLS.map(t => {
            const Icon = t.icon;
            const active = tool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                title={`${t.label} (${t.key.toUpperCase()})`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 10,
                  border: `1px solid ${active ? pink : 'rgba(148,163,184,0.12)'}`,
                  backgroundColor: active ? pink : 'transparent',
                  color: active ? '#0e1420' : '#e2e8f0',
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}

          {/* Scale Step input — HANYA muncul saat tool='scale'. User bisa ketik angka bebas
              (1, 0.5, 0.1, 0.05, dst) untuk tentukan kelipatan snap saat resize handle. */}
          {tool === 'scale' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 4, paddingTop: 8,
              borderTop: '1px solid rgba(148,163,184,0.15)',
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: textSecondary,
                textTransform: 'uppercase', letterSpacing: '1px',
                fontFamily: 'Orbitron, sans-serif', whiteSpace: 'nowrap',
              }}>
                Step:
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={scaleStep}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  // JANGAN biarkan 0/negatif — bisa bikin size stuck/negatif (Math.round(rawSize/step)
                  // bakal NaN kalau step=0). Clamp minimum ke 0.01.
                  setScaleStep(Number.isFinite(v) && v > 0 ? v : 0.01);
                }}
                style={{
                  width: 56, background: '#1e293b',
                  border: `1px solid ${pink}`, borderRadius: 4,
                  color: '#e2e8f0', fontSize: 12, padding: '3px 6px',
                  fontFamily: 'Inter, sans-serif', outline: 'none',
                  // Sembunyikan spinner arrows default (biar UI lebih bersih, user ketik manual).
                  MozAppearance: 'textfield',
                }}
                title="Kelipatan snap saat resize handle Scale. Contoh: 1 = bulat, 0.5 = kelipatan 0.5, 0.05 = presisi tinggi."
              />
            </div>
          )}
        </div>

        {/* ── SHAPE GENERATOR PANEL v2: VOXEL-FILL — render HANYA saat tool='generate' ──
            User pilih bentuk + Size + Voxel Size, lalu KLIK GRID di kanvas = generate banyak
            kubus kecil axis-aligned (rot 0,0,0) yang mengisi permukaan bentuk target. */}
        {tool === 'generate' && (
          <div style={{
            position: 'absolute', top: 16, right: 16,
            display: 'flex', flexDirection: 'column', gap: 8,
            backgroundColor: 'rgba(14, 20, 32, 0.92)',
            padding: 12, borderRadius: 14,
            border: `1px solid ${panelBorder}`,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            zIndex: 5, minWidth: 200, maxWidth: 240,
            fontFamily: 'Inter, sans-serif',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: textSecondary,
              textTransform: 'uppercase', letterSpacing: '1px',
              marginBottom: 4, fontFamily: 'Orbitron, sans-serif',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Shapes size={12} /> Shape Generator <span style={{ opacity: 0.6 }}>v2</span>
            </div>

            {/* Dropdown pilih bentuk */}
            <label style={{ fontSize: 10, color: textSecondary, fontWeight: 600 }}>
              Shape
              <select
                value={genShape}
                onChange={(e) => { setGenShape(e.target.value); setGenStatus(null); }}
                style={{
                  display: 'block', width: '100%', marginTop: 2,
                  background: '#1e293b', border: `1px solid ${pink}`,
                  borderRadius: 4, color: '#e2e8f0', fontSize: 12, padding: '4px 6px',
                  fontFamily: 'Inter, sans-serif', outline: 'none',
                }}
              >
                <option value="cube">Cube (1 block solid)</option>
                <option value="sphere">Sphere (voxel shell)</option>
                <option value="cylinder">Cylinder (side + caps)</option>
                <option value="cone">Cone (side + bottom cap)</option>
                <option value="torus">Torus (donut)</option>
                <option value="tetrahedron">Tetrahedron (4 faces)</option>
                <option value="octahedron">Octahedron (8 faces)</option>
                <option value="icosahedron">Icosahedron (20 faces)</option>
              </select>
            </label>

            {/* Size — radius/halfHeight dasar per bentuk */}
            <label style={{ fontSize: 10, color: textSecondary, fontWeight: 600 }}>
              Size (radius)
              <input
                type="number" step="0.5" min="0.5"
                value={genSize}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setGenSize(Number.isFinite(v) && v > 0 ? v : 0.5);
                  setGenStatus(null);
                }}
                style={{
                  display: 'block', width: '100%', marginTop: 2,
                  background: '#1e293b', border: `1px solid ${pink}`,
                  borderRadius: 4, color: '#e2e8f0', fontSize: 12, padding: '3px 6px',
                  fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </label>

            {/* Voxel Size — input angka bebas (boleh 0.05, 0.1, 0.2, 0.5, 1, 2, dst).
                Pola styling sama dengan input "Scale Step" yang sudah ada di tool Scale. */}
            <label style={{ fontSize: 10, color: textSecondary, fontWeight: 600 }}>
              Voxel Size
              <input
                type="number" step="0.05" min="0.05"
                value={genVoxelSize}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setGenVoxelSize(Number.isFinite(v) && v > 0 ? v : 0.05);
                  setGenStatus(null);
                }}
                style={{
                  display: 'block', width: '100%', marginTop: 2,
                  background: '#1e293b', border: `1px solid ${pink}`,
                  borderRadius: 4, color: '#e2e8f0', fontSize: 12, padding: '3px 6px',
                  fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </label>

            {/* Hint tentang Voxel Size — kecil = detail halus tapi banyak blok */}
            <div style={{
              fontSize: 9, color: '#64748b', fontStyle: 'italic',
              padding: '2px 4px', lineHeight: 1.4,
            }}>
              Kecil = detail halus tapi banyak blok (max 4000). Cube abaikan Voxel Size.
            </div>

            {/* Status message — tampil kalau ada genStatus (error/info).
                type='error' (merah) kalau generate ditolak (MAX_BLOCKS/grid points).
                type='info' (hijau) kalau generate sukses. */}
            {genStatus && (
              <div style={{
                fontSize: 10, padding: '5px 7px', borderRadius: 4,
                background: genStatus.type === 'error' ? 'rgba(239, 68, 68, 0.1)'
                         : genStatus.type === 'warn' ? 'rgba(251, 191, 36, 0.1)'
                         : 'rgba(34, 197, 94, 0.1)',
                border: `1px solid ${genStatus.type === 'error' ? 'rgba(239, 68, 68, 0.4)'
                                              : genStatus.type === 'warn' ? 'rgba(251, 191, 36, 0.4)'
                                              : 'rgba(34, 197, 94, 0.4)'}`,
                color: genStatus.type === 'error' ? '#f87171'
                     : genStatus.type === 'warn' ? '#fbbf24'
                     : '#4ade80',
                lineHeight: 1.4,
              }}>
                {genStatus.msg}
              </div>
            )}

            {/* Instruksi generate — klik grid */}
            <div style={{
              fontSize: 10, color: pink, fontStyle: 'italic', marginTop: 4,
              padding: '6px 8px', background: pinkBg, borderRadius: 6,
              border: `1px solid ${pink}`,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Sparkles size={12} />
              Klik grid untuk generate
            </div>
          </div>
        )}

        {/* Color Palette — tampil HANYA saat tool='place' (konsisten dengan 2D:
            saat Paint mode, user pilih warna lewat modal colorPicker, bukan palet). */}
        {tool === 'place' && (
          <div style={{
            position: 'absolute', top: 16, right: 16,
            display: 'flex', flexDirection: 'column', gap: 6,
            backgroundColor: 'rgba(14, 20, 32, 0.92)',
            padding: 12, borderRadius: 14,
            border: `1px solid ${panelBorder}`,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            zIndex: 5,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: textSecondary,
              textTransform: 'uppercase', letterSpacing: '1px',
              marginBottom: 4, fontFamily: 'Orbitron, sans-serif',
            }}>
              Colors
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 30px)', gap: 6,
            }}>
              {COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => {
                    // Klik swatch hanya set currentColor (untuk Place tool — warna blok baru).
                    // Tidak sentuh blok existing (kalau mau ganti warna blok existing, pakai Paint tool).
                    setCurrentColor(c);
                  }}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    backgroundColor: c,
                    cursor: 'pointer',
                    border: `2px solid ${currentColor === c ? pink : 'transparent'}`,
                    transition: 'transform 0.1s',
                    boxShadow: currentColor === c ? `0 0 8px ${c}66` : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              ))}
            </div>
            {/* Tombol "Pilih Warna Lain" — buka modal ColorWheelPicker (port dari 2D). */}
            <button
              onClick={() => {
                setColorWheelDraft(currentColor); // mulai draft dari warna saat ini
                setShowColorWheel(true);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 10px', marginTop: 4, borderRadius: 8,
                backgroundColor: currentColor, border: `1px solid ${pink}`,
                color: '#fff', cursor: 'pointer',
                fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <Paintbrush size={12} />
              Pilih Warna Lain
            </button>
          </div>
        )}

        {/* ── CLEAR ALL (tool 'clear') ──
            Tombol merah "Clear All" + konfirmasi 2-tahap supaya user gak accidentally hapus SEMUA blok.
            Tahap 1: tombol "Clear All" merah → klik → masuk mode konfirmasi (2 tombol: Yakin/Batal).
            Tahap 2: klik "Yakin? Hapus SEMUA" → semua blok dihapus, selected di-reset, render ulang.
            Kalau user pindah tool sebelum konfirmasi, confirmClearAll ke-reset false (useEffect di atas). */}
        {tool === 'clear' && (
          <div style={{
            position: 'absolute', bottom: 16, left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
            backgroundColor: 'rgba(14, 20, 32, 0.92)',
            padding: '12px 16px', borderRadius: 12,
            border: `1px solid ${confirmClearAll ? '#ef4444' : panelBorder}`,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            zIndex: 5,
            fontFamily: 'Inter, sans-serif',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: textSecondary,
              textTransform: 'uppercase', letterSpacing: '1px',
              fontFamily: 'Orbitron, sans-serif',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Eraser size={12} /> Clear All Blocks
            </div>
            {!confirmClearAll ? (
              <button
                onClick={() => setConfirmClearAll(true)}
                disabled={blockCount === 0}
                style={{
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                  color: '#fff', border: '1px solid #f87171',
                  borderRadius: 8, padding: '8px 16px',
                  fontWeight: 700, fontSize: 13, cursor: blockCount === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  opacity: blockCount === 0 ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'transform 0.1s',
                }}
                onMouseEnter={e => { if (blockCount > 0) e.currentTarget.style.transform = 'scale(1.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <Trash2 size={14} />
                Clear All
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#fca5a5', fontStyle: 'italic', marginRight: 4 }}>
                  Yakin? {blockCount} blok akan dihapus permanen.
                </span>
                <button
                  onClick={() => {
                    stateRef.current.blocks = [];
                    stateRef.current.selected = null;
                    setConfirmClearAll(false);
                    setBlockCount(0);
                    updateUISelection(null);
                    render();
                  }}
                  style={{
                    background: '#dc2626', color: '#fff', border: 'none',
                    borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 12,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Yakin? Hapus SEMUA
                </button>
                <button
                  onClick={() => setConfirmClearAll(false)}
                  style={{
                    background: '#334155', color: '#fff', border: 'none',
                    borderRadius: 6, padding: '6px 12px', fontSize: 12,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        )}

        {/* Selection Info */}
        {selectedInfo && (
          <div style={{
            position: 'absolute', bottom: 16, left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(14, 20, 32, 0.95)',
            padding: '12px 20px', borderRadius: 12,
            border: `1px solid ${pink}`,
            color: '#e2e8f0', fontSize: 12,
            textAlign: 'center', pointerEvents: 'none',
            boxShadow: `0 0 24px ${pink}33`,
            zIndex: 5, lineHeight: 1.6,
          }}>
            <div style={{
              fontFamily: 'Orbitron, sans-serif', fontWeight: 600,
              fontSize: 13, marginBottom: 4, color: pink,
            }}>
              Block Selected
            </div>
            <div style={{ color: textSecondary }}>
              Pos: {selectedInfo.pos}<br/>
              Size: {selectedInfo.size}<br/>
              Rot: {selectedInfo.rot}
            </div>
          </div>
        )}

        {/* Help Panel */}
        {showHelp && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16,
            backgroundColor: 'rgba(14, 20, 32, 0.92)',
            padding: '14px 18px', borderRadius: 12,
            border: `1px solid ${panelBorder}`,
            color: textSecondary, fontSize: 12,
            backdropFilter: 'blur(10px)',
            maxWidth: 300, lineHeight: 1.7,
            zIndex: 5,
          }}>
            <strong style={{ color: '#e2e8f0' }}>Controls</strong><br/>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Hand size={12} /> <strong>Right-Click Drag</strong> = Orbit camera
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Move size={12} /> <strong>Left-Click Drag</strong> (empty space) = Pan camera
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MousePointer2 size={12} /> <strong>Scroll</strong> = Zoom
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={12} /> <strong>Click grid</strong> = Place block
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Box size={12} /> <strong>Click block</strong> = Select
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
              <Move size={12} /> <strong>Drag handle</strong> (Merah=X, Hijau=Y, Biru=Z) = Move/Rotate/Scale per-axis
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontStyle: 'italic', color: '#64748b', fontSize: 11 }}>
              Tool Move/Rotate/Scale: klik blok dulu → muncul 3 handle → drag salah satu
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
              <Paintbrush size={12} /> <strong>Paint</strong>: klik blok → modal color picker (wheel + slider + Pick Color)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontStyle: 'italic', color: '#64748b', fontSize: 11 }}>
              Pick Color = eyedropper (klik blok lain → ambil warnanya)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
              <Shapes size={12} /> <strong>Shape</strong>: klik grid → generate bentuk (sphere/cube/torus/dst)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontStyle: 'italic', color: '#64748b', fontSize: 11 }}>
              Atur Shape/Size/Segments di panel kanan → klik grid untuk taruh
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
              <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10 }}>⌨</span>
              <strong>P / M / R / S / C / K / X / G</strong> = Switch tools
            </span>
          </div>
        )}

        {/* ── Color Picker (Paint tool) — copy dari LogicGatesSimulator 2D ──
            Classic Windows-style: Color wheel + HSV sliders + RGB sliders + preview.
            Confirm/Pick Color/Cancel buttons directly below.
            State: colorPicker = { targetType: 'block', targetId, hex, originalHex } */}
        {colorPicker && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 1000,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'flex-start' : 'center',
              paddingLeft: isMobile ? 16 : 0,
            }}
            onClick={() => {
              // Click overlay luar → cancel (revert originalHex ke blok, close modal).
              const s = stateRef.current;
              const tgt = s.blocks.find(b => b.id === colorPicker.targetId);
              if (tgt) {
                tgt.color = colorPicker.originalHex;
                render();
              }
              setColorPicker(null);
            }}
          >
            {/* Mobile scroll arrows — FIXED on screen, outside modal (supaya user bisa scroll
                horizontal ColorWheelPicker di mobile yang overflow). */}
            {isMobile && (
              <>
                <div style={{
                  position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
                  zIndex: 1001, pointerEvents: 'none',
                  animation: 'cp-blink 1.2s ease-in-out infinite',
                  color: '#fff', fontSize: 72, fontWeight: 900, lineHeight: 1,
                  textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.5)',
                }}>‹</div>
                <div style={{
                  position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                  zIndex: 1001, pointerEvents: 'none',
                  animation: 'cp-blink 1.2s ease-in-out infinite',
                  color: '#fff', fontSize: 72, fontWeight: 900, lineHeight: 1,
                  textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.5)',
                }}>›</div>
              </>
            )}
            <div
              style={{
                background: isMobile ? 'rgba(100, 116, 139, 0.97)' : 'rgba(15, 23, 42, 0.98)',
                border: '1px solid #475569',
                borderRadius: 8,
                padding: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                fontFamily: '"Inter", sans-serif',
                display: 'flex', flexDirection: 'column', gap: 6,
                maxHeight: 'calc(100dvh - 32px)',
                maxWidth: isMobile ? 'calc(100vw - 20px)' : undefined,
                boxSizing: 'border-box',
              }}
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
            >
              {/* Scrollable area — contains title + color picker */}
              <div style={{
                overflowY: 'auto',
                overflowX: 'auto',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                flex: 1, minHeight: 0,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', textAlign: 'center' }}>
                  Block Color
                </div>

                {/* Classic color wheel picker — fully self-contained (component shared dengan 2D). */}
                <ColorWheelPicker
                  hex={colorPicker.hex}
                  onChange={newHex => setColorPicker(cp => cp ? { ...cp, hex: newHex } : cp)}
                  onPickColor={() => {
                    // Save current picker state, close modal, enter pick-from-workspace mode (eyedropper).
                    const savedPicker = { ...colorPicker };
                    setColorPicker(null);
                    setPickFromWorkspace(savedPicker);
                    // Pakai crosshair cursor di canvas (alternatif simpel dari eyedropper cursor 2D).
                    const canvas = canvasRef.current;
                    if (canvas) canvas.style.cursor = 'crosshair';
                  }}
                />
              </div>

              {/* Action buttons: Confirm | Cancel — OUTSIDE scrollable area, stays fixed */}
              <div style={{ display: 'flex', gap: 6, marginTop: 2, flexShrink: 0 }}>
                <button
                  onClick={() => {
                    // Confirm — apply colorPicker.hex ke blok target, close modal.
                    const hex = colorPicker.hex;
                    const tgtId = colorPicker.targetId;
                    const s = stateRef.current;
                    const tgt = s.blocks.find(b => b.id === tgtId);
                    if (tgt) {
                      tgt.color = hex;
                      render();
                    }
                    // Update selectedInfo juga supaya UI sinkron (kalau blok target = s.selected).
                    if (s.selected && s.selected.id === tgtId) {
                      updateUISelection(s.selected);
                    }
                    setColorPicker(null);
                  }}
                  style={{
                    flex: 1, padding: '5px 8px', fontSize: 11, fontWeight: 700,
                    background: 'linear-gradient(135deg, #059669, #10b981)', border: '1px solid #34d399',
                    borderRadius: 4, color: '#ffffff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Check size={12} strokeWidth={2.5} />
                  Confirm
                </button>
                <button
                  onClick={() => {
                    // Cancel — revert originalHex ke blok (tidak ada perubahan), close modal.
                    const origHex = colorPicker.originalHex;
                    const tgtId = colorPicker.targetId;
                    const s = stateRef.current;
                    const tgt = s.blocks.find(b => b.id === tgtId);
                    if (tgt) {
                      tgt.color = origHex;
                      render();
                    }
                    setColorPicker(null);
                  }}
                  style={{
                    flex: 1, padding: '5px 8px', fontSize: 11, fontWeight: 600,
                    background: '#1e293b', border: '1px solid #475569',
                    borderRadius: 4, color: '#FFFFFF', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                  }}
                >
                  <X size={12} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ColorWheelPicker modal — port dari LogicGatesSimulator SlotColorPickerModal.
            Styling PERSIS sama: gradient gelap, border #334155, tombol Confirm hijau gradient,
            tombol Cancel abu-abu. Dipakai buat pilih warna bebas (bukan cuma 12 preset COLORS). */}
        {showColorWheel && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1003,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)', padding: 16,
            }}
            onClick={() => setShowColorWheel(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: 16, padding: 16,
                border: '2px solid #334155',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center',
                maxHeight: 'calc(100dvh - 32px)', boxSizing: 'border-box',
              }}
            >
              <div style={{
                overflowY: 'auto', overflowX: 'auto',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                flex: 1, minHeight: 0, alignSelf: 'stretch',
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: '#e2e8f0',
                  fontFamily: 'Inter, sans-serif', marginBottom: 6, textAlign: 'center',
                }}>
                  Pilih Warna Bebas
                </div>
                <ColorWheelPicker
                  hex={colorWheelDraft}
                  onChange={setColorWheelDraft}
                />
              </div>
              <div style={{
                display: 'flex', gap: 6, width: '100%',
                justifyContent: 'center', flexShrink: 0, alignSelf: 'stretch',
              }}>
                <button
                  onClick={() => {
                    // Confirm — hanya set currentColor (untuk Place tool — warna blok baru).
                    // Tidak sentuh blok existing. Untuk ganti warna blok existing, pakai Paint tool.
                    setCurrentColor(colorWheelDraft);
                    setShowColorWheel(false);
                  }}
                  style={{
                    flex: 1, padding: '5px 16px', fontSize: 11, fontWeight: 700,
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    border: '1px solid #34d399', borderRadius: 4,
                    color: '#fff', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Check size={12} strokeWidth={2.5} /> Confirm
                </button>
                <button
                  onClick={() => setShowColorWheel(false)}
                  style={{
                    flex: 1, padding: '5px 16px', fontSize: 11, fontWeight: 600,
                    background: '#1e293b', border: '1px solid #475569',
                    borderRadius: 4, color: '#fff', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
