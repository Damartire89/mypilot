import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { checkInvitation, acceptInvitation } from "../api/members";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

const ROLE_LABELS = { admin: "Administrateur", manager: "Manager", readonly: "Lecture seule" };

export default function InviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkInvitation(token)
      .then(setInvitation)
      .catch(() => setError("Ce lien d'invitation est invalide ou expiré."));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await acceptInvitation(token, password);
      const meRes = await client.get("/api/v1/auth/me");
      signIn(data.access_token, { name: data.company_name }, meRes.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.detail || "Erreur lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", border: "1px solid var(--border)", borderRadius: "9px",
    padding: "10px 13px", fontSize: "14px", background: "var(--bg)",
    color: "var(--text)", boxSizing: "border-box", outline: "none",
  };

  if (error && !invitation) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "16px" }}>
      <div style={{ background: "var(--surface)", borderRadius: "16px", padding: "40px 32px", border: "1px solid var(--border)", maxWidth: "360px", width: "100%", textAlign: "center" }}>
        <p style={{ fontSize: "32px", margin: "0 0 12px" }}>⚠️</p>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--danger)", margin: "0 0 8px" }}>{error}</p>
        <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>Demandez un nouveau lien à l'administrateur.</p>
      </div>
    </div>
  );

  if (!invitation) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <p style={{ fontSize: "13px", color: "var(--text-3)" }}>Vérification du lien...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--brand)", padding: "16px" }}>
      <div className="animate-fade-in" style={{ background: "var(--surface)", borderRadius: "20px", padding: "32px", maxWidth: "380px", width: "100%", boxShadow: "var(--shadow-md)" }}>

        {/* Logo */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 0, marginBottom: "4px" }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: "var(--text)" }}>my</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: "var(--brand)" }}>pilot</span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>Gestion de flotte simplifiée</p>
        </div>

        <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>Vous êtes invité(e) !</p>
        <p style={{ fontSize: "13px", color: "var(--text-2)", margin: "0 0 24px", lineHeight: 1.5 }}>
          Rejoignez <strong style={{ color: "var(--text)" }}>{invitation.company_name}</strong> en tant que{" "}
          <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "99px", background: "var(--brand-light)", color: "var(--brand)" }}>
            {ROLE_LABELS[invitation.role] || invitation.role}
          </span>
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>Email</label>
            <input
              value={invitation.email}
              disabled
              style={{ ...inputStyle, background: "var(--surface-2)", color: "var(--text-3)" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-2)", marginBottom: "5px" }}>
              Choisir un mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 caractères minimum"
              required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "var(--brand)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>
          {error && (
            <div style={{ background: "var(--danger-bg)", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 13px" }}>
              <p style={{ fontSize: "13px", color: "var(--danger)", margin: 0 }}>{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px", borderRadius: "9px",
              background: "var(--brand)", color: "white",
              fontSize: "14px", fontWeight: 600, border: "none",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.65 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "var(--brand-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--brand)"; }}
          >
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
