/* ═══════════════════════════════════════════════════════════════════════════
   BlockIcons — set ikon khusus untuk panel pengaturan simulator.
   (2026-10-22, permintaan user: "icon camera & avatar jelek, 1/10")

   KENAPA TIDAK PAKAI LUCIDE:
   Ikon Lucide adalah garis 1.5px pada grid 24. Saat dipakai di 12–13px
   (ukuran yang wajar untuk baris setelan), garis itu menyusut jadi ±0.8px
   → tampak pucat, kabur, dan "generik" karena semua ikon punya berat sama
   tanpa detail pengenal. Camera Lucide khususnya hanya kotak + lingkaran
   garis, nyaris tak terbaca di 12px.

   BAHASA DESAIN SET INI:
   1. SOLID, bukan garis. Semua bentuk diisi penuh (fill: currentColor)
      sehingga tetap tegas saat diperkecil.
   2. Grid 24×24, padding optik 2px, sudut membulat konsisten (r ≈ 1.2–3).
   3. SETIAP ikon punya SATU detail potong (evenodd) — lubang lensa,
      potongan centang, celah leher — supaya bentuknya dikenali dari
      siluetnya, bukan dari detail kecil.
   4. Berat visual disamakan: luas tinta tiap ikon dijaga mirip, jadi
      tidak ada ikon yang "lebih berat" dari yang lain.
   5. Tema blok/geometris — konsisten dengan aplikasi builder balok.
   ═══════════════════════════════════════════════════════════════════════════ */

function Svg({ size = 14, children, style, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flexShrink: 0, ...style }}
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ── Kamera: badan blok + lensa cincin (lubang) + lensa inti solid ───────── */
export function IconCamera({ size, ...p }) {
  return (
    <Svg size={size} {...p}>
      <path d="M4.6 6.6h3.5l1.2-2.4c.18-.36.55-.6.95-.6h3.5c.4 0 .77.24.95.6l1.2 2.4h3.5c1.7 0 3 1.35 3 3v8.1c0 1.7-1.3 3-3 3H4.6c-1.7 0-3-1.3-3-3V9.6c0-1.65 1.3-3 3-3Zm7.4 2.3a5.3 5.3 0 1 0 0 10.6 5.3 5.3 0 0 0 0-10.6Zm0 1.7a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2Z" />
    </Svg>
  );
}

/* ── Avatar: kepala blok + bahu lebar (celah leher jadi pengenal) ────────── */
export function IconAvatar({ size, ...p }) {
  return (
    <Svg size={size} {...p}>
      <path d="M9.1 2.7h5.8c.72 0 1.3.58 1.3 1.3v4.9c0 .72-.58 1.3-1.3 1.3H9.1c-.72 0-1.3-.58-1.3-1.3V4c0-.72.58-1.3 1.3-1.3Z" />
      <path d="M5.1 12.5c2-.95 4.4-1.45 6.9-1.45s4.9.5 6.9 1.45c1.2.57 1.9 1.78 1.9 3.06v4.64c0 .72-.58 1.3-1.3 1.3H4.5c-.72 0-1.3-.58-1.3-1.3v-4.64c0-1.28.7-2.49 1.9-3.06Z" />
    </Svg>
  );
}

/* ── Perisai admin: solid + centang dipotong ────────────────────────────── */
export function IconShield({ size, ...p }) {
  return (
    <Svg size={size} {...p}>
      <path d="M12 2.3c2.85 1.6 5.9 2.36 9.05 2.44.33.01.6.28.6.61v6.16c0 5.28-3.85 9.2-9.3 10.5-.23.06-.47.06-.7 0C6.2 20.71 2.35 16.79 2.35 11.51V5.35c0-.33.27-.6.6-.61C6.1 4.66 9.15 3.9 12 2.3Zm-1.15 13.1-3.05-3.05a1.05 1.05 0 0 1 1.48-1.48l2.31 2.31 4.51-4.51a1.05 1.05 0 0 1 1.48 1.48l-5.25 5.25a1.05 1.05 0 0 1-1.48 0Z" />
    </Svg>
  );
}

/* ── Tim: dua sosok blok, yang belakang lebih kecil (kedalaman) ─────────── */
export function IconTeam({ size, ...p }) {
  return (
    <Svg size={size} {...p}>
      <path d="M8.3 2.9a3.35 3.35 0 1 1 0 6.7 3.35 3.35 0 0 1 0-6.7Z" />
      <path d="M2.5 12.15c1.6-.85 3.7-1.35 5.8-1.35 1.05 0 2.05.13 2.95.37a4.1 4.1 0 0 0-.95 2.63v4.9H3.3c-.7 0-1.25-.55-1.25-1.25v-3.4c0-.7.15-1.35.45-1.9Z" />
      <path d="M16.6 4.9a2.85 2.85 0 1 1 0 5.7 2.85 2.85 0 0 1 0-5.7Z" />
      <path d="M13.5 13.05c1.15-.35 2.45-.5 3.75-.45 1.7.06 3.25.42 4.45 1.05.55.29.9.87.9 1.5v3.5c0 .7-.55 1.25-1.25 1.25h-7.85v-5.05c0-.65.0-1.3 0-1.8Z" />
    </Svg>
  );
}

