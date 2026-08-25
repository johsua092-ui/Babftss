// server/index.js — Express API server (replaces Vercel serverless)
// Deployment: Pterodactyl (Docker container) or any VPS
// Benefit: zero cold start, WebSocket-ready, persistent connections
//
// Startup: node server/index.js
// Port:    process.env.PORT || 3000

import express from 'express';
import { createServer } from 'node:http';
import dotenv from 'dotenv';

// Load .env (Pterodactyl passes vars natively, but .env fallback for local dev)
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

// ── Import all API handlers ──────────────────────────────────
import favoritesHandler   from '../api/favorites.js';
import myFavoritesHandler from '../api/my-favorites.js';
import aiChatHandler      from '../api/ai-chat.js';
import leaderboardHandler from '../api/leaderboard.js';
import getProgressHandler from '../api/get-progress.js';
import saveProgressHandler from '../api/save-progress.js';
import resetProgressHandler from '../api/reset-progress.js';
import profileHandler     from '../api/profile.js';
import circuitsHandler     from '../api/circuits.js';
import canvasHandler       from '../api/canvas.js';

// ── App setup ────────────────────────────────────────────────
const app = express();
const PORT = parseInt(process.env.PORT || process.env.SERVER_PORT || '3000', 10);

// ── Middleware ───────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// Trust proxy (Pterodactyl / Nginx sets X-Forwarded-For)
app.set('trust proxy', 1);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    node: process.version,
  });
});

// ── API routes (reuse existing Vercel handlers) ──────────────
//    Each handler is: async (req, res) => { ... }
//    Compatible with Express — req has .query, .body, .headers etc.

// Favorites CRUD
app.all('/api/favorites',     (req, res) => favoritesHandler(req, res));

// My Favorites (enriched)
app.all('/api/my-favorites',  (req, res) => myFavoritesHandler(req, res));

// AI Chat
app.all('/api/ai-chat',       (req, res) => aiChatHandler(req, res));

// Leaderboard (public)
app.all('/api/leaderboard',   (req, res) => leaderboardHandler(req, res));

// User Progress
app.all('/api/get-progress',  (req, res) => getProgressHandler(req, res));
app.all('/api/save-progress', (req, res) => saveProgressHandler(req, res));
app.all('/api/reset-progress',(req, res) => resetProgressHandler(req, res));

// User Profile
app.all('/api/profile',       (req, res) => profileHandler(req, res));

// Circuits (save/load/delete rangkaian)
app.all('/api/circuits',      (req, res) => circuitsHandler(req, res));

// Canvas (save slots, strokes, dataset)
app.all('/api/canvas',        (req, res) => canvasHandler(req, res));

// ── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[server] unhandled error:', err?.message || err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] BABFT API running on port ${PORT}`);
  console.log(`[server] URL: http://0.0.0.0:${PORT}`);
  console.log(`[server] Health: http://0.0.0.0:${PORT}/health`);
  console.log(`[server] Endpoints: favorites, my-favorites, ai-chat (includes coin-transfer), leaderboard, progress, profile, circuits, canvas`);

});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[server] Closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[server] SIGINT received, shutting down...');
  server.close(() => process.exit(0));
});
