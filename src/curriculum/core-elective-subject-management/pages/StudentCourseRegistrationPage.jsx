import { useCallback, useState } from "react";
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
import AvailableCoursesPanel from "../components/AvailableCoursesPanel";
import CourseDetailsDialog from "../components/CourseDetailsDialog";
import RegistrationSummarySection from "../components/RegistrationSummarySection";
import StudentOverviewCard from "../components/StudentOverviewCard";

const StudentCourseRegistrationPage = () => {
  const {
    user,
    profile,
    loading: authLoading,
    error: authError,
  } = useAuth();
  const { activeSemester, student, offerings, loading, error, refresh } =
    useAvailableCourses(profile);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [prerequisites, setPrerequisites] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const handleViewCourse = useCallback(async (course) => {
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

  const handleAddCourse = useCallback(
    async (course) => {
      setActionLoadingId(course.id);
      setActionMessage(null);

      try {
        await courseRegistrationService.addCourseToSelection(profile, course.id);
        await refresh();
        setActionMessage({
          severity: "success",
          text: `${course.courseCode} was saved to your selection list.`,
        });
      } catch (saveError) {
        setActionMessage({
          severity: "error",
          text:
            saveError.message ||
            "Unable to save this course to your selection list.",
        });
      } finally {
        setActionLoadingId(null);
      }
    },
    [profile, refresh],
  );

  const handleRemoveCourse = useCallback(
    async (course) => {
      setActionLoadingId(course.id);
      setActionMessage(null);

      try {
        await courseRegistrationService.removeCourseFromSelection(
          profile,
          course.registrationId,
        );
        await refresh();
        setActionMessage({
          severity: "success",
          text: `${course.courseCode} was removed from your selection list.`,
        });
      } catch (removeError) {
        setActionMessage({
          severity: "error",
          text:
            removeError.message ||
            "Unable to remove this course from your selection list.",
        });
      } finally {
        setActionLoadingId(null);
      }
    },
    [profile, refresh],
  );

  const handleConfirmSelection = useCallback(async () => {
    const selectedOfferingIds = offerings
      .filter((course) => course.registrationStatus === "selected")
      .map((course) => course.id);
    const submittedCount = selectedOfferingIds.length;

    setConfirming(true);
    setActionMessage(null);

    try {
      await courseRegistrationService.confirmSelectedCourses(
        profile,
        selectedOfferingIds,
      );
      await refresh();
      setActionMessage({
        severity: "success",
        text: `${submittedCount} course${
          submittedCount === 1 ? "" : "s"
        } submitted. Your semester enrollment has been recorded.`,
      });
    } catch (confirmError) {
      setActionMessage({
        severity: "error",
        text:
          confirmError.message ||
          "Unable to confirm your selected courses right now.",
      });
    } finally {
      setConfirming(false);
    }
  }, [offerings, profile, refresh]);

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

  const selectedCourses = offerings.filter(
    (course) => course.registrationStatus === "selected",
  );
  const registeredCourses = offerings.filter(
    (course) => course.registrationStatus === "registered",
  );
  const availableOfferings = offerings.filter(
    (course) =>
      course.registrationStatus !== "selected" &&
      course.registrationStatus !== "registered",
  );
  const coreCourses = availableOfferings.filter(
    (course) => course.courseType === "core",
  );
  const electiveCourses = availableOfferings.filter(
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

          <StudentOverviewCard
            eligibleCount={offerings.length}
            student={student}
            user={user}
          />

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

          {!loading && !error && actionMessage ? (
            <Alert severity={actionMessage.severity} variant="outlined">
              {actionMessage.text}
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
            <Box
              sx={{
                alignItems: "start",
                display: "grid",
                gap: { xs: 2.5, lg: 3 },
                gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 430px" },
              }}
            >
              <AvailableCoursesPanel
                actionLoadingId={actionLoadingId}
                availableCourses={availableOfferings}
                coreCourses={coreCourses}
                electiveCourses={electiveCourses}
                onAddCourse={handleAddCourse}
                onViewCourse={handleViewCourse}
              />

              <RegistrationSummarySection
                actionLoadingId={actionLoadingId}
                confirming={confirming}
                onConfirm={handleConfirmSelection}
                onRemoveCourse={handleRemoveCourse}
                onViewCourse={handleViewCourse}
                registeredCourses={registeredCourses}
                selectedCourses={selectedCourses}
              />
            </Box>
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
