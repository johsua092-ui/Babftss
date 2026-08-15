import { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, PanelLeftClose, PanelLeftOpen, MousePointer2, Cable, X, Paintbrush } from 'lucide-react';

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
  const def = GATE_MAP[c.type] || IO_DEFS[c.type];
  return { x: c.x, y: c.y, w: def.width || 90, h: def.height || 56 };
}

// STRICT collision: pakai FULL bounding box + GAP_MARGIN di tiap sisi.
// User request: kabel gak boleh menempel/nabrak kotak komponen, harus ada gap minimal.
// Gap 12px = cukup buat visual clearance (wire 3px + 9px whitespace).
// Ini KEBALIKAN dari versi lama (COLLISION_MARGIN=8 yang SHRINK box → wire bisa
// lewat 8px dari tepi body tanpa dianggap nabrak).
const GAP_MARGIN = 12;
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

  // Kumpulin kandidat midX: (a) hug box edge tiap comp, (b) offset dari midX ideal.
  const hvhMidXs = new Set();
  // (a) Hug box edge: midX pas di luar GAP_MARGIN tiap komponen (kiri & kanan).
  //     Ini explicitly route di sekitar comp penghalang.
  for (const c of comps) {
    if (c.id === srcId || c.id === dstId) continue;
    const box = getCompBox(c);
    hvhMidXs.add(box.x - GAP_MARGIN - 2);             // just left of comp
    hvhMidXs.add(box.x + box.w + GAP_MARGIN + 2);     // just right of comp
  }
  // (b) Offset dari midX ideal (Z-shape di tengah gap, lalu eksplorasi kiri/kanan).
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
  for (const c of comps) {
    if (c.id === srcId || c.id === dstId) continue;
    const box = getCompBox(c);
    vhvMidYs.add(box.y - GAP_MARGIN - 2);             // just above comp
    vhvMidYs.add(box.y + box.h + GAP_MARGIN + 2);     // just below comp
  }
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

