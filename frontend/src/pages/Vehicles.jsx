import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { SkeletonList } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from "../api/vehicles";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const STATUS = {
  available:   { label: "Disponible",  bg: "var(--success-bg)", color: "var(--success)" },
  in_use:      { label: "En course",   bg: "var(--brand-light)", color: "var(--brand)" },
  maintenance: { label: "Maintenance", bg: "var(--warning-bg)", color: "var(--warning)" },
};

function alertLabel(alert) {
  if (!alert) return null;
  if (alert === "expired") return { text: "Expiré !", danger: true };
  const days = parseInt(alert.split("_").pop());
  if (days === 0) return { text: "Expire aujourd'hui !", danger: true };
  return { text: `Expire dans ${days}j`, danger: days <= 7 };
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
    ads_expiry: vehicle?.ads_expiry || "",
    taximetre_expiry: vehicle?.taximetre_expiry || "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-sheet-body">
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--border)", margin: "0 auto 20px" }} />
          <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", margin: "0 0 18px" }}>
            {vehicle ? "Modifier le véhicule" : "Nouveau véhicule"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>Immatriculation *</label>
              <input
                style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "9px", padding: "9px 12px", fontSize: "13.5px", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box", textTransform: "uppercase" }}
                value={form.plate} onChange={e => set("plate", e.target.value.toUpperCase())} placeholder="AB-123-CD" required
                onFocus={e => e.target.style.borderColor = "var(--brand)"} onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[{ k: "brand", label: "Marque", ph: "Renault" }, { k: "model", label: "Modèle", ph: "Trafic" }].map(({ k, label, ph }) => (
                <div key={k}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>{label}</label>
                  <input style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "9px", padding: "9px 12px", fontSize: "13.5px", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }}
                    value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph}
                    onFocus={e => e.target.style.borderColor = "var(--brand)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>
              ))}
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>Année</label>
              <input type="number" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "9px", padding: "9px 12px", fontSize: "13.5px", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }}
                value={form.year} onChange={e => set("year", e.target.value)} placeholder="2023" min="1990" max="2030"
                onFocus={e => e.target.style.borderColor = "var(--brand)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            {vehicle && (
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>Statut</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {Object.entries(STATUS).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => set("status", k)}
                      style={{
                        flex: 1, padding: "8px", borderRadius: "8px", fontSize: "11.5px", fontWeight: 500,
                        border: form.status === k ? `1px solid ${v.color}` : "1px solid var(--border)",
                        background: form.status === k ? v.bg : "transparent",
                        color: form.status === k ? v.color : "var(--text-3)", cursor: "pointer",
                      }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Documents & alertes</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { k: "ct_expiry", label: "Contrôle technique" },
                  { k: "insurance_expiry", label: "Assurance" },
                  { k: "ads_expiry", label: "ADS (autorisation)" },
                  { k: "taximetre_expiry", label: "Vignette taximètre" },
                ].map(({ k, label }) => (
                  <div key={k}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>{label}</label>
                    <input type="date" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "9px", padding: "9px 12px", fontSize: "13px", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }}
                      value={form[k]} onChange={e => set(k, e.target.value)}
                      onFocus={e => e.target.style.borderColor = "var(--brand)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: "9px", fontSize: "13.5px", fontWeight: 500, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer" }}>
            Annuler
          </button>
          <button onClick={() => onSave(form)} disabled={!form.plate} style={{ flex: 1, padding: "11px", borderRadius: "9px", fontSize: "13.5px", fontWeight: 600, border: "none", background: "var(--brand)", color: "white", cursor: !form.plate ? "not-allowed" : "pointer", opacity: !form.plate ? 0.5 : 1 }}>
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
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: vehicles = [], isLoading } = useQuery({ queryKey: ["vehicles"], queryFn: getVehicles });

  const addMutation = useMutation({
    mutationFn: createVehicle,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); setModal(null); toast("Véhicule ajouté", "success"); },
    onError: () => toast("Erreur lors de l'ajout", "error"),
  });
  const editMutation = useMutation({
    mutationFn: ({ id, data }) => updateVehicle(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); setModal(null); toast("Véhicule mis à jour", "success"); },
    onError: () => toast("Erreur lors de la modification", "error"),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); toast("Véhicule supprimé", "success"); },
    onError: () => toast("Erreur lors de la suppression", "error"),
  });

  const handleSave = (form) => {
    const data = { ...form };
    if (!data.ct_expiry) delete data.ct_expiry;
    if (!data.insurance_expiry) delete data.insurance_expiry;
    if (!data.ads_expiry) delete data.ads_expiry;
    if (!data.taximetre_expiry) delete data.taximetre_expiry;
    if (!data.year) delete data.year;
    else data.year = parseInt(data.year);
    if (modal === "new") addMutation.mutate(data);
    else editMutation.mutate({ id: modal.id, data });
  };

  const available   = vehicles.filter(v => v.status === "available").length;
  const inUse       = vehicles.filter(v => v.status === "in_use").length;
  const maintenance = vehicles.filter(v => v.status === "maintenance").length;
  const hasAlerts   = vehicles.filter(v => v.ct_alert || v.insurance_alert || v.ads_alert || v.taximetre_alert);

  return (
    <Layout title="Flotte">
      <div className="max-w-2xl mx-auto p-4 lg:p-6 animate-fade-in">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>Flotte</p>
          <button onClick={() => setModal("new")} style={{ display: "flex", alignItems: "center", gap: "5px", background: "var(--brand)", color: "white", padding: "6px 12px", borderRadius: "7px", fontSize: "12.5px", fontWeight: 600, border: "none", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--brand-hover)"} onMouseLeave={e => e.currentTarget.style.background = "var(--brand)"}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Ajouter
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
          {[
            { label: "Disponibles",  value: available,   color: "var(--success)", bg: "var(--success-bg)" },
            { label: "En course",    value: inUse,       color: "var(--brand)",   bg: "var(--brand-light)" },
            { label: "Maintenance",  value: maintenance, color: "var(--warning)", bg: "var(--warning-bg)" },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
              <p style={{ fontSize: "22px", fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: "11px", color: "var(--text-3)", margin: "4px 0 0", fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Alertes documents */}
        {hasAlerts.length > 0 && (
          <div style={{ background: "var(--danger-bg)", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--danger)", margin: "0 0 8px" }}>Documents à renouveler</p>
            {hasAlerts.map(v => {
              const ct  = alertLabel(v.ct_alert);
              const ins = alertLabel(v.insurance_alert);
              const ads = alertLabel(v.ads_alert);
              const tax = alertLabel(v.taximetre_alert);
              return (
                <div key={v.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "var(--danger)", marginBottom: "4px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600 }}>{v.plate}</span>
                  {ct  && <span style={{ background: "#fecaca", padding: "1px 7px", borderRadius: "99px", fontSize: "11px" }}>CT: {ct.text}</span>}
                  {ins && <span style={{ background: "#fecaca", padding: "1px 7px", borderRadius: "99px", fontSize: "11px" }}>Assurance: {ins.text}</span>}
                  {ads && <span style={{ background: "#fecaca", padding: "1px 7px", borderRadius: "99px", fontSize: "11px" }}>ADS: {ads.text}</span>}
                  {tax && <span style={{ background: "#fecaca", padding: "1px 7px", borderRadius: "99px", fontSize: "11px" }}>Taximètre: {tax.text}</span>}
                </div>
              );
            })}
          </div>
        )}

        {isLoading && <SkeletonList rows={3} />}

        {!isLoading && vehicles.length === 0 && (
          <EmptyState
            icon="vehicles"
            title="Aucun véhicule dans la flotte"
            subtitle="Ajoutez vos véhicules pour suivre leur statut, les alertes CT et assurance en temps réel."
            action={{ label: "+ Ajouter un véhicule", onClick: () => setModal("new") }}
          />
        )}

        {vehicles.length > 0 && (
          <>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
              Véhicules ({vehicles.length})
            </p>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
              {vehicles.map((vehicle, i) => {
                const s = STATUS[vehicle.status] || STATUS.available;
                const ctAlert  = alertLabel(vehicle.ct_alert);
                const insAlert = alertLabel(vehicle.insurance_alert);
                const adsAlert = alertLabel(vehicle.ads_alert);
                const taxAlert = alertLabel(vehicle.taximetre_alert);
                return (
                  <div key={vehicle.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "13px 14px", borderBottom: i < vehicles.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "9px", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h5l3 5v3h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
                        <p style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "0.03em" }}>{vehicle.plate}</p>
                        <span style={{ fontSize: "11px", fontWeight: 500, padding: "2px 7px", borderRadius: "99px", background: s.bg, color: s.color }}>{s.label}</span>
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "3px 0 0" }}>
                        {[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" · ")}
                      </p>
                      {(ctAlert || insAlert || adsAlert || taxAlert) && (
                        <div style={{ display: "flex", gap: "5px", marginTop: "5px", flexWrap: "wrap" }}>
                          {ctAlert  && <span style={{ fontSize: "11px", fontWeight: 500, padding: "2px 7px", borderRadius: "99px", background: ctAlert.danger  ? "var(--danger-bg)" : "var(--warning-bg)", color: ctAlert.danger  ? "var(--danger)" : "var(--warning)" }}>CT: {ctAlert.text}</span>}
                          {insAlert && <span style={{ fontSize: "11px", fontWeight: 500, padding: "2px 7px", borderRadius: "99px", background: insAlert.danger ? "var(--danger-bg)" : "var(--warning-bg)", color: insAlert.danger ? "var(--danger)" : "var(--warning)" }}>Assurance: {insAlert.text}</span>}
                          {adsAlert && <span style={{ fontSize: "11px", fontWeight: 500, padding: "2px 7px", borderRadius: "99px", background: adsAlert.danger ? "var(--danger-bg)" : "var(--warning-bg)", color: adsAlert.danger ? "var(--danger)" : "var(--warning)" }}>ADS: {adsAlert.text}</span>}
                          {taxAlert && <span style={{ fontSize: "11px", fontWeight: 500, padding: "2px 7px", borderRadius: "99px", background: taxAlert.danger ? "var(--danger-bg)" : "var(--warning-bg)", color: taxAlert.danger ? "var(--danger)" : "var(--warning)" }}>Taximètre: {taxAlert.text}</span>}
                        </div>
                      )}
                      {!ctAlert && !insAlert && !adsAlert && !taxAlert && vehicle.ct_expiry && (
                        <p style={{ fontSize: "11.5px", color: "var(--text-3)", margin: "3px 0 0" }}>
                          CT: {vehicle.ct_expiry.split("-").reverse().join("/")}
                          {vehicle.insurance_expiry && ` · Assur.: ${vehicle.insurance_expiry.split("-").reverse().join("/")}`}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <button onClick={() => setModal(vehicle)} style={{ width: 30, height: 30, borderRadius: "7px", background: "var(--surface-2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button onClick={() => setConfirmDelete(vehicle)}
                        style={{ width: 30, height: 30, borderRadius: "7px", background: "var(--danger-bg)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {modal && (
        <VehicleModal vehicle={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Supprimer ce véhicule ?"
          message={`Le véhicule ${confirmDelete.plate} sera définitivement supprimé. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={() => { deleteMutation.mutate(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Layout>
  );
}
