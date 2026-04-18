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

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const values = data.map(d => d.ca || 0);
  const max = Math.max(...values, 1);
  const w = 60, h = 24;
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

function KpiCard({ config, value, sub, alert, delta, deltaRef, sparkData }) {
  const alertStyle = alert
    ? { color: "var(--danger)", bg: "var(--danger-bg)" }
    : { color: config.color, bg: config.bg };

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
  cpam:     { bg: "var(--brand-light)",    color: "var(--brand)" },
  mutuelle: { bg: "var(--cat-mutuelle-bg)", color: "var(--cat-mutuelle)" },
  cash:     { bg: "var(--surface-2)",       color: "var(--text-2)" },
  card:     { bg: "var(--surface-2)",       color: "var(--text-2)" },
  virement: { bg: "var(--brand-light)",    color: "var(--brand)" },
  cheque:   { bg: "var(--cat-cheque-bg)",  color: "var(--cat-cheque)" },
};
const PAYMENT_LABELS = { cpam: "CPAM", mutuelle: "Mutuelle", cash: "Espèces", card: "Carte", virement: "Virement", cheque: "Chèque" };

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

  return (
    <Layout title="Tableau de bord">
      <div className="max-w-3xl mx-auto p-4 lg:p-6 animate-fade-in">

        {/* Checklist d'activation — disparaît quand tout est fait */}
        {!activationDone && !isLoading && (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "14px 16px", marginBottom: "20px",
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
        )}

        {/* Alertes */}
        {(hasUnpaid || vehicleAlerts.length > 0) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            {hasUnpaid && (
              <Link to="/rides" style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "11px 14px",
                borderRadius: "10px",
                background: "var(--warning-bg)",
                border: "1px solid #fde68a",
                color: "var(--warning-text)",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 500,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>
                  <strong>{stats.unpaid_count} facture{stats.unpaid_count > 1 ? "s" : ""}</strong> en attente —{" "}
                  {stats.unpaid_amount.toLocaleString("fr-FR")}€
                </span>
              </Link>
            )}
            {vehicleAlerts.length > 0 && (
              <Link to="/vehicles" style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "11px 14px",
                borderRadius: "10px",
                background: "var(--danger-bg)",
                border: "1px solid #fecaca",
                color: "var(--danger-text)",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 500,
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
        )}

        {/* Widget Gasoil */}
        {showGasoil && gasoil?.prix && Object.keys(gasoil.prix).length > 0 && (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "12px 16px", marginBottom: "20px",
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
        )}

        {/* KPIs */}
        {isLoading ? (
          <SkeletonKpiCards />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
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
        )}

        {/* Courses récentes */}
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
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            overflow: "hidden",
          }}>
            {rides.map((ride, i) => {
              const pc = PAYMENT_COLORS[ride.payment_type] || { bg: "var(--surface-2)", color: "var(--text-2)" };
              return (
                <div
                  key={ride.id}
                  onClick={() => navigate(`/rides/${ride.id}/edit`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderBottom: i < rides.length - 1 ? "1px solid var(--border)" : "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
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
      </div>
    </Layout>
  );
}
