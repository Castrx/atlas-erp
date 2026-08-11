import type { ReactNode } from "react";

import { useAuth } from "./useAuth";

interface Props {
  role: string;
  children: ReactNode;
  /** Renderizado no lugar de `children` quando o usuário não tem o papel. */
  fallback?: ReactNode;
}

/**
 * Mecanismo reutilizável para esconder/desabilitar ações e trechos de UI
 * conforme o papel do usuário — reflexo de UX, nunca mecanismo de
 * segurança. Se o usuário não tiver o papel exigido, `children` some da
 * árvore (ou é trocado por `fallback`), mas a permissão real de qualquer
 * ação continua sendo decidida pelo backend a cada requisição.
 *
 * Uso: <RequireRole role="ADMIN"><Button>Excluir</Button></RequireRole>
 */
export function RequireRole({ role, children, fallback = null }: Props) {
  const { hasRole } = useAuth();

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
