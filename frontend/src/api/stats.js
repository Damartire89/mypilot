import client from "./client";

export async function getStatsByPeriod(year, month) {
  const { data } = await client.get("/api/v1/rides/stats/monthly", { params: { year, month } });
  return data;
}
