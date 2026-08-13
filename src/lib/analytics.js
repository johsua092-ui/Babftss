// ============================================================================
// BABFT Analytics — pencatatan event analitik + error ke Firestore
// (koleksi `analytics`) supaya admin panel bisa menampilkan:
//   - jejak error (JS error, login gagal, API gagal)
//   - aktivitas login (sukses/gagal) untuk deteksi percobaan brute-force / DDoS
//   - heartbeat/request rate untuk deteksi lonjakan mencurigakan
//
// Best-effort: semua error diserap, tidak pernah mengganggu UX website.
// ============================================================================

const ANALYTICS_COLLECTION = import.meta.env.VITE_ANALYTICS_COLLECTION || "analytics";

let _fs = null;
async function _firestore() {
  if (_fs) return _fs;
  _fs = await import("firebase/firestore");
  return _fs;
}

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

// Tulis satu event ke koleksi `analytics`. `kind` = tipe event.
export async function logEvent(kind, detail = {}) {
  try {
    const fs = await _firestore();
    const { getFirestore } = await import("firebase/firestore");
    const { getApp } = await import("firebase/app");
    const db = getFirestore(getApp());

    const devId = await deviceId();
    const now = Date.now();
    const id = `${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const payload = {
      kind, // error | login_success | login_failed | heartbeat | request
      ...detail,
      ip: null, // diisi server-side tidak perlu; IP bisa digabung dari geo provider
      deviceId: devId,
      anonId: anonId(),
      timestamp: now,
      // Untuk agregasi cepat oleh admin (tanpa query berat)
      minutes: Math.floor(now / 60000),
      hour: Math.floor(now / 3600000),
    };

    await fs.setDoc(fs.doc(db, ANALYTICS_COLLECTION, id), payload);
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
