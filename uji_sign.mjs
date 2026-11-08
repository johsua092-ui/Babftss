// uji_sign.mjs — verifikasi NSI "Sign" (bab 222)
import * as THREE from 'three';
import { makeSignGeometry, NSI_SIGN_SLUG, NSI_SIGN_SIZE, NSI_SLUGS, isNsi, getNsiSize, NSI_SIGN_BOARD, NSI_SIGN_TEXPLANE } from './src/utils/blockShapes.js';
import { cleanSignText, SIGN_MAX_GRAPHEMES } from './src/utils/signText.js';
let pass=0, fail=0;
const cek=(l,ok,d='')=>{ if(ok){pass++;console.log('  ✓',l,d);} else {fail++;console.log('  ✗',l,d);} };
console.log('=== REGISTRASI ===');
cek('NSI_SLUGS memuat sign', NSI_SLUGS.includes('sign'));
cek('isNsi("sign")', isNsi('sign')===true);
cek('NSI_SIZES.sign = [2.5,2,0.5]', JSON.stringify(getNsiSize('sign'))===JSON.stringify([2.5,2,0.5]), JSON.stringify(getNsiSize('sign')));
cek('ukuran studs 5x4x1', NSI_SIGN_SIZE.every((v,i)=>v*2===[5,4,1][i]), JSON.stringify(NSI_SIGN_SIZE.map(v=>v*2)));
console.log('=== GEOMETRI ===');
const g=makeSignGeometry(THREE); g.computeBoundingBox();
const b=g.boundingBox;
cek('bbox X = 2.5', Math.abs((b.max.x-b.min.x)-2.5)<1e-4, (b.max.x-b.min.x).toFixed(4));
cek('bbox Y = 2.0', Math.abs((b.max.y-b.min.y)-2.0)<1e-4, (b.max.y-b.min.y).toFixed(4));
cek('bbox Z = 0.5', Math.abs((b.max.z-b.min.z)-0.5)<1e-4, (b.max.z-b.min.z).toFixed(4));
cek('pusat origin (X/Y/Z)', Math.abs((b.min.x+b.max.x)/2)<1e-9 && Math.abs((b.min.y+b.max.y)/2)<1e-9 && Math.abs((b.min.z+b.max.z)/2)<1e-9);
cek('atribut uv+color+normal', !!(g.getAttribute('uv')&&g.getAttribute('color')&&g.getAttribute('normal')));
// UJI VALID (bab 133-B): RAYCAST dari luar — muka pertama WAJIB menghadap
// masuk (dot(normal, arahRay) < 0). Voting centroid TIDAK valid utk rakitan
// konkaf (kubus menembus papan → muka internal sah, voting false-positive).
const mesh=new THREE.Mesh(g, new THREE.MeshBasicMaterial());
const rc=new THREE.Raycaster();
let salah=0, total=0;
for(let i=0;i<120;i++){
  const th=(i/120)*Math.PI*2, ph=((i%7)/7)*0.9+0.15;
  const dir=new THREE.Vector3(Math.cos(th)*Math.cos(ph), Math.sin(ph), Math.sin(th)*Math.cos(ph)).normalize();
  rc.set(new THREE.Vector3(0,0,0).addScaledVector(dir,8), dir.clone().negate().normalize());
  rc.set(new THREE.Vector3().addScaledVector(dir,8), dir.clone().negate().normalize());
  const hits=rc.intersectObject(mesh,true);
  if(hits.length){ total++;
    // muka pertama dari LUAR: normal mengarah KE kamera = searah +dir (bukan -dir)
    if(hits[0].face.normal.dot(dir) < -1e-6) salah++;
  }
}
cek('raycast 120 arah: muka pertama menghadap kamera', salah===0, `salah=${salah}/${total}`);
// papan vs kubus: muka papan z=+0.1 block, kubus z=+0.25 → papan menjorok 0.15
cek('kotak pojok menonjol SIMETRIS 0.075 depan-belakang (feedback user)', Math.abs((0.25-NSI_SIGN_BOARD.z1)-(NSI_SIGN_BOARD.z0-(-0.25)))<1e-9 && Math.abs(NSI_SIGN_BOARD.z1-0.175)<1e-9, 'papan z '+NSI_SIGN_BOARD.z0+'..'+NSI_SIGN_BOARD.z1+' | kotak menonjol '+(0.25-NSI_SIGN_BOARD.z1).toFixed(3)+' depan, '+(NSI_SIGN_BOARD.z0-(-0.25)).toFixed(3)+' belakang');
console.log('=== TEKS (cleanSignText) ===');
cek('enter/tab → spasi', cleanSignText("halo\nworld\tx")==='halo world x', JSON.stringify(cleanSignText("halo\nworld\tx")));
cek('trim', cleanSignText('  hi  ')==='hi');
cek('maks 60 grapheme', cleanSignText('a'.repeat(200)).length===60);
cek('emoji ZWJ utuh (👨‍👩‍👧 + ❤️ 1 grapheme)', (()=>{const seg=new Intl.Segmenter('id',{granularity:'grapheme'});const n=[...seg.segment(cleanSignText('👨‍👩‍👧👍❤️'))].length;return n===3;})(), 'grapheme='+(()=>{const seg=new Intl.Segmenter('id',{granularity:'grapheme'});return [...seg.segment(cleanSignText('👨‍👩‍👧👍❤️'))].length;})());
cek('simbol tampil', cleanSignText('★✓⚡')==='★✓⚡');
console.log('=== HASIL:', pass, 'lolos,', fail, 'gagal ===');
process.exit(fail?1:0);
