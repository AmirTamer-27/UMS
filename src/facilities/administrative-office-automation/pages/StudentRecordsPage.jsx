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

import { supabase } from "../../../lib/supabaseClient";

export default function StudentRecordsPage() {
  const [students, setStudents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    student_number: "",
    level: "",
    status: "active",
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, student_profiles(student_number, level, status)")
      .eq("role", "student")
      .order("full_name");

    if (error) setErrorMessage(error.message);
    else setStudents(data || []);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      full_name: "",
      email: "",
      student_number: "",
      level: "",
      status: "active",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (editingId) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          email: form.email,
          role: "student",
        })
        .eq("id", editingId);

      if (profileError) {
        setErrorMessage(profileError.message);
        return;
      }

      const { error: studentError } = await supabase
        .from("student_profiles")
        .update({
          student_number: form.student_number,
          level: form.level,
          status: form.status,
        })
        .eq("user_id", editingId);

      if (studentError) {
        setErrorMessage(studentError.message);
        return;
      }

      setMessage("Student record updated successfully.");
    } else {
      const newId = crypto.randomUUID();

      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: newId,
          full_name: form.full_name,
          email: form.email,
          role: "student",
        },
      ]);

      if (profileError) {
        setErrorMessage(profileError.message);
        return;
      }

      const { error: studentError } = await supabase.from("student_profiles").insert([
        {
          user_id: newId,
          student_number: form.student_number,
          level: form.level,
          status: form.status,
        },
      ]);

      if (studentError) {
        setErrorMessage(studentError.message);
        return;
      }

      setMessage("Student record created successfully.");
    }

    resetForm();
    fetchStudents();
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setForm({
      full_name: student.full_name || "",
      email: student.email || "",
      student_number: student.student_profiles?.student_number || "",
      level: student.student_profiles?.level || "",
      status: student.student_profiles?.status || "active",
    });
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
              Create, view, and update student records.
            </Typography>
          </Box>

          {message && <Alert severity="success">{message}</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              {editingId ? "Update Student" : "Create Student"}
            </Typography>

            <Stack component="form" spacing={2} onSubmit={handleSubmit}>
              <TextField label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required />
              <TextField label="Email" name="email" value={form.email} onChange={handleChange} required />
              <TextField label="Student Number" name="student_number" value={form.student_number} onChange={handleChange} required />
              <TextField label="Level" name="level" value={form.level} onChange={handleChange} />
              <TextField label="Status" name="status" value={form.status} onChange={handleChange} />

              <Stack direction="row" spacing={2}>
                <Button type="submit" variant="contained">
                  {editingId ? "Update Student" : "Create Student"}
                </Button>

                {editingId && (
                  <Button variant="outlined" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Student Number</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>No student records found.</TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.student_profiles?.student_number || "-"}</TableCell>
                      <TableCell>{student.student_profiles?.level || "-"}</TableCell>
                      <TableCell>{student.student_profiles?.status || "-"}</TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined" onClick={() => handleEdit(student)}>
                          Edit
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
    </Box>
  );
}