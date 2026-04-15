import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://mypilot-api.onrender.com",
  headers: { "Content-Type": "application/json" },
});

// Injecte le token JWT automatiquement
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirige vers login si 401
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("company");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default client;
