import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saleService } from "../services/sale.service";

/**
 * Mutation de cancelamento de venda (ADMIN-only no backend). O cancelamento
 * restaura o estoque e reduz a receita do dashboard — invalida sales,
 * products e dashboard juntos.
 */
export function useCancelSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => saleService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
