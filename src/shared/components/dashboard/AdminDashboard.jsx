import { Grid, Stack } from "@mui/material";

import QuickActions from "./QuickActions";
import RecentActivityCard from "./RecentActivityCard";
import SummaryCard from "./SummaryCard";

const countValue = (value) => (Array.isArray(value) ? value.length : value || 0);

const AdminDashboard = ({ data, loading }) => {
  const totalCourses = countValue(data.courses);
  const totalStudents = countValue(data.studentProfiles);
  const totalStaff = countValue(data.staffProfiles);
  const totalOfferings = countValue(data.courseOfferings);

  const cards = [
    {
      label: "Total Courses",
      value: totalCourses,
      helper: "catalog",
      accent: "primary",
    },
    {
      label: "Total Students",
      value: totalStudents,
      helper: "records",
      accent: "secondary",
    },
    {
      label: "Total Staff",
      value: totalStaff,
      helper: "profiles",
      accent: "warning",
    },
    {
      label: "Total Offerings",
      value: totalOfferings,
      helper: "published",
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
