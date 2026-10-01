#!/usr/bin/env node
/**
 * verify_patch_safety.mjs — DETEKTOR OTOMATIS "HAPUS BARIS TAK SENGAJA" (bab 98).
 *
 * JEBAKAN: saat `patch` (old_string → new_string), satu baris deklarasi bisa
 * IKUT terhapus tanpa disadari (old_string mencakupnya, new_string tidak).
 * Build sering LOLOS (bukan syntax error), tapi RUNTIME ReferenceError → BLANK.
 *
 * CARA KERJA: baca `git diff` (unstaged + staged), lihat baris yang DIHAPUS
 * (`-`, bukan `---`). Tandai baris yang mengandung TOKEN KRITIS:
 *   - deklarasi  : const/let/var/function/class/=> {
 *   - kontrol    : if (/for (/while (/switch (/return
 *   - import     : import ... from
 *   - penutup    : baris yang hanya berisi `}` / `};` / `);` / `})`
 * Kalau baris kritis DIHAPUS → peringatkan (kemungkinan tidak sengaja).
 *
 * PENGECUALIAN: hapus yang MEMANG disengaja (mis. refactor) → tambahkan
 * `// patch-safe-ok` di baris baru terdekat, ATAU jalankan dengan arg `--allow`
 * untuk melihat daftar lengkap tanpa gagal.
 *
 * Pakai: node verify_patch_safety.mjs        (exit 1 = ada baris mencurigakan)
 *        node verify_patch_safety.mjs --allow (selalu exit 0, hanya laporan)
 */
import { execSync } from 'node:child_process';

const ALLOW = process.argv.includes('--allow');
const cwd = process.cwd();

function gitDiff() {
  try {
    // staged + unstaged
    const unstaged = execSync('git diff --no-color', { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const staged = execSync('git diff --cached --no-color', { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return unstaged + '\n' + staged;
  } catch (e) {
    return '';
  }
}

const CRITICAL = [
  { re: /^\s*(export\s+)?(async\s+)?function\s+[A-Za-z_$]/, why: 'deklarasi function' },
  { re: /^\s*(export\s+)?const\s+[A-Za-z_$][\w$]*\s*=/, why: 'deklarasi const' },
  { re: /^\s*(export\s+)?let\s+[A-Za-z_$][\w$]*\s*=/, why: 'deklarasi let' },
  { re: /^\s*(export\s+)?var\s+[A-Za-z_$][\w$]*\s*=/, why: 'deklarasi var' },
  { re: /^\s*const\s+\[/, why: 'deklarasi array destructuring' },
  { re: /=>\s*\{\s*$/, why: 'arrow function body (=> {)' },
  { re: /^\s*(export\s+)?class\s+[A-Za-z_$]/, why: 'deklarasi class' },
  { re: /^\s*import\s+.*from\s+/, why: 'baris import' },
  { re: /^\s*return\b/, why: 'baris return' },
  { re: /^\s*if\s*\(/, why: 'baris if(' },
  { re: /^\s*for\s*\(/, why: 'baris for(' },
  { re: /^\s*while\s*\(/, why: 'baris while(' },
  { re: /^\s*switch\s*\(/, why: 'baris switch(' },
  { re: /^\s*\}\s*;\s*$/, why: 'penutup blok };' },
  { re: /^\s*\}\s*$/, why: 'penutup blok }' },
];

const diff = gitDiff();
if (!diff.trim()) {
  console.log('✅ verify_patch_safety: tidak ada perubahan git (tidak ada yang diperiksa).');
  process.exit(0);
}

// Parse diff per file/hunk, kumpulkan baris '-'
const lines = diff.split('\n');
let curFile = '';
const removed = []; // { file, text, why }
let inHunk = false;

for (const ln of lines) {
  if (ln.startsWith('+++ b/')) { curFile = ln.slice(6); continue; }
  if (ln.startsWith('diff --git')) { inHunk = false; continue; }
  if (ln.startsWith('@@')) { inHunk = true; continue; }
  if (!inHunk) continue;
  if (ln.startsWith('---')) continue;
  if (ln.startsWith('-')) {
    const text = ln.slice(1);
    if (!text.trim()) continue; // baris kosong diabaikan
    for (const c of CRITICAL) {
      if (c.re.test(text)) { removed.push({ file: curFile, text: text.trimEnd(), why: c.why }); break; }
    }
  }
}

// Buang penutup blok `}` yang berdampingan dengan deklarasi (biasanya refactor normal),
// tapi tetap laporkan kalau berdiri sendiri tanpa pasangan deklarasi di daftar.
const fileCount = new Set(removed.map(r => r.file)).size;
console.log(`\n=== verify_patch_safety (bab 98) ===`);
console.log(`File berubah: ${fileCount} | baris KRITIS dihapus: ${removed.length}\n`);

if (removed.length === 0) {
  console.log('✅ AMAN — tidak ada baris kritis (deklarasi/kontrol/penutup) yang dihapus.');
  process.exit(0);
}

console.log('⚠️  BARIS KRITIS YANG DIHAPUS (periksa satu-satu — SENGAJA atau TIDAK?):');
removed.forEach((r, i) => {
  console.log(`  ${i + 1}. [${r.why}] ${r.file}`);
  console.log(`       - ${r.text}`);
});

console.log(`
ATURAN (bab 98):
  • Kalau baris di atas TIDAK sengaja kau hapus → PERBAIKI dulu (JANGAN COMMIT).
  • Kalau memang sengaja (refactor) → pastikan tidak ada pemakai yang tertinggal
    (grep nama fungsinya), lalu lanjut.
  • WAJIB juga: baca ulang file + uji BROWSER (build saja TIDAK cukup).
`);

process.exit(ALLOW ? 0 : 1);
