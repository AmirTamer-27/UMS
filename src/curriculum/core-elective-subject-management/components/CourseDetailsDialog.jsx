import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const DetailBlock = ({ label, value }) => (
  <Stack spacing={0.5}>
    <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
      {label}
    </Typography>
    <Typography sx={{ color: "text.primary" }}>{value}</Typography>
  </Stack>
);

const CourseDetailsDialog = ({
  course,
  error,
  loading,
  onClose,
  open,
  prerequisites,
}) => (
  <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
    <DialogTitle sx={{ pb: 1.5 }}>
      <Stack spacing={1}>
        <Stack alignItems="center" direction="row" spacing={1}>
          <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
            {course?.courseCode}
          </Typography>
          <Chip
            color={course?.courseType === "core" ? "primary" : "secondary"}
            label={course?.courseType === "core" ? "Core" : "Elective"}
            size="small"
            variant="outlined"
          />
        </Stack>
        <Typography
          component="div"
          sx={{ color: "text.primary", fontSize: "1.6rem", fontWeight: 800 }}
        >
          {course?.courseName}
        </Typography>
      </Stack>
    </DialogTitle>
    <DialogContent>
      <Stack spacing={3}>
        <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
          {course?.description || "No course description has been added yet."}
        </Typography>

        <Divider />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2, sm: 4 }}>
          <DetailBlock label="Credit Hours" value={course?.creditHours ?? "-"} />
          <DetailBlock
            label="Course Type"
            value={course?.courseType === "core" ? "Core" : "Elective"}
          />
          <DetailBlock label="Instructor" value={course?.instructorName || "Staff TBA"} />
          <DetailBlock label="Available Seats" value={course?.availableSeats ?? "-"} />
        </Stack>

        <Divider />

        <Stack spacing={1.5}>
          <Typography
            component="h3"
            sx={{ color: "text.primary", fontSize: "1.05rem", fontWeight: 800 }}
          >
            Prerequisites
          </Typography>

          {loading ? (
            <Box sx={{ alignItems: "center", display: "flex", minHeight: 80 }}>
              <CircularProgress size={24} />
            </Box>
          ) : null}

          {!loading && error ? (
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          ) : null}

          {!loading && !error && !prerequisites.length ? (
            <Typography sx={{ color: "text.secondary" }}>
              No prerequisites.
            </Typography>
          ) : null}

          {!loading && !error && prerequisites.length ? (
            <Stack spacing={1}>
              {prerequisites.map((item) => (
                <Typography key={item.id} sx={{ color: "text.primary" }}>
                  {item.code} - {item.name}
                </Typography>
              ))}
            </Stack>
          ) : null}
        </Stack>
      </Stack>
    </DialogContent>
  </Dialog>
);

export default CourseDetailsDialog;
