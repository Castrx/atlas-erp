import { Avatar, Box, IconButton, Typography } from "@mui/material";
import { LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../../core/auth";
import { menu } from "../menu";

export function Header() {
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
        px: 4,
        borderBottom: "1px solid #E2E8F0",
        bgcolor: "#FFFFFF",

        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
      >
        {title}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography>
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