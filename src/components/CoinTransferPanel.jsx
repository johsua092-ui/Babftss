import { useState, useCallback } from 'react';
import { X, Send, ArrowRightLeft, Coins, AlertTriangle, History, ChevronDown, ChevronUp, Shield, Users, Inbox, Megaphone, CheckCircle2, XCircle, Loader2, ArrowDown, ArrowUp, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AnnouncementPanel from './AnnouncementPanel';

const API_URL = '/api/ai-chat';

const s = {
  overlay: {
    position: 'absolute', inset: 0, zIndex: 10,
    backgroundColor: '#0f1520', display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 14px', backgroundColor: '#0e1420',
    borderBottom: '1px solid #1e293b', flexShrink: 0,
  },
  headerTitle: {
    fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 13,
    color: '#e2e8f0', margin: 0, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 8,
  },
  closeBtn: {
    background: 'transparent', border: 'none', color: '#64748b',
    cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
    borderRadius: 6, transition: 'color 0.2s',
  },
  body: {
    flex: 1, overflowY: 'auto', padding: 14,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  label: {
    fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600,
    color: '#94a3b8', marginBottom: 4,
  },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    backgroundColor: '#1a2234', border: '1px solid #253047',
    color: '#e2e8f0', fontFamily: 'Inter,sans-serif', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  },
  inputFocused: {
    borderColor: '#475569',
  },
  amountRow: {
    display: 'flex', gap: 8, alignItems: 'center',
  },
  amountInput: {
    flex: 1, padding: '10px 12px', borderRadius: 8,
    backgroundColor: '#1a2234', border: '1px solid #253047',
    color: '#fbbf24', fontFamily: 'Orbitron,sans-serif', fontSize: 15, fontWeight: 700,
    outline: 'none', boxSizing: 'border-box',
  },
  maxBtn: {
    padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
    backgroundColor: '#1e293b', border: '1px solid #334155',
    color: '#94a3b8', fontFamily: 'Inter,sans-serif', fontSize: 11,
    fontWeight: 600, transition: 'all 0.2s', flexShrink: 0,
  },
  noteInput: {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    backgroundColor: '#1a2234', border: '1px solid #253047',
    color: '#94a3b8', fontFamily: 'Inter,sans-serif', fontSize: 12,
    outline: 'none', boxSizing: 'border-box',
  },
  sendBtn: (disabled) => ({
    width: '100%', padding: '12px', borderRadius: 10, cursor: disabled ? 'default' : 'pointer',
    backgroundColor: disabled ? '#1e293b' : '#0f2a1a',
    border: '1px solid ' + (disabled ? '#253047' : '#16a34a'),
    color: disabled ? '#334155' : '#4ade80',
    fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all 0.2s',
  }),
  adminBtn: (disabled) => ({
    width: '100%', padding: '10px', borderRadius: 10, cursor: disabled ? 'default' : 'pointer',
    backgroundColor: disabled ? '#1e293b' : '#1a1000',
    border: '1px solid ' + (disabled ? '#253047' : '#92400e'),
    color: disabled ? '#334155' : '#fbbf24',
    fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: 'all 0.2s',
  }),
  infoBox: {
    padding: '10px 12px', borderRadius: 8,
    backgroundColor: '#0f172a', border: '1px solid #1e3a5f',
    fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#60a5fa', lineHeight: 1.5,
  },
  errorBox: {
    padding: '8px 12px', borderRadius: 8,
    backgroundColor: '#2a0a0a', border: '1px solid #7f1d1d',
    fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#f87171', lineHeight: 1.4,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  successBox: {
    padding: '10px 12px', borderRadius: 8,
    backgroundColor: '#0f2a1a', border: '1px solid #16a34a',
    fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#4ade80', lineHeight: 1.5,
  },
  divider: {
    borderTop: '1px solid #1e293b', margin: '4px 0',
  },
  historyToggle: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'transparent', border: 'none', color: '#64748b',
    cursor: 'pointer', padding: '4px 0', fontFamily: 'Inter,sans-serif',
    fontSize: 12, fontWeight: 600,
  },
  historyItem: {
    padding: '8px 10px', borderRadius: 8, backgroundColor: '#111827',
    border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 2,
  },
  historyType: (isIn) => ({
    fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600,
    color: isIn ? '#4ade80' : '#f87171',
    display: 'flex', alignItems: 'center', gap: 4,
  }),
  historyMeta: {
    fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#64748b',
  },
  quickAmounts: {
    display: 'flex', gap: 4, flexWrap: 'wrap',
  },
  quickBtn: {
    padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
    backgroundColor: '#1e293b', border: '1px solid #334155',
    color: '#94a3b8', fontFamily: 'Orbitron,sans-serif', fontSize: 11,
    fontWeight: 600, transition: 'all 0.2s',
  },
};

