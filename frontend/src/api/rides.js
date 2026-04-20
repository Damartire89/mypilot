import client from "./client";

export async function getRides(params = {}) {
  const { data } = await client.get("/api/v1/rides", { params });
  return data;
}

export async function createRide(payload) {
  const { data } = await client.post("/api/v1/rides", payload);
  return data;
}

export async function updateRide(id, payload) {
  const { data } = await client.patch(`/api/v1/rides/${id}`, payload);
  return data;
}

export async function getRide(id) {
  const { data } = await client.get(`/api/v1/rides/${id}`);
  return data;
}

export async function deleteRide(id) {
  await client.delete(`/api/v1/rides/${id}`);
}

export async function getStatsSummary() {
  const { data } = await client.get("/api/v1/rides/stats/summary");
  return data;
}

export async function getStatsMonthly(year, month) {
  const { data } = await client.get("/api/v1/rides/stats/monthly", { params: { year, month } });
  return data;
}

export async function downloadRidePDF(id) {
  const base = import.meta.env.VITE_API_URL || "http://localhost:8002";
  const url = `${base}/api/v1/rides/export/pdf/${id}`;

  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) throw new Error(`Export PDF échoué (${response.status})`);

  const blob = await response.blob();
  const filename = response.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] || `facture-${id}.pdf`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export async function exportFEC(year) {
  const base = import.meta.env.VITE_API_URL || "http://localhost:8002";
  const url = `${base}/api/v1/rides/export/fec?year=${encodeURIComponent(year)}`;

  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error(`Export FEC échoué (${response.status})`);

  const blob = await response.blob();
  const filename = response.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] || `FEC-${year}.txt`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export async function exportRidesCSV(params = {}) {
  const base = import.meta.env.VITE_API_URL || "http://localhost:8002";
  const query = new URLSearchParams(params).toString();
  const url = `${base}/api/v1/rides/export/csv${query ? "?" + query : ""}`;

  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) throw new Error(`Export échoué (${response.status})`);

  const blob = await response.blob();
  const filename = response.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] || "courses.csv";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
