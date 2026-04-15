import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getVehicles } from "../api/vehicles";
import { getStatsSummary } from "../api/rides";

const items = [
  {
    to: "/dashboard",
    label: "Accueil",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    to: "/rides",
    label: "Courses",
    badgeKey: "unpaid",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
  {
    to: "/vehicles",
    label: "Flotte",
    badgeKey: "vehicles",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h5l3 5v3h-8V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    to: "/drivers",
    label: "Équipe",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    to: "/stats",
    label: "Stats",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    to: "/settings",
    label: "Réglages",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";

  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: getVehicles, staleTime: 60000 });
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: getStatsSummary, staleTime: 30000 });

  const vehicleAlerts = vehicles.filter(v => v.ct_alert || v.insurance_alert).length;
  const unpaidCount = stats?.unpaid_count || 0;

  const badges = {
    vehicles: vehicleAlerts,
    unpaid: unpaidCount,
  };

  const allItems = isSuperAdmin
    ? [...items, {
        to: "/superadmin",
        label: "Admin",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        ),
      }]
    : items;

  return (
    <div
      className="flex lg:hidden"
      style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {allItems.map(({ to, label, icon, badgeKey }) => {
        const isActive = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
        const badgeCount = badgeKey ? badges[badgeKey] : 0;
        return (
          <Link
            key={to}
            to={to}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "9px 4px 10px",
              gap: "3px",
              color: isActive ? "var(--brand)" : "var(--text-3)",
              textDecoration: "none",
              position: "relative",
            }}
          >
            {isActive && (
              <span style={{
                position: "absolute",
                top: 0, left: "25%", right: "25%",
                height: "2px",
                background: "linear-gradient(90deg, #0891b2, #3b82f6)",
                borderRadius: "0 0 3px 3px",
              }} />
            )}
            <span style={{ color: isActive ? "var(--brand)" : "var(--text-3)", position: "relative" }}>
              {icon}
              {badgeCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: -3, right: -5,
                  minWidth: 14, height: 14,
                  background: "var(--danger)",
                  color: "white",
                  borderRadius: "99px",
                  fontSize: "9px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 3px",
                  lineHeight: 1,
                  border: "1.5px solid var(--surface)",
                }}>
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </span>
            <span style={{ fontSize: "10px", fontWeight: isActive ? 600 : 500, lineHeight: 1 }}>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
