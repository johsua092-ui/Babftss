import { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Box, Info, Plus, Trash2, Move, RotateCw, Maximize, Paintbrush, Pipette, Grid3x3, Undo2, Redo2, Shapes, Upload, Download, Sparkles, ChevronDown, ChevronRight, Copy, FlipHorizontal, Group, Ungroup, Home, TreePine, Car, Building2, Lightbulb, Globe } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/* ================================================================
   3D BLOCK SIMULATOR v2 — Three.js Engine
   Phase 1: 3D Viewport Proper (WebGL)
   ================================================================

   Ini adalah sistem 3D BLOCKED SIMULATOR v2 yang pakai Three.js (WebGL),
   BUKAN Canvas 2D manual seperti v1. Sistem ini terpisah penuh dari v1.

   Phase 1 (sekarang):
   - Scene + PerspectiveCamera + WebGLRenderer (antialias + shadowMap)
   - Lighting: AmbientLight + DirectionalLight (dengan shadow setup)
   - GridHelper (grid floor 60x60)
   - AxesHelper (X merah, Y hijau, Z biru)
   - Ground plane (invisible, untuk raycaster + shadow receiver)
   - Background gradient gelap + fog (kedalaman)
   - OrbitControls (orbit + zoom) — Phase 2 akan tambah WASD
   - Resize handler (ResizeObserver)
   - Animation loop (requestAnimationFrame)

   Phase berikutnya (lihat memory.md Bagian 60 checklist):
   - Phase 2: Fly camera (WASD + Q/E + Shift sprint)
   - Phase 3: Place/Delete blocks (raycaster + snap)
   - Phase 4: Transform gizmo (TransformControls)
   - Phase 5: Selection (multi-select)
   - Phase 6: Material painting
   - Phase 7-13: lihat checklist
   ================================================================ */

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#64748b', '#1e293b', '#ffffff', '#84cc16',
];

const GRID_SIZE = 30; // same as v1

