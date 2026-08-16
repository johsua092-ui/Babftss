const ORIGINS_RAW = process.env.ALLOWED_CORS_ORIGINS ||
  "https://babftss.vercel.app,https://babft-learning-project.zone.id,https://babftlearning.dpdns.org,https://babft-project.vercel.app";
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
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://*.firebaseio.com https://*.googleapis.com; img-src 'self' data:;");
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

let _admin = null;

async function getAdmin() {
  if (_admin) return _admin;
  // firebase-admin didesain untuk verifikasi Firebase ID token
  // (issuer securetoken.google.com) — google-auth-library TIDAK bisa.
  const admin = (await import('firebase-admin')).default;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID_SERVER,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
  _admin = admin;
  return _admin;
}

export async function verifyFirebaseToken(idToken) {
  if (!idToken) throw new Error('Missing token');
  const admin = await getAdmin();
  // .verifyIdToken() memeriksa signature, expiry, issuer, dan audience
  // secara benar untuk Firebase Auth ID token.
  const decoded = await admin.auth().verifyIdToken(idToken);
  if (!decoded || !decoded.sub) throw new Error('Invalid token');
  return decoded;
}

export async function authenticateRequest(req) {
  const ah = req.headers.authorization;
  if (!ah || !ah.startsWith('Bearer ')) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    console.warn('[auth] missing/invalid auth header from', ip);
    return null;
  }
  try {
    return await verifyFirebaseToken(ah.split(' ')[1]);
  } catch (e) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    console.warn('[auth] invalid token from', ip, '—', e?.message || e);
    return null;
  }
}

const ADMIN_UIDS_RAW = process.env.ADMIN_UIDS || "";
const ADMIN_UIDS = new Set(ADMIN_UIDS_RAW.split(",").map(s => s.trim()).filter(Boolean));

export function isAdmin(user) {
  if (!user || !user.sub) return false;
  return ADMIN_UIDS.has(user.sub);
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

// ── Firestore — project TERPISAH "punya-si-jawa" (data backend temen) ──
//    Auth firebase-admin default app memakai backend-fb691 (verifikasi token).
//    Storage data dipisah ke project punya-si-jawa lewat named app agar
//    tidak tabrakan dengan default app. Credential dibaca dari env:
//      FIREBASE_ADMIN_PROJECT_ID
//      FIREBASE_ADMIN_CLIENT_EMAIL
//      FIREBASE_ADMIN_PRIVATE_KEY
let _punyaSiJawaAdmin = null;

function parsePrivateKey(key) {
  if (!key) return '';
  // Terima sudah berformat PEM, atau JSON-escaped \n menjadi newline.
  return key.replace(/\\n/g, '\n');
}

export async function getPunyaSiJawaFirestore() {
  const admin = await getAdmin();
  if (!_punyaSiJawaAdmin) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = parsePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Firestore "punya-si-jawa" belum dikonfigurasi (FIREBASE_ADMIN_* kosong)'
      );
    }

    const appName = 'punya-si-jawa';
    if (admin.apps.some((a) => a.name === appName)) {
      _punyaSiJawaAdmin = admin.app(appName);
    } else {
      _punyaSiJawaAdmin = admin.initializeApp(
        {
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        },
        appName
      );
    }
  }
  return _punyaSiJawaAdmin.firestore();
}
