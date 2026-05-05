import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { fetchInstructorStudentRoster } from "../services";

const getStudentProfile = (student) =>
  Array.isArray(student.student_profiles)
    ? student.student_profiles[0]
    : student.student_profiles;

const StaffStudentRosterPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [totalCourses, setTotalCourses] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadRoster = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const result = await fetchInstructorStudentRoster(user?.id);

        if (mounted) {
          setDepartments(result.departments);
          setStudents(result.students);
          setTotalCourses(result.courseOfferings.length);
        }
      } catch (error) {
        if (mounted) {
          setDepartments([]);
          setStudents([]);
          setTotalCourses(0);
          setErrorMessage(error.message || "Unable to load student roster.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadRoster();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return students.filter((student) => {
      const studentProfile = getStudentProfile(student);
      const matchesDepartment =
        !departmentId || student.department_id === departmentId;
      const matchesSearch =
        !query ||
        (student.full_name || "").toLowerCase().includes(query) ||
        (studentProfile?.student_number || "").toLowerCase().includes(query);

      return matchesDepartment && matchesSearch;
    });
  }, [departmentId, searchQuery, students]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleClear = () => {
    setDepartmentId("");
    setSearchInput("");
    setSearchQuery("");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box>
            <Typography component="h1" fontWeight={900} variant="h4">
              Student Roster
            </Typography>
            <Typography color="text.secondary">
              View students registered in your assigned course offerings.
            </Typography>
          </Box>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack
                component="form"
                direction={{ xs: "column", md: "row" }}
                onSubmit={handleSearch}
                spacing={2}
              >
                <TextField
                  fullWidth
                  label="Search by student name or ID"
                  onChange={(event) => setSearchInput(event.target.value)}
                  value={searchInput}
                />
                <TextField
                  label="Department"
                  onChange={(event) => setDepartmentId(event.target.value)}
                  select
                  sx={{ minWidth: { xs: "100%", md: 260 } }}
                  value={departmentId}
                >
                  <MenuItem value="">All departments</MenuItem>
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name} ({department.code})
                    </MenuItem>
                  ))}
                </TextField>
                <Stack direction="row" spacing={1.5}>
                  <Button
                    startIcon={<PersonSearchOutlinedIcon />}
                    type="submit"
                    variant="contained"
                  >
                    Search
                  </Button>
                  <Button onClick={handleClear} variant="outlined">
                    Clear
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <Stack
            alignItems={{ xs: "flex-start", sm: "center" }}
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Typography color="text.secondary" variant="body2">
              {loading
                ? "Loading registered students..."
                : `${filteredStudents.length} of ${students.length} students shown`}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {totalCourses} assigned course offerings
            </Typography>
          </Stack>

          {loading ? (
            <Stack alignItems="center" sx={{ py: 8 }}>
              <CircularProgress />
            </Stack>
          ) : students.length === 0 ? (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography fontWeight={700}>No registered students found.</Typography>
                <Typography color="text.secondary" variant="body2">
                  Students will appear here after they register for your assigned
                  course offerings.
                </Typography>
              </CardContent>
            </Card>
          ) : filteredStudents.length === 0 ? (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography fontWeight={700}>No students match these filters.</Typography>
                <Typography color="text.secondary" variant="body2">
                  Try a different name, student ID, or department.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2.5}>
              {filteredStudents.map((student) => {
                const studentProfile = getStudentProfile(student);
                const department = student.departments;

                return (
                  <Grid item key={student.id} xs={12} md={6}>
                    <Card sx={{ height: "100%" }}>
                      <CardContent sx={{ p: 3 }}>
                        <Stack spacing={2}>
                          <Stack
                            alignItems="flex-start"
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            spacing={1.5}
                          >
                            <Box>
                              <Typography fontWeight={900} variant="h6">
                                {student.full_name || "Unnamed student"}
                              </Typography>
                              <Typography color="text.secondary" variant="body2">
                                {studentProfile?.student_number || "Student ID unavailable"}
                              </Typography>
                            </Box>
                            {department ? (
                              <Chip
                                color="secondary"
                                label={`${department.name} (${department.code})`}
                                size="small"
                                variant="outlined"
                              />
                            ) : null}
                          </Stack>

                          <Stack spacing={1}>
                            <Stack alignItems="center" direction="row" spacing={1}>
                              <EmailOutlinedIcon color="primary" fontSize="small" />
                              <Typography variant="body2">
                                {student.email || "Email unavailable"}
                              </Typography>
                            </Stack>
                            <Stack alignItems="center" direction="row" spacing={1}>
                              <BadgeOutlinedIcon color="primary" fontSize="small" />
                              <Typography variant="body2">
                                Level: {studentProfile?.level || "Not listed"}
                              </Typography>
                            </Stack>
                            <Stack alignItems="center" direction="row" spacing={1}>
                              <SchoolOutlinedIcon color="primary" fontSize="small" />
                              <Typography variant="body2">
                                Status: {studentProfile?.status || "Not listed"}
                              </Typography>
                            </Stack>
                          </Stack>

                          <Stack spacing={1}>
                            <Stack alignItems="center" direction="row" spacing={1}>
                              <MenuBookOutlinedIcon color="primary" fontSize="small" />
                              <Typography fontWeight={800} variant="body2">
                                Registered courses
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                              {student.enrolledCourses.map((course) => (
                                <Chip
                                  key={course.id}
                                  label={course.label}
                                  size="small"
                                  sx={{ borderRadius: 1 }}
                                />
                              ))}
                            </Stack>
                          </Stack>

                          <Stack alignItems="flex-start">
                            <Button
                              onClick={() =>
                                navigate(`/student-staff/messages?studentId=${student.id}`)
                              }
                              startIcon={<MessageOutlinedIcon />}
                              variant="outlined"
                            >
                              Message
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default StaffStudentRosterPage;
