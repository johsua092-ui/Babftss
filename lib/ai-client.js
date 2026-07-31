// lib/ai-client.js — Shared Overchat AI client
// No API key needed — uses public Overchat.ai endpoint
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
 * Build a system prompt from the loaded dataset
 * @param {object|null} dataset — loaded dataset object
 * @returns {string}
 */
function buildSystemPrompt(dataset) {
  const base = "Kamu adalah AI Tutor BABFT Learning, asisten belajar yang membantu user memahami Logic Gates, Gears, dan Linkages Mechanic. Gunakan bahasa yang ramah, sabar, dan mudah dipahami pemula. Jawab dalam Bahasa Indonesia kecuali user pakai bahasa lain.";
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

/**
 * Call Overchat Claude Haiku API (streaming)
 * @param {string} prompt — user message
 * @param {object} options
 * @param {string} [options.chatId] — reuse for multi-turn
 * @param {string} [options.deviceId] — unique device ID
 * @param {Array<{role:string,content:string}>} [options.history] — previous messages
 * @param {object|null} [options.dataset] — loaded dataset for system prompt
 * @returns {Promise<{status:boolean,code:number,answer:string,chatId:string,model:string,error?:string}>}
 */
export async function askAI(prompt, options = {}) {
  const chatId = options.chatId || crypto.randomUUID();
  const deviceId = options.deviceId || crypto.randomUUID();
  const systemMsg = buildSystemPrompt(options.dataset || null);

  const messages = [
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
    {
      id: crypto.randomUUID(),
      role: "system",
      content: systemMsg,
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
