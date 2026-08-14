// ============================================================================
// BABFT User Tracker — kirim aktifitas user ke admin panel (via /api/ingest).
//
// Data yang dicatat:
//   - identitas: uid, email, displayName, photoURL
//   - online:    online, lastOnlineAt, lastLoginAt, firstLoginAt, loginCount
//   - lokasi:    region, countryCode, regionName, timezone, ipAddress, isp,
//                latitude, longitude, address (alamat dari reverse geocode),
//                city, postal
//   - perangkat: deviceId (fingerprint hash), device (nama OS/browser), os,
//                browser, deviceType (mobile/tablet/desktop), screen, language,
//                userAgent
//   - VPN:       previousRegion, regionChangeCount, flaggedAsVpn
//
// Tidak ada kredensial/hardcode; semua field dikirim ke backend untuk diproses.
// ============================================================================

import { ingest } from "./ingest";

// cache hasil geo/fingerprint per sesi agar tidak fetch berulang-ulang.
// - geo di-cache per sesi (sessionStorage) agar tidak fetch 3 API tiap kunjungan
// - tulis ulang dokumen user di-throttle (default 5 menit) agar tidak spam
//   setDoc tiap pindah halaman / reload

const GEO_TTL_MS = 30 * 60000;      // geo valid 30 menit per sesi
const WRITE_THROTTLE_MS = 5 * 60000; // tulis ulang max tiap 5 menit

function _safeStorageGet(key) {
  try { return sessionStorage.getItem(key); } catch (_) { return null; }
}
function _safeStorageSet(key, val) {
  try { sessionStorage.setItem(key, val); } catch (_) {}
}
function _safeLocalGet(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}
function _safeLocalSet(key, val) {
  try { localStorage.setItem(key, val); } catch (_) {}
}

// ---------- Lokasi via IP (multi-provider, gratis tanpa key) ----------
// SUPER OPTIMIZE: cache hasil geo per sesi (30 menit) supaya tidak fetch
// berkali-kali tiap kunjungan/reload. Provider tunggal (ipapi.co) cukup;
// fallback ke ipwho.is hanya bila sumber pertama gagal total.
async function fetchGeo() {
  try {
    const cached = _safeStorageGet("__geo");
    if (cached) {
      const g = JSON.parse(cached);
      if (g && g._ts && Date.now() - g._ts < GEO_TTL_MS) {
        delete g._ts;
        return g;
      }
    }
  } catch (_) {}

  let result = null;
  // Sumber 1: ipapi.co/json — lengkap (city, region, postal, timezone, org/ISP)
  try {
    const j = await (await fetch("https://ipapi.co/json/")).json();
    if (j && !j.error) {
      result = {
        region: j.country_name || null,
        countryCode: j.country_code || null,
        timezone: j.timezone || null,
        ip: j.ip || null,
        latitude: typeof j.latitude === "number" ? j.latitude : null,
        longitude: typeof j.longitude === "number" ? j.longitude : null,
        city: j.city || null,
        postal: j.postal || null,
        regionName: j.region || null, // provinsi/negara bagian
        org: j.org || null,           // ISP
      };
    }
  } catch (_) {}

  // Sumber 2: ipwho.is — fallback
  try {
    const j = await (await fetch("https://ipwho.is/")).json();
    if (!result && j && (j.country || j.country_code || j.ip) && !j.success === false) {
      result = {
        region: j.country || j.country_name || null,
        countryCode: j.country_code || null,
        timezone: typeof j.timezone === "string" ? j.timezone : (j.timezone && j.timezone.id) || null,
        ip: j.ip || null,
        latitude: typeof j.latitude === "number" ? j.latitude : null,
        longitude: typeof j.longitude === "number" ? j.longitude : null,
        city: j.city || null,
        postal: j.postal || null,
        regionName: j.region || null,
        org: null,
      };
    }
  } catch (_) {}

  // Sumber 3: ipapi.com (format csv, tanpa key terbatas) — best-effort
  try {
    const j = await (await fetch("https://ipapi.com/json/")).json();
    if (!result && j && (j.country_name || j.ip)) {
      result = {
        region: j.country_name || null,
        countryCode: j.country_code || null,
        timezone: j.timezone ? j.timezone.id : null,
        ip: j.ip || null,
        latitude: typeof j.latitude === "number" ? j.latitude : null,
        longitude: typeof j.longitude === "number" ? j.longitude : null,
        city: j.city || null,
        postal: j.postal || null,
        regionName: j.region || j.region_name || null,
        org: null,
      };
    }
  } catch (_) {}

  const fallback = {
    region: null, countryCode: null, timezone: null, ip: null,
    latitude: null, longitude: null, city: null, postal: null,
    regionName: null, org: null,
  };
  if (result) {
    try { _safeStorageSet("__geo", JSON.stringify({ ...result, _ts: Date.now() })); } catch (_) {}
  }
  return result || fallback;
}