export default function CoinTransferPanel({ onClose, currentGold, isAdmin }) {
  const { user, getIdToken } = useAuth();
  const [targetEmail, setTargetEmail] = useState('');
  const [targetUid, setTargetUid] = useState(''); // resolved UID after lookup
  const [targetName, setTargetName] = useState(''); // resolved display name
  const [lookupStatus, setLookupStatus] = useState('idle'); // idle | searching | found | not_found
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [focusTarget, setFocusTarget] = useState(false);
  const [focusAmount, setFocusAmount] = useState(false);

  const gold = isAdmin ? Infinity : (currentGold ?? 0);
  const parsedAmount = parseInt(amount, 10);
  const validAmount = !isNaN(parsedAmount) && parsedAmount >= 1 && parsedAmount <= (isAdmin ? 10000 : 1000);
  const canSend = targetUid && lookupStatus === 'found' && validAmount && !loading;

  // ── Email lookup with debounce ──
  const lookupTimerRef = useState(null);
  async function doLookup(email) {
    if (!email || !email.includes('@') || !email.includes('.')) {
      setLookupStatus('idle');
      setTargetUid('');
      setTargetName('');
      return;
    }
    setLookupStatus('searching');
    try {
      const token = await getIdToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}?action=lookup-user&email=${encodeURIComponent(email.trim())}`, { headers });
      const data = await res.json();
      if (data.found) {
        setTargetUid(data.uid);
        setTargetName(data.displayName || data.email);
        setLookupStatus('found');
      } else {
        setTargetUid('');
        setTargetName('');
        setLookupStatus('not_found');
      }
    } catch {
      setLookupStatus('idle');
      setTargetUid('');
      setTargetName('');
    }
  }

  function handleEmailChange(val) {
    setTargetEmail(val);
    setTargetUid('');
    setTargetName('');
    setLookupStatus('idle');
    setError(null);
    // Debounce lookup: 600ms after last keystroke
    if (lookupTimerRef[0]) clearTimeout(lookupTimerRef[0]);
    const timer = setTimeout(() => doLookup(val), 600);
    lookupTimerRef[1](timer);
  }

  // ── Quick amount presets ──
  const quickAmounts = isAdmin ? [10, 50, 100, 500, 1000] : [5, 10, 25, 50, 100];

  async function doTransfer() {
    if (!user || !canSend) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = await getIdToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}?action=transfer`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targetEmail: targetEmail.trim(),
          amount: parsedAmount,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Transfer gagal');
        return;
      }
      setSuccess(data);
      setTargetEmail('');
      setTargetUid('');
      setTargetName('');
      setLookupStatus('idle');
      setAmount('');
      setNote('');
    } catch {
      setError('Gagal menghubungi server. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  async function doAdminGrant() {
    if (!user || !isAdmin || !targetUid || !validAmount) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = await getIdToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}?action=grant`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targetEmail: targetEmail.trim(),
          amount: parsedAmount,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Grant gagal');
        return;
      }
      setSuccess(data);
      setTargetEmail('');
      setTargetUid('');
      setTargetName('');
      setLookupStatus('idle');
      setAmount('');
      setNote('');
    } catch {
      setError('Gagal menghubungi server. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  async function doBulkGrant() {
    if (!user || !isAdmin || !validAmount) return;
    setBulkLoading(true);
    setError(null);
    setBulkResult(null);
    try {
      const token = await getIdToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}?action=bulk-grant`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: parsedAmount,
          note: note.trim() || 'Bulk distribute',
          excludeSelf: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Bulk grant gagal');
        return;
      }
      setBulkResult(data);
    } catch {
      setError('Gagal menghubungi server. Coba lagi.');
    } finally {
      setBulkLoading(false);
    }
  }

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const token = await getIdToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}?action=transfer-history&limit=15`, { headers });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.transfers || []);
      }
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  }, [user, getIdToken]);

  function toggleHistory() {
    if (!showHistory) fetchHistory();
    setShowHistory(p => !p);
  }

  return (
    <div style={s.overlay}>
      {/* Header */}
      <div style={s.header}>
        <h2 style={s.headerTitle}>
          <ArrowRightLeft size={16} color="#fbbf24" />
          Transfer Coin
        </h2>
        <button style={s.closeBtn} onClick={onClose}
          onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <X size={16} />
        </button>
      </div>

      <div style={s.body}>
        {/* Info */}
        <div style={s.infoBox}>
          Saldo kamu: <strong style={{ color: '#fbbf24' }}>{gold === Infinity ? <svg width="18" height="10" viewBox="0 0 24 12" fill="none" style={{display:'inline-block',verticalAlign:'middle'}}><path d="M12,6 C12,1.5 5,1.5 5,6 C5,10.5 12,10.5 12,6 C12,1.5 19,1.5 19,6 C19,10.5 12,10.5 12,6" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" fill="none"/></svg> : gold}</strong> gold
          {isAdmin && <span style={{ marginLeft: 8 }}><Shield size={12} style={{ verticalAlign: -1 }} /> Admin</span>}
        </div>

        {/* Target Email */}
        <div>
          <div style={s.label}>Email Penerima</div>
          <input
            style={{ ...s.input, ...(focusTarget ? s.inputFocused : {}) }}
            type="email"
            placeholder="Email temen kamu..."
            value={targetEmail}
            onChange={e => handleEmailChange(e.target.value)}
            onFocus={() => setFocusTarget(true)}
            onBlur={() => setFocusTarget(false)}
            maxLength={128}
            autoComplete="off"
          />
          {/* Lookup status indicator */}
          {targetEmail.includes('@') && (
            <div style={{ marginTop: 4, fontSize: 11, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 4,
              color: lookupStatus === 'found' ? '#4ade80' : lookupStatus === 'not_found' ? '#f87171' : lookupStatus === 'searching' ? '#fbbf24' : '#64748b' }}>
              {lookupStatus === 'searching' && <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Mencari...</>}
              {lookupStatus === 'found' && <><CheckCircle2 size={12} /> {targetName}</>}
              {lookupStatus === 'not_found' && <><XCircle size={12} /> User ga ketemu (belum pernah login)</>}
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <div style={s.label}>Jumlah Gold</div>
          <div style={s.amountRow}>
            <input
              style={{ ...s.amountInput, ...(focusAmount ? s.inputFocused : {}) }}
              type="number"
              min={1}
              max={isAdmin ? 10000 : 1000}
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onFocus={() => setFocusAmount(true)}
              onBlur={() => setFocusAmount(false)}
            />
            {!isAdmin && gold > 0 && (
              <button style={s.maxBtn} onClick={() => setAmount(String(Math.min(gold, 1000)))}>MAX</button>
            )}
          </div>
          {/* Quick amounts */}
          <div style={{ ...s.quickAmounts, marginTop: 6 }}>
            {quickAmounts.map(qa => (
              <button key={qa} style={s.quickBtn} onClick={() => setAmount(String(qa))}>
                {qa}
              </button>
            ))}
          </div>
          {/* Live tax preview */}
          {validAmount && (
            <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'Inter,sans-serif', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              {isAdmin ? (
                <span style={{ color: '#4ade80', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Shield size={12} /> Tax-free (admin)</span>
              ) : (
                <>
                  <span style={{ color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Coins size={12} /> Tax 5%: {Math.ceil(parsedAmount * 0.05)} gold</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ArrowRight size={12} /> Penerima dapat: <strong style={{ color: '#4ade80' }}>{parsedAmount - Math.ceil(parsedAmount * 0.05)}</strong></span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Note (optional) */}
        <div>
          <div style={s.label}>Catatan (opsional)</div>
          <input
            style={s.noteInput}
            type="text"
            placeholder="Hadiah, bantuan, dll..."
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={s.errorBox}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={s.successBox}>
            <strong>Transfer berhasil!</strong><br />
            {success.amount && `${success.amount} gold dikirim`}
            {success.tax > 0 && <span style={{ color: '#fbbf24' }}> (tax: {success.tax}, diterima: {success.receiveAmount})</span>}
            {success.tax === 0 && success.receiveAmount && ' (tax-free)'}
            {success.targetUid && ` ke ${targetName || success.targetUid.slice(0, 12) + '...'}`}
            {success.fromBalance !== undefined && ` — Saldo: ${success.fromBalance}`}
            {success.targetNewBalance !== undefined && (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 4 }}><ArrowRight size={11} /> Tujuan: <strong style={{ color: '#4ade80' }}>{success.targetNewBalance}</strong></span>)}
          </div>
        )}

        {/* Transfer button (member) */}
        {!isAdmin && (
          <button style={s.sendBtn(!canSend)} onClick={doTransfer} disabled={!canSend}>
            {loading ? 'Mengirim...' : (
              <>
                <Send size={14} />
                Kirim {parsedAmount || '?'} Gold
              </>
            )}
          </button>
        )}

        {/* Admin: both options */}
        {isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button style={s.sendBtn(!canSend)} onClick={doTransfer} disabled={!canSend}>
              {loading ? 'Mengirim...' : (
                <>
                  <Send size={14} />
                  Transfer (dari saldo)
                </>
              )}
            </button>
            <button style={s.adminBtn(!canSend || loading)}
              onClick={doAdminGrant}
              disabled={!canSend || loading}
            >
              {loading ? '...' : (
                <>
                  <Shield size={14} />
                  Grant (tanpa potong saldo)
                </>
              )}
            </button>

            {/* Bulk Distribute — bagi coin ke semua member */}
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: 8, marginTop: 4 }}>
              <div style={{ ...s.label, color: '#fbbf24', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={12} /> Bagi ke Semua Member
              </div>
              <button
                style={{
                  width: '100%', padding: '10px', borderRadius: 10,
                  cursor: (!validAmount || bulkLoading) ? 'default' : 'pointer',
                  backgroundColor: (!validAmount || bulkLoading) ? '#1e293b' : '#1a0a00',
                  border: '1px solid ' + ((!validAmount || bulkLoading) ? '#253047' : '#ea580c'),
                  color: (!validAmount || bulkLoading) ? '#334155' : '#fb923c',
                  fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.2s',
                }}
                onClick={doBulkGrant}
                disabled={!validAmount || bulkLoading}
              >
                {bulkLoading ? 'Membagi...' : (
                  <>
                    <Users size={14} />
                    Distribute {parsedAmount || '?'} Gold ke Semua
                  </>
                )}
              </button>
              {bulkResult && (
                <div style={{ marginTop: 6, padding: '8px 10px', borderRadius: 8,
                  backgroundColor: '#0f2a1a', border: '1px solid #16a34a',
                  fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#4ade80', lineHeight: 1.4 }}>
                  <CheckCircle2 size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> <strong>{bulkResult.count}</strong> member dapat <strong>{parsedAmount}</strong> gold
                  (total: <strong>{bulkResult.totalGranted}</strong>)
                </div>
              )}
            </div>

            {/* Announcement */}
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: 8, marginTop: 4 }}>
              <div style={{ ...s.label, color: '#fbbf24', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Megaphone size={12} /> Announcement
              </div>
              <button
                style={{
                  width: '100%', padding: '10px', borderRadius: 10, cursor: 'pointer',
                  backgroundColor: '#1a1000', border: '1px solid #92400e',
                  color: '#fbbf24', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.2s',
                }}
                onClick={() => setShowAnnounce(true)}
              >
                <Megaphone size={14} />
                Buat Announcement
              </button>
            </div>
          </div>
        )}

        {showAnnounce && <AnnouncementPanel onClose={() => setShowAnnounce(false)} />}

        {/* Divider */}
        <div style={s.divider} />

        {/* History toggle */}
        <button style={s.historyToggle} onClick={toggleHistory}>
          <History size={14} />
          Riwayat Transfer
          {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* History list */}
        {showHistory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {historyLoading && <div style={{ color: '#64748b', fontSize: 12 }}>Memuat...</div>}
            {!historyLoading && history.length === 0 && (
              <div style={{ color: '#64748b', fontSize: 12 }}>Belum ada riwayat transfer</div>
            )}
            {history.map((h, i) => {
              const isIn = h.type === 'transfer_in' || h.type === 'admin_grant';
              const counterparty = isIn
                ? h.meta?.fromUid || h.meta?.grantedBy || '?'
                : h.meta?.toUid || '?';
              return (
                <div key={i} style={s.historyItem}>
                  <div style={s.historyType(isIn)}>
                    {isIn ? <><ArrowDown size={12} style={{ verticalAlign: 'middle' }} /> Masuk</> : <><ArrowUp size={12} style={{ verticalAlign: 'middle' }} /> Keluar</>}
                    <Coins size={12} style={{ color: '#fbbf24' }} />
                    {Math.abs(h.amount)} gold
                  </div>
                  <div style={s.historyMeta}>
                    {isIn ? 'Dari' : 'Ke'}: {counterparty.slice(0, 16)}{counterparty.length > 16 ? '...' : ''}
                    {' · '}{h.createdAt ? new Date(h.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                    {h.meta?.note && ` · "${h.meta.note}"`}
                  </div>
                  <div style={{ ...s.historyMeta, color: '#475569' }}>
                    Saldo: {h.balanceAfter}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
