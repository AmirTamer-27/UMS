import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CourseOfferingCard from "./CourseOfferingCard";

const AvailableCoursesSection = ({
  actionLoadingId,
  courses,
  description,
  onAddCourse,
  onViewCourse,
  title,
}) => {
  if (!courses.length) {
    return null;
  }

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.5}>
        <Typography
          component="h2"
          sx={{ color: "text.primary", fontSize: "1.25rem", fontWeight: 800 }}
        >
          {title}
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>{description}</Typography>
      </Stack>

      <Stack spacing={2}>
        {courses.map((course) => (
          <CourseOfferingCard
            actionDisabled={course.availableSeats <= 0}
            actionLabel={
              course.availableSeats <= 0 ? "Full" : "Add to selection"
            }
            actionLoading={actionLoadingId === course.id}
            course={course}
            key={course.id}
            onAction={onAddCourse}
            onViewDetails={onViewCourse}
          />
        ))}
      </Stack>
    </Stack>
  );
};

export default AvailableCoursesSection;
