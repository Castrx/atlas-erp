import { useState } from "react";
import { Box, Drawer } from "@mui/material";

import { Header } from "../../components/navigation/Header";
import { Sidebar } from "../../components/navigation/Sidebar";

const SIDEBAR_WIDTH = 260;

type Props = {
  children: React.ReactNode;
};

export function MainLayout({ children }: Props) {
  // Sidebar não tem lógica própria de responsividade (permanece a mesma em
  // qualquer tamanho de tela); quem decide como exibi-la é este layout —
  // fixa no desktop, Drawer temporário abaixo do breakpoint `md`.
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Sidebar />
      </Box>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH, boxSizing: "border-box" },
        }}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header onMenuClick={() => setMobileOpen(true)} />

        <Box
          sx={{
            flex: 1,
            bgcolor: "background.default",
            p: { xs: 2, md: 4 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}