// ─────────────────────────────────────────────────────────────────────────────
// ClockModeSwitch — SVG group yang dirender DI DALAM SVG CircuitDiagram,
// tepat di bawah tombol CLK. SATU buah toggle pill segmented-control dengan
// dua segmen label "MANUAL" dan "AUTO" yang selalu tampil. Segmen aktif
// di-fill dengan warna modenya; segmen inactive tetap gelap/transparan.
//
// Style reference (Bagian 29 design.md):
//   - SATU switch pill (BUKAN dua slider terpisah).
//   - Klik di area switch manapun → toggle antara MANUAL dan AUTO.
//   - Segmen MANUAL aktif → fill hijau `#4ade80`, label "MANUAL" hitam bold.
//   - Segmen AUTO aktif   → fill amber `#facc15`, label "AUTO"   hitam bold.
//   - Segmen inactive → fill transparan, label abu.
//   - Indikator "RUN" merah pulse muncul di kanan switch saat autoActive=true.
//
// Aturan ketat: jika auto sedang aktif (autoActive=true), user TIDAK boleh
// switch mode. Hook useClockMode yang menangani block + rate-limit + toast.
// Komponen ini hanya menampilkan UI; logic lock ada di hook.
// ─────────────────────────────────────────────────────────────────────────────

const MANUAL_COL = '#4ade80'; // hijau — konsisten dgn warna sinyal utama
const MANUAL_RGB = '74,222,128';
const AUTO_COL = '#facc15';   // amber — konsisten dgn warna CLK (kontrol)
const AUTO_RGB = '250,204,21';

// Geometri pill — disesuaikan supaya muat dua label "MANUAL" dan "AUTO"
// tanpa terpotong dan tetap compact (lebih sempit dari versi 2-slider lama).
const SWITCH_W = 92;
const SWITCH_H = 22;
const SWITCH_RX = 11;
const HALF_W = SWITCH_W / 2;

/**
 * ClockModeSwitch — SATU toggle pill segmented MANUAL/AUTO.
 *
 * @param {number} x - posisi X (sudut kiri atas grup)
 * @param {number} y - posisi Y (sudut kiri atas grup)
 * @param {'manual'|'auto'} mode - mode yang sedang aktif
 * @param {boolean} autoActive - true jika auto sedang pulsasi (indikator RUN tampil)
 * @param {(newMode: 'manual'|'auto') => void} onChange - callback saat user klik switch
 */
