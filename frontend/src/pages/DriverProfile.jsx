import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { SkeletonCard, SkeletonStatCard, SkeletonRideList } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { getDriverStats } from "../api/drivers";

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const TYPE_LABELS = { cpam: "CPAM", mutuelle: "Mutuelle", cash: "Espèces", card: "Carte", virement: "Virement", cheque: "Chèque" };
const STATUS_STYLES = {
  active: { label: "En service", badge: "bg-green-50 text-green-600" },
  break:  { label: "En pause",   badge: "bg-orange-50 text-orange-600" },
  off:    { label: "Hors service", badge: "bg-gray-100 text-gray-500" },
};
const PAYMENT_COLORS = {
  cpam: "#3fa9f5", mutuelle: "#8b5cf6", cash: "#10b981",
  card: "#f59e0b", virement: "#6366f1", cheque: "#ec4899",
};

export default function DriverProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { company } = useAuth();
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
    // Évite le décalage UTC : on prend directement les composants de la chaîne ISO
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" });
  }

  return (
    <div className="max-w-lg mx-auto pb-20 bg-gray-50 min-h-screen">
      <TopBar company={company?.name || "myPilot"} />
      <div className="p-4">

        {/* Bouton retour */}
        <button onClick={() => navigate("/drivers")}
          className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Équipe
        </button>

        {isLoading && (
          <div className="space-y-4">
            <SkeletonCard className="h-20" />
            <SkeletonCard className="h-28" />
            <SkeletonStatCard />
            <SkeletonRideList rows={4} />
          </div>
        )}

        {isError && (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
            <p className="text-sm">Chauffeur introuvable</p>
          </div>
        )}

        {!isLoading && stats && (
          <>
            {/* Carte identité chauffeur */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#3fa9f5]/15 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-black text-[#3fa9f5]">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-black text-[#1a1a2e]">{stats.driver.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusStyle.badge}`}>
                    {statusStyle.label}
                  </span>
                  {stats.driver.phone && (
                    <span className="text-xs text-gray-400">{stats.driver.phone}</span>
                  )}
                </div>
                {stats.driver.license_number && (
                  <p className="text-xs text-gray-400 mt-0.5">{stats.driver.license_number}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-sm font-black text-[#1a1a2e]">{stats.rides_total} courses</p>
                <p className="text-xs font-semibold text-[#3fa9f5]">{stats.ca_total.toLocaleString("fr-FR")}€</p>
              </div>
            </div>

            {/* Navigation mois */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Statistiques mensuelles</p>
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
              </div>
            </div>

            {/* KPIs du mois */}
            <div className="bg-[#3fa9f5] rounded-xl p-4 mb-4">
              <p className="text-white/80 text-xs font-medium mb-1">Chiffre d'affaires</p>
              <p className="text-3xl font-black text-white">{stats.ca_month.toLocaleString("fr-FR")}€</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {growth !== null && (
                  <span className="text-white/80 text-xs">
                    {growth >= 0 ? "↑" : "↓"} {Math.abs(growth)}% vs mois dernier
                  </span>
                )}
                <span className="text-white/60 text-xs">
                  {stats.rides_month} course{stats.rides_month !== 1 ? "s" : ""}
                  {stats.avg_ride > 0 && ` · ${stats.avg_ride.toFixed(0)}€ moy.`}
                </span>
              </div>
            </div>

            {/* Répartition par type */}
            {stats.by_type.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Répartition paiements</p>
                {stats.by_type.map((t) => {
                  const pct = Math.round((t.ca / totalTypeCa) * 100);
                  const color = PAYMENT_COLORS[t.type] || "#3fa9f5";
                  return (
                    <div key={t.type} className="mb-2.5 last:mb-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-[#1a1a2e]">{TYPE_LABELS[t.type] || t.type}</span>
                        <span className="text-gray-400">{t.ca.toLocaleString("fr-FR")}€ · {pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Liste des courses */}
            {stats.rides.length > 0 && (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                  Courses du mois ({stats.rides.length})
                </p>
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                  {stats.rides.map((ride, i) => (
                    <div key={ride.id}
                      onClick={() => navigate(`/rides/${ride.id}/edit`)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-gray-50 ${
                        i < stats.rides.length - 1 ? "border-b border-gray-50" : ""
                      }`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1a1a2e] truncate">
                          {ride.client_name || "Client non renseigné"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {ride.origin && ride.destination
                            ? `${ride.origin} → ${ride.destination}`
                            : ride.origin || ride.destination || "Trajet non renseigné"}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#1a1a2e]">{ride.amount.toLocaleString("fr-FR")}€</p>
                        <p className="text-xs text-gray-400">{formatDate(ride.ride_at)}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        ride.status === "paid" ? "bg-green-400" : "bg-orange-400"
                      }`} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {stats.rides_month === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
                <p className="text-sm">Aucune course pour {MONTHS[month - 1]} {year}</p>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
