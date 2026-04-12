import client from "./client";

export const getVehicles = () => client.get("/api/v1/vehicles").then(r => r.data);

export const createVehicle = (data) => client.post("/api/v1/vehicles", data).then(r => r.data);

export const updateVehicle = (id, data) => client.patch(`/api/v1/vehicles/${id}`, data).then(r => r.data);

export const deleteVehicle = (id) => client.delete(`/api/v1/vehicles/${id}`);
