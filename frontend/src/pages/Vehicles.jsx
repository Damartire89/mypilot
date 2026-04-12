import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { SkeletonList } from "../components/Skeleton";
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from "../api/vehicles";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const STATUS = {
  available: { label: "Disponible", dot: "bg-green-400", badge: "bg-green-50 text-green-600" },
  in_use: { label: "En course", dot: "bg-blue-400", badge: "bg-blue-50 text-blue-600" },
  maintenance: { label: "Maintenance", dot: "bg-orange-400", badge: "bg-orange-50 text-orange-600" },
};

function alertLabel(alert) {
  if (!alert) return null;
  if (alert === "expired") return { text: "Expiré !", color: "text-red-500 bg-red-50" };
  const days = parseInt(alert.split("_").pop());
  if (days === 0) return { text: "Expire aujourd'hui !", color: "text-red-500 bg-red-50" };
  return { text: `Expire dans ${days}j`, color: days <= 7 ? "text-red-500 bg-red-50" : "text-orange-500 bg-orange-50" };
}

function VehicleModal({ vehicle, onClose, onSave }) {
  const [form, setForm] = useState({
    plate: vehicle?.plate || "",
    brand: vehicle?.brand || "",
    model: vehicle?.model || "",
    year: vehicle?.year || "",
    status: vehicle?.status || "available",
    ct_expiry: vehicle?.ct_expiry || "",
    insurance_expiry: vehicle?.insurance_expiry || "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <p className="text-base font-black text-[#1a1a2e] mb-4">{vehicle ? "Modifier le véhicule" : "Nouveau véhicule"}</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Immatriculation *</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5] uppercase"
              value={form.plate} onChange={e => set("plate", e.target.value.toUpperCase())}
              placeholder="AB-123-CD" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Marque</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5]"
                value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="Renault" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Modèle</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5]"
                value={form.model} onChange={e => set("model", e.target.value)} placeholder="Trafic" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Année</label>
            <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5]"
              value={form.year} onChange={e => set("year", e.target.value)}
              placeholder="2023" min="1990" max="2030" />
          </div>
          {vehicle && (
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Statut</label>
              <div className="flex gap-2">
                {Object.entries(STATUS).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => set("status", k)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      form.status === k ? `${v.badge} border-current` : "border-gray-200 text-gray-400"
                    }`}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Documents & alertes</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Contrôle technique</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5]"
                  value={form.ct_expiry} onChange={e => set("ct_expiry", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Expiration assurance</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5]"
                  value={form.insurance_expiry} onChange={e => set("insurance_expiry", e.target.value)} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-500">
            Annuler
          </button>
          <button onClick={() => onSave(form)} disabled={!form.plate}
            className="flex-1 bg-[#3fa9f5] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-50">
            {vehicle ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Vehicles() {
  const { company } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [modal, setModal] = useState(null);

  const { data: vehicles = [], isLoading } = useQuery({ queryKey: ["vehicles"], queryFn: getVehicles });

  const addMutation = useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      setModal(null);
      toast("Véhicule ajouté", "success");
    },
    onError: () => toast("Erreur lors de l'ajout", "error"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => updateVehicle(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      setModal(null);
      toast("Véhicule mis à jour", "success");
    },
    onError: () => toast("Erreur lors de la modification", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast("Véhicule supprimé", "success");
    },
    onError: () => toast("Erreur lors de la suppression", "error"),
  });

  const handleSave = (form) => {
    const data = { ...form };
    if (!data.ct_expiry) delete data.ct_expiry;
    if (!data.insurance_expiry) delete data.insurance_expiry;
    if (!data.year) delete data.year;
    else data.year = parseInt(data.year);

    if (modal === "new") {
      addMutation.mutate(data);
    } else {
      editMutation.mutate({ id: modal.id, data });
    }
  };

  const available = vehicles.filter(v => v.status === "available").length;
  const inUse = vehicles.filter(v => v.status === "in_use").length;
  const maintenance = vehicles.filter(v => v.status === "maintenance").length;

  const hasAlerts = vehicles.filter(v => v.ct_alert || v.insurance_alert);

  return (
    <div className="max-w-lg mx-auto pb-20 bg-gray-50 min-h-screen">
      <TopBar company={company?.name || "myPilot"} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-lg font-black text-[#1a1a2e]">Flotte</p>
          <button onClick={() => setModal("new")}
            className="bg-[#3fa9f5] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Ajouter
          </button>
        </div>

        {/* Résumé flotte */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-[#3fa9f5] rounded-xl p-3 text-center">
            <p className="text-xl font-black text-white">{available}</p>
            <p className="text-xs text-white/80 font-medium">Disponibles</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-black text-blue-500">{inUse}</p>
            <p className="text-xs text-gray-400 font-medium">En course</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-black text-orange-400">{maintenance}</p>
            <p className="text-xs text-gray-400 font-medium">Maintenance</p>
          </div>
        </div>

        {/* Alertes documents */}
        {hasAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
            <p className="text-xs font-bold text-red-600 mb-2">Documents à renouveler</p>
            {hasAlerts.map(v => (
              <div key={v.id} className="text-xs text-red-500 flex items-center gap-2 mb-1">
                <span className="font-semibold">{v.plate}</span>
                {v.ct_alert && <span className="bg-red-100 px-2 py-0.5 rounded-full">CT: {alertLabel(v.ct_alert)?.text}</span>}
                {v.insurance_alert && <span className="bg-red-100 px-2 py-0.5 rounded-full">Assurance: {alertLabel(v.insurance_alert)?.text}</span>}
              </div>
            ))}
          </div>
        )}

        {isLoading && <SkeletonList rows={3} />}

        {!isLoading && vehicles.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h5l3 5v3h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <p className="text-sm mb-2">Aucun véhicule enregistré</p>
            <button onClick={() => setModal("new")} className="text-[#3fa9f5] text-xs font-semibold">
              + Ajouter le premier véhicule
            </button>
          </div>
        )}

        {vehicles.length > 0 && (
          <>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Véhicules ({vehicles.length})</p>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              {vehicles.map((vehicle, i) => {
                const s = STATUS[vehicle.status] || STATUS.available;
                const ctAlert = alertLabel(vehicle.ct_alert);
                const insAlert = alertLabel(vehicle.insurance_alert);
                return (
                  <div key={vehicle.id}
                    className={`px-4 py-3.5 ${i < vehicles.length - 1 ? "border-b border-gray-50" : ""}`}>
                    <div className="flex items-start gap-3">
                      {/* Icône voiture */}
                      <div className="w-10 h-10 rounded-xl bg-[#3fa9f5]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3fa9f5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h5l3 5v3h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-[#1a1a2e] tracking-wide">{vehicle.plate}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.badge}`}>
                            {s.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" · ")}
                        </p>
                        {(ctAlert || insAlert) && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {ctAlert && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ctAlert.color}`}>
                                CT: {ctAlert.text}
                              </span>
                            )}
                            {insAlert && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${insAlert.color}`}>
                                Assurance: {insAlert.text}
                              </span>
                            )}
                          </div>
                        )}
                        {!ctAlert && !insAlert && vehicle.ct_expiry && (
                          <p className="text-xs text-gray-400 mt-1">
                            CT: {vehicle.ct_expiry.split("-").reverse().join("/")}
                            {vehicle.insurance_expiry && ` · Assur.: ${vehicle.insurance_expiry.split("-").reverse().join("/")}`}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 items-center flex-shrink-0">
                        <button onClick={() => setModal(vehicle)}
                          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button onClick={() => {
                          if (confirm(`Supprimer le véhicule ${vehicle.plate} ?`)) deleteMutation.mutate(vehicle.id);
                        }} className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {modal && (
        <VehicleModal
          vehicle={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <BottomNav />
    </div>
  );
}
