import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Trash2, Pen, Eraser, Image, Upload, FileText, X, Check, AlertTriangle, Download, Undo2, Redo2, Lock, Unlock, ArrowRightLeft, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ColorWheelPicker from '../components/ColorWheelPicker';

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
    const containerRef = useRef(null);
    const [drawing, setDrawing] = useState(false);
    const [color, setColor] = useState('#2dd4bf');
    const [lineWidth, setLineWidth] = useState(3);
    const [tool, setTool] = useState('pen'); // pen | eraser
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [customColorPicker, setCustomColorPicker] = useState(null);  // { hex, originalHex } or null
    const lastPos = useRef(null);

    // ── Undo / Redo ──
    const [history, setHistory] = useState([]);   // array of path snapshots
    const [historyIdx, setHistoryIdx] = useState(-1); // current position in history
    const historyRef = useRef([]);
    const historyIdxRef = useRef(-1);
    const canUndo = historyIdx > 0;
    const canRedo = historyIdx < history.length - 1;

    // Sync refs with state
    useEffect(() => { historyRef.current = history; }, [history]);
    useEffect(() => { historyIdxRef.current = historyIdx; }, [historyIdx]);

    // Push a new snapshot into history (called after each stroke)
    const pushHistory = (paths) => {
        const snap = JSON.parse(JSON.stringify(paths));
        const idx = historyIdxRef.current;
        const h = historyRef.current.slice(0, idx + 1);
        h.push(snap);
        // Limit history to 50 entries
        if (h.length > 50) h.shift();
        setHistory(h);
        setHistoryIdx(h.length - 1);
    };

    const undo = () => {
        if (!canUndo) return;
        const newIdx = historyIdx - 1;
        const paths = history[newIdx];
        pathsRef.current = JSON.parse(JSON.stringify(paths));
        setHistoryIdx(newIdx);
        replayCanvas(pathsRef.current);
    };

    const redo = () => {
        if (!canRedo) return;
        const newIdx = historyIdx + 1;
        const paths = history[newIdx];
        pathsRef.current = JSON.parse(JSON.stringify(paths));
        setHistoryIdx(newIdx);
        replayCanvas(pathsRef.current);
    };

    // Replay all paths onto canvas from scratch
    const replayCanvas = (paths) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const p of paths) {
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
    };

    // Resize canvas to match container — keeps drawing coords 1:1
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            if (canvas.width !== w || canvas.height !== h) {
                // Save current image, resize, then restore
                const ctx = canvas.getContext('2d');
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                canvas.width = w;
                canvas.height = h;
                ctx.putImageData(imgData, 0, 0);
            }
        };
        resize();
        const ro = new ResizeObserver(resize);
        if (containerRef.current) ro.observe(containerRef.current);
        window.addEventListener('resize', resize);
        return () => { ro.disconnect(); window.removeEventListener('resize', resize); };
    }, []);

    const colors = ['#2dd4bf', '#60a5fa', '#a855f7', '#f472b6', '#fbbf24', '#ef4444', '#4ade80', '#e2e8f0'];

    // ── Auto-save: localStorage key ──
    const AUTO_SAVE_KEY = 'babft_canvas_autosave';

    // Save paths to localStorage (instant, always works)
    const saveToLocal = (paths) => {
        try {
            localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({ paths, ts: Date.now() }));
        } catch { }
    };

    // Load paths from localStorage
    const loadFromLocal = () => {
        try {
            const raw = localStorage.getItem(AUTO_SAVE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed.paths) ? parsed.paths : null;
        } catch { return null; }
    };

    // Save to API (cloud) — best effort, non-blocking
    const saveToCloud = async () => {
        if (!token) return;
        try {
            await canvasApi('strokes', 'POST', token, { data: { paths: pathsRef.current } });
        } catch { }
    };

    // The master auto-save function — saves everywhere
    const autoSave = () => {
        const paths = pathsRef.current;
        if (!paths || paths.length === 0) return;
        saveToLocal(paths);
        saveToCloud();
    };

    // Load strokes on mount — try localStorage first (instant), then API (cloud)
    useEffect(() => {
        (async () => {
            // Always push empty canvas as history[0] so undo can go back to blank
            pushHistory([]);

            // 1) Try localStorage first for instant restore
            const localPaths = loadFromLocal();
            if (localPaths && localPaths.length > 0) {
                pathsRef.current = localPaths;
                pushHistory(localPaths);
                replayCanvas(localPaths);
                setLoading(false);
                // Still sync from cloud in background
                if (token) {
                    try {
                        const { ok, data } = await canvasApi('strokes', 'GET', token);
                        if (ok && data.strokes && Array.isArray(data.strokes.paths) && data.strokes.paths.length > 0) {
                            // Cloud has newer data? Use cloud if more strokes
                            if (data.strokes.paths.length > localPaths.length) {
                                pathsRef.current = data.strokes.paths;
                                pushHistory(data.strokes.paths);
                                replayCanvas(data.strokes.paths);
                            }
                        }
                    } catch { }
                }
                return;
            }
            // 2) No localStorage — load from cloud
            if (!token) { setLoading(false); return; }
            try {
                const { ok, data } = await canvasApi('strokes', 'GET', token);
                if (ok && data.strokes && Array.isArray(data.strokes.paths) && data.strokes.paths.length > 0) {
                    pathsRef.current = data.strokes.paths;
                    pushHistory(data.strokes.paths);
                    replayCanvas(data.strokes.paths);
                }
            } catch { } finally { setLoading(false); }
        })();
    }, [token]);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches?.[0];
        const clientX = touch ? touch.clientX : e.clientX;
        const clientY = touch ? touch.clientY : e.clientY;
        // Scale: CSS display size vs canvas internal pixel size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
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
        // Push to undo history after each stroke
        pushHistory(pathsRef.current);
        // Auto-save to localStorage after every stroke
        saveToLocal(pathsRef.current);
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
        setHistory([]);
        setHistoryIdx(-1);
        try { localStorage.removeItem(AUTO_SAVE_KEY); } catch { }
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

    // ── Auto-save on ANY leave event ──
    // This is the MUTLAK system — saves on every possible way user can leave
    useEffect(() => {
        // visibilitychange: user switches tab, minimizes browser, locks screen
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') autoSave();
        };
        // beforeunload: user closes tab, refreshes, navigates away
        const onBeforeUnload = () => { autoSave(); };
        // pagehide: back-forward cache, mobile swipe-back
        const onPageHide = () => { autoSave(); };
        // freeze: page is frozen by browser (Chrome)
        const onFreeze = () => { autoSave(); };
        // blur on window: user clicks outside browser, alt-tab, etc
        const onBlur = () => { autoSave(); };
        // mouseleave on document: mouse leaves the page entirely
        const onMouseLeave = () => { autoSave(); };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('beforeunload', onBeforeUnload);
        window.addEventListener('pagehide', onPageHide);
        window.addEventListener('freeze', onFreeze);
        window.addEventListener('blur', onBlur);
        document.addEventListener('mouseleave', onMouseLeave);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('beforeunload', onBeforeUnload);
            window.removeEventListener('pagehide', onPageHide);
            window.removeEventListener('freeze', onFreeze);
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('mouseleave', onMouseLeave);
        };
    }, [token]);

    const downloadPng = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `canvas-${Date.now()}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Failed to export PNG:', err);
        }
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
                <button onClick={undo} disabled={!canUndo} style={{ ...toolBtnStyle, opacity: canUndo ? 1 : 0.35, cursor: canUndo ? 'pointer' : 'not-allowed' }}>
                    <Undo2 size={14} color={canUndo ? C.blue : C.textMuted} />
                </button>
                <button onClick={redo} disabled={!canRedo} style={{ ...toolBtnStyle, opacity: canRedo ? 1 : 0.35, cursor: canRedo ? 'pointer' : 'not-allowed' }}>
                    <Redo2 size={14} color={canRedo ? C.blue : C.textMuted} />
                </button>
                <div style={{ width: 1, height: 20, backgroundColor: C.border }} />
                {colors.map(c => (
                    <button key={c} onClick={() => { setColor(c); setTool('pen'); }} style={{
                        width: 18, height: 18, borderRadius: '50%', border: color === c ? `2px solid ${C.text}` : `1px solid ${C.border}`,
                        backgroundColor: c, cursor: 'pointer', transition: 'border 0.2s',
                    }} />
                ))}
                {/* Custom color picker button */}
                <button onClick={() => { setCustomColorPicker({ hex: color, originalHex: color }); }} style={{
                    width: 18, height: 18, borderRadius: '50%', border: `1px dashed ${C.border}`,
                    backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                }}>
                    <span style={{ fontSize: 12, color: C.textMuted, lineHeight: 1 }}>+</span>
                </button>
                <div style={{ width: 1, height: 20, backgroundColor: C.border }} />
                <input type="range" min={1} max={20} value={lineWidth} onChange={e => setLineWidth(+e.target.value)}
                    style={{ width: 60, accentColor: C.accent }} />
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: C.textMuted }}>{lineWidth}px</span>
                <div style={{ flex: 1 }} />
                <button onClick={downloadPng} style={actionBtnStyle}>
                    <Download size={13} /> Save as PNG
                </button>
                <button onClick={() => setConfirmDelete(true)} style={{ ...actionBtnStyle, color: C.danger }}>
                    <Trash2 size={13} />
                </button>
            </div>
            {/* Custom Color Picker with Confirm */}
            {customColorPicker && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                        padding: 8, borderRadius: 8, backgroundColor: 'rgba(15, 23, 42, 0.98)',
                        border: '1px solid #475569', display: 'flex', flexDirection: 'column', gap: 6,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', fontFamily: 'Inter,sans-serif', textAlign: 'center' }}>Custom Color</div>
                        <ColorWheelPicker
                            hex={customColorPicker.hex}
                            onChange={newHex => setCustomColorPicker(cp => cp ? { ...cp, hex: newHex } : cp)}
                            onPickColor={() => {
                                const saved = { ...customColorPicker };
                                setCustomColorPicker(null);
                                if (window.EyeDropper) {
                                    const dropper = new window.EyeDropper();
                                    dropper.open().then(result => {
                                        setCustomColorPicker({ ...saved, hex: result.sRGBHex });
                                    }).catch(() => {
                                        setCustomColorPicker(saved);
                                    });
                                } else {
                                    setCustomColorPicker(saved);
                                }
                            }}
                        />
                        {/* Buttons directly below */}
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { setColor(customColorPicker.hex); setTool('pen'); setCustomColorPicker(null); }} style={{
                                flex: 1, padding: '5px 8px', fontSize: 11, fontWeight: 700,
                                background: 'linear-gradient(135deg, #059669, #10b981)', border: '1px solid #34d399',
                                borderRadius: 4, color: '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                            }}>
                                <Check size={12} strokeWidth={2.5} /> Confirm
                            </button>
                            <button onClick={() => setCustomColorPicker(null)} style={{
                                flex: 1, padding: '5px 8px', fontSize: 11, fontWeight: 600,
                                background: '#1e293b', border: '1px solid #475569',
                                borderRadius: 4, color: '#94a3b8', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                            }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete confirmation */}
            {confirmDelete && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ padding: '16px 20px', borderRadius: 12, backgroundColor: C.panel, border: `1px solid #92400e`, maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                        <AlertTriangle size={24} color="#f59e0b" />
                        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600, color: '#fbbf24', textAlign: 'center' }}>Apakah kamu yakin ingin menghapus canvas?</span>
                        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                            <button onClick={async () => { await deleteStrokes(); setConfirmDelete(false); }} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', backgroundColor: '#92400e', border: '1px solid #b45309', color: '#fef3c7', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600 }}>Ya, Hapus</button>
                            <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', backgroundColor: C.card, border: `1px solid ${C.borderLight}`, color: C.textDim, fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600 }}>Batal</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Canvas */}
            <div ref={containerRef} style={{ flex: 1, position: 'relative', backgroundColor: '#05080f', overflow: 'hidden' }}>
                {loading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontFamily: 'Inter,sans-serif', fontSize: 13 }}>Loading...</div>}
                <canvas ref={canvasRef}
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
   PROMPTS TAB — 3 memory slot + lock + history
   ══════════════════════════════════════════ */

