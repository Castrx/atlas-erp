/**
 * Serviço canônico de Categorias vive em features/categories (que agora
 * tem tela própria de CRUD) — reexportado aqui porque o formulário de
 * Produto também depende dele para popular o seletor de categoria. Não
 * duplicar a chamada de API: qualquer alteração de contrato entra só em
 * features/categories/services/category.service.ts.
 */
export { categoryService } from "../../categories/services/category.service";
