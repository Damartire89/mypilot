import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { SkeletonKpiCards, SkeletonRideList } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { getStatsSummary, getRides } from "../api/rides";
import { getVehicles } from "../api/vehicles";
import { getPrixGasoil } from "../api/gasoil";
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
    color: "#7c3aed",
    bg: "#f5f3ff",
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

function KpiCard({ config, value, sub, alert }) {
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
      <div>
        <p style={{ fontSize: "22px", fontWeight: 800, color: alert ? "var(--danger)" : "var(--text)", margin: 0, lineHeight: 1.1 }}>
          {value}
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "4px 0 0", fontWeight: 500 }}>{config.label}</p>
        {sub && <p style={{ fontSize: "11px", color: alert ? "var(--danger)" : "var(--text-3)", margin: "2px 0 0" }}>{sub}</p>}
      </div>
    </div>
  );
}

const PAYMENT_COLORS = {
  cpam: { bg: "#eff6ff", color: "#1d4ed8" },
  mutuelle: { bg: "#f5f3ff", color: "#7c3aed" },
  cash: { bg: "var(--surface-2)", color: "var(--text-2)" },
  card: { bg: "var(--surface-2)", color: "var(--text-2)" },
  virement: { bg: "#eff6ff", color: "#1d4ed8" },
  cheque: { bg: "#fdf4ff", color: "#a21caf" },
};
const PAYMENT_LABELS = { cpam: "CPAM", mutuelle: "Mutuelle", cash: "Espèces", card: "Carte", virement: "Virement", cheque: "Chèque" };

export default function Dashboard() {
  const { company } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["stats"], queryFn: getStatsSummary, refetchInterval: 30000 });
  const { data: rides = [], isLoading: ridesLoading } = useQuery({ queryKey: ["rides", { limit: 5 }], queryFn: () => getRides({ limit: 5 }) });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: getVehicles });
  const { data: gasoil } = useQuery({ queryKey: ["gasoil"], queryFn: getPrixGasoil, staleTime: 3600000, retry: false });
  const isLoading = statsLoading || ridesLoading;

  const vehicleAlerts = vehicles.filter(v => v.ct_alert || v.insurance_alert);
  const availableVehicles = vehicles.filter(v => v.status === "available").length;
  const hasUnpaid = (stats?.unpaid_count || 0) > 0;

  return (
    <Layout title="Tableau de bord">
      <div className="max-w-3xl mx-auto p-4 lg:p-6 animate-fade-in">

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
                color: "#92400e",
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
                color: "#7f1d1d",
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
        {gasoil?.prix && Object.keys(gasoil.prix).length > 0 && (
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
                {gasoil.cached ? "↻ mis en cache" : "↻ en direct"}
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
            />
            <KpiCard
              config={KPI_CONFIGS[1]}
              value={stats?.rides_today ?? "—"}
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
                <div key={ride.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderBottom: i < rides.length - 1 ? "1px solid var(--border)" : "none",
                }}>
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
