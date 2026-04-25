import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { courseRegistrationService } from "../services/courseRegistration";
import { useAvailableCourses } from "../hooks/useAvailableCourses";
import AvailableCoursesSection from "../components/AvailableCoursesSection";
import CourseDetailsDialog from "../components/CourseDetailsDialog";

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
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [prerequisites, setPrerequisites] = useState([]);

  useEffect(() => {
    if (user && !profile && !authLoading) {
      refreshProfile().catch(() => {});
    }
  }, [authLoading, profile, refreshProfile, user]);

  const handleSelectCourse = useCallback(async (course) => {
    setSelectedCourse(course);
    setDetailsLoading(true);
    setDetailsError("");
    setPrerequisites([]);

    try {
      const data = await courseRegistrationService.getCourseDetails(course.courseId);
      setPrerequisites(data.prerequisites);
    } catch (loadError) {
      setDetailsError(
        loadError.message || "Unable to load course details right now.",
      );
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedCourse(null);
    setDetailsError("");
    setDetailsLoading(false);
    setPrerequisites([]);
  }, []);

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
            <Paper
              elevation={0}
              sx={{
                alignItems: "center",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                display: "flex",
                gap: 2,
                minHeight: 120,
                px: 3,
                py: 2.5,
              }}
            >
              <CircularProgress size={28} />
              <Stack spacing={0.5}>
                <Typography sx={{ color: "text.primary", fontWeight: 700 }}>
                  Loading your academic profile
                </Typography>
                <Typography sx={{ color: "text.secondary" }}>
                  We&apos;re checking your department and level so we can show the
                  right courses.
                </Typography>
                {authError ? (
                  <Typography sx={{ color: "error.main", fontSize: "0.875rem" }}>
                    {authError}
                  </Typography>
                ) : null}
              </Stack>
            </Paper>
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
                onSelectCourse={handleSelectCourse}
                title="Core subjects"
              />
              <AvailableCoursesSection
                courses={electiveCourses}
                description="Optional subjects you can choose from this semester."
                onSelectCourse={handleSelectCourse}
                title="Electives"
              />
            </Stack>
          ) : null}
        </Stack>
      </Container>

      <CourseDetailsDialog
        course={selectedCourse}
        error={detailsError}
        loading={detailsLoading}
        onClose={handleCloseDialog}
        open={Boolean(selectedCourse)}
        prerequisites={prerequisites}
      />
    </Box>
  );
};

export default StudentCourseRegistrationPage;
