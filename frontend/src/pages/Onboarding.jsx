import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateSettings } from "../api/settings";
import { createVehicle } from "../api/vehicles";
import { createDriver } from "../api/drivers";
import { useToast } from "../components/Toast";

const ACTIVITY_TYPES = [
  { value: "taxi",      label: "Taxi",              emoji: "🚕" },
  { value: "vtc",       label: "VTC",               emoji: "🚘" },
  { value: "ambulance", label: "Ambulance / VSL",   emoji: "🚑" },
  { value: "school",    label: "Transport scolaire", emoji: "🚌" },
];

const STEPS = [
  { id: 1, label: "Votre activité",  subtitle: "Quel type de transport gérez-vous ?" },
  { id: 2, label: "Votre flotte",    subtitle: "Ajoutez votre premier véhicule (optionnel)" },
  { id: 3, label: "Votre équipe",    subtitle: "Ajoutez votre premier chauffeur (optionnel)" },
];

function StepDots({ current }) {
  return (
    <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "32px" }}>
      {STEPS.map((s) => (
        <div
          key={s.id}
          style={{
            width: s.id === current ? 20 : 7,
            height: 7,
            borderRadius: "99px",
            background: s.id === current ? "var(--brand)" : s.id < current ? "var(--brand-muted)" : "var(--border)",
            transition: "all 0.25s",
          }}
        />
      ))}
    </div>
  );
}

