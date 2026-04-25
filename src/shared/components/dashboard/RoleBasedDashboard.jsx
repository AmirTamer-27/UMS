import { useEffect, useMemo, useState } from "react";

import { Alert, Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";

import { supabase } from "../../../services/supabase";
import AdminDashboard from "./AdminDashboard";
import InstructorDashboard from "./InstructorDashboard";
import ParentDashboard from "./ParentDashboard";
import StudentDashboard from "./StudentDashboard";

const emptyDashboardData = {
  registrations: [],
  courseOfferings: [],
  assignments: [],
  courseMaterials: [],
  rooms: [],
  roomBookings: [],
  messages: [],
  profiles: [],
};

const RoleBasedDashboard = ({ profile, user }) => {
  const [data, setData] = useState(emptyDashboardData);
  const [loadingData, setLoadingData] = useState(Boolean(supabase));
  const [error, setError] = useState("");

  const role = useMemo(() => profile?.role || "student", [profile]);

  useEffect(() => {
    let isMounted = true;

    const fetchTable = async (table, select = "*") => {
      const { data: rows, error: tableError } = await supabase
        .from(table)
        .select(select);

      if (tableError) {
        throw tableError;
      }

      return rows || [];
    };

    const loadDashboardData = async () => {
      if (!supabase) {
        setLoadingData(false);
        return;
      }

      setLoadingData(true);
      setError("");

      try {
        const [
          registrations,
          courseOfferings,
          assignments,
          courseMaterials,
          rooms,
          roomBookings,
          messages,
          profiles,
        ] = await Promise.all([
          fetchTable("registrations"),
          fetchTable("course_offerings"),
          fetchTable("assignments"),
          fetchTable("course_materials"),
          fetchTable("rooms"),
          fetchTable("room_bookings"),
          fetchTable("messages"),
          role === "admin" ? fetchTable("profiles") : Promise.resolve([]),
        ]);

        if (isMounted) {
          setData({
            registrations,
            courseOfferings,
            assignments,
            courseMaterials,
            rooms,
            roomBookings,
            messages,
            profiles,
          });
        }
      } catch (dashboardError) {
        if (isMounted) {
          setError(dashboardError.message);
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
  };

  const roleDashboard = {
    student: <StudentDashboard {...dashboardProps} />,
    instructor: <InstructorDashboard {...dashboardProps} />,
    admin: <AdminDashboard {...dashboardProps} />,
    parent: <ParentDashboard {...dashboardProps} />,
  };

  return (
    <Stack spacing={4}>
      <Card
        sx={{
          bgcolor: "background.paper",
          overflow: "hidden",
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