export default function ClockModeSwitch({ x, y, mode, autoActive, onChange }) {
    const isAuto = mode === 'auto';
    const activeCol = isAuto ? AUTO_COL : MANUAL_COL;
    const activeRgb = isAuto ? AUTO_RGB : MANUAL_RGB;

    // ID unik untuk clipPath (supaya bisa dipakai bersamaan di banyak card
    // tanpa collision). Gunakan koordinat x,y yang sudah dibulatkan.
    const clipId = `clock-mode-clip-${Math.round(x)}-${Math.round(y)}`;

    // Klik di area switch manapun → toggle ke mode lainnya.
    // Catatan: hook useClockMode.setClockMode yang akan validasi lock & rate-limit.
    const handleClick = () => onChange(isAuto ? 'manual' : 'auto');

    return (
        <g
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
            role="switch"
            aria-checked={isAuto ? 'auto' : 'manual'}
            aria-label="Clock mode toggle: manual or auto"
        >
            {/* Label kecil di atas switch */}
            {/* Label "CLOCK MODE" di atas switch.
                ATURAN MUTLAK (revisi 2026-08-13): fill WAJIB putih bersih
                `#ffffff` supaya jelas terlihat di background gelap. TIDAK boleh
                abu (`#64748b`) seperti versi awal, dan TIDAK boleh ada glow neon
                / drop-shadow (cukup putih solid). Berlaku ke semua card clock
                sekarang & masa depan. Lihat design.md Bagian 29.3. */}
            <text
                x={x + SWITCH_W / 2}
                y={y - 4}
                textAnchor="middle"
                fontFamily="Orbitron,sans-serif"
                fontSize="7"
                fontWeight="700"
                fill="#ffffff"
                style={{ letterSpacing: '1px', pointerEvents: 'none' }}
            >CLOCK MODE</text>

            {/* Clip path supaya half-fill mengikuti rounded corner pill */}
            <defs>
                <clipPath id={clipId}>
                    <rect
                        x={x} y={y} width={SWITCH_W} height={SWITCH_H}
                        rx={SWITCH_RX} ry={SWITCH_RX}
                    />
                </clipPath>
            </defs>

            {/* Track outer — pill gelap transparan sebagai latar kedua segmen */}
            <rect
                x={x} y={y} width={SWITCH_W} height={SWITCH_H} rx={SWITCH_RX}
                fill="rgba(15,23,42,0.55)"
                stroke="rgba(148,163,184,0.45)"
                strokeWidth={1}
                style={{ transition: 'all 0.3s ease' }}
            />

            {/* Half-fill aktif — slide antara kiri (MANUAL) & kanan (AUTO) */}
            <rect
                x={isAuto ? x + HALF_W : x}
                y={y}
                width={HALF_W}
                height={SWITCH_H}
                fill={activeCol}
                clipPath={`url(#${clipId})`}
                style={{
                    filter: `drop-shadow(0 0 4px rgba(${activeRgb},0.55))`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            />

            {/* Garis pemisah tipis di tengah supaya batas dua segmen jelas */}
            <line
                x1={x + HALF_W}
                y1={y + 3}
                x2={x + HALF_W}
                y2={y + SWITCH_H - 3}
                stroke="rgba(15,23,42,0.35)"
                strokeWidth={0.75}
                style={{ pointerEvents: 'none' }}
            />

            {/* Label "MANUAL" — selalu tampil, hitam bold saat active, abu saat inactive */}
            <text
                x={x + HALF_W / 2}
                y={y + SWITCH_H / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Orbitron,sans-serif"
                fontSize="7"
                fontWeight="700"
                fill={isAuto ? 'rgba(226,232,240,0.65)' : '#0f172a'}
                style={{
                    pointerEvents: 'none',
                    letterSpacing: '0.5px',
                    transition: 'fill 0.3s ease',
                }}
            >MANUAL</text>

            {/* Label "AUTO" — selalu tampil, hitam bold saat active, abu saat inactive */}
            <text
                x={x + HALF_W + HALF_W / 2}
                y={y + SWITCH_H / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Orbitron,sans-serif"
                fontSize="7"
                fontWeight="700"
                fill={isAuto ? '#0f172a' : 'rgba(226,232,240,0.65)'}
                style={{
                    pointerEvents: 'none',
                    letterSpacing: '0.5px',
                    transition: 'fill 0.3s ease',
                }}
            >AUTO</text>

            {/* Indikator "AUTO RUNNING" — dot merah pulse + teks "RUN" di kanan
                switch saat autoActive=true, supaya user tahu clock sedang memancar. */}
            {autoActive && (
                <g>
                    <circle
                        cx={x + SWITCH_W + 10}
                        cy={y + SWITCH_H / 2}
                        r="4"
                        fill="#ef4444"
                        style={{
                            animation: 'clock-pulse 0.6s ease-in-out infinite alternate',
                        }}
                    />
                    <text
                        x={x + SWITCH_W + 18}
                        y={y + SWITCH_H / 2}
                        textAnchor="start"
                        dominantBaseline="central"
                        fontFamily="Orbitron,sans-serif"
                        fontSize="7"
                        fontWeight="700"
                        fill="#ef4444"
                        style={{ pointerEvents: 'none' }}
                    >RUN</text>
                </g>
            )}

            {/* Style block untuk animasi pulse — sekali per SVG cukup */}
            <style>{`
                @keyframes clock-pulse {
                    0%   { opacity: 0.4; r: 3; }
                    100% { opacity: 1;   r: 5; }
                }
            `}</style>
        </g>
    );
}
