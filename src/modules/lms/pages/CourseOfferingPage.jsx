import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
import { useAuth } from "../../../context/AuthContext";
import MaterialsTab from "../components/MaterialsTab";
import AssignmentsTab from "../components/AssignmentsTab";

const CourseOfferingPage = () => {
  const { courseOfferingId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, user } = useAuth();

  const [courseOffering, setCourseOffering] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tabIndex, setTabIndex] = useState(searchParams.get("tab") === "assignments" ? 1 : 0);

  useEffect(() => {
    loadCourseOffering();
  }, [courseOfferingId]);

  useEffect(() => {
    setTabIndex(searchParams.get("tab") === "assignments" ? 1 : 0);
  }, [searchParams]);

  const loadCourseOffering = async () => {
    try {
      setLoading(true);

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
            <Box
              sx={{
                alignItems: "center",
                display: "flex",
                gap: 2,
                mb: 3,
              }}
            >
              <IconButton
                onClick={() => navigate(-1)}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" fontWeight="900" color="primary" sx={{ lineHeight: 1.15 }}>
                  {courseOffering.courses?.code} - {courseOffering.courses?.name}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {courseOffering.semesters?.name}
                </Typography>
              </Box>
            </Box>

            <Card
              sx={{
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
                boxShadow: "0 10px 26px rgba(15, 23, 42, 0.06)",
                mb: 3,
              }}
            >
              <Tabs
                value={tabIndex}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
                sx={{
                  "& .MuiTab-root": {
                    fontWeight: 800,
                    minHeight: 58,
                  },
                }}
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
