import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

const actionIcons = {
  "Browse Courses": LibraryBooksOutlinedIcon,
  "My Registrations": FactCheckOutlinedIcon,
  "Submit Assignment": AssignmentTurnedInOutlinedIcon,
  "Upload Material": CloudUploadOutlinedIcon,
  "Create Assignment": AddCircleOutlinedIcon,
  "View Submissions": FactCheckOutlinedIcon,
  "Create Student": PersonAddAltOutlinedIcon,
  "Update Student": EditOutlinedIcon,
  "Create Staff": SchoolOutlinedIcon,
  "Send Message": MessageOutlinedIcon,
};

const QuickActions = ({ actions }) => (
  <Card>
    <CardContent sx={{ p: 3 }}>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography fontWeight={900} variant="h6">
            Quick Actions
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Common tasks for your role are grouped here for fast access.
          </Typography>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} useFlexGap flexWrap="wrap">
          {actions.map((action, index) => {
            const Icon = actionIcons[action.label] || AddCircleOutlinedIcon;

            return (
              <Button
                color={action.color || "primary"}
                key={action.label}
                size="large"
                startIcon={<Icon />}
                onClick={action.onClick}
                variant={action.variant || (index === 0 ? "contained" : "outlined")}
                sx={{
                  minHeight: 44,
                  px: 2.5,
                  boxShadow:
                    index === 0 ? "0 8px 18px rgba(30, 58, 138, 0.18)" : "none",
                }}
              >
                {action.label}
              </Button>
            );
          })}
        </Stack>
      </Stack>
    </CardContent>
  </Card>
);

export default QuickActions;
