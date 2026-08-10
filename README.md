# Atlas ERP

> Sistema ERP modular, construído como monorepo com backend em **Spring Boot** e frontend em **React**.

Atlas ERP é um ERP orientado a pequenas e médias empresas, cobrindo cadastro de produtos, clientes, categorias, controle de estoque, vendas e (futuramente) financeiro e relatórios. O projeto está em estágio inicial de desenvolvimento: a fundação de autenticação está pronta e testada de ponta a ponta; os módulos de negócio (produtos, clientes, estoque, vendas) têm backend funcional mas ainda não têm interface no frontend.

## Status do projeto

🚧 **Pré-alfa / em desenvolvimento ativo.** Não é production-ready.

| Área | Status |
|---|---|
| Autenticação (login/logout, JWT, rotas protegidas) | ✅ Funcional, testada ponta a ponta |
| CORS / segurança básica de API | ✅ Configurado para desenvolvimento |
| CRUD de Produtos, Clientes, Categorias, Estoque, Vendas | ⚙️ Backend implementado — sem UI no frontend ainda |
| Dashboard | 🚧 Placeholder — sem dados reais |
| Multi-tenancy (Empresa) | 📋 Modelado no domínio, não aplicado ainda |
| Testes automatizados | 📋 Cobertura mínima (1 teste de contexto no backend) |
| CI/CD | 📋 Não configurado |

Veja o [Roadmap](docs/ROADMAP.md) e o [Backlog](docs/PRODUCT_BACKLOG.md) para o plano detalhado.

## Stack

**Backend** (`atlas-backend/`)
- Java 21 · Spring Boot 3.5.4 · Spring Security · Spring Data JPA
- PostgreSQL 17 · Flyway (migrations versionadas)
- JWT (JJWT 0.12.7, HS256, stateless)
- springdoc-openapi (Swagger UI em `/swagger-ui.html`)
- Maven (via wrapper, `mvnw`)

**Frontend** (`atlas-frontend/`)
- React 19 · TypeScript · Vite 8
- MUI (Material UI) 7 · Emotion
- React Router 7 · TanStack Query 5
- React Hook Form + Zod
- Axios

**Infraestrutura**
- Docker Compose (`docker/docker-compose.yml`) — PostgreSQL + pgAdmin para desenvolvimento local

## Estrutura do monorepo

```
atlas-erp/
├── atlas-backend/      # API REST (Spring Boot)
├── atlas-frontend/     # SPA (React + Vite)
├── docker/             # docker-compose para infraestrutura local (Postgres, pgAdmin)
├── docs/               # Documentação do projeto (arquitetura, roadmap, segurança, API...)
└── scripts/            # Scripts utilitários (reservado)
```

## Como rodar localmente

### Pré-requisitos
- Java 21
- Node.js 18+ e npm
- Docker Desktop

### 1. Subir a infraestrutura (PostgreSQL)

```bash
cd docker
docker compose up -d postgres
```

O banco fica disponível em `localhost:5432` (`atlas_erp` / usuário `atlas` / senha `atlas123` — credenciais de desenvolvimento, ver [SECURITY.md](docs/SECURITY.md)).

### 2. Rodar o backend

```bash
cd atlas-backend
./mvnw spring-boot:run
```

A API sobe em `http://localhost:8080`. As migrations do Flyway rodam automaticamente. Documentação interativa em `http://localhost:8080/swagger-ui.html`.

### 3. Rodar o frontend

```bash
cd atlas-frontend
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173` (CORS já liberado para essa origem em desenvolvimento).

### 4. Primeiro acesso

Não há usuário seed. Crie um usuário via `POST /auth/login` do backend usando o endpoint de registro (`POST /auth/register`, role `ADMIN` ou `USER`) — pelo Swagger UI ou qualquer cliente HTTP — e faça login normalmente pela tela `/login` do frontend.

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Arquitetura do sistema, camadas, fluxo de dados |
| [docs/SECURITY.md](docs/SECURITY.md) | Modelo de autenticação, políticas de segurança, limitações conhecidas |
| [docs/API_GUIDELINES.md](docs/API_GUIDELINES.md) | Convenções da API REST |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Marcos do produto, passado e futuro |
| [docs/PRODUCT_BACKLOG.md](docs/PRODUCT_BACKLOG.md) | Itens de backlog priorizados |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Como contribuir com o projeto |
| [docs/domain-model.md](docs/domain-model.md) | Modelo de domínio (entidades de negócio) |

### Material de apresentação (TCC)

| Documento | Conteúdo |
|---|---|
| [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) | Visão geral: objetivo, problema, stack, arquitetura, módulos, diferenciais |
| [docs/ARCHITECTURE_DIAGRAM.md](docs/ARCHITECTURE_DIAGRAM.md) | Diagrama de arquitetura (Mermaid), isolado para slides |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | Roteiro de demonstração cronometrado (5 min) |
| [docs/POSSIBLE_QUESTIONS.md](docs/POSSIBLE_QUESTIONS.md) | Perguntas prováveis da banca, já respondidas |
| [docs/FUTURE_SCOPE.md](docs/FUTURE_SCOPE.md) | Escopo futuro detalhado por módulo, com esforço estimado |
| [docs/demo/](docs/demo/) | Capturas de tela do fluxo de demonstração, em ordem lógica |

> Nota: o diretório `docs/` também contém uma árvore de documentação mais granular (`docs/architecture/`, `docs/backend/`, `docs/frontend/`, `docs/api/`, `docs/ui/`, `docs/engineering/`, `docs/roadmap/`) criada como estrutura para expansão futura. Hoje a maior parte desses arquivos ainda está vazia — os documentos acima, na raiz de `docs/`, são a referência atual e consolidada.

## Licença

Ainda não definida. Até a definição formal, considere este repositório **todos os direitos reservados**.

## Contribuindo

Veja [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).
