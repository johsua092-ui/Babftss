// ============================================================================
// gold-system.js (TURSO EDITION)
//
// Originally a Firestore-backed module. Migrated to Turso (libSQL) so all
// gold/inbox/announcements/ai_access/ai_chat_log data lives in the SAME
// database as the admin panel and marketplace — full sync across all
// surfaces.
//
// Public API surface (exports) preserved identical to the old Firestore
// version so api/ai-chat.js + lib/marketplace.js don't need changes.
// ============================================================================

import { createClient } from "@libsql/client";
import { isAdminUid } from "./api-helpers.js";

const AI_PACKAGES = [
  { id: "starter", label: "5 Menit", minutes: 5, gold: 12 },
  { id: "basic", label: "15 Menit", minutes: 15, gold: 32 },
  { id: "standard", label: "30 Menit", minutes: 30, gold: 58 },
  { id: "premium", label: "60 Menit", minutes: 60, gold: 105 },
];

const BUY_COOLDOWN_MS = 3000;
const TRANSFER_TAX_RATE = 0.05;
const ANNOUNCEMENT_MAX_TITLE = 200;
const ANNOUNCEMENT_MAX_BODY = 5000;

function db() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL belum diset.");
  return createClient({ url, authToken: token });
}

function num(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v))) return Number(v);
  if (typeof v === "bigint") return Number(v);
  return 0;
}

function bool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") return v === "1" || v === "true";
  return false;
}

function toMillis(v) {
  if (v == null) return null;
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  if (typeof v === "string") {
    const n = Number(v);
    if (!isNaN(n)) return n < 1e12 ? n * 1000 : n;
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.getTime();
    return null;
  }
  if (typeof v === "object") {
    const o = v;
    if (typeof o._seconds === "number") return o._seconds * 1000;
    if (typeof o.seconds === "number") return o.seconds * 1000;
  }
  return null;
}

export function getTransferTax(amount) {
  return Math.ceil(amount * TRANSFER_TAX_RATE);
}

export function getReceiveAmount(amount) {
  return amount - getTransferTax(amount);
}

export function getPackages() {
  return AI_PACKAGES.map((p) => ({
    id: p.id,
    label: p.label,
    minutes: p.minutes,
    gold: p.gold,
    rate: +(p.gold / p.minutes).toFixed(2),
  }));
}

export function findPackage(packageId) {
  return AI_PACKAGES.find((p) => p.id === packageId) || null;
}

// ──────────────────────────────────────────────────────────────────────────
// User helpers
// ──────────────────────────────────────────────────────────────────────────

export async function lookupUserByEmail(email) {
  if (!email || typeof email !== "string") return null;
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.includes("@")) return null;
  const c = db();
  const r = await c.execute({
    sql: "SELECT id, uid, email, displayName, gold FROM users WHERE LOWER(COALESCE(email, '')) = ? AND deleted = 0 LIMIT 1",
    args: [normalizedEmail],
  });
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return {
    uid: String(row.id ?? row.uid ?? ""),
    email: row.email ? String(row.email) : null,
    displayName: row.displayName ? String(row.displayName) : null,
    gold: num(row.gold),
  };
}

export async function ensureUserDoc(uid, email, displayName) {
  if (!uid) return;
  const c = db();
  const cleanEmail = (email || "").trim().toLowerCase() || null;
  const cleanName = (displayName || "").trim() || null;
  const now = Date.now();

  // Use INSERT ON CONFLICT to avoid race condition with admin-panel-babft ingest
  // (which also upserts users via tracker.js → /api/ingest)
  await c.execute({
    sql: `INSERT INTO users (id, uid, email, displayName, gold, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            email = COALESCE(NULLIF(users.email, ''), excluded.email),
            displayName = COALESCE(NULLIF(users.displayName, ''), excluded.displayName),
            updatedAt = excluded.updatedAt`,
    args: [uid, uid, cleanEmail, cleanName, isAdminUid(uid) ? 99999999 : 0, now, now],
  });

  // After upsert, if this is an admin, ensure gold stays at 99999999 (in case
  // an earlier non-admin insert set it to 0 — re-bump here)
  if (isAdminUid(uid)) {
    await c.execute({
      sql: "UPDATE users SET gold = 99999999, updatedAt = ? WHERE id = ? AND gold < 99999999",
      args: [now, uid],
    });
  }
}

