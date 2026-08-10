# Roteiro de Demonstração — Atlas ERP

**Tempo total: 5 minutos.** Cronometrado para a reunião de acompanhamento do TCC. Capturas de referência de cada etapa estão em [docs/demo/](demo/) — use-as para revisar o fluxo antes da apresentação ao vivo, não para substituir a demo ao vivo.

## Antes de começar (preparação, fora do cronômetro)

- [ ] Subir o Postgres: `cd docker && docker compose up -d postgres`.
- [ ] Subir o backend: `cd atlas-backend && ./mvnw spring-boot:run` — aguardar `Started BackendApplication`.
- [ ] Subir o frontend: `cd atlas-frontend && npm run dev` — abrir `http://localhost:5173/login`.
- [ ] Ter um usuário de teste já cadastrado (`POST /auth/register` via Swagger, se ainda não existir) e a senha anotada.
- [ ] **Limpar o autofill do Chrome** no campo de e-mail do login (clique direito → "Remover sugestão"), ou usar uma aba anônima — senão o navegador preenche credenciais de sessões antigas de teste, o que confunde a plateia.
- [ ] Ter pelo menos 2 produtos já cadastrados com categorias, para o Dashboard e a listagem não abrirem vazios.
- [ ] Zoom da janela do navegador em um nível legível para quem está assistindo de longe.

## Roteiro (5:00)

### 0:00 – 0:30 — Abertura
Uma frase de contexto, sem abrir nada ainda:

> "Atlas ERP é um sistema de gestão para pequenas empresas — produtos, clientes, estoque e vendas centralizados, com um dashboard operacional. Vou mostrar o fluxo real: login, indicadores calculados pelo backend, e o cadastro de um produto de ponta a ponta."

### 0:30 – 1:15 — Login
1. Digitar um e-mail **inválido** de propósito → mostrar a mensagem de erro ("E-mail ou senha inválidos.") sem a tela quebrar ou redirecionar incorretamente.
2. Logar com credenciais válidas → redirecionamento automático para o Dashboard.

Frase-chave: *"A validação de credenciais acontece no backend — o frontend só exibe a mensagem que a API já formatou."*

*(Referência: [01-login.jpg](demo/01-login.jpg), [02-login-erro-credenciais.jpg](demo/02-login-erro-credenciais.jpg))*

### 1:15 – 2:15 — Dashboard
1. Apontar os indicadores no topo (produtos ativos, estoque baixo, clientes, empresas, vendas, faturamento hoje/mês).
2. Rolar até o gráfico de faturamento dos últimos 7 dias e as listas de vendas recentes / estoque baixo.

Frase-chave: *"Nenhum desses números é digitado — todos vêm de uma agregação calculada no backend a partir do dado de origem (produtos, vendas). Se eu cadastrar uma venda agora, o número muda sozinho."*

*(Referência: [03-dashboard-indicadores.jpg](demo/03-dashboard-indicadores.jpg), [04-dashboard-grafico-e-listas.jpg](demo/04-dashboard-grafico-e-listas.jpg))*

### 2:15 – 4:15 — Produtos: listagem e cadastro completo
Este é o bloco central — mostra o CRUD de ponta a ponta.

1. Clicar em **Produtos** no menu lateral → mostrar a listagem (tabela + total de produtos).
2. Clicar em **"+ Novo Produto"** → Dialog abre.
   > ⚠️ **Clique uma única vez.** Cliques repetidos na mesma posição podem cair no backdrop do modal já aberto e fechá-lo — se isso acontecer, apenas clique em "Novo Produto" de novo, sem comentar.
3. Preencher o formulário (nome, SKU, preços, categoria) e **deixar um campo obrigatório em branco** propositalmente → clicar em Salvar → mostrar a validação inline (client-side, sem round-trip ao servidor).
4. Preencher tudo corretamente, mas usar um **SKU que já existe** → Salvar → mostrar o Snackbar vermelho de erro vindo do backend ("Já existe um produto com este SKU"), com o modal permanecendo aberto e os dados preservados.
   > ⚠️ O Snackbar some sozinho em 4 segundos — aponte para ele assim que aparecer, não espere para comentar.
5. Corrigir o SKU e Salvar de novo → modal fecha sozinho, Snackbar verde de sucesso aparece, e o produto já está na tabela — sem precisar recarregar a página.

Frase-chave: *"Fechamento do modal, atualização da tabela e o Snackbar de sucesso são consequência de uma única invalidação de cache no React Query — não há nenhuma chamada manual de 'recarregar lista' no código."*

*(Referência: [07](demo/07-produtos-listagem.jpg) a [11](demo/11-produtos-sucesso-e-atualizacao-automatica.jpg) em [docs/demo/](demo/))*

### 4:15 – 4:45 — Resiliência (opcional, se sobrar tempo)
Só incluir se os 4:15 anteriores correram dentro do tempo:

- Mostrar rapidamente o **empty state** e o **error state** (podem ser só as capturas em [docs/demo/12](demo/12-produtos-empty-state.jpg) e [docs/demo/13](demo/13-produtos-error-state.jpg), sem precisar reproduzir ao vivo).

Frase-chave: *"O sistema trata explicitamente carregamento, lista vazia e falha de rede — não assume que a API sempre responde rápido e com dados."*

### 4:45 – 5:00 — Encerramento
1. Clicar em **Sair** → volta para o login.
2. Tentar acessar a URL do Dashboard diretamente, sem estar logado → redirecionamento automático para `/login`.

Frase de fechamento:

> "Autenticação, produtos e dashboard estão completos e testados de ponta a ponta. Os módulos de clientes, estoque e vendas já têm backend pronto — o próximo passo é replicar essa mesma interface que acabei de mostrar para eles."

## Se algo der errado ao vivo

| Situação | O que fazer |
|---|---|
| Backend não responde | Confirmar que o terminal do `mvnw spring-boot:run` mostra `Started BackendApplication`; se caiu, reiniciar — leva ~10s |
| Autofill do Chrome mostra credenciais estranhas | Ignorar visualmente, apagar o campo e digitar o e-mail correto |
| Modal fechou sozinho ao clicar em "Novo Produto" | Clicar de novo — é o backdrop do modal anterior, não um bug |
| Snackbar já sumiu antes de comentar | Seguir em frente — o resultado (produto na tabela) já mostra que funcionou |
| Alguém perguntar algo fora do roteiro | Ver [POSSIBLE_QUESTIONS.md](POSSIBLE_QUESTIONS.md) antes de improvisar |

## Checklist pós-demo

- [ ] Se produtos de teste foram criados durante a demo (ex.: SKU inválido corrigido), mencionar que são dados de demonstração, não produção.
- [ ] Ter [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) e [FUTURE_SCOPE.md](FUTURE_SCOPE.md) à mão para perguntas sobre o que falta.
