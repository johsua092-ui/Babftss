# Dockerfile — BABFT API Server for Pterodactyl
# Build: docker build -t babft-api .
# Run:   docker run -p 3000:3000 --env-file .env babft-api
#
# Pterodactyl auto-injects:
#   SERVER_PORT     — port (default 3000)

FROM node:22-alpine

RUN addgroup -S pterodactyl && adduser -S -G pterodactyl pterodactyl
WORKDIR /app

# ── Dependencies (root package.json = server + frontend deps) ──
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# ── Source ─────────────────────────────────────────────────────
COPY server/ server/
COPY lib/    lib/
COPY api/    api/

ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1

USER pterodactyl
EXPOSE ${PORT}
CMD ["node", "server/index.js"]
