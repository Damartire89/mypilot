import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { getSettings, updateSettings } from "../api/settings";
import { exportRidesCSV } from "../api/rides";
import { changePassword } from "../api/auth";
import { getMembers, inviteMember, removeMember } from "../api/members";

const ROLE_LABELS = { admin: "Admin", manager: "Manager", readonly: "Lecture seule" };
const ROLE_STYLES = {
  admin:    { bg: "var(--brand-light)",   color: "var(--brand)" },
  manager:  { bg: "var(--success-bg)",    color: "var(--success)" },
  readonly: { bg: "var(--surface-2)",     color: "var(--text-3)" },
};

// Sections de paramètres
const ACTIVITY_TYPES = [
  { value: "taxi", label: "Taxi", icon: "🚕" },
  { value: "vtc", label: "VTC", icon: "🚗" },
  { value: "ambulance", label: "Ambulance / VSL", icon: "🚑" },
  { value: "transport", label: "Transport scolaire", icon: "🚌" },
];

const PAYMENT_OPTIONS = ["CPAM", "Mutuelle", "Espèces", "Carte bancaire", "Virement", "Chèque", "Téléconsultation"];
const ALERT_TYPES = ["CT véhicule", "Assurance", "Révision", "Permis de conduire", "Carte VTC", "Autorisation préfectorale"];

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px 2px" }}>{title}</p>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function Row({ label, sub, children, border = true }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", gap: 12, borderBottom: border ? "1px solid var(--border)" : "none" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text)", margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: "11.5px", color: "var(--text-3)", margin: "2px 0 0" }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      type="button"
      style={{
        width: 40, height: 22, borderRadius: "99px", border: "none",
        background: value ? "var(--brand)" : "var(--border-strong)",
        position: "relative", cursor: "pointer", flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <div style={{
        width: 18, height: 18,
        background: "white",
        borderRadius: "50%",
        position: "absolute",
        top: 2,
        left: value ? 20 : 2,
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

export default function Settings() {
  const { company, user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  // État onglet Équipe
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("manager");
  const [inviteLink, setInviteLink] = useState(null);

  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: getMembers,
    enabled: isAdmin,
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteMember(inviteEmail, inviteRole),
    onSuccess: (data) => {
      const link = `${window.location.origin}/invite/${data.token}`;
      setInviteLink(link);
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err) => toast(err?.response?.data?.detail || "Erreur invitation", "error"),
  });

  const removeMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
    onError: (err) => toast(err?.response?.data?.detail || "Erreur suppression", "error"),
  });

  const { data: remote } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); setSaved(true); setTimeout(() => setSaved(false), 2000); },
    onError: () => toast("Erreur lors de la sauvegarde", "error"),
  });

  const [saved, setSaved] = useState(false);

  // Modal changement mot de passe
  const [pwModal, setPwModal] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    if (pwNew.length < 8) { toast("Le mot de passe doit faire au moins 8 caractères", "error"); return; }
    if (pwNew !== pwConfirm) { toast("Les mots de passe ne correspondent pas", "error"); return; }
    setPwLoading(true);
    try {
      await changePassword(pwCurrent, pwNew);
      toast("Mot de passe modifié avec succès", "success");
      setPwModal(false);
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Erreur lors du changement de mot de passe";
      toast(msg, "error");
    } finally {
      setPwLoading(false);
    }
  };

  // Entreprise
  const [companyName, setCompanyName] = useState("");
  const [activityType, setActivityType] = useState("taxi");
  const [siret, setSiret] = useState("");
  const [phone, setPhone] = useState("");
  const [tvaRate, setTvaRate] = useState("10");

  const [address, setAddress] = useState("");

  // Facturation
  const [invoicePrefix, setInvoicePrefix] = useState("FAC");
  const [invoiceNextNumber, setInvoiceNextNumber] = useState("001");
  const [invoiceFooter, setInvoiceFooter] = useState("");
  const [enabledPayments, setEnabledPayments] = useState(["CPAM", "Espèces", "Carte bancaire"]);

  // Alertes
  const [enabledAlerts, setEnabledAlerts] = useState(["CT véhicule", "Assurance", "Révision"]);
  const [alertDaysBefore, setAlertDaysBefore] = useState("30");

  // Affichage
  const [showCA, setShowCA] = useState(true);
  const [currency, setCurrency] = useState("EUR");
  const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");
  const [weekStart, setWeekStart] = useState("monday");

  // Notifications
  const [notifNewRide, setNotifNewRide] = useState(true);
  const [notifUnpaid, setNotifUnpaid] = useState(true);
  const [notifAlerts, setNotifAlerts] = useState(true);
  const [notifDailyReport, setNotifDailyReport] = useState(false);

  // Charger les données distantes dans les states locaux
  useEffect(() => {
    if (!remote) return;
    if (remote.company_name) setCompanyName(remote.company_name);
    if (remote.activity_type) setActivityType(remote.activity_type);
    if (remote.siret) setSiret(remote.siret || "");
    if (remote.phone) setPhone(remote.phone || "");
    if (remote.address !== undefined) setAddress(remote.address || "");
    if (remote.tva_rate) setTvaRate(remote.tva_rate);
    if (remote.invoice_prefix) setInvoicePrefix(remote.invoice_prefix);
    if (remote.invoice_next_number) setInvoiceNextNumber(String(remote.invoice_next_number));
    if (remote.invoice_footer !== undefined) setInvoiceFooter(remote.invoice_footer);
    if (remote.enabled_payments?.length) setEnabledPayments(remote.enabled_payments);
    if (remote.enabled_alerts?.length) setEnabledAlerts(remote.enabled_alerts);
    if (remote.alert_days_before) setAlertDaysBefore(String(remote.alert_days_before));
    setShowCA(!remote.hide_ca);
    if (remote.currency) setCurrency(remote.currency);
    if (remote.date_format) setDateFormat(remote.date_format);
    if (remote.week_start) setWeekStart(remote.week_start);
    setNotifNewRide(remote.notif_new_ride ?? true);
    setNotifUnpaid(remote.notif_unpaid ?? true);
    setNotifAlerts(remote.notif_alerts ?? true);
    setNotifDailyReport(remote.notif_daily_report ?? false);
  }, [remote]);

  const handleSave = () => {
    mutation.mutate({
      company_name: companyName,
      activity_type: activityType,
      siret, phone, address,
      invoice_prefix: invoicePrefix,
      invoice_next_number: parseInt(invoiceNextNumber) || 1,
      tva_rate: tvaRate,
      invoice_footer: invoiceFooter,
      enabled_payments: enabledPayments,
      enabled_alerts: enabledAlerts,
      alert_days_before: parseInt(alertDaysBefore) || 30,
      hide_ca: !showCA,
      currency, date_format: dateFormat, week_start: weekStart,
      notif_new_ride: notifNewRide,
      notif_unpaid: notifUnpaid,
      notif_alerts: notifAlerts,
      notif_daily_report: notifDailyReport,
    });
  };

  const toggleArr = (arr, setArr, val) => {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const inputStyle = { fontSize: "13px", textAlign: "right", color: "var(--text-2)", background: "transparent", outline: "none", border: "none", width: "144px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
  const inputStyleBrand = { ...inputStyle, color: "var(--brand)", fontWeight: 600 };

  return (
    <Layout title="Paramètres">
      <div className="max-w-2xl mx-auto p-4 lg:p-6 animate-fade-in">

        {/* Entreprise */}
        <Section title="Mon entreprise">
          <Row label="Nom de l'entreprise" border>
            <input style={inputStyleBrand} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Nom..." />
          </Row>
          <Row label="SIRET" sub="14 chiffres" border>
            <input style={inputStyle} value={siret} onChange={e => setSiret(e.target.value)} placeholder="00000000000000" maxLength={14} />
          </Row>
          <Row label="Téléphone" border>
            <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 XX XX XX XX" />
          </Row>
          <Row label="Adresse" border={false}>
            <input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} placeholder="Ville..." />
          </Row>
        </Section>

        {/* Type d'activité */}
        <Section title="Type d'activité">
          <div style={{ padding: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {ACTIVITY_TYPES.map(at => (
              <button key={at.value} onClick={() => setActivityType(at.value)} type="button"
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "9px 12px", borderRadius: "9px",
                  border: activityType === at.value ? "1px solid var(--brand)" : "1px solid var(--border)",
                  background: activityType === at.value ? "var(--brand-light)" : "transparent",
                  color: activityType === at.value ? "var(--brand)" : "var(--text-2)",
                  fontSize: "13px", fontWeight: 500, cursor: "pointer",
                }}>
                <span>{at.icon}</span>{at.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Facturation */}
        <Section title="Facturation">
          <Row label="Préfixe facture" sub="ex. FAC, TXM, 2026-" border>
            <input style={{ ...inputStyleBrand, width: 80 }} value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} placeholder="FAC" />
          </Row>
          <Row label="Prochain numéro" border>
            <input style={{ ...inputStyle, width: 80 }} value={invoiceNextNumber} onChange={e => setInvoiceNextNumber(e.target.value)} placeholder="001" />
          </Row>
          <Row label="TVA" border>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input style={{ ...inputStyle, width: 40 }} type="number" value={tvaRate} onChange={e => setTvaRate(e.target.value)} placeholder="10" />
              <span style={{ fontSize: "13px", color: "var(--text-3)" }}>%</span>
            </div>
          </Row>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-2)", margin: "0 0 8px" }}>Modes de paiement actifs</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {PAYMENT_OPTIONS.map(p => (
                <button key={p} type="button" onClick={() => toggleArr(enabledPayments, setEnabledPayments, p)}
                  style={{
                    padding: "4px 11px", borderRadius: "99px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                    border: enabledPayments.includes(p) ? "1px solid var(--brand)" : "1px solid var(--border)",
                    background: enabledPayments.includes(p) ? "var(--brand)" : "var(--surface)",
                    color: enabledPayments.includes(p) ? "white" : "var(--text-2)",
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <Row label="Pied de facture" sub="Texte libre affiché en bas des factures" border={false}>
            <input style={inputStyle} value={invoiceFooter} onChange={e => setInvoiceFooter(e.target.value)} placeholder="Merci de votre confiance" />
          </Row>
        </Section>

        {/* Alertes */}
        <Section title="Alertes & rappels">
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-2)", margin: "0 0 8px" }}>Alertes activées</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {ALERT_TYPES.map(a => (
                <button key={a} type="button" onClick={() => toggleArr(enabledAlerts, setEnabledAlerts, a)}
                  style={{
                    padding: "4px 11px", borderRadius: "99px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                    border: enabledAlerts.includes(a) ? "1px solid var(--text)" : "1px solid var(--border)",
                    background: enabledAlerts.includes(a) ? "var(--text)" : "var(--surface)",
                    color: enabledAlerts.includes(a) ? "white" : "var(--text-2)",
                  }}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <Row label="Délai d'alerte" sub="Jours avant échéance" border={false}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input style={{ ...inputStyle, width: 48 }} type="number" value={alertDaysBefore} onChange={e => setAlertDaysBefore(e.target.value)} />
              <span style={{ fontSize: "13px", color: "var(--text-3)" }}>jours</span>
            </div>
          </Row>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <div style={{ padding: "10px 16px 6px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "99px", background: "var(--brand-light)", color: "var(--brand)" }}>
              Bientôt disponible
            </span>
            <p style={{ fontSize: "11.5px", color: "var(--text-3)", margin: "4px 0 0" }}>Les notifications par email seront activées dans une prochaine version.</p>
          </div>
          <Row label="Nouvelle course assignée" border><Toggle value={notifNewRide} onChange={setNotifNewRide} /></Row>
          <Row label="Facture en attente" sub="Rappel après 48h sans paiement" border><Toggle value={notifUnpaid} onChange={setNotifUnpaid} /></Row>
          <Row label="Alertes véhicule / documents" border><Toggle value={notifAlerts} onChange={setNotifAlerts} /></Row>
          <Row label="Rapport journalier" sub="Résumé du CA envoyé chaque soir" border={false}><Toggle value={notifDailyReport} onChange={setNotifDailyReport} /></Row>
        </Section>

        {/* Affichage */}
        <Section title="Affichage">
          <Row label="Masquer le CA sur le dashboard" sub="Utile si des tiers voient l'écran" border>
            <Toggle value={!showCA} onChange={v => setShowCA(!v)} />
          </Row>
          <Row label="Devise" border>
            <select style={{ fontSize: "13px", color: "var(--text-2)", background: "transparent", outline: "none", border: "none", cursor: "pointer" }}
              value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="EUR">EUR €</option>
              <option value="CHF">CHF ₣</option>
              <option value="USD">USD $</option>
            </select>
          </Row>
          <Row label="Format de date" border>
            <select style={{ fontSize: "13px", color: "var(--text-2)", background: "transparent", outline: "none", border: "none", cursor: "pointer" }}
              value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
              <option value="dd/mm/yyyy">JJ/MM/AAAA</option>
              <option value="mm/dd/yyyy">MM/JJ/AAAA</option>
              <option value="yyyy-mm-dd">AAAA-MM-JJ</option>
            </select>
          </Row>
          <Row label="Début de semaine" border={false}>
            <select style={{ fontSize: "13px", color: "var(--text-2)", background: "transparent", outline: "none", border: "none", cursor: "pointer" }}
              value={weekStart} onChange={e => setWeekStart(e.target.value)}>
              <option value="monday">Lundi</option>
              <option value="sunday">Dimanche</option>
            </select>
          </Row>
        </Section>

        {/* Équipe */}
        {isAdmin && (
          <Section title="Équipe">
            {members.map(m => {
              const rs = ROLE_STYLES[m.role] || { bg: "var(--surface-2)", color: "var(--text-3)" };
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <p style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text)", margin: 0 }}>{m.email}</p>
                    <span style={{ display: "inline-block", fontSize: "11px", padding: "2px 7px", borderRadius: "99px", marginTop: 3, fontWeight: 500, background: rs.bg, color: rs.color }}>
                      {ROLE_LABELS[m.role] || m.role}
                    </span>
                  </div>
                  {m.id !== user?.id && (
                    <button
                      onClick={() => { if (confirm(`Retirer ${m.email} de l'équipe ?`)) removeMutation.mutate(m.id); }}
                      style={{ fontSize: "12.5px", color: "var(--danger)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "6px" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--danger-bg)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      Retirer
                    </button>
                  )}
                </div>
              );
            })}
            <button
              style={{ width: "100%", padding: "12px 16px", textAlign: "left", fontSize: "13.5px", fontWeight: 500, color: "var(--brand)", background: "none", border: "none", cursor: "pointer" }}
              onClick={() => { setInviteModal(true); setInviteLink(null); setInviteEmail(""); }}
            >
              + Inviter un membre
            </button>
          </Section>
        )}

        {/* Compte */}
        <Section title="Compte">
          <button style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => setPwModal(true)}>
            <Row label="Changer le mot de passe" border>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </Row>
          </button>
          <button style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => exportRidesCSV({})}>
            <Row label="Exporter toutes les courses" sub="Télécharge un fichier CSV" border>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </Row>
          </button>
          <button style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            onClick={() => toast("Pour supprimer votre compte, contactez-nous à support@mypilot.app", "info")}>
            <Row label="Supprimer le compte" sub="Contactez le support" border={false}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </Row>
          </button>
        </Section>

        {/* Boutons */}
        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          style={{
            width: "100%", padding: "12px", borderRadius: "10px", fontSize: "13.5px", fontWeight: 600,
            border: "none", cursor: "pointer", marginBottom: "10px",
            background: saved ? "var(--success)" : "var(--brand)",
            color: "white", opacity: mutation.isPending ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!mutation.isPending && !saved) e.currentTarget.style.background = "var(--brand-hover)"; }}
          onMouseLeave={e => { if (!saved) e.currentTarget.style.background = "var(--brand)"; }}
        >
          {mutation.isPending ? "Enregistrement..." : saved ? "Modifications enregistrées ✓" : "Sauvegarder les modifications"}
        </button>

        <button
          onClick={() => { signOut(); navigate("/"); }}
          style={{ width: "100%", padding: "11px", borderRadius: "10px", fontSize: "13.5px", fontWeight: 500, border: "1px solid #fecaca", background: "transparent", color: "var(--danger)", cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--danger-bg)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          Se déconnecter
        </button>
      </div>

      {/* Modal mot de passe */}
      {pwModal && (
        <div className="modal-overlay" onClick={() => setPwModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--border)", margin: "0 auto 20px" }} />
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", margin: "0 0 18px" }}>Changer le mot de passe</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Mot de passe actuel", val: pwCurrent, set: setPwCurrent, ac: "current-password" },
                { label: "Nouveau mot de passe", val: pwNew, set: setPwNew, ac: "new-password", ph: "6 caractères minimum" },
                { label: "Confirmer le nouveau mot de passe", val: pwConfirm, set: setPwConfirm, ac: "new-password" },
              ].map(({ label, val, set, ac, ph }) => (
                <div key={label}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>{label}</label>
                  <input type="password" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "9px", padding: "9px 12px", fontSize: "13.5px", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }}
                    value={val} onChange={e => set(e.target.value)} placeholder={ph || "••••••••"} autoComplete={ac}
                    onFocus={e => e.target.style.borderColor = "var(--brand)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => { setPwModal(false); setPwCurrent(""); setPwNew(""); setPwConfirm(""); }}
                style={{ flex: 1, padding: "11px", borderRadius: "9px", fontSize: "13.5px", fontWeight: 500, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={handleChangePassword} disabled={pwLoading || !pwCurrent || !pwNew || !pwConfirm}
                style={{ flex: 1, padding: "11px", borderRadius: "9px", fontSize: "13.5px", fontWeight: 600, border: "none", background: "var(--brand)", color: "white", cursor: "pointer", opacity: (pwLoading || !pwCurrent || !pwNew || !pwConfirm) ? 0.5 : 1 }}>
                {pwLoading ? "Modification..." : "Modifier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal invitation */}
      {inviteModal && (
        <div className="modal-overlay" onClick={() => setInviteModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--border)", margin: "0 auto 20px" }} />
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", margin: "0 0 18px" }}>Inviter un membre</p>
            {!inviteLink ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>Email</label>
                  <input type="email" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "9px", padding: "9px 12px", fontSize: "13.5px", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }}
                    value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="prenom@email.com"
                    onFocus={e => e.target.style.borderColor = "var(--brand)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>Rôle</label>
                  <select style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "9px", padding: "9px 12px", fontSize: "13.5px", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box", cursor: "pointer" }}
                    value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                    <option value="admin">Admin — accès complet</option>
                    <option value="manager">Manager — saisie et modification</option>
                    <option value="readonly">Lecture seule — consultation uniquement</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                  <button onClick={() => setInviteModal(false)} style={{ flex: 1, padding: "11px", borderRadius: "9px", fontSize: "13.5px", fontWeight: 500, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer" }}>
                    Annuler
                  </button>
                  <button onClick={() => inviteMutation.mutate()} disabled={!inviteEmail || inviteMutation.isPending}
                    style={{ flex: 1, padding: "11px", borderRadius: "9px", fontSize: "13.5px", fontWeight: 600, border: "none", background: "var(--brand)", color: "white", cursor: "pointer", opacity: (!inviteEmail || inviteMutation.isPending) ? 0.5 : 1 }}>
                    {inviteMutation.isPending ? "Génération..." : "Générer le lien"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "13px", color: "var(--text-2)", margin: "0 0 10px" }}>Lien d'invitation — valable 7 jours :</p>
                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "9px", padding: "10px 12px", fontSize: "12px", fontFamily: "monospace", color: "var(--text-2)", wordBreak: "break-all", marginBottom: "14px" }}>
                  {inviteLink}
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => { navigator.clipboard.writeText(inviteLink); toast("Lien copié !", "success"); }}
                    style={{ flex: 1, padding: "11px", borderRadius: "9px", fontSize: "13.5px", fontWeight: 600, border: "none", background: "var(--brand)", color: "white", cursor: "pointer" }}>
                    Copier le lien
                  </button>
                  <button onClick={() => setInviteModal(false)} style={{ flex: 1, padding: "11px", borderRadius: "9px", fontSize: "13.5px", fontWeight: 500, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer" }}>
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </Layout>
  );
}
