import { createContext, useContext, useState, useEffect } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [company, setCompany] = useState(() => {
    try { return JSON.parse(localStorage.getItem("company")); } catch { return null; }
  });
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  // Charger le profil utilisateur si token présent mais user absent
  useEffect(() => {
    if (token && !user) {
      client.get("/api/v1/auth/me")
        .then(({ data }) => {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
        })
        .catch(() => signOut());
    }
  }, [token]);

  function signIn(tokenValue, companyData, userData = null) {
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("company", JSON.stringify(companyData));
    setToken(tokenValue);
    setCompany(companyData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }
  }

  function signOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("company");
    localStorage.removeItem("user");
    setToken(null);
    setCompany(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, company, user, signIn, signOut, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
