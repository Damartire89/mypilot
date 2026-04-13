import client from "./client";

export async function getMembers() {
  const { data } = await client.get("/api/v1/members");
  return data;
}

export async function inviteMember(email, role) {
  const { data } = await client.post("/api/v1/members/invite", { email, role });
  return data;
}

export async function updateMemberRole(userId, role) {
  const { data } = await client.patch(`/api/v1/members/${userId}/role`, { role });
  return data;
}

export async function removeMember(userId) {
  await client.delete(`/api/v1/members/${userId}`);
}

export async function checkInvitation(token) {
  const { data } = await client.get(`/api/v1/invitations/${token}`);
  return data;
}

export async function acceptInvitation(token, password) {
  const { data } = await client.post(`/api/v1/invitations/${token}/accept`, { password });
  return data;
}
