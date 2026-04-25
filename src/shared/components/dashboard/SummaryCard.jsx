import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";

const SummaryCard = ({ label, value, helper, accent = "primary" }) => (
  <Card
    sx={{
      height: "100%",
      transition: (theme) =>
        theme.transitions.create(["box-shadow", "transform"], {
          duration: theme.transitions.duration.short,
        }),
      "&:hover": {
        boxShadow: "0 14px 34px rgba(15, 23, 42, 0.10)",
        transform: "translateY(-2px)",
      },
    }}
  >
    <CardContent sx={{ height: "100%", p: 3 }}>
      <Stack height="100%" justifyContent="space-between" spacing={3}>
        <Stack alignItems="flex-start" direction="row" justifyContent="space-between" spacing={2}>
          <Typography color="text.secondary" fontWeight={800} variant="body2">
            {label}
          </Typography>
          <Chip
            color={accent}
            label={helper}
            size="small"
            sx={{ borderRadius: 1, fontWeight: 700 }}
            variant="outlined"
          />
        </Stack>
        <Typography color="text.primary" fontWeight={900} lineHeight={1} variant="h3">
          {value}
        </Typography>
      </Stack>
    </CardContent>
  </Card>
);

export default SummaryCard;
