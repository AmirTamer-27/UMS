import { useEffect, useMemo, useState } from "react";

import { Alert, Box, CircularProgress, Container } from "@mui/material";

import RoleBasedDashboard from "../shared/components/dashboard/RoleBasedDashboard";
import MainLayout from "../shared/components/layout/MainLayout";
import { supabase } from "../services/supabase";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      if (!supabase) {
        if (isMounted) {
          setError("Supabase is not configured. Add your Vite Supabase URL and anon key.");
          setLoading(false);
        }
        return;
      }

      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setError("Please log in to view your dashboard.");
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, department_id")
        .eq("id", currentUser.id)
        .single();

      if (!isMounted) return;

      if (profileError) {
        setError(profileError.message);
        setProfile(null);
      } else {
        setProfile({
          ...profileData,
          name: profileData.full_name || profileData.email || currentUser.email,
        });
      }

      setUser(currentUser);
      setLoading(false);
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

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
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error ? (
              <Alert severity="warning" sx={{ mb: 3 }}>
                {error}
              </Alert>
            ) : null}
            {canRenderDashboard ? (
              <RoleBasedDashboard profile={{ ...profile, name: displayName }} user={user} />
            ) : null}
          </>
        )}
      </Container>
    </MainLayout>
  );
};

export default Dashboard;
