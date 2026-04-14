/**
 * EmptyState — bloc d'état vide engageant avec illustration SVG + titre + sous-titre + CTA
 *
 * Props :
 *   icon      : "rides" | "drivers" | "vehicles" | "stats" | "dashboard"
 *   title     : string
 *   subtitle  : string
 *   action    : { label, onClick } | null
 *   linkTo    : string (react-router path, alternative à action)
 *   linkLabel : string
 */

import { Link } from "react-router-dom";

const ICONS = {
  rides: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <rect width="52" height="52" rx="14" fill="var(--brand-light)" />
      <circle cx="26" cy="26" r="11" stroke="var(--brand)" strokeWidth="2.2" fill="none" />
      <path d="M26 21v5l3 3" stroke="var(--brand)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  drivers: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <rect width="52" height="52" rx="14" fill="var(--brand-light)" />
      <circle cx="26" cy="22" r="5" stroke="var(--brand)" strokeWidth="2.2" fill="none" />
      <path d="M16 38c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="var(--brand)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  ),
  vehicles: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <rect width="52" height="52" rx="14" fill="var(--brand-light)" />
      <rect x="13" y="19" width="18" height="13" rx="2.5" stroke="var(--brand)" strokeWidth="2.2" fill="none" />
      <path d="M31 23h6l3.5 5.5V32h-9.5V23z" stroke="var(--brand)" strokeWidth="2.2" strokeLinejoin="round" fill="none" />
      <circle cx="18.5" cy="33.5" r="2.5" fill="var(--brand)" />
      <circle cx="34.5" cy="33.5" r="2.5" fill="var(--brand)" />
    </svg>
  ),
  stats: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <rect width="52" height="52" rx="14" fill="var(--brand-light)" />
      <rect x="15" y="30" width="5" height="8" rx="1.5" fill="var(--brand)" opacity="0.4" />
      <rect x="23" y="24" width="5" height="14" rx="1.5" fill="var(--brand)" opacity="0.7" />
      <rect x="31" y="18" width="5" height="20" rx="1.5" fill="var(--brand)" />
    </svg>
  ),
  dashboard: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <rect width="52" height="52" rx="14" fill="var(--brand-light)" />
      <rect x="14" y="14" width="10" height="10" rx="3" stroke="var(--brand)" strokeWidth="2" fill="none" />
      <rect x="28" y="14" width="10" height="10" rx="3" fill="var(--brand)" opacity="0.3" />
      <rect x="14" y="28" width="10" height="10" rx="3" fill="var(--brand)" opacity="0.3" />
      <rect x="28" y="28" width="10" height="10" rx="3" stroke="var(--brand)" strokeWidth="2" fill="none" />
    </svg>
  ),
};

export default function EmptyState({ icon = "dashboard", title, subtitle, action, linkTo, linkLabel }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      padding: "48px 24px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
    }}>
      <div style={{ marginBottom: "4px" }}>{ICONS[icon] || ICONS.dashboard}</div>
      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{title}</p>
      {subtitle && (
        <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0, maxWidth: "280px", lineHeight: 1.5 }}>{subtitle}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: "8px",
            padding: "9px 20px",
            borderRadius: "9px",
            background: "var(--brand)",
            color: "white",
            fontSize: "13px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          {action.label}
        </button>
      )}
      {linkTo && linkLabel && (
        <Link
          to={linkTo}
          style={{
            marginTop: "8px",
            padding: "9px 20px",
            borderRadius: "9px",
            background: "var(--brand)",
            color: "white",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
