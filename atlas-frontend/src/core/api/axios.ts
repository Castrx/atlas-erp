import axios from "axios";

import { clearToken, getToken } from "../auth/token";
import { ENDPOINTS } from "./endpoints";

export const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url === ENDPOINTS.AUTH.LOGIN;

    // Um 401 na própria tentativa de login é "credenciais inválidas" e deve
    // ser tratado pelo formulário. Só forçamos logout/redirecionamento quando
    // uma requisição autenticada perde a validade do token.
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !isLoginRequest
    ) {
      clearToken();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);