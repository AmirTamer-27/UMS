import { useEffect, useMemo, useState } from "react";

import { Alert, Box, CircularProgress, Container } from "@mui/material";

import RoleBasedDashboard from "../shared/components/dashboard/RoleBasedDashboard";
import MainLayout from "../shared/components/layout/MainLayout";
import { supabase } from "../services/supabase";

const fallbackProfile = {
  full_name: "University User",
  name: "University User",
  role: "student",
};

const DEV_MODE = true;

const mockUser = {
  id: "demo-user",
  email: "demo@university.com",
};

const mockProfile = {
  full_name: "Hassan Ismail",
  name: "Hassan Ismail",
  role: "student", // change this to test roles
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(fallbackProfile);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState("");

 useEffect(() => {
  let isMounted = true;

  const loadProfile = async () => {
    // DEV MODE: skip Supabase
    if (DEV_MODE) {
      setUser(mockUser);
      setProfile(mockProfile);
      setLoading(false);
      return;
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (!isMounted) return;

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const currentUser = authData?.user ?? null;
    setUser(currentUser);

    if (!currentUser) {
      setProfile(fallbackProfile);
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("name, full_name, role")
      .eq("id", currentUser.id)
      .single();

    if (!isMounted) return;

    if (profileError) {
      setError(profileError.message);
    }

    setProfile({
      ...fallbackProfile,
      ...profileData,
      name:
        profileData?.name ||
        profileData?.full_name ||
        currentUser.user_metadata?.name ||
        currentUser.email ||
        fallbackProfile.name,
    });

    setLoading(false);
  };

  loadProfile();

  return () => {
    isMounted = false;
  };
}, []);

  const displayName = useMemo(
    () => profile?.name || profile?.full_name || "University User",
    [profile],
  );

  return (
    <MainLayout profile={profile} user={user}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
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
            <RoleBasedDashboard
              profile={{ ...profile, name: displayName }}
              user={user}
            />
          </>
        )}
      </Container>
    </MainLayout>
  );
};

export default Dashboard;
