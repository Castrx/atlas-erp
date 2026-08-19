# Arquitetura — Atlas ERP

Este documento descreve a arquitetura **atual** do Atlas ERP: como o sistema está organizado, como as partes se comunicam, e quais decisões estruturais já foram tomadas. Ele reflete o estado real do código, não um estado desejado — gaps conhecidos são marcados explicitamente como tal.

## Visão geral

```
┌─────────────────────┐        HTTPS/JSON        ┌──────────────────────┐        JDBC        ┌─────────────┐
│   atlas-frontend     │ ────────────────────────▶│    atlas-backend      │ ──────────────────▶│  PostgreSQL  │
│   React + Vite SPA   │◀──────────────────────── │  Spring Boot REST API │◀────────────────── │   (Docker)   │
└─────────────────────┘      Bearer JWT           └──────────────────────┘                     └─────────────┘
```

- O frontend é uma SPA que consome a API via Axios; não há server-side rendering.
- O backend é uma API REST stateless — nenhuma sessão é mantida no servidor, autenticação é feita por JWT em cada requisição.
- O banco é PostgreSQL, versionado por migrations Flyway (`atlas-backend/src/main/resources/db/migration`, atualmente 15 migrations, `V1` a `V15`).
- Não há gateway, service mesh, filas ou cache distribuído — é uma arquitetura monolítica de dois serviços, adequada ao estágio atual do produto.

## Backend (`atlas-backend/`)

Camadas, no padrão Spring Boot convencional:

```
controller/   → recebe HTTP, valida entrada (@Valid), delega ao service
service/      → regra de negócio
repository/   → Spring Data JPA (interfaces, sem SQL manual)
entity/       → mapeamento JPA
dto/          → records de request/response, por domínio (auth/, product/, sale/, ...)
mapper/       → conversão entity ↔ DTO (hoje só existe UserMapper)
security/     → JWT, UserDetails, filtro de autenticação
config/       → beans de configuração (Security, CORS, senha, OpenAPI, propriedades JWT)
exception/    → exceções de domínio + handler global
```

### Módulos de domínio implementados

Company, Category, Product, User (+ Role), Customer, Sale (+ SaleItem), StockMovement — cada um com controller, service, repository e DTOs próprios. Endpoints expostos:

```
/auth/register, /auth/login   (público)
/companies
/categories
/products
/customers
/stock
/sales
/users
/dashboard
```

Ver [API_GUIDELINES.md](API_GUIDELINES.md) para convenções de request/response e [domain-model.md](domain-model.md) para o modelo de entidades.

### Autenticação e segurança

Fluxo completo documentado em [SECURITY.md](SECURITY.md). Resumo: login stateless via JWT (HS256), filtro `JwtAuthenticationFilter` popula o `SecurityContextHolder` a partir do header `Authorization: Bearer <token>`, `SecurityConfig` define `/auth/**` e Swagger como públicos e tudo mais como autenticado. `POST /auth/login` passa antes por `LoginRateLimitFilter` (contador em memória por IP via `LoginRateLimiter`, `429` ao exceder o limite configurável) — mitigação de força bruta, ver [SECURITY.md](SECURITY.md).

### Tratamento de erros

`GlobalExceptionHandler` (`@RestControllerAdvice`) centraliza a conversão de exceções em respostas HTTP consistentes (`ApiError`: `timestamp`, `status`, `error`, `message`, `path`). Mapeamento atual:

| Exceção | Status HTTP |
|---|---|
| `BadCredentialsException` | 401 |
| `AccessDeniedException` (`@PreAuthorize` negado) | 403 |
| `ResourceNotFoundException` | 404 |
| `BusinessException` | 409 |
| `MethodArgumentNotValidException` (Bean Validation) | 400 |
| Qualquer outra `Exception` | 500 |

### Autorização por papel (RBAC)

Desde a Sprint 7A, todo endpoint tem `@PreAuthorize` explícito (`hasAuthority('ADMIN')` ou `hasAnyAuthority('USER','ADMIN')`) — nenhum depende implicitamente só de `anyRequest().authenticated()`. Decisões de desenho:

- **`hasAuthority`, nunca `hasRole`**: as roles são persistidas sem prefixo `ROLE_` (`ADMIN`, `USER` — ver migration `V8`), e `hasRole('ADMIN')` do Spring Security procuraria por `ROLE_ADMIN`, que não existe. Usar `hasRole` aqui quebraria silenciosamente todo o RBAC.
- **Sem `RoleHierarchy`**: ADMIN não herda USER automaticamente por hierarquia implícita — cada endpoint aberto a USER declara `hasAnyAuthority('USER','ADMIN')` explicitamente. Mais verboso, mas auditável lendo o controller, sem "mágica" escondida em configuração.
- **`AccessDeniedException` → 403**: adicionado ao `GlobalExceptionHandler` nesta sprint — sem esse handler explícito, a negação de `@PreAuthorize` caía no handler genérico de `Exception` (500), o que mascarava um 403 real como erro de servidor.

