import { createContext, useContext } from "react";

import type { LoginRequest } from "./types/auth.types";

export interface AuthContextValue {
  isAuthenticated: boolean;
  /**
   * Papéis do usuário atual, decodificados do JWT (ex.: ["ADMIN"]). Só
   * para refletir permissões na UI — a autorização real é sempre do
   * backend (@PreAuthorize), nunca decidida a partir disto.
   */
  roles: string[];
  /**
   * Mecanismo reutilizável de checagem de permissão na UI. Centraliza a
   * lógica (`roles.includes(role)`) para nenhum componente duplicá-la.
   */
  hasRole: (role: string) => boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  }

  return context;
}
