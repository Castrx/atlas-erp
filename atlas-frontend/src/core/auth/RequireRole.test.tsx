import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { screen } from "@testing-library/react";

import { render } from "../../test/test-utils";
import { AuthContext } from "./useAuth";
import type { AuthContextValue } from "./useAuth";
import { RequireRole } from "./RequireRole";

function renderWithRoles(roles: string[], ui: ReactNode) {
  const authValue: AuthContextValue = {
    isAuthenticated: true,
    roles,
    hasRole: (role) => roles.includes(role),
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(<AuthContext.Provider value={authValue}>{ui}</AuthContext.Provider>);
}

describe("RequireRole", () => {
  it("USER não vê uma ação administrativa (ex.: Excluir)", () => {
    renderWithRoles(
      ["USER"],
      <RequireRole role="ADMIN">
        <button>Excluir</button>
      </RequireRole>
    );

    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
  });

  it("ADMIN vê a ação administrativa (ex.: Excluir)", () => {
    renderWithRoles(
      ["ADMIN"],
      <RequireRole role="ADMIN">
        <button>Excluir</button>
      </RequireRole>
    );

    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("mostra o fallback informado quando o usuário não tem o papel", () => {
    renderWithRoles(
      ["USER"],
      <RequireRole role="ADMIN" fallback={<span>Ação indisponível para o seu perfil</span>}>
        <button>Excluir</button>
      </RequireRole>
    );

    expect(screen.getByText("Ação indisponível para o seu perfil")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
  });
});
