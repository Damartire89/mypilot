import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { SkeletonCard } from "../components/Skeleton";
import { getDrivers } from "../api/drivers";
import { getRide, updateRide, deleteRide } from "../api/rides";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const PAYMENT_TYPES = [
  { value: "cpam", label: "CPAM" },
  { value: "mutuelle", label: "Mutuelle" },
  { value: "cash", label: "Espèces" },
  { value: "card", label: "Carte" },
  { value: "virement", label: "Virement" },
  { value: "cheque", label: "Chèque" },
];

export default function EditRide() {
  const { id } = useParams();
  const { company } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();

  const { data: ride, isLoading: loadingRide } = useQuery({
    queryKey: ["ride", id],
    queryFn: () => getRide(id),
  });
  const { data: drivers = [] } = useQuery({ queryKey: ["drivers"], queryFn: getDrivers });

  const [form, setForm] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ride) return;
    setForm({
      client_name: ride.client_name || "",
      origin: ride.origin || "",
      destination: ride.destination || "",
      amount: String(ride.amount),
      payment_type: ride.payment_type || "cash",
      driver_id: ride.driver_id || "",
      status: ride.status || "pending",
      ride_at: ride.ride_at ? new Date(ride.ride_at).toISOString().slice(0, 16) : "",
    });
  }, [ride]);

  const updateMutation = useMutation({
    mutationFn: (data) => updateRide(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rides"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast("Course mise à jour", "success");
      navigate("/rides");
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || "Erreur lors de la mise à jour";
      setError(msg);
      toast(msg, "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRide(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rides"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast("Course supprimée", "success");
      navigate("/rides");
    },
    onError: () => toast("Erreur lors de la suppression", "error"),
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(form.amount)) return setError("Montant invalide");
    updateMutation.mutate({
      ...form,
      amount: parseFloat(form.amount),
      driver_id: form.driver_id ? parseInt(form.driver_id) : null,
      ride_at: form.ride_at || null,
    });
  };

  if (loadingRide || !form) {
    return (
      <div className="max-w-lg mx-auto pb-20 bg-gray-50 min-h-screen">
        <TopBar company={company?.name || "myPilot"} />
        <div className="p-4 space-y-4">
          <SkeletonCard className="h-12" />
          <SkeletonCard className="h-44" />
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-28" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-20 bg-gray-50 min-h-screen">
      <TopBar company={company?.name || "myPilot"} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link to="/rides" className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </Link>
            <p className="text-lg font-black text-[#1a1a2e]">Modifier la course</p>
          </div>
          <button
            onClick={() => {
              if (confirm("Supprimer cette course ?")) deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
            className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Client</p>
            <Field label="Nom du client">
              <input className={inputCls} placeholder="ex. Mme Dupont" value={form.client_name}
                onChange={e => set("client_name", e.target.value)} />
            </Field>
            <Field label="Départ">
              <input className={inputCls} placeholder="Adresse de départ" value={form.origin}
                onChange={e => set("origin", e.target.value)} />
            </Field>
            <Field label="Arrivée">
              <input className={inputCls} placeholder="Adresse d'arrivée" value={form.destination}
                onChange={e => set("destination", e.target.value)} />
            </Field>
          </div>

          {/* Facturation */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Facturation</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Montant (€)">
                <input className={inputCls} type="number" step="0.01" min="0" placeholder="0.00"
                  value={form.amount} onChange={e => set("amount", e.target.value)} required />
              </Field>
              <Field label="Date & heure">
                <input className={inputCls} type="datetime-local" value={form.ride_at}
                  onChange={e => set("ride_at", e.target.value)} />
              </Field>
            </div>

            <Field label="Type de paiement">
              <div className="flex flex-wrap gap-2 mt-1">
                {PAYMENT_TYPES.map(pt => (
                  <button key={pt.value} type="button"
                    onClick={() => set("payment_type", pt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      form.payment_type === pt.value
                        ? "bg-[#3fa9f5] text-white border-[#3fa9f5]"
                        : "bg-white text-gray-500 border-gray-200"
                    }`}>
                    {pt.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Statut">
              <div className="flex gap-2 mt-1">
                {[{v:"pending",l:"En attente"},{v:"paid",l:"Payé"}].map(s => (
                  <button key={s.v} type="button" onClick={() => set("status", s.v)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      form.status === s.v
                        ? s.v === "paid" ? "bg-green-500 text-white border-green-500" : "bg-orange-400 text-white border-orange-400"
                        : "bg-white text-gray-500 border-gray-200"
                    }`}>
                    {s.l}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {/* Chauffeur */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Chauffeur</p>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => set("driver_id", "")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  !form.driver_id ? "border-[#3fa9f5] bg-[#3fa9f5]/5 text-[#3fa9f5]" : "border-gray-200 text-gray-400"
                }`}>
                Non assigné
              </button>
              {drivers.map(d => (
                <button key={d.id} type="button" onClick={() => set("driver_id", d.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    Number(form.driver_id) === d.id ? "border-[#3fa9f5] bg-[#3fa9f5]/5 text-[#3fa9f5]" : "border-gray-200 text-gray-500"
                  }`}>
                  <div className="w-7 h-7 rounded-full bg-[#3fa9f5]/15 flex items-center justify-center text-xs font-black text-[#3fa9f5]">
                    {d.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
                  </div>
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-xs bg-red-50 rounded-xl px-4 py-3">{error}</p>}

          <button type="submit" disabled={updateMutation.isPending}
            className="w-full bg-[#3fa9f5] text-white rounded-xl py-4 text-sm font-bold disabled:opacity-60">
            {updateMutation.isPending ? "Enregistrement..." : "Sauvegarder les modifications"}
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5]";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
