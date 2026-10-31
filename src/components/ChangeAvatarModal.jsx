import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserRound, Loader2 } from 'lucide-react';
import { AVATAR_SKINS } from '../utils/avatarController.js';

/* ═══════════════════════════════════════════════════════════════════════════
   CHANGE AVATAR MODAL (bab 213)
   ── PERMINTAAN USER 2026-10-31: tombol "Change Avatar" di Admin Panel >
      area Player (tepat di atas "Teleport To Team") membuka jendela ini.
   ATURAN KHUSUS USER: jendela ini MENIMPA layar dan HANYA bisa ditutup
      lewat tombol close — klik di luar TIDAK menutupnya.
   ISI:
      • 8 pilihan skin avatar default (klik = terapkan instan)
      • kolom username Roblox ("@...") + tombol Ubah Avatar → fetch ke
        API backend teman user: /api/get-avatar?username=... → JSON
        { modelUrl, textureUrl? } (.obj / .gltf) → ganti model avatar
        di scene Three.js (frontend-only; backend milik teman user).
   ═══════════════════════════════════════════════════════════════════════════ */

// BASE API = RELATIVE (KOREKSI BACKEND TEMAN USER, 2026-10-31): backend proxy
// Roblox 3D avatar kini SATU REPO/HOSTING dengan frontend (api/get-avatar.js).
// String kosong → request relative '/api/get-avatar' → otomatis kompatibel di
// SEMUA domain produksi (babft-learning.com/.net/.zone.id/dpdns.org/
// babftss.vercel.app) maupun localhost, TANPA masalah CORS. DILARANG hardcode
// domain tertentu.
export const AVATAR_API_BASE = '';

// Konversi respons API yang fleksibel → { modelUrl, textureUrl, mtlUrl }
function parseAvatarResponse(json) {
  const modelUrl = json && (json.modelUrl || json.objUrl || json.url || (json.data && json.data.modelUrl));
  const textureUrl = json && (json.textureUrl || (json.data && json.data.textureUrl)) || null;
  // bab 215: mtlUrl WAJIB diteruskan — MTL Roblox berisi material PER BAGIAN
  // (aksesori/topi punya map tekstur SENDIRI, beda dari atlas badan). Tanpa
  // MTL semua mesh dipaksa atlas badan → aksesori "terkontaminasi coklat".
  const mtlUrl = json && (json.mtlUrl || (json.data && json.data.mtlUrl)) || null;
  if (!modelUrl) return null;
  return { modelUrl, textureUrl, mtlUrl };
}

