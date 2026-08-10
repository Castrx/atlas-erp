import { api, ENDPOINTS } from "../../../core/api";
import type { Category } from "../types/category.types";

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const { data } = await api.get<Category[]>(ENDPOINTS.CATEGORIES);

    return data;
  },
};
