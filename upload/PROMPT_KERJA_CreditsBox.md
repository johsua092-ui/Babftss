# PROMPT KERJA — CREDITS BOX (kiri-atas halaman menu) + STATUS ONLINE LIVE

> **WAJIB DIBACA DULU:** `instruction.md`, `design.md`, `memory.md` versi TERBARU.

## KONTEKS

Kotak "Credits" baru, posisi **kiri-atas** di halaman menu utama (`page === "menu"`, yang isinya tombol Marketplace/Canvas/Shapes/dst). Isi: 2 kontributor, tiap baris = avatar (kiri) + nama (tengah) + label peran (kanan), bisa diklik jadi link ke profil Discord masing-masing, dan ada indikator status online **live** (bukan dekorasi statis) — hijau kalau lagi login di web ini pakai akun Google yang cocok.

**Task ini 2 bagian, independen:**
- **Bagian A (UI)** — bisa langsung dikerjakan sekarang.
- **Bagian B (Presence live)** — BUTUH `VITE_FIREBASE_DATABASE_URL` sudah ada di env (user sedang setup manual di Firebase Console + Vercel). **Cek dulu apakah env var itu ada** sebelum mulai Bagian B — kalau belum ada, kerjakan Bagian A dulu, laporkan ke user bahwa Bagian B menunggu env var itu, JANGAN dipaksakan jalan tanpa itu (nanti Realtime Database gagal connect).

---

## DATA KONTRIBUTOR

```js
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
```

---

## BAGIAN A — KOMPONEN UI

Buat file baru `src/components/CreditsBox.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useOnlinePresence } from '../hooks/useOnlinePresence'; // dibuat di Bagian B

const CONTRIBUTORS = [ /* ... data di atas ... */ ];

function DiscordIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
    </svg>
  );
}

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
  const isOnline = useOnlinePresence(c.id, c.matchEmail);

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
```

**Pasang di `App.jsx`** — cari blok `{page === "menu" && ...}`, tambahkan `<CreditsBox />` di dalamnya (pastikan parent-nya `position: relative` supaya `position: absolute` di CreditsBox terpatok ke halaman menu, BUKAN ke seluruh viewport — cek dulu apakah wrapper page "menu" sudah `position: relative`, kalau belum tambahkan).

---

## BAGIAN B — HOOK PRESENCE LIVE (`useOnlinePresence`)

**Cek dulu:** apakah `VITE_FIREBASE_DATABASE_URL` sudah ada di env (`.env` lokal ATAU Vercel env vars). **Kalau belum ada, STOP di sini, laporkan ke user, JANGAN lanjutkan Bagian B** (Realtime Database tidak akan bisa connect tanpa itu, memaksakan cuma akan bikin error runtime).

Kalau sudah ada, buat `src/lib/firebaseRealtimeDb.js`:
```js
import { getDatabase, ref, onValue, onDisconnect, set } from 'firebase/database';
import { getApp } from 'firebase/app'; // reuse app yang sudah di-init di lib/firebase.js — JANGAN initializeApp lagi

let _db = null;
export function getRealtimeDb() {
  if (!_db) _db = getDatabase(getApp());
  return _db;
}
```

**PENTING:** cek dulu apakah `initializeApp` di `src/lib/firebase.js` sudah expose instance app-nya buat di-reuse (`getApp()` dari `firebase/app` bekerja SELAMA `initializeApp` sudah dipanggil sekali di awal, yang sudah terjadi). JANGAN panggil `initializeApp` kedua kali.

Buat `src/hooks/useOnlinePresence.js`:
```js
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRealtimeDb } from '../lib/firebaseRealtimeDb';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';

// Dipanggil SEKALI di level tinggi (misal di App.jsx atau AuthContext) — kalau email user
// yang sedang login cocok dengan salah satu contributor, tulis presence-nya jadi true,
// dan otomatis jadi false lagi kalau koneksi putus (nutup tab/browser crash/dst).
export function usePresenceWriter(contributors) {
  const { user } = useAuth();
  useEffect(() => {
    if (!user || !user.email) return;
    const emailLower = user.email.toLowerCase();
    const matched = contributors.find(c => c.matchEmail && c.matchEmail.toLowerCase() === emailLower);
    if (!matched) return;

    const db = getRealtimeDb();
    const presenceRef = ref(db, `presence/${matched.id}`);
    const connectedRef = ref(db, '.info/connected');

    const unsub = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        onDisconnect(presenceRef).set(false).then(() => {
          set(presenceRef, true);
        });
      }
    });
    return () => unsub();
  }, [user, contributors]);
}

// Dipakai per-contributor row untuk BACA status presence-nya (read-only, publik,
// tidak butuh login — supaya guest yang buka halaman menu juga bisa lihat status ini).
export function useOnlinePresence(contributorId, matchEmail) {
  const [online, setOnline] = useState(false);
  useEffect(() => {
    if (!matchEmail) return; // znything: matchEmail null -> selalu false, TIDAK subscribe apapun
    const db = getRealtimeDb();
    const presenceRef = ref(db, `presence/${contributorId}`);
    const unsub = onValue(presenceRef, (snap) => setOnline(snap.val() === true));
    return () => unsub();
  }, [contributorId, matchEmail]);
  return online;
}
```

**Panggil `usePresenceWriter(CONTRIBUTORS)` SEKALI** di komponen App level (misal langsung di `App.jsx` bagian atas, di luar kondisi `page === "menu"` — supaya presence tetap ke-track walau user pindah halaman, bukan cuma pas di halaman menu).

**Firebase Realtime Database Security Rules** — WAJIB diatur di Firebase Console (Realtime Database > Rules), supaya:
- `presence/*` bisa DIBACA siapa saja (termasuk guest, tidak perlu login) — `".read": true`.
- `presence/*` cuma bisa DITULIS oleh user yang SEDANG LOGIN (mencegah orang random nulis presence palsu) — `".write": "auth != null"`.

Contoh rules yang disarankan (SAMPAIKAN ke user buat di-paste di Firebase Console > Realtime Database > Rules, GLM TIDAK BISA mengatur ini dari kode):
```json
{
  "rules": {
    "presence": {
      ".read": true,
      "$contributorId": {
        ".write": "auth != null"
      }
    }
  }
}
```

---

## CHECKLIST VERIFIKASI WAJIB
1. Build check — `npm run build`, 0 error.
2. Scope check — file baru (`CreditsBox.jsx`, `useOnlinePresence.js`, `firebaseRealtimeDb.js`) + `App.jsx` (+`memory.md`).
3. Verifikasi Bagian A tampil benar: posisi kiri-atas halaman menu, 2 baris kontributor, avatar+inisial+gradient, nama, label, ikon Discord, klik buka link Discord di tab baru.
4. Verifikasi Bagian B (KALAU env var sudah ada): login pakai akun `aremakonveksi@gmail.com` di 1 tab, buka tab lain (guest/browser lain), cek dot BLC jadi hijau. Logout/tutup tab pertama, cek dot balik jadi cincin abu-abu dalam beberapa detik.
5. Verifikasi znything SELALU tampil cincin abu-abu (offline), tidak pernah hijau, karena `matchEmail: null`.
6. Update `memory.md` — catat status Bagian B (jalan penuh / menunggu env var / menunggu rules dipasang manual di Firebase Console).
7. `git push --force` DILARANG MUTLAK.
