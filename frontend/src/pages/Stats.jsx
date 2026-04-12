import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { SkeletonCard, SkeletonStatCard } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { getStatsByPeriod } from "../api/stats";
import { exportRidesCSV } from "../api/rides";

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const TYPE_LABELS = { cpam: "CPAM", mutuelle: "Mutuelle", cash: "Espèces", card: "Carte", virement: "Virement", cheque: "Chèque" };

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

  return (
    <div className="max-w-lg mx-auto pb-20 bg-gray-50 min-h-screen">
      <TopBar company={company?.name || "myPilot"} />
      <div className="p-4">
        {/* Header + navigation mois */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-lg font-black text-[#1a1a2e]">Statistiques</p>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <span className="text-xs bg-[#3fa9f5]/10 text-[#3fa9f5] font-semibold px-3 py-1 rounded-full">
              {MONTHS[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
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
              className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center disabled:opacity-50">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3fa9f5" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <SkeletonCard className="h-28" />
            <SkeletonCard className="h-40" />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
        )}

        {!isLoading && stats && (
          <>
            {/* CA principal */}
            <div className="bg-[#3fa9f5] rounded-xl p-4 mb-4">
              <p className="text-white/80 text-xs font-medium mb-1">Chiffre d'affaires</p>
              <p className="text-3xl font-black text-white">{stats.ca_total.toLocaleString("fr-FR")}€</p>
              <div className="flex items-center gap-3 mt-2">
                {growth !== null && (
                  <span className="text-white/80 text-xs">
                    {growth >= 0 ? "↑" : "↓"} {Math.abs(growth)}% vs mois dernier
                  </span>
                )}
                <span className="text-white/60 text-xs">
                  {stats.rides_count} courses
                  {stats.avg_ride > 0 && ` · ${stats.avg_ride.toFixed(0)}€ moy.`}
                </span>
              </div>
            </div>

            {/* Barres par semaine */}
            {stats.by_week.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Par semaine</p>
                <div className="flex items-end gap-3 h-28">
                  {stats.by_week.map((w, i) => {
                    const label = w.ca >= 1000 ? `${(w.ca / 1000).toFixed(1)}k` : `${Math.round(w.ca)}€`;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-400 truncate w-full text-center">{label}</span>
                        <div className="w-full rounded-t-md bg-[#3fa9f5]"
                          style={{ height: `${Math.max(4, (w.ca / maxWeekCa) * 72)}px` }} />
                        <span className="text-xs font-semibold text-gray-500">S{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Répartition par type */}
            {stats.by_type.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Répartition</p>
                {stats.by_type.map((t) => {
                  const pct = Math.round((t.ca / totalTypeCa) * 100);
                  return (
                    <div key={t.type} className="mb-2.5 last:mb-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-[#1a1a2e]">{TYPE_LABELS[t.type] || t.type}</span>
                        <span className="text-gray-400">{t.ca.toLocaleString("fr-FR")}€ · {pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#3fa9f5] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Classement chauffeurs */}
            {stats.by_driver.length > 0 && (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Classement chauffeurs</p>
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                  {stats.by_driver.map((driver, i) => (
                    <div key={driver.name}
                      className={`flex items-center gap-3 px-4 py-3 ${i < stats.by_driver.length - 1 ? "border-b border-gray-50" : ""}`}>
                      <span className={`text-sm font-black w-5 text-center ${i === 0 ? "text-[#3fa9f5]" : "text-gray-300"}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#1a1a2e]">{driver.name}</p>
                        <p className="text-xs text-gray-400">{driver.rides} course{driver.rides !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="text-sm font-bold text-[#1a1a2e]">{driver.ca.toLocaleString("fr-FR")}€</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {stats.rides_count === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
                <p className="text-sm">Aucune donnée pour {MONTHS[month - 1]} {year}</p>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
