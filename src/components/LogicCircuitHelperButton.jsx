import { Zap } from 'lucide-react';

// LogicCircuitHelperButton — tombol AI biru "ic listrik" untuk keluarga
// halaman Logic Gates (kesepakatan tim 2026-09-10: AI Helper dipecah 3).
//
// DESAIN: mengikuti design system repo (source-code fidelity):
//   - koordinat SAMA PERSIS dengan AIHelperButton hitam global
//     (bottom:24 right:24, 52×52, borderRadius 50%, zIndex 200) — "menimpa"
//     posisi hitam yang disembunyikan di halaman logic gates.
//   - tema listrik biru: #3b82f6 dengan efek "aliran listrik" berdenyut
//     (keyframes zap-pulse didefinisikan lokal, pola <style> inline seperti
//     App.jsx keyframes pulse; interaksi murni custom UI, tanpa dialog native).
//   - Ikon Zap (petir) — lucide, konsisten dengan app.
export default function LogicCircuitHelperButton({ onClick }) {
    return (
        <>
            <style>{`
                @keyframes logic-zap-pulse {
                    0%, 100% { box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 10px rgba(59,130,246,0.35), 0 0 22px rgba(6,182,212,0.15); }
                    50%      { box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 18px rgba(59,130,246,0.65), 0 0 34px rgba(6,182,212,0.35); }
                }
                @keyframes logic-zap-bolt {
                    0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px rgba(219,234,254,0.6)); }
                    50%      { opacity: 0.82; filter: drop-shadow(0 0 6px rgba(191,219,254,0.9)); }
                }
            `}</style>
            <button
                onClick={onClick}
                title="AI Circuit Helper — tanya-jawab seputar sirkuit logika"
                style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 200,
                    width: 52, height: 52, borderRadius: '50%',
                    // Biru listrik: dasar #2563eb dengan ring cyan — beda jelas
                    // dari kuning simulator (#f59e0b) dan hitam umum (#334155).
                    backgroundColor: '#2563eb',
                    border: '2px solid #60a5fa',
                    color: '#eff6ff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'logic-zap-pulse 1.6s ease-in-out infinite',
                    transition: 'background-color 0.2s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3b82f6'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2563eb'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
                <span style={{ display: 'flex', animation: 'logic-zap-bolt 1.6s ease-in-out infinite' }}>
                    <Zap size={22} />
                </span>
            </button>
        </>
    );
}
