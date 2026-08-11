import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";

import { render } from "../../../../test/test-utils";
import { SaleFormDialog } from "./SaleFormDialog";
import { saleService } from "../../services/sale.service";
import { productService } from "../../../products/services/product.service";
import { customerService } from "../../../customers/services/customer.service";
import type { Product } from "../../../products/types/product.types";
import type { Customer } from "../../../customers/types/customer.types";

// Mocka a fronteira HTTP (os services) em vez dos hooks — o teste continua
// exercitando o TanStack Query e o React Hook Form + Zod de verdade,
// só sem bater na API real.
vi.mock("../../services/sale.service", () => ({
  saleService: { getAll: vi.fn(), create: vi.fn(), cancel: vi.fn() },
}));

vi.mock("../../../products/services/product.service", () => ({
  productService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

vi.mock("../../../customers/services/customer.service", () => ({
  customerService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
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

const clienteFake: Customer = {
  id: 1,
  name: "Cliente Ativo",
  email: "cliente@teste.local",
  phone: "51999999999",
  document: "12345678900",
  active: true,
  createdAt: "2026-01-01T10:00:00",
};

async function preencherVenda(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText("Cliente"));
  await user.click(await screen.findByRole("option", { name: "Cliente Ativo" }));

  await user.click(screen.getByLabelText("Produto"));
  await user.click(await screen.findByRole("option", { name: "Mouse Gamer" }));

  await user.type(screen.getByLabelText("Qtd"), "2");
}

describe("SaleFormDialog", () => {
  beforeEach(() => {
    vi.mocked(productService.getAll).mockResolvedValue([produtoFake]);
    vi.mocked(customerService.getAll).mockResolvedValue([clienteFake]);
  });

  it("deve exibir mensagens de validação e não enviar, quando campos obrigatórios estão vazios", async () => {
    const user = userEvent.setup();
    const onError = vi.fn();

    render(<SaleFormDialog open onClose={vi.fn()} onSuccess={vi.fn()} onError={onError} />);

    await user.click(screen.getByRole("button", { name: /registrar venda/i }));

    expect(await screen.findByText("Selecione um cliente.")).toBeInTheDocument();
    expect(screen.getByText("Selecione um produto.")).toBeInTheDocument();
    expect(screen.getByText("Informe a quantidade.")).toBeInTheDocument();
    expect(saleService.create).not.toHaveBeenCalled();
  });

  it("deve enviar o payload correto e avisar sucesso, quando o formulário é válido", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    const vendaCriada = {
      id: 1,
      customerId: 1,
      customerName: "Cliente Ativo",
      total: 40,
      createdBy: "user@teste.local",
      createdAt: "2026-01-01T10:00:00",
      items: [
        { productId: 1, productName: "Mouse Gamer", quantity: 2, unitPrice: 20, subtotal: 40 },
      ],
    };

    vi.mocked(saleService.create).mockResolvedValue(vendaCriada);

    render(<SaleFormDialog open onClose={onClose} onSuccess={onSuccess} onError={vi.fn()} />);

    await preencherVenda(user);

    await user.click(screen.getByRole("button", { name: /registrar venda/i }));

    // O TanStack Query v5 chama a mutationFn com um segundo argumento
    // interno (contexto de metadata) — comparamos só o payload real (o
    // primeiro argumento), sem acoplar ao detalhe interno da lib.
    await waitFor(() => expect(saleService.create).toHaveBeenCalled());

    expect(vi.mocked(saleService.create).mock.calls[0]?.[0]).toEqual({
      customerId: 1,
      items: [{ productId: 1, quantity: 2 }],
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("deve repassar a mensagem de erro do backend, quando a criação falha por estoque insuficiente", async () => {
    const user = userEvent.setup();
    const onError = vi.fn();

    vi.mocked(saleService.create).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: { message: "Estoque insuficiente para o produto: Mouse Gamer" },
      },
    });

    render(<SaleFormDialog open onClose={vi.fn()} onSuccess={vi.fn()} onError={onError} />);

    await preencherVenda(user);

    await user.click(screen.getByRole("button", { name: /registrar venda/i }));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Estoque insuficiente para o produto: Mouse Gamer")
    );
  });
});
