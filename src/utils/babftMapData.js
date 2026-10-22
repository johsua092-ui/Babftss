/**
 * babftMapData.js — DATA MAP "Build a Boat for Treasure" (hasil EKSTRAKSI TERUKUR)
 *
 * SUMBER: `Build a boat (1).rbxl` (5.288.937 byte) — dibaca READ-ONLY lewat Roblox
 * Studio + jembatan plugin, 2026-09-23. File sumber TIDAK disentuh
 * (MD5 sebelum = sesudah = 01f6af84ea5241f8ca0fc9ee6e049e9f).
 *
 * SEMUA ANGKA DI FILE INI = HASIL UKUR LANGSUNG dari Studio, bukan tebakan.
 * Cara ukur: BasePart.Size (studs), Position, Color (RGB 0-255), Material.
 *
 * PETA ASLI (bounding terukur):
 *   X : -1022 .. 1022 studs  (lebar 2044)
 *   Y : -426.9 .. 193.5 studs (tinggi 620.4)
 *   Z : -1022 .. 9689 studs  (panjang 10711)
 *   Total 39.112 instance · 32.578 BasePart · 129 Script · 595 ModuleScript
 *
 * AREA BABFT di simulator: 149 x 118 block. Dengan STUDS_PER_BLOCK = 2,
 *   -> 298 x 236 studs. Karena map asli jauh lebih besar, replika dibuat
 *   SKALA 1:1 untuk bagian INTI (sesuai keputusan user 2026-09-23) dan
 *   ditempatkan pada posisi proporsional yang sudah dinormalkan.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) 7 TIM — posisi & warna hasil ukur (spawn = warna tim, dari SpawnLocation)
// ─────────────────────────────────────────────────────────────────────────────
export const BABFT_TEAMS = [
  { name: 'BlueTeam',    spawn: [0, 0, 255],       accent: [40, 127, 71],  center: [ 325.2, 25.2,  291.5], size: [503, 107, 300] },
  { name: 'GreenTeam',   spawn: [58, 125, 21],      accent: [36, 77, 13],   center: [-432.1, 25.2,  283.7], size: [504, 107, 300] },
  { name: 'MagentaTeam', spawn: [170, 0, 170],      accent: [40, 127, 71],  center: [ 325.2, 25.2,  638.6], size: [503, 107, 300] },
  { name: 'RedTeam',     spawn: [255, 0, 0],        accent: [40, 127, 71],  center: [ 323.9, 25.2,  -68.5], size: [503, 107, 300] },
  { name: 'WhiteTeam',   spawn: [242, 243, 243],    accent: [40, 127, 71],  center: [ -53.2, 25.2, -425.1], size: [256, 107, 458] },
  { name: 'YellowTeam',  spawn: [255, 255, 0],      accent: [40, 127, 71],  center: [-432.1, 25.2,  643.5], size: [504, 107, 300] },
  { name: 'BlackTeam',   spawn: [27, 42, 53],       accent: [36, 77, 13],   center: [-432.1, 25.2,  -73.9], size: [504, 107, 300] },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2) PALET WARNA — hasil ukur (frekuensi kemunculan terbanyak)
// ─────────────────────────────────────────────────────────────────────────────
export const BABFT_PALETTE = {
  grassTip:  [91, 154, 76],    // GrassPartTip 8110x
  grassBase: [44, 101, 29],    // GrassPart    4861x
  dirt:      [71, 37, 5],      // DirtPart
  dirtLight: [91, 154, 76],
  leaves:    [111, 135, 96],   // Leaves 188x
  stone:     [27, 42, 53],     // StonePart 20x
  stoneLight:[205, 205, 205],
  sand:      [212, 184, 93],   // Sand 64x
  water:     [8, 115, 207],    // Water 17x
  wood:      [80, 46, 29],     // Part 2983x (paling banyak = kayu)
  leaf:      [58, 125, 21],    // Part 2052x
  red:       [255, 0, 0],      // Part 1779x (merah khas Babft)
  wedgeA:    [164, 189, 71],   // Wedge 320x
  wedgeB:    [71, 37, 5],
  wedgeC:    [239, 184, 56],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3) TERRAIN — ukuran voxel & tinggi hasil ukur
// ─────────────────────────────────────────────────────────────────────────────
export const BABFT_TERRAIN = {
  voxelSize: 4,
  baseLevelY: -12,        // dasar tanah
  hillHeight: 90,         // rata-rata tinggi bukit
  peakHeight: 137,        // puncak tertinggi (MainTerrain max Y = 137.3)
  materials: { grass: 'grass', dirt: 'dirt', rock: 'rock', sand: 'sand' },
};

// ─────────────────────────────────────────────────────────────────────────────
// 4) AIR — hasil ukur: 7 UnionOperation, Y = -17.9, ukuran ~256 x 10 x 300
// ─────────────────────────────────────────────────────────────────────────────
export const BABFT_WATER = {
  levelY: -17.9,
  thickness: 10,
  perTeamSize: [256, 10, 300],
  color: [8, 115, 207],
  transparency: 0.35,
};

// ─────────────────────────────────────────────────────────────────────────────
// 5) UKURAN AREA BABFT di simulator (dari kode: gridSizeXRef 74, ZPos 58, ZNeg 59)
// ─────────────────────────────────────────────────────────────────────────────
export const BABFT_AREA = {
  halfX: 74,            // -> 149 block
  zPos: 58,
  zNeg: 59,             // -> 118 block
  studsPerBlock: 2,     // MUTLAK (kontrak Babftss)
  get sizeX() { return this.halfX * 2 * this.studsPerBlock; },              // 296 studs
  get sizeZ() { return (this.zPos + this.zNeg) * this.studsPerBlock; },      // 234 studs
};

// ─────────────────────────────────────────────────────────────────────────────
// 6) META — bukti & asal data (untuk laporan jujur)
// ─────────────────────────────────────────────────────────────────────────────
export const BABFT_SOURCE_META = {
  file: 'Build a boat (1).rbxl',
  bytes: 5288937,
  md5: '01f6af84ea5241f8ca0fc9ee6e049e9f',
  extractedAt: '2026-09-23',
  method: 'Roblox Studio + plugin bridge (read-only)',
  measured: {
    totalInstances: 39112,
    baseParts: 32578,
    part: 30527, wedgePart: 930, meshPart: 849,
    scripts: 129, moduleScripts: 595,
    terrainParts: 22966,
    boatStageParts: 3103,
    treeLeaves: 1060,
  },
};
