import { useState } from "react";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { useAuth } from "../../../../core/auth";
import { CompassMark } from "../../../../components/ui/CompassMark";

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormData>();

  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(data: LoginFormData) {
    setError(null);

    try {
      await login(data);
      navigate("/", { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Não foi possível fazer login. Tente novamente.");
      }
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, sm: 5 },
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3}>
          <Stack
            spacing={1.5}
            alignItems="center"
            textAlign="center"
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CompassMark size={26} />
            </Box>

            <Typography
              variant="h4"
              fontWeight={600}
              sx={{ fontFamily: '"Fraunces", "Iowan Old Style", Georgia, serif' }}
            >
              Atlas ERP
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Entre para acessar o sistema.
            </Typography>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="E-mail"
            {...register("email")}
            fullWidth
          />

          <TextField
            label="Senha"
            type="password"
            {...register("password")}
            fullWidth
          />

          <Button
            variant="contained"
            size="large"
            type="submit"
            disabled={isSubmitting}
          >
            Entrar
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
