import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { supabase } from "../../../../services/supabase";

const LoginForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (!supabase) {
      setError("Supabase is not configured. Add your Supabase credentials.");
      return;
    }

    setLoading(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    if (data?.user) {
      navigate("/dashboard");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        <Box>
          <Typography
            component="h1"
            variant="h4"
            sx={{
              color: "text.primary",
              fontWeight: 700,
              letterSpacing: 0,
              mb: 1,
            }}
          >
            Welcome back
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "1rem" }}>
            Sign in with your university account to continue.
          </Typography>
        </Box>

        {error ? (
          <Alert severity="error" variant="outlined">
            {error}
          </Alert>
        ) : null}

        <TextField
          autoComplete="email"
          autoFocus
          disabled={loading}
          fullWidth
          label="Email address"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />

        <TextField
          autoComplete="current-password"
          disabled={loading}
          fullWidth
          label="Password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />

        <Button
          disabled={loading}
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          sx={{
            borderRadius: 2,
            boxShadow: "none",
            fontWeight: 700,
            py: 1.4,
            textTransform: "none",
            "&:hover": {
              boxShadow: "none",
            },
          }}
        >
          {loading ? (
            <CircularProgress color="inherit" size={22} />
          ) : (
            "Sign in"
          )}
        </Button>
      </Stack>
    </Box>
  );
};

export default LoginForm;
