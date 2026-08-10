# Escopo Futuro — Atlas ERP

Este documento descreve, para cada frente de evolução do projeto, **o que já existe**, **o que falta**, e **o esforço aproximado** para completar. Serve tanto como plano de continuidade do TCC quanto como resposta a "o que vem depois?" em banca.

As frentes se dividem em três categorias de maturidade diferentes:

- 🟢 **Backend pronto, falta interface** — Clientes, Estoque, Vendas.
- 🟡 **Existe parcialmente, falta aplicar** — Multiempresa, RBAC.
- 🔴 **Não modelado ainda** — Financeiro, Auditoria.
- ⚙️ **Infraestrutura, não domínio** — Deploy, CI/CD.

---

## Clientes 🟢

**Hoje**: CRUD completo no backend (`CustomerController`, `CustomerService`, `CustomerRepository`, DTOs de request/response), incluindo validação de documento único. Sem nenhuma tela no frontend.

**Falta**: Réplica exata do padrão já construído em Produtos — `features/customers/` com `types`, `services`, `hooks` (`useCustomers`, `useCreateCustomer`), `components/CustomerFormDialog`, `components/CustomersTable`, `pages/CustomersPage`. Rota `/customers` e item de menu correspondente.

**Esforço estimado**: baixo — o template já existe e foi validado; é majoritariamente repetição do padrão com os campos do domínio de Cliente (nome, documento, e-mail, telefone).

## Estoque 🟢

**Hoje**: `StockController` com endpoints de entrada/saída de movimentação e histórico paginado (`GET /stock/history`, já com `page`/`size` — é o único endpoint do projeto com paginação real hoje). O Dashboard já consome dados de estoque baixo agregados.

**Falta**: Tela de histórico de movimentações (tabela paginada — primeiro caso de uso real de paginação no frontend) e um formulário de registro de entrada/saída manual, vinculado a um produto existente.

**Esforço estimado**: baixo-médio — a paginação real (diferente de Produtos, que hoje lista tudo) exige o primeiro componente de paginação do frontend, que se torna reutilizável para os módulos seguintes.

## Vendas 🟢

**Hoje**: `SaleController` completo — criação (com múltiplos itens, baixa automática de estoque, tudo em uma transação), listagem, cancelamento (que estorna o estoque). Regra de negócio de "estoque insuficiente" já implementada e testada.

**Falta**: Fluxo de frontend mais elaborado que os anteriores — formulário de venda precisa permitir adicionar múltiplos itens dinamicamente (produto + quantidade), calcular subtotal em tempo real (exibição apenas — o total real vem do backend na resposta), e uma tela de listagem/detalhe de vendas com opção de cancelamento.

**Esforço estimado**: médio — é o módulo de UI mais complexo dos três "prontos no backend", por ter uma relação um-para-muitos (venda → itens) dentro do próprio formulário.

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

## RBAC (autorização por papel) 🟡

**Hoje**: Os papéis `ADMIN` e `USER` existem no domínio (seed via migration `V8`) e o JWT já carrega as roles do usuário no claim `roles`. `@EnableMethodSecurity` está habilitado no `SecurityConfig`. **Mas nenhum endpoint usa `@PreAuthorize`** — qualquer usuário autenticado acessa qualquer rota protegida, independente do papel.

**Falta**: (1) Decidir a matriz de permissão por papel e por endpoint (ex.: só `ADMIN` pode excluir produto ou cadastrar empresa?); (2) anotar os endpoints com `@PreAuthorize("hasRole('ADMIN')")` (ou equivalente); (3) refletir isso na UI — ocultar/desabilitar ações que o usuário logado não tem permissão de executar, para não mostrar um botão que vai falhar com `403`.

**Esforço estimado**: baixo-médio no backend (a infraestrutura já existe, é essencialmente anotar); médio no frontend (decodificar o papel do JWT e condicionar a renderização).

## Deploy ⚙️

**Hoje**: Roda exclusivamente local — `mvnw spring-boot:run` + `npm run dev` + Postgres via Docker Compose. Não existe imagem Docker da aplicação (só da infraestrutura), nem ambiente hospedado.

**Falta**: `Dockerfile` para o backend (build multi-stage Maven → JRE) e para o frontend (build Vite → Nginx servindo estático); variáveis de ambiente para secrets (JWT secret e credenciais de banco hoje estão versionadas em `application.yml`, aceitável só em dev); escolha de hospedagem (VPS simples, ou um PaaS gerenciado); configuração de CORS para o domínio real de produção, substituindo `localhost:5173`.

**Esforço estimado**: médio — nenhuma decisão arquitetural pendente, é execução direta, mas precisa ser feita com cuidado (secrets nunca no repositório em produção).

## CI/CD ⚙️

**Hoje**: Nenhum pipeline configurado. Todo build/teste/validação é manual, rodado localmente antes de cada entrega de sprint.

**Falta**: Pipeline mínimo (ex.: GitHub Actions) rodando em cada push/PR: `mvn test` no backend, `npm run build` + `npm run lint` no frontend — o mesmo checklist já seguido manualmente em cada sprint, automatizado. Etapa de deploy automático é um passo seguinte, só depois de ter uma estratégia de Deploy definida (item anterior).

**Esforço estimado**: baixo — o checklist de validação já existe e é seguido manualmente; automatizar é majoritariamente configuração, sem decisão de arquitetura nova.

---

## Ordem recomendada

1. **Clientes, Estoque, Vendas** (🟢) — maior valor de demonstração pelo menor esforço, backend já pronto.
2. **RBAC** (🟡) — infraestrutura já existe, fecha uma lacuna de segurança conhecida e documentada.
3. **CI/CD** (⚙️) — barato de configurar, e passa a proteger todo o trabalho seguinte automaticamente.
4. **Multiempresa** (🟡) — mudança transversal, mais segura de fazer com CI/CD já protegendo contra regressão.
5. **Deploy** (⚙️) — só depois de RBAC e CI/CD, para não publicar uma versão sem controle de acesso.
6. **Financeiro, Auditoria** (🔴) — maior esforço de modelagem, correto deixar para depois de consolidar o que já existe.

Coerente com a mesma lógica já registrada em [ROADMAP.md](ROADMAP.md) e [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md).
