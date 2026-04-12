import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { getDrivers } from "../api/drivers";
import { createRide } from "../api/rides";
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

export default function NewRide() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: drivers = [] } = useQuery({ queryKey: ["drivers"], queryFn: getDrivers });

  const [form, setForm] = useState({
    client_name: "",
    origin: "",
    destination: "",
    amount: "",
    payment_type: "cpam",
    driver_id: "",
    status: "pending",
    ride_at: new Date().toISOString().slice(0, 16),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(form.amount)) return setError("Montant invalide");
    setLoading(true);
    setError("");
    try {
      await createRide({
        ...form,
        amount: parseFloat(form.amount),
        driver_id: form.driver_id ? parseInt(form.driver_id) : null,
        ride_at: form.ride_at || null,
      });
      qc.invalidateQueries({ queryKey: ["rides"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast("Course enregistrée", "success");
      navigate("/rides");
    } catch (err) {
      const msg = err.response?.data?.detail || "Erreur lors de la création";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-20 bg-gray-50 min-h-screen">
      <TopBar company={company?.name || "myPilot"} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link to="/rides" className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </Link>
          <p className="text-lg font-black text-[#1a1a2e]">Nouvelle course</p>
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

          {/* Course */}
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
            {drivers.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun chauffeur — <Link to="/drivers" className="text-[#3fa9f5]">en ajouter un</Link></p>
            ) : (
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
            )}
          </div>

          {error && <p className="text-red-500 text-xs bg-red-50 rounded-xl px-4 py-3">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-[#3fa9f5] text-white rounded-xl py-4 text-sm font-bold disabled:opacity-60">
            {loading ? "Enregistrement..." : "Enregistrer la course"}
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
