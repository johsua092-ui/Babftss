// lib/favorites-catalog.js — Metadata lookup untuk semua item yang bisa difavoritkan
// Digunakan oleh /api/my-favorites buat enrich response dengan nama, tier, deskripsi, dll.

const CATALOG = {

  // ── 7 Basic Logic Gates ──────────────────────────────────
  gate: [
    { id: "1",  name: "Basic Wire",        tier: "BASIC",  color: "#60a5fa", desc: "Sinyal mengalir langsung melewati kabel. Dasar semua rangkaian elektronik." },
    { id: "2",  name: "NOT Gate",          tier: "BASIC",  color: "#f87171", desc: "Pembalik sinyal (Inverter). Input 0 jadi 1, input 1 jadi 0." },
    { id: "3",  name: "AND Gate",          tier: "BASIC",  color: "#4ade80", desc: "Output 1 hanya jika kedua input 1. Seperti dua saklar seri." },
    { id: "4",  name: "NAND Gate",         tier: "BASIC",  color: "#fb923c", desc: "Kebalikan AND. Gerbang universal — semua gerbang bisa dibangun dari NAND." },
    { id: "5",  name: "OR Gate",           tier: "BASIC",  color: "#a78bfa", desc: "Output 1 jika salah satu atau kedua input 1. Seperti saklar paralel." },
    { id: "6",  name: "NOR Gate",          tier: "BASIC",  color: "#f472b6", desc: "Kebalikan OR. Output 1 hanya jika kedua input 0." },
    { id: "7",  name: "XOR Gate",          tier: "BASIC",  color: "#facc15", desc: "Exclusive OR. Output 1 hanya jika input berbeda (01 atau 10)." },
    { id: "8",  name: "XNOR Gate",         tier: "BASIC",  color: "#2dd4bf", desc: "Kebalikan XOR. Output 1 hanya jika input sama (00 atau 11)." },
  ],

  // ── Logic Gates Circuit Cards ────────────────────────────
  circuit: [
    { id: "01", name: "NOT AND Combo",              tier: "EASY",   color: "#4ade80" },
    { id: "02", name: "Buffer Negasi Ganda",         tier: "EASY",   color: "#f87171" },
    { id: "03", name: "Bangun NAND Manual",          tier: "EASY",   color: "#f87171" },
    { id: "04", name: "Bangun NOR Manual",           tier: "EASY",   color: "#f87171" },
    { id: "05", name: "Membangun XOR dari Gate Dasar", tier: "EASY", color: "#a78bfa" },
    { id: "06", name: "Gerbang 3 Input Sederhana",    tier: "EASY",   color: "#a78bfa" },
    { id: "07", name: "Gerbang 4 Input Lanjutan",     tier: "EASY",   color: "#facc15" },
    { id: "08", name: "Half Adder",                   tier: "EASY",   color: "#facc15" },
    { id: "09", name: "Full Adder",                   tier: "NORMAL", color: "#E30B5D" },
    { id: "10", name: "2:1 Multiplexer (Mux)",        tier: "NORMAL", color: "#facc15" },
    { id: "11", name: "4:1 Multiplexer (Mux)",        tier: "NORMAL", color: "#facc15" },
  ],

  // ── Gears (36 items) ────────────────────────────────────
  gear: [
    { id: "1",  name: "Spur (Basic) Gear",              color: "#22d3ee" },
    { id: "2",  name: "Helical Gear",                   color: "#60a5fa" },
    { id: "3",  name: "Herringbone Gear",               color: "#4ade80" },
    { id: "4",  name: "Worm Gear",                      color: "#a78bfa" },
    { id: "5",  name: "Rack & Pinion Gear",             color: "#fb923c" },
    { id: "6",  name: "Bevel Gear",                     color: "#f87171" },
    { id: "7",  name: "Miter Gear",                     color: "#f472b6" },
    { id: "8",  name: "Zerol Gear",                     color: "#facc15" },
    { id: "9",  name: "Hypoid Gear",                    color: "#c084fc" },
    { id: "10", name: "Crown Gear",                     color: "#fdba74" },
    { id: "11", name: "Ring & Planet Gear",             color: "#2dd4bf" },
    { id: "12", name: "Sun & Planet Gear",              color: "#fde047" },
    { id: "13", name: "Differential Gear",              color: "#86efac" },
    { id: "14", name: "Internal Ring Gear",             color: "#93c5fd" },
    { id: "15", name: "Sector Gear",                    color: "#c4b5fd" },
    { id: "16", name: "Ratchet & Pawl Gear",            color: "#fca5a5" },
    { id: "17", name: "Magnetic Gear",                  color: "#67e8f9" },
    { id: "18", name: "Geneva Drive Gear",              color: "#a5f3fc" },
    { id: "19", name: "Pin Gear (Lantern)",             color: "#fbcfe8" },
    { id: "20", name: "Double Helical Gear",            color: "#bbf7d0" },
    { id: "21", name: "Screw Gear",                     color: "#ddd6fe" },
    { id: "22", name: "Spiral Bevel Gear",              color: "#fed7aa" },
    { id: "23", name: "Sprocket / Chain Drive Gear",    color: "#fecdd3" },
    { id: "24", name: "Elliptical / Non-Circular Gear", color: "#d9f99d" },
    { id: "25", name: "Cage Gear",                      color: "#e9d5ff" },
    { id: "26", name: "Mutator Gear",                   color: "#ffedd5" },
    { id: "27", name: "Crossed Helical Gear",           color: "#ccfbf1" },
    { id: "28", name: "Face Gear",                      color: "#fce7f3" },
    { id: "29", name: "Involute Spline Gear",           color: "#e0e7ff" },
    { id: "30", name: "Timing / Synchronous Gear",      color: "#fef3c7" },
    { id: "31", name: "Planocentric / Nutating Gear",   color: "#d1fae5" },
    { id: "32", name: "Toroidal / Hourglass Gear",      color: "#ede9fe" },
    { id: "33", name: "Harmonic / Strain Wave Gear",    color: "#fee2e2" },
    { id: "34", name: "Trochoidal / Rotor Gear",        color: "#dcfce7" },
    { id: "35", name: "Cycloidal Gear",                 color: "#f3e8ff" },
    { id: "36", name: "Magnetic Planetary Gear",        color: "#fff7ed" },
  ],

  // ── Linkages (45 items) ─────────────────────────────────
  linkage: [
    { id: "1",  name: "Jansen's Linkage",              color: "#4ade80" },
    { id: "2",  name: "Klann Linkage",                 color: "#22d3ee" },
    { id: "3",  name: "Chebyshev's Lambda",            color: "#60a5fa" },
    { id: "4",  name: "Peaucellier-Lipkin",            color: "#a78bfa" },
    { id: "5",  name: "Watt's Linkage",                color: "#f472b6" },
    { id: "6",  name: "Hoekens Linkage",               color: "#fb923c" },
    { id: "7",  name: "Roberts Linkage",               color: "#f87171" },
    { id: "8",  name: "Scott Russell Linkage",         color: "#facc15" },
    { id: "9",  name: "Evan's Grasshopper",            color: "#2dd4bf" },
    { id: "10", name: "Tchebicheff Linkage",           color: "#c084fc" },
    { id: "11", name: "Sarrus Linkage",                color: "#fdba74" },
    { id: "12", name: "Hart's Inversor",               color: "#86efac" },
    { id: "13", name: "Kempe's Linkage",               color: "#93c5fd" },
    { id: "14", name: "Burmester Linkage",             color: "#c4b5fd" },
    { id: "15", name: "Four-Bar Linkage",              color: "#fca5a5" },
    { id: "16", name: "Slider-Crank Linkage",          color: "#67e8f9" },
    { id: "17", name: "Quick-Return Linkage",          color: "#a5f3fc" },
    { id: "18", name: "Toggle Linkage",                color: "#fbcfe8" },
    { id: "19", name: "Parallel Motion Linkage",       color: "#bbf7d0" },
    { id: "20", name: "Oldham Coupling",               color: "#ddd6fe" },
    { id: "21", name: "Universal Joint (Hooke's)",     color: "#fed7aa" },
    { id: "22", name: "Ackermann Steering Linkage",    color: "#fecdd3" },
    { id: "23", name: "Pantograph Linkage",            color: "#d9f99d" },
    { id: "24", name: "Lazy-Tongs Linkage",            color: "#e9d5ff" },
    { id: "25", name: "Stephenson Linkage",            color: "#ffedd5" },
    { id: "26", name: "Grashof Linkage",               color: "#ccfbf1" },
    { id: "27", name: "Multi-Bar Linkage",             color: "#fce7f3" },
    { id: "28", name: "Dwell Linkage",                 color: "#e0e7ff" },
    { id: "29", name: "Straight-Line Generator",       color: "#fef3c7" },
    { id: "30", name: "Elliptical Trammel",            color: "#d1fae5" },
    { id: "31", name: "Cognate Linkage",               color: "#ede9fe" },
    { id: "32", name: "Intermittent Motion Linkage",   color: "#fee2e2" },
    { id: "33", name: "Drafting Linkage",              color: "#dcfce7" },
    { id: "34", name: "Walking Beam Linkage",          color: "#f3e8ff" },
    { id: "35", name: "Lever & Fulcrum Linkage",       color: "#fff7ed" },
    { id: "36", name: "Bell-Crank Linkage",            color: "#cffafe" },
    { id: "37", name: "Crank & Rocker Linkage",        color: "#f5d0fe" },
    { id: "38", name: "Double-Crank Linkage",          color: "#fed7aa" },
    { id: "39", name: "Double-Rocker Linkage",         color: "#bfdbfe" },
    { id: "40", name: "Drag-Link Linkage",             color: "#fecaca" },
    { id: "41", name: "Flexure Linkage",               color: "#a7f3d0" },
    { id: "42", name: "Compliant Mechanism Linkage",   color: "#e0e7ff" },
    { id: "43", name: "Ratchet-Linkage Hybrid",        color: "#fde68a" },
    { id: "44", name: "Indexing Linkage",              color: "#d8b4fe" },
    { id: "45", name: "Planar Spherical Linkage",      color: "#fbcfe8" },
  ],
};

/**
 * Lookup satu item berdasarkan type + id.
 */
export function lookupItem(type, itemId) {
  const items = CATALOG[type];
  if (!items) return null;
  return items.find(item => item.id === itemId) || null;
}

/**
 * Enrich array favorit mentah (dari DB) dengan metadata item.
 */
export function enrichFavorites(favorites) {
  return favorites.map(fav => {
    const item = lookupItem(fav.item_type, fav.item_id);
    return {
      ...fav,
      item: item || { id: fav.item_id, name: fav.item_id, color: "#475569" },
    };
  });
}

/**
 * Return total count per type.
 */
export function getCatalogStats() {
  return {
    gate: CATALOG.gate.length,
    circuit: CATALOG.circuit.length,
    gear: CATALOG.gear.length,
    linkage: CATALOG.linkage.length,
  };
}
