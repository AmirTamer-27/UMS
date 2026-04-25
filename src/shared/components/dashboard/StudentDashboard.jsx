import { Grid, Stack } from "@mui/material";

import QuickActions from "./QuickActions";
import RecentActivityCard from "./RecentActivityCard";
import SummaryCard from "./SummaryCard";

const StudentDashboard = ({ data, loading }) => {
  const cards = [
    {
      label: "My Courses",
      value: data.registrations.length,
      helper: "registered",
      accent: "primary",
    },
    {
      label: "Available Courses",
      value: data.courseOfferings.length,
      helper: "open",
      accent: "secondary",
    },
    {
      label: "Assignments",
      value: data.assignments.length,
      helper: "pending",
      accent: "warning",
    },
    {
      label: "Course Materials",
      value: data.courseMaterials.length,
      helper: "available",
      accent: "primary",
    },
    {
      label: "Room Booking",
      value: data.rooms.length,
      helper: "rooms",
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
          { label: "Browse Courses" },
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
