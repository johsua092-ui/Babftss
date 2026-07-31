// lib/ai-client.js — Shared Overchat AI client
// No API key needed — uses public Overchat.ai endpoint
// SYSTEM PROMPT is embedded directly — no filesystem deps for Vercel serverless
import crypto from "node:crypto";

const API = "https://api.overchat.ai/v1/chat/completions";
const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";
const MODEL = "claude-haiku-4-5-20251001";
const PERSONA = "claude-haiku-4-5-landing";

const PRODUCTION_ORIGINS = [
  "https://babftlearning.dpdns.org",
  "https://babft-project.vercel.app",
  "https://babftss.vercel.app",
];
const ALLOWED_ORIGINS = [...PRODUCTION_ORIGINS, "https://overchat.ai"];

/**
 * Build the AI Tutor system prompt with embedded knowledge base
 * This is the CORE of the AI Tutor — everything it knows about BABFT
 */
function buildSystemPrompt(dataset) {
  const base = `Kamu adalah AI Tutor BABFT Learning — asisten belajar untuk platform edukasi Logic Gates bertema game Roblox "Build A Boat For Treasure".

TUGAS UTAMA KAMU:
1. Jelaskan konsep gerbang logika dengan bahasa sederhana dan analogi sehari-hari
2. Bantu user memahami truth table (tabel kebenaran) dan cara membacanya
3. Jawab pertanyaan tentang rangkaian logika (circuit)
4. Beri contoh praktis penggunaan gerbang logika di dunia nyata
5. Motivasi user yang kesulitan — ingat, ini untuk PEMULA

ATURAN PENTING:
- WAJIB jawab dalam Bahasa Indonesia (kecuali user pakai bahasa lain)
- Gunakan analogi yang relatable (saklar lampu, keran air, dll)
- Untuk penjelasan teknis, gunakan format yang rapi (table, list)
- JANGAN terlalu teknis di awal — mulai dari konsep sederhana
- Jika user tanya di luar topik Logic Gates / Gears / Linkages, arahkan kembali dengan sopan

PLATFORM INI MENGAJARKAN:
- 7 Basic Logic Gates: NOT, AND, NAND, OR, NOR, XOR, XNOR + Basic Wire (pengantar)
- Logic Gates Circuit (rangkaian gabungan beberapa gate)
- Gears (36 jenis) dan Linkages Mechanic (45 jenis)`;

  if (!dataset) return base;
  const parts = [base];
  if (dataset.instruction) parts.push(`\n--- INSTRUKSI TAMBAHAN ---\n${dataset.instruction}`);
  if (dataset.knowledge) {
    const knowledgeStr = typeof dataset.knowledge === "string"
      ? dataset.knowledge
      : JSON.stringify(dataset.knowledge, null, 2);
    parts.push(`\n--- DATASET / KNOWLEDGE BASE ---\n${knowledgeStr}`);
  }
  return parts.join("\n");
}

// Embedded fallback dataset (small core knowledge — full dataset loaded from lib/ai-dataset.json on Vercel)
const EMBEDDED_DATASET = {
  instruction: "",
  knowledge: {
    gates: [
      { name: "Basic Wire", type: "wire", desc: "Sinyal mengalir langsung. A=0→OUT=0, A=1→OUT=1." },
      { name: "NOT Gate", type: "not", desc: "Pembalik sinyal (Inverter). A=0→OUT=1, A=1→OUT=0." },
      { name: "AND Gate", type: "and", desc: "OUT=1 hanya jika A DAN B keduanya 1. Seperti 2 saklar seri." },
      { name: "NAND Gate", type: "nand", desc: "Kebalikan AND. OUT=0 hanya jika keduanya 1. Gerbang universal." },
      { name: "OR Gate", type: "or", desc: "OUT=1 jika SALAH SATU atau keduanya 1. Seperti 2 saklar paralel." },
      { name: "NOR Gate", type: "nor", desc: "Kebalikan OR. OUT=1 hanya jika keduanya 0." },
      { name: "XOR Gate", type: "xor", desc: "OUT=1 hanya jika A dan B BERBEDA (01 atau 10). Exclusive OR." },
      { name: "XNOR Gate", type: "xnor", desc: "Kebalikan XOR. OUT=1 hanya jika A dan B SAMA (00 atau 11)." }
    ]
  }
};

/**
 * Call Overchat Claude Haiku API (streaming, server-side parse)
 * @param {string} prompt — user message
 * @param {object} options
 * @param {string} [options.chatId] — reuse for multi-turn
 * @param {string} [options.deviceId] — unique device ID
 * @param {Array<{role:string,content:string}>} [options.history] — previous messages
 * @param {object|null} [options.dataset] — loaded dataset (from lib/ai-dataset.json)
 * @returns {Promise<{status:boolean,code:number,answer:string,chatId:string,model:string,error?:string}>}
 */
export async function askAI(prompt, options = {}) {
  const chatId = options.chatId || crypto.randomUUID();
  const deviceId = options.deviceId || crypto.randomUUID();
  const systemMsg = buildSystemPrompt(options.dataset || EMBEDDED_DATASET);

  // Build messages: SYSTEM FIRST, then history, then user message
  const messages = [
    {
      id: crypto.randomUUID(),
      role: "system",
      content: systemMsg,
    },
    ...(options.history || []).map((item) => ({
      id: crypto.randomUUID(),
      role: item.role,
      content: item.content,
    })),
    {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
    },
  ];

  const body = {
    chatId,
    model: MODEL,
    messages,
    personaId: PERSONA,
    frequency_penalty: 0,
    max_tokens: 4000,
    presence_penalty: 0,
    stream: true,
    temperature: 0.5,
    top_p: 0.95,
  };

  const headers = {
    "sec-ch-ua-platform": '"Android"',
    "x-device-uuid": deviceId,
    "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    "sec-ch-ua-mobile": "?1",
    "x-device-language": "id-ID",
    "x-device-platform": "web",
    "x-device-version": "1.0.44",
    "user-agent": UA,
    accept: "*/*",
    "content-type": "application/json",
    origin: "https://overchat.ai",
    referer: "https://overchat.ai/",
    "accept-language": "id-ID,id;q=0.9",
    priority: "u=1, i",
  };

  try {
    const response = await fetch(API, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      return { status: false, code: response.status, error: text, chatId, model: MODEL, answer: "" };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "", answer = "", responseId = null, responseModel = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          if (typeof json.id === "string") responseId = json.id;
          if (typeof json.model === "string") responseModel = json.model;
          const content = json.choices?.[0]?.delta?.content;
          if (typeof content === "string") answer += content;
        } catch {}
      }
    }

    return {
      status: true,
      code: response.status,
      answer,
      chatId,
      model: responseModel || MODEL,
    };
  } catch (e) {
    return {
      status: false,
      code: 500,
      error: e.message || "AI service unavailable",
      chatId,
      model: MODEL,
      answer: "",
    };
  }
}

/**
 * Validate origin for CORS
 */
export function getAllowedAIOrigin(req) {
  const origin = (req.headers && req.headers.origin) || "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (origin.endsWith(".vercel.app")) return origin;
  if (origin.startsWith("http://localhost:")) return origin;
  return PRODUCTION_ORIGINS[0];
}
