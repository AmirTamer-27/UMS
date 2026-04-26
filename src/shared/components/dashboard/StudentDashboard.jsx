import { Grid, Stack } from "@mui/material";

import QuickActions from "./QuickActions";
import RecentActivityCard from "./RecentActivityCard";
import SummaryCard from "./SummaryCard";

const StudentDashboard = ({ data, loading }) => {
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