// ── Canvas Simulator ──
export default function LogicGatesSimulator({ setPage }) {
  const canvasRef = useRef(null);
  const minimapRef = useRef(null);
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [nextId, setNextId] = useState(1);
  // Counter per-type untuk numbering (AND 1, AND 2, OR 1, OR 2, NOT 1, INPUT 1, OUTPUT 1, dll).
  // Persistent: kalau AND 2 di-delete, AND berikutnya yang dibuat jadi AND 3 (bukan reuse AND 2).
  // Alasan: gak bikin bingung — kalau nomor reuse, user bisa kira "AND 2 yang lama" padahal gak.
  const [typeCounters, setTypeCounters] = useState({});
  const [status, setStatus] = useState('Ready — drag from palette, click nodes to wire');
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
  // Sidebar palette toggle — user minta: bisa tutup panel komponen biar leluasa berkreasi di canvas,
  // buka lagi kalau mau add komponen. Default true (terbuka) supaya user pertama kali lihat palette.
  // DI MOBILE: default false (tutup) supaya sidebar gak nutupin canvas yang udah sempit.
  const [paletteOpen, setPaletteOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  // Ref untuk mengukur lebar palette secara real-time → offset button stack supaya gak nabrak.
  const paletteRef = useRef(null);
  const [paletteWidth, setPaletteWidth] = useState(0);
  useEffect(() => {
    if (paletteRef.current) {
      const w = paletteRef.current.offsetWidth;
      setPaletteWidth(w);
    } else {
      setPaletteWidth(0);
    }
  }, [paletteOpen]);
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
  const paintModeRef = useRef(false);
  const deleteModeRef = useRef(false);
  useEffect(() => { paintModeRef.current = paintMode; }, [paintMode]);
  useEffect(() => { deleteModeRef.current = deleteMode; }, [deleteMode]);
  // Helper toggle: turn ON paint = turn OFF delete, dan sebaliknya (mutual exclusive).
  const togglePaint = () => {
    setPaintMode(prev => {
      const next = !prev;
      if (next) setDeleteMode(false);
      return next;
    });
  };
  const toggleDelete = () => {
    setDeleteMode(prev => {
      const next = !prev;
      if (next) setPaintMode(false);
      return next;
    });
  };
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
  });
  useEffect(() => { stateRef.current = { ...stateRef.current, components, wires, nextId, selectedId, typeCounters }; }, [components, wires, nextId, selectedId, typeCounters]);

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
    // Port y untuk INPUT/OUTPUT (Switch/LED): default spacing berdasarkan jumlah port.
    // Port y untuk logic gate (NOT/AND/.../XNOR): DISESUAIKAN supaya LURUS dengan
    // gate internal wire y. Konstanta match drawGateShape + render call site:
    //   drawGateShape: L=15, N=5, q=25 (lokal)
    //   render call: translate y = comp.y+20, GATE_SCALE = 1.2
    //   → NOT input & gate output wire y global = comp.y + 20 + 15*1.2 = comp.y + 38
    //   → dual input atas y global = comp.y + 20 + (N+3)*1.2 = comp.y + 29.6
    //   → dual input bawah y global = comp.y + 20 + (q-3)*1.2 = comp.y + 46.4
    // Sebelumnya port pakai spacing comp.height/(n+1) → y gak lurus dengan gate wire
    // → kabel gak nyambung. User minta port digeser biar lurus.
    if (comp.type === 'INPUT' || comp.type === 'OUTPUT') {
      if (isInput) {
        const spacing = comp.height / (comp.inputs.length + 1);
        return { x: comp.x, y: comp.y + spacing * (idx + 1) };
      } else {
        const spacing = comp.height / (comp.outputs.length + 1);
        return { x: comp.x + comp.width, y: comp.y + spacing * (idx + 1) };
      }
    }
    // Logic gate (not/and/nand/or/nor/xor/xnor)
    if (isInput) {
      if (comp.type === 'not') {
        return { x: comp.x, y: comp.y + 38 };  // match L=15 scaled
      }
      // Dual input
      return { x: comp.x, y: comp.y + (idx === 0 ? 29.6 : 46.4) };
    } else {
      // Output (selalu 1, di tengah-tengah body, y = L=15 scaled)
      return { x: comp.x + comp.width, y: comp.y + 38 };
    }
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

    const draw = () => {
      const { components: comps, wires: wrs, wiring, hoverNode, hoverZone, selectedId: selId, view } = stateRef.current;
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
        const src = comps.find(c => c.id === wire.from);
        const dst = comps.find(c => c.id === wire.to);
        if (!src || !dst) continue;
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
      for (const comp of comps) {
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
          // Header bar
          ctx.fillStyle = compColor + '18';
          roundRect(ctx, comp.x + 1, comp.y + 1, comp.width - 2, 14, [7, 7, 0, 0]);
          ctx.fill();

          // Label — dengan numbering per-type (AND 1, AND 2, OR 1, INPUT 1, OUTPUT 1, dll).
          // typeNum fallback ke 1 kalau comp lama (sebelum fitur ini) gak punya field.
          const labelNum = comp.typeNum || 1;
          const labelText = def.label + ' ' + labelNum;
          ctx.fillStyle = compColor;
          ctx.font = 'bold 9px "Orbitron", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, comp.x + comp.width / 2, comp.y + 8);

          // Gate body — model dari "7 Basic Logic Gates" menu (GateDiagram.jsx)
          // CENTER sejati + SCALE UP supaya gate body gak kelihatan kecil di box.
          // Iterasi: 1.5x kegedean → overflow border (XNOR 48*1.5=72, plus back curve
          // extend ke kiri). 1.2x muat dengan margin aman (XNOR 48*1.2=57.6 < 90).
          ctx.save();
          const GATE_SCALE = 1.2;
          const gateDrawW = getGateDrawWidth(comp.type) * GATE_SCALE;
          const gateTranslateX = (comp.width - gateDrawW) / 2;
          // Vertical centering: body area = comp.y+14 to comp.y+56 (42px tall).
          // Gate local y spans 0..25, scaled = 0..30, center at 15.
          // Target center = comp.y + 35 (mid of 14..56). Translate y = 35 - 15 = 20.
          ctx.translate(comp.x + gateTranslateX, comp.y + 20);
          ctx.scale(GATE_SCALE, GATE_SCALE);
          drawGateShape(ctx, comp.type, compColor, isOn, comp.inputs);
          ctx.restore();

          // ── Global input/output wires: PORT → gate internal wire start/end ──
          // User complaint: kabel input/output kependekan, gak nyentuh port.
          // Root cause: gate internal wires (di drawGateShape lokal) cuma dari
          // x=0 ke x=C=5, jadi global x = comp.x+gateTranslateX ke comp.x+gateTranslateX+6.
          // Port ada di comp.x & comp.x+comp.width → gap gede antara port & wire.
          // Fix: tambah global wires dari port ke gate internal wire start (kiri)
          // dan dari gate internal wire end (kanan) ke port output. Karena port y
          // udah di-align sama gate internal wire y (lihat getNodePos), wires ini
          // garis horizontal lurus.
          const wireColor = (v) => v ? compColor : '#475569';
          ctx.lineWidth = 2.2 * GATE_SCALE;
          ctx.lineCap = 'round';
          // Input wires: port (comp.x, port_y) → gate internal wire start (comp.x+gateTranslateX, port_y)
          for (let i = 0; i < comp.inputs.length; i++) {
            const portPos = getNodePos(comp, true, i);
            ctx.beginPath();
            ctx.strokeStyle = wireColor(comp.inputs[i]);
            ctx.moveTo(portPos.x, portPos.y);
            ctx.lineTo(comp.x + gateTranslateX, portPos.y);
            ctx.stroke();
          }
          // Output wire: gate internal wire end (comp.x+gateTranslateX+gateDrawW, out_y) → port (comp.x+comp.width, out_y)
          const outPortPos = getNodePos(comp, false, 0);
          ctx.beginPath();
          ctx.strokeStyle = wireColor(comp.outputs[0]);
          ctx.moveTo(comp.x + gateTranslateX + gateDrawW, outPortPos.y);
          ctx.lineTo(outPortPos.x, outPortPos.y);
          ctx.stroke();
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
          // Bounding box semua komponen.
          // Penting: GATE_MAP entries gak punya field width/height (cuma IO_DEFS yang punya),
          // jadi fallback ke default gate box 90x56 untuk gate types biasa.
          const compBox = (c) => {
            const def = GATE_MAP[c.type] || IO_DEFS[c.type];
            const w = def.width || 90;
            const h = def.height || 56;
            return { w, h };
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
      // Pan aktif jika: middle mouse button (button=1) ATAU left mouse + space held.
      if (e.button === 1) return true;
      if (e.button === 0 && spaceDownRef.current) return true;
      return false;
    };

    const onMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      // ── Pan mode ──
      if (isPanningTrigger(e)) {
        e.preventDefault();
        const v = stateRef.current.view;
        stateRef.current.panning = {
          startSX: sx, startSY: sy,
          startVX: v.x, startVY: v.y,
        };
        canvas.style.cursor = 'grabbing';
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
          setColorPicker({ targetType: 'comp', targetId: comp.id, x: sx, y: sy, hex: currentHex });
          setStatus('Component clicked — pick a color');
          return;
        }
        const wireHit = hitTestWire(mx, my, stateRef.current.wires, stateRef.current.components);
        if (wireHit) {
          // Klik wire → buka RGB color picker di posisi click.
          // Wire ke-1 (color=null) tetap bisa di-recolor via userColor (override hijau default).
          const w = wireHit.wire;
          const currentHex = w.userColor || (w.color ? hslToHex(w.color.h, w.color.s, 50) : '#4ade80');
          setColorPicker({ targetType: 'wire', targetId: w.id, x: sx, y: sy, hex: currentHex });
          setStatus('Wire clicked — pick a color');
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
        canvas.style.cursor = 'pointer';
      } else if (hit && hit.kind === 'drag-handle') {
        stateRef.current.hoverNode = null;
        canvas.style.cursor = 'move';
      } else if (hit && hit.kind === 'body') {
        stateRef.current.hoverNode = null;
        canvas.style.cursor = hit.comp.type === 'INPUT' ? 'pointer' : 'move';
      } else {
        stateRef.current.hoverNode = null;
        canvas.style.cursor = spaceDownRef.current ? 'grab' : (stateRef.current.wiring ? 'crosshair' : 'default');
      }
    };

    const onMouseUp = (e) => {
      // Stop panning (button 1 release atau button 0 release saat panning aktif).
      if (stateRef.current.panning) {
        stateRef.current.panning = null;
        canvas.style.cursor = spaceDownRef.current ? 'grab' : 'default';
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
        if (!stateRef.current.panning) canvas.style.cursor = 'grab';
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null) {
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
        if (!stateRef.current.panning) canvas.style.cursor = 'default';
      }
    };

    // Mouseleave canvas = cancel pan biar gak stuck grabbing + clear coord display.
    const onMouseLeave = () => {
      if (stateRef.current.panning) {
        stateRef.current.panning = null;
        canvas.style.cursor = spaceDownRef.current ? 'grab' : 'default';
      }
      setCursorWorld(null);
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', onContextMenu);
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

        // ── PAINT MODE (mobile): tap wire/komponen = buka color picker. Drag, wiring, toggle di-block. ──
        if (paintModeRef.current) {
          if (hit) {
            const comp = hit.comp;
            const def = GATE_MAP[comp.type] || IO_DEFS[comp.type];
            const currentHex = comp.userColor || def.color;
            setColorPicker({ targetType: 'comp', targetId: comp.id, x: sx, y: sy, hex: currentHex });
            setStatus('Component tapped — pick a color');
            return;
          }
          const wireHit = hitTestWire(mx, my, stateRef.current.wires, stateRef.current.components);
          if (wireHit) {
            const w = wireHit.wire;
            const currentHex = w.userColor || (w.color ? hslToHex(w.color.h, w.color.s, 50) : '#4ade80');
            setColorPicker({ targetType: 'wire', targetId: w.id, x: sx, y: sy, hex: currentHex });
            setStatus('Wire tapped — pick a color');
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
          // Empty area: start panning canvas (1-finger drag = pan).
          const v = stateRef.current.view;
          touchStateRef.current.panStart = { startSX: sx, startSY: sy, startVX: v.x, startVY: v.y };
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
        touchStateRef.current.pinchStart = {
          dist, midX, midY,
          viewX: v.x, viewY: v.y, scale: v.scale,
        };
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
        // ── PINCH ZOOM + 2-FINGER PAN ──
        const [p1, p2] = pointers;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const ps = touchStateRef.current.pinchStart;
        // Scale ratio relative to pinch start.
        const scaleFactor = dist / ps.dist;
        const newScale = Math.max(0.2, Math.min(5, ps.scale * scaleFactor));
        // Pan offset: gerak midpoint dari start midpoint.
        const panDx = midX - ps.midX;
        const panDy = midY - ps.midY;
        // Compute new view: keep pinch midpoint stable di world space.
        // World point at midpoint: worldMid = (ps.midX - viewX) / scale
        const worldMidX = (ps.midX - ps.viewX) / ps.scale;
        const worldMidY = (ps.midY - ps.viewY) / ps.scale;
        // New view supaya worldMid tetap di (midX, midY) on screen:
        const v = stateRef.current.view;
        v.scale = newScale;
        v.x = midX - worldMidX * newScale + panDx;
        v.y = midY - worldMidY * newScale + panDy;
        setZoomPct(Math.round(newScale * 100));
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
        // Pinch selesai (kurang dari 2 jari) — clear pinch state.
        touchStateRef.current.pinchStart = null;
      }
      if (pointers.length === 0) {
        // Semua jari diangkat — finalize single-touch action.

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
        const p = pointers[0];
        const v = stateRef.current.view;
        touchStateRef.current.panStart = { startSX: p.x, startSY: p.y, startVX: v.x, startVY: v.y };
        stateRef.current.dragging = null;
        stateRef.current.wiring = null;
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
        const def = GATE_MAP[c.type] || IO_DEFS[c.type];
        const w = def.width || 90;
        const h = def.height || 56;
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
      const def = GATE_MAP[c.type] || IO_DEFS[c.type];
      const w = def.width || 90;
      const h = def.height || 56;
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
    // Connect Wire mode: palette items disabled (visual feedback aja — real block
    // ada di onPaletteMouseDown/onPaletteTouchStart yang early-return). Opacity
    // dikit + cursor not-allowed supaya user paham item lagi gak bisa dipake.
    ...(mode === 'connect' ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
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

  const statusStyle = {
    position: 'absolute',
    top: 10, right: 10,
    fontSize: 11,
    color: '#64748b',
    backgroundColor: 'rgba(15,23,42,0.85)',
    padding: '4px 12px',
    borderRadius: 6,
    pointerEvents: 'none',
  };

  return (
    <div style={pageStyle}>
      {/* Custom scrollbar styling untuk palette — dark & slim biar gak kelihatan putih.
          Inject inline karena React inline style gak support pseudo-element selectors.
          `.palette-scroll` class di-apply ke div inner palette. */}
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
        <div ref={paletteRef} style={paletteStyle}>
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
          {/* ── Mode + Paint + Delete button stack ──
              Tiga tombol di-stack vertikal di top-left canvas wrapper.
              Wrapper div positioned absolute, top berubah tergantung paletteOpen
              (palette closed → ada toggle button di top:8 left:8, jadi stack digeser ke top:60).
              User request:
              - 'tombol mode:build' (sudah ada) — toggle build/connect wire.
              - Tepat di bawahnya: tombol 'paint' (biru). OFF = dim + 'paint off', ON = bright + 'paint on'.
              - Tepat di bawah paint: tombol 'delete' (merah, ikon X). OFF = dim + 'delete off', ON = bright + 'delete on'.
              - Paint & Delete saling mutual exclusive (turn ON satu → yang lain OFF).
              - Saat salah satu ON: drag komponen baru & geser komponen existing di-block. */}
          <div style={{
            position: 'absolute',
            top: paletteOpen ? 8 : 60,
            // Offset ke kanan berdasarkan lebar palette supaya gak nabrak/overlap.
            // Saat palette open: left = paletteWidth + 8 (8px margin dari edge palette).
            // Saat palette closed: left = 52 (toggle button 44px + 8px gap).
            left: paletteOpen ? paletteWidth + 8 : 52,
            zIndex: 20,
            display: 'flex', flexDirection: 'column', gap: 6,
            transition: 'top 0.22s ease, left 0.22s ease',
          }}>
            {/* Mode toggle — Build (drag/pan components) vs Connect Wire (zone-based wire connect).
                User request (gambar 3): 'tambahin tombol baru bernama mode' di samping kiri.
                Warna: hijau untuk Build (default mode), cyan (#22d3ee) untuk Connect (wire mode).
                Klik untuk toggle. modeRef sync via useEffect supaya event handlers baca mode baru. */}
            <button
              onClick={() => setMode(m => m === 'build' ? 'connect' : 'build')}
              title={mode === 'build' ? 'Switch to Connect Wire mode' : 'Switch to Build mode'}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                // Button dibikin gede biar enak pas pencet (mobile-friendly).
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid ' + (mode === 'build' ? '#4ade80' : '#22d3ee'),
                backgroundColor: mode === 'build' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(34, 211, 238, 0.15)',
                color: mode === 'build' ? '#4ade80' : '#22d3ee',
                fontSize: 13, fontWeight: 700, fontFamily: '"Inter", sans-serif',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                userSelect: 'none',
              }}
            >
              {/* Icon logo (MousePointer2 / Cable) JANGAN diubah — user request:
                  'logonya bagus itu logo iconnya jangan di sentuh'. Size 13 dipertahankan. */}
              {mode === 'build' ? <MousePointer2 size={13} /> : <Cable size={13} />}
              {/* Text label diubah: 'Build' → 'mode: build', 'Connect' → 'mode: connect wire'.
                  User request eksplisit: 'teksnya saja diganti jadi "mode: build" "mode: connect wire"'. */}
              <span>{mode === 'build' ? 'mode: build' : 'mode: connect wire'}</span>
            </button>

            {/* ── Paint Mode toggle ──
                Biru tua muda (#1e3a5f base). OFF = dim (low opacity), text 'paint off'.
                ON = bright (#3b6fa0 border, #6ba3d6 text), text 'paint on'.
                Saat ON: klik wire/komponen → buka color picker. Drag & wiring di-block.
                Mutual exclusive dengan Delete: turn ON paint → delete OFF. */}
            <button
              onClick={togglePaint}
              title={paintMode ? 'Paint mode ON — click wire/component to recolor' : 'Turn on Paint mode'}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                // OFF: border & bg dim (alpha 0.06), text biru redup (#60a5fa@0.5).
                // ON: border solid bright (#93c5fd), bg alpha 0.35 (lebih cerah dari 0.25), text biru cerah.
                // TIDAK ADA boxShadow glow — user spec: 'saat dinyalakan dilarang ada efek glow!'.
                // boxShadow flat '0 2px 8px rgba(0,0,0,0.4)' dipertahankan baik ON maupun OFF
                // (cuma drop shadow biasa, BUKAN color glow).
                border: '1px solid ' + (paintMode ? '#3b6fa0' : 'rgba(30, 58, 95, 0.3)'),
                backgroundColor: paintMode ? 'rgba(30, 58, 95, 0.55)' : 'rgba(30, 58, 95, 0.10)',
                color: paintMode ? '#6ba3d6' : 'rgba(30, 58, 95, 0.55)',
                fontSize: 13, fontWeight: 700, fontFamily: '"Inter", sans-serif',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                userSelect: 'none',
              }}
            >
              {/* Paint icon — Paintbrush (kuas cat) di kiri teks.
                  User request: 'sebelah kiri tulisan paint harusnya ada logo'.
                  OFF: icon dim (inherit color rgba). ON: icon bright + drop-shadow glow biru.
                  strokeWidth 2.2 (lebih bold dari default 2) biar keliatan jelas di size 16. */}
              <Paintbrush
                size={16}
                strokeWidth={2.2}
                style={{
                  flexShrink: 0,
                }}
              />
              <span>{paintMode ? 'paint on' : 'paint off'}</span>
            </button>

            {/* ── Delete Mode toggle ──
                Merah (#ef4444) dengan ikon X. OFF = dim, text 'delete off'.
                ON = bright (full opacity + glow), text 'delete on'.
                Saat ON: klik wire → wire hilang, klik komponen → komponen + wires-nya hilang.
                Drag & wiring di-block. Mutual exclusive dengan Paint. */}
            <button
              onClick={toggleDelete}
              title={deleteMode ? 'Delete mode ON — click wire/component to delete' : 'Turn on Delete mode'}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid ' + (deleteMode ? '#fca5a5' : 'rgba(239, 68, 68, 0.3)'),
                backgroundColor: deleteMode ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.06)',
                color: deleteMode ? '#fca5a5' : 'rgba(239, 68, 68, 0.5)',
                fontSize: 13, fontWeight: 700, fontFamily: '"Inter", sans-serif',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                userSelect: 'none',
              }}
            >
              {/* Ikon X merah — user request: 'design logo X di delete itu kecil woi dan terlalu biasa aja, harusnya bagus gitu'.
                  Upgrade: custom SVG X bold (strokeWidth 3) di dalam lingkaran badge (radius 10).
                  Total size 20px (lebih besar dari sebelumnya 13px).
                  Saat ON: drop-shadow glow merah ganda + subtle pulse animation.
                  Saat OFF: dim saja, no glow.
                  Circle badge opacity 0.5 + fill rgba 0.12 → kesan 'no entry' / prohibition sign yang iconic. */}
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
                  fill="rgba(239,68,68,0.12)"
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
              <span>{deleteMode ? 'delete on' : 'delete off'}</span>
            </button>
          </div>
          <div style={statusStyle}>{status}</div>
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
            bottom: 24, left: 24,
            zIndex: 200,
            display: 'flex', alignItems: 'center', gap: 0,
            backgroundColor: 'rgba(15,23,42,0.9)',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: 4,
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            fontFamily: '"Inter", sans-serif',
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
          Muncul saat user klik wire/komponen di Paint Mode.
          - Wire target: full RGB palette + preview ON/OFF (redup/terang) + tombol Random + Close.
          - Component target: full RGB palette + preview warna solid + tombol Reset (ke default) + Close.
          Posisi: dekat click point, tapi clamp supaya gak off-screen.
          State: colorPicker = { targetType: 'wire'|'comp', targetId, x, y, hex } */}
      {colorPicker && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(colorPicker.x, (canvasRef.current?.clientWidth || 800) - 280),
            top: Math.min(colorPicker.y, (canvasRef.current?.clientHeight || 600) - 200),
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid #475569',
            borderRadius: 10,
            padding: 14,
            width: 260,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            zIndex: 1000,
            fontFamily: '"Inter", sans-serif',
          }}
          onMouseDown={e => e.stopPropagation()}  // jangan trigger canvas mousedown
          onTouchStart={e => e.stopPropagation()}  // jangan trigger canvas touchstart (mobile)
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>
            {colorPicker.targetType === 'comp' ? 'Component Color' : 'Wire Color'}
          </div>

          {/* Color input — native browser RGB picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <input
              type="color"
              value={colorPicker.hex}
              onChange={e => {
                const hex = e.target.value;
                const tgtType = colorPicker.targetType;
                const tgtId = colorPicker.targetId;
                setColorPicker(cp => cp ? { ...cp, hex } : cp);
                // Apply ke target (wire atau comp) langsung (live preview).
                // Capture tgtType/tgtId di local var sebelum setColorPicker supaya gak stale.
                if (tgtType === 'comp') {
                  setComponents(prevComps => prevComps.map(c =>
                    c.id === tgtId ? { ...c, userColor: hex } : c
                  ));
                } else {
                  setWires(prevWires => prevWires.map(w =>
                    w.id === tgtId ? { ...w, userColor: hex } : w
                  ));
                }
              }}
              onInput={e => {
                // Fallback untuk mobile browser yang gak fire onChange pada <input type="color">.
                // onInput fires real-time di semua browser (termasuk mobile Safari/Chrome).
                const hex = e.target.value;
                if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
                const tgtType = colorPicker.targetType;
                const tgtId = colorPicker.targetId;
                setColorPicker(cp => cp ? { ...cp, hex } : cp);
                if (tgtType === 'comp') {
                  setComponents(prevComps => prevComps.map(c =>
                    c.id === tgtId ? { ...c, userColor: hex } : c
                  ));
                } else {
                  setWires(prevWires => prevWires.map(w =>
                    w.id === tgtId ? { ...w, userColor: hex } : w
                  ));
                }
              }}
              style={{
                width: 48, height: 36, border: '1px solid #475569',
                borderRadius: 6, cursor: 'pointer', padding: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Hex</div>
              <input
                type="text"
                value={colorPicker.hex.toUpperCase()}
                onChange={e => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                    const tgtType = colorPicker.targetType;
                    const tgtId = colorPicker.targetId;
                    setColorPicker(cp => cp ? { ...cp, hex: v.toLowerCase() } : cp);
                    if (tgtType === 'comp') {
                      setComponents(prevComps => prevComps.map(c =>
                        c.id === tgtId ? { ...c, userColor: v.toLowerCase() } : c
                      ));
                    } else {
                      setWires(prevWires => prevWires.map(w =>
                        w.id === tgtId ? { ...w, userColor: v.toLowerCase() } : w
                      ));
                    }
                  }
                }}
                style={{
                  width: '100%', padding: '4px 8px', fontSize: 12,
                  background: '#0f172a', border: '1px solid #334155',
                  borderRadius: 4, color: '#e2e8f0', fontFamily: 'monospace',
                }}
              />
            </div>
          </div>

          {/* Preview: wire = ON/OFF (redup/terang), comp = solid color saja */}
          {colorPicker.targetType === 'wire' ? (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    height: 28, borderRadius: 6, marginBottom: 4,
                    background: (() => {
                      const { h, s } = hexToHsl(colorPicker.hex);
                      return hslToHex(h, s, 30);
                    })(),
                    border: '2px solid #334155',
                  }}
                />
                <div style={{ fontSize: 10, color: '#94a3b8' }}>OFF (redup)</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    height: 28, borderRadius: 6, marginBottom: 4,
                    background: (() => {
                      const { h, s } = hexToHsl(colorPicker.hex);
                      return hslToHex(h, s, 65);
                    })(),
                    border: '2px solid #334155',
                  }}
                />
                <div style={{ fontSize: 10, color: '#94a3b8' }}>ON (terang)</div>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  height: 32, borderRadius: 6, marginBottom: 4,
                  background: colorPicker.hex,
                  border: '2px solid #334155',
                  boxShadow: `0 0 12px ${colorPicker.hex}80`,
                }}
              />
              <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>Component color</div>
            </div>
          )}

          {/* Action buttons: wire = Random, comp = Reset (ke default) */}
          <div style={{ display: 'flex', gap: 8 }}>
            {colorPicker.targetType === 'wire' ? (
              <button
                onClick={() => {
                  // Reset ke random color (regenerate).
                  setWires(prevWires => {
                    const otherHues = prevWires
                      .filter(w => w.id !== colorPicker.targetId && w.color)
                      .map(w => w.color.h);
                    const newColor = generateWireColor(otherHues);
                    return prevWires.map(w =>
                      w.id === colorPicker.targetId ? { ...w, color: newColor, userColor: null } : w
                    );
                  });
                  setColorPicker(null);
                  setStatus('Wire color randomized');
                }}
                style={{
                  flex: 1, padding: '6px 10px', fontSize: 11, fontWeight: 600,
                  background: '#334155', border: '1px solid #475569',
                  borderRadius: 6, color: '#e2e8f0', cursor: 'pointer',
                }}
              >
                Random
              </button>
            ) : (
              <button
                onClick={() => {
                  // Reset ke default color (clear userColor → pakai def.color).
                  setComponents(prevComps => prevComps.map(c =>
                    c.id === colorPicker.targetId ? { ...c, userColor: null } : c
                  ));
                  setColorPicker(null);
                  setStatus('Component color reset to default');
                }}
                style={{
                  flex: 1, padding: '6px 10px', fontSize: 11, fontWeight: 600,
                  background: '#334155', border: '1px solid #475569',
                  borderRadius: 6, color: '#e2e8f0', cursor: 'pointer',
                }}
              >
                Reset
              </button>
            )}
            <button
              onClick={() => setColorPicker(null)}
              style={{
                flex: 1, padding: '6px 10px', fontSize: 11, fontWeight: 600,
                background: '#1e293b', border: '1px solid #475569',
                borderRadius: 6, color: '#94a3b8', cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
