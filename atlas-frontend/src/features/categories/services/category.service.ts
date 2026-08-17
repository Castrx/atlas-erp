import { api, ENDPOINTS } from "../../../core/api";
import type { Category, CreateCategoryInput } from "../types/category.types";

/**
 * Serviço canônico de Categorias. features/products reexporta este mesmo
 * serviço (para popular o seletor de categoria do formulário de produto)
 * em vez de manter uma cópia — ver features/products/services/category.service.ts.
 */
export const categoryService = {
  async getAll(): Promise<Category[]> {
    const { data } = await api.get<Category[]>(ENDPOINTS.CATEGORIES);

    return data;
  },

  async create(input: CreateCategoryInput): Promise<Category> {
    const { data } = await api.post<Category>(ENDPOINTS.CATEGORIES, input);

    return data;
  },

  async update(id: number, input: CreateCategoryInput): Promise<Category> {
    const { data } = await api.put<Category>(`${ENDPOINTS.CATEGORIES}/${id}`, input);

    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${ENDPOINTS.CATEGORIES}/${id}`);
  },
};
