#!/bin/bash
# start.sh — Auto-deploy + smart polling (backend-only restart)
# CMD_RUN di Pterodactyl: bash start.sh
#
# Setiap 5 menit:
# 1. Cek commit SHA terbaru via GitHub API
# 2. Kalo ada commit baru → cek file apa yg berubah
# 3. HANYA redeploy kalo berubah: api/ lib/ server/ package.json start.sh
# 4. Frontend doang (src/ assets/ dll) → skip, log aja
# ================================================================

set -e

REPO="johsua092-ui/Babftss"
BRANCH="main"
ZIP_URL="https://github.com/${REPO}/archive/refs/heads/${BRANCH}.zip"
COMMITS_URL="https://api.github.com/repos/${REPO}/commits/${BRANCH}"
WORK_DIR="/home/container"
POLL_INTERVAL=300  # 5 menit

# Path yang trigger restart
BACKEND_PATHS="^(api/|lib/|server/|package\\.json|package-lock\\.json|start\\.sh)"

# ── Helper: log with timestamp ───────────────────────────────
log() { echo "[$(date +%H:%M:%S)] $*"; }

# ── Deploy fresh ─────────────────────────────────────────────
deploy() {
  local ZIP_FILE="/tmp/babftss.zip"
  local TMP_DIR="/tmp/babftss-new"

  echo "========================================"
  log "Deploying ${BRANCH}..."
  echo "========================================"

  # 1. Download
  echo "[1/4] Downloading..."
  curl -fsSL "${ZIP_URL}" -o "${ZIP_FILE}" 2>/dev/null || {
    wget -q "${ZIP_URL}" -O "${ZIP_FILE}"
  }
  log "✓ $(du -h "$ZIP_FILE" | cut -f1)"

  # 2. Clean
  echo "[2/4] Cleaning..."
  cd "${WORK_DIR}"
  [ -d node_modules ] && mv node_modules /tmp/node_modules_bak 2>/dev/null || true
  find . -mindepth 1 -maxdepth 1 ! -name '.' ! -name '..' -exec rm -rf {} +
  log "✓ Old files deleted"

  # 3. Extract
  echo "[3/4] Extracting..."
  mkdir -p "${TMP_DIR}"
  unzip -oq "${ZIP_FILE}" -d "${TMP_DIR}"
  rm -f "${ZIP_FILE}"

  local EXTRACTED=$(ls -d "${TMP_DIR}"/*/ 2>/dev/null | head -1)
  shopt -s dotglob
  cp -r "${EXTRACTED}"* "${WORK_DIR}/" 2>/dev/null || true
  shopt -u dotglob
  rm -rf "${TMP_DIR}"
  log "✓ Source replaced"

  # 4. Deps
  echo "[4/4] Dependencies..."
  if [ -d /tmp/node_modules_bak ] && [ -f package.json ]; then
    mv /tmp/node_modules_bak node_modules 2>/dev/null && log "✓ Restored cache"
  fi
  cd "${WORK_DIR}"
  npm install --omit=dev --no-audit --no-fund --prefer-offline 2>&1 | tail -1
  rm -rf /tmp/node_modules_bak 2>/dev/null || true
  log "✓ Done"
}

# ── Helper: latest commit SHA ────────────────────────────────
get_latest_sha() {
  curl -s "${COMMITS_URL}" 2>/dev/null | grep -m1 '"sha"' | head -1 | \
    sed 's/.*"sha": *"\([^"]*\)".*/\1/'
}

# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════

# Deploy awal
deploy
LATEST_SHA=$(get_latest_sha)
echo "${LATEST_SHA}" > /tmp/babftss_sha
log "✓ Deployed commit: ${LATEST_SHA:0:7}"
log "✓ Polling every ${POLL_INTERVAL}s (backend-only restart)"
echo ""

# ── Background poll loop ─────────────────────────────────────
auto_update_loop() {
  while true; do
    sleep "${POLL_INTERVAL}"

    local NEW_SHA=$(get_latest_sha)
    local OLD_SHA=$(cat /tmp/babftss_sha 2>/dev/null || echo "")

    if [ -z "${NEW_SHA}" ] || [ "${NEW_SHA}" = "null" ]; then
      log "⚠ GitHub unreachable, retry in ${POLL_INTERVAL}s"
      continue
    fi

    if [ "${NEW_SHA}" = "${OLD_SHA}" ]; then
      log "✓ Up to date (${NEW_SHA:0:7})"
      continue
    fi

    # ── Commit baru → cek file apa yg berubah ─────────────
    log "🔍 NEW COMMITS: ${OLD_SHA:0:7} → ${NEW_SHA:0:7}"

    local CHANGED_FILES=$(curl -s \
      "https://api.github.com/repos/${REPO}/compare/${OLD_SHA}...${NEW_SHA}" 2>/dev/null | \
      grep '"filename"' | sed 's/.*"filename": *"\([^"]*\)".*/\1/')

    log "   Changed:"
    echo "$CHANGED_FILES" | while read f; do [ -n "$f" ] && log "     $f"; done

    if echo "$CHANGED_FILES" | grep -qE "${BACKEND_PATHS}" 2>/dev/null; then
      # ── Backend berubah → redeploy ──────────────────────
      log "🔄 BACKEND CHANGED — redeploying..."

      kill "${SERVER_PID}" 2>/dev/null || true
      wait "${SERVER_PID}" 2>/dev/null || true

      deploy
      echo "${NEW_SHA}" > /tmp/babftss_sha

      log "Starting server..."
      node server/index.js &
      SERVER_PID=$!
      log "✓ Updated to ${NEW_SHA:0:7}"
    else
      # ── Frontend doang → skip ───────────────────────────
      log "⏭ Frontend-only — skipping redeploy"
      echo "${NEW_SHA}" > /tmp/babftss_sha
    fi

    echo ""
  done
}

# ── Start server ─────────────────────────────────────────────
echo "========================================"
log "Starting server..."
echo "========================================"
node server/index.js &
SERVER_PID=$!

# ── Start poll loop ──────────────────────────────────────────
auto_update_loop