Matriz de permissões:

| Endpoint / funcionalidade | USER | ADMIN |
|---|:---:|:---:|
| `POST /auth/register`, `POST /auth/login` | 🌐 Público | 🌐 Público |
| `/users/**` (gestão de usuários) | ❌ | ✅ |
| `/companies/**` (dados da empresa) | ❌ | ✅ |
| `GET/POST/PUT /customers` | ✅ | ✅ |
| `DELETE /customers/{id}` | ❌ | ✅ |
| `GET/POST/PUT /products` | ✅ | ✅ |
| `DELETE /products/{id}` | ❌ | ✅ |
| `GET /categories` | ✅ | ✅ |
| `POST/PUT/DELETE /categories` | ❌ | ✅ |
| `GET/POST /sales` | ✅ | ✅ |
| `DELETE /sales/{id}` (cancelar) | ❌ | ✅ |
| `/stock/**` (entrada/saída/histórico) | ✅ | ✅ |
| `GET /dashboard` | ✅ | ✅ |

**Auto-registro sempre cria USER.** `POST /auth/register` ignora o campo `role` do corpo da requisição — mesmo enviando `role: "ADMIN"`, o usuário criado é sempre `USER` (`AuthenticationService.SELF_REGISTER_ROLE`). Criar ou promover um ADMIN só é possível via `POST /users`, que já é `ADMIN`-only — ou seja, é preciso já ter um ADMIN para criar outro. **Provisionamento do primeiro ADMIN**: `AdminBootstrapRunner` resolve esse gap — na subida do backend, se `ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD` estiverem definidos, o primeiro ADMIN de uma instalação nova é criado automaticamente. É idempotente: se o e-mail já existir, nada é feito.

O frontend (Sprint 7B) **reflete** essas permissões para UX (esconder/desabilitar ação que o usuário não pode fazer, ver seção "Autenticação no frontend" abaixo) — a autorização real é sempre o `@PreAuthorize` do backend; o frontend nunca é o mecanismo de segurança.

### Testes automatizados (`src/test/`)

Desde a Sprint 6A, organizados em três pacotes:

```
unit/          → Mockito puro, sem Spring nem banco (services, JwtService)
integration/   → MockMvc + Testcontainers, ponta a ponta real (*IT.java)
support/       → infraestrutura reutilizável (AbstractIntegrationTest, TestDataFactory)
```

Os testes de integração sobem um PostgreSQL efêmero via Testcontainers (mesma imagem do `docker-compose.yml`), completamente isolado do banco de desenvolvimento — nenhum teste depende de dado semeado manualmente, e `mvn test` não exige mais `docker compose up -d postgres` rodando antes (só o Docker em execução). Cada teste roda numa transação revertida ao final. O Surefire precisou ser configurado explicitamente para incluir `**/*IT.java` (por padrão só roda `**/*Test.java`), para `mvn test` cobrir as duas suítes num único comando. Cobertura atual (137 testes): `JwtService`, `LoginRateLimiter`, `AuthenticationService`, `ProductService`, `CategoryService`, `CustomerService`, `SaleService`, `StockService`, `DashboardService`, `AdminBootstrapRunner`, `DemoDataRunner` (unitário) e `AuthController`, `ProductController`, `CategoryController`, `CustomerController`, `CompanyController`, `UserController`, `SaleController`, `StockController`, `DashboardController`, além de `LoginRateLimitIT` e `SaleConcurrencyIT` (integração) — ver [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md) (`AE-060`) para o que ainda falta.

## Frontend (`atlas-frontend/`)

Organização por responsabilidade, dentro de `src/`:

```
core/         → infraestrutura transversal: api (axios), auth, router, theme, providers, query
features/     → módulos de produto, cada um com pages/ + components/ + services/ próprios
components/   → componentes compartilhados (ui/ = design system próprio, navigation/ = shell)
layouts/      → composição visual (MainLayout)
```

### Árvore de providers

```
AppProviders
 └─ QueryClientProvider (TanStack Query)
     └─ AuthProvider (core/auth — estado de autenticação)
         └─ ThemeProvider (MUI, tokens em core/theme)
             └─ CssBaseline
                 └─ App → AppRouter (BrowserRouter + rotas)
```

