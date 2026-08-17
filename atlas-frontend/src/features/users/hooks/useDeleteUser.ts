import { useMutation, useQueryClient } from "@tanstack/react-query";

import { userService } from "../services/user.service";

/**
 * Mutation de exclusão de usuário. No backend a exclusão é física
 * (hard delete); ao concluir, invalida ["users"].
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
