// api/ai-chat.js — AI Chat API Route
// POST: send message, get AI tutor response
// OPTIONS: CORS preflight
import { applyCors, applySecurityHeaders, checkRateLimit, validateStr } from "../lib/api-helpers.js";
import { askAI, getAllowedAIOrigin } from "../lib/ai-client.js";

// Dynamic dataset import — loaded on first request, cached in module scope
let _datasetCache = null;
let _datasetLoaded = false;

async function loadDataset() {
  if (_datasetLoaded) return _datasetCache;
  _datasetLoaded = true;
  try {
    // Coba load dataset dari filesystem (Vercel serverless)
    const fs = await import("node:fs");
    const path = await import("node:path");
    const datasetPath = path.join(process.cwd(), "lib", "ai-dataset.json");
    if (fs.existsSync(datasetPath)) {
      const raw = fs.readFileSync(datasetPath, "utf-8");
      _datasetCache = JSON.parse(raw);
    }
  } catch {
    // Dataset not found — AI will run without it, using only built-in system prompt
    _datasetCache = null;
  }
  return _datasetCache;
}

export default async function handler(req, res) {
  // CORS
  applyCors(req, res, "POST, OPTIONS");
  applySecurityHeaders(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Rate limit: 30 requests per minute per IP
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
    if (!checkRateLimit("ai-chat:" + ip, 30, 60000)) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }

    // Parse body
    const { message, chatId, history } = req.body || {};
    if (!validateStr(message, 2000)) {
      return res.status(400).json({ error: "message is required (max 2000 chars)" });
    }

    // Validate history if provided
    let cleanHistory = null;
    if (Array.isArray(history) && history.length > 0) {
      cleanHistory = history
        .filter((h) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
        .slice(-20) // max 20 messages to prevent token bloat
        .map((h) => ({ role: h.role, content: h.content.slice(0, 2000) }));
    }

    // Load dataset
    const dataset = await loadDataset();

    // Call AI
    const result = await askAI(message, {
      chatId: chatId || undefined,
      history: cleanHistory || undefined,
      dataset,
    });

    if (!result.status) {
      console.error("[ai-chat] AI error:", result.error);
      return res.status(502).json({ error: "AI service temporarily unavailable. Please try again." });
    }

    return res.status(200).json({
      answer: result.answer,
      chatId: result.chatId,
      model: result.model,
    });
  } catch (e) {
    console.error("[ai-chat]", e?.message || e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
