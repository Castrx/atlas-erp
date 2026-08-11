import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";

import { render } from "../../../test/test-utils";
import { AuthContext } from "../../../core/auth/useAuth";
import type { AuthContextValue } from "../../../core/auth/useAuth";
import { CustomersPage } from "./CustomersPage";
import { customerService } from "../services/customer.service";
import type { Customer } from "../types/customer.types";

vi.mock("../services/customer.service", () => ({
  customerService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const clienteAtivo: Customer = {
  id: 1,
  name: "Cliente Ativo",
  email: "ativo@teste.local",
  phone: "51999999999",
  document: "12345678900",
  active: true,
  createdAt: "2026-01-01T10:00:00",
};

const clienteInativo: Customer = {
  id: 2,
  name: "Cliente Inativo",
  email: "inativo@teste.local",
  phone: null,
  document: "98765432100",
  active: false,
  createdAt: "2026-01-02T10:00:00",
};

/** Renderiza a página dentro de um AuthContext com os papéis informados. */
function renderAs(roles: string[], ui: ReactNode = <CustomersPage />) {
  const authValue: AuthContextValue = {
    isAuthenticated: true,
    roles,
    hasRole: (role) => roles.includes(role),
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(<AuthContext.Provider value={authValue}>{ui}</AuthContext.Provider>);
}

describe("CustomersPage", () => {
  beforeEach(() => {
    vi.mocked(customerService.getAll).mockResolvedValue([clienteAtivo]);
  });

  it("deve ocultar o botão Excluir para usuário USER, mantendo o Editar", async () => {
    renderAs(["USER"]);

    expect(await screen.findByText("Cliente Ativo")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Editar Cliente Ativo" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Excluir Cliente Ativo" })
    ).not.toBeInTheDocument();
  });

  it("deve exibir o botão Excluir para usuário ADMIN", async () => {
    renderAs(["ADMIN"]);

    expect(await screen.findByText("Cliente Ativo")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Excluir Cliente Ativo" })).toBeInTheDocument();
  });

  it("deve excluir o cliente após a confirmação", async () => {
    const user = userEvent.setup();
    vi.mocked(customerService.delete).mockResolvedValue(undefined);

    renderAs(["ADMIN"]);

    await screen.findByText("Cliente Ativo");
    await user.click(screen.getByRole("button", { name: "Excluir Cliente Ativo" }));

    expect(screen.getByRole("heading", { name: "Excluir cliente" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(customerService.delete).toHaveBeenCalledWith(1));
    expect(await screen.findByText("Cliente excluído com sucesso.")).toBeInTheDocument();
  });

  it("deve listar e contar apenas clientes ativos, ignorando os inativos", async () => {
    vi.mocked(customerService.getAll).mockResolvedValue([clienteAtivo, clienteInativo]);

    renderAs(["ADMIN"]);

    expect(await screen.findByText("Cliente Ativo")).toBeInTheDocument();
    expect(screen.queryByText("Cliente Inativo")).not.toBeInTheDocument();

    // O métrico "Total de clientes" conta só os ativos (1), não os 2 do backend.
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
