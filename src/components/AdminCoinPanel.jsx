import { useState, useCallback } from 'react';
import { X, Users, Shield, Coins, Send, History, RefreshCw, AlertTriangle, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = '/api/ai-chat';

export default function AdminCoinPanel({ onClose }) {
  const { user, getIdToken } = useAuth();

  // ── State ──
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Single grant
  const [targetEmail, setTargetEmail] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [grantAmount, setGrantAmount] = useState('');
  const [grantNote, setGrantNote] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);

  // Bulk distribute
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkNote, setBulkNote] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const parsedGrantAmount = parseInt(grantAmount, 10);
  const validGrantAmount = !isNaN(parsedGrantAmount) && parsedGrantAmount >= 1 && parsedGrantAmount <= 10000;
  const parsedBulkAmount = parseInt(bulkAmount, 10);
  const validBulkAmount = !isNaN(parsedBulkAmount) && parsedBulkAmount >= 1 && parsedBulkAmount <= 10000;

  // ── API helper ──
  async function apiCall(action, method = 'GET', body = null, query = {}) {
    const token = await getIdToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';
    let url = `${API_URL}?action=${action}`;
    for (const [k, v] of Object.entries(query)) url += `&${k}=${encodeURIComponent(v)}`;
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  // ── Load members ──
  async function loadMembers() {
    setMembersLoading(true);
    setError(null);
    try {
      const { ok, data } = await apiCall('list-members');
      if (ok) {
        setMembers(data.members || []);
      } else {
        setError(data.error || 'Gagal memuat members');
      }
    } catch {
      setError('Gagal menghubungi server');
    }
    setMembersLoading(false);
  }

  // ── Load history ──
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { ok, data } = await apiCall('transfer-history', 'GET', null, { limit: '30' });
      if (ok) setHistory(data.transfers || []);
    } catch { /* silent */ }
    setHistoryLoading(false);
  }, [getIdToken]);

  // ── Lookup user ──
  async function doLookup() {
    if (!targetEmail.includes('@')) return;
    setLookupLoading(true);
    setLookupResult(null);
    setError(null);
    try {
      const { ok, data } = await apiCall('lookup-user', 'GET', null, { email: targetEmail.trim() });
      if (ok) {
        setLookupResult(data);
      } else {
        setLookupResult(null);
        setError(data.error || 'User ga ketemu');
      }
    } catch {
      setError('Gagal lookup');
    }
    setLookupLoading(false);
  }

  // ── Single grant ──
  async function doGrant() {
    if (!lookupResult || !validGrantAmount) return;
    setGrantLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { ok, data } = await apiCall('grant', 'POST', {
        targetEmail: targetEmail.trim(),
        amount: parsedGrantAmount,
        note: grantNote.trim() || undefined,
      });
      if (ok) {
        setSuccess(`Berhasil grant ${parsedGrantAmount} gold ke ${lookupResult.displayName || targetEmail}`);
        setLookupResult(null);
        setTargetEmail('');
        setGrantAmount('');
        setGrantNote('');
        loadMembers();
      } else {
        setError(data.error || 'Grant gagal');
      }
    } catch {
      setError('Gagal menghubungi server');
    }
    setGrantLoading(false);
  }

  // ── Bulk distribute ──
  async function doBulkGrant() {
    if (!validBulkAmount) return;
    setBulkLoading(true);
    setError(null);
    setBulkResult(null);
    try {
      const { ok, data } = await apiCall('bulk-grant', 'POST', {
        amount: parsedBulkAmount,
        note: bulkNote.trim() || 'Bulk distribute',
        excludeSelf: true,
      });
      if (ok) {
        setBulkResult(data);
        loadMembers();
      } else {
        setError(data.error || 'Bulk grant gagal');
      }
    } catch {
      setError('Gagal menghubungi server');
    }
    setBulkLoading(false);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      backgroundColor: '#0a0f1a', display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter,sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', backgroundColor: '#0e1420',
        borderBottom: '1px solid #1e293b', flexShrink: 0,
      }}>
        <h1 style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 15,
          color: '#fbbf24', margin: 0, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={18} /> Admin Coin Manager
        </h1>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: '#64748b',
          cursor: 'pointer', padding: 4, borderRadius: 6,
        }}>
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Error / Success */}
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#2a0a0a', border: '1px solid #7f1d1d', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        {success && (
          <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#0f2a1a', border: '1px solid #16a34a', color: '#4ade80', fontSize: 13 }}>
            {success}
          </div>
        )}

        {/* ─── Section: Bulk Distribute ─── */}
        <section style={{ backgroundColor: '#0f172a', borderRadius: 10, padding: 16, border: '1px solid #1e293b' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: '#fb923c', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={16} /> Bagi Coin ke Semua Member
          </h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="number" placeholder="Jumlah gold" value={bulkAmount}
              onChange={e => setBulkAmount(e.target.value)}
              style={{ flex: 1, minWidth: 100, padding: '10px 12px', borderRadius: 8, backgroundColor: '#1a2234', border: '1px solid #253047', color: '#fbbf24', fontFamily: 'Orbitron,sans-serif', fontSize: 14, fontWeight: 700, outline: 'none' }}
            />
            <input type="text" placeholder="Catatan (opsional)" value={bulkNote}
              onChange={e => setBulkNote(e.target.value)}
              style={{ flex: 2, minWidth: 150, padding: '10px 12px', borderRadius: 8, backgroundColor: '#1a2234', border: '1px solid #253047', color: '#94a3b8', fontSize: 12, outline: 'none' }}
            />
            <button onClick={doBulkGrant} disabled={!validBulkAmount || bulkLoading}
              style={{
                padding: '10px 20px', borderRadius: 8, cursor: (!validBulkAmount || bulkLoading) ? 'default' : 'pointer',
                backgroundColor: (!validBulkAmount || bulkLoading) ? '#1e293b' : '#ea580c',
                border: 'none', color: (!validBulkAmount || bulkLoading) ? '#334155' : '#fff',
                fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              }}
            >
              {bulkLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Users size={14} />}
              {bulkLoading ? 'Membagi...' : 'Distribute'}
            </button>
          </div>
          {bulkResult && (
            <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, backgroundColor: '#0f2a1a', border: '1px solid #16a34a', color: '#4ade80', fontSize: 12, lineHeight: 1.5 }}>
              <strong>{bulkResult.count}</strong> member dapat <strong>{parsedBulkAmount}</strong> gold
              (total: <strong>{bulkResult.totalGranted}</strong> gold)
            </div>
          )}
          {/* Quick presets */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {[10, 25, 50, 100, 500, 1000].map(q => (
              <button key={q} onClick={() => setBulkAmount(String(q))} style={{
                padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
                backgroundColor: '#1e293b', border: '1px solid #334155',
                color: '#94a3b8', fontFamily: 'Orbitron,sans-serif', fontSize: 11, fontWeight: 600,
              }}>{q}</button>
            ))}
          </div>
        </section>

        {/* ─── Section: Single Grant ─── */}
        <section style={{ backgroundColor: '#0f172a', borderRadius: 10, padding: 16, border: '1px solid #1e293b' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Send size={16} /> Grant ke 1 Member
          </h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="email" placeholder="Email member..." value={targetEmail}
              onChange={e => { setTargetEmail(e.target.value); setLookupResult(null); setError(null); }}
              onKeyDown={e => e.key === 'Enter' && doLookup()}
              style={{ flex: 2, minWidth: 180, padding: '10px 12px', borderRadius: 8, backgroundColor: '#1a2234', border: '1px solid #253047', color: '#e2e8f0', fontSize: 13, outline: 'none' }}
            />
            <button onClick={doLookup} disabled={lookupLoading || !targetEmail.includes('@')}
              style={{
                padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                backgroundColor: '#1e293b', border: '1px solid #334155',
                color: '#94a3b8', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
              }}
            >
              {lookupLoading ? <RefreshCw size={12} /> : <Search size={12} />} Cari
            </button>
          </div>
          {/* Lookup result */}
          {lookupResult && (
            <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 8, backgroundColor: '#1a2234', border: '1px solid #16a34a', fontSize: 12, color: '#4ade80' }}>
              Ditemukan: <strong>{lookupResult.displayName || lookupResult.email}</strong>
              {lookupResult.gold !== undefined && <> — Saldo: <strong style={{ color: '#fbbf24' }}>{lookupResult.gold}</strong> gold</>}
            </div>
          )}
          {lookupResult && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
              <input type="number" placeholder="Jumlah gold" value={grantAmount}
                onChange={e => setGrantAmount(e.target.value)}
                style={{ flex: 1, minWidth: 100, padding: '10px 12px', borderRadius: 8, backgroundColor: '#1a2234', border: '1px solid #253047', color: '#fbbf24', fontFamily: 'Orbitron,sans-serif', fontSize: 14, fontWeight: 700, outline: 'none' }}
              />
              <input type="text" placeholder="Catatan" value={grantNote}
                onChange={e => setGrantNote(e.target.value)}
                style={{ flex: 2, minWidth: 120, padding: '10px 12px', borderRadius: 8, backgroundColor: '#1a2234', border: '1px solid #253047', color: '#94a3b8', fontSize: 12, outline: 'none' }}
              />
              <button onClick={doGrant} disabled={!validGrantAmount || grantLoading}
                style={{
                  padding: '10px 20px', borderRadius: 8, cursor: (!validGrantAmount || grantLoading) ? 'default' : 'pointer',
                  backgroundColor: (!validGrantAmount || grantLoading) ? '#1e293b' : '#16a34a',
                  border: 'none', color: (!validGrantAmount || grantLoading) ? '#334155' : '#fff',
                  fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                }}
              >
                {grantLoading ? <RefreshCw size={14} /> : <Send size={14} />}
                {grantLoading ? 'Mengirim...' : 'Grant'}
              </button>
            </div>
          )}
        </section>

        {/* ─── Section: Member List ─── */}
        <section style={{ backgroundColor: '#0f172a', borderRadius: 10, padding: 16, border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Coins size={16} /> Member List
            </h2>
            <button onClick={loadMembers} disabled={membersLoading}
              style={{
                padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                backgroundColor: '#1e293b', border: '1px solid #334155',
                color: '#94a3b8', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {membersLoading ? <RefreshCw size={12} /> : <RefreshCw size={12} />} Load
            </button>
          </div>

          {members.length > 0 ? (
            <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {members
                .sort((a, b) => (b.gold || 0) - (a.gold || 0))
                .map((m, i) => (
                  <div key={m.uid} style={{
                    padding: '8px 12px', borderRadius: 6, backgroundColor: '#111827',
                    border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#475569', fontFamily: 'Orbitron,sans-serif', fontSize: 10, minWidth: 24 }}>#{i + 1}</span>
                      <span style={{ color: '#e2e8f0' }}>{m.displayName || m.email || m.uid.slice(0, 16)}</span>
                    </div>
                    <span style={{ color: '#fbbf24', fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 12 }}>
                      {m.gold || 0} <Coins size={10} style={{ verticalAlign: -1 }} />
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: 12 }}>Klik "Load" buat liat semua member</div>
          )}
        </section>

        {/* ─── Section: History ─── */}
        <section style={{ backgroundColor: '#0f172a', borderRadius: 10, padding: 16, border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <History size={16} /> Riwayat
            </h2>
            <button onClick={loadHistory} disabled={historyLoading}
              style={{
                padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                backgroundColor: '#1e293b', border: '1px solid #334155',
                color: '#94a3b8', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {historyLoading ? <RefreshCw size={12} /> : <RefreshCw size={12} />} Load
            </button>
          </div>

          {history.length > 0 ? (
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {history.map((h, i) => {
                const isIn = h.type === 'transfer_in' || h.type === 'admin_grant';
                return (
                  <div key={i} style={{ padding: '6px 10px', borderRadius: 6, backgroundColor: '#111827', border: '1px solid #1e293b', fontSize: 11 }}>
                    <span style={{ color: isIn ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                      {isIn ? '↓' : '↑'} {h.type}
                    </span>
                    {' '}<span style={{ color: '#fbbf24', fontWeight: 700 }}>{Math.abs(h.amount)}</span>
                    <span style={{ color: '#64748b' }}> gold</span>
                    {h.meta?.note && <span style={{ color: '#475569' }}> — "{h.meta.note}"</span>}
                    {h.createdAt && <span style={{ color: '#475569', marginLeft: 8 }}>
                      {new Date(h.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: 12 }}>Klik "Load" buat liat riwayat</div>
          )}
        </section>

      </div>
    </div>
  );
}
