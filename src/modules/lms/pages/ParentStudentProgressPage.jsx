import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from "@mui/material";
import { supabase } from "../../../services/supabase/client";
import { useAuth } from "../../../context/AuthContext";

const getGradeLabel = (grade) =>
  grade === null || grade === undefined || grade === "" ? "Not graded" : grade;

const formatDueDate = (dateValue) => {
  if (!dateValue) {
    return "No Due Date";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "No Due Date";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const ParentStudentProgressPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [progressData, setProgressData] = useState({
    courses: [],
    assignments: [],
    quizzes: [],
  });

  useEffect(() => {
    const fetchLinkedStudents = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("parent_student_links")
          .select("student_user_id, profiles!parent_student_links_student_user_id_fkey(full_name)")
          .eq("parent_user_id", user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          setLinkedStudents(data);
          setSelectedStudentId(data[0].student_user_id);
        }
      } catch (err) {
        console.error("Error fetching linked students:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedStudents();
  }, [user]);

  useEffect(() => {
    const fetchStudentProgress = async () => {
      if (!selectedStudentId) return;
      setLoading(true);
      try {
        // 1. Fetch Registrations (Courses)
        const { data: registrations, error: regError } = await supabase
          .from("registrations")
          .select(`
            status,
            course_offerings (
              id,
              courses (name, code)
            )
          `)
          .eq("student_user_id", selectedStudentId)
          .neq("status", "dropped");

        if (regError) throw regError;

        const courses = registrations.map(r => ({
          id: r.course_offerings.id,
          name: r.course_offerings.courses.name,
          code: r.course_offerings.courses.code,
          status: r.status
        }));

        const offeringIds = courses.map(c => c.id);

        let assignmentsList = [];

        if (offeringIds.length > 0) {
          // 2. Fetch Assignments for these courses
          const { data: assignments, error: assignError } = await supabase
            .from("assignments")
            .select(`
              id,
              title,
              due_date,
              course_offerings (
                courses (name)
              )
            `)
            .in("course_offering_id", offeringIds);

          if (assignError) throw assignError;

          // 3. Fetch student's submissions
          const { data: submissions, error: subError } = await supabase
            .from("assignment_submissions")
            .select("assignment_id, submitted_at, is_late, grade")
            .eq("student_user_id", selectedStudentId);

          if (subError) throw subError;

          const submissionMap = {};
          submissions.forEach(sub => {
            submissionMap[sub.assignment_id] = sub;
          });

          assignmentsList = assignments.map(assign => {
            const submission = submissionMap[assign.id];
            let status = "Missing";
            let color = "error";

            if (submission) {
              if (submission.is_late) {
                status = "Submitted Late";
                color = "warning";
              } else {
                status = "Submitted";
                color = "success";
              }
            }

            return {
              id: assign.id,
              courseName: assign.course_offerings.courses.name,
              title: assign.title,
              dueDate: assign.due_date,
              status,
              color,
              submittedAt: submission ? submission.submitted_at : null,
              grade: submission?.grade ?? null,
            };
          }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        }

        let quizzesList = [];

        if (offeringIds.length > 0) {
          const { data: quizzes, error: quizzesError } = await supabase
            .from("quizzes")
            .select(`
              id,
              title,
              course_offering_id,
              course_offerings (
                courses (name)
              )
            `)
            .eq("is_published", true)
            .in("course_offering_id", offeringIds);

          if (quizzesError) throw quizzesError;

          const { data: quizAttempts, error: quizAttemptsError } = await supabase
            .from("quiz_attempts")
            .select("quiz_id, submitted_at, grade")
            .eq("student_user_id", selectedStudentId)
            .in("quiz_id", (quizzes || []).map((quiz) => quiz.id));

          if (quizAttemptsError) throw quizAttemptsError;

          const attemptMap = {};
          (quizAttempts || []).forEach((attempt) => {
            attemptMap[attempt.quiz_id] = attempt;
          });

          quizzesList = (quizzes || []).map((quiz) => ({
            id: quiz.id,
            courseName: quiz.course_offerings?.courses?.name || "-",
            title: quiz.title || "Quiz",
            submittedAt: attemptMap[quiz.id]?.submitted_at || null,
            grade: attemptMap[quiz.id]?.grade ?? null,
            status: attemptMap[quiz.id] ? "Submitted" : "Not attempted",
            color: attemptMap[quiz.id] ? "success" : "default",
          }));
        }

        setProgressData({ courses, assignments: assignmentsList, quizzes: quizzesList });

      } catch (err) {
        console.error("Error fetching student progress:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProgress();
  }, [selectedStudentId]);

  if (loading && linkedStudents.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={800} color="primary" gutterBottom>
        Academic Progress
      </Typography>

      {linkedStudents.length === 0 ? (
        <Card sx={{ mt: 4, p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            No students are currently linked to your account.
          </Typography>
        </Card>
      ) : (
        <>
          <Box sx={{ mb: 4, maxWidth: 300 }}>
            <FormControl fullWidth>
              <InputLabel id="student-select-label">Select Child</InputLabel>
              <Select
                labelId="student-select-label"
                value={selectedStudentId}
                label="Select Child"
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {linkedStudents.map((link) => (
                  <MenuItem key={link.student_user_id} value={link.student_user_id}>
                    {link.profiles?.full_name || "Unknown Student"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={4}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Registered Courses
                  </Typography>
                  {progressData.courses.length > 0 ? (
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {progressData.courses.map(course => (
                        <Chip
                          key={course.id}
                          label={`${course.code} - ${course.name}`}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography color="text.secondary">No courses found.</Typography>
                  )}
                </CardContent>
              </Card>

              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Assignment Progress
                  </Typography>
                  {progressData.assignments.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead sx={{ bgcolor: "background.default" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Course</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Assignment</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {progressData.assignments.map((assignment) => (
                            <TableRow key={assignment.id}>
                              <TableCell>{assignment.courseName}</TableCell>
                              <TableCell>{assignment.title}</TableCell>
                              <TableCell>
                                {formatDueDate(assignment.dueDate)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={assignment.status}
                                  color={assignment.color}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{getGradeLabel(assignment.grade)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography color="text.secondary">No assignments found for the current courses.</Typography>
                  )}
                </CardContent>
              </Card>

              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Quiz Progress
                  </Typography>
                  {progressData.quizzes.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead sx={{ bgcolor: "background.default" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Course</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Quiz</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Submitted</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {progressData.quizzes.map((quiz) => (
                            <TableRow key={quiz.id}>
                              <TableCell>{quiz.courseName}</TableCell>
                              <TableCell>{quiz.title}</TableCell>
                              <TableCell>
                                {quiz.submittedAt ? formatDueDate(quiz.submittedAt) : "-"}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={quiz.status}
                                  color={quiz.color}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{getGradeLabel(quiz.grade)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography color="text.secondary">
                      No quiz attempts found for the current courses.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default ParentStudentProgressPage;
