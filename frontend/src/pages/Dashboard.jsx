import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { SkeletonKpiCards, SkeletonRideList } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { getStatsSummary, getRides, getStatsMonthly } from "../api/rides";
import { getVehicles } from "../api/vehicles";
import { getDrivers } from "../api/drivers";
import { getPrixGasoil } from "../api/gasoil";
import { getSettings } from "../api/settings";
import { useAuth } from "../context/AuthContext";

const KPI_CONFIGS = [
  {
    key: "ca",
    label: "CA ce mois",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 5a8 8 0 1 0 0 14"/>
        <line x1="2" y1="10" x2="14" y2="10"/>
        <line x1="2" y1="14" x2="14" y2="14"/>
      </svg>
    ),
    color: "var(--brand)",
    bg: "var(--brand-light)",
  },
  {
    key: "rides",
    label: "Courses aujourd'hui",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
    color: "var(--accent-violet)",
    bg: "var(--accent-violet-bg)",
  },
  {
    key: "fleet",
    label: "Flotte disponible",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h5l3 5v3h-8V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    color: "var(--success)",
    bg: "var(--success-bg)",
  },
  {
    key: "unpaid",
    label: "Impayés",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    color: "var(--warning)",
    bg: "var(--warning-bg)",
  },
];

function DeltaBadge({ current, prev }) {
  if (!prev || prev === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  const up = pct >= 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "2px",
      fontSize: "10px", fontWeight: 700,
      padding: "1px 5px", borderRadius: "99px",
      background: up ? "var(--success-bg)" : "var(--danger-bg)",
      color: up ? "var(--success)" : "var(--danger)",
    }}>
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

function Sparkline({ data, color, height = 24 }) {
  if (!data || data.length < 2) return null;
  const values = data.map(d => d.ca || 0);
  const max = Math.max(...values, 1);
  const w = 60, h = height;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block", marginTop: "4px" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  );
}

// Desktop-only: sparkline pleine largeur dans la card
function KpiSparkArea({ data, color }) {
  if (!data || data.length < 2) return null;
  const values = data.map(d => d.ca || 0);
  const max = Math.max(...values, 1);
  const w = 200, h = 36;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: h - (v / max) * (h - 4) - 2,
  }));
  const line = pts.map(p => `${p.x},${p.y}`).join(" ");
  const area = `${pts.map(p => `${p.x},${p.y}`).join(" L ")} L ${w},${h} L 0,${h} Z`;
  const gradId = `kpi-grad-${color.replace(/[^a-z]/gi, "")}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block", marginTop: "6px" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`M ${area}`} fill={`url(#${gradId})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function KpiCard({ config, value, sub, alert, delta, deltaRef, sparkData, desktop = false }) {
  const alertStyle = alert
    ? { color: "var(--danger)", bg: "var(--danger-bg)" }
    : { color: config.color, bg: config.bg };

  if (desktop) {
    return (
      <div style={{
        background: "var(--surface)",
        borderRadius: "14px",
        border: "1px solid var(--border)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{
            width: 42, height: 42,
            borderRadius: "11px",
            background: alertStyle.bg,
            color: alertStyle.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {/* icône plus grande */}
            <span style={{ display: "flex", transform: "scale(1.15)" }}>{config.icon}</span>
          </div>
          {delta !== undefined && <DeltaBadge current={delta} prev={deltaRef} />}
        </div>
        <div>
          <p style={{ fontSize: "26px", fontWeight: 800, color: alert ? "var(--danger)" : "var(--text)", margin: 0, lineHeight: 1.05 }}>
            {value}
          </p>
          <p style={{ fontSize: "12.5px", color: "var(--text-3)", margin: "6px 0 0", fontWeight: 500 }}>{config.label}</p>
          {sub && <p style={{ fontSize: "11.5px", color: alert ? "var(--danger)" : "var(--text-3)", margin: "3px 0 0" }}>{sub}</p>}
          {sparkData && <KpiSparkArea data={sparkData} color={config.color} />}
        </div>
      </div>
    );
  }

  // Mobile : design inchangé
  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "12px",
      border: "1px solid var(--border)",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          width: 34, height: 34,
          borderRadius: "9px",
          background: alertStyle.bg,
          color: alertStyle.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {config.icon}
        </div>
        {delta !== undefined && <DeltaBadge current={delta} prev={deltaRef} />}
      </div>
      <div>
        <p style={{ fontSize: "22px", fontWeight: 800, color: alert ? "var(--danger)" : "var(--text)", margin: 0, lineHeight: 1.1 }}>
          {value}
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "4px 0 0", fontWeight: 500 }}>{config.label}</p>
        {sub && <p style={{ fontSize: "11px", color: alert ? "var(--danger)" : "var(--text-3)", margin: "2px 0 0" }}>{sub}</p>}
        {sparkData && <Sparkline data={sparkData} color={config.color} />}
      </div>
    </div>
  );
}