export default function Onboarding() {
  const { company, signIn, token, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Étape 1 — activité
  const [activityType, setActivityType] = useState("taxi");

  // Étape 2 — véhicule
  const [vehicle, setVehicle] = useState({ plate: "", brand: "", model: "", year: "" });
  const [skipVehicle, setSkipVehicle] = useState(false);

  // Étape 3 — chauffeur
  const [driver, setDriver] = useState({ name: "", phone: "" });
  const [skipDriver, setSkipDriver] = useState(false);

  const setV = (k, v) => setVehicle(f => ({ ...f, [k]: v }));
  const setD = (k, v) => setDriver(f => ({ ...f, [k]: v }));

  const handleFinish = async () => {
    setLoading(true);
    try {
      // 1. Sauvegarder le type d'activité
      await updateSettings({ activity_type: activityType });

      // 2. Véhicule si renseigné
      if (!skipVehicle && vehicle.plate) {
        const data = { plate: vehicle.plate.toUpperCase(), status: "available" };
        if (vehicle.brand) data.brand = vehicle.brand;
        if (vehicle.model) data.model = vehicle.model;
        if (vehicle.year) data.year = parseInt(vehicle.year);
        await createVehicle(data);
      }

      // 3. Chauffeur si renseigné
      if (!skipDriver && driver.name) {
        await createDriver({ name: driver.name, phone: driver.phone || undefined, status: "active" });
      }

      // Supprimer le flag onboarding
      localStorage.removeItem("onboarding_needed");

      toast("Bienvenue sur myPilot !", "success");
      navigate("/dashboard");
    } catch {
      toast("Erreur lors de la configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", border: "1px solid var(--border)", borderRadius: "9px",
    padding: "10px 13px", fontSize: "14px", background: "var(--bg)",
    color: "var(--text)", boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div className="animate-fade-in" style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "20px", width: "100%", maxWidth: "440px",
        padding: "36px 32px",
        boxShadow: "var(--shadow-md)",
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <div style={{ display: "inline-flex", alignItems: "baseline", marginBottom: "20px" }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: "var(--text)" }}>my</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: "var(--brand)" }}>pilot</span>
          </div>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px", background: "var(--brand-light)", display: "inline-block", padding: "3px 10px", borderRadius: "99px" }}>
            Étape {step} sur {STEPS.length}
          </p>
          <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)", margin: "10px 0 4px" }}>
            {STEPS[step - 1].label}
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>
            {STEPS[step - 1].subtitle}
          </p>
        </div>

        <StepDots current={step} />

        {/* ÉTAPE 1 — Activité */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {ACTIVITY_TYPES.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setActivityType(a.value)}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "14px 16px", borderRadius: "10px",
                  border: activityType === a.value ? "2px solid var(--brand)" : "1px solid var(--border)",
                  background: activityType === a.value ? "var(--brand-light)" : "transparent",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ fontSize: "22px", lineHeight: 1 }}>{a.emoji}</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: activityType === a.value ? "var(--brand)" : "var(--text)" }}>
                  {a.label}
                </span>
                {activityType === a.value && (
                  <svg style={{ marginLeft: "auto" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ÉTAPE 2 — Véhicule */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>
                Immatriculation
              </label>
              <input
                style={{ ...inputStyle, textTransform: "uppercase" }}
                placeholder="AB-123-CD"
                value={vehicle.plate}
                onChange={e => setV("plate", e.target.value.toUpperCase())}
                onFocus={e => e.target.style.borderColor = "var(--brand)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
                disabled={skipVehicle}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>Marque</label>
                <input style={inputStyle} placeholder="Renault" value={vehicle.brand} onChange={e => setV("brand", e.target.value)}
                  onFocus={e => e.target.style.borderColor = "var(--brand)"} onBlur={e => e.target.style.borderColor = "var(--border)"} disabled={skipVehicle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>Modèle</label>
                <input style={inputStyle} placeholder="Trafic" value={vehicle.model} onChange={e => setV("model", e.target.value)}
                  onFocus={e => e.target.style.borderColor = "var(--brand)"} onBlur={e => e.target.style.borderColor = "var(--border)"} disabled={skipVehicle} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>Année</label>
              <input style={inputStyle} type="number" placeholder="2023" value={vehicle.year} onChange={e => setV("year", e.target.value)}
                onFocus={e => e.target.style.borderColor = "var(--brand)"} onBlur={e => e.target.style.borderColor = "var(--border)"} disabled={skipVehicle} />
            </div>
            <button
              type="button"
              onClick={() => setSkipVehicle(s => !s)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "none", border: "none", padding: 0,
                fontSize: "13px", color: "var(--text-3)", cursor: "pointer", marginTop: "4px",
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: "4px",
                border: skipVehicle ? "2px solid var(--brand)" : "2px solid var(--border)",
                background: skipVehicle ? "var(--brand)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {skipVehicle && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
              </div>
              Je le ferai plus tard
            </button>
          </div>
        )}

        {/* ÉTAPE 3 — Chauffeur */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>
                Nom complet *
              </label>
              <input style={inputStyle} placeholder="Prénom NOM" value={driver.name} onChange={e => setD("name", e.target.value)}
                onFocus={e => e.target.style.borderColor = "var(--brand)"} onBlur={e => e.target.style.borderColor = "var(--border)"} disabled={skipDriver} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>Téléphone</label>
              <input style={inputStyle} placeholder="06 XX XX XX XX" value={driver.phone} onChange={e => setD("phone", e.target.value)}
                onFocus={e => e.target.style.borderColor = "var(--brand)"} onBlur={e => e.target.style.borderColor = "var(--border)"} disabled={skipDriver} />
            </div>
            <button
              type="button"
              onClick={() => setSkipDriver(s => !s)}
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, fontSize: "13px", color: "var(--text-3)", cursor: "pointer", marginTop: "4px" }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: "4px",
                border: skipDriver ? "2px solid var(--brand)" : "2px solid var(--border)",
                background: skipDriver ? "var(--brand)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {skipDriver && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
              </div>
              Je le ferai plus tard
            </button>
          </div>
        )}

        {/* Boutons de navigation */}
        <div style={{ display: "flex", gap: "10px", marginTop: "28px" }}>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              style={{
                flex: 1, padding: "11px", borderRadius: "9px", fontSize: "13.5px", fontWeight: 500,
                border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer",
              }}
            >
              Retour
            </button>
          )}
          {step < STEPS.length ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="btn-primary-gradient"
              style={{
                flex: 1, padding: "11px", borderRadius: "9px", fontSize: "13.5px", fontWeight: 600,
                color: "white", cursor: "pointer",
              }}
            >
              Continuer →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="btn-primary-gradient"
              style={{
                flex: 1, padding: "11px", borderRadius: "9px", fontSize: "13.5px", fontWeight: 600,
                color: "white",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.65 : 1,
              }}
            >
              {loading ? "Configuration..." : "Accéder au tableau de bord"}
            </button>
          )}
        </div>

        {/* Skip tout — visible uniquement à l'étape 3 */}
        {step === STEPS.length && (
          <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-3)", marginTop: "16px", marginBottom: 0 }}>
            <button
              onClick={() => { localStorage.removeItem("onboarding_needed"); navigate("/dashboard"); }}
              style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: "12px", padding: 0, textDecoration: "underline" }}
            >
              Passer la configuration
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
