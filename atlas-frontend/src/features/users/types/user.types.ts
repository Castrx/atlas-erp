/**
 * Espelha com.atlas.backend.dto.user.UserResponse (backend).
 *
 * Nota: o backend não devolve o papel (role) do usuário na resposta
 * (UserResponse só tem id/name/email) — por isso a tabela e o formulário
 * de edição não conseguem exibir/pré-preencher o perfil atual. O campo
 * `role` no formulário de edição fica em branco por padrão e o ADMIN
 * precisa escolher explicitamente antes de salvar (evita reenviar um
 * perfil errado por engano). Ver ROADMAP.md se/quando UserResponse passar
 * a incluir o papel.
 */
export interface User {
  id: number;
  name: string;
  email: string;
}

/**
 * Espelha com.atlas.backend.dto.user.CreateUserRequest (backend).
 * `role` é o nome do papel — hoje "ADMIN" ou "USER" (seed da migration V8).
 */
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: string;
}

/**
 * Espelha com.atlas.backend.dto.user.UpdateUserRequest (backend).
 * `password` é opcional — null/ausente mantém a senha atual.
 */
export interface UpdateUserInput {
  name: string;
  email: string;
  password?: string;
  role: string;
}
