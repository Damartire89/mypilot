import { createContext, useContext, useState, useEffect } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    client.get("/api/v1/auth/me")
      .then(({ data }) => {
        setUser(data);
        setCompany({ id: data.company_id, name: data.company_name });
      })
      .catch(() => {
        setUser(null);
        setCompany(null);
      })
      .finally(() => setBooted(true));
  }, []);

  async function signIn(_tokenValue, companyData, userData = null) {
    if (companyData) setCompany(companyData);
    if (userData) {
      setUser(userData);
    } else {
      try {
        const { data } = await client.get("/api/v1/auth/me");
        setUser(data);
        setCompany({ id: data.company_id, name: data.company_name });
      } catch {
        /* ignore */
      }
    }
  }

  async function signOut() {
    try { await client.post("/api/v1/auth/logout"); } catch { /* ignore */ }
    setUser(null);
    setCompany(null);
  }

  return (
    <AuthContext.Provider value={{ user, company, signIn, signOut, isAuth: !!user, booted }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
