import { Grid, Stack } from "@mui/material";

import QuickActions from "./QuickActions";
import RecentActivityCard from "./RecentActivityCard";
import SummaryCard from "./SummaryCard";

const ParentDashboard = ({ data, loading }) => {
  const cards = [
    {
      label: "Child Progress",
      value: "Ready",
      helper: "placeholder",
      accent: "primary",
    },
    {
      label: "Messages with Teachers",
      value: data.messages.length,
      helper: "threads",
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
      <QuickActions actions={[{ label: "Send Message" }]} />
      <RecentActivityCard>
        Teacher updates and replies to your messages will appear here.
      </RecentActivityCard>
    </Stack>
  );
};

export default ParentDashboard;
