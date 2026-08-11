import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";

import { render } from "../../test/test-utils";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "./useAuth";
import { authService } from "./services/auth.service";
import { clearToken } from "./token";

vi.mock("./services/auth.service", () => ({
  authService: { login: vi.fn() },
}));

/**
 * Monta um JWT "de mentira" com as roles desejadas — decodeToken não
 * verifica assinatura, então isso é suficiente para testar o AuthContext
 * de ponta a ponta (login real do provider, token real em localStorage,
 * roles decodificadas de verdade).
 */
function fakeToken(roles: string[]): string {
  const payload = { sub: "usuario@teste.local", roles, iat: 1, exp: 9_999_999_999 };
  const base64url = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `header.${base64url}.signature`;
}

/**
 * Componente de sonda: expõe o estado do AuthContext no DOM para o teste
 * ler, e botões para disparar login/logout reais através do provider.
 */
function AuthProbe() {
  const { isAuthenticated, roles, hasRole, login, logout } = useAuth();

  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="roles">{roles.join(",")}</span>
      <span data-testid="is-admin">{String(hasRole("ADMIN"))}</span>
      <button onClick={() => login({ email: "admin@teste.local", password: "x" })}>
        entrar
      </button>
      <button onClick={logout}>sair</button>
    </div>
  );
}

describe("AuthContext", () => {
  afterEach(() => {
    clearToken();
  });

  it("começa não autenticado e sem papéis quando não há token", () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("roles")).toHaveTextContent("");
  });

  it("deve interpretar corretamente as authorities do token após o login", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockResolvedValue({ token: fakeToken(["ADMIN"]) });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await user.click(screen.getByRole("button", { name: "entrar" }));

    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("roles")).toHaveTextContent("ADMIN");
    expect(screen.getByTestId("is-admin")).toHaveTextContent("true");
  });

  it("hasRole deve retornar false para um papel que o usuário não tem", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockResolvedValue({ token: fakeToken(["USER"]) });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await user.click(screen.getByRole("button", { name: "entrar" }));

    expect(screen.getByTestId("roles")).toHaveTextContent("USER");
    expect(screen.getByTestId("is-admin")).toHaveTextContent("false");
  });

  it("logout limpa autenticação e papéis", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockResolvedValue({ token: fakeToken(["ADMIN"]) });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await user.click(screen.getByRole("button", { name: "entrar" }));
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");

    await user.click(screen.getByRole("button", { name: "sair" }));

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("roles")).toHaveTextContent("");
  });
});
