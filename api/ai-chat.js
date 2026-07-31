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

    // PRE-FILTER: hardcoded platform info (prevents AI hallucination about BABFT Learning)
    const canned = getCannedResponse(message);
    if (canned) {
      return res.status(200).json({
        answer: canned,
        chatId: chatId || "babft-platform-info",
        model: "babft-tutor",
      });
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

/**
 * Hardcoded platform info — prevents AI hallucination about BABFT Learning
 * Returns null if question is NOT about the platform (pass through to AI)
 */
function getCannedResponse(message) {
  const msg = message.toLowerCase().trim();

  // Platform identity questions
  const isPlatformQuestion =
    msg.includes("babft") ||
    msg.includes("platform ini") ||
    msg.includes("platform apa") ||
    msg.includes("di sini") && (msg.includes("belajar") || msg.includes("diajark") || msg.includes("ajar"));

  if (!isPlatformQuestion) return null;

  // Canned response — accurate platform info
  return `# 🏴‍☠️ BABFT Learning — Platform Belajar Logic Gates!

BABFT Learning adalah **platform edukasi interaktif** bertema game Roblox **"Build A Boat For Treasure"** yang mengajarkan konsep **Logic Gates (Gerbang Logika)** digital dengan cara visual dan menyenangkan.

## 📚 Yang Diajarkan di Platform Ini:

### 1. ⚡ Basic Logic Gates (7 gerbang + pengantar)
- **Basic Wire** — Sinyal mengalir langsung, dasar semua rangkaian
- **NOT Gate** — Pembalik sinyal (Inverter)
- **AND Gate** — Output 1 hanya jika semua input 1
- **NAND Gate** — Kebalikan AND (gerbang universal)
- **OR Gate** — Output 1 jika salah satu input 1
- **NOR Gate** — Kebalikan OR
- **XOR Gate** — Exclusive OR, output 1 jika input berbeda
- **XNOR Gate** — Kebalikan XOR

### 2. 🔗 Logic Gates Circuit
Rangkaian gabungan beberapa gate dengan sistem tier:
- 🟢 **MUDAH** — Satu-dua gate sederhana
- 🟡 **NORMAL** — Kombinasi menengah
- 🔴 **HARD** — Multi-gate kompleks
- 🌈 **INSANE** — Rangkaian paling menantang

### 3. ⚙️ Gears (36 jenis mekanisme gear)
### 4. 🔩 Linkages Mechanic (45 jenis)

## 🎮 Fitur Unggulan:
- Diagram interaktif dengan **neon glow** (terang = 1, redup = 0)
- Truth table dinamis yang real-time
- Auto-save progress dengan login Firebase
- Sistem tier untuk tantangan bertahap

Mau belajar yang mana dulu? 😊`;
}
