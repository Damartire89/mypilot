import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ company_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let data;
      if (mode === "login") {
        data = await login(form.email, form.password);
      } else {
        data = await register(form.company_name, form.email, form.password);
      }
      signIn(data.access_token, { name: data.company_name });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#3fa9f5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">

        {/* Logo */}
        <div className="mb-6">
          <div className="flex items-baseline gap-0 mb-1">
            {/* my — noir */}
            <span className="text-3xl font-black text-[#1a1a2e]">my</span>
            {/* pil — bleu */}
            <span className="text-3xl font-black text-[#3fa9f5]">pil</span>
            {/* Volant = remplace le "o" */}
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginBottom: '1px', marginLeft: '1px', marginRight: '1px'}}>
              {/* Jante extérieure */}
              <circle cx="16" cy="16" r="13" stroke="#3fa9f5" strokeWidth="3" fill="none"/>
              {/* Moyeu central */}
              <circle cx="16" cy="16" r="3.5" fill="#3fa9f5"/>
              {/* Rayon haut */}
              <line x1="16" y1="12.5" x2="16" y2="3" stroke="#3fa9f5" strokeWidth="2.5" strokeLinecap="round"/>
              {/* Rayon bas-gauche */}
              <line x1="13.5" y1="19" x2="6" y2="27" stroke="#3fa9f5" strokeWidth="2.5" strokeLinecap="round"/>
              {/* Rayon bas-droit */}
              <line x1="18.5" y1="19" x2="26" y2="27" stroke="#3fa9f5" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            {/* t — bleu */}
            <span className="text-3xl font-black text-[#3fa9f5]">t</span>
          </div>
          <p className="text-gray-400 text-sm">Gestion de flotte simplifiée</p>
        </div>

        {/* Toggle login / register */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          {[
            { key: "login", label: "Connexion" },
            { key: "register", label: "Créer un compte" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setMode(key); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === key
                  ? "bg-white shadow text-[#1a1a2e]"
                  : "text-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                Nom de l'entreprise
              </label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5]"
                placeholder="ex. Taxi Martin & Fils"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Email
            </label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5]"
              type="email"
              placeholder="vous@votreentreprise.fr"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Mot de passe
            </label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-[#3fa9f5]"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3fa9f5] text-white rounded-xl py-3.5 text-sm font-bold mt-2 hover:bg-[#3a7de8] transition-colors disabled:opacity-60"
          >
            {loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        {mode === "login" && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Pas encore de compte ?{" "}
            <button
              onClick={() => setMode("register")}
              className="text-[#3fa9f5] font-semibold"
            >
              Créer un compte
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
