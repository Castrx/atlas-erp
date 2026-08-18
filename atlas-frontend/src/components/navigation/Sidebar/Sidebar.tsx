import { Box, Typography } from "@mui/material";

import { useAuth } from "../../../core/auth";
import { CompassMark } from "../../ui/CompassMark";
import { NavItem } from "../NavItem";
import { menu } from "../menu";

interface SidebarProps {
  /** Repassado a cada NavItem — fecha o Drawer mobile ao navegar (ver MainLayout). */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const { hasRole } = useAuth();

  // Reflexo de UX: item some do menu se o usuário não tiver o papel
  // exigido. A permissão real de cada ação continua sendo do backend.
  const visibleMenu = menu.filter(
    (item) => !item.requiredRole || hasRole(item.requiredRole)
  );

  return (
    <Box
      sx={{
        width: 260,
        height: "100vh",
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CompassMark size={18} />
        </Box>

        <Typography variant="h5">Atlas ERP</Typography>
      </Box>

      <Box
        sx={{
          mt: 2,
        }}
      >
        {visibleMenu.map((item) => (
          <NavItem
            key={item.label}
            label={item.label}
            icon={item.icon}
            path={item.path}
            onNavigate={onNavigate}
          />
        ))}
      </Box>
    </Box>
  );
}
