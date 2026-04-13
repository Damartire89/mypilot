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
      const meRes = await client.get("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` }
      });
      signIn(data.access_token, { name: data.company_name }, meRes.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.detail || "Erreur lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  }

  if (error && !invitation) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl p-8 shadow-sm border max-w-sm w-full text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-gray-400 text-sm mt-2">Demandez un nouveau lien à l'administrateur.</p>
      </div>
    </div>
  );

  if (!invitation) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400">Vérification du lien...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#3fa9f5] p-4">
      <div className="bg-white rounded-2xl p-8 shadow-xl max-w-sm w-full">
        {/* Logo */}
        <div className="mb-6">
          <div className="flex items-baseline gap-0 mb-1">
            <span className="text-2xl font-black text-[#1a1a2e]">my</span>
            <span className="text-2xl font-black text-[#3fa9f5]">pilot</span>
          </div>
          <p className="text-gray-400 text-sm">Gestion de flotte simplifiée</p>
        </div>

        <h1 className="text-lg font-bold text-gray-900 mb-1">Vous êtes invité(e) !</h1>
        <p className="text-sm text-gray-500 mb-6">
          Rejoignez <strong className="text-gray-900">{invitation.company_name}</strong> en tant que{" "}
          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
            {ROLE_LABELS[invitation.role] || invitation.role}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
            <input
              value={invitation.email}
              disabled
              className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Choisir un mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 caractères minimum"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3fa9f5]"
            />
          </div>
          {error && (
            <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3fa9f5] text-white py-3.5 rounded-xl text-sm font-bold hover:bg-[#3a7de8] transition-colors disabled:opacity-50"
          >
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
