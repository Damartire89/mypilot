import client from "./client";

export async function getCompanies() {
  const { data } = await client.get("/api/v1/admin/companies");
  return data;
}

export async function getCompanyUsers(companyId) {
  const { data } = await client.get(`/api/v1/admin/companies/${companyId}/users`);
  return data;
}

export async function deleteCompany(companyId) {
  await client.delete(`/api/v1/admin/companies/${companyId}`);
}

export async function resetPassword(userId) {
  const { data } = await client.post(`/api/v1/admin/users/${userId}/reset-password`);
  return data;
}

export async function updateUserRole(userId, role) {
  const { data } = await client.patch(`/api/v1/admin/users/${userId}/role`, { role });
  return data;
}

export async function getGlobalStats() {
  const { data } = await client.get("/api/v1/admin/stats/global");
  return data;
}

export async function getAuditLogs({ companyId, action, limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (companyId != null) params.set("company_id", String(companyId));
  if (action) params.set("action", action);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  const { data } = await client.get(`/api/v1/admin/audit-logs?${params.toString()}`);
  return data;
}
