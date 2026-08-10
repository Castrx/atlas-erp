# Perguntas Possíveis da Banca — Atlas ERP

Perguntas prováveis em uma reunião de acompanhamento de TCC, organizadas por tema, cada uma respondida com o estado real do projeto — sem inflar o que não existe. Onde há uma limitação, a resposta reconhece a limitação e explica a razão e o plano, em vez de evitar o assunto.

## Arquitetura e decisões de design

**1. Por que separar frontend e backend em vez de um monólito com Thymeleaf/JSP renderizando no servidor?**
Porque o objetivo é demonstrar uma arquitetura de API REST desacoplada, que é o padrão de mercado atual para aplicações que podem precisar, no futuro, de múltiplos clientes (web, mobile) consumindo a mesma API. O custo é maior complexidade inicial (CORS, autenticação stateless); o benefício é separação clara de responsabilidades e um contrato de API explícito e documentado (Swagger).

**2. Por que monólito e não microsserviços?**
O domínio (produtos, clientes, estoque, vendas) é coeso e de escala pequena — extrair serviços separados agora adicionaria complexidade operacional (deploy independente, comunicação entre serviços, consistência distribuída) sem nenhum ganho real no estágio atual. Um monólito bem modularizado internamente por camada (controller/service/repository) é a escolha correta para este tamanho de domínio; microsserviços seriam otimização prematura.

**3. Por que REST e não GraphQL?**
Os recursos do domínio têm um número pequeno e estável de campos por entidade — não há problema real de over-fetching/under-fetching que justifique a complexidade adicional do GraphQL (schema, resolvers). REST com DTOs por endpoint já resolve bem o problema atual.

**4. Como as camadas se comunicam e por que essa separação?**
`Controller` recebe a requisição HTTP e valida o formato de entrada (`@Valid`); nunca contém regra de negócio. `Service` concentra toda regra de negócio (ex.: impedir SKU duplicado, impedir venda com estoque insuficiente). `Repository` só acessa dados via Spring Data JPA, sem SQL manual. Essa separação existe para que a regra de negócio seja testável isoladamente da camada HTTP e do acesso a dados — hoje a cobertura de testes automatizados ainda não explora isso (ver pergunta sobre testes), mas a arquitetura já está preparada para permitir.

**5. Por que os DTOs são `record`s e não classes com getters/setters?**
`record` do Java é imutável por padrão e elimina boilerplate (equals/hashCode/toString gerados). Como um DTO de request/response não deveria mudar de estado depois de criado, imutabilidade é a escolha correta, não apenas conveniência.

## Banco de dados

**6. Por que PostgreSQL e não MySQL ou um banco NoSQL?**
O domínio é fortemente relacional (produto pertence a categoria, venda referencia cliente e tem múltiplos itens que referenciam produto) — modelo relacional com chaves estrangeiras e transações ACID é a escolha natural. PostgreSQL foi escolhido por ser open-source, maduro, e ter suporte de primeira classe no ecossistema Spring.

**7. Por que Flyway em vez de deixar o Hibernate gerar/atualizar o schema automaticamente (`ddl-auto: update`)?**
`ddl-auto: update` é conveniente em protótipo, mas não é auditável nem reversível — não há registro de exatamente qual alteração de schema aconteceu e quando. Com Flyway, cada mudança de schema é uma migration numerada e versionada no controle de código (hoje 15 migrations, `V1` a `V15`), e o Hibernate roda em modo `validate` — ele confere que o schema bate com o mapeamento das entidades, mas nunca altera o banco sozinho.

**8. Como é garantida a integridade referencial e transacional?**
Via chaves estrangeiras no schema (ex.: `sale_item.product_id → product.id`) e `@Transactional` nos métodos de service que fazem múltiplas escritas relacionadas — por exemplo, criar uma venda grava a venda, os itens, e dá baixa no estoque na mesma transação; se qualquer etapa falhar, tudo é revertido.

## Segurança

**9. Como funciona a autenticação?**
JWT assinado com HS256, emitido em `POST /auth/login` após validar a senha (hash BCrypt) contra o banco. O token é enviado em todas as requisições subsequentes no header `Authorization: Bearer`. A validação é stateless — o backend não guarda nenhuma sessão, recomputa a assinatura do token a cada requisição.

**10. Por que JWT e não sessão de servidor?**
Alinhado à decisão de ter uma API stateless — sem sessão, qualquer instância do backend pode atender qualquer requisição, sem afinidade de servidor. É o padrão adequado para uma API consumida por um SPA.

