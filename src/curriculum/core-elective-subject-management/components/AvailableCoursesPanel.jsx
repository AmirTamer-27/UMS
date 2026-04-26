import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import AvailableCoursesSection from "./AvailableCoursesSection";

const EmptyAvailableState = () => (
  <Paper
    elevation={0}
    sx={{
      background:
        "linear-gradient(135deg, rgba(20, 184, 166, 0.08), rgba(15, 23, 42, 0.03))",
      border: 1,
      borderColor: "rgba(20, 184, 166, 0.28)",
      borderRadius: 3,
      p: { xs: 3, md: 4 },
      textAlign: "center",
    }}
  >
    <Typography
      sx={{
        color: "primary.main",
        fontSize: "0.8rem",
        fontWeight: 900,
        letterSpacing: 0.8,
        textTransform: "uppercase",
      }}
    >
      All caught up
    </Typography>
    <Typography
      sx={{
        color: "text.primary",
        fontSize: "1.1rem",
        fontWeight: 900,
        mt: 0.75,
      }}
    >
      No more courses available to select.
    </Typography>
    <Typography sx={{ color: "text.secondary", mt: 1 }}>
      Everything eligible is either saved in your draft or already confirmed.
    </Typography>
  </Paper>
);

const PanelHeader = ({ availableCount }) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    justifyContent="space-between"
    spacing={1.5}
  >
    <Stack spacing={0.5}>
      <Typography
        component="h2"
        sx={{ color: "text.primary", fontSize: "1.35rem", fontWeight: 900 }}
      >
        Available courses
      </Typography>
      <Typography sx={{ color: "text.secondary" }}>
        Choose from courses matching your department, level, and the active
        semester.
      </Typography>
    </Stack>
    <Chip
      label={`${availableCount} available`}
      sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
      variant="outlined"
    />
  </Stack>
);

const AvailableCoursesPanel = ({
  actionLoadingId,
  availableCourses,
  coreCourses,
  electiveCourses,
  onAddCourse,
  onViewCourse,
}) => (
  <Paper
    elevation={0}
    sx={{
      border: 1,
      borderColor: "divider",
      borderRadius: 3,
      boxShadow: "0 24px 70px rgba(15, 23, 42, 0.06)",
      p: { xs: 2.5, md: 3 },
    }}
  >
    <Stack spacing={3}>
      <PanelHeader availableCount={availableCourses.length} />
      {!availableCourses.length ? <EmptyAvailableState /> : null}
      <AvailableCoursesSection
        actionLoadingId={actionLoadingId}
        courses={coreCourses}
        description="Required courses published for your current level."
        onAddCourse={onAddCourse}
        onViewCourse={onViewCourse}
        title="Core subjects"
      />
      <AvailableCoursesSection
        actionLoadingId={actionLoadingId}
        courses={electiveCourses}
        description="Optional subjects you can choose from this semester."
        onAddCourse={onAddCourse}
        onViewCourse={onViewCourse}
        title="Electives"
      />
    </Stack>
  </Paper>
);

export default AvailableCoursesPanel;
