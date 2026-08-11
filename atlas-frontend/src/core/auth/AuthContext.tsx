import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { authService } from "./services/auth.service";
import { AuthContext } from "./useAuth";
import { clearToken, getRoles, getToken, setToken } from "./token";
import type { LoginRequest } from "./types/auth.types";

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(getToken())
  );

  // Decodificado uma única vez aqui (a partir do token já em localStorage)
  // e recalculado só em login/logout — nenhum componente re-decodifica o
  // JWT por conta própria.
  const [roles, setRoles] = useState<string[]>(() => getRoles());

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    setToken(response.token);
    setIsAuthenticated(true);
    setRoles(getRoles());
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setIsAuthenticated(false);
    setRoles([]);
  }, []);

  const hasRole = useCallback(
    (role: string) => roles.includes(role),
    [roles]
  );

  const value = useMemo(
    () => ({ isAuthenticated, roles, hasRole, login, logout }),
    [isAuthenticated, roles, hasRole, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
