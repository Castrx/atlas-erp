# Product Backlog — Atlas ERP

Itens de trabalho priorizados, derivados do [Roadmap](docs/ROADMAP.md). Cada item tem um identificador estável (`AE-NNN`) para ser referenciado em commits, PRs e issues. Status e prioridade são reavaliados a cada sprint — este documento deve ser atualizado junto com o código, não depois.

**Prioridade**: 🔴 Alta · 🟡 Média · 🟢 Baixa
**Status**: `todo` · `em andamento` · `concluído`

## Débito técnico (frontend)

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-001 | Remover ou consolidar `core/query/` (duplicata vazia de `core/providers/queryClient.ts`) — removido no fechamento do MVP | frontend | 🟡 | concluído |
| AE-002 | Remover ou consolidar `features/auth/services/auth.service.ts` (duplicata vazia; serviço real em `core/auth/services`) — removido no fechamento do MVP | frontend | 🟡 | concluído |
| AE-003 | Remover `features/dashboard/components/LoginForm/` (cópia obsoleta; o real está em `features/auth/components/LoginForm`) — removido no fechamento do MVP | frontend | 🟡 | concluído |
| AE-005 | Decidir destino do kit `Atlas*` (`Button`, `Input`, `Card`) — decisão no fechamento do MVP: remover (nenhum uso no app) | frontend | 🟢 | concluído |
| AE-006 | Remover arquivos de estilo vazios e sem uso (`Button/styles.ts`, `MainLayout/styles.ts`) — removidos no fechamento do MVP | frontend | 🟢 | concluído |