/* ── Lock state helpers (localStorage) ── */
const LOCK_STORAGE_KEY = 'canvas_slot_locks';
function getStoredLocks() {
    try { return JSON.parse(localStorage.getItem(LOCK_STORAGE_KEY)) || [false, false, false]; }
    catch { return [false, false, false]; }
}
function setStoredLocks(locks) {
    try { localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(locks)); } catch {}
}

/* ── Generic Dialog Overlay ── */
function DialogOverlay({ children, onClose }) {
    return (
        <div className="animate-overlay-fade-in" onClick={onClose} style={{
            position: 'absolute', inset: 0, zIndex: 50,
            backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
        }}>
            <div className="animate-dialog-pop-in" onClick={e => e.stopPropagation()} style={{
                backgroundColor: C.panel, borderRadius: 12,
                border: `1px solid ${C.border}`, padding: '20px 24px',
                display: 'flex', flexDirection: 'column', gap: 14,
                maxWidth: 340, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
                {children}
            </div>
        </div>
    );
}

function PromptsTab({ token }) {
    const [slots, setSlots] = useState([{ slot: 0, filled: false, title: null, content: '' }, { slot: 1, filled: false, title: null, content: '' }, { slot: 2, filled: false, title: null, content: '' }]);
    const [activeSlot, setActiveSlot] = useState(0);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    /* ── Lock state ── */
    const [slotLocks, setSlotLocks] = useState(getStoredLocks);
    const [lockAnim, setLockAnim] = useState(null);       // 'opening' | 'closing' | null
    const [lockConfirm, setLockConfirm] = useState(null);  // 'lock' | 'unlock' | null
    const [lockWarning, setLockWarning] = useState(false);  // "buka kunci" warning

    /* ── History state ── */
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyEmptyWarning, setHistoryEmptyWarning] = useState(null); // index number or null

    /* ── Load slots from backend ── */
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
    const isLocked = slotLocks[activeSlot] || false;

    /* ── Toggle lock ── */
    const requestToggleLock = () => {
        if (isLocked) {
            setLockConfirm('unlock');
        } else {
            setLockConfirm('lock');
        }
    };

    const confirmToggleLock = (proceed) => {
        if (!proceed) { setLockConfirm(null); return; }
        const newLocks = [...slotLocks];
        const willLock = !isLocked;
        newLocks[activeSlot] = willLock;
        setSlotLocks(newLocks);
        setStoredLocks(newLocks);
        setLockConfirm(null);
        // Trigger animation
        setLockAnim(willLock ? 'closing' : 'opening');
        setTimeout(() => setLockAnim(null), 450);
    };

    /* ── Show lock warning ── */
    const showLockWarning = () => setLockWarning(true);

    /* ── Save slot ── */
    const saveSlot = async () => {
        if (isLocked) { showLockWarning(); return; }
        if (!token || saving || !current.content.trim()) return;
        setSaving(true);
        await canvasApi('prompts', 'POST', token, { slot: activeSlot, title: current.title || `Slot ${activeSlot + 1}`, content: current.content });
        const { ok, data } = await canvasApi('prompts', 'GET', token);
        if (ok && data.slots) setSlots(data.slots.map(s => ({ ...s, content: s.content || '' })));
        setSaving(false);
    };

    /* ── Load slot ── */
    const loadSlot = async () => {
        if (isLocked) { showLockWarning(); return; }
        if (!token || loading) return;
        setLoading(true);
        const { ok, data } = await canvasApi('prompts', 'GET', token, null, { slot: activeSlot });
        if (ok && data.content) {
            setSlots(prev => prev.map((s, i) => i === activeSlot ? { ...s, filled: true, title: data.title, content: data.content } : s));
        }
        setLoading(false);
    };

    /* ── Delete slot ── */
    const deleteSlot = async () => {
        if (!token) return;
        await canvasApi('prompts', 'DELETE', token, null, { slot: activeSlot });
        setSlots(prev => prev.map((s, i) => i === activeSlot ? { ...s, filled: false, title: null, content: '' } : s));
    };

    /* ── Update current slot fields ── */
    const updateCurrent = (field, val) => {
        // Editing title/content is allowed even when locked — no warning
        setSlots(prev => prev.map((s, i) => i === activeSlot ? { ...s, [field]: val } : s));
    };

    /* ── Open history panel ── */
    const openHistory = async () => {
        if (isLocked) { showLockWarning(); return; }
        setHistoryOpen(true);
        setHistoryLoading(true);
        const { ok, data } = await canvasApi('prompts_history', 'GET', token, null, { slot: activeSlot });
        if (ok) setHistoryData(data.history || []);
        setHistoryLoading(false);
    };

    /* ── Load from history ── */
    const loadFromHistory = async (idx) => {
        if (!historyData[idx] || !historyData[idx].content) {
            setHistoryEmptyWarning(idx);
            return;
        }
        const { ok, data } = await canvasApi('prompts_history_load', 'POST', token, { slot: activeSlot, historyIndex: idx });
        if (ok && data.content) {
            setSlots(prev => prev.map((s, i) => i === activeSlot ? { ...s, filled: true, title: data.title, content: data.content } : s));
            setHistoryOpen(false);
        }
    };

    /* ── Lock icon animation class ── */
    const lockAnimClass = lockAnim === 'opening' ? 'animate-lock-open' : lockAnim === 'closing' ? 'animate-lock-close' : '';

    /* ── Format timestamp ── */
    const fmtTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: 16, overflowY: 'auto', position: 'relative' }}>
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
                        {slotLocks[i] && <Lock size={10} style={{ opacity: 0.7 }} />}
                    </button>
                ))}
            </div>

            {/* Title */}
            <input value={current.title || ''} onChange={e => updateCurrent('title', e.target.value)} placeholder={`Slot ${activeSlot + 1}`}
                style={{ padding: '8px 12px', borderRadius: 8, backgroundColor: C.card, border: `1px solid ${C.borderLight}`, color: C.text, fontFamily: 'Inter,sans-serif', fontSize: 13, outline: 'none' }} />

            {/* Content */}
            <textarea value={current.content} onChange={e => updateCurrent('content', e.target.value)} placeholder="Tulis prompt / memory / catatan di sini..."
                style={{ flex: 1, minHeight: 200, padding: '10px 12px', borderRadius: 8, backgroundColor: C.card, border: `1px solid ${C.borderLight}`, color: C.text, fontFamily: 'Inter,sans-serif', fontSize: 13, lineHeight: 1.6, outline: 'none', resize: 'vertical' }} />

            {/* ── Action row: Lock | History | Save | Load | Delete ── */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Lock button */}
                <button
                    onClick={requestToggleLock}
                    className={lockAnimClass}
                    title={isLocked ? 'Buka kunci slot' : 'Kunci slot'}
                    style={{
                        padding: 8, borderRadius: 8, cursor: 'pointer',
                        backgroundColor: isLocked ? C.goldDim : C.card,
                        border: `1px solid ${isLocked ? C.gold : C.borderLight}`,
                        color: isLocked ? C.gold : C.textDim,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                >
                    {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
                </button>

                {/* History button (double arrows) */}
                <button
                    onClick={openHistory}
                    title="Load Save Sebelumnya"
                    style={{
                        padding: 8, borderRadius: 8, cursor: 'pointer',
                        backgroundColor: C.blueDim,
                        border: `1px solid ${C.blue}`,
                        color: C.blue,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                >
                    <ArrowRightLeft size={15} />
                </button>

                {/* Save button */}
                <button onClick={saveSlot} disabled={saving || !current.content.trim()} style={{
                    flex: 1, padding: 8, borderRadius: 8, cursor: 'pointer',
                    backgroundColor: C.accentDim, border: `1px solid ${C.accent}`, color: C.accent,
                    fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                    <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>

                {/* Load button */}
                <button onClick={loadSlot} disabled={loading || !current.filled} style={{
                    padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                    backgroundColor: C.goldDim, border: `1px solid ${C.gold}`, color: C.gold,
                    fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                    <RotateCcw size={14} /> {loading ? 'Loading...' : 'Load'}
                </button>

                {/* Delete button */}
                {current.filled && (
                    <button onClick={deleteSlot} style={{
                        padding: 8, borderRadius: 8, cursor: 'pointer',
                        backgroundColor: C.dangerDim, border: `1px solid ${C.danger}`, color: C.danger,
                        fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            {/* Locked slot indicator bar */}
            {isLocked && (
                <div style={{
                    padding: '6px 12px', borderRadius: 8,
                    backgroundColor: C.goldDim, border: `1px solid rgba(251,191,36,0.3)`,
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: 'Inter,sans-serif', fontSize: 11, color: C.gold,
                }}>
                    <Lock size={12} /> Slot ini terkunci — Save, Load, dan History dinonaktifkan
                </div>
            )}

            {!loaded && <div style={{ color: C.textMuted, fontFamily: 'Inter,sans-serif', fontSize: 12, textAlign: 'center' }}>Loading slots...</div>}

            {/* ══════════ LOCK CONFIRMATION DIALOG ══════════ */}
            {lockConfirm && (
                <DialogOverlay onClose={() => setLockConfirm(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: C.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {lockConfirm === 'lock' ? <Lock size={22} color={C.gold} /> : <Unlock size={22} color={C.gold} />}
                        </div>
                        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600, color: C.text, textAlign: 'center' }}>
                            {lockConfirm === 'lock'
                                ? 'Apakah anda ingin mengunci slot ini?'
                                : 'Apakah anda ingin membuka kunci slot ini?'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button onClick={() => confirmToggleLock(true)} style={{
                            padding: '8px 24px', borderRadius: 8, cursor: 'pointer',
                            backgroundColor: C.goldDim, border: `1px solid ${C.gold}`, color: C.gold,
                            fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600,
                        }}>Ya</button>
                        <button onClick={() => confirmToggleLock(false)} style={{
                            padding: '8px 24px', borderRadius: 8, cursor: 'pointer',
                            backgroundColor: C.card, border: `1px solid ${C.borderLight}`, color: C.textDim,
                            fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600,
                        }}>Tidak</button>
                    </div>
                </DialogOverlay>
            )}

            {/* ══════════ LOCK WARNING DIALOG ══════════ */}
            {lockWarning && (
                <DialogOverlay onClose={() => setLockWarning(false)}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: C.dangerDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Lock size={22} color={C.danger} />
                        </div>
                        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600, color: C.text, textAlign: 'center' }}>
                            Mohon buka kunci slot ini terlebih dahulu!
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button onClick={() => setLockWarning(false)} style={{
                            padding: '8px 32px', borderRadius: 8, cursor: 'pointer',
                            backgroundColor: C.dangerDim, border: `1px solid ${C.danger}`, color: C.danger,
                            fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600,
                        }}>Oke</button>
                    </div>
                </DialogOverlay>
            )}

            {/* ══════════ HISTORY PANEL OVERLAY ══════════ */}
            {historyOpen && (
                <div className="animate-overlay-fade-in" onClick={() => setHistoryOpen(false)} style={{
                    position: 'absolute', inset: 0, zIndex: 40,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    display: 'flex', justifyContent: 'flex-end',
                }}>
                    <div className="animate-panel-slide-in" onClick={e => e.stopPropagation()} style={{
                        width: '50%', minWidth: 240, height: '100%',
                        backgroundColor: C.panel, borderLeft: `1px solid ${C.border}`,
                        padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
                        overflowY: 'auto',
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 13, color: C.blue, letterSpacing: 0.5 }}>
                                SAVE SEBELUMNYA
                            </span>
                            <button onClick={() => setHistoryOpen(false)} style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                color: C.textMuted, display: 'flex', padding: 4,
                            }}>
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: C.textMuted }}>
                            Slot {activeSlot + 1} — 10 save terakhir
                        </div>

                        {/* History buttons */}
                        {historyLoading ? (
                            <div style={{ color: C.textMuted, fontFamily: 'Inter,sans-serif', fontSize: 12, textAlign: 'center', padding: 24 }}>
                                Memuat history...
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {Array.from({ length: 10 }, (_, i) => {
                                    const entry = historyData[i];
                                    const hasData = entry && entry.content;
                                    return (
                                        <button key={i} onClick={() => loadFromHistory(i)} style={{
                                            padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                                            backgroundColor: hasData ? C.card : 'rgba(17,24,39,0.5)',
                                            border: `1px solid ${hasData ? C.borderLight : 'rgba(37,48,71,0.4)'}`,
                                            color: hasData ? C.text : C.textMuted,
                                            fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600,
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            transition: 'all 0.2s', textAlign: 'left',
                                            opacity: hasData ? 1 : 0.5,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, overflow: 'hidden' }}>
                                                <RotateCcw size={13} style={{ flexShrink: 0, opacity: hasData ? 1 : 0.4 }} />
                                                <div style={{ overflow: 'hidden' }}>
                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        Load Save Sebelumnya [{i + 1}]
                                                    </div>
                                                    {hasData && entry.title && (
                                                        <div style={{ fontSize: 10, color: C.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {entry.title}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {hasData && entry.pushed_at && (
                                                <span style={{ fontSize: 9, color: C.textMuted, flexShrink: 0, marginLeft: 8 }}>
                                                    {fmtTime(entry.pushed_at)}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════ HISTORY EMPTY WARNING ══════════ */}
            {historyEmptyWarning !== null && (
                <DialogOverlay onClose={() => setHistoryEmptyWarning(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: C.blueDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertTriangle size={22} color={C.blue} />
                        </div>
                        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600, color: C.text, textAlign: 'center' }}>
                            Belum ada save yang tertampung di tombol ini!
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button onClick={() => setHistoryEmptyWarning(null)} style={{
                            padding: '8px 32px', borderRadius: 8, cursor: 'pointer',
                            backgroundColor: C.blueDim, border: `1px solid ${C.blue}`, color: C.blue,
                            fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600,
                        }}>Ya</button>
                    </div>
                </DialogOverlay>
            )}
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
