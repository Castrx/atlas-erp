import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";

import { render } from "../../../test/test-utils";
import { AuthContext } from "../../../core/auth/useAuth";
import type { AuthContextValue } from "../../../core/auth/useAuth";
import { ProductsPage } from "./ProductsPage";
import { productService } from "../services/product.service";
import { categoryService } from "../services/category.service";
import type { Product } from "../types/product.types";
import type { Category } from "../types/category.types";

vi.mock("../services/product.service", () => ({
  productService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

vi.mock("../services/category.service", () => ({
  categoryService: { getAll: vi.fn() },
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

const categoriaFake: Category = {
  id: 1,
  name: "Periféricos",
  description: null,
  active: true,
};

/** Renderiza a página dentro de um AuthContext com os papéis informados. */
function renderAs(roles: string[], ui: ReactNode = <ProductsPage />) {
  const authValue: AuthContextValue = {
    isAuthenticated: true,
    roles,
    hasRole: (role) => roles.includes(role),
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(<AuthContext.Provider value={authValue}>{ui}</AuthContext.Provider>);
}

describe("ProductsPage", () => {
  beforeEach(() => {
    vi.mocked(productService.getAll).mockResolvedValue([produtoFake]);
    vi.mocked(categoryService.getAll).mockResolvedValue([categoriaFake]);
  });

  it("deve ocultar o botão Excluir para usuário USER, mantendo o Editar", async () => {
    renderAs(["USER"]);

    expect(await screen.findByText("Mouse Gamer")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Editar Mouse Gamer" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Excluir Mouse Gamer" })
    ).not.toBeInTheDocument();
  });

  it("deve exibir o botão Excluir para usuário ADMIN", async () => {
    renderAs(["ADMIN"]);

    expect(await screen.findByText("Mouse Gamer")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Excluir Mouse Gamer" })).toBeInTheDocument();
  });

  it("deve excluir o produto após a confirmação", async () => {
    const user = userEvent.setup();
    vi.mocked(productService.delete).mockResolvedValue(undefined);

    renderAs(["ADMIN"]);

    await screen.findByText("Mouse Gamer");
    await user.click(screen.getByRole("button", { name: "Excluir Mouse Gamer" }));

    expect(screen.getByRole("heading", { name: "Excluir produto" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(productService.delete).toHaveBeenCalledWith(1));
    expect(await screen.findByText("Produto excluído com sucesso.")).toBeInTheDocument();
  });

  it("deve abrir o diálogo em modo edição com os dados pré-preenchidos", async () => {
    const user = userEvent.setup();

    renderAs(["ADMIN"]);

    await screen.findByText("Mouse Gamer");
    await user.click(screen.getByRole("button", { name: "Editar Mouse Gamer" }));

    expect(screen.getByRole("heading", { name: "Editar Produto" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Mouse Gamer");
  });
});
