import { useMutation, useQueryClient } from "@tanstack/react-query";

import { companyService } from "../services/company.service";

/**
 * Mutation de exclusão de empresa. No backend a exclusão é física
 * (hard delete); ao concluir, invalida ["companies"].
 */
export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => companyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}
