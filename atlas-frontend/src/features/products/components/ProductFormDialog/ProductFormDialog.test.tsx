import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";

import { render } from "../../../../test/test-utils";
import { ProductFormDialog } from "./ProductFormDialog";
import { categoryService } from "../../services/category.service";
import { productService } from "../../services/product.service";
import type { Product } from "../../types/product.types";
import type { Category } from "../../types/category.types";

// Mocka a fronteira HTTP (os services) em vez dos hooks — o teste continua
// exercitando o TanStack Query e o React Hook Form + Zod de verdade,
// só sem bater na API real.
vi.mock("../../services/category.service", () => ({
  categoryService: { getAll: vi.fn() },
}));

vi.mock("../../services/product.service", () => ({
  productService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const categoriaFake: Category = {
  id: 1,
  name: "Periféricos",
  description: null,
  active: true,
};

const categoriaInativaFake: Category = {
  id: 2,
  name: "Linha Descontinuada",
  description: null,
  active: false,
};

const produtoExistente: Product = {
  id: 7,
  name: "Teclado Mecânico",
  description: "Switch azul",
  sku: "TEC-002",
  barcode: null,
  costPrice: 120,
  salePrice: 220,
  stock: 3,
  minimumStock: 1,
  active: true,
  categoryId: 1,
  categoryName: "Periféricos",
};

async function preencherCamposObrigatorios(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nome"), "Mouse Gamer");
  await user.type(screen.getByLabelText("SKU"), "MOUSE-001");
  await user.type(screen.getByLabelText("Preço de custo"), "10");
  await user.type(screen.getByLabelText("Preço de venda"), "20");

  await user.click(screen.getByLabelText("Categoria"));
  await user.click(await screen.findByRole("option", { name: "Periféricos" }));
}

describe("ProductFormDialog", () => {
  beforeEach(() => {
    vi.mocked(categoryService.getAll).mockResolvedValue([categoriaFake]);
  });

  it("não deve listar categorias inativas no seletor de categoria", async () => {
    const user = userEvent.setup();

    vi.mocked(categoryService.getAll).mockResolvedValue([categoriaFake, categoriaInativaFake]);

    render(
      <ProductFormDialog open onClose={vi.fn()} onSuccess={vi.fn()} onError={vi.fn()} />
    );

    await user.click(screen.getByLabelText("Categoria"));

    expect(await screen.findByRole("option", { name: "Periféricos" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Linha Descontinuada" })
    ).not.toBeInTheDocument();
  });

  it("deve exibir mensagens de validação e não enviar, quando campos obrigatórios estão vazios", async () => {
    const user = userEvent.setup();
    const onError = vi.fn();

    render(
      <ProductFormDialog open onClose={vi.fn()} onSuccess={vi.fn()} onError={onError} />
    );

    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText("O nome é obrigatório.")).toBeInTheDocument();
    expect(screen.getByText("O SKU é obrigatório.")).toBeInTheDocument();
    expect(productService.create).not.toHaveBeenCalled();
  });

  it("deve enviar o payload correto e avisar sucesso, quando o formulário é válido", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    const produtoCriado: Product = {
      id: 1,
      name: "Mouse Gamer",
      description: null,
      sku: "MOUSE-001",
      barcode: null,
      costPrice: 10,
      salePrice: 20,
      stock: 0,
      minimumStock: 0,
      active: true,
      categoryId: 1,
      categoryName: "Periféricos",
    };

    vi.mocked(productService.create).mockResolvedValue(produtoCriado);

    render(
      <ProductFormDialog open onClose={onClose} onSuccess={onSuccess} onError={vi.fn()} />
    );

    await preencherCamposObrigatorios(user);

    await user.click(screen.getByRole("button", { name: /salvar/i }));

    // O TanStack Query v5 chama a mutationFn com um segundo argumento
    // interno (contexto de metadata) — comparamos só o payload real (o
    // primeiro argumento), sem acoplar ao detalhe interno da lib.
    await waitFor(() => expect(productService.create).toHaveBeenCalled());

    expect(vi.mocked(productService.create).mock.calls[0]?.[0]).toEqual({
      name: "Mouse Gamer",
      description: undefined,
      sku: "MOUSE-001",
      barcode: undefined,
      costPrice: 10,
      salePrice: 20,
      stock: undefined,
      minimumStock: undefined,
      categoryId: 1,
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("deve repassar a mensagem de erro do backend, quando a criação falha por regra de negócio", async () => {
    const user = userEvent.setup();
    const onError = vi.fn();

    vi.mocked(productService.create).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Já existe um produto com este SKU." } },
    });

    render(
      <ProductFormDialog open onClose={vi.fn()} onSuccess={vi.fn()} onError={onError} />
    );

    await preencherCamposObrigatorios(user);

    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Já existe um produto com este SKU.")
    );
  });

  it("deve pré-preencher o formulário e enviar o payload de update, quando em modo edição", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    const produtoAtualizado: Product = { ...produtoExistente, salePrice: 240 };

    vi.mocked(productService.update).mockResolvedValue(produtoAtualizado);

    render(
      <ProductFormDialog
        open
        product={produtoExistente}
        onClose={onClose}
        onSuccess={onSuccess}
        onError={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Editar Produto" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Teclado Mecânico");
    expect(screen.getByLabelText("SKU")).toHaveValue("TEC-002");
    expect(screen.getByLabelText("Preço de venda")).toHaveValue("220");

    // M4: no modo edição o estoque fica desabilitado (imutável no PUT) e mostra
    // o estoque atual.
    expect(screen.getByLabelText("Estoque inicial")).toBeDisabled();
    expect(screen.getByLabelText("Estoque inicial")).toHaveValue("3");

    await user.clear(screen.getByLabelText("Preço de venda"));
    await user.type(screen.getByLabelText("Preço de venda"), "240");

    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(productService.update).toHaveBeenCalled());

    expect(vi.mocked(productService.update).mock.calls[0]?.[0]).toBe(7);
    expect(vi.mocked(productService.update).mock.calls[0]?.[1]).toEqual({
      name: "Teclado Mecânico",
      description: "Switch azul",
      sku: "TEC-002",
      barcode: undefined,
      costPrice: 120,
      salePrice: 240,
      stock: undefined,
      minimumStock: 1,
      categoryId: 1,
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
