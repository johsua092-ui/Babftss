import { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, PanelLeftClose, PanelLeftOpen, MousePointer2, Cable, X, Paintbrush, Undo2, Redo2, Save, HardDrive, Lock, Unlock, ArrowRightLeft, RotateCcw, AlertTriangle, Check, Coins, RefreshCw, Plus, Search, Move } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ColorWheelPicker from '../components/ColorWheelPicker';
import { toast } from 'sonner';

// ── Gate Data Model (Basic Wire dihapus total — gak dibutuhkan di simulator) ──
const GATE_DATA = [
  { id: 2, type: 'not',   name: 'NOT Gate',   dualInput: false, label: 'NOT',  color: '#f87171',
    description: 'Pembalik sinyal (Inverter).' },
  { id: 3, type: 'and',   name: 'AND Gate',   dualInput: true,  label: 'AND',  color: '#4ade80',
    description: 'Output = 1 HANYA jika A dan B keduanya = 1.' },
  { id: 4, type: 'nand',  name: 'NAND Gate',  dualInput: true,  label: 'NAND', color: '#fb923c',
    description: 'Kebalikan AND. NAND adalah gerbang universal.' },
  { id: 5, type: 'or',    name: 'OR Gate',    dualInput: true,  label: 'OR',   color: '#a78bfa',
    description: 'Output = 1 jika SALAH SATU atau keduanya bernilai 1.' },
  { id: 6, type: 'nor',   name: 'NOR Gate',   dualInput: true,  label: 'NOR',  color: '#f472b6',
    description: 'Kebalikan OR. Output = 1 HANYA jika A dan B keduanya = 0.' },
  { id: 7, type: 'xor',   name: 'XOR Gate',   dualInput: true,  label: 'XOR',  color: '#facc15',
    description: 'Exclusive OR. Output = 1 HANYA jika A dan B BERBEDA.' },
  { id: 8, type: 'xnor',  name: 'XNOR Gate',  dualInput: true,  label: 'XNOR', color: '#2dd4bf',
    description: 'Kebalikan XOR. Output = 1 HANYA jika A dan B SAMA.' },
];

// Pseudo-defs untuk INPUT (Switch) & OUTPUT (LED) — gak masuk GATE_DATA (gak ditampilin sebagai gate),
// tapi dipakai oleh createComponent, draw loop, dan paletteDrag supaya gak crash.
const IO_DEFS = {
  // INPUT (Switch) height ditambah dari 50 → 60 supaya muat drag handle bar di atas (12px).
  // User minta: switch punya tombol drag sendiri biar bisa dipindah tanpa toggle.
  INPUT:  { color: '#f59e0b', label: 'IN',  name: 'Switch', width: 60, height: 60, inputCount: 0, outputCount: 1 },
  OUTPUT: { color: '#ef4444', label: 'OUT', name: 'LED',    width: 60, height: 60, inputCount: 1, outputCount: 0 },
};

const GATE_MAP = Object.fromEntries(GATE_DATA.map(g => [g.type, g]));

// Jarak titik (px,py) ke segmen garis (x1,y1)→(x2,y2).
// Dipakai buat hit-test wire click (user klik mana pun di sepanjang wire).
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// ── Wire color system ──
// User request:
// - Wire ke-1 (first connection): HIJAU tetap, gak boleh diubah (hijau tua OFF, hijau terang ON).
// - Wire ke-2,3,...: warna RANDOM yang unik per-wire. Generate ulang setiap kali user bikin
//   koneksi baru (bukan saat load existing wire). Persisten selama wire tersebut ada.
// - Saat wire dihapus dan user bikin koneksi baru, warna di-generate ulang.
// - User bisa klik wire mana pun → buka RGB palette → set warna manual (override random).
//
// Implementasi:
// - wire.color = null → wire pertama, pakai hijau default.
// - wire.color = {h,s,l} → wire ke-2+, random color (HSL supaya gampang derive ON/OFF).
// - wire.userColor = '#hex' → user override via color picker.
//
// Color rendering:
// - OFF (value=false): warna asli dengan L rendah (redup/dim), supaya tetap kelihatan.
// - ON  (value=true):  warna asli dengan L tinggi (terang/benderang).
//
// Random generator: HSL dengan H random [0,360), S random [55,85]% (cukup saturated biar
// kelihatan jelas, gak terlalu pucat), L ditentukan saat render (OFF=30%, ON=65%).
// Hindari hijau (H 80..160) supaya gak confliict dengan wire ke-1 yang hijau default.

// Generate HSL warna acak untuk wire ke-2,3,...
// existingHues: array of hue yang sudah dipakai, supaya gak duplikat mirip.
function generateWireColor(existingHues = []) {
  let h, s, attempts = 0;
  do {
    h = Math.floor(Math.random() * 360);
    s = 55 + Math.floor(Math.random() * 31);  // 55..85
    attempts++;
    // Cek apakah hue ini terlalu dekat (±10°) dengan hue existing.
    const tooClose = existingHues.some(eh => {
      const diff = Math.abs(h - eh);
      return Math.min(diff, 360 - diff) < 10;
    });
    // Hindari range hijau (80..160) supaya gak conflict dengan wire ke-1 (hijau default).
    const isGreen = h >= 80 && h <= 160;
    if (!tooClose && !isGreen) break;
    // Kalau udah 80 attempts masih gak nemu (existing terlalu padat), accept apa adanya.
    if (attempts >= 80) break;
  } while (true);
  return { h, s };  // L ditentukan saat render berdasarkan value ON/OFF
}

// Convert HSL to hex string.
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to255 = x => Math.round(255 * x);
  return '#' + [to255(f(0)), to255(f(8)), to255(f(4))].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Convert hex to {h,s,l} (untuk slider RGB → preview ON/OFF).
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Dapatkan warna render untuk wire berdasarkan state value (ON/OFF).
// - Wire ke-1 (color=null, userColor=null): hijau default. OFF #2d6a4f, ON #4ade80.
// - Wire ke-2+ (color={h,s}, userColor=null): HSL. OFF l=30%, ON l=65%.
// - User override (userColor='#hex'): parse hex → HSL, OFF l=30%, ON l=65%.
function getWireColors(wire) {
  if (wire.userColor) {
    const { h, s } = hexToHsl(wire.userColor);
    return {
      off: hslToHex(h, s, 30),
      on:  hslToHex(h, s, 65),
    };
  }
  if (wire.color) {
    return {
      off: hslToHex(wire.color.h, wire.color.s, 30),
      on:  hslToHex(wire.color.h, wire.color.s, 65),
    };
  }
  // Wire ke-1: hijau default (gak boleh diubah).
  return { off: '#2d6a4f', on: '#4ade80' };
}

// ── Orthogonal wire routing (L-shape dengan rounded corners) ──
// Lebih clean untuk digital schematics dibanding bezier curve, gampang dibaca
// pas wire numpuk. Pattern: H1 (p1.x → midX) → V (p1.y → p2.y) → H2 (midX → p2.x).
// Corner radius dibatasi supaya gak overlap segment pendek.
function drawOrthogonalPath(ctx, p1, p2, r = 8) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  // Kalo aligned (horizontal/vertical murni), garis lurus aja.
  if (Math.abs(dx) < 1 || Math.abs(dy) < 1) {
    ctx.lineTo(p2.x, p2.y);
    return;
  }
  const midX = (p1.x + p2.x) / 2;
  const sx = Math.sign(dx), sy = Math.sign(dy);
  // Clamp radius ke setengah segmen pendek biar corner gak balik arah.
  const rad = Math.max(0, Math.min(r, Math.abs(dx) / 2, Math.abs(dy) / 2));
  if (rad < 2) {
    // Segmen terlalu pendek untuk rounded corner → sharp L.
    ctx.lineTo(midX, p1.y);
    ctx.lineTo(midX, p2.y);
    ctx.lineTo(p2.x, p2.y);
    return;
  }
  ctx.lineTo(midX - rad * sx, p1.y);
  ctx.quadraticCurveTo(midX, p1.y, midX, p1.y + rad * sy);
  ctx.lineTo(midX, p2.y - rad * sy);
  ctx.quadraticCurveTo(midX, p2.y, midX + rad * sx, p2.y);
  ctx.lineTo(p2.x, p2.y);
}

// Varian drawOrthogonalPath dengan midX custom (untuk smart routing yang menghindar).
function drawOrthogonalPathAt(ctx, p1, p2, midX, r = 8) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (Math.abs(dx) < 1 || Math.abs(dy) < 1) {
    ctx.lineTo(p2.x, p2.y);
    return;
  }
  const sx = Math.sign(dx), sy = Math.sign(dy);
  const seg1 = Math.abs(midX - p1.x);
  const seg3 = Math.abs(p2.x - midX);
  const rad = Math.max(0, Math.min(r, seg1 / 2, seg3 / 2, Math.abs(dy) / 2));
  if (rad < 2) {
    ctx.lineTo(midX, p1.y);
    ctx.lineTo(midX, p2.y);
    ctx.lineTo(p2.x, p2.y);
    return;
  }
  ctx.lineTo(midX - rad * sx, p1.y);
  ctx.quadraticCurveTo(midX, p1.y, midX, p1.y + rad * sy);
  ctx.lineTo(midX, p2.y - rad * sy);
  ctx.quadraticCurveTo(midX, p2.y, midX + rad * sx, p2.y);
  ctx.lineTo(p2.x, p2.y);
}

// V-H-V pattern (vertical first): V1 (p1.y → midY) → H (p1.x → p2.x) → V2 (midY → p2.y).
function drawOrthogonalPathVHV(ctx, p1, p2, midY, r = 8) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (Math.abs(dx) < 1 || Math.abs(dy) < 1) {
    ctx.lineTo(p2.x, p2.y);
    return;
  }
  const sx = Math.sign(dx), sy = Math.sign(dy);
  const seg1 = Math.abs(midY - p1.y);
  const seg3 = Math.abs(p2.y - midY);
  const rad = Math.max(0, Math.min(r, seg1 / 2, seg3 / 2, Math.abs(dx) / 2));
  if (rad < 2) {
    ctx.lineTo(p1.x, midY);
    ctx.lineTo(p2.x, midY);
    ctx.lineTo(p2.x, p2.y);
    return;
  }
  ctx.lineTo(p1.x, midY - rad * sy);
  ctx.quadraticCurveTo(p1.x, midY, p1.x + rad * sx, midY);
  ctx.lineTo(p2.x - rad * sx, midY);
  ctx.quadraticCurveTo(p2.x, midY, p2.x, midY + rad * sy);
  ctx.lineTo(p2.x, p2.y);
}

// Bounding box komponen (fallback width/height kalau def gak punya field).
function getCompBox(c) {
  // Gunakan c.width/c.height langsung dari component object — akurat dan konsisten
  // (createComponent menyimpan dimensi sebenarnya: gate 90x56, NOT 80x56, IO 60x60).
  return { x: c.x, y: c.y, w: c.width || 90, h: c.height || 56 };
}

// MUTUAL GAP: komponen & kabel saling memberikan gap (seperti magnet kutub sama).
// Komponen "mendorong" kabel 18px, kabel juga "mendorong" komponen 18px → total 36px.
// Ini memastikan kabel TIDAK PERNAH menabrak/menindih body komponen, dan sebaliknya.
// 36px = cukup buat visual clearance (wire 3px + 33px whitespace mutual gap).
const GAP_MARGIN = 36;
function getCompBlockedBox(c) {
  const b = getCompBox(c);
  return {
    x: b.x - GAP_MARGIN,
    y: b.y - GAP_MARGIN,
    w: b.w + 2 * GAP_MARGIN,
    h: b.h + 2 * GAP_MARGIN,
  };
}

// Hitung jumlah intersection antara segmen-segmen orthogonal path (H-V-H @ midX) dengan
// blocked box komponen (full body + GAP_MARGIN). Return count intersection (0 = bebas hambatan).
//
// Exempt strategy (PER-SEGMENT + per-sisi port, SANGAT KETAT):
// - H1 (y=p1.y, x=p1.x..midX) — exit src output port:
//   Output port biasanya di kanan body (p1.x = src.x + src.width).
//   H1 exit port ke KANAN (menjauhi body src) berarti midX > p1.x.
//   Kalau midX < p1.x (ke kiri, ke arah body src), H1 menembus body src → collision check trigger.
//   Exempt src hanya jika midX di sisi luar body src dari port.
// - V  (x=midX, y=p1.y..p2.y) — segmen tengah:
//   Exempt src/dst hanya jika midX di luar x-range mereka.
// - H2 (y=p2.y, x=midX..p2.x) — enter dst input port:
//   Input port biasanya di kiri body (p2.x = dst.x).
//   H2 enter port dari KIRI (dari luar body dst) berarti midX < p2.x.
//   Kalau midX > p2.x (ke kanan, ke arah body dst), H2 menembus body dst → collision check trigger.
//   Exempt dst hanya jika midX di sisi luar body dst dari port.
//
// Bug lama (full exempt src+dst): wire bisa exit port ke arah body sendiri tanpa terdeteksi.
// Fix ini memaksa wire exit port ke arah yang benar (menjauhi body), tidak menembus body sendiri.
function countHVHCollisions(p1, p2, midX, comps, srcId, dstId) {
  const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
  let count = 0;
  for (const c of comps) {
    const b = getCompBlockedBox(c);
    const isSrc = c.id === srcId;
    const isDst = c.id === dstId;
    const cBox = (isSrc || isDst) ? getCompBox(c) : null;
    // Untuk V: exempt src/dst hanya jika midX di luar x-range mereka.
    const midXInCBox = cBox && midX >= cBox.x && midX <= cBox.x + cBox.w;
    const exemptSrcForV = isSrc && !midXInCBox;
    const exemptDstForV = isDst && !midXInCBox;
    // Untuk H1: exempt src hanya jika midX di sisi luar body src dari port output.
    // Port output di kanan body (x1 = src.x + src.width) → exit ke kanan → midX > x1.
    // Port output di kiri body (x1 = src.x) → exit ke kiri → midX < x1.
    const exemptSrcForH1 = isSrc && cBox && (
      Math.abs(x1 - (cBox.x + cBox.w)) < 0.5 ? midX >= x1 :  // port kanan body
      Math.abs(x1 - cBox.x) < 0.5 ? midX <= x1 :              // port kiri body
      true                                                     // port tengah/unknown: exempt (jarang terjadi)
    );
    // Untuk H2: exempt dst hanya jika midX di sisi luar body dst dari port input.
    // Port input di kiri body (x2 = dst.x) → enter dari kiri → midX < x2.
    // Port input di kanan body (x2 = dst.x + dst.width) → enter dari kanan → midX > x2.
    const exemptDstForH2 = isDst && cBox && (
      Math.abs(x2 - cBox.x) < 0.5 ? midX <= x2 :              // port kiri body
      Math.abs(x2 - (cBox.x + cBox.w)) < 0.5 ? midX >= x2 :  // port kanan body
      true                                                     // port tengah/unknown: exempt (jarang terjadi)
    );
    // Segmen 1: H1 — exempt src hanya jika exit port ke arah yang benar.
    if (!exemptSrcForH1) {
      if (y1 >= b.y && y1 <= b.y + b.h) {
        const segMin = Math.min(x1, midX), segMax = Math.max(x1, midX);
        if (segMax > b.x && segMin < b.x + b.w) count++;
      }
    }
    // Segmen 2: V — exempt src/dst hanya jika midX di luar x-range mereka.
    if (!exemptSrcForV && !exemptDstForV) {
      if (midX >= b.x && midX <= b.x + b.w) {
        const segMin = Math.min(y1, y2), segMax = Math.max(y1, y2);
        if (segMax > b.y && segMin < b.y + b.h) count++;
      }
    }
    // Segmen 3: H2 — exempt dst hanya jika enter port dari arah yang benar.
    if (!exemptDstForH2) {
      if (y2 >= b.y && y2 <= b.y + b.h) {
        const segMin = Math.min(midX, x2), segMax = Math.max(midX, x2);
        if (segMax > b.x && segMin < b.x + b.w) count++;
      }
    }
  }
  return count;
}

// Sama, tapi untuk V-H-V pattern (vertical first) dengan midY custom.
// Exempt strategy (PER-SEGMENT + per-sisi port, SANGAT KETAT):
// - V1 (x=p1.x, y=p1.y..midY) — exit src output port:
//   Output port di atas/bawah body. Exit port ke arah luar body → midY di sisi luar.
//   Kalau midY di sisi dalam (ke arah body src), V1 menembus body src → collision check trigger.
// - H  (y=midY, x=p1.x..p2.x) — segmen tengah:
//   Exempt src/dst hanya jika midY di luar y-range mereka.
// - V2 (x=p2.x, y=midY..p2.y) — enter dst input port:
//   Input port di atas/bawah body. Enter port dari arah luar body → midY di sisi luar.
//   Kalau midY di sisi dalam (ke arah body dst), V2 menembus body dst → collision check trigger.
function countVHVCollisions(p1, p2, midY, comps, srcId, dstId) {
  const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
  let count = 0;
  for (const c of comps) {
    const b = getCompBlockedBox(c);
    const isSrc = c.id === srcId;
    const isDst = c.id === dstId;
    const cBox = (isSrc || isDst) ? getCompBox(c) : null;
    // Untuk H: exempt src/dst hanya jika midY di luar y-range mereka.
    const midYInCBox = cBox && midY >= cBox.y && midY <= cBox.y + cBox.h;
    const exemptSrcForH = isSrc && !midYInCBox;
    const exemptDstForH = isDst && !midYInCBox;
    // Untuk V1: exempt src hanya jika midY di sisi luar body src dari port output.
    // Port output di bawah body (y1 = src.y + src.height) → exit ke bawah → midY > y1.
    // Port output di atas body (y1 = src.y) → exit ke atas → midY < y1.
    const exemptSrcForV1 = isSrc && cBox && (
      Math.abs(y1 - (cBox.y + cBox.h)) < 0.5 ? midY >= y1 :  // port bawah body
      Math.abs(y1 - cBox.y) < 0.5 ? midY <= y1 :              // port atas body
      true                                                     // port tengah/unknown: exempt (jarang terjadi)
    );
    // Untuk V2: exempt dst hanya jika midY di sisi luar body dst dari port input.
    // Port input di atas body (y2 = dst.y) → enter dari atas → midY < y2.
    // Port input di bawah body (y2 = dst.y + dst.height) → enter dari bawah → midY > y2.
    const exemptDstForV2 = isDst && cBox && (
      Math.abs(y2 - cBox.y) < 0.5 ? midY <= y2 :              // port atas body
      Math.abs(y2 - (cBox.y + cBox.h)) < 0.5 ? midY >= y2 :  // port bawah body
      true                                                     // port tengah/unknown: exempt (jarang terjadi)
    );
    // Segmen 1: V1 — exempt src hanya jika exit port ke arah yang benar.
    if (!exemptSrcForV1) {
      if (x1 >= b.x && x1 <= b.x + b.w) {
        const segMin = Math.min(y1, midY), segMax = Math.max(y1, midY);
        if (segMax > b.y && segMin < b.y + b.h) count++;
      }
    }
    // Segmen 2: H — exempt src/dst hanya jika midY di luar y-range mereka.
    if (!exemptSrcForH && !exemptDstForH) {
      if (midY >= b.y && midY <= b.y + b.h) {
        const segMin = Math.min(x1, x2), segMax = Math.max(x1, x2);
        if (segMax > b.x && segMin < b.x + b.w) count++;
      }
    }
    // Segmen 3: V2 — exempt dst hanya jika enter port dari arah yang benar.
    if (!exemptDstForV2) {
      if (x2 >= b.x && x2 <= b.x + b.w) {
        const segMin = Math.min(midY, y2), segMax = Math.max(midY, y2);
        if (segMax > b.y && segMin < b.y + b.h) count++;
      }
    }
  }
  return count;
}

// Smart orthogonal routing — pilih rute H-V-H atau V-H-V dengan collision paling sedikit.
//
// INSIGHT: Untuk wire output→input (kanan src → kiri dst), Z-shape (H-V-H dengan midX
// di tengah gap antara src & dst) adalah routing TERBAIK secara visual.
//
// STRICT mode (user request): kabel gak boleh menempel/nabrak kotak komponen apapun.
// Blocked box = full body + GAP_MARGIN (12px) di tiap sisi. Algo bakal cari rute yang
// sepenuhnya bebas hambatan (0 collision), dengan prioritas:
//   1. Rute "hug box edge" — midX/midY pas di luar GAP_MARGIN komponen penghalang
//   2. Rute offset kiri/kanan dari midX ideal (Z-shape di tengah gap)
//   3. Rute alternatif jauh (offset ±500px) kalau semua rute dekat masih nabrak
//
// Re-route otomatis: routing dihitung ulang setiap render frame dari posisi comp terkini.
// Jadi saat komponen digeser ke arah wire, wire langsung re-route di frame berikutnya.
function pickOrthogonalRoute(p1, p2, comps, srcId, dstId) {
  const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;

  // midX ideal = tengah gap antara src & dst (bukan tengah rata-rata endpoint).
  // Kalau src & dst overlap horizontal (x1 > x2 atau sebaliknya), pakai rata-rata.
  const srcRight = Math.max(x1, x2);
  const dstLeft = Math.min(x1, x2);
  const hvhMidXIdeal = srcRight + (dstLeft - srcRight) / 2;  // tengah gap
  // Kalau gap negatif (overlap), fallback ke rata-rata
  const hvhMidXDefault = (dstLeft === srcRight) ? (x1 + x2) / 2 : hvhMidXIdeal;

  // Kumpulin kandidat midX: (a) hug box edge tiap comp (TERMASUK src/dst), (b) extreme boundary,
  // (c) offset dari midX ideal.
  const hvhMidXs = new Set();
  // (a) Hug box edge: midX pas di luar GAP_MARGIN tiap komponen (kiri & kanan).
  //     Termasuk src & dst — penting supaya V segment bisa route di luar body dst.
  let allMinX = Infinity, allMaxX = -Infinity, allMinY = Infinity, allMaxY = -Infinity;
  for (const c of comps) {
    const box = getCompBox(c);
    hvhMidXs.add(box.x - GAP_MARGIN - 2);             // just left of comp
    hvhMidXs.add(box.x + box.w + GAP_MARGIN + 2);     // just right of comp
    // Track global bounding box for extreme candidates
    allMinX = Math.min(allMinX, box.x - GAP_MARGIN);
    allMaxX = Math.max(allMaxX, box.x + box.w + GAP_MARGIN);
    allMinY = Math.min(allMinY, box.y - GAP_MARGIN);
    allMaxY = Math.max(allMaxY, box.y + box.h + GAP_MARGIN);
  }
  // (b) Extreme boundary candidates — far outside all components, guaranteed collision-free.
  if (allMinX < Infinity) {
    hvhMidXs.add(allMinX - 50);   // far left of everything
    hvhMidXs.add(allMaxX + 50);   // far right of everything
  }
  // (c) Offset dari midX ideal (Z-shape di tengah gap, lalu eksplorasi kiri/kanan).
  const hvhOffsets = [0, 25, -25, 50, -50, 75, -75, 100, -100, 150, -150, 200, -200, 250, -250, 300, -300, 400, -400, 500, -500];
  for (const off of hvhOffsets) hvhMidXs.add(hvhMidXDefault + off);

  const candidates = [];
  for (const midX of hvhMidXs) {
    const col = countHVHCollisions(p1, p2, midX, comps, srcId, dstId);
    candidates.push({ type: 'HVH', mid: midX, col, off: midX - hvhMidXDefault });
  }
  // Kandidat VHV: midY ideal = tengah gap vertikal antara src & dst.
  const srcBottom = Math.max(y1, y2);
  const dstTop = Math.min(y1, y2);
  const vhvMidYIdeal = srcBottom + (dstTop - srcBottom) / 2;
  const vhvMidYDefault = (dstTop === srcBottom) ? (y1 + y2) / 2 : vhvMidYIdeal;
  const vhvMidYs = new Set();
  // (a) Hug box edge: midY pas di luar GAP_MARGIN tiap komponen (atas & bawah).
  //     Termasuk src & dst — penting supaya H segment bisa route di luar body.
  for (const c of comps) {
    const box = getCompBox(c);
    vhvMidYs.add(box.y - GAP_MARGIN - 2);             // just above comp
    vhvMidYs.add(box.y + box.h + GAP_MARGIN + 2);     // just below comp
  }
  // (b) Extreme boundary candidates — far above/below all components.
  if (allMinY < Infinity) {
    vhvMidYs.add(allMinY - 50);   // far above everything
    vhvMidYs.add(allMaxY + 50);   // far below everything
  }
  // (c) Offset dari midY ideal.
  const vhvOffsets = [0, 25, -25, 50, -50, 75, -75, 100, -100, 150, -150, 200, -200, 300, -300, 400, -400, 500, -500];
  for (const off of vhvOffsets) vhvMidYs.add(vhvMidYDefault + off);

  for (const midY of vhvMidYs) {
    const col = countVHVCollisions(p1, p2, midY, comps, srcId, dstId);
    candidates.push({ type: 'VHV', mid: midY, col, off: midY - vhvMidYDefault });
  }
  // Sort by collision count asc, lalu by |offset| asc (midX ideal = offset 0 menang).
  candidates.sort((a, b) => {
    if (a.col !== b.col) return a.col - b.col;
    return Math.abs(a.off) - Math.abs(b.off);
  });
  return candidates[0];
}

// Draw path berdasarkan route hasil pickOrthogonalRoute.
function drawSmartOrthogonalPath(ctx, p1, p2, route, r = 8) {
  if (route.type === 'VHV') {
    drawOrthogonalPathVHV(ctx, p1, p2, route.mid, r);
  } else {
    drawOrthogonalPathAt(ctx, p1, p2, route.mid, r);
  }
}

// Titik di sepanjang path orthogonal pada parameter t (0..1).
// Hitung anchor positions dari bounding box komponen terpilih (SCREEN SPACE).
// Anchor ditempatkan di tepi bounding box + offset 30px ke luar.
// Ini memastikan anchor sejajar dengan marching ants border.
function calcAnchorsFromComponents(selComps, view) {
  if (!selComps || selComps.length === 0) return null;
  let minSx = Infinity, minSy = Infinity, maxSx = -Infinity, maxSy = -Infinity;
  for (const c of selComps) {
    const sx = c.x * view.scale + view.x;
    const sy = c.y * view.scale + view.y;
    const sw = c.width * view.scale;
    const sh = c.height * view.scale;
    minSx = Math.min(minSx, sx);
    minSy = Math.min(minSy, sy);
    maxSx = Math.max(maxSx, sx + sw);
    maxSy = Math.max(maxSy, sy + sh);
  }
  const cx = (minSx + maxSx) / 2;
  const cy = (minSy + maxSy) / 2;
  const hw = (maxSx - minSx) / 2;
  const hh = (maxSy - minSy) / 2;
  return {
    box: { sx: minSx, sy: minSy, ex: maxSx, ey: maxSy },
    anchors: {
      top:    { x: cx, y: cy - hh - 30 },
      bottom: { x: cx, y: cy + hh + 30 },
      left:   { x: cx - hw - 30, y: cy },
      right:  { x: cx + hw + 30, y: cy },
    },
  };
}

// ── Minimum Enclosing Circle helper (top-level, dipakai juga oleh calcRotateAnchorsFromMEC) ──
const _mecDist2 = (A, B) => (A.x - B.x) ** 2 + (A.y - B.y) ** 2;
const _mecIsInside = (p, c) => (p.x - c.x) ** 2 + (p.y - c.y) ** 2 <= (c.r + 1e-6) ** 2;
const _mecTrivialCircle = (R) => {
  if (R.length === 0) return null;
  if (R.length === 1) return { x: R[0].x, y: R[0].y, r: 0 };
  if (R.length === 2) {
    return { x: (R[0].x + R[1].x) / 2, y: (R[0].y + R[1].y) / 2, r: Math.sqrt(_mecDist2(R[0], R[1])) / 2 };
  }
  const A = R[0], B = R[1], C = R[2];
  const D = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  if (Math.abs(D) < 1e-10) {
    const d1 = _mecDist2(A, B), d2 = _mecDist2(B, C), d3 = _mecDist2(A, C);
    if (d1 >= d2 && d1 >= d3) return _mecTrivialCircle([A, B]);
    if (d2 >= d1 && d2 >= d3) return _mecTrivialCircle([B, C]);
    return _mecTrivialCircle([A, C]);
  }
  const ux = ((A.x * A.x + A.y * A.y) * (B.y - C.y) + (B.x * B.x + B.y * B.y) * (C.y - A.y) + (C.x * C.x + C.y * C.y) * (A.y - B.y)) / D;
  const uy = ((A.x * A.x + A.y * A.y) * (C.x - B.x) + (B.x * B.x + B.y * B.y) * (A.x - C.x) + (C.x * C.x + C.y * C.y) * (B.x - A.x)) / D;
  return { x: ux, y: uy, r: Math.sqrt((A.x - ux) ** 2 + (A.y - uy) ** 2) };
};
const _welzl = (P, R) => {
  if (P.length === 0 || R.length === 3) return _mecTrivialCircle(R);
  const p = P[0];
  const D = _welzl(P.slice(1), R);
  if (D && _mecIsInside(p, D)) return D;
  return _welzl(P.slice(1), [...R, p]);
};
function minimumEnclosingCircle(points) {
  if (points.length === 0) return null;
  const shuffled = [...points];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return _welzl(shuffled, []);
}

// ── Rotate anchors dari MEC circle ──
// Anchor diposisikan di UJUNG DALAM lingkaran MEC (tepi lingkaran, sedikit ke dalam).
// Top: ujung atas lingkaran, Bottom: ujung bawah, Left: ujung kiri, Right: ujung kanan.
// Offset ke dalam = 18px supaya anchor masih di dalam garis putus-putus tapi di tepi.
// ── World-space MEC pivot ──
// Hitung MEC center langsung di world space (tanpa screen↔world roundtrip).
// Dipakai sebagai rotation pivot — menghilangkan floating-point drift
// yang menyebabkan MEC mengecil saat spam rotate.
function calcWorldMECPivot(selComps) {
  if (!selComps || selComps.length === 0) return null;
  const cornerPts = [];
  for (const c of selComps) {
    // Facing 1 or 3 = 90°/270° → effective visual width/height swapped
    const facing = c.facing || 0;
    const ew = (facing === 1 || facing === 3) ? c.height : c.width;
    const eh = (facing === 1 || facing === 3) ? c.width : c.height;
    const cx = c.x + c.width / 2;
    const cy = c.y + c.height / 2;
    cornerPts.push({ x: cx - ew / 2, y: cy - eh / 2 });
    cornerPts.push({ x: cx + ew / 2, y: cy - eh / 2 });
    cornerPts.push({ x: cx - ew / 2, y: cy + eh / 2 });
    cornerPts.push({ x: cx + ew / 2, y: cy + eh / 2 });
  }
  const mec = minimumEnclosingCircle(cornerPts);
  if (!mec || mec.r <= 0) return null;
  return { x: mec.x, y: mec.y, r: mec.r };
}

function calcRotateAnchorsFromMEC(selComps, view) {
  if (!selComps || selComps.length === 0) return null;
  // Kumpulkan semua 4 sudut setiap komponen (screen space)
  // Facing 1 or 3 = 90°/270° → effective visual width/height swapped
  const cornerPts = [];
  let minSx = Infinity, minSy = Infinity, maxSx = -Infinity, maxSy = -Infinity;
  for (const c of selComps) {
    const facing = c.facing || 0;
    const ew = (facing === 1 || facing === 3) ? c.height : c.width;
    const eh = (facing === 1 || facing === 3) ? c.width : c.height;
    const cx = c.x + c.width / 2;
    const cy = c.y + c.height / 2;
    const sx1 = (cx - ew / 2) * view.scale + view.x;
    const sy1 = (cy - eh / 2) * view.scale + view.y;
    const sx2 = (cx + ew / 2) * view.scale + view.x;
    const sy2 = (cy + eh / 2) * view.scale + view.y;
    cornerPts.push({ x: sx1, y: sy1 });
    cornerPts.push({ x: sx2, y: sy1 });
    cornerPts.push({ x: sx1, y: sy2 });
    cornerPts.push({ x: sx2, y: sy2 });
    minSx = Math.min(minSx, sx1);
    minSy = Math.min(minSy, sy1);
    maxSx = Math.max(maxSx, sx2);
    maxSy = Math.max(maxSy, sy2);
  }
  const mec = minimumEnclosingCircle(cornerPts);
  if (!mec || mec.r <= 0) return null;
  const cx = mec.x;
  const cy = mec.y;
  const drawR = mec.r + 4; // +4 padding sama seperti marching ants
  // Anchor di luar lingkaran MEC: offset 30px ke luar (konsisten dengan move/clone)
  const outwardOffset = 30;
  return {
    box: { sx: minSx, sy: minSy, ex: maxSx, ey: maxSy },
    anchors: {
      top:    { x: cx, y: cy - drawR - outwardOffset },
      bottom: { x: cx, y: cy + drawR + outwardOffset },
      left:   { x: cx - drawR - outwardOffset, y: cy },
      right:  { x: cx + drawR + outwardOffset, y: cy },
    },
    mec: { x: cx, y: cy, r: drawR }, // simpan MEC info buat marching ants
  };
}

// Dipakai buat animasi pulse dot (titik putih yang jalan di wire ON).
// Path = H1 (|dx|/2) → V (|dy|) → H2 (|dx|/2), total = |dx| + |dy|.
function pointOnOrthogonal(p1, p2, t) {
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  if (Math.abs(dx) < 1) return { x: p1.x, y: p1.y + dy * t };
  if (Math.abs(dy) < 1) return { x: p1.x + dx * t, y: p1.y };
  const midX = (p1.x + p2.x) / 2;
  const sx = Math.sign(dx), sy = Math.sign(dy);
  const L1 = Math.abs(dx) / 2, L2 = Math.abs(dy), L3 = Math.abs(dx) / 2;
  const total = L1 + L2 + L3;
  let target = t * total;
  if (target < L1) return { x: p1.x + sx * target, y: p1.y };
  target -= L1;
  if (target < L2) return { x: midX, y: p1.y + sy * target };
  target -= L2;
  return { x: midX + sx * target, y: p2.y };
}

// Versi parametrize untuk smart route (HVH dengan midX custom atau VHV dengan midY custom).
// Dipakai buat pulse dot animation biar posisinya sesuai rute yang dipilih.
function pointOnSmartOrthogonal(p1, p2, route, t) {
  const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
  const sx = Math.sign(x2 - x1), sy = Math.sign(y2 - y1);
  if (route.type === 'HVH') {
    const midX = route.mid;
    const L1 = Math.abs(midX - x1);
    const L2 = Math.abs(y2 - y1);
    const L3 = Math.abs(x2 - midX);
    const total = L1 + L2 + L3;
    if (total < 1) return { x: x1, y: y1 };
    let target = t * total;
    if (target < L1) return { x: x1 + sx * target, y: y1 };
    target -= L1;
    if (target < L2) return { x: midX, y: y1 + sy * target };
    target -= L2;
    return { x: midX + sx * target, y: y2 };
  } else {
    const midY = route.mid;
    const L1 = Math.abs(midY - y1);
    const L2 = Math.abs(x2 - x1);
    const L3 = Math.abs(y2 - midY);
    const total = L1 + L2 + L3;
    if (total < 1) return { x: x1, y: y1 };
    let target = t * total;
    if (target < L1) return { x: x1, y: y1 + sy * target };
    target -= L1;
    if (target < L2) return { x: x1 + sx * target, y: midY };
    target -= L2;
    return { x: x2, y: midY + sy * target };
  }
}

// ── Logic Engine ──
function computeGate(type, inputs) {
  const [a, b] = inputs;
  switch (type) {
    case 'not':   return !a;
    case 'and':   return a && b;
    case 'nand':  return !(a && b);
    case 'or':    return a || b;
    case 'nor':   return !(a || b);
    case 'xor':   return a !== b;
    case 'xnor':  return a === b;
    default:      return false;
  }
}

// ── SVG Gate Renderer (paths from GateDiagram.jsx) ──
function GateSVG({ type, color, width = 90, height = 56 }) {
  const dual = GATE_MAP[type]?.dualInput ?? true;
  const C = 10;
  const N = dual ? 6 : 3;
  const q = dual ? 50 : 53;
  const L = dual ? 28 : 28;
  const I = q - N;
  const P = 5;
  const r = color;
  const dim = '#475569';
  const bodyStroke = color;

  const paths = {
    wire: null,
    not: (
      <>
        <polygon points={`${C},${N} ${C+54},${L} ${C},${q}`} fill="none" stroke={bodyStroke} strokeWidth="2.5" strokeLinejoin="round"/>
        <circle cx={C+54+P} cy={L} r={P} fill="none" stroke={bodyStroke} strokeWidth="2"/>
      </>
    ),
    and: (
      <>
        <path d={`M ${C},${N} L ${C+26},${N} A ${I/2} ${I/2} 0 0 1 ${C+26},${q} L ${C},${q} Z`} fill="none" stroke={bodyStroke} strokeWidth="2.5"/>
      </>
    ),
    nand: (
      <>
        <path d={`M ${C},${N} L ${C+22},${N} A ${I/2} ${I/2} 0 0 1 ${C+22},${q} L ${C},${q} Z`} fill="none" stroke={bodyStroke} strokeWidth="2.5"/>
        <circle cx={C+22+I/2+P} cy={L} r={P} fill="none" stroke={bodyStroke} strokeWidth="2"/>
      </>
    ),
    or: (
      <>
        <path d={`M ${C},${N} C ${C+22},${N} ${C+70-18},${L-16} ${C+70},${L} C ${C+70-18},${L+16} ${C+22},${q} ${C},${q} C ${C+15},${L+9} ${C+15},${L-9} ${C},${N} Z`} fill="none" stroke={bodyStroke} strokeWidth="2.5"/>
      </>
    ),
    nor: (
      <>
        <path d={`M ${C},${N} C ${C+22},${N} ${C+65-18},${L-16} ${C+65},${L} C ${C+65-18},${L+16} ${C+22},${q} ${C},${q} C ${C+15},${L+9} ${C+15},${L-9} ${C},${N} Z`} fill="none" stroke={bodyStroke} strokeWidth="2.5"/>
        <circle cx={C+65+P} cy={L} r={P} fill="none" stroke={bodyStroke} strokeWidth="2"/>
      </>
    ),
    xor: (
      <>
        <path d={`M ${C},${N} C ${C+22},${N} ${C+70-18},${L-16} ${C+70},${L} C ${C+70-18},${L+16} ${C+22},${q} ${C},${q} C ${C+15},${L+9} ${C+15},${L-9} ${C},${N} Z`} fill="none" stroke={bodyStroke} strokeWidth="2.5"/>
        <path d={`M ${C-9},${N} C ${C-9+13},${L-9} ${C-9+13},${L+9} ${C-9},${q}`} fill="none" stroke={bodyStroke} strokeWidth="2"/>
      </>
    ),
    xnor: (
      <>
        <path d={`M ${C},${N} C ${C+22},${N} ${C+65-18},${L-16} ${C+65},${L} C ${C+65-18},${L+16} ${C+22},${q} ${C},${q} C ${C+15},${L+9} ${C+15},${L-9} ${C},${N} Z`} fill="none" stroke={bodyStroke} strokeWidth="2.5"/>
        <circle cx={C+65+P} cy={L} r={P} fill="none" stroke={bodyStroke} strokeWidth="2"/>
        <path d={`M ${C-9},${N} C ${C-9+13},${L-9} ${C-9+13},${L+9} ${C-9},${q}`} fill="none" stroke={bodyStroke} strokeWidth="2"/>
      </>
    ),
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {paths[type]}
    </svg>
  );
}

// ── MiniGateIcon (palette icon, model centered dari CircuitCard00.jsx commit d9e010d) ──
// Semua gate body di-center di canvas maxW supaya input & output wire seimbang.
// scale prop untuk adjust ukuran tampilan (viewBox tetap, width/height discale).
function MiniGateIcon({ type, color, scale = 1 }) {
  const s = color, sw = 3;
  const h = 36, cy = 18, sz = 13;
  const triW = 14;
  const bw = 5;
  const bubbleR = 3.5;
  const bubbleGap = 3;
  const wireLen = 10;
  const tipX = sz * 1.7;
  const xorExtra = 15;
  const andWireOff = 6;
  const orWireOff = sz / 2;
  const svgStyle = { 
    display: 'block', 
    flexShrink: 0,
    // NO glow — user request: warna cerah solid tanpa halo/drop-shadow.
    // Warna tetap vibrant dari def.color (#f87171 red, #4ade80 green, etc),
    // cuma gak ada efek cahaya di sekitar icon.
  };

  const maxW = wireLen + xorExtra + tipX + bubbleGap + bubbleR + wireLen;

  switch (type) {
    case 'not': {
      const naturalW = wireLen + triW + bubbleGap + bubbleR + wireLen;
      const leftPad = (maxW - naturalW) / 2;
      const cx = wireLen;
      const triTip = cx + triW;
      const bubbleCx = triTip + bubbleGap;
      return <svg viewBox={`0 0 ${maxW} ${h}`} width={maxW * scale} height={h * scale} style={svgStyle}>
        <g transform={`translate(${leftPad},0)`}>
          <line x1={0} y1={cy} x2={cx} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <polygon points={`${cx},${cy - sz} ${cx},${cy + sz} ${triTip},${cy}`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
          <circle cx={bubbleCx} cy={cy} r={bubbleR} fill="none" stroke={s} strokeWidth={sw} />
          <line x1={bubbleCx + bubbleR} y1={cy} x2={naturalW} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
        </g>
      </svg>;
    }
    case 'and': {
      const naturalW = (wireLen + bw + sz) + wireLen;
      const leftPad = (maxW - naturalW) / 2;
      const cx = wireLen;
      const bodyRight = cx + bw + sz;
      return <svg viewBox={`0 0 ${maxW} ${h}`} width={maxW * scale} height={h * scale} style={svgStyle}>
        <g transform={`translate(${leftPad},0)`}>
          <line x1={0} y1={cy - andWireOff} x2={cx} y2={cy - andWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <line x1={0} y1={cy + andWireOff} x2={cx} y2={cy + andWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M ${cx},${cy - sz} L ${cx + bw},${cy - sz} A ${sz},${sz} 0 0,1 ${cx + bw},${cy + sz} L ${cx},${cy + sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
          <line x1={bodyRight} y1={cy} x2={naturalW} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
        </g>
      </svg>;
    }
    case 'nand': {
      const naturalW = (wireLen + bw + sz + bubbleGap) + bubbleR + wireLen;
      const leftPad = (maxW - naturalW) / 2;
      const cx = wireLen;
      const arcRight = cx + bw + sz;
      const bubbleCx = arcRight + bubbleGap;
      return <svg viewBox={`0 0 ${maxW} ${h}`} width={maxW * scale} height={h * scale} style={svgStyle}>
        <g transform={`translate(${leftPad},0)`}>
          <line x1={0} y1={cy - andWireOff} x2={cx} y2={cy - andWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <line x1={0} y1={cy + andWireOff} x2={cx} y2={cy + andWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M ${cx},${cy - sz} L ${cx + bw},${cy - sz} A ${sz},${sz} 0 0,1 ${cx + bw},${cy + sz} L ${cx},${cy + sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
          <circle cx={bubbleCx} cy={cy} r={bubbleR} fill="none" stroke={s} strokeWidth={sw} />
          <line x1={bubbleCx + bubbleR} y1={cy} x2={naturalW} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
        </g>
      </svg>;
    }
    case 'or': {
      const naturalW = (wireLen + tipX) + wireLen;
      const leftPad = (maxW - naturalW) / 2;
      const cx = wireLen;
      const tip = cx + tipX;
      return <svg viewBox={`0 0 ${maxW} ${h}`} width={maxW * scale} height={h * scale} style={svgStyle}>
        <g transform={`translate(${leftPad},0)`}>
          <line x1={0} y1={cy - orWireOff} x2={cx} y2={cy - orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <line x1={0} y1={cy + orWireOff} x2={cx} y2={cy + orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M ${cx},${cy - sz} Q ${cx + sz * 1.2},${cy - sz} ${tip},${cy} Q ${cx + sz * 1.2},${cy + sz} ${cx},${cy + sz} Q ${cx + sz * 0.4},${cy} ${cx},${cy - sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
          <line x1={tip} y1={cy} x2={naturalW} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
        </g>
      </svg>;
    }
    case 'nor': {
      const naturalW = (wireLen + tipX + bubbleGap) + bubbleR + wireLen;
      const leftPad = (maxW - naturalW) / 2;
      const cx = wireLen;
      const tip = cx + tipX;
      const bubbleCx = tip + bubbleGap;
      return <svg viewBox={`0 0 ${maxW} ${h}`} width={maxW * scale} height={h * scale} style={svgStyle}>
        <g transform={`translate(${leftPad},0)`}>
          <line x1={0} y1={cy - orWireOff} x2={cx} y2={cy - orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <line x1={0} y1={cy + orWireOff} x2={cx} y2={cy + orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M ${cx},${cy - sz} Q ${cx + sz * 1.2},${cy - sz} ${tip},${cy} Q ${cx + sz * 1.2},${cy + sz} ${cx},${cy + sz} Q ${cx + sz * 0.4},${cy} ${cx},${cy - sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
          <circle cx={bubbleCx} cy={cy} r={bubbleR} fill="none" stroke={s} strokeWidth={sw} />
          <line x1={bubbleCx + bubbleR} y1={cy} x2={naturalW} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
        </g>
      </svg>;
    }
    case 'xor': {
      const naturalW = (wireLen + xorExtra + tipX) + wireLen;
      const leftPad = (maxW - naturalW) / 2;
      const cx = wireLen + xorExtra;
      const tip = cx + tipX;
      const curveStart = cx - xorExtra;
      const ctrlX = cx + sz * 0.4;
      const tWire = (sz + 2) / (4 * (sz + 1));
      const xorWireEnd = curveStart + 2 * tWire * (1 - tWire) * (ctrlX - curveStart);
      return <svg viewBox={`0 0 ${maxW} ${h}`} width={maxW * scale} height={h * scale} style={svgStyle}>
        <g transform={`translate(${leftPad},0)`}>
          <line x1={0} y1={cy - orWireOff} x2={xorWireEnd} y2={cy - orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <line x1={0} y1={cy + orWireOff} x2={xorWireEnd} y2={cy + orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M ${curveStart},${cy - sz - 1} Q ${ctrlX},${cy} ${curveStart},${cy + sz + 1}`} fill="none" stroke={s} strokeWidth={sw} />
          <path d={`M ${cx},${cy - sz} Q ${cx + sz * 1.2},${cy - sz} ${tip},${cy} Q ${cx + sz * 1.2},${cy + sz} ${cx},${cy + sz} Q ${cx + sz * 0.4},${cy} ${cx},${cy - sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
          <line x1={tip} y1={cy} x2={naturalW} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
        </g>
      </svg>;
    }
    case 'xnor': {
      const naturalW = (wireLen + xorExtra + tipX + bubbleGap) + bubbleR + wireLen;
      const leftPad = (maxW - naturalW) / 2;
      const cx = wireLen + xorExtra;
      const tip = cx + tipX;
      const curveStart = cx - xorExtra;
      const ctrlX = cx + sz * 0.4;
      const tWire = (sz + 2) / (4 * (sz + 1));
      const xorWireEnd = curveStart + 2 * tWire * (1 - tWire) * (ctrlX - curveStart);
      const bubbleCx = tip + bubbleGap;
      return <svg viewBox={`0 0 ${maxW} ${h}`} width={maxW * scale} height={h * scale} style={svgStyle}>
        <g transform={`translate(${leftPad},0)`}>
          <line x1={0} y1={cy - orWireOff} x2={xorWireEnd} y2={cy - orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <line x1={0} y1={cy + orWireOff} x2={xorWireEnd} y2={cy + orWireOff} stroke={s} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M ${curveStart},${cy - sz - 1} Q ${ctrlX},${cy} ${curveStart},${cy + sz + 1}`} fill="none" stroke={s} strokeWidth={sw} />
          <path d={`M ${cx},${cy - sz} Q ${cx + sz * 1.2},${cy - sz} ${tip},${cy} Q ${cx + sz * 1.2},${cy + sz} ${cx},${cy + sz} Q ${cx + sz * 0.4},${cy} ${cx},${cy - sz} Z`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round" />
          <circle cx={bubbleCx} cy={cy} r={bubbleR} fill="none" stroke={s} strokeWidth={sw} />
          <line x1={bubbleCx + bubbleR} y1={cy} x2={naturalW} y2={cy} stroke={s} strokeWidth={sw} strokeLinecap="round" />
        </g>
      </svg>;
    }
    default:
      return null;
  }
}

// ── MiniSwitchIcon (palette icon untuk Switch/INPUT) ──
// Pure SVG vector, design match dengan toggle switch lever reference (gambar 2).
// Flat design: dome base + lever tilted up-right (ON position) + knob di ujung.
// User feedback: 'teman saya benci emoji ⚡, harus pure design yang lebih mantap'.
// Style match MiniGateIcon: stroke-based, fill selective, no glow, vibrant color.
function MiniSwitchIcon({ color = '#f59e0b', scale = 1 }) {
  const s = color;
  const sw = 2.4;
  const svgStyle = { display: 'block', flexShrink: 0 };
  // viewBox 36×36 — muat di iconBox 58×40 dengan margin 2-3px sekeliling
  return (
    <svg viewBox="0 0 36 36" width={36 * scale} height={36 * scale} style={svgStyle}>
      {/* Dome base (semicircle, open top) — bottom half-round body switch */}
      <path d="M 7,24 A 11,9 0 0,1 29,24" fill="none" stroke={s} strokeWidth={sw} strokeLinecap="round" />
      {/* Base flat line — menutup bawah dome */}
      <line x1="5" y1="24" x2="31" y2="24" stroke={s} strokeWidth={sw} strokeLinecap="round" />
      {/* Pivot point — lingkaran kecil di tengah atas dome (sumbu lever) */}
      <circle cx="18" cy="24" r="1.8" fill={s} />
      {/* Lever arm — miring ke kanan-atas (ON position) */}
      <line x1="18" y1="24" x2="27" y2="9" stroke={s} strokeWidth={sw + 1} strokeLinecap="round" />
      {/* Lever knob — bulatan di ujung lever (handle pegangan) */}
      <circle cx="27" cy="9" r="3.2" fill={s} stroke={s} strokeWidth={sw} />
    </svg>
  );
}

// ── MiniLEDIcon (palette icon untuk LED/OUTPUT) ──
// Pure SVG vector, design match dengan LED reference (gambar 3).
// Cylinder body + dome top + flange base + 2 pins (anode longer, cathode shorter).
// User feedback: 'harus mirip gambar 3 wajib — LED dgn kaki'.
// Style match MiniGateIcon: stroke-based, light tint fill body, no glow.
function MiniLEDIcon({ color = '#ef4444', scale = 1 }) {
  const s = color;
  const sw = 2.2;
  const svgStyle = { display: 'block', flexShrink: 0 };
  // viewBox 36×36 — muat di iconBox 58×40
  return (
    <svg viewBox="0 0 36 36" width={36 * scale} height={36 * scale} style={svgStyle}>
      {/* LED body — cylinder dengan dome top (epoxy housing 5mm standard) */}
      <path d="M 12,22 L 12,14 Q 12,6 18,6 Q 24,6 24,14 L 24,22 Z"
            fill={s + '30'} stroke={s} strokeWidth={sw} strokeLinejoin="round" />
      {/* Flange (base lip) — rectangle lebih lebar dari body, di bawah body */}
      <rect x="10" y="20" width="16" height="2.5" fill={s} stroke={s} strokeWidth={sw} strokeLinejoin="round" />
      {/* Left pin (anode — pin panjang, +) */}
      <line x1="14" y1="23" x2="14" y2="32" stroke="#94a3b8" strokeWidth={sw} strokeLinecap="round" />
      {/* Right pin (cathode — pin pendek, -) */}
      <line x1="22" y1="23" x2="22" y2="29" stroke="#94a3b8" strokeWidth={sw} strokeLinecap="round" />
      {/* Internal reflection highlight di dome (efek kaca) */}
      <path d="M 15,11 Q 16,9 18,9" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

// ── DragGhost — visual feedback saat drag component dari palette ke canvas ──
// User bilang "gak ada visual dimana user sedang mendrag suatu komponen, harusnya ada visualnya".
// Ghost ini render fixed-position di cursor, jadi user tahu lagi ngedrag apa.
function DragGhost({ type, x, y }) {
  const def = GATE_MAP[type] || IO_DEFS[type];
  if (!def) return null;
  const isIO = type === 'INPUT' || type === 'OUTPUT';
  const w = isIO ? 60 : (type === 'not' ? 80 : 90);
  const h = isIO ? IO_DEFS[type].height : 56;  // INPUT=60 (ada drag handle), OUTPUT=50
  return (
    <div style={{
      position: 'fixed',
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      pointerEvents: 'none',
      zIndex: 9999,
      opacity: 0.92,
      backgroundColor: '#1e293b',
      border: `2px solid ${def.color}`,
      borderRadius: 8,
      boxShadow: `0 4px 16px rgba(0,0,0,0.6), 0 0 14px ${def.color}80`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: '"Orbitron", sans-serif',
      overflow: 'hidden',
    }}>
      <div style={{
        width: '100%', height: 14,
        backgroundColor: def.color + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: def.color, fontSize: 8, fontWeight: 700, letterSpacing: 0.5,
        flexShrink: 0,
      }}>
        {def.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '2px 0' }}>
        {isIO ? (
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            backgroundColor: type === 'INPUT' ? '#f59e0b' : '#ef4444',
            boxShadow: `0 0 10px ${def.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 700,
          }}>
            {type === 'INPUT' ? '⚡' : '●'}
          </div>
        ) : (
          <MiniGateIcon type={type} color={def.color} scale={0.7} />
        )}
      </div>
    </div>
  );
}

/* ── Slot Color Picker Modal (with draft + Confirm/Cancel) ── */
function SlotColorPickerModal({ slotIndex, slot, onConfirm, onCancel, onPickFromWorkspace }) {
  const [draftHex, setDraftHex] = useState(slot._draftHex || slot.color);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1003,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: 16, padding: 16,
        border: '2px solid #334155',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', fontFamily: 'Inter,sans-serif' }}>
          Slot {slotIndex + 1} Color
        </div>
        <ColorWheelPicker
          hex={draftHex}
          onChange={setDraftHex}
          onPickColor={() => onPickFromWorkspace(draftHex)}
        />
        <div style={{ display: 'flex', gap: 6, width: '100%', justifyContent: 'center' }}>
          <button onClick={() => onConfirm(slotIndex, draftHex)} style={{
            flex: 1, padding: '5px 16px', fontSize: 11, fontWeight: 700,
            background: 'linear-gradient(135deg, #059669, #10b981)', border: '1px solid #34d399',
            borderRadius: 4, color: '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          }}>
            <Check size={12} strokeWidth={2.5} /> Confirm
          </button>
          <button onClick={onCancel} style={{
            flex: 1, padding: '5px 16px', fontSize: 11, fontWeight: 600,
            background: '#1e293b', border: '1px solid #475569',
            borderRadius: 4, color: '#94a3b8', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Canvas Simulator ──
export default function LogicGatesSimulator({ setPage }) {
  const canvasRef = useRef(null);
  const minimapRef = useRef(null);
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);

  // ── Undo / Redo ──
  const [circuitHistory, setCircuitHistory] = useState([]);
  const [circuitHistoryIdx, setCircuitHistoryIdx] = useState(-1);
  const circuitHistoryRef = useRef([]);
  const circuitHistoryIdxRef = useRef(-1);
  const canUndoCircuit = circuitHistoryIdx > 0;
  const canRedoCircuit = circuitHistoryIdx < circuitHistory.length - 1;
  // Flag to prevent recording undo snapshots during undo/redo itself
  const skipHistoryRef = useRef(false);

  useEffect(() => { circuitHistoryRef.current = circuitHistory; }, [circuitHistory]);
  useEffect(() => { circuitHistoryIdxRef.current = circuitHistoryIdx; }, [circuitHistoryIdx]);

  const pushCircuitHistory = (comps, wrs) => {
    if (skipHistoryRef.current) return;
    const snap = { components: JSON.parse(JSON.stringify(comps)), wires: JSON.parse(JSON.stringify(wrs)) };
    const idx = circuitHistoryIdxRef.current;
    const h = circuitHistoryRef.current.slice(0, idx + 1);
    h.push(snap);
    if (h.length > 50) h.shift();
    setCircuitHistory(h);
    setCircuitHistoryIdx(h.length - 1);
  };

  // Push initial empty state on mount
  useEffect(() => {
    pushCircuitHistory([], []);
  }, []);

  // Debounced history recording: track changes to components/wires
  // Debounce (300ms) prevents recording every intermediate drag pixel —
  // only the final resting state is recorded. Without this, a 1-second
  // drag at 60fps would produce 60 snapshots, pushing meaningful states
  // out of the 50-entry buffer and making undo step one pixel at a time.
  const lastRecordedRef = useRef({ comps: '[]', wrs: '[]' });
  const historyDebounceRef = useRef(null);
  const pendingHistoryRef = useRef(null);
  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      // Cancel any pending debounced recording (stale after undo/redo)
      if (historyDebounceRef.current) { clearTimeout(historyDebounceRef.current); historyDebounceRef.current = null; }
      pendingHistoryRef.current = null;
      return;
    }
    const compsKey = JSON.stringify(components);
    const wrsKey = JSON.stringify(wires);
    if (compsKey !== lastRecordedRef.current.comps || wrsKey !== lastRecordedRef.current.wrs) {
      // Store the pending state (will be committed after debounce)
      pendingHistoryRef.current = { comps: components, wrs: wires, compsKey, wrsKey };
      // Reset debounce timer
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = setTimeout(() => {
        const p = pendingHistoryRef.current;
        if (!p) return;
        // Double-check dedup (state might have reverted during debounce)
        if (p.compsKey !== lastRecordedRef.current.comps || p.wrsKey !== lastRecordedRef.current.wrs) {
          lastRecordedRef.current = { comps: p.compsKey, wrs: p.wrsKey };
          pushCircuitHistory(p.comps, p.wrs);
        }
        pendingHistoryRef.current = null;
        historyDebounceRef.current = null;
      }, 300);
    }
    return () => { if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current); };
  }, [components, wires]);

  // Helper: clear all tool UI state (anchors, selected IDs, boxes, active dirs)
  // so stale references to deleted components don't linger after undo/redo.
  const clearToolUIState = () => {
    // Move
    setMoveAnchors(null); setMoveSelectedIds([]); setMoveBox(null); setMoveActiveDir(null);
    // Rotate
    setRotateAnchors(null); setRotateSelectedIds([]); setRotateBox(null);
    // Clone
    setCloneAnchors(null); setCloneSelectedIds([]); setCloneBox(null);
    // Also clear refs so draw loop doesn't use stale values
    stateRef.current.moveAnchors = null; stateRef.current.moveSelectedIds = []; stateRef.current.moveActiveDir = null;
    stateRef.current.rotateAnchors = null; stateRef.current.rotateSelectedIds = [];
    stateRef.current.cloneAnchors = null; stateRef.current.cloneSelectedIds = [];
    // Misc
    setSelectedId(null);
    setColorPicker(null);
    stateRef.current.wiring = null;
    stateRef.current.dragging = null;
  };

  const undoCircuit = () => {
    if (!canUndoCircuit) return;
    skipHistoryRef.current = true;
    const newIdx = circuitHistoryIdx - 1;
    const snap = circuitHistory[newIdx];
    setComponents(JSON.parse(JSON.stringify(snap.components)));
    setWires(JSON.parse(JSON.stringify(snap.wires)));
    setCircuitHistoryIdx(newIdx);
    lastRecordedRef.current = { comps: JSON.stringify(snap.components), wrs: JSON.stringify(snap.wires) };
    clearToolUIState();
  };

  const redoCircuit = () => {
    if (!canRedoCircuit) return;
    skipHistoryRef.current = true;
    const newIdx = circuitHistoryIdx + 1;
    const snap = circuitHistory[newIdx];
    setComponents(JSON.parse(JSON.stringify(snap.components)));
    setWires(JSON.parse(JSON.stringify(snap.wires)));
    setCircuitHistoryIdx(newIdx);
    lastRecordedRef.current = { comps: JSON.stringify(snap.components), wrs: JSON.stringify(snap.wires) };
    clearToolUIState();
  };

  // ── Save Progress system ──
  const { user, getIdToken } = useAuth();

  /* ── Gold info for Save Progress overlay ── */
  const [goldInfo, setGoldInfo] = useState(null);
  const fetchGoldInfo = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getIdToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/ai-chat?action=gold-info', { headers });
      if (res.ok) {
        const data = await res.json();
        setGoldInfo(data);
      }
    } catch {
      // silent fail
    }
  }, [user, getIdToken]);

  const [saveOverlayOpen, setSaveOverlayOpen] = useState(false);

  /* Pre-fetch gold info on mount so it's ready when overlay opens */
  useEffect(() => {
    if (user) fetchGoldInfo();
    const id = setInterval(() => { if (user) fetchGoldInfo(); }, 30000);
    return () => clearInterval(id);
  }, [user, fetchGoldInfo]);

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveConfirm, setSaveConfirm] = useState(null); // { slotIndex, action: 'save'|'load' }
  const [saveStatus, setSaveStatus] = useState(null); // { message, type: 'success'|'error' }

  /* ── Slot Lock state (localStorage) ── */
  const LOCK_KEY = 'circuit_slot_locks';
  const getStoredLocksMap = () => { try { const v = JSON.parse(localStorage.getItem(LOCK_KEY)); return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; } catch { return {}; } };
  const setStoredLocksMap = (lockMap) => { try { localStorage.setItem(LOCK_KEY, JSON.stringify(lockMap)); } catch {} };
  // Build slotLocks array from slotId-keyed map + saveSlots order
  const buildLocksArray = (slots, lockMap) => slots.map((s, i) => lockMap[s.slotId] ?? false);
  const [slotLocks, setSlotLocks] = useState(() => {
    // Init from localStorage map + initial saveSlots order
    const lockMap = getStoredLocksMap();
    // We need the initial slot order — use defaults (will be re-synced by loadSlots effect)
    const defaultSlotIds = ['save-slot-1', 'save-slot-2', 'save-slot-3'];
    // If lockMap has entries, use them; otherwise default to [false, false, false]
    if (Object.keys(lockMap).length > 0) {
      return defaultSlotIds.map(id => lockMap[id] ?? false);
    }
    return [false, false, false];
  });
  const [lockAnim, setLockAnim] = useState(null);       // 'opening' | 'closing' | null
  const [lockConfirm, setLockConfirm] = useState(null);  // { slotIndex, action: 'lock'|'unlock' }
  const [lockWarning, setLockWarning] = useState(false);

  /* ── Slot metadata auto-persist (localStorage + backend) ── */
  const SLOT_META_KEY = 'circuit_slot_meta';
  const getStoredSlotMeta = () => {
    try {
      const raw = localStorage.getItem(SLOT_META_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  };
  const setStoredSlotMeta = (slots) => {
    try {
      // Store as slotId-keyed map so swap doesn't corrupt metadata
      const meta = {};
      for (const s of slots) {
        meta[s.slotId] = { name: s.name, description: s.description, color: s.color };
      }
      localStorage.setItem(SLOT_META_KEY, JSON.stringify(meta));
    } catch {}
  };
  /* ── Slot order persistence (localStorage) ── */
  // Stores the visual order of slotIds as an array, e.g. ["save-slot-1", "save-slot-9", "save-slot-2", ...]
  // This ensures swaps survive page refresh.
  const SLOT_ORDER_KEY = 'circuit_slot_order';
  const getStoredSlotOrder = () => {
    try {
      const raw = localStorage.getItem(SLOT_ORDER_KEY);
      if (!raw) return null;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) return arr;
      return null;
    } catch { return null; }
  };
  const setStoredSlotOrder = (slots) => {
    try {
      const order = slots.map(s => s.slotId);
      localStorage.setItem(SLOT_ORDER_KEY, JSON.stringify(order));
    } catch {}
  };
  // Reorder a slot array to match a stored order. Slots not in order are appended at the end.
  const applySlotOrder = (slots, order) => {
    if (!order || !Array.isArray(order) || order.length === 0) return slots;
    const orderSet = new Set(order);
    const ordered = [];
    for (const slotId of order) {
      const slot = slots.find(s => s.slotId === slotId);
      if (slot) ordered.push(slot);
    }
    // Append any slots not in the order (e.g., newly bought slots)
    for (const slot of slots) {
      if (!orderSet.has(slot.slotId)) ordered.push(slot);
    }
    return ordered;
  };
  // Initialize saveSlots from localStorage metadata if available (instant, no flicker)
  const initSlotMeta = getStoredSlotMeta();
  const initSlotOrder = getStoredSlotOrder();
  const [saveSlots, setSaveSlots] = useState(() => {
    const defaults = [
      { slotId: 'save-slot-1', name: '', description: '', color: '#3b82f6', data: null, updatedAt: null },
      { slotId: 'save-slot-2', name: '', description: '', color: '#8b5cf6', data: null, updatedAt: null },
      { slotId: 'save-slot-3', name: '', description: '', color: '#ec4899', data: null, updatedAt: null },
    ];
    let base = defaults;
    if (initSlotMeta) {
      base = defaults.map(d => {
        const m = initSlotMeta[d.slotId];
        if (m) return { ...d, name: m.name || '', description: m.description || '', color: m.color || d.color };
        return d;
      });
    }
    // Apply persisted slot order so swaps are visible immediately on load
    if (initSlotOrder) {
      base = applySlotOrder(base, initSlotOrder);
    }
    return base;
  });

  /* ── Save History state ── */
  const [historyOpen, setHistoryOpen] = useState(null);  // slotIndex or null
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyEmptyWarning, setHistoryEmptyWarning] = useState(null); // index number or null
  const [historyLoadConfirm, setHistoryLoadConfirm] = useState(null); // { historyIndex } or null
  const [slotColorEdit, setSlotColorEdit] = useState(null); // { slotIndex } or null

  /* ── Auto Save state ── */
  const [autoSaveData, setAutoSaveData] = useState(null); // circuitState or null
  const [autoSaveUpdatedAt, setAutoSaveUpdatedAt] = useState(null); // timestamp
  const [autoSaveReloading, setAutoSaveReloading] = useState(false);
  const AUTO_SAVE_ID = 'save-slot-auto';

  /* ── Buy Slot state ── */
  const [buySlotConfirm, setBuySlotConfirm] = useState(false);
  const [buySlotLoading, setBuySlotLoading] = useState(false);

  /* ── Slot Search ── */
  const [slotSearchQuery, setSlotSearchQuery] = useState('');

  /* ── Move Slot (swap) ── */
  const [moveSlotIndex, setMoveSlotIndex] = useState(null); // null = not moving, number = slot being moved
  const [swapAnim, setSwapAnim] = useState(null); // { from: idx, to: idx } during swap animation
  const [swapSuccessOverlay, setSwapSuccessOverlay] = useState(null); // { from, to } to show success overlay

  /* ── Auto Save: load from backend on mount ── */
  useEffect(() => {
    if (!user) return;
    const loadAutoSave = async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch(`/api/circuits?id=${AUTO_SAVE_ID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const { circuit } = await res.json();
        if (circuit?.data?.circuitState) {
          setAutoSaveData(circuit.data.circuitState);
          setAutoSaveUpdatedAt(circuit.updated_at || circuit.created_at || null);
        }
      } catch { /* silent */ }
    };
    loadAutoSave();
  }, [user, getIdToken]);

  /* ── Auto Save: save every 5 minutes + beforeunload ── */
  const autoSaveTimerRef = useRef(null);
  const autoSaveCircuitRef = useRef(null);
  const doAutoSave = useCallback(async () => {
    if (!user || !getIdToken) return;
    const cs = autoSaveCircuitRef.current;
    if (!cs) return;
    try {
      const token = await getIdToken();
      if (!token) return;
      await fetch('/api/circuits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          itemId: AUTO_SAVE_ID,
          name: 'Auto Save',
          data: { circuitState: cs, color: '#3b82f6', description: '' },
          metaOnly: true,
        }),
      });
      const now = Date.now();
      setAutoSaveUpdatedAt(now);
    } catch { /* silent */ }
  }, [user, getIdToken]);

  // Keep autoSaveCircuitRef in sync with current circuit
  useEffect(() => {
    autoSaveCircuitRef.current = {
      components: JSON.parse(JSON.stringify(components)),
      wires: JSON.parse(JSON.stringify(wires)),
      typeCounters: JSON.parse(JSON.stringify(typeCounters)),
      nextId: stateRef.current.nextId,
    };
  });

  // 5-minute auto-save timer
  useEffect(() => {
    if (!user) return;
    autoSaveTimerRef.current = setInterval(() => { doAutoSave(); }, 5 * 60 * 1000);
    const handleBeforeUnload = () => { doAutoSave(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      clearInterval(autoSaveTimerRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, doAutoSave]);

  /* ── Load Auto Save ── */
  const doLoadAutoSave = async () => {
    if (!autoSaveData) { setSaveStatus({ message: 'Auto Save kosong, tidak ada data.', type: 'error' }); return; }
    setAutoSaveReloading(true);
    try {
      setComponents(JSON.parse(JSON.stringify(autoSaveData.components || [])));
      setWires(JSON.parse(JSON.stringify(autoSaveData.wires || [])));
      if (autoSaveData.typeCounters) setTypeCounters(autoSaveData.typeCounters);
      if (autoSaveData.nextId) setNextId(autoSaveData.nextId);
      setSaveStatus({ message: 'Auto Save berhasil di-load!', type: 'success' });
    } catch (e) {
      setSaveStatus({ message: 'Gagal load Auto Save: ' + e.message, type: 'error' });
    }
    setAutoSaveReloading(false);
  };

  /* ── Buy Slot ── */
  const doBuySlot = async () => {
    if (!user || !getIdToken) { setSaveStatus({ message: 'Harap login terlebih dahulu!', type: 'error' }); return; }
    setBuySlotLoading(true);
    try {
      const token = await getIdToken();
      if (!token) { setBuySlotConfirm(false); setBuySlotLoading(false); return; }
      // Check gold balance
      const goldRes = await fetch('/api/ai-chat?action=gold-info', { headers: { Authorization: `Bearer ${token}` } });
      if (!goldRes.ok) { setSaveStatus({ message: 'Gagal cek gold.', type: 'error' }); setBuySlotLoading(false); setBuySlotConfirm(false); return; }
      const goldData = await goldRes.json();
      const currentGold = goldData.isAdmin ? Infinity : (goldData.gold ?? 0);
      // Skip gold check for infinite balance (admin or ∞ gold)
      if (currentGold !== Infinity && currentGold < 100) { setSaveStatus({ message: 'Gold tidak cukup! Kamu butuh 100 gold.', type: 'error' }); setBuySlotLoading(false); setBuySlotConfirm(false); return; }
      // Deduct gold via buy-slot action
      const deductRes = await fetch('/api/ai-chat?action=buy-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: 100 }),
      });
      if (!deductRes.ok) { const d = await deductRes.json().catch(() => ({})); setSaveStatus({ message: d.error || 'Gagal memotong gold.', type: 'error' }); setBuySlotLoading(false); setBuySlotConfirm(false); return; }
      // Add new slot — persist to Supabase so it survives refresh
      const newSlotNum = saveSlots.length + 1;
      const newSlotId = `save-slot-${newSlotNum}`;
      const newSlot = { slotId: newSlotId, name: '', description: '', color: '#3b82f6', data: null, updatedAt: null };
      // Save empty circuit record to backend so the slot is persisted
      try {
        await fetch('/api/circuits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            itemId: newSlotId,
            name: `Slot ${newSlotNum}`,
            data: { circuitState: null, color: '#3b82f6', description: '' },
          }),
        });
      } catch (e) { /* slot still added locally even if persist fails */ }
      setSaveSlots(prev => [...prev, newSlot]);
      // Also extend slotLocks
      setSlotLocks(prev => [...prev, false]);
      setSaveStatus({ message: `Slot ${newSlotNum} berhasil dibeli!`, type: 'success' });
      // Refresh gold info
      fetchGoldInfo();
    } catch (e) {
      setSaveStatus({ message: 'Gagal membeli slot: ' + e.message, type: 'error' });
    }
    setBuySlotLoading(false);
    setBuySlotConfirm(false);
  };

  // Load all save slots from backend on mount
  // Backend is authoritative for circuitState/updatedAt.
  // For metadata (name/description/color): merge with localStorage —
  //   if localStorage has customized values (non-default), keep those (they're more recent).
  //   If localStorage is default/empty, use backend values (cross-device sync).
  // Slot ORDER is persisted as a special 'save-slot-order' record in backend
  //   and also in localStorage — swaps survive refresh and cross-device sync.
  useEffect(() => {
    if (!user) return;
    const loadSlots = async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch('/api/circuits', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const { circuits } = await res.json();
        if (!circuits) return;
        const localMeta = getStoredSlotMeta();
        // Fetch slot order from backend (stored as 'save-slot-order')
        let backendOrder = null;
        try {
          const orderRes = await fetch('/api/circuits?id=save-slot-order', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (orderRes.ok) {
            const orderData = await orderRes.json();
            if (orderData.circuit?.data?.order && Array.isArray(orderData.circuit.data.order)) {
              backendOrder = orderData.circuit.data.order;
            }
          }
        } catch { /* order fetch failed, not critical */ }
        // Merge: localStorage order takes priority (more recent), then backend order
        const localOrder = getStoredSlotOrder();
        const effectiveOrder = localOrder || backendOrder;
        setSaveSlots(prev => {
          const updated = prev.map((slot) => {
            const match = circuits.find(c => c.item_id === slot.slotId);
            if (match) {
              // Use localStorage metadata if it was customized (not default),
              // otherwise use backend metadata (for cross-device sync)
              // Lookup by slotId (not index) so swaps don't corrupt metadata
              const localM = localMeta?.[slot.slotId];
              const defaultColors = { 'save-slot-1': '#3b82f6', 'save-slot-2': '#8b5cf6', 'save-slot-3': '#ec4899' };
              const localIsCustom = localM && (localM.name || localM.description || (localM.color && localM.color !== defaultColors[slot.slotId]));
              return {
                ...slot,
                name: localIsCustom ? (localM.name || '') : (match.name || ''),
                description: localIsCustom ? (localM.description || '') : (match.data?.description || ''),
                color: localIsCustom ? (localM.color || slot.color) : (match.data?.color || slot.color),
                data: match.data?.circuitState || null,
                updatedAt: match.updated_at || match.created_at || null,
              };
            }
            return slot;
          });
          // Add slots from backend that aren't in the initial hardcoded list
          // (e.g., slots bought after the 3 default ones)
          // IMPORTANT: exclude save-slot-auto (Auto Save) and save-slot-order (meta record)
          const existingIds = new Set(updated.map(s => s.slotId));
          const extraSlots = circuits
            .filter(c => c.item_id?.startsWith('save-slot-')
              && c.item_id !== 'save-slot-auto'  // ← exclude Auto Save
              && c.item_id !== 'save-slot-order' // ← exclude order meta record
              && !existingIds.has(c.item_id))
            .sort((a, b) => (a.item_id || '').localeCompare(b.item_id || ''))
            .map(c => ({
              slotId: c.item_id,
              name: c.name || '',
              description: c.data?.description || '',
              color: c.data?.color || '#3b82f6',
              data: c.data?.circuitState || null,
              updatedAt: c.updated_at || c.created_at || null,
            }));
          // Apply persisted slot order so swaps survive refresh
          let finalSlots = [...updated, ...extraSlots];
          if (effectiveOrder) {
            finalSlots = applySlotOrder(finalSlots, effectiveOrder);
          }
          // Re-sync slotLocks from localStorage slotId-keyed map based on final slot order
          const lockMap = getStoredLocksMap();
          setSlotLocks(buildLocksArray(finalSlots, lockMap));
          // Also sync localStorage order with the effective order
          if (effectiveOrder) {
            try { localStorage.setItem(SLOT_ORDER_KEY, JSON.stringify(effectiveOrder)); } catch {}
          }
          return finalSlots;
        });
      } catch (e) { /* silent */ }
    };
    loadSlots();
  }, [user, getIdToken]);

  // ── Auto-persist slot locks to localStorage (slotId-keyed) ──
  useEffect(() => {
    const lockMap = {};
    slotLocks.forEach((val, i) => { if (saveSlots[i]) lockMap[saveSlots[i].slotId] = val; });
    setStoredLocksMap(lockMap);
  }, [slotLocks, saveSlots]);

  // ── Auto-save slot metadata: localStorage (instant) + backend (debounced 500ms) ──
  // localStorage saves instantly on every change.
  // Backend saves with 500ms debounce (avoids spam on text input keystrokes).
  // A beforeunload handler flushes pending saves so data is never lost on refresh.
  const slotMetaSaveTimerRef = useRef(null);
  const slotMetaFirstRenderRef = useRef(true);
  const saveMetaToBackend = useCallback(async (slots) => {
    if (!user || !getIdToken) return;
    try {
      const token = await getIdToken();
      if (!token) return;
      for (const slot of slots) {
        await fetch('/api/circuits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            itemId: slot.slotId,
            name: slot.name || `Slot ${slots.indexOf(slot) + 1}`,
            data: { circuitState: slot.data || null, color: slot.color, description: slot.description },
            metaOnly: true,
          }),
        });
      }
      // Also persist slot ORDER to backend so swaps survive refresh + cross-device
      const order = slots.map(s => s.slotId);
      await fetch('/api/circuits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          itemId: 'save-slot-order',
          name: 'Slot Order',
          data: { order },
          metaOnly: true,
        }),
      });
    } catch (e) { /* silent — localStorage already has the data */ }
  }, [user, getIdToken]);
  useEffect(() => {
    // Always persist to localStorage immediately (metadata + order)
    setStoredSlotMeta(saveSlots);
    setStoredSlotOrder(saveSlots);
    // Skip backend save on very first render
    if (slotMetaFirstRenderRef.current) {
      slotMetaFirstRenderRef.current = false;
      return;
    }
    // Debounced backend save (500ms)
    if (slotMetaSaveTimerRef.current) clearTimeout(slotMetaSaveTimerRef.current);
    slotMetaSaveTimerRef.current = setTimeout(() => saveMetaToBackend(saveSlots), 500);
    return () => { if (slotMetaSaveTimerRef.current) clearTimeout(slotMetaSaveTimerRef.current); };
  }, [saveSlots, saveMetaToBackend]);
  // Flush pending backend save on page hide / beforeunload (so refresh never loses data)
  useEffect(() => {
    const flush = () => {
      if (slotMetaSaveTimerRef.current) {
        clearTimeout(slotMetaSaveTimerRef.current);
        slotMetaSaveTimerRef.current = null;
        saveMetaToBackend(saveSlots);
      }
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
    return () => { window.removeEventListener('beforeunload', flush); };
  }, [saveSlots, saveMetaToBackend]);

  const doSaveSlot = async (slotIndex) => {
    const slot = saveSlots[slotIndex];
    setSaveLoading(true);
    setSaveStatus(null);
    try {
      const token = await getIdToken();
      if (!token) { setSaveStatus({ message: 'Harap login terlebih dahulu!', type: 'error' }); setSaveLoading(false); return; }
      const circuitState = {
        components: JSON.parse(JSON.stringify(components)),
        wires: JSON.parse(JSON.stringify(wires)),
        typeCounters: JSON.parse(JSON.stringify(typeCounters)),
        nextId: stateRef.current.nextId,
      };
      const res = await fetch('/api/circuits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          itemId: slot.slotId,
          name: slot.name || `Slot ${slotIndex + 1}`,
          data: { circuitState, color: slot.color, description: slot.description },
        }),
      });
      if (!res.ok) { let err = {}; try { err = await res.json(); } catch (_) {} setSaveStatus({ message: `${err.error || err.message || 'Gagal menyimpan'} (status ${res.status})`, type: 'error' }); setSaveLoading(false); return; }
      const now = Date.now();
      setSaveSlots(prev => prev.map((s, i) => i === slotIndex ? { ...s, data: circuitState, updatedAt: now } : s));
      setSaveStatus({ message: `Slot ${slotIndex + 1} berhasil disimpan!`, type: 'success' });
    } catch (e) { setSaveStatus({ message: 'Gagal menyimpan: ' + e.message, type: 'error' }); }
    setSaveLoading(false);
  };

  const doLoadSlot = async (slotIndex) => {
    const slot = saveSlots[slotIndex];
    if (!slot.data) { setSaveStatus({ message: 'Slot ini kosong, tidak ada data untuk di-load.', type: 'error' }); return; }
    setSaveLoading(true);
    setSaveStatus(null);
    try {
      let loadedData = slot.data;
      if (!loadedData) {
        const token = await getIdToken();
        if (!token) { setSaveStatus({ message: 'Harap login terlebih dahulu!', type: 'error' }); setSaveLoading(false); return; }
        const res = await fetch(`/api/circuits?id=${slot.slotId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { setSaveStatus({ message: 'Gagal memuat data slot', type: 'error' }); setSaveLoading(false); return; }
        const { circuit } = await res.json();
        loadedData = circuit?.data?.circuitState;
      }
      if (loadedData) {
        skipHistoryRef.current = true;
        setComponents(JSON.parse(JSON.stringify(loadedData.components || [])));
        setWires(JSON.parse(JSON.stringify(loadedData.wires || [])));
        if (loadedData.typeCounters) setTypeCounters(loadedData.typeCounters);
        if (loadedData.nextId) setNextId(loadedData.nextId);
        // Record in undo history
        setTimeout(() => {
          pushCircuitHistory(loadedData.components || [], loadedData.wires || []);
          lastRecordedRef.current = { comps: JSON.stringify(loadedData.components || []), wrs: JSON.stringify(loadedData.wires || []) };
        }, 50);
        clearToolUIState();
        setSaveStatus({ message: `Slot ${slotIndex + 1} berhasil di-load!`, type: 'success' });
      }
    } catch (e) { setSaveStatus({ message: 'Gagal me-load: ' + e.message, type: 'error' }); }
    setSaveLoading(false);
  };

  // ── Rotation animation state ──
  // Saat animasi rotasi aktif, komponen yang ter-select di-interpolasi
  // dari posisi lama ke posisi baru. Durasi ~250ms.
  const [rotAnim, setRotAnim] = useState(null); // { startTime, duration, pivot: {x,y}, oldComps: [{id,x,y,facing}], newComps: [{id,x,y,facing}] }
  const rotAnimRef = useRef(null);
  useEffect(() => { rotAnimRef.current = rotAnim; }, [rotAnim]);
  const [nextId, setNextId] = useState(1);
  // Counter per-type untuk numbering (AND 1, AND 2, OR 1, OR 2, NOT 1, INPUT 1, OUTPUT 1, dll).
  // Persistent: kalau AND 2 di-delete, AND berikutnya yang dibuat jadi AND 3 (bukan reuse AND 2).
  // Alasan: gak bikin bingung — kalau nomor reuse, user bisa kira "AND 2 yang lama" padahal gak.
  const [typeCounters, setTypeCounters] = useState({});
  // Status text DIHAPUS — user request: teks aneh ganggu, hilangin sepenuhnya.
  // setStatus di-define sebagai no-op supaya panggilan lama gak error.
  const setStatus = () => {};
  const [selectedId, setSelectedId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  // Viewport: pan & zoom state. view = { x, y, scale } di stateRef (mutable, dipakai draw loop &
  // hitTest via screenToWorld). zoomPct di React state cuma buat UI label.
  const [zoomPct, setZoomPct] = useState(100);
  // Cursor world coords — null saat mouse di luar canvas. Dipakai buat coordinate display.
  const [cursorWorld, setCursorWorld] = useState(null);
  // Color picker untuk wire: null = tutup, { wireId, x, y, hex } = buka di posisi (x,y).
  // x,y = screen coords (di mana panel muncul). hex = warna saat ini di picker.
  const [colorPicker, setColorPicker] = useState(null);
  const colorPickerRef = useRef(null);
  useEffect(() => { colorPickerRef.current = colorPicker; }, [colorPicker]);
  // Sidebar palette toggle — user minta: bisa tutup panel komponen biar leluasa berkreasi di canvas,
  // Default true (terbuka) supaya user langsung bisa lihat & drag komponen dari palette.
  // SELALU terbuka saat pertama kali, termasuk di mobile.
  const [paletteOpen, setPaletteOpen] = useState(true);
  // Mobile detection — track viewport width buat responsive layout (header collapse, dll).
  // User feedback: 'di mobile layoutnya ngawur, tombol header numpuk'.
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  // Mobile menu toggle — collapse tombol Clear All & Load Demo ke dropdown menu di mobile.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Mode toggle: 'build' (drag/pan components) vs 'connect' (zone-based wire connection).
  // modeRef supaya canvas event handlers (registered sekali di useEffect) bisa baca mode
  // terbaru tanpa harus re-register tiap render. User request: tombol Mode di samping kiri,
  // zone-based touch untuk wire (kanan=output, kiri atas=input1, kiri bawah=input2).
  const [mode, setMode] = useState('build');
  const modeRef = useRef('build');
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // ── Paint Mode & Delete Mode ──
  // User request: dua tombol baru di bawah tombol "mode: build".
  // PAINT MODE (biru): saat ON, klik wire/komponen → buka color picker buat ganti warna.
  //   - Wire color picker = sistem yang sudah ada (RGB palette + preview ON/OFF + random).
  //   - Component color picker = baru, override def.color pakai comp.userColor.
  //   - Saat ON: dilarang drag komponen baru dari palette & dilarang geser komponen existing.
  //   - Menggantikan behavior lama (klik wire selalu buka color picker) → sekarang butuh paint ON.
  // DELETE MODE (merah, ikon X): saat ON, klik wire → wire hilang, klik komponen → komponen + wires-nya hilang.
  //   - Saat ON: dilarang drag komponen baru & dilarang geser komponen existing.
  // Mutual exclusive: turn ON salah satu → yang lain OFF. Keduanya boleh OFF sekaligus.
  // Refs supaya canvas event handlers (registered sekali di useEffect) baca value terbaru.
  const [paintMode, setPaintMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [cloneMode, setCloneMode] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [rotateMode, setRotateMode] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  // Eyedropper pick-from-workspace mode: close color picker, click component/wire to grab its color.
  const [pickFromWorkspace, setPickFromWorkspace] = useState(null); // saved colorPicker state or null
  const pickFromWorkspaceRef = useRef(null);
  useEffect(() => { pickFromWorkspaceRef.current = pickFromWorkspace; }, [pickFromWorkspace]);
  // Shared eyedropper cursor URL (generated once, used by canvas + save overlay)
  const eyedropperCursorUrlRef = useRef(null);
  const getEyedropperCursorUrl = useCallback(() => {
    if (eyedropperCursorUrlRef.current) return eyedropperCursorUrlRef.current;
    const curCanvas = document.createElement('canvas');
    curCanvas.width = 48; curCanvas.height = 48;
    const ctx = curCanvas.getContext('2d');
    ctx.save();
    ctx.translate(24, 24);
    ctx.rotate(-Math.PI / 4);
    // Glass tube
    ctx.fillStyle = '#333';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-3, -20, 6, 28, 3);
    ctx.fill(); ctx.stroke();
    // Bulb
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.ellipse(0, -20, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Narrow tip
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(-2, 8); ctx.lineTo(2, 8);
    ctx.lineTo(0.7, 18); ctx.lineTo(-0.7, 18);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Drop
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(0, 20, 2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.restore();
    const url = curCanvas.toDataURL('image/png');
    eyedropperCursorUrlRef.current = url;
    return url;
  }, []);
  const paintModeRef = useRef(false);
  const deleteModeRef = useRef(false);
  const cloneModeRef = useRef(false);
  const moveModeRef = useRef(false);
  const rotateModeRef = useRef(false);
  useEffect(() => { paintModeRef.current = paintMode; }, [paintMode]);
  useEffect(() => { deleteModeRef.current = deleteMode; }, [deleteMode]);
  useEffect(() => { cloneModeRef.current = cloneMode; }, [cloneMode]);
  useEffect(() => { moveModeRef.current = moveMode; }, [moveMode]);
  useEffect(() => { rotateModeRef.current = rotateMode; }, [rotateMode]);
  // Safety net: pastikan tools TERTUTUP saat pertama kali mount.
  // Palette dibiarkan terbuka (sesuai default) supaya user langsung bisa akses komponen.
  useEffect(() => {
    setToolsOpen(false);
  }, []);
  // Clear clone selection state when clone mode is turned off
  useEffect(() => {
    if (!cloneMode) {
      setCloneBox(null);
      setCloneSelectedIds([]);
      setCloneAnchors(null);
    }
  }, [cloneMode]);
  // Clear move selection state when move mode is turned off
  useEffect(() => {
    if (!moveMode) {
      setMoveBox(null);
      setMoveSelectedIds([]);
      setMoveAnchors(null);
      setMoveActiveDir(null);
    }
  }, [moveMode]);
  // Clear rotate selection state when rotate mode is turned off
  useEffect(() => {
    if (!rotateMode) {
      setRotateBox(null);
      setRotateSelectedIds([]);
      setRotateAnchors(null);
    }
  }, [rotateMode]);
  // Helper toggle: turn ON satu = turn OFF semua lain (mutual exclusive).
  const togglePaint = () => {
    setPaintMode(prev => {
      const next = !prev;
      if (next) {
        setDeleteMode(false);
        setCloneMode(false);
        setMoveMode(false);
        setRotateMode(false);
        setMode('build');
        setToolsOpen(false);
      }
      return next;
    });
  };
  const toggleDelete = () => {
    setDeleteMode(prev => {
      const next = !prev;
      if (next) {
        setPaintMode(false);
        setCloneMode(false);
        setMoveMode(false);
        setRotateMode(false);
        setMode('build');
        setToolsOpen(false);
      }
      return next;
    });
  };
  const toggleClone = () => {
    setCloneMode(prev => {
      const next = !prev;
      if (next) {
        setPaintMode(false);
        setDeleteMode(false);
        setMoveMode(false);
        setRotateMode(false);
        setMode('build');
        setToolsOpen(false);
        // Transfer selection from other mode if active
        const v = stateRef.current.view;
        const comps = stateRef.current.components;
        if (moveModeRef.current && moveSelectedIdsRef.current.length > 0) {
          const selIds = moveSelectedIdsRef.current;
          const selComps = comps.filter(c => selIds.includes(c.id));
          if (selComps.length > 0) {
            setCloneSelectedIds(selIds);
            const result = calcAnchorsFromComponents(selComps, v);
            if (result) { setCloneBox(result.box); setCloneAnchors(result.anchors); }
          }
        } else if (rotateModeRef.current && rotateSelectedIdsRef.current.length > 0) {
          const selIds = rotateSelectedIdsRef.current;
          const selComps = comps.filter(c => selIds.includes(c.id));
          if (selComps.length > 0) {
            setCloneSelectedIds(selIds);
            const result = calcAnchorsFromComponents(selComps, v);
            if (result) { setCloneBox(result.box); setCloneAnchors(result.anchors); }
          }
        }
      }
      return next;
    });
  };
  const toggleMove = () => {
    setMoveMode(prev => {
      const next = !prev;
      if (next) {
        setPaintMode(false);
        setDeleteMode(false);
        setCloneMode(false);
        setRotateMode(false);
        setMode('build');
        setToolsOpen(false);
        // Transfer selection from other mode if active
        const v = stateRef.current.view;
        const comps = stateRef.current.components;
        if (cloneModeRef.current && cloneSelectedIdsRef.current.length > 0) {
          const selIds = cloneSelectedIdsRef.current;
          const selComps = comps.filter(c => selIds.includes(c.id));
          if (selComps.length > 0) {
            setMoveSelectedIds(selIds);
            const result = calcAnchorsFromComponents(selComps, v);
            if (result) { setMoveBox(null); setMoveAnchors(result.anchors); }
          }
        } else if (rotateModeRef.current && rotateSelectedIdsRef.current.length > 0) {
          const selIds = rotateSelectedIdsRef.current;
          const selComps = comps.filter(c => selIds.includes(c.id));
          if (selComps.length > 0) {
            setMoveSelectedIds(selIds);
            const result = calcAnchorsFromComponents(selComps, v);
            if (result) { setMoveBox(null); setMoveAnchors(result.anchors); }
          }
        }
      }
      return next;
    });
  };
  const toggleRotate = () => {
    setRotateMode(prev => {
      const next = !prev;
      if (next) {
        setPaintMode(false);
        setDeleteMode(false);
        setCloneMode(false);
        setMoveMode(false);
        setMode('build');
        setToolsOpen(false);
        // Transfer selection from other mode if active
        const v = stateRef.current.view;
        const comps = stateRef.current.components;
        if (moveModeRef.current && moveSelectedIdsRef.current.length > 0) {
          const selIds = moveSelectedIdsRef.current;
          const selComps = comps.filter(c => selIds.includes(c.id));
          if (selComps.length > 0) {
            setRotateSelectedIds(selIds);
            setRotateAnchors('active');
            const result = calcAnchorsFromComponents(selComps, v);
            if (result) setRotateBox(result.box);
          }
        } else if (cloneModeRef.current && cloneSelectedIdsRef.current.length > 0) {
          const selIds = cloneSelectedIdsRef.current;
          const selComps = comps.filter(c => selIds.includes(c.id));
          if (selComps.length > 0) {
            setRotateSelectedIds(selIds);
            setRotateAnchors('active');
            const result = calcAnchorsFromComponents(selComps, v);
            if (result) setRotateBox(result.box);
          }
        }
      }
      return next;
    });
  };
  // ── Keyboard shortcuts 1-8 (PC only): toggle tool modes + auto-open tools panel ──
  // 1=undo, 2=redo, 3=move, 4=rotate, 5=clone, 6=connect wire, 7=paint, 8=delete
  // Jika tools panel tertutup → auto-buka + aktifkan mode.
  // Undo/redo (1,2) do NOT close tools panel.
  const toggleMoveRef = useRef(toggleMove);
  const toggleRotateRef = useRef(toggleRotate);
  const toggleCloneRef = useRef(toggleClone);
  const togglePaintRef = useRef(togglePaint);
  const toggleDeleteRef = useRef(toggleDelete);
  const undoCircuitRef = useRef(undoCircuit);
  const redoCircuitRef = useRef(redoCircuit);
  toggleMoveRef.current = toggleMove;
  toggleRotateRef.current = toggleRotate;
  toggleCloneRef.current = toggleClone;
  togglePaintRef.current = togglePaint;
  toggleDeleteRef.current = toggleDelete;
  undoCircuitRef.current = undoCircuit;
  redoCircuitRef.current = redoCircuit;
  useEffect(() => {
    if (isMobile) return; // PC only
    const onToolKey = (e) => {
      // Ignore kalau lagi ngetik di input/textarea
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key;
      if (k >= '1' && k <= '8') {
        e.preventDefault();
        setToolsOpen(true); // Auto-open tools panel
        if (k === '1') undoCircuitRef.current();       // undo — does NOT close tools
        else if (k === '2') redoCircuitRef.current();   // redo — does NOT close tools
        else if (k === '3') toggleMoveRef.current();
        else if (k === '4') toggleRotateRef.current();
        else if (k === '5') toggleCloneRef.current();
        else if (k === '6') {
          // Connect wire: toggle via mode state
          setMode(prev => {
            if (prev === 'connect') return 'build';
            setPaintMode(false); setDeleteMode(false); setCloneMode(false); setMoveMode(false); setRotateMode(false);
            return 'connect';
          });
        }
        else if (k === '7') togglePaintRef.current();
        else if (k === '8') toggleDeleteRef.current();
      }
    };
    window.addEventListener('keydown', onToolKey);
    return () => window.removeEventListener('keydown', onToolKey);
  }, [isMobile]);

  // ── Clone selection state ──
  // Saat cloneMode ON & user drag canvas → muncul purple selection box.
  // cloneBox = { sx, sy, ex, ey } (screen coords). null = gak ada active drag.
  // cloneSelectedIds = array id komponen yang terkena box.
  // cloneAnchors = 4 titik duplikasi (atas/bawah/kiri/kanan) setelah mouseUp.
  const [cloneBox, setCloneBox] = useState(null);
  const [cloneSelectedIds, setCloneSelectedIds] = useState([]);
  const [cloneAnchors, setCloneAnchors] = useState(null);
  const cloneBoxRef = useRef(null);
  const cloneSelectedIdsRef = useRef([]);
  useEffect(() => { cloneBoxRef.current = cloneBox; }, [cloneBox]);
  useEffect(() => { cloneSelectedIdsRef.current = cloneSelectedIds; }, [cloneSelectedIds]);

  // ── Move Area selection state ──
  // Teal (#0ea5e9). Drag → selection box. Anchors = 4 panah menghadap keluar.
  // Klik tahan anchor → 3 lain hilang → drag bebas → lepas → muncul lagi.
  const [moveBox, setMoveBox] = useState(null);
  const [moveSelectedIds, setMoveSelectedIds] = useState([]);
  const [moveAnchors, setMoveAnchors] = useState(null);
  const [moveActiveDir, setMoveActiveDir] = useState(null); // 'top'|'bottom'|'left'|'right' when dragging
  const moveBoxRef = useRef(null);
  const moveAnchorsRef = useRef(null);
  const moveSelectedIdsRef = useRef([]);
  const moveActiveDirRef = useRef(null);
  useEffect(() => { moveBoxRef.current = moveBox; }, [moveBox]);
  useEffect(() => { moveAnchorsRef.current = moveAnchors; }, [moveAnchors]);
  useEffect(() => { moveSelectedIdsRef.current = moveSelectedIds; }, [moveSelectedIds]);
  useEffect(() => { moveActiveDirRef.current = moveActiveDir; }, [moveActiveDir]);

  // ── Rotate Area selection state ──
  // Amber (#f59e0b). Drag → selection box. Anchors = 4 double-circle (lingkaran di dalam lingkaran).
  // Klik anchor → rotate area by 90° in that direction.
  const [rotateBox, setRotateBox] = useState(null);
  const [rotateSelectedIds, setRotateSelectedIds] = useState([]);
  const [rotateAnchors, setRotateAnchors] = useState(null);
  const rotateBoxRef = useRef(null);
  const rotateAnchorsRef = useRef(null);
  const rotateSelectedIdsRef = useRef([]);
  useEffect(() => { rotateBoxRef.current = rotateBox; }, [rotateBox]);
  useEffect(() => { rotateAnchorsRef.current = rotateAnchors; }, [rotateAnchors]);
  useEffect(() => { rotateSelectedIdsRef.current = rotateSelectedIds; }, [rotateSelectedIds]);

  // Touch state ref — track multi-touch buat pinch-zoom & pan di mobile.
  // User feedback: 'gak bisa drag/drop, gak bisa zoom, gak bisa geser area kerja di mobile'.
  const touchStateRef = useRef({ pointers: new Map(), pinchStart: null, panStart: null });
  const spaceDownRef = useRef(false);

  const stateRef = useRef({
    components, wires, nextId, selectedId, typeCounters,
    wiring: null, dragging: null, dragOffset: { x: 0, y: 0 }, hoverNode: null,
    hoverZone: null,  // ← { compId, kind, idx } — zona yang sedang di-hover di connect mode (visual feedback)
    view: { x: 0, y: 0, scale: 1 },       // ← viewport pan/zoom (mutable, dibaca tiap frame)
    panning: null,                         // ← { startMouseX, startMouseY, startViewX, startViewY } saat pan aktif
    minimap: null,                          // ← { minX, minY, s, offX, offY } transform world→minimap (diupdate tiap frame)
    cloneBox: null, cloneAnchors: null, cloneSelectedIds: [],
    moveBox: null, moveAnchors: null, moveSelectedIds: [], moveActiveDir: null,
    rotateBox: null, rotateAnchors: null, rotateSelectedIds: [],
  });
  useEffect(() => { stateRef.current = { ...stateRef.current, components, wires, nextId, selectedId, typeCounters }; }, [components, wires, nextId, selectedId, typeCounters]);
  useEffect(() => { stateRef.current = { ...stateRef.current, cloneBox, cloneAnchors, cloneSelectedIds }; }, [cloneBox, cloneAnchors, cloneSelectedIds]);
  useEffect(() => { stateRef.current = { ...stateRef.current, moveBox, moveAnchors, moveSelectedIds, moveActiveDir }; }, [moveBox, moveAnchors, moveSelectedIds, moveActiveDir]);
  useEffect(() => { stateRef.current = { ...stateRef.current, rotateBox, rotateAnchors, rotateSelectedIds, rotAnim }; }, [rotateBox, rotateAnchors, rotateSelectedIds, rotAnim]);

  // Screen (canvas pixel) → World (component coords). Dipakai SEMUA mouse handler.
  const screenToWorld = useCallback((sx, sy) => {
    const v = stateRef.current.view;
    return { x: (sx - v.x) / v.scale, y: (sy - v.y) / v.scale };
  }, []);

  // Clamp zoom supaya gak terlalu extreme (0.2x – 3x).
  const clampScale = (s) => Math.max(0.2, Math.min(3, s));

  // Zoom terhadap titik layar tertentu (biasanya cursor). World point di bawah cursor
  // tetap di bawah cursor sesudah zoom.
  const zoomAt = useCallback((sx, sy, factor) => {
    const v = stateRef.current.view;
    const newScale = clampScale(v.scale * factor);
    if (newScale === v.scale) return;
    const worldX = (sx - v.x) / v.scale;
    const worldY = (sy - v.y) / v.scale;
    v.x = sx - worldX * newScale;
    v.y = sy - worldY * newScale;
    v.scale = newScale;
    setZoomPct(Math.round(newScale * 100));
  }, []);

  // Reset viewport ke origin + scale 1 (fit default).
  const resetView = useCallback(() => {
    const v = stateRef.current.view;
    v.x = 0; v.y = 0; v.scale = 1;
    setZoomPct(100);
  }, []);

  const createComponent = useCallback((type, x, y, typeNum) => {
    // Tentukan ukuran box & jumlah input/output berdasarkan type
    let w = 90, h = 56, inputCount = 2, outputCount = 1;
    if (type === 'not') {
      w = 80; inputCount = 1;
    } else if (type === 'INPUT' || type === 'OUTPUT') {
      const io = IO_DEFS[type];
      w = io.width; h = io.height; inputCount = io.inputCount; outputCount = io.outputCount;
    }
    return {
      id: stateRef.current.nextId,
      type,
      typeNum,  // ← nomor urut per-type (AND 1, AND 2, OR 1, dll) untuk label display
      x, y,
      width: w,
      height: h,
      facing: 0,  // 0=right (default), 1=down, 2=left, 3=up
      inputs: Array(inputCount).fill(false),
      outputs: Array(outputCount).fill(false),
      inputWires: Array(inputCount).fill(null),
      outputWires: Array(outputCount).fill([]),
    };
  }, []);

  const simulate = useCallback((comps, wrs) => {
    let changed = true;
    let iters = 0;
    const compsCopy = comps.map(c => ({...c, inputs: [...c.inputs], outputs: [...c.outputs]}));
    while (changed && iters < 50) {
      changed = false;
      iters++;
      for (const comp of compsCopy) {
        if (comp.type === 'INPUT') continue;
        if (comp.type === 'OUTPUT') {
          // OUTPUT adalah sink (LED) — baca nilai dari wire input, tidak ada output untuk di-compute.
          // ATURAN ABSOLUT: kalau inputWires[i] null/undefined (wire dihapus) → inputs[i] HARUS false.
          // Gak boleh pakai value lama (anti "ghost current" — LED nyala sendiri tanpa sumber).
          for (let i = 0; i < comp.inputs.length; i++) {
            const wireId = comp.inputWires[i];
            if (wireId !== null && wireId !== undefined) {
              const wire = wrs.find(w => w.id === wireId);
              if (wire) {
                const src = compsCopy.find(c => c.id === wire.from);
                if (src) comp.inputs[i] = src.outputs[wire.fromIdx];
                else comp.inputs[i] = false;
              } else {
                comp.inputs[i] = false;
              }
            } else {
              comp.inputs[i] = false;
            }
          }
          continue;
        }
        // Logic gates (NOT/AND/OR/dll).
        // ATURAN ABSOLUT: input tanpa wire = false. Gak ada sumber = gak ada arus.
        for (let i = 0; i < comp.inputs.length; i++) {
          const wireId = comp.inputWires[i];
          if (wireId !== null && wireId !== undefined) {
            const wire = wrs.find(w => w.id === wireId);
            if (wire) {
              const src = compsCopy.find(c => c.id === wire.from);
              if (src) comp.inputs[i] = src.outputs[wire.fromIdx];
              else comp.inputs[i] = false;
            } else {
              comp.inputs[i] = false;
            }
          } else {
            comp.inputs[i] = false;
          }
        }
        const newVal = computeGate(comp.type, comp.inputs);
        if (comp.outputs[0] !== newVal) {
          comp.outputs[0] = newVal;
          changed = true;
        }
      }
    }
    // Wire value = output dari source comp. Kalau source udah gak ada (comp dihapus), value = false.
    const newWires = wrs.map(w => {
      const src = compsCopy.find(c => c.id === w.from);
      return { ...w, value: src ? src.outputs[w.fromIdx] : false };
    });
    return { comps: compsCopy, wrs: newWires };
  }, []);

  const getNodePos = useCallback((comp, isInput, idx) => {
    const facing = comp.facing || 0; // 0=right, 1=down, 2=left, 3=up

    // Helper: posisi port untuk facing=right (default), lalu rotate sesuai facing
    const rightPos = () => {
      if (comp.type === 'INPUT' || comp.type === 'OUTPUT') {
        if (isInput) {
          const spacing = comp.height / (comp.inputs.length + 1);
          return { x: comp.x, y: comp.y + spacing * (idx + 1) };
        } else {
          const spacing = comp.height / (comp.outputs.length + 1);
          return { x: comp.x + comp.width, y: comp.y + spacing * (idx + 1) };
        }
      }
      // Logic gate
      if (isInput) {
        if (comp.type === 'not') {
          return { x: comp.x, y: comp.y + 38 };
        }
        return { x: comp.x, y: comp.y + (idx === 0 ? 29.6 : 46.4) };
      } else {
        return { x: comp.x + comp.width, y: comp.y + 38 };
      }
    };

    // Facing=0 (right): default
    if (facing === 0) return rightPos();

    // For other facings, compute default position then rotate around component center
    const pos = rightPos();
    const cx = comp.x + comp.width / 2;
    const cy = comp.y + comp.height / 2;
    const dx = pos.x - cx;
    const dy = pos.y - cy;

    // facing 1=down (90° CW), 2=left (180°), 3=up (270° CW)
    // Rotation: x' = dx*cos - dy*sin, y' = dx*sin + dy*cos
    const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    const a = angles[facing];
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    return {
      x: cx + dx * cosA - dy * sinA,
      y: cy + dx * sinA + dy * cosA,
    };
  }, []);

  const hitTest = useCallback((mx, my, comps) => {
    for (let i = comps.length - 1; i >= 0; i--) {
      const c = comps[i];
      // Drag handle bar di atas INPUT (Switch) — cek SEBELUM body supaya handle menang
      // atas body hit. Handle area: top 12px dari comp body.
      if (c.type === 'INPUT' && mx >= c.x && mx <= c.x + c.width && my >= c.y && my <= c.y + 12) {
        return { kind: 'drag-handle', comp: c };
      }
      if (mx >= c.x && mx <= c.x + c.width && my >= c.y && my <= c.y + c.height) {
        return { kind: 'body', comp: c };
      }
      for (let j = 0; j < c.inputs.length; j++) {
        const p = getNodePos(c, true, j);
        if (Math.hypot(mx - p.x, my - p.y) < 8) return { kind: 'input', comp: c, idx: j, x: p.x, y: p.y };
      }
      for (let j = 0; j < c.outputs.length; j++) {
        const p = getNodePos(c, false, j);
        if (Math.hypot(mx - p.x, my - p.y) < 8) return { kind: 'output', comp: c, idx: j, x: p.x, y: p.y };
      }
    }
    return null;
  }, [getNodePos]);

  // Zone-based hit test untuk Connect Wire mode.
  // User request: area sentuh komponen dibagi jadi zone per port:
  //   - 2 inputs + 1 output (AND/OR/NAND/NOR/XOR/XNOR): 3 zone
  //       right half = output, left-top = input1, left-bottom = input2
  //   - 1 input + 1 output (NOT): 2 zone — left = input, right = output
  //   - 1 input only (LED): 1 zone (whole = input)
  //   - 1 output only (Switch): 1 zone (whole = output)
  // Dipakai di onMouseDown & onTouchStart saat modeRef.current === 'connect'.
  const hitTestZone = useCallback((mx, my, comp) => {
    const numIn = comp.inputs.length;
    const numOut = comp.outputs.length;
    const isRight = mx > comp.x + comp.width / 2;
    if (numIn === 2 && numOut === 1) {
      if (isRight) return { kind: 'output', idx: 0 };
      const isTop = my < comp.y + comp.height / 2;
      return { kind: 'input', idx: isTop ? 0 : 1 };
    }
    if (numIn === 1 && numOut === 1) {
      return isRight ? { kind: 'output', idx: 0 } : { kind: 'input', idx: 0 };
    }
    if (numIn === 1 && numOut === 0) return { kind: 'input', idx: 0 };
    if (numIn === 0 && numOut === 1) return { kind: 'output', idx: 0 };
    return null;
  }, []);

  // Cycle detection: BFS dari dst, kalau nyampe src = cycle. Dipakai sebelum
  // create wire supaya gak bikin infinite loop pas simulate. Dipindah ke sini
  // (sebelum completeWire) karena completeWire nge-reference dia di deps array —
  // kalo dideklarasi setelahnya, ReferenceError TDZ bikin blank page.
  const wouldCreateCycle = useCallback((fromId, toId, comps, wrs) => {
    const visited = new Set();
    const queue = [toId];
    while (queue.length) {
      const curr = queue.shift();
      if (curr === fromId) return true;
      if (visited.has(curr)) continue;
      visited.add(curr);
      const comp = comps.find(c => c.id === curr);
      if (comp) {
        for (const wireId of comp.outputWires.flat()) {
          const wire = wrs.find(w => w.id === wireId);
          if (wire) queue.push(wire.to);
        }
      }
    }
    return false;
  }, []);

  // Helper: complete a wire from (fromComp, fromIdx) to (dstComp, dstIdx).
  // Shared antara Build mode (port hit) dan Connect mode (zone hit) supaya logic
  // wire-removal, cycle-detection, color-generation, dan simulate konsisten.
  // Mutates comps/wrs arrays in-place, lalu setState.
  const completeWire = useCallback((fromComp, fromIdx, dst, dstIdx) => {
    const comps = [...stateRef.current.components];
    const wrs = [...stateRef.current.wires];
    const dstComp = comps.find(c => c.id === dst.id);
    if (!dstComp) return;
    // Remove existing wire on this input (1 input = 1 source rule).
    const existing = wrs.find(w => w.to === dstComp.id && w.toIdx === dstIdx);
    if (existing) {
      const idx = wrs.findIndex(w => w.id === existing.id);
      if (idx !== -1) {
        const src2 = comps.find(c => c.id === existing.from);
        if (src2) src2.outputWires[existing.fromIdx] = src2.outputWires[existing.fromIdx].filter(id => id !== existing.id);
        dstComp.inputWires[dstIdx] = null;
        wrs.splice(idx, 1);
      }
    }
    if (wouldCreateCycle(fromComp.id, dstComp.id, comps, wrs)) {
      setStatus('Cycle detected — connection rejected');
      stateRef.current.wiring = null;
      return;
    }
    // Wire color: ke-1 = null (hijau default), ke-2+ = random HSL (hindari duplikat hue).
    const isFirstWire = wrs.length === 0;
    const wireColor = isFirstWire ? null : (() => {
      const existingHues = wrs.filter(w => w.color).map(w => w.color.h);
      return generateWireColor(existingHues);
    })();
    const newWire = {
      id: stateRef.current.nextId,
      from: fromComp.id, fromIdx,
      to: dstComp.id, toIdx: dstIdx,
      value: false,
      color: wireColor,
      userColor: null,
    };
    wrs.push(newWire);
    dstComp.inputWires[dstIdx] = newWire.id;
    const src = comps.find(c => c.id === fromComp.id);
    if (src) src.outputWires[fromIdx].push(newWire.id);
    setNextId(prev => prev + 1);
    const { comps: newComps, wrs: newWrs } = simulate(comps, wrs);
    setComponents(newComps);
    setWires(newWrs);
    setStatus('Wire connected');
    stateRef.current.wiring = null;
  }, [wouldCreateCycle, simulate]);

  // ── Delete helpers (dipakai oleh Delete Mode & context menu) ──
  // Delete a single wire + cleanup references on src/dst comps. Lalu simulate ulang
  // supaya downstream components re-evaluate (anti "ghost current").
  const deleteWire = useCallback((wireId) => {
    let wrs = [...stateRef.current.wires];
    let comps = [...stateRef.current.components];
    const wire = wrs.find(w => w.id === wireId);
    if (!wire) return;
    wrs = wrs.filter(w => {
      if (w.id === wireId) {
        // Cleanup src outputWires
        const src = comps.find(c => c.id === w.from);
        if (src) src.outputWires[w.fromIdx] = src.outputWires[w.fromIdx].filter(id => id !== wireId);
        // Cleanup dst inputWires
        const dst = comps.find(c => c.id === w.to);
        if (dst) dst.inputWires[w.toIdx] = null;
        return false;
      }
      return true;
    });
    const { comps: reComps, wrs: reWrs } = simulate(comps, wrs);
    setWires(reWrs);
    setComponents(reComps);
    setStatus('Wire deleted');
  }, [simulate]);

  // Delete a component + all wires connected to it. Cleanup references on neighbor comps.
  const deleteComponent = useCallback((compId) => {
    let wrs = [...stateRef.current.wires];
    let comps = [...stateRef.current.components];
    const comp = comps.find(c => c.id === compId);
    if (!comp) return;
    wrs = wrs.filter(w => {
      if (w.from === compId || w.to === compId) {
        if (w.to === compId) {
          const src = comps.find(c => c.id === w.from);
          if (src) src.outputWires[w.fromIdx] = src.outputWires[w.fromIdx].filter(id => id !== w.id);
        }
        if (w.from === compId) {
          const dst = comps.find(c => c.id === w.to);
          if (dst) dst.inputWires[w.toIdx] = null;
        }
        return false;
      }
      return true;
    });
    comps = comps.filter(c => c.id !== compId);
    if (selectedId === compId) setSelectedId(null);
    const { comps: reComps, wrs: reWrs } = simulate(comps, wrs);
    setComponents(reComps);
    setWires(reWrs);
    setStatus('Component deleted');
  }, [simulate, selectedId]);

  // Hit test wire: cek apakah titik (mx,my) dekat dengan segmen wire.
  // Wire path = orthogonal (HVH atau VHV). Cek jarak titik ke segmen-segmen wire.
  // Threshold: 8px (sama dengan port hit radius).
  const hitTestWire = useCallback((mx, my, wrs, comps) => {
    for (let i = wrs.length - 1; i >= 0; i--) {
      const wire = wrs[i];
      const src = comps.find(c => c.id === wire.from);
      const dst = comps.find(c => c.id === wire.to);
      if (!src || !dst) continue;
      const p1 = getNodePos(src, false, wire.fromIdx);
      const p2 = getNodePos(dst, true, wire.toIdx);
      const route = pickOrthogonalRoute(p1, p2, comps, wire.from, wire.to);
      // Bangun list of segments berdasarkan route type.
      let segments;
      if (route.type === 'HVH') {
        const midX = route.mid;
        segments = [
          { x1: p1.x, y1: p1.y, x2: midX, y2: p1.y },
          { x1: midX, y1: p1.y, x2: midX, y2: p2.y },
          { x1: midX, y1: p2.y, x2: p2.x, y2: p2.y },
        ];
      } else {
        const midY = route.mid;
        segments = [
          { x1: p1.x, y1: p1.y, x2: p1.x, y2: midY },
          { x1: p1.x, y1: midY, x2: p2.x, y2: midY },
          { x1: p2.x, y1: midY, x2: p2.x, y2: p2.y },
        ];
      }
      for (const seg of segments) {
        const d = distToSegment(mx, my, seg.x1, seg.y1, seg.x2, seg.y2);
        if (d < 8) return { kind: 'wire', wire, p1, p2 };
      }
    }
    return null;
  }, [getNodePos]);

  // ── Drawing ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    let dashOffset = 0;

    const draw = () => {
      dashOffset = (dashOffset + 0.4) % 20; // marching ants animation speed
      const { components: comps, wires: wrs, wiring, hoverNode, hoverZone, selectedId: selId, view, rotAnim: liveRotAnim } = stateRef.current;

      // ── Rotation animation: compute position overrides ──
      // Jika animasi rotasi aktif, interpolasi posisi komponen dari old→new
      // pakai smooth easing. Override dipakai saat draw komponen & wires.
      let rotAnimOverrides = null; // Map<compId, {x, y, facing}> or null
      if (liveRotAnim) {
        const now = performance.now();
        let t = (now - liveRotAnim.startTime) / liveRotAnim.duration;
        if (t >= 1) {
          // Animasi selesai — clear state
          t = 1;
          setRotAnim(null); // akan di-clear di render berikutnya
        } else {
          // Smooth easing: ease-in-out cubic
          t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }
        // Interpolasi tiap komponen: rotasi smooth dari old pos ke new pos around pivot
        const pivot = liveRotAnim.pivot;
        const angleNow = liveRotAnim.angleDelta * t; // partial rotation angle
        const cosNow = Math.cos(angleNow);
        const sinNow = Math.sin(angleNow);
        rotAnimOverrides = {};
        for (const oldC of liveRotAnim.oldComps) {
          // Old center position
          const comp = comps.find(c => c.id === oldC.id);
          if (!comp) continue;
          const oldCx = oldC.x + comp.width / 2;
          const oldCy = oldC.y + comp.height / 2;
          // Rotate old center around pivot by partial angle
          const dx = oldCx - pivot.x;
          const dy = oldCy - pivot.y;
          const interpCx = pivot.x + dx * cosNow - dy * sinNow;
          const interpCy = pivot.y + dx * sinNow + dy * cosNow;
          // Interpolate facing: snap ke target facing saat t > 0.5, else keep old
          const newC = liveRotAnim.newComps.find(nc => nc.id === oldC.id);
          const interpFacing = t >= 0.5 ? (newC ? newC.facing : oldC.facing) : oldC.facing;
          rotAnimOverrides[oldC.id] = {
            x: interpCx - comp.width / 2,
            y: interpCy - comp.height / 2,
            facing: interpFacing,
          };
        }
      }
      // Blueprint background: deep blue paper + white grid lines (ala gambar teknik).
      // Bikin canvas gak kosong & kasih sense of scale pas pan/zoom.
      const bgGrad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
      );
      bgGrad.addColorStop(0, '#0f2847');
      bgGrad.addColorStop(1, '#091628');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines (blueprint style: minor 20u + major 100u).
      // Minor: subtle white lines setiap 20 world units.
      // Major: brighter white lines setiap 100 world units — reference scale.
      // Adaptive: skip minor kalau zoom terlalu kecil (terlalu padat di screen).
      const MINOR = 20;
      const MAJOR = 100;
      const screenMinor = MINOR * view.scale;
      const screenMajor = MAJOR * view.scale;

      if (screenMinor >= 6) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const offMinX = ((view.x % screenMinor) + screenMinor) % screenMinor;
        const offMinY = ((view.y % screenMinor) + screenMinor) % screenMinor;
        for (let x = offMinX; x < canvas.width; x += screenMinor) {
          ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
        }
        for (let y = offMinY; y < canvas.height; y += screenMinor) {
          ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
      }

      if (screenMajor >= 20) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const offMajX = ((view.x % screenMajor) + screenMajor) % screenMajor;
        const offMajY = ((view.y % screenMajor) + screenMajor) % screenMajor;
        for (let x = offMajX; x < canvas.width; x += screenMajor) {
          ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
        }
        for (let y = offMajY; y < canvas.height; y += screenMajor) {
          ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
      }

      // Apply viewport transform: SEMUA world-space drawing (wires, components, hover)
      // di-translate & di-scale sesuai view.
      ctx.save();
      ctx.translate(view.x, view.y);
      ctx.scale(view.scale, view.scale);

      // Wires
      for (const wire of wrs) {
        let src = comps.find(c => c.id === wire.from);
        let dst = comps.find(c => c.id === wire.to);
        if (!src || !dst) continue;
        // Apply rotation animation override untuk wire endpoints
        if (rotAnimOverrides) {
          const srcOvr = rotAnimOverrides[src.id];
          if (srcOvr) src = { ...src, x: srcOvr.x, y: srcOvr.y, facing: srcOvr.facing };
          const dstOvr = rotAnimOverrides[dst.id];
          if (dstOvr) dst = { ...dst, x: dstOvr.x, y: dstOvr.y, facing: dstOvr.facing };
        }
        const p1 = getNodePos(src, false, wire.fromIdx);
        const p2 = getNodePos(dst, true, wire.toIdx);
        // Smart routing: STRICT — kabel gak boleh menempel/nabrak kotak komponen apapun.
        // Blocked box = full body + GAP_MARGIN (12px). src & dst di-exempt (port endpoint
        // ada di edge mereka). Routing dihitung setiap frame → auto re-route saat comp digeser.
        const route = pickOrthogonalRoute(p1, p2, comps, wire.from, wire.to);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        drawSmartOrthogonalPath(ctx, p1, p2, route, 8);
        // Wire color system:
        // - Wire ke-1 (color=null, userColor=null): hijau default (gak boleh diubah).
        // - Wire ke-2+ (color={h,s}): random HSL color. OFF=redup (L=30%), ON=terang (L=65%).
        // - userColor override: parse hex → HSL, OFF=redup, ON=terang.
        const wc = getWireColors(wire);
        if (wire.value) {
          ctx.strokeStyle = wc.on;
          ctx.lineWidth = 3;
          ctx.globalAlpha = 1;
        } else {
          ctx.strokeStyle = wc.off;
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 1;
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (wire.value) {
          const t = (Date.now() % 1200) / 1200;
          const { x: px, y: py } = pointOnSmartOrthogonal(p1, p2, route, t);
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }
      }

      // Wiring in progress
      if (wiring) {
        const p1 = getNodePos(wiring.fromComp, false, wiring.fromIdx);
        const p2 = { x: wiring.mx, y: wiring.my };
        // Wiring preview juga pakai smart routing biar user preview rute actual yang akan dipilih.
        // srcId = wiring.fromComp.id, dstId = null (mouse pos gak punya comp).
        const route = pickOrthogonalRoute(p1, p2, comps, wiring.fromComp.id, null);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        drawSmartOrthogonalPath(ctx, p1, p2, route, 8);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Components
      for (const origComp of comps) {
        // ── Apply rotation animation override ──
        // Jika animasi rotasi aktif, pakai posisi interpolasi instead of actual
        const animOvr = rotAnimOverrides ? rotAnimOverrides[origComp.id] : null;
        const comp = animOvr
          ? { ...origComp, x: animOvr.x, y: animOvr.y, facing: animOvr.facing }
          : origComp;

        const def = GATE_MAP[comp.type] || IO_DEFS[comp.type];
        // comp.userColor = override warna komponen (paint mode). null = pakai def.color default.
        const compColor = comp.userColor || def.color;
        const isSel = selId === comp.id;
        // OUTPUT gak punya outputs[] (array kosong) — pakai inputs[0] sebagai indikator nyala
        const isOn = comp.type === 'OUTPUT' ? !!comp.inputs[0] : comp.outputs[0];

        // Glow
        if (isSel) {
          ctx.shadowColor = compColor;
          ctx.shadowBlur = 14;
        }

        // Body background
        ctx.fillStyle = '#1e293b';
        roundRect(ctx, comp.x, comp.y, comp.width, comp.height, 8);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = isSel ? compColor : (isOn ? compColor : '#334155');
        ctx.lineWidth = isSel ? 2 : (isOn ? 1.5 : 1);
        roundRect(ctx, comp.x, comp.y, comp.width, comp.height, 8);
        ctx.stroke();

        // ── Gate body (NOT/AND/NAND/OR/NOR/XOR/XNOR) ──
        if (comp.type !== 'INPUT' && comp.type !== 'OUTPUT') {
          const facing = comp.facing || 0; // 0=right, 1=down, 2=left, 3=up
          const labelNum = comp.typeNum || 1;
          const labelText = def.label + ' ' + labelNum;

          // ── Label & Header bar — facing-aware ──
          // right/left: text horizontal di atas (header bar)
          // up/down: text vertikal di kiri (header bar vertikal)
          ctx.fillStyle = compColor;
          ctx.font = 'bold 9px "Orbitron", monospace';

          if (facing === 0 || facing === 2) {
            // Horizontal header bar (top)
            ctx.fillStyle = compColor + '18';
            roundRect(ctx, comp.x + 1, comp.y + 1, comp.width - 2, 14, [7, 7, 0, 0]);
            ctx.fill();
            ctx.fillStyle = compColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, comp.x + comp.width / 2, comp.y + 8);
          } else {
            // Vertical header bar (left side) — untuk facing up/down
            ctx.fillStyle = compColor + '18';
            roundRect(ctx, comp.x + 1, comp.y + 1, 14, comp.height - 2, [7, 0, 0, 7]);
            ctx.fill();
            ctx.fillStyle = compColor;
            // Draw text vertically: each character stacked top-to-bottom
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const chars = labelText.split('');
            const charSpacing = 9;
            const startY = comp.y + comp.height / 2 - (chars.length - 1) * charSpacing / 2;
            for (let ci = 0; ci < chars.length; ci++) {
              ctx.fillText(chars[ci], comp.x + 8, startY + ci * charSpacing);
            }
          }

          // ── Gate body shape — rotate sesuai facing ──
          ctx.save();
          const GATE_SCALE = 1.2;
          const gateDrawW = getGateDrawWidth(comp.type) * GATE_SCALE;
          const gateTranslateX = (comp.width - gateDrawW) / 2;

          // Compute rotation around component center
          const compCx = comp.x + comp.width / 2;
          const compCy = comp.y + comp.height / 2;

          // Default position (facing=right): translate to gate local origin
          // Gate center offset from comp center for facing=right
          const gateLocalX = gateTranslateX - comp.width / 2 + gateDrawW / 2;  // offset from comp center
          const gateLocalY = 20 - comp.height / 2 + 15 * GATE_SCALE / GATE_SCALE; // approx center

          // Apply rotation around component center
          const facingAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
          const facingAngle = facingAngles[facing];

          ctx.translate(compCx, compCy);
          ctx.rotate(facingAngle);
          ctx.translate(-compCx, -compCy);

          // Now draw at facing=right position (rotation handles the rest)
          ctx.translate(comp.x + gateTranslateX, comp.y + 20);
          ctx.scale(GATE_SCALE, GATE_SCALE);
          drawGateShape(ctx, comp.type, compColor, isOn, comp.inputs);
          ctx.restore();

          // ── Global input/output wires: PORT → gate body ──
          // For rotated gates, connect port positions to the rotated gate body edges
          const wireColor = (v) => v ? compColor : '#475569';
          ctx.lineWidth = 2.2 * GATE_SCALE;
          ctx.lineCap = 'round';

          // Input wires: from port to gate internal wire start
          for (let i = 0; i < comp.inputs.length; i++) {
            const portPos = getNodePos(comp, true, i);
            // Gate internal wire start for this input (in local space before rotation)
            const gateInputY = comp.type === 'not' ? 15 : (i === 0 ? 8 : 21.4);
            // Compute gate internal wire start position (rotated)
            const gateStartLocalX = comp.x + gateTranslateX + 6 * GATE_SCALE;
            const gateStartLocalY = comp.y + 20 + gateInputY * GATE_SCALE;
            // Rotate around comp center
            const gsDx = gateStartLocalX - compCx;
            const gsDy = gateStartLocalY - compCy;
            const gsRotX = compCx + gsDx * Math.cos(facingAngle) - gsDy * Math.sin(facingAngle);
            const gsRotY = compCy + gsDx * Math.sin(facingAngle) + gsDy * Math.cos(facingAngle);

            ctx.beginPath();
            ctx.strokeStyle = wireColor(comp.inputs[i]);
            ctx.moveTo(portPos.x, portPos.y);
            ctx.lineTo(gsRotX, gsRotY);
            ctx.stroke();
          }
          // Output wire: from gate internal wire end to port
          {
            const outPortPos = getNodePos(comp, false, 0);
            // Gate internal wire end (in local space before rotation)
            const gateEndLocalX = comp.x + gateTranslateX + gateDrawW;
            const gateEndLocalY = comp.y + 20 + 15 * GATE_SCALE;
            const geDx = gateEndLocalX - compCx;
            const geDy = gateEndLocalY - compCy;
            const geRotX = compCx + geDx * Math.cos(facingAngle) - geDy * Math.sin(facingAngle);
            const geRotY = compCy + geDx * Math.sin(facingAngle) + geDy * Math.cos(facingAngle);

            ctx.beginPath();
            ctx.strokeStyle = wireColor(comp.outputs[0]);
            ctx.moveTo(geRotX, geRotY);
            ctx.lineTo(outPortPos.x, outPortPos.y);
            ctx.stroke();
          }
        }

        // ── Switch (INPUT) ──
        // Komponen Switch punya DRAG HANDLE di atas (14px) supaya bisa dipindah
        // tanpa toggle. Klik handle = drag; klik body bawah = toggle ON/OFF.
        // User request: switch & LED harus punya nomor urut (Switch 1, Switch 2, ...).
        // User feedback: 'tulisan switch kekecilan susah dibaca, digedein dikit'.
        // Fix: handleH 12→14, font 7px→9px (lebih readable tapi gak nimpa toggle).
        if (comp.type === 'INPUT') {
          const handleH = 14;
          // Drag handle bar (top, with label "Switch N")
          ctx.fillStyle = '#334155';
          roundRect(ctx, comp.x + 1, comp.y + 1, comp.width - 2, handleH, [7, 7, 0, 0]);
          ctx.fill();
          // Label "Switch N" di handle bar (ganti grip dots — lebih informatif).
          // Warna label pakai compColor (override paint mode).
          ctx.fillStyle = compColor;
          ctx.font = 'bold 9px "Orbitron", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Switch ' + (comp.typeNum || 1), comp.x + comp.width / 2, comp.y + handleH / 2 + 1);
          // Toggle body (shifted down to make room for handle bar)
          // ON state pakai compColor (override paint mode).
          const swX = comp.x + comp.width / 2;
          const swY = comp.y + handleH + (comp.height - handleH) / 2 - 2;
          ctx.fillStyle = comp.outputs[0] ? compColor : '#475569';
          roundRect(ctx, swX - 18, swY - 8, 36, 16, 8);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(comp.outputs[0] ? swX + 10 : swX - 10, swY, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.fillStyle = comp.outputs[0] ? compColor : '#64748b';
          ctx.font = 'bold 8px "Orbitron", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(comp.outputs[0] ? 'ON' : 'OFF', swX, swY + 22);
        }

        // ── LED (OUTPUT) ──
        // User request: LED juga harus punya nomor urut (LED 1, LED 2, ...).
        // User feedback: 'tulisan LED tidak dapat dibaca karena menabrak'.
        // Fix: tinggiin body 50→60, geser lingkaran ke bawah (offset -4 → +2) supaya
        // gap label-lingkaran cukup. Label di y+8 (spans y+4..y+12), lingkaran di
        // y+32 (spans y+21..y+43) → gap 9px, aman gak nabrak.
        if (comp.type === 'OUTPUT') {
          // Label "LED N" di atas body (sebelum gambar circle).
          // User feedback: 'tulisan kekecilan susah dibaca' — font 8px→9px biar match Switch.
          // Warna label pakai compColor (override paint mode).
          ctx.fillStyle = compColor;
          ctx.font = 'bold 9px "Orbitron", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('LED ' + (comp.typeNum || 1), comp.x + comp.width / 2, comp.y + 8);
          const ledX = comp.x + comp.width / 2;
          const ledY = comp.y + comp.height / 2 + 2;
          const lit = !!comp.inputs[0];
          if (lit) {
            ctx.shadowColor = compColor;
            ctx.shadowBlur = 18;
          }
          ctx.beginPath();
          ctx.arc(ledX, ledY, 11, 0, Math.PI * 2);
          ctx.fillStyle = lit ? compColor : '#1e293b';
          ctx.fill();
          ctx.shadowBlur = 0;
          // Border saat lit: lighter version of compColor (pakai compColor + alpha overlay feel).
          // Untuk simplicity, pakai compColor langsung saat lit.
          ctx.strokeStyle = lit ? compColor : '#475569';
          ctx.lineWidth = 2;
          ctx.stroke();
          if (lit) {
            ctx.beginPath();
            ctx.arc(ledX - 3, ledY - 3, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fill();
          }
          ctx.fillStyle = lit ? compColor : '#64748b';
          ctx.font = 'bold 8px "Orbitron", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(lit ? 'ON' : 'OFF', ledX, ledY + 22);
        }

        // Input nodes
        for (let i = 0; i < comp.inputs.length; i++) {
          const p = getNodePos(comp, true, i);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          const hasWire = comp.inputWires[i] !== null;
          ctx.fillStyle = comp.inputs[i] ? '#4ade80' : (hasWire ? '#94a3b8' : '#475569');
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Output nodes
        for (let i = 0; i < comp.outputs.length; i++) {
          const p = getNodePos(comp, false, i);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = comp.outputs[i] ? '#4ade80' : '#94a3b8';
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // ── Selection overlay: semi-transparent 50% tint over selected component body ──
        // Move = teal (#0ea5e9), Rotate = amber (#f59e0b), Clone = purple (#c084fc)
        const cSel = stateRef.current.cloneSelectedIds;
        const mSel = stateRef.current.moveSelectedIds;
        const rSel = stateRef.current.rotateSelectedIds;
        let overlayColor = null;
        if (mSel && mSel.includes(comp.id)) overlayColor = 'rgba(14, 165, 233, 0.50)';      // move = teal
        else if (rSel && rSel.includes(comp.id)) overlayColor = 'rgba(245, 158, 11, 0.50)';   // rotate = amber
        else if (cSel && cSel.includes(comp.id)) overlayColor = 'rgba(192, 132, 252, 0.50)';  // clone = purple
        if (overlayColor) {
          ctx.fillStyle = overlayColor;
          roundRect(ctx, comp.x, comp.y, comp.width, comp.height, 8);
          ctx.fill();
        }
      }

      // ── Rotation animation ghost trail ──
      // Saat animasi rotasi aktif, gambar ghost (semi-transparent) di posisi LAMA
      // komponen + arc dari old ke new position → user lihat jejak pergerakan.
      if (rotAnimOverrides && liveRotAnim) {
        const animNow = performance.now();
        let animT = (animNow - liveRotAnim.startTime) / liveRotAnim.duration;
        if (animT > 1) animT = 1;
        // Ease-in-out
        const easedT = animT < 0.5 ? 4 * animT * animT * animT : 1 - Math.pow(-2 * animT + 2, 3) / 2;
        // Ghost opacity fades out saat animasi mendekati selesai
        const ghostAlpha = Math.max(0, 0.3 * (1 - easedT));

        if (ghostAlpha > 0.01) {
          ctx.globalAlpha = ghostAlpha;
          for (const oldC of liveRotAnim.oldComps) {
            const comp = comps.find(c => c.id === oldC.id);
            if (!comp) continue;
            const def = GATE_MAP[comp.type] || IO_DEFS[comp.type];
            const compColor = comp.userColor || def.color;
            // Ghost body di posisi lama
            ctx.fillStyle = '#1e293b';
            roundRect(ctx, oldC.x, oldC.y, comp.width, comp.height, 8);
            ctx.fill();
            ctx.strokeStyle = compColor;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            roundRect(ctx, oldC.x, oldC.y, comp.width, comp.height, 8);
            ctx.stroke();
            ctx.setLineDash([]);
            // Label kecil di ghost
            if (comp.type !== 'INPUT' && comp.type !== 'OUTPUT') {
              ctx.fillStyle = compColor;
              ctx.font = 'bold 8px "Orbitron", monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(def.label + ' ' + (comp.typeNum || 1), oldC.x + comp.width / 2, oldC.y + 8);
            }
          }
          // Arc dari pivot ke midpoint komponen (visual rotation path indicator)
          const pivot = liveRotAnim.pivot;
          if (liveRotAnim.oldComps.length > 0 && liveRotAnim.angleDelta) {
            ctx.globalAlpha = ghostAlpha * 0.8;
            ctx.strokeStyle = '#f59e0b'; // amber
            ctx.lineWidth = 1.5 / view.scale; // compensate scale supaya line width konsisten
            ctx.setLineDash([3 / view.scale, 3 / view.scale]);
            // Draw arc around pivot showing rotation direction (world coords)
            const avgDist = liveRotAnim.oldComps.reduce((sum, oc) => {
              const comp = comps.find(c => c.id === oc.id);
              if (!comp) return sum;
              const cx = oc.x + comp.width / 2;
              const cy = oc.y + comp.height / 2;
              return sum + Math.sqrt((cx - pivot.x) ** 2 + (cy - pivot.y) ** 2);
            }, 0) / liveRotAnim.oldComps.length;
            if (avgDist > 5) {
              const startAngle = 0;
              const endAngle = liveRotAnim.angleDelta * easedT;
              ctx.beginPath();
              ctx.arc(pivot.x, pivot.y, avgDist, startAngle, endAngle, liveRotAnim.angleDelta < 0);
              ctx.stroke();
            }
            ctx.setLineDash([]);
          }
          ctx.globalAlpha = 1;
        }
      }

      // Hover node
      if (hoverNode) {
        ctx.beginPath();
        ctx.arc(hoverNode.x, hoverNode.y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // ── Connect Wire mode: zona sentuh overlay ──
      // User request: 'connect wirenya harusnya ada area dimana user bisa pencet di
      // area mana yang jadi port input atau output'. Tanpa visual indicator, zona
      // invisible → user harus nebak area mana = port mana. Fix: gambar overlay zona
      // di setiap komponen saat connect mode aktif.
      //
      // Zona division (match hitTestZone):
      //   - 2 inputs + 1 output (AND/OR/NAND/NOR/XOR/XNOR):
      //       right half  = OUTPUT (hijau)
      //       left-top    = INPUT 1 (biru)
      //       left-bottom = INPUT 2 (ungu)
      //   - 1 input + 1 output (NOT): 2 zona — kiri=INPUT, kanan=OUTPUT
      //   - 1 input only (LED): 1 zona (whole = INPUT)
      //   - 1 output only (Switch): 1 zona (whole = OUTPUT)
      //
      // Warna: tipis (alpha 0.10) default, zona yang di-hover = solid (alpha 0.30 +
      // border). Label OUT/IN1/IN2 di tengah zona supaya jelas.
      if (modeRef.current === 'connect') {
        for (const comp of comps) {
          const numIn = comp.inputs.length;
          const numOut = comp.outputs.length;
          const zones = [];
          if (numIn === 2 && numOut === 1) {
            zones.push({ kind: 'output', idx: 0, x: comp.x + comp.width / 2, y: comp.y, w: comp.width / 2, h: comp.height, label: 'OUT', color: '#4ade80' });
            zones.push({ kind: 'input',  idx: 0, x: comp.x, y: comp.y, w: comp.width / 2, h: comp.height / 2, label: 'IN 1', color: '#60a5fa' });
            zones.push({ kind: 'input',  idx: 1, x: comp.x, y: comp.y + comp.height / 2, w: comp.width / 2, h: comp.height / 2, label: 'IN 2', color: '#a78bfa' });
          } else if (numIn === 1 && numOut === 1) {
            zones.push({ kind: 'output', idx: 0, x: comp.x + comp.width / 2, y: comp.y, w: comp.width / 2, h: comp.height, label: 'OUT', color: '#4ade80' });
            zones.push({ kind: 'input',  idx: 0, x: comp.x, y: comp.y, w: comp.width / 2, h: comp.height, label: 'IN', color: '#60a5fa' });
          } else if (numIn === 1 && numOut === 0) {
            // LED: 1 zona input (whole)
            zones.push({ kind: 'input',  idx: 0, x: comp.x, y: comp.y, w: comp.width, h: comp.height, label: 'IN', color: '#60a5fa' });
          } else if (numIn === 0 && numOut === 1) {
            // Switch: 1 zona output (whole)
            zones.push({ kind: 'output', idx: 0, x: comp.x, y: comp.y, w: comp.width, h: comp.height, label: 'OUT', color: '#4ade80' });
          }
          for (const z of zones) {
            const isHover = hoverZone && hoverZone.compId === comp.id && hoverZone.kind === z.kind && hoverZone.idx === z.idx;
            ctx.fillStyle = z.color + (isHover ? '4D' : '1A');  // 0.30 hover, 0.10 default
            ctx.fillRect(z.x, z.y, z.w, z.h);
            if (isHover) {
              ctx.strokeStyle = z.color;
              ctx.lineWidth = 1.5;
              ctx.strokeRect(z.x + 0.5, z.y + 0.5, z.w - 1, z.h - 1);
            }
            // Label zona (cuma kalau zona cukup gede supaya text muat).
            if (z.w >= 30 && z.h >= 18) {
              ctx.fillStyle = isHover ? '#fff' : z.color + 'CC';
              ctx.font = 'bold 8px "Inter", sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(z.label, z.x + z.w / 2, z.y + z.h / 2);
            }
          }
        }
      }

      // Selesai world-space drawing — restore ke screen space.
      ctx.restore();

      // ── Minimap render ──
      // Render overview semua komponen + viewport rect di canvas kecil pojok kanan atas.
      // Click/drag minimap → pan view ke world point itu (handler di useEffect terpisah).
      // Auto-hide konten kalau komponen < 3 (gak butuh navigasi).
      const mini = minimapRef.current;
      if (mini) {
        const mctx = mini.getContext('2d');
        mctx.clearRect(0, 0, mini.width, mini.height);

        if (comps.length >= 3) {
          // Bounding box semua komponen — pakai dimensi langsung dari component object.
          const compBox = (c) => {
            return { w: c.width || 90, h: c.height || 56 };
          };
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const c of comps) {
            const { w, h } = compBox(c);
            minX = Math.min(minX, c.x);
            minY = Math.min(minY, c.y);
            maxX = Math.max(maxX, c.x + w);
            maxY = Math.max(maxY, c.y + h);
          }
          // Padding 15% supaya content gak nempel pinggiran minimap.
          const pad = 0.15;
          const bw = maxX - minX, bh = maxY - minY;
          minX -= bw * pad; minY -= bh * pad;
          maxX += bw * pad; maxY += bh * pad;
          const fullW = maxX - minX, fullH = maxY - minY;

          // Fit ke minimap canvas (preserve aspect ratio).
          const s = Math.min(mini.width / fullW, mini.height / fullH);
          const offX = (mini.width - fullW * s) / 2;
          const offY = (mini.height - fullH * s) / 2;

          const toMini = (wx, wy) => ({
            x: offX + (wx - minX) * s,
            y: offY + (wy - minY) * s,
          });

          // Simpan transform untuk click/drag handler (miniToView).
          stateRef.current.minimap = { minX, minY, s, offX, offY };

          // Background.
          mctx.fillStyle = 'rgba(9, 22, 40, 0.92)';
          mctx.fillRect(0, 0, mini.width, mini.height);

          // Wires (subtle gray, sesuai value: ON = green, OFF = dark green).
          mctx.lineWidth = 0.8;
          for (const wire of wrs) {
            const src = comps.find(c => c.id === wire.from);
            const dst = comps.find(c => c.id === wire.to);
            if (!src || !dst) continue;
            const sB = compBox(src), dB = compBox(dst);
            const p1 = toMini(src.x + sB.w / 2, src.y + sB.h / 2);
            const p2 = toMini(dst.x + dB.w / 2, dst.y + dB.h / 2);
            const wc = getWireColors(wire);
            mctx.strokeStyle = wire.value ? wc.on : wc.off;
            mctx.beginPath();
            mctx.moveTo(p1.x, p1.y);
            mctx.lineTo(p2.x, p2.y);
            mctx.stroke();
          }

          // Components (dots warna gate, dengan userColor override kalau ada).
          // Dot dibikin lebih gede (2.2 → 4.0) supaya gampang diklik di mobile.
          // Hit radius untuk click detection pakai 6px (lihat minimap interaction handler).
          for (const c of comps) {
            const def = GATE_MAP[c.type] || IO_DEFS[c.type];
            const { w, h } = compBox(c);
            const p = toMini(c.x + w / 2, c.y + h / 2);
            mctx.fillStyle = c.userColor || def.color;
            mctx.beginPath();
            mctx.arc(p.x, p.y, 4.0, 0, Math.PI * 2);
            mctx.fill();
          }

          // Viewport rectangle — area canvas yang sedang keliatan, di world coords.
          const v = stateRef.current.view;
          const wTL = { x: -v.x / v.scale, y: -v.y / v.scale };
          const wBR = { x: (canvas.width - v.x) / v.scale, y: (canvas.height - v.y) / v.scale };
          const m1 = toMini(wTL.x, wTL.y);
          const m2 = toMini(wBR.x, wBR.y);
          mctx.fillStyle = 'rgba(96, 165, 250, 0.12)';
          mctx.fillRect(m1.x, m1.y, m2.x - m1.x, m2.y - m1.y);
          mctx.strokeStyle = '#60a5fa';
          mctx.lineWidth = 1.2;
          mctx.strokeRect(m1.x, m1.y, m2.x - m1.x, m2.y - m1.y);
        } else {
          // Komponen < 3 — minimap gak berguna, tampilin hint aja.
          stateRef.current.minimap = null;
          mctx.fillStyle = 'rgba(9, 22, 40, 0.92)';
          mctx.fillRect(0, 0, mini.width, mini.height);
          mctx.fillStyle = '#475569';
          mctx.font = '10px "Inter", sans-serif';
          mctx.textAlign = 'center';
          mctx.textBaseline = 'middle';
          mctx.fillText('Add 3+ components', mini.width / 2, mini.height / 2);
        }
      }

      // ── Clone selection box (purple) — only during drag, NOT after anchors appear ──
      const cb = stateRef.current.cloneBox;
      const ca = stateRef.current.cloneAnchors;
      if (cb && !ca) {
        const x = Math.min(cb.sx, cb.ex);
        const y = Math.min(cb.sy, cb.ey);
        const w = Math.abs(cb.ex - cb.sx);
        const h = Math.abs(cb.ey - cb.sy);
        ctx.fillStyle = 'rgba(192, 132, 252, 0.15)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
      }

      // ── Clone anchor points (RECOMPUTE tiap frame — pan/zoom safe) ──
      if (ca) {
        // Recompute anchor positions dari current component positions + current view
        const cSelIds = stateRef.current.cloneSelectedIds;
        const cSelComps = comps.filter(c => cSelIds.includes(c.id));
        const liveCAnch = cSelComps.length > 0 ? calcAnchorsFromComponents(cSelComps, view) : null;
        const anchorPts = liveCAnch ? liveCAnch.anchors : ca; // fallback
        const dirs = ['top', 'bottom', 'left', 'right'];
        const arrows = { top: '\u25B2', bottom: '\u25BC', left: '\u25C4', right: '\u25BA' };
        for (const dir of dirs) {
          const pt = anchorPts[dir];
          if (!pt) continue;
          // Circle
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(192, 132, 252, 0.7)';
          ctx.fill();
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Arrow text
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(arrows[dir], pt.x, pt.y);
        }
      }

      // ── Marching ants bounding box around selected clone components ──
      const cSelIds = stateRef.current.cloneSelectedIds;
      if (cSelIds && cSelIds.length > 0 && ca) {
        let minSx = Infinity, minSy = Infinity, maxSx = -Infinity, maxSy = -Infinity;
        for (const comp of comps) {
          if (cSelIds.includes(comp.id)) {
            const sx = comp.x * view.scale + view.x;
            const sy = comp.y * view.scale + view.y;
            const sw = comp.width * view.scale;
            const sh = comp.height * view.scale;
            minSx = Math.min(minSx, sx - 4);
            minSy = Math.min(minSy, sy - 4);
            maxSx = Math.max(maxSx, sx + sw + 4);
            maxSy = Math.max(maxSy, sy + sh + 4);
          }
        }
        if (minSx < Infinity) {
          ctx.fillStyle = 'rgba(192, 132, 252, 0.10)';
          ctx.fillRect(minSx, minSy, maxSx - minSx, maxSy - minSy);
          ctx.setLineDash([6, 4]);
          ctx.lineDashOffset = -dashOffset;
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2;
          ctx.strokeRect(minSx, minSy, maxSx - minSx, maxSy - minSy);
          ctx.setLineDash([]);
          ctx.lineDashOffset = 0;
        }
      }

      // ── Move Area selection box (teal #0ea5e9) — only during drag, NOT after anchors appear ──
      const mBx = stateRef.current.moveBox;
      const mAnch = stateRef.current.moveAnchors;
      if (mBx && !mAnch) {
        const x = Math.min(mBx.sx, mBx.ex);
        const y = Math.min(mBx.sy, mBx.ey);
        const w = Math.abs(mBx.ex - mBx.sx);
        const h = Math.abs(mBx.ey - mBx.sy);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.12)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
      }

      // ── Move Area arrow anchors (RECOMPUTE tiap frame dari selected IDs — pan/zoom safe) ──
      if (mAnch) {
        // Recompute anchor positions dari current component positions + current view
        const mSelIds = stateRef.current.moveSelectedIds;
        const mSelComps = comps.filter(c => mSelIds.includes(c.id));
        const liveMAnch = mSelComps.length > 0 ? calcAnchorsFromComponents(mSelComps, view) : null;
        const anchorPts = liveMAnch ? liveMAnch.anchors : mAnch; // fallback ke stored kalau recompute gagal
        const dirs = stateRef.current.moveActiveDir ? [stateRef.current.moveActiveDir] : ['top', 'bottom', 'left', 'right'];
        for (const dir of dirs) {
          const pt = anchorPts[dir];
          if (!pt) continue;
          // Draw arrow shape (pointing outward)
          ctx.save();
          ctx.translate(pt.x, pt.y);
          // Rotate context based on direction
          let angle = 0;
          if (dir === 'top') angle = -Math.PI / 2;
          else if (dir === 'bottom') angle = Math.PI / 2;
          else if (dir === 'left') angle = Math.PI;
          else angle = 0; // right
          ctx.rotate(angle);
          // Arrow: triangle pointing right with a stem
          ctx.beginPath();
          ctx.moveTo(12, 0);   // tip
          ctx.lineTo(0, -8);   // top of triangle
          ctx.lineTo(0, 8);    // bottom of triangle
          ctx.closePath();
          ctx.fillStyle = '#0ea5e9';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Stem
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-8, 0);
          ctx.strokeStyle = '#0ea5e9';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }
      }

      // ── Marching ants bounding box around selected move components (hide during anchor drag) ──
      const mSelIds = stateRef.current.moveSelectedIds;
      const mActive = stateRef.current.moveActiveDir;
      if (mSelIds && mSelIds.length > 0 && mAnch && !mActive) {
        let minSx = Infinity, minSy = Infinity, maxSx = -Infinity, maxSy = -Infinity;
        for (const comp of comps) {
          if (mSelIds.includes(comp.id)) {
            const sx = comp.x * view.scale + view.x;
            const sy = comp.y * view.scale + view.y;
            const sw = comp.width * view.scale;
            const sh = comp.height * view.scale;
            minSx = Math.min(minSx, sx - 4);
            minSy = Math.min(minSy, sy - 4);
            maxSx = Math.max(maxSx, sx + sw + 4);
            maxSy = Math.max(maxSy, sy + sh + 4);
          }
        }
        if (minSx < Infinity) {
          ctx.fillStyle = 'rgba(14, 165, 233, 0.10)';
          ctx.fillRect(minSx, minSy, maxSx - minSx, maxSy - minSy);
          ctx.setLineDash([6, 4]);
          ctx.lineDashOffset = -dashOffset;
          ctx.strokeStyle = '#0ea5e9';
          ctx.lineWidth = 2;
          ctx.strokeRect(minSx, minSy, maxSx - minSx, maxSy - minSy);
          ctx.setLineDash([]);
          ctx.lineDashOffset = 0;
        }
      }

      // ── Rotate Area selection BOX (amber #f59e0b) — only during drag, NOT after anchors appear ──
      // Select box tetap KOTAK (seperti move/clone), hanya marching ants setelah seleksi yang bulat.
      const rBx = stateRef.current.rotateBox;
      const rAnch = stateRef.current.rotateAnchors;
      if (rBx && !rAnch) {
        const x = Math.min(rBx.sx, rBx.ex);
        const y = Math.min(rBx.sy, rBx.ey);
        const w = Math.abs(rBx.ex - rBx.sx);
        const h = Math.abs(rBx.ey - rBx.sy);
        if (w > 2 || h > 2) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(x, y, w, h);
          ctx.setLineDash([]);
        }
      }

      // ── Rotate Area double-circle anchors (RECOMPUTE tiap frame via MEC — pan/zoom safe) ──
      // Hitung MEC sekali di scope ini, dipakai anchor + marching ants
      let liveRResult = null;
      if (rAnch) {
        // Recompute anchor positions dari current component positions + current view via MEC
        // During rotation animation, use ANIMATED positions (not final) so MEC encompasses drawn components
        const rSelIdsLive = stateRef.current.rotateSelectedIds;
        const rSelCompsRaw = comps.filter(c => rSelIdsLive.includes(c.id));
        const rSelComps = rotAnimOverrides
          ? rSelCompsRaw.map(c => {
              const ovr = rotAnimOverrides[c.id];
              return ovr ? { ...c, x: ovr.x, y: ovr.y, facing: ovr.facing } : c;
            })
          : rSelCompsRaw;
        liveRResult = rSelComps.length > 0 ? calcRotateAnchorsFromMEC(rSelComps, view) : null;
        const anchorPts = liveRResult ? liveRResult.anchors : rAnch; // fallback
        const dirs = ['top', 'bottom', 'left', 'right'];
        for (const dir of dirs) {
          const pt = anchorPts[dir];
          if (!pt) continue;
          // Outer circle
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Inner circle
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // 90° label
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const label = (dir === 'top' || dir === 'left') ? '+90°' : '-90°';
          // Don't draw label inside tiny circle, draw below anchor
          ctx.fillText(label, pt.x, pt.y + 22);
        }
      }

      // ── Marching ants MINIMUM ENCLOSING CIRCLE around selected rotate components ──
      // Pakai MEC yang sudah dihitung di anchor block (liveRResult.mec) supaya konsisten & pan/zoom safe.
      if (rAnch && liveRResult && liveRResult.mec) {
        const mecInfo = liveRResult.mec;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.10)';
        ctx.beginPath();
        ctx.arc(mecInfo.x, mecInfo.y, mecInfo.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = -dashOffset;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
      }

      // ── Marching ants around component/wire being painted (colorPicker open OR pickFromWorkspace active) ──
      const cpInfo = colorPickerRef.current || pickFromWorkspaceRef.current;
      if (cpInfo && cpInfo.targetType === 'comp') {
        const targetComp = comps.find(c => c.id === cpInfo.targetId);
        if (targetComp) {
          const tPos = rotAnimOverrides?.get(targetComp.id) || targetComp;
          // Get bounding box
          const bx = tPos.x, by = tPos.y;
          const bw = targetComp.width || 64, bh = targetComp.height || 64;
          const pad = 6;
          // Use the component's current color for the marching ants
          const def = GATE_MAP[targetComp.type] || IO_DEFS[targetComp.type];
          const borderColor = targetComp.userColor || (def ? def.color : '#f59e0b');
          // Draw animated dashed rectangle
          ctx.setLineDash([8, 5]);
          ctx.lineDashOffset = -dashOffset;
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 3;
          ctx.strokeRect(bx - pad, by - pad, bw + pad * 2, bh + pad * 2);
          ctx.setLineDash([]);
          ctx.lineDashOffset = 0;
        }
      }
      if (cpInfo && cpInfo.targetType === 'wire') {
        // For wires, find the wire and draw marching ants along its path
        const targetWire = wrs.find(w => w.id === cpInfo.targetId);
        if (targetWire) {
          const src = comps.find(c => c.id === targetWire.from);
          const dst = comps.find(c => c.id === targetWire.to);
          if (src && dst) {
            const wireColor = targetWire.userColor || (targetWire.color ? hslToHex(targetWire.color.h, targetWire.color.s, 50) : '#4ade80');
            ctx.setLineDash([8, 5]);
            ctx.lineDashOffset = -dashOffset;
            ctx.strokeStyle = wireColor;
            ctx.lineWidth = 4;
            // Draw a thick dashed line along the wire path (simple: from output to input)
            const fromPos = rotAnimOverrides?.get(src.id) || src;
            const toPos = rotAnimOverrides?.get(dst.id) || dst;
            const p1 = getNodePos({...src, ...fromPos}, false, targetWire.fromIdx);
            const p2 = getNodePos({...dst, ...toPos}, true, targetWire.toIdx);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.lineDashOffset = 0;
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    // getGateDrawWidth — actual draw width per gate type (leftmost = 0 input wire, rightmost = end of output wire)
    // Dipakai supaya gate body CENTER sejati di comp box, bukan left-aligned di area 64 fixed.
    // Konstanta HARUS match drawGateShape: C=5, P=3, wireLen=6, q=25, N=5 → I=q-N=20.
    function getGateDrawWidth(type) {
      const C = 5, P = 3, wireLen = 6;
      const I = 20;        // q - N
      const arcR = I / 2;  // 10
      switch (type) {
        case 'not':   return C + 24 + P * 2 + wireLen;             // 41
        case 'and':   return (C + 12) + arcR + wireLen;            // 33
        case 'nand':  return (C + 10) + arcR + P * 2 + wireLen;    // 37
        case 'or':    return C + 34 + wireLen;                     // 45
        case 'nor':   return C + 31 + P * 2 + wireLen;             // 48
        case 'xor':   return C + 34 + wireLen;                     // 45
        case 'xnor':  return C + 31 + P * 2 + wireLen;             // 48
        default:      return 48;
      }
    }

    // drawGateShape — model di-match dengan GateDiagram.jsx (menu "7 Basic Logic Gates")
    // Coordinate system lokal: origin di kiri-atas area gate, gate di-center vertikal di L.
    // Input wires berwarna sesuai nilai input (color jika true, #475569 jika false).
    // Gate body berwarna sesuai output (color jika true/active, #475569 jika false).
    // Output wire berwarna sesuai output (color jika active, #475569 jika false).
    function drawGateShape(ctx, type, color, active, inputs) {
      const C = 5, N = 5, q = 25, L = 15, I = q - N, P = 3;
      const wireLen = 6;
      const wireColor = (v) => v ? color : '#475569';
      const bodyStroke = active ? color : '#475569';
      const a = inputs?.[0] ?? false;
      const b = inputs?.[1] ?? false;

      ctx.lineWidth = 2.2;  // tebal stroke — match Basic Logic Gates reference (sebelumnya 1.6 terlalu tipis)
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // Input wires (diwarnai sesuai nilai input)
      if (type === 'not') {
        ctx.beginPath();
        ctx.strokeStyle = wireColor(a);
        ctx.moveTo(0, L); ctx.lineTo(C, L);
        ctx.stroke();
      } else {
        // AND/NAND/OR/NOR/XOR/XNOR: 2 input wires
        // XOR/XNOR SPECIAL: input wires STOP AT back curve ')' (x = C-3 = 2), bukan
        // lanjut sampai main body (x = C = 5). Sebelumnya wires nembus back curve
        // → user complaint. Back curve (cubic, control x=C-1=4) at y=N+3 dan y=q-3
        // ada di x ≈ 2.2, jadi wire end di x=2 = tepat menyentuh back curve.
        const isXorType = type === 'xor' || type === 'xnor';
        const inputWireEnd = isXorType ? (C - 3) : C;
        ctx.beginPath();
        ctx.strokeStyle = wireColor(a);
        ctx.moveTo(0, N + 3); ctx.lineTo(inputWireEnd, N + 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = wireColor(b);
        ctx.moveTo(0, q - 3); ctx.lineTo(inputWireEnd, q - 3);
        ctx.stroke();
      }

      ctx.strokeStyle = bodyStroke;
      // Glow effect saat gate aktif — match Basic Logic Gates reference (drop-shadow filter)
      if (active) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
      }
      let outX = C;  // posisi x awal output wire
      switch (type) {
        case 'not': {
          outX = C + 24;
          ctx.beginPath();
          ctx.moveTo(C, N); ctx.lineTo(outX, L); ctx.lineTo(C, q); ctx.closePath();
          ctx.stroke();
          ctx.beginPath(); ctx.arc(outX + P, L, P, 0, Math.PI*2); ctx.stroke();
          outX = outX + P * 2;
          break;
        }
        case 'and': {
          const arcR = I / 2;
          const arcCx = C + 12;
          outX = arcCx + arcR;
          ctx.beginPath();
          ctx.moveTo(C, N); ctx.lineTo(arcCx, N);
          ctx.arc(arcCx, L, arcR, -Math.PI/2, Math.PI/2);
          ctx.lineTo(C, q); ctx.closePath();
          ctx.stroke();
          break;
        }
        case 'nand': {
          const arcR = I / 2;
          const arcCx = C + 10;
          outX = arcCx + arcR;
          ctx.beginPath();
          ctx.moveTo(C, N); ctx.lineTo(arcCx, N);
          ctx.arc(arcCx, L, arcR, -Math.PI/2, Math.PI/2);
          ctx.lineTo(C, q); ctx.closePath();
          ctx.stroke();
          ctx.beginPath(); ctx.arc(outX + P, L, P, 0, Math.PI*2); ctx.stroke();
          outX = outX + P * 2;
          break;
        }
        case 'or': {
          outX = C + 34;
          ctx.beginPath();
          ctx.moveTo(C, N);
          ctx.bezierCurveTo(C+10, N, outX-9, L-8, outX, L);
          ctx.bezierCurveTo(outX-9, L+8, C+10, q, C, q);
          ctx.bezierCurveTo(C+7, L+4, C+7, L-4, C, N);
          ctx.closePath();
          ctx.stroke();
          break;
        }
        case 'nor': {
          outX = C + 31;
          ctx.beginPath();
          ctx.moveTo(C, N);
          ctx.bezierCurveTo(C+10, N, outX-9, L-8, outX, L);
          ctx.bezierCurveTo(outX-9, L+8, C+10, q, C, q);
          ctx.bezierCurveTo(C+7, L+4, C+7, L-4, C, N);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath(); ctx.arc(outX + P, L, P, 0, Math.PI*2); ctx.stroke();
          outX = outX + P * 2;
          break;
        }
        case 'xor': {
          outX = C + 34;
          // Back curve — control points di-shift LEFT (C+1 → C-1) supaya ada GAP
          // kecil antara ')' dan main body. Sebelumnya peak di x≈4.75 (touching
          // main body left edge x=5, gap 0.25px). Sekarang peak di x≈3.25, gap
          // 1.75px = visible. User minta "gap kecil antara ')' dengan yang di
          // depannya".
          ctx.beginPath();
          ctx.moveTo(C - 4, N);
          ctx.bezierCurveTo(C - 1, L - 4, C - 1, L + 4, C - 4, q);
          ctx.stroke();
          // Main body
          ctx.beginPath();
          ctx.moveTo(C, N);
          ctx.bezierCurveTo(C+10, N, outX-9, L-8, outX, L);
          ctx.bezierCurveTo(outX-9, L+8, C+10, q, C, q);
          ctx.bezierCurveTo(C+7, L+4, C+7, L-4, C, N);
          ctx.closePath();
          ctx.stroke();
          break;
        }
        case 'xnor': {
          outX = C + 31;
          // Back curve — same as XOR: control points di-shift LEFT for gap
          ctx.beginPath();
          ctx.moveTo(C - 4, N);
          ctx.bezierCurveTo(C - 1, L - 4, C - 1, L + 4, C - 4, q);
          ctx.stroke();
          // Main body
          ctx.beginPath();
          ctx.moveTo(C, N);
          ctx.bezierCurveTo(C+10, N, outX-9, L-8, outX, L);
          ctx.bezierCurveTo(outX-9, L+8, C+10, q, C, q);
          ctx.bezierCurveTo(C+7, L+4, C+7, L-4, C, N);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath(); ctx.arc(outX + P, L, P, 0, Math.PI*2); ctx.stroke();
          outX = outX + P * 2;
          break;
        }
      }

      // Reset glow sebelum output wire (wire gak pake glow, match GateDiagram.jsx)
      ctx.shadowBlur = 0;

      // Output wire (diwarnai sesuai output)
      ctx.beginPath();
      ctx.strokeStyle = wireColor(active);
      ctx.moveTo(outX, L);
      ctx.lineTo(outX + wireLen, L);
      ctx.stroke();
    }

    function roundRect(ctx, x, y, w, h, r) {
      const rad = typeof r === 'number' ? [r,r,r,r] : r;
      ctx.beginPath();
      ctx.moveTo(x + rad[0], y);
      ctx.lineTo(x + w - rad[1], y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + rad[1]);
      ctx.lineTo(x + w, y + h - rad[2]);
      ctx.quadraticCurveTo(x + w, y + h, x + w - rad[2], y + h);
      ctx.lineTo(x + rad[3], y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - rad[3]);
      ctx.lineTo(x, y + rad[0]);
      ctx.quadraticCurveTo(x, y, x + rad[0], y);
      ctx.closePath();
    }

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [getNodePos]);

  // ── Mouse Events ──
  // Setelah pan/zoom diperkenalkan, SEMUA mx,my dari mouse event WAJIB di-convert
  // ke world coords lewat screenToWorld() sebelum dipakai hitTest/drag/wiring,
  // karena comp.x/comp.y dan getNodePos semuanya di world space.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isPanningTrigger = (e) => {
      // Pan aktif jika: middle mouse button (button=1) ATAU left mouse + space held
      // ATAU right mouse button (button=2) in move/rotate/clone mode (workspace pan).
      if (e.button === 1) return true;
      if (e.button === 0 && spaceDownRef.current) return true;
      if (e.button === 2 && (moveModeRef.current || rotateModeRef.current || cloneModeRef.current)) return true;
      return false;
    };

    const onMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      // Simpan di ref supaya onTouchStart bisa panggil (mobile anchor support)
      stateRef.current._lastOnMouseDownArgs = { sx, sy };

      // ── Pan mode ──
      if (isPanningTrigger(e)) {
        e.preventDefault();
        const v = stateRef.current.view;
        stateRef.current.panning = {
          startSX: sx, startSY: sy,
          startVX: v.x, startVY: v.y,
        };
        if (!pickFromWorkspaceRef.current) canvas.style.cursor = 'grabbing';
        return;
      }

      // ── Normal mode: convert screen → world, lalu hitTest ──
      const { x: mx, y: my } = screenToWorld(sx, sy);
      const hit = hitTest(mx, my, stateRef.current.components);

      // ── DELETE MODE: klik wire/komponen = hapus. Drag & wiring di-block. ──
      // User request: 'jika mode ini aktif maka player ketika mengklik kabel maka
      // kabel hilang, jika komponen maka komponen hilang, serta player tidak dapat
      // mendrag komponen baru dan player tidak dapat menggeser komponen yang sudah ada'.
      if (deleteModeRef.current) {
        if (hit) {
          deleteComponent(hit.comp.id);
          return;
        }
        const wireHit = hitTestWire(mx, my, stateRef.current.wires, stateRef.current.components);
        if (wireHit) {
          deleteWire(wireHit.wire.id);
          return;
        }
        // Empty click → just clear selection, no drag.
        setSelectedId(null);
        setColorPicker(null);
        return;
      }

      // ── CLONE MODE: check anchor point clicks first (recompute — pan/zoom safe) ──
      if (cloneModeRef.current && stateRef.current.cloneAnchors) {
        // Recompute anchor positions dari current view
        const cSelIdsHit = stateRef.current.cloneSelectedIds;
        const cSelCompsHit = stateRef.current.components.filter(c => cSelIdsHit.includes(c.id));
        const cHitResult = cSelCompsHit.length > 0 ? calcAnchorsFromComponents(cSelCompsHit, stateRef.current.view) : null;
        const cHitAnchors = cHitResult ? cHitResult.anchors : stateRef.current.cloneAnchors;
        const dirs = ['top', 'bottom', 'left', 'right'];
        for (const dir of dirs) {
          const pt = cHitAnchors[dir];
          if (!pt) continue;
          const dist = Math.sqrt((sx - pt.x) ** 2 + (sy - pt.y) ** 2);
          if (dist < 18) {
            // Duplicate selected components in this direction
            const selIds = stateRef.current.cloneSelectedIds;
            const selComps = stateRef.current.components.filter(c => selIds.includes(c.id));
            if (selComps.length === 0) return;

            // Calculate bounding box of selected
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const c of selComps) {
              minX = Math.min(minX, c.x);
              minY = Math.min(minY, c.y);
              maxX = Math.max(maxX, c.x + c.width);
              maxY = Math.max(maxY, c.y + c.height);
            }
            const boxW = maxX - minX;
            const boxH = maxY - minY;
            const gap = 40;

            let dx = 0, dy = 0;
            if (dir === 'top') dy = -(boxH + gap);
            else if (dir === 'bottom') dy = boxH + gap;
            else if (dir === 'left') dx = -(boxW + gap);
            else if (dir === 'right') dx = boxW + gap;

            // Create duplicates with new IDs & proper typeNum
            let nextIdVal = stateRef.current.nextId;
            const newComps = [...stateRef.current.components];
            const newWrs = [...stateRef.current.wires];
            const idMap = {}; // old id → new id
            const newCounters = { ...stateRef.current.typeCounters };

            for (const c of selComps) {
              const newId = nextIdVal++;
              idMap[c.id] = newId;
              // Assign new typeNum by incrementing per-type counter
              const newTypeNum = (newCounters[c.type] || 0) + 1;
              newCounters[c.type] = newTypeNum;
              const newComp = {
                ...c,
                id: newId,
                typeNum: newTypeNum,
                x: c.x + dx,
                y: c.y + dy,
                inputWires: c.inputWires.map(() => null),
                outputWires: c.outputWires.map(() => []),
              };
              newComps.push(newComp);
            }

            // Duplicate wires that connect within the selected set
            for (const w of stateRef.current.wires) {
              if (idMap[w.from] !== undefined && idMap[w.to] !== undefined) {
                const newWId = nextIdVal++;
                const newWire = {
                  ...w,
                  id: newWId,
                  from: idMap[w.from],
                  to: idMap[w.to],
                };
                newWrs.push(newWire);
                // Update outputWires/inputWires references
                const fromComp = newComps.find(c => c.id === idMap[w.from]);
                const toComp = newComps.find(c => c.id === idMap[w.to]);
                if (fromComp && fromComp.outputWires[w.fromIdx]) {
                  fromComp.outputWires[w.fromIdx] = [...(fromComp.outputWires[w.fromIdx] || []), newWId];
                }
                if (toComp) {
                  toComp.inputWires[w.toIdx] = newWId;
                }
              }
            }

            setNextId(nextIdVal);
            setTypeCounters(newCounters);
            const { comps: simComps, wrs: simWrs } = simulate(newComps, newWrs);
            setComponents(simComps);
            setWires(simWrs);
            setStatus('Cloned ' + selComps.length + ' component(s) ' + dir);

            // Auto-switch to MOVE mode with cloned components selected
            // so user can immediately position the clones
            const clonedIds = Object.values(idMap);
            setCloneMode(false);
            setCloneBox(null);
            setCloneSelectedIds([]);
            setCloneAnchors(null);
            setMoveMode(true);
            const simSelComps = simComps.filter(c => clonedIds.includes(c.id));
            setMoveSelectedIds(clonedIds);
            const v = stateRef.current.view;
            const moveResult = calcAnchorsFromComponents(simSelComps, v);
            if (moveResult) {
              setMoveBox(null); // No box needed — anchors + selectedIds are sufficient
              setMoveAnchors(moveResult.anchors);
            }
            setStatus('Cloned! Now in Move mode — drag arrows to position clones');
            return;
          }
        }
      }

      // ── CLONE MODE: drag = create purple selection box ──
      if (cloneModeRef.current) {
        e.preventDefault();
        const newBox = { sx, sy, ex: sx, ey: sy };
        setCloneBox(newBox);
        setCloneSelectedIds([]);
        setCloneAnchors(null);
        // Sync fast-path: mutate stateRef directly so the next mouseMove
        // sees the updated cloneBox/cloneAnchors without waiting for React re-render.
        stateRef.current.cloneBox = newBox;
        stateRef.current.cloneSelectedIds = [];
        stateRef.current.cloneAnchors = null;
        return;
      }

      // ── MOVE MODE: check arrow anchor clicks first (recompute — pan/zoom safe) ──
      if (moveModeRef.current && stateRef.current.moveAnchors && !stateRef.current.moveActiveDir) {
        // Recompute anchor positions dari current view
        const mSelIdsHit = stateRef.current.moveSelectedIds;
        const mSelCompsHit = stateRef.current.components.filter(c => mSelIdsHit.includes(c.id));
        const mHitResult = mSelCompsHit.length > 0 ? calcAnchorsFromComponents(mSelCompsHit, stateRef.current.view) : null;
        const mHitAnchors = mHitResult ? mHitResult.anchors : stateRef.current.moveAnchors;
        const dirs = ['top', 'bottom', 'left', 'right'];
        for (const dir of dirs) {
          const pt = mHitAnchors[dir];
          if (!pt) continue;
          const dist = Math.sqrt((sx - pt.x) ** 2 + (sy - pt.y) ** 2);
          if (dist < 20) {
            // Start moving: hide other anchors, only show this one
            setMoveActiveDir(dir);
            // Store initial component positions for move delta calc
            const selIds = stateRef.current.moveSelectedIds;
            const selComps = stateRef.current.components.filter(c => selIds.includes(c.id));
            stateRef.current.moveDragStart = { sx, sy, comps: selComps.map(c => ({ id: c.id, x: c.x, y: c.y })) };
            return;
          }
        }
      }

      // ── MOVE MODE: drag = create teal selection box ──
      if (moveModeRef.current) {
        // Guard: if components are already selected (e.g. after clone→move switch),
        // clicking inside/near their bounding box should deselect, NOT start a new
        // selection box that accidentally picks up nearby original components.
        if (stateRef.current.moveAnchors && stateRef.current.moveSelectedIds.length > 0) {
          const guardIds = stateRef.current.moveSelectedIds;
          const guardComps = stateRef.current.components.filter(c => guardIds.includes(c.id));
          if (guardComps.length > 0) {
            const guardResult = calcAnchorsFromComponents(guardComps, stateRef.current.view);
            if (guardResult) {
              const b = guardResult.box;
              const pad = 15; // padding around bbox for easier click targeting
              if (sx >= b.sx - pad && sx <= b.ex + pad && sy >= b.sy - pad && sy <= b.ey + pad) {
                // Click inside selection area → deselect cleanly
                e.preventDefault();
                setMoveSelectedIds([]);
                setMoveAnchors(null);
                setMoveBox(null);
                setMoveActiveDir(null);
                return;
              }
            }
          }
        }
        // Click is clearly outside existing selection → start a new selection box
        e.preventDefault();
        const newMoveBox = { sx, sy, ex: sx, ey: sy };
        setMoveBox(newMoveBox);
        setMoveSelectedIds([]);
        setMoveAnchors(null);
        setMoveActiveDir(null);
        // Sync fast-path: mutate stateRef directly so the next mouseMove
        // sees the updated moveBox/moveAnchors without waiting for React re-render.
        stateRef.current.moveBox = newMoveBox;
        stateRef.current.moveSelectedIds = [];
        stateRef.current.moveAnchors = null;
        stateRef.current.moveActiveDir = null;
        return;
      }

      // ── ROTATE MODE: check double-circle anchor clicks (recompute via MEC — pan/zoom safe) ──
      if (rotateModeRef.current && stateRef.current.rotateAnchors) {
        // Recompute anchor positions dari current view
        const rSelIdsHit = stateRef.current.rotateSelectedIds;
        const rSelCompsHit = stateRef.current.components.filter(c => rSelIdsHit.includes(c.id));
        const rHitResult = rSelCompsHit.length > 0 ? calcRotateAnchorsFromMEC(rSelCompsHit, stateRef.current.view) : null;
        const rHitAnchors = rHitResult ? rHitResult.anchors : stateRef.current.rotateAnchors;
        const dirs = ['top', 'bottom', 'left', 'right'];
        for (const dir of dirs) {
          const pt = rHitAnchors[dir];
          if (!pt) continue;
          const dist = Math.sqrt((sx - pt.x) ** 2 + (sy - pt.y) ** 2);
          if (dist < 20) {
            // ── Rotate selected components by exact 90° around MEC center ──
            // top/left = CW (+90°), bottom/right = CCW (-90°)
            const selIds = stateRef.current.rotateSelectedIds;
            const selComps = stateRef.current.components.filter(c => selIds.includes(c.id));
            if (selComps.length === 0) return;

            // Skip jika animasi masih jalan
            if (rotAnimRef.current) return;

            // Pivot = MEC center langsung di WORLD SPACE
            // (tanpa screen↔world roundtrip → zero drift saat spam rotate)
            const worldPivot = calcWorldMECPivot(selComps);
            let pivotX, pivotY;
            if (worldPivot) {
              pivotX = worldPivot.x;
              pivotY = worldPivot.y;
            } else {
              // Fallback: center of mass
              pivotX = 0; pivotY = 0;
              for (const c of selComps) {
                pivotX += c.x + c.width / 2;
                pivotY += c.y + c.height / 2;
              }
              pivotX /= selComps.length;
              pivotY /= selComps.length;
            }

            const isCW = (dir === 'top' || dir === 'left');
            const facingDelta = isCW ? 1 : -1;

            // Exact 90° rotation formulas (no Math.cos/sin — zero floating-point drift):
            // CW 90° around (px,py): newX = px - (y - py), newY = py + (x - px)
            // CCW 90° around (px,py): newX = px + (y - py), newY = py - (x - px)
            // Proof: 4 consecutive rotations return to exact start position.
            const oldComps = [];
            const newComps = stateRef.current.components.map(c => {
              if (!selIds.includes(c.id)) return c;
              const compCx = c.x + c.width / 2;
              const compCy = c.y + c.height / 2;
              let newCx, newCy;
              if (isCW) {
                // CW 90°: x' = px - (y - py), y' = py + (x - px)
                newCx = pivotX - (compCy - pivotY);
                newCy = pivotY + (compCx - pivotX);
              } else {
                // CCW 90°: x' = px + (y - py), y' = py - (x - px)
                newCx = pivotX + (compCy - pivotY);
                newCy = pivotY - (compCx - pivotX);
              }
              const newFacing = ((c.facing || 0) + facingDelta + 4) % 4;
              oldComps.push({ id: c.id, x: c.x, y: c.y, facing: c.facing || 0 });
              return { ...c, x: newCx - c.width / 2, y: newCy - c.height / 2, facing: newFacing };
            });

            // Trigger smooth animation (250ms)
            const animNewComps = [];
            for (const c of newComps) {
              if (selIds.includes(c.id)) {
                animNewComps.push({ id: c.id, x: c.x, y: c.y, facing: c.facing });
              }
            }
            setRotAnim({
              startTime: performance.now(),
              duration: 250,
              pivot: { x: pivotX, y: pivotY },
              angleDelta: isCW ? Math.PI / 2 : -Math.PI / 2, // for smooth visual interpolation
              oldComps,
              newComps: animNewComps,
              selIds,
            });

            // Apply new positions + simulate
            const { comps: simComps, wrs: simWrs } = simulate(newComps, stateRef.current.wires);
            setComponents(simComps);
            setWires(simWrs);
            return;
          }
        }
      }

      // ── ROTATE MODE: drag = create amber selection box ──
      if (rotateModeRef.current) {
        e.preventDefault();
        const newRotBox = { sx, sy, ex: sx, ey: sy };
        setRotateBox(newRotBox);
        setRotateSelectedIds([]);
        setRotateAnchors(null);
        // Sync fast-path: mutate stateRef directly so the next mouseMove
        // sees the updated rotateBox/rotateAnchors without waiting for React re-render.
        stateRef.current.rotateBox = newRotBox;
        stateRef.current.rotateSelectedIds = [];
        stateRef.current.rotateAnchors = null;
        return;
      }

      // ── PICK FROM WORKSPACE MODE (eyedropper): prioritas tertinggi, dicek SEBELUM paintMode ──
      if (pickFromWorkspaceRef.current) {
        const savedPicker = pickFromWorkspaceRef.current;
        const isSlotPicker = savedPicker.source === 'slot';
        let pickedHex = null;
        if (hit) {
          const comp = hit.comp;
          const def = GATE_MAP[comp.type] || IO_DEFS[comp.type];
          pickedHex = comp.userColor || def.color;
        } else {
          const wireHit = hitTestWire(mx, my, stateRef.current.wires, stateRef.current.components);
          if (wireHit) {
            const w = wireHit.wire;
            pickedHex = w.userColor || (w.color ? hslToHex(w.color.h, w.color.s, 50) : '#4ade80');
          }
        }
        if (pickedHex) {
          if (isSlotPicker) {
            setSlotColorEdit({ slotIndex: savedPicker.slotIndex, draftHex: pickedHex });
          } else {
            setColorPicker({ ...savedPicker, hex: pickedHex });
          }
          setPickFromWorkspace(null);
          canvas.style.cursor = 'default';
          setStatus('Color picked: ' + pickedHex.toUpperCase());
        } else {
          setPickFromWorkspace(null);
          canvas.style.cursor = 'default';
          if (isSlotPicker) {
            setSlotColorEdit({ slotIndex: savedPicker.slotIndex, draftHex: savedPicker.draftHex });
          } else {
            setColorPicker(savedPicker);
          }
          setStatus('Pick cancelled — click a component or wire next time');
        }
        return;
      }

      // ── PAINT MODE: klik wire/komponen = buka color picker. Drag & wiring di-block. ──
      // User request: 'jika mode aktif maka player ketika mengklik kabel dapat merubah
      // palet warna tersebut... player dapat mengubah warna komponen juga! (semua komponen
      // tanpa terkecuali)... player tidak dapat mendrag komponen baru dan player tidak
      // dapat menggeser komponen yang sudah ada di workspace'.
      if (paintModeRef.current) {
        if (hit) {
          // Klik komponen → buka color picker untuk komponen (override def.color via userColor).
          const comp = hit.comp;
          const def = GATE_MAP[comp.type] || IO_DEFS[comp.type];
          const currentHex = comp.userColor || def.color;
          setColorPicker({ targetType: 'comp', targetId: comp.id, x: sx, y: sy, hex: currentHex, originalHex: currentHex });
          setStatus('Component clicked — pick a color, then confirm');
          return;
        }
        const wireHit = hitTestWire(mx, my, stateRef.current.wires, stateRef.current.components);
        if (wireHit) {
          // Klik wire → buka RGB color picker di posisi click.
          // Wire ke-1 (color=null) tetap bisa di-recolor via userColor (override hijau default).
          const w = wireHit.wire;
          const currentHex = w.userColor || (w.color ? hslToHex(w.color.h, w.color.s, 50) : '#4ade80');
          setColorPicker({ targetType: 'wire', targetId: w.id, x: sx, y: sy, hex: currentHex, originalHex: currentHex });
          setStatus('Wire clicked — pick a color, then confirm');
          return;
        }
        // Empty click → tutup picker kalau kebuka.
        setColorPicker(null);
        setSelectedId(null);
        return;
      }

      if (hit) {
        // ── Connect Wire mode: zone-based port selection ──
        // Saat mode connect, body/drag-handle/port hit semua di-interpret sebagai zone-based
        // port selection. User sentuh area kanan = output, kiri atas = input1, kiri bawah = input2.
        // Switch tetap bisa toggle TAPI hanya via body click di build mode — di connect mode,
        // Switch zone = output (zone tunggal), jadi gak ada toggle. User harus switch ke build
        // mode buat toggle Switch (atau klik kanan untuk remove, di build mode).
        if (modeRef.current === 'connect') {
          const zone = hitTestZone(mx, my, hit.comp);
          if (!zone) return;
          if (zone.kind === 'output') {
            stateRef.current.wiring = { fromComp: hit.comp, fromIdx: zone.idx, mx, my };
            setStatus('Wiring... click an input zone to connect');
          } else if (zone.kind === 'input') {
            if (stateRef.current.wiring) {
              completeWire(stateRef.current.wiring.fromComp, stateRef.current.wiring.fromIdx, hit.comp, zone.idx);
            } else {
              setStatus('Tap an output zone first to start a wire');
            }
          }
          return;
        }
        // ── Build mode: drag & toggle only. Port-based wiring DILARANG di build mode.
        // User request: 'ketika mode build maka user tidak bisa pencet port untuk
        // menyambungkan kabel sangat tidak bisa! dan bisanya ketika mode connect
        // wire saja'. Wiring hanya bisa di connect mode via zona sentuh.
        // Port hit (kind 'output'/'input') di-build mode di-convert jadi body
        // behavior: drag gate, atau toggle Switch. ──
        if (hit.kind === 'drag-handle') {
          // Switch (INPUT) drag handle — drag comp, JANGAN toggle.
          // User minta: switch punya tombol drag sendiri di atas biar bisa ditarik
          // khusus dia doang (tanpa mengganggu toggle behavior di body bawah).
          setSelectedId(hit.comp.id);
          stateRef.current.dragging = hit.comp;
          stateRef.current.dragOffset = { x: mx - hit.comp.x, y: my - hit.comp.y };
          setStatus('Dragging ' + (IO_DEFS[hit.comp.type]?.name || hit.comp.type));
        } else if (hit.kind === 'body' || hit.kind === 'output' || hit.kind === 'input') {
          // Body ATAU port hit (output/input) — di-build mode, port bulat kecil
          // gak boleh trigger wiring. Treat sebagai body: drag gate, toggle Switch.
          if (hit.comp.type === 'INPUT') {
            const comps = stateRef.current.components.map(c =>
              c.id === hit.comp.id ? { ...c, outputs: [!c.outputs[0]] } : c
            );
            const { comps: newComps, wrs: newWrs } = simulate(comps, stateRef.current.wires);
            setComponents(newComps);
            setWires(newWrs);
            setStatus(newComps.find(c => c.id === hit.comp.id).outputs[0] ? 'Switch ON' : 'Switch OFF');
          } else {
            setSelectedId(hit.comp.id);
            stateRef.current.dragging = hit.comp;
            stateRef.current.dragOffset = { x: mx - hit.comp.x, y: my - hit.comp.y };
            setStatus('Dragging ' + GATE_MAP[hit.comp.type].name);
          }
        }
      } else {
        // Gak kena komponen/port — cek wire hit HANYA untuk clear selection.
        // User request: 'aturan menyentuh kabel untuk mengubah warna digantikan dengan
        // harus menyalakan mode [paint] ini dulu baru fiturnya aktif!'.
        // Jadi di build/connect mode (paint OFF), klik wire = nothing special (clear selection).
        // Paint/Delete mode sudah di-handle di atas (return early).
        // ── Build mode: left-click drag on empty canvas = pan workspace ──
        if (e.button === 0 && !cloneModeRef.current && !paintModeRef.current && !deleteModeRef.current && !moveModeRef.current && !rotateModeRef.current && modeRef.current !== 'connect') {
          const v = stateRef.current.view;
          stateRef.current.panning = {
            startSX: sx, startSY: sy,
            startVX: v.x, startVY: v.y,
          };
          if (!pickFromWorkspaceRef.current) canvas.style.cursor = 'grabbing';
        }
        setSelectedId(null);
        stateRef.current.wiring = null;
        setColorPicker(null);  // klik empty space → tutup picker kalau kebuka
        setStatus('Ready');
      }
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      // ── Pan aktif: update view langsung (draw loop baca stateRef tiap frame) ──
      if (stateRef.current.panning) {
        const p = stateRef.current.panning;
        const v = stateRef.current.view;
        v.x = p.startVX + (sx - p.startSX);
        v.y = p.startVY + (sy - p.startSY);
        return;
      }

      // ── Clone box dragging: update box end point (only while dragging, not after anchors shown) ──
      if (cloneModeRef.current && stateRef.current.cloneBox && !stateRef.current.cloneAnchors) {
        const box = stateRef.current.cloneBox;
        setCloneBox({ ...box, ex: sx, ey: sy });
        // Calculate which components are inside the box
        const v = stateRef.current.view;
        const wx1 = (Math.min(box.sx, sx) - v.x) / v.scale;
        const wy1 = (Math.min(box.sy, sy) - v.y) / v.scale;
        const wx2 = (Math.max(box.sx, sx) - v.x) / v.scale;
        const wy2 = (Math.max(box.sy, sy) - v.y) / v.scale;
        const inside = stateRef.current.components.filter(c => {
          return c.x < wx2 && c.x + c.width > wx1 && c.y < wy2 && c.y + c.height > wy1;
        });
        setCloneSelectedIds(inside.map(c => c.id));
        return;
      }

      // ── Move Area: active drag (anchor selected) → move components ──
      if (moveModeRef.current && stateRef.current.moveActiveDir && stateRef.current.moveDragStart) {
        const mds = stateRef.current.moveDragStart;
        const v = stateRef.current.view;
        const dxWorld = (sx - mds.sx) / v.scale;
        const dyWorld = (sy - mds.sy) / v.scale;
        const newComps = stateRef.current.components.map(c => {
          const orig = mds.comps.find(oc => oc.id === c.id);
          if (!orig) return c;
          return { ...c, x: orig.x + dxWorld, y: orig.y + dyWorld };
        });
        setComponents(newComps);
        // Update move box position to follow
        const mb = stateRef.current.moveBox;
        if (mb) {
          setMoveBox({ sx: mb.sx + (sx - mds.sx) - (stateRef.current._lastMoveSx ? sx - stateRef.current._lastMoveSx : 0), sy: mb.sy, ex: mb.ex + (sx - mds.sx) - (stateRef.current._lastMoveSx ? sx - stateRef.current._lastMoveSx : 0), ey: mb.ey });
        }
        stateRef.current._lastMoveSx = sx;
        stateRef.current._lastMoveSy = sy;
        return;
      }

      // ── Move box dragging: update box end point ──
      if (moveModeRef.current && stateRef.current.moveBox && !stateRef.current.moveAnchors) {
        const box = stateRef.current.moveBox;
        setMoveBox({ ...box, ex: sx, ey: sy });
        const v = stateRef.current.view;
        const wx1 = (Math.min(box.sx, sx) - v.x) / v.scale;
        const wy1 = (Math.min(box.sy, sy) - v.y) / v.scale;
        const wx2 = (Math.max(box.sx, sx) - v.x) / v.scale;
        const wy2 = (Math.max(box.sy, sy) - v.y) / v.scale;
        const inside = stateRef.current.components.filter(c => {
          return c.x < wx2 && c.x + c.width > wx1 && c.y < wy2 && c.y + c.height > wy1;
        });
        setMoveSelectedIds(inside.map(c => c.id));
        return;
      }

      // ── Rotate BOX dragging: update end point (AABB rectangle like move/clone) ──
      if (rotateModeRef.current && stateRef.current.rotateBox && !stateRef.current.rotateAnchors) {
        const box = stateRef.current.rotateBox;
        setRotateBox({ ...box, ex: sx, ey: sy });
        const v = stateRef.current.view;
        // AABB overlap check (sama seperti move/clone — kotak, bukan lingkaran)
        const wx1 = Math.min(box.sx, sx) / v.scale - v.x / v.scale;
        const wy1 = Math.min(box.sy, sy) / v.scale - v.y / v.scale;
        const wx2 = Math.max(box.sx, sx) / v.scale - v.x / v.scale;
        const wy2 = Math.max(box.sy, sy) / v.scale - v.y / v.scale;
        const inside = stateRef.current.components.filter(c => {
          return c.x < wx2 && c.x + c.width > wx1 && c.y < wy2 && c.y + c.height > wy1;
        });
        setRotateSelectedIds(inside.map(c => c.id));
        return;
      }

      // ── Normal mode: convert ke world coords ──
      const { x: mx, y: my } = screenToWorld(sx, sy);

      // Update coordinate display (world coords di bawah cursor).
      // Throttle: hanya setState kalau coords berubah signifikan (>1px) supaya
      // gak trigger re-render berlebihan tiap pixel mouse bergerak.
      setCursorWorld(prev => {
        if (prev && Math.abs(prev.x - mx) < 1 && Math.abs(prev.y - my) < 1) return prev;
        return { x: Math.round(mx), y: Math.round(my) };
      });

      if (stateRef.current.wiring) {
        stateRef.current.wiring.mx = mx;
        stateRef.current.wiring.my = my;
      }
      if (stateRef.current.dragging) {
        const comp = stateRef.current.dragging;
        comp.x = mx - stateRef.current.dragOffset.x;
        comp.y = my - stateRef.current.dragOffset.y;
        setComponents([...stateRef.current.components]);
      }

      const hit = hitTest(mx, my, stateRef.current.components);
      // Connect mode: track zona yang di-hover buat visual feedback (overlay zona).
      // Build mode: clear hoverZone (gak dipake).
      if (modeRef.current === 'connect' && hit) {
        const zone = hitTestZone(mx, my, hit.comp);
        if (zone) {
          stateRef.current.hoverZone = { compId: hit.comp.id, kind: zone.kind, idx: zone.idx };
        } else {
          stateRef.current.hoverZone = null;
        }
      } else {
        stateRef.current.hoverZone = null;
      }
      if (hit && (hit.kind === 'input' || hit.kind === 'output')) {
        stateRef.current.hoverNode = { x: hit.x, y: hit.y };
        if (!pickFromWorkspaceRef.current) canvas.style.cursor = 'pointer';
      } else if (hit && hit.kind === 'drag-handle') {
        stateRef.current.hoverNode = null;
        if (!pickFromWorkspaceRef.current) canvas.style.cursor = 'move';
      } else if (hit && hit.kind === 'body') {
        stateRef.current.hoverNode = null;
        if (!pickFromWorkspaceRef.current) canvas.style.cursor = hit.comp.type === 'INPUT' ? 'pointer' : 'move';
      } else {
        stateRef.current.hoverNode = null;
        if (!pickFromWorkspaceRef.current) canvas.style.cursor = spaceDownRef.current ? 'grab' : (stateRef.current.wiring ? 'crosshair' : 'default');
      }
    };

    const onMouseUp = (e) => {
      // Stop panning (button 1 release atau button 0 release saat panning aktif).
      if (stateRef.current.panning) {
        stateRef.current.panning = null;
        if (!pickFromWorkspaceRef.current) canvas.style.cursor = spaceDownRef.current ? 'grab' : 'default';
        return;
      }
      // ── Clone box: finalize selection & show anchor points ──
      // ── Clone BOX: finalize selection & show arrow anchors ──
      // Guard: only finalize if anchors aren't already showing (prevents re-selection
      // when mouseUp fires after clicking a clone anchor — box is stale at that point)
      if (stateRef.current.cloneBox && !stateRef.current.cloneAnchors) {
        const box = stateRef.current.cloneBox;
        // Recompute which components are inside the box at this moment
        // (stateRef.cloneSelectedIds may be stale due to async setState in mouseMove)
        const v = stateRef.current.view;
        const wx1 = (Math.min(box.sx, box.ex) - v.x) / v.scale;
        const wy1 = (Math.min(box.sy, box.ey) - v.y) / v.scale;
        const wx2 = (Math.max(box.sx, box.ex) - v.x) / v.scale;
        const wy2 = (Math.max(box.sy, box.ey) - v.y) / v.scale;
        const insideIds = stateRef.current.components.filter(c => {
          return c.x < wx2 && c.x + c.width > wx1 && c.y < wy2 && c.y + c.height > wy1;
        }).map(c => c.id);
        setCloneSelectedIds(insideIds);

        const hasComponents = insideIds.length > 0;
        if ((Math.abs(box.ex - box.sx) > 5 || Math.abs(box.ey - box.sy) > 5) && hasComponents) {
          // Box is big enough AND has components inside → show anchors based on component bounding box
          const v = stateRef.current.view;
          const selComps = stateRef.current.components.filter(c => insideIds.includes(c.id));
          const result = calcAnchorsFromComponents(selComps, v);
          if (result) {
            setCloneBox(null); // Clear box after finalization — anchors + selectedIds are sufficient
            setCloneAnchors(result.anchors);
          }
        } else {
          // Box too small OR no components inside → dismiss everything
          setCloneBox(null);
          setCloneSelectedIds([]);
          setCloneAnchors(null);
        }
        return;
      }

      // ── Move Area: release anchor drag → re-show all 4 anchors ──
      if (moveModeRef.current && stateRef.current.moveActiveDir) {
        setMoveActiveDir(null);
        stateRef.current.moveDragStart = null;
        stateRef.current._lastMoveSx = null;
        stateRef.current._lastMoveSy = null;
        // Recompute anchors based on current component positions
        const mb = stateRef.current.moveBox;
        if (mb) {
          // Recalc box from current component positions using helper
          const selIds = stateRef.current.moveSelectedIds;
          const selComps = stateRef.current.components.filter(c => selIds.includes(c.id));
          const v = stateRef.current.view;
          const result = calcAnchorsFromComponents(selComps, v);
          if (result) {
            setMoveBox(null); // Clear box — anchors + selectedIds are sufficient
            setMoveAnchors(result.anchors);
          }
        }
        const { comps: simComps, wrs: simWrs } = simulate(stateRef.current.components, stateRef.current.wires);
        setComponents(simComps);
        setWires(simWrs);
        setStatus('Moved area');
        return;
      }

      // ── Move box: finalize selection & show arrow anchors ──
      // Guard: only finalize if anchors aren't already showing (prevents re-selection
      // when mouseUp fires after clicking a move anchor — box is stale at that point)
      if (stateRef.current.moveBox && !stateRef.current.moveAnchors) {
        const box = stateRef.current.moveBox;
        const v = stateRef.current.view;
        const wx1 = (Math.min(box.sx, box.ex) - v.x) / v.scale;
        const wy1 = (Math.min(box.sy, box.ey) - v.y) / v.scale;
        const wx2 = (Math.max(box.sx, box.ex) - v.x) / v.scale;
        const wy2 = (Math.max(box.sy, box.ey) - v.y) / v.scale;
        const insideIds = stateRef.current.components.filter(c => {
          return c.x < wx2 && c.x + c.width > wx1 && c.y < wy2 && c.y + c.height > wy1;
        }).map(c => c.id);
        setMoveSelectedIds(insideIds);
        const hasComponents = insideIds.length > 0;
        if ((Math.abs(box.ex - box.sx) > 5 || Math.abs(box.ey - box.sy) > 5) && hasComponents) {
          const selComps = stateRef.current.components.filter(c => insideIds.includes(c.id));
          const result = calcAnchorsFromComponents(selComps, v);
          if (result) {
            setMoveBox(null); // Clear box after finalization — anchors + selectedIds are sufficient
            setMoveAnchors(result.anchors);
          }
        } else {
          setMoveBox(null);
          setMoveSelectedIds([]);
          setMoveAnchors(null);
        }
        return;
      }

      // ── Rotate BOX: finalize selection & show double-circle anchors ──
      // Guard: only finalize if anchors aren't already showing (prevents re-selection
      // when mouseUp fires after clicking a rotate anchor — box is stale at that point)
      if (stateRef.current.rotateBox && !stateRef.current.rotateAnchors) {
        const box = stateRef.current.rotateBox;
        const v = stateRef.current.view;
        // AABB overlap check (kotak, bukan lingkaran — sama seperti drag)
        const wx1 = Math.min(box.sx, box.ex) / v.scale - v.x / v.scale;
        const wy1 = Math.min(box.sy, box.ey) / v.scale - v.y / v.scale;
        const wx2 = Math.max(box.sx, box.ex) / v.scale - v.x / v.scale;
        const wy2 = Math.max(box.sy, box.ey) / v.scale - v.y / v.scale;
        const insideIds = stateRef.current.components.filter(c => {
          return c.x < wx2 && c.x + c.width > wx1 && c.y < wy2 && c.y + c.height > wy1;
        }).map(c => c.id);
        setRotateSelectedIds(insideIds);
        const hasComponents = insideIds.length > 0;
        if ((Math.abs(box.ex - box.sx) > 5 || Math.abs(box.ey - box.sy) > 5) && hasComponents) {
          const selComps = stateRef.current.components.filter(c => insideIds.includes(c.id));
          const result = calcRotateAnchorsFromMEC(selComps, v);
          if (result) {
            setRotateBox(null); // Clear box after finalization — anchors + selectedIds are sufficient
            setRotateAnchors(result.anchors);
          }
        } else {
          setRotateBox(null);
          setRotateSelectedIds([]);
          setRotateAnchors(null);
        }
        return;
      }
      stateRef.current.dragging = null;
    };

    // Wheel = zoom terhadap cursor. passive:false supaya bisa preventDefault
    // (browser default scroll page kalau gak di-prevent).
    const onWheel = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      // deltaY positif = scroll down = zoom out. Faktor di-tune supaya 1 notch wheel
      // = ~10% zoom (factor 0.9 / 1.1), tidak terlalu jumpy.
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      zoomAt(sx, sy, factor);
    };

    const onContextMenu = (e) => {
      e.preventDefault();
      // In paint mode, pick mode, delete mode, or when color picker is open — suppress context menu entirely
      if (paintModeRef.current || pickFromWorkspaceRef.current || deleteModeRef.current || colorPicker) return;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const { x: mx, y: my } = screenToWorld(sx, sy);
      const hit = hitTest(mx, my, stateRef.current.components);

      if (hit && hit.kind === 'body') {
        const comp = hit.comp;
        let wrs = [...stateRef.current.wires];
        let comps = [...stateRef.current.components];

        wrs = wrs.filter(w => {
          if (w.from === comp.id || w.to === comp.id) {
            if (w.to === comp.id) {
              const src = comps.find(c => c.id === w.from);
              if (src) src.outputWires[w.fromIdx] = src.outputWires[w.fromIdx].filter(id => id !== w.id);
            }
            if (w.from === comp.id) {
              const dst = comps.find(c => c.id === w.to);
              if (dst) dst.inputWires[w.toIdx] = null;
            }
            return false;
          }
          return true;
        });
        comps = comps.filter(c => c.id !== comp.id);
        if (selectedId === comp.id) setSelectedId(null);
        // ATURAN ABSOLUT: setelah hapus komponen, SEMUA downstream harus di-re-evaluate.
        // Wire-wire yang connect ke comp tsb sudah di-filter di atas, jadi comp downstream
        // sekarang punya inputWires[i] = null → simulate() akan set inputs[i] = false →
        // output mereka recompute jadi false (anti "ghost current" — LED nyala sendiri).
        const { comps: reComps, wrs: reWrs } = simulate(comps, wrs);
        setComponents(reComps);
        setWires(reWrs);
        setStatus('Component removed');
      } else if (hit && (hit.kind === 'input' || hit.kind === 'output')) {
        const comp = hit.comp;
        const isInput = hit.kind === 'input';
        const idx = hit.idx;
        let wrs = [...stateRef.current.wires];
        let comps = [...stateRef.current.components];

        wrs = wrs.filter(w => {
          if ((isInput && w.to === comp.id && w.toIdx === idx) ||
              (!isInput && w.from === comp.id && w.fromIdx === idx)) {
            if (isInput) {
              const src = comps.find(c => c.id === w.from);
              if (src) src.outputWires[w.fromIdx] = src.outputWires[w.fromIdx].filter(id => id !== w.id);
            } else {
              const dst = comps.find(c => c.id === w.to);
              if (dst) dst.inputWires[w.toIdx] = null;
            }
            return false;
          }
          return true;
        });
        if (isInput) {
          const c = comps.find(x => x.id === comp.id);
          if (c) c.inputWires[idx] = null;
        }
        // ATURAN ABSOLUT: setelah hapus wire, downstream harus re-evaluate (input jadi false).
        const { comps: reComps, wrs: reWrs } = simulate(comps, wrs);
        setWires(reWrs);
        setComponents(reComps);
        setStatus('Wire removed');
      }
    };

    const onKeyDown = (e) => {
      // Space held = pan mode siap (cursor jadi grab). Ignore kalau lagi ngetik
      // di input field (simulator gak punya input field, tapi jaga-jaga).
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        spaceDownRef.current = true;
        if (!stateRef.current.panning && !pickFromWorkspaceRef.current) canvas.style.cursor = 'grab';
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null
          && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        const comp = stateRef.current.components.find(c => c.id === selectedId);
        if (!comp) return;
        let wrs = [...stateRef.current.wires];
        let comps = [...stateRef.current.components];
        wrs = wrs.filter(w => {
          if (w.from === comp.id || w.to === comp.id) {
            if (w.to === comp.id) {
              const src = comps.find(c => c.id === w.from);
              if (src) src.outputWires[w.fromIdx] = src.outputWires[w.fromIdx].filter(id => id !== w.id);
            }
            if (w.from === comp.id) {
              const dst = comps.find(c => c.id === w.to);
              if (dst) dst.inputWires[w.toIdx] = null;
            }
            return false;
          }
          return true;
        });
        comps = comps.filter(c => c.id !== comp.id);
        setSelectedId(null);
        setComponents(comps);
        setWires(wrs);
        setStatus('Component deleted');
      }
    };

    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        spaceDownRef.current = false;
        if (!stateRef.current.panning && !pickFromWorkspaceRef.current) canvas.style.cursor = 'default';
      }
    };

    // Mouseleave canvas = cancel pan biar gak stuck grabbing + clear coord display.
    const onMouseLeave = () => {
      if (stateRef.current.panning) {
        stateRef.current.panning = null;
        if (!pickFromWorkspaceRef.current) canvas.style.cursor = spaceDownRef.current ? 'grab' : 'default';
      }
      // Clear active selection box drags so they don't "stick to cursor"
      // when mouse leaves canvas and mouseUp fires outside (not caught by canvas).
      if (cloneBoxRef.current && !cloneAnchorsRef.current) {
        setCloneBox(null);
        setCloneSelectedIds([]);
        setCloneAnchors(null);
      }
      if (moveBoxRef.current && !moveAnchorsRef.current) {
        setMoveBox(null);
        setMoveSelectedIds([]);
        setMoveAnchors(null);
        setMoveActiveDir(null);
      }
      if (rotateBoxRef.current && !rotateAnchorsRef.current) {
        setRotateBox(null);
        setRotateSelectedIds([]);
        setRotateAnchors(null);
      }
      setCursorWorld(null);
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', onContextMenu);
    // Catch mouseUp on window so selection boxes don't "stick to cursor"
    // when mouse leaves canvas during drag.
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // ── TOUCH EVENT HANDLERS (mobile support) ──
    // User feedback: 'di mobile gak bisa drag/drop, gak bisa zoom, gak bisa geser area kerja'.
    // Browser mobile gak fire mousemove/mousedown — harus pakai touch events.
    // Pointer Events (pointerdown/move/up) would be cleaner, tapi banyak browser mobile
    // masih buggy dgn pointer cancel pas multi-touch. Pakai touch events klasik + manual
    // tracking multi-touch buat pinch-zoom.
    //
    // Strategi:
    // 1 jari (single touch) → emulate mouse: drag component / wire / pan (mirip space+drag)
    // 2 jari (pinch)         → pinch-to-zoom + 2-finger pan
    //
    // touchStateRef.current.pointers = Map<touchId, {x, y}>  — track all active touches
    // touchStateRef.current.pinchStart = { dist, midX, midY, viewX, viewY, scale } — snapshot pinch awal
    // touchStateRef.current.panStart  = { startX, startY, viewX, viewY } — snapshot pan awal (2-finger)

    const onTouchStart = (e) => {
      // Cegah browser scroll/zoom gesture conflict (mobile Safari/Chrome default gestures).
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      // Register semua touch baru ke pointers map.
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const sx = t.clientX - rect.left;
        const sy = t.clientY - rect.top;
        touchStateRef.current.pointers.set(t.identifier, { x: sx, y: sy });
      }

      const pointers = Array.from(touchStateRef.current.pointers.values());

      if (pointers.length === 1) {
        // ── SINGLE TOUCH: emulate mouse down ──
        // Reuse logic onMouseDown: pan, hit test, drag component, wiring.
        // Buat fake event object yang compatible sama onMouseDown signature.
        const sx = pointers[0].x;
        const sy = pointers[0].y;
        // Track touch origin buat detect "tap" vs "drag" (Switch toggle perlu tap).
        touchStateRef.current.touchStart = { sx, sy, moved: false, time: Date.now() };

        // ── MOBILE: Check anchor hits FIRST (move/rotate/clone) ──
        // Anchor check harus SEBELUM hit test & delete/paint mode check.
        // Ini yang sebelumnya HANYA ada di onMouseDown, jadi mobile gak bisa pencet anchor.

        // CLONE anchor check
        if (cloneModeRef.current && stateRef.current.cloneAnchors) {
          const cSelIdsHit = stateRef.current.cloneSelectedIds;
          const cSelCompsHit = stateRef.current.components.filter(c => cSelIdsHit.includes(c.id));
          const cHitResult = cSelCompsHit.length > 0 ? calcAnchorsFromComponents(cSelCompsHit, stateRef.current.view) : null;
          const cHitAnchors = cHitResult ? cHitResult.anchors : stateRef.current.cloneAnchors;
          const dirs = ['top', 'bottom', 'left', 'right'];
          for (const dir of dirs) {
            const pt = cHitAnchors[dir];
            if (!pt) continue;
            if (Math.sqrt((sx - pt.x) ** 2 + (sy - pt.y) ** 2) < 24) {
              const fakeEvt = { clientX: sx + canvas.getBoundingClientRect().left, clientY: sy + canvas.getBoundingClientRect().top, button: 0, preventDefault: () => {} };
              onMouseDown(fakeEvt);
              return;
            }
          }
        }

        // MOVE anchor check
        if (moveModeRef.current && stateRef.current.moveAnchors && !stateRef.current.moveActiveDir) {
          const mSelIdsHit = stateRef.current.moveSelectedIds;
          const mSelCompsHit = stateRef.current.components.filter(c => mSelIdsHit.includes(c.id));
          const mHitResult = mSelCompsHit.length > 0 ? calcAnchorsFromComponents(mSelCompsHit, stateRef.current.view) : null;
          const mHitAnchors = mHitResult ? mHitResult.anchors : stateRef.current.moveAnchors;
          const dirs = ['top', 'bottom', 'left', 'right'];
          for (const dir of dirs) {
            const pt = mHitAnchors[dir];
            if (!pt) continue;
            if (Math.sqrt((sx - pt.x) ** 2 + (sy - pt.y) ** 2) < 24) {
              const fakeEvt = { clientX: sx + canvas.getBoundingClientRect().left, clientY: sy + canvas.getBoundingClientRect().top, button: 0, preventDefault: () => {} };
              onMouseDown(fakeEvt);
              return;
            }
          }
        }

        // ROTATE anchor check
        if (rotateModeRef.current && stateRef.current.rotateAnchors) {
          const rSelIdsHit = stateRef.current.rotateSelectedIds;
          const rSelCompsHit = stateRef.current.components.filter(c => rSelIdsHit.includes(c.id));
          const rHitResult = rSelCompsHit.length > 0 ? calcRotateAnchorsFromMEC(rSelCompsHit, stateRef.current.view) : null;
          const rHitAnchors = rHitResult ? rHitResult.anchors : stateRef.current.rotateAnchors;
          const dirs = ['top', 'bottom', 'left', 'right'];
          for (const dir of dirs) {
            const pt = rHitAnchors[dir];
            if (!pt) continue;
            if (Math.sqrt((sx - pt.x) ** 2 + (sy - pt.y) ** 2) < 24) {
              const fakeEvt = { clientX: sx + canvas.getBoundingClientRect().left, clientY: sy + canvas.getBoundingClientRect().top, button: 0, preventDefault: () => {} };
              onMouseDown(fakeEvt);
              return;
            }
          }
        }

        // Hit test dulu — kalau kena node/drag-handle/body, emulate mouse behavior.
        const { x: mx, y: my } = screenToWorld(sx, sy);
        const hit = hitTest(mx, my, stateRef.current.components);

        // ── DELETE MODE (mobile): tap wire/komponen = hapus. Drag, wiring, toggle di-block. ──
        if (deleteModeRef.current) {
          if (hit) {
            deleteComponent(hit.comp.id);
            return;
          }
          const wireHit = hitTestWire(mx, my, stateRef.current.wires, stateRef.current.components);
          if (wireHit) {
            deleteWire(wireHit.wire.id);
            return;
          }
          // Empty tap → just clear selection, no pan/drag.
          setSelectedId(null);
          setColorPicker(null);
          return;
        }

        // ── PICK FROM WORKSPACE MODE (mobile): prioritas tertinggi, dicek SEBELUM paintMode ──
        if (pickFromWorkspaceRef.current) {
          const savedPicker = pickFromWorkspaceRef.current;
          const isSlotPicker = savedPicker.source === 'slot';
          let pickedHex = null;
          if (hit) {
            const comp = hit.comp;
            const def = GATE_MAP[comp.type] || IO_DEFS[comp.type];
            pickedHex = comp.userColor || def.color;
          } else {
            const wireHit = hitTestWire(mx, my, stateRef.current.wires, stateRef.current.components);
            if (wireHit) {
              const w = wireHit.wire;
              pickedHex = w.userColor || (w.color ? hslToHex(w.color.h, w.color.s, 50) : '#4ade80');
            }
          }
          if (pickedHex) {
            if (isSlotPicker) {
              setSlotColorEdit({ slotIndex: savedPicker.slotIndex, draftHex: pickedHex });
            } else {
              setColorPicker({ ...savedPicker, hex: pickedHex });
            }
            setPickFromWorkspace(null);
            setStatus('Color picked: ' + pickedHex.toUpperCase());
          } else {
            setPickFromWorkspace(null);
            if (isSlotPicker) {
              setSlotColorEdit({ slotIndex: savedPicker.slotIndex, draftHex: savedPicker.draftHex });
            } else {
              setColorPicker(savedPicker);
            }
            setStatus('Pick cancelled — tap a component or wire next time');
          }
          return;
        }

        // ── PAINT MODE (mobile): tap wire/komponen = buka color picker. Drag, wiring, toggle di-block. ──
        if (paintModeRef.current) {
          if (hit) {
            const comp = hit.comp;
            const def = GATE_MAP[comp.type] || IO_DEFS[comp.type];
            const currentHex = comp.userColor || def.color;
            setColorPicker({ targetType: 'comp', targetId: comp.id, x: sx, y: sy, hex: currentHex, originalHex: currentHex });
            setStatus('Component tapped — pick a color, then confirm');
            return;
          }
          const wireHit = hitTestWire(mx, my, stateRef.current.wires, stateRef.current.components);
          if (wireHit) {
            const w = wireHit.wire;
            const currentHex = w.userColor || (w.color ? hslToHex(w.color.h, w.color.s, 50) : '#4ade80');
            setColorPicker({ targetType: 'wire', targetId: w.id, x: sx, y: sy, hex: currentHex, originalHex: currentHex });
            setStatus('Wire tapped — pick a color, then confirm');
            return;
          }
          // Empty tap → tutup picker kalau kebuka, no pan/drag.
          setColorPicker(null);
          setSelectedId(null);
          return;
        }

        if (hit) {
          // ── Connect Wire mode: zone-based port selection (same as onMouseDown) ──
          // Di connect mode, touch component body = zone-based port selection.
          // Switch toggle & component drag di-disable di connect mode.
          if (modeRef.current === 'connect') {
            const zone = hitTestZone(mx, my, hit.comp);
            if (!zone) return;
            if (zone.kind === 'output') {
              stateRef.current.wiring = { fromComp: hit.comp, fromIdx: zone.idx, mx, my };
              setStatus('Wiring... tap an input zone to connect');
            } else if (zone.kind === 'input') {
              if (stateRef.current.wiring) {
                completeWire(stateRef.current.wiring.fromComp, stateRef.current.wiring.fromIdx, hit.comp, zone.idx);
              } else {
                setStatus('Tap an output zone first to start a wire');
              }
            }
            return;
          }
          // ── Build mode: drag & toggle only. Port-based wiring DILARANG di build mode
          // (konsisten dengan onMouseDown). User request: 'ketika mode build maka user
          // tidak bisa pencet port untuk menyambungkan kabel'. Port hit di-convert jadi
          // body behavior: drag gate, atau toggle Switch (via touchend tap detection). ──
          if (hit.kind === 'drag-handle') {
            setSelectedId(hit.comp.id);
            stateRef.current.dragging = hit.comp;
            stateRef.current.dragOffset = { x: mx - hit.comp.x, y: my - hit.comp.y };
            setStatus('Dragging ' + (IO_DEFS[hit.comp.type]?.name || hit.comp.type));
          } else if (hit.kind === 'body' || hit.kind === 'output' || hit.kind === 'input') {
            // Body ATAU port hit — di-build mode, port bulat kecil gak boleh trigger
            // wiring. Treat sebagai body: drag gate, atau mark Switch buat toggle.
            if (hit.comp.type !== 'INPUT') {
              setSelectedId(hit.comp.id);
              stateRef.current.dragging = hit.comp;
              stateRef.current.dragOffset = { x: mx - hit.comp.x, y: my - hit.comp.y };
            } else {
              // Switch body: mark untuk toggle on touchend (kalau gak drag).
              touchStateRef.current.toggleCandidate = hit.comp;
            }
          }
        } else {
          // Empty area: check mode untuk select box vs panning
          if (moveModeRef.current) {
            // Move mode: 1 finger = pan workspace (2 fingers = select box, handled in pinch section)
            const v = stateRef.current.view;
            touchStateRef.current.panStart = { startSX: sx, startSY: sy, startVX: v.x, startVY: v.y };
          } else if (rotateModeRef.current) {
            // Rotate mode: 1-finger DISABLED — no select box, no pan.
            // Select box only via 2-finger pinch. 1 finger = nothing.
          } else if (cloneModeRef.current) {
            // Clone mode: 1-finger DISABLED — no select box, no pan.
            // Select box only via 2-finger pinch. 1 finger = nothing.
          } else if (modeRef.current === 'connect') {
            // Connect wire mode: 1-finger pan DISABLED — user must use 2 fingers to pan.
            // Single finger on empty space = nothing (prevents accidental workspace movement).
          } else {
            // Start panning canvas (1-finger drag = pan).
            const v = stateRef.current.view;
            touchStateRef.current.panStart = { startSX: sx, startSY: sy, startVX: v.x, startVY: v.y };
          }
        }
      } else if (pointers.length === 2) {
        // ── TWO FINGERS: pinch-to-zoom + 2-finger pan ──
        // Cancel any single-touch action (drag/wiring) — switch ke gesture mode.
        stateRef.current.dragging = null;
        stateRef.current.wiring = null;
        touchStateRef.current.toggleCandidate = null;
        const [p1, p2] = pointers;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const v = stateRef.current.view;

        // ── MOBILE: pinch-to-select-box when move/rotate/clone mode active ──
        // Move mode: 1 finger = pan, 2 fingers = select box
        // Rotate/Clone mode: 2-finger = select box
        const isSelectBoxMode = moveModeRef.current || rotateModeRef.current || cloneModeRef.current;
        if (isSelectBoxMode) {
          // Pinch = select box mode, BUKAN zoom
          // Simpan pinch start + mode + initial select box center (world coords)
          const { x: worldMidX, y: worldMidY } = screenToWorld(midX, midY);
          touchStateRef.current.pinchStart = {
            dist, midX, midY,
            viewX: v.x, viewY: v.y, scale: v.scale,
            selectBoxMode: true,
            selectBoxCenterWorld: { x: worldMidX, y: worldMidY },
            selectBoxStartDist: dist,
            mode: moveModeRef.current ? 'move' : (rotateModeRef.current ? 'rotate' : 'clone'),
          };
          // Initialize select box di midpoint (world coords)
          const { x: wmx, y: wmy } = screenToWorld(midX, midY);
          const halfSize = 0; // mulai dari 0, membesar saat zoom out
          if (moveModeRef.current) {
            setMoveBox({ sx: midX, sy: midY, ex: midX, ey: midY });
            setMoveSelectedIds([]);
            setMoveAnchors(null);
            setMoveActiveDir(null);
          } else if (rotateModeRef.current) {
            setRotateBox({ sx: midX, sy: midY, ex: midX, ey: midY });
            setRotateSelectedIds([]);
            setRotateAnchors(null);
          } else if (cloneModeRef.current) {
            setCloneBox({ sx: midX, sy: midY, ex: midX, ey: midY });
            setCloneSelectedIds([]);
            setCloneAnchors(null);
          }
        } else {
          // Normal pinch zoom
          touchStateRef.current.pinchStart = {
            dist, midX, midY,
            viewX: v.x, viewY: v.y, scale: v.scale,
          };
        }
      }
    };

    const onTouchMove = (e) => {
      if (e.cancelable) e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      // Update semua touch yang bergerak.
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const sx = t.clientX - rect.left;
        const sy = t.clientY - rect.top;
        if (touchStateRef.current.pointers.has(t.identifier)) {
          touchStateRef.current.pointers.set(t.identifier, { x: sx, y: sy });
        }
      }

      const pointers = Array.from(touchStateRef.current.pointers.values());

      if (pointers.length === 2 && touchStateRef.current.pinchStart) {
        const ps = touchStateRef.current.pinchStart;
        const [p1, p2] = pointers;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        if (ps.selectBoxMode) {
          // ── MOBILE PINCH-TO-SELECT-BOX: update select box size & position ──
          // Select box center = midpoint jari (dikonversi ke world lalu balik ke screen
          // supaya konsisten dengan select box system yang pakai screen coords).
          // Select box size = proporsional terhadap jarak antar jari (zoom out = membesar).
          const v = stateRef.current.view;
          const { x: worldMidX, y: worldMidY } = screenToWorld(midX, midY);

          // Half-size di world coords: scale dari jarak jari
          // Saat zoom out (jari menjauh), dist membesar → select box membesar
          // Saat zoom in (jari mendekat), dist mengecil → select box mengecil
          const halfWorldSize = (dist / 2) / v.scale;

          // Convert ke screen coords untuk select box state
          const sx1 = (worldMidX - halfWorldSize) * v.scale + v.x;
          const sy1 = (worldMidY - halfWorldSize) * v.scale + v.y;
          const sx2 = (worldMidX + halfWorldSize) * v.scale + v.x;
          const sy2 = (worldMidY + halfWorldSize) * v.scale + v.y;

          // Update select box untuk mode yang aktif
          if (ps.mode === 'move') {
            setMoveBox({ sx: sx1, sy: sy1, ex: sx2, ey: sy2 });
          } else if (ps.mode === 'rotate') {
            setRotateBox({ sx: sx1, sy: sy1, ex: sx2, ey: sy2 });
          } else if (ps.mode === 'clone') {
            setCloneBox({ sx: sx1, sy: sy1, ex: sx2, ey: sy2 });
          }
        } else {
          // ── PINCH ZOOM + 2-FINGER PAN (normal) ──
          // Scale ratio relative to pinch start.
          const scaleFactor = dist / ps.dist;
          const newScale = Math.max(0.2, Math.min(5, ps.scale * scaleFactor));
          // Pan offset: gerak midpoint dari start midpoint.
          const panDx = midX - ps.midX;
          const panDy = midY - ps.midY;
          // Compute new view: keep pinch midpoint stable di world space.
          const worldMidX = (ps.midX - ps.viewX) / ps.scale;
          const worldMidY = (ps.midY - ps.viewY) / ps.scale;
          const v = stateRef.current.view;
          v.scale = newScale;
          v.x = midX - worldMidX * newScale + panDx;
          v.y = midY - worldMidY * newScale + panDy;
          setZoomPct(Math.round(newScale * 100));
        }
      } else if (pointers.length === 1) {
        // ── SINGLE TOUCH MOVE: drag/pan/wiring ──
        const sx = pointers[0].x;
        const sy = pointers[0].y;
        // Track movement buat detect tap vs drag.
        if (touchStateRef.current.touchStart) {
          const ts = touchStateRef.current.touchStart;
          if (Math.hypot(sx - ts.sx, sy - ts.sy) > 4) ts.moved = true;
        }
        const { x: mx, y: my } = screenToWorld(sx, sy);
        // Update coordinate display (fix bug 'X --- Y ---' tampil terus di mobile).
        setCursorWorld({ x: Math.round(mx), y: Math.round(my) });

        // Connect mode: track zona yang di-hover buat visual feedback (mobile).
        if (modeRef.current === 'connect') {
          const hit = hitTest(mx, my, stateRef.current.components);
          if (hit) {
            const zone = hitTestZone(mx, my, hit.comp);
            stateRef.current.hoverZone = zone ? { compId: hit.comp.id, kind: zone.kind, idx: zone.idx } : null;
          } else {
            stateRef.current.hoverZone = null;
          }
        }

        // Panning (empty area drag, 1 finger).
        if (touchStateRef.current.panStart) {
          const p = touchStateRef.current.panStart;
          const v = stateRef.current.view;
          v.x = p.startVX + (sx - p.startSX);
          v.y = p.startVY + (sy - p.startSY);
        }
        // Wiring follow finger.
        if (stateRef.current.wiring) {
          stateRef.current.wiring.mx = mx;
          stateRef.current.wiring.my = my;
        }
        // Dragging component.
        if (stateRef.current.dragging) {
          const comp = stateRef.current.dragging;
          comp.x = mx - stateRef.current.dragOffset.x;
          comp.y = my - stateRef.current.dragOffset.y;
          setComponents([...stateRef.current.components]);
        }

        // ── MOBILE: Select box drag (move/rotate/clone) & move anchor drag ──
        // Emulate mousemove untuk mode select box & move active dir
        if (moveModeRef.current) {
          // Move select box drag
          if (stateRef.current.moveBox && !stateRef.current.moveAnchors) {
            const box = stateRef.current.moveBox;
            setMoveBox({ ...box, ex: sx, ey: sy });
          }
          // Move anchor drag (moveActiveDir)
          if (stateRef.current.moveActiveDir && stateRef.current.moveDragStart) {
            const mds = stateRef.current.moveDragStart;
            const selIds = stateRef.current.moveSelectedIds;
            const selComps = stateRef.current.components.filter(c => selIds.includes(c.id));
            if (selComps.length > 0) {
              // Free 2D movement — same logic as onMouseMove (PC)
              const dxWorld = (sx - mds.sx) / stateRef.current.view.scale;
              const dyWorld = (sy - mds.sy) / stateRef.current.view.scale;
              const newComps = stateRef.current.components.map(c => {
                if (!selIds.includes(c.id)) return c;
                const startC = mds.comps.find(mc => mc.id === c.id);
                if (!startC) return c;
                return { ...c, x: startC.x + dxWorld, y: startC.y + dyWorld };
              });
              const { comps: simComps, wrs: simWrs } = simulate(newComps, stateRef.current.wires);
              setComponents(simComps);
              setWires(simWrs);
              // Update move box to follow dragged components
              const mb = stateRef.current.moveBox;
              if (mb) {
                setMoveBox({
                  sx: mb.sx + (sx - (stateRef.current._lastMoveSx || mds.sx)),
                  sy: mb.sy + (sy - (stateRef.current._lastMoveSy || mds.sy)),
                  ex: mb.ex + (sx - (stateRef.current._lastMoveSx || mds.sx)),
                  ey: mb.ey + (sy - (stateRef.current._lastMoveSy || mds.sy))
                });
              }
              stateRef.current._lastMoveSx = sx;
              stateRef.current._lastMoveSy = sy;
            }
          }
        }
        if (rotateModeRef.current && stateRef.current.rotateBox && !stateRef.current.rotateAnchors) {
          const box = stateRef.current.rotateBox;
          setRotateBox({ ...box, ex: sx, ey: sy });
        }
        if (cloneModeRef.current && stateRef.current.cloneBox && !stateRef.current.cloneAnchors) {
          const box = stateRef.current.cloneBox;
          setCloneBox({ ...box, ex: sx, ey: sy });
        }
      }
    };

    const onTouchEnd = (e) => {
      // Hapus touch yang selesai dari pointers map.
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        touchStateRef.current.pointers.delete(t.identifier);
      }
      const pointers = Array.from(touchStateRef.current.pointers.values());

      if (pointers.length < 2) {
        // Pinch selesai (kurang dari 2 jari) — finalize select box jika mode aktif.
        const ps = touchStateRef.current.pinchStart;
        if (ps && ps.selectBoxMode) {
          // ── MOBILE: finalize pinch-to-select-box ──
          // Cari komponen yang ada di dalam select box, lalu tampilkan anchor.
          const v = stateRef.current.view;
          const comps = stateRef.current.components;

          if (ps.mode === 'move') {
            const box = stateRef.current.moveBox;
            if (box) {
              const { x: wx1, y: wy1 } = screenToWorld(Math.min(box.sx, box.ex), Math.min(box.sy, box.ey));
              const { x: wx2, y: wy2 } = screenToWorld(Math.max(box.sx, box.ex), Math.max(box.sy, box.ey));
              const inside = comps.filter(c =>
                c.x + c.width > wx1 && c.x < wx2 &&
                c.y + c.height > wy1 && c.y < wy2
              );
              setMoveSelectedIds(inside.map(c => c.id));
              setMoveAnchors(inside.length > 0 ? calcAnchorsFromComponents(inside, v) : null);
            }
            // Clear select box visual (anchor stays)
            setMoveBox(null);
          } else if (ps.mode === 'rotate') {
            const box = stateRef.current.rotateBox;
            if (box) {
              const { x: wx1, y: wy1 } = screenToWorld(Math.min(box.sx, box.ex), Math.min(box.sy, box.ey));
              const { x: wx2, y: wy2 } = screenToWorld(Math.max(box.sx, box.ex), Math.max(box.sy, box.ey));
              const inside = comps.filter(c =>
                c.x + c.width > wx1 && c.x < wx2 &&
                c.y + c.height > wy1 && c.y < wy2
              );
              setRotateSelectedIds(inside.map(c => c.id));
              setRotateAnchors(inside.length > 0 ? 'active' : null); // placeholder — akan di-recompute tiap frame
            }
            setRotateBox(null);
          } else if (ps.mode === 'clone') {
            const box = stateRef.current.cloneBox;
            if (box) {
              const { x: wx1, y: wy1 } = screenToWorld(Math.min(box.sx, box.ex), Math.min(box.sy, box.ey));
              const { x: wx2, y: wy2 } = screenToWorld(Math.max(box.sx, box.ex), Math.max(box.sy, box.ey));
              const inside = comps.filter(c =>
                c.x + c.width > wx1 && c.x < wx2 &&
                c.y + c.height > wy1 && c.y < wy2
              );
              setCloneSelectedIds(inside.map(c => c.id));
              setCloneAnchors(inside.length > 0 ? calcAnchorsFromComponents(inside, v) : null);
            }
            setCloneBox(null);
          }
        }
        touchStateRef.current.pinchStart = null;
      }
      if (pointers.length === 0) {
        // Semua jari diangkat — finalize single-touch action.

        // ── MOBILE: Finalize select box (single-touch drag) untuk move/rotate/clone ──
        const v = stateRef.current.view;
        const comps = stateRef.current.components;
        if (moveModeRef.current && stateRef.current.moveBox && !moveAnchorsRef.current) {
          const box = stateRef.current.moveBox;
          const { x: wx1, y: wy1 } = screenToWorld(Math.min(box.sx, box.ex), Math.min(box.sy, box.ey));
          const { x: wx2, y: wy2 } = screenToWorld(Math.max(box.sx, box.ex), Math.max(box.sy, box.ey));
          const inside = comps.filter(c => c.x + c.width > wx1 && c.x < wx2 && c.y + c.height > wy1 && c.y < wy2);
          setMoveSelectedIds(inside.map(c => c.id));
          setMoveAnchors(inside.length > 0 ? calcAnchorsFromComponents(inside, v) : null);
          setMoveBox(null);
          setMoveActiveDir(null);
        }
        if (rotateModeRef.current && stateRef.current.rotateBox && !rotateAnchorsRef.current) {
          const box = stateRef.current.rotateBox;
          const { x: wx1, y: wy1 } = screenToWorld(Math.min(box.sx, box.ex), Math.min(box.sy, box.ey));
          const { x: wx2, y: wy2 } = screenToWorld(Math.max(box.sx, box.ex), Math.max(box.sy, box.ey));
          const inside = comps.filter(c => c.x + c.width > wx1 && c.x < wx2 && c.y + c.height > wy1 && c.y < wy2);
          setRotateSelectedIds(inside.map(c => c.id));
          setRotateAnchors(inside.length > 0 ? 'active' : null);
          setRotateBox(null);
        }
        if (cloneModeRef.current && stateRef.current.cloneBox && !cloneAnchorsRef.current) {
          const box = stateRef.current.cloneBox;
          const { x: wx1, y: wy1 } = screenToWorld(Math.min(box.sx, box.ex), Math.min(box.sy, box.ey));
          const { x: wx2, y: wy2 } = screenToWorld(Math.max(box.sx, box.ex), Math.max(box.sy, box.ey));
          const inside = comps.filter(c => c.x + c.width > wx1 && c.x < wx2 && c.y + c.height > wy1 && c.y < wy2);
          setCloneSelectedIds(inside.map(c => c.id));
          setCloneAnchors(inside.length > 0 ? calcAnchorsFromComponents(inside, v) : null);
          setCloneBox(null);
        }
        // Move anchor drag selesai
        if (moveModeRef.current && stateRef.current.moveActiveDir) {
          setMoveActiveDir(null);
          stateRef.current.moveDragStart = null;
          stateRef.current._lastMoveSx = null;
          stateRef.current._lastMoveSy = null;
          // Recompute anchors based on current component positions
          const mb = stateRef.current.moveBox;
          if (mb) {
            const selIds = stateRef.current.moveSelectedIds;
            const selComps = stateRef.current.components.filter(c => selIds.includes(c.id));
            const v = stateRef.current.view;
            const result = calcAnchorsFromComponents(selComps, v);
            if (result) {
              setMoveBox(null); // Clear box — anchors + selectedIds are sufficient
              setMoveAnchors(result.anchors);
            }
          }
          const { comps: simComps, wrs: simWrs } = simulate(stateRef.current.components, stateRef.current.wires);
          setComponents(simComps);
          setWires(simWrs);
        }

        // ── Connect mode: drop-to-connect ──
        // Bug fix: sebelumnya wiring langsung di-clear di akhir onTouchEnd tanpa
        // check zona lepas. User tekan zona output → drag ke komponen lain → lepas
        // di zona input → harusnya nyambung, tapi gak pernah ke-trigger.
        // Fix: baca posisi jari terakhir dari changedTouches[0], convert ke world
        // coords, hit test. Kalau kena zona input komponen lain → completeWire.
        if (modeRef.current === 'connect' && stateRef.current.wiring) {
          const t = e.changedTouches[0];
          if (t) {
            const rect = canvas.getBoundingClientRect();
            const sx = t.clientX - rect.left;
            const sy = t.clientY - rect.top;
            const { x: mx, y: my } = screenToWorld(sx, sy);
            const hit = hitTest(mx, my, stateRef.current.components);
            if (hit) {
              const zone = hitTestZone(mx, my, hit.comp);
              if (zone && zone.kind === 'input') {
                completeWire(
                  stateRef.current.wiring.fromComp,
                  stateRef.current.wiring.fromIdx,
                  hit.comp,
                  zone.idx
                );
              } else if (zone && zone.kind === 'output' && hit.comp.id !== stateRef.current.wiring.fromComp.id) {
                // User lepas di zona output komponen lain — gak valid (output→output).
                setStatus('Drop on an INPUT zone to connect');
              }
            }
          }
        }

        // Toggle Switch body kalau ini tap (gak moved), bukan drag.
        if (touchStateRef.current.toggleCandidate && touchStateRef.current.touchStart) {
          const ts = touchStateRef.current.touchStart;
          const isTap = !ts.moved && (Date.now() - ts.time < 400);
          if (isTap) {
            const comp = touchStateRef.current.toggleCandidate;
            // Fix: gunakan immutable update (sama seperti onMouseDown) & update wires juga.
            // Bug sebelumnya: mutate in-place + hanya setComponents tanpa setWires
            // → wire.value gak ke-update → ghost current / animasi masih muncul saat OFF.
            const comps = stateRef.current.components.map(c =>
              c.id === comp.id ? { ...c, outputs: [!c.outputs[0]] } : c
            );
            const { comps: newComps, wrs: newWrs } = simulate(comps, stateRef.current.wires);
            setComponents(newComps);
            setWires(newWrs);
            setStatus('Switch ' + (comp.typeNum || 1) + (newComps.find(c => c.id === comp.id).outputs[0] ? ' ON' : ' OFF'));
          }
        }
        // Clear single-touch state.
        stateRef.current.dragging = null;
        stateRef.current.wiring = null;
        touchStateRef.current.panStart = null;
        touchStateRef.current.touchStart = null;
        touchStateRef.current.toggleCandidate = null;
      } else if (pointers.length === 1) {
        // Dari 2 jari → 1 jari: reset panStart ke posisi jari tersisa (start new single-touch pan).
        // BUT: disable 1-finger pan in rotate/clone/connect modes — workspace must not move.
        stateRef.current.dragging = null;
        stateRef.current.wiring = null;
        if (!rotateModeRef.current && !cloneModeRef.current && modeRef.current !== 'connect') {
          const p = pointers[0];
          const v = stateRef.current.view;
          touchStateRef.current.panStart = { startSX: p.x, startSY: p.y, startVX: v.x, startVY: v.y };
        } else {
          touchStateRef.current.panStart = null;
        }
      }
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [hitTest, hitTestWire, hitTestZone, completeWire, simulate, wouldCreateCycle, selectedId, getNodePos, screenToWorld, zoomAt, deleteWire, deleteComponent]);

  // ── Resize canvas ──
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = canvas?.parentElement;
    if (!canvas || !wrap) return;
    const resize = () => {
      canvas.width = wrap.clientWidth;
      canvas.height = wrap.clientHeight;
      // Minimap canvas: fixed 160x110 (ukuran display == ukuran internal, gak perlu DPR).
      const mini = minimapRef.current;
      if (mini) {
        mini.width = 160;
        mini.height = 110;
      }
      // Update mobile flag (responsive header/layout switch).
      setIsMobile(window.innerWidth < 768);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    // Window resize listener (orientation change, keyboard popup di mobile, dll).
    window.addEventListener('resize', resize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ── Minimap interaction (click dot → pan to component / click empty → pan to point) ──
  // User request: 'titik titik berwarna di mini map dapat dipencet dan jika dipencet
  // akan mengarah ke lokasi dimana komponen tersebut diletakkan, dan juga user mobile
  // pastinya wajib merasakan fitur ini'.
  // Behavior:
  // - Click/drag di dalam hit radius dot komponen → pan view supaya komponen itu di center canvas.
  // - Click/drag di area kosong → pan view ke world point itu (behavior lama).
  // - Drag = pan terus selama mouse/finger down.
  // Mobile: touchstart/touchmove/touchend didukung penuh (user request: 'user mobile wajib merasakan').
  useEffect(() => {
    const mini = minimapRef.current;
    if (!mini) return;
    let dragging = false;

    // Convert clientX/Y → minimap internal coords (0..160, 0..110).
    const clientToMini = (clientX, clientY) => {
      const rect = mini.getBoundingClientRect();
      const mx = (clientX - rect.left) * (mini.width / rect.width);
      const my = (clientY - rect.top) * (mini.height / rect.height);
      return { mx, my };
    };

    // Convert minimap internal coords → world coords.
    const miniToWorld = (mx, my) => {
      const t = stateRef.current.minimap;
      if (!t) return null;
      return {
        x: t.minX + (mx - t.offX) / t.s,
        y: t.minY + (my - t.offY) / t.s,
      };
    };

    // Legacy helper: convert mouse event → world point (dipakai panTo).
    const miniToView = (e) => {
      const { mx, my } = clientToMini(e.clientX, e.clientY);
      return miniToWorld(mx, my);
    };

    // Find component dot yang kena hit. Hit radius 7px (sedikit lebih gede dari visual radius 4px
    // supaya gampang diklik di mobile). Return component object atau null.
    const findDotHit = (mx, my) => {
      const t = stateRef.current.minimap;
      if (!t) return null;
      const comps = stateRef.current.components;
      let nearest = null;
      let nearestDist = Infinity;
      for (const c of comps) {
        const w = c.width || 90;
        const h = c.height || 56;
        // Dot position di minimap internal coords.
        const dotX = t.offX + (c.x + w / 2 - t.minX) * t.s;
        const dotY = t.offY + (c.y + h / 2 - t.minY) * t.s;
        const dist = Math.hypot(mx - dotX, my - dotY);
        if (dist < 7 && dist < nearestDist) {
          nearest = c;
          nearestDist = dist;
        }
      }
      return nearest;
    };

    // Pan view supaya world point wp ada di center canvas.
    const panTo = (wp) => {
      const canvas = canvasRef.current;
      if (!canvas || !wp) return;
      const v = stateRef.current.view;
      v.x = canvas.width / 2 - wp.x * v.scale;
      v.y = canvas.height / 2 - wp.y * v.scale;
    };

    // Pan view supaya component c ada di center canvas.
    // Center comp = (c.x + w/2, c.y + h/2) di world coords.
    const panToComponent = (c) => {
      const w = c.width || 90;
      const h = c.height || 56;
      panTo({ x: c.x + w / 2, y: c.y + h / 2 });
    };

    // ── MOUSE handlers ──
    const onMouseDown = (e) => {
      dragging = true;
      const { mx, my } = clientToMini(e.clientX, e.clientY);
      // Cek apakah kena dot komponen. Kalau iya, pan ke component center.
      // Kalau gak, pan ke world point yang diklik (behavior lama).
      const hit = findDotHit(mx, my);
      if (hit) {
        panToComponent(hit);
      } else {
        panTo(miniToWorld(mx, my));
      }
      e.preventDefault();
    };
    const onMouseMove = (e) => {
      if (!dragging) return;
      // Selama drag, pan ke posisi mouse (gak prioritaskan dot — drag = free pan).
      panTo(miniToView(e));
    };
    const onMouseUp = () => { dragging = false; };

    // ── TOUCH handlers (mobile support) ──
    // Touch event punya struktur beda (e.touches, e.changedTouches).
    // Touchstart: cek dot hit → pan ke component. Kalau gak, pan ke world point.
    // Touchmove: free pan (ikuti jari).
    // Touchend: clear dragging.
    const onTouchStart = (e) => {
      if (e.cancelable) e.preventDefault();
      const t = e.touches[0];
      if (!t) return;
      dragging = true;
      const { mx, my } = clientToMini(t.clientX, t.clientY);
      const hit = findDotHit(mx, my);
      if (hit) {
        panToComponent(hit);
      } else {
        panTo(miniToWorld(mx, my));
      }
    };
    const onTouchMove = (e) => {
      if (!dragging) return;
      if (e.cancelable) e.preventDefault();
      const t = e.touches[0];
      if (!t) return;
      panTo(miniToView({ clientX: t.clientX, clientY: t.clientY }));
    };
    const onTouchEnd = () => { dragging = false; };

    mini.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    mini.addEventListener('touchstart', onTouchStart, { passive: false });
    mini.addEventListener('touchmove', onTouchMove, { passive: false });
    mini.addEventListener('touchend', onTouchEnd, { passive: false });
    mini.addEventListener('touchcancel', onTouchEnd, { passive: false });
    return () => {
      mini.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      mini.removeEventListener('touchstart', onTouchStart);
      mini.removeEventListener('touchmove', onTouchMove);
      mini.removeEventListener('touchend', onTouchEnd);
      mini.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  // ── Palette drag ──
  // Bug lama: comp dibuat saat drag > 10px dari start — padahal start ada di palette (sebelah kiri canvas),
  // jadi posisi mouse masih di palette → mx negatif → comp dibuat di luar canvas (gak kelihatan).
  // Fix: comp dibuat saat MOUSEUP, HANYA kalau mouse berada di area canvas.
  // Selama drag, cursor jadi grabbing + ghost component follow cursor supaya user tahu lagi ngedrag apa.
  const [paletteDrag, setPaletteDrag] = useState(null);
  const [dragGhost, setDragGhost] = useState(null);  // { type, x, y } — visual feedback selama drag
  const onPaletteMouseDown = (type) => (e) => {
    e.preventDefault();
    // Paint Mode & Delete Mode: dilarang drag/drop komponen baru dari palette.
    // User request: 'player tidak dapat mendrag komponen baru' (berlaku untuk kedua mode).
    // Cek via refs (bukan state) supaya selalu baca value terbaru tanpa dependency ke re-render.
    if (paintModeRef.current) {
      setStatus('Turn off Paint mode to add components');
      return;
    }
    if (deleteModeRef.current) {
      setStatus('Turn off Delete mode to add components');
      return;
    }
    if (cloneModeRef.current) {
      setStatus('Turn off Cloning Area mode to add components');
      return;
    }
    if (moveModeRef.current) {
      setStatus('Turn off Move Area mode to add components');
      return;
    }
    if (rotateModeRef.current) {
      setStatus('Turn off Rotate Area mode to add components');
      return;
    }
    // Connect Wire mode: dilarang drag/drop komponen baru dari palette.
    // User request: 'ketika connect wire, maka user masih tetap bisa mendrag atau
    // mendrop komponen baru, harusnya ini dilarang'. Cek via modeRef (bukan state
    // mode) supaya selalu baca value terbaru tanpa dependency ke re-render.
    if (modeRef.current === 'connect') {
      setStatus('Switch to Build mode to add components');
      return;
    }
    // Mouse event (desktop) — startX/Y pakai clientX/Y.
    setPaletteDrag({ type, startX: e.clientX, startY: e.clientY, dragging: false });
  };
  // Touch version untuk palette (mobile) — pakai touch identifier tracking.
  const onPaletteTouchStart = (type) => (e) => {
    e.preventDefault();
    // Paint/Delete/Connect mode: block drag/drop di mobile juga (konsisten dengan desktop).
    if (paintModeRef.current) {
      setStatus('Turn off Paint mode to add components');
      return;
    }
    if (deleteModeRef.current) {
      setStatus('Turn off Delete mode to add components');
      return;
    }
    if (cloneModeRef.current) {
      setStatus('Turn off Cloning Area mode to add components');
      return;
    }
    if (moveModeRef.current) {
      setStatus('Turn off Move Area mode to add components');
      return;
    }
    if (rotateModeRef.current) {
      setStatus('Turn off Rotate Area mode to add components');
      return;
    }
    // Connect Wire mode: block drag/drop di mobile juga (konsisten dengan desktop).
    if (modeRef.current === 'connect') {
      setStatus('Switch to Build mode to add components');
      return;
    }
    const t = e.touches[0];
    if (!t) return;
    setPaletteDrag({ type, startX: t.clientX, startY: t.clientY, dragging: false });
  };
  useEffect(() => {
    if (!paletteDrag) return;
    const onMove = (clientX, clientY) => {
      const dx = clientX - paletteDrag.startX;
      const dy = clientY - paletteDrag.startY;
      if (!paletteDrag.dragging && Math.hypot(dx, dy) > 4) {
        setPaletteDrag({ ...paletteDrag, dragging: true });
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }
      // Update ghost position supaya follow cursor/finger — user bisa lihat lagi ngedrag apa
      if (paletteDrag.dragging) {
        setDragGhost({ type: paletteDrag.type, x: clientX, y: clientY });
      }
    };
    const onUp = (clientX, clientY) => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setDragGhost(null);  // clear ghost
      if (paletteDrag.dragging) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const sx = clientX - rect.left;
          const sy = clientY - rect.top;
          // Cek apakah mouse di-drop di dalam area canvas (screen space check tetap pakai sx,sy)
          if (sx >= 0 && sx <= rect.width && sy >= 0 && sy <= rect.height) {
            // Convert ke world coords sebelum createComponent — supaya posisi comp
            // benar walau viewport sudah di-pan/zoom.
            const { x: mx, y: my } = screenToWorld(sx, sy);
            // Center comp di posisi drop
            const io = IO_DEFS[paletteDrag.type];
            const compW = io ? io.width : (paletteDrag.type === 'not' ? 80 : 90);
            const compH = io ? io.height : 56;
            // Numbering per-type: ambil counter typeCounters[type] + 1 (default 1 kalau belum ada).
            const newTypeNum = (stateRef.current.typeCounters?.[paletteDrag.type] || 0) + 1;
            const comp = createComponent(paletteDrag.type, mx - compW / 2, my - compH / 2, newTypeNum);
            const newComps = [...stateRef.current.components, comp];
            const { comps: simComps, wrs: simWrs } = simulate(newComps, stateRef.current.wires);
            setComponents(simComps);
            setWires(simWrs);
            setNextId(prev => prev + 1);
            setTypeCounters(prev => ({ ...prev, [paletteDrag.type]: newTypeNum }));
            setSelectedId(comp.id);
            const label = (GATE_MAP[paletteDrag.type] || IO_DEFS[paletteDrag.type])?.name || paletteDrag.type;
            setStatus(label + ' ' + newTypeNum + ' added');
          } else {
            setStatus('Drop inside canvas to place component');
          }
        }
      }
      setPaletteDrag(null);
    };
    // Mouse listeners (desktop).
    const onMouseMove = (e) => onMove(e.clientX, e.clientY);
    const onMouseUp = (e) => onUp(e.clientX, e.clientY);
    // Touch listeners (mobile).
    const onTouchMove = (e) => {
      if (e.cancelable) e.preventDefault();
      const t = e.touches[0];
      if (t) onMove(t.clientX, t.clientY);
    };
    const onTouchEnd = (e) => {
      // touchend: pakai changedTouches (jari yang diangkat).
      const t = e.changedTouches[0];
      if (t) onUp(t.clientX, t.clientY);
      else onUp(paletteDrag.startX, paletteDrag.startY);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [paletteDrag, createComponent, screenToWorld]);

  // ── Actions ──
  // Buka dialog konfirmasi sebelum benar-benar clear — mencegah hapus tidak sengaja.
  const clearAll = () => {
    setShowClearConfirm(true);
  };

  // Eksekusi penghapusan setelah user konfirmasi "Ya".
  const performClear = () => {
    setComponents([]);
    setWires([]);
    setSelectedId(null);
    setTypeCounters({});  // ← reset numbering per-type
    setStatus('Canvas cleared');
    setShowClearConfirm(false);
  };

  const cancelClear = () => {
    setShowClearConfirm(false);
    setStatus('Clear dibatalkan');
  };

  const loadDemo = () => {
    setComponents([]);
    setWires([]);
    let id = 1;
    // Counter per-type untuk numbering (Half-Adder: 2 INPUT, 1 XOR, 1 AND, 2 OUTPUT).
    const counters = {};
    const nextNum = (type) => { counters[type] = (counters[type] || 0) + 1; return counters[type]; };
    const mk = (type, x, y) => {
      let w = 90, h = 56, inputCount = 2, outputCount = 1;
      if (type === 'not') { w = 80; inputCount = 1; }
      else if (type === 'INPUT' || type === 'OUTPUT') {
        const io = IO_DEFS[type];
        w = io.width; h = io.height; inputCount = io.inputCount; outputCount = io.outputCount;
      }
      const comp = {
        id: id++, type, typeNum: nextNum(type), x, y, width: w, height: h,
        inputs: Array(inputCount).fill(false),
        outputs: Array(outputCount).fill(false),
        inputWires: Array(inputCount).fill(null),
        outputWires: Array(outputCount).fill([]),
      };
      return comp;
    };
    const inA = mk('INPUT', 50, 80);
    const inB = mk('INPUT', 50, 200);
    const xorGate = mk('xor', 220, 90);
    const andGate = mk('and', 220, 210);
    const sumOut = mk('OUTPUT', 400, 90);
    const carryOut = mk('OUTPUT', 400, 210);

    inA.outputs[0] = false;
    inB.outputs[0] = false;

    // Demo wires: w1 = wire ke-1 (hijau default, color=null). w2..w6 = random colors.
    const w1 = { id: id++, from: inA.id, fromIdx: 0, to: xorGate.id, toIdx: 0, value: false, color: null, userColor: null };
    const w2 = { id: id++, from: inB.id, fromIdx: 0, to: xorGate.id, toIdx: 1, value: false, color: generateWireColor([]), userColor: null };
    const w3 = { id: id++, from: inA.id, fromIdx: 0, to: andGate.id,  toIdx: 0, value: false, color: generateWireColor([w2.color.h]), userColor: null };
    const w4 = { id: id++, from: inB.id, fromIdx: 0, to: andGate.id,  toIdx: 1, value: false, color: generateWireColor([w2.color.h, w3.color.h]), userColor: null };
    const w5 = { id: id++, from: xorGate.id, fromIdx: 0, to: sumOut.id,    toIdx: 0, value: false, color: generateWireColor([w2.color.h, w3.color.h, w4.color.h]), userColor: null };
    const w6 = { id: id++, from: andGate.id,  fromIdx: 0, to: carryOut.id, toIdx: 0, value: false, color: generateWireColor([w2.color.h, w3.color.h, w4.color.h, w5.color.h]), userColor: null };

    xorGate.inputWires[0] = w1.id;
    xorGate.inputWires[1] = w2.id;
    andGate.inputWires[0] = w3.id;
    andGate.inputWires[1] = w4.id;
    sumOut.inputWires[0] = w5.id;
    carryOut.inputWires[0] = w6.id;

    inA.outputWires[0] = [w1.id, w3.id];
    inB.outputWires[0] = [w2.id, w4.id];
    xorGate.outputWires[0] = [w5.id];
    andGate.outputWires[0] = [w6.id];

    const comps = [inA, inB, xorGate, andGate, sumOut, carryOut];
    const wrs = [w1, w2, w3, w4, w5, w6];

    setNextId(id);
    setComponents(comps);
    setWires(wrs);
    setTypeCounters(counters);
    setStatus('Half-Adder demo loaded — toggle switches!');
  };

  // ── Styles ──
  const pageStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100vh',
    backgroundColor: '#0f172a',
    fontFamily: '"Inter", sans-serif',
    color: '#e2e8f0',
    overflow: 'hidden',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isMobile ? '8px 10px' : '12px 20px',
    // Padding kanan ekstra supaya tombol Clear All & Load Demo gak ketutup
    // userBar fixed (Sign In button ~120px / profile pill+reset+logout ~210px) di pojok kanan atas.
    // DI MOBILE: paddingRight kecil (userBar juga collapse, gak fixed). Back button & title scales down.
    paddingRight: isMobile ? 8 : 240,
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    flexShrink: 0,
    flexWrap: isMobile ? 'wrap' : 'nowrap',
    gap: isMobile ? 8 : 0,
  };

  const titleStyle = {
    fontSize: isMobile ? 13 : 16,
    fontWeight: 700,
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? 6 : 10,
    fontFamily: '"Orbitron", sans-serif',
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
  };

  const bodyStyle = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    position: 'relative', // supaya toggle button palette bisa position:absolute relatif ke body
  };

  // Palette sidebar — width: fit-content supaya sidebar nyesuaiin lebar item terpanjang.
  // Animasi toggle pakai maxWidth (0 ↔ 240) supaya smooth (width: fit-content gak bisa animasi).
  // User request (gambar 1): 'dikiecilin sampai mentok teks kiri, tidak membuat teksnya pecah
  // turun kebawah, ukurannya wajib sama semua'. maxWidth diturun 380 → 240 + minWidth dihapus
  // supaya max-content cuma ngukur item (bukan dipaksa 270). Padding & icon box dikecilin biar
  // item content lebih compact (sebelumnya 14px padding + 58px icon box kegedean).
  const paletteStyle = {
    width: paletteOpen ? 'fit-content' : 0,
    maxWidth: paletteOpen ? 240 : 0,
    backgroundColor: '#1e293b',
    borderRight: paletteOpen ? '1px solid #334155' : '1px solid transparent',
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative', // supaya toggle button (di dalam) bisa position:absolute right:8
    transition: 'max-width 0.22s ease, border-color 0.22s ease',
  };

  // Inner palette — width: max-content supaya sidebar nyesuaiin lebar item terpanjang.
  // display: grid 1fr supaya semua item seragam (sama lebar = lebar item terpanjang).
  // User request: 'kalimat lurus maju ke samping, gak dipaksa ke bawah, ukuran ikut teks'.
  // Outer palette fixed width animasi gak bisa (max-content gak numeric), jadi pakai
  // outer width: fit-content + maxWidth animate (0 ↔ 240) supaya toggle smooth.
  // minWidth DIHAPUS — sebelumnya 270 dipaksa biar title muat, tapi bikin item content
  // (gate name pendek2 ~170px) ada whitespace kosong di kanan. Sekarang max-content cuma
  // ngukur item terpanjang; title dikecilin font-nya supaya muat dalam lebar item.
  // className 'palette-scroll' untuk custom scrollbar styling (dark & slim).
  const paletteInnerStyle = {
    width: 'max-content',
    height: '100%',
    backgroundColor: '#1e293b',
    padding: '6px 8px 12px 8px',
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 8,
    opacity: paletteOpen ? 1 : 0,
    transition: 'opacity 0.15s ease',
    boxSizing: 'border-box',
    scrollbarWidth: 'thin',
    scrollbarColor: '#475569 transparent',
  };

  // Palette title — "7 Basic Logic Gates". Putih kinclong (#ffffff) bukan glow.
  // Center align biar estetik & seimbang dengan toggle button di pojok kanan-atas.
  // uppercase dipertahankan biar vibe header tetap ada ( Orbitron font + letter-spacing ).
  // fontSize 11 → 9, letterSpacing 0.8 → 0.3 supaya title muat dalam lebar item (~170px)
  // tanpa minWidth. Sebelumnya title ~150px + 44px toggle = 194px reserved, lebih lebar
  // dari item content — title memaksa sidebar jadi 270px. Sekarang title compact ~100px.
  // marginBottom 0 — gap ke items diatur oleh header row wrapper.
  const paletteTitleStyle = {
    fontSize: 9,
    fontWeight: 700,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    textAlign: 'center',
    marginBottom: 0,
    marginTop: 0,
    fontFamily: '"Orbitron", sans-serif',
    whiteSpace: 'nowrap',
  };

  // Header row — sejajar dengan toggle button (44px tall). Title di-bottom-align
  // (alignItems: 'flex-end') supaya turun & deket ke items, tapi paddingBottom 4 + marginBottom 8
  // = total gap 12px (cukup deket, gak ketempel).
  // User request: 'kebawahin dikit biar dekat ke komponen, tapi jangan terlalu dekat'.
  // Sebelumnya alignItems: 'center' → title di tengah header (jauh dari items).
  const paletteHeaderStyle = {
    height: 44,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 4,
    marginBottom: 8,
    flexShrink: 0,
    boxSizing: 'border-box',
  };

  // Helper: apakah ada mode khusus aktif (connect wire, paint, atau delete).
  // Saat true → sidebar palette redup & gak bisa diklik, tombol mode lain redup.
  const anySpecialMode = mode === 'connect' || paintMode || deleteMode || cloneMode || moveMode || rotateMode;

  // Item style — width 100% supaya semua seragam (stretch ke lebar column grid).
  // Grid 1fr bikin semua item sama lebar = lebar item terpanjang (max-content).
  // User request: 'wajib sama ratakan, patokannya menu yang garisnya terpanjang'.
  // padding 14 → 8, gap 12 → 8 supaya item lebih compact (sebelumnya kegedean).
  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 8px',
    borderRadius: 8,
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    cursor: 'grab',
    userSelect: 'none',
    transition: 'all 0.15s',
    width: '100%',
    boxSizing: 'border-box',
    // Any special mode active (connect/paint/delete): palette items disabled.
    // Opacity dikit + cursor not-allowed supaya user paham item lagi gak bisa dipake.
    ...(anySpecialMode ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
  };

  // Icon box — width 58 → 40, height 40 → 30 supaya item lebih compact.
  // User request (gambar 1): 'dikiecilin sampai mentok teks kiri'. Icon box kegedean
  // bikin item lebar padahal teks nama gate pendek. Dikecilin ke 40x30 masih kelihatan
  // jelas karena MiniGateIcon scale juga diturunin 0.7 → 0.5.
  const iconBoxStyle = (color) => ({
    width: 40, height: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: color + '15',
    color: color,
    flexShrink: 0,
  });

  const canvasWrapStyle = {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  };

  const btnStyle = {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: '"Inter", sans-serif',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  // Tombol Clear All: merah supaya kelihatan destructive — user minta eksplisit.
  const clearBtnStyle = {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid #dc2626',
    backgroundColor: '#dc2626',
    color: '#fff',
    fontSize: 12,
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  // Help text DIHAPUS sepenuhnya — user request (gambar 2): 'tulisan drag from palette
  // switch for toggle apalah itu hilangin aja sepenuhnya dari ini, nanti saya kasih
  // pengantinya tapi hilangin aja sekaran tanpa jejak'. Konstanta helpStyle dipertahankan
  // sebagai empty object supaya referensi `<div style={helpStyle}>` di JSX gak crash kalau
  // lupa dihapus — tapi inline JSX juga dihapus di bawah, jadi ini cuma safety net.
  const helpStyle = { display: 'none' };

  return (
    <div style={pageStyle}>
      {/* Custom scrollbar styling untuk palette — dark & slim biar gak kelihatan putih.
          Inject inline karena React inline style gak support pseudo-element selectors.
          `.palette-scroll` class di-apply ke div inner palette.
          `.save-overlay-scroll` class di-apply ke Save Progress overlay modal. */}
      <style>{`
        .palette-scroll::-webkit-scrollbar { width: 8px; }
        .palette-scroll::-webkit-scrollbar-track { background: transparent; }
        .palette-scroll::-webkit-scrollbar-thumb {
          background-color: #475569;
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .palette-scroll::-webkit-scrollbar-thumb:hover { background-color: #64748b; }
        .palette-scroll::-webkit-scrollbar-corner { background: transparent; }

        .save-overlay-scroll::-webkit-scrollbar { width: 10px; }
        .save-overlay-scroll::-webkit-scrollbar-track {
          background: linear-gradient(180deg, #1a2744 0%, #0f1b30 100%);
          border-radius: 5px;
        }
        .save-overlay-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #5a7a9a 0%, #3a506b 100%);
          border-radius: 5px;
          border: 2px solid #1a2744;
        }
        .save-overlay-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #6b8aaa 0%, #4a6080 100%);
        }
        .save-overlay-scroll { scrollbar-width: thin; scrollbar-color: #5a7a9a #1a2744; }
      `}</style>
      <div style={headerStyle}>
        <div style={titleStyle}>
          <button
            onClick={() => setPage && setPage('logic-gates')}
            title="Back to Logic Gates menu"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: isMobile ? '6px 8px' : '6px 12px', borderRadius: 8,
              border: '1px solid #334155', backgroundColor: '#0f172a',
              color: '#94a3b8', fontSize: 12,
              fontFamily: '"Inter", sans-serif', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#475569'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#334155'; }}
          >
            <ArrowLeft size={14} />{!isMobile && 'Back'}
          </button>
          <span style={{ color: '#4ade80', fontSize: isMobile ? 14 : 18, flexShrink: 0 }}>◉</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isMobile ? 'Simulator 2D' : 'Logic Gates Simulator 2D'}
          </span>
          {/* ── Clear All button — moved here per user request ──
              'tombol clear all geser ke kiri tepat di sebelah teks "logic simulator 2D"
              dan hanya muncul bila tombol delete dalam kondisi on atau delete on,
              jika delete off maka clear all hilang tidak ada dimanapun'.
              Jadi: render HANYA saat deleteMode === true. Saat false, button gak ada di DOM. */}
          {deleteMode && (
            <button
              style={{ ...clearBtnStyle, flexShrink: 0 }}
              onClick={clearAll}
              title="Hapus semua komponen & kabel"
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#b91c1c'; e.currentTarget.style.borderColor = '#b91c1c'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.borderColor = '#dc2626'; }}
            >
              Clear All
            </button>
          )}
        </div>
        {/* Load Demo button dihapus total — user request: 'tombol load demo delete aja'.
            Clear All sudah dipindah ke titleStyle div di atas (next to title text).
            Mobile menu (☰) juga dihapus karena isinya cuma Load Demo + Clear All yang
            sekarang sudah ditangani berbeda. Header kanan sekarang kosong. */}
      </div>
      <div style={bodyStyle}>
        {/* Toggle palette SAAT CLOSED — floating di tepi kiri canvas (left:8).
            Saat palette closed, body palette width=0 & overflow hidden, jadi toggle
            di dalam palette gak kelihatan. Karena itu render toggle terpisah di body
            cuma saat paletteOpen=false. Warna hijau sebagai hint "ada panel bisa dibuka". */}
        {!paletteOpen && (
          <button
            onClick={() => setPaletteOpen(true)}
            title="Buka panel komponen"
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 10,
              border: '1px solid #4ade80',
              backgroundColor: 'rgba(74, 222, 128, 0.15)',
              color: '#4ade80',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#e2e8f0';
              e.currentTarget.style.borderColor = '#4ade80';
              e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#4ade80';
              e.currentTarget.style.borderColor = '#4ade80';
              e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.15)';
            }}
          >
            <PanelLeftOpen size={22} />
          </button>
        )}
        <div style={paletteStyle}>
          {/* Toggle palette SAAT OPEN — di dalam palette div, pojok kanan-atas (right:8 top:8).
              position absolute relatif ke paletteStyle (position:relative).
              Karena palette width: fit-content, toggle ikut mengecil/membesar bareng palette. */}
          {paletteOpen && (
            <button
              onClick={() => setPaletteOpen(false)}
              title="Tutup panel komponen"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 44, height: 44, borderRadius: 10,
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#94a3b8',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#e2e8f0';
                e.currentTarget.style.borderColor = '#4ade80';
                e.currentTarget.style.backgroundColor = '#1e293b';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.borderColor = '#475569';
                e.currentTarget.style.backgroundColor = '#0f172a';
              }}
            >
              <PanelLeftClose size={22} />
            </button>
          )}
          <div style={paletteInnerStyle} className="palette-scroll">
            <div style={paletteHeaderStyle}>
              <div style={paletteTitleStyle}>7 Basic Logic Gates</div>
            </div>
            {GATE_DATA.map(g => (
              <div
                key={g.type}
                style={itemStyle}
                onMouseDown={onPaletteMouseDown(g.type)}
                onTouchStart={onPaletteTouchStart(g.type)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = g.color; e.currentTarget.style.backgroundColor = '#1e293b'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.backgroundColor = '#0f172a'; }}
              >
                <div style={iconBoxStyle(g.color)}>
                  <MiniGateIcon type={g.type} color={g.color} scale={0.5} />
                </div>
                <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, whiteSpace: 'nowrap' }}>{g.name}</span>
              </div>
            ))}
            {/* Section divider — garis pemisah antara Gates dan I/O section.
                User request: 'harusnya ada pembatas' + 'kurang tebel' + 'masih kurang'.
                Naikin bertahap: 1px → 2px → sekarang 3px, color #475569 → #64748b (lebih bright). */}
            <div style={{
              height: 0,
              borderTop: '3px solid #64748b',
              margin: '10px 4px 6px 4px',
              flexShrink: 0,
            }} />
            <div style={{ ...paletteTitleStyle, marginTop: 6, marginBottom: 4 }}>I/O</div>
            <div
              style={itemStyle}
              onMouseDown={onPaletteMouseDown('INPUT')}
              onTouchStart={onPaletteTouchStart('INPUT')}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.backgroundColor = '#0f172a'; }}
            >
              <div style={iconBoxStyle('#f59e0b')}>
                <MiniSwitchIcon color="#f59e0b" scale={0.8} />
              </div>
              <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, whiteSpace: 'nowrap' }}>Switch</span>
            </div>
            <div
              style={itemStyle}
              onMouseDown={onPaletteMouseDown('OUTPUT')}
              onTouchStart={onPaletteTouchStart('OUTPUT')}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.backgroundColor = '#0f172a'; }}
            >
              <div style={iconBoxStyle('#ef4444')}>
                <MiniLEDIcon color="#ef4444" scale={0.8} />
              </div>
              <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, whiteSpace: 'nowrap' }}>LED</span>
            </div>
          </div>
        </div>
        <div style={canvasWrapStyle}>
          <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }} />
          {/* Minimap — overview semua komponen + viewport rect. Pojok kanan atas (gak konflik
              dengan help text top-left, zoom controls bottom-left, AIHelperButton bottom-right). */}
          <div style={{
            position: 'absolute',
            top: 10, right: 10,
            width: 160, height: 110,
            backgroundColor: 'rgba(9, 22, 40, 0.6)',
            border: '1px solid #334155',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(4px)',
            cursor: 'pointer',
            zIndex: 5,
          }}
            title="Click dot komponen untuk pan ke lokasinya, atau click area kosong untuk pan view"
          >
            <canvas
              ref={minimapRef}
              width={160}
              height={110}
              style={{ display: 'block', width: '100%', height: '100%' }}
            />
          </div>
          {/* ── Tools collapsible menu + Save Progress button (top-left) ──
              Tombol "Tools" warna kuning terang, gak pernah redup.
              Klik → expand/collapse semua tool buttons di bawahnya.
              "Save Progress" tombol hijau di samping kanan Tools.
              Wrapper div positioned absolute, top berubah tergantung paletteOpen. */}
          <div style={{
            position: isMobile && paletteOpen ? 'fixed' : 'absolute',
            top: isMobile && paletteOpen ? 94 : (paletteOpen ? 8 : 60),
            left: isMobile && paletteOpen ? '50%' : 8,
            transform: isMobile && paletteOpen ? 'translateX(-50%)' : 'none',
            zIndex: 20,
            display: 'flex', flexDirection: 'row', gap: 6, alignItems: 'flex-start',
            transition: 'top 0.22s ease, left 0.22s ease',
          }}>
            {/* Left column: Tools button + expandable panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* ── Tools header button (always bright yellow, never dims) ── */}
            <button
              onClick={() => setToolsOpen(prev => !prev)}
              title={toolsOpen ? 'Collapse tools menu' : 'Expand tools menu'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid #facc15',
                backgroundColor: 'rgba(250, 204, 21, 0.12)',
                color: '#facc15',
                fontSize: 13, fontWeight: 700, fontFamily: '"Inter", sans-serif',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
                userSelect: 'none',
                width: '100%',
                // NEVER dims — always full opacity
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                Tools
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{
                flexShrink: 0,
                transform: toolsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {toolsOpen && <>
            {/* ── Undo (#1) ── Blue (#60a5fa). Does NOT close tools panel. ── */}
            <button
              onClick={undoCircuit}
              disabled={!canUndoCircuit}
              title="Undo (1)"
              style={{
                display: 'flex', alignItems: 'center', gap: 8, position: 'relative',
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid ' + (canUndoCircuit ? '#60a5fa' : 'rgba(96,165,250,0.3)'),
                backgroundColor: canUndoCircuit ? 'rgba(96,165,250,0.10)' : 'rgba(96,165,250,0.06)',
                color: canUndoCircuit ? '#60a5fa' : 'rgba(96,165,250,0.4)',
                fontSize: 13, fontWeight: 700, fontFamily: '"Inter", sans-serif',
                cursor: canUndoCircuit ? 'pointer' : 'not-allowed',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                transition: 'opacity 0.15s ease',
                userSelect: 'none',
                opacity: canUndoCircuit ? 1 : 0.45,
              }}
            >
              <Undo2 size={16} />
              <span>undo</span>
              {!isMobile && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, opacity: 0.5 }}>[1]</span>}
            </button>

            {/* ── Redo (#2) ── Blue (#60a5fa). Does NOT close tools panel. ── */}
            <button
              onClick={redoCircuit}
              disabled={!canRedoCircuit}
              title="Redo (2)"
              style={{
                display: 'flex', alignItems: 'center', gap: 8, position: 'relative',
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid ' + (canRedoCircuit ? '#60a5fa' : 'rgba(96,165,250,0.3)'),
                backgroundColor: canRedoCircuit ? 'rgba(96,165,250,0.10)' : 'rgba(96,165,250,0.06)',
                color: canRedoCircuit ? '#60a5fa' : 'rgba(96,165,250,0.4)',
                fontSize: 13, fontWeight: 700, fontFamily: '"Inter", sans-serif',
                cursor: canRedoCircuit ? 'pointer' : 'not-allowed',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                transition: 'opacity 0.15s ease',
                userSelect: 'none',
                opacity: canRedoCircuit ? 1 : 0.45,
              }}
            >
              <Redo2 size={16} />
              <span>redo</span>
              {!isMobile && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, opacity: 0.5 }}>[2]</span>}
            </button>

            {/* ── Move! Area toggle (#3) ──
                Teal (#0ea5e9). OFF = dim, text 'move area off'.
                ON = bright (#0ea5e9), text 'move area on'.
                Mutual exclusive dengan semua mode lain. */}
            <button
              onClick={toggleMove}
              title={moveMode ? 'Move Area mode ON — drag to select, click arrows to move' : 'Turn on Move Area mode'}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, position: 'relative',
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid ' + (moveMode ? '#0ea5e9' : 'rgba(14, 165, 233, 0.3)'),
                backgroundColor: moveMode ? 'rgba(14, 165, 233, 0.10)' : 'rgba(14, 165, 233, 0.06)',
                color: moveMode ? '#0ea5e9' : anySpecialMode ? 'rgba(14, 165, 233, 0.5)' : '#0ea5e9',
                fontSize: 13, fontWeight: 700, fontFamily: '"Inter", sans-serif',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                userSelect: 'none',
                opacity: (mode === 'connect' || paintMode || deleteMode || cloneMode || rotateMode) ? 0.4 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span>move area <span style={{ visibility: 'hidden' }}>{moveMode ? 'on' : 'off'}</span></span>
              {!isMobile && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, opacity: 0.5 }}>[3]</span>}
            </button>

            {/* ── Rotate Area toggle (#4) ──
                Amber (#f59e0b). OFF = dim, text 'rotate area off'.
                ON = bright (#f59e0b), text 'rotate area on'.
                Mutual exclusive dengan semua mode lain. */}
            <button
              onClick={toggleRotate}
              title={rotateMode ? 'Rotate Area mode ON — drag to select, click circles to rotate 90°' : 'Turn on Rotate Area mode'}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, position: 'relative',
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid ' + (rotateMode ? '#f59e0b' : 'rgba(245, 158, 11, 0.3)'),
                backgroundColor: rotateMode ? 'rgba(245, 158, 11, 0.10)' : 'rgba(245, 158, 11, 0.06)',
                color: rotateMode ? '#f59e0b' : anySpecialMode ? 'rgba(245, 158, 11, 0.5)' : '#f59e0b',
                fontSize: 13, fontWeight: 700, fontFamily: '"Inter", sans-serif',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                userSelect: 'none',
                opacity: (mode === 'connect' || paintMode || deleteMode || cloneMode || moveMode) ? 0.4 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
              <span>rotate area <span style={{ visibility: 'hidden' }}>{rotateMode ? 'on' : 'off'}</span></span>
              {!isMobile && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, opacity: 0.5 }}>[4]</span>}
            </button>

            {/* ── Cloning Area toggle (#5) ──
                Bright purple (#c084fc). OFF = dim, text 'cloning area off'.
                ON = bright (#c084fc), text 'cloning area on'.
                Saat ON: mode indicator berganti jadi "mode: cloning area" + bright purple.
                Saat connect/paint/delete/move/rotate ON → cloning area redup.
                Mutual exclusive dengan semua mode lain. */}
            <button
              onClick={toggleClone}
              title={cloneMode ? 'Cloning Area mode ON — drag to select, click arrows to clone' : 'Turn on Cloning Area mode'}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, position: 'relative',
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid ' + (cloneMode ? '#c084fc' : 'rgba(192, 132, 252, 0.3)'),
                backgroundColor: cloneMode ? 'rgba(192, 132, 252, 0.10)' : 'rgba(192, 132, 252, 0.06)',
                color: cloneMode ? '#c084fc' : anySpecialMode ? 'rgba(192, 132, 252, 0.5)' : '#c084fc',
                fontSize: 13, fontWeight: 700, fontFamily: '"Inter", sans-serif',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                userSelect: 'none',
                opacity: (mode === 'connect' || paintMode || deleteMode || moveMode || rotateMode) ? 0.4 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="8" y="8" width="13" height="13" rx="2" />
                <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
              </svg>
              <span>cloning area <span style={{ visibility: 'hidden' }}>{cloneMode ? 'on' : 'off'}</span></span>
              {!isMobile && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, opacity: 0.5 }}>[5]</span>}
            </button>

            {/* ── mode: connect wire ──
                Toggle ON/OFF. Warna cyan (#22d3ee).
                ON → mode indicator berganti jadi "mode: connect wire" + cyan.
                Saat paint/delete/clone ON → connect wire redup (gak bisa diklik).
                Klik connect wire saat redup → matikan mode lain, nyalakan connect. */}
            <button
              onClick={() => {
                if (mode === 'connect') {
                  setMode('build');
                } else {
                  setMode('connect');
                  setPaintMode(false);
                  setDeleteMode(false);
                  setCloneMode(false);
                  setMoveMode(false);
                  setRotateMode(false);
                  setToolsOpen(false);
                }
              }}
              title={mode === 'connect' ? 'Connect Wire mode ON — click zones to wire' : 'Turn on Connect Wire mode'}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, position: 'relative',
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid ' + (mode === 'connect' ? '#22d3ee' : 'rgba(34, 211, 238, 0.3)'),
                backgroundColor: mode === 'connect' ? 'rgba(34, 211, 238, 0.15)' : 'rgba(34, 211, 238, 0.06)',
                color: mode === 'connect' ? '#22d3ee' : anySpecialMode ? 'rgba(34, 211, 238, 0.5)' : '#22d3ee',
                fontSize: 13, fontWeight: 700, fontFamily: '"Inter", sans-serif',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                userSelect: 'none',
                // Saat mode lain aktif (paint/delete/clone) → connect wire juga redup
                opacity: (paintMode || deleteMode || cloneMode || moveMode || rotateMode) ? 0.4 : 1,
              }}
            >
              <Cable size={13} />
              <span>connect wire <span style={{ visibility: 'hidden' }}>{mode === 'connect' ? 'on' : 'off'}</span></span>
              {!isMobile && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, opacity: 0.5 }}>[6]</span>}
            </button>

            {/* ── Paint Mode toggle ──
                Hot pink/magenta (#ff0080). OFF = dim (low opacity), text 'paint off'.
                ON = bright (#ff0080), text 'paint on'.
                Warna cerah mencolok, beda jauh dari cyan, hijau, merah.
                Saat ON: mode indicator berganti jadi "mode: paint" + hot pink.
                Saat connect/delete ON → paint redup.
                Mutual exclusive dengan connect & delete. */}
            <button
              onClick={togglePaint}
              title={paintMode ? 'Paint mode ON — click wire/component to recolor' : 'Turn on Paint mode'}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, position: 'relative',
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid ' + (paintMode ? '#ff0080' : 'rgba(255, 0, 128, 0.3)'),
                backgroundColor: paintMode ? 'rgba(255, 0, 128, 0.10)' : 'rgba(255, 0, 128, 0.06)',
                color: paintMode ? '#ff0080' : anySpecialMode ? 'rgba(255, 0, 128, 0.5)' : '#ff0080',
                fontSize: 13, fontWeight: 700, fontFamily: '"Inter", sans-serif',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                userSelect: 'none',
                // Saat mode lain aktif (connect/delete/clone) → paint juga redup
                opacity: (mode === 'connect' || deleteMode || cloneMode || moveMode || rotateMode) ? 0.4 : 1,
              }}
            >
              {/* Paint icon — Paintbrush (kuas cat) di kiri teks.
                  User request: 'sebelah kiri tulisan paint harusnya ada logo'.
                  OFF: icon dim (inherit color rgba). ON: icon bright hot pink.
                  strokeWidth 2.2 (lebih bold dari default 2) biar keliatan jelas di size 16. */}
              <Paintbrush
                size={16}
                strokeWidth={2.2}
                style={{
                  flexShrink: 0,
                }}
              />
              <span>paint <span style={{ visibility: 'hidden' }}>{paintMode ? 'on' : 'off'}</span></span>
              {!isMobile && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, opacity: 0.5 }}>[7]</span>}
            </button>

            {/* ── Delete Mode toggle ──
                Merah darah murni (#ff1744) dengan ikon X. OFF = dim, text 'delete off'.
                ON = bright (#ff1744), text 'delete on'. Warna cerah mencolok, bukan glow.
                Saat ON: mode indicator berganti jadi "mode: delete" + merah darah.
                Saat connect/paint ON → delete redup.
                Mutual exclusive dengan connect & paint. */}
            <button
              onClick={toggleDelete}
              title={deleteMode ? 'Delete mode ON — click wire/component to delete' : 'Turn on Delete mode'}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, position: 'relative',
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid ' + (deleteMode ? '#ff1744' : 'rgba(255, 23, 68, 0.3)'),
                backgroundColor: deleteMode ? 'rgba(255, 23, 68, 0.12)' : 'rgba(255, 23, 68, 0.06)',
                color: deleteMode ? '#ff1744' : anySpecialMode ? 'rgba(255, 23, 68, 0.5)' : '#ff1744',
                fontSize: 13, fontWeight: 700, fontFamily: '"Inter", sans-serif',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                userSelect: 'none',
                // Saat mode lain aktif (connect/paint/clone) → delete juga redup
                opacity: (mode === 'connect' || paintMode || cloneMode || moveMode || rotateMode) ? 0.4 : 1,
              }}
            >
              {/* Ikon X merah — user request: 'design logo X di delete itu kecil woi dan terlalu biasa aja, harusnya bagus gitu'.
                  Upgrade: custom SVG X bold (strokeWidth 3) di dalam lingkaran badge (radius 10).
                  Total size 20px (lebih besar dari sebelumnya 13px).
                  Saat ON: bright vivid red, bukan glow.
                  Saat OFF: dim saja.
                  Circle badge → kesan 'no entry' / prohibition sign yang iconic. */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  flexShrink: 0,
                }}
              >
                {/* Lingkaran badge — stroke currentColor (merah), fill rgba merah soft */}
                <circle
                  cx="12" cy="12" r="9.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  fill="rgba(255,23,68,0.12)"
                  opacity="0.7"
                />
                {/* X bold di tengah — strokeWidth 3 (lebih tebal dari default), strokeLinecap round */}
                <path
                  d="M8.5 8.5 L15.5 15.5 M8.5 15.5 L15.5 8.5"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>delete <span style={{ visibility: 'hidden' }}>{deleteMode ? 'on' : 'off'}</span></span>
              {!isMobile && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, opacity: 0.5 }}>[8]</span>}
            </button>
            </>}
            </div>{/* end left column */}

            {/* ── Save Progress button ── Green (#22c55e), cartridge icon ── */}
            <button
              onClick={() => { setSaveOverlayOpen(true); setSaveStatus(null); setSlotSearchQuery(''); }}
              title="Save Progress"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid #22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                color: '#22c55e',
                fontSize: 13, fontWeight: 700, fontFamily: '"Inter", sans-serif',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <HardDrive size={16} />
              <span>Save Progress</span>
            </button>
          </div>

          {/* ── Save Progress Overlay ── Game cartridge style */}
          {saveOverlayOpen && (
            <div
              onClick={(e) => {
                // ── Pick-from-workspace: when user clicks anywhere on overlay in pickFromWorkspace mode ──
                if (!pickFromWorkspaceRef.current) return;
                e.stopPropagation();
                e.preventDefault();
                const savedPicker = pickFromWorkspaceRef.current;
                const isSlotPicker = savedPicker.source === 'slot';
                const el = e.target;
                let pickedHex = null;
                // Strategy 1: Walk up DOM looking for data-slot-color attribute (cartridge divs)
                let candidate = el;
                while (candidate && candidate !== document.body) {
                  if (candidate.dataset && candidate.dataset.slotColor) {
                    pickedHex = candidate.dataset.slotColor;
                    break;
                  }
                  candidate = candidate.parentElement;
                }
                // Strategy 2: Walk up DOM looking for a solid backgroundColor (buttons, dots, etc.)
                if (!pickedHex) {
                  candidate = el;
                  while (candidate && candidate !== document.body) {
                    const raw = getComputedStyle(candidate).backgroundColor;
                    const m = raw.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                    if (m && !raw.includes('rgba(0, 0, 0, 0)') && raw !== 'transparent') {
                      const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
                      if (r + g + b > 15 && r + g + b < 740) {
                        pickedHex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
                        break;
                      }
                    }
                    candidate = candidate.parentElement;
                  }
                }
                if (pickedHex) {
                  if (isSlotPicker) {
                    setSlotColorEdit({ slotIndex: savedPicker.slotIndex, draftHex: pickedHex });
                  } else {
                    setColorPicker({ ...savedPicker, hex: pickedHex });
                  }
                  setPickFromWorkspace(null);
                  const canvas = document.querySelector('canvas');
                  if (canvas) canvas.style.cursor = 'default';
                  setStatus('Color picked: ' + pickedHex.toUpperCase());
                } else {
                  setPickFromWorkspace(null);
                  const canvas = document.querySelector('canvas');
                  if (canvas) canvas.style.cursor = 'default';
                  if (isSlotPicker) {
                    setSlotColorEdit({ slotIndex: savedPicker.slotIndex, draftHex: savedPicker.draftHex });
                  } else {
                    setColorPicker(savedPicker);
                  }
                  setStatus('Pick cancelled — try again');
                }
              }}
              style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #2a3a5c 0%, #1a2744 50%, #0f1b30 100%)',
              ...(pickFromWorkspace ? { cursor: `url('${getEyedropperCursorUrl()}') 6 26, crosshair` } : {}),
            }}>
              <div style={{
                width: isMobile ? '95vw' : '58vw',
                maxHeight: '92vh',
                background: 'linear-gradient(180deg, #3a506b 0%, #2c3e5a 40%, #243552 100%)',
                borderRadius: 24,
                border: '3px solid #5a7a9a',
                boxShadow: '0 0 0 2px #1a2744, 0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
                padding: isMobile ? '18px 14px' : '28px 32px',
                display: 'flex', flexDirection: 'column', gap: 16,
                overflow: 'auto', position: 'relative',
              }} className="save-overlay-scroll">
                {/* Close button — gold rounded square like game icon */}
                <button
                  onClick={() => {
                    if (pickFromWorkspaceRef.current) {
                      const savedPicker = pickFromWorkspaceRef.current;
                      const isSlotPicker = savedPicker.source === 'slot';
                      setPickFromWorkspace(null);
                      const canvas = document.querySelector('canvas');
                      if (canvas) canvas.style.cursor = 'default';
                      if (isSlotPicker) {
                        setSlotColorEdit({ slotIndex: savedPicker.slotIndex, draftHex: savedPicker.draftHex });
                      } else {
                        setColorPicker(savedPicker);
                      }
                    }
                    setSaveOverlayOpen(false); setSaveConfirm(null); setSaveStatus(null); setMoveSlotIndex(null);
                  }}
                  style={{
                    position: 'sticky', top: 10,
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(180deg, #e6b800 0%, #c5a028 100%)',
                    border: '2px solid #a08020',
                    boxShadow: '0 3px 0 #8a6e18, 0 4px 8px rgba(0,0,0,0.4)',
                    color: '#3a2800', fontSize: 18, fontWeight: 900, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1, alignSelf: 'flex-end', zIndex: 10,
                    flexShrink: 0,
                  }}
                >X</button>

                {/* Title row — gold badge + search (left) + title (absolute center) */}
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative', paddingRight: 40, minHeight: 50, marginBottom: 8 }}>
                  {/* Gold badge — top-left corner */}
                  {user && goldInfo && (() => {
                    const gold = goldInfo.isAdmin ? Infinity : (goldInfo.gold ?? 0);
                    return (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        backgroundColor: '#1a1f2e', border: '1px solid #2d3548',
                        borderRadius: 10, padding: '7px 16px',
                        flexShrink: 0, marginRight: 8,
                      }}>
                        <Coins size={20} style={{ color: '#fbbf24' }} />
                        {gold === Infinity ? (
                          <svg width="28" height="16" viewBox="0 0 24 12" fill="none" style={{ display: 'block' }}>
                            <path d="M12,6 C12,1.5 5,1.5 5,6 C5,10.5 12,10.5 12,6 C12,1.5 19,1.5 19,6 C19,10.5 12,10.5 12,6"
                              stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                          </svg>
                        ) : (
                          <span style={{
                            fontFamily: 'Orbitron,sans-serif', fontSize: 17, fontWeight: 700,
                            color: '#fbbf24', letterSpacing: 0.5,
                          }}>{gold}</span>
                        )}
                      </div>
                    );
                  })()}
                  {/* Slot Search Input — next to gold badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    backgroundColor: '#1a1f2e', border: '1px solid #2d3548',
                    borderRadius: 10, padding: '5px 12px',
                    flexShrink: 0,
                  }}>
                    <Search size={16} style={{ color: '#5a7a9a', flexShrink: 0 }} />
                    <input
                      type="text"
                      value={slotSearchQuery}
                      onChange={e => setSlotSearchQuery(e.target.value)}
                      placeholder="Cari slot..."
                      style={{
                        background: 'transparent', border: 'none', outline: 'none',
                        color: '#e8eef4', fontSize: 13, width: isMobile ? 80 : 120,
                        fontFamily: '"Inter", sans-serif',
                      }}
                    />
                    {slotSearchQuery && (
                      <button
                        onClick={() => setSlotSearchQuery('')}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#5a7a9a', fontSize: 14, lineHeight: 1, padding: 0,
                          display: 'flex', alignItems: 'center',
                        }}
                      >×</button>
                    )}
                  </div>
                  {/* Title text — absolutely centered, not affected by left-side elements */}
                  <div style={{ position: 'absolute', left: 100, right: 40, textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{
                      fontSize: isMobile ? 20 : 26, fontWeight: 900, color: '#f0f4f8',
                      fontFamily: '"Inter", sans-serif', letterSpacing: 1,
                      textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    }}>SAVE PROGRESS</div>
                    <div style={{
                      fontSize: 12, color: '#FFFFFF', marginTop: 4,
                      fontFamily: '"Inter", sans-serif',
                    }}>Simpan & muat rangkaianmu ke cartridge slot</div>
                  </div>
                </div>

                {/* Status message */}
                {saveStatus && (
                  <div style={{
                    padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, textAlign: 'center',
                    background: saveStatus.type === 'success'
                      ? 'linear-gradient(180deg, rgba(107,199,77,0.3) 0%, rgba(107,199,77,0.15) 100%)'
                      : 'linear-gradient(180deg, rgba(239,68,68,0.3) 0%, rgba(239,68,68,0.15) 100%)',
                    color: saveStatus.type === 'success' ? '#a5e88a' : '#f87171',
                    border: `2px solid ${saveStatus.type === 'success' ? '#6bc74d' : '#ef4444'}55`,
                    boxShadow: `0 2px 8px ${saveStatus.type === 'success' ? 'rgba(107,199,77,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}>
                    {saveStatus.message}
                  </div>
                )}

                {/* Cartridge Save Slots — max 3 per row, wrap to next row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: 14,
                }}>
                  {saveSlots.map((slot, idx) => {
                    // Search filter: match by name or description (case-insensitive)
                    const slotSearchLower = slotSearchQuery.toLowerCase();
                    const slotMatchesSearch = !slotSearchQuery
                      || (slot.name || '').toLowerCase().includes(slotSearchLower)
                      || (slot.description || '').toLowerCase().includes(slotSearchLower)
                      || `slot ${idx + 1}`.includes(slotSearchLower);
                    if (!slotMatchesSearch) return null;
                    const hasData = !!slot.data;
                    const compCount = hasData ? (slot.data.components?.length || 0) : 0;
                    const wireCount = hasData ? (slot.data.wires?.length || 0) : 0;
                    const dateStr = slot.updatedAt ? new Date(slot.updatedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
                    // Cartridge body colors derived from slot.color — muted cartridge aesthetic
                    // For highly saturated colors: use hue-only formula (fixed sat/l for consistency)
                    // For low-saturation colors (white/gray/black): use neutral gray palette,
                    //   preserving the original lightness so white→light gray, gray→medium, black→dark
                    const { h: slotH, s: slotS, l: slotL } = hexToHsl(slot.color || '#3b82f6');
                    const cc = slotS < 15
                      ? { // Low saturation: neutral gray palette based on original lightness
                          body:  hslToHex(210, 15, Math.max(18, Math.min(40, slotL * 0.4))),
                          dark:  hslToHex(210, 12, Math.max(8, Math.min(18, slotL * 0.2))),
                          light: hslToHex(210, 18, Math.max(30, Math.min(55, slotL * 0.6))),
                        }
                      : { // Normal: hue-only formula with fixed saturation/lightness for muted aesthetic
                          body:  hslToHex(slotH, 50, 35),
                          dark:  hslToHex(slotH, 35, 14),
                          light: hslToHex(slotH, 55, 48),
                        };

                    return (
                      <div
                        key={slot.slotId}
                        data-slot-color={slot.color || '#3b82f6'}
                        className={
                          (moveSlotIndex === idx ? 'slot-move-active ' : '')
                          + (swapAnim && (swapAnim.from === idx || swapAnim.to === idx) ? 'slot-swap-anim' : '')
                        }
                        onClick={() => {
                          // If in move mode and clicking a DIFFERENT slot → swap
                          if (moveSlotIndex !== null && moveSlotIndex !== idx) {
                            const fromIdx = moveSlotIndex;
                            const toIdx = idx;
                            setSwapAnim({ from: fromIdx, to: toIdx });
                            // Compute swap result IMMEDIATELY from current state (before timeout)
                            // This is critical: saveSlots in the closure is current at click time
                            const currentSlots = [...saveSlots];
                            [currentSlots[fromIdx], currentSlots[toIdx]] = [currentSlots[toIdx], currentSlots[fromIdx]];

                            // Save to localStorage FIRST — synchronous, instant, survives crash
                            setStoredSlotMeta(currentSlots);
                            setStoredSlotOrder(currentSlots);

                            // Wait for swap animation to play, then apply state + persist to backend
                            setTimeout(() => {
                              // Apply swap to React state
                              setSaveSlots(currentSlots);
                              setSlotLocks(prev => {
                                const arr = [...prev];
                                [arr[fromIdx], arr[toIdx]] = [arr[toIdx], arr[fromIdx]];
                                return arr;
                              });
                              // Clear animation + show notification IMMEDIATELY
                              setSwapAnim(null);
                              setMoveSlotIndex(null);
                              setSwapSuccessOverlay({ from: fromIdx + 1, to: toIdx + 1 });
                              setTimeout(() => setSwapSuccessOverlay(null), 2500);

                              // Persist to backend in background (fire-and-forget, don't block UI)
                              if (user && getIdToken) {
                                (async () => {
                                  try {
                                    const token = await getIdToken();
                                    if (!token) return;
                                    const slotA = currentSlots[fromIdx];
                                    const slotB = currentSlots[toIdx];
                                    // Persist both swapped slots' metadata
                                    for (const s of [slotA, slotB]) {
                                      await fetch('/api/circuits', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                        body: JSON.stringify({
                                          itemId: s.slotId,
                                          name: s.name || `Slot ${currentSlots.indexOf(s) + 1}`,
                                          data: { circuitState: s.data || null, color: s.color, description: s.description },
                                          metaOnly: true,
                                        }),
                                      });
                                    }
                                    // Persist slot ORDER to backend so refresh restores the swap
                                    const newOrder = currentSlots.map(s => s.slotId);
                                    await fetch('/api/circuits', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({
                                        itemId: 'save-slot-order',
                                        name: 'Slot Order',
                                        data: { order: newOrder },
                                        metaOnly: true,
                                      }),
                                    });
                                  } catch (e) {
                                    // localStorage already saved above — backend failure is non-critical
                                    // (debounced auto-save will retry on next render)
                                  }
                                })();
                              }
                            }, 500);
                          }
                        }}
                        style={{
                        minWidth: isMobile ? undefined : 180,
                        maxWidth: isMobile ? undefined : 280,
                        position: 'relative',
                        borderRadius: 14,
                        background: `linear-gradient(180deg, ${cc.light} 0%, ${cc.body} 30%, ${cc.body} 70%, ${cc.dark} 100%)`,
                        boxShadow: `4px 4px 0 ${cc.dark}, 0 8px 24px rgba(0,0,0,0.5)`,
                        overflow: moveSlotIndex === idx ? 'visible' : 'hidden',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        cursor: moveSlotIndex !== null && moveSlotIndex !== idx ? 'pointer' : undefined,
                      }}>
                        {/* Marching ants SVG overlay for move mode */}
                        {moveSlotIndex === idx && (
                          <svg className="marching-ants-svg" viewBox="0 0 100 100" preserveAspectRatio="none"
                            style={{ position: 'absolute', inset: -8, width: 'calc(100% + 16px)', height: 'calc(100% + 16px)', pointerEvents: 'none', zIndex: 20 }}>
                            <rect x="1.5" y="1.5" width="97" height="97" rx="5" ry="5"
                              fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="6 4"
                            />
                          </svg>
                        )}
                        {/* Dim overlay for move mode — grays out content but not the border/SVG */}
                        {moveSlotIndex === idx && (
                          <div style={{
                            position: 'absolute', inset: 0, borderRadius: 14,
                            background: 'rgba(0,0,0,0.45)', pointerEvents: 'none', zIndex: 15,
                            filter: 'grayscale(0.7) brightness(0.6)',
                          }} />
                        )}
                        {/* Cartridge SD-card notch (top-right angled cutout) */}
                        <div style={{
                          position: 'absolute', top: 0, right: 20,
                          width: 24, height: 12,
                          background: '#2a3a5c',
                          borderRadius: '0 0 6 6',
                        }} />

                        {/* Label/screen area — recessed dark cavity */}
                        <div style={{
                          margin: '14px 12px 8px',
                          padding: '10px 10px 8px',
                          borderRadius: 8,
                          background: cc.dark,
                          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.05)',
                          display: 'flex', flexDirection: 'column', gap: 6,
                        }}>
                          {/* Color picker + name row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div
                              onClick={() => { if (moveSlotIndex !== null) return; setSlotColorEdit({ slotIndex: idx }); }}
                              style={{
                                width: 24, height: 24, borderRadius: 6, cursor: moveSlotIndex !== null ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: moveSlotIndex !== null ? 0.4 : 1,
                                background: 'conic-gradient(from 0deg, #00ffff, #00ff00, #ffff00, #ff0000, #ff00ff, #0000ff, #00ffff)',
                                border: '2px solid rgba(255,255,255,0.2)',
                                boxShadow: '0 0 6px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.25)',
                                transition: 'box-shadow 0.2s, transform 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 12px rgba(255,255,255,0.3), inset 0 1px 0 rgba(255,255,255,0.35)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 6px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'scale(1)'; }}
                            />
                            <input
                              type="text" value={slot.name}
                              onChange={e => { if (moveSlotIndex !== null) return; setSaveSlots(prev => prev.map((s, i) => i === idx ? { ...s, name: e.target.value } : s)); }}
                              placeholder={`Slot ${idx + 1}`} maxLength={40}
                              readOnly={moveSlotIndex !== null}
                              style={{
                                flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: 6, padding: '4px 8px', color: '#e8eef4', fontSize: 13, fontWeight: 700,
                                fontFamily: '"Inter", sans-serif', outline: 'none', minWidth: 0, opacity: moveSlotIndex !== null ? 0.4 : 1,
                              }}
                            />
                          </div>
                          {/* Description */}
                          <textarea
                            className="slot-desc-scroll"
                            value={slot.description}
                            onChange={e => { if (moveSlotIndex !== null) return; setSaveSlots(prev => prev.map((s, i) => i === idx ? { ...s, description: e.target.value } : s)); }}
                            placeholder="Deskripsi..." maxLength={200} rows={3}
                            readOnly={moveSlotIndex !== null}
                            style={{
                              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 6, padding: '3px 8px', color: '#8aa4c0', fontSize: 11,
                              fontFamily: '"Inter", sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box',
                              resize: 'none', lineHeight: 1.4, opacity: moveSlotIndex !== null ? 0.4 : 1,
                            }}
                          />
                          {/* Info line */}
                          <div style={{ fontSize: 10, color: '#5a7a9a', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                            {hasData ? (
                              <>
                                <span style={{ color: '#8aa4c0' }}>{compCount} comp</span>
                                <span>{wireCount} wire</span>
                                {dateStr && <span style={{ fontSize: 9 }}>{dateStr}</span>}
                              </>
                            ) : (
                              <span style={{ fontStyle: 'italic', color: '#4a6a8a' }}>Kosong</span>
                            )}
                          </div>
                        </div>

                        {/* Groove lines (cartridge detail) */}
                        <div style={{ margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${cc.dark}60, transparent)` }} />
                          <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${cc.dark}60, transparent)` }} />
                          <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${cc.dark}60, transparent)` }} />
                        </div>

                        {/* Gold contact pins at bottom — left/right with MOVE button in center */}
                        <div style={{
                          margin: '8px 8px 0', padding: '6px 6px', borderRadius: '4px 4px 0 0',
                          background: 'linear-gradient(180deg, #d4af37 0%, #c5a028 50%, #a08020 100%)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)', gap: 6,
                        }}>
                          {/* Left pins — pushed inward with margin */}
                          <div style={{ display: 'flex', gap: 3, marginLeft: 6 }}>
                            {[0, 1, 2].map(pi => (
                              <div key={pi} style={{ width: 7, height: 9, borderRadius: 2,
                                background: 'linear-gradient(180deg, #b8960e 0%, #8a6e18 100%)',
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.3)' }} />
                            ))}
                          </div>
                          {/* MOVE button — blue gradient rounded, matching design reference */}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (moveSlotIndex !== null && moveSlotIndex !== idx) return; // Don't allow move on other slots during move mode
                              setMoveSlotIndex(prev => prev === idx ? null : idx);
                            }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                              padding: '4px 12px', borderRadius: 10,
                              cursor: (moveSlotIndex !== null && moveSlotIndex !== idx) ? 'not-allowed' : 'pointer',
                              background: moveSlotIndex === idx
                                ? 'linear-gradient(180deg, #5573e8 0%, #3d5bd9 50%, #3550c4 100%)'
                                : 'linear-gradient(180deg, #5573e8 0%, #3d5bd9 50%, #3550c4 100%)',
                              border: '1px solid #2a4bb8',
                              color: '#ffffff',
                              fontSize: 11, fontWeight: 700, fontFamily: '"Inter", sans-serif',
                              letterSpacing: 0.3, whiteSpace: 'nowrap',
                              boxShadow: moveSlotIndex === idx
                                ? '0 0 12px rgba(85,115,232,0.8), inset 0 1px 0 rgba(255,255,255,0.25)'
                                : '0 4px 8px rgba(30,58,138,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
                              transition: 'all 0.15s',
                              outline: moveSlotIndex === idx ? '2px solid rgba(255,255,255,0.5)' : 'none',
                              outlineOffset: 1,
                              opacity: (moveSlotIndex !== null && moveSlotIndex !== idx) ? 0.4 : 1,
                            }}
                          >
                            <Move size={13} />
                            <span>Move</span>
                          </button>
                          {/* Right pins — pushed inward with margin */}
                          <div style={{ display: 'flex', gap: 3, marginRight: 6 }}>
                            {[0, 1, 2].map(pi => (
                              <div key={pi} style={{ width: 7, height: 9, borderRadius: 2,
                                background: 'linear-gradient(180deg, #b8960e 0%, #8a6e18 100%)',
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.3)' }} />
                            ))}
                          </div>
                        </div>

                        {/* Action buttons area */}
                        <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Lock + History row */}
                          <div style={{ display: 'flex', gap: 6 }}>
                            {/* Lock button */}
                            <button
                              onClick={() => {
                                if (moveSlotIndex !== null) return;
                                const isL = slotLocks[idx] || false;
                                setLockConfirm({ slotIndex: idx, action: isL ? 'unlock' : 'lock' });
                              }}
                              className={lockAnim && lockAnim.slotIndex === idx ? (lockAnim.type === 'opening' ? 'animate-lock-open' : 'animate-lock-close') : ''}
                              title={slotLocks[idx] ? 'Buka kunci slot' : 'Kunci slot'}
                              style={{
                                flex: 1, padding: '6px 0', borderRadius: 8,
                                background: slotLocks[idx]
                                  ? 'linear-gradient(180deg, #fbbf24 0%, #d4a020 100%)'
                                  : 'linear-gradient(180deg, #4a5568 0%, #3a4558 100%)',
                                border: `2px solid ${slotLocks[idx] ? '#b8960e' : '#2a3548'}`,
                                boxShadow: slotLocks[idx]
                                  ? '0 3px 0 #8a6e18, 0 4px 8px rgba(0,0,0,0.3)'
                                  : '0 2px 0 #1a2538',
                                color: slotLocks[idx] ? '#3a2800' : '#8aa4c0',
                                fontSize: 14, fontWeight: 900, cursor: moveSlotIndex !== null ? 'not-allowed' : 'pointer',
                                fontFamily: '"Inter", sans-serif',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                transition: 'all 0.15s', opacity: moveSlotIndex !== null ? 0.4 : 1,
                              }}
                            >
                              {slotLocks[idx] ? <Lock size={13} /> : <Unlock size={13} />}
                            </button>
                            {/* History button (double arrows) */}
                            <button
                              onClick={async () => {
                                if (moveSlotIndex !== null) return;
                                setHistoryOpen(idx);
                                setHistoryLoading(true);
                                try {
                                  const token = await getIdToken();
                                  const res = await fetch(`/api/circuits?action=history&id=${slot.slotId}`, { headers: { Authorization: `Bearer ${token}` } });
                                  if (res.ok) { const d = await res.json(); setHistoryData(d.history || []); }
                                  else setHistoryData([]);
                                } catch { setHistoryData([]); }
                                setHistoryLoading(false);
                              }}
                              title="Load Save Sebelumnya"
                              style={{
                                flex: 1, padding: '6px 0', borderRadius: 8,
                                background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)',
                                border: '2px solid #2563eb',
                                boxShadow: '0 3px 0 #1d4ed8, 0 4px 8px rgba(0,0,0,0.3)',
                                color: '#fff', fontSize: 14, fontWeight: 900, cursor: moveSlotIndex !== null ? 'not-allowed' : 'pointer',
                                fontFamily: '"Inter", sans-serif',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                transition: 'all 0.15s', opacity: moveSlotIndex !== null ? 0.4 : 1,
                              }}
                            >
                              <ArrowRightLeft size={13} />
                            </button>
                          </div>
                          {/* Save button — hot pink pill */}
                          <button
                            onClick={() => {
                              if (moveSlotIndex !== null) return;
                              if (slotLocks[idx]) { setLockWarning(true); return; }
                              setSaveConfirm({ slotIndex: idx, action: 'save' });
                            }}
                            disabled={saveLoading || moveSlotIndex !== null}
                            style={{
                              width: '100%', padding: '10px 0', borderRadius: 50,
                              background: slotLocks[idx]
                                ? 'linear-gradient(180deg, #4a5568 0%, #3a4558 100%)'
                                : saveLoading
                                  ? 'linear-gradient(180deg, #a0305a 0%, #802050 100%)'
                                  : 'linear-gradient(180deg, #e83e8c 0%, #d63384 50%, #c0256e 100%)',
                              border: `2px solid ${slotLocks[idx] ? '#2a3548' : '#a0305a'}`,
                              boxShadow: slotLocks[idx]
                                ? '0 4px 0 #1a2538, 0 6px 12px rgba(0,0,0,0.3)'
                                : '0 4px 0 #802050, 0 6px 12px rgba(0,0,0,0.4)',
                              color: slotLocks[idx] ? '#5a6a7a' : '#fff', fontSize: 15, fontWeight: 900,
                              cursor: (saveLoading || moveSlotIndex !== null) ? 'not-allowed' : 'pointer',
                              fontFamily: '"Inter", sans-serif', letterSpacing: 1,
                              textShadow: slotLocks[idx] ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
                              transition: 'transform 0.1s, boxShadow 0.1s, background 0.2s, color 0.2s, border-color 0.2s',
                              opacity: moveSlotIndex !== null ? 0.4 : 1,
                            }}
                          >
                            SAVE
                          </button>
                          {/* load button — lime green chunky */}
                          <button
                            onClick={() => {
                              if (moveSlotIndex !== null) return;
                              setSaveConfirm({ slotIndex: idx, action: 'load' });
                            }}
                            disabled={saveLoading || !hasData || moveSlotIndex !== null}
                            style={{
                              width: '100%', padding: hasData ? '12px 0' : '10px 0', borderRadius: 14,
                              background: hasData
                                ? 'linear-gradient(180deg, #76d746 0%, #6bc74d 50%, #55a838 100%)'
                                : 'linear-gradient(180deg, #3a5530 0%, #2a4020 100%)',
                              border: `2px solid ${hasData ? '#4a8a30' : '#1a3010'}`,
                              boxShadow: hasData
                                ? '0 4px 0 #3a7028, 0 6px 12px rgba(0,0,0,0.4)'
                                : '0 2px 0 #1a3010',
                              color: hasData ? '#fff' : '#5a7a50', fontSize: hasData ? 17 : 13, fontWeight: 900,
                              cursor: (saveLoading || !hasData || moveSlotIndex !== null) ? 'not-allowed' : 'pointer',
                              fontFamily: '"Inter", sans-serif', letterSpacing: hasData ? 2 : 0,
                              textShadow: hasData ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                              transition: 'transform 0.1s, boxShadow 0.1s',
                              opacity: moveSlotIndex !== null ? 0.4 : 1,
                            }}
                          >
                            {hasData ? 'LOAD' : 'EMPTY'}
                          </button>
                        </div>

                        {/* Slot indicator dot — invisible but kept in DOM */}
                        <div style={{
                          position: 'absolute', top: 8, left: 8,
                          width: 14, height: 14, borderRadius: '50%',
                          background: slot.color,
                          boxShadow: `0 0 6px ${slot.color}80, inset 0 -2px 3px rgba(0,0,0,0.3)`,
                          border: '2px solid rgba(255,255,255,0.2)',
                          visibility: 'hidden',
                        }} />
                        {/* Lock indicator — top-left, overlays the invisible color dot */}
                        {slotLocks[idx] && (
                          <div style={{
                            position: 'absolute', top: 4, left: 4,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 20, height: 20, borderRadius: 6,
                            background: 'linear-gradient(180deg, #fbbf24 0%, #d4a020 100%)',
                            border: '1px solid #b8960e',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                          }}>
                            <Lock size={10} color="#3a2800" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* ── Auto Save Cartridge ── */}
                  {(() => {
                    // Search filter for Auto Save
                    const asSearchLower = slotSearchQuery.toLowerCase();
                    const asMatchesSearch = !slotSearchQuery
                      || 'auto save'.includes(asSearchLower)
                      || 'autosave'.includes(asSearchLower);
                    if (!asMatchesSearch) return null;
                    const asHsl = hexToHsl('#3b82f6');
                    const asCc = { body: hslToHex(asHsl.h, 50, 35), dark: hslToHex(asHsl.h, 35, 14), light: hslToHex(asHsl.h, 55, 48) };
                    const asHasData = !!autoSaveData;
                    const asCompCount = asHasData ? (autoSaveData.components?.length || 0) : 0;
                    const asWireCount = asHasData ? (autoSaveData.wires?.length || 0) : 0;
                    const asDateStr = autoSaveUpdatedAt ? new Date(autoSaveUpdatedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
                    // Relative time
                    let relTime = '';
                    if (autoSaveUpdatedAt) {
                      const diffMs = Date.now() - new Date(autoSaveUpdatedAt).getTime();
                      const diffMin = Math.floor(diffMs / 60000);
                      if (diffMin < 1) relTime = 'Baru saja';
                      else if (diffMin < 60) relTime = `${diffMin} menit lalu`;
                      else { const diffH = Math.floor(diffMin / 60); if (diffH < 24) relTime = `${diffH} jam lalu`; else relTime = asDateStr; }
                    }
                    return (
                      <div style={{
                        minWidth: isMobile ? undefined : 180, maxWidth: isMobile ? undefined : 280,
                        position: 'relative', borderRadius: 14, overflow: 'hidden',
                        background: `linear-gradient(180deg, ${asCc.light} 0%, ${asCc.body} 30%, ${asCc.body} 70%, ${asCc.dark} 100%)`,
                        boxShadow: `4px 4px 0 ${asCc.dark}, 0 8px 24px rgba(0,0,0,0.5)`,
                      }}>
                        {/* SD-card notch */}
                        <div style={{ position: 'absolute', top: 0, right: 20, width: 24, height: 12, background: '#2a3a5c', borderRadius: '0 0 6 6' }} />
                        {/* Label area */}
                        <div style={{
                          margin: '14px 12px 8px', padding: '10px 10px 8px', borderRadius: 8,
                          background: asCc.dark,
                          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.05)',
                          display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
                        }}>
                          {/* Title: AUTO SAVE with sync icon */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <RefreshCw size={20} style={{ color: '#fbbf24' }} />
                            <span style={{
                              fontSize: 16, fontWeight: 900, color: '#fbbf24',
                              fontFamily: '"Inter", sans-serif', letterSpacing: 1,
                              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            }}>AUTO SAVE</span>
                          </div>
                          {/* Info: last saved */}
                          <div style={{ fontSize: 10, color: '#5a7a9a', textAlign: 'center' }}>
                            {asHasData ? (
                              <>
                                <span style={{ color: '#8aa4c0' }}>{asCompCount} comp</span>
                                <span style={{ margin: '0 4px' }}>·</span>
                                <span style={{ color: '#8aa4c0' }}>{asWireCount} wire</span>
                                {relTime && <><span style={{ margin: '0 4px' }}>·</span><span style={{ fontSize: 9 }}>{relTime}</span></>}
                              </>
                            ) : (
                              <span style={{ fontStyle: 'italic', color: '#4a6a8a' }}>Belum ada data</span>
                            )}
                          </div>
                        </div>
                        {/* Groove lines */}
                        <div style={{ margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${asCc.dark}60, transparent)` }} />
                          <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${asCc.dark}60, transparent)` }} />
                          <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${asCc.dark}60, transparent)` }} />
                        </div>
                        {/* Gold contact pins */}
                        <div style={{
                          margin: '8px 8px 0', padding: '6px 0', borderRadius: '4px 4px 0 0',
                          background: 'linear-gradient(180deg, #d4af37 0%, #c5a028 50%, #a08020 100%)',
                          display: 'flex', justifyContent: 'center', gap: 3,
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                        }}>
                          {[...Array(8)].map((_, pi) => (
                            <div key={pi} style={{ width: 8, height: 10, borderRadius: 2, background: 'linear-gradient(180deg, #b8960e 0%, #8a6e18 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.3)' }} />
                          ))}
                        </div>
                        {/* Action: Load only + History */}
                        <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* History button for auto save */}
                          <button
                            onClick={async () => {
                              setHistoryOpen(-1); // -1 = auto save
                              setHistoryLoading(true);
                              try {
                                const token = await getIdToken();
                                const res = await fetch(`/api/circuits?action=history&id=${AUTO_SAVE_ID}`, { headers: { Authorization: `Bearer ${token}` } });
                                if (res.ok) { const d = await res.json(); setHistoryData(d.history || []); }
                                else setHistoryData([]);
                              } catch { setHistoryData([]); }
                              setHistoryLoading(false);
                            }}
                            title="Load Save Sebelumnya"
                            style={{
                              width: '100%', padding: '6px 0', borderRadius: 8,
                              background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)',
                              border: '2px solid #2563eb',
                              boxShadow: '0 3px 0 #1d4ed8, 0 4px 8px rgba(0,0,0,0.3)',
                              color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                              fontFamily: '"Inter", sans-serif',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                              transition: 'all 0.15s',
                            }}
                          >
                            <ArrowRightLeft size={13} />
                          </button>
                          {/* Load button */}
                          <button
                            onClick={doLoadAutoSave}
                            disabled={autoSaveReloading || !asHasData}
                            style={{
                              width: '100%', padding: asHasData ? '12px 0' : '10px 0', borderRadius: 14,
                              background: asHasData
                                ? 'linear-gradient(180deg, #76d746 0%, #6bc74d 50%, #55a838 100%)'
                                : 'linear-gradient(180deg, #3a5530 0%, #2a4020 100%)',
                              border: `2px solid ${asHasData ? '#4a8a30' : '#1a3010'}`,
                              boxShadow: asHasData ? '0 4px 0 #3a7028, 0 6px 12px rgba(0,0,0,0.4)' : '0 2px 0 #1a3010',
                              color: asHasData ? '#fff' : '#5a7a50', fontSize: asHasData ? 17 : 13, fontWeight: 900,
                              cursor: (autoSaveReloading || !asHasData) ? 'not-allowed' : 'pointer',
                              fontFamily: '"Inter", sans-serif', letterSpacing: asHasData ? 2 : 0,
                              textShadow: asHasData ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                              transition: 'transform 0.1s, boxShadow 0.1s',
                            }}
                          >
                            {asHasData ? 'LOAD' : 'EMPTY'}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Buy Slot Cartridge (inside grid) ── */}
                  {(() => {
                    // Search filter for Buy Slot
                    const bsSearchLower = slotSearchQuery.toLowerCase();
                    const bsMatchesSearch = !slotSearchQuery
                      || 'buy slot'.includes(bsSearchLower)
                      || 'buyslot'.includes(bsSearchLower)
                      || 'beli slot'.includes(bsSearchLower);
                    if (!bsMatchesSearch) return null;
                    const bsHsl = hexToHsl('#3b82f6');
                    const bsCc = { body: hslToHex(bsHsl.h, 50, 35), dark: hslToHex(bsHsl.h, 35, 14), light: hslToHex(bsHsl.h, 55, 48) };
                    return (
                      <div
                        onClick={() => { if (user) setBuySlotConfirm(true); else setSaveStatus({ message: 'Harap login terlebih dahulu!', type: 'error' }); }}
                        style={{
                          minWidth: isMobile ? undefined : 180, maxWidth: isMobile ? undefined : 280,
                          position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                          background: `linear-gradient(180deg, ${bsCc.light} 0%, ${bsCc.body} 30%, ${bsCc.body} 70%, ${bsCc.dark} 100%)`,
                          boxShadow: `4px 4px 0 ${bsCc.dark}, 0 8px 24px rgba(0,0,0,0.5)`,
                          transition: 'transform 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `4px 6px 0 ${bsCc.dark}, 0 12px 32px rgba(0,0,0,0.6)`; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `4px 4px 0 ${bsCc.dark}, 0 8px 24px rgba(0,0,0,0.5)`; }}
                      >
                        {/* SD-card notch */}
                        <div style={{ position: 'absolute', top: 0, right: 20, width: 24, height: 12, background: '#2a3a5c', borderRadius: '0 0 6 6' }} />
                        {/* Label area */}
                        <div style={{
                          margin: '14px 12px 8px', padding: '10px 10px 8px', borderRadius: 8,
                          background: bsCc.dark,
                          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.05)',
                          display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
                        }}>
                          {/* Title: BUY SLOT with plus icon */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Plus size={22} style={{ color: '#4ade80' }} />
                            <span style={{
                              fontSize: 16, fontWeight: 900, color: '#4ade80',
                              fontFamily: '"Inter", sans-serif', letterSpacing: 1,
                              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            }}>BUY SLOT</span>
                          </div>
                          {/* Price info */}
                          <div style={{ fontSize: 10, color: '#5a7a9a', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Coins size={11} style={{ color: '#fbbf24' }} />
                            <span style={{ color: '#fbbf24', fontWeight: 700 }}>100</span>
                            <span>gold per slot</span>
                          </div>
                        </div>
                        {/* Groove lines */}
                        <div style={{ margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${bsCc.dark}60, transparent)` }} />
                          <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${bsCc.dark}60, transparent)` }} />
                          <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${bsCc.dark}60, transparent)` }} />
                        </div>
                        {/* Gold contact pins */}
                        <div style={{
                          margin: '8px 8px 0', padding: '6px 0', borderRadius: '4px 4px 0 0',
                          background: 'linear-gradient(180deg, #d4af37 0%, #c5a028 50%, #a08020 100%)',
                          display: 'flex', justifyContent: 'center', gap: 3,
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                        }}>
                          {[...Array(8)].map((_, pi) => (
                            <div key={pi} style={{ width: 8, height: 10, borderRadius: 2, background: 'linear-gradient(180deg, #b8960e 0%, #8a6e18 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.3)' }} />
                          ))}
                        </div>
                        {/* Price display at bottom */}
                        <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Coins size={16} style={{ color: '#fbbf24' }} />
                            <span style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 18, fontWeight: 700, color: '#fbbf24', letterSpacing: 0.5 }}>100</span>
                          </div>
                          <span style={{ fontSize: 10, color: '#5a7a9a', fontFamily: '"Inter", sans-serif' }}>GOLD</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* ── Buy Slot Confirm Dialog — centered overlay ── */}
                {buySlotConfirm && (
                  <div style={{
                    position: 'fixed', inset: 0, zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                  }}>
                    <div style={{
                      padding: '24px 32px', borderRadius: 18, textAlign: 'center',
                      background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                      border: '2px solid #334155', boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
                      minWidth: 280, maxWidth: 380,
                    }}>
                      <div style={{ fontSize: 15, color: '#e2e8f0', fontWeight: 700, marginBottom: 16, lineHeight: 1.5 }}>
                        Apakah anda ingin membeli slot baru seharga 100 gold?
                      </div>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <button
                          onClick={doBuySlot}
                          disabled={buySlotLoading}
                          style={{
                            padding: '10px 28px', borderRadius: 10, cursor: buySlotLoading ? 'wait' : 'pointer',
                            background: 'linear-gradient(180deg, #76d746 0%, #6bc74d 50%, #55a838 100%)',
                            border: '2px solid #4a8a30', boxShadow: '0 3px 0 #3a7028, 0 4px 12px rgba(0,0,0,0.3)',
                            color: '#fff', fontSize: 15, fontWeight: 900, fontFamily: '"Inter", sans-serif', letterSpacing: 1,
                          }}
                        >YA</button>
                        <button
                          onClick={() => setBuySlotConfirm(false)}
                          style={{
                            padding: '10px 28px', borderRadius: 10, cursor: 'pointer',
                            background: 'linear-gradient(180deg, #4a5568 0%, #3a4558 100%)',
                            border: '2px solid #2a3548', boxShadow: '0 3px 0 #1a2538, 0 4px 12px rgba(0,0,0,0.3)',
                            color: '#8aa4c0', fontSize: 15, fontWeight: 900, fontFamily: '"Inter", sans-serif', letterSpacing: 1,
                          }}
                        >TIDAK</button>
                      </div>
                    </div>
                  </div>
                )}
                {!user && (
                  <div style={{
                    padding: '10px 16px', borderRadius: 12, fontSize: 12, color: '#e6b800', textAlign: 'center', fontWeight: 700,
                    background: 'linear-gradient(180deg, rgba(230,184,0,0.15) 0%, rgba(197,160,40,0.1) 100%)',
                    border: '2px solid rgba(230,184,0,0.3)',
                    boxShadow: '0 2px 8px rgba(230,184,0,0.15)',
                  }}>
                    LOGIN DIPERLUKAN — Harap masuk untuk menyimpan ke cloud
                  </div>
                )}
              </div>

              {/* Confirmation dialog — game style */}
              {saveConfirm && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 1001,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.7)',
                }}>
                  <div style={{
                    background: 'linear-gradient(180deg, #3a506b 0%, #2c3e5a 100%)',
                    borderRadius: 20, padding: '24px 28px',
                    border: '3px solid #5a7a9a',
                    boxShadow: '0 0 0 2px #1a2744, 0 20px 60px rgba(0,0,0,0.6)',
                    display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
                    maxWidth: 400, textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: 20, fontWeight: 900, color: '#f0f4f8',
                      fontFamily: '"Inter", sans-serif', letterSpacing: 1,
                      textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    }}>
                      {saveConfirm.action === 'save' ? 'SIMPAN PROGRESS?' : 'LOAD PROGRESS?'}
                    </div>
                    <div style={{ fontSize: 13, color: '#8aa4c0', lineHeight: 1.6 }}>
                      {saveConfirm.action === 'save'
                        ? `Apakah Anda ingin save progress saat ini ke Slot ${saveConfirm.slotIndex + 1}?`
                        : `Apakah Anda ingin load Slot ${saveConfirm.slotIndex + 1}? Progress saat ini akan ditimpa.`}
                    </div>
                    <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                      {/* Ya — chunky green */}
                      <button
                        onClick={() => {
                          if (saveConfirm.action === 'save') doSaveSlot(saveConfirm.slotIndex);
                          else doLoadSlot(saveConfirm.slotIndex);
                          setSaveConfirm(null);
                        }}
                        style={{
                          flex: 1, padding: '12px 0', borderRadius: 50,
                          background: 'linear-gradient(180deg, #76d746 0%, #6bc74d 50%, #55a838 100%)',
                          border: '2px solid #4a8a30',
                          boxShadow: '0 4px 0 #3a7028, 0 6px 12px rgba(0,0,0,0.4)',
                          color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer',
                          fontFamily: '"Inter", sans-serif', letterSpacing: 2,
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        }}
                      >
                        YA
                      </button>
                      {/* Tidak — dark muted */}
                      <button
                        onClick={() => setSaveConfirm(null)}
                        style={{
                          flex: 1, padding: '12px 0', borderRadius: 50,
                          background: 'linear-gradient(180deg, #4a5568 0%, #3a4558 100%)',
                          border: '2px solid #2a3548',
                          boxShadow: '0 4px 0 #1a2538, 0 6px 12px rgba(0,0,0,0.4)',
                          color: '#8aa4c0', fontSize: 16, fontWeight: 900, cursor: 'pointer',
                          fontFamily: '"Inter", sans-serif', letterSpacing: 2,
                        }}
                      >
                        TIDAK
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Lock Confirmation Dialog ── */}
              {lockConfirm && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 1002,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.7)',
                }}>
                  <div className="animate-dialog-pop-in" style={{
                    background: 'linear-gradient(180deg, #3a506b 0%, #2c3e5a 100%)',
                    borderRadius: 20, padding: '24px 28px',
                    border: '3px solid #5a7a9a',
                    boxShadow: '0 0 0 2px #1a2744, 0 20px 60px rgba(0,0,0,0.6)',
                    display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
                    maxWidth: 400, textAlign: 'center',
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'linear-gradient(180deg, #fbbf24 0%, #d4a020 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(251,191,36,0.3)',
                    }}>
                      {lockConfirm.action === 'lock' ? <Lock size={24} color="#3a2800" /> : <Unlock size={24} color="#3a2800" />}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4f8', fontFamily: '"Inter", sans-serif' }}>
                      {lockConfirm.action === 'lock'
                        ? 'Apakah anda ingin mengunci slot ini?'
                        : 'Apakah anda ingin membuka kunci slot ini?'}
                    </div>
                    <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                      <button onClick={() => {
                        const newLocks = [...slotLocks];
                        const willLock = lockConfirm.action === 'lock';
                        newLocks[lockConfirm.slotIndex] = willLock;
                        setSlotLocks(newLocks);
                        // Save locks as slotId-keyed map
                        const lockMap = {};
                        newLocks.forEach((val, i) => { if (saveSlots[i]) lockMap[saveSlots[i].slotId] = val; });
                        setStoredLocksMap(lockMap);
                        setLockAnim({ slotIndex: lockConfirm.slotIndex, type: willLock ? 'closing' : 'opening' });
                        setTimeout(() => setLockAnim(null), 450);
                        setLockConfirm(null);
                      }} style={{
                        flex: 1, padding: '12px 0', borderRadius: 50,
                        background: 'linear-gradient(180deg, #fbbf24 0%, #d4a020 100%)',
                        border: '2px solid #b8960e',
                        boxShadow: '0 4px 0 #8a6e18, 0 6px 12px rgba(0,0,0,0.4)',
                        color: '#3a2800', fontSize: 16, fontWeight: 900, cursor: 'pointer',
                        fontFamily: '"Inter", sans-serif', letterSpacing: 2,
                      }}>Ya</button>
                      <button onClick={() => setLockConfirm(null)} style={{
                        flex: 1, padding: '12px 0', borderRadius: 50,
                        background: 'linear-gradient(180deg, #4a5568 0%, #3a4558 100%)',
                        border: '2px solid #2a3548',
                        boxShadow: '0 4px 0 #1a2538, 0 6px 12px rgba(0,0,0,0.4)',
                        color: '#8aa4c0', fontSize: 16, fontWeight: 900, cursor: 'pointer',
                        fontFamily: '"Inter", sans-serif', letterSpacing: 2,
                      }}>Tidak</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Lock Warning Dialog ── */}
              {lockWarning && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 1002,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.7)',
                }}>
                  <div className="animate-dialog-pop-in" style={{
                    background: 'linear-gradient(180deg, #3a506b 0%, #2c3e5a 100%)',
                    borderRadius: 20, padding: '24px 28px',
                    border: '3px solid #ef4444',
                    boxShadow: '0 0 0 2px #1a2744, 0 20px 60px rgba(0,0,0,0.6)',
                    display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
                    maxWidth: 400, textAlign: 'center',
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                    }}>
                      <Lock size={24} color="#fff" />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4f8', fontFamily: '"Inter", sans-serif' }}>
                      Mohon buka kunci slot ini terlebih dahulu!
                    </div>
                    <button onClick={() => setLockWarning(false)} style={{
                      padding: '12px 40px', borderRadius: 50,
                      background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                      border: '2px solid #b91c1c',
                      boxShadow: '0 4px 0 #991b1b, 0 6px 12px rgba(0,0,0,0.4)',
                      color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer',
                      fontFamily: '"Inter", sans-serif', letterSpacing: 2,
                    }}>Oke</button>
                  </div>
                </div>
              )}

              {/* ── History Panel Overlay ── */}
              {historyOpen !== null && (
                <div className="animate-overlay-fade-in" onClick={() => setHistoryOpen(null)} style={{
                  position: 'fixed', inset: 0, zIndex: 1002,
                  background: 'rgba(0,0,0,0.6)',
                  display: 'flex', justifyContent: 'flex-end',
                }}>
                  <div className="animate-panel-slide-in" onClick={e => e.stopPropagation()} style={{
                    width: isMobile ? '85%' : '50%', minWidth: 260, height: '100%',
                    background: 'linear-gradient(180deg, #2c3e5a 0%, #1a2744 100%)',
                    borderLeft: '3px solid #5a7a9a',
                    padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                    overflowY: 'auto',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#60a5fa', fontFamily: '"Inter", sans-serif', letterSpacing: 1 }}>
                        SAVE SEBELUMNYA
                      </span>
                      <button onClick={() => setHistoryOpen(null)} style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(180deg, #4a5568 0%, #3a4558 100%)',
                        border: '2px solid #2a3548', color: '#8aa4c0', fontSize: 14, fontWeight: 900,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>X</button>
                    </div>
                    <div style={{ fontSize: 12, color: '#8aa4c0', fontFamily: '"Inter", sans-serif' }}>
                      Slot {historyOpen + 1} — 10 save terakhir
                    </div>
                    {historyLoading ? (
                      <div style={{ color: '#8aa4c0', fontSize: 13, textAlign: 'center', padding: 32, fontFamily: '"Inter", sans-serif' }}>
                        Memuat history...
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
                        {Array.from({ length: 10 }, (_, i) => {
                          const entry = historyData[i];
                          const hasD = entry && entry.data;
                          const hDate = entry?.pushed_at ? new Date(entry.pushed_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;
                          return (
                            <button key={i} onClick={() => {
                              if (!hasD) { setHistoryEmptyWarning(i); return; }
                              setHistoryLoadConfirm({ historyIndex: i });
                            }} style={{
                              padding: '10px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                              background: hasD
                                ? 'linear-gradient(180deg, #3a506b 0%, #2c3e5a 100%)'
                                : 'linear-gradient(180deg, #2a3548 0%, #1a2538 100%)',
                              border: `2px solid ${hasD ? '#5a7a9a' : '#2a3548'}`,
                              boxShadow: hasD ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                              color: hasD ? '#f0f4f8' : '#5a7a9a',
                              fontSize: 13, fontWeight: 700, fontFamily: '"Inter", sans-serif',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              opacity: hasD ? 1 : 0.5,
                              transition: 'all 0.15s',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, overflow: 'hidden' }}>
                                <RotateCcw size={14} style={{ flexShrink: 0, opacity: hasD ? 1 : 0.3 }} />
                                <div style={{ overflow: 'hidden' }}>
                                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    Load Save Sebelumnya [{i + 1}]
                                  </div>
                                  {hasD && entry.name && (
                                    <div style={{ fontSize: 10, color: '#8aa4c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {entry.name}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {hasD && hDate && (
                                <span style={{ fontSize: 9, color: '#5a7a9a', flexShrink: 0, marginLeft: 8 }}>{hDate}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── History Empty Warning ── */}
              {historyEmptyWarning !== null && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 1003,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.7)',
                }}>
                  <div className="animate-dialog-pop-in" style={{
                    background: 'linear-gradient(180deg, #3a506b 0%, #2c3e5a 100%)',
                    borderRadius: 20, padding: '24px 28px',
                    border: '3px solid #60a5fa',
                    boxShadow: '0 0 0 2px #1a2744, 0 20px 60px rgba(0,0,0,0.6)',
                    display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
                    maxWidth: 400, textAlign: 'center',
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(96,165,250,0.3)',
                    }}>
                      <AlertTriangle size={24} color="#fff" />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4f8', fontFamily: '"Inter", sans-serif' }}>
                      Belum ada save yang tertampung di tombol ini!
                    </div>
                    <button onClick={() => setHistoryEmptyWarning(null)} style={{
                      padding: '12px 40px', borderRadius: 50,
                      background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)',
                      border: '2px solid #2563eb',
                      boxShadow: '0 4px 0 #1d4ed8, 0 6px 12px rgba(0,0,0,0.4)',
                      color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer',
                      fontFamily: '"Inter", sans-serif', letterSpacing: 2,
                    }}>Ya</button>
                  </div>
                </div>
              )}

              {/* ── History Load Confirmation ── */}
              {historyLoadConfirm !== null && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 1003,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.7)',
                }}>
                  <div className="animate-dialog-pop-in" style={{
                    background: 'linear-gradient(180deg, #3a506b 0%, #2c3e5a 100%)',
                    borderRadius: 20, padding: '24px 28px',
                    border: '3px solid #60a5fa',
                    boxShadow: '0 0 0 2px #1a2744, 0 20px 60px rgba(0,0,0,0.6)',
                    display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
                    maxWidth: 420, textAlign: 'center',
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(96,165,250,0.3)',
                    }}>
                      <AlertTriangle size={24} color="#fff" />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4f8', fontFamily: '"Inter", sans-serif' }}>
                      Apakah Anda akan load save sebelumnya [{historyLoadConfirm.historyIndex + 1}]?
                    </div>
                    <div style={{ fontSize: 11, color: '#8aa4c0', fontFamily: '"Inter", sans-serif' }}>
                      Progress saat ini akan ditimpa.
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={async () => {
                        const i = historyLoadConfirm.historyIndex;
                        setHistoryLoadConfirm(null);
                        try {
                          const token = await getIdToken();
                          const res = await fetch('/api/circuits?action=history_load', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ itemId: saveSlots[historyOpen].slotId, historyIndex: i }),
                          });
                          if (res.ok) {
                            const d = await res.json();
                            if (d.data?.circuitState) {
                              const loaded = d.data.circuitState;
                              skipHistoryRef.current = true;
                              setComponents(JSON.parse(JSON.stringify(loaded.components || [])));
                              setWires(JSON.parse(JSON.stringify(loaded.wires || [])));
                              if (loaded.typeCounters) setTypeCounters(loaded.typeCounters);
                              if (loaded.nextId) setNextId(loaded.nextId);
                              setTimeout(() => {
                                pushCircuitHistory(loaded.components || [], loaded.wires || []);
                                lastRecordedRef.current = { comps: JSON.stringify(loaded.components || []), wrs: JSON.stringify(loaded.wires || []) };
                              }, 50);
                              clearToolUIState();
                              setSaveStatus({ message: `History [${i + 1}] berhasil di-load!`, type: 'success' });
                              setHistoryOpen(null);
                            }
                          }
                        } catch (e) { setSaveStatus({ message: 'Gagal load history: ' + e.message, type: 'error' }); }
                      }} style={{
                        padding: '10px 32px', borderRadius: 50,
                        background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)',
                        border: '2px solid #2563eb',
                        boxShadow: '0 4px 0 #1d4ed8, 0 6px 12px rgba(0,0,0,0.4)',
                        color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                        fontFamily: '"Inter", sans-serif', letterSpacing: 1,
                      }}>Ya</button>
                      <button onClick={() => setHistoryLoadConfirm(null)} style={{
                        padding: '10px 32px', borderRadius: 50,
                        background: 'linear-gradient(180deg, #4a5568 0%, #3a4558 100%)',
                        border: '2px solid #2a3548',
                        boxShadow: '0 4px 0 #1a2538, 0 6px 12px rgba(0,0,0,0.4)',
                        color: '#8aa4c0', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                        fontFamily: '"Inter", sans-serif', letterSpacing: 1,
                      }}>Tidak</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Slot Color Picker Modal ── */}
              {slotColorEdit !== null && <SlotColorPickerModal
                slotIndex={slotColorEdit.slotIndex}
                slot={{ ...saveSlots[slotColorEdit.slotIndex], _draftHex: slotColorEdit.draftHex }}
                onConfirm={(sIdx, newColor) => {
                  setSaveSlots(prev => prev.map((s, i) => i === sIdx ? { ...s, color: newColor } : s));
                  setSlotColorEdit(null);
                  toast.success(`Warna Slot ${sIdx + 1} berhasil diubah!`, { description: newColor.toUpperCase() });
                }}
                onCancel={() => setSlotColorEdit(null)}
                onPickFromWorkspace={(currentDraftHex) => {
                  const savedSlotIndex = slotColorEdit.slotIndex;
                  const savedDraftHex = currentDraftHex;
                  // Close modal temporarily so user sees Save Progress window
                  setSlotColorEdit(null);
                  // Enter pick-from-workspace mode on canvas (same flow as component paint picker)
                  setPickFromWorkspace({ slotIndex: savedSlotIndex, draftHex: savedDraftHex, source: 'slot' });
                  // Apply custom eyedropper cursor (same icon as paint picker)
                  const cursorUrl = getEyedropperCursorUrl();
                  const canvas = document.querySelector('canvas');
                  if (canvas) canvas.style.cursor = `url('${cursorUrl}') 6 26, crosshair`;
                  setStatus('Click anywhere on Save Progress to pick a color');
                }}
              />}

              {/* ── Swap Success Overlay (covers save progress window) ── */}
              {swapSuccessOverlay && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 200,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.65)',
                  borderRadius: 20,
                  animation: 'swapOverlayFadeIn 0.3s ease-out',
                }}>
                  <div style={{
                    background: 'linear-gradient(180deg, #1e3a5f 0%, #162d4a 100%)',
                    borderRadius: 20, padding: '32px 40px',
                    border: '3px solid #6bc74d',
                    boxShadow: '0 0 0 2px #0f1f33, 0 0 40px rgba(107,199,77,0.3), 0 20px 60px rgba(0,0,0,0.6)',
                    display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
                    textAlign: 'center', maxWidth: 360,
                  }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: 'linear-gradient(180deg, #76d746 0%, #6bc74d 50%, #55a838 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(107,199,77,0.4)',
                    }}>
                      <Check size={28} color="#fff" strokeWidth={3} />
                    </div>
                    <div style={{
                      fontSize: 18, fontWeight: 900, color: '#f0f4f8',
                      fontFamily: '"Inter", sans-serif', letterSpacing: 1,
                      textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    }}>
                      SLOT BERHASIL DITUKAR!
                    </div>
                    <div style={{ fontSize: 13, color: '#8aa4c0', lineHeight: 1.5 }}>
                      Slot {swapSuccessOverlay.from} dan Slot {swapSuccessOverlay.to} telah bertukar posisi.
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── Mode indicator (FIXED tengah layar, gede, dynamic) ──
              Posisi fixed di tengah-atas layar — left:50% + translateX(-50%).
              Responsif: PC → tengah layar lebar, mobile → tengah layar sempit.
              Ukuran lebih gede dari tombol lain.
              GAK PERNAH redup — selalu terang & keliatan jelas.
              Berganti teks & warna sesuai mode aktif:
              - build → "mode: build" + hijau (#4ade80)
              - connect → "mode: connect wire" + cyan (#22d3ee)
              - paint → "mode: paint" + hot pink (#ff0080)
              - delete → "mode: delete" + merah darah (#ff1744)
              Klik → kembali ke build mode (reset semua special mode). */}
          <button
            onClick={() => {
              if (anySpecialMode) {
                setMode('build');
                setPaintMode(false);
                setDeleteMode(false);
                setCloneMode(false);
                setMoveMode(false);
                setRotateMode(false);
                setCloneBox(null);
                setCloneSelectedIds([]);
                setCloneAnchors(null);
                setMoveBox(null);
                setMoveSelectedIds([]);
                setMoveAnchors(null);
                setMoveActiveDir(null);
                setRotateBox(null);
                setRotateSelectedIds([]);
                setRotateAnchors(null);
              }
            }}
            title={anySpecialMode ? 'Return to Build mode' : 'Build mode active (default)'}
            style={{
              position: 'fixed',
              top: isMobile ? 52 : 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 8 : 8,
              padding: isMobile ? '10px 14px' : '14px 22px', borderRadius: isMobile ? 10 : 12,
              border: (isMobile ? '1px' : '2px') + ' solid ' + (
                moveMode ? '#0ea5e9' :
                rotateMode ? '#f59e0b' :
                cloneMode ? '#c084fc' :
                mode === 'connect' ? '#22d3ee' :
                paintMode ? '#ff0080' :
                deleteMode ? '#ff1744' :
                '#4ade80'
              ),
              backgroundColor: (
                moveMode ? 'rgba(14, 165, 233, 0.10)' :
                rotateMode ? 'rgba(245, 158, 11, 0.10)' :
                cloneMode ? 'rgba(192, 132, 252, 0.10)' :
                mode === 'connect' ? 'rgba(34, 211, 238, 0.18)' :
                paintMode ? 'rgba(255, 0, 128, 0.10)' :
                deleteMode ? 'rgba(255, 23, 68, 0.12)' :
                'rgba(74, 222, 128, 0.15)'
              ),
              color: (
                moveMode ? '#0ea5e9' :
                rotateMode ? '#f59e0b' :
                cloneMode ? '#c084fc' :
                mode === 'connect' ? '#22d3ee' :
                paintMode ? '#ff0080' :
                deleteMode ? '#ff1744' :
                '#4ade80'
              ),
              fontSize: isMobile ? 13 : 15, fontWeight: isMobile ? 700 : 800, fontFamily: '"Inter", sans-serif',
              cursor: anySpecialMode ? 'pointer' : 'default',
              boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.4)' : '0 3px 12px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(6px)',
              transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
              userSelect: 'none',
              letterSpacing: '0.3px',
              whiteSpace: 'nowrap',
              // GAK PERNAH redup — selalu opacity 1
            }}
          >
            {/* Ikon dinamis sesuai mode aktif */}
            {moveMode ? (
               <svg width={isMobile ? 16 : 16} height={isMobile ? 16 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                 <path d="M5 12h14M12 5l7 7-7 7" />
               </svg>
             ) : rotateMode ? (
               <svg width={isMobile ? 16 : 16} height={isMobile ? 16 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                 <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                 <polyline points="21 3 21 9 15 9" />
               </svg>
             ) : cloneMode ? (
               <svg width={isMobile ? 16 : 16} height={isMobile ? 16 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                 <rect x="8" y="8" width="13" height="13" rx="2" />
                 <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
               </svg>
             ) : mode === 'connect' ? <Cable size={isMobile ? 16 : 16} /> :
             paintMode ? <Paintbrush size={isMobile ? 16 : 16} strokeWidth={2.2} /> :
             deleteMode ? (
               <svg width={isMobile ? 18 : 18} height={isMobile ? 18 : 18} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                 <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" fill="rgba(255,23,68,0.12)" opacity="0.7" />
                 <path d="M8.5 8.5 L15.5 15.5 M8.5 15.5 L15.5 8.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
             ) : <MousePointer2 size={isMobile ? 16 : 16} />}
            <span>{isMobile ? '' : 'mode: '}{moveMode ? 'move area' : rotateMode ? 'rotate area' : cloneMode ? 'cloning area' : mode === 'connect' ? 'connect wire' : paintMode ? 'paint' : deleteMode ? 'delete' : 'build'}</span>
          </button>
          {/* Status text removed — user request: hilangin sepenuhnya */}
          {/* Zoom + coordinate controls — FIXED ke viewport (bukan absolute di canvasWrap).
              User request: 'papan informasi... wajib sejajar dengan tombol chat helper,
              karena misal saya scroll di area sidebar pada mobile dia gak ikut ilang'.
              Sebelumnya position:absolute bottom:10 left:10 di canvasWrap → di mobile kalau
              palette sidebar scroll/overlay, bar ini ikut ilang ketutupan sidebar.
              Fix: position:fixed bottom:24 left:24 (match AIHelperButton bottom:24 right:24)
              supaya selalu fixed di viewport, gak peduli scroll sidebar / pan workspace / zoom.
              zIndex 200 = same as AIHelperButton supaya selalu on top. */}
          <div style={{
            position: 'fixed',
            bottom: 24,
            // Geser ke kanan saat palette open supaya gak nabrak palette sidebar.
            // Palette maxWidth 240 → saat open offset ke 240+24=264. Saat closed tetap left:24.
            left: paletteOpen ? 264 : 24,
            zIndex: 200,
            display: 'flex', alignItems: 'center', gap: 0,
            backgroundColor: 'rgba(15,23,42,0.9)',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: 4,
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            fontFamily: '"Inter", sans-serif',
            transition: 'left 0.22s ease',
          }}>
            <button
              onClick={() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                const cx = rect.width / 2, cy = rect.height / 2;
                zoomAt(cx, cy, 0.8);
              }}
              title="Zoom Out"
              style={{
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', backgroundColor: 'transparent', color: '#94a3b8',
                cursor: 'pointer', borderRadius: 5, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <ZoomOut size={14} />
            </button>
            <span style={{
              minWidth: 44, textAlign: 'center',
              fontSize: 11, color: '#cbd5e1', fontWeight: 600,
              userSelect: 'none', cursor: 'default',
            }}>
              {zoomPct}%
            </span>
            <button
              onClick={() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                const cx = rect.width / 2, cy = rect.height / 2;
                zoomAt(cx, cy, 1.25);
              }}
              title="Zoom In"
              style={{
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', backgroundColor: 'transparent', color: '#94a3b8',
                cursor: 'pointer', borderRadius: 5, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={resetView}
              title="Reset View (100%)"
              style={{
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', backgroundColor: 'transparent', color: '#94a3b8',
                cursor: 'pointer', borderRadius: 5, transition: 'all 0.15s',
                borderLeft: '1px solid #334155',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Maximize2 size={12} />
            </button>
            {/* Coordinate readout — world X,Y di bawah cursor. Empty saat mouse di luar canvas. */}
            <div style={{
              borderLeft: '1px solid #334155',
              paddingLeft: 10, paddingRight: 8,
              marginLeft: 4,
              minWidth: 96,
              fontSize: 11, color: '#64748b', fontWeight: 500,
              fontVariantNumeric: 'tabular-nums',
              display: 'flex', alignItems: 'center', gap: 6,
              userSelect: 'none',
            }}>
              {cursorWorld ? (
                <>
                  <span style={{ color: '#94a3b8' }}>X</span>
                  <span style={{ color: '#cbd5e1', minWidth: 28, textAlign: 'right' }}>{cursorWorld.x}</span>
                  <span style={{ color: '#94a3b8' }}>Y</span>
                  <span style={{ color: '#cbd5e1', minWidth: 28, textAlign: 'right' }}>{cursorWorld.y}</span>
                </>
              ) : (
                <span style={{ color: '#475569' }}>X — Y —</span>
              )}
            </div>
          </div>
        </div>
      </div>
      {dragGhost && <DragGhost type={dragGhost.type} x={dragGhost.x} y={dragGhost.y} />}

      {showClearConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            fontFamily: '"Inter", sans-serif',
          }}
          onClick={cancelClear}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 14,
              padding: '24px 28px',
              maxWidth: 380,
              width: 'calc(100% - 40px)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              color: '#e2e8f0',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                backgroundColor: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ef4444', fontSize: 20, fontWeight: 700, flexShrink: 0,
              }}>!</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', fontFamily: '"Orbitron", sans-serif' }}>
                Hapus Semua Komponen?
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.55, margin: '0 0 22px 0' }}>
              Kamu yakin mau hapus semua gerbang, switch, LED, dan kabel dari canvas? Aksi ini gak bisa di-undo.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={cancelClear}
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  border: '1px solid #334155', backgroundColor: '#0f172a',
                  color: '#94a3b8', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: '"Inter", sans-serif',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#475569'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#334155'; }}
              >
                Tidak
              </button>
              <button
                onClick={performClear}
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  border: '1px solid #dc2626', backgroundColor: '#dc2626',
                  color: '#fff', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: '"Inter", sans-serif',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#b91c1c'; e.currentTarget.style.borderColor = '#b91c1c'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.borderColor = '#dc2626'; }}
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Color Picker (Wire & Component) ──
          Classic Windows-style: Color wheel + HSV sliders + RGB sliders + preview.
          Confirm/Reset/Cancel buttons directly below.
          State: colorPicker = { targetType: 'wire'|'comp', targetId, x, y, hex, originalHex } */}
      {colorPicker && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setColorPicker(null)}
        >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid #475569',
            borderRadius: 8,
            padding: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            fontFamily: '"Inter", sans-serif',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', textAlign: 'center' }}>
            {colorPicker.targetType === 'comp' ? 'Component Color' : 'Wire Color'}
          </div>

          {/* Classic color wheel picker — fully self-contained */}
          <ColorWheelPicker
            hex={colorPicker.hex}
            onChange={newHex => setColorPicker(cp => cp ? { ...cp, hex: newHex } : cp)}
            onPickColor={() => {
              // Save current picker state, close modal, enter pick-from-workspace mode
              const savedPicker = { ...colorPicker };
              setColorPicker(null);
              setPickFromWorkspace(savedPicker);
              // Apply custom eyedropper cursor (shared with slot picker)
              const cursorUrl = getEyedropperCursorUrl();
              const canvas = document.querySelector('canvas');
              if (canvas) canvas.style.cursor = `url('${cursorUrl}') 6 26, crosshair`;
              setStatus('Click a component or wire to pick its color');
            }}
          />

          {/* Action buttons: Confirm | Cancel — directly below */}
          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
            <button
              onClick={() => {
                const hex = colorPicker.hex;
                const tgtType = colorPicker.targetType;
                const tgtId = colorPicker.targetId;
                if (tgtType === 'comp') {
                  setComponents(prevComps => prevComps.map(c =>
                    c.id === tgtId ? { ...c, userColor: hex } : c
                  ));
                  setStatus('Component color confirmed: ' + hex.toUpperCase());
                  toast.success('Warna komponen berhasil diubah!', { description: hex.toUpperCase() });
                } else {
                  setWires(prevWires => prevWires.map(w =>
                    w.id === tgtId ? { ...w, userColor: hex } : w
                  ));
                  setStatus('Wire color confirmed: ' + hex.toUpperCase());
                  toast.success('Warna kabel berhasil diubah!', { description: hex.toUpperCase() });
                }
                setColorPicker(null);
              }}
              style={{
                flex: 1, padding: '5px 8px', fontSize: 11, fontWeight: 700,
                background: 'linear-gradient(135deg, #059669, #10b981)', border: '1px solid #34d399',
                borderRadius: 4, color: '#ffffff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Check size={12} strokeWidth={2.5} />
              Confirm
            </button>
            <button
              onClick={() => {
                const origHex = colorPicker.originalHex;
                const tgtType = colorPicker.targetType;
                const tgtId = colorPicker.targetId;
                if (tgtType === 'comp') {
                  setComponents(prevComps => prevComps.map(c =>
                    c.id === tgtId ? { ...c, userColor: origHex } : c
                  ));
                } else {
                  setWires(prevWires => prevWires.map(w =>
                    w.id === tgtId ? { ...w, userColor: origHex } : w
                  ));
                }
                setColorPicker(null);
                setStatus('Color change cancelled');
              }}
              style={{ flex: 1, padding: '5px 8px', fontSize: 11, fontWeight: 600, background: '#1e293b', border: '1px solid #475569', borderRadius: 4, color: '#94a3b8', cursor: 'pointer' }}
            >Cancel</button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
