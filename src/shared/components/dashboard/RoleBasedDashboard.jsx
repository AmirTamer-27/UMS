import { useEffect, useMemo, useState } from "react";

import { Alert, Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";

import { supabase } from "../../../services/supabase";
import AdminDashboard from "./AdminDashboard";
import InstructorDashboard from "./InstructorDashboard";
import ParentDashboard from "./ParentDashboard";
import StudentDashboard from "./StudentDashboard";

const emptyDashboardData = {
  registrations: [],
  registeredOfferings: [],
  courseOfferings: [],
  courses: [],
  assignments: [],
  courseMaterials: [],
  assignmentSubmissions: [],
  roomBookings: [],
  messages: [],
  parentStudentLinks: [],
  studentProfiles: [],
  staffProfiles: [],
};

const roleAliases = {
  teacher: "instructor",
  staff: "instructor",
};

const withCount = async (query) => {
  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count || 0;
};

const fetchRows = async (query) => {
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
};

const selectByIds = (query, column, ids) => {
  if (!ids.length) {
    return Promise.resolve([]);
  }

  return fetchRows(query.in(column, ids));
};

const loadStudentDashboardData = async (userId) => {
  const registrations = await fetchRows(
    supabase
      .from("registrations")
      .select("*, course_offerings(*)")
      .eq("student_user_id", userId)
      .eq("status", "registered"),
  );
  const offeringIds = registrations
    .map((registration) => registration.course_offering_id)
    .filter(Boolean);

  const [courseOfferings, assignments, courseMaterials, roomBookings] =
    await Promise.all([
      fetchRows(supabase.from("course_offerings").select("*").eq("published", true)),
      selectByIds(
        supabase.from("assignments").select("*, course_offerings(*)"),
        "course_offering_id",
        offeringIds,
      ),
      selectByIds(
        supabase.from("course_materials").select("*"),
        "course_offering_id",
        offeringIds,
      ),
      fetchRows(
        supabase.from("room_bookings").select("*").eq("booked_by_user_id", userId),
      ),
    ]);

  return {
    ...emptyDashboardData,
    registrations,
    registeredOfferings: registrations
      .map((registration) => registration.course_offerings)
      .filter(Boolean),
    courseOfferings,
    assignments,
    courseMaterials,
    roomBookings,
  };
};

const loadInstructorDashboardData = async (userId) => {
  const courseOfferings = await fetchRows(
    supabase.from("course_offerings").select("*").eq("instructor_user_id", userId),
  );
  const offeringIds = courseOfferings.map((offering) => offering.id).filter(Boolean);

  const [assignments, courseMaterials, messages] = await Promise.all([
    fetchRows(supabase.from("assignments").select("*").eq("created_by", userId)),
    selectByIds(
      supabase.from("course_materials").select("*"),
      "course_offering_id",
      offeringIds,
    ),
    fetchRows(supabase.from("messages").select("*").eq("sender_user_id", userId)),
  ]);
  const assignmentIds = assignments.map((assignment) => assignment.id).filter(Boolean);
  const assignmentSubmissions = await selectByIds(
    supabase.from("assignment_submissions").select("*"),
    "assignment_id",
    assignmentIds,
  );

  return {
    ...emptyDashboardData,
    courseOfferings,
    assignments,
    courseMaterials,
    assignmentSubmissions,
    messages,
  };
};

const loadAdminDashboardData = async () => {
  const [courses, studentProfiles, staffProfiles, courseOfferings] =
    await Promise.all([
      withCount(supabase.from("courses").select("*", { count: "exact", head: true })),
      withCount(
        supabase.from("student_profiles").select("*", { count: "exact", head: true }),
      ),
      withCount(
        supabase.from("staff_profiles").select("*", { count: "exact", head: true }),
      ),
      withCount(
        supabase.from("course_offerings").select("*", { count: "exact", head: true }),
      ),
    ]);

  return {
    ...emptyDashboardData,
    courses,
    studentProfiles,
    staffProfiles,
    courseOfferings,
  };
};

const loadParentDashboardData = async (userId) => {
  const parentStudentLinks = await fetchRows(
    supabase
      .from("parent_student_links")
      .select("*")
      .eq("parent_user_id", userId),
  );
  const studentIds = parentStudentLinks
    .map((link) => link.student_user_id)
    .filter(Boolean);

  const [assignmentSubmissions, messages] = await Promise.all([
    selectByIds(
      supabase.from("assignment_submissions").select("*, assignments(*)"),
      "student_user_id",
      studentIds,
    ),
    fetchRows(supabase.from("messages").select("*").eq("sender_user_id", userId)),
  ]);

  return {
    ...emptyDashboardData,
    parentStudentLinks,
    assignmentSubmissions,
    messages,
  };
};

const RoleBasedDashboard = ({ profile, user }) => {
  const [data, setData] = useState(emptyDashboardData);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  const role = useMemo(() => {
    const profileRole = profile?.role || "student";
    return roleAliases[profileRole] || profileRole;
  }, [profile]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      if (!supabase || !user?.id) {
        setLoadingData(false);
        return;
      }

      setLoadingData(true);
      setError("");

      try {
        const loaders = {
          student: () => loadStudentDashboardData(user.id),
          instructor: () => loadInstructorDashboardData(user.id),
          admin: loadAdminDashboardData,
          parent: () => loadParentDashboardData(user.id),
        };
        const nextData = await (loaders[role] || loaders.student)();

        if (isMounted) {
          setData(nextData);
        }
      } catch (dashboardError) {
        if (isMounted) {
          setError(dashboardError.message);
          setData(emptyDashboardData);
        }
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [role, user?.id]);

  const dashboardProps = {
  data,
  loading: loadingData,
  profile,  
};

  const roleDashboard = {
    student: <StudentDashboard {...dashboardProps} />,
    instructor: <InstructorDashboard {...dashboardProps} />,
    admin: <AdminDashboard {...dashboardProps} />,
    parent: <ParentDashboard {...dashboardProps} />,
  };

  return (
    <Stack spacing={4}>
      <Grid container spacing={3} sx={{ width: "100%", m: 0 }}>
        <Grid item xs={12}>
          <Card
            sx={{
              bgcolor: "background.paper",
              overflow: "hidden",
              width: "100%",
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack
                alignItems={{ xs: "flex-start", sm: "center" }}
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography color="text.secondary" fontWeight={800} variant="body1">
                    Welcome back
                  </Typography>
                  <Typography color="text.primary" fontWeight={900} variant="h3">
                    {profile?.name || "University User"}
                  </Typography>
                </Box>
                <Chip
                  color="secondary"
                  label={role}
                  sx={{
                    borderRadius: 1,
                    fontWeight: 800,
                    px: 0.75,
                    textTransform: "capitalize",
                  }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error ? <Alert severity="warning">{error}</Alert> : null}

      <Grid container spacing={4}>
        <Grid item xs={12}>
          {roleDashboard[role] || roleDashboard.student}
        </Grid>
      </Grid>
    </Stack>
  );
};

export default RoleBasedDashboard;
