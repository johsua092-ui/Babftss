#!/bin/bash
# start.sh — Auto-update script untuk Pterodactyl
# Set CMD_RUN di panel Pterodactyl jadi: bash start.sh
#
# Cara kerja:
# 1. Download ZIP latest dari GitHub
# 2. Ekstrak & replace file lama
# 3. npm install
# 4. Jalankan server
# ================================================================

set -e

REPO="johsua092-ui/Babftss"
BRANCH="main"
ZIP_URL="https://github.com/${REPO}/archive/refs/heads/${BRANCH}.zip"
ZIP_FILE="/tmp/babftss-${BRANCH}.zip"
EXTRACT_DIR="/tmp/babftss-extract"
WORK_DIR="/home/container"

echo "========================================"
echo " BABFT API Server — Auto Deploy"
echo "========================================"
echo ""

# ── Step 1: Download ZIP terbaru ────────────────────────────
echo "[1/4] Downloading latest source from GitHub..."
if command -v curl &>/dev/null; then
  curl -fsSL "${ZIP_URL}" -o "${ZIP_FILE}"
elif command -v wget &>/dev/null; then
  wget -q "${ZIP_URL}" -O "${ZIP_FILE}"
else
  echo "ERROR: curl dan wget tidak ditemukan di container!"
  exit 1
fi
echo "       ✓ Downloaded $(du -h "$ZIP_FILE" | cut -f1)"

# ── Step 2: Ekstrak ─────────────────────────────────────────
echo "[2/4] Extracting..."
rm -rf "${EXTRACT_DIR}"
mkdir -p "${EXTRACT_DIR}"
unzip -oq "${ZIP_FILE}" -d "${EXTRACT_DIR}"
rm -f "${ZIP_FILE}"

# Cari folder hasil ekstrak (GitHub naming: Babftss-main/)
EXTRACTED=$(ls -d "${EXTRACT_DIR}"/*/ 2>/dev/null | head -1)
if [ -z "${EXTRACTED}" ]; then
  echo "ERROR: Gagal menemukan folder hasil ekstrak"
  exit 1
fi
echo "       ✓ Extracted to ${EXTRACTED}"

# ── Step 3: Copy file yang diperlukan ───────────────────────
echo "[3/4] Updating files..."
# Copy hanya file yang dibutuhkan server
for DIR in api lib server; do
  if [ -d "${EXTRACTED}${DIR}" ]; then
    rm -rf "${WORK_DIR}/${DIR}"
    cp -r "${EXTRACTED}${DIR}" "${WORK_DIR}/${DIR}"
    echo "       ✓ ${DIR}/"
  fi
done

# Copy root files (package.json, package-lock.json)
for FILE in package.json package-lock.json .env.example; do
  if [ -f "${EXTRACTED}${FILE}" ]; then
    cp "${EXTRACTED}${FILE}" "${WORK_DIR}/${FILE}"
  fi
done

# Copy start.sh itself biar next update jalan
cp "${EXTRACTED}start.sh" "${WORK_DIR}/start.sh" 2>/dev/null || true

rm -rf "${EXTRACT_DIR}"
echo "       ✓ Files synced"

# ── Step 4: Install dependencies ────────────────────────────
echo "[4/4] Installing dependencies..."
cd "${WORK_DIR}"
npm install --omit=dev --no-audit --no-fund 2>&1 | tail -1
echo "       ✓ Dependencies installed"

# ── Bersihkan file frontend (ga perlu di server) ────────────
rm -rf src/ assets/ public/ index.html vite.config.js 2>/dev/null || true

echo ""
echo "========================================"
echo " Starting server..."
echo "========================================"
echo ""

# ── Start server ────────────────────────────────────────────
exec node server/index.js
