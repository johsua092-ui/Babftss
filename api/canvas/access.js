// api/canvas/access.js — Cek akses fitur Canvas (gating member)
//
// Auth : Firebase token (Bearer) — guest TIDAK boleh memakai Canvas.
//        Guest mendapat HTTP 200 dengan { allowed: false, reason } agar
//        frontend bisa menampilkan menu "redup" (disabled) tanpa error.
//
// Endpoint:
//   GET /api/canvas/access -> { allowed, uid?, slots: {...} }
import {
  applyCors,
  applySecurityHeaders,
  checkRateLimit,
  authenticateRequest,
  getPunyaSiJawaFirestore,
} from '../../lib/api-helpers.js';

const COLLECTION = 'canvas_prompts';
const MAX_SLOTS = 3;

export default async function handler(req, res) {
  applyCors(req, res, 'GET, OPTIONS');
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit('canvas-access:' + ip, 120, 60000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const user = await authenticateRequest(req);
    if (!user) {
      // Bukan error — frontend memakai ini untuk meredupkan menu.
      return res.status(200).json({
        allowed: false,
        reason: 'Tolong masuk menjadi member untuk menggunakan Canvas',
        code: 'AUTH_REQUIRED',
      });
    }

    const db = await getPunyaSiJawaFirestore();
    const snap = await db
      .collection(COLLECTION)
      .where('firebase_uid', '==', user.sub)
      .get();

    const filled = new Set();
    snap.docs.forEach((d) => {
      const slot = d.data().slot;
      if (typeof slot === 'number' && slot >= 0 && slot < MAX_SLOTS) filled.add(slot);
    });

    const slots = [];
    for (let i = 0; i < MAX_SLOTS; i++) slots.push({ slot: i, filled: filled.has(i) });

    return res.status(200).json({
      allowed: true,
      uid: user.sub,
      maxSlots: MAX_SLOTS,
      slots,
    });
  } catch (e) {
    console.error('[canvas-access]', e?.message || e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
