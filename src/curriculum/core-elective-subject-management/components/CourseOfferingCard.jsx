import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const CourseOfferingCard = ({ course, onSelect }) => (
  <Paper
    elevation={0}
    onClick={() => onSelect?.(course)}
    sx={{
      cursor: "pointer",
      border: 1,
      borderColor: "divider",
      borderRadius: 2,
      p: 3,
      transition: "border-color 0.2s ease, transform 0.2s ease",
      "&:hover": {
        borderColor: "primary.main",
        transform: "translateY(-1px)",
      },
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
          <Typography sx={{ color: "text.secondary" }}>
            Click to view course details and prerequisites.
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
        </Stack>
      </Stack>
    </Stack>
  </Paper>
);

export default CourseOfferingCard;
