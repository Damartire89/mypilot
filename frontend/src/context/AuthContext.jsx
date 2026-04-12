import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [company, setCompany] = useState(() => {
    try { return JSON.parse(localStorage.getItem("company")); } catch { return null; }
  });

  function signIn(tokenValue, companyData) {
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("company", JSON.stringify(companyData));
    setToken(tokenValue);
    setCompany(companyData);
  }

  function signOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("company");
    setToken(null);
    setCompany(null);
  }

  return (
    <AuthContext.Provider value={{ token, company, signIn, signOut, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
