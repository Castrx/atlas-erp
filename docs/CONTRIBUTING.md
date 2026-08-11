# Contribuindo com o Atlas ERP

Obrigado pelo interesse em contribuir. Este documento descreve como configurar o ambiente, os padrões de código adotados e como o trabalho é conduzido neste projeto.

## Pré-requisitos

- Java 21
- Node.js 18+ e npm
- Docker Desktop (para PostgreSQL local)
- Git

## Configurando o ambiente local

```bash
# 1. Infraestrutura
cd docker
docker compose up -d postgres

# 2. Backend
cd ../atlas-backend
./mvnw spring-boot:run
# API em http://localhost:8080, Swagger em /swagger-ui.html

# 3. Frontend (em outro terminal)
cd ../atlas-frontend
npm install
npm run dev
# App em http://localhost:5173
```

Não há usuário seed — crie um via `POST /auth/register` (Swagger UI é o caminho mais simples) antes de testar o login.

## Estrutura do repositório

Veja [architecture.md](architecture.md) para a organização detalhada de `atlas-backend/` e `atlas-frontend/`. Resumo:

```
atlas-backend/   → API Spring Boot (controller/service/repository/entity/dto)
atlas-frontend/  → SPA React (core/ + features/ + components/ + layouts/)
docker/          → docker-compose para infraestrutura local
docs/            → esta documentação
```

## Como o trabalho é conduzido: sprints escopadas

Este projeto é desenvolvido em **sprints curtas e explicitamente escopadas**. Cada sprint:

1. Tem **um objetivo único e declarado** (ex.: "corrigir o erro de compilação", "configurar CORS", "integrar autenticação no frontend").
2. Declara **o que pode e o que não pode ser alterado** antes de qualquer código ser escrito (ex.: "não alterar DTOs", "não remover código morto", "não implementar refresh token").
3. Para mudanças de escopo ambíguas (ex.: um arquivo fora da lista explícita, mas necessário para o objetivo funcionar), a decisão é levantada explicitamente antes de agir — não presumida.
4. Ao final, roda build/testes/verificação manual do que foi pedido, e apresenta um **resumo de todos os arquivos alterados**.
5. Aguarda aprovação explícita antes de iniciar a sprint seguinte.

Esse processo prioriza mudanças pequenas, verificáveis e reversíveis sobre refatorações grandes e especulativas. Ao abrir uma contribuição, descreva o escopo da mesma forma: o que muda, o que deliberadamente não muda, e por quê.

## Padrões de código

### Backend
- Camadas não devem ser puladas: controller → service → repository. Regra de negócio vive no service, nunca no controller.
- DTOs são `record`s, nunca a entidade JPA exposta diretamente na API. Ver [API_GUIDELINES.md](API_GUIDELINES.md).
- Toda exceção de domínio esperada deve ter um `@ExceptionHandler` explícito em `GlobalExceptionHandler` — não deixe cair no handler genérico de `500`.
- Mensagens de validação e de erro voltadas ao usuário final: em português.

### Frontend
- Segue a convenção `core/` (infraestrutura transversal) vs. `features/<módulo>/{pages,components,services}` (produto). Novo módulo de negócio = nova pasta em `features/`.
- **Todo acesso a `localStorage` do token passa por `core/auth/token.ts`** — nenhum componente ou service acessa `localStorage` diretamente.
- Componentes de UI compartilhados vivem em `components/ui/`; componentes de navegação/shell em `components/navigation/`.
- Zero erros e zero warnings de ESLint é o padrão esperado antes de qualquer PR (`npm run lint`).
- Zero erros de `tsc` é obrigatório (`npm run build` roda `tsc -b` antes do bundle).

### Ambos
- Não remova código considerado "morto" como efeito colateral de outra tarefa — se for identificado, registre como item do [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md) e trate em uma sprint dedicada.

## Commits

O histórico do projeto usa majoritariamente o padrão [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`), com algumas mensagens descritivas em português sem prefixo. Ao contribuir, prefira o padrão com prefixo — facilita gerar changelog no futuro:

```
feat: adiciona CRUD de produtos
fix: corrige validação de e-mail no cadastro de cliente
docs: atualiza guia de contribuição
chore: atualiza dependências do frontend
```

## Testes

- Backend: `./mvnw test` (a partir de `atlas-backend/`). Exige apenas o Docker em execução — os testes de integração sobem um PostgreSQL efêmero via Testcontainers e rodam as migrations Flyway reais, sem depender de um banco local.
- Frontend: `npm test` (a partir de `atlas-frontend/`), com Vitest + React Testing Library. A verificação mínima esperada em qualquer PR de frontend é `npm test`, `npm run build` e `npm run lint` limpos.

## Abrindo um Pull Request

- Descreva o objetivo da mudança e o que foi deliberadamente deixado de fora.
- Rode build e testes localmente antes de abrir o PR — um PR não deve depender de CI para descobrir que quebrou o build. O CI (`.github/workflows/ci.yml`) roda `mvn test`, lint, build e vitest em cada push/PR.
- Referencie o ID do item do backlog (`AE-NNN`) quando aplicável.
- Se a mudança tocar autenticação, segurança ou CORS, mencione explicitamente — são áreas sensíveis documentadas em [SECURITY.md](SECURITY.md).

## Dúvidas

Abra uma issue descrevendo o contexto, ou consulte primeiro [architecture.md](architecture.md) e [ROADMAP.md](ROADMAP.md) — a maior parte das dúvidas de "por que isso foi feito assim" já está registrada ali.