### Roteamento

`core/router/routes.tsx` define as rotas. Hoje:

| Rota | Acesso | Conteúdo |
|---|---|---|
| `/login` | público | `LoginPage` (feature `auth`) |
| `/` | protegido (`ProtectedRoute`) | `MainLayout` + `DashboardPage` (feature `dashboard`) |
| `/products` | protegido (`ProtectedRoute`) | `MainLayout` + `ProductsPage` (feature `products`) |
| `/customers` | protegido (`ProtectedRoute`) | `MainLayout` + `CustomersPage` (feature `customers`) |
| `/vendas` | protegido (`ProtectedRoute`) | `MainLayout` + `VendasPage` (feature `vendas`) |
| `/estoque` | protegido (`ProtectedRoute`) | `MainLayout` + `EstoquePage` (feature `estoque`) |
| `/categories` | protegido (`ProtectedRoute`) | `MainLayout` + `CategoriesPage` (feature `categories`) |
| `/users` | protegido (`ProtectedRoute requiredRole="ADMIN"`) | `MainLayout` + `UsersPage` (feature `users`) |
| `/companies` | protegido (`ProtectedRoute requiredRole="ADMIN"`) | `MainLayout` + `CompaniesPage` (feature `companies`) |

Todos os módulos de negócio já têm rota e item de menu ligados. `NavItem` (`components/navigation`) aceita um `path` opcional e navega via `react-router` quando presente; "Usuários" e "Empresas" usam `requiredRole="ADMIN"` tanto na rota quanto no filtro do menu (`Sidebar`, via `hasRole`) — a autorização real de qualquer forma é sempre o `@PreAuthorize` do backend. Financeiro, Relatórios e Configurações permanecem apenas visuais, sem destino (fora de escopo, ver Marco H no [Roadmap](ROADMAP.md)).

### Autenticação no frontend

- `core/auth/token.ts` é o **único** ponto de acesso ao `localStorage` para o token — nenhum componente acessa `localStorage` diretamente. Desde a Sprint 7B, também expõe `decodeToken`/`getRoles` (decodifica o claim `roles` do JWT — sem verificar assinatura, não precisa: é só para refletir permissão na UI, nunca para autorizar de verdade).
- `core/auth/AuthContext.tsx` + `useAuth.ts` expõem `{ isAuthenticated, roles, hasRole, login, logout }` via Context API. `roles`/`hasRole` são calculados uma vez no login/logout — nenhum componente decodifica o token por conta própria.
- `core/auth/RequireRole.tsx` (Sprint 7B): mecanismo reutilizável para esconder/mostrar UI conforme papel (`<RequireRole role="ADMIN">...</RequireRole>`), usado hoje na filtragem do menu (`Sidebar`) e disponível para as próximas telas administrativas.
- `core/api/axios.ts` tem interceptors: request injeta `Authorization: Bearer`; response trata `401` (exceto na própria chamada de login) limpando o token e redirecionando para `/login` — única situação que desloga. `403` (autenticado, sem permissão) é tratado deliberadamente diferente desde a Sprint 7B: nunca limpa o token nem redireciona (`shouldClearSessionOnError`, extraída à parte para ser testável sem HTTP real).
- `core/auth/ProtectedRoute.tsx` faz o guard client-side, baseado na presença do token (sem decodificar `exp` — ver limitações em [SECURITY.md](SECURITY.md)) e, desde a Sprint 7B, aceita um `requiredRole` opcional — redireciona para `/` se autenticado mas sem o papel exigido pela rota (conveniência de navegação; a proteção real de cada chamada é o backend).

### Data fetching

TanStack Query está configurado (`core/providers/queryClient.ts`) e, desde a Sprint 3A, é o padrão em uso em todas as features (`dashboard`, `products`, `customers`, `vendas`, `estoque`, `categories`, `companies`, `users`): cada hook (`useDashboard`, `useProducts`, `useCustomers`, `useSales`, `useStockHistory`, `useCategories`, `useCompanies`, `useUsers`, etc.) consome o endpoint via `useQuery`, sem cálculo algum no cliente — só busca e cacheia o payload já processado pelo backend.

### Testes automatizados

Desde a Sprint 6A: Vitest + React Testing Library, configurados em `vite.config.ts` (seção `test`) sobre a infraestrutura já existente — nenhuma ferramenta além do necessário (`npm run test`). Infraestrutura reutilizável em `src/test/`:

