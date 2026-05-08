import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import MainLayout from "../../../shared/components/layout/MainLayout";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../services/supabase";

export default function ReviewSubmissionsPage() {
  const { profile } = useAuth();

  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState({});
  const [feedback, setFeedback] = useState({});
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    const { data, error } = await supabase
      .from("assignment_submissions")
      .select(
        "id, submission_text, file_path, submitted_at, grade, feedback, assignments(title), profiles(full_name)"
      )
      .order("submitted_at", { ascending: false });

    if (error) setErrorMessage(error.message);
    else setSubmissions(data || []);
  };

  const handleSave = async (submissionId) => {
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("assignment_submissions")
      .update({
        grade: grades[submissionId],
        feedback: feedback[submissionId],
      })
      .eq("id", submissionId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Grade and feedback saved successfully.");
    loadSubmissions();
  };

  const isProfessor =
    profile?.role === "admin" ||
    profile?.role === "teacher" ||
    profile?.role === "instructor" ||
    profile?.role === "staff";

  return (
    <MainLayout profile={profile}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight="900">
              Review Submissions
            </Typography>
            <Typography color="text.secondary">
              Review submitted work and provide grades with feedback.
            </Typography>
          </Box>

          {!isProfessor && (
            <Alert severity="warning">
              Only professors, instructors, staff, or admins can review submissions.
            </Alert>
          )}

          {message && <Alert severity="success">{message}</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Paper sx={{ overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Assignment</TableCell>
                  <TableCell>Submission</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Feedback</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>No submissions found.</TableCell>
                  </TableRow>
                ) : (
                  submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>{submission.profiles?.full_name || "Student"}</TableCell>
                      <TableCell>{submission.assignments?.title || "-"}</TableCell>
                      <TableCell>
                        {submission.submission_text || submission.file_path || "-"}
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={grades[submission.id] ?? submission.grade ?? ""}
                          onChange={(e) =>
                            setGrades({ ...grades, [submission.id]: e.target.value })
                          }
                          disabled={!isProfessor}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={feedback[submission.id] ?? submission.feedback ?? ""}
                          onChange={(e) =>
                            setFeedback({ ...feedback, [submission.id]: e.target.value })
                          }
                          disabled={!isProfessor}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleSave(submission.id)}
                          disabled={!isProfessor}
                        >
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Stack>
      </Container>
    </MainLayout>
  );
}