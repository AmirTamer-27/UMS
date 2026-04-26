import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";

import {
  CourseActions,
  CourseTitleBlock,
  SeatSummary,
  courseCardSx,
} from "./CourseOfferingCardParts";

const CourseOfferingCard = ({
  actionDisabled = false,
  actionLabel,
  actionLoading = false,
  actionLoadingLabel = "Saving...",
  actionVariant = "contained",
  compact = false,
  course,
  onAction,
  onViewDetails,
  statusColor = "success",
  statusLabel,
}) => (
  <Paper
    elevation={0}
    sx={courseCardSx({ compact, statusColor, statusLabel })}
  >
    <Stack spacing={compact ? 1.75 : 2.25}>
      <Box
        sx={{
          display: "grid",
          gap: compact ? 1.5 : 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: compact ? "1fr" : "minmax(0, 1fr) 150px",
          },
        }}
      >
        <CourseTitleBlock
          compact={compact}
          course={course}
          statusColor={statusColor}
          statusLabel={statusLabel}
        />
        {!compact ? <SeatSummary course={course} /> : null}
      </Box>

      <CourseActions
        actionDisabled={actionDisabled}
        actionLabel={actionLabel}
        actionLoading={actionLoading}
        actionLoadingLabel={actionLoadingLabel}
        actionVariant={actionVariant}
        compact={compact}
        course={course}
        onAction={onAction}
        onViewDetails={onViewDetails}
      />
    </Stack>
  </Paper>
);

export default CourseOfferingCard;
