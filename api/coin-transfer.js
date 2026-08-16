import { applyCors, applySecurityHeaders, checkRateLimit, authenticateRequest, isAdmin, safeError } from "../lib/api-helpers.js";
import { transferGold, getGoldBalance, getRecentTransfers, addGold } from "../lib/gold-system.js";

// ── Coin Transfer API ──────────────────────────────────────
// POST ?action=transfer   — Member kirim coin ke member lain
// POST ?action=grant      — Admin bagi coin ke member (tanpa potong saldo admin)
// GET  ?action=history    — Liat riwayat transfer
// GET  ?action=balance    — Cek saldo user (by uid, admin only)
// ───────────────────────────────────────────────────────────

const MAX_TRANSFER_AMOUNT = 1000;
const MIN_TRANSFER_AMOUNT = 1;

export default async function handler(req, res) {
  applyCors(req, res, "GET, POST, OPTIONS");
  applySecurityHeaders(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  const action = req.query?.action || null;

  // ── GET: history or balance lookup ──
  if (req.method === "GET") {
    // Transfer history for logged-in user
    if (action === "history") {
      try {
        const user = await authenticateRequest(req);
        if (!user) return res.status(401).json({ error: "Login required" });
        const limit = Math.min(parseInt(req.query?.limit || "20", 10), 50);
        const transfers = await getRecentTransfers(user.sub, limit);
        return res.status(200).json({ transfers });
      } catch (e) {
        console.error("[coin-transfer] history error:", e?.message || e);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    // Balance lookup (admin only, or self)
    if (action === "balance") {
      try {
        const user = await authenticateRequest(req);
        if (!user) return res.status(401).json({ error: "Login required" });

        const targetUid = req.query?.uid || user.sub;
        const admin = isAdmin(user);

        // Non-admin can only check own balance
        if (!admin && targetUid !== user.sub) {
          return res.status(403).json({ error: "Hanya bisa cek saldo sendiri" });
        }

        const gold = await getGoldBalance(targetUid);
        return res.status(200).json({ uid: targetUid, gold });
      } catch (e) {
        console.error("[coin-transfer] balance error:", e?.message || e);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    return res.status(200).json({ status: "ok", actions: ["transfer", "grant", "history", "balance"] });
  }

  // ── POST actions ──
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await authenticateRequest(req);
    if (!user) return res.status(401).json({ error: "Login required" });
    const uid = user.sub;
    const admin = isAdmin(user);

    // Rate limit: max 5 transfers per minute
    if (!checkRateLimit("coin-transfer:" + uid, 5, 60000)) {
      return res.status(429).json({ error: "Terlalu banyak transfer. Tunggu sebentar." });
    }

    // ── Member → Member transfer ──
    if (action === "transfer") {
      const { targetUid, amount, note } = req.body || {};

      if (!targetUid || typeof targetUid !== "string" || targetUid.trim().length < 5) {
        return res.status(400).json({ error: "targetUid wajib diisi (Firebase UID valid)" });
      }
      if (!amount || typeof amount !== "number" || amount < MIN_TRANSFER_AMOUNT || amount > MAX_TRANSFER_AMOUNT) {
        return res.status(400).json({ error: `Amount wajib ${MIN_TRANSFER_AMOUNT}-${MAX_TRANSFER_AMOUNT} gold` });
      }
      if (targetUid === uid) {
        return res.status(400).json({ error: "Nggak bisa transfer ke diri sendiri 😅" });
      }

      // Admin has infinite gold, so skip transferGold for admin — use addGold instead
      if (admin) {
        const newBalance = await addGold(targetUid, amount, "admin_grant", {
          grantedBy: uid,
          note: note || null,
        });
        return res.status(200).json({
          message: "Gold berhasil dikirim (admin grant)",
          transferId: `admin_${Date.now()}`,
          targetUid,
          amount,
          targetNewBalance: newBalance,
        });
      }

      try {
        const result = await transferGold(uid, targetUid, amount, {
          note: note || null,
        });
        return res.status(200).json({
          message: "Transfer berhasil!",
          ...result,
        });
      } catch (e) {
        if (e.message === "insufficient gold") {
          const currentGold = await getGoldBalance(uid);
          return res.status(402).json({ error: "Gold kamu kurang!", gold: currentGold, needed: amount });
        }
        if (e.message === "recipient not found") {
          return res.status(404).json({ error: "User tujuan tidak ditemukan. Pastikan UID benar dan user sudah pernah login." });
        }
        if (e.message === "cannot transfer to self") {
          return res.status(400).json({ error: "Nggak bisa transfer ke diri sendiri 😅" });
        }
        throw e;
      }
    }

    // ── Admin grant (no deduction from admin) ──
    if (action === "grant") {
      if (!admin) return res.status(403).json({ error: "Hanya admin yang bisa grant gold" });
      const { targetUid, amount, note } = req.body || {};
      if (!targetUid || !amount || amount <= 0 || amount > 10000) {
        return res.status(400).json({ error: "targetUid dan amount wajib diisi (1-10000)" });
      }
      const newBalance = await addGold(targetUid, amount, "admin_grant", {
        grantedBy: uid,
        note: note || null,
      });
      return res.status(200).json({
        message: "Gold berhasil di-grant",
        uid: targetUid,
        amount,
        newBalance,
      });
    }

    return res.status(400).json({ error: "Unknown action. Use: transfer, grant, history, balance" });
  } catch (e) {
    console.error("[coin-transfer]", e?.message || e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
