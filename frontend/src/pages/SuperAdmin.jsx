import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCompanies, getCompanyUsers, deleteCompany, resetPassword, updateUserRole, getGlobalStats, getAuditLogs } from "../api/admin";
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
    staleTime: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-global-stats"],
    queryFn: getGlobalStats,
    staleTime: 60000,
  });

  const [auditFilter, setAuditFilter] = useState({ companyId: null, action: "" });
  const { data: auditLogs } = useQuery({
    queryKey: ["admin-audit-logs", auditFilter.companyId, auditFilter.action],
    queryFn: () => getAuditLogs({ companyId: auditFilter.companyId ?? undefined, action: auditFilter.action || undefined, limit: 50 }),
    staleTime: 15000,
    keepPreviousData: true,
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

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

        {/* Stats globales */}
        {stats && (
          <div style={{ marginTop: "20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" }}>
            <p style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.5px" }}>KPIs globaux</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" }}>
              {[
                { label: "Entreprises", value: `${stats.companies?.active ?? 0}`, sub: `${stats.companies?.deleted ?? 0} supprimées` },
                { label: "Utilisateurs", value: stats.users ?? 0 },
                { label: "Chauffeurs", value: stats.drivers ?? 0 },
                { label: "Véhicules", value: stats.vehicles ?? 0 },
                { label: "Courses", value: stats.rides ?? 0 },
                { label: "Logs audit", value: stats.audit_logs ?? 0 },
              ].map((k) => (
                <div key={k.label} style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.3px" }}>{k.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>{k.value}</p>
                  {k.sub && <p style={{ margin: "2px 0 0", fontSize: "10.5px", color: "var(--text-3)" }}>{k.sub}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit logs */}
        <div style={{ marginTop: "16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--text-2)" }}>
              Audit logs {auditLogs?.total != null && <span style={{ color: "var(--text-3)", fontWeight: 400 }}>· {auditLogs.total} total</span>}
            </p>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <select
                value={auditFilter.companyId ?? ""}
                onChange={(e) => setAuditFilter((f) => ({ ...f, companyId: e.target.value ? Number(e.target.value) : null }))}
                style={{ fontSize: "12px", border: "1px solid var(--border)", borderRadius: "7px", padding: "5px 8px", background: "var(--surface)", color: "var(--text)", outline: "none" }}
              >
                <option value="">Toutes entreprises</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input
                type="text"
                placeholder="Action (ex: change_role)"
                value={auditFilter.action}
                onChange={(e) => setAuditFilter((f) => ({ ...f, action: e.target.value }))}
                style={{ fontSize: "12px", border: "1px solid var(--border)", borderRadius: "7px", padding: "5px 8px", background: "var(--surface)", color: "var(--text)", outline: "none", width: "160px" }}
              />
            </div>
          </div>
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {(auditLogs?.items || []).map((log) => (
              <div key={log.id} style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>{log.action}</span>
                    <span style={{ color: "var(--text-3)" }}> · {log.entity_type}{log.entity_id ? `#${log.entity_id}` : ""}</span>
                    <span style={{ color: "var(--text-3)" }}> · {log.user_email || `user#${log.user_id ?? "?"}`}</span>
                  </div>
                  <span style={{ fontSize: "10.5px", color: "var(--text-3)", fontFamily: "monospace" }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString("fr-FR") : ""}
                  </span>
                </div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <pre style={{ margin: "4px 0 0", fontSize: "10.5px", color: "var(--text-3)", background: "var(--bg)", padding: "6px 8px", borderRadius: "6px", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {JSON.stringify(log.details, null, 0)}
                  </pre>
                )}
              </div>
            ))}
            {auditLogs && (auditLogs.items?.length ?? 0) === 0 && (
              <div style={{ padding: "30px 20px", textAlign: "center" }}>
                <p style={{ fontSize: "12.5px", color: "var(--text-3)", margin: 0 }}>Aucun log avec ces filtres</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
