import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import MainLayout from "../../../shared/components/layout/MainLayout";
import { supabase } from "../../../services/supabase";
import MaterialsTab from "../components/MaterialsTab";
import AssignmentsTab from "../components/AssignmentsTab";

const CourseOfferingPage = () => {
  const { courseOfferingId } = useParams();
  const navigate = useNavigate();

  const [courseOffering, setCourseOffering] = useState(null);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    loadCourseAndUser();
  }, [courseOfferingId]);

  const loadCourseAndUser = async () => {
    try {
      setLoading(true);

      // Get current user and profile
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) throw new Error("Not authenticated");
      setUser(currentUser);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      if (profileError) throw profileError;
      setProfile(profileData);

      // Get course offering details
      const { data: offeringData, error: offeringError } = await supabase
        .from("course_offerings")
        .select("*, courses(name, code), semesters(name)")
        .eq("id", courseOfferingId)
        .single();
      if (offeringError) throw offeringError;
      setCourseOffering(offeringData);

    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  if (loading) {
    return (
      <MainLayout profile={profile}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout profile={profile}>
      <Container maxWidth="xl" disableGutters={false} sx={{ pl: 1, pr: 2, py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {courseOffering && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" fontWeight="900" color="primary">
                  {courseOffering.courses?.code} - {courseOffering.courses?.name}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {courseOffering.semesters?.name}
                </Typography>
              </Box>
            </Box>

            <Card sx={{ bgcolor: "background.paper", mb: 4 }}>
              <Tabs
                value={tabIndex}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
              >
                <Tab label="Materials" />
                <Tab label="Assignments" />
              </Tabs>
            </Card>

            <Box>
              {tabIndex === 0 && (
                <MaterialsTab
                  courseOfferingId={courseOfferingId}
                  userRole={profile?.role}
                  userId={user?.id}
                />
              )}
              {tabIndex === 1 && (
                <AssignmentsTab
                  courseOfferingId={courseOfferingId}
                  userRole={profile?.role}
                  userId={user?.id}
                />
              )}
            </Box>
          </Box>
        )}
      </Container>
    </MainLayout>
  );
};

export default CourseOfferingPage;
