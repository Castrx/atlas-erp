# Segurança — Atlas ERP

Este documento descreve o modelo de segurança atual do Atlas ERP, o que já está implementado, o que é uma limitação **aceita e conhecida** neste estágio do projeto, e como reportar vulnerabilidades. Ele reflete o comportamento real do código, validado com testes manuais ponta a ponta durante as Sprints 1A e 1B.

## Modelo de autenticação

- **Mecanismo**: JWT (JSON Web Token), assinado com **HS256**.
- **Fluxo**: `POST /auth/login` com `{ email, password }` → backend valida credenciais (BCrypt) → retorna `{ token }`. O token é enviado em todas as requisições subsequentes no header `Authorization: Bearer <token>`.
- **Sessão**: totalmente **stateless** — o backend não guarda sessão nem token em nenhum lugar; validação é feita recomputando a assinatura a cada requisição.
- **Expiração**: 24 horas (`jwt.expiration=86400000` em `application.yml`). Não há renovação automática nem refresh token — ao expirar, o usuário precisa logar novamente.
- **Claims do token**: `sub` (email), `roles` (lista de papéis), `iat`, `exp`. Nenhum dado sensível além do e-mail é incluído no payload.
- **Senha**: armazenada com hash BCrypt (`PasswordConfig` → `BCryptPasswordEncoder`), nunca em texto plano.

## Autorização

- Rotas públicas: `/auth/**`, `/swagger-ui/**`, `/v3/api-docs/**`.
- Todas as demais rotas exigem um JWT válido (`anyRequest().authenticated()`).
- Papéis `ADMIN` e `USER` existem no domínio (seed via migration `V8`), e o token carrega as roles do usuário — **mas nenhum endpoint hoje restringe acesso por papel**. `@EnableMethodSecurity` está habilitado no `SecurityConfig`, porém sem nenhuma anotação `@PreAuthorize` em uso. Ou seja: qualquer usuário autenticado, independentemente do papel, acessa qualquer endpoint protegido. **Isso é uma lacuna conhecida**, não uma escolha de design — ver [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md).

## CORS

Configurado explicitamente em `SecurityConfig` (Sprint 1A) para desenvolvimento:

- Origens permitidas: `http://localhost:5173`, `http://127.0.0.1:5173` (porta padrão do Vite).
- Métodos: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- Headers: `Authorization`, `Content-Type`.
- `allowCredentials: true`.
- Qualquer outra origem recebe `403 Invalid CORS request` — **não há wildcard (`*`)**.

Antes de qualquer deploy além do ambiente de desenvolvimento local, essa lista de origens precisa ser revisada e passar a refletir o(s) domínio(s) real(is) do frontend em produção.

## Tratamento de erros de autenticação

- Credenciais inválidas em `/auth/login` → `401 Unauthorized`, corpo `ApiError` com mensagem `"E-mail ou senha inválidos."` (corrigido na Sprint 1A — antes retornava incorretamente `500`).
- Requisição sem token, ou com token inválido/expirado, a uma rota protegida → `401 Unauthorized`.
- O frontend, ao receber `401` de qualquer chamada autenticada (exceto a própria tentativa de login), limpa o token local e redireciona para `/login` automaticamente.

## Limitações conhecidas e riscos aceitos (estágio atual)

Estas são decisões conscientes para o estágio de maturidade atual do projeto, **não recomendadas para produção** sem revisão:

| Item | Situação atual | Risco |
|---|---|---|
| Token armazenado em `localStorage` | Acessível via JavaScript no mesmo domínio | Exposto a XSS, se algum vetor de XSS existir na aplicação |
| Sem refresh token | Token de 24h fixo, sem revogação | Um token vazado permanece válido até expirar; não há logout server-side |
| Sem RBAC aplicado | Roles existem mas não são checadas | Qualquer usuário autenticado tem acesso equivalente a `ADMIN` |
| Sem rate limiting em `/auth/login` | Nenhum controle de tentativas | Suscetível a força bruta de credenciais |
| Sem bloqueio de conta | `isAccountNonLocked()` sempre `true` em `CustomUserDetails` | Nenhuma proteção contra tentativas repetidas por usuário |
| Logging de debug do filtro JWT | `JwtAuthenticationFilter` imprime o token recebido e claims no stdout a cada requisição | Vazamento de tokens em logs — **deve ser removido antes de qualquer ambiente compartilhado** |
| Secret JWT em `application.yml` | Chave simétrica em texto plano no repositório (ambiente de dev) | Não pode ser reusada fora de dev; produção exige variável de ambiente / secret manager |
| Sem multi-tenancy aplicado | `Company` existe no domínio mas não restringe acesso a dados | Em single-tenant hoje não é um problema; torna-se crítico se/quando multiempresa for ativado |

## Segredos e configuração sensível

Credenciais de banco (`atlas`/`atlas123`) e o secret JWT em `atlas-backend/src/main/resources/application.yml` são **valores de desenvolvimento local**, versionados propositalmente para facilitar onboarding no ambiente Docker Compose local. Eles **não devem ser reaproveitados** em nenhum ambiente acessível fora da máquina do desenvolvedor.

## Reportando uma vulnerabilidade

Este é um projeto em estágio inicial, sem programa formal de *responsible disclosure* ainda. Se você identificar uma vulnerabilidade:

1. **Não abra uma issue pública** descrevendo o problema em detalhe.
2. Reporte de forma privada ao mantenedor do repositório, descrevendo passos de reprodução e impacto.
3. Aguarde confirmação antes de divulgar publicamente.

À medida que o projeto amadurecer, este processo será formalizado (contato dedicado, política de tempo de resposta).
