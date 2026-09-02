/**
 * ChunkManager.js — High-performance voxel/spatial block management for three.js.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE OVERVIEW
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Designed for large grids (500×500+) with thousands of dynamic blocks that
 * support free Scale (down to 0.05 for thin planks) and free Rotation.
 *
 * Solves 3 core performance problems of naive Mesh-per-block approaches:
 *
 * ── 1. DRAW CALL BOTTLENECK ──────────────────────────────────────────────────
 * Naive:   1 THREE.Mesh per block → 1 draw call per block.
 *          10,000 blocks = 10,000 draw calls → GPU pipeline stall → <10 FPS.
 * Solution: THREE.InstancedMesh per Chunk → 1 draw call per Chunk.
 *          500×500 grid / 25×25 chunks = 400 chunks max → ≤400 draw calls
 *          (only non-empty chunks render). 10×–50× fewer draw calls.
 *
 * ── 2. MEMORY WASTE ON EMPTY AREAS ──────────────────────────────────────────
 * Naive:   Pre-allocate Group/InstancedMesh for every chunk.
 *          400 chunks × (geometry + material + instance buffer) = wasted RAM.
 * Solution: Lazy allocation — empty chunks have ZERO 3D allocation.
 *          InstancedMesh spawns only when first block is added to a chunk.
 *          When chunk becomes empty again, it is auto-disposed (GPU freed).
 *
 * ── 3. O(N) LOOKUP / FRAME ITERATION ─────────────────────────────────────────
 * Naive:   Loop through all blocks every frame for updates.
 *          10,000 blocks × 60 FPS = 600,000 iterations/sec.
 * Solution: Map<string, number> per chunk for O(1) coordinate lookup.
 *          Block lookup by (x,y,z) is instant — no scanning 250,000 coords.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * CHUNKING STRATEGY
 * ════════════════════════════════════════════════════════════════════════════
 *
 * World is divided into square chunks (default 25×25 blocks).
 * Each chunk has:
 *   - Chunk coords (cx, cz) — derived from world coords: cx = floor(x / SIZE)
 *   - One InstancedMesh (lazily allocated) holding all blocks in that chunk
 *   - Internal Map<'x,y,z', instanceIndex> for O(1) block lookup
 *   - Reverse array indexToBlock[] for raycast instanceId → block coord
 *   - Free index list for O(1) block removal (swap-remove strategy)
 *
 * ════════════════════════════════════════════════════════════════════════════
 * RENDERING & CULLING
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Each chunk's InstancedMesh has a STATIC boundingSphere encompassing the
 * chunk's world AABB. three.js renderer auto-frustum-culls any chunk whose
 * boundingSphere is outside camera view → 0 GPU cost for off-screen chunks.
 *
 * Material uses THREE.FrontSide (backface culling active) so interior faces
 * of blocks are not rasterized — blocks look solid without wasting fill rate.
 *
 * No fog — blocks remain visible from edge to edge of the 500×500 grid.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * BLOCK TRANSFORMS
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Each block stores its own THREE.Matrix4 encoding position + quaternion +
 * scale. Thin planks (scale.y = 0.05) and arbitrary rotations are fully
 * supported. Updates go through setMatrixAt(index, matrix), then a single
 * instanceMatrix.needsUpdate = true is set on the chunk (once per frame max,
 * batched across all block updates in that frame via _pendingFlush Set).
 *
 * ════════════════════════════════════════════════════════════════════════════
 * USAGE
 * ════════════════════════════════════════════════════════════════════════════
 *
 *   import { ChunkManager } from '../lib/ChunkManager.js';
 *
 *   // 1. Create manager (shared geometry + material, FrontSide culling)
 *   const cm = new ChunkManager(scene, {
 *     chunkSize: 25,          // 25×25 blocks per chunk → 400 chunks for 500×500
 *     capacity: 25 * 25 * 64, // max blocks per chunk (height up to 64)
 *     chunkHeightMax: 64,
 *   });
 *
 *   // 2. Add blocks (lazy-allocates chunk's InstancedMesh on first add)
 *   cm.setBlock(10, 5, 20, {
 *     color: 0x3b82f6,
 *     scale: [1, 0.05, 1],   // thin plank
 *     quaternion: [0, 0, 0, 1],
 *   });
 *   cm.setBlock(11, 5, 20, { color: 0xef4444 }); // default scale/rotation
 *
 *   // 3. Per-frame: flush pending matrix updates (call in animate loop)
 *   function animate() {
 *     cm.update(); // batched — only dirty chunks get needsUpdate
 *     renderer.render(scene, camera);
 *   }
 *
 *   // 4. Raycast support
 *   const targets = cm.getRaycastTargets();
 *   const hits = raycaster.intersectObjects(targets.map(t => t.mesh));
 *   if (hits[0]) {
 *     const target = targets.find(t => t.mesh === hits[0].object);
 *     const coords = cm.instanceIdToCoords(target.chunk, hits[0].instanceId);
 *     // coords = { x, y, z } of the clicked block
 *   }
 *
 *   // 5. Update block transform (e.g. during gizmo drag)
 *   cm.updateBlockTransform(x, y, z, newMatrix4);
 *
 *   // 6. Remove block (chunk auto-disposes when empty → GPU freed)
 *   cm.removeBlock(10, 5, 20);
 *
 *   // 7. Full cleanup
 *   cm.dispose();
 *
 * ════════════════════════════════════════════════════════════════════════════
 * PERFORMANCE CHARACTERISTICS (500×500 grid, 25×25 chunks)
 * ════════════════════════════════════════════════════════════════════════════
 *
 *   Metric                  | Naive Mesh-per-block | ChunkManager
 *   ------------------------|----------------------|------------------
 *   Draw calls (10k blocks) | 10,000               | ≤400 (non-empty)
 *   Block lookup            | O(N) scan            | O(1) Map.get
 *   Empty chunk cost        | wasted allocation    | 0 bytes / 0 GPU
 *   Per-frame matrix update | per-block            | per-chunk (batched)
 *   Frustum cull granularity| per-block (slow)     | per-chunk (fast)
 *   Memory/block            | ~1KB (Mesh+Geo+Mat)  | ~64 bytes (matrix+color)
 */

