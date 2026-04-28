import { Grid, Stack, Typography, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Card, CardContent } from "@mui/material";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { useNavigate } from "react-router-dom";

import QuickActions from "./QuickActions";
import RecentActivityCard from "./RecentActivityCard";
import SummaryCard from "./SummaryCard";

const InstructorDashboard = ({ data, loading }) => {
  const navigate = useNavigate();

  const cards = [
    {
      label: "My Course Offerings",
      value: data.courseOfferings?.length || 0,
      helper: "active",
      accent: "primary",
    },
    {
      label: "Upload Materials",
      value: data.courseMaterials?.length || 0,
      helper: "files",
      accent: "secondary",
    },
    {
      label: "Create Assignments",
      value: data.assignments?.length || 0,
      helper: "created",
      accent: "warning",
    },
    {
      label: "Student Submissions",
      value: data.assignmentSubmissions?.length || 0,
      helper: "review",
      accent: "primary",
    },
    {
      label: "Messaging",
      value: data.messages?.length || 0,
      helper: "parents",
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
            My Course Offerings (LMS)
          </Typography>
          {!loading && data.courseOfferings?.length === 0 ? (
            <Typography color="text.secondary">No course offerings assigned.</Typography>
          ) : (
            <List>
              {data.courseOfferings?.map((offering) => (
                <ListItem key={offering.id} disablePadding divider>
                  <ListItemButton onClick={() => navigate(`/lms/courses/${offering.id}`)}>
                    <ListItemIcon>
                      <MenuBookOutlinedIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`Course Offering (ID: ${offering.id.substring(0, 8)})`} 
                      secondary="Manage materials and assignments" 
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
          { label: "Upload Material" },
          { label: "Create Assignment", color: "warning" },
          { label: "View Submissions", color: "secondary", variant: "outlined" },
        ]}
      />
      <RecentActivityCard>
        New submissions, parent messages, and material uploads will appear here.
      </RecentActivityCard>
    </Stack>
  );
};

export default InstructorDashboard;
