import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { ArrowLeft, User, LogOut, RotateCcw } from 'lucide-react';
import MenuButton3D from './components/MenuButton3D';
import LoginModal from './components/LoginModal';
import NotFoundPage from './components/NotFoundPage';
import AIHelperButton from './components/AIHelperButton';
import CreditsBox from './components/CreditsBox';
import { useAuth } from './contexts/AuthContext';
import { trackVisit } from './lib/tracker';
import { useProgressSync } from './hooks/useProgressSync';

const ShapesPage = lazy(() => import('./pages/ShapesPage'));

// Daftar page yang dikenal oleh router state-based ini.
// Kalau `page` tidak ada di daftar ini, App.jsx merender <NotFoundPage /> (404).
const KNOWN_PAGES = new Set([
    'welcome',
    'marketplace',
    'canvas',
    'shapes',
    'shapes-calculator',
    'block-simulator-3d',
    'block-simulator-3d-v2',
    'menu',
    'logic-gates',
    'basic-logic-gates',
    'logic-gates-circuit',
    'circuit-generator',
    'gears',
    'linkages',
    'logic-gates-simulator',
]);
const ShapesCalculator = lazy(() => import('./pages/ShapesCalculator'));
const BlockSimulator3D = lazy(() => import('./pages/BlockSimulator3D'));
const BlockSimulator3Dv2 = lazy(() => import('./pages/BlockSimulator3Dv2'));
const BasicLogicGates = lazy(() => import('./pages/BasicLogicGates'));
const LogicGatesCircuit = lazy(() => import('./pages/LogicGatesCircuit'));
const CircuitGenerator = lazy(() => import('./pages/CircuitGenerator'));
const GearsPage = lazy(() => import('./pages/GearsPage'));
const LinkagesPage = lazy(() => import('./pages/LinkagesPage'));
const AIHelperPanel = lazy(() => import('./components/AIHelperPanel'));
const LogicGatesSimulator = lazy(() => import('./pages/LogicGatesSimulator'));
const CanvasPage = lazy(() => import('./pages/CanvasPage'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));

const pageFallback = (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0', color: '#475569', fontFamily: 'Inter,sans-serif', fontSize: 13 }}>
        Loading...
    </div>
);

