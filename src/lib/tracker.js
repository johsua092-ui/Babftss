// ============================================================================
// BABFT User Tracker — mencatat aktifitas user ke koleksi `users` (Firestore)
// supaya terbaca oleh admin panel (admin-panel-babft.vercel.app).
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
// TIDAK ada kredensial/hardcode — Firestore dibuat dari app yang sudah di-init
// (src/lib/firebase.js) dan koleksi default `users`.
// ============================================================================

const USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION || "users";

let _fsCache = null;

async function _firestore() {
  if (_fsCache) return _fsCache;
  _fsCache = await import("firebase/firestore");
  return _fsCache;
}

// ---------- Lokasi via IP (multi-provider, gratis tanpa key) ----------
// Gabungkan beberapa sumber untuk resolusi seakurat mungkin (kota, kode pos,
// region, ISP, koordinat). TANPA GPS → tidak memicu notifikasi izin lokasi.
async function fetchGeo() {
  // Sumber 1: ipapi.co/json — lengkap (city, region, postal, timezone, org/ISP)
  try {
    const j = await (await fetch("https://ipapi.co/json/")).json();
    if (j && !j.error) {
      return {
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
    if (j && (j.country || j.country_code || j.ip) && !j.success === false) {
      return {
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
    if (j && (j.country_name || j.ip)) {
      return {
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

  return {
    region: null, countryCode: null, timezone: null, ip: null,
    latitude: null, longitude: null, city: null, postal: null,
    regionName: null, org: null,
  };
}

// ---------- Reverse geocode (alamat sedetail mungkin) ----------
async function reverseGeocode(lat, lon) {
  try {
    // bigdatacloud — gratis, tanpa API key. localityLanguage=id untuk nama lokal.
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const parts = [
      j.locality, j.city, j.principalSubdivision, j.countryName,
    ].filter(Boolean);
    return {
      address: parts.join(", ") || null,
      city: j.city || j.locality || null,
      countryName: j.countryName || null,
      postal: j.postcode || null,
    };
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
// Inti: tulis record visitor ke Firestore. `key` = id dokumen, `identity` =
// { email, displayName, photoURL }, `isGuest` = penanda visitor anonim.
async function recordVisitor(key, identity, isGuest) {
  const fs = await _firestore();
  const { getFirestore } = await import("firebase/firestore");
  const { getApp } = await import("firebase/app");
  const db = getFirestore(getApp());

  const ref = fs.doc(db, USERS_COLLECTION, key);
  const now = Date.now();

  let prev = null;
  try {
    const snap = await fs.getDoc(ref);
    if (snap.exists()) prev = snap.data();
  } catch (_) {}

  // parallel: geo (IP) + device fingerprint. TANPA GPS (tidak memicu izin lokasi).
  const [geo, deviceId] = await Promise.all([
    fetchGeo(), computeDeviceId(),
  ]);

  // koordinat dari IP (geolokasi dikerjakan server-side oleh provider IP)
  const latitude = geo.latitude;
  const longitude = geo.longitude;

  // alamat: reverse geocode dari koordinat IP (seakurat mungkin, tanpa izin user)
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

  // VPN detection
  let flagged = (prev && prev.flaggedAsVpn) || false;
  let changeCount = (prev && prev.regionChangeCount) || 0;
  if (prev && prev.region && geo.region && prev.region !== geo.region) {
    flagged = true;
    changeCount += 1;
  }

  const payload = {
    ...(isGuest ? {} : { uid: key }),
    isGuest: isGuest || (prev && prev.isGuest) || false,
    email: identity.email || (prev && prev.email) || null,
    displayName: identity.displayName || (prev && prev.displayName) || null,
    photoURL: identity.photoURL || (prev && prev.photoURL) || null,

    online: true,
    lastOnlineAt: now,
    lastLoginAt: now,
    firstLoginAt: (prev && prev.firstLoginAt) || now,
    loginCount: ((prev && prev.loginCount) || 0) + 1,

    region: geo.region || (prev && prev.region) || null,
    countryCode: geo.countryCode || (prev && prev.countryCode) || null,
    timezone: geo.timezone || (prev && prev.timezone) || null,
    ipAddress: geo.ip || (prev && prev.ipAddress) || null,
    regionName: geo.regionName || (prev && prev.regionName) || null,
    isp: geo.org || (prev && prev.isp) || null,

    latitude: latitude != null ? latitude : (prev && prev.latitude) || null,
    longitude: longitude != null ? longitude : (prev && prev.longitude) || null,
    address: addressFields.address || (prev && prev.address) || null,
    city: addressFields.city || (prev && prev.city) || null,
    postal: addressFields.postal || (prev && prev.postal) || null,

    deviceId: deviceId || (prev && prev.deviceId) || null,
    device: device.device,
    os: device.os,
    browser: device.browser,
    deviceType: device.deviceType,
    screen: screen,
    language: nav.language || null,
    userAgent: ua,

    previousRegion: (prev && prev.region) || null,
    regionChangeCount: changeCount,
    flaggedAsVpn: flagged,
    updatedAt: now,
    createdAt: (prev && prev.createdAt) || now,
  };

  await fs.setDoc(ref, payload, { merge: true });

  // Simpan riwayat kunjungan/login ke subkoleksi `history` (untuk timeline).
  // Hanya untuk user login (punya uid), dan di-throttle agar tidak spam:
  // catat bila > 30 detik sejak kunjungan terakhir.
  try {
    const lastVisit = (prev && prev.lastLoginAt) || 0;
    if (!isGuest && now - lastVisit > 30000) {
      const historyRef = fs.doc(fs.collection(db, USERS_COLLECTION, key, "history"), now.toString());
      await fs.setDoc(historyRef, {
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
      });
    }
  } catch (_) {}
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

// Heartbeat ringkas — dipanggil periodik (mis. tiap 60s) untuk mencatat
// aktivitas kunjungan, dipakai admin panel untuk deteksi lonjakan traffic.
let _hbStarted = false;
export function startHeartbeat(intervalMs = 60000) {
  if (_hbStarted || typeof window === "undefined") return;
  _hbStarted = true;
  const tick = async () => {
    try {
      const { logEvent } = await import("./analytics");
      await logEvent("heartbeat", { route: window.location?.pathname || "/" });
    } catch (_) {}
  };
  tick();
  setInterval(tick, intervalMs);
}

