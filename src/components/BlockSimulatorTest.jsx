/**
 * BlockSimulatorTest.jsx — Test page for ChunkManager engine.
 *
 * Isolated test environment that does NOT modify BlockSimulator3Dv2.jsx.
 * Duplicates basic UI from v2 (3D canvas, grid, camera controls) but uses
 * src/lib/ChunkManager.js for rendering instead of per-block Mesh.
 *
 * Features:
 *   - 500×500 grid (matches v2)
 *   - ChunkManager engine (InstancedMesh per 25×25 chunk)
 *   - Stress test: "Generate 10,000 Random Blocks" button
 *   - Real-time FPS / Block count / Chunk count / Draw calls
 *   - OrbitControls (pan/zoom/rotate) for frustum cull verification
 *   - No fog — blocks visible edge to edge
 *   - Camera far=2000 (covers 500×500 diagonal ~707)
 *
 * Self-contained — imports only three.js, OrbitControls, ChunkManager, lucide-react.
 * Zero dependencies on BlockSimulator3Dv2.jsx.
 */

import { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Zap, Trash2, Activity, Boxes } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ChunkManager } from '../lib/ChunkManager.js';

const GRID_SIZE = 250; // grid = GRID_SIZE * 2 = 500 units → 500×500 (matches v2)

// Color palette for stress test blocks
const STRESS_COLORS = [
    0x3b82f6, // blue
    0xef4444, // red
    0x22c55e, // green
    0xf59e0b, // amber
    0xa855f7, // purple
    0x06b6d4, // cyan
    0xec4899, // pink
    0x84cc16, // lime
];