export default function App() {
    const [page, setPage] = useState("welcome");
    const [showLogin, setShowLogin] = useState(false);
    const [progressLoaded, setProgressLoaded] = useState(false);
    const [helperOpen, setHelperOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatId, setChatId] = useState(null);
    const [guestAnnouncement, setGuestAnnouncement] = useState(false);
    const { user, loading: authLoading, logout } = useAuth();
    const { loadProgress, resetProgress } = useProgressSync(page);

    // Load saved progress when user logs in
    useEffect(() => {
        if (user && !progressLoaded) {
            loadProgress().then(data => {
                if (data && data.current_page && data.current_page !== 'welcome') {
                    setPage(data.current_page);
                    toast.success('Progress dipulihkan — melanjutkan dari sesi terakhir');
                }
                setProgressLoaded(true);
            });
        }
        if (!user) {
            setProgressLoaded(false);
        }
    }, [user, progressLoaded, loadProgress]);

    // Catat kunjungan halaman setiap kali user (sudah login) berpindah halaman,
    // supaya timeline/history di panel terus bertambah tanpa harus reload browser.
    useEffect(() => {
        if (!user) return;
        if (typeof page !== 'string' || !page) return;
        // jangan double-track halaman awal saat pertama kali login-restore
        trackVisit(user, page);
    }, [page, user]);

    const handleLogout = async () => {
        await logout();
        setPage('welcome');
    };

    const handleResetProgress = async () => {
        await resetProgress();
        toast.success('Progress direset');
    };

    const variants = {
        hidden: { opacity: 0, y: 12, scale: .98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: .4, ease: "easeOut" } },
        exit: { opacity: 0, y: -10, scale: .98, transition: { duration: .28, ease: "easeIn" } }
    };
    const goToCircuit = () => setPage("logic-gates-circuit");
    const bg = "#181b24", panel = "#0e1420";

    const showGuestAnnouncement = useCallback(() => {
        setGuestAnnouncement(true);
        setTimeout(() => setGuestAnnouncement(false), 3000);
    }, []);
    // User bar — tampil di pojok kanan atas semua halaman
    const userBar = (
        <div style={{ position: 'fixed', top: 12, right: 16, zIndex: 100, display: 'flex', alignItems: 'center', gap: 8 }}>
            {authLoading ? (
                <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#1e293b', animation: 'pulse 1.5s infinite' }} />
            ) : user ? (
                <>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        backgroundColor: '#0e1420', border: '1px solid #1e293b',
                        borderRadius: 10, padding: '5px 10px',
                    }}>
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                        ) : (
                            <User size={16} color="#64748b" />
                        )}
                        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#94a3b8', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.displayName || user.email?.split('@')[0] || 'User'}
                        </span>
                    </div>
                    <button
                        onClick={handleResetProgress}
                        title="Reset Progress"
                        style={{
                            background: '#0e1420', border: '1px solid #1e293b', borderRadius: 10,
                            padding: 6, cursor: 'pointer', color: '#64748b', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f59e0b'}
                        onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                    >
                        <RotateCcw size={14} />
                    </button>
                    <button
                        onClick={handleLogout}
                        title="Sign Out"
                        style={{
                            background: '#0e1420', border: '1px solid #1e293b', borderRadius: 10,
                            padding: 6, cursor: 'pointer', color: '#64748b', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                    >
                        <LogOut size={14} />
                    </button>
                </>
            ) : (
                <button
                    onClick={() => setShowLogin(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 10,
                        backgroundColor: '#22c55e', border: 'none', cursor: 'pointer',
                        fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 12,
                        color: '#052e16', letterSpacing: 1,
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <User size={14} /> SIGN IN
                </button>
            )}
        </div>
    );

    return (
        <div style={{ minHeight: '100dvh', backgroundColor: bg, color: '#e2e8f0', overflowX: 'hidden', isolation: 'isolate' }}>
            {/* ── BACKGROUND IMAGE GLOBAL ──
                Gambar pulau melayang (upload user, 2026-08-28) sebagai background
                seluruh web — pengganti warna polos #181b24.
                - position: fixed + inset 0 -> ukuran selalu sebesar viewport, tidak
                  ikut memanjang saat halaman panjang & stabil saat transisi halaman.
                - zIndex: -1 + isolation: isolate di root -> layer ini berada DI ATAS
                  backgroundColor root (fallback saat gambar belum termuat) tapi DI
                  BAWAH seluruh konten halaman.
                - Scrim gelap (gradient rgba #181b24) di atas gambar supaya tema
                  dark, panel #0e1420, dan teks abu tetap terbaca.
                - Halaman tool full-screen (3D simulator, canvas, dll.) punya bg
                  solid sendiri -> menutupi layer ini, by design. */}
            <div aria-hidden="true" style={{
                position: 'fixed',
                inset: 0,
                zIndex: -1,
                backgroundImage: "linear-gradient(180deg, rgba(24,27,36,0.58) 0%, rgba(16,19,26,0.78) 100%), url('/bg-island.webp')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }} />
            {/* ── SVG GRADIENT DEFS GLOBAL ──
                Dideklarasi SEKALI di root level, BUKAN per-komponen MenuButton3D.
                Alasan: SVG `id` harus unik di seluruh dokumen. Kalau taruh di
                MenuButton3D.jsx (di-render 6x), akan ada 6 elemen dengan id sama
                → collision, referensi url(#menuIconGrad) jadi tidak konsisten.
                Prefix `menu` supaya tidak collision dengan SVG lain di app ini.
                Icon-icon di MenuButton3D cukup PAKAI url(#menuIconGrad) dan
                url(#menuSphereGrad), TIDAK perlu deklarasi ulang. */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <linearGradient id="menuIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="1"/>
                        <stop offset="55%" stopColor="#ffffff" stopOpacity="0.75"/>
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4"/>
                    </linearGradient>
                    <radialGradient id="menuSphereGrad" cx="35%" cy="30%" r="75%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="1"/>
                        <stop offset="55%" stopColor="#ffffff" stopOpacity="0.7"/>
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.28"/>
                    </radialGradient>
                </defs>
            </svg>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: .3 } }`}</style>
            <Toaster position="top-center" richColors theme="dark" toastOptions={{ style: { fontFamily: 'Inter,sans-serif', fontSize: 13 } }} />
        {(page === "welcome" || page === "menu") && userBar}
        {guestAnnouncement && (
            <div style={{
                position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
                zIndex: 999, padding: '12px 24px', borderRadius: 12,
                backgroundColor: '#1c0a0a', border: '1px solid #7f1d1d',
                boxShadow: '0 8px 32px rgba(127,29,29,0.4)',
                display: 'flex', alignItems: 'center', gap: 10,
                animation: 'bannerIn 0.3s ease-out',
            }}>
                <User size={18} color="#f87171" />
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600, color: '#fca5a5' }}>
                    Harap sign in dahulu sebelum menggunakan fitur ini
                </span>
            </div>
        )}
        <style>{`@keyframes bannerIn { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
        <main>
        <AnimatePresence mode="wait">
            {page === "welcome" && <motion.div key="welcome" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <div style={{ width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", alignItems: "center", gap: 32, textAlign: "center" }}>
                    <h1 style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 900, fontSize: "clamp(2.4rem,10vw,3.6rem)", background: "linear-gradient(180deg,#4ade80 0%,#16a34a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>Babft Learning</h1>
                    <picture>
                        <source srcSet="/gate-diagram.webp" type="image/webp" />
                        <img fetchPriority="high" width={640} height={357} src="/gate-diagram.jpg" alt="Logic Gates Diagram" style={{ width: "100%", maxWidth: 420, borderRadius: 16, display: "block", margin: "0 auto" }} />
                    </picture>
                    <button onClick={() => setPage("menu")}
                        className="animate-pulse-glow"
                        style={{ width: "100%", maxWidth: 400, padding: "18px 0", borderRadius: 20, backgroundColor: "#22c55e", border: "none", cursor: "pointer", fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 18, color: "#052e16", letterSpacing: 2, transition: "transform 0.2s" }}
                        onMouseEnter={c => c.currentTarget.style.transform = "scale(1.02)"}
                        onMouseLeave={c => c.currentTarget.style.transform = "scale(1)"}
                        onMouseDown={c => c.currentTarget.style.transform = "scale(0.97)"}
                        onMouseUp={c => c.currentTarget.style.transform = "scale(1.02)"}
                    >START LEARNING</button>
                </div>
            </motion.div>}
            {page === "marketplace" && <motion.div key="marketplace" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ padding: "32px 20px 48px", display: "flex", justifyContent: "center" }}>
                <Suspense fallback={pageFallback}><MarketplacePage setPage={setPage} /></Suspense>
            </motion.div>}
            {page === "canvas" && <motion.div key="canvas" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
                <Suspense fallback={pageFallback}><CanvasPage setPage={setPage} /></Suspense>
            </motion.div>}
            {page === "shapes" && <motion.div key="shapes" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <Suspense fallback={pageFallback}><ShapesPage setPage={setPage} user={user} onGuestClick={showGuestAnnouncement} /></Suspense>
            </motion.div>}
            {page === "shapes-calculator" && <motion.div key="shapes-calculator" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <Suspense fallback={pageFallback}><ShapesCalculator setPage={setPage} /></Suspense>
            </motion.div>}
            {page === "block-simulator-3d" && <motion.div key="block-simulator-3d" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
                <Suspense fallback={pageFallback}><BlockSimulator3D setPage={setPage} /></Suspense>
            </motion.div>}
            {page === "block-simulator-3d-v2" && <motion.div key="block-simulator-3d-v2" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
                <Suspense fallback={pageFallback}><BlockSimulator3Dv2 setPage={setPage} /></Suspense>
            </motion.div>}
            {page === "menu" && <motion.div key="menu" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: 'relative' }}>
                <CreditsBox />
                <div style={{ width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", alignItems: "center", gap: 28, textAlign: "center" }}>
                    <h1 style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 900, fontSize: "clamp(2rem,8vw,3rem)", background: "linear-gradient(180deg,#4ade80 0%,#16a34a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em", margin: 0 }}>Babft Learning</h1>
                    <picture>
                        <source srcSet="/gate-diagram.webp" type="image/webp" />
                        <img width={640} height={357} src="/gate-diagram.jpg" alt="Logic Gates Diagram" style={{ width: "100%", maxWidth: 420, borderRadius: 16, display: "block", margin: "0 auto" }} />
                    </picture>
                    <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* 6 tombol menu utama — STANDAR DESAIN DEFAULT (lihat design.md →
                            "Standar Desain Menu Button (Default Global)").
                            Marketplace & Canvas: guest-guard (locked=!user) — guest klik → banner merah.
                            Shapes, Logic Gates, Gears, Linkages: bebas diakses siapapun.
                            ATURAN: onClick & locked tiap tombol DIPERTAHANKAN PERSIS seperti
                            sebelumnya — jangan diubah saat rewrite. Yang baru hanya props
                            warna (top/bottom/lip), icon SVG custom, dan subtitle. */}
                        <MenuButton3D
                            label="Marketplace"
                            subtitle="trade parts & designs"
                            top="hsl(350,85%,68%)" bottom="hsl(350,80%,45%)" lip="hsl(350,80%,32%)"
                            onClick={() => user ? setPage("marketplace") : showGuestAnnouncement()}
                            locked={!user}
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                                    <path d="M3 4h2l1.6 9.6a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L20.5 7H6.2" stroke="url(#menuIconGrad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                    <circle cx="9.5" cy="19.5" r="1.4" fill="url(#menuIconGrad)"/>
                                    <circle cx="17" cy="19.5" r="1.4" fill="url(#menuIconGrad)"/>
                                    <path d="M8 10.5h9.5" stroke="rgba(0,0,0,0.25)" strokeWidth="1.2" strokeLinecap="round"/>
                                </svg>
                            }
                        />
                        <MenuButton3D
                            label="Canvas"
                            subtitle="free-form sketch"
                            top="hsl(270,70%,68%)" bottom="hsl(270,75%,42%)" lip="hsl(270,75%,30%)"
                            onClick={() => user ? setPage("canvas") : showGuestAnnouncement()}
                            locked={!user}
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                                    <path d="M15.5 3.5l5 5-11 11-6 1 1-6z" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.6"/>
                                    <path d="M13.5 5.5l5 5" stroke="rgba(0,0,0,0.3)" strokeWidth="1.3" strokeLinecap="round"/>
                                    <path d="M4.5 19.5l2-5.2 3.2 3.2z" fill="rgba(255,255,255,0.55)"/>
                                </svg>
                            }
                        />
                        <MenuButton3D
                            label="Shapes"
                            subtitle="geometry tools"
                            top="hsl(142,55%,55%)" bottom="hsl(142,55%,35%)" lip="hsl(142,55%,24%)"
                            onClick={() => setPage("shapes")}
                            icon={
                                <svg viewBox="-4 -6 32 34" fill="none" width="48" height="48">
                                    <g transform="translate(4,3) rotate(45)">
                                        <rect x="-4" y="-6.6" width="8" height="13.2" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.5"/>
                                        <ellipse cx="0" cy="-6.6" rx="4" ry="2.1" fill="rgba(255,255,255,0.95)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.5"/>
                                        <ellipse cx="0" cy="6.6" rx="4" ry="2.1" fill="rgba(0,0,0,0.25)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.5"/>
                                    </g>
                                    <path d="M6 12.5 L-0.3 24 L12.3 24 Z" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" strokeLinejoin="round"/>
                                    <path d="M18 6.5 L24.3 10 L18 13.5 L11.7 10 Z" fill="rgba(255,255,255,0.95)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.4" strokeLinejoin="round"/>
                                    <path d="M11.7 10 L18 13.5 L18 24 L11.7 20.5 Z" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.4" strokeLinejoin="round"/>
                                    <path d="M24.3 10 L18 13.5 L18 24 L24.3 20.5 Z" fill="rgba(255,255,255,0.78)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.4" strokeLinejoin="round"/>
                                    <circle cx="20.5" cy="0.5" r="5.4" fill="url(#menuSphereGrad)" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6"/>
                                </svg>
                            }
                        />
                        <MenuButton3D
                            label="Logic Gates"
                            subtitle="digital circuits"
                            top="hsl(217,80%,65%)" bottom="hsl(217,80%,42%)" lip="hsl(217,80%,30%)"
                            onClick={() => setPage("logic-gates")}
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                                    <rect x="6" y="6" width="12" height="12" rx="2" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.6"/>
                                    <rect x="9" y="9" width="6" height="6" rx="1" fill="rgba(0,0,0,0.22)"/>
                                    <path d="M9 3v2.2M15 3v2.2M9 18.8V21M15 18.8V21M3 9h2.2M3 15h2.2M18.8 9H21M18.8 15H21" stroke="rgba(255,255,255,0.8)" strokeWidth="1.4" strokeLinecap="round"/>
                                </svg>
                            }
                        />
                        <MenuButton3D
                            label="Gears"
                            subtitle="mechanical sim"
                            top="hsl(38,90%,60%)" bottom="hsl(30,85%,45%)" lip="hsl(30,85%,32%)"
                            onClick={() => setPage("gears")}
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                                    <path d="M 10.70 5.40 L 10.70 2.00 L 13.30 2.00 L 13.30 5.40 A 6.60 6.60 0 0 1 14.83 5.90 L 16.83 3.15 L 18.93 4.67 L 16.93 7.42 A 6.60 6.60 0 0 1 17.88 8.72 L 21.11 7.67 L 21.91 10.15 L 18.68 11.20 A 6.60 6.60 0 0 1 18.68 12.80 L 21.91 13.85 L 21.11 16.33 L 17.88 15.28 A 6.60 6.60 0 0 1 16.93 16.58 L 18.93 19.33 L 16.83 20.85 L 14.83 18.10 A 6.60 6.60 0 0 1 13.30 18.60 L 13.30 22.00 L 10.70 22.00 L 10.70 18.60 A 6.60 6.60 0 0 1 9.17 18.10 L 7.17 20.85 L 5.07 19.33 L 7.07 16.58 A 6.60 6.60 0 0 1 6.12 15.28 L 2.89 16.33 L 2.09 13.85 L 5.32 12.80 A 6.60 6.60 0 0 1 5.32 11.20 L 2.09 10.15 L 2.89 7.67 L 6.12 8.72 A 6.60 6.60 0 0 1 7.07 7.42 L 5.07 4.67 L 7.17 3.15 L 9.17 5.90 A 6.60 6.60 0 0 1 10.70 5.40 Z M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z" fillRule="evenodd" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" strokeLinejoin="round"/>
                                </svg>
                            }
                        />
                        <MenuButton3D
                            label="Linkages"
                            subtitle="mechanism study"
                            top="hsl(235,70%,72%)" bottom="hsl(235,65%,52%)" lip="hsl(235,65%,38%)"
                            onClick={() => setPage("linkages")}
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                                    <rect x="3" y="8.5" width="9" height="7" rx="3.5" fill="none" stroke="url(#menuIconGrad)" strokeWidth="2.2"/>
                                    <rect x="12" y="8.5" width="9" height="7" rx="3.5" fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="2.2"/>
                                    <path d="M10 12h4" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            }
                        />
                    </div>
                </div>
            </motion.div>}
            {page === "logic-gates" && <motion.div key="logic-gates" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <div style={{ width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", alignItems: "center", gap: 28, textAlign: "center" }}>
                    <h1 style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 900, fontSize: "clamp(1.8rem,7vw,2.6rem)", background: "linear-gradient(180deg,#4ade80 0%,#16a34a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.01em", margin: 0 }}>LOGIC GATES</h1>
                    <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* 4 tombol submenu Logic Gates — diseragamkan ke standar MenuButton3D
                            (lihat design.md Bagian 39). onClick & locked DIPERTAHANKAN PERSIS
                            seperti sebelumnya — termasuk guard user ? ... : showGuestAnnouncement()
                            di tombol ke-4. Standar ukuran icon: container 56x56, SVG 48x48
                            (rasio 86%) — lihat design.md Bagian 39.4 "STANDAR UKURAN ICON RESMI". */}
                        <MenuButton3D
                            label="7 Basic Logic Gates"
                            subtitle="AND, OR, NOT, and more"
                            top="hsl(217,80%,65%)" bottom="hsl(217,80%,42%)" lip="hsl(217,80%,30%)"
                            onClick={() => setPage("basic-logic-gates")}
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                                    <rect x="6" y="6" width="12" height="12" rx="2" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.6"/>
                                    <rect x="9" y="9" width="6" height="6" rx="1" fill="rgba(0,0,0,0.22)"/>
                                    <path d="M9 3v2.2M15 3v2.2M9 18.8V21M15 18.8V21M3 9h2.2M3 15h2.2M18.8 9H21M18.8 15H21" stroke="rgba(255,255,255,0.8)" strokeWidth="1.4" strokeLinecap="round"/>
                                </svg>
                            }
                        />
                        <MenuButton3D
                            label="Logic Gates Circuit"
                            subtitle="build & simulate circuits"
                            top="hsl(280,75%,68%)" bottom="hsl(280,75%,44%)" lip="hsl(280,75%,30%)"
                            onClick={goToCircuit}
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                                    <rect x="4" y="4" width="16" height="16" rx="3" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.6"/>
                                    <path d="M8 9h3v3H8zM13 9h3M13 12h3M8 15h8" stroke="rgba(0,0,0,0.3)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                                    <circle cx="16.5" cy="9" r="1" fill="rgba(0,0,0,0.35)"/>
                                    <circle cx="16.5" cy="12" r="1" fill="rgba(0,0,0,0.35)"/>
                                </svg>
                            }
                        />
                        <MenuButton3D
                            label="Circuit Generator"
                            subtitle="auto-generate layouts"
                            top="hsl(190,85%,55%)" bottom="hsl(190,85%,35%)" lip="hsl(190,85%,24%)"
                            onClick={() => setPage("circuit-generator")}
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                                    <circle cx="12" cy="5" r="2.6" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5"/>
                                    <circle cx="6" cy="18" r="2.6" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5"/>
                                    <circle cx="18" cy="18" r="2.6" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5"/>
                                    <path d="M12 7.6V11M12 11L6 15.4M12 11L18 15.4" stroke="rgba(0,0,0,0.35)" strokeWidth="1.3" strokeLinecap="round"/>
                                </svg>
                            }
                        />
                        <MenuButton3D
                            label="Create Logic Gates Simulator"
                            subtitle="design your own gate"
                            top="hsl(38,92%,60%)" bottom="hsl(30,88%,42%)" lip="hsl(28,88%,30%)"
                            onClick={() => user ? setPage("logic-gates-simulator") : showGuestAnnouncement()}
                            locked={!user}
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                                    <path d="M10 3h4v4.2l4.3 8.4A2 2 0 0 1 16.5 18.5h-9a2 2 0 0 1-1.8-2.9L10 7.2z" fill="url(#menuIconGrad)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.6" strokeLinejoin="round"/>
                                    <path d="M9 3h6" stroke="rgba(0,0,0,0.3)" strokeWidth="1.4" strokeLinecap="round"/>
                                    <path d="M7.3 14.5h9.4" stroke="rgba(0,0,0,0.28)" strokeWidth="1" strokeLinecap="round"/>
                                    <circle cx="10.5" cy="16.3" r="0.7" fill="rgba(255,255,255,0.6)"/>
                                    <circle cx="13.5" cy="17" r="0.5" fill="rgba(255,255,255,0.6)"/>
                                </svg>
                            }
                        />
                    </div>
                    <button onClick={() => setPage("menu")}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, backgroundColor: "#0e1420", border: "1px solid #334155", color: "#94a3b8", cursor: "pointer", fontFamily: "Inter,sans-serif", fontWeight: 600, fontSize: 14, transition: "all 0.2s" }}
                        onMouseEnter={c => { c.currentTarget.style.color = "#e2e8f0"; c.currentTarget.style.borderColor = "#475569"; }}
                        onMouseLeave={c => { c.currentTarget.style.color = "#94a3b8"; c.currentTarget.style.borderColor = "#334155"; }}
                    ><ArrowLeft size={18} /> Back</button>
                </div>
            </motion.div>}
            {page === "basic-logic-gates" && <motion.div key="basic-logic-gates" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ padding: "32px 20px 48px", display: "flex", justifyContent: "center" }}>
                <Suspense fallback={pageFallback}><BasicLogicGates setPage={setPage} /></Suspense>
            </motion.div>}
            {page === "logic-gates-circuit" && <motion.div key="logic-gates-circuit" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ padding: "32px 20px 48px", display: "flex", justifyContent: "center" }}>
                <Suspense fallback={pageFallback}><LogicGatesCircuit setPage={setPage} /></Suspense>
            </motion.div>}
            {page === "circuit-generator" && <motion.div key="circuit-generator" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ padding: "32px 20px 48px", display: "flex", justifyContent: "center" }}>
                <Suspense fallback={pageFallback}><CircuitGenerator setPage={setPage} /></Suspense>
            </motion.div>}
            {page === "gears" && <motion.div key="gears" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ padding: "32px 20px 48px", display: "flex", justifyContent: "center" }}>
                <Suspense fallback={pageFallback}><GearsPage setPage={setPage} /></Suspense>
            </motion.div>}
            {page === "linkages" && <motion.div key="linkages" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ padding: "32px 20px 48px", display: "flex", justifyContent: "center" }}>
                <Suspense fallback={pageFallback}><LinkagesPage setPage={setPage} /></Suspense>
            </motion.div>}
            {page === "logic-gates-simulator" && <motion.div key="logic-gates-simulator" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
                <Suspense fallback={pageFallback}><LogicGatesSimulator setPage={setPage} /></Suspense>
            </motion.div>}
            {/* ── catch-all 404 ──
                Dirender ketika `page` tidak cocok dengan halaman yang dikenal.
                Contoh: data progress korup, deep-link ke page lama yang sudah dihapus,
                atau setPage dipanggil dengan nilai tak dikenal. */}
            {!KNOWN_PAGES.has(page) && (
                <motion.div key="not-found" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ minHeight: "100dvh" }}>
                    <NotFoundPage setPage={setPage} />
                </motion.div>
            )}
        </AnimatePresence>
        </main>
        {!helperOpen && <AIHelperButton onClick={() => setHelperOpen(true)} />}
        {helperOpen && (
            <Suspense fallback={null}>
                <AIHelperPanel
                    onClose={() => setHelperOpen(false)}
                    messages={chatMessages}
                    setMessages={setChatMessages}
                    chatId={chatId}
                    setChatId={setChatId}
                />
            </Suspense>
        )}
        </div>
    );
}
// deploy fix Wed Aug 19 03:14:22 UTC 2026
