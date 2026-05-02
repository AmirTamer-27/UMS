import { Grid, Stack, Typography, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Card, CardContent } from "@mui/material";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { useNavigate } from "react-router-dom";

import QuickActions from "./QuickActions";
import RecentActivityCard from "./RecentActivityCard";
import SummaryCard from "./SummaryCard";

const StudentDashboard = ({ data, loading }) => {
  const navigate = useNavigate();

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
    {
      label: "Room Bookings",
      value: data.roomBookings?.length || 0,
      helper: "reserved",
      accent: "secondary",
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

      <Card sx={{ bgcolor: "background.paper" }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            My Courses (LMS)
          </Typography>
          {!loading && data.registeredOfferings?.length === 0 ? (
            <Typography color="text.secondary">No courses registered.</Typography>
          ) : (
            <List>
              {data.registeredOfferings?.map((offering) => (
                <ListItem key={offering.id} disablePadding divider>
                  <ListItemButton onClick={() => navigate(`/lms/courses/${offering.id}`)}>
                    <ListItemIcon>
                      <MenuBookOutlinedIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`Course Offering (ID: ${offering.id.substring(0, 8)})`} 
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
          { label: "Submit Assignment", color: "warning" },
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
