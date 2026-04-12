import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { getSettings, updateSettings } from "../api/settings";
import { exportRidesCSV } from "../api/rides";
import { changePassword } from "../api/auth";

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
    <div className="mb-5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">{title}</p>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">{children}</div>
    </div>
  );
}

function Row({ label, sub, children, border = true }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3.5 gap-3 ${border ? "border-b border-gray-50" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1a1a2e]">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} type="button"
      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${value ? "bg-[#3fa9f5]" : "bg-gray-200"}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${value ? "left-5.5 translate-x-0.5" : "left-0.5"}`} />
    </button>
  );
}

export default function Settings() {
  const { company, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();

  const { data: remote } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => { qc.invalidateQueries(["settings"]); setSaved(true); setTimeout(() => setSaved(false), 2000); },
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
    if (pwNew.length < 6) { toast("Le mot de passe doit faire au moins 6 caractères", "error"); return; }
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

  return (
    <div className="max-w-lg mx-auto pb-24 bg-gray-50 min-h-screen">
      <TopBar company={company?.name || "myPilot"} />
      <div className="p-4">
        <p className="text-lg font-black text-[#1a1a2e] mb-4">Paramètres</p>

        {/* Entreprise */}
        <Section title="Mon entreprise">
          <Row label="Nom de l'entreprise" border>
            <input className="text-sm text-right text-[#3fa9f5] font-semibold bg-transparent outline-none w-36 truncate"
              value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Nom..." />
          </Row>
          <Row label="SIRET" sub="14 chiffres" border>
            <input className="text-sm text-right text-gray-500 bg-transparent outline-none w-36"
              value={siret} onChange={e => setSiret(e.target.value)} placeholder="00000000000000" maxLength={14} />
          </Row>
          <Row label="Téléphone" border>
            <input className="text-sm text-right text-gray-500 bg-transparent outline-none w-36"
              value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 XX XX XX XX" />
          </Row>
          <Row label="Adresse" border={false}>
            <input className="text-sm text-right text-gray-500 bg-transparent outline-none w-36 truncate"
              value={address} onChange={e => setAddress(e.target.value)} placeholder="Ville..." />
          </Row>
        </Section>

        {/* Type d'activité */}
        <Section title="Type d'activité">
          <div className="p-3 grid grid-cols-2 gap-2">
            {ACTIVITY_TYPES.map(at => (
              <button key={at.value} onClick={() => setActivityType(at.value)} type="button"
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  activityType === at.value
                    ? "border-[#3fa9f5] bg-[#3fa9f5]/8 text-[#3fa9f5]"
                    : "border-gray-200 text-gray-500"
                }`}>
                <span>{at.icon}</span>{at.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Facturation */}
        <Section title="Facturation">
          <Row label="Préfixe facture" sub="ex. FAC, TXM, 2026-" border>
            <input className="text-sm text-right text-[#3fa9f5] font-semibold bg-transparent outline-none w-20"
              value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} placeholder="FAC" />
          </Row>
          <Row label="Prochain numéro" border>
            <input className="text-sm text-right text-gray-500 bg-transparent outline-none w-20"
              value={invoiceNextNumber} onChange={e => setInvoiceNextNumber(e.target.value)} placeholder="001" />
          </Row>
          <Row label="TVA" border>
            <div className="flex items-center gap-1">
              <input className="text-sm text-right text-gray-500 bg-transparent outline-none w-10"
                value={tvaRate} onChange={e => setTvaRate(e.target.value)} placeholder="10" />
              <span className="text-sm text-gray-400">%</span>
            </div>
          </Row>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">Modes de paiement actifs</p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_OPTIONS.map(p => (
                <button key={p} type="button" onClick={() => toggleArr(enabledPayments, setEnabledPayments, p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    enabledPayments.includes(p)
                      ? "bg-[#3fa9f5] text-white border-[#3fa9f5]"
                      : "bg-white text-gray-400 border-gray-200"
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <Row label="Pied de facture" sub="Texte libre affiché en bas des factures" border={false}>
            <input className="text-sm text-right text-gray-400 bg-transparent outline-none w-36 truncate"
              value={invoiceFooter} onChange={e => setInvoiceFooter(e.target.value)} placeholder="Merci de votre confiance" />
          </Row>
        </Section>

        {/* Alertes véhicule */}
        <Section title="Alertes & rappels">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-500 mb-2">Alertes activées</p>
            <div className="flex flex-wrap gap-2">
              {ALERT_TYPES.map(a => (
                <button key={a} type="button" onClick={() => toggleArr(enabledAlerts, setEnabledAlerts, a)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    enabledAlerts.includes(a)
                      ? "bg-[#1a1a2e] text-white border-[#1a1a2e]"
                      : "bg-white text-gray-400 border-gray-200"
                  }`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <Row label="Délai d'alerte" sub="Jours avant échéance" border={false}>
            <div className="flex items-center gap-1">
              <input className="text-sm text-right text-gray-500 bg-transparent outline-none w-12"
                type="number" value={alertDaysBefore} onChange={e => setAlertDaysBefore(e.target.value)} />
              <span className="text-sm text-gray-400">jours</span>
            </div>
          </Row>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
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
            <select className="text-sm text-gray-500 bg-transparent outline-none"
              value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="EUR">EUR €</option>
              <option value="CHF">CHF ₣</option>
              <option value="USD">USD $</option>
            </select>
          </Row>
          <Row label="Format de date" border>
            <select className="text-sm text-gray-500 bg-transparent outline-none"
              value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
              <option value="dd/mm/yyyy">JJ/MM/AAAA</option>
              <option value="mm/dd/yyyy">MM/JJ/AAAA</option>
              <option value="yyyy-mm-dd">AAAA-MM-JJ</option>
            </select>
          </Row>
          <Row label="Début de semaine" border={false}>
            <select className="text-sm text-gray-500 bg-transparent outline-none"
              value={weekStart} onChange={e => setWeekStart(e.target.value)}>
              <option value="monday">Lundi</option>
              <option value="sunday">Dimanche</option>
            </select>
          </Row>
        </Section>

        {/* Compte */}
        <Section title="Compte">
          <button className="w-full" onClick={() => setPwModal(true)}>
            <Row label="Changer le mot de passe" border>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3fa9f5" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </Row>
          </button>
          <button className="w-full" onClick={() => exportRidesCSV({})}>
            <Row label="Exporter toutes les courses" sub="Télécharge un fichier CSV" border>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3fa9f5" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </Row>
          </button>
          <Row label="Supprimer le compte" sub="Action irréversible" border={false}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </Row>
        </Section>

        {/* Sauvegarde */}
        <button onClick={handleSave} disabled={mutation.isPending}
          className={`w-full rounded-xl py-4 text-sm font-bold mb-3 transition-all ${
            saved ? "bg-green-500 text-white" : "bg-[#3fa9f5] text-white disabled:opacity-60"
          }`}>
          {mutation.isPending ? "Enregistrement..." : saved ? "Modifications enregistrées ✓" : "Sauvegarder les modifications"}
        </button>

        <button onClick={() => { signOut(); navigate("/"); }}
          className="w-full border border-red-200 text-red-400 rounded-xl py-3.5 text-sm font-semibold">
          Se déconnecter
        </button>
      </div>
      {/* Modal changement mot de passe */}
      {pwModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setPwModal(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-5" onClick={e => e.stopPropagation()}>
            <p className="text-base font-black text-[#1a1a2e] mb-4">Changer le mot de passe</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Mot de passe actuel</label>
                <input
                  type="password"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5]"
                  value={pwCurrent}
                  onChange={e => setPwCurrent(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5]"
                  value={pwNew}
                  onChange={e => setPwNew(e.target.value)}
                  placeholder="6 caractères minimum"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5]"
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setPwModal(false); setPwCurrent(""); setPwNew(""); setPwConfirm(""); }}
                className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-500">
                Annuler
              </button>
              <button
                onClick={handleChangePassword}
                disabled={pwLoading || !pwCurrent || !pwNew || !pwConfirm}
                className="flex-1 bg-[#3fa9f5] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-50">
                {pwLoading ? "Modification..." : "Modifier"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
