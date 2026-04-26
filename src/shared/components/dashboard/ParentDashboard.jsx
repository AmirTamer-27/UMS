import { Grid, Stack } from "@mui/material";

import QuickActions from "./QuickActions";
import RecentActivityCard from "./RecentActivityCard";
import SummaryCard from "./SummaryCard";

const ParentDashboard = ({ data, loading }) => {
  const cards = [
    {
      label: "Linked Students",
      value: data.parentStudentLinks?.length || 0,
      helper: "children",
      accent: "primary",
    },
    {
      label: "Submissions",
      value: data.assignmentSubmissions?.length || 0,
      helper: "tracked",
      accent: "warning",
    },
    {
      label: "Messages with Teachers",
      value: data.messages?.length || 0,
      helper: "threads",
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
      <QuickActions actions={[{ label: "Send Message" }]} />
      <RecentActivityCard>
        Teacher updates and replies to your messages will appear here.
      </RecentActivityCard>
    </Stack>
  );
};

export default ParentDashboard;