/* ── Slider: dua jalur + kenop bulat (bukan garis tipis) ────────────────── */
export function IconSliders({ size, ...p }) {
  return (
    <Svg size={size} {...p}>
      <path d="M2.4 6.5h6.1a1.65 1.65 0 0 1 0 3.3H2.4a1.65 1.65 0 0 1 0-3.3Z" />
      <path d="M15.5 6.5h6.1a1.65 1.65 0 0 1 0 3.3h-6.1a1.65 1.65 0 0 1 0-3.3Z" />
      <path d="M12 4.5a3.65 3.65 0 1 1 0 7.3 3.65 3.65 0 0 1 0-7.3Z" />
      <path d="M2.4 14.2h9.1a1.65 1.65 0 0 1 0 3.3H2.4a1.65 1.65 0 0 1 0-3.3Z" />
      <path d="M18.5 14.2h3.1a1.65 1.65 0 0 1 0 3.3h-3.1a1.65 1.65 0 0 1 0-3.3Z" />
      <path d="M15 12.2a3.65 3.65 0 1 1 0 7.3 3.65 3.65 0 0 1 0-7.3Z" />
    </Svg>
  );
}

/* ── Kecepatan: dua panah maju bertumpuk (fast-forward) ─────────────────────
   Versi gauge sebelumnya terbaca seperti "headphone/setir" pada 14px
   (catatan reviewer). Panah ganda jauh lebih tegas & tak ambigu. */
export function IconGauge({ size, ...p }) {
  return (
    <Svg size={size} {...p}>
      <path d="M12.7 4.75c-.62-.62-1.7-.18-1.7.7v4.1l-5.1-4.8c-.62-.62-1.7-.18-1.7.7v12.9c0 .88 1.08 1.32 1.7.7l5.1-4.8v4.1c0 .88 1.08 1.32 1.7.7l8.3-7.8a.98.98 0 0 0 0-1.4l-8.3-7.8Z" />
    </Svg>
  );
}

/* ── Kunci: gembok solid, lubang kunci dipotong ─────────────────────────── */
export function IconLock({ size, ...p }) {
  return (
    <Svg size={size} {...p}>
      <path d="M12 2.5a5.1 5.1 0 0 1 5.1 5.1v1.5h.55c1.25 0 2.25 1 2.25 2.25v7.4c0 1.25-1 2.25-2.25 2.25H6.35c-1.25 0-2.25-1-2.25-2.25v-7.4c0-1.25 1-2.25 2.25-2.25h.55V7.6A5.1 5.1 0 0 1 12 2.5Zm0 2.3a2.8 2.8 0 0 0-2.8 2.8v1.5h5.6V7.6A2.8 2.8 0 0 0 12 4.8Z" />
      <path d="M12 11.4a2 2 0 0 1 1 3.73v1.62a1 1 0 0 1-2 0v-1.62A2 2 0 0 1 12 11.4Z" />
    </Svg>
  );
}

/* ── Centang: tebal, ujung membulat ─────────────────────────────────────── */
export function IconCheck({ size, ...p }) {
  return (
    <Svg size={size} {...p}>
      <path d="M9.55 18.2a1.3 1.3 0 0 1-.92-.38l-4.6-4.6a1.3 1.3 0 0 1 1.84-1.84l3.68 3.68 8.16-8.16a1.3 1.3 0 0 1 1.84 1.84l-9.08 9.08a1.3 1.3 0 0 1-.92.38Z" />
    </Svg>
  );
}

/* ── Panah bawah (chevron) solid ────────────────────────────────────────── */
export function IconChevron({ size, ...p }) {
  return (
    <Svg size={size} {...p}>
      <path d="M11.1 15.6a1.3 1.3 0 0 1-.92-.38l-4.3-4.3a1.3 1.3 0 0 1 1.84-1.84l3.38 3.38 3.38-3.38a1.3 1.3 0 0 1 1.84 1.84l-4.3 4.3a1.3 1.3 0 0 1-.92.38Z" />
    </Svg>
  );
}

/* ── Silang: dua batang tebal menyilang ─────────────────────────────────── */
export function IconClose({ size, ...p }) {
  return (
    <Svg size={size} {...p}>
      <path d="M6.1 4.3a1.3 1.3 0 0 1 1.84 0L12 8.36l4.06-4.06a1.3 1.3 0 0 1 1.84 1.84L13.84 10.2l4.06 4.06a1.3 1.3 0 0 1-1.84 1.84L12 12.04 7.94 16.1a1.3 1.3 0 0 1-1.84-1.84l4.06-4.06L6.1 6.14a1.3 1.3 0 0 1 0-1.84Z" />
    </Svg>
  );
}

