// start.js — Bootstrap + smart polling (backend-only restart)
// CMD_RUN di Pterodactyl: node start.js
// 
// 100% Node.js — no curl, no wget, no bash needed.
// First run: auto-download full repo ZIP if api/ is missing.
// ============================================================
const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const cp    = require('child_process');

const REPO     = 'johsua092-ui/Babftss';
const BRANCH   = 'main';
const WORK_DIR = '/home/container';
const POLL_MS  = 300000;
const SHA_FILE = '/tmp/babftss_sha';
const BACKEND_RE = /^(api\/|lib\/|server\/|package\.json|package-lock\.json|start\.js)/;

function log(msg) {
  const t = new Date().toLocaleTimeString('en-GB', { hour12: false });
  console.log(`[${t}] ${msg}`);
}

// ── HTTP GET string ─────────────────────────────────────────
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'babftss' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return httpGet(res.headers.location).then(resolve).catch(reject);
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

// ── Download file ───────────────────────────────────────────
function download(url, out) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'babftss' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return download(res.headers.location, out).then(resolve).catch(reject);
      const bufs = [];
      res.on('data', c => bufs.push(c));
      res.on('end', () => { fs.writeFileSync(out, Buffer.concat(bufs)); resolve(); });
    }).on('error', reject);
  });
}

// ── Latest SHA ──────────────────────────────────────────────
async function getLatestSha() {
  try { return JSON.parse(await httpGet(
    `https://api.github.com/repos/${REPO}/commits/${BRANCH}`
  )).sha || ''; } catch { return ''; }
}

// ── Backend changes? ────────────────────────────────────────
async function hasBackendChanges(oldSha, newSha) {
  try {
    const data = JSON.parse(await httpGet(
      `https://api.github.com/repos/${REPO}/compare/${oldSha}...${newSha}`
    ));
    return (data.files || []).some(f => BACKEND_RE.test(f.filename));
  } catch { return true; }
}

// ── Full deploy ─────────────────────────────────────────────
async function deploy() {
  console.log('========================================');
  log(`Deploying ${BRANCH}...`);
  console.log('========================================');

  // 1. Download
  console.log('[1/3] Downloading repo ZIP...');
  const zip = '/tmp/babftss.zip';
  await download(`https://github.com/${REPO}/archive/refs/heads/${BRANCH}.zip`, zip);
  log('✓ Downloaded');

  // 2. Replace source (keep node_modules)
  console.log('[2/3] Replacing source...');
  const tmp = '/tmp/babftss-new';
  cp.execSync(`unzip -oq ${zip} -d ${tmp}`);
  fs.rmSync(zip);

  const entries = fs.readdirSync(tmp);
  const src = path.join(tmp, entries[0]);

  // Preserve node_modules — just delete everything else
  for (const f of fs.readdirSync(WORK_DIR)) {
    if (f === '.' || f === '..' || f === 'node_modules') continue;
    fs.rmSync(path.join(WORK_DIR, f), { recursive: true, force: true });
  }

  // Copy new source files
  for (const f of fs.readdirSync(src)) {
    if (f === 'node_modules') continue;
    fs.cpSync(path.join(src, f), path.join(WORK_DIR, f), { recursive: true });
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  log('✓ Source replaced (node_modules preserved)');

  // 3. Deps
  console.log('[3/3] Dependencies...');
  cp.execSync('npm install --omit=dev --no-audit --no-fund --prefer-offline',
    { cwd: WORK_DIR, stdio: 'inherit' });
  log('✓ Done');
}

// ── Poll loop ───────────────────────────────────────────────
async function poll(proc) {
  while (true) {
    await new Promise(r => setTimeout(r, POLL_MS));
    let ns;
    try { ns = await getLatestSha(); } catch { log('⚠ GitHub down'); continue; }
    if (!ns) { log('⚠ GitHub down'); continue; }
    const os = fs.existsSync(SHA_FILE) ? fs.readFileSync(SHA_FILE, 'utf8').trim() : '';
    if (ns === os) { log(`✓ ${ns.slice(0, 7)}`); continue; }

    log(`🔍 NEW: ${os.slice(0, 7)} → ${ns.slice(0, 7)}`);
    let be;
    try { be = await hasBackendChanges(os, ns); } catch { be = true; }

    if (be) {
      log('🔄 BACKEND — redeploying...');
      proc.kill('SIGTERM');
      await new Promise(r => { proc.on('exit', r); setTimeout(r, 5000); });
      await deploy();
      fs.writeFileSync(SHA_FILE, ns);
      proc = cp.spawn('node', ['server/index.js'], { cwd: WORK_DIR, stdio: 'inherit' });
      log(`✓ Updated → ${ns.slice(0, 7)}`);
    } else {
      log('⏭ Frontend only — skip');
      fs.writeFileSync(SHA_FILE, ns);
    }
    console.log('');
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
(async () => {
  if (!fs.existsSync(path.join(WORK_DIR, 'api'))) {
    log('🔧 First run — downloading full repo...');
    await deploy();
  }
  const sha = await getLatestSha();
  fs.writeFileSync(SHA_FILE, sha);
  log(`✓ Running: ${sha.slice(0, 7)}`);
  log(`✓ Poll every ${POLL_MS / 1000}s (backend only)`);
  console.log('');

  console.log('========================================');
  log('Starting server...');
  console.log('========================================');
  const proc = cp.spawn('node', ['server/index.js'], { cwd: WORK_DIR, stdio: 'inherit' });
  await poll(proc);
})();
