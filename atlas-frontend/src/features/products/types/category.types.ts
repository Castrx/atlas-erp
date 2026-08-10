/**
 * Espelha com.atlas.backend.dto.category.CategoryResponse (backend).
 * Vive em products/ porque hoje só é usado para popular o seletor de
 * categoria do formulário de produto — não existe uma feature de
 * categorias própria ainda.
 */
export interface Category {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}