const PAYMENT_COLORS = {
  cpam:     { bg: "var(--brand-light)",    color: "var(--brand)",     chart: "#0891b2" },
  mutuelle: { bg: "var(--cat-mutuelle-bg)", color: "var(--cat-mutuelle)", chart: "#7c3aed" },
  cash:     { bg: "var(--surface-2)",       color: "var(--text-2)",    chart: "#94a3b8" },
  card:     { bg: "var(--surface-2)",       color: "var(--text-2)",    chart: "#64748b" },
  virement: { bg: "var(--brand-light)",    color: "var(--brand)",     chart: "#0ea5e9" },
  cheque:   { bg: "var(--cat-cheque-bg)",  color: "var(--cat-cheque)", chart: "#a21caf" },
};
const PAYMENT_LABELS = { cpam: "CPAM", mutuelle: "Mutuelle", cash: "Espèces", card: "Carte", virement: "Virement", cheque: "Chèque" };

// ───────────── Mini-chart "CA des 4 dernières semaines" (desktop) ─────────────
function WeeklyChart({ weekly }) {
  const data = (weekly || []).slice(-6); // 6 max
  if (data.length < 2) {
    return (
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "14px", padding: "18px 20px",
        boxShadow: "var(--shadow-sm)",
      }}>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          CA des dernières semaines
        </p>
        <p style={{ fontSize: "12.5px", color: "var(--text-3)", margin: "10px 0 0" }}>
          Pas assez de données — enregistrez plus de courses pour voir la tendance.
        </p>
      </div>
    );
  }

  const values = data.map(d => Number(d.ca || 0));
  const max = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0);
  const w = 800, h = 100, pad = 4;

  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * (w - pad * 2) + pad,
    y: h - (v / max) * (h - 10) - 5,
  }));
  const line = pts.map(p => `${p.x},${p.y}`).join(" ");
  const area = `M ${pts.map(p => `${p.x},${p.y}`).join(" L ")} L ${w - pad},${h} L ${pad},${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "14px", padding: "18px 20px 20px",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            CA des {values.length} dernières semaines
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "4px 0 0" }}>
            Total : <strong style={{ color: "var(--text)", fontWeight: 700 }}>{total.toLocaleString("fr-FR")}€</strong>
          </p>
        </div>
        <Link to="/stats" style={{ fontSize: "12.5px", color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
          Voir les stats →
        </Link>
      </div>
      <svg width="100%" height="100" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block", marginTop: "10px" }}>
        <defs>
          <linearGradient id="weekly-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0891b2" stopOpacity="0.28"/>
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={area} fill="url(#weekly-grad)"/>
        <polyline points={line} fill="none" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={last.x} cy={last.y} r="4.5" fill="#0891b2"/>
        <circle cx={last.x} cy={last.y} r="8" fill="#0891b2" opacity="0.15"/>
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "var(--text-3)", marginTop: "6px", padding: "0 2px" }}>
        {data.map((d, i) => <span key={i}>S{d.week}</span>)}
      </div>
    </div>
  );
}

// ───────────── Donut répartition paiements (sidebar desktop) ─────────────
function PaymentDonut({ byType }) {
  const data = (byType || [])
    .map(r => ({
      type: r.payment_type || "cash",
      ca: Number(r.ca || 0),
    }))
    .filter(r => r.ca > 0);

  const total = data.reduce((a, b) => a + b.ca, 0);
  if (total === 0) return null;

  const R = 30, CIRC = 2 * Math.PI * R;
  let offset = 0;
  const arcs = data.map((d, i) => {
    const pct = d.ca / total;
    const len = CIRC * pct;
    const arc = (
      <circle
        key={i}
        cx="40" cy="40" r={R}
        fill="none"
        stroke={PAYMENT_COLORS[d.type]?.chart || "#94a3b8"}
        strokeWidth="10"
        strokeDasharray={`${len} ${CIRC - len}`}
        strokeDashoffset={-offset}
        transform="rotate(-90 40 40)"
      />
    );
    offset += len;
    return arc;
  });

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "14px", padding: "16px 18px",
      boxShadow: "var(--shadow-sm)",
    }}>
      <p style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Répartition paiements
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
          <circle cx="40" cy="40" r={R} fill="none" stroke="var(--border)" strokeWidth="10"/>
          {arcs}
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", flex: 1, minWidth: 0 }}>
          {data.map((d, i) => {
            const pct = (d.ca / total) * 100;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: PAYMENT_COLORS[d.type]?.chart || "#94a3b8", flexShrink: 0 }}/>
                <span style={{ color: "var(--text-2)" }}>{PAYMENT_LABELS[d.type] || d.type}</span>
                <strong style={{ marginLeft: "auto", color: "var(--text)" }}>{pct.toFixed(0)}%</strong>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ───────────── Table courses récentes (desktop) ─────────────
function RidesTable({ rides, onRowClick }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "14px", overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Courses récentes
        </p>
        <Link to="/rides" style={{ fontSize: "12.5px", color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
          Voir tout →
        </Link>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "var(--surface-2)" }}>
            <th style={thStyle}>Client</th>
            <th style={thStyle}>Trajet</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Paiement</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Montant</th>
          </tr>
        </thead>
        <tbody>
          {rides.map((ride, i) => {
            const pc = PAYMENT_COLORS[ride.payment_type] || { bg: "var(--surface-2)", color: "var(--text-2)" };
            const isLast = i === rides.length - 1;
            const d = ride.ride_at ? new Date(ride.ride_at) : null;
            return (
              <tr
                key={ride.id}
                onClick={() => onRowClick(ride.id)}
                style={{ cursor: "pointer", transition: "background 120ms" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ ...tdStyle, borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                  <span style={{
                    display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                    background: ride.status === "paid" ? "var(--success)" : "var(--warning)",
                    marginRight: "10px", verticalAlign: "middle",
                  }}/>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>
                    {ride.client_name || "Course sans nom"}
                  </span>
                </td>
                <td style={{ ...tdStyle, color: "var(--text-2)", fontSize: "12.5px", borderBottom: isLast ? "none" : "1px solid var(--border)", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ride.origin || "—"}{ride.destination ? ` → ${ride.destination}` : ""}
                </td>
                <td style={{ ...tdStyle, color: "var(--text-2)", fontSize: "12.5px", borderBottom: isLast ? "none" : "1px solid var(--border)", whiteSpace: "nowrap" }}>
                  {d ? d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) : "—"}
                </td>
                <td style={{ ...tdStyle, borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                  {ride.payment_type && (
                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: "99px", background: pc.bg, color: pc.color }}>
                      {PAYMENT_LABELS[ride.payment_type] || ride.payment_type}
                    </span>
                  )}
                </td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 800, color: "var(--text)", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                  {Number(ride.amount).toFixed(0)}€
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "10px 20px",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--text-3)",
  fontWeight: 700,
  borderBottom: "1px solid var(--border)",
};
const tdStyle = {
  padding: "14px 20px",
  verticalAlign: "middle",
};

export default function Dashboard() {
  const { company } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["stats"], queryFn: getStatsSummary, refetchInterval: 30000 });
  const { data: rides = [], isLoading: ridesLoading } = useQuery({ queryKey: ["rides", { limit: 5 }], queryFn: () => getRides({ limit: 5 }) });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: getVehicles });
  const { data: drivers = [] } = useQuery({ queryKey: ["drivers"], queryFn: getDrivers, staleTime: 60000 });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings, staleTime: 300000, retry: false });
  const showGasoil = settings?.show_gasoil_widget !== false;
  const { data: gasoil } = useQuery({ queryKey: ["gasoil"], queryFn: getPrixGasoil, staleTime: 3600000, retry: false, enabled: showGasoil });
  const { data: monthly } = useQuery({ queryKey: ["stats-monthly", now.getFullYear(), now.getMonth() + 1], queryFn: () => getStatsMonthly(now.getFullYear(), now.getMonth() + 1), staleTime: 60000, retry: false });
  const isLoading = statsLoading || ridesLoading;

  const vehicleAlerts = vehicles.filter(v => v.ct_alert || v.insurance_alert);
  const availableVehicles = vehicles.filter(v => v.status === "available").length;
  const hasUnpaid = (stats?.unpaid_count || 0) > 0;

  const hasVehicle = vehicles.length > 0;
  const hasDriver = drivers.length > 0;
  const hasRide = rides.length > 0;
  const activationDone = hasVehicle && hasDriver && hasRide;

  // ───────────── Sous-blocs (utilisés mobile + desktop) ─────────────
  const activationBlock = !activationDone && !isLoading && (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "12px", padding: "14px 16px",
    }}>
      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Mise en route
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {[
          { done: true, label: "Compte créé", link: null },
          { done: hasVehicle, label: "Ajoutez votre premier véhicule", link: "/vehicles" },
          { done: hasDriver, label: "Invitez un chauffeur", link: "/drivers" },
          { done: hasRide, label: "Enregistrez votre première course", link: "/rides/new" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
              background: item.done ? "var(--success)" : "var(--surface-2)",
              border: item.done ? "none" : "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {item.done && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </div>
            {item.done || !item.link ? (
              <span style={{ fontSize: "13px", color: item.done ? "var(--text-3)" : "var(--text)", fontWeight: item.done ? 400 : 500, textDecoration: item.done ? "line-through" : "none" }}>
                {item.label}
              </span>
            ) : (
              <Link to={item.link} style={{ fontSize: "13px", color: "var(--brand)", fontWeight: 500, textDecoration: "none" }}>
                {item.label} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const alertsBlock = (hasUnpaid || vehicleAlerts.length > 0) && (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {hasUnpaid && (
        <Link to="/rides" style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "11px 14px", borderRadius: "10px",
          background: "var(--warning-bg)", border: "1px solid #fde68a",
          color: "var(--warning-text)", textDecoration: "none",
          fontSize: "13px", fontWeight: 500,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>
            <strong>{stats.unpaid_count} facture{stats.unpaid_count > 1 ? "s" : ""}</strong> en attente — {stats.unpaid_amount.toLocaleString("fr-FR")}€
          </span>
        </Link>
      )}
      {vehicleAlerts.length > 0 && (
        <Link to="/vehicles" style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "11px 14px", borderRadius: "10px",
          background: "var(--danger-bg)", border: "1px solid #fecaca",
          color: "var(--danger-text)", textDecoration: "none",
          fontSize: "13px", fontWeight: 500,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round">
            <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h5l3 5v3h-8V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          <span>
            <strong>{vehicleAlerts.length} véhicule{vehicleAlerts.length > 1 ? "s" : ""}</strong> avec documents à renouveler
          </span>
        </Link>
      )}
    </div>
  );

  const gasoilBlock = showGasoil && gasoil?.prix && Object.keys(gasoil.prix).length > 0 && (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "12px", padding: "12px 16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round">
            <path d="M3 22V8l9-6 9 6v14"/><path d="M9 22V12h6v10"/><path d="M21 10h2v4h-2"/>
          </svg>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Prix carburant — France
          </span>
        </div>
        <span style={{ fontSize: "10px", color: "var(--text-3)" }}>
          {gasoil.fetched_at
            ? `Mis à jour à ${new Date(gasoil.fetched_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
            : "Prix carburant"}
        </span>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {Object.entries(gasoil.prix).map(([label, prix]) => (
          <div key={label} style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            background: label === "Gazole" ? "var(--brand-light)" : "var(--surface-2)",
            borderRadius: "9px", padding: "7px 12px", minWidth: "60px",
          }}>
            <span style={{ fontSize: "13px", fontWeight: 800, color: label === "Gazole" ? "var(--brand)" : "var(--text)" }}>
              {prix.toFixed(3)}€
            </span>
            <span style={{ fontSize: "10px", color: "var(--text-3)", marginTop: "1px", fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ───────── Mobile-only blocks (KPIs + liste compact) ─────────
  const mobileKpisBlock = isLoading ? (
    <SkeletonKpiCards />
  ) : (
    <div className="grid grid-cols-2 gap-[10px]">
      <KpiCard
        config={KPI_CONFIGS[0]}
        value={`${(stats?.ca_month || 0).toLocaleString("fr-FR")}€`}
        delta={stats?.ca_month}
        deltaRef={stats?.ca_prev_month}
        sparkData={monthly?.weekly}
      />
      <KpiCard
        config={KPI_CONFIGS[1]}
        value={stats?.rides_today ?? "—"}
        delta={stats?.rides_today}
        deltaRef={stats?.rides_yesterday}
      />
      <KpiCard
        config={KPI_CONFIGS[2]}
        value={vehicles.length ? `${availableVehicles} / ${vehicles.length}` : "—"}
      />
      <KpiCard
        config={KPI_CONFIGS[3]}
        value={`${(stats?.unpaid_amount || 0).toLocaleString("fr-FR")}€`}
        sub={stats?.unpaid_count ? `${stats.unpaid_count} en attente` : "Aucune"}
        alert={hasUnpaid}
      />
    </div>
  );

  const mobileRidesBlock = (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
          Courses récentes
        </p>
        <Link to="/rides" style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--brand)", textDecoration: "none" }}>
          Voir tout →
        </Link>
      </div>

      {isLoading ? (
        <SkeletonRideList rows={4} />
      ) : rides.length === 0 ? (
        <EmptyState
          icon="rides"
          title="Aucune course pour l'instant"
          subtitle="Enregistrez votre première course pour voir le CA et les statistiques se remplir automatiquement."
          linkTo="/rides/new"
          linkLabel="+ Enregistrer une course"
        />
      ) : (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "12px", overflow: "hidden",
        }}>
          {rides.map((ride, i) => {
            const pc = PAYMENT_COLORS[ride.payment_type] || { bg: "var(--surface-2)", color: "var(--text-2)" };
            return (
              <div
                key={ride.id}
                onClick={() => navigate(`/rides/${ride.id}/edit`)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 16px",
                  borderBottom: i < rides.length - 1 ? "1px solid var(--border)" : "none",
                  cursor: "pointer",
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: ride.status === "paid" ? "var(--success)" : "var(--warning)",
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ride.client_name || "Course sans nom"}
                  </p>
                  {(ride.origin || ride.destination) && (
                    <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ride.origin}{ride.destination ? ` → ${ride.destination}` : ""}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  {ride.payment_type && (
                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "99px", background: pc.bg, color: pc.color }}>
                      {PAYMENT_LABELS[ride.payment_type] || ride.payment_type}
                    </span>
                  )}
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
                    {Number(ride.amount).toFixed(0)}€
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  // ───────── Desktop-only KPIs (cartes plus grandes, sparkline area) ─────────
  const desktopKpisBlock = isLoading ? (
    <SkeletonKpiCards />
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
      <KpiCard
        desktop
        config={KPI_CONFIGS[0]}
        value={`${(stats?.ca_month || 0).toLocaleString("fr-FR")}€`}
        delta={stats?.ca_month}
        deltaRef={stats?.ca_prev_month}
        sparkData={monthly?.weekly}
      />
      <KpiCard
        desktop
        config={KPI_CONFIGS[1]}
        value={stats?.rides_today ?? "—"}
        delta={stats?.rides_today}
        deltaRef={stats?.rides_yesterday}
      />
      <KpiCard
        desktop
        config={KPI_CONFIGS[2]}
        value={vehicles.length ? `${availableVehicles} / ${vehicles.length}` : "—"}
        sub={vehicles.length && vehicles.length - availableVehicles > 0 ? `${vehicles.length - availableVehicles} en course` : undefined}
      />
      <KpiCard
        desktop
        config={KPI_CONFIGS[3]}
        value={`${(stats?.unpaid_amount || 0).toLocaleString("fr-FR")}€`}
        sub={stats?.unpaid_count ? `${stats.unpaid_count} en attente` : "Aucune"}
        alert={hasUnpaid}
      />
    </div>
  );

  const desktopRidesBlock = isLoading ? (
    <SkeletonRideList rows={5} />
  ) : rides.length === 0 ? (
    <EmptyState
      icon="rides"
      title="Aucune course pour l'instant"
      subtitle="Enregistrez votre première course pour voir le CA et les statistiques se remplir automatiquement."
      linkTo="/rides/new"
      linkLabel="+ Enregistrer une course"
    />
  ) : (
    <RidesTable rides={rides} onRowClick={(id) => navigate(`/rides/${id}/edit`)} />
  );

  return (
    <Layout title="Tableau de bord">
      {/* ───────── Mobile / tablette ───────── */}
      <div className="lg:hidden max-w-3xl mx-auto p-4 animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {activationBlock}
        {alertsBlock}
        {gasoilBlock}
        {mobileKpisBlock}
        <div>{mobileRidesBlock}</div>
      </div>

      {/* ───────── Desktop ───────── */}
      <div className="hidden lg:grid animate-fade-in" style={{
        gridTemplateColumns: "minmax(0, 1fr) 320px",
        gap: "24px",
        maxWidth: "1440px",
        margin: "0 auto",
        padding: "28px 32px",
      }}>
        {/* Colonne principale */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", minWidth: 0 }}>
          {desktopKpisBlock}
          <WeeklyChart weekly={monthly?.weekly} />
          {desktopRidesBlock}
        </div>

        {/* Sidebar */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {activationBlock}
          {alertsBlock}
          <PaymentDonut byType={monthly?.by_type} />
          {gasoilBlock}
        </aside>
      </div>
    </Layout>
  );
}
