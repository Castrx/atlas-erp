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

import type { Customer } from "../../types/customer.types";

interface CustomersTableProps {
  customers: Customer[];
}

/**
 * Componente de apresentação puro: recebe os clientes prontos via prop,
 * não busca dados nem calcula nada além de formatação de exibição.
 */
export function CustomersTable({ customers }: CustomersTableProps) {
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
            <TableCell>Documento</TableCell>
            <TableCell>E-mail</TableCell>
            <TableCell>Telefone</TableCell>
            <TableCell align="center">Status</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.document}</TableCell>
              <TableCell>{customer.email || "—"}</TableCell>
              <TableCell>{customer.phone || "—"}</TableCell>
              <TableCell align="center">
                <Chip
                  label={customer.active ? "Ativo" : "Inativo"}
                  size="small"
                  color={customer.active ? "success" : "default"}
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
