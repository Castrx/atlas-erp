import { Box, Typography } from "@mui/material";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

type NavItemProps = {
  label: string;
  icon: LucideIcon;
  path?: string;
};

export function NavItem({ label, icon: Icon, path }: NavItemProps) {
  const navigate = useNavigate();

  return (
    <Box
      onClick={path ? () => navigate(path) : undefined}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 3,
        py: 1.5,
        cursor: "pointer",
        transition: "0.2s",

        "&:hover": {
          backgroundColor: "#EFF6FF",
        },
      }}
    >
      <Icon size={20} />

      <Typography
        sx={{
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}