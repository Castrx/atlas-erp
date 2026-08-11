import { describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { screen } from "@testing-library/react";

import { render } from "../../test/test-utils";
import { AuthContext } from "./useAuth";
import type { AuthContextValue } from "./useAuth";
import { ProtectedRoute } from "./ProtectedRoute";

function authValueWith(
  isAuthenticated: boolean,
  roles: string[] = []
): AuthContextValue {
  return {
    isAuthenticated,
    roles,
    hasRole: (role) => roles.includes(role),
    login: vi.fn(),
    logout: vi.fn(),
  };
}

/**
 * Testa o comportamento real observável do ProtectedRoute (redireciona
 * ou não, conforme autenticação/papel) fornecendo o AuthContext real
 * diretamente — sem mockar useAuth nem reimplementar a lógica, só
 * controlando o dado que ela já expõe.
 */
function renderProtectedRoute(authValue: AuthContextValue, requiredRole?: string) {
  return render(
    <AuthContext.Provider value={authValue}>
      <Routes>
        <Route path="/login" element={<div>Página de login</div>} />
        <Route path="/" element={<div>Dashboard</div>} />
        <Route
          path="/protegida"
          element={
            <ProtectedRoute requiredRole={requiredRole}>
              <div>Conteúdo protegido</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthContext.Provider>,
    { initialEntries: ["/protegida"] }
  );
}

describe("ProtectedRoute", () => {
  it("deve renderizar o conteúdo protegido quando o usuário está autenticado", () => {
    renderProtectedRoute(authValueWith(true));

    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
  });

  it("deve redirecionar para /login quando o usuário não está autenticado", () => {
    renderProtectedRoute(authValueWith(false));

    expect(screen.getByText("Página de login")).toBeInTheDocument();
    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
  });

  it("deve redirecionar para / quando autenticado mas sem o papel exigido pela rota", () => {
    renderProtectedRoute(authValueWith(true, ["USER"]), "ADMIN");

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
  });

  it("deve renderizar o conteúdo quando autenticado e com o papel exigido pela rota", () => {
    renderProtectedRoute(authValueWith(true, ["ADMIN"]), "ADMIN");

    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
  });
});
