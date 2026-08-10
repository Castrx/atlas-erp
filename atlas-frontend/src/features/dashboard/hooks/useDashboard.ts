import { useQuery } from "@tanstack/react-query";

import { dashboardService } from "../services";

/**
 * Única chamada de dados da tela — o backend já entrega o payload agregado
 * e pronto para exibição; nenhum cálculo acontece aqui. `staleTime` herda o
 * default global (60s, ver core/providers/queryClient.ts).
 */
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.getDashboard,
  });
}
