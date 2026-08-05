# Dockerfile — BABFT API Server for Pterodactyl
# build:  docker build -t babft-api .
# run:    docker run -p 3000:3000 --env-file .env babft-api

FROM node:22-alpine

# Pterodactyl container user
RUN addgroup -S pterodactyl && adduser -S -G pterodactyl pterodactyl

# Tools untuk start.sh
RUN apk add --no-cache curl unzip bash

WORKDIR /app

# Copy source (termasuk start.sh)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY api/    api/
COPY lib/    lib/
COPY server/ server/
COPY start.sh ./

ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${PORT}/health || exit 1

USER pterodactyl
EXPOSE ${PORT}
CMD ["bash", "start.sh"]
