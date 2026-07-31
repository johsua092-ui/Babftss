// api/ai-chat.js — AI Chat API Route (serverless)
// POST /api/ai-chat — AI Tutor + Game FAQ endpoint
// Pre-filter handles platform & game facts → AI handles Logic Gates tutoring
import { applyCors, applySecurityHeaders, checkRateLimit, validateStr } from "../lib/api-helpers.js";
import { askAI } from "../lib/ai-client.js";

export default async function handler(req, res) {
  applyCors(req, res, "POST, OPTIONS");
  applySecurityHeaders(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
    if (!checkRateLimit("ai-chat:" + ip, 30, 60000)) {
      return res.status(429).json({ error: "Terlalu banyak request. Tunggu sebentar ya." });
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

    // PRE-FILTER: game FAQ & platform info (accurate, no hallucination)
    const canned = getCannedResponse(message);
    if (canned) {
      return res.status(200).json({
        answer: canned,
        chatId: chatId || "babft-faq",
        model: "babft-knowledge-base",
      });
    }

    // AI tutoring for Logic Gates & general questions
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

// ============================================================
// SMART PRE-FILTER — Platform & Game FAQ
// Regex-based matching: only triggers on CLEAR fact questions
// Returns null → pass through to AI tutoring
// ============================================================
function getCannedResponse(message) {
  const msg = message.toLowerCase().trim();

  // Platform identity: "apa itu babft learning?"
  if (/^(apa|what|jelaskan|jelasin|info|definisi|tell me about).*(babft|platform ini|platform apa)/.test(msg) ||
      /(belajar|diajarkan|diajarin|materi|pelajaran) (apa|apa aja) (di|disini|di sini)/.test(msg)) {
    return PLATFORM_INFO;
  }

  // Creator: "siapa yang buat Build A Boat?"
  if (/(siapa|who|siapakah).*(buat|pembuat|developer|creator|bikin).*(babft|build a boat|boat for treasure|game ini)/.test(msg) ||
      /chillthrill/.test(msg)) {
    return CREATOR_INFO;
  }

  // Chests/Shop: "berapa harga legendary chest?"
  if (/(chest|peti|harga|beli|gold|shop|toko).*(babft|game|build a boat|boat for treasure)/.test(msg) ||
      /(berapa|apa saja|sebutkan|jenis|macam).*(chest|peti)/.test(msg) ||
      /(common|uncommon|rare|epic|legendary).*(chest|peti)/.test(msg)) {
    return CHEST_INFO;
  }

  // Quests: "quest apa aja yang ada?"
  if (/(quest|misi|objective).*(babft|game|build a boat|boat for treasure)/.test(msg) ||
      /(quest|misi) (apa|yg|yang) (ada|tersedia|bisa)/.test(msg)) {
    return QUEST_INFO;
  }

  // Codes: "kode yang masih aktif?"
  if (/(kode|code|redeem).*(aktif|active|masih|babft|game|build a boat)/.test(msg)) {
    return CODE_INFO;
  }

  // Events: "event apa aja?"
  if (/(event|acara|halloween|christmas|natal|easter|paskah).*(babft|game|build a boat|boat for treasure)/.test(msg)) {
    return EVENT_INFO;
  }

  // Jetpack: "cara dapat jetpack?"
  if (/jetpack|jet pack/.test(msg) && /dapat|dapetin|cara|beli|how|get/.test(msg)) {
    return JETPACK_INFO;
  }

  // Tools: "alat apa aja yang ada?"
  if (/(tool|alat).*(apa|yg|yang|ada|tersedia|bisa).*(babft|game|build a boat|boat for treasure)/.test(msg) ||
      /binding tool|scaling tool|property tool|trowel tool|paint tool|building tool|delete tool/.test(msg)) {
    return TOOLS_INFO;
  }

  return null;
}

// ============================================================
// CANNED RESPONSES — 100% accurate, sourced from official dataset
// ============================================================

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
- Diagram interaktif dengan **neon glow** (terang = 1, redup = 0)
- Truth table dinamis real-time
- Auto-save progress (Firebase + Supabase)
- Sistem tier untuk tantangan bertahap

Mau belajar yang mana dulu? 😊`;

const CREATOR_INFO = `# 👨‍💻 Pembuat Build A Boat For Treasure

Game **Build A Boat For Treasure** dibuat oleh **chillthrill709** di bawah grup pengembangan **Chillz Studios**.

## Timeline:
- **2016** — Rilis resmi, game membangun perahu sederhana
- **2018** — "The Mechanic Update": roda, motor, engsel, pilot seat → jadi vehicle builder
- **2019** — "The Tool Update": scaling, paint, trowel tools
- **2020-2021** — "The Logic Update": switch, delay, piston, binding system → sirkuit logika!
- **2022-Sekarang** — Ekspansi stage, event, optimasi server, quest baru

chillthrill709 sangat aktif di komunitas — bahkan ada badge langka **"Meet the Creator"** untuk pemain yang beruntung berada di server yang sama dengannya!`;

const CHEST_INFO = `# 🎁 Chest Shop — Build A Boat For Treasure

Beli peti (chest) menggunakan **Gold**:

| Chest | Harga | Jumlah Blok | Drop Utama |
|---|---|---|---|
| ⬜ **Common** | 5 Gold | 5 blok | 100% Blok Biasa (Kayu, Tanah) |
| 🟦 **Uncommon** | 15 Gold | 15 blok | 75% Biasa + 25% Uncommon (Batu, Kaca) |
| 🟪 **Rare** | 45 Gold | 45 blok | Dominan Langka. Bisa dapat Engsel & Roda |
| 🟧 **Epic** | 135 Gold | 105 blok | Drop Epik (Titanium, Obsidian), peluang Senjata |
| 🟨 **Legendary** | 405 Gold | 270 blok | ⭐ **Jetpack, Mega Thruster, Switch, Delay Block!** |

💡 **Tips:** Tabung untuk Legendary Chest — cost per block paling efisien + drop paling worth it!`;

const QUEST_INFO = `# 📋 Quest — Build A Boat For Treasure

8 Quest dengan reward Gold dan item:

| Quest | Objective | Reward |
|---|---|---|
| ☁️ **Cloud** | Capai awan | 100 Gold + 100 Balloons |
| 🐉 **Dragon** | Kalahkan Naga | 25 Gold + 25 Cannons |
| 🔍 **Find Me** | Temukan blok tersembunyi | 300 Gold + 500 Ice |
| 🚀 **Ramp** | Luncurkan kendaraan dari tanjakan | 350 Gold + 250 Glue |
| ⚽ **Soccer** | Cetak gol | 300 Gold + 1 Soccer Ball |
| 🎯 **Target** | Tembak target | 200 Gold + 2 Thrusters |
| 📦 **The Box** | Bertahan di dalam kotak | 350 Gold + 100 Wood |
| 🧊 **Thin Ice** | Navigasi es mencair | 1000 Gold + 100 Ice |

💡 Quest paling profitable: **Thin Ice** (1000 Gold!)`;

const CODE_INFO = `# 🔑 Kode Aktif — Build A Boat For Treasure

| Kode | Reward |
|---|---|
| \`hi\` | 5 Gold |
| \`squid army\` | 22x Ice + 22x Gold |
| \`chillthrill709 was here\` | Block Firework |

> Kode kedaluwarsa: \`Happy Valentine's day\`, \`Be a big f00t print\`

💡 Cara redeem: buka menu Settings di game → masukkan kode → klaim!`;

const EVENT_INFO = `# 🎉 Event Tahunan — Build A Boat For Treasure

| Event | Waktu | Highlight |
|---|---|---|
| 🎃 **Halloween** | Oktober | Blok seram, boss Halloween, berburu permen |
| 🎄 **Christmas/Winter** | Desember | Salju, es, Winter Boat Motor, kado Natal |
| 🐣 **Easter** | Paskah | Berburu telur di stage, blok spesial |
| ⚔️ **RB Battles** | Spesial (Selesai) | Kolaborasi Roblox Battles, Sword of Truth |

Semua event tahunan gratis — tinggal main saat event berlangsung!`;

const JETPACK_INFO = `# 🚀 Cara Dapat Jetpack — Build A Boat For Treasure

Jetpack didapat melalui **Legendary Chest** (405 Gold).

## Cara ngumpulin Gold:
1. 🎯 **Selesaikan Quest** — terutama **Thin Ice** (1000 Gold!)
2. 🏁 **Capai The End** — buka peti harta karun utama
3. 🔍 **Cari Secret Areas** — beberapa kasih Gold tambahan

## Varian Jetpack:
- **Jetpack** — standar, dari Legendary Chest
- **Ultra Jetpack** — lebih kuat & tahan lama
- **Easter Jetpack** — edisi spesial event Paskah
- **Star Jetpack** — edisi spesial
- **Steampunk Jetpack** — edisi spesial

💡 Strategi: tabung 405 Gold → beli Legendary Chest → ulangi sampai dapat!`;

const TOOLS_INFO = `# 🔧 Tools — Build A Boat For Treasure

7 alat (tools) tersedia untuk membangun:

| Tool | Fungsi |
|---|---|
| 🔨 **Building Tool** | Menempatkan blok dan membangun struktur |
| 🗑️ **Delete Tool** | Menghapus blok dari bangunan |
| 🎨 **Paint Tool** | Mengubah warna blok |
| 🔗 **Binding Tool** | Menghubungkan tombol/tuas ke pendorong/roda |
| ⚙️ **Property Tool** | Mengatur properti blok (transparansi, kolisi) |
| 📏 **Scaling Tool** | Meregangkan atau mengecilkan blok |
| 🏗️ **Trowel Tool** | Memindahkan, memutar, atau menduplikasi bagian bangunan |

💡 Binding Tool adalah kunci untuk membuat mekanisme otomatis — hubungkan Switch ke Thruster = mesin otomatis!`;
