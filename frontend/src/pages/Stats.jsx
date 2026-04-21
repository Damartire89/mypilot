import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { SkeletonCard, SkeletonStatCard } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { getStatsByPeriod } from "../api/stats";
import { exportRidesCSV } from "../api/rides";

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const TYPE_LABELS = { cpam: "CPAM", mutuelle: "Mutuelle", cash: "Espèces", card: "Carte", virement: "Virement", cheque: "Chèque" };
const TYPE_COLORS = {
  cpam:     "var(--brand)",
  mutuelle: "var(--cat-mutuelle)",
  cash:     "var(--text-3)",
  card:     "var(--text-2)",
  virement: "var(--cat-virement-chart)",
  cheque:   "var(--cat-cheque)",
};

export default function Stats() {
  const { company } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [exporting, setExporting] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats-monthly", year, month],
    queryFn: () => getStatsByPeriod(year, month),
  });

  const growth = stats?.ca_prev_month > 0
    ? (((stats.ca_total - stats.ca_prev_month) / stats.ca_prev_month) * 100).toFixed(1)
    : null;

  const maxWeekCa = Math.max(...(stats?.by_week?.map(w => w.ca) || [1]));
  const totalTypeCa = stats?.by_type?.reduce((s, t) => s + t.ca, 0) || 1;

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

  return (
    <Layout title="Statistiques">
      <div className="max-w-2xl lg:max-w-[1280px] mx-auto p-4 lg:p-8 animate-fade-in">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>Statistiques</p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={prevMonth}
              style={{ width: 30, height: 30, borderRadius: "7px", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--surface)"}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand)", background: "var(--brand-light)", padding: "5px 12px", borderRadius: "99px", minWidth: "120px", textAlign: "center" }}>
              {MONTHS[month - 1]} {year}
            </span>
            <button
              onClick={nextMonth}
              disabled={isCurrentMonth}
              style={{ width: 30, height: 30, borderRadius: "7px", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: isCurrentMonth ? "default" : "pointer", opacity: isCurrentMonth ? 0.4 : 1 }}
              onMouseEnter={e => { if (!isCurrentMonth) e.currentTarget.style.background = "var(--surface-2)"; }}
              onMouseLeave={e => e.currentTarget.style.background = "var(--surface)"}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <button
              onClick={async () => {
                const firstDay = `${year}-${String(month).padStart(2,"0")}-01`;
                const lastDay = new Date(year, month, 0).toISOString().slice(0,10);
                setExporting(true);
                try { await exportRidesCSV({ date_from: firstDay, date_to: lastDay }); }
                finally { setExporting(false); }
              }}
              disabled={exporting}
              title="Exporter en CSV"
              style={{ width: 30, height: 30, borderRadius: "7px", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: exporting ? 0.5 : 1 }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--surface)"}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>
        </div>

        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <SkeletonCard style={{ height: 100 }} />
            <SkeletonCard style={{ height: 150 }} />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
        )}

        {!isLoading && stats && (
          <div className="stats-grid">
            <div className="stats-col">
            {/* CA principal */}
            <div style={{
              background: "var(--brand)", borderRadius: "14px", padding: "20px 20px 18px", marginBottom: "12px",
            }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: 500, margin: "0 0 4px" }}>Chiffre d'affaires</p>
              <p style={{ color: "white", fontSize: "32px", fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
                {stats.ca_total.toLocaleString("fr-FR")}€
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
                  {stats.rides_count} course{stats.rides_count !== 1 ? "s" : ""}
                  {stats.avg_ride > 0 && ` · ${stats.avg_ride.toFixed(0)}€ moy.`}
                </span>
              </div>
            </div>

            {/* Barres semaine */}
            {stats.by_week.length > 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>Par semaine</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "100px" }}>
                  {stats.by_week.map((w, i) => {
                    const label = w.ca >= 1000 ? `${(w.ca / 1000).toFixed(1)}k` : `${Math.round(w.ca)}`;
                    const barH = Math.max(6, (w.ca / maxWeekCa) * 72);
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "10.5px", color: "var(--text-3)", lineHeight: 1 }}>{label}</span>
                        <div style={{ width: "100%", height: barH, borderRadius: "4px 4px 0 0", background: "var(--brand)", opacity: 0.85 + (i === stats.by_week.length - 1 ? 0.15 : 0) }} />
                        <span style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--text-3)" }}>S{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            </div>
            <div className="stats-col">
            {/* Répartition */}
            {stats.by_type.length > 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>Répartition</p>
                {stats.by_type.map((t) => {
                  const pct = Math.round((t.ca / totalTypeCa) * 100);
                  const color = TYPE_COLORS[t.type] || "var(--text-3)";
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

            {/* Classement chauffeurs */}
            {stats.by_driver.length > 0 && (
              <>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Classement chauffeurs</p>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                  {stats.by_driver.map((driver, i) => (
                    <div key={driver.name} style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "12px 14px",
                      borderBottom: i < stats.by_driver.length - 1 ? "1px solid var(--border)" : "none",
                    }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, width: 20, textAlign: "center", color: i === 0 ? "var(--brand)" : "var(--text-3)", flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)", margin: 0 }}>{driver.name}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "2px 0 0" }}>{driver.rides} course{driver.rides !== 1 ? "s" : ""}</p>
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
                        {driver.ca.toLocaleString("fr-FR")}€
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {stats.rides_count === 0 && (
              <EmptyState
                icon="stats"
                title={`Aucune course en ${MONTHS[month - 1]} ${year}`}
                subtitle="Enregistrez des courses pour voir apparaître votre CA, les graphiques hebdomadaires et la répartition par type de paiement."
                linkTo="/rides/new"
                linkLabel="+ Enregistrer une course"
              />
            )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
