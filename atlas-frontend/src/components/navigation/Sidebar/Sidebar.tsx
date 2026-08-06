import { Box, Typography } from "@mui/material";

import { NavItem } from "../NavItem";
import { menu } from "../menu";

export function Sidebar() {
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
        {menu.map((item) => (
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