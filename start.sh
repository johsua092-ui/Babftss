#!/bin/bash
# start.sh — Auto-update + fresh deploy setiap restart
# CMD_RUN di Pterodactyl: bash start.sh
#
# Setiap restart:
# 1. Download ZIP terbaru dari GitHub
# 2. HAPUS SEMUA file lama (kecuali node_modules)
# 3. Ekstrak ZIP → ganti total
# 4. npm install (kalo ada package.json baru)
# 5. Jalankan server
# ================================================================

set -e

REPO="johsua092-ui/Babftss"
BRANCH="main"
ZIP_URL="https://github.com/${REPO}/archive/refs/heads/${BRANCH}.zip"
ZIP_FILE="/tmp/babftss.zip"
TMP_DIR="/tmp/babftss-new"
WORK_DIR="/home/container"

echo "========================================"
echo " BABFT API — Auto Deploy (fresh)"
echo "========================================"

# ── 1. Download ZIP terbaru ─────────────────────────────────
echo "[1/4] Downloading ${BRANCH}.zip ..."
if command -v curl &>/dev/null; then
  curl -fsSL "${ZIP_URL}" -o "${ZIP_FILE}"
elif command -v wget &>/dev/null; then
  wget -q "${ZIP_URL}" -O "${ZIP_FILE}"
else
  echo "ERROR: curl / wget not found"
  exit 1
fi
echo "      ✓ $(du -h "$ZIP_FILE" | cut -f1)"

# ── 2. HAPUS semua file lama ────────────────────────────────
echo "[2/4] Cleaning old files..."
cd "${WORK_DIR}"

# Simpan node_modules sementara biar kalo ga ada perubahan dep ga install ulang
if [ -d node_modules ]; then
  mv node_modules /tmp/node_modules_bak 2>/dev/null || true
fi

# Hapus semua file & folder
find . -mindepth 1 -maxdepth 1 ! -name '.' ! -name '..' -exec rm -rf {} +

echo "      ✓ Old files deleted"

# ── 3. Ekstrak ZIP ke work dir ──────────────────────────────
echo "[3/4] Extracting new source..."
unzip -oq "${ZIP_FILE}" -d "${TMP_DIR}"
rm -f "${ZIP_FILE}"

# GitHub ZIP format: Babftss-main/ → copy isinya ke WORK_DIR
EXTRACTED=$(ls -d "${TMP_DIR}"/*/ 2>/dev/null | head -1)
if [ -z "${EXTRACTED}" ]; then
  echo "ERROR: ZIP empty or broken"
  exit 1
fi

# Copy semua isi folder hasil ekstrak ke WORK_DIR
shopt -s dotglob
cp -r "${EXTRACTED}"* "${WORK_DIR}/" 2>/dev/null || true
shopt -u dotglob

rm -rf "${TMP_DIR}"
echo "      ✓ Source replaced"

# ── 4. Restore node_modules & install ───────────────────────
echo "[4/4] Checking dependencies..."

# Bandingin package.json — kalo sama, restore node_modules lama
RESTORED=0
if [ -d /tmp/node_modules_bak ]; then
  if [ -f "${WORK_DIR}/package.json" ]; then
    mv /tmp/node_modules_bak "${WORK_DIR}/node_modules" 2>/dev/null && RESTORED=1 || true
  else
    rm -rf /tmp/node_modules_bak
  fi
fi

if [ "${RESTORED}" = "0" ] || [ ! -d "${WORK_DIR}/node_modules" ]; then
  echo "      Installing fresh..."
  cd "${WORK_DIR}"
  npm install --omit=dev --no-audit --no-fund --prefer-offline 2>&1 | tail -1
else
  echo "      ✓ Dependencies unchanged, skipped install"
fi

# Bersihin sisa tmp
rm -rf /tmp/node_modules_bak 2>/dev/null || true

echo ""
echo "========================================"
echo " Server starting..."
echo "========================================"

# ── 5. Start ────────────────────────────────────────────────
exec node server/index.js