export async function getAllUsers() {
  const c = db();
  const r = await c.execute(
    "SELECT id, email, displayName, gold FROM users WHERE deleted = 0 ORDER BY COALESCE(lastLoginAt, 0) DESC LIMIT 500"
  );
  return r.rows.map((row) => ({
    uid: String(row.id),
    email: row.email ? String(row.email) : null,
    displayName: row.displayName ? String(row.displayName) : null,
    gold: num(row.gold),
  }));
}

// ──────────────────────────────────────────────────────────────────────────
// Gold operations
// ──────────────────────────────────────────────────────────────────────────

export async function getGoldBalance(uid) {
  const c = db();
  const r = await c.execute({
    sql: "SELECT gold FROM users WHERE id = ? AND deleted = 0",
    args: [uid],
  });
  if (r.rows.length === 0) return 0;
  return num(r.rows[0].gold);
}

export async function setGoldBalance(uid, gold) {
  const c = db();
  const now = Date.now();
  await c.execute({
    sql: "UPDATE users SET gold = ?, updatedAt = ? WHERE id = ? AND deleted = 0",
    args: [Math.max(0, num(gold)), now, uid],
  });
  return num(gold);
}

async function writeGoldLog(uid, type, amount, balanceAfter, meta = {}) {
  const c = db();
  await c.execute({
    sql: "INSERT INTO gold_log (uid, email, type, amount, balanceAfter, createdAt, meta) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [
      uid,
      meta.adminEmail || null,
      type,
      amount,
      balanceAfter,
      Date.now(),
      JSON.stringify(meta || {}),
    ],
  });
}

export async function addGold(uid, amount, type, meta = {}) {
  if (amount <= 0) throw new Error("amount must be positive");
  const c = db();
  const now = Date.now();
  const r = await c.execute({
    sql: "UPDATE users SET gold = gold + ?, updatedAt = ? WHERE id = ? AND deleted = 0",
    args: [amount, now, uid],
  });
  if (r.rowsAffected === 0) throw new Error("user not found");
  const newBalance = await getGoldBalance(uid);
  await writeGoldLog(uid, type, amount, newBalance, { ...meta, balanceAfter: newBalance });
  return newBalance;
}

export async function deductGold(uid, amount, type, meta = {}) {
  if (amount <= 0) throw new Error("amount must be positive");
  // Admin bypass: unlimited gold, never actually deduct
  if (isAdminUid(uid)) {
    return Infinity;
  }
  const c = db();
  const now = Date.now();
  const r = await c.execute({
    sql: "UPDATE users SET gold = gold - ?, updatedAt = ? WHERE id = ? AND deleted = 0 AND gold >= ?",
    args: [amount, now, uid, amount],
  });
  if (r.rowsAffected === 0) {
    const cur = await getGoldBalance(uid);
    const e = new Error("Insufficient gold");
    e.statusCode = 402;
    e.currentGold = cur;
    throw e;
  }
  const newBalance = await getGoldBalance(uid);
  await writeGoldLog(uid, type, -Math.abs(amount), newBalance, { ...meta, balanceAfter: newBalance });
  return newBalance;
}

