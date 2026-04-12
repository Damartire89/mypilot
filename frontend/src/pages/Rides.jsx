import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { SkeletonRideList } from "../components/Skeleton";
import { getRides, updateRide, exportRidesCSV } from "../api/rides";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const PAYMENT_LABELS = { cpam: "CPAM", mutuelle: "Mutuelle", cash: "Espèces", card: "Carte", virement: "Virement", cheque: "Chèque" };
const PAYMENT_COLORS = {
  cpam: "bg-blue-100 text-blue-600",
  mutuelle: "bg-purple-100 text-purple-600",
  cash: "bg-gray-100 text-gray-600",
  card: "bg-gray-100 text-gray-600",
  virement: "bg-indigo-100 text-indigo-600",
  cheque: "bg-pink-100 text-pink-600",
};

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "today", label: "Aujourd'hui" },
  { key: "pending", label: "En attente" },
  { key: "cpam", label: "CPAM" },
  { key: "cash", label: "Espèces" },
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
  if (activeFilter === "cpam") queryParams.payment_type = "cpam";
  if (activeFilter === "cash") queryParams.payment_type = "cash";
  if (activeFilter === "today") queryParams.date_from = new Date().toISOString().slice(0, 10);

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
    <div className="max-w-lg mx-auto pb-20 bg-gray-50 min-h-screen">
      <TopBar company={company?.name || "myPilot"} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-lg font-black text-[#1a1a2e]">Courses</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{rides.length} course{rides.length !== 1 ? "s" : ""}</span>
            <button
              onClick={async () => {
                setExporting(true);
                try { await exportRidesCSV(queryParams); } finally { setExporting(false); }
              }}
              disabled={exporting}
              className="flex items-center gap-1 text-xs font-semibold text-[#3fa9f5] border border-[#3fa9f5]/30 px-2.5 py-1 rounded-full disabled:opacity-50">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {exporting ? "..." : "CSV"}
            </button>
          </div>
        </div>

        {/* Filtres rapides */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => handleFilterChange(f.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeFilter === f.key
                  ? "bg-[#3fa9f5] text-white border-[#3fa9f5]"
                  : "bg-white text-gray-500 border-gray-200"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && <SkeletonRideList rows={6} />}

        {!isLoading && rides.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
            <p className="text-sm">Aucune course</p>
            <Link to="/rides/new" className="text-[#3fa9f5] text-xs font-semibold mt-2 inline-block">+ Ajouter une course</Link>
          </div>
        )}

        {!isLoading && grouped.map(({ label, rides: group }) => (
          <div key={label} className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              {group.map((ride, i) => (
                <div key={ride.id}
                  className={`px-4 py-3 ${i < group.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => ride.status === "pending" && markPaid.mutate(ride.id)}
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 transition-all ${
                        ride.status === "paid" ? "bg-green-400" : "bg-orange-400 hover:bg-green-400 cursor-pointer"
                      }`}
                      title={ride.status === "pending" ? "Marquer comme payé" : "Payé"}
                    />
                    <div className="flex-1 min-w-0" onClick={() => navigate(`/rides/${ride.id}/edit`)}
                      style={{ cursor: "pointer" }}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#1a1a2e] truncate">
                          {ride.client_name || "Course sans nom"}
                        </p>
                        <span className="text-sm font-bold text-[#1a1a2e] flex-shrink-0">
                          {Number(ride.amount).toFixed(0)}€
                        </span>
                      </div>
                      {(ride.origin || ride.destination) && (
                        <p className="text-xs text-gray-400 truncate">
                          {ride.origin}{ride.destination ? ` → ${ride.destination}` : ""}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {ride.ride_at && (
                          <span className="text-xs text-gray-400">
                            {new Date(ride.ride_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PAYMENT_COLORS[ride.payment_type] || "bg-gray-100 text-gray-500"}`}>
                          {PAYMENT_LABELS[ride.payment_type] || ride.payment_type}
                        </span>
                        {ride.status === "pending" && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-orange-100 text-orange-600">
                            En attente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Charger plus */}
        {!isLoading && rides.length >= limit && (
          <button
            onClick={() => setLimit(l => l + 30)}
            className="w-full text-center text-xs text-[#3fa9f5] font-semibold py-3">
            Charger 30 de plus
          </button>
        )}
      </div>

      {/* FAB nouvelle course */}
      <Link to="/rides/new"
        className="fixed bottom-20 right-4 w-12 h-12 bg-[#3fa9f5] rounded-full flex items-center justify-center shadow-lg z-40">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </Link>

      <BottomNav />
    </div>
  );
}

function localDateStr(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  // Utilise la timezone locale pour éviter le décalage UTC
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