/* ── Reset: busur panah melingkar ───────────────────────────────────────── */
export function IconReset({ size, ...p }) {
  return (
    <Svg size={size} {...p}>
      <path d="M12 4.4c-4.2 0-7.6 3.4-7.6 7.6s3.4 7.6 7.6 7.6c3.5 0 6.45-2.35 7.35-5.55a1.2 1.2 0 0 1 2.3.7C20.34 18.7 16.53 21.8 12 21.8 6.6 21.8 2.2 17.4 2.2 12S6.6 2.2 12 2.2c3.1 0 5.9 1.4 7.75 3.6V3.4a1.2 1.2 0 0 1 2.4 0v4.9c0 .66-.54 1.2-1.2 1.2h-4.9a1.2 1.2 0 0 1 0-2.4h2.3A7.55 7.55 0 0 0 12 4.4Z" />
    </Svg>
  );
}

/* ── Bendera tim (2026-10-22, permintaan user: ganti kotak warna → bendera) ──
   Kenapa bendera, bukan kotak: kotak 9px tidak menyampaikan "tim" sama sekali —
   ia cuma bintik warna. Bendera punya SILUET yang langsung dikenali (tiang +
   kain berkibar) sehingga warna tim terbaca bahkan oleh mata yang tidak
   membedakan warna. Kain diisi `color` (warna tim), tiang pakai currentColor
   supaya tetap terlihat di tema gelap. */
export function IconFlag({ size = 22, color = '#ffffff', pole = 'rgba(226,232,240,0.75)', ...p }) {
  // Kontras otomatis: kain yang terlalu gelap (Black Team) atau terlalu terang
  // (White Team) bisa hilang di latar gelap. Beri garis tepi yang berlawanan
  // supaya siluet bendera tetap terbaca di semua warna tim.
  const hex6 = String(color).replace('#', '');
  const r8 = parseInt(hex6.slice(0, 2), 16) || 0;
  const g8 = parseInt(hex6.slice(2, 4), 16) || 0;
  const b8 = parseInt(hex6.slice(4, 6), 16) || 0;
  const lum = (0.299 * r8 + 0.587 * g8 + 0.114 * b8) / 255; // 0 gelap → 1 terang
  // Garis tepi diberikan ke SEMUA bendera (bukan hanya yang ekstrem) supaya
  // perlakuan visualnya seragam — versi sebelumnya membuat bendera Black
  // tampak "hampa" karena hanya dia yang bergaris.
  const edge = lum < 0.30 ? 'rgba(203,213,225,0.55)'   // kain gelap → garis terang
             : lum > 0.82 ? 'rgba(71,85,105,0.75)'     // kain terang → garis gelap
             : 'rgba(15,23,42,0.38)';                  // kain sedang → garis gelap tipis
  return (
    <svg
      width={size}
      height={Math.round(size * 0.82)}
      viewBox="0 0 24 20"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0, ...(p.style || {}) }}
    >
      {/* plate seragam: landasan tipis untuk SEMUA bendera, supaya bendera
          gelap (Black) tidak terlihat "hampa" dibanding yang terang. */}
      <rect x="0.5" y="0.5" width="23" height="19" rx="4.5" fill="rgba(148,163,184,0.10)" />
      {/* tiang */}
      <rect x="2.6" y="2.6" width="2.1" height="15.2" rx="1.05" fill={pole} />
      {/* kain berkibar: tepi atas lurus, tepi kanan berlekuk, tepi bawah melengkung */}
      <path
        d="M5.9 3.5c3.6-1.5 6.6 1.2 10.2 0.1 2.1-.6 3.9-.3 5.3.2v9.3c-1.4-.5-3.2-.8-5.3-.2-3.6 1.1-6.6-1.6-10.2-.1V2.1Z"
        fill={color}
        stroke={edge}
        strokeWidth="0.85"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Panah keluar (untuk aksi membuka jendela) ──────────────────────────── */
export function IconOpen({ size, ...p }) {
  return (
    <Svg size={size} {...p}>
      <path d="M14.4 3.6h5.4c.66 0 1.2.54 1.2 1.2v5.4a1.2 1.2 0 0 1-2.4 0V7.34l-7.3 7.3a1.2 1.2 0 0 1-1.7-1.7l7.3-7.3h-2.5a1.2 1.2 0 0 1 0-2.4Z" />
      <path d="M4.9 4.9h4.3a1.2 1.2 0 0 1 0 2.4H5.8v10.9h10.9v-3.4a1.2 1.2 0 0 1 2.4 0v4c0 .88-.72 1.6-1.6 1.6H4.9c-.88 0-1.6-.72-1.6-1.6V6.5c0-.88.72-1.6 1.6-1.6Z" />
    </Svg>
  );
}
