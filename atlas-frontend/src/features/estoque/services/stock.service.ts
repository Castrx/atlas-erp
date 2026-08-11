import { api, ENDPOINTS } from "../../../core/api";
import type { StockHistoryPage, StockMovementInput } from "../types/stock.types";

export const stockService = {
  async entry(input: StockMovementInput): Promise<void> {
    await api.post(`${ENDPOINTS.STOCK}/entry`, input);
  },

  async exit(input: StockMovementInput): Promise<void> {
    await api.post(`${ENDPOINTS.STOCK}/exit`, input);
  },

  async history(page: number, size: number): Promise<StockHistoryPage> {
    const { data } = await api.get<StockHistoryPage>(
      `${ENDPOINTS.STOCK}/history`,
      { params: { page, size } }
    );

    return data;
  },
};
