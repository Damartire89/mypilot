import client from "./client";

export async function getPrixGasoil() {
  const { data } = await client.get("/api/v1/gasoil");
  return data;
}
