import api from "./api";

export async function loginRequest(login, senha) {
  const response = await api.post("/auth/login", {
    login,
    senha,
  });

  return response.data;
}

export async function meRequest() {
  const response = await api.get("/auth/me");
  return response.data;
}