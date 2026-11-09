// uji_bread.mjs — verifikasi geometri NSI Bread (bab 225 ronde 4)
// Fokus koreksi user: KEDUA ujung terbelah + irisan punya KEDALAMAN.
import * as THREE from 'three';
import { makeBreadGeometry, NSI_BREAD_SLUG, NSI_BREAD_SIZE, NSI_SLUGS, isNsi, getNsiSize } from './src/utils/blockShapes.js';

let pass = 0, fail = 0;
const cek = (label, ok, detail='') => { if (ok) { pass++; console.log('  ✓', label, detail); } else { fail++; console.log('  ✗', label, detail); } };

console.log('=== REGISTRASI ===');
cek('NSI_SLUGS memuat bread', NSI_SLUGS.includes('bread'));
cek('isNsi("bread") === true', isNsi('bread') === true);
const sz = getNsiSize('bread');
cek('NSI_SIZES.bread = [1,1,1.5] (2x2x3 studs)', JSON.stringify(sz) === JSON.stringify([1,1,1.5]), JSON.stringify(sz));

console.log('=== GEOMETRI (dual-slice v4) ===');
const g = makeBreadGeometry(THREE);
g.computeBoundingBox();
const bb = g.boundingBox;
const sx = bb.max.x-bb.min.x, sy = bb.max.y-bb.min.y, szz = bb.max.z-bb.min.z;
cek('bbox X = 1.000 (±0.002)', Math.abs(sx-1)<2e-3, sx.toFixed(6));
cek('bbox Y = 1.000 (±0.002)', Math.abs(sy-1)<2e-3, sy.toFixed(6));
cek('bbox Z = 1.500 (±0.002)', Math.abs(szz-1.5)<2e-3, szz.toFixed(6));
cek('pusat X ≈ 0', Math.abs((bb.min.x+bb.max.x)/2)<2e-3, ((bb.min.x+bb.max.x)/2).toFixed(6));
cek('pusat Z ≈ 0', Math.abs((bb.min.z+bb.max.z)/2)<2e-3, ((bb.min.z+bb.max.z)/2).toFixed(6));
cek('dasar datar y = -0.500', Math.abs(bb.min.y+0.5)<2e-3, bb.min.y.toFixed(6));
cek('puncak y = +0.500', Math.abs(bb.max.y-0.5)<2e-3, bb.max.y.toFixed(6));

const p = g.getAttribute('position');
const uv = g.getAttribute('uv');
const nrm = g.getAttribute('normal');
const col = g.getAttribute('color');
cek('atribut position ADA', !!p, p.count+' vert');
cek('atribut uv ADA', !!uv);
cek('atribut normal ADA', !!nrm);
cek('atribut color ADA', !!col);

const L = g.userData.breadLayout;
cek('layout terekspose', !!L, L? JSON.stringify({P:L.P, wallRings:L.wallRings}) : '-');
const P = L.P;

console.log('=== KEDUA UJUNG TERBELAH (koreksi user) ===');
const grps = g.groups;
const gCream = grps.find(x => x.materialIndex === 0);
const gCrust = grps.find(x => x.materialIndex === 1);
cek('2 grup material (0=krem, 1=crust)', grps.length===2 && !!gCream && !!gCrust,
    JSON.stringify(grps.map(x=>({start:x.start,count:x.count,mat:x.materialIndex}))));
cek('grup crust mulai dari 0', !!gCrust && gCrust.start===0);
cek('grup krem berisi DUA pelat', !!gCream && L.backCapCount>0 && L.frontCapCount>0 && gCream.count === L.backCapCount + L.frontCapCount,
    gCream? `count=${gCream.count} (belakang ${L.backCapCount} + depan ${L.frontCapCount})` : '-');
cek('pelat belakang & depan sama besar (simetri)', L.backCapCount === L.frontCapCount,
    `belakang=${L.backCapCount} depan=${L.frontCapCount}`);

// pelat belakang: vertex z = -ZC, pelat depan z = +ZC
let backZmin=9, backZmax=-9, frontZmin=9, frontZmax=-9;
for (let i=L.backCapBase;i<L.backCapBase+P;i++) { const z=p.getZ(i); backZmin=Math.min(backZmin,z); backZmax=Math.max(backZmax,z); }
for (let i=L.frontCapBase;i<L.frontCapBase+P;i++) { const z=p.getZ(i); frontZmin=Math.min(frontZmin,z); frontZmax=Math.max(frontZmax,z); }
cek('pelat belakang di z = -0.70', Math.abs(backZmin+0.70)<1e-6 && Math.abs(backZmax+0.70)<1e-6, `${backZmin.toFixed(4)}..${backZmax.toFixed(4)}`);
cek('pelat depan di z = +0.70', Math.abs(frontZmin-0.70)<1e-6 && Math.abs(frontZmax-0.70)<1e-6, `${frontZmin.toFixed(4)}..${frontZmax.toFixed(4)}`);

console.log('=== KEDALAMAN IRISAN (koreksi user) ===');
const depBelakang = Math.abs(bb.min.z - backZmin);
const depDepan = Math.abs(bb.max.z - frontZmin);
cek('kedalaman irisan belakang = 0.050 block (0.10 stud)', Math.abs(depBelakang-0.05)<1e-6, depBelakang.toFixed(4)+' block');
cek('kedalaman irisan depan = 0.050 block (0.10 stud)', Math.abs(depDepan-0.05)<1e-6, depDepan.toFixed(4)+' block');
cek('kedalaman simetris kiri=kanan', Math.abs(depBelakang-depDepan)<1e-9, `${depBelakang.toFixed(6)} vs ${depDepan.toFixed(6)}`);

