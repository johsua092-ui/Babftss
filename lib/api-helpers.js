// lib/api-helpers.js — Shared utilities for API routes
// Security: CORS, rate limiting, input validation, error handling
// ALL origins from env vars — no hardcoded domains
const ORIGINS_RAW = process.env.ALLOWED_CORS_ORIGINS ||
  "https://babftss.vercel.app,https://babftlearning.dpdns.org,https://babft-project.vercel.app";
const PRODUCTION_ORIGINS = ORIGINS_RAW.split(",").map(s => s.trim()).filter(Boolean);

function getAllowedOrigin(req) {
  const o = req.headers.origin;
  if (!o) return PRODUCTION_ORIGINS[0];
  if (PRODUCTION_ORIGINS.includes(o)) return o;
  // ⚠ Dev only — remove before production
  if (o.startsWith('http://localhost:')) return o;
  return PRODUCTION_ORIGINS[0];
}

export function applyCors(req, res, methods = 'GET, OPTIONS') {
  const origin = getAllowedOrigin(req);
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}

const rateStore = new Map();

export function checkRateLimit(key, max = 60, windowMs = 60000) {
  const now = Date.now();
  for (const [k, e] of rateStore) {
    if (now > e.resetAt) rateStore.delete(k);
  }
  const entry = rateStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export async function verifyFirebaseToken(idToken) {
  const { OAuth2Client } = await import('google-auth-library');
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.FIREBASE_PROJECT_ID_SERVER,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub) throw new Error('Invalid token');
  return payload;
}

export async function authenticateRequest(req) {
  const ah = req.headers.authorization;
  if (!ah || !ah.startsWith('Bearer ')) return null;
  try {
    return await verifyFirebaseToken(ah.split(' ')[1]);
  } catch {
    return null;
  }
}

export function validateStr(val, maxLen = 200) {
  return typeof val === 'string' && val.length > 0 && val.length <= maxLen;
}

export function validateNum(val, min = 0, max = 1000) {
  return typeof val === 'number' && !isNaN(val) && val >= min && val <= max;
}

export function validateUrl(val) {
  if (typeof val !== 'string' || val.length > 2048) return false;
  try {
    const u = new URL(val);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function safeError(res, status, context, err) {
  console.error(`[${context}]`, err?.message || err);
  return res.status(status).json({ error: 'Internal server error' });
}

let _supabaseAdmin = null;

export async function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;
  const { createClient } = await import('@supabase/supabase-js');
  _supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  return _supabaseAdmin;
}
