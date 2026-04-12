import client from "./client";

export async function getSettings() {
  const { data } = await client.get("/api/v1/settings");
  return data;
}

export async function updateSettings(payload) {
  const { data } = await client.patch("/api/v1/settings", payload);
  return data;
}
