import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { createQueryWrapper } from "../../../test/test-utils";
import { useSales } from "./useSales";
import { saleService } from "../services/sale.service";
import type { Sale } from "../types/sale.types";

vi.mock("../services/sale.service", () => ({
  saleService: { getAll: vi.fn(), create: vi.fn(), cancel: vi.fn() },
}));

const vendaFake: Sale = {
  id: 1,
  customerId: 1,
  customerName: "Cliente Teste",
  total: 40,
  createdBy: "user@teste.local",
  createdAt: "2026-01-01T10:00:00",
  items: [
    { productId: 1, productName: "Mouse Gamer", quantity: 2, unitPrice: 20, subtotal: 40 },
  ],
};

describe("useSales", () => {
  it("deve retornar a lista de vendas, quando a requisição tem sucesso", async () => {
    vi.mocked(saleService.getAll).mockResolvedValue([vendaFake]);

    const { result } = renderHook(() => useSales(), { wrapper: createQueryWrapper() });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([vendaFake]);
  });

  it("deve refletir o estado de erro, quando a requisição falha", async () => {
    vi.mocked(saleService.getAll).mockRejectedValue(new Error("Falha de rede"));

    const { result } = renderHook(() => useSales(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
  });
});
