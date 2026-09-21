/**
 * verify_tdz.mjs — DETEKTOR JEBAKAN TDZ (Temporal Dead Zone) OTOMATIS
 * ============================================================================
 * KENAPA ADA SKRIP INI:
 *   TDZ sudah 3x memakan korban di project ini (bab 50, 53, 54) — gejalanya
 *   SELALU sama: "ReferenceError: X is not defined" / "Cannot access 'X' before
 *   initialization" → HALAMAN BLANK total. Penyebabnya: `useEffect[tool]`
 *   (baris ~293-600) memanggil fungsi yang dideklarasikan JAUH di bawah di dalam
 *   `useEffect(scene)` (baris ~13000+) memakai `const` → belum ter-inisialisasi.
 *
 * CARA PAKAI:
 *   node verify_tdz.mjs
 *   exit 0 = AMAN · exit 1 = ADA TDZ (jangan commit!)
 *
 * CARA KERJA:
 *   1. Temukan rentang `useEffect(() => { ... }, [tool])` (blok ATAS, ~baris 293).
 *   2. Kumpulkan SEMUA identifier `const NAME = ...` yang dideklarasikan di
 *      BARIS SETELAH blok itu (kandidat TDZ).
 *   3. Cari pemakaian identifier itu di DALAM blok atas.
 *   4. Kalau dipakai TANPA lewat `threeRef.current.NAME Fn` → LAPORKAN.
 */
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.resolve('src/pages/BlockSimulator3D.jsx');
const src = fs.readFileSync(FILE, 'utf8');
const lines = src.split(/\r?\n/);

// ── 1. Temukan blok useEffect[tool] ──
// Penanda: `useEffect(() => {` ... `}, [tool]);`
let toolStart = -1, toolEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('}, [tool]);')) { toolEnd = i; break; }
}
if (toolEnd === -1) {
  console.error('TIDAK BISA menemukan akhir useEffect[tool] (`}, [tool]);`)');
  process.exit(2);
}
for (let i = toolEnd; i >= 0; i--) {
  if (lines[i].includes('useEffect(() => {') && i < toolEnd) { toolStart = i; break; }
}
if (toolStart === -1) {
  console.error('TIDAK BISA menemukan awal useEffect[tool]');
  process.exit(2);
}
console.log(`useEffect[tool]  : baris ${toolStart + 1} .. ${toolEnd + 1}`);

// ── 2. Kumpulkan const yang dideklarasikan SETELAH blok (kandidat TDZ) ──
const after = lines.slice(toolEnd + 1).join('\n');
const cands = new Set();
const reDecl = /^\s*const\s+([A-Za-z_$][\w$]*)\s*=/gm;
let m;
while ((m = reDecl.exec(after)) !== null) cands.add(m[1]);
// juga `const X = (...) =>` bentuk lain (tercakup di atas) & `function X(`
const reFn = /^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
while ((m = reFn.exec(after)) !== null) cands.add(m[1]);
console.log(`kandidat fungsi di bawah blok: ${cands.size}`);

// ── 3. Cari pemakaian di dalam blok atas ──
const inside = lines.slice(toolStart, toolEnd + 1);
const findings = [];
inside.forEach((line, idx) => {
  const noComment = line.replace(/\/\/.*$/, '');
  // lewati baris yang sudah lewat threeRef (deferred helper = AMAN)
  for (const name of cands) {
    const reUse = new RegExp(`(?<![\\w$.])${name}\\s*\\(`);
    if (!reUse.test(noComment)) continue;
    // aman kalau dipakai lewat threeRef.current.NAME atau .NAMEFn
    if (new RegExp(`threeRef\\.current\\.${name}Fn`).test(noComment)) continue;
    if (new RegExp(`threeRef\\.current\\.${name}\\b`).test(noComment)) continue;
    if (new RegExp(`\\.${name}\\s*\\(`).test(noComment)) continue; // method call
    findings.push({ line: toolStart + idx + 1, name, text: line.trim().slice(0, 100) });
  }
});

// ── 4. Laporkan ──
console.log('');
if (findings.length === 0) {
  console.log('✅ AMAN — tidak ada TDZ terdeteksi.');
  console.log('   (Semua fungsi dari blok bawah dipanggil lewat threeRef.*Fn.)');
  process.exit(0);
}
console.log(`❌ DITEMUKAN ${findings.length} KANDIDAT TDZ (JANGAN COMMIT!):`);
for (const f of findings) {
  console.log(`   baris ${f.line}: ${f.name}()  →  ${f.text}`);
}
console.log('');
console.log('SOLUSI: panggil lewat helper deferred `threeRef.current.<nama>Fn`');
console.log('        (didaftarkan SETELAH fungsi itu selesai dideklarasikan).');
process.exit(1);
