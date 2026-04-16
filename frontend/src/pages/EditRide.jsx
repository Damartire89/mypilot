import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { SkeletonCard } from "../components/Skeleton";
import ConfirmModal from "../components/ConfirmModal";
import { getDrivers } from "../api/drivers";
import { getRide, updateRide, deleteRide, downloadRidePDF } from "../api/rides";
import { getSettings } from "../api/settings";
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

export default function EditRide() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();

  const { data: ride, isLoading: loadingRide } = useQuery({
    queryKey: ["ride", id],
    queryFn: () => getRide(id),
  });
  const { data: drivers = [] } = useQuery({ queryKey: ["drivers"], queryFn: getDrivers });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings, staleTime: 300000 });

  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [kmRate, setKmRate] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  // Pré-remplir tarif/km depuis les paramètres si pas déjà renseigné
  useEffect(() => {
    if (settings?.default_km_rate && !kmRate) {
      setKmRate(settings.default_km_rate);
    }
  }, [settings]);

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
      bon_transport: ride.bon_transport || "",
      prescripteur: ride.prescripteur || "",
      notes: ride.notes || "",
      km_distance: ride.km_distance ? String(ride.km_distance) : "",
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
  const isMedical = form ? ["cpam", "mutuelle"].includes(form.payment_type) : false;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(form.amount)) return setError("Montant invalide");
    const maxAlert = settings?.max_ride_amount_alert ? parseFloat(settings.max_ride_amount_alert) : null;
    if (maxAlert && parseFloat(form.amount) > maxAlert && !window.confirm(`Le montant (${form.amount}€) dépasse votre seuil d'alerte (${maxAlert}€). Continuer ?`)) return;
    updateMutation.mutate({
      ...form,
      amount: parseFloat(form.amount),
      driver_id: form.driver_id ? parseInt(form.driver_id) : null,
      ride_at: form.ride_at || null,
      bon_transport: form.bon_transport || null,
      prescripteur: form.prescripteur || null,
      notes: form.notes || null,
      km_distance: form.km_distance ? parseFloat(form.km_distance) : null,
    });
  };

  if (loadingRide || !form) {
    return (
      <Layout title="Modifier la course">
        <div className="max-w-2xl mx-auto p-4 lg:p-6" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <SkeletonCard style={{ height: 48 }} />
          <SkeletonCard style={{ height: 176 }} />
          <SkeletonCard style={{ height: 192 }} />
          <SkeletonCard style={{ height: 112 }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Modifier la course">
      <div className="max-w-2xl mx-auto p-4 lg:p-6 animate-fade-in">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>Modifier la course</p>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              onClick={async () => {
                setPdfLoading(true);
                try { await downloadRidePDF(id); }
                catch { toast("Erreur lors de la génération du PDF", "error"); }
                finally { setPdfLoading(false); }
              }}
              disabled={pdfLoading}
              title="Télécharger la facture PDF"
              style={{
                width: 30, height: 30, borderRadius: "8px",
                background: "var(--surface)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: pdfLoading ? "wait" : "pointer", flexShrink: 0,
                opacity: pdfLoading ? 0.5 : 1,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <polyline points="9 15 12 18 15 15"/>
              </svg>
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={deleteMutation.isPending}
              style={{
                width: 30, height: 30, borderRadius: "8px",
                background: "var(--danger-bg)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label="Distance (km)">
                  <input
                    style={inputStyle}
                    type="number" step="0.1" min="0" placeholder="0.0"
                    value={form.km_distance}
                    onChange={e => {
                      set("km_distance", e.target.value);
                      if (kmRate && e.target.value) set("amount", (parseFloat(e.target.value) * parseFloat(kmRate)).toFixed(2));
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--brand)"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"}
                  />
                </Field>
                <Field label="Tarif / km (€)">
                  <input
                    style={inputStyle}
                    type="number" step="0.01" min="0" placeholder="ex. 1.20"
                    value={kmRate}
                    onChange={e => {
                      setKmRate(e.target.value);
                      if (form.km_distance && e.target.value) set("amount", (parseFloat(form.km_distance) * parseFloat(e.target.value)).toFixed(2));
                    }}
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

          {/* Informations médicales — visible uniquement CPAM / Mutuelle */}
          {isMedical && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "14px" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Informations médicales</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Field label="N° bon de transport">
                  <input style={inputStyle} placeholder="ex. 123456789"
                    value={form.bon_transport} onChange={e => set("bon_transport", e.target.value)}
                    onFocus={e => e.target.style.borderColor = "var(--brand)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </Field>
                <Field label="Médecin prescripteur">
                  <input style={inputStyle} placeholder="Dr. Nom Prénom"
                    value={form.prescripteur} onChange={e => set("prescripteur", e.target.value)}
                    onFocus={e => e.target.style.borderColor = "var(--brand)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </Field>
              </div>
            </div>
          )}

          {/* Chauffeur */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>Chauffeur</p>
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
          </div>

          {/* Notes */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>Notes</p>
            {ride?.reference && (
              <p style={{ fontSize: "11px", color: "var(--text-3)", margin: "0 0 10px" }}>
                Référence : <span style={{ fontWeight: 600, color: "var(--text-2)", fontFamily: "monospace" }}>{ride.reference}</span>
              </p>
            )}
            <textarea
              style={{ ...inputStyle, minHeight: "72px", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
              placeholder="Informations complémentaires, instructions particulières..."
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              onFocus={e => e.target.style.borderColor = "var(--brand)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          {error && (
            <div style={{ background: "var(--danger-bg)", border: "1px solid #fecaca", borderRadius: "9px", padding: "10px 14px" }}>
              <p style={{ fontSize: "13px", color: "var(--danger)", margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="btn-primary-gradient"
            style={{
              width: "100%", padding: "13px", borderRadius: "10px",
              color: "white",
              fontSize: "14px", fontWeight: 600,
              cursor: updateMutation.isPending ? "not-allowed" : "pointer",
              opacity: updateMutation.isPending ? 0.6 : 1,
            }}
          >
            {updateMutation.isPending ? "Enregistrement..." : "Sauvegarder les modifications"}
          </button>
        </form>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Supprimer cette course ?"
          message="Cette course sera définitivement supprimée. Cette action est irréversible."
          confirmLabel="Supprimer"
          onConfirm={() => { deleteMutation.mutate(); setConfirmDelete(false); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </Layout>
  );
}
