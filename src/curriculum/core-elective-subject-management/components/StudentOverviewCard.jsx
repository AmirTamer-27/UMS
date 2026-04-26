import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const DetailItem = ({ label, value }) => (
  <Stack spacing={0.5}>
    <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
      {label}
    </Typography>
    <Typography sx={{ color: "text.primary", fontWeight: 700 }}>
      {value}
    </Typography>
  </Stack>
);

const StudentOverviewCard = ({ eligibleCount, student, user }) => (
  <Paper
    elevation={0}
    sx={{
      border: 1,
      borderColor: "divider",
      borderRadius: 2,
      p: { xs: 2.5, md: 3 },
    }}
  >
    <Stack
      direction={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      spacing={2}
    >
      <DetailItem
        label="Student"
        value={student?.fullName || user?.email || "Student"}
      />
      <DetailItem
        label="Academic level"
        value={student?.level ? `Level ${student.level}` : "Not available"}
      />
      <DetailItem label="Eligible offerings" value={eligibleCount} />
    </Stack>
  </Paper>
);

export default StudentOverviewCard;
