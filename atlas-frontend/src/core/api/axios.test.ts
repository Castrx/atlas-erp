import { describe, expect, it } from "vitest";

import { shouldClearSessionOnError } from "./axios";
import { ENDPOINTS } from "./endpoints";

/**
 * Erro do axios "de mentira" — só o formato que shouldClearSessionOnError
 * realmente lê (isAxiosError, config.url, response.status). Não precisa
 * de uma requisição HTTP real para testar essa decisão.
 */
function fakeAxiosError(status: number, url: string) {
  return {
    isAxiosError: true,
    config: { url },
    response: { status },
  };
}

describe("shouldClearSessionOnError", () => {
  it("retorna true para 401 fora da tentativa de login (sessão expirada)", () => {
    expect(shouldClearSessionOnError(fakeAxiosError(401, "/products"))).toBe(true);
  });

  it("retorna false para 401 na própria tentativa de login (credenciais inválidas)", () => {
    expect(shouldClearSessionOnError(fakeAxiosError(401, ENDPOINTS.AUTH.LOGIN))).toBe(false);
  });

  it("retorna false para 403 — autenticado mas sem permissão nunca desloga", () => {
    expect(shouldClearSessionOnError(fakeAxiosError(403, "/users"))).toBe(false);
  });

  it("retorna false para outros status (ex.: 500)", () => {
    expect(shouldClearSessionOnError(fakeAxiosError(500, "/products"))).toBe(false);
  });

  it("retorna false para um erro que não é do axios", () => {
    expect(shouldClearSessionOnError(new Error("falha comum"))).toBe(false);
  });
});
