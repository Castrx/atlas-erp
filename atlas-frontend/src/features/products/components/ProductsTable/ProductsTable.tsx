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

import type { Product } from "../../types/product.types";

interface ProductsTableProps {
  products: Product[];
  /** Chamado ao clicar em editar. Se ausente, o botão Editar não é renderizado. */
  onEdit?: (product: Product) => void;
  /**
   * Chamado ao clicar em inativar (exclusão no backend é inativação —
   * active=false, não remoção física). Se ausente, o botão não é renderizado.
   */
  onDelete?: (product: Product) => void;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Componente de apresentação puro: recebe os produtos prontos via prop,
 * não busca dados nem calcula nada além de formatação de exibição. As ações
 * são repassadas por callback — quem decide exibi-las é a página (ex.: o
 * botão Excluir só aparece para ADMIN).
 */
export function ProductsTable({ products, onEdit, onDelete }: ProductsTableProps) {
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
            <TableCell>SKU</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell align="right">Preço</TableCell>
            <TableCell align="right">Estoque</TableCell>
            <TableCell align="center">Status</TableCell>
            {(onEdit || onDelete) && (
              <TableCell align="right">Ações</TableCell>
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.categoryName}</TableCell>
              <TableCell align="right">
                {currencyFormatter.format(product.salePrice)}
              </TableCell>
              <TableCell align="right">{product.stock}</TableCell>
              <TableCell align="center">
                <Chip
                  label={product.active ? "Ativo" : "Inativo"}
                  size="small"
                  color={product.active ? "success" : "default"}
                  variant="outlined"
                />
              </TableCell>
              {(onEdit || onDelete) && (
                <TableCell align="right">
                  {onEdit && (
                    <IconButton
                      aria-label={`Editar ${product.name}`}
                      size="small"
                      onClick={() => onEdit(product)}
                    >
                      <Pencil size={18} />
                    </IconButton>
                  )}

                  {onDelete && (
                    <IconButton
                      aria-label={`Inativar ${product.name}`}
                      size="small"
                      color="error"
                      onClick={() => onDelete(product)}
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
