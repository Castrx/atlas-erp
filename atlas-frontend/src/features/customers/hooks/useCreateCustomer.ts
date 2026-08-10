import { useMutation, useQueryClient } from "@tanstack/react-query";

import { customerService } from "../services/customer.service";

/**
 * Mutation de criação de cliente. Toda a lógica de cache mora aqui: ao
 * criar com sucesso, invalida ["customers"] — o useCustomers() da listagem
 * refaz o fetch sozinho, sem nenhuma chamada manual na página.
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
