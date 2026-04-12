import client from "./client";

export async function getDrivers() {
  const { data } = await client.get("/api/v1/drivers");
  return data;
}

export async function createDriver(payload) {
  const { data } = await client.post("/api/v1/drivers", payload);
  return data;
}

export async function updateDriver(id, payload) {
  const { data } = await client.patch(`/api/v1/drivers/${id}`, payload);
  return data;
}

export async function deleteDriver(id) {
  await client.delete(`/api/v1/drivers/${id}`);
}

export async function getDriverStats(id, year, month) {
  const { data } = await client.get(`/api/v1/drivers/${id}/stats`, { params: { year, month } });
  return data;
}
