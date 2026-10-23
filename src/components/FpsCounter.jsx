/**
 * FpsCounter — penghitung FPS real-time untuk header simulator.
 *
 * ── MENGAPA TIDAK PAKAI useState UNTUK TIAP FRAME ──
 * Kalau FPS di-set ke React state tiap frame (60x/detik), React harus
 * reconcile + re-render seluruh halaman simulator (29.000 baris JSX) 60x
 * per detik. Itu sendiri akan MENURUNKAN FPS — kontraproduktif.
 *
 * Solusi: ukur di dalam requestAnimationFrame, lalu tulis hasilnya
 * LANGSUNG ke DOM (textContent + style.color) lewat ref. React tidak
 * pernah re-render karena FPS. Biaya = ~0.
 *
 * ── MENGAPA ANGKANYA DIRATA-RATA (perbaikan 2026-10-23) ──
 * Versi pertama memakai jendela ukur 250 ms dan menampilkan angka mentah.
 * Hasilnya angka melonjak-lonjak tak terbaca (53 → 56 → 30 → 60 → 25)
 * karena 250 ms hanya berisi 15–16 frame: satu frame yang datang sedikit
 * terlambat langsung menggeser hasilnya secara drastis. Itu bukan bug
 * pengukuran, tapi statistik sampel yang terlalu kecil.
 *
 * Sekarang:
 *   1. Jendela ukur 1 detik (60+ frame) → galat sampling jauh lebih kecil.
 *   2. Hasil tiap jendela masuk ke buffer 5 sampel, lalu diambil MEDIAN.
 *      Median dipilih (bukan rata-rata) supaya satu lonjakan/penurunan
 *      sesaat — misalnya saat GC atau saat tab kehilangan fokus — TIDAK
 *      menarik angka ke bawah. Rata-rata masih terpengaruh outlier.
 *   3. Angka ditampilkan dibulatkan ke bilangan bulat, dan hanya ditulis
 *      ulang kalau nilainya BERUBAH (menghindari kerja DOM sia-sia).
 *
 * Hasilnya: angka berubah halus, bukan berkedip-kedip.
 *
 * ── WARNA ──
 * Hijau  ≥ 55 FPS  → lancar
 * Kuning 30–54 FPS → mulai menurun
 * Merah  < 30 FPS  → drop, perlu perhatian
 *
 * Warna memakai nilai median yang sama dengan angka yang ditampilkan,
 * jadi angka dan warna SELALU konsisten (tidak mungkin angka hijau tapi
 * warnanya merah).
 */
import { useEffect, useRef } from 'react';

const AMBANG_LANCAR = 55;
const AMBANG_SEDANG = 30;

// Jendela ukur: 1 detik. Cukup banyak frame untuk hasil stabil.
const JENDELA_MS = 1000;
// Jumlah sampel yang disimpan untuk diambil median.
const UKURAN_BUFFER = 5;

export default function FpsCounter({ style }) {
  const wrapRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let windowStart = performance.now();
    let alive = true;

    // Buffer nilai FPS per jendela (diisi berputar).
    const buffer = [];
    // Nilai terakhir yang sudah ditulis ke DOM, untuk mencegah penulisan
    // ulang saat angkanya sama.
    let terakhirTeks = '';

    const tick = (now) => {
      if (!alive) return;
      frames++;

      const elapsed = now - windowStart;
      if (elapsed >= JENDELA_MS) {
        // FPS jendela ini. Pakai elapsed asli (bukan JENDELA_MS) supaya
        // tetap akurat walau rAF datang sedikit lebih lambat.
        const fpsSampel = (frames * 1000) / elapsed;
        frames = 0;
        windowStart = now;

        buffer.push(fpsSampel);
        if (buffer.length > UKURAN_BUFFER) buffer.shift();

        // Median: urutkan salinan, ambil tengah.
        const urut = [...buffer].sort((a, b) => a - b);
        const tengah = Math.floor(urut.length / 2);
        const median = urut.length % 2 === 0
          ? (urut[tengah - 1] + urut[tengah]) / 2
          : urut[tengah];

        const fps = Math.round(median);

        const el = textRef.current;
        if (el) {
          const teks = fps + ' FPS';
          // Hanya sentuh DOM kalau angkanya benar-benar berubah.
          if (teks !== terakhirTeks) {
            terakhirTeks = teks;
            el.textContent = teks;

            // Warna mengikuti nilai yang SAMA dengan angka di layar.
            if (fps >= AMBANG_LANCAR) {
              el.style.color = '#4ade80';       // hijau
              el.style.borderColor = 'rgba(74,222,128,0.45)';
            } else if (fps >= AMBANG_SEDANG) {
              el.style.color = '#fbbf24';       // kuning
              el.style.borderColor = 'rgba(251,191,36,0.45)';
            } else {
              el.style.color = '#f87171';       // merah
              el.style.borderColor = 'rgba(248,113,113,0.55)';
            }
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, []);

  return (
    <div
      ref={wrapRef}
      title="FPS real-time (rata-rata 1 detik). Hijau ≥55, kuning 30–54, merah <30."
      style={{
        padding: '6px 10px', borderRadius: 10,
        backgroundColor: 'rgba(15,23,42,0.55)',
        border: '1px solid rgba(148,163,184,0.25)',
        fontSize: 12, fontWeight: 700,
        // Angka rata kanan + lebar digit seragam → tidak "bergetar"
        // saat angka berubah dari 9 ke 10 atau 99 ke 100.
        fontVariantNumeric: 'tabular-nums',
        display: 'flex', alignItems: 'center',
        whiteSpace: 'nowrap',
        // backdrop-filter SENGAJA TIDAK DIPAKAI di sini.
        // Di atas canvas WebGL, backdrop-filter memaksa browser membaca
        // ulang seluruh canvas tiap frame (mahal, terukur menurunkan FPS).
        ...style,
      }}
    >
      <span ref={textRef} style={{ color: '#94a3b8', transition: 'color 0.35s linear' }}>
        — FPS
      </span>
    </div>
  );
}
