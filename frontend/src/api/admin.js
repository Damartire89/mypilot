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
