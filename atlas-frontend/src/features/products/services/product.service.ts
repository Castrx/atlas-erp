import { api, ENDPOINTS } from "../../../core/api";
import type { Product } from "../types/product.types";

export const productService = {
  async getAll(): Promise<Product[]> {
    const { data } = await api.get<Product[]>(ENDPOINTS.PRODUCTS);

    return data;
  },
};
