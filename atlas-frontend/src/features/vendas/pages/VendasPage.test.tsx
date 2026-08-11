import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";

import { render } from "../../../test/test-utils";
import { AuthContext } from "../../../core/auth/useAuth";
import type { AuthContextValue } from "../../../core/auth/useAuth";
import { VendasPage } from "./VendasPage";
import { saleService } from "../services/sale.service";
import { productService } from "../../products/services/product.service";
import { customerService } from "../../customers/services/customer.service";
import type { Sale } from "../types/sale.types";
import type { Product } from "../../products/types/product.types";
import type { Customer } from "../../customers/types/customer.types";

vi.mock("../services/sale.service", () => ({
  saleService: { getAll: vi.fn(), create: vi.fn(), cancel: vi.fn() },
}));

vi.mock("../../products/services/product.service", () => ({
  productService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

vi.mock("../../customers/services/customer.service", () => ({
  customerService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const vendaFake: Sale = {
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

/** Renderiza a página dentro de um AuthContext com os papéis informados. */
function renderAs(roles: string[], ui: ReactNode = <VendasPage />) {
  const authValue: AuthContextValue = {
    isAuthenticated: true,
    roles,
    hasRole: (role) => roles.includes(role),
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(<AuthContext.Provider value={authValue}>{ui}</AuthContext.Provider>);
}

describe("VendasPage", () => {
  beforeEach(() => {
    vi.mocked(saleService.getAll).mockResolvedValue([vendaFake]);
    vi.mocked(productService.getAll).mockResolvedValue([produtoFake]);
    vi.mocked(customerService.getAll).mockResolvedValue([clienteFake]);
  });

  it("deve ocultar o botão Cancelar para usuário USER, mantendo a listagem", async () => {
    renderAs(["USER"]);

    expect(await screen.findByText("Cliente Ativo")).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Cancelar venda 1" })).not.toBeInTheDocument();
  });

  it("deve exibir o botão Cancelar para usuário ADMIN", async () => {
    renderAs(["ADMIN"]);

    expect(await screen.findByText("Cliente Ativo")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Cancelar venda 1" })).toBeInTheDocument();
  });

  it("deve cancelar a venda após a confirmação", async () => {
    const user = userEvent.setup();
    vi.mocked(saleService.cancel).mockResolvedValue(undefined);

    renderAs(["ADMIN"]);

    await screen.findByText("Cliente Ativo");
    await user.click(screen.getByRole("button", { name: "Cancelar venda 1" }));

    expect(screen.getByRole("heading", { name: "Cancelar venda" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar venda" }));

    await waitFor(() => expect(saleService.cancel).toHaveBeenCalledWith(1));
    expect(await screen.findByText("Venda cancelada com sucesso.")).toBeInTheDocument();
  });
});
