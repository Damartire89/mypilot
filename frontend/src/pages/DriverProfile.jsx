import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { SkeletonCard, SkeletonStatCard, SkeletonRideList } from "../components/Skeleton";
import { getDriverStats } from "../api/drivers";

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const TYPE_LABELS = { cpam: "CPAM", mutuelle: "Mutuelle", cash: "Espèces", card: "Carte", virement: "Virement", cheque: "Chèque" };
const STATUS_STYLES = {
  active: { label: "En service",   bg: "var(--success-bg)", color: "var(--success)" },
  break:  { label: "En pause",     bg: "var(--warning-bg)", color: "var(--warning)" },
  off:    { label: "Hors service", bg: "var(--surface-2)",  color: "var(--text-3)" },
};
const PAYMENT_COLORS = {
  cpam: "var(--brand)", mutuelle: "var(--cat-mutuelle)", cash: "var(--text-3)",
  card: "var(--text-2)", virement: "var(--cat-virement-chart)", cheque: "var(--cat-cheque)",
};

export default function DriverProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["driver-stats", id, year, month],
    queryFn: () => getDriverStats(id, year, month),
    enabled: !!id,
  });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    const nowDate = new Date();
    if (year === nowDate.getFullYear() && month === nowDate.getMonth() + 1) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const growth = stats?.ca_prev_month > 0
    ? (((stats.ca_month - stats.ca_prev_month) / stats.ca_prev_month) * 100).toFixed(1)
    : null;

  const totalTypeCa = stats?.by_type?.reduce((s, t) => s + t.ca, 0) || 1;

  const driverStatus = stats?.driver?.status || "off";
  const statusStyle = STATUS_STYLES[driverStatus] || STATUS_STYLES.off;
  const initials = stats?.driver?.name
    ? stats.driver.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" });
  }

  return (
    <Layout>
      <div className="max-w-2xl lg:max-w-5xl mx-auto p-4 lg:p-8 animate-fade-in">

        {/* Bouton retour */}
        <button
          onClick={() => navigate("/drivers")}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "none", border: "none", padding: 0,
            fontSize: "12.5px", fontWeight: 500, color: "var(--text-3)",
            cursor: "pointer", marginBottom: "16px",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Équipe
        </button>

        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <SkeletonCard style={{ height: 80 }} />
            <SkeletonCard style={{ height: 112 }} />
            <SkeletonStatCard />
            <SkeletonRideList rows={4} />
          </div>
        )}

        {isError && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>Chauffeur introuvable</p>
          </div>
        )}

        {!isLoading && stats && (
          <>
            {/* Carte identité chauffeur */}
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "12px", padding: "16px", marginBottom: "12px",
              display: "flex", alignItems: "center", gap: "14px",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "12px",
                background: "var(--brand-light)", color: "var(--brand)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", fontWeight: 800, flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{stats.driver.name}</p>
                  <span style={{ fontSize: "11px", fontWeight: 500, padding: "2px 7px", borderRadius: "99px", background: statusStyle.bg, color: statusStyle.color }}>
                    {statusStyle.label}
                  </span>
                </div>
                {stats.driver.phone && (
                  <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "3px 0 0" }}>{stats.driver.phone}</p>
                )}
                {stats.driver.license_number && (
                  <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "2px 0 0" }}>{stats.driver.license_number}</p>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: "11px", color: "var(--text-3)", margin: 0 }}>Total</p>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", margin: "2px 0 0" }}>{stats.rides_total} courses</p>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand)", margin: "1px 0 0" }}>{stats.ca_total.toLocaleString("fr-FR")}€</p>
              </div>
            </div>

            {/* Navigation mois */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                Statistiques mensuelles
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={prevMonth}
                  style={{ width: 28, height: 28, borderRadius: "7px", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand)", background: "var(--brand-light)", padding: "4px 10px", borderRadius: "99px" }}>
                  {MONTHS[month - 1]} {year}
                </span>
                <button
                  onClick={nextMonth}
                  disabled={isCurrentMonth}
                  style={{ width: 28, height: 28, borderRadius: "7px", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: isCurrentMonth ? "default" : "pointer", opacity: isCurrentMonth ? 0.4 : 1 }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </div>

            {/* CA du mois */}
            <div style={{ background: "var(--brand)", borderRadius: "14px", padding: "20px 20px 18px", marginBottom: "12px" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: 500, margin: "0 0 4px" }}>Chiffre d'affaires</p>
              <p style={{ color: "white", fontSize: "32px", fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
                {stats.ca_month.toLocaleString("fr-FR")}€
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                {growth !== null && (
                  <span style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: "3px" }}>
                    {parseFloat(growth) >= 0
                      ? <span style={{ color: "#86efac" }}>↑ {Math.abs(growth)}%</span>
                      : <span style={{ color: "#fca5a5" }}>↓ {Math.abs(growth)}%</span>
                    }
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>vs mois dernier</span>
                  </span>
                )}
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
                  {stats.rides_month} course{stats.rides_month !== 1 ? "s" : ""}
                  {stats.avg_ride > 0 && ` · ${stats.avg_ride.toFixed(0)}€ moy.`}
                </span>
              </div>
            </div>

            {/* Répartition par type */}
            {stats.by_type.length > 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>Répartition paiements</p>
                {stats.by_type.map((t) => {
                  const pct = Math.round((t.ca / totalTypeCa) * 100);
                  const color = PAYMENT_COLORS[t.type] || "var(--text-3)";
                  return (
                    <div key={t.type} style={{ marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{TYPE_LABELS[t.type] || t.type}</span>
                        <span style={{ fontSize: "12.5px", color: "var(--text-3)" }}>{t.ca.toLocaleString("fr-FR")}€ · {pct}%</span>
                      </div>
                      <div style={{ height: 6, background: "var(--surface-2)", borderRadius: "99px", overflow: "hidden" }}>
                        <div style={{ height: "100%", background: color, borderRadius: "99px", width: `${pct}%`, transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Planning — jours travaillés ce mois */}
            {stats.rides.length > 0 && (() => {
              const daysInMonth = new Date(year, month, 0).getDate();
              const firstDow = new Date(year, month - 1, 1).getDay(); // 0=dim
              const startOffset = (firstDow === 0 ? 6 : firstDow - 1); // lundi=0
              const workedDays = new Set(stats.rides.map(r => {
                if (!r.ride_at) return null;
                return parseInt(new Date(r.ride_at).toLocaleDateString("fr-FR", { day: "numeric", timeZone: "Europe/Paris" }), 10);
              }).filter(Boolean));
              const today = now.getDate();
              const isThisMonth = year === now.getFullYear() && month === now.getMonth() + 1;
              return (
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
                    Jours travaillés — {workedDays.size}j
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }}>
                    {["L","M","M","J","V","S","D"].map((d, i) => (
                      <div key={i} style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-3)", paddingBottom: "4px" }}>{d}</div>
                    ))}
                    {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const worked = workedDays.has(day);
                      const isToday = isThisMonth && day === today;
                      return (
                        <div key={day} style={{
                          width: "100%", paddingBottom: "100%", position: "relative", borderRadius: "6px",
                          background: worked ? "var(--brand)" : isToday ? "var(--surface-2)" : "transparent",
                          border: isToday && !worked ? "1px solid var(--brand)" : "none",
                        }}>
                          <span style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "10px", fontWeight: worked ? 700 : 400,
                            color: worked ? "white" : isToday ? "var(--brand)" : "var(--text-3)",
                          }}>
                            {day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Liste des courses */}
            {stats.rides.length > 0 && (
              <>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
                  Courses du mois ({stats.rides.length})
                </p>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                  {stats.rides.map((ride, i) => (
                    <div
                      key={ride.id}
                      onClick={() => navigate(`/rides/${ride.id}/edit`)}
                      style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "12px 14px", cursor: "pointer",
                        borderBottom: i < stats.rides.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                        background: ride.status === "paid" ? "var(--success)" : "var(--warning)",
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ride.client_name || "Client non renseigné"}
                        </p>
                        {(ride.origin || ride.destination) && (
                          <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ride.origin && ride.destination ? `${ride.origin} → ${ride.destination}` : ride.origin || ride.destination}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{ride.amount.toLocaleString("fr-FR")}€</p>
                        <p style={{ fontSize: "11px", color: "var(--text-3)", margin: "2px 0 0" }}>{formatDate(ride.ride_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {stats.rides_month === 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "40px 24px", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>Aucune course pour {MONTHS[month - 1]} {year}</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
