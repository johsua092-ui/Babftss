"""
grab_bread_icon.py — render IKON Bread ronde 4 dari GEOMETRI+MATERIAL ASLI.
Kedua ujung terbelah + kedalaman irisan (bab 225 ronde 4).
"""
import time, base64, os, urllib.request, json, sys
from cdp import Tab
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
REPO = r"C:\Users\user\Babft Project\Babftss-main"
DST = os.path.join(REPO, "public", "blocks", "icon")
URL = "http://127.0.0.1:5173/iconbread.html"

HTML = r"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>ICON BREAD</title>
<style>html,body{margin:0;background:transparent}canvas{display:block}</style></head>
<body>
<script type="module">
import * as THREE from '/node_modules/three/build/three.module.js';
import { makeBreadGeometry, getNsiSize, NSI_BREAD_SLUG } from '/src/utils/blockShapes.js';
import { makeBlockMaterial } from '/src/utils/blockMaterials.js';

const SZ = 256;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(SZ, SZ);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const geo = makeBreadGeometry(THREE);
const mats = makeBlockMaterial(THREE, 'bread');   // array [face, side]
const mesh = new THREE.Mesh(geo, mats);
scene.add(mesh);

scene.add(new THREE.AmbientLight(0xffffff, 1.6));
const d1 = new THREE.DirectionalLight(0xffffff, 2.0); d1.position.set(3, 5, 4); scene.add(d1);
const d2 = new THREE.DirectionalLight(0xffffff, 1.0); d2.position.set(-4, 2, -3); scene.add(d2);

const sz = getNsiSize(NSI_BREAD_SLUG);            // [1,1,1.5]
const tinggi = Math.max(sz[0], sz[1], sz[2]);     // 1.5
const fill = 0.70, fov = 30;
const dist = (tinggi / 2) / Math.tan((fov * Math.PI / 180) / 2) / fill;

const cam = new THREE.PerspectiveCamera(fov, 1, 0.01, 100);
// sudut 3/4 sedikit di atas-depan-kanan → dua ujung terbelah terlihat
cam.position.set(dist * 0.55, dist * 0.35, dist * 0.78);
cam.lookAt(0.15, 0.05, 0);

const tex = null;  // bahan dimuat lewat makeBreadMaterials (getBlockTexture)
// render langsung tanpa rAF (tab hidden = 0 frame, bab 134/131)
let done = false;
const go = () => { if (done) return; done = true; renderer.render(scene, cam); window.__ICON_DATA = renderer.domElement.toDataURL('image/png'); window.__ICON_READY = true; };
function attempt(n) {
  renderer.render(scene, cam);
  const m = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  const ready = m && (m.map === null || (m.map && m.map.image && m.map.image.width > 0));
  if (ready || n >= 15) { go(); return; }
  setTimeout(() => attempt(n + 1), 400);
}
attempt(0);
</script></body></html>
"""
open(os.path.join(REPO, "iconbread.html"), "w", encoding="utf-8").write(HTML)
print("halaman ikon bread dibuat")

t = Tab(URL, allow_any=True)
t.send("Page.navigate", url=URL)
time.sleep(6)
ok = False
for _ in range(60):
    try:
        if t.eval("(function(){return !!window.__ICON_READY})()"):
            ok = True; break
    except Exception:
        pass
    time.sleep(1)
print("ready:", ok)
if not ok:
    t.send("Page.reload"); time.sleep(8)
    for _ in range(40):
        try:
            if t.eval("(function(){return !!window.__ICON_READY})()"):
                ok = True; break
        except Exception:
            pass
        time.sleep(1)
    print("ready (retry):", ok)
if ok:
    d = t.eval("window.__ICON_DATA")
    if d and "," in d:
        raw = base64.b64decode(d.split(",", 1)[1])
        open(os.path.join(DST, "bread.png"), "wb").write(raw)
        print("bread.png", len(raw), "bytes")
    else:
        print("DATA kosong")
else:
    print("GAGAL: halaman ikon tidak siap")
