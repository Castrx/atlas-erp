import { useMutation, useQueryClient } from "@tanstack/react-query";

import { customerService } from "../services/customer.service";

/**
 * Mutation de exclusão de cliente. No backend a exclusão é uma inativação
 * (active = false); ao concluir, invalida ["customers"] e a listagem refaz
 * o fetch, filtrando os inativos.
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => customerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
