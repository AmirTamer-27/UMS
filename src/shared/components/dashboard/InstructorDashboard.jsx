import { Grid, Stack } from "@mui/material";
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