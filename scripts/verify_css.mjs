import fs from 'fs';

const prodCSS = fs.readFileSync('assets_backup/index-DhzvnpmG.css', 'utf8');
const newCSS = fs.readFileSync('dist/assets/index-wiCxkdHX.css', 'utf8');

// Extract all CSS class selectors (not pseudo-elements/variants)
function extractSelectors(css) {
  const sel = new Set();
  const re = /\.([a-zA-Z_][\w-]*)/g;
  let m;
  while ((m = re.exec(css)) !== null) sel.add(m[1]);
  return sel;
}

const prodSels = extractSelectors(prodCSS);
const newSels = extractSelectors(newCSS);

// Classes used in our source code
const srcFiles = fs.readdirSync('src', { recursive: true }).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
const usedClasses = new Set();
for (const f of srcFiles) {
  const content = fs.readFileSync('src/' + f, 'utf8');
  const classMatches = content.matchAll(/className="([^"]+)"|className='([^']+)'/g);
  for (const m of classMatches) {
    const cls = (m[1] || m[2]).split(/\s+/);
    cls.forEach(c => usedClasses.add(c));
  }
  // Also check for @keyframes references
  const animMatches = content.matchAll(/animation:\s*([^;"')]+)/g);
  for (const m of animMatches) {
    usedClasses.add(m[1].trim());
  }
}

console.log('=== Classes used in source code ===');
[...usedClasses].forEach(c => console.log('  ' + c));

console.log('\n=== Classes used but MISSING from new CSS ===');
let missing = 0;
for (const c of usedClasses) {
  if (!newCSS.includes(c) && !newCSS.includes(c.replace(/-/g, '\\-'))) {
    console.log('  MISSING: ' + c);
    missing++;
  }
}
if (missing === 0) console.log('  None! All used classes are in new CSS.');

console.log('\n=== Classes used, in new CSS, in prod CSS ===');
for (const c of usedClasses) {
  const inN = newCSS.includes(c);
  const inP = prodCSS.includes(c);
  console.log('  ' + c + ': new=' + (inN?'Y':'N') + ' prod=' + (inP?'Y':'N'));
}

// Check what extra classes prod has that are actually needed
console.log('\n=== Production-only classes that look app-specific ===');
const prodOnly = [...prodSels].filter(c => !newSels.has(c));
const appSpecific = prodOnly.filter(c => 
  ['pulse', 'glow', 'gold', 'linkage', 'animate', 'grid', 'card', 'icon', 'dot', 'id', 'name'].some(k => c.includes(k))
);
appSpecific.forEach(c => console.log('  ' + c));
