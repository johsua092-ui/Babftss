// ============================================================================
// BABFT Analytics — pencatatan event analitik + error ke Firestore
// (koleksi `analytics`) supaya admin panel bisa menampilkan:
//   - jejak error (JS error, login gagal, API gagal)
//   - aktivitas login (sukses/gagal) untuk deteksi percobaan brute-force / DDoS
//   - heartbeat/request rate untuk deteksi lonjakan mencurigakan
//
// Best-effort: semua error diserap, tidak pernah mengganggu UX website.
// ============================================================================

import { ingest } from "./ingest";

function anonId() {
  try {
    let id = sessionStorage.getItem("__anon");
    if (!id) {
      id = "x" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("__anon", id);
    }
    return id;
  } catch (_) {
    return "x" + Math.random().toString(36).slice(2);
  }
}

let _cachedDeviceId = null;
async function deviceId() {
  if (_cachedDeviceId) return _cachedDeviceId;
  try {
    const raw = `${navigator.userAgent}||${navigator.language}||${screen?.width}x${screen?.height}`;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
    _cachedDeviceId = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (_) {
    _cachedDeviceId = "d" + Math.random().toString(36).slice(2);
  }
  return _cachedDeviceId;
}

// SUPER OPTIMIZE: throttle event agar tidak spam tulis Firestore.
// - error yang sama (pesan identik) ditahan 60 detik
// - event umum di-throttle 10 detik per jenis
const _lastEvent = {};

// SUPER OPTIMIZE: throttle error identik (kind+message sama) supaya tidak
// spam koleksi `analytics`. Error berulang dari loop render bisa banjir tulis.
const _errThrottle = new Map();
const ERR_THROTTLE_MS = 5 * 60000; // max tiap 5 menit untuk error identik

// Tulis satu event ke koleksi `analytics`. `kind` = tipe event.
export async function logEvent(kind, detail = {}) {
  if (kind === "error") {
    const sig = (detail.message || "") + "|" + (detail.type || "");
    const last = _errThrottle.get(sig) || 0;
    const now = Date.now();
    if (now - last < ERR_THROTTLE_MS) return;
    _errThrottle.set(sig, now);
  }
  try {
    const now = Date.now();
    const key = kind + "|" + (detail.message || detail.error || detail.method || "").toString().slice(0, 60);
    const last = _lastEvent[key] || 0;
    if (now - last < 10000) return;
    _lastEvent[key] = now;

    const devId = await deviceId();
    const eventId = `${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const payload = {
      kind,
      ...detail,
      deviceId: devId,
      anonId: anonId(),
      timestamp: now,
      minutes: Math.floor(now / 60000),
      hour: Math.floor(now / 3600000),
    };

    await ingest("analytics", { eventId, timestamp: now, kind, deviceId: devId, data: payload });
  } catch (e) {
    console.warn("[analytics] gagal tulis event", e && e.message);
  }
}

// Global error tracking + unhandled rejection.
export function initErrorTracking() {
  if (typeof window === "undefined") return;
  try {
    window.addEventListener("error", (ev) => {
      logEvent("error", {
        type: "js",
        message: ev.message || "unknown",
        source: ev.filename || null,
        line: ev.lineno || null,
        col: ev.colno || null,
        href: window.location?.href || null,
      });
    });
    window.addEventListener("unhandledrejection", (ev) => {
      logEvent("error", {
        type: "promise",
        message: ev.reason && ev.reason.message ? ev.reason.message : String(ev.reason || "unhandled rejection"),
        href: window.location?.href || null,
      });
    });
  } catch (_) {}
}
