import { getPunyaSiJawaFirestore } from "./api-helpers.js";

const AI_PACKAGES = [
  { id: "starter", label: "5 Menit", minutes: 5, gold: 12 },
  { id: "basic", label: "15 Menit", minutes: 15, gold: 32 },
  { id: "standard", label: "30 Menit", minutes: 30, gold: 58 },
  { id: "premium", label: "60 Menit", minutes: 60, gold: 105 },
];

const BUY_COOLDOWN_MS = 3000;

// ── Transfer Tax ──
const TRANSFER_TAX_RATE = 0.05; // 5%

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

async function getDB() {
  return getPunyaSiJawaFirestore();
}

/**
 * Lookup user by email in Firestore.
 * Returns { uid, email, displayName, gold } or null if not found.
 * Searches the "users" collection where `email` field matches.
 */
export async function lookupUserByEmail(email) {
  if (!email || typeof email !== "string") return null;
  const db = await getDB();

  // Try exact match on email field (case-insensitive via lowercase)
  const normalizedEmail = email.trim().toLowerCase();
  const snap = await db.collection("users")
    .where("email", "==", normalizedEmail)
    .limit(5)
    .get();

  if (!snap.empty) {
    const doc = snap.docs[0];
    const data = doc.data();
    return {
      uid: doc.id,
      email: data.email || normalizedEmail,
      displayName: data.displayName || data.display_name || null,
      gold: data.gold || 0,
    };
  }

  // Fallback: try searching by email in auth (if stored differently)
  // Some users might have email stored as `firebase_email`
  const snap2 = await db.collection("users")
    .where("firebase_email", "==", normalizedEmail)
    .limit(5)
    .get();

  if (!snap2.empty) {
    const doc = snap2.docs[0];
    const data = doc.data();
    return {
      uid: doc.id,
      email: data.firebase_email || normalizedEmail,
      displayName: data.displayName || data.display_name || null,
      gold: data.gold || 0,
    };
  }

  return null;
}

/**
 * Ensure user doc exists in Firestore with email & displayName.
 * Called on every authenticated API request to backfill missing data.
 * - If doc doesn't exist → create with gold: 0
 * - If doc exists but missing email → backfill email/displayName
 */
export async function ensureUserDoc(uid, email, displayName) {
  if (!uid) return;
  const db = await getDB();
  const ref = db.collection("users").doc(uid);
  const doc = await ref.get();

  const cleanEmail = (email || "").trim().toLowerCase() || null;
  const cleanName = (displayName || "").trim() || null;

  if (!doc.exists) {
    await ref.set({
      email: cleanEmail,
      firebase_email: cleanEmail,  // dual field for compatibility
      displayName: cleanName,
      gold: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    const data = doc.data();
    const updates = {};
    // Backfill missing email
    if (!data.email && cleanEmail) updates.email = cleanEmail;
    if (!data.firebase_email && cleanEmail) updates.firebase_email = cleanEmail;
    if (!data.displayName && cleanName) updates.displayName = cleanName;
    // Update email if changed (user might have changed email)
    if (cleanEmail && data.email !== cleanEmail) updates.email = cleanEmail;
    if (cleanEmail && data.firebase_email !== cleanEmail) updates.firebase_email = cleanEmail;

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await ref.set(updates, { merge: true });
    }
  }
}

/**
 * Get all users with gold balance.
 * Returns array of { uid, email, displayName, gold }
 */
export async function getAllUsers() {
  const db = await getDB();
  const snap = await db.collection("users").get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      email: data.email || data.firebase_email || null,
      displayName: data.displayName || data.display_name || null,
      gold: data.gold || 0,
    };
  });
}

/**
 * Bulk grant gold to ALL members (excluding admins).
 * Returns { count, totalGranted, results: [{ uid, email, oldGold, newGold }] }
 */
