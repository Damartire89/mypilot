import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { SkeletonList } from "../components/Skeleton";
import { getDrivers, createDriver, updateDriver, deleteDriver } from "../api/drivers";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const STATUS = {
  active: { label: "En service", dot: "bg-green-400", badge: "bg-green-50 text-green-600" },
  break: { label: "En pause", dot: "bg-orange-400", badge: "bg-orange-50 text-orange-600" },
  off: { label: "Hors service", dot: "bg-gray-300", badge: "bg-gray-100 text-gray-500" },
};

function DriverModal({ driver, onClose, onSave }) {
  const [form, setForm] = useState({
    name: driver?.name || "",
    phone: driver?.phone || "",
    license_number: driver?.license_number || "",
    status: driver?.status || "off",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-5" onClick={e => e.stopPropagation()}>
        <p className="text-base font-black text-[#1a1a2e] mb-4">{driver ? "Modifier" : "Nouveau chauffeur"}</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Nom complet *</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5]"
              value={form.name} onChange={e => set("name", e.target.value)} placeholder="Prénom NOM" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Téléphone</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5]"
              value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="06 XX XX XX XX" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">N° de licence / carte pro</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5]"
              value={form.license_number} onChange={e => set("license_number", e.target.value)} placeholder="ex. VTC-2024-001" />
          </div>
          {driver && (
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
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-500">
            Annuler
          </button>
          <button onClick={() => onSave(form)} disabled={!form.name}
            className="flex-1 bg-[#3fa9f5] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-50">
            {driver ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Drivers() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [modal, setModal] = useState(null);

  const { data: drivers = [], isLoading } = useQuery({ queryKey: ["drivers"], queryFn: getDrivers });

  const addMutation = useMutation({
    mutationFn: createDriver,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      setModal(null);
      toast("Chauffeur ajouté", "success");
    },
    onError: () => toast("Erreur lors de l'ajout", "error"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => updateDriver(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      setModal(null);
      toast("Chauffeur mis à jour", "success");
    },
    onError: () => toast("Erreur lors de la modification", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      toast("Chauffeur supprimé", "success");
    },
    onError: () => toast("Erreur lors de la suppression", "error"),
  });

  const active = drivers.filter(d => d.status === "active").length;
  const onBreak = drivers.filter(d => d.status === "break").length;
  const off = drivers.filter(d => d.status === "off").length;

  const handleSave = (form) => {
    if (modal === "new") {
      addMutation.mutate(form);
    } else {
      editMutation.mutate({ id: modal.id, data: form });
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-20 bg-gray-50 min-h-screen">
      <TopBar company={company?.name || "myPilot"} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-lg font-black text-[#1a1a2e]">Chauffeurs</p>
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
            <p className="text-xl font-black text-white">{active}</p>
            <p className="text-xs text-white/80 font-medium">En service</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-black text-orange-500">{onBreak}</p>
            <p className="text-xs text-gray-400 font-medium">En pause</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-black text-gray-400">{off}</p>
            <p className="text-xs text-gray-400 font-medium">Hors service</p>
          </div>
        </div>

        {isLoading && <SkeletonList rows={4} />}

        {!isLoading && drivers.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
            <p className="text-sm mb-2">Aucun chauffeur enregistré</p>
            <button onClick={() => setModal("new")} className="text-[#3fa9f5] text-xs font-semibold">
              + Ajouter le premier chauffeur
            </button>
          </div>
        )}

        {drivers.length > 0 && (
          <>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Équipe</p>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              {drivers.map((driver, i) => {
                const s = STATUS[driver.status] || STATUS.off;
                return (
                  <div key={driver.id}
                    className={`px-4 py-3 cursor-pointer active:bg-gray-50 ${i < drivers.length - 1 ? "border-b border-gray-50" : ""}`}
                    onClick={() => navigate(`/drivers/${driver.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#3fa9f5]/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-black text-[#3fa9f5]">
                          {driver.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#1a1a2e]">{driver.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.badge}`}>
                            {s.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {driver.phone || "Pas de téléphone"}
                          {driver.license_number && ` · ${driver.license_number}`}
                        </p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button onClick={(e) => { e.stopPropagation(); setModal(driver); }}
                          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Supprimer ${driver.name} ?`)) deleteMutation.mutate(driver.id);
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
        <DriverModal
          driver={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <BottomNav />
    </div>
  );
}
