import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import BottomNav from "./BottomNav";

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Tableau de bord",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    to: "/rides",
    label: "Courses",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
  {
    to: "/vehicles",
    label: "Flotte",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h5l3 5v3h-8V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    to: "/drivers",
    label: "Équipe",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    to: "/stats",
    label: "Statistiques",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    to: "/settings",
    label: "Paramètres",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

function NavItem({ to, label, icon, exact = false }) {
  const { pathname } = useLocation();
  const isActive = exact
    ? pathname === to
    : pathname === to || (to !== "/dashboard" && pathname.startsWith(to));

  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "7px 10px",
        borderRadius: "8px",
        fontSize: "13.5px",
        fontWeight: isActive ? "600" : "500",
        color: isActive ? "#67e8f9" : "rgba(255,255,255,0.45)",
        background: isActive ? "rgba(6,182,212,0.15)" : "transparent",
        textDecoration: "none",
        marginBottom: "1px",
        borderLeft: isActive ? "2px solid #06b6d4" : "2px solid transparent",
        paddingLeft: "8px",
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; } }}
    >
      <span style={{ color: isActive ? "#67e8f9" : "rgba(255,255,255,0.35)", flexShrink: 0 }}>{icon}</span>
      {label}
    </Link>
  );
}

function Sidebar({ company, user }) {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  const initials = (company?.name || "MP").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside style={{
      flexDirection: "column",
      width: "var(--sidebar-width)",
      minHeight: "100vh",
      background: "linear-gradient(170deg, #1e3a5f 0%, #162d4a 100%)",
      position: "fixed",
      left: 0, top: 0, bottom: 0,
      zIndex: 40,
    }}
    className="hidden lg:flex"
    >
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Logo size={22} dark />
      </div>

      {/* Entreprise badge */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 32, height: 32,
            borderRadius: "9px",
            background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: "12px", fontWeight: 700, flexShrink: 0,
            letterSpacing: "0.02em",
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {company?.name || "myPilot"}
            </p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email || ""}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavItem key={to} to={to} label={label} icon={icon} exact={to === "/dashboard"} />
        ))}

        {isSuperAdmin && (
          <>
            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "10px 4px" }} />
            <Link
              to="/superadmin"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "7px 10px",
                borderRadius: "8px",
                fontSize: "13.5px",
                fontWeight: pathname === "/superadmin" ? "600" : "500",
                color: pathname === "/superadmin" ? "#67e8f9" : "rgba(255,255,255,0.45)",
                background: pathname === "/superadmin" ? "rgba(6,182,212,0.15)" : "transparent",
                textDecoration: "none",
              }}
              onMouseEnter={e => { if (pathname !== "/superadmin") { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; } }}
              onMouseLeave={e => { if (pathname !== "/superadmin") { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; } }}
            >
              <span style={{ color: pathname === "/superadmin" ? "#67e8f9" : "rgba(255,255,255,0.35)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </span>
              Superadmin
            </Link>
          </>
        )}
      </nav>

      {/* Déconnexion */}
      <div style={{ padding: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={signOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "7px 10px",
            borderRadius: "8px",
            fontSize: "13.5px",
            fontWeight: "500",
            color: "rgba(255,255,255,0.3)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

export default function Layout({ children, title }) {
  const { company, user } = useAuth();
  const companyName = company?.name || "myPilot";
  const day = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar company={company} user={user} />

      <div style={{ marginLeft: 0 }} className="lg:ml-[240px] flex flex-col min-h-screen">
        {/* TopBar mobile */}
        <div
          className="lg:hidden flex items-center justify-between gap-[10px]"
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            padding: "10px 16px",
          }}
        >
          <Logo size={20} />
          <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {companyName}
            </p>
            <p style={{ fontSize: "10.5px", color: "var(--text-3)", margin: 0, textTransform: "capitalize", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {day}
            </p>
          </div>
          <Link
            to="/rides/new"
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              background: "linear-gradient(135deg, #0891b2, #3b82f6)",
              boxShadow: "0 2px 8px rgba(8,145,178,0.35)",
              color: "white",
              padding: "6px 11px", borderRadius: "7px",
              fontSize: "12px", fontWeight: 600, textDecoration: "none", flexShrink: 0,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouvelle course
          </Link>
        </div>

        {/* Contenu */}
        <main style={{ flex: 1 }} className="pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
