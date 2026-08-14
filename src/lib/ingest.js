// Ingest — kirim tracking (user / online / history / analytics) ke admin panel
// endpoint /api/ingest (server-side) yang meneruskan ke Convex. Frontend TIDAK
// menyentuh Convex / Firestore langsung; hanya POST ke endpoint ini dengan
// shared secret (VITE_INGEST_SECRET) + origin yang di-whitelist di panel.

const INGEST_URL = import.meta.env.VITE_INGEST_URL || "https://admin-panel-babft.vercel.app/api/ingest";
const INGEST_SECRET = import.meta.env.VITE_INGEST_SECRET || "";

export async function ingest(type, payload) {
  try {
    const res = await fetch(INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ingest-key": INGEST_SECRET,
      },
      body: JSON.stringify({ type, ...payload }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.warn("[ingest] HTTP", res.status, type, t.slice(0, 200));
      return { ok: false, status: res.status };
    }
    return await res.json();
  } catch (e) {
    console.warn("[ingest] gagal", type, e && e.message);
    return { ok: false, error: e && e.message };
  }
}
