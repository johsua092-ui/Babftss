#!/bin/bash
# bootstrap.sh — First-time setup untuk Pterodactyl
# Tempel ini di CMD_RUN:
#   bash <(curl -sL https://raw.githubusercontent.com/johsua092-ui/Babftss/main/bootstrap.sh)
#
# Cara kerja:
# 1. Download ZIP repo dari GitHub
# 2. Ekstrak semua ke /home/container
# 3. npm install
# 4. Jalankan start.sh (server + auto-update polling)
# ================================================================
set -e

ZIP="https://github.com/johsua092-ui/Babftss/archive/refs/heads/main.zip"
WORK="/home/container"
TMP="/tmp/babftss-bootstrap"

echo "========================================"
echo " BABFT — Bootstrap Setup"
echo "========================================"

# 1. Download repo ZIP
echo "[1/3] Downloading repo..."
curl -fsSL "$ZIP" -o /tmp/babftss.zip 2>/dev/null || wget -q "$ZIP" -O /tmp/babftss.zip
echo "      ✓ Downloaded"

# 2. Ekstrak
echo "[2/3] Extracting..."
mkdir -p "$TMP"
unzip -oq /tmp/babftss.zip -d "$TMP"
rm -f /tmp/babftss.zip

SRC=$(ls -d "$TMP"/*/ | head -1)
cd "$WORK"

# Backup node_modules kalo ada
[ -d node_modules ] && mv node_modules /tmp/node_modules_bak 2>/dev/null || true

# Hapus semua, ganti baru
find . -mindepth 1 -maxdepth 1 ! -name '.' ! -name '..' -exec rm -rf {} +
shopt -s dotglob
cp -r "$SRC"* "$WORK/"
shopt -u dotglob
rm -rf "$TMP"

# Restore node_modules kalo package.json ga berubah
[ -d /tmp/node_modules_bak ] && mv /tmp/node_modules_bak node_modules 2>/dev/null || true
echo "      ✓ Extracted"

# 3. Install + start
echo "[3/3] Installing dependencies..."
npm install --omit=dev --no-audit --no-fund --prefer-offline 2>&1 | tail -1
rm -rf /tmp/node_modules_bak 2>/dev/null || true

chmod +x start.sh 2>/dev/null || true

echo "      ✓ Done"
echo "========================================"
echo ""

# Chain ke start.sh (server + auto-update loop)
exec bash start.sh
