import { Avatar, Box, IconButton, Typography } from "@mui/material";
import { LogOut, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../../core/auth";
import { menu } from "../menu";

interface HeaderProps {
  /** Presente apenas em telas pequenas — abre a Sidebar em Drawer temporário. */
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps = {}) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const activeItem = menu.find((item) => item.path === location.pathname);
  const title = activeItem?.label ?? "Atlas ERP";

  return (
    <Box
      sx={{
        height: 72,
        px: { xs: 2, md: 4 },
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",

        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          minWidth: 0,
        }}
      >
        {onMenuClick && (
          <IconButton
            onClick={onMenuClick}
            aria-label="Abrir menu"
            size="small"
            sx={{ display: { xs: "inline-flex", md: "none" }, flexShrink: 0 }}
          >
            <Menu size={20} />
          </IconButton>
        )}

        <Typography
          variant="h6"
          fontWeight={700}
          noWrap
          sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {title}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography sx={{ display: { xs: "none", sm: "block" } }}>
          Gabriel
        </Typography>

        <Avatar>
          G
        </Avatar>

        <IconButton
          onClick={handleLogout}
          aria-label="Sair"
          size="small"
        >
          <LogOut size={20} />
        </IconButton>
      </Box>
    </Box>
  );
}