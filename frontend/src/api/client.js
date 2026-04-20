import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://mypilot-api.onrender.com",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

function readCookie(name) {
  const prefix = name + "=";
  for (const c of document.cookie.split("; ")) {
    if (c.startsWith(prefix)) return decodeURIComponent(c.slice(prefix.length));
  }
  return null;
}

client.interceptors.request.use((config) => {
  const method = (config.method || "get").toUpperCase();
  if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    const csrf = readCookie("mypilot_csrf");
    if (csrf) config.headers["X-CSRF-Token"] = csrf;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default client;
