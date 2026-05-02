import { Grid, Stack, Typography, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Card, CardContent } from "@mui/material";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { useNavigate } from "react-router-dom";

import QuickActions from "./QuickActions";
import RecentActivityCard from "./RecentActivityCard";
import SummaryCard from "./SummaryCard";

const StudentDashboard = ({ data, loading }) => {
  const navigate = useNavigate();
  const firstRegisteredOfferingId = data.registeredOfferings?.[0]?.id;

  const getOfferingName = (offering) => {
    const courseCode = offering.courses?.code;
    const courseName = offering.courses?.name;

    if (courseCode && courseName) return `${courseCode} - ${courseName}`;
    return courseName || `Course Offering (ID: ${offering.id.substring(0, 8)})`;
  };

  const cards = [
    {
      label: "My Courses",
      value: data.registrations?.length || 0,
      helper: "registered",
      accent: "primary",
    },
    {
      label: "Available Courses",
      value: data.courseOfferings?.length || 0,
      helper: "open",
      accent: "secondary",
    },
    {
      label: "Assignments",
      value: data.assignments?.length || 0,
      helper: "pending",
      accent: "warning",
    },
    {
      label: "Course Materials",
      value: data.courseMaterials?.length || 0,
      helper: "available",
      accent: "primary",
    },
  ];

  return (
    <Stack spacing={4}>
      <Grid container spacing={3} alignItems="stretch" sx={{ width: "100%", m: 0 }}>
        {cards.map((card) => (
          <Grid item key={card.label} xs={12} sm={6} md={4} lg={3}>
            <SummaryCard {...card} value={loading ? "..." : card.value} />
          </Grid>
        ))}
      </Grid>

      <Card sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider" }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            My Courses (LMS)
          </Typography>
          {!loading && data.registeredOfferings?.length === 0 ? (
            <Typography color="text.secondary">No courses registered.</Typography>
          ) : (
            <List disablePadding>
              {data.registeredOfferings?.map((offering) => (
                <ListItem key={offering.id} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => navigate(`/lms/courses/${offering.id}`)}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      py: 1.25,
                    }}
                  >
                    <ListItemIcon>
                      <MenuBookOutlinedIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={getOfferingName(offering)}
                      secondary="Click to view materials and assignments" 
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <QuickActions
        actions={[
          { label: "Browse Courses", onClick: () => navigate("/courses/registration") },
          { label: "My Registrations", color: "secondary", variant: "outlined" },
          {
            label: "Submit Assignment",
            color: "warning",
            onClick: () => (
              firstRegisteredOfferingId &&
              navigate(`/lms/courses/${firstRegisteredOfferingId}?tab=assignments`)
            ),
          },
        ]}
      />
      <RecentActivityCard>
        Registration confirmations, assignment updates, and new course materials
        will appear here.
      </RecentActivityCard>
    </Stack>
  );
};

export default StudentDashboard;
