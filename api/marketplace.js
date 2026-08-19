import { applyCors, applySecurityHeaders, checkRateLimit, authenticateRequest } from "../lib/api-helpers.js";
import {
  getProducts,
  getCart,
  getCartCount,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  checkout,
  getOrders,
} from "../lib/marketplace.js";
import { createClient } from "@libsql/client";

function getDb() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

async function getUserGold(uid) {
  const c = getDb();
  const r = await c.execute({
    sql: "SELECT gold FROM users WHERE id = ? AND deleted = 0",
    args: [uid],
  });
  if (r.rows.length === 0) return { exists: false, gold: 0 };
  const v = r.rows[0].gold;
  const gold = typeof v === "number" ? v : typeof v === "string" ? Number(v) || 0 : 0;
  return { exists: true, gold };
}

async function deductGold(uid, amount, note, meta) {
  const c = getDb();
  const r = await c.execute({
    sql: "UPDATE users SET gold = gold - ?, updatedAt = ? WHERE id = ? AND deleted = 0 AND gold >= ?",
    args: [amount, Date.now(), uid, amount],
  });
  if (r.rowsAffected === 0) {
    const cur = await getUserGold(uid);
    const e = new Error("Insufficient gold");
    e.statusCode = 402;
    e.currentGold = cur.gold;
    throw e;
  }
  await c.execute({
    sql: "INSERT INTO gold_log (uid, type, amount, balanceAfter, createdAt, meta) VALUES (?, ?, ?, ?, ?, ?)",
    args: [uid, "marketplace_purchase", -Math.abs(amount), 0, Date.now(), JSON.stringify({ ...meta, source: "marketplace", note: note || "Marketplace purchase" })],
  });
  return true;
}

function ok(res, payload, status = 200) {
  return res.status(status).json(payload);
}
function fail(res, msg, status = 400) {
  return res.status(status).json({ error: msg });
}

export default async function handler(req, res) {
  applyCors(req, res, "GET, POST, OPTIONS");
  applySecurityHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!checkRateLimit(`marketplace:${req.headers["x-forwarded-for"] || "unknown"}`, 120, 60000)) {
    return fail(res, "Rate limited", 429);
  }

  const user = await authenticateRequest(req);
  if (!user) return fail(res, "Login required", 401);

  const action = req.query?.action || (req.method === "POST" ? req.body?.action : null);

  try {
    // ─── GET endpoints ───
    if (req.method === "GET") {
      if (action === "products") {
        const category = req.query?.category || "Semua";
        const products = await getProducts(category);
        return ok(res, { products });
      }
      if (action === "cart") {
        const cart = await getCart(user.sub);
        return ok(res, cart);
      }
      if (action === "count") {
        const count = await getCartCount(user.sub);
        return ok(res, { count });
      }
      if (action === "orders") {
        const orders = await getOrders(user.sub, 30);
        return ok(res, { orders });
      }
      return fail(res, "Unknown action", 400);
    }

    // ─── POST endpoints ───
    if (req.method === "POST") {
      const body = req.body || {};
      const email = user.email || null;

      if (action === "add") {
        const productId = body.productId;
        const quantity = Math.max(1, Math.min(99, parseInt(body.quantity, 10) || 1));
        if (!productId) return fail(res, "productId required", 400);
        const r = await addToCart(user.sub, productId, quantity);
        return ok(res, r);
      }
      if (action === "update") {
        const cartItemId = parseInt(body.cartItemId, 10);
        const quantity = Math.max(0, Math.min(99, parseInt(body.quantity, 10)));
        if (!cartItemId || Number.isNaN(quantity)) return fail(res, "cartItemId and quantity required", 400);
        const r = await updateCartQuantity(user.sub, cartItemId, quantity);
        return ok(res, r);
      }
      if (action === "remove") {
        const cartItemId = parseInt(body.cartItemId, 10);
        if (!cartItemId) return fail(res, "cartItemId required", 400);
        const r = await removeFromCart(user.sub, cartItemId);
        return ok(res, r);
      }
      if (action === "clear") {
        const r = await clearCart(user.sub);
        return ok(res, r);
      }
      if (action === "checkout") {
        const cart = await getCart(user.sub);
        if (cart.items.length === 0) return fail(res, "Cart is empty", 400);
        const userGold = await getUserGold(user.sub);
        if (!userGold.exists) return fail(res, "User not found", 404);
        if (userGold.gold < cart.totalGold) {
          return fail(res, `Insufficient gold (need ${cart.totalGold}, have ${userGold.gold})`, 402);
        }
        await deductGold(user.sub, cart.totalGold, `Marketplace checkout: ${cart.items.length} items`, {
          itemCount: cart.items.length,
          totalGold: cart.totalGold,
        });
        const result = await checkout(user.sub, email);
        return ok(res, {
          ok: true,
          orderId: result.orderId,
          totalGold: result.totalGold,
          itemCount: result.itemCount,
          message: `Checkout berhasil! ${result.itemCount} item, ${result.totalGold} gold terpakai.`,
        });
      }
      return fail(res, "Unknown action", 400);
    }

    return fail(res, "Method not allowed", 405);
  } catch (e) {
    const status = e.statusCode || 500;
    console.error("[marketplace] error:", e?.message || e);
    if (status === 402) {
      return fail(res, e.message, 402);
    }
    return fail(res, e?.message || "Internal server error", status);
  }
}
