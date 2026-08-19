import { createClient } from "@libsql/client";

function db() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL belum diset.");
  return createClient({ url, authToken: token });
}

/**
 * Write an audit log entry. Best-effort — failures are logged but do not
 * interrupt the calling operation.
 *
 * @param {object} input
 * @param {string} input.actorUid    — UID of admin performing the action
 * @param {string} [input.actorEmail] — admin email (optional)
 * @param {string} input.action       — e.g. 'grant', 'deduct', 'ban', 'announcement_create'
 * @param {string} [input.targetUid]  — UID of user being acted upon
 * @param {string} [input.targetEmail] — target user email
 * @param {number} [input.amount]      — gold amount involved (if any)
 * @param {object} [input.meta]        — additional context (note, source, etc.)
 * @param {string} [input.ip]          — client IP
 * @param {string} [input.userAgent]    — client user agent
 */
export async function writeAuditLog(input) {
  if (!input || !input.actorUid || !input.action) {
    console.warn("[auditLog] missing required fields:", input);
    return { ok: false, error: "actorUid + action required" };
  }
  try {
    const c = db();
    await c.execute({
      sql: `INSERT INTO audit_log (timestamp, actorUid, actorEmail, action, targetUid, targetEmail, amount, meta, ip, userAgent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        Date.now(),
        input.actorUid,
        input.actorEmail || null,
        input.action,
        input.targetUid || null,
        input.targetEmail || null,
        typeof input.amount === "number" ? input.amount : null,
        input.meta ? JSON.stringify(input.meta) : null,
        input.ip || null,
        input.userAgent || null,
      ],
    });
    return { ok: true };
  } catch (e) {
    console.error("[auditLog] write failed:", e?.message || e);
    return { ok: false, error: e?.message || String(e) };
  }
}

/**
 * Get audit log entries with optional filters.
 * Returns array of entries, newest first.
 */
export async function getAuditLog(opts = {}) {
  const c = db();
  const limit = Math.min(parseInt(opts.limit || "100", 10), 500);
  const where = [];
  const args = [];
  if (opts.action) {
    where.push("action = ?");
    args.push(opts.action);
  }
  if (opts.actorUid) {
    where.push("actorUid = ?");
    args.push(opts.actorUid);
  }
  if (opts.targetUid) {
    where.push("targetUid = ?");
    args.push(opts.targetUid);
  }
  if (opts.sinceTs) {
    where.push("timestamp >= ?");
    args.push(Number(opts.sinceTs));
  }
  const sql = `SELECT id, timestamp, actorUid, actorEmail, action, targetUid, targetEmail, amount, meta, ip, userAgent
               FROM audit_log
               ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY COALESCE(timestamp, 0) DESC
               LIMIT ?`;
  args.push(limit);
  const r = await c.execute({ sql, args });
  return r.rows.map((row) => {
    let meta = {};
    try { meta = row.meta ? JSON.parse(String(row.meta)) : {}; } catch {}
    return {
      id: Number(row.id),
      timestamp: typeof row.timestamp === "number" ? row.timestamp : Number(row.timestamp) || 0,
      actorUid: String(row.actorUid || ""),
      actorEmail: row.actorEmail ? String(row.actorEmail) : null,
      action: String(row.action || ""),
      targetUid: row.targetUid ? String(row.targetUid) : null,
      targetEmail: row.targetEmail ? String(row.targetEmail) : null,
      amount: typeof row.amount === "number" ? row.amount : null,
      meta,
      ip: row.ip ? String(row.ip) : null,
      userAgent: row.userAgent ? String(row.userAgent) : null,
    };
  });
}
