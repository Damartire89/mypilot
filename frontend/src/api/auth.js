import client from "./client";

export async function login(email, password) {
  const { data } = await client.post("/api/v1/auth/login", { email, password });
  return data;
}

export async function register(companyName, email, password, activityType = "taxi") {
  const { data } = await client.post("/api/v1/auth/register", {
    company_name: companyName,
    email,
    password,
    activity_type: activityType,
  });
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  await client.post("/api/v1/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}
