import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const CourseOfferingCard = ({ actionLabel, actionProps = {}, course }) => (
  <Paper
    elevation={0}
    sx={{
      border: 1,
      borderColor: "divider",
      borderRadius: 2,
      p: 3,
    }}
  >
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Stack spacing={0.75}>
          <Stack alignItems="center" direction="row" spacing={1}>
            <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
              {course.courseCode}
            </Typography>
            <Chip
              color={course.courseType === "core" ? "primary" : "secondary"}
              label={course.courseType === "core" ? "Core" : "Elective"}
              size="small"
              variant="outlined"
            />
          </Stack>
          <Typography
            component="h3"
            sx={{ color: "text.primary", fontSize: "1.1rem", fontWeight: 700 }}
          >
            {course.courseName}
          </Typography>
          <Typography sx={{ color: "text.secondary", lineHeight: 1.6 }}>
            {course.description || "No course description has been added yet."}
          </Typography>
        </Stack>

        <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }} spacing={0.5}>
          <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
            Available Seats
          </Typography>
          <Typography
            sx={{ color: "text.primary", fontSize: "1.4rem", fontWeight: 800 }}
          >
            {course.availableSeats}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
            {course.registeredCount} / {course.seatLimit} registered
          </Typography>
          {actionLabel ? (
            <Button size="small" sx={{ mt: 1 }} variant="contained" {...actionProps}>
              {actionLabel}
            </Button>
          ) : null}
        </Stack>
      </Stack>

      <Divider />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1.5, sm: 4 }}
      >
        <Stack spacing={0.25}>
          <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
            Instructor
          </Typography>
          <Typography sx={{ color: "text.primary" }}>
            {course.instructorName}
          </Typography>
        </Stack>

        <Stack spacing={0.25}>
          <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
            Credit Hours
          </Typography>
          <Typography sx={{ color: "text.primary" }}>
            {course.creditHours}
          </Typography>
        </Stack>

        <Stack spacing={0.25}>
          <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
            Recommended Level
          </Typography>
          <Typography sx={{ color: "text.primary" }}>
            Level {course.recommendedLevel}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  </Paper>
);

export default CourseOfferingCard;
