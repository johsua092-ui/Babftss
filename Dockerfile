# Dockerfile — BABFT API Server for Pterodactyl
# Build: docker build -t babft-api .
# Run:   docker run -p 3000:3000 --env-file .env babft-api
#
# Pterodactyl auto-injects these env vars:
#   SERVER_PORT   — port to listen on (default 3000)
#   All .env vars from the Pterodactyl panel

FROM node:22-alpine

# ── Pterodactyl container user ───────────────────────────
RUN addgroup -S pterodactyl && adduser -S -G pterodactyl pterodactyl

# ── App directory ────────────────────────────────────────
WORKDIR /app

# ── Dependencies (layer cache) ───────────────────────────
COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# ── Source ───────────────────────────────────────────────
# server/ — Express server entry point
COPY server/ server/

# lib/ — shared utilities (api-helpers, favorites-catalog, ai-client)
COPY lib/ lib/

# api/ — route handlers (imported by server/index.js)
COPY api/ api/

# ── Pterodactyl: use SERVER_PORT if injected ─────────────
ENV PORT=3000

# ── Health check ─────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1

# ── Run as pterodactyl user (except on some hosts) ───────
USER pterodactyl

EXPOSE ${PORT}

# ── Startup ──────────────────────────────────────────────
CMD ["node", "server/index.js"]