import * as THREE from 'three';

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_CHUNK_SIZE = 25;                  // 25×25 blocks per chunk
const DEFAULT_BLOCK_CAPACITY = 25 * 25 * 64;    // max blocks per chunk
const DEFAULT_CHUNK_HEIGHT_MAX = 64;            // max build height for culling

// ─── Scratch objects (avoid per-call allocation) ─────────────────────────────
const _tmpMatrix = new THREE.Matrix4();
const _tmpPos = new THREE.Vector3();
const _tmpQuat = new THREE.Quaternion();
const _tmpScale = new THREE.Vector3();
const _tmpColor = new THREE.Color();

// ─── Key helpers ─────────────────────────────────────────────────────────────
const chunkKey = (cx, cz) => `${cx},${cz}`;
const blockKey = (x, y, z) => `${x},${y},${z}`;

// ════════════════════════════════════════════════════════════════════════════
// Chunk — manages one sub-grid region with a single InstancedMesh.
// Lazy allocation: InstancedMesh is NOT created until first block is added.
// Empty chunks have ZERO GPU memory footprint.
// ════════════════════════════════════════════════════════════════════════════
class Chunk {
  constructor(cx, cz, manager) {
    this.cx = cx;
    this.cz = cz;
    this.manager = manager;

    // World-space origin (corner) of this chunk
    this.originX = cx * manager.chunkSize;
    this.originZ = cz * manager.chunkSize;

    // Lazily-allocated InstancedMesh (null until first block added)
    this.instancedMesh = null;

    // Block lookup: 'x,y,z' → instance index in InstancedMesh
    this.blockToIndex = new Map();

    // Reverse lookup: instance index → 'x,y,z' (for raycast hit → block coord)
    this.indexToBlock = [];

    // Free list for recycled indices (O(1) removal without reordering)
    this.freeIndices = [];

    // Current instance count
    this.count = 0;

    // Dirty flags — flushed once per frame by ChunkManager.update()
    this.matrixDirty = false;
    this.colorDirty = false;
  }

