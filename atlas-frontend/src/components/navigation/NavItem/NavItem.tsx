import { Box, Chip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { LucideIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

type NavItemProps = {
  label: string;
  icon: LucideIcon;
  path?: string;
  /**
   * Chamado depois de navegar (só quando `path` está presente). Usado pelo
   * MainLayout para fechar o Drawer mobile ao escolher uma rota — no
   * desktop (Sidebar fixa) fica undefined e não faz nada.
   */
  onNavigate?: () => void;
};

export function NavItem({ label, icon: Icon, path, onNavigate }: NavItemProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = path !== undefined && location.pathname === path;
  // Item sem rota (ex.: "Financeiro", "Relatórios", "Configurações") ainda
  // não tem página — não deve parecer clicável nem reagir a hover, e mostra
  // "Em breve" para deixar isso explícito (visual e para leitor de tela).
  const isComingSoon = path === undefined;

  function handleClick() {
    if (!path) {
      return;
    }

    navigate(path);
    onNavigate?.();
  }

  return (
    <Box
      onClick={path ? handleClick : undefined}
      aria-disabled={isComingSoon || undefined}
      aria-current={isActive ? "page" : undefined}
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 3,
        py: 1.5,
        cursor: isComingSoon ? "default" : "pointer",
        color: isActive
          ? "primary.main"
          : isComingSoon
            ? "text.disabled"
            : "text.primary",
        bgcolor: isActive ? alpha(theme.palette.primary.main, 0.1) : "transparent",
        boxShadow: isActive ? `inset 3px 0 0 0 ${theme.palette.primary.main}` : "none",
        transition: "0.2s",

        "&:hover": isComingSoon
          ? undefined
          : {
              backgroundColor: alpha(theme.palette.primary.main, isActive ? 0.14 : 0.06),
            },
      })}
    >
      <Icon size={20} />

      <Typography
        sx={{
          flex: 1,
          fontWeight: isActive ? 600 : 500,
        }}
      >
        {label}
      </Typography>

      {isComingSoon && (
        <Chip
          label="Em breve"
          size="small"
          variant="outlined"
          sx={{
            height: 20,
            fontSize: "0.6875rem",
            color: "text.disabled",
            borderColor: "divider",
          }}
        />
      )}
    </Box>
  );
}