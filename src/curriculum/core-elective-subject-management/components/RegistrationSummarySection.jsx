import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";

import {
  ConfirmedRegistrations,
  DraftSelectionList,
  SubmitPanel,
  SummaryHeader,
} from "./RegistrationSummaryParts";

const RegistrationSummarySection = ({
  actionLoadingId,
  confirming,
  onConfirm,
  onRemoveCourse,
  onViewCourse,
  registeredCourses,
  selectedCourses,
}) => (
  <Paper
    elevation={0}
    sx={{
      border: 1,
      borderColor: "divider",
      borderRadius: 3,
      boxShadow: "0 24px 70px rgba(15, 23, 42, 0.08)",
      overflow: "hidden",
      position: { lg: "sticky" },
      top: { lg: 24 },
    }}
  >
    <Stack spacing={0}>
      <SummaryHeader selectedCount={selectedCourses.length} />
      <Stack spacing={3} sx={{ p: { xs: 2.5, md: 3 } }}>
        <DraftSelectionList
          actionLoadingId={actionLoadingId}
          onRemoveCourse={onRemoveCourse}
          onViewCourse={onViewCourse}
          registeredCourses={registeredCourses}
          selectedCourses={selectedCourses}
        />
        <SubmitPanel
          confirming={confirming}
          onConfirm={onConfirm}
          selectedCount={selectedCourses.length}
        />
        <ConfirmedRegistrations
          courses={registeredCourses}
          onViewCourse={onViewCourse}
        />
      </Stack>
    </Stack>
  </Paper>
);

export default RegistrationSummarySection;
