# Diretrizes de API — Atlas ERP

Convenções da API REST do Atlas ERP, extraídas do que está efetivamente implementado em `atlas-backend/`. O objetivo é manter consistência à medida que novos módulos forem adicionados — qualquer novo endpoint deve seguir estes padrões.

## Base URL

- Desenvolvimento: `http://localhost:8080`
- Sem prefixo de versão na URL hoje (ex.: `/products`, não `/v1/products`). Versionamento ainda não foi necessário; se/quando houver breaking changes, este documento deve ser atualizado com a estratégia adotada.

## Autenticação

Toda rota fora de `/auth/**` e do Swagger exige o header:

```
Authorization: Bearer <token>
```

Ver [SECURITY.md](SECURITY.md) para o modelo completo de autenticação.

## Nomenclatura de recursos

- Substantivos no plural, em inglês, kebab-free (uma palavra): `/products`, `/customers`, `/categories`, `/stock`, `/sales`, `/companies`, `/users`.
- Sub-recursos de autenticação sob `/auth`: `/auth/login`, `/auth/register`.
- Verbos HTTP padrão REST — `GET` (listar/buscar), `POST` (criar), `PUT`/`PATCH` (atualizar), `DELETE` (remover). Não usar verbos na URL (evitar `/products/create`).

## DTOs

- Implementados como **Java `record`**, imutáveis.
- Sufixo `Request` para entrada, `Response` para saída — nunca a entidade JPA é exposta diretamente na API.
- Organizados por domínio: `dto/<domínio>/<Nome>Request.java`, `dto/<domínio>/<Nome>Response.java` (ex.: `dto/product/CreateProductRequest.java`, `dto/product/ProductResponse.java`).
- Validação via Bean Validation (`jakarta.validation`) diretamente nos campos do record (`@NotBlank`, `@Email`, etc.), com mensagens de erro em português.

Exemplo real (`LoginRequest`):

```java
public record LoginRequest(
    @Email(message = "E-mail inválido.")
    @NotBlank(message = "O e-mail é obrigatório.")
    String email,

    @NotBlank(message = "A senha é obrigatória.")
    String password
) {}
```

## Formato de resposta — sucesso

Sem envelope — o corpo da resposta é o DTO diretamente (sem `{ data: ... }` wrapper):

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

## Formato de resposta — erro

Toda exceção tratada pelo `GlobalExceptionHandler` retorna o mesmo formato (`ApiError`):

```json
{
  "timestamp": "2026-08-06T10:15:30",
  "status": 401,
  "error": "Unauthorized",
  "message": "E-mail ou senha inválidos.",
  "path": "/auth/login"
}
```

| Campo | Descrição |
|---|---|
| `timestamp` | Momento em que o erro ocorreu, `LocalDateTime` |
| `status` | Código HTTP numérico |
| `error` | Nome padrão do status HTTP (`HttpStatus.getReasonPhrase()`) |
| `message` | Mensagem legível, em português, segura para exibir ao usuário final |
| `path` | URI da requisição que falhou |

### Mapeamento de exceção → status HTTP

| Situação | Exceção lançada | Status |
|---|---|---|
| Credenciais inválidas no login | `BadCredentialsException` | `401` |
| Recurso não encontrado | `ResourceNotFoundException` | `404` |
| Violação de regra de negócio (ex.: e-mail duplicado) | `BusinessException` | `409` |
| Corpo da requisição inválido (Bean Validation) | `MethodArgumentNotValidException` | `400` |
| Qualquer erro não mapeado | `Exception` | `500` |

Ao adicionar uma nova regra de negócio que deva falhar de forma controlada, lance uma das exceções acima (ou crie uma nova e registre seu handler em `GlobalExceptionHandler`) — nunca deixe uma regra de negócio cair no handler genérico de `500`.

> **Lição registrada**: até a Sprint 1A, `BadCredentialsException` não tinha handler dedicado e caía no genérico, retornando `500` para uma simples senha errada. Ao criar um novo tipo de exceção, sempre adicione seu `@ExceptionHandler` explícito — não confie no fallback genérico para erros esperados do domínio.

## Mensagens

Mensagens de erro (`message` no `ApiError`, e mensagens de validação nos DTOs) são escritas em **português**, pensadas para serem exibidas diretamente na UI sem reescrita no frontend.

## O que ainda não existe (não assuma que existe)

- **Paginação**: endpoints de listagem hoje retornam a coleção completa. Se/quando volumes justificarem, adotar um padrão consistente (`page`, `size`, `sort`) em todos os endpoints de listagem ao mesmo tempo — não caso a caso.
- **Versionamento de API**: nenhuma estratégia definida ainda.
- **Idempotência / `Idempotency-Key`**: não implementado.
- **Rate limiting**: não implementado em nenhum endpoint, incluindo `/auth/login`.
- **HATEOAS / links de navegação**: não utilizado; respostas são DTOs planos.

## Documentação interativa

O backend expõe Swagger UI via springdoc-openapi, com o app rodando, em `http://localhost:8080/swagger-ui.html`. Use-o como referência viva do contrato — este documento descreve **convenções**, não substitui o schema OpenAPI gerado.
