import { useState, useEffect } from 'react';

// ── CreditsBox — kotak kontributor di kiri-atas halaman menu ──
// Tiap baris: avatar (kiri) + nama (tengah) + label peran (kanan) + ikon Discord.
// Bisa diklik jadi link ke profil Discord masing-masing.
// Indikator status online (hijau / cincin abu-abu) — saat ini STUB (selalu false)
// karena Bagian B (presence live via Firebase Realtime Database) menunggu env var
// VITE_FIREBASE_DATABASE_URL. Setelah env var dipasang + hook useOnlinePresence
// dibuat, ganti stub ini dengan import real: `import { useOnlinePresence } from '../hooks/useOnlinePresence'`.

const CONTRIBUTORS = [
    {
        id: 'blc',
        name: 'BLC_destroyer',
        role: 'Frontend Dev',
        discordUrl: 'https://discord.com/users/573011499413405699',
        matchEmail: 'aremakonveksi@gmail.com', // WAJIB huruf kecil semua saat dibandingkan
        avatarInitials: 'BD',
        avatarGradient: 'linear-gradient(135deg, #22d3ee, #6366f1)',
    },
    {
        id: 'zny',
        name: 'znything',
        role: 'Backend Dev',
        discordUrl: 'https://discord.com/users/908245238181670932',
        matchEmail: null, // BELUM DIKETAHUI — sengaja null, status SELALU "off" sampai user kasih tahu nanti
        avatarInitials: 'ZN',
        avatarGradient: 'linear-gradient(135deg, #a855f7, #6366f1)',
    },
];

// STUB useOnlinePresence — selalu return false (offline) sampai Bagian B jalan.
// Ganti dengan import real dari '../hooks/useOnlinePresence' setelah env var
// VITE_FIREBASE_DATABASE_URL dipasang.
function useOnlinePresenceStub(contributorId, matchEmail) {
    // matchEmail null (znything) → selalu false, TIDAK subscribe apapun.
    // matchEmail tidak null (blc) → seharusnya subscribe ke Realtime Database,
    // tapi karena DB belum connect, fallback false.
    return false;
}

function DiscordIcon() {
    return (
        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
        </svg>
    );
}

export { CONTRIBUTORS };

export default function CreditsBox() {
    return (
        <div style={{
            position: 'absolute', top: 20, left: 20,
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: 14, padding: '18px 24px',
            display: 'flex', flexDirection: 'column', gap: 16,
            backdropFilter: 'blur(6px)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 10px 24px rgba(0,0,0,0.45), 0 3px 8px rgba(0,0,0,0.3)',
            zIndex: 5,
            maxWidth: 'calc(100vw - 40px)', // cegah overflow di mobile
        }}>
            <div style={{
                fontFamily: 'Orbitron, sans-serif', fontSize: 13, letterSpacing: 1.5,
                color: '#64748b', textTransform: 'uppercase',
            }}>Credits</div>

            {CONTRIBUTORS.map((c) => (
                <ContributorRow key={c.id} contributor={c} />
            ))}
        </div>
    );
}

function ContributorRow({ contributor: c }) {
    // STUB: pakai useOnlinePresenceStub sampai Bagian B jalan.
    // Setelah env var VITE_FIREBASE_DATABASE_URL dipasang, ganti dengan:
    //   const isOnline = useOnlinePresence(c.id, c.matchEmail);
    const isOnline = useOnlinePresenceStub(c.id, c.matchEmail);

    return (
        <a
            href={c.discordUrl} target="_blank" rel="noopener noreferrer"
            style={{
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', textDecoration: 'none',
                padding: '8px 12px', borderRadius: 10,
                border: '1px solid rgba(148, 163, 184, 0.16)',
                background: 'linear-gradient(180deg, rgba(148,163,184,0.08), rgba(148,163,184,0.02))',
                boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset, 0 2px 6px rgba(0,0,0,0.25)',
                transition: 'background 0.15s ease, border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
                color: '#e2e8f0',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(180deg, rgba(148,163,184,0.18), rgba(148,163,184,0.06))';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(180deg, rgba(148,163,184,0.08), rgba(148,163,184,0.02))';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.16)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: c.avatarGradient,
                    border: '1.5px solid rgba(148, 163, 184, 0.35)',
                    boxShadow: '0 2px 0 rgba(255,255,255,0.12) inset, 0 -3px 5px rgba(0,0,0,0.3) inset, 0 3px 6px rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 17,
                    overflow: 'hidden',
                }}>
                    {/* INSERT YOUR IMAGE HERE — ganti bagian ini dengan <img src="/avatars/NAMA.jpg"
                        alt={c.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        begitu file gambar profilnya sudah ada. Sampai saat itu, tampilkan inisial. */}
                    {c.avatarInitials}
                </div>
                {isOnline ? (
                    <span style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 12, height: 12, background: '#4ade80',
                        border: '2px solid #0f172a', borderRadius: '50%',
                    }} />
                ) : (
                    <span style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 10, height: 10, background: '#151d2e',
                        border: '4.5px solid #475569', borderRadius: '50%',
                    }} />
                )}
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#e2e8f0' }}>{c.name}</div>
            <div style={{
                fontSize: 13, color: '#94a3b8', background: 'rgba(148, 163, 184, 0.12)',
                padding: '4px 12px', borderRadius: 6, marginLeft: 'auto', whiteSpace: 'nowrap',
            }}>{c.role}</div>
            <DiscordIcon />
        </a>
    );
}
