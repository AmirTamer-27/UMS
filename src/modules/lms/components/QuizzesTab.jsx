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
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";

import {
  createQuizWithQuestions,
  getCourseQuizzes,
  getMyQuizAttempt,
  getQuizQuestions,
  submitQuizAttempt,
} from "../services/lmsService";

const emptyQuestion = { question_text: "", correct_answer: "" };

const QuizzesTab = ({ canManageQuizzes, courseOfferingId, userId, userRole }) => {
  const [answers, setAnswers] = useState({});
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [myAttempts, setMyAttempts] = useState({});
  const [questionsByQuiz, setQuestionsByQuiz] = useState({});
  const [quizQuestions, setQuizQuestions] = useState([{ ...emptyQuestion }]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");

  const isStudent = userRole === "student";
  const selectedQuestions = questionsByQuiz[selectedQuizId] || [];

  const publishedQuizzes = useMemo(
    () => quizzes.filter((quiz) => canManageQuizzes || quiz.is_published),
    [canManageQuizzes, quizzes],
  );

  useEffect(() => {
    loadQuizzes();
  }, [courseOfferingId]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getCourseQuizzes(courseOfferingId);
      setQuizzes(data || []);
    } catch (err) {
      setError(err.message || "Failed to load quizzes.");
    } finally {
      setLoading(false);
    }
  };

  const loadQuizForAttempt = async (quizId) => {
    setSelectedQuizId(quizId);
    setAnswers({});
    setMessage("");
    setError("");

    if (!quizId) {
      return;
    }

    try {
      const [questions, attempt] = await Promise.all([
        getQuizQuestions(quizId, false),
        userId ? getMyQuizAttempt(quizId, userId) : Promise.resolve(null),
      ]);

      setQuestionsByQuiz((currentQuestions) => ({
        ...currentQuestions,
        [quizId]: questions || [],
      }));
      setMyAttempts((currentAttempts) => ({
        ...currentAttempts,
        [quizId]: attempt,
      }));
    } catch (err) {
      setError(err.message || "Failed to load quiz questions.");
    }
  };

  const updateQuestion = (index, field, value) => {
    setQuizQuestions((currentQuestions) =>
      currentQuestions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [field]: value } : question,
      ),
    );
  };

  const addQuestion = () => {
    setQuizQuestions((currentQuestions) => [...currentQuestions, { ...emptyQuestion }]);
  };

  const removeQuestion = (index) => {
    setQuizQuestions((currentQuestions) =>
      currentQuestions.filter((_, questionIndex) => questionIndex !== index),
    );
  };

  const handleCreateQuiz = async (event) => {
    event.preventDefault();
    setCreateError("");
    setMessage("");

    if (!title.trim()) {
      setCreateError("Quiz title is required.");
      return;
    }

    try {
      setCreating(true);
      await createQuizWithQuestions({
        courseOfferingId,
        title,
        description,
        questions: quizQuestions,
        userId,
      });
      setTitle("");
      setDescription("");
      setQuizQuestions([{ ...emptyQuestion }]);
      setMessage("Quiz created and published for this course.");
      await loadQuizzes();
    } catch (err) {
      setCreateError(err.message || "Failed to create quiz.");
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitAttempt = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const hasBlankAnswer = selectedQuestions.some(
      (question) => !answers[question.id]?.trim(),
    );

    if (hasBlankAnswer) {
      setError("Please answer every question before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      const attempt = await submitQuizAttempt({
        quizId: selectedQuizId,
        studentId: userId,
        questions: selectedQuestions,
        answers,
      });
      setMyAttempts((currentAttempts) => ({
        ...currentAttempts,
        [selectedQuizId]: attempt,
      }));
      setAnswers({});
      setMessage("Quiz submitted successfully.");
    } catch (err) {
      setError(err.message || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Stack spacing={3}>
      {message ? <Alert severity="success">{message}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      {canManageQuizzes ? (
        <Card sx={{ border: 1, borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={0.5} sx={{ mb: 2.5 }}>
              <Typography fontWeight={900} variant="h6">
                Create Course Quiz
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Add as many short-answer questions as this quiz needs.
              </Typography>
            </Stack>

            <Stack component="form" spacing={2.5} onSubmit={handleCreateQuiz}>
              <TextField
                disabled={creating}
                fullWidth
                label="Quiz Title"
                onChange={(event) => setTitle(event.target.value)}
                required
                value={title}
              />
              <TextField
                disabled={creating}
                fullWidth
                label="Quiz Description"
                multiline
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                value={description}
              />

              <Stack spacing={2}>
                {quizQuestions.map((question, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack
                          alignItems="center"
                          direction="row"
                          justifyContent="space-between"
                        >
                          <Typography fontWeight={800}>Question {index + 1}</Typography>
                          <Button
                            color="error"
                            disabled={creating || quizQuestions.length === 1}
                            onClick={() => removeQuestion(index)}
                            size="small"
                            startIcon={<DeleteOutlineOutlinedIcon />}
                          >
                            Remove
                          </Button>
                        </Stack>
                        <TextField
                          disabled={creating}
                          fullWidth
                          label="Question"
                          onChange={(event) =>
                            updateQuestion(index, "question_text", event.target.value)
                          }
                          required
                          value={question.question_text}
                        />
                        <TextField
                          disabled={creating}
                          fullWidth
                          label="Correct Answer"
                          onChange={(event) =>
                            updateQuestion(index, "correct_answer", event.target.value)
                          }
                          required
                          value={question.correct_answer}
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>

              {createError ? <Alert severity="error">{createError}</Alert> : null}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  disabled={creating}
                  onClick={addQuestion}
                  startIcon={<AddCircleOutlineOutlinedIcon />}
                  variant="outlined"
                >
                  Add Question
                </Button>
                <Button disabled={creating} type="submit" variant="contained">
                  {creating ? "Creating..." : "Create Quiz"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      <Card sx={{ border: 1, borderColor: "divider" }}>
        <CardContent>
          <Stack
            alignItems="baseline"
            direction="row"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Typography fontWeight={900} variant="h6">
              Course Quizzes
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {publishedQuizzes.length} item{publishedQuizzes.length === 1 ? "" : "s"}
            </Typography>
          </Stack>

          {!publishedQuizzes.length ? (
            <Typography color="text.secondary">No quizzes posted yet.</Typography>
          ) : (
            <List disablePadding>
              {publishedQuizzes.map((quiz) => {
                const isSelected = selectedQuizId === quiz.id;
                const attempt = myAttempts[quiz.id];

                return (
                  <Box key={quiz.id}>
                    <ListItem
                      alignItems="flex-start"
                      disableGutters
                      secondaryAction={
                        isStudent ? (
                          <Button
                            disabled={Boolean(attempt)}
                            onClick={() => loadQuizForAttempt(quiz.id)}
                            startIcon={<QuizOutlinedIcon />}
                            variant={isSelected ? "contained" : "outlined"}
                          >
                            {attempt ? "Submitted" : "Open"}
                          </Button>
                        ) : null
                      }
                    >
                      <ListItemText
                        primary={
                          <Stack alignItems="center" direction="row" spacing={1}>
                            <Typography fontWeight={800}>{quiz.title}</Typography>
                            {quiz.is_published ? (
                              <Chip color="success" label="Published" size="small" />
                            ) : (
                              <Chip label="Draft" size="small" />
                            )}
                          </Stack>
                        }
                        secondary={quiz.description || "No description provided."}
                      />
                    </ListItem>

                    {isSelected && isStudent ? (
                      <Box sx={{ pb: 2 }}>
                        {attempt ? (
                          <Alert severity="success">
                            Submitted at {new Date(attempt.submitted_at).toLocaleString()}.
                          </Alert>
                        ) : (
                          <Stack component="form" spacing={2} onSubmit={handleSubmitAttempt}>
                            {selectedQuestions.map((question, index) => (
                              <TextField
                                key={question.id}
                                fullWidth
                                label={`Question ${index + 1}: ${question.question_text}`}
                                onChange={(event) =>
                                  setAnswers((currentAnswers) => ({
                                    ...currentAnswers,
                                    [question.id]: event.target.value,
                                  }))
                                }
                                required
                                value={answers[question.id] || ""}
                              />
                            ))}
                            <Box>
                              <Button
                                disabled={submitting || !selectedQuestions.length}
                                type="submit"
                                variant="contained"
                              >
                                {submitting ? "Submitting..." : "Submit Quiz"}
                              </Button>
                            </Box>
                          </Stack>
                        )}
                      </Box>
                    ) : null}
                    <Divider />
                  </Box>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

export default QuizzesTab;
