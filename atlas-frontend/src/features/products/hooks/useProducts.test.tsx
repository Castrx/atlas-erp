import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { createQueryWrapper } from "../../../test/test-utils";
import { useProducts } from "./useProducts";
import { productService } from "../services/product.service";
import type { Product } from "../types/product.types";

vi.mock("../services/product.service", () => ({
  productService: { getAll: vi.fn(), create: vi.fn() },
}));

const produtoFake: Product = {
  id: 1,
  name: "Mouse Gamer",
  description: null,
  sku: "MOUSE-001",
  barcode: null,
  costPrice: 10,
  salePrice: 20,
  stock: 5,
  minimumStock: 1,
  active: true,
  categoryId: 1,
  categoryName: "Periféricos",
};

describe("useProducts", () => {
  it("deve retornar a lista de produtos, quando a requisição tem sucesso", async () => {
    vi.mocked(productService.getAll).mockResolvedValue([produtoFake]);

    const { result } = renderHook(() => useProducts(), { wrapper: createQueryWrapper() });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([produtoFake]);
  });

  it("deve refletir o estado de erro, quando a requisição falha", async () => {
    vi.mocked(productService.getAll).mockRejectedValue(new Error("Falha de rede"));

    const { result } = renderHook(() => useProducts(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
  });
});
