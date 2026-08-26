-- ============================================================================
-- BABFT Learning — Turso (libSQL) Schema Reconstruction
-- ============================================================================
-- Generated: 2026-08-26
-- Source   : Reverse-engineered dari lib/gold-system.js, lib/marketplace.js,
--            lib/auditLog.js (hanya berisi CREATE TABLE IF NOT EXISTS — aman
--            dijalankan di database yang sudah ada data TANPA menghapus apa2).
--
-- CARA PAKAI:
--   1. Login ke https://app.turso.tech
--   2. Pilih database Anda → klik "Edit data" (atau pakai turso CLI)
--   3. Copy-paste seluruh isi file ini → Run
--
-- URUTAN EKSEKUSI PENTING:
--   - users harus dibuat DULU (semua tabel lain ada FK / refer ke users.id)
--   - marketplace_products sebelum cart_items & order_items
--   - announcements sebelum inbox (inbox.announcementId refer announcements.id)
--
-- WARNING: Skrip ini HANYA membuat struktur tabel kosong. Data user (saldo
-- gold, riwayat transaksi, dll) TIDAK bisa direkonstruksi dari kode — harus
-- dari backup Turso. Lihat README-cloud-backup-recovery.md.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. users — saldo gold + profil user
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,             -- Firebase Auth UID
  uid             TEXT,                          -- alias (legacy)
  email           TEXT,
  displayName     TEXT,
  gold            INTEGER NOT NULL DEFAULT 0,    -- saldo gold saat ini
  createdAt       INTEGER NOT NULL,              -- epoch millis
  updatedAt       INTEGER NOT NULL,              -- epoch millis
  lastLoginAt     INTEGER,                       -- epoch millis, nullable
  deleted         INTEGER NOT NULL DEFAULT 0     -- 0=aktif, 1=soft-delete
);

CREATE INDEX IF NOT EXISTS idx_users_email        ON users (LOWER(COALESCE(email, '')));
CREATE INDEX IF NOT EXISTS idx_users_deleted      ON users (deleted);
CREATE INDEX IF NOT EXISTS idx_users_lastLoginAt  ON users (lastLoginAt);

-- ============================================================================
-- 2. gold_log — audit trail setiap perubahan saldo gold
-- ============================================================================
CREATE TABLE IF NOT EXISTS gold_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  uid           TEXT NOT NULL,                   -- Firebase Auth UID
  email         TEXT,                            -- snapshot email saat transaksi
  type          TEXT NOT NULL,                   -- 'marketplace_purchase' | 'marketplace_payout' | 'admin_grant' | 'admin_deduct' | 'transfer_in' | 'transfer_out' | 'ai_purchase'
  amount        INTEGER NOT NULL,                -- negatif = keluar, positif = masuk
  balanceAfter  INTEGER NOT NULL,                -- saldo setelah transaksi
  createdAt     INTEGER NOT NULL,                -- epoch millis
  meta          TEXT                             -- JSON string (note, source, dst)
);

CREATE INDEX IF NOT EXISTS idx_goldlog_uid        ON gold_log (uid);
CREATE INDEX IF NOT EXISTS idx_goldlog_type       ON gold_log (type);
CREATE INDEX IF NOT EXISTS idx_goldlog_createdAt  ON gold_log (createdAt);

