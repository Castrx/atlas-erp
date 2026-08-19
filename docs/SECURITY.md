# Segurança — Atlas ERP

Este documento descreve o modelo de segurança atual do Atlas ERP, o que já está implementado, o que é uma limitação **aceita e conhecida** neste estágio do projeto, e como reportar vulnerabilidades. Ele reflete o comportamento real do código, validado com testes manuais ponta a ponta durante as Sprints 1A e 1B.

## Modelo de autenticação

- **Mecanismo**: JWT (JSON Web Token), assinado com **HS256**.
- **Fluxo**: `POST /auth/login` com `{ email, password }` → backend valida credenciais (BCrypt) → retorna `{ token }`. O token é enviado em todas as requisições subsequentes no header `Authorization: Bearer <token>`.
- **Sessão**: totalmente **stateless** — o backend não guarda sessão nem token em nenhum lugar; validação é feita recomputando a assinatura a cada requisição.
- **Expiração**: 24 horas (`jwt.expiration=86400000` em `application.yml`). Não há renovação automática nem refresh token — ao expirar, o usuário precisa logar novamente.
- **Claims do token**: `sub` (email), `roles` (lista de papéis), `iat`, `exp`. Nenhum dado sensível além do e-mail é incluído no payload.
- **Senha**: armazenada com hash BCrypt (`PasswordConfig` → `BCryptPasswordEncoder`), nunca em texto plano; mínimo de 8 caracteres validado no cadastro (`register`) e na criação/edição de usuário (`POST`/`PUT /users`).
- **Rate limiting em `POST /auth/login`**: `LoginRateLimiter` + `LoginRateLimitFilter` contam tentativas em memória por IP (sem infraestrutura externa) e respondem `429 Too Many Requests` ao exceder o limite — default 5 tentativas por janela de 60s, configurável via `LOGIN_RATE_LIMIT_MAX_ATTEMPTS`/`LOGIN_RATE_LIMIT_WINDOW_SECONDS`, sem redeploy. Mitiga força bruta de credenciais; ver limitação de escala (instância única) na tabela abaixo.

## Autorização

- Rotas públicas: `/auth/**`, `/swagger-ui/**`, `/v3/api-docs/**`.
- Todas as demais rotas exigem um JWT válido (`anyRequest().authenticated()`).
- Papéis `ADMIN` e `USER` existem no domínio (seed via migration `V8`), e o token carrega as roles do usuário. A autorização é feita por papel no backend via `@PreAuthorize` (ex.: exclusão de produto/cliente é `ADMIN`-only), e a UI reflete os papéis, ocultando ações administrativas para `USER`.

## CORS

Configurado explicitamente em `SecurityConfig` (Sprint 1A) para desenvolvimento:

- Origens permitidas: `http://localhost:5173`, `http://127.0.0.1:5173` (porta padrão do Vite) e `http://localhost:3000` (frontend servido via Docker/nginx — ver `atlas-frontend/nginx.conf`).
- Métodos: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- Headers: `Authorization`, `Content-Type`.
- `allowCredentials: true`.
- Qualquer outra origem recebe `403 Invalid CORS request` — **não há wildcard (`*`)**.

Antes de qualquer deploy além do ambiente de desenvolvimento local, essa lista de origens precisa ser revisada e passar a refletir o(s) domínio(s) real(is) do frontend em produção.

## Tratamento de erros de autenticação

- Credenciais inválidas em `/auth/login` → `401 Unauthorized`, corpo `ApiError` com mensagem `"E-mail ou senha inválidos."` (corrigido na Sprint 1A — antes retornava incorretamente `500`).
- Excesso de tentativas de login (mesmo IP) → `429 Too Many Requests`, sem revelar se o e-mail existe.
- Requisição sem token, ou com token inválido/expirado, a uma rota protegida → `401 Unauthorized`, com mensagem fixa e genérica (`"Não autenticado."`) — não expõe o detalhe interno da exceção do framework ao cliente.
- O frontend, ao receber `401` de qualquer chamada autenticada (exceto a própria tentativa de login), limpa o token local e redireciona para `/login` automaticamente.

## Limitações conhecidas e riscos aceitos (estágio atual)

Estas são decisões conscientes para o estágio de maturidade atual do projeto, **não recomendadas para produção** sem revisão:

| Item | Situação atual | Risco |
|---|---|---|
| Token armazenado em `localStorage` | Acessível via JavaScript no mesmo domínio | Exposto a XSS, se algum vetor de XSS existir na aplicação |
| Sem refresh token | Token de 24h fixo, sem revogação | Um token vazado permanece válido até expirar; não há logout server-side |
| Gestão de papéis limitada | Papéis vêm do seed `V8` e de `POST /users` (ADMIN-only); o `register` público cria sempre `USER` | Sem auto-serviço de concessão de `ADMIN` — atribuição manual |
| Rate limiting em memória (não distribuído) | `LoginRateLimiter` conta tentativas por IP num `Map` local ao processo — adequado a uma instância única | Escala horizontal (múltiplas instâncias do backend) reseta o contador por instância; exigiria um contador compartilhado (ex.: Redis) |
| Sem bloqueio de conta | `isAccountNonLocked()` sempre `true` em `CustomUserDetails` | Nenhuma proteção contra tentativas repetidas por usuário |
| Logging do filtro JWT | `JwtAuthenticationFilter` registra apenas a categoria do erro em `DEBUG` (nunca token, header ou claims) | Risco baixo; não deve ser elevado a `INFO` sem revisão |
| Secret JWT | Fornecido pela variável de ambiente `JWT_SECRET` (default DEV-ONLY fictício em `application.yml`) | Produção exige um `JWT_SECRET` real e aleatório com **≥32 bytes**, não o default de dev |
| Sem multi-tenancy aplicado | `Company` existe no domínio mas não restringe acesso a dados | Em single-tenant hoje não é um problema; torna-se crítico se/quando multiempresa for ativado |

## Segredos e configuração sensível

Nenhuma credencial real é versionada. Toda a configuração sensível é lida de **variáveis de ambiente** (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`), com defaults DEV-ONLY fictícios e claramente marcados em `atlas-backend/src/main/resources/application.yml` (ex.: `CHANGE_ME_DB_PASSWORD`, `DEV_ONLY_CHANGE_ME_JWT_SECRET_...`). O modelo em `.env.example` contém apenas placeholders — nenhum valor real. As únicas credenciais concretas no código estão em **testes efêmeros** (Testcontainers, em `AbstractIntegrationTest`), isoladas da configuração da aplicação. Em produção, defina um `JWT_SECRET` real (≥32 bytes) via variável de ambiente e não reutilize os defaults de desenvolvimento.

## Reportando uma vulnerabilidade

Este é um projeto em estágio inicial, sem programa formal de *responsible disclosure* ainda. Se você identificar uma vulnerabilidade:

1. **Não abra uma issue pública** descrevendo o problema em detalhe.
2. Reporte de forma privada ao mantenedor do repositório, descrevendo passos de reprodução e impacto.
3. Aguarde confirmação antes de divulgar publicamente.

À medida que o projeto amadurecer, este processo será formalizado (contato dedicado, política de tempo de resposta).
