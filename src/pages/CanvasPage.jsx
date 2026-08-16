import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Trash2, Pen, Eraser, Image, Upload, FileText, X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API = '/api/canvas';

/* ── Shared API helper ── */
async function canvasApi(action, method, token, body, query) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';
    let url = `${API}?action=${action}`;
    if (query) for (const [k, v] of Object.entries(query)) url += `&${k}=${encodeURIComponent(v)}`;
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

/* ── Colors ── */
const C = {
    bg: '#0a0e17', panel: '#0e1420', card: '#111827',
    border: '#1e293b', borderLight: '#253047',
    text: '#e2e8f0', textDim: '#94a3b8', textMuted: '#64748b',
    accent: '#2dd4bf', accentDim: 'rgba(45,212,191,0.18)',
    danger: '#ef4444', dangerDim: 'rgba(239,68,68,0.12)',
    gold: '#fbbf24', goldDim: 'rgba(251,191,36,0.18)',
    blue: '#60a5fa', blueDim: 'rgba(59,130,246,0.18)',
};

/* ── Tab buttons ── */
function TabBar({ active, onChange }) {
    const tabs = [
        { id: 'draw', label: 'Draw', icon: Pen },
        { id: 'prompts', label: 'Memory', icon: FileText },
        { id: 'dataset', label: 'Dataset', icon: Image },
    ];
    return (
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            {tabs.map(t => {
                const Icon = t.icon;
                const isActive = active === t.id;
                return (
                    <button key={t.id} onClick={() => onChange(t.id)} style={{
                        flex: 1, padding: '10px 0', cursor: 'pointer',
                        background: 'transparent', border: 'none', borderBottom: isActive ? `2px solid ${C.accent}` : '2px solid transparent',
                        color: isActive ? C.accent : C.textMuted, fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
                    }}>
                        <Icon size={14} /> {t.label}
                    </button>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════════════
   DRAW TAB — Coret-coret canvas + save/load
   ══════════════════════════════════════════ */
function DrawTab({ token }) {
    const canvasRef = useRef(null);
    const [drawing, setDrawing] = useState(false);
    const [color, setColor] = useState('#2dd4bf');
    const [lineWidth, setLineWidth] = useState(3);
    const [tool, setTool] = useState('pen'); // pen | eraser
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const lastPos = useRef(null);

    const colors = ['#2dd4bf', '#60a5fa', '#a855f7', '#f472b6', '#fbbf24', '#ef4444', '#4ade80', '#e2e8f0'];

    // Load strokes on mount
    useEffect(() => {
        (async () => {
            if (!token) { setLoading(false); return; }
            try {
                const { ok, data } = await canvasApi('strokes', 'GET', token);
                if (ok && data.strokes && Array.isArray(data.strokes.paths)) {
                    const ctx = canvasRef.current?.getContext('2d');
                    if (!ctx) return;
                    for (const p of data.strokes.paths) {
                        if (p.eraser) { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = p.width || 10; }
                        else { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = p.color || '#2dd4bf'; ctx.lineWidth = p.width || 3; }
                        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                        if (p.points && p.points.length > 1) {
                            ctx.beginPath(); ctx.moveTo(p.points[0].x, p.points[0].y);
                            for (let i = 1; i < p.points.length; i++) ctx.lineTo(p.points[i].x, p.points[i].y);
                            ctx.stroke();
                        }
                    }
                    ctx.globalCompositeOperation = 'source-over';
                }
            } catch { } finally { setLoading(false); }
        })();
    }, [token]);

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const touch = e.touches?.[0];
        const clientX = touch ? touch.clientX : e.clientX;
        const clientY = touch ? touch.clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (e) => {
        e.preventDefault();
        setDrawing(true);
        const pos = getPos(e);
        lastPos.current = pos;
        const ctx = canvasRef.current.getContext('2d');
        if (tool === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = lineWidth * 3; }
        else { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = color; ctx.lineWidth = lineWidth; }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    };

    const moveDraw = (e) => {
        if (!drawing) return;
        e.preventDefault();
        const pos = getPos(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(pos.x, pos.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
        if (!currentPathRef.current) currentPathRef.current = [];
        currentPathRef.current.push(pos);
        lastPos.current = pos;
    };

    const endDraw = () => {
        if (!drawing) return;
        setDrawing(false);
        const ctx = canvasRef.current.getContext('2d');
        ctx.globalCompositeOperation = 'source-over';
        // save path
        if (currentPathRef.current && currentPathRef.current.length > 0) {
            pathsRef.current.push({
                color, width: tool === 'eraser' ? lineWidth * 3 : lineWidth,
                eraser: tool === 'eraser',
                points: [lastStartRef.current, ...currentPathRef.current],
            });
        }
        currentPathRef.current = null;
    };

    const pathsRef = useRef([]);
    const currentPathRef = useRef(null);
    const lastStartRef = useRef(null);

    // patch startDraw to record start pos
    const origStartDraw = startDraw;
    const patchedStartDraw = (e) => {
        origStartDraw(e);
        lastStartRef.current = getPos(e);
        currentPathRef.current = [];
    };

    const clearCanvas = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) { ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }
        pathsRef.current = [];
    };

    const saveStrokes = async () => {
        if (!token || saving) return;
        setSaving(true);
        try {
            await canvasApi('strokes', 'POST', token, { data: { paths: pathsRef.current } });
        } catch { }
        setSaving(false);
    };

    const deleteStrokes = async () => {
        if (!token) return;
        await canvasApi('strokes', 'DELETE', token);
        clearCanvas();
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: C.panel, borderBottom: `1px solid ${C.border}`, flexShrink: 0, flexWrap: 'wrap' }}>
                <button onClick={() => setTool('pen')} style={{ ...toolBtnStyle, backgroundColor: tool === 'pen' ? C.accentDim : 'transparent', border: `1px solid ${tool === 'pen' ? C.accent : C.border}` }}>
                    <Pen size={14} color={tool === 'pen' ? C.accent : C.textMuted} />
                </button>
                <button onClick={() => setTool('eraser')} style={{ ...toolBtnStyle, backgroundColor: tool === 'eraser' ? C.dangerDim : 'transparent', border: `1px solid ${tool === 'eraser' ? C.danger : C.border}` }}>
                    <Eraser size={14} color={tool === 'eraser' ? C.danger : C.textMuted} />
                </button>
                <div style={{ width: 1, height: 20, backgroundColor: C.border }} />
                {colors.map(c => (
                    <button key={c} onClick={() => { setColor(c); setTool('pen'); }} style={{
                        width: 18, height: 18, borderRadius: '50%', border: color === c ? `2px solid ${C.text}` : `1px solid ${C.border}`,
                        backgroundColor: c, cursor: 'pointer', transition: 'border 0.2s',
                    }} />
                ))}
                <div style={{ width: 1, height: 20, backgroundColor: C.border }} />
                <input type="range" min={1} max={20} value={lineWidth} onChange={e => setLineWidth(+e.target.value)}
                    style={{ width: 60, accentColor: C.accent }} />
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: C.textMuted }}>{lineWidth}px</span>
                <div style={{ flex: 1 }} />
                <button onClick={saveStrokes} disabled={saving} style={actionBtnStyle}>
                    <Save size={13} /> {saving ? '...' : 'Save'}
                </button>
                <button onClick={deleteStrokes} style={{ ...actionBtnStyle, color: C.danger }}>
                    <Trash2 size={13} />
                </button>
            </div>
            {/* Canvas */}
            <div style={{ flex: 1, position: 'relative', backgroundColor: '#05080f', overflow: 'hidden' }}>
                {loading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontFamily: 'Inter,sans-serif', fontSize: 13 }}>Loading...</div>}
                <canvas ref={canvasRef} width={800} height={500}
                    style={{ width: '100%', height: '100%', display: 'block', cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
                    onMouseDown={patchedStartDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
                    onTouchStart={patchedStartDraw} onTouchMove={moveDraw} onTouchEnd={endDraw}
                />
            </div>
        </div>
    );
}

const toolBtnStyle = { padding: 4, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' };
const actionBtnStyle = { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, cursor: 'pointer', backgroundColor: C.card, border: `1px solid ${C.borderLight}`, color: C.textDim, fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, transition: 'all 0.2s' };

/* ══════════════════════════════════════════
   PROMPTS TAB — 3 memory slot
   ══════════════════════════════════════════ */
function PromptsTab({ token }) {
    const [slots, setSlots] = useState([{ slot: 0, filled: false, title: null, content: '' }, { slot: 1, filled: false, title: null, content: '' }, { slot: 2, filled: false, title: null, content: '' }]);
    const [activeSlot, setActiveSlot] = useState(0);
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            if (!token) return;
            const { ok, data } = await canvasApi('prompts', 'GET', token);
            if (ok && data.slots) {
                setSlots(data.slots.map(s => ({ ...s, content: s.content || '' })));
            }
            setLoaded(true);
        })();
    }, [token]);

    const current = slots[activeSlot] || slots[0];

    const saveSlot = async () => {
        if (!token || saving || !current.content.trim()) return;
        setSaving(true);
        await canvasApi('prompts', 'POST', token, { slot: activeSlot, title: current.title || `Slot ${activeSlot + 1}`, content: current.content });
        const { ok, data } = await canvasApi('prompts', 'GET', token);
        if (ok && data.slots) setSlots(data.slots.map(s => ({ ...s, content: s.content || '' })));
        setSaving(false);
    };

    const deleteSlot = async () => {
        if (!token) return;
        await canvasApi('prompts', 'DELETE', token, null, { slot: activeSlot });
        setSlots(prev => prev.map((s, i) => i === activeSlot ? { ...s, filled: false, title: null, content: '' } : s));
    };

    const updateCurrent = (field, val) => {
        setSlots(prev => prev.map((s, i) => i === activeSlot ? { ...s, [field]: val } : s));
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: 16, overflowY: 'auto' }}>
            {/* Slot selector */}
            <div style={{ display: 'flex', gap: 8 }}>
                {[0, 1, 2].map(i => (
                    <button key={i} onClick={() => setActiveSlot(i)} style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                        backgroundColor: activeSlot === i ? C.accentDim : C.card,
                        border: `1px solid ${activeSlot === i ? C.accent : C.borderLight}`,
                        color: activeSlot === i ? C.accent : C.textDim,
                        fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                        {slots[i]?.filled && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: C.accent }} />}
                        Slot {i + 1}
                    </button>
                ))}
            </div>

            {/* Title */}
            <input value={current.title || ''} onChange={e => updateCurrent('title', e.target.value)} placeholder={`Slot ${activeSlot + 1}`}
                style={{ padding: '8px 12px', borderRadius: 8, backgroundColor: C.card, border: `1px solid ${C.borderLight}`, color: C.text, fontFamily: 'Inter,sans-serif', fontSize: 13, outline: 'none' }} />

            {/* Content */}
            <textarea value={current.content} onChange={e => updateCurrent('content', e.target.value)} placeholder="Tulis prompt / memory / catatan di sini..."
                style={{ flex: 1, minHeight: 200, padding: '10px 12px', borderRadius: 8, backgroundColor: C.card, border: `1px solid ${C.borderLight}`, color: C.text, fontFamily: 'Inter,sans-serif', fontSize: 13, lineHeight: 1.6, outline: 'none', resize: 'vertical' }} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveSlot} disabled={saving || !current.content.trim()} style={{
                    flex: 1, padding: 8, borderRadius: 8, cursor: 'pointer',
                    backgroundColor: C.accentDim, border: `1px solid ${C.accent}`, color: C.accent,
                    fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                    <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
                {current.filled && (
                    <button onClick={deleteSlot} style={{
                        padding: 8, borderRadius: 8, cursor: 'pointer',
                        backgroundColor: C.dangerDim, border: `1px solid ${C.danger}`, color: C.danger,
                        fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                        <Trash2 size={14} /> Delete
                    </button>
                )}
            </div>

            {!loaded && <div style={{ color: C.textMuted, fontFamily: 'Inter,sans-serif', fontSize: 12, textAlign: 'center' }}>Loading slots...</div>}
        </div>
    );
}

/* ══════════════════════════════════════════
   DATASET TAB — Upload & manage images
   ══════════════════════════════════════════ */
function DatasetTab({ token }) {
    const [images, setImages] = useState([]);
    const [status, setStatus] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [previewId, setPreviewId] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [confirmClear, setConfirmClear] = useState(false);
    const fileRef = useRef(null);

    const refresh = useCallback(async () => {
        if (!token) return;
        const [listRes, statusRes] = await Promise.all([
            canvasApi('dataset_list', 'GET', token),
            canvasApi('dataset_status', 'GET', token),
        ]);
        if (listRes.ok) setImages(listRes.data.images || []);
        if (statusRes.ok) setStatus(statusRes.data);
    }, [token]);

    useEffect(() => { refresh(); }, [refresh]);

    const uploadFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !token || uploading) return;
        setUploading(true);
        try {
            const b64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
            await canvasApi('dataset_upload', 'POST', token, { filename: file.name, data_base64: b64, mime_type: file.type });
            await refresh();
        } catch { }
        setUploading(false);
        if (fileRef.current) fileRef.current.value = '';
    };

    const deleteImage = async (id) => {
        if (!token) return;
        await canvasApi('dataset_delete', 'DELETE', token, null, { id });
        await refresh();
        if (previewId === id) { setPreviewId(null); setPreviewUrl(null); }
    };

    const clearAll = async () => {
        if (!token) return;
        await canvasApi('dataset_clear', 'DELETE', token);
        setConfirmClear(false);
        await refresh();
        setPreviewId(null); setPreviewUrl(null);
    };

    const viewImage = async (id) => {
        if (previewId === id) { setPreviewId(null); setPreviewUrl(null); return; }
        const { ok, data } = await canvasApi('dataset_image', 'GET', token, null, { id });
        if (ok && data.data_url) { setPreviewId(id); setPreviewUrl(data.data_url); }
    };

    const fmtSize = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: 16, overflowY: 'auto' }}>
            {/* Status bar */}
            {status && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.textDim }}>
                        {status.total}/{status.max} images
                    </span>
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: C.accent }}>{status.processed} processed</span>
                    {status.pending > 0 && <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: C.gold }}>{status.pending} pending</span>}
                    {status.failed > 0 && <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: C.danger }}>{status.failed} failed</span>}
                </div>
            )}

            {/* Upload */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input ref={fileRef} type="file" accept="image/*" onChange={uploadFile} style={{ display: 'none' }} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading || (status && status.remaining <= 0)} style={{
                    padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                    backgroundColor: C.accentDim, border: `1px solid ${C.accent}`, color: C.accent,
                    fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
                {images.length > 0 && (
                    <button onClick={() => setConfirmClear(true)} style={{
                        padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                        backgroundColor: C.dangerDim, border: `1px solid ${C.danger}`, color: C.danger,
                        fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <Trash2 size={12} /> Clear All
                    </button>
                )}
            </div>

            {/* Confirm clear */}
            {confirmClear && (
                <div style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: '#1a1000', border: '1px solid #92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={14} color="#f59e0b" />
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#fbbf24', flex: 1 }}>Yakin ingin menghapus semua image?</span>
                    <button onClick={clearAll} style={{ padding: '4px 10px', borderRadius: 6, backgroundColor: '#92400e', border: '1px solid #b45309', color: '#fef3c7', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600 }}>Ya</button>
                    <button onClick={() => setConfirmClear(false)} style={{ padding: '4px 10px', borderRadius: 6, backgroundColor: C.card, border: `1px solid ${C.borderLight}`, color: C.textDim, cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600 }}>Batal</button>
                </div>
            )}

            {/* Image grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                {images.map(img => (
                    <div key={img.id} style={{ borderRadius: 8, backgroundColor: C.card, border: `1px solid ${C.borderLight}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div onClick={() => viewImage(img.id)} style={{ height: 80, backgroundColor: '#05080f', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            {previewId === img.id && previewUrl ? (
                                <img src={previewUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : (
                                <Image size={20} color={C.textMuted} />
                            )}
                        </div>
                        <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.filename}</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 9, color: img.status === 'done' ? C.accent : img.status === 'failed' ? C.danger : C.gold }}>{img.status}</span>
                                <button onClick={() => deleteImage(img.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: C.textMuted, display: 'flex' }}>
                                    <X size={11} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {images.length === 0 && !status && (
                <div style={{ color: C.textMuted, fontFamily: 'Inter,sans-serif', fontSize: 12, textAlign: 'center', padding: 24 }}>Loading...</div>
            )}
            {images.length === 0 && status && (
                <div style={{ color: C.textMuted, fontFamily: 'Inter,sans-serif', fontSize: 12, textAlign: 'center', padding: 24 }}>Belum ada image. Upload gambar untuk mulai!</div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════
   MAIN CanvasPage
   ══════════════════════════════════════════ */
export default function CanvasPage({ setPage }) {
    const { user, getIdToken } = useAuth();
    const [tab, setTab] = useState('draw');
    const [token, setToken] = useState(null);

    useEffect(() => {
        if (user) getIdToken().then(setToken);
        else setToken(null);
    }, [user, getIdToken]);

    return (
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: C.panel, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => setPage('menu')} style={{ background: 'transparent', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 4, display: 'flex' }}>
                        <ArrowLeft size={18} />
                    </button>
                    <h1 style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 16, color: C.accent, margin: 0, letterSpacing: 0.5 }}>CANVAS</h1>
                </div>
                {user && (
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: C.textMuted }}>
                        {user.displayName || user.email?.split('@')[0]}
                    </span>
                )}
            </div>

            {/* Tabs */}
            <TabBar active={tab} onChange={setTab} />

            {/* Content */}
            {tab === 'draw' && <DrawTab token={token} />}
            {tab === 'prompts' && <PromptsTab token={token} />}
            {tab === 'dataset' && <DatasetTab token={token} />}
        </div>
    );
}
