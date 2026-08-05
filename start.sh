#!/bin/bash
# start.sh — Bootstrap + smart polling (backend-only restart)
# CMD_RUN di Pterodactyl: bash start.sh
#
# Download pakai Node.js (no curl/wget needed — container pasti ada node)
# Kalo api/ belum ada → download ZIP + ekstrak otomatis
# ================================================================
set -e

REPO="johsua092-ui/Babftss"
BRANCH="main"
COMMITS_URL="https://api.github.com/repos/${REPO}/commits/${BRANCH}"
WORK_DIR="/home/container"
POLL_INTERVAL=300
SHA_FILE="/tmp/babftss_sha"

log() { echo "[$(date +%H:%M:%S)] $*"; }

# ── Download file pakai Node.js (no curl/wget) ───────────────
node_download() {
  local URL="$1" OUT="$2"
  node -e "
    const u='${URL}';
    const o='${OUT}';
    const m=u.startsWith('https')?require('https'):require('http');
    m.get(u,{headers:{'User-Agent':'babftss'}},r=>{
      if(r.statusCode>=300&&r.statusCode<400){m.get(r.headers.location,{headers:{'User-Agent':'babftss'}},r2=>{
        const d=[];r2.on('data',c=>d.push(c));
        r2.on('end',()=>require('fs').writeFileSync(o,Buffer.concat(d)))
      })}else{
        const d=[];r.on('data',c=>d.push(c));
        r.on('end',()=>require('fs').writeFileSync(o,Buffer.concat(d)))
      }
    }).on('error',()=>process.exit(1))
  "
}

# ── HTTP GET as string ───────────────────────────────────────
node_get() {
  local URL="$1"
  node -e "
    const u='${URL}';
    require('https').get(u,{headers:{'User-Agent':'babftss'}},r=>{
      let d='';
      r.on('data',c=>d+=c);
      r.on('end',()=>{try{console.log(JSON.parse(d).sha||'')}catch(e){console.log(d)}})
    }).on('error',()=>process.exit(1))
  "
}

# ── Latest commit SHA ────────────────────────────────────────
get_latest_sha() {
  node_get "${COMMITS_URL}" | tr -d '\n\r'
}

# ── Cek apakah diff ada backend files ────────────────────────
check_backend() {
  local OLD="$1" NEW="$2"
  node -e "
    const u='https://api.github.com/repos/${REPO}/compare/${OLD}...${NEW}';
    require('https').get(u,{headers:{'User-Agent':'babftss'}},r=>{
      let d='';
      r.on('data',c=>d+=c);
      r.on('end',()=>{
        try{
          const files=JSON.parse(d).files||[];
          const re=/^(api\/|lib\/|server\/|package\.json|package-lock\.json|start\.sh)/;
          console.log(files.some(f=>re.test(f.filename))?'yes':'no')
        }catch(e){console.log('yes')}
      })
    }).on('error',()=>process.exit(1))
  "
}

# ── Deploy full ──────────────────────────────────────────────
deploy() {
  echo "========================================"
  log "Deploying ${BRANCH}..."
  echo "========================================"

  echo "[1/3] Downloading repo ZIP..."
  node_download "https://github.com/${REPO}/archive/refs/heads/${BRANCH}.zip" "/tmp/babftss.zip"
  log "✓ Downloaded"

  echo "[2/3] Extracting..."
  cd "${WORK_DIR}"
  [ -d node_modules ] && mv node_modules /tmp/node_modules_bak 2>/dev/null || true
  rm -rf /tmp/babftss-new 2>/dev/null || true
  mkdir -p /tmp/babftss-new
  unzip -oq /tmp/babftss.zip -d /tmp/babftss-new
  rm -f /tmp/babftss.zip

  SRC=$(ls -d /tmp/babftss-new/*/ 2>/dev/null | head -1)
  shopt -s dotglob
  cp -r "${SRC}"* "${WORK_DIR}/" 2>/dev/null || true
  shopt -u dotglob
  rm -rf /tmp/babftss-new
  log "✓ Source replaced"

  echo "[3/3] Dependencies..."
  [ -d /tmp/node_modules_bak ] && mv /tmp/node_modules_bak node_modules 2>/dev/null && log "✓ Cache restored"
  cd "${WORK_DIR}"
  npm install --omit=dev --no-audit --no-fund --prefer-offline 2>&1 | tail -1
  rm -rf /tmp/node_modules_bak 2>/dev/null || true
  log "✓ Done"
}

# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════

# First time? Download semua
if [ ! -d "${WORK_DIR}/api" ]; then
  log "🔧 First run — downloading full repo..."
  deploy
fi

SHA=$(get_latest_sha)
echo "${SHA}" > "${SHA_FILE}"
log "✓ Running: ${SHA:0:7}"
log "✓ Poll every ${POLL_INTERVAL}s (backend only)"
echo ""

# ── Polling loop ─────────────────────────────────────────────
poll_loop() {
  while true; do
    sleep "${POLL_INTERVAL}"
    NSHA=$(get_latest_sha)
    OSHA=$(cat "${SHA_FILE}" 2>/dev/null || echo "")

    [ -z "${NSHA}" ] || [ "${NSHA}" = "null" ] && { log "⚠ GitHub down"; continue; }
    [ "${NSHA}" = "${OSHA}" ] && { log "✓ ${NSHA:0:7}"; continue; }

    log "🔍 NEW: ${OSHA:0:7} → ${NSHA:0:7}"
    if [ "$(check_backend "${OSHA}" "${NSHA}")" = "yes" ]; then
      log "🔄 BACKEND — redeploying..."
      kill "${SPID}" 2>/dev/null || true
      wait "${SPID}" 2>/dev/null || true
      deploy
      echo "${NSHA}" > "${SHA_FILE}"
      node server/index.js &
      SPID=$!
      log "✓ Updated → ${NSHA:0:7}"
    else
      log "⏭ Frontend only — skip"
      echo "${NSHA}" > "${SHA_FILE}"
    fi
    echo ""
  done
}

# ── Start ────────────────────────────────────────────────────
echo "========================================"
log "Starting server..."
echo "========================================"
node server/index.js &
SPID=$!

poll_loop
