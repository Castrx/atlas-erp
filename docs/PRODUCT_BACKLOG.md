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
| AE-010 | Remover logging de debug (`System.out.println`) do `JwtAuthenticationFilter` — hoje imprime tokens recebidos | backend | 🔴 | todo |
| AE-011 | Remover classe `SecurityConstants` (secret/expiration hardcoded, não utilizada — valores reais vêm de `application.yml`) | backend | 🟢 | todo |
| AE-012 | Mover secret JWT e credenciais de banco para variáveis de ambiente antes de qualquer deploy fora de dev local | backend/infra | 🔴 | todo |

## Módulos de negócio — UI (backend já existe, frontend não)

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-030 | Fluxo de CRUD de Produtos — edição e exclusão (listagem e cadastro já implementados, ver Sprints 4A/4B no [Roadmap](ROADMAP.md)) | frontend | 🔴 | em andamento |
| AE-031 | Tela e fluxo de CRUD de Clientes — edição e exclusão (listagem e cadastro já implementados, ver Sprint 5A no [Roadmap](ROADMAP.md)) | frontend | 🔴 | em andamento |
| AE-032 | Tela e fluxo de CRUD de Categorias | frontend | 🟡 | todo |
| AE-033 | Tela de movimentação de Estoque | frontend | 🟡 | todo |
| AE-034 | Fluxo de registro de Vendas | frontend | 🔴 | todo |
| AE-035 | Tela de gestão de Empresa (Company) | frontend | 🟢 | todo |
| AE-036 | Tela de gestão de Usuários | frontend | 🟢 | todo |

## Segurança e autorização

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-040 | Aplicar `@PreAuthorize` por papel (`ADMIN`/`USER`) nos endpoints que hoje não diferenciam acesso | backend | 🔴 | todo |
| AE-041 | Refletir permissões por papel na UI (ocultar/desabilitar ações) | frontend | 🟡 | todo |
| AE-042 | Avaliar estratégia de refresh token / revogação de sessão | backend | 🟡 | todo |
| AE-043 | Rate limiting em `/auth/login` | backend | 🟡 | todo |
| AE-044 | Decodificar `exp` do JWT no frontend para detectar expiração antes da próxima chamada de API | frontend | 🟢 | todo |

## Multi-tenancy

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-050 | Adicionar vínculo `Company` em `User` | backend | 🟡 | todo |
| AE-051 | Adicionar vínculo `Company` em `Product`, `Customer`, `Sale`, `StockMovement` | backend | 🟡 | todo |
| AE-052 | Aplicar escopo de empresa em todas as queries (repository/service) | backend | 🟡 | todo |

## Qualidade e infraestrutura

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-060 | Testes automatizados de backend por módulo — cobertura inicial de Auth/Products/Customers/Dashboard entregue na Sprint 6A; faltam Sale, Stock, Company, User (sem UI ainda) | backend | 🟡 | em andamento |
| AE-061 | Testes automatizados de frontend — cobertura inicial (ProtectedRoute, ProductFormDialog, CustomerFormDialog, useProducts, useCustomers) entregue na Sprint 6A; faltam os demais componentes/hooks | frontend | 🟡 | em andamento |
| AE-062 | Testes E2E cobrindo login/logout/rota protegida (validados manualmente na Sprint 1B) | frontend | 🟢 | todo |
| AE-063 | Pipeline de CI (lint + build + testes em cada PR) | infra | 🔴 | todo |
| AE-064 | Preencher a árvore de documentação granular em `docs/` (`architecture/`, `backend/`, `frontend/`, `api/`, `ui/`, `engineering/`, `roadmap/`), hoje majoritariamente vazia, ou removê-la se redundante com os documentos na raiz de `docs/` | docs | 🟢 | todo |

## Módulos ainda não modelados

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-070 | Modelar módulo Financeiro (hoje só existe como item de menu) | backend/frontend | 🟢 | todo |
| AE-071 | Modelar módulo de Relatórios (hoje só existe como item de menu) | backend/frontend | 🟢 | todo |

---

Concluídos (Sprints 0 – 2.0) são registrados em [ROADMAP.md](ROADMAP.md) em vez de repetidos aqui — este backlog lista apenas trabalho pendente.
