import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { SkeletonKpiCards, SkeletonRideList } from "../components/Skeleton";
import { getStatsSummary, getRides } from "../api/rides";
import { getVehicles } from "../api/vehicles";
import { useAuth } from "../context/AuthContext";

function KpiCard({ label, value, delta, alert }) {
  return (
    <div className={`rounded-xl p-4 ${alert ? "bg-red-50 border border-red-100" : "bg-[#3fa9f5] border border-[#2d9ae8]"}`}>
      <div className={`text-xs mb-1 font-medium ${alert ? "text-red-400" : "text-white/80"}`}>{label}</div>
      <div className={`text-2xl font-black ${alert ? "text-red-500" : "text-white"}`}>{value}</div>
      {delta && (
        <div className={`text-xs mt-1 font-semibold ${alert ? "text-red-400" : "text-white/70"}`}>{delta}</div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { company } = useAuth();
  const day = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["stats"], queryFn: getStatsSummary, refetchInterval: 30000 });
  const { data: rides = [], isLoading: ridesLoading } = useQuery({ queryKey: ["rides", { limit: 4 }], queryFn: () => getRides({ limit: 4 }) });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: getVehicles });
  const isLoading = statsLoading || ridesLoading;

  const vehicleAlerts = vehicles.filter(v => v.ct_alert || v.insurance_alert);
  const availableVehicles = vehicles.filter(v => v.status === "available").length;
  const companyName = company?.name || "myPilot";

  return (
    <div className="max-w-lg mx-auto pb-20 bg-gray-50 min-h-screen">
      <TopBar company={companyName} />
      <div className="p-4">
        <div className="flex items-center justify-between mt-1 mb-3">
          <div>
            <p className="text-sm font-semibold text-[#1a1a2e]">{companyName}</p>
            <p className="text-xs text-gray-400 capitalize">{day}</p>
          </div>
          <Link to="/rides/new"
            className="flex items-center gap-1.5 bg-[#3fa9f5] text-white text-xs font-bold px-3 py-2 rounded-full shadow-sm">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouvelle course
          </Link>
        </div>

        {/* Alertes */}
        {(stats?.unpaid_count > 0 || vehicleAlerts.length > 0) && (
          <div className="space-y-2 mb-4">
            {stats?.unpaid_count > 0 && (
              <Link to="/rides" className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 text-sm text-orange-700">
                <span>⚠️</span>
                <span>{stats.unpaid_count} facture{stats.unpaid_count > 1 ? "s" : ""} en attente — <strong>{stats.unpaid_amount.toLocaleString("fr-FR")}€</strong></span>
              </Link>
            )}
            {vehicleAlerts.length > 0 && (
              <Link to="/vehicles" className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
                <span>🚗</span>
                <span>{vehicleAlerts.length} véhicule{vehicleAlerts.length > 1 ? "s" : ""} avec documents à renouveler</span>
              </Link>
            )}
          </div>
        )}

        {/* KPIs */}
        {isLoading ? <SkeletonKpiCards /> : <div className="grid grid-cols-2 gap-3 mb-5">
          <KpiCard
            label="CA ce mois"
            value={`${(stats?.ca_month || 0).toLocaleString("fr-FR")}€`}
          />
          <KpiCard
            label="Courses aujourd'hui"
            value={stats?.rides_today ?? "—"}
          />
          <KpiCard
            label="Flotte disponible"
            value={vehicles.length ? `${availableVehicles} / ${vehicles.length}` : "—"}
          />
          <KpiCard
            label="Factures impayées"
            value={`${(stats?.unpaid_amount || 0).toLocaleString("fr-FR")}€`}
            delta={stats?.unpaid_count ? `${stats.unpaid_count} factures` : "Aucune"}
            alert={stats?.unpaid_count > 0}
          />
        </div>}

        {/* Courses récentes */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Courses récentes</p>
        {isLoading ? <SkeletonRideList rows={3} /> : rides.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-400 text-sm shadow-sm">
            Aucune course enregistrée
            <br />
            <Link to="/rides" className="text-[#3fa9f5] font-semibold text-xs mt-2 inline-block">Ajouter une course →</Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            {rides.map((ride, i) => (
              <div key={ride.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < rides.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ride.status === "paid" ? "bg-green-400" : "bg-orange-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a2e] truncate">{ride.client_name || "Course sans nom"}</p>
                  <p className="text-xs text-gray-400 truncate">{ride.origin}{ride.destination ? ` → ${ride.destination}` : ""}</p>
                </div>
                <span className="text-sm font-bold text-[#1a1a2e]">{Number(ride.amount).toFixed(0)}€</span>
              </div>
            ))}
          </div>
        )}

        <Link to="/rides" className="block text-center text-xs text-[#3fa9f5] font-semibold mt-3">
          Voir toutes les courses →
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
