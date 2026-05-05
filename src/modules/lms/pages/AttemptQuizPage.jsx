import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import MainLayout from "../../../shared/components/layout/MainLayout";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../services/supabase";

export default function AttemptQuizPage() {
  const { profile, user } = useAuth();

  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    const { data, error } = await supabase
      .from("quizzes")
      .select("id, title, course_offering_id, course_offerings(courses(name, code))")
      .eq("is_published", true);

    if (error) setErrorMessage(error.message);
    else setQuizzes(data || []);
  };

  const loadQuestions = async (quizId) => {
    setSelectedQuizId(quizId);
    setMessage("");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("quiz_questions")
      .select("id, question_text")
      .eq("quiz_id", quizId);

    if (error) setErrorMessage(error.message);
    else setQuestions(data || []);
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");

    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert([
        {
          quiz_id: selectedQuizId,
          student_user_id: user?.id,
          submitted_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (attemptError) {
      setErrorMessage(attemptError.message);
      return;
    }

    const answerRows = questions.map((q) => ({
      attempt_id: attempt.id,
      question_id: q.id,
      answer_text: answers[q.id] || "",
    }));

    const { error: answersError } = await supabase
      .from("quiz_answers")
      .insert(answerRows);

    if (answersError) {
      setErrorMessage(answersError.message);
      return;
    }

    setMessage("Quiz submitted successfully. Your submission was recorded.");
    setSelectedQuizId("");
    setQuestions([]);
    setAnswers({});
  };

  return (
    <MainLayout profile={profile}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight="900">
              Attempt Quiz
            </Typography>
            <Typography color="text.secondary">
              Start a quiz, submit answers, and receive confirmation.
            </Typography>
          </Box>

          {message && <Alert severity="success">{message}</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                select
                label="Select Quiz"
                value={selectedQuizId}
                onChange={(e) => loadQuestions(e.target.value)}
                required
              >
                {quizzes.map((quiz) => (
                  <MenuItem key={quiz.id} value={quiz.id}>
                    {quiz.title} — {quiz.course_offerings?.courses?.code}
                  </MenuItem>
                ))}
              </TextField>

              {selectedQuizId && (
                <Stack component="form" spacing={2} onSubmit={handleSubmit}>
                  {questions.map((q, index) => (
                    <TextField
                      key={q.id}
                      label={`Question ${index + 1}: ${q.question_text}`}
                      value={answers[q.id] || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      required
                    />
                  ))}

                  <Button type="submit" variant="contained">
                    Submit Quiz
                  </Button>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </MainLayout>
  );
}