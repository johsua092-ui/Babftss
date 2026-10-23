/**
 * TesseractCore.jsx — TESSERACT (hiperkubus 4D) sebagai SATU TUBUH kubus.
 *
 * Riwayat permintaan user (penting, jangan diulang kesalahannya):
 *   1. "kubus biasa yang outlinenya menyala" -> kurang
 *   2. "di dalam kubus terlihat samar-samar, kayak tesseract" -> saya buat
 *      kubus kecil mengambang di tengah = SALAH (bukan tesseract)
 *   3. "itu kubus di dalam perut kubus!" -> saya buat 32 rusuk + 8 rusuk
 *      penghubung = geometri tesseract benar, TAPI masih dua objek terpisah
 *      (kubus CSS 6 sisi + SVG di dalamnya) -> "kubus punya kubus sendiri"
 *   4. SEKARANG: satu tubuh. Tidak ada kubus CSS lagi. Komponen ini
 *      menggambar SELURUHNYA: kubus luar (12 rusuk + 6 bidang kaca),
 *      kubus dalam (12 rusuk), dan 8 rusuk penghubung.
 *
 * GEOMETRI (proyeksi cell-first / Schlegel):
 *   16 titik = semua kombinasi (±1,±1,±1,±1)
 *   32 rusuk = dua titik terhubung bila beda TEPAT satu sumbu
 *              -> 12 kubus luar + 12 kubus dalam + 8 rusuk PENGHUBUNG
 *   Delapan rusuk penghubung inilah ciri tesseract: tiap sudut kubus dalam
 *   tersambung ke sudut kubus luar, jadi bentuknya satu kesatuan.
 *
 * TAMPILAN:
 *   - 6 bidang kaca (polygon) untuk kubus LUAR, dengan terang berbeda per
 *     sisi supaya terbaca 3D dan padat, bukan wireframe datar.
 *   - Kubus DALAM digambar lebih redup & tipis -> terbaca "di kedalaman".
 *   - 8 rusuk penghubung diberi warna tersendiri -> terbaca sebagai sambungan.
 *   - Semua rusuk diberi opacity/ketebalan menurut jarak-z (kedalaman).
 */
import { useEffect, useRef } from 'react';

// ── Geometri: 16 titik hiperkubus ──
const VERTICES = [];
for (let i = 0; i < 16; i++) {
  VERTICES.push([
    i & 1 ? 1 : -1,
    i & 2 ? 1 : -1,
    i & 4 ? 1 : -1,
    i & 8 ? 1 : -1,
  ]);
}

// ── 32 rusuk: beda tepat satu bit ──
const EDGES = [];
for (let i = 0; i < 16; i++) {
  for (let j = i + 1; j < 16; j++) {
    const diff = i ^ j;
    if ((diff & (diff - 1)) === 0) EDGES.push([i, j]);
  }
}
const N_EDGES = EDGES.length; // 32

// Rusuk penghubung = yang beda di sumbu W (bit ke-4). Ada 8 buah.
const IS_CONNECTOR = EDGES.map(([i, j]) => VERTICES[i][3] !== VERTICES[j][3]);

// ── 6 bidang kubus LUAR (untuk isi kaca) ──
// Tiap bidang = 4 titik dengan W sama (+1 = kubus luar).
const OUTER_FACES = [
  [1, 3, 7, 5],    // x = +1
  [0, 2, 6, 4],    // x = -1
  [2, 3, 7, 6],    // y = +1
  [0, 1, 5, 4],    // y = -1
  [4, 5, 7, 6],    // z = +1
  [0, 1, 3, 2],    // z = -1
];

// Terang isi kaca per bidang. Sisi atas paling terang -> sumber cahaya dari
// atas, ini yang membuat bentuk terasa padat (bukan wireframe datar).
const FACE_FILL = [
  'rgba(38,56,96,0.30)',   // x+  (samping kanan)
  'rgba(26,40,70,0.24)',   // x-  (samping kiri)
  'rgba(96,128,186,0.42)', // y+  (ATAS, paling terang -> sumber cahaya)
  'rgba(6,10,20,0.55)',    // y-  (BAWAH, paling gelap)
  'rgba(52,76,124,0.34)',  // z+  (DEPAN)
  'rgba(12,20,36,0.48)',   // z-  (BELAKANG)
];

