// ============================================================================
// BABFT User Tracker — mencatat aktifitas user ke koleksi `users` (Firestore)
// supaya terbaca oleh admin panel (admin-panel-babft.vercel.app).
//
// TIDAK ada kredensial/path database yang di-hardcode — Firestore instance
// dibuat dari config env yang sama (VITE_FIREBASE_*) dan koleksinya bernama
// `users`. Jika mau ganti nama koleksi, set env VITE_USERS_COLLECTION.
//
// Dipanggil otomatis dari AuthContext (onAuthStateChanged). Tidak memblok
// UI — semua error diserap (best-effort).
// ============================================================================

const GEO_URLS = ["https://ipwho.is/", "https://ipapi.co/json/"];
const USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION || "users";

let _fsCache = null;

// Lazy import firebase/firestore supaya tidak menambah beban bundle awal.
async function _firestore() {
  if (_fsCache) return _fsCache;
  const mod = await import("firebase/firestore");
  _fsCache = mod;
  return mod;
}

async function fetchGeo(retries = 2) {
  for (let i = 0; i < retries; i++) {
    for (const url of GEO_URLS) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const j = await r.json();
        if (j.country || j.country_code || j.ip) {
          return {
            region: j.country || j.country_name || null,
            countryCode: j.country_code || null,
            timezone: j.timezone || null,
            ip: j.ip || null,
          };
        }
      } catch (_) {
        /* next provider */
      }
    }
    await new Promise((r) => setTimeout(r, 700));
  }
  return { region: null, countryCode: null, timezone: null, ip: null };
}

// user = objek Firebase Auth (fields: uid, email, displayName, photoURL, providerData).
export async function trackUser(user) {
  if (!user || !user.uid) return;

  try {
    const fs = await _firestore();
    const { getFirestore } = await import("firebase/firestore");
    const { getApp } = await import("firebase/app");
    const app = getApp(); // instance yang sudah di-init di lib/firebase.js
    const db = getFirestore(app);

    const ref = fs.doc(db, USERS_COLLECTION, user.uid);
    const now = Date.now();

    // baca record lama (untuk deteksi perubahan region + jaga firstLoginAt)
    let prev = null;
    try {
      const snap = await fs.getDoc(ref);
      if (snap.exists()) prev = snap.data();
    } catch (_) {}

    const geo = await fetchGeo();

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
      previousRegion: (prev && prev.region) || null,
      regionChangeCount: changeCount,
      flaggedAsVpn: flagged,
      updatedAt: now,
      createdAt: (prev && prev.createdAt) || now,
    };

    await fs.setDoc(ref, payload, { merge: true });
  } catch (e) {
    // Best-effort: jangan pernah mengganggu UX website.
    console.warn("[tracker] gagal mencatat user", e && e.message);
  }
}
