import fs from 'fs';

const prod = fs.readFileSync('assets_backup/index-BLwO3te5.js', 'utf8');
const newB = fs.readFileSync('dist/assets/index-BaUV8p9O.js', 'utf8');

// Extract all string literals
function extractStrings(code) {
  const strings = new Set();
  // Match double-quoted strings (escaped)
  const re = /"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    if (m[1].length >= 4) strings.add(m[1]);
  }
  return strings;
}

const prodStrings = extractStrings(prod);
const newStrings = extractStrings(newB);

const onlyProd = [...prodStrings].filter(s => !newStrings.has(s) && s.length > 8);
const onlyNew = [...newStrings].filter(s => !prodStrings.has(s) && s.length > 8);

console.log('=== Strings only in PRODUCTION (' + onlyProd.length + ') ===');
onlyProd.slice(0, 80).forEach(s => console.log(' ', JSON.stringify(s).substring(0, 140)));
if (onlyProd.length > 80) console.log('  ... and ' + (onlyProd.length - 80) + ' more');

console.log('\n=== Strings only in NEW BUILD (' + onlyNew.length + ') ===');
onlyNew.slice(0, 30).forEach(s => console.log(' ', JSON.stringify(s).substring(0, 140)));

// Check for specific patterns
console.log('\n=== Pattern checks ===');
const patterns = [
  'data-sonner-toaster',
  'sonner-loading',
  'sonner-spinner',
  'React',
  'createElement',
  'framer-motion',
  'AnimatePresence',
  'motion',
  'lucide-react',
  'Toaster',
  'useState',
  'useEffect',
  'useRef',
  'useCallback',
  'createRoot',
  'flushSync',
  'forwardRef',
  'useId',
  'useLayoutEffect',
  'startTransition',
  'useDeferredValue',
];
patterns.forEach(p => {
  const inP = prod.includes(p);
  const inN = newB.includes(p);
  const status = inP && inN ? 'ok' : inP ? 'PROD-ONLY' : inN ? 'NEW-ONLY' : 'NONE';
  if (status !== 'ok') console.log('  ' + p + ': ' + status);
});
console.log('  (rest: ok in both)');
