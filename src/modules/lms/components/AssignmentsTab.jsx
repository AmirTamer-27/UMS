import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import { useNavigate } from "react-router-dom";

import { getAssignments, createAssignment } from "../services/lmsService";

const AssignmentsTab = ({ courseOfferingId, userRole, userId }) => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const isInstructor = userRole === "instructor" || userRole === "admin" || userRole === "teacher" || userRole === "staff";

  useEffect(() => {
    loadAssignments();
  }, [courseOfferingId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await getAssignments(courseOfferingId);
      setAssignments(data || []);
    } catch (err) {
      setError(err.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !dueDate) {
      setCreateError("Please provide a title and a due date.");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");
      await createAssignment(courseOfferingId, title, description, new Date(dueDate).toISOString(), userId);
      setTitle("");
      setDescription("");
      setDueDate("");
      await loadAssignments();
    } catch (err) {
      setCreateError(err.message || "Failed to create assignment");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isInstructor && (
        <Card sx={{ mb: 4, bgcolor: "background.paper", border: 1, borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={0.5} sx={{ mb: 2.5 }}>
              <Typography variant="h6" fontWeight={900}>
                Create New Assignment
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Post coursework with a due date for registered students.
              </Typography>
            </Stack>
            <form onSubmit={handleCreate}>
              <Stack spacing={3}>
                <TextField
                  label="Assignment Title"
                  variant="outlined"
                  fullWidth
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={creating}
                />
                <TextField
                  label="Description / Prompt"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={creating}
                />
                <TextField
                  label="Due Date"
                  type="datetime-local"
                  variant="outlined"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={creating}
                />
                {createError && <Alert severity="error">{createError}</Alert>}
                <Box>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={creating}
                    startIcon={<AddTaskOutlinedIcon />}
                  >
                    {creating ? "Creating..." : "Create Assignment"}
                  </Button>
                </Box>
              </Stack>
            </form>
          </CardContent>
        </Card>
      )}

      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={900}>
          Assignments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {assignments.length} item{assignments.length === 1 ? "" : "s"}
        </Typography>
      </Stack>

      {assignments.length === 0 ? (
        <Card sx={{ border: 1, borderColor: "divider" }}>
          <CardContent>
            <Typography color="text.secondary">No assignments posted yet.</Typography>
          </CardContent>
        </Card>
      ) : (
        <List sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1 }}>
          {assignments.map((assignment) => (
            <ListItem
              key={assignment.id}
              divider
              sx={{
                cursor: "pointer",
                py: 1.5,
                "&:hover": { bgcolor: "rgba(30, 58, 138, 0.04)" },
              }}
              onClick={() => navigate(`/lms/courses/${courseOfferingId}/assignments/${assignment.id}`)}
            >
              <ListItemIcon>
                <AssignmentOutlinedIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={assignment.title}
                secondary={`Due: ${new Date(assignment.due_date).toLocaleString()}`}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default AssignmentsTab;
