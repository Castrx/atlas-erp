import { useMutation, useQueryClient } from "@tanstack/react-query";

import { customerService } from "../services/customer.service";
import type { CreateCustomerInput } from "../types/customer.types";

interface UseUpdateCustomerInput {
  id: number;
  data: CreateCustomerInput;
}

/**
 * Mutation de atualização de cliente. Ao atualizar com sucesso, invalida
 * ["customers"] — a listagem refaz o fetch sozinho (mesmo padrão do create).
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UseUpdateCustomerInput) =>
      customerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