```
src/test/setup.ts        → jest-dom, cleanup automático entre testes, stubs de
                            scrollIntoView/matchMedia/ResizeObserver (o MUI exige
                            essas APIs de navegador, ausentes no jsdom)
src/test/test-utils.tsx  → render() customizado (QueryClientProvider + MemoryRouter)
                            e createQueryWrapper() para testes de hook
```

Convenção: teste ao lado do arquivo testado (`Componente.test.tsx` no mesmo diretório), não numa árvore `__tests__/` paralela — casa com a estrutura `features/<módulo>/` já estabelecida. Os `*.service.ts` são mockados no lugar dos hooks nos testes de componente/hook, para continuar exercitando TanStack Query e React Hook Form + Zod reais, só sem bater na API. Cobertura atual (71 testes): `ProtectedRoute` (incl. `requiredRole`), `ProductFormDialog`, `CustomerFormDialog`, `SaleFormDialog`, `StockMovementDialog`, as páginas `ProductsPage`, `CustomersPage`, `VendasPage`, `EstoquePage`, `CategoriesPage`, os hooks `useProducts`, `useCustomers`, `useSales`, `useStockHistory`, `AuthContext` (roles/`hasRole` após login/logout), `RequireRole`, `Sidebar` (menu por papel), leitura de roles do JWT (`token.ts`) e `shouldClearSessionOnError` (`axios.ts`) — ver [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md) (`AE-061`) para o que ainda falta.

## Débito técnico e código órfão conhecido

Um levantamento estrutural (Sprint 0) identificou arquivos escaffolded que existiam na árvore sem estarem conectados à aplicação. Eles foram **removidos em limpezas de sprints posteriores** — a árvore atual não tem código órfão conhecido:

- `core/query/` (`queryClient.ts`, `index.ts`) — duplicata de `core/providers/queryClient.ts`; removido.
- `features/auth/services/auth.service.ts` — duplicata vazia; o serviço real vive em `core/auth/services/auth.service.ts`; removido.
- `features/dashboard/components/LoginForm/` — cópia obsoleta fora do lugar; o `LoginForm` em uso está em `features/auth/components/LoginForm/`; removido.
- `components/ui/{Button,Input,Card}` (kit "Atlas\*") — implementados mas não consumidos em nenhuma tela; removidos. O kit compartilhado atual é `ConfirmDialog`, `ErrorState` e `MetricCard`.
- Arquivos vazios `components/ui/Button/styles.ts` e `layouts/MainLayout/styles.ts` — removidos.
- A árvore de docs scaffold vazia (`docs/architecture/`, `docs/backend/`, `docs/frontend/`, `docs/api/`, `docs/ui/`, `docs/engineering/`, `docs/roadmap/`) — removida (AE-064); os documentos na raiz de `docs/` são a referência ativa.

## Multi-tenancy (Empresa)

A entidade `Company` existe no domínio ([domain-model.md](domain-model.md)) com a intenção documentada de que uma empresa possua vários usuários, produtos, clientes e pedidos. **Isso ainda não está implementado**: `User`, `Product`, `Customer` etc. não possuem vínculo com `Company` no schema atual. O sistema hoje se comporta como single-tenant. Modelar e aplicar esse vínculo é um marco relevante do roadmap antes de qualquer uso multiempresa real.

## Decisões arquiteturais registradas

| Decisão | Racional |
|---|---|
| JWT stateless em vez de sessão | API desacoplada do frontend, sem afinidade de servidor, alinhado a um SPA + API REST |
| Token em `localStorage`, acesso só via `token.ts` | Simplicidade no estágio atual; tradeoff de segurança documentado e aceito em [SECURITY.md](SECURITY.md) |
| Sem refresh token | Escopo deliberadamente reduzido na Sprint 1B; expiração fixa de 24h por ora |
| Estrutura `core/` vs `features/` no frontend | Separar infraestrutura transversal (auth, api, router, theme) de módulos de produto, permitindo que cada feature evolua isoladamente |
| Flyway em vez de `ddl-auto: update` | Schema versionado e auditável (`ddl-auto: validate` no `application.yml`) |
| Exclusão de Produto/Categoria/Cliente é inativação (`active = false`), nunca remoção física | Essas entidades são referenciadas por FK não-nula sem `CASCADE` (`StockMovement`, `SaleItem`, `Product.category`) — hard delete quebraria a FK ou o histórico; inativar preserva os dois e é reversível |
| Rate limiting de login em memória, por IP, sem infraestrutura externa | Suficiente para uma instância única do backend (estágio atual do projeto); troca por um contador compartilhado (Redis) fica registrada como limitação em [SECURITY.md](SECURITY.md) se/quando houver múltiplas instâncias |