console.log('=== RING CRUST (Claude: 0.06-0.10 block) ===');
const ringAt = (s) => (1 - s) * 0.5;   // tebal ring di titik terlebar (x=±0.5)
cek('tebal ring di sisi terlebar = 0.080 block', Math.abs(ringAt(L.INSET)-0.08)<1e-9, ringAt(L.INSET).toFixed(4)+' block');
cek('INSET dalam rentang wajar (0.80-0.88)', L.INSET>0.80 && L.INSET<0.88, L.INSET.toFixed(2));

console.log('=== NORMAL / WINDING ===');
// voting: normal segitiga harus menghadap KELUAR dari pusat (0, yMid, zMid)
const idx = g.getIndex();
let salah = 0, cekN = 0;
const yMid = 0.0, zMid = 0.0;
for (let t=0; t<idx.count; t+=3) {
  const ia=idx.getX(t), ib=idx.getX(t+1), ic=idx.getX(t+2);
  const ax=p.getX(ia), ay=p.getY(ia), az=p.getZ(ia);
  const bx=p.getX(ib), by=p.getY(ib), bz=p.getZ(ib);
  const cx=p.getX(ic), cy=p.getY(ic), cz=p.getZ(ic);
  const ux=bx-ax, uy=by-ay, uz=bz-az;
  const vx=cx-ax, vy=cy-ay, vz=cz-az;
  const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
  const len=Math.hypot(nx,ny,nz);
  if (len < 1e-12) { salah++; continue; }   // degenerate = salah
  const gx=(ax+bx+cx)/3, gy=(ay+by+cy)/3, gz=(az+bz+cz)/3;
  // arah keluar: dari sumbu loaf (0,0,z) ke centroid; komponen z juga harus menjauhi 0
  const ox=gx, oy=gy-yMid, oz=gz-zMid;
  const dot=(nx*ox+ny*oy+nz*oz)/len;
  cekN++;
  if (dot <= 1e-9) salah++;
}
cek('semua segitiga menghadap KELUAR (voting)', salah===0, `${salah} salah dari ${cekN}`);

// pelat harus menghadap sumbu Z masing-masing
let backOK=0, frontOK=0;
for (let i=L.backCapBase;i<L.backCapBase+P;i++) if (nrm.getZ(i) < -0.99) backOK++;
for (let i=L.frontCapBase;i<L.frontCapBase+P;i++) if (nrm.getZ(i) > 0.99) frontOK++;
cek('normal pelat belakang = -Z', backOK===P, `${backOK}/${P}`);
cek('normal pelat depan = +Z', frontOK===P, `${frontOK}/${P}`);

console.log('=== UV ===');
let uvOK = true;
for (let i=L.backCapBase;i<L.backCapBase+P;i++) { const u=uv.getX(i), v=uv.getY(i); if(u<-1e-6||u>1+1e-6||v<-1e-6||v>1+1e-6) uvOK=false; }
for (let i=L.frontCapBase;i<L.frontCapBase+P;i++) { const u=uv.getX(i), v=uv.getY(i); if(u<-1e-6||u>1+1e-6||v<-1e-6||v>1+1e-6) uvOK=false; }
cek('UV kedua pelat krem 0..1', uvOK);
let uJump = 0;
const wallV = L.wallRings * P;
for (let i=1;i<wallV;i++) {
  const d = uv.getX(i)-uv.getX(i-1);
  if ((i % P) === 0) { if (!(d < -6)) uJump++; }
  else if (d < -0.5) uJump++;
}
cek('UV dinding: tanpa seam mundur DI TENGAH kontur', uJump===0, 'seam='+uJump+' (dinding '+wallV+' vert)');

console.log('=== PROFIL ===');
let maxY=-9, valley=9, valleyX=0, minY=9;
for (let j=0;j<P;j++){
  const x=p.getX(j), y=p.getY(j);
  if (y>maxY) maxY=y;
  if (y<minY) minY=y;
  if (x>-0.06&&x<0.06&&y>0&&y<valley) { valley=y; valleyX=x; }
}
cek('puncak kubah y ≈ 0.50', Math.abs(maxY-0.5)<0.01, maxY.toFixed(4));
cek('lembah tengah y ≈ 0.42 (dangkal 16%)', Math.abs(valley-0.42)<0.02, valley.toFixed(4)+' @x='+valleyX.toFixed(3));
cek('dasar profil y = -0.50', Math.abs(minY+0.5)<1e-9, minY.toFixed(4));

console.log('=== COLOR ===');
let cmin=9, cmax=-9;
for (let i=0;i<col.count;i++){ const k=col.getX(i); cmin=Math.min(cmin,k); cmax=Math.max(cmax,k); }
cek('color gradasi 0.85..1.10', cmin>=0.84 && cmin<=0.86 && cmax>=1.09 && cmax<=1.11, cmin.toFixed(2)+'..'+cmax.toFixed(2));

console.log('=== HASIL AKHIR:', pass, 'lolos,', fail, 'gagal ===');
process.exit(fail?1:0);
