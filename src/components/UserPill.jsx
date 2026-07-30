import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const styles = {
  wrapper: {
    position: "fixed",
    top: 16,
    right: 16,
    zIndex: 100,
  },
  pill: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 6px 6px 14px",
    borderRadius: 14,
    backgroundColor: "#0e1420",
    border: "1px solid #1e293b",
    cursor: "default",
    transition: "border-color 0.2s",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    objectFit: "cover",
  },
  placeholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, sans-serif",
    fontWeight: 700,
    fontSize: 14,
    color: "#64748b",
  },
  name: {
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    fontSize: 13,
    color: "#e2e8f0",
    maxWidth: 120,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 10,
    border: "none",
    backgroundColor: "transparent",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};

export default function UserPill() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const initials = (user.displayName || user.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={styles.wrapper}>
      <div style={styles.pill}>
        {user.photoURL ? (
          <img src={user.photoURL} alt="" style={styles.avatar} />
        ) : (
          <div style={styles.placeholder}>{initials}</div>
        )}
        <span style={styles.name}>{user.displayName || user.email}</span>
        <button
          style={styles.logoutBtn}
          onClick={logout}
          title="Sign out"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#475569";
          }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}
