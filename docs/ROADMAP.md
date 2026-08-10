# Roadmap — Atlas ERP

Este roadmap reflete o plano de evolução do Atlas ERP tal como discutido e executado até o momento, organizado em marcos (*milestones*). Itens concluídos descrevem o que **de fato** foi entregue e validado; itens futuros são direção pretendida, sujeitos a repriorização. Para o detalhamento item a item, veja [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md).

## Como este roadmap é conduzido

O projeto vem sendo trabalhado em **sprints curtas e escopadas**, cada uma com objetivo único, lista explícita do que pode e do que não pode ser alterado, e aprovação obrigatória antes da sprint seguinte. Esse processo está formalizado em [CONTRIBUTING.md](CONTRIBUTING.md). As seções abaixo seguem essa numeração de sprints por já refletirem o histórico real do projeto.

## Concluído

### Sprint 0 — Auditoria estrutural do frontend
Levantamento completo de arquivos vazios, imports quebrados, barrels incompletos e componentes órfãos no `atlas-frontend`. Produziu o inventário de débito técnico hoje documentado em [architecture.md](architecture.md#débito-técnico-e-código-órfão-conhecido). Nenhum código foi alterado nesta etapa — só diagnóstico.

### Sprint 0 (continuação) — Correção do erro de compilação
`LoginPage.tsx` estava vazio, quebrando o build. Corrigido: `LoginForm` funcional movido para `features/auth/components/LoginForm`, `LoginPage` implementada, `App.tsx` validado. Build e dev server confirmados funcionando.

### Sprint 1 — Análise do fluxo de autenticação do backend
Mapeamento completo do fluxo real de login no `atlas-backend`: endpoint, DTOs, geração e validação de JWT, papéis públicos vs. protegidos, e dois problemas identificados (erro de credenciais retornando `500` em vez de `401`; CORS não configurado). Sem alterações de código nesta etapa.

### Sprint 1A — Correções pontuais no backend
- `BadCredentialsException` passou a retornar `401 Unauthorized` (era `500`).
- CORS configurado para aceitar o frontend de desenvolvimento (`http://localhost:5173`).
- JWT, endpoints, DTOs e regras de negócio mantidos intactos — mudança cirúrgica, testada com a suíte existente e validada manualmente (login válido, inválido, CORS preflight, origem não autorizada).

### Sprint 1B — Integração do frontend com o backend
Autenticação completa no frontend: `AuthService`, `TokenStorage` (`token.ts` como único ponto de acesso ao `localStorage`), interceptors do Axios (injeção de `Authorization`, tratamento de `401`), `AuthContext`/`useAuth`, `ProtectedRoute`, login funcional com tratamento de erro, e botão de logout. Testado ponta a ponta em navegador real: acesso sem token, login com credenciais erradas e corretas, persistência de sessão, logout. Um bug real (redirecionamento indevido no próprio erro de login) foi encontrado e corrigido durante esse teste.

### Sprint 2.0 — Fundação de documentação
Este conjunto de documentos (`README.md`, `architecture.md`, `SECURITY.md`, `API_GUIDELINES.md`, `ROADMAP.md`, `PRODUCT_BACKLOG.md`, `CONTRIBUTING.md`), escrito para refletir o estado real do projeto e servir de base para colaboração futura.

### Sprint 3A — Dashboard com dados reais
Projeto e implementação do módulo Dashboard de ponta a ponta, aprovados em duas etapas (documento técnico revisado antes do código).

- **Backend**: `DashboardResponse` estendido de 6 para 10 campos (contadores de produtos/clientes/empresas/vendas ativos, estoque baixo, faturamento hoje/mês, e três listas — produtos com estoque baixo, vendas recentes, faturamento diário dos últimos 7 dias). Toda a regra de negócio permanece no `DashboardService`; o `DashboardController` só delega. Dois bugs reais corrigidos no caminho: `getTodayRevenue`/`getMonthRevenue` eram a mesma query (sem filtro de data, retornavam o faturamento histórico total nos dois campos) e `countLowStockProducts` não filtrava produtos inativos. Índice novo (`V15__add_sale_status_created_at_index.sql`, em `sale(status, created_at)`) para as consultas de faturamento e vendas recentes, hoje sem nenhum índice além da PK.
- **Frontend**: `DashboardPage` migrada de `useEffect` + Axios direto (chamando `/` como placeholder) para TanStack Query (`useDashboard`), consumindo `GET /dashboard` de fato. Os três stubs vazios (`LowStock`, `RecentSales`, `SalesChart`) foram implementados; `SalesChart` usa `recharts`. O barrel vazio de `components/ui/MetricCard` foi preenchido. Frontend não faz nenhum cálculo — só renderiza o payload já agregado pelo backend.
- Testado ponta a ponta: `mvn test`/`mvn package` (backend), `npm run build` (typecheck + bundle), `npm run dev` + navegador real (login, KPIs, gráfico, listas) com dados semeados manualmente (empresa, produto com estoque baixo, venda). Um bug real de timezone foi encontrado e corrigido nessa validação: `formatShortDate` interpretava a data pura (`yyyy-MM-dd`) como UTC-meia-noite, regredindo um dia ao formatar em `pt-BR` — o gráfico mostrava o último ponto um dia atrasado.
- Fecha os itens de backlog AE-020 a AE-024 (Dashboard) e AE-004 (barrel do `MetricCard`).

### Sprint 4A — Produtos: listagem
Primeiro módulo de negócio com UI própria. Escopo deliberadamente restrito a listagem — sem cadastro, edição, exclusão, filtros ou busca (fica para sprints seguintes).

- **Backend**: nenhuma alteração. `GET /products` (já existente, sem paginação/filtros) reutilizado como está — decisão consciente de não adicionar paginação pontualmente a um único endpoint, alinhada ao gap já registrado em [API_GUIDELINES.md](API_GUIDELINES.md#o-que-ainda-não-existe-não-assuma-que-existe).
- **Frontend**: nova feature `features/products/` (`types/services/hooks/components/pages`, mesmo padrão do `dashboard`). `useProducts` (TanStack Query) + `product.service.ts` + `ProductsTable` (componente de apresentação puro, recebe `products` via prop) + `ProductsPage` com estados de loading, empty e error. Um `MetricCard` ("Total de produtos") — sem nenhum cálculo no cliente, é só o tamanho do array já carregado.
- **Roteamento**: rota `/products` adicionada; `NavItem` passou a aceitar um `path` opcional e navegar via `react-router` — só o item "Produtos" do menu foi ligado a uma rota, os demais continuam inertes (infraestrutura mínima, não uma feature nova).
- Testado ponta a ponta: `mvn package` (sem mudanças, build íntegro), `npm run build`, `npm run dev` + navegador real — navegação pelo menu até `/products`, e os quatro estados (loading, listagem com 2 produtos, empty state e error state) validados visualmente. Empty state validado sem tocar no banco (stub temporário no `service`, revertido em seguida); error state validado derrubando o backend de propósito e restaurando depois.
- Deixa registrado no backlog (AE-030) que cadastro/edição/exclusão de Produtos permanecem pendentes — só a listagem foi entregue.

## Próximos marcos (planejado)

Estes marcos ainda não têm data ou sprint associada — a ordem abaixo é a sequência lógica recomendada, mas está sujeita a repriorização.

### Marco A — Higienização do débito técnico conhecido
Resolver (implementar ou remover, com decisão explícita para cada caso) os itens órfãos catalogados em [architecture.md](architecture.md#débito-técnico-e-código-órfão-conhecido): duplicatas de `queryClient` e `auth.service`, `LoginForm` fora de lugar, kit de componentes `Atlas*` não utilizado.

### Marco C — Módulos de negócio no frontend
Construir a interface para os módulos que já existem no backend mas não têm UI: Produtos, Clientes, Categorias, Estoque, Vendas. Cada módulo segue o padrão de feature já estabelecido (`features/<módulo>/{pages,components,services}`).

### Marco D — Autorização por papel (RBAC)
Aplicar `@PreAuthorize` nos endpoints do backend de acordo com os papéis `ADMIN`/`USER` (hoje emitidos no token mas não verificados), e refletir isso na UI (ocultar/desabilitar ações conforme permissão).

### Marco E — Multi-tenancy (Empresa)
Vincular `User`, `Product`, `Customer` e demais entidades a `Company`, e aplicar esse escopo em todas as consultas — pré-requisito para qualquer uso realista com mais de uma empresa cadastrada.

### Marco F — Hardening de sessão
Avaliar refresh token, expiração deslizante, e/ou revogação de token — hoje deliberadamente fora de escopo (ver [SECURITY.md](SECURITY.md)). Remover o logging de debug do `JwtAuthenticationFilter` antes de qualquer ambiente compartilhado.

### Marco G — Qualidade e automação
Cobertura de testes automatizados (hoje há apenas um teste de contexto no backend e nenhum no frontend), pipeline de CI (lint + testes + build em cada PR), e possivelmente testes E2E cobrindo o fluxo de autenticação já validado manualmente na Sprint 1B.

### Marco H — Financeiro e Relatórios
Módulos hoje presentes apenas como itens de menu no frontend (`Financeiro`, `Relatórios`) sem nenhuma implementação de backend ou frontend — ainda não modelados.

## Fora de escopo por ora

Itens conscientemente adiados, para não serem confundidos com esquecimento:

- Internacionalização (i18n) — hoje tudo em português fixo.
- Aplicativo mobile.
- Notificações (e-mail, push).
- Integrações externas (pagamento, NF-e, contabilidade).
