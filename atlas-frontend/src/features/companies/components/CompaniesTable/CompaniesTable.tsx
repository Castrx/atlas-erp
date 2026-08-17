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

import type { Company } from "../../types/company.types";

interface CompaniesTableProps {
  companies: Company[];
  /** Chamado ao clicar em editar. Se ausente, o botão Editar não é renderizado. */
  onEdit?: (company: Company) => void;
  /** Chamado ao clicar em excluir. Se ausente, o botão Excluir não é renderizado. */
  onDelete?: (company: Company) => void;
}

/**
 * Componente de apresentação puro: recebe as empresas prontas via prop, não
 * busca dados nem calcula nada além de formatação de exibição. Toda a
 * página /companies já é ADMIN-only (rota + backend), então as ações não
 * têm um segundo nível de RBAC.
 */
export function CompaniesTable({ companies, onEdit, onDelete }: CompaniesTableProps) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Razão social</TableCell>
            <TableCell>Nome fantasia</TableCell>
            <TableCell>CNPJ</TableCell>
            <TableCell>E-mail</TableCell>
            <TableCell align="center">Status</TableCell>
            {(onEdit || onDelete) && (
              <TableCell align="right">Ações</TableCell>
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell>{company.corporateName}</TableCell>
              <TableCell>{company.tradeName}</TableCell>
              <TableCell>{company.cnpj}</TableCell>
              <TableCell>{company.email || "—"}</TableCell>
              <TableCell align="center">
                <Chip
                  label={company.active ? "Ativa" : "Inativa"}
                  size="small"
                  color={company.active ? "success" : "default"}
                  variant="outlined"
                />
              </TableCell>
              {(onEdit || onDelete) && (
                <TableCell align="right">
                  {onEdit && (
                    <IconButton
                      aria-label={`Editar ${company.tradeName}`}
                      size="small"
                      onClick={() => onEdit(company)}
                    >
                      <Pencil size={18} />
                    </IconButton>
                  )}

                  {onDelete && (
                    <IconButton
                      aria-label={`Excluir ${company.tradeName}`}
                      size="small"
                      color="error"
                      onClick={() => onDelete(company)}
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
