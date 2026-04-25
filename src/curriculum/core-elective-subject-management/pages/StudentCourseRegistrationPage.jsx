import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { useAvailableCourses } from "../hooks/useAvailableCourses";
import AvailableCoursesSection from "../components/AvailableCoursesSection";

const StudentCourseRegistrationPage = () => {
  const {
    user,
    profile,
    loading: authLoading,
    error: authError,
    refreshProfile,
  } = useAuth();
  const { activeSemester, student, offerings, loading, error, refresh } =
    useAvailableCourses(profile);

  useEffect(() => {
    if (user && !profile && !authLoading) {
      refreshProfile().catch(() => {});
    }
  }, [authLoading, profile, refreshProfile, user]);

  if (authLoading && !user) {
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

  if (!profile) {
    return (
      <Box
        sx={{
          bgcolor: "background.default",
          minHeight: "100vh",
          py: { xs: 4, md: 8 },
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={3}>
            <Typography
              component="h1"
              sx={{ color: "text.primary", fontSize: "2rem", fontWeight: 800 }}
            >
              Available courses for the active semester
            </Typography>
            <Alert
              action={
                <Button color="inherit" onClick={() => refreshProfile()} size="small">
                  Retry
                </Button>
              }
              severity="error"
              variant="outlined"
            >
              {authError ||
                "Your application profile could not be loaded, so course eligibility cannot be determined yet."}
            </Alert>
          </Stack>
        </Container>
      </Box>
    );
  }

  const coreCourses = offerings.filter((course) => course.courseType === "core");
  const electiveCourses = offerings.filter(
    (course) => course.courseType !== "core",
  );

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Stack spacing={1.5}>
            <Typography
              component="p"
              sx={{
                color: "secondary.main",
                fontSize: "0.875rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Core and Elective Subject Management
            </Typography>
            <Typography
              component="h1"
              sx={{
                color: "text.primary",
                fontSize: { xs: "2rem", md: "2.75rem" },
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              Available courses for {activeSemester?.name || "the active semester"}
            </Typography>
            <Typography sx={{ color: "text.secondary", maxWidth: 760 }}>
              Review the published offerings that match your department and
              academic level, then choose the subjects you want to register for.
            </Typography>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              p: { xs: 2.5, md: 3 },
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack spacing={0.5}>
                <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                  Student
                </Typography>
                <Typography sx={{ color: "text.primary", fontWeight: 700 }}>
                  {student?.fullName || user?.email || "Student"}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                  Academic level
                </Typography>
                <Typography sx={{ color: "text.primary" }}>
                  {student?.level ? `Level ${student.level}` : "Not available"}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                  Eligible offerings
                </Typography>
                <Typography sx={{ color: "text.primary" }}>
                  {offerings.length}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          {loading ? (
            <Box
              sx={{
                alignItems: "center",
                display: "flex",
                justifyContent: "center",
                minHeight: 240,
              }}
            >
              <CircularProgress />
            </Box>
          ) : null}

          {!loading && error ? (
            <Alert
              action={
                <Button color="inherit" onClick={refresh} size="small">
                  Retry
                </Button>
              }
              severity="error"
              variant="outlined"
            >
              {error}
            </Alert>
          ) : null}

          {!loading && !error && !offerings.length ? (
            <Paper
              elevation={0}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                p: 4,
              }}
            >
              <Typography
                sx={{ color: "text.primary", fontSize: "1.1rem", fontWeight: 700 }}
              >
                No courses are currently available for your program.
              </Typography>
              <Typography sx={{ color: "text.secondary", mt: 1 }}>
                Once new offerings are published for your department and level,
                they will appear here automatically.
              </Typography>
            </Paper>
          ) : null}

          {!loading && !error && offerings.length ? (
            <Stack spacing={4}>
              <AvailableCoursesSection
                courses={coreCourses}
                description="Required courses published for your current level."
                title="Core subjects"
              />
              <AvailableCoursesSection
                courses={electiveCourses}
                description="Optional subjects you can choose from this semester."
                title="Electives"
              />
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
};

export default StudentCourseRegistrationPage;
