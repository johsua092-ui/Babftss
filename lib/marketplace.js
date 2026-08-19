import { createClient } from "@libsql/client";
import { isAdminUid } from "./api-helpers.js";

function db() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL belum diset.");
  return createClient({ url, authToken: token });
}

function num(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v))) return Number(v);
  if (typeof v === "bigint") return Number(v);
  return 0;
}

export async function getProducts(category) {
  const c = db();
  let r;
  if (category && category !== "Semua") {
    r = await c.execute({
      sql: "SELECT id, name, category, price, rating, sales, gradient, imageUrl, description FROM marketplace_products WHERE active = 1 AND category = ? ORDER BY COALESCE(sales, 0) DESC",
      args: [category],
    });
  } else {
    r = await c.execute(
      "SELECT id, name, category, price, rating, sales, gradient, imageUrl, description FROM marketplace_products WHERE active = 1 ORDER BY COALESCE(sales, 0) DESC"
    );
  }
  return r.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    category: row.category ? String(row.category) : null,
    price: num(row.price),
    rating: num(row.rating),
    sales: num(row.sales),
    gradient: row.gradient ? String(row.gradient) : null,
    imageUrl: row.imageUrl ? String(row.imageUrl) : null,
    description: row.description ? String(row.description) : null,
  }));
}

export async function getCart(uid) {
  if (!uid) throw new Error("uid required");
  const c = db();
  const r = await c.execute({
    sql: `SELECT ci.id, ci.productId, ci.quantity, ci.addedAt, ci.updatedAt,
            p.name, p.category, p.price, p.rating, p.gradient, p.imageUrl, p.description
          FROM cart_items ci
          LEFT JOIN marketplace_products p ON p.id = ci.productId
          WHERE ci.uid = ?
          ORDER BY COALESCE(ci.addedAt, 0) DESC`,
    args: [uid],
  });
  const items = r.rows.map((row) => ({
    cartItemId: Number(row.id),
    productId: String(row.productId),
    quantity: num(row.quantity),
    name: row.name ? String(row.name) : "[unknown product]",
    category: row.category ? String(row.category) : null,
    price: num(row.price),
    rating: num(row.rating),
    gradient: row.gradient ? String(row.gradient) : null,
    imageUrl: row.imageUrl ? String(row.imageUrl) : null,
    subtotal: num(row.price) * num(row.quantity),
  }));
  const totalGold = items.reduce((s, it) => s + it.subtotal, 0);
  const totalItems = items.reduce((s, it) => s + it.quantity, 0);
  return { items, totalGold, totalItems };
}

export async function addToCart(uid, productId, quantity = 1) {
  if (!uid) throw new Error("uid required");
  if (!productId) throw new Error("productId required");
  if (quantity < 1 || quantity > 99) throw new Error("quantity must be 1-99");
  const c = db();
  const prod = await c.execute({
    sql: "SELECT id, name, price, active FROM marketplace_products WHERE id = ? AND active = 1",
    args: [productId],
  });
  if (prod.rows.length === 0) throw new Error("Product not found or inactive");
  const now = Date.now();
  await c.execute({
    sql: `INSERT INTO cart_items (uid, productId, quantity, addedAt, updatedAt)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(uid, productId) DO UPDATE SET
            quantity = MIN(cart_items.quantity + excluded.quantity, 99),
            updatedAt = excluded.updatedAt`,
    args: [uid, productId, quantity, now, now],
  });
  return { ok: true, productId, quantity };
}

export async function updateCartQuantity(uid, cartItemId, quantity) {
  if (!uid) throw new Error("uid required");
  if (!cartItemId) throw new Error("cartItemId required");
  if (quantity < 0 || quantity > 99) throw new Error("quantity must be 0-99 (0 = remove)");
  const c = db();
  if (quantity === 0) {
    await c.execute({
      sql: "DELETE FROM cart_items WHERE id = ? AND uid = ?",
      args: [cartItemId, uid],
    });
    return { ok: true, removed: true };
  }
  const r = await c.execute({
    sql: "UPDATE cart_items SET quantity = ?, updatedAt = ? WHERE id = ? AND uid = ?",
    args: [quantity, Date.now(), cartItemId, uid],
  });
  if (r.rowsAffected === 0) throw new Error("Cart item not found");
  return { ok: true, cartItemId, quantity };
}

