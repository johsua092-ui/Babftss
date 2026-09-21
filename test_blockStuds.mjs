/**
 * test_blockStuds.mjs — unit test blockStuds.js (standar studs MUTLAK).
 * Jalankan: node test_blockStuds.mjs — exit 0 = semua GREEN.
 */
import { STUDS_PER_BLOCK, scaleToStuds, scaleToStudsLabel } from './src/utils/blockStuds.js';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? '  PASS  ' : '  FAIL  ') + name + ' → ' + JSON.stringify(got) + (ok ? '' : ' (harus ' + JSON.stringify(want) + ')'));
  ok ? pass++ : fail++;
};

console.log('== konstanta ==');
eq('STUDS_PER_BLOCK = 2 (MUTLAK)', STUDS_PER_BLOCK, 2);

console.log('== block belum di-scale: DEFAULT 2,2,2 ==');
eq('scale 1,1,1 → [2,2,2]', scaleToStuds({ x: 1, y: 1, z: 1 }), [2, 2, 2]);
eq('label default "2, 2, 2"', scaleToStudsLabel({ x: 1, y: 1, z: 1 }), '2, 2, 2');
eq('scale null → default (fallback aman)', scaleToStudsLabel(null), '2, 2, 2');

console.log('== ter-scale ==');
eq('scale 2,2,2 → [4,4,4]', scaleToStuds({ x: 2, y: 2, z: 2 }), [4, 4, 4]);
eq('label 2x = "4, 4, 4"', scaleToStudsLabel({ x: 2, y: 2, z: 2 }), '4, 4, 4');
eq('scale pipih 0.5,1,1 → P=1 studs', scaleToStudsLabel({ x: 0.5, y: 1, z: 1 }), '1, 2, 2');
eq('scale 1.75,1,1 → P=3.5 (1 desimal)', scaleToStudsLabel({ x: 1.75, y: 1, z: 1 }), '3.5, 2, 2');

console.log('== kaca mirror −x: absolut, tetap positif ==');
eq('scale −1,1,1 → [2,2,2] (bukan negatif)', scaleToStuds({ x: -1, y: 1, z: 1 }), [2, 2, 2]);

console.log('== urutan HUD: P(x), L(z), T(y) ==');
eq('P=x L=z T=y (x1,z3,y2 → P2 L6 T4)', scaleToStuds({ x: 1, y: 2, z: 3 }), [2, 6, 4]);

console.log('== clamp 0.05 (MIN_ABS_SCALE app) ==');
eq('0.05 → 0.1 studs', scaleToStudsLabel({ x: 0.05, y: 0.05, z: 0.05 }), '0.1, 0.1, 0.1');

console.log('');
console.log('== presisi MAKS 3 desimal (permintaan user 2026-09-20) ==');
eq('1.4685 → P=2.937 (3 desimal)', scaleToStudsLabel({ x: 1.4685, y: 1, z: 1 }), '2.937, 2, 2');
eq('1.47 → P=2.94 (trailing zero dibuang)', scaleToStudsLabel({ x: 1.47, y: 1, z: 1 }), '2.94, 2, 2');
eq('1.5 → P=3 (bukan 3.000)', scaleToStudsLabel({ x: 1.5, y: 1, z: 1 }), '3, 2, 2');
eq('0.9876 → P=1.975 (3 desimal)', scaleToStudsLabel({ x: 0.9876, y: 1, z: 1 }), '1.975, 2, 2');
eq('1.23456 → P=2.469 (dibulatkan 3 desimal)', scaleToStudsLabel({ x: 1.23456, y: 1, z: 1 }), '2.469, 2, 2');
