import { applyCors, applySecurityHeaders, checkRateLimit, validateStr, authenticateRequest, isAdmin, getPunyaSiJawaFirestore } from "../lib/api-helpers.js";
import { askAI } from "../lib/ai-client.js";
import { getPackages, buyAITime, activateTimer, checkAITimerAccess, getFullAIStatus, getGoldBalance, addGold, deductGold, transferGold, getRecentTransfers, lookupUserByEmail, getAllUsers, bulkGrantAll, bulkDeductAll, ensureUserDoc, getTransferTax, getReceiveAmount, getInbox, getUnreadInboxCount, markInboxRead, markAllInboxRead } from "../lib/gold-system.js";
import { getAnalyticsStats, getTopicUsage, logChatTopic } from "../lib/analytics-api.js";

export default async function handler(req, res) {
  applyCors(req, res, "GET, POST, OPTIONS");
  applySecurityHeaders(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  const action = req.query?.action || null;

  if (req.method === "GET") {
    if (action === "stats") {
      try {
        const user = await authenticateRequest(req);
        if (!user) return res.status(401).json({ error: "Login required" });
        if (!isAdmin(user)) return res.status(403).json({ error: "Hanya admin yang bisa akses statistik" });
        const [stats, topics] = await Promise.all([getAnalyticsStats(), getTopicUsage()]);
        return res.status(200).json({ ...stats, topics });
      } catch (e) {
        console.error("[ai-chat] stats error:", e?.message || e);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
    if (action === "packages" || action === "gold-info") {
      try {
        const user = await authenticateRequest(req);
        if (!user) return res.status(401).json({ error: "Login required" });
        await ensureUserDoc(user.sub, user.email, user.name);
        const admin = isAdmin(user);
        const status = await getFullAIStatus(user.sub, admin);
        return res.status(200).json(status);
      } catch (e) {
        console.error("[ai-chat] gold-info error:", e?.message || e);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
    if (action === "lookup-user") {
      try {
        const user = await authenticateRequest(req);
        if (!user) return res.status(401).json({ error: "Login required" });
        await ensureUserDoc(user.sub, user.email, user.name);
        const email = req.query?.email;
        if (!email || typeof email !== "string" || !email.includes("@")) {
          return res.status(400).json({ error: "Email tidak valid" });
        }
        const found = await lookupUserByEmail(email);
        if (!found) return res.status(404).json({ error: "User tidak ditemukan", found: false });
        return res.status(200).json({ found: true, uid: found.uid, email: found.email, displayName: found.displayName, gold: found.gold });
      } catch (e) {
        console.error("[ai-chat] lookup-user error:", e?.message || e);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
    if (action === "list-members") {
      try {
        const user = await authenticateRequest(req);
        if (!user) return res.status(401).json({ error: "Login required" });
        await ensureUserDoc(user.sub, user.email, user.name);
        if (!isAdmin(user)) return res.status(403).json({ error: "Hanya admin" });
        const members = await getAllUsers();
        // Don't expose full UID for privacy — only first 12 chars
        const safe = members.map((m) => ({
          uid: m.uid,
          email: m.email,
          displayName: m.displayName,
          gold: m.gold,
        }));
        return res.status(200).json({ members: safe, total: safe.length });
      } catch (e) {
        console.error("[ai-chat] list-members error:", e?.message || e);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
    if (action === "transfer-history") {
      try {
        const user = await authenticateRequest(req);
        if (!user) return res.status(401).json({ error: "Login required" });
        await ensureUserDoc(user.sub, user.email, user.name);
        const limit = Math.min(parseInt(req.query?.limit || "20", 10), 50);
        const transfers = await getRecentTransfers(user.sub, limit);
        return res.status(200).json({ transfers });
      } catch (e) {
        console.error("[ai-chat] transfer-history error:", e?.message || e);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
    if (action === "inbox") {
      try {
        const user = await authenticateRequest(req);
        if (!user) return res.status(401).json({ error: "Login required" });
        await ensureUserDoc(user.sub, user.email, user.name);
        const limit = Math.min(parseInt(req.query?.limit || "20", 10), 50);
        const messages = await getInbox(user.sub, limit);
        const unreadCount = await getUnreadInboxCount(user.sub);
        return res.status(200).json({ messages, unreadCount });
      } catch (e) {
        console.error("[ai-chat] inbox error:", e?.message || e);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
    if (action === "tax-info") {
      try {
        const user = await authenticateRequest(req);
        if (!user) return res.status(401).json({ error: "Login required" });
        const admin = isAdmin(user);
        const amount = parseInt(req.query?.amount || "0", 10);
        const info = {
          rate: 0.05,
          ratePercent: "5%",
          adminTaxFree: true,
        };
        if (amount > 0) {
          info.tax = admin ? 0 : getTransferTax(amount);
          info.receiveAmount = admin ? amount : getReceiveAmount(amount);
        }
        return res.status(200).json(info);
      } catch (e) {
        console.error("[ai-chat] tax-info error:", e?.message || e);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
    return res.status(200).json({ status: "ok" });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await authenticateRequest(req);
    if (!user) return res.status(401).json({ error: "Login required to use AI chat" });

    // Ensure user doc exists in Firestore with email/displayName
    await ensureUserDoc(user.sub, user.email, user.name);

    const admin = isAdmin(user);
    const uid = user.sub || "unknown";

    if (action === "buy-time") {
      if (admin) return res.status(200).json({ message: "Admin has unlimited access", remainingMinutes: Infinity, goldBalance: Infinity });
      const { packageId } = req.body || {};
      if (!packageId || typeof packageId !== "string") {
        return res.status(400).json({ error: "packageId wajib diisi" });
      }
      try {
        const result = await buyAITime(uid, packageId);
        return res.status(200).json({ message: "Berhasil membeli waktu AI", remainingMinutes: result.remainingMinutes, goldBalance: result.goldBalance });
      } catch (e) {
        if (e.message === "insufficient gold") return res.status(402).json({ error: "Gold tidak cukup", gold: await getGoldBalance(uid) });
        if (e.message.startsWith("cooldown")) return res.status(429).json({ error: "Tunggu 3 detik sebelum beli lagi" });
        if (e.message === "invalid package") return res.status(400).json({ error: "Paket tidak valid" });
        throw e;
      }
    }

    if (action === "activate-timer") {
      if (admin) return res.status(200).json({ message: "Admin has unlimited access", timerActive: true, remainingMinutes: Infinity });
      try {
        const result = await activateTimer(uid);
        return res.status(200).json({ message: "Timer diaktifkan", timerExpiresAt: result.timerExpiresAt, remainingMinutes: result.remainingMinutes, warning: "Timer tidak bisa dihentikan setelah diaktifkan!" });
      } catch (e) {
        if (e.message === "no remaining time") return res.status(400).json({ error: "Belum punya waktu AI. Beli dulu paketnya." });
        if (e.message === "timer already active") return res.status(409).json({ error: "Timer sudah aktif" });
        throw e;
      }
    }

    if (action === "add-gold") {
      if (!admin) return res.status(403).json({ error: "Hanya admin yang bisa menambah gold" });
      const { targetUid, amount, type } = req.body || {};
      if (!targetUid || !amount || amount <= 0) return res.status(400).json({ error: "targetUid dan amount wajib diisi" });
      const newBalance = await addGold(targetUid, amount, type || "admin_grant", { grantedBy: uid });
      return res.status(200).json({ message: "Gold ditambahkan", uid: targetUid, newBalance });
    }

    // ── Coin Transfer (merged from coin-transfer.js to stay under Vercel 12-function limit) ──
    if (action === "transfer") {
      const { targetUid, targetEmail, amount, note } = req.body || {};
      let resolvedUid = targetUid;

      // If targetEmail provided instead of UID, resolve it
      if (!resolvedUid && targetEmail) {
        if (typeof targetEmail !== "string" || !targetEmail.includes("@")) {
          return res.status(400).json({ error: "Email tujuan tidak valid" });
        }
        const found = await lookupUserByEmail(targetEmail);
        if (!found) return res.status(404).json({ error: "User dengan email tersebut tidak ditemukan" });
        resolvedUid = found.uid;
      }

      if (!resolvedUid || typeof resolvedUid !== "string" || resolvedUid.trim().length < 5) return res.status(400).json({ error: "targetUid atau targetEmail wajib diisi" });
      if (!amount || typeof amount !== "number" || amount < 1 || amount > 1000) return res.status(400).json({ error: "Amount wajib 1-1000 gold" });
      if (resolvedUid === uid) return res.status(400).json({ error: "Nggak bisa transfer ke diri sendiri" });
      if (admin) {
        // Admin transfers are tax-free
        const nb = await addGold(resolvedUid, amount, "admin_grant", { grantedBy: uid, note: note || null });
        return res.status(200).json({ message: "Gold dikirim (admin grant, tax-free)", transferId: `admin_${Date.now()}`, targetUid: resolvedUid, amount, tax: 0, receiveAmount: amount, targetNewBalance: nb });
      }
      try {
        const tax = getTransferTax(amount);
        const receiveAmount = getReceiveAmount(amount);
        const result = await transferGold(uid, resolvedUid, amount, { note: note || null, fromEmail: user.email || null, fromName: user.name || null });
        return res.status(200).json({ message: `Transfer berhasil! Penerima dapat ${receiveAmount} gold (tax: ${tax})`, ...result });
      } catch (e) {
        if (e.message === "insufficient gold") return res.status(402).json({ error: "Gold kamu kurang!", gold: await getGoldBalance(uid), needed: amount });
        if (e.message === "recipient not found") return res.status(404).json({ error: "User tujuan tidak ditemukan" });
        throw e;
      }
    }

    if (action === "grant") {
      if (!admin) return res.status(403).json({ error: "Hanya admin yang bisa grant gold" });
      const { targetUid, targetEmail, amount, note } = req.body || {};
      let resolvedUid = targetUid;

      // If targetEmail provided instead of UID, resolve it
      if (!resolvedUid && targetEmail) {
        if (typeof targetEmail !== "string" || !targetEmail.includes("@")) {
          return res.status(400).json({ error: "Email tujuan tidak valid" });
        }
        const found = await lookupUserByEmail(targetEmail);
        if (!found) return res.status(404).json({ error: "User dengan email tersebut tidak ditemukan" });
        resolvedUid = found.uid;
      }

      if (!resolvedUid || !amount || amount <= 0 || amount > 10000) return res.status(400).json({ error: "targetUid/targetEmail dan amount wajib (1-10000)" });
      const nb = await addGold(resolvedUid, amount, "admin_grant", { grantedBy: uid, note: note || null });
      return res.status(200).json({ message: "Gold di-grant", uid: resolvedUid, amount, newBalance: nb });
    }

    // ── Bulk Grant — Admin bagi coin ke SEMUA member sekaligus ──
    if (action === "bulk-grant") {
      if (!admin) return res.status(403).json({ error: "Hanya admin yang bisa bulk grant" });
      const { amount, note, excludeSelf } = req.body || {};
      if (!amount || typeof amount !== "number" || amount < 1 || amount > 10000) {
        return res.status(400).json({ error: "Amount wajib 1-10000" });
      }
      try {
        // Exclude admin UID from receiving
        const excludeUids = excludeSelf !== false ? [uid] : [];
        const result = await bulkGrantAll(amount, uid, excludeUids, note || "Bulk grant by admin");
        return res.status(200).json({
          message: `Berhasil bagi ${amount} gold ke ${result.count} member`,
          ...result,
        });
      } catch (e) {
        console.error("[ai-chat] bulk-grant error:", e?.message || e);
        return res.status(500).json({ error: "Bulk grant gagal: " + (e?.message || "unknown error") });
      }
    }

    // ── Deduct Gold — Admin tarik gold dari member (antisipasi abuse) ──
    if (action === "deduct-gold") {
      if (!admin) return res.status(403).json({ error: "Hanya admin yang bisa tarik gold" });
      const { targetUid, targetEmail, amount, note } = req.body || {};
      let resolvedUid = targetUid;

      if (!resolvedUid && targetEmail) {
        const found = await lookupUserByEmail(targetEmail);
        if (!found) return res.status(404).json({ error: "User tidak ditemukan" });
        resolvedUid = found.uid;
      }
      if (!resolvedUid || !amount || typeof amount !== "number" || amount < 1 || amount > 10000) {
        return res.status(400).json({ error: "targetUid/targetEmail dan amount wajib (1-10000)" });
      }
      try {
        const result = await deductGold(resolvedUid, amount, "admin_deduct", { deductedBy: uid, note: note || null });
        return res.status(200).json({ message: `Berhasil tarik ${amount} gold`, uid: resolvedUid, amount, newBalance: result });
      } catch (e) {
        if (e.message === "insufficient gold") return res.status(402).json({ error: "Saldo member kurang", gold: await getGoldBalance(resolvedUid) });
        console.error("[ai-chat] deduct-gold error:", e?.message || e);
        return res.status(500).json({ error: "Deduct gagal: " + (e?.message || "unknown error") });
      }
    }

    // ── Bulk Deduct — Admin tarik gold dari SEMUA member sekaligus (anti-abuse) ──
    if (action === "bulk-deduct") {
      if (!admin) return res.status(403).json({ error: "Hanya admin yang bisa bulk deduct" });
      const { amount, note } = req.body || {};
      if (!amount || typeof amount !== "number" || amount < 1 || amount > 100000) {
        return res.status(400).json({ error: "Amount wajib 1-100000" });
      }
      try {
        const result = await bulkDeductAll(amount, uid, note || "Bulk deduct by admin");
        return res.status(200).json({
          message: `Berhasil tarik max ${amount} gold dari ${result.count} member`,
          ...result,
        });
      } catch (e) {
        console.error("[ai-chat] bulk-deduct error:", e?.message || e);
        return res.status(500).json({ error: "Bulk deduct gagal: " + (e?.message || "unknown error") });
      }
    }

    // ── Inbox: mark message read ──
    if (action === "inbox-read") {
      const { messageId } = req.body || {};
      if (!messageId || typeof messageId !== "string") {
        return res.status(400).json({ error: "messageId wajib diisi" });
      }
      try {
        await markInboxRead(uid, messageId);
        return res.status(200).json({ ok: true });
      } catch (e) {
        if (e.message === "not your message") return res.status(403).json({ error: "Bukan pesan kamu" });
        if (e.message === "message not found") return res.status(404).json({ error: "Pesan tidak ditemukan" });
        console.error("[ai-chat] inbox-read error:", e?.message || e);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    // ── Inbox: mark all read ──
    if (action === "inbox-read-all") {
      try {
        const count = await markAllInboxRead(uid);
        return res.status(200).json({ ok: true, count });
      } catch (e) {
        console.error("[ai-chat] inbox-read-all error:", e?.message || e);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    if (!admin) {
      if (!checkRateLimit("ai-chat:" + uid, 10, 60000)) {
        return res.status(429).json({ error: "Terlalu banyak request. Tunggu sebentar ya." });
      }
      const timerCheck = await checkAITimerAccess(uid);
      if (!timerCheck.allowed) {
        const status = await getFullAIStatus(uid, false);
        if (timerCheck.reason === "timer_not_active") {
          return res.status(403).json({ error: "Aktifkan timer AI terlebih dahulu", code: "TIMER_NOT_ACTIVE", remainingMinutes: timerCheck.remainingMinutes, gold: status.gold });
        }
        if (timerCheck.reason === "timer_expired") {
          return res.status(403).json({ error: "Waktu AI sudah habis. Beli paket baru untuk lanjut.", code: "TIMER_EXPIRED", gold: status.gold });
        }
        return res.status(403).json({ error: "Akses AI ditolak", code: "NO_ACCESS" });
      }
    }

    const { message, chatId, history } = req.body || {};
    if (!validateStr(message, 2000)) {
      return res.status(400).json({ error: "message wajib diisi (max 2000 karakter)" });
    }

    let cleanHistory = null;
    if (Array.isArray(history) && history.length > 0) {
      cleanHistory = history
        .filter((h) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
        .slice(-20)
        .map((h) => ({ role: h.role, content: h.content.slice(0, 2000) }));
    }

    logChatTopic(uid, message);

    const canned = getCannedResponse(message);
    if (canned) {
      return res.status(200).json({
        answer: canned,
        chatId: chatId || "babft-faq",
        model: "babft-knowledge-base",
      });
    }

    const result = await askAI(message, {
      chatId: chatId || undefined,
      history: cleanHistory || undefined,
    });

    if (!result.status) {
      console.error("[ai-chat] AI error:", result.error);
      return res.status(502).json({ error: "AI service sedang sibuk. Coba lagi nanti." });
    }

    return res.status(200).json({
      answer: result.answer,
      chatId: result.chatId,
      model: result.model,
    });
  } catch (e) {
    console.error("[ai-chat]", e?.message || e);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function getCannedResponse(message) {
  const msg = message.toLowerCase().trim();

  if (isCodingRequest(msg)) return CODE_BLOCK_MSG;
  if (isIdentityQuestion(msg)) return IDENTITY_MSG;

  if (/^(apa|what|jelaskan|jelasin|info|definisi|tell me about).*(babft|platform ini|platform apa)/.test(msg) ||
      /(belajar|diajarkan|diajarin|materi|pelajaran) (apa|apa aja) (di|disini|di sini)/.test(msg)) {
    return PLATFORM_INFO;
  }

  if (/(siapa|who|siapakah).*(buat|pembuat|developer|creator|bikin).*(babft|build a boat|boat for treasure|game ini)/.test(msg) ||
      /chillthrill/.test(msg)) {
    return CREATOR_INFO;
  }

  if (/(chest|peti|harga|beli|gold|shop|toko).*(babft|game|build a boat|boat for treasure)/.test(msg) ||
      /(berapa|apa saja|sebutkan|jenis|macam).*(chest|peti)/.test(msg) ||
      /(common|uncommon|rare|epic|legendary).*(chest|peti)/.test(msg)) {
    return CHEST_INFO;
  }

  if (/(quest|misi|objective).*(babft|game|build a boat|boat for treasure)/.test(msg) ||
      /(quest|misi) (apa|yg|yang) (ada|tersedia|bisa)/.test(msg)) {
    return QUEST_INFO;
  }

  if (/(kode|code|redeem).*(aktif|active|masih|babft|game|build a boat)/.test(msg)) {
    return CODE_INFO;
  }

  if (/(event|acara|halloween|christmas|natal|easter|paskah).*(babft|game|build a boat|boat for treasure)/.test(msg)) {
    return EVENT_INFO;
  }

  if (/jetpack|jet pack/.test(msg) && /dapat|dapetin|cara|beli|how|get/.test(msg)) {
    return JETPACK_INFO;
  }

  if (/(tool|alat).*(apa|yg|yang|ada|tersedia|bisa).*(babft|game|build a boat|boat for treasure)/.test(msg) ||
      /binding tool|scaling tool|property tool|trowel tool|paint tool|building tool|delete tool/.test(msg)) {
    return TOOLS_INFO;
  }

  return null;
}

function isIdentityQuestion(msg) {
  const identityPatterns = [
    /^kamu (siapa|siapakah|apa)\b/i,
    /^lu (siapa|siapakah|apa)\b/i,
    /^(kau|anda|elo) (siapa|apa)\b/i,
    /(kamu|lu|anda) (bisa|bisa apa|bisa ngapain|bisa ngapain aja)\b/i,
    /(siapa|apa) (nama|nama kamu|nama lo|nama lu)\b/i,
    /^who (are )?you\b/i,
    /^what (are|can) you\b/i,
  ];
  for (const p of identityPatterns) {
    if (p.test(msg)) return true;
  }
  return false;
}

function isCodingRequest(msg) {
  const codePatterns = [
    /\bbuat(?:kan|in|kode)?\b.*\b(?:kode|coding|script|program|aplikasi|app|bot|website|html|css|js|javascript|python|php|java|ruby|go|rust|c\+\+|sql|api|endpoint|function|fungsi|class)\b/i,
    /\bbikin(?:in|kan)?\b.*\b(?:kode|coding|script|program|aplikasi|app|bot|website|html|css|js|javascript|python|php)\b/i,
    /\btulis(?:kan|in)?\b.*\b(?:kode|coding|script|program|function|fungsi)\b/i,
    /\bcoding(?:in|kan)?\b.*\b(?:dong|donk|pls|please|ya|yah|aku|gw|saya)\b/i,
    /\bbuat\b.*\bnginx\b/i,
    /\bdeploy\b.*\b(?:server|vps|docker|kubernetes)\b/i,
    /\bconfig(?:urasi|ur)?\b.*\b(?:nginx|apache|server|firewall)\b/i,
    /\bbagaimana\b.*\bcara\b.*\b(?:hack|hackin|bypass|exploit|ddos|phishing)\b/i,
    /\b(?:hack|hackin|bypass|exploit|ddos|phishing|carding|deface)\b/i,
  ];
  for (const pattern of codePatterns) {
    if (pattern.test(msg)) return true;
  }
  return false;
}

const CODE_BLOCK_MSG = `# 🚫 Maaf, Saya Tidak Bisa Membuat Kode

Saya adalah **AI Tutor BABFT Learning** — tugas saya membantu kamu belajar:
- ⚡ **Logic Gates** (AND, OR, NOT, XOR, dll)
- ⚙️ **Gears & Mechanisms**
- 🔩 **Linkages Mechanic**
- 🎮 **Build A Boat For Treasure** (informasi game)

Saya **tidak bisa**:
- ❌ Membuat kode/program/script
- ❌ Membuat website/aplikasi
- ❌ Konfigurasi server/nginx/docker
- ❌ Hacking/exploit/aktivitas ilegal

Kalau kamu butuh bantuan coding, coba tanya ke tools yang tepat seperti GitHub Copilot, ChatGPT, atau Stack Overflow ya!

Ada yang bisa saya bantu tentang Logic Gates atau BABFT? 😊`;

const IDENTITY_MSG = `# 👋 Halo! Aku Yuki, AI Tutor BABFT Learning 🏴‍☠️

Aku dibuat oleh **tim pengembang BABFT Learning** untuk membantu kamu belajar:

## 📚 Yang Bisa Aku Bantu:
- ⚡ **Logic Gates** — AND, OR, NOT, XOR, NAND, NOR, XNOR
- ⚙️ **Gears & Mechanisms** — 36 jenis gear
- 🔩 **Linkages Mechanic** — 45 jenis linkage
- 🎮 **Build A Boat For Treasure** — Chest, Quest, Event, Tools, Codes

## ❌ Yang TIDAK Bisa Aku Lakukan:
- Membuat kode/program/script
- Membuat website atau aplikasi
- Konfigurasi server
- Aktivitas ilegal

Mau belajar yang mana dulu? 😊`;

const PLATFORM_INFO = `# 🏴‍☠️ BABFT Learning — Platform Belajar Logic Gates!

BABFT Learning adalah **platform edukasi interaktif** bertema game Roblox **"Build A Boat For Treasure"** yang mengajarkan konsep **Logic Gates (Gerbang Logika)** digital dengan cara visual dan menyenangkan.

## 📚 Yang Diajarkan:

### ⚡ Basic Logic Gates (7 gerbang + pengantar)
- **Basic Wire** — Sinyal mengalir langsung, dasar semua rangkaian
- **NOT Gate** — Pembalik sinyal (Inverter)
- **AND Gate** — Output 1 hanya jika semua input 1
- **NAND Gate** — Kebalikan AND (gerbang universal)
- **OR Gate** — Output 1 jika salah satu input 1
- **NOR Gate** — Kebalikan OR
- **XOR Gate** — Exclusive OR, output 1 jika input berbeda
- **XNOR Gate** — Kebalikan XOR

### 🔗 Logic Gates Circuit
Rangkaian gabungan beberapa gate dengan sistem tier:
🟢 MUDAH → 🟡 NORMAL → 🔴 HARD → 🌈 INSANE

### ⚙️ Gears (36 jenis) | 🔩 Linkages Mechanic (45 jenis)

## 🎮 Fitur Unggulan:
- Diagram interaktif dengan **neon glow**
- Truth table dinamis real-time
- Auto-save progress

Mau belajar yang mana dulu? 😊`;

const CREATOR_INFO = `# 👨‍💻 Pembuat Build A Boat For Treasure

Game **Build A Boat For Treasure** dibuat oleh **chillthrill709** di bawah grup **Chillz Studios**.

## Timeline:
- **2016** — Rilis resmi
- **2018** — "The Mechanic Update": roda, motor, engsel
- **2019** — "The Tool Update": scaling, paint, trowel
- **2020-2021** — "The Logic Update": switch, delay, piston
- **2022-Sekarang** — Ekspansi stage, event, quest baru

chillthrill709 sangat aktif — ada badge langka **"Meet the Creator"**!`;

const CHEST_INFO = `# 🎁 Chest Shop — Build A Boat For Treasure

| Chest | Harga | Blok | Drop Utama |
|---|---|---|---|
| ⬜ **Common** | 5G | 5 | Blok Biasa |
| 🟦 **Uncommon** | 15G | 15 | + Uncommon |
| 🟪 **Rare** | 45G | 45 | Engsel & Roda |
| 🟧 **Epic** | 135G | 105 | Titanium, Senjata |
| 🟨 **Legendary** | 405G | 270 | ⭐ Jetpack, Mega Thruster! |

💡 Tabung buat Legendary — paling worth it!`;

const QUEST_INFO = `# 📋 Quest — Build A Boat For Treasure

| Quest | Objective | Reward |
|---|---|---|
| ☁️ Cloud | Capai awan | 100G + 100 Balloons |
| 🐉 Dragon | Kalahkan Naga | 25G + 25 Cannons |
| 🔍 Find Me | Blok tersembunyi | 300G + 500 Ice |
| 🚀 Ramp | Luncurkan kendaraan | 350G + 250 Glue |
| ⚽ Soccer | Cetak gol | 300G + Soccer Ball |
| 🎯 Target | Tembak target | 200G + 2 Thrusters |
| 📦 The Box | Bertahan di kotak | 350G + 100 Wood |
| 🧊 Thin Ice | Es mencair | 1000G + 100 Ice |

💡 **Thin Ice** paling profitable (1000G)!`;

const CODE_INFO = `# 🔑 Kode Aktif — Build A Boat For Treasure

| Kode | Reward |
|---|---|
| \`hi\` | 5 Gold |
| \`squid army\` | 22x Ice + 22x Gold |
| \`chillthrill709 was here\` | Block Firework |

💡 Redeem: Settings → masukkan kode → klaim!`;

const EVENT_INFO = `# 🎉 Event Tahunan — Build A Boat For Treasure

| Event | Waktu | Highlight |
|---|---|---|
| 🎃 Halloween | Oktober | Boss + berburu permen |
| 🎄 Christmas | Desember | Salju + Winter Motor |
| 🐣 Easter | Paskah | Berburu telur |
| ⚔️ RB Battles | Selesai | Sword of Truth |

Semua event gratis — tinggal main!`;

const JETPACK_INFO = `# 🚀 Cara Dapat Jetpack

Didapat dari **Legendary Chest** (405 Gold).

## Strategi:
1. 🎯 Quest **Thin Ice** = 1000G
2. 🏁 Capai **The End** = harta karun
3. 🔍 Cari **Secret Areas**

## Varian:
- Jetpack (standar) | Ultra Jetpack | Easter/Star/Steampunk Jetpack

💡 Tabung 405 Gold → Legendary Chest → ulangi sampai dapat!`;

const TOOLS_INFO = `# 🔧 Tools — Build A Boat For Treasure

| Tool | Fungsi |
|---|---|
| 🔨 Building | Menempatkan blok |
| 🗑️ Delete | Menghapus blok |
| 🎨 Paint | Mengubah warna |
| 🔗 Binding | Tombol → pendorong/roda |
| ⚙️ Property | Atur transparansi/kolisi |
| 📏 Scaling | Peregangan blok |
| 🏗️ Trowel | Pindah/duplikasi bagian |

💡 Binding Tool = kunci mekanisme otomatis!`;
