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

import type { Customer } from "../../types/customer.types";

interface CustomersTableProps {
  customers: Customer[];
  /** Chamado ao clicar em editar. Se ausente, o botão Editar não é renderizado. */
  onEdit?: (customer: Customer) => void;
  /** Chamado ao clicar em excluir. Se ausente, o botão Excluir não é renderizado. */
  onDelete?: (customer: Customer) => void;
}

/**
 * Componente de apresentação puro: recebe os clientes prontos via prop,
 * não busca dados nem calcula nada além de formatação de exibição. As ações
 * são repassadas por callback — quem decide exibi-las é a página (ex.: o
 * botão Excluir só aparece para ADMIN).
 */
export function CustomersTable({ customers, onEdit, onDelete }: CustomersTableProps) {
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
            {(onEdit || onDelete) && (
              <TableCell align="right">Ações</TableCell>
            )}
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
              {(onEdit || onDelete) && (
                <TableCell align="right">
                  {onEdit && (
                    <IconButton
                      aria-label={`Editar ${customer.name}`}
                      size="small"
                      onClick={() => onEdit(customer)}
                    >
                      <Pencil size={18} />
                    </IconButton>
                  )}

                  {onDelete && (
                    <IconButton
                      aria-label={`Excluir ${customer.name}`}
                      size="small"
                      color="error"
                      onClick={() => onDelete(customer)}
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
