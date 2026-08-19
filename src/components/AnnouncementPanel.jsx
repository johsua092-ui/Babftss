import { useState, useCallback, useEffect } from 'react';
import { X, Megaphone, Send, Edit3, Trash2, Check, Users, Clock, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
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
  textarea: {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    backgroundColor: '#1a2234', border: '1px solid #253047',
    color: '#e2e8f0', fontFamily: 'Inter,sans-serif', fontSize: 13,
    outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: 80,
  },
  sendBtn: (disabled) => ({
    width: '100%', padding: '12px', borderRadius: 10, cursor: disabled ? 'default' : 'pointer',
    backgroundColor: disabled ? '#1e293b' : '#1a1000',
    border: '1px solid ' + (disabled ? '#253047' : '#92400e'),
    color: disabled ? '#334155' : '#fbbf24',
    fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all 0.2s',
  }),
  card: {
    padding: '12px 14px', borderRadius: 10, backgroundColor: '#111827',
    border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 6,
  },
  cardTitle: {
    fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, color: '#fbbf24',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  cardBody: {
    fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#94a3b8', lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
  cardMeta: {
    fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#475569',
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
  },
  cardActions: {
    display: 'flex', gap: 6, marginTop: 4,
  },
  actionBtn: (color) => ({
    padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
    backgroundColor: 'transparent', border: `1px solid ${color}`,
    color, fontFamily: 'Inter,sans-serif', fontSize: 11,
    fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
    transition: 'all 0.2s',
  }),
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
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '30px 0', color: '#475569',
  },
  editOverlay: {
    position: 'absolute', inset: 0, zIndex: 20,
    backgroundColor: '#0f1520', display: 'flex', flexDirection: 'column',
  },
};

function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
  } catch { return ''; }
}

export default function AnnouncementPanel({ onClose }) {
  const { user, getIdToken } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editSending, setEditSending] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !sending;

  const fetchAnnouncements = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getIdToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}?action=announcements&limit=30`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user, getIdToken]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  async function handleCreate() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const token = await getIdToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}?action=create-announcement`, {
        method: 'POST', headers,
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gagal membuat announcement'); return; }
      setSuccess(`Announcement dikirim ke ${data.recipientCount} user`);
      setTitle('');
      setBody('');
      fetchAnnouncements();
    } catch { setError('Gagal menghubungi server'); }
    finally { setSending(false); }
  }

  async function handleEdit() {
    if (!editingId) return;
    setEditSending(true);
    setError(null);
    try {
      const token = await getIdToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}?action=edit-announcement`, {
        method: 'POST', headers,
        body: JSON.stringify({ announcementId: editingId, title: editTitle.trim(), body: editBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gagal edit'); return; }
      setEditingId(null);
      fetchAnnouncements();
    } catch { setError('Gagal menghubungi server'); }
    finally { setEditSending(false); }
  }

  async function handleDelete(announcementId) {
    setDeleting(announcementId);
    setError(null);
    try {
      const token = await getIdToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}?action=delete-announcement`, {
        method: 'POST', headers,
        body: JSON.stringify({ announcementId }),
      });
      if (!res.ok) { const data = await res.json(); setError(data.error || 'Gagal hapus'); return; }
      fetchAnnouncements();
    } catch { setError('Gagal menghubungi server'); }
    finally { setDeleting(null); }
  }

  function startEdit(a) {
    setEditingId(a.id);
    setEditTitle(a.title);
    setEditBody(a.body);
  }

  // Edit overlay
  if (editingId) {
    return (
      <div style={s.editOverlay}>
        <div style={s.header}>
          <h2 style={s.headerTitle}>
            <Edit3 size={16} color="#fbbf24" />
            Edit Announcement
          </h2>
          <button style={s.closeBtn} onClick={() => setEditingId(null)}
            onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <X size={16} />
          </button>
        </div>
        <div style={s.body}>
          {error && <div style={s.errorBox}><AlertTriangle size={14} /><span>{error}</span></div>}
          <div>
            <div style={s.label}>Judul</div>
            <input style={s.input} value={editTitle} onChange={e => setEditTitle(e.target.value)} maxLength={200} />
          </div>
          <div>
            <div style={s.label}>Isi</div>
            <textarea style={s.textarea} value={editBody} onChange={e => setEditBody(e.target.value)} maxLength={2000} />
          </div>
          <button style={s.sendBtn(!editTitle.trim() || !editBody.trim() || editSending)} onClick={handleEdit} disabled={!editTitle.trim() || !editBody.trim() || editSending}>
            {editSending ? 'Menyimpan...' : <><Check size={14} /> Simpan Perubahan</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.overlay}>
      <div style={s.header}>
        <h2 style={s.headerTitle}>
          <Megaphone size={16} color="#fbbf24" />
          Announcement
        </h2>
        <button style={s.closeBtn} onClick={onClose}
          onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <X size={16} />
        </button>
      </div>

      <div style={s.body}>
        {/* Create form */}
        <div style={{ padding: '10px 12px', borderRadius: 10, backgroundColor: '#0f172a', border: '1px solid #1e3a5f' }}>
          <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#60a5fa', marginBottom: 8, fontWeight: 600 }}>
            Buat Announcement Baru
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={s.label}>Judul</div>
            <input
              style={s.input}
              placeholder="Judul announcement..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={s.label}>Isi Pesan</div>
            <textarea
              style={s.textarea}
              placeholder="Tulis announcement untuk semua member..."
              value={body}
              onChange={e => setBody(e.target.value)}
              maxLength={2000}
            />
          </div>
          <button style={s.sendBtn(!canSend)} onClick={handleCreate} disabled={!canSend}>
            {sending ? 'Mengirim...' : <><Send size={14} /> Kirim ke Semua Member</>}
          </button>
        </div>

        {error && <div style={s.errorBox}><AlertTriangle size={14} /><span>{error}</span></div>}
        {success && <div style={s.successBox}>{success}</div>}

        <div style={s.divider} />

        {/* Existing announcements */}
        <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Megaphone size={12} /> Riwayat Announcement
        </div>

        {loading && <div style={{ color: '#64748b', fontSize: 12, fontFamily: 'Inter,sans-serif' }}>Memuat...</div>}

        {!loading && announcements.length === 0 && (
          <div style={s.emptyState}>
            <Megaphone size={24} />
            <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12 }}>Belum ada announcement</span>
          </div>
        )}

        {!loading && announcements.map((a) => (
          <div key={a.id} style={s.card}>
            <div style={s.cardTitle}>
              <Megaphone size={13} />
              {a.title}
            </div>
            <div style={s.cardBody}>{a.body}</div>
            <div style={s.cardMeta}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={10} /> {formatTime(a.createdAt)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Users size={10} /> {a.recipientCount} user
              </span>
              {a.createdByName && <span>Dari: {a.createdByName}</span>}
              {a.delivered ? <span style={{ color: '#4ade80' }}>Terkirim</span> : <span style={{ color: '#fbbf24' }}>Pending</span>}
            </div>
            <div style={s.cardActions}>
              <button style={s.actionBtn('#60a5fa')} onClick={() => startEdit(a)}>
                <Edit3 size={11} /> Edit
              </button>
              <button
                style={s.actionBtn(deleting === a.id ? '#475569' : '#f87171')}
                onClick={() => handleDelete(a.id)}
                disabled={deleting === a.id}
              >
                <Trash2 size={11} /> {deleting === a.id ? '...' : 'Hapus'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
