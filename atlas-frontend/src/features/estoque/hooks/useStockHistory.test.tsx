import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { createQueryWrapper } from "../../../test/test-utils";
import { useStockHistory } from "./useStockHistory";
import { stockService } from "../services/stock.service";
import type { StockHistoryPage, StockMovement } from "../types/stock.types";

vi.mock("../services/stock.service", () => ({
  stockService: { entry: vi.fn(), exit: vi.fn(), history: vi.fn() },
}));

const movimentoFake: StockMovement = {
  id: 1,
  productId: 1,
  productName: "Mouse Gamer",
  type: "ENTRY",
  quantity: 5,
  reason: "Reposição de teste",
  createdBy: "user@teste.local",
  createdAt: "2026-01-01T10:00:00",
};

const paginaFake: StockHistoryPage = {
  content: [movimentoFake],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 10,
};

describe("useStockHistory", () => {
  it("deve retornar a página do histórico, quando a requisição tem sucesso", async () => {
    vi.mocked(stockService.history).mockResolvedValue(paginaFake);

    const { result } = renderHook(() => useStockHistory(0), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(paginaFake);
    expect(stockService.history).toHaveBeenCalledWith(0, 10);
  });

  it("deve refletir o estado de erro, quando a requisição falha", async () => {
    vi.mocked(stockService.history).mockRejectedValue(new Error("Falha de rede"));

    const { result } = renderHook(() => useStockHistory(0), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
  });
});
