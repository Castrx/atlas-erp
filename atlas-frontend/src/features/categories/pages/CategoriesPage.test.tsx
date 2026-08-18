import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";

import { render } from "../../../test/test-utils";
import { AuthContext } from "../../../core/auth/useAuth";
import type { AuthContextValue } from "../../../core/auth/useAuth";
import { CategoriesPage } from "./CategoriesPage";
import { categoryService } from "../services/category.service";
import type { Category } from "../types/category.types";

vi.mock("../services/category.service", () => ({
  categoryService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const categoriaFake: Category = {
  id: 1,
  name: "Periféricos",
  description: "Mouses, teclados e afins",
  active: true,
};

const categoriaInativaFake: Category = {
  id: 2,
  name: "Linha Descontinuada",
  description: null,
  active: false,
};

/** Renderiza a página dentro de um AuthContext com os papéis informados. */
function renderAs(roles: string[], ui: ReactNode = <CategoriesPage />) {
  const authValue: AuthContextValue = {
    isAuthenticated: true,
    roles,
    hasRole: (role) => roles.includes(role),
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(<AuthContext.Provider value={authValue}>{ui}</AuthContext.Provider>);
}

describe("CategoriesPage", () => {
  beforeEach(() => {
    vi.mocked(categoryService.getAll).mockResolvedValue([categoriaFake]);
  });

  it("deve ocultar as ações de escrita para usuário USER", async () => {
    renderAs(["USER"]);

    expect(await screen.findByText("Periféricos")).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Nova Categoria" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar Periféricos" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Inativar Periféricos" })).not.toBeInTheDocument();
  });

  it("deve exibir as ações de escrita para usuário ADMIN", async () => {
    renderAs(["ADMIN"]);

    expect(await screen.findByText("Periféricos")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Nova Categoria" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar Periféricos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inativar Periféricos" })).toBeInTheDocument();
  });

  it("deve inativar a categoria após a confirmação", async () => {
    const user = userEvent.setup();
    vi.mocked(categoryService.delete).mockResolvedValue(undefined);

    renderAs(["ADMIN"]);

    await screen.findByText("Periféricos");
    await user.click(screen.getByRole("button", { name: "Inativar Periféricos" }));

    expect(screen.getByRole("heading", { name: "Inativar categoria" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Inativar" }));

    await waitFor(() => expect(categoryService.delete).toHaveBeenCalledWith(1));
    expect(await screen.findByText("Categoria inativada com sucesso.")).toBeInTheDocument();
  });

  it("não deve listar categorias inativas (exclusão no backend é inativação)", async () => {
    vi.mocked(categoryService.getAll).mockResolvedValue([categoriaFake, categoriaInativaFake]);

    renderAs(["ADMIN"]);

    expect(await screen.findByText("Periféricos")).toBeInTheDocument();
    expect(screen.queryByText("Linha Descontinuada")).not.toBeInTheDocument();
  });

  it("deve abrir o diálogo em modo edição com os dados pré-preenchidos", async () => {
    const user = userEvent.setup();

    renderAs(["ADMIN"]);

    await screen.findByText("Periféricos");
    await user.click(screen.getByRole("button", { name: "Editar Periféricos" }));

    expect(screen.getByRole("heading", { name: "Editar Categoria" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Periféricos");
  });
});
