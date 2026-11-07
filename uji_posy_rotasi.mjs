// uji_posy_rotasi.mjs — verifikasi FIX posY NSI ber-rotasi keybind (bab 221)
// Rumus = PERSIS patch di BlockSimulator3D.jsx (world AABB half-extent).
import * as THREE from 'three';
let pass=0, fail=0;
const cek=(l,ok,d='')=>{ if(ok){pass++;console.log('  ✓',l,d);} else {fail++;console.log('  ✗',l,d);} };

function halfWorld(size, eulerDeg, order='YXZ') {
  const hx=size[0]/2, hy=size[1]/2, hz=size[2]/2;
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(
    THREE.MathUtils.degToRad(eulerDeg[0]),
    THREE.MathUtils.degToRad(eulerDeg[1]),
    THREE.MathUtils.degToRad(eulerDeg[2]), order));
  const m=new THREE.Matrix4().makeRotationFromQuaternion(q);
  const e=m.elements;
  return {
    x: Math.abs(e[0])*hx+Math.abs(e[4])*hy+Math.abs(e[8])*hz,
    y: Math.abs(e[1])*hx+Math.abs(e[5])*hy+Math.abs(e[9])*hz,
    z: Math.abs(e[2])*hx+Math.abs(e[6])*hy+Math.abs(e[10])*hz,
  };
}
const STAR=[1.5,0.5,1.5];
console.log('=== STAR tiduran [1.5,0.5,1.5] ===');
let h=halfWorld(STAR,[0,0,0]);
cek('rotasi 0° → posY 0.25 (identik rumus lama)', Math.abs(h.y-0.25)<1e-9, 'posY='+h.y.toFixed(6));
h=halfWorld(STAR,[0,0,90]);   // keybind Y (sumbu Z) 90° → bintang berdiri
cek('rotasi Z 90° → posY 0.75 (TIDAK tenggelam)', Math.abs(h.y-0.75)<1e-9, 'posY='+h.y.toFixed(6));
h=halfWorld(STAR,[90,0,0]);   // keybind R (sumbu X) 90° → berdiri
cek('rotasi X 90° → posY 0.75', Math.abs(h.y-0.75)<1e-9, 'posY='+h.y.toFixed(6));
h=halfWorld(STAR,[0,90,0]);   // keybind T (sumbu Y) 90° → tetap tiduran (putar in-plane)
cek('rotasi Y 90° → posY 0.25 (tetap tiduran)', Math.abs(h.y-0.25)<1e-9, 'posY='+h.y.toFixed(6));
h=halfWorld(STAR,[0,0,180]);
cek('rotasi Z 180° → posY 0.25 (terbalik, tetap tiduran)', Math.abs(h.y-0.25)<1e-9, 'posY='+h.y.toFixed(6));

console.log('=== NOL REGRESI item lain ===');
cek('Truss [1,2,1] rot 0° → posY 1.0 (bab 125)', Math.abs(halfWorld([1,2,1],[0,0,0]).y-1)<1e-9);
cek('Truss [1,2,1] rot X 90° → posY 0.5', Math.abs(halfWorld([1,2,1],[90,0,0]).y-0.5)<1e-9);
// keybind 90° step → kubus axis-aligned → posY 0.5 (identik rumus lama)
cek('Block [1,1,1] 90° step → posY 0.5', (()=>{let ok=true;for(const d of [[0,0,0],[90,0,0],[0,90,0],[0,0,90],[90,90,90],[180,270,90]]){const h2=halfWorld([1,1,1],d);if(Math.abs(h2.y-0.5)>1e-9)ok=false;}return ok;})());
// Rotation input bisa 45° (panel Place Options) → kubus rebah di RUSUKNYA
// (0.707) = fisika benar. Dulu posY 0.5 = tenggelam 0.207 lalu didorong physics.
cek('Block [1,1,1] rot 45° → rebah di rusuk 0.7071', Math.abs(halfWorld([1,1,1],[45,0,0]).y-Math.SQRT1_2)<1e-9, 'posY='+halfWorld([1,1,1],[45,0,0]).y.toFixed(6));
// Match Rotation ON bisa menyalin quat MIRING dari block target (di luar 90°):
// saat itu posY = setengah AABB dunia = fisika benar (kubus rebah di SUDUTnya,
// konsisten dgn hasil setel physics rapier) — BUKAN regresi, perbaikan.
const hArb=halfWorld([1,1,1],[33,71,15]);
cek('Block [1,1,1] quat miring (Match Rotation) → rebah di sudutnya (AABB)', hArb.y>0.5 && hArb.y<=Math.sqrt(3)/2+1e-9, 'posY='+hArb.y.toFixed(4)+' (batas fisik maks '+ (Math.sqrt(3)/2).toFixed(4) +')');
cek('Mast [5,18,5] rot 0° → posY 9.0', Math.abs(halfWorld([5,18,5],[0,0,0]).y-9)<1e-9);
cek('Flag [3.45,10.75,0.5] rot 0° → posY 5.375', Math.abs(halfWorld([3.45,10.75,0.5],[0,0,0]).y-5.375)<1e-9);
cek('Flag rot Z 90° → posY 1.725', Math.abs(halfWorld([3.45,10.75,0.5],[0,0,90]).y-1.725)<1e-9);
console.log('=== HASIL:', pass, 'lolos,', fail, 'gagal ===');
process.exit(fail?1:0);
