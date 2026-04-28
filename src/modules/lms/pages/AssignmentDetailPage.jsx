import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Button,
  Stack,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";

import MainLayout from "../../../shared/components/layout/MainLayout";
import { supabase } from "../../../services/supabase";
import {
  getAssignmentDetails,
  getAssignmentSubmissions,
  submitAssignment,
  getMySubmission,
  getMaterialDownloadUrl,
} from "../services/lmsService";

const AssignmentDetailPage = () => {
  const { assignmentId, courseOfferingId } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [submissions, setSubmissions] = useState([]);
  const [mySubmission, setMySubmission] = useState(null);

  // Student submission form state
  const [submissionText, setSubmissionText] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    loadData();
  }, [assignmentId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) throw new Error("Not authenticated");
      setUser(currentUser);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      if (profileError) throw profileError;
      setProfile(profileData);

      const assignmentData = await getAssignmentDetails(assignmentId);
      setAssignment(assignmentData);

      const isInstructor = profileData.role === "instructor" || profileData.role === "admin" || profileData.role === "teacher" || profileData.role === "staff";

      if (isInstructor) {
        const subs = await getAssignmentSubmissions(assignmentId);
        setSubmissions(subs || []);
      } else {
        const mySub = await getMySubmission(assignmentId, currentUser.id);
        setMySubmission(mySub);
      }

    } catch (err) {
      setError(err.message || "Failed to load assignment details");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submissionText && !file) {
      setSubmitError("Please provide some text or attach a file.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");
      const newSub = await submitAssignment(assignmentId, user.id, submissionText, file);
      setMySubmission(newSub);
    } catch (err) {
      setSubmitError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (filePath) => {
    try {
      const url = await getMaterialDownloadUrl(filePath);
      if (url) {
        window.open(url, "_blank");
      }
    } catch (err) {
      alert("Failed to get download link");
    }
  };

  const isInstructor = profile?.role === "instructor" || profile?.role === "admin" || profile?.role === "teacher" || profile?.role === "staff";

  if (loading) {
    return (
      <MainLayout profile={profile}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout profile={profile}>
      <Container maxWidth="xl" disableGutters={false} sx={{ pl: 1, pr: 2, py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {assignment && (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" fontWeight="900" color="primary">
                  {assignment.title}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Due: {new Date(assignment.due_date).toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Card sx={{ bgcolor: "background.paper", mb: 4 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Prompt / Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", color: "text.primary" }}>
                  {assignment.description || "No description provided."}
                </Typography>
              </CardContent>
            </Card>

            {isInstructor ? (
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Student Submissions
                </Typography>
                {submissions.length === 0 ? (
                  <Typography color="text.secondary">No submissions yet.</Typography>
                ) : (
                  <List sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
                    {submissions.map((sub) => (
                      <ListItem
                        key={sub.id}
                        divider
                        secondaryAction={
                          sub.file_path && (
                            <IconButton
                              edge="end"
                              aria-label="download file"
                              onClick={() => handleDownload(sub.file_path)}
                            >
                              <DownloadOutlinedIcon />
                            </IconButton>
                          )
                        }
                      >
                        <ListItemIcon>
                          <PersonOutlineIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={sub.profiles?.full_name || "Unknown Student"}
                          secondary={`Submitted: ${new Date(sub.submitted_at).toLocaleString()}${sub.submission_text ? ` - "${sub.submission_text.substring(0, 50)}..."` : ''}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Your Submission
                </Typography>
                {mySubmission ? (
                  <Card sx={{ bgcolor: "success.light", color: "success.contrastText", mb: 4 }}>
                    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <CheckCircleOutlineIcon fontSize="large" color="success" />
                      <Box>
                        <Typography variant="h6">Submitted Successfully</Typography>
                        <Typography variant="body2">
                          At {new Date(mySubmission.submitted_at).toLocaleString()}
                        </Typography>
                        {mySubmission.file_path && (
                          <Button
                            variant="text"
                            color="inherit"
                            sx={{ mt: 1, p: 0, minWidth: "auto", textDecoration: "underline" }}
                            onClick={() => handleDownload(mySubmission.file_path)}
                          >
                            View Uploaded File
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ) : (
                  <Card sx={{ bgcolor: "background.paper" }}>
                    <CardContent>
                      <form onSubmit={handleSubmit}>
                        <Stack spacing={3}>
                          <TextField
                            label="Text Submission (Optional if attaching a file)"
                            variant="outlined"
                            fullWidth
                            multiline
                            rows={4}
                            value={submissionText}
                            onChange={(e) => setSubmissionText(e.target.value)}
                            disabled={submitting}
                          />
                          <Box>
                            <Button
                              variant="outlined"
                              component="label"
                              startIcon={<CloudUploadOutlinedIcon />}
                              disabled={submitting}
                            >
                              Select File
                              <input type="file" hidden onChange={handleFileChange} />
                            </Button>
                            {file && (
                              <Typography variant="caption" sx={{ ml: 2, color: "text.secondary" }}>
                                {file.name}
                              </Typography>
                            )}
                          </Box>
                          {submitError && <Alert severity="error">{submitError}</Alert>}
                          <Box>
                            <Button
                              type="submit"
                              variant="contained"
                              color="primary"
                              disabled={submitting}
                            >
                              {submitting ? "Submitting..." : "Submit Assignment"}
                            </Button>
                          </Box>
                        </Stack>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}
          </Box>
        )}
      </Container>
    </MainLayout>
  );
};

export default AssignmentDetailPage;
