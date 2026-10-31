// api/get-avatar.js — Roblox 3D Avatar Proxy API
//
// Endpoint: GET /api/get-avatar?username={username}
// Kontrak frontend: { modelUrl: string, textureUrl?: string }
//
// Cara kerja:
//   1. Terima username Roblox (bersihkan awalan '@')
//   2. Ambil userId dari API Roblox (POST https://users.roblox.com/v1/usernames/users)
//   3. Ambil avatar 3D thumbnail metadata dari Roblox (GET https://thumbnails.roblox.com/v1/users/avatar-3d?userId={userId})
//   4. Dapatkan URL manifest (imageUrl), fetch JSON-nya (obj hash, textures hash)
//   5. Hitung shard CDN Roblox (https://t{shard}.rbxcdn.com/{hash})
//   6. Kembalikan URL .obj dan .png texture ke frontend (dengan CORS aktif)

const rateStore = new Map();

function checkRateLimit(key, max = 60, windowMs = 60000) {
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

// Algoritma Shard Roblox CDN (i=31, XOR first 32 chars or 38 for 30DAY-, modulo 8)
function getCdnUrl(hash) {
  if (!hash || typeof hash !== 'string') return null;
  let i = 31;
  const len = hash.startsWith('30DAY-') ? 38 : Math.min(32, hash.length);
  for (let t = 0; t < len && t < hash.length; t++) {
    i ^= hash.charCodeAt(t);
  }
  const shard = (i % 8 + 8) % 8; // Pastikan non-negatif
  return `https://t${shard}.rbxcdn.com/${hash}`;
}

export default async function handler(req, res) {
  // CORS Headers — izinkan semua origin agar aman dipanggil dari Vercel / localhost
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit('avatar:' + ip, 60, 60000)) {
      return res.status(429).json({ error: 'Too many requests. Coba lagi dalam 1 menit.' });
    }

    const rawUsername = req.query?.username;
    if (!rawUsername || typeof rawUsername !== 'string') {
      return res.status(400).json({ error: 'Parameter "username" wajib diisi' });
    }

    const cleanUsername = rawUsername.trim().replace(/^@+/, '');
    if (!/^[A-Za-z0-9_]{3,20}$/.test(cleanUsername)) {
      return res.status(400).json({
        error: 'Username Roblox tidak valid (3-20 karakter alfanumerik atau underscore)'
      });
    }

    // ── 1. Ambil User ID Roblox dari Username ──
    const userLookupResp = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        usernames: [cleanUsername],
        excludeBannedUsers: false
      })
    });

    if (!userLookupResp.ok) {
      console.error('[get-avatar] user lookup failed:', userLookupResp.status);
      return res.status(502).json({
        error: 'Gagal menghubungi server Roblox untuk mencari user (HTTP ' + userLookupResp.status + ')'
      });
    }

    const userData = await userLookupResp.json();
    const userObj = userData?.data?.[0];

    if (!userObj || !userObj.id) {
      return res.status(404).json({
        error: `User Roblox "${cleanUsername}" tidak ditemukan.`
      });
    }

    const userId = userObj.id;

    // ── 2. Request 3D Avatar Metadata dari Roblox ──
    const robloxHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    // Dukung Roblox Open Cloud API Key atau Cookie jika diset di env
    const robloxApiKey = process.env.ROBLOX_API_KEY;
    const robloxCookie = process.env.ROBLOX_COOKIE || process.env.ROBLOSECURITY;
    if (robloxApiKey) {
      robloxHeaders['x-api-key'] = robloxApiKey;
    } else if (robloxCookie) {
      robloxHeaders['Cookie'] = robloxCookie.includes('.ROBLOSECURITY=')
        ? robloxCookie
        : `.ROBLOSECURITY=${robloxCookie}`;
    }

    let avatarData = null;
    let lastStatus = 200;

    // Polling retry jika avatar thumbnail masih 'Pending' (maks 4 percobaan)
    for (let attempt = 0; attempt < 4; attempt++) {
      const avatarResp = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-3d?userId=${userId}`, {
        headers: robloxHeaders
      });

      lastStatus = avatarResp.status;

      if (avatarResp.status === 401 || avatarResp.status === 403) {
        // Roblox memblokir request tanpa auth
        return res.status(403).json({
          error: 'Roblox memblokir permintaan 3D avatar anonim (HTTP 403). Harap tambahkan ROBLOX_API_KEY (Open Cloud API Key) atau ROBLOX_COOKIE di environment variables backend.',
          code: 'ROBLOX_AUTH_REQUIRED'
        });
      }

      if (!avatarResp.ok) {
        console.error('[get-avatar] avatar-3d error:', avatarResp.status);
        return res.status(avatarResp.status).json({
          error: 'Gagal mengambil avatar 3D dari Roblox (HTTP ' + avatarResp.status + ')'
        });
      }

      avatarData = await avatarResp.json();

      if (avatarData.state === 'Completed' && avatarData.imageUrl) {
        break;
      }

      if (avatarData.state === 'Blocked') {
        return res.status(400).json({
          error: `Avatar pengguna "${cleanUsername}" diblokir atau di-private oleh Roblox.`
        });
      }

      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    if (!avatarData || !avatarData.imageUrl) {
      return res.status(504).json({
        error: 'Rendering 3D avatar dari Roblox timeout/pending. Silakan coba klik sekali lagi.'
      });
    }

    // ── 3. Ambil Manifest 3D dari URL ImageUrl CDN ──
    const manifestResp = await fetch(avatarData.imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!manifestResp.ok) {
      console.error('[get-avatar] manifest fetch error:', manifestResp.status);
      return res.status(502).json({
        error: 'Gagal mengunduh manifest 3D dari CDN Roblox'
      });
    }

    const manifest = await manifestResp.json();
    if (!manifest || !manifest.obj) {
      return res.status(502).json({
        error: 'Manifest 3D Roblox tidak memuat model OBJ yang valid'
      });
    }

    // ── 4. Generate URL CDN Publik untuk OBJ & Tekstur ──
    const modelUrl = getCdnUrl(manifest.obj);
    const textureUrl = Array.isArray(manifest.textures) && manifest.textures.length > 0
      ? getCdnUrl(manifest.textures[0])
      : null;

    // Return sesuai format kontrak: { modelUrl, textureUrl }
    return res.status(200).json({
      success: true,
      username: userObj.name,
      displayName: userObj.displayName,
      userId: userId,
      modelUrl: modelUrl,
      textureUrl: textureUrl,
      // Metadata pelengkap
      mtlUrl: manifest.mtl ? getCdnUrl(manifest.mtl) : null,
      camera: manifest.camera || null,
      aabb: manifest.aabb || null
    });

  } catch (err) {
    console.error('[get-avatar] unexpected error:', err);
    return res.status(500).json({
      error: 'Terjadi kesalahan internal server: ' + (err?.message || err)
    });
  }
}
