/**
 * Espelha com.atlas.backend.dto.category.CategoryResponse (backend).
 */
export interface Category {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}

/**
 * Espelha com.atlas.backend.dto.category.CreateCategoryRequest /
 * UpdateCategoryRequest (backend). O backend usa dois records distintos,
 * mas com o mesmo shape — um único tipo de input cobre create e update.
 */
export interface CreateCategoryInput {
  name: string;
  description?: string;
}
