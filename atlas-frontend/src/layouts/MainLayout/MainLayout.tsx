import { Box } from "@mui/material";

import { Header } from "../../components/navigation/Header";
import { Sidebar } from "../../components/navigation/Sidebar";

type Props = {
  children: React.ReactNode;
};

export function MainLayout({ children }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <Sidebar />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />

        <Box
          sx={{
            flex: 1,
            bgcolor: "#F8FAFC",
            p: 4,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}