  /**
   * Lazy-allocate the InstancedMesh on first block add.
   * Empty chunks skip this entirely → zero GPU memory.
   */
  ensureAllocated() {
    if (this.instancedMesh) return;

    const { geometry, material, capacity, chunkSize, chunkHeightMax, scene } = this.manager;

    const mesh = new THREE.InstancedMesh(geometry, material, capacity);
    mesh.count = 0; // start empty — grow as blocks are added
    mesh.frustumCulled = true; // enable chunk-level frustum culling (spec #4)
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // STATIC boundingSphere encompassing the chunk's world AABB.
    // This lets three.js frustum-cull whole chunks in O(1) per chunk
    // (no per-instance iteration needed for culling).
    // Sphere is conservative — slightly larger than the actual block bounds —
    // but this is the correct tradeoff: cull granularity is per-chunk, not
    // per-block, so we accept minor over-draw for huge cull speedup.
    const cx0 = this.originX;
    const cz0 = this.originZ;
    const cyMax = chunkHeightMax;
    const center = new THREE.Vector3(
      cx0 + chunkSize / 2,
      cyMax / 2,
      cz0 + chunkSize / 2
    );
    const halfDiag = Math.sqrt(
      (chunkSize / 2) ** 2 + (cyMax / 2) ** 2 + (chunkSize / 2) ** 2
    );
    mesh.boundingSphere = new THREE.Sphere(center, halfDiag);

    // Per-instance color buffer (for tinting individual blocks).
    // Initialized to white (no tint) — actual block colors set via setColorAt.
    // DynamicDrawUsage because colors change at runtime (paint tool).
    const colors = new Float32Array(capacity * 3);
    for (let i = 0; i < capacity; i++) {
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    }
    mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);

