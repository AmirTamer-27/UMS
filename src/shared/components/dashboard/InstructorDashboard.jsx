import {
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { useNavigate } from "react-router-dom";

import QuickActions from "./QuickActions";
import RecentActivityCard from "./RecentActivityCard";
import SummaryCard from "./SummaryCard";

const InstructorDashboard = ({ data, loading }) => {
  const navigate = useNavigate();

  const getOfferingName = (offering) => {
    const courseCode = offering.courses?.code;
    const courseName = offering.courses?.name;

    if (courseCode && courseName) return `${courseCode} - ${courseName}`;
    return courseName || `Course Offering (ID: ${offering.id.substring(0, 8)})`;
  };

  const cards = [
    {
      label: "My Course Offerings",
      value: data.courseOfferings?.length || 0,
      helper: "active",
      accent: "primary",
    },
    {
      label: "Course Materials",
      value: data.courseMaterials?.length || 0,
      helper: "files",
      accent: "secondary",
    },
    {
      label: "Assignments",
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
      onClick: () => navigate("/teacher/messages"), // added navigation
    },
  ];

  return (
    <Stack spacing={4}>
      <Grid container spacing={3} alignItems="stretch" sx={{ width: "100%", m: 0 }}>
        {cards.map((card) => (
          <Grid item key={card.label} xs={12} sm={6} md={4} lg={3}>
            <div
              onClick={card.onClick}
              style={{ cursor: card.onClick ? "pointer" : "default" }}
            >
              <SummaryCard {...card} value={loading ? "..." : card.value} />
            </div>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider" }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            My Courses (LMS)
          </Typography>
          {!loading && data.courseOfferings?.length === 0 ? (
            <Typography color="text.secondary">No course offerings assigned.</Typography>
          ) : (
            <List disablePadding>
              {data.courseOfferings?.map((offering) => (
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
                      secondary="Upload materials, create assignments, and review submissions"
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
          { label: "Student Roster", to: "/staff/students" },
          { label: "Send Message", color: "secondary", variant: "outlined" },
        ]}
      />

      <RecentActivityCard>
        New submissions, parent messages, and material uploads will appear here.
      </RecentActivityCard>
    </Stack>
  );
};

export default InstructorDashboard;
