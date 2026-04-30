import { useMemo } from "react";

import { Alert, Container } from "@mui/material";

import RoleBasedDashboard from "../shared/components/dashboard/RoleBasedDashboard";
import MainLayout from "../shared/components/layout/MainLayout";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { error, profile, user } = useAuth();

  const displayName = useMemo(
    () => profile?.name || profile?.full_name || user?.email || "University User",
    [profile, user],
  );

  const canRenderDashboard = useMemo(
    () => Boolean(user && profile && !error),
    [error, profile, user],
  );

  const layoutProfile = useMemo(
    () =>
      profile
        ? { ...profile, name: displayName }
        : { full_name: "University User", name: "University User", role: "student" },
    [displayName, profile],
  );

  return (
    <MainLayout profile={layoutProfile} user={user}>
      <Container maxWidth="xl" disableGutters={false} sx={{ pl: 1, pr: 2, py: 4 }}>
        {error ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : null}
        {canRenderDashboard ? (
          <RoleBasedDashboard profile={{ ...profile, name: displayName }} user={user} />
        ) : null}
      </Container>
    </MainLayout>
  );
};

export default Dashboard;
