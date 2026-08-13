// ─────────────────────────────────────────────────────────────────────────────
// ClockModeSwitch — SVG group yang dirender DI DALAM SVG CircuitDiagram,
// tepat di bawah tombol CLK. Dua slider side-by-side: "MANUAL" dan "AUTO".
//
// Style reference (Bagian 29 design.md):
//   - Active slider: green filled track, knob putih di kanan, label putih di kiri
//   - Inactive slider: outlined track (transparent fill, gray stroke),
//     knob putih di kiri, label gray di kanan
//
// Hanya satu slider yang aktif pada satu waktu (mutually exclusive).
// Klik pada slider → panggil onChange('manual') atau onChange('auto').
//
// Aturan ketat: jika auto sedang aktif (autoActive=true), user TIDAK boleh
// switch mode. Hook useClockMode yang menangani block + rate-limit + toast.
// Komponen ini hanya menampilkan UI; logic lock ada di hook.
// ─────────────────────────────────────────────────────────────────────────────

const MANUAL_COL = '#4ade80'; // hijau — konsisten dgn warna sinyal utama
const MANUAL_RGB = '74,222,128';
const AUTO_COL = '#facc15';   // amber — konsisten dgn warna CLK (kontrol)
const AUTO_RGB = '250,204,21';

const SLIDER_W = 56;
const SLIDER_H = 22;
const SLIDER_RX = 11;
const SLIDER_GAP = 6;
const KNOB_R = 8;
const TOTAL_W = SLIDER_W * 2 + SLIDER_GAP; // 118

function Slider({ x, y, label, active, color, rgb, onClick, disabled }) {
    // Track
    const trackFill = active ? color : 'transparent';
    const trackStroke = active ? color : 'rgba(148,163,184,0.5)';
    const trackStrokeWidth = active ? 0 : 1.5;

    // Knob: kanan jika active, kiri jika inactive
    const knobCx = x + (active ? SLIDER_W - SLIDER_RX + 1 : SLIDER_RX - 1);
    const knobCy = y + SLIDER_H / 2;
    const knobFill = active ? '#ffffff' : 'rgba(226,232,240,0.9)';

    // Label position: kiri jika active, kanan jika inactive
    const labelX = active ? x + SLIDER_RX + 4 : x + SLIDER_W - SLIDER_RX - 4;
    const labelAnchor = active ? 'start' : 'end';
    const labelFill = active ? '#0f172a' : 'rgba(148,163,184,0.9)';

    return (
        <g
            onClick={disabled ? undefined : onClick}
            style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
        >
            {/* Track */}
            <rect
                x={x} y={y} width={SLIDER_W} height={SLIDER_H} rx={SLIDER_RX}
                fill={trackFill}
                stroke={trackStroke}
                strokeWidth={trackStrokeWidth}
                style={{ transition: 'all 0.25s ease' }}
            />
            {/* Glow saat active */}
            {active && (
                <rect
                    x={x} y={y} width={SLIDER_W} height={SLIDER_H} rx={SLIDER_RX}
                    fill="none"
                    stroke={color}
                    strokeWidth="0.5"
                    style={{ filter: `drop-shadow(0 0 4px rgba(${rgb},0.7))`, transition: 'all 0.25s ease' }}
                />
            )}
            {/* Knob */}
            <circle
                cx={knobCx} cy={knobCy} r={KNOB_R}
                fill={knobFill}
                style={{
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    filter: active ? `drop-shadow(0 0 3px rgba(${rgb},0.6))` : 'none',
                }}
            />
            {/* Label */}
            <text
                x={labelX} y={knobCy}
                textAnchor={labelAnchor}
                dominantBaseline="central"
                fontFamily="Orbitron,sans-serif"
                fontSize="7"
                fontWeight="700"
                fill={labelFill}
                style={{ transition: 'fill 0.25s ease', letterSpacing: '0.5px', pointerEvents: 'none' }}
            >{label}</text>
        </g>
    );
}

/**
 * ClockModeSwitch — SVG group dengan dua slider MANUAL & AUTO.
 *
 * @param {number} x - posisi X (sudut kiri atas grup)
 * @param {number} y - posisi Y (sudut kiri atas grup)
 * @param {'manual'|'auto'} mode - mode yang sedang aktif
 * @param {boolean} autoActive - true jika auto sedang pulsasi (slider AUTO dikunci saat ini)
 * @param {(newMode: 'manual'|'auto') => void} onChange - callback saat user klik slider
 */
export default function ClockModeSwitch({ x, y, mode, autoActive, onChange }) {
    const manualActive = mode === 'manual';
    const autoSelectedButRunning = mode === 'auto' && autoActive;

    return (
        <g>
            {/* Label kecil di atas switch */}
            <text
                x={x + TOTAL_W / 2}
                y={y - 4}
                textAnchor="middle"
                fontFamily="Orbitron,sans-serif"
                fontSize="7"
                fontWeight="700"
                fill="#64748b"
                style={{ letterSpacing: '1px', pointerEvents: 'none' }}
            >CLOCK MODE</text>

            {/* Slider MANUAL */}
            <Slider
                x={x}
                y={y}
                label="MANUAL"
                active={manualActive}
                color={MANUAL_COL}
                rgb={MANUAL_RGB}
                onClick={() => onChange('manual')}
                // MANUAL selalu bisa dipilih (manual mode tidak pernah "terkunci")
                disabled={false}
            />

            {/* Slider AUTO */}
            <Slider
                x={x + SLIDER_W + SLIDER_GAP}
                y={y}
                label="AUTO"
                active={mode === 'auto'}
                color={AUTO_COL}
                rgb={AUTO_RGB}
                onClick={() => onChange('auto')}
                // AUTO tidak bisa dipilih saat autoActive (sedang pulsasi)
                // TAPI hook yang nolak + kasih toast — komponen tetap clickable
                // supaya user bisa "memaksa tekan" dan melihat pesan error.
                disabled={false}
            />

            {/* Indikator "AUTO RUNNING" — titik pulse merah di kanan slider AUTO
                saat autoActive=true, supaya user tahu clock sedang memancar. */}
            {autoSelectedButRunning && (
                <g>
                    <circle
                        cx={x + TOTAL_W + 10}
                        cy={y + SLIDER_H / 2}
                        r="4"
                        fill="#ef4444"
                        style={{
                            animation: 'clock-pulse 0.6s ease-in-out infinite alternate',
                        }}
                    />
                    <text
                        x={x + TOTAL_W + 18}
                        y={y + SLIDER_H / 2}
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
