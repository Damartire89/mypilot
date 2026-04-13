import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCompanies, getCompanyUsers, deleteCompany, resetPassword, updateUserRole } from "../api/admin";

const ROLE_LABELS = { admin: "Admin", manager: "Manager", readonly: "Lecture", superadmin: "Super Admin" };
const ROLE_COLORS = {
  admin: "bg-blue-100 text-blue-800",
  manager: "bg-green-100 text-green-800",
  readonly: "bg-gray-100 text-gray-600",
  superadmin: "bg-purple-100 text-purple-800",
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

  if (isLoading) return <div className="p-8 text-gray-500">Chargement...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Panel Super Admin</h1>
        <p className="text-sm text-gray-500 mt-1">{companies.length} entreprise{companies.length > 1 ? "s" : ""} inscrite{companies.length > 1 ? "s" : ""}</p>
      </div>

      {resetResult && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="font-medium text-yellow-800 text-sm">Mot de passe temporaire généré :</p>
          <code className="text-base font-mono text-yellow-900 block mt-1">{resetResult}</code>
          <button onClick={() => setResetResult(null)} className="mt-2 text-xs text-yellow-600 underline">Fermer</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste entreprises */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-700 text-sm">Entreprises</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {companies.map((c) => (
              <div
                key={c.id}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedCompany?.id === c.id ? "bg-blue-50" : ""}`}
                onClick={() => setSelectedCompany(c)}
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.email} · {c.member_count} membre{c.member_count > 1 ? "s" : ""} · {c.activity_type}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Supprimer "${c.name}" et toutes ses données ?`)) {
                      deleteMutation.mutate(c.id);
                    }
                  }}
                  className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors ml-2 shrink-0"
                >
                  Supprimer
                </button>
              </div>
            ))}
            {companies.length === 0 && (
              <p className="px-4 py-8 text-sm text-gray-400 text-center">Aucune entreprise</p>
            )}
          </div>
        </div>

        {/* Membres de l'entreprise sélectionnée */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-700 text-sm">
              {selectedCompany ? `Membres — ${selectedCompany.name}` : "Sélectionner une entreprise"}
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.email}</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-0.5 font-medium ${ROLE_COLORS[m.role] || "bg-gray-100 text-gray-600"}`}>
                    {ROLE_LABELS[m.role] || m.role}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  {m.role !== "superadmin" && (
                    <>
                      <button
                        onClick={() => resetMutation.mutate(m.id)}
                        disabled={resetMutation.isPending}
                        className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
                      >
                        Reset mdp
                      </button>
                      <select
                        value={m.role}
                        onChange={(e) => roleMutation.mutate({ userId: m.id, role: e.target.value })}
                        className="text-xs border border-gray-200 rounded px-1 py-1 focus:outline-none"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="readonly">Lecture</option>
                      </select>
                    </>
                  )}
                </div>
              </div>
            ))}
            {selectedCompany && members.length === 0 && (
              <p className="px-4 py-8 text-sm text-gray-400 text-center">Aucun membre</p>
            )}
            {!selectedCompany && (
              <p className="px-4 py-8 text-sm text-gray-400 text-center">← Cliquer sur une entreprise pour voir ses membres</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
