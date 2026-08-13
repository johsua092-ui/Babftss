// ============================================================================
// BABFT User Tracker — mencatat aktifitas user ke koleksi `users` (Firestore)
// supaya terbaca oleh admin panel (admin-panel-babft.vercel.app).
//
// Data yang dicatat:
//   - identitas: uid, email, displayName, photoURL
//   - online:    online, lastOnlineAt, lastLoginAt, firstLoginAt, loginCount
//   - lokasi:    region, countryCode, timezone, ipAddress, latitude, longitude,
//                accuracy (akurasi GPS, meter), address (alamat dari reverse
//                geocode), city, postal
//   - perangkat: deviceId (fingerprint hash), device (nama OS/browser), os,
//                browser, deviceType (mobile/tablet/desktop), screen, language,
//                userAgent
//   - VPN:       previousRegion, regionChangeCount, flaggedAsVpn
//
// TIDAK ada kredensial/hardcode — Firestore dibuat dari app yang sudah di-init
// (src/lib/firebase.js) dan koleksi default `users`.
// ============================================================================

const GEO_URLS = ["https://ipwho.is/", "https://ipapi.co/json/"];
const USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION || "users";

let _fsCache = null;
let _lastGeo = null;

async function _firestore() {
  if (_fsCache) return _fsCache;
  _fsCache = await import("firebase/firestore");
  return _fsCache;
}

// ---------- Lokasi via IP (fallback) ----------
async function fetchGeo(retries = 2) {
  for (let i = 0; i < retries; i++) {
    for (const url of GEO_URLS) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const j = await r.json();
        if (j.country || j.country_code || j.ip) {
          const geo = {
            region: j.country || j.country_name || null,
            countryCode: j.country_code || null,
            timezone: j.timezone || null,
            ip: j.ip || null,
            latitude: typeof j.latitude === "number" ? j.latitude : null,
            longitude: typeof j.longitude === "number" ? j.longitude : null,
            city: j.city || null,
            postal: j.postal || null,
          };
          _lastGeo = geo;
          return geo;
        }
      } catch (_) { /* next */ }
    }
    await new Promise((r) => setTimeout(r, 700));
  }
  return { region: null, countryCode: null, timezone: null, ip: null, latitude: null, longitude: null, city: null, postal: null };
}

// ---------- GPS presisi (izin user) ----------
function getPreciseLocation(timeoutMs = 6000) {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy || null, // meter
        });
      },
      () => { clearTimeout(timer); resolve(null); },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 300000 }
    );
  });
}

// ---------- Reverse geocode (alamat) ----------
async function reverseGeocode(lat, lon) {
  try {
    // bigdatacloud — gratis, tanpa API key
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
export async function trackUser(user) {
  if (!user || !user.uid) return;

  try {
    const fs = await _firestore();
    const { getFirestore } = await import("firebase/firestore");
    const { getApp } = await import("firebase/app");
    const db = getFirestore(getApp());

    const ref = fs.doc(db, USERS_COLLECTION, user.uid);
    const now = Date.now();

    let prev = null;
    try {
      const snap = await fs.getDoc(ref);
      if (snap.exists()) prev = snap.data();
    } catch (_) {}

    // parallel: geo (IP), GPS presisi, device, reverse geocode independent
    const geoPromise = fetchGeo();
    const gpsPromise = getPreciseLocation();
    const devPromise = computeDeviceId();

    const [geo, gps, deviceId] = await Promise.all([geoPromise, gpsPromise, devPromise]);

    // koordinat: prioritaskan GPS presisi, fallback ke IP
    let latitude = gps ? gps.latitude : geo.latitude;
    let longitude = gps ? gps.longitude : geo.longitude;
    const accuracy = gps && gps.accuracy != null ? gps.accuracy : null;

    // alamat: reverse geocode dari koordinat terbaik
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
      uid: user.uid,
      email: user.email || (prev && prev.email) || null,
      displayName: user.displayName || (prev && prev.displayName) || null,
      photoURL: user.photoURL || (prev && prev.photoURL) || null,

      online: true,
      lastOnlineAt: now,
      lastLoginAt: now,
      firstLoginAt: (prev && prev.firstLoginAt) || now,
      loginCount: ((prev && prev.loginCount) || 0) + 1,

      region: geo.region || (prev && prev.region) || null,
      countryCode: geo.countryCode || (prev && prev.countryCode) || null,
      timezone: geo.timezone || (prev && prev.timezone) || null,
      ipAddress: geo.ip || (prev && prev.ipAddress) || null,

      // lokasi presisi + alamat
      latitude: latitude != null ? latitude : (prev && prev.latitude) || null,
      longitude: longitude != null ? longitude : (prev && prev.longitude) || null,
      accuracy: accuracy != null ? accuracy : (prev && prev.accuracy) || null,
      address: addressFields.address || (prev && prev.address) || null,
      city: addressFields.city || (prev && prev.city) || null,
      postal: addressFields.postal || (prev && prev.postal) || null,

      // perangkat
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
  } catch (e) {
    console.warn("[tracker] gagal mencatat user", e && e.message);
  }
}

