import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export const courseCardSx = ({ compact, statusColor, statusLabel }) => ({
  bgcolor: "background.paper",
  border: 1,
  borderColor: statusLabel ? `${statusColor}.light` : "divider",
  borderRadius: 3,
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
  p: compact ? 2.25 : 3,
  transition:
    "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
  "&:hover": {
    borderColor: "primary.main",
    boxShadow: "0 22px 55px rgba(15, 23, 42, 0.1)",
    transform: "translateY(-1px)",
  },
});

const CourseTypeChip = ({ type }) => (
  <Chip
    color={type === "core" ? "primary" : "secondary"}
    label={type === "core" ? "Core" : "Elective"}
    size="small"
    variant="outlined"
  />
);

const CompactSeatChips = ({ course }) => (
  <Stack direction="row" flexWrap="wrap" gap={1}>
    <Chip
      label={`${course.availableSeats} seats available`}
      size="small"
      variant="outlined"
    />
    <Chip
      label={`${course.registeredCount} / ${course.seatLimit} registered`}
      size="small"
      variant="outlined"
    />
  </Stack>
);

export const CourseTitleBlock = ({ compact, course, statusColor, statusLabel }) => (
  <Stack spacing={1}>
    <Stack alignItems="center" direction="row" flexWrap="wrap" gap={1}>
      <Typography
        sx={{
          color: "text.secondary",
          fontSize: "0.95rem",
          fontWeight: 800,
        }}
      >
        {course.courseCode}
      </Typography>
      <CourseTypeChip type={course.courseType} />
    </Stack>

    <Typography
      component="h3"
      sx={{
        color: "text.primary",
        fontSize: compact ? "1rem" : "1.15rem",
        fontWeight: 800,
        lineHeight: 1.25,
      }}
    >
      {course.courseName}
    </Typography>

    <Typography sx={{ color: "text.secondary", lineHeight: 1.55 }}>
      Use view details to check course information and prerequisites.
    </Typography>

    {statusLabel ? (
      <Chip
        color={statusColor}
        label={statusLabel}
        size="small"
        sx={{ alignSelf: "flex-start" }}
      />
    ) : null}

    {compact ? <CompactSeatChips course={course} /> : null}
  </Stack>
);

export const SeatSummary = ({ course }) => (
  <Stack
    alignItems={{ xs: "flex-start", sm: "center" }}
    justifyContent="center"
    spacing={0.5}
    sx={{
      bgcolor: "background.default",
      border: 1,
      borderColor: "divider",
      borderRadius: 2,
      px: 2,
      py: 1.5,
      textAlign: { xs: "left", sm: "center" },
    }}
  >
    <Typography
      sx={{
        color: "text.secondary",
        fontSize: "0.8rem",
        fontWeight: 800,
        textTransform: "uppercase",
      }}
    >
      Seats
    </Typography>
    <Typography
      sx={{
        color: "text.primary",
        fontSize: "1.8rem",
        fontWeight: 900,
        lineHeight: 1,
      }}
    >
      {course.availableSeats}
    </Typography>
    <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }}>
      {course.registeredCount} / {course.seatLimit} registered
    </Typography>
  </Stack>
);

export const CourseActions = ({
  actionDisabled,
  actionLabel,
  actionLoading,
  actionLoadingLabel,
  actionVariant,
  compact,
  course,
  onAction,
  onViewDetails,
}) => (
  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
    <Button
      fullWidth={compact}
      onClick={() => onViewDetails?.(course)}
      variant="outlined"
    >
      View details
    </Button>
    {actionLabel ? (
      <Button
        disabled={actionDisabled || actionLoading}
        fullWidth={compact}
        onClick={() => onAction?.(course)}
        variant={actionVariant}
      >
        {actionLoading ? actionLoadingLabel : actionLabel}
      </Button>
    ) : null}
  </Stack>
);
