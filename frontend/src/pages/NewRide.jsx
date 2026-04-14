import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { getDrivers } from "../api/drivers";
import { createRide } from "../api/rides";
import { useToast } from "../components/Toast";

const PAYMENT_TYPES = [
  { value: "cpam", label: "CPAM" },
  { value: "mutuelle", label: "Mutuelle" },
  { value: "cash", label: "Espèces" },
  { value: "card", label: "Carte" },
  { value: "virement", label: "Virement" },
  { value: "cheque", label: "Chèque" },
];

const inputStyle = {
  width: "100%", border: "1px solid var(--border)", borderRadius: "9px",
  padding: "9px 12px", fontSize: "13.5px", background: "var(--bg)",
  color: "var(--text)", boxSizing: "border-box", outline: "none",
};

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function NewRide() {
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
    <Layout title="Nouvelle course">
      <div className="max-w-2xl mx-auto p-4 lg:p-6 animate-fade-in">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <Link
            to="/rides"
            style={{
              width: 30, height: 30, borderRadius: "8px",
              background: "var(--surface)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, textDecoration: "none",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </Link>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>Nouvelle course</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Client */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>Client</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Field label="Nom du client">
                <input
                  style={inputStyle}
                  placeholder="ex. Mme Dupont"
                  value={form.client_name}
                  onChange={e => set("client_name", e.target.value)}
                  onFocus={e => e.target.style.borderColor = "var(--brand)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </Field>
              <Field label="Départ">
                <input
                  style={inputStyle}
                  placeholder="Adresse de départ"
                  value={form.origin}
                  onChange={e => set("origin", e.target.value)}
                  onFocus={e => e.target.style.borderColor = "var(--brand)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </Field>
              <Field label="Arrivée">
                <input
                  style={inputStyle}
                  placeholder="Adresse d'arrivée"
                  value={form.destination}
                  onChange={e => set("destination", e.target.value)}
                  onFocus={e => e.target.style.borderColor = "var(--brand)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </Field>
            </div>
          </div>

          {/* Facturation */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>Facturation</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label="Montant (€)">
                  <input
                    style={inputStyle}
                    type="number" step="0.01" min="0" placeholder="0.00"
                    value={form.amount}
                    onChange={e => set("amount", e.target.value)}
                    required
                    onFocus={e => e.target.style.borderColor = "var(--brand)"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"}
                  />
                </Field>
                <Field label="Date & heure">
                  <input
                    style={inputStyle}
                    type="datetime-local"
                    value={form.ride_at}
                    onChange={e => set("ride_at", e.target.value)}
                    onFocus={e => e.target.style.borderColor = "var(--brand)"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"}
                  />
                </Field>
              </div>

              <Field label="Type de paiement">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                  {PAYMENT_TYPES.map(pt => (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() => set("payment_type", pt.value)}
                      style={{
                        padding: "5px 12px", borderRadius: "99px", fontSize: "12.5px", fontWeight: 600,
                        border: form.payment_type === pt.value ? "1px solid var(--brand)" : "1px solid var(--border)",
                        background: form.payment_type === pt.value ? "var(--brand-light)" : "transparent",
                        color: form.payment_type === pt.value ? "var(--brand)" : "var(--text-3)",
                        cursor: "pointer",
                      }}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Statut">
                <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                  {[{ v: "pending", l: "En attente" }, { v: "paid", l: "Payé" }].map(s => (
                    <button
                      key={s.v}
                      type="button"
                      onClick={() => set("status", s.v)}
                      style={{
                        flex: 1, padding: "8px", borderRadius: "8px", fontSize: "12px", fontWeight: 500,
                        border: form.status === s.v
                          ? s.v === "paid" ? "1px solid var(--success)" : "1px solid var(--warning)"
                          : "1px solid var(--border)",
                        background: form.status === s.v
                          ? s.v === "paid" ? "var(--success-bg)" : "var(--warning-bg)"
                          : "transparent",
                        color: form.status === s.v
                          ? s.v === "paid" ? "var(--success)" : "var(--warning)"
                          : "var(--text-3)",
                        cursor: "pointer",
                      }}
                    >
                      {s.l}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </div>

          {/* Chauffeur */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>Chauffeur</p>
            {drivers.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-3)" }}>
                Aucun chauffeur —{" "}
                <Link to="/drivers" style={{ color: "var(--brand)", fontWeight: 600 }}>en ajouter un</Link>
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => set("driver_id", "")}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 12px", borderRadius: "9px", fontSize: "13px", fontWeight: 500,
                    border: !form.driver_id ? "1px solid var(--brand)" : "1px solid var(--border)",
                    background: !form.driver_id ? "var(--brand-light)" : "transparent",
                    color: !form.driver_id ? "var(--brand)" : "var(--text-3)",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  Non assigné
                </button>
                {drivers.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => set("driver_id", d.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 12px", borderRadius: "9px", fontSize: "13px", fontWeight: 500,
                      border: Number(form.driver_id) === d.id ? "1px solid var(--brand)" : "1px solid var(--border)",
                      background: Number(form.driver_id) === d.id ? "var(--brand-light)" : "transparent",
                      color: Number(form.driver_id) === d.id ? "var(--brand)" : "var(--text)",
                      cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: "7px",
                      background: Number(form.driver_id) === d.id ? "var(--brand-muted)" : "var(--surface-2)",
                      color: Number(form.driver_id) === d.id ? "var(--brand)" : "var(--text-3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: 700, flexShrink: 0,
                    }}>
                      {d.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    {d.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: "var(--danger-bg)", border: "1px solid #fecaca", borderRadius: "9px", padding: "10px 14px" }}>
              <p style={{ fontSize: "13px", color: "var(--danger)", margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "13px", borderRadius: "10px",
              background: "var(--brand)", color: "white",
              fontSize: "14px", fontWeight: 600, border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Enregistrement..." : "Enregistrer la course"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
