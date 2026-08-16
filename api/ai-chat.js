import { applyCors, applySecurityHeaders, checkRateLimit, validateStr, authenticateRequest, isAdmin } from "../lib/api-helpers.js";
import { askAI } from "../lib/ai-client.js";

export default async function handler(req, res) {
  applyCors(req, res, "GET, POST, OPTIONS");
  applySecurityHeaders(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.status(200).json({ status: "ok" });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await authenticateRequest(req);
    if (!user) return res.status(401).json({ error: "Login required to use AI chat" });

    if (!isAdmin(user)) {
      const uid = user.sub || "unknown";
      if (!checkRateLimit("ai-chat:" + uid, 10, 60000)) {
        return res.status(429).json({ error: "Terlalu banyak request. Tunggu sebentar ya." });
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

const IDENTITY_MSG = `# 👋 Halo! Saya AI Tutor BABFT Learning 🏴‍☠️

Saya dibuat oleh **tim pengembang BABFT Learning** untuk membantu kamu belajar:

## 📚 Yang Bisa Saya Bantu:
- ⚡ **Logic Gates** — AND, OR, NOT, XOR, NAND, NOR, XNOR
- ⚙️ **Gears & Mechanisms** — 36 jenis gear
- 🔩 **Linkages Mechanic** — 45 jenis linkage
- 🎮 **Build A Boat For Treasure** — Chest, Quest, Event, Tools, Codes

## ❌ Yang TIDAK Bisa Saya Lakukan:
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
