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
- O banco é PostgreSQL, versionado por migrations Flyway (`atlas-backend/src/main/resources/db/migration`, atualmente 14 migrations, `V1` a `V14`).
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

Fluxo completo documentado em [SECURITY.md](SECURITY.md). Resumo: login stateless via JWT (HS256), filtro `JwtAuthenticationFilter` popula o `SecurityContextHolder` a partir do header `Authorization: Bearer <token>`, `SecurityConfig` define `/auth/**` e Swagger como públicos e tudo mais como autenticado.

### Tratamento de erros

`GlobalExceptionHandler` (`@RestControllerAdvice`) centraliza a conversão de exceções em respostas HTTP consistentes (`ApiError`: `timestamp`, `status`, `error`, `message`, `path`). Mapeamento atual:

| Exceção | Status HTTP |
|---|---|
| `BadCredentialsException` | 401 |
| `ResourceNotFoundException` | 404 |
| `BusinessException` | 409 |
| `MethodArgumentNotValidException` (Bean Validation) | 400 |
| Qualquer outra `Exception` | 500 |

Não há autorização por papel (`@PreAuthorize`) aplicada em nenhum endpoint hoje, apesar de `@EnableMethodSecurity` estar habilitado e dos papéis `ADMIN`/`USER` existirem na base — **gap conhecido**, ver [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md).

### Testes automatizados (`src/test/`)

Desde a Sprint 6A, organizados em três pacotes:

```
unit/          → Mockito puro, sem Spring nem banco (services, JwtService)
integration/   → MockMvc + Testcontainers, ponta a ponta real (*IT.java)
support/       → infraestrutura reutilizável (AbstractIntegrationTest, TestDataFactory)
```

Os testes de integração sobem um PostgreSQL efêmero via Testcontainers (mesma imagem do `docker-compose.yml`), completamente isolado do banco de desenvolvimento — nenhum teste depende de dado semeado manualmente, e `mvn test` não exige mais `docker compose up -d postgres` rodando antes (só o Docker em execução). Cada teste roda numa transação revertida ao final. O Surefire precisou ser configurado explicitamente para incluir `**/*IT.java` (por padrão só roda `**/*Test.java`), para `mvn test` cobrir as duas suítes num único comando. Cobertura atual: `JwtService`, `AuthenticationService`, `ProductService`, `CustomerService`, `DashboardService` (unitário) e `AuthController`, `ProductController`, `CustomerController` (integração) — ver [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md) (`AE-060`) para o que ainda falta.

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

Ainda não há rotas para Categorias, Estoque, Vendas etc. — são os próximos módulos do roadmap. `NavItem` (`components/navigation`) aceita um `path` opcional e navega via `react-router` quando presente; hoje os itens "Produtos" e "Clientes" do menu têm `path` associado (`menu.ts`) — os demais itens permanecem apenas visuais, sem destino.

### Autenticação no frontend

- `core/auth/token.ts` é o **único** ponto de acesso ao `localStorage` para o token — nenhum componente acessa `localStorage` diretamente.
- `core/auth/AuthContext.tsx` + `useAuth.ts` expõem `{ isAuthenticated, login, logout }` via Context API.
- `core/api/axios.ts` tem interceptors: request injeta `Authorization: Bearer`; response trata `401` (exceto na própria chamada de login) limpando o token e redirecionando para `/login`.
- `core/auth/ProtectedRoute.tsx` faz o guard client-side, baseado apenas na presença do token (sem decodificar `exp` — ver limitações em [SECURITY.md](SECURITY.md)).

### Data fetching

TanStack Query está configurado (`core/providers/queryClient.ts`) e, desde a Sprint 3A, é o padrão em uso em todas as features (`dashboard`, `products`, `customers`): cada hook (`useDashboard`, `useProducts`, `useCustomers`, etc.) consome o endpoint via `useQuery`, sem cálculo algum no cliente — só busca e cacheia o payload já processado pelo backend. É o padrão recomendado para os próximos módulos (Categorias, Estoque, Vendas).

### Testes automatizados

Desde a Sprint 6A: Vitest + React Testing Library, configurados em `vite.config.ts` (seção `test`) sobre a infraestrutura já existente — nenhuma ferramenta além do necessário (`npm run test`). Infraestrutura reutilizável em `src/test/`:

```
src/test/setup.ts        → jest-dom, cleanup automático entre testes, stubs de
                            scrollIntoView/matchMedia/ResizeObserver (o MUI exige
                            essas APIs de navegador, ausentes no jsdom)
src/test/test-utils.tsx  → render() customizado (QueryClientProvider + MemoryRouter)
                            e createQueryWrapper() para testes de hook
```

Convenção: teste ao lado do arquivo testado (`Componente.test.tsx` no mesmo diretório), não numa árvore `__tests__/` paralela — casa com a estrutura `features/<módulo>/` já estabelecida. Os `*.service.ts` são mockados no lugar dos hooks nos testes de componente/hook, para continuar exercitando TanStack Query e React Hook Form + Zod reais, só sem bater na API. Cobertura atual: `ProtectedRoute`, `ProductFormDialog`, `CustomerFormDialog`, `useProducts`, `useCustomers` — ver [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md) (`AE-061`) para o que ainda falta.

## Débito técnico e código órfão conhecido

Um levantamento estrutural (Sprint 0) identificou arquivos escaffolded que existem na árvore mas não estão conectados à aplicação. Eles foram **intencionalmente mantidos** (nenhuma remoção foi feita fora de escopo) e devem ser tratados como itens de backlog, não como bugs ocultos:

- `core/query/` (`queryClient.ts`, `index.ts`) — duplicata vazia de `core/providers/queryClient.ts`.
- `features/auth/services/auth.service.ts` — duplicata vazia; o serviço real vive em `core/auth/services/auth.service.ts`.
- `features/dashboard/components/LoginForm/` — cópia obsoleta fora do lugar; o `LoginForm` em uso está em `features/auth/components/LoginForm/`.
- `components/ui/{Button,Input,Card}` (kit "Atlas\*") — implementados mas não consumidos em nenhuma tela ainda.
- `components/ui/Button/styles.ts`, `layouts/MainLayout/styles.ts` — arquivos vazios, sem uso.
- Documentação: a árvore `docs/architecture/`, `docs/backend/`, `docs/frontend/`, `docs/api/`, `docs/ui/`, `docs/engineering/`, `docs/roadmap/` existe como scaffold, majoritariamente vazia — este documento (`docs/architecture.md`) e seus pares na raiz de `docs/` são a referência ativa.

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
