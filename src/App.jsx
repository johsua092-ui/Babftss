import { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { Cpu, Network, FlaskConical, CircuitBoard, ArrowLeft, User, LogOut, RotateCcw } from 'lucide-react';
import GearIcon from './components/GearIcon';
import LinkageIcon from './components/LinkageIcon';
import ShapesIcon from './components/ShapesIcon';
import LoginModal from './components/LoginModal';
import AIHelperButton from './components/AIHelperButton';
import { useAuth } from './contexts/AuthContext';
import { useProgressSync } from './hooks/useProgressSync';

const ShapesPage = lazy(() => import('./pages/ShapesPage'));
const ShapesCalculator = lazy(() => import('./pages/ShapesCalculator'));
const BlockSimulator3D = lazy(() => import('./pages/BlockSimulator3D'));
const BasicLogicGates = lazy(() => import('./pages/BasicLogicGates'));
const LogicGatesCircuit = lazy(() => import('./pages/LogicGatesCircuit'));
const CircuitGenerator = lazy(() => import('./pages/CircuitGenerator'));
const GearsPage = lazy(() => import('./pages/GearsPage'));
const LinkagesPage = lazy(() => import('./pages/LinkagesPage'));
const AIHelperPanel = lazy(() => import('./components/AIHelperPanel'));
const LogicGatesSimulator = lazy(() => import('./pages/LogicGatesSimulator'));

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
        <div style={{ minHeight: '100dvh', backgroundColor: bg, color: '#e2e8f0', overflowX: 'hidden' }}>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: .3 } }`}</style>
            <Toaster position="top-center" richColors theme="dark" toastOptions={{ style: { fontFamily: 'Inter,sans-serif', fontSize: 13 } }} />
        {userBar}
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
            {page === "shapes" && <motion.div key="shapes" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <Suspense fallback={pageFallback}><ShapesPage setPage={setPage} /></Suspense>
            </motion.div>}
            {page === "shapes-calculator" && <motion.div key="shapes-calculator" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <Suspense fallback={pageFallback}><ShapesCalculator setPage={setPage} /></Suspense>
            </motion.div>}
            {page === "block-simulator-3d" && <motion.div key="block-simulator-3d" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <Suspense fallback={pageFallback}><BlockSimulator3D setPage={setPage} /></Suspense>
            </motion.div>}
            {page === "menu" && <motion.div key="menu" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <div style={{ width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", alignItems: "center", gap: 28, textAlign: "center" }}>
                    <h1 style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 900, fontSize: "clamp(2rem,8vw,3rem)", background: "linear-gradient(180deg,#4ade80 0%,#16a34a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em", margin: 0 }}>Babft Learning</h1>
                    <picture>
                        <source srcSet="/gate-diagram.webp" type="image/webp" />
                        <img width={640} height={357} src="/gate-diagram.jpg" alt="Logic Gates Diagram" style={{ width: "100%", maxWidth: 420, borderRadius: 16, display: "block", margin: "0 auto" }} />
                    </picture>
                    <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 12 }}>
                        <button onClick={() => setPage("shapes")}
                            style={{ width: "100%", padding: "16px 20px", borderRadius: 14, cursor: "pointer", backgroundColor: panel, border: "1px solid rgba(45,212,191,0.38)", display: "flex", alignItems: "center", gap: 14, color: "#fff", boxShadow: "0 0 18px rgba(45,212,191,0.22)", transition: "all 0.2s" }}
                            onMouseEnter={c => c.currentTarget.style.transform = "scale(1.02)"}
                            onMouseLeave={c => c.currentTarget.style.transform = "scale(1)"}
                        ><div style={{ backgroundColor: "rgba(45,212,191,0.18)", padding: 10, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><ShapesIcon size={22} color="#2dd4bf" /></div><span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 700, fontSize: 14, textAlign: "left", color: "#2dd4bf" }}>Shapes</span></button>
                        <button onClick={() => setPage("logic-gates")}
                            style={{ width: "100%", padding: "16px 20px", borderRadius: 14, cursor: "pointer", backgroundColor: panel, border: "1px solid rgba(59,130,246,0.35)", display: "flex", alignItems: "center", gap: 14, color: "#fff", boxShadow: "0 0 18px rgba(59,130,246,0.25)", transition: "all 0.2s" }}
                            onMouseEnter={c => c.currentTarget.style.transform = "scale(1.02)"}
                            onMouseLeave={c => c.currentTarget.style.transform = "scale(1)"}
                        ><div style={{ backgroundColor: "rgba(59,130,246,0.18)", padding: 10, borderRadius: 10, color: "#60a5fa", flexShrink: 0 }}><Cpu size={22} /></div><span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 700, fontSize: 14, textAlign: "left" }}>Logic Gates</span></button>
                        <button onClick={() => setPage("gears")}
                            style={{ width: "100%", padding: "16px 20px", borderRadius: 14, cursor: "pointer", backgroundColor: panel, border: "1px solid rgba(251,146,60,0.38)", display: "flex", alignItems: "center", gap: 14, color: "#fff", boxShadow: "0 0 18px rgba(251,146,60,0.22)", transition: "all 0.2s" }}
                            onMouseEnter={c => c.currentTarget.style.transform = "scale(1.02)"}
                            onMouseLeave={c => c.currentTarget.style.transform = "scale(1)"}
                        ><div style={{ backgroundColor: "rgba(251,146,60,0.18)", padding: 10, borderRadius: 10, flexShrink: 0 }}><GearIcon icon="spur" color="#fb923c" size={22} /></div><span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 700, fontSize: 14, textAlign: "left", color: "#fb923c" }}>Gears</span></button>
                        <button onClick={() => setPage("linkages")}
                            style={{ width: "100%", padding: "16px 20px", borderRadius: 14, cursor: "pointer", backgroundColor: panel, border: "1px solid rgba(99,102,241,0.38)", display: "flex", alignItems: "center", gap: 14, color: "#fff", boxShadow: "0 0 18px rgba(99,102,241,0.22)", transition: "all 0.2s" }}
                            onMouseEnter={c => c.currentTarget.style.transform = "scale(1.02)"}
                            onMouseLeave={c => c.currentTarget.style.transform = "scale(1)"}
                        ><div style={{ backgroundColor: "rgba(99,102,241,0.18)", padding: 10, borderRadius: 10, flexShrink: 0 }}><LinkageIcon icon="fourbar" color="#818cf8" size={22} /></div><span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 700, fontSize: 14, textAlign: "left", color: "#818cf8" }}>Linkages Mechanic</span></button>
                    </div>
                </div>
            </motion.div>}
            {page === "logic-gates" && <motion.div key="logic-gates" variants={variants} initial="hidden" animate="visible" exit="exit" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <div style={{ width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", alignItems: "center", gap: 28, textAlign: "center" }}>
                    <h1 style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 900, fontSize: "clamp(1.8rem,7vw,2.6rem)", background: "linear-gradient(180deg,#4ade80 0%,#16a34a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.01em", margin: 0 }}>LOGIC GATES</h1>
                    <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}>
                        <button onClick={() => setPage("basic-logic-gates")}
                            style={{ width: "100%", padding: "22px 20px", borderRadius: 14, cursor: "pointer", backgroundColor: panel, border: "1px solid rgba(59,130,246,0.35)", display: "flex", alignItems: "center", gap: 16, color: "#fff", boxShadow: "0 0 18px rgba(59,130,246,0.25)", transition: "all 0.2s" }}
                            onMouseEnter={c => c.currentTarget.style.transform = "translateY(-2px)"}
                            onMouseLeave={c => c.currentTarget.style.transform = "translateY(0)"}
                        ><div style={{ backgroundColor: "rgba(59,130,246,0.18)", padding: 12, borderRadius: 12, color: "#60a5fa", flexShrink: 0 }}><Cpu size={28} /></div><span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 700, fontSize: 16, textAlign: "left" }}>7 Basic Logic Gates</span></button>
                        <button onClick={goToCircuit}
                            style={{ width: "100%", padding: "22px 20px", borderRadius: 14, cursor: "pointer", backgroundColor: panel, border: "1px solid rgba(168,85,247,0.35)", display: "flex", alignItems: "center", gap: 16, color: "#fff", boxShadow: "0 0 18px rgba(168,85,247,0.25)", transition: "all 0.2s" }}
                            onMouseEnter={c => c.currentTarget.style.transform = "translateY(-2px)"}
                            onMouseLeave={c => c.currentTarget.style.transform = "translateY(0)"}
                        ><div style={{ backgroundColor: "rgba(168,85,247,0.18)", padding: 12, borderRadius: 12, color: "#a855f7", flexShrink: 0 }}><CircuitBoard size={28} /></div><span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 700, fontSize: 16, textAlign: "left" }}>Logic Gates Circuit</span></button>
                        <button onClick={() => setPage("circuit-generator")}
                            style={{ width: "100%", padding: "22px 20px", borderRadius: 14, cursor: "pointer", backgroundColor: panel, border: "1px solid rgba(6,182,212,0.35)", display: "flex", alignItems: "center", gap: 16, color: "#fff", boxShadow: "0 0 18px rgba(6,182,212,0.25)", transition: "all 0.2s" }}
                            onMouseEnter={c => c.currentTarget.style.transform = "translateY(-2px)"}
                            onMouseLeave={c => c.currentTarget.style.transform = "translateY(0)"}
                        ><div style={{ backgroundColor: "rgba(6,182,212,0.18)", padding: 12, borderRadius: 12, color: "#06b6d4", flexShrink: 0 }}><Network size={28} /></div><span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 700, fontSize: 16, textAlign: "left" }}>Circuit Generator</span></button>
                        <button onClick={() => setPage("logic-gates-simulator")}
                            className="animate-gold-pulse"
                            style={{ width: "100%", padding: "22px 20px", borderRadius: 14, cursor: "pointer", border: "1px solid rgba(251,191,36,0.5)", display: "flex", alignItems: "center", gap: 16, transition: "all 0.2s", backgroundColor: panel }}
                            onMouseEnter={c => c.currentTarget.style.transform = "translateY(-2px)"}
                            onMouseLeave={c => c.currentTarget.style.transform = "translateY(0)"}
                        ><div style={{ backgroundColor: "rgba(251,191,36,0.18)", padding: 12, borderRadius: 12, color: "#fbbf24", flexShrink: 0 }}><FlaskConical size={28} /></div><span style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 700, fontSize: 14, textAlign: "left", color: "#fbbf24" }}>Create Logic Gates Simulator</span></button>
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
