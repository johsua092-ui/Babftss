import { getPunyaSiJawaFirestore } from "./api-helpers.js";

const AI_PACKAGES = [
  { id: "starter", label: "5 Menit", minutes: 5, gold: 12 },
  { id: "basic", label: "15 Menit", minutes: 15, gold: 32 },
  { id: "standard", label: "30 Menit", minutes: 30, gold: 58 },
  { id: "premium", label: "60 Menit", minutes: 60, gold: 105 },
];

const BUY_COOLDOWN_MS = 3000;

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
  // Allow transfer even if recipient has 0 gold (they might be new)
  // but their user doc must exist
  if (!toDoc.exists) throw new Error("recipient not found");

  const fromNew = fromBalance - amount;
  const toNew = toBalance + amount;
  const now = new Date();

  // ── Atomic-ish update: update both balances + log ──
  // Firestore doesn't support cross-doc transactions easily in this codebase,
  // so we do sequential writes. For a single-server deployment this is fine.
  await db.collection("users").doc(fromUid).set({ gold: fromNew, updatedAt: now }, { merge: true });
  await db.collection("users").doc(toUid).set({ gold: toNew, updatedAt: now }, { merge: true });

  // ── Log both sides ──
  const transferId = `tr_${Date.now()}_${fromUid.slice(0, 8)}`;
  await Promise.all([
    db.collection("gold_log").add({
      uid: fromUid,
      type: "transfer_out",
      amount: -amount,
      balanceAfter: fromNew,
      createdAt: now,
      meta: { ...meta, transferId, toUid },
    }),
    db.collection("gold_log").add({
      uid: toUid,
      type: "transfer_in",
      amount,
      balanceAfter: toNew,
      createdAt: now,
      meta: { ...meta, transferId, fromUid },
    }),
  ]);

  return {
    transferId,
    fromBalance: fromNew,
    toBalance: toNew,
    amount,
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
