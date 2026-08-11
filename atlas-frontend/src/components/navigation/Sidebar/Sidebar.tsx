import { Box, Typography } from "@mui/material";

import { useAuth } from "../../../core/auth";
import { NavItem } from "../NavItem";
import { menu } from "../menu";

export function Sidebar() {
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
        bgcolor: "#FFFFFF",
        borderRight: "1px solid #E2E8F0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          p: 3,
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Atlas ERP
        </Typography>
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
          />
        ))}
      </Box>
    </Box>
  );
}
