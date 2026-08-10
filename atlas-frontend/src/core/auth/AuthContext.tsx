import { useCallback, useState } from "react";
import type { ReactNode } from "react";

import { authService } from "./services/auth.service";
import { AuthContext } from "./useAuth";
import { clearToken, getToken, setToken } from "./token";
import type { LoginRequest } from "./types/auth.types";

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(getToken())
  );

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    setToken(response.token);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