export default function ChangeAvatarModal({ open, onClose, skin, onApplySkin, onApplyRobloxModel }) {
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'ok'|'err', text }
  const inputRef = useRef(null);

  // Reset status tiap kali modal dibuka
  useEffect(() => {
    if (open) {
      setStatus(null);
      setBusy(false);
      setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 60);
    }
  }, [open]);

  if (!open) return null;

  const cleanUsername = username.trim().replace(/^@+/, '');

  const handleFetchRoblox = async () => {
    if (busy) return;
    if (!/^[A-Za-z0-9_]{3,20}$/.test(cleanUsername)) {
      setStatus({ type: 'err', text: 'Username Roblox tidak valid (3-20 huruf/angka/underscore).' });
      return;
    }
    setBusy(true);
    setStatus({ type: 'ok', text: 'Mengambil avatar Roblox "' + cleanUsername + '" dari backend...' });
    try {
      const resp = await fetch(AVATAR_API_BASE + '/api/get-avatar?username=' + encodeURIComponent(cleanUsername));
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const json = await resp.json();
      const parsed = parseAvatarResponse(json);
      if (!parsed) throw new Error('Respons API tidak berisi modelUrl');
      setStatus({ type: 'ok', text: 'Model diterima: ' + parsed.modelUrl + ' — memuat ke scene...' });
      const done = await onApplyRobloxModel(parsed.modelUrl, parsed.textureUrl, cleanUsername, parsed.mtlUrl);
      if (done) {
        setStatus({ type: 'ok', text: 'Avatar Roblox "' + cleanUsername + '" berhasil dipakai!' });
      } else {
        setStatus({ type: 'err', text: 'Gagal memuat model 3D ke scene (cek format/URL).' });
      }
    } catch (err) {
      setStatus({
        type: 'err',
        text: 'Gagal: ' + err.message + ' — backend avatar mungkin belum live. Coba 8 skin default di atas.',
      });
    } finally {
      setBusy(false);
    }
  };

  const content = (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(2,6,16,0.72)', backdropFilter: 'blur(6px)',
        fontFamily: 'Inter, sans-serif',
      }}
      // PERMINTAAN USER: klik luar TIDAK menutup — hanya tombol close.
    >
      <div
        style={{
          width: 'min(680px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          background: 'rgba(14,20,32,0.98)',
          border: '1px solid rgba(148,163,184,0.28)',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(245,158,11,0.08)',
          padding: '18px 20px 20px',
          color: '#e2e8f0',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* HEADER + TOMBOL CLOSE (satu-satunya cara menutup) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fbbf24', background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.44)',
          }}>
            <UserRound size={16} />
          </span>
          <h2 style={{
            margin: 0, flex: 1, fontSize: 15, letterSpacing: 1,
            fontFamily: 'Orbitron, Inter, sans-serif', fontWeight: 700, color: '#f8fafc',
          }}>
            Change Avatar
          </h2>
          <button
            type="button"
            onClick={onClose}
            title="Tutup jendela"
            style={{
              width: 30, height: 30, borderRadius: 8, cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(220,38,38,0.14)', border: '1px solid rgba(248,113,113,0.5)',
              color: '#f87171',
            }}
          >
            <X size={15} />
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: '#8798b0', marginBottom: 14 }}>
          Jendela ini hanya bisa ditutup lewat tombol close (×) merah di atas.
        </div>

        {/* ── BAGIAN 1: 8 SKIN DEFAULT ── */}
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: '#fbbf24',
          fontFamily: 'Orbitron, Inter, sans-serif', marginBottom: 8,
        }}>
          SKIN DEFAULT (8)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
          {AVATAR_SKINS.map((sk) => {
            const active = skin && skin.key === sk.key;
            return (
              <button
                key={sk.key}
                type="button"
                onClick={() => { onApplySkin(sk); setStatus({ type: 'ok', text: 'Skin "' + sk.name + '" diterapkan.' }); }}
                style={{
                  cursor: 'pointer', textAlign: 'center', padding: '8px 6px 7px',
                  borderRadius: 10,
                  background: active ? 'rgba(245,158,11,0.14)' : 'rgba(15,23,42,0.55)',
                  border: active ? '1.5px solid rgba(251,191,36,0.85)' : '1px solid rgba(71,85,105,0.4)',
                  boxShadow: active ? '0 0 14px rgba(251,191,36,0.25)' : 'none',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* pratinjau mini: kepala + torso + kaki */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: sk.head }} />
                  <span style={{ width: 10, height: 14, borderRadius: 2, background: sk.torso }} />
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: sk.legs, alignSelf: 'flex-end' }} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: active ? '#fde68a' : '#cbd5e1' }}>
                  {sk.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── BAGIAN 2: USERNAME ROBLOX → API BACKEND ── */}
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: '#67e8f9',
          fontFamily: 'Orbitron, Inter, sans-serif', marginBottom: 8,
        }}>
          AVATAR DARI USERNAME ROBLOX
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(71,85,105,0.5)',
            borderRadius: 10, padding: '0 10px',
          }}>
            <span style={{ color: '#67e8f9', fontWeight: 700, fontSize: 13 }}>@</span>
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleFetchRoblox(); }}
              placeholder="username roblox (tanpa @)"
              spellCheck={false}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#f1f5f9', fontSize: 12.5, padding: '9px 0',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleFetchRoblox}
            disabled={busy}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              padding: '0 14px', borderRadius: 10, cursor: busy ? 'wait' : 'pointer',
              background: busy ? 'rgba(15,23,42,0.7)' : 'linear-gradient(90deg, rgba(34,211,238,0.25), rgba(14,20,32,0.7))',
              border: '1px solid rgba(34,211,238,0.55)', color: busy ? '#67e8f9' : '#e0f2fe',
              fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif',
            }}
          >
            {busy ? <Loader2 size={13} style={{ animation: 'lav-spin 1s linear infinite' }} /> : <UserRound size={13} />}
            {busy ? 'Memuat...' : 'Ubah Avatar'}
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#8798b0', lineHeight: 1.5, marginBottom: 4 }}>
          Mengambil skin dari akun Roblox via backend (<code style={{ color: '#94a3b8' }}>{AVATAR_API_BASE}/api/get-avatar</code>).
        </div>

        {/* STATUS */}
        {status && (
          <div style={{
            marginTop: 10, padding: '8px 10px', borderRadius: 9, fontSize: 11.5, lineHeight: 1.5,
            background: status.type === 'err' ? 'rgba(220,38,38,0.12)' : 'rgba(34,197,94,0.10)',
            border: status.type === 'err' ? '1px solid rgba(248,113,113,0.4)' : '1px solid rgba(74,222,128,0.4)',
            color: status.type === 'err' ? '#fca5a5' : '#86efac',
            wordBreak: 'break-all',
          }}>
            {status.text}
          </div>
        )}
      </div>
    </div>
  );

  const spinCss = `
  @keyframes lav-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `;
  return createPortal(
    <div>
      <style>{spinCss}</style>
      {content}
    </div>,
    document.body
  );
}