export default function BlockSimulator3Dv2({ setPage }) {
  const containerRef = useRef(null);

  const [blockCount, setBlockCount] = useState(0);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Collapsible toolbar sections — default semua terbuka kecuali Material
  const [openSections, setOpenSections] = useState({
    build: true,    // Place / Delete / Shape / Clone / Mirror
    transform: true, // Move / Rotate / Scale
    paint: false,    // Paint / Eyedropper
    display: false,  // Grid / Snap / Shadows / Symmetry
    bloom: false,    // Bloom + sliders
    io: false,       // Import / Export
    groups: false,   // Group / Ungroup
    material: true,  // PBR + Emissive (auto-open saat ada selection)
    history: false,  // Undo / Redo
  });
  const toggleSection = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  // Phase 3: Tool + Color state
  const [tool, setTool] = useState('place'); // 'place' | 'delete' | 'move' | 'rotate' | 'scale' | 'paint' | 'eyedropper' | 'shape' | 'clone' | 'mirror' | 'object'
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const toolRef = useRef('place');
  const colorRef = useRef('#3b82f6');
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = currentColor; }, [currentColor]);

  // Phase 9: Primitives
  const [shapeType, setShapeType] = useState('sphere');
  const [shapeSize, setShapeSize] = useState(2);
  const [shapeSegments, setShapeSegments] = useState(16);
  const shapeTypeRef = useRef('sphere');
  const shapeSizeRef = useRef(2);
  const shapeSegRef = useRef(16);
  useEffect(() => { shapeTypeRef.current = shapeType; }, [shapeType]);
  useEffect(() => { shapeSizeRef.current = shapeSize; }, [shapeSize]);
  useEffect(() => { shapeSegRef.current = shapeSegments; }, [shapeSegments]);

  // Clone & Mirror tools — mirrorAxis = 'x' | 'y' | 'z' (sumbu yang di-flip)
  const [mirrorAxis, setMirrorAxis] = useState('x');
  const mirrorAxisRef = useRef('x');
  useEffect(() => { mirrorAxisRef.current = mirrorAxis; }, [mirrorAxis]);

  // Symmetry Mode — TOGGLE MODE (bukan tool). Saat ON, setiap block yang di-place/clone/shape
  // otomatis di-mirror di axis terpilih. Mode persist sampai dimatikan.
  // Bedanya sama Mirror tool: Mirror tool = per-klik, Symmetry Mode = persistent.
  const [symmetryMode, setSymmetryMode] = useState(false);
  const [symmetryAxis, setSymmetryAxis] = useState('x');
  const symmetryModeRef = useRef(false);
  const symmetryAxisRef = useRef('x');
  useEffect(() => { symmetryModeRef.current = symmetryMode; }, [symmetryMode]);
  useEffect(() => { symmetryAxisRef.current = symmetryAxis; }, [symmetryAxis]);

  // Phase 16: Block Groups — persistent group (beda dengan multi-select sementara).
  // - Setiap block bisa punya userData.groupId (string) — kalau undefined = tidak di grup.
  // - Group di-store di threeRef.current.groups = Map<groupId, {id, color, blockSet}>
  // - Klik 1 block di grup → auto-select semua block di grup itu.
  // - Ungroup: hapus groupId dari semua block di grup tersebut.
  const [groupCount, setGroupCount] = useState(0); // untuk UI button label
  const [hasSelectionInGroup, setHasSelectionInGroup] = useState(false); // untuk enable/disable Ungroup button
  // Update hasSelectionInGroup tiap kali selection berubah (selectedCount trigger)
  useEffect(() => {
    const sel = threeRef.current.selectedBlocks;
    if (!sel || sel.size === 0) {
      setHasSelectionInGroup(false);
      return;
    }
    let inGroup = false;
    sel.forEach(b => { if (b.userData.groupId) { inGroup = true; } });
    setHasSelectionInGroup(inGroup);
  }, [selectedCount]);

  // Phase 17: Environment Map — untuk reflective material (metalness > 0).
  // Modes:
  // - 'none'    = no env map, metal looks flat (default)
  // - 'studio'  = RoomEnvironment (procedural studio lighting, no external file)
  // - 'sky'     = procedural gradient sky (blue → white)
  // User bisa upload custom .hdr juga (Phase 17 bonus).
  const [envMode, setEnvMode] = useState('none'); // 'none' | 'studio' | 'sky'
  useEffect(() => {
    const s = threeRef.current;
    if (!s.scene) return;
    const pmrem = new THREE.PMREMGenerator(s.renderer);
    pmrem.compileEquirectangularShader();
    if (envMode === 'none') {
      s.scene.environment = null;
      s.scene.background = new THREE.Color('#1b2536');
    } else if (envMode === 'studio') {
      // RoomEnvironment = procedural studio lighting (no external file needed)
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
      s.scene.environment = env.texture;
      // Background tetap gelap (biar blok kelihatan jelas, cuma reflection yang aktif)
      s.scene.background = new THREE.Color('#1b2536');
    } else if (envMode === 'sky') {
      // Procedural gradient sky (blue → light blue → white horizon)
      const skyGeo = new THREE.SphereGeometry(100, 32, 16);
      const skyMat = new THREE.ShaderMaterial({
        uniforms: {
          topColor:    { value: new THREE.Color(0x0a1a3a) },
          midColor:    { value: new THREE.Color(0x4a90e2) },
          bottomColor: { value: new THREE.Color(0xb8d4f0) },
          offset:      { value: 0.0 },
          exponent:    { value: 0.6 },
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 midColor;
          uniform vec3 bottomColor;
          uniform float offset;
          uniform float exponent;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition + offset).y;
            vec3 col;
            if (h > 0.0) {
              col = mix(midColor, topColor, pow(h, exponent));
            } else {
              col = mix(midColor, bottomColor, pow(-h, exponent));
            }
            gl_FragColor = vec4(col, 1.0);
          }
        `,
        side: THREE.BackSide,
      });
      const sky = new THREE.Mesh(skyGeo, skyMat);
      // Buat scene temporary yang berisi sky saja, lalu sample dengan PMREM
      const skyScene = new THREE.Scene();
      skyScene.add(sky);
      const env = pmrem.fromScene(skyScene);
      s.scene.environment = env.texture;
      // Background juga pakai sky (visible di layar)
      s.scene.background = env.texture;
    }
    // Force material recompile supaya metalness reflection langsung effect
    s.scene.traverse(obj => {
      if (obj.material) obj.material.needsUpdate = true;
    });
    pmrem.dispose();
  }, [envMode]);

  // Phase 18: Object Library — pre-built model (house, tree, car) yang bisa di-place.
  // Object di-generate secara procedural (no external file). Tiap object = Group berisi multiple Mesh.
  const [objLibOpen, setObjLibOpen] = useState(false);
  const objLibOpenRef = useRef(false);
  useEffect(() => { objLibOpenRef.current = objLibOpen; }, [objLibOpen]);
  const [selectedObj, setSelectedObj] = useState(null); // 'house' | 'tree' | 'car' | 'tower' | 'lamp'
  const selectedObjRef = useRef(null);
  useEffect(() => { selectedObjRef.current = selectedObj; }, [selectedObj]);

  // Helper function untuk generate object dari jenis tertentu.
  // Pakai THREE.Group supaya 1 object = multiple mesh yang bisa di-select bareng (atau Group).
  const generateObject = (kind, posX, posZ, color) => {
    const group = new THREE.Group();
    group.position.set(posX, 0, posZ);
    const meshList = [];
    const addMesh = (geo, mat, x, y, z, rotY = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.y = rotY;
      m.castShadow = true;
      m.receiveShadow = true;
      m.userData.isBlock = true;
      m.userData.importedGlb = true; // treat as imported (mirror-safe)
      meshList.push(m);
      group.add(m);
    };
    if (kind === 'house') {
      // Badan rumah + atap piramida + pintu + jendela
      const wallMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#e7d7c1'), metalness: 0.0, roughness: 0.9 });
      const roofMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#8b3a3a'), metalness: 0.1, roughness: 0.6 });
      const doorMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#4a2c20'), metalness: 0.0, roughness: 0.8 });
      const winMat  = new THREE.MeshStandardMaterial({ color: new THREE.Color('#88c0d0'), metalness: 0.3, roughness: 0.2, emissive: 0x88c0d0, emissiveIntensity: 0.2 });
      addMesh(new THREE.BoxGeometry(4, 3, 4), wallMat, 0, 1.5, 0);          // badan
      addMesh(new THREE.ConeGeometry(3.2, 2, 4), roofMat, 0, 4, 0, Math.PI / 4); // atap
      addMesh(new THREE.BoxGeometry(1, 1.6, 0.1), doorMat, 0, 0.8, 2.05);    // pintu depan
      addMesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), winMat, -1.2, 1.6, 2.05);  // jendela kiri
      addMesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), winMat, 1.2, 1.6, 2.05);   // jendela kanan
    } else if (kind === 'tree') {
      // Trunk + 3 layer daun (cone stack)
      const trunkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#6b4423'), metalness: 0.0, roughness: 1.0 });
      const leafMat  = new THREE.MeshStandardMaterial({ color: new THREE.Color('#2d6a3e'), metalness: 0.0, roughness: 0.9 });
      addMesh(new THREE.CylinderGeometry(0.4, 0.6, 3, 8), trunkMat, 0, 1.5, 0);     // trunk
      addMesh(new THREE.ConeGeometry(2, 2.5, 8), leafMat, 0, 3.5, 0);                 // daun bawah
      addMesh(new THREE.ConeGeometry(1.6, 2, 8), leafMat, 0, 4.8, 0);                 // daun tengah
      addMesh(new THREE.ConeGeometry(1.2, 1.5, 8), leafMat, 0, 5.9, 0);               // daun atas
    } else if (kind === 'car') {
      // Body + roof + 4 wheels + 2 headlights
      const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color || '#ef4444'), metalness: 0.6, roughness: 0.3 });
      const glassMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#1a2a3a'), metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.7 });
      const wheelMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#1a1a1a'), metalness: 0.2, roughness: 0.8 });
      const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffaa, emissiveIntensity: 1.0 });
      addMesh(new THREE.BoxGeometry(4, 1, 1.8), bodyMat, 0, 0.8, 0);                 // body bawah
      addMesh(new THREE.BoxGeometry(2.2, 0.9, 1.6), bodyMat, -0.3, 1.6, 0);          // body atas (cabin)
      addMesh(new THREE.BoxGeometry(2, 0.7, 1.7), glassMat, -0.3, 1.65, 0);          // kaca
      addMesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12), wheelMat, 1.3, 0.4, 0.9, Math.PI / 2);  // wheel FR
      addMesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12), wheelMat, -1.3, 0.4, 0.9, Math.PI / 2); // wheel FL
      addMesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12), wheelMat, 1.3, 0.4, -0.9, Math.PI / 2); // wheel RR
      addMesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12), wheelMat, -1.3, 0.4, -0.9, Math.PI / 2); // wheel RL
      addMesh(new THREE.BoxGeometry(0.1, 0.3, 0.4), lightMat, 2.05, 0.8, 0.6);       // headlight R
      addMesh(new THREE.BoxGeometry(0.1, 0.3, 0.4), lightMat, 2.05, 0.8, -0.6);      // headlight L
    } else if (kind === 'tower') {
      // 4 tingkat kotak dengan ukuran mengecil
      const baseMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#7a7a8c'), metalness: 0.4, roughness: 0.5 });
      addMesh(new THREE.BoxGeometry(3, 2, 3), baseMat, 0, 1, 0);
      addMesh(new THREE.BoxGeometry(2.4, 2, 2.4), baseMat, 0, 3, 0);
      addMesh(new THREE.BoxGeometry(1.8, 2, 1.8), baseMat, 0, 5, 0);
      addMesh(new THREE.BoxGeometry(1.2, 2, 1.2), baseMat, 0, 7, 0);
      addMesh(new THREE.ConeGeometry(1, 1.5, 4), new THREE.MeshStandardMaterial({ color: 0xef4444 }), 0, 8.75, 0, Math.PI / 4);
    } else if (kind === 'lamp') {
      // Tiang + bola lampu (emissive kuat)
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.4 });
      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xffeeaa, emissive: 0xffeeaa, emissiveIntensity: 2.0,
        metalness: 0.0, roughness: 0.3,
      });
      addMesh(new THREE.CylinderGeometry(0.15, 0.2, 4, 8), poleMat, 0, 2, 0);
      addMesh(new THREE.SphereGeometry(0.4, 16, 12), bulbMat, 0, 4.2, 0);
    }
    return { group, meshList };
  };

  // Phase 7: Grid + Snap
  const [showGrid, setShowGrid] = useState(true);
  const [snapMove, setSnapMove] = useState(true);
  const showGridRef = useRef(true);
  const snapMoveRef = useRef(true);
  useEffect(() => { showGridRef.current = showGrid; }, [showGrid]);
  useEffect(() => { snapMoveRef.current = snapMove; }, [snapMove]);

  // Phase 10: Shadow toggle
  const [shadowsOn, setShadowsOn] = useState(true);

  // Phase 13: Post-Processing (Bloom)
  // Default threshold 0.3 (turunin dari 0.85) supaya emissive block biasa juga glow.
  // 0.85 = hanya emissive sangat terang (light source), 0.3 = emissive moderate ikut glow.
  const [bloomOn, setBloomOn] = useState(false);
  const [bloomStrength, setBloomStrength] = useState(0.8);
  const [bloomRadius, setBloomRadius] = useState(0.4);
  const [bloomThreshold, setBloomThreshold] = useState(0.3);
  const bloomOnRef = useRef(false);
  const bloomStrRef = useRef(0.8);
  const bloomRadRef = useRef(0.4);
  const bloomThrRef = useRef(0.3);
  useEffect(() => { bloomOnRef.current = bloomOn; }, [bloomOn]);
  useEffect(() => {
    bloomStrRef.current = bloomStrength;
    const s = threeRef.current;
    if (s.bloomPass) s.bloomPass.strength = bloomStrength;
  }, [bloomStrength]);
  useEffect(() => {
    bloomRadRef.current = bloomRadius;
    const s = threeRef.current;
    if (s.bloomPass) s.bloomPass.radius = bloomRadius;
  }, [bloomRadius]);
  useEffect(() => {
    bloomThrRef.current = bloomThreshold;
    const s = threeRef.current;
    if (s.bloomPass) s.bloomPass.threshold = bloomThreshold;
  }, [bloomThreshold]);

  // Opsi D: Emissive intensity untuk block manual terpilih
  const [emissiveIntensity, setEmissiveIntensity] = useState(0);
  const [emissiveColor, setEmissiveColor] = useState('#ffffff');
  useEffect(() => {
    const s = threeRef.current;
    if (!s.selectedBlocks || s.selectedBlocks.size === 0) return;
    s.selectedBlocks.forEach(b => {
      const mats = Array.isArray(b.material) ? b.material : [b.material];
      mats.forEach(m => {
        if (!m.emissive) return;
        if (emissiveIntensity > 0) {
          m.emissive.set(emissiveColor);
          m.emissiveIntensity = emissiveIntensity;
        } else {
          m.emissive.setHex(0x000000);
          m.emissiveIntensity = 0;
        }
        m.needsUpdate = true;
      });
    });
  }, [emissiveIntensity, emissiveColor]);

  // Phase 11: PBR Material editor
  const [metalness, setMetalness] = useState(0.1);
  const [roughness, setRoughness] = useState(0.8);
  // Apply PBR ke blok terpilih saat slider berubah
  useEffect(() => {
    const s = threeRef.current;
    if (!s.selectedBlocks || s.selectedBlocks.size === 0) return;
    s.selectedBlocks.forEach(b => {
      if (b.material) {
        b.material.metalness = metalness;
        b.material.roughness = roughness;
        b.material.needsUpdate = true;
      }
    });
  }, [metalness, roughness]);

  // Sinkron slider dengan material blok yang baru dipilih
  useEffect(() => {
    if (selectedCount > 0 && threeRef.current.selectedBlocks.size > 0) {
      const first = threeRef.current.selectedBlocks.values().next().value;
      if (first && first.material) {
        setMetalness(first.material.metalness);
        setRoughness(first.material.roughness);
      }
    }
  }, [selectedCount]);
  useEffect(() => {
    const s = threeRef.current;
    if (s.renderer) {
      s.renderer.shadowMap.enabled = shadowsOn;
      // Force material recompile supaya shadow toggle langsung effect
      s.scene.traverse(obj => {
        if (obj.material) obj.material.needsUpdate = true;
      });
    }
  }, [shadowsOn]);
  // Phase 7: Toggle grid visibility
  useEffect(() => {
    const s = threeRef.current;
    if (s.grid) s.grid.visible = showGrid;
  }, [showGrid]);

  // Phase 15: Symmetry Mode — toggle visibility mirror plane + apply rotation by axis
  useEffect(() => {
    const s = threeRef.current;
    if (!s.scene) return;
    // Cari plane yang sudah dibuat (simpan di threeRef)
    const plane = s.symmetryPlane;
    if (!plane) return;
    plane.visible = symmetryMode;
    // Update rotasi plane sesuai axis
    plane.rotation.set(0, 0, 0);
    if (symmetryAxis === 'x') plane.rotation.y = Math.PI / 2;
    else if (symmetryAxis === 'y') plane.rotation.x = -Math.PI / 2;
    else if (symmetryAxis === 'z') plane.rotation.x = 0;
  }, [symmetryMode, symmetryAxis]);

  // LEFT mouse button config per tool:
  // - move/rotate/scale → LEFT=null (OrbitControls GA boleh capture left drag!
  //   Kalau LEFT=PAN, OrbitControls preventDefault duluan, TransformControls
  //   gizmo drag kalah event → gizmo muncul tapi TIDAK berfungsi saat di-drag).
  //   Pan camera tetap bisa via middle-click atau right-click (orbit).
  // - place/delete/paint/dll → LEFT=PAN supaya user bisa pan camera dengan
  //   left-drag di empty space. Click detection (place/delete action) tetap
  //   jalan via window mousedown/mouseup (window events tidak bisa di-suppress).
  useEffect(() => {
    const s = threeRef.current;
    if (!s.controls) return;
    if (tool === 'move' || tool === 'rotate' || tool === 'scale') {
      s.controls.mouseButtons.LEFT = null;
    } else {
      s.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    }
  }, [tool]);

  // Three.js objects — stored in ref (NOT React state, because Three.js mutates directly).
  const threeRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    blocks: [],
    selectedBlocks: new Set(), // Phase 5: multi-select set
    raycaster: null,
    mouse: null,
    animationId: null,
    ground: null,
    grid: null,
  });

  /* ---------- Initialize Three.js (run once on mount) ---------- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1b2536');
    scene.fog = new THREE.Fog('#1b2536', 35, 90);

    // Camera — perspective, angled view like v1
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(18, 14, 18);
    camera.lookAt(0, 0, 0);

    // Renderer — WebGL with antialias + shadowMap
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // ── Phase 13: Post-Processing (EffectComposer + Bloom) ──
    // EffectComposer = rangkaian pass yang diproses secara berurutan sebelum render ke layar.
    // - RenderPass: render scene 3D ke buffer internal (bukan langsung ke layar)
    // - UnrealBloomPass: extract bagian terang (emissive, light source) → blur → glow
    // - OutputPass: apply tone mapping + color space conversion untuk output final
    // Saat bloomOn=false, kita render langsung pakai renderer.render() (lebih cepat).
    // Saat bloomOn=true, kita render pakai composer.render() (lebih mahal tapi ada glow).
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.8,    // strength (default 0.8) — seberapa kuat glow
      0.4,    // radius (default 0.4) — seberapa lebar blur glow
      0.85    // threshold (default 0.85) — HANYA pixel terang dari threshold ini yang di-bloom
    );
    composer.addPass(bloomPass);
    const outputPass = new OutputPass();
    composer.addPass(outputPass);
    composer.setSize(width, height);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 35, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 120;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Hemisphere light — warm sky + cool ground (subtle, adds depth)
    const hemiLight = new THREE.HemisphereLight(0x4a6fa5, 0x1a1a2e, 0.3);
    scene.add(hemiLight);

    // Grid — 60x60 units (GRID_SIZE * 2), 60 divisions
    const grid = new THREE.GridHelper(GRID_SIZE * 2, GRID_SIZE * 2, 0x64748b, 0x334155);
    grid.material.opacity = 0.5;
    grid.material.transparent = true;
    scene.add(grid);

    // Axes — X red, Y green, Z blue (size 5)
    const axes = new THREE.AxesHelper(5);
    scene.add(axes);

    // Ground plane — invisible mesh for raycaster + shadow receiver
    const groundGeo = new THREE.PlaneGeometry(GRID_SIZE * 2, GRID_SIZE * 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0e1420,
      transparent: true,
      opacity: 0.5,
      receiveShadow: true,
      metalness: 0,
      roughness: 1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01; // slightly below grid to avoid z-fighting
    ground.receiveShadow = true;
    ground.userData.isGround = true;
    scene.add(ground);

    // OrbitControls — basic orbit + zoom (Phase 2 will add WASD fly camera)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 5;
    controls.maxDistance = 80;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // prevent going below ground
    controls.target.set(0, 0, 0);
    // Mouse buttons: LEFT dinamis berdasarkan tool.
    // Move/Delete: LEFT=PAN (bisa geser camera dengan left-click drag di empty space).
    // Place/Rotate/Scale: LEFT=null (khusus tool action, tidak pan).
    controls.mouseButtons = {
      LEFT: null,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };

    // Raycaster + mouse vector (will be used in Phase 3 for place/delete)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // ── Phase 4: TransformControls (Move/Rotate/Scale gizmo) ──
    // Di Three.js v0.185+, TransformControls extends Controls (BUKAN Object3D).
    // scene.add(transformControls) TIDAK VALID — gizmo tidak masuk scene.
    // Harus pakai transformControls.getHelper() untuk dapat Object3D yang di-add ke scene.
    const transformControls = new TransformControls(camera, renderer.domElement);
    // v0.185: TransformControls auto-sizes berdasar jarak kamera, tapi untuk
    // mesh yang di-scale besar (20×), gizmo bisa terlalu kecil/njelimet.
    // Set size eksplisit supaya gizmo konsisten (besar dan mudah drag).
    transformControls.size = 2;
    const transformHelper = transformControls.getHelper(); // Object3D yang berisi gizmo visual
    scene.add(transformHelper);
    // Debug log: lihat event TransformControls
    transformControls.addEventListener('mouseDown', (e) => {
      console.log('[TC] mouseDown, target=', transformControls.object?.uuid?.slice(0,8), 'mode=', transformControls.getMode?.());
    });
    transformControls.addEventListener('objectChange', (e) => {
      console.log('[TC] objectChange, target=', transformControls.object?.uuid?.slice(0,8));
    });
    transformControls.addEventListener('dragging-changed', (e) => {
      // Disable orbitControls while dragging gizmo — prevents conflict.
      controls.enabled = !e.value;
      console.log('[TC] dragging-changed:', e.value, 'target=', transformControls.object?.uuid?.slice(0,8));
      // Phase 8: Record history saat gizmo selesai drag (e.value=false).
      // Debounce: cuma record FINAL state, bukan tiap pixel.
      if (!e.value && threeRef.current.recordHistory) {
        threeRef.current.recordHistory();
      }
    });
    // Phase 7: Snap position ke grid setelah gizmo Move selesai.
    // 'objectChange' fire tiap frame saat object di-transform oleh gizmo.
    // Kalau snapMove aktif & mode=translate, snap posisi ke grid cell center (X.5).
    transformControls.addEventListener('objectChange', () => {
      if (!snapMoveRef.current) return;
      const obj = transformControls.object;
      if (!obj) return;
      if (transformControls.getMode() === 'translate') {
        // Snap ke cell center (Math.floor + 0.5)
        obj.position.x = Math.floor(obj.position.x) + 0.5;
        obj.position.z = Math.floor(obj.position.z) + 0.5;
        // Y tetap bebas (bisa di taruh di ketinggian berapa aja, misal 1.5, 2.5)
        obj.position.y = Math.round(obj.position.y * 2) / 2; // snap ke 0.5 increment
      }
    });

    // ── Phase 2: Fly Camera (WASD + Q/E + Shift sprint) ──
    // Track keyboard state — record which keys are currently held down.
    // Movement applied in animation loop (smooth, frame-rate independent).
    const keys = { w: false, a: false, s: false, d: false, q: false, e: false, shift: false };
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w') keys.w = true;
      else if (k === 'a') keys.a = true;
      else if (k === 's') keys.s = true;
      else if (k === 'd') keys.d = true;
      else if (k === 'q') keys.q = true;
      else if (k === 'e') keys.e = true;
      else if (e.key === 'Shift') keys.shift = true;
    };
    const onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w') keys.w = false;
      else if (k === 'a') keys.a = false;
      else if (k === 's') keys.s = false;
      else if (k === 'd') keys.d = false;
      else if (k === 'q') keys.q = false;
      else if (k === 'e') keys.e = false;
      else if (e.key === 'Shift') keys.shift = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Fly camera constants
    const FLY_SPEED = 0.3;      // normal speed (units per frame at 60fps)
    const FLY_SPRINT = 0.8;     // sprint speed (Shift held)
    const CAM_MIN_Y = 1.0;      // camera tidak bisa go below this (prevent go through ground)

    // Animation loop — render every frame + apply fly camera movement
    const animate = () => {
      threeRef.current.animationId = requestAnimationFrame(animate);

      // ── Fly camera movement ──
      // WASD moves camera relative to its current facing direction (horizontal only,
      // biar tidak naik/turun saat look up/down — Q/E handles vertical).
      const speed = keys.shift ? FLY_SPRINT : FLY_SPEED;
      // Get camera forward direction (horizontal only — zero out Y, normalize)
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      // Right = forward × up
      const right = new THREE.Vector3();
      right.crossVectors(forward, camera.up).normalize();

      const move = new THREE.Vector3();
      if (keys.w) move.add(forward);
      if (keys.s) move.sub(forward);
      if (keys.d) move.add(right);
      if (keys.a) move.sub(right);
      if (keys.e) move.y += 1;  // E = up (world Y+)
      if (keys.q) move.y -= 1;  // Q = down (world Y-)

      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(speed);
        // Move BOTH camera AND orbit target — supaya orbit tetap konsisten
        // (kalau cuma camera yang gerak, target tetap di tempat → orbit aneh).
        camera.position.add(move);
        controls.target.add(move);
        // Clamp camera Y — prevent go through ground
        if (camera.position.y < CAM_MIN_Y) camera.position.y = CAM_MIN_Y;
      }

      controls.update();
      // Phase 19: Update group bounding box helpers tiap frame
      // (supaya ngikutin block yang di-move/di-transform)
      if (threeRef.current.updateGroupHelpers) {
        threeRef.current.updateGroupHelpers();
      }
      // Phase 13: Render dengan EffectComposer saat bloom on, else direct render.
      // Composer jalanin semua pass (render → bloom → output) → hasil dengan glow.
      // Direct render = lebih cepat, untuk saat bloom dimatikan.
      if (bloomOnRef.current) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    // Resize handler — ResizeObserver on container
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      // Phase 13: composer + bloom pass harus ikut resize supaya render target benar
      composer.setSize(w, h);
      bloomPass.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    // Store all Three.js objects in ref for later phases
    threeRef.current = {
      ...threeRef.current,
      scene, camera, renderer, controls,
      composer, bloomPass, renderPass, outputPass,
      blocks: [],
      groups: new Map(), // Phase 16: groupId → {id, color, blockSet: Set<Mesh>}
      nextGroupId: 1,
      raycaster, mouse,
      ground, grid,
      symmetryPlane: null, // akan di-assign setelah plane dibuat
    };

    // ── Phase 3: Place/Delete Blocks + Ghost Preview ──

    // Helper: mirror posisi 3D di sekitar origin (0,0,0) berdasarkan axis.
    // Block di (3, 1, 2) mirror X → (-3, 1, 2). Berguna untuk Symmetry Mode & Mirror tool.
    const mirrorPosition = (pos, axis) => {
      const out = pos.clone();
      if (axis === 'x') out.x = -out.x;
      else if (axis === 'y') out.y = -out.y;
      else if (axis === 'z') out.z = -out.z;
      return out;
    };
    // Helper: mirror rotation (Euler) di sekitar axis. Dua komponen non-axis di-negate.
    const mirrorRotation = (rot, axis) => {
      const out = rot.clone();
      if (axis === 'x') { out.y = -out.y; out.z = -out.z; }
      else if (axis === 'y') { out.x = -out.x; out.z = -out.z; }
      else if (axis === 'z') { out.x = -out.x; out.y = -out.y; }
      return out;
    };
    // Helper: mirror scale. Komponen axis di-negate → geometri di-flip.
    const mirrorScale = (scl, axis) => {
      const out = scl.clone();
      if (axis === 'x') out.x = -out.x;
      else if (axis === 'y') out.y = -out.y;
      else if (axis === 'z') out.z = -out.z;
      return out;
    };
    // Helper: buat mesh mirror dari source mesh (geometri & material di-clone, transform di-mirror).
    // Dipakai oleh Mirror tool & Symmetry Mode.
    const createMirrorMesh = (source, axis) => {
      const newGeo = source.geometry.clone();
      const newMat = Array.isArray(source.material)
        ? source.material.map(m => m.clone())
        : source.material.clone();
      const m = new THREE.Mesh(newGeo, newMat);
      m.position.copy(mirrorPosition(source.position, axis));
      m.rotation.copy(mirrorRotation(source.rotation, axis));
      m.scale.copy(mirrorScale(source.scale, axis));
      m.castShadow = true;
      m.receiveShadow = true;
      m.userData.isBlock = true;
      m.userData.importedGlb = !!source.userData.importedGlb;
      m.userData.symmetryMirror = true; // flag: ini adalah auto-mirror
      return m;
    };

    // Helper: calculate placement position from raycaster hit.
    // Snap ke CELL CENTER (Math.floor + 0.5), BUKAN grid intersection (Math.round).
    // Grid lines ada di integer positions; cell centers ada di X.5 positions.
    // Block 1x1 centered at (0.5, 0.5, 0.5) → duduk di dalam cell (0,0)-(1,1). Perfect.
    const calcPlacePos = (hit) => {
      let posX, posY, posZ;
      if (hit.object === ground) {
        // Hit ground → snap to cell center, Y = 0.5
        posX = Math.floor(hit.point.x) + 0.5;
        posZ = Math.floor(hit.point.z) + 0.5;
        posY = 0.5;
      } else {
        // Hit block face → offset by face normal → snap to cell center
        const n = hit.face.normal.clone();
        n.transformDirection(hit.object.matrixWorld);
        const placePoint = hit.point.clone().add(n.multiplyScalar(0.5));
        posX = Math.floor(placePoint.x) + 0.5;
        posY = Math.floor(placePoint.y) + 0.5;
        posZ = Math.floor(placePoint.z) + 0.5;
      }
      return { posX, posY, posZ };
    };

    // Ghost block — semi-transparent preview yang ikut mouse saat tool=place.
    const ghostGeo = new THREE.BoxGeometry(1, 1, 1);
    const ghostMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    const ghostBlock = new THREE.Mesh(ghostGeo, ghostMat);
    ghostBlock.visible = false;
    scene.add(ghostBlock);

    // Ghost edges — outline garis tepi biar lebih jelas keliatan.
    const ghostEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(ghostGeo),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
    );
    ghostEdges.visible = false;
    scene.add(ghostEdges);

    // Symmetry mirror plane — visual indicator (semi-transparent pink plane)
    // menunjukkan di mana plane cermin virtual. Muncul saat Symmetry Mode ON.
    // Plane besar 60x60, posisi di origin (0,0,0), rotasi menyesuaikan axis.
    // Axis X → plane Y-Z (rotasi Y 90°), Axis Y → plane X-Z (horizontal),
    // Axis Z → plane X-Y (rotasi X 90°).
    const symPlaneGeo = new THREE.PlaneGeometry(60, 60);
    const symPlaneMat = new THREE.MeshBasicMaterial({
      color: 0xec4899,    // pink
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,  // jangan overwrite depth buffer
    });
    const symmetryPlane = new THREE.Mesh(symPlaneGeo, symPlaneMat);
    symmetryPlane.visible = false;
    scene.add(symmetryPlane);
    // Assign ke threeRef supaya bisa diakses dari useEffect (toggle visibility)
    threeRef.current.symmetryPlane = symmetryPlane;
    // Helper: update rotasi symmetryPlane berdasarkan axis
    const updateSymmetryPlane = (axis) => {
      symmetryPlane.rotation.set(0, 0, 0);
      if (axis === 'x') symmetryPlane.rotation.y = Math.PI / 2; // plane facing X
      else if (axis === 'y') symmetryPlane.rotation.x = -Math.PI / 2; // plane facing Y (horizontal)
      else if (axis === 'z') symmetryPlane.rotation.x = 0; // plane facing Z (vertical default)
    };

    // Delete highlight — emissive merah menyala pada block yang akan dihapus.
    let highlightedBlock = null;
    // Helper aman untuk material yang mungkin array atau non-emissive (hasil import glb).
    // Hanya apply emissive ke material yang support (MeshStandardMaterial, MeshPhysicalMaterial, MeshPhongMaterial).
    const getEmissiveMaterials = (block) => {
      const mats = Array.isArray(block.material) ? block.material : [block.material];
      return mats.filter(m => m && m.emissive);
    };
    const setEmissive = (block, hex, intensity) => {
      getEmissiveMaterials(block).forEach(m => {
        m.emissive.setHex(hex);
        m.emissiveIntensity = intensity;
      });
    };

    const highlightBlock = (block) => {
      // Revert previous highlight
      if (highlightedBlock && highlightedBlock !== block) {
        setEmissive(highlightedBlock, 0x000000, 1);
      }
      // Highlight new block
      if (block) {
        setEmissive(block, 0xff0000, 1.5);
        highlightedBlock = block;
      } else {
        highlightedBlock = null;
      }
    };

    // Click detection: pakai mousedown + mouseup di WINDOW (bukan canvas!).
    // OrbitControls pakai pointer events + preventDefault → suppress 'click' event.
    // Tapi mousedown/mouseup di window TIDAK bisa di-suppress oleh siapa pun —
    // mereka selalu fire. Kita deteksi click vs drag sendiri (delta < 5px = click).
    let clickDownPos = null;
    const CLICK_THRESHOLD = 5;

    const onWindowMouseDown = (e) => {
      if (e.button !== 0) return;
      clickDownPos = { x: e.clientX, y: e.clientY };
    };

    const onWindowMouseUp = (e) => {
      if (e.button !== 0 || !clickDownPos) return;
      const dx = e.clientX - clickDownPos.x;
      const dy = e.clientY - clickDownPos.y;
      clickDownPos = null;
      // Jika mouse gerak > 5px → itu drag (orbit/pan), bukan click → skip
      if (Math.hypot(dx, dy) > CLICK_THRESHOLD) return;
      // Jika TransformControls sedang drag gizmo → skip
      if (transformControls.dragging) return;

      // Cek apakah klik di dalam canvas area
      const rect = renderer.domElement.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right ||
          e.clientY < rect.top || e.clientY > rect.bottom) return;

      // It's a real click on canvas → do tool action
      const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x: mx, y: my }, camera);

      const currentTool = toolRef.current;
      const color = colorRef.current;

      if (currentTool === 'delete') {
        const blockMeshes = threeRef.current.blocks;
        // recursive=true supaya mesh hasil import glb (yang sering punya nested mesh) tetap kena raycast
        const hits = raycaster.intersectObjects(blockMeshes, true);
        let targetMesh = hits.length > 0 ? hits[0].object : null;

        // Fallback: bounding box click tolerance untuk imported glb mesh
        if (!targetMesh) {
          const ray = raycaster.ray;
          let closestBlock = null;
          let closestDist = Infinity;
          const tmpBox = new THREE.Box3();
          const tmpVec = new THREE.Vector3();
          blockMeshes.forEach(b => {
            if (!b.userData.importedGlb) return;
            tmpBox.setFromObject(b);
            const sz = tmpBox.getSize(new THREE.Vector3());
            const margin = Math.min(sz.x, sz.y, sz.z) * 0.1;
            tmpBox.expandByScalar(margin);
            const intersectPt = ray.intersectBox(tmpBox, tmpVec);
            if (intersectPt) {
              const dist = ray.origin.distanceTo(intersectPt);
              if (dist < closestDist) {
                closestDist = dist;
                closestBlock = b;
              }
            }
          });
          if (closestBlock) targetMesh = closestBlock;
        }

        if (targetMesh) {
          if (transformControls.object === targetMesh) transformControls.detach();
          if (highlightedBlock === targetMesh) highlightedBlock = null;
          // Remove from selection set
          if (threeRef.current.selectedBlocks.has(targetMesh)) {
            threeRef.current.selectedBlocks.delete(targetMesh);
            setSelectedCount(threeRef.current.selectedBlocks.size);
          }
          // Phase 16: remove from group juga (kalau block ada di grup)
          if (targetMesh.userData.groupId && threeRef.current.removeBlockFromGroups) {
            threeRef.current.removeBlockFromGroups(targetMesh);
          }
          // removeFromParent = remove dari parent apapun (scene ATAU gltf.scene group)
          targetMesh.removeFromParent();
          // Dispose geometry & material (dan semua material array untuk multi-material mesh)
          if (Array.isArray(targetMesh.material)) {
            targetMesh.material.forEach(m => m.dispose());
          } else {
            targetMesh.material.dispose();
          }
          targetMesh.geometry.dispose();
          threeRef.current.blocks = threeRef.current.blocks.filter(b => b !== targetMesh);
          setBlockCount(threeRef.current.blocks.length);
          if (threeRef.current.recordHistory) threeRef.current.recordHistory();
        }
      } else if (currentTool === 'place') {
        const targets = [ground, ...threeRef.current.blocks];
        const hits = raycaster.intersectObjects(targets, false);
        if (hits.length > 0) {
          const { posX, posY, posZ } = calcPlacePos(hits[0]);
          if (Math.abs(posX) > GRID_SIZE || Math.abs(posZ) > GRID_SIZE || posY < 0) return;
          const geo = new THREE.BoxGeometry(1, 1, 1);
          const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            metalness: 0.1,
            roughness: 0.8,
          });
          const block = new THREE.Mesh(geo, mat);
          block.position.set(posX, posY, posZ);
          block.castShadow = true;
          block.receiveShadow = true;
          block.userData.isBlock = true;
          scene.add(block);
          threeRef.current.blocks.push(block);
          // ── Symmetry Mode: auto-mirror block baru ──
          // Kalau symmetryMode on DAN block baru TIDAK di axis plane (kalau di axis plane = posisi 0,
          // mirror = diri sendiri, redundan), buat mirror block.
          if (symmetryModeRef.current) {
            const axis = symmetryAxisRef.current;
            const axisVal = axis === 'x' ? posX : (axis === 'y' ? posY : posZ);
            // Skip kalau block persis di plane mirror (nilai axis = 0, math.floor(-0.5)+0.5 = 0.5; tapi kalau di tengah (0), mirror = diri sendiri)
            // Untuk X & Z, posisi cell center selalu X.5, jadi tidak pernah 0. Untuk Y bisa 0.5 juga.
            // Cek dengan Math.abs(axisVal) > 0.01 supaya ga double-place.
            if (Math.abs(axisVal) > 0.01) {
              const mirror = createMirrorMesh(block, axis);
              scene.add(mirror);
              threeRef.current.blocks.push(mirror);
            }
          }
          setBlockCount(threeRef.current.blocks.length);
          if (threeRef.current.recordHistory) threeRef.current.recordHistory();
        }
      } else if (currentTool === 'shape') {
        // Phase 9: Generate primitive — klik grid → taruh shape (sphere/cylinder/cone/torus/cube).
        const targets = [ground, ...threeRef.current.blocks];
        const hits = raycaster.intersectObjects(targets, false);
        if (hits.length > 0) {
          const hit = hits[0];
          let posX, posZ;
          if (hit.object === ground) {
            posX = Math.floor(hit.point.x) + 0.5;
            posZ = Math.floor(hit.point.z) + 0.5;
          } else {
            const n = hit.face.normal.clone();
            n.transformDirection(hit.object.matrixWorld);
            const placePoint = hit.point.clone().add(n.multiplyScalar(0.5));
            posX = Math.floor(placePoint.x) + 0.5;
            posZ = Math.floor(placePoint.z) + 0.5;
          }
          if (Math.abs(posX) > GRID_SIZE || Math.abs(posZ) > GRID_SIZE) return;

          const st = shapeTypeRef.current;
          const sz = Math.max(0.5, shapeSizeRef.current);
          const seg = Math.max(4, Math.min(32, shapeSegRef.current));

          let geo;
          switch (st) {
            case 'cube':       geo = new THREE.BoxGeometry(sz, sz, sz); break;
            case 'sphere':     geo = new THREE.SphereGeometry(sz / 2, seg, Math.max(3, Math.floor(seg / 2))); break;
            case 'cylinder':   geo = new THREE.CylinderGeometry(sz / 2, sz / 2, sz, Math.max(3, Math.floor(seg / 2))); break;
            case 'cone':       geo = new THREE.ConeGeometry(sz / 2, sz, Math.max(3, Math.floor(seg / 2))); break;
            case 'torus':      geo = new THREE.TorusGeometry(sz / 2, sz / 6, Math.max(3, Math.floor(seg / 2)), seg); break;
            default:           geo = new THREE.BoxGeometry(1, 1, 1);
          }
          const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            metalness: 0.1,
            roughness: 0.8,
          });
          const block = new THREE.Mesh(geo, mat);
          // Center shape on grid cell — Y = size/2 so bottom touches ground
          block.position.set(posX, sz / 2, posZ);
          block.castShadow = true;
          block.receiveShadow = true;
          block.userData.isBlock = true;
          scene.add(block);
          threeRef.current.blocks.push(block);
          // ── Symmetry Mode: auto-mirror shape baru ──
          if (symmetryModeRef.current) {
            const axis = symmetryAxisRef.current;
            const axisVal = axis === 'x' ? posX : (axis === 'y' ? sz / 2 : posZ);
            if (Math.abs(axisVal) > 0.01) {
              const mirror = createMirrorMesh(block, axis);
              scene.add(mirror);
              threeRef.current.blocks.push(mirror);
            }
          }
          setBlockCount(threeRef.current.blocks.length);
          if (threeRef.current.recordHistory) threeRef.current.recordHistory();
        }
      } else if (currentTool === 'paint') {
        // Phase 6: Paint — klik blok → ganti warna ke currentColor.
        // Kalau ada multi-select, paint SEMUA blok terpilih.
        const blockMeshes = threeRef.current.blocks;
        const hits = raycaster.intersectObjects(blockMeshes, true);
        if (hits.length > 0) {
          const hit = hits[0].object;
          // Paint blok yang diklik (handle multi-material)
          const mats = Array.isArray(hit.material) ? hit.material : [hit.material];
          mats.forEach(m => { if (m && m.color) m.color.set(color); });
          // Jika ada blok lain yang ter-selected, paint mereka juga
          if (threeRef.current.selectedBlocks.size > 1) {
            threeRef.current.selectedBlocks.forEach(b => {
              const bm = Array.isArray(b.material) ? b.material : [b.material];
              bm.forEach(m => { if (m && m.color) m.color.set(color); });
            });
          }
          if (threeRef.current.recordHistory) threeRef.current.recordHistory();
        }
      } else if (currentTool === 'eyedropper') {
        // Phase 6: Eyedropper — klik blok → ambil warnanya jadi currentColor.
        const blockMeshes = threeRef.current.blocks;
        const hits = raycaster.intersectObjects(blockMeshes, true);
        if (hits.length > 0) {
          const hit = hits[0].object;
          // Ambil warna dari material pertama yang punya color
          const mats = Array.isArray(hit.material) ? hit.material : [hit.material];
          const colorMat = mats.find(m => m && m.color);
          if (colorMat) {
            const hex = '#' + colorMat.color.getHexString();
            setCurrentColor(hex);
            // Auto-switch ke paint tool setelah pick (UX: pick lalu paint)
            setTool('paint');
          }
        }
      } else if (currentTool === 'clone') {
        // Clone tool — klik block → duplikat identik muncul di offset 1 unit ke X
        // (arah bebas, user bisa move manual setelah itu pakai tool Move).
        // Clone = geometri+material+posisi+rotasi+scale identik. Tidak ada flip.
        const blockMeshes = threeRef.current.blocks;
        const hits = raycaster.intersectObjects(blockMeshes, true);
        if (hits.length > 0) {
          const source = hits[0].object;
          // Clone mesh — clone geometry & material supaya ga share reference
          // (kalau share, delete salah satu bakal dispose geometry yang masih dipakai satunya)
          const newGeo = source.geometry.clone();
          const newMat = Array.isArray(source.material)
            ? source.material.map(m => m.clone())
            : source.material.clone();
          const cloneMesh = new THREE.Mesh(newGeo, newMat);
          // Offset position 1 unit ke X (arah bebas), Y & Z sama
          cloneMesh.position.copy(source.position);
          cloneMesh.position.x += 1;
          cloneMesh.rotation.copy(source.rotation);
          cloneMesh.scale.copy(source.scale);
          cloneMesh.castShadow = true;
          cloneMesh.receiveShadow = true;
          cloneMesh.userData.isBlock = true;
          cloneMesh.userData.importedGlb = !!source.userData.importedGlb;
          scene.add(cloneMesh);
          threeRef.current.blocks.push(cloneMesh);
          setBlockCount(threeRef.current.blocks.length);
          if (threeRef.current.recordHistory) threeRef.current.recordHistory();
          console.log('[CLONE] created at', cloneMesh.position.toArray().map(v=>v.toFixed(2)));
        }
      } else if (currentTool === 'mirror') {
        // Mirror tool — klik block → duplikat yang di-FLIP di sumbu mirrorAxis.
        // Position baru = posisi lama dengan komponen axis di-negate-kan.
        // Geometri di-flip via scale.set(axisKomponen = -1, lain = 1).
        // Contoh: cube di (3, 1, 2), mirrorAxis='x' → clone di (-3, 1, 2) + scale.x = -1.
        const blockMeshes = threeRef.current.blocks;
        const hits = raycaster.intersectObjects(blockMeshes, true);
        if (hits.length > 0) {
          const source = hits[0].object;
          const axis = mirrorAxisRef.current; // 'x' | 'y' | 'z'
          const newGeo = source.geometry.clone();
          const newMat = Array.isArray(source.material)
            ? source.material.map(m => m.clone())
            : source.material.clone();
          const mirrorMesh = new THREE.Mesh(newGeo, newMat);
          // Position: flip komponen axis
          mirrorMesh.position.copy(source.position);
          if (axis === 'x') mirrorMesh.position.x = -mirrorMesh.position.x;
          else if (axis === 'y') mirrorMesh.position.y = -mirrorMesh.position.y;
          else if (axis === 'z') mirrorMesh.position.z = -mirrorMesh.position.z;
          // Rotation: mirror juga (Y rotasi axis = 180° balik)
          mirrorMesh.rotation.copy(source.rotation);
          if (axis === 'x') {
            mirrorMesh.rotation.y = -mirrorMesh.rotation.y;
            mirrorMesh.rotation.z = -mirrorMesh.rotation.z;
          } else if (axis === 'y') {
            mirrorMesh.rotation.x = -mirrorMesh.rotation.x;
            mirrorMesh.rotation.z = -mirrorMesh.rotation.z;
          } else if (axis === 'z') {
            mirrorMesh.rotation.x = -mirrorMesh.rotation.x;
            mirrorMesh.rotation.y = -mirrorMesh.rotation.y;
          }
          // Scale: flip komponen axis (negate → geometri di-flip di axis itu)
          mirrorMesh.scale.copy(source.scale);
          if (axis === 'x') mirrorMesh.scale.x = -mirrorMesh.scale.x;
          else if (axis === 'y') mirrorMesh.scale.y = -mirrorMesh.scale.y;
          else if (axis === 'z') mirrorMesh.scale.z = -mirrorMesh.scale.z;
          mirrorMesh.castShadow = true;
          mirrorMesh.receiveShadow = true;
          mirrorMesh.userData.isBlock = true;
          mirrorMesh.userData.importedGlb = !!source.userData.importedGlb;
          scene.add(mirrorMesh);
          threeRef.current.blocks.push(mirrorMesh);
          setBlockCount(threeRef.current.blocks.length);
          if (threeRef.current.recordHistory) threeRef.current.recordHistory();
          console.log(`[MIRROR] axis=${axis} created at`, mirrorMesh.position.toArray().map(v=>v.toFixed(2)));
        }
      } else if (currentTool === 'object') {
        // Phase 18: Object Library — klik grid → taruh pre-built model.
        // Pakai raycaster ke ground/block, dapat posisi, lalu generateObject ke sana.
        const targets = [ground, ...threeRef.current.blocks];
        const hits = raycaster.intersectObjects(targets, true);
        if (hits.length > 0) {
          const hit = hits[0];
          // Posisi di ground / di atas block: snap ke cell center X.5
          let posX = Math.floor(hit.point.x) + 0.5;
          let posZ = Math.floor(hit.point.z) + 0.5;
          // Clamp ke grid
          if (Math.abs(posX) > GRID_SIZE || Math.abs(posZ) > GRID_SIZE) return;
          const kind = selectedObjRef.current;
          if (!kind) {
            console.log('[OBJECT] No object selected in library');
            return;
          }
          // Generate object via function di component scope
          const result = generateObject(kind, posX, posZ, color);
          // Add semua mesh ke scene + blocks array
          scene.add(result.group);
          result.meshList.forEach(m => {
            threeRef.current.blocks.push(m);
            // Symmetry Mode: auto-mirror setiap mesh
            if (symmetryModeRef.current) {
              const axis = symmetryAxisRef.current;
              const axisVal = axis === 'x' ? posX : (axis === 'y' ? 0 : posZ);
              if (Math.abs(axisVal) > 0.01) {
                const mirror = createMirrorMesh(m, axis);
                scene.add(mirror);
                threeRef.current.blocks.push(mirror);
              }
            }
          });
          setBlockCount(threeRef.current.blocks.length);
          if (threeRef.current.recordHistory) threeRef.current.recordHistory();
          console.log(`[OBJECT] Placed ${kind} at (${posX.toFixed(1)}, ${posZ.toFixed(1)})`);
        }
      } else if (currentTool === 'move' || currentTool === 'rotate' || currentTool === 'scale') {
        // Phase 5: Multi-select support.
        // - Click blok (no modifier): clear selection, select blok itu, attach gizmo.
        // - Shift+click: add to selection (multi-select). Gizmo attach ke blok terakhir.
        // - Ctrl+click: toggle select (add/remove). Gizmo attach ke blok terakhir yang selected.
        // - Click empty: clear selection + detach gizmo.
        const blockMeshes = threeRef.current.blocks;
        // recursive=true supaya mesh hasil import glb (nested) tetap kena raycast
        const hits = raycaster.intersectObjects(blockMeshes, true);
        let hit = hits.length > 0 ? hits[0].object : null;

        // ── Fallback: Bounding Box click tolerance ──
        // Untuk model import glb (terutama karakter humanoid), raycast pakai
        // triangle-level intersection → kalau klik di area kosong (antara kepala
        // dan tangan), ga kena mesh. Sebagai fallback, kalau raycast miss, cek
        // apakah titik klik berada di dalam bounding box sebuah block (dengan
        // margin). Kalau ya, pilih block itu (mirip "selection box" di Blender).
        if (!hit) {
          // Ray dari kamera ke titik klik
          const ray = raycaster.ray;
          let closestBlock = null;
          let closestDist = Infinity;
          const tmpBox = new THREE.Box3();
          const tmpVec = new THREE.Vector3();
          blockMeshes.forEach(b => {
            if (!b.userData.importedGlb) return; // hanya untuk imported mesh
            tmpBox.setFromObject(b);
            // Expand box sedikit untuk kasih margin tolerance (10% dari size)
            const sz = tmpBox.getSize(new THREE.Vector3());
            const margin = Math.min(sz.x, sz.y, sz.z) * 0.1;
            tmpBox.expandByScalar(margin);
            // Cek apakah ray intersect dengan box
            const intersectPt = ray.intersectBox(tmpBox, tmpVec);
            if (intersectPt) {
              // Pilih block yang intersect terdekat dengan kamera
              const dist = ray.origin.distanceTo(intersectPt);
              if (dist < closestDist) {
                closestDist = dist;
                closestBlock = b;
              }
            }
          });
          if (closestBlock) hit = closestBlock;
        }

        if (hit) {
          console.log('[SELECT] hit=', hit.uuid, 'isImported=', hit.userData.importedGlb, 'parent=', hit.parent?.uuid?.slice(0,8), 'pos=', hit.position.toArray().map(v=>v.toFixed(2)));
          if (e.shiftKey) {
            // Shift+click: add to selection
            selectBlock(hit, true);
          } else if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd+click: toggle
            toggleSelectBlock(hit);
          } else {
            // Normal click: single select
            selectBlock(hit, false);
          }
          // Attach gizmo ke selection (1 blok = langsung, >1 = group)
          attachGizmoToSelection();
          if (currentTool === 'move') transformControls.setMode('translate');
          else if (currentTool === 'rotate') transformControls.setMode('rotate');
          else if (currentTool === 'scale') transformControls.setMode('scale');
        } else {
          // Click empty → deselect all
          clearSelection();
        }
      }
    };

    // ── Phase 5: Selection highlight helpers ──
    const SELECT_COLOR = 0x1a8cff;  // biru terang untuk selected
    const SELECT_INTENSITY = 0.6;

    // Group sementara untuk multi-select transform — semua blok terpilih
    // diparenting ke group ini, gizmo attach ke group. Saat deselect,
    // blok dikembalikan ke scene (world position preserved).
    let selectionGroup = null;

    const highlightSelected = (block) => {
      setEmissive(block, SELECT_COLOR, SELECT_INTENSITY);
    };
    const unhighlightSelected = (block) => {
      setEmissive(block, 0x000000, 1);
    };

    const clearSelection = () => {
      // Jika ada selectionGroup, kembalikan blok ke scene (preserve world position)
      if (selectionGroup) {
        threeRef.current.selectedBlocks.forEach(b => {
          scene.attach(b); // reparent ke scene, preserve world transform
        });
        scene.remove(selectionGroup);
        selectionGroup = null;
      }
      threeRef.current.selectedBlocks.forEach(b => unhighlightSelected(b));
      threeRef.current.selectedBlocks.clear();
      transformControls.detach();
      setSelectedCount(0);
    };

    // Phase 19: Group Bounding Box Helper — visual box 3D mengelilingi grup.
    // Pakai THREE.Box3 + THREE.Box3Helper. Tiap grup punya 1 helper sendiri.
    // Update tiap frame di animate loop supaya ngikutin block yang di-move.
    const groupHelpers = new Map(); // groupId → THREE.Box3Helper
    const updateGroupHelpers = () => {
      const groups = threeRef.current.groups;
      // Hapus helper untuk grup yang udah ga ada
      groupHelpers.forEach((helper, gid) => {
        if (!groups.has(gid)) {
          scene.remove(helper);
          helper.geometry.dispose();
          helper.material.dispose();
          groupHelpers.delete(gid);
        }
      });
      // Tambah/update helper untuk grup yang ada
      groups.forEach((groupData, gid) => {
        let helper = groupHelpers.get(gid);
        // Compute box dari semua block di grup
        const box = new THREE.Box3();
        let validBox = false;
        groupData.blockSet.forEach(b => {
          if (b.parent) { // block masih di scene
            box.expandByObject(b);
            validBox = true;
          }
        });
        if (!validBox) {
          if (helper) helper.visible = false;
          return;
        }
        if (!helper) {
          // Buat helper baru
          helper = new THREE.Box3Helper(box, new THREE.Color(groupData.color));
          scene.add(helper);
          groupHelpers.set(gid, helper);
        } else {
          // Update box existing
          helper.box.copy(box);
          helper.material.color.setHex(groupData.color);
        }
        helper.visible = true;
      });
    };
    // Expose ke threeRef biar bisa dipanggil di animate loop
    threeRef.current.updateGroupHelpers = updateGroupHelpers;

    // Phase 16: Block Groups — persistent multi-select.
    // - createGroupFromSelection(): ambil semua selected blocks, assign groupId baru, kasih
    //   emissive color unik (rainbow palette supaya tiap grup kelihatan beda).
    // - ungroupSelected(): ambil grup dari block pertama yang terpilih, hapus groupId dari semua.
    // - removeBlockFromGroups(block): kalau block dihapus dari scene, hapus dari grup juga.
    const GROUP_COLORS = [
      0xfbbf24, // amber
      0x10b981, // emerald
      0xf43f5e, // rose
      0xa855f7, // purple
      0x06b6d4, // cyan
      0xf97316, // orange
      0xec4899, // pink
      0x84cc16, // lime
    ];
    const createGroupFromSelection = () => {
      const selected = threeRef.current.selectedBlocks;
      if (selected.size < 2) {
        console.log('[GROUP] Need at least 2 selected blocks to create a group');
        return;
      }
      const groupId = `group-${threeRef.current.nextGroupId++}`;
      const colorIdx = (threeRef.current.groups.size) % GROUP_COLORS.length;
      const groupColor = GROUP_COLORS[colorIdx];
      const blockSet = new Set();
      selected.forEach(b => {
        // Kalau block sudah di grup lain, hapus dari grup lama dulu (1 block cuma 1 grup)
        if (b.userData.groupId) {
          const oldGroup = threeRef.current.groups.get(b.userData.groupId);
          if (oldGroup) oldGroup.blockSet.delete(b);
        }
        b.userData.groupId = groupId;
        // Tandai emissive dengan warna grup supaya user bisa lihat block mana yang di-grup
        const mats = Array.isArray(b.material) ? b.material : [b.material];
        mats.forEach(m => {
          if (m.emissive) {
            m.emissive.setHex(groupColor);
            m.emissiveIntensity = 0.3; // soft glow
          }
        });
        blockSet.add(b);
      });
      threeRef.current.groups.set(groupId, {
        id: groupId,
        color: groupColor,
        blockSet,
      });
      setGroupCount(threeRef.current.groups.size);
      setHasSelectionInGroup(true);
      console.log(`[GROUP] Created ${groupId} with ${blockSet.size} blocks`);
    };
    const ungroupSelected = () => {
      const selected = threeRef.current.selectedBlocks;
      if (selected.size === 0) return;
      // Ambil semua groupId yang ada di selection
      const groupIdsToDissolve = new Set();
      selected.forEach(b => {
        if (b.userData.groupId) groupIdsToDissolve.add(b.userData.groupId);
      });
      if (groupIdsToDissolve.size === 0) {
        console.log('[UNGROUP] No groups found in selection');
        return;
      }
      groupIdsToDissolve.forEach(gid => {
        const groupData = threeRef.current.groups.get(gid);
        if (groupData) {
          // Hapus groupId + reset emissive dari semua block di grup
          groupData.blockSet.forEach(b => {
            delete b.userData.groupId;
            const mats = Array.isArray(b.material) ? b.material : [b.material];
            mats.forEach(m => {
              if (m.emissive) {
                m.emissive.setHex(0x000000);
                m.emissiveIntensity = 0;
              }
            });
          });
          threeRef.current.groups.delete(gid);
        }
      });
      setGroupCount(threeRef.current.groups.size);
      setHasSelectionInGroup(false);
      // Re-apply selection highlight (karena emissive grup tadi di-reset)
      selected.forEach(b => highlightSelected(b));
      console.log(`[UNGROUP] Dissolved ${groupIdsToDissolve.size} group(s)`);
    };
    const removeBlockFromGroups = (block) => {
      if (!block.userData.groupId) return;
      const gid = block.userData.groupId;
      const groupData = threeRef.current.groups.get(gid);
      if (groupData) {
        groupData.blockSet.delete(block);
        // Kalau grup tinggal 0 atau 1 block, auto-dissolve (grup butuh min 2 block)
        if (groupData.blockSet.size <= 1) {
          groupData.blockSet.forEach(b => delete b.userData.groupId);
          threeRef.current.groups.delete(gid);
          setGroupCount(threeRef.current.groups.size);
        }
      }
    };

    const selectBlock = (block, additive) => {
      if (!additive) {
        clearSelection();
      }
      // Phase 16: jika block punya groupId, auto-select semua block di grup itu
      // (kecuali user explicit Ctrl+click untuk toggle individual).
      // Ini supaya klik 1 block di grup = select seluruh grup (behaviour seperti DCC tools).
      const groupId = block.userData.groupId;
      if (groupId) {
        const groupData = threeRef.current.groups.get(groupId);
        if (groupData) {
          groupData.blockSet.forEach(b => {
            threeRef.current.selectedBlocks.add(b);
            highlightSelected(b);
          });
          setSelectedCount(threeRef.current.selectedBlocks.size);
          return;
        }
      }
      threeRef.current.selectedBlocks.add(block);
      highlightSelected(block);
      setSelectedCount(threeRef.current.selectedBlocks.size);
    };

    const toggleSelectBlock = (block) => {
      if (threeRef.current.selectedBlocks.has(block)) {
        threeRef.current.selectedBlocks.delete(block);
        unhighlightSelected(block);
      } else {
        threeRef.current.selectedBlocks.add(block);
        highlightSelected(block);
      }
      setSelectedCount(threeRef.current.selectedBlocks.size);
    };

    // Buat/update selectionGroup + attach gizmo ke group (bukan ke 1 blok).
    // Dipanggil SETELAH selectBlock/toggleSelectBlock di click handler.
    const attachGizmoToSelection = () => {
      const selected = threeRef.current.selectedBlocks;
      if (selected.size === 0) {
        transformControls.detach();
        return;
      }
      if (selected.size === 1) {
        // Single select — attach langsung ke blok (tidak perlu group)
        if (selectionGroup) {
          // Kembalikan blok ke scene dulu
          selected.forEach(b => scene.attach(b));
          scene.remove(selectionGroup);
          selectionGroup = null;
        }
        const block = selected.values().next().value;
        transformControls.attach(block);
        console.log('[GIZMO] attached to single block=', block.uuid, 'mode=', transformControls.getMode?.());
      } else {
        // Multi-select — buat group, reparent semua blok terpilih ke group
        if (selectionGroup) {
          // Sudah ada group — kembalikan blok ke scene dulu
          selected.forEach(b => scene.attach(b));
          scene.remove(selectionGroup);
        }
        selectionGroup = new THREE.Group();
        scene.add(selectionGroup);
        selected.forEach(b => selectionGroup.attach(b)); // preserve world position
        transformControls.attach(selectionGroup);
      }
    };

    // Daftar di WINDOW — tidak bisa di-suppress oleh OrbitControls/TransformControls
    window.addEventListener('mousedown', onWindowMouseDown);
    window.addEventListener('mouseup', onWindowMouseUp);

    // ── Phase 8: Undo/Redo ──
    const MAX_HISTORY = 50;
    const undoStack = [];
    const redoStack = [];

    // Snapshot semua blok ke array of plain objects (serializable).
    const snapshotState = () => {
      // Ambil world position/rotation/scale supaya benar walau block ada di dalam gltf.scene group
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      const worldScale = new THREE.Vector3();
      return threeRef.current.blocks.map(b => {
        b.getWorldPosition(worldPos);
        b.getWorldQuaternion(worldQuat);
        b.getWorldScale(worldScale);
        const euler = new THREE.Euler().setFromQuaternion(worldQuat);
        // Ambil warna dari material pertama yang punya color (handle multi-material glb)
        const mats = Array.isArray(b.material) ? b.material : [b.material];
        const colorMat = mats.find(m => m && m.color);
        const color = colorMat ? '#' + colorMat.color.getHexString() : '#3b82f6';
        return {
          px: worldPos.x, py: worldPos.y, pz: worldPos.z,
          rx: euler.x, ry: euler.y, rz: euler.z,
          sx: worldScale.x, sy: worldScale.y, sz: worldScale.z,
          color,
          isImported: !!b.userData.importedGlb,
        };
      });
    };

    // Restore scene dari snapshot — hapus semua blok, recreate dari snapshot.
    const restoreState = (snap) => {
      // Clear selection first
      clearSelection();
      // Remove all current blocks
      threeRef.current.blocks.forEach(b => {
        // removeFromParent aman untuk block biasa (parent=scene) maupun mesh import (parent=gltf.scene group)
        b.removeFromParent();
        if (Array.isArray(b.material)) {
          b.material.forEach(m => m.dispose());
        } else {
          b.material.dispose();
        }
        b.geometry.dispose();
      });
      threeRef.current.blocks = [];
      // Recreate from snapshot
      snap.forEach(s => {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(s.color),
          metalness: 0.1,
          roughness: 0.8,
        });
        const block = new THREE.Mesh(geo, mat);
        block.position.set(s.px, s.py, s.pz);
        block.rotation.set(s.rx, s.ry, s.rz);
        block.scale.set(s.sx, s.sy, s.sz);
        block.castShadow = true;
        block.receiveShadow = true;
        block.userData.isBlock = true;
        scene.add(block);
        threeRef.current.blocks.push(block);
      });
      setBlockCount(threeRef.current.blocks.length);
    };

    // Record current state to undo stack (call after each action).
    const recordHistory = () => {
      undoStack.push(snapshotState());
      if (undoStack.length > MAX_HISTORY) undoStack.shift();
      redoStack.length = 0; // clear redo stack on new action
      setCanUndo(undoStack.length > 0);
      setCanRedo(false);
    };

    const doUndo = () => {
      if (undoStack.length === 0) return;
      // Push current state to redo stack
      redoStack.push(snapshotState());
      // Pop previous state from undo stack
      const prev = undoStack.pop();
      restoreState(prev);
      setCanUndo(undoStack.length > 0);
      setCanRedo(redoStack.length > 0);
    };

    const doRedo = () => {
      if (redoStack.length === 0) return;
      undoStack.push(snapshotState());
      const next = redoStack.pop();
      restoreState(next);
      setCanUndo(undoStack.length > 0);
      setCanRedo(redoStack.length > 0);
    };

    // Keyboard shortcuts: Ctrl+Z = undo, Ctrl+Y / Ctrl+Shift+Z = redo
    const onUndoKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          doUndo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          doRedo();
        }
      }
    };
    window.addEventListener('keydown', onUndoKeyDown);

    // Expose undo/redo functions + recordHistory to threeRef for click handler access.
    threeRef.current.recordHistory = recordHistory;
    threeRef.current.doUndo = doUndo;
    threeRef.current.doRedo = doRedo;
    // Phase 16: expose group functions
    threeRef.current.createGroupFromSelection = createGroupFromSelection;
    threeRef.current.ungroupSelected = ungroupSelected;
    threeRef.current.removeBlockFromGroups = removeBlockFromGroups;

    const onCanvasMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x: mx, y: my }, camera);

      const currentTool = toolRef.current;
      const color = colorRef.current;

      // Ghost preview hanya untuk tool place
      if (currentTool === 'place') {
        highlightBlock(null);
        const targets = [ground, ...threeRef.current.blocks];
        const hits = raycaster.intersectObjects(targets, true);
        if (hits.length > 0) {
          const { posX, posY, posZ } = calcPlacePos(hits[0]);
          if (Math.abs(posX) > GRID_SIZE || Math.abs(posZ) > GRID_SIZE || posY < 0) {
            ghostBlock.visible = false;
            ghostEdges.visible = false;
            return;
          }
          ghostBlock.position.set(posX, posY, posZ);
          ghostBlock.material.color.set(color);
          ghostBlock.visible = true;
          ghostEdges.position.copy(ghostBlock.position);
          ghostEdges.visible = true;
        } else {
          ghostBlock.visible = false;
          ghostEdges.visible = false;
        }
      } else if (currentTool === 'delete') {
        ghostBlock.visible = false;
        ghostEdges.visible = false;
        const blockMeshes = threeRef.current.blocks;
        const hits = raycaster.intersectObjects(blockMeshes, true);
        if (hits.length > 0) {
          highlightBlock(hits[0].object);
        } else {
          highlightBlock(null);
        }
      } else {
        // Tool move/rotate/scale/paint/eyedropper/shape — hide ghost + delete highlight
        ghostBlock.visible = false;
        ghostEdges.visible = false;
        highlightBlock(null);
      }
    };

    // mousemove untuk ghost preview + delete highlight (tetap pakai mousemove,
    // bukan pointermove — tidak bentrok karena mousemove tidak di-preventDefault
    // oleh TransformControls saat tidak dragging).
    renderer.domElement.addEventListener('mousemove', onCanvasMouseMove);

    // ── Phase 12: glTF Import/Export ──
    const gltfLoader = new GLTFLoader();
    const gltfExporter = new GLTFExporter();

    // Import: load .glb/.gltf file → add meshes to scene.
    // Auto-scale & recenter: file glb dari Blender/Unity sering kecil (cm atau m).
    // Kita hitung bounding box, lalu scale supaya max dimension = TARGET_IMPORT_SIZE
    // (default 4 unit, oke untuk grid 30). Lalu recenter ke origin (X=0, Z=0, Y di atas ground).
    const TARGET_IMPORT_SIZE = 20;
    const importGltf = (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        gltfLoader.parse(arrayBuffer, '', (gltf) => {
          // ── Auto-scale & recenter ──
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          let scaleFactor = 1;
          if (maxDim > 0) {
            scaleFactor = TARGET_IMPORT_SIZE / maxDim;
          }
          gltf.scene.scale.setScalar(scaleFactor);
          // Setelah scale, bounding box berubah → recompute center
          gltf.scene.updateMatrixWorld(true);
          const box2 = new THREE.Box3().setFromObject(gltf.scene);
          const center2 = box2.getCenter(new THREE.Vector3());
          const size2 = box2.getSize(new THREE.Vector3());
          // Geser supaya center X/Z = 0, dan bottom Y = 0 (di atas grid)
          gltf.scene.position.x += -center2.x;
          gltf.scene.position.z += -center2.z;
          gltf.scene.position.y += -box2.min.y;
          gltf.scene.updateMatrixWorld(true);
          console.log(`[glTF Import] scale=${scaleFactor.toFixed(3)} size=${size2.x.toFixed(2)}x${size2.y.toFixed(2)}x${size2.z.toFixed(2)} (auto-fit to ${TARGET_IMPORT_SIZE}u)`);

          // ── FLATTEN: bake world transform ke setiap mesh, pindah ke scene langsung ──
          // Kenapa: kalau mesh tetap di dalam gltf.scene group yang di-scale 20×,
          // TransformControls.attach(mesh) akan baca local position (sebelum scale),
          // gizmo muncul di posisi salah, dan drag menghasilkan transformasi kacau.
          // Flatten = setiap mesh diparent ke scene dengan world transform di-bake.
          const meshesToFlatten = [];
          gltf.scene.traverse(child => {
            if (child.isMesh) meshesToFlatten.push(child);
          });
          meshesToFlatten.forEach(mesh => {
            scene.attach(mesh); // reparent ke scene, preserve world transform
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.isBlock = true;
            mesh.userData.importedGlb = true;
            threeRef.current.blocks.push(mesh);
          });
          // Buang group kosong (sudah tidak punya children)
          scene.remove(gltf.scene);

          setBlockCount(threeRef.current.blocks.length);
          if (threeRef.current.recordHistory) threeRef.current.recordHistory();
        }, undefined, (error) => {
          console.error('glTF import error:', error);
        });
      };
      reader.readAsArrayBuffer(file);
    };

    // Export: scene blocks → .glb file download.
    const exportGltf = () => {
      // Buat temporary scene dengan hanya blocks (tanpa grid/axes/ghost/helper)
      const tempScene = new THREE.Scene();
      threeRef.current.blocks.forEach(b => {
        tempScene.add(b.clone());
      });
      gltfExporter.parse(tempScene, (result) => {
        const blob = new Blob([result], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'block-sim-v2-scene.glb';
        a.click();
        URL.revokeObjectURL(url);
      }, (error) => {
        console.error('glTF export error:', error);
      }, { binary: true });
    };

    // Expose ke threeRef untuk akses dari tombol UI.
    threeRef.current.importGltf = importGltf;
    threeRef.current.exportGltf = exportGltf;

    // Hidden file input untuk import.
    const fileInputRef = document.createElement('input');
    fileInputRef.type = 'file';
    fileInputRef.accept = '.glb,.gltf';
    fileInputRef.style.display = 'none';
    fileInputRef.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) importGltf(file);
      fileInputRef.value = ''; // reset supaya bisa import file yang sama lagi
    });
    document.body.appendChild(fileInputRef);
    threeRef.current.fileInputRef = fileInputRef;

    // Cleanup — dispose everything on unmount
    return () => {
      if (threeRef.current.animationId) {
        cancelAnimationFrame(threeRef.current.animationId);
      }
      ro.disconnect();
      controls.dispose();
      transformControls.dispose();
      renderer.dispose();
      // Phase 13: dispose composer & passes untuk prevent memory leak
      composer.dispose();
      bloomPass.dispose();
      renderPass.dispose?.();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onUndoKeyDown);
      renderer.domElement.removeEventListener('mousemove', onCanvasMouseMove);
      window.removeEventListener('mousedown', onWindowMouseDown);
      window.removeEventListener('mouseup', onWindowMouseUp);
      // Dispose ghost
      ghostGeo.dispose();
      ghostMat.dispose();
      // Cleanup Phase 12: file input
      if (threeRef.current.fileInputRef) {
        document.body.removeChild(threeRef.current.fileInputRef);
      }
      // Remove canvas from DOM
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      // Dispose geometries + materials
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, []);

  /* ---------- Styles (reuse dari v1 untuk konsistensi) ---------- */
  const panelBg = '#0e1420';
  const panelBorder = '#1e293b';
  const textSecondary = '#94a3b8';
  const pink = '#f472b6';

  return (
    <div style={{
      height: '100dvh',
      backgroundColor: '#05080f',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              backgroundColor: 'rgba(245, 158, 11, 0.18)', padding: 8, borderRadius: 10,
              color: '#f59e0b',
            }}>
              <Box size={22} />
            </div>
            <h1 style={{
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
              background: 'linear-gradient(180deg,#fbbf24 0%,#f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.01em',
              margin: 0,
            }}>
              3D BLOCK SIMULATOR v2
            </h1>
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#f59e0b',
              background: 'rgba(245, 158, 11, 0.15)',
              padding: '2px 8px', borderRadius: 4, letterSpacing: 1,
              fontFamily: 'Orbitron, sans-serif',
            }}>Three.js</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            padding: '6px 14px', borderRadius: 10,
            backgroundColor: panelBg, border: `1px solid ${selectedCount > 0 ? '#1a8cff' : panelBorder}`,
            color: selectedCount > 0 ? '#1a8cff' : textSecondary, fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Box size={14} />
            {blockCount} Blocks{selectedCount > 0 ? ` • ${selectedCount} Selected` : ''}
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

      {/* Main Canvas Area — Three.js container */}
      <div ref={containerRef} style={{
        flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0,
      }}>
        {/* Toolbar — Place / Delete / Undo / Redo / Shape / Transform / Paint / Display / Material */}
        <div style={{
          position: 'absolute', top: 16, left: 16,
          display: 'flex', flexDirection: 'column', gap: 6,
          backgroundColor: 'rgba(14, 20, 32, 0.92)',
          padding: '12px 14px 12px 12px',
          borderRadius: 14,
          border: `1px solid ${panelBorder}`,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          zIndex: 5,
          width: 220,
          maxHeight: 'calc(100dvh - 100px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(148,163,184,0.3) transparent',
        }}
        className="toolbar-scroll">
        <style>{`
          .toolbar-scroll::-webkit-scrollbar { width: 6px; }
          .toolbar-scroll::-webkit-scrollbar-track { background: transparent; }
          .toolbar-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.3); border-radius: 3px; }
          .toolbar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.5); }
        `}</style>

          {/* ── Section: BUILD (Place/Delete/Shape) ── */}
          <div onClick={() => toggleSection('build')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', padding: '4px 2px', marginBottom: 2,
            userSelect: 'none',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: textSecondary,
              textTransform: 'uppercase', letterSpacing: '1px',
              fontFamily: 'Orbitron, sans-serif',
            }}>Build</div>
            {openSections.build
              ? <ChevronDown size={14} color="#64748b" />
              : <ChevronRight size={14} color="#64748b" />}
          </div>
          {openSections.build && (<>
            <button
              onClick={() => setTool('place')}
              title="Place (P)"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${tool === 'place' ? '#f59e0b' : 'rgba(148,163,184,0.12)'}`,
                backgroundColor: tool === 'place' ? '#f59e0b' : 'transparent',
                color: tool === 'place' ? '#0e1420' : '#e2e8f0',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Plus size={15} />
              Place
            </button>
            <button
              onClick={() => setTool('delete')}
              title="Delete (X)"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${tool === 'delete' ? '#ef4444' : 'rgba(148,163,184,0.12)'}`,
                backgroundColor: tool === 'delete' ? '#ef4444' : 'transparent',
                color: tool === 'delete' ? '#fff' : '#e2e8f0',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Trash2 size={15} />
              Delete
            </button>
            <button
              onClick={() => setTool('shape')}
              title="Shape (G)"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${tool === 'shape' ? '#06b6d4' : 'rgba(148,163,184,0.12)'}`,
                backgroundColor: tool === 'shape' ? '#06b6d4' : 'transparent',
                color: tool === 'shape' ? '#0e1420' : '#e2e8f0',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Shapes size={15} />
              Shape
            </button>
            {/* Clone & Mirror tools */}
            <button
              onClick={() => setTool('clone')}
              title="Clone (B) — klik block → duplikat identik muncul 1 unit ke X"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${tool === 'clone' ? '#06b6d4' : 'rgba(148,163,184,0.12)'}`,
                backgroundColor: tool === 'clone' ? '#06b6d4' : 'transparent',
                color: tool === 'clone' ? '#0e1420' : '#e2e8f0',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Copy size={15} />
              Clone
            </button>
            <button
              onClick={() => setTool('mirror')}
              title="Mirror (V) — klik block → duplikat yang di-flip di axis terpilih"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${tool === 'mirror' ? '#06b6d4' : 'rgba(148,163,184,0.12)'}`,
                backgroundColor: tool === 'mirror' ? '#06b6d4' : 'transparent',
                color: tool === 'mirror' ? '#0e1420' : '#e2e8f0',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <FlipHorizontal size={15} />
              Mirror
            </button>
            {/* Phase 18: Object Library tool */}
            <button
              onClick={() => { setTool('object'); if (!selectedObj) setSelectedObj('house'); }}
              title="Object Library (O) — pilih model pre-built (house, tree, car, tower, lamp)"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${tool === 'object' ? '#fbbf24' : 'rgba(148,163,184,0.12)'}`,
                backgroundColor: tool === 'object' ? '#fbbf24' : 'transparent',
                color: tool === 'object' ? '#0e1420' : '#e2e8f0',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Home size={15} />
              Object {selectedObj ? `(${selectedObj})` : ''}
            </button>
          </>)}

          {/* ── Object Library panel — muncul saat tool=object aktif (pojok kanan atas bawah) ── */}

          {/* ── Mirror Axis selector — muncul saat tool=mirror aktif ── */}
          {tool === 'mirror' && (
            <div style={{
              display: 'flex', gap: 4, marginTop: 2, padding: '4px 0',
            }}>
              {['x', 'y', 'z'].map(ax => (
                <button key={ax} onClick={() => setMirrorAxis(ax)}
                  style={{
                    flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 700,
                    border: `1px solid ${mirrorAxis === ax ? '#06b6d4' : 'rgba(148,163,184,0.12)'}`,
                    backgroundColor: mirrorAxis === ax ? '#06b6d4' : 'transparent',
                    color: mirrorAxis === ax ? '#0e1420' : '#94a3b8',
                    borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    textTransform: 'uppercase',
                  }}>
                  Mirror {ax}
                </button>
              ))}
            </div>
          )}

          {/* ── Section: TRANSFORM (Move/Rotate/Scale) ── */}
          <div onClick={() => toggleSection('transform')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', padding: '4px 2px', marginTop: 6, marginBottom: 2,
            borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 8,
            userSelect: 'none',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: textSecondary,
              textTransform: 'uppercase', letterSpacing: '1px',
              fontFamily: 'Orbitron, sans-serif',
            }}>Transform</div>
            {openSections.transform
              ? <ChevronDown size={14} color="#64748b" />
              : <ChevronRight size={14} color="#64748b" />}
          </div>
          {openSections.transform && (<>
            <button
              onClick={() => setTool('move')}
              title="Move (M)"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${tool === 'move' ? '#22c55e' : 'rgba(148,163,184,0.12)'}`,
                backgroundColor: tool === 'move' ? '#22c55e' : 'transparent',
                color: tool === 'move' ? '#0e1420' : '#e2e8f0',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Move size={15} />
              Move
            </button>
            <button
              onClick={() => setTool('rotate')}
              title="Rotate (R)"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${tool === 'rotate' ? '#3b82f6' : 'rgba(148,163,184,0.12)'}`,
                backgroundColor: tool === 'rotate' ? '#3b82f6' : 'transparent',
                color: tool === 'rotate' ? '#fff' : '#e2e8f0',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <RotateCw size={15} />
              Rotate
            </button>
            <button
              onClick={() => setTool('scale')}
              title="Scale (S)"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${tool === 'scale' ? '#8b5cf6' : 'rgba(148,163,184,0.12)'}`,
                backgroundColor: tool === 'scale' ? '#8b5cf6' : 'transparent',
                color: tool === 'scale' ? '#fff' : '#e2e8f0',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Maximize size={15} />
              Scale
            </button>
          </>)}

          {/* ── Section: PAINT (Paint/Eyedropper) ── */}
          <div onClick={() => toggleSection('paint')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', padding: '4px 2px', marginTop: 6, marginBottom: 2,
            borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 8,
            userSelect: 'none',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: textSecondary,
              textTransform: 'uppercase', letterSpacing: '1px',
              fontFamily: 'Orbitron, sans-serif',
            }}>Paint</div>
            {openSections.paint
              ? <ChevronDown size={14} color="#64748b" />
              : <ChevronRight size={14} color="#64748b" />}
          </div>
          {openSections.paint && (<>
            <button
              onClick={() => setTool('paint')}
              title="Paint (C)"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${tool === 'paint' ? '#f59e0b' : 'rgba(148,163,184,0.12)'}`,
                backgroundColor: tool === 'paint' ? '#f59e0b' : 'transparent',
                color: tool === 'paint' ? '#0e1420' : '#e2e8f0',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Paintbrush size={15} />
              Paint
            </button>
            <button
              onClick={() => setTool('eyedropper')}
              title="Eyedropper (I)"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${tool === 'eyedropper' ? '#a855f7' : 'rgba(148,163,184,0.12)'}`,
                backgroundColor: tool === 'eyedropper' ? '#a855f7' : 'transparent',
                color: tool === 'eyedropper' ? '#fff' : '#e2e8f0',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Pipette size={15} />
              Pick Color
            </button>
          </>)}

          {/* ── Section: HISTORY (Undo/Redo) ── */}
          <div onClick={() => toggleSection('history')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', padding: '4px 2px', marginTop: 6, marginBottom: 2,
            borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 8,
            userSelect: 'none',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: textSecondary,
              textTransform: 'uppercase', letterSpacing: '1px',
              fontFamily: 'Orbitron, sans-serif',
            }}>History</div>
            {openSections.history
              ? <ChevronDown size={14} color="#64748b" />
              : <ChevronRight size={14} color="#64748b" />}
          </div>
          {openSections.history && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => threeRef.current.doUndo && threeRef.current.doUndo()}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 10px', borderRadius: 10,
                  border: `1px solid ${canUndo ? '#22c55e' : 'rgba(148,163,184,0.12)'}`,
                  backgroundColor: canUndo ? 'rgba(34,197,94,0.15)' : 'transparent',
                  color: canUndo ? '#22c55e' : '#475569',
                  fontSize: 12, fontWeight: 600, cursor: canUndo ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                  opacity: canUndo ? 1 : 0.5,
                }}
              >
                <Undo2 size={14} />
                Undo
              </button>
              <button
                onClick={() => threeRef.current.doRedo && threeRef.current.doRedo()}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 10px', borderRadius: 10,
                  border: `1px solid ${canRedo ? '#3b82f6' : 'rgba(148,163,184,0.12)'}`,
                  backgroundColor: canRedo ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: canRedo ? '#3b82f6' : '#475569',
                  fontSize: 12, fontWeight: 600, cursor: canRedo ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                  opacity: canRedo ? 1 : 0.5,
                }}
              >
                <Redo2 size={14} />
                Redo
              </button>
            </div>
          )}

          {/* ── Section: GROUPS (Group/Ungroup) ── */}
          <div onClick={() => toggleSection('groups')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', padding: '4px 2px', marginTop: 6, marginBottom: 2,
            borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 8,
            userSelect: 'none',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: textSecondary,
              textTransform: 'uppercase', letterSpacing: '1px',
              fontFamily: 'Orbitron, sans-serif',
            }}>Groups {groupCount > 0 && <span style={{ color: '#fbbf24', marginLeft: 4 }}>({groupCount})</span>}</div>
            {openSections.groups
              ? <ChevronDown size={14} color="#64748b" />
              : <ChevronRight size={14} color="#64748b" />}
          </div>
          {openSections.groups && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Group button — enabled saat selectedCount >= 2 */}
              <button
                onClick={() => threeRef.current.createGroupFromSelection && threeRef.current.createGroupFromSelection()}
                disabled={selectedCount < 2}
                title="Group selected blocks (min 2 blocks)"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 10,
                  border: `1px solid ${selectedCount >= 2 ? 'rgba(251,191,36,0.4)' : 'rgba(148,163,184,0.12)'}`,
                  backgroundColor: selectedCount >= 2 ? 'rgba(251,191,36,0.12)' : 'transparent',
                  color: selectedCount >= 2 ? '#fbbf24' : '#475569',
                  fontSize: 13, fontWeight: 500,
                  cursor: selectedCount >= 2 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                  opacity: selectedCount >= 2 ? 1 : 0.5,
                }}
              >
                <Group size={15} />
                Group {selectedCount > 0 ? `(${selectedCount})` : ''}
              </button>
              {/* Ungroup button — enabled saat ada selection yang di grup */}
              <button
                onClick={() => threeRef.current.ungroupSelected && threeRef.current.ungroupSelected()}
                disabled={!hasSelectionInGroup}
                title="Ungroup selected blocks"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 10,
                  border: `1px solid ${hasSelectionInGroup ? 'rgba(244,63,94,0.4)' : 'rgba(148,163,184,0.12)'}`,
                  backgroundColor: hasSelectionInGroup ? 'rgba(244,63,94,0.12)' : 'transparent',
                  color: hasSelectionInGroup ? '#f43f5e' : '#475569',
                  fontSize: 13, fontWeight: 500,
                  cursor: hasSelectionInGroup ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                  opacity: hasSelectionInGroup ? 1 : 0.5,
                }}
              >
                <Ungroup size={15} />
                Ungroup
              </button>
              {/* Info text */}
              {selectedCount > 0 && (
                <div style={{
                  fontSize: 10, color: '#64748b', fontStyle: 'italic',
                  padding: '4px 6px', background: 'rgba(148,163,184,0.05)',
                  borderRadius: 6, border: '1px solid rgba(148,163,184,0.1)',
                }}>
                  {selectedCount < 2
                    ? 'Select 2+ blocks to Group'
                    : !hasSelectionInGroup
                      ? 'Click Group to bind selected blocks'
                      : 'Selected blocks are grouped'}
                </div>
              )}
            </div>
          )}

          {/* ── Section: DISPLAY (Grid/Snap/Shadows) ── */}
          <div onClick={() => toggleSection('display')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', padding: '4px 2px', marginTop: 6, marginBottom: 2,
            borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 8,
            userSelect: 'none',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: textSecondary,
              textTransform: 'uppercase', letterSpacing: '1px',
              fontFamily: 'Orbitron, sans-serif',
            }}>Display</div>
            {openSections.display
              ? <ChevronDown size={14} color="#64748b" />
              : <ChevronRight size={14} color="#64748b" />}
          </div>
          {openSections.display && (<>
            <button
              onClick={() => setShowGrid(v => !v)}
              title="Toggle grid visibility"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${showGrid ? 'rgba(148,163,184,0.3)' : 'rgba(148,163,184,0.12)'}`,
                backgroundColor: showGrid ? 'rgba(148,163,184,0.15)' : 'transparent',
                color: showGrid ? '#e2e8f0' : '#64748b',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Grid3x3 size={15} />
              Grid {showGrid ? 'On' : 'Off'}
            </button>
            <button
              onClick={() => setSnapMove(v => !v)}
              title="Toggle snap to grid saat Move"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${snapMove ? 'rgba(148,163,184,0.3)' : 'rgba(148,163,184,0.12)'}`,
                backgroundColor: snapMove ? 'rgba(148,163,184,0.15)' : 'transparent',
                color: snapMove ? '#e2e8f0' : '#64748b',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Move size={15} />
              Snap {snapMove ? 'On' : 'Off'}
            </button>
            <button
              onClick={() => setShadowsOn(v => !v)}
              title="Toggle shadows"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${shadowsOn ? 'rgba(148,163,184,0.3)' : 'rgba(148,163,184,0.12)'}`,
                backgroundColor: shadowsOn ? 'rgba(148,163,184,0.15)' : 'transparent',
                color: shadowsOn ? '#e2e8f0' : '#64748b',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Box size={15} />
              Shadows {shadowsOn ? 'On' : 'Off'}
            </button>
            {/* Phase 15: Symmetry Mode — toggle (persistent mode) */}
            <button
              onClick={() => setSymmetryMode(v => !v)}
              title="Symmetry Mode — saat ON, setiap block yang di-place/shape otomatis di-mirror di axis"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${symmetryMode ? 'rgba(236,72,153,0.5)' : 'rgba(148,163,184,0.12)'}`,
                backgroundColor: symmetryMode ? 'rgba(236,72,153,0.18)' : 'transparent',
                color: symmetryMode ? '#ec4899' : '#64748b',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <FlipHorizontal size={15} />
              Symmetry {symmetryMode ? 'On' : 'Off'}
            </button>
            {/* Symmetry Axis selector — muncul saat symmetryMode on */}
            {symmetryMode && (
              <div style={{ display: 'flex', gap: 4 }}>
                {['x', 'y', 'z'].map(ax => (
                  <button key={ax} onClick={() => setSymmetryAxis(ax)}
                    style={{
                      flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 700,
                      border: `1px solid ${symmetryAxis === ax ? '#ec4899' : 'rgba(148,163,184,0.12)'}`,
                      backgroundColor: symmetryAxis === ax ? '#ec4899' : 'transparent',
                      color: symmetryAxis === ax ? '#0e1420' : '#94a3b8',
                      borderRadius: 8, cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      textTransform: 'uppercase',
                    }}>
                    Axis {ax}
                  </button>
                ))}
              </div>
            )}
            {/* Phase 17: Environment Map selector — untuk reflective material */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
              padding: '4px 0',
            }}>
              <Globe size={15} color="#06b6d4" />
              <select value={envMode} onChange={e => setEnvMode(e.target.value)}
                style={{
                  flex: 1, background: '#1e293b',
                  border: '1px solid rgba(6,182,212,0.3)',
                  borderRadius: 6, color: '#e2e8f0', fontSize: 12,
                  padding: '6px 8px', fontFamily: 'Inter, sans-serif',
                  outline: 'none', cursor: 'pointer',
                }}>
                <option value="none">No Env (flat)</option>
                <option value="studio">Studio (reflection)</option>
                <option value="sky">Sky Gradient (background)</option>
              </select>
            </div>
            <div style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic', marginTop: 2 }}>
              Env map = reflection untuk material metalness &gt; 0
            </div>
          </>)}

          {/* ── Section: BLOOM (Post-Processing) ── */}
          <div onClick={() => toggleSection('bloom')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', padding: '4px 2px', marginTop: 6, marginBottom: 2,
            borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 8,
            userSelect: 'none',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: '#c084fc',
              textTransform: 'uppercase', letterSpacing: '1px',
              fontFamily: 'Orbitron, sans-serif',
              display: 'flex', alignItems: 'center', gap: 6,
            }}><Sparkles size={11} /> Bloom</div>
            {openSections.bloom
              ? <ChevronDown size={14} color="#64748b" />
              : <ChevronRight size={14} color="#64748b" />}
          </div>
          {openSections.bloom && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => setBloomOn(v => !v)}
                title="Toggle bloom post-processing (glow on emissive materials)"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 10,
                  border: `1px solid ${bloomOn ? 'rgba(168,85,247,0.4)' : 'rgba(148,163,184,0.12)'}`,
                  backgroundColor: bloomOn ? 'rgba(168,85,247,0.15)' : 'transparent',
                  color: bloomOn ? '#c084fc' : '#64748b',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <Sparkles size={15} />
                Bloom {bloomOn ? 'On' : 'Off'}
              </button>
              {bloomOn && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 4 }}>
                  {/* Quick presets — Subtle/Normal/Intense */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => { setBloomStrength(0.3); setBloomRadius(0.2); setBloomThreshold(0.5); }}
                      style={{ flex: 1, padding: '4px 6px', fontSize: 10, fontWeight: 600,
                        background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
                        borderRadius: 6, color: '#c084fc', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      }}>Subtle</button>
                    <button onClick={() => { setBloomStrength(0.8); setBloomRadius(0.4); setBloomThreshold(0.3); }}
                      style={{ flex: 1, padding: '4px 6px', fontSize: 10, fontWeight: 600,
                        background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)',
                        borderRadius: 6, color: '#c084fc', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      }}>Normal</button>
                    <button onClick={() => { setBloomStrength(1.8); setBloomRadius(0.8); setBloomThreshold(0.1); }}
                      style={{ flex: 1, padding: '4px 6px', fontSize: 10, fontWeight: 600,
                        background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
                        borderRadius: 6, color: '#c084fc', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      }}>Intense</button>
                  </div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Strength</span><span style={{ color: '#c084fc' }}>{bloomStrength.toFixed(2)}</span>
                  </label>
                  <input type="range" min="0" max="3" step="0.05" value={bloomStrength}
                    onChange={e => setBloomStrength(parseFloat(e.target.value))}
                    style={{ accentColor: '#a855f7' }} />
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Radius</span><span style={{ color: '#c084fc' }}>{bloomRadius.toFixed(2)}</span>
                  </label>
                  <input type="range" min="0" max="1.5" step="0.05" value={bloomRadius}
                    onChange={e => setBloomRadius(parseFloat(e.target.value))}
                    style={{ accentColor: '#a855f7' }} />
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Threshold</span><span style={{ color: '#c084fc' }}>{bloomThreshold.toFixed(2)}</span>
                  </label>
                  <input type="range" min="0" max="1" step="0.05" value={bloomThreshold}
                    onChange={e => setBloomThreshold(parseFloat(e.target.value))}
                    style={{ accentColor: '#a855f7' }} />
                </div>
              )}
            </div>
          )}

          {/* ── Section: IMPORT/EXPORT (glTF) ── */}
          <div onClick={() => toggleSection('io')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', padding: '4px 2px', marginTop: 6, marginBottom: 2,
            borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 8,
            userSelect: 'none',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: textSecondary,
              textTransform: 'uppercase', letterSpacing: '1px',
              fontFamily: 'Orbitron, sans-serif',
            }}>Import / Export</div>
            {openSections.io
              ? <ChevronDown size={14} color="#64748b" />
              : <ChevronRight size={14} color="#64748b" />}
          </div>
          {openSections.io && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => threeRef.current.fileInputRef && threeRef.current.fileInputRef.click()}
                title="Import .glb/.gltf file"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 10px', borderRadius: 10,
                  border: '1px solid rgba(34,197,94,0.3)',
                  backgroundColor: 'rgba(34,197,94,0.1)',
                  color: '#22c55e',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <Upload size={14} />
                Import
              </button>
              <button
                onClick={() => threeRef.current.exportGltf && threeRef.current.exportGltf()}
                title="Export scene as .glb"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 10px', borderRadius: 10,
                  border: '1px solid rgba(59,130,246,0.3)',
                  backgroundColor: 'rgba(59,130,246,0.1)',
                  color: '#3b82f6',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <Download size={14} />
                Export
              </button>
            </div>
          )}

          {/* ── Section: MATERIAL (PBR + Emissive) — muncul saat ada blok terpilih ── */}
          {selectedCount > 0 && (
            <>
              <div onClick={() => toggleSection('material')} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', padding: '4px 2px', marginTop: 6, marginBottom: 2,
                borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 8,
                userSelect: 'none',
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: textSecondary,
                  textTransform: 'uppercase', letterSpacing: '1px',
                  fontFamily: 'Orbitron, sans-serif',
                }}>Material {selectedCount > 1 ? `(${selectedCount})` : ''}</div>
                {openSections.material
                  ? <ChevronDown size={14} color="#64748b" />
                  : <ChevronRight size={14} color="#64748b" />}
              </div>
              {openSections.material && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Metalness slider */}
                  <div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 11, color: textSecondary, marginBottom: 4,
                    }}>
                      <span>Metalness</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{metalness.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.01" value={metalness}
                      onChange={e => setMetalness(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                    />
                  </div>
                  {/* Roughness slider */}
                  <div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 11, color: textSecondary, marginBottom: 4,
                    }}>
                      <span>Roughness</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{roughness.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.01" value={roughness}
                      onChange={e => setRoughness(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                    />
                  </div>
                  {/* Quick presets */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => { setMetalness(0); setRoughness(1); }}
                      style={{ flex: 1, padding: '4px 8px', fontSize: 10, fontWeight: 600,
                        background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.15)',
                        borderRadius: 6, color: textSecondary, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      }}>Matte</button>
                    <button onClick={() => { setMetalness(0.3); setRoughness(0.5); }}
                      style={{ flex: 1, padding: '4px 8px', fontSize: 10, fontWeight: 600,
                        background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.15)',
                        borderRadius: 6, color: textSecondary, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      }}>Satin</button>
                    <button onClick={() => { setMetalness(0.9); setRoughness(0.1); }}
                      style={{ flex: 1, padding: '4px 8px', fontSize: 10, fontWeight: 600,
                        background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.15)',
                        borderRadius: 6, color: textSecondary, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      }}>Metal</button>
                  </div>
                  {/* Divider */}
                  <div style={{ borderTop: '1px solid rgba(168,85,247,0.2)', margin: '4px 0' }} />
                  {/* Emissive color picker */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: 11, color: '#c084fc', marginBottom: 2, fontWeight: 600,
                  }}>
                    <span>Glow Color</span>
                    <input type="color" value={emissiveColor}
                      onChange={e => setEmissiveColor(e.target.value)}
                      style={{ width: 30, height: 22, border: 'none', background: 'transparent', cursor: 'pointer' }} />
                  </div>
                  {/* Emissive intensity slider */}
                  <div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 11, color: '#94a3b8', marginBottom: 4,
                    }}>
                      <span>Glow Intensity</span>
                      <span style={{ color: '#c084fc', fontWeight: 700 }}>{emissiveIntensity.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min="0" max="3" step="0.05" value={emissiveIntensity}
                      onChange={e => setEmissiveIntensity(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer' }}
                    />
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>
                      Set 0 = mati. Aktifkan Bloom di section Bloom untuk lihat glow.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Shape config — pojok kanan atas agak bawah (di bawah header) */}
        {tool === 'shape' && (
          <div style={{
            position: 'absolute', top: 80, right: 16,
            display: 'flex', flexDirection: 'column', gap: 8,
            backgroundColor: 'rgba(14, 20, 32, 0.92)',
            padding: 12, borderRadius: 14,
            border: '1px solid rgba(6,182,212,0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            zIndex: 5, width: 200,
            fontFamily: 'Inter, sans-serif',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: textSecondary,
              textTransform: 'uppercase', letterSpacing: '1px',
              marginBottom: 4, fontFamily: 'Orbitron, sans-serif',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Shapes size={12} /> Shape Generator
            </div>
            <label style={{ fontSize: 10, color: textSecondary, fontWeight: 600 }}>
              Shape
              <select value={shapeType} onChange={e => setShapeType(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: 2, background: '#1e293b',
                  border: '1px solid #06b6d4', borderRadius: 4, color: '#e2e8f0', fontSize: 12,
                  padding: '4px 6px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}>
                <option value="cube">Cube</option>
                <option value="sphere">Sphere</option>
                <option value="cylinder">Cylinder</option>
                <option value="cone">Cone</option>
                <option value="torus">Torus (donut)</option>
              </select>
            </label>
            <label style={{ fontSize: 10, color: textSecondary, fontWeight: 600 }}>
              Size
              <input type="number" step="0.5" min="0.5" value={shapeSize}
                onChange={e => { const v = parseFloat(e.target.value); setShapeSize(Number.isFinite(v) && v > 0 ? v : 0.5); }}
                style={{ display: 'block', width: '100%', marginTop: 2, background: '#1e293b',
                  border: '1px solid #06b6d4', borderRadius: 4, color: '#e2e8f0', fontSize: 12,
                  padding: '3px 6px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
            </label>
            <label style={{ fontSize: 10, color: textSecondary, fontWeight: 600 }}>
              Segments (4-32)
              <input type="number" step="1" min="4" max="32" value={shapeSegments}
                onChange={e => { const v = parseInt(e.target.value, 10); setShapeSegments(Number.isFinite(v) ? Math.max(4, Math.min(32, v)) : 16); }}
                style={{ display: 'block', width: '100%', marginTop: 2, background: '#1e293b',
                  border: '1px solid #06b6d4', borderRadius: 4, color: '#e2e8f0', fontSize: 12,
                  padding: '3px 6px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
            </label>
            <div style={{ fontSize: 10, color: '#06b6d4', fontStyle: 'italic',
              padding: '4px 6px', background: 'rgba(6,182,212,0.08)', borderRadius: 6,
              border: '1px solid rgba(6,182,212,0.3)' }}>
              Klik grid untuk generate
            </div>
            {/* Color palette dalam shape */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 30px)', gap: 6 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setCurrentColor(c)}
                  style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: c, cursor: 'pointer',
                    border: `2px solid ${currentColor === c ? '#06b6d4' : 'transparent'}`,
                    transition: 'transform 0.1s', boxShadow: currentColor === c ? `0 0 8px ${c}66` : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
              ))}
            </div>
          </div>
        )}

        {/* Object Library — pojok kanan atas agak bawah (Phase 18) */}
        {tool === 'object' && (
          <div style={{
            position: 'absolute', top: 80, right: 16,
            display: 'flex', flexDirection: 'column', gap: 8,
            backgroundColor: 'rgba(14, 20, 32, 0.92)',
            padding: 12, borderRadius: 14,
            border: '1px solid rgba(251,191,36,0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            zIndex: 5, width: 220,
            fontFamily: 'Inter, sans-serif',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: textSecondary,
              textTransform: 'uppercase', letterSpacing: '1px',
              marginBottom: 4, fontFamily: 'Orbitron, sans-serif',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Home size={12} color="#fbbf24" /> Object Library
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { key: 'house', label: 'House', icon: <Home size={14} /> },
                { key: 'tree',  label: 'Tree',  icon: <TreePine size={14} /> },
                { key: 'car',   label: 'Car',   icon: <Car size={14} /> },
                { key: 'tower', label: 'Tower', icon: <Building2 size={14} /> },
                { key: 'lamp',  label: 'Lamp',  icon: <Lightbulb size={14} /> },
              ].map(obj => (
                <button key={obj.key}
                  onClick={() => setSelectedObj(obj.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
                    padding: '10px 6px', borderRadius: 8,
                    border: `1px solid ${selectedObj === obj.key ? '#fbbf24' : 'rgba(148,163,184,0.15)'}`,
                    backgroundColor: selectedObj === obj.key ? 'rgba(251,191,36,0.18)' : 'transparent',
                    color: selectedObj === obj.key ? '#fbbf24' : '#94a3b8',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {obj.icon}
                  {obj.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#fbbf24', fontStyle: 'italic',
              padding: '4px 6px', background: 'rgba(251,191,36,0.08)', borderRadius: 6,
              border: '1px solid rgba(251,191,36,0.3)' }}>
              Klik grid untuk place {selectedObj || 'object'}
            </div>
            {/* Color palette (warna untuk object yang pakai currentColor, misal car body) */}
            <div style={{ fontSize: 10, color: textSecondary, fontWeight: 600 }}>Body color</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 30px)', gap: 6 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setCurrentColor(c)}
                  style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: c, cursor: 'pointer',
                    border: `2px solid ${currentColor === c ? '#fbbf24' : 'transparent'}`,
                    transition: 'transform 0.1s', boxShadow: currentColor === c ? `0 0 8px ${c}66` : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
              ))}
            </div>
          </div>
        )}

        {/* Color palette — pojok kanan atas agak bawah */}
        {(tool === 'place' || tool === 'paint') && (
          <div style={{
            position: 'absolute', top: 80, right: 16,
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
            }}>Colors</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 30px)', gap: 6 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setCurrentColor(c)}
                  style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: c, cursor: 'pointer',
                    border: `2px solid ${currentColor === c ? '#f59e0b' : 'transparent'}`,
                    transition: 'transform 0.1s', boxShadow: currentColor === c ? `0 0 8px ${c}66` : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
              ))}
            </div>
          </div>
        )}

        {/* Build Mode badge — permanent info panel */}
        <div style={{
          position: 'absolute', bottom: 16, left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(14, 20, 32, 0.92)',
          padding: '10px 20px', borderRadius: 12,
          border: `1px solid ${pink}`,
          color: '#e2e8f0', fontSize: 12, textAlign: 'center',
          boxShadow: `0 0 24px ${pink}33`,
          zIndex: 5, lineHeight: 1.6,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 600, color: pink, marginBottom: 2 }}>
            Build Mode
          </div>
          <div style={{ color: textSecondary, fontSize: 11 }}>
            <strong style={{color:'#e2e8f0'}}>L-Click</strong> {tool === 'place' ? 'place' : tool === 'delete' ? 'delete' : tool === 'move' ? 'select & move' : tool === 'rotate' ? 'select & rotate' : tool === 'scale' ? 'select & scale' : tool === 'paint' ? 'paint block' : 'pick color'} • <strong style={{color:'#e2e8f0'}}>R-Click</strong> orbit • <strong style={{color:'#e2e8f0'}}>Mid-Click</strong> pan • <strong style={{color:'#e2e8f0'}}>WASD</strong> move
          </div>
        </div>

        {/* Help Panel — muncul tepat di bawah tombol 'i' (pojok kanan atas) */}
        {showHelp && (
          <div style={{
            position: 'absolute', top: 30, right: 16,
            backgroundColor: 'rgba(14, 20, 32, 0.92)',
            padding: '14px 18px', borderRadius: 12,
            border: `1px solid ${panelBorder}`,
            color: textSecondary, fontSize: 12,
            backdropFilter: 'blur(10px)',
            maxWidth: 300, lineHeight: 1.7,
            zIndex: 5,
          }}>
            <strong style={{ color: '#e2e8f0' }}>Controls</strong><br/>
            <span><strong>L-Click</strong> = {tool === 'place' ? 'Place block' : tool === 'delete' ? 'Delete block' : tool === 'move' ? 'Select & move' : tool === 'rotate' ? 'Select & rotate' : tool === 'scale' ? 'Select & scale' : tool === 'paint' ? 'Paint block' : tool === 'clone' ? 'Clone block (identik)' : tool === 'mirror' ? `Mirror block (axis ${mirrorAxis.toUpperCase()})` : tool === 'object' ? `Place ${selectedObj || 'object'}` : 'Pick color from block'}{symmetryMode ? ' (auto-mirror ON)' : ''}</span><br/>
            <span><strong>R-Click Drag</strong> = Orbit camera</span><br/>
            <span><strong>Mid-Click Drag</strong> = Pan camera</span><br/>
            <span><strong>Scroll</strong> = Zoom in/out</span><br/>
            <span><strong>WASD</strong> = Move camera</span><br/>
            <span><strong>Q/E</strong> = Down / Up</span><br/>
            <span><strong>Shift</strong> = Sprint</span><br/>
            <span style={{ display: 'block', marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
              Move/Rotate/Scale: klik blok → gizmo<br/>
              Shift+Click = add to selection<br/>
              Ctrl+Click = toggle selection<br/>
              Click empty = deselect all<br/>
              <span style={{ color: '#fbbf24' }}>
                <strong>Groups</strong>: select 2+ blocks → Group<br/>
                Klik 1 block di grup = auto-select semua<br/>
                Ungroup untuk bubarin grup
              </span>
            </span>
            <span style={{ display: 'block', marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(148,163,184,0.15)', color: '#06b6d4' }}>
              <strong>Clone</strong> = Duplikat identik di +1 unit X<br/>
              <strong>Mirror</strong> = Duplikat yang di-flip<br/>
              (pilih axis: Mirror X / Y / Z di toolbar)<br/>
              Mirror berguna untuk bikin simetri<br/>
              (separuh → jadi utuh)
            </span>
            <span style={{ display: 'block', marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(148,163,184,0.15)', color: '#ec4899' }}>
              <strong>Symmetry Mode</strong> = TOGGLE MODE<br/>
              (beda dengan Mirror tool yang per-klik)<br/>
              Saat ON, setiap block/shape yang di-place<br/>
              otomatis di-mirror di axis terpilih.<br/>
              Pink plane muncul = cermin virtual.<br/>
              Berguna untuk bikin objek simetris<br/>
              (karakter, jembatan, pesawat, dll)
            </span>
            <span style={{ display: 'block', marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(148,163,184,0.15)', color: '#c084fc' }}>
              <strong>Bloom</strong> = Glow effect pada emissive material<br/>
              (Strength = intensitas, Radius = lebar glow,<br/>
              Threshold = batas kecerahan yang di-glow)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