export async function removeFromCart(uid, cartItemId) {
  if (!uid) throw new Error("uid required");
  const c = db();
  const r = await c.execute({
    sql: "DELETE FROM cart_items WHERE id = ? AND uid = ?",
    args: [cartItemId, uid],
  });
  return { ok: true, removed: r.rowsAffected > 0 };
}

export async function clearCart(uid) {
  if (!uid) throw new Error("uid required");
  const c = db();
  await c.execute({ sql: "DELETE FROM cart_items WHERE uid = ?", args: [uid] });
  return { ok: true };
}

export async function getCartCount(uid) {
  if (!uid) return 0;
  const c = db();
  const r = await c.execute({
    sql: "SELECT COALESCE(SUM(quantity), 0) as n FROM cart_items WHERE uid = ?",
    args: [uid],
  });
  return num(r.rows[0].n);
}

export async function getUserGold(uid) {
  const c = db();
  const r = await c.execute({
    sql: "SELECT gold FROM users WHERE id = ? AND deleted = 0",
    args: [uid],
  });
  if (r.rows.length === 0) return { exists: false, gold: 0 };
  const v = r.rows[0].gold;
  const gold = typeof v === "number" ? v : typeof v === "string" ? Number(v) || 0 : 0;
  return { exists: true, gold };
}

export async function deductGoldForCheckout(uid, amount, meta = {}) {
  // Admin bypass: unlimited gold, no actual deduction
  if (isAdminUid(uid)) {
    return { ok: true, balanceAfter: Infinity };
  }
  const c = db();
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
  const after = await getUserGold(uid);
  await c.execute({
    sql: "INSERT INTO gold_log (uid, type, amount, balanceAfter, createdAt, meta) VALUES (?, ?, ?, ?, ?, ?)",
    args: [uid, "marketplace_purchase", -Math.abs(amount), after.gold, Date.now(), JSON.stringify({ ...meta, source: "marketplace", note: meta.note || "Marketplace purchase" })],
  });
  return { ok: true, balanceAfter: after.gold };
}

