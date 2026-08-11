import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saleService } from "../services/sale.service";

/**
 * Mutation de criação de venda. Além da lista de vendas, a venda altera o
 * estoque dos produtos e a receita do dashboard — invalida os três caches
 * para a UI inteira refletir o novo estado sem chamadas manuais.
 */
export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
