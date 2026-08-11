const TOKEN_KEY = "atlas:token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Espelha as claims que o backend inclui no JWT (ver JwtService.generateToken
 * no atlas-backend): `sub` é o e-mail, `roles` é a lista de papéis do
 * usuário (ex.: ["ADMIN"]).
 */
export interface TokenPayload {
  sub: string;
  roles: string[];
  iat: number;
  exp: number;
}

/**
 * Decodifica o payload do JWT (base64url) sem verificar a assinatura — não
 * precisa: isso é só para refletir permissões na UI (esconder/desabilitar),
 * nunca para decidir se uma ação é permitida. Quem valida o token de
 * verdade é sempre o backend. Retorna null se o token estiver ausente ou
 * malformado, para nunca derrubar a aplicação por causa de um token
 * inesperado.
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

    return JSON.parse(atob(padded)) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Único ponto de leitura dos papéis do usuário atual — lê o token
 * armazenado e decodifica. Usado pelo AuthContext para não duplicar essa
 * lógica em cada componente que precisa checar permissão.
 */
export function getRoles(): string[] {
  const token = getToken();

  if (!token) {
    return [];
  }

  return decodeToken(token)?.roles ?? [];
}
