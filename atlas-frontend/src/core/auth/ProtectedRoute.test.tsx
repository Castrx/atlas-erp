import { describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { screen } from "@testing-library/react";

import { render } from "../../test/test-utils";
import { AuthContext } from "./useAuth";
import type { AuthContextValue } from "./useAuth";
import { ProtectedRoute } from "./ProtectedRoute";

/**
 * Testa o comportamento real observável do ProtectedRoute (redireciona
 * ou não, conforme autenticação) fornecendo o AuthContext real diretamente
 * — sem mockar useAuth nem reimplementar a lógica de autenticação, só
 * controlando o dado que ela já expõe.
 */
function renderProtectedRoute(isAuthenticated: boolean) {
  const authValue: AuthContextValue = {
    isAuthenticated,
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <Routes>
        <Route path="/login" element={<div>Página de login</div>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Conteúdo protegido</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthContext.Provider>,
    { initialEntries: ["/"] }
  );
}

describe("ProtectedRoute", () => {
  it("deve renderizar o conteúdo protegido quando o usuário está autenticado", () => {
    renderProtectedRoute(true);

    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
  });

  it("deve redirecionar para /login quando o usuário não está autenticado", () => {
    renderProtectedRoute(false);

    expect(screen.getByText("Página de login")).toBeInTheDocument();
    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
  });
});