export async function transferGold(fromUid, toUid, amount, meta = {}) {
  if (amount <= 0) throw new Error("amount must be positive");
  if (amount > 100000) throw new Error("amount exceeds 100000");
  if (fromUid === toUid) throw new Error("cannot transfer to self");

  const tax = getTransferTax(amount);
  const receiveAmount = getReceiveAmount(amount);
  const now = Date.now();
  const c = db();
  const fromAdmin = isAdminUid(fromUid);

  // Deduct from sender — admin bypass (unlimited gold, no actual deduction)
  if (!fromAdmin) {
    const dr = await c.execute({
      sql: "UPDATE users SET gold = gold - ?, updatedAt = ? WHERE id = ? AND deleted = 0 AND gold >= ?",
      args: [amount, now, fromUid, amount],
    });
    if (dr.rowsAffected === 0) {
      const cur = await getGoldBalance(fromUid);
      const e = new Error("Insufficient gold");
      e.statusCode = 402;
      e.currentGold = cur;
      throw e;
    }
  }

  // Add to recipient (always)
  const cr = await c.execute({
    sql: "UPDATE users SET gold = gold + ?, updatedAt = ? WHERE id = ? AND deleted = 0",
    args: [receiveAmount, now, toUid],
  });
  if (cr.rowsAffected === 0) throw new Error("recipient not found");

  const senderBalance = fromAdmin ? Infinity : await getGoldBalance(fromUid);
  const recipientBalance = await getGoldBalance(toUid);

  // Write logs
  await writeGoldLog(fromUid, "transfer_out", fromAdmin ? 0 : -amount, senderBalance, {
    ...meta,
    toUid,
    tax,
    receiveAmount,
    balanceAfter: senderBalance,
    adminBypass: fromAdmin || undefined,
  });
  await writeGoldLog(toUid, "transfer_in", receiveAmount, recipientBalance, {
    ...meta,
    fromUid,
    tax,
    receiveAmount,
    balanceAfter: recipientBalance,
  });

  // Write inbox message to recipient
  await writeInboxMessage({
    uid: toUid,
    fromUid,
    fromEmail: meta.fromEmail || null,
    fromName: meta.fromName || null,
    type: "transfer_in",
    amount: receiveAmount,
    tax,
    note: meta.note || null,
  });

  return {
    senderBalance,
    recipientBalance,
    tax,
    receiveAmount,
  };
}

export async function bulkGrantAll(amount, grantedByUid, excludeUids = [], note = null) {
  if (amount <= 0) throw new Error("amount must be positive");
  if (amount > 10000) throw new Error("max 10000 per bulk grant");

  const c = db();
  const excludeSet = new Set(excludeUids);
  const r = await c.execute({
    sql: "SELECT id, email, displayName, gold FROM users WHERE deleted = 0",
    args: [],
  });
  const results = [];
  const now = Date.now();
  for (const row of r.rows) {
    const uid = String(row.id);
    if (excludeSet.has(uid)) continue;
    const currentGold = num(row.gold);
    const newGold = currentGold + amount;
    await c.execute({
      sql: "UPDATE users SET gold = ?, updatedAt = ? WHERE id = ?",
      args: [newGold, now, uid],
    });
    await writeGoldLog(uid, "admin_grant", amount, newGold, {
      grantedBy: grantedByUid,
      note: note || "Bulk grant by admin",
      bulkGrant: true,
      adminEmail: row.email ? String(row.email) : null,
    });
    results.push({
      uid,
      email: row.email ? String(row.email) : null,
      displayName: row.displayName ? String(row.displayName) : null,
      oldGold: currentGold,
      newGold,
    });
  }
  return { count: results.length, totalGranted: results.length * amount, results };
}

export async function bulkDeductAll(amount, deductedByUid, note = null) {
  if (amount <= 0) throw new Error("amount must be positive");
  if (amount > 10000) throw new Error("max 10000 per bulk deduct");

  const c = db();
  const r = await c.execute({
    sql: "SELECT id, email, displayName, gold FROM users WHERE deleted = 0",
    args: [],
  });
  const results = [];
  const now = Date.now();
  for (const row of r.rows) {
    const uid = String(row.id);
    // Skip admins — they have unlimited gold, should never be deducted
    if (isAdminUid(uid)) continue;
    const currentGold = num(row.gold);
    const deductAmount = Math.min(amount, currentGold);
    if (deductAmount <= 0) continue;
    const newGold = currentGold - deductAmount;
    await c.execute({
      sql: "UPDATE users SET gold = ?, updatedAt = ? WHERE id = ?",
      args: [newGold, now, uid],
    });
    await writeGoldLog(uid, "admin_deduct", -deductAmount, newGold, {
      deductedBy: deductedByUid,
      note: note || "Bulk deduct by admin",
      bulkDeduct: true,
      adminEmail: row.email ? String(row.email) : null,
    });
    results.push({
      uid,
      email: row.email ? String(row.email) : null,
      displayName: row.displayName ? String(row.displayName) : null,
      oldGold: currentGold,
      deducted: deductAmount,
      newGold,
    });
  }
  return { count: results.length, totalDeducted: results.reduce((s, x) => s + x.deducted, 0), results };
}

