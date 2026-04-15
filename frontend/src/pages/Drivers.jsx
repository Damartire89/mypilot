import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { SkeletonList } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import { getDrivers, createDriver, updateDriver, deleteDriver } from "../api/drivers";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const STATUS = {
  active: { label: "En service",   bg: "var(--success-bg)", color: "var(--success)" },
  break:  { label: "En pause",     bg: "var(--warning-bg)", color: "var(--warning)" },
  off:    { label: "Hors service", bg: "var(--surface-2)",  color: "var(--text-3)" },
};

function alertLabel(alert) {
  if (!alert) return null;
  if (alert === "expired") return { text: "Expiré !", danger: true };
  const days = parseInt(alert.split("_").pop());
  if (days === 0) return { text: "Expire aujourd'hui !", danger: true };
  return { text: `Expire dans ${days}j`, danger: days <= 7 };
}

function DriverModal({ driver, onClose, onSave }) {
  const [form, setForm] = useState({
    name: driver?.name || "",
    phone: driver?.phone || "",
    license_number: driver?.license_number || "",
    status: driver?.status || "off",
    carte_pro_expiry: driver?.carte_pro_expiry || "",
    carte_vtc_expiry: driver?.carte_vtc_expiry || "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--border)", margin: "0 auto 20px" }} />
        <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", margin: "0 0 18px" }}>
          {driver ? "Modifier le chauffeur" : "Nouveau chauffeur"}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
          {[
            { key: "name", label: "Nom complet", placeholder: "Prénom NOM", required: true },
            { key: "phone", label: "Téléphone", placeholder: "06 XX XX XX XX" },
            { key: "license_number", label: "N° licence / carte pro", placeholder: "ex. VTC-2024-001" },
          ].map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>
                {label}{required && " *"}
              </label>
              <input
                style={{
                  width: "100%", border: "1px solid var(--border)", borderRadius: "9px",
                  padding: "9px 12px", fontSize: "13.5px", background: "var(--bg)",
                  color: "var(--text)", boxSizing: "border-box",
                }}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                required={required}
                onFocus={e => e.target.style.borderColor = "var(--brand)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>
          ))}

          {driver && (
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>Statut</label>
              <div style={{ display: "flex", gap: "6px" }}>
                {Object.entries(STATUS).map(([k, v]) => (
                  <button
                    key={k} type="button" onClick={() => set("status", k)}
                    style={{
                      flex: 1, padding: "8px", borderRadius: "8px", fontSize: "12px", fontWeight: 500,
                      border: form.status === k ? `1px solid ${v.color}` : "1px solid var(--border)",
                      background: form.status === k ? v.bg : "transparent",
                      color: form.status === k ? v.color : "var(--text-3)",
                      cursor: "pointer",
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Documents FR */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "4px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Documents FR</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { k: "carte_pro_expiry", label: "Carte pro taxi" },
              { k: "carte_vtc_expiry", label: "Carte VTC" },
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

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "11px", borderRadius: "9px", fontSize: "13.5px", fontWeight: 500,
              border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name}
            style={{
              flex: 1, padding: "11px", borderRadius: "9px", fontSize: "13.5px", fontWeight: 600,
              border: "none", background: "var(--brand)", color: "white",
              cursor: !form.name ? "not-allowed" : "pointer",
              opacity: !form.name ? 0.5 : 1,
            }}
          >
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
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: drivers = [], isLoading } = useQuery({ queryKey: ["drivers"], queryFn: getDrivers });

  const addMutation = useMutation({
    mutationFn: createDriver,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["drivers"] }); setModal(null); toast("Chauffeur ajouté", "success"); },
    onError: () => toast("Erreur lors de l'ajout", "error"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => updateDriver(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["drivers"] }); setModal(null); toast("Chauffeur mis à jour", "success"); },
    onError: () => toast("Erreur lors de la modification", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["drivers"] }); toast("Chauffeur supprimé", "success"); },
    onError: () => toast("Erreur lors de la suppression", "error"),
  });

  const active  = drivers.filter(d => d.status === "active").length;
  const onBreak = drivers.filter(d => d.status === "break").length;
  const off     = drivers.filter(d => d.status === "off").length;

  const handleSave = (form) => {
    if (modal === "new") addMutation.mutate(form);
    else editMutation.mutate({ id: modal.id, data: form });
  };

  return (
    <Layout title="Équipe">
      <div className="max-w-2xl mx-auto p-4 lg:p-6 animate-fade-in">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>Équipe</p>
          <button
            onClick={() => setModal("new")}
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              background: "var(--brand)", color: "white",
              padding: "6px 12px", borderRadius: "7px",
              fontSize: "12.5px", fontWeight: 600, border: "none", cursor: "pointer",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--brand-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--brand)"}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Ajouter
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "20px" }}>
          {[
            { label: "En service",   value: active,  color: "var(--success)", bg: "var(--success-bg)" },
            { label: "En pause",     value: onBreak, color: "var(--warning)", bg: "var(--warning-bg)" },
            { label: "Hors service", value: off,     color: "var(--text-3)",  bg: "var(--surface-2)" },
          ].map(s => (
            <div key={s.label} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "10px", padding: "12px", textAlign: "center",
            }}>
              <p style={{ fontSize: "22px", fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: "11px", color: "var(--text-3)", margin: "4px 0 0", fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {isLoading && <SkeletonList rows={4} />}

        {!isLoading && drivers.length === 0 && (
          <EmptyState
            icon="drivers"
            title="Aucun chauffeur dans l'équipe"
            subtitle="Ajoutez vos chauffeurs pour leur assigner des courses et suivre leur activité individuelle."
            action={{ label: "+ Ajouter un chauffeur", onClick: () => setModal("new") }}
          />
        )}

        {drivers.length > 0 && (
          <>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
              Chauffeurs ({drivers.length})
            </p>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
              {drivers.map((driver, i) => {
                const s = STATUS[driver.status] || STATUS.off;
                const carteProAlert = alertLabel(driver.carte_pro_alert);
                const carteVtcAlert = alertLabel(driver.carte_vtc_alert);
                return (
                  <div
                    key={driver.id}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "12px",
                      padding: "12px 14px", cursor: "pointer",
                      borderBottom: i < drivers.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                    onClick={() => navigate(`/drivers/${driver.id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: "9px",
                      background: "var(--brand-light)", color: "var(--brand)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: 700, flexShrink: 0, marginTop: 1,
                    }}>
                      {driver.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
                        <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)", margin: 0 }}>{driver.name}</p>
                        <span style={{ fontSize: "11px", fontWeight: 500, padding: "2px 7px", borderRadius: "99px", background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "2px 0 0" }}>
                        {driver.phone || "Pas de téléphone"}
                        {driver.license_number && ` · ${driver.license_number}`}
                      </p>
                      {(carteProAlert || carteVtcAlert) && (
                        <div style={{ display: "flex", gap: "5px", marginTop: "5px", flexWrap: "wrap" }}>
                          {carteProAlert && <span style={{ fontSize: "11px", fontWeight: 500, padding: "2px 7px", borderRadius: "99px", background: carteProAlert.danger ? "var(--danger-bg)" : "var(--warning-bg)", color: carteProAlert.danger ? "var(--danger)" : "var(--warning)" }}>Carte pro: {carteProAlert.text}</span>}
                          {carteVtcAlert && <span style={{ fontSize: "11px", fontWeight: 500, padding: "2px 7px", borderRadius: "99px", background: carteVtcAlert.danger ? "var(--danger-bg)" : "var(--warning-bg)", color: carteVtcAlert.danger ? "var(--danger)" : "var(--warning)" }}>Carte VTC: {carteVtcAlert.text}</span>}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "6px" }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setModal(driver)}
                        style={{ width: 30, height: 30, borderRadius: "7px", background: "var(--surface-2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(driver)}
                        style={{ width: 30, height: 30, borderRadius: "7px", background: "var(--danger-bg)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                      >
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
        <DriverModal
          driver={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Supprimer ce chauffeur ?"
          message={`${confirmDelete.name} sera définitivement supprimé. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={() => { deleteMutation.mutate(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Layout>
  );
}
