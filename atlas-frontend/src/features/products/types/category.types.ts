/**
 * Categoria de produto. O tipo canônico vive em features/categories (que
 * agora tem tela própria de CRUD) — reexportado aqui porque o formulário
 * de Produto também depende dele para popular o seletor de categoria.
 */
export type { Category } from "../../categories/types/category.types";