export async function checkout(uid, email, opts = {}) {
  if (!uid) throw new Error("uid required");
  const adminMode = !!opts.adminMode;
  const c = db();
  const { items, totalGold } = await getCart(uid);
  if (items.length === 0) throw new Error("Cart is empty");

  // Lookup seller info per item (one DB round-trip for all unique product IDs)
  const productIds = [...new Set(items.map((it) => it.productId))];
  const sellerMap = new Map();
  for (const pid of productIds) {
    const r = await c.execute({
      sql: "SELECT id, seller_uid, seller_payout_rate FROM marketplace_products WHERE id = ?",
      args: [pid],
    });
    if (r.rows.length > 0) {
      sellerMap.set(pid, {
        seller_uid: r.rows[0].seller_uid ? String(r.rows[0].seller_uid) : null,
        payout_rate: typeof r.rows[0].seller_payout_rate === "number"
          ? r.rows[0].seller_payout_rate
          : Number(r.rows[0].seller_payout_rate) || 0.95,
      });
    }
  }

  // Compute payout + tax per item, accumulate per seller
  const sellerPayouts = new Map();
  let totalTax = 0;
  for (const it of items) {
    const meta = sellerMap.get(it.productId) || { seller_uid: null, payout_rate: 0.95 };
    const payoutRate = meta.payout_rate;
    const sellerShare = it.subtotal * payoutRate;
    const itemTax = it.subtotal - sellerShare;
    totalTax += itemTax;
    if (meta.seller_uid) {
      const cur = sellerPayouts.get(meta.seller_uid) || { total: 0, tax: 0, items: 0, qty: 0 };
      cur.total += sellerShare;
      cur.tax += itemTax;
      cur.items += 1;
      cur.qty += it.quantity;
      sellerPayouts.set(meta.seller_uid, cur);
    }
  }

  const now = Date.now();
  const orderResult = await c.execute({
    sql: "INSERT INTO orders (uid, email, totalGold, itemCount, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    args: [uid, email || null, totalGold, items.reduce((s, it) => s + it.quantity, 0), "paid", now],
  });
  const orderId = Number(orderResult.lastInsertRowid);

  for (const it of items) {
    const meta = sellerMap.get(it.productId) || { seller_uid: null, payout_rate: 0.95 };
    const sellerShare = it.subtotal * meta.payout_rate;
    await c.execute({
      sql: `INSERT INTO order_items (orderId, uid, productId, productName, price, quantity, subtotal)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [orderId, uid, it.productId, it.name, it.price, it.quantity, it.subtotal],
    });

    // Pay seller
    if (meta.seller_uid) {
      const sellerUpdate = await c.execute({
        sql: "UPDATE users SET gold = gold + ?, updatedAt = ? WHERE id = ? AND deleted = 0",
        args: [sellerShare, now, meta.seller_uid],
      });
      if (sellerUpdate.rowsAffected === 0) {
        console.warn(`[marketplace] seller payout skipped — seller_uid ${meta.seller_uid} not found in users (or deleted). Product ${it.productId}, orderId ${orderId}. Payout ${sellerShare} lost.`);
      }
      // Write inbox message to seller (notification)
      await c.execute({
        sql: `INSERT INTO inbox (uid, fromUid, fromEmail, fromName, type, amount, tax, note, announcementId, announcementBody, read, createdAt)
              VALUES (?, ?, ?, ?, 'marketplace_payout', ?, ?, ?, NULL, NULL, 0, ?)`,
        args: [
          meta.seller_uid,
          uid,
          email || null,
          "Marketplace sale",
          sellerShare,
          it.subtotal - sellerShare,
          `Sold "${it.name}" x${it.quantity}`,
          now,
        ],
      });
      // Write seller gold_log
      await c.execute({
        sql: "INSERT INTO gold_log (uid, type, amount, balanceAfter, createdAt, meta) VALUES (?, ?, ?, ?, ?, ?)",
        args: [meta.seller_uid, "marketplace_payout", sellerShare, 0, now, JSON.stringify({
          source: "marketplace_sale",
          buyer: uid,
          productId: it.productId,
          productName: it.name,
          quantity: it.quantity,
          subtotal: it.subtotal,
          tax: it.subtotal - sellerShare,
          orderId,
        })],
      });
    }
  }

  // Update seller_revenue aggregation table
  for (const [sellerUid, agg] of sellerPayouts.entries()) {
    const existing = await c.execute({
      sql: "SELECT uid, totalEarned, totalTaxPaid, totalSales, totalItemsSold FROM seller_revenue WHERE uid = ?",
      args: [sellerUid],
    });
    if (existing.rows.length === 0) {
      const sellerInfo = await c.execute({
        sql: "SELECT email, displayName FROM users WHERE id = ?",
        args: [sellerUid],
      }).then(r => r.rows[0] || {});
      await c.execute({
        sql: `INSERT INTO seller_revenue (uid, email, displayName, totalEarned, totalTaxPaid, totalSales, totalItemsSold, lastSaleAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          sellerUid,
          sellerInfo.email ? String(sellerInfo.email) : null,
          sellerInfo.displayName ? String(sellerInfo.displayName) : null,
          agg.total,
          agg.tax,
          1,
          agg.qty,
          now,
          now,
        ],
      });
    } else {
      const cur = existing.rows[0];
      await c.execute({
        sql: `UPDATE seller_revenue SET
                totalEarned = totalEarned + ?,
                totalTaxPaid = totalTaxPaid + ?,
                totalSales = totalSales + ?,
                totalItemsSold = totalItemsSold + ?,
                lastSaleAt = ?,
                updatedAt = ?
              WHERE uid = ?`,
        args: [agg.total, agg.tax, 1, agg.qty, now, now, sellerUid],
      });
    }
  }

  // Clear cart
  await clearCart(uid);
  return {
    ok: true,
    orderId,
    totalGold,
    itemCount: items.reduce((s, it) => s + it.quantity, 0),
    items,
    sellerPayouts: Array.from(sellerPayouts.entries()).map(([uid, v]) => ({ sellerUid: uid, ...v })),
    totalTax,
    adminMode,
  };
}

export async function getOrders(uid, limit = 30) {
  if (!uid) throw new Error("uid required");
  const c = db();
  const r = await c.execute({
    sql: `SELECT o.id, o.uid, o.totalGold, o.itemCount, o.status, o.createdAt,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.orderId = o.id) as itemCountVerified
          FROM orders o
          WHERE o.uid = ?
          ORDER BY COALESCE(o.createdAt, 0) DESC
          LIMIT ?`,
    args: [uid, limit],
  });
  return r.rows.map((row) => ({
    orderId: Number(row.id),
    uid: String(row.uid),
    totalGold: num(row.totalGold),
    itemCount: num(row.itemCount),
    status: row.status ? String(row.status) : "paid",
    createdAt: num(row.createdAt),
  }));
}
