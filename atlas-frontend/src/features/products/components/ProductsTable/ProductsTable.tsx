import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import type { Product } from "../../types/product.types";

interface ProductsTableProps {
  products: Product[];
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Componente de apresentação puro: recebe os produtos prontos via prop,
 * não busca dados nem calcula nada além de formatação de exibição.
 */
export function ProductsTable({ products }: ProductsTableProps) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ borderRadius: 3, border: "1px solid #E5E7EB" }}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
