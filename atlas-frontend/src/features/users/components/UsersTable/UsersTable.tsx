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
import { Pencil, Trash2 } from "lucide-react";

import type { User } from "../../types/user.types";

interface UsersTableProps {
  users: User[];
  /** Chamado ao clicar em editar. Se ausente, o botão Editar não é renderizado. */
  onEdit?: (user: User) => void;
  /** Chamado ao clicar em excluir. Se ausente, o botão Excluir não é renderizado. */
  onDelete?: (user: User) => void;
}

/**
 * Componente de apresentação puro: recebe os usuários prontos via prop, não
 * busca dados nem calcula nada além de formatação de exibição. Toda a
 * página /users já é ADMIN-only (rota + backend), então as ações não têm
 * um segundo nível de RBAC como em Produtos/Categorias.
 */
export function UsersTable({ users, onEdit, onDelete }: UsersTableProps) {
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
            <TableCell>E-mail</TableCell>
            {(onEdit || onDelete) && (
              <TableCell align="right">Ações</TableCell>
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              {(onEdit || onDelete) && (
                <TableCell align="right">
                  {onEdit && (
                    <IconButton
                      aria-label={`Editar ${user.name}`}
                      size="small"
                      onClick={() => onEdit(user)}
                    >
                      <Pencil size={18} />
                    </IconButton>
                  )}

                  {onDelete && (
                    <IconButton
                      aria-label={`Excluir ${user.name}`}
                      size="small"
                      color="error"
                      onClick={() => onDelete(user)}
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
