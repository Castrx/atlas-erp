import {
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Pencil, Trash2 } from "lucide-react";

import type { Category } from "../../types/category.types";

interface CategoriesTableProps {
  categories: Category[];
  /** Chamado ao clicar em editar. Se ausente, o botão Editar não é renderizado. */
  onEdit?: (category: Category) => void;
  /**
   * Chamado ao clicar em inativar (exclusão no backend é inativação —
   * active=false, não remoção física). Se ausente, o botão não é renderizado.
   */
  onDelete?: (category: Category) => void;
}

/**
 * Componente de apresentação puro: recebe as categorias prontas via prop,
 * não busca dados nem calcula nada além de formatação de exibição. As ações
 * são repassadas por callback — quem decide exibi-las é a página (aqui,
 * editar e excluir só aparecem para ADMIN, pois escrita de categoria é
 * ADMIN-only no backend).
 */
export function CategoriesTable({ categories, onEdit, onDelete }: CategoriesTableProps) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Descrição</TableCell>
            <TableCell align="center">Status</TableCell>
            {(onEdit || onDelete) && (
              <TableCell align="right">Ações</TableCell>
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>{category.name}</TableCell>
              <TableCell>{category.description || "—"}</TableCell>
              <TableCell align="center">
                <Chip
                  label={category.active ? "Ativa" : "Inativa"}
                  size="small"
                  color={category.active ? "success" : "default"}
                  variant="outlined"
                />
              </TableCell>
              {(onEdit || onDelete) && (
                <TableCell align="right">
                  {onEdit && (
                    <IconButton
                      aria-label={`Editar ${category.name}`}
                      size="small"
                      onClick={() => onEdit(category)}
                    >
                      <Pencil size={18} />
                    </IconButton>
                  )}

                  {onDelete && (
                    <IconButton
                      aria-label={`Inativar ${category.name}`}
                      size="small"
                      color="error"
                      onClick={() => onDelete(category)}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
