export default function ConfirmModal({ title, message, confirmLabel = "Supprimer", onConfirm, onCancel, danger = true }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-sheet" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-sheet-body">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "9px", flexShrink: 0,
              background: danger ? "var(--danger-bg)" : "var(--warning-bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: danger ? "var(--danger)" : "var(--warning)",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>{title}</p>
              <p style={{ fontSize: "13px", color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>{message}</p>
            </div>
          </div>
        </div>
        <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "9px 18px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
              border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "9px 18px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 600,
              border: "none", cursor: "pointer",
              background: danger ? "var(--danger)" : "var(--warning)",
              color: "white",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