// ---------- Reverse geocode (alamat sedetail mungkin) ----------
// SUPER OPTIMIZE: cache hasil per koordinat (bulat ke 2 desimal) per sesi.
async function reverseGeocode(lat, lon) {
  const cacheKey = "__rg_" + Math.round(lat * 100) + "_" + Math.round(lon * 100);
  const cached = _safeStorageGet(cacheKey);
  if (cached) { try { return JSON.parse(cached); } catch (_) {} }
  try {
    // bigdatacloud — gratis, tanpa API key. localityLanguage=id untuk nama lokal.
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const parts = [
      j.locality, j.city, j.principalSubdivision, j.countryName,
    ].filter(Boolean);
    const out = {
      address: parts.join(", ") || null,
      city: j.city || j.locality || null,
      countryName: j.countryName || null,
      postal: j.postcode || null,
    };
    try { _safeStorageSet(cacheKey, JSON.stringify(out)); } catch (_) {}
    return out;
  } catch (_) {
    return null;
  }
}

// ---------- Device fingerprint (hash sederhana) ----------
async function computeDeviceId() {
  try {
    const w = typeof window !== "undefined" ? window : {};
    const nav = typeof navigator !== "undefined" ? navigator : {};
    const screenData = w.screen
      ? `${w.screen.width}x${w.screen.height}x${w.screen.colorDepth}`
      : "";

    const parts = [
      nav.userAgent || "",
      nav.language || "",
      nav.platform || "",
      screenData,
      (nav.hardwareConcurrency || ""),
      (nav.deviceMemory || ""),
      (new Date().getTimezoneOffset()),
    ];

    // canvas fingerprint (best-effort, tanpa menimbulkan error)
    let canvasHash = "";
    try {
      const c = document.createElement("canvas");
      c.width = 40; c.height = 40;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillStyle = "#f60";
        ctx.fillRect(0, 0, 40, 40);
        ctx.fillStyle = "#069";
        ctx.fillText("BABFT", 2, 14);
        canvasHash = c.toDataURL();
      }
    } catch (_) {}

    parts.push(canvasHash);

    const raw = parts.join("||");
    // SHA-256 via crypto.subtle (fallback ke fnv hash)
    if (crypto && crypto.subtle && crypto.subtle.digest) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
      const arr = Array.from(new Uint8Array(buf));
      return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return fnvHash(raw);
  } catch (_) {
    return null;
  }
}

function fnvHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ("0000000" + (h >>> 0).toString(16)).slice(-8);
}

