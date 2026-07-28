# Atlas ERP - Domain Model

## Company

Representa uma empresa cadastrada no sistema.

Campos:

- id
- name
- tradeName
- cnpj
- email
- phone
- createdAt
- updatedAt

Relacionamentos futuros:

- 1 Empresa possui vários Usuários.
- 1 Empresa possui vários Produtos.
- 1 Empresa possui vários Clientes.
- 1 Empresa possui vários Fornecedores.
- 1 Empresa possui vários Pedidos.