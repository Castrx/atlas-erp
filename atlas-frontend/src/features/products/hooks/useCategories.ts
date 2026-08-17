import { useQuery } from "@tanstack/react-query";

import { categoryService } from "../services/category.service";

/**
 * O serviço (`../services/category.service`) reexporta a implementação
 * canônica de features/categories — nenhuma chamada de API duplicada aqui,
 * só este wrapper de useQuery local (mesma query key ["categories"] usada
 * pela tela própria de Categorias, então uma mutação lá invalida este
 * seletor também).
 */
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getAll,
  });
}
