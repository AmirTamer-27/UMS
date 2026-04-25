import { Grid, Stack } from "@mui/material";

import QuickActions from "./QuickActions";
import RecentActivityCard from "./RecentActivityCard";
import SummaryCard from "./SummaryCard";

const AdminDashboard = ({ data, loading }) => {
  const students = data.profiles.filter((profile) => profile.role === "student");
  const staff = data.profiles.filter((profile) =>
    ["instructor", "teacher", "staff"].includes(profile.role),
  );

  const cards = [
    {
      label: "Manage Courses",
      value: data.courseOfferings.length,
      helper: "offerings",
      accent: "primary",
    },
    {
      label: "Manage Students",
      value: students.length,
      helper: "records",
      accent: "secondary",
    },
    {
      label: "Manage Staff",
      value: staff.length,
      helper: "profiles",
      accent: "warning",
    },
    {
      label: "System Overview",
      value:
        data.courseOfferings.length +
        data.rooms.length +
        data.messages.length +
        data.registrations.length,
      helper: "items",
      accent: "primary",
    },
  ];

  return (
    <Stack spacing={4}>
      <Grid container spacing={3} alignItems="stretch">
        {cards.map((card) => (
          <Grid item key={card.label} md={3} sm={6} xs={12}>
            <SummaryCard {...card} value={loading ? "..." : card.value} />
          </Grid>
        ))}
      </Grid>
      <QuickActions
        actions={[
          { label: "Create Student" },
          { label: "Update Student", color: "secondary", variant: "outlined" },
          { label: "Create Staff", color: "warning" },
        ]}
      />
      <RecentActivityCard>
        Course publishing, student record updates, and staff profile changes will
        appear here.
      </RecentActivityCard>
    </Stack>
  );
};

export default AdminDashboard;
