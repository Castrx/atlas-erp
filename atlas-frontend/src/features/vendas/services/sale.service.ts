import { api, ENDPOINTS } from "../../../core/api";
import type { CreateSaleInput, Sale } from "../types/sale.types";

export const saleService = {
  async getAll(): Promise<Sale[]> {
    const { data } = await api.get<Sale[]>(ENDPOINTS.SALES);

    return data;
  },

  async create(input: CreateSaleInput): Promise<Sale> {
    const { data } = await api.post<Sale>(ENDPOINTS.SALES, input);

    return data;
  },

  /** Cancela uma venda (ADMIN-only no backend) — restaura o estoque. */
  async cancel(id: number): Promise<void> {
    await api.delete(`${ENDPOINTS.SALES}/${id}`);
  },
};
