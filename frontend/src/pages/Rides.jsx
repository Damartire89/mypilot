import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { SkeletonRideList } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { getRides, updateRide, exportRidesCSV } from "../api/rides";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const PAYMENT_LABELS = { cpam: "CPAM", mutuelle: "Mutuelle", cash: "Espèces", card: "Carte", virement: "Virement", cheque: "Chèque" };
const PAYMENT_STYLES = {
  cpam:      { bg: "#eff6ff", color: "#1d4ed8" },
  mutuelle:  { bg: "#f5f3ff", color: "#7c3aed" },
  cash:      { bg: "var(--surface-2)", color: "var(--text-2)" },
  card:      { bg: "var(--surface-2)", color: "var(--text-2)" },
  virement:  { bg: "#eff6ff", color: "#1d4ed8" },
  cheque:    { bg: "#fdf4ff", color: "#a21caf" },
};

const FILTERS = [
  { key: "all",     label: "Toutes" },
  { key: "today",   label: "Aujourd'hui" },
  { key: "pending", label: "En attente" },
  { key: "cpam",    label: "CPAM" },
  { key: "cash",    label: "Espèces" },
];

export default function Rides() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [activeFilter, setActiveFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [limit, setLimit] = useState(30);

  const queryParams = {};
  if (activeFilter === "pending") queryParams.status = "pending";
  if (activeFilter === "cpam")    queryParams.payment_type = "cpam";
  if (activeFilter === "cash")    queryParams.payment_type = "cash";
  if (activeFilter === "today")   queryParams.date_from = new Date().toISOString().slice(0, 10);

  const { data: rides = [], isLoading } = useQuery({
    queryKey: ["rides", queryParams, limit],
    queryFn: () => getRides({ ...queryParams, limit }),
  });

  const handleFilterChange = (key) => { setActiveFilter(key); setLimit(30); };

  const markPaid = useMutation({
    mutationFn: (id) => updateRide(id, { status: "paid" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rides"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast("Course marquée comme payée", "success");
    },
    onError: () => toast("Erreur lors de la mise à jour", "error"),
  });

  const grouped = groupByDate(rides);

  return (
    <Layout title="Courses">
      <div className="max-w-2xl mx-auto p-4 lg:p-6 animate-fade-in">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>Courses</p>
            <span style={{
              fontSize: "11px", fontWeight: 600,
              padding: "2px 8px", borderRadius: "99px",
              background: "var(--surface-2)", color: "var(--text-3)",
            }}>
              {rides.length}
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={async () => { setExporting(true); try { await exportRidesCSV(queryParams); } finally { setExporting(false); } }}
              disabled={exporting}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                fontSize: "12.5px", fontWeight: 500,
                color: "var(--text-2)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                padding: "6px 11px", borderRadius: "7px",
                cursor: exporting ? "not-allowed" : "pointer",
                opacity: exporting ? 0.5 : 1,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {exporting ? "Export..." : "Export CSV"}
            </button>
            <Link
              to="/rides/new"
              className="hidden lg:flex"
              style={{
                alignItems: "center", gap: "5px",
                background: "var(--brand)", color: "white",
                padding: "6px 12px", borderRadius: "7px",
                fontSize: "12.5px", fontWeight: 600, textDecoration: "none",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--brand-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--brand)"}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nouvelle course
            </Link>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px", overflowX: "auto", paddingBottom: "2px" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              style={{
                flexShrink: 0,
                padding: "5px 12px",
                borderRadius: "99px",
                fontSize: "12.5px",
                fontWeight: activeFilter === f.key ? 600 : 500,
                border: activeFilter === f.key ? "1px solid var(--brand)" : "1px solid var(--border)",
                background: activeFilter === f.key ? "var(--brand-light)" : "var(--surface)",
                color: activeFilter === f.key ? "var(--brand)" : "var(--text-2)",
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && <SkeletonRideList rows={6} />}

        {!isLoading && rides.length === 0 && (
          <EmptyState
            icon="rides"
            title={activeFilter === "all" ? "Aucune course enregistrée" : "Aucune course pour ce filtre"}
            subtitle={activeFilter === "all" ? "Chaque course enregistrée alimente vos statistiques et votre CA en temps réel." : "Essayez un autre filtre ou ajoutez une nouvelle course."}
            linkTo={activeFilter === "all" ? "/rides/new" : undefined}
            linkLabel={activeFilter === "all" ? "+ Enregistrer une course" : undefined}
          />
        )}

        {!isLoading && grouped.map(({ label, rides: group }) => (
          <div key={label} style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
              {label}
            </p>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
              {group.map((ride, i) => {
                const ps = PAYMENT_STYLES[ride.payment_type] || { bg: "var(--surface-2)", color: "var(--text-2)" };
                return (
                  <div
                    key={ride.id}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "12px",
                      padding: "12px 14px",
                      borderBottom: i < group.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <button
                      onClick={() => ride.status === "pending" && markPaid.mutate(ride.id)}
                      title={ride.status === "pending" ? "Marquer comme payé" : "Payé"}
                      style={{
                        width: 10, height: 10, borderRadius: "50%", flexShrink: 0, marginTop: 5,
                        background: ride.status === "paid" ? "var(--success)" : "var(--warning)",
                        border: "none", cursor: ride.status === "pending" ? "pointer" : "default",
                        padding: 0,
                      }}
                    />
                    <div
                      style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                      onClick={() => navigate(`/rides/${ride.id}/edit`)}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ride.client_name || "Course sans nom"}
                        </p>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", flexShrink: 0 }}>
                          {Number(ride.amount).toFixed(0)}€
                        </span>
                      </div>
                      {(ride.origin || ride.destination) && (
                        <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ride.origin}{ride.destination ? ` → ${ride.destination}` : ""}
                        </p>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px", flexWrap: "wrap" }}>
                        {ride.ride_at && (
                          <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                            {new Date(ride.ride_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
                          </span>
                        )}
                        {ride.payment_type && (
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 7px", borderRadius: "99px", background: ps.bg, color: ps.color }}>
                            {PAYMENT_LABELS[ride.payment_type] || ride.payment_type}
                          </span>
                        )}
                        {ride.status === "pending" && (
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 7px", borderRadius: "99px", background: "var(--warning-bg)", color: "var(--warning)" }}>
                            En attente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!isLoading && rides.length >= limit && (
          <button
            onClick={() => setLimit(l => l + 30)}
            style={{
              width: "100%", padding: "12px",
              fontSize: "13px", fontWeight: 500, color: "var(--brand)",
              background: "transparent", border: "none", cursor: "pointer",
            }}
          >
            Charger 30 de plus
          </button>
        )}
      </div>

      {/* FAB mobile */}
      <Link
        to="/rides/new"
        className="lg:hidden"
        style={{
          position: "fixed", bottom: "76px", right: "16px",
          width: 48, height: 48,
          background: "var(--brand)",
          borderRadius: "12px",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "var(--shadow-md)",
          zIndex: 40,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </Link>
    </Layout>
  );
}

function localDateStr(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function groupByDate(rides) {
  const today = localDateStr(new Date().toISOString());
  const yesterday = localDateStr(new Date(Date.now() - 86400000).toISOString());
  const groups = {};
  rides.forEach(r => {
    const d = localDateStr(r.ride_at || r.created_at);
    const key = d === today ? "Aujourd'hui" : d === yesterday ? "Hier"
      : new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  return Object.entries(groups).map(([label, rides]) => ({ label, rides }));
}