export default function TesseractCore({
  size = 112,
  active = true,
  opacity = 0.95,
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;

    // Skala: kubus luar mengisi ~72% kotak, menyisakan ruang untuk glow.
    const R = size * 0.235;
    const CX = size / 2;
    const CY = size / 2;
    const W_DIST = 2.55;
    const Z_DIST = 3.1;

    let raf = 0;
    const t0 = performance.now();

    let lines = null;
    let faces = null;

    const frame = (now) => {
      if (!lines) {
        lines = svg.querySelectorAll('line');
        faces = svg.querySelectorAll('polygon');
      }

      const t = (now - t0) / 1000;
      // Kecepatan putar (permintaan user: sebelumnya terlalu lambat/"slowmo").
      // Dinaikkan ~1.9x dari 0.42/0.30. Masih tenang, tapi jelas bergerak.
      const a = t * 0.80;                  // rotasi bidang XW
      const b = t * 0.57;                  // rotasi bidang YZ
      const c = -0.38 + Math.sin(t * 0.45) * 0.22; // tilt tetap -22deg + goyangan

      const ca = Math.cos(a), sa = Math.sin(a);
      const cb = Math.cos(b), sb = Math.sin(b);
      const cc = Math.cos(c), sc = Math.sin(c);

      const proj = new Array(16);
      let zMin = Infinity;
      let zMax = -Infinity;

      for (let i = 0; i < 16; i++) {
        let [x, y, z, w] = VERTICES[i];

        const nx = x * ca - w * sa;
        const nw = x * sa + w * ca;
        x = nx; w = nw;

        const ny = y * cb - z * sb;
        const nz = y * sb + z * cb;
        y = ny; z = nz;

        const fx = x * cc - y * sc;
        const fy = x * sc + y * cc;
        x = fx; y = fy;

        // W lebih besar -> kubus dalam (w=-1) tidak terlalu kecil,
        // supaya detailnya masih terbaca di ukuran ikon (saran Claude).
        const k = 2 / (W_DIST - w * 0.62);
        const px = x * k;
        const py = y * k;
        const pz = z * k;

        const s = Z_DIST / (Z_DIST - pz);
        proj[i] = [CX + px * s * R, CY + py * s * R, pz];
        if (pz < zMin) zMin = pz;
        if (pz > zMax) zMax = pz;
      }

      const span = zMax - zMin || 1;

      // ── Isi kaca kubus luar ──
      // WAJIB pakai painter's algorithm: bidang digambar dari yang paling
      // JAUH ke yang paling DEKAT. Tanpa pengurutan, bidang belakang bisa
      // menutupi bidang depan dan isi kaca tidak terbaca (temuan Claude).
      if (faces) {
        const urut = OUTER_FACES.map((idx, f) => {
          let z = 0;
          for (const i of idx) z += proj[i][2];
          return { f, z: z / idx.length };
        }).sort((p, q) => p.z - q.z); // kecil (jauh) dulu

        urut.forEach((item, slot) => {
          const poly = faces[slot];
          if (!poly) return;
          const idx = OUTER_FACES[item.f];
          const pts = idx.map((i) => proj[i][0].toFixed(1) + ',' + proj[i][1].toFixed(1)).join(' ');
          poly.setAttribute('points', pts);
          poly.setAttribute('fill', FACE_FILL[item.f]);
        });
      }

      // ── Rusuk: kedalaman + bedakan penghubung ──
      for (let e = 0; e < N_EDGES; e++) {
        const ln = lines[e];
        if (!ln) continue;
        const [i, j] = EDGES[e];
        const p1 = proj[i];
        const p2 = proj[j];

        ln.setAttribute('x1', p1[0].toFixed(2));
        ln.setAttribute('y1', p1[1].toFixed(2));
        ln.setAttribute('x2', p2[0].toFixed(2));
        ln.setAttribute('y2', p2[1].toFixed(2));

        const zAvg = (p1[2] + p2[2]) / 2;
        const depth = (zAvg - zMin) / span; // 0 belakang .. 1 depan

        if (IS_CONNECTOR[e]) {
          // rusuk penghubung: tipis & redup, warnanya beda (cyan) supaya
          // terbaca sebagai "sambungan" antar kubus, bukan rusuk biasa
          ln.setAttribute('stroke-opacity', (0.55 + depth * 0.45).toFixed(3));
          ln.setAttribute('stroke-width', (0.9 + depth * 0.7).toFixed(2));
        } else {
          ln.setAttribute('stroke-opacity', (0.42 + depth * 0.58).toFixed(3));
          ln.setAttribute('stroke-width', (0.8 + depth * 0.9).toFixed(2));
        }
      }

      raf = requestAnimationFrame(frame);
    };

    // Satu frame sinkron dulu: requestAnimationFrame di-throttle saat tab
    // tidak aktif, tanpa ini spinner bisa kosong di tab background.
    frame(performance.now());
    return () => cancelAnimationFrame(raf);
  }, [size, active]);

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!active || reduceMotion) return null;

  return (
    <svg
      ref={svgRef}
      className="tess-svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ opacity, pointerEvents: 'none' }}
    >
      {/* Isi kaca kubus luar: 6 bidang, terang berbeda per sisi -> padat & 3D */}
      <g>
        {OUTER_FACES.map((_, i) => (
          <polygon key={i} fill={FACE_FILL[i]} stroke="none" />
        ))}
      </g>

      {/* Semua rusuk: kubus luar + kubus dalam + 8 penghubung */}
      <g
        stroke="#ffcf6b"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        style={{ filter: 'drop-shadow(0 0 1.2px rgba(255, 170, 60, 0.40))' }}
      >
        {EDGES.map((_, idx) => (
          <line
            key={idx}
            stroke={IS_CONNECTOR[idx] ? '#7fe3ff' : '#ffcf6b'}
          />
        ))}
      </g>
    </svg>
  );
}
