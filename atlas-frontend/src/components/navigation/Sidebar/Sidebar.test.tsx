import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { render } from "../../../test/test-utils";
import { AuthContext } from "../../../core/auth/useAuth";
import type { AuthContextValue } from "../../../core/auth/useAuth";
import { Sidebar } from "./Sidebar";

function renderSidebar(roles: string[]) {
  const authValue: AuthContextValue = {
    isAuthenticated: true,
    roles,
    hasRole: (role) => roles.includes(role),
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <Sidebar />
    </AuthContext.Provider>
  );
}

describe("Sidebar", () => {
  it("USER vê os itens sem exigência de papel, mas não Usuários/Empresas", () => {
    renderSidebar(["USER"]);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Produtos")).toBeInTheDocument();
    expect(screen.getByText("Clientes")).toBeInTheDocument();
    expect(screen.getByText("Categorias")).toBeInTheDocument();
    expect(screen.getByText("Estoque")).toBeInTheDocument();
    expect(screen.getByText("Vendas")).toBeInTheDocument();

    expect(screen.queryByText("Usuários")).not.toBeInTheDocument();
    expect(screen.queryByText("Empresas")).not.toBeInTheDocument();
  });

  it("ADMIN vê o menu completo, incluindo Usuários e Empresas", () => {
    renderSidebar(["ADMIN"]);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Produtos")).toBeInTheDocument();
    expect(screen.getByText("Clientes")).toBeInTheDocument();
    expect(screen.getByText("Usuários")).toBeInTheDocument();
    expect(screen.getByText("Empresas")).toBeInTheDocument();
  });
});
