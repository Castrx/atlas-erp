import { Button, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm() {
  const { register, handleSubmit } = useForm<LoginFormData>();

  function onSubmit(data: LoginFormData) {
    console.log(data);
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
        >
          Entrar
        </Button>
      </Stack>
    </form>
  );
}