// ---------- Parse user agent → info device ----------
function parseDevice(ua) {
  if (!ua) return { device: null, os: null, browser: null, deviceType: null };
  const uaStr = ua.toLowerCase();
  let os = "Unknown";
  let deviceType = "desktop";
  let browser = "Unknown";

  if (/windows nt/.test(uaStr)) os = "Windows";
  else if (/mac os x/.test(uaStr)) os = "macOS";
  else if (/android/.test(uaStr)) { os = "Android"; deviceType = "mobile"; }
  else if (/iphone|ipad|ipod/.test(uaStr)) { os = "iOS"; deviceType = /ipad/.test(uaStr) ? "tablet" : "mobile"; }
  else if (/linux/.test(uaStr)) os = "Linux";

  if (/edg\//.test(uaStr)) browser = "Edge";
  else if (/opr\//.test(uaStr) || /opera/.test(uaStr)) browser = "Opera";
  else if (/chrome|crios/.test(uaStr)) browser = "Chrome";
  else if (/firefox|fxios/.test(uaStr)) browser = "Firefox";
  else if (/safari/.test(uaStr) && !/chrome|crios|edg|opr/.test(uaStr)) browser = "Safari";

  // device generik
  let device = os;
  if (/iphone/.test(uaStr)) device = "iPhone";
  else if (/ipad/.test(uaStr)) device = "iPad";
  else if (/android/.test(uaStr)) device = "Android Phone";

  return { device, os, browser, deviceType };
}

// ---------- user = Firebase Auth user object ----------
// Kirim record visitor ke backend (panel -> Convex) via /api/ingest.
// `key` = id dokumen, `identity` = { email, displayName, photoURL },
// `isGuest` = penanda visitor anonim. Selalu tulis penuh (tanpa throttle
// ketat) supaya user yang login pertama kali langsung lengkap ter-record.
async function recordVisitor(key, identity, isGuest) {
  const now = Date.now();

  // geo (IP) + device fingerprint — parallel, tanpa GPS (tidak meminta izin).
  const [geo, deviceId] = await Promise.all([
    fetchGeo(), computeDeviceId(),
  ]);

  const latitude = geo.latitude;
  const longitude = geo.longitude;

  let addressFields = { address: null, city: geo.city, postal: geo.postal };
  if (latitude != null && longitude != null) {
    const rg = await reverseGeocode(latitude, longitude);
    if (rg) addressFields = {
      address: rg.address, city: rg.city || geo.city, postal: rg.postal || geo.postal,
    };
  }

  const nav = typeof navigator !== "undefined" ? navigator : {};
  const ua = nav.userAgent || "";
  const device = parseDevice(ua);
  const screen = (typeof window !== "undefined" && window.screen)
    ? `${window.screen.width}x${window.screen.height}`
    : null;

  const payload = {
    id: key,
    isGuest: isGuest,
    email: identity.email || null,
    displayName: identity.displayName || null,
    photoURL: identity.photoURL || null,
    online: true,
    lastOnlineAt: now,
    lastLoginAt: now,
    firstLoginAt: now,
    loginCount: 1,
    region: geo.region || null,
    countryCode: geo.countryCode || null,
    timezone: geo.timezone || null,
    ipAddress: geo.ip || null,
    regionName: geo.regionName || null,
    isp: geo.org || null,
    latitude: latitude != null ? latitude : null,
    longitude: longitude != null ? longitude : null,
    address: addressFields.address || null,
    city: addressFields.city || null,
    postal: addressFields.postal || null,
    deviceId: deviceId || null,
    device: device.device,
    os: device.os,
    browser: device.browser,
    deviceType: device.deviceType,
    screen: screen,
    language: nav.language || null,
    userAgent: ua,
    previousRegion: null,
    regionChangeCount: 0,
    // NOTE: flaggedAsVpn sengaja TIDAK dikirim dari klien. Deteksi VPN murni
    // dilakukan server-side (enrich → ipwho.is) supaya tidak tertimpa false.
    createdAt: now,
    updatedAt: now,
  };

  await ingest("user", { key, user: payload });

  // riwayat kunjungan (timeline) — hanya untuk user login (bukan guest).
  if (!isGuest) {
    await ingest("history", {
      uid: key,
      timestamp: now,
      data: {
        timestamp: now,
        region: geo.region || null,
        countryCode: geo.countryCode || null,
        city: addressFields.city || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        ipAddress: geo.ip || null,
        device: device.device,
        os: device.os,
        browser: device.browser,
        deviceType: device.deviceType,
        deviceId: deviceId || null,
      },
    });
  }
}

// Track user yang sudah login (punya uid).
export async function trackUser(user) {
  if (!user || !user.uid) return;
  try {
    await recordVisitor(user.uid, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }, false);
  } catch (e) {
    console.warn("[tracker] gagal mencatat user", e && e.message);
  }
}

// Track kunjungan halaman (visit) user yang sudah login — tulis SATU baris history
// tiap kali user berpindah halaman di SPA (state-navigation, bukan URL change),
// supaya timeline panel terus bertambah walau browser tidak di-reload.
export async function trackVisit(user, route) {
  if (!user || !user.uid) return;
  try {
    const [geo, deviceId] = await Promise.all([fetchGeo(), computeDeviceId()]);
    const now = Date.now();
    const nav = typeof navigator !== "undefined" ? navigator : {};
    const device = parseDevice(nav.userAgent || "");
    await ingest("history", {
      uid: user.uid,
      timestamp: now,
      data: {
        timestamp: now,
        route: route || null,
        region: geo.region || null,
        countryCode: geo.countryCode || null,
        city: geo.city || null,
        latitude: geo.latitude ?? null,
        longitude: geo.longitude ?? null,
        ipAddress: geo.ip || null,
        device: device.device,
        os: device.os,
        browser: device.browser,
        deviceType: device.deviceType,
        deviceId: deviceId || null,
      },
    });
  } catch (e) {
    console.warn("[tracker] gagal mencatat kunjungan", e && e.message);
  }
}

// Track visitor anonim (guest). Kunci dokumen = "guest_" + deviceId (fingerprint),
// supaya tiap perangkat anonim punya satu record tersendiri.
export async function trackGuest() {
  try {
    const deviceId = await computeDeviceId();
    if (!deviceId) return;
    const key = `guest_${deviceId}`;
    await recordVisitor(key, {
      email: null,
      displayName: "Guest",
      photoURL: null,
    }, true);
  } catch (e) {
    console.warn("[tracker] gagal mencatat guest", e && e.message);
  }
}

// Heartbeat: jaga status online user tetap segar (kirim setiap interval).
let _hbStarted = false;
let _lastUserId = null;

export function updateHeartbeatId(user) {
  if (user && user.uid) _lastUserId = user.uid;
}

export function startHeartbeat(intervalMs = 30000) {
  if (_hbStarted || typeof window === "undefined") return;
  _hbStarted = true;
  const tick = async () => {
    try {
      const now = Date.now();
      let deviceId = null;
      try { deviceId = await computeDeviceId(); } catch (_) {}
      const id = _lastUserId || (deviceId ? `guest_${deviceId}` : null);
      const route = window.location?.pathname || "/";
      if (id) {
        await ingest("health", { id, deviceId, timestamp: now });
      }
      await ingest("analytics", {
        eventId: `${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: now,
        kind: "heartbeat",
        deviceId: deviceId || null,
        data: { kind: "heartbeat", route, deviceId: deviceId || null, anonId: null, timestamp: now },
      });
    } catch (_) {}
  };
  const interval = setInterval(tick, intervalMs);
  try {
    window.addEventListener("beforeunload", () => clearInterval(interval));
  } catch (_) {}
}

