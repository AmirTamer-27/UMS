import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  MenuItem,
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

import { supabase } from "../../../lib/supabaseClient";

export default function StudentRecordsPage() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    student_number: "",
    department_id: "",
    level: "",
    status: "active",
  });

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, role, department_id, departments(name, code), student_profiles(student_number, level, status)",
      )
      .eq("role", "student")
      .order("full_name");

    if (error) setErrorMessage(error.message);
    else setStudents(data || []);
  };

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from("departments")
      .select("id, name, code")
      .order("name");

    if (error) setErrorMessage(error.message);
    else setDepartments(data || []);
  };

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return students;

    return students.filter((student) => {
      const studentNumber = student.student_profiles?.student_number || "";
      const fullName = student.full_name || "";

      return (
        studentNumber.toLowerCase().includes(query) ||
        fullName.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, students]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      full_name: "",
      email: "",
      password: "",
      student_number: "",
      department_id: "",
      level: "",
      status: "active",
    });
  };

  const validateForm = () => {
    const missingFields = [];

    if (!form.full_name.trim()) missingFields.push("name");
    if (!form.student_number.trim()) missingFields.push("student ID");
    if (!form.department_id) missingFields.push("department");
    if (!form.email.trim()) missingFields.push("email");
    if (!form.password.trim()) missingFields.push("password");

    if (missingFields.length) {
      setErrorMessage(`Required fields missing: ${missingFields.join(", ")}.`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");

    try {
      if (!validateForm()) {
        return;
      }

      setSaving(true);

      const { data, error } = await supabase.functions.invoke("create-student", {
        body: {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          student_number: form.student_number.trim(),
          department_id: form.department_id,
          level: form.level.trim(),
          status: form.status.trim(),
        },
      });

      if (error) {
        if (
          error.name === "FunctionsFetchError" ||
          error.message?.includes("Failed to send a request")
        ) {
          setErrorMessage(
            'Could not reach the "create-student" Edge Function. Deploy it to Supabase and verify the project URL/keys.',
          );
          return;
        }

        if (error.name === "FunctionsHttpError" && error.context) {
          try {
            const errorBody = await error.context.json();

            if (errorBody?.error) {
              setErrorMessage(errorBody.error);
              return;
            }
          } catch {
            setErrorMessage(error.message);
            return;
          }
        }

        setErrorMessage(error.message);
        return;
      }

      setMessage(data?.message || "Student record saved successfully.");
      resetForm();
      setSelectedStudent(null);
      fetchStudents();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Student Records
            </Typography>
            <Typography color="text.secondary">
              Create, search, and view detailed student profiles.
            </Typography>
          </Box>

          {message && <Alert severity="success">{message}</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Create Student
            </Typography>

            <Stack component="form" spacing={2} onSubmit={handleSubmit}>
              <TextField label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required />
              <TextField label="Email" name="email" value={form.email} onChange={handleChange} required />
              <TextField
                autoComplete="new-password"
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                type="password"
              />
              <TextField label="Student Number" name="student_number" value={form.student_number} onChange={handleChange} required />
              <TextField
                select
                label="Department"
                name="department_id"
                value={form.department_id}
                onChange={handleChange}
                required
              >
                {departments.map((department) => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.name} ({department.code})
                  </MenuItem>
                ))}
              </TextField>
              <TextField label="Level" name="level" value={form.level} onChange={handleChange} />
              <TextField label="Status" name="status" value={form.status} onChange={handleChange} />

              <Stack direction="row" spacing={2}>
                <Button disabled={saving} type="submit" variant="contained">
                  Create Student
                </Button>
                <Button disabled={saving} variant="outlined" onClick={resetForm}>
                  Clear
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Student Directory
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Search by student ID or name, then open a detailed profile.
                </Typography>
              </Box>

              <TextField
                label="Search by ID or name"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </Stack>
          </Paper>

          <Paper sx={{ overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>No student records found.</TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.student_profiles?.student_number || "-"}</TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        {student.departments?.name || "-"}
                        {student.departments?.code ? ` (${student.departments.code})` : ""}
                      </TableCell>
                      <TableCell>{student.student_profiles?.level || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={student.student_profiles?.status || "active"}
                          size="small"
                          color="success"
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined" onClick={() => setSelectedStudent(student)}>
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>

          {selectedStudent ? (
            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Student Profile
                    </Typography>
                    <Typography color="text.secondary">
                      {selectedStudent.full_name}
                    </Typography>
                  </Box>
                  <Button variant="outlined" onClick={() => setSelectedStudent(null)}>
                    Close
                  </Button>
                </Stack>

                <Divider />

                <Stack spacing={1}>
                  <Typography><strong>Student ID:</strong> {selectedStudent.student_profiles?.student_number || "-"}</Typography>
                  <Typography><strong>Name:</strong> {selectedStudent.full_name || "-"}</Typography>
                  <Typography><strong>Email:</strong> {selectedStudent.email || "-"}</Typography>
                  <Typography>
                    <strong>Department:</strong> {selectedStudent.departments?.name || "-"}
                    {selectedStudent.departments?.code ? ` (${selectedStudent.departments.code})` : ""}
                  </Typography>
                  <Typography><strong>Level:</strong> {selectedStudent.student_profiles?.level || "-"}</Typography>
                  <Typography><strong>Status:</strong> {selectedStudent.student_profiles?.status || "-"}</Typography>
                  <Typography><strong>Profile ID:</strong> {selectedStudent.id}</Typography>
                </Stack>
              </Stack>
            </Paper>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
