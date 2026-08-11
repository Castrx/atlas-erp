import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";

import { render } from "../../../../test/test-utils";
import { StockMovementDialog } from "./StockMovementDialog";
import { stockService } from "../../services/stock.service";
import { productService } from "../../../products/services/product.service";
import type { Product } from "../../../products/types/product.types";

// Mocka a fronteira HTTP (os services) em vez dos hooks — o teste continua
// exercitando o TanStack Query e o React Hook Form + Zod de verdade,
// só sem bater na API real.
vi.mock("../../services/stock.service", () => ({
  stockService: { entry: vi.fn(), exit: vi.fn(), history: vi.fn() },
}));

vi.mock("../../../products/services/product.service", () => ({
  productService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
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

async function preencherMovimento(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText("Produto"));
  await user.click(await screen.findByRole("option", { name: "Mouse Gamer" }));

  await user.type(screen.getByLabelText("Quantidade"), "5");
  await user.type(screen.getByLabelText("Motivo"), "Reposição de teste");
}

describe("StockMovementDialog", () => {
  beforeEach(() => {
    vi.mocked(productService.getAll).mockResolvedValue([produtoFake]);
  });

  it("deve exibir mensagens de validação e não enviar, quando campos obrigatórios estão vazios", async () => {
    const user = userEvent.setup();
    const onError = vi.fn();

    render(
      <StockMovementDialog
        open
        mode="entry"
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        onError={onError}
      />
    );

    await user.click(screen.getByRole("button", { name: /registrar entrada/i }));

    expect(await screen.findByText("Selecione um produto.")).toBeInTheDocument();
    expect(screen.getByText("Informe a quantidade.")).toBeInTheDocument();
    expect(screen.getByText("Informe o motivo.")).toBeInTheDocument();
    expect(stockService.entry).not.toHaveBeenCalled();
  });

  it("deve enviar o payload de entrada e avisar sucesso, quando o formulário é válido", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    vi.mocked(stockService.entry).mockResolvedValue(undefined);

    render(
      <StockMovementDialog
        open
        mode="entry"
        onClose={onClose}
        onSuccess={onSuccess}
        onError={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Entrada de Estoque" })).toBeInTheDocument();

    await preencherMovimento(user);

    await user.click(screen.getByRole("button", { name: /registrar entrada/i }));

    await waitFor(() => expect(stockService.entry).toHaveBeenCalled());

    expect(vi.mocked(stockService.entry).mock.calls[0]?.[0]).toEqual({
      productId: 1,
      quantity: 5,
      reason: "Reposição de teste",
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("deve enviar o payload de saída em modo exit", async () => {
    const user = userEvent.setup();

    vi.mocked(stockService.exit).mockResolvedValue(undefined);

    render(
      <StockMovementDialog
        open
        mode="exit"
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        onError={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Saída de Estoque" })).toBeInTheDocument();

    await preencherMovimento(user);

    await user.click(screen.getByRole("button", { name: /registrar saída/i }));

    await waitFor(() => expect(stockService.exit).toHaveBeenCalled());

    expect(vi.mocked(stockService.exit).mock.calls[0]?.[0]).toEqual({
      productId: 1,
      quantity: 5,
      reason: "Reposição de teste",
    });
  });

  it("deve repassar a mensagem de erro do backend, quando a saída falha por estoque insuficiente", async () => {
    const user = userEvent.setup();
    const onError = vi.fn();

    vi.mocked(stockService.exit).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Estoque insuficiente." } },
    });

    render(
      <StockMovementDialog
        open
        mode="exit"
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        onError={onError}
      />
    );

    await preencherMovimento(user);

    await user.click(screen.getByRole("button", { name: /registrar saída/i }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith("Estoque insuficiente."));
  });
});