**11. Quais são as limitações de segurança conhecidas hoje?**
Documentadas explicitamente em [SECURITY.md](SECURITY.md), sem esconder nada: token guardado em `localStorage` (exposto a XSS, se algum vetor existir na aplicação); sem refresh token (token fixo de 24h, sem revogação); papéis `ADMIN`/`USER` existem no token mas **nenhum endpoint hoje restringe acesso por papel** (`@PreAuthorize` não está em uso ainda); sem rate limiting no login; secret JWT em texto plano no `application.yml` de desenvolvimento. Todas são decisões conscientes de escopo para o estágio atual, não descobertas tardias — e todas têm um plano de correção registrado no backlog.

**12. Por que o token fica em `localStorage` e não em um cookie `httpOnly`?**
É a limitação mais honesta de assumir: `localStorage` é mais simples de implementar no fluxo atual (SPA + API em domínios/portas diferentes em dev) mas é acessível via JavaScript, logo vulnerável a XSS. Um cookie `httpOnly` + `SameSite` seria mais seguro contra esse vetor específico, mas exige ajustar CORS/CSRF e o fluxo de refresh. Está registrado como melhoria pendente, não como algo não considerado.

## Testes e qualidade

**13. Qual a cobertura de testes automatizados?**
Baixa, e isso é reconhecido abertamente: hoje existe apenas um teste de contexto no backend (`BackendApplicationTests`, que sobe a aplicação inteira e valida que o contexto Spring carrega corretamente, incluindo as migrations do Flyway) e nenhum teste automatizado no frontend. A validação até agora foi feita via build (`mvn test`, `npm run build`) + teste manual ponta a ponta em cada sprint, documentado no [ROADMAP.md](ROADMAP.md). Testes unitários de service e testes de componente no frontend são o próximo passo de qualidade, já identificado no backlog.

**14. Como foi garantida a qualidade sem uma suíte de testes maior?**
Processo de sprints pequenas e escopadas (ver [CONTRIBUTING.md](CONTRIBUTING.md)): cada incremento é validado manualmente de ponta a ponta antes de ser considerado concluído, com checklist explícito (login, navegação, estados de erro, console sem exceptions, persistência confirmada direto na API). Não substitui testes automatizados, mas produziu um histórico rastreável do que foi validado e quando.

## Frontend

**15. Por que React e não Angular ou Vue?**
Ecossistema maior, curva de aprendizado adequada ao tempo do projeto, e boa integração com as bibliotecas escolhidas (TanStack Query, React Hook Form). É também a opção mais alinhada ao mercado de trabalho atual.

**16. Por que TanStack Query em vez de `useEffect` + `fetch`/`axios` direto?**
`useEffect` manual não dá cache, não dá deduplicação de requisições, e exige gerenciar manualmente estado de loading/erro/refetch. TanStack Query resolve isso de forma declarativa — inclusive a invalidação de cache após criar um produto (que atualiza a listagem sozinha) é uma linha de código (`invalidateQueries`), não um `refetch` manual espalhado pela aplicação.

**17. Onde fica a lógica de validação de formulário?**
Em duas camadas, deliberadamente: client-side com Zod (feedback imediato, sem round-trip ao servidor, ex.: campo obrigatório vazio) e server-side no Service do backend (a validação que realmente importa — ex.: SKU duplicado só pode ser checado contra o banco). O frontend nunca é a única linha de defesa.

## Escopo e processo

**18. O que falta implementar?**
Interface para Clientes, Categorias, Estoque e Vendas — o backend dos quatro já está pronto e testável via Swagger, falta só a tela, seguindo o padrão já validado em Produtos. Além disso: RBAC aplicado (papéis existem, não são checados), multiempresa real (entidade `Company` existe, sem vínculo aplicado), módulos de Financeiro e Auditoria (ainda não modelados), e CI/CD. Detalhado em [FUTURE_SCOPE.md](FUTURE_SCOPE.md).

**19. Como foi decidida a ordem de implementação?**
Por dependência e valor de demonstração: autenticação primeiro (todo o resto depende disso), depois Dashboard (mostra que o backend calcula agregações reais), depois Produtos como primeiro módulo de negócio completo (CRUD de ponta a ponta, template replicável para os demais). Registrado sprint a sprint em [ROADMAP.md](ROADMAP.md).

**20. Esse sistema estaria pronto para produção hoje?**
Não, e a resposta honesta é essa: faltam RBAC aplicado, rate limiting, secret management adequado, testes automatizados, CI/CD e uma estratégia de deploy. Está claramente marcado como "pré-alfa / em desenvolvimento ativo" no README. O valor do estágio atual é demonstrar a arquitetura e o processo de engenharia completos numa fatia vertical do sistema (autenticação → dashboard → CRUD de produtos), não cobertura funcional total.
