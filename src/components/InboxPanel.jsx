import { useState, useEffect, useCallback } from 'react';
import { X, Inbox, Mail, MailOpen, CheckCheck, Coins, ArrowDownToLine, RefreshCw, Megaphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  msgCard: (unread) => ({
    padding: '10px 12px', borderRadius: 8,
    backgroundColor: unread ? '#0f172a' : '#111827',
    border: `1px solid ${unread ? '#1e3a5f' : '#1e293b'}`,
    display: 'flex', flexDirection: 'column', gap: 4,
    cursor: 'pointer', transition: 'border-color 0.2s',
  }),
  msgHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  msgTitle: (unread) => ({
    fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: unread ? 700 : 500,
    color: unread ? '#e2e8f0' : '#94a3b8',
    display: 'flex', alignItems: 'center', gap: 6,
  }),
  msgTime: {
    fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#64748b', flexShrink: 0,
  },
  msgBody: {
    fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#94a3b8', lineHeight: 1.4,
  },
  msgAmount: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontFamily: 'Orbitron,sans-serif', fontSize: 13, fontWeight: 700, color: '#fbbf24',
  },
  markAllBtn: {
    padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
    backgroundColor: '#1e293b', border: '1px solid #334155',
    color: '#94a3b8', fontFamily: 'Inter,sans-serif', fontSize: 11,
    fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
    transition: 'all 0.2s', flexShrink: 0,
  },
  footer: {
    padding: '10px 14px', backgroundColor: '#0e1420',
    borderTop: '1px solid #1e293b', flexShrink: 0,
    fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '40px 0', color: '#475569',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#dc2626', color: '#fff', fontSize: 10,
    fontFamily: 'Inter,sans-serif', fontWeight: 700, padding: '0 4px',
  },
};

export default function InboxPanel({ onClose }) {
  const { user, getIdToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchInbox = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(null);
    try {
      const token = await getIdToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}?action=inbox&limit=30`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        const errData = await res.json().catch(() => ({}));
        setFetchError(`API error ${res.status}: ${errData.error || 'Unknown'}`);
      }
    } catch (e) {
      setFetchError(e?.message || 'Fetch failed');
    }
    finally { setLoading(false); }
  }, [user, getIdToken]);

  useEffect(() => { fetchInbox(); }, [fetchInbox]);

  async function handleMarkRead(messageId) {
    try {
      const token = await getIdToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}?action=inbox-read`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messageId }),
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch { /* silent */ }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      const token = await getIdToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}?action=inbox-read-all`, {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => ({ ...m, read: true })));
        setUnreadCount(0);
      }
    } catch { /* silent */ }
    finally { setMarkingAll(false); }
  }

  function formatTime(createdAt) {
    if (!createdAt) return '';
    try {
      return new Date(createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    } catch { return ''; }
  }

  return (
    <div style={s.overlay}>
      {/* Header */}
      <div style={s.header}>
        <h2 style={s.headerTitle}>
          <Inbox size={16} color="#60a5fa" />
          Inbox
          {unreadCount > 0 && <span style={s.badge}>{unreadCount}</span>}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {unreadCount > 0 && (
            <button
              style={s.markAllBtn}
              onClick={handleMarkAllRead}
              disabled={markingAll}
              onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            >
              <CheckCheck size={12} />
              {markingAll ? '...' : 'Tandai semua dibaca'}
            </button>
          )}
          <button style={s.closeBtn} onClick={fetchInbox} title="Refresh"
            onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <RefreshCw size={14} />
          </button>
          <button style={s.closeBtn} onClick={onClose}
            onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={s.body}>
        {fetchError && (
          <div style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: '#2a0a0a', border: '1px solid #7f1d1d', fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#f87171', lineHeight: 1.4, marginBottom: 8 }}>
            Gagal memuat inbox: {fetchError}
          </div>
        )}
        {loading && (
          <div style={s.emptyState}>
            <Inbox size={24} />
            <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12 }}>Memuat pesan...</span>
          </div>
        )}

        {!loading && messages.length === 0 && !fetchError && (
          <div style={s.emptyState}>
            <Mail size={28} />
            <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#64748b' }}>
              Belum ada pesan
            </span>
            <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#475569' }}>
              Pesan transfer masuk akan muncul di sini
            </span>
          </div>
        )}

        {!loading && messages.map((msg) => (
          <div
            key={msg.id}
            style={s.msgCard(!msg.read)}
            onClick={() => { if (!msg.read) handleMarkRead(msg.id); }}
          >
            <div style={s.msgHeader}>
              <div style={s.msgTitle(!msg.read)}>
                {!msg.read ? <Mail size={13} color="#60a5fa" /> : <MailOpen size={13} />}
                {msg.type === 'transfer_in' ? 'Transfer Masuk' : msg.type === 'admin_grant' ? 'Grant Admin' : msg.type === 'announcement' ? 'Announcement' : 'Pesan'}
              </div>
              <span style={s.msgTime}>{formatTime(msg.createdAt)}</span>
            </div>

            {msg.type === 'announcement' ? (
              <div style={{ padding: '6px 8px', borderRadius: 6, backgroundColor: '#1a1000', border: '1px solid #92400e', fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#fbbf24', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Megaphone size={12} /> {msg.note || 'Announcement'}
                </div>
                {msg.announcementBody && <div style={{ color: '#94a3b8', fontSize: 11 }}>{msg.announcementBody}</div>}
              </div>
            ) : (msg.type === 'transfer_in' || msg.type === 'admin_grant') ? (
              <div style={s.msgAmount}>
                <ArrowDownToLine size={14} color={msg.type === 'admin_grant' ? '#fbbf24' : '#4ade80'} />
                <Coins size={14} />
                {msg.amount} gold
                {msg.tax > 0 && (
                  <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 400 }}>
                    (tax: {msg.tax})
                  </span>
                )}
                {msg.type === 'admin_grant' && (
                  <span style={{ color: '#fbbf24', fontSize: 10, fontWeight: 400 }}>
                    (tax-free)
                  </span>
                )}
              </div>
            ) : null}

            {msg.fromName && (
              <div style={{ ...s.msgBody, color: '#60a5fa', fontSize: 11 }}>
                Dari: {msg.fromName}{msg.fromEmail ? ` (${msg.fromEmail})` : ''}
              </div>
            )}

            {msg.type !== 'announcement' && msg.note && (
              <div style={s.msgBody}>&ldquo;{msg.note}&rdquo;</div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <Inbox size={12} color="#60a5fa" />
        Inbox — transfer, grant, &amp; announcement masuk
      </div>
    </div>
  );
}