export async function bulkGrantAll(amount, grantedByUid, excludeUids = [], note = null) {
  if (amount <= 0) throw new Error("amount must be positive");
  if (amount > 10000) throw new Error("max 10000 per bulk grant");

  const db = await getDB();
  const now = new Date();
  const excludeSet = new Set(excludeUids);

  // Get all users
  const snap = await db.collection("users").get();
  const results = [];

  // Process in batches (Firestore batch max 500 writes)
  const BATCH_SIZE = 400; // leave room for log entries
  const docs = snap.docs.filter((doc) => !excludeSet.has(doc.id));

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);

    for (const doc of chunk) {
      const data = doc.data();
      const currentGold = data.gold || 0;
      const newGold = currentGold + amount;

      // Update user balance
      batch.update(doc.ref, { gold: newGold, updatedAt: now });

      results.push({
        uid: doc.id,
        email: data.email || data.firebase_email || null,
        displayName: data.displayName || data.display_name || null,
        oldGold: currentGold,
        newGold,
      });
    }

    await batch.commit();

    // Log each grant (separate from balance batch to stay within limits)
    const logBatch = db.batch();
    for (const r of results.slice(results.length - chunk.length)) {
      const logRef = db.collection("gold_log").doc();
      logBatch.set(logRef, {
        uid: r.uid,
        type: "admin_grant",
        amount,
        balanceAfter: r.newGold,
        createdAt: now,
        meta: { grantedBy: grantedByUid, note, bulkGrant: true },
      });
    }
    await logBatch.commit();
  }

  return {
    count: results.length,
    totalGranted: results.length * amount,
    results,
  };
}

export async function getGoldBalance(uid) {
  const db = await getDB();
  const doc = await db.collection("users").doc(uid).get();
  if (!doc.exists) return 0;
  return doc.data().gold || 0;
}

export async function setGoldBalance(uid, gold) {
  const db = await getDB();
  await db
    .collection("users")
    .doc(uid)
    .set({ gold, updatedAt: new Date() }, { merge: true });
}

export async function addGold(uid, amount, type, meta = {}) {
  if (amount <= 0) throw new Error("amount must be positive");
  const db = await getDB();
  const ref = db.collection("users").doc(uid);
  const doc = await ref.get();
  const current = doc.exists ? doc.data().gold || 0 : 0;
  const newBalance = current + amount;
  await ref.set({ gold: newBalance, updatedAt: new Date() }, { merge: true });
  await db.collection("gold_log").add({
    uid,
    type,
    amount,
    balanceAfter: newBalance,
    createdAt: new Date(),
    meta,
  });
  return newBalance;
}

export async function transferGold(fromUid, toUid, amount, meta = {}) {
  if (amount <= 0) throw new Error("amount must be positive");
  if (fromUid === toUid) throw new Error("cannot transfer to self");

  const db = await getDB();

  // ── Read both balances ──
  const [fromDoc, toDoc] = await Promise.all([
    db.collection("users").doc(fromUid).get(),
    db.collection("users").doc(toUid).get(),
  ]);

  const fromBalance = fromDoc.exists ? fromDoc.data().gold || 0 : 0;
  const toBalance = toDoc.exists ? toDoc.data().gold || 0 : 0;

  if (fromBalance < amount) throw new Error("insufficient gold");

  // ── Validate recipient exists (must have a user doc) ──
  if (!toDoc.exists) throw new Error("recipient not found");

  // ── Apply 5% transfer tax ──
  const tax = getTransferTax(amount);
  const receiveAmount = amount - tax;
  const fromNew = fromBalance - amount;
  const toNew = toBalance + receiveAmount;
  const now = new Date();

  // ── Parallel balance updates (faster than sequential) ──
  await Promise.all([
    db.collection("users").doc(fromUid).set({ gold: fromNew, updatedAt: now }, { merge: true }),
    db.collection("users").doc(toUid).set({ gold: toNew, updatedAt: now }, { merge: true }),
  ]);

  // ── Log both sides ──
  const transferId = `tr_${Date.now()}_${fromUid.slice(0, 8)}`;
  const logPromise = Promise.all([
    db.collection("gold_log").add({
      uid: fromUid,
      type: "transfer_out",
      amount: -amount,
      balanceAfter: fromNew,
      createdAt: now,
      meta: { ...meta, transferId, toUid, tax, receiveAmount },
    }),
    db.collection("gold_log").add({
      uid: toUid,
      type: "transfer_in",
      amount: receiveAmount,
      balanceAfter: toNew,
      createdAt: now,
      meta: { ...meta, transferId, fromUid, tax, receiveAmount },
    }),
  ]);

  // ── Always write inbox message for recipient ──
  const inboxPromise = writeInboxMessage({
    uid: toUid,
    fromUid,
    fromEmail: meta.fromEmail || null,
    fromName: meta.fromName || null,
    type: "transfer_in",
    amount: receiveAmount,
    tax,
    note: meta.note || null,
  });

  await Promise.all([logPromise, inboxPromise]);

  return {
    transferId,
    fromBalance: fromNew,
    toBalance: toNew,
    amount,
    tax,
    receiveAmount,
  };
}

