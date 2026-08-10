import { api, ENDPOINTS } from "../../../core/api";
import type { CreateProductInput, Product } from "../types/product.types";

export const productService = {
  async getAll(): Promise<Product[]> {
    const { data } = await api.get<Product[]>(ENDPOINTS.PRODUCTS);

    return data;
  },

  async create(input: CreateProductInput): Promise<Product> {
    const { data } = await api.post<Product>(ENDPOINTS.PRODUCTS, input);

    return data;
  },
};
