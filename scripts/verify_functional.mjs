import fs from 'fs';

const prod = fs.readFileSync('assets_backup/index-BLwO3te5.js', 'utf8');
const newB = fs.readFileSync('assets/index-BdPXyl84.js', 'utf8');

let pass = 0, fail = 0;

function check(label, inProd, inNew) {
  const status = inProd === inNew ? 'PASS' : 'FAIL';
  if (status === 'FAIL') { console.log('  FAIL: ' + label + ' prod=' + inProd + ' new=' + inNew); fail++; }
  else pass++;
  return status === 'PASS';
}

console.log('=== PAGE CONTENT ===');
check('WELCOME text', prod.includes('WELCOME'), newB.includes('WELCOME'));
check('START LEARNING button', prod.includes('START LEARNING'), newB.includes('START LEARNING'));
check('gate-diagram.jpg', prod.includes('gate-diagram.jpg'), newB.includes('gate-diagram.jpg'));

console.log('=== MENU ITEMS ===');
check('Logic Gates menu', prod.includes('Logic Gates'), newB.includes('Logic Gates'));
check('Gears menu', prod.includes('Gears'), newB.includes('Gears'));
check('Linkages Mechanic menu', prod.includes('Linkages Mechanic'), newB.includes('Linkages Mechanic'));
check('Coming Soon menu', prod.includes('Coming Soon'), newB.includes('Coming Soon'));

console.log('=== GATE DATA (8 gates) ===');
const gates = ['Basic Wire', 'NOT Gate', 'AND Gate', 'NAND Gate', 'OR Gate', 'NOR Gate', 'XOR Gate', 'XNOR Gate'];
gates.forEach(g => check(g, prod.includes(g), newB.includes(g)));

console.log('=== GATE DESCRIPTIONS (sample) ===');
check('Wire desc: Sinyal mengalir', prod.includes('Sinyal mengalir langsung melewati kabel'), newB.includes('Sinyal mengalir langsung melewati kabel'));
check('NOT desc: Pembalik sinyal', prod.includes('Pembalik sinyal (Inverter)'), newB.includes('Pembalik sinyal (Inverter)'));
check('AND desc: Output = 1 HANYA jika', prod.includes('Output = 1 HANYA jika A dan B keduanya = 1'), newB.includes('Output = 1 HANYA jika A dan B keduanya = 1'));

console.log('=== GATE COLORS ===');
['#60a5fa', '#f87171', '#4ade80', '#fb923c', '#a78bfa', '#f472b6', '#facc15', '#2dd4bf'].forEach(c =>
  check('Gate color ' + c, prod.includes(c), newB.includes(c)));

console.log('=== GEAR DATA (sample 10/36) ===');
const gearSamples = ['Spur (Basic) Gear', 'Helical Gear', 'Herringbone Gear', 'Worm Gear', 'Rack & Pinion Gear', 'Bevel Gear', 'Planetary Gear', 'Harmonic Drive Gear', 'Magnetic Gear', 'Differential Gear'];
gearSamples.forEach(g => check(g, prod.includes(g), newB.includes(g)));

console.log('=== LINKAGE DATA (sample 10/45) ===');
const linkageSamples = ["Jansen's Linkage", 'Klann Linkage', "Chebyshev's Lambda", 'Peaucellier-Lipkin', "Watt's Linkage", 'Hoekens Linkage', 'Pantograph', 'Sarrus Linkage', 'Four-Bar Linkage', 'Slider-Crank Mechanism'];
linkageSamples.forEach(l => check(l, prod.includes(l), newB.includes(l)));

console.log('=== CIRCUIT CARD 01 ===');
check('NOT → AND Combo', prod.includes('NOT'), newB.includes('NOT'));
check('Circuit page title: LOGIC GATES CIRCUIT', prod.includes('LOGIC GATES CIRCUIT'), newB.includes('LOGIC GATES CIRCUIT'));
check('MUDAH tier badge', prod.includes('MUDAH'), newB.includes('MUDAH'));
check('Circuit desc: Rangkaian ini menggabungkan', prod.includes('Rangkaian ini menggabungkan gerbang NOT dan AND'), newB.includes('Rangkaian ini menggabungkan gerbang NOT dan AND'));
check('A aktif, B tidak aktif', prod.includes('A aktif, B tidak aktif'), newB.includes('A aktif, B tidak aktif'));

console.log('=== INLINE STYLES (critical values) ===');
check('bg #181b24', prod.includes('#181b24'), newB.includes('#181b24'));
check('panel #0e1420', prod.includes('#0e1420'), newB.includes('#0e1420'));
check('Orbitron font', prod.includes('Orbitron'), newB.includes('Orbitron'));
check('Inter font', prod.includes('Inter'), newB.includes('Inter'));
check('Google Fonts import', prod.includes('fonts.googleapis.com'), newB.includes('fonts.googleapis.com'));
check('minHeight 100dvh', prod.includes('100dvh'), newB.includes('100dvh'));
check('AnimatePresence mode=wait', prod.includes('mode'), newB.includes('mode'));

console.log('=== SVG GATE SHAPES ===');
check('NOT triangle polygon', prod.includes('polygon'), newB.includes('polygon'));
check('AND arc path', prod.includes('A ') && prod.includes('Z'), newB.includes('A ') && newB.includes('Z'));
check('OR curve path', prod.includes('C '), newB.includes('C '));

console.log('=== ICONS (lucide) ===');
['Cpu', 'Network', 'FlaskConical', 'Lock', 'ArrowLeft', 'ToggleLeft', 'Lightbulb'].forEach(ic =>
  check('Icon: ' + ic, prod.includes(ic), newB.includes(ic)));

console.log('=== TOAST (sonner) ===');
check('Toaster component', prod.includes('Toaster') || prod.includes('toaster') || prod.includes('sonner'),
  newB.includes('Toaster') || newB.includes('toaster') || newB.includes('sonner'));
check('position top-center', prod.includes('top-center'), newB.includes('top-center'));
check('theme dark', prod.includes('"dark"') || prod.includes("'dark'"), newB.includes('"dark"') || newB.includes("'dark'"));

console.log('=== ANIMATIONS ===');
check('pulse-glow keyframe', prod.includes('pulse-glow'), newB.includes('pulse-glow'));
check('gold-pulse keyframe', prod.includes('gold-pulse'), newB.includes('gold-pulse'));
check('easeOut transition', prod.includes('easeOut'), newB.includes('easeOut'));
check('easeIn transition', prod.includes('easeIn'), newB.includes('easeIn'));

console.log('=== HOW IT WORKS ===');
check('INPUT section', prod.includes('INPUT'), newB.includes('INPUT'));
check('PROCESS section', prod.includes('PROCESS'), newB.includes('PROCESS'));
check('OUTPUT section', prod.includes('OUTPUT'), newB.includes('OUTPUT'));
check('CARA KERJA LOGIC GATES', prod.includes('CARA KERJA LOGIC GATES'), newB.includes('CARA KERJA LOGIC GATES'));

console.log('=== TRUTH TABLE ===');
check('TABEL KEBENARAN', prod.includes('TABEL KEBENARAN'), newB.includes('TABEL KEBENARAN'));
check('borderCollapse collapse', prod.includes('borderCollapse') || prod.includes('border-collapse'), newB.includes('borderCollapse') || newB.includes('border-collapse'));

console.log('\n========================================');
console.log('RESULT: ' + pass + ' PASSED, ' + fail + ' FAILED');
console.log('========================================');
if (fail > 0) process.exit(1);
