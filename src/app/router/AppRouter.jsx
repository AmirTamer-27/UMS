import {
  BrowserRouter as Router,
  Link as RouterLink,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useAuth } from "../../context/AuthContext";
import { StudentCourseRegistrationPage } from "../../curriculum/core-elective-subject-management/pages";
import LoginPage from "../../modules/auth/login/pages/LoginPage";

const HomePage = () => {
  const { profile, role, user, logout, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "background.default",
          display: "flex",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            p: { xs: 3, md: 4 },
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography
                component="h1"
                variant="h4"
                sx={{ color: "text.primary", fontWeight: 800 }}
              >
                Dashboard
              </Typography>
              <Typography sx={{ color: "text.secondary", mt: 1 }}>
                You are signed in as {profile?.full_name || user.email}.
              </Typography>
            </Box>

            <Box
              sx={{
                bgcolor: "background.default",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                p: 2,
              }}
            >
              <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                Role
              </Typography>
              <Typography sx={{ color: "text.primary", mt: 0.5 }}>
                {role || "No role found on profile"}
              </Typography>
            </Box>

            <Button
              component={RouterLink}
              to="/courses/registration"
              sx={{ alignSelf: "flex-start" }}
              variant="contained"
            >
              Browse courses
            </Button>

            <Button
              onClick={logout}
              sx={{ alignSelf: "flex-start" }}
              variant="outlined"
            >
              Sign out
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

const AppRouter = () => (
  <Router>
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route element={<StudentCourseRegistrationPage />} path="/courses/registration" />
      <Route element={<HomePage />} path="/" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  </Router>
);

export default AppRouter;
