import { Link, useLocation } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Accueil", icon: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? "#3fa9f5" : "#aaa"} strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  )},
  { to: "/rides", label: "Courses", icon: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? "#3fa9f5" : "#aaa"} strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
    </svg>
  )},
  { to: "/vehicles", label: "Flotte", icon: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? "#3fa9f5" : "#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h5l3 5v3h-8V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  )},
  { to: "/drivers", label: "Équipe", icon: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? "#3fa9f5" : "#aaa"} strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )},
  { to: "/stats", label: "Stats", icon: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? "#3fa9f5" : "#aaa"} strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )},
  { to: "/settings", label: "Réglages", icon: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? "#3fa9f5" : "#aaa"} strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )},
];

export default function BottomNav() {
  const { pathname } = useLocation();
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex max-w-lg mx-auto z-50">
      {items.map(({ to, label, icon }) => {
        const isActive = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
        return (
          <Link key={to} to={to}
            className="flex-1 flex flex-col items-center py-2 gap-0.5"
            style={{ color: isActive ? "#3fa9f5" : "#aaa" }}>
            {icon(isActive)}
            <span className="text-[10px] font-semibold leading-none">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
