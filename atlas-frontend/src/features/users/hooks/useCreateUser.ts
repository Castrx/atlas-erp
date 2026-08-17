import { useMutation, useQueryClient } from "@tanstack/react-query";

import { userService } from "../services/user.service";

/**
 * Mutation de criação de usuário. Ao criar com sucesso, invalida ["users"]
 * — a listagem refaz o fetch sozinha (mesmo padrão de Customers/Products).
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