export async function getRecentTransfers(uid, limit = 10) {
  const db = await getDB();

  // Try with composite index first (uid + type + createdAt)
  // If Firestore index doesn't exist yet, fall back to uid-only query + filter in memory
  try {
    const snapshot = await db.collection("gold_log")
      .where("uid", "==", uid)
      .where("type", "in", ["transfer_out", "transfer_in", "admin_grant"])
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => formatLogEntry(doc));
  } catch (e) {
    // Composite index might not exist yet — fallback
    console.warn("[gold-system] getRecentTransfers fallback (no composite index?):", e?.message);
    const snapshot = await db.collection("gold_log")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit * 3)
      .get();

    return snapshot.docs
      .map(doc => formatLogEntry(doc))
      .filter(e => ["transfer_out", "transfer_in", "admin_grant"].includes(e.type))
      .slice(0, limit);
  }
}

function formatLogEntry(doc) {
  const d = doc.data();
  return {
    id: doc.id,
    ...d,
    amount: d.amount,
    balanceAfter: d.balanceAfter,
    type: d.type,
    meta: d.meta || {},
    createdAt: d.createdAt?._seconds
      ? new Date(d.createdAt._seconds * 1000).toISOString()
      : new Date().toISOString(),
  };
}

export async function deductGold(uid, amount, type, meta = {}) {
  if (amount <= 0) throw new Error("amount must be positive");
  const db = await getDB();
  const ref = db.collection("users").doc(uid);
  const doc = await ref.get();
  const current = doc.exists ? doc.data().gold || 0 : 0;
  if (current < amount) throw new Error("insufficient gold");
  const newBalance = current - amount;
  await ref.set({ gold: newBalance, updatedAt: new Date() }, { merge: true });
  await db.collection("gold_log").add({
    uid,
    type,
    amount: -amount,
    balanceAfter: newBalance,
    createdAt: new Date(),
    meta,
  });
  return newBalance;
}

export async function bulkDeductAll(amount, deductedByUid, note = null) {
  if (amount <= 0) throw new Error("amount must be positive");
  if (amount > 100000) throw new Error("max 100000 per bulk deduct");

  const db = await getDB();
  const now = new Date();

  // Get all users
  const snap = await db.collection("users").get();
  const results = [];

  const BATCH_SIZE = 400;
  const docs = snap.docs;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);

    for (const doc of chunk) {
      const data = doc.data();
      const currentGold = data.gold || 0;
      // Don't deduct more than they have — skip members with 0 gold
      const deductAmount = Math.min(amount, currentGold);
      if (deductAmount <= 0) continue;

      const newGold = currentGold - deductAmount;
      batch.update(doc.ref, { gold: newGold, updatedAt: now });

      results.push({
        uid: doc.id,
        email: data.email || data.firebase_email || null,
        displayName: data.displayName || data.display_name || null,
        oldGold: currentGold,
        deducted: deductAmount,
        newGold,
      });
    }

    await batch.commit();

    // Log each deduct
    const logBatch = db.batch();
    for (const r of results.slice(results.length - chunk.length)) {
      const logRef = db.collection("gold_log").doc();
      logBatch.set(logRef, {
        uid: r.uid,
        type: "admin_deduct",
        amount: -r.deducted,
        balanceAfter: r.newGold,
        createdAt: now,
        meta: { deductedBy: deductedByUid, note, bulkDeduct: true },
      });
    }
    await logBatch.commit();
  }

  return {
    count: results.length,
    totalDeducted: results.reduce((sum, r) => sum + r.deducted, 0),
    results,
  };
}

