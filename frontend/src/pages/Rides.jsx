import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { SkeletonRideList } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { getRides, updateRide, exportRidesCSV } from "../api/rides";
import { getDrivers } from "../api/drivers";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const PAYMENT_LABELS = { cpam: "CPAM", mutuelle: "Mutuelle", cash: "Espèces", card: "Carte", virement: "Virement", cheque: "Chèque" };
const PAYMENT_STYLES = {
  cpam:      { bg: "var(--brand-light)",    color: "var(--brand)" },
  mutuelle:  { bg: "var(--cat-mutuelle-bg)", color: "var(--cat-mutuelle)" },
  cash:      { bg: "var(--surface-2)",       color: "var(--text-2)" },
  card:      { bg: "var(--surface-2)",       color: "var(--text-2)" },
  virement:  { bg: "var(--brand-light)",    color: "var(--brand)" },
  cheque:    { bg: "var(--cat-cheque-bg)",  color: "var(--cat-cheque)" },
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
  const [selectedDriver, setSelectedDriver] = useState("");
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [limit, setLimit] = useState(30);

  const { data: drivers = [] } = useQuery({ queryKey: ["drivers"], queryFn: getDrivers, staleTime: 60000 });

  const queryParams = {};
  if (activeFilter === "pending") queryParams.status = "pending";
  if (activeFilter === "cpam")    queryParams.payment_type = "cpam";
  if (activeFilter === "cash")    queryParams.payment_type = "cash";
  if (activeFilter === "today")   queryParams.date_from = new Date().toISOString().slice(0, 10);
  if (selectedDriver)             queryParams.driver_id = selectedDriver;

  const { data: rides = [], isLoading } = useQuery({
    queryKey: ["rides", queryParams, limit],
    queryFn: () => getRides({ ...queryParams, limit }),
  });

  const handleFilterChange = (key) => { setActiveFilter(key); setLimit(30); setSearch(""); };

  const filteredRides = search.trim()
    ? rides.filter(r => {
        const q = search.toLowerCase();
        return (
          (r.client_name || "").toLowerCase().includes(q) ||
          (r.origin || "").toLowerCase().includes(q) ||
          (r.destination || "").toLowerCase().includes(q)
        );
      })
    : rides;

  const markPaid = useMutation({
    mutationFn: (id) => updateRide(id, { status: "paid" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rides"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast("Course marquée comme payée", "success");
    },
    onError: () => toast("Erreur lors de la mise à jour", "error"),
  });

  return (
    <Layout title="Courses">
      <div className="max-w-2xl lg:max-w-[1440px] mx-auto p-4 lg:p-8 animate-fade-in">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>Courses</p>
            <span style={{
              fontSize: "11px", fontWeight: 600,
              padding: "2px 8px", borderRadius: "99px",
              background: "var(--surface-2)", color: "var(--text-3)",
            }}>
              {search ? filteredRides.length : rides.length}
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
        <div style={{ display: "flex", gap: "6px", marginBottom: drivers.length > 0 ? "8px" : "16px", overflowX: "auto", paddingBottom: "4px", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}>
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

        {/* Recherche */}
        <div style={{ position: "relative", marginBottom: "10px" }}>
          <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            placeholder="Rechercher un client, trajet..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "7px 12px 7px 30px",
              border: search ? "1px solid var(--brand)" : "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "13px",
              background: "var(--surface)",
              color: "var(--text)",
              outline: "none",
            }}
            onFocus={e => e.target.style.borderColor = "var(--brand)"}
            onBlur={e => { if (!search) e.target.style.borderColor = "var(--border)"; }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: "2px", lineHeight: 1 }}>
              ×
            </button>
          )}
        </div>

        {/* Filtre chauffeur */}
        {drivers.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <select
              value={selectedDriver}
              onChange={e => { setSelectedDriver(e.target.value); setLimit(30); }}
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                border: selectedDriver ? "1px solid var(--brand)" : "1px solid var(--border)",
                background: selectedDriver ? "var(--brand-light)" : "var(--surface)",
                color: selectedDriver ? "var(--brand)" : "var(--text-2)",
                fontSize: "12.5px",
                fontWeight: selectedDriver ? 600 : 500,
                cursor: "pointer",
                outline: "none",
                minWidth: "160px",
              }}
            >
              <option value="">Tous les chauffeurs</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}

        {isLoading && <SkeletonRideList rows={6} />}

        {!isLoading && filteredRides.length === 0 && (
          <EmptyState
            icon="rides"
            title={search ? `Aucun résultat pour "${search}"` : activeFilter === "all" ? "Aucune course enregistrée" : "Aucune course pour ce filtre"}
            subtitle={search ? "Essayez un autre terme de recherche." : activeFilter === "all" ? "Chaque course enregistrée alimente vos statistiques et votre CA en temps réel." : "Essayez un autre filtre ou ajoutez une nouvelle course."}
            linkTo={!search && activeFilter === "all" ? "/rides/new" : undefined}
            linkLabel={!search && activeFilter === "all" ? "+ Enregistrer une course" : undefined}
          />
        )}

        {/* Mobile / tablette : liste groupée par date */}
        {!isLoading && (
          <div className="lg:hidden">
            {groupByDate(filteredRides).map(({ label, rides: group }) => (
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
                          {ride.notes && (
                            <p style={{ fontSize: "11px", color: "var(--text-3)", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic" }}>
                              {ride.notes}
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
          </div>
        )}

        {/* Desktop : vraie table */}
        {!isLoading && filteredRides.length > 0 && (
          <div className="hidden lg:block" style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "14px", overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead style={{ background: "var(--surface-2)" }}>
                <tr>
                  <th style={thRides}>Statut</th>
                  <th style={thRides}>Client</th>
                  <th style={thRides}>Trajet</th>
                  <th style={thRides}>Date</th>
                  <th style={thRides}>Paiement</th>
                  <th style={{ ...thRides, textAlign: "right" }}>Montant</th>
                  <th style={{ ...thRides, width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredRides.map((ride, i) => {
                  const ps = PAYMENT_STYLES[ride.payment_type] || { bg: "var(--surface-2)", color: "var(--text-2)" };
                  const isLast = i === filteredRides.length - 1;
                  const d = ride.ride_at ? new Date(ride.ride_at) : null;
                  return (
                    <tr
                      key={ride.id}
                      onClick={() => navigate(`/rides/${ride.id}/edit`)}
                      style={{ cursor: "pointer", transition: "background 120ms" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ ...tdRides, borderBottom: isLast ? "none" : "1px solid var(--border)", width: 70 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (ride.status === "pending") markPaid.mutate(ride.id); }}
                          title={ride.status === "pending" ? "Marquer comme payé" : "Payé"}
                          style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: ride.status === "paid" ? "var(--success)" : "var(--warning)",
                            border: "none", cursor: ride.status === "pending" ? "pointer" : "default",
                            padding: 0, verticalAlign: "middle",
                          }}
                        />
                      </td>
                      <td style={{ ...tdRides, fontWeight: 600, color: "var(--text)", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                        {ride.client_name || "Course sans nom"}
                      </td>
                      <td style={{ ...tdRides, color: "var(--text-2)", fontSize: "12.5px", borderBottom: isLast ? "none" : "1px solid var(--border)", maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ride.origin || "—"}{ride.destination ? ` → ${ride.destination}` : ""}
                      </td>
                      <td style={{ ...tdRides, color: "var(--text-2)", fontSize: "12.5px", borderBottom: isLast ? "none" : "1px solid var(--border)", whiteSpace: "nowrap" }}>
                        {d ? d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) : "—"}
                      </td>
                      <td style={{ ...tdRides, borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                        {ride.payment_type && (
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: "99px", background: ps.bg, color: ps.color }}>
                            {PAYMENT_LABELS[ride.payment_type] || ride.payment_type}
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdRides, textAlign: "right", fontWeight: 800, color: "var(--text)", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                        {Number(ride.amount).toFixed(0)}€
                      </td>
                      <td style={{ ...tdRides, borderBottom: isLast ? "none" : "1px solid var(--border)", textAlign: "right" }}>
                        {ride.status === "pending" && (
                          <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "2px 7px", borderRadius: "99px", background: "var(--warning-bg)", color: "var(--warning)" }}>
                            En attente
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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
        className="lg:hidden flex items-center justify-center"
        style={{
          position: "fixed", bottom: "76px", right: "16px",
          width: 48, height: 48,
          background: "var(--brand)",
          borderRadius: "12px",
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

const thRides = {
  textAlign: "left",
  padding: "10px 16px",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--text-3)",
  fontWeight: 700,
  borderBottom: "1px solid var(--border)",
};
const tdRides = {
  padding: "13px 16px",
  verticalAlign: "middle",
};

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
