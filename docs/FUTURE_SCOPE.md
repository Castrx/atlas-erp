# Escopo Futuro — Atlas ERP

Este documento descreve, para cada frente de evolução do projeto, **o que já existe**, **o que falta**, e **o esforço aproximado** para completar. Serve tanto como plano de continuidade do TCC quanto como resposta a "o que vem depois?" em banca.

As frentes se dividem em categorias de maturidade diferentes:

- ✅ **Concluído** — RBAC, CI/CD, containerização, e os módulos principais (Autenticação, Dashboard, Produtos, Clientes, Vendas, Estoque).
- 🟡 **Backend pronto, falta interface** — Categorias, Empresa, Usuários.
- 🟡 **Existe parcialmente, falta aplicar** — Multiempresa.
- 🔴 **Não modelado ainda** — Financeiro, Auditoria.
- ⚙️ **Infraestrutura, não domínio** — Deploy.

---

## Clientes ✅

**Hoje**: CRUD completo no backend (`CustomerController`, `CustomerService`, `CustomerRepository`, DTOs de request/response) com validação de documento único, **e interface no frontend** (`features/customers/` — `CustomersPage`, `CustomerFormDialog`, `CustomersTable`, hooks `useCustomers`/`useCreateCustomer`/`useUpdateCustomer`/`useDeleteCustomer`). Exclusão é **inativação** (`active = false`). Rota `/customers` e item de menu implementados.

**Falta**: Nada estrutural — refinamentos opcionais (filtros/busca, paginação).

## Estoque ✅

**Hoje**: `StockController` com endpoints de entrada/saída de movimentação e histórico paginado (`GET /stock/history`, com `page`/`size` — o único endpoint do projeto com paginação real), **e interface no frontend** (`features/estoque/` — `StockMovementDialog` de entrada/saída com motivo obrigatório e `StockHistoryTable` paginada). O Dashboard consome dados de estoque baixo agregados.

**Falta**: Filtro do histórico por produto.

## Vendas ✅

**Hoje**: `SaleController` completo — criação (múltiplos itens, baixa automática de estoque, tudo em uma transação), listagem, cancelamento (ADMIN, que estorna o estoque). Regra de "estoque insuficiente" implementada e testada. **Interface no frontend** (`features/vendas/` — `SaleFormDialog` com itens dinâmicos e subtotal em tempo real, `SalesTable`, hooks `useSales`/`useCreateSale`/`useCancelSale`).

**Falta**: Paginação da listagem; filtro/listagem de vendas canceladas.

## Financeiro 🔴

**Hoje**: Não existe — nem entidade, nem migration, nem endpoint. Presente apenas como item de menu estático no frontend, sem destino.

**Falta**: Modelagem de domínio do zero — no mínimo, contas a pagar, contas a receber, e fluxo de caixa. Decisões em aberto: contas a receber deveriam nascer automaticamente de uma Venda (integração com o módulo já existente) ou ser lançadas manualmente? Como tratar parcelamento? Precisa de uma sprint de análise antes de qualquer código.

**Esforço estimado**: alto — módulo novo de domínio, com decisões de modelagem que afetam o módulo de Vendas existente.

## Auditoria 🔴

**Hoje**: Não existe. Nenhuma entidade registra quem alterou o quê e quando — apenas `created_at`/`created_by` em algumas tabelas (`sale`, `stock_movements`), sem histórico de alterações posteriores.

**Falta**: Decisão de abordagem — trilha de auditoria genérica (tabela `audit_log` com entidade/campo/valor antigo/valor novo/usuário/timestamp, populada via listener do Hibernate ou aspecto) versus auditoria específica por entidade crítica (ex.: só em `Sale` e `StockMovement`, onde já existe `created_by`). A segunda opção é significativamente mais barata e cobre os casos de maior risco primeiro.

**Esforço estimado**: médio (abordagem específica) a alto (abordagem genérica).

## Multiempresa 🟡

**Hoje**: A entidade `Company` existe, com CRUD completo no backend — mas **nenhuma outra entidade tem vínculo com ela**. O sistema se comporta como single-tenant hoje, mesmo com `Company` cadastrável.

**Falta**: (1) Adicionar `company_id` a `User`, `Product`, `Customer`, `Sale`, `StockMovement` via migration; (2) aplicar o escopo em **toda** consulta que hoje não filtra por empresa (todos os `Repository` e `Service` atuais) — isso é uma mudança transversal, não localizada, e arriscada de fazer parcialmente; (3) decidir como a empresa ativa é determinada por requisição (claim no JWT é a opção mais natural, dado que a autenticação já é por token).

**Esforço estimado**: alto — não pelo volume de código, mas pelo risco de esquecer um filtro de escopo em algum `Repository` e vazar dado entre empresas. Exige um checklist de revisão dedicado antes de ser considerado pronto.

## RBAC (autorização por papel) ✅

**Hoje**: Implementado e testado de ponta a ponta. Papéis `ADMIN` e `USER` vêm do seed (migration `V8`), o JWT carrega as roles, `@EnableMethodSecurity` + `@PreAuthorize` protegem **todos** os controllers, e a UI reflete o papel (oculta ações ADMIN para `USER` — ex.: excluir produto/cliente, cancelar venda; `Company` e `User` são 100% ADMIN). O `register` público cria sempre `USER` (nunca `ADMIN`).

**Falta**: Nada estrutural — revisar a matriz de permissão quando os módulos Categorias/Empresa/Usuários ganharem UI.

## Deploy ⚙️

**Hoje**: Imagens Docker da aplicação existem — backend multi-stage (Maven → JRE 21) e frontend (Vite → nginx), com a stack completa rodando via `docker compose up --build`. Secrets são lidos de variáveis de ambiente (`.env.example` com placeholders; nada real versionado). Ainda **não há ambiente hospedado** — roda localmente.

**Falta**: Escolha de hospedagem (VPS simples ou PaaS gerenciado); definir `JWT_SECRET` real (≥ 32 bytes) no ambiente de produção; revisar CORS para o domínio real (em dev é `localhost:5173`; em container, o proxy do nginx elimina o problema).

**Esforço estimado**: médio — nenhuma decisão arquitetural pendente, é execução direta, mas precisa ser feita com cuidado (secrets nunca no repositório em produção).

## CI/CD ⚙️

**Hoje**: Workflow GitHub Actions configurado (`.github/workflows/ci.yml`) com dois jobs — `backend` (JDK 21 Temurin, cache Maven, `./mvnw test` com Testcontainers) e `frontend` (Node 22, cache npm, `npm ci`, `npm run lint`, `npm run build`, `npx vitest run`). Ainda **não foi validado em um push/PR real** (o repositório nunca foi enviado ao remoto).

**Falta**: Push/PR inicial para validar o pipeline em execução; etapa de deploy automático — passo seguinte, depois de definida a estratégia de Deploy (item anterior).

**Esforço estimado**: baixo — o workflow já está escrito; validá-lo é essencialmente o primeiro push/PR.

---

## Ordem recomendada

1. **Validar o CI** (⚙️) — primeiro push/PR para o workflow rodar de verdade.
2. **Categorias, Empresa, Usuários** (🟡) — interfaces dos backends já prontos, replicando o padrão existente.
3. **Multiempresa** (🟡) — mudança transversal, mais segura com o CI validado protegendo contra regressão.
4. **Deploy** (⚙️) — só depois de validar o CI, para não publicar sem controle.
5. **Financeiro, Auditoria** (🔴) — maior esforço de modelagem, correto deixar para depois de consolidar o que já existe.

Coerente com a mesma lógica já registrada em [ROADMAP.md](ROADMAP.md) e [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md).
