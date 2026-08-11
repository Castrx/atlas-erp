import { afterEach, describe, expect, it } from "vitest";

import { clearToken, decodeToken, getRoles, setToken } from "./token";

/**
 * Monta um JWT "de mentira" — três partes separadas por ponto, só o
 * payload (meio) precisa ser um base64url válido. decodeToken nunca
 * verifica assinatura (não precisa, é só para refletir permissão na UI),
 * então header e assinatura podem ser qualquer string.
 */
function fakeJwt(payload: object): string {
  const json = JSON.stringify(payload);
  const base64url = btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `header.${base64url}.signature`;
}

describe("decodeToken", () => {
  it("deve decodificar um payload válido, incluindo as roles", () => {
    const token = fakeJwt({ sub: "user@teste.local", roles: ["ADMIN"], iat: 1, exp: 2 });

    expect(decodeToken(token)).toEqual({
      sub: "user@teste.local",
      roles: ["ADMIN"],
      iat: 1,
      exp: 2,
    });
  });

  it("deve retornar null para token malformado", () => {
    expect(decodeToken("token-sem-formato-de-jwt")).toBeNull();
  });

  it("deve retornar null para string vazia", () => {
    expect(decodeToken("")).toBeNull();
  });
});

describe("getRoles", () => {
  afterEach(() => {
    clearToken();
  });

  it("deve retornar array vazio quando não há token armazenado", () => {
    expect(getRoles()).toEqual([]);
  });

  it("deve retornar as roles do token armazenado", () => {
    const token = fakeJwt({ sub: "x@teste.local", roles: ["USER", "ADMIN"], iat: 1, exp: 2 });
    setToken(token);

    expect(getRoles()).toEqual(["USER", "ADMIN"]);
  });
});
