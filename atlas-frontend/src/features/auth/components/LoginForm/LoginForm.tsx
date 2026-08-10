import { useState } from "react";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { useAuth } from "../../../../core/auth";

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
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        <Typography
          variant="h4"
          fontWeight={700}
          textAlign="center"
        >
          Atlas ERP
        </Typography>

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
  );
}
