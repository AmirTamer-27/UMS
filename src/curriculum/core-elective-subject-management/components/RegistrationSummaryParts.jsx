import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CourseOfferingCard from "./CourseOfferingCard";

export const SummaryHeader = ({ selectedCount }) => (
  <Box
    sx={{
      background:
        "linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(20, 184, 166, 0.08))",
      borderBottom: 1,
      borderColor: "divider",
      p: { xs: 2.5, md: 3 },
    }}
  >
    <Stack spacing={1}>
      <Stack alignItems="center" direction="row" spacing={1}>
        <Typography
          component="h2"
          sx={{
            color: "text.primary",
            fontSize: "1.35rem",
            fontWeight: 900,
          }}
        >
          Registration summary
        </Typography>
        <Chip color="primary" label={selectedCount} size="small" />
      </Stack>
      <Typography sx={{ color: "text.secondary" }}>
        Submit your draft selections, then keep your confirmed enrollment in view.
      </Typography>
    </Stack>
  </Box>
);

const EmptyDraftState = ({ hasRegisteredCourses }) => (
  <Paper
    elevation={0}
    sx={{
      bgcolor: "background.default",
      border: 1,
      borderColor: "divider",
      borderRadius: 3,
      p: 3,
      textAlign: "center",
    }}
  >
    <Typography sx={{ color: "text.primary", fontWeight: 800 }}>
      {hasRegisteredCourses ? "No draft selections left" : "No courses selected yet"}
    </Typography>
    <Typography sx={{ color: "text.secondary", mt: 0.75 }}>
      {hasRegisteredCourses
        ? "Confirmed courses are recorded below. Add more courses from the catalog if needed."
        : "Add courses from the catalog. Draft selections are saved across refreshes."}
    </Typography>
  </Paper>
);

export const DraftSelectionList = ({
  actionLoadingId,
  onRemoveCourse,
  onViewCourse,
  registeredCourses,
  selectedCourses,
}) => {
  if (!selectedCourses.length) {
    return <EmptyDraftState hasRegisteredCourses={registeredCourses.length > 0} />;
  }

  return (
    <Stack spacing={2}>
      {selectedCourses.map((course) => (
        <CourseOfferingCard
          actionLabel="Remove"
          actionLoading={actionLoadingId === course.id}
          actionLoadingLabel="Removing..."
          actionVariant="outlined"
          compact
          course={course}
          key={course.id}
          onAction={onRemoveCourse}
          onViewDetails={onViewCourse}
          statusLabel="Saved selection"
        />
      ))}
    </Stack>
  );
};

export const SubmitPanel = ({ confirming, onConfirm, selectedCount }) => (
  <Stack
    spacing={1.5}
    sx={{
      bgcolor: "background.default",
      border: 1,
      borderColor: "divider",
      borderRadius: 3,
      p: 2,
    }}
  >
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography sx={{ color: "text.secondary", fontWeight: 800 }}>
        Ready to submit
      </Typography>
      <Typography sx={{ color: "text.primary", fontWeight: 900 }}>
        {selectedCount} course{selectedCount === 1 ? "" : "s"}
      </Typography>
    </Stack>
    <Button
      disabled={!selectedCount || confirming}
      fullWidth
      onClick={onConfirm}
      size="large"
      sx={{ borderRadius: 2, py: 1.25 }}
      variant="contained"
    >
      {confirming ? "Submitting..." : "Submit registration"}
    </Button>
  </Stack>
);

export const ConfirmedRegistrations = ({ courses, onViewCourse }) => {
  if (!courses.length) {
    return null;
  }

  return (
    <>
      <Divider />
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography sx={{ color: "text.primary", fontWeight: 900 }}>
            Confirmed registrations
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            These records are stored in the system and stay out of the available
            catalog.
          </Typography>
        </Stack>
        {courses.map((course) => (
          <CourseOfferingCard
            compact
            course={course}
            key={course.id}
            onViewDetails={onViewCourse}
            statusLabel="Registered"
          />
        ))}
      </Stack>
    </>
  );
};
