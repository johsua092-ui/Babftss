// ============================================================
// PROBE 2 BUG TIER-HARD — model jalur app, bisa toggle LAMA vs BARU.
// Helper mode diambil dari MODUL ASLI (resolveScaleModeAtDrag) supaya
// RED/GREEN benar-benar mencerminkan kode produk, bukan model karangan.
// ============================================================
// jalankan dari root repo: node test_scaleModesWiring.mjs
const PROJ = new URL('./', import.meta.url).href;
const THREE = await import(PROJ + 'node_modules/three/build/three.module.js');
const SM = await import(PROJ + 'src/utils/scaleModes.js');

let pass = 0, fail = 0;
const check = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); c ? pass++ : fail++; };
const mk = () => { const m = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial()); m.scale.set(1,1,1); m.position.set(0,0,0); return m; };

const OLD_APP = process.env.OLD_APP === '1';

function appDrag({ modeAtSnapshot, modeDuringApply, snapStep, dragVals = [1.2,1.7,2.0,2.7,3.0] }) {
  const obj = mk();
  // ── dragging-changed START ──
  // LAMA : snapshot HANYA kalau mode !== '2side' (2side di-skip)
  // BARU : SELALU snapshot + mode DI-FREEZE di dalamnya
  let sd = null;
  if (OLD_APP) {
    if (modeAtSnapshot !== '2side') {
      sd = { axisKey:'x', sign:1, frameQuat:null, startScale:{x:1,y:1,z:1}, startPos:{x:0,y:0,z:0}, snapStudStep: snapStep };
    }
  } else {
    // BARU: SELALU snapshot (tanpa field `mode` — mode dibaca LIVE dari ref)
    sd = { axisKey:'x', sign:1, frameQuat:null,
           startScale:{x:1,y:1,z:1}, startPos:{x:0,y:0,z:0}, snapStudStep: snapStep };
  }

  const changed = new Set(); const trace = [];
  for (const dv of dragVals) {
    const before = { x:obj.scale.x, y:obj.scale.y, z:obj.scale.z };
    if (sd) {
      obj.scale.x = 1 * dv;
      const ratio = obj.scale.x / sd.startScale.x;
      // BARU: mode dibaca LIVE dari ref (= modeDuringApply); LAMA: sama
      const effMode = modeDuringApply;
      SM.applyScaleByMode(THREE, obj, effMode, sd.axisKey, sd.sign, sd.startScale, sd.startPos, ratio, 0.05, sd.frameQuat, sd.snapStudStep);
    } else {
      obj.scale.x = 1 * dv;   // jalur legacy 2side (tanpa snap, tanpa mode)
    }
    for (const a of ['x','y','z']) if (Math.abs(obj.scale[a]-before[a])>1e-9) changed.add(a);
    trace.push(+obj.scale.x.toFixed(4));
  }
  return { obj, changed:[...changed].sort(), trace, hadSnapshot: !!sd };
}

console.log(OLD_APP ? '════════ JALUR LAMA (RED) ════════' : '════════ JALUR BARU (GREEN) ════════');

console.log('── Bug A: 2side + scale number 3 → snap HARUS aktif ──');
{
  const { trace, hadSnapshot } = appDrag({ modeAtSnapshot:'2side', modeDuringApply:'2side', snapStep:3 });
  console.log('   snapshot?', hadSnapshot, '| nilai scale:', trace.join(', '));
  // CATATAN ALAT UKUR: snap di project ini RELATIF ke scale awal (Phase 75),
  // BUKAN absolut kelipatan step. start=1, step=3 studs → stepScale=1.5 →
  // nilai sah: 1, 2.5, 4, ... (yaitu (v - start) % stepScale == 0).
  const START = 1, STEP = 1.5;
  const snapped = trace.every(v => Math.abs(((v - START) % STEP + STEP) % STEP) < 1e-9);
  const bedaDariStart = trace.some(v => Math.abs(v - START) > 1e-9);
  check(snapped, `2side+snap3 → semua nilai = start + n*1.5 (dapat: ${trace.join(', ')})`);
  check(bedaDariStart, `2side+snap3 → snap BENAR-BENAR aktif (nilai berubah per step, bukan bebas)`);
}

console.log('── Bug B: ref BASI (2side) tapi mode 6side → HARUS 3 sumbu ──');
{
  const { changed, hadSnapshot } = appDrag({ modeAtSnapshot:'2side', modeDuringApply:'6side', snapStep:2 });
  console.log('   snapshot?', hadSnapshot, '| sumbu:', changed.join(',') || '(tidak ada)');
  check(changed.join(',') === 'x,y,z', `drag pertama 6side (3 sumbu) — dapat: ${changed.join(',') || 'x saja'}`);
}

console.log('── Bug B varian 4side ──');
{
  const { changed } = appDrag({ modeAtSnapshot:'2side', modeDuringApply:'4side', snapStep:2 });
  check(changed.join(',') === 'y,z', `drag pertama 4side (y,z) — dapat: ${changed.join(',')}`);
}

console.log('── Regresi: mode murni tetap benar ──');
{
  const a = appDrag({ modeAtSnapshot:'1side', modeDuringApply:'1side', snapStep:2 });
  check(a.changed.join(',') === 'x', `1side: hanya x (dapat: ${a.changed.join(',')})`);
  const b = appDrag({ modeAtSnapshot:'4side', modeDuringApply:'4side', snapStep:2 });
  check(b.changed.join(',') === 'y,z', `4side: y,z (dapat: ${b.changed.join(',')})`);
  const c = appDrag({ modeAtSnapshot:'6side', modeDuringApply:'6side', snapStep:2 });
  check(c.changed.join(',') === 'x,y,z', `6side: x,y,z (dapat: ${c.changed.join(',')})`);
  const d = appDrag({ modeAtSnapshot:'2side', modeDuringApply:'2side', snapStep:null });
  check(d.changed.join(',') === 'x', `2side tanpa snap: hanya x (dapat: ${d.changed.join(',')})`);
}

console.log('');
console.log(`RESULT ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
