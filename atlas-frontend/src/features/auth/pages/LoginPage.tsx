import { Box } from "@mui/material";

import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "#F8FAFC",
        p: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
        }}
      >
        <LoginForm />
      </Box>
    </Box>
  );
}
