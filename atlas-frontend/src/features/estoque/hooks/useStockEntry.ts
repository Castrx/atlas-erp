import { useMutation, useQueryClient } from "@tanstack/react-query";

import { stockService } from "../services/stock.service";

/**
 * Mutation de entrada de estoque. Além do histórico, a entrada altera o
 * estoque do produto e o baixo estoque do dashboard — invalida os três
 * caches para a UI inteira refletir o novo estado.
 */
export function useStockEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: stockService.entry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-history"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
