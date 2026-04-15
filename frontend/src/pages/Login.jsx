import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import Logo from "../components/Logo";

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8a6 6 0 1 0 0 8"/><path d="M5 10h8M5 14h8"/>
      </svg>
    ),
    title: "CA en temps réel",
    desc: "Suivez votre chiffre d'affaires au jour, semaine et mois.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h5l3 5v3h-8V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    title: "Gestion de flotte",
    desc: "Statuts véhicules, alertes CT et assurance automatiques.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
    title: "Équipe chauffeurs",
    desc: "Profils, statuts et performances par chauffeur.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    title: "Export CSV",
    desc: "Exportez vos courses par période en un clic.",
  },
];

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ company_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slowWarning, setSlowWarning] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && form.password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères");
      return;
    }
    setLoading(true);
    setSlowWarning(false);
    const slowTimer = setTimeout(() => setSlowWarning(true), 5000);
    try {
      let data;
      if (mode === "login") {
        data = await login(form.email, form.password);
      } else {
        data = await register(form.company_name, form.email, form.password);
      }
      const meRes = await client.get("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` }
      });
      signIn(data.access_token, { name: data.company_name }, meRes.data);
      if (mode === "register") {
        localStorage.setItem("onboarding_needed", "1");
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Identifiants incorrects");
    } finally {
      clearTimeout(slowTimer);
      setSlowWarning(false);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>

      {/* Panneau gauche — visible uniquement desktop */}
      <div
        className="hidden lg:flex"
        style={{
          width: "50%",
          background: "linear-gradient(170deg, #1e3a5f 0%, #0c2a45 60%, #0e4f6a 100%)",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 56px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Cercles décoratifs */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 320, height: 320, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -60,
          width: 240, height: 240, borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }} />

        {/* Logo */}
        <div style={{ marginBottom: "40px" }}>
          <Logo size={32} dark />
        </div>

        {/* Tagline */}
        <p style={{ fontSize: "26px", fontWeight: 800, color: "white", lineHeight: 1.25, margin: "0 0 12px", maxWidth: "360px" }}>
          Gérez votre flotte<br />sans prise de tête.
        </p>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.75)", margin: "0 0 48px", maxWidth: "340px", lineHeight: 1.6 }}>
          L'outil pensé pour les patrons de taxi, VTC et ambulance qui gèrent 3 à 20 véhicules.
        </p>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "9px",
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "white", margin: "0 0 2px" }}>{f.title}</p>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tagline bas */}
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "48px", marginBottom: 0 }}>
          Taxi · VTC · Ambulance / VSL
        </p>
      </div>

      {/* Panneau droit — formulaire */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}>
        <div className="animate-fade-in w-full" style={{ maxWidth: "380px" }}>

          {/* Logo mobile uniquement */}
          <div className="lg:hidden" style={{ marginBottom: "28px", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "baseline", gap: 0, marginBottom: "6px" }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "var(--text)" }}>my</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: "var(--brand)" }}>pil</span>
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none" style={{ marginBottom: "1px", marginLeft: "1px", marginRight: "1px" }}>
                <circle cx="16" cy="16" r="13" stroke="var(--brand)" strokeWidth="3" fill="none"/>
                <circle cx="16" cy="16" r="3.5" fill="var(--brand)"/>
                <line x1="16" y1="12.5" x2="16" y2="3" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="13.5" y1="19" x2="6" y2="27" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="18.5" y1="19" x2="26" y2="27" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 28, fontWeight: 900, color: "var(--brand)" }}>t</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>Gestion de flotte simplifiée</p>
          </div>

          {/* Titre desktop */}
          <div className="hidden lg:block" style={{ marginBottom: "28px" }}>
            <p style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>
              {mode === "login" ? "Bienvenue !" : "Créer un compte"}
            </p>
            <p style={{ fontSize: "13.5px", color: "var(--text-3)", margin: 0 }}>
              {mode === "login" ? "Connectez-vous à votre espace" : "Commencez gratuitement, sans carte bancaire"}
            </p>
          </div>

          {/* Toggle */}
          <div style={{
            display: "flex", background: "var(--surface-2)", borderRadius: "10px",
            padding: "3px", marginBottom: "24px",
            border: "1px solid var(--border)",
          }}>
            {[
              { key: "login", label: "Connexion" },
              { key: "register", label: "Créer un compte" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setMode(key); setError(""); }}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: "8px",
                  fontSize: "13px", fontWeight: 500, border: "none", cursor: "pointer",
                  transition: "all 0.15s",
                  background: mode === key ? "var(--surface)" : "transparent",
                  color: mode === key ? "var(--text)" : "var(--text-3)",
                  boxShadow: mode === key ? "var(--shadow-xs)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {mode === "register" && (
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "6px" }}>
                  Nom de l'entreprise
                </label>
                <input
                  style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "9px", padding: "10px 13px", fontSize: "14px", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }}
                  placeholder="ex. Taxi Martin & Fils"
                  value={form.company_name}
                  onChange={e => set("company_name", e.target.value)}
                  onFocus={e => e.target.style.borderColor = "var(--brand)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                  autoComplete="organization"
                  required
                />
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "6px" }}>Adresse email</label>
              <input
                style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "9px", padding: "10px 13px", fontSize: "14px", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }}
                type="email" placeholder="vous@entreprise.fr"
                value={form.email} onChange={e => set("email", e.target.value)}
                onFocus={e => e.target.style.borderColor = "var(--brand)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "6px" }}>Mot de passe</label>
              <input
                style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "9px", padding: "10px 13px", fontSize: "14px", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }}
                type="password" placeholder="••••••••"
                value={form.password} onChange={e => set("password", e.target.value)}
                onFocus={e => e.target.style.borderColor = "var(--brand)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "register" ? 8 : undefined}
                required
              />
              {mode === "register" && (
                <p style={{ fontSize: "11px", color: "var(--text-3)", margin: "4px 0 0" }}>8 caractères minimum</p>
              )}
            </div>

            {error && (
              <div style={{ padding: "10px 13px", borderRadius: "8px", background: "var(--danger-bg)", border: "1px solid #fecaca", fontSize: "13px", color: "var(--danger)" }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="btn-primary-gradient"
              style={{
                width: "100%", color: "white", border: "none",
                borderRadius: "9px", padding: "11px", fontSize: "14px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.65 : 1, marginTop: "2px",
              }}
            >
              {loading ? (slowWarning ? "Démarrage du serveur..." : "Connexion...") : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          {mode === "login" && (
            <p style={{ textAlign: "center", fontSize: "12.5px", color: "var(--text-3)", marginTop: "18px", marginBottom: 0 }}>
              Pas encore de compte ?{" "}
              <button
                onClick={() => setMode("register")}
                style={{ background: "none", border: "none", color: "var(--brand)", fontWeight: 600, cursor: "pointer", fontSize: "12.5px", padding: 0 }}
              >
                Créer un compte
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
