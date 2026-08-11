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

/**
 * Decide se um erro de resposta deve encerrar a sessão local. Extraída à
 * parte do interceptor para ser testável sem precisar montar uma
 * requisição HTTP real.
 *
 * Só 401 (não autenticado / token inválido ou expirado) desloga — e
 * mesmo assim não numa tentativa de login (isso é "credenciais
 * inválidas", tratado pelo formulário). 403 (autenticado, mas sem
 * permissão para a ação) é deliberadamente diferente: nunca limpa o
 * token nem redireciona — cada chamada trata esse erro no próprio ponto
 * de uso (normalmente exibindo a mensagem do `ApiError` do backend, ex.:
 * "Você não tem permissão para executar esta ação.").
 */
export function shouldClearSessionOnError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const isLoginRequest = error.config?.url === ENDPOINTS.AUTH.LOGIN;

  return error.response?.status === 401 && !isLoginRequest;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (shouldClearSessionOnError(error)) {
      clearToken();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);
