import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";

import { render } from "../../../test/test-utils";
import { EstoquePage } from "./EstoquePage";
import { stockService } from "../services/stock.service";
import { productService } from "../../products/services/product.service";
import type { StockHistoryPage, StockMovement } from "../types/stock.types";
import type { Product } from "../../products/types/product.types";

vi.mock("../services/stock.service", () => ({
  stockService: { entry: vi.fn(), exit: vi.fn(), history: vi.fn() },
}));

vi.mock("../../products/services/product.service", () => ({
  productService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
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

describe("EstoquePage", () => {
  beforeEach(() => {
    vi.mocked(stockService.history).mockResolvedValue(paginaFake);
    vi.mocked(productService.getAll).mockResolvedValue([produtoFake]);
  });

  it("deve listar o histórico de movimentações", async () => {
    render(<EstoquePage />);

    expect(await screen.findByText("Mouse Gamer")).toBeInTheDocument();
    expect(screen.getByText("Reposição de teste")).toBeInTheDocument();
    expect(screen.getByText("Movimentações")).toBeInTheDocument();
  });

  it("deve registrar uma entrada após preencher o diálogo", async () => {
    const user = userEvent.setup();
    vi.mocked(stockService.entry).mockResolvedValue(undefined);

    render(<EstoquePage />);

    await screen.findByText("Mouse Gamer");
    await user.click(screen.getByRole("button", { name: /entrada/i }));

    expect(screen.getByRole("heading", { name: "Entrada de Estoque" })).toBeInTheDocument();

    await user.click(screen.getByLabelText("Produto"));
    await user.click(await screen.findByRole("option", { name: "Mouse Gamer" }));
    await user.type(screen.getByLabelText("Quantidade"), "5");
    await user.type(screen.getByLabelText("Motivo"), "Reposição");

    await user.click(screen.getByRole("button", { name: /registrar entrada/i }));

    await waitFor(() => expect(stockService.entry).toHaveBeenCalled());

    expect(vi.mocked(stockService.entry).mock.calls[0]?.[0]).toEqual({
      productId: 1,
      quantity: 5,
      reason: "Reposição",
    });

    expect(await screen.findByText("Entrada registrada com sucesso.")).toBeInTheDocument();
  });

  it("deve exibir o estado vazio, quando não há movimentações", async () => {
    vi.mocked(stockService.history).mockResolvedValue({
      ...paginaFake,
      content: [],
      totalElements: 0,
      totalPages: 0,
    });

    render(<EstoquePage />);

    expect(await screen.findByText("Nenhuma movimentação registrada")).toBeInTheDocument();
  });
});