export async function getAIAccess(uid) {
  const db = await getDB();
  const doc = await db.collection("ai_access").doc(uid).get();
  if (!doc.exists) {
    return {
      remainingMinutes: 0,
      timerStartedAt: null,
      timerExpiresAt: null,
      lastBuyAt: null,
    };
  }
  const d = doc.data();
  const now = Date.now();
  let remainingMinutes = d.remainingMinutes || 0;
  let timerStartedAt = d.timerStartedAt ? new Date(d.timerStartedAt._seconds * 1000).getTime() : null;
  let timerExpiresAt = d.timerExpiresAt ? new Date(d.timerExpiresAt._seconds * 1000).getTime() : null;
  let lastBuyAt = d.lastBuyAt ? new Date(d.lastBuyAt._seconds * 1000).getTime() : null;

  if (timerExpiresAt && now >= timerExpiresAt) {
    remainingMinutes = 0;
    timerStartedAt = null;
    timerExpiresAt = null;
    await db
      .collection("ai_access")
      .doc(uid)
      .set(
        { remainingMinutes: 0, timerStartedAt: null, timerExpiresAt: null },
        { merge: true }
      );
  } else if (timerExpiresAt && now < timerExpiresAt) {
    remainingMinutes = Math.ceil((timerExpiresAt - now) / 60000);
  }

  return { remainingMinutes, timerStartedAt, timerExpiresAt, lastBuyAt };
}

export async function buyAITime(uid, packageId) {
  const pkg = findPackage(packageId);
  if (!pkg) throw new Error("invalid package");

  const db = await getDB();
  const accessRef = db.collection("ai_access").doc(uid);
  const accessDoc = await accessRef.get();
  const accessData = accessDoc.exists ? accessDoc.data() : {};

  const now = Date.now();
  const lastBuyAt = accessData.lastBuyAt
    ? new Date(accessData.lastBuyAt._seconds * 1000).getTime()
    : 0;
  if (now - lastBuyAt < BUY_COOLDOWN_MS) {
    throw new Error("cooldown: wait 3 seconds between purchases");
  }

  const newGoldBalance = await deductGold(uid, pkg.gold, "spend_ai", {
    packageId: pkg.id,
    minutes: pkg.minutes,
  });

  const currentMinutes = accessData.remainingMinutes || 0;
  const newMinutes = currentMinutes + pkg.minutes;

  let timerExpiresAt = accessData.timerExpiresAt || null;
  if (timerExpiresAt) {
    const expiresMs = new Date(timerExpiresAt._seconds * 1000).getTime();
    if (expiresMs > now) {
      timerExpiresAt = new Date(expiresMs + pkg.minutes * 60000);
    }
  }

  await accessRef.set(
    {
      remainingMinutes: newMinutes,
      timerExpiresAt,
      lastBuyAt: new Date(),
    },
    { merge: true }
  );

  return { remainingMinutes: newMinutes, goldBalance: newGoldBalance };
}

export async function activateTimer(uid) {
  const db = await getDB();
  const accessRef = db.collection("ai_access").doc(uid);
  const accessDoc = await accessRef.get();
  const accessData = accessDoc.exists ? accessDoc.data() : {};

  const remainingMinutes = accessData.remainingMinutes || 0;
  if (remainingMinutes <= 0) throw new Error("no remaining time");

  const timerStartedAt = accessData.timerStartedAt
    ? new Date(accessData.timerStartedAt._seconds * 1000).getTime()
    : null;
  if (timerStartedAt) throw new Error("timer already active");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + remainingMinutes * 60000);

  await accessRef.set(
    {
      timerStartedAt: now,
      timerExpiresAt: expiresAt,
    },
    { merge: true }
  );

  return {
    timerStartedAt: now.getTime(),
    timerExpiresAt: expiresAt.getTime(),
    remainingMinutes,
  };
}

export async function checkAITimerAccess(uid) {
  const access = await getAIAccess(uid);
  if (!access.timerStartedAt || !access.timerExpiresAt) {
    return { allowed: false, reason: "timer_not_active", remainingMinutes: access.remainingMinutes };
  }
  const now = Date.now();
  if (now >= access.timerExpiresAt) {
    return { allowed: false, reason: "timer_expired", remainingMinutes: 0 };
  }
  return {
    allowed: true,
    remainingMinutes: access.remainingMinutes,
    expiresAt: access.timerExpiresAt,
  };
}

