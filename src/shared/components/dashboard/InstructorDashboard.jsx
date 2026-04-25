import { Grid, Stack } from "@mui/material";

import QuickActions from "./QuickActions";
import RecentActivityCard from "./RecentActivityCard";
import SummaryCard from "./SummaryCard";

const InstructorDashboard = ({ data, loading }) => {
  const cards = [
    {
      label: "My Course Offerings",
      value: data.courseOfferings.length,
      helper: "active",
      accent: "primary",
    },
    {
      label: "Upload Materials",
      value: data.courseMaterials.length,
      helper: "files",
      accent: "secondary",
    },
    {
      label: "Create Assignments",
      value: data.assignments.length,
      helper: "created",
      accent: "warning",
    },
    {
      label: "Student Submissions",
      value: data.assignments.length,
      helper: "review",
      accent: "primary",
    },
    {
      label: "Messaging",
      value: data.messages.length,
      helper: "parents",
      accent: "secondary",
    },
  ];

  return (
    <Stack spacing={4}>
      <Grid container spacing={3} alignItems="stretch">
        {cards.map((card) => (
          <Grid item key={card.label} md={4} sm={6} xs={12}>
            <SummaryCard {...card} value={loading ? "..." : card.value} />
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
