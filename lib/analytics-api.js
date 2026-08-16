// ============================================================================
// BABFT Analytics API helper — agregasi data Firestore (punya-si-jawa) untuk
// dashboard admin-panel: % user topup, durasi pakai AI, dipakai buat apa,
// dan time-series harian (grafik naik/turun).
//
// Dipanggil dari endpoint admin (ai-chat.js?action=stats) — BUKAN serverless
// function sendiri, jadi tidak menambah hitungan Hobby 12 function.
// ============================================================================

import { getPunyaSiJawaFirestore } from "./api-helpers.js";

const _cached = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 detik — cukup buat grafik realtime-ish

function dayKey(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toMillis(v) {
  if (v == null) return null;
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  if (v && typeof v === "object") {
    if (v._seconds != null) return v._seconds * 1000;
    if (v.seconds != null) return v.seconds * 1000;
  }
  if (v instanceof Date && !isNaN(v)) return v.getTime();
  const n = Number(v);
  if (!isNaN(n)) return n < 1e12 ? n * 1000 : n;
  return null;
}

// Klasifikasi topik pertanyaan AI -> kategori "dipakai buat apa".
function classifyTopic(text) {
  if (!text) return "lainnya";
  const t = text.toLowerCase();
  if (/(logic gate|gerbang logika|and|or|not|nand|nor|xor|xnor|rangkaian|circuit|sirkuit|truth table|tabel kebenaran)/.test(t)) return "logic-gates";
  if (/(gear|gigi|roda gigi|mekanik|mesin|motor)/.test(t)) return "gears";
  if (/(quiz|kuis|soal|latihan|ujian|tes)/.test(t)) return "quiz";
  if (/(kode|coding|script|program|python|javascript|html|css|website|bot|app|aplikasi)/.test(t)) return "coding";
  if (/(materi|pelajaran|belajar|tutorial|cara|gimana|bagaimana|jelasin|jelaskan)/.test(t)) return "belajar";
  if (/(gold|koin|topup|top up|beli|paket|timer|waktu ai|harga)/.test(t)) return "gold/topup";
  return "lainnya";
}

async function getUserSnapshot(db) {
  return db.collection("users").get();
}

async function getAIAccessSnapshot(db) {
  return db.collection("ai_access").get();
}

async function getGoldLogSnapshot(db) {
  return db.collection("gold_log").get();
}

// ============================================================================
// getAnalyticsStats() — agregasi lengkap untuk dashboard.
// ============================================================================
export async function getAnalyticsStats() {
  const db = await getPunyaSiJawaFirestore();

  const [usersSnap, aiSnap, goldLogSnap] = await Promise.all([
    getUserSnapshot(db),
    getAIAccessSnapshot(db),
    getGoldLogSnapshot(db),
  ]);

  const totalUsers = usersSnap.size;

  // ---- topup: gold_log type spend_ai / buy / any type yang menandakan pembelian ----
  const buyerUids = new Set();
  const buyDays = new Map(); // day -> count transaksi pembelian
  let totalBuyTransactions = 0;
  let totalGoldSpent = 0;

  goldLogSnap.docs.forEach((d) => {
    const x = d.data();
    const type = x.type || "";
    // Semua transaksi topup/pembelian: spend_ai (beli waktu) & topup_member / admin_grant dianggap topup.
    const isPurchase = type === "spend_ai" || type === "topup" || type === "topup_member" || type === "buy";
    if (isPurchase || type === "spend_ai") {
      if (x.uid) buyerUids.add(x.uid);
      totalBuyTransactions++;
      const amt = Math.max(0, Number(x.amount) || 0);
      if (type === "spend_ai") totalGoldSpent += amt;
      const dk = dayKey(toMillis(x.createdAt) || (x.createdAt && x.createdAt._seconds ? x.createdAt._seconds * 1000 : null));
      if (dk) buyDays.set(dk, (buyDays.get(dk) || 0) + 1);
    }
  });

  // ---- durasi pakai AI: dari ai_access ----
  let aiUsers = 0;
  let activeTimers = 0;
  let totalRemainingMinutes = 0;
  let totalTimerMinutesPurchased = 0;
  const now = Date.now();
  const activeDays = new Map();

  aiSnap.docs.forEach((d) => {
    const x = d.data();
    aiUsers++;
    const remaining = Math.max(0, Number(x.remainingMinutes) || 0);
    totalRemainingMinutes += remaining;

    const boughtMinutes = Number(x.totalMinutesPurchased) || 0;
    totalTimerMinutesPurchased += boughtMinutes;

    const startedMs = toMillis(x.timerStartedAt);
    const expiresMs = toMillis(x.timerExpiresAt);

    if (startedMs && expiresMs && startedMs <= now && now < expiresMs) {
      activeTimers++;
      const dk = dayKey(startedMs);
      if (dk) activeDays.set(dk, (activeDays.get(dk) || 0) + 1);
    }
    // catat hari pembelian sebagai indikator aktivitas AI
    const lastBuyMs = toMillis(x.lastBuyAt);
    if (lastBuyMs) {
      const dk = dayKey(lastBuyMs);
      if (dk) activeDays.set(dk, (activeDays.get(dk) || 0) + 1);
    }
  });

  const percentTopup = totalUsers > 0 ? +((buyerUids.size / totalUsers) * 100).toFixed(2) : 0;

  // ---- time-series harian (gabungan transaksi & aktivitas) ----
  const seriesMap = new Map();
  buyDays.forEach((count, dk) => {
    const row = seriesMap.get(dk) || { date: dk, purchases: 0, activeAI: 0 };
    row.purchases += count;
    seriesMap.set(dk, row);
  });
  activeDays.forEach((count, dk) => {
    const row = seriesMap.get(dk) || { date: dk, purchases: 0, activeAI: 0 };
    row.activeAI += count;
    seriesMap.set(dk, row);
  });

  const timeSeries = Array.from(seriesMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, r]) => ({ date, purchases: r.purchases, activeAI: r.activeAI }));

  return {
    generatedAt: Date.now(),
    totals: {
      totalUsers,
      paidUsers: buyerUids.size,
      percentTopup,
      totalBuyTransactions,
      totalGoldSpent,
      aiAccessUsers: aiUsers,
      activeTimersNow: activeTimers,
      totalRemainingMinutes,
      totalTimerMinutesPurchased,
    },
    timeSeries,
  };
}

// ============================================================================
// getTopicUsage() — distribusi topik pertanyaan AI ("dipakai buat apa").
// Diambil dari koleksi ai_chat_log bila ada; fallback: kosong (frontend yang
// nanti kirim via ingest). Aman tanpa error.
// ============================================================================
export async function getTopicUsage() {
  const db = await getPunyaSiJawaFirestore();
  const topics = new Map();
  try {
    const snap = await db.collection("ai_chat_log").get();
    snap.docs.forEach((d) => {
      const q = d.data().message || d.data().question || "";
      const cat = classifyTopic(q);
      topics.set(cat, (topics.get(cat) || 0) + 1);
    });
  } catch (_) {
    // koleksi belum ada — return kosong
  }
  return Array.from(topics.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);
}

// Rekam topik pertanyaan (best-effort) — dipanggil tiap user chat agar "dipakai
// buat apa" terisi. Aman fail-silent.
export async function logChatTopic(uid, message) {
  if (!uid || !message) return;
  try {
    const db = await getPunyaSiJawaFirestore();
    await db.collection("ai_chat_log").add({
      uid,
      message: String(message).slice(0, 500),
      topic: classifyTopic(message),
      createdAt: new Date(),
    });
  } catch (_) {}
}
