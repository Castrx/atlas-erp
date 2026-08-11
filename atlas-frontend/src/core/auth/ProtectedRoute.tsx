import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "./useAuth";

type Props = {
  children: ReactNode;
  /**
   * Papel exigido para acessar a rota (ex.: "ADMIN"). Opcional — sem ele,
   * a rota exige só autenticação, como antes. Isto é conveniência de
   * navegação (evita levar o usuário a uma tela que ele não pode usar);
   * a proteção real de cada chamada de API continua sendo o
   * @PreAuthorize do backend.
   */
  requiredRole?: string;
};

export function ProtectedRoute({ children, requiredRole }: Props) {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
