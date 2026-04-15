import { useState, useCallback, createContext, useContext } from "react";

const ToastContext = createContext(null);

const ICONS = {
  success: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  error: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  warning: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

const STYLES = {
  success: { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", icon: "#16a34a" },
  error:   { bg: "#fef2f2", border: "#fecaca", color: "#dc2626", icon: "#ef4444" },
  warning: { bg: "#fffbeb", border: "#fde68a", color: "#d97706", icon: "#f59e0b" },
  info:    { bg: "var(--brand-light)", border: "var(--brand-muted)", color: "var(--brand)", icon: "var(--brand)" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 2800) => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{
        position: "fixed",
        top: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "100%",
        maxWidth: "360px",
        padding: "0 16px",
        pointerEvents: "none",
      }}>
        {toasts.map(({ id, message, type }) => {
          const s = STYLES[type] || STYLES.success;
          return (
            <div key={id} className="animate-toast-in" style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "11px 14px",
              borderRadius: "10px",
              background: s.bg,
              border: `1px solid ${s.border}`,
              boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
              fontSize: "13.5px",
              fontWeight: 500,
              color: s.color,
              pointerEvents: "auto",
            }}>
              <span style={{ color: s.icon, flexShrink: 0 }}>{ICONS[type]}</span>
              {message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
