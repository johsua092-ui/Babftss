# Worklog — Babftss (3D Block Simulator)

Chronological log of research / refactor sessions. Append-only.
Each entry: Task ID, date, scope, findings, files touched, next actions.

---

## riset-proxy-mesh — 2026-09-19 (Explore subagent, read-only)

**Tugas**: Telusuri sinkronisasi antara proxy mesh (THREE.Mesh individual
yang di-attach ke TransformControls) dan InstancedMesh (block asli di
ChunkManager). Mencari jawaban: apakah ada 2 block di 1 tempat saat scale?

**Files dibaca** (read-only, nol modifikasi):
- src/lib/ChunkManager.js (full architecture + class Chunk + setBlock/updateBlock/removeBlock)
- src/pages/BlockSimulator3D.jsx
  - lines 12440-12631 (onTransformDraggingChanged + onTransformObjectChange)
  - lines 12820-13034 (syncMeshesToChunks — Phase 36 mirror layer)
  - lines 13036-13368 (placeBlock + createMirrorMesh + ghost)
  - lines 13640-13899 (click handler, attachGizmoToSelection, clearSelection)
  - lines 14190-14260 (snapshotState rebuild)
- src/components/GizmoBlockInfoPanel.jsx (readGizmoTarget)
- KONTRAK_PERMANEN.md sections 0-9 + 27-28

**Findings**:
1. **TIDAK ADA proxy mesh terpisah.** User klik block →
   `raycaster.intersectObjects(threeRef.current.blocks, true)` → hit
   Mesh → `selectBlock(mesh)` → `transformControls.attach(mesh)`.
   tc.object = block asli (THREE.Mesh di array `threeRef.current.blocks`)
   secara langsung. Tidak pernah dibuat clone/wrapper/proxy untuk
   keperluan gizmo. Untuk multi-select: dibuat `selectionGroup`
   (THREE.Group temporer), block di-reparent ke group via
   `selectionGroup.attach(b)`. Tapi itu grouping parenting — bukan
   proxy geometry.
2. **InstancedMesh BUKAN block asli — dia "render mirror layer".**
   Source of truth = array `threeRef.current.blocks` (Mesh asli).
   ChunkManager di-sync tiap frame via `syncMeshesToChunks()` di
   animation loop (line 12839) — increment diff: bandingkan cache
   {px,py,pz,sx,sy,sz,rx,ry,rz,color} vs mesh transform sekarang;
   kalau beda → `cm.removeBlock(oldXYZ)` + `cm.setBlock(newXYZ,
   {matrix, color})`. Mesh `.visible = false` saat mode instanced
   aktif, tapi raycaster TETAP hit mesh invisible (Three.js ignore
   visible flag untuk raycast) → click + gizmo selalu jalan di Mesh.
3. **objectChange (scale) TIDAK sync InstancedMesh langsung.** Handler
   `onTransformObjectChange` (line 12573) hanya:
   - baca `obj` (Mesh yang di-attach)
   - kalau translate mode: snap position ke grid
   - kalau scale mode: `applyScaleByMode(...)` (ubah obj.scale +
     reposition utk mode 1/4/6 side) + `applyGeometryOffset(...)`
     (clone + translate geometry vertices utk "sisi seberang diam"
     Phase 87) + `clampBlockScale(...)` + `syncBlockTextureTiling(...)`.
   Tidak ada `cm.setBlock` / `cm.updateBlockTransform` / `setMatrixAt`
   di handler ini. Sync InstancedMesh ditangguhkan ke frame berikutnya
   di `syncMeshesToChunks()` (lag 1 frame, <16ms).
4. **mouseUp (dragging-changed false) TIDAK ada commit khusus.** Handler
   `onTransformDraggingChanged` (line 12453) saat `e.value=false`:
   - re-apply applyGeometryOffset (Phase 87 fix)
   - `clearScaleDragStart(transformControls.object)`
   - `scaleDragRef.current = null`
   - delete userData flags
   - kalau clone/mirror & ada ghost: finalkan jadi block permanen
   - `recordHistory()` (snapshot undo/redo)
   Tidak ada call ke ChunkManager. Karena Mesh = source of truth dan
   sync per-frame sudah jalan, gak butuh commit eksplisit — InstancedMesh
   akan kejar di frame berikutnya juga.
5. **Apakah ada 2 block di 1 tempat saat scale?**
   - **Ya, ada 2 representasi**: Mesh (invisible di mode instanced)
     + instance InstancedMesh. TAPI hanya saat renderMode === 'instanced'
     ATAU 'auto' + blocks.length > 2000.
   - Saat scale drag, **hanya Mesh yang di-modify** oleh TransformControls
     + applyScaleByMode + applyGeometryOffset. InstancedMesh instance
     kejar di syncMeshesToChunks frame berikutnya.
   - Visual saat mode instanced: user lihat InstancedMesh instance
     (Mesh invisible) → tidak ada double-image visual, hanya lag 1 frame.
   - **BUG LATEN (di mode instanced)**: `applyGeometryOffset` clone +
     translate **geometry vertices** di Mesh. ChunkManager pakai
     **shared BoxGeometry(1,1,1)** untuk semua instance — TIDAK bisa
     per-instance geometry translate. cm.setBlock hanya bake matrix
     (pos+quat+scale), tidak bake geometry offset. → Di mode 1/4/6
     side scale + renderMode=instanced, **InstancedMesh instance TIDAK
     menampilkan "sisi seberang diam"** — sisi seberang tetap bergerak
     (matrix.scale dari pusat = kedua sisi bergerak simetris). Fix Phase
     87 hanya jalan di Mesh mode. User mungkin gak pernah lihat bug ini
     karena default renderMode='auto' + <2000 blocks → Mesh mode.

**Sinkronisasi summary**:
| Sumber | Tujuan | Trigger | Lag |
|---|---|---|---|
| TransformControls drag | Mesh.scale/position/geometry | objectChange (per-frame selama drag) | 0 (sync) |
| Mesh | InstancedMesh instance matrix+color | syncMeshesToChunks (animate loop) | 1 frame |
| Mesh.geometry translate (Phase 87) | InstancedMesh | TIDAK SYNC (shared geometry limitation) | ∞ (lost) |

**GizmoBlockInfoPanel.jsx readGizmoTarget**:
- Cek `obj.isObject3D`, `obj.userData.__selectionGroup`/`obj.isGroup`
  (multi), `obj.userData.blockSlug` (slug), `obj.scale` (studs label).
- TIDAK ada `isInstancedMesh` check — karena gizmo memang TIDAK
  pernah attach ke InstancedMesh (selalu Mesh atau Group).

**Next actions** (kalau user mau perbaiki bug mode instanced + 1/4/6 side):
- Opsi A: saat scale drag di mode instanced + mode 1/4/6 side, pakai
  per-instance matrix yang bake geometry offset ke matrix translation
  (instead of geometry.translate). Tapi rumusnya beda — harus hitung
  offset translate yang setara.
- Opsi B: pakai InstancedBufferAttribute custom (per-instance geometry
  offset) + onBeforeCompile shader injection. Kompleks, version-dependent
  (dilarang dulu oleh komentar Phase 39 line 12953-12955).
- Opsi C: saat scale drag aktif, switch sementara ke Mesh rendering
  utk block yang di-attach (set mesh.visible=true, skip cm.setBlock
  for it). Lalu balik ke instanced saat drag selesai. Paling minim risk.

Status: **riset selesai, nol modifikasi kode**.
