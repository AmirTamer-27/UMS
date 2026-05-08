import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  getCourseAssignmentSubmissions,
  getCourseQuizAttempts,
  updateAssignmentSubmissionGrade,
  updateQuizAttemptGrade,
} from "../services/lmsService";

const getStudentName = (item) =>
  item.profiles?.full_name || item.profiles?.email || "Student";

const SubmissionsTab = ({ canReview, courseOfferingId }) => {
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [savingKey, setSavingKey] = useState("");

  const submissionCount = useMemo(
    () => assignmentSubmissions.length + quizAttempts.length,
    [assignmentSubmissions.length, quizAttempts.length],
  );

  useEffect(() => {
    loadSubmissions();
  }, [courseOfferingId]);

  const loadSubmissions = async () => {
    if (!canReview) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const [assignmentRows, quizRows] = await Promise.all([
        getCourseAssignmentSubmissions(courseOfferingId),
        getCourseQuizAttempts(courseOfferingId),
      ]);
      setAssignmentSubmissions(assignmentRows || []);
      setQuizAttempts(quizRows || []);
    } catch (err) {
      setError(err.message || "Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  };

  const getDraftValue = (key, field, fallback) => drafts[key]?.[field] ?? fallback ?? "";

  const updateDraft = (key, field, value) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [key]: {
        ...currentDrafts[key],
        [field]: value,
      },
    }));
  };

  const saveGrade = async (type, id) => {
    const key = `${type}:${id}`;
    const draft = drafts[key] || {};

    setError("");
    setMessage("");
    setSavingKey(key);

    try {
      if (type === "assignment") {
        const current = assignmentSubmissions.find((item) => item.id === id);
        await updateAssignmentSubmissionGrade(
          id,
          draft.grade ?? current?.grade ?? "",
        );
      } else {
        const current = quizAttempts.find((item) => item.id === id);
        await updateQuizAttemptGrade(
          id,
          draft.grade ?? current?.grade ?? "",
        );
      }

      setMessage("Grade saved.");
      await loadSubmissions();
    } catch (err) {
      setError(err.message || "Failed to save grade.");
    } finally {
      setSavingKey("");
    }
  };

  if (!canReview) {
    return (
      <Alert severity="warning">
        Only the assigned professor/instructor or an admin can review submissions.
      </Alert>
    );
  }

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Stack spacing={3}>
      {message ? <Alert severity="success">{message}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack alignItems="baseline" direction="row" justifyContent="space-between">
        <Typography fontWeight={900} variant="h6">
          Submitted Work
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {submissionCount} item{submissionCount === 1 ? "" : "s"}
        </Typography>
      </Stack>

      {!submissionCount ? (
        <Card sx={{ border: 1, borderColor: "divider" }}>
          <CardContent>
            <Typography color="text.secondary">
              No assignment submissions or quiz attempts yet.
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      {assignmentSubmissions.map((submission) => {
        const key = `assignment:${submission.id}`;

        return (
          <Card key={key} sx={{ border: 1, borderColor: "divider" }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Chip color="primary" label="Assignment" size="small" />
                  <Typography fontWeight={900}>
                    {submission.assignments?.title || "Assignment"}
                  </Typography>
                </Stack>
                <Typography color="text.secondary" variant="body2">
                  {getStudentName(submission)} submitted at{" "}
                  {new Date(submission.submitted_at).toLocaleString()}
                </Typography>
                <Typography sx={{ whiteSpace: "pre-wrap" }}>
                  {submission.submission_text || submission.file_path || "No text submission."}
                </Typography>
                <Divider />
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Grade"
                    onChange={(event) => updateDraft(key, "grade", event.target.value)}
                    size="small"
                    type="number"
                    value={getDraftValue(key, "grade", submission.grade)}
                  />
                  <Box>
                    <Button
                      disabled={savingKey === key}
                      onClick={() => saveGrade("assignment", submission.id)}
                      variant="contained"
                    >
                      {savingKey === key ? "Saving..." : "Save"}
                    </Button>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}

      {quizAttempts.map((attempt) => {
        const key = `quiz:${attempt.id}`;

        return (
          <Card key={key} sx={{ border: 1, borderColor: "divider" }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Chip color="secondary" label="Quiz" size="small" />
                  <Typography fontWeight={900}>
                    {attempt.quizzes?.title || "Quiz"}
                  </Typography>
                </Stack>
                <Typography color="text.secondary" variant="body2">
                  {getStudentName(attempt)} submitted at{" "}
                  {new Date(attempt.submitted_at).toLocaleString()}
                </Typography>
                <Stack spacing={1}>
                  {(attempt.quiz_answers || []).map((answer, index) => (
                    <Box key={`${attempt.id}-${index}`}>
                      <Typography fontWeight={800} variant="body2">
                        {answer.quiz_questions?.question_text || `Question ${index + 1}`}
                      </Typography>
                      <Typography sx={{ whiteSpace: "pre-wrap" }}>
                        Answer: {answer.answer_text || "-"}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        Expected: {answer.quiz_questions?.correct_answer || "-"}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
                <Divider />
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Grade"
                    onChange={(event) => updateDraft(key, "grade", event.target.value)}
                    size="small"
                    type="number"
                    value={getDraftValue(key, "grade", attempt.grade)}
                  />
                  <Box>
                    <Button
                      disabled={savingKey === key}
                      onClick={() => saveGrade("quiz", attempt.id)}
                      variant="contained"
                    >
                      {savingKey === key ? "Saving..." : "Save"}
                    </Button>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};

export default SubmissionsTab;