export default function BlockSimulatorTest({ setPage }) {
    // ── React state for UI (updated once per second, not per frame) ──
    const [fps, setFps] = useState(0);
    const [blockCount, setBlockCount] = useState(0);
    const [chunkCount, setChunkCount] = useState(0);
    const [drawCalls, setDrawCalls] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genTime, setGenTime] = useState(null);

    // ── Refs for three.js objects (mutated in animate loop, not React state) ──
    const containerRef = useRef(null);
    const threeRef = useRef(null);
    const cmRef = useRef(null);
    const fpsRef = useRef({ frames: 0, lastTime: performance.now() });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        // ── Scene ──
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#0a0f1a');

        // ── Camera — far=2000 covers 500×500 diagonal (~707) with margin ──
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
        camera.position.set(300, 250, 300);
        camera.lookAt(0, 0, 0);

        // ── Renderer ──
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // ── OrbitControls — full pan/zoom/rotate for frustum cull verification ──
        const controls = new OrbitControls(camera, renderer.domElement);
        // Mouse button mapping (per request user 2026-09-02):
        //   LEFT  = PAN   (geser area pandang)
        //   RIGHT = ROTATE (orbit camera)
        // Default three.js: LEFT=ROTATE, RIGHT=PAN — swapped here.
        controls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE,
        };
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 1;       // extreme close-up
        controls.maxDistance = 1500;    // zoom out to see full 500×500 grid
        controls.maxPolarAngle = Math.PI / 2 - 0.02; // prevent going below ground
        controls.target.set(0, 0, 0);

        // ── Lights ──
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 100, 50);
        scene.add(dirLight);
        scene.add(new THREE.HemisphereLight(0x4a6fa5, 0x1a1a2e, 0.3));

        // ── Grid — 500×500 units, 500 divisions (1 unit per cell, matches v2) ──
        const grid = new THREE.GridHelper(GRID_SIZE * 2, GRID_SIZE * 2, 0x64748b, 0x334155);
        grid.material.opacity = 0.5;
        grid.material.transparent = true;
        scene.add(grid);

        // ── Ground plane (visual reference + raycast target) ──
        const groundGeo = new THREE.PlaneGeometry(GRID_SIZE * 2, GRID_SIZE * 2);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x0e1420, roughness: 1, metalness: 0,
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        scene.add(ground);

        // ── ChunkManager — the engine under test ──
        // chunkSize=25 → 500/25 = 20 chunks per side → 400 chunks max.
        // capacity=25*25*64=40000 per chunk (way more than needed for 10k blocks).
        const cm = new ChunkManager(scene, {
            chunkSize: 25,
            capacity: 25 * 25 * 64,
            chunkHeightMax: 64,
        });
        cmRef.current = cm;

        threeRef.current = { scene, camera, renderer, controls, grid, groundGeo, groundMat };

        // ── Animate loop ──
        let animId;
        const animate = () => {
            animId = requestAnimationFrame(animate);
            controls.update();
            cm.update(camera); // flush pending matrix/color updates (batched)
            renderer.render(scene, camera);

            // FPS + stats (update once per second to avoid React re-render spam)
            const now = performance.now();
            fpsRef.current.frames++;
            if (now - fpsRef.current.lastTime >= 1000) {
                setFps(fpsRef.current.frames);
                setDrawCalls(renderer.info.render.calls);
                setBlockCount(cm.totalBlocks);
                setChunkCount(cm.totalChunks);
                fpsRef.current.frames = 0;
                fpsRef.current.lastTime = now;
            }
        };
        animate();

        // ── Resize handler ──
        const onResize = () => {
            const w = container.clientWidth || window.innerWidth;
            const h = container.clientHeight || window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        // ── Cleanup (critical for React StrictMode double-mount in dev) ──
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', onResize);
            cm.dispose(); // disposes all chunks + shared geometry/material
            renderer.dispose();
            grid.geometry.dispose();
            grid.material.dispose();
            groundGeo.dispose();
            groundMat.dispose();
            if (renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
            threeRef.current = null;
            cmRef.current = null;
        };
    }, []);

    // ── Stress test: generate 10,000 random blocks ──
    // Tests ChunkManager's ability to handle:
    //   - High block count (10k)
    //   - Random positions across 500×500 grid
    //   - Thin planks (scale.y as low as 0.05 — spec requirement)
    //   - Tall pillars (scale.y up to 6)
    //   - Random Y rotations (quaternion)
    //   - Per-instance colors (8-color palette)
    const generateStressTest = () => {
        if (!cmRef.current || isGenerating) return;
        setIsGenerating(true);
        setGenTime(null);

        // Defer to next tick so UI updates "Generating..." before heavy work
        setTimeout(() => {
            const cm = cmRef.current;
            if (!cm) {
                setIsGenerating(false);
                return;
            }

            const startTime = performance.now();

            for (let i = 0; i < 10000; i++) {
                // Random position within 500×500 grid, y from 0 to 19
                const x = Math.floor(Math.random() * (GRID_SIZE * 2)) - GRID_SIZE;
                const z = Math.floor(Math.random() * (GRID_SIZE * 2)) - GRID_SIZE;
                const y = Math.floor(Math.random() * 20);
                const color = STRESS_COLORS[Math.floor(Math.random() * STRESS_COLORS.length)];

                // Random scale type — tests full range of scale customization
                const r = Math.random();
                let scale;
                if (r < 0.3) {
                    // Thin plank (scale.y as low as 0.05 — spec requirement)
                    scale = [1 + Math.random() * 2, 0.05 + Math.random() * 0.1, 1 + Math.random() * 2];
                } else if (r < 0.6) {
                    // Tall pillar
                    scale = [0.5 + Math.random() * 0.5, 2 + Math.random() * 4, 0.5 + Math.random() * 0.5];
                } else {
                    // Normal block
                    scale = [0.5 + Math.random(), 0.5 + Math.random(), 0.5 + Math.random()];
                }

                // Random Y rotation (50% of blocks) — tests rotation customization
                let quaternion = [0, 0, 0, 1]; // identity
                if (Math.random() < 0.5) {
                    const angle = Math.random() * Math.PI * 2;
                    quaternion = [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)];
                }

                cm.setBlock(x, y, z, { color, scale, quaternion });
            }

            const elapsed = performance.now() - startTime;
            setGenTime(elapsed);
            setBlockCount(cm.totalBlocks);
            setChunkCount(cm.totalChunks);
            setIsGenerating(false);
        }, 50);
    };

    const clearAll = () => {
        if (!cmRef.current) return;
        cmRef.current.clear();
        setBlockCount(0);
        setChunkCount(0);
        setGenTime(null);
    };

    // ════════════════════════════════════════════════════════════════════════════
    // ARCHITECTURE DEMO — Object3D Dummy Pattern
    // ════════════════════════════════════════════════════════════════════════════
    // Demonstrates spec rule #3: 'tunjukkan cara mengatur posisi, rotasi, serta
    // skala balok yang berbeda menggunakan Object3D dummy atau Matrix4'.
    //
    // The Object3D dummy pattern is the idiomatic three.js approach:
    //   1. Create ONE reusable THREE.Object3D() instance (dummy).
    //   2. Set its .position, .rotation (Euler), .scale — readable, intuitive.
    //   3. Call dummy.updateMatrix() to bake into Matrix4.
    //   4. Pass dummy.matrix to ChunkManager.setBlock().
    //
    // This is cleaner than manually composing Matrix4 from Vector3 + Quaternion
    // + Vector3 (which the stress test already does). Both patterns produce the
    // same Matrix4 — Object3D dummy is just easier to read/maintain.
    //
    // The dummy is declared OUTSIDE the loop (spec rule #5: avoid per-call
    // allocation) — reused for every block in this demo.
    // ──────────────────────────────────────────────────────────────────────────
    const placeArchitectureDemo = () => {
        if (!cmRef.current) return;
        const cm = cmRef.current;

        // ── Reusable Object3D dummy (allocated ONCE, reused per block) ──
        // Spec rule #5: 'jangan dipanggil berulang-ulang di dalam loop'.
        // Allocating `new THREE.Object3D()` inside the loop would create
        // 30 garbage objects — instead we reuse one.
        const dummy = new THREE.Object3D();

        // ── Curated blocks demonstrating extreme scale + rotation variety ──
        // Each entry = one block with explicit position/rotation/scale/color.
        // This is the 'clean, modular' demo the spec asks for.
        const demoBlocks = [
            // ── Thin planks (scale.y = 0.05 — spec minimum) ──
            // Demonstrates that InstancedMesh handles sub-unit scales correctly.
            // Backface culling (FrontSide) ensures the thin slab still looks solid.
            { pos: [0, 0, 0], rot: [0, 0, 0], scale: [10, 0.05, 4], color: 0x3b82f6 },   // floor plank
            { pos: [15, 5, 0], rot: [0, Math.PI / 6, 0], scale: [8, 0.05, 3], color: 0xef4444 }, // rotated plank
            { pos: [-15, 8, 5], rot: [0, Math.PI / 4, 0], scale: [6, 0.05, 2], color: 0x22c55e },

            // ── Tall pillars (scale.y up to 10) ──
            { pos: [30, 5, 30], rot: [0, 0, 0], scale: [1, 10, 1], color: 0xa855f7 },
            { pos: [32, 3, 32], rot: [0, Math.PI / 8, 0], scale: [0.8, 6, 0.8], color: 0xf59e0b },
            { pos: [-30, 4, -30], rot: [0, 0, 0], scale: [1.2, 8, 1.2], color: 0x06b6d4 },
            { pos: [-32, 2.5, -28], rot: [0, Math.PI / 3, 0], scale: [0.9, 5, 0.9], color: 0xec4899 },

            // ── Wide flat slabs (scale.x large, scale.y thin) ──
            { pos: [0, 0.1, 20], rot: [0, 0, 0], scale: [15, 0.2, 8], color: 0x84cc16 },
            { pos: [0, 0.15, -20], rot: [0, Math.PI / 2, 0], scale: [12, 0.2, 6], color: 0x64748b },

            // ── Tilted blocks (rot.z != 0 — diagonal lean) ──
            { pos: [40, 3, 0], rot: [0, 0, Math.PI / 6], scale: [2, 6, 2], color: 0xfbbf24 },   // lean right 30°
            { pos: [-40, 3, 0], rot: [0, 0, -Math.PI / 6], scale: [2, 6, 2], color: 0xfbbf24 }, // lean left 30°
            { pos: [0, 3, 40], rot: [Math.PI / 6, 0, 0], scale: [2, 6, 2], color: 0xa855f7 },  // lean forward
            { pos: [0, 3, -40], rot: [-Math.PI / 6, 0, 0], scale: [2, 6, 2], color: 0xa855f7 },// lean backward

            // ── Tiny blocks (scale 0.3 — small details) ──
            { pos: [10, 0.5, 10], rot: [0, 0, 0], scale: [0.3, 0.3, 0.3], color: 0xef4444 },
            { pos: [11, 0.5, 10], rot: [0, Math.PI / 4, 0], scale: [0.3, 0.3, 0.3], color: 0x22c55e },
            { pos: [12, 0.5, 10], rot: [0, Math.PI / 2, 0], scale: [0.3, 0.3, 0.3], color: 0x3b82f6 },

            // ── Stairs (progressive Y position + scale) ──
            { pos: [-20, 0.5, 15], rot: [0, 0, 0], scale: [3, 1, 3], color: 0x06b6d4 },
            { pos: [-20, 1.5, 18], rot: [0, 0, 0], scale: [3, 1, 3], color: 0x06b6d4 },
            { pos: [-20, 2.5, 21], rot: [0, 0, 0], scale: [3, 1, 3], color: 0x06b6d4 },
            { pos: [-20, 3.5, 24], rot: [0, 0, 0], scale: [3, 1, 3], color: 0x06b6d4 },

            // ── 45° rotated cubes (diamond pattern) ──
            { pos: [25, 1, -25], rot: [0, Math.PI / 4, 0], scale: [2, 2, 2], color: 0xec4899 },
            { pos: [28, 1, -28], rot: [0, Math.PI / 4, 0], scale: [2, 2, 2], color: 0xec4899 },
            { pos: [22, 1, -22], rot: [0, Math.PI / 4, 0], scale: [2, 2, 2], color: 0xec4899 },

            // ── Extreme thin vertical posts (scale.x/z = 0.1) ──
            { pos: [50, 5, 0], rot: [0, 0, 0], scale: [0.1, 10, 0.1], color: 0xffffff },
            { pos: [52, 5, 0], rot: [0, 0, 0], scale: [0.1, 10, 0.1], color: 0xffffff },
            { pos: [54, 5, 0], rot: [0, 0, 0], scale: [0.1, 10, 0.1], color: 0xffffff },
        ];

        // ── Apply each block via Object3D dummy pattern ──
        // Spec rule #3: set position/rotation/scale on dummy, then bake to Matrix4.
        // ChunkManager.setBlock accepts either a Matrix4 OR decomposed {pos,quat,scale}.
        // Here we pass dummy.matrix (baked Matrix4) — the cleanest demo of the pattern.
        for (const b of demoBlocks) {
            dummy.position.set(b.pos[0], b.pos[1], b.pos[2]);
            dummy.rotation.set(b.rot[0], b.rot[1], b.rot[2]);  // Euler angles — readable
            dummy.scale.set(b.scale[0], b.scale[1], b.scale[2]);
            dummy.updateMatrix();  // bake pos+rot+scale → Matrix4
            // dummy.matrix now contains the full transform. Pass to ChunkManager.
            cm.setBlock(b.pos[0], Math.floor(b.pos[1]), b.pos[2], {
                matrix: dummy.matrix.clone(),  // clone because dummy is reused next iter
                color: b.color,
            });
        }

        // Spec rule #5: needsUpdate is called ONCE per chunk per frame (inside
        // cm.update() in the animate loop), NOT per setBlock call. The 30 setBlock
        // calls above batch into 1 needsUpdate per affected chunk on next frame.

        setBlockCount(cm.totalBlocks);
        setChunkCount(cm.totalChunks);
        setGenTime(null);
    };

    const fpsColor = fps > 50 ? '#22c55e' : fps > 30 ? '#f59e0b' : '#ef4444';

    return (
        <div style={{
            minHeight: '100dvh', display: 'flex', flexDirection: 'column',
            background: '#0a0f1a', color: '#e2e8f0',
            fontFamily: 'Inter, sans-serif', overflow: 'hidden',
        }}>
            {/* ── Top bar ── */}
            <div style={{
                padding: '10px 16px',
                background: '#0e1420',
                borderBottom: '1px solid #1e293b',
                display: 'flex', alignItems: 'center', gap: 12,
                flexShrink: 0,
            }}>
                <button
                    onClick={() => setPage('shapes')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 8,
                        backgroundColor: '#0f172a', border: '1px solid #334155',
                        color: '#94a3b8', cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12,
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#475569'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#334155'; }}
                >
                    <ArrowLeft size={14} /> Back
                </button>
                <h1 style={{
                    margin: 0, fontSize: 14, fontFamily: 'Orbitron, sans-serif',
                    fontWeight: 800, color: '#22d3ee', letterSpacing: '0.02em',
                }}>
                    3D Block Simulator v2 — TEST
                    <span style={{ color: '#64748b', fontWeight: 400, fontSize: 11, marginLeft: 8 }}>
                        ChunkManager Engine
                    </span>
                </h1>
                {/* ── Real-time stats ── */}
                <div style={{
                    marginLeft: 'auto', display: 'flex', gap: 16,
                    alignItems: 'center', fontSize: 11,
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#64748b', fontWeight: 500 }}>FPS:</span>
                        <span style={{ color: fpsColor, fontWeight: 700, fontFamily: 'monospace', minWidth: 30, textAlign: 'right' }}>{fps}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#64748b', fontWeight: 500 }}>Blocks:</span>
                        <span style={{ color: '#e2e8f0', fontWeight: 700, fontFamily: 'monospace' }}>{blockCount.toLocaleString()}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#64748b', fontWeight: 500 }}>Chunks:</span>
                        <span style={{ color: '#e2e8f0', fontWeight: 700, fontFamily: 'monospace' }}>{chunkCount}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#64748b', fontWeight: 500 }}>Draws:</span>
                        <span style={{ color: '#06b6d4', fontWeight: 700, fontFamily: 'monospace' }}>{drawCalls}</span>
                    </span>
                    {genTime !== null && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: '#64748b', fontWeight: 500 }}>Gen:</span>
                            <span style={{ color: '#fbbf24', fontWeight: 700, fontFamily: 'monospace' }}>{genTime.toFixed(0)}ms</span>
                        </span>
                    )}
                </div>
            </div>

            {/* ── Canvas container ── */}
            <div ref={containerRef} style={{ flex: 1, position: 'relative', minHeight: 0 }} />

            {/* ── Floating action buttons (bottom center) ── */}
            <div style={{
                position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 10, zIndex: 10,
            }}>
                <button
                    onClick={generateStressTest}
                    disabled={isGenerating}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '12px 24px', borderRadius: 12,
                        backgroundColor: isGenerating ? '#1e293b' : '#22c55e',
                        border: 'none', cursor: isGenerating ? 'wait' : 'pointer',
                        fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: 13,
                        color: isGenerating ? '#64748b' : '#052e16',
                        letterSpacing: 0.5,
                        boxShadow: isGenerating ? 'none' : '0 8px 24px rgba(34,197,94,0.3)',
                        transition: 'all 0.2s',
                    }}
                >
                    <Zap size={16} /> {isGenerating ? 'Generating...' : 'Generate 10,000 Random Blocks'}
                </button>
                <button
                    onClick={placeArchitectureDemo}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '12px 20px', borderRadius: 12,
                        backgroundColor: '#7c3aed', border: 'none', cursor: 'pointer',
                        fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: 13,
                        color: '#fff', letterSpacing: 0.5,
                        boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
                        transition: 'all 0.2s',
                    }}
                >
                    <Boxes size={16} /> Demo: Object3D Dummy
                </button>
                <button
                    onClick={clearAll}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '12px 20px', borderRadius: 12,
                        backgroundColor: '#0f172a', border: '1px solid #ef4444',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
                        color: '#ef4444',
                        transition: 'all 0.2s',
                    }}
                >
                    <Trash2 size={16} /> Clear All
                </button>
            </div>

            {/* ── Info panel (top right) ── */}
            <div style={{
                position: 'absolute', top: 60, right: 16,
                padding: '14px 16px',
                background: 'rgba(14,20,32,0.92)',
                border: '1px solid #1e293b',
                borderRadius: 10,
                fontSize: 11, color: '#94a3b8',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.7,
                maxWidth: 260,
                backdropFilter: 'blur(8px)',
                zIndex: 5,
            }}>
                <div style={{
                    fontWeight: 700, color: '#22d3ee', marginBottom: 8,
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                }}>
                    <Activity size={14} /> CHUNK MANAGER TEST
                </div>
                <div>Engine: <strong style={{ color: '#e2e8f0' }}>InstancedMesh per Chunk</strong></div>
                <div>Chunk size: <strong style={{ color: '#e2e8f0' }}>25×25 blocks</strong></div>
                <div>Grid: <strong style={{ color: '#e2e8f0' }}>500×500 (diag ~707)</strong></div>
                <div>Camera far: <strong style={{ color: '#e2e8f0' }}>2000 (no fog)</strong></div>
                <div style={{
                    marginTop: 8, paddingTop: 8,
                    borderTop: '1px solid rgba(148,163,184,0.15)',
                }}>
                    <strong style={{ color: '#e2e8f0' }}>Architecture Compliance:</strong><br/>
                    <span style={{ color: '#22c55e' }}>✓</span> No Mesh-per-block (InstancedMesh)<br/>
                    <span style={{ color: '#22c55e' }}>✓</span> Matrix4 via setMatrixAt<br/>
                    <span style={{ color: '#22c55e' }}>✓</span> FrontSide (backface cull)<br/>
                    <span style={{ color: '#22c55e' }}>✓</span> needsUpdate 1×/frame<br/>
                    <span style={{ color: '#22c55e' }}>✓</span> Frustum cull per chunk<br/>
                    <span style={{ color: '#22c55e' }}>✓</span> Object3D dummy pattern<br/>
                </div>
                <div style={{
                    marginTop: 8, paddingTop: 8,
                    borderTop: '1px solid rgba(148,163,184,0.15)',
                }}>
                    <strong style={{ color: '#e2e8f0' }}>Camera Controls:</strong><br/>
                    L-Drag = Pan<br/>
                    R-Drag = Orbit<br/>
                    Scroll = Zoom<br/>
                </div>
                <div style={{
                    marginTop: 8, paddingTop: 8,
                    borderTop: '1px solid rgba(148,163,184,0.15)',
                }}>
                    <strong style={{ color: '#e2e8f0' }}>Verify:</strong><br/>
                    ✓ 10k blocks at 60+ FPS<br/>
                    ✓ Off-screen chunks cull<br/>
                    ✓ No fog — see edge to edge<br/>
                    ✓ Thin planks (0.05 scale)<br/>
                    ✓ Random rotations<br/>
                </div>
            </div>
        </div>
    );
}
