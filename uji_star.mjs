// uji_star.mjs — verifikasi geometri NSI Star (bab 218)
import * as THREE from 'three';
import { makeStarGeometry, NSI_STAR_SLUG, NSI_STAR_SIZE, NSI_SLUGS, isNsi, getNsiSize } from './src/utils/blockShapes.js';

let pass = 0, fail = 0;
const cek = (label, ok, detail='') => { if (ok) { pass++; console.log('  ✓', label, detail); } else { fail++; console.log('  ✗', label, detail); } };

console.log('=== REGISTRASI ===');
cek('NSI_SLUGS memuat star', NSI_SLUGS.includes('star'));
cek('isNsi("star") === true', isNsi('star') === true);
const sz = getNsiSize('star');
cek('NSI_SIZES.star = [1.5,0.5,1.5] (TIDURAN)', JSON.stringify(sz) === JSON.stringify([1.5,0.5,1.5]), JSON.stringify(sz));
cek('NSI_STAR_SIZE 3x1x3 studs (x2)', NSI_STAR_SIZE.every((v,i)=>v*2===[3,1,3][i]), 'studs=' + JSON.stringify(NSI_STAR_SIZE.map(v=>v*2)));

console.log('=== GEOMETRI ===');
const g = makeStarGeometry(THREE);
g.computeBoundingBox();
const bb = g.boundingBox;
const sx = bb.max.x-bb.min.x, sy = bb.max.y-bb.min.y, szz = bb.max.z-bb.min.z;
cek('bbox X = 1.500 (±0.0001)', Math.abs(sx-1.5)<1e-4, sx.toFixed(6));
cek('bbox Y = 0.500 (tebal, TIDURAN)', Math.abs(sy-0.5)<1e-4, sy.toFixed(6));
cek('bbox Z = 1.500 (±0.0001)', Math.abs(szz-1.5)<1e-4, szz.toFixed(6));
cek('pusat X ≈ 0', Math.abs((bb.min.x+bb.max.x)/2)<1e-6, ((bb.min.x+bb.max.x)/2).toFixed(8));
cek('pusat Y ≈ 0', Math.abs((bb.min.y+bb.max.y)/2)<1e-6, ((bb.min.y+bb.max.y)/2).toFixed(8));
cek('pusat Z ≈ 0', Math.abs((bb.min.z+bb.max.z)/2)<1e-9, ((bb.min.z+bb.max.z)/2).toFixed(10));
cek('atribut uv ADA', !!g.getAttribute('uv'));
cek('atribut color ADA', !!g.getAttribute('color'));
cek('atribut normal ADA', !!g.getAttribute('normal'));
const p=g.getAttribute('position');
cek('vertex > 0', p.count>0, p.count+' vert');
// winding: voting normal (bab 133) — semua muka menghadap KELUAR dari centroid
g.computeBoundingBox();
const c = new THREE.Vector3((bb.min.x+bb.max.x)/2,(bb.min.y+bb.max.y)/2,(bb.min.z+bb.max.z)/2);
const nrm=g.getAttribute('normal'); let keluar=0, dalam=0;
for (let i=0;i<nrm.count;i++){
  const nx=nrm.getX(i),ny=nrm.getY(i),nz=nrm.getZ(i);
  const dx=p.getX(i)-c.x, dy=p.getY(i)-c.y, dz=p.getZ(i)-c.z;
  const d=nx*dx+ny*dy+nz*dz;
  if (d>0) keluar++; else dalam++;
}
cek('winding: muka menghadap KELUAR', dalam===0, `keluar=${keluar} dalam=${dalam}`);
// uv 0..1
const u=g.getAttribute('uv'); let uvok=true;
for(let i=0;i<u.count;i++){ if(u.getX(i)<-1e-6||u.getX(i)>1+1e-6||u.getY(i)<-1e-6||u.getY(i)>1+1e-6){uvok=false;break;} }
cek('uv dalam 0..1', uvok);
// jumlah pucuk: raycast dari atas pusat — cari puncak tertinggi
let minY=1e9,maxY=-1e9,minZ2=1e9,maxZ2=-1e9;
for(let i=0;i<p.count;i++){ minY=Math.min(minY,p.getY(i)); maxY=Math.max(maxY,p.getY(i)); minZ2=Math.min(minZ2,p.getZ(i)); maxZ2=Math.max(maxZ2,p.getZ(i)); }
console.log(`  (tinggi bintang ${minY.toFixed(4)}..${maxY.toFixed(4)} = ${(maxY-minY).toFixed(4)})`);

console.log('=== GRUP MATERIAL (bab 219 ronde 2) ===');
const grps = g.groups;
cek('2 grup material', grps.length===2, JSON.stringify(grps.map(x=>({start:x.start,count:x.count,mat:x.materialIndex}))));
// verifikasi klasifikasi: hitung muka per grup dgn normal
const pos2=g.getAttribute('position'), nrm2=g.getAttribute('normal');
let bevelTri=0, wallTri=0;
// bab 221: klasifikasi SETELAH rotasi tiduran → sumbu bevel kini Y (bukan Z)
for (const gr of grps) {
  const start=gr.start/3, cnt=gr.count/3;
  for (let t=0;t<cnt;t++){
    const i=(start+t)*3;
    const z=Math.abs(nrm2.getY(i));
    if (z>0.05 && z<0.95) bevelTri++; else wallTri++;
  }
}
cek('grup: dinding 36 (kuning) + bevel 40 (pucat)', wallTri===36 && bevelTri===40, 'wall='+wallTri+' bevel='+bevelTri);
cek('grup bevel TIDAK kosong', grps[1] && grps[1].count>0, grps[1]&&grps[1].count);
console.log('=== HASIL AKHIR:', pass, 'lolos,', fail, 'gagal ===');
process.exit(fail?1:0);

