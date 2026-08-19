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

import type { MovementType, StockMovement } from "../../types/stock.types";

interface StockHistoryTableProps {
  movements: StockMovement[];
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const MOVEMENT_LABEL: Record<MovementType, string> = {
  ENTRY: "Entrada",
  EXIT: "Saída",
  ADJUSTMENT: "Ajuste",
};

/**
 * Componente de apresentação puro: recebe as movimentações prontas via
 * prop, não busca dados nem calcula nada além da formatação de exibição.
 */
export function StockHistoryTable({ movements }: StockHistoryTableProps) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Produto</TableCell>
            <TableCell align="center">Tipo</TableCell>
            <TableCell align="right">Quantidade</TableCell>
            <TableCell>Motivo</TableCell>
            <TableCell>Responsável</TableCell>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {movements.map((movement) => {
            const isExit = movement.type === "EXIT";

            return (
              <TableRow key={movement.id}>
                <TableCell>{movement.productName}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={MOVEMENT_LABEL[movement.type]}
                    size="small"
                    color={isExit ? "error" : "success"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">{movement.quantity}</TableCell>
                <TableCell>{movement.reason}</TableCell>
                <TableCell>{movement.createdBy}</TableCell>
                <TableCell>
                  {dateFormatter.format(new Date(movement.createdAt))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
