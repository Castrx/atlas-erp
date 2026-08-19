import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { XCircle } from "lucide-react";

import type { Sale } from "../../types/sale.types";

interface SalesTableProps {
  sales: Sale[];
  /** Chamado ao cancelar uma venda. Se ausente, o botão Cancelar não é renderizado. */
  onCancel?: (sale: Sale) => void;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/**
 * Componente de apresentação puro: recebe as vendas prontas via prop, não
 * busca dados nem calcula nada além de formatação de exibição. Cancelar é
 * repassado por callback — quem decide exibi-lo é a página (ADMIN-only).
 * O GET /sales do backend já retorna apenas vendas ativas.
 */
export function SalesTable({ sales, onCancel }: SalesTableProps) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Venda</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell align="center">Itens</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell>Data</TableCell>
            {onCancel && (
              <TableCell align="right">Ações</TableCell>
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell>#{sale.id}</TableCell>
              <TableCell>{sale.customerName}</TableCell>
              <TableCell align="center">{sale.items.length}</TableCell>
              <TableCell align="right">
                {currencyFormatter.format(sale.total)}
              </TableCell>
              <TableCell>{dateFormatter.format(new Date(sale.createdAt))}</TableCell>
              {onCancel && (
                <TableCell align="right">
                  <IconButton
                    aria-label={`Cancelar venda ${sale.id}`}
                    size="small"
                    color="error"
                    onClick={() => onCancel(sale)}
                  >
                    <XCircle size={18} />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
