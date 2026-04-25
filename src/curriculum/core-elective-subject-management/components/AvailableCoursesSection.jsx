import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CourseOfferingCard from "./CourseOfferingCard";

const AvailableCoursesSection = ({ courses, description, title }) => {
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
          <CourseOfferingCard course={course} key={course.id} />
        ))}
      </Stack>
    </Stack>
  );
};

export default AvailableCoursesSection;
