import { useMutation, useQueryClient } from "@tanstack/react-query";

import { stockService } from "../services/stock.service";

/**
 * Mutation de saída de estoque. O backend valida o estoque disponível e
 * responde "Estoque insuficiente." se a quantidade exceder — a UI exibe
 * essa mensagem no ponto de uso. Invalida histórico, produtos e dashboard.
 */
export function useStockExit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: stockService.exit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-history"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
