const INGEST_URL = import.meta.env.VITE_INGEST_URL || "https://admin-panel-babft.vercel.app/api/ingest";

export async function ingest(type, payload) {
  try {
    const res = await fetch(INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
