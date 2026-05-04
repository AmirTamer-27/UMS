import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../services/supabase/client";
import { courseRegistrationService } from "../services/courseRegistration";
import { useAvailableCourses } from "../hooks/useAvailableCourses";
import AvailableCoursesSection from "../components/AvailableCoursesSection";
import CourseOfferingCard from "../components/CourseOfferingCard";

const StudentCourseRegistrationPage = () => {
  const {
    user,
    profile,
    loading: authLoading,
    error: authError,
    refreshProfile,
  } = useAuth();
  const { activeSemester, student, offerings, loading: offeringsLoading, error, refresh } =
    useAvailableCourses(profile);
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [savingAction, setSavingAction] = useState("");

  useEffect(() => {
    if (user && !profile && !authLoading) {
      refreshProfile().catch(() => {});
    }
  }, [authLoading, profile, refreshProfile, user]);

  useEffect(() => {
    if (!profile?.id) {
      setCourses([]);
      setLoading(false);
      return undefined;
    }

    let isCurrent = true;
    const normalizedSearchQuery = searchQuery.trim();

    setLoading(true);
    setSearchError("");

    const debounceTimer = window.setTimeout(async () => {
      try {
        if (!supabase) {
          throw new Error(
            "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local environment.",
          );
        }

        let query = supabase.from("courses").select("*");

        if (normalizedSearchQuery) {
          query = query.or(
            `name.ilike.%${normalizedSearchQuery}%,code.ilike.%${normalizedSearchQuery}%`,
          );
        }

        const { data, error: coursesError } = await query.order("code", {
          ascending: true,
        });

        if (coursesError) {
          throw coursesError;
        }

        if (isCurrent) {
          setCourses(data ?? []);
        }
      } catch (loadError) {
        if (isCurrent) {
          setCourses([]);
          setSearchError(loadError.message || "Unable to search courses right now.");
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      isCurrent = false;
      window.clearTimeout(debounceTimer);
    };
  }, [profile?.id, searchQuery]);

  const displayedOfferings = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim();

    if (!normalizedSearchQuery && !courses.length) {
      return offerings;
    }

    const matchingCourseIds = new Set(courses.map((course) => course.id));

    return offerings.filter((course) => matchingCourseIds.has(course.courseId));
  }, [courses, offerings, searchQuery]);

  const availableCourses = useMemo(
    () => displayedOfferings.filter((course) => !course.registrationStatus),
    [displayedOfferings],
  );
  const selectedCourses = useMemo(
    () =>
      displayedOfferings.filter(
        (course) => course.registrationStatus === "selected",
      ),
    [displayedOfferings],
  );
  const registeredCourses = useMemo(
    () =>
      displayedOfferings.filter(
        (course) => course.registrationStatus === "registered",
      ),
    [displayedOfferings],
  );
  const coreCourses = availableCourses.filter((course) => course.courseType === "core");
  const electiveCourses = availableCourses.filter(
    (course) => course.courseType !== "core",
  );
  const isLoading = offeringsLoading || loading;

  const runCourseAction = async (key, action, successMessage) => {
    setActionError("");
    setActionMessage("");
    setSavingAction(key);

    try {
      await action();
      setActionMessage(successMessage);
      await refresh();
    } catch (actionFailure) {
      setActionError(actionFailure.message || "Unable to update course registration.");
    } finally {
      setSavingAction("");
    }
  };

  const handleSelectCourse = (course) => {
    runCourseAction(
      `select-${course.id}`,
      () =>
        courseRegistrationService.selectCourse({
          courseOfferingId: course.id,
          studentUserId: profile.id,
        }),
      `${course.courseCode} added to selected courses.`,
    );
  };

  const handleRemoveSelectedCourse = (course) => {
    runCourseAction(
      `remove-${course.id}`,
      () =>
        courseRegistrationService.removeSelectedCourse({
          courseOfferingId: course.id,
          studentUserId: profile.id,
        }),
      `${course.courseCode} removed from selected courses.`,
    );
  };

  const handleRegisterSelectedCourses = () => {
    runCourseAction(
      "register-selected",
      () =>
        courseRegistrationService.registerSelectedCourses({
          courseOfferingIds: selectedCourses.map((course) => course.id),
          studentUserId: profile.id,
        }),
      "Selected courses registered successfully.",
    );
  };

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

              <Stack spacing={0.5}>
                <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                  Selected
                </Typography>
                <Typography sx={{ color: "text.primary" }}>
                  {selectedCourses.length}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                  Registered
                </Typography>
                <Typography sx={{ color: "text.primary" }}>
                  {registeredCourses.length}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          <TextField
            fullWidth
            label="Search courses"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by course name or code..."
            value={searchQuery}
            variant="outlined"
          />

          {isLoading ? (
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

          {!isLoading && error ? (
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

          {!isLoading && searchError ? (
            <Alert severity="error" variant="outlined">
              {searchError}
            </Alert>
          ) : null}

          {!isLoading && actionError ? (
            <Alert severity="error" variant="outlined">
              {actionError}
            </Alert>
          ) : null}

          {!isLoading && actionMessage ? (
            <Alert severity="success" variant="outlined">
              {actionMessage}
            </Alert>
          ) : null}

          {!isLoading && !error && !searchError && !displayedOfferings.length ? (
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
                No courses found
              </Typography>
              <Typography sx={{ color: "text.secondary", mt: 1 }}>
                {searchQuery.trim()
                  ? "Try searching with a different course name or code."
                  : "Once new offerings are published for your department and level, they will appear here automatically."}
              </Typography>
            </Paper>
          ) : null}

          {!isLoading && !error && !searchError && displayedOfferings.length ? (
            <Stack spacing={4}>
              <Stack spacing={2.5}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Stack spacing={0.5}>
                    <Typography
                      component="h2"
                      sx={{ color: "text.primary", fontSize: "1.25rem", fontWeight: 800 }}
                    >
                      Selected courses
                    </Typography>
                    <Typography sx={{ color: "text.secondary" }}>
                      Review courses before confirming registration.
                    </Typography>
                  </Stack>
                  <Button
                    disabled={!selectedCourses.length || savingAction === "register-selected"}
                    onClick={handleRegisterSelectedCourses}
                    variant="contained"
                  >
                    Register Selected
                  </Button>
                </Stack>

                {selectedCourses.length ? (
                  <Stack spacing={2}>
                    {selectedCourses.map((course) => (
                      <CourseOfferingCard
                        actionLabel="Remove"
                        actionProps={{
                          color: "secondary",
                          disabled: savingAction === `remove-${course.id}`,
                          onClick: () => handleRemoveSelectedCourse(course),
                          variant: "outlined",
                        }}
                        course={course}
                        key={course.id}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Paper elevation={0} sx={{ border: 1, borderColor: "divider", p: 3 }}>
                    <Typography color="text.secondary">
                      No courses selected yet.
                    </Typography>
                  </Paper>
                )}
              </Stack>

              <AvailableCoursesSection
                courses={coreCourses}
                description="Required courses published for your current level."
                getActionLabel={(course) =>
                  course.availableSeats > 0 ? "Select" : "Full"
                }
                getActionProps={(course) => ({
                  disabled:
                    course.availableSeats <= 0 || savingAction === `select-${course.id}`,
                  onClick: () => handleSelectCourse(course),
                })}
                title="Core subjects"
              />
              <AvailableCoursesSection
                courses={electiveCourses}
                description="Optional subjects you can choose from this semester."
                getActionLabel={(course) =>
                  course.availableSeats > 0 ? "Select" : "Full"
                }
                getActionProps={(course) => ({
                  disabled:
                    course.availableSeats <= 0 || savingAction === `select-${course.id}`,
                  onClick: () => handleSelectCourse(course),
                })}
                title="Electives"
              />

              <AvailableCoursesSection
                courses={registeredCourses}
                description="Courses you have already confirmed for this semester."
                title="Registered courses"
              />
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
};

export default StudentCourseRegistrationPage;