    // instanceMatrix is also dynamic (blocks move/scale/rotate at runtime)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.instancedMesh = mesh;
    scene.add(mesh);
  }

  /**
   * Add a block to this chunk. Allocates InstancedMesh if this is the first block.
   * @param {number} x,y,z — world block coords
   * @param {THREE.Matrix4} matrix — full transform (pos + quat + scale)
   * @param {number} colorHex — block color (e.g. 0x3b82f6)
   * @returns {number} instance index, or -1 if capacity exceeded
   */
  addBlock(x, y, z, matrix, colorHex) {
    this.ensureAllocated();

    const key = blockKey(x, y, z);
    if (this.blockToIndex.has(key)) {
      // Block already exists — update in place instead of duplicate
      return this.updateBlock(x, y, z, matrix, colorHex);
    }

    // Allocate instance index — prefer recycled slots, else grow
    let index;
    if (this.freeIndices.length > 0) {
      index = this.freeIndices.pop();
    } else {
      index = this.count;
      if (index >= this.manager.capacity) {
        console.warn(
          `[Chunk ${this.cx},${this.cz}] capacity exceeded ` +
          `(${this.manager.capacity}). Block at (${x},${y},${z}) rejected.`
        );
        return -1;
      }
      this.count++;
    }

    // Apply matrix (pos + quat + scale baked into Matrix4)
    this.instancedMesh.setMatrixAt(index, matrix);

    // Apply per-instance color
    _tmpColor.setHex(colorHex);
    this.instancedMesh.setColorAt(index, _tmpColor);

    // Update lookup maps
    this.blockToIndex.set(key, index);
    this.indexToBlock[index] = key;

    // Grow visible count
    this.instancedMesh.count = this.count;

    // Mark dirty — will be flushed once at end of frame
    this.matrixDirty = true;
    this.colorDirty = true;

    return index;
  }

  /**
   * Update an existing block's transform and/or color.
   * @returns {number} instance index, or -1 if block not found
   */
  updateBlock(x, y, z, matrix, colorHex) {
    const key = blockKey(x, y, z);
    const index = this.blockToIndex.get(key);
    if (index === undefined) return -1;

    if (matrix) {
      this.instancedMesh.setMatrixAt(index, matrix);
      this.matrixDirty = true;
    }
    if (colorHex !== undefined) {
      _tmpColor.setHex(colorHex);
      this.instancedMesh.setColorAt(index, _tmpColor);
      this.colorDirty = true;
    }
    return index;
  }

  /**
   * Remove a block. Uses swap-remove strategy for O(1):
   * the last instance is moved into the freed slot, then count is decremented.
   * Block lookup maps are updated accordingly.
   *
   * Why swap-remove: keeps instance buffer compact (no gaps), so InstancedMesh
   * renders exactly `count` instances with no wasted GPU work on dead slots.
   */
  removeBlock(x, y, z) {
    const key = blockKey(x, y, z);
    const index = this.blockToIndex.get(key);
    if (index === undefined) return false;

    const lastIndex = this.count - 1;

    if (index !== lastIndex) {
      // Swap: move last instance's matrix+color into the freed slot
      this.instancedMesh.getMatrixAt(lastIndex, _tmpMatrix);
      this.instancedMesh.setMatrixAt(index, _tmpMatrix);

      if (this.instancedMesh.instanceColor) {
        this.instancedMesh.getColorAt(lastIndex, _tmpColor);
        this.instancedMesh.setColorAt(index, _tmpColor);
      }

      // Update reverse map: the last block's index is now `index`
      const lastKey = this.indexToBlock[lastIndex];
      this.blockToIndex.set(lastKey, index);
      this.indexToBlock[index] = lastKey;
      this.indexToBlock[lastIndex] = undefined;
    } else {
      // Removing the last instance — no swap needed
      this.indexToBlock[index] = undefined;
    }

    this.blockToIndex.delete(key);
    this.count--;
    this.instancedMesh.count = this.count;
    this.freeIndices.push(index); // recycle slot for future adds

    this.matrixDirty = true;
    this.colorDirty = true;

    return true;
  }

  /**
   * Get instance index for a block coord. O(1) Map lookup.
   * Returns undefined if not found.
   */
  getBlock(x, y, z) {
    return this.blockToIndex.get(blockKey(x, y, z));
  }

  /**
   * Flush pending matrix/color updates to GPU.
   * Called once per frame by ChunkManager.update() — NOT per block change.
   * This is the critical optimization: 1000 block updates in a frame = 1
   * needsUpdate call per chunk, not 1000.
   */
  flush() {
    if (!this.instancedMesh) return;
    if (this.matrixDirty) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
      this.matrixDirty = false;
    }
    if (this.colorDirty && this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
      this.colorDirty = false;
    }
  }

  /**
   * Dispose: remove from scene, free GPU buffers.
   * Called when chunk becomes empty (lazy unload) OR manager is disposed.
   * Geometry & material are NOT disposed here — they're shared across all
   * chunks and managed by ChunkManager.dispose().
   */
  dispose() {
    if (this.instancedMesh) {
      this.manager.scene.remove(this.instancedMesh);
      this.instancedMesh.dispose(); // frees instanceMatrix + instanceColor buffers
      this.instancedMesh = null;
    }
    this.blockToIndex.clear();
    this.indexToBlock.length = 0;
    this.freeIndices.length = 0;
    this.count = 0;
    this.matrixDirty = false;
    this.colorDirty = false;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ChunkManager — orchestrates all chunks, provides O(1) block API.
// Owns shared geometry + material (ONE BoxGeometry + ONE Material reused
// by ALL chunks → massive memory saver vs per-chunk assets).
// ════════════════════════════════════════════════════════════════════════════
class ChunkManager {
  constructor(scene, options = {}) {
    this.scene = scene;

    // ── Config ──
    this.chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
    this.capacity = options.capacity ?? DEFAULT_BLOCK_CAPACITY;
    this.chunkHeightMax = options.chunkHeightMax ?? DEFAULT_CHUNK_HEIGHT_MAX;

    // ── Shared geometry — ONE BoxGeometry(1,1,1) reused by ALL chunks ──
    // Per-instance scale handles thin planks (scale.y=0.05) and large blocks.
    this.geometry = options.geometry ?? new THREE.BoxGeometry(1, 1, 1);

    // ── Shared material — FrontSide = backface culling active (spec #4) ──
    // Interior faces of blocks are not rasterized → huge fill-rate savings.
    this.material = options.material ?? new THREE.MeshStandardMaterial({
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.FrontSide, // ← backface culling ON
    });

    // ── Chunk lookup: 'cx,cz' → Chunk instance ──
    // Only non-empty chunks live here. Empty chunks are deleted (lazy load).
    this.chunks = new Map();

    // ── Pending flush set — chunks with matrix/color changes this frame ──
    // Using Set → dedupes: 100 updates to same chunk = 1 flush entry.
    this._pendingFlush = new Set();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Coordinate helpers
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Convert world block coord (x, z) → chunk coord (cx, cz).
   * Uses Math.floor so negative coords map correctly (e.g. -1 → -1, not 0).
   */
  worldToChunkCoord(x, z) {
    return {
      cx: Math.floor(x / this.chunkSize),
      cz: Math.floor(z / this.chunkSize),
    };
  }

  /**
   * Get existing chunk at (cx, cz). Returns undefined if not allocated.
   */
  _getChunk(cx, cz) {
    return this.chunks.get(chunkKey(cx, cz));
  }

  /**
   * Get or create chunk at (cx, cz). Chunk object is cheap (just maps);
   * the expensive InstancedMesh is lazy-allocated on first block add.
   */
  _getOrCreateChunk(cx, cz) {
    const key = chunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cz, this);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Public Block API — O(1) lookup, lazy allocation, batched updates
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Set/update a block at world coords (x, y, z).
   * Accepts either a full Matrix4, or decomposed {position, quaternion, scale}.
   *
   * @param {number} x,y,z — world block coords
   * @param {Object} opts
   *   - matrix: THREE.Matrix4 (full transform, takes precedence)
   *   - position: [x,y,z] (default: [x,y,z] from args)
   *   - quaternion: [x,y,z,w] (default: identity)
   *   - scale: [sx,sy,sz] (default: [1,1,1]; use 0.05 for thin planks)
   *   - color: hex number (default: 0xffffff)
   * @returns {number} instance index, or -1 on failure
   */
  setBlock(x, y, z, opts = {}) {
    const { cx, cz } = this.worldToChunkCoord(x, z);
    const chunk = this._getOrCreateChunk(cx, cz);

    let matrix;
    if (opts.matrix instanceof THREE.Matrix4) {
      matrix = opts.matrix;
    } else {
      const pos = opts.position ?? [x, y, z];
      const quat = opts.quaternion ?? [0, 0, 0, 1];
      const scale = opts.scale ?? [1, 1, 1];
      _tmpPos.set(pos[0], pos[1], pos[2]);
      _tmpQuat.set(quat[0], quat[1], quat[2], quat[3]);
      _tmpScale.set(scale[0], scale[1], scale[2]);
      matrix = new THREE.Matrix4().compose(_tmpPos, _tmpQuat, _tmpScale);
    }

    const colorHex = opts.color ?? 0xffffff;
    const index = chunk.addBlock(x, y, z, matrix, colorHex);

    if (index >= 0) {
      this._pendingFlush.add(chunk);
    }
    return index;
  }

  /**
   * Update only the transform of an existing block.
   * Use this for gizmo drags (Move/Rotate/Scale tools) — high-frequency
   * updates batched into one needsUpdate per chunk per frame.
   *
   * @param {THREE.Matrix4} matrix — new full transform
   */
  updateBlockTransform(x, y, z, matrix) {
    const { cx, cz } = this.worldToChunkCoord(x, z);
    const chunk = this._getChunk(cx, cz);
    if (!chunk) return -1;

    const index = chunk.updateBlock(x, y, z, matrix, undefined);
    if (index >= 0) this._pendingFlush.add(chunk);
    return index;
  }

  /**
   * Update only the color of an existing block (paint tool).
   */
  updateBlockColor(x, y, z, colorHex) {
    const { cx, cz } = this.worldToChunkCoord(x, z);
    const chunk = this._getChunk(cx, cz);
    if (!chunk) return -1;

    const index = chunk.updateBlock(x, y, z, undefined, colorHex);
    if (index >= 0) this._pendingFlush.add(chunk);
    return index;
  }

  /**
   * Remove a block. If chunk becomes empty, it is auto-disposed (lazy unload)
   * → GPU memory freed immediately. Spec #2: no empty chunk left behind.
   */
  removeBlock(x, y, z) {
    const { cx, cz } = this.worldToChunkCoord(x, z);
    const chunk = this._getChunk(cx, cz);
    if (!chunk) return false;

    const removed = chunk.removeBlock(x, y, z);
    if (removed) {
      // Auto-dispose empty chunks → free GPU memory (spec #2: lazy loading)
      if (chunk.count === 0) {
        chunk.dispose();
        this.chunks.delete(chunkKey(cx, cz));
      } else {
        this._pendingFlush.add(chunk);
      }
    }
    return removed;
  }

  /**
   * Get a block's instance index at world coords. O(1) lookup.
   * Returns -1 if no block exists.
   */
  getBlock(x, y, z) {
    const { cx, cz } = this.worldToChunkCoord(x, z);
    const chunk = this._getChunk(cx, cz);
    if (!chunk) return -1;
    const index = chunk.getBlock(x, y, z);
    return index ?? -1;
  }

  /**
   * Check if a block exists at coords. O(1).
   */
  hasBlock(x, y, z) {
    return this.getBlock(x, y, z) >= 0;
  }

  /**
   * Get all allocated chunks' InstancedMeshes for raycasting.
   * Returns array of { chunk, mesh } — pass mesh array to raycaster.
   *
   * Usage:
   *   const targets = cm.getRaycastTargets();
   *   const hits = raycaster.intersectObjects(targets.map(t => t.mesh));
   *   if (hits[0]) {
   *     const target = targets.find(t => t.mesh === hits[0].object);
   *     const coords = cm.instanceIdToCoords(target.chunk, hits[0].instanceId);
   *   }
   */
  getRaycastTargets() {
    const targets = [];
    for (const chunk of this.chunks.values()) {
      if (chunk.instancedMesh) {
        targets.push({ chunk, mesh: chunk.instancedMesh });
      }
    }
    return targets;
  }

  /**
   * Resolve a raycast hit's instanceId back to world block coords.
   * @param {Chunk} chunk — the chunk the hit came from (from getRaycastTargets)
   * @param {number} instanceId — from intersection.instanceId
   * @returns {{x,y,z}|null}
   */
  instanceIdToCoords(chunk, instanceId) {
    const key = chunk.indexToBlock[instanceId];
    if (!key) return null;
    const parts = key.split(',');
    return {
      x: Number(parts[0]),
      y: Number(parts[1]),
      z: Number(parts[2]),
    };
  }

  /**
   * Get the world-space matrix of a block (for gizmo attach, etc).
   * @param {THREE.Matrix4} target — optional, reused if provided
   * @returns {THREE.Matrix4|null} null if block not found
   */
  getBlockMatrix(x, y, z, target = new THREE.Matrix4()) {
    const { cx, cz } = this.worldToChunkCoord(x, z);
    const chunk = this._getChunk(cx, cz);
    if (!chunk || !chunk.instancedMesh) return null;
    const index = chunk.getBlock(x, y, z);
    if (index === undefined) return null;
    chunk.instancedMesh.getMatrixAt(index, target);
    return target;
  }

  /**
   * Iterate all blocks across all chunks.
   * Callback receives (x, y, z, matrix, colorHex) for each block.
   * Useful for serialization (save/export) or bulk operations.
   */
  forEachBlock(callback) {
    const mat = new THREE.Matrix4();
    const col = new THREE.Color();
    for (const chunk of this.chunks.values()) {
      if (!chunk.instancedMesh) continue;
      for (const [key, index] of chunk.blockToIndex) {
        const [x, y, z] = key.split(',').map(Number);
        chunk.instancedMesh.getMatrixAt(index, mat);
        if (chunk.instancedMesh.instanceColor) {
          chunk.instancedMesh.getColorAt(index, col);
        } else {
          col.setHex(0xffffff);
        }
        callback(x, y, z, mat, col.getHex());
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Frame loop — call update() once per frame in animate loop
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Call once per frame. Flushes all pending matrix/color updates in a single
   * batch — only chunks with changes get instanceMatrix.needsUpdate = true.
   *
   * Critical optimization: 1000 block updates in a frame across 50 chunks
   * = 50 needsUpdate calls (1 per dirty chunk), NOT 1000.
   *
   * @param {THREE.Camera} _camera — reserved for future LOD/distance culling
   */
  update(_camera) {
    for (const chunk of this._pendingFlush) {
      chunk.flush();
    }
    this._pendingFlush.clear();
  }

  /**
   * Clear all blocks and dispose all chunks. Geometry & material are kept
   * (they're shared and cheap to keep around for re-use).
   */
  clear() {
    for (const chunk of this.chunks.values()) {
      chunk.dispose();
    }
    this.chunks.clear();
    this._pendingFlush.clear();
  }

  /**
   * Total block count across all chunks. O(chunks) — use sparingly.
   */
  get totalBlocks() {
    let total = 0;
    for (const chunk of this.chunks.values()) {
      total += chunk.count;
    }
    return total;
  }

  /**
   * Total allocated chunk count (non-empty chunks only).
   */
  get totalChunks() {
    return this.chunks.size;
  }

  /**
   * Full cleanup — dispose all chunks, shared geometry, shared material.
   * Call when ChunkManager is no longer needed (e.g. component unmount).
   */
  dispose() {
    this.clear();
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
  }
}

export { ChunkManager, Chunk };
export default ChunkManager;