export async function getRecentTransfers(uid, limit = 10) {
  const c = db();
  const r = await c.execute({
    sql: `SELECT id, uid, email, type, amount, balanceAfter, createdAt, meta
          FROM gold_log
          WHERE uid = ? AND type IN ('transfer_in', 'transfer_out', 'admin_grant', 'admin_deduct')
          ORDER BY COALESCE(createdAt, 0) DESC LIMIT ?`,
    args: [uid, limit],
  });
  return r.rows.map((row) => {
    let meta = {};
    try { meta = JSON.parse(String(row.meta || "{}")); } catch {}
    return {
      id: String(row.id),
      type: String(row.type || ""),
      amount: num(row.amount),
      balanceAfter: num(row.balanceAfter),
      createdAt: toMillis(row.createdAt),
      meta,
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────
// AI Access (timer + remaining minutes)
// ──────────────────────────────────────────────────────────────────────────

export async function getAIAccess(uid) {
  const c = db();
  const r = await c.execute({
    sql: "SELECT uid, remainingMinutes, totalMinutesPurchased, timerStartedAt, timerExpiresAt, lastBuyAt FROM ai_access WHERE uid = ?",
    args: [uid],
  });
  if (r.rows.length === 0) {
    return {
      remainingMinutes: 0,
      timerStartedAt: null,
      timerExpiresAt: null,
      lastBuyAt: null,
    };
  }
  const d = r.rows[0];
  const now = Date.now();
  let remainingMinutes = num(d.remainingMinutes);
  let timerStartedAt = toMillis(d.timerStartedAt);
  let timerExpiresAt = toMillis(d.timerExpiresAt);
  const lastBuyAt = toMillis(d.lastBuyAt);

  if (timerExpiresAt && now >= timerExpiresAt) {
    remainingMinutes = 0;
    timerStartedAt = null;
    timerExpiresAt = null;
    await c.execute({
      sql: "UPDATE ai_access SET remainingMinutes = 0, timerStartedAt = NULL, timerExpiresAt = NULL, updatedAt = ? WHERE uid = ?",
      args: [now, uid],
    });
  } else if (timerExpiresAt && now < timerExpiresAt) {
    remainingMinutes = Math.ceil((timerExpiresAt - now) / 60000);
  }

  return { remainingMinutes, timerStartedAt, timerExpiresAt, lastBuyAt };
}

export async function buyAITime(uid, packageId) {
  const pkg = findPackage(packageId);
  if (!pkg) throw new Error("invalid package");

  const c = db();
  const r = await c.execute({
    sql: "SELECT remainingMinutes, totalMinutesPurchased, timerStartedAt, timerExpiresAt, lastBuyAt FROM ai_access WHERE uid = ?",
    args: [uid],
  });
  const accessData = r.rows[0] || {};
  const now = Date.now();
  const lastBuyAt = toMillis(accessData.lastBuyAt) || 0;
  if (now - lastBuyAt < BUY_COOLDOWN_MS) {
    throw new Error("cooldown: wait 3 seconds between purchases");
  }

  const newGoldBalance = await deductGold(uid, pkg.gold, "spend_ai", {
    packageId: pkg.id,
    minutes: pkg.minutes,
  });

  const currentMinutes = num(accessData.remainingMinutes);
  const newMinutes = currentMinutes + pkg.minutes;

  let timerExpiresAt = toMillis(accessData.timerExpiresAt);
  if (timerExpiresAt && timerExpiresAt > now) {
    timerExpiresAt = timerExpiresAt + pkg.minutes * 60000;
  } else {
    timerExpiresAt = null;
  }

  await c.execute({
    sql: `INSERT INTO ai_access (uid, remainingMinutes, totalMinutesPurchased, timerStartedAt, timerExpiresAt, lastBuyAt, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(uid) DO UPDATE SET
            remainingMinutes = excluded.remainingMinutes,
            totalMinutesPurchased = ai_access.totalMinutesPurchased + ?,
            timerExpiresAt = excluded.timerExpiresAt,
            lastBuyAt = excluded.lastBuyAt,
            updatedAt = excluded.updatedAt`,
    args: [uid, newMinutes, pkg.minutes, null, timerExpiresAt, now, now, now, pkg.minutes],
  });

  return { remainingMinutes: newMinutes, goldBalance: newGoldBalance };
}

export async function activateTimer(uid) {
  const c = db();
  const r = await c.execute({
    sql: "SELECT remainingMinutes, timerStartedAt FROM ai_access WHERE uid = ?",
    args: [uid],
  });
  const accessData = r.rows[0] || {};
  const remainingMinutes = num(accessData.remainingMinutes);
  if (remainingMinutes <= 0) throw new Error("no remaining time");

  const timerStartedAt = toMillis(accessData.timerStartedAt);
  if (timerStartedAt) throw new Error("timer already active");

  const now = Date.now();
  const expiresAt = now + remainingMinutes * 60000;

  await c.execute({
    sql: "UPDATE ai_access SET timerStartedAt = ?, timerExpiresAt = ?, updatedAt = ? WHERE uid = ?",
    args: [now, expiresAt, now, uid],
  });

  return { timerStartedAt: now, timerExpiresAt: expiresAt };
}

export async function checkAITimerAccess(uid) {
  const access = await getAIAccess(uid);
  if (!access.timerExpiresAt) return { active: false, expiresAt: null };
  const now = Date.now();
  if (now >= access.timerExpiresAt) return { active: false, expiresAt: null };
  return { active: true, expiresAt: access.timerExpiresAt };
}

export async function getFullAIStatus(uid, admin) {
  const [access, gold] = await Promise.all([getAIAccess(uid), getGoldBalance(uid)]);
  const packages = getPackages();
  return {
    gold,
    admin,
    remainingMinutes: access.remainingMinutes,
    timerStartedAt: access.timerStartedAt,
    timerExpiresAt: access.timerExpiresAt,
    lastBuyAt: access.lastBuyAt,
    packages,
    timerActive: !!(access.timerStartedAt && access.timerExpiresAt && Date.now() < access.timerExpiresAt),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Inbox
// ──────────────────────────────────────────────────────────────────────────

export async function writeInboxMessage({ uid, fromUid, fromEmail, fromName, type, amount, tax, note, announcementId, announcementBody }) {
  if (!uid || typeof uid !== "string") return { ok: false, error: "uid required" };
  const safeType = ["transfer_in", "admin_grant", "announcement", "marketplace_payout"].includes(type) ? type : "transfer_in";
  if (typeof amount !== "number" || amount < 0) return { ok: false, error: "amount must be non-negative number" };
  const safeNote = (typeof note === "string" && note.length <= 500) ? note : (note ? String(note).slice(0, 500) : null);
  const c = db();
  try {
    const r = await c.execute({
      sql: `INSERT INTO inbox (uid, fromUid, fromEmail, fromName, type, amount, tax, note, announcementId, announcementBody, read, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      args: [
        uid,
        fromUid || null,
        fromEmail || null,
        fromName || null,
        safeType,
        amount,
        tax || 0,
        safeNote,
        announcementId || null,
        announcementBody || null,
        Date.now(),
      ],
    });
    return { ok: true, id: Number(r.lastInsertRowid) };
  } catch (err) {
    console.error("[gold-system] writeInboxMessage failed:", err?.message || err);
    return { ok: false, error: err?.message || String(err) };
  }
}

export async function getInbox(uid, limit = 20) {
  if (!uid || typeof uid !== "string") {
    console.warn("[gold-system] getInbox called with invalid uid:", uid);
    return [];
  }
  const c = db();
  const r = await c.execute({
    sql: `SELECT id, uid, fromUid, fromEmail, fromName, type, amount, tax, note, announcementId, announcementBody, read, createdAt
          FROM inbox WHERE uid = ?
          ORDER BY COALESCE(createdAt, 0) DESC LIMIT ?`,
    args: [uid, limit],
  });
  return r.rows.map((row) => ({
    id: String(row.id),
    uid: String(row.uid),
    fromUid: row.fromUid ? String(row.fromUid) : null,
    fromEmail: row.fromEmail ? String(row.fromEmail) : null,
    fromName: row.fromName ? String(row.fromName) : null,
    type: row.type ? String(row.type) : null,
    amount: num(row.amount),
    tax: num(row.tax),
    note: row.note ? String(row.note) : null,
    announcementId: row.announcementId != null ? Number(row.announcementId) : null,
    announcementBody: row.announcementBody ? String(row.announcementBody) : null,
    read: bool(row.read),
    createdAt: toMillis(row.createdAt),
  }));
}

export async function getUnreadInboxCount(uid) {
  const c = db();
  const r = await c.execute({
    sql: "SELECT COUNT(*) as n FROM inbox WHERE uid = ? AND read = 0",
    args: [uid],
  });
  return num(r.rows[0].n);
}

export async function markInboxRead(uid, messageId) {
  const c = db();
  const r = await c.execute({
    sql: "UPDATE inbox SET read = 1 WHERE id = ? AND uid = ?",
    args: [parseInt(messageId, 10), uid],
  });
  if (r.rowsAffected === 0) throw new Error("message not found");
  return true;
}

export async function markAllInboxRead(uid) {
  const c = db();
  const r = await c.execute({
    sql: "UPDATE inbox SET read = 1 WHERE uid = ? AND read = 0",
    args: [uid],
  });
  return r.rowsAffected;
}

// ──────────────────────────────────────────────────────────────────────────
// Announcements
// ──────────────────────────────────────────────────────────────────────────

export async function createAnnouncement({ title, body, createdByUid, createdByEmail, createdByName }) {
  if (!title || typeof title !== "string" || title.trim().length === 0 || title.length > ANNOUNCEMENT_MAX_TITLE) {
    throw new Error(`title wajib diisi (max ${ANNOUNCEMENT_MAX_TITLE} karakter)`);
  }
  if (!body || typeof body !== "string" || body.trim().length === 0 || body.length > ANNOUNCEMENT_MAX_BODY) {
    throw new Error(`body wajib diisi (max ${ANNOUNCEMENT_MAX_BODY} karakter)`);
  }
  if (!createdByUid) throw new Error("createdByUid wajib diisi");

  const c = db();
  const now = Date.now();
  const ins = await c.execute({
    sql: `INSERT INTO announcements (title, body, createdByUid, createdByEmail, createdByName, delivered, deliveredAt, recipientCount, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, 0, NULL, 0, ?, ?)`,
    args: [title.trim(), body.trim(), createdByUid, createdByEmail || null, createdByName || null, now, now],
  });
  const announcementId = Number(ins.lastInsertRowid);

  let recipientCount = 0;
  try {
    const usersSnap = await c.execute({ sql: "SELECT id FROM users WHERE deleted = 0", args: [] });
    for (const userRow of usersSnap.rows) {
      await c.execute({
        sql: `INSERT INTO inbox (uid, fromUid, fromEmail, fromName, type, amount, tax, note, announcementId, announcementBody, read, createdAt)
              VALUES (?, ?, ?, ?, 'announcement', 0, 0, ?, ?, ?, 0, ?)`,
        args: [
          String(userRow.id),
          createdByUid,
          createdByEmail || null,
          createdByName || "Admin",
          title.trim(),
          announcementId,
          body.trim(),
          now,
        ],
      });
      recipientCount++;
    }

    await c.execute({
      sql: "UPDATE announcements SET delivered = 1, deliveredAt = ?, recipientCount = ?, updatedAt = ? WHERE id = ?",
      args: [now, recipientCount, now, announcementId],
    });
    console.log("[gold-system] createAnnouncement: id=%d delivered to %d users", announcementId, recipientCount);
  } catch (err) {
    console.error("[gold-system] createAnnouncement delivery failed:", err?.message || err);
    await c.execute({
      sql: "UPDATE announcements SET delivered = 0, recipientCount = 0, updatedAt = ? WHERE id = ?",
      args: [now, announcementId],
    });
  }

  return { id: announcementId, recipientCount };
}

export async function getAnnouncements(limit = 20) {
  const c = db();
  const r = await c.execute({
    sql: `SELECT id, title, body, createdByUid, createdByEmail, createdByName, delivered, deliveredAt, recipientCount, createdAt, updatedAt
          FROM announcements ORDER BY COALESCE(createdAt, 0) DESC LIMIT ?`,
    args: [limit],
  });
  return r.rows.map((row) => ({
    id: String(row.id),
    title: row.title ? String(row.title) : null,
    body: row.body ? String(row.body) : null,
    createdByUid: row.createdByUid ? String(row.createdByUid) : null,
    createdByEmail: row.createdByEmail ? String(row.createdByEmail) : null,
    createdByName: row.createdByName ? String(row.createdByName) : null,
    delivered: bool(row.delivered),
    deliveredAt: toMillis(row.deliveredAt),
    recipientCount: num(row.recipientCount),
    createdAt: toMillis(row.createdAt),
    updatedAt: toMillis(row.updatedAt),
  }));
}

export async function editAnnouncement(announcementId, { title, body }, editedByUid) {
  if (!announcementId) throw new Error("announcementId wajib diisi");
  if (!editedByUid) throw new Error("editedByUid wajib diisi");
  const aid = parseInt(announcementId, 10);

  const c = db();
  const r = await c.execute({
    sql: "SELECT id, title, body FROM announcements WHERE id = ?",
    args: [aid],
  });
  if (r.rows.length === 0) throw new Error("announcement tidak ditemukan");

  const now = Date.now();
  const updates = { updatedAt: now };
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length === 0 || title.length > ANNOUNCEMENT_MAX_TITLE) {
      throw new Error(`title max ${ANNOUNCEMENT_MAX_TITLE} karakter`);
    }
    updates.title = title.trim();
  }
  if (body !== undefined) {
    if (typeof body !== "string" || body.trim().length === 0 || body.length > ANNOUNCEMENT_MAX_BODY) {
      throw new Error(`body max ${ANNOUNCEMENT_MAX_BODY} karakter`);
    }
    updates.body = body.trim();
  }

  const cols = Object.keys(updates);
  const sets = cols.map(k => `${k} = ?`).join(", ");
  const args = cols.map(k => updates[k]);
  args.push(aid);
  await c.execute({ sql: `UPDATE announcements SET ${sets} WHERE id = ?`, args });

  // Update inbox messages linked to this announcement
  if (updates.title || updates.body) {
    const inboxUpdates = {};
    if (updates.title) inboxUpdates.note = updates.title;
    if (updates.body) inboxUpdates.announcementBody = updates.body;
    const icols = Object.keys(inboxUpdates);
    const isets = icols.map(k => `${k} = ?`).join(", ");
    const iargs = icols.map(k => inboxUpdates[k]);
    iargs.push(aid);
    await c.execute({ sql: `UPDATE inbox SET ${isets} WHERE announcementId = ?`, args: iargs });
  }

  return { id: announcementId, ...updates };
}

export async function deleteAnnouncement(announcementId, deletedByUid) {
  if (!announcementId) throw new Error("announcementId wajib diisi");
  if (!deletedByUid) throw new Error("deletedByUid wajib diisi");
  const aid = parseInt(announcementId, 10);

  const c = db();
  await c.execute({
    sql: "DELETE FROM inbox WHERE announcementId = ?",
    args: [aid],
  });
  const r = await c.execute({
    sql: "DELETE FROM announcements WHERE id = ?",
    args: [aid],
  });
  if (r.rowsAffected === 0) throw new Error("announcement tidak ditemukan");
  return { id: announcementId, deleted: true };
}
