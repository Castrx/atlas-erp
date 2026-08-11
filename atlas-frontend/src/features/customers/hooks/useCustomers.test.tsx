import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { createQueryWrapper } from "../../../test/test-utils";
import { useCustomers } from "./useCustomers";
import { customerService } from "../services/customer.service";
import type { Customer } from "../types/customer.types";

vi.mock("../services/customer.service", () => ({
  customerService: { getAll: vi.fn(), create: vi.fn() },
}));

const clienteFake: Customer = {
  id: 1,
  name: "Cliente Teste",
  email: "cliente@teste.local",
  phone: "51999999999",
  document: "12345678900",
  active: true,
  createdAt: "2026-01-01T10:00:00",
};

describe("useCustomers", () => {
  it("deve retornar a lista de clientes, quando a requisição tem sucesso", async () => {
    vi.mocked(customerService.getAll).mockResolvedValue([clienteFake]);

    const { result } = renderHook(() => useCustomers(), { wrapper: createQueryWrapper() });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([clienteFake]);
  });

  it("deve refletir o estado de erro, quando a requisição falha", async () => {
    vi.mocked(customerService.getAll).mockRejectedValue(new Error("Falha de rede"));

    const { result } = renderHook(() => useCustomers(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
  });
});
