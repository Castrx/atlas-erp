# Product Backlog — Atlas ERP

Itens de trabalho priorizados, derivados do [Roadmap](docs/ROADMAP.md). Cada item tem um identificador estável (`AE-NNN`) para ser referenciado em commits, PRs e issues. Status e prioridade são reavaliados a cada sprint — este documento deve ser atualizado junto com o código, não depois.

**Prioridade**: 🔴 Alta · 🟡 Média · 🟢 Baixa
**Status**: `todo` · `em andamento` · `concluído`

## Débito técnico (frontend)

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-001 | Remover ou consolidar `core/query/` (duplicata vazia de `core/providers/queryClient.ts`) | frontend | 🟡 | todo |
| AE-002 | Remover ou consolidar `features/auth/services/auth.service.ts` (duplicata vazia; serviço real em `core/auth/services`) | frontend | 🟡 | todo |
| AE-003 | Remover `features/dashboard/components/LoginForm/` (cópia obsoleta; o real está em `features/auth/components/LoginForm`) | frontend | 🟡 | todo |
| AE-005 | Decidir destino do kit `Atlas*` (`Button`, `Input`, `Card`) — adotar nas telas ou remover | frontend | 🟢 | todo |
| AE-006 | Remover arquivos de estilo vazios e sem uso (`Button/styles.ts`, `MainLayout/styles.ts`) | frontend | 🟢 | todo |

## Débito técnico (backend)

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-010 | Resolvido na Sprint P1: o `JwtAuthenticationFilter` não imprime mais tokens — registra apenas a categoria do erro em `DEBUG` (nunca token, header ou claims) | backend | 🔴 | concluído |
| AE-011 | Resolvido na Sprint P1: classe `SecurityConstants` removida | backend | 🟢 | concluído |
| AE-012 | Resolvido na Sprint P1: secret JWT e credenciais de banco passaram a ser lidos de variáveis de ambiente (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`), com defaults DEV-ONLY fictícios em `application.yml` | backend/infra | 🔴 | concluído |

## Módulos de negócio — UI (backend já existe, frontend não)

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-030 | Fluxo de CRUD de Produtos — edição e exclusão (listagem e cadastro já implementados, ver Sprints 4A/4B no [Roadmap](ROADMAP.md)) — concluído na Sprint 8A | frontend | 🔴 | concluído |
| AE-031 | Tela e fluxo de CRUD de Clientes — edição e exclusão (listagem e cadastro já implementados, ver Sprint 5A no [Roadmap](ROADMAP.md)) — concluído na Sprint 8A. Decisão: exclusão de cliente no backend é inativação (`active = false`) e `GET /customers` retorna todos; o filtro de inativos ficou no frontend (listagem e métrico consideram apenas `active`) — filtrar no backend fica como débito | frontend | 🔴 | concluído |
| AE-032 | Tela e fluxo de CRUD de Categorias | frontend | 🟡 | todo |
| AE-033 | Tela de movimentação de Estoque | frontend | 🟡 | todo |
| AE-034 | Fluxo de registro de Vendas | frontend | 🔴 | todo |
| AE-035 | Tela de gestão de Empresa (Company) | frontend | 🟢 | todo |
| AE-036 | Tela de gestão de Usuários | frontend | 🟢 | todo |

## Segurança e autorização

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-040 | Aplicar `@PreAuthorize` por papel (`ADMIN`/`USER`) nos endpoints que hoje não diferenciam acesso — ver Sprint 7A no [Roadmap](ROADMAP.md) | backend | 🔴 | concluído |
| AE-041 | Refletir permissões por papel na UI (ocultar/desabilitar ações) — ver Sprint 7B no [Roadmap](ROADMAP.md) | frontend | 🟡 | concluído |
| AE-042 | Avaliar estratégia de refresh token / revogação de sessão | backend | 🟡 | todo |
| AE-043 | Rate limiting em `/auth/login` | backend | 🟡 | todo |
| AE-044 | Decodificar `exp` do JWT no frontend para detectar expiração antes da próxima chamada de API | frontend | 🟢 | todo |
| AE-045 | Resolvido na Sprint P1: `AdminBootstrapRunner` cria o primeiro ADMIN de uma instalação nova via `ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD`/`ADMIN_BOOTSTRAP_NAME` (idempotente — se o e-mail já existir, nada é feito) | backend | 🔴 | concluído |

## Multi-tenancy

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-050 | Adicionar vínculo `Company` em `User` | backend | 🟡 | todo |
| AE-051 | Adicionar vínculo `Company` em `Product`, `Customer`, `Sale`, `StockMovement` | backend | 🟡 | todo |
| AE-052 | Aplicar escopo de empresa em todas as queries (repository/service) | backend | 🟡 | todo |

## Qualidade e infraestrutura

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-060 | Testes automatizados de backend por módulo — cobertura inicial de Auth/Products/Customers/Dashboard entregue na Sprint 6A; Sale/Stock/Company/User ganharam testes de integração de permissão na Sprint 7A (RBAC), mas ainda sem teste unitário de regra de negócio própria | backend | 🟡 | em andamento |
| AE-061 | Testes automatizados de frontend — cobertura inicial (ProtectedRoute, ProductFormDialog, CustomerFormDialog, useProducts, useCustomers) entregue na Sprint 6A; faltam os demais componentes/hooks | frontend | 🟡 | em andamento |
| AE-062 | Testes E2E cobrindo login/logout/rota protegida (validados manualmente na Sprint 1B) | frontend | 🟢 | todo |
| AE-063 | Pipeline de CI (lint + build + testes em cada PR) — workflow criado na Sprint P2 (`.github/workflows/ci.yml`); validação em PR real fica pendente de push | infra | 🔴 | em andamento |
| AE-064 | Resolvido na Sprint P2: árvore de documentação granular (`docs/{architecture,backend,frontend,api,ui,engineering,roadmap}/`) removida — eram 25 arquivos vazios (0 bytes), redundantes com os documentos na raiz de `docs/` | docs | 🟢 | concluído |

## Módulos ainda não modelados

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-070 | Modelar módulo Financeiro (hoje só existe como item de menu) | backend/frontend | 🟢 | todo |
| AE-071 | Modelar módulo de Relatórios (hoje só existe como item de menu) | backend/frontend | 🟢 | todo |

---

Concluídos (Sprints 0 – 2.0) são registrados em [ROADMAP.md](ROADMAP.md) em vez de repetidos aqui — este backlog lista apenas trabalho pendente.
