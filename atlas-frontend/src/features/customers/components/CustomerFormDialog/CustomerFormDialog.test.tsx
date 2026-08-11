import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";

import { render } from "../../../../test/test-utils";
import { CustomerFormDialog } from "./CustomerFormDialog";
import { customerService } from "../../services/customer.service";
import type { Customer } from "../../types/customer.types";

// Mocka a fronteira HTTP (o service) em vez do hook — o teste continua
// exercitando o TanStack Query e o React Hook Form + Zod de verdade, só
// sem bater na API real.
vi.mock("../../services/customer.service", () => ({
  customerService: { getAll: vi.fn(), create: vi.fn() },
}));

describe("CustomerFormDialog", () => {
  it("deve exibir mensagens de validação e não enviar, quando campos obrigatórios estão vazios", async () => {
    const user = userEvent.setup();

    render(<CustomerFormDialog open onClose={vi.fn()} onSuccess={vi.fn()} onError={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText("O nome é obrigatório.")).toBeInTheDocument();
    expect(screen.getByText("O documento é obrigatório.")).toBeInTheDocument();
    expect(customerService.create).not.toHaveBeenCalled();
  });

  it("deve exibir mensagem de validação, quando o e-mail tem formato inválido", async () => {
    const user = userEvent.setup();

    render(<CustomerFormDialog open onClose={vi.fn()} onSuccess={vi.fn()} onError={vi.fn()} />);

    await user.type(screen.getByLabelText("Nome"), "Cliente Teste");
    await user.type(screen.getByLabelText("Documento (CPF/CNPJ)"), "12345678900");
    await user.type(screen.getByLabelText("E-mail"), "email-invalido");

    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText("E-mail inválido.")).toBeInTheDocument();
    expect(customerService.create).not.toHaveBeenCalled();
  });

  it("deve enviar o payload correto e avisar sucesso, quando o formulário é válido", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    const clienteCriado: Customer = {
      id: 1,
      name: "Cliente Teste",
      email: "cliente@teste.local",
      phone: "51999999999",
      document: "12345678900",
      active: true,
      createdAt: "2026-01-01T10:00:00",
    };

    vi.mocked(customerService.create).mockResolvedValue(clienteCriado);

    render(
      <CustomerFormDialog open onClose={onClose} onSuccess={onSuccess} onError={vi.fn()} />
    );

    await user.type(screen.getByLabelText("Nome"), "Cliente Teste");
    await user.type(screen.getByLabelText("Documento (CPF/CNPJ)"), "12345678900");
    await user.type(screen.getByLabelText("E-mail"), "cliente@teste.local");
    await user.type(screen.getByLabelText("Telefone"), "51999999999");

    await user.click(screen.getByRole("button", { name: /salvar/i }));

    // O TanStack Query v5 chama a mutationFn com um segundo argumento
    // interno (contexto de metadata) — comparamos só o payload real (o
    // primeiro argumento), sem acoplar ao detalhe interno da lib.
    await waitFor(() => expect(customerService.create).toHaveBeenCalled());

    expect(vi.mocked(customerService.create).mock.calls[0]?.[0]).toEqual({
      name: "Cliente Teste",
      email: "cliente@teste.local",
      phone: "51999999999",
      document: "12345678900",
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("deve repassar a mensagem de erro do backend, quando a criação falha por documento duplicado", async () => {
    const user = userEvent.setup();
    const onError = vi.fn();

    vi.mocked(customerService.create).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Já existe um cliente com este documento." } },
    });

    render(<CustomerFormDialog open onClose={vi.fn()} onSuccess={vi.fn()} onError={onError} />);

    await user.type(screen.getByLabelText("Nome"), "Cliente Duplicado");
    await user.type(screen.getByLabelText("Documento (CPF/CNPJ)"), "98765432100");

    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Já existe um cliente com este documento.")
    );
  });
});
