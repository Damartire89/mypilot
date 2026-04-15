import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCompanies, getCompanyUsers, deleteCompany, resetPassword, updateUserRole } from "../api/admin";
import Layout from "../components/Layout";

const ROLE_LABELS = { admin: "Admin", manager: "Manager", readonly: "Lecture", superadmin: "Super Admin" };
const ROLE_STYLES = {
  admin:      { bg: "var(--brand-light)", color: "var(--brand)" },
  manager:    { bg: "#f0fdf4", color: "#15803d" },
  readonly:   { bg: "var(--surface-2)", color: "var(--text-3)" },
  superadmin: { bg: "var(--accent-violet-bg)", color: "var(--accent-violet)" },
};

export default function SuperAdmin() {
  const qc = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [resetResult, setResetResult] = useState(null);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: getCompanies,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["admin-company-users", selectedCompany?.id],
    queryFn: () => getCompanyUsers(selectedCompany.id),
    enabled: !!selectedCompany,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      qc.invalidateQueries(["admin-companies"]);
      setSelectedCompany(null);
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (data) => setResetResult(data.temporary_password),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: () => qc.invalidateQueries(["admin-company-users", selectedCompany?.id]),
  });

  if (isLoading) {
    return (
      <Layout title="Super Admin">
        <div style={{ padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "var(--text-3)" }}>Chargement...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Super Admin">
      <div className="p-4 lg:p-6 max-w-6xl mx-auto animate-fade-in">

        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>Panel Super Admin</p>
          <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--text-3)" }}>
            {companies.length} entreprise{companies.length > 1 ? "s" : ""} inscrite{companies.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Résultat reset mdp */}
        {resetResult && (
          <div style={{
            marginBottom: "16px", padding: "14px 16px",
            background: "var(--warning-bg)", border: "1px solid #fde68a", borderRadius: "10px",
          }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--warning)", margin: "0 0 6px" }}>Mot de passe temporaire généré :</p>
            <code style={{ fontSize: "14px", fontFamily: "monospace", color: "var(--warning-text)", display: "block" }}>{resetResult}</code>
            <button
              onClick={() => setResetResult(null)}
              style={{ marginTop: "8px", background: "none", border: "none", fontSize: "12px", color: "var(--warning)", cursor: "pointer", textDecoration: "underline", padding: 0 }}
            >
              Fermer
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }} className="grid-cols-1 lg:grid-cols-2">

          {/* Liste entreprises */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--text-2)" }}>Entreprises</p>
            </div>
            <div>
              {companies.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCompany(c)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", cursor: "pointer",
                    borderBottom: "1px solid var(--border)",
                    background: selectedCompany?.id === c.id ? "var(--brand-light)" : "transparent",
                  }}
                  onMouseEnter={e => { if (selectedCompany?.id !== c.id) e.currentTarget.style.background = "var(--bg)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = selectedCompany?.id === c.id ? "var(--brand-light)" : "transparent"; }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "13.5px", fontWeight: 600, color: selectedCompany?.id === c.id ? "var(--brand)" : "var(--text)", margin: 0 }}>
                      {c.name}
                    </p>
                    <p style={{ fontSize: "11.5px", color: "var(--text-3)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.email} · {c.member_count} membre{c.member_count > 1 ? "s" : ""} · {c.activity_type}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Supprimer "${c.name}" et toutes ses données ?`)) deleteMutation.mutate(c.id);
                    }}
                    style={{
                      flexShrink: 0, marginLeft: "8px",
                      padding: "5px 10px", borderRadius: "7px", fontSize: "12px", fontWeight: 500,
                      background: "var(--danger-bg)", border: "none", color: "var(--danger)", cursor: "pointer",
                    }}
                  >
                    Suppr.
                  </button>
                </div>
              ))}
              {companies.length === 0 && (
                <div style={{ padding: "40px 24px", textAlign: "center" }}>
                  <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>Aucune entreprise</p>
                </div>
              )}
            </div>
          </div>

          {/* Membres */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--text-2)" }}>
                {selectedCompany ? `Membres — ${selectedCompany.name}` : "Sélectionner une entreprise"}
              </p>
            </div>
            <div>
              {members.map((m) => {
                const rs = ROLE_STYLES[m.role] || ROLE_STYLES.readonly;
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</p>
                      <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 600, padding: "2px 7px", borderRadius: "99px", marginTop: "4px", background: rs.bg, color: rs.color }}>
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                    </div>
                    {m.role !== "superadmin" && (
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0, marginLeft: "8px" }}>
                        <button
                          onClick={() => resetMutation.mutate(m.id)}
                          disabled={resetMutation.isPending}
                          style={{
                            padding: "5px 10px", borderRadius: "7px", fontSize: "12px", fontWeight: 500,
                            background: "var(--warning-bg)", border: "none", color: "var(--warning)", cursor: "pointer",
                          }}
                        >
                          Reset mdp
                        </button>
                        <select
                          value={m.role}
                          onChange={(e) => roleMutation.mutate({ userId: m.id, role: e.target.value })}
                          style={{
                            fontSize: "12px", border: "1px solid var(--border)", borderRadius: "7px",
                            padding: "5px 8px", background: "var(--bg)", color: "var(--text)", outline: "none", cursor: "pointer",
                          }}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="readonly">Lecture</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
              {selectedCompany && members.length === 0 && (
                <div style={{ padding: "40px 24px", textAlign: "center" }}>
                  <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>Aucun membre</p>
                </div>
              )}
              {!selectedCompany && (
                <div style={{ padding: "40px 24px", textAlign: "center" }}>
                  <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>← Cliquer sur une entreprise</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