export async function getFullAIStatus(uid, admin) {
  const gold = admin ? Infinity : await getGoldBalance(uid);
  const access = admin
    ? { remainingMinutes: Infinity, timerStartedAt: null, timerExpiresAt: null, lastBuyAt: null }
    : await getAIAccess(uid);
  return {
    isAdmin: admin,
    gold,
    remainingMinutes: access.remainingMinutes,
    timerActive: !!access.timerStartedAt && Date.now() < (access.timerExpiresAt || 0),
    timerExpiresAt: access.timerExpiresAt,
    packages: getPackages(),
  };
}

// ── Inbox System ──

/**
 * Write an inbox message to Firestore for a recipient.
 * Used by transferGold (member transfer) and admin grant.
 */
export async function writeInboxMessage({ uid, fromUid, fromEmail, fromName, type, amount, tax, note }) {
  const db = await getDB();
  try {
    await db.collection("inbox").add({
      uid,
      fromUid: fromUid || null,
      fromEmail: fromEmail || null,
      fromName: fromName || null,
      type: type || "transfer_in",
      amount: amount || 0,
      tax: tax || 0,
      note: note || null,
      read: false,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("[gold-system] writeInboxMessage failed:", err?.message || err);
  }
}

function formatInboxMsg(doc) {
  const d = doc.data();
  return {
    id: doc.id,
    ...d,
    createdAt: d.createdAt?._seconds
      ? new Date(d.createdAt._seconds * 1000).toISOString()
      : new Date().toISOString(),
  };
}

export async function getInbox(uid, limit = 20) {
  const db = await getDB();
  // Try with composite index (uid + createdAt desc) first
  // If Firestore index doesn't exist yet, fall back to uid-only query + sort in memory
  try {
    const snap = await db.collection("inbox")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map(formatInboxMsg);
  } catch (e) {
    // Composite index might not exist yet -- fallback
    console.warn("[gold-system] getInbox fallback (no composite index?):", e?.message);
    const snap = await db.collection("inbox")
      .where("uid", "==", uid)
      .limit(limit * 3)
      .get();
    return snap.docs
      .map(formatInboxMsg)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }
}

export async function getUnreadInboxCount(uid) {
  const db = await getDB();
  // Try with composite index (uid + read) first
  try {
    const snap = await db.collection("inbox")
      .where("uid", "==", uid)
      .where("read", "==", false)
      .limit(100)
      .get();
    return snap.size;
  } catch (e) {
    // Fallback: query by uid only, filter in memory
    console.warn("[gold-system] getUnreadInboxCount fallback (no composite index?):", e?.message);
    const snap = await db.collection("inbox")
      .where("uid", "==", uid)
      .limit(100)
      .get();
    return snap.docs.filter(doc => doc.data().read === false).length;
  }
}

export async function markInboxRead(uid, messageId) {
  const db = await getDB();
  const ref = db.collection("inbox").doc(messageId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("message not found");
  if (doc.data().uid !== uid) throw new Error("not your message");
  await ref.set({ read: true }, { merge: true });
  return true;
}

export async function markAllInboxRead(uid) {
  const db = await getDB();
  // Try with composite index (uid + read) first
  let snap;
  try {
    snap = await db.collection("inbox")
      .where("uid", "==", uid)
      .where("read", "==", false)
      .limit(500)
      .get();
  } catch (e) {
    // Fallback: query by uid only, filter in memory
    console.warn("[gold-system] markAllInboxRead fallback (no composite index?):", e?.message);
    const allSnap = await db.collection("inbox")
      .where("uid", "==", uid)
      .limit(500)
      .get();
    // Fake a snapshot-like object with only unread docs
    snap = { empty: allSnap.docs.filter(d => d.data().read === false).length === 0, docs: allSnap.docs.filter(d => d.data().read === false) };
  }
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.update(doc.ref, { read: true }));
  await batch.commit();
  return snap.size;
}
