import { useQuery } from "@tanstack/react-query";

import { stockService } from "../services/stock.service";

/**
 * Histórico paginado de movimentações. A página e o tamanho fazem parte da
 * queryKey — trocar de página gera uma nova chave e o TanStack Query trata
 * o cache/refetch sozinho.
 */
export function useStockHistory(page: number, size = 10) {
  return useQuery({
    queryKey: ["stock-history", page, size],
    queryFn: () => stockService.history(page, size),
  });
}
