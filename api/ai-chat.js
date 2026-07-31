// api/ai-chat.js — AI Chat API Route (serverless)
// POST /api/ai-chat — AI Tutor conversation endpoint
// Public endpoint (no auth required) — rate limited per IP
// Frontend team: just POST { message, chatId?, history? } to this endpoint
import { applyCors, applySecurityHeaders, checkRateLimit, validateStr } from "../lib/api-helpers.js";
import { askAI } from "../lib/ai-client.js";

export default async function handler(req, res) {
  applyCors(req, res, "POST, OPTIONS");
  applySecurityHeaders(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Rate limit: 30 req/min per IP (generous for chat)
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
    if (!checkRateLimit("ai-chat:" + ip, 30, 60000)) {
      return res.status(429).json({ error: "Terlalu banyak request. Tunggu sebentar ya." });
    }

    // Validate input
    const { message, chatId, history } = req.body || {};
    if (!validateStr(message, 2000)) {
      return res.status(400).json({ error: "message wajib diisi (max 2000 karakter)" });
    }

    // Sanitize history
    let cleanHistory = null;
    if (Array.isArray(history) && history.length > 0) {
      cleanHistory = history
        .filter((h) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
        .slice(-20)
        .map((h) => ({ role: h.role, content: h.content.slice(0, 2000) }));
    }

    // Call AI (dataset embedded in ai-client.js — no filesystem deps)
    const result = await askAI(message, {
      chatId: chatId || undefined,
      history: cleanHistory || undefined,
    });

    if (!result.status) {
      console.error("[ai-chat] AI error:", result.error);
      return res.status(502).json({ error: "AI service sedang sibuk. Coba lagi nanti." });
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
