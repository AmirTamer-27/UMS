import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
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
  "Find Professors": PersonSearchOutlinedIcon,
  "Send Message": MessageOutlinedIcon,
};

const actionRoutes = {
  "Browse Courses": "/courses/registration",
  "My Registrations": "/courses/registration",
  "Create Student": "/admin/student-records",
  "Update Student": "/admin/student-records",
  "Create Staff": "/admin/staff/create",
  "Find Professors": "/student/professors",
};

const QuickActions = ({ actions, profile }) => {
  const navigate = useNavigate();

  const handleClick = (action) => {
    if (action.onClick) {
      action.onClick();
      return;
    }

    if (action.label === "Send Message") {
      if (profile?.role === "parent") {
        navigate("/parent/messages");
      } else {
        navigate("/teacher/messages");
      }
      return;
    }

    const route = action.to || actionRoutes[action.label];
    if (route) {
      navigate(route);
    }
  };

  return (
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

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
          >
            {actions.map((action, index) => {
              const Icon =
                actionIcons[action.label] || AddCircleOutlinedIcon;

              return (
                <Button
                  key={action.label}
                  color={action.color || "primary"}
                  size="large"
                  startIcon={<Icon />}
                  variant={
                    action.variant || (index === 0 ? "contained" : "outlined")
                  }
                  onClick={() => handleClick(action)}
                  sx={{
                    minHeight: 44,
                    px: 2.5,
                    boxShadow:
                      index === 0
                        ? "0 8px 18px rgba(30, 58, 138, 0.18)"
                        : "none",
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
};

export default QuickActions;
