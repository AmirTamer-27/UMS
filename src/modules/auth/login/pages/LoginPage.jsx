import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useAuth } from "../../../../context/AuthContext";
import LoginForm from "../components/LoginForm";

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: "background.default",
        display: "flex",
        minHeight: "100vh",
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gap: { xs: 4, md: 8 },
            gridTemplateColumns: { xs: "1fr", md: "1fr 440px" },
            alignItems: "center",
          }}
        >
          <Stack spacing={3}>
            <Typography
              component="p"
              sx={{
                color: "secondary.main",
                fontSize: "0.875rem",
                fontWeight: 700,
                letterSpacing: 0,
                textTransform: "uppercase",
              }}
            >
              University Management System
            </Typography>
            <Typography
              component="h2"
              variant="h2"
              sx={{
                color: "text.primary",
                fontSize: { xs: "2.25rem", md: "3.5rem" },
                fontWeight: 800,
                letterSpacing: 0,
                lineHeight: 1.08,
                maxWidth: 680,
              }}
            >
              A focused academic workspace for students, staff, and faculty.
            </Typography>
            <Typography
              sx={{
                color: "text.secondary",
                fontSize: "1.125rem",
                lineHeight: 1.7,
                maxWidth: 580,
              }}
            >
              Access courses, registrations, facilities, communications, and
              academic operations from one secure portal.
            </Typography>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              p: { xs: 3, sm: 4 },
            }}
          >
            <LoginForm onSuccess={() => navigate("/", { replace: true })} />
            {role ? (
              <Typography
                sx={{ color: "text.secondary", mt: 3, textAlign: "center" }}
              >
                Signed in as {role}
              </Typography>
            ) : null}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