-- ============================================================================
-- 3. ai_access — paket menit AI Helper yang dibeli user
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_access (
  uid                       TEXT PRIMARY KEY,    -- Firebase Auth UID
  remainingMinutes          INTEGER NOT NULL DEFAULT 0,
  totalMinutesPurchased     INTEGER NOT NULL DEFAULT 0,
  timerStartedAt            INTEGER,             -- epoch millis, nullable
  timerExpiresAt            INTEGER,             -- epoch millis, nullable
  lastBuyAt                 INTEGER,             -- epoch millis, nullable
  createdAt                 INTEGER NOT NULL,
  updatedAt                 INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_aiaccess_lastBuyAt  ON ai_access (lastBuyAt);

-- ============================================================================
-- 4. inbox — pesan ke user (transfer gold masuk, payout marketplace, pengumuman)
-- ============================================================================
CREATE TABLE IF NOT EXISTS inbox (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  uid               TEXT NOT NULL,               -- penerima
  fromUid           TEXT,                         -- pengirim (nullable untuk sistem)
  fromEmail         TEXT,
  fromName          TEXT,
  type              TEXT NOT NULL,                -- 'gold_transfer' | 'marketplace_payout' | 'announcement' | 'admin_grant' | 'admin_deduct'
  amount            INTEGER,                      -- gold amount (nullable)
  tax               INTEGER,                      -- tax dipotong (nullable)
  note              TEXT,                         -- pesan singkat
  announcementId    INTEGER,                      -- refer announcements.id (nullable)
  announcementBody  TEXT,                         -- snapshot body pengumuman
  read              INTEGER NOT NULL DEFAULT 0,   -- 0=unread, 1=read
  createdAt         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inbox_uid        ON inbox (uid);
CREATE INDEX IF NOT EXISTS idx_inbox_uid_read   ON inbox (uid, read);
CREATE INDEX IF NOT EXISTS idx_inbox_announceId ON inbox (announcementId);
CREATE INDEX IF NOT EXISTS idx_inbox_createdAt  ON inbox (createdAt);

-- ============================================================================
-- 5. announcements — pesan admin broadcast ke semua user
-- ============================================================================
CREATE TABLE IF NOT EXISTS announcements (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  createdByUid    TEXT,
  createdByEmail  TEXT,
  createdByName   TEXT,
  delivered       INTEGER NOT NULL DEFAULT 0,    -- 0=draft, 1=sudah dikirim
  deliveredAt     INTEGER,                        -- epoch millis, nullable
  recipientCount  INTEGER NOT NULL DEFAULT 0,
  createdAt       INTEGER NOT NULL,
  updatedAt       INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_announce_delivered  ON announcements (delivered);
CREATE INDEX IF NOT EXISTS idx_announce_createdAt  ON announcements (createdAt);

-- ============================================================================
-- 6. audit_log — jejak tindakan admin (grant, deduct, ban, dst)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp     INTEGER NOT NULL,                -- epoch millis
  actorUid      TEXT NOT NULL,                    -- admin yang melakukan aksi
  actorEmail    TEXT,
  action        TEXT NOT NULL,                    -- 'grant' | 'deduct' | 'ban' | 'announcement_create' | 'announcement_edit' | 'announcement_delete'
  targetUid     TEXT,                             -- user yang dikenai aksi
  targetEmail   TEXT,
  amount        INTEGER,                          -- gold amount (nullable)
  meta          TEXT,                             -- JSON string
  ip            TEXT,
  userAgent     TEXT
);

CREATE INDEX IF NOT EXISTS idx_auditlog_timestamp   ON audit_log (timestamp);
CREATE INDEX IF NOT EXISTS idx_auditlog_actorUid     ON audit_log (actorUid);
CREATE INDEX IF NOT EXISTS idx_auditlog_action       ON audit_log (action);
CREATE INDEX IF NOT EXISTS idx_auditlog_targetUid     ON audit_log (targetUid);

-- ============================================================================
-- 7. marketplace_products — katalog produk marketplace
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_products (
  id                  TEXT PRIMARY KEY,           -- product ID (string)
  name                TEXT NOT NULL,
  category            TEXT,
  price               INTEGER NOT NULL DEFAULT 0, -- harga dalam gold
  rating              REAL NOT NULL DEFAULT 0,
  sales               INTEGER NOT NULL DEFAULT 0,
  gradient            TEXT,                       -- CSS gradient string (untuk UI)
  imageUrl            TEXT,
  description         TEXT,
  active              INTEGER NOT NULL DEFAULT 1, -- 1=aktif dijual, 0=disembunyikan
  seller_uid          TEXT,                       -- uid penjual (nullable untuk produk sistem)
  seller_payout_rate  REAL NOT NULL DEFAULT 0.95  -- 0.95 = penjual dapat 95%, 5% platform tax
);

CREATE INDEX IF NOT EXISTS idx_products_active    ON marketplace_products (active);
CREATE INDEX IF NOT EXISTS idx_products_category  ON marketplace_products (category);
CREATE INDEX IF NOT EXISTS idx_products_seller    ON marketplace_products (seller_uid);
CREATE INDEX IF NOT EXISTS idx_products_sales     ON marketplace_products (sales);

-- ============================================================================
-- 8. cart_items — isi keranjang belanja user
-- ============================================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  uid         TEXT NOT NULL,                      -- Firebase Auth UID
  productId   TEXT NOT NULL,                      -- refer marketplace_products.id
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 99),
  addedAt     INTEGER NOT NULL,
  updatedAt   INTEGER NOT NULL,
  UNIQUE (uid, productId)                         -- satu produk = satu baris (merge quantity)
);

CREATE INDEX IF NOT EXISTS idx_cart_uid  ON cart_items (uid);

-- ============================================================================
-- 9. orders — header order setelah checkout
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  uid         TEXT NOT NULL,                      -- buyer
  email       TEXT,
  totalGold   INTEGER NOT NULL,
  itemCount   INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'paid',       -- 'paid' | 'refunded' | 'failed'
  createdAt   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_uid       ON orders (uid);
CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders (createdAt);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders (status);

-- ============================================================================
-- 10. order_items — rincian item per order
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId     INTEGER NOT NULL,
  uid         TEXT NOT NULL,                      -- buyer
  productId   TEXT NOT NULL,
  productName TEXT NOT NULL,                      -- snapshot nama saat beli
  price       INTEGER NOT NULL,
  quantity    INTEGER NOT NULL,
  subtotal    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orderitems_orderId ON order_items (orderId);
CREATE INDEX IF NOT EXISTS idx_orderitems_uid      ON order_items (uid);
CREATE INDEX IF NOT EXISTS idx_orderitems_productId ON order_items (productId);

-- ============================================================================
-- 11. seller_revenue — agregat pendapatan penjual
-- ============================================================================
CREATE TABLE IF NOT EXISTS seller_revenue (
  uid             TEXT PRIMARY KEY,               -- seller Firebase Auth UID
  email           TEXT,
  displayName     TEXT,
  totalEarned     INTEGER NOT NULL DEFAULT 0,
  totalTaxPaid    INTEGER NOT NULL DEFAULT 0,
  totalSales      INTEGER NOT NULL DEFAULT 0,
  totalItemsSold  INTEGER NOT NULL DEFAULT 0,
  lastSaleAt      INTEGER,
  updatedAt       INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sellerrev_lastSaleAt ON seller_revenue (lastSaleAt);

-- ============================================================================
-- VERIFIKASI: jalankan query berikut untuk cek semua tabel sudah ada
-- ============================================================================
-- SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
-- Expected: 11 tabel + sqlite_sequence (auto dari AUTOINCREMENT)
