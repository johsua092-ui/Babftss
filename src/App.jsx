import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import { Cpu, Network, FlaskConical, Lock, ArrowLeft } from "lucide-react";
import gateData from "./data/gateData";
import gearData from "./data/gearData";
import linkageData from "./data/linkageData";
import { hexToRgbStr } from "./utils/colorHelper";
import HowItWorks from "./components/HowItWorks";
import GateCard from "./components/GateCard";
import CircuitCard01 from "./components/CircuitCard01";
import GearIcon from "./components/GearIcon";
import LinkageIcon from "./components/LinkageIcon";
import LoginPage from "./components/LoginPage";
import UserPill from "./components/UserPill";
import { useAuth } from "./context/AuthContext";

const backBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 10,
  backgroundColor: "#0e1420",
  border: "1px solid #1e293b",
  color: "#64748b",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: 13,
  fontWeight: 600,
  transition: "color 0.2s",
};

export default function App() {
  const [page, setPage] = useState("menu");
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          width: "100%",
          backgroundColor: "#181b24",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const variants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.98,
      transition: { duration: 0.28, ease: "easeIn" },
    },
  };
  const goToCircuit = () => setPage("logic-gates-circuit");
  const bg = "#181b24",
    panel = "#0e1420";
  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        backgroundColor: bg,
        color: "#f1f5f9",
        overflowX: "hidden",
      }}
    >
      <UserPill />
      <AnimatePresence mode="wait">
        {page === "menu" && (
          <motion.div
            key="menu"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              minHeight: "100dvh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 500,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 28,
                textAlign: "center",
              }}
            >
              <h1
                style={{
                  fontFamily: "Orbitron,sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(2rem,8vw,3rem)",
                  color: "#22c55e",
                  letterSpacing: "-0.02em",
                  margin: 0,
                }}
              >
                WELCOME
              </h1>
              <img
                src="assets/gate-diagram.jpg"
                alt="Logic Gates Diagram"
                style={{
                  width: "100%",
                  maxWidth: 420,
                  borderRadius: 16,
                  display: "block",
                  margin: "0 auto",
                }}
              />
              <div
                style={{
                  width: "100%",
                  maxWidth: 400,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <button
                  onClick={() => setPage("logic-gates")}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: 14,
                    cursor: "pointer",
                    backgroundColor: panel,
                    border: "1px solid rgba(59,130,246,0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    color: "#fff",
                    boxShadow: "0 0 18px rgba(59,130,246,0.25)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(c) =>
                    (c.currentTarget.style.transform = "scale(1.02)")
                  }
                  onMouseLeave={(c) =>
                    (c.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <div
                    style={{
                      backgroundColor: "rgba(59,130,246,0.18)",
                      padding: 10,
                      borderRadius: 10,
                      color: "#60a5fa",
                      flexShrink: 0,
                    }}
                  >
                    <Cpu size={22} />
                  </div>
                  <span
                    style={{
                      fontFamily: "Orbitron,sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                      textAlign: "left",
                    }}
                  >
                    Logic Gates
                  </span>
                </button>
                <button
                  onClick={() => setPage("gears")}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: 14,
                    cursor: "pointer",
                    backgroundColor: panel,
                    border: "1px solid rgba(251,146,60,0.38)",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    color: "#fff",
                    boxShadow: "0 0 18px rgba(251,146,60,0.22)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(c) =>
                    (c.currentTarget.style.transform = "scale(1.02)")
                  }
                  onMouseLeave={(c) =>
                    (c.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <div
                    style={{
                      backgroundColor: "rgba(251,146,60,0.18)",
                      padding: 10,
                      borderRadius: 10,
                      flexShrink: 0,
                    }}
                  >
                    <GearIcon icon="spur" color="#fb923c" size={22} />
                  </div>
                  <span
                    style={{
                      fontFamily: "Orbitron,sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                      textAlign: "left",
                      color: "#fb923c",
                    }}
                  >
                    Gears
                  </span>
                </button>
                <button
                  onClick={() => setPage("linkages")}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: 14,
                    cursor: "pointer",
                    backgroundColor: panel,
                    border: "1px solid rgba(99,102,241,0.38)",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    color: "#fff",
                    boxShadow: "0 0 18px rgba(99,102,241,0.22)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(c) =>
                    (c.currentTarget.style.transform = "scale(1.02)")
                  }
                  onMouseLeave={(c) =>
                    (c.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <div
                    style={{
                      backgroundColor: "rgba(99,102,241,0.18)",
                      padding: 10,
                      borderRadius: 10,
                      flexShrink: 0,
                    }}
                  >
                    <LinkageIcon icon="fourbar" color="#818cf8" size={22} />
                  </div>
                  <span
                    style={{
                      fontFamily: "Orbitron,sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                      textAlign: "left",
                      color: "#818cf8",
                    }}
                  >
                    Linkages Mechanic
                  </span>
                </button>
                <button
                  onClick={goToCircuit}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: 14,
                    cursor: "pointer",
                    backgroundColor: "rgba(14,20,32,0.6)",
                    border: "1px solid #1e293b",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    color: "#475569",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(c) =>
                    (c.currentTarget.style.backgroundColor =
                      "rgba(14,20,32,0.9)")
                  }
                  onMouseLeave={(c) =>
                    (c.currentTarget.style.backgroundColor =
                      "rgba(14,20,32,0.6)")
                  }
                >
                  <div
                    style={{
                      backgroundColor: "#0f172a",
                      padding: 10,
                      borderRadius: 10,
                      color: "#334155",
                      flexShrink: 0,
                    }}
                  >
                    <Lock size={22} />
                  </div>
                  <span
                    style={{
                      fontFamily: "Orbitron,sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                      textAlign: "left",
                    }}
                  >
                    Coming Soon
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
        {page === "logic-gates" && (
          <motion.div
            key="logic-gates"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              minHeight: "100dvh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 500,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 28,
                textAlign: "center",
              }}
            >
              <h1
                style={{
                  fontFamily: "Orbitron,sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.8rem,7vw,2.6rem)",
                  color: "#22c55e",
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                LOGIC GATES
              </h1>
              <div
                style={{
                  width: "100%",
                  maxWidth: 400,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <button
                  onClick={() => setPage("basic-logic-gates")}
                  style={{
                    width: "100%",
                    padding: "22px 20px",
                    borderRadius: 14,
                    cursor: "pointer",
                    backgroundColor: panel,
                    border: "1px solid rgba(59,130,246,0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    color: "#fff",
                    boxShadow: "0 0 18px rgba(59,130,246,0.25)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(c) =>
                    (c.currentTarget.style.transform = "translateY(-2px)")
                  }
                  onMouseLeave={(c) =>
                    (c.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  <div
                    style={{
                      backgroundColor: "rgba(59,130,246,0.18)",
                      padding: 12,
                      borderRadius: 12,
                      color: "#60a5fa",
                      flexShrink: 0,
                    }}
                  >
                    <Cpu size={28} />
                  </div>
                  <span
                    style={{
                      fontFamily: "Orbitron,sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      textAlign: "left",
                    }}
                  >
                    7 Basic Logic Gates
                  </span>
                </button>
                <button
                  onClick={goToCircuit}
                  style={{
                    width: "100%",
                    padding: "22px 20px",
                    borderRadius: 14,
                    cursor: "pointer",
                    backgroundColor: panel,
                    border: "1px solid rgba(168,85,247,0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    color: "#fff",
                    boxShadow: "0 0 18px rgba(168,85,247,0.25)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(c) =>
                    (c.currentTarget.style.transform = "translateY(-2px)")
                  }
                  onMouseLeave={(c) =>
                    (c.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  <div
                    style={{
                      backgroundColor: "rgba(168,85,247,0.18)",
                      padding: 12,
                      borderRadius: 12,
                      color: "#a855f7",
                      flexShrink: 0,
                    }}
                  >
                    <Network size={28} />
                  </div>
                  <span
                    style={{
                      fontFamily: "Orbitron,sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      textAlign: "left",
                    }}
                  >
                    Logic Gates Circuit
                  </span>
                </button>
                <button
                  onClick={goToCircuit}
                  className="animate-gold-pulse"
                  style={{
                    width: "100%",
                    padding: "22px 20px",
                    borderRadius: 14,
                    cursor: "pointer",
                    border: "1px solid rgba(251,191,36,0.5)",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(c) =>
                    (c.currentTarget.style.transform = "translateY(-2px)")
                  }
                  onMouseLeave={(c) =>
                    (c.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  <div
                    style={{
                      backgroundColor: "rgba(251,191,36,0.18)",
                      padding: 12,
                      borderRadius: 12,
                      color: "#fbbf24",
                      flexShrink: 0,
                    }}
                  >
                    <FlaskConical size={28} />
                  </div>
                  <span
                    style={{
                      fontFamily: "Orbitron,sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                      textAlign: "left",
                      color: "#fbbf24",
                    }}
                  >
                    Create Logic Gates Simulator
                  </span>
                </button>
              </div>
              <button
                onClick={() => setPage("menu")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  borderRadius: 10,
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#475569",
                  cursor: "pointer",
                  fontFamily: "Inter,sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(c) =>
                  (c.currentTarget.style.color = "#e2e8f0")
                }
                onMouseLeave={(c) =>
                  (c.currentTarget.style.color = "#475569")
                }
              >
                <ArrowLeft size={18} /> Back
              </button>
            </div>
          </motion.div>
        )}
        {page === "basic-logic-gates" && (
          <motion.div
            key="basic-logic-gates"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              padding: "32px 20px 48px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "100%", maxWidth: 500 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <button
                  onClick={() => setPage("logic-gates")}
                  style={backBtnStyle}
                  onMouseEnter={(c) =>
                    (c.currentTarget.style.color = "#e2e8f0")
                  }
                  onMouseLeave={(c) =>
                    (c.currentTarget.style.color = "#64748b")
                  }
                >
                  <ArrowLeft size={15} /> Back
                </button>
              </div>
              <h1
                style={{
                  fontFamily: "Orbitron,sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.4rem,6vw,2rem)",
                  color: "#22c55e",
                  margin: "12px 0 20px",
                }}
              >
                7 BASIC LOGIC GATES
              </h1>
              <HowItWorks />
              <p
                style={{
                  fontFamily: "Inter,sans-serif",
                  fontSize: 12,
                  color: "#475569",
                  marginBottom: 20,
                  lineHeight: 1.6,
                }}
              >
                Tekan tombol{" "}
                <strong style={{ color: "#64748b" }}>A</strong> atau{" "}
                <strong style={{ color: "#64748b" }}>B</strong> pada setiap
                gerbang untuk melihat bagaimana sinyal mengalir secara langsung.
                Gerbang berpendar saat outputnya aktif.
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {gateData.map((c) => (
                  <GateCard key={c.id} config={c} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        {page === "logic-gates-circuit" && (
          <motion.div
            key="logic-gates-circuit"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              padding: "32px 20px 48px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "100%", maxWidth: 500 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <button
                  onClick={() => setPage("logic-gates")}
                  style={backBtnStyle}
                  onMouseEnter={(c) =>
                    (c.currentTarget.style.color = "#e2e8f0")
                  }
                  onMouseLeave={(c) =>
                    (c.currentTarget.style.color = "#64748b")
                  }
                >
                  <ArrowLeft size={15} /> Back
                </button>
              </div>
              <h1
                style={{
                  fontFamily: "Orbitron,sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.4rem,6vw,2rem)",
                  color: "#22c55e",
                  margin: "12px 0 6px",
                }}
              >
                LOGIC GATES CIRCUIT
              </h1>
              <p
                style={{
                  fontFamily: "Inter,sans-serif",
                  fontSize: 12,
                  color: "#475569",
                  marginBottom: 20,
                  lineHeight: 1.6,
                }}
              >
                Gabungan beberapa gerbang logika yang saling terhubung membentuk
                rangkaian kompleks. Pelajari bagaimana sinyal mengalir melewati
                lebih dari satu gerbang.
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <CircuitCard01 />
              </div>
            </div>
          </motion.div>
        )}
        {page === "gears" && (
          <motion.div
            key="gears"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              padding: "32px 20px 48px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "100%", maxWidth: 500 }}>
              <div style={{ marginBottom: 8 }}>
                <button
                  onClick={() => setPage("menu")}
                  style={backBtnStyle}
                  onMouseEnter={(c) =>
                    (c.currentTarget.style.color = "#e2e8f0")
                  }
                  onMouseLeave={(c) =>
                    (c.currentTarget.style.color = "#64748b")
                  }
                >
                  <ArrowLeft size={15} /> Back
                </button>
              </div>
              <h1
                style={{
                  fontFamily: "Orbitron,sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.6rem,7vw,2.4rem)",
                  color: "#22c55e",
                  margin: "12px 0 6px",
                }}
              >
                GEARS
              </h1>
              <p
                style={{
                  fontFamily: "Inter,sans-serif",
                  fontSize: 12,
                  color: "#475569",
                  marginBottom: 22,
                  lineHeight: 1.6,
                }}
              >
                Pilih jenis roda gigi untuk dipelajari. Setiap gear memiliki
                bentuk dan kegunaan yang unik dalam dunia mesin dan teknik
                mekanik.
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {gearData.map((c) => {
                  const d = hexToRgbStr(c.color);
                  return (
                    <button
                      key={c.id}
                      onClick={goToCircuit}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: 14,
                        cursor: "pointer",
                        backgroundColor: "#0e1420",
                        border: `1px solid rgba(${d},0.28)`,
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        transition: "all 0.22s",
                        boxShadow: `0 0 12px rgba(${d},0.1)`,
                        textAlign: "left",
                      }}
                      onMouseEnter={(r) => {
                        r.currentTarget.style.transform = "translateX(4px)";
                        r.currentTarget.style.boxShadow = `0 0 22px rgba(${d},0.28)`;
                        r.currentTarget.style.borderColor = `rgba(${d},0.55)`;
                      }}
                      onMouseLeave={(r) => {
                        r.currentTarget.style.transform = "translateX(0)";
                        r.currentTarget.style.boxShadow = `0 0 12px rgba(${d},0.1)`;
                        r.currentTarget.style.borderColor = `rgba(${d},0.28)`;
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 12,
                          flexShrink: 0,
                          backgroundColor: `rgba(${d},0.12)`,
                          border: `1px solid rgba(${d},0.22)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <GearIcon
                          icon={c.icon}
                          color={c.color}
                          size={34}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 3,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "Orbitron,sans-serif",
                              fontSize: 8,
                              fontWeight: 700,
                              color: c.color,
                              opacity: 0.7,
                              letterSpacing: 1,
                            }}
                          >
                            {String(c.id).padStart(2, "0")}
                          </span>
                          <span
                            style={{
                              fontFamily: "Orbitron,sans-serif",
                              fontWeight: 700,
                              fontSize: 12,
                              color: "#e2e8f0",
                              letterSpacing: 0.3,
                            }}
                          >
                            {c.name}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: "Inter,sans-serif",
                            fontSize: 11,
                            color: "#64748b",
                            lineHeight: 1.4,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {c.desc}
                        </p>
                      </div>
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          flexShrink: 0,
                          backgroundColor: c.color,
                          opacity: 0.6,
                          boxShadow: `0 0 6px ${c.color}`,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
        {page === "linkages" && (
          <motion.div
            key="linkages"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              padding: "28px 16px 52px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "100%", maxWidth: 900 }}>
              <div style={{ marginBottom: 8 }}>
                <button
                  onClick={() => setPage("menu")}
                  style={backBtnStyle}
                  onMouseEnter={(c) =>
                    (c.currentTarget.style.color = "#e2e8f0")
                  }
                  onMouseLeave={(c) =>
                    (c.currentTarget.style.color = "#64748b")
                  }
                >
                  <ArrowLeft size={15} /> Back
                </button>
              </div>
              <h1
                style={{
                  fontFamily: "Orbitron,sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.6rem,6vw,2.4rem)",
                  color: "#22c55e",
                  margin: "12px 0 4px",
                }}
              >
                LINKAGE MECHANICS
              </h1>
              <p
                style={{
                  fontFamily: "Inter,sans-serif",
                  fontSize: 12,
                  color: "#475569",
                  marginBottom: 20,
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: "#818cf8", fontWeight: 700 }}>
                  {linkageData.length}
                </span>{" "}
                jenis mekanisme linkage dari seluruh dunia. Klik tombol untuk
                mempelajari setiap mekanisme secara detail.
              </p>
              <div className="linkage-grid">
                {linkageData.map((c) => {
                  const d = hexToRgbStr(c.color);
                  return (
                    <button
                      key={c.id}
                      onClick={goToCircuit}
                      className="linkage-card"
                      style={{
                        border: `1px solid rgba(${d},0.28)`,
                        backgroundColor: "#0b1120",
                        boxShadow: `0 0 0px rgba(${d},0)`,
                      }}
                      onMouseEnter={(r) => {
                        const p = r.currentTarget;
                        p.style.borderColor = `rgba(${d},0.65)`;
                        p.style.boxShadow = `0 0 18px rgba(${d},0.18), inset 0 0 16px rgba(${d},0.04)`;
                        p.style.transform = "translateY(-3px) scale(1.03)";
                        p.style.backgroundColor = `rgba(${d},0.07)`;
                      }}
                      onMouseLeave={(r) => {
                        const p = r.currentTarget;
                        p.style.borderColor = `rgba(${d},0.28)`;
                        p.style.boxShadow = `0 0 0px rgba(${d},0)`;
                        p.style.transform = "translateY(0) scale(1)";
                        p.style.backgroundColor = "#0b1120";
                      }}
                    >
                      <span
                        className="linkage-id"
                        style={{ color: c.color }}
                      >
                        {String(c.id).padStart(2, "0")}
                      </span>
                      <div className="linkage-icon-wrap">
                        <LinkageIcon
                          icon={c.icon}
                          color={c.color}
                          size={44}
                        />
                      </div>
                      <span className="linkage-name">{c.name}</span>
                      <div
                        className="linkage-dot"
                        style={{
                          backgroundColor: c.color,
                          boxShadow: `0 0 5px ${c.color}`,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}