## Débito técnico (backend)

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-010 | Resolvido na Sprint P1: o `JwtAuthenticationFilter` não imprime mais tokens — registra apenas a categoria do erro em `DEBUG` (nunca token, header ou claims) | backend | 🔴 | concluído |
| AE-011 | Resolvido na Sprint P1: classe `SecurityConstants` removida | backend | 🟢 | concluído |
| AE-012 | Resolvido na Sprint P1: secret JWT e credenciais de banco passaram a ser lidos de variáveis de ambiente (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`), com defaults DEV-ONLY fictícios em `application.yml` | backend/infra | 🔴 | concluído |
| AE-013 | Resolvido na Sprint P8: N+1 em `SaleService.findAll()` (uma consulta de itens por venda) — corrigido com busca em lote (`SaleItemRepository.findBySaleIdInWithProduct`, agrupada por `saleId`) | backend | 🟡 | concluído |

## Módulos de negócio — UI (backend já existe, frontend não)

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-030 | Fluxo de CRUD de Produtos — edição e exclusão (listagem e cadastro já implementados, ver Sprints 4A/4B no [Roadmap](ROADMAP.md)) — concluído na Sprint 8A | frontend | 🔴 | concluído |
| AE-031 | Tela e fluxo de CRUD de Clientes — edição e exclusão (listagem e cadastro já implementados, ver Sprint 5A no [Roadmap](ROADMAP.md)) — concluído na Sprint 8A. Exclusão de cliente no backend é inativação (`active = false`); filtro de inativos resolvido na Sprint P8 — `GET /customers` agora retorna só ativos (`CustomerRepository.findByActiveTrue()`), não depende mais só do frontend | frontend | 🔴 | concluído |
| AE-032 | Tela e fluxo de CRUD de Categorias — concluído na sprint Categorias + Empresas + Usuários | frontend | 🟡 | concluído |
| AE-033 | Tela de movimentação de Estoque — concluído na sprint Vendas + Estoque (frontend) | frontend | 🟡 | concluído |
| AE-034 | Fluxo de registro de Vendas — concluído na sprint Vendas + Estoque (frontend) | frontend | 🔴 | concluído |
| AE-035 | Tela de gestão de Empresa (Company) — concluído na sprint Categorias + Empresas + Usuários (rota/menu `ADMIN`-only) | frontend | 🟢 | concluído |
| AE-036 | Tela de gestão de Usuários — concluído na sprint Categorias + Empresas + Usuários (rota/menu `ADMIN`-only) | frontend | 🟢 | concluído |

## Integridade de dados (exclusão = inativação)

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-037 | Resolvido na Sprint P6: exclusão de Produto passou de remoção física para inativação (`active = false`) — evita quebrar a FK não-nula de `StockMovement`/`SaleItem` quando o produto já tem histórico | backend | 🟡 | concluído |
| AE-038 | Resolvido na Sprint P6: exclusão de Categoria passou de remoção física para inativação (`active = false`) — evita quebrar a FK não-nula de `Product.category` | backend | 🟡 | concluído |
| AE-039 | Resolvido na Sprint P5: venda (`POST /sales`) passou a rejeitar cliente ou produto inativo — histórico e cancelamento de vendas existentes continuam funcionando normalmente | backend | 🟡 | concluído |

## Identidade visual e experiência

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-090 | Resolvido na Sprint P9: rebrand visual completo (`CompassMark`, favicon, tema/tokens, tipografia) aplicado em Login, Dashboard e nas tabelas de Produtos/Clientes/Vendas/Estoque | frontend | 🟢 | concluído |
| AE-091 | Resolvido na Sprint P7: responsividade e acessibilidade — Sidebar vira `Drawer` mobile abaixo do breakpoint `md`, ajustes de alvo de toque e layout em diálogos/páginas de negócio | frontend | 🟡 | concluído |

## Dados de demonstração

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-065 | Dados de demonstração (Sprint P4): `DemoDataRunner` gated por `DEMO_DATA=true`, idempotente e não-destrutivo, criando empresa, categorias, produtos, clientes, vendas e movimentos de estoque | backend | 🟢 | concluído |

## Segurança e autorização

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-040 | Aplicar `@PreAuthorize` por papel (`ADMIN`/`USER`) nos endpoints que hoje não diferenciam acesso — ver Sprint 7A no [Roadmap](ROADMAP.md) | backend | 🔴 | concluído |
| AE-041 | Refletir permissões por papel na UI (ocultar/desabilitar ações) — ver Sprint 7B no [Roadmap](ROADMAP.md) | frontend | 🟡 | concluído |
| AE-042 | Avaliar estratégia de refresh token / revogação de sessão | backend | 🟡 | todo |
| AE-043 | Rate limiting em `/auth/login` — concluído na Sprint P8: `LoginRateLimiter`/`LoginRateLimitFilter`, contador em memória por IP (5 tentativas/60s por padrão, configurável), `429` ao exceder | backend | 🟡 | concluído |
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
| AE-060 | Testes automatizados de backend por módulo — cobertura inicial de Auth/Products/Customers/Dashboard entregue na Sprint 6A; Sale/Stock/Company/User ganharam testes de integração de permissão na Sprint 7A (RBAC); Category, LoginRateLimiter e as regras de inativação/N+1 ganharam teste unitário próprio nas Sprints P6/P8. Ainda sem teste unitário de regra de negócio própria para `Company` | backend | 🟡 | em andamento |
| AE-061 | Testes automatizados de frontend — cobertura inicial (ProtectedRoute, ProductFormDialog, CustomerFormDialog, useProducts, useCustomers) entregue na Sprint 6A; Vendas e Estoque ganharam testes na sprint de fechamento; Categorias ganhou teste de página na sprint de UI dos três módulos novos. Empresas e Usuários (telas `ADMIN`-only) ainda **sem** teste de frontend dedicado; ainda faltam testes de alguns hooks de mutação | frontend | 🟡 | em andamento |
| AE-062 | Testes E2E cobrindo login/logout/rota protegida (validados manualmente na Sprint 1B) | frontend | 🟢 | todo |
| AE-063 | Pipeline de CI (lint + build + testes em cada PR) — workflow criado na Sprint P2 (`.github/workflows/ci.yml`); validação em PR real fica pendente de push | infra | 🔴 | em andamento |
| AE-064 | Resolvido na Sprint P2: árvore de documentação granular (`docs/{architecture,backend,frontend,api,ui,engineering,roadmap}/`) removida — eram 25 arquivos vazios (0 bytes), redundantes com os documentos na raiz de `docs/` | docs | 🟢 | concluído |
| AE-067 | Resolvido na Sprint P9: CORS liberado para `http://localhost:3000` (frontend Docker/nginx), mantendo `5173`/`127.0.0.1:5173` (Vite dev) — sem wildcard | backend | 🟡 | concluído |

## Módulos ainda não modelados

| ID | Item | Área | Prioridade | Status |
|---|---|---|---|---|
| AE-070 | Modelar módulo Financeiro (hoje só existe como item de menu) | backend/frontend | 🟢 | todo |
| AE-071 | Modelar módulo de Relatórios (hoje só existe como item de menu) | backend/frontend | 🟢 | todo |

---

Concluídos (Sprints 0 – 2.0) são registrados em [ROADMAP.md](ROADMAP.md) em vez de repetidos aqui — este backlog lista apenas trabalho pendente.
