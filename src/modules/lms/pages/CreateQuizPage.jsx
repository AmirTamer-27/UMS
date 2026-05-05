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

export default function CreateQuizPage() {
  const { profile, user } = useAuth();

  const [courseOfferings, setCourseOfferings] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [quiz, setQuiz] = useState({
    course_offering_id: "",
    title: "",
    description: "",
  });

  const [question, setQuestion] = useState({
    question_text: "",
    correct_answer: "",
  });

  useEffect(() => {
    loadCourseOfferings();
  }, []);

  const loadCourseOfferings = async () => {
    const { data, error } = await supabase
      .from("course_offerings")
      .select("id, courses(name, code)")
      .order("created_at", { ascending: false });

    if (error) setErrorMessage(error.message);
    else setCourseOfferings(data || []);
  };

  const handleQuizChange = (e) => {
    setQuiz({ ...quiz, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (e) => {
    setQuestion({ ...question, [e.target.name]: e.target.value });
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");

    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .insert([
        {
          course_offering_id: quiz.course_offering_id,
          title: quiz.title,
          description: quiz.description,
          created_by: user?.id,
          is_published: true,
        },
      ])
      .select()
      .single();

    if (quizError) {
      setErrorMessage(quizError.message);
      return;
    }

    const { error: questionError } = await supabase.from("quiz_questions").insert([
      {
        quiz_id: quizData.id,
        question_text: question.question_text,
        correct_answer: question.correct_answer,
      },
    ]);

    if (questionError) {
      setErrorMessage(questionError.message);
      return;
    }

    setMessage("Quiz created successfully and linked to the course.");
    setQuiz({ course_offering_id: "", title: "", description: "" });
    setQuestion({ question_text: "", correct_answer: "" });
  };

  const isInstructor =
    profile?.role === "admin" ||
    profile?.role === "teacher" ||
    profile?.role === "instructor" ||
    profile?.role === "staff";

  return (
    <MainLayout profile={profile}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight="900">
              Create Quiz
            </Typography>
            <Typography color="text.secondary">
              Create quizzes, add questions, and link them to a course.
            </Typography>
          </Box>

          {!isInstructor && (
            <Alert severity="warning">
              Only instructors, teachers, staff, or admins can create quizzes.
            </Alert>
          )}

          {message && <Alert severity="success">{message}</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Paper sx={{ p: 3 }}>
            <Stack component="form" spacing={2} onSubmit={handleCreateQuiz}>
              <TextField
                select
                label="Course Offering"
                name="course_offering_id"
                value={quiz.course_offering_id}
                onChange={handleQuizChange}
                required
                disabled={!isInstructor}
              >
                {courseOfferings.map((offering) => (
                  <MenuItem key={offering.id} value={offering.id}>
                    {offering.courses?.code} - {offering.courses?.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Quiz Title"
                name="title"
                value={quiz.title}
                onChange={handleQuizChange}
                required
                disabled={!isInstructor}
              />

              <TextField
                label="Quiz Description"
                name="description"
                value={quiz.description}
                onChange={handleQuizChange}
                multiline
                rows={3}
                disabled={!isInstructor}
              />

              <TextField
                label="Question"
                name="question_text"
                value={question.question_text}
                onChange={handleQuestionChange}
                required
                disabled={!isInstructor}
              />

              <TextField
                label="Correct Answer"
                name="correct_answer"
                value={question.correct_answer}
                onChange={handleQuestionChange}
                required
                disabled={!isInstructor}
              />

              <Button type="submit" variant="contained" disabled={!isInstructor}>
                Create Quiz
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </MainLayout>
  );